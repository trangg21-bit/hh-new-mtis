/* ================================================================
   MTIS User List Screen (S-M01-02) — enterprise operations view
   ================================================================ */

const SCREEN_USERS = {
  _data: [],
  _page: 1,
  _total: 0,
  _search: '',
  _statusFilter: '',

  render() {
    return `
      <div class="content users-page">
        <div class="page-hero">
          <div>
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Quản lý người dùng</span>
            </div>
            <h2 class="page-title">Danh sách người dùng</h2>
            <p class="page-subtitle">Quản lý tài khoản, trạng thái truy cập, phân vai trò và kiểm soát phiên làm việc trên toàn hệ thống.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost" onclick="SCREEN_USERS.load()">↻ Làm mới</button>
            <a href="#register" class="btn btn-primary"><span class="btn-icon">＋</span> Thêm người dùng</a>
          </div>
        </div>

        <div class="card data-card">
          <div class="data-card-header">
            <div>
              <h3>Danh sách tài khoản</h3>
              <p>Theo dõi trạng thái và thao tác quản trị người dùng.</p>
            </div>
            <span class="system-pill" id="users-last-updated">Đang tải...</span>
          </div>
            <h2 class="page-title">Danh sách người dùng</h2>
            <p class="page-subtitle">Quản lý tài khoản, trạng thái truy cập, phân vai trò và kiểm soát phiên làm việc trên toàn hệ thống.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost" onclick="SCREEN_USERS.load()">↻ Làm mới</button>
            <a href="#register" class="btn btn-primary"><span class="btn-icon">＋</span> Thêm người dùng</a>
          </div>
        </div>

        <div class="card data-card">
          <div class="data-card-header">
            <div>
              <h3>Danh sách tài khoản</h3>
              <p>Theo dõi trạng thái và thao tác quản trị người dùng.</p>
            </div>
            <span class="system-pill" id="users-last-updated">Đang tải...</span>
          </div>

          <div class="admin-toolbar">
            <div class="toolbar-left">
              <div class="search-field">
                <span>⌕</span>
                <input type="text" class="form-control" id="user-search" placeholder="Tìm username, họ tên..."
                       oninput="SCREEN_USERS.debouncedSearch()" aria-label="Tìm kiếm người dùng">
              </div>
              <select class="form-control" id="user-status-filter" onchange="SCREEN_USERS.applyFilter()" aria-label="Lọc trạng thái">
                <option value="">Tất cả trạng thái</option>
                <option value="1">Hoạt động</option>
                <option value="2">Đã khóa</option>
                <option value="0">Đã xóa</option>
              </select>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-ghost" onclick="SCREEN_USERS.exportCsv()">⇩ Xuất CSV</button>
            </div>
          </div>

          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách người dùng">
              <thead>
                <tr>
                  <th style="width:60px">STT</th>
                  <th>Tên đăng nhập</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Đơn vị</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th class="text-right" style="width:220px">Thao tác</th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                <tr><td colspan="8" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer flex-between mt-4">
            <span class="text-muted" id="users-info">Hiển thị ${this._data.length} / ${this._total} người dùng</span>
            <div class="pagination" id="users-pagination"></div>
          </div>
        </div>
      </div>
    `;
  },

  debouncedSearch: (function() {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        SCREEN_USERS._search = document.getElementById('user-search').value;
        SCREEN_USERS._page = 1;
        SCREEN_USERS.load();
      }, 300);
    };
  })(),

  applyFilter() {
    this._statusFilter = document.getElementById('user-status-filter').value;
    this._page = 1;
    this.load();
  },

  async afterRender() {
    await this.load();
  },

  async load() {
    const tbody = document.getElementById('users-tbody');
    const info = document.getElementById('users-info');
    const pag = document.getElementById('users-pagination');
    if (!tbody) return;

    try {
      const [data, stats] = await Promise.all([
        apiGet('/api/users', {
          page: this._page, limit: 20,
          search: this._search || undefined,
          status: this._statusFilter || undefined,
        }),
        apiGet('/api/admin/stats').catch(() => null),
      ]);
      this._data = data.users || [];
      this._total = data.total || 0;
      this._updateStats(stats);

      if (this._data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted empty-row">Không có dữ liệu phù hợp bộ lọc</td></tr>';
      } else {
        tbody.innerHTML = this._data.map((u, i) => `
          <tr>
            <td>${(this._page - 1) * 20 + i + 1}</td>
            <td><strong>${esc(u.username)}</strong><div class="cell-sub">ID: ${u.id}</div></td>
            <td>${esc(u.full_name)}</td>
            <td>${esc(u.email || '—')}</td>
            <td>${esc(u.org_unit || '—')}</td>
            <td><span class="badge badge-blue">${esc(u.role)}</span></td>
            <td>${statusBadge(u.status)}</td>
            <td class="text-right action-cell">
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa">✎ Sửa</button>
              <button class="btn btn-ghost btn-sm" title="${u.status === 2 ? 'Mở khóa' : u.status === 0 ? '' : 'Khóa'}"
                      aria-label="${u.status === 2 ? 'Mở khóa' : 'Khóa'}"
                      onclick="SCREEN_USERS.toggleLock(${u.id}, ${u.status})"
                      ${u.status === 0 ? 'disabled' : ''}>${u.status === 2 ? '🔓 Mở' : '🔒 Khóa'}</button>
              <button class="btn btn-ghost btn-sm danger-action" title="Xóa" aria-label="Xóa người dùng"
                      onclick="SCREEN_USERS.confirmDelete(${u.id})" ${u.status === 0 ? 'disabled' : ''}>🗑 Xóa</button>
            </td>
          </tr>
        `).join('');
      }

      const totalPages = Math.ceil(this._total / 20);
      info.textContent = `Hiển thị ${this._data.length} / ${this._total} người dùng`;
      document.getElementById('users-last-updated').textContent = `Cập nhật ${new Date().toLocaleTimeString('vi-VN')}`;
      this._renderPagination(pag, totalPages);

    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      info.textContent = 'Lỗi tải dữ liệu';
    }
  },

  _updateStats(stats) {
    const activeVisible = this._data.filter(u => u.status === 1).length;
    const lockedVisible = this._data.filter(u => u.status === 2).length;
    const totpVisible = this._data.filter(u => u.totp_enabled).length;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('users-kpi-total', stats?.total_users ?? this._total);
    set('users-kpi-active', stats ? Math.max(0, stats.total_users - stats.locked_accounts) : activeVisible);
    set('users-kpi-locked', stats?.locked_accounts ?? lockedVisible);
    set('users-kpi-totp', stats?.totp_enabled ?? totpVisible);
  },

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    const page = this._page;
    let html = '';

    // Prev button
    html += `<button class="page-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} onclick="SCREEN_USERS.goToPage(${page - 1})">‹ Trước</button>`;

    // Smart page range
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    // Always show 1
    html += `<button class="page-btn ${page === 1 ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(1)">1</button>`;

    if (startPage > 2) {
      html += `<span class="page-ellipsis">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages - 1) {
      html += `<span class="page-ellipsis">…</span>`;
    }

    // Always show last page (if different from above)
    if (totalPages > 1 && endPage < totalPages) {
      html += `<button class="page-btn ${page === totalPages ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="page-btn ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} onclick="SCREEN_USERS.goToPage(${page + 1})">Tiếp ›</button>`;

    container.innerHTML = html;
  },

  goToPage(page) {
    this._page = page;
    this.load();
  },

  exportCsv() {
    const rows = [['username','full_name','email','org_unit','role','status'], ...this._data.map(u => [u.username, u.full_name, u.email || '', u.org_unit || '', u.role, u.status])];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mtis-users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  async toggleLock(id, currentStatus) {
    const newStatus = currentStatus === 2 ? 1 : 2;
    const action = newStatus === 2 ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) return;
    try {
      await apiPut(`/api/users/${id}`, { status: newStatus });
      await this.load();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  },

  async confirmDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await apiDelete(`/api/users/${id}`);
      await this.load();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  },
};
