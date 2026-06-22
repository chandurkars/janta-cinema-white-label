import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import jantaLogo from '../assets/janta-cinema/logo.png';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('filmmaker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const roleValue = role === 'filmmaker' ? 'filmmaker' : 'aggregator_admin';
      await register({ name, email, password, role: roleValue });
      navigate('/login', { state: { message: 'Account created! Check your email and log in.' } });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Signup failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'filmmaker',
      title: 'Filmmaker',
      emoji: '🎬',
      desc: 'Upload your film, generate screening keys, and earn from every show — worldwide.',
    },
    {
      value: 'aggregator_admin',
      title: 'Distributor / Aggregator',
      emoji: '🏛',
      desc: 'Manage venues, create contracts, distribute films across your entire circuit.',
    },
  ];

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <Link to="/" style={s.brandLink}>
          <img src={jantaLogo} alt="Janta Cinema" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
        </Link>
        <Link to="/" style={s.backLink}>← Back to home</Link>
      </div>

      {/* Card */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h1 style={s.title}>Create your account</h1>
          <p style={s.subtitle}>Join Janta Cinema — the secure way to distribute and screen your film, anywhere in the world.</p>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Full Name</label>
          <input
            type="text"
            placeholder="e.g. Anurag Kashyap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={s.input}
            required
          />

          <label style={s.label}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={s.input}
            required
          />

          <label style={s.label}>Password</label>
          <input
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={s.input}
            required
            minLength={6}
          />

          <label style={s.label}>I am a…</label>
          <div style={s.roleGrid}>
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  ...s.roleCard,
                  ...(role === r.value ? s.roleCardActive : {}),
                }}
              >
                <div style={s.roleEmoji}>{r.emoji}</div>
                <div style={s.roleTitle}>{r.title}</div>
                <div style={s.roleDesc}>{r.desc}</div>
                <div style={{ ...s.radioOuter, ...(role === r.value ? s.radioOuterActive : {}) }}>
                  {role === r.value && <div style={s.radioInner} />}
                </div>
              </button>
            ))}
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account →'}
          </button>
        </form>

        <p style={s.loginPrompt}>
          Already have an account?{' '}
          <Link to="/login" style={s.loginLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    borderBottom: '1px solid #1e293b',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  brandEmoji: { fontSize: '1.3rem' },
  brandText: {
    color: '#f59e0b',
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  backLink: {
    color: '#64748b',
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  card: {
    maxWidth: '520px',
    width: '100%',
    margin: '3rem auto',
    padding: '0 1.5rem 2rem',
  },
  cardHeader: {
    marginBottom: '1.75rem',
  },
  title: {
    color: '#f1f5f9',
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.925rem',
    margin: 0,
    lineHeight: '1.5',
  },
  errorBox: {
    background: 'rgba(220,38,38,0.12)',
    border: '1px solid #dc2626',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginTop: '0.75rem',
  },
  input: {
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '4px',
  },
  roleCard: {
    position: 'relative',
    padding: '1rem',
    borderRadius: '10px',
    border: '1.5px solid #334155',
    background: '#1e293b',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  roleCardActive: {
    border: '1.5px solid #f59e0b',
    background: 'rgba(245,158,11,0.06)',
  },
  roleEmoji: {
    fontSize: '1.5rem',
    marginBottom: '8px',
  },
  roleTitle: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    fontWeight: '700',
    marginBottom: '4px',
  },
  roleDesc: {
    color: '#64748b',
    fontSize: '0.75rem',
    lineHeight: '1.4',
    marginBottom: '10px',
  },
  radioOuter: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '4px',
  },
  radioOuterActive: {
    border: '2px solid #f59e0b',
  },
  radioInner: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f59e0b',
  },
  submitBtn: {
    marginTop: '1.25rem',
    padding: '0.875rem',
    borderRadius: '10px',
    border: 'none',
    background: '#f59e0b',
    color: '#0f172a',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  loginPrompt: {
    color: '#64748b',
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '1.5rem 0 0 0',
  },
  loginLink: {
    color: '#f59e0b',
    textDecoration: 'none',
    fontWeight: '600',
  },
};
