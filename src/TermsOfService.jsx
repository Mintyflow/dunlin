import { useEffect } from "react";

const C = {
  dt: "#1A4A4A", bt: "#3AADA0", sand: "#F5F0E8",
  sand2: "#EDE8DF", ink: "#1C2B2B", inkm: "#3D5252", inkl: "#7A9696",
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 26, color: C.dt, marginBottom: 14 }}>{title}</h2>
    <div style={{ fontSize: 15, color: C.inkm, lineHeight: 1.8, fontWeight: 300 }}>{children}</div>
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;
const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

export default function TermsOfService({ onBack }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

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
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.bt, textTransform: "uppercase", marginBottom: 14 }}>Legal</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 48, color: C.dt, lineHeight: 1.1, marginBottom: 16 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: C.inkl }}>Last updated: 19 March 2026</p>
        </div>

        <Section title="Agreement to terms">
          <P>By accessing or using dunlin at www.getdunlin.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</P>
          <P>dunlin is operated by Marvanova Ltd, a company registered in England and Wales ("we", "us", "our").</P>
        </Section>

        <Section title="The service">
          <P>dunlin is a SaaS platform that provides office intelligence tools for flexible workspace operators and brokers, including contact discovery, email verification, contract renewal tracking, and outreach management.</P>
          <P>We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice.</P>
        </Section>

        <Section title="Your account">
          <P>You must create an account to use dunlin. You are responsible for:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Keeping your login credentials secure</Li>
            <Li>All activity that occurs under your account</Li>
            <Li>Ensuring your account information is accurate and up to date</Li>
          </ul>
          <P style={{ marginTop: 12 }}>You must be at least 18 years old to create an account. Business accounts must be authorised by the organisation they represent.</P>
        </Section>

        <Section title="Acceptable use">
          <P>You agree to use dunlin only for lawful business purposes. You must not:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li>Use the service to send unsolicited bulk communications (spam)</Li>
            <Li>Scrape or systematically extract data from the platform</Li>
            <Li>Attempt to gain unauthorised access to our systems</Li>
            <Li>Use the service in a way that violates GDPR or other applicable data protection law</Li>
            <Li>Resell or sublicense access to the service without written permission</Li>
            <Li>Use contact data obtained through dunlin for purposes other than legitimate B2B outreach</Li>
          </ul>
        </Section>

        <Section title="Data and contact information">
          <P>dunlin surfaces publicly available information from Companies House, public registers, and AI-generated estimates. We do not guarantee the accuracy, completeness, or currency of any contact data.</P>
          <P>You are responsible for ensuring your use of contact data complies with applicable law, including UK GDPR and the Privacy and Electronic Communications Regulations (PECR).</P>
          <P>Contract renewal dates shown in dunlin are estimates based on publicly available data. They should be treated as indicative only, not as definitive information.</P>
        </Section>

        <Section title="Subscription and payment">
          <P>dunlin is offered on a subscription basis. Plans and pricing are shown at www.getdunlin.com. By subscribing, you authorise us to charge your payment method on a recurring basis.</P>
          <P>All subscriptions include a 14-day free trial. No credit card is required to start a trial. At the end of the trial period, you will need to provide payment details to continue using the service.</P>
          <P>Subscriptions renew automatically unless cancelled. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period — we do not offer partial refunds.</P>
          <P>We reserve the right to change our pricing. We will give you at least 30 days' notice of any price increase.</P>
        </Section>

        <Section title="Intellectual property">
          <P>dunlin and all related content, features, and functionality are owned by Marvanova Ltd and are protected by UK and international intellectual property law.</P>
          <P>You retain ownership of any data you import into dunlin. By using the service, you grant us a limited licence to process your data to provide the service.</P>
        </Section>

        <Section title="Limitation of liability">
          <P>To the maximum extent permitted by law, Marvanova Ltd shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of dunlin.</P>
          <P>Our total liability to you for any claim arising from these terms or your use of the service shall not exceed the amount you paid us in the 12 months preceding the claim.</P>
        </Section>

        <Section title="Termination">
          <P>We may terminate or suspend your account if you breach these terms, with immediate effect. You may close your account at any time from your account settings.</P>
          <P>On termination, your right to use the service ceases immediately. We will delete your data in accordance with our Privacy Policy.</P>
        </Section>

        <Section title="Governing law">
          <P>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</P>
        </Section>

        <Section title="Contact">
          <P>Marvanova Ltd<br/>legal@getdunlin.com<br/>www.getdunlin.com</P>
        </Section>
      </div>

      <div style={{ background: C.dt, padding: "28px 32px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 18, color: "rgba(245,240,232,0.5)", letterSpacing: 1 }}>dunlin</span>
      </div>
    </div>
  );
}
