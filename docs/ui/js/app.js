/* ================================================================
   MTIS SPA Router — Hash-based routing with auth guards
   ================================================================ */

// ─── Helpers ────────────────────────────────────────────────────

function esc(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function statusBadge(status) {
  const map = { 1: ['badge-green', 'Hoạt động'], 2: ['badge-red', 'Đã khóa'], 0: ['badge-gray', 'Đã xóa'] };
  const [cls, label] = map[status] || ['badge-gray', 'Không xác định'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function validatePasswordStrength(pw) {
  const errors = [];
  if (!pw || pw.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  if (!/[A-Z]/.test(pw)) errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  if (!/[a-z]/.test(pw)) errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  if (!/[0-9]/.test(pw)) errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  return errors;
}

// ─── Route Definitions ──────────────────────────────────────────

const ROUTES = {
  'login':           { screen: SCREEN_LOGIN,           auth: false,  title: 'Đăng nhập — MTIS' },
  'register':        { screen: SCREEN_REGISTER,        auth: true,   title: 'Thêm người dùng — MTIS' },
  'forgot-password': { screen: SCREEN_FORGOT_PASSWORD, auth: false,  title: 'Quên mật khẩu — MTIS' },
  'reset-password':  { screen: SCREEN_RESET_PASSWORD,  auth: false,  title: 'Đặt lại mật khẩu — MTIS' },
  'password':        { screen: SCREEN_PASSWORD,        auth: true,   title: 'Đổi mật khẩu — MTIS' },
  'dashboard':       { screen: SCREEN_DASHBOARD,       auth: true,   title: 'Dashboard — MTIS' },
  'users':           { screen: SCREEN_USERS,           auth: true,   title: 'Danh sách người dùng — MTIS' },
  'user-detail':     { screen: SCREEN_USER_DETAIL,     auth: true,   title: 'Chi tiết người dùng — MTIS' },
  'groups':          { screen: SCREEN_GROUPS,          auth: true,   title: 'Nhóm người dùng — MTIS' },
  'permissions':     { screen: SCREEN_PERMISSIONS,     auth: true,   title: 'Phân quyền — MTIS' },
  'login-log':       { screen: SCREEN_LOGIN_LOG,       auth: true,   title: 'Nhật ký đăng nhập — MTIS' },
  'organizations':   { screen: SCREEN_ORGANIZATIONS,   auth: true,   title: 'Đơn vị — MTIS' },
  'sessions':        { screen: SCREEN_SESSIONS,        auth: true,   title: 'Phiên đăng nhập — MTIS' },
  'totp':            { screen: SCREEN_TOTP,            auth: true,   title: 'Cấu hình TOTP — MTIS' },
};

// ─── Router ──────────────────────────────────────────────────────

const ROUTER = {
  _currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    let hash = window.location.hash.replace('#', '') || 'login';
    let token = null;

    // Parse token/param from dynamic routes: reset-password/<token>, user-detail/<id>
    if (hash.startsWith('reset-password/')) {
      token = hash.split('/').slice(1).join('/');
      hash = 'reset-password';
    } else if (hash.startsWith('user-detail/')) {
      token = hash.split('/').slice(1).join('/');
      hash = 'user-detail';
    }

    // Auth guard
    if (ROUTES[hash] && ROUTES[hash].auth && !AUTH.isAuthenticated()) {
      window.location.hash = '#login';
      return;
    }

    // Redirect logged-in users away from public-only screens
    if (ROUTES[hash] && !ROUTES[hash].auth && AUTH.isAuthenticated() && ['login', 'forgot-password', 'reset-password'].includes(hash)) {
      window.location.hash = '#dashboard';
      return;
    }

    // Handle unknown routes
    if (!ROUTES[hash]) {
      window.location.hash = AUTH.isAuthenticated() ? '#dashboard' : '#login';
      return;
    }

    this._currentRoute = hash;
    const route = ROUTES[hash];
    document.title = route.title;

    // Render layout
    if (route.auth) {
      document.getElementById('app-shell').innerHTML = this._renderShell();
      document.getElementById('screen-content').innerHTML = route.screen.render(token);
    } else {
      document.getElementById('app-shell').innerHTML =
        `<div id="screen-content"></div>`;
      document.getElementById('screen-content').innerHTML = route.screen.render(token);
    }

    // After-render hook
    if (route.screen.afterRender) {
      // Use small delay to ensure DOM is ready
      setTimeout(() => route.screen.afterRender(), 0);
    }
  },

  _renderShell() {
    const user = AUTH.getUser();
    const active = this._currentRoute;

    // Build sidebar menu
    const menuSections = [
      {
        label: 'Tổng quan',
        items: [
          { id: 'dashboard', icon: '📊', label: 'Dashboard', hash: '#dashboard' },
        ]
      },
      {
        label: 'Quản lý',
        items: [
          { id: 'users', icon: '👤', label: 'Người dùng', hash: '#users' },
          { id: 'groups', icon: '👥', label: 'Nhóm người dùng', hash: '#groups' },
          { id: 'permissions', icon: '🔐', label: 'Phân quyền', hash: '#permissions' },
          { id: 'organizations', icon: '🏢', label: 'Đơn vị', hash: '#organizations' },
        ]
      },
      {
        label: 'Bảo mật',
        items: [
          { id: 'password', icon: '🔑', label: 'Đổi mật khẩu', hash: '#password' },
          { id: 'sessions', icon: '🖥', label: 'Phiên đăng nhập', hash: '#sessions' },
          { id: 'totp', icon: '🔒', label: 'Cấu hình TOTP', hash: '#totp' },
        ]
      },
      {
        label: 'Giám sát',
        items: [
          { id: 'login-log', icon: '📋', label: 'Nhật ký đăng nhập', hash: '#login-log' },
        ]
      },
    ];

    const menuHtml = menuSections.map(s => `
      <div class="menu-section">${s.label}</div>
      ${s.items.map(i => `
        <a class="menu-item ${active === i.id ? 'active' : ''}" href="${i.hash}">
          <span class="icon">${i.icon}</span>
          <span>${i.label}</span>
        </a>
      `).join('')}
    `).join('');

    const initials = user ? (user.full_name || user.username).charAt(0).toUpperCase() : '?';

    return `
      <!-- Sidebar -->
      <aside class="sidebar" role="navigation" aria-label="Menu chính">
        <div class="sidebar-logo">
          <div class="logo-icon">MT</div>
          <div class="logo-text">
            <strong>MTIS</strong>
            <small>KCHT Hàng hải</small>
          </div>
        </div>
        <nav class="sidebar-menu">
          ${menuHtml}
        </nav>
        <div class="sidebar-footer">
          Cục Hàng hải Việt Nam
        </div>
      </aside>

      <!-- Main wrapper -->
      <div class="main-wrapper">
        <!-- Header -->
        <header class="header" role="banner">
          <h1 id="page-header-title">${ROUTES[active] ? ROUTES[active].title.replace(' — MTIS', '') : ''}</h1>
          <div class="user-info">
            <div class="user-dropdown" id="user-dropdown">
              <span class="name">${esc(user ? user.full_name || user.username : '')}</span>
              <span class="role">${esc(user ? user.role : '')}</span>
              <div class="avatar" role="button" tabindex="0" aria-label="Menu người dùng"
                   onclick="ROUTER.toggleDropdown()" onkeydown="if(event.key==='Enter')ROUTER.toggleDropdown()">
                ${initials}
              </div>
              <div class="dropdown-menu" id="dropdown-menu" style="display:none">
                <a class="dropdown-item" href="#password">🔑 Đổi mật khẩu</a>
                <a class="dropdown-item" href="#sessions">🖥 Phiên đăng nhập</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item text-danger" href="#" onclick="ROUTER.logout()">🚪 Đăng xuất</a>
              </div>
            </div>
          </div>
        </header>

        <!-- Screen content -->
        <div id="screen-content"></div>

        <!-- Footer -->
        <footer class="footer">
          Hệ thống Quản lý KCHT Giao thông Hàng hải (MTIS) &mdash; Cục Hàng hải Việt Nam
        </footer>
      </div>
    `;
  },

  toggleDropdown() {
    const menu = document.getElementById('dropdown-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? '' : 'none';
  },

  logout() {
    AUTH.logout();
  },
};

// ─── Bootstrap ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  ROUTER.init();

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('user-dropdown');
    const menu = document.getElementById('dropdown-menu');
    if (dd && menu && !dd.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
});
