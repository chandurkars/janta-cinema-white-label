import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import jantaLogo from '../assets/janta-cinema/logo.png';

const navItems = {
  platform_admin: [
    { to: '/dashboard', label: '⬜ Dashboard' },
    { to: '/films', label: '🎬 Films' },
    { to: '/inquiries', label: '📩 Inquiries' },
    { to: '/keys', label: '🔑 Screening Keys' },
    { to: '/analytics', label: '📊 Analytics' },
  ],
  aggregator_admin: [
    { to: '/dashboard', label: '⬜ Dashboard' },
    { to: '/films', label: '🎬 My Films' },
    { to: '/keys', label: '🔑 Screening Keys' },
    { to: '/analytics', label: '📊 Analytics' },
  ],
  filmmaker: [
    { to: '/dashboard', label: '⬜ Dashboard' },
    { to: '/films', label: '🎬 My Films' },
    { to: '/keys', label: '🎟 My Screenings' },
    { to: '/analytics', label: '📊 My Analytics' },
  ],
  venue_operator: [
    { to: '/dashboard', label: '⬜ Dashboard' },
    { to: '/player', label: '▶ Play Film' },
  ],
};

const roleLabels = {
  platform_admin: 'Platform Admin',
  aggregator_admin: 'Distributor',
  filmmaker: 'Filmmaker',
  venue_operator: 'Venue Operator',
};

const roleColors = {
  platform_admin: '#8b5cf6',
  aggregator_admin: '#3b82f6',
  filmmaker: '#10b981',
  venue_operator: '#f59e0b',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[user?.role] || navItems.venue_operator;
  const roleColor = roleColors[user?.role] || '#64748b';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div style={styles.wrapper}>
      <nav style={styles.sidebar}>
        {/* Brand */}
        <div style={styles.brand}>
          <img src={jantaLogo} alt="Janta Cinema" style={styles.brandImg} />
        </div>
        <div style={styles.brandBy}>Powered by VDOJar</div>

        <div style={styles.divider} />

        {/* User info */}
        <div style={styles.userCard}>
          <div style={{ ...styles.avatar, background: roleColor }}>{initials}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name || 'User'}</div>
            <div style={{ ...styles.roleTag, color: roleColor, borderColor: roleColor + '44' }}>
              {roleLabels[user?.role] || user?.role}
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Navigation */}
        <div style={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.link,
                background: isActive ? `${roleColor}18` : 'transparent',
                color: isActive ? roleColor : '#94a3b8',
                borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          ↩ Logout
        </button>
      </nav>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    background: '#1e293b',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
  },
  brandImg: {
    width: '140px',
    height: 'auto',
    objectFit: 'contain',
  },
  brandBy: {
    color: '#475569',
    fontSize: '0.7rem',
    fontWeight: '500',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginTop: '1px',
    marginLeft: '2px',
    marginBottom: '1rem',
  },
  divider: {
    height: '1px',
    background: '#334155',
    margin: '0.75rem 0',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.5rem 0',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    color: '#e2e8f0',
    fontSize: '0.875rem',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleTag: {
    fontSize: '0.65rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    border: '1px solid',
    borderRadius: '4px',
    padding: '1px 6px',
    display: 'inline-block',
    marginTop: '2px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    marginTop: '0.5rem',
  },
  link: {
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: '500',
    transition: 'all 0.15s',
    display: 'block',
  },
  main: {
    flex: 1,
    padding: '2rem 2.5rem',
    overflow: 'auto',
  },
  logoutBtn: {
    marginTop: '1rem',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
};
