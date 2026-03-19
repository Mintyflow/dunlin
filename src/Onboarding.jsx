import { useState, useEffect } from "react";

const C = {
  dt: "#1A4A4A", mt: "#2A7A72", bt: "#3AADA0",
  lt: "#7DD4CC", pt: "#D6F0EE", sand: "#F5F0E8",
  sand2: "#EDE8DF", ink: "#1C2B2B", inkm: "#3D5252", inkl: "#7A9696",
};

const Bird = ({ size = 32, color = C.dt }) => (
  <svg width={size} height={size * 0.72} viewBox="0 0 56 40" fill="none">
    <ellipse cx="28" cy="23" rx="15" ry="9" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="40" cy="14" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M44 12 L52 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="23" y1="32" x2="21" y2="40" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="31" y1="32" x2="29" y2="40" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const STEPS = [
  {
    id: "welcome",
    bg: C.dt,
    icon: "bird",
    title: "Welcome to dunlin.",
    subtitle: "One quick tour — then you're ready to go.",
    body: "dunlin finds UK office managers, verifies their contact details, and estimates when their serviced office contracts are due for renewal. You reach the right people at exactly the right moment — not randomly.",
    tip: null,
    visual: null,
  },
  {
    id: "timing",
    bg: C.sand,
    icon: "📅",
    title: "The renewal window is everything.",
    subtitle: "This is the whole point of dunlin",
    body: "A cold call to an office manager is annoying. A call two months before their contract renewal — when they're already thinking about their options — is welcome. dunlin shows you exactly when each tenant's contract is likely due, so you call at the right moment.",
    tip: "Start with the red contacts in the Renewal tab. They're in the decision window right now.",
    visual: "calendar",
  },
  {
    id: "search",
    bg: C.sand,
    icon: "🔍",
    title: "Search any UK location.",
    subtitle: "Real contacts, in seconds",
    body: "Type any UK city, town, or postcode and hit Find Contacts. dunlin generates a list of office managers at serviced office buildings in that area — with estimated contract dates, phone numbers, and email addresses.",
    tip: "Start with cities where you already have relationships. The familiar building names help you spot the best leads.",
    visual: "search",
  },
  {
    id: "email",
    bg: C.sand,
    icon: "✉",
    title: "Email verification runs automatically.",
    subtitle: "Know before you send",
    body: "Every email address is checked against live DNS records in the background the moment results appear. A green dot means the email is deliverable. Amber means risky. Red means skip it — don't waste a send on a dead address.",
    tip: "Watch the header — it shows a live count as emails are verified. Wait for green before sending a campaign.",
    visual: "email",
  },
  {
    id: "calendar",
    bg: C.sand,
    icon: "🗓",
    title: "The Renewal tab is your priority list.",
    subtitle: "Red means call today",
    body: "The Renewal tab sorts every contact by how soon their contract expires. Red is this month. Amber is 60 days. Blue is 6 months out. Tap the stat cards at the top to filter by urgency — your week's calls should come from the red column.",
    tip: "Check the Renewal tab every Monday morning. That's your call list for the week.",
    visual: "renewal",
  },
  {
    id: "pipeline",
    bg: C.sand,
    icon: "⬦",
    title: "Move leads through the pipeline.",
    subtitle: "New → Contacted → Interested → Converted",
    body: "The Pipeline tab is your kanban board. Drag leads between stages as you work them. When you log an outreach attempt, dunlin moves the lead automatically — a reply bumps them to Contacted, an interested response to Interested.",
    tip: "Interested is your most important column. Those are warm leads — don't let them go cold.",
    visual: "pipeline",
  },
  {
    id: "outreach",
    bg: C.sand,
    icon: "◉",
    title: "Log every contact attempt.",
    subtitle: "Follow-ups are where deals are made",
    body: "On the Outreach tab, tap + Log on any contact to record a call, email, WhatsApp, or meeting. Choose an outcome — no reply, interested, not now, or converted. Set a follow-up date and dunlin will remind you at the top of the app on the day it's due.",
    tip: "Set a 2-week follow-up for anyone who says 'not right now'. Timing changes. Circumstances change. Be the person who calls back.",
    visual: "outreach",
  },
  {
    id: "import",
    bg: C.sand,
    icon: "↑",
    title: "Bring your existing contacts in.",
    subtitle: "CSV import + manual entry",
    body: "Already have a spreadsheet of contacts? Import it on the Search tab. dunlin deduplicates automatically and verifies every email in the background. You can also add individual contacts manually — from LinkedIn, a business card, or a referral.",
    tip: "Import your existing list first. dunlin will verify the emails and add everyone to the renewal calendar automatically.",
    visual: "import",
  },
  {
    id: "ch",
    bg: C.sand,
    icon: "🏛",
    title: "Companies House data enriches every lead.",
    subtitle: "Real company data, automatically",
    body: "When you find a contact, dunlin looks up their company on Companies House in the background. The company registration number, incorporation date, and registered address appear in the expanded contact card. A company incorporated 2–3 years ago is likely approaching their first major lease renewal — a particularly warm prospect.",
    tip: "Open a contact card and look for the CH Number and Incorporated date. The older the company, the more likely they've renewed before and know what they want.",
    visual: "ch",
  },
  {
    id: "ready",
    bg: C.dt,
    icon: "bird",
    title: "You're ready.",
    subtitle: "Go find your first lead",
    body: "Head to the Search tab, type a location, and hit Find Contacts. Your first real results will be ready in seconds. Check the Renewal tab to see who's coming up. Log your first outreach. Build the pipeline.",
    tip: null,
    visual: null,
  },
];

// Visual mockups for each step
function Visual({ type }) {
  const style = {
    background: "#fff",
    border: "1px solid rgba(26,74,74,0.1)",
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    boxShadow: "0 2px 12px rgba(26,74,74,0.08)",
  };

  if (type === "calendar") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5 }}>RENEWAL CALENDAR</div>
      {[
        { name: "James Okafor", co: "Meridian Group", days: 12, color: "#ef4444", label: "Due this month" },
        { name: "Claire Hutchins", co: "Vertex Digital", days: 58, color: "#f59e0b", label: "60 days" },
        { name: "Sarah Winters", co: "TechFlow Solutions", days: 143, color: "#3AADA0", label: "6 months" },
      ].map(r => (
        <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(26,74,74,0.06)" }}>
          <div style={{ width: 3, height: 40, borderRadius: 2, background: r.color, flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, fontFamily: "'DM Sans',sans-serif" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: C.inkl }}>{r.co}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, color: r.color, lineHeight: 1 }}>{r.days}</div>
            <div style={{ fontSize: 10, color: r.color, opacity: 0.7 }}>days</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (type === "email") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>EMAIL VERIFICATION</div>
      {[
        { email: "s.winters@techflow.co.uk", status: "valid", label: "Deliverable" },
        { email: "j.okafor@meridian.com", status: "risky", label: "Risky — role address" },
        { email: "info@vertexdigital.co.uk", status: "invalid", label: "Invalid domain" },
      ].map(r => {
        const col = r.status === "valid" ? "#16a34a" : r.status === "risky" ? "#d97706" : "#ef4444";
        return (
          <div key={r.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(26,74,74,0.06)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: col, flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: 12, color: C.inkm, fontFamily: "'DM Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
            <div style={{ fontSize: 10, color: col, flexShrink: 0 }}>{r.label}</div>
          </div>
        );
      })}
    </div>
  );

  if (type === "pipeline") return (
    <div style={{ ...style, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        { label: "New", color: "#7A9696", leads: ["Daniel Marsh", "Yasmin Shah"] },
        { label: "Contacted", color: "#3AADA0", leads: ["Marcus Reid"] },
        { label: "Interested", color: "#2A7A72", leads: ["Priya Nair"] },
        { label: "Converted", color: "#1A4A4A", leads: ["Claire Hutchins"] },
      ].map(col => (
        <div key={col.label} style={{ background: "#EDE8DF", borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 10, color: col.color, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5 }}>{col.label}</div>
          {col.leads.map(l => (
            <div key={l} style={{ background: "#fff", borderRadius: 5, padding: "6px 8px", marginBottom: 4, fontSize: 11, color: C.inkm, borderLeft: "3px solid " + col.color, fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
          ))}
        </div>
      ))}
    </div>
  );

  if (type === "outreach") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>OUTREACH LOG</div>
      {[
        { type: "📞 Call", outcome: "Interested", date: "Today", followup: "02 Apr", color: "#2A7A72" },
        { type: "✉ Email", outcome: "No reply", date: "Mar 14", followup: "Mar 28", color: "#7A9696" },
        { type: "💬 WhatsApp", outcome: "Not now", date: "Mar 10", followup: "Apr 10", color: "#d97706" },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(26,74,74,0.06)", alignItems: "flex-start" }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color, flexShrink: 0, marginTop: 4 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>{r.outcome}</span>
              <span style={{ fontSize: 11, color: C.inkl }}>{r.date}</span>
            </div>
            <div style={{ fontSize: 11, color: C.inkl }}>{r.type} · Follow-up: <span style={{ color: "#2A7A72" }}>{r.followup}</span></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (type === "ch") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>COMPANIES HOUSE DATA</div>
      <div style={{ background: C.pt, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>TechFlow Solutions Ltd</div>
        {[
          ["CH Number", "12847631"],
          ["Incorporated", "15 March 2022"],
          ["Status", "Active"],
          ["Reg. Address", "London, EC2M 7HA"],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,74,74,0.08)" }}>
            <span style={{ fontSize: 11, color: C.inkl, fontFamily: "'DM Sans',sans-serif" }}>{l}</span>
            <span style={{ fontSize: 11, color: C.inkm, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 11, color: "#2A7A72", fontFamily: "'DM Sans',sans-serif" }}>
          Incorporated 2022 — likely approaching first major renewal
        </div>
      </div>
    </div>
  );

  if (type === "search") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>SEARCH RESULTS — MANCHESTER</div>
      {[
        { name: "James Okafor", title: "Facilities Manager", co: "Meridian Group", building: "Bruntwood Circle Sq" },
        { name: "Claire Hutchins", title: "Office Manager", co: "Vertex Digital", building: "Regus Spinningfields" },
      ].map(r => (
        <div key={r.name} style={{ padding: "10px 0", borderBottom: "1px solid rgba(26,74,74,0.06)" }}>
          <div style={{ fontWeight: 500, fontSize: 13, color: C.ink, fontFamily: "'DM Sans',sans-serif" }}>{r.name}</div>
          <div style={{ fontSize: 11, color: C.inkl }}>{r.title} · {r.co}</div>
          <div style={{ fontSize: 11, color: "#3AADA0", marginTop: 2 }}>📍 {r.building}</div>
        </div>
      ))}
    </div>
  );

  if (type === "import") return (
    <div style={style}>
      <div style={{ fontSize: 11, color: C.inkl, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>CSV IMPORT</div>
      <div style={{ background: "#EDE8DF", borderRadius: 8, padding: 12, textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>↑</div>
        <div style={{ fontSize: 13, color: C.inkm, fontFamily: "'DM Sans',sans-serif" }}>Drop your spreadsheet here</div>
        <div style={{ fontSize: 11, color: C.inkl, marginTop: 4 }}>Name, Email, Company, Contract Due...</div>
      </div>
      <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans',sans-serif" }}>✓ Duplicates removed automatically</div>
      <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans',sans-serif" }}>✓ Emails verified in background</div>
    </div>
  );

  return null;
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const isDark = current.bg === C.dt;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap";
    if (!document.getElementById("dunlin-fonts")) {
      link.id = "dunlin-fonts";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,74,74,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: current.bg, borderRadius: 18, width: "100%", maxWidth: 520, overflow: "hidden", boxShadow: "0 40px 80px rgba(26,74,74,0.35)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(26,74,74,0.1)" }}>
          <div style={{ height: "100%", background: "#3AADA0", borderRadius: 2, transition: "width 0.4s ease", width: ((step + 1) / STEPS.length * 100) + "%" }}/>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>

          {/* Step counter & skip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {current.icon === "bird"
                ? <Bird size={20} color={isDark ? "rgba(255,255,255,0.7)" : C.dt}/>
                : <span style={{ fontSize: 20 }}>{current.icon}</span>
              }
              <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.4)" : C.inkl, fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5 }}>
                {step + 1} of {STEPS.length}
              </span>
            </div>
            {!isLast && (
              <button onClick={onComplete} style={{ background: "none", border: "none", color: isDark ? "rgba(255,255,255,0.3)" : C.inkl, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
                Skip tour
              </button>
            )}
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: isDark ? C.lt : C.bt, marginBottom: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
            {current.subtitle}
          </div>

          {/* Title */}
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 32, color: isDark ? C.sand : C.dt, lineHeight: 1.15, marginBottom: 16 }}>
            {current.title}
          </h2>

          {/* Body */}
          <p style={{ fontSize: 15, color: isDark ? "rgba(214,240,238,0.75)" : C.inkm, lineHeight: 1.7, fontWeight: 300, fontFamily: "'DM Sans',sans-serif", marginBottom: current.tip || current.visual ? 16 : 0 }}>
            {current.body}
          </p>

          {/* Visual mockup */}
          {current.visual && <Visual type={current.visual}/>}

          {/* Tip */}
          {current.tip && (
            <div style={{ background: isDark ? "rgba(58,173,160,0.12)" : C.pt, border: "1px solid " + (isDark ? "rgba(125,212,204,0.2)" : "rgba(58,173,160,0.25)"), borderLeft: "3px solid #3AADA0", borderRadius: 8, padding: "10px 14px", marginTop: 16 }}>
              <span style={{ fontSize: 10, color: C.bt, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", display: "block", marginBottom: 4, fontWeight: 500 }}>Pro tip</span>
              <span style={{ fontSize: 13, color: isDark ? "rgba(214,240,238,0.7)" : C.mt, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>{current.tip}</span>
            </div>
          )}

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 24, marginBottom: 4 }}>
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#3AADA0" : i < step ? (isDark ? "rgba(125,212,204,0.4)" : "rgba(58,173,160,0.3)") : (isDark ? "rgba(255,255,255,0.1)" : "rgba(26,74,74,0.12)"), border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }}/>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: "none", border: "1px solid " + (isDark ? "rgba(255,255,255,0.15)" : "rgba(26,74,74,0.15)"), color: isDark ? "rgba(255,255,255,0.5)" : C.inkl, padding: "12px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", borderRadius: 8 }}>
                ← Back
              </button>
            )}
            <button
              onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
              style={{ flex: 2, background: "#3AADA0", color: "#fff", border: "none", padding: "12px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 8, transition: "background .15s" }}
              onMouseOver={e => e.target.style.background = "#2A7A72"}
              onMouseOut={e => e.target.style.background = "#3AADA0"}
            >
              {isLast ? "Start using dunlin →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
