/**
 * Landing page API – same backend as nfcschoolbe.
 * Used for "My artist profiles" only (artists, not students).
 * Set REACT_APP_API_URL in .env (e.g. http://localhost:5000 or https://your-api.vercel.app).
 */
export const API_URL = process.env.REACT_APP_API_URL || '';

async function request(method, path, { body, getIdToken, getFirebaseUser, headers: customHeaders = {} } = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (getIdToken) {
    const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (getFirebaseUser) {
    const user = typeof getFirebaseUser === 'function' ? getFirebaseUser() : getFirebaseUser;
    if (user?.uid) {
      headers['X-Firebase-UID'] = user.uid;
      if (user.email) headers['X-Firebase-Email'] = user.email;
    }
  }
  const base = API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Request failed: ${res.status}`);
  return data;
}

async function uploadPhoto(file, getIdToken) {
  const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
  const form = new FormData();
  form.append('photo', file);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const base = API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
  const res = await fetch(`${base}/api/artist/upload-photo`, {
    method: 'POST',
    headers,
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
  return data;
}

export const landingArtistAPI = {
  getMyProfiles: (getIdToken, getFirebaseUser) =>
    request('GET', '/api/artist/my-profiles', { getIdToken, getFirebaseUser }),
  getMyProfilesWithOtpToken: (otpToken) =>
    request('GET', '/api/artist/my-profiles', { headers: { Authorization: `Bearer ${otpToken}` } }),
  updateMyProfile: (artistId, body, getIdToken, getFirebaseUser) =>
    request('PUT', `/api/artist/me/${encodeURIComponent(artistId)}`, { body, getIdToken, getFirebaseUser }),
  updateMyProfileWithOtpToken: (artistId, body, otpToken) =>
    request('PUT', `/api/artist/me/${encodeURIComponent(artistId)}`, { body, headers: { Authorization: `Bearer ${otpToken}` } }),
  uploadPhoto,
  sendOtp: (email) =>
    request('POST', '/api/artist/send-otp', { body: { email } }),
  verifyOtp: (email, otp) =>
    request('POST', '/api/artist/verify-otp', { body: { email, otp } })
};

// General Profile (Linktree-like) API
export const generalProfileAPI = {
  getMine: (getIdToken, getFirebaseUser) =>
    request('GET', '/api/general-profile/me', { getIdToken, getFirebaseUser }),
  create: (body, getIdToken, getFirebaseUser) =>
    request('POST', '/api/general-profile', { body, getIdToken, getFirebaseUser }),
  update: (body, getIdToken, getFirebaseUser) =>
    request('PUT', '/api/general-profile/me', { body, getIdToken, getFirebaseUser }),
  getByUsername: (username) =>
    request('GET', `/api/general-profile/u/${encodeURIComponent(username)}`),
  uploadPhoto: async (file, getIdToken) => {
    const token = typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
    return uploadPhoto(file, token);
  }
};

export default landingArtistAPI;
