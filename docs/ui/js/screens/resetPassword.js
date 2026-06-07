/* ================================================================
   MTIS Reset Password Screen (S-M01-13)
   ================================================================ */

const SCREEN_RESET_PASSWORD = {
  _token: null,

  render(token) {
    this._token = token || '';
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <div class="login-logo-icon">MT</div>
            <div class="login-logo-text">
              <strong>MTIS</strong>
              <small>Quản lý KCHT Hàng hải</small>
            </div>
          </div>
          <h1 class="login-title">Đặt lại mật khẩu</h1>
          <p class="login-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>

          <div id="reset-error" class="alert alert-danger" style="display:none" role="alert" aria-live="polite"></div>
          <div id="reset-success" class="alert alert-success" style="display:none" role="alert"></div>

          <form id="reset-form" onsubmit="return SCREEN_RESET_PASSWORD.submit(event)">
            <div class="form-group">
              <label for="reset-password" class="required">Mật khẩu mới</label>
              <input type="password" id="reset-password" class="form-control"
                     placeholder="Nhập mật khẩu mới" minlength="8" required aria-required="true"
                     autocomplete="new-password" oninput="SCREEN_RESET_PASSWORD.updateStrength()">
              <div id="reset-strength" class="password-strength mt-2" style="display:none">
                <div class="strength-bar"><div id="reset-strength-fill" class="strength-fill"></div></div>
                <span class="strength-text text-muted" id="reset-strength-label"></span>
              </div>
            </div>
            <div class="form-group">
              <label for="reset-confirm" class="required">Xác nhận mật khẩu</label>
              <input type="password" id="reset-confirm" class="form-control"
                     placeholder="Nhập lại mật khẩu mới" minlength="8" required aria-required="true"
                     autocomplete="new-password">
              <div id="reset-match-error" class="field-error" style="display:none">Mật khẩu không khớp</div>
            </div>
            <div class="password-requirements">
              Yêu cầu: ≥ 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt
            </div>
            <button type="submit" id="reset-btn" class="btn btn-primary btn-block">
              ĐẶT LẠI MẬT KHẨU
            </button>
          </form>

          <div class="login-footer-links">
            <a href="#login">← Quay lại đăng nhập</a>
          </div>
        </div>
      </div>
    `;
  },

  updateStrength() {
    const pw = document.getElementById('reset-password').value;
    const errors = validatePasswordStrength(pw);
    const bar = document.getElementById('reset-strength');
    const fill = document.getElementById('reset-strength-fill');
    const label = document.getElementById('reset-strength-label');

    if (!pw) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = '';
    const passCount = [
      pw.length >= 8,
      /[A-Z]/.test(pw),
      /[a-z]/.test(pw),
      /[0-9]/.test(pw),
      /[^A-Za-z0-9]/.test(pw),
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
    const btn = document.getElementById('reset-btn');
    const errEl = document.getElementById('reset-error');
    const successEl = document.getElementById('reset-success');
    const password = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-confirm').value;

    errEl.style.display = 'none';
    successEl.style.display = 'none';

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
    btn.innerHTML = '<span class="spinner"></span> Đang đặt lại...';

    try {
      const data = await apiPost('/api/auth/reset-password', {
        token: this._token,
        new_password: password,
      });
      document.getElementById('reset-form').style.display = 'none';
      successEl.innerHTML = '<strong>✔</strong> Mật khẩu đã được đặt lại thành công. <a href="#login">Chuyển hướng đến đăng nhập...</a>';
      successEl.style.display = '';
    } catch (e) {
      errEl.textContent = e.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      errEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'ĐẶT LẠI MẬT KHẨU';
    }
    return false;
  },

  afterRender() {
    const el = document.getElementById('reset-password');
    if (el) el.focus();
  },
};
