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
                <p class="page-subtitle" style="margin-bottom:0;font-size:var(--font-size-sm);color:var(--color-muted)">Thiết lập quyền Tạo / Xem / Sửa / Xóa theo từng nhóm nghiệp vụ và tính năng. Mọi thay đổi được ghi trực tiếp xuống permission matrix.</p>
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

          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Ma trận phân quyền">
              <thead>
                <tr id="perms-thead-tr">
                  <th style="min-width:180px">Tính năng</th>
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

      // Build header: Feature | Group1(T/X/S/X) | Group2(T/X/S/X) | ...
      theadTr.innerHTML = '<th style="min-width:180px">Tính năng</th>' +
        this._groups.map(g => `<th class="text-center" style="min-width:180px">${esc(g.name)}</th>`).join('');

      this.renderMatrix();
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

    if (this._featureCodes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Không có dữ liệu phân quyền</td></tr>';
      return;
    }

    tbody.innerHTML = this._featureCodes.map(fc => {
      const row = matrix.find(r => r.feature_code === fc) || {};
      const label = fc.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const cells = this._groups.map(g => {
        const perms = row[`g${g.id}`] || row[g.id] || {};
        return `
          <td class="text-center" ${disabledStyle}>
            <div class="perms-cell">
              <label class="perms-check ${perms.can_create ? 'is-on' : ''}" title="Tạo mới"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_create" ${perms.can_create ? 'checked' : ''} ${disabledAttr}><span>T</span></label>
              <label class="perms-check ${perms.can_read ? 'is-on' : ''}" title="Xem"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_read" ${perms.can_read ? 'checked' : ''} ${disabledAttr}><span>X</span></label>
              <label class="perms-check ${perms.can_update ? 'is-on' : ''}" title="Sửa"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_update" ${perms.can_update ? 'checked' : ''} ${disabledAttr}><span>S</span></label>
              <label class="perms-check ${perms.can_delete ? 'is-on danger' : 'danger'}" title="Xóa"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_delete" ${perms.can_delete ? 'checked' : ''} ${disabledAttr}><span>Xóa</span></label>
            </div>
          </td>`;
      }).join('');
      return `<tr><td><strong>${esc(label)}</strong></td>${cells}</tr>`;
    }).join('');
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
      const fc = cb.dataset.feature;
      const action = cb.dataset.action;
      const key = `${gid}_${fc}`;
      if (!permMap[key]) {
        permMap[key] = { group_id: parseInt(gid, 10), feature_code: fc };
      }
      permMap[key][action] = cb.checked;
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
