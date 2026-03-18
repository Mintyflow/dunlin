import { useState, useRef, useEffect, useMemo } from "react";

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
const DISPOSABLE = new Set(["mailinator.com","guerrillamail.com","tempmail.com","throwaway.email","yopmail.com","trashmail.com","trashmail.me","dispostable.com","maildrop.cc","discard.email","fakeinbox.com","mailnesia.com"]);
const ROLE_PREFIXES = new Set(["admin","info","contact","support","sales","hello","help","no-reply","noreply","mail","email","office","team","enquiries","enquiry","webmaster","postmaster","billing","accounts","marketing","hr","legal","ops"]);
function validSyntax(e){return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(e);}
async function checkMX(domain){try{const r=await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,{headers:{Accept:"application/json"}});if(!r.ok)return null;const d=await r.json();if(d.Status===3)return false;return(d.Answer||[]).filter(r=>r.type===15).length>0;}catch{return null;}}
async function verifyEmail(email){if(!email||email==="unknown")return{status:"unknown",score:0,detail:"No email"};email=email.trim().toLowerCase();if(!validSyntax(email))return{status:"invalid",score:0,detail:"Invalid format"};const[local,domain]=email.split("@");if(DISPOSABLE.has(domain))return{status:"invalid",score:10,detail:"Disposable domain"};const isRole=ROLE_PREFIXES.has(local);const mx=await checkMX(domain);if(mx===false)return{status:"invalid",score:15,detail:"No mail server for domain"};let score=50;if(mx===true)score+=25;if(!isRole)score+=10;if(/^[a-z]+\.[a-z]+$/.test(local))score+=15;else if(/^[a-z]\.[a-z]+$/.test(local))score+=10;if(domain.endsWith(".co.uk")||domain.endsWith(".com"))score+=5;if(/\d/.test(local))score-=5;score=Math.max(0,Math.min(100,score));const status=score>=75?"valid":score>=50?"risky":"invalid";const detail=mx===null?`Pattern looks ${status} — DNS inconclusive`:isRole?`Role address — mail server confirmed`:`Mail server confirmed for ${domain}`;return{status,score,detail,isRole,hasMX:mx};}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const MONTHS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
function parseExpiry(str){if(!str||str==="unknown")return null;const d=new Date(`1 ${str}`);return isNaN(d.getTime())?null:d;}
function daysBetween(a,b){return Math.round((b-a)/(1000*60*60*24));}
function urgency(days){if(days<0)return{label:"Overdue",color:"#ef4444",bg:"#1a0808",border:"#3a1515"};if(days<=30)return{label:"This month",color:"#ef4444",bg:"#1a0808",border:"#3a1515"};if(days<=60)return{label:"60 days",color:"#f59e0b",bg:"#1a1000",border:"#3a2800"};if(days<=90)return{label:"90 days",color:"#fbbf24",bg:"#141000",border:"#2a2000"};if(days<=180)return{label:"6 months",color:"#38bdf8",bg:"#071520",border:"#0a2535"};return{label:"6m+",color:"#4a5880",bg:"#0f1218",border:"#1e2535"};}
const newId=()=>Date.now()+Math.floor(Math.random()*1000);

const PIPELINE_STAGES=[
  {id:"new",      label:"New",       color:"#4a5880"},
  {id:"contacted",label:"Contacted", color:"#38bdf8"},
  {id:"interested",label:"Interested",color:"#22c55e"},
  {id:"converted",label:"Converted", color:"#818cf8"},
];

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const SAMPLE=[
  {id:1,name:"Sarah Winters",title:"Office Manager",phone:"+44 20 7123 4567",email:"s.winters@techflow.co.uk",company:"TechFlow Solutions Ltd",building:"WeWork Liverpool Street",location:"London, EC2M",tenure:"2 years 4 months",contract_expiry:"August 2026",source:"Companies House",confidence:"high",found:new Date().toISOString()},
  {id:2,name:"James Okafor",title:"Facilities Manager",phone:"+44 161 456 7890",email:"jokafor@meridiangroup.com",company:"Meridian Group UK",building:"Bruntwood Circle Square",location:"Manchester, M1",tenure:"11 months",contract_expiry:"April 2026",source:"Endole",confidence:"medium",found:new Date().toISOString()},
  {id:3,name:"Priya Nair",title:"Operations Director",phone:"+44 121 234 5678",email:"p.nair@novacreative.co.uk",company:"Nova Creative Agency",building:"Brindleyplace Business Quarter",location:"Birmingham, B1",tenure:"3 years 1 month",contract_expiry:"May 2026",source:"Companies House",confidence:"high",found:new Date().toISOString()},
  {id:4,name:"Daniel Marsh",title:"Office Manager",phone:"+44 113 321 9988",email:"d.marsh@axiompartners.co.uk",company:"Axiom Partners Ltd",building:"Platform Leeds",location:"Leeds, LS1",tenure:"8 months",contract_expiry:"November 2026",source:"Apollo",confidence:"medium",found:new Date().toISOString()},
  {id:5,name:"Claire Hutchins",title:"Office Manager",phone:"+44 161 555 0234",email:"c.hutchins@vertexdigital.co.uk",company:"Vertex Digital",building:"Regus Spinningfields",location:"Manchester, M3",tenure:"1 year 2 months",contract_expiry:"June 2026",source:"LinkedIn",confidence:"high",found:new Date().toISOString()},
  {id:6,name:"Marcus Reid",title:"Facilities Director",phone:"+44 20 7890 1234",email:"m.reid@clearstone.co.uk",company:"Clearstone Advisory",building:"IWG The Shard",location:"London, SE1",tenure:"2 years",contract_expiry:"July 2026",source:"Endole",confidence:"high",found:new Date().toISOString()},
];

const BLANK_LEAD={name:"",title:"",phone:"",email:"",company:"",building:"",location:"",tenure:"",contract_expiry:"",source:"Manual",confidence:"medium"};

export default function App(){
  const [tab,setTab]=useState("search");
  const [loc,setLoc]=useState("");
  const [bType,setBType]=useState("any");
  const [leads,setLeads]=useState([]);  // single source of truth for all contacts
  const [emailChecks,setEmailChecks]=useState({});
  const [verifying,setVerifying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [demo,setDemo]=useState(true);
  const [schedule,setSchedule]=useState({enabled:false,frequency:"daily",time:"08:00"});
  const [history,setHistory]=useState([]);
  const [expanded,setExpanded]=useState(null);
  // Pipeline
  const [pipeline,setPipeline]=useState({});   // id -> stage id
  const [dragId,setDragId]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  // Calendar
  const [calView,setCalView]=useState("timeline");
  const [calFilter,setCalFilter]=useState("all");
  const [calSearch,setCalSearch]=useState("");
  const [calSel,setCalSel]=useState(null);
  const [showExpired,setShowExpired]=useState(false);
  // Outreach
  const [outreach,setOutreach]=useState({});
  const [outreachForm,setOutreachForm]=useState(null);
  const [newLog,setNewLog]=useState({type:"email",note:"",outcome:"no_reply",followup:""});
  const [outreachSearch,setOutreachSearch]=useState("");
  // Manual entry
  const [showAddForm,setShowAddForm]=useState(false);
  const [addForm,setAddForm]=useState(BLANK_LEAD);
  const [addError,setAddError]=useState("");
  // CSV import
  const csvRef=useRef(null);
  const abortRef=useRef(null);

  // ── Background email verification ───────────────────────────────────────────
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

  // ── Search ──────────────────────────────────────────────────────────────────
  const run=async()=>{
    if(!loc.trim()){setError("Enter a location.");return;}
    setLoading(true);setError(null);
    if(demo){
      await new Promise(r=>setTimeout(r,1500));
      const newLeads=SAMPLE.filter(s=>!leads.find(l=>l.email===s.email));
      setLeads(p=>[...p,...newLeads]);
      setHistory(p=>[{loc,bType,count:newLeads.length,date:new Date().toISOString(),mode:"Demo"},...p].slice(0,20));
      setLoading(false);setTab("results");return;
    }
    const controller=new AbortController();abortRef.current=controller;
    const timer=setTimeout(()=>controller.abort(),30000);
    try{
      const od=bType==="any"?"serviced, flexible, co-working, and managed offices":`${bType} offices`;
      const prompt=`UK B2B lead database. Generate 10 realistic office contacts for companies in ${od} in ${loc}, UK. Use real buildings (Regus,WeWork,Bruntwood,IWG,BE Offices,Orega,Landmark,TOG,Spaces). Real names, UK phones, realistic emails, actual buildings. Estimate tenure and contract_expiry (month+year e.g. "March 2026"). Return ONLY JSON no markdown: {"results":[{"name":"","title":"","phone":"+44...","email":"","company":"","building":"","location":"${loc}","tenure":"","contract_expiry":"e.g. March 2026","source":"","confidence":"high"}]}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,messages:[{role:"user",content:prompt}]})});
      clearTimeout(timer);
      if(!res.ok) throw new Error(`API error ${res.status}`);
      const data=await res.json();
      const raw=data.content.filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/gi,"").trim();
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s===-1||e<=s) throw new Error("No results returned.");
      const parsed=JSON.parse(raw.substring(s,e+1));
      if(!Array.isArray(parsed.results)||!parsed.results.length) throw new Error("No contacts found.");
      const newR=parsed.results.map((r,i)=>({...r,id:newId()+i,found:new Date().toISOString()}));
      // Deduplicate by email
      const existing=new Set(leads.map(l=>l.email?.toLowerCase()).filter(Boolean));
      const deduped=newR.filter(r=>!r.email||!existing.has(r.email.toLowerCase()));
      setLeads(p=>[...p,...deduped]);
      setHistory(p=>[{loc,bType,count:deduped.length,date:new Date().toISOString(),mode:"Live"},...p].slice(0,20));
      setTab("results");
    }catch(e){
      if(e.name==="AbortError") setError("Timed out. Please try again.");
      else setError(e.message);
    }finally{clearTimeout(timer);setLoading(false);}
  };

  // ── Manual add ──────────────────────────────────────────────────────────────
  const submitManual=()=>{
    if(!addForm.name.trim()){setAddError("Name is required.");return;}
    if(!addForm.company.trim()){setAddError("Company is required.");return;}
    const newLead={...addForm,id:newId(),found:new Date().toISOString()};
    setLeads(p=>[newLead,...p]);
    setAddForm(BLANK_LEAD);setShowAddForm(false);setAddError("");
    setTab("results");
  };

  // ── CSV import ───────────────────────────────────────────────────────────────
  const handleCSV=(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const lines=ev.target.result.split("\n").filter(l=>l.trim());
      if(lines.length<2){alert("CSV must have a header row and at least one data row.");return;}
      const headers=lines[0].split(",").map(h=>h.replace(/"/g,"").trim().toLowerCase());
      const map={name:["name","full name"],title:["title","job title","role"],phone:["phone","telephone","mobile","number"],email:["email","email address"],company:["company","company name","organisation","organization"],building:["building","office","office building"],location:["location","city","area"],tenure:["tenure"],contract_expiry:["contract_expiry","contract due","renewal","expiry"],source:["source"],confidence:["confidence"]};
      const colIdx={};
      Object.entries(map).forEach(([field,aliases])=>{
        const idx=headers.findIndex(h=>aliases.some(a=>h.includes(a)));
        if(idx!==-1) colIdx[field]=idx;
      });
      const existing=new Set(leads.map(l=>l.email?.toLowerCase()).filter(Boolean));
      const imported=[];
      lines.slice(1).forEach(line=>{
        const cols=line.split(",").map(c=>c.replace(/^"|"$/g,"").trim());
        const lead={id:newId(),found:new Date().toISOString(),source:"CSV Import",confidence:"medium"};
        Object.entries(colIdx).forEach(([field,idx])=>{if(cols[idx]) lead[field]=cols[idx];});
        if(!lead.name&&!lead.company) return;
        if(lead.email&&existing.has(lead.email.toLowerCase())) return;
        imported.push(lead);
        if(lead.email) existing.add(lead.email.toLowerCase());
      });
      if(!imported.length){alert("No new contacts found (duplicates removed).");return;}
      setLeads(p=>[...imported,...p]);
      alert(`Imported ${imported.length} contact${imported.length!==1?"s":""}.`);
      setTab("results");
    };
    reader.readAsText(file);
    e.target.value="";
  };

  // ── Outreach ─────────────────────────────────────────────────────────────────
  const logOutreach=(id)=>{
    const entry={...newLog,date:new Date().toISOString()};
    setOutreach(p=>({...p,[id]:[entry,...(p[id]||[])]}));
    // Move to Contacted stage if still New
    if(!pipeline[id]||pipeline[id]==="new") setPipeline(p=>({...p,[id]:"contacted"}));
    if(newLog.outcome==="converted") setPipeline(p=>({...p,[id]:"converted"}));
    if(newLog.outcome==="interested") setPipeline(p=>({...p,[id]:"interested"}));
    setOutreachForm(null);setNewLog({type:"email",note:"",outcome:"no_reply",followup:""});
  };

  const lastContact=(id)=>(outreach[id]||[])[0]||null;
  const outcomeLabel=(o)=>({no_reply:"No reply",interested:"Interested",not_now:"Not now",converted:"Converted",do_not_call:"Do not call"}[o]||o);
  const outcomeColor=(o)=>({no_reply:"#4a5880",interested:"#22c55e",not_now:"#f59e0b",converted:"#818cf8",do_not_call:"#ef4444"}[o]||"#4a5880");

  // ── Pipeline ─────────────────────────────────────────────────────────────────
  const getStage=(id)=>pipeline[id]||"new";
  const moveStage=(id,stage)=>setPipeline(p=>({...p,[id]:stage}));

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportXLSX=(data)=>{
    const doExport=(XLSX)=>{
      const wsData=[["Name","Title","Company","Email","Email Status","Phone","Building","Location","Tenure","Contract Due","Pipeline Stage","Source","Confidence"],...data.map(r=>{const ec=emailChecks[r.id];return[r.name,r.title,r.company,r.email,ec?ec.status:"pending",r.phone,r.building,r.location,r.tenure,r.contract_expiry,getStage(r.id),r.source,r.confidence];})];
      const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"]=[{wch:20},{wch:18},{wch:26},{wch:28},{wch:12},{wch:18},{wch:26},{wch:16},{wch:14},{wch:14},{wch:12},{wch:20},{wch:10}];
      XLSX.utils.book_append_sheet(wb,ws,"Dunlin Leads");
      XLSX.writeFile(wb,`dunlin-${(loc||"leads").replace(/\s+/g,"-")}-${new Date().toISOString().split("T")[0]}.xlsx`);
    };
    if(window.XLSX){doExport(window.XLSX);return;}
    const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";sc.onload=()=>doExport(window.XLSX);sc.onerror=()=>alert("Could not load spreadsheet library.");document.head.appendChild(sc);
  };

  // ── Calendar data ─────────────────────────────────────────────────────────────
  const enriched=useMemo(()=>leads.map(l=>{const expiry=parseExpiry(l.contract_expiry);const days=expiry?daysBetween(now,expiry):null;return{...l,expiry,days};}).sort((a,b)=>{if(a.days===null)return 1;if(b.days===null)return -1;return a.days-b.days;}),[leads,now]);
  const expiredLeads=useMemo(()=>enriched.filter(l=>l.days!==null&&l.days<0),[enriched]);
  const calFiltered=useMemo(()=>enriched.filter(l=>{const ms=!calSearch||[l.name,l.company,l.location,l.building].some(f=>f?.toLowerCase().includes(calSearch.toLowerCase()));const mf=calFilter==="all"||(l.days!==null&&l.days<=parseInt(calFilter));const notExp=showExpired||(l.days===null||l.days>=0);return ms&&mf&&notExp;}),[enriched,calFilter,calSearch,showExpired]);
  const byMonth=useMemo(()=>{const g={};calFiltered.forEach(l=>{if(!l.expiry)return;const key=`${l.expiry.getFullYear()}-${l.expiry.getMonth()}`;if(!g[key])g[key]={year:l.expiry.getFullYear(),month:l.expiry.getMonth(),leads:[]};g[key].leads.push(l);});return Object.values(g).sort((a,b)=>a.year!==b.year?a.year-b.year:a.month-b.month);},[calFiltered]);
  const calStats=useMemo(()=>({overdue:enriched.filter(l=>l.days!==null&&l.days<0).length,d30:enriched.filter(l=>l.days!==null&&l.days>=0&&l.days<=30).length,d60:enriched.filter(l=>l.days!==null&&l.days>30&&l.days<=60).length,d90:enriched.filter(l=>l.days!==null&&l.days>60&&l.days<=90).length}),[enriched]);

  const verifiedCount=Object.values(emailChecks).filter(e=>e.status==="valid").length;
  const nextRun=(freq,time)=>{const[h,m]=time.split(":").map(Number),d=new Date();d.setHours(h,m,0,0);if(d<=new Date()){if(freq==="daily")d.setDate(d.getDate()+1);else if(freq==="weekly")d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1);}return d.toLocaleString();};

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inp={width:"100%",background:"#0f1218",border:"1px solid #1e2535",color:"#e2e8f0",padding:"11px 13px",fontFamily:"monospace",fontSize:14,borderRadius:8,outline:"none",WebkitAppearance:"none"};
  const card={background:"#0f1218",border:"1px solid #1e2535",borderRadius:10,padding:14};
  const notice=w=>({background:w?"#150e00":"#0a1424",border:`1px solid ${w?"#3a2800":"#1a3a5c"}`,borderLeft:`3px solid ${w?"#f59e0b":"#38bdf8"}`,padding:"11px 13px",borderRadius:8,color:w?"#c8a840":"#7aa8c8",fontSize:12,lineHeight:1.7,marginBottom:12});

  const confBadge=(r)=>{const ec=emailChecks[r.id];let label=r.confidence?.toUpperCase()||"—",bg,col;if(ec){if(ec.status==="invalid"){bg="#2a0d0d";col="#ef4444";label="BAD EMAIL";}else if(ec.status==="valid"&&r.confidence==="high"){bg="#0d2e1a";col="#22c55e";label="VERIFIED";}else if(ec.status==="risky"){bg="#2a1f00";col="#f59e0b";label="RISKY EMAIL";}else{const m={high:["#0d2e1a","#22c55e"],medium:["#2a1f00","#f59e0b"],low:["#2a0d0d","#ef4444"]};[bg,col]=m[r.confidence]||m.low;}}else{const m={high:["#0d2e1a","#22c55e"],medium:["#2a1f00","#f59e0b"],low:["#2a0d0d","#ef4444"]};[bg,col]=m[r.confidence]||m.low;}return<span style={{background:bg,color:col,border:`1px solid ${col}40`,padding:"2px 5px",borderRadius:3,fontSize:9,fontFamily:"monospace",letterSpacing:1,whiteSpace:"nowrap"}}>{label}</span>;};
  const emailDot=(id)=>{const ec=emailChecks[id];if(!ec)return<span style={{width:7,height:7,borderRadius:4,background:"#2a3040",display:"inline-block",marginRight:5,flexShrink:0}}/>;const col=ec.status==="valid"?"#22c55e":ec.status==="risky"?"#f59e0b":"#ef4444";return<span style={{width:7,height:7,borderRadius:4,background:col,display:"inline-block",marginRight:5,flexShrink:0,boxShadow:`0 0 4px ${col}88`}}/>;};

  const navTabs=[
    {id:"search",   l:"Search",  i:"⌖"},
    {id:"results",  l:"Leads",   i:"◈", b:leads.length},
    {id:"pipeline", l:"Pipeline",i:"⬦", b:leads.filter(l=>getStage(l.id)==="interested").length||undefined},
    {id:"calendar", l:"Renewal", i:"📅",dot:calStats.d30>0||calStats.overdue>0},
    {id:"outreach", l:"Outreach",i:"✉", b:followupsDueToday.length||undefined},
    {id:"history",  l:"History", i:"◎", b:history.length||undefined},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#0a0c10",color:"#e2e8f0",fontFamily:"'IBM Plex Mono','Courier New',monospace",fontSize:13}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0c10}::-webkit-scrollbar-thumb{background:#2a3040;border-radius:2px}
        input,select,textarea{outline:none;-webkit-appearance:none}input[type=time],input[type=date]{color-scheme:dark}
        input::placeholder,textarea::placeholder{color:#3a4460}
        .nb{flex:1;background:none;border:none;cursor:pointer;padding:7px 2px;color:#6b7a99;font-family:'IBM Plex Mono',monospace;border-bottom:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:2px;transition:color .15s;min-width:0}
        .nb:hover{color:#e2e8f0}.nb.act{color:#38bdf8;border-bottom-color:#38bdf8}
        .bp{background:#38bdf8;color:#000;border:none;padding:13px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:2px;font-weight:700;cursor:pointer;border-radius:8px;text-transform:uppercase;width:100%}.bp:hover{background:#7dd3fc}
        .bs{background:#818cf8;color:#000;border:none;padding:9px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;font-weight:600;cursor:pointer;border-radius:6px;text-transform:uppercase}.bs:hover{background:#a5b4fc}
        .bg{background:none;border:1px solid #1e2535;color:#6b7a99;padding:8px 13px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;border-radius:6px;text-transform:uppercase;transition:all .15s}.bg:hover{border-color:#38bdf8;color:#38bdf8}.bg:disabled{opacity:.3;cursor:not-allowed}
        .bd{background:none;border:1px solid #3a1515;color:#ef4444;padding:8px 13px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;border-radius:6px;text-transform:uppercase}.bd:hover{background:#1a0808}.bd:disabled{opacity:.3;cursor:not-allowed}
        .bx{background:#0a1f12;border:1px solid #1a4a2a;color:#22c55e;padding:8px 13px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;border-radius:6px;text-transform:uppercase}.bx:hover{background:#0d2e1a}
        .rcard{background:#0f1218;border:1px solid #1e2535;border-radius:10px;padding:13px;margin-bottom:9px;cursor:pointer;transition:border-color .15s}.rcard:active{border-color:#38bdf8}.rcard.inv{border-color:#3a1515;opacity:.8}
        .sw{position:relative;width:40px;height:22px;background:#1e2535;border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0}.sw.on{background:#38bdf8}.sk{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:8px;transition:left .2s}.sw.on .sk{left:21px}
        .fb{background:none;border:1px solid #1e2535;color:#6b7a99;padding:5px 10px;font-family:'IBM Plex Mono',monospace;font-size:10px;cursor:pointer;border-radius:20px;transition:all .15s}.fb:hover{border-color:#38bdf8;color:#38bdf8}.fb.act{color:#000;border-color:transparent}
        .pipe-col{background:#080c10;border:1px solid #1e2535;border-radius:10px;padding:10px;min-height:200px;transition:border-color .2s}.pipe-col.dragover{border-color:#38bdf8;background:#071520}
        .pipe-card{background:#0f1218;border:1px solid #1e2535;border-radius:7px;padding:10px;margin-bottom:7px;cursor:grab;transition:all .15s;user-select:none}.pipe-card:active{cursor:grabbing;opacity:.7}
        .tg{display:inline-block;background:#0f1624;border:1px solid #1e2d4a;color:#38bdf8;padding:2px 7px;border-radius:4px;font-size:10px}
        .lbl{font-size:10px;letter-spacing:2px;color:#4a5880;margin-bottom:6px;text-transform:uppercase;display:block}
        .fg{margin-bottom:12px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.6s ease-in-out infinite}
        .ocard{background:#0f1218;border:1px solid #1e2535;border-radius:10px;padding:13px;margin-bottom:9px}
      `}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid #111827",padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#070a0e",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:26,height:26,background:"linear-gradient(135deg,#38bdf8,#818cf8)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⬡</div>
          <div>
            <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:14,letterSpacing:3}}>DUNLIN</div>
            <div style={{fontSize:7,color:"#3a4870",letterSpacing:3,marginTop:-2}}>OFFICE INTELLIGENCE</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {verifying&&<span style={{fontSize:9,color:"#38bdf8"}} className="pulse">✉ CHECKING</span>}
          {!verifying&&leads.length>0&&<span style={{fontSize:9,color:"#22c55e"}}>✉ {verifiedCount}/{leads.filter(r=>r.email&&r.email!=="unknown").length}</span>}
          <div style={{width:1,height:14,background:"#1e2535"}}/>
          <span style={{fontSize:9,color:"#3a4870"}}>DEMO</span>
          <div className={`sw ${demo?"on":""}`} onClick={()=>setDemo(!demo)}><div className="sk"/></div>
          <span style={{fontSize:9,color:demo?"#a78bfa":"#3a4870",minWidth:18}}>{demo?"ON":"OFF"}</span>
        </div>
      </div>

      {/* Follow-up due today banner */}
      {followupsDueToday.length>0&&(
        <div style={{background:"#1a1030",borderBottom:"1px solid #3a2060",padding:"8px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#818cf8",letterSpacing:1,textTransform:"uppercase"}}>◉ Follow-ups due today</span>
          {followupsDueToday.map(({lead},i)=>(
            <span key={i} style={{fontSize:11,color:"#b0a0f0",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setTab("outreach");setOutreachForm(lead.id);}}>{lead.name}</span>
          ))}
        </div>
      )}

      {/* Nav */}
      <div style={{borderBottom:"1px solid #111827",display:"flex",background:"#070a0e",position:"sticky",top:followupsDueToday.length>0?81:49,zIndex:9,overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} className={`nb ${tab===n.id?"act":""}`} onClick={()=>setTab(n.id)} style={{padding:"7px 4px",minWidth:50}}>
            <span style={{fontSize:13}}>{n.i}</span>
            <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:9,whiteSpace:"nowrap"}}>{n.l}</span>
            {n.b>0&&<span style={{background:"#1e2d4a",color:"#38bdf8",fontSize:8,padding:"1px 4px",borderRadius:10}}>{n.b}</span>}
            {n.dot&&!n.b&&<span style={{width:5,height:5,borderRadius:3,background:"#ef4444",display:"inline-block"}} className="pulse"/>}
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
                  <div style={{fontSize:13,color:"#38bdf8",marginBottom:3}}>{i}</div>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:15,fontWeight:600,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#3a4870",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
            {demo&&<div style={notice(true)}><strong style={{color:"#f59e0b"}}>Demo Mode ON</strong> — loads sample data. Toggle off for live results.</div>}
            <div style={{...card,marginBottom:12}}>
              <div className="fg">
                <label className="lbl">Location <span style={{color:"#38bdf8"}}>*</span></label>
                <input style={{...inp,border:error&&!loc?"1px solid #ef4444":"1px solid #1e2535"}} placeholder="e.g. Manchester, Leeds, London EC2..." value={loc} onChange={e=>{setLoc(e.target.value);setError(null);}} onKeyDown={e=>e.key==="Enter"&&!loading&&run()}/>
              </div>
              <div className="fg">
                <label className="lbl">Office Type <span style={{color:"#3a4870",fontWeight:400,fontSize:9}}>(optional)</span></label>
                <select style={{...inp,cursor:"pointer"}} value={bType} onChange={e=>setBType(e.target.value)}>
                  <option value="any">Any office type</option><option value="serviced">Serviced Offices</option><option value="flexible">Flexible / Co-working</option><option value="managed">Managed Offices</option>
                </select>
              </div>
              {loading?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:28,marginBottom:8}} className="pulse">⌖</div>
                  <div style={{color:"#38bdf8",fontSize:11,letterSpacing:2,marginBottom:10}}>FINDING CONTACTS</div>
                  <button className="bd" style={{width:"100%"}} onClick={()=>{abortRef.current?.abort();setLoading(false);}}>◼ Stop</button>
                </div>
              ):(
                <button className="bp" onClick={run}>▶ Find Contacts</button>
              )}
              {error&&<div style={{marginTop:10,background:"#1a0808",border:"1px solid #3a1515",borderRadius:6,padding:10,color:"#ef4444",fontSize:12,lineHeight:1.6}}>⚠ {error}</div>}
            </div>

            {/* Manual add */}
            <div style={{...card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showAddForm?12:0}}>
                <div>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,fontSize:13}}>Add contact manually</div>
                  {!showAddForm&&<div style={{fontSize:11,color:"#4a5880",marginTop:2}}>From LinkedIn, a card, or a referral</div>}
                </div>
                <button className="bg" onClick={()=>{setShowAddForm(!showAddForm);setAddError("");}}>
                  {showAddForm?"Cancel":"+ Add"}
                </button>
              </div>
              {showAddForm&&(
                <div>
                  {[["Name *","name","text","Full name"],["Title","title","text","Job title"],["Company *","company","text","Company name"],["Email","email","email","name@company.co.uk"],["Phone","phone","text","+44..."],["Office Building","building","text","WeWork, Regus..."],["Location","location","text","City, Postcode"],["Contract Due","contract_expiry","text","e.g. March 2026"]].map(([lbl,field,type,ph])=>(
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
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,fontSize:13}}>Import from CSV</div>
                  <div style={{fontSize:11,color:"#4a5880",marginTop:2}}>Paste in an existing spreadsheet</div>
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
            {leads.length>0&&Object.keys(emailChecks).length>0&&(
              <div style={{background:"#080c14",border:"1px solid #1a2535",borderRadius:8,padding:"8px 13px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#3a4870",letterSpacing:2,textTransform:"uppercase"}}>Email</span>
                {[["✓",Object.values(emailChecks).filter(e=>e.status==="valid").length,"#22c55e"],["⚠",Object.values(emailChecks).filter(e=>e.status==="risky").length,"#f59e0b"],["✗",Object.values(emailChecks).filter(e=>e.status==="invalid").length,"#ef4444"]].map(([ic,v,c])=>(<span key={ic} style={{fontSize:11,color:c}}>{ic} {v}</span>))}
                {verifying&&<span style={{fontSize:10,color:"#38bdf8",marginLeft:"auto"}} className="pulse">checking...</span>}
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
              <div style={{textAlign:"center",padding:"50px 20px",color:"#3a4870"}}>
                <div style={{fontSize:40,marginBottom:10}}>◈</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO LEADS YET</div>
                <div style={{fontSize:11,marginTop:6,color:"#2a3450"}}>Search, add manually, or import a CSV</div>
              </div>
            ):leads.map(r=>{
              const ec=emailChecks[r.id];const stage=getStage(r.id);const stageInfo=PIPELINE_STAGES.find(s=>s.id===stage);const lc=lastContact(r.id);
              return(
                <div key={r.id} className={`rcard ${ec?.status==="invalid"?"inv":""}`} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name||"—"}</div>
                      <div style={{fontSize:10,color:"#4a5880",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[r.title,r.company].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,marginLeft:8}}>
                      <span style={{fontSize:9,color:stageInfo?.color,border:`1px solid ${stageInfo?.color}40`,padding:"2px 5px",borderRadius:3,fontFamily:"monospace",letterSpacing:1}}>{stage.toUpperCase()}</span>
                      {confBadge(r)}
                      <span style={{color:"#3a4870",fontSize:10}}>{expanded===r.id?"▲":"▼"}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#7aa8c8",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {[r.building,r.location].filter(v=>v&&v!=="unknown").join(" — ")||"—"}</div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&(
                    <div style={{background:"#0d1f0a",border:"1px solid #1e4a1a",borderRadius:5,padding:"5px 9px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:9,color:"#4a7a40",letterSpacing:1,textTransform:"uppercase"}}>Contract due</span>
                      <span style={{fontSize:11,color:"#22c55e",fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif"}}>{r.contract_expiry}</span>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    <div style={{fontSize:10,display:"flex",alignItems:"center",overflow:"hidden"}}>{emailDot(r.id)}<span style={{color:ec?.status==="valid"?"#22c55e":ec?.status==="invalid"?"#ef4444":"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email||"—"}</span></div>
                    <div style={{fontSize:10,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📞 {r.phone||"—"}</div>
                  </div>
                  {lc&&<div style={{marginTop:6,fontSize:10,color:outcomeColor(lc.outcome),display:"flex",alignItems:"center",gap:4}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}{lc.followup&&<span style={{color:"#818cf8",marginLeft:6}}>↻ {lc.followup}</span>}</div>}
                  {expanded===r.id&&(
                    <div style={{marginTop:11,paddingTop:11,borderTop:"1px solid #1e2535"}}>
                      {/* Pipeline stage selector */}
                      <div style={{marginBottom:11}}>
                        <label className="lbl">Pipeline Stage</label>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {PIPELINE_STAGES.map(s=>(
                            <button key={s.id} onClick={e=>{e.stopPropagation();moveStage(r.id,s.id);}} style={{background:stage===s.id?s.color+"22":"transparent",border:`1px solid ${stage===s.id?s.color:"#1e2535"}`,color:stage===s.id?s.color:"#4a5880",padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,transition:"all .15s"}}>{s.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
                        {[["Company",r.company],["Building",r.building],["Location",r.location],["Tenure",r.tenure],["Contract Due",r.contract_expiry],["Source",r.source]].map(([l,v])=>(
                          <div key={l}><div style={{fontSize:9,letterSpacing:2,color:"#3a4870",textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{fontSize:11,wordBreak:"break-word",color:v&&v!=="unknown"?"#e2e8f0":"#2a3a4a"}}>{v&&v!=="unknown"?v:"—"}</div></div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#38bdf8",fontSize:11,textDecoration:"none",background:"#0f1624",border:"1px solid #1e2d4a",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>✉ Email</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#22c55e",fontSize:11,textDecoration:"none",background:"#0d2010",border:"1px solid #1a3020",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>📞 Call</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#22c55e",fontSize:11,textDecoration:"none",background:"#0d2010",border:"1px solid #1a5020",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>💬 WhatsApp</a>}
                        <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(r.name+" "+r.company)}`} target="_blank" rel="noreferrer" style={{color:"#38bdf8",fontSize:11,textDecoration:"none",background:"#071520",border:"1px solid #0a2535",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>🔗 LinkedIn</a>
                        <button onClick={e=>{e.stopPropagation();setOutreachForm(r.id);setTab("outreach");}} style={{background:"#1a1030",border:"1px solid #3a2060",color:"#818cf8",fontSize:11,padding:"6px 11px",borderRadius:5,cursor:"pointer",fontFamily:"monospace"}}>◉ Log</button>
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
            <div style={{fontSize:9,color:"#3a4870",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Drag leads between stages</div>
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
                      <div style={{fontSize:10,color:stage.color,letterSpacing:1,textTransform:"uppercase",fontFamily:"monospace"}}>{stage.label}</div>
                      <span className="tg">{stageLeads.length}</span>
                    </div>
                    {stageLeads.map(l=>{
                      const u=urgency(enriched.find(e=>e.id===l.id)?.days??999);
                      return(
                        <div key={l.id} className="pipe-card" draggable onDragStart={()=>setDragId(l.id)} style={{borderLeft:`3px solid ${u.color}`}}>
                          <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                          <div style={{fontSize:10,color:"#4a5880",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div>
                          {l.contract_expiry&&l.contract_expiry!=="unknown"&&<div style={{fontSize:9,color:u.color,marginTop:4}}>📅 {l.contract_expiry}</div>}
                          {lastContact(l.id)&&<div style={{fontSize:9,color:outcomeColor(lastContact(l.id).outcome),marginTop:3}}>◉ {outcomeLabel(lastContact(l.id).outcome)}</div>}
                        </div>
                      );
                    })}
                    {stageLeads.length===0&&<div style={{fontSize:10,color:"#2a3450",textAlign:"center",padding:"16px 0",fontStyle:"italic"}}>Drop here</div>}
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
              <div style={{background:"#1a0808",border:"1px solid #3a1515",borderLeft:"3px solid #ef4444",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#ef4444",letterSpacing:2,textTransform:"uppercase"}}>⚠ Urgent</span>
                {calStats.overdue>0&&<span style={{fontSize:11,color:"#ef4444"}}><strong>{calStats.overdue}</strong> overdue</span>}
                {calStats.d30>0&&<span style={{fontSize:11,color:"#f59e0b"}}><strong>{calStats.d30}</strong> this month</span>}
              </div>
            )}
            {leads.length===0&&<div style={notice(false)}>No leads yet — run a search and contract dates appear here automatically.</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
              {[["Overdue",calStats.overdue,"#ef4444","30"],["Month",calStats.d30,"#ef4444","30"],["60d",calStats.d60,"#f59e0b","60"],["90d",calStats.d90,"#fbbf24","90"]].map(([l,v,c,f])=>(
                <div key={l} onClick={()=>setCalFilter(calFilter===f?"all":f)} style={{...card,cursor:"pointer",borderColor:calFilter===f?c:"#1e2535",transition:"border-color .2s"}}>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:18,fontWeight:700,color:c,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#3a4870",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:7,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:5}}>
                {["timeline","list"].map(v=>(
                  <button key={v} className={`fb ${calView===v?"act":""}`} onClick={()=>setCalView(v)} style={calView===v?{background:"#38bdf8"}:{}}>{v==="timeline"?"⟶ Timeline":"☰ List"}</button>
                ))}
              </div>
              <input style={{flex:1,minWidth:100,...inp,padding:"7px 11px",fontSize:12}} placeholder="Search..." value={calSearch} onChange={e=>setCalSearch(e.target.value)}/>
            </div>
            {expiredLeads.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"7px 11px",background:"#0f1218",border:"1px solid #1e2535",borderRadius:7}}>
                <div className={`sw ${showExpired?"on":""}`} style={{background:showExpired?"#4a5880":"#1e2535"}} onClick={()=>setShowExpired(!showExpired)}><div className="sk"/></div>
                <span style={{fontSize:11,color:"#4a5880"}}>Show {expiredLeads.length} expired contract{expiredLeads.length!==1?"s":""}</span>
                {showExpired&&<span style={{fontSize:10,color:"#3a4460",marginLeft:"auto"}}>Windows already passed</span>}
              </div>
            )}
            {calView==="timeline"&&(
              byMonth.length===0
                ? <div style={{textAlign:"center",padding:"40px 0",color:"#3a4870"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div style={{fontSize:11,letterSpacing:2}}>NO UPCOMING CONTRACTS</div></div>
                : byMonth.map(group=>(
                  <div key={`${group.year}-${group.month}`} style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:13}}>{MONTHS_FULL[group.month]} {group.year}</div>
                      <div style={{flex:1,height:1,background:"#1e2535"}}/>
                      <span style={{fontSize:10,color:"#3a4870"}}>{group.leads.length}</span>
                    </div>
                    {group.leads.map(l=>{
                      const u=urgency(l.days??999);const lc=lastContact(l.id);
                      return(
                        <div key={l.id} onClick={()=>setCalSel(calSel===l.id?null:l.id)} style={{background:calSel===l.id?"#0d1422":u.bg,border:`1px solid ${calSel===l.id?u.color:u.border}`,borderLeft:`3px solid ${u.color}`,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                            <div style={{minWidth:0,flex:1}}>
                              <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                              <div style={{fontSize:10,color:"#4a5880",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title} · {l.company}</div>
                            </div>
                            <div style={{flexShrink:0,marginLeft:10,textAlign:"right"}}>
                              <div style={{fontSize:11,color:u.color,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif"}}>{l.days===null?"—":l.days<0?`${Math.abs(l.days)}d ago`:l.days===0?"Today":`${l.days}d`}</div>
                              <div style={{fontSize:9,color:u.color,opacity:.7}}>{u.label}</div>
                            </div>
                          </div>
                          <div style={{fontSize:10,color:"#7aa8c8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {l.building} — {l.location}</div>
                          {lc&&<div style={{marginTop:4,fontSize:9,color:outcomeColor(lc.outcome)}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}</div>}
                          {calSel===l.id&&(
                            <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid #1e2535",display:"flex",gap:7,flexWrap:"wrap"}}>
                              {l.email&&l.email!=="unknown"&&<a href={`mailto:${l.email}`} onClick={e=>e.stopPropagation()} style={{color:"#38bdf8",fontSize:11,textDecoration:"none",background:"#0f1624",border:"1px solid #1e2d4a",padding:"5px 11px",borderRadius:5}}>✉ Email</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`tel:${l.phone}`} onClick={e=>e.stopPropagation()} style={{color:"#22c55e",fontSize:11,textDecoration:"none",background:"#0d2010",border:"1px solid #1a3020",padding:"5px 11px",borderRadius:5}}>📞 Call</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`https://wa.me/${l.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#22c55e",fontSize:11,textDecoration:"none",background:"#0d2010",border:"1px solid #1a5020",padding:"5px 11px",borderRadius:5}}>💬 WA</a>}
                              <button onClick={e=>{e.stopPropagation();setOutreachForm(l.id);setTab("outreach");}} style={{background:"#1a1030",border:"1px solid #3a2060",color:"#818cf8",fontSize:11,padding:"5px 11px",borderRadius:5,cursor:"pointer",fontFamily:"monospace"}}>◉ Log</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
            )}
            {calView==="list"&&(
              <div style={{background:"#0f1218",border:"1px solid #1e2535",borderRadius:10,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"7px 12px",borderBottom:"1px solid #1e2535",background:"#080c12",gap:8}}>
                  {["Contact","Company","Due"].map(h=><div key={h} style={{fontSize:9,letterSpacing:2,color:"#3a4870",textTransform:"uppercase"}}>{h}</div>)}
                </div>
                {calFiltered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#3a4870",fontSize:11,letterSpacing:2}}>NO CONTRACTS MATCH</div>}
                {calFiltered.map(l=>{const u=urgency(l.days??999);return(
                  <div key={l.id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"10px 12px",borderBottom:"1px solid #111827",gap:8,cursor:"pointer",background:calSel===l.id?"#0d1422":"transparent"}} onClick={()=>setCalSel(calSel===l.id?null:l.id)}>
                    <div style={{minWidth:0}}><div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:10,color:"#4a5880",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div></div>
                    <div style={{minWidth:0}}><div style={{fontSize:11,color:"#b0bcd0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div><div style={{fontSize:10,color:"#4a5880",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.building}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:u.color,fontWeight:600}}>{l.contract_expiry?.split(" ")[0]}</div><div style={{fontSize:9,color:u.color,opacity:.7}}>{l.days!==null?(l.days<0?`${Math.abs(l.days)}d ago`:`${l.days}d`):"—"}</div></div>
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
              <div style={{background:"#1a1030",border:"1px solid #3a2060",borderLeft:"3px solid #818cf8",borderRadius:8,padding:"10px 13px",marginBottom:12}}>
                <div style={{fontSize:9,color:"#818cf8",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>◉ {followupsDueToday.length} follow-up{followupsDueToday.length!==1?"s":""} due today</div>
                {followupsDueToday.map(({lead},i)=>(
                  <div key={i} style={{fontSize:12,color:"#b0a0f0",marginBottom:3,cursor:"pointer"}} onClick={()=>setOutreachForm(lead.id)}>→ {lead.name} · {lead.company}</div>
                ))}
              </div>
            )}
            {outreachForm&&(()=>{
              const lead=leads.find(r=>r.id===outreachForm);if(!lead)return null;
              return(
                <div style={{...card,marginBottom:12,border:"1px solid #3a2060"}}>
                  <div style={{fontSize:9,letterSpacing:2,color:"#818cf8",textTransform:"uppercase",marginBottom:8}}>Logging contact</div>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:13,marginBottom:1}}>{lead.name}</div>
                  <div style={{fontSize:11,color:"#4a5880",marginBottom:12}}>{lead.company}</div>
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
                  <div className="fg"><label className="lbl">Follow-up date <span style={{color:"#3a4870",fontWeight:400,fontSize:9}}>(optional)</span></label>
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
                      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontSize:10,color:"#4a5880",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title} · {r.company}</div>
                    </div>
                    <button onClick={()=>setOutreachForm(r.id)} style={{background:"#1a1030",border:"1px solid #3a2060",color:"#818cf8",fontSize:10,padding:"4px 9px",borderRadius:5,cursor:"pointer",fontFamily:"monospace",flexShrink:0,marginLeft:8}}>+ Log</button>
                  </div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&<div style={{fontSize:10,color:u.color,marginBottom:6}}>📅 {r.contract_expiry}</div>}
                  <div style={{display:"flex",gap:6,marginBottom:logs.length?9:0,flexWrap:"wrap"}}>
                    {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#38bdf8",fontSize:10,textDecoration:"none",background:"#0f1624",border:"1px solid #1e2d4a",padding:"4px 10px",borderRadius:5}}>✉</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#22c55e",fontSize:10,textDecoration:"none",background:"#0d2010",border:"1px solid #1a3020",padding:"4px 10px",borderRadius:5}}>📞</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#22c55e",fontSize:10,textDecoration:"none",background:"#0d2010",border:"1px solid #1a5020",padding:"4px 10px",borderRadius:5}}>💬</a>}
                    <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(r.name+" "+r.company)}`} target="_blank" rel="noreferrer" style={{color:"#38bdf8",fontSize:10,textDecoration:"none",background:"#071520",border:"1px solid #0a2535",padding:"4px 10px",borderRadius:5}}>🔗</a>
                    {lc&&<span style={{fontSize:10,color:outcomeColor(lc.outcome),padding:"4px 0",marginLeft:2}}>◉ {outcomeLabel(lc.outcome)}</span>}
                  </div>
                  {logs.length>0&&(
                    <div style={{borderTop:"1px solid #111827",paddingTop:7}}>
                      <div style={{fontSize:9,letterSpacing:2,color:"#3a4870",textTransform:"uppercase",marginBottom:5}}>History ({logs.length})</div>
                      {logs.slice(0,3).map((log,i)=>(
                        <div key={i} style={{display:"flex",gap:7,marginBottom:4,padding:"6px 8px",background:"#070b12",borderRadius:5,border:"1px solid #111827"}}>
                          <span style={{fontSize:10,color:outcomeColor(log.outcome),flexShrink:0}}>◉</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:log.note?2:0}}>
                              <span style={{fontSize:10,color:outcomeColor(log.outcome),fontWeight:500}}>{outcomeLabel(log.outcome)}</span>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                {log.followup&&<span style={{fontSize:9,color:"#818cf8"}}>↻ {log.followup}</span>}
                                <span style={{fontSize:9,color:"#3a4870"}}>{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{fontSize:9,color:"#4a5880"}}>{log.type}{log.note&&` · ${log.note}`}</div>
                          </div>
                        </div>
                      ))}
                      {logs.length>3&&<div style={{fontSize:10,color:"#3a4870",textAlign:"center",paddingTop:2}}>+{logs.length-3} more</div>}
                    </div>
                  )}
                  {logs.length===0&&<div style={{fontSize:11,color:"#2a3450",fontStyle:"italic"}}>Not yet contacted</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ HISTORY ══════════════════════════════════════════════════════════ */}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:9,color:"#3a4870",letterSpacing:2,textTransform:"uppercase"}}>{history.length} runs</span>
              <button className="bd" onClick={()=>setHistory([])} disabled={!history.length}>✕ Clear</button>
            </div>
            {history.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#3a4870"}}>
                <div style={{fontSize:40,marginBottom:10}}>◎</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO HISTORY YET</div>
              </div>
            ):history.map((h,i)=>(
              <div key={i} style={{...card,marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,fontWeight:500}}>{h.loc||"UK"} · {h.bType==="any"?"All types":h.bType}</div>
                  <span className="tg">{h.count} leads</span>
                </div>
                <div style={{display:"flex",gap:12,fontSize:10,color:"#4a5880"}}>
                  <span>📅 {new Date(h.date).toLocaleDateString()}</span>
                  <span style={{color:h.mode==="Scheduled"?"#22c55e":"#38bdf8"}}>{h.mode}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
