/* ================================================================
   MTIS Password Management Screen (S-M01-10)
   ================================================================ */

const SCREEN_PASSWORD = {
  render() {
    const user = AUTH.getUser();
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
          <span>Đổi mật khẩu</span>
        </div>
        <h2 class="page-title">Đổi mật khẩu</h2>
        <p class="page-subtitle">Thay đổi mật khẩu đăng nhập hệ thống</p>

        <div class="card" style="max-width:520px">
          <div class="card-header"><h3>Thay đổi mật khẩu</h3></div>
          <div class="card-body">
            <div id="pw-error" class="alert alert-danger" style="display:none" role="alert"></div>

            <form id="pw-form" onsubmit="return SCREEN_PASSWORD.submit(event)">
              <div class="form-group">
                <label for="pw-old" class="required">Mật khẩu cũ</label>
                <input type="password" id="pw-old" class="form-control" placeholder="Nhập mật khẩu hiện tại"
                       autocomplete="current-password" required aria-required="true">
              </div>
              <div class="form-group">
                <label for="pw-new" class="required">Mật khẩu mới</label>
                <input type="password" id="pw-new" class="form-control" placeholder="Nhập mật khẩu mới"
                       minlength="8" required aria-required="true" autocomplete="new-password"
                       oninput="SCREEN_PASSWORD.updateStrength()">
                <div id="pw-strength" class="password-strength mt-2" style="display:none">
                  <div class="strength-bar"><div id="pw-strength-fill" class="strength-fill"></div></div>
                  <span class="strength-text text-muted" id="pw-strength-label"></span>
                </div>
              </div>
              <div class="form-group">
                <label for="pw-confirm" class="required">Xác nhận mật khẩu mới</label>
                <input type="password" id="pw-confirm" class="form-control" placeholder="Nhập lại mật khẩu mới"
                       minlength="8" required aria-required="true" autocomplete="new-password">
              </div>
              <div class="password-requirements mb-4">
                Yêu cầu: ≥ 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.
                Không trùng với 3 mật khẩu gần nhất.
              </div>
              <button type="submit" id="pw-btn" class="btn btn-primary">
                <span class="btn-icon"><span class="icon">${icons.iconSave}</span></span> Đổi mật khẩu
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  updateStrength() {
    const pw = document.getElementById('pw-new').value;
    const errors = validatePasswordStrength(pw);
    const bar = document.getElementById('pw-strength');
    const fill = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');

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

  async submit(e) {
    e.preventDefault();
    const btn = document.getElementById('pw-btn');
    const oldPw = document.getElementById('pw-old').value;
    const newPw = document.getElementById('pw-new').value;
    const confirmPw = document.getElementById('pw-confirm').value;

    if (!oldPw) {
      TOAST.warning('Vui lòng nhập mật khẩu cũ');
      return false;
    }

    const pwErrors = validatePasswordStrength(newPw);
    if (pwErrors.length > 0) {
      TOAST.warning(pwErrors.join('; '));
      return false;
    }
    if (newPw !== confirmPw) {
      TOAST.warning('Mật khẩu xác nhận không khớp');
      return false;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang xử lý...';

    try {
      await apiPut('/api/auth/change-password', {
        old_password: oldPw,
        new_password: newPw,
      });
      document.getElementById('pw-form').reset();
      TOAST.success('Đổi mật khẩu thành công');
    } catch (e) {
      TOAST.error(e.message || 'Không thể đổi mật khẩu');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon"><span class="icon">${icons.iconSave}</span></span> Đổi mật khẩu';
    }
    return false;
  },

  afterRender() {
    const el = document.getElementById('pw-old');
    if (el) el.focus();
  },
};
