import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, confirmContract } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const statusColors = {
  draft: '#64748b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);

  const load = () => getContracts().then((res) => setContracts(res.data));
  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    await confirmContract(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#f1f5f9' }}>Contracts</h2>
        {(user?.role === 'platform_admin' || user?.role === 'aggregator_admin') && (
          <Link to="/contracts/new" style={styles.addBtn}>+ New Contract</Link>
        )}
      </div>
      <div style={styles.table}>
        <div style={styles.header}>
          <span style={styles.col}>Film</span>
          <span style={styles.col}>Venue</span>
          <span style={styles.colSm}>Amount</span>
          <span style={styles.colSm}>Shows</span>
          <span style={styles.colSm}>Status</span>
          <span style={styles.colSm}>Action</span>
        </div>
        {contracts.map((c) => (
          <div key={c.id} style={styles.row}>
            <span style={styles.col}>{c.film_title || c.film_id.slice(0, 8) + '...'}</span>
            <span style={styles.col}>{c.venue_name || c.venue_id.slice(0, 8) + '...'}</span>
            <span style={styles.colSm}>₹{c.price_amount}</span>
            <span style={styles.colSm}>{c.num_shows}</span>
            <span style={styles.colSm}>
              <span style={{ ...styles.badge, background: statusColors[c.status] || '#64748b' }}>
                {c.status}
              </span>
            </span>
            <span style={styles.colSm}>
              {c.status === 'draft' && (
                <button onClick={() => handleConfirm(c.id)} style={styles.btn}>Confirm</button>
              )}
            </span>
          </div>
        ))}
        {contracts.length === 0 && <p style={{ color: '#64748b', padding: '1rem' }}>No contracts found</p>}
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
    alignItems: 'center',
  },
  col: { flex: 2 },
  colSm: { flex: 1 },
  badge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
  },
  btn: {
    padding: '0.3rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  addBtn: {
    padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#10b981', color: 'white',
    textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem',
  },
};
