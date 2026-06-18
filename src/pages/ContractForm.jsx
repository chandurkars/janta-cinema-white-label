import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContract, getFilms, getVenues } from '../services/api';

export default function ContractForm() {
  const navigate = useNavigate();
  const [films, setFilms] = useState([]);
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    film_id: '', venue_id: '', price_amount: '', filmmaker_share: 0, num_shows: 1,
  });

  useEffect(() => {
    getFilms().then(r => setFilms(r.data));
    getVenues().then(r => setVenues(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createContract({
        ...form,
        price_amount: parseFloat(form.price_amount),
        filmmaker_share: parseFloat(form.filmmaker_share),
      });
      navigate('/contracts');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create contract');
    }
  };

  const set = (k, v) => setForm({...form, [k]: v});

  return (
    <div>
      <h2 style={{ color: '#f1f5f9' }}>Create New Contract</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Film *</label>
            <select style={styles.input} required value={form.film_id} onChange={e => set('film_id', e.target.value)}>
              <option value="">Select a film</option>
              {films.map(f => <option key={f.id} value={f.id}>{f.title} ({f.language})</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Venue *</label>
            <select style={styles.input} required value={form.venue_id} onChange={e => set('venue_id', e.target.value)}>
              <option value="">Select a venue</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.city || 'No city'}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Contract Amount (Rs.) *</label>
            <input style={styles.input} type="number" step="0.01" required placeholder="5000"
              value={form.price_amount} onChange={e => set('price_amount', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Filmmaker Share (Rs.)</label>
            <input style={styles.input} type="number" step="0.01" placeholder="2000"
              value={form.filmmaker_share} onChange={e => set('filmmaker_share', e.target.value)} />
          </div>
          <div style={styles.fieldSm}>
            <label style={styles.label}>Number of Shows</label>
            <input style={styles.input} type="number" min="1"
              value={form.num_shows} onChange={e => set('num_shows', parseInt(e.target.value))} />
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Contract will be created in "Draft" status. Confirm it to start generating screening keys.
        </p>
        {error && <div style={styles.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" style={styles.submitBtn}>Create Contract</button>
          <button type="button" onClick={() => navigate('/contracts')} style={styles.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  form: { background: '#1e293b', borderRadius: '12px', padding: '2rem', marginTop: '1rem' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  field: { flex: '1 1 250px', display: 'flex', flexDirection: 'column' },
  fieldSm: { flex: '0 0 150px', display: 'flex', flexDirection: 'column' },
  label: { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' },
  submitBtn: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { padding: '0.75rem 2rem', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.5rem', borderRadius: '6px' },
};
