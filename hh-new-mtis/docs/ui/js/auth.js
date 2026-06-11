/* ================================================================
   MTIS Auth Module — login, logout, token, user helpers
   ================================================================ */

const AUTH = {
  /**
   * Login — call API, store token + user, return user data
   */
  async login(username, password) {
    const data = await apiPost('/api/auth/login', { username, password });
    localStorage.setItem('mtis_token', data.token);
    localStorage.setItem('mtis_user', JSON.stringify(data.user));
    return data.user;
  },

  /**
   * Logout — call API, clear storage, redirect to login
   */
  async logout() {
    try {
      await apiPost('/api/auth/logout');
    } catch (_) { /* ignore */ }
    localStorage.removeItem('mtis_token');
    localStorage.removeItem('mtis_user');
    window.location.hash = '#login';
  },

  /**
   * Get stored user object
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('mtis_user'));
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated (has token)
   */
  isAuthenticated() {
    return !!localStorage.getItem('mtis_token');
  },

  /**
   * Get raw JWT token
   */
  getToken() {
    return localStorage.getItem('mtis_token');
  },

  /**
   * Fetch fresh user data from /api/auth/me
   */
  async fetchMe() {
    const data = await apiGet('/api/auth/me');
    if (data.user) {
      localStorage.setItem('mtis_user', JSON.stringify(data.user));
    }
    return data.user;
  },
};
