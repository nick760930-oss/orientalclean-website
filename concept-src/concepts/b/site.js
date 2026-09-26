/* ============ Concept B 現場紀錄 ============ */
(() => {
  const { onReady, reduced, low, track, clamp } = window.OC;
  const root = document.documentElement;

  /* ---------- 目錄 ---------- */
  function initContents() {
    const dlg = document.getElementById('b-contents');
    const btn = document.querySelector('[data-open-contents]');
    if (!dlg || !btn || typeof dlg.showModal !== 'function') {
      if (btn) btn.addEventListener('click', () => { location.href = btn.closest('header').querySelector('.b-brand').href; });
      return;
    }
    btn.addEventListener('click', () => { dlg.showModal(); btn.setAttribute('aria-expanded', 'true'); track('contents_open'); });
    dlg.addEventListener('close', () => btn.setAttribute('aria-expanded', 'false'));
    dlg.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-close]') || ev.target === dlg) dlg.close();
    });
  }

  /* ---------- 放大鏡 ---------- */
  function initLoupe() {
    const dlg = document.getElementById('b-loupe');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const box = dlg.querySelector('.b-loupe__img');
    const cap = dlg.querySelector('.b-loupe__cap');
    const count = dlg.querySelector('.b-loupe__count');
    const caseLink = dlg.querySelector('.b-loupe__case');
    let frames = [], idx = 0;
    const visible = () => [...document.querySelectorAll('[data-loupe]')].filter((a) => !a.closest('[hidden]'));
    const show = (i) => {
      idx = (i + frames.length) % frames.length;
      const a = frames[idx];
      const img = new Image();
      img.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
      img.width = +a.dataset.w; img.height = +a.dataset.h;
      img.decoding = 'async';
      img.setAttribute('data-oc-img', '');
      img.src = a.href;
      box.replaceChildren(img);
      cap.textContent = a.dataset.caption;
      count.textContent = `${idx + 1}／${frames.length}`;
      caseLink.href = a.dataset.case;
      // 預載前後兩張
      [idx + 1, idx - 1].forEach((j) => { const n = frames[(j + frames.length) % frames.length]; if (n) { const p = new Image(); p.src = n.href; } });
    };
    document.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-loupe]');
      if (!a || ev.metaKey || ev.ctrlKey) return;
      ev.preventDefault();
      frames = visible();
      show(frames.indexOf(a));
      dlg.showModal();
      track('loupe_open');
    });
    dlg.querySelector('[data-loupe-prev]').addEventListener('click', () => show(idx - 1));
    dlg.querySelector('[data-loupe-next]').addEventListener('click', () => show(idx + 1));
    dlg.addEventListener('click', (ev) => { if (ev.target.closest('[data-close]')) dlg.close(); });
    dlg.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); show(idx + 1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); show(idx - 1); }
    });
    let sx = null;
    const fig = dlg.querySelector('.b-loupe__fig');
    fig.addEventListener('pointerdown', (ev) => { sx = ev.clientX; });
    fig.addEventListener('pointerup', (ev) => {
      if (sx === null) return;
      const dx = ev.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- 照片遮罩展開（只作用在照片，文字不做淡入） ---------- */
  function initReveal() {
    if (reduced() || low || !('IntersectionObserver' in window)) return;
    root.classList.add('b-anim');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.b-reveal').forEach((el) => {
      // 首屏內的照片直接顯示，避免延遲 LCP
      if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('is-in');
      else io.observe(el);
    });
  }

  /* ---------- 封面：捲動時收緊裁切 ---------- */
  function initCoverCrop() {
    const frame = document.querySelector('.b-cover__frame');
    if (!frame || reduced() || low) return;
    const img = frame.querySelector('img');
    let ticking = false, started = false;
    const update = () => {
      ticking = false;
      const r = frame.getBoundingClientRect();
      const p = clamp(-r.top / r.height, 0, 1);
      if (p <= 0 && !started) return;
      started = true;
      img.style.animation = 'none';
      img.style.clipPath = `inset(0 ${(p * 7).toFixed(2)}% ${(p * 16).toFixed(2)}% ${(p * 7).toFixed(2)}%)`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  onReady(() => { initContents(); initLoupe(); initReveal(); initCoverCrop(); });
})();
