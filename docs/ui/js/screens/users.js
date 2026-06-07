/* ================================================================
   MTIS User List Screen (S-M01-02) — placeholder with data fetch
   ================================================================ */

const SCREEN_USERS = {
  _data: [],
  _page: 1,
  _total: 0,
  _search: '',
  _statusFilter: '',

  render() {
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">M01</a> <span class="sep">/</span>
          <span>Người dùng</span>
        </div>
        <div class="flex-between">
          <h2 class="page-title" style="margin-bottom:0">Danh sách người dùng</h2>
          <a href="#register" class="btn btn-primary"><span class="btn-icon">➕</span> Thêm mới</a>
        </div>

        <div class="card mt-4">
          <div class="search-bar">
            <input type="text" class="form-control" id="user-search" placeholder="Tìm kiếm..."
                   oninput="SCREEN_USERS.debouncedSearch()" aria-label="Tìm kiếm người dùng">
            <select class="form-control" id="user-status-filter" onchange="SCREEN_USERS.applyFilter()" aria-label="Lọc trạng thái" style="width:160px">
              <option value="">Tất cả trạng thái</option>
              <option value="1">Hoạt động</option>
              <option value="2">Đã khóa</option>
              <option value="0">Đã xóa</option>
            </select>
          </div>
          <div id="users-table-container">
            <div class="table-wrap">
              <table class="ant-table" role="table" aria-label="Danh sách người dùng">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên đăng nhập</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Đơn vị</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody id="users-tbody">
                  <tr><td colspan="8" class="text-center text-muted">Đang tải...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="flex-between mt-4">
            <span class="text-muted" id="users-info">Đang tải...</span>
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
      timer = setTimeout(() => { SCREEN_USERS._search = document.getElementById('user-search').value; SCREEN_USERS._page = 1; SCREEN_USERS.load(); }, 300);
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
      const data = await apiGet('/api/users', {
        page: this._page, limit: 20,
        search: this._search || undefined,
        status: this._statusFilter || undefined,
      });
      this._data = data.users || [];
      this._total = data.total || 0;

      if (this._data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu</td></tr>';
      } else {
        tbody.innerHTML = this._data.map((u, i) => `
          <tr>
            <td>${(this._page - 1) * 20 + i + 1}</td>
            <td><strong>${esc(u.username)}</strong></td>
            <td>${esc(u.full_name)}</td>
            <td>${esc(u.email || '—')}</td>
            <td>${esc(u.org_unit || '—')}</td>
            <td><span class="badge badge-blue">${esc(u.role)}</span></td>
            <td>${statusBadge(u.status)}</td>
            <td>
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa">✎</button>
              <button class="btn btn-ghost btn-sm" title="${u.status === 2 ? 'Mở khóa' : u.status === 0 ? '' : 'Khóa'}"
                      aria-label="${u.status === 2 ? 'Mở khóa' : 'Khóa'}"
                      onclick="SCREEN_USERS.toggleLock(${u.id}, ${u.status})"
                      ${u.status === 0 ? 'disabled' : ''}>${u.status === 2 ? '🔓' : '🔒'}</button>
              <button class="btn btn-ghost btn-sm" title="Xóa" aria-label="Xóa người dùng"
                      onclick="SCREEN_USERS.confirmDelete(${u.id})" ${u.status === 0 ? 'disabled' : ''}>🗑</button>
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

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === this._page ? 'active' : ''}" onclick="SCREEN_USERS.goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
  },

  goToPage(page) {
    this._page = page;
    this.load();
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
