/* ================================================================
   MTIS Forgot Password Screen (S-M01-12)
   ================================================================ */

const SCREEN_FORGOT_PASSWORD = {
  render() {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <img class="login-logo-img" src="assets/logo-cuc-hang-hai.svg" alt="Cục Hàng hải Việt Nam" onerror="this.style.display='none'">
            <div class="login-logo-text">
              <strong>Quản lý KCHT Hàng hải</strong>
              <small>Cục Hàng hải Việt Nam</small>
            </div>
          </div>
          <h1 class="login-title">Quên mật khẩu</h1>
          <p class="login-subtitle">Nhập email đã đăng ký để nhận link đặt lại mật khẩu</p>

          <div id="forgot-success" class="alert alert-success" style="display:none" role="alert">
            <strong>✔</strong> Link đặt lại mật khẩu đã được gửi đến email của bạn.
          </div>
          <div id="forgot-error" class="alert alert-danger" style="display:none" role="alert" aria-live="polite"></div>

          <form id="forgot-form" onsubmit="return SCREEN_FORGOT_PASSWORD.submit(event)">
            <div class="form-group">
              <label for="forgot-email" class="required">Email</label>
              <input type="email" id="forgot-email" class="form-control" placeholder="Nhập email đã đăng ký"
                     autocomplete="email" required aria-required="true" autofocus>
            </div>
            <button type="submit" id="forgot-btn" class="btn btn-primary btn-block">
              GỬI YÊU CẦU
            </button>
          </form>

          <div class="login-footer-links">
            <a href="#login">← Quay lại đăng nhập</a>
          </div>
        </div>
      </div>
    `;
  },

  async submit(e) {
    e.preventDefault();
    const btn = document.getElementById('forgot-btn');
    const errEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const email = document.getElementById('forgot-email').value.trim();

    errEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!email) {
      errEl.textContent = 'Vui lòng nhập email';
      errEl.style.display = '';
      return false;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang gửi...';

    try {
      await apiPost('/api/auth/forgot-password', { email });
      document.getElementById('forgot-form').style.display = 'none';
      successEl.style.display = '';
    } catch (e) {
      errEl.textContent = e.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      errEl.style.display = '';
    }

    btn.disabled = false;
    btn.textContent = 'GỬI YÊU CẦU';
    return false;
  },

  afterRender() {
    const el = document.getElementById('forgot-email');
    if (el) el.focus();
  },
};
