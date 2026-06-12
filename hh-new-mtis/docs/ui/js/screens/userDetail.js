/* ================================================================
   MTIS User Detail Screen (S-M01-03) — view/edit individual user
   Route: #user-detail/<id>
   ================================================================ */

const SCREEN_USER_DETAIL = {
  _userId: null,
  _user: null,
  _editing: false,

  render(token) {
    this._userId = token || null;
    return ''
      + '<div class="content">'
    + '  <div class="breadcrumb">'
    + '    <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>'
    + '    <a href="#users">Người dùng</a> <span class="sep">/</span>'
    + '    <span id="ud-breadcrumb-name">Đang tải...</span>'
    + '  </div>'
      + '  <div class="flex-between">'
      + '    <h2 class="page-title" style="margin-bottom:0">Chi tiết người dùng</h2>'
      + '    <div class="flex gap-2">'
      + '      <a href="#users" class="btn btn-outline btn-sm">← Quay lại</a>'
      + '      <button class="btn btn-primary btn-sm" id="ud-edit-btn" onclick="SCREEN_USER_DETAIL.toggleEdit()"><span class="icon">' + icons.iconEdit + '</span> Chỉnh sửa</button>'
      + '    </div>'
      + '  </div>'
      + ''
      + '  <div id="ud-alert" class="alert alert-success" style="display:none" role="alert"></div>'
      + '  <div id="ud-error" class="alert alert-danger" style="display:none" role="alert"></div>'
      + ''
      + '  <div class="card mt-4" id="ud-card">'
      + '    <div class="card-header"><h3>Thông tin người dùng</h3></div>'
      + '    <div class="card-body" id="ud-body">'
      + '      <div class="empty-state"><p>Đang tải...</p></div>'
      + '    </div>'
      + '  </div>'
      + '</div>';
  },

  async afterRender() {
    if (!this._userId) {
      window.location.hash = '#users';
      return;
    }
    await this.load();
  },

  async load() {
    var alertEl = document.getElementById('ud-alert');
    var errEl = document.getElementById('ud-error');
    if (alertEl) alertEl.style.display = 'none';
    if (errEl) errEl.style.display = 'none';
    this._editing = false;

    try {
      var data = await apiGet('/api/users/' + this._userId);
      this._user = data.user;
      if (!this._user) throw new Error('Không tìm thấy người dùng');
      this._renderView();
      var breadcrumb = document.getElementById('ud-breadcrumb-name');
      if (breadcrumb) breadcrumb.textContent = this._user.full_name;
      document.title = this._user.full_name + ' — QL KCHT Hàng hải';
    } catch (e) {
      var body = document.getElementById('ud-body');
      if (body) body.innerHTML = '<div class="empty-state"><p class="text-danger">Lỗi: ' + esc(e.message) + '</p></div>';
    }
  },

  _renderView() {
    var u = this._user;
    var body = document.getElementById('ud-body');
    var editBtn = document.getElementById('ud-edit-btn');
    if (editBtn) editBtn.innerHTML = '<span class="icon">' + icons.iconEdit + '</span> Chỉnh sửa';

    var statusText = u.status === 1 ? 'Đang hoạt động' : u.status === 2 ? 'Bị khóa' : 'Đã xóa';
    var statusBadgeClass = u.status === 1 ? 'badge-green' : u.status === 2 ? 'badge-red' : 'badge-gray';

    if (body) body.innerHTML = ''
      + '<div class="grid-2">'
      + '  <div class="form-group"><label>Tên đăng nhập</label><div class="form-control" style="background:#f9fafb;color:var(--color-muted-light);border:none;padding:8px 12px">' + esc(u.username) + '</div></div>'
      + '  <div class="form-group"><label>Họ tên</label><div class="form-control" style="background:#f9fafb;color:var(--color-heading);border:none;padding:8px 12px">' + esc(u.full_name) + '</div></div>'
      + '  <div class="form-group"><label>Email</label><div class="form-control" style="background:#f9fafb;color:var(--color-heading);border:none;padding:8px 12px">' + esc(u.email || '—') + '</div></div>'
      + '  <div class="form-group"><label>Số điện thoại</label><div class="form-control" style="background:#f9fafb;color:var(--color-heading);border:none;padding:8px 12px">' + esc(u.phone || '—') + '</div></div>'
      + '  <div class="form-group"><label>Đơn vị</label><div class="form-control" style="background:#f9fafb;color:var(--color-heading);border:none;padding:8px 12px">' + esc(u.org_unit || '—') + '</div></div>'
      + '  <div class="form-group"><label>Vai trò</label><div class="form-control" style="background:#f9fafb;color:var(--color-heading);border:none;padding:8px 12px"><span class="badge badge-blue">' + esc(u.role) + '</span></div></div>'
      + '  <div class="form-group"><label>Trạng thái</label><div class="mt-2"><span class="badge ' + statusBadgeClass + '">' + statusText + '</span></div></div>'
      + '  <div class="form-group"><label>Ngày tạo</label><div class="form-control" style="background:#f9fafb;color:var(--color-muted-light);border:none;padding:8px 12px">' + esc(u.created_at || '—') + '</div></div>'
      + '</div>';
  },

  toggleEdit() {
    if (this._editing) {
      this._editing = false;
      this._renderView();
      return;
    }
    this._editing = true;
    this._renderEdit();
  },

  _renderEdit() {
    var u = this._user;
    var body = document.getElementById('ud-body');
    var editBtn = document.getElementById('ud-edit-btn');
    if (editBtn) editBtn.textContent = 'Hủy';

    if (body) body.innerHTML = ''
      + '<form id="ud-form" onsubmit="return SCREEN_USER_DETAIL.save(event)">'
      + '<div class="grid-2">'
      + '  <div class="form-group"><label>Tên đăng nhập</label><input class="form-control" value="' + esc(u.username) + '" disabled style="background:#f9fafb"></div>'
      + '  <div class="form-group"><label class="required">Họ tên</label><input class="form-control" id="ud-fullname" autocomplete="name" autocorrect="off" autocapitalize="characters" spellcheck="false" value="' + esc(u.full_name) + '" required></div>'
      + '  <div class="form-group"><label>Email</label><input class="form-control" id="ud-email" type="email" autocomplete="email" autocorrect="off" autocapitalize="off" spellcheck="false" value="' + esc(u.email || '') + '" placeholder="email@domain.com"></div>'
      + '  <div class="form-group"><label>Số điện thoại</label><input class="form-control" id="ud-phone" autocomplete="tel" autocorrect="off" autocapitalize="off" spellcheck="false" value="' + esc(u.phone || '') + '" placeholder="0912 345 678"></div>'
      + '  <div class="form-group"><label>Đơn vị</label><input class="form-control" id="ud-org" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="' + esc(u.org_unit || '') + '"></div>'
      + '  <div class="form-group"><label>Vai trò</label><input class="form-control" value="' + esc(u.role) + '" disabled style="background:#f9fafb"></div>'
      + '  <div class="form-group"><label>Trạng thái</label><div class="mt-2"><span class="badge ' + (u.status === 1 ? 'badge-green' : 'badge-red') + '">' + (u.status === 1 ? 'Đang hoạt động' : 'Bị khóa') + '</span></div></div>'
      + '  <div class="form-group"><label>Ngày tạo</label><input class="form-control" value="' + esc(u.created_at || '—') + '" disabled style="background:#f9fafb"></div>'
      + '</div>'
      + '<div class="flex gap-2 mt-4" style="justify-content:flex-end">'
      + '  <button type="button" class="btn btn-outline" onclick="SCREEN_USER_DETAIL.toggleEdit()">Hủy</button>'
      + '  <button type="submit" id="ud-save-btn" class="btn btn-primary"><span class="icon">' + icons.iconSave + '</span> Lưu</button>'
      + '</div>'
      + '</form>';
  },

  async save(e) {
    e.preventDefault();
    var errEl = document.getElementById('ud-error');
    var alertEl = document.getElementById('ud-alert');
    var btn = document.getElementById('ud-save-btn');

    if (errEl) errEl.style.display = 'none';
    if (alertEl) alertEl.style.display = 'none';

    var full_name = document.getElementById('ud-fullname').value.trim();
    var email = document.getElementById('ud-email').value.trim();
    var phone = document.getElementById('ud-phone').value.trim();
    var org_unit = document.getElementById('ud-org').value.trim();

    if (!full_name) {
      if (errEl) { errEl.textContent = 'Vui lòng nhập họ tên'; errEl.style.display = ''; }
      return false;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang lưu...'; }

    try {
      await apiPut('/api/users/' + this._userId, {
        full_name: full_name,
        email: email || undefined,
        phone: phone || undefined,
        org_unit: org_unit || undefined,
      });
      if (alertEl) {
        alertEl.innerHTML = 'Đã lưu thay đổi';
        alertEl.style.display = '';
      }
      await this.load();
    } catch (e) {
      if (errEl) { errEl.textContent = e.message || 'Không thể lưu thay đổi'; errEl.style.display = ''; }
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="icon">' + icons.iconSave + '</span> Lưu'; }
    return false;
  },
};
