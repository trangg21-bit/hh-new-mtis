/* ================================================================
   MTIS User List Screen (S-M01-02) — Enterprise + Unified Modal
   Filter bar: search (username/email/name), role, status, đơn vị
   ================================================================ */

const SCREEN_USERS = {
  _data: [], _page: 1, _total: 0,
  _filters: { search: '', role: '', status: '', org_id: '' },

  render() {
    return `
      <div class="content users-page">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Quản lý người dùng</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Danh sách người dùng</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <!-- Filter bar -->
          <div class="filter-bar" style="padding:16px 24px;display:flex;flex-wrap:wrap;gap:10px;align-items:end">
            <div class="filter-group" style="flex:2;min-width:200px">
              <label class="filter-label" style="display:block;font-size:11px;color:var(--color-muted);margin-bottom:4px">Tìm kiếm</label>
              <div class="search-field" style="display:flex;align-items:center;border:1px solid var(--color-border-input);border-radius:var(--radius-input);background:var(--color-white);padding:0 10px">
                <span style="color:var(--color-muted);font-size:14px">🔍</span>
                <input type="text" class="form-control" id="user-search" placeholder="Username, email, họ tên..." style="border:none;padding:8px 8px" oninput="SCREEN_USERS.debouncedSearch()">
              </div>
            </div>
            <div class="filter-group" style="flex:1;min-width:140px">
              <label class="filter-label" style="display:block;font-size:11px;color:var(--color-muted);margin-bottom:4px">Vai trò</label>
              <select class="form-control" id="user-role-filter" onchange="SCREEN_USERS.applyFilter()">
                <option value="">Tất cả vai trò</option>
                <option value="system-admin">Quản trị hệ thống</option>
                <option value="director">Lãnh đạo Cục</option>
                <option value="port-authority-leader">Lãnh đạo Cảng vụ</option>
                <option value="infrastructure-officer">Chuyên viên</option>
              </select>
            </div>
            <div class="filter-group" style="flex:1;min-width:120px">
              <label class="filter-label" style="display:block;font-size:11px;color:var(--color-muted);margin-bottom:4px">Trạng thái</label>
              <select class="form-control" id="user-status-filter" onchange="SCREEN_USERS.applyFilter()">
                <option value="">Tất cả</option>
                <option value="1">Hoạt động</option>
                <option value="2">Đã khóa</option>
                <option value="0">Đã xóa</option>
              </select>
            </div>
            <div class="filter-group" style="flex:1;min-width:140px">
              <label class="filter-label" style="display:block;font-size:11px;color:var(--color-muted);margin-bottom:4px">Đơn vị</label>
              <select class="form-control" id="user-org-filter" onchange="SCREEN_USERS.applyFilter()">
                <option value="">Tất cả đơn vị</option>
              </select>
            </div>
            <div class="filter-group" style="display:flex;gap:8px;align-items:end;flex-shrink:0">
              <button class="btn btn-ghost" onclick="SCREEN_USERS.clearFilters()" title="Xóa bộ lọc">✕ Xóa lọc</button>
              <button class="btn btn-ghost" onclick="SCREEN_USERS.exportExcel()" title="Xuất Excel">📥 Excel</button>
              <button class="btn btn-primary" onclick="SCREEN_USERS.showCreateModal()">＋ Thêm</button>
            </div>
          </div>

          <!-- Table -->
          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách người dùng">
              <thead>
                <tr>
                  <th style="width:50px">STT</th>
                  <th>Tên đăng nhập</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Đơn vị</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th class="text-right" style="width:140px">Thao tác</th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                <tr><td colspan="8" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="table-footer flex-between mt-4" style="padding:16px 24px">
            <span class="text-muted" id="users-info">Hiển thị 0 / 0 người dùng</span>
            <div class="pagination" id="users-pagination"></div>
          </div>
        </div>
      </div>
    `;
  },

  debouncedSearch() {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this._filters.search = document.getElementById('user-search').value;
      this._page = 1; this.load();
    }, 300);
  },

  applyFilter() {
    this._filters.role = document.getElementById('user-role-filter').value;
    this._filters.status = document.getElementById('user-status-filter').value;
    this._filters.org_id = document.getElementById('user-org-filter').value;
    this._page = 1; this.load();
  },

  clearFilters() {
    document.getElementById('user-search').value = '';
    document.getElementById('user-role-filter').value = '';
    document.getElementById('user-status-filter').value = '';
    document.getElementById('user-org-filter').value = '';
    this._filters = { search: '', role: '', status: '', org_id: '' };
    this._page = 1; this.load();
  },

  afterRender() {
    this._loadOrgs();
    this.load();
  },

  async _loadOrgs() {
    try {
      const data = await apiGet('/api/organizations');
      const orgs = data.organizations || [];
      const select = document.getElementById('user-org-filter');
      if (!select) return;
      // Build tree options
      const buildOptions = (items, depth) => {
        items.forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.id;
          opt.textContent = (depth > 0 ? '└─ '.repeat(depth) : '') + o.name;
          select.appendChild(opt);
          if (o.children && o.children.length) buildOptions(o.children, depth + 1);
        });
      };
      const map = {};
      const roots = [];
      orgs.forEach(o => { map[o.id] = { ...o, children: [] }; });
      orgs.forEach(o => {
        if (o.parent_id && map[o.parent_id]) map[o.parent_id].children.push(map[o.id]);
        else roots.push(map[o.id]);
      });
      buildOptions(roots, 0);
    } catch (e) { /* silent */ }
  },

  async load() {
    const tbody = document.getElementById('users-tbody');
    const info = document.getElementById('users-info');
    const pag = document.getElementById('users-pagination');
    if (!tbody) return;

    try {
      const params = {
        page: this._page, limit: 20,
        search: this._filters.search || undefined,
        role: this._filters.role || undefined,
        status: this._filters.status || undefined,
        org_id: this._filters.org_id || undefined,
      };
      const data = await apiGet('/api/users', params);
      this._data = data.users || [];
      this._total = data.total || 0;

      if (!this._data.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu</td></tr>';
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
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" onclick="SCREEN_USERS.showEditModal(${u.id})">✎</button>
              <button class="btn btn-ghost btn-sm" title="${u.status === 2 ? 'Mở khóa' : 'Khóa'}" onclick="SCREEN_USERS.toggleLock(${u.id}, ${u.status})" ${u.status === 0 ? 'disabled' : ''}>${u.status === 2 ? '🔓' : '🔒'}</button>
              <button class="btn btn-ghost btn-sm danger-action" title="Xóa" onclick="SCREEN_USERS.confirmDelete(${u.id})" ${u.status === 0 ? 'disabled' : ''}>🗑</button>
            </td>
          </tr>`).join('');
      }

      const totalPages = Math.ceil(this._total / 20);
      info.textContent = `Hiển thị ${this._data.length} / ${this._total} người dùng`;
      this._renderPagination(pag, totalPages);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
    }
  },

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    const page = this._page;
    let html = `<button class="page-btn" onclick="SCREEN_USERS.goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Trước</button>`;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${i})">${i}</button>`;
    } else {
      html += `<button class="page-btn ${page === 1 ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(1)">1</button>`;
      let start = Math.max(2, page - 1), end = Math.min(totalPages - 1, page + 1);
      if (start > 2) html += '<span class="page-ellipsis">…</span>';
      for (let i = start; i <= end; i++) html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${i})">${i}</button>`;
      if (end < totalPages - 1) html += '<span class="page-ellipsis">…</span>';
      html += `<button class="page-btn ${page === totalPages ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${totalPages})">${totalPages}</button>`;
    }
    html += `<button class="page-btn" onclick="SCREEN_USERS.goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Tiếp ›</button>`;
    container.innerHTML = html;
  },

  goToPage(page) { this._page = page; this.load(); },

  exportExcel() {
    if (!this._data.length) return alert('Không có dữ liệu');
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"></head><body><table border="1">';
    const rows = [['STT','Username','Họ tên','Email','Đơn vị','Vai trò','Trạng thái'],
      ...this._data.map((u,i) => [(this._page-1)*20+i+1,u.username,u.full_name,u.email||'',u.org_unit||'',u.role,{1:'Hoạt động',2:'Đã khóa',0:'Đã xóa'}[u.status]])];
    rows.forEach(r => { html += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'; });
    html += '</table></body></html>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mtis-users.xls'; a.click();
  },

  /* ============================================================
     MODAL FORMS (Unified approach for ALL screens)
     ============================================================ */
  showEditModal(id) {
    const user = this._data.find(u => u.id === id);
    if (!user) return;
    this._openUserModal(user, id);
  },

  _openUserModal(user, editId) {
    const isCreate = !user;
    const userId = isCreate ? '' : editId;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>${isCreate ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="user-form" onsubmit="return false">
            <div class="grid-2">
              <div class="form-group">
                <label>Tên đăng nhập <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="user-username" value="${esc(user?.username || '')}" placeholder="username" required>
              </div>
              <div class="form-group">
                <label>Mật khẩu ${isCreate ? '<span class="text-danger">*</span>' : '(để trống nếu không đổi)'}</label>
                <input type="password" class="form-control" id="user-password" placeholder="${isCreate ? 'Mật khẩu' : 'Để trống nếu không đổi'}">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Họ tên <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="user-fullname" value="${esc(user?.full_name || '')}" placeholder="Nguyễn Văn A" required>
              </div>
              <div class="form-group">
                <label>Email <span class="text-danger">*</span></label>
                <input type="email" class="form-control" id="user-email" value="${esc(user?.email || '')}" placeholder="email@example.com" required>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Vai trò</label>
                <select class="form-control" id="user-role">
                  <option value="system-admin" ${user?.role === 'system-admin' ? 'selected' : ''}>Quản trị hệ thống</option>
                  <option value="director" ${user?.role === 'director' ? 'selected' : ''}>Lãnh đạo Cục</option>
                  <option value="port-authority-leader" ${user?.role === 'port-authority-leader' ? 'selected' : ''}>Lãnh đạo Cảng vụ</option>
                  <option value="infrastructure-officer" ${user?.role === 'infrastructure-officer' ? 'selected' : ''}>Chuyên viên</option>
                </select>
              </div>
              <div class="form-group">
                <label>Trạng thái</label>
                <select class="form-control" id="user-status">
                  <option value="1" ${user?.status === 1 || !user ? 'selected' : ''}>Hoạt động</option>
                  <option value="2" ${user?.status === 2 ? 'selected' : ''}>Đã khóa</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid var(--color-border-light)">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="SCREEN_USERS.saveForm(${isCreate}, '${userId}')">${isCreate ? 'Lưu' : 'Cập nhật'}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
  },

  async saveForm(isCreate, userId) {
    const username = document.getElementById('user-username').value.trim();
    const fullname = document.getElementById('user-fullname').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const role = document.getElementById('user-role').value;
    const status = parseInt(document.getElementById('user-status').value);
    const password = document.getElementById('user-password').value;

    if (!username || !fullname || !email) return alert('⚠ Vui lòng điền đầy đủ thông tin!');

    try {
      if (isCreate) {
        if (!password) return alert('⚠ Vui lòng nhập mật khẩu!');
        await apiPost('/api/users', { username, full_name: fullname, email, password, role, status });
      } else {
        await apiPut(`/api/users/${userId}`, { username, full_name: fullname, email, role, status, password: password || undefined });
      }
      await this.load();
    } catch (e) {
      alert('❌ Lỗi: ' + e.message);
    }
  },

  async toggleLock(id, status) {
    const action = status === 2 ? 'Mở khóa' : 'Khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) return;
    try {
      await apiPut(`/api/users/${id}/${status === 2 ? 'unlock' : 'lock'}`);
      await this.load();
    } catch (e) { alert('❌ Lỗi: ' + e.message); }
  },

  async confirmDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await apiDelete(`/api/users/${id}`);
      await this.load();
    } catch (e) { alert('❌ Lỗi: ' + e.message); }
  }
};
