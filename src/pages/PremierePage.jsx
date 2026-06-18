import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPremiere, getPremiereStream, premiereHeartbeat } from '../services/api';

export default function PremierePage() {
  const { slug } = useParams();
  const [phase, setPhase] = useState('loading');
  const [info, setInfo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [startOffset, setStartOffset] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    getPublicPremiere(slug)
      .then(r => {
        setInfo(r.data);
        const now = new Date();
        const start = new Date(r.data.scheduled_at);
        const end = new Date(start.getTime() + r.data.window_hours * 3600000);
        if (r.data.status === 'cancelled') { setPhase('cancelled'); return; }
        if (r.data.status === 'failed') { setPhase('error'); setError('This premiere could not be prepared.'); return; }
        if (now < start) setPhase('countdown');
        else if (now < end && ['ready', 'live'].includes(r.data.status)) setPhase('live');
        else if (now >= end || r.data.status === 'ended') setPhase('ended');
        else if (['draft', 'preparing'].includes(r.data.status)) setPhase('preparing');
        else setPhase('countdown');
      })
      .catch(() => { setPhase('error'); setError('Premiere not found.'); });
  }, [slug]);

  // Track any user interaction — once they click/tap anywhere, browser allows unmuted autoplay
  useEffect(() => {
    const mark = () => setUserInteracted(true);
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('touchstart', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('touchstart', mark);
      window.removeEventListener('keydown', mark);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown' || !info) return;
    const target = new Date(info.scheduled_at).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setPhase('live'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown(
        (h > 0 ? `${h}h ` : '') +
        `${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, info]);

  // Fetch stream URL when live
  useEffect(() => {
    if (phase !== 'live') return;
    let cancelled = false;
    const fetchStream = () => {
      getPremiereStream(slug).then(r => {
        if (cancelled) return;
        if (r.data.stream_url) {
          setStreamUrl(r.data.stream_url);
          setStartOffset(r.data.start_offset_seconds || 0);
          setViewerCount(r.data.viewer_count || 0);
        } else if (r.data.message?.includes('ended')) {
          setPhase('ended');
        } else if (r.data.message?.includes('starts at')) {
          setPhase('countdown');
        }
      }).catch(() => {});
    };
    fetchStream();
    const id = setInterval(fetchStream, 300000);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase, slug]);

  // Heartbeat
  useEffect(() => {
    if (phase !== 'live' || !streamUrl) return;
    let cancelled = false;
    const beat = () => {
      const headers = sessionRef.current ? { 'X-Premiere-Session': sessionRef.current } : {};
      premiereHeartbeat(slug, headers).then(r => {
        if (cancelled) return;
        if (r.data.session_token) sessionRef.current = r.data.session_token;
        setViewerCount(r.data.viewer_count || 0);
      }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase, streamUrl, slug]);

  // Screen protection
  useEffect(() => {
    if (phase !== 'live' || !streamUrl) return;
    const onKey = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['s', 'S'].includes(e.key)) ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
      ) { e.preventDefault(); e.stopPropagation(); }
    };
    const onBlur = () => { videoRef.current?.pause(); };
    const onFocus = () => { videoRef.current?.play().catch(() => {}); };
    const onVis = () => { if (document.hidden) videoRef.current?.pause(); };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [phase, streamUrl]);

  // Set video src, seek to live position, autoplay with sound if possible
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !streamUrl) return;
    v.src = streamUrl;
    v.muted = false; // try unmuted first
    const onCanPlay = () => {
      if (startOffset > 0) v.currentTime = startOffset;
      v.play().then(() => {
        // Unmuted autoplay worked (user interacted during countdown)
        setMuted(false);
      }).catch(() => {
        // Browser blocked unmuted autoplay — fall back to muted
        v.muted = true;
        setMuted(true);
        v.play().catch(() => {});
      });
      v.removeEventListener('canplay', onCanPlay);
    };
    v.addEventListener('canplay', onCanPlay);
    return () => v.removeEventListener('canplay', onCanPlay);
  }, [streamUrl, startOffset]);

  const handleUnmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-unmute { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
      {/* Header */}
      <div style={s.header}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🎬</span>
          <span style={s.brandName}>CineVault</span>
        </div>
        <span style={s.premiereTag}>PREMIERE</span>
      </div>

      <div style={s.body}>
        {phase === 'loading' && (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={s.hint}>Loading premiere...</p>
          </div>
        )}

        {phase === 'preparing' && (
          <div style={s.center}>
            <div style={s.spinner} />
            <h2 style={s.title}>{info?.title || 'Premiere'}</h2>
            <p style={s.hint}>This premiere is being prepared. Please check back shortly.</p>
          </div>
        )}

        {phase === 'countdown' && info && (
          <div style={s.center}>
            {info.poster_url && <img src={info.poster_url} alt={info.title} style={s.poster} />}
            <h1 style={s.title}>{info.title}</h1>
            <p style={s.subtitle}>{fmtDate(info.scheduled_at)}</p>
            <div style={s.countdownBox}>
              <div style={s.countdownLabel}>PREMIERE STARTS IN</div>
              <div style={s.countdownTime}>{countdown}</div>
            </div>
            <p style={s.meta}>
              {info.duration_minutes && `${Math.floor(info.duration_minutes)} min`}
            </p>
            {!userInteracted && (
              <button
                onClick={() => setUserInteracted(true)}
                style={s.readyBtn}
              >
                I'm ready to watch
              </button>
            )}
            {userInteracted && (
              <p style={{ color: '#10b981', fontSize: '0.82rem', margin: 0, fontWeight: '600' }}>
                You're all set — film will auto-play with sound when the countdown ends.
              </p>
            )}
          </div>
        )}

        {phase === 'live' && !streamUrl && (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={s.hint}>Connecting to stream...</p>
          </div>
        )}

        {phase === 'live' && streamUrl && (
          <div style={s.playerWrap}>
            <div style={s.playerHeader}>
              <span style={s.playerTitle}>{info?.title || 'Premiere'}</span>
              <div style={s.viewerBadge}>
                <span style={s.viewerDot} />
                {viewerCount} watching
              </div>
            </div>
            <div style={s.videoContainer}>
              <video
                ref={videoRef}
                controls
                autoPlay
                preload="auto"
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={e => e.preventDefault()}
                style={s.video}
              />
              {/* Anti-capture scanline overlay */}
              <div style={s.captureOverlay} />
              {/* Unmute prompt — shown when autoplay started muted */}
              {muted && (
                <button onClick={handleUnmute} style={s.unmuteBtn}>
                  🔇 Tap to unmute
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'ended' && (
          <div style={s.center}>
            <div style={s.endIcon}>🎬</div>
            <h2 style={s.title}>{info?.title || 'Premiere'}</h2>
            <p style={s.hint}>This premiere has ended. Thank you for watching!</p>
          </div>
        )}

        {phase === 'cancelled' && (
          <div style={s.center}>
            <h2 style={s.title}>{info?.title || 'Premiere'}</h2>
            <p style={s.hint}>This premiere has been cancelled.</p>
          </div>
        )}

        {phase === 'error' && (
          <div style={s.center}>
            <p style={{ ...s.hint, color: '#ef4444' }}>{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerText}>Powered by CineVault / VDOJar</span>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    background: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#e2e8f0',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', borderBottom: '1px solid #1e293b',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandIcon: { fontSize: '1.3rem' },
  brandName: { color: '#f1f5f9', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' },
  premiereTag: {
    padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
    letterSpacing: '0.1em', color: '#f59e0b', border: '1px solid #f59e0b55',
    background: 'rgba(245,158,11,0.08)',
  },

  body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' },

  center: { textAlign: 'center', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  poster: { width: '220px', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', marginBottom: '8px' },
  title: { color: '#f1f5f9', fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: '#94a3b8', fontSize: '0.95rem', margin: 0 },
  meta: { color: '#475569', fontSize: '0.85rem', margin: 0 },
  hint: { color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' },
  readyBtn: {
    padding: '12px 32px', borderRadius: '10px', border: 'none',
    background: '#f59e0b', color: '#0f172a', cursor: 'pointer',
    fontWeight: '800', fontSize: '1rem', marginTop: '8px',
    boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
  },

  countdownBox: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
    padding: '1.5rem 2.5rem', marginTop: '8px',
  },
  countdownLabel: {
    color: '#f59e0b', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em',
    marginBottom: '8px',
  },
  countdownTime: {
    color: '#f1f5f9', fontSize: '2.2rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },

  spinner: {
    width: '32px', height: '32px', border: '3px solid #334155', borderTop: '3px solid #f59e0b',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  endIcon: { fontSize: '3rem', marginBottom: '4px' },

  // Player
  playerWrap: { width: '100%', maxWidth: '1100px' },
  playerHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.75rem 0', marginBottom: '4px',
  },
  playerTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: '1.1rem' },
  viewerBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    color: '#94a3b8', fontSize: '0.82rem', fontWeight: '600',
  },
  viewerDot: {
    width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444',
    boxShadow: '0 0 6px #ef4444',
  },
  videoContainer: { position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' },
  video: { width: '100%', display: 'block', borderRadius: '12px' },
  unmuteBtn: {
    position: 'absolute', top: '16px', left: '16px', zIndex: 20,
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: 'rgba(245,158,11,0.95)', color: '#0f172a', cursor: 'pointer',
    fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    animation: 'pulse-unmute 2s ease-in-out infinite',
  },
  captureOverlay: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
    background: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.015) 2px,
      rgba(0,0,0,0.015) 4px
    )`,
  },

  footer: {
    padding: '1rem 2rem', borderTop: '1px solid #1e293b', textAlign: 'center',
  },
  footerText: { color: '#334155', fontSize: '0.75rem' },
};
