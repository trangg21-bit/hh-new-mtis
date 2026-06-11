/* ================================================================
   MTIS API Client — fetch wrapper with JWT injection + error handling
   ================================================================ */

const BASE_URL = (function detectBase() {
  // Works in dev (localhost:3000) and when behind a reverse proxy
  return '';
})();

/**
 * Get stored JWT token
 */
function getToken() {
  return localStorage.getItem('mtis_token');
}

/**
 * Build headers with optional JWT bearer token
 */
function buildHeaders(extra) {
  const headers = { 'Content-Type': 'application/json', ...(extra || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

/**
 * Handle response — parse JSON, check ok, handle 401 logout
 */
async function handleResponse(res) {
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { error: text || 'Yêu cầu thất bại' };
  }

  if (!res.ok) {
    // Auto-redirect on session expiry — but NOT during login flow (hash=login or no hash)
    var hash = window.location.hash.replace('#', '') || 'login';
    if (res.status === 401 && hash !== 'login') {
      localStorage.removeItem('mtis_token');
      localStorage.removeItem('mtis_user');
      window.location.hash = '#login';
      throw new Error(data.error || 'Phiên đăng nhập hết hạn');
    }
    const err = new Error(data.error || `Lỗi ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * GET request
 */
async function apiGet(path, params) {
  let url = BASE_URL + path;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');
    if (qs) url += '?' + qs;
  }
  const res = await fetch(url, { method: 'GET', headers: buildHeaders() });
  return handleResponse(res);
}

/**
 * POST request
 */
async function apiPost(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}

/**
 * PUT request
 */
async function apiPut(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}

/**
 * DELETE request
 */
async function apiDelete(path) {
  const res = await fetch(BASE_URL + path, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}
