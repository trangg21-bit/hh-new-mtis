/* ================================================================
   MTIS User Groups Screen (S-M01-04)
   ================================================================ */

const SCREEN_GROUPS = {
  _data: [],

  render() {
    return `
      <div class="content groups-page">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Nhóm người dùng</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:16px;flex-wrap:wrap">
              <div style="min-width:0;flex:1 1 300px">
                <h1 class="page-title" style="margin-bottom:4px">Nhóm người dùng</h1>
                <p class="page-subtitle" style="margin-bottom:0;font-size:var(--font-size-sm);color:var(--color-muted)">Quản lý nhóm quyền nghiệp vụ, thành viên và phạm vi truy cập theo từng đơn vị vận hành.</p>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <button class="btn btn-ghost" onclick="SCREEN_GROUPS.load()">↻ Làm mới</button>
                <button class="btn btn-primary" onclick="SCREEN_GROUPS.showCreateModal()">＋ Thêm nhóm</button>
              </div>
            </div>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div class="enterprise-table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách nhóm">
              <thead><tr>
                <th>STT</th><th>Tên nhóm</th><th>Mô tả</th><th>Số thành viên</th><th class="text-right">Thao tác</th>
              </tr></thead>
              <tbody id="groups-tbody">
                <tr><td colspan="5" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.load();
  },

  async load() {
    const tbody = document.getElementById('groups-tbody');
    if (!tbody) return;
    try {
      const data = await apiGet('/api/users/groups');
      this._data = data.groups || [];
      if (this._data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có nhóm nào</td></tr>';
      } else {
        tbody.innerHTML = this._data.map((g, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${esc(g.name)}</strong><div class="cell-sub">ID: ${g.id}</div></td>
            <td>${esc(g.description || '—')}</td>
            <td><span class="badge badge-blue">${g.member_count || 0}</span></td>
            <td class="text-right action-cell">
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa nhóm" onclick="SCREEN_GROUPS.showEditModal(${g.id})">✎</button>
              <button class="btn btn-ghost btn-sm danger-action" title="Xóa" aria-label="Xóa nhóm" onclick="SCREEN_GROUPS.confirmDelete(${g.id})">🗑</button>
              <button class="btn btn-ghost btn-sm" title="Xem thành viên" aria-label="Xem thành viên" onclick="SCREEN_GROUPS.showMembersModal(${g.id})">👥</button>
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
    }
  },

  /* ---------- Create ---------- */
  showCreateModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = function (e) { if (e.target === this) this.remove(); };
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>Thêm nhóm mới</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="form-create-group" onsubmit="return false">
            <div class="form-group">
              <label for="create-group-name">Tên nhóm <span class="text-danger">*</span></label>
              <input type="text" id="create-group-name" class="form-control" required maxlength="100" placeholder="Nhập tên nhóm" autofocus />
            </div>
            <div class="form-group">
              <label for="create-group-desc">Mô tả</label>
              <textarea id="create-group-desc" class="form-control" rows="3" maxlength="500" placeholder="Nhập mô tả (không bắt buộc)"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-default" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
              <button type="submit" class="btn btn-primary" id="btn-create-save">Lưu</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    document.getElementById('form-create-group').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('create-group-name').value.trim();
      const description = document.getElementById('create-group-desc').value.trim();
      const btn = document.getElementById('btn-create-save');
      btn.disabled = true; btn.textContent = 'Đang lưu...';
      try {
        await apiPost('/api/users/groups', { name, description });
        overlay.remove(); await this.load();
      } catch (err) { alert('Lỗi: ' + err.message); }
      finally { btn.disabled = false; btn.textContent = 'Lưu'; }
    });
  },

  /* ---------- Edit ---------- */
  async showEditModal(groupId) {
    const group = this._data.find(g => g.id === groupId);
    if (!group) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = function (e) { if (e.target === this) this.remove(); };
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>Chỉnh sửa nhóm</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="form-edit-group" onsubmit="return false">
            <div class="form-group">
              <label for="edit-group-name">Tên nhóm <span class="text-danger">*</span></label>
              <input type="text" id="edit-group-name" class="form-control" required maxlength="100" value="${esc(group.name)}" autofocus />
            </div>
            <div class="form-group">
              <label for="edit-group-desc">Mô tả</label>
              <textarea id="edit-group-desc" class="form-control" rows="3" maxlength="500">${esc(group.description || '')}</textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-default" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
              <button type="submit" class="btn btn-primary" id="btn-edit-save">Lưu</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    document.getElementById('form-edit-group').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-group-name').value.trim();
      const description = document.getElementById('edit-group-desc').value.trim();
      const btn = document.getElementById('btn-edit-save');
      btn.disabled = true; btn.textContent = 'Đang lưu...';
      try {
        await apiPut(`/api/users/groups/${groupId}`, { name, description });
        overlay.remove(); await this.load();
      } catch (err) { alert('Lỗi: ' + err.message); }
      finally { btn.disabled = false; btn.textContent = 'Lưu'; }
    });
  },

  /* ---------- Members ---------- */
  async showMembersModal(groupId) {
    const group = this._data.find(g => g.id === groupId);
    const groupName = group ? esc(group.name) : '#' + groupId;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-overlay--wide';
    overlay.onclick = function (e) { if (e.target === this) this.remove(); };
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>Thành viên — ${groupName}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-inline mb-3" style="display:flex;gap:8px;align-items:end">
            <div class="form-group" style="flex:1">
              <label for="member-add-select">Thêm thành viên</label>
              <select id="member-add-select" class="form-control"><option value="">— Chọn người dùng —</option></select>
            </div>
            <button class="btn btn-primary" id="btn-member-add" disabled>Thêm</button>
          </div>
          <div class="table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách thành viên">
              <thead><tr><th>STT</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
              <tbody id="members-tbody"><tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    const select = document.getElementById('member-add-select');
    const addBtn = document.getElementById('btn-member-add');
    select.addEventListener('change', () => { addBtn.disabled = !select.value; });

    try {
      const usersRes = await apiGet('/api/users?limit=999');
      const allUsers = usersRes.users || usersRes.data || [];
      allUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.textContent = `${esc(u.username)} — ${esc(u.full_name || u.fullName || '')}`;
        select.appendChild(opt);
      });
    } catch (_) {}

    const renderMembers = async () => {
      try {
        const res = await apiGet(`/api/users/groups/${groupId}/members`);
        const members = res.members || [];
        if (members.length === 0) {
          document.getElementById('members-tbody').innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nhóm chưa có thành viên</td></tr>';
        } else {
          document.getElementById('members-tbody').innerHTML = members.map((m, i) => `
            <tr>
              <td>${i + 1}</td><td><strong>${esc(m.username)}</strong></td>
              <td>${esc(m.full_name || m.fullName || '—')}</td><td>${esc(m.email || '—')}</td>
              <td>${esc(m.role || '—')}</td>
              <td><button class="btn btn-ghost btn-sm" title="Xóa khỏi nhóm" aria-label="Xóa thành viên" onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})">🗑</button></td>
            </tr>
          `).join('');
        }
      } catch (e) {
        document.getElementById('members-tbody').innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      }
    };
    await renderMembers();

    addBtn.addEventListener('click', async () => {
      const userId = select.value;
      if (!userId) return;
      addBtn.disabled = true; addBtn.textContent = 'Đang thêm...';
      try {
        await apiPost(`/api/users/groups/${groupId}/members`, { user_id: Number(userId) });
        select.value = ''; addBtn.disabled = true;
        await renderMembers();
      } catch (err) { alert('Lỗi: ' + err.message); }
      finally { addBtn.textContent = 'Thêm'; }
    });
  },

  async _removeMember(groupId, userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await apiDelete(`/api/users/groups/${groupId}/members/${userId}`);
      const res = await apiGet(`/api/users/groups/${groupId}/members`);
      const tbody = document.getElementById('members-tbody');
      const members = res.members || [];
      if (members.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nhóm chưa có thành viên</td></tr>'; }
      else {
        tbody.innerHTML = members.map((m, i) => `
          <tr>
            <td>${i + 1}</td><td><strong>${esc(m.username)}</strong></td>
            <td>${esc(m.full_name || m.fullName || '—')}</td><td>${esc(m.email || '—')}</td>
            <td>${esc(m.role || '—')}</td>
            <td><button class="btn btn-ghost btn-sm" title="Xóa khỏi nhóm" onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})">🗑</button></td>
          </tr>
        `).join('');
      }
    } catch (e) { alert('Lỗi: ' + e.message); }
  },

  async confirmDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;
    try { await apiDelete(`/api/users/groups/${id}`); await this.load(); }
    catch (e) { alert('Lỗi: ' + e.message); }
  },
};
