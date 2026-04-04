import axios from 'axios';

const API_BASE_URL = 'https://boxcricklive-api-867616965727.asia-south1.run.app/';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  try {
    // Try to hit the root or a known health endpoint
    await axios.get(API_BASE_URL, { timeout: 5000 });
    return true;
  } catch (err) {
    return false;
  }
};

// Add interceptor for tokens if needed later
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.message === 'Network Error') {
      console.error('CRITICAL: Network Error detected. Possible causes: CORS, API down, or SSL issues.', {
        baseURL: API_BASE_URL,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    } else if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const token = localStorage.getItem('token');

      if (refreshToken && token) {
        try {
          console.log('[Auth] Attempting to refresh token...');
          const response = await axios.post(`${API_BASE_URL}/api/Auth/Refresh`, {
            token: token,
            refreshToken: refreshToken
          });

          if (response.data.token) {
            console.log('[Auth] Token refreshed successfully');
            localStorage.setItem('token', response.data.token);
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            api.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.token;
            originalRequest.headers['Authorization'] = 'Bearer ' + response.data.token;
            
            processQueue(null, response.data.token);
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[Auth] Token refresh failed', refreshError);
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        console.warn('Unauthorized access - no refresh token available');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const joinMatch = async (matchId: string, teamId: string, username: string) => {
  return api.post(`/api/Match/${matchId}/Join`, {
    teamId,
    username
  });
};

export default api;
