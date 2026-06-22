import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFilms, getTenants, assignFilm, getFilmAssignments, removeFilmAssignment, deleteFilm } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const resolvePosterUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Stored as /posters/filename.jpg — route through the backend presigned URL endpoint
  const filename = url.split('/').pop();
  return `${API_BASE}/films/poster/${filename}`;
};

export default function Films() {
  const { user } = useAuth();
  const [films, setFilms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [assignForm, setAssignForm] = useState({ filmId: null, tenantId: '' });
  const [toast, setToast] = useState('');

  const load = async () => {
    const res = await getFilms();
    setFilms(res.data);
    if (user?.role === 'platform_admin') {
      const aMap = {};
      for (const f of res.data) {
        try {
          const aRes = await getFilmAssignments(f.id);
          aMap[f.id] = aRes.data;
        } catch { aMap[f.id] = []; }
      }
      setAssignments(aMap);
    }
  };

  useEffect(() => {
    load();
    if (user?.role === 'platform_admin') {
      getTenants().then(r => setTenants(r.data)).catch(() => {});
    }
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAssign = async (filmId) => {
    if (!assignForm.tenantId) return;
    try {
      await assignFilm(filmId, assignForm.tenantId);
      setAssignForm({ filmId: null, tenantId: '' });
      showToast('Film assigned!');
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleDelete = async (filmId, filmTitle) => {
    if (!confirm(`Delete "${filmTitle}"?\n\nThis will permanently remove the film file from storage and delete all associated screening keys. This cannot be undone.`)) return;
    try {
      await deleteFilm(filmId);
      showToast(`"${filmTitle}" deleted`);
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleRemoveAssignment = async (filmId, tenantId, tenantName) => {
    if (!confirm(`Remove assignment to ${tenantName}?`)) return;
    try {
      await removeFilmAssignment(filmId, tenantId);
      showToast('Assignment removed');
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to remove');
    }
  };

  return (
    <div>
      {toast && <div style={styles.toast}>{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#f1f5f9' }}>{user?.role === 'filmmaker' ? 'My Films' : 'Films'}</h2>
        {(user?.role === 'platform_admin' || user?.role === 'filmmaker' || user?.role === 'aggregator_admin') && (
          <Link to="/films/upload" style={styles.addBtn}>+ Upload Film</Link>
        )}
      </div>

      <div style={styles.table}>
        <div style={styles.header}>
          <span style={styles.col}>Title</span>
          <span style={styles.colSm}>Duration</span>
          <span style={styles.colSm}>Language</span>
          <span style={styles.colSm}>Certificate</span>
          <span style={styles.colSm}>Status</span>
          {user?.role === 'platform_admin' && <span style={{ flex: 2 }}>Assigned To</span>}
          {(user?.role === 'platform_admin' || user?.role === 'filmmaker' || user?.role === 'aggregator_admin') && <span style={{ flex: '0 0 60px' }}></span>}
        </div>
        {films.map(f => (
          <div key={f.id} style={styles.row}>
            <span style={{ flex: '0 0 48px' }}>
              {resolvePosterUrl(f.poster_url)
                ? <img src={resolvePosterUrl(f.poster_url)} alt="" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                : <div style={{ width: 48, height: 64, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🎬</div>
              }
            </span>
            <span style={styles.col}>
              <strong>{f.title}</strong>
              {f.synopsis && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>{f.synopsis.slice(0, 60)}...</div>}
            </span>
            <span style={styles.colSm}>{Math.floor(f.duration_minutes)}m {Math.round((f.duration_minutes % 1) * 60)}s</span>
            <span style={styles.colSm}>{f.language}</span>
            <span style={styles.colSm}>{f.certificate || '—'}</span>
            <span style={styles.colSm}>
              <span style={{ ...styles.badge, background: f.status === 'active' ? '#10b981' : '#64748b' }}>{f.status}</span>
            </span>
            {(user?.role === 'platform_admin' || user?.role === 'filmmaker' || user?.role === 'aggregator_admin') && (
              <span style={{ flex: '0 0 60px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => handleDelete(f.id, f.title)} style={styles.deleteBtn} title="Delete film">
                  🗑
                </button>
              </span>
            )}
            {user?.role === 'platform_admin' && (
              <span style={{ flex: 2 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                  {(assignments[f.id] || []).map(a => (
                    <span key={a.tenant_id} style={styles.assignedTag}>
                      {a.tenant_name}
                      <button onClick={() => handleRemoveAssignment(f.id, a.tenant_id, a.tenant_name)}
                        style={styles.removeBtn}>×</button>
                    </span>
                  ))}
                  {assignForm.filmId === f.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select style={styles.selectSm} value={assignForm.tenantId}
                        onChange={e => setAssignForm({...assignForm, tenantId: e.target.value})}>
                        <option value="">Tenant</option>
                        {tenants.filter(t => !(assignments[f.id] || []).some(a => a.tenant_id === t.id))
                          .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button onClick={() => handleAssign(f.id)} style={styles.assignBtn}>Go</button>
                      <button onClick={() => setAssignForm({ filmId: null, tenantId: '' })}
                        style={{ ...styles.assignBtn, background: '#334155' }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssignForm({ filmId: f.id, tenantId: '' })} style={styles.assignTrigger}>+</button>
                  )}
                </div>
              </span>
            )}
          </div>
        ))}
        {films.length === 0 && <p style={{ color: '#64748b', padding: '1rem' }}>No films found</p>}
      </div>
    </div>
  );
}

const styles = {
  table: { background: '#1e293b', borderRadius: '10px', overflow: 'hidden', marginTop: '1rem' },
  header: { display: 'flex', padding: '0.6rem 1rem', background: '#334155', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
  row: { display: 'flex', gap: '12px', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', color: '#e2e8f0', alignItems: 'center' },
  col: { flex: 2 },
  colSm: { flex: 1 },
  badge: { padding: '0.15rem 0.5rem', borderRadius: '10px', color: 'white', fontSize: '0.7rem' },
  addBtn: {
    padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#f59e0b', color: '#0f172a',
    textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem',
  },
  toast: {
    position: 'fixed', top: '1rem', right: '1rem', background: '#10b981', color: 'white',
    padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold',
    zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  assignedTag: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '2px 8px', borderRadius: '12px', background: '#064e3b', color: '#6ee7b7',
    fontSize: '0.7rem', fontWeight: 'bold',
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer',
    fontSize: '0.85rem', padding: 0, lineHeight: 1,
  },
  selectSm: { padding: '2px', borderRadius: '4px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', fontSize: '0.75rem', width: '100px' },
  assignBtn: { padding: '2px 8px', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem' },
  assignTrigger: { padding: '1px 8px', borderRadius: '12px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', cursor: 'pointer', fontSize: '0.75rem' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px', borderRadius: '4px', opacity: 0.5, transition: 'opacity 0.15s' },
};
