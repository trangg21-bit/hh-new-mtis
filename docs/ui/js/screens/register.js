/* ================================================================
   MTIS User Registration Screen (S-M01-09) — Admin-only user creation
   ================================================================ */

const SCREEN_REGISTER = {
  render() {
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
          <a href="#users">Người dùng</a> <span class="sep">/</span>
          <span>Thêm người dùng</span>
        </div>
        <h2 class="page-title">Thêm người dùng mới</h2>
        <p class="page-subtitle">Tạo tài khoản người dùng cho hệ thống Quản lý KCHT Hàng hải</p>

        <div class="card" style="max-width:640px">
          <div class="card-header"><h3>Thông tin tài khoản</h3></div>
          <div class="card-body">
            <div id="reg-error" class="alert alert-danger" style="display:none" role="alert"></div>
            <div id="reg-success" class="alert alert-success" style="display:none" role="alert"></div>

            <form id="reg-form">
              <div class="grid-2">
                <div class="form-group">
                  <label for="reg-fullname" class="required">Họ và tên</label>
                  <input type="text" id="reg-fullname" class="form-control" placeholder="Nguyễn Văn A"
                         aria-required="true" autofocus>
                </div>
                <div class="form-group">
                  <label for="reg-username" class="required">Tên đăng nhập</label>
                  <input type="text" id="reg-username" class="form-control" placeholder="nguyen.van.a"
                         aria-required="true" autocomplete="off" maxlength="10">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label for="reg-email">Email</label>
                  <input type="email" id="reg-email" class="form-control" placeholder="nguyen.van.a@example.com"
                         autocomplete="email" maxlength="20">
                </div>
                <div class="form-group">
                  <label for="reg-phone">Số điện thoại</label>
                  <input type="text" id="reg-phone" class="form-control" placeholder="0912 345 678">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label for="reg-org" class="required">Đơn vị</label>
                  <input type="text" id="reg-org" class="form-control" value="Cảng vụ Hàng hải Hải Phòng"
                         aria-required="true">
                </div>
                <div class="form-group">
                  <label for="reg-role" class="required">Vai trò</label>
                  <select id="reg-role" class="form-control" aria-required="true">
                    <option value="">Chọn vai trò</option>
                    <option value="infrastructure-officer" selected>Chuyên viên</option>
                    <option value="port-authority-leader">Lãnh đạo Cảng vụ</option>
                    <option value="director">Lãnh đạo Cục</option>
                    <option value="system-admin">Quản trị hệ thống</option>
                  </select>
                </div>
              </div>
              <hr class="section-divider">
              <div class="grid-2">
                <div class="form-group">
                  <label for="reg-password" class="required">Mật khẩu</label>
                  <input type="password" id="reg-password" class="form-control" placeholder="Tối thiểu 8 ký tự"
                         aria-required="true" autocomplete="new-password"
                         oninput="SCREEN_REGISTER.updateStrength()">
                  <div id="reg-strength" class="password-strength mt-2" style="display:none">
                    <div class="strength-bar"><div id="reg-strength-fill" class="strength-fill"></div></div>
                    <span class="strength-text text-muted" id="reg-strength-label"></span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="reg-confirm" class="required">Xác nhận mật khẩu</label>
                  <input type="password" id="reg-confirm" class="form-control" placeholder="Nhập lại mật khẩu"
                         aria-required="true" autocomplete="new-password">
                </div>
              </div>
              <div class="password-requirements mb-4">
                Yêu cầu: ≥ 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt
              </div>

              <div class="flex-between">
                <a href="#users" class="btn btn-outline">← Quay lại</a>
                <button type="submit" id="reg-btn" class="btn btn-primary">
                  <span class="btn-icon">➕</span> Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  updateStrength() {
    const pw = document.getElementById('reg-password').value;
    const errors = validatePasswordStrength(pw);
    const bar = document.getElementById('reg-strength');
    const fill = document.getElementById('reg-strength-fill');
    const label = document.getElementById('reg-strength-label');

    if (!pw) { bar.style.display = 'none'; return; }
    bar.style.display = '';

    const passCount = [
      pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw),
      /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw),
    ].filter(Boolean).length;
    const pct = (passCount / 5) * 100;
    fill.style.width = pct + '%';

    if (errors.length === 0) {
      fill.style.background = 'var(--color-success)';
      label.textContent = 'Mật khẩu mạnh';
      label.style.color = 'var(--color-success)';
    } else if (passCount >= 3) {
      fill.style.background = 'var(--color-warning)';
      label.textContent = 'Mật khẩu trung bình';
      label.style.color = 'var(--color-warning)';
    } else {
      fill.style.background = 'var(--color-danger)';
      label.textContent = 'Mật khẩu yếu';
      label.style.color = 'var(--color-danger)';
    }
  },

  async submit(event) {
    if (event) event.preventDefault();
    // Re-query elements each time to avoid stale refs
    const btn = document.getElementById('reg-btn');
    if (!btn || btn.disabled) return false;
    const errEl = document.getElementById('reg-error');
    const successEl = document.getElementById('reg-success');

    errEl.style.display = 'none';
    successEl.style.display = 'none';

    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const orgUnit = document.getElementById('reg-org').value.trim();
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!fullName || !username) {
      errEl.textContent = 'Vui lòng nhập họ tên và tên đăng nhập';
      errEl.style.display = '';
      return false;
    }
    const pwErrors = validatePasswordStrength(password);
    if (pwErrors.length > 0) {
      errEl.textContent = pwErrors.join('; ');
      errEl.style.display = '';
      return false;
    }
    if (password !== confirm) {
      errEl.textContent = 'Mật khẩu xác nhận không khớp';
      errEl.style.display = '';
      return false;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang tạo...';

    try {
      await apiPost('/api/users', {
        username, password, full_name: fullName, email: email || undefined,
        phone: phone || undefined, org_unit: orgUnit, role,
      });
      errEl.style.display = 'none';
      successEl.innerHTML = '<strong>✔</strong> Tạo tài khoản thành công! <a href="#users">Quay lại danh sách</a>';
      successEl.style.display = 'block';
      document.getElementById('reg-form').reset();
    } catch (e) {
      errEl.textContent = e.message || 'Không thể tạo tài khoản';
      errEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">➕</span> Tạo tài khoản';
    return false;
  },

  afterRender() {
    const el = document.getElementById('reg-fullname');
    if (el) el.focus();
    const form = document.getElementById('reg-form');
    if (form) form.addEventListener('submit', (e) => this.submit(e));
  },
};
