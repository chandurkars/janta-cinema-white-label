import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const CSS = `
  .landing-root *, .landing-root *::before, .landing-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .landing-root {
    --bg: #0f172a;
    --bg2: #111827;
    --bg3: #1e293b;
    --amber: #f59e0b;
    --amber-light: #fbbf24;
    --amber-dark: #d97706;
    --blue: #3b82f6;
    --blue-light: #60a5fa;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --border: #1e293b;
    --card: #162032;
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  /* ============================================================
     NAVBAR
  ============================================================ */
  .landing-navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    padding: 18px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease;
  }
  .landing-navbar.scrolled {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(245, 158, 11, 0.15);
  }

  .lnd-nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 24px;
    font-weight: 800;
    color: var(--amber);
    letter-spacing: -0.5px;
  }
  .lnd-logo-icon {
    position: relative;
    display: inline-flex;
    font-size: 26px;
    line-height: 1;
  }
  .lnd-logo-icon .lnd-lock-badge {
    position: absolute;
    top: -4px;
    right: -6px;
    font-size: 13px;
    line-height: 1;
  }

  .lnd-nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lnd-nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 8px;
    transition: color 0.2s;
  }
  .lnd-nav-links a:hover { color: var(--text); }

  .lnd-btn-outline {
    border: 1.5px solid rgba(245, 158, 11, 0.4) !important;
    color: var(--amber) !important;
    padding: 8px 20px !important;
    border-radius: 8px !important;
    transition: border-color 0.2s, background 0.2s !important;
  }
  .lnd-btn-outline:hover {
    border-color: var(--amber) !important;
    background: rgba(245, 158, 11, 0.08) !important;
  }

  .lnd-btn-filled {
    background: var(--amber) !important;
    color: #0f172a !important;
    padding: 9px 22px !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    transition: background 0.2s, transform 0.15s !important;
  }
  .lnd-btn-filled:hover {
    background: var(--amber-light) !important;
    transform: translateY(-1px);
  }

  /* ============================================================
     HERO
  ============================================================ */
  .lnd-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    padding: 90px 24px 100px;
    position: relative;
    overflow: hidden;
  }

  .lnd-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 1000px 700px at 50% 40%, rgba(245, 158, 11, 0.10) 0%, transparent 65%),
      radial-gradient(ellipse 600px 400px at 80% 70%, rgba(59, 130, 246, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 500px 300px at 10% 60%, rgba(139, 92, 246, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .lnd-hero-headline {
    font-size: clamp(36px, 5.5vw, 68px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1.5px;
    color: #fff;
    margin-bottom: 24px;
    max-width: 900px;
    animation: lnd-fadeUp 0.8s 0.15s ease both;
  }
  .lnd-hero-headline em {
    font-style: normal;
    color: var(--amber);
  }

  .lnd-hero-sub {
    font-size: clamp(17px, 2vw, 22px);
    color: var(--muted);
    max-width: 640px;
    margin: 0 auto 20px;
    line-height: 1.7;
    animation: lnd-fadeUp 0.8s 0.25s ease both;
  }

  .lnd-hero-tagline {
    font-size: clamp(15px, 1.6vw, 18px);
    color: var(--amber);
    font-weight: 600;
    margin-bottom: 44px;
    animation: lnd-fadeUp 0.8s 0.32s ease both;
    opacity: 0.9;
  }

  .lnd-hero-ctas {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 64px;
    animation: lnd-fadeUp 0.8s 0.4s ease both;
  }

  .lnd-cta-primary {
    background: var(--amber);
    color: #0f172a;
    font-size: 17px;
    font-weight: 700;
    padding: 16px 36px;
    border-radius: 10px;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 24px rgba(245, 158, 11, 0.25);
  }
  .lnd-cta-primary:hover {
    background: var(--amber-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(245, 158, 11, 0.4);
  }

  .lnd-cta-secondary {
    background: transparent;
    color: var(--text);
    font-size: 17px;
    font-weight: 600;
    padding: 16px 36px;
    border-radius: 10px;
    text-decoration: none;
    border: 1.5px solid rgba(148, 163, 184, 0.3);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.15s;
  }
  .lnd-cta-secondary:hover {
    border-color: rgba(148, 163, 184, 0.7);
    color: #fff;
    transform: translateY(-2px);
  }

  /* Hero image */
  .lnd-hero-image-wrap {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto 52px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(245, 158, 11, 0.18);
    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(245,158,11,0.06);
    animation: lnd-fadeUp 0.7s 0.1s ease both;
  }
  .lnd-hero-image-wrap img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* ============================================================
     SHARED LAYOUT
  ============================================================ */
  .lnd-section {
    padding: 100px 24px;
  }
  .lnd-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .lnd-section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 16px;
    display: block;
  }
  .lnd-section-label.blue { color: var(--blue-light); }

  .lnd-section-title {
    font-size: clamp(36px, 5vw, 52px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1px;
    color: #fff;
    margin-bottom: 20px;
  }
  .lnd-section-sub {
    font-size: 19px;
    color: var(--muted);
    max-width: 600px;
    line-height: 1.65;
    margin-bottom: 56px;
  }

  /* ============================================================
     PROBLEM SECTION
  ============================================================ */
  .lnd-problem {
    background: var(--bg2);
    padding: 80px 24px;
  }
  .lnd-problem-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    border-radius: 16px;
    overflow: hidden;
  }
  .lnd-problem-card {
    background: rgba(30, 41, 59, 0.6);
    padding: 48px 44px;
    position: relative;
  }
  .lnd-problem-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .lnd-problem-card.filmmaker::before { background: var(--amber); }
  .lnd-problem-card.distributor::before { background: var(--blue); }

  .lnd-problem-icon {
    font-size: 36px;
    margin-bottom: 20px;
    display: block;
  }
  .lnd-problem-who {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .lnd-problem-card.filmmaker .lnd-problem-who { color: var(--amber); }
  .lnd-problem-card.distributor .lnd-problem-who { color: var(--blue-light); }

  .lnd-problem-text {
    font-size: 18px;
    color: var(--muted);
    line-height: 1.75;
  }
  .lnd-problem-text strong { color: var(--text); }

  /* ============================================================
     FEATURE CARDS
  ============================================================ */
  .lnd-cards-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .lnd-cards-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .lnd-feature-card {
    background: var(--card);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 14px;
    padding: 32px 30px;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .lnd-feature-card:hover { transform: translateY(-4px); }

  .lnd-feature-card.amber-card:hover {
    box-shadow: 0 12px 40px rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.2);
  }
  .lnd-feature-card.blue-card:hover {
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.2);
  }

  .lnd-card-icon {
    font-size: 32px;
    margin-bottom: 16px;
    display: block;
  }
  .lnd-card-title {
    font-size: 19px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 10px;
  }
  .lnd-card-text {
    font-size: 17px;
    color: var(--muted);
    line-height: 1.65;
  }

  /* ============================================================
     FOR FILMMAKERS
  ============================================================ */
  .lnd-filmmakers {
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }
  .lnd-filmmakers::before {
    content: '';
    position: absolute;
    right: -200px; top: -100px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .lnd-highlight-box {
    margin-top: 40px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 14px;
    padding: 32px 36px;
    font-size: 19px;
    color: var(--text);
    line-height: 1.7;
  }
  .lnd-highlight-box strong { color: var(--amber); }

  /* ============================================================
     HOW IT WORKS
  ============================================================ */
  .lnd-how-it-works {
    background: var(--bg2);
  }
  .lnd-steps-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    position: relative;
  }
  .lnd-steps-row::before {
    content: '';
    position: absolute;
    top: 40px; left: 12.5%; right: 12.5%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3) 20%, rgba(245, 158, 11, 0.3) 80%, transparent);
    pointer-events: none;
  }
  .lnd-step-card {
    padding: 40px 28px 36px;
    text-align: center;
    position: relative;
  }
  .lnd-step-number {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--bg3);
    border: 2px solid rgba(245, 158, 11, 0.4);
    color: var(--amber);
    font-size: 20px;
    font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    position: relative;
    z-index: 1;
    transition: background 0.2s, border-color 0.2s;
  }
  .lnd-step-card:hover .lnd-step-number {
    background: rgba(245, 158, 11, 0.15);
    border-color: var(--amber);
  }
  .lnd-step-title {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 10px;
  }
  .lnd-step-text {
    font-size: 16px;
    color: var(--muted);
    line-height: 1.6;
  }

  /* ============================================================
     FOR DISTRIBUTORS
  ============================================================ */
  .lnd-distributors {
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }
  .lnd-distributors::before {
    content: '';
    position: absolute;
    left: -200px; bottom: -100px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ============================================================
     SECURITY
  ============================================================ */
  .lnd-security {
    background: var(--bg2);
  }
  .lnd-security-card {
    background: #0d1626;
    border: 1px solid rgba(245, 158, 11, 0.15);
    border-radius: 16px;
    padding: 56px 52px;
    position: relative;
    overflow: hidden;
  }
  .lnd-security-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 800px 400px at 50% 0%, rgba(245, 158, 11, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .lnd-security-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 36px 48px;
  }
  .lnd-security-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .lnd-security-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--amber);
    flex-shrink: 0;
    margin-top: 8px;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }
  .lnd-security-label {
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }
  .lnd-security-desc {
    font-size: 15px;
    color: var(--muted);
    line-height: 1.55;
  }

  /* ============================================================
     CTA SECTION
  ============================================================ */
  .lnd-cta-section {
    background: var(--bg2);
    padding: 100px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .lnd-cta-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 900px 500px at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 65%);
    pointer-events: none;
  }
  .lnd-cta-title {
    font-size: clamp(38px, 5.5vw, 60px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 20px;
    position: relative;
  }
  .lnd-cta-sub {
    font-size: 20px;
    color: var(--muted);
    max-width: 520px;
    margin: 0 auto 48px;
    line-height: 1.6;
    position: relative;
  }
  .lnd-waitlist-form {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 28px;
    position: relative;
  }
  .lnd-waitlist-input {
    background: rgba(30, 41, 59, 0.8);
    border: 1.5px solid rgba(148, 163, 184, 0.2);
    color: var(--text);
    font-size: 17px;
    padding: 14px 22px;
    border-radius: 10px;
    outline: none;
    width: 340px;
    max-width: 100%;
    transition: border-color 0.2s;
  }
  .lnd-waitlist-input::placeholder { color: var(--muted); }
  .lnd-waitlist-input:focus { border-color: var(--amber); }
  .lnd-btn-waitlist {
    background: var(--amber);
    color: #0f172a;
    font-size: 17px;
    font-weight: 700;
    padding: 14px 28px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
    text-decoration: none;
  }
  .lnd-btn-waitlist:hover {
    background: var(--amber-light);
    transform: translateY(-1px);
  }
  .lnd-cta-alt {
    font-size: 15px;
    color: var(--muted);
    position: relative;
    margin-bottom: 20px;
  }
  .lnd-cta-links {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    position: relative;
  }
  .lnd-cta-link-btn {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: var(--text);
    font-size: 15px;
    font-weight: 600;
    padding: 11px 22px;
    border-radius: 8px;
    text-decoration: none;
    transition: border-color 0.2s, color 0.2s;
  }
  .lnd-cta-link-btn:hover { border-color: rgba(245, 158, 11, 0.4); color: var(--amber); }

  /* ============================================================
     FOOTER
  ============================================================ */
  .lnd-footer {
    background: #0a1020;
    border-top: 1px solid rgba(148, 163, 184, 0.08);
    padding: 56px 24px 40px;
  }
  .lnd-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
    flex-wrap: wrap;
  }
  .lnd-footer-tagline {
    font-size: 15px;
    color: var(--muted);
    max-width: 300px;
    line-height: 1.6;
    margin-top: 12px;
  }
  .lnd-footer-links {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }
  .lnd-footer-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 15px;
    transition: color 0.2s;
  }
  .lnd-footer-links a:hover { color: var(--text); }
  .lnd-footer-bottom {
    max-width: 1200px;
    margin: 32px auto 0;
    padding-top: 24px;
    border-top: 1px solid rgba(148, 163, 184, 0.07);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .lnd-footer-bottom span { font-size: 14px; color: var(--muted); }

  /* ============================================================
     ANIMATIONS
  ============================================================ */
  @keyframes lnd-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lnd-fade-in {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .lnd-fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ============================================================
     RESPONSIVE — TABLET
  ============================================================ */
  @media (max-width: 900px) {
    .lnd-cards-grid-2, .lnd-cards-grid-3 { grid-template-columns: 1fr; }
    .lnd-problem-grid { grid-template-columns: 1fr; }
    .lnd-steps-row { grid-template-columns: 1fr 1fr; }
    .lnd-steps-row::before { display: none; }
    .lnd-security-grid { grid-template-columns: 1fr 1fr; }
    .lnd-footer-inner { flex-direction: column; }
    .landing-navbar { padding: 16px 24px; }
    .lnd-nav-links a:not(.lnd-btn-outline):not(.lnd-btn-filled) { display: none; }
  }

  /* ============================================================
     RESPONSIVE — MOBILE
  ============================================================ */
  @media (max-width: 600px) {
    .landing-navbar { padding: 14px 20px; }
    .lnd-nav-links a:not(.lnd-btn-filled) { display: none; }
    .lnd-btn-filled { font-size: 14px !important; padding: 8px 18px !important; }
    .lnd-hero { padding: 100px 20px 64px; }
    .lnd-hero-headline {
      font-size: clamp(32px, 9vw, 48px);
      letter-spacing: -1px;
      margin-bottom: 18px;
    }
    .lnd-hero-sub { font-size: 16px; margin-bottom: 14px; }
    .lnd-hero-tagline { font-size: 14px; margin-bottom: 32px; }
    .lnd-hero-ctas {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      max-width: 340px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 40px;
    }
    .lnd-cta-primary, .lnd-cta-secondary { text-align: center; }
    .lnd-hero-image-wrap { border-radius: 12px; }
    .lnd-section { padding: 64px 20px; }
    .lnd-problem-card { padding: 32px 24px; }
    .lnd-security-grid { grid-template-columns: 1fr; }
    .lnd-security-card { padding: 28px 20px; }
    .lnd-steps-row { grid-template-columns: 1fr; }
    .lnd-feature-card { padding: 24px 20px; }
    .lnd-waitlist-form { flex-direction: column; align-items: center; }
    .lnd-footer-links { flex-direction: column; gap: 12px; }
    .lnd-footer-bottom { flex-direction: column; text-align: center; }
  }

  /* ============================================================
     WAITLIST MODAL
  ============================================================ */
  .lnd-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: lnd-fade-overlay 0.2s ease;
  }
  @keyframes lnd-fade-overlay {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .lnd-modal {
    background: #111827;
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 16px;
    padding: 40px 36px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: lnd-modal-in 0.25s ease;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1);
  }
  @keyframes lnd-modal-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .lnd-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  .lnd-modal-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
  .lnd-modal-title {
    font-size: 22px;
    font-weight: 800;
    color: #e2e8f0;
    margin-bottom: 6px;
  }
  .lnd-modal-sub {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 28px;
  }
  .lnd-modal-field {
    margin-bottom: 16px;
  }
  .lnd-modal-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lnd-modal-input, .lnd-modal-textarea {
    width: 100%;
    background: rgba(30, 41, 59, 0.8);
    border: 1.5px solid rgba(148, 163, 184, 0.15);
    color: #e2e8f0;
    font-size: 15px;
    padding: 12px 16px;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .lnd-modal-input::placeholder, .lnd-modal-textarea::placeholder { color: #475569; }
  .lnd-modal-input:focus, .lnd-modal-textarea:focus { border-color: #f59e0b; }
  .lnd-modal-textarea { resize: vertical; min-height: 80px; }
  .lnd-modal-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }
  .lnd-modal-checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: #cbd5e1;
    cursor: pointer;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1.5px solid rgba(148, 163, 184, 0.1);
    background: rgba(30, 41, 59, 0.4);
    transition: border-color 0.2s, background 0.2s;
  }
  .lnd-modal-checkbox-label:hover {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.04);
  }
  .lnd-modal-checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #f59e0b;
    cursor: pointer;
    flex-shrink: 0;
  }
  .lnd-modal-submit {
    width: 100%;
    background: #f59e0b;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
    padding: 14px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    margin-top: 4px;
  }
  .lnd-modal-submit:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-1px);
  }
  .lnd-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .lnd-modal-success {
    text-align: center;
    padding: 20px 0;
  }
  .lnd-modal-success-icon { font-size: 48px; margin-bottom: 16px; }
  .lnd-modal-success-title {
    font-size: 22px;
    font-weight: 800;
    color: #e2e8f0;
    margin-bottom: 8px;
  }
  .lnd-modal-success-msg { font-size: 15px; color: #64748b; line-height: 1.6; }
  .lnd-modal-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 14px;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  @media (max-width: 600px) {
    .lnd-modal { padding: 28px 20px; }
    .lnd-modal-title { font-size: 19px; }
  }
`;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Landing() {
  const navbarRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '',
    is_filmmaker: false, is_distributor: false, is_producer: false,
    remarks: '',
  });

  useEffect(() => {
    // Inject scoped CSS
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-landing-css', 'true');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    // Navbar scroll effect
    const navbar = navbarRef.current;
    if (!navbar) return;
    const handleScroll = () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // IntersectionObserver fade-in
    const fadeEls = document.querySelectorAll('.lnd-fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = [
              ...entry.target.parentElement.querySelectorAll('.lnd-fade-in'),
            ];
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, idx * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) { setFormError('Please enter your name.'); return; }
    if (!formData.email.trim()) { setFormError('Please enter your email.'); return; }
    if (!formData.is_filmmaker && !formData.is_distributor && !formData.is_producer) {
      setFormError('Please select at least one role.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Server error');
      setSubmitted(true);
    } catch {
      setFormError('Something went wrong. Please try again or email us at sunil@vdojar.com');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-root">
      {/* ============================================================
           NAVBAR
      ============================================================ */}
      <nav className="landing-navbar" ref={navbarRef}>
        <a href="#lnd-hero" onClick={scrollTo('lnd-hero')} className="lnd-nav-logo">
          <span className="lnd-logo-icon">
            🎬
            <span className="lnd-lock-badge">🔒</span>
          </span>
          CineVault
        </a>
        <div className="lnd-nav-links">
          <a href="#lnd-filmmakers" onClick={scrollTo('lnd-filmmakers')}>For Filmmakers</a>
          <a href="#lnd-distributors" onClick={scrollTo('lnd-distributors')}>For Distributors</a>
          <Link to="/login" className="lnd-btn-outline">Login</Link>
          <Link to="/signup" className="lnd-btn-filled">Get Started</Link>
        </div>
      </nav>

      {/* ============================================================
           HERO
      ============================================================ */}
      <section className="lnd-hero" id="lnd-hero">
        <div className="lnd-hero-image-wrap">
          <img
            src="/hero.png"
            alt="CineVault — Upload your film, protect it in the vault, screen privately anywhere in the world"
          />
        </div>

        <h1 className="lnd-hero-headline">
          Send Your Film to Any Venue<br />
          in the World. <em>Securely.</em>
        </h1>

        <p className="lnd-hero-sub">
          CineVault encrypts your film and delivers it to any school, college, film club or
          cultural centre — anywhere on earth — via a time-locked private screening key.
          No unprotected files. No flying to the venue. No middleman.
        </p>

        <p className="lnd-hero-tagline">
          You agree the fee &nbsp;·&nbsp; CineVault delivers securely &nbsp;·&nbsp; You keep the revenue
        </p>

        <div className="lnd-hero-ctas">
          <Link to="/signup" className="lnd-cta-primary">I'm a Filmmaker →</Link>
          <Link to="/signup" className="lnd-cta-secondary">I'm a Distributor →</Link>
        </div>
      </section>

      {/* ============================================================
           PROBLEM
      ============================================================ */}
      <section className="lnd-problem" id="lnd-problem">
        <div className="lnd-container">
          <div className="lnd-problem-grid lnd-fade-in">
            <div className="lnd-problem-card filmmaker">
              <span className="lnd-problem-icon">🎞️</span>
              <div className="lnd-problem-who">The Filmmaker's Problem</div>
              <p className="lnd-problem-text">
                Today, screening your film means <strong>handing it over.</strong> An unprotected MP4 that gets copied, screened extra times, with <strong>zero visibility</strong> into what happened.
              </p>
            </div>
            <div className="lnd-problem-card distributor">
              <span className="lnd-problem-icon">📋</span>
              <div className="lnd-problem-who">The Distributor's Problem</div>
              <p className="lnd-problem-text">
                Managing distribution across 50 venues means <strong>spreadsheets, WhatsApp threads, and manual key tracking.</strong> One missed step = an unauthorized screening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FOR FILMMAKERS
      ============================================================ */}
      <section className="lnd-section lnd-filmmakers" id="lnd-filmmakers">
        <div className="lnd-container">
          <span className="lnd-section-label lnd-fade-in">For Filmmakers</span>
          <h2 className="lnd-section-title lnd-fade-in">You Made the Film.<br />You Control Where It Goes.</h2>
          <p className="lnd-section-sub lnd-fade-in">Upload once. Screen everywhere. Keep nearly all the revenue.</p>

          <div className="lnd-cards-grid-2 lnd-fade-in">
            <div className="lnd-feature-card amber-card">
              <span className="lnd-card-icon">🔐</span>
              <div className="lnd-card-title">Film stays encrypted</div>
              <p className="lnd-card-text">Venues download a file they literally cannot open without your key. The encrypted .jcfilm file is useless without server authorization.</p>
            </div>
            <div className="lnd-feature-card amber-card">
              <span className="lnd-card-icon">🔑</span>
              <div className="lnd-card-title">You issue the key</div>
              <p className="lnd-card-text">Date-locked, show-count-locked, revocable anytime. Takes 30 seconds. You decide when the venue can screen, and for how many shows.</p>
            </div>
            <div className="lnd-feature-card amber-card">
              <span className="lnd-card-icon">🏠</span>
              <div className="lnd-card-title">Run it from home</div>
              <p className="lnd-card-text">Screening happens at the venue. You watch real-time on your dashboard — activation timestamp, completion percentage, key consumed.</p>
            </div>
            <div className="lnd-feature-card amber-card">
              <span className="lnd-card-icon">💰</span>
              <div className="lnd-card-title">Your price. Your deal.</div>
              <p className="lnd-card-text">You negotiate directly with venues. CineVault charges a small per-show platform fee. You keep the rest. No middlemen taking 40%.</p>
            </div>
          </div>

          <div className="lnd-highlight-box lnd-fade-in">
            <strong>No distributor taking 40%.</strong> A school in Kolkata, a film club in Toronto, a festival in Dubai — issue them a key. They screen. You earn. Every transaction flows directly to you, minus a small CineVault per-show fee.
          </div>
        </div>
      </section>

      {/* ============================================================
           HOW IT WORKS
      ============================================================ */}
      <section className="lnd-section lnd-how-it-works" id="lnd-how-it-works">
        <div className="lnd-container">
          <span className="lnd-section-label lnd-fade-in">The Process</span>
          <h2 className="lnd-section-title lnd-fade-in" style={{ marginBottom: '56px' }}>From Upload to Worldwide<br />Screening in 4 Steps</h2>

          <div className="lnd-steps-row lnd-fade-in">
            <div className="lnd-step-card">
              <div className="lnd-step-number">1</div>
              <div className="lnd-step-title">Upload your film</div>
              <p className="lnd-step-text">Drag and drop your master file. CineVault encrypts it instantly with AES-256-GCM. The original never leaves your control.</p>
            </div>
            <div className="lnd-step-card">
              <div className="lnd-step-number">2</div>
              <div className="lnd-step-title">A venue reaches out</div>
              <p className="lnd-step-text">You agree terms offline — your price, your deal. No platform in the middle of your negotiation.</p>
            </div>
            <div className="lnd-step-card">
              <div className="lnd-step-number">3</div>
              <div className="lnd-step-title">Issue a key in 30 seconds</div>
              <p className="lnd-step-text">Set the date window and show count. Generate. Share the key with the venue. Done.</p>
            </div>
            <div className="lnd-step-card">
              <div className="lnd-step-number">4</div>
              <div className="lnd-step-title">They screen, you watch</div>
              <p className="lnd-step-text">Dashboard shows activation, completion %, and key consumed. Real-time. From anywhere in the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FOR DISTRIBUTORS
      ============================================================ */}
      <section className="lnd-section lnd-distributors" id="lnd-distributors">
        <div className="lnd-container">
          <span className="lnd-section-label blue lnd-fade-in">For Distributors &amp; Aggregators</span>
          <h2 className="lnd-section-title lnd-fade-in">Your Entire Distribution<br />Operation. One Dashboard.</h2>
          <p className="lnd-section-sub lnd-fade-in">Manage films, venues, contracts, and keys — with full audit trail and multi-tenant isolation.</p>

          <div className="lnd-cards-grid-3 lnd-fade-in">
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">🏢</span>
              <div className="lnd-card-title">Multi-tenant SaaS</div>
              <p className="lnd-card-text">Each distributor gets a fully isolated workspace. Your clients' data never crosses. Complete separation guaranteed at the infrastructure level.</p>
            </div>
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">🔑</span>
              <div className="lnd-card-title">Key Group Management</div>
              <p className="lnd-card-text">1 Download Key + N Screening Keys per contract. Generate, share, and revoke from a single dashboard interface in seconds.</p>
            </div>
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">📊</span>
              <div className="lnd-card-title">Full Analytics</div>
              <p className="lnd-card-text">Screenings per film, venue, city. Completion rates. Revenue per contract. Everything you need to run a professional distribution operation.</p>
            </div>
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">🏟️</span>
              <div className="lnd-card-title">Venue Management</div>
              <p className="lnd-card-text">Add venues, contacts, screen counts. Assign films. Track history. Build a structured database of your entire venue network.</p>
            </div>
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">📋</span>
              <div className="lnd-card-title">Contract Workflow</div>
              <p className="lnd-card-text">Draft → Confirm → keys auto-unlocked. No manual steps, no missed emails, no spreadsheet errors. The system handles the state machine.</p>
            </div>
            <div className="lnd-feature-card blue-card">
              <span className="lnd-card-icon">🌐</span>
              <div className="lnd-card-title">Works Anywhere</div>
              <p className="lnd-card-text">Venue operator needs only a browser. No app install. No hardware. Key = auth. Works in Dubai, Toronto, or Kolkata the same way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           SECURITY
      ============================================================ */}
      <section className="lnd-section lnd-security" id="lnd-security">
        <div className="lnd-container">
          <span className="lnd-section-label lnd-fade-in">Security</span>
          <h2 className="lnd-section-title lnd-fade-in" style={{ marginBottom: '48px' }}>Security That Film Studios<br />Would Respect</h2>

          <div className="lnd-security-card lnd-fade-in">
            <div className="lnd-security-grid">
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">AES-256-GCM Encryption</div>
                  <div className="lnd-security-desc">The same standard used by banks and governments. Your film is unreadable without a server-issued key.</div>
                </div>
              </div>
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">Unplayable .jcfilm Format</div>
                  <div className="lnd-security-desc">.jcfilm files are proprietary and completely unplayable by any standard media player without CineVault authorization.</div>
                </div>
              </div>
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">In-Memory Decryption</div>
                  <div className="lnd-security-desc">Decryption happens entirely in browser memory. The unencrypted film never touches disk — on any device, at any venue.</div>
                </div>
              </div>
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">Time-Windowed Keys</div>
                  <div className="lnd-security-desc">Keys auto-expire after the screening window closes. An expired key is permanently dead — no reactivation possible.</div>
                </div>
              </div>
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">Device-Locked Sessions</div>
                  <div className="lnd-security-desc">Resume tokens are bound to the originating device. Keys cannot be shared across venues or devices mid-screening.</div>
                </div>
              </div>
              <div className="lnd-security-item">
                <span className="lnd-security-dot"></span>
                <div>
                  <div className="lnd-security-label">Full Audit Log</div>
                  <div className="lnd-security-desc">Every key event — generated, activated, consumed, revoked — is logged with IP address and exact timestamp.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           CTA SECTION
      ============================================================ */}
      <section className="lnd-cta-section" id="lnd-cta-section">
        <div className="lnd-container">
          <h2 className="lnd-cta-title lnd-fade-in">Ready to Take Your Film<br />to the World?</h2>
          <p className="lnd-cta-sub lnd-fade-in">
            Join the waitlist. We're onboarding filmmakers and distributors now.
          </p>

          <div className="lnd-waitlist-form lnd-fade-in" style={{ justifyContent: 'center' }}>
            <button className="lnd-btn-waitlist" onClick={() => { setShowModal(true); setSubmitted(false); setFormError(''); }}>
              Join the Waitlist →
            </button>
          </div>

          <p className="lnd-cta-alt lnd-fade-in">— already have an account? —</p>

          <div className="lnd-cta-links lnd-fade-in">
            <Link to="/login" className="lnd-cta-link-btn">Login to Dashboard</Link>
            <Link to="/signup" className="lnd-cta-link-btn">Sign Up as Filmmaker</Link>
            <Link to="/signup" className="lnd-cta-link-btn">Sign Up as Distributor</Link>
          </div>
        </div>
      </section>

      {/* ============================================================
           FOOTER
      ============================================================ */}
      <footer className="lnd-footer">
        <div className="lnd-footer-inner">
          <div className="lnd-footer-brand">
            <a href="#lnd-hero" onClick={scrollTo('lnd-hero')} className="lnd-nav-logo">
              <span className="lnd-logo-icon">
                🎬
                <span className="lnd-lock-badge">🔒</span>
              </span>
              CineVault
            </a>
            <p className="lnd-footer-tagline">The secure distribution layer independent cinema always needed.</p>
          </div>
          <div className="lnd-footer-links">
            <a href="#lnd-filmmakers" onClick={scrollTo('lnd-filmmakers')}>Filmmakers</a>
            <a href="#lnd-distributors" onClick={scrollTo('lnd-distributors')}>Distributors</a>
            <a href="#lnd-security" onClick={scrollTo('lnd-security')}>Security</a>
            <a href="#lnd-cta-section" onClick={scrollTo('lnd-cta-section')}>Contact</a>
          </div>
        </div>
        <div className="lnd-footer-bottom">
          <span>A platform by <strong style={{ color: '#e2e8f0' }}>VDOJar</strong></span>
          <span>© 2026 CineVault. All rights reserved.</span>
        </div>
      </footer>

      {/* ============================================================
           WAITLIST MODAL
      ============================================================ */}
      {showModal && (
        <div className="lnd-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="lnd-modal">
            <button className="lnd-modal-close" onClick={() => setShowModal(false)}>✕</button>

            {submitted ? (
              <div className="lnd-modal-success">
                <div className="lnd-modal-success-icon">🎬</div>
                <div className="lnd-modal-success-title">You're on the list!</div>
                <p className="lnd-modal-success-msg">
                  Thank you for your interest in CineVault.<br />
                  We'll reach out to you personally to get you started.<br /><br />
                  <span style={{ color: '#f59e0b' }}>— Team VDOJar</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit}>
                <div className="lnd-modal-title">Join the CineVault Waitlist</div>
                <p className="lnd-modal-sub">We're onboarding filmmakers and distributors. Tell us a bit about yourself.</p>

                {formError && <div className="lnd-modal-error">{formError}</div>}

                <div className="lnd-modal-field">
                  <label className="lnd-modal-label">Full Name *</label>
                  <input
                    className="lnd-modal-input"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="lnd-modal-field">
                  <label className="lnd-modal-label">Phone / WhatsApp</label>
                  <input
                    className="lnd-modal-input"
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="lnd-modal-field">
                  <label className="lnd-modal-label">Email Address *</label>
                  <input
                    className="lnd-modal-input"
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="lnd-modal-field">
                  <label className="lnd-modal-label">I am a... *</label>
                  <div className="lnd-modal-checkboxes">
                    <label className="lnd-modal-checkbox-label">
                      <input type="checkbox" name="is_filmmaker" checked={formData.is_filmmaker} onChange={handleChange} />
                      🎥 Filmmaker — I want to distribute my film securely
                    </label>
                    <label className="lnd-modal-checkbox-label">
                      <input type="checkbox" name="is_distributor" checked={formData.is_distributor} onChange={handleChange} />
                      🌍 Distributor — I want to manage screenings across venues
                    </label>
                    <label className="lnd-modal-checkbox-label">
                      <input type="checkbox" name="is_producer" checked={formData.is_producer} onChange={handleChange} />
                      🎬 Producer — I want to explore CineVault for my projects
                    </label>
                  </div>
                </div>

                <div className="lnd-modal-field">
                  <label className="lnd-modal-label">Anything you'd like to share?</label>
                  <textarea
                    className="lnd-modal-textarea"
                    name="remarks"
                    placeholder="Tell us about your film, distribution needs, or any questions..."
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="lnd-modal-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request Early Access →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
