/* ================================================================
   MTIS Organization Tree Screen (S-M01-07)
   ================================================================ */

const SCREEN_ORGANIZATIONS = {
  _orgs: [],
  _loading: false,
  _error: null,
  _editId: null,

  render() {
    return `
      <div class="content organizations-page">
        <div class="card data-card">
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Đơn vị</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:16px;flex-wrap:wrap">
              <div style="min-width:0;flex:1 1 300px">
                <h1 class="page-title" style="margin-bottom:4px">Cấu trúc tổ chức</h1>
                <p class="page-subtitle" style="margin-bottom:0;font-size:var(--font-size-sm);color:var(--color-muted)">Quản lý cấu trúc Cục / Cảng vụ / đơn vị trực thuộc phục vụ phân quyền, báo cáo và phạm vi dữ liệu.</p>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <button class="btn btn-ghost" onclick="SCREEN_ORGANIZATIONS.load()">↻ Làm mới</button>
                <button class="btn btn-primary" id="org-add-btn" onclick="SCREEN_ORGANIZATIONS.showCreateForm()">＋ Thêm đơn vị</button>
              </div>
            </div>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <div id="org-tree-container" style="padding:24px;min-height:400px">
            <div class="text-center text-muted" style="padding:60px">Đang tải...</div>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() { this.load(); },

  async load() {
    this._loading = true; this._error = null; this._editId = null;
    const container = document.getElementById('org-tree-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted" style="padding:60px">Đang tải...</div>';
    try {
      const data = await apiGet('/api/organizations');
      this._orgs = data.organizations || [];
      this._loading = false;
      this._renderTree(container);
    } catch (e) {
      this._loading = false; this._error = e.message;
      container.innerHTML = `<div class="text-center text-danger" style="padding:60px">Lỗi: ${esc(e.message)}</div>`;
    }
  },

  _buildTree(items) {
    const map = {}; const roots = [];
    items.forEach(item => { map[item.id] = { ...item, children: [] }; });
    items.forEach(item => {
      const node = map[item.id];
      if (item.parent_id && map[item.parent_id]) { map[item.parent_id].children.push(node); }
      else { roots.push(node); }
    });
    const sorter = (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || '').localeCompare(b.name || '');
    roots.sort(sorter);
    const sortChildren = (nodes) => { nodes.sort(sorter); nodes.forEach(n => sortChildren(n.children)); };
    sortChildren(roots);
    return roots;
  },

  _renderTree(container) {
    const roots = this._buildTree(this._orgs);
    if (roots.length === 0 && this._editId !== 'new') {
      container.innerHTML = '<div class="text-center text-muted" style="padding:60px">Chưa có đơn vị nào. Nhấn "Thêm đơn vị" để tạo mới.</div>';
      return;
    }
    let html = '<ul class="org-tree" style="list-style:none;padding-left:0;margin:0">';
    html += this._renderNodes(roots, 0);
    if (this._editId === 'new') html += '<li style="padding-left:0">' + this._createFormHtml() + '</li>';
    html += '</ul>';
    container.innerHTML = html;
  },

  _renderNodes(nodes, depth) {
    if (!nodes || nodes.length === 0) return '';
    const pad = depth * 24;
    return nodes.map(n => {
      const isEditing = this._editId === n.id;
      let body;
      if (isEditing) { body = this._editFormHtml(n); }
      else {
        const desc = n.description ? `<span class="text-muted" style="font-size:0.85em;margin-left:8px">${esc(n.description)}</span>` : '';
        body = `
          <div class="org-node" style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:4px;transition:background 0.15s"
               onmouseover="this.style.background='var(--bg-hover,#f5f5f5)'" onmouseout="this.style.background=''">
            <span class="org-node-icon" style="flex-shrink:0;color:var(--text-muted,#999)">📁</span>
            <span class="org-node-name" style="font-weight:500">${esc(n.name)}</span>
            ${desc}
            <span class="org-node-actions" style="margin-left:auto;display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" aria-label="Chỉnh sửa" onclick="SCREEN_ORGANIZATIONS.showEditForm(${n.id})">✎</button>
              <button class="btn btn-ghost btn-sm" title="Xóa" aria-label="Xóa" onclick="SCREEN_ORGANIZATIONS.confirmDelete(${n.id})">🗑</button>
            </span>
          </div>`;
      }
      const childrenHtml = this._renderNodes(n.children, depth + 1);
      return `<li style="padding-left:${pad}px;margin:2px 0">${body}${childrenHtml ? '<ul style="list-style:none;padding-left:0;margin:0">' + childrenHtml + '</ul>' : ''}</li>`;
    }).join('');
  },

  _parentOptions(excludeId) {
    const renderOpts = (items, depth) => {
      return items.map(item => {
        if (item.id === excludeId) return '';
        const prefix = '—'.repeat(depth);
        let opts = `<option value="${item.id}">${prefix} ${esc(item.name)}</option>`;
        if (item.children && item.children.length) opts += renderOpts(item.children, depth + 1);
        return opts;
      }).join('');
    };
    const roots = this._buildTree(this._orgs);
    return '<option value="">(Không — đơn vị gốc)</option>' + renderOpts(roots, 0);
  },

  showCreateForm() { this._editId = 'new'; const container = document.getElementById('org-tree-container'); if (container) this._renderTree(container); },

  _createFormHtml() {
    const opts = this._parentOptions(null);
    return `
      <div class="org-inline-form" style="border:1px solid var(--border,#e0e0e0);border-radius:6px;padding:16px;margin:8px 0;background:var(--bg-card,#fff)">
        <h4 style="margin:0 0 12px 0;font-size:1em">Thêm đơn vị mới</h4>
        <div class="form-group"><label>Tên đơn vị <span class="text-danger">*</span></label><input type="text" class="form-control" id="org-new-name" placeholder="Nhập tên đơn vị" autofocus></div>
        <div class="form-group"><label>Mô tả</label><textarea class="form-control" id="org-new-desc" rows="2" placeholder="Mô tả (không bắt buộc)"></textarea></div>
        <div class="form-group"><label>Đơn vị cha</label><select class="form-control" id="org-new-parent">${opts}</select></div>
        <div class="form-actions" style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="SCREEN_ORGANIZATIONS.saveCreate()">Lưu</button>
          <button class="btn btn-ghost" onclick="SCREEN_ORGANIZATIONS.cancelForm()">Hủy</button>
        </div>
      </div>`;
  },

  cancelForm() { this._editId = null; const container = document.getElementById('org-tree-container'); if (container) this._renderTree(container); },

  async saveCreate() {
    const name = document.getElementById('org-new-name')?.value.trim();
    if (!name) { alert('Vui lòng nhập tên đơn vị.'); return; }
    const description = document.getElementById('org-new-desc')?.value.trim() || undefined;
    const parent_id = document.getElementById('org-new-parent')?.value || undefined;
    try {
      await apiPost('/api/organizations', { name, description, parent_id: parent_id || undefined });
      this._editId = null; await this.load();
    } catch (e) { alert('Lỗi khi tạo đơn vị: ' + e.message); }
  },

  showEditForm(id) { this._editId = id; const container = document.getElementById('org-tree-container'); if (container) this._renderTree(container); },

  _editFormHtml(org) {
    const opts = this._parentOptions(org.id);
    return `
      <div class="org-inline-form" style="border:1px solid var(--border,#e0e0e0);border-radius:6px;padding:16px;margin:4px 0;background:var(--bg-card,#fff)">
        <div class="form-group"><label>Tên đơn vị <span class="text-danger">*</span></label><input type="text" class="form-control" id="org-edit-name-${org.id}" value="${esc(org.name)}" autofocus></div>
        <div class="form-group"><label>Mô tả</label><textarea class="form-control" id="org-edit-desc-${org.id}" rows="2">${esc(org.description || '')}</textarea></div>
        <div class="form-group"><label>Đơn vị cha</label><select class="form-control" id="org-edit-parent-${org.id}">${opts}</select></div>
        <div class="form-actions" style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="SCREEN_ORGANIZATIONS.saveEdit(${org.id})">Lưu</button>
          <button class="btn btn-ghost" onclick="SCREEN_ORGANIZATIONS.cancelForm()">Hủy</button>
        </div>
      </div>`;
  },

  async saveEdit(id) {
    const name = document.getElementById(`org-edit-name-${id}`)?.value.trim();
    if (!name) { alert('Vui lòng nhập tên đơn vị.'); return; }
    const description = document.getElementById(`org-edit-desc-${id}`)?.value.trim() || undefined;
    const parent_id = document.getElementById(`org-edit-parent-${id}`)?.value || undefined;
    try {
      await apiPut(`/api/organizations/${id}`, { name, description, parent_id: parent_id || undefined });
      this._editId = null; await this.load();
    } catch (e) { alert('Lỗi khi cập nhật đơn vị: ' + e.message); }
  },

  async confirmDelete(id) {
    const org = this._orgs.find(o => o.id === id);
    if (!org) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn vị "${org.name}"?`)) return;
    try { await apiDelete(`/api/organizations/${id}`); await this.load(); }
    catch (e) { alert('Lỗi khi xóa đơn vị: ' + e.message); }
  },
};
