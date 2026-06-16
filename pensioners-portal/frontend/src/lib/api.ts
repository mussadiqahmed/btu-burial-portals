import axios from 'axios';

function getApiBaseURL() {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;
  // Production: same-origin /api (avoids http vs https CORS issues)
  if (process.env.NODE_ENV === 'production') return '';
  return 'http://localhost:8001';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

/** e.g. /api/pension when mounted inside BTU index.js; default /api for standalone */
const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api';

api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/api/') && apiBasePath !== '/api') {
    config.url = apiBasePath + config.url.slice(4);
  }
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const role = parsed?.state?.user?.role;
      if (role) {
        config.headers['x-user-role'] = role;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

export default api;
