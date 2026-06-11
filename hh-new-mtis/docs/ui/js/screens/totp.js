/* ================================================================
   MTIS TOTP Config Screen (S-M01-08)
   ================================================================ */

const SCREEN_TOTP = {
  _state: 'idle',
  _qrcode: '',
  _secret: '',
  _userId: null,

  render() {
    return `
      <div class="content">
        <div class="breadcrumb">
          <a href="#dashboard">Tổng quan</a> <span class="sep">/</span>
          <span>Cấu hình TOTP</span>
        </div>
        <h2 class="page-title">Cấu hình xác thực hai yếu tố (TOTP)</h2>

        <div id="totp-alert" class="alert" style="display:none" role="alert" aria-live="polite"></div>

        <div id="totp-body" class="card mt-4">
          ${this._bodyHtml()}
        </div>
      </div>
    `;
  },

  _bodyHtml() {
    if (this._state === 'setup') return this._setupHtml();
    if (this._state === 'enabled') return this._enabledHtml();
    return this._idleHtml();
  },

  _idleHtml() {
    return `
      <div class="text-center" style="padding:40px 20px">
        <div style="font-size:48px;margin-bottom:12px">🔐</div>
        <p style="font-size:var(--font-size-base);color:var(--color-body-text);margin-bottom:8px">
          Bảo vệ tài khoản của bạn với xác thực hai yếu tố
        </p>
        <p style="font-size:var(--font-size-sm);color:var(--color-muted);margin-bottom:24px">
          Sử dụng ứng dụng xác thực như Google Authenticator hoặc Microsoft Authenticator
        </p>
        <button id="btn-totp-setup" class="btn btn-primary" onclick="SCREEN_TOTP.setup()">
          🔐 Kích hoạt 2FA
        </button>
      </div>
    `;
  },

  _setupHtml() {
    return `
      <div class="text-center" style="padding:20px">
        <h3 class="page-title" style="margin-bottom:6px">Quét mã QR</h3>
        <p style="font-size:var(--font-size-sm);color:var(--color-muted);margin-bottom:20px">
          Dùng ứng dụng xác thực để quét mã QR bên dưới
        </p>

        <div style="display:flex;justify-content:center;margin-bottom:20px">
          <div style="border:2px dashed var(--color-border);border-radius:var(--radius-card);padding:20px;display:inline-block;background:var(--color-white)">
            <img id="totp-qrcode" src="${esc(this._qrcode)}" alt="TOTP QR Code"
                 style="width:200px;height:200px;display:block">
          </div>
        </div>

        <div style="margin-bottom:20px">
          <p style="font-size:var(--font-size-sm);color:var(--color-muted);margin-bottom:6px">
            Hoặc nhập mã thủ công
          </p>
          <code id="totp-secret" style="font-family:monospace;font-size:16px;letter-spacing:2px;background:var(--color-ghost-hover);padding:8px 16px;border-radius:var(--radius-btn);cursor:pointer;user-select:all"
                onclick="SCREEN_TOTP._copySecret()" title="Nhấp để sao chép">${esc(this._secret)}</code>
        </div>

        <div style="max-width:280px;margin:0 auto">
          <div class="form-group">
            <label for="totp-code">Mã xác thực 6 chữ số</label>
            <input type="text" id="totp-code" class="form-control" placeholder="000000"
                   maxlength="6" inputmode="numeric" pattern="[0-9]*"
                   style="text-align:center;font-family:monospace;font-size:24px;letter-spacing:6px"
                   oninput="this.value=this.value.replace(/\\D/g,'')" autocomplete="off">
          </div>
          <button id="btn-totp-verify" class="btn btn-success btn-block" onclick="SCREEN_TOTP.verify()">
            ✓ Xác nhận
          </button>
        </div>
      </div>
    `;
  },

  _enabledHtml() {
    return `
      <div class="text-center" style="padding:40px 20px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <p style="font-size:var(--font-size-base);color:var(--color-body-text);margin-bottom:12px">
          Xác thực hai yếu tố
        </p>
        <div style="margin-bottom:24px">
          <span class="badge badge-green" style="font-size:var(--font-size-base);padding:4px 16px">
            ✅ Đã kích hoạt
          </span>
        </div>
        <button id="btn-totp-disable" class="btn btn-danger" onclick="SCREEN_TOTP.disable()">
          🔓 Vô hiệu hóa 2FA
        </button>
      </div>
    `;
  },

  afterRender() {
    this._userId = (AUTH.getUser() || {}).id;
    if (!this._userId) return;

    const user = AUTH.getUser();
    if (user && user.totpEnabled) {
      this._state = 'enabled';
      this._refreshBody();
    }
  },

  _refreshBody() {
    const body = document.getElementById('totp-body');
    if (body) body.innerHTML = this._bodyHtml();
    if (this._state === 'setup') {
      document.getElementById('totp-code')?.focus();
    }
  },

  _showAlert(msg, type) {
    const el = document.getElementById('totp-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + (type === 'error' ? 'alert-danger' : 'alert-success');
    el.style.display = '';
  },

  _hideAlert() {
    const el = document.getElementById('totp-alert');
    if (el) el.style.display = 'none';
  },

  async setup() {
    this._hideAlert();
    const btn = document.getElementById('btn-totp-setup');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang khởi tạo...';

    try {
      const res = await apiPost('/api/auth/totp/setup', { userId: this._userId });
      this._qrcode = res.qrcode;
      this._secret = res.secret;
      this._state = 'setup';
      this._refreshBody();
    } catch (e) {
      this._showAlert(e.message || 'Không thể khởi tạo TOTP', 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  },

  async verify() {
    this._hideAlert();
    const code = document.getElementById('totp-code')?.value.trim();
    if (!code || code.length !== 6) {
      this._showAlert('Vui lòng nhập mã xác thực 6 chữ số', 'error');
      return;
    }

    const btn = document.getElementById('btn-totp-verify');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang xác thực...';

    try {
      const res = await apiPost('/api/auth/totp/verify', { userId: this._userId, code });
      if (res.ok) {
        this._showAlert('Kích hoạt TOTP thành công!', 'success');
        this._state = 'enabled';
        setTimeout(() => this._refreshBody(), 1200);
      } else {
        this._showAlert(res.message || 'Mã xác thực không đúng', 'error');
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    } catch (e) {
      this._showAlert(e.message || 'Xác thực thất bại', 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  },

  async disable() {
    this._hideAlert();

    const password = prompt('Nhập mật khẩu để xác nhận vô hiệu hóa 2FA:');
    if (!password) return;

    const btn = document.getElementById('btn-totp-disable');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang vô hiệu hóa...';
    }

    try {
      const res = await apiPost('/api/auth/totp/disable', { userId: this._userId, password });
      if (res.ok) {
        this._showAlert('Đã vô hiệu hóa TOTP', 'success');
        this._state = 'idle';
        this._qrcode = '';
        this._secret = '';
        setTimeout(() => this._refreshBody(), 1200);
      } else {
        this._showAlert(res.message || 'Không thể vô hiệu hóa', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '🔓 Vô hiệu hóa 2FA'; }
      }
    } catch (e) {
      this._showAlert(e.message || 'Vô hiệu hóa thất bại', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '🔓 Vô hiệu hóa 2FA'; }
    }
  },

  _copySecret() {
    const el = document.getElementById('totp-secret');
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).catch(() => {});
  },
};
