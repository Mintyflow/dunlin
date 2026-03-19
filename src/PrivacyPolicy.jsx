import { useEffect } from "react";

const C = {
  dt: "#1A4A4A", bt: "#3AADA0", sand: "#F5F0E8",
  sand2: "#EDE8DF", ink: "#1C2B2B", inkm: "#3D5252", inkl: "#7A9696",
};

const Bird = () => (
  <svg width="22" height="16" viewBox="0 0 56 40" fill="none">
    <ellipse cx="28" cy="23" rx="15" ry="9" stroke={C.dt} strokeWidth="1.5" fill="none"/>
    <circle cx="40" cy="14" r="6" stroke={C.dt} strokeWidth="1.5" fill="none"/>
    <path d="M44 12 L52 9" stroke={C.dt} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="23" y1="32" x2="21" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="31" y1="32" x2="29" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 26, color: C.dt, marginBottom: 14 }}>{title}</h2>
    <div style={{ fontSize: 15, color: C.inkm, lineHeight: 1.8, fontWeight: 300 }}>{children}</div>
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;
const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

export default function PrivacyPolicy({ onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ background: C.dt, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="16" viewBox="0 0 56 40" fill="none">
            <ellipse cx="28" cy="23" rx="15" ry="9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="14" r="6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M44 12 L52 9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 20, color: "#F5F0E8", letterSpacing: 1 }}>dunlin</span>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "6px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            ← Back
          </button>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 32px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.bt, textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Sans',sans-serif" }}>Legal</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 48, color: C.dt, lineHeight: 1.1, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: C.inkl }}>Last updated: 19 March 2026</p>
        </div>

        <Section title="Who we are">
          <P>dunlin is operated by Marvanova Ltd, a company registered in England and Wales. Our service is available at www.getdunlin.com.</P>
          <P>If you have any questions about this privacy policy or how we handle your data, please contact us at privacy@getdunlin.com.</P>
        </Section>

        <Section title="What data we collect">
          <P>We collect the following categories of personal data:</P>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <Li><strong>Account data:</strong> your name and email address when you sign up.</Li>
            <Li><strong>Usage data:</strong> searches you run, contacts you save, outreach logs you create, and pipeline stages you set.</Li>
            <Li><strong>Payment data:</strong> processed securely by Stripe. We do not store your card details.</Li>
            <Li><strong>Technical data:</strong> IP address, browser type, and session data for security and analytics.</Li>
          </ul>
          <P>We also surface publicly available information from Companies House and other public registers to enrich lead data. This information is already in the public domain.</P>
        </Section>

        <Section title="How we use your data">
          <ul style={{ paddingLeft: 20 }}>
            <Li>To provide and improve the dunlin service</Li>
            <Li>To send transactional emails (account confirmation, password reset, billing)</Li>
            <Li>To process your subscription payment via Stripe</Li>
            <Li>To comply with legal obligations</Li>
            <Li>To analyse usage and improve the product</Li>
          </ul>
          <P style={{ marginTop: 12 }}>We do not sell your personal data to third parties. We do not use your data for advertising.</P>
        </Section>

        <Section title="Legal basis for processing">
          <P>We process your data under the following lawful bases under UK GDPR:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Contract:</strong> processing necessary to deliver the service you've signed up for.</Li>
            <Li><strong>Legitimate interests:</strong> improving our product, fraud prevention, and security.</Li>
            <Li><strong>Legal obligation:</strong> compliance with UK law.</Li>
            <Li><strong>Consent:</strong> for optional communications, where applicable.</Li>
          </ul>
        </Section>

        <Section title="Data storage and security">
          <P>Your data is stored securely using Supabase (hosted in the EU) with encryption at rest and in transit. We use industry-standard security practices and access controls.</P>
          <P>We retain your account data for as long as you have an active account. If you close your account, we delete your personal data within 30 days, except where required by law.</P>
        </Section>

        <Section title="Your rights">
          <P>Under UK GDPR, you have the right to:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Access the personal data we hold about you</Li>
            <Li>Correct inaccurate data</Li>
            <Li>Request deletion of your data</Li>
            <Li>Object to or restrict processing</Li>
            <Li>Data portability</Li>
            <Li>Withdraw consent at any time</Li>
          </ul>
          <P style={{ marginTop: 12 }}>To exercise any of these rights, email us at privacy@getdunlin.com. We will respond within 30 days.</P>
        </Section>

        <Section title="Cookies">
          <P>We use only essential cookies required to keep you signed in and maintain your session. We do not use advertising or tracking cookies.</P>
        </Section>

        <Section title="Third-party services">
          <P>We use the following third-party services to operate dunlin:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Supabase</strong> — authentication and database (EU hosted)</Li>
            <Li><strong>Stripe</strong> — payment processing</Li>
            <Li><strong>Netlify</strong> — hosting and deployment</Li>
            <Li><strong>Anthropic</strong> — AI-powered search results</Li>
            <Li><strong>Companies House API</strong> — public company data enrichment</Li>
          </ul>
          <P style={{ marginTop: 12 }}>Each of these services has their own privacy policy and processes data in accordance with their terms.</P>
        </Section>

        <Section title="Changes to this policy">
          <P>We may update this policy from time to time. We will notify you of material changes by email or via the app. The date at the top of this page shows when it was last updated.</P>
        </Section>

        <Section title="Contact">
          <P>Marvanova Ltd<br/>privacy@getdunlin.com<br/>www.getdunlin.com</P>
        </Section>
      </div>

      <div style={{ background: C.dt, padding: "28px 32px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 18, color: "rgba(245,240,232,0.5)", letterSpacing: 1 }}>dunlin</span>
      </div>
    </div>
  );
}
