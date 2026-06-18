import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Building2, CalendarClock, ChevronDown,
  CloudDownload, FileKey2, KeyRound, LockKeyhole, MonitorPlay,
  Play, ShieldCheck, Sparkles, UploadCloud,
} from 'lucide-react';

import logo      from '../assets/janta-cinema/logo.png';
import heroImg   from '../assets/janta-cinema/hero.jpg';
import vikram    from '../assets/janta-cinema/vikram-vedha.jpg';
import august    from '../assets/janta-cinema/august-1947.jpg';
import fakir     from '../assets/janta-cinema/fakir-venice.jpg';
import shamshera from '../assets/janta-cinema/shamshera.jpg';
import band      from '../assets/janta-cinema/sabki-bajegi-band.jpg';
import film83    from '../assets/janta-cinema/83.jpg';

// ── Brand tokens ──────────────────────────────────────────────────────
const C = {
  red:        '#ee1839',
  redDark:    '#a70f28',
  gold:       '#f1c86b',
  ink:        '#050507',
  panel:      '#111114',
  panelSoft:  '#17171c',
  line:       'rgba(255,255,255,0.12)',
  muted:      '#b7b2aa',
  text:       '#f9f7f2',
};

const films = [
  { id: 1, title: 'Vikram Vedha',       meta: 'Hindi | Feature | Action thriller',  status: 'Available for private screenings', image: vikram    },
  { id: 2, title: 'August 16, 1947',    meta: 'Tamil | Feature | Period drama',      status: 'Screening requests open',          image: august    },
  { id: 3, title: 'The Fakir of Venice',meta: 'English/Hindi | Feature | Drama',     status: 'Community screenings',             image: fakir     },
  { id: 4, title: 'Shamshera',          meta: 'Hindi | Feature | Action drama',      status: 'Partner catalogue',                image: shamshera },
  { id: 5, title: 'Sabki Bajegi Band',  meta: 'Hindi | Feature | Comedy drama',      status: 'Private groups',                   image: band      },
  { id: 6, title: '83',                 meta: 'Hindi | Feature | Sports drama',      status: 'Curated showcase',                 image: film83    },
];

const roles = [
  { title: 'Content Owner',           copy: 'Upload a film, assign screening access, and track every approved show from one secure workspace.',                                     Icon: UploadCloud  },
  { title: 'Exhibitor / Distributor', copy: 'Manage multiple films, allocate shows to venues, and prepare producer-wise reports after screenings.',                                  Icon: Building2    },
  { title: 'Venue / Screener',        copy: 'Download the encrypted film, enter the screening key, and start the show with a simple flow.',                                          Icon: MonitorPlay  },
];

const workflow = [
  { title: 'Upload and protect',        copy: 'The film is processed into a secure encrypted file that cannot be opened in normal media players.',                         Icon: ShieldCheck },
  { title: 'Assign screening access',   copy: 'Owners or exhibitors allocate a screening to a venue, account, email, date window, and play rule.',                        Icon: FileKey2    },
  { title: 'Download and screen',       copy: 'The venue downloads once, validates the screening key, and plays through the Janta Cinema theatre player.',                Icon: Play        },
];

const faqs = [
  { q: 'Can a venue screen without a full theatrical setup?',    a: 'Yes. The platform is designed for controlled private, community, festival, and non-DCI screenings where a venue can use a laptop, projector, and approved access key.' },
  { q: 'Can films be assigned to a specific email account?',     a: 'Yes. A producer, distributor, or Janta admin can allocate a film to a screener account and set rules such as play count, date window, and expiry.' },
  { q: 'Can someone use just a screening key?',                  a: 'Yes. The web flow supports a direct screening URL where the host selects the downloaded encrypted film and enters a screening key.' },
  { q: 'Can Janta Cinema approve partners before access?',       a: 'Yes. Signup works as a request-access flow so Janta Cinema can review content owners, exhibitors, distributors, and venues before enabling their dashboards.' },
];

// ── Shared styles ─────────────────────────────────────────────────────
const s = {
  // layout
  shell:        { fontFamily: "Inter, -apple-system, 'Segoe UI', sans-serif", background: C.ink, color: C.text, minHeight: '100vh' },
  section:      { maxWidth: 1180, margin: '0 auto', padding: '4.5rem 1.5rem' },
  sectionInk:   { background: C.panel },

  // nav
  nav:          { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,7,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.line}` },
  navInner:     { maxWidth: 1180, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo:      { height: 36, objectFit: 'contain' },
  navActions:   { display: 'flex', gap: '0.5rem', alignItems: 'center' },

  // buttons
  btnPrimary:   { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.4rem', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'none' },
  btnGhost:     { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.2rem', borderRadius: 8, border: `1px solid ${C.line}`, background: 'transparent', color: C.text, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', textDecoration: 'none' },
  btnSmall:     { padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: 6 },

  // hero
  heroWrap:     { position: 'relative', overflow: 'hidden', minHeight: '90vh', display: 'flex', alignItems: 'center' },
  heroImg:      { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' },
  heroShade:    { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(5,5,7,0.88) 0%,rgba(5,5,7,0.55) 60%,rgba(5,5,7,0.2) 100%)' },
  heroContent:  { position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '5rem 1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem', flexWrap: 'wrap' },
  heroCopy:     { flex: '1 1 400px', maxWidth: 540 },
  eyebrow:      { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(238,24,57,0.15)', border: `1px solid rgba(238,24,57,0.35)`, color: C.red, borderRadius: 20, padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1.1rem' },
  heroH1:       { fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, lineHeight: 1.12, margin: '0 0 1rem', letterSpacing: '-0.02em' },
  heroP:        { color: C.muted, lineHeight: 1.7, fontSize: '1.05rem', margin: '0 0 2rem' },
  heroActions:  { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },

  // hero panel
  heroPanel:    { flex: '0 0 300px', background: 'rgba(17,17,20,0.85)', border: `1px solid ${C.line}`, borderRadius: 18, padding: '1.5rem', backdropFilter: 'blur(8px)' },
  panelLogo:    { height: 48, marginBottom: '1.2rem', objectFit: 'contain' },
  screenCard:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(238,24,57,0.1)', border: `1px solid rgba(238,24,57,0.25)`, borderRadius: 10, padding: '0.9rem 1rem', marginBottom: '1rem' },
  screenCardTxt:{ display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  screenCardSp: { color: C.muted, fontSize: '0.72rem' },
  screenCardStr:{ color: C.text, fontWeight: 700, fontSize: '0.92rem' },
  miniSteps:    { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  miniStep:     { display: 'flex', alignItems: 'center', gap: '0.6rem', color: C.muted, fontSize: '0.83rem' },

  // trust strip
  trustStrip:   { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', padding: '1.5rem', background: C.panelSoft, borderRadius: 14, border: `1px solid ${C.line}` },
  trustItem:    { display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: '1 1 200px', minWidth: 160 },
  trustStrong:  { color: C.text, fontWeight: 700, fontSize: '0.9rem' },
  trustSpan:    { color: C.muted, fontSize: '0.8rem' },

  // section headings
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' },
  kicker:       { display: 'block', color: C.red, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' },
  h2:           { fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 },
  textLink:     { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: C.red, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 },

  // film grid
  filmGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' },
  filmCard:     { background: C.panel, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column' },
  filmPoster:   { aspectRatio: '2/3', overflow: 'hidden' },
  filmImg:      { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' },
  filmBody:     { padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  filmStatus:   { color: C.red, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  filmTitle:    { color: C.text, fontWeight: 700, fontSize: '0.95rem', margin: 0 },
  filmMeta:     { color: C.muted, fontSize: '0.75rem' },

  // roles
  splitCopy:    { maxWidth: 800 },
  splitP:       { color: C.muted, lineHeight: 1.7, margin: '1rem 0 2rem' },
  roleGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem' },
  roleCard:     { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  roleIcon:     { color: C.red },
  roleH3:       { color: C.text, fontWeight: 700, fontSize: '0.95rem', margin: 0 },
  roleP:        { color: C.muted, fontSize: '0.83rem', lineHeight: 1.6, margin: 0 },

  // screening section
  screeningLayout:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' },
  accessPanel:  { background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  accessHeader: { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  accessH3:     { color: C.text, fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.2rem' },
  accessP:      { color: C.muted, fontSize: '0.82rem', margin: 0, lineHeight: 1.5 },
  inputLabel:   { display: 'flex', flexDirection: 'column', gap: '0.4rem', color: C.muted, fontSize: '0.8rem', fontWeight: 600 },
  input:        { padding: '0.7rem 0.9rem', borderRadius: 8, border: `1px solid ${C.line}`, background: C.ink, color: C.text, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },

  // workflow
  workflow:     { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  workflowItem: { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  workflowIcon: { color: C.red, flexShrink: 0, marginTop: 2 },
  workflowH3:   { color: C.text, fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.3rem' },
  workflowP:    { color: C.muted, fontSize: '0.83rem', lineHeight: 1.6, margin: 0 },

  // CTA
  accessCta:    { background: `linear-gradient(135deg, rgba(238,24,57,0.12) 0%, rgba(5,5,7,0) 60%)`, border: `1px solid rgba(238,24,57,0.2)`, borderRadius: 20, padding: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' },
  ctaActions:   { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 },

  // FAQ
  faqList:      { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  faqItem:      { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' },
  faqBtn:       { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.3rem', background: 'transparent', border: 'none', color: C.text, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', gap: '1rem', textAlign: 'left' },
  faqAns:       { padding: '0 1.3rem 1.1rem', color: C.muted, fontSize: '0.87rem', lineHeight: 1.7, margin: 0 },

  // footer
  footer:       { borderTop: `1px solid ${C.line}`, padding: '2rem 1.5rem', maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' },
  footerLogo:   { height: 40, objectFit: 'contain' },
  footerInfo:   { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  footerStrong: { color: C.text, fontWeight: 700, fontSize: '0.9rem' },
  footerSpan:   { color: C.muted, fontSize: '0.78rem' },
};

export default function JantaCinemaLanding() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div style={s.shell}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <img src={logo} alt="Janta Cinema" style={s.navLogo} />
          <div style={s.navActions}>
            <a href="#films" style={{ ...s.btnGhost, ...s.btnSmall }}>Films</a>
            <a href="#screening" style={{ ...s.btnGhost, ...s.btnSmall }}>Screening</a>
            <button style={{ ...s.btnGhost, ...s.btnSmall }} onClick={() => navigate('/login')}>Log In</button>
            <button style={{ ...s.btnPrimary, ...s.btnSmall }} onClick={() => navigate('/signup')}>
              Get Access <Sparkles size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.heroWrap} id="home">
        <img style={s.heroImg} src={heroImg} alt="Audience watching a private cinema screening" />
        <div style={s.heroShade} />
        <div style={s.heroContent}>
          <div style={s.heroCopy}>
            <div style={s.eyebrow}><ShieldCheck size={15} /> Secure screening platform</div>
            <h1 style={s.heroH1}>Janta Cinema Theatre</h1>
            <p style={s.heroP}>
              Bring protected films to independent venues, private communities, festivals, and
              partner cinemas without a heavy theatrical setup.
            </p>
            <div style={s.heroActions}>
              <a href="#films" style={s.btnPrimary}>Explore Films <ArrowRight size={17} /></a>
              <a href="#screening" style={s.btnGhost}>Start Screening <Play size={15} /></a>
            </div>
          </div>

          <div style={s.heroPanel}>
            <img src={logo} alt="Janta Cinema" style={s.panelLogo} />
            <div style={s.screenCard}>
              <div style={s.screenCardTxt}>
                <span style={s.screenCardSp}>Today</span>
                <strong style={s.screenCardStr}>Private screening access</strong>
              </div>
              <BadgeCheck size={28} color={C.red} />
            </div>
            <div style={s.miniSteps}>
              {[
                [<CloudDownload size={16} />, 'Download encrypted film'],
                [<KeyRound size={16} />,      'Enter screening key'],
                [<MonitorPlay size={16} />,   'Project full screen'],
              ].map(([icon, label]) => (
                <div key={label} style={s.miniStep}>{icon} {label}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section style={{ background: C.panelSoft, padding: '2rem 1.5rem' }}>
        <div style={{ ...s.section, padding: '0', maxWidth: 1180, margin: '0 auto' }}>
          <div style={s.trustStrip}>
            {[
              ['Encrypted film delivery', 'Films are delivered as protected local files.'],
              ['Timed keys',              'Access can be limited by window, user, or play count.'],
              ['Screening reports',       'Owners and exhibitors can track completed shows.'],
            ].map(([title, desc]) => (
              <div key={title} style={s.trustItem}>
                <strong style={s.trustStrong}>{title}</strong>
                <span style={s.trustSpan}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Films ── */}
      <section id="films" style={{ background: C.ink }}>
        <div style={s.section}>
          <div style={s.sectionHead}>
            <div>
              <span style={s.kicker}>Curated catalogue</span>
              <h2 style={s.h2}>Films ready for partner screenings</h2>
            </div>
            <a href="#access" style={s.textLink}>Request catalogue access <ArrowRight size={16} /></a>
          </div>
          <div style={s.filmGrid}>
            {films.map(f => (
              <article key={f.id} style={s.filmCard}>
                <div style={s.filmPoster}>
                  <img src={f.image} alt={f.title} style={s.filmImg} />
                </div>
                <div style={s.filmBody}>
                  <span style={s.filmStatus}>{f.status}</span>
                  <h3 style={s.filmTitle}>{f.title}</h3>
                  <p style={s.filmMeta}>{f.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="partners" style={s.sectionInk}>
        <div style={s.section}>
          <div style={s.splitCopy}>
            <span style={s.kicker}>Built for Janta partners</span>
            <h2 style={s.h2}>One platform for owners, exhibitors, and screening hosts.</h2>
            <p style={s.splitP}>
              Producers can upload and protect films. Exhibitors can manage a slate and allocate
              screenings. Venues can download the encrypted film and start the show without
              technical back-and-forth.
            </p>
          </div>
          <div style={s.roleGrid}>
            {roles.map(({ title, copy, Icon }) => (
              <article key={title} style={s.roleCard}>
                <Icon size={24} color={C.red} />
                <h3 style={s.roleH3}>{title}</h3>
                <p style={s.roleP}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screening room ── */}
      <section id="screening" style={{ background: C.ink }}>
        <div style={s.section}>
          <div style={s.sectionHead}>
            <div>
              <span style={s.kicker}>Screening room</span>
              <h2 style={s.h2}>Two simple ways to start a show.</h2>
            </div>
          </div>
          <div style={s.screeningLayout}>
            <div style={s.accessPanel}>
              <div style={s.accessHeader}>
                <LockKeyhole size={24} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={s.accessH3}>Use screening URL and key</h3>
                  <p style={s.accessP}>
                    Have a Screening Key (CV-SC-…)? Go to your film's screening page, select the
                    downloaded encrypted file, and enter the key.
                  </p>
                </div>
              </div>
              <button
                style={{ ...s.btnPrimary, width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/login')}
              >
                Log in to start screening <Play size={16} />
              </button>
              <p style={{ color: C.muted, fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>
                Or go directly to your film's screening link shared by the filmmaker.
              </p>
            </div>

            <div style={s.workflow}>
              {workflow.map(({ title, copy, Icon }) => (
                <article key={title} style={s.workflowItem}>
                  <Icon size={24} style={s.workflowIcon} color={C.red} />
                  <div>
                    <h3 style={s.workflowH3}>{title}</h3>
                    <p style={s.workflowP}>{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="access" style={s.sectionInk}>
        <div style={s.section}>
          <div style={s.accessCta}>
            <div style={{ maxWidth: 560 }}>
              <span style={s.kicker}>Private partner access</span>
              <h2 style={{ ...s.h2, marginBottom: '0.75rem' }}>
                Bring your film or venue into the Janta Cinema network.
              </h2>
              <p style={{ color: C.muted, lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
                Create an account as a content owner, exhibitor, distributor, or screener. Janta
                Cinema can review requests and assign films to approved partners.
              </p>
            </div>
            <div style={s.ctaActions}>
              <button style={s.btnPrimary} onClick={() => navigate('/signup')}>
                Create Account <Sparkles size={16} />
              </button>
              <button style={s.btnGhost} onClick={() => navigate('/login')}>
                Log In <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ background: C.ink }}>
        <div style={s.section}>
          <div style={s.sectionHead}>
            <div>
              <span style={s.kicker}>Questions</span>
              <h2 style={s.h2}>What partners usually ask first.</h2>
            </div>
          </div>
          <div style={s.faqList}>
            {faqs.map((faq, i) => (
              <article key={faq.q} style={s.faqItem}>
                <button style={s.faqBtn} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color={C.muted}
                    style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>
                {openFaq === i && <p style={s.faqAns}>{faq.a}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: C.panelSoft, borderTop: `1px solid ${C.line}` }}>
        <div style={{ ...s.footer, maxWidth: 1180, margin: '0 auto' }}>
          <img src={logo} alt="Janta Cinema" style={s.footerLogo} />
          <div style={s.footerInfo}>
            <strong style={s.footerStrong}>Janta Cinema Theatre</strong>
            <span style={s.footerSpan}>Secure private screenings for approved partners. Powered by CineVault.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
