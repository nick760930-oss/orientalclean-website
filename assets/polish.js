/* polish.js — 配合 polish.css：捲動後讓 Hero 捲動提示淡出；讓 iOS Safari 的 :active 按壓回饋生效。 */
(function () {
  var root = document.documentElement;
  function onScroll() {
    root.classList.toggle('oc-scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  document.addEventListener('touchstart', function () {}, { passive: true });
})();
