-- ====================================================================
-- KRISHI SAATHI - PRODUCTION SUPABASE / POSTGRESQL SCHEMA
-- AI-Based Smart Fertilizer & Crop Management for Elderly Farmers
-- Includes Full Row Level Security (RLS) & Helper Permissions
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'family_helper', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE area_unit AS ENUM ('acres', 'hectares', 'sq_meters');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Syncs with Supabase auth.users or local auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    language_preference VARCHAR(10) DEFAULT 'en', -- 'en', 'te', 'hi'
    role user_role DEFAULT 'farmer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    farm_name VARCHAR(120) NOT NULL,
    land_area NUMERIC(10, 2) NOT NULL CHECK (land_area > 0),
    area_unit area_unit DEFAULT 'acres',
    soil_type VARCHAR(60) NOT NULL,
    state VARCHAR(80) NOT NULL,
    district VARCHAR(80) NOT NULL,
    village VARCHAR(100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    irrigation_type VARCHAR(60) DEFAULT 'canal', -- 'canal', 'borewell', 'rainfed', 'drip'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. UPLOADED REPORTS (PDF/Image file metadata & extracted OCR values)
CREATE TABLE IF NOT EXISTS uploaded_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    extraction_status VARCHAR(40) DEFAULT 'success', -- 'success', 'partial', 'failed'
    verified_by_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOIL TESTS TABLE
CREATE TABLE IF NOT EXISTS soil_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    report_id UUID REFERENCES uploaded_reports(id) ON DELETE SET NULL,
    sample_date DATE DEFAULT CURRENT_DATE,
    nitrogen_mg_kg NUMERIC(8, 2) NOT NULL CHECK (nitrogen_mg_kg >= 0),
    phosphorus_mg_kg NUMERIC(8, 2) NOT NULL CHECK (phosphorus_mg_kg >= 0),
    potassium_mg_kg NUMERIC(8, 2) NOT NULL CHECK (potassium_mg_kg >= 0),
    soil_ph NUMERIC(4, 2) NOT NULL CHECK (soil_ph >= 0 AND soil_ph <= 14),
    organic_carbon_percent NUMERIC(5, 2) CHECK (organic_carbon_percent >= 0),
    electrical_conductivity_ds_m NUMERIC(6, 2) CHECK (electrical_conductivity_ds_m >= 0),
    lab_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CROP RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    soil_test_id UUID REFERENCES soil_tests(id) ON DELETE SET NULL,
    predicted_crop VARCHAR(80) NOT NULL,
    secondary_crops JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(5, 2),
    explanation TEXT NOT NULL,
    seasonal_advisory TEXT,
    input_parameters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FERTILIZER PRODUCTS (Reference catalog)
CREATE TABLE IF NOT EXISTS fertilizer_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(120) UNIQUE NOT NULL,
    generic_name VARCHAR(120) NOT NULL,
    n_percent NUMERIC(5, 2) DEFAULT 0,
    p_percent NUMERIC(5, 2) DEFAULT 0,
    k_percent NUMERIC(5, 2) DEFAULT 0,
    other_nutrients VARCHAR(120),
    bag_size_kg NUMERIC(6, 2) NOT NULL DEFAULT 50,
    standard_price_inr NUMERIC(10, 2) NOT NULL,
    is_subsidized BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUCT PRICES (Historical or State-specific prices)
CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES fertilizer_products(id) ON DELETE CASCADE,
    state VARCHAR(80) DEFAULT 'ALL',
    price_inr NUMERIC(10, 2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    source_note VARCHAR(255) DEFAULT 'Standard Central Govt MRP (DBT Fertilizers)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FERTILIZER RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    soil_test_id UUID REFERENCES soil_tests(id) ON DELETE SET NULL,
    crop_name VARCHAR(80) NOT NULL,
    growth_stage VARCHAR(60) NOT NULL,
    target_area NUMERIC(10, 2) NOT NULL,
    area_unit area_unit DEFAULT 'acres',
    nutrient_status JSONB NOT NULL, -- {N: 'Low', P: 'Medium', K: 'High', ph_status: 'Slightly Acidic'}
    recommended_products JSONB NOT NULL, -- Array of {product, quantity_kg, bags, timing, cost_inr}
    total_estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    safety_instructions TEXT NOT NULL,
    recommendation_source VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FERTILIZER SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS fertilizer_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recommendation_id UUID REFERENCES fertilizer_recommendations(id) ON DELETE CASCADE,
    task_title VARCHAR(150) NOT NULL,
    stage_name VARCHAR(80) NOT NULL,
    due_date DATE NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    quantity_kg NUMERIC(8, 2) NOT NULL,
    application_method VARCHAR(120) DEFAULT 'Broadcasting after weeding',
    status task_status DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FAMILY INVITATIONS
CREATE TABLE IF NOT EXISTS family_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL,
    invitee_phone VARCHAR(20) NOT NULL,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FARM ACCESS PERMISSIONS (Family Helper access authorization)
CREATE TABLE IF NOT EXISTS farm_access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL,
    helper_id UUID NOT NULL,
    permission_level VARCHAR(40) DEFAULT 'read_only', -- 'read_only', 'manager'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farmer_id, helper_id)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_user_id ON soil_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_farm_id ON soil_tests(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_rec_user_id ON crop_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_fert_rec_user_id ON fertilizer_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_fert_schedules_user_id ON fertilizer_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_fert_schedules_due_date ON fertilizer_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_farm_access_helper ON farm_access_permissions(helper_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read and mutate their own data,
-- or data explicitly delegated via farm_access_permissions.
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_access_permissions ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY profiles_select_policy ON profiles FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = profiles.user_id AND is_active = true));

DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
CREATE POLICY profiles_insert_policy ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_update_policy ON profiles;
CREATE POLICY profiles_update_policy ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. FARMS POLICIES
DROP POLICY IF EXISTS farms_all_policy ON farms;
CREATE POLICY farms_all_policy ON farms FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = farms.user_id AND is_active = true));

-- 3. UPLOADED REPORTS POLICIES
DROP POLICY IF EXISTS reports_all_policy ON uploaded_reports;
CREATE POLICY reports_all_policy ON uploaded_reports FOR ALL
    USING (auth.uid() = user_id);

-- 4. SOIL TESTS POLICIES
DROP POLICY IF EXISTS soil_tests_all_policy ON soil_tests;
CREATE POLICY soil_tests_all_policy ON soil_tests FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = soil_tests.user_id AND is_active = true));

-- 5. CROP RECOMMENDATIONS POLICIES
DROP POLICY IF EXISTS crop_rec_all_policy ON crop_recommendations;
CREATE POLICY crop_rec_all_policy ON crop_recommendations FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = crop_recommendations.user_id AND is_active = true));

-- 6. FERTILIZER RECOMMENDATIONS POLICIES
DROP POLICY IF EXISTS fert_rec_all_policy ON fertilizer_recommendations;
CREATE POLICY fert_rec_all_policy ON fertilizer_recommendations FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = fertilizer_recommendations.user_id AND is_active = true));

-- 7. FERTILIZER SCHEDULES POLICIES
DROP POLICY IF EXISTS fert_sched_all_policy ON fertilizer_schedules;
CREATE POLICY fert_sched_all_policy ON fertilizer_schedules FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT helper_id FROM farm_access_permissions WHERE farmer_id = fertilizer_schedules.user_id AND is_active = true));

-- 8. CATALOG TABLES (Public read for authenticated farmers)
DROP POLICY IF EXISTS fert_products_read_policy ON fertilizer_products;
CREATE POLICY fert_products_read_policy ON fertilizer_products FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS product_prices_read_policy ON product_prices;
CREATE POLICY product_prices_read_policy ON product_prices FOR SELECT
    TO authenticated USING (true);

-- 9. FAMILY INVITATIONS POLICIES
DROP POLICY IF EXISTS family_inv_policy ON family_invitations;
CREATE POLICY family_inv_policy ON family_invitations FOR ALL
    USING (auth.uid() = farmer_id);

-- 10. FARM ACCESS PERMISSIONS POLICIES
DROP POLICY IF EXISTS farm_access_policy ON farm_access_permissions;
CREATE POLICY farm_access_policy ON farm_access_permissions FOR ALL
    USING (auth.uid() = farmer_id OR auth.uid() = helper_id);
