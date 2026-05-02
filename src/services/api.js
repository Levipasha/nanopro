/**
 * Landing page API – handles profile management and data persistence.
 * Set REACT_APP_API_URL in .env or Vercel Environment Variables to override.
 * Falls back to the Railway production backend if not explicitly configured.
 */
// Resolve API base URL from env var, with a safe fallback to the Railway backend.
// IMPORTANT: REACT_APP_API_URL must include the full protocol (e.g. https://...)
// If the env var is set without a protocol it will be treated as a relative path
// by the browser, causing all API calls to be routed to the wrong host.
function resolveApiUrl() {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    // Safety guard: ensure the URL always starts with a protocol
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      return `https://${envUrl}`;
    }
    return envUrl;
  }

  const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocal) {
    return process.env.REACT_APP_LOCAL_API_URL || 'http://127.0.0.1:5000';
  }

  // Production fallback
  return process.env.REACT_APP_PRODUCTION_API_URL || 'https://microidentity.nanoprofiles.com';
}
export const API_URL = resolveApiUrl();

async function request(method, path, { body, getIdToken, getFirebaseUser, headers: customHeaders = {}, cache } = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (getIdToken) {
    const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (getFirebaseUser) {
    const user = typeof getFirebaseUser === 'function' ? getFirebaseUser() : getFirebaseUser;
    if (user?.uid) headers['X-Firebase-UID'] = user.uid;
    if (user?.email) headers['X-Firebase-Email'] = user.email;
  }
  const base = API_URL;
  const fullUrl = `${base}${path}`;
  console.log(`[API] ${method} ${fullUrl}`);
  const fetchOpts = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'include'
  };
  if (cache !== undefined) fetchOpts.cache = cache;
  const res = await fetch(fullUrl, fetchOpts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errText = [data.message, data.error].filter(Boolean).join(' — ') || `Request failed: ${res.status}`;
    throw new Error(errText);
  }
  return data;
}

async function uploadPhoto(file, getIdToken) {
  const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
  const form = new FormData();
  form.append('photo', file);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const base = API_URL;
  const res = await fetch(`${base}/api/artist/upload-photo`, {
    method: 'POST',
    headers,
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errText = [data.message, data.error].filter(Boolean).join(' — ') || 'Upload failed';
    throw new Error(errText);
  }
  return data;
}

export const landingArtistAPI = {
  getMyProfiles: (getIdToken, getFirebaseUser) =>
    request('GET', '/api/artist/my-profiles', { getIdToken, getFirebaseUser, cache: 'no-store' }),
  createMyProfile: (body, getIdToken, getFirebaseUser) =>
    request('POST', '/api/artist/my-profiles', { body, getIdToken, getFirebaseUser }),
  updateMyProfile: (artistId, body, getIdToken, getFirebaseUser) =>
    request('PUT', `/api/artist/me/${encodeURIComponent(artistId)}`, { body, getIdToken, getFirebaseUser }),
  uploadPhoto,
  checkAccount: (email) =>
    request('POST', '/api/artist/check-account', { body: { email } }),
  // Public, read-only artist profile used by /artist?id=<id>
  getPublicProfile: (artistId) =>
    request('GET', `/api/artist/public/${encodeURIComponent(artistId)}`, { cache: 'no-store' })
};

// General Profile (Linktree-like) API
export const generalProfileAPI = {
  getMine: (getIdToken, getFirebaseUser, profileType = 'general') =>
    request('GET', `/api/general-profile/me?type=${encodeURIComponent(profileType)}`, {
      getIdToken,
      getFirebaseUser,
      cache: 'no-store'
    }),
  create: (body, getIdToken, getFirebaseUser) =>
    request('POST', '/api/general-profile', { body, getIdToken, getFirebaseUser }),
  update: (body, getIdToken, getFirebaseUser) =>
    request('PUT', '/api/general-profile/me', { body, getIdToken, getFirebaseUser }),
  getByUsername: (username) =>
    request('GET', `/api/general-profile/u/${encodeURIComponent(username)}`, { cache: 'no-store' }),
  uploadPhoto: async (file, getIdToken) => {
    const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
    return uploadPhoto(file, token);
  },
  uploadMenuPdf: async (file, getIdToken, getFirebaseUser) => {
    const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
    const form = new FormData();
    form.append('file', file);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const user = typeof getFirebaseUser === 'function' ? getFirebaseUser() : getFirebaseUser;
    if (user?.uid) headers['X-Firebase-UID'] = user.uid;
    if (user?.email) headers['X-Firebase-Email'] = user.email;
    const base = API_URL;
    const res = await fetch(`${base}/api/general-profile/upload-pdf`, {
      method: 'POST',
      headers,
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
    return data;
  }
};

export default landingArtistAPI;
