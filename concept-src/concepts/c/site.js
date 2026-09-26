/* ============ Concept C 垂降 ============ */
(() => {
  const { onReady, clamp, reduced, low, track } = window.OC;

  /* ---------- 選單 ---------- */
  function initMenu() {
    const btn = document.querySelector('.c-menu');
    const nav = document.getElementById('c-nav');
    if (!btn || !nav) return;
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('no-scroll', open);
      btn.textContent = open ? '關閉' : '選單';
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') set(false); });
  }

  /* ---------- 垂降：捲動控制時間 ---------- */
  function initDescent() {
    const root = document.querySelector('[data-descent]');
    if (!root) return;
    const trackEl = root.querySelector('[data-track]');
    const scenes = [...trackEl.children];
    const N = scenes.length;
    const marker = root.querySelector('[data-alt-marker]');
    const floorEl = root.querySelector('[data-alt-floor]');
    const stageEl = root.querySelector('[data-alt-stage]');
    const hudN = root.querySelector('[data-hud-n]');
    const hudBar = root.querySelector('[data-hud-bar]');
    const stations = [...root.querySelectorAll('.c-alt__list [data-goto]')];
    const prevBtn = root.querySelector('[data-step="-1"]');
    const nextBtn = root.querySelector('[data-step="1"]');
    const pinnedQuery = matchMedia('(min-width: 961px) and (pointer: fine)');
    let pinned = false, current = -1, x = 0;

    const preload = (i) => {
      for (const j of [i, i + 1, i + 2]) {
        const s = scenes[j];
        if (s) s.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; });
      }
    };
    const setIndex = (i) => {
      if (i === current) return;
      current = i;
      const s = scenes[i];
      floorEl.textContent = s.dataset.floor;
      stageEl.textContent = s.dataset.stage;
      hudN.textContent = i;
      stations.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === N - 1;
      scenes.forEach((sc, k) => sc.toggleAttribute('inert', pinned && Math.abs(k - i) > 0));
      preload(i);
      track('descent_scene', { scene: s.dataset.stage });
    };
    const render = (pos) => {
      x = pos;
      const p = N > 1 ? x / (N - 1) : 0;
      marker.style.setProperty('--p', p.toFixed(4));
      hudBar.style.width = (p * 100).toFixed(1) + '%';
      if (pinned) {
        trackEl.style.transform = `translate3d(${(-x * innerWidth).toFixed(1)}px,0,0)`;
        if (!reduced() && !low) scenes.forEach((sc, k) => {
          const d = clamp(x - k, -1, 1);
          if (Math.abs(d) < 1) sc.style.setProperty('--px', (d * -5).toFixed(2));
        });
      }
      setIndex(Math.round(x));
    };

    const pinnedRange = () => root.offsetHeight - innerHeight;
    const onScroll = () => {
      if (pinned) {
        const top = root.getBoundingClientRect().top;
        render(clamp(-top / pinnedRange(), 0, 1) * (N - 1));
      } else {
        render(clamp(trackEl.scrollLeft / trackEl.clientWidth, 0, N - 1));
      }
    };
    let ticking = false;
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };

    const goto = (i) => {
      i = clamp(i, 0, N - 1);
      const behavior = reduced() ? 'auto' : 'smooth';
      if (pinned) {
        const top = root.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + pinnedRange() * (i / (N - 1)), behavior });
      } else {
        trackEl.scrollTo({ left: i * trackEl.clientWidth, behavior });
      }
    };

    const setMode = () => {
      pinned = pinnedQuery.matches && !reduced();
      root.classList.toggle('is-pinned', pinned);
      root.style.setProperty('--n', N);
      trackEl.style.transform = '';
      scenes.forEach((sc) => { sc.removeAttribute('inert'); sc.style.removeProperty('--px'); });
      root.querySelectorAll('.c-snap').forEach((m) => m.remove());
      if (pinned) {
        // 原生 scroll snap（proximity）：停在場景附近時對齊，不強制
        for (let i = 0; i < N; i++) {
          const m = document.createElement('div');
          m.className = 'c-snap';
          m.style.top = `calc((100% - 100vh) * ${i / (N - 1)})`;
          root.appendChild(m);
        }
      }
      current = -1;
      onScroll();
    };

    addEventListener('scroll', schedule, { passive: true });
    trackEl.addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    pinnedQuery.addEventListener('change', setMode);

    root.addEventListener('click', (ev) => {
      const g = ev.target.closest('[data-goto]');
      const st = ev.target.closest('[data-step]');
      if (g) goto(+g.dataset.goto);
      if (st) goto(Math.round(x) + +st.dataset.step);
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.target.closest('input, textarea, [role="tab"], [data-reel-track]')) return;
      const r = root.getBoundingClientRect();
      if (r.top > innerHeight * 0.5 || r.bottom < innerHeight * 0.5) return;
      if (ev.key === 'ArrowRight') { ev.preventDefault(); goto(Math.round(x) + 1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); goto(Math.round(x) - 1); }
    });

    /* 桌機：在場景上橫向拖曳，換算成捲動位置（水膜區塊保留給刮除） */
    let drag = null;
    trackEl.addEventListener('pointerdown', (ev) => {
      if (!pinned || ev.pointerType !== 'mouse' || ev.target.closest('[data-film], a, button')) return;
      drag = { x: ev.clientX, y: scrollY, moved: false };
      trackEl.setPointerCapture(ev.pointerId);
    });
    trackEl.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 4) { drag.moved = true; trackEl.classList.add('is-dragging'); }
      scrollTo({ top: drag.y - dx * pinnedRange() / ((N - 1) * innerWidth), behavior: 'auto' });
    });
    const endDrag = () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      trackEl.classList.remove('is-dragging');
      if (moved) goto(Math.round(x));
    };
    trackEl.addEventListener('pointerup', endDrag);
    trackEl.addEventListener('pointercancel', endDrag);

    setMode();
  }

  /* ---------- 水膜 ---------- */
  function initFilm() {
    const el = document.querySelector('[data-film]');
    if (!el) return;
    const hint = document.querySelector('[data-film-hint]');
    const resetBtn = document.querySelector('[data-film-reset]');
    const script = document.querySelector('script[src*="/assets/site.js"]');
    const url = script.src.replace('/site.js', '/film.module.js');
    const start = () => import(url).then((m) => m.init(el, {
      reduced: reduced(), low, track,
      onState(state) {
        if (state === 'error') { hint.textContent = '水膜效果無法載入，已顯示現場照片。'; el.style.cursor = 'auto'; }
        if (state === 'wiping' || state === 'cleared') resetBtn.hidden = false;
        if (state === 'cleared') hint.textContent = '水膜已刮除。照片為現場紀錄。';
        if (state === 'reset') hint.textContent = '在照片上拖曳，刮除玻璃上的水膜。';
      },
    })).then((api) => {
      if (api) resetBtn.addEventListener('click', () => api.reset());
    }).catch(() => { hint.textContent = '水膜效果無法載入，已顯示現場照片。'; });
    // 等首屏照片顯示後才載入效果，避免影響 LCP
    const img = el.querySelector('img');
    if (img.complete) setTimeout(start, 120); else img.addEventListener('load', () => setTimeout(start, 120), { once: true });
  }

  /* ---------- 膠卷：拖曳、按鈕與鍵盤 ---------- */
  function initReel(reel) {
    const t = reel.querySelector('[data-reel-track]');
    const n = reel.querySelector('[data-reel-n]');
    const prev = reel.querySelector('[data-reel-prev]');
    const next = reel.querySelector('[data-reel-next]');
    const items = () => [...t.children].filter((li) => !li.hidden);
    const index = () => {
      const list = items();
      const left = t.scrollLeft;
      let best = 0, bd = Infinity;
      list.forEach((li, i) => { const d = Math.abs(li.offsetLeft - t.offsetLeft - left - parseFloat(getComputedStyle(t).paddingLeft)); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const update = () => {
      const list = items(), i = index();
      n.textContent = list.length ? i + 1 : 0;
      prev.disabled = t.scrollLeft < 4;
      next.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
    };
    const go = (d) => {
      const list = items();
      const i = clamp(index() + d, 0, list.length - 1);
      const pad = parseFloat(getComputedStyle(t).paddingLeft);
      t.scrollTo({ left: list[i].offsetLeft - t.offsetLeft - pad, behavior: reduced() ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    t.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); }
    });
    let ticking = false;
    t.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
    let drag = null;
    t.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      drag = { x: ev.clientX, left: t.scrollLeft, moved: false };
    });
    addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = ev.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; t.classList.add('is-dragging'); }
      if (drag.moved) t.scrollLeft = drag.left - dx;
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      if (moved) { t.classList.remove('is-dragging'); go(0); track('reel_drag'); }
    });
    t.addEventListener('dragstart', (ev) => ev.preventDefault());
    const host = reel.closest('[id]');
    if (host) host.addEventListener('oc:filter', () => { t.scrollLeft = 0; update(); });
    update();
  }

  /* ---------- 接近方式：分頁與示意圖 ---------- */
  function initAccess(box) {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const groups = [...box.querySelectorAll('.c-dg')];
    const select = (mode, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.mode === mode;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      groups.forEach((g) => g.classList.toggle('is-on', g.dataset.mode === mode));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { select(t.dataset.mode); track('access_mode', { mode: t.dataset.mode }); });
      t.addEventListener('keydown', (ev) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
        if (d) { ev.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length].dataset.mode, true); }
      });
    });
    groups.forEach((g) => g.addEventListener('click', () => select(g.dataset.mode)));
    select(tabs[0].dataset.mode);
  }

  /* ---------- 閱讀進度 ---------- */
  function initProgress() {
    const bar = document.querySelector('[data-progress]');
    const body = document.querySelector('.c-prose');
    if (!bar || !body) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = body.getBoundingClientRect();
      bar.style.width = (clamp((innerHeight * 0.4 - r.top) / r.height, 0, 1) * 100).toFixed(1) + '%';
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  onReady(() => {
    initMenu();
    initDescent();
    initFilm();
    document.querySelectorAll('[data-reel]').forEach(initReel);
    document.querySelectorAll('[data-access]').forEach(initAccess);
    initProgress();
  });
})();
