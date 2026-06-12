/* ================================================================
   MTIS Active Sessions Management Screen (S-M01-14)
   ================================================================ */

const SCREEN_SESSIONS = {
  _data: [], _user: null,

  render() {
    const user = AUTH.getUser();
    this._user = user;
    return `
      <div class="content">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Phiên đăng nhập</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Quản lý phiên đăng nhập</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách phiên đăng nhập">
              <thead>
                <tr>
                  ${(user && user.role === 'system-admin') ? '<th>User ID</th>' : ''}
                  <th>Thiết bị</th><th>Địa chỉ IP</th><th>Ngày tạo</th><th>Hết hạn</th><th>Hoạt động gần nhất</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody id="sessions-tbody"><tr><td colspan="${(user && user.role === 'system-admin') ? '8' : '7'}" class="text-center text-muted">Đang tải...</td></tr></tbody>
            </table>
          </div>

          <div class="table-footer flex-between mt-4">
            <span class="text-muted" id="sessions-info">Đang tải...</span>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() { this.load(); },

  async load() {
    const tbody = document.getElementById('sessions-tbody');
    const info = document.getElementById('sessions-info');
    if (!tbody) return;

    try {
      const res = await apiGet('/api/auth/sessions');
      this._data = res.sessions || [];

      if (this._data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Không có phiên đăng nhập nào</td></tr>';
        if (info) info.textContent = 'Hiển thị 0 phiên đăng nhập';
        return;
      }

      const isAdmin = this._user && this._user.role === 'system-admin';
      tbody.innerHTML = this._data.map(s => {
        const badge = s.is_current ? '<span class="badge badge-green">Hiện tại</span>' : '<span class="badge badge-gray">Khác</span>';
        const canRevoke = !s.is_current;
        const revokeBtn = canRevoke
          ? `<button class="btn btn-ghost action-icon" title="Thu hồi phiên" aria-label="Thu hồi phiên" onclick="SCREEN_SESSIONS.revoke('${s.id}')"><span class="icon">${icons.iconDelete}</span></button>`
          : `<button class="btn btn-ghost action-icon" disabled title="Không thể thu hồi phiên hiện tại" aria-label="Không thể thu hồi phiên hiện tại"><span class="icon">${icons.iconDelete}</span></button>`;
        return `<tr>
          ${isAdmin ? `<td>${esc(s.user_id)}</td>` : ''}
          <td>${esc(s.device)}</td><td>${esc(s.ip)}</td><td>${esc(s.created_at)}</td><td>${esc(s.expires_at)}</td><td>${esc(s.last_active_at)}</td>
          <td>${badge}</td><td>${revokeBtn}</td>
        </tr>`;
      }).join('');

      if (info) info.textContent = `Hiển thị ${this._data.length} phiên đăng nhập`;
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      if (info) info.textContent = '';
    }
  },

  async revoke(id) {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập này?')) return;
    try {
      await apiDelete(`/api/auth/sessions/${id}`);
      TOAST.success('Đã thu hồi phiên đăng nhập!');
      await this.load();
    } catch (e) { TOAST.error('Lỗi: ' + e.message); }
  },
};
