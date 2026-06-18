import { useEffect, useState } from 'react';
import {
  getScreeningKeys, revokeScreeningKey, reactivateScreeningKey, getContracts,
  getFilms, createFilmmakerKey, createScreeningKeyPair, addKeyToGroup,
  createPremiere, getPremieres, cancelPremiere,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ── helpers ─────────────────────────────────────────────────────────

/** Wraps every occurrence of `query` in `text` with a yellow highlight span. */
function Highlight({ text, query }) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#f59e0b', color: '#0f172a', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function withTz(dt) {
  const off = new Date().getTimezoneOffset();
  const h = String(Math.abs(Math.floor(off / 60))).padStart(2, '0');
  const m = String(Math.abs(off % 60)).padStart(2, '0');
  return `${dt}:00${off <= 0 ? '+' : '-'}${h}:${m}`;
}

function fmtDate(iso) {
  if (!iso) return '?';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtScheduledAt(iso) {
  if (!iso) return '?';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function humanStatus(raw) {
  return { created: 'Ready', activated: 'In Use', consumed: 'Used', expired: 'Expired', revoked: 'Revoked' }[raw] || raw;
}

function statusColor(raw) {
  return { created: '#3b82f6', activated: '#f59e0b', consumed: '#10b981', expired: '#64748b', revoked: '#ef4444' }[raw] || '#64748b';
}

function cardStatus(from, to, showKeys) {
  const now = new Date();
  if (showKeys.every(k => k.status === 'consumed')) return { label: 'All Shows Done', color: '#10b981' };
  if (new Date(to) < now) return { label: 'Expired', color: '#64748b' };
  if (new Date(from) > now) return { label: 'Upcoming', color: '#3b82f6' };
  return { label: 'Active', color: '#f59e0b' };
}

// A screening is "finished" when every show key is done OR the valid window has passed
function isFinished(showKeys, validTo) {
  const done = ['consumed', 'expired', 'revoked'];
  const allKeysDone = showKeys.length > 0 && showKeys.every(k => done.includes(k.status));
  const windowExpired = validTo && new Date(validTo) < new Date();
  return allKeysDone || windowExpired;
}

// Latest activity timestamp across all show keys in the group
function lastActivityAt(showKeys) {
  const times = showKeys
    .map(k => k.consumed_at || k.activated_at)
    .filter(Boolean)
    .map(t => new Date(t).getTime());
  return times.length ? Math.max(...times) : 0;
}

function buildScreenings(keys) {
  const groups = {};
  const singles = [];
  for (const k of keys) {
    if (k.pair_id) {
      if (!groups[k.pair_id]) groups[k.pair_id] = { dlKey: null, showKeys: [] };
      if (k.key_type === 'download') groups[k.pair_id].dlKey = k;
      else groups[k.pair_id].showKeys.push(k);
    } else {
      singles.push(k);
    }
  }
  for (const g of Object.values(groups)) {
    g.showKeys.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  const all = Object.values(groups).sort((a, b) => {
    const aTime = new Date((a.dlKey || a.showKeys[0])?.created_at || 0);
    const bTime = new Date((b.dlKey || b.showKeys[0])?.created_at || 0);
    return bTime - aTime;
  });

  // Split into active cards vs finished list
  const getValidTo = g => (g.dlKey || g.showKeys[0])?.valid_to;
  const activeScreenings = all.filter(g => !isFinished(g.showKeys, getValidTo(g)));
  const finishedScreenings = all
    .filter(g => isFinished(g.showKeys, getValidTo(g)))
    .sort((a, b) => lastActivityAt(b.showKeys) - lastActivityAt(a.showKeys)); // most recently finished first

  singles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { activeScreenings, finishedScreenings, singles };
}

const BASE = 'https://vdojar.in';

function downloadWAMsg(dlKey, filmTitle, slug) {
  if (!dlKey || !slug) return null;
  return [
    `Hi! For the screening of *${filmTitle}*`,
    ``,
    `Please download the film *before* show day using the details below:`,
    ``,
    `📥 Download Link: ${BASE}/film/${slug}/download`,
    `🔑 Download Key: ${dlKey.key_token}`,
    ``,
    `Open the link → enter the key → download the film. Keep the file ready for show day.`,
  ].join('\n');
}

function showWAMsg(sc, filmTitle, slug, showNum, total) {
  if (!slug) return null;
  return [
    `🎬 *${filmTitle}* — Show ${showNum}${total > 1 ? ` of ${total}` : ''}`,
    ``,
    `Screening Link: ${BASE}/film/${slug}/screen`,
    `🔑 Screening Key: ${sc.key_token}`,
    ``,
    `Open the link → select the downloaded film → enter the key → press Start. Enjoy the show! 🎉`,
  ].join('\n');
}

function CopyIcon({ onClick }) {
  return (
    <button onClick={onClick} title="Copy to clipboard" style={s.copyIconBtn}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
  );
}

// ── main ─────────────────────────────────────────────────────────────

export default function ScreeningKeys() {
  const { user, hasAdditionalRole } = useAuth();
  const isFilmmaker = user?.role === 'filmmaker';
  const isDistributor = user?.role === 'aggregator_admin';
  const canCreate = isFilmmaker || isDistributor || hasAdditionalRole('key_management_admin');

  const [keys, setKeys] = useState([]);
  const [films, setFilms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [openHistory, setOpenHistory] = useState({});
  const [toast, setToast] = useState({ msg: '', ok: true });
  const [pastSearch, setPastSearch] = useState('');

  const toggleHistory = (id) => setOpenHistory(p => ({ ...p, [id]: !p[id] }));

  const [fmForm, setFmForm] = useState({ film_id: '', valid_from: '', valid_to: '', num_shows: 1 });
  const [aggForm, setAggForm] = useState({ contract_id: '', valid_from: '', valid_to: '', num_streaming_keys: 1 });

  // Premiere state
  const [showPremiereForm, setShowPremiereForm] = useState(false);
  const [premieres, setPremieres] = useState([]);
  const [premiereForm, setPremiereForm] = useState({ film_id: '', title: '', scheduled_at: '', window_hours: 4 });

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast({ msg: '' }), 3500); };
  const load = () => getScreeningKeys().then(r => setKeys(r.data)).catch(() => {});

  const loadPremieres = () => getPremieres().then(r => setPremieres(r.data)).catch(() => {});

  useEffect(() => {
    load();
    loadPremieres();
    if (isFilmmaker) getFilms().then(r => setFilms(r.data)).catch(() => {});
    else {
      getContracts().then(r => setContracts(r.data.filter(c => c.status === 'confirmed'))).catch(() => {});
      getFilms().then(r => setFilms(r.data)).catch(() => {});
    }
  }, []);

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this? The venue will no longer be able to use it.')) return;
    try { await revokeScreeningKey(id); notify('Revoked'); load(); }
    catch (e) { notify(e.response?.data?.detail || 'Failed', false); }
  };

  const handleReactivate = async (id, token) => {
    if (!confirm(`Allow the venue to re-download the film using key ${token}? The key will be reset so it can be used again.`)) return;
    try { await reactivateScreeningKey(id); notify('Re-download enabled ✓'); load(); }
    catch (e) { notify(e.response?.data?.detail || 'Failed', false); }
  };

  const handleAddKey = async (pairId, keyType) => {
    try {
      await addKeyToGroup(pairId, keyType);
      notify(keyType === 'download' ? 'New download key added ✓' : 'New show key added ✓');
      load();
    } catch (e) { notify(e.response?.data?.detail || 'Failed to add key', false); }
  };

  const copy = (text, label) => { navigator.clipboard.writeText(text); notify(`${label} copied!`); };

  const handleFilmmakerCreate = async (e) => {
    e.preventDefault();
    try {
      await createFilmmakerKey({ film_id: fmForm.film_id, valid_from: withTz(fmForm.valid_from), valid_to: withTz(fmForm.valid_to), max_plays: 1, num_shows: fmForm.num_shows });
      notify('Screening scheduled! 🎬');
      setShowForm(false);
      setFmForm({ film_id: '', valid_from: '', valid_to: '', num_shows: 1 });
      load();
    } catch (e) { notify(e.response?.data?.detail || 'Failed to schedule', false); }
  };

  const handleAggCreate = async (e) => {
    e.preventDefault();
    try {
      await createScreeningKeyPair({ ...aggForm, valid_from: withTz(aggForm.valid_from), valid_to: withTz(aggForm.valid_to), max_plays: 1 });
      notify('Keys created! 🎉');
      setShowForm(false);
      setAggForm({ contract_id: '', valid_from: '', valid_to: '', num_streaming_keys: 1 });
      load();
    } catch (e) { notify(e.response?.data?.detail || 'Failed', false); }
  };

  const handlePremiereCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        film_id: premiereForm.film_id,
        scheduled_at: withTz(premiereForm.scheduled_at),
        window_hours: premiereForm.window_hours,
      };
      if (premiereForm.title) payload.title = premiereForm.title;
      await createPremiere(payload);
      notify('Premiere scheduled! 🎬');
      setShowPremiereForm(false);
      setPremiereForm({ film_id: '', title: '', scheduled_at: '', window_hours: 4 });
      loadPremieres();
    } catch (e) { notify(e.response?.data?.detail || 'Failed to create premiere', false); }
  };

  const handleCancelPremiere = async (id) => {
    if (!confirm('Cancel this premiere? The stream will no longer be available.')) return;
    try { await cancelPremiere(id); notify('Premiere cancelled'); loadPremieres(); }
    catch (e) { notify(e.response?.data?.detail || 'Failed', false); }
  };

  const { activeScreenings, finishedScreenings, singles } = buildScreenings(keys);
  const total = activeScreenings.length + finishedScreenings.length + singles.length;

  return (
    <div style={s.page}>
      {toast.msg && (
        <div style={{ ...s.toast, background: toast.ok ? '#10b981' : '#ef4444' }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={s.hdr}>
        <div>
          <h2 style={s.hdrTitle}>{isFilmmaker ? 'My Screenings' : 'Screening Keys'}</h2>
          <p style={s.hdrSub}>{total === 0 ? 'No screenings yet' : `${total} screening${total !== 1 ? 's' : ''}`}</p>
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => { setShowForm(v => !v); if (!showForm) setShowPremiereForm(false); }} style={s.newBtn}>
              {showForm ? '✕ Cancel' : '+ Schedule Screening'}
            </button>
            <button onClick={() => { setShowPremiereForm(v => !v); if (!showPremiereForm) setShowForm(false); }} style={s.premiereBtn}>
              {showPremiereForm ? '✕ Cancel' : '▶ Schedule Premiere'}
            </button>
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={s.formBox}>
          <div style={s.formBoxTitle}>Schedule a Screening</div>
          {isFilmmaker ? (
            <form onSubmit={handleFilmmakerCreate} style={s.form}>
              <div style={s.row}>
                <Field label="Film">
                  <select value={fmForm.film_id} onChange={e => setFmForm({ ...fmForm, film_id: e.target.value })} style={s.inp} required>
                    <option value="">Select your film…</option>
                    {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </Field>
              </div>
              <div style={s.row}>
                <Field label="Screening window opens">
                  <input type="datetime-local" value={fmForm.valid_from} onChange={e => setFmForm({ ...fmForm, valid_from: e.target.value })} style={s.inp} required />
                </Field>
                <Field label="Screening window closes">
                  <input type="datetime-local" value={fmForm.valid_to} onChange={e => setFmForm({ ...fmForm, valid_to: e.target.value })} style={s.inp} required />
                </Field>
                <Field label="Number of shows" hint="One key per show">
                  <input type="number" min="1" max="20" value={fmForm.num_shows} onChange={e => setFmForm({ ...fmForm, num_shows: parseInt(e.target.value) || 1 })} style={{ ...s.inp, width: '80px' }} />
                </Field>
              </div>
              <button type="submit" style={s.submitBtn}>Schedule →</button>
            </form>
          ) : (
            <form onSubmit={handleAggCreate} style={s.form}>
              <div style={s.row}>
                <Field label="Contract">
                  <select value={aggForm.contract_id} onChange={e => { const c = contracts.find(x => x.id === e.target.value); setAggForm({ ...aggForm, contract_id: e.target.value, num_streaming_keys: c?.num_shows || 1 }); }} style={s.inp} required>
                    <option value="">Select contract…</option>
                    {contracts.map(c => <option key={c.id} value={c.id}>{c.film_title} @ {c.venue_name} · {c.num_shows} show{c.num_shows !== 1 ? 's' : ''}</option>)}
                  </select>
                </Field>
              </div>
              <div style={s.row}>
                <Field label="Window opens"><input type="datetime-local" value={aggForm.valid_from} onChange={e => setAggForm({ ...aggForm, valid_from: e.target.value })} style={s.inp} required /></Field>
                <Field label="Window closes"><input type="datetime-local" value={aggForm.valid_to} onChange={e => setAggForm({ ...aggForm, valid_to: e.target.value })} style={s.inp} required /></Field>
              </div>
              <button type="submit" style={s.submitBtn}>Generate Keys →</button>
            </form>
          )}
        </div>
      )}

      {/* Premiere form */}
      {showPremiereForm && (
        <div style={{ ...s.formBox, borderColor: '#7c3aed44' }}>
          <div style={s.formBoxTitle}>Schedule a Premiere</div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1rem', lineHeight: '1.5' }}>
            Stream your film to hundreds of viewers simultaneously. No download required — just share the premiere link.
          </p>
          <form onSubmit={handlePremiereCreate} style={s.form}>
            <div style={s.row}>
              <Field label="Film">
                <select value={premiereForm.film_id} onChange={e => setPremiereForm({ ...premiereForm, film_id: e.target.value })} style={s.inp} required>
                  <option value="">Select film…</option>
                  {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </Field>
              <Field label="Title override" hint="Optional — defaults to film title">
                <input type="text" value={premiereForm.title} onChange={e => setPremiereForm({ ...premiereForm, title: e.target.value })} style={s.inp} placeholder="e.g. Maharashtra Schools Premiere" />
              </Field>
            </div>
            <div style={s.row}>
              <Field label="Premiere date & time">
                <input type="datetime-local" value={premiereForm.scheduled_at} onChange={e => setPremiereForm({ ...premiereForm, scheduled_at: e.target.value })} style={s.inp} required />
              </Field>
              <Field label="Stream window" hint="How long the stream stays available">
                <select value={premiereForm.window_hours} onChange={e => setPremiereForm({ ...premiereForm, window_hours: parseInt(e.target.value) })} style={{ ...s.inp, width: '120px' }}>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </Field>
            </div>
            <button type="submit" style={s.premiereSubmitBtn}>Schedule Premiere →</button>
          </form>
        </div>
      )}

      {/* Premieres list */}
      {premieres.length > 0 && (
        <div style={{ ...s.historyBox, marginBottom: '1.25rem' }}>
          <div style={s.historyHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={s.historyTitle}>Premieres</span>
              <span style={s.historyCount}>{premieres.length}</span>
            </div>
          </div>
          {premieres.map((p, i) => {
            const statusColors = { draft: '#64748b', preparing: '#f59e0b', ready: '#3b82f6', live: '#ef4444', ended: '#475569', failed: '#ef4444', cancelled: '#475569' };
            const statusLabels = { draft: 'Preparing…', preparing: 'Preparing…', ready: 'Ready', live: 'LIVE', ended: 'Ended', failed: 'Failed', cancelled: 'Cancelled' };
            const color = statusColors[p.status] || '#64748b';
            const canCancel = !['ended', 'cancelled'].includes(p.status);
            return (
              <div key={p.id} style={{ padding: '0.75rem 1.25rem', borderBottom: i < premieres.length - 1 ? '1px solid #1e293b' : 'none', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>▶ {p.title}</div>
                  <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>{fmtScheduledAt(p.scheduled_at)} · {p.window_hours}h window</div>
                </div>
                <span style={{ ...s.miniPill, color, borderColor: `${color}44`, flexShrink: 0 }}>
                  {p.status === 'live' && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginRight: '5px', boxShadow: '0 0 4px #ef4444' }} />}
                  {statusLabels[p.status]}
                  {p.status === 'live' && p.viewer_count > 0 && ` · ${p.viewer_count} watching`}
                </span>
                {p.share_url && !['cancelled', 'failed'].includes(p.status) && (
                  <button onClick={() => copy(p.share_url, 'Premiere link')} style={{ ...s.addKeyBtn, color: '#7c3aed', borderColor: '#7c3aed44' }}>
                    Copy Link
                  </button>
                )}
                {p.share_url && !['cancelled', 'failed', 'ended'].includes(p.status) && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`🎬 *${p.title}* — Premiere Screening\n\nWatch here: ${p.share_url}\n\nDate: ${fmtScheduledAt(p.scheduled_at)}\n\nJust open the link at the scheduled time. No download needed!`)}`}
                    target="_blank" rel="noreferrer" style={{ ...s.waBtn, fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    💬 WhatsApp
                  </a>
                )}
                {canCancel && (
                  <button onClick={() => handleCancelPremiere(p.id)} style={{ ...s.revokeBtn, fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}>Cancel</button>
                )}
                {p.status === 'failed' && p.preparation_error && (
                  <span style={{ color: '#ef4444', fontSize: '0.72rem', flex: '0 0 100%' }}>Error: {p.preparation_error}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !showForm && (
        <div style={s.empty}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
          <div style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>No screenings yet</div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {isFilmmaker ? 'Schedule your first screening to get shareable links and keys for your venue.' : 'Create keys from confirmed contracts.'}
          </div>
          {canCreate && <button onClick={() => setShowForm(true)} style={s.submitBtn}>+ Schedule Screening</button>}
        </div>
      )}

      {/* ── Active screening cards (big cards) ── */}
      {activeScreenings.map((sc, i) => {
        const { dlKey, showKeys } = sc;
        const anyKey = dlKey || showKeys[0];
        const filmTitle = anyKey?.film_title || 'Unknown Film';
        const slug = anyKey?.film_slug;
        const from = anyKey?.valid_from;
        const to = anyKey?.valid_to;
        const cst = cardStatus(from, to, showKeys);
        const isWindowOpen = new Date(to) > new Date();
        const dlUrl = slug ? `${BASE}/film/${slug}/download` : null;
        const waMsg = downloadWAMsg(dlKey, filmTitle, slug);

        return (
          <div key={i} style={s.card}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardTitle}>🎬 {filmTitle}</div>
                <div style={s.cardMeta}>{fmtDate(from)} → {fmtDate(to)} · {showKeys.length} show{showKeys.length !== 1 ? 's' : ''}</div>
                <div style={s.cardScheduled}>Scheduled: {fmtScheduledAt(anyKey?.created_at)}</div>
              </div>
              <div style={{ ...s.statusPill, color: cst.color, border: `1px solid ${cst.color}55` }}>{cst.label}</div>
            </div>

            {/* Before the Show */}
            <div style={s.section}>
              <div style={s.sectionTitle}>Steps Before the Show</div>
              <p style={s.sectionDesc}>Share the download link and key with your venue owner so they can download the encrypted film before the event.</p>
              {dlUrl && dlKey ? (
                <div style={s.infoRows}>
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Copy Download Link</span>
                    <CopyIcon onClick={() => copy(dlUrl, 'Download link')} />
                  </div>
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Copy Download Key</span>
                    <span style={s.keyText}>{dlKey.key_token}</span>
                    <CopyIcon onClick={() => copy(dlKey.key_token, 'Download key')} />
                  </div>
                </div>
              ) : (
                <p style={s.warn}>⚠ Link not available — please re-upload the film to get shareable links.</p>
              )}
              <div style={s.actionRow}>
                {waMsg && (
                  <a href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer" style={s.waBtn}>
                    💬 Send Download Link &amp; Key on WhatsApp
                  </a>
                )}
                {dlKey && dlKey.status === 'created' && (
                  <button style={s.revokeBtn} onClick={() => handleRevoke(dlKey.id)}>Revoke</button>
                )}
                {dlKey && (dlKey.status === 'activated' || dlKey.status === 'consumed') && (
                  <button style={s.reactivateBtn} onClick={() => handleReactivate(dlKey.id, dlKey.key_token)}>↻ Allow Re-download</button>
                )}
                {dlKey && dlKey.pair_id && isWindowOpen && (
                  <button style={s.addKeyBtn} onClick={() => handleAddKey(dlKey.pair_id, 'download')}>+ New Download Key</button>
                )}
              </div>
            </div>

            {/* On Screening Day */}
            <div style={{ ...s.section, borderTop: '1px solid #0f172a' }}>
              <div style={s.sectionTitle}>On Screening Day</div>
              <p style={s.sectionDesc}>Send each show's key on the day of the screening only. Every key works exactly once.</p>
              <div style={s.showGrid}>
                {showKeys.map((sk, j) => {
                  const scUrl = slug ? `${BASE}/film/${slug}/screen` : null;
                  const msg = showWAMsg(sk, filmTitle, slug, j + 1, showKeys.length);
                  return (
                    <div key={sk.id} style={s.showCard}>
                      <div style={s.showCardHead}>
                        <span style={s.showNum}>Show {j + 1}</span>
                        <span style={{ color: statusColor(sk.status), fontSize: '0.75rem', fontWeight: '700' }}>
                          {humanStatus(sk.status)}
                        </span>
                      </div>
                      <div style={s.showInfoRows}>
                        {scUrl && (
                          <div style={s.showInfoRow}>
                            <span style={s.showInfoLabel}>Copy Screening URL</span>
                            <CopyIcon onClick={() => copy(scUrl, 'Screening URL')} />
                          </div>
                        )}
                        <div style={s.showKeyInfoRow}>
                          <span style={s.showInfoLabel}>Copy Screening Key</span>
                          <div style={s.showKeyLine}>
                            <span style={s.showKeyText}>{sk.key_token}</span>
                            <CopyIcon onClick={() => copy(sk.key_token, `Show ${j + 1} key`)} />
                          </div>
                        </div>
                      </div>
                      <div style={s.showCardActions}>
                        {msg && (
                          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" style={s.waBtn}>
                            💬 WhatsApp
                          </a>
                        )}
                        {(sk.status === 'created' || sk.status === 'activated') && (
                          <button style={s.revokeBtn} onClick={() => handleRevoke(sk.id)}>Revoke</button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* + Add Show button — only when screening window hasn't expired */}
                {anyKey?.pair_id && isWindowOpen && (
                  <div style={s.addShowCard} onClick={() => handleAddKey(anyKey.pair_id, 'streaming')}>
                    <span style={s.addShowPlus}>+</span>
                    <span style={s.addShowLabel}>Add Show</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Finished screenings — compact list ── */}
      {finishedScreenings.length > 0 && (
        <div style={s.historyBox}>
          <div style={s.historyHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={s.historyTitle}>Past Screenings</span>
              <span style={s.historyCount}>{finishedScreenings.length}</span>
            </div>
            {/* Search bar */}
            <div style={s.searchWrap}>
              <svg style={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                style={s.searchInput}
                placeholder="Search film or key…"
                value={pastSearch}
                onChange={e => setPastSearch(e.target.value)}
              />
              {pastSearch && (
                <button style={s.searchClear} onClick={() => setPastSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Column labels */}
          <div style={s.histColHeader}>
            <span style={{ flex: 3 }}>Film</span>
            <span style={{ flex: 2 }}>Window</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Shows</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Last Activity</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Result</span>
          </div>

          {(() => {
            const q = pastSearch.trim().toLowerCase();
            const filtered = q
              ? finishedScreenings.filter(sc => {
                  const anyKey = sc.dlKey || sc.showKeys[0];
                  const titleMatch = (anyKey?.film_title || '').toLowerCase().includes(q);
                  const tokenMatch = [sc.dlKey, ...sc.showKeys]
                    .filter(Boolean)
                    .some(k => k.key_token.toLowerCase().includes(q));
                  return titleMatch || tokenMatch;
                })
              : finishedScreenings;

            if (filtered.length === 0) return (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                No results for <strong style={{ color: '#64748b' }}>"{pastSearch}"</strong>
              </div>
            );

            return filtered.map((sc, i) => {
            const { dlKey, showKeys } = sc;
            const anyKey = dlKey || showKeys[0];
            const pairId = anyKey?.pair_id || i;
            const filmTitle = anyKey?.film_title || 'Unknown Film';
            const slug = anyKey?.film_slug;
            const from = anyKey?.valid_from;
            const to = anyKey?.valid_to;
            const usedCount = showKeys.filter(k => k.status === 'consumed').length;
            const revokedCount = showKeys.filter(k => k.status === 'revoked').length;
            const lastTs = lastActivityAt(showKeys);
            const resultColor = usedCount === showKeys.length ? '#10b981' : revokedCount > 0 ? '#ef4444' : '#64748b';
            const resultLabel = usedCount === showKeys.length ? 'All Done' : revokedCount > 0 ? 'Revoked' : 'Expired';
            // Auto-expand when searching, otherwise respect manual toggle
            const isOpen = q ? true : !!openHistory[pairId];

            return (
              <div key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1e293b' : 'none' }}>

                {/* Collapsed summary row — click to expand */}
                <div style={{ ...s.histRow, cursor: 'pointer' }} onClick={() => toggleHistory(pairId)}>
                  <span style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={s.histFilm}><Highlight text={filmTitle} query={q} /></span>
                    <span style={s.histSched}>Scheduled {fmtDateTime(anyKey?.created_at)}</span>
                  </span>
                  <span style={{ flex: 2, color: '#475569', fontSize: '0.78rem' }}>
                    {fmtDate(from)} → {fmtDate(to)}
                  </span>
                  <span style={{ flex: 1, textAlign: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>
                    {usedCount}/{showKeys.length}
                  </span>
                  <span style={{ flex: 1, textAlign: 'center', color: '#475569', fontSize: '0.75rem' }}>
                    {lastTs ? fmtDateTime(new Date(lastTs).toISOString()) : '—'}
                  </span>
                  <span style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ ...s.miniPill, color: resultColor, borderColor: `${resultColor}44` }}>
                      {resultLabel}
                    </span>
                  </span>
                  <span style={{ color: '#334155', fontSize: '0.7rem', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>

                {/* Expanded key detail */}
                {isOpen && (
                  <div style={s.histExpanded}>
                    {/* Download key */}
                    {dlKey && (
                      <div style={s.histKeyRow}>
                        <span style={s.histKeyType}>📥 Download</span>
                        <code style={s.histKeyCode}><Highlight text={dlKey.key_token} query={q} /></code>
                        <span style={{ ...s.miniPill, color: statusColor(dlKey.status), borderColor: `${statusColor(dlKey.status)}44`, marginLeft: 'auto', flexShrink: 0 }}>
                          {humanStatus(dlKey.status)}
                          {dlKey.consumed_at && <span style={s.histWhen}> · {fmtDateTime(dlKey.consumed_at)}</span>}
                          {dlKey.revoked_at && <span style={s.histWhen}> · {fmtDateTime(dlKey.revoked_at)}</span>}
                          {dlKey.activated_at && !dlKey.consumed_at && !dlKey.revoked_at && <span style={s.histWhen}> · {fmtDateTime(dlKey.activated_at)}</span>}
                        </span>
                      </div>
                    )}
                    {/* Show keys */}
                    {showKeys.map((sk, j) => (
                      <div key={sk.id} style={s.histKeyRow}>
                        <span style={s.histKeyType}>Show {j + 1}</span>
                        <code style={s.histKeyCode}><Highlight text={sk.key_token} query={q} /></code>
                        <span style={{ ...s.miniPill, color: statusColor(sk.status), borderColor: `${statusColor(sk.status)}44`, marginLeft: 'auto', flexShrink: 0 }}>
                          {humanStatus(sk.status)}
                          {sk.consumed_at && <span style={s.histWhen}> · {fmtDateTime(sk.consumed_at)}</span>}
                          {sk.revoked_at && <span style={s.histWhen}> · {fmtDateTime(sk.revoked_at)}</span>}
                          {sk.activated_at && !sk.consumed_at && !sk.revoked_at && <span style={s.histWhen}> · started {fmtDateTime(sk.activated_at)}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
          })()}
        </div>
      )}

      {/* Legacy single keys */}
      {singles.length > 0 && (
        <div style={s.legacyBox}>
          <div style={s.legacyTitle}>Other Keys</div>
          {singles.map(k => (
            <div key={k.id} style={s.legacyRow}>
              <span style={{ color: '#e2e8f0', flex: 2, fontSize: '0.875rem' }}>{k.film_title || '—'}</span>
              <span style={s.showKeyText}>{k.key_token}</span>
              <CopyIcon onClick={() => copy(k.key_token, 'Key')} />
              <span style={{ color: statusColor(k.status), fontSize: '0.75rem', fontWeight: '600' }}>{humanStatus(k.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
      <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
      {hint && <span style={{ color: '#475569', fontSize: '0.7rem' }}>{hint}</span>}
    </div>
  );
}

const s = {
  page: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", maxWidth: '800px' },

  toast: { position: 'fixed', top: '1.25rem', right: '1.25rem', color: 'white', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },

  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  hdrTitle: { color: '#f1f5f9', fontSize: '1.5rem', fontWeight: '700', margin: '0 0 3px', letterSpacing: '-0.02em' },
  hdrSub: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
  newBtn: { padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0f172a', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' },
  premiereBtn: { padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #7c3aed55', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' },
  premiereSubmitBtn: { alignSelf: 'flex-start', padding: '0.65rem 1.4rem', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' },

  formBox: { background: '#1e293b', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #334155' },
  formBoxTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  inp: { padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  submitBtn: { alignSelf: 'flex-start', padding: '0.65rem 1.4rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' },

  empty: { background: '#1e293b', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center', border: '1px dashed #334155' },

  // ── Active cards ──
  card: { background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', marginBottom: '1.25rem', overflow: 'hidden' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#0f172a', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '0.5rem' },
  cardTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '3px' },
  cardMeta: { color: '#64748b', fontSize: '0.78rem' },
  cardScheduled: { color: '#475569', fontSize: '0.7rem', marginTop: '3px' },
  statusPill: { padding: '0.22rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },

  section: { padding: '1.25rem 1.5rem' },
  sectionTitle: { color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' },
  sectionDesc: { color: '#64748b', fontSize: '0.8rem', margin: '0 0 1rem 0', lineHeight: '1.6' },

  infoRows: { display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '1rem', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.7rem 1rem', borderBottom: '1px solid #1e293b' },
  infoLabel: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', minWidth: '120px' },
  keyText: { fontFamily: 'monospace', color: '#f1f5f9', fontSize: '0.82rem', flex: 1, letterSpacing: '0.03em' },

  actionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  warn: { color: '#f59e0b', fontSize: '0.8rem', margin: '0 0 1rem' },

  showGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' },
  showCard: { background: '#0f172a', borderRadius: '10px', padding: '1rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' },
  showCardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  showNum: { color: '#94a3b8', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' },
  showKeyText: { fontFamily: 'monospace', color: '#f1f5f9', fontSize: '0.82rem', fontWeight: '600', letterSpacing: '0.03em', flex: 1, whiteSpace: 'nowrap' },
  showInfoRows: { display: 'flex', flexDirection: 'column', gap: '0', background: '#0a1628', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden', marginBottom: '2px' },
  showInfoRow: { display: 'flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.6rem', borderBottom: '1px solid #1e293b' },
  showKeyInfoRow: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.45rem 0.6rem' },
  showKeyLine: { display: 'flex', alignItems: 'center', gap: '6px' },
  showInfoLabel: { color: '#64748b', fontSize: '0.7rem', fontWeight: '600', whiteSpace: 'nowrap' },
  showCardActions: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' },

  copyIconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px', flexShrink: 0 },

  // Add Show card (dashed placeholder in show grid)
  addShowCard: { background: 'transparent', borderRadius: '10px', padding: '1rem', border: '1px dashed #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', minHeight: '100px', transition: 'border-color 0.15s, background 0.15s' },
  addShowPlus: { color: '#f59e0b', fontSize: '1.5rem', fontWeight: '300', lineHeight: 1 },
  addShowLabel: { color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

  // Add key button (in download section)
  addKeyBtn: { padding: '0.5rem 0.85rem', borderRadius: '7px', border: '1px dashed #334155', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' },

  waBtn: { padding: '0.5rem 1rem', borderRadius: '7px', border: '1px solid rgba(37,211,102,0.4)', background: 'rgba(37,211,102,0.08)', color: '#25d366', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' },
  revokeBtn: { padding: '0.5rem 0.85rem', borderRadius: '7px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' },
  reactivateBtn: { padding: '0.5rem 0.85rem', borderRadius: '7px', border: 'none', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' },

  // ── Past screenings list ──
  historyBox: { background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', marginTop: '0.5rem' },
  historyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '0.65rem 1.25rem', background: '#0f172a', borderBottom: '1px solid #334155' },
  historyTitle: { color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' },
  historyCount: { background: '#1e293b', color: '#475569', fontSize: '0.7rem', fontWeight: '700', padding: '1px 7px', borderRadius: '10px' },

  // Search bar
  searchWrap: { display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.35rem 0.65rem', minWidth: '200px' },
  searchIcon: { width: '13px', height: '13px', color: '#475569', flexShrink: 0 },
  searchInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.8rem', flex: 1, minWidth: 0 },
  searchClear: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0 2px', fontSize: '0.75rem', lineHeight: 1, flexShrink: 0 },
  histColHeader: { display: 'flex', padding: '0.4rem 1.25rem', color: '#334155', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e293b' },
  histRow: { display: 'flex', alignItems: 'center', padding: '0.65rem 1.25rem', gap: '0.5rem' },
  histFilm: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  histSched: { color: '#334155', fontSize: '0.68rem' },
  miniPill: { display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '20px', border: '1px solid', fontSize: '0.7rem', fontWeight: '700' },

  // ── History expanded ──
  histExpanded: { background: '#0a1628', borderTop: '1px solid #1e293b', padding: '0.5rem 1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0' },
  histKeyRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.45rem 0', borderBottom: '1px solid #0f172a', flexWrap: 'wrap' },
  histKeyType: { color: '#475569', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '72px', flexShrink: 0 },
  histKeyCode: { fontFamily: 'monospace', color: '#64748b', fontSize: '0.78rem', letterSpacing: '0.03em', flex: '1 1 auto', minWidth: 0 },
  histWhen: { color: '#475569', fontWeight: '400', fontSize: '0.68rem' },

  legacyBox: { background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', padding: '1rem 1.25rem', marginTop: '1rem' },
  legacyTitle: { color: '#64748b', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
  legacyRow: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #334155', flexWrap: 'wrap' },
};
