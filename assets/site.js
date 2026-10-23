/* site.js — 東方繩洗官網。無框架。所有動態只用 transform / opacity。 */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('no-js');
  root.classList.add('js');
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* ---- header: hide on scroll down, show on scroll up; menu ---- */
  var header = $('.header'), lastY = window.scrollY, ticking = false;
  var menuBtn = $('.menu-btn'), nav = $('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? '關閉' : '選單';
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); }); });
  }
  if (header) {
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var menuOpen = nav && nav.classList.contains('is-open');
        if (y > lastY + 6 && y > 200 && !menuOpen) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 80) header.classList.remove('is-hidden');
        lastY = y; ticking = false;
      });
    }, { passive: true });
  }

  /* ---- entrances: heading -> text -> picture, staggered, once ---- */
  var targets = $$('[data-r]');
  if (targets.length && 'IntersectionObserver' in window) {
    var groups = new Map();
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      batch.forEach(function (e, i) {
        e.target.style.setProperty('--d', Math.min(i * 75, 450) + 'ms');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
    // safety: never leave content hidden
    setTimeout(function () { targets.forEach(function (t) { if (!t.classList.contains('is-in')) { var r = t.getBoundingClientRect(); if (r.top < innerHeight) t.classList.add('is-in'); } }); }, 2500);
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---- features: stepping statements ---- */
  var feat = $('.features');
  if (feat && 'IntersectionObserver' in window) {
    var sts = $$('.st', feat), pairs = $$('.pair', feat), marks = $$('.features__marks i', feat);
    function setStep(i) {
      sts.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      pairs.forEach(function (p) { p.classList.toggle('is-on', +p.getAttribute('data-i') === i); });
    }
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setStep(marks.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    marks.forEach(function (m) { fio.observe(m); });
  }

  /* ---- services list: active row, crossfading picture ---- */
  $$('.svcs').forEach(function (box) {
    var rows = $$('.svc', box), pics = $$('.svcs__pic img', box);
    if (!rows.length) return;
    function act(i) {
      rows.forEach(function (r, k) { r.classList.toggle('is-on', k === i); });
      pics.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
    }
    act(0);
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) act(rows.indexOf(e.target)); });
      }, { rootMargin: '-46% 0px -46% 0px' });
      rows.forEach(function (r) { sio.observe(r); });
    }
    rows.forEach(function (r, i) {
      r.addEventListener('mouseenter', function () { if (matchMedia('(hover: hover)').matches) act(i); });
      r.addEventListener('focusin', function () { act(i); });
    });
  });

  /* ---- proof card entrance ---- */
  var card = $('.proof__card');
  if (card && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); o.disconnect(); } }); }, { threshold: 0.15 }).observe(card);
  } else if (card) { card.classList.add('is-in'); }

  /* ---- drag row ---- */
  $$('.how').forEach(function (box) {
    var rail = $('.rail', box), bar = $('.bar i', box);
    if (!rail) return;
    var cols = $$('.col', rail);
    function prog() {
      var max = rail.scrollWidth - rail.clientWidth;
      var frac = rail.clientWidth / rail.scrollWidth;
      var pos = max > 0 ? rail.scrollLeft / max : 0;
      if (bar) {
        bar.style.width = (frac * 100) + '%';
        var track = bar.parentNode.clientWidth;
        bar.style.transform = 'translateX(' + (pos * (track - track * frac)) + 'px)';
      }
    }
    rail.addEventListener('scroll', function () { requestAnimationFrame(prog); }, { passive: true });
    window.addEventListener('resize', prog);
    prog();
    function step(dir) {
      var w = (cols[0] ? cols[0].getBoundingClientRect().width : 280) + 32;
      rail.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    }
    var prev = $('[data-prev]', box), next = $('[data-next]', box);
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    rail.setAttribute('tabindex', '0');
    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; rail.classList.add('is-drag'); }
      if (moved) rail.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        rail.classList.remove('is-drag');
        var w = (cols[0] ? cols[0].getBoundingClientRect().width : 280) + 32;
        rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: 'smooth' });
      }
    });
  });

  /* ---- inquiry: build the message ---- */
  var form = $('#inq-form');
  if (form) {
    var out = $('#inq-msg'), status = $('#inq-status');
    function vals(name) { return $$('[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }
    function val(name) { var el = form.elements[name]; return el ? String(el.value || '').trim() : ''; }
    function build() {
      var type = (vals('type')[0] || ''), city = val('city'), floors = val('floors');
      var place = [type, city, floors ? '約 ' + floors + ' 層' : ''].filter(Boolean).join('，');
      var items = vals('item').join('、'), parts = vals('part').join('、');
      var lines = ['東方繩洗您好，想詢問外牆工程：'];
      lines.push('案場：' + (place || '（尚未填寫）'));
      lines.push('項目：' + (items || '（尚未選擇）'));
      lines.push('部位：' + (parts || '（尚未選擇）'));
      lines.push('現況：' + (val('note') || '（尚未填寫）'));
      lines.push('希望時間：' + (val('when') || '（尚未填寫）'));
      var who = val('who'); if (who) lines.push('聯絡：' + who);
      lines.push('（外觀照片我另外傳）');
      return lines.join('\n');
    }
    function render() { out.textContent = build(); }
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();
    var MAIL = 'orientalclean@gmail.com', LINE = 'https://line.me/R/ti/p/@oriental_clean';
    function say(t) { if (status) status.textContent = t; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('外牆工程詢價') + '&body=' + encodeURIComponent(build());
    });
    var lineBtn = $('[data-copy-line]', form.parentNode) || $('[data-copy-line]');
    if (lineBtn) lineBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var text = build();
      function select() {
        var r = d.createRange(); r.selectNodeContents(out);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r);
        say('無法自動複製，請長按訊息複製後貼到 LINE。');
      }
      var opened = false;
      function go() { if (opened) return; opened = true; window.open(LINE, '_blank', 'noopener'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          say('已複製訊息，開啟 LINE 後貼上即可。');
          out.classList.remove('is-flash'); void out.offsetWidth; out.classList.add('is-flash');
          go();
        }, select);
      } else { select(); }
    });
  }
})();
