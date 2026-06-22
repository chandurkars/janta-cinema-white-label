import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicFilm } from '../services/api';
import RentModal from '../components/RentModal';
import logo from '../assets/janta-cinema/logo.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const filename = url.split('/').pop();
  return `${API_BASE}/films/poster/${filename}`;
}

export default function FilmDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rentModal, setRentModal] = useState(null); // null or number of shows

  useEffect(() => {
    getPublicFilm(slug)
      .then(r => setFilm(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={s.loader}>Loading…</div>;
  if (!film) return null;

  const thumbSrc = resolveUrl(film.thumbnail_h_url) || resolveUrl(film.thumbnail_v_url) || resolveUrl(film.poster_url);
  const minPrice = [film.price_1_show, film.price_2_shows, film.price_4_shows].filter(Boolean).sort((a, b) => a - b)[0];

  const packs = [
    { shows: 1, price: film.price_1_show, label: '1 Show' },
    { shows: 2, price: film.price_2_shows, label: '2 Shows' },
    { shows: 4, price: film.price_4_shows, label: '4 Shows' },
  ].filter(p => p.price);

  const cast = film.cast_list ? film.cast_list.split(',').map(c => c.trim()).filter(Boolean) : [];

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <Link to="/" style={s.brandLink}>
          <img src={logo} alt="Janta Cinema" style={{ height: 40, width: 'auto' }} />
        </Link>
        <Link to="/" style={s.backLink}>← Back to catalogue</Link>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        {thumbSrc && (
          <div style={s.heroImgWrap}>
            <img src={thumbSrc} alt={film.title} style={s.heroImg} />
            <div style={s.heroShade} />
          </div>
        )}
        <div style={s.heroContent}>
          <div style={s.badges}>
            {film.certificate && <span style={s.badge}>{film.certificate}</span>}
            {film.genre && <span style={s.badge}>{film.genre}</span>}
            {film.language && <span style={s.badge}>{film.language}</span>}
            {film.category && <span style={{ ...s.badge, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>{film.category}</span>}
          </div>
          <h1 style={s.heroTitle}>{film.title}</h1>
          {film.director && <p style={s.heroMeta}>Directed by <strong>{film.director}</strong></p>}
          {film.synopsis && <p style={s.heroSynopsis}>{film.synopsis}</p>}
          {minPrice && (
            <p style={s.heroPriceFrom}>Starting from <strong style={{ color: '#f59e0b' }}>₹{minPrice.toLocaleString('en-IN')}</strong> per show</p>
          )}
        </div>
      </div>

      <div style={s.body}>
        <div style={s.main}>
          {/* Film info */}
          <div style={s.infoGrid}>
            {film.director && <InfoItem label="Director" value={film.director} />}
            {film.producer && <InfoItem label="Producer" value={film.producer} />}
            {film.music && <InfoItem label="Music" value={film.music} />}
            {film.language && <InfoItem label="Language" value={film.language} />}
            {film.certificate && <InfoItem label="Certificate" value={film.certificate} />}
            {film.rating && <InfoItem label="Rating" value={film.rating} />}
            {film.duration_minutes && <InfoItem label="Duration" value={`${Math.floor(film.duration_minutes)}m ${Math.round((film.duration_minutes % 1) * 60)}s`} />}
          </div>

          {cast.length > 0 && (
            <div style={s.castSection}>
              <h3 style={s.subHead}>Cast</h3>
              <div style={s.castList}>
                {cast.map(name => (
                  <span key={name} style={s.castChip}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {(film.foul_language || film.smoking_drugs) && (
            <div style={s.advisories}>
              <h3 style={s.subHead}>Content Advisories</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {film.foul_language && <span style={s.advisory}>⚠ Contains foul / abusive language</span>}
                {film.smoking_drugs && <span style={s.advisory}>🚬 Depicts smoking, drugs or alcohol</span>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — pricing */}
        <div style={s.sidebar}>
          <div style={s.pricingCard}>
            <h3 style={s.pricingTitle}>Book a Screening</h3>
            <p style={s.pricingSubtitle}>Select a package and submit your enquiry. Our team will reach out within 24 hours.</p>
            {packs.length > 0 ? (
              <div style={s.packs}>
                {packs.map(p => (
                  <button key={p.shows} style={s.packBtn} type="button" onClick={() => setRentModal(p.shows)}>
                    <span style={s.packLabel}>{p.label}</span>
                    <span style={s.packPrice}>₹{p.price.toLocaleString('en-IN')}</span>
                    <span style={s.packRent}>Enquire →</span>
                  </button>
                ))}
              </div>
            ) : (
              <button style={s.packBtnSingle} type="button" onClick={() => setRentModal(1)}>
                Enquire for Screening
              </button>
            )}
            <p style={s.pricingNote}>No payment collected here — we'll confirm and invoice offline.</p>
          </div>
        </div>
      </div>

      {rentModal && (
        <RentModal
          film={film}
          defaultShows={rentModal}
          onClose={() => setRentModal(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={s.infoItem}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#e2e8f0' },
  loader: { color: '#64748b', padding: '3rem', textAlign: 'center' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #1e293b' },
  brandLink: { textDecoration: 'none' },
  backLink: { color: '#64748b', fontSize: '0.875rem', textDecoration: 'none' },
  hero: { position: 'relative', minHeight: 340, display: 'flex', alignItems: 'flex-end' },
  heroImgWrap: { position: 'absolute', inset: 0, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 },
  heroShade: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0f172a 30%, transparent)' },
  heroContent: { position: 'relative', padding: '2rem 2.5rem', maxWidth: 800, zIndex: 1 },
  badges: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  badge: { padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)' },
  heroTitle: { fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' },
  heroMeta: { color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 12px 0' },
  heroSynopsis: { color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px 0', maxWidth: 600 },
  heroPriceFrom: { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  body: { display: 'flex', gap: '2rem', padding: '2rem 2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  main: { flex: '1 1 400px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  infoLabel: { color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoValue: { color: '#e2e8f0', fontSize: '0.9rem' },
  subHead: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.6rem 0' },
  castSection: { marginBottom: '1.5rem' },
  castList: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  castChip: { padding: '4px 12px', borderRadius: 99, background: '#1e293b', border: '1px solid #334155', fontSize: '0.8rem', color: '#cbd5e1' },
  advisories: { marginBottom: '1.5rem' },
  advisory: { padding: '6px 14px', borderRadius: 8, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', color: '#fbbf24', fontSize: '0.8rem' },
  sidebar: { flex: '0 0 300px' },
  pricingCard: { background: '#1e293b', borderRadius: 16, padding: '1.5rem', border: '1px solid #334155' },
  pricingTitle: { color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' },
  pricingSubtitle: { color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' },
  packs: { display: 'flex', flexDirection: 'column', gap: 10 },
  packBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 10, background: '#0f172a', border: '1.5px solid #334155', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' },
  packLabel: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', flex: 1 },
  packPrice: { color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' },
  packRent: { color: '#64748b', fontSize: '0.78rem' },
  packBtnSingle: { width: '100%', padding: '0.875rem', borderRadius: 10, background: '#f59e0b', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' },
  pricingNote: { color: '#475569', fontSize: '0.72rem', textAlign: 'center', marginTop: 14, lineHeight: 1.5 },
};
