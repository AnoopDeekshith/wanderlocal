# 🚀 WanderLocal — Deploy to GitHub Pages

## One-time setup (do this once)

### Step 1 — Create GitHub repo
1. Go to https://github.com/new
2. Name: `wanderlocal`
3. Visibility: **Public**
4. Leave everything else unchecked → **Create repository**

### Step 2 — Edit package.json
Open `package.json` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:
```
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/wanderlocal",
```

### Step 3 — Run these commands in your terminal (inside the wanderlocal folder)

```bash
# Install dependencies including gh-pages
npm install

# Initialize git (skip if already done)
git init
git branch -M main

# Connect to your GitHub repo (replace YOUR_GITHUB_USERNAME)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/wanderlocal.git

# Push your code
git add .
git commit -m "feat: WanderLocal v1.0 — AI travel planner"
git push -u origin main

# Build and deploy to GitHub Pages
npm run deploy
```

### Step 4 — Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Branch" → select `gh-pages` → `/ (root)`
4. Click **Save**

⏱ Wait 2-3 minutes, then visit:
**https://YOUR_GITHUB_USERNAME.github.io/wanderlocal**

---

## Every time you update the app

```bash
git add .
git commit -m "describe your change"
git push
npm run deploy
```

That's it. `npm run deploy` rebuilds and republishes automatically.

---

## Share with friends
Send them your URL and tell them:
> "Enter your own Anthropic API key when prompted — get one free at console.anthropic.com"
