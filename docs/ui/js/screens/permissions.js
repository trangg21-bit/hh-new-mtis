/* ================================================================
   MTIS Permission Matrix Screen (S-M01-05) — Enterprise Tree View
   ================================================================ */

const SCREEN_PERMISSIONS = {
  _data: null,
  _groups: [],
  _featureTree: [],
  _selectedFeatures: [],
  _currentRoleId: null,

  render() {
    const isAdmin = AUTH.getUser() && AUTH.getUser().role === 'system-admin';
    return `
      <div class="content permissions-page">
        <div class="card data-card">
          <!-- Header -->
          <div class="data-card-header" style="flex-direction:column;align-items:flex-start;gap:12px;padding:24px 24px 20px">
            <div class="breadcrumb">
              <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
              <span>Phân quyền nhóm người dùng</span>
            </div>
            <h1 class="page-title" style="margin-bottom:4px">Phân quyền nhóm người dùng</h1>
          </div>

          <hr class="section-divider" style="margin:0 24px">

          <!-- Configuration Panel -->
          <div class="admin-toolbar" style="padding:24px;gap:16px;flex-wrap:wrap">
            <div style="display:flex;gap:16px;width:100%;align-items:flex-end;flex-wrap:wrap">
              <!-- App Code -->
              <div style="flex:2;min-width:300px">
                <label style="display:block;font-size:var(--font-size-xs);color:var(--color-muted);margin-bottom:4px;font-weight:500">Mã ứng dụng</label>
                <input type="text" class="form-control" value="VMD_MTIS - Hệ thống thông tin quản lý kết cấu hạ tầng giao thông hàng hải" readonly style="background:#f9fafb;color:#6b7280">
              </div>

              <!-- Group Code -->
              <div style="flex:1;min-width:200px">
                <label style="display:block;font-size:var(--font-size-xs);color:var(--color-muted);margin-bottom:4px;font-weight:500">Mã nhóm</label>
                <input type="text" class="form-control" id="perms-group-code" readonly style="background:#f9fafb;color:#6b7280" placeholder="Chọn nhóm ở dưới">
              </div>

              <!-- Unit Level -->
              <div style="flex:1;min-width:200px">
                <label style="display:block;font-size:var(--font-size-xs);color:var(--color-muted);margin-bottom:4px;font-weight:500">Cấp đơn vị được sử dụng</label>
                <select class="form-control" id="perms-unit-level">
                  <option value="">— Chọn cấp đơn vị —</option>
                  <option value="Cuc">Cục</option>
                  <option value="ChiCuc">Chi cục / Cảng vụ / Công ty bảo đảm</option>
                  <option value="DaiDien">Đại diện</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Role Selector -->
          <div class="admin-toolbar" style="padding:0 24px 16px;border-bottom:1px solid var(--color-border-light);flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:12px;flex:1">
              <label style="font-size:var(--font-size-xs);color:var(--color-muted);font-weight:500;white-space:nowrap">Nhóm cần phân quyền:</label>
              <select class="form-control" id="perms-role-select" style="flex:1;max-width:300px" onchange="SCREEN_PERMISSIONS.onRoleChange()">
                <option value="">— Chọn nhóm —</option>
                ${this._groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Functional Tree -->
          <div class="data-card-header" style="padding:16px 24px;justify-content:space-between;align-items:center">
            <h3 style="margin:0;font-size:1rem">Danh sách chức năng</h3>
            <input type="text" class="form-control" id="perms-search" placeholder="Tìm tên chức năng..." oninput="SCREEN_PERMISSIONS.filterTree()" style="width:250px">
          </div>

          <div style="padding:0 24px 24px;max-height:600px;overflow-y:auto;border:1px solid var(--color-border);border-radius:6px;background:#fff">
            <div id="perms-tree-container" class="perms-tree-container">
              <div class="text-center text-muted" style="padding:40px">⚠ Vui lòng chọn nhóm ở trên để phân quyền</div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="padding:16px 24px;display:flex;justify-content:flex-end;gap:12px;border-top:1px solid var(--color-border-light)">
            <button class="btn btn-ghost" onclick="SCREEN_PERMISSIONS.resetForm()">↻ Làm mới</button>
            <button class="btn btn-primary" onclick="SCREEN_PERMISSIONS.savePermissions()" id="perms-save-btn" ${!isAdmin ? 'disabled' : ''}>💾 Lưu thay đổi</button>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() { this.load(); },

  async load() {
    try {
      const data = await apiGet('/api/permissions');
      this._groups = data.groups || [];
      this._featureTree = data.feature_tree || this._buildFeatureTree();
    } catch (e) {
      console.error('Load permissions failed', e);
      this._featureTree = this._buildFeatureTree();
    }
  },

  onRoleChange() {
    const roleId = document.getElementById('perms-role-select').value;
    if (!roleId) {
      document.getElementById('perms-group-code').value = '';
      document.getElementById('perms-tree-container').innerHTML = '<div class="text-center text-muted" style="padding:40px">⚠ Vui lòng chọn nhóm ở trên để phân quyền</div>';
      return;
    }

    this._currentRoleId = Number(roleId);
    const group = this._groups.find(g => g.id === Number(roleId));
    if (group) document.getElementById('perms-group-code').value = group.name.split(' ')[0] || 'GROUP_' + group.id;

    // Load existing permissions for this role
    apiGet(`/api/permissions/role/${roleId}`).then(permData => {
      this._selectedFeatures = permData.feature_ids || [];
      this.renderTree();
    }).catch(() => {
      this._selectedFeatures = [];
      this.renderTree();
    });
  },

  _buildFeatureTree() {
    return [
      {
        id: 'VMD_MTIS', code: 'VMD_MTIS',
        name: 'HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI',
        children: [
          {
            id: 'QLND', code: 'QLND', name: 'QUẢN LÝ NGƯỜI DÙNG',
            children: [
              { id: 'QLND_001', code: 'QLND_001', name: 'Quản lý danh sách người dùng', children: [] },
              { id: 'QLND_002', code: 'QLND_002', name: 'Quản lý nhóm người dùng', children: [] },
              { id: 'QLND_003', code: 'QLND_003', name: 'Quản lý phân quyền', children: [] }
            ]
          },
          {
            id: 'QTHT', code: 'QTHT', name: 'QUẢN TRỊ HỆ THỐNG',
            children: [
              { id: 'QTHT_001', code: 'QTHT_001', name: 'Quản lý đơn vị', children: [] },
              { id: 'QTHT_002', code: 'QTHT_002', name: 'Quản lý tài khoản admin', children: [] },
              { id: 'QTHT_003', code: 'QTHT_003', name: 'Quản lý log truy cập', children: [] },
              { id: 'QTHT_004', code: 'QTHT_004', name: 'Quản lý cấu hình hệ thống', children: [] }
            ]
          },
          {
            id: 'TSKT', code: 'TSKT', name: 'THÔNG SỐ KỸ THUẬT',
            children: [
              { id: 'TSKT_001', code: 'TSKT_001', name: 'Quản lý thông số KCHT', children: [] }
            ]
          },
          {
            id: 'GISM', code: 'GISM', name: 'BẢN ĐỒ GIS',
            children: [
              { id: 'GISM_001', code: 'GISM_001', name: 'Quản lý bản đồ GIS', children: [] }
            ]
          },
          {
            id: 'OPS', code: 'OPS', name: 'VẬN HÀNH & BẢO TRÌ',
            children: [
              { id: 'OPS_001', code: 'OPS_001', name: 'Quản lý vận hành', children: [] }
            ]
          }
        ]
      }
    ];
  },

  /* ---------- Tree Rendering ---------- */
  renderTree() {
    const container = document.getElementById('perms-tree-container');
    if (!container) return;

    let html = '<ul class="perms-tree">';
    html += this._renderNode(this._featureTree, 0);
    html += '</ul>';
    container.innerHTML = html;
  },

  _renderNode(nodes, depth) {
    let html = '';
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isChecked = this._selectedFeatures.includes(node.id);
      const indent = depth * 24;

      html += `
        <li class="perms-node">
          <label class="perms-node-item" style="padding-left:${indent}px">
            <input type="checkbox" ${isChecked ? 'checked' : ''}
              ${hasChildren ? `data-parent="${node.id}" onchange="SCREEN_PERMISSIONS.toggleParent('${node.id}', this.checked)"` : `data-feature="${node.id}" onchange="SCREEN_PERMISSIONS.toggleFeature('${node.id}', this.checked)"`}>
            <span class="perms-arrow" style="width:20px;display:inline-block;text-align:center;cursor:pointer">${hasChildren ? (isChecked ? '▼' : '▶') : '·'}</span>
            <span class="perms-label" style="font-weight:${depth === 0 ? '700' : (depth === 1 ? '600' : '400')}">${esc(node.name)} <small style="color:var(--color-muted);font-weight:400">[${esc(node.code)}]</small></span>
          </label>
          ${hasChildren ? '<ul>' + this._renderNode(node.children, depth + 1) + '</ul>' : ''}
        </li>
      `;
    });
    return html;
  },

  /* ---------- Tree Logic ---------- */
  toggleParent(id, checked) {
    this._recursiveCheck(id, checked);
    this.renderTree();
  },

  toggleFeature(id, checked) {
    this._updateSelection(id, checked);
    this._syncParent(id);
    this.renderTree();
  },

  _recursiveCheck(id, checked) {
    const mark = (nodes) => {
      for (const node of nodes) {
        if (node.id === id) {
          this._updateSelection(node.id, checked);
          if (node.children) mark(node.children);
          return;
        }
        if (node.children) mark(node.children);
      }
    };
    mark(this._featureTree);
  },

  _syncParent(childId) {
    const find = (nodes, parentId) => {
      for (const node of nodes) {
        if (node.children && node.children.some(c => c.id === childId)) {
          const allChecked = node.children.every(c => this._selectedFeatures.includes(c.id));
          this._updateSelection(node.id, allChecked);
          find(nodes, node.id);
          return;
        }
        if (node.children) find(node.children, childId);
      }
    };
    find(this._featureTree, childId);
  },

  _updateSelection(id, checked) {
    if (checked && !this._selectedFeatures.includes(id)) {
      this._selectedFeatures.push(id);
    } else if (!checked) {
      this._selectedFeatures = this._selectedFeatures.filter(f => f !== id);
    }
  },

  filterTree() {
    const keyword = document.getElementById('perms-search').value.toLowerCase();
    const filter = (nodes) => {
      return nodes.reduce((acc, node) => {
        const match = node.name.toLowerCase().includes(keyword);
        const filtered = node.children ? filter(node.children) : [];
        if (match || filtered.length > 0) {
          acc.push({ ...node, children: filtered });
        }
        return acc;
      }, []);
    };

    const filtered = filter(this._buildFeatureTree());
    const origTree = this._featureTree;
    this._featureTree = filtered;
    this.renderTree();
    this._featureTree = origTree;
  },

  resetForm() {
    if (this._currentRoleId) {
      this.onRoleChange();
    } else {
      document.getElementById('perms-role-select').value = '';
      document.getElementById('perms-group-code').value = '';
      document.getElementById('perms-tree-container').innerHTML = '<div class="text-center text-muted" style="padding:40px">⚠ Vui lòng chọn nhóm ở trên để phân quyền</div>';
    }
  },

  async savePermissions() {
    if (!this._currentRoleId) return alert('⚠ Vui lòng chọn nhóm để phân quyền!');

    const btn = document.getElementById('perms-save-btn');
    btn.disabled = true; btn.textContent = 'Đang lưu...';

    try {
      await apiPut('/api/permissions', {
        group_id: this._currentRoleId,
        feature_ids: this._selectedFeatures
      });
      alert('✅ Lưu phân quyền thành công!');
    } catch (e) {
      alert('❌ Lỗi: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '💾 Lưu thay đổi';
    }
  }
};
