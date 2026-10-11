export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  language_preference: string;
  role: 'farmer' | 'family_helper';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  full_name: string;
  role: 'farmer' | 'family_helper';
  language_preference: string;
}

export interface SoilTest {
  id: string;
  user_id: string;
  farm_id?: string;
  report_id?: string;
  sample_date?: string;
  nitrogen_mg_kg: number;
  phosphorus_mg_kg: number;
  potassium_mg_kg: number;
  soil_ph: number;
  organic_carbon_percent?: number;
  electrical_conductivity_ds_m?: number;
  lab_name?: string;
  notes?: string;
  created_at: string;
}

export interface SecondaryCrop {
  crop: string;
  suitability: string;
  confidence: number;
}

export interface CropRecommendation {
  id?: string;
  predicted_crop: string;
  secondary_crops: SecondaryCrop[];
  confidence_score: number;
  explanation: string;
  seasonal_advisory: string;
  model_version: string;
  data_source: string;
  limitations: string;
  input_parameters: Record<string, any>;
}

export interface RecommendedProduct {
  product_name: string;
  generic_name: string;
  quantity_kg: number;
  bags: number;
  bag_size_kg: number;
  unit_price_inr: number;
  subtotal_inr: number;
  timing_stage: string;
  application_method: string;
}

export interface SplitSchedule {
  stage: string;
  days_from_sowing: number;
  due_date?: string;
  product_name: string;
  quantity_kg: number;
  method: string;
  instructions: string;
}

export interface FertilizerRecommendation {
  id?: string;
  crop_name: string;
  growth_stage: string;
  target_area: number;
  area_unit: string;
  target_area_hectares: number;
  nutrient_status: {
    nitrogen: { status: string; factor: number; description: string };
    phosphorus: { status: string; factor: number; description: string };
    potassium: { status: string; factor: number; description: string };
    ph: { value: number; status: string; description: string };
  };
  recommended_products: RecommendedProduct[];
  split_schedule: SplitSchedule[];
  total_estimated_cost_inr: number;
  price_source: string;
  safety_instructions: string;
  recommendation_source: string;
  assumptions: string;
}

export interface FertilizerTask {
  id: string;
  user_id: string;
  recommendation_id?: string;
  task_title: string;
  stage_name: string;
  due_date: string;
  product_name: string;
  quantity_kg: number;
  application_method: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface CurrentWeather {
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  condition: string;
  description: string;
  icon: string;
  rainfall_mm: number;
  spray_advisory: string;
}

export interface WeatherForecast {
  date: string;
  temp_min_c: number;
  temp_max_c: number;
  condition: string;
  rain_probability_percent: number;
}

export interface WeatherData {
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  is_live: boolean;
  data_source: string;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  notes: string;
}

export interface UploadReportResult {
  report_id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  extracted_data: {
    nitrogen_mg_kg?: number | null;
    phosphorus_mg_kg?: number | null;
    potassium_mg_kg?: number | null;
    soil_ph?: number | null;
    organic_carbon_percent?: number | null;
    electrical_conductivity_ds_m?: number | null;
    lab_name?: string | null;
    detected_units?: string;
  };
  extraction_status: 'success' | 'partial' | 'failed';
  message: string;
}

export interface FamilyPermission {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone?: string;
  permission_level: string;
  is_active: boolean;
  created_at: string;
}
