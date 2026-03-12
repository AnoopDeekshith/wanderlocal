import { useState, useRef, useEffect } from "react";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const ITINERARY_PROMPT = `You are Wander, an expert travel planner. Create a detailed day-by-day itinerary including flight information.
CRITICAL: Respond ONLY with valid JSON. No markdown, no code blocks, no extra text. No trailing commas.

Output this exact structure:
{"tripTitle":"5 Days in New York","destination":"New York, NY","origin":"Los Angeles, CA","totalDays":5,"flights":{"outbound":{"from":"LAX","to":"JFK","airline":"Delta","class":"Economy","departure":"7:00 AM","arrival":"3:15 PM","duration":"5h 15m","price":189},"return":{"from":"JFK","to":"LAX","airline":"Delta","class":"Economy","departure":"6:00 PM","arrival":"9:15 PM","duration":"5h 15m","price":210},"totalFlightCost":399,"flightTip":"Book 3 weeks ahead for best rates"},"budgetSummary":{"flights":"$399","accommodation":"$800","foodAndActivities":"$400","daily":"$240/day","total":"$1599 total","breakdown":"Flights 25%, Hotel 50%, Food+Fun 25%"},"packingEssentials":[{"item":"Item","why":"Why for this trip","amazonSearch":"search term"},{"item":"Item","why":"Why","amazonSearch":"search term"},{"item":"Item","why":"Why","amazonSearch":"search term"},{"item":"Item","why":"Why","amazonSearch":"search term"},{"item":"Item","why":"Why","amazonSearch":"search term"}],"days":[{"day":1,"title":"Arrival Day","theme":"Arrive & Explore","moves":[{"time":"7:00 AM","type":"transport","title":"Depart LAX on Delta","description":"Morning nonstop flight to destination.","localTip":"Download airline app for updates.","socialSource":"r/travel","estimatedCost":{"amount":189,"currency":"USD","note":"flight included in totals"}},{"time":"4:00 PM","type":"transport","title":"Airport to Hotel","description":"Take public transit from airport — saves vs Uber.","localTip":"Buy transit card at airport.","socialSource":"r/nyc","estimatedCost":{"amount":11,"currency":"USD","note":"per person"}},{"time":"7:00 PM","type":"food","title":"First Dinner","description":"Classic local spot near hotel.","localTip":"Arrive before 7pm to skip wait.","socialSource":"r/FoodNYC","estimatedCost":{"amount":25,"currency":"USD","note":"per person"}}],"dayTotal":{"amount":180,"currency":"USD","note":"arrival day est"},"mustEat":{"place":"Local Famous Spot","dish":"Signature dish","why":"Locals swear by it since forever.","source":"r/FoodNYC","estimatedCost":{"amount":20,"currency":"USD"}}}],"grandTotal":{"amount":1599,"currency":"USD","note":"per person incl flights, hotel, food, activities. Excl shopping."},"finalTips":["tip1","tip2","tip3"]}

Rules: real place names, accurate 2026 USD prices, grandTotal includes flights, generate all requested days.`;

const TRIP_PROMPT = `You are Wander. Suggest 3 ranked travel destinations. Respond ONLY in JSON:
{"intro":"One warm sentence referencing their origin","destinations":[{"rank":1,"place":"City, Country","emoji":"🗽","tagline":"5-7 word tagline","whyMatch":"2 sentences why perfect","safetyLevel":"Safe","safetyNote":"one sentence","weather":{"conditions":"brief","temp":"65-75F","vibe":"Warm"},"socialBuzz":{"score":94,"hotOn":"Reddit & Instagram","trend":"what's trending"},"budget":{"fit":"Perfect fit","dailyCost":"$120-180/day","flightEst":"$150-250 roundtrip from origin","tip":"budget tip"},"crowd":{"level":"Moderate","note":"crowd note"},"hiddenGem":"Specific insider spot","bestFor":["tag1","tag2"]}]}`;

const INTEL_PROMPT = `You are Wander. Respond ONLY in JSON:
{"destination":"Place","summary":"2-3 sentence honest take","weather":{"conditions":"weather","temperature":"range","tip":"tip"},"crowd":{"level":"Moderate","description":"2 sentences"},"hiddenGems":[{"name":"spot","why":"why"},{"name":"spot","why":"why"},{"name":"spot","why":"why"}],"packingList":{"essentials":["i1","i2","i3"],"clothing":["i1","i2","i3"],"extras":["i1","i2"]},"localTip":"golden local advice"}`;

const LOCAL_PROMPT = `You are a hyper-local travel expert. Given a city and a distance radius, return 5 real places to visit. Mix Reddit hidden gems, Instagram trending spots, and local secrets. ONLY respond with valid JSON — no markdown, no extra text.

{"radius":"10 miles","label":"Right Here","emoji":"📍","places":[{"name":"Real Place Name","type":"beach","emoji":"🏄","description":"2 sentences — what it is and why it's worth going.","localTip":"Specific insider tip from locals.","source":"r/santacruz or @instagramuser","vibeTag":"Hidden Gem","estimatedTime":"2-3 hours","cost":"Free","bestTime":"Sunset"},{"name":"Real Place 2","type":"food","emoji":"🍜","description":"Description.","localTip":"Tip.","source":"Reddit","vibeTag":"Local Fave","estimatedTime":"1 hour","cost":"$10-20","bestTime":"Lunch"},{"name":"Real Place 3","type":"hike","emoji":"🥾","description":"Description.","localTip":"Tip.","source":"Instagram","vibeTag":"Trending","estimatedTime":"3 hours","cost":"Free","bestTime":"Morning"},{"name":"Real Place 4","type":"viewpoint","emoji":"🔭","description":"Description.","localTip":"Tip.","source":"Reddit","vibeTag":"Underrated","estimatedTime":"1 hour","cost":"Free","bestTime":"Sunrise"},{"name":"Real Place 5","type":"activity","emoji":"🎯","description":"Description.","localTip":"Tip.","source":"r/LocalSub","vibeTag":"Instagrammable","estimatedTime":"2 hours","cost":"$5-15","bestTime":"Afternoon"}]}

Replace ALL placeholders with real specific places actually near the given location and radius. Be hyper-accurate with names and details.`;

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const TRENDING = [
  { place:"Kyoto, Japan", tag:"Cherry blossoms peaking", heat:98, emoji:"🌸", sub:"r/JapanTravel · 2.4k posts" },
  { place:"Patagonia, Chile", tag:"Perfect trekking weather", heat:91, emoji:"🏔", sub:"r/hiking · 1.8k posts" },
  { place:"Marrakech, Morocco", tag:"Spring vibes, low crowds", heat:87, emoji:"🕌", sub:"r/solotravel · 1.2k posts" },
  { place:"Yosemite, CA", tag:"Wildflowers + waterfalls", heat:85, emoji:"🌊", sub:"r/CampingandHiking · 980 posts" },
  { place:"Lisbon, Portugal", tag:"Warm days, affordable", heat:82, emoji:"🛶", sub:"r/travel · 870 posts" },
  { place:"Bali, Indonesia", tag:"Dry season starting", heat:79, emoji:"🌴", sub:"r/digitalnomad · 760 posts" },
];

const STEPS = [
  { id:"terrain", question:"Beach person or mountain person?", sub:"This shapes everything — vibe, packing, the whole trip.", options:[
    {value:"beach",label:"Beach",emoji:"🏖",desc:"Waves, sand & golden hours"},
    {value:"mountain",label:"Mountain",emoji:"🏔",desc:"Peaks, trails & crisp air"},
    {value:"both",label:"Both",emoji:"🌍",desc:"I'll take it all"},
    {value:"city",label:"City",emoji:"🏙",desc:"Streets, culture & energy"},
  ]},
  { id:"mood", question:"What mood are you in?", sub:"Be honest — there's no wrong answer.", options:[
    {value:"explore",label:"Explore",emoji:"🧭",desc:"Discover, wander & get lost"},
    {value:"wellness",label:"Wellness",emoji:"🧘",desc:"Rest, recharge & breathe"},
    {value:"party",label:"Party",emoji:"🎉",desc:"Nightlife, music & people"},
    {value:"adventure",label:"Adventure First,\nParty After",emoji:"🤘",desc:"Hard days, big nights"},
  ]},
  { id:"group", question:"Who are you travelling with?", sub:"Group type changes everything.", options:[
    {value:"solo",label:"Solo",emoji:"🧍",desc:"Just me, my rules"},
    {value:"couple",label:"Couple",emoji:"👫",desc:"Romantic getaway"},
    {value:"friends",label:"Friends",emoji:"👯",desc:"Squad trip"},
    {value:"family",label:"Family",emoji:"👨‍👩‍👧",desc:"Kids & all"},
  ]},
  { id:"budget", question:"Budget looking like?", sub:"No judgment — we'll find the best for what you've got.", options:[
    {value:"tight",label:"Tight Budget",emoji:"💸",desc:"Every dollar counts"},
    {value:"medium",label:"Mid-Range",emoji:"💳",desc:"Comfortable but conscious"},
    {value:"flexible",label:"Flexible",emoji:"🤑",desc:"Treat yourself"},
    {value:"luxury",label:"Luxury",emoji:"💎",desc:"Only the best"},
  ]},
  { id:"dates", question:"When are you going?", sub:"Helps us check real weather and crowd levels.", type:"date" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TYPE_COLORS = { transport:"#3b82f6",activity:"#8b5cf6",food:"#f59e0b",accommodation:"#10b981",experience:"#ec4899",hike:"#22c55e",beach:"#06b6d4",viewpoint:"#f97316",hidden:"#a855f7" };
const TYPE_ICONS = { transport:"🚃",activity:"🎯",food:"🍜",accommodation:"🏨",experience:"✨",hike:"🥾",beach:"🏄",viewpoint:"🔭",hidden:"🗝️" };

const FUN_LINES = [
  "are you really tho? in this economy?",
  "your credit card is shaking.",
  "bold of you to assume you can afford this.",
  "your wallet just sent a distress signal.",
  "unbothered. hydrated. slightly broke.",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Use localStorage for hosted site (works without window.storage)
const storageGet = async (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const storageSet = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const getApiKey = () => localStorage.getItem("wl_apikey") || "";
const setApiKey = (k) => localStorage.setItem("wl_apikey", k);
const clearApiKey = () => localStorage.removeItem("wl_apikey");

const callAI = async (system, userMsg, maxTokens = 2000) => {
  const apiKey = getApiKey();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages: [{ role: "user", content: userMsg }] })
  });
  const data = await res.json();
  const raw = data.content?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); }
  catch { const s = clean.indexOf("{"); const e = clean.lastIndexOf("}"); if (s !== -1 && e !== -1) { try { return JSON.parse(clean.slice(s, e + 1)); } catch {} } return null; }
};

const getLocation = () => new Promise((resolve) => {
  if (!navigator.geolocation) { resolve(null); return; }
  navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => resolve(null), { timeout: 8000 });
});

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "your area";
    const state = data.address?.state || "";
    return `${city}${state ? ", " + state : ""}`;
  } catch { return "your location"; }
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const TypingDots = () => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A96E", display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
  </span>
);

const CrowdDot = ({ level }) => {
  const c = { Low: "#4ade80", Moderate: "#facc15", High: "#fb923c", "Very High": "#f87171" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c[level] || "#94a3b8" }} /><span style={{ fontWeight: 700, color: c[level] || "#94a3b8", fontSize: 12 }}>{level}</span></span>;
};

const SafetyBadge = ({ level, note }) => {
  const cfg = { "Safe": { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", icon: "✓" }, "Caution": { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" }, "High Risk": { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", icon: "⚠" }, "Avoid": { bg: "#450a0a", border: "#991b1b", text: "#fca5a5", icon: "✕" } };
  const s = cfg[level] || cfg["Safe"];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9, padding: "6px 11px", display: "flex", alignItems: "flex-start", gap: 6, marginTop: 9 }}>
      <span style={{ fontSize: 11, color: s.text, fontWeight: 800, flexShrink: 0 }}>{s.icon}</span>
      <div><span style={{ fontSize: 11, fontWeight: 700, color: s.text }}>{level}</span>{note && <span style={{ fontSize: 11, color: s.text, opacity: 0.8 }}> — {note}</span>}</div>
    </div>
  );
};

// ─── FLIGHT PANEL ─────────────────────────────────────────────────────────────

const FlightPanel = ({ flights, origin, destination }) => {
  const [tab, setTab] = useState("outbound");
  if (!flights) return null;
  const opts = tab === "outbound" ? (flights.outbound ? [flights.outbound] : []) : (flights.return ? [flights.return] : []);

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 16, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>✈️ Flights</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{flights.outbound?.from || "LAX"} ⟷ {flights.outbound?.to || "JFK"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{flights.flightTip}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Roundtrip total</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#93c5fd" }}>${flights.totalFlightCost}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>per person</div>
        </div>
      </div>
      <div style={{ display: "flex", background: "#F7F5F2", padding: 4, gap: 3, margin: "11px 14px 0" }}>
        {["outbound", "return"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: tab === t ? "#fff" : "transparent", fontSize: 12, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#1a1a2e" : "#999", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.07)" : "none" }}>
            {t === "outbound" ? "→ Outbound" : "← Return"}
          </button>
        ))}
      </div>
      <div style={{ padding: "10px 14px 14px" }}>
        {opts.map((opt, i) => (
          <div key={i} style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 11, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{opt.airline}</span>
                <span style={{ background: "#DBEAFE", color: "#1D4ED8", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{opt.class}</span>
                <span style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: 5, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>Best Deal</span>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>{opt.departure} → {opt.arrival} · {opt.duration}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1D4ED8" }}>${opt.price}</div>
              <div style={{ fontSize: 9, color: "#bbb" }}>per person</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── GO LOCAL VIEW ─────────────────────────────────────────────────────────────

const ZONE_DEFS = [
  { radius:"10 miles", label:"Right Here", emoji:"📍", color:"#3b82f6", desc:"Your backyard" },
  { radius:"25 miles", label:"Short Drive", emoji:"🚗", color:"#10b981", desc:"Easy day trip" },
  { radius:"40 miles", label:"Day Trip",    emoji:"🗺",  color:"#f59e0b", desc:"Worth the drive" },
  { radius:"50+ miles",label:"Weekend Escape",emoji:"🌅",color:"#8b5cf6",desc:"Full escape" },
];

const GoLocalView = ({ locationName, onBack }) => {
  const [activeZone, setActiveZone] = useState(0);
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const city = locationName || "Santa Cruz, CA";

  const loadZone = async (idx) => {
    setActiveZone(idx);
    setError(false);
    if (cache[idx]) return; // already loaded
    setLoading(true);
    const zone = ZONE_DEFS[idx];
    const prompt = `City: ${city} | Radius: ${zone.radius} | Find 5 real specific places within ${zone.radius} of ${city}. Include a mix: hidden gems from Reddit, trending Instagram spots, local food, nature, and one weird/unique spot. Use real place names that actually exist.`;
    const data = await callAI(LOCAL_PROMPT, prompt, 2000);
    if (data?.places?.length) {
      setCache(prev => ({ ...prev, [idx]: data }));
    } else {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { loadZone(0); }, []);

  const zone = ZONE_DEFS[activeZone];
  const data = cache[activeZone];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"18px 26px 14px", borderBottom:"1px solid #EDEAE4" }}>
        <button onClick={onBack} style={{ fontSize:11, color:"#bbb", background:"none", border:"none", cursor:"pointer", marginBottom:10 }}>← Home</button>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:"#1A1A1A", marginBottom:3 }}>Go Local</h2>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#888" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80" }}/>
              Near <strong style={{ color:"#555", marginLeft:3 }}>{city}</strong>
            </div>
          </div>
        </div>
        {/* Zone tabs */}
        <div style={{ display:"flex", gap:6 }}>
          {ZONE_DEFS.map((z, i) => (
            <button key={i} onClick={() => loadZone(i)}
              style={{ flexShrink:0, padding:"6px 13px", borderRadius:100, border:`2px solid ${activeZone===i ? z.color : "#E8E4DE"}`, background:activeZone===i ? z.color : "#fff", color:activeZone===i ? "#fff" : "#666", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.18s", display:"flex", alignItems:"center", gap:5 }}>
              <span>{z.emoji}</span>{z.radius}
              {cache[i] && activeZone!==i && <span style={{ width:5, height:5, borderRadius:"50%", background:z.color, opacity:0.6 }}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"18px 26px 80px" }}>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"50px 0", gap:16 }}>
            <div style={{ position:"relative", width:80, height:80 }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ position:"absolute", borderRadius:"50%", border:`2px solid ${zone.color}`, opacity:0.2+i*0.15, top:`${i*14}%`, left:`${i*14}%`, right:`${i*14}%`, bottom:`${i*14}%`, animation:`pulse ${1+i*0.3}s infinite` }}/>
              ))}
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>📍</div>
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#1A1A1A" }}>Scanning {zone.radius} of {city}...</div>
            <div style={{ fontSize:12, color:"#bbb", textAlign:"center", lineHeight:1.6 }}>Checking Reddit threads & Instagram tags</div>
          </div>
        ) : error ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"50px 0", gap:12 }}>
            <div style={{ fontSize:30 }}>😕</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1A1A1A" }}>Couldn't load spots</div>
            <div style={{ fontSize:12, color:"#999", textAlign:"center", maxWidth:240 }}>The AI response was cut short. Try again.</div>
            <button onClick={()=>loadZone(activeZone)} style={{ background:zone.color, color:"#fff", border:"none", borderRadius:9, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Retry →</button>
          </div>
        ) : data?.places ? (
          <>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#1A1A1A", marginBottom:2 }}>{zone.label} <span style={{ fontSize:13, color:"#bbb", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>— within {zone.radius}</span></div>
              <div style={{ fontSize:11, color:"#bbb" }}>{data.places.length} spots · sourced from Reddit & Instagram</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {data.places.map((place, i) => (
                <div key={i} style={{ background:"#fff", border:`1.5px solid ${i===0 ? zone.color : "#E8E4DE"}`, borderRadius:16, padding:"14px 15px", animation:"fadeUp 0.4s ease", animationDelay:`${i*0.07}s`, animationFillMode:"both" }}>
                  <div style={{ display:"flex", gap:11, alignItems:"flex-start" }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:TYPE_COLORS[place.type]||zone.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                      {place.emoji||"📍"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"#1A1A1A" }}>{place.name}</div>
                        <span style={{ background:"#F7F5F2", border:"1px solid #E8E4DE", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:600, color:"#888", flexShrink:0, whiteSpace:"nowrap" }}>{place.vibeTag}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#666", lineHeight:1.65, marginBottom:8 }}>{place.description}</div>
                      <div style={{ background:"#F7F5F2", borderRadius:9, padding:"8px 10px", marginBottom:8 }}>
                        <div style={{ fontSize:10, color:"#C9A96E", fontWeight:700, marginBottom:2 }}>💡 Local Tip</div>
                        <div style={{ fontSize:11, color:"#666", lineHeight:1.5 }}>{place.localTip}</div>
                        <div style={{ fontSize:9, color:"#bbb", marginTop:3 }}>📡 via {place.source}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {place.estimatedTime && <span style={{ fontSize:10, color:"#888", background:"#F0EDEA", borderRadius:5, padding:"2px 7px" }}>⏱ {place.estimatedTime}</span>}
                        {place.cost && <span style={{ fontSize:10, color:"#888", background:"#F0EDEA", borderRadius:5, padding:"2px 7px" }}>💰 {place.cost}</span>}
                        {place.bestTime && <span style={{ fontSize:10, color:"#888", background:"#F0EDEA", borderRadius:5, padding:"2px 7px" }}>🌅 {place.bestTime}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

// ─── ITINERARY VIEW ────────────────────────────────────────────────────────────

const ItineraryView = ({ itinerary, onBack }) => {
  const [expandedDay, setExpandedDay] = useState(1);
  const [finalized, setFinalized] = useState(false);

  const exportCal = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WanderLocal//EN"];
    const today = new Date();
    itinerary.days?.forEach((day, idx) => {
      const d = new Date(today); d.setDate(d.getDate() + idx);
      const ds = d.toISOString().slice(0, 10).replace(/-/g, "");
      day.moves?.forEach(m => {
        lines.push("BEGIN:VEVENT", `DTSTART:${ds}T090000`, `DTEND:${ds}T100000`,
          `SUMMARY:${m.title}`, `DESCRIPTION:${m.description} | Est: $${m.estimatedCost?.amount}`, "END:VEVENT");
      });
      if (day.mustEat) lines.push("BEGIN:VEVENT", `DTSTART:${ds}T190000`, `DTEND:${ds}T210000`,
        `SUMMARY:🍜 ${day.mustEat.place}`, `DESCRIPTION:Order: ${day.mustEat.dish}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    a.download = `WanderLocal_${itinerary.destination?.replace(/,?\s+/g, "_") || "trip"}.ics`; a.click();
  };

  const exportList = () => {
    let t = `✈️ ${itinerary.tripTitle}\n${"─".repeat(48)}\n\n`;
    if (itinerary.flights) t += `FLIGHTS\nOut: ${itinerary.flights.outbound?.from}→${itinerary.flights.outbound?.to} $${itinerary.flights.outbound?.price}\nReturn: $${itinerary.flights.return?.price}\nTotal flights: $${itinerary.flights.totalFlightCost}\n\n`;
    t += `BUDGET: ${itinerary.budgetSummary?.total} per person\nBreakdown: ${itinerary.budgetSummary?.breakdown}\n\n`;
    t += `🎒 PACKING\n`;
    itinerary.packingEssentials?.forEach((p, i) => t += `${i + 1}. ${p.item} — ${p.why}\n   Amazon: https://amazon.com/s?k=${encodeURIComponent(p.amazonSearch)}\n`);
    t += `\n🗓 ITINERARY\n`;
    itinerary.days?.forEach(d => {
      t += `\nDay ${d.day}: ${d.title} (~$${d.dayTotal?.amount})\n`;
      d.moves?.forEach(m => t += `  ${m.time} ${m.title} ~$${m.estimatedCost?.amount}\n`);
      if (d.mustEat) t += `  🍜 ${d.mustEat.place} — ${d.mustEat.dish} ~$${d.mustEat.estimatedCost?.amount}\n`;
    });
    t += `\n💰 GRAND TOTAL: $${itinerary.grandTotal?.amount} per person\n${itinerary.grandTotal?.note}\n\n`;
    t += `TIPS\n${itinerary.finalTips?.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/plain" }));
    a.download = `WanderLocal_${itinerary.destination?.replace(/,?\s+/g, "_") || "trip"}_Plan.txt`; a.click();
  };

  return (
    <div style={{ padding: "20px 26px 100px", maxWidth: 680 }}>
      <button onClick={onBack} style={{ fontSize: 11, color: "#bbb", background: "none", border: "none", cursor: "pointer", marginBottom: 12 }}>← Back</button>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 3 }}>{itinerary.tripTitle}</h2>
      {itinerary.origin && <p style={{ fontSize: 12, color: "#999", marginBottom: 18 }}>{itinerary.origin} → {itinerary.destination} · {itinerary.totalDays} days</p>}

      {/* Budget */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#C9A96E", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>💰 Full Budget Per Person</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 10 }}>
          {[["✈️ Flights", itinerary.budgetSummary?.flights], ["🏨 Stay", itinerary.budgetSummary?.accommodation], ["🍜 Food+Fun", itinerary.budgetSummary?.foodAndActivities], ["📅 Daily", itinerary.budgetSummary?.daily]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div></div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{itinerary.budgetSummary?.breakdown}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#C9A96E", fontFamily: "'Cormorant Garamond',serif" }}>${itinerary.grandTotal?.amount}</div>
        </div>
      </div>

      {/* Flights */}
      {itinerary.flights && <FlightPanel flights={itinerary.flights} origin={itinerary.origin} destination={itinerary.destination} />}

      {/* Packing */}
      <div style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#999", letterSpacing: "0.08em" }}>🎒 Packing Essentials</div>
          <span style={{ fontSize: 10, background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c", borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>Amazon Links</span>
        </div>
        {itinerary.packingEssentials?.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 9, padding: "8px 10px", background: "#F7F5F2", borderRadius: 9, marginBottom: 6 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 1 }}>{item.item}</div><div style={{ fontSize: 11, color: "#888" }}>{item.why}</div></div>
            <a href={`https://www.amazon.com/s?k=${encodeURIComponent(item.amazonSearch)}`} target="_blank" rel="noreferrer" style={{ background: "#FF9900", borderRadius: 7, padding: "5px 9px", fontSize: 11, fontWeight: 700, color: "#fff", textDecoration: "none", flexShrink: 0 }}>🛒 Buy</a>
          </div>
        ))}
      </div>

      {/* Day by day */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#999", marginBottom: 10 }}>🗓 Day-by-Day Plan</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
        {itinerary.days?.map(day => (
          <div key={day.day} style={{ background: "#fff", border: `1.5px solid ${expandedDay === day.day ? "#C9A96E" : "#E8E4DE"}`, borderRadius: 14, overflow: "hidden" }}>
            <button onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
              style={{ width: "100%", padding: "12px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", background: expandedDay === day.day ? "linear-gradient(135deg,#1a1a2e,#16213e)" : "#fff", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: expandedDay === day.day ? "rgba(201,169,110,0.2)" : "#F7F5F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: expandedDay === day.day ? "#C9A96E" : "#555" }}>D{day.day}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: expandedDay === day.day ? "#fff" : "#1A1A1A" }}>{day.title}</div>
                  <div style={{ fontSize: 11, color: expandedDay === day.day ? "rgba(255,255,255,0.4)" : "#bbb" }}>{day.theme} · {day.moves?.length} stops</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: expandedDay === day.day ? "#C9A96E" : "#1A1A1A" }}>${day.dayTotal?.amount}</div>
                <div style={{ fontSize: 9, color: expandedDay === day.day ? "rgba(255,255,255,0.3)" : "#bbb" }}>per person</div>
              </div>
            </button>
            {expandedDay === day.day && (
              <div style={{ padding: "13px 15px", borderTop: "1px solid #E8E4DE" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "#F0EDEA" }} />
                  {day.moves?.map((move, mi) => (
                    <div key={mi} style={{ display: "flex", gap: 11, marginBottom: 13, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 27, height: 27, borderRadius: 8, background: TYPE_COLORS[move.type] || "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, boxShadow: "0 0 0 3px #FAFAF8" }}>{TYPE_ICONS[move.type] || "📍"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                          <div><span style={{ fontSize: 10, color: "#bbb", marginRight: 6 }}>{move.time}</span><span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{move.title}</span></div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>${move.estimatedCost?.amount}</div><div style={{ fontSize: 9, color: "#bbb" }}>{move.estimatedCost?.note || "per person"}</div></div>
                        </div>
                        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6, marginBottom: 5 }}>{move.description}</div>
                        {move.localTip && <div style={{ background: "#F7F5F2", borderRadius: 7, padding: "6px 9px" }}><span style={{ fontSize: 10, color: "#C9A96E", fontWeight: 700 }}>💡 </span><span style={{ fontSize: 11, color: "#666" }}>{move.localTip}</span><div style={{ fontSize: 9, color: "#bbb", marginTop: 1 }}>via {move.socialSource}</div></div>}
                      </div>
                    </div>
                  ))}
                </div>
                {day.mustEat && (
                  <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 10, padding: "11px 13px", display: "flex", gap: 9, marginTop: 4 }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>🍜</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#C9A96E", textTransform: "uppercase", marginBottom: 2 }}>Must Eat · {day.mustEat.source}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{day.mustEat.place} — <span style={{ color: "#C9A96E" }}>{day.mustEat.dish}</span></div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{day.mustEat.why}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A96E", flexShrink: 0 }}>${day.mustEat.estimatedCost?.amount}</div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0EDEA" }}>
                  <div style={{ background: "#F7F5F2", borderRadius: 8, padding: "6px 11px", display: "flex", gap: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#999" }}>Day {day.day}:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A" }}>${day.dayTotal?.amount} <span style={{ fontSize: 10, fontWeight: 400, color: "#bbb" }}>/ person</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#C9A96E", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Grand Total Per Person</div>
        {itinerary.days?.map(d => (
          <div key={d.day} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Day {d.day} — {d.title}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>${d.dayTotal?.amount}</span>
          </div>
        ))}
        {itinerary.flights?.totalFlightCost && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>✈️ Roundtrip flights</span><span style={{ fontSize: 11, color: "#93c5fd" }}>${itinerary.flights.totalFlightCost}</span></div>}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{itinerary.grandTotal?.note}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#C9A96E", fontFamily: "'Cormorant Garamond',serif" }}>${itinerary.grandTotal?.amount}</div>
        </div>
      </div>

      {/* Tips */}
      {itinerary.finalTips?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "13px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#999", marginBottom: 9 }}>📋 Pro Tips</div>
          {itinerary.finalTips.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
              <div style={{ width: 17, height: 17, borderRadius: 5, background: "#1a1a2e", color: "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Finalize */}
      {!finalized ? (
        <div style={{ background: "linear-gradient(135deg,#C9A96E,#b8933d)", borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Lock it in. ✈️</div>
          <div style={{ fontSize: 12, color: "rgba(26,26,46,0.6)", marginBottom: 14 }}>Export to your calendar + get your Amazon packing list.</div>
          <div style={{ display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { exportCal(); setFinalized(true); }} style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 17px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>📅 Add to Calendar</button>
            <button onClick={exportList} style={{ background: "#FF9900", color: "#fff", border: "none", borderRadius: 10, padding: "10px 17px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🛒 Shopping List</button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#f0fdf4", border: "2px solid #4ade80", borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🎉</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>You're going!</div>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Calendar file is downloading. Opens in Apple Calendar, Google Calendar & Outlook.</div>
          <button onClick={exportList} style={{ background: "#FF9900", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🛒 Get Amazon List</button>
        </div>
      )}
    </div>
  );
};

// ─── QUIZ ──────────────────────────────────────────────────────────────────────

const QuizFlow = ({ onResults, onSkip }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [dateForm, setDateForm] = useState({ month: "", startDay: "", endDay: "" });
  const [loading, setLoading] = useState(false);
  const current = STEPS[step];

  const handleOption = (value) => {
    setSelected(value);
    setTimeout(() => {
      const a = { ...answers, [current.id]: value };
      setAnswers(a); setSelected(null);
      if (step < STEPS.length - 1) setStep(s => s + 1);
      else submit(a);
    }, 280);
  };

  const submit = async (ans) => {
    setLoading(true);
    const dur = ans.endDay && ans.startDay ? Math.max(1, parseInt(ans.endDay) - parseInt(ans.startDay) + 1) : 5;
    const a = { ...ans, duration: dur };
    const text = `Origin: ${ans.originCity || "unknown"}. Profile: terrain=${ans.terrain}, mood=${ans.mood}, group=${ans.group}, budget=${ans.budget}, month=${ans.month || "March"}, days=${dur}`;
    const res = await callAI(TRIP_PROMPT, text, 2000);
    onResults(res, a);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "50px 24px" }}>
      <div style={{ fontSize: 34 }}>🌍</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#1A1A1A", textAlign: "center" }}>Finding your perfect match...</div>
      <div style={{ fontSize: 13, color: "#bbb", textAlign: "center", lineHeight: 1.6, maxWidth: 280 }}>Checking safety, weather, Reddit & Instagram trends right now.</div>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 490 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step {step + 1} of {STEPS.length}</span>
          <button onClick={onSkip} style={{ fontSize: 11, color: "#ccc", background: "none", border: "none", cursor: "pointer" }}>Skip →</button>
        </div>
        <div style={{ background: "#E8E4DE", borderRadius: 4, height: 3 }}>
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#C9A96E,#1a1a2e)", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(18px,4vw,25px)", fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 5 }}>{current.question}</h2>
        {current.sub && <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{current.sub}</p>}
      </div>
      {current.type === "date" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", display: "block", marginBottom: 7 }}>Month</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
              {MONTHS.map(m => <button key={m} onClick={() => setDateForm(f => ({ ...f, month: m }))} style={{ padding: "7px 3px", background: dateForm.month === m ? "#1a1a2e" : "#fff", border: `1.5px solid ${dateForm.month === m ? "#1a1a2e" : "#E8E4DE"}`, borderRadius: 8, fontSize: 11, fontWeight: 600, color: dateForm.month === m ? "#fff" : "#555", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{m.slice(0, 3)}</button>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["From Day", "startDay"], ["To Day", "endDay"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
                <input type="number" min="1" max="31" placeholder="e.g. 15" value={dateForm[key]} onChange={e => setDateForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", background: "#fff", border: "1.5px solid #E8E4DE", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#1A1A1A", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <button onClick={() => submit({ ...answers, ...dateForm })} disabled={!dateForm.month || !dateForm.startDay} style={{ width: "100%", padding: "13px 0", background: dateForm.month && dateForm.startDay ? "linear-gradient(135deg,#1a1a2e,#2d2d5e)" : "#F0EDEA", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: dateForm.month && dateForm.startDay ? "#fff" : "#bbb", cursor: dateForm.month && dateForm.startDay ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
            Find My Destinations →
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {current.options.map(opt => (
            <button key={opt.value} onClick={() => handleOption(opt.value)} style={{ background: selected === opt.value ? "#1a1a2e" : "#fff", border: `1.5px solid ${selected === opt.value ? "#1a1a2e" : "#E8E4DE"}`, borderRadius: 14, padding: "15px 13px", textAlign: "left", cursor: "pointer", transform: selected === opt.value ? "scale(0.97)" : "scale(1)", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
              <div style={{ fontSize: 23, marginBottom: 7 }}>{opt.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selected === opt.value ? "#fff" : "#1A1A1A", marginBottom: 3, whiteSpace: "pre-line" }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: selected === opt.value ? "rgba(255,255,255,0.5)" : "#bbb" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      )}
      {step > 0 && <button onClick={() => { setStep(s => s - 1); setSelected(null); }} style={{ marginTop: 12, width: "100%", padding: "8px 0", background: "transparent", border: "none", color: "#ccc", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>}
    </div>
  );
};

// ─── MATCH CARD ────────────────────────────────────────────────────────────────

const MatchCard = ({ dest, rank, onPlanTrip, onDeepDive, answers, userCity }) => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(false);
  const rankColors = ["#C9A96E", "#94a3b8", "#cd7c49"];
  const rankLabels = ["Best Match", "2nd Pick", "3rd Pick"];
  const buzzColor = dest.socialBuzz?.score > 85 ? "#ef4444" : dest.socialBuzz?.score > 70 ? "#fb923c" : "#C9A96E";

  const handlePlanTrip = async () => {
    setLoadingPlan(true); setPlanError(false);
    const days = Math.min(answers?.duration || 5, 5); // cap at 5 to keep JSON manageable
    const origin = answers?.originCity || "California, USA";
    const prompt = `Origin: ${origin} | Destination: ${dest.place} | Duration: ${days} days | Budget: ${answers?.budget || "medium"} | Group: ${answers?.group || "solo"} | Month: ${answers?.month || "March"}. Create a complete ${days}-day itinerary with real place names and accurate 2026 USD pricing.`;
    try {
      const apiKey = getApiKey();
      const raw = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 6000, system: ITINERARY_PROMPT, messages: [{ role: "user", content: prompt }] })
      });
      const data = await raw.json();
      if (data.error) { setPlanError(true); setLoadingPlan(false); return; }
      const text = data.content?.[0]?.text || "";
      let itin = null;
      // 3-pass JSON extraction
      try { itin = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch {}
      if (!itin) { try { const s = text.indexOf("{"); const e = text.lastIndexOf("}"); if (s !== -1 && e !== -1) itin = JSON.parse(text.slice(s, e + 1)); } catch {} }
      if (!itin) { // last resort: try to find any valid JSON object with a days array
        const m = text.match(/\{[\s\S]*"days"[\s\S]*\}/);
        if (m) { try { itin = JSON.parse(m[0]); } catch {} }
      }
      if (itin?.days?.length) { onPlanTrip(itin); }
      else { setPlanError(true); }
    } catch { setPlanError(true); }
    setLoadingPlan(false);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: `2px solid ${rank === 1 ? "#C9A96E" : "#E8E4DE"}`, overflow: "hidden", boxShadow: rank === 1 ? "0 8px 36px rgba(201,169,110,0.15)" : "none", animation: "fadeUp 0.5s ease", animationDelay: `${(rank - 1) * 0.1}s`, animationFillMode: "both" }}>
      <div style={{ background: rank === 1 ? "linear-gradient(135deg,#1a1a2e,#16213e)" : "linear-gradient(135deg,#2a2a2a,#1a1a1a)", padding: "16px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -12, right: -12, width: 65, height: 65, borderRadius: "50%", background: `rgba(${rank === 1 ? "201,169,110" : "120,120,120"},0.1)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ background: rankColors[rank - 1], borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: rank === 1 ? "#1a1a2e" : "#fff" }}>#{rank} {rankLabels[rank - 1]}</div>
          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", borderRadius: 5, padding: "2px 6px", color: "rgba(255,255,255,0.6)" }}>{dest.emoji}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Cormorant Garamond',serif", marginBottom: 1 }}>{dest.place}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: 3 }}>{dest.tagline}</div>
        {dest.budget?.flightEst && <div style={{ fontSize: 11, color: "#93c5fd" }}>✈️ {dest.budget.flightEst}</div>}
        <SafetyBadge level={dest.safetyLevel} note={dest.safetyNote} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 9 }}>
          {dest.bestFor?.map(t => <span key={t} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{t}</span>)}
        </div>
      </div>
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "#F7F5F2", borderRadius: 11, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#999", marginBottom: 4 }}>✦ Why it's your match</div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.65 }}>{dest.whyMatch}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ background: "#F7F5F2", borderRadius: 10, padding: "9px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#bbb", marginBottom: 3 }}>🌤 Weather</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{dest.weather?.vibe}</div>
            <div style={{ fontSize: 10, color: "#C9A96E", fontWeight: 600 }}>{dest.weather?.temp}</div>
          </div>
          <div style={{ background: "#F7F5F2", borderRadius: 10, padding: "9px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#bbb", marginBottom: 3 }}>📡 Buzz</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: buzzColor }}>{dest.socialBuzz?.score}<span style={{ fontSize: 9, color: "#bbb" }}>/100</span></div>
            <div style={{ background: "#E8E4DE", borderRadius: 2, height: 3, overflow: "hidden", marginTop: 3 }}><div style={{ width: `${dest.socialBuzz?.score}%`, height: "100%", background: buzzColor }} /></div>
          </div>
          <div style={{ background: "#F7F5F2", borderRadius: 10, padding: "9px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#bbb", marginBottom: 3 }}>👥 Crowds</div>
            <CrowdDot level={dest.crowd?.level} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, background: "#F7F5F2", borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#bbb", marginBottom: 2 }}>💰 Budget</div><div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{dest.budget?.dailyCost}<span style={{ fontSize: 10, color: "#999", fontWeight: 400 }}> / day</span></div><div style={{ fontSize: 11, color: "#777" }}>{dest.budget?.tip}</div></div>
          <div style={{ background: dest.budget?.fit === "Perfect fit" ? "#f0fdf4" : "#fff7ed", border: `1px solid ${dest.budget?.fit === "Perfect fit" ? "#bbf7d0" : "#fed7aa"}`, borderRadius: 7, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: dest.budget?.fit === "Perfect fit" ? "#16a34a" : "#ea580c", flexShrink: 0, alignSelf: "center" }}>{dest.budget?.fit}</div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 10, padding: "10px 13px", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
          <div><div style={{ fontSize: 9, fontWeight: 700, color: "#C9A96E", textTransform: "uppercase", marginBottom: 2 }}>Hidden Gem</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{dest.hiddenGem}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => onDeepDive(dest.place)} style={{ padding: "9px 0", background: "#F7F5F2", border: "1px solid #E8E4DE", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>→ Quick Intel</button>
          <button onClick={handlePlanTrip} disabled={loadingPlan} style={{ padding: "9px 0", background: loadingPlan ? "#2a2a4a" : "linear-gradient(135deg,#1a1a2e,#2d2d5e)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: loadingPlan ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {loadingPlan ? "⏳ Building..." : "🗓 Plan This Trip"}
          </button>
        </div>
        {loadingPlan && <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", animation: "pulse 1.5s infinite" }}>Building flights + full itinerary + prices...</div>}
        {planError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "9px 12px" }}>
            <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 3 }}>Couldn't generate itinerary</div>
            <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 7 }}>Hit retry — usually works second time.</div>
            <button onClick={handlePlanTrip} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Retry →</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const AuthModal = ({ onClose, onAuth }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(""); setLoading(true);
    const { name, email, password } = form;
    if (!email || !password) { setError("Fill in all fields."); setLoading(false); return; }
    if (password.length < 6) { setError("Password needs 6+ characters."); setLoading(false); return; }
    const key = `user:${email.toLowerCase()}`;
    if (mode === "signup") {
      if (!name.trim()) { setError("Enter your name."); setLoading(false); return; }
      if (await storageGet(key)) { setError("Account already exists."); setLoading(false); return; }
      const u = { name: name.trim(), email: email.toLowerCase(), password }; await storageSet(key, u); onAuth(u);
    } else {
      const s = await storageGet(key);
      if (!s || s.password !== password) { setError("Invalid email or password."); setLoading(false); return; }
      onAuth(s);
    }
    setLoading(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 26px 22px", width: "100%", maxWidth: 350, animation: "fadeUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#1a1a2e,#C9A96E)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, margin: "0 auto 8px" }}>✦</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        </div>
        <div style={{ display: "flex", background: "#F7F5F2", borderRadius: 9, padding: 3, marginBottom: 14, gap: 3 }}>
          {["login", "signup"].map(m => <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: mode === m ? "#fff" : "transparent", color: mode === m ? "#1A1A1A" : "#999", fontWeight: mode === m ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{m === "login" ? "Sign In" : "Sign Up"}</button>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {mode === "signup" && <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={{ background: "#F7F5F2", border: "1.5px solid #E8E4DE", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", color: "#1A1A1A", width: "100%", boxSizing: "border-box" }} />}
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" style={{ background: "#F7F5F2", border: "1.5px solid #E8E4DE", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", color: "#1A1A1A", width: "100%", boxSizing: "border-box" }} />
          <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" type="password" onKeyDown={e => e.key === "Enter" && submit()} style={{ background: "#F7F5F2", border: "1.5px solid #E8E4DE", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", color: "#1A1A1A", width: "100%", boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ marginTop: 7, fontSize: 12, color: "#ef4444", background: "#fef2f2", borderRadius: 6, padding: "5px 9px" }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ marginTop: 11, width: "100%", padding: "10px 0", background: "linear-gradient(135deg,#1a1a2e,#2d2d5e)", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1 }}>{loading ? "..." : mode === "login" ? "Sign In →" : "Create Account →"}</button>
        <button onClick={onClose} style={{ marginTop: 7, width: "100%", padding: "6px 0", background: "transparent", color: "#ccc", border: "none", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
      </div>
    </div>
  );
};

// ─── API KEY GATE ─────────────────────────────────────────────────────────────

const ApiKeyGate = ({ onKey }) => {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const submit = async () => {
    const trimmed = val.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError("Key should start with sk-ant-  — check you copied the full key.");
      return;
    }
    setTesting(true); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": trimmed, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: "hi" }] })
      });
      const data = await res.json();
      if (data.error) { setError("Key rejected: " + data.error.message); setTesting(false); return; }
      setApiKey(trimmed);
      onKey(trimmed);
    } catch { setError("Network error — check your connection and try again."); }
    setTesting(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}button{font-family:'DM Sans',sans-serif}`}</style>

      <div style={{ width:"100%", maxWidth:440, animation:"fadeUp 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:52, height:52, background:"linear-gradient(135deg,#1a1a2e,#C9A96E)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 14px" }}>✦</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:"#1A1A1A", marginBottom:6 }}>WanderLocal</h1>
          <p style={{ fontSize:14, color:"#aaa", fontStyle:"italic" }}>AI travel planning — enter your Anthropic API key to start</p>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", borderRadius:22, border:"1px solid #E8E4DE", padding:"28px 28px 24px", boxShadow:"0 8px 40px rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1A1A1A", marginBottom:5 }}>Your Anthropic API Key</div>
            <div style={{ fontSize:12, color:"#999", lineHeight:1.65 }}>
              Your key is stored <strong>only in your browser</strong> — never sent anywhere except directly to Anthropic's API. Each friend who uses the site enters their own key.
            </div>
          </div>

          <div style={{ position:"relative", marginBottom:10 }}>
            <input
              type={showKey ? "text" : "password"}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="sk-ant-api03-..."
              style={{ width:"100%", padding:"13px 42px 13px 14px", background:"#F7F5F2", border:`1.5px solid ${error ? "#fecaca" : "#E8E4DE"}`, borderRadius:12, fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#1A1A1A", outline:"none", boxSizing:"border-box" }}
            />
            <button onClick={() => setShowKey(s => !s)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#bbb" }}>
              {showKey ? "🙈" : "👁"}
            </button>
          </div>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, padding:"9px 12px", fontSize:12, color:"#dc2626", marginBottom:10 }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={!val.trim() || testing}
            style={{ width:"100%", padding:"13px 0", background:val.trim() && !testing ? "linear-gradient(135deg,#1a1a2e,#2d2d5e)" : "#F0EDEA", border:"none", borderRadius:12, fontSize:14, fontWeight:700, color:val.trim() && !testing ? "#fff" : "#bbb", cursor:val.trim() && !testing ? "pointer" : "default", marginBottom:16, transition:"all 0.2s" }}>
            {testing ? "Verifying key..." : "Start Wandering →"}
          </button>

          {/* How to get a key */}
          <div style={{ background:"#F7F5F2", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>How to get a free API key</div>
            {[
              ["1", "Go to", "console.anthropic.com", "https://console.anthropic.com"],
              ["2", "Sign up for a free account (no credit card needed for free tier)", null, null],
              ["3", "Go to", "API Keys → Create Key", "https://console.anthropic.com/settings/keys"],
              ["4", "Copy and paste it above", null, null],
            ].map(([num, text, link, href], i) => (
              <div key={i} style={{ display:"flex", gap:9, marginBottom:8 }}>
                <div style={{ width:20, height:20, borderRadius:6, background:"#1a1a2e", color:"#C9A96E", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{num}</div>
                <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>
                  {text}{" "}
                  {link && <a href={href} target="_blank" rel="noreferrer" style={{ color:"#1a1a2e", fontWeight:700, textDecoration:"underline" }}>{link}</a>}
                </div>
              </div>
            ))}
            <div style={{ borderTop:"1px solid #E8E4DE", paddingTop:10, marginTop:4, fontSize:11, color:"#bbb", lineHeight:1.6 }}>
              💡 Free tier gives you ~$5 of credit — enough for dozens of trip plans. After that it's pay-as-you-go (~$0.01–0.05 per trip).
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:16, fontSize:11, color:"#ccc" }}>
          Your key never leaves your device except to call api.anthropic.com
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function WanderLocal() {
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [mode, setMode] = useState("home");
  const [quizResults, setQuizResults] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const bottomRef = useRef(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [funLine] = useState(FUN_LINES[Math.floor(Math.random() * FUN_LINES.length)]);

  useEffect(() => {
    (async () => {
      const s = await storageGet("session");
      if (s) setUser(s);
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleAuth = async (u) => { await storageSet("session", u); setUser(u); setShowAuth(false); };
  const handleSignOut = async () => { await storageSet("session", null); setUser(null); };

  const requestLoc = async () => {
    setLocLoading(true);
    const loc = await getLocation();
    if (loc) {
      setUserLocation(loc);
      const name = await reverseGeocode(loc.lat, loc.lng);
      setLocationName(name);
      setLocLoading(false);
      return { loc, name };
    }
    setLocLoading(false);
    return null;
  };

  const handleGoLocal = async () => {
    // Don't gate on GPS — go straight to local view, location name is enough
    if (!locationName) {
      // Try to get location one more time, but if it fails just use fallback
      setLocLoading(true);
      const loc = await getLocation();
      if (loc) {
        setUserLocation(loc);
        const name = await reverseGeocode(loc.lat, loc.lng);
        setLocationName(name || "Santa Cruz, CA");
      } else {
        setLocationName("Santa Cruz, CA");
      }
      setLocLoading(false);
    }
    setMode("local");
  };

  const sendMessage = async (text) => {
    const t = text || input.trim();
    if (!t || loading) return;
    setInput(""); setMode("chat");
    const nm = [...messages, { role: "user", content: t }];
    setMessages(nm); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": getApiKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: INTEL_PROMPT, messages: nm.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      let parsed = null;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch {}
      setMessages(prev => [...prev, { role: "assistant", content: raw, parsed }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong.", parsed: null }]); }
    setLoading(false);
  };

  const suggestions = ["Tokyo in March 🌸", "NYC on a budget 🗽", "Bali solo trip 🌴", "Yosemite weekend 🏔"];

  // Gate: show API key screen if no key saved — MUST be after all hooks
  if (!apiKey) return <ApiKeyGate onKey={(k) => setApiKeyState(k)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes drift1{0%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.08)}66%{transform:translate(-20px,20px) scale(0.95)}100%{transform:translate(0,0) scale(1)}}
        @keyframes drift2{0%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,25px) scale(0.92)}66%{transform:translate(30px,-40px) scale(1.06)}100%{transform:translate(0,0) scale(1)}}
        @keyframes drift3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(25px,35px) scale(1.04)}100%{transform:translate(0,0) scale(1)}}
        @keyframes floatDot{0%,100%{transform:translateY(0) scale(1);opacity:0.4}50%{transform:translateY(-12px) scale(1.2);opacity:0.7}}
        @keyframes rotateSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes traceRoute{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
        textarea{resize:none;outline:none;border:none;background:transparent;width:100%;font-family:'DM Sans',sans-serif;font-size:14px;color:#1A1A1A;line-height:1.5}
        textarea::placeholder{color:#bbb}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        button{font-family:'DM Sans',sans-serif}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,248,0.96)", backdropFilter: "blur(14px)", borderBottom: "1px solid #EDEAE4", padding: "0 22px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setMode("home")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#1a1a2e,#C9A96E)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 700, color: "#1A1A1A" }}>WanderLocal</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {mode !== "home" && <button onClick={() => setMode("home")} style={{ fontSize: 11, color: "#888", background: "#fff", border: "1px solid #E8E4DE", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>← Home</button>}
          {locationName && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 7, padding: "3px 8px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{locationName}</span>
            </div>
          )}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F7F5F2", borderRadius: 7, padding: "4px 9px" }}>
              <div style={{ width: 22, height: 22, background: "linear-gradient(135deg,#1a1a2e,#2d2d5e)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#C9A96E", fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{user.name.split(" ")[0]}</span>
              <button onClick={handleSignOut} style={{ fontSize: 10, color: "#ccc", background: "none", border: "none", cursor: "pointer" }}>out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "linear-gradient(135deg,#1a1a2e,#2d2d5e)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          )}
          <button onClick={() => { clearApiKey(); setApiKeyState(""); }}
            title="Change API Key"
            style={{ fontSize: 11, color: "#ccc", background: "none", border: "1px solid #E8E4DE", borderRadius: 7, padding: "4px 8px", cursor: "pointer" }}>🔑</button>
        </div>
      </nav>

      <div style={{ paddingTop: 52, display: "grid", gridTemplateColumns: "1fr 270px", minHeight: "calc(100vh - 52px)", maxWidth: 1100, margin: "0 auto" }}>

        {/* MAIN */}
        <div style={{ borderRight: "1px solid #EDEAE4", display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* HOME */}
          {mode === "home" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"50px 36px 40px", animation:"fadeUp 0.5s ease", position:"relative", overflow:"hidden", minHeight:"calc(100vh - 56px)" }}>

              {/* ── BACKGROUND LAYER ── */}
              {/* Soft gradient orbs */}
              <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
                {/* Orb 1 — top left, gold */}
                <div style={{ position:"absolute", top:"-8%", left:"-12%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle, rgba(201,169,110,0.13) 0%, transparent 70%)", animation:"drift1 28s ease-in-out infinite" }}/>
                {/* Orb 2 — bottom right, navy */}
                <div style={{ position:"absolute", bottom:"-10%", right:"-8%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(26,26,46,0.07) 0%, transparent 65%)", animation:"drift2 34s ease-in-out infinite" }}/>
                {/* Orb 3 — centre, very faint warm */}
                <div style={{ position:"absolute", top:"35%", left:"30%", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 60%)", animation:"drift3 22s ease-in-out infinite" }}/>

                {/* Dot grid */}
                <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.18 }} xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1.5" fill="#1a1a2e"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)"/>
                </svg>

                {/* Animated travel route SVG */}
                <svg style={{ position:"absolute", top:"10%", left:"5%", width:"90%", height:"80%", opacity:0.07 }} viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M 60 400 Q 180 80 340 250 Q 480 400 620 120" fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation:"traceRoute 6s ease-out forwards" }}/>
                  <path d="M 30 260 Q 200 360 380 140 Q 530 -20 680 300" fill="none" stroke="#C9A96E" strokeWidth="1" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation:"traceRoute 8s ease-out 0.8s forwards" }}/>
                </svg>

                {/* Floating dots — map pin style */}
                {[
                  { top:"14%", left:"18%", delay:"0s",  size:4,  color:"#C9A96E" },
                  { top:"22%", left:"68%", delay:"1.2s", size:3,  color:"#1a1a2e" },
                  { top:"58%", left:"12%", delay:"2.1s", size:5,  color:"#C9A96E" },
                  { top:"72%", left:"55%", delay:"0.6s", size:3,  color:"#1a1a2e" },
                  { top:"38%", left:"82%", delay:"1.8s", size:4,  color:"#C9A96E" },
                  { top:"82%", left:"28%", delay:"3s",   size:3,  color:"#1a1a2e" },
                  { top:"48%", left:"44%", delay:"2.5s", size:2.5,color:"#C9A96E" },
                ].map((d, i) => (
                  <div key={i} style={{ position:"absolute", top:d.top, left:d.left, width:d.size*2, height:d.size*2, borderRadius:"50%", background:d.color, animation:`floatDot ${3.5 + i*0.4}s ease-in-out ${d.delay} infinite` }}/>
                ))}

                {/* Thin rotating compass ring — top right */}
                <svg style={{ position:"absolute", top:"-60px", right:"-60px", width:280, height:280, opacity:0.05, animation:"rotateSlow 60s linear infinite" }} viewBox="0 0 280 280">
                  <circle cx="140" cy="140" r="120" fill="none" stroke="#1a1a2e" strokeWidth="1"/>
                  <circle cx="140" cy="140" r="90"  fill="none" stroke="#1a1a2e" strokeWidth="0.5" strokeDasharray="4 8"/>
                  <circle cx="140" cy="140" r="60"  fill="none" stroke="#C9A96E" strokeWidth="1"/>
                  <line x1="140" y1="20" x2="140" y2="260" stroke="#1a1a2e" strokeWidth="0.5"/>
                  <line x1="20"  y1="140" x2="260" y2="140" stroke="#1a1a2e" strokeWidth="0.5"/>
                  <line x1="55"  y1="55"  x2="225" y2="225" stroke="#1a1a2e" strokeWidth="0.3" strokeDasharray="3 6"/>
                  <line x1="225" y1="55"  x2="55"  y2="225" stroke="#1a1a2e" strokeWidth="0.3" strokeDasharray="3 6"/>
                  {[0,45,90,135,180,225,270,315].map(a=>(
                    <text key={a} x="140" y="12" textAnchor="middle" fontSize="7" fill="#1a1a2e" transform={`rotate(${a} 140 140)`}>{["N","","E","","S","","W",""][a/45]}</text>
                  ))}
                </svg>
              </div>
              {/* ── END BACKGROUND ── */}
              {/* ── CONTENT (above background) ── */}
              <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
              <div style={{ textAlign: "center", maxWidth: 460, marginBottom: 42 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 100, padding: "4px 12px", marginBottom: 16, fontSize: 11, color: "#999" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} /> Live · AI · Safety · Trends
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,5vw,50px)", fontWeight: 700, color: "#1A1A1A", lineHeight: 1.06, letterSpacing: "-0.02em", marginBottom: 7 }}>
                  {greeting}, Wanderer.
                </h1>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(13px,2.5vw,18px)", color: "#C9A96E", fontStyle: "italic", marginBottom: 14 }}>
                  ({funLine})
                </p>
                <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.75, maxWidth: 360, margin: "0 auto" }}>
                  AI travel planning with live safety checks, flight prices, and what's trending on Reddit & Instagram — then a full priced day-by-day itinerary.
                </p>
              </div>

              {/* THE TWO BIG ROUND BUTTONS */}
              <div style={{ display: "flex", gap: 22, marginBottom: 42, flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => setMode("quiz")}
                  style={{ width: 158, height: 158, borderRadius: "50%", background: "linear-gradient(145deg,#1a1a2e,#2d2d5e)", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 14px 44px rgba(26,26,46,0.28)", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 22px 56px rgba(26,26,46,0.38)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 14px 44px rgba(26,26,46,0.28)"; }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%,rgba(201,169,110,0.18),transparent 55%)" }} />
                  <span style={{ fontSize: 28, position: "relative" }}>✦</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", position: "relative" }}>Let's Start</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.4, position: "relative" }}>Find my perfect<br />destination</span>
                </button>

                <button onClick={handleGoLocal} disabled={locLoading}
                  style={{ width: 158, height: 158, borderRadius: "50%", background: "linear-gradient(145deg,#064e3b,#065f46)", border: "none", cursor: locLoading ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 14px 44px rgba(6,78,59,0.28)", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { if (!locLoading) { e.currentTarget.style.transform = "translateY(-4px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 22px 56px rgba(6,78,59,0.42)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 14px 44px rgba(6,78,59,0.28)"; }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 70%,rgba(74,222,128,0.18),transparent 55%)" }} />
                  {[1, 2, 3].map(i => <div key={i} style={{ position: "absolute", width: `${i * 44}px`, height: `${i * 44}px`, borderRadius: "50%", border: "1px solid rgba(74,222,128,0.18)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />)}
                  <span style={{ fontSize: 28, position: "relative", zIndex: 1 }}>{locLoading ? "⏳" : "📍"}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", position: "relative", zIndex: 1 }}>{locLoading ? "Finding..." : "Go Local"}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.4, position: "relative", zIndex: 1 }}>Explore near<br />you right now</span>
                </button>
              </div>

              {/* Search */}
              <div style={{ width: "100%", maxWidth: 480, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <div style={{ flex: 1, height: 1, background: "#E8E4DE" }} /><span style={{ fontSize: 11, color: "#ccc", whiteSpace: "nowrap" }}>or ask anything</span><div style={{ flex: 1, height: 1, background: "#E8E4DE" }} />
                </div>
                <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", border: "1.5px solid rgba(232,228,222,0.8)", borderRadius: 15, padding: "12px 13px", boxShadow: "0 4px 28px rgba(0,0,0,0.06)", display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="e.g. Tokyo in March — worth it?" rows={2} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 36, height: 36, borderRadius: 9, background: input.trim() ? "linear-gradient(135deg,#1a1a2e,#2d2d5e)" : "#F0EDEA", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={input.trim() ? "#C9A96E" : "#ccc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {suggestions.map(s => <button key={s} onClick={() => sendMessage(s)} style={{ background: "rgba(255,255,255,0.85)", backdropFilter:"blur(8px)", border: "1px solid #E8E4DE", borderRadius: 100, padding: "5px 11px", fontSize: 12, color: "#666", cursor: "pointer" }} onMouseEnter={e => { e.target.style.borderColor = "#C9A96E"; e.target.style.color = "#1A1A1A"; }} onMouseLeave={e => { e.target.style.borderColor = "#E8E4DE"; e.target.style.color = "#666"; }}>{s}</button>)}
              </div>
              </div>{/* end content zIndex wrapper */}
            </div>
          )}

          {/* QUIZ */}
          {mode === "quiz" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 36px" }}>
              <QuizFlow onResults={(r, a) => { setQuizResults(r); setQuizAnswers({ ...a, originCity: locationName }); setMode("results"); }} onSkip={() => setMode("home")} />
            </div>
          )}

          {/* RESULTS */}
          {mode === "results" && (
            <div style={{ flex: 1, padding: "20px 26px 60px", overflowY: "auto" }}>
              <div style={{ maxWidth: 580 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                    <button onClick={() => setMode("quiz")} style={{ fontSize: 11, color: "#bbb", background: "none", border: "none", cursor: "pointer" }}>← Retake</button>
                    <span style={{ color: "#E8E4DE" }}>·</span>
                    <button onClick={() => setMode("home")} style={{ fontSize: 11, color: "#bbb", background: "none", border: "none", cursor: "pointer" }}>Home</button>
                  </div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 3 }}>Your Top Matches</h2>
                  {quizResults?.intro && <p style={{ fontSize: 13, color: "#888", lineHeight: 1.65 }}>{quizResults.intro}</p>}
                  {locationName && <div style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 9px", marginTop: 7, display: "inline-flex", alignItems: "center", gap: 4 }}><span>📍</span>From {locationName} — flights included</div>}
                </div>
                {quizResults?.destinations ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {quizResults.destinations.map(dest => <MatchCard key={dest.rank} dest={dest} rank={dest.rank} onPlanTrip={itin => { setItinerary(itin); setMode("itinerary"); }} onDeepDive={sendMessage} answers={quizAnswers} userCity={locationName} />)}
                  </div>
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#999", marginBottom: 11 }}>Couldn't load results.</div>
                    <button onClick={() => setMode("quiz")} style={{ padding: "7px 14px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Retry</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ITINERARY */}
          {mode === "itinerary" && itinerary && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <ItineraryView itinerary={itinerary} onBack={() => setMode("results")} />
            </div>
          )}

          {/* GO LOCAL */}
          {mode === "local" && (
            <GoLocalView locationName={locationName || "Santa Cruz, CA"} onBack={() => setMode("home")} />
          )}

          {/* CHAT */}
          {mode === "chat" && (
            <div style={{ flex: 1, padding: "20px 26px 140px", display: "flex", flexDirection: "column", gap: 13, overflowY: "auto" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "user" ? (
                    <div style={{ background: "linear-gradient(135deg,#1a1a2e,#2d2d5e)", color: "#fff", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5, maxWidth: "70%" }}>{msg.content}</div>
                  ) : msg.parsed ? (
                    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E8E4DE", overflow: "hidden", width: "100%" }}>
                      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", padding: "14px 18px" }}>
                        <div style={{ fontSize: 9, color: "#C9A96E", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Trip Intel</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "'Cormorant Garamond',serif" }}>{msg.parsed.destination}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, lineHeight: 1.6 }}>{msg.parsed.summary}</div>
                      </div>
                      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "#F7F5F2", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", textTransform: "uppercase", marginBottom: 3 }}>🌤 Weather</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{msg.parsed.weather?.conditions}</div>
                          <div style={{ fontSize: 11, color: "#C9A96E" }}>{msg.parsed.weather?.temperature}</div>
                          <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{msg.parsed.weather?.tip}</div>
                        </div>
                        <div style={{ background: "#F7F5F2", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", textTransform: "uppercase", marginBottom: 3 }}>👥 Crowds</div>
                          <CrowdDot level={msg.parsed.crowd?.level} />
                          <div style={{ fontSize: 11, color: "#777", marginTop: 3 }}>{msg.parsed.crowd?.description}</div>
                        </div>
                      </div>
                      <div style={{ padding: "0 18px 13px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", textTransform: "uppercase", marginBottom: 6 }}>✦ Hidden Gems</div>
                        {msg.parsed.hiddenGems?.map((g, j) => (
                          <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                            <div style={{ width: 17, height: 17, borderRadius: 5, background: "#1a1a2e", color: "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{j + 1}</div>
                            <div><div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{g.name}</div><div style={{ fontSize: 11, color: "#777" }}>{g.why}</div></div>
                          </div>
                        ))}
                        {msg.parsed.localTip && <div style={{ marginTop: 8, background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}><span style={{ color: "#C9A96E", fontWeight: 700 }}>Local secret: </span>{msg.parsed.localTip}</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", fontSize: 13, color: "#555", maxWidth: "70%", lineHeight: 1.6 }}>{msg.content}</div>
                  )}
                </div>
              ))}
              {loading && <div style={{ display: "flex", gap: 4, padding: "10px 13px", background: "#fff", borderRadius: 12, border: "1px solid #E8E4DE", width: "fit-content" }}><TypingDots /></div>}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Floating input */}
          {(mode === "chat" || mode === "results" || mode === "itinerary") && (
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 270, background: "rgba(250,250,248,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid #EDEAE4", padding: "8px 26px 15px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 540, background: "#fff", border: "1.5px solid #E8E4DE", borderRadius: 12, padding: "8px 11px", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask about any destination..." rows={1} style={{ minHeight: 20 }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 31, height: 31, borderRadius: 7, background: input.trim() ? "linear-gradient(135deg,#1a1a2e,#2d2d5e)" : "#F0EDEA", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={input.trim() ? "#C9A96E" : "#ccc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ padding: "18px 13px", overflowY: "auto", height: "calc(100vh - 52px)", position: "sticky", top: 52 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>🔥 Trending Now</span>
            <span style={{ background: "#fee2e2", color: "#ef4444", fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 5px" }}>LIVE</span>
          </div>
          <p style={{ fontSize: 10, color: "#ccc", marginBottom: 10 }}>Hot on Reddit this week</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {TRENDING.map((t, i) => (
              <button key={i} onClick={() => sendMessage(`Tell me about ${t.place} right now`)}
                style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 10, padding: "8px 10px", textAlign: "left", cursor: "pointer", width: "100%", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A96E"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#E8E4DE"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{t.emoji}</span>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>{t.place}</div><div style={{ fontSize: 10, color: "#C9A96E", fontWeight: 600 }}>{t.tag}</div></div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: t.heat > 90 ? "#ef4444" : t.heat > 80 ? "#fb923c" : "#C9A96E" }}>{t.heat}°</span>
                </div>
                <div style={{ background: "#F0EDEA", borderRadius: 2, height: 2, overflow: "hidden" }}><div style={{ width: `${t.heat}%`, height: "100%", background: t.heat > 90 ? "#ef4444" : t.heat > 80 ? "#fb923c" : "#C9A96E" }} /></div>
                <div style={{ fontSize: 9, color: "#ccc", marginTop: 3 }}>{t.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 11, background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 11, padding: "12px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2, fontFamily: "'Cormorant Garamond',serif" }}>Near you 📍</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 8, lineHeight: 1.5 }}>Hidden gems within 50 miles of you right now.</div>
            <button onClick={handleGoLocal} style={{ width: "100%", padding: "7px 0", background: "#4ade80", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#065f46", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{locLoading ? "Finding you..." : "→ Go Local"}</button>
          </div>
          {!user && (
            <div style={{ marginTop: 9, background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 11, padding: "12px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2, fontFamily: "'Cormorant Garamond',serif" }}>Save trips ✦</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 8, lineHeight: 1.5 }}>Sign in to bookmark destinations.</div>
              <button onClick={() => setShowAuth(true)} style={{ width: "100%", padding: "7px 0", background: "#C9A96E", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#1a1a2e", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Sign in free →</button>
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    </div>
  );
}
