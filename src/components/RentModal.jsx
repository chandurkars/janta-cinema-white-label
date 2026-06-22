import { useState } from 'react';
import { submitInquiry } from '../services/api';

export default function RentModal({ film, defaultShows, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', organization: '', message: '',
    num_shows: defaultShows || 1,
    agreed_terms: false, agreed_privacy: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const packs = [
    { shows: 1, price: film.price_1_show, label: '1 Show' },
    { shows: 2, price: film.price_2_shows, label: '2 Shows' },
    { shows: 4, price: film.price_4_shows, label: '4 Shows' },
  ].filter(p => p.price);

  const selectedPack = packs.find(p => p.shows === form.num_shows);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreed_terms || !form.agreed_privacy) {
      setError('Please agree to both Terms & Conditions and Privacy Policy.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitInquiry({
        film_id: film.id,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        city: form.city || null,
        organization: form.organization || null,
        num_shows: form.num_shows,
        message: form.message || null,
        agreed_terms: form.agreed_terms,
        agreed_privacy: form.agreed_privacy,
      });
      setSubmitted(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal}>
        <button style={s.closeBtn} type="button" onClick={onClose}>✕</button>

        {submitted ? (
          <div style={s.thankYou}>
            <div style={s.thankYouIcon}>🎉</div>
            <h2 style={s.thankYouTitle}>Thank you, {form.name.split(' ')[0]}!</h2>
            <p style={s.thankYouText}>
              We've received your screening enquiry for <strong>{film.title}</strong>.
              Our team will review your request and reach out to you at <strong>{form.email}</strong> within 24 hours to discuss details and finalise the booking.
            </p>
            <button style={s.doneBtn} type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h2 style={s.title}>Enquire for Screening</h2>
            <p style={s.subtitle}><strong style={{ color: '#f59e0b' }}>{film.title}</strong> — fill in your details below. No payment is collected at this stage.</p>

            {packs.length > 1 && (
              <div style={s.packPicker}>
                {packs.map(p => (
                  <button
                    key={p.shows}
                    type="button"
                    style={{ ...s.packOpt, ...(form.num_shows === p.shows ? s.packOptActive : {}) }}
                    onClick={() => set('num_shows', p.shows)}
                  >
                    <span style={s.packOptLabel}>{p.label}</span>
                    <span style={s.packOptPrice}>₹{p.price.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            )}
            {!packs.length && (
              <div style={s.noPrice}>No pricing set yet — we'll discuss pricing after you enquire.</div>
            )}

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} style={s.form}>
              <Row>
                <Field label="Full Name *">
                  <input style={s.input} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
                </Field>
                <Field label="Email *">
                  <input style={s.input} required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                </Field>
              </Row>
              <Row>
                <Field label="Phone">
                  <input style={s.input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="City">
                  <input style={s.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai" />
                </Field>
              </Row>
              <Field label="Organisation / Venue">
                <input style={s.input} value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Organisation or venue name" />
              </Field>
              <Field label="Message (optional)">
                <textarea style={{ ...s.input, minHeight: 72, resize: 'vertical' }} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Anything you'd like us to know — dates, audience size, venue details…" />
              </Field>

              <div style={s.agreements}>
                <label style={s.checkLabel}>
                  <input type="checkbox" checked={form.agreed_terms} onChange={e => set('agreed_terms', e.target.checked)} style={s.checkbox} />
                  I have read and agree to the <a href="/terms" target="_blank" style={s.link}>Terms & Conditions</a>
                </label>
                <label style={s.checkLabel}>
                  <input type="checkbox" checked={form.agreed_privacy} onChange={e => set('agreed_privacy', e.target.checked)} style={s.checkbox} />
                  I have read and agree to the <a href="/privacy" target="_blank" style={s.link}>Privacy Policy</a>
                </label>
              </div>

              <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting…' : `Submit Enquiry${selectedPack ? ` — ₹${selectedPack.price.toLocaleString('en-IN')}` : ''}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <label style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' },
  modal: { background: '#1e293b', borderRadius: 16, padding: '2rem', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', border: '1px solid #334155' },
  closeBtn: { position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: '#64748b', fontSize: '1.1rem', cursor: 'pointer', padding: 4 },
  title: { color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0' },
  subtitle: { color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' },
  packPicker: { display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' },
  packOpt: { flex: '1 1 80px', padding: '0.6rem', borderRadius: 10, background: '#0f172a', border: '1.5px solid #334155', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  packOptActive: { border: '1.5px solid #f59e0b', background: 'rgba(245,158,11,0.06)' },
  packOptLabel: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem' },
  packOptPrice: { color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' },
  noPrice: { background: '#0f172a', borderRadius: 8, padding: '0.6rem 1rem', color: '#64748b', fontSize: '0.82rem', marginBottom: '1rem' },
  errorBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', marginBottom: '1rem' },
  form: { display: 'block' },
  input: { padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  agreements: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem', marginTop: 4 },
  checkLabel: { display: 'flex', alignItems: 'flex-start', gap: 8, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, cursor: 'pointer' },
  checkbox: { marginTop: 2, flexShrink: 0, accentColor: '#f59e0b' },
  link: { color: '#f59e0b', textDecoration: 'underline' },
  submitBtn: { padding: '0.875rem', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', letterSpacing: '-0.01em' },
  thankYou: { textAlign: 'center', padding: '1rem 0' },
  thankYouIcon: { fontSize: '3.5rem', marginBottom: '1rem' },
  thankYouTitle: { color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px 0' },
  thankYouText: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto 1.5rem', maxWidth: 400 },
  doneBtn: { padding: '0.75rem 2.5rem', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' },
};
