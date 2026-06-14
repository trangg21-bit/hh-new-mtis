/* ================================================================
   MTIS Groups Screen (S-M01-04) — Unified Modal CRUD
   ================================================================ */

const SCREEN_GROUPS = {
  _data: [],
  _membersOpen: false,

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
              <thead><tr><th>STT</th><th>Tên nhóm</th><th>Mô tả</th><th>Người dùng</th><th class="text-right">Thao tác</th></tr></thead>
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
              <button class="btn btn-ghost action-icon" title="Người dùng" onclick="SCREEN_GROUPS.showMembersModal(${g.id})"><span class="icon">${icons.iconUsers}</span></button>
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

  /* ============================================================
      MEMBERS MANAGEMENT — search + multi-select
      ============================================================ */
  async showMembersModal(groupId) {
    this._membersOpen = true;
    const group = this._data.find(g => g.id === groupId);
    const name = group ? group.name : '#' + groupId;

    // Load all users once
    let allUsers = [];
    let apiError = null;
    try { allUsers = (await apiGet('/api/users?limit=999')).users || []; } catch (e) { apiError = e.message; }

    // Get current members
    let currentMembers = [];
    try {
      const res = await apiGet(`/api/users/groups/${groupId}/members`);
      currentMembers = res.members || [];
    } catch (e) { /* members load failure is non-critical */ }

    if (apiError) {
      TOAST.warning('Không thể tải danh sách người dùng: ' + apiError);
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    // Build member rows (current members table)
    const memberRowsHtml = currentMembers.length ?
      currentMembers.map(m => `
        <tr>
          <td>${m.id}</td>
          <td><strong>${esc(m.username)}</strong><div class="cell-sub">ID: ${m.id}</div></td>
          <td>${esc(m.full_name || '—')}</td>
          <td>${esc(m.email || '—')}</td>
          <td><span class="badge badge-blue">${esc(m.role || '—')}</span></td>
          <td class="text-right action-cell">
            <button class="btn btn-ghost action-icon danger-action" title="Xóa" onclick="SCREEN_GROUPS._removeMember(${groupId}, ${m.id})"><span class="icon">${icons.iconDelete}</span></button>
          </td>
        </tr>`
      ).join('') :
      '<tr><td colspan="6" class="text-center text-muted">Chưa có người dùng nào</td></tr>';

    overlay.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>Thêm người dùng — nhóm ${esc(name)}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <!-- Search row: horizontal -->
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            <div style="flex:1;position:relative;border:1px solid var(--color-border-input);border-radius:var(--radius-btn);background:var(--color-white);display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:4px 10px;min-height:38px;cursor:text" id="search-container">
              <span style="font-size:14px;color:var(--color-muted-light);flex-shrink:0" aria-hidden="true">🔍</span>
              <div id="selected-users" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center"></div>
              <input type="text" id="member-autocomplete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Tìm kiếm họ tên, username, email..." style="flex:1;border:none;outline:none;padding:2px;font-size:14px;background:transparent;min-width:0;caret-color:transparent">
              <div id="member-suggestions" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-btn);box-shadow:0 8px 20px rgba(0,0,0,0.12);max-height:200px;overflow-y:auto;z-index:10;margin-top:4px" role="listbox" aria-label="Kết quả tìm kiếm"></div>
            </div>
            <button class="btn btn-primary" id="add-members-btn" disabled style="height:38px;padding:0 20px;font-size:14px" aria-label="Thêm người dùng đã chọn vào nhóm">Thêm vào nhóm</button>
          </div>
          <!-- Current members table -->
          <table class="ant-table" role="table">
            <thead><tr><th>ID</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
            <tbody id="members-tbody">${memberRowsHtml}</tbody>
          </table>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    // ── Reload members table without closing modal ──
    const self = this;
    const reloadMembersTable = async (gid) => {
      try {
        const res = await apiGet(`/api/users/groups/${gid}/members`);
        const updatedMembers = res.members || [];
        const tbody = document.getElementById('members-tbody');
        if (!tbody) return;
        if (updatedMembers.length) {
          tbody.innerHTML = updatedMembers.map(m => `
            <tr>
              <td>${m.id}</td>
              <td><strong>${esc(m.username)}</strong><div class="cell-sub">ID: ${m.id}</div></td>
              <td>${esc(m.full_name || '—')}</td>
              <td>${esc(m.email || '—')}</td>
              <td><span class="badge badge-blue">${esc(m.role || '—')}</span></td>
              <td class="text-right action-cell">
                <button class="btn btn-ghost action-icon danger-action" title="Xóa" onclick="SCREEN_GROUPS._removeMember(${gid}, ${m.id})"><span class="icon">${icons.iconDelete}</span></button>
              </td>
            </tr>`).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có người dùng nào</td></tr>';
        }
      } catch (e) {
        TOAST.error('Lỗi khi tải lại danh sách: ' + e.message);
      }
    };

    // Store reload function on SCREEN_GROUPS so _removeMember can call it from inline onclick
    SCREEN_GROUPS._membersReloadFn = reloadMembersTable;
    self._membersReloadFn = reloadMembersTable;

    // ── Multi-select logic ──
    const memberIds = new Set(currentMembers.map(m => m.id));
    const input = document.getElementById('member-autocomplete');
    const suggestions = document.getElementById('member-suggestions');
    const selectedContainer = document.getElementById('selected-users');
    const addBtn = document.getElementById('add-members-btn');
    const selectedUsers = new Set();
    let highlightedIndex = -1;

    // Remove a user from the selected set (called from inline onclick)
    this._removeFromSelection = (userId) => {
      selectedUsers.delete(userId);
      updateSelectedTags();
      input.focus();
    };

    const updateSelectedTags = () => {
      selectedContainer.innerHTML = [...selectedUsers].map(userId => {
        const u = allUsers.find(x => x.id === userId);
        if (!u) return '';
        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--color-info-bg);border:1px solid var(--color-info-text);border-radius:999px;font-size:13px;font-weight:500;color:var(--color-info-text)">
          ${esc(u.full_name)}
          <button aria-label="Bỏ chọn ${esc(u.full_name)}" style="background:none;border:none;color:var(--color-info-text);cursor:pointer;font-size:14px;padding:0 2px;font-weight:700;line-height:1" data-remove-id="${userId}">×</button>
        </span>`;
      }).join('');
      const count = selectedUsers.size;
      if (count > 0) {
        addBtn.removeAttribute('disabled');
      } else {
        addBtn.setAttribute('disabled', '');
      }
    };

    // Handle remove clicks via delegation
    selectedContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-id]');
      if (btn) {
        const userId = Number(btn.dataset.removeId);
        selectedUsers.delete(userId);
        updateSelectedTags();
        input.focus();
      }
    });

    const renderSuggestions = () => {
      const query = input.value.toLowerCase().trim();
      const filtered = allUsers.filter(u =>
        !memberIds.has(u.id) &&
        !selectedUsers.has(u.id) &&
        (!query ||
          u.full_name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.email || '').toLowerCase().includes(query)
        )
      ).slice(0, 10);

      if (!filtered.length) {
        suggestions.innerHTML = '<div style="padding:12px;font-size:13px;color:var(--color-muted);text-align:center">Không tìm thấy kết quả</div>';
        // Show empty state but keep dropdown visible so user knows search ran
        // Actually hide if no results and query exists, show if no query
        suggestions.style.display = query ? 'block' : 'none';
        highlightedIndex = -1;
        return;
      }

      suggestions.innerHTML = filtered.map((u, i) => `
        <div role="option" style="padding:8px 12px;cursor:pointer;font-size:13px;transition:background 0.15s;display:flex;align-items:center;justify-content:flex-start;${i === highlightedIndex ? 'background:var(--color-ghost-hover)' : ''}" class="suggestion-item" data-user-id="${u.id}" tabindex="-1">
          <div>
            <strong>${esc(u.full_name)}</strong>
            <div style="font-size:11px;color:var(--color-muted)">${esc(u.username)} — ${esc(u.email || '—')}</div>
          </div>
        </div>
      `).join('');
      suggestions.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');
    };

    const hideSuggestions = () => {
      suggestions.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      highlightedIndex = -1;
    };

    input.addEventListener('input', () => {
      highlightedIndex = -1;
      renderSuggestions();
    });

    // Handle click on suggestion row
    suggestions.addEventListener('click', (e) => {
      const row = e.target.closest('[data-user-id]');
      if (!row) return;
      const userId = Number(row.dataset.userId);
      selectedUsers.add(userId);
      input.value = '';
      hideSuggestions();
      updateSelectedTags();
      input.focus();
    });

    // Handle keyboard navigation
    input.addEventListener('keydown', (e) => {
      const items = suggestions.querySelectorAll('[data-user-id]');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length) {
          highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
          items.forEach((item, i) => item.tabIndex = i === highlightedIndex ? 0 : -1);
          if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length) {
          highlightedIndex = Math.max(highlightedIndex - 1, 0);
          items.forEach((item, i) => item.tabIndex = i === highlightedIndex ? 0 : -1);
          if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        const row = items[highlightedIndex];
        const userId = Number(row.dataset.userId);
        selectedUsers.add(userId);
        input.value = '';
        hideSuggestions();
        updateSelectedTags();
        input.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideSuggestions();
      }
    });

    // Handle button click — add all selected users
    addBtn.addEventListener('click', async () => {
      const userIds = [...selectedUsers];
      if (!userIds.length) return;

      addBtn.disabled = true;
      addBtn.innerHTML = '<span class="spinner"></span> Đang thêm...';

      let successCount = 0;
      let errors = [];

      try {
        for (const userId of userIds) {
          try {
            await apiPost(`/api/users/groups/${groupId}/members`, { user_id: userId });
            successCount++;
          } catch (err) {
            // Skip duplicate (409) silently, surface other errors
            if (err.status !== 409) {
              errors.push(err.message);
            }
          }
        }
        if (successCount > 0) {
          TOAST.success(`Đã thêm ${successCount} người dùng vào nhóm!`);
        }
        if (errors.length) {
          TOAST.warning(`Một số lỗi: ${errors.slice(0, 3).join('; ')}`);
        }
        // Reload members table (keep modal open)
        if (successCount > 0) {
          selectedUsers.clear();
          updateSelectedTags();
          await self._membersReloadFn(groupId);
          // Clear memberIds so added users won't show in search suggestions
          memberIds.clear();
          try {
            const freshRes = await apiGet(`/api/users/groups/${groupId}/members`);
            (freshRes.members || []).forEach(m => memberIds.add(m.id));
          } catch {}
        }
      } catch (err) {
        TOAST.error('Lỗi: ' + err.message);
      } finally {
        addBtn.disabled = !selectedUsers.size;
        addBtn.innerHTML = 'Thêm vào nhóm';
      }
    });

    // Close suggestions on click outside
    const closeOnOutside = (e) => {
      if (!e.target.closest('#member-autocomplete') && !e.target.closest('#member-suggestions')) {
        hideSuggestions();
      }
    };
    document.addEventListener('click', closeOnOutside, true);

    // Container click — only focus input, NOT when clicking button
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
      searchContainer.addEventListener('click', (e) => {
        if (e.target === searchContainer || e.target.closest('#selected-users') || e.target === input) {
          input.focus();
        }
      });
    }

    // Cleanup: remove outside listener when overlay removed
    const observer = new MutationObserver(() => {
      if (!document.body.contains(overlay)) {
        document.removeEventListener('click', closeOnOutside, true);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  async _removeMember(groupId, userId) {
    if (!confirm('Xóa người dùng khỏi nhóm?')) return;
    try {
      await apiDelete(`/api/users/groups/${groupId}/members/${userId}`);
      TOAST.success('Đã xóa người dùng khỏi nhóm!');
      // If modal is still open, reload members table inline
      if (SCREEN_GROUPS._membersOpen && SCREEN_GROUPS._membersReloadFn) {
        await SCREEN_GROUPS._membersReloadFn(groupId);
      } else {
        await this.load();
      }
    } catch (e) { TOAST.error('Lỗi: ' + e.message); }
  }
};
