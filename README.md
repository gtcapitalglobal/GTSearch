# GT Lands Dashboard - Manus Project

Real estate property analysis platform with secure backend APIs.

## 🚀 Quick Start

### 1. Configure API Keys

Edit `.env` file and add your API keys:

```bash
GOOGLE_MAPS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

### 2. Run the Server

```bash
pnpm run dev
```

### 3. Open in Browser

```
http://localhost:3000
```

## 📁 Project Structure

```
gt-lands-manus/
├── public/               # Frontend files
│   ├── index.html       # Main dashboard (dashboard-v21.html)
│   ├── settings.html    # API settings page
│   ├── screen2-prototype.html  # Property analysis
│   └── comps-bid-prototype.html  # Comparables & BID
├── server.js            # Backend API server
├── .env                 # Environment variables (API keys)
└── package.json         # Dependencies
```

## 🔐 Security

- All API keys are stored in `.env` file (server-side only)
- Never exposed to the frontend
- Backend proxies all API requests

## 📡 API Endpoints

- `POST /api/google-maps` - Google Maps Geocoding
- `POST /api/openai` - OpenAI GPT-4
- `POST /api/gemini` - Google Gemini
- `POST /api/perplexity` - Perplexity Sonar
- `POST /api/zillow` - Zillow (RapidAPI)
- `POST /api/realtor` - Realtor.com (RapidAPI)
- `POST /api/realty-mole` - Realty Mole

## 🌐 Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Add environment variables in Cloudflare Dashboard
4. Deploy!

## 📝 Features

- ✅ CSV import (Parcel Fair format)
- ✅ Interactive map with Leaflet
- ✅ Property filtering
- ✅ AI-powered analysis
- ✅ Comparables search
- ✅ BID calculator
- ✅ Dark mode
- ✅ Mobile responsive

## 🛠️ Technologies

- **Frontend:** HTML, CSS (Tailwind), JavaScript
- **Backend:** Node.js, Express
- **Maps:** Leaflet
- **CSV:** PapaParse
- **APIs:** Google Maps, OpenAI, Gemini, Perplexity, Zillow, Realtor, Realty Mole

