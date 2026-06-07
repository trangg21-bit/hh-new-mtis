/* ================================================================
   MTIS Toast Notification — global notification system
   Usage: TOAST.success('Tạo thành công')
          TOAST.error('Có lỗi xảy ra')
          TOAST.warning('Cảnh báo')
          TOAST.info('Thông tin')
   ================================================================ */

const TOAST = {
  _container: null,
  _idCounter: 0,

  _ensureContainer() {
    if (!this._container || !document.getElementById('toast-container')) {
      let el = document.getElementById('toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast-container';
        document.body.appendChild(el);
      }
      this._container = el;
    }
    return this._container;
  },

  _show(message, type, duration) {
    const container = this._ensureContainer();
    const id = 'toast-' + (++this._idCounter);
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ';

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-msg">' + esc(message) + '</span>';
    container.appendChild(toast);

    var remove = function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    setTimeout(remove, duration || 4000);

    toast.addEventListener('click', function () {
      clearTimeout(toast._timer);
      remove();
    });

    return id;
  },

  success(message, duration) { return this._show(message, 'success', duration); },
  error(message, duration)   { return this._show(message, 'error', duration); },
  warning(message, duration) { return this._show(message, 'warning', duration); },
  info(message, duration)    { return this._show(message, 'info', duration); },
};
