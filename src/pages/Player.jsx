import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const STEPS = { ENTER_KEY: 'enter_key', VALIDATED: 'validated', PLAYING: 'playing', DONE: 'done' };

// Decrypt .jcfilm using Web Crypto API (AES-256-GCM)
// File format: nonce(12 bytes) + ciphertext
async function decryptJCFilm(arrayBuffer, keyHex) {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const nonce = arrayBuffer.slice(0, 12);
  const ciphertext = arrayBuffer.slice(12);
  return await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, cryptoKey, ciphertext);
}

export default function Player() {
  const { keyToken: keyFromUrl } = useParams();
  const [step, setStep] = useState(STEPS.ENTER_KEY);
  const [keyToken, setKeyToken] = useState(keyFromUrl || '');
  const [filmInfo, setFilmInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [localFile, setLocalFile] = useState(null);   // picked .jcfilm file
  const [decrypting, setDecrypting] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (keyFromUrl) handleValidate(null, keyFromUrl);
  }, []);

  // Clean up blob URL on unmount
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
      setKeyToken(token);
      setFilmInfo(res.data);
      setStep(STEPS.VALIDATED);
    } catch (err) {
      setError(err.response?.data?.detail || 'Validation failed');
    }
    setLoading(false);
  };

  const handleStartScreening = async () => {
    if (!localFile) { setError('Please load the downloaded .jcfilm file first'); return; }
    setError(''); setLoading(true);
    try {
      const storedResumeToken = localStorage.getItem(`rt_${keyToken}`);
      const res = await axios.post(`${API}/screening/activate`, {
        key_token: keyToken,
        machine_fingerprint: navigator.userAgent,
        player_version: 'web-1.0',
        resume_token: storedResumeToken || undefined,
      });
      if (!res.data.success) { setError(res.data.message || 'Activation failed'); setLoading(false); return; }
      if (res.data.resume_token) localStorage.setItem(`rt_${keyToken}`, res.data.resume_token);
      setSessionId(res.data.session_id);

      // Decrypt locally using Web Crypto
      setDecrypting(true);
      const arrayBuffer = await localFile.arrayBuffer();
      const decrypted = await decryptJCFilm(arrayBuffer, res.data.decryption_key);
      const blob = new Blob([decrypted], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setDecrypting(false);
      setStep(STEPS.PLAYING);
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
    setStep(STEPS.DONE);
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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.brand}>🎬 Janta Cinema</span>
        <span style={styles.powered}>Secure Venue Screening</span>
      </div>

      <div style={styles.body}>

        {/* STEP 1: Enter Key */}
        {step === STEPS.ENTER_KEY && (
          <div style={styles.card}>
            <div style={styles.icon}>🔑</div>
            <h2 style={styles.title}>Enter Your Screening Key</h2>
            <p style={styles.subtitle}>Enter the key shared by your aggregator to unlock your screening</p>
            <form onSubmit={handleValidate}>
              <input
                style={styles.keyInput}
                value={keyToken}
                onChange={e => setKeyToken(e.target.value.toUpperCase())}
                placeholder="JC-20260524-XXXXXX"
                required autoFocus
              />
              {error && <div style={styles.error}>{error}</div>}
              <button type="submit" disabled={loading} style={styles.primaryBtn}>
                {loading ? 'Validating...' : 'Validate Key →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Validated */}
        {step === STEPS.VALIDATED && (
          <div style={styles.card}>
            {filmInfo.poster_url && (
              <img src={filmInfo.poster_url} alt="poster" style={styles.poster}
                onError={e => e.target.style.display = 'none'} />
            )}
            <div style={styles.validBadge}>✅ Key Verified</div>
            <h2 style={styles.title}>{filmInfo.film_title}</h2>
            <div style={styles.meta}>
              <span>⏱ {Math.floor(filmInfo.duration_minutes)} min</span>
              <span style={styles.sep}>·</span>
              <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{keyToken}</span>
            </div>
            {filmInfo.valid_from && (
              <p style={styles.window}>🕐 Valid until {new Date(filmInfo.valid_to).toLocaleString()}</p>
            )}

            {/* Download section */}
            <div style={styles.downloadBox}>
              <p style={styles.downloadLabel}>Step 1 — Download the encrypted film file</p>
              <a
                href={filmInfo.download_url}
                download
                style={styles.downloadBtn}
              >
                ⬇ Download Film (.jcfilm)
              </a>
              <p style={styles.downloadHint}>Save this file on your laptop before screening day</p>
            </div>

            {/* Load file section */}
            <div style={styles.downloadBox}>
              <p style={styles.downloadLabel}>Step 2 — Load the downloaded file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jcfilm"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) setLocalFile(e.target.files[0]); }}
              />
              <button onClick={() => fileInputRef.current.click()} style={styles.loadBtn}>
                📂 {localFile ? `✓ ${localFile.name}` : 'Select .jcfilm File'}
              </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              onClick={handleStartScreening}
              disabled={loading || decrypting || !localFile}
              style={{ ...styles.primaryBtn, opacity: !localFile ? 0.5 : 1 }}
            >
              {decrypting ? '🔓 Decrypting...' : loading ? 'Starting...' : '▶  Start Screening'}
            </button>
            <button onClick={() => { setStep(STEPS.ENTER_KEY); setError(''); setLocalFile(null); }} style={styles.ghostBtn}>
              ← Use Different Key
            </button>
          </div>
        )}

        {/* STEP 3: Playing */}
        {step === STEPS.PLAYING && (
          <div style={styles.playerWrap}>
            <div style={styles.playerHeader}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1rem' }}>
                🎬 {filmInfo.film_title}
              </span>
              <button
                onClick={() => handleComplete(Math.round((videoRef.current?.currentTime / videoRef.current?.duration) * 100) || 0)}
                style={styles.stopBtn}
              >
                ⏹ End Screening
              </button>
            </div>
            <video ref={videoRef} controls style={styles.video} />
            <p style={styles.watermark}>🔒 {keyToken} · {new Date().toLocaleString()}</p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === STEPS.DONE && (
          <div style={styles.card}>
            <div style={styles.icon}>🎉</div>
            <h2 style={styles.title}>Screening Complete!</h2>
            <p style={styles.subtitle}>
              "{filmInfo?.film_title}" has been marked as screened.<br />
              This key is now consumed and cannot be reused.
            </p>
            <button onClick={() => { setStep(STEPS.ENTER_KEY); setKeyToken(''); setFilmInfo(null); setSessionId(null); setLocalFile(null); }} style={styles.primaryBtn}>
              Start New Screening
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #1e293b', background: '#1e293b' },
  brand: { color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' },
  powered: { color: '#475569', fontSize: '0.8rem' },
  body: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
  card: { background: '#1e293b', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '480px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' },
  icon: { fontSize: '3rem', marginBottom: '0.75rem' },
  title: { color: '#f1f5f9', fontSize: '1.6rem', margin: '0 0 0.5rem' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' },
  keyInput: { width: '100%', padding: '1rem', borderRadius: '8px', border: '2px solid #f59e0b', background: '#0f172a', color: '#f59e0b', fontSize: '1.3rem', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.1em', marginBottom: '1rem', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '0.9rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' },
  ghostBtn: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.9rem' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' },
  validBadge: { display: 'inline-block', background: '#064e3b', color: '#10b981', padding: '0.3rem 0.9rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.75rem' },
  poster: { width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' },
  meta: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' },
  sep: { margin: '0 0.5rem' },
  window: { color: '#64748b', fontSize: '0.78rem', marginBottom: '1rem' },
  downloadBox: { background: '#0f172a', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', textAlign: 'left' },
  downloadLabel: { color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
  downloadBtn: { display: 'block', width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1d4ed8', color: 'white', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxSizing: 'border-box' },
  downloadHint: { color: '#475569', fontSize: '0.72rem', marginTop: '0.4rem' },
  loadBtn: { width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'center' },
  playerWrap: { width: '100%', maxWidth: '960px' },
  playerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem 1.25rem', borderRadius: '8px 8px 0 0' },
  video: { width: '100%', background: '#000', display: 'block', maxHeight: '75vh' },
  stopBtn: { padding: '0.45rem 1.1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  watermark: { color: '#1e3a5f', fontSize: '0.7rem', textAlign: 'center', marginTop: '0.4rem' },
};
