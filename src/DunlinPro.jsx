import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import Onboarding from "./Onboarding";

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
const DISPOSABLE = new Set(["mailinator.com","guerrillamail.com","tempmail.com","throwaway.email","yopmail.com","trashmail.com","trashmail.me","dispostable.com","maildrop.cc","discard.email","fakeinbox.com","mailnesia.com"]);
const ROLE_PREFIXES = new Set(["admin","info","contact","support","sales","hello","help","no-reply","noreply","mail","email","office","team","enquiries","enquiry","webmaster","postmaster","billing","accounts","marketing","hr","legal","ops"]);
function validSyntax(e){return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(e);}
async function checkMX(domain){try{const r=await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,{headers:{Accept:"application/json"}});if(!r.ok)return null;const d=await r.json();if(d.Status===3)return false;return(d.Answer||[]).filter(r=>r.type===15).length>0;}catch{return null;}}
async function verifyEmail(email){if(!email||email==="unknown")return{status:"unknown",score:0,detail:"No email"};email=email.trim().toLowerCase();if(!validSyntax(email))return{status:"invalid",score:0,detail:"Invalid format"};const[local,domain]=email.split("@");if(DISPOSABLE.has(domain))return{status:"invalid",score:10,detail:"Disposable domain"};const isRole=ROLE_PREFIXES.has(local);const mx=await checkMX(domain);if(mx===false)return{status:"invalid",score:15,detail:"No mail server for domain"};let score=50;if(mx===true)score+=25;if(!isRole)score+=10;if(/^[a-z]+\.[a-z]+$/.test(local))score+=15;else if(/^[a-z]\.[a-z]+$/.test(local))score+=10;if(domain.endsWith(".co.uk")||domain.endsWith(".com"))score+=5;if(/\d/.test(local))score-=5;score=Math.max(0,Math.min(100,score));const status=score>=75?"valid":score>=50?"risky":"invalid";const detail=mx===null?`Pattern looks ${status} — DNS inconclusive`:isRole?`Role address — mail server confirmed`:`Mail server confirmed for ${domain}`;return{status,score,detail,isRole,hasMX:mx};}

// ─── COMPANIES HOUSE ─────────────────────────────────────────────────────────
const CH_KEY = import.meta.env.VITE_CH_API_KEY;
const chAuth = () => "Basic " + btoa(CH_KEY + ":");

async function lookupCompany(companyName) {
  try {
    const searchRes = await fetch(
      "https://api.company-information.service.gov.uk/search/companies?q=" + encodeURIComponent(companyName) + "&items_per_page=1",
      { headers: { Authorization: chAuth() } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const company = searchData.items?.[0];
    if (!company) return null;

    // Get officers (directors)
    const officersRes = await fetch(
      "https://api.company-information.service.gov.uk/company/" + company.company_number + "/officers?items_per_page=10",
      { headers: { Authorization: chAuth() } }
    );
    const officersData = officersRes.ok ? await officersRes.json() : null;
    const directors = (officersData?.items || [])
      .filter(o => o.officer_role === "director" && !o.resigned_on)
      .map(o => ({
        name: o.name,
        appointed: o.appointed_on,
        role: "Director"
      }));

    return {
      name: company.title,
      number: company.company_number,
      status: company.company_status,
      type: company.company_type,
      incorporated: company.date_of_creation,
      address: company.registered_office_address
        ? [company.registered_office_address.address_line_1, company.registered_office_address.locality, company.registered_office_address.postal_code].filter(Boolean).join(", ")
        : null,
      directors,
    };
  } catch (e) {
    return null;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const MONTHS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
function parseExpiry(str){if(!str||str==="unknown")return null;const d=new Date(`1 ${str}`);return isNaN(d.getTime())?null:d;}
function daysBetween(a,b){return Math.round((b-a)/(1000*60*60*24));}
function urgency(days){if(days<0)return{label:"Overdue",color:"#ef4444",bg:"#1a0808",border:"#3a1515"};if(days<=30)return{label:"This month",color:"#ef4444",bg:"#1a0808",border:"#3a1515"};if(days<=60)return{label:"60 days",color:"#f59e0b",bg:"#1a1000",border:"#3a2800"};if(days<=90)return{label:"90 days",color:"#fbbf24",bg:"#141000",border:"#2a2000"};if(days<=180)return{label:"6 months",color:"#3AADA0",bg:"#D6F0EE",border:"rgba(26,74,74,0.08)"};return{label:"6m+",color:"#7A9696",bg:"#fff",border:"rgba(26,74,74,0.12)"};}
const newId=()=>Date.now()+Math.floor(Math.random()*1000);

const PIPELINE_STAGES=[
  {id:"new",      label:"New",       color:"#7A9696"},
  {id:"contacted",label:"Contacted", color:"#3AADA0"},
  {id:"interested",label:"Interested",color:"#2A7A72"},
  {id:"converted",label:"Converted", color:"#1A4A4A"},
];



const BLANK_LEAD={name:"",title:"",phone:"",email:"",company:"",building:"",location:"",tenure:"",contract_expiry:"",source:"Manual",confidence:"medium"};

export default function App({ session }){
  const userId = session?.user?.id;
  const [tab,setTab]=useState("search");
  const [loc,setLoc]=useState("");
  const [bType,setBType]=useState("any");
  const [leads,setLeads]=useState([]);
  const [emailChecks,setEmailChecks]=useState({});
  const [verifying,setVerifying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [dbLoading,setDbLoading]=useState(true);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [error,setError]=useState(null);
  const [schedule,setSchedule]=useState({enabled:false,frequency:"daily",time:"08:00"});
  const [history,setHistory]=useState([]);
  const [expanded,setExpanded]=useState(null);
  // Pipeline
  const [pipeline,setPipeline]=useState({});
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
  const [chData,setChData]=useState({});
  const [chLoading,setChLoading]=useState({});

  // ── Load data from Supabase on mount ──────────────────────────────────────
  useEffect(()=>{
    if(!userId){setDbLoading(false);return;}
    (async()=>{
      const {data:leadsData}=await supabase.from("leads").select("*").eq("user_id",userId).order("created_at",{ascending:false});
      if(leadsData&&leadsData.length){
        setLeads(leadsData.map(l=>({...l,found:l.found_at})));
      }
      const {data:pipelineData}=await supabase.from("pipeline").select("*").eq("user_id",userId);
      if(pipelineData&&pipelineData.length){
        const map={};
        pipelineData.forEach(p=>{map[p.lead_id]=p.stage;});
        setPipeline(map);
      }
      const {data:outreachData}=await supabase.from("outreach").select("*").eq("user_id",userId).order("logged_at",{ascending:false});
      if(outreachData&&outreachData.length){
        const map={};
        outreachData.forEach(o=>{
          if(!map[o.lead_id])map[o.lead_id]=[];
          map[o.lead_id].push({...o,date:o.logged_at,followup:o.followup||""});
        });
        setOutreach(map);
      }
      // Show onboarding for first-time users (no leads yet)
      const isFirstTime = !leadsData || leadsData.length === 0;
      if(isFirstTime){
        const seen = localStorage.getItem("dunlin_onboarded_"+userId);
        if(!seen) setShowOnboarding(true);
      }
      setDbLoading(false);
    })();
  },[userId]);

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
    const controller=new AbortController();abortRef.current=controller;
    const timer=setTimeout(()=>controller.abort(),30000);
    try{
      const od=bType==="any"?"serviced, flexible, co-working, and managed offices":`${bType} offices`;
      const prompt=`UK B2B lead database. Generate 10 realistic office contacts for companies in ${od} in ${loc}, UK. Use real buildings (Regus,WeWork,Bruntwood,IWG,BE Offices,Orega,Landmark,TOG,Spaces). Real names, UK phones, realistic emails, actual buildings. Estimate tenure and contract_expiry (month+year e.g. "March 2026"). Return ONLY JSON no markdown: {"results":[{"name":"","title":"","phone":"+44...","email":"","company":"","building":"","location":"${loc}","tenure":"","contract_expiry":"e.g. March 2026","source":"","confidence":"high"}]}`;
      const res=await fetch("/.netlify/functions/search",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({prompt})});
      clearTimeout(timer);
      if(!res.ok) throw new Error("API error "+res.status);
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
      // Enrich with Companies House in background
      deduped.forEach(async(lead)=>{
        const ch=await lookupCompany(lead.company);
        if(ch) setLeads(p=>p.map(l=>l.id===lead.id?{...l,...ch}:l));
      });
      setHistory(p=>[{loc,bType,count:deduped.length,date:new Date().toISOString(),mode:"Live"},...p].slice(0,20));
      setTab("results");
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
      else if(e.message&&e.message.includes("fetch")) setError("Live search requires the API key. Enable Demo mode to search with sample data, or contact support.");
      else setError(e.message);
    }finally{clearTimeout(timer);setLoading(false);}
  };

  // ── Manual add ──────────────────────────────────────────────────────────────
  const lookupCH=async(lead)=>{
    if(!lead.company||chData[lead.id])return;
    setChLoading(p=>({...p,[lead.id]:true}));
    const result=await lookupCompany(lead.company);
    setChData(p=>({...p,[lead.id]:result||"not_found"}));
    setChLoading(p=>({...p,[lead.id]:false}));
  };

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
  const logOutreach=async(id)=>{
    const entry={...newLog,date:new Date().toISOString()};
    setOutreach(p=>({...p,[id]:[entry,...(p[id]||[])]}));
    let newStage=null;
    if(!pipeline[id]||pipeline[id]==="new") newStage="contacted";
    if(newLog.outcome==="converted") newStage="converted";
    if(newLog.outcome==="interested") newStage="interested";
    if(newStage) setPipeline(p=>({...p,[id]:newStage}));
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
  const outcomeColor=(o)=>({no_reply:"#7A9696",interested:"#22c55e",not_now:"#f59e0b",converted:"#2A7A72",do_not_call:"#ef4444"}[o]||"#7A9696");

  // ── Pipeline ─────────────────────────────────────────────────────────────────
  const getStage=(id)=>pipeline[id]||"new";
  const moveStage=async(id,stage)=>{
    setPipeline(p=>({...p,[id]:stage}));
    if(userId){
      await supabase.from("pipeline").upsert({user_id:userId,lead_id:id,stage,updated_at:new Date().toISOString()},{onConflict:"user_id,lead_id"});
    }
  };

  const completeOnboarding = () => {
    if(userId) localStorage.setItem("dunlin_onboarded_"+userId, "1");
    setShowOnboarding(false);
  };

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
  const inp={width:"100%",background:"#fff",border:"1px solid rgba(26,74,74,0.15)",color:"#1C2B2B",padding:"11px 13px",fontFamily:"'DM Sans',sans-serif",fontSize:14,borderRadius:8,outline:"none",WebkitAppearance:"none",transition:"border-color .2s"};
  const card={background:"#fff",border:"1px solid rgba(26,74,74,0.1)",borderRadius:10,padding:14,boxShadow:"0 1px 4px rgba(26,74,74,0.06)"};
  const notice=w=>({background:w?"rgba(245,158,11,0.06)":"rgba(58,173,160,0.06)",border:"1px solid "+(w?"rgba(245,158,11,0.25)":"rgba(58,173,160,0.25)"),borderLeft:"3px solid "+(w?"#f59e0b":"#3AADA0"),padding:"11px 13px",borderRadius:8,color:w?"#92400E":"#2A7A72",fontSize:13,lineHeight:1.7,marginBottom:12});

  const confBadge=(r)=>{const ec=emailChecks[r.id];let label=r.confidence?.toUpperCase()||"—",bg,col;if(ec){if(ec.status==="invalid"){bg="rgba(239,68,68,0.08)";col="#ef4444";label="BAD EMAIL";}else if(ec.status==="valid"&&r.confidence==="high"){bg="rgba(34,197,94,0.08)";col="#16a34a";label="VERIFIED";}else if(ec.status==="risky"){bg="rgba(245,158,11,0.08)";col="#d97706";label="RISKY EMAIL";}else{const m={high:["rgba(34,197,94,0.08)","#16a34a"],medium:["rgba(245,158,11,0.08)","#d97706"],low:["rgba(239,68,68,0.08)","#ef4444"]};[bg,col]=m[r.confidence]||m.low;}}else{const m={high:["rgba(34,197,94,0.08)","#16a34a"],medium:["rgba(245,158,11,0.08)","#d97706"],low:["rgba(239,68,68,0.08)","#ef4444"]};[bg,col]=m[r.confidence]||m.low;}return<span style={{background:bg,color:col,border:`1px solid ${col}40`,padding:"2px 5px",borderRadius:3,fontSize:9,fontFamily:"'DM Sans',sans-serif",letterSpacing:1,whiteSpace:"nowrap"}}>{label}</span>;};
  const emailDot=(id)=>{const ec=emailChecks[id];if(!ec)return<span style={{width:7,height:7,borderRadius:4,background:"rgba(26,74,74,0.15)",display:"inline-block",marginRight:5,flexShrink:0}}/>;const col=ec.status==="valid"?"#22c55e":ec.status==="risky"?"#f59e0b":"#ef4444";return<span style={{width:7,height:7,borderRadius:4,background:col,display:"inline-block",marginRight:5,flexShrink:0,boxShadow:`0 0 4px ${col}88`}}/>;};

  const navTabs=[
    {id:"search",   l:"Search",  i:"⌖"},
    {id:"results",  l:"Leads",   i:"◈", b:leads.length},
    {id:"pipeline", l:"Pipeline",i:"⬦", b:leads.filter(l=>getStage(l.id)==="interested").length||undefined},
    {id:"calendar", l:"Renewal", i:"📅",dot:calStats.d30>0||calStats.overdue>0},
    {id:"outreach", l:"Outreach",i:"✉", b:followupsDueToday.length||undefined},
    {id:"history",  l:"History", i:"◎", b:history.length||undefined},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#F5F0E8",color:"#1C2B2B",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#F5F0E8}::-webkit-scrollbar-thumb{background:rgba(26,74,74,0.2);border-radius:2px}
        input,select,textarea{outline:none;-webkit-appearance:none;font-family:'DM Sans',sans-serif}
        input::placeholder,textarea::placeholder{color:#7A9696}
        .nb{flex:1;background:none;border:none;cursor:pointer;padding:10px 2px;color:#3D5252;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;border-bottom:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:3px;transition:color .15s;min-width:0}
        .nb:hover{color:#1A4A4A}.nb.act{color:#1A4A4A;border-bottom-color:#3AADA0;background:rgba(58,173,160,0.06)}
        .bp{background:#3AADA0;color:#fff;border:none;padding:13px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px;width:100%;transition:background .2s}.bp:hover{background:#2A7A72}
        .bs{background:#1A4A4A;color:#fff;border:none;padding:9px 16px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;border-radius:6px;transition:background .2s}.bs:hover{background:#2A7A72}
        .bg{background:none;border:1px solid rgba(26,74,74,0.2);color:#7A9696;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border-radius:6px;transition:all .15s}.bg:hover{border-color:#3AADA0;color:#3AADA0}.bg:disabled{opacity:.3;cursor:not-allowed}
        .bd{background:none;border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border-radius:6px}.bd:hover{background:rgba(239,68,68,0.06)}.bd:disabled{opacity:.3;cursor:not-allowed}
        .bx{background:rgba(58,173,160,0.08);border:1px solid rgba(58,173,160,0.25);color:#2A7A72;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border-radius:6px}.bx:hover{background:rgba(58,173,160,0.15)}
        .rcard{background:#fff;border:1px solid rgba(26,74,74,0.1);border-radius:10px;padding:14px;margin-bottom:9px;cursor:pointer;transition:box-shadow .15s,border-color .15s}.rcard:hover{box-shadow:0 4px 16px rgba(26,74,74,0.08)}.rcard:active{border-color:#3AADA0}.rcard.inv{border-color:rgba(239,68,68,0.2);opacity:.8}
        .sw{position:relative;width:40px;height:22px;background:rgba(26,74,74,0.15);border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0}.sw.on{background:#3AADA0}.sk{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:8px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,0.15)}.sw.on .sk{left:21px}
        .fb{background:none;border:1px solid rgba(26,74,74,0.15);color:#7A9696;padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border-radius:20px;transition:all .15s}.fb:hover{border-color:#3AADA0;color:#3AADA0}.fb.act{background:#3AADA0;color:#fff;border-color:#3AADA0}
        .pipe-col{background:#EDE8DF;border:1px solid rgba(26,74,74,0.1);border-radius:10px;padding:10px;min-height:200px;transition:border-color .2s}.pipe-col.dragover{border-color:#3AADA0;background:#D6F0EE}
        .pipe-card{background:#fff;border:1px solid rgba(26,74,74,0.1);border-radius:7px;padding:10px;margin-bottom:7px;cursor:grab;transition:all .15s;user-select:none;box-shadow:0 1px 4px rgba(26,74,74,0.06)}.pipe-card:active{cursor:grabbing;opacity:.7}
        .tg{display:inline-block;background:rgba(58,173,160,0.1);border:1px solid rgba(58,173,160,0.25);color:#2A7A72;padding:2px 8px;border-radius:4px;font-size:11px}
        .lbl{font-size:11px;letter-spacing:1px;color:#7A9696;margin-bottom:6px;text-transform:uppercase;display:block;font-family:'DM Sans',sans-serif}
        .fg{margin-bottom:14px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.6s ease-in-out infinite}
        .ocard{background:#fff;border:1px solid rgba(26,74,74,0.1);border-radius:10px;padding:14px;margin-bottom:9px}
        h2,h3{font-family:'Cormorant Garamond',serif;font-weight:300}
      `}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid rgba(26,74,74,0.1)",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1A4A4A",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width="26" height="19" viewBox="0 0 56 40" fill="none">
            <ellipse cx="28" cy="23" rx="15" ry="9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="14" r="6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M44 12 L52 9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="23" y1="32" x2="21" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="31" y1="32" x2="29" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:20,color:"#F5F0E8",letterSpacing:1}}>dunlin</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {verifying&&<span style={{fontSize:11,color:"#7DD4CC",fontFamily:"'DM Sans',sans-serif"}} className="pulse">Verifying emails...</span>}
          {!verifying&&leads.length>0&&<span style={{fontSize:11,color:"#7DD4CC",fontFamily:"'DM Sans',sans-serif"}}>✓ {verifiedCount} verified</span>}
          <div style={{width:1,height:14,background:"rgba(255,255,255,0.15)"}}/>
          <button onClick={()=>setShowOnboarding(true)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Tour</button>
          <button onClick={()=>supabase.auth.signOut()} style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",padding:"5px 12px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
        </div>
      </div>

      {/* Follow-up due today banner */}
      {followupsDueToday.length>0&&(
        <div style={{background:"rgba(58,173,160,0.06)",borderBottom:"1px solid rgba(58,173,160,0.3)",padding:"8px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#2A7A72",letterSpacing:0,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>◉ Follow-ups due today</span>
          {followupsDueToday.map(({lead},i)=>(
            <span key={i} style={{fontSize:12,color:"#1A4A4A",cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{setTab("outreach");setOutreachForm(lead.id);}}>{lead.name}</span>
          ))}
        </div>
      )}

      {/* Nav */}
      <div style={{borderBottom:"1px solid rgba(26,74,74,0.12)",display:"flex",background:"#EDE8DF",position:"sticky",top:followupsDueToday.length>0?81:49,zIndex:9,overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} className={`nb ${tab===n.id?"act":""}`} onClick={()=>setTab(n.id)} style={{padding:"7px 4px",minWidth:50}}>
            <span style={{fontSize:16}}>{n.i}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>{n.l}</span>
            {n.b>0&&<span style={{background:"#3AADA0",color:"#fff",fontSize:9,padding:"1px 6px",borderRadius:10,fontWeight:500}}>{n.b}</span>}
            {n.dot&&!n.b&&<span style={{width:5,height:5,borderRadius:3,background:"#ef4444",display:"inline-block"}} className="pulse"/>}
          </button>
        ))}
      </div>

      <div style={{padding:"16px 14px",maxWidth:700,margin:"0 auto"}}>

        {/* ══ SEARCH ══════════════════════════════════════════════════════════ */}
        {tab==="search"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
              {[["Leads",leads.length,"◈"],["Last Run",history[0]?new Date(history[0].date).toLocaleDateString():"Never","◎"],["Follow-ups",followupsDueToday.length,"◉"]].map(([l,v,i])=>(
                <div style={card} key={l}>
                  <div style={{fontSize:16,color:"#3AADA0",marginBottom:3}}>{i}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:22,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#7A9696",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{...card,marginBottom:12}}>
              <div className="fg">
                <label className="lbl">Location <span style={{color:"#3AADA0"}}>*</span></label>
                <input style={{...inp,border:error&&!loc?"1px solid #ef4444":"1px solid rgba(26,74,74,0.12)"}} placeholder="e.g. Manchester, Leeds, London EC2..." value={loc} onChange={e=>{setLoc(e.target.value);setError(null);}} onKeyDown={e=>e.key==="Enter"&&!loading&&run()}/>
              </div>
              <div className="fg">
                <label className="lbl">Office Type <span style={{color:"#7A9696",fontWeight:400,fontSize:9}}>(optional)</span></label>
                <select style={{...inp,cursor:"pointer"}} value={bType} onChange={e=>setBType(e.target.value)}>
                  <option value="any">Any office type</option><option value="serviced">Serviced Offices</option><option value="flexible">Flexible / Co-working</option><option value="managed">Managed Offices</option>
                </select>
              </div>
              {loading?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:28,marginBottom:8}} className="pulse">⌖</div>
                  <div style={{color:"#3AADA0",fontSize:11,letterSpacing:2,marginBottom:10}}>FINDING CONTACTS</div>
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
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13}}>Add contact manually</div>
                  {!showAddForm&&<div style={{fontSize:11,color:"#7A9696",marginTop:2}}>From LinkedIn, a card, or a referral</div>}
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
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13}}>Import from CSV</div>
                  <div style={{fontSize:11,color:"#7A9696",marginTop:2}}>Paste in an existing spreadsheet</div>
                </div>
                <button className="bg" onClick={()=>csvRef.current?.click()}>↑ Import</button>
              </div>
              <input ref={csvRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleCSV}/>
              <div style={{fontSize:10,color:"rgba(26,74,74,0.1)",marginTop:8,lineHeight:1.6}}>Accepts columns: Name, Title, Company, Email, Phone, Building, Location, Contract Due. Duplicates removed automatically.</div>
            </div>
          </div>
        )}

        {/* ══ RESULTS ═════════════════════════════════════════════════════════ */}
        {tab==="results"&&(
          <div>
            {leads.length>0&&Object.keys(emailChecks).length>0&&(
              <div style={{background:"#080c14",border:"1px solid #1a2535",borderRadius:8,padding:"8px 13px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#7A9696",letterSpacing:2,textTransform:"uppercase"}}>Email</span>
                {[["✓",Object.values(emailChecks).filter(e=>e.status==="valid").length,"#22c55e"],["⚠",Object.values(emailChecks).filter(e=>e.status==="risky").length,"#f59e0b"],["✗",Object.values(emailChecks).filter(e=>e.status==="invalid").length,"#ef4444"]].map(([ic,v,c])=>(<span key={ic} style={{fontSize:11,color:c}}>{ic} {v}</span>))}
                {verifying&&<span style={{fontSize:10,color:"#3AADA0",marginLeft:"auto"}} className="pulse">checking...</span>}
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
              <div style={{textAlign:"center",padding:"50px 20px",color:"#7A9696"}}>
                <div style={{fontSize:40,marginBottom:10}}>◈</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO LEADS YET</div>
                <div style={{fontSize:11,marginTop:6,color:"#D6F0EE"}}>Search, add manually, or import a CSV</div>
              </div>
            ):leads.map(r=>{
              const ec=emailChecks[r.id];const stage=getStage(r.id);const stageInfo=PIPELINE_STAGES.find(s=>s.id===stage);const lc=lastContact(r.id);
              return(
                <div key={r.id} className={`rcard ${ec?.status==="invalid"?"inv":""}`} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name||"—"}</div>
                      <div style={{fontSize:10,color:"#7A9696",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[r.title,r.company].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,marginLeft:8}}>
                      <span style={{fontSize:9,color:stageInfo?.color,border:`1px solid ${stageInfo?.color}40`,padding:"2px 5px",borderRadius:3,fontFamily:"'DM Sans',sans-serif",letterSpacing:1}}>{stage.toUpperCase()}</span>
                      {confBadge(r)}
                      <span style={{color:"#7A9696",fontSize:10}}>{expanded===r.id?"▲":"▼"}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#3D5252",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {[r.building,r.location].filter(v=>v&&v!=="unknown").join(" — ")||"—"}</div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&(
                    <div style={{background:"#0d1f0a",border:"1px solid #1e4a1a",borderRadius:5,padding:"5px 9px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:9,color:"#4a7a40",letterSpacing:1,textTransform:"uppercase"}}>Contract due</span>
                      <span style={{fontSize:11,color:"#16a34a",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{r.contract_expiry}</span>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    <div style={{fontSize:10,display:"flex",alignItems:"center",overflow:"hidden"}}>{emailDot(r.id)}<span style={{color:ec?.status==="valid"?"#22c55e":ec?.status==="invalid"?"#ef4444":"#7A9696",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email||"—"}</span></div>
                    <div style={{fontSize:10,color:"#7A9696",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📞 {r.phone||"—"}</div>
                  </div>
                  {lc&&<div style={{marginTop:6,fontSize:10,color:outcomeColor(lc.outcome),display:"flex",alignItems:"center",gap:4}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}{lc.followup&&<span style={{color:"#2A7A72",marginLeft:6}}>↻ {lc.followup}</span>}</div>}
                  {expanded===r.id&&(
                    <div style={{marginTop:11,paddingTop:11,borderTop:"1px solid rgba(26,74,74,0.12)"}}>
                      {/* Pipeline stage selector */}
                      <div style={{marginBottom:11}}>
                        <label className="lbl">Pipeline Stage</label>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {PIPELINE_STAGES.map(s=>(
                            <button key={s.id} onClick={e=>{e.stopPropagation();moveStage(r.id,s.id);}} style={{background:stage===s.id?s.color+"22":"transparent",border:`1px solid ${stage===s.id?s.color:"rgba(26,74,74,0.12)"}`,color:stage===s.id?s.color:"#7A9696",padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:1,transition:"all .15s"}}>{s.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
                        {[["Company",r.company],["Building",r.building],["Location",r.location],["Tenure",r.tenure],["Contract Due",r.contract_expiry],["Source",r.source],["CH Number",r.ch_number],["Incorporated",r.ch_incorporated],["CH Status",r.ch_status],["Reg. Address",r.ch_address]].map(([l,v])=>(
                          v ? <div key={l}><div style={{fontSize:9,letterSpacing:2,color:"#7A9696",textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{fontSize:11,wordBreak:"break-word",color:v&&v!=="unknown"?"#1C2B2B":"#2a3a4a"}}>{v&&v!=="unknown"?v:"—"}</div></div> : null
                        ))}
                      </div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#3AADA0",fontSize:11,textDecoration:"none",background:"rgba(58,173,160,0.08)",border:"1px solid rgba(58,173,160,0.2)",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>✉ Email</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#16a34a",fontSize:11,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>📞 Call</a>}
                        {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#16a34a",fontSize:11,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>💬 WhatsApp</a>}
                        <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(r.name+" "+r.company)}`} target="_blank" rel="noreferrer" style={{color:"#3AADA0",fontSize:11,textDecoration:"none",background:"#D6F0EE",border:"1px solid rgba(26,74,74,0.08)",padding:"6px 11px",borderRadius:5}} onClick={e=>e.stopPropagation()}>🔗 LinkedIn</a>
                        <button onClick={e=>{e.stopPropagation();setOutreachForm(r.id);setTab("outreach");}} style={{background:"rgba(58,173,160,0.05)",border:"1px solid rgba(58,173,160,0.2)",color:"#2A7A72",fontSize:11,padding:"6px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>◉ Log</button>
                      {!chData[r.id]&&<button onClick={e=>{e.stopPropagation();lookupCH(r);}} disabled={chLoading[r.id]} style={{background:"#0a1a0a",border:"1px solid #1a4a1a",color:"#16a34a",fontSize:11,padding:"6px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{chLoading[r.id]?"Checking...":"🏛 Companies House"}</button>}
                      </div>
                    {chData[r.id]&&chData[r.id]!=="not_found"&&(
                      <div style={{marginTop:10,background:"#0a1a0a",border:"1px solid #1a4a1a",borderRadius:7,padding:"10px 12px"}}>
                        <div style={{fontSize:9,color:"#16a34a",letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Companies House Data</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                          {[["Registered name",chData[r.id].name],["Company no.",chData[r.id].number],["Status",chData[r.id].status],["Incorporated",chData[r.id].incorporated],["Address",chData[r.id].address]].map(([l,v])=>v?(
                            <div key={l}><div style={{fontSize:9,color:"#7A9696",letterSpacing:1,textTransform:"uppercase",marginBottom:1}}>{l}</div><div style={{fontSize:11,color:"#16a34a"}}>{v}</div></div>
                          ):null)}
                        </div>
                        {chData[r.id].directors&&chData[r.id].directors.length>0&&(
                          <div>
                            <div style={{fontSize:9,color:"#7A9696",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Active directors</div>
                            {chData[r.id].directors.map((d,i)=>(
                              <div key={i} style={{fontSize:11,color:"#1C2B2B",padding:"3px 0",borderBottom:"1px solid rgba(26,74,74,0.1)"}}>{d.name}{d.appointed&&<span style={{color:"#7A9696",marginLeft:8,fontSize:10}}>apptd {d.appointed}</span>}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {chData[r.id]==="not_found"&&<div style={{marginTop:8,fontSize:11,color:"#7A9696",fontStyle:"italic"}}>No match found on Companies House.</div>}
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
            <div style={{fontSize:11,color:"#7A9696",letterSpacing:0,textTransform:"none",marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>Drag leads between stages</div>
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
                          <div style={{fontSize:10,color:"#7A9696",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div>
                          {l.contract_expiry&&l.contract_expiry!=="unknown"&&<div style={{fontSize:9,color:u.color,marginTop:4}}>📅 {l.contract_expiry}</div>}
                          {lastContact(l.id)&&<div style={{fontSize:9,color:outcomeColor(lastContact(l.id).outcome),marginTop:3}}>◉ {outcomeLabel(lastContact(l.id).outcome)}</div>}
                        </div>
                      );
                    })}
                    {stageLeads.length===0&&<div style={{fontSize:10,color:"#D6F0EE",textAlign:"center",padding:"16px 0",fontStyle:"italic"}}>Drop here</div>}
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
                <div key={l} onClick={()=>setCalFilter(calFilter===f?"all":f)} style={{...card,cursor:"pointer",borderColor:calFilter===f?c:"rgba(26,74,74,0.12)",transition:"border-color .2s"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:700,color:c,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"#7A9696",letterSpacing:1,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:7,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:5}}>
                {["timeline","list"].map(v=>(
                  <button key={v} className={`fb ${calView===v?"act":""}`} onClick={()=>setCalView(v)} style={calView===v?{background:"#3AADA0"}:{}}>{v==="timeline"?"⟶ Timeline":"☰ List"}</button>
                ))}
              </div>
              <input style={{flex:1,minWidth:100,...inp,padding:"7px 11px",fontSize:12}} placeholder="Search..." value={calSearch} onChange={e=>setCalSearch(e.target.value)}/>
            </div>
            {expiredLeads.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"7px 11px",background:"#fff",border:"1px solid rgba(26,74,74,0.12)",borderRadius:7}}>
                <div className={`sw ${showExpired?"on":""}`} style={{background:showExpired?"#7A9696":"rgba(26,74,74,0.12)"}} onClick={()=>setShowExpired(!showExpired)}><div className="sk"/></div>
                <span style={{fontSize:11,color:"#7A9696"}}>Show {expiredLeads.length} expired contract{expiredLeads.length!==1?"s":""}</span>
                {showExpired&&<span style={{fontSize:10,color:"#3a4460",marginLeft:"auto"}}>Windows already passed</span>}
              </div>
            )}
            {calView==="timeline"&&(
              byMonth.length===0
                ? <div style={{textAlign:"center",padding:"40px 0",color:"#7A9696"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div style={{fontSize:11,letterSpacing:2}}>NO UPCOMING CONTRACTS</div></div>
                : byMonth.map(group=>(
                  <div key={`${group.year}-${group.month}`} style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13}}>{MONTHS_FULL[group.month]} {group.year}</div>
                      <div style={{flex:1,height:1,background:"rgba(26,74,74,0.12)"}}/>
                      <span style={{fontSize:10,color:"#7A9696"}}>{group.leads.length}</span>
                    </div>
                    {group.leads.map(l=>{
                      const u=urgency(l.days??999);const lc=lastContact(l.id);
                      return(
                        <div key={l.id} onClick={()=>setCalSel(calSel===l.id?null:l.id)} style={{background:calSel===l.id?"#f0f9f8":u.bg,border:`1px solid ${calSel===l.id?u.color:u.border}`,borderLeft:`3px solid ${u.color}`,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                            <div style={{minWidth:0,flex:1}}>
                              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                              <div style={{fontSize:10,color:"#7A9696",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title} · {l.company}</div>
                            </div>
                            <div style={{flexShrink:0,marginLeft:10,textAlign:"right"}}>
                              <div style={{fontSize:11,color:u.color,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{l.days===null?"—":l.days<0?`${Math.abs(l.days)}d ago`:l.days===0?"Today":`${l.days}d`}</div>
                              <div style={{fontSize:9,color:u.color,opacity:.7}}>{u.label}</div>
                            </div>
                          </div>
                          <div style={{fontSize:10,color:"#3D5252",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {l.building} — {l.location}</div>
                          {lc&&<div style={{marginTop:4,fontSize:9,color:outcomeColor(lc.outcome)}}>◉ {outcomeLabel(lc.outcome)} · {new Date(lc.date).toLocaleDateString()}</div>}
                          {calSel===l.id&&(
                            <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid rgba(26,74,74,0.12)",display:"flex",gap:7,flexWrap:"wrap"}}>
                              {l.email&&l.email!=="unknown"&&<a href={`mailto:${l.email}`} onClick={e=>e.stopPropagation()} style={{color:"#3AADA0",fontSize:11,textDecoration:"none",background:"rgba(58,173,160,0.08)",border:"1px solid rgba(58,173,160,0.2)",padding:"5px 11px",borderRadius:5}}>✉ Email</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`tel:${l.phone}`} onClick={e=>e.stopPropagation()} style={{color:"#16a34a",fontSize:11,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"5px 11px",borderRadius:5}}>📞 Call</a>}
                              {l.phone&&l.phone!=="unknown"&&<a href={`https://wa.me/${l.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#16a34a",fontSize:11,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"5px 11px",borderRadius:5}}>💬 WA</a>}
                              <button onClick={e=>{e.stopPropagation();setOutreachForm(l.id);setTab("outreach");}} style={{background:"rgba(58,173,160,0.05)",border:"1px solid rgba(58,173,160,0.2)",color:"#2A7A72",fontSize:11,padding:"5px 11px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>◉ Log</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
            )}
            {calView==="list"&&(
              <div style={{background:"#fff",border:"1px solid rgba(26,74,74,0.12)",borderRadius:10,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"7px 12px",borderBottom:"1px solid rgba(26,74,74,0.12)",background:"#EDE8DF",gap:8}}>
                  {["Contact","Company","Due"].map(h=><div key={h} style={{fontSize:9,letterSpacing:2,color:"#7A9696",textTransform:"uppercase"}}>{h}</div>)}
                </div>
                {calFiltered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#7A9696",fontSize:11,letterSpacing:2}}>NO CONTRACTS MATCH</div>}
                {calFiltered.map(l=>{const u=urgency(l.days??999);return(
                  <div key={l.id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",padding:"10px 12px",borderBottom:"1px solid rgba(26,74,74,0.1)",gap:8,cursor:"pointer",background:calSel===l.id?"#f0f9f8":"transparent"}} onClick={()=>setCalSel(calSel===l.id?null:l.id)}>
                    <div style={{minWidth:0}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:10,color:"#7A9696",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div></div>
                    <div style={{minWidth:0}}><div style={{fontSize:11,color:"#3D5252",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div><div style={{fontSize:10,color:"#7A9696",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.building}</div></div>
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
              <div style={{background:"rgba(58,173,160,0.05)",border:"1px solid rgba(58,173,160,0.2)",borderLeft:"3px solid #2A7A72",borderRadius:8,padding:"10px 13px",marginBottom:12}}>
                <div style={{fontSize:9,color:"#2A7A72",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>◉ {followupsDueToday.length} follow-up{followupsDueToday.length!==1?"s":""} due today</div>
                {followupsDueToday.map(({lead},i)=>(
                  <div key={i} style={{fontSize:12,color:"#2A7A72",marginBottom:3,cursor:"pointer"}} onClick={()=>setOutreachForm(lead.id)}>→ {lead.name} · {lead.company}</div>
                ))}
              </div>
            )}
            {outreachForm&&(()=>{
              const lead=leads.find(r=>r.id===outreachForm);if(!lead)return null;
              return(
                <div style={{...card,marginBottom:12,border:"1px solid rgba(58,173,160,0.3)"}}>
                  <div style={{fontSize:9,letterSpacing:2,color:"#2A7A72",textTransform:"uppercase",marginBottom:8}}>Logging contact</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,marginBottom:1}}>{lead.name}</div>
                  <div style={{fontSize:11,color:"#7A9696",marginBottom:12}}>{lead.company}</div>
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
                  <div className="fg"><label className="lbl">Follow-up date <span style={{color:"#7A9696",fontWeight:400,fontSize:9}}>(optional)</span></label>
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
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontSize:10,color:"#7A9696",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title} · {r.company}</div>
                    </div>
                    <button onClick={()=>setOutreachForm(r.id)} style={{background:"rgba(58,173,160,0.05)",border:"1px solid rgba(58,173,160,0.2)",color:"#2A7A72",fontSize:10,padding:"4px 9px",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0,marginLeft:8}}>+ Log</button>
                  </div>
                  {r.contract_expiry&&r.contract_expiry!=="unknown"&&<div style={{fontSize:10,color:u.color,marginBottom:6}}>📅 {r.contract_expiry}</div>}
                  <div style={{display:"flex",gap:6,marginBottom:logs.length?9:0,flexWrap:"wrap"}}>
                    {r.email&&r.email!=="unknown"&&<a href={`mailto:${r.email}`} style={{color:"#3AADA0",fontSize:10,textDecoration:"none",background:"rgba(58,173,160,0.08)",border:"1px solid rgba(58,173,160,0.2)",padding:"4px 10px",borderRadius:5}}>✉</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`tel:${r.phone}`} style={{color:"#16a34a",fontSize:10,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"4px 10px",borderRadius:5}}>📞</a>}
                    {r.phone&&r.phone!=="unknown"&&<a href={`https://wa.me/${r.phone.replace(/\s+/g,"").replace(/^\+/,"")}`} target="_blank" rel="noreferrer" style={{color:"#16a34a",fontSize:10,textDecoration:"none",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",padding:"4px 10px",borderRadius:5}}>💬</a>}
                    <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(r.name+" "+r.company)}`} target="_blank" rel="noreferrer" style={{color:"#3AADA0",fontSize:10,textDecoration:"none",background:"#D6F0EE",border:"1px solid rgba(26,74,74,0.08)",padding:"4px 10px",borderRadius:5}}>🔗</a>
                    {lc&&<span style={{fontSize:10,color:outcomeColor(lc.outcome),padding:"4px 0",marginLeft:2}}>◉ {outcomeLabel(lc.outcome)}</span>}
                  </div>
                  {logs.length>0&&(
                    <div style={{borderTop:"1px solid rgba(26,74,74,0.1)",paddingTop:7}}>
                      <div style={{fontSize:9,letterSpacing:2,color:"#7A9696",textTransform:"uppercase",marginBottom:5}}>History ({logs.length})</div>
                      {logs.slice(0,3).map((log,i)=>(
                        <div key={i} style={{display:"flex",gap:7,marginBottom:4,padding:"6px 8px",background:"#F5F0E8",borderRadius:5,border:"1px solid rgba(26,74,74,0.1)"}}>
                          <span style={{fontSize:10,color:outcomeColor(log.outcome),flexShrink:0}}>◉</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:log.note?2:0}}>
                              <span style={{fontSize:10,color:outcomeColor(log.outcome),fontWeight:500}}>{outcomeLabel(log.outcome)}</span>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                {log.followup&&<span style={{fontSize:9,color:"#2A7A72"}}>↻ {log.followup}</span>}
                                <span style={{fontSize:9,color:"#7A9696"}}>{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{fontSize:9,color:"#7A9696"}}>{log.type}{log.note&&` · ${log.note}`}</div>
                          </div>
                        </div>
                      ))}
                      {logs.length>3&&<div style={{fontSize:10,color:"#7A9696",textAlign:"center",paddingTop:2}}>+{logs.length-3} more</div>}
                    </div>
                  )}
                  {logs.length===0&&<div style={{fontSize:11,color:"#D6F0EE",fontStyle:"italic"}}>Not yet contacted</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ HISTORY ══════════════════════════════════════════════════════════ */}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:9,color:"#7A9696",letterSpacing:2,textTransform:"uppercase"}}>{history.length} runs</span>
              <button className="bd" onClick={()=>setHistory([])} disabled={!history.length}>✕ Clear</button>
            </div>
            {history.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#7A9696"}}>
                <div style={{fontSize:40,marginBottom:10}}>◎</div>
                <div style={{fontSize:11,letterSpacing:2}}>NO HISTORY YET</div>
              </div>
            ):history.map((h,i)=>(
              <div key={i} style={{...card,marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500}}>{h.loc||"UK"} · {h.bType==="any"?"All types":h.bType}</div>
                  <span className="tg">{h.count} leads</span>
                </div>
                <div style={{display:"flex",gap:12,fontSize:10,color:"#7A9696"}}>
                  <span>📅 {new Date(h.date).toLocaleDateString()}</span>
                  <span style={{color:h.mode==="Scheduled"?"#22c55e":"#3AADA0"}}>{h.mode}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      {showOnboarding&&<Onboarding onComplete={completeOnboarding}/>}
    </div>
  );
}
