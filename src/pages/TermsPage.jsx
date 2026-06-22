import { Link } from 'react-router-dom';
import logo from '../assets/janta-cinema/logo.png';

export default function TermsPage() {
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
          <h1 style={s.title}>Terms &amp; Conditions</h1>
          <p style={s.subtitle}>Last updated: 2023 &nbsp;·&nbsp; Yen Movie Studios Pvt. Ltd.</p>
        </div>

        <div style={s.body}>

          <Section title="Terms of Use">
            <p>This agreement governs your use of products and services provided by <strong>Yen Movie Studios Pvt. Ltd.</strong>, operating as <strong>Janta Cinema</strong> and <strong>Janta Cinema Player</strong> (collectively "YMSPL/JC/JCP"). Please read and accept these terms before accessing the application or website. By accessing or using the platform you agree to be bound by these Terms of Use. The platform reserves authority to deny access to any person who violates these terms.</p>
            <p>The site and application operate <em>"as-is"</em> with no guaranteed uninterrupted availability. Access may be occasionally suspended or restricted to allow for repairs, maintenance, or the introduction of new facilities or services at any time without prior notice.</p>
          </Section>

          <Section title="Eligibility">
            <p>Only individuals who are authorised by law to enter into legally binding agreements may use the platform. If you are a minor (under the age of 18 years), you may use this site only with the involvement of a parent or guardian. The platform reserves the right to deny service, terminate accounts, remove or edit content, or cancel orders at its sole discretion.</p>
            <p>Users must complete due diligence before entering into any transaction. Accounts that have been suspended or terminated for any reason cannot access our services.</p>
            <p>Registration requires you to provide accurate personal information including your name and valid contact details. Upon successful registration you will receive a User ID and password that you must keep confidential. The company may refuse any registration and may suspend or terminate memberships at any time without notice.</p>
          </Section>

          <Section title="Product">
            <p>The term "Product" encompasses all services that users may enrol in on the platform. The platform reserves the right to modify, suspend, or discontinue any aspect of its Product at any time without prior approval or consent from the User(s). YMSPL/JC/JCP shall not be liable to you or any third party for any modification, suspension, or discontinuation of services.</p>
          </Section>

          <Section title="Content">
            <p>All materials available on the platform — including text, images, audio, video, graphics, and software — are protected by copyright and are owned by or licensed to YMSPL/JC/JCP or credited third-party providers. Modification or use of such content on any other website or networked computer environment without prior written consent is strictly prohibited.</p>
            <p>Ownership of content belongs to the respective service providers. Users should direct any grievances about content directly to those providers; Janta Cinema is not responsible for third-party content hosted on the platform.</p>
          </Section>

          <Section title="Privacy Policy">
            <p>By using the YMSPL/JC/JCP Product, you agree that you have understood the disclosure practices described in our <Link to="/privacy" style={s.inlineLink}>Privacy Policy</Link>. Personal information supplied during use of the website is governed by that policy.</p>
            <p>Notwithstanding your registration with the National Do Not Call Registry, you expressly consent to receive communication (including commercial communication) in relation to Products provided by us. You confirm that any such communication shall not be construed as Unsolicited Commercial Communication under TRAI guidelines and that you have specifically opted to receive communication on the telephone or mobile number you have provided.</p>
          </Section>

          <Section title="Rights and Duties of Users">
            <p>You are solely responsible for maintaining the confidentiality of your account and password and for all activities that occur under your account. You must immediately notify us of any unauthorised use of your account. You agree to comply with all applicable laws and to refrain from:</p>
            <ul>
              <li>Accessing unauthorised data, accounts, or computer systems.</li>
              <li>Testing or probing system vulnerabilities without authorisation.</li>
              <li>Disrupting service access through viruses, flooding, mail bombing, or spamming.</li>
              <li>Posting offensive, harassing, defamatory, obscene, or illegal content.</li>
              <li>Sharing instructional information about illegal activities.</li>
              <li>Violating any intellectual property rights belonging to the platform or third parties.</li>
              <li>Transmitting threatening, abusive, or otherwise objectionable material.</li>
            </ul>
            <p>The platform reserves the right to access and disclose personal information when required by court orders, applicable law, professional advisers, or for the purpose of investigating violations and protecting platform security.</p>
            <p>Personal information may be stored and processed in India or in any other country where YMSPL/JC/JCP or its agents, representatives, or group companies maintain storage and processing facilities.</p>
          </Section>

          <Section title="Disclaimers of Warranties and Limitation of Liability">
            <p>All services are provided on an <em>"AS-IS", "AS AVAILABLE"</em> basis. YMSPL/JC/JCP makes no warranties regarding constant availability or the accuracy of any information provided. The platform disclaims all liability for technical errors, computer viruses, or other harmful mechanisms delivered via the site or linked third-party sites.</p>
            <p>Information on this platform is provided for general purposes only and should not be treated as professional advice. <strong>YEN MOVIE STUDIOS PRIVATE LIMITED / JANTA CINEMA / JANTA CINEMA PLAYER</strong> and its affiliates will not be liable for indirect, consequential, special, incidental, punitive, or exemplary damages — including loss of profits — arising out of your use of the platform. Maximum liability shall in no event exceed the amounts paid by you as enrolment fees.</p>
            <p>You agree to indemnify and hold harmless the platform, its owners, affiliates, officers, and employees from any third-party claims, damages, or expenses (including legal fees) arising from your breach of these Terms or violation of applicable law.</p>
          </Section>

          <Section title="Communications">
            <p>When placing an order or registering, you provide a valid phone number or email address. The platform may communicate with you via email, SMS, telephone, WhatsApp, or other modes regarding transactional, promotional, and commercial matters. By registering or using this platform you consent to receive such communications.</p>
          </Section>

          <Section title="Children">
            <p>Use of this site is limited to individuals who can legally enter into binding agreements under the Indian Contract Act, 1872. Persons under the age of 18 may use this site only with the supervision and consent of a parent or legal guardian.</p>
          </Section>

          <Section title="Applicable Law and Jurisdiction">
            <p>These Terms of Use are governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in <strong>Mumbai, Maharashtra</strong>.</p>
          </Section>

          <Section title="Miscellaneous">
            <p>Section headings in these Terms serve for reference only and shall not affect interpretation. The failure of YMSPL/JC/JCP to enforce any right under these Terms shall not constitute a waiver of that right. The company may assign its obligations and rights under these Terms to any other entity at its discretion.</p>
            <p>These Terms of Use, together with the <Link to="/privacy" style={s.inlineLink}>Privacy Policy</Link>, constitute the entire agreement between you and YMSPL/JC/JCP with respect to your use of the platform.</p>
          </Section>

          <Section title="Contact Us">
            <p>For any complaints, queries, or feedback regarding these Terms, please contact:</p>
            <div style={s.contactBox}>
              <p><strong>Yen Movie Studios Pvt. Ltd.</strong></p>
              <p>Office No. 142, Andheri Industrial Estate,<br />Back side of Fun Republic Multiplex,<br />Opp Chitrakoot Ground, Shaha Industrial Estate,<br />Mumbai, Maharashtra – 400053</p>
              <p>Phone: <a href="tel:+919820010591" style={s.inlineLink}>+91 98200 10591</a></p>
              <p>Email: <a href="mailto:yusufmshaikh@gmail.com" style={s.inlineLink}>yusufmshaikh@gmail.com</a></p>
            </div>
          </Section>

        </div>

        <div style={s.bottomNav}>
          <Link to="/privacy" style={s.navLink}>Privacy Policy →</Link>
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
  hero: { marginBottom: '3rem', borderBottom: '1px solid #1e293b', paddingBottom: '2rem' },
  kicker: { color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' },
  title: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' },
  subtitle: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
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
