/* ================================================================
   MTIS Dashboard Screen (S-M01-01) — Placeholder with stats
   ================================================================ */

const SCREEN_DASHBOARD = {
  _users: [],

  render() {
    const user = AUTH.getUser();
    return `
      <div class="content">
        <div class="breadcrumb">
          <span>M01</span> <span class="sep">/</span>
          <span>Dashboard</span>
        </div>
        <h2 class="page-title">Dashboard — Quản lý người dùng</h2>
        <p class="page-subtitle">Xin chào, <strong>${user ? user.full_name || user.username : '...'}</strong></p>

        <div class="stats-row" id="dashboard-stats">
          <div class="stat-card"><div class="stat-label">Tổng người dùng</div><div class="stat-value" id="stat-total">—</div></div>
          <div class="stat-card"><div class="stat-label">Đang hoạt động</div><div class="stat-value" id="stat-active">—</div></div>
          <div class="stat-card"><div class="stat-label">Đã khóa</div><div class="stat-value" id="stat-locked">—</div></div>
          <div class="stat-card"><div class="stat-label">Đã xóa</div><div class="stat-value" id="stat-deleted">—</div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Người dùng gần đây</h3>
            <div class="actions">
              <a href="#users" class="btn btn-outline btn-sm">Xem tất cả</a>
            </div>
          </div>
          <div class="card-body" id="dashboard-recent-users">
            <div class="empty-state"><p>Đang tải...</p></div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStats();
  },

  async loadStats() {
    try {
      const data = await apiGet('/api/users', { limit: 200 });
      this._users = data.users || [];

      const total = this._users.length;
      const active = this._users.filter(u => u.status === 1).length;
      const locked = this._users.filter(u => u.status === 2).length;
      const deleted = this._users.filter(u => u.status === 0).length;

      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-active').textContent = active;
      document.getElementById('stat-locked').textContent = locked;
      document.getElementById('stat-deleted').textContent = deleted;

      // Recent users table
      const recent = this._users.slice(0, 5);
      let html = '';
      if (recent.length === 0) {
        html = '<div class="empty-state"><p>Không có dữ liệu</p></div>';
      } else {
        html = `<table class="ant-table">
          <thead><tr>
            <th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th>
          </tr></thead><tbody>
          ${recent.map(u => `<tr>
            <td>${esc(u.username)}</td>
            <td>${esc(u.full_name)}</td>
            <td>${esc(u.email || '—')}</td>
            <td><span class="badge badge-blue">${esc(u.role)}</span></td>
            <td>${statusBadge(u.status)}</td>
          </tr>`).join('')}
          </tbody></table>`;
      }
      document.getElementById('dashboard-recent-users').innerHTML = html;
    } catch (e) {
      document.getElementById('dashboard-recent-users').innerHTML =
        '<div class="empty-state"><p>Lỗi tải dữ liệu: ' + esc(e.message) + '</p></div>';
      ['stat-total', 'stat-active', 'stat-locked', 'stat-deleted'].forEach(id => {
        document.getElementById(id).textContent = '0';
      });
    }
  },
};
