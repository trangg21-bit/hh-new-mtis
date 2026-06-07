/* ================================================================
   MTIS Password Strength Meter — reusable component
   Usage: PASSWORD_STRENGTH.attach(inputEl, containerEl)
   ================================================================ */

const PASSWORD_STRENGTH = {
  _instances: {},

  attach(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    const key = inputId;
    if (this._instances[key]) {
      input.removeEventListener('input', this._instances[key]);
    }

    const handler = () => this.update(input, container);
    input.addEventListener('input', handler);
    this._instances[key] = handler;
  },

  update(input, container) {
    const pw = input.value;
    const errors = validatePasswordStrength(pw);

    if (!pw) {
      container.style.display = 'none';
      return;
    }
    container.style.display = '';

    const fill = container.querySelector('.strength-fill');
    const label = container.querySelector('.strength-text');
    if (!fill || !label) return;

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

  renderHTML(inputId) {
    var cid = inputId + '-strength';
    return '<div id="' + cid + '" class="password-strength mt-2" style="display:none">'
      + '<div class="strength-bar"><div class="strength-fill"></div></div>'
      + '<span class="strength-text text-muted"></span>'
      + '</div>';
  },

  afterRender(inputId) {
    var cid = inputId + '-strength';
    this.attach(inputId, cid);
  },
};
