/* ================================================================
   MTIS Login Screen (S-M01-11)
   ================================================================ */

const SCREEN_LOGIN = {
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
          <h1 class="login-title">Đăng nhập hệ thống</h1>
          <p class="login-subtitle">Hệ thống quản lý KCHT Giao thông Hàng hải</p>

          <div id="login-error" class="alert alert-danger" style="display:none" role="alert" aria-live="polite"></div>

          <form id="login-form" onsubmit="return SCREEN_LOGIN.submit(event)">
            <div class="form-group">
              <label for="login-username" class="required">Tên đăng nhập</label>
              <input type="text" id="login-username" class="form-control" placeholder="Nhập tên đăng nhập"
                     autocomplete="username" aria-required="true" autofocus>
            </div>
            <div class="form-group">
              <label for="login-password" class="required">Mật khẩu</label>
              <input type="password" id="login-password" class="form-control" placeholder="Nhập mật khẩu"
                     autocomplete="current-password" aria-required="true">
            </div>
            <div class="form-group login-options">
              <label class="checkbox-label">
                <input type="checkbox" id="login-remember"> Ghi nhớ đăng nhập
              </label>
            </div>
            <button type="submit" id="login-btn" class="btn btn-primary btn-block">
              ĐĂNG NHẬP
            </button>
          </form>

          <div class="login-footer-links">
            <a href="#forgot-password" class="login-link">Quên mật khẩu?</a>
          </div>

          <div class="login-footer">
            Cục Hàng hải Việt Nam — Phiên bản 1.0
          </div>
        </div>
      </div>
    `;
  },

  async submit(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    errEl.style.display = 'none';

    if (!username || !password) {
      SCREEN_LOGIN.showError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return false;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';

    try {
      await AUTH.login(username, password);
      window.location.hash = '#dashboard';
    } catch (e) {
      if (e.status === 423) {
        SCREEN_LOGIN.showError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị hệ thống.');
      } else {
        SCREEN_LOGIN.showError(e.message || 'Đăng nhập thất bại');
      }
      btn.disabled = false;
      btn.textContent = 'ĐĂNG NHẬP';
    }
    return false;
  },

  showError(msg) {
    const el = document.getElementById('login-error');
    if (el) {
      el.textContent = msg;
      el.style.display = '';
    }
  },

  afterRender() {
    document.getElementById('login-username').focus();
  },
};
