import {
  AuthResponse,
  SoilTest,
  CropRecommendation,
  FertilizerRecommendation,
  FertilizerTask,
  WeatherData,
  UploadReportResult,
  FamilyPermission
} from '../types';

// Read API base URL from environment variable, falling back to local backend port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getHeaders = (isMultipart: boolean = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('krishi_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Session expired
    localStorage.removeItem('krishi_token');
  }

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((err: any) => {
          if (err.msg && err.loc) {
            const field = err.loc[err.loc.length - 1];
            return `${field}: ${err.msg}`;
          }
          return err.msg || JSON.stringify(err);
        }).join(', ');
      } else if (errJson.detail) {
        errorDetail = JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        errorDetail = errJson.message;
      } else {
        errorDetail = JSON.stringify(errJson);
      }
    } catch {
      errorDetail = `Server error (${response.status}: ${response.statusText})`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // --- Auth ---
  auth: {
    signup: async (data: {
      email: string;
      password: string;
      full_name: string;
      phone_number?: string;
      role: 'farmer' | 'family_helper';
      language_preference?: string;
    }): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<AuthResponse>(res);
    },

    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<AuthResponse>(res);
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // --- Crops ---
  crops: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/crops`, {
        headers: getHeaders(),
      });
      return handleResponse<{ crops: any[]; total: number }>(res);
    },
  },

  // --- Soil Tests ---
  soilTests: {
    create: async (data: {
      nitrogen_mg_kg: number;
      phosphorus_mg_kg: number;
      potassium_mg_kg: number;
      soil_ph: number;
      organic_carbon_percent?: number;
      electrical_conductivity_ds_m?: number;
      lab_name?: string;
      notes?: string;
      farm_id?: string;
      report_id?: string;
    }): Promise<SoilTest> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/soil-tests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<SoilTest>(res);
    },

    uploadReport: async (file: File): Promise<UploadReportResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/v1/soil-tests/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse<UploadReportResult>(res);
    },

    list: async (): Promise<SoilTest[]> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/soil-tests`, {
        headers: getHeaders(),
      });
      return handleResponse<SoilTest[]>(res);
    },

    getById: async (id: string): Promise<SoilTest> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/soil-tests/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse<SoilTest>(res);
    },

    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/soil-tests/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse<void>(res);
    },
  },

  // --- Crop Recommendation ---
  cropRecommendations: {
    predict: async (data: {
      nitrogen_mg_kg: number;
      phosphorus_mg_kg: number;
      potassium_mg_kg: number;
      soil_ph: number;
      temperature?: number;
      humidity?: number;
      rainfall?: number;
      farm_id?: string;
      soil_test_id?: string;
    }): Promise<CropRecommendation> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/crop-recommendations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<CropRecommendation>(res);
    },
  },

  // --- Fertilizer Recommendation ---
  fertilizerRecommendations: {
    calculate: async (data: {
      crop_name: string;
      growth_stage: string;
      target_area: number;
      area_unit: string;
      nitrogen_mg_kg: number;
      phosphorus_mg_kg: number;
      potassium_mg_kg: number;
      soil_ph: number;
      sowing_date?: string;
      farm_id?: string;
      soil_test_id?: string;
    }): Promise<FertilizerRecommendation> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/fertilizer-recommendations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<FertilizerRecommendation>(res);
    },
  },

  // --- Fertilizer Schedules ---
  schedules: {
    list: async (statusFilter?: string): Promise<FertilizerTask[]> => {
      const url = statusFilter
        ? `${API_BASE_URL}/api/v1/fertilizer-schedules?status_filter=${statusFilter}`
        : `${API_BASE_URL}/api/v1/fertilizer-schedules`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse<FertilizerTask[]>(res);
    },

    updateStatus: async (id: string, status: 'pending' | 'completed' | 'skipped', notes?: string): Promise<FertilizerTask> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/fertilizer-schedules/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      return handleResponse<FertilizerTask>(res);
    },
  },

  // --- Weather ---
  weather: {
    get: async (lat: number = 16.5062, lon: number = 80.6480, locationName: string = 'Vijayawada, Andhra Pradesh'): Promise<WeatherData> => {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName)}`,
        { headers: getHeaders() }
      );
      return handleResponse<WeatherData>(res);
    },
  },

  // --- History ---
  history: {
    get: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/history`, {
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  // --- Family Helper ---
  family: {
    createInvite: async (inviteePhone: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/family/invite`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ invitee_phone: inviteePhone }),
      });
      return handleResponse<any>(res);
    },

    acceptInvite: async (inviteCode: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/family/accept`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      return handleResponse<any>(res);
    },

    listFarmers: async (): Promise<FamilyPermission[]> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/family/farmers`, {
        headers: getHeaders(),
      });
      return handleResponse<FamilyPermission[]>(res);
    },

    listHelpers: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/family/helpers`, {
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },

    revokeHelper: async (permissionId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/family/helpers/${permissionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },
};
