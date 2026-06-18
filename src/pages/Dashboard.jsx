import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFilms, getScreeningKeys, getVenues, getContracts } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ films: 0, keys: 0, venues: 0, contracts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFilms().catch(() => ({ data: [] })),
      getScreeningKeys().catch(() => ({ data: [] })),
      getVenues().catch(() => ({ data: [] })),
      getContracts().catch(() => ({ data: [] })),
    ]).then(([f, k, v, c]) => {
      setStats({
        films: f.data.length,
        keys: k.data.length,
        venues: v.data.length,
        contracts: c.data.length,
      });
      setLoading(false);
    });
  }, []);

  const isFilmmaker = user?.role === 'filmmaker';
  const isAggregator = user?.role === 'aggregator_admin';
  const isPlatformAdmin = user?.role === 'platform_admin';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.greeting}>{greeting}, {firstName} 👋</h2>
          <p style={s.subGreeting}>
            {isPlatformAdmin && 'Full platform overview — all tenants, films, and screenings.'}
            {isAggregator && 'Manage your films, venues, contracts, and screening keys.'}
            {isFilmmaker && 'Track your films and see where they\'re screening worldwide.'}
            {user?.role === 'venue_operator' && 'Ready to screen? Enter your key and start the show.'}
          </p>
        </div>
        {/* Quick action */}
        {isFilmmaker && (
          <Link to="/films" style={s.ctaBtn}>🎬 Upload / View Films</Link>
        )}
        {isAggregator && (
          <Link to="/keys" style={s.ctaBtn}>🔑 Create Screening Key</Link>
        )}
        {isPlatformAdmin && (
          <Link to="/films" style={s.ctaBtn}>🎬 Manage Films</Link>
        )}
      </div>

      {/* Stats grid */}
      {!loading && (
        <div style={s.grid}>
          <StatCard
            label="Films"
            value={stats.films}
            color="#3b82f6"
            icon="🎬"
            to="/films"
            hint={isFilmmaker ? 'Your uploaded films' : 'Total films in catalog'}
          />
          <StatCard
            label="Screening Keys"
            value={stats.keys}
            color="#f59e0b"
            icon="🔑"
            to="/keys"
            hint="Keys generated"
          />
          {(isAggregator || isPlatformAdmin) && (
            <StatCard
              label="Venues"
              value={stats.venues}
              color="#10b981"
              icon="🏛"
              to="/venues"
              hint="Active venues"
            />
          )}
          {(isAggregator || isPlatformAdmin) && (
            <StatCard
              label="Contracts"
              value={stats.contracts}
              color="#8b5cf6"
              icon="📋"
              to="/contracts"
              hint="Total contracts"
            />
          )}
        </div>
      )}

      {/* Role-specific help panels */}
      {isFilmmaker && stats.films === 0 && !loading && (
        <div style={s.onboardCard}>
          <div style={s.onboardIcon}>🎬</div>
          <div>
            <h3 style={s.onboardTitle}>Upload your first film</h3>
            <p style={s.onboardText}>
              CineVault encrypts your film with AES-256 so only authorised venues can screen it.
              Upload once — screen anywhere in the world, no DCP required.
            </p>
            <Link to="/films" style={s.onboardBtn}>Upload Film →</Link>
          </div>
        </div>
      )}

      {isFilmmaker && stats.films > 0 && stats.keys === 0 && !loading && (
        <div style={s.onboardCard}>
          <div style={s.onboardIcon}>🔑</div>
          <div>
            <h3 style={s.onboardTitle}>Generate your first screening key</h3>
            <p style={s.onboardText}>
              Your film is uploaded. Now generate a one-time screening key and share it
              with your venue. The key works only within your specified time window.
            </p>
            <Link to="/keys" style={s.onboardBtn}>Create Screening Key →</Link>
          </div>
        </div>
      )}

      {isAggregator && !loading && (
        <div style={s.infoGrid}>
          <QuickLink icon="🏛" label="Add a Venue" to="/venues" desc="Register theatres, schools, clubs" />
          <QuickLink icon="📋" label="Create Contract" to="/contracts" desc="Link a film to a venue & date" />
          <QuickLink icon="🔑" label="Generate Keys" to="/keys" desc="Create one-time screening keys" />
          <QuickLink icon="📊" label="View Analytics" to="/analytics" desc="Track screenings and revenue" />
        </div>
      )}

      {isPlatformAdmin && !loading && (
        <div style={s.infoGrid}>
          <QuickLink icon="🎬" label="Upload Film" to="/films/upload" desc="Add encrypted film to catalog" />
          <QuickLink icon="🏛" label="Manage Venues" to="/venues" desc="All venues across tenants" />
          <QuickLink icon="🔑" label="All Keys" to="/keys" desc="Global screening key audit" />
          <QuickLink icon="📊" label="Analytics" to="/analytics" desc="Platform-wide stats" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon, to, hint }) {
  return (
    <Link to={to} style={{ ...s.card, textDecoration: 'none', borderTop: `3px solid ${color}` }}>
      <div style={s.cardTopRow}>
        <span style={s.cardIcon}>{icon}</span>
        <span style={{ ...s.cardValue, color }}>{value}</span>
      </div>
      <div style={s.cardLabel}>{label}</div>
      <div style={s.cardHint}>{hint}</div>
    </Link>
  );
}

function QuickLink({ icon, label, to, desc }) {
  return (
    <Link to={to} style={s.quickCard}>
      <div style={s.quickIcon}>{icon}</div>
      <div style={s.quickLabel}>{label}</div>
      <div style={s.quickDesc}>{desc}</div>
    </Link>
  );
}

const s = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  greeting: {
    color: '#f1f5f9',
    fontSize: '1.6rem',
    fontWeight: '700',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  subGreeting: {
    color: '#64748b',
    fontSize: '0.925rem',
    margin: 0,
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '0.65rem 1.25rem',
    borderRadius: '8px',
    background: '#f59e0b',
    color: '#0f172a',
    fontWeight: '700',
    fontSize: '0.875rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    background: '#1e293b',
    padding: '1.25rem',
    borderRadius: '10px',
    display: 'block',
    transition: 'transform 0.15s, background 0.15s',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardIcon: { fontSize: '1.4rem' },
  cardValue: {
    fontSize: '2.25rem',
    fontWeight: '800',
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  cardHint: {
    color: '#475569',
    fontSize: '0.75rem',
    marginTop: '2px',
  },
  onboardCard: {
    display: 'flex',
    gap: '1.25rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.5rem',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  onboardIcon: { fontSize: '2rem', marginTop: '2px' },
  onboardTitle: {
    color: '#f1f5f9',
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 6px 0',
  },
  onboardText: {
    color: '#64748b',
    fontSize: '0.875rem',
    margin: '0 0 1rem 0',
    lineHeight: '1.6',
  },
  onboardBtn: {
    display: 'inline-block',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    background: '#f59e0b',
    color: '#0f172a',
    fontWeight: '700',
    fontSize: '0.875rem',
    textDecoration: 'none',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
  },
  quickCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '1.25rem',
    textDecoration: 'none',
    display: 'block',
    transition: 'border-color 0.15s',
  },
  quickIcon: { fontSize: '1.5rem', marginBottom: '8px' },
  quickLabel: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '4px',
  },
  quickDesc: {
    color: '#475569',
    fontSize: '0.75rem',
  },
};
