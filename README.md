# TerraBreath AI - Near-Real-Time Multi-Satellite Flood Intelligence Platform

TerraBreath AI is an Earth Observation (EO) flood risk modeling and decision intelligence platform powered by synchronized multi-satellite constellations (Copernicus Sentinel-1 SAR, Sentinel-2 Optical, NASA Landsat 9, NASA/JAXA GPM Core, MODIS, VIIRS, and Sentinel-3 Altimetry), deterministic hydrological risk calculations, and Explainable AI (XAI).

---

## 📋 System Requirements

To run this project locally on your IDE (VS Code, Cursor, WebStorm, etc.):

| Requirement | Recommended Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | **v18.18+ or v20.x+ (LTS)** | Check with `node -v` |
| **Package Manager**| **npm v9+**, **pnpm v8+**, or **bun** | Bundled with Node.js (`npm -v`) |
| **Git** | Any modern version | For version control & cloning |
| **IDE** | **VS Code** or **Cursor** | Recommended extensions: *Tailwind CSS IntelliSense*, *ESLint*, *TypeScript* |
| **Operating System**| macOS, Linux, or Windows (via PowerShell or WSL2) | Cross-platform compatible |

---

## 🚀 Quickstart: Running on Local IDE

### 1. Download & Open in IDE
If you downloaded the ZIP file:
1. Extract the folder to your preferred workspace directory.
2. Open the directory in your IDE:
   ```bash
   cd terrabreath-ai
   code .   # (If using VS Code)
   ```

### 2. Install Dependencies
Run the installation command in your terminal:
```bash
npm install
```

### 3. Configure Environment Variables
Create a local `.env` file from the provided `.env.example`:
```bash
cp .env.example .env
```
Inside `.env`:
```env
# Optional: Get a free key at https://aistudio.google.com/
# If omitted, deterministic algorithms and authentic synthetic XAI will run automatically.
GEMINI_API_KEY=""

PORT=3000
NODE_ENV=development
```

### 4. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.
The development server boots Express with integrated Vite middleware, hot module reload, and near-real-time telemetry ingestion pipelines.

---

## 🏭 Production Build & Execution

To test the production build locally or host on a VPS / Docker / Cloud Run:

```bash
# 1. Compile the production frontend bundle into /dist
npm run build

# 2. Launch the optimized production server
npm start
```
The server will serve the optimized SPA from `/dist` and all `/api/*` endpoints from Express on port `3000` (or the port specified in `process.env.PORT`).

---

## ⚡ Deploying to Vercel

This repository includes pre-configured `vercel.json` and `api/index.ts` serverless functions for deployment on Vercel.

### Method A: Deploy via GitHub (Recommended)
1. Push your project folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TerraBreath AI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/terrabreath-ai.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **"Add New..." > "Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
6. Click **Deploy**. Your app and serverless API endpoints will be live within 60 seconds!

### Method B: Deploy via Vercel CLI
If you prefer the command line:
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy from the project root
vercel

# 4. Deploy to production
vercel --prod
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and runtime environment check |
| `GET` | `/api/aoi` | Returns active monitored river basins and AOIs |
| `GET` | `/api/aoi/:id/full-analysis` | Complete multi-satellite, weather, DEM, and risk assessment |
| `GET` | `/api/aoi/:id/constellation` | Telemetry across all 7 satellite missions |
| `GET` | `/api/events` | List candidate and verified flood event records |
| `POST`| `/api/events/verify` | Analyst human verification approval |
| `POST`| `/api/events/dispatch` | Dispatches civil defense emergency bulletin |
| `POST`| `/api/notifications/subscribe` | Register analyst email for CRITICAL automated alerts |
| `POST`| `/api/notifications/test-dispatch` | Simulates high-priority emergency alert dispatch |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Leaflet GIS, Lucide Icons, jsPDF.
- **Backend**: Node.js, Express, Vite Server Middleware.
- **AI & Grounding**: Google Gemini API (`@google/genai`), Google Search & Maps Grounding.
- **Satellite Data**: Copernicus CDSE STAC, NASA GPM IMERG, Copernicus DEM GLO-30, Open-Meteo.
