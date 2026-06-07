/* ================================================================
   MTIS Permission Matrix Screen (S-M01-05)
   Feature: F-M01-005 — Permission Role Management
   ================================================================ */

const SCREEN_PERMISSIONS = {
  _data: null,
  _groups: [],
  _featureCodes: [],

  render() {
    const isAdmin = AUTH.getUser() && AUTH.getUser().role === 'system-admin';
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">M01</a> <span class="sep">/</span>
          <span>Phân quyền</span>
        </div>
        <div class="flex-between">
          <h2 class="page-title" style="margin-bottom:0">Phân quyền nhóm người dùng</h2>
          <div style="display:flex;gap:8px;align-items:center">
            <div id="perms-feedback" style="display:none"></div>
            <button class="btn btn-primary btn-sm" id="perms-save-btn" onclick="SCREEN_PERMISSIONS.save()">
              💾 Lưu thay đổi
            </button>
          </div>
        </div>

        <div id="perms-error" style="display:none"></div>

        <div class="card mt-4">
          <div class="table-wrap">
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

  afterRender() {
    this.load();
  },

  async load() {
    const tbody = document.getElementById('perms-tbody');
    const theadTr = document.getElementById('perms-thead-tr');
    if (!tbody || !theadTr) return;
    try {
      const data = await apiGet('/api/permissions');
      this._data = data;
      this._groups = data.groups || [];
      this._featureCodes = data.feature_codes || [];

      // Build header
      theadTr.innerHTML = '<th style="min-width:180px">Tính năng</th>' +
        this._groups.map(g => `<th class="text-center">${esc(g.name)}</th>`).join('');

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
        const perms = row[g.id] || {};
        const prefix = `perms_${fc}_${g.id}`;
        return `
          <td class="text-center" ${disabledStyle}>
            <label class="perms-check" title="Tạo"><input type="checkbox" data-group="${g.id}" data-feature="${fc}" data-action="can_create" ${perms.can_create ? 'checked' : ''} ${disabledAttr}> C</label>
            <label class="perms-check" title="Xem"><input type="checkbox" data-group="${g.id}" data-feature="${fc}" data-action="can_read" ${perms.can_read ? 'checked' : ''} ${disabledAttr}> R</label>
            <label class="perms-check" title="Sửa"><input type="checkbox" data-group="${g.id}" data-feature="${fc}" data-action="can_update" ${perms.can_update ? 'checked' : ''} ${disabledAttr}> U</label>
            <label class="perms-check" title="Xóa"><input type="checkbox" data-group="${g.id}" data-feature="${fc}" data-action="can_delete" ${perms.can_delete ? 'checked' : ''} ${disabledAttr}> D</label>
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
    el.style.display = 'block';
    el.className = 'alert alert-danger';
    el.innerHTML = msg;
  },

  clearError() {
    const el = document.getElementById('perms-error');
    if (!el) return;
    el.style.display = 'none';
    el.innerHTML = '';
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
