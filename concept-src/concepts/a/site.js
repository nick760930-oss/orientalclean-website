/* ============ Concept A 立面索引 ============ */
(() => {
  const { onReady, clamp, reduced, low, track } = window.OC;

  /* ---------- 選單 ---------- */
  function initMenu() {
    const btn = document.querySelector('.a-menu');
    const nav = document.getElementById('a-nav');
    if (!btn || !nav) return;
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('no-scroll', open);
      btn.firstElementChild.textContent = open ? '關閉' : '選單';
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') set(false); });
  }

  /* ---------- 立面判讀：繩索與材質區塊 ---------- */
  function initFacade() {
    const svg = document.querySelector('[data-facade]');
    if (!svg) return;
    const stage = svg.closest('[data-stage]');
    const zones = [...svg.querySelectorAll('.a-hit')].map((r) => ({
      id: r.dataset.zone, x: +r.getAttribute('x'), y: +r.getAttribute('y'),
      w: +r.getAttribute('width'), h: +r.getAttribute('height'),
    }));
    // 接縫是細長區塊，優先判定
    zones.sort((a, b) => (a.id === 'joint' ? -1 : b.id === 'joint' ? 1 : 0));
    const centers = {
      tile: { x: 470, y: 330 }, glass: { x: 290, y: 400 }, joint: { x: 400, y: 470 },
      stone: { x: 470, y: 690 }, metal: { x: 360, y: 100 }, render: { x: 95, y: 620 },
    };
    const ropes = svg.querySelectorAll('.a-rope');
    const reticle = svg.querySelector('.a-reticle');
    const buttons = [...document.querySelectorAll('[data-zone-btn]')];
    const panels = [...document.querySelectorAll('[data-read]')];
    let current = null;

    const zoneAt = (p) => (zones.find((z) => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) || {}).id;
    const select = (id, source) => {
      if (!id || id === current) return;
      current = id;
      svg.querySelectorAll('.a-zone, .a-label').forEach((g) => g.classList.toggle('is-active', g.dataset.zone === id));
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zoneBtn === id)));
      panels.forEach((p) => {
        const on = p.dataset.read === id;
        p.classList.toggle('is-active', on);
        if (on && !reduced()) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
      });
      if (source) track('facade_zone', { zone: id, source });
    };

    /* 繩索：兩條獨立繩索（工作繩＋確保繩）的簡化 Verlet 模擬 */
    const ROOF_Y = 58, MIN_X = 206, MAX_X = 530, N = 22;
    const target = { ...centers.tile };
    const end = { x: target.x, y: ROOF_Y + 4 };
    const anchor = { x: clamp(target.x, MIN_X, MAX_X), y: ROOF_Y };
    const pts = Array.from({ length: N }, (_, i) => ({ x: anchor.x, y: ROOF_Y + i, px: anchor.x, py: ROOF_Y + i }));
    let raf = 0, still = 0;
    const simulate = !reduced() && !low;

    const draw = () => {
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < N; i++) d += ` L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
      ropes[0].setAttribute('d', d);
      // 確保繩與工作繩平行，固定點稍微錯開
      let d2 = `M${(pts[0].x + 5).toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < N; i++) d2 += ` L${(pts[i].x + 5 * (1 - i / N) + 2).toFixed(1)} ${(pts[i].y + 1).toFixed(1)}`;
      ropes[1].setAttribute('d', d2);
      reticle.setAttribute('transform', `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)})`);
    };

    const straight = () => {
      anchor.x = clamp(target.x, MIN_X, MAX_X);
      end.x = target.x; end.y = target.y;
      pts.forEach((p, i) => {
        const t = i / (N - 1);
        p.x = p.px = anchor.x + (end.x - anchor.x) * t;
        p.y = p.py = anchor.y + (end.y - anchor.y) * t;
      });
      draw();
    };

    const step = () => {
      const ax = clamp(target.x, MIN_X, MAX_X);
      anchor.x += (ax - anchor.x) * 0.06;
      end.x += (target.x - end.x) * 0.16;
      end.y += (target.y - end.y) * 0.12;
      const len = Math.hypot(end.x - anchor.x, end.y - anchor.y) * 1.025 / (N - 1);
      let moved = 0;
      for (let i = 1; i < N - 1; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.97, vy = (p.y - p.py) * 0.97;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + 0.32;
        moved += Math.abs(vx) + Math.abs(vy);
      }
      for (let k = 0; k < 14; k++) {
        pts[0].x = anchor.x; pts[0].y = anchor.y;
        pts[N - 1].x = end.x; pts[N - 1].y = end.y;
        for (let i = 0; i < N - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const diff = (dist - len) / dist * 0.5;
          if (i > 0) { a.x += dx * diff; a.y += dy * diff; }
          if (i + 1 < N - 1) { b.x -= dx * diff; b.y -= dy * diff; }
        }
      }
      draw();
      const settled = moved < 0.04 && Math.abs(target.x - end.x) < 0.2 && Math.abs(target.y - end.y) < 0.2 && Math.abs(ax - anchor.x) < 0.2;
      still = settled ? still + 1 : 0;
      raf = still > 40 ? 0 : requestAnimationFrame(step);
    };
    const kick = () => {
      if (!simulate) { straight(); return; }
      still = 0;
      if (!raf) raf = requestAnimationFrame(step);
    };

    const moveTo = (p, source) => {
      target.x = clamp(p.x, 30, 610);
      target.y = clamp(p.y, 76, 752);
      select(zoneAt(target), source);
      kick();
    };
    const toSvg = (ev) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    let dragging = false;
    svg.addEventListener('pointerdown', (ev) => {
      dragging = true;
      if (ev.pointerType === 'mouse') svg.setPointerCapture(ev.pointerId);
      moveTo(toSvg(ev), ev.pointerType);
    });
    svg.addEventListener('pointermove', (ev) => {
      if (dragging) moveTo(toSvg(ev), ev.pointerType);
    });
    const stop = () => { dragging = false; };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
    svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') stop(); });

    buttons.forEach((b) => b.addEventListener('click', () => moveTo(centers[b.dataset.zoneBtn], 'button')));

    stage.addEventListener('keydown', (ev) => {
      const d = ev.shiftKey ? 40 : 16;
      const map = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
      if (!map[ev.key]) return;
      ev.preventDefault();
      moveTo({ x: target.x + map[ev.key][0], y: target.y + map[ev.key][1] }, 'keyboard');
    });

    select('tile');
    if (simulate) {
      // 進場：繩索由屋頂固定點垂降到第一個判讀位置
      straight();
      end.y = ROOF_Y + 4; end.x = anchor.x;
      pts.forEach((p) => { p.x = p.px = anchor.x; p.y = p.py = ROOF_Y + 1; });
      draw();
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { kick(); io.disconnect(); }
      });
      io.observe(svg);
    } else {
      straight();
    }
  }

  /* ---------- 段落導覽 ---------- */
  function initToc() {
    const toc = document.querySelector('.a-toc');
    if (!toc) return;
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const bar = toc.querySelector('.a-toc__bar span');
    const body = toc.nextElementSibling;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach((t) => io.observe(t));
    if (bar && body) {
      let ticking = false;
      const update = () => {
        const r = body.getBoundingClientRect();
        const p = clamp((innerHeight * 0.3 - r.top) / r.height, 0, 1);
        bar.style.width = (p * 100).toFixed(1) + '%';
        ticking = false;
      };
      addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
  }

  /* ---------- 表格整列可點 ---------- */
  function initRows() {
    document.querySelectorAll('tr[data-href]').forEach((tr) => {
      tr.addEventListener('click', (ev) => {
        if (ev.target.closest('a') || getSelection().toString()) return;
        location.href = tr.dataset.href;
      });
    });
  }

  onReady(() => { initMenu(); initFacade(); initToc(); initRows(); });
})();
