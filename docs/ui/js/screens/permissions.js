/* ================================================================
   MTIS Permission Matrix Screen (S-M01-05)
   ================================================================ */

const SCREEN_PERMISSIONS = {
  _data: null,
  _groups: [],
  _featureCodes: [],

  render() {
    const isAdmin = AUTH.getUser() && AUTH.getUser().role === 'system-admin';
    return `
      <div class="content permissions-page">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Phân quyền</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:16px;flex-wrap:wrap">
              <div style="min-width:0;flex:1 1 300px">
                <h1 class="page-title" style="margin-bottom:4px">Phân quyền nhóm người dùng</h1>
                <p class="page-subtitle" style="margin-bottom:0;font-size:var(--font-size-sm);color:var(--color-muted)">Thiết lập quyền Create / Read / Update / Delete theo từng nhóm nghiệp vụ. Mọi thay đổi được ghi trực tiếp xuống permission matrix.</p>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <div id="perms-feedback" style="display:none"></div>
                <button class="btn btn-ghost" onclick="SCREEN_PERMISSIONS.load()">↻ Tải lại</button>
                <button class="btn btn-primary" id="perms-save-btn" onclick="SCREEN_PERMISSIONS.save()" ${!isAdmin ? 'disabled' : ''}>💾 Lưu thay đổi</button>
              </div>
            </div>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div id="perms-error" style="display:none"></div>

          <div class="data-card-header" style="padding:16px 24px;flex-direction:row;align-items:center;justify-content:space-between">
            <div>
              <h3>Ma trận quyền CRUD</h3>
              <p>Quyền theo nhóm: mỗi hàng là một nhóm, các cột là các thao tác tạo/xem/sửa/xóa.</p>
            </div>
            <span class="system-pill" id="perms-last-updated">Đang tải...</span>
          </div>

          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Ma trận phân quyền">
              <thead>
                <tr id="perms-thead-tr">
                  <th style="min-width:200px">Nhóm</th>
                </tr>
              </thead>
              <tbody id="perms-tbody">
                <tr><td colspan="10" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() { this.load(); },

  async load() {
    const tbody = document.getElementById('perms-tbody');
    const theadTr = document.getElementById('perms-thead-tr');
    if (!tbody || !theadTr) return;
    try {
      const data = await apiGet('/api/permissions');
      this._data = data;
      this._groups = data.groups || [];
      this._featureCodes = data.feature_codes || [];

      // Build header: Group | Create | Read | Update | Delete
      theadTr.innerHTML = '<th style="min-width:200px">Nhóm</th>' +
        '<th class="text-center">Tạo</th><th class="text-center">Xem</th><th class="text-center">Sửa</th><th class="text-center">Xóa</th>';

      this.renderMatrix();
      this._updateStats();
      const stamp = document.getElementById('perms-last-updated');
      if (stamp) stamp.textContent = `Cập nhật ${new Date().toLocaleTimeString('vi-VN')}`;
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Lỗi tải dữ liệu: ${esc(e.message)}</td></tr>`;
    }
  },

  renderMatrix() {
    const tbody = document.getElementById('perms-tbody');
    if (!tbody) return;
    const matrix = this._data.matrix || [];
    const isAdmin = AUTH.getUser() && AUTH.getUser().role === 'system-admin';
    const disabledAttr = isAdmin ? '' : 'disabled';
    const disabledStyle = isAdmin ? '' : 'style="opacity:0.5"';

    if (this._groups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu phân quyền</td></tr>';
      return;
    }

    tbody.innerHTML = this._groups.map(g => {
      const row = matrix.find(r => r.group_id === g.id) || {};
      return `
        <tr>
          <td><strong>${esc(g.name)}</strong></td>
          <td class="text-center" ${disabledStyle}>
            <label class="perms-check ${row.can_create ? 'is-on' : ''}" title="Tạo mới"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-action="can_create" ${row.can_create ? 'checked' : ''} ${disabledAttr}><span>Tạo</span></label>
          </td>
          <td class="text-center" ${disabledStyle}>
            <label class="perms-check ${row.can_read ? 'is-on' : ''}" title="Xem"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-action="can_read" ${row.can_read ? 'checked' : ''} ${disabledAttr}><span>Xem</span></label>
          </td>
          <td class="text-center" ${disabledStyle}>
            <label class="perms-check ${row.can_update ? 'is-on' : ''}" title="Sửa"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-action="can_update" ${row.can_update ? 'checked' : ''} ${disabledAttr}><span>Sửa</span></label>
          </td>
          <td class="text-center" ${disabledStyle}>
            <label class="perms-check ${row.can_delete ? 'is-on danger' : 'danger'}" title="Xóa"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-action="can_delete" ${row.can_delete ? 'checked' : ''} ${disabledAttr}><span>Xóa</span></label>
          </td>
        </tr>
      `;
    }).join('');
  },

  _updateStats() {
    const matrix = this._data?.matrix || [];
    let enabled = 0;
    matrix.forEach(row => { enabled += ['can_create','can_read','can_update','can_delete'].filter(k => !!row[k]).length; });
  },

  showFeedback(msg, type) {
    const el = document.getElementById('perms-feedback');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger');
    el.textContent = msg;
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  },

  showError(msg) {
    const el = document.getElementById('perms-error');
    if (!el) return;
    el.style.display = 'block'; el.className = 'alert alert-danger'; el.innerHTML = msg;
  },

  clearError() {
    const el = document.getElementById('perms-error');
    if (!el) return;
    el.style.display = 'none'; el.innerHTML = '';
  },

  async save() {
    const btn = document.getElementById('perms-save-btn');
    if (btn) btn.disabled = true;
    this.clearError();

    const checkboxes = document.querySelectorAll('#perms-tbody input[type="checkbox"]');
    const permMap = {};
    checkboxes.forEach(cb => {
      const gid = cb.dataset.group;
      const action = cb.dataset.action;
      if (!permMap[gid]) permMap[gid] = { group_id: parseInt(gid, 10) };
      permMap[gid][action] = cb.checked;
    });

    const permissions = Object.values(permMap);
    try {
      await apiPut('/api/permissions', { permissions });
      this.showFeedback('Đã lưu thay đổi thành công', 'success');
    } catch (e) {
      this.showError('Lỗi khi lưu: ' + esc(e.message));
    } finally {
      if (btn) btn.disabled = false;
    }
  },
};
