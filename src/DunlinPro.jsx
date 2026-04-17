import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
const DISPOSABLE = new Set(["mailinator.com","guerrillamail.com","tempmail.com","throwaway.email","yopmail.com","trashmail.com","trashmail.me","dispostable.com","maildrop.cc","discard.email","fakeinbox.com","mailnesia.com"]);
const ROLE_PREFIXES = new Set(["admin","info","contact","support","sales","hello","help","no-reply","noreply","mail","email","office","team","enquiries","enquiry","webmaster","postmaster","billing","accounts","marketing","hr","legal","ops"]);
function validSyntax(e){return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(e);}
async function checkMX(domain){try{const r=await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,{headers:{Accept:"application/json"}});if(!r.ok)return null;const d=await r.json();if(d.Status===3)return false;return(d.Answer||[]).filter(r=>r.type===15).length>0;}catch{return null;}}
async function verifyEmail(email){if(!email||email==="unknown")return{status:"unknown",score:0,detail:"No email"};email=email.trim().toLowerCase();if(!validSyntax(email))return{status:"invalid",score:0,detail:"Invalid format"};const[local,domain]=email.split("@");if(DISPOSABLE.has(domain))return{status:"invalid",score:10,detail:"Disposable domain"};const isRole=ROLE_PREFIXES.has(local);const mx=await checkMX(domain);if(mx===false)return{status:"invalid",score:15,detail:"No mail server for domain"};let score=50;if(mx===true)score+=25;if(!isRole)score+=10;if(/^[a-z]+\.[a-z]+$/.test(local))score+=15;else if(/^[a-z]\.[a-z]+$/.test(local))score+=10;if(domain.endsWith(".co.uk")||domain.endsWith(".com"))score+=5;if(/\d/.test(local))score-=5;score=Math.max(0,Math.min(100,score));const status=score>=75?"valid":score>=50?"risky":"invalid";const detail=mx===null?`Pattern looks ${status} — DNS inconclusive`:isRole?`Role address — mail server confirmed`:`Mail server confirmed for ${domain}`;return{status,score,detail,isRole,hasMX:mx};}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const MONTHS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
function parseExpiry(str){if(!str||str==="unknown")return null;// Handle "Est. 2026" format
if(str.startsWith("Est. ")){const yr=parseInt(str.replace("Est. ",""));if(!isNaN(yr))return new Date(yr,5,1);}const d=new Date(`1 ${str}`);return isNaN(d.getTime())?null:d;}
function daysBetween(a,b){return Math.round((b-a)/(1000*60*60*24));}
function urgency(days){if(days<0)return{label:"Overdue",color:"#ef4444",bg:"#fff0f0",border:"#f0c0c0"};if(days<=30)return{label:"This month",color:"#ef4444",bg:"#fff0f0",border:"#f0c0c0"};if(days<=60)return{label:"60 days",color:"#f59e0b",bg:"#fff8e0",border:"#c8980a"};if(days<=90)return{label:"90 days",color:"#fbbf24",bg:"#141000",border:"#2a2000"};if(days<=180)return{label:"6 months",color:"#3aada0",bg:"#b0d4cf",border:"#0a2828"};return{label:"6m+",color:"#3a6a6a",bg:"#f0ece3",border:"#b8d4cf"};}
const newId=()=>Date.now()+Math.floor(Math.random()*1000);

const PIPELINE_STAGES=[
  {id:"new",      label:"New",       color:"#3a6a6a"},
  {id:"contacted",label:"Contacted", color:"#3aada0"},
  {id:"interested",label:"Interested",color:"#22c55e"},
  {id:"converted",label:"Converted", color:"#1a7a72"},
];

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const SAMPLE=[
  {id:1,name:"Sarah Winters",title:"Office Manager",phone:"+44 20 7123 4567",email:"s.winters@techflow.co.uk",company:"TechFlow Solutions Ltd",building:"WeWork Liverpool Street",location:"London, EC2M",tenure:"2 years 4 months",contract_expiry:"August 2026",source:"Demo",confidence:"high",found:new Date().toISOString()},
  {id:2,name:"James Okafor",title:"Facilities Manager",phone:"+44 161 456 7890",email:"jokafor@meridiangroup.com",company:"Meridian Group UK",building:"Bruntwood Circle Square",location:"Manchester, M1",tenure:"11 months",contract_expiry:"April 2026",source:"Demo",confidence:"medium",found:new Date().toISOString()},
  {id:3,name:"Priya Nair",title:"Operations Director",phone:"+44 121 234 5678",email:"p.nair@novacreative.co.uk",company:"Nova Creative Agency",building:"Brindleyplace Business Quarter",location:"Birmingham, B1",tenure:"3 years 1 month",contract_expiry:"May 2026",source:"Demo",confidence:"high",found:new Date().toISOString()},
  {id:4,name:"Daniel Marsh",title:"Office Manager",phone:"+44 113 321 9988",email:"d.marsh@axiompartners.co.uk",company:"Axiom Partners Ltd",building:"Platform Leeds",location:"Leeds, LS1",tenure:"8 months",contract_expiry:"November 2026",source:"Demo",confidence:"medium",found:new Date().toISOString()},
  {id:5,name:"Claire Hutchins",title:"Office Manager",phone:"+44 161 555 0234",email:"c.hutchins@vertexdigital.co.uk",company:"Vertex Digital",building:"Regus Spinningfields",location:"Manchester, M3",tenure:"1 year 2 months",contract_expiry:"June 2026",source:"Demo",confidence:"high",found:new Date().toISOString()},
  {id:6,name:"Marcus Reid",title:"Facilities Director",phone:"+44 20 7890 1234",email:"m.reid@clearstone.co.uk",company:"Clearstone Advisory",building:"IWG The Shard",location:"London, SE1",tenure:"2 years",contract_expiry:"July 2026",source:"Demo",confidence:"high",found:new Date().toISOString()},
];

const BLANK_LEAD={name:"",title:"",phone:"",email:"",company:"",building:"",location:"",tenure:"",contract_expiry:"",source:"Manual",confidence:"medium"};

// ─── MAP APOLLO RESULT → LEAD FORMAT ─────────────────────────────────────────
function mapApolloResult(r, loc) {
  const chAddress = r.companiesHouse?.registeredAddress || "";
  const contractExpiry = r.leaseEstimate
    ? `Est. ${r.leaseEstimate.estimatedYear}`
    : "";
  const tenureSince = r.companiesHouse?.incorporationDate
    ? `Since ${new Date(r.companiesHouse.incorporationDate).getFullYear()}`
    : "";
  // Apollo email status → confidence mapping
  const emailStatus = r.emailStatus || (r.emailVerified ? "verified" : "unavailable");
  const confidence = emailStatus === "verified" ? "high" : emailStatus === "likely to engage" ? "medium" : "low";
  return {
    id: newId() + Math.floor(Math.random() * 9999),
    name: r.name || "",
    title: r.title || "",
    email: r.email || "",
    emailStatus,                        // "verified" | "likely to engage" | "unavailable"
    phone: r.phone || "",
    company: r.company?.name || "",
    building: chAddress,
    location: r.company?.location || loc || "United Kingdom",
    tenure: tenureSince,
    contract_expiry: contractExpiry,
    source: r.companiesHouse ? "Apollo + Companies House" : "Apollo",
    confidence,
    found: new Date().toISOString(),
    linkedin: r.linkedIn || "",
    photo: r.photo || "",
    leaseConfidence: r.leaseEstimate?.confidence || null,
    leaseBasis: r.leaseEstimate?.basis || null,
    companySite: r.company?.domain || null,
    companySize: r.company?.size || null,
    companyIndustry: r.company?.industry || null,
    spacePressureScore: r.spacePressureScore ?? null,
    headcountGrowth: r.headcountGrowth || null,
    funding: r.funding || null,
    techStack: r.techStack || [],
  };
}

// ─── EMAIL SEQUENCES ──────────────────────────────────────────────────────────
const DEFAULT_SEQUENCES = [
  {
    id: "renewal-radar",
    name: "Lease Renewal Outreach",
    description: "5-step cadence for companies approaching renewal. Warm intro → value → case study → direct ask → final.",
    steps: [
      { day: 0,  subject: "Quick question about your office space, {name}",
        body: `Hi {name},\n\nI came across {company} and noticed you're based in the {location} area — I work with businesses there who are reviewing their office situation, and given the current market I wanted to reach out.\n\nAre you likely to be reviewing your space in the next 6–12 months? Happy to share what's available and what comparable companies are paying right now.\n\nWorth a quick chat?\n\nBest,` },
      { day: 3,  subject: "Re: Office space in {location}",
        body: `Hi {name},\n\nFollowing up on my note from earlier this week — just wanted to make sure it didn't get lost.\n\nWe've recently helped a number of {industry} businesses in {location} negotiate significantly better terms on their next space — whether that's a move, a renewal, or a flex arrangement.\n\nWould you be open to a 15-minute call to explore what options look like?\n\nBest,` },
      { day: 7,  subject: "{company} — office market update for {location}",
        body: `Hi {name},\n\nI wanted to share something useful regardless of where you are in your space planning. Rents in {location} have moved meaningfully in the last 12 months, and we're seeing companies of your size securing deals that weren't on the market 6 months ago.\n\nIf you're open to it, I'd love to put together a brief market snapshot specific to your requirements — no obligation, just useful context.\n\nLet me know and I'll send it over.\n\nBest,` },
      { day: 14, subject: "One more thought on {company}'s office plans",
        body: `Hi {name},\n\nI know inboxes get busy — I'll keep this brief.\n\nWe have a few options in {location} that I think would be a strong fit for a team of your size. I'd rather share them with someone who'll appreciate them than let them sit on a list.\n\nAre you the right person to talk to about office decisions at {company}, or should I be speaking to someone else?\n\nEither way, happy to help.\n\nBest,` },
      { day: 21, subject: "Closing the loop — {company}",
        body: `Hi {name},\n\nI've reached out a few times over the past few weeks and I don't want to clog your inbox further — so this will be my last note for now.\n\nIf your office situation changes or you'd like to understand what your options look like, I'm easy to find.\n\nWishing you and {company} well.\n\nBest,` },
    ],
  },
  {
    id: "flex-operator",
    name: "Flex Operator Warm Pitch",
    description: "3-step sequence for operators pitching their building directly to growing companies.",
    steps: [
      { day: 0,  subject: "Office space near you — {company}",
        body: `Hi {name},\n\nI run a flexible workspace in {location} and noticed {company} is based nearby. We work with a number of growing teams who need space that moves with them — private offices, part-time desks, or a dedicated floor.\n\nWould it be useful to see what we have? Happy to arrange a tour at your convenience.\n\nBest,` },
      { day: 5,  subject: "Quick follow-up — workspace for {company}",
        body: `Hi {name},\n\nJust checking in on my note from a few days ago. We've had a couple of teams move in recently who were in a similar position to {company} — growing fast and needing flexibility.\n\nIf timing isn't right now, no problem at all — but I'd rather you had our details for when it is.\n\nAre you open to a quick tour?\n\nBest,` },
      { day: 12, subject: "Last note — workspace in {location}",
        body: `Hi {name},\n\nFinal note from me — I don't want to be a nuisance.\n\nIf you ever need flexible workspace in {location}, we're here. We've helped a number of local businesses through transitions, and we make it easy.\n\nFeel free to reach out any time.\n\nBest,` },
    ],
  },
];

function applyTokens(text, lead) {
  return text
    .replace(/\{name\}/g, lead.name?.split(" ")[0] || "there")
    .replace(/\{company\}/g, lead.company || "your company")
    .replace(/\{location\}/g, lead.location?.replace(/, UK/, "").replace(/, United Kingdom/, "") || "your area")
    .replace(/\{industry\}/g, lead.companyIndustry || "your sector");
}

// ─── GUIDED TOUR STEPS ────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    target: null,
    title: "Welcome to Dunlin Renewal Radar 👋",
    body: "The only tool that tells you which companies need new office space right now — not just who they are, but how urgently they need to move. Let's take a 60-second tour.",
    cta: "Show me around →",
    skip: "Skip tour",
  },
  {
    target: "[data-tour='search']",
    title: "Search by location",
    body: "Type any UK city, postcode, or area. Dunlin searches Apollo's database of 270M+ contacts to find Office Managers, Facilities Directors, and Operations leads near you.",
    cta: "Next →",
    tip: "below",
  },
  {
    target: "[data-tour='renewal']",
    title: "Renewal Radar calendar 📅",
    body: "Your daily hit list. See exactly which companies' leases expire in 30, 60, or 90 days — sorted by urgency. Nobody else shows you this. This is your unfair advantage.",
    cta: "Next →",
    tip: "below",
  },
  {
    target: "[data-tour='leads']",
    title: "Space Pressure Score™",
    body: "Every contact gets a 0–100 score combining lease urgency + headcount growth + recent funding + seniority. HOT (70+) = they likely need space right now. Stop guessing who to call first.",
    cta: "Next →",
    tip: "below",
  },
  {
    target: "[data-tour='sequences']",
    title: "Built-in outreach sequences ✉",
    body: "Pre-written email cadences for lease renewals and flex operator pitches. Personalised with the contact's name, company and location. One click opens your email client, ready to send.",
    cta: "Next →",
    tip: "below",
  },
  {
    target: "[data-tour='settings']",
    title: "One key to unlock everything ⚙",
    body: "Add your Apollo.io Organisation plan API key in Settings to run live searches. Without it you're in demo mode — the data is real once connected.",
    cta: "Go to Settings →",
    tip: "below",
    goTo: "settings",
  },
  {
    target: null,
    title: "You're all set 🎉",
    body: "Start with a location search, check the Renewal Radar for urgent leads, and use the Space Pressure Score to prioritise who to call first. Questions? Hit the ? tab anytime.",
    cta: "Start searching",
    goTo: "search",
  },
];

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "What is the Space Pressure Score?", a: "A proprietary 0–100 score we calculate for every contact, combining four signals: estimated lease urgency (how close their company is to renewal), headcount growth (are they expanding?), recent funding (do they have budget to move?), and seniority (are they the decision-maker?). A score of 70+ means HOT — they likely need new space right now." },
  { q: "How does lease expiry estimation work?", a: "Dunlin cross-references Apollo contact data with UK Companies House filings to estimate when a company's lease is likely to expire. We look at incorporation date, address history, and company size to generate an estimated renewal year. It's an intelligence signal, not a guarantee — but it's significantly better than guessing." },
  { q: "What does the traffic light email system mean?", a: "Green (VERIFIED) = Apollo has confirmed this email is valid. Amber (LIKELY) = Apollo rates it as likely to engage, or our DNS check confirms the mail server exists. Red (NO EMAIL / INVALID) = we couldn't find or confirm a valid email. Always start with green, warm up amber, skip red." },
  { q: "Do I need an Apollo API key?", a: "Yes, for live searches. Dunlin uses Apollo.io's database of 270M+ contacts. You'll need an Apollo Organisation plan — the free tier won't work. Without a key you can still explore the tool in demo mode. Add your key under Settings." },
  { q: "What's the difference between demo mode and live mode?", a: "Demo mode shows you a set of sample contacts across UK cities so you can explore all the features without an API key. Live mode runs real searches against Apollo's database and returns actual contacts, verified emails, and real company data." },
  { q: "Can I push contacts to my CRM?", a: "Yes — Dunlin has a built-in HubSpot integration. Add your HubSpot private app API key in Settings, then push individual leads or your full lead list to HubSpot with one click. Contacts are created with all key fields mapped." },
  { q: "What are email sequences?", a: "Pre-written, multi-step email campaigns specific to lease renewal scenarios. Dunlin includes two templates out of the box: a 5-step Lease Renewal Outreach cadence and a 3-step Flex Operator Warm Pitch. Each step is personalised with the contact's name, company, and location. When you're ready to send, one click opens your email client with the message pre-filled." },
  { q: "How do I use the Pipeline?", a: "The Pipeline tab gives you a Kanban board to track contacts through your sales stages: New → Contacted → Interested → Converted. Drag and drop contacts between columns. Changes sync to your account so your pipeline is always up to date." },
  { q: "Is my data private?", a: "Yes. Each Dunlin account is completely isolated — your leads, pipeline, and API keys are visible only to you. We use Supabase with row-level security, meaning database queries are scoped to your user ID at the database level." },
  { q: "How is Dunlin different from VTS, CoStar or Leasecake?", a: "VTS and CoStar are enterprise landlord tools costing £10k–£40k/year, built for managing existing portfolios — not for finding new clients. Leasecake is a tenant-side lease management tool. Dunlin is purpose-built for the flex space operator doing outbound BD: find who needs space, score them by urgency, and contact them before your competitors do." },
];

export default function App({ session, onBack }){
  const userId = session?.user?.id;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [tab,setTab]=useState("search");
  const [loc,setLoc]=useState("");
  const [bType,setBType]=useState("any");
  const [leads,setLeads]=useState([]);
  const [emailChecks,setEmailChecks]=useState({});
  const [verifying,setVerifying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [dbLoading,setDbLoading]=useState(true);
  const [error,setError]=useState(null);
  const [demo,setDemo]=useState(false);
  const [history,setHistory]=useState([]);
  const [expanded,setExpanded]=useState(null);

  // ── Apollo key state ─────────────────────────────────────────────────────────
  const [apolloKey,setApolloKey]=useState("");
  const [apolloKeyInput,setApolloKeyInput]=useState("");
  const [apolloKeyStatus,setApolloKeyStatus]=useState("idle");
  const [apolloKeyMessage,setApolloKeyMessage]=useState("");
  const [showApolloKey,setShowApolloKey]=useState(false);

  // ── Sequences ──────────────────────────────────────────────────────────────
  const [enrollments,setEnrollments]=useState({}); // {leadId: {seqId, enrolledAt, step, done}}
  const [seqView,setSeqView]=useState("tasks");    // "tasks" | "library" | "enrolled"
  const [seqPreview,setSeqPreview]=useState(null); // {seqId, stepIdx, lead}
  const [hubspotKey,setHubspotKey]=useState("");
  const [hubspotKeyInput,setHubspotKeyInput]=useState("");
  const [hubspotStatus,setHubspotStatus]=useState("idle");
  const [hubspotMsg,setHubspotMsg]=useState("");

  // ── My Account dropdown ────────────────────────────────────────────────────
  const [showAccount,setShowAccount]=useState(false);

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const [pipeline,setPipeline]=useState({});
  const [dragId,setDragId]=useState(null);
  const [dragOver,setDragOver]=useState(null);

  // ── Calendar ──────────────────────────────────────────────────────────────
  const [calView,setCalView]=useState("timeline");
  const [calFilter,setCalFilter]=useState("all");
  const [calSearch,setCalSearch]=useState("");
  const [calSel,setCalSel]=useState(null);
  const [showExpired,setShowExpired]=useState(false);

  // ── Outreach ──────────────────────────────────────────────────────────────
  const [outreach,setOutreach]=useState({});
  const [outreachForm,setOutreachForm]=useState(null);
  const [newLog,setNewLog]=useState({type:"email",note:"",outcome:"no_reply",followup:""});
  const [outreachSearch,setOutreachSearch]=useState("");

  // ── Manual entry ──────────────────────────────────────────────────────────
  const [showAddForm,setShowAddForm]=useState(false);
  const [addForm,setAddForm]=useState(BLANK_LEAD);
  const [addError,setAddError]=useState("");

  // ── CSV import ────────────────────────────────────────────────────────────
  const csvRef=useRef(null);
  const abortRef=useRef(null);

  // ── Guided tour ───────────────────────────────────────────────────────────
  const [tourStep,setTourStep]=useState(null);
  const [tourRect,setTourRect]=useState(null);
  const [faqOpen,setFaqOpen]=useState(null);

  // Start tour on first login
  useEffect(()=>{
    if(userId&&!dbLoading){
      if(!localStorage.getItem(`dunlin_tour_${userId}`)){
        setTimeout(()=>setTourStep(0),600);
      }
    }
  },[userId,dbLoading]);

  // Spotlight: measure target element whenever step changes
  useEffect(()=>{
    if(tourStep===null){setTourRect(null);return;}
    const t=TOUR_STEPS[tourStep]?.target;
    if(!t){setTourRect(null);return;}
    const measure=()=>{
      const el=document.querySelector(t);
      if(el){const r=el.getBoundingClientRect();setTourRect({top:r.top,left:r.left,w:r.width,h:r.height});}
    };
    const timer=setTimeout(measure,120);
    return()=>clearTimeout(timer);
  },[tourStep]);

  const completeTour=(goTo)=>{
    setTourStep(null);setTourRect(null);
    if(userId)localStorage.setItem(`dunlin_tour_${userId}`,"1");
    if(goTo)setTab(goTo);
  };

  // ── Load data from Supabase on mount ──────────────────────────────────────
  useEffect(()=>{
    if(!userId){setDbLoading(false);return;}
    (async()=>{
      // Load leads
      const {data:leadsData}=await supabase.from("leads").select("*").eq("user_id",userId).order("created_at",{ascending:false});
      if(leadsData&&leadsData.length){
        setLeads(leadsData.map(l=>({...l,found:l.found_at})));
      }
      // Load pipeline
      const {data:pipelineData}=await supabase.from("pipeline").select("*").eq("user_id",userId);
      if(pipelineData&&pipelineData.length){
        const map={};
        pipelineData.forEach(p=>{map[p.lead_id]=p.stage;});
        setPipeline(map);
      }
      // Load outreach
      const {data:outreachData}=await supabase.from("outreach").select("*").eq("user_id",userId).order("logged_at",{ascending:false});
      if(outreachData&&outreachData.length){
        const map={};
        outreachData.forEach(o=>{
          if(!map[o.lead_id])map[o.lead_id]=[];
          map[o.lead_id].push({...o,date:o.logged_at,followup:o.followup||""});
        });
        setOutreach(map);
      }
      // Load Apollo API key from profiles
      const {data:profileData}=await supabase.from("profiles").select("apollo_api_key,hubspot_api_key").eq("user_id",userId).single();
      if(profileData?.apollo_api_key){
        setApolloKey(profileData.apollo_api_key);
        setApolloKeyInput(profileData.apollo_api_key);
      }
      if(profileData?.hubspot_api_key){
        setHubspotKey(profileData.hubspot_api_key);
        setHubspotKeyInput(profileData.hubspot_api_key);
      }

      setDbLoading(false);
    })();
  },[userId]);

  // ── Background email verification ─────────────────────────────────────────
  useEffect(()=>{
    const unchecked=leads.filter(l=>l.email&&l.email!=="unknown"&&!emailChecks[l.id]);
    if(!unchecked.length)return;
    setVerifying(true);
    (async()=>{
      for(const r of unchecked){
        const result=await verifyEmail(r.email);
        setEmailChecks(p=>({...p,[r.id]:result}));
        await new Promise(res=>setTimeout(res,150));
      }
      setVerifying(false);
    })();
  },[leads]);

  // ── Today helpers ──────────────────────────────────────────────────────────
  const now=useMemo(()=>{const d=new Date();d.setHours(0,0,0,0);return d;},[]);

  const followupsDueToday=useMemo(()=>{
    const today=now.toISOString().split("T")[0];
    const due=[];
    Object.entries(outreach).forEach(([id,logs])=>{
      logs.forEach(log=>{
        if(log.followup&&log.followup===today){
          const lead=leads.find(l=>String(l.id)===String(id));
          if(lead) due.push({lead,log});
        }
      });
    });
    return due;
  },[outreach,leads,now]);

  // ── Apollo key functions ───────────────────────────────────────────────────
  const saveApolloKey=async()=>{
    if(!apolloKeyInput.trim()||apolloKeyInput.length<10){
      setApolloKeyMessage("Please enter a valid API key.");
      setApolloKeyStatus("error");
      return;
    }
    setApolloKeyStatus("saving");setApolloKeyMessage("");
    const{error}=await supabase.from("profiles").update({apollo_api_key:apolloKeyInput.trim()}).eq("user_id",userId);
    if(error){setApolloKeyStatus("error");setApolloKeyMessage("Could not save. Please try again.");return;}
    setApolloKey(apolloKeyInput.trim());
    setApolloKeyStatus("saved");setApolloKeyMessage("API key saved. You can now run live searches.");
    setTimeout(()=>setApolloKeyStatus("idle"),3000);
  };

  const testApolloKey=async()=>{
    if(!apolloKey)return;
    setApolloKeyStatus("testing");setApolloKeyMessage("Testing your Apollo connection…");
    try{
      const res=await fetch("https://api.apollo.io/api/v1/mixed_people/search",{
        method:"POST",
        headers:{"Content-Type":"application/json","X-Api-Key":apolloKey},
        body:JSON.stringify({person_titles:["Office Manager"],person_locations:["United Kingdom"],per_page:1,page:1}),
      });
      if(res.status===401||res.status===403){setApolloKeyStatus("invalid");setApolloKeyMessage("Key rejected. Make sure you're using an Organisation plan key.");return;}
      if(res.ok){setApolloKeyStatus("valid");setApolloKeyMessage("✓ Connected! Apollo key is working correctly.");return;}
      setApolloKeyStatus("invalid");setApolloKeyMessage(`Apollo returned an error (${res.status}). Try again.`);
    }catch{setApolloKeyStatus("invalid");setApolloKeyMessage("Could not reach Apollo. Check your internet connection.");}
  };

  const removeApolloKey=async()=>{
    if(!window.confirm("Remove your Apollo key? Searches will use demo data until you add a new one."))return;
    setApolloKeyStatus("saving");
    await supabase.from("profiles").update({apollo_api_key:null}).eq("user_id",userId);
    setApolloKey("");setApolloKeyInput("");setApolloKeyStatus("idle");setApolloKeyMessage("Key removed.");
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const run=async()=>{
    if(!loc.trim()){setError("Enter a location.");return;}
    setLoading(true);setError(null);

    // Demo mode — use sample data
    if(demo){
      await new Promise(r=>setTimeout(r,1500));
      const newLeads=SAMPLE.filter(s=>!leads.find(l=>l.email===s.email));
      setLeads(p=>[...p,...newLeads]);
      setHistory(p=>[{loc,bType,count:newLeads.length,date:new Date().toISOString(),mode:"Demo"},...p].slice(0,20));
      setLoading(false);setTab("results");return;
    }

    // Live mode — check for Apollo key
    if(!apolloKey){
      setError("no_apollo_key");
      setLoading(false);
      return;
    }

    const controller=new AbortController();abortRef.current=controller;
    const timer=setTimeout(()=>controller.abort(),30000);

    try{
      const res=await fetch("/.netlify/functions/search",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${session?.access_token||""}`,
        },
        signal:controller.signal,
        body:JSON.stringify({
          query:loc.trim(),
          apolloApiKey:apolloKey,
          filters:{
            officeType:bType!=="any"?bType:undefined,
            perPage:25,
          }
        })
      });
      clearTimeout(timer);

      const data=await res.json();

      if(!res.ok){
        if(data.error==="no_apollo_key"){setError("no_apollo_key");return;}
        if(data.error==="apollo_auth_failed"){setError("Your Apollo API key was rejected. Go to Settings and check your key.");return;}
        if(data.error==="apollo_rate_limit"){setError("Apollo search limit reached. Please wait a moment and try again.");return;}
        throw new Error(data.error||"Search failed. Please try again.");
      }

      if(!data.results||!data.results.length){
        setError("No contacts found for this location. Try a different city or broader search term.");
        setLoading(false);
        return;
      }

      // Map Apollo results to lead format
      const newR=data.results.map(r=>mapApolloResult(r,loc));

      // Dedup by email
      const existing=new Set(leads.map(l=>l.email?.toLowerCase()).filter(Boolean));
      const deduped=newR.filter(r=>!r.email||!existing.has(r.email.toLowerCase()));

      setLeads(p=>[...p,...deduped]);
      setHistory(p=>[{loc,bType,count:deduped.length,date:new Date().toISOString(),mode:"Apollo"},...p].slice(0,20));
      setTab("results");

      // Save to Supabase
      if(userId&&deduped.length){
        supabase.from("leads").insert(deduped.map(r=>({
          user_id:userId,name:r.name,title:r.title,email:r.email,phone:r.phone,
          company:r.company,building:r.building,location:r.location,tenure:r.tenure,
          contract_expiry:r.contract_expiry,source:r.source,confidence:r.confidence,
          found_at:r.found||new Date().toISOString()
        }))).then(()=>{});
      }

    }catch(e){
      if(e.name==="AbortError") setError("Timed out. Please try again.");
      else setError(e.message);
    }finally{clearTimeout(timer);setLoading(false);}
  };

  // ── Manual add ──────────────────────────────────────────────────────────────
  const submitManual=async()=>{
    if(!addForm.name.trim()){setAddError("Name is required.");return;}
    if(!addForm.company.trim()){setAddError("Company is required.");return;}
    const newLead={...addForm,id:newId(),found:new Date().toISOString()};
    setLeads(p=>[newLead,...p]);
    setAddForm(BLANK_LEAD);setShowAddForm(false);setAddError("");
    setTab("results");
    if(userId){
      await supabase.from("leads").insert({
        user_id:userId,name:addForm.name,title:addForm.title,email:addForm.email,
        phone:addForm.phone,company:addForm.company,building:addForm.building,
        location:addForm.location,tenure:addForm.tenure,contract_expiry:addForm.contract_expiry,
        source:addForm.source||"Manual",confidence:addForm.confidence||"medium",
        found_at:new Date().toISOString()
      });
    }
  };

  // ── CSV import ────────────────────────────────────────────────────────────
  const handleCSV=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const lines=ev.target.result.split("\n").filter(l=>l.trim());
      if(lines.length<2){alert("CSV must have a header row and at least one data row.");return;}
      const headers=lines[0].split(",").map(h=>h.replace(/"/g,"").trim().toLowerCase());
      const map={name:["name","full name"],title:["title","job title","role"],phone:["phone","telephone","mobile","number"],email:["email","email address"],company:["company","company name","organisation","organization"],building:["building","office","office building"],location:["location","city","area"],tenure:["tenure"],contract_expiry:["contract_expiry","contract due","renewal","expiry"],source:["source"],confidence:["confidence"]};
      const colIdx={};
      Object.entries(map).forEach(([field,aliases])=>{
        const idx=headers.findIndex(h=>aliases.some(a=>h.includes(a)));
        if(idx!==-1)colIdx[field]=idx;
      });
      const existing=new Set(leads.map(l=>l.email?.toLowerCase()).filter(Boolean));
      const imported=[];
      lines.slice(1).forEach(line=>{
        const cols=line.split(",").map(c=>c.replace(/^"|"$/g,"").trim());
        const lead={id:newId(),found:new Date().toISOString(),source:"CSV Import",confidence:"medium"};
        Object.entries(colIdx).forEach(([field,idx])=>{if(cols[idx])lead[field]=cols[idx];});
        if(!lead.name&&!lead.company)return;
        if(lead.email&&existing.has(lead.email.toLowerCase()))return;
        imported.push(lead);
        if(lead.email)existing.add(lead.email.toLowerCase());
      });
      if(!imported.length){alert("No new contacts found (duplicates removed).");return;}
      setLeads(p=>[...imported,...p]);
      alert(`Imported ${imported.length} contact${imported.length!==1?"s":""}.`);
      setTab("results");
    };
    reader.readAsText(file);
    e.target.value="";
  };

  // ── Outreach ──────────────────────────────────────────────────────────────
  const logOutreach=async(id)=>{
    const entry={...newLog,date:new Date().toISOString()};
    setOutreach(p=>({...p,[id]:[entry,...(p[id]||[])]}));
    let newStage=null;
    if(!pipeline[id]||pipeline[id]==="new")newStage="contacted";
    if(newLog.outcome==="converted")newStage="converted";
    if(newLog.outcome==="interested")newStage="interested";
    if(newStage)setPipeline(p=>({...p,[id]:newStage}));
    setOutreachForm(null);setNewLog({type:"email",note:"",outcome:"no_reply",followup:""});
    if(userId){
      await supabase.from("outreach").insert({
        user_id:userId,lead_id:id,type:newLog.type,outcome:newLog.outcome,
        note:newLog.note,followup:newLog.followup||null,logged_at:new Date().toISOString()
      });
      if(newStage){
        await supabase.from("pipeline").upsert({user_id:userId,lead_id:id,stage:newStage,updated_at:new Date().toISOString()},{onConflict:"user_id,lead_id"});
      }
    }
  };

  const lastContact=(id)=>(outreach[id]||[])[0]||null;
  const outcomeLabel=(o)=>({no_reply:"No reply",interested:"Interested",not_now:"Not now",converted:"Converted",do_not_call:"Do not call"}[o]||o);
  const outcomeColor=(o)=>({no_reply:"#3a6a6a",interested:"#22c55e",not_now:"#f59e0b",converted:"#1a7a72",do_not_call:"#ef4444"}[o]||"#3a6a6a");

  // ── Sequence helpers ───────────────────────────────────────────────────────
  const enrollLead=(leadId,seqId)=>setEnrollments(p=>({...p,[leadId]:{seqId,enrolledAt:new Date().toISOString(),step:0,done:false}}));
  const unenrollLead=(leadId)=>setEnrollments(p=>{const n={...p};delete n[leadId];return n;});
  const advanceStep=(leadId)=>setEnrollments(p=>{const e=p[leadId];if(!e)return p;const seq=DEFAULT_SEQUENCES.find(s=>s.id===e.seqId);const next=e.step+1;return{...p,[leadId]:{...e,step:next,done:next>=(seq?.steps?.length||0)}}});

  // Tasks due today or overdue
  const seqTasksDue=useMemo(()=>{
    const today=new Date();today.setHours(0,0,0,0);
    const tasks=[];
    Object.entries(enrollments).forEach(([leadId,e])=>{
      if(e.done)return;
      const seq=DEFAULT_SEQUENCES.find(s=>s.id===e.seqId);
      if(!seq)return;
      const step=seq.steps[e.step];
      if(!step)return;
      const enrolled=new Date(e.enrolledAt);enrolled.setHours(0,0,0,0);
      const dueOn=new Date(enrolled);dueOn.setDate(dueOn.getDate()+step.day);
      if(dueOn<=today){
        const lead=leads.find(l=>String(l.id)===String(leadId));
        if(lead)tasks.push({lead,seq,step,stepIdx:e.step,dueOn,enrollment:e});
      }
    });
    return tasks.sort((a,b)=>a.dueOn-b.dueOn);
  },[enrollments,leads]);

  // ── HubSpot integration ────────────────────────────────────────────────────
  const saveHubspotKey=async()=>{
    if(!hubspotKeyInput.trim()){setHubspotMsg("Please enter a valid API key.");setHubspotStatus("error");return;}
    setHubspotStatus("saving");
    const{error}=await supabase.from("profiles").update({hubspot_api_key:hubspotKeyInput.trim()}).eq("user_id",userId);
    if(error){setHubspotStatus("error");setHubspotMsg("Could not save. Please try again.");return;}
    setHubspotKey(hubspotKeyInput.trim());setHubspotStatus("saved");setHubspotMsg("HubSpot key saved.");
    setTimeout(()=>setHubspotStatus("idle"),3000);
  };

  const pushToHubspot=async(leadsToSync)=>{
    if(!hubspotKey){setHubspotMsg("Add your HubSpot API key first.");setHubspotStatus("error");return;}
    setHubspotStatus("syncing");setHubspotMsg(`Pushing ${leadsToSync.length} contacts to HubSpot…`);
    let ok=0,fail=0;
    for(const r of leadsToSync){
      if(!r.email)continue;
      try{
        const res=await fetch("https://api.hubapi.com/crm/v3/objects/contacts",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${hubspotKey}`},
          body:JSON.stringify({properties:{email:r.email,firstname:r.name?.split(" ")[0]||"",lastname:r.name?.split(" ").slice(1).join(" ")||"",jobtitle:r.title||"",company:r.company||"",phone:r.phone||"",city:r.location||"",hs_lead_status:"NEW",dunlin_space_pressure_score:String(r.spacePressureScore||""),dunlin_lease_expiry:r.contract_expiry||"",dunlin_email_status:r.emailStatus||""}})
        });
        if(res.status===409){ok++;continue;}// already exists
        if(res.ok)ok++;else fail++;
      }catch{fail++;}
    }
    setHubspotStatus(fail===0?"saved":"error");
    setHubspotMsg(`Pushed: ${ok} contacts to HubSpot${fail>0?` · ${fail} failed`:""}. Check your HubSpot Contacts list.`);
  };

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const getStage=(id)=>pipeline[id]||"new";
  const moveStage=async(id,stage)=>{
    setPipeline(p=>({...p,[id]:stage}));
    if(userId){
      await supabase.from("pipeline").upsert({user_id:userId,lead_id:id,stage,updated_at:new Date().toISOString()},{onConflict:"user_id,lead_id"});
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportXLSX=(data)=>{
    const doExport=(XLSX)=>{
      const wsData=[
        ["Name","Title","Company","Email","Email Status","Phone","Building","Location","Tenure","Contract Due","Lease Confidence","Pipeline Stage","Source","LinkedIn"],
        ...data.map(r=>{
          const ec=emailChecks[r.id];
          return[r.name,r.title,r.company,r.email,ec?ec.status:"pending",r.phone,r.building,r.location,r.tenure,r.contract_expiry,r.leaseConfidence||"",getStage(r.id),r.source,r.linkedin||""];
        })
      ];
      const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"]=[{wch:20},{wch:18},{wch:26},{wch:28},{wch:12},{wch:18},{wch:28},{wch:16},{wch:14},{wch:14},{wch:12},{wch:12},{wch:24},{wch:36}];
      XLSX.utils.book_append_sheet(wb,ws,"Dunlin Leads");
      XLSX.writeFile(wb,`dunlin-${(loc||"leads").replace(/\s+/g,"-")}-${new Date().toISOString().split("T")[0]}.xlsx`);
    };
    if(window.XLSX){doExport(window.XLSX);return;}
    const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";sc.onload=()=>doExport(window.XLSX);sc.onerror=()=>alert("Could not load spreadsheet library.");document.head.appendChild(sc);
  };

  // ── Calendar data ──────────────────────────────────────────────────────────
  const enriched=useMemo(()=>leads.map(l=>{const expiry=parseExpiry(l.contract_expiry);const days=expiry?daysBetween(now,expiry):null;return{...l,expiry,days};}).sort((a,b)=>{if(a.days===null)return 1;if(b.days===null)return -1;return a.days-b.days;}),[leads,now]);
  const expiredLeads=useMemo(()=>enriched.filter(l=>l.days!==null&&l.days<0),[enriched]);
  const calFiltered=useMemo(()=>enriched.filter(l=>{const ms=!calSearch||[l.name,l.company,l.location,l.building].some(f=>f?.toLowerCase().includes(calSearch.toLowerCase()));const mf=calFilter==="all"||(l.days!==null&&l.days<=parseInt(calFilter));const notExp=showExpired||(l.days===null||l.days>=0);return ms&&mf&&notExp;}),[enriched,calFilter,calSearch,showExpired]);
  const byMonth=useMemo(()=>{const g={};calFiltered.forEach(l=>{if(!l.expiry)return;const key=`${l.expiry.getFullYear()}-${l.expiry.getMonth()}`;if(!g[key])g[key]={year:l.expiry.getFullYear(),month:l.expiry.getMonth(),leads:[]};g[key].leads.push(l);});return Object.values(g).sort((a,b)=>a.year!==b.year?a.year-b.year:a.month-b.month);},[calFiltered]);
  const calStats=useMemo(()=>({overdue:enriched.filter(l=>l.days!==null&&l.days<0).length,d30:enriched.filter(l=>l.days!==null&&l.days>=0&&l.days<=30).length,d60:enriched.filter(l=>l.days!==null&&l.days>30&&l.days<=60).length,d90:enriched.filter(l=>l.days!==null&&l.days>60&&l.days<=90).length}),[enriched]);

  const verifiedCount=Object.values(emailChecks).filter(e=>e.status==="valid").length;

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp={width:"100%",background:"#f0ece3",border:"1px solid #c0d4d0",color:"#1a3a3a",padding:"11px 13px",fontFamily:"'DM Sans',sans-serif",fontSize:14,borderRadius:8,outline:"none",WebkitAppearance:"none"};
  const card={background:"#f0ece3",border:"1px solid #c0d4d0",borderRadius:10,padding:14};
  const notice=w=>({background:w?"#fef8ec":"#e8f4f0",border:`1px solid ${w?"#c8980a":"#90b8d8"}`,borderLeft:`3px solid ${w?"#f59e0b":"#3aada0"}`,padding:"11px 13px",borderRadius:8,color:w?"#8a6800":"#1a7a72",fontSize:12,lineHeight:1.7,marginBottom:12});

  // ── Traffic light: Apollo status is ground truth; DNS check is secondary ──
  const getEmailTier=(r)=>{
    const apollo=r.emailStatus;
    const dns=emailChecks[r.id];
    if(apollo==="verified")return{tier:"green",label:"VERIFIED",col:"#22c55e",bg:"#e8fff4"};
    if(apollo==="likely to engage")return{tier:"amber",label:"LIKELY",col:"#f59e0b",bg:"#fff8e0"};
    if(dns?.status==="valid")return{tier:"amber",label:"DNS OK",col:"#f59e0b",bg:"#fff8e0"};
    if(dns?.status==="risky")return{tier:"amber",label:"RISKY",col:"#e08a00",bg:"#1a0d00"};
    if(dns?.status==="invalid")return{tier:"red",label:"INVALID",col:"#ef4444",bg:"#fff0f0"};
    if(apollo==="unavailable"||!r.email||r.email==="unknown")return{tier:"red",label:"NO EMAIL",col:"#ef4444",bg:"#fff0f0"};
    return{tier:"pending",label:"CHECKING",col:"#3a6a6a",bg:"#e0eeec"};
  };

  const confBadge=(r)=>{const{label,col,bg}=getEmailTier(r);return<span style={{background:bg,color:col,border:`1px solid ${col}40`,padding:"2px 5px",borderRadius:3,fontSize:9,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,whiteSpace:"nowrap"}}>{label}</span>;};
  const emailDot=(id,r)=>{if(!r)return<span style={{width:7,height:7,borderRadius:4,background:"#2a3040",display:"inline-block",marginRight:5,flexShrink:0}}/>;const{col,tier}=getEmailTier(r);return<span style={{width:7,height:7,borderRadius:4,background:col,display:"inline-block",marginRight:5,flexShrink:0,boxShadow:tier==="pending"?undefined:`0 0 4px ${col}88`}}/>;};

  // ── Space Pressure Score badge ────────────────────────────────────────────
  const scoreBadge=(score)=>{if(score==null)return null;const col=score>=70?"#22c55e":score>=40?"#f59e0b":"#ef4444";const label=score>=70?"HOT":score>=40?"WARM":"COLD";return<span title={`Space Pressure Score: ${score}/100`} style={{background:col+"18",color:col,border:`1px solid ${col}30`,padding:"2px 6px",borderRadius:3,fontSize:9,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,whiteSpace:"nowrap"}}>⬆ {score} {label}</span>;};


  const navTabs=[
    {id:"search",    l:"Search",    i:"⌖",  tour:"search"},
    {id:"results",   l:"Leads",     i:"◈",  b:leads.length, tour:"leads"},
    {id:"pipeline",  l:"Pipeline",  i:"⬦",  b:leads.filter(l=>getStage(l.id)==="interested").length||undefined},
    {id:"calendar",  l:"Renewal",   i:"📅", dot:calStats.d30>0||calStats.overdue>0, tour:"renewal"},
    {id:"sequences", l:"Sequences", i:"✉",  b:seqTasksDue.length||undefined, dot:seqTasksDue.length>0, tour:"sequences"},
    {id:"outreach",  l:"Outreach",  i:"◉",  b:followupsDueToday.length||undefined},
    {id:"history",   l:"History",   i:"◎",  b:history.length||undefined},
    {id:"settings",  l:"Settings",  i:"⚙",  dot:!apolloKey&&!dbLoading, tour:"settings"},
    {id:"help",      l:"Help",      i:"?"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#d4e8e4",color:"#1a3a3a",fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:14}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#d4e8e4}::-webkit-scrollbar-thumb{background:#8ab8b0;border-radius:2px}
        input,select,textarea{outline:none;-webkit-appearance:none}input[type=time],input[type=date]{color-scheme:light}
        input::placeholder,textarea::placeholder{color:#6a9a9a}
        /* ── ANIMATIONS ── */
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(58,173,160,0);}50%{box-shadow:0 0 12px 3px rgba(58,173,160,0.18);}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pressDown{0%{transform:scale(1);}50%{transform:scale(0.96);}100%{transform:scale(1);}}
        /* Button press — all buttons */
        button:active:not(:disabled){animation:pressDown 0.15s ease-out;transform:scale(0.97);}
        /* Nav tabs */
        .nb{flex:1;background:none;border:none;cursor:pointer;padding:8px 2px;color:#1a4040;font-family:'DM Sans',sans-serif;font-weight:600;border-bottom:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:3px;transition:color .15s,background .2s,transform .1s;min-width:0;border-radius:6px 6px 0 0;}
        .nb:hover{color:#0d2424;background:rgba(58,173,160,0.08);}
        .nb:active{transform:scale(0.95);}
        .nb.act{color:#1a7a72;border-bottom-color:#1a7a72;}
        /* Primary button with glow */
        .bp{background:#3aada0;color:#fff;border:none;padding:13px;font-family:'DM Sans',sans-serif;font-size:13px;letter-spacing:.08em;font-weight:700;cursor:pointer;border-radius:8px;text-transform:uppercase;width:100%;transition:background .2s,box-shadow .2s,transform .1s;}
        .bp:hover{background:#148a80;box-shadow:0 4px 20px rgba(58,173,160,0.35);}
        .bp:active{transform:scale(0.98);}
        /* Secondary/ghost buttons */
        .bs{background:#2a7a72;color:#fff;border:none;padding:9px 16px;font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:.04em;font-weight:600;cursor:pointer;border-radius:6px;text-transform:uppercase;transition:background .2s,box-shadow .15s,transform .1s;}
        .bs:hover{background:#3aada0;box-shadow:0 2px 12px rgba(58,173,160,0.3);}
        .bs:active{transform:scale(0.97);}
        .bg{background:none;border:1px solid #b8d4cf;color:#4a8080;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.02em;font-weight:500;cursor:pointer;border-radius:6px;transition:all .15s,transform .1s;}
        .bg:hover{border-color:#3aada0;color:#3aada0;box-shadow:0 0 8px rgba(58,173,160,0.15);}
        .bg:active{transform:scale(0.97);}
        .bg:disabled{opacity:.3;cursor:not-allowed}
        .bd{background:none;border:1px solid #f0c0c0;color:#ef4444;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.02em;font-weight:500;cursor:pointer;border-radius:6px;transition:all .15s,transform .1s;}
        .bd:hover{background:#fff0f0;box-shadow:0 0 8px rgba(239,68,68,0.15);}
        .bd:active{transform:scale(0.97);}
        .bd:disabled{opacity:.3;cursor:not-allowed}
        .bx{background:#e8f8ee;border:1px solid #90c4a4;color:#22c55e;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.02em;font-weight:500;cursor:pointer;border-radius:6px;transition:all .15s,transform .1s;}
        .bx:hover{background:#0d2e1a;box-shadow:0 0 8px rgba(34,197,94,0.2);}
        .bx:active{transform:scale(0.97);}
        /* Lead cards hover backlight */
        .rcard{background:#f0ece3;border:1px solid #b8d4cf;border-radius:10px;padding:13px;margin-bottom:9px;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .15s;}
        .rcard:hover{border-color:#3aada0;box-shadow:0 4px 16px rgba(58,173,160,0.12),0 0 0 1px rgba(58,173,160,0.08);transform:translateY(-1px);}
        .rcard:active{transform:translateY(0) scale(0.99);}
        .rcard.inv{border-color:#f0c0c0;opacity:.8}
        /* Input focus glow */
        input:focus,select:focus,textarea:focus{box-shadow:0 0 0 3px rgba(58,173,160,0.15)!important;border-color:#3aada0!important;}
        /* Toggle */
        .sw{position:relative;width:40px;height:22px;background:#b8d4cf;border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0}.sw.on{background:#3aada0}.sk{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:8px;transition:left .2s}.sw.on .sk{left:21px}
        .fb{background:none;border:1px solid #b8d4cf;color:#4a8080;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:10px;cursor:pointer;border-radius:20px;transition:all .15s}.fb:hover{border-color:#3aada0;color:#3aada0}.fb.act{color:#0a1a1a;border-color:transparent}
        .pipe-col{background:#c0dcd8;border:1px solid #b8d4cf;border-radius:10px;padding:10px;min-height:200px;transition:border-color .2s}.pipe-col.dragover{border-color:#3aada0;background:#b0d4cf}
        .pipe-card{background:#f0ece3;border:1px solid #b8d4cf;border-radius:7px;padding:10px;margin-bottom:7px;cursor:grab;transition:all .15s;user-select:none}.pipe-card:active{cursor:grabbing;opacity:.7}
        .tg{display:inline-block;background:#daf0ec;border:1px solid #c0d8d4;color:#3aada0;padding:2px 7px;border-radius:4px;font-size:10px}
        .lbl{font-size:10px;letter-spacing:2px;color:#3a6060;margin-bottom:6px;text-transform:uppercase;display:block}
        .fg{margin-bottom:12px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.6s ease-in-out infinite}
        .ocard{background:#f0ece3;border:1px solid #b8d4cf;border-radius:10px;padding:13px;margin-bottom:9px}
        .seq-card{background:#f0ece3;border:1px solid #b8d4cf;border-radius:10px;padding:13px;margin-bottom:9px;cursor:pointer;transition:border-color .15s}.seq-card:hover{border-color:#3aada0}
        .seq-step{background:#e8f4f1;border:1px solid #c0d4d0;border-radius:7px;padding:10px 12px;margin-bottom:7px}
        .copy-btn{background:#f0ece3;border:1px solid #b8d4cf;color:#3aada0;padding:5px 10px;border-radius:5px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.5px;transition:all .15s}.copy-btn:hover{background:#3aada0;color:#0a1a1a}
        @media(max-width:600px){
          div[style*="padding:14px 13px"]{padding:10px 10px!important}
          div[style*="maxWidth:700px"]{max-width:100vw!important}
          .rcard{padding:10px!important}
          div[style*="gridTemplateColumns:1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important}
          div[style*="gridTemplateColumns:repeat(4,1fr)"]{grid-template-columns:1fr 1fr!important}
          div[style*="gridTemplateColumns:repeat(2,1fr)"]{grid-template-columns:1fr!important}
          div[style*="gridTemplateColumns:1fr 1fr"][style*="gap:9"]{grid-template-columns:1fr!important}
          div[style*="height:56"]{height:auto!important;padding:10px 12px!important;flex-wrap:wrap!important;gap:8px!important}
          .nb{min-width:40px!important;padding:6px 2px!important}
          .nb span:first-child{font-size:15px!important}
        }
      `}</style>

      {/* ── Guided Tour Overlay ──────────────────────────────────────────────── */}
      {tourStep!==null&&(()=>{
        const s=TOUR_STEPS[tourStep];
        const pad=8;
        const vw=window.innerWidth;
        const vh=window.innerHeight;
        // Card width: 320 on desktop, full-width minus gutter on small screens
        const tipW=Math.min(320,vw-24);
        // Be conservative with height estimate — text wraps on narrow cards
        const tipH=300;
        const margin=16;
        const hl=tourRect?{top:tourRect.top-pad,left:tourRect.left-pad,w:tourRect.w+pad*2,h:tourRect.h+pad*2}:null;

        let top,left,transform="";
        if(!hl){
          // No highlight: always centre
          top="50%";left="50%";transform="translate(-50%,-50%)";
        } else {
          // Available space above and below the highlight
          const spaceBelow=vh-(hl.top+hl.h)-margin;
          const spaceAbove=hl.top-margin;
          // Pick side with more room; fallback to vertical centre
          if(spaceBelow>=tipH){
            top=hl.top+hl.h+margin;
          } else if(spaceAbove>=tipH){
            top=hl.top-tipH-margin;
          } else {
            // Not enough room either side — anchor 60% down (below the nav bar, above the fold)
            top=Math.max(margin,Math.min(vh-tipH-margin, Math.round(vh*0.35)));
          }
          // Horizontal: centre on highlight, hard-clamp to stay fully on screen
          left=Math.round(hl.left+(hl.w/2)-(tipW/2));
          left=Math.max(margin,Math.min(vw-tipW-margin,left));
          // Clamp top too (never go off bottom)
          if(typeof top==="number") top=Math.max(margin,Math.min(vh-tipH-margin,top));
        }

        return(
          <div style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none"}}>
            {/* Dark overlay */}
            <div style={{position:"absolute",inset:0,background:"rgba(14,30,28,0.88)",pointerEvents:"all"}} onClick={()=>completeTour()}/>
            {/* Spotlight cutout — glowing border so content inside is clearly visible */}
            {hl&&<div style={{
              position:"absolute",top:hl.top,left:hl.left,width:hl.w,height:hl.h,
              borderRadius:10,
              boxShadow:"0 0 0 9999px rgba(14,30,28,0.88), 0 0 0 3px #3aada0, 0 0 20px 4px rgba(58,173,160,0.5)",
              border:"2px solid #3aada0",
              background:"transparent",
              zIndex:1,pointerEvents:"none"
            }}/>}
            {/* Tooltip card */}
            <div style={{
              position:"absolute",top,left,transform,width:tipW,
              background:"#f5f0e8",
              borderRadius:14,
              padding:"20px 22px 18px",
              boxShadow:"0 16px 48px rgba(0,0,0,0.45)",
              border:"1px solid #b8d4cf",
              zIndex:2,pointerEvents:"all"
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:10,color:"#3aada0",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>{tourStep+1} of {TOUR_STEPS.length}</div>
                <button onClick={()=>completeTour()} style={{background:"rgba(0,0,0,0.06)",border:"none",color:"#3a6a6a",fontSize:15,cursor:"pointer",lineHeight:1,padding:"3px 7px",borderRadius:6,fontWeight:700}}>✕</button>
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:"#1a3030",marginBottom:10,lineHeight:1.2}}>{s.title}</div>
              <div style={{fontSize:13,color:"#2a4a4a",lineHeight:1.7,marginBottom:16}}>{s.body}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button
                  onClick={()=>{
                    if(tourStep<TOUR_STEPS.length-1){setTourStep(tourStep+1);}
                    else{completeTour(s.goTo);}
                    if(s.goTo&&tourStep<TOUR_STEPS.length-1)setTab(s.goTo);
                  }}
                  style={{flex:1,background:"#1a4a4a",color:"#fff",border:"none",borderRadius:8,padding:"11px 14px",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:.3}}
                >{s.cta||"Next →"}</button>
                {s.skip&&<button onClick={()=>completeTour()} style={{background:"none",border:"none",color:"#4a8080",fontSize:12,cursor:"pointer",padding:"4px 8px"}}>Skip</button>}
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:14}}>
                {TOUR_STEPS.map((_,i)=><div key={i} style={{width:i===tourStep?18:6,height:6,borderRadius:3,background:i===tourStep?"#1a4a4a":i<tourStep?"#3aada0":"#c0d8d4",transition:"all .25s"}}/>)}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 13px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1a4a4a",position:"sticky",top:0,zIndex:10,height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {/* Logo — click to go home */}
          <button onClick={onBack} title="Back to home" style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:10}}>
            <svg width="36" height="24" viewBox="0 0 120 80" fill="none">
              <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
              <circle cx="88" cy="34" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
              <path d="M96 36 Q108 36 112 40" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M35 46 Q22 40 18 44" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <line x1="58" y1="60" x2="54" y2="72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="70" y1="61" x2="68" y2="72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:23,color:"#ffffff",letterSpacing:"0.06em"}}>dunlin</span>
              <span style={{fontSize:10,color:"rgba(125,212,204,0.6)",letterSpacing:"0.18em",marginLeft:10,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>Lease Intelligence</span>
            </div>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {verifying&&<span style={{fontSize:9,color:"#1a7a72",fontFamily:"'DM Sans',sans-serif"}} className="pulse">✉ DNS…</span>}
          {leads.length>0&&<span style={{fontSize:9,color:"#22c55e",fontFamily:"'DM Sans',sans-serif"}}>🟢 {leads.filter(r=>r.emailStatus==="verified").length}/{leads.filter(r=>r.email).length}</span>}
          <div style={{width:1,height:14,background:"rgba(255,255,255,0.12)"}}/>
          {apolloKey
            ? <span style={{fontSize:9,color:"#22c55e",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>⬡ APOLLO</span>
            : <span style={{fontSize:9,color:"#f59e0b",letterSpacing:1,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setTab("settings")}>⚙ ADD KEY</span>
          }
          <div style={{width:1,height:14,background:"rgba(255,255,255,0.12)"}}/>
          <span style={{fontSize:9,color:"rgba(125,212,204,0.4)",fontFamily:"'DM Sans',sans-serif"}}>DEMO</span>
          <div style={{width:1,height:14,background:"rgba(255,255,255,0.12)"}}/>
          <button title="Take the guided tour again" onClick={()=>{localStorage.removeItem(`dunlin_tour_${userId}`);setTourStep(0);}} style={{background:"rgba(58,173,160,0.18)",border:"1px solid rgba(58,173,160,0.35)",color:"#7dd4cc",borderRadius:5,padding:"3px 8px",fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,fontWeight:600}}>▶ TOUR</button>
          <button title="Help & how-to guide" onClick={()=>setTab("help")} style={{background:"rgba(58,173,160,0.18)",border:"1px solid rgba(58,173,160,0.35)",color:"#7dd4cc",borderRadius:5,width:22,height:22,fontSize:12,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>
          {/* My Account button + dropdown */}
          <div style={{position:"relative"}}>
            <button
              title="My Account"
              onClick={()=>setShowAccount(s=>!s)}
              style={{background:showAccount?"rgba(255,255,255,0.15)":"rgba(58,173,160,0.18)",border:"1px solid rgba(58,173,160,0.35)",color:"#d6f0ee",borderRadius:5,padding:"3px 8px",fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,fontWeight:700,display:"flex",alignItems:"center",gap:5}}
            >
              <span style={{width:16,height:16,borderRadius:8,background:"#3aada0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>
                {(session?.user?.email||"?")[0].toUpperCase()}
              </span>
              ACCOUNT
            </button>
            {showAccount&&(
              <div
                style={{
                  position:"absolute",top:"calc(100% + 8px)",right:0,
                  background:"#f5f0e8",
                  border:"1px solid rgba(26,74,74,0.12)",
                  borderRadius:10,
                  boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
                  padding:"14px 16px",
                  minWidth:220,
                  zIndex:99
                }}
              >
                {/* Avatar + email */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(26,74,74,0.1)"}}>
                  <div style={{width:36,height:36,borderRadius:18,background:"#1a4a4a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#d6f0ee",flexShrink:0}}>
                    {(session?.user?.email||"?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#1a3a3a",wordBreak:"break-all",lineHeight:1.3}}>{session?.user?.email}</div>
                    <div style={{fontSize:10,color:"#3aada0",marginTop:2,fontWeight:500}}>✓ Active account</div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button
                    onClick={()=>{setShowAccount(false);setTab("settings");}}
                    style={{background:"#e8f4f0",border:"1px solid #b0d4cc",color:"#1a4a4a",borderRadius:7,padding:"9px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}
                  >⚙ Account Settings</button>
                  <a
                    href="https://billing.stripe.com/p/login/6oU9AT3Rp3tjf3A7H8aAw00"
                    target="_blank"
                    rel="noreferrer"
                    onClick={()=>setShowAccount(false)}
                    style={{background:"#e8f4f0",border:"1px solid #b0d4cc",color:"#1a4a4a",borderRadius:7,padding:"9px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"none",display:"block"}}
                  >💳 Manage Subscription</a>
                  <button
                    onClick={()=>{setShowAccount(false);supabase.auth.signOut();}}
                    style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#dc2626",borderRadius:7,padding:"9px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left",marginTop:4}}
                  >→ Sign Out</button>
                </div>
              </div>
            )}
            {/* Click-outside to close */}
            {showAccount&&<div style={{position:"fixed",inset:0,zIndex:98}} onClick={()=>setShowAccount(false)}/>}
          </div>
          <div className={`sw ${demo?"on":""}`} onClick={()=>setDemo(!demo)}><div className="sk"/></div>
          <span style={{fontSize:9,color:demo?"#1a7a72":"rgba(125,212,204,0.3)",minWidth:18,fontFamily:"'DM Sans',sans-serif"}}>{demo?"ON":"OFF"}</span>
        </div>
      </div>

      {/* Follow-up banner */}
      {followupsDueToday.length>0&&(
        <div style={{background:"#e8f4f0",borderBottom:"1px solid #d0c0f0",padding:"8px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#1a7a72",letterSpacing:1,textTransform:"uppercase"}}>◉ Follow-ups due today</span>
          {followupsDueToday.map(({lead},i)=>(
            <span key={i} style={{fontSize:11,color:"#b0a0f0",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setTab("outreach");setOutreachForm(lead.id);}}>{lead.name}</span>
          ))}
        </div>
      )}

      {/* Nav */}
      <div style={{borderBottom:"1px solid #c0d4d0",display:"flex",background:"#cce0dc",position:"sticky",top:followupsDueToday.length>0?81:49,zIndex:9,overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} data-tour={n.tour||undefined} className={`nb ${tab===n.id?"act":""}`} onClick={()=>setTab(n.id)}
            style={{padding:"8px 4px",minWidth:52,
              ...(n.id==="help"&&tab!=="help"?{color:"#1a7a72"}:{})
            }}>
            <span style={{fontSize:15}}>{n.i}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,whiteSpace:"nowrap",fontWeight:600}}>{n.l}</span>
            {n.b>0&&<span style={{background:"#1a4a4a",color:"#d6f0ee",fontSize:9,padding:"1px 5px",borderRadius:10,fontWeight:700}}>{n.b}</span>}
            {n.dot&&!n.b&&<span style={{width:6,height:6,borderRadius:3,background:"#f59e0b",display:"inline-block"}} className="pulse"/>}
          </button>
        ))}
      </div>

      <div style={{padding:"14px 13px",maxWidth:700,margin:"0 auto"}}>

        {/* ══ SEARCH ══════════════════════════════════════════════════════════ */}
        {tab==="search"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
              {[["Leads",leads.length,"◈"],["Last Run",history[0]?new Date(history[0].date).toLocaleDateString():"Never","◎"],["Follow-ups",followupsDueToday.length,"◉"]].map(([l,v,i])=>(
                <div style={card} key={l}>
                  <div style={{fontSize:13,color:"#3aada0",marginBottom:3}}>{i}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#2a5555",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Mode banners */}
            {demo&&<div style={notice(true)}><strong style={{color:"#f59e0b"}}>Demo Mode ON</strong> — shows sample contacts. Toggle off for live Apollo results.</div>}
            {!demo&&!apolloKey&&(
              <div style={{background:"#120d00",border:"1px solid #c8980a",borderLeft:"3px solid #f59e0b",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:11,color:"#f59e0b",fontWeight:600,marginBottom:5,letterSpacing:1}}>⚙ Apollo API key required for live search</div>
                <div style={{fontSize:12,color:"#7a6a3a",marginBottom:10,lineHeight:1.6}}>
                  Add your Apollo Organisation plan key to find real contacts with verified emails, phone numbers, and company data.
                </div>
                <button className="bg" style={{borderColor:"#f59e0b",color:"#f59e0b"}} onClick={()=>setTab("settings")}>⚙ Add Key in Settings →</button>
              </div>
            )}
            {!demo&&apolloKey&&(
              <div style={notice(false)}><strong style={{color:"#3aada0"}}>Live Mode</strong> — searches Apollo for real UK contacts with lease expiry estimates.</div>
            )}

            <div style={{...card,marginBottom:12}}>
              <div className="fg">
                <label className="lbl">Location <span style={{color:"#3aada0"}}>*</span></label>
                <input style={{...inp,border:error&&!loc?"1px solid #ef4444":"1px solid #c0d4d0"}} placeholder="e.g. Manchester, Leeds, London EC2, Birmingham..." value={loc} onChange={e=>{setLoc(e.target.value);setError(null);}} onKeyDown={e=>e.key==="Enter"&&!loading&&run()}/>
              </div>
              <div className="fg">
                <label className="lbl">Office Type <span style={{color:"#2a5555",fontWeight:400,fontSize:9}}>(optional)</span></label>
                <select style={{...inp,cursor:"pointer"}} value={bType} onChange={e=>setBType(e.target.value)}>
                  <option value="any">Any office type</option>
                  <option value="serviced">Serviced Offices</option>
                  <option value="flexible">Flexible / Co-working</option>
                  <option value="managed">Managed Offices</option>
                </select>
              </div>
              {loading?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:28,marginBottom:8}} className="pulse">⌖</div>
                  <div style={{color:"#3aada0",fontSize:11,letterSpacing:2,marginBottom:10}}>FINDING CONTACTS</div>
                  <button className="bd" style={{width:"100%"}} onClick={()=>{abortRef.current?.abort();setLoading(false);}}>◼ Stop</button>
                </div>
              ):(
                <button className="bp" onClick={run}>▶ Find Contacts</button>
              )}
              {/* Error states */}
              {error==="no_apollo_key"?(
                <div style={{marginTop:10,background:"#120d00",border:"1px solid #c8980a",borderRadius:6,padding:12}}>
                  <div style={{fontSize:11,color:"#f59e0b",marginBottom:6,fontWeight:600}}>⚙ No Apollo key found</div>
                  <div style={{fontSize:12,color:"#7a6a3a",marginBottom:10,lineHeight:1.6}}>Add your Apollo Organisation plan key in Settings to unlock live contact search.</div>
                  <button className="bg" style={{borderColor:"#f59e0b",color:"#f59e0b"}} onClick={()=>setTab("settings")}>Go to Settings →</button>
                </div>
              ):error?(
                <div style={{marginTop:10,background:"#fff0f0",border:"1px solid #f0c0c0",borderRadius:6,padding:10,color:"#ef4444",fontSize:12,lineHeight:1.6}}>⚠ {error}</div>
              ):null}
            </div>

            {/* Manual add */}
            <div style={{...card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showAddForm?12:0}}>
                <div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13}}>Add contact manually</div>
                  {!showAddForm&&<div style={{fontSize:11,color:"#3a6a6a",marginTop:2}}>From LinkedIn, a business card, or a referral</div>}
                </div>
                <button className="bg" onClick={()=>{setShowAddForm(!showAddForm);setAddError("");}}>
                  {showAddForm?"Cancel":"+ Add"}
                </button>
              </div>
              {showAddForm&&(
                <div>
                  {[["Name *","name","text","Full name"],["Title","title","text","Job title"],["Company *","company","text","Company name"],["Email","email","email","name@company.co.uk"],["Phone","phone","text","+44..."],["Office Building","building","text","WeWork, Regus..."],["Location","location","text","City, Postcode"],["Contract Due","contract_expiry","text","e.g. March 2026 or Est. 2026"]].map(([lbl,field,type,ph])=>(
                    <div className="fg" key={field}>
                      <label className="lbl">{lbl}</label>
                      <input style={inp} type={type} placeholder={ph} value={addForm[field]||""} onChange={e=>setAddForm(p=>({...p,[field]:e.target.value}))}/>
                    </div>
                  ))}
                  {addError&&<div style={{color:"#ef4444",fontSize:12,marginBottom:10}}>⚠ {addError}</div>}
                  <button className="bs" style={{width:"100%"}} onClick={submitManual}>+ Save Contact</button>
                </div>
              )}
            </div>

            {/* CSV import */}
            <div style={{...card}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13}}>Import from CSV</div>
                  <div style={{fontSize:11,color:"#3a6a6a",marginTop:2}}>Paste in an existing spreadsheet</div>
                </div>
                <button className="bg" onClick={()=>csvRef.current?.click()}>↑ Import</button>
              </div>
              <input ref={csvRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleCSV}/>
              <div style={{fontSize:10,color:"#2a3860",marginTop:8,lineHeight:1.6}}>Accepts columns: Name, Title, Company, Email, Phone, Building, Location, Contract Due. Duplicates removed automatically.</div>
            </div>
          </div>
        )}

        {/* ══ RESULTS ═════════════════════════════════════════════════════════ */}
        {tab==="results"&&(
          <div>
            {leads.length>0&&(
              <div style={{background:"#f0ece3",border:"1px solid #c0d4d0",borderRadius:8,padding:"8px 13px",marginBottom:10,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase"}}>Email</span>
                <span style={{fontSize:11,color:"#22c55e"}}>🟢 {leads.filter(l=>l.emailStatus==="verified").length} verified</span>
                <span style={{fontSize:11,color:"#f59e0b"}}>🟡 {leads.filter(l=>l.emailStatus==="likely to engage").length} likely</span>
                <span style={{fontSize:11,color:"#ef4444"}}>🔴 {leads.filter(l=>!l.emailStatus||l.emailStatus==="unavailable").length} unverified</span>
                {leads.some(l=>l.spacePressureScore!=null)&&<span style={{fontSize:11,color:"#3aada0",marginLeft:"auto"}}>⬆ {Math.round(leads.filter(l=>l.spacePressureScore!=null).reduce((s,l)=>s+l.spacePressureScore,0)/leads.filter(l=>l.spacePressureScore!=null).length)} avg score</span>}
                {verifying&&<span style={{fontSize:10,color:"#3aada0",marginLeft:"auto"}} className="pulse">checking DNS…</span>}
              </div>
            )}
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
              {leads.length>0&&<button className="bx" onClick={()=>exportXLSX(leads)}>⬇ Spreadsheet</button>}
              <button className="bg" onClick={()=>{setTab("search");setShowAddForm(true);}}>+ Add Manual</button>
              <button className="bg" onClick={()=>csvRef.current?.click()}>↑ Import CSV</button>
              {leads.length>0&&<button className="bd" onClick={()=>{if(window.confirm("Clear all leads?"))setLeads([]);}} style={{marginLeft:"auto"}}>✕ Clear All</button>}
            </div>
            <input ref={csvRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleCSV}/>
            {leads.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#2a5555"}}>
                <div style={{fontSize:40,marginBottom:10}}>◈</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO LEADS YET</div>
                <div style={{fontSize:11,marginTop:6,color:"#1a4040"}}>Search, add manually, or import a CSV</div>
              </div>
            ):leads.map(r=>{
              const tier=getEmailTier(r);const stage=getStage(r.id);const stageInfo=PIPELINE_STAGES.find(s=>s.id===stage);const lc=lastContact(r.id);
              return(
                <div key={r.id} className={`rcard ${tier.tier==="red"&&!r.email?"inv":""}`} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name||"—"}</div>
                      <div style={{fontSize:10,color:"#3a6a6a",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[r.title,r.company].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,marginLeft:8}}>
                      {r.spacePressureScore!=null&&scoreBadge(r.spacePressureScore)}
                      <span style={{fontSize:9,color:stageInfo?.color,border:`1px solid ${stageInfo?.color}40`,padding:"2px 5px",borderRadius:3,fontFamily:"'DM Sans',sans-serif",letterSpacing:1}}>{stage.toUpperCase()}</span>
                      {confBadge(r)}
                      <span style={{color:"#2a5555",fontSize:10}}>{expanded===r.id?"▲":"▼"}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#1a7a72",marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {[r.building,r.location].filter(v=>v&&v!=="unknown").join(" — ")||"—"}</div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&(
                    <div style={{background:"#0d1f0a",border:"1px solid #1e4a1a",borderRadius:5,padding:"5px 9px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:9,color:"#4a7a40",letterSpacing:1,textTransform:"uppercase"}}>{r.contract_expiry.startsWith("Est.")?"Lease renewal est.":"Contract due"}</span>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontSize:11,color:"#22c55e",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{r.contract_expiry}</span>
                        {r.leaseConfidence&&<span style={{fontSize:9,color:"#4a7a40",marginLeft:8}}>({r.leaseConfidence} confidence)</span>}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    <div style={{fontSize:10,display:"flex",alignItems:"center",overflow:"hidden"}}>{emailDot(r.id,r)}<span style={{color:tier.col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email||"—"}</span></div>
                    <div style={{fontSize:10,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📞 {r.phone||"—"}</div>
                  </div>
                  {lc&&<div style={{marginTop:6,fontSize:10,color:outcomeColor(lc.outcome),display:"flex",alignItems:"center",gap:4}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}{lc.followup&&<span style={{color:"#1a7a72",marginLeft:6}}>↻ {lc.followup}</span>}</div>}
                  {expanded===r.id&&(
                    <div style={{marginTop:11,paddingTop:11,borderTop:"1px solid #c0d4d0"}}>
                      {/* Pipeline stage selector */}
                      <div style={{marginBottom:11}}>
                        <label className="lbl">Pipeline Stage</label>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {PIPELINE_STAGES.map(s=>(
                            <button key={s.id} onClick={e=>{e.stopPropagation();moveStage(r.id,s.id);}} style={{background:stage===s.id?s.color+"22":"transparent",border:`1px solid ${stage===s.id?s.color:"#b8d4cf"}`,color:stage===s.id?s.color:"#3a6a6a",padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,transition:"all .15s"}}>{s.label}</button>
                          ))}
                        </div>
                      </div>
                      {/* Email status detail */}
                      <div style={{background:tier.bg,border:`1px solid ${tier.col}30`,borderRadius:6,padding:"7px 11px",marginBottom:11,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{tier.tier==="green"?"🟢":tier.tier==="amber"?"🟡":"🔴"}</span>
                        <div>
                          <div style={{fontSize:10,color:tier.col,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,fontWeight:600}}>{tier.label}</div>
                          <div style={{fontSize:10,color:"#3a6a6a",marginTop:1}}>{r.emailStatus==="verified"?"SMTP-verified by Apollo — safe to send":r.emailStatus==="likely to engage"?"Apollo confidence: likely to engage — flag when sending":r.email?"No Apollo verification — proceed with caution":"No email found for this contact"}</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
                        {[["Company",r.company],["Building / Address",r.building],["Location",r.location],["Tenure",r.tenure],["Contract Due",r.contract_expiry],["Lease Confidence",r.leaseConfidence||null],["Company Size",r.companySize||null],["Industry",r.companyIndustry||null],["Funding Stage",r.funding?.stage||null],["Total Funding",r.funding?.totalPrinted||null],["Headcount (30d Δ)",r.headcountGrowth?.change30d!=null?`${r.headcountGrowth.change30d>0?"+":""}${r.headcountGrowth.change30d} employees`:null],["Source",r.source]].map(([l,v])=>v!=null?(
                          <div key={l}><div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{fontSize:11,wordBreak:"break-word",color:"#1a3a3a"}}>{v}</div></div>
                        ):null)}
                      </div>
                      {r.leaseBasis&&(
                        <div style={{fontSize:10,color:"#2a5555",marginBottom:8,padding:"7px 10px",background:"#e8f4f1",borderRadius:5,border:"1px solid #c0d4d0",lineHeight:1.5}}>
                          📊 {r.leaseBasis}
                        </div>
                      )}
                      {/* Space Pressure Score breakdown */}
                      {r.spacePressureScore!=null&&(
                        <div style={{marginBottom:8,padding:"8px 11px",background:"#e8f4f0",border:"1px solid #c0d8d4",borderRadius:6}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase"}}>Space Pressure Score</span>
                            {scoreBadge(r.spacePressureScore)}
                          </div>
                          <div style={{height:4,background:"#c0d8d4",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${r.spacePressureScore}%`,background:r.spacePressureScore>=70?"#22c55e":r.spacePressureScore>=40?"#f59e0b":"#ef4444",borderRadius:2,transition:"width .3s"}}/>
                          </div>
                          <div style={{fontSize:9,color:"#2a5555",marginTop:4,lineHeight:1.5}}>Combines lease urgency · headcount growth · funding · seniority</div>
                        </div>
                      )}
                      {/* Tech stack */}
                      {r.techStack&&r.techStack.length>0&&(
                        <div style={{marginBottom:8}}>
                          <div style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>Tech Stack</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {r.techStack.map(t=><span key={t} style={{fontSize:9,background:"#f0ece3",border:"1px solid #b8d4cf",color:"#3aada0",padding:"2px 7px",borderRadius:4,fontFamily:"'DM Sans',sans-serif"}}>{t}</span>)}
                          </div>
                        </div>
                      )}
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>✉ Email</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>📞 Call</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>💬 WhatsApp</a>}
                        {r.linkedin&&<a href={r.linkedin} target="_blank" rel="noreferrer" style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>🔗 LinkedIn</a>}
                        {!r.linkedin&&<a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((r.name||"")+" "+(r.company||""))}`} target="_blank" rel="noreferrer" style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>🔗 LinkedIn</a>}
                        <button onClick={e=>{e.stopPropagation();setOutreachForm(r.id);setTab("outreach");}} style={{background:"#e8f4f0",border:"1px solid #3aada0",color:"#1a4a4a",fontSize:11,padding:"6px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>◉ Log</button>
                      </div>
                      {/* Sequence enrolment */}
                      <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #c0d4d0"}}>
                        <div style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Email Sequence</div>
                        {enrollments[r.id]&&!enrollments[r.id].done?(()=>{
                          const e=enrollments[r.id];const seq=DEFAULT_SEQUENCES.find(s=>s.id===e.seqId);
                          return<div style={{background:"#e8f4f0",border:"1px solid #c0d8d4",borderRadius:6,padding:"8px 11px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                            <div><div style={{fontSize:11,color:"#3aada0",fontWeight:600}}>{seq?.name}</div><div style={{fontSize:10,color:"#3a6a6a",marginTop:2}}>Step {e.step+1} of {seq?.steps?.length} · <span style={{color:"#1a7a72",cursor:"pointer",textDecoration:"underline"}} onClick={ev=>{ev.stopPropagation();setSeqPreview({seqId:e.seqId,stepIdx:e.step,lead:r});setTab("sequences");}}>Preview email</span></div></div>
                            <div style={{display:"flex",gap:6}}>
                              <button className="bs" onClick={ev=>{ev.stopPropagation();advanceStep(r.id);}} style={{fontSize:10,padding:"4px 10px"}}>✓ Mark Sent</button>
                              <button className="bd" onClick={ev=>{ev.stopPropagation();unenrollLead(r.id);}} style={{fontSize:10,padding:"4px 8px"}}>✕</button>
                            </div>
                          </div>;
                        })():enrollments[r.id]?.done?(
                          <div style={{fontSize:11,color:"#22c55e",background:"#e8fff4",border:"1px solid #90c4a4",borderRadius:6,padding:"7px 11px"}}>✓ Sequence complete</div>
                        ):(
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {DEFAULT_SEQUENCES.map(s=>(
                              <button key={s.id} className="bg" onClick={ev=>{ev.stopPropagation();enrollLead(r.id,s.id);}} style={{fontSize:10,padding:"5px 10px"}}>+ {s.name}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PIPELINE ════════════════════════════════════════════════════════ */}
        {tab==="pipeline"&&(
          <div>
            <div style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Drag leads between stages</div>
            {leads.length===0&&<div style={notice(false)}>No leads yet — run a search or add contacts manually.</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {PIPELINE_STAGES.map(stage=>{
                const stageLeads=leads.filter(l=>getStage(l.id)===stage.id);
                return(
                  <div key={stage.id} className={`pipe-col ${dragOver===stage.id?"dragover":""}`}
                    onDragOver={e=>{e.preventDefault();setDragOver(stage.id);}}
                    onDrop={e=>{e.preventDefault();if(dragId!==null)moveStage(dragId,stage.id);setDragId(null);setDragOver(null);}}
                    onDragLeave={()=>setDragOver(null)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                      <div style={{fontSize:10,color:stage.color,letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>{stage.label}</div>
                      <span className="tg">{stageLeads.length}</span>
                    </div>
                    {stageLeads.map(l=>{
                      const u=urgency(enriched.find(e=>e.id===l.id)?.days??999);
                      return(
                        <div key={l.id} className="pipe-card" draggable onDragStart={()=>setDragId(l.id)} style={{borderLeft:`3px solid ${u.color}`}}>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                          <div style={{fontSize:10,color:"#3a6a6a",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div>
                          {l.contract_expiry&&l.contract_expiry!=="unknown"&&<div style={{fontSize:9,color:u.color,marginTop:4}}>📅 {l.contract_expiry}</div>}
                          {lastContact(l.id)&&<div style={{fontSize:9,color:outcomeColor(lastContact(l.id).outcome),marginTop:3}}>◉ {outcomeLabel(lastContact(l.id).outcome)}</div>}
                        </div>
                      );
                    })}
                    {stageLeads.length===0&&<div style={{fontSize:10,color:"#1a4040",textAlign:"center",padding:"16px 0",fontStyle:"italic"}}>Drop here</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ CALENDAR ════════════════════════════════════════════════════════ */}
        {tab==="calendar"&&(
          <div>
            {(calStats.overdue>0||calStats.d30>0)&&(
              <div style={{background:"#fff0f0",border:"1px solid #f0c0c0",borderLeft:"3px solid #ef4444",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#ef4444",letterSpacing:2,textTransform:"uppercase"}}>⚠ Urgent</span>
                {calStats.overdue>0&&<span style={{fontSize:11,color:"#ef4444"}}><strong>{calStats.overdue}</strong> overdue</span>}
                {calStats.d30>0&&<span style={{fontSize:11,color:"#f59e0b"}}><strong>{calStats.d30}</strong> this month</span>}
              </div>
            )}
            {leads.length===0&&<div style={notice(false)}>No leads yet — run a search and renewal dates appear here automatically.</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
              {[["Overdue",calStats.overdue,"#ef4444","30"],["Month",calStats.d30,"#ef4444","30"],["60d",calStats.d60,"#f59e0b","60"],["90d",calStats.d90,"#fbbf24","90"]].map(([l,v,c,f])=>(
                <div key={l} onClick={()=>setCalFilter(calFilter===f?"all":f)} style={{...card,cursor:"pointer",borderColor:calFilter===f?c:"#b8d4cf",transition:"border-color .2s"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:700,color:c,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#2a5555",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:7,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:5}}>
                {["timeline","list"].map(v=>(
                  <button key={v} className={`fb ${calView===v?"act":""}`} onClick={()=>setCalView(v)} style={calView===v?{background:"#3aada0"}:{}}>{v==="timeline"?"⟶ Timeline":"☰ List"}</button>
                ))}
              </div>
              <input style={{flex:1,minWidth:100,...inp,padding:"7px 11px",fontSize:12}} placeholder="Search..." value={calSearch} onChange={e=>setCalSearch(e.target.value)}/>
            </div>
            {expiredLeads.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"7px 11px",background:"#f0ece3",border:"1px solid #c0d4d0",borderRadius:7}}>
                <div className={`sw ${showExpired?"on":""}`} style={{background:showExpired?"#3a6a6a":"#b8d4cf"}} onClick={()=>setShowExpired(!showExpired)}><div className="sk"/></div>
                <span style={{fontSize:11,color:"#3a6a6a"}}>Show {expiredLeads.length} expired contract{expiredLeads.length!==1?"s":""}</span>
                {showExpired&&<span style={{fontSize:10,color:"#3a4460",marginLeft:"auto"}}>Windows already passed</span>}
              </div>
            )}
            {calView==="timeline"&&(
              byMonth.length===0
                ? <div style={{textAlign:"center",padding:"40px 0",color:"#2a5555"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div style={{fontSize:11,letterSpacing:2}}>NO UPCOMING RENEWALS</div></div>
                : byMonth.map(group=>(
                  <div key={`${group.year}-${group.month}`} style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13}}>{MONTHS_FULL[group.month]} {group.year}</div>
                      <div style={{flex:1,height:1,background:"#b8d4cf"}}/>
                      <span style={{fontSize:10,color:"#2a5555"}}>{group.leads.length}</span>
                    </div>
                    {group.leads.map(l=>{
                      const u=urgency(l.days??999);const lc=lastContact(l.id);
                      return(
                        <div key={l.id} onClick={()=>setCalSel(calSel===l.id?null:l.id)} style={{background:calSel===l.id?"#0d2222":u.bg,border:`1px solid ${calSel===l.id?u.color:u.border}`,borderLeft:`3px solid ${u.color}`,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                            <div style={{minWidth:0,flex:1}}>
                              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                              <div style={{fontSize:10,color:"#3a6a6a",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title} · {l.company}</div>
                            </div>
                            <div style={{flexShrink:0,marginLeft:10,textAlign:"right"}}>
                              <div style={{fontSize:11,color:u.color,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{l.days===null?"—":l.days<0?`${Math.abs(l.days)}d ago`:l.days===0?"Today":`${l.days}d`}</div>
                              <div style={{fontSize:9,color:u.color,opacity:.7}}>{u.label}</div>
                            </div>
                          </div>
                          <div style={{fontSize:10,color:"#1a7a72",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {l.building} — {l.location}</div>
                          {lc&&<div style={{marginTop:4,fontSize:9,color:outcomeColor(lc.outcome)}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}</div>}
                          {calSel===l.id&&(
                            <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid #c0d4d0",display:"flex",gap:7,flexWrap:"wrap"}}>
                              {l.email&&l.email!=="unknown"&&<a href={`mailto:${l.email}`} onClick={e=>e.stopPropagation()} style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"5px 11px",borderRadius:5}}>✉ Email</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`tel:${l.phone}`} onClick={e=>e.stopPropagation()} style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"5px 11px",borderRadius:5}}>📞 Call</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`https://wa.me/${l.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#d6f0ee",fontSize:11,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"5px 11px",borderRadius:5}}>💬 WA</a>}
                              <button onClick={e=>{e.stopPropagation();setOutreachForm(l.id);setTab("outreach");}} style={{background:"#e8f4f0",border:"1px solid #3aada0",color:"#1a4a4a",fontSize:11,padding:"5px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>◉ Log</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
            )}
            {calView==="list"&&(
              <div style={{background:"#f0ece3",border:"1px solid #c0d4d0",borderRadius:10,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"7px 12px",borderBottom:"1px solid #c0d4d0",background:"#c0dcd8",gap:8}}>
                  {["Contact","Company","Due"].map(h=><div key={h} style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase"}}>{h}</div>)}
                </div>
                {calFiltered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#2a5555",fontSize:11,letterSpacing:2}}>NO RENEWALS MATCH</div>}
                {calFiltered.map(l=>{const u=urgency(l.days??999);return(
                  <div key={l.id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"10px 12px",borderBottom:"1px solid #c0d4d0",gap:8,cursor:"pointer",background:calSel===l.id?"#0d2222":"transparent"}} onClick={()=>setCalSel(calSel===l.id?null:l.id)}>
                    <div style={{minWidth:0}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:10,color:"#3a6a6a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div></div>
                    <div style={{minWidth:0}}><div style={{fontSize:11,color:"#b0d8d4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div><div style={{fontSize:10,color:"#3a6a6a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.building}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:u.color,fontWeight:600}}>{l.contract_expiry?.split(" ").slice(-1)[0]}</div><div style={{fontSize:9,color:u.color,opacity:.7}}>{l.days!==null?(l.days<0?`${Math.abs(l.days)}d ago`:`${l.days}d`):"—"}</div></div>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* ══ OUTREACH ════════════════════════════════════════════════════════ */}
        {tab==="outreach"&&(
          <div>
            {followupsDueToday.length>0&&(
              <div style={{background:"#e8f4f0",border:"1px solid #d0c0f0",borderLeft:"3px solid #818cf8",borderRadius:8,padding:"10px 13px",marginBottom:12}}>
                <div style={{fontSize:9,color:"#1a7a72",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>◉ {followupsDueToday.length} follow-up{followupsDueToday.length!==1?"s":""} due today</div>
                {followupsDueToday.map(({lead},i)=>(
                  <div key={i} style={{fontSize:12,color:"#b0a0f0",marginBottom:3,cursor:"pointer"}} onClick={()=>setOutreachForm(lead.id)}>→ {lead.name} · {lead.company}</div>
                ))}
              </div>
            )}
            {outreachForm&&(()=>{
              const lead=leads.find(r=>r.id===outreachForm);if(!lead)return null;
              return(
                <div style={{...card,marginBottom:12,border:"1px solid #d0c0f0"}}>
                  <div style={{fontSize:9,letterSpacing:2,color:"#1a7a72",textTransform:"uppercase",marginBottom:8}}>Logging contact</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,marginBottom:1}}>{lead.name}</div>
                  <div style={{fontSize:11,color:"#3a6a6a",marginBottom:12}}>{lead.company}</div>
                  <div className="fg"><label className="lbl">Type</label>
                    <select style={{...inp,cursor:"pointer"}} value={newLog.type} onChange={e=>setNewLog(p=>({...p,type:e.target.value}))}>
                      <option value="email">Email</option><option value="call">Phone call</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option><option value="meeting">Meeting</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="fg"><label className="lbl">Outcome</label>
                    <select style={{...inp,cursor:"pointer"}} value={newLog.outcome} onChange={e=>setNewLog(p=>({...p,outcome:e.target.value}))}>
                      <option value="no_reply">No reply</option><option value="interested">Interested</option><option value="not_now">Not now</option><option value="converted">Converted</option><option value="do_not_call">Do not call</option>
                    </select>
                  </div>
                  <div className="fg"><label className="lbl">Follow-up date <span style={{color:"#2a5555",fontWeight:400,fontSize:9}}>(optional)</span></label>
                    <input type="date" style={inp} value={newLog.followup} onChange={e=>setNewLog(p=>({...p,followup:e.target.value}))}/>
                  </div>
                  <div className="fg"><label className="lbl">Notes</label>
                    <textarea style={{...inp,height:65,resize:"none",lineHeight:1.5,fontSize:12}} placeholder="What happened?" value={newLog.note} onChange={e=>setNewLog(p=>({...p,note:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="bs" style={{flex:1}} onClick={()=>logOutreach(outreachForm)}>◉ Save</button>
                    <button className="bg" onClick={()=>setOutreachForm(null)}>Cancel</button>
                  </div>
                </div>
              );
            })()}
            <input style={{...inp,marginBottom:10}} placeholder="Search contacts..." value={outreachSearch} onChange={e=>setOutreachSearch(e.target.value)}/>
            {leads.length===0&&<div style={notice(false)}>No leads yet — run a search first.</div>}
            {leads.filter(r=>!outreachSearch||[r.name,r.company,r.location].some(f=>f?.toLowerCase().includes(outreachSearch.toLowerCase()))).map(r=>{
              const logs=outreach[r.id]||[];const lc=logs[0];const u=urgency(enriched.find(e=>e.id===r.id)?.days??999);
              return(
                <div key={r.id} className="ocard">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontSize:10,color:"#3a6a6a",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title} · {r.company}</div>
                    </div>
                    <button onClick={()=>setOutreachForm(r.id)} style={{background:"#e8f4f0",border:"1px solid #d0c0f0",color:"#1a7a72",fontSize:10,padding:"4px 9px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0,marginLeft:8}}>+ Log</button>
                  </div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&<div style={{fontSize:10,color:u.color,marginBottom:6}}>📅 {r.contract_expiry}</div>}
                  <div style={{display:"flex",gap:6,marginBottom:logs.length?9:0,flexWrap:"wrap"}}>
                    {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#d6f0ee",fontSize:10,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"4px 10px",borderRadius:5}}>✉</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#d6f0ee",fontSize:10,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"4px 10px",borderRadius:5}}>📞</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#d6f0ee",fontSize:10,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"4px 10px",borderRadius:5}}>💬</a>}
                    <a href={r.linkedin||`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((r.name||"")+" "+(r.company||""))}`} target="_blank" rel="noreferrer" style={{color:"#d6f0ee",fontSize:10,textDecoration:"none",background:"#1a4a4a",border:"1px solid #2a6a6a",padding:"4px 10px",borderRadius:5}}>🔗</a>
                    {lc&&<span style={{fontSize:10,color:outcomeColor(lc.outcome),padding:"4px 0",marginLeft:2}}>◉ {outcomeLabel(lc.outcome)}</span>}
                  </div>
                  {logs.length>0&&(
                    <div style={{borderTop:"1px solid #c0d4d0",paddingTop:7}}>
                      <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:5}}>History ({logs.length})</div>
                      {logs.slice(0,3).map((log,i)=>(
                        <div key={i} style={{display:"flex",gap:7,marginBottom:4,padding:"6px 8px",background:"#e8f4f0",borderRadius:5,border:"1px solid #c0d4d0"}}>
                          <span style={{fontSize:10,color:outcomeColor(log.outcome),flexShrink:0}}>◉</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:log.note?2:0}}>
                              <span style={{fontSize:10,color:outcomeColor(log.outcome),fontWeight:500}}>{outcomeLabel(log.outcome)}</span>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                {log.followup&&<span style={{fontSize:9,color:"#1a7a72"}}>↻ {log.followup}</span>}
                                <span style={{fontSize:9,color:"#2a5555"}}>{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{fontSize:9,color:"#3a6a6a"}}>{log.type}{log.note&&` · ${log.note}`}</div>
                          </div>
                        </div>
                      ))}
                      {logs.length>3&&<div style={{fontSize:10,color:"#2a5555",textAlign:"center",paddingTop:2}}>+{logs.length-3} more</div>}
                    </div>
                  )}
                  {logs.length===0&&<div style={{fontSize:11,color:"#1a4040",fontStyle:"italic"}}>Not yet contacted</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ HISTORY ══════════════════════════════════════════════════════════ */}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase"}}>{history.length} runs</span>
              <button className="bd" onClick={()=>setHistory([])} disabled={!history.length}>✕ Clear</button>
            </div>
            {history.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#2a5555"}}>
                <div style={{fontSize:40,marginBottom:10}}>◎</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO HISTORY YET</div>
              </div>
            ):history.map((h,i)=>(
              <div key={i} style={{...card,marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500}}>{h.loc||"UK"} · {h.bType==="any"?"All types":h.bType}</div>
                  <span className="tg">{h.count} leads</span>
                </div>
                <div style={{display:"flex",gap:12,fontSize:10,color:"#3a6a6a"}}>
                  <span>📅 {new Date(h.date).toLocaleDateString()}</span>
                  <span style={{color:h.mode==="Apollo"?"#22c55e":h.mode==="Demo"?"#1a7a72":"#3aada0"}}>{h.mode}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SEQUENCES ═══════════════════════════════════════════════════════ */}
        {tab==="sequences"&&(
          <div>
            {/* Sub-nav */}
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[["tasks","Today's Tasks"],["enrolled","Enrolled Leads"],["library","Template Library"]].map(([v,l])=>(
                <button key={v} className={`fb ${seqView===v?"act":""}`} onClick={()=>{setSeqView(v);setSeqPreview(null);}} style={seqView===v?{background:"#3aada0",color:"#0a1a1a",borderColor:"#3aada0"}:{}}>{l}{v==="tasks"&&seqTasksDue.length>0&&<span style={{marginLeft:6,background:"#ef4444",color:"#fff",borderRadius:10,fontSize:9,padding:"1px 5px"}}>{seqTasksDue.length}</span>}</button>
              ))}
            </div>

            {/* ── TODAY'S TASKS ── */}
            {seqView==="tasks"&&(seqTasksDue.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#2a5555"}}>
                <div style={{fontSize:36,marginBottom:10}}>✉</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO EMAILS DUE TODAY</div>
                <div style={{fontSize:11,marginTop:6,color:"#1a4040"}}>Enroll leads in a sequence from their contact card</div>
              </div>
            ):seqTasksDue.map(({lead,seq,step,stepIdx,enrollment},i)=>{
              const isOpen=seqPreview?.lead?.id===lead.id&&seqPreview?.stepIdx===stepIdx;
              const personalised={subject:applyTokens(step.subject,lead),body:applyTokens(step.body,lead)};
              return(
                <div key={i} className="seq-card" onClick={()=>setSeqPreview(isOpen?null:{seqId:seq.id,stepIdx,lead})}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13}}>{lead.name}</div>
                      <div style={{fontSize:10,color:"#3a6a6a",marginTop:2}}>{[lead.title,lead.company].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <span style={{fontSize:9,color:"#1a7a72",border:"1px solid #b8d4cf",borderRadius:3,padding:"2px 6px",fontFamily:"'DM Sans',sans-serif"}}>STEP {stepIdx+1}/{seq.steps.length}</span>
                      <span style={{fontSize:9,color:"#3aada0",border:"1px solid #3aada040",borderRadius:3,padding:"2px 6px",fontFamily:"'DM Sans',sans-serif"}}>{seq.name.split(" ").slice(0,2).join(" ")}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#1a3a3a",marginBottom:isOpen?10:0,fontStyle:"italic"}}>"{personalised.subject}"</div>
                  {isOpen&&(
                    <div onClick={e=>e.stopPropagation()}>
                      <div style={{background:"#e8f4f1",border:"1px solid #c0d4d0",borderRadius:7,padding:"12px 14px",marginBottom:10}}>
                        <div style={{fontSize:10,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Subject</div>
                        <div style={{fontSize:12,color:"#1a3a3a",marginBottom:12,fontWeight:600}}>{personalised.subject}</div>
                        <div style={{fontSize:10,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Body</div>
                        <pre style={{fontSize:12,color:"#94a3b8",whiteSpace:"pre-wrap",lineHeight:1.8,fontFamily:"'DM Sans',sans-serif",margin:0}}>{personalised.body}</pre>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {lead.email&&<a href={`mailto:${lead.email}?subject=${encodeURIComponent(personalised.subject)}&body=${encodeURIComponent(personalised.body+"\n\n— [Your name]\n[Your company]\n[Phone]")}`} style={{background:"#3aada0",color:"#0a1a1a",fontSize:11,textDecoration:"none",padding:"8px 14px",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontWeight:700,letterSpacing:1}} onClick={()=>advanceStep(lead.id)}>✉ OPEN IN EMAIL CLIENT</a>}
                        <button className="copy-btn" style={{padding:"8px 14px"}} onClick={()=>{navigator.clipboard.writeText(`Subject: ${personalised.subject}\n\n${personalised.body}`);advanceStep(lead.id);}}>⧉ COPY &amp; MARK SENT</button>
                        <button className="bd" style={{fontSize:10,padding:"8px 12px"}} onClick={()=>unenrollLead(lead.id)}>✕ Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }))}

            {/* ── ENROLLED LEADS ── */}
            {seqView==="enrolled"&&(
              <div>
                {Object.keys(enrollments).length===0?(
                  <div style={{textAlign:"center",padding:"50px 20px",color:"#2a5555"}}>
                    <div style={{fontSize:36,marginBottom:10}}>◈</div>
                    <div style={{fontSize:11,letterSpacing:2}}>NO ENROLLED LEADS</div>
                    <div style={{fontSize:11,marginTop:6,color:"#1a4040"}}>Go to a lead card and click "+ Add to Sequence"</div>
                  </div>
                ):Object.entries(enrollments).map(([leadId,e])=>{
                  const lead=leads.find(l=>String(l.id)===String(leadId));
                  const seq=DEFAULT_SEQUENCES.find(s=>s.id===e.seqId);
                  if(!lead||!seq)return null;
                  const pct=Math.round((e.step/seq.steps.length)*100);
                  return(
                    <div key={leadId} className="ocard">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13}}>{lead.name}</div>
                          <div style={{fontSize:10,color:"#3a6a6a",marginTop:2}}>{[lead.title,lead.company].filter(Boolean).join(" · ")}</div>
                          <div style={{fontSize:10,color:"#1a7a72",marginTop:4}}>{seq.name} · Step {Math.min(e.step+1,seq.steps.length)} of {seq.steps.length}{e.done&&" ✓ Complete"}</div>
                        </div>
                        <button className="bd" onClick={()=>unenrollLead(leadId)} style={{fontSize:10,padding:"4px 9px"}}>✕</button>
                      </div>
                      <div style={{marginTop:8,height:4,background:"#c0d8d4",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${e.done?100:pct}%`,background:e.done?"#22c55e":"#3aada0",borderRadius:2,transition:"width .3s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TEMPLATE LIBRARY ── */}
            {seqView==="library"&&(
              <div>
                <div style={notice(false)}>Templates are personalised automatically using each lead's name, company, location, and industry. Click a step to preview the copy.</div>
                {DEFAULT_SEQUENCES.map(seq=>(
                  <div key={seq.id} style={{...card,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#1a3a3a"}}>{seq.name}</div>
                        <div style={{fontSize:11,color:"#3a6a6a",marginTop:3}}>{seq.description}</div>
                      </div>
                      <span style={{fontSize:9,color:"#3aada0",border:"1px solid #3aada040",borderRadius:3,padding:"3px 8px",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{seq.steps.length} STEPS</span>
                    </div>
                    {seq.steps.map((step,i)=>(
                      <div key={i} className="seq-step">
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontSize:9,color:"#3aada0",fontFamily:"'DM Sans',sans-serif",border:"1px solid #b8d4cf",padding:"1px 6px",borderRadius:3,whiteSpace:"nowrap"}}>Day {step.day}</span>
                          <span style={{fontSize:11,color:"#1a3a3a",fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step.subject}</span>
                        </div>
                        <div style={{fontSize:11,color:"#3a6a6a",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{step.body.split("\n").slice(0,2).join(" ").trim()}…</div>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{...notice(true),marginTop:8}}>Custom sequence templates are coming soon. You'll be able to build your own step-by-step cadences tailored to your pitch.</div>
              </div>
            )}
          </div>
        )}

        {/* ══ SETTINGS ════════════════════════════════════════════════════════ */}
        {tab==="settings"&&(
          <div>
            <div style={{fontSize:9,color:"#2a5555",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Account Settings</div>

            {/* Apollo API Key */}
            <div style={{...card,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13}}>Apollo.io API Key</div>
                {apolloKey&&(
                  <span style={{background:apolloKeyStatus==="valid"?"#0d2e1a":"#0f2424",color:apolloKeyStatus==="valid"?"#22c55e":"#3aada0",border:`1px solid ${apolloKeyStatus==="valid"?"#22c55e40":"#38bdf840"}`,padding:"2px 8px",borderRadius:20,fontSize:9,letterSpacing:1}}>
                    {apolloKeyStatus==="valid"?"✓ VERIFIED":"CONNECTED"}
                  </span>
                )}
              </div>
              <div style={{fontSize:12,color:"#3a6a6a",marginBottom:10,lineHeight:1.7}}>
                Required for live contact search. You need an Apollo{" "}
                <span style={{color:"#3aada0"}}>Organisation plan</span> (~$99/mo) for API access.{" "}
                <a href="https://app.apollo.io/#/settings/integrations/api" target="_blank" rel="noreferrer" style={{color:"#3aada0",textDecoration:"none"}}>Get your key →</a>
              </div>
              <div style={{background:"#d6f0ee",borderRadius:7,padding:"9px 12px",marginBottom:12,fontSize:11,color:"#1a4a4a",lineHeight:1.6,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <span>🤔 Not sure how to get an API key? We've written a plain-English step-by-step guide.</span>
                <button onClick={()=>setTab("help")} style={{background:"#1a4a4a",border:"none",color:"#d6f0ee",fontSize:11,padding:"6px 12px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap"}}>View guide →</button>
              </div>
              <div style={{background:"#e8f4f1",border:"1px solid #c0d4d0",borderRadius:7,padding:"10px 12px",marginBottom:14,fontSize:12,color:"#2a5555",lineHeight:1.6}}>
                Your key is stored securely in your account and never shared. It is only used to run contact searches on your behalf.
              </div>
              {/* Key input row */}
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,display:"flex",border:"1px solid #c0d4d0",borderRadius:8,overflow:"hidden",background:"#e8f4f1"}}>
                  <input
                    type={showApolloKey?"text":"password"}
                    value={apolloKeyInput}
                    onChange={e=>{setApolloKeyInput(e.target.value);setApolloKeyStatus("idle");setApolloKeyMessage("");}}
                    placeholder="Paste your Apollo API key here"
                    style={{...inp,flex:1,border:"none",borderRadius:0,fontFamily:"'DM Sans',sans-serif",background:"transparent"}}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button onClick={()=>setShowApolloKey(s=>!s)} style={{background:"none",border:"none",borderLeft:"1px solid #c0d4d0",padding:"0 13px",color:"#3a6a6a",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                    {showApolloKey?"Hide":"Show"}
                  </button>
                </div>
                <button
                  className="bp"
                  style={{width:"auto",padding:"11px 18px",fontSize:11,letterSpacing:1,opacity:(!apolloKeyInput.trim()||apolloKeyStatus==="saving")?0.5:1}}
                  disabled={!apolloKeyInput.trim()||apolloKeyStatus==="saving"}
                  onClick={saveApolloKey}
                >
                  {apolloKeyStatus==="saving"?"Saving…":apolloKeyStatus==="saved"?"✓ Saved":"Save Key"}
                </button>
              </div>
              {/* Test + Remove row */}
              {apolloKey&&(
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <button className="bg" onClick={testApolloKey} disabled={apolloKeyStatus==="testing"} style={{flex:1}}>
                    {apolloKeyStatus==="testing"?"Testing…":"Test Connection"}
                  </button>
                  <button className="bd" onClick={removeApolloKey}>Remove Key</button>
                </div>
              )}
              {/* Status message */}
              {apolloKeyMessage&&(
                <div style={{fontSize:12,lineHeight:1.5,color:apolloKeyStatus==="valid"||apolloKeyStatus==="saved"?"#22c55e":apolloKeyStatus==="invalid"||apolloKeyStatus==="error"?"#ef4444":"#1a7a72",marginTop:4}}>
                  {apolloKeyMessage}
                </div>
              )}
              {/* No-key prompt */}
              {!apolloKey&&(
                <div style={{marginTop:12,padding:"10px 13px",background:"#e8f4f1",borderRadius:8,border:"1px dashed #c0d4d0"}}>
                  <div style={{fontSize:11,color:"#3a4070",lineHeight:1.5}}>Without an Apollo key, searches will load sample demo data only. Real contact data with emails, phone numbers, and lease estimates requires a live key.</div>
                </div>
              )}
            </div>

            {/* HubSpot */}
            <div style={{...card,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13}}>HubSpot CRM</div>
                {hubspotKey&&<span style={{background:"#0d2e1a",color:"#22c55e",border:"1px solid #22c55e40",padding:"2px 8px",borderRadius:20,fontSize:9,letterSpacing:1}}>CONNECTED</span>}
              </div>
              <div style={{fontSize:12,color:"#3a6a6a",marginBottom:12,lineHeight:1.7}}>
                Push leads directly into your HubSpot Contacts with email status, lease expiry, and Space Pressure Score mapped as custom properties.{" "}
                <a href="https://app.hubspot.com/developer-api-key" target="_blank" rel="noreferrer" style={{color:"#3aada0",textDecoration:"none"}}>Get your Private App token →</a>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input
                  type="password"
                  value={hubspotKeyInput}
                  onChange={e=>{setHubspotKeyInput(e.target.value);setHubspotStatus("idle");setHubspotMsg("");}}
                  placeholder="Paste your HubSpot Private App token"
                  style={{...inp,flex:1,fontFamily:"'DM Sans',sans-serif"}}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="bp" style={{width:"auto",padding:"11px 16px",fontSize:11,opacity:!hubspotKeyInput.trim()||hubspotStatus==="saving"?0.5:1}} disabled={!hubspotKeyInput.trim()||hubspotStatus==="saving"} onClick={saveHubspotKey}>
                  {hubspotStatus==="saving"?"Saving…":hubspotStatus==="saved"?"✓ Saved":"Save"}
                </button>
              </div>
              {hubspotKey&&leads.length>0&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="bx" onClick={()=>pushToHubspot(leads)} disabled={hubspotStatus==="syncing"}>
                    {hubspotStatus==="syncing"?hubspotMsg:`⬆ Push All ${leads.length} Leads to HubSpot`}
                  </button>
                  <button className="bg" onClick={()=>pushToHubspot(leads.filter(l=>l.emailStatus==="verified"))} disabled={hubspotStatus==="syncing"}>
                    🟢 Verified Only ({leads.filter(l=>l.emailStatus==="verified").length})
                  </button>
                </div>
              )}
              {hubspotMsg&&hubspotStatus!=="syncing"&&(
                <div style={{fontSize:12,marginTop:8,color:hubspotStatus==="saved"?"#22c55e":"#ef4444",lineHeight:1.5}}>{hubspotMsg}</div>
              )}
            </div>

            {/* Account info */}
            <div style={{...card,marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:10}}>Account</div>
              <div style={{fontSize:12,color:"#1a7a72",marginBottom:14,wordBreak:"break-all"}}>{session?.user?.email}</div>
              <div style={{fontSize:11,color:"#3a4070",marginBottom:14,lineHeight:1.5}}>
                Leads, pipeline, and outreach history are synced to your account and available on any device.
              </div>
              <button className="bd" onClick={()=>supabase.auth.signOut()}>Sign Out</button>
            </div>

            {/* Data management */}
            <div style={{...card}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:10}}>Data</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {leads.length>0&&<button className="bx" onClick={()=>exportXLSX(leads)}>⬇ Export All Leads</button>}
                <button className="bg" onClick={()=>csvRef.current?.click()}>↑ Import CSV</button>
                {leads.length>0&&<button className="bd" onClick={()=>{if(window.confirm(`Clear all ${leads.length} leads? This cannot be undone.`))setLeads([]);}}>✕ Clear All Leads</button>}
              </div>
              <input ref={csvRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleCSV}/>
            </div>

            {/* Restart tour */}
            <div style={{...card,marginTop:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:10}}>Guided Tour</div>
              <div style={{fontSize:12,color:"#3a6a6a",marginBottom:10,lineHeight:1.5}}>New to Dunlin? Replay the guided tour to explore all the features.</div>
              <button className="bg" onClick={()=>{localStorage.removeItem(`dunlin_tour_${userId}`);setTourStep(0);}}>▶ Replay Tour</button>
            </div>
          </div>
        )}

        {/* ══ HELP ════════════════════════════════════════════════════════════ */}
        {tab==="help"&&(
          <div>
            {/* Hero */}
            <div style={{background:"#1a4a4a",borderRadius:12,padding:"28px 24px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#fff",letterSpacing:"0.04em",marginBottom:8}}>Dunlin Renewal Radar</div>
              <div style={{fontSize:14,color:"rgba(125,212,204,0.8)",lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>The only prospecting tool that combines UK lease intelligence, contact verification, and Space Pressure Scoring — purpose-built for flex space operators.</div>
            </div>

            {/* What makes Dunlin different */}
            <div style={{...card,marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:14}}>What Makes Dunlin Different</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {i:"⬆",t:"Space Pressure Score™",d:"0–100 urgency score combining lease timing, headcount growth, funding signals, and seniority. Know who needs space before they're even looking."},
                  {i:"📅",t:"Renewal Radar Calendar",d:"See exactly which companies' leases expire in 30, 60 or 90 days. Your daily hit list — sorted by urgency. Nobody else shows you this."},
                  {i:"🎯",t:"Traffic Light Emails",d:"Dual-layer verification: Apollo confirms deliverability, DNS confirms the mail server exists. Green means send. No more bounces."},
                  {i:"🇬🇧",t:"UK-Native Intelligence",d:"Companies House data cross-referenced with Apollo contacts. Lease expiry estimation built specifically for UK companies — not a US tool with UK data bolted on."},
                ].map(x=>(
                  <div key={x.t} style={{background:"#d4e8e4",borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontSize:20,marginBottom:6}}>{x.i}</div>
                    <div style={{fontWeight:600,fontSize:12,color:"#1a3a3a",marginBottom:4}}>{x.t}</div>
                    <div style={{fontSize:11,color:"#3a6a6a",lineHeight:1.55}}>{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apollo API Key Setup Guide */}
            <div style={{...card,marginBottom:12,border:"2px solid #3aada0"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#3aada0",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>Getting Your Apollo API Key</div>
              <div style={{fontSize:12,color:"#3a6a6a",marginBottom:14,lineHeight:1.6}}>Apollo is the contact database that powers Dunlin's live search. You'll need an account with their <strong style={{color:"#1a4a4a"}}>Organisation plan</strong> to use Dunlin in live mode. Here's exactly how to get your key:</div>
              {[
                {n:1,t:"Go to Apollo.io",d:"Visit apollo.io and click 'Sign up free'. Create your account using your work email."},
                {n:2,t:"Upgrade to Organisation plan",d:"Once logged in, go to Settings → Billing. You need the Organisation plan (minimum 3 seats, ~£280/mo). The free plan won't work — it doesn't include API access."},
                {n:3,t:"Find your API key",d:"In your Apollo account, go to Settings → Integrations → API. You'll see a section called 'API Keys'. Click 'Create new API key' and give it a name like 'Dunlin'."},
                {n:4,t:"Copy the key",d:"Copy the long string of letters and numbers that appears. It usually starts with something like 'eyJ...' or a similar format. Keep it safe — treat it like a password."},
                {n:5,t:"Paste it into Dunlin",d:"Go to the Settings tab in Dunlin (the ⚙ icon in the nav), paste your key into the Apollo API Key field, and click Save. The amber warning at the top will turn green once it's working."},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:12,marginBottom:10,paddingBottom:10,borderBottom:"1px solid #d4e8e4"}}>
                  <div style={{width:24,height:24,borderRadius:12,background:"#1a4a4a",color:"#d6f0ee",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.n}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:"#1a3a3a",marginBottom:2}}>{s.t}</div>
                    <div style={{fontSize:11,color:"#3a6a6a",lineHeight:1.55}}>{s.d}</div>
                  </div>
                </div>
              ))}
              <div style={{background:"#d6f0ee",borderRadius:8,padding:"10px 14px",marginTop:4,fontSize:11,color:"#1a4a4a",lineHeight:1.6}}>
                <strong>No Apollo account yet?</strong> You can still explore all of Dunlin's features in <strong>demo mode</strong> — it uses a set of realistic sample contacts so you can see exactly how everything works before committing to Apollo.
              </div>
              <div style={{marginTop:12,display:"flex",gap:8}}>
                <a href="https://apollo.io" target="_blank" rel="noreferrer" style={{background:"#1a4a4a",color:"#d6f0ee",fontSize:11,textDecoration:"none",padding:"8px 14px",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Go to Apollo.io →</a>
                <button onClick={()=>setTab("settings")} style={{background:"#e8f4f0",border:"1px solid #3aada0",color:"#1a4a4a",fontSize:11,padding:"8px 14px",borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>⚙ Open Settings</button>
              </div>
            </div>

            {/* Step-by-step guide */}
            <div style={{...card,marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:14}}>How To Use Dunlin — Step by Step</div>
              {[
                {n:1,t:"Add your Apollo API key",d:"Go to Settings → Apollo API Key. Paste your Apollo Organisation plan key. Without this you're in demo mode — all features work but with sample data only."},
                {n:2,t:"Search by location",d:"Go to Search, enter a UK city or postcode, and hit Find Contacts. Dunlin returns up to 25 Office Managers, Facilities Directors, and Operations leads in that area."},
                {n:3,t:"Review Space Pressure Scores",d:"Each contact has a HOT / WARM / COLD badge with a 0–100 score. Start with HOT contacts — they have the most signals pointing to an imminent space need."},
                {n:4,t:"Check email confidence",d:"Green (VERIFIED) = safe to send. Amber (LIKELY / DNS OK) = warm approach recommended. Red (NO EMAIL) = skip or find via LinkedIn."},
                {n:5,t:"Open Renewal Radar",d:"Go to the Renewal tab to see your leads plotted on a 30/60/90-day calendar by estimated lease expiry. Filter by urgency to build your weekly call list."},
                {n:6,t:"Enrol in an outreach sequence",d:"Click into a lead and enrol them in the Lease Renewal Outreach or Flex Operator Warm Pitch sequence. Dunlin personalises each email and queues your daily tasks."},
                {n:7,t:"Track in Pipeline",d:"Move contacts through New → Contacted → Interested → Converted. Drag and drop. Sync to HubSpot whenever you're ready."},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:12,marginBottom:12,paddingBottom:12,borderBottom:"1px solid #d4e8e4"}}>
                  <div style={{width:26,height:26,borderRadius:13,background:"#3aada0",color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.n}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:"#1a3a3a",marginBottom:3}}>{s.t}</div>
                    <div style={{fontSize:12,color:"#3a6a6a",lineHeight:1.55}}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{...card,marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#2a5555",textTransform:"uppercase",marginBottom:14}}>Frequently Asked Questions</div>
              {FAQ.map((f,i)=>(
                <div key={i} style={{borderBottom:i<FAQ.length-1?"1px solid #d4e8e4":"none",marginBottom:i<FAQ.length-1?4:0}}>
                  <button onClick={()=>setFaqOpen(faqOpen===i?null:i)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",textAlign:"left"}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#1a3a3a",paddingRight:12}}>{f.q}</span>
                    <span style={{color:"#3aada0",fontSize:16,flexShrink:0,transition:"transform .2s",transform:faqOpen===i?"rotate(45deg)":"rotate(0)"}}>+</span>
                  </button>
                  {faqOpen===i&&(
                    <div style={{fontSize:12,color:"#3a6a6a",lineHeight:1.7,paddingBottom:14}}>{f.a}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Refer a friend */}
            <a href="/refer.html" style={{...card,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:12,textDecoration:"none",background:"linear-gradient(135deg,rgba(58,173,160,0.07) 0%,rgba(26,74,74,0.04) 100%)",border:"1px solid rgba(58,173,160,0.2)",cursor:"pointer",transition:"border-color 0.2s,box-shadow 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(58,173,160,0.5)";e.currentTarget.style.boxShadow="0 4px 16px rgba(58,173,160,0.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(58,173,160,0.2)";e.currentTarget.style.boxShadow="none";}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#1a4a4a",marginBottom:3}}>💷 Refer a friend — earn £50</div>
                <div style={{fontSize:12,color:"#3a6a6a",lineHeight:1.6}}>Know someone who needs better leads? You both get £50 when they subscribe.</div>
              </div>
              <span style={{fontSize:12,color:"#3aada0",fontWeight:600,whiteSpace:"nowrap"}}>Get your link →</span>
            </a>

            {/* Replay tour CTA */}
            <div style={{...card,textAlign:"center",padding:"20px"}}>
              <div style={{fontSize:13,color:"#3a6a6a",marginBottom:10}}>Want a walkthrough of the actual interface?</div>
              <button className="bs" onClick={()=>{localStorage.removeItem(`dunlin_tour_${userId}`);setTourStep(0);}}>▶ Replay Guided Tour</button>
            </div>
          </div>
        )}

      </div>

      {/* ── App Footer ── */}
      <div style={{background:"#1a4a4a",marginTop:0}}>
        <div style={{maxWidth:900,margin:"0 auto",padding:"40px 32px 28px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:32}}>
          {[
            { title:"Product", links:[
              {label:"Home",href:"https://getdunlin.com"},
              {label:"Features",href:"https://getdunlin.com#features"},
              {label:"Pricing",href:"https://getdunlin.com#pricing"},
              {label:"Product Overview",href:"https://getdunlin.com/one-pager.html"},
            ]},
            { title:"Company", links:[
              {label:"Affiliate Programme",href:"https://getdunlin.com/affiliate.html"},
              {label:"Refer a Friend — earn £50",href:"https://getdunlin.com/refer.html"},
              {label:"Sitemap",href:"https://getdunlin.com/sitemap.html"},
              {label:"Contact us",href:"mailto:hello@getdunlin.com"},
            ]},
            { title:"Legal", links:[
              {label:"Privacy Policy",href:"https://getdunlin.com/privacy.html"},
              {label:"Terms of Service",href:"https://getdunlin.com/terms.html"},
              {label:"Cookie Policy",href:"https://getdunlin.com/cookies.html"},
              {label:"GDPR",href:"https://getdunlin.com/privacy.html#gdpr"},
            ]},
          ].map(({title,links})=>(
            <div key={title}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",marginBottom:14}}>{title}</div>
              {links.map(({label,href})=>(
                <a key={label} href={href} target={href.startsWith("mailto")? undefined:"_blank"} rel="noopener noreferrer"
                  style={{display:"block",fontSize:12,color:"rgba(255,255,255,0.5)",textDecoration:"none",marginBottom:10,transition:"color 0.2s"}}
                  onMouseOver={e=>e.currentTarget.style.color="#7dd4cc"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>© 2026 Dunlin · Marvanova Ltd · All rights reserved</span>
          <a href="https://marvanova.com" target="_blank" rel="noopener noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,textDecoration:"none",opacity:0.6,transition:"opacity 0.2s"}}
            onMouseOver={e=>e.currentTarget.style.opacity="1"} onMouseOut={e=>e.currentTarget.style.opacity="0.6"}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#6a8a9a",letterSpacing:"0.08em"}}>Built by</span>
            <span style={{fontFamily:"Arial,sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.12em"}}>
              <span style={{background:"linear-gradient(90deg,#0066cc,#00aadd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>MARVA</span>
              <span style={{color:"#8a9aaa",WebkitTextFillColor:"#8a9aaa"}}>NOVA</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
