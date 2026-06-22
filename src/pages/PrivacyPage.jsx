import { Link } from 'react-router-dom';
import logo from '../assets/janta-cinema/logo.png';

export default function PrivacyPage() {
  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <Link to="/" style={s.brandLink}>
          <img src={logo} alt="Janta Cinema" style={{ height: 40, width: 'auto' }} />
        </Link>
        <Link to="/" style={s.backLink}>← Back to home</Link>
      </div>

      <div style={s.container}>
        <div style={s.hero}>
          <p style={s.kicker}>Legal</p>
          <h1 style={s.title}>Privacy Policy</h1>
          <p style={s.subtitle}>Last updated: 2023 &nbsp;·&nbsp; Yen Movie Studios Pvt. Ltd. (operating as Janta Cinema)</p>
        </div>

        <div style={s.intro}>
          <p>At <strong>Yen Movie Studios Pvt. Ltd.</strong> ("YMSPL", "Janta Cinema", "Janta Cinema Player", "we", "us", or "our"), your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect personal information when you use our website, mobile application, and related services (collectively, the "Platform").</p>
          <p>By accessing or using the Platform you acknowledge that you have read, understood, and agreed to this Privacy Policy. If you do not agree, please discontinue use of the Platform immediately.</p>
        </div>

        <div style={s.body}>

          <Section title="1. Information We Collect">
            <p>We collect personal information that you voluntarily provide when you register, place an order, or otherwise interact with the Platform. This includes:</p>
            <ul>
              <li><strong>Identity &amp; contact data</strong> — full name, email address, mobile number, and postal address.</li>
              <li><strong>Account credentials</strong> — User ID and password (passwords are stored in an encrypted format).</li>
              <li><strong>Transaction data</strong> — details of services you purchase or enquire about, payment records, and order history.</li>
              <li><strong>Technical data</strong> — IP address, browser type and version, device identifiers, operating system, referring URLs, and pages visited.</li>
              <li><strong>Usage data</strong> — information about how you navigate the Platform, features you interact with, and screening activity.</li>
              <li><strong>Communications</strong> — messages or enquiries you send us through any channel.</li>
            </ul>
            <p>We do not knowingly collect sensitive personal information (such as financial card details) directly; payment processing is handled through compliant third-party payment gateways.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We process your personal data for the following purposes:</p>
            <ul>
              <li><strong>Account management</strong> — creating and maintaining your account, verifying identity, and providing customer support.</li>
              <li><strong>Service delivery</strong> — processing screening requests, issuing screening keys, and managing film allocations.</li>
              <li><strong>Communications</strong> — sending transactional notifications (booking confirmations, key dispatches) and promotional or commercial messages about our Products and services via email, SMS, WhatsApp, telephone, or other channels you have opted into.</li>
              <li><strong>Platform improvement</strong> — analysing usage patterns, diagnosing technical issues, and developing new features.</li>
              <li><strong>Legal compliance</strong> — fulfilling obligations under applicable Indian law, responding to lawful requests from government or regulatory authorities, and enforcing our <Link to="/terms" style={s.inlineLink}>Terms &amp; Conditions</Link>.</li>
              <li><strong>Security</strong> — detecting, investigating, and preventing fraudulent transactions and other illegal activities.</li>
            </ul>
          </Section>

          <Section title="3. Consent to Communications">
            <p>By registering on or using the Platform, you expressly consent to receive communications from YMSPL/JC/JCP — including commercial and promotional communications — on the telephone number or email address you have provided, regardless of your registration with the National Do Not Call (NDNC) Registry or the National Customer Preference Register (NCPR) maintained under the Telecom Regulatory Authority of India (TRAI).</p>
            <p>You confirm that any communication received from us shall not be treated as Unsolicited Commercial Communication under TRAI guidelines, as you have specifically opted to receive it. You may withdraw this consent at any time by contacting us at the details in Section 10; however, doing so may limit your ability to use certain features of the Platform.</p>
          </Section>

          <Section title="4. Sharing Your Information">
            <p>We do not sell or rent your personal information to third parties. We may share your data with:</p>
            <ul>
              <li><strong>Service providers</strong> — trusted vendors who assist us in operating the Platform (cloud hosting, payment processing, email delivery, analytics), bound by confidentiality obligations.</li>
              <li><strong>Group companies and affiliates</strong> — YMSPL's related entities for the purposes described in this policy.</li>
              <li><strong>Law enforcement &amp; regulators</strong> — when we are legally required to do so, or when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or comply with a judicial proceeding, court order, or legal process.</li>
              <li><strong>Business transfers</strong> — in the event of a merger, acquisition, or sale of all or a portion of our assets, your personal data may be transferred as part of that transaction.</li>
            </ul>
            <p>Any third party receiving your data is required to protect it in a manner consistent with this Privacy Policy.</p>
          </Section>

          <Section title="5. Data Storage and International Transfers">
            <p>Your personal information may be stored and processed in India or in any other country where YMSPL/JC/JCP or its agents, representatives, or group companies maintain storage and processing facilities. By providing your personal information you consent to such transfer and processing.</p>
            <p>Where data is transferred outside India, we take steps to ensure that appropriate protections are in place in compliance with applicable data protection law.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your personal data for as long as your account is active or as needed to provide you with our services. We will also retain and use your data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. When data is no longer required we take reasonable steps to delete or anonymise it securely.</p>
          </Section>

          <Section title="7. Cookies and Tracking Technologies">
            <p>The Platform uses cookies and similar tracking technologies to enhance your experience, remember your preferences, and gather analytics data. Types of cookies we use include:</p>
            <ul>
              <li><strong>Essential cookies</strong> — necessary for the Platform to function (e.g., session management, login state).</li>
              <li><strong>Analytics cookies</strong> — help us understand how visitors interact with the Platform (e.g., pages visited, time spent).</li>
              <li><strong>Preference cookies</strong> — remember your choices such as language or region settings.</li>
            </ul>
            <p>You can control or disable cookies through your browser settings; however, disabling essential cookies may affect the functionality of the Platform.</p>
          </Section>

          <Section title="8. Security">
            <p>We implement industry-standard technical and organisational measures to protect your personal data against unauthorised access, loss, alteration, or disclosure. These include encrypted data transmission (HTTPS/TLS), encrypted storage for sensitive data, and role-based access controls.</p>
            <p>However, no method of transmission over the internet or electronic storage is completely secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee absolute security.</p>
          </Section>

          <Section title="9. Your Rights">
            <p>Subject to applicable law, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request that we correct inaccurate or incomplete personal data.</li>
              <li><strong>Deletion</strong> — request deletion of your personal data where there is no compelling reason for its continued processing.</li>
              <li><strong>Withdraw consent</strong> — withdraw consent to communications at any time (subject to the note in Section 3).</li>
            </ul>
            <p>To exercise any of these rights, please contact us using the details in Section 10. We will respond within a reasonable time frame and in accordance with applicable law.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of any material changes by posting the updated policy on this page with a revised "Last updated" date. Your continued use of the Platform after any change constitutes your acceptance of the new policy.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact our Grievance Officer:</p>
            <div style={s.contactBox}>
              <p><strong>Yen Movie Studios Pvt. Ltd.</strong></p>
              <p>Office No. 142, Andheri Industrial Estate,<br />Back side of Fun Republic Multiplex,<br />Opp Chitrakoot Ground, Shaha Industrial Estate,<br />Mumbai, Maharashtra – 400053</p>
              <p>Phone: <a href="tel:+919820010591" style={s.inlineLink}>+91 98200 10591</a></p>
              <p>Email: <a href="mailto:yusufmshaikh@gmail.com" style={s.inlineLink}>yusufmshaikh@gmail.com</a></p>
            </div>
            <p>We will acknowledge your request within 72 hours and aim to resolve it within 30 days.</p>
          </Section>

        </div>

        <div style={s.bottomNav}>
          <Link to="/terms" style={s.navLink}>Terms &amp; Conditions →</Link>
          <Link to="/" style={s.navLinkSecondary}>← Back to Janta Cinema</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={s.section}>
      <h2 style={s.sectionTitle}>{title}</h2>
      <div style={s.sectionBody}>{children}</div>
    </section>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', zIndex: 10 },
  brandLink: { textDecoration: 'none' },
  backLink: { color: '#64748b', fontSize: '0.875rem', textDecoration: 'none' },
  container: { maxWidth: 780, margin: '0 auto', padding: '3rem 2rem 5rem' },
  hero: { marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '2rem' },
  kicker: { color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' },
  title: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' },
  subtitle: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
  intro: { color: '#94a3b8', lineHeight: 1.75, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', padding: '1.5rem', background: '#1e293b', borderRadius: 10, border: '1px solid #334155' },
  body: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  section: {},
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.875rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid #1e293b' },
  sectionBody: { color: '#94a3b8', lineHeight: 1.75, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  inlineLink: { color: '#f59e0b', textDecoration: 'underline', textUnderlineOffset: 3 },
  contactBox: { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#cbd5e1', lineHeight: 1.7 },
  bottomNav: { marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  navLink: { color: '#f59e0b', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 },
  navLinkSecondary: { color: '#64748b', fontSize: '0.875rem', textDecoration: 'none' },
};
