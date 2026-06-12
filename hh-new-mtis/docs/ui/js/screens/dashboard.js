/* ================================================================
   MTIS System Dashboard — Home page cho toàn bộ hệ thống M01-M11
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

const SCREEN_DASHBOARD = {
  _stats: null,

  render() {
    const user = AUTH.getUser();
    const systemStats = this._stats || { total_users: '—', active_sessions: '—', locked_accounts: '—' };

    // Module status colors
    const statusColor = { active: 'var(--color-success)', planned: 'var(--color-muted-light)' };
    const statusLabel = { active: 'Đang hoạt động', planned: 'Chưa triển khai' };

    const moduleCards = SYSTEM_MODULES.map(m => `
      <div class="module-card ${m.status === 'active' ? 'active' : ''}">
        <div class="module-icon">${m.icon}</div>
        <div class="module-info">
          <div class="module-name">${m.name_vn} <small class="module-id">${m.id}</small></div>
          <div class="module-desc">${m.desc}</div>
          <div class="module-meta">
            <span class="module-features">${m.features} tính năng</span>
            <span class="module-status" style="color:${statusColor[m.status]}">${statusLabel[m.status]}</span>
          </div>
        </div>
        ${m.status === 'active' ? `<a href="${m.hash}" class="module-link">Mở →</a>` : `<span class="module-coming">Sắp triển khai</span>`}
      </div>
    `).join('');

    return `
      <div class="content">
        <!-- Hero -->
        <div class="dashboard-hero">
          <div class="hero-left">
            <h1 class="hero-title">Hệ thống Quản lý KCHT Giao thông Hàng hải</h1>
            <p class="hero-subtitle">Cục Hàng hải Việt Nam</p>
            <p class="hero-welcome">Xin chào, <strong>${user ? esc(user.full_name || user.username) : '...'}</strong></p>
          </div>
          <div class="hero-right">
            <div class="quick-stats">
              <div class="quick-stat">
                <span class="quick-stat-value">${systemStats.total_users}</span>
                <span class="quick-stat-label">Người dùng</span>
              </div>
              <div class="quick-stat">
                <span class="quick-stat-value">${systemStats.active_sessions}</span>
                <span class="quick-stat-label">Phiên active</span>
              </div>
              <div class="quick-stat">
                <span class="quick-stat-value">${systemStats.locked_accounts}</span>
                <span class="quick-stat-label">Tài khoản khóa</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System modules overview -->
        <div class="dashboard-section">
          <h2 class="section-title">Tổng quan hệ thống</h2>
          <div class="module-grid">${moduleCards}</div>
        </div>

        <!-- Recent activity -->
        <div class="dashboard-section">
          <h2 class="section-title">Hoạt động gần đây</h2>
          <div class="card">
            <div class="card-body" id="dashboard-activity">
              <div class="empty-state"><p>Đang tải...</p></div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="dashboard-section">
          <h2 class="section-title">Thao tác nhanh</h2>
          <div class="quick-actions">
            <a href="#users" class="quick-action-btn"><span class="icon">${icons.iconUsers}</span> Người dùng</a>
            <a href="#groups" class="quick-action-btn"><span class="icon">${icons.iconUsers}</span> Nhóm</a>
            <a href="#permissions" class="quick-action-btn"><span class="icon">${icons.iconTOTP}</span> Phân quyền</a>
            <a href="#login-log" class="quick-action-btn"><span class="icon">${icons.iconDoc}</span> Nhật ký</a>
            <a href="#organizations" class="quick-action-btn"><span class="icon">${icons.iconOrg}</span> Đơn vị</a>
            <a href="#sessions" class="quick-action-btn"><span class="icon">${icons.iconMonitor}</span> Phiên</a>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStats();
    await this.loadActivity();
  },

  async loadStats() {
    try {
      const data = await apiGet('/api/admin/stats');
      this._stats = {
        total_users: data.total_users || '—',
        active_sessions: data.active_sessions || '—',
        locked_accounts: data.locked_accounts || '—'
      };
      // Update the quick stats values
      const qStats = document.querySelectorAll('.quick-stat-value');
      if (qStats[0]) qStats[0].textContent = this._stats.total_users;
      if (qStats[1]) qStats[1].textContent = this._stats.active_sessions;
      if (qStats[2]) qStats[2].textContent = this._stats.locked_accounts;
      setTimeout(() => this.loadActivity(), 0);
    } catch (e) {
      console.error('Dashboard stats load failed:', e);
      setTimeout(() => this.loadActivity(), 0);
    }
  },

  async loadActivity() {
    try {
      const data = await apiGet('/api/auth/login-log', { limit: 10, status: 'success' });
      const logs = data.logs || [];
      let html = '';
      if (logs.length === 0) {
        html = '<div class="empty-state"><p>Chưa có hoạt động</p></div>';
      } else {
        html = `<table class="ant-table">
          <thead><tr><th>Người dùng</th><th>Trạng thái</th><th>IP</th><th>Thiết bị</th><th>Thời gian</th></tr></thead><tbody>
          ${logs.map(l => `<tr><td>${esc(l.username)}</td><td><span class="badge badge-green">Thành công</span></td><td>${esc(l.ip || '—')}</td><td>${esc((l.device || '').slice(0, 40))}</td><td>${esc(l.logged_at)}</td></tr>`).join('')}
          </tbody></table>`;
      }
      const el = document.getElementById('dashboard-activity');
      if (el) el.innerHTML = html;
    } catch (e) {
      const el = document.getElementById('dashboard-activity');
      if (el) el.innerHTML = '<div class="empty-state"><p>Lỗi tải dữ liệu</p></div>';
    }
  },
};
