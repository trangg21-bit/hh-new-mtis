/* ================================================================
   MTIS Login Log Screen (S-M01-06)
   ================================================================ */

const SCREEN_LOGIN_LOG = {
  _data: [], _page: 1, _total: 0, _username: '', _fromDate: '', _toDate: '', _status: '',

  render() {
    return `
      <div class="content">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Nhật ký đăng nhập</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Nhật ký đăng nhập</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div class="admin-toolbar" style="padding:16px 24px">
            <div class="toolbar-left">
              <input type="text" class="form-control" id="log-username" placeholder="Người dùng..." value="${esc(this._username)}" style="width:160px">
              <input type="date" class="form-control" id="log-from-date" value="${this._fromDate}" style="width:160px">
              <input type="date" class="form-control" id="log-to-date" value="${this._toDate}" style="width:160px">
              <select class="form-control" id="log-status" style="width:150px">
                <option value="">Tất cả</option>
                <option value="success" ${this._status === 'success' ? 'selected' : ''}>Thành công</option>
                <option value="failed" ${this._status === 'failed' ? 'selected' : ''}>Thất bại</option>
              </select>
              <button class="btn btn-primary" onclick="SCREEN_LOGIN_LOG.applyFilter()">🔍 Lọc</button>
            </div>
          </div>

          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Nhật ký đăng nhập">
              <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Địa chỉ IP</th><th>Thiết bị</th><th>Trạng thái</th></tr></thead>
              <tbody id="log-tbody"><tr><td colspan="5" class="text-center text-muted">Đang tải...</td></tr></tbody>
            </table>
          </div>

          <div class="table-footer flex-between mt-4">
            <span class="text-muted" id="log-info">Đang tải...</span>
            <div class="pagination" id="log-pagination"></div>
          </div>
        </div>
      </div>
    `;
  },

  applyFilter() {
    this._username = document.getElementById('log-username').value;
    this._fromDate = document.getElementById('log-from-date').value;
    this._toDate = document.getElementById('log-to-date').value;
    this._status = document.getElementById('log-status').value;
    this._page = 1; this.load();
  },

  async afterRender() { await this.load(); },

  async load() {
    const tbody = document.getElementById('log-tbody');
    const info = document.getElementById('log-info');
    const pag = document.getElementById('log-pagination');
    if (!tbody) return;

    try {
      const data = await apiGet('/api/auth/login-log', {
        page: this._page, limit: 20,
        from_date: this._fromDate || undefined, to_date: this._toDate || undefined,
        username: this._username || undefined, status: this._status || undefined,
      });
      this._data = data.logs || [];
      this._total = data.total || 0;

      if (this._data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu</td></tr>'; }
      else {
        tbody.innerHTML = this._data.map(log => {
          let badgeClass = 'badge-green'; let label = 'Thành công';
          if (log.status === 'failed') { badgeClass = 'badge-red'; label = 'Thất bại'; }
          else if (log.status === 'totp_pending') { badgeClass = 'badge-yellow'; label = 'TOTP chờ'; }
          return `<tr><td>${esc(log.logged_at)}</td><td><strong>${esc(log.username)}</strong></td><td>${esc(log.ip)}</td><td>${esc(log.device || '—')}</td><td><span class="badge ${badgeClass}">${label}</span></td></tr>`;
        }).join('');
      }

      const totalPages = Math.ceil(this._total / 20);
      info.textContent = `Hiển thị ${this._data.length} / ${this._total} bản ghi`;
      this._renderPagination(pag, totalPages);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      info.textContent = 'Lỗi tải dữ liệu';
    }
  },

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    const page = this._page;
    let html = '';
    html += `<button class="page-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} onclick="SCREEN_LOGIN_LOG.goToPage(${page - 1})">‹ Trước</button>`;
    let startPage = Math.max(1, page - 2); let endPage = Math.min(totalPages, page + 2);
    html += `<button class="page-btn ${page === 1 ? 'active' : ''}" onclick="SCREEN_LOGIN_LOG.goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-ellipsis">…</span>`;
    for (let i = startPage; i <= endPage; i++) html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SCREEN_LOGIN_LOG.goToPage(${i})">${i}</button>`;
    if (endPage < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
    if (totalPages > 1 && endPage < totalPages) html += `<button class="page-btn ${page === totalPages ? 'active' : ''}" onclick="SCREEN_LOGIN_LOG.goToPage(${totalPages})">${totalPages}</button>`;
    html += `<button class="page-btn ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} onclick="SCREEN_LOGIN_LOG.goToPage(${page + 1})">Tiếp ›</button>`;
    container.innerHTML = html;
  },

  goToPage(page) { this._page = page; this.load(); }
};
