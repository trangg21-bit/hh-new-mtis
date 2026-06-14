/* ================================================================
   MTIS System Dashboard — Redesigned Home page (Wave 2)
   Modern hero, stat cards, module roadmap, quick access, activity
   ================================================================ */

const SYSTEM_MODULES = [
  { id: 'M01', name: 'User Management', name_vn: 'Quản lý người dùng', desc: 'Đăng ký, đăng nhập, phân quyền, bảo mật', status: 'active', icon: icons.iconUsers, hash: '#users', features: 10 },
  { id: 'M02', name: 'System Administration', name_vn: 'Quản trị hệ thống', desc: 'Quản lý đơn vị, cấu hình, phê duyệt, backup', status: 'planned', icon: icons.iconWrench, hash: '#dashboard', features: 8 },
  { id: 'M03', name: 'Technical Parameters', name_vn: 'Thông số kỹ thuật KCHT', desc: 'Cảng, bến, luồng, phao, đèn biển, đê chắn sóng', status: 'planned', icon: icons.iconRuler, hash: '#dashboard', features: 26 },
  { id: 'M04', name: 'Operations & Maintenance', name_vn: 'Vận hành bảo trì', desc: 'Kế hoạch vận hành, bảo trì, sự cố, báo cáo', status: 'planned', icon: icons.iconWrench, hash: '#dashboard', features: 8 },
  { id: 'M05', name: 'Planning Management', name_vn: 'Quy hoạch KCHT', desc: 'Quy hoạch bến cảng, năng lực thông qua', status: 'planned', icon: icons.iconDoc, hash: '#dashboard', features: 3 },
  { id: 'M06', name: 'Asset Management', name_vn: 'Quản lý tài sản KCHT', desc: 'Tài sản cố định, khấu hao, thanh lý, kiểm kê', status: 'planned', icon: icons.iconHardHat, hash: '#dashboard', features: 14 },
  { id: 'M07', name: 'GIS/Map', name_vn: 'Bản đồ GIS KCHT', desc: 'Đối tượng điểm, đường, vùng trên bản đồ', status: 'planned', icon: icons.iconMap, hash: '#dashboard', features: 8 },
  { id: 'M08', name: 'Reporting', name_vn: 'Báo cáo thống kê', desc: 'Báo cáo tài sản, thông số, sản lượng, an toàn', status: 'planned', icon: icons.iconBarChart, hash: '#dashboard', features: 8 },
  { id: 'M09', name: 'Data Interconnection', name_vn: 'Liên thông dữ liệu', desc: 'Đồng bộ LGSP, NDXP, Web API, CSDL Bộ GTVT', status: 'planned', icon: icons.iconLink, hash: '#dashboard', features: 6 },
  { id: 'M10', name: 'Nautical Chart', name_vn: 'Biên tập hải đồ', desc: 'Import ENC S-57/S-63, biên tập, xuất bản hải đồ', status: 'planned', icon: icons.iconCompass, hash: '#dashboard', features: 10 },
  { id: 'M11', name: 'Database Creation', name_vn: 'Tạo lập CSDL KCHT', desc: 'Số hóa dữ liệu, nhập liệu, đồng bộ CSDL MTIS', status: 'planned', icon: icons.iconDatabase, hash: '#dashboard', features: 4 }
];

// Quick access items with icon + color variant
const QUICK_ACCESS_ITEMS = [
  { label: 'Người dùng', hash: '#users', icon: icons.iconUsers, color: 'primary' },
  { label: 'Nhóm', hash: '#groups', icon: icons.iconUsers, color: 'success' },
  { label: 'Phân quyền', hash: '#permissions', icon: icons.iconLock, color: 'warning' },
  { label: 'Nhật ký', hash: '#login-log', icon: icons.iconDoc, color: 'info' },
  { label: 'Đơn vị', hash: '#organizations', icon: icons.iconOrg, color: 'purple' },
  { label: 'Phiên', hash: '#sessions', icon: icons.iconMonitor, color: 'danger' },
  { label: 'Đổi mật khẩu', hash: '#password', icon: icons.iconLock, color: 'primary' },
  { label: 'Báo cáo', hash: '#dashboard', icon: icons.iconBarChart, color: 'success' },
];

// Mock activity data for demo
const MOCK_ACTIVITIES = [
  { username: 'admin', action: 'Đã đăng nhập thành công', ip: '192.168.1.10', device: 'Chrome / macOS', time: '10 phút trước', dotColor: 'dot-success' },
  { username: 'nguyenvana', action: 'Đã thêm người dùng mới', ip: '10.0.0.5', device: 'Firefox / Windows', time: '25 phút trước', dotColor: 'dot-info' },
  { username: 'tranb', action: 'Đã khóa tài khoản test01', ip: '172.16.0.3', device: 'Chrome / Windows', time: '1 giờ trước', dotColor: 'dot-warning' },
  { username: 'lecong', action: 'Đã đăng nhập thành công', ip: '192.168.2.20', device: 'Safari / macOS', time: '2 giờ trước', dotColor: 'dot-success' },
  { username: 'admin', action: 'Đã cập nhật thông số kỹ thuật M03-001', ip: '192.168.1.10', device: 'Chrome / macOS', time: '3 giờ trước', dotColor: 'dot-info' },
];

// Mock stats for demo display
const MOCK_STATS = {
  total_users: 247,
  active_sessions: 18,
  locked_accounts: 5,
  total_modules: 11,
  active_modules: 1,
  pending_requests: 3
};

const SCREEN_DASHBOARD = {
  _stats: null,
  _datetimeInterval: null,
  _activityInterval: null,

  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return 'Chào buổi sáng';
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  },

  _formatDateTime(date) {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return { dateStr: `${day}/${month}/${year}`, dayName, timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
  },

  _startDatetimeTicker() {
    // Update time every second
    this._updateDatetimeDisplay();
    if (this._datetimeInterval) clearInterval(this._datetimeInterval);
    this._datetimeInterval = setInterval(() => this._updateDatetimeDisplay(), 1000);
  },

  _updateDatetimeDisplay() {
    const now = new Date();
    const { dateStr, dayName, timeStr } = this._formatDateTime(now);
    const dateEl = document.getElementById('hero-date');
    const timeEl = document.getElementById('hero-time');
    const dayEl = document.getElementById('hero-day');
    if (dateEl) dateEl.textContent = `${dayName}, ${dateStr}`;
    if (timeEl) timeEl.textContent = timeStr;
  },

  render() {
    const user = AUTH.getUser();
    const stats = this._stats || MOCK_STATS;
    const greeting = this._getGreeting();

    // Stat cards HTML (6 cards with different colors)
    const statCards = [
      { label: 'Tổng người dùng', value: stats.total_users, sub: 'Tất cả tài khoản', icon: icons.iconUsers, color: 'primary' },
      { label: 'Phiên đang hoạt động', value: stats.active_sessions, sub: 'Đang đăng nhập', icon: icons.iconMonitor, color: 'success' },
      { label: 'Tài khoản bị khóa', value: stats.locked_accounts, sub: 'Cần xử lý', icon: icons.iconLock, color: 'danger' },
      { label: 'Tổng số module', value: stats.total_modules, sub: 'M01–M11', icon: icons.iconFolder, color: 'info' },
      { label: 'Module đang chạy', value: stats.active_modules, sub: 'Hoạt động', icon: icons.iconCheck, color: 'success' },
      { label: 'Yêu cầu chờ', value: stats.pending_requests, sub: 'Đang chờ duyệt', icon: icons.iconAlert, color: 'warning' },
    ].map(s => `
      <div class="stat-card-modern stat-${s.color}" role="status" aria-label="${s.label}: ${s.value}">
        <div class="stat-icon" aria-hidden="true">${s.icon}</div>
        <div class="stat-info-block">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-sub">${s.sub}</div>
        </div>
      </div>
    `).join('');

    // Module roadmap cards (M01-M11)
    const moduleCards = SYSTEM_MODULES.map(m => `
      <div class="module-roadmap-card ${m.status === 'active' ? 'active-module' : 'coming-module'}" role="region" aria-label="Module ${m.id}: ${m.name_vn}">
        <div class="module-card-header">
          <div class="module-card-icon ${m.status === 'active' ? 'active-icon' : 'planned-icon'}" aria-hidden="true">${m.icon}</div>
          <div class="module-card-title">
            <div class="module-name">${m.name_vn} <small class="module-id">${m.id}</small></div>
          </div>
        </div>
        <div class="module-card-desc">${m.desc}</div>
        <div class="module-card-footer">
          <span class="module-card-badge ${m.status === 'active' ? 'active-badge' : 'planned-badge'}">
            <span class="status-dot"></span>
            ${m.status === 'active' ? 'Đang hoạt động' : 'Chưa triển khai'}
          </span>
          <span class="module-card-features">${m.features} tính năng</span>
        </div>
        ${m.status === 'active' ? `<a href="${m.hash}" class="btn btn-sm btn-primary" style="margin-top:10px;width:100%;justify-content:center;">Mở →</a>` : ''}
      </div>
    `).join('');

    // Quick access grid
    const quickAccess = QUICK_ACCESS_ITEMS.map(q => `
      <a href="${q.hash}" class="quick-access-item qa-${q.color}" role="button" tabindex="0" aria-label="${q.label}">
        <div class="qa-icon" aria-hidden="true">${q.icon}</div>
        <div class="qa-label">${q.label}</div>
      </a>
    `).join('');

    // Activity feed HTML (rendered client-side after mock data)
    const activityContainerId = 'dashboard-activity-feed';

    return `
      <div class="content" id="main-content">
        <!-- Hero Section -->
        <div class="dashboard-hero">
          <div class="hero-content">
            <div class="hero-left">
              <h1><span aria-hidden="true">${icons.iconMonitor}</span> Hệ thống Quản lý KCHT Giao thông Hàng hải</h1>
              <p class="hero-subtitle">Cục Hàng hải Việt Nam</p>
              <p class="hero-welcome">${greeting}, <strong>${user ? esc(user.full_name || user.username) : '...'}</strong></p>
            </div>
            <div class="hero-right">
              <div class="hero-datetime">
                <div class="date" id="hero-date" aria-live="polite">--/--/----</div>
                <div class="time" id="hero-time" aria-live="polite">--:--:--</div>
                <div class="time" id="hero-day" style="font-size:var(--font-size-xxs);opacity:0.7;margin-top:2px;" aria-live="polite"></div>
              </div>
              <div class="hero-mini-stats">
                <div class="hero-mini-stat">
                  <span class="value" id="hero-stat-users">${stats.total_users}</span>
                  <span class="label">Người dùng</span>
                </div>
                <div class="hero-mini-stat">
                  <span class="value" id="hero-stat-sessions">${stats.active_sessions}</span>
                  <span class="label">Phiên</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stat-cards-grid">${statCards}</div>

        <!-- Two-column layout: Modules + Sidebar -->
        <div class="dashboard-grid">
          <!-- Main section -->
          <div class="main-section">
            <!-- Module Roadmap -->
            <div class="dashboard-section">
              <div class="section-header">
                <h2 class="section-title"><span class="title-icon" aria-hidden="true">${icons.iconFolder}</span> Lộ trình module</h2>
              </div>
              <div class="module-roadmap-grid">${moduleCards}</div>
            </div>

            <!-- Quick Access -->
            <div class="dashboard-section">
              <h2 class="section-title"><span class="title-icon" aria-hidden="true">${icons.iconLock}</span> Truy cập nhanh</h2>
              <div class="quick-access-grid">${quickAccess}</div>
            </div>

            <!-- Activity Feed -->
            <div class="dashboard-section">
              <h2 class="section-title"><span class="title-icon" aria-hidden="true">${icons.iconDoc}</span> Hoạt động gần đây</h2>
              <div class="activity-feed">
                <div class="activity-timeline" id="${activityContainerId}">
                  <div class="activity-empty">
                    <div class="empty-icon" aria-hidden="true">${icons.iconDoc}</div>
                    <p>Đang tải...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar section -->
          <div class="sidebar-section">
            <!-- System Info Panel -->
            <div class="system-info-panel">
              <div class="info-title"><span aria-hidden="true">${icons.iconInfo}</span> Thông tin hệ thống</div>
              <div class="system-info-row">
                <span class="label">Phiên bản</span>
                <span class="value">v2.0.0</span>
              </div>
              <hr class="system-info-divider">
              <div class="system-info-row">
                <span class="label">Ngày cập nhật</span>
                <span class="value">13/06/2026</span>
              </div>
              <hr class="system-info-divider">
              <div class="system-info-row">
                <span class="label">Frontend</span>
                <span class="value">SPA (Vanilla JS)</span>
              </div>
              <hr class="system-info-divider">
              <div class="system-info-row">
                <span class="label">Modules</span>
                <span class="value">${stats.active_modules}/${stats.total_modules} active</span>
              </div>
              <hr class="system-info-divider">
              <div class="system-info-row">
                <span class="label">Backend API</span>
                <span class="value" id="system-api-status">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // Start datetime ticker
    this._startDatetimeTicker();

    // Load real stats, then load activity
    await this.loadStats();
    await this.loadActivity();

    // Poll activity feed every 30s
    this._activityInterval = setInterval(() => this.loadActivity(), 30000);
  },

  /**
   * Cleanup timers on screen destroy (called by router on route change)
   */
  destroy() {
    if (this._datetimeInterval) {
      clearInterval(this._datetimeInterval);
      this._datetimeInterval = null;
    }
    if (this._activityInterval) {
      clearInterval(this._activityInterval);
      this._activityInterval = null;
    }
  },

  async loadStats() {
    try {
      const data = await apiGet('/api/admin/stats');
      this._stats = {
        total_users: data.total_users || MOCK_STATS.total_users,
        active_sessions: data.active_sessions || MOCK_STATS.active_sessions,
        locked_accounts: data.locked_accounts || MOCK_STATS.locked_accounts,
        total_modules: MOCK_STATS.total_modules,
        active_modules: MOCK_STATS.active_modules,
        pending_requests: data.failed_logins_30d || 0
      };

      // Update stat cards (replace mock with real data)
      const statValues = document.querySelectorAll('.stat-card-modern .stat-value');
      if (statValues[0]) statValues[0].textContent = this._stats.total_users;
      if (statValues[1]) statValues[1].textContent = this._stats.active_sessions;
      if (statValues[2]) statValues[2].textContent = this._stats.locked_accounts;
      if (statValues[3]) statValues[3].textContent = this._stats.total_modules;
      if (statValues[4]) statValues[4].textContent = this._stats.active_modules;
      if (statValues[5]) statValues[5].textContent = this._stats.pending_requests;

      // Update hero mini stats
      const heroUsers = document.getElementById('hero-stat-users');
      const heroSessions = document.getElementById('hero-stat-sessions');
      if (heroUsers) heroUsers.textContent = this._stats.total_users;
      if (heroSessions) heroSessions.textContent = this._stats.active_sessions;

      // Update system info panel
      const systemModules = document.querySelector('.system-info-panel .system-info-row:nth-child(8) .value');
      if (systemModules) systemModules.textContent = `${this._stats.active_modules}/${this._stats.total_modules} active`;

      // Check API status via /api/health
      const apiStatusEl = document.getElementById('system-api-status');
      if (apiStatusEl) {
        try {
          const health = await apiGet('/api/health');
          apiStatusEl.textContent = health.status === 'ok' ? '🟢 Online' : '🟡 Degraded';
        } catch {
          apiStatusEl.textContent = '🔴 Offline';
        }
      }
    } catch (e) {
      console.error('Dashboard stats load failed:', e);
      // Keep mock data when API fails
      const apiStatusEl = document.getElementById('system-api-status');
      if (apiStatusEl) apiStatusEl.textContent = '🟡 Demo';
      this._stats = this._stats || MOCK_STATS;

      // Update stat cards with mock data
      const statValues = document.querySelectorAll('.stat-card-modern .stat-value');
      if (statValues[0]) statValues[0].textContent = MOCK_STATS.total_users;
      if (statValues[1]) statValues[1].textContent = MOCK_STATS.active_sessions;
      if (statValues[2]) statValues[2].textContent = MOCK_STATS.locked_accounts;
      if (statValues[5]) statValues[5].textContent = MOCK_STATS.pending_requests;
    }
  },

  async loadActivity() {
    try {
      const data = await apiGet('/api/auth/login-log', { limit: 5, status: 'success' });
      const logs = data.logs || [];

      let activities;
      if (logs.length > 0) {
        // Use real data from API
        activities = logs.map(l => ({
          username: esc(l.username),
          action: 'Đã đăng nhập thành công',
          ip: esc(l.ip || '—'),
          device: esc((l.device || '').slice(0, 30)),
          time: esc(l.logged_at || '—'),
          dotColor: 'dot-success'
        }));
      } else {
        // Fallback to mock data for demo
        activities = MOCK_ACTIVITIES;
      }

      const container = document.getElementById('dashboard-activity-feed');
      if (!container) return;

      if (activities.length === 0) {
        container.innerHTML = `
          <div class="activity-empty">
            <div class="empty-icon">${icons.iconDoc}</div>
            <p>Chưa có hoạt động</p>
          </div>
        `;
        return;
      }

      container.innerHTML = activities.map(a => `
        <div class="activity-item">
          <div class="activity-dot ${a.dotColor}"></div>
          <div class="activity-item-header">
            <span class="activity-user">${a.username}</span>
            <span class="activity-time">${a.time}</span>
          </div>
          <div class="activity-desc">${a.action}</div>
          <div class="activity-meta">
            <span aria-hidden="true">${icons.iconMonitor}</span> ${a.device}
            <span>IP: ${a.ip}</span>
          </div>
        </div>
      `).join('');

    } catch (e) {
      console.error('Dashboard activity load failed:', e);
      // Show mock data on error
      const container = document.getElementById('dashboard-activity-feed');
      if (!container) return;

      container.innerHTML = MOCK_ACTIVITIES.map(a => `
        <div class="activity-item">
          <div class="activity-dot ${a.dotColor}"></div>
          <div class="activity-item-header">
            <span class="activity-user">${a.username}</span>
            <span class="activity-time">${a.time}</span>
          </div>
          <div class="activity-desc">${a.action}</div>
          <div class="activity-meta">
            <span aria-hidden="true">${icons.iconMonitor}</span> ${a.device}
            <span>IP: ${a.ip}</span>
          </div>
        </div>
      `).join('');
    }
  }
};
