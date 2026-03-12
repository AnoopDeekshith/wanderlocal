# ✦ WanderLocal

> Ask like you're texting a local friend.

WanderLocal is an AI-powered travel planning web app that gives you real, honest trip intel — weather, crowd levels, hidden gems, geopolitical safety, and a full day-by-day itinerary with prices — all in one conversational interface.

---

## 🚀 Features (v0.5)

- **5-Step Personality Quiz** — Beach or mountain? Mood? Group? Budget? Dates? → 3 AI-ranked destination matches
- **Geopolitical Safety Alerts** — Every destination is assessed for current travel safety (Safe / Caution / High Risk)
- **Live Social Buzz** — Destinations scored by trending activity on Reddit, Instagram & X
- **Full Day-by-Day Itinerary** — Real place names, timestamped moves, estimated USD cost per activity
- **Must-Eat Recommendations** — Sourced from Reddit/Instagram/X for each day
- **Amazon Packing Links** — Every essential links directly to Amazon search
- **Running Cost Tracker** — Per-day subtotals + grand total per person
- **Export to Calendar** — Downloads `.ics` file (works with Apple Calendar, Google Calendar, Outlook)
- **Export Shopping List** — Full Amazon packing list + itinerary as `.txt`
- **User Accounts** — Sign up / sign in, save trips, re-ask from saved panel
- **Trending Sidebar** — Reddit-sourced hot destinations this week
- **Direct Chat Mode** — Ask anything about any destination, get structured trip intel cards

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| AI Brain | Claude Sonnet (Anthropic API) |
| Storage | Claude Artifacts persistent storage (`window.storage`) |
| Fonts | Cormorant Garamond + DM Sans (Google Fonts) |
| Styling | Inline styles (no CSS framework dependency) |

---

## ⚙️ Setup & Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/wanderlocal.git
cd wanderlocal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your Anthropic API key

The app calls the Anthropic API directly from the browser (fine for development/demos).  
For production, route calls through a backend to protect your key.

In `src/App.jsx`, the API calls use:
```js
fetch("https://api.anthropic.com/v1/messages", { ... })
```

For local dev, create a `.env` file:
```
REACT_APP_ANTHROPIC_KEY=sk-ant-xxxx
```
Then update the fetch headers in `App.jsx` to include:
```js
"x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
"anthropic-version": "2023-06-01",
"anthropic-dangerous-direct-browser-access": "true"
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

### 4. Run
```bash
npm start
```
Opens at `http://localhost:3000`

---

## 📁 Project Structure

```
wanderlocal/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          ← Entire app (single-file architecture)
│   └── index.js         ← React entry point
├── .gitignore
├── package.json
└── README.md
```

---

## 🗺 Roadmap

- [ ] Real weather API integration (OpenWeatherMap)
- [ ] Live Reddit/Instagram trend scraping (backend)
- [ ] Multi-week itinerary support (7+ days)
- [ ] Trip sharing via shareable link
- [ ] Flight price integration
- [ ] Mobile app (React Native)
- [ ] Monetisation: affiliate hotel/flight links

---

## 🔒 Notes

- User accounts are stored via Claude's persistent artifact storage (`window.storage`) — development only
- For production, replace with a real auth system (Supabase, Firebase, Auth0)
- API calls should be proxied through a backend in production to protect the Anthropic key

---

## 📄 License

MIT — build on it, learn from it, ship something great.
