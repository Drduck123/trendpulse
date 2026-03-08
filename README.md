# 📡 TrendPulse — Fabian Stores

Real-time product trend tracker for West African e-commerce markets.

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Step 1: Get your Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`) — save it somewhere safe

### Step 2: Upload to GitHub
1. Go to [github.com](https://github.com) and sign in (create a free account if needed)
2. Click the **+** button → **New repository**
3. Name it `trendpulse` → click **Create repository**
4. Upload all these project files to the repository

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Select your `trendpulse` GitHub repository
4. Click **Deploy** — Vercel will detect it's a Next.js app automatically

### Step 4: Add your API Key (IMPORTANT)
1. In your Vercel project, go to **Settings → Environment Variables**
2. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from Step 1 (the `sk-ant-...` one)
3. Click **Save**
4. Go to **Deployments** → click the 3 dots on your latest deploy → **Redeploy**

### Step 5: Your app is live! 🎉
Vercel will give you a URL like `trendpulse.vercel.app`

To use a custom domain like `trends.fabianstores.com`:
- Go to **Settings → Domains** in Vercel
- Add your domain and follow the DNS instructions

---

## 📱 Install as Mobile App (PWA)

Once deployed, on your phone:
- **Android**: Open the URL in Chrome → tap the menu → "Add to Home Screen"
- **iPhone**: Open in Safari → tap Share → "Add to Home Screen"

It will appear as a proper app icon on your phone!

---

## 🛠 Running Locally (Optional)

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
trendpulse/
├── src/app/
│   ├── page.js              # Home page
│   ├── layout.js            # Root layout + PWA meta tags
│   ├── TrendTracker.js      # Main app component
│   └── api/scan/route.js    # Secure API route (keeps your key safe)
├── public/
│   └── manifest.json        # PWA manifest
├── .env.local.example       # Environment variable template
├── next.config.js
└── package.json
```

---

## 🔑 Security Note

Your Anthropic API key is stored as a Vercel environment variable and **never exposed to the browser**. All API calls go through the secure `/api/scan` server route.
