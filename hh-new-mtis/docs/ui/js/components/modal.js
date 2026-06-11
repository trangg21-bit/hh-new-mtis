/* ================================================================
   MTIS Modal — reusable modal/dialog component
   Usage: MODAL.confirm('Tiêu đề', 'Nội dung xác nhận').then(ok => ...)
          MODAL.alert('Thông báo', 'Nội dung')
          MODAL.show({ title, body, footer, size })
   ================================================================ */

const MODAL = {
  _resolve: null,
  _overlay: null,

  confirm(title, message, confirmText, cancelText) {
    return new Promise(function (resolve) {
      MODAL._resolve = resolve;
      MODAL._show({
        title: title || 'Xác nhận',
        body: '<p>' + esc(message) + '</p>',
        footer: ''
          + '<button class="btn btn-outline" id="modal-cancel">' + esc(cancelText || 'Hủy') + '</button>'
          + '<button class="btn btn-primary" id="modal-confirm">' + esc(confirmText || 'Xác nhận') + '</button>',
        size: 'sm',
        onRender: function () {
          document.getElementById('modal-cancel').focus();
        },
      });
    });
  },

  alert(title, message) {
    return new Promise(function (resolve) {
      MODAL._resolve = resolve;
      MODAL._show({
        title: title || 'Thông báo',
        body: '<p>' + esc(message) + '</p>',
        footer: '<button class="btn btn-primary" id="modal-ok">OK</button>',
        size: 'sm',
        onRender: function () {
          document.getElementById('modal-ok').focus();
        },
      });
    });
  },

  _show(opts) {
    this.close();

    var sizeClass = opts.size === 'lg' ? 'modal-lg' : opts.size === 'sm' ? 'modal-sm' : '';

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', opts.title);
    overlay.innerHTML = ''
      + '<div class="modal-card ' + sizeClass + '">'
      + '  <div class="modal-header">'
      + '    <h3>' + esc(opts.title) + '</h3>'
      + '    <button class="modal-close" aria-label="Đóng" onclick="MODAL.close(false)">✕</button>'
      + '  </div>'
      + '  <div class="modal-body">' + (opts.body || '') + '</div>'
      + '  <div class="modal-footer flex gap-2" style="justify-content:flex-end;margin-top:16px">' + (opts.footer || '') + '</div>'
      + '</div>';

    document.body.appendChild(overlay);
    this._overlay = overlay;

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) MODAL.close(false);
    });

    document.addEventListener('keydown', MODAL._onEscape);

    if (opts.onRender) setTimeout(function () { opts.onRender(); }, 0);

    var confirmBtn = document.getElementById('modal-confirm');
    var cancelBtn = document.getElementById('modal-cancel');
    var okBtn = document.getElementById('modal-ok');

    if (confirmBtn) confirmBtn.addEventListener('click', function () { MODAL.close(true); });
    if (cancelBtn) cancelBtn.addEventListener('click', function () { MODAL.close(false); });
    if (okBtn) okBtn.addEventListener('click', function () { MODAL.close(true); });

    requestAnimationFrame(function () {
      overlay.classList.add('modal-overlay--visible');
    });
  },

  _onEscape(e) {
    if (e.key === 'Escape') MODAL.close(false);
  },

  close(result) {
    var overlay = this._overlay;
    if (overlay) {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
      this._overlay = null;
    }
    document.removeEventListener('keydown', this._onEscape);
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  },
};
