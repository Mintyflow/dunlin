export default function PrivacyPolicy({ onBack }) {
  const s = {
    wrap: { minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif", padding: "0 0 80px" },
    header: { background: "#1A4A4A", padding: "20px 32px", display: "flex", alignItems: "center", gap: 12, marginBottom: 48 },
    wordmark: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "white", letterSpacing: "0.08em" },
    back: { background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginRight: "auto" },
    inner: { maxWidth: 720, margin: "0 auto", padding: "0 24px" },
    h1: { fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: "#1A4A4A", marginBottom: 8 },
    updated: { fontSize: 13, color: "#7A9696", marginBottom: 40 },
    h2: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, color: "#1A4A4A", marginTop: 40, marginBottom: 12 },
    p: { fontSize: 14, color: "#3D5252", lineHeight: 1.8, marginBottom: 14 },
    ul: { paddingLeft: 20, marginBottom: 14 },
    li: { fontSize: 14, color: "#3D5252", lineHeight: 1.8, marginBottom: 6 },
    divider: { border: "none", borderTop: "1px solid rgba(26,74,74,0.1)", margin: "40px 0" },
  };

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div style={s.header}>
        <svg width="28" height="19" viewBox="0 0 120 80" fill="none">
          <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
          <circle cx="88" cy="34" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
          <path d="M96 36 Q108 36 112 40" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M35 46 Q22 40 18 44" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
        <span style={s.wordmark}>dunlin</span>
        <button style={s.back} onClick={onBack}>← Back</button>
      </div>
      <div style={s.inner}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: March 2026</p>

        <p style={s.p}>Dunlin is operated by Marvanova Ltd, a company registered in England and Wales. We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
        <p style={s.p}>This policy explains how we collect, use, store, and protect your personal data when you use our platform at getdunlin.com.</p>

        <hr style={s.divider}/>

        <h2 style={s.h2}>1. Who We Are</h2>
        <p style={s.p}>Data Controller: Marvanova Ltd</p>
        <p style={s.p}>Contact: privacy@getdunlin.com</p>
        <p style={s.p}>Website: getdunlin.com</p>

        <h2 style={s.h2}>2. What Data We Collect</h2>
        <p style={s.p}>We collect the following categories of personal data:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Account data:</strong> your name, email address, and password when you register</li>
          <li style={s.li}><strong>Business data:</strong> your company name, address, and contact details</li>
          <li style={s.li}><strong>Usage data:</strong> how you interact with the platform, pages visited, features used</li>
          <li style={s.li}><strong>Billing data:</strong> payment information processed securely via Stripe — we do not store card details</li>
          <li style={s.li}><strong>Member data:</strong> data you enter about your own members and tenants as part of using the platform</li>
          <li style={s.li}><strong>Communications:</strong> emails and support messages you send to us</li>
        </ul>

        <h2 style={s.h2}>3. How We Use Your Data</h2>
        <p style={s.p}>We use your personal data to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Provide and operate the Dunlin platform</li>
          <li style={s.li}>Process payments and manage your subscription</li>
          <li style={s.li}>Send you service emails (confirmations, reminders, trial expiry notices)</li>
          <li style={s.li}>Respond to support requests</li>
          <li style={s.li}>Improve the platform through aggregated, anonymised usage analytics</li>
          <li style={s.li}>Comply with our legal obligations</li>
        </ul>
        <p style={s.p}>We will never sell your personal data to third parties or use it for advertising purposes.</p>

        <h2 style={s.h2}>4. Legal Basis for Processing</h2>
        <p style={s.p}>We process your data under the following legal bases:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Contract:</strong> processing necessary to provide the service you have signed up for</li>
          <li style={s.li}><strong>Legitimate interests:</strong> analytics and platform improvement, fraud prevention</li>
          <li style={s.li}><strong>Legal obligation:</strong> compliance with applicable laws</li>
          <li style={s.li}><strong>Consent:</strong> where we have asked for and received your explicit consent</li>
        </ul>

        <h2 style={s.h2}>5. Data You Hold About Your Members</h2>
        <p style={s.p}>When you use Dunlin to manage your members and tenants, you act as a Data Controller for that data, and Marvanova Ltd acts as a Data Processor on your behalf. We process that data only according to your instructions and this policy. You are responsible for ensuring you have a lawful basis for storing your members' data in Dunlin.</p>

        <h2 style={s.h2}>6. Third-Party Services</h2>
        <p style={s.p}>We use the following trusted third-party services to operate the platform:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Supabase</strong> — database and authentication (EU-hosted)</li>
          <li style={s.li}><strong>Stripe</strong> — payment processing (PCI DSS compliant)</li>
          <li style={s.li}><strong>Resend</strong> — transactional email delivery</li>
          <li style={s.li}><strong>Vercel</strong> — platform hosting</li>
          <li style={s.li}><strong>Netlify</strong> — platform hosting</li>
        </ul>
        <p style={s.p}>Each of these providers has their own privacy policy and operates under appropriate data protection agreements.</p>

        <h2 style={s.h2}>7. Data Retention</h2>
        <p style={s.p}>We retain your account data for as long as your account is active. If you cancel your subscription, we will retain your data for 90 days to allow for reactivation, after which it will be permanently deleted. You may request immediate deletion at any time by contacting privacy@getdunlin.com.</p>

        <h2 style={s.h2}>8. Your Rights</h2>
        <p style={s.p}>Under UK GDPR, you have the right to:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Access</strong> the personal data we hold about you</li>
          <li style={s.li}><strong>Rectify</strong> inaccurate or incomplete data</li>
          <li style={s.li}><strong>Erase</strong> your data ("right to be forgotten")</li>
          <li style={s.li}><strong>Restrict</strong> how we process your data</li>
          <li style={s.li}><strong>Port</strong> your data to another service</li>
          <li style={s.li}><strong>Object</strong> to processing based on legitimate interests</li>
          <li style={s.li}><strong>Withdraw consent</strong> at any time where processing is based on consent</li>
        </ul>
        <p style={s.p}>To exercise any of these rights, contact us at privacy@getdunlin.com. We will respond within 30 days.</p>

        <h2 style={s.h2}>9. Cookies</h2>
        <p style={s.p}>We use strictly necessary cookies to operate the platform (session management and authentication). We do not use advertising or tracking cookies. For full details, see our Cookie Policy.</p>

        <h2 style={s.h2}>10. Security</h2>
        <p style={s.p}>We implement appropriate technical and organisational measures to protect your data, including encrypted data transmission (HTTPS), secure authentication, and access controls. No system is completely secure, and we cannot guarantee absolute security, but we take all reasonable steps to protect your information.</p>

        <h2 style={s.h2}>11. Changes to This Policy</h2>
        <p style={s.p}>We may update this policy from time to time. We will notify you of any material changes by email or via the platform. Your continued use of Dunlin after changes are posted constitutes acceptance of the updated policy.</p>

        <h2 style={s.h2}>12. Complaints</h2>
        <p style={s.p}>If you have concerns about how we handle your data, please contact us first at privacy@getdunlin.com. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.</p>

        <hr style={s.divider}/>
        <p style={{...s.p, color: "#7A9696", fontSize: 12}}>Marvanova Ltd · getdunlin.com · privacy@getdunlin.com</p>
      </div>
    </div>
  );
}
