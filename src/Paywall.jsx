import { useState } from "react";

// Replace these with your real Stripe payment links from stripe.com/dashboard
const STRIPE_LINKS = {
  starter_monthly: "https://buy.stripe.com/6oU6oHgEbbZPf3A3qSaAw0j",
  starter_annual:  "https://buy.stripe.com/3cIaEX1Jh7Jz9Jg0eGaAw0k",
  growth_monthly:  "https://buy.stripe.com/9B63cvdrZ2pfdZwf9AaAw0l",
  growth_annual:   "https://buy.stripe.com/14A14n4Vt4xn08GaTkaAw0m",
  pro_monthly:     "https://buy.stripe.com/fZu8wPew34xnf3A9PgaAw0n",
  pro_annual:      "https://buy.stripe.com/9B600j3Rp8NDbRo5z0aAw0o",
};

// ── Promo codes ────────────────────────────────────────────────────────────────
// To activate: go to Stripe Dashboard → Coupons → Create a promotion code
// with the exact code string below, set the discount %, and enable
// "Allow promotion codes" on each payment link.
const PROMO_CODES = {
  "LOKATE":        { discount: 0.50, label: "Lokate Offices — 50% partner rate" },
  "LOKATEOFFICES": { discount: 0.50, label: "Lokate Offices — 50% partner rate" },
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 149,
    annual: 119,
    seats: "1 admin · 1 location · up to 50 members",
    features: [
      "All 6 core modules",
      "Space & booking management",
      "Member profiles & portal",
      "Manual invoicing",
      "Stripe + GoCardless",
      "Basic analytics dashboard",
      "Standard Marketplace listing",
    ],
    missing: ["AI features", "Automated invoicing", "White-label portal", "Team access"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 299,
    annual: 239,
    seats: "3 admins · 2 locations · up to 200 members",
    featured: true,
    features: [
      "Everything in Starter",
      "3 admin seats",
      "AI lead search with lease expiry dates",
      "AI enquiry drafting & summaries",
      "Automated recurring invoices",
      "White-label member portal",
      "Enquiry pipeline & lead CRM",
      "Xero integration",
      "Featured Marketplace listing",
    ],
    missing: ["SMS notifications", "Zapier + Open API", "AI smart pricing"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 599,
    annual: 479,
    seats: "10 admins · Unlimited locations · up to 500 members",
    features: [
      "Everything in Growth",
      "10 admin seats",
      "AI smart pricing suggestions",
      "Advanced analytics & reports",
      "SMS notifications",
      "Zapier + Open API",
      "QuickBooks integration",
      "Priority Marketplace listing",
      "Priority support + SLA",
    ],
    missing: [],
  },
];

const C = {
  dt: "#1A4A4A", mt: "#2A7A72", bt: "#3AADA0",
  lt: "#7DD4CC", pt: "#D6F0EE", sand: "#F5F0E8",
  sand2: "#EDE8DF", ink: "#1C2B2B", inkm: "#3D5252", inkl: "#7A9696",
};

export default function Paywall({ daysLeft = 0, onPrivacy, onTerms }) {
  const [billing, setBilling] = useState("annual");
  const [sel, setSel] = useState("growth");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState("");
  const plan = PLANS.find(p => p.id === sel);
  const price = billing === "annual" ? plan.annual : plan.monthly;
  const isExpired = daysLeft <= 0;

  const finalPrice = promoApplied ? Math.round(price * (1 - promoApplied.discount)) : price;
  const saving = promoApplied ? price - finalPrice : 0;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setPromoApplied({ code, ...PROMO_CODES[code] });
      setPromoError("");
    } else {
      setPromoError("Code not recognised. Check the spelling and try again.");
      setPromoApplied(null);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleCheckout = () => {
    let link = STRIPE_LINKS[sel + "_" + billing];
    if (promoApplied) link += `?prefilled_promo_code=${promoApplied.code}`;
    window.open(link, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 16px 60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
        <svg width="26" height="19" viewBox="0 0 56 40" fill="none">
          <ellipse cx="28" cy="23" rx="15" ry="9" stroke={C.dt} strokeWidth="1.5" fill="none"/>
          <circle cx="40" cy="14" r="6" stroke={C.dt} strokeWidth="1.5" fill="none"/>
          <path d="M44 12 L52 9" stroke={C.dt} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="23" y1="32" x2="21" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="31" y1="32" x2="29" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 22, color: C.dt, letterSpacing: 1 }}>dunlin</span>
      </div>

      {/* Trial status banner */}
      {isExpired ? (
        <div style={{ background: C.dt, borderRadius: 12, padding: "20px 28px", marginBottom: 36, textAlign: "center", maxWidth: 480, width: "100%" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 26, color: C.sand, marginBottom: 8 }}>Your trial has ended.</div>
          <div style={{ fontSize: 14, color: "rgba(214,240,238,0.65)", fontWeight: 300 }}>Choose a plan to keep your leads, pipeline, and outreach history.</div>
        </div>
      ) : (
        <div style={{ background: C.pt, border: "1px solid rgba(58,173,160,0.25)", borderRadius: 10, padding: "14px 20px", marginBottom: 32, textAlign: "center", maxWidth: 480, width: "100%" }}>
          <div style={{ fontSize: 14, color: C.mt, fontWeight: 500 }}>
            {daysLeft === 1 ? "1 day left on your trial." : daysLeft + " days left on your trial."}
          </div>
          <div style={{ fontSize: 13, color: C.inkl, marginTop: 4, fontWeight: 300 }}>Subscribe now to keep everything you've built.</div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, maxWidth: 480, width: "100%" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "clamp(30px,5vw,42px)", color: C.dt, marginBottom: 10, lineHeight: 1.1 }}>
          Choose your plan.
        </h1>
        <p style={{ fontSize: 15, color: C.inkl, fontWeight: 300 }}>Cancel any time. No hidden fees.</p>
      </div>

      {/* Billing toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, background: "#fff", border: "1px solid rgba(26,74,74,0.12)", borderRadius: 8, padding: "4px", boxShadow: "0 1px 6px rgba(26,74,74,0.06)" }}>
        {["monthly", "annual"].map(b => (
          <button key={b} onClick={() => setBilling(b)} style={{ padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13, transition: "all .2s", background: billing === b ? C.dt : "transparent", color: billing === b ? "#fff" : C.inkl }}>
            {b === "annual" ? "Annual · save 20%" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, width: "100%", maxWidth: 800, marginBottom: 24 }}>
        {PLANS.map(p => (
          <div key={p.id} onClick={() => setSel(p.id)} style={{ background: sel === p.id ? C.dt : "#fff", border: "2px solid " + (sel === p.id ? C.dt : "rgba(26,74,74,0.1)"), borderRadius: 12, padding: "22px", cursor: "pointer", transition: "all .2s", position: "relative", boxShadow: sel === p.id ? "0 8px 28px rgba(26,74,74,0.15)" : "0 1px 6px rgba(26,74,74,0.06)" }}>
            {p.featured && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: C.bt, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 9, letterSpacing: 2, padding: "3px 12px", borderRadius: 10, whiteSpace: "nowrap", fontWeight: 500 }}>MOST POPULAR</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 22, color: sel === p.id ? C.sand : C.dt, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: sel === p.id ? "rgba(125,212,204,0.6)" : C.inkl }}>{p.seats}</div>
              </div>
              <div style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid " + (sel === p.id ? C.bt : "rgba(26,74,74,0.2)"), background: sel === p.id ? C.bt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                {sel === p.id && <div style={{ width: 6, height: 6, borderRadius: 3, background: "#fff" }}/>}
              </div>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 36, color: sel === p.id ? "#fff" : C.dt, lineHeight: 1, marginBottom: 14 }}>
              £{billing === "annual" ? p.annual : p.monthly}<span style={{ fontSize: 13, color: sel === p.id ? "rgba(214,240,238,0.45)" : C.inkl, fontWeight: 300 }}>/mo</span>
            </div>
            {p.features.slice(0, 4).map(f => (
              <div key={f} style={{ fontSize: 12, color: sel === p.id ? "rgba(214,240,238,0.7)" : C.inkm, padding: "3px 0", display: "flex", gap: 7, lineHeight: 1.4 }}>
                <span style={{ color: C.bt, flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
            {p.features.length > 4 && <div style={{ fontSize: 11, color: sel === p.id ? "rgba(125,212,204,0.4)" : C.inkl, marginTop: 4 }}>+{p.features.length - 4} more</div>}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ width: "100%", maxWidth: 800, background: "#fff", border: "1px solid rgba(26,74,74,0.1)", borderRadius: 12, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 6px rgba(26,74,74,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 20, color: C.dt }}>{plan.name}</span>
            <span style={{ fontSize: 12, color: C.inkl, marginLeft: 10 }}>{plan.seats} · billed {billing}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 28, color: C.dt }}>
              {promoApplied && <span style={{ textDecoration: "line-through", color: C.inkl, fontSize: 18, marginRight: 6 }}>£{price}</span>}
              £{finalPrice}<span style={{ fontSize: 13, color: C.inkl }}>/mo</span>
            </span>
            {promoApplied && <div style={{ fontSize: 11, color: "#e05a2b", marginTop: 1, fontWeight: 500 }}>£{saving}/mo off — {promoApplied.label}</div>}
            {!promoApplied && billing === "annual" && <div style={{ fontSize: 11, color: C.bt, marginTop: 1 }}>Saving £{(plan.monthly - plan.annual) * 12}/year</div>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 3 }}>
          {plan.features.map(f => (
            <div key={f} style={{ fontSize: 12, color: C.inkm, display: "flex", gap: 7, padding: "2px 0" }}>
              <span style={{ color: C.bt, flexShrink: 0 }}>✓</span>{f}
            </div>
          ))}
        </div>
      </div>

      {/* Promo code */}
      <div style={{ width: "100%", maxWidth: 800, marginBottom: 12 }}>
        {!promoApplied ? (
          <div>
            <div style={{ fontSize: 12, color: C.inkl, marginBottom: 6 }}>Have a promo code?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value); setPromoError(""); }}
                onKeyDown={e => e.key === "Enter" && applyPromo()}
                placeholder="Enter code (e.g. LOKATE)"
                style={{ flex: 1, border: "1px solid " + (promoError ? "#e05a2b" : "rgba(26,74,74,0.15)"), borderRadius: 8, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, background: "#fff", outline: "none" }}
              />
              <button onClick={applyPromo} style={{ background: C.dt, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Apply
              </button>
            </div>
            {promoError && <div style={{ fontSize: 12, color: "#e05a2b", marginTop: 6 }}>{promoError}</div>}
          </div>
        ) : (
          <div style={{ background: "#f0faf8", border: "1px solid rgba(58,173,160,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, color: C.mt, fontWeight: 500 }}>✓ {promoApplied.label}</span>
              <div style={{ fontSize: 11, color: C.inkl, marginTop: 2 }}>Code: {promoApplied.code}</div>
            </div>
            <button onClick={removePromo} style={{ background: "none", border: "none", color: C.inkl, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>Remove</button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ width: "100%", maxWidth: 800 }}>
        <button onClick={handleCheckout} style={{ width: "100%", background: C.bt, color: "#fff", border: "none", padding: "15px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer", borderRadius: 10, marginBottom: 10, transition: "background .15s" }}
          onMouseOver={e => e.target.style.background = C.mt}
          onMouseOut={e => e.target.style.background = C.bt}
        >
          Subscribe to {plan.name} — £{finalPrice}/mo{promoApplied ? ` (was £${price})` : ""}
        </button>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "rgba(122,150,150,0.7)", textAlign: "center", lineHeight: 1.7 }}>
        Secure payment via Stripe · Cancel any time · GDPR compliant
      </p>
      <p style={{ marginTop: 8, fontSize: 12, color: C.inkl, textAlign: "center" }}>
        By subscribing you agree to our{" "}
        <span onClick={onTerms} style={{ color: C.bt, cursor: "pointer" }}>Terms of Service</span>
        {" "}and{" "}
        <span onClick={onPrivacy} style={{ color: C.bt, cursor: "pointer" }}>Privacy Policy</span>.
      </p>
    </div>
  );
}
