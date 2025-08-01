import { apiClient } from './authAPI';

const GOOGLE_API_BASE = '/google';

export interface AutoApplyTriggerRequest {
  max_applications?: number;
  filters?: {
    job_categories?: number[];
    locations?: number[];
    experience_level?: string[];
    salary_min?: number;
    employment_type?: string[];
  };
}

export interface AutoApplyResponse {
  task_id: string;
  message: string;
}

export interface GoogleIntegrationStatus {
  id: number;
  status: string;
  auto_apply_enabled: boolean;
  google_email: string;
  last_sync: string;
  token_expires_at: string;
}

export interface AutoApplySession {
  session_id: string;
  status: string;
  max_applications: number;
  jobs_found: number;
  applications_sent: number;
  applications_failed: number;
  started_at: string;
  completed_at?: string;
}

export const googleIntegrationAPI = {
  // Get Google Integration status
  getStatus: (): Promise<GoogleIntegrationStatus> =>
    apiClient.get(`${GOOGLE_API_BASE}/integration/status/`),

  // Get Google OAuth authorization URL
  getAuthorizationUrl: () =>
    apiClient.get(`${GOOGLE_API_BASE}/oauth/authorize/`),

  // Handle OAuth callback
  handleCallback: (data: { code: string; state: string }) =>
    apiClient.post(`${GOOGLE_API_BASE}/oauth/callback/`, data),

  // Update auto-apply settings
  updateAutoApplySettings: (data: {
    auto_apply_enabled: boolean;
    auto_apply_filters?: any;
  }) =>
    apiClient.post(`${GOOGLE_API_BASE}/integration/update_auto_apply_settings/`, data),

  // Trigger auto-apply (this is the one you need!)
  triggerAutoApply: (data: AutoApplyTriggerRequest): Promise<AutoApplyResponse> =>
    apiClient.post(`${GOOGLE_API_BASE}/integration/trigger_auto_apply/`, data),

  // Get auto-apply sessions
  getAutoApplySessions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get(`${GOOGLE_API_BASE}/sessions/`, { params }),

  // Get dashboard stats
  getDashboardStats: () =>
    apiClient.get(`${GOOGLE_API_BASE}/dashboard/stats/`),

  // Disconnect Google integration
  disconnect: () =>
    apiClient.delete(`${GOOGLE_API_BASE}/integration/disconnect/`),
};

// Helper function to construct full URL for debugging
export const getFullGoogleAPIUrl = (endpoint: string) => {
  const baseUrl = 'http://127.0.0.1:8000/api/v1';
  return `${baseUrl}${GOOGLE_API_BASE}${endpoint}`;
};

// Debug function to show correct URLs
export const debugGoogleAPIUrls = () => {
  console.log('🔗 Google Integration API URLs:');
  console.log('Status:', getFullGoogleAPIUrl('/integration/status/'));
  console.log('Trigger Auto-Apply:', getFullGoogleAPIUrl('/integration/trigger_auto_apply/'));
  console.log('Sessions:', getFullGoogleAPIUrl('/sessions/'));
  console.log('OAuth Authorize:', getFullGoogleAPIUrl('/oauth/authorize/'));
}; 