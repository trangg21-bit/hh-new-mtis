/* ================================================================
   MTIS User Groups Screen (S-M01-04)
   ================================================================ */

const SCREEN_GROUPS = {
  _data: [],

  render() {
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">M01</a> <span class="sep">/</span>
          <span>Nhóm người dùng</span>
        </div>
        <div class="flex-between">
          <h2 class="page-title" style="margin-bottom:0">Nhóm người dùng</h2>
          <button class="btn btn-primary" onclick="SCREEN_GROUPS.showCreateModal()"><span class="btn-icon">➕</span> Thêm nhóm</button>
        </div>

        <div class="card mt-4">
          <div class="table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách nhóm">
              <thead><tr>
                <th>STT</th><th>Tên nhóm</th><th>Mô tả</th><th>Số thành viên</th><th>Thao tác</th>
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
            <td><strong>${esc(g.name)}</strong></td>
            <td>${esc(g.description || '—')}</td>
            <td><span class="badge badge-blue">${g.member_count || 0}</span></td>
            <td>
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa nhóm"
                      onclick="SCREEN_GROUPS.showEditModal(${g.id})">✎</button>
              <button class="btn btn-ghost btn-sm" title="Xóa" aria-label="Xóa nhóm"
                      onclick="SCREEN_GROUPS.confirmDelete(${g.id})">🗑</button>
              <button class="btn btn-ghost btn-sm" title="Xem thành viên" aria-label="Xem thành viên"
                      onclick="SCREEN_GROUPS.showMembersModal(${g.id})">👥</button>
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
              <input type="text" id="create-group-name" class="form-control" required maxlength="100"
                     placeholder="Nhập tên nhóm" autofocus />
            </div>
            <div class="form-group">
              <label for="create-group-desc">Mô tả</label>
              <textarea id="create-group-desc" class="form-control" rows="3" maxlength="500"
                        placeholder="Nhập mô tả (không bắt buộc)"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-default" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
              <button type="submit" class="btn btn-primary" id="btn-create-save">Lưu</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('form-create-group').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('create-group-name').value.trim();
      const description = document.getElementById('create-group-desc').value.trim();
      const btn = document.getElementById('btn-create-save');
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
      try {
        await apiPost('/api/users/groups', { name, description });
        overlay.remove();
        await this.load();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
      }
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
              <input type="text" id="edit-group-name" class="form-control" required maxlength="100"
                     value="${esc(group.name)}" autofocus />
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

    document.getElementById('form-edit-group').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-group-name').value.trim();
      const description = document.getElementById('edit-group-desc').value.trim();
      const btn = document.getElementById('btn-edit-save');
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
      try {
        await apiPut(`/api/users/groups/${groupId}`, { name, description });
        overlay.remove();
        await this.load();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
      }
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
              <select id="member-add-select" class="form-control">
                <option value="">— Chọn người dùng —</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btn-member-add" disabled>Thêm</button>
          </div>
          <div class="table-wrap">
            <table class="ant-table" role="table" aria-label="Danh sách thành viên">
              <thead><tr><th>STT</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
              <tbody id="members-tbody">
                <tr><td colspan="6" class="text-center text-muted">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const select = document.getElementById('member-add-select');
    const addBtn = document.getElementById('btn-member-add');

    // Enable add button when a user is selected
    select.addEventListener('change', () => {
      addBtn.disabled = !select.value;
    });

    // Load available users for the dropdown
    try {
      const usersRes = await apiGet('/api/users?limit=999');
      const allUsers = usersRes.users || usersRes.data || [];
      allUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${esc(u.username)} — ${esc(u.full_name || u.fullName || '')}`;
        select.appendChild(opt);
      });
    } catch (_) {
      // non-critical — dropdown stays empty, user can still see member list
    }

    // Load members
    const tbody = document.getElementById('members-tbody');
    const renderMembers = async () => {
      try {
        const res = await apiGet(`/api/users/groups/${groupId}/members`);
        const members = res.members || [];
        if (members.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nhóm chưa có thành viên</td></tr>';
        } else {
          tbody.innerHTML = members.map((m, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${esc(m.username)}</strong></td>
              <td>${esc(m.full_name || m.fullName || '—')}</td>
              <td>${esc(m.email || '—')}</td>
              <td>${esc(m.role || '—')}</td>
              <td>
                <button class="btn btn-ghost btn-sm" title="Xóa khỏi nhóm" aria-label="Xóa thành viên"
                        onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})">🗑</button>
              </td>
            </tr>
          `).join('');
        }
      } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${esc(e.message)}</td></tr>`;
      }
    };
    await renderMembers();

    // Add member handler
    addBtn.addEventListener('click', async () => {
      const userId = select.value;
      if (!userId) return;
      addBtn.disabled = true;
      addBtn.textContent = 'Đang thêm...';
      try {
        await apiPost(`/api/users/groups/${groupId}/members`, { user_id: Number(userId) });
        select.value = '';
        addBtn.disabled = true;
        await renderMembers();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      } finally {
        addBtn.textContent = 'Thêm';
      }
    });
  },

  async _removeMember(groupId, userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await apiDelete(`/api/users/groups/${groupId}/members/${userId}`);
      // Re-render member table — the modal is still open
      const tbody = document.getElementById('members-tbody');
      if (tbody) {
        const res = await apiGet(`/api/users/groups/${groupId}/members`);
        const members = res.members || [];
        if (members.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nhóm chưa có thành viên</td></tr>';
        } else {
          tbody.innerHTML = members.map((m, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${esc(m.username)}</strong></td>
              <td>${esc(m.full_name || m.fullName || '—')}</td>
              <td>${esc(m.email || '—')}</td>
              <td>${esc(m.role || '—')}</td>
              <td>
                <button class="btn btn-ghost btn-sm" title="Xóa khỏi nhóm" aria-label="Xóa thành viên"
                        onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})">🗑</button>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  },

  async confirmDelete(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;
    try {
      await apiDelete(`/api/users/groups/${id}`);
      await this.load();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  },
};
