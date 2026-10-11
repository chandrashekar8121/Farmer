# Krishi Saathi REST API Reference (v1)

Base URL: `http://localhost:8000/api/v1` (Local) / `https://<render-subdomain>.onrender.com/api/v1` (Production)

---

## 1. System Health
### `GET /health` and `GET /api/v1/health`
Checks server, database, and machine learning engine status without exposing secrets.
- **Response `200 OK`**:
```json
{
  "status": "online",
  "app_name": "Krishi Saathi",
  "version": "1.0.0",
  "timestamp": "2026-10-10T09:30:00Z",
  "database": "healthy",
  "crop_ml_engine": "loaded",
  "ocr_service": "available",
  "weather_service": "configured"
}
```

---

## 2. Authentication & Authorization
### `POST /api/v1/auth/signup`
Registers a farmer or family helper. Automatically provisions a default farm for farmers.
- **Request Body**:
```json
{
  "email": "farmer@example.com",
  "password": "securepassword123",
  "full_name": "Venkata Rao",
  "phone_number": "9848012345",
  "role": "farmer",
  "language_preference": "te"
}
```
- **Response `201 Created`**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user_id": "b3e04c54-...",
  "full_name": "Venkata Rao",
  "role": "farmer",
  "language_preference": "te"
}
```

### `POST /api/v1/auth/login`
Authenticates farmer or helper.
- **Request Body**: `{"email": "...", "password": "..."}`
- **Response `200 OK`**: Returns JWT access token.

### `GET /api/v1/auth/me`
Retrieves current profile. Header: `Authorization: Bearer <token>`.

---

## 3. Crop Catalog
### `GET /api/v1/crops`
Returns catalog of 22 supported Indian crops with regional names and baseline Recommended Dose of Fertilizers (RDF).

---

## 4. Soil Tests & Document OCR
### `POST /api/v1/soil-tests`
Saves verified soil diagnostic test. Rejects negative values and out-of-bounds pH (0–14).
- **Request Body**:
```json
{
  "nitrogen_mg_kg": 110.0,
  "phosphorus_mg_kg": 18.0,
  "potassium_mg_kg": 150.0,
  "soil_ph": 6.8,
  "lab_name": "Rythu Bharosa Kendra Lab"
}
```

### `POST /api/v1/soil-tests/upload`
Accepts PDF, JPG, PNG files (< 5MB). Extracts N, P, K, pH via document parsing/OCR and returns values in an editable structure for farmer verification.

### `GET /api/v1/soil-tests`
Lists soil test records for the authenticated farmer or authorized helper.

### `DELETE /api/v1/soil-tests/{id}`
Deletes a soil test record owned by the farmer.

---

## 5. Crop Recommendation (ML Engine)
### `POST /api/v1/crop-recommendations`
Runs inference using Random Forest model trained on 2,200 ICAR benchmark samples.
- **Request Body**:
```json
{
  "nitrogen_mg_kg": 90.0,
  "phosphorus_mg_kg": 45.0,
  "potassium_mg_kg": 40.0,
  "soil_ph": 6.5,
  "temperature": 25.0,
  "humidity": 80.0,
  "rainfall": 200.0
}
```
- **Response `200 OK`**:
```json
{
  "predicted_crop": "Rice (Paddy / వరి)",
  "confidence_score": 98.4,
  "secondary_crops": [
    {"crop": "Jute", "suitability": "Potential Alternative", "confidence": 1.2}
  ],
  "explanation": "Based on your soil's Nitrogen (90 mg/kg)...",
  "seasonal_advisory": "Recommended Season: Kharif & Rabi...",
  "model_version": "Random Forest v1.0",
  "limitations": "Trained on ICAR benchmark data..."
}
```

---

## 6. Fertilizer Recommendation Engine
### `POST /api/v1/fertilizer-recommendations`
Computes nutrient adjustments (+25% Low, 0% Med, -25% High), converts land area, calculates bags (DAP, Urea, MOP), split dosage schedule, and subsidized MRP costs. Automatically populates schedule reminders.
- **Request Body**:
```json
{
  "crop_name": "Rice",
  "growth_stage": "Basal (Land Preparation / Sowing)",
  "target_area": 2.0,
  "area_unit": "acres",
  "nitrogen_mg_kg": 100.0,
  "phosphorus_mg_kg": 18.0,
  "potassium_mg_kg": 150.0,
  "soil_ph": 6.8
}
```

---

## 7. Fertilizer Schedules & Reminders
### `GET /api/v1/fertilizer-schedules`
Lists tasks ordered by due date. Supports `?status_filter=pending`.

### `PATCH /api/v1/fertilizer-schedules/{id}`
Marks task as `completed`, `pending`, or `skipped`.

---

## 8. Weather & Agricultural Spray Advisory
### `GET /api/v1/weather?lat=16.5062&lon=80.6480&location_name=Vijayawada`
Proxies OpenWeather API with 10-minute in-memory caching. Provides satellite temperature, rain probability, wind speed, and practical spraying advisory (e.g., warning if rain expected within 24h).

---

## 9. History & Reports
### `GET /api/v1/history`
Returns chronological timeline of soil tests, nutrient trend comparison table, and recommendation archives.

---

## 10. Family Helper Dashboard
### `POST /api/v1/family/invite`
Farmer creates a 6-letter authorization code valid for 7 days.

### `POST /api/v1/family/accept`
Helper inputs the 6-letter code to gain explicit read-only access to the farmer's records.

### `GET /api/v1/family/farmers`
Helper lists authorized farmers.

### `DELETE /api/v1/family/helpers/{permission_id}`
Farmer revokes helper access.
