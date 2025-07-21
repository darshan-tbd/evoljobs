import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';



// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip redirect for optional APIs like saved jobs
    const isOptionalAPI = originalRequest.url?.includes('/saved-jobs/') || 
                          originalRequest.url?.includes('/recommendations/') ||
                          originalRequest.url?.includes('/profile-completeness/') ||
                          originalRequest.url?.includes('/jobs/jobs/');
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          // Only redirect if this is not an optional API
          if (!isOptionalAPI) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - only redirect if not optional API
        if (!isOptionalAPI) {
          window.location.href = '/login';
        } else {
          // For optional APIs, try the request without authentication
          if (!originalRequest._retriedWithoutAuth) {
            originalRequest._retriedWithoutAuth = true;
            delete originalRequest.headers.Authorization;
            return apiClient(originalRequest);
          }
        }
      }
    }
    
    // For optional APIs with 401 or 404 errors, try without authentication
    if ((error.response?.status === 401 || error.response?.status === 404) && isOptionalAPI && !originalRequest._retriedWithoutAuth) {
      originalRequest._retriedWithoutAuth = true;
      delete originalRequest.headers.Authorization;
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login/', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    user_type?: string;
  }) => apiClient.post('/auth/register/', userData),
  
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout/', { refresh_token: refreshToken }),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/token/refresh/', { refresh: refreshToken }),
  
  getProfile: () =>
    apiClient.get('/auth/profile/'),
  
  updateProfile: (data: any) =>
    apiClient.put('/auth/profile/', data),
  
  changePassword: (data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => apiClient.post('/auth/change-password/', data),
  
  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password-reset/', { email }),
  
  confirmPasswordReset: (data: {
    token: string;
    new_password: string;
    confirm_password: string;
  }) => apiClient.post('/auth/password-reset/confirm/', data),
  
  verifyToken: () =>
    apiClient.post('/auth/verify-token/'),
  
  getAuthStatus: () =>
    apiClient.get('/auth/status/'),
}; 