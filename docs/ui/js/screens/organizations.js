/* ================================================================
   MTIS Organization Tree Screen (S-M01-07) — Unified Modal CRUD
   ================================================================ */

const SCREEN_ORGANIZATIONS = {
  _orgs: [],
  _currentEditId: null,

  render() {
    return `
      <div class="content organizations-page">
        <div class="card data-card">
          <!-- Header -->
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Đơn vị</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Cấu trúc tổ chức</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div class="admin-toolbar" style="padding:16px 24px;justify-content:space-between">
            <div><h3 style="margin:0;font-size:1rem">Cây cấu trúc đơn vị</h3></div>
            <button class="btn btn-primary" onclick="SCREEN_ORGANIZATIONS.showCreateModal()">＋ Thêm đơn vị</button>
          </div>

          <div id="org-tree-container" style="padding:24px;min-height:400px">
            <div class="text-center text-muted" style="padding:60px">Đang tải...</div>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() { this.load(); },

  async load() {
    const container = document.getElementById('org-tree-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted" style="padding:60px">Đang tải...</div>';

    try {
      const data = await apiGet('/api/organizations');
      this._orgs = data.organizations || [];
      this._renderTree(container);
    } catch (e) {
      container.innerHTML = `<div class="text-center text-danger" style="padding:60px">Lỗi: ${esc(e.message)}</div>`;
    }
  },

  _buildTree(items) {
    const map = {};
    const roots = [];
    items.forEach(item => { map[item.id] = { ...item, children: [] }; });
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    const sort = (nodes) => {
      nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || '').localeCompare(b.name || ''));
      nodes.forEach(n => sort(n.children));
    };
    sort(roots);
    return roots;
  },

  _renderTree(container) {
    const roots = this._buildTree(this._orgs);
    if (!roots.length) {
      container.innerHTML = '<div class="text-center text-muted" style="padding:60px">Chưa có đơn vị nào. Nhấn "Thêm đơn vị" để tạo.</div>';
      return;
    }
    container.innerHTML = '<ul class="org-tree" style="list-style:none;padding:0;margin:0">' + this._renderNodes(roots, 0) + '</ul>';
  },

  _renderNodes(nodes, depth) {
    return nodes.map(n => {
      const indent = depth * 28;
      return `
        <li style="padding-left:${indent}px;margin:4px 0">
          <div class="org-node" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;border:1px solid var(--color-border-light);background:#fff;transition:background 0.15s"
               onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">
            <span style="flex-shrink:0;color:var(--color-muted)">📁</span>
            <span style="flex:1;font-weight:500">${esc(n.name)}</span>
            ${n.description ? `<span style="font-size:var(--font-size-xs);color:var(--color-muted);margin-right:12px">${esc(n.description)}</span>` : ''}
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" onclick="SCREEN_ORGANIZATIONS.showEditModal(${n.id})">✎</button>
              <button class="btn btn-ghost btn-sm" title="Xóa" onclick="SCREEN_ORGANIZations.confirmDelete(${n.id})">🗑</button>
            </div>
          </div>
          ${n.children.length ? this._renderNodes(n.children, depth + 1) : ''}
        </li>`;
    }).join('');
  },

  /* ============================================================
     MODAL FORMS (Unified approach for ALL screens)
     ============================================================ */
  showCreateModal() {
    this._openFormModal(null);
  },

  showEditModal(id) {
    const org = this._orgs.find(o => o.id === id);
    if (!org) return;
    this._openFormModal(org);
  },

  _openFormModal(org) {
    const isCreate = !org;
    const orgsOptions = this._getOrgSelectOptions(org?.id);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>${isCreate ? 'Thêm đơn vị mới' : 'Chỉnh sửa đơn vị'}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="org-form" onsubmit="return false">
            <div class="form-group">
              <label>Tên đơn vị <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="org-name" value="${esc(org?.name || '')}" placeholder="Nhập tên đơn vị" required autofocus>
            </div>
            <div class="form-group">
              <label>Mô tả</label>
              <textarea class="form-control" id="org-desc" rows="2" placeholder="Mô tả (không bắt buộc)">${esc(org?.description || '')}</textarea>
            </div>
            <div class="form-group">
              <label>Đơn vị cha</label>
              <select class="form-control" id="org-parent">
                <option value="">— Không (đơn vị gốc) —</option>
                ${orgsOptions}
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid var(--color-border-light)">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="SCREEN_ORGANIZATIONS.saveForm(${isCreate}, ${org?.id || ''})">${isCreate ? 'Lưu' : 'Cập nhật'}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
  },

  _getOrgSelectOptions(excludeId) {
    const roots = this._buildTree(this._orgs);
    const render = (nodes, depth) => {
      return nodes.map(n => {
        if (n.id === excludeId) return '';
        const prefix = '—'.repeat(depth);
        let html = `<option value="${n.id}">${prefix} ${esc(n.name)}</option>`;
        if (n.children.length) html += render(n.children, depth + 1);
        return html;
      }).join('');
    };
    return render(roots, 0);
  },

  async saveForm(isCreate, editId) {
    const name = document.getElementById('org-name').value.trim();
    if (!name) return alert('⚠ Vui lòng nhập tên đơn vị!');

    const desc = document.getElementById('org-desc').value.trim() || undefined;
    const parentId = document.getElementById('org-parent').value || undefined;

    try {
      if (isCreate) {
        await apiPost('/api/organizations', { name, description: desc, parent_id: parentId });
      } else {
        await apiPut(`/api/organizations/${editId}`, { name, description: desc, parent_id: parentId });
      }
      await this.load();
    } catch (e) {
      alert('❌ Lỗi: ' + e.message);
    }
  },

  async confirmDelete(id) {
    const org = this._orgs.find(o => o.id === id);
    if (!org || !confirm(`Bạn có chắc chắn muốn xóa đơn vị "${org.name}"?`)) return;
    try {
      await apiDelete(`/api/organizations/${id}`);
      await this.load();
    } catch (e) {
      alert('❌ Lỗi: ' + e.message);
    }
  }
};
