export default function TermsOfService({ onBack }) {
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
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.updated}>Last updated: March 2026</p>

        <p style={s.p}>These Terms of Service ("Terms") govern your use of the Dunlin platform ("Service") operated by Marvanova ("we", "us", "our"), a company registered in England and Wales.</p>
        <p style={s.p}>By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

        <hr style={s.divider}/>

        <h2 style={s.h2}>1. The Service</h2>
        <p style={s.p}>Dunlin is a software-as-a-service (SaaS) platform for flexible workspace operators. It provides tools for managing spaces, members, bookings, invoicing, and reporting. We grant you a limited, non-exclusive, non-transferable licence to access and use the Service during your subscription term.</p>

        <h2 style={s.h2}>2. Accounts</h2>
        <p style={s.p}>You must be at least 18 years old and have authority to bind your organisation to these Terms. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised access at support@getdunlin.com.</p>

        <h2 style={s.h2}>3. Free Trial</h2>
        <p style={s.p}>We offer a 14-day free trial with no credit card required. At the end of the trial, your account will be restricted unless you subscribe to a paid plan. We reserve the right to modify or end the free trial offer at any time.</p>

        <h2 style={s.h2}>4. Subscriptions and Payment</h2>
        <p style={s.p}>Paid plans are billed monthly or annually in advance. All prices are in GBP and exclusive of VAT, which will be added where applicable. Payment is processed via Stripe. Your subscription renews automatically unless you cancel before the renewal date.</p>
        <p style={s.p}>We reserve the right to change pricing with 30 days' notice. Price changes will not affect your current billing period.</p>

        <h2 style={s.h2}>5. Cancellation and Refunds</h2>
        <p style={s.p}>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — you will retain full access until then. We do not offer refunds for partial billing periods, except where required by law.</p>
        <p style={s.p}>Annual subscribers who cancel within 14 days of their renewal date may request a pro-rata refund for unused months at support@getdunlin.com.</p>

        <h2 style={s.h2}>6. Acceptable Use</h2>
        <p style={s.p}>You agree not to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Use the Service for any unlawful purpose or in violation of any regulations</li>
          <li style={s.li}>Attempt to gain unauthorised access to the Service or its systems</li>
          <li style={s.li}>Resell, sublicense, or redistribute the Service without our written permission</li>
          <li style={s.li}>Upload or transmit malicious code, spam, or harmful content</li>
          <li style={s.li}>Reverse engineer or attempt to extract the source code of the Service</li>
          <li style={s.li}>Use the Service to process data in violation of applicable data protection laws</li>
        </ul>

        <h2 style={s.h2}>7. Your Data</h2>
        <p style={s.p}>You retain ownership of all data you input into the Service ("Your Data"). You grant us a limited licence to store, process, and display Your Data solely to provide the Service. We will not access Your Data except to provide support, comply with legal obligations, or as described in our Privacy Policy.</p>
        <p style={s.p}>You are responsible for ensuring you have the right to store and process any personal data you input, including data about your members and tenants.</p>

        <h2 style={s.h2}>8. Data Export and Deletion</h2>
        <p style={s.p}>You may export your data at any time using the CSV export features within the platform. Upon cancellation, your data will be retained for 90 days and then permanently deleted. You may request immediate deletion by contacting support@getdunlin.com.</p>

        <h2 style={s.h2}>9. Intellectual Property</h2>
        <p style={s.p}>The Service, including its design, code, trademarks, and content, is owned by Marvanova and protected by intellectual property laws. These Terms do not grant you any ownership rights in the Service. The "Dunlin" name and brand are the property of Marvanova.</p>

        <h2 style={s.h2}>10. Availability and Support</h2>
        <p style={s.p}>We aim to maintain high availability of the Service but do not guarantee uninterrupted access. We may carry out maintenance, which we will aim to schedule outside of UK business hours. Support is provided by email at support@getdunlin.com. Response times vary by plan.</p>

        <h2 style={s.h2}>11. Limitation of Liability</h2>
        <p style={s.p}>To the maximum extent permitted by law, Marvanova shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of profits, data, or business opportunity.</p>
        <p style={s.p}>Our total liability to you for any claim arising under these Terms shall not exceed the total fees paid by you in the 12 months preceding the claim.</p>
        <p style={s.p}>Nothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p>

        <h2 style={s.h2}>12. Indemnification</h2>
        <p style={s.p}>You agree to indemnify and hold harmless Marvanova from any claims, damages, or expenses arising from your use of the Service, your breach of these Terms, or your violation of any third-party rights.</p>

        <h2 style={s.h2}>13. Termination</h2>
        <p style={s.p}>We may suspend or terminate your account immediately if you breach these Terms, fail to pay, or if we are required to do so by law. Upon termination, your right to use the Service ceases immediately. Sections relating to intellectual property, limitation of liability, and governing law survive termination.</p>

        <h2 style={s.h2}>14. Changes to These Terms</h2>
        <p style={s.p}>We may update these Terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. Your continued use of the Service after that date constitutes acceptance. If you do not agree to the changes, you may cancel your subscription before they take effect.</p>

        <h2 style={s.h2}>15. Governing Law</h2>
        <p style={s.p}>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h2 style={s.h2}>16. Contact</h2>
        <p style={s.p}>For any questions about these Terms, contact us at support@getdunlin.com.</p>

        <hr style={s.divider}/>
        <p style={{...s.p, color: "#7A9696", fontSize: 12}}>Marvanova · getdunlin.com · support@getdunlin.com</p>
      </div>
    </div>
  );
}
