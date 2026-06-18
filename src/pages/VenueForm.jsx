import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVenue, getTenants } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function VenueForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', address: '', city: '', contact_name: '', contact_phone: '', screen_count: 1, notes: '', tenant_id: '',
  });

  useEffect(() => {
    if (user?.role === 'platform_admin') {
      getTenants().then(r => setTenants(r.data)).catch(() => {});
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (!payload.tenant_id) delete payload.tenant_id;
      await createVenue(payload);
      navigate('/venues');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create venue');
    }
  };

  const set = (k, v) => setForm({...form, [k]: v});

  return (
    <div>
      <h2 style={{ color: '#f1f5f9' }}>Add New Venue</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {user?.role === 'platform_admin' && (
          <div style={styles.field}>
            <label style={styles.label}>Aggregator (Tenant) *</label>
            <select style={styles.input} required value={form.tenant_id} onChange={e => set('tenant_id', e.target.value)}>
              <option value="">Select an aggregator</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Venue Name *</label>
            <input style={styles.input} required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Delhi Public School Auditorium" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>City</label>
            <input style={styles.input} value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="e.g. New Delhi" />
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Address</label>
          <textarea style={{...styles.input, minHeight: '60px'}} value={form.address}
            onChange={e => set('address', e.target.value)} placeholder="Full address" />
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Contact Person</label>
            <input style={styles.input} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Phone</label>
            <input style={styles.input} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
              placeholder="+91-9876543210" />
          </div>
          <div style={styles.fieldSm}>
            <label style={styles.label}>Screens</label>
            <input style={styles.input} type="number" min="1" value={form.screen_count}
              onChange={e => set('screen_count', parseInt(e.target.value))} />
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Notes</label>
          <textarea style={{...styles.input, minHeight: '50px'}} value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="e.g. Projector supports 1080p only" />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" style={styles.submitBtn}>Create Venue</button>
          <button type="button" onClick={() => navigate('/venues')} style={styles.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  form: { background: '#1e293b', borderRadius: '12px', padding: '2rem', marginTop: '1rem' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  field: { flex: '1 1 250px', display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' },
  fieldSm: { flex: '0 0 120px', display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' },
  label: { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' },
  submitBtn: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { padding: '0.75rem 2rem', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.5rem', borderRadius: '6px', marginTop: '0.5rem' },
};
