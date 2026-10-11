# Krishi Saathi - Production Deployment Manual

This guide covers step-by-step deployment to free-tier cloud platforms:
1. **Database & Auth**: Supabase
2. **Backend API & ML Engine**: Render
3. **Frontend Application**: Vercel

---

## 1. Supabase PostgreSQL Setup

1. Log in or create a free account at [supabase.com](https://supabase.com).
2. Click **New Project** and name it `krishi-saathi`.
3. Choose a strong database password and select a region close to your users (e.g. `ap-south-1` Mumbai).
4. Once created, go to the **SQL Editor** tab on the left sidebar.
5. Click **New query**, paste the entire contents of [`database/schema.sql`](file:///c:/Users/hguru/OneDrive/Desktop/Farmer/database/schema.sql), and click **Run**.
6. Open a second query, paste the contents of [`database/seed.sql`](file:///c:/Users/hguru/OneDrive/Desktop/Farmer/database/seed.sql), and click **Run**.
7. In Supabase **Project Settings -> Database**, copy the **URI Connection String**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
8. In Supabase **Project Settings -> API**, copy:
   - `Project URL` (e.g. `https://xyzcompany.supabase.co`)
   - `anon public key`
   - `JWT Secret`

---

## 2. Render Backend Deployment

1. Sign up or log in at [render.com](https://render.com).
2. Connect your GitHub account and repository `Farmer` or `krishi-saathi`.
3. Click **New +** -> **Web Service**.
4. Configure service settings:
   - **Name**: `krishi-saathi-api`
   - **Language**: `Python 3`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. In the **Environment Variables** section, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` | Your Supabase connection URI |
   | `SECRET_KEY` | `generate-a-strong-random-32-byte-string` | JWT signing secret |
   | `CORS_ORIGINS` | `*` (or your Vercel URL once known) | Allowed frontend origins |
   | `OPENWEATHER_API_KEY` | *(optional free key)* | OpenWeatherMap API key |
   | `SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase URL |
   | `SUPABASE_KEY` | `[YOUR-ANON-KEY]` | Supabase anon key |
   | `SUPABASE_JWT_SECRET` | `[YOUR-JWT-SECRET]` | Supabase JWT Secret |
6. Click **Create Web Service**.
7. Wait 2–3 minutes for Render to build. Once deployed, note your public URL:
   `https://krishi-saathi-api.onrender.com`
8. Verify in your browser:
   Visit `https://krishi-saathi-api.onrender.com/health`.
   It should return: `{"status": "online", "service": "Krishi Saathi API", "version": "1.0.0"}`.

---

## 3. Vercel Frontend Deployment

1. Sign up or log in at [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://krishi-saathi-api.onrender.com` |
   *(Note: Point this to your Render URL without trailing slash).*
6. Click **Deploy**.
7. Vercel will install dependencies, build TypeScript, and produce a live HTTPS link:
   `https://krishi-saathi.vercel.app`

---

## 4. Connecting & Verifying Cross-Device Access

1. Open `https://krishi-saathi.vercel.app` from any mobile phone or external computer.
2. Update Render backend variable `CORS_ORIGINS` with:
   `https://krishi-saathi.vercel.app,http://localhost:5173`
3. In Supabase **Authentication -> URL Configuration**, set:
   - **Site URL**: `https://krishi-saathi.vercel.app`
   - **Redirect URLs**: `https://krishi-saathi.vercel.app/**`
4. Test key workflows:
   - Sign up a farmer account from a mobile browser.
   - Enter soil test numbers with speech dictation.
   - Calculate fertilizer bags and review costs.
   - Mark a task complete in the schedule.
   - Share a 6-letter invitation code with a helper.
