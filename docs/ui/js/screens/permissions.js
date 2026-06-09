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
      <div class="content permissions-page">
        <div class="page-hero">
          <div>
            <div class="breadcrumb">
              <a href="#dashboard">M01</a> <span class="sep">/</span>
              <span>Phân quyền</span>
            </div>
            <h2 class="page-title">Phân quyền nhóm người dùng</h2>
            <p class="page-subtitle users-subtitle">Thiết lập quyền Create / Read / Update / Delete theo từng nhóm nghiệp vụ. Mọi thay đổi được ghi trực tiếp xuống permission matrix.</p>
          </div>
          <div class="page-actions">
            <div id="perms-feedback" style="display:none"></div>
            <button class="btn btn-ghost" onclick="SCREEN_PERMISSIONS.load()">↻ Tải lại</button>
            <button class="btn btn-primary" id="perms-save-btn" onclick="SCREEN_PERMISSIONS.save()">💾 Lưu thay đổi</button>
          </div>
        </div>

        <div class="ops-kpi-grid users-kpis">
          <div class="ops-kpi-card"><span class="kpi-label">Nhóm quyền</span><strong id="perms-kpi-groups">—</strong><small>Đối tượng được phân quyền</small></div>
          <div class="ops-kpi-card info"><span class="kpi-label">Tính năng</span><strong id="perms-kpi-features">—</strong><small>Phạm vi quyền trong M01</small></div>
          <div class="ops-kpi-card success"><span class="kpi-label">Quyền đã bật</span><strong id="perms-kpi-enabled">—</strong><small>Tổng checkbox đang active</small></div>
          <div class="ops-kpi-card danger"><span class="kpi-label">Quản trị</span><strong id="perms-kpi-admin">${isAdmin ? 'ON' : 'READ'}</strong><small>${isAdmin ? 'Có quyền lưu thay đổi' : 'Chỉ xem cấu hình'}</small></div>
        </div>

        <div id="perms-error" style="display:none"></div>

        <div class="ops-layout">
          <div class="card data-card">
            <div class="data-card-header">
              <div><h3>Ma trận quyền CRUD</h3><p>C/R/U/D tương ứng Tạo/Xem/Sửa/Xóa từng tính năng.</p></div>
              <span class="system-pill" id="perms-last-updated">Đang tải...</span>
            </div>
            <div class="enterprise-table-wrap">
              <table class="ant-table enterprise-table permission-matrix" role="table" aria-label="Ma trận phân quyền">
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
          <aside class="card ops-side-panel">
            <h3>Nguyên tắc an toàn</h3>
            <div class="ops-check-item ok"><span>✓</span><div><strong>Least privilege</strong><small>Chỉ bật đúng quyền cần thiết theo vai trò.</small></div></div>
            <div class="ops-check-item ok"><span>✓</span><div><strong>Admin guard</strong><small>Chỉ system-admin được lưu thay đổi.</small></div></div>
            <div class="ops-check-item warn"><span>!</span><div><strong>Kiểm tra sau khi lưu</strong><small>Đăng nhập bằng user thường để xác minh quyền thực tế.</small></div></div>
          </aside>
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

    if (this._featureCodes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Không có dữ liệu phân quyền</td></tr>';
      return;
    }

    tbody.innerHTML = this._featureCodes.map(fc => {
      const row = matrix.find(r => r.feature_code === fc) || {};
      const label = fc.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const cells = this._groups.map(g => {
        const perms = row[`g${g.id}`] || row[g.id] || {};
        const prefix = `perms_${fc}_${g.id}`;
        return `
          <td class="text-center permission-cell" ${disabledStyle}>
            <label class="perms-check ${perms.can_create ? 'is-on' : ''}" title="Tạo mới dữ liệu"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_create" ${perms.can_create ? 'checked' : ''} ${disabledAttr}> <span>Tạo</span></label>
            <label class="perms-check ${perms.can_read ? 'is-on' : ''}" title="Xem dữ liệu"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_read" ${perms.can_read ? 'checked' : ''} ${disabledAttr}> <span>Xem</span></label>
            <label class="perms-check ${perms.can_update ? 'is-on' : ''}" title="Sửa dữ liệu"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_update" ${perms.can_update ? 'checked' : ''} ${disabledAttr}> <span>Sửa</span></label>
            <label class="perms-check ${perms.can_delete ? 'is-on danger' : 'danger'}" title="Xóa dữ liệu"><input type="checkbox" onchange="this.closest('.perms-check').classList.toggle('is-on', this.checked)" data-group="${g.id}" data-feature="${fc}" data-action="can_delete" ${perms.can_delete ? 'checked' : ''} ${disabledAttr}> <span>Xóa</span></label>
          </td>`;
      }).join('');
      return `<tr><td><strong>${esc(label)}</strong></td>${cells}</tr>`;
    }).join('');
  },

  _updateStats() {
    const matrix = this._data?.matrix || [];
    let enabled = 0;
    matrix.forEach(row => {
      this._groups.forEach(g => {
        const p = row[g.id] || {};
        enabled += ['can_create','can_read','can_update','can_delete'].filter(k => !!p[k]).length;
      });
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('perms-kpi-groups', this._groups.length);
    set('perms-kpi-features', this._featureCodes.length);
    set('perms-kpi-enabled', enabled);
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
