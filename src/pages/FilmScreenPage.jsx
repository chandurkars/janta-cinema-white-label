import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function decryptCVFilm(arrayBuffer, keyHex) {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const nonce = arrayBuffer.slice(0, 12);
  const ciphertext = arrayBuffer.slice(12);
  return await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, cryptoKey, ciphertext);
}

export default function FilmScreenPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState('enter_key'); // enter_key | load_file | playing | done
  const [keyToken, setKeyToken] = useState(searchParams.get('key') || '');
  const [filmInfo, setFilmInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const urlKey = searchParams.get('key');
    if (urlKey) handleValidate(null, urlKey);
  }, []);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const handleValidate = async (e, tokenOverride) => {
    if (e) e.preventDefault();
    const token = (tokenOverride || keyToken).trim().toUpperCase();
    if (!token) return;
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/screening/validate`, { key_token: token });
      if (!res.data.valid) { setError(res.data.message || 'Invalid key'); setLoading(false); return; }
      if (res.data.key_type && res.data.key_type !== 'streaming' && res.data.key_type !== 'standard') {
        setError('This is a Download Key, not a Screening Key. Please use your Screening Key (CV-SC-…) here.');
        setLoading(false); return;
      }
      setKeyToken(token);
      setFilmInfo(res.data);
      setStep('load_file');
    } catch (err) {
      setError(err.response?.data?.detail || 'Validation failed');
    }
    setLoading(false);
  };

  const handleStartScreening = async () => {
    if (!localFile) { setError('Please select your downloaded .cvfilm file first'); return; }
    setError(''); setLoading(true);
    try {
      // Read file bytes upfront — needed for both hash check and decryption
      const arrayBuffer = await localFile.arrayBuffer();

      const storedResumeToken = localStorage.getItem(`rt_${keyToken}`);
      const res = await axios.post(`${API}/screening/activate`, {
        key_token: keyToken,
        machine_fingerprint: navigator.userAgent,
        player_version: 'web-1.0',
        resume_token: storedResumeToken || undefined,
      });
      if (!res.data.success) { setError(res.data.message || 'Activation failed'); setLoading(false); return; }
      if (res.data.resume_token) localStorage.setItem(`rt_${keyToken}`, res.data.resume_token);

      // ── File integrity check ─────────────────────────────────────────
      // Verify the selected file matches the film tied to this screening key.
      // film_file_hash is the SHA-256 of the encrypted .cvfilm bytes stored in DB.
      if (res.data.film_file_hash) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        if (hashHex !== res.data.film_file_hash) {
          setError(
            '⚠️ Wrong film file selected. The file you chose does not match this Screening Key. ' +
            'Please select the correct .cvfilm file that was downloaded for this show.'
          );
          // Reset file picker so user can immediately choose the correct file
          setLocalFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setLoading(false);
          return;
        }
      }
      // ────────────────────────────────────────────────────────────────

      setSessionId(res.data.session_id);

      setDecrypting(true);
      const decrypted = await decryptCVFilm(arrayBuffer, res.data.decryption_key);
      const blob = new Blob([decrypted], { type: 'video/mp4' });
      setBlobUrl(URL.createObjectURL(blob));
      setDecrypting(false);
      setStep('playing');
    } catch (err) {
      setDecrypting(false);
      setError(err.response?.data?.detail || err.message || 'Failed to start screening');
    }
    setLoading(false);
  };

  const handleComplete = async (pct = 100) => {
    if (!sessionId) return;
    try { await axios.post(`${API}/screening/complete`, { session_id: sessionId, completion_percentage: pct }); } catch (_) {}
    localStorage.removeItem(`rt_${keyToken}`);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setStep('done');
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !blobUrl) return;
    v.src = blobUrl;
    v.play().catch(() => {});
    const onEnd = () => handleComplete(100);
    v.addEventListener('ended', onEnd);
    return () => v.removeEventListener('ended', onEnd);
  }, [blobUrl]);

  // ── Screen protection (browser-level) ──────────────────────────────
  useEffect(() => {
    if (step !== 'playing') return;

    // Block PrintScreen / common OS screenshot shortcuts at browser level
    const onKey = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['s', 'S'].includes(e.key)) || // Windows Snipping Tool
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))  // macOS screenshot
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Pause when window loses focus (alt-tab, app switch)
    const onBlur = () => { videoRef.current?.pause(); };
    const onFocus = () => { videoRef.current?.play().catch(() => {}); };
    const onVisibility = () => { if (document.hidden) videoRef.current?.pause(); };

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [step]);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🎬</span>
          <span style={s.brandName}>CineVault</span>
        </div>
        <span style={s.headerTag}>▶ Secure Screening</span>
      </div>

      <div style={s.body}>

        {/* ENTER KEY */}
        {step === 'enter_key' && (
          <div style={s.card}>
            <div style={s.iconWrap}><div style={s.icon}>🔑</div></div>
            <h2 style={s.title}>Start Your Screening</h2>
            <p style={s.subtitle}>
              Enter the <strong style={{ color: '#f59e0b' }}>Screening Key</strong> (CV-SC-…) shared by the filmmaker to begin.
            </p>
            <form onSubmit={handleValidate}>
              <input
                style={s.keyInput}
                value={keyToken}
                onChange={e => setKeyToken(e.target.value.toUpperCase())}
                placeholder="CV-SC-20260528-XXXXXX"
                required autoFocus
              />
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" disabled={loading} style={s.primaryBtn}>
                {loading ? 'Verifying…' : 'Verify Key →'}
              </button>
            </form>
            <div style={s.hint}>
              <strong style={{ color: '#f59e0b' }}>💡 Don't have your Screening Key yet?</strong><br />
              The filmmaker will share your Screening Key (CV-SC-…) on the day of the show. Contact them if you haven't received it.
            </div>
          </div>
        )}

        {/* SELECT FILE + START */}
        {step === 'load_file' && filmInfo && (
          <div style={s.card}>
            {filmInfo.poster_url && (
              <img src={filmInfo.poster_url} alt="poster" style={s.poster}
                onError={e => (e.target.style.display = 'none')} />
            )}
            <div style={s.validBadge}>✅ Screening Key Verified</div>
            <h2 style={s.title}>{filmInfo.film_title}</h2>

            <div style={s.metaRow}>
              {filmInfo.language && <span style={s.metaChip}>{filmInfo.language}</span>}
              {filmInfo.duration_minutes && (
                <span style={s.metaChip}>⏱ {Math.floor(filmInfo.duration_minutes)} min</span>
              )}
            </div>

            {filmInfo.valid_to && (
              <p style={s.window}>
                🕐 Key valid until <strong style={{ color: '#f1f5f9' }}>{new Date(filmInfo.valid_to).toLocaleString()}</strong>
              </p>
            )}

            {/* File picker */}
            <div style={s.fileBox}>
              <div style={s.fileBoxLabel}>Select your downloaded .cvfilm file</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".cvfilm,.jcfilm"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) { setLocalFile(e.target.files[0]); setError(''); } }}
              />
              <button onClick={() => fileInputRef.current.click()} style={s.filePickBtn}>
                {localFile
                  ? <><span style={{ color: '#10b981' }}>✓</span> {localFile.name}</>
                  : '📂 Choose File…'}
              </button>
              {!localFile && (
                <p style={s.fileHint}>
                  This is the .cvfilm file you downloaded earlier using your Download Key.
                  If you haven't downloaded it yet, open the download link first.
                </p>
              )}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button
              onClick={handleStartScreening}
              disabled={loading || decrypting || !localFile}
              style={{ ...s.primaryBtn, opacity: !localFile ? 0.4 : 1, marginTop: '0.5rem' }}
            >
              {decrypting ? '🔓 Decrypting film…' : loading ? 'Starting…' : '▶ Start Screening'}
            </button>
            {decrypting && (
              <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                Decrypting in memory — this may take a moment for large files…
              </p>
            )}

            <button
              onClick={() => { setStep('enter_key'); setError(''); setLocalFile(null); setFilmInfo(null); }}
              style={s.ghostBtn}
            >
              ← Use a Different Key
            </button>
          </div>
        )}

        {/* PLAYING */}
        {step === 'playing' && (
          <div style={s.playerWrap}>
            <div style={s.playerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={s.liveDot} />
                <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1rem' }}>
                  {filmInfo?.film_title}
                </span>
              </div>
              <button
                onClick={() =>
                  handleComplete(
                    Math.round(((videoRef.current?.currentTime || 0) / (videoRef.current?.duration || 1)) * 100),
                  )
                }
                style={s.stopBtn}
              >
                ⏹ End Screening
              </button>
            </div>
            {/* Anti-capture overlay — scanline pattern degrades screen-recorder quality */}
            <div style={s.videoWrap}>
              <video
                ref={videoRef}
                controls
                style={s.video}
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={e => e.preventDefault()}
              />
              <div style={s.captureOverlay} />
            </div>
            <div style={s.playerFooter}>
              <span style={s.watermark}>🔒 {keyToken}</span>
              <span style={s.watermark}>{new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={s.card}>
            <div style={s.iconWrap}>
              <div style={{ ...s.icon, background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', fontSize: '2rem' }}>🎉</div>
            </div>
            <h2 style={s.title}>Screening Complete!</h2>
            <p style={s.subtitle}>
              <strong style={{ color: '#f59e0b' }}>"{filmInfo?.film_title}"</strong> has been marked as screened.
              This Screening Key is now used and cannot be reused.
            </p>
            <div style={{ ...s.hint, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', color: '#94a3b8' }}>
              🙏 Thank you for a secure screening. For another show, contact the filmmaker for a new Screening Key.
            </div>
            <button
              onClick={() => { setStep('enter_key'); setKeyToken(''); setFilmInfo(null); setSessionId(null); setLocalFile(null); }}
              style={{ ...s.ghostBtn, marginTop: '1.5rem' }}
            >
              ← Start Another Screening
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #1e293b',
    background: 'rgba(15,23,42,0.8)',
    backdropFilter: 'blur(10px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  brandIcon: { fontSize: '1.4rem' },
  brandName: { color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' },
  headerTag: {
    color: '#f59e0b', fontSize: '0.8rem', fontWeight: 'bold',
    background: 'rgba(245,158,11,0.1)', padding: '0.3rem 0.8rem',
    borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)',
  },
  body: {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem',
  },
  card: {
    background: '#1e293b', borderRadius: '20px', padding: '2.5rem',
    width: '100%', maxWidth: '500px', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid #334155',
  },
  iconWrap: { marginBottom: '1rem' },
  icon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)',
    fontSize: '1.8rem',
  },
  title: { color: '#f1f5f9', fontSize: '1.5rem', margin: '0 0 0.5rem', fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' },
  keyInput: {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '2px solid #f59e0b', background: '#0f172a',
    color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'monospace',
    textAlign: 'center', letterSpacing: '0.08em',
    marginBottom: '1rem', boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%', padding: '0.9rem', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0f172a', fontWeight: 'bold', fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
  },
  ghostBtn: {
    width: '100%', padding: '0.7rem', borderRadius: '8px',
    border: '1px solid #334155', background: 'transparent',
    color: '#94a3b8', cursor: 'pointer', marginTop: '0.75rem', fontSize: '0.9rem',
  },
  error: {
    background: '#7f1d1d', color: '#fca5a5',
    padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem',
  },
  hint: {
    marginTop: '1.25rem', padding: '0.75rem 1rem',
    background: 'rgba(245,158,11,0.08)', borderRadius: '8px',
    border: '1px solid rgba(245,158,11,0.2)',
    color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.6', textAlign: 'left',
  },
  poster: {
    width: '100%', maxHeight: '180px', objectFit: 'cover',
    borderRadius: '12px', marginBottom: '1rem',
  },
  validBadge: {
    display: 'inline-block', background: '#064e3b', color: '#10b981',
    padding: '0.3rem 1rem', borderRadius: '12px',
    fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.75rem',
  },
  metaRow: {
    display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
    gap: '0.5rem', marginBottom: '0.75rem',
  },
  metaChip: {
    background: '#0f172a', color: '#94a3b8',
    padding: '0.25rem 0.75rem', borderRadius: '12px',
    fontSize: '0.8rem', border: '1px solid #334155',
  },
  window: { color: '#64748b', fontSize: '0.8rem', marginBottom: '1.25rem' },
  fileBox: {
    background: '#0f172a', borderRadius: '12px',
    padding: '1.25rem', marginBottom: '0.75rem',
    textAlign: 'left', border: '1px solid #334155',
  },
  fileBoxLabel: {
    color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem',
  },
  filePickBtn: {
    width: '100%', padding: '0.7rem', borderRadius: '8px',
    border: '1px solid #334155', background: '#1e293b',
    color: '#e2e8f0', cursor: 'pointer', fontSize: '0.9rem',
    textAlign: 'center',
  },
  fileHint: { color: '#475569', fontSize: '0.75rem', marginTop: '0.6rem', lineHeight: '1.5' },
  playerWrap: { width: '100%', maxWidth: '1000px' },
  playerHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1e293b', padding: '0.85rem 1.5rem', borderRadius: '12px 12px 0 0',
    border: '1px solid #334155', borderBottom: 'none',
  },
  liveDot: {
    width: '10px', height: '10px', borderRadius: '50%',
    background: '#ef4444', boxShadow: '0 0 8px #ef4444',
  },
  stopBtn: {
    padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
    background: '#ef4444', color: 'white', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '0.9rem',
  },
  videoWrap: { position: 'relative' },
  video: { width: '100%', background: '#000', display: 'block', maxHeight: '76vh' },
  captureOverlay: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
    mixBlendMode: 'overlay',
    zIndex: 2,
  },
  playerFooter: {
    display: 'flex', justifyContent: 'space-between',
    background: '#1e293b', padding: '0.5rem 1.5rem',
    borderRadius: '0 0 12px 12px', border: '1px solid #334155', borderTop: 'none',
  },
  watermark: { color: '#334155', fontSize: '0.7rem', fontFamily: 'monospace' },
};
