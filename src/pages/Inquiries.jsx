import { useEffect, useState } from 'react';
import { getInquiries, updateInquiryStatus } from '../services/api';

const STATUS_COLORS = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  contacted: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  finalized: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  declined: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
};

const STATUSES = ['pending', 'contacted', 'finalized', 'declined'];

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    getInquiries()
      .then(r => setInquiries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const changeStatus = async (id, status) => {
    try {
      await updateInquiryStatus(id, status);
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      showToast(`Status → ${status}`);
    } catch { showToast('Failed to update status'); }
  };

  const grouped = { pending: [], contacted: [], finalized: [], declined: [] };
  inquiries.forEach(i => { (grouped[i.status] || grouped.pending).push(i); });

  const stats = STATUSES.map(s => ({ status: s, count: grouped[s].length }));

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={s.pageTitle}>Screening Inquiries</h2>
          <p style={s.pageSubtitle}>Rental enquiries submitted from the public film pages.</p>
        </div>
        <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats strip */}
      <div style={s.statsStrip}>
        {stats.map(({ status, count }) => {
          const c = STATUS_COLORS[status];
          return (
            <div key={status} style={{ ...s.statCard, background: c.bg, border: `1px solid ${c.border}` }}>
              <span style={{ ...s.statCount, color: c.color }}>{count}</span>
              <span style={{ ...s.statLabel, color: c.color }}>{status}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : inquiries.length === 0 ? (
        <div style={s.empty}>No inquiries yet. They'll appear here once someone submits a rent request from the website.</div>
      ) : (
        <div style={s.list}>
          {inquiries.map(inq => {
            const c = STATUS_COLORS[inq.status] || STATUS_COLORS.pending;
            const isOpen = expanded === inq.id;
            return (
              <div key={inq.id} style={s.card}>
                <div style={s.cardTop} onClick={() => setExpanded(isOpen ? null : inq.id)}>
                  <div style={s.cardLeft}>
                    <span style={{ ...s.statusBadge, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                      {inq.status}
                    </span>
                    <div>
                      <strong style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>{inq.name}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: 8 }}>{inq.email}</span>
                    </div>
                    <div style={s.filmTag}>{inq.film_title || 'Unknown film'}</div>
                    <div style={s.showsTag}>{inq.num_shows} show{inq.num_shows > 1 ? 's' : ''}</div>
                  </div>
                  <div style={s.cardRight}>
                    <span style={s.dateLabel}>{new Date(inq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span style={s.chevron}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={s.cardBody}>
                    <div style={s.detailGrid}>
                      {inq.phone && <Detail label="Phone" value={inq.phone} />}
                      {inq.city && <Detail label="City" value={inq.city} />}
                      {inq.organization && <Detail label="Organisation" value={inq.organization} />}
                      <Detail label="Shows" value={inq.num_shows} />
                      <Detail label="Agreed T&C" value={inq.agreed_terms ? '✅ Yes' : '❌ No'} />
                      <Detail label="Agreed Privacy" value={inq.agreed_privacy ? '✅ Yes' : '❌ No'} />
                    </div>
                    {inq.message && (
                      <div style={s.messageBox}>
                        <span style={s.messageLabel}>Message</span>
                        <p style={s.messageText}>{inq.message}</p>
                      </div>
                    )}
                    <div style={s.actions}>
                      <span style={s.actionsLabel}>Update status:</span>
                      {STATUSES.filter(st => st !== inq.status).map(st => (
                        <button key={st} style={s.statusBtn} onClick={() => changeStatus(inq.id, st)}>
                          → {st}
                        </button>
                      ))}
                      <a
                        href={`mailto:${inq.email}?subject=Re: Screening Enquiry — ${encodeURIComponent(inq.film_title || 'Film')}`}
                        style={s.emailBtn}
                      >
                        ✉ Reply by email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</div>
    </div>
  );
}

const s = {
  pageTitle: { color: '#f1f5f9', margin: '0 0 4px 0' },
  pageSubtitle: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
  refreshBtn: { padding: '0.45rem 1rem', borderRadius: 8, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' },
  statsStrip: { display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' },
  statCard: { flex: '1 1 100px', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 2 },
  statCount: { fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  empty: { color: '#64748b', padding: '2rem', textAlign: 'center', background: '#1e293b', borderRadius: 12, lineHeight: 1.6 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', gap: '0.75rem' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 },
  cardRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  statusBadge: { padding: '2px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  filmTag: { padding: '2px 10px', borderRadius: 99, background: '#334155', color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' },
  showsTag: { padding: '2px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.72rem', border: '1px solid rgba(245,158,11,0.2)' },
  dateLabel: { color: '#475569', fontSize: '0.78rem' },
  chevron: { color: '#475569', fontSize: '0.8rem' },
  cardBody: { borderTop: '1px solid #334155', padding: '1rem', background: '#0f172a' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' },
  messageBox: { background: '#1e293b', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' },
  messageLabel: { color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 },
  messageText: { color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 },
  actions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  actionsLabel: { color: '#475569', fontSize: '0.78rem' },
  statusBtn: { padding: '4px 12px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem' },
  emailBtn: { padding: '4px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.78rem', textDecoration: 'none', cursor: 'pointer' },
  toast: { position: 'fixed', top: '1rem', right: '1rem', background: '#10b981', color: 'white', padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', zIndex: 9999 },
};
