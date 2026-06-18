import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function FilmDownloadPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState('enter_key'); // enter_key | started
  const [keyToken, setKeyToken] = useState(searchParams.get('key') || '');
  const [filmInfo, setFilmInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dlRef = useRef(null);

  // Auto-validate if key is in URL
  useEffect(() => {
    const urlKey = searchParams.get('key');
    if (urlKey) handleValidate(null, urlKey);
  }, []);

  const triggerDownload = (url) => {
    // Programmatically click a hidden anchor so the browser starts the download
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleValidate = async (e, tokenOverride) => {
    if (e) e.preventDefault();
    const token = (tokenOverride || keyToken).trim().toUpperCase();
    if (!token) return;
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/screening/validate`, { key_token: token });
      if (!res.data.valid) {
        setError(res.data.message || 'Invalid key');
        setLoading(false); return;
      }
      if (res.data.key_type && res.data.key_type !== 'download' && res.data.key_type !== 'standard') {
        setError('This is not a Download Key. Please use your Download Key (CV-DL-…) here.');
        setLoading(false); return;
      }
      setKeyToken(token);
      setFilmInfo(res.data);
      // Trigger download immediately
      if (res.data.download_url) triggerDownload(res.data.download_url);
      setStep('started');
    } catch (err) {
      setError(err.response?.data?.detail || 'Validation failed');
    }
    setLoading(false);
  };

  const handleDownloadAgain = () => {
    if (filmInfo?.download_url) triggerDownload(filmInfo.download_url);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🎬</span>
          <span style={s.brandName}>CineVault</span>
        </div>
        <span style={s.headerTag}>⬇ Film Download</span>
      </div>

      <div style={s.body}>

        {/* Enter key */}
        {step === 'enter_key' && (
          <div style={s.card}>
            <div style={s.iconWrap}>
              <div style={s.icon}>⬇</div>
            </div>
            <h2 style={s.title}>Download Your Film</h2>
            <p style={s.subtitle}>
              Enter the <strong style={{ color: '#3b82f6' }}>Download Key</strong> you received to start the film download.
            </p>
            <form onSubmit={handleValidate}>
              <input
                style={s.keyInput}
                value={keyToken}
                onChange={e => setKeyToken(e.target.value.toUpperCase())}
                placeholder="CV-DL-20260528-XXXXXX"
                required
                autoFocus
              />
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" disabled={loading} style={s.primaryBtn}>
                {loading ? 'Verifying…' : 'Download Film →'}
              </button>
            </form>
            <div style={s.hint}>
              <span style={{ color: '#3b82f6' }}>💡</span>{' '}
              Your Download Key (CV-DL-…) was shared by the filmmaker. You'll receive a separate Screening Key on the day of the show.
            </div>
          </div>
        )}

        {/* Download started */}
        {step === 'started' && filmInfo && (
          <div style={s.card}>
            {filmInfo.poster_url && (
              <img src={filmInfo.poster_url} alt="poster" style={s.poster}
                onError={e => (e.target.style.display = 'none')} />
            )}

            <div style={s.successBadge}>⬇ Download Started</div>
            <h2 style={s.title}>{filmInfo.film_title}</h2>

            <div style={s.metaRow}>
              {filmInfo.language && <span style={s.metaChip}>{filmInfo.language}</span>}
              {filmInfo.duration_minutes && (
                <span style={s.metaChip}>⏱ {Math.floor(filmInfo.duration_minutes)} min</span>
              )}
            </div>

            {/* Download info */}
            <div style={s.infoBox}>
              <div style={s.infoBoxIcon}>💾</div>
              <div>
                <div style={s.infoBoxTitle}>Save the file on your screening laptop</div>
                <div style={s.infoBoxText}>
                  The download may take a few minutes. Once complete, keep the <strong style={{ color: '#f1f5f9' }}>.cvfilm</strong> file handy — you'll need it on screening day.
                </div>
              </div>
            </div>

            {/* Screening day section */}
            <div style={s.screenBox}>
              <div style={s.screenBoxTitle}>On Screening Day</div>
              <p style={s.screenBoxText}>
                Open the Screening Page, select your downloaded file, and enter your Screening Key to start the show.
              </p>
              {filmInfo.film_slug ? (
                <a href={`/film/${filmInfo.film_slug}/screen`} style={s.screenBtn}>
                  ▶ Go to Screening Page →
                </a>
              ) : (
                <a href={`/film/${slug}/screen`} style={s.screenBtn}>
                  ▶ Go to Screening Page →
                </a>
              )}
              <p style={s.screenBoxHint}>
                💡 Your Screening Key (CV-SC-…) is different from the Download Key. The filmmaker will share it with you on show day.
              </p>
            </div>

            <button onClick={handleDownloadAgain} style={s.ghostBtn}>
              ⬇ Download not starting? Click to try again
            </button>
            <button
              onClick={() => { setStep('enter_key'); setFilmInfo(null); setError(''); }}
              style={{ ...s.ghostBtn, marginTop: '0.25rem' }}
            >
              ← Use a Different Key
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
    color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold',
    background: 'rgba(59,130,246,0.1)', padding: '0.3rem 0.8rem',
    borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)',
  },
  body: {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '2rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%', maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    border: '1px solid #334155',
  },
  iconWrap: { marginBottom: '1rem' },
  icon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'rgba(59,130,246,0.15)',
    border: '2px solid rgba(59,130,246,0.4)',
    fontSize: '1.8rem',
  },
  title: { color: '#f1f5f9', fontSize: '1.5rem', margin: '0 0 0.5rem', fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' },
  keyInput: {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '2px solid #3b82f6', background: '#0f172a',
    color: '#3b82f6', fontSize: '1.1rem', fontFamily: 'monospace',
    textAlign: 'center', letterSpacing: '0.08em',
    marginBottom: '1rem', boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%', padding: '0.9rem',
    borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white', fontWeight: 'bold', fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
  },
  ghostBtn: {
    width: '100%', padding: '0.65rem',
    borderRadius: '8px', border: '1px solid #334155',
    background: 'transparent', color: '#64748b',
    cursor: 'pointer', fontSize: '0.82rem', marginTop: '0.75rem',
  },
  error: {
    background: '#7f1d1d', color: '#fca5a5',
    padding: '0.6rem', borderRadius: '8px',
    marginBottom: '0.75rem', fontSize: '0.85rem',
  },
  hint: {
    marginTop: '1.25rem', padding: '0.75rem 1rem',
    background: 'rgba(59,130,246,0.08)',
    borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)',
    color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.5', textAlign: 'left',
  },
  poster: {
    width: '100%', maxHeight: '180px', objectFit: 'cover',
    borderRadius: '12px', marginBottom: '1rem',
  },
  successBadge: {
    display: 'inline-block',
    background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
    padding: '0.3rem 1rem', borderRadius: '12px',
    fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.75rem',
    border: '1px solid rgba(59,130,246,0.3)',
  },
  metaRow: {
    display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
    gap: '0.5rem', marginBottom: '1.25rem',
  },
  metaChip: {
    background: '#0f172a', color: '#94a3b8',
    padding: '0.25rem 0.75rem', borderRadius: '12px',
    fontSize: '0.8rem', border: '1px solid #334155',
  },
  infoBox: {
    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    background: '#0f172a', borderRadius: '12px',
    padding: '1rem 1.25rem', marginBottom: '1rem',
    border: '1px solid #334155', textAlign: 'left',
  },
  infoBoxIcon: { fontSize: '1.4rem', flexShrink: 0 },
  infoBoxTitle: { color: '#e2e8f0', fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' },
  infoBoxText: { color: '#64748b', fontSize: '0.8rem', lineHeight: '1.6' },
  screenBox: {
    background: 'rgba(245,158,11,0.06)', borderRadius: '12px',
    padding: '1.25rem', marginBottom: '0.75rem',
    border: '1px solid rgba(245,158,11,0.2)', textAlign: 'left',
  },
  screenBoxTitle: { color: '#f59e0b', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  screenBoxText: { color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.6', margin: '0 0 0.75rem' },
  screenBtn: {
    display: 'block', padding: '0.75rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0f172a', textAlign: 'center',
    textDecoration: 'none', fontWeight: 'bold',
    fontSize: '0.9rem', marginBottom: '0.75rem',
  },
  screenBoxHint: { color: '#475569', fontSize: '0.75rem', margin: 0, lineHeight: '1.5' },
};
