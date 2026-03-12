import { useState, useRef, useEffect } from "react";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const SAFETY_PROMPT = `You are a geopolitical travel safety analyst. Given a destination, assess current safety. Respond ONLY in JSON:
{
  "safetyLevel": "Safe | Caution | High Risk | Avoid",
  "color": "#22c55e | #f59e0b | #ef4444 | #7f1d1d",
  "summary": "One sentence current situation summary",
  "alerts": ["alert1 if any", "alert2 if any"],
  "advisory": "Official travel advisory level e.g. Level 1: Normal Precautions"
}
Be accurate and current as of early 2026. Most popular tourist destinations are Safe.`;

const ITINERARY_PROMPT = `You are Wander, an expert travel planner. Create a detailed day-by-day itinerary. 

CRITICAL RULES:
- Respond ONLY with valid JSON. No markdown, no code blocks, no extra text before or after.
- No trailing commas anywhere in the JSON.
- Use real, specific place names for the destination.
- All prices in USD, realistic for 2026.
- grandTotal.amount must equal the sum of all dayTotal.amount values.
- amazonSearch values must be short product search terms (e.g. "travel adapter Japan type A").

Output this exact structure:
{
  "tripTitle": "5 Days in Tokyo — Cultural Deep Dive",
  "destination": "Tokyo, Japan",
  "totalDays": 5,
  "budgetSummary": {
    "daily": "$130/day",
    "total": "$650 total",
    "breakdown": "Accommodation 40%, Food 30%, Activities 20%, Transport 10%"
  },
  "packingEssentials": [
    { "item": "Item name", "why": "Why needed for this specific trip and season", "amazonSearch": "short search term" },
    { "item": "Item name", "why": "Why needed", "amazonSearch": "search term" },
    { "item": "Item name", "why": "Why needed", "amazonSearch": "search term" },
    { "item": "Item name", "why": "Why needed", "amazonSearch": "search term" },
    { "item": "Item name", "why": "Why needed", "amazonSearch": "search term" },
    { "item": "Item name", "why": "Why needed", "amazonSearch": "search term" }
  ],
  "days": [
    {
      "day": 1,
      "title": "Arrival & First Impressions",
      "theme": "Settle In",
      "moves": [
        {
          "time": "10:00 AM",
          "type": "activity",
          "title": "Senso-ji Temple, Asakusa",
          "description": "Tokyo's oldest temple — arrive early to beat crowds and catch incense smoke drifting through the gate.",
          "localTip": "Skip the main hall line and explore the Nakamise shopping street stalls for local snacks.",
          "socialSource": "r/JapanTravel",
          "estimatedCost": { "amount": 0, "currency": "USD", "note": "free entry" }
        },
        {
          "time": "1:00 PM",
          "type": "food",
          "title": "Ichiran Ramen, Shibuya",
          "description": "Solo-booth ramen experience — private wooden stall, you customize every element of your bowl.",
          "localTip": "Order the kaedama (extra noodles) for $1.50 when your bowl is almost done.",
          "socialSource": "r/ramen",
          "estimatedCost": { "amount": 14, "currency": "USD", "note": "per person" }
        },
        {
          "time": "3:30 PM",
          "type": "experience",
          "title": "Shibuya Crossing & Sky View",
          "description": "Watch the world's busiest pedestrian crossing from street level then head up to Shibuya Sky observation deck.",
          "localTip": "Sunset from Shibuya Sky (6-7pm) is worth the extra wait — book tickets online to skip queues.",
          "socialSource": "Instagram #ShibuyaSky",
          "estimatedCost": { "amount": 18, "currency": "USD", "note": "Shibuya Sky entry" }
        },
        {
          "time": "7:00 PM",
          "type": "food",
          "title": "Omoide Yokocho (Memory Lane), Shinjuku",
          "description": "Tiny alley of yakitori stalls under the train tracks — smoky, local, and absolutely unforgettable at night.",
          "localTip": "Sit at the counter and point at what looks good — most stalls don't have English menus but are welcoming.",
          "socialSource": "r/JapanTravel",
          "estimatedCost": { "amount": 25, "currency": "USD", "note": "food + drinks per person" }
        }
      ],
      "dayTotal": { "amount": 130, "currency": "USD", "note": "including accommodation est." },
      "mustEat": {
        "place": "Tsukiji Outer Market",
        "dish": "Fresh tuna sashimi breakfast set",
        "why": "Locals and chefs have come here for decades — the tuna melts differently when it's this fresh.",
        "source": "r/JapanTravel",
        "estimatedCost": { "amount": 20, "currency": "USD" }
      }
    }
  ],
  "grandTotal": { "amount": 650, "currency": "USD", "note": "per person, excludes international flights" },
  "finalTips": [
    "Get a Suica card at the airport — works on all trains, buses and convenience stores.",
    "7-Eleven and Lawson convenience stores serve genuinely great hot food for $3-5.",
    "Download Google Translate with Japanese offline — camera mode reads menus instantly."
  ]
}`;

const TRIP_PROMPT = `You are Wander, a hyper-personalised travel advisor. Suggest 3 ranked destinations based on traveller profile, real weather accuracy, geopolitical safety, and current social media travel trends (Reddit, Instagram, X/Twitter). 

Respond ONLY in JSON:
{
  "intro": "One warm personalised sentence",
  "destinations": [
    {
      "rank": 1,
      "place": "City, Country",
      "emoji": "🌸",
      "tagline": "5-7 word tagline",
      "whyMatch": "2 sentences why perfect for their profile",
      "safetyLevel": "Safe | Caution | High Risk",
      "safetyNote": "one sentence current safety situation",
      "weather": { "conditions": "brief weather", "temp": "72–85°F / 22–29°C", "vibe": "Warm" },
      "socialBuzz": { "score": 94, "hotOn": "Reddit & Instagram", "trend": "what people post about this place right now" },
      "budget": { "fit": "Perfect fit | Slightly above | Slightly below", "dailyCost": "$80–120/day", "tip": "budget tip" },
      "crowd": { "level": "Low | Moderate | High | Very High", "note": "crowds note" },
      "hiddenGem": "Specific insider spot most tourists miss",
      "bestFor": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

const INTEL_PROMPT = `You are Wander. Respond ONLY in JSON:
{
  "destination": "Place, Country",
  "summary": "2-3 sentence honest take",
  "weather": { "conditions": "weather", "temperature": "range", "tip": "tip" },
  "crowd": { "level": "Low|Moderate|High|Very High", "description": "2 sentences" },
  "hiddenGems": [{"name":"spot","why":"why"}],
  "packingList": { "essentials": ["i1","i2","i3","i4"], "clothing": ["i1","i2","i3"], "extras": ["i1","i2"] },
  "localTip": "golden local advice"
}`;

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
  { id:"terrain", question:"Are you a beach person or a mountain person?", sub:"This shapes everything — the vibe, the packing, the whole trip.", options:[
    {value:"beach",label:"Beach",emoji:"🏖",desc:"Waves, sand & golden hours"},
    {value:"mountain",label:"Mountain",emoji:"🏔",desc:"Peaks, trails & crisp air"},
    {value:"both",label:"Both",emoji:"🌍",desc:"I'll take it all"},
    {value:"city",label:"City",emoji:"🏙",desc:"Streets, culture & energy"},
  ]},
  { id:"mood", question:"What mood are you in for this trip?", sub:"Be honest — there's no wrong answer.", options:[
    {value:"explore",label:"Explore",emoji:"🧭",desc:"Discover, wander & get lost"},
    {value:"wellness",label:"Wellness",emoji:"🧘",desc:"Rest, recharge & breathe"},
    {value:"party",label:"Party",emoji:"🎉",desc:"Nightlife, music & people"},
    {value:"adventure_then_party",label:"Adventure First,\nParty After",emoji:"🤘",desc:"Hard days, big nights"},
  ]},
  { id:"group", question:"Who are you travelling with?", sub:"Group type changes everything about a destination.", options:[
    {value:"solo",label:"Solo",emoji:"🧍",desc:"Just me, my rules"},
    {value:"couple",label:"Couple",emoji:"👫",desc:"Romantic getaway"},
    {value:"friends",label:"Friends",emoji:"👯",desc:"Squad trip"},
    {value:"family",label:"Family",emoji:"👨‍👩‍👧",desc:"Kids & all"},
  ]},
  { id:"budget", question:"What's the budget looking like?", sub:"No judgment — we'll find the best for what you've got.", options:[
    {value:"tight",label:"Tight Budget",emoji:"💸",desc:"Every dollar counts"},
    {value:"medium",label:"Mid-Range",emoji:"💳",desc:"Comfortable but conscious"},
    {value:"flexible",label:"Flexible",emoji:"🤑",desc:"Treat yourself a little"},
    {value:"luxury",label:"Luxury",emoji:"💎",desc:"Only the best"},
  ]},
  { id:"dates", question:"When are you planning to go?", sub:"Exact dates help us check real weather and crowd levels.", type:"date" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const storageGet = async (key) => { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const storageSet = async (key, val) => { try { await window.storage.set(key, JSON.stringify(val)); } catch {} };

const callAI = async (system, userMsg, maxTokens = 2000) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages:[{role:"user",content:userMsg}] })
  });
  const data = await res.json();
  const raw = data.content?.[0]?.text || "";
  try { return JSON.parse(raw.replace(/```json|```/g,"").trim()); } catch { return null; }
};

const typeColors = { transport:"#3b82f6", activity:"#8b5cf6", food:"#f59e0b", accommodation:"#10b981", experience:"#ec4899" };
const typeIcons = { transport:"🚃", activity:"🎯", food:"🍜", accommodation:"🏨", experience:"✨" };

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const TypingDots = () => (
  <div style={{display:"flex",gap:5,padding:"12px 16px",background:"#fff",borderRadius:14,border:"1px solid #E8E4DE",width:"fit-content"}}>
    {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"#C9A96E",animation:"bounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
  </div>
);

const CrowdDot = ({level}) => {
  const c={Low:"#4ade80",Moderate:"#facc15",High:"#fb923c","Very High":"#f87171"};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:c[level]||"#94a3b8"}}/><span style={{fontWeight:700,color:c[level]||"#94a3b8",fontSize:12}}>{level}</span></span>;
};

const SafetyBadge = ({level, note}) => {
  const cfg = {
    "Safe":{bg:"#f0fdf4",border:"#bbf7d0",text:"#16a34a",icon:"✓"},
    "Caution":{bg:"#fffbeb",border:"#fde68a",text:"#d97706",icon:"⚠"},
    "High Risk":{bg:"#fef2f2",border:"#fecaca",text:"#dc2626",icon:"⚠"},
    "Avoid":{bg:"#7f1d1d",border:"#991b1b",text:"#fff",icon:"✕"},
  };
  const s = cfg[level] || cfg["Safe"];
  return (
    <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:9,padding:"7px 12px",display:"flex",alignItems:"flex-start",gap:7,marginTop:10}}>
      <span style={{fontSize:12,color:s.text,fontWeight:800,flexShrink:0}}>{s.icon}</span>
      <div>
        <span style={{fontSize:11,fontWeight:700,color:s.text}}>{level}</span>
        {note && <span style={{fontSize:11,color:s.text,opacity:0.8}}> — {note}</span>}
      </div>
    </div>
  );
};

// ─── ITINERARY VIEW ────────────────────────────────────────────────────────────

const ItineraryView = ({ itinerary, onFinalize, onBack }) => {
  const [expandedDay, setExpandedDay] = useState(1);
  const [finalized, setFinalized] = useState(false);

  const exportToCalendar = () => {
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//WanderLocal//EN","CALSCALE:GREGORIAN"];
    const today = new Date();
    itinerary.days.forEach((day, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() + idx);
      const dateStr = d.toISOString().slice(0,10).replace(/-/g,"");
      day.moves.forEach(move => {
        const timeStr = move.time?.replace(":","").replace(" AM","00").replace(" PM","00") || "090000";
        lines.push("BEGIN:VEVENT",
          `DTSTART:${dateStr}T${timeStr.padStart(6,"0")}`,
          `DTEND:${dateStr}T${timeStr.padStart(6,"0")}`,
          `SUMMARY:${move.title} — ${itinerary.destination}`,
          `DESCRIPTION:${move.description?.replace(/\n/g," ")} | Est. cost: $${move.estimatedCost?.amount} ${move.estimatedCost?.currency || ""}. Tip: ${move.localTip || ""}`,
          "END:VEVENT");
      });
      if (day.mustEat) {
        lines.push("BEGIN:VEVENT",
          `DTSTART:${dateStr}T190000`,`DTEND:${dateStr}T210000`,
          `SUMMARY:🍜 Dinner: ${day.mustEat.place} — ${itinerary.destination}`,
          `DESCRIPTION:Must try: ${day.mustEat.dish}. ${day.mustEat.why}`,
          "END:VEVENT");
      }
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")],{type:"text/calendar"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `WanderLocal_${itinerary.destination.replace(/,?\s+/g,"_")}.ics`;
    a.click();
  };

  const exportShoppingList = () => {
    let text = `🎒 PACKING LIST — ${itinerary.tripTitle}\n${"─".repeat(50)}\n\n`;
    itinerary.packingEssentials.forEach((item,i) => {
      text += `${i+1}. ${item.item}\n   Why: ${item.why}\n   🛒 Amazon: https://www.amazon.com/s?k=${encodeURIComponent(item.amazonSearch)}\n\n`;
    });
    text += `\n💰 BUDGET SUMMARY\n${"─".repeat(50)}\n`;
    text += `Daily: ${itinerary.budgetSummary.daily}\nTotal: ${itinerary.budgetSummary.total}\n${itinerary.budgetSummary.breakdown}\n\n`;
    text += `🗓️ TRIP TOTAL: ${itinerary.grandTotal.currency === "USD" ? "$" : ""}${itinerary.grandTotal.amount} ${itinerary.grandTotal.currency}\n`;
    text += `(${itinerary.grandTotal.note})\n\n`;
    itinerary.days.forEach(day => {
      text += `DAY ${day.day}: ${day.title} — Est. $${day.dayTotal.amount}\n`;
      day.moves.forEach(m => text += `  ${m.time} ${m.title} (~$${m.estimatedCost?.amount})\n`);
      if (day.mustEat) text += `  🍜 Must Eat: ${day.mustEat.place} — ${day.mustEat.dish} (~$${day.mustEat.estimatedCost?.amount})\n`;
      text += "\n";
    });
    text += `\n📋 FINAL TIPS\n${"─".repeat(50)}\n`;
    itinerary.finalTips.forEach((t,i) => text += `${i+1}. ${t}\n`);
    const blob = new Blob([text],{type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `WanderLocal_${itinerary.destination.replace(/,?\s+/g,"_")}_Plan.txt`;
    a.click();
  };

  return (
    <div style={{padding:"28px 36px 100px",maxWidth:720,animation:"fadeUp 0.4s ease"}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <button onClick={onBack} style={{fontSize:11,color:"#bbb",background:"none",border:"none",cursor:"pointer",marginBottom:14}}>← Back to results</button>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,color:"#1A1A1A",marginBottom:6}}>{itinerary.tripTitle}</h2>
        <p style={{fontSize:13,color:"#888"}}>{itinerary.destination} · {itinerary.totalDays} days · {itinerary.budgetSummary.daily}</p>
      </div>

      {/* Budget Overview */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:18,padding:"20px 24px",marginBottom:22,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(201,169,110,0.15)"}}/>
        <div style={{fontSize:10,color:"#C9A96E",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>💰 Budget Overview</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:3}}>Daily Est.</div><div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Cormorant Garamond',serif"}}>{itinerary.budgetSummary.daily}</div></div>
          <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:3}}>Trip Total</div><div style={{fontSize:20,fontWeight:700,color:"#C9A96E",fontFamily:"'Cormorant Garamond',serif"}}>{itinerary.budgetSummary.total}</div></div>
          <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:3}}>Grand Total</div><div style={{fontSize:20,fontWeight:700,color:"#4ade80",fontFamily:"'Cormorant Garamond',serif"}}>${itinerary.grandTotal.amount}</div></div>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:10}}>{itinerary.budgetSummary.breakdown}</div>
      </div>

      {/* Packing List with Amazon Links */}
      <div style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:16,padding:"18px 22px",marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#999",letterSpacing:"0.08em"}}>🎒 Packing Essentials</div>
          <span style={{fontSize:10,background:"#fff7ed",border:"1px solid #fed7aa",color:"#ea580c",borderRadius:6,padding:"2px 8px",fontWeight:700}}>Amazon Links Included</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {itinerary.packingEssentials.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,padding:"10px 12px",background:"#F7F5F2",borderRadius:11}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1A1A1A",marginBottom:2}}>{item.item}</div>
                <div style={{fontSize:11,color:"#888"}}>{item.why}</div>
              </div>
              <a href={`https://www.amazon.com/s?k=${encodeURIComponent(item.amazonSearch)}`} target="_blank" rel="noreferrer"
                style={{display:"flex",alignItems:"center",gap:4,background:"#FF9900",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:"#fff",textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>
                🛒 Amazon
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Day-by-Day Itinerary */}
      <div style={{marginBottom:22}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#999",letterSpacing:"0.08em",marginBottom:14}}>🗓️ Day-by-Day Plan</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {itinerary.days.map(day=>(
            <div key={day.day} style={{background:"#fff",border:`1.5px solid ${expandedDay===day.day?"#C9A96E":"#E8E4DE"}`,borderRadius:16,overflow:"hidden",transition:"border-color 0.2s"}}>
              {/* Day header */}
              <button onClick={()=>setExpandedDay(expandedDay===day.day?null:day.day)}
                style={{width:"100%",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:expandedDay===day.day?"linear-gradient(135deg,#1a1a2e,#16213e)":"#fff",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"background 0.2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:34,height:34,borderRadius:10,background:expandedDay===day.day?"rgba(201,169,110,0.2)":"#F7F5F2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:13,fontWeight:800,color:expandedDay===day.day?"#C9A96E":"#555"}}>D{day.day}</span>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:expandedDay===day.day?"#fff":"#1A1A1A"}}>{day.title}</div>
                    <div style={{fontSize:11,color:expandedDay===day.day?"rgba(255,255,255,0.45)":"#bbb"}}>{day.theme} · {day.moves.length} stops</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:expandedDay===day.day?"#C9A96E":"#1A1A1A"}}>${day.dayTotal.amount}</div>
                  <div style={{fontSize:10,color:expandedDay===day.day?"rgba(255,255,255,0.35)":"#bbb"}}>est. per person</div>
                </div>
              </button>

              {/* Day content */}
              {expandedDay===day.day && (
                <div style={{padding:"16px 18px",borderTop:"1px solid #E8E4DE"}}>
                  {/* Timeline */}
                  <div style={{position:"relative"}}>
                    {/* Vertical line */}
                    <div style={{position:"absolute",left:15,top:0,bottom:0,width:2,background:"#F0EDEA",zIndex:0}}/>
                    <div style={{display:"flex",flexDirection:"column",gap:0}}>
                      {day.moves.map((move,mi)=>(
                        <div key={mi} style={{display:"flex",gap:14,marginBottom:16,position:"relative",zIndex:1}}>
                          {/* Icon */}
                          <div style={{width:30,height:30,borderRadius:9,background:typeColors[move.type]||"#C9A96E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,boxShadow:"0 0 0 3px #FAFAF8"}}>
                            {typeIcons[move.type]||"📍"}
                          </div>
                          <div style={{flex:1,paddingBottom:mi<day.moves.length-1?0:0}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
                              <div>
                                <span style={{fontSize:10,color:"#bbb",fontWeight:600,marginRight:8}}>{move.time}</span>
                                <span style={{fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{move.title}</span>
                              </div>
                              <div style={{flexShrink:0,textAlign:"right"}}>
                                <div style={{fontSize:13,fontWeight:700,color:"#1A1A1A"}}>${move.estimatedCost?.amount}</div>
                                <div style={{fontSize:9,color:"#bbb"}}>{move.estimatedCost?.note||"per person"}</div>
                              </div>
                            </div>
                            <div style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:6}}>{move.description}</div>
                            {move.localTip && (
                              <div style={{background:"#F7F5F2",borderRadius:8,padding:"7px 10px",marginBottom:4}}>
                                <div style={{fontSize:10,color:"#C9A96E",fontWeight:700,marginBottom:2}}>💡 Local Tip</div>
                                <div style={{fontSize:11,color:"#666"}}>{move.localTip}</div>
                                {move.socialSource && <div style={{fontSize:10,color:"#bbb",marginTop:3}}>📡 via {move.socialSource}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Must Eat */}
                  {day.mustEat && (
                    <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:13,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",marginTop:4}}>
                      <span style={{fontSize:20,flexShrink:0}}>🍜</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#C9A96E",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Must Eat Today · Sourced from {day.mustEat.source}</div>
                        <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>{day.mustEat.place}</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginBottom:4}}>Order: <span style={{color:"#C9A96E",fontWeight:600}}>{day.mustEat.dish}</span></div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{day.mustEat.why}</div>
                      </div>
                      <div style={{flexShrink:0,textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#C9A96E"}}>${day.mustEat.estimatedCost?.amount}</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>est.</div>
                      </div>
                    </div>
                  )}

                  {/* Day total */}
                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,paddingTop:12,borderTop:"1px solid #F0EDEA"}}>
                    <div style={{background:"#F7F5F2",borderRadius:10,padding:"8px 14px",display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#999"}}>Day {day.day} Total:</span>
                      <span style={{fontSize:15,fontWeight:800,color:"#1A1A1A"}}>${day.dayTotal.amount} <span style={{fontSize:11,fontWeight:400,color:"#bbb"}}>/ person</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total Card */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:18,padding:"22px 24px",marginBottom:22}}>
        <div style={{fontSize:11,color:"#C9A96E",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>💰 Grand Total Summary</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {itinerary.days.map(day=>(
            <div key={day.day} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Day {day.day} — {day.title}</span>
              <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>${day.dayTotal.amount}</span>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Estimated Total (per person)</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{itinerary.grandTotal.note}</div>
          </div>
          <div style={{fontSize:28,fontWeight:800,color:"#C9A96E",fontFamily:"'Cormorant Garamond',serif"}}>${itinerary.grandTotal.amount}</div>
        </div>
      </div>

      {/* Final Tips */}
      {itinerary.finalTips?.length > 0 && (
        <div style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:14,padding:"16px 20px",marginBottom:22}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#999",marginBottom:12}}>📋 Final Pro Tips</div>
          {itinerary.finalTips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{width:20,height:20,borderRadius:6,background:"#1a1a2e",color:"#C9A96E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</span>
              <span style={{fontSize:12,color:"#555",lineHeight:1.6}}>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* FINALIZE TRIP */}
      {!finalized ? (
        <div style={{background:"linear-gradient(135deg,#C9A96E,#b8933d)",borderRadius:18,padding:"22px 24px",textAlign:"center"}}>
          <div style={{fontSize:22,marginBottom:8}}>✈️</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#1a1a2e",marginBottom:6}}>Ready to make it official?</div>
          <div style={{fontSize:13,color:"rgba(26,26,46,0.6)",marginBottom:18,lineHeight:1.6}}>Export your full itinerary to your calendar + get your Amazon shopping list ready to go.</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>{exportToCalendar();setFinalized(true);}}
              style={{background:"#1a1a2e",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:7}}>
              📅 Add to Calendar (.ics)
            </button>
            <button onClick={exportShoppingList}
              style={{background:"#FF9900",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:7}}>
              🛒 Amazon Shopping List
            </button>
          </div>
        </div>
      ) : (
        <div style={{background:"#f0fdf4",border:"2px solid #4ade80",borderRadius:18,padding:"22px 24px",textAlign:"center",animation:"fadeUp 0.4s ease"}}>
          <div style={{fontSize:30,marginBottom:8}}>🎉</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#16a34a",marginBottom:6}}>Trip Finalized!</div>
          <div style={{fontSize:13,color:"#555",marginBottom:16,lineHeight:1.6}}>Your .ics calendar file is downloading. Open it to add all events to your phone or laptop calendar (works with Apple Calendar, Google Calendar & Outlook).</div>
          <button onClick={exportShoppingList}
            style={{background:"#FF9900",color:"#fff",border:"none",borderRadius:12,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            🛒 Also get Amazon Shopping List
          </button>
        </div>
      )}
    </div>
  );
};

// ─── QUIZ FLOW ────────────────────────────────────────────────────────────────

const QuizFlow = ({ onResults, onSkip }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [dateForm, setDateForm] = useState({ month:"", startDay:"", endDay:"", duration:"" });
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const handleOption = (value) => {
    setSelected(value);
    setTimeout(() => {
      const newAnswers = { ...answers, [current.id]: value };
      setAnswers(newAnswers);
      setSelected(null);
      if (step < STEPS.length - 1) setStep(s => s+1);
      else submitQuiz(newAnswers);
    }, 280);
  };

  const handleDateSubmit = () => {
    if (!dateForm.month || !dateForm.startDay) return;
    const dur = dateForm.endDay ? parseInt(dateForm.endDay) - parseInt(dateForm.startDay) + 1 : 7;
    const dateStr = `${dateForm.month} ${dateForm.startDay}${dateForm.endDay?`–${dateForm.endDay}`:""}`;
    const newAnswers = { ...answers, dates: dateStr, month: dateForm.month, duration: dur };
    submitQuiz(newAnswers);
  };

  const submitQuiz = async (ans) => {
    setLoading(true);
    const profileText = `Traveller: terrain=${ans.terrain}, mood=${ans.mood}, group=${ans.group}, budget=${ans.budget}, dates=${ans.dates}, duration=${ans.duration||7} days`;
    const results = await callAI(TRIP_PROMPT, profileText, 2000);
    onResults(results, ans);
    setLoading(false);
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",gap:18,animation:"fadeUp 0.4s ease"}}>
      <div style={{fontSize:40}}>🌍</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:"#1A1A1A",textAlign:"center"}}>Analysing your perfect destinations...</div>
      <div style={{fontSize:13,color:"#bbb",textAlign:"center",maxWidth:300,lineHeight:1.6}}>Checking weather, safety reports, and what's trending on Reddit, Instagram & X right now.</div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
        {["🌤 Weather","🛡 Safety","📡 Trends","🎯 Matching"].map((s,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:100,padding:"5px 11px",fontSize:11,color:"#999",animation:"pulse 1.5s infinite",animationDelay:`${i*0.35}s`}}>{s}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{width:"100%",maxWidth:520,animation:"fadeUp 0.4s ease"}}>
      <div style={{marginBottom:26}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
          <span style={{fontSize:11,fontWeight:700,color:"#bbb",textTransform:"uppercase",letterSpacing:"0.08em"}}>Step {step+1} of {STEPS.length}</span>
          <button onClick={onSkip} style={{fontSize:11,color:"#ccc",background:"none",border:"none",cursor:"pointer"}}>Skip →</button>
        </div>
        <div style={{background:"#E8E4DE",borderRadius:4,height:3,overflow:"hidden"}}>
          <div style={{width:`${((step+1)/STEPS.length)*100}%`,height:"100%",background:"linear-gradient(90deg,#C9A96E,#1a1a2e)",borderRadius:4,transition:"width 0.4s ease"}}/>
        </div>
      </div>

      <div style={{marginBottom:24,textAlign:"center"}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(20px,4vw,28px)",fontWeight:700,color:"#1A1A1A",lineHeight:1.2,marginBottom:7}}>{current.question}</h2>
        {current.sub && <p style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>{current.sub}</p>}
      </div>

      {current.type==="date" ? (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:8}}>Month</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              {MONTHS.map(m=>(
                <button key={m} onClick={()=>setDateForm(f=>({...f,month:m}))}
                  style={{padding:"8px 4px",background:dateForm.month===m?"#1a1a2e":"#fff",border:`1.5px solid ${dateForm.month===m?"#1a1a2e":"#E8E4DE"}`,borderRadius:9,fontSize:11,fontWeight:600,color:dateForm.month===m?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>
                  {m.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["From Day","startDay"],["To Day (optional)","endDay"]].map(([label,key])=>(
              <div key={key}>
                <label style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:7}}>{label}</label>
                <input type="number" min="1" max="31" placeholder="e.g. 15" value={dateForm[key]}
                  onChange={e=>setDateForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%",padding:"11px 14px",background:"#fff",border:"1.5px solid #E8E4DE",borderRadius:11,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#1A1A1A",outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          <button onClick={handleDateSubmit} disabled={!dateForm.month||!dateForm.startDay}
            style={{width:"100%",padding:"14px 0",background:dateForm.month&&dateForm.startDay?"linear-gradient(135deg,#1a1a2e,#2d2d5e)":"#F0EDEA",border:"none",borderRadius:14,fontSize:14,fontWeight:700,color:dateForm.month&&dateForm.startDay?"#fff":"#bbb",cursor:dateForm.month&&dateForm.startDay?"pointer":"default",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>
            Find My Destinations →
          </button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {current.options.map(opt=>(
            <button key={opt.value} onClick={()=>handleOption(opt.value)}
              style={{background:selected===opt.value?"#1a1a2e":"#fff",border:`1.5px solid ${selected===opt.value?"#1a1a2e":"#E8E4DE"}`,borderRadius:16,padding:"18px 16px",textAlign:"left",cursor:"pointer",transform:selected===opt.value?"scale(0.97)":"scale(1)",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:26,marginBottom:10}}>{opt.emoji}</div>
              <div style={{fontSize:14,fontWeight:700,color:selected===opt.value?"#fff":"#1A1A1A",marginBottom:4,whiteSpace:"pre-line"}}>{opt.label}</div>
              <div style={{fontSize:11,color:selected===opt.value?"rgba(255,255,255,0.5)":"#bbb",lineHeight:1.4}}>{opt.desc}</div>
            </button>
          ))}
        </div>
      )}
      {step>0 && <button onClick={()=>{setStep(s=>s-1);setSelected(null);}} style={{marginTop:16,width:"100%",padding:"10px 0",background:"transparent",border:"none",color:"#ccc",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>}
    </div>
  );
};

// ─── DESTINATION MATCH CARD ────────────────────────────────────────────────────

const MatchCard = ({ dest, rank, onPlanTrip, onDeepDive, answers }) => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(false);
  const rankColors = ["#C9A96E","#94a3b8","#cd7c49"];
  const rankLabels = ["Best Match","2nd Pick","3rd Pick"];
  const buzzColor = dest.socialBuzz.score>85?"#ef4444":dest.socialBuzz.score>70?"#fb923c":"#C9A96E";

  const handlePlanTrip = async () => {
    setLoadingPlan(true);
    setPlanError(false);
    const days = Math.min(answers?.duration || 5, 7);
    const prompt = `Destination: ${dest.place}
Duration: ${days} days
Budget: ${answers?.budget || "medium"} (tight=$50/day, medium=$120/day, flexible=$200/day, luxury=$400+/day)
Group: ${answers?.group || "solo"}
Mood: ${answers?.mood || "explore"}
Month: ${answers?.month || "March"}

Generate a complete ${days}-day itinerary with ${days} day objects. Each day: 3-4 moves + 1 mustEat. Be specific with real local places, accurate 2026 USD prices. Packing list should be specific to this destination and season.`;

    try {
      const raw = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: ITINERARY_PROMPT,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await raw.json();
      const text = data.content?.[0]?.text || "";
      let itinerary = null;
      try {
        itinerary = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch {
        // try extracting JSON from between first { and last }
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          try { itinerary = JSON.parse(text.slice(start, end + 1)); } catch {}
        }
      }
      if (itinerary && itinerary.days) {
        onPlanTrip(itinerary);
      } else {
        setPlanError(true);
      }
    } catch {
      setPlanError(true);
    }
    setLoadingPlan(false);
  };

  return (
    <div style={{background:"#fff",borderRadius:20,border:`2px solid ${rank===1?"#C9A96E":"#E8E4DE"}`,overflow:"hidden",boxShadow:rank===1?"0 8px 40px rgba(201,169,110,0.15)":"0 4px 20px rgba(0,0,0,0.04)",animation:"fadeUp 0.5s ease",animationDelay:`${(rank-1)*0.12}s`,animationFillMode:"both"}}>
      <div style={{background:rank===1?"linear-gradient(135deg,#1a1a2e,#16213e)":"linear-gradient(135deg,#2a2a2a,#1a1a1a)",padding:"20px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:`rgba(${rank===1?"201,169,110":"120,120,120"},0.1)`}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
              <div style={{background:rankColors[rank-1],borderRadius:7,padding:"2px 9px",fontSize:10,fontWeight:800,color:rank===1?"#1a1a2e":"#fff"}}>#{rank} {rankLabels[rank-1]}</div>
              <span style={{fontSize:11,background:"rgba(255,255,255,0.1)",borderRadius:5,padding:"2px 7px",color:"rgba(255,255,255,0.6)"}}>{dest.emoji}</span>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Cormorant Garamond',serif",marginBottom:3}}>{dest.place}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontStyle:"italic",marginBottom:10}}>{dest.tagline}</div>
            {/* Safety badge */}
            <SafetyBadge level={dest.safetyLevel} note={dest.safetyNote} />
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:12}}>
          {dest.bestFor.map(t=><span key={t} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"3px 9px",fontSize:10,color:"rgba(255,255,255,0.55)"}}>{t}</span>)}
        </div>
      </div>

      <div style={{padding:"18px 24px",display:"flex",flexDirection:"column",gap:13}}>
        <div style={{background:"#F7F5F2",borderRadius:13,padding:"12px 15px"}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"#999",marginBottom:5}}>✦ Why it's your match</div>
          <div style={{fontSize:13,color:"#444",lineHeight:1.65}}>{dest.whyMatch}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
          <div style={{background:"#F7F5F2",borderRadius:12,padding:"11px 12px"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#bbb",marginBottom:5}}>🌤 Weather</div>
            <div style={{fontSize:13,fontWeight:700,color:"#1A1A1A",marginBottom:2}}>{dest.weather.vibe}</div>
            <div style={{fontSize:10,color:"#C9A96E",fontWeight:600,marginBottom:3}}>{dest.weather.temp}</div>
            <div style={{fontSize:10,color:"#888",lineHeight:1.4}}>{dest.weather.conditions}</div>
          </div>
          <div style={{background:"#F7F5F2",borderRadius:12,padding:"11px 12px"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#bbb",marginBottom:5}}>📡 Social Buzz</div>
            <div style={{fontSize:18,fontWeight:800,color:buzzColor,marginBottom:2}}>{dest.socialBuzz.score}<span style={{fontSize:10,fontWeight:500,color:"#bbb"}}>/100</span></div>
            <div style={{background:"#E8E4DE",borderRadius:3,height:3,marginBottom:4,overflow:"hidden"}}>
              <div style={{width:`${dest.socialBuzz.score}%`,height:"100%",background:buzzColor,borderRadius:3}}/>
            </div>
            <div style={{fontSize:9,color:"#aaa"}}>{dest.socialBuzz.hotOn}</div>
          </div>
          <div style={{background:"#F7F5F2",borderRadius:12,padding:"11px 12px"}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#bbb",marginBottom:5}}>👥 Crowds</div>
            <CrowdDot level={dest.crowd.level}/>
            <div style={{fontSize:10,color:"#888",lineHeight:1.4,marginTop:4}}>{dest.crowd.note}</div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F7F5F2",borderRadius:12,padding:"11px 15px"}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#bbb",marginBottom:3}}>💰 Budget</div>
            <div style={{fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{dest.budget.dailyCost} <span style={{fontSize:11,color:"#999",fontWeight:400}}>/ day</span></div>
            <div style={{fontSize:11,color:"#777",marginTop:2}}>{dest.budget.tip}</div>
          </div>
          <div style={{background:dest.budget.fit==="Perfect fit"?"#f0fdf4":"#fff7ed",border:`1px solid ${dest.budget.fit==="Perfect fit"?"#bbf7d0":"#fed7aa"}`,borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,color:dest.budget.fit==="Perfect fit"?"#16a34a":"#ea580c",flexShrink:0}}>{dest.budget.fit}</div>
        </div>

        <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:13,padding:"12px 16px",display:"flex",gap:10}}>
          <span style={{fontSize:15,flexShrink:0}}>💡</span>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:"#C9A96E",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Hidden Gem</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{dest.hiddenGem}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          <button onClick={()=>onDeepDive(dest.place)}
            style={{padding:"11px 0",background:"#F7F5F2",border:"1px solid #E8E4DE",borderRadius:12,fontSize:12,fontWeight:600,color:"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            → Quick Intel
          </button>
          <button onClick={handlePlanTrip} disabled={loadingPlan}
            style={{padding:"11px 0",background:loadingPlan?"#2a2a4a":rank===1?"linear-gradient(135deg,#1a1a2e,#2d2d5e)":"#1a1a2e",border:"none",borderRadius:12,fontSize:12,fontWeight:700,color:"#fff",cursor:loadingPlan?"default":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"background 0.3s"}}>
            {loadingPlan ? "⏳ Building..." : "🗓 Plan This Trip"}
          </button>
        </div>
        {loadingPlan && (
          <div style={{fontSize:11,color:"#999",textAlign:"center",lineHeight:1.6,animation:"pulse 1.5s infinite"}}>
            Checking safety, weather & social trends — building your priced itinerary...
          </div>
        )}
        {planError && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:12,color:"#dc2626",fontWeight:600,marginBottom:3}}>Couldn't generate itinerary</div>
            <div style={{fontSize:11,color:"#ef4444",marginBottom:8}}>The AI response timed out. Click retry — it usually works second time.</div>
            <button onClick={handlePlanTrip} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:7,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retry →</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

const AuthModal = ({ onClose, onAuth }) => {
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    const {name,email,password}=form;
    if (!email||!password){setError("Please fill in all fields.");setLoading(false);return;}
    if (password.length<6){setError("Password needs to be at least 6 characters.");setLoading(false);return;}
    const key=`user:${email.toLowerCase()}`;
    if (mode==="signup"){
      if (!name.trim()){setError("Please enter your name.");setLoading(false);return;}
      if (await storageGet(key)){setError("An account already exists with this email.");setLoading(false);return;}
      const user={name:name.trim(),email:email.toLowerCase(),password};
      await storageSet(key,user); onAuth(user);
    } else {
      const stored=await storageGet(key);
      if (!stored||stored.password!==password){setError("Invalid email or password.");setLoading(false);return;}
      onAuth(stored);
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:22,padding:"32px 32px 26px",width:"100%",maxWidth:380,boxShadow:"0 24px 80px rgba(0,0,0,0.18)",animation:"fadeUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:40,height:40,background:"linear-gradient(135deg,#1a1a2e,#C9A96E)",borderRadius:12,fontSize:17,marginBottom:10}}>✦</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#1A1A1A",marginBottom:3}}>{mode==="login"?"Welcome back":"Create account"}</h2>
          <p style={{fontSize:12,color:"#bbb"}}>{mode==="login"?"Access your saved trips":"Save trips & personalised plans"}</p>
        </div>
        <div style={{display:"flex",background:"#F7F5F2",borderRadius:10,padding:3,marginBottom:18}}>
          {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",background:mode===m?"#fff":"transparent",color:mode===m?"#1A1A1A":"#999",fontWeight:mode===m?700:500,fontSize:12,cursor:"pointer",boxShadow:mode===m?"0 1px 6px rgba(0,0,0,0.08)":"none",transition:"all 0.18s",fontFamily:"'DM Sans',sans-serif"}}>{m==="login"?"Sign In":"Sign Up"}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {mode==="signup"&&<input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" style={{background:"#F7F5F2",border:"1.5px solid #E8E4DE",borderRadius:10,padding:"11px 14px",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",color:"#1A1A1A",width:"100%",boxSizing:"border-box"}}/>}
          <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" type="email" style={{background:"#F7F5F2",border:"1.5px solid #E8E4DE",borderRadius:10,padding:"11px 14px",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",color:"#1A1A1A",width:"100%",boxSizing:"border-box"}}/>
          <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password" type="password" onKeyDown={e=>e.key==="Enter"&&submit()} style={{background:"#F7F5F2",border:"1.5px solid #E8E4DE",borderRadius:10,padding:"11px 14px",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",color:"#1A1A1A",width:"100%",boxSizing:"border-box"}}/>
        </div>
        {error&&<div style={{marginTop:9,fontSize:12,color:"#ef4444",background:"#fef2f2",borderRadius:7,padding:"7px 11px"}}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{marginTop:14,width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#1a1a2e,#2d2d5e)",color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:loading?0.7:1}}>
          {loading?"...":mode==="login"?"Sign In →":"Create Account →"}
        </button>
        <button onClick={onClose} style={{marginTop:10,width:"100%",padding:"8px 0",background:"transparent",color:"#ccc",border:"none",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function WanderLocal() {
  const [mode,setMode]=useState("home"); // home | quiz | results | chat | itinerary
  const [quizResults,setQuizResults]=useState(null);
  const [quizAnswers,setQuizAnswers]=useState(null);
  const [itinerary,setItinerary]=useState(null);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [user,setUser]=useState(null);
  const [showAuth,setShowAuth]=useState(false);
  const [showSaved,setShowSaved]=useState(false);
  const [savedIds,setSavedIds]=useState([]);
  const bottomRef=useRef(null);

  useEffect(()=>{(async()=>{const s=await storageGet("session");if(s){setUser(s);const t=(await storageGet(`trips:${s.email}`))||[];setSavedIds(t.map(x=>x.destination));}})();},[]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  const handleAuth=async(u)=>{await storageSet("session",u);setUser(u);setShowAuth(false);const t=(await storageGet(`trips:${u.email}`))||[];setSavedIds(t.map(x=>x.destination));};
  const handleSignOut=async()=>{await storageSet("session",null);setUser(null);setSavedIds([]);};
  const onTripSaved=(dest)=>setSavedIds(prev=>[...prev,dest]);

  const sendMessage=async(text)=>{
    const userText=text||input.trim();
    if(!userText||loading)return;
    setInput(""); setMode("chat");
    const newMessages=[...messages,{role:"user",content:userText}];
    setMessages(newMessages); setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:INTEL_PROMPT,messages:newMessages.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();
      const raw=data.content?.[0]?.text||"";
      let parsed=null;
      try{parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());}catch{}
      setMessages(prev=>[...prev,{role:"assistant",content:raw,parsed}]);
    }catch{setMessages(prev=>[...prev,{role:"assistant",content:"Something went wrong.",parsed:null}]);}
    setLoading(false);
  };

  const handleQuizResults=(results,answers)=>{setQuizResults(results);setQuizAnswers(answers);setMode("results");};
  const handlePlanTrip=(itin)=>{setItinerary(itin);setMode("itinerary");};

  const suggestions=["Yosemite late March 🏔","Tokyo cherry blossoms 🌸","Santorini in May 🏛","Patagonia 10 days 🥾"];

  return (
    <div style={{minHeight:"100vh",background:"#FAFAF8",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
        textarea{resize:none;outline:none;border:none;background:transparent;width:100%;font-family:'DM Sans',sans-serif;font-size:15px;color:#1A1A1A;line-height:1.5}
        textarea::placeholder{color:#bbb}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        button{font-family:'DM Sans',sans-serif}
        a{text-decoration:none}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(250,250,248,0.96)",backdropFilter:"blur(14px)",borderBottom:"1px solid #EDEAE4",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setMode("home")} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer"}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#1a1a2e,#C9A96E)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✦</div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:700,color:"#1A1A1A"}}>WanderLocal</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          {mode!=="home"&&<button onClick={()=>setMode("home")} style={{fontSize:12,color:"#888",background:"#fff",border:"1px solid #E8E4DE",borderRadius:9,padding:"6px 12px",cursor:"pointer"}}>← Home</button>}
          {user?(
            <>
              <button onClick={()=>setShowSaved(true)} style={{display:"flex",alignItems:"center",gap:5,background:"#fff",border:"1px solid #E8E4DE",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:600,color:"#555",cursor:"pointer"}}>
                🗺 Trips {savedIds.length>0&&<span style={{background:"#1a1a2e",color:"#C9A96E",borderRadius:5,padding:"1px 6px",fontSize:10,fontWeight:700}}>{savedIds.length}</span>}
              </button>
              <div style={{display:"flex",alignItems:"center",gap:7,background:"#F7F5F2",borderRadius:9,padding:"5px 10px"}}>
                <div style={{width:24,height:24,background:"linear-gradient(135deg,#1a1a2e,#2d2d5e)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#C9A96E",fontWeight:700}}>{user.name[0].toUpperCase()}</div>
                <span style={{fontSize:12,fontWeight:600,color:"#1A1A1A"}}>{user.name.split(" ")[0]}</span>
                <button onClick={handleSignOut} style={{fontSize:11,color:"#ccc",background:"none",border:"none",cursor:"pointer"}}>out</button>
              </div>
            </>
          ):(
            <button onClick={()=>setShowAuth(true)} style={{background:"linear-gradient(135deg,#1a1a2e,#2d2d5e)",color:"#fff",border:"none",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Sign In</button>
          )}
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#ccc"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite"}}/>Live
          </div>
        </div>
      </nav>

      {/* LAYOUT */}
      <div style={{paddingTop:56,display:"grid",gridTemplateColumns:"1fr 280px",minHeight:"calc(100vh - 56px)",maxWidth:1140,margin:"0 auto"}}>

        {/* LEFT MAIN */}
        <div style={{borderRight:"1px solid #EDEAE4",display:"flex",flexDirection:"column",overflowY:"auto"}}>

          {/* HOME */}
          {mode==="home"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 40px 40px",animation:"fadeUp 0.5s ease"}}>
              <div style={{textAlign:"center",maxWidth:480,marginBottom:36}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"#fff",border:"1px solid #E8E4DE",borderRadius:100,padding:"5px 13px",marginBottom:18,fontSize:11,color:"#999"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80"}}/>
                  AI · Live Weather · Safety · Social Trends
                </div>
                <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(32px,5vw,56px)",fontWeight:700,color:"#1A1A1A",lineHeight:1.08,letterSpacing:"-0.02em",marginBottom:11}}>
                  Ask like you're texting<br/>
                  <span style={{background:"linear-gradient(90deg,#C9A96E,#1a1a2e,#C9A96E)",backgroundSize:"200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s infinite linear"}}>a local friend.</span>
                </h1>
                <p style={{fontSize:14,color:"#aaa",lineHeight:1.7}}>We check live weather, geopolitical safety, and what's trending on Reddit, Instagram & X — then build your full day-by-day itinerary with prices.</p>
              </div>

              {/* Quiz CTA */}
              <button onClick={()=>setMode("quiz")} style={{width:"100%",maxWidth:480,padding:"20px 24px",background:"linear-gradient(135deg,#1a1a2e,#16213e)",border:"none",borderRadius:18,cursor:"pointer",textAlign:"left",marginBottom:16,position:"relative",overflow:"hidden",transition:"transform 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{position:"absolute",top:-15,right:-15,width:90,height:90,borderRadius:"50%",background:"rgba(201,169,110,0.15)"}}/>
                <div style={{fontSize:10,color:"#C9A96E",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>✦ Smart Match</div>
                <div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Cormorant Garamond',serif",marginBottom:5}}>Find my perfect destination</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:13,lineHeight:1.6}}>5 quick questions → 3 AI-ranked destinations with safety alerts, live weather, social buzz & a full priced itinerary.</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["🏖 Terrain","😌 Mood","👥 Group","💰 Budget","📅 Dates"].map(t=><span key={t} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"3px 9px",fontSize:10,color:"rgba(255,255,255,0.5)"}}>{t}</span>)}
                </div>
                <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",fontSize:22,color:"#C9A96E"}}>→</div>
              </button>

              {/* Direct chat */}
              <div style={{width:"100%",maxWidth:480}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{flex:1,height:1,background:"#E8E4DE"}}/><span style={{fontSize:11,color:"#ccc",fontWeight:500}}>or ask directly</span><div style={{flex:1,height:1,background:"#E8E4DE"}}/>
                </div>
                <div style={{background:"#fff",border:"1.5px solid #E8E4DE",borderRadius:16,padding:"14px 15px",boxShadow:"0 4px 24px rgba(0,0,0,0.04)",display:"flex",gap:10,alignItems:"flex-end",marginBottom:11}}>
                  <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="e.g. Yosemite late March — worth it?" rows={2}/>
                  <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:38,height:38,borderRadius:10,background:input.trim()?"linear-gradient(135deg,#1a1a2e,#2d2d5e)":"#F0EDEA",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={input.trim()?"#C9A96E":"#ccc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {suggestions.map(s=><button key={s} onClick={()=>sendMessage(s)} style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:100,padding:"6px 12px",fontSize:12,color:"#666",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.borderColor="#C9A96E";e.target.style.color="#1A1A1A";}} onMouseLeave={e=>{e.target.style.borderColor="#E8E4DE";e.target.style.color="#666";}}>{s}</button>)}
                </div>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {mode==="quiz"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"38px 40px",animation:"fadeUp 0.4s ease"}}>
              <QuizFlow onResults={handleQuizResults} onSkip={()=>setMode("home")}/>
            </div>
          )}

          {/* RESULTS */}
          {mode==="results"&&(
            <div style={{flex:1,padding:"26px 36px 60px",overflowY:"auto"}}>
              <div style={{maxWidth:620}}>
                <div style={{marginBottom:20,animation:"fadeUp 0.4s ease"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <button onClick={()=>setMode("quiz")} style={{fontSize:11,color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>← Retake</button>
                    <span style={{color:"#E8E4DE"}}>·</span>
                    <button onClick={()=>setMode("home")} style={{fontSize:11,color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>Home</button>
                  </div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:"#1A1A1A",marginBottom:5}}>Your Top Matches</h2>
                  {quizResults?.intro&&<p style={{fontSize:13,color:"#888",lineHeight:1.65}}>{quizResults.intro}</p>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
                    {quizAnswers&&Object.entries(quizAnswers).filter(([k])=>k!=="month").map(([k,v])=>(
                      <span key={k} style={{background:"#F7F5F2",border:"1px solid #E8E4DE",borderRadius:6,padding:"2px 9px",fontSize:11,color:"#666"}}>{String(v).replace(/_/g," ")}</span>
                    ))}
                  </div>
                </div>
                {quizResults?.destinations?(
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {quizResults.destinations.map(dest=>(
                      <MatchCard key={dest.rank} dest={dest} rank={dest.rank} onPlanTrip={handlePlanTrip} onDeepDive={sendMessage} answers={quizAnswers}/>
                    ))}
                  </div>
                ):(
                  <div style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:14,padding:"24px",textAlign:"center"}}>
                    <div style={{fontSize:13,color:"#999"}}>Couldn't load results. Please try the quiz again.</div>
                    <button onClick={()=>setMode("quiz")} style={{marginTop:12,padding:"9px 18px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retry Quiz</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ITINERARY */}
          {mode==="itinerary"&&itinerary&&(
            <div style={{flex:1,overflowY:"auto"}}>
              <ItineraryView itinerary={itinerary} onBack={()=>setMode("results")} onFinalize={()=>{}}/>
            </div>
          )}

          {/* CHAT */}
          {mode==="chat"&&(
            <div style={{flex:1,padding:"24px 34px 150px",display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
              {messages.map((msg,i)=>(
                <div key={i} style={{animation:"fadeUp 0.4s ease",display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
                  {msg.role==="user"?(
                    <div style={{background:"linear-gradient(135deg,#1a1a2e,#2d2d5e)",color:"#fff",borderRadius:"18px 18px 4px 18px",padding:"11px 17px",fontSize:14,lineHeight:1.5,maxWidth:"72%"}}>{msg.content}</div>
                  ):msg.parsed?(
                    <div style={{background:"#fff",borderRadius:20,border:"1px solid #E8E4DE",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.05)",width:"100%"}}>
                      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",padding:"18px 22px"}}>
                        <div style={{fontSize:10,color:"#C9A96E",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Trip Intel</div>
                        <div style={{fontSize:19,fontWeight:700,color:"#fff",fontFamily:"'Cormorant Garamond',serif"}}>{msg.parsed.destination}</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:6,lineHeight:1.6}}>{msg.parsed.summary}</div>
                      </div>
                      <div style={{padding:"15px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div style={{background:"#F7F5F2",borderRadius:11,padding:"12px 14px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#bbb",textTransform:"uppercase",marginBottom:5}}>🌤 Weather</div>
                          <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{msg.parsed.weather.conditions}</div>
                          <div style={{fontSize:11,color:"#C9A96E"}}>{msg.parsed.weather.temperature}</div>
                          <div style={{fontSize:11,color:"#777",marginTop:3}}>{msg.parsed.weather.tip}</div>
                        </div>
                        <div style={{background:"#F7F5F2",borderRadius:11,padding:"12px 14px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#bbb",textTransform:"uppercase",marginBottom:5}}>👥 Crowds</div>
                          <CrowdDot level={msg.parsed.crowd.level}/>
                          <div style={{fontSize:11,color:"#777",marginTop:4}}>{msg.parsed.crowd.description}</div>
                        </div>
                      </div>
                      <div style={{padding:"0 22px 15px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#bbb",textTransform:"uppercase",marginBottom:8}}>✦ Hidden Gems</div>
                        {msg.parsed.hiddenGems.map((g,i)=>(
                          <div key={i} style={{display:"flex",gap:9,marginBottom:7}}>
                            <div style={{width:20,height:20,borderRadius:5,background:"#1a1a2e",color:"#C9A96E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{i+1}</div>
                            <div><div style={{fontSize:12,fontWeight:700,color:"#1A1A1A"}}>{g.name}</div><div style={{fontSize:11,color:"#777"}}>{g.why}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:"4px 18px 18px 18px",padding:"12px 16px",fontSize:13,color:"#555",maxWidth:"72%",lineHeight:1.6}}>{msg.content}</div>
                  )}
                </div>
              ))}
              {loading&&<div style={{animation:"fadeUp 0.3s ease"}}><TypingDots/></div>}
              <div ref={bottomRef}/>
            </div>
          )}

          {/* Floating input bar */}
          {(mode==="chat"||mode==="results"||mode==="itinerary")&&(
            <div style={{position:"fixed",bottom:0,left:0,right:280,background:"rgba(250,250,248,0.97)",backdropFilter:"blur(16px)",borderTop:"1px solid #EDEAE4",padding:"10px 34px 18px",display:"flex",justifyContent:"center"}}>
              <div style={{width:"100%",maxWidth:580,background:"#fff",border:"1.5px solid #E8E4DE",borderRadius:14,padding:"10px 13px",boxShadow:"0 4px 18px rgba(0,0,0,0.05)",display:"flex",gap:9,alignItems:"flex-end"}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Ask about any destination..." rows={1} style={{minHeight:20}}/>
                <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:34,height:34,borderRadius:8,background:input.trim()?"linear-gradient(135deg,#1a1a2e,#2d2d5e)":"#F0EDEA",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={input.trim()?"#C9A96E":"#ccc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{padding:"24px 16px",overflowY:"auto",height:"calc(100vh - 56px)",position:"sticky",top:56}}>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10,fontWeight:700,color:"#999",letterSpacing:"0.1em",textTransform:"uppercase"}}>🔥 Trending Now</span>
              <span style={{background:"#fee2e2",color:"#ef4444",fontSize:9,fontWeight:800,borderRadius:4,padding:"2px 6px"}}>LIVE</span>
            </div>
            <p style={{fontSize:10,color:"#ccc",lineHeight:1.5}}>What's hot on Reddit this week</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {TRENDING.map((t,i)=>(
              <button key={i} onClick={()=>sendMessage(`Tell me about ${t.place} right now`)}
                style={{background:"#fff",border:"1px solid #E8E4DE",borderRadius:12,padding:"10px 12px",textAlign:"left",cursor:"pointer",transition:"all 0.15s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#C9A96E";e.currentTarget.style.boxShadow="0 3px 10px rgba(0,0,0,0.04)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#E8E4DE";e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:17}}>{t.emoji}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:"#1A1A1A"}}>{t.place}</div>
                      <div style={{fontSize:10,color:"#C9A96E",fontWeight:600}}>{t.tag}</div>
                    </div>
                  </div>
                  <span style={{fontSize:11,fontWeight:800,color:t.heat>90?"#ef4444":t.heat>80?"#fb923c":"#C9A96E"}}>{t.heat}°</span>
                </div>
                <div style={{background:"#F0EDEA",borderRadius:3,height:2,marginBottom:4,overflow:"hidden"}}>
                  <div style={{width:`${t.heat}%`,height:"100%",background:t.heat>90?"#ef4444":t.heat>80?"#fb923c":"#C9A96E",borderRadius:3}}/>
                </div>
                <div style={{fontSize:9,color:"#ccc"}}>{t.sub}</div>
              </button>
            ))}
          </div>

          {!user&&(
            <div style={{marginTop:14,background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:13,padding:"14px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3,fontFamily:"'Cormorant Garamond',serif"}}>Save your trips ✦</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:10,lineHeight:1.5}}>Sign in to bookmark destinations anytime.</div>
              <button onClick={()=>setShowAuth(true)} style={{width:"100%",padding:"8px 0",background:"#C9A96E",border:"none",borderRadius:8,fontSize:11,fontWeight:700,color:"#1a1a2e",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Sign in free →</button>
            </div>
          )}

          <div style={{marginTop:10,padding:"10px 11px",background:"#F0EDEA",borderRadius:10}}>
            <div style={{fontSize:9,color:"#ccc",lineHeight:1.6}}>📡 Reddit · Instagram · X trends. Click any to get instant AI intel.</div>
          </div>
        </div>
      </div>

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={handleAuth}/>}
    </div>
  );
}
