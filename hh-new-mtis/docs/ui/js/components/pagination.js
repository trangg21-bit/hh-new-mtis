/* ================================================================
   MTIS Pagination — reusable pagination controls
   Usage: PAGINATION.render(containerEl, { page, total, limit, onPage })
   ================================================================ */

const PAGINATION = {
  render(container, opts) {
    var page = opts.page || 1;
    var total = opts.total || 0;
    var limit = opts.limit || 20;
    var onPage = opts.onPage || function () {};
    var totalPages = Math.max(1, Math.ceil(total / limit));

    if (!container) return;

    var start = (page - 1) * limit + 1;
    var end = Math.min(page * limit, total);

    var infoHtml = ''
      + '<span class="page-info">'
      + 'Hiển thị ' + start + '–' + end + ' / ' + total
      + '</span>';

    if (totalPages <= 1) {
      container.innerHTML = infoHtml;
      return;
    }

    var btnHtml = '';
    if (page > 1) {
      btnHtml += '<button class="page-btn" data-page="' + (page - 1) + '">← Trước</button>';
    }

    var maxVisible = 5;
    var startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    var endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      btnHtml += '<button class="page-btn" data-page="1">1</button>';
      if (startPage > 2) btnHtml += '<span class="page-ellipsis">…</span>';
    }

    for (var i = startPage; i <= endPage; i++) {
      btnHtml += '<button class="page-btn' + (i === page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) btnHtml += '<span class="page-ellipsis">…</span>';
      btnHtml += '<button class="page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
    }

    if (page < totalPages) {
      btnHtml += '<button class="page-btn" data-page="' + (page + 1) + '">Sau →</button>';
    }

    container.innerHTML = '<div class="pagination">' + infoHtml + btnHtml + '</div>';

    var buttons = container.querySelectorAll('.page-btn');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function (e) {
        var p = parseInt(e.target.getAttribute('data-page'));
        if (p && p !== page) onPage(p);
      });
    }
  },
};
