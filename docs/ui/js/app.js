/* ================================================================
   MTIS SPA Router — Hash-based routing với auth guards
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

// ─── Sidebar Menu Configuration (M01-M11) — Accordion ────────

const SIDEBAR_MENU = [
  {
    label: icons.iconMonitor + ' Trang chủ',
    items: [
      { id: 'dashboard', icon: icons.iconMonitor, label: 'Tổng quan', hash: '#dashboard' }
    ],
    open: true
  },
  {
    label: icons.iconUsers + ' Quản lý người dùng',
    isParent: true,
    items: [
      { id: 'users', icon: icons.iconUsers, label: 'Danh sách người dùng', hash: '#users' },
      { id: 'groups', icon: icons.iconUsers, label: 'Nhóm người dùng', hash: '#groups' },
      { id: 'permissions', icon: icons.iconLock, label: 'Phân quyền', hash: '#permissions' },
      { id: 'organizations', icon: icons.iconOrg, label: 'Đơn vị', hash: '#organizations' }
    ],
    open: false
  },
  {
    label: icons.iconDoc + ' Nhật ký & Phiên',
    isParent: true,
    items: [
      { id: 'login-log', icon: icons.iconDoc, label: 'Nhật ký đăng nhập', hash: '#login-log' }
    ],
    open: false
  },
  {
    label: icons.iconWrench + ' Quản trị hệ thống',
    items: [
      { id: 'dashboard', icon: icons.iconMonitor, label: 'Tổng quan', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconRuler + ' Thông số kỹ thuật KCHT',
    items: [
      { id: 'dashboard', icon: icons.iconRuler, label: 'Thông số KCHT', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconWrench + ' Vận hành bảo trì',
    items: [
      { id: 'dashboard', icon: icons.iconWrench, label: 'Vận hành & bảo trì', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconDoc + ' Quy hoạch KCHT',
    items: [
      { id: 'dashboard', icon: icons.iconDoc, label: 'Quy hoạch', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconHardHat + ' Quản lý tài sản',
    items: [
      { id: 'dashboard', icon: icons.iconHardHat, label: 'Tài sản KCHT', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconMap + ' Bản đồ GIS',
    items: [
      { id: 'dashboard', icon: icons.iconMap, label: 'Bản đồ GIS', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconBarChart + ' Báo cáo thống kê',
    items: [
      { id: 'dashboard', icon: icons.iconBarChart, label: 'Báo cáo', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconLink + ' Liên thông dữ liệu',
    items: [
      { id: 'dashboard', icon: icons.iconLink, label: 'Liên thông', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconCompass + ' Biên tập hải đồ',
    items: [
      { id: 'dashboard', icon: icons.iconCompass, label: 'Hải đồ', hash: '#dashboard' }
    ],
    open: false
  },
  {
    label: icons.iconDatabase + ' Tạo lập CSDL',
    items: [
      { id: 'dashboard', icon: icons.iconDatabase, label: 'Tạo lập CSDL KCHT', hash: '#dashboard' }
    ],
    open: false
  }
];

// ─── Route Definitions ──────────────────────────────────────────

const ROUTES = {
  'login':           { screen: SCREEN_LOGIN,           auth: false,  title: 'Đăng nhập — QL KCHT Hàng hải' },
  'register':        { screen: SCREEN_REGISTER,        auth: true,   title: 'Thêm người dùng — QL KCHT Hàng hải' },
  'forgot-password': { screen: SCREEN_FORGOT_PASSWORD, auth: false,  title: 'Quên mật khẩu — QL KCHT Hàng hải' },
  'reset-password':  { screen: SCREEN_RESET_PASSWORD,  auth: false,  title: 'Đặt lại mật khẩu — QL KCHT Hàng hải' },
  'password':        { screen: SCREEN_PASSWORD,        auth: true,   title: 'Đổi mật khẩu — QL KCHT Hàng hải' },
  'dashboard':       { screen: SCREEN_DASHBOARD,       auth: true,   title: 'Tổng quan hệ thống — QL KCHT Hàng hải' },
  'users':           { screen: SCREEN_USERS,           auth: true,   title: 'Danh sách người dùng — QL KCHT Hàng hải' },
  'user-detail':     { screen: SCREEN_USER_DETAIL,     auth: true,   title: 'Chi tiết người dùng — QL KCHT Hàng hải' },
  'groups':          { screen: SCREEN_GROUPS,          auth: true,   title: 'Nhóm người dùng — QL KCHT Hàng hải' },
  'permissions':     { screen: SCREEN_PERMISSIONS,     auth: true,   title: 'Phân quyền — QL KCHT Hàng hải' },
  'login-log':       { screen: SCREEN_LOGIN_LOG,       auth: true,   title: 'Nhật ký đăng nhập — QL KCHT Hàng hải' },
  'organizations':   { screen: SCREEN_ORGANIZATIONS,   auth: true,   title: 'Đơn vị — QL KCHT Hàng hải' },
};

// ─── Router ─────────────────────────────────────────────────────

const ROUTER = {
  _currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    let hash = window.location.hash.replace('#', '') || 'login';
    // Ensure hash is visible for auth guards + tests (do NOT trigger re-resolve)
    if (hash === 'login' && window.location.hash !== '#login') {
      history.replaceState(null, '', '#login');
    }
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

    // Cleanup hook for previous screen
    if (this._currentScreen && this._currentScreen.destroy) {
      this._currentScreen.destroy();
    }
    this._currentScreen = route.screen;
  },

  _renderShell() {
    const user = AUTH.getUser();
    const active = this._currentRoute;

    // Build sidebar menu from SIDEBAR_MENU config (accordion)
    const menuHtml = SIDEBAR_MENU.map((section, idx) => {
      const sectionId = `section-${idx}`;
      const isOpen = section.open ? 'menu-section-open' : '';
      const hasChildren = section.items && section.items.length > 1;
      const toggle = hasChildren ? `onclick="ROUTER.toggleSection('${sectionId}')"` : '';
      const children = section.items.map(i => `
        <a class="menu-item ${active === i.id ? 'active' : ''}" href="${i.hash}">
          <span class="icon">${i.icon}</span>
          <span>${i.label}</span>
        </a>
      `).join('');
      return `
        <div class="menu-section ${isOpen}" id="${sectionId}">
          <div class="menu-section-header" ${toggle}>
            <span>${section.label}</span>
            ${hasChildren ? '<span class="menu-arrow">▼</span>' : ''}
          </div>
          <div class="menu-section-body">${children}</div>
        </div>
      `;
    }).join('');

    const initials = user ? (user.full_name || user.username).charAt(0).toUpperCase() : '?';

    return `
      <!-- Sidebar -->
        <aside class="sidebar" role="navigation" aria-label="Menu chính">
          <div class="sidebar-logo">
            <img class="logo-img" src="assets/logo-cuc-hang-hai.svg" alt="Cục Hàng hải Việt Nam">
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
          <div class="header-brand">
            <strong>HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI</strong>
            <small>Cục Hàng hải Việt Nam</small>
          </div>
          <div class="user-info">
            <div class="user-dropdown" id="user-dropdown">
              <span class="name">${esc(user ? user.full_name || user.username : '')}</span>
              <span class="role">${esc(user ? user.role : '')}</span>
              <div class="avatar" role="button" tabindex="0" aria-label="Menu người dùng"
                   onclick="ROUTER.toggleDropdown()" onkeydown="if(event.key==='Enter')ROUTER.toggleDropdown()">
                ${initials}
              </div>
              <div class="dropdown-menu" id="dropdown-menu" style="display:none">
                <a class="dropdown-item" href="#password"><span class="icon">${icons.iconLock}</span> Đổi mật khẩu</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item text-danger" href="#" onclick="ROUTER.logout()">Đăng xuất</a>
              </div>
            </div>
          </div>
        </header>

        <!-- Screen content -->
        <div id="screen-content"></div>

        <!-- Footer -->
        <footer class="footer">
          Hệ thống QL KCHT Hàng hải — Cục Hàng hải Việt Nam
        </footer>
      </div>
    `;
  },

  toggleDropdown() {
    const menu = document.getElementById('dropdown-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? '' : 'none';
  },

  toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.classList.toggle('menu-section-open');
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
