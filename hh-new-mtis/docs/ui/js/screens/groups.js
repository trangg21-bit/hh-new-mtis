/* ================================================================
   MTIS Groups Screen (S-M01-04) — Unified Modal CRUD
   ================================================================ */

const SCREEN_GROUPS = {
  _data: [],

  render() {
    return `
      <div class="content groups-page">
        <div class="card data-card">
          <!-- Header -->
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Nhóm người dùng</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Nhóm người dùng</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <!-- Toolbar -->
          <div class="admin-toolbar" style="padding:16px 24px;justify-content:space-between">
            <div><h3 style="margin:0;font-size:1rem">Danh sách nhóm quyền</h3></div>
            <button class="btn btn-primary" onclick="SCREEN_GROUPS.showCreateModal()"><span class="icon">${icons.iconAdd}</span> Thêm nhóm</button>
          </div>

          <!-- Table -->
          <div class="table-wrap enterprise-table-wrap">
            <table class="ant-table" role="table">
              <thead><tr><th>STT</th><th>Tên nhóm</th><th>Mô tả</th><th>Thành viên</th><th class="text-right">Thao tác</th></tr></thead>
              <tbody id="groups-tbody"><tr><td colspan="5" class="text-center text-muted">Đang tải...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() { await this.load(); },

  async load() {
    const tbody = document.getElementById('groups-tbody');
    if (!tbody) return;
    try {
      const data = await apiGet('/api/users/groups');
      this._data = data.groups || [];
      if (!this._data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có nhóm nào</td></tr>';
      } else {
        tbody.innerHTML = this._data.map((g, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${esc(g.name)}</strong><div class="cell-sub">ID: ${g.id}</div></td>
            <td>${esc(g.description || '—')}</td>
            <td><span class="badge badge-blue">${g.member_count || 0}</span></td>
            <td class="text-right action-cell">
              <button class="btn btn-ghost action-icon" title="Chỉnh sửa" onclick="SCREEN_GROUPS.showEditModal(${g.id})"><span class="icon">${icons.iconEdit}</span></button>
              <button class="btn btn-ghost action-icon" title="Thành viên" onclick="SCREEN_GROUPS.showMembersModal(${g.id})"><span class="icon">${icons.iconUsers}</span></button>
              <button class="btn btn-ghost action-icon danger-action" title="Xóa" onclick="SCREEN_GROUPS.confirmDelete(${g.id})"><span class="icon">${icons.iconDelete}</span></button>
            </td>
          </tr>`).join('');
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
    }
  },

  /* ============================================================
     MODAL FORMS (Unified approach for ALL screens)
     ============================================================ */
  showCreateModal() { this._openFormModal(null); },
  showEditModal(id) { const g = this._data.find(x => x.id === id); if (g) this._openFormModal(g); },

  _openFormModal(group) {
    // Ensure no stale overlay exists
    const stale = document.querySelector('.modal-overlay');
    if (stale) stale.remove();
    const isCreate = !group;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>${isCreate ? 'Thêm nhóm mới' : 'Chỉnh sửa nhóm'}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="group-form" onsubmit="return false">
            <div class="form-group">
              <label>Tên nhóm <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="group-name" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${esc(group?.name || '')}" placeholder="Nhập tên nhóm" required autofocus>
            </div>
            <div class="form-group">
              <label>Mô tả</label>
              <textarea class="form-control" id="group-desc" rows="2" placeholder="Mô tả (không bắt buộc)">${esc(group?.description || '')}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid var(--color-border-light)">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="SCREEN_GROUPS.saveForm(${isCreate}, ${group?.id || ''})">${isCreate ? 'Lưu' : 'Cập nhật'}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
  },

  async saveForm(isCreate, editId) {
    const name = document.getElementById('group-name').value.trim();
    const desc = document.getElementById('group-desc').value.trim();
    if (!name) return TOAST.warning('Vui lòng nhập tên nhóm!');

    try {
      if (isCreate) {
        await apiPost('/api/users/groups', { name, description: desc });
      } else {
        await apiPut(`/api/users/groups/${editId}`, { name, description: desc });
      }
      // Close overlay
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.remove();
      // Reload + toast
      await this.load();
      TOAST.success(isCreate ? 'Tạo nhóm thành công!' : 'Cập nhật nhóm thành công!');
    } catch (e) { TOAST.error('Lỗi: ' + e.message); }
  },

  async confirmDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;
    try {
      await apiDelete(`/api/users/groups/${id}`);
      await this.load();
      TOAST.success('Xóa nhóm thành công!');
    } catch (e) { TOAST.error('Lỗi: ' + e.message); }
  },

  async showMembersModal(groupId) {
    const group = this._data.find(g => g.id === groupId);
    const name = group ? group.name : '#' + groupId;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>Thành viên — ${esc(name)}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;gap:8px;margin-bottom:16px;align-items:flex-end">
            <div style="flex:1">
              <label style="font-size:var(--font-size-xs);color:var(--color-muted);margin-bottom:4px;display:block">Thêm thành viên</label>
              <select class="form-control" id="member-select"><option value="">— Chọn —</option></select>
            </div>
            <button class="btn btn-primary" id="member-add-btn" disabled>Thêm</button>
          </div>
          <table class="ant-table" role="table">
            <thead><tr><th>STT</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
            <tbody id="members-tbody"><tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr></tbody>
          </table>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    // Load users for dropdown
    try {
      const users = (await apiGet('/api/users?limit=999')).users || [];
      const sel = document.getElementById('member-select');
      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.textContent = `${u.username} — ${u.full_name}`;
        sel.appendChild(opt);
      });
    } catch {}

    const render = async () => {
      try {
        const res = await apiGet(`/api/users/groups/${groupId}/members`);
        const members = res.members || [];
        const tbody = document.getElementById('members-tbody');
        if (!members.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có thành viên</td></tr>';
        } else {
          tbody.innerHTML = members.map((m, i) => `
            <tr>
              <td>${i + 1}</td><td><strong>${esc(m.username)}</strong></td>
              <td>${esc(m.full_name || '—')}</td><td>${esc(m.email || '—')}</td>
              <td>${esc(m.role || '—')}</td>
              <td><button class="btn btn-ghost action-icon" onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})"><span class="icon">${icons.iconDelete}</span></button></td>
            </tr>`).join('');
        }
      } catch (e) {
        document.getElementById('members-tbody').innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      }
    };
    await render();

    const sel = document.getElementById('member-select');
    sel.addEventListener('change', () => { document.getElementById('member-add-btn').disabled = !sel.value; });
    document.getElementById('member-add-btn').addEventListener('click', async () => {
      const userId = sel.value; if (!userId) return;
      try {
        await apiPost(`/api/users/groups/${groupId}/members`, { user_id: Number(userId) });
        sel.value = ''; document.getElementById('member-add-btn').disabled = true;
        await render();
      } catch (e) { TOAST.error('Lỗi: ' + e.message); }
    });
  },

  async _removeMember(groupId, userId) {
    if (!confirm('Xóa thành viên khỏi nhóm?')) return;
    try {
      await apiDelete(`/api/users/groups/${groupId}/members/${userId}`);
      await this.load();
      TOAST.success('Đã xóa thành viên khỏi nhóm!');
    } catch (e) { TOAST.error('Lỗi: ' + e.message); }
  }
};
