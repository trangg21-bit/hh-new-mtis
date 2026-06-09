/* ================================================================
   MTIS User List Screen (S-M01-02) — enterprise operations view (v2)
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
        <div class="card data-card">
          <!-- Page Header - inside card -->
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Quản lý người dùng</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:16px;flex-wrap:wrap">
              <div style="min-width:0;flex:1 1 300px">
                <h1 class="page-title" style="margin-bottom:4px">Danh sách người dùng</h1>
                <p class="page-subtitle" style="margin-bottom:0;font-size:var(--font-size-sm);color:var(--color-muted)">Quản lý tài khoản, trạng thái truy cập, phân vai trò và kiểm soát phiên làm việc trên toàn hệ thống.</p>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <button class="btn btn-ghost" onclick="SCREEN_USERS.load()" title="Tải lại dữ liệu">↻ Làm mới</button>
                <a href="#register" class="btn btn-primary" title="Thêm người dùng mới">＋ Thêm người dùng</a>
              </div>
            </div>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <!-- Toolbar -->
          <div class="admin-toolbar">
            <div class="toolbar-left">
              <div class="search-field">
                <span>🔍</span>
                <input type="text" class="form-control" id="user-search" placeholder="Tìm username, họ tên..." oninput="SCREEN_USERS.debouncedSearch()" title="Tìm kiếm trong danh sách">
              </div>
              <select class="form-control" id="user-status-filter" onchange="SCREEN_USERS.applyFilter()" title="Lọc theo trạng thái">
                <option value="">Tất cả trạng thái</option>
                <option value="1">Hoạt động</option>
                <option value="2">Đã khóa</option>
                <option value="0">Đã xóa</option>
              </select>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-ghost btn-sm" onclick="SCREEN_USERS.exportExcel()" title="Xuất danh sách ra file">📥</button>
            </div>
          </div>

          <!-- Table -->
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
                  <th class="text-right" style="width:150px">Thao tác</th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                <tr><td colspan="8" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="table-footer flex-between mt-4">
            <span class="text-muted" id="users-info">Hiển thị 0 / 0 người dùng</span>
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
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa">✎</button>
              <button class="btn btn-ghost btn-sm" title="${u.status === 2 ? 'Mở khóa' : 'Khóa tài khoản'}" aria-label="${u.status === 2 ? 'Mở khóa' : 'Khóa'}" onclick="SCREEN_USERS.toggleLock(${u.id}, ${u.status})" ${u.status === 0 ? 'disabled' : ''}>${u.status === 2 ? '🔓' : '🔒'}</button>
              <button class="btn btn-ghost btn-sm danger-action" title="Xóa người dùng" aria-label="Xóa người dùng" onclick="SCREEN_USERS.confirmDelete(${u.id})" ${u.status === 0 ? 'disabled' : ''}>🗑</button>
            </td>
          </tr>
        `).join('');
      }

      const totalPages = Math.ceil(this._total / 20);
      info.textContent = `Hiển thị ${this._data.length} / ${this._total} người dùng`;
      
      this._renderPagination(pag, totalPages);

    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      info.textContent = 'Lỗi tải dữ liệu';
    }
  },

  _updateStats(stats) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    // We removed KPI cards, so this is now just for internal stats if needed
  },

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    const page = this._page;
    let html = '';

    html += `<button class="page-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} onclick="SCREEN_USERS.goToPage(${page - 1})">‹ Trước</button>`;

    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    html += `<button class="page-btn ${page === 1 ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(1)">1</button>`;

    if (startPage > 2) html += `<span class="page-ellipsis">…</span>`;

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;

    if (totalPages > 1 && endPage < totalPages) {
      html += `<button class="page-btn ${page === totalPages ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="page-btn ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} onclick="SCREEN_USERS.goToPage(${page + 1})">Tiếp ›</button>`;

    container.innerHTML = html;
  },

  goToPage(page) {
    this._page = page;
    this.load();
  },

  exportExcel() {
    if (this._data.length === 0) return alert('Không có dữ liệu để xuất');

    const rows = [
      ['STT', 'Username', 'Họ tên', 'Email', 'Đơn vị', 'Vai trò', 'Trạng thái'],
      ...this._data.map((u, i) => [
        (this._page - 1) * 20 + i + 1,
        u.username,
        u.full_name,
        u.email || '',
        u.org_unit || '',
        u.role,
        {1: 'Hoạt động', 2: 'Đã khóa', 0: 'Đã xóa'}[u.status] || u.status
      ])
    ];

    // Create HTML table for Excel compatibility (.xls format)
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"><title>Excel Export</title></head><body>';
    html += '<table border="1">';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mtis-users.xls';
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
