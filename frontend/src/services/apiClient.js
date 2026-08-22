const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const TOKEN_KEY = 'neurocode_token';

// De-dupes identical, concurrent GET requests into a single network call.
// This isn't a data cache — nothing is stored after a request resolves,
// and every new call (e.g. after an admin reset) still hits the network
// fresh. It only collapses requests that are ALREADY in flight at the
// same instant, which both quiets React StrictMode's dev-only double
// effect firing and eliminates the small but real race where two
// concurrent fetches for the same resource could resolve out of order
// and let a stale response overwrite a fresher one.
const inFlightGetRequests = new Map();

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

function dedupedGet(path) {
  if (inFlightGetRequests.has(path)) {
    return inFlightGetRequests.get(path);
  }
  const promise = request(path).finally(() => inFlightGetRequests.delete(path));
  inFlightGetRequests.set(path, promise);
  return promise;
}

export const apiClient = {
  get: (path) => dedupedGet(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const TOKEN_STORAGE_KEY = TOKEN_KEY;