import { useEffect, useState } from 'react';
import { getAnalyticsOverview, getScreeningHistory } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Analytics() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getAnalyticsOverview().then(r => setOverview(r.data)).catch(() => {});
    getScreeningHistory().then(r => setHistory(r.data)).catch(() => {});
  }, []);

  if (!overview) return <p style={{ color: '#64748b' }}>Loading analytics...</p>;

  return (
    <div>
      <h2 style={{ color: '#f1f5f9' }}>
        {user?.role === 'filmmaker' ? 'My Film Analytics' : 'Screening Analytics'}
      </h2>

      <div style={styles.grid}>
        <StatCard label="Total Screenings" value={overview.total_screenings} color="#10b981" />
        <StatCard label="Keys Created" value={overview.total_keys} color="#3b82f6" />
        <StatCard label="Consumed" value={overview.consumed} color="#10b981" />
        <StatCard label="Unused" value={overview.unused} color="#f59e0b" />
        <StatCard label="Revoked" value={overview.revoked} color="#ef4444" />
        <StatCard label={user?.role === 'filmmaker' ? 'My Revenue' : 'Total Revenue'}
          value={`Rs. ${overview.total_revenue.toLocaleString()}`} color="#8b5cf6" />
        <StatCard label="Avg. Completion" value={`${overview.avg_completion}%`} color="#06b6d4" />
      </div>

      <h3 style={{ color: '#f1f5f9', marginTop: '2rem', marginBottom: '1rem' }}>Screening History</h3>
      <div style={styles.table}>
        <div style={styles.header}>
          <span style={styles.col}>Film</span>
          <span style={styles.col}>Venue</span>
          <span style={styles.colSm}>City</span>
          <span style={styles.colSm}>Key</span>
          <span style={styles.colSm}>Watched</span>
          <span style={styles.colSm}>Status</span>
          <span style={styles.col}>Date</span>
        </div>
        {history.map(s => (
          <div key={s.id} style={styles.row}>
            <span style={styles.col}>{s.film_title}</span>
            <span style={styles.col}>{s.venue_name}</span>
            <span style={styles.colSm}>{s.venue_city || '—'}</span>
            <span style={{ ...styles.colSm, fontFamily: 'monospace', color: '#f59e0b', fontSize: '0.8rem' }}>{s.key_token}</span>
            <span style={styles.colSm}>{s.completion_percentage}%</span>
            <span style={styles.colSm}>
              <span style={{
                ...styles.badge,
                background: s.status === 'completed' ? '#10b981' : s.status === 'active' ? '#3b82f6' : '#64748b',
              }}>{s.status}</span>
            </span>
            <span style={{ ...styles.col, fontSize: '0.8rem' }}>{s.started_at ? new Date(s.started_at).toLocaleString() : '—'}</span>
          </div>
        ))}
        {history.length === 0 && <p style={{ color: '#64748b', padding: '1rem' }}>No screenings yet</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{value}</div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1rem' },
  card: { background: '#1e293b', padding: '1rem', borderRadius: '10px' },
  table: { background: '#1e293b', borderRadius: '10px', overflow: 'hidden' },
  header: { display: 'flex', padding: '0.6rem 1rem', background: '#334155', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
  row: { display: 'flex', padding: '0.6rem 1rem', borderBottom: '1px solid #334155', color: '#e2e8f0', alignItems: 'center', fontSize: '0.85rem' },
  col: { flex: 2 },
  colSm: { flex: 1 },
  badge: { padding: '0.15rem 0.5rem', borderRadius: '10px', color: 'white', fontSize: '0.7rem' },
};
