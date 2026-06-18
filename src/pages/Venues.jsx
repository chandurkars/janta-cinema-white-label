import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVenues } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Venues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    getVenues().then((res) => setVenues(res.data));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#f1f5f9' }}>Venues</h2>
        {(user?.role === 'platform_admin' || user?.role === 'aggregator_admin') && (
          <Link to="/venues/new" style={styles.addBtn}>+ Add Venue</Link>
        )}
      </div>
      <div style={styles.table}>
        <div style={styles.header}>
          <span style={styles.col}>Name</span>
          <span style={styles.col}>City</span>
          <span style={styles.colSm}>Screens</span>
          <span style={styles.colSm}>Contact</span>
          <span style={styles.colSm}>Status</span>
        </div>
        {venues.map((v) => (
          <div key={v.id} style={styles.row}>
            <span style={styles.col}>{v.name}</span>
            <span style={styles.col}>{v.city || '—'}</span>
            <span style={styles.colSm}>{v.screen_count}</span>
            <span style={styles.colSm}>{v.contact_name || '—'}</span>
            <span style={styles.colSm}>
              <span style={{ ...styles.badge, background: v.status === 'active' ? '#10b981' : '#64748b' }}>
                {v.status}
              </span>
            </span>
          </div>
        ))}
        {venues.length === 0 && <p style={{ color: '#64748b', padding: '1rem' }}>No venues found</p>}
      </div>
    </div>
  );
}

const styles = {
  table: { background: '#1e293b', borderRadius: '10px', overflow: 'hidden', marginTop: '1rem' },
  header: {
    display: 'flex',
    padding: '0.75rem 1rem',
    background: '#334155',
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #334155',
    color: '#e2e8f0',
  },
  col: { flex: 2 },
  colSm: { flex: 1 },
  badge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
  },
  addBtn: {
    padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#10b981', color: 'white',
    textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem',
  },
};
