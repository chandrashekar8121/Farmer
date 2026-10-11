# Krishi Saathi (కృషి సాథి)
### AI-Based Smart Fertilizer and Crop Management System for Elderly Farmers

[![Python Tests](https://img.shields.io/badge/backend%20tests-16%20passed-brightgreen.svg)](#10-automated-testing)
[![Frontend Build](https://img.shields.io/badge/frontend%20build-passing-brightgreen.svg)](#9-commands-to-run-frontend-and-backend)
[![Agronomic Engine](https://img.shields.io/badge/agronomy-ICAR%20%2F%20TNAU-blue.svg)](#18-known-limitations--sources-for-agricultural-rules)
[![Accessibility](https://img.shields.io/badge/UI-Elder--Farmer%20Accessible-orange.svg)](#8-elder-farmer-accessibility-features)

---

## 1. Project Overview
**Krishi Saathi** is an accessible, bilingual (English, Telugu, Hindi), voice-assisted agricultural decision-support web application tailored for elderly and rural farmers in India. It bridges the digital divide for farmers with limited technological experience by providing large touch targets, high contrast, multilingual audio assistance, and officially calibrated agricultural recommendations.

The application assists farmers to:
- Enter soil test numbers manually or upload physical laboratory reports (Soil Health Cards).
- Analyze soil Nitrogen (N), Phosphorus (P), Potassium (K), and soil pH.
- Recommend crops using an AI Random Forest classification model trained on 2,200 ICAR benchmark samples.
- Compute crop-specific fertilizer doses, bag quantities (Urea, DAP, MOP), and subsidized costs.
- Track split dosage application schedules and task reminders.
- Provide real-time satellite weather and practical spraying advisories (rain/wind warnings).
- Enable sons, daughters, or helpers to assist farmers via an authorized family dashboard.

---

## 2. Key Features
- **Elder-Farmer First UI/UX**: Minimum 18px body font, 54px+ touch targets, simple non-cluttered layouts, warm agricultural palette.
- **Multilingual & Voice-Assisted**: Full native translation for **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)** with browser Web Speech API text-to-speech narration and microphone speech input.
- **Reproducible AI Crop Recommendation**: Fitted Random Forest model predicting among 22 Indian crops with confidence probability, alternative crops, and agronomic explanations.
- **ICAR/TNAU Agronomic Fertilizer Engine**: Soil Test Crop Response (STCR) calculations accounting for soil nutrient health (+25% for Low, 0% for Medium, -25% for High), accurate hectare/acre/sq.meter area conversions, and product bag estimation.
- **Subsidized Price Estimations**: Calculates realistic costs based on official Government of India Direct Benefit Transfer (DBT) Maximum Retail Prices (Urea ₹266.50/45kg, DAP ₹1350/50kg, MOP ₹1700/50kg).
- **Secure Report Upload & Verification**: Allows PDF/photo report uploads, extracts N-P-K-pH via document parsing/OCR, and enforces mandatory farmer confirmation before saving.
- **Schedule Calendar**: Auto-generates Basal, Tillering, and Flowering fertilizer split dates and allows marking tasks complete.
- **Live Weather & Spraying Advisory**: OpenWeather backend proxy with 10-minute caching that warns against fertilizer washing-away if rain or high wind is imminent.
- **Family Helper Connection**: Secure 6-letter invite code authorization allowing family members to assist elder parents without sharing passwords.

---

## 3. Architecture
```
                         +-----------------------------------+
                         |   Krishi Saathi Web Frontend      |
                         |   (React 19 + Vite + Tailwind)    |
                         |   Deployed on Vercel              |
                         +-----------------+-----------------+
                                           |
                                  REST API | (JWT Bearer Token)
                                           v
                         +-----------------+-----------------+
                         |   FastAPI Backend Service         |
                         |   (Python 3.10 + Uvicorn)         |
                         |   Deployed on Render              |
                         +--------+--------+--------+--------+
                                  |        |        |
             +--------------------+        |        +--------------------+
             |                             |                             |
             v                             v                             v
+------------------------+   +------------------------+   +------------------------+
| Supabase / PostgreSQL  |   | Machine Learning Model |   | OpenWeather Proxy API  |
| - Users & Farms        |   | - Random Forest Model  |   | - 10-min Cache         |
| - Soil Diagnostic Logs |   | - 2,200 ICAR Samples   |   | - Spray Advisory       |
| - RLS Tenant Isolation |   | - 99.3% Accuracy       |   +------------------------+
+------------------------+   +------------------------+
```

---

## 4. Directory Structure
```
c:\Users\hguru\OneDrive\Desktop\Farmer/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint & CORS
│   │   ├── core/                      # Config & JWT bcrypt security
│   │   ├── database/                  # SQLAlchemy session & models
│   │   ├── schemas/                   # Pydantic validation models
│   │   ├── services/                  # ML, Fertilizer STCR, OCR, Weather
│   │   └── api/v1/endpoints/          # REST API route handlers
│   ├── tests/                         # Pytest test suite (16 tests)
│   ├── requirements.txt               # Backend dependencies
│   ├── Procfile                       # Render deployment start command
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar, Footer, BigButton, VoiceAssistant
│   │   ├── context/                   # AuthContext, LanguageContext
│   │   ├── i18n/                      # en.ts, te.ts, hi.ts dictionaries
│   │   ├── pages/                     # 11 application pages
│   │   ├── services/                  # api.ts client
│   │   └── types/                     # TypeScript definitions
│   ├── package.json
│   ├── vercel.json                    # SPA routing rewrite
│   └── .env.example
├── ml/
│   ├── dataset/                       # 2,200 sample crop benchmark
│   ├── train.py                       # Reproducible training pipeline
│   └── models/                        # Serialized model & metadata
├── database/
│   ├── schema.sql                     # Full schema with RLS policies
│   └── seed.sql                       # Official fertilizer catalog seed
├── docs/
│   ├── AGRONOMIC_RULES.md             # Scientific formulas & worked test example
│   ├── API_DOCUMENTATION.md           # REST endpoint documentation
│   ├── DEPLOYMENT_GUIDE.md            # Step-by-step deployment guide
│   └── PLAN.md                        # Implementation plan
├── render.yaml                        # Render blueprint
├── README.md
└── .gitignore
```

---

## 5. Prerequisites
- **Python**: 3.10+
- **Node.js**: v18+ or v20+
- **npm**: v9+
- *(Optional for live satellite weather)*: Free API key from [OpenWeatherMap](https://openweathermap.org/)
- *(Optional for production cloud DB)*: Free account at [Supabase](https://supabase.com)

---

## 6. Local Setup Instructions

### Step 1: Clone or Navigate to the Workspace
```bash
cd c:\Users\hguru\OneDrive\Desktop\Farmer
```

### Step 2: Set up Backend Environment
```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Train and export ML model (takes ~5 seconds)
python ml/train.py
```

### Step 3: Set up Frontend Environment
```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

---

## 7. Environment Variables Reference

### Backend (`backend/.env`):
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | No | `"Krishi Saathi Backend API"` | API title in Swagger docs |
| `PORT` | No | `8000` | Port for Uvicorn server |
| `SECRET_KEY` | **Yes** | `replace-with-a-random-secret-key` | Signs authentication tokens |
| `DATABASE_URL` | **Yes** | `sqlite:///./krishi_saathi.db` | Database connection URL |
| `CORS_ORIGINS` | **Yes** | `http://localhost:5173,https://krishi-saathi.vercel.app` | Allowed frontend domains |
| `OPENWEATHER_API_KEY`| No | `""` | Live satellite weather data |
| `SUPABASE_URL` | No | `https://your-ref.supabase.co` | Optional Supabase URL |
| `SUPABASE_KEY` | No | `your-anon-key` | Optional Supabase key |

### Frontend (`frontend/.env.local` or Vercel Settings):
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:8000` (Local) / `https://your-api.onrender.com` (Prod) | Base URL of backend API |

---

## 8. Database Setup (Supabase & SQLite)
- **Local Development**: Runs out of the box with zero setup using SQLite (`DATABASE_URL=sqlite:///./krishi_saathi.db`). The startup script automatically provisions tables and seeds the official fertilizer catalog.
- **Production Supabase Setup**:
  1. Go to [Supabase SQL Editor](https://app.supabase.com).
  2. Run [`database/schema.sql`](file:///c:/Users/hguru/OneDrive/Desktop/Farmer/database/schema.sql) (creates 11 tables and Row Level Security policies).
  3. Run [`database/seed.sql`](file:///c:/Users/hguru/OneDrive/Desktop/Farmer/database/seed.sql) (populates subsidized fertilizer catalog).
  4. Copy connection string into backend `DATABASE_URL`.

---

## 9. Commands to Run Frontend and Backend

### Terminal 1: Run Backend
```powershell
# From project root:
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### Terminal 2: Run Frontend
```powershell
cd frontend
npm run dev
```
Web application will be live at: `http://localhost:5173`

---

## 10. Automated Testing
Run the comprehensive test suite verifying health, agronomic formulas, area conversions, tenant isolation, file upload, ML inference, and weather graceful degradation:

```powershell
# Run backend pytest suite (16 tests)
python -m pytest backend/tests -v
```

```powershell
# Run frontend production build & TypeScript check
cd frontend
npm run build
```

---

## 11. Worked Agronomic Calculation Example
Tested in [`backend/tests/test_fertilizer.py`](file:///c:/Users/hguru/OneDrive/Desktop/Farmer/backend/tests/test_fertilizer.py):
- **Crop**: Rice (Paddy / వరి)
- **Field Size**: 2.0 Acres (0.80937 ha)
- **Soil Status**: N = 100 mg/kg (Low, +25%), P = 18 mg/kg (Medium, 100%), K = 150 mg/kg (Medium, 100%), pH = 6.8
- **Results**:
  - DAP (18-46-0): **105.57 kg** (~2.11 bags) → **₹2,850.39**
  - Neem Coated Urea (46% N): **222.63 kg** (~4.95 bags) → **₹1,317.97**
  - MOP (60% K2O): **53.95 kg** (~1.08 bags) → **₹1,834.30**
  - **Total Estimated Subsidized Cost**: **₹6,002.66**
  - **Schedule**: Basal (Day 0: 105.6kg DAP + 27kg MOP), Tillering (Day 25: 111.3kg Urea), Panicle (Day 50: 111.3kg Urea + 27kg MOP).

---

## 12. Deployment Steps (Render, Vercel & Supabase)

### Backend Deployment on Render:
1. Push repository to GitHub.
2. Log in to [Render](https://dashboard.render.com) and click **New + -> Web Service**.
3. Select your repository.
4. Set **Root Directory** to `backend`.
5. Set **Build Command** to `pip install -r requirements.txt`.
6. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Add environment variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL URI (or default SQLite)
   - `SECRET_KEY`: Random 32+ character string
   - `CORS_ORIGINS`: `*` (or your Vercel URL)
   - `OPENWEATHER_API_KEY`: Your OpenWeather key
8. Click **Deploy**. Note the public URL: `https://krishi-saathi-api.onrender.com`.
9. Test endpoint: `https://krishi-saathi-api.onrender.com/health`.

### Frontend Deployment on Vercel:
1. Log in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Select your GitHub repository.
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `frontend`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://krishi-saathi-api.onrender.com` (no trailing slash).
6. Click **Deploy**.
7. Access your public app at: `https://krishi-saathi.vercel.app`.

---

## 13. Common Deployment Errors and Fixes

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **CORS Error in Browser** | Backend `CORS_ORIGINS` does not match Vercel URL | Set `CORS_ORIGINS="https://krishi-saathi.vercel.app"` on Render environment variables. |
| **401 Unauthorized after Deploy** | Token expired or secret key changed | Log in again via `/login`. Ensure `SECRET_KEY` remains constant on Render. |
| **SQLAlchemy `postgres://` Error** | Render provides `postgres://` which SQLAlchemy 1.4+ rejected | Built-in handler in `session.py` auto-converts to `postgresql://`. |
| **Vite Client Routing 404 on Refresh** | Static hosting doesn't rewrite routes to index.html | Handled by `frontend/vercel.json` SPA rewrite rules. |
| **Microphone Not Listening** | Browser requires HTTPS for Web Speech API | Always access via HTTPS (`https://krishi-saathi.vercel.app`). Voice works on Chrome, Edge, and Android Chrome. |

---

## 14. Known Limitations & Sources for Agricultural Rules
1. **Soil Extraction Variations**: Laboratory reports vary across state formats. Krishi Saathi parses standard Indian Soil Health Cards (N, P, K, pH) and enforces user verification before saving.
2. **Micronutrients**: Current calculation focuses on primary macronutrients (N, P, K) and soil reaction (pH). Zinc and Sulfur recommendations are flagged provisionally in advisory notes.
3. **Agronomic References**:
   - Indian Council of Agricultural Research (ICAR) *Soil Testing in India Manual*
   - Tamil Nadu Agricultural University (TNAU) *Crop Production Guide*
   - Department of Fertilizers, Ministry of Chemicals & Fertilizers, Govt. of India (DBT Price Norms).
