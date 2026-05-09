import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Decode JWT payload without verifying signature (client-side only) */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? null; // epoch seconds
  } catch {
    return null;
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(newToken: string) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

// Attach JWT and proactively refresh when < 60 s remain
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('pharma_token');
  if (!token) return config;

  const exp = getTokenExpiry(token);
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = exp ? exp - now : Infinity;

  // Proactive refresh when ≤ 60 s left
  if (secondsLeft <= 60 && !isRefreshing && !config.url?.includes('/auth/refresh')) {
    isRefreshing = true;
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const newToken: string = res.data.access_token;
      localStorage.setItem('pharma_token', newToken);
      if (res.data.user) localStorage.setItem('pharma_user', JSON.stringify(res.data.user));
      processQueue(newToken);
      config.headers.Authorization = `Bearer ${newToken}`;
    } catch {
      // Refresh failed — let the 401 handler below log the user out
    } finally {
      isRefreshing = false;
    }
  } else if (isRefreshing && !config.url?.includes('/auth/refresh')) {
    // Queue this request until refresh finishes
    await new Promise<string>(resolve => refreshQueue.push(resolve))
      .then(newToken => { config.headers.Authorization = `Bearer ${newToken}`; });
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// On 401 (refresh truly failed or token invalid) — log out
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharma_token');
      localStorage.removeItem('pharma_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

