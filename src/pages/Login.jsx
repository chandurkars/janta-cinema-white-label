import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <Link to="/" style={s.brandLink}>
          <span style={s.brandEmoji}>🎬</span>
          <span style={s.brandText}>CineVault</span>
        </Link>
        <Link to="/" style={s.backLink}>← Back to home</Link>
      </div>

      {/* Card */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to your CineVault account to manage your films and screenings.</p>
        </div>

        {successMessage && (
          <div style={s.successBox}>
            ✅ {successMessage}
          </div>
        )}
        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={s.input}
            required
            autoFocus
          />

          <label style={s.label}>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={s.input}
            required
          />

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={s.signupPrompt}>
          New to CineVault?{' '}
          <Link to="/signup" style={s.signupLink}>Create an account</Link>
        </p>
      </div>

      {/* Trust signals */}
      <div style={s.trust}>
        <span style={s.trustItem}>🔐 AES-256 encrypted</span>
        <span style={s.trustDot}>·</span>
        <span style={s.trustItem}>🌍 Screen anywhere</span>
        <span style={s.trustDot}>·</span>
        <span style={s.trustItem}>🎟 One-time screening keys</span>
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
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    margin: '4rem auto 2rem',
    padding: '0 1.5rem',
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
  successBox: {
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid #10b981',
    color: '#6ee7b7',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
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
  signupPrompt: {
    color: '#64748b',
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '1.5rem 0 0 0',
  },
  signupLink: {
    color: '#f59e0b',
    textDecoration: 'none',
    fontWeight: '600',
  },
  trust: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: 'auto',
    paddingBottom: '2rem',
    flexWrap: 'wrap',
  },
  trustItem: {
    color: '#475569',
    fontSize: '0.8rem',
  },
  trustDot: {
    color: '#334155',
  },
};
