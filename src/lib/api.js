// Central API utility for NextHire frontend
const BASE_URL = 'http://localhost:5000/api';

// ── Helper: attach Authorization header ──────────────────────────────────────
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('nh_token')
    ? { Authorization: `Bearer ${localStorage.getItem('nh_token')}` }
    : {})
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const apiRegister = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const apiLogin = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const apiGetMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  return res.json();
};

export const apiUpdateProfile = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

// Upload a profile picture (multipart/form-data)
export const apiUploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${BASE_URL}/auth/avatar`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type here — browser sets it with boundary automatically
      ...(localStorage.getItem('nh_token')
        ? { Authorization: `Bearer ${localStorage.getItem('nh_token')}` }
        : {})
    },
    body: formData
  });
  return res.json();
};

// ── Interview History ─────────────────────────────────────────────────────────

export const apiAddInterviewHistory = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/history`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

// ── Session helpers ───────────────────────────────────────────────────────────

export const saveSession = (token, user) => {
  localStorage.setItem('nh_token', token);
  localStorage.setItem('nh_user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('nh_token');
  localStorage.removeItem('nh_user');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('nh_user')) || null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!localStorage.getItem('nh_token');
