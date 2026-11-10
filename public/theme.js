// Chuyển giao diện: Tự động (theo máy) → Sáng → Tối. Dùng chung cho trang đăng nhập và app.
(function () {
  var ORDER = ['auto', 'light', 'dark'];
  var ICON = { auto: '◐', light: '☀', dark: '☾' };
  var LABEL = { auto: 'Giao diện: tự động theo máy', light: 'Giao diện: sáng', dark: 'Giao diện: tối' };
  function get() { try { var t = localStorage.getItem('pvsm_theme'); return t === 'light' || t === 'dark' ? t : 'auto'; } catch (e) { return 'auto'; } }
  function apply(t) {
    var el = document.documentElement;
    if (t === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', t);
    try { if (t === 'auto') localStorage.removeItem('pvsm_theme'); else localStorage.setItem('pvsm_theme', t); } catch (e) {}
    document.querySelectorAll('.theme-btn').forEach(paint);
  }
  function paint(b) { var t = get(); b.textContent = ICON[t]; b.title = LABEL[t]; b.setAttribute('aria-label', LABEL[t]); }
  window.pvsmTheme = {
    get: get,
    next: function () { apply(ORDER[(ORDER.indexOf(get()) + 1) % ORDER.length]); },
    button: function () { return '<button type="button" class="theme-btn" title="' + LABEL[get()] + '" aria-label="' + LABEL[get()] + '">' + ICON[get()] + '</button>'; },
    paint: paint,
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.theme-btn');
    if (b) { e.stopPropagation(); window.pvsmTheme.next(); }
  }, true);
})();
