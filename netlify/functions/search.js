// netlify/functions/search.js
// Dunlin Lease Intelligence — Contact Search
// Replaces the old Claude API hallucination with real Apollo.io data
// + Companies House enrichment for lease expiry estimation

const COMPANIES_HOUSE_KEY = process.env.COMPANIES_HOUSE_API_KEY;

const TARGET_TITLES = [
  "Office Manager","Facilities Manager","Operations Director","Head of Workplace",
  "Head of Facilities","Head of Operations","Workplace Manager","COO",
  "Chief Operating Officer","Operations Manager","Property Manager","Workplace Experience Manager",
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) }; }

  const { query, apolloApiKey, filters = {} } = body;

  if (!query || query.trim().length < 2) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a location to search." }) };
  }
  if (!apolloApiKey || apolloApiKey.trim().length < 10) {
    return { statusCode: 403, body: JSON.stringify({ error: "no_apollo_key", message: "No Apollo API key found. Add your Apollo key in Settings to unlock contact search." }) };
  }

  try {
    const apolloResults = await searchApollo(query.trim(), apolloApiKey.trim(), filters);
    const companies = extractUniqueCompanies(apolloResults);
    const chData = await enrichWithCompaniesHouse(companies);
    const results = formatResults(apolloResults, chData);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results, total: results.length, source: "apollo", queriedAt: new Date().toISOString() }) };
  } catch (err) {
    console.error("Search error:", err);
    if (err.code === "apollo_auth_failed") return { statusCode: 401, body: JSON.stringify({ error: "apollo_auth_failed", message: "Your Apollo API key was rejected. Please check it in Settings and try again." }) };
    if (err.code === "apollo_rate_limit") return { statusCode: 429, body: JSON.stringify({ error: "apollo_rate_limit", message: "Apollo search limit reached. Please wait a moment and try again." }) };
    return { statusCode: 500, body: JSON.stringify({ error: "Search failed. Please try again." }) };
  }
};

async function searchApollo(query, apiKey, filters) {
  const payload = {
    person_titles: TARGET_TITLES,
    person_locations: ["United Kingdom"],
    contact_email_status: ["verified", "likely to engage", "unavailable"],
    q_organization_name: query,
    page: filters.page || 1,
    per_page: filters.perPage || 25,
  };
  if (filters.minEmployees) payload.organization_num_employees_ranges = buildEmployeeRange(filters.minEmployees, filters.maxEmployees);
  const response = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(payload),
  });
  if (response.status === 401 || response.status === 403) { const err = new Error("Apollo authentication failed"); err.code = "apollo_auth_failed"; throw err; }
  if (response.status === 429) { const err = new Error("Apollo rate limit"); err.code = "apollo_rate_limit"; throw err; }
  if (!response.ok) throw new Error(`Apollo API error: ${response.status}`);
  const data = await response.json();
  return data.people || [];
}

async function enrichWithCompaniesHouse(companies) {
  if (!COMPANIES_HOUSE_KEY || companies.length === 0) return {};
  const results = {};
  const chunks = chunkArray(companies, 5);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (companyName) => {
      try { const data = await fetchCompaniesHouse(companyName); if (data) results[companyName] = data; } catch {}
    }));
  }
  return results;
}

async function fetchCompaniesHouse(companyName) {
  const authHeader = "Basic " + Buffer.from(COMPANIES_HOUSE_KEY + ":").toString("base64");
  const searchRes = await fetch(`https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(companyName)}&items_per_page=3`, { headers: { Authorization: authHeader } });
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const topResult = searchData.items?.[0];
  if (!topResult) return null;
  const profileRes = await fetch(`https://api.company-information.service.gov.uk/company/${topResult.company_number}`, { headers: { Authorization: authHeader } });
  if (!profileRes.ok) return { name: topResult.title, number: topResult.company_number };
  const profile = await profileRes.json();
  return { name: profile.company_name, number: profile.company_number, status: profile.company_status, incorporationDate: profile.date_of_creation, registeredAddress: formatAddress(profile.registered_office_address), sicCodes: profile.sic_codes || [], leaseEstimate: estimateLeaseExpiry(profile.date_of_creation) };
}

function estimateLeaseExpiry(incorporationDateStr) {
  if (!incorporationDateStr) return null;
  const incorporated = new Date(incorporationDateStr);
  const now = new Date();
  const ageYears = (now - incorporated) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 1) return null;
  const leaseLengths = [3, 5, 10];
  let bestEstimate = null;
  for (const length of leaseLengths) {
    const cyclesDone = Math.floor(ageYears / length);
    const nextRenewalYear = incorporated.getFullYear() + (cyclesDone + 1) * length;
    const yearsUntilRenewal = nextRenewalYear - now.getFullYear();
    if (yearsUntilRenewal >= -1 && yearsUntilRenewal <= 4) {
      const confidence = yearsUntilRenewal <= 0 ? "overdue" : yearsUntilRenewal <= 1 ? "high" : yearsUntilRenewal <= 2 ? "medium" : "low";
      if (!bestEstimate || confidenceRank(confidence) > confidenceRank(bestEstimate.confidence)) {
        bestEstimate = { estimatedYear: nextRenewalYear, confidence, basis: `Based on ${Math.round(ageYears)}-year-old company · ${length}-year lease cycle`, isEstimate: true };
      }
    }
  }
  return bestEstimate;
}

function confidenceRank(c) { return { overdue: 4, high: 3, medium: 2, low: 1 }[c] || 0; }

function calcSpacePressureScore(leaseEstimate, org, title) {
  let score = 0;

  // ── Lease urgency (0–40 pts) ──────────────────────────────────────────────
  const conf = leaseEstimate?.confidence;
  if (conf === "overdue") score += 40;
  else if (conf === "high") score += 35;
  else if (conf === "medium") score += 20;
  else if (conf === "low") score += 10;
  else score += 5;

  // ── Headcount growth (0–30 pts) ───────────────────────────────────────────
  const emp30 = org?.num_employees_30_day_change;
  const empTotal = org?.estimated_num_employees || 1;
  if (emp30 != null && empTotal > 0) {
    const pct = (emp30 / empTotal) * 100;
    if (pct > 20) score += 30;
    else if (pct > 10) score += 20;
    else if (pct > 5) score += 10;
    else if (pct >= 0) score += 5;
    // shrinking = 0
  } else {
    score += 5; // unknown — small default
  }

  // ── Recent funding (0–20 pts) ─────────────────────────────────────────────
  const fundingStage = (org?.latest_funding_stage || "").toLowerCase();
  const fundingDate = org?.latest_funding_round_date ? new Date(org.latest_funding_round_date) : null;
  const monthsAgo = fundingDate ? (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30) : null;
  const bigStages = ["series_b", "series_c", "series_d", "series_e", "late_stage_vc", "private_equity", "debt_financing"];
  const midStages = ["series_a", "series_b"];
  if (fundingStage && monthsAgo !== null) {
    if (bigStages.some(s => fundingStage.includes(s)) && monthsAgo <= 12) score += 20;
    else if (midStages.some(s => fundingStage.includes(s)) && monthsAgo <= 12) score += 15;
    else if (monthsAgo <= 24) score += 10;
  }

  // ── Decision-maker seniority (0–10 pts) ───────────────────────────────────
  const t = (title || "").toLowerCase();
  if (t.includes("chief") || t.includes("coo") || t.includes("director") || t.includes("vp") || t.includes("vice president")) score += 10;
  else if (t.includes("head of") || t.includes("manager")) score += 6;
  else score += 3;

  return Math.min(100, Math.max(0, score));
}

function formatResults(apolloPeople, chData) {
  return apolloPeople.map((person) => {
    const companyName = person.organization?.name || "";
    const ch = chData[companyName] || null;
    const org = person.organization || {};

    // ── Email status (full 3-tier) ──────────────────────────────────────────
    const emailStatus = person.email_status || "unavailable"; // "verified" | "likely to engage" | "unavailable"

    // ── Headcount growth ────────────────────────────────────────────────────
    const headcountGrowth = {
      current: org.estimated_num_employees || null,
      change30d: org.num_employees_30_day_change ?? null,
      change6m: org.num_employees_6_month_change ?? null,
    };

    // ── Funding ─────────────────────────────────────────────────────────────
    const funding = (org.latest_funding_stage || org.total_funding_printed || org.latest_funding_round_date) ? {
      stage: org.latest_funding_stage || null,
      totalPrinted: org.total_funding_printed || null,
      lastRoundDate: org.latest_funding_round_date || null,
    } : null;

    // ── Tech stack (top 6) ──────────────────────────────────────────────────
    const techStack = (org.current_technologies || []).slice(0, 6).map(t => t.name || t.uid || String(t)).filter(Boolean);

    // ── Space Pressure Score ────────────────────────────────────────────────
    const spacePressureScore = calcSpacePressureScore(ch?.leaseEstimate || null, org, person.title);

    return {
      id: person.id,
      name: [person.first_name, person.last_name].filter(Boolean).join(" "),
      title: person.title || "",
      email: person.email || null,
      emailStatus,          // full status string — replaces old emailVerified boolean
      emailVerified: emailStatus === "verified", // kept for backward compat
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      linkedIn: person.linkedin_url || null,
      photo: person.photo_url || null,
      company: {
        name: companyName,
        domain: org.website_url || null,
        size: formatEmployeeCount(org.estimated_num_employees),
        industry: org.industry || null,
        location: org.city ? `${org.city}, UK` : "United Kingdom",
      },
      headcountGrowth,
      funding,
      techStack,
      spacePressureScore,
      companiesHouse: ch ? { companyNumber: ch.number, status: ch.status, incorporationDate: ch.incorporationDate, registeredAddress: ch.registeredAddress } : null,
      leaseEstimate: ch?.leaseEstimate || null,
    };
  });
}

function extractUniqueCompanies(people) { const seen = new Set(); return people.map((p) => p.organization?.name).filter((name) => name && !seen.has(name) && seen.add(name)); }
function formatAddress(addr) { if (!addr) return null; return [addr.address_line_1, addr.locality, addr.postal_code].filter(Boolean).join(", "); }
function formatEmployeeCount(n) { if (!n) return null; if (n < 10) return "1–9 employees"; if (n < 50) return "10–49 employees"; if (n < 200) return "50–199 employees"; if (n < 500) return "200–499 employees"; if (n < 1000) return "500–999 employees"; return "1,000+ employees"; }
function buildEmployeeRange(min, max) { return [max ? `${min},${max}` : `${min},10000`]; }
function chunkArray(arr, size) { const chunks = []; for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size)); return chunks; }