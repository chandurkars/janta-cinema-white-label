import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  ChevronDown,
  CloudDownload,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MonitorPlay,
  Play,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import "../landing.css";

import logo from "../assets/janta-cinema/logo.png";
import heroImage from "../assets/janta-cinema/hero.jpg";
import vikramPoster from "../assets/janta-cinema/vikram-vedha.jpg";
import augustPoster from "../assets/janta-cinema/august-1947.jpg";
import fakirPoster from "../assets/janta-cinema/fakir-venice.jpg";
import shamsheraPoster from "../assets/janta-cinema/shamshera.jpg";
import bandPoster from "../assets/janta-cinema/sabki-bajegi-band.jpg";
import posterEightyThree from "../assets/janta-cinema/83.jpg";

import { useAuth } from "../hooks/useAuth";
import { getPublicFilms } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
function resolveThumb(film) {
  // Prioritise poster_url (square) for the card grid; fall back to thumbnails
  const url = film.poster_url || film.thumbnail_h_url || film.thumbnail_v_url;
  if (!url) return null;
  if (url.startsWith('http')) {
    try {
      const key = new URL(url).pathname.replace(/^\/+/, '');
      if (key) return `${API_BASE}/films/image/${key}`;
    } catch {}
    return url;
  }
  if (url.startsWith('/')) return `${API_BASE}/films/image/${url.replace(/^\/+/, '')}`;
  return `${API_BASE}/films/poster/${url}`;
}

const films = [
  { id: "vikram-vedha", slug: "vikram-vedha", title: "Vikram Vedha", meta: "Hindi | Feature | Action thriller", status: "Available for private screenings", image: vikramPoster },
  { id: "august-1947", slug: "august-16-1947", title: "August 16, 1947", meta: "Tamil | Feature | Period drama", status: "Screening requests open", image: augustPoster },
  { id: "fakir-venice", slug: "fakir-venice", title: "The Fakir of Venice", meta: "English/Hindi | Feature | Drama", status: "Community screenings", image: fakirPoster },
  { id: "shamshera", slug: "shamshera", title: "Shamshera", meta: "Hindi | Feature | Action drama", status: "Partner catalogue", image: shamsheraPoster },
  { id: "sabki-bajegi-band", slug: "sabki-bajegi-band", title: "Sabki Bajegi Band", meta: "Hindi | Feature | Comedy drama", status: "Private groups", image: bandPoster },
  { id: "83", slug: "83", title: "83", meta: "Hindi | Feature | Sports drama", status: "Curated showcase", image: posterEightyThree },
];

const roles = [
  { title: "Content Owner", copy: "Upload a film, assign screening access, and track every approved show from one secure workspace.", icon: UploadCloud },
  { title: "Exhibitor / Distributor", copy: "Manage multiple films, allocate shows to venues, and prepare producer-wise reports after screenings.", icon: Building2 },
  { title: "Venue / Screener", copy: "Download the encrypted film, enter the screening key, and start the show with a simple flow.", icon: MonitorPlay },
];

const workflow = [
  { title: "Upload and protect", copy: "The film is processed into a secure encrypted file that cannot be opened in normal media players.", icon: ShieldCheck },
  { title: "Assign screening access", copy: "Owners or exhibitors allocate a screening to a venue, account, email, date window, and play rule.", icon: CalendarClock },
  { title: "Download and screen", copy: "The venue downloads once, validates the screening key, and plays through the Janta Cinema theatre player.", icon: Play },
];

const faqs = [
  { question: "Can a venue screen without a full theatrical setup?", answer: "Yes. The platform is designed for controlled private, community, festival, and non-DCI screenings where a venue can use a laptop, projector, and approved access key." },
  { question: "Can films be assigned to a specific email account?", answer: "Yes. A producer, distributor, or Janta admin can allocate a film to a screener account and set rules such as play count, date window, and expiry." },
  { question: "Can someone use just a screening key?", answer: "Yes. The web flow supports a direct screening URL where the host selects the downloaded encrypted film and enters a screening key." },
  { question: "Can Janta Cinema approve partners before access?", answer: "Yes. Signup can work as a request-access flow so Janta Cinema can review content owners, exhibitors, distributors, and venues before enabling their dashboards." },
];

export default function JantaCinemaLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const [liveFilms, setLiveFilms] = useState([]);
  const [filmsLoading, setFilmsLoading] = useState(true);

  useEffect(() => {
    getPublicFilms()
      .then(r => setLiveFilms(r.data))
      .catch(() => {})
      .finally(() => setFilmsLoading(false));
  }, []);

  const displayFilms = filmsLoading ? null : liveFilms.length > 0 ? liveFilms.slice(0, 6).map(f => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    meta: [f.language, f.category, f.genre].filter(Boolean).join(' | '),
    status: f.price_1_show ? `From ₹${Math.min(...[f.price_1_show, f.price_2_shows, f.price_4_shows].filter(Boolean)).toLocaleString('en-IN')} / show` : 'Enquire for pricing',
    image: resolveThumb(f),
    liveData: f,
  })) : films;

  return (
    <main className="site-shell">
      <header className="header">
        <a href="#home" className="brand" aria-label="Janta Cinema Theatre home">
          <img src={logo} alt="Janta Cinema" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#films">Films</a>
          <a href="#partners">Partners</a>
          <a href="#screening">Screening</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <button type="button" onClick={() => navigate("/dashboard")} className="header-link-button">
                <LayoutDashboard size={15} />
                Dashboard
              </button>
              <button type="button" onClick={() => navigate("/logout")}>
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => navigate("/login")}>Log In</button>
              <button type="button" onClick={() => navigate("/signup")}>Get Access</button>
            </>
          )}
        </div>
      </header>

      <section className="hero" id="home">
        <img className="hero__image" src={heroImage} alt="Audience watching a private cinema screening" />
        <div className="hero__shade" />
        <div className="hero__content">
          <div className="hero__copy">
            <div className="eyebrow">
              <ShieldCheck size={17} />
              Secure screening platform
            </div>
            <h1>Janta Cinema Theatre</h1>
            <p>
              Bring protected films to independent venues, private communities, festivals, and
              partner cinemas without a heavy theatrical setup.
            </p>
            <div className="hero__actions">
              <a href="#films" className="button button--primary">
                Explore Films
                <ArrowRight size={18} />
              </a>
              <a href="#screening" className="button button--ghost">
                Start Screening
                <Play size={17} />
              </a>
            </div>
          </div>

          <div className="hero__panel" aria-label="Screening access preview">
            <img src={logo} alt="Janta Cinema" className="panel-logo" />
            <div className="screening-card">
              <div>
                <span>Today</span>
                <strong>Private screening access</strong>
              </div>
              <BadgeCheck className="screening-card__icon" size={28} />
            </div>
            <div className="mini-steps">
              <div><CloudDownload size={17} />Download encrypted film</div>
              <div><KeyRound size={17} />Enter screening key</div>
              <div><MonitorPlay size={17} />Project full screen</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="trust-strip" aria-label="Platform highlights">
          <div>
            <strong>Encrypted film delivery</strong>
            <span>Films are delivered as protected local files.</span>
          </div>
          <div>
            <strong>Timed keys</strong>
            <span>Access can be limited by window, user, or play count.</span>
          </div>
          <div>
            <strong>Screening reports</strong>
            <span>Owners and exhibitors can track completed shows.</span>
          </div>
        </div>
      </section>

      <section className="section" id="films">
        <div className="section__heading">
          <div>
            <span className="kicker">Curated catalogue</span>
            <h2>Films ready for partner screenings</h2>
          </div>
          <a className="text-link" href="#access">
            Request catalogue access
            <ArrowRight size={17} />
          </a>
        </div>
        <div className="film-grid">
          {filmsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <article className="film-card film-card--skeleton" key={i} aria-hidden="true">
                  <div className="poster-wrap skeleton-block" />
                  <div className="film-card__body">
                    <div className="skeleton-line" style={{ width: '60%', height: 12, marginBottom: 8 }} />
                    <div className="skeleton-line" style={{ width: '85%', height: 18, marginBottom: 6 }} />
                    <div className="skeleton-line" style={{ width: '70%', height: 12, marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="skeleton-line" style={{ width: 80, height: 34, borderRadius: 8 }} />
                      <div className="skeleton-line" style={{ width: 80, height: 34, borderRadius: 8 }} />
                    </div>
                  </div>
                </article>
              ))
            : displayFilms.map((film) => (
                <article className="film-card" key={film.id}>
                  <div className="poster-wrap">
                    {film.image
                      ? <img src={film.image} alt={`${film.title} poster`} onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
                    }
                  </div>
                  <div className="film-card__body">
                    <span>{film.status}</span>
                    <h3>{film.title}</h3>
                    <p>{film.meta}</p>
                    <div className="film-card__actions">
                      <button className="film-card__button" type="button" onClick={() => navigate(film.slug ? `/film/${film.slug}` : "/login")}>Details</button>
                      <button className="film-card__button film-card__button--accent" type="button" onClick={() => navigate(film.slug ? `/film/${film.slug}` : "/signup")}>Rent</button>
                    </div>
                  </div>
                </article>
              ))
          }
        </div>
      </section>

      <section className="section section--partners" id="partners">
        <div className="split-copy">
          <span className="kicker">Built for Janta partners</span>
          <h2>One platform for owners, exhibitors, and screening hosts.</h2>
          <p>
            Producers can upload and protect films. Exhibitors can manage a slate and allocate
            screenings. Venues can download the encrypted film and start the show without technical
            back-and-forth.
          </p>
          <div className="role-grid">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <article className="role-card" key={role.title}>
                  <Icon size={24} />
                  <h3>{role.title}</h3>
                  <p>{role.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--ink" id="screening">
        <div className="section__heading">
          <div>
            <span className="kicker">Screening room</span>
            <h2>Two simple ways to start a show.</h2>
          </div>
        </div>
        <div className="screening-layout">
          <div className="access-panel">
            <div className="access-panel__header">
              <LockKeyhole size={24} />
              <div>
                <h3>Use screening URL and key</h3>
                <p>
                  Have a Screening Key (CV-SC-…)? Go to your film's screening page, select
                  the downloaded encrypted film, and enter the key.
                </p>
              </div>
            </div>
            <button
              className="button button--primary button--full"
              type="button"
              onClick={() => navigate("/login")}
            >
              Log in to start screening
              <Play size={17} />
            </button>
            <p style={{ textAlign: "center", marginTop: "14px", color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>
              Or go directly to your film's screening link shared by the filmmaker.
            </p>
          </div>

          <div className="workflow">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <article className="workflow-item" key={item.title}>
                  <Icon size={24} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="access">
        <div className="access-cta">
          <div>
            <span className="kicker">Private partner access</span>
            <h2>Bring your film or venue into the Janta Cinema network.</h2>
            <p>
              Create an account as a content owner, exhibitor, distributor, or screener. Janta
              Cinema can review requests and assign films to approved partners.
            </p>
          </div>
          <div className="cta-actions">
            <button className="button button--primary" type="button" onClick={() => navigate("/signup")}>
              Create Account
              <Sparkles size={17} />
            </button>
            <button className="button button--ghost" type="button" onClick={() => navigate("/login")}>
              Log In
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="section section--faq" id="faq">
        <div className="section__heading">
          <div>
            <span className="kicker">Questions</span>
            <h2>What partners usually ask first.</h2>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <article className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={faq.question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{faq.question}</span>
                <ChevronDown size={22} />
              </button>
              {openFaq === index && <p>{faq.answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <img src={logo} alt="Janta Cinema" />
        <div>
          <strong>Janta Cinema Theatre</strong>
          <span>Secure private screenings for approved partners.</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="/terms" style={{ color: 'var(--muted)', fontSize: '0.8rem', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--text)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
            Terms &amp; Conditions
          </a>
          <a href="/privacy" style={{ color: 'var(--muted)', fontSize: '0.8rem', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--text)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
            Privacy Policy
          </a>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>© 2023 Yen Movie Studios Pvt. Ltd.</span>
        </div>
      </footer>
    </main>
  );
}
