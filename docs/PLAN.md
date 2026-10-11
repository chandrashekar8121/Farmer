# Krishi Saathi (AI-Based Smart Fertilizer and Crop Management System for Elderly Farmers)
## Architecture & Implementation Plan

### 1. Overview
Krishi Saathi is an accessible, bilingual (English, Telugu, Hindi), voice-assisted agricultural decision-support web application tailored for elderly and rural farmers in India. It assists farmers with soil testing, AI crop recommendation, ICAR-grounded fertilizer scheduling, cost estimation, family dashboard collaboration, and weather forecasting.

---

### 2. Directory Structure
```
c:\Users\hguru\OneDrive\Desktop\Farmer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ml_service.py
│   │   │   ├── fertilizer_service.py
│   │   │   ├── ocr_service.py
│   │   │   └── weather_service.py
│   │   └── api/
│   │       ├── __init__.py
│   │       └── v1/
│   │           ├── __init__.py
│   │           ├── router.py
│   │           └── endpoints/
│   │               ├── health.py
│   │               ├── auth.py
│   │               ├── crops.py
│   │               ├── soil_tests.py
│   │               ├── crop_recommendations.py
│   │               ├── fertilizer_recommendations.py
│   │               ├── schedules.py
│   │               ├── weather.py
│   │               ├── history.py
│   │               └── family.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py
│   │   ├── test_fertilizer.py
│   │   ├── test_soil_tests.py
│   │   ├── test_ml.py
│   │   ├── test_security.py
│   │   └── test_weather.py
│   ├── requirements.txt
│   ├── Procfile
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── sample_soil_test.txt
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── VoiceAssistant.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── BigButton.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── LanguageContext.tsx
│   │   ├── i18n/
│   │   │   ├── en.ts
│   │   │   ├── te.ts
│   │   │   └── hi.ts
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SoilInputPage.tsx
│   │   │   ├── ReportUploadPage.tsx
│   │   │   ├── CropRecommendationPage.tsx
│   │   │   ├── FertilizerRecommendationPage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── WeatherPage.tsx
│   │   │   └── FamilyDashboardPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── vercel.json
│   └── .env.example
├── ml/
│   ├── dataset/
│   │   └── crop_recommendation.csv
│   ├── train.py
│   └── models/
│       └── crop_model.joblib
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── AGRONOMIC_RULES.md
│   └── DEPLOYMENT_GUIDE.md
├── render.yaml
├── README.md
└── .gitignore
```

---

### 3. Execution Phases
1. **Machine Learning & Agronomic Logic**:
   - Implement the reproducible Crop Recommendation dataset & Random Forest model.
   - Build ICAR/TNAU-grounded fertilizer dosage & cost calculation formulas.
2. **Backend API**:
   - Set up FastAPI, SQLite/PostgreSQL/Supabase dual support, Pydantic validation, Auth & RLS modeling.
   - Implement endpoints: Health, Soil Tests, OCR/Document parsing, Crop ML, Fertilizer rules, Schedules, Weather proxy, Family access.
3. **Frontend Application**:
   - Scaffold Vite + React + TypeScript + Tailwind.
   - Configure accessible high-contrast UI (>=18px fonts, big touch targets, bilingual English/Telugu/Hindi).
   - Implement Web Speech API voice assistant.
   - Build all 11 required pages and views.
4. **Automated Testing**:
   - Backend pytest suite (health, fertilizer calculations, security/auth, ML inference, error handling).
   - Frontend build and lint testing.
5. **Deployment Artifacts**:
   - Vercel config, Render config, Supabase SQL schema & RLS policies, documentation and `.env.example` files.
