import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFilm, createScreeningKeyPair, createFilmmakerKey } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) {
    try {
      const key = new URL(url).pathname.replace(/^\/+/, '');
      if (key) return `${API_BASE}/films/image/${key}`;
    } catch {}
    return url;
  }
  if (url.startsWith('/')) return `${API_BASE}/films/image/${url.replace(/^\/+/, '')}`;
  return `${API_BASE}/films/poster/${url}`;
};

function withTz(dt) {
  const off = new Date().getTimezoneOffset();
  const h = String(Math.abs(Math.floor(off / 60))).padStart(2, '0');
  const m = String(Math.abs(off % 60)).padStart(2, '0');
  return `${dt}:00${off <= 0 ? '+' : '-'}${h}:${m}`;
}

function copy(text, label, notify) {
  navigator.clipboard.writeText(text);
  notify(`${label} copied!`);
}

const STATUS_COLORS = {
  active: '#10b981',
  processing: '#f59e0b',
  draft: '#64748b',
  paused: '#f97316',
  retired: '#ef4444',
};

export default function FilmView() {
  const { filmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', ok: true });

  const isFilmmaker = user?.role === 'filmmaker';
  const canCreateKeys = ['platform_admin', 'aggregator_admin', 'filmmaker'].includes(user?.role);

  const [keyForm, setKeyForm] = useState({ valid_from: '', valid_to: '', num_shows: 1 });
  const [keyCreating, setKeyCreating] = useState(false);
  const [newKeys, setNewKeys] = useState(null);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '' }), 4000);
  };

  useEffect(() => {
    getFilm(filmId)
      .then(r => setFilm(r.data))
      .catch(() => navigate('/films'))
      .finally(() => setLoading(false));
  }, [filmId]);

  const handleGenerateKeys = async (e) => {
    e.preventDefault();
    setKeyCreating(true);
    setNewKeys(null);
    try {
      let res;
      if (isFilmmaker) {
        res = await createFilmmakerKey({
          film_id: filmId,
          valid_from: withTz(keyForm.valid_from),
          valid_to: withTz(keyForm.valid_to),
          max_plays: 1,
          num_shows: keyForm.num_shows,
        });
      } else {
        res = await createScreeningKeyPair({
          film_id: filmId,
          valid_from: withTz(keyForm.valid_from),
          valid_to: withTz(keyForm.valid_to),
          max_plays: 1,
          num_streaming_keys: keyForm.num_shows,
        });
      }
      setNewKeys(res.data);
      setKeyForm({ valid_from: '', valid_to: '', num_shows: 1 });
      notify('Keys generated! 🎬');
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to generate keys', false);
    } finally {
      setKeyCreating(false);
    }
  };

  if (loading) return <div style={{ color: '#64748b', padding: '2rem' }}>Loading…</div>;
  if (!film) return null;

  const bannerUrl = resolveUrl(film.thumbnail_h_url) || resolveUrl(film.poster_url);
  const posterUrl = resolveUrl(film.poster_url) || resolveUrl(film.thumbnail_v_url);
  const statusColor = STATUS_COLORS[film.status] || '#64748b';

  const metaItems = [
    { label: 'Language', value: film.language },
    { label: 'Genre', value: film.genre },
    { label: 'Category', value: film.category },
    { label: 'Certificate', value: film.certificate },
    {
      label: 'Duration',
      value: film.duration_minutes
        ? `${Math.floor(film.duration_minutes)}m ${Math.round((film.duration_minutes % 1) * 60)}s`
        : '—',
    },
    {
      label: 'Status',
      value: (
        <span style={{ color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}>
          {film.status}
        </span>
      ),
    },
  ];

  const prices = [
    film.price_1_show && { label: '1 Show', value: `₹${Number(film.price_1_show).toLocaleString('en-IN')}` },
    film.price_2_shows && { label: '2 Shows', value: `₹${Number(film.price_2_shows).toLocaleString('en-IN')}` },
    film.price_4_shows && { label: '4 Shows', value: `₹${Number(film.price_4_shows).toLocaleString('en-IN')}` },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 860, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {toast.msg && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: toast.ok ? '#10b981' : '#ef4444', color: 'white', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/films')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Films
        </button>
        <button onClick={() => navigate(`/films/${filmId}/edit`)} style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
          ✏ Edit Details
        </button>
      </div>

      {/* Banner */}
      <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', background: '#0f172a', minHeight: 240 }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: 280, background: 'linear-gradient(135deg, #0f1f3d 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎬</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.55) 50%, rgba(0,0,0,0) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          {posterUrl && (
            <img src={posterUrl} alt="" style={{ width: 68, height: 90, objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
              <h1 style={{ color: '#f1f5f9', fontSize: '1.55rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>{film.title}</h1>
              <span style={{ padding: '0.18rem 0.7rem', borderRadius: '20px', background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`, fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                {film.status}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              {[film.language, film.genre, film.category].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#334155', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {metaItems.map(item => (
          <div key={item.label} style={{ background: '#1e293b', padding: '0.85rem 1.1rem' }}>
            <div style={labelSt}>{item.label}</div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>{item.value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Synopsis */}
      {film.synopsis && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
          <div style={labelSt}>Synopsis</div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.7', margin: '6px 0 0' }}>{film.synopsis}</p>
        </div>
      )}

      {/* Pricing */}
      {prices.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
          <div style={labelSt}>Pricing</div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '8px' }}>
            {prices.map(p => (
              <div key={p.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '0.6rem 1rem', border: '1px solid #334155' }}>
                <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '600', marginBottom: '3px' }}>{p.label}</div>
                <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: '700' }}>{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule a Screening */}
      {canCreateKeys && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem', border: '1px solid #334155' }}>
          <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '3px' }}>Schedule a Screening</div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1.1rem', lineHeight: '1.5' }}>
            Generates 1 download key + 1 show key per show. Share with your venue on screening day.
          </p>

          <form onSubmit={handleGenerateKeys}>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelSt}>No. of Shows</label>
                <input
                  type="number" min="1" max="20"
                  value={keyForm.num_shows}
                  onChange={e => setKeyForm({ ...keyForm, num_shows: parseInt(e.target.value) || 1 })}
                  style={{ ...inpSt, width: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
                <label style={labelSt}>Window Opens</label>
                <input
                  type="datetime-local"
                  value={keyForm.valid_from}
                  onChange={e => setKeyForm({ ...keyForm, valid_from: e.target.value })}
                  style={inpSt} required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
                <label style={labelSt}>Window Closes</label>
                <input
                  type="datetime-local"
                  value={keyForm.valid_to}
                  onChange={e => setKeyForm({ ...keyForm, valid_to: e.target.value })}
                  style={inpSt} required
                />
              </div>
              <button
                type="submit"
                disabled={keyCreating}
                style={{ padding: '0.65rem 1.35rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: '700', fontSize: '0.875rem', cursor: keyCreating ? 'not-allowed' : 'pointer', opacity: keyCreating ? 0.7 : 1, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
              >
                {keyCreating ? 'Generating…' : 'Generate Keys →'}
              </button>
            </div>
          </form>

          {/* Generated keys */}
          {newKeys && (
            <div style={{ marginTop: '1.25rem', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ padding: '0.55rem 1rem', background: '#0a1628', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '700' }}>✓ Keys Generated</span>
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>Share with your venue</span>
              </div>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={keyTypeSt}>📥 Download</span>
                <code style={keyCodeSt}>{newKeys.download_key?.key_token}</code>
                <button onClick={() => copy(newKeys.download_key?.key_token, 'Download key', notify)} style={cpBtnSt}>Copy</button>
              </div>
              {newKeys.streaming_keys?.map((k, i) => (
                <div key={k.id} style={{ padding: '0.5rem 1rem', borderBottom: i < newKeys.streaming_keys.length - 1 ? '1px solid #1e293b' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={keyTypeSt}>Show {i + 1}</span>
                  <code style={keyCodeSt}>{k.key_token}</code>
                  <button onClick={() => copy(k.key_token, `Show ${i + 1} key`, notify)} style={cpBtnSt}>Copy</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelSt = { color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' };
const inpSt = { padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const keyTypeSt = { color: '#475569', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '80px', flexShrink: 0 };
const keyCodeSt = { fontFamily: 'monospace', color: '#f1f5f9', fontSize: '0.85rem', flex: 1, letterSpacing: '0.03em' };
const cpBtnSt = { padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 };
