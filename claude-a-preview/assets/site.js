/* 東方繩洗 概念原型｜共用漸進增強
 * - 效能分級與 Reduced Motion
 * - 圖片載入失敗提示
 * - Before / After 比較
 * - 詢價訊息組成（LINE / Email）
 * - 清單篩選
 * 所有內容在沒有 JavaScript 時仍可閱讀。
 */
(() => {
  const root = document.documentElement;
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const conn = navigator.connection || {};
  const low = !!(conn.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
  if (/[?&]motion=off/.test(location.search)) root.dataset.motion = 'reduced';

  const OC = window.OC = {
    low,
    reduced: () => reduceQuery.matches || root.dataset.motion === 'reduced',
    track(name, detail = {}) {
      (window.dataLayer = window.dataLayer || []).push({ event: 'oc_' + name, ...detail });
    },
    onReady(fn) {
      if (document.readyState !== 'loading') fn();
      else document.addEventListener('DOMContentLoaded', fn, { once: true });
    },
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
  };
  root.dataset.tier = low ? 'low' : 'high';

  /* ---------- 圖片載入失敗 ---------- */
  function replaceBroken(img) {
    if (img.dataset.failed) return;
    img.dataset.failed = '1';
    const box = document.createElement('div');
    box.className = 'oc-missing oc-missing--failed ' + (img.className || '');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', (img.alt || '圖片') + '：圖片載入失敗');
    const label = document.createElement('span');
    label.textContent = img.alt || '圖片';
    const note = document.createElement('small');
    note.textContent = '圖片載入失敗，請重新整理';
    box.append(label, note);
    const w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w && h) box.style.aspectRatio = w + '/' + h;
    img.replaceWith(box);
  }
  document.addEventListener('error', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLImageElement && t.hasAttribute('data-oc-img')) replaceBroken(t);
  }, true);

  /* ---------- Before / After ---------- */
  function initBA(el) {
    const range = el.querySelector('[data-ba-range]');
    const stage = el.querySelector('.oc-ba__stage');
    if (!range || !stage) return;
    const set = (v) => { el.style.setProperty('--ba', v + '%'); range.value = Math.round(v); };
    range.addEventListener('input', () => set(+range.value));
    let dragging = false;
    const move = (ev) => {
      const r = stage.getBoundingClientRect();
      set(OC.clamp((ev.clientX - r.left) / r.width * 100, 0, 100));
    };
    stage.addEventListener('pointerdown', (ev) => {
      dragging = true; stage.setPointerCapture(ev.pointerId); move(ev); OC.track('before_after');
    });
    stage.addEventListener('pointermove', (ev) => { if (dragging) move(ev); });
    const stop = () => { dragging = false; };
    stage.addEventListener('pointerup', stop);
    stage.addEventListener('pointercancel', stop);
    stage.addEventListener('dragstart', (ev) => ev.preventDefault());
    set(50);
    el.classList.add('is-ready');
  }

  /* ---------- 詢價訊息 ---------- */
  function initInquiry(form) {
    const preview = form.querySelector('[data-inquiry-preview]');
    const mail = form.querySelector('[data-inquiry-mail]');
    const lineBtn = form.querySelector('[data-inquiry-line]');
    const mailBase = mail ? mail.getAttribute('href') : '';
    const compose = () => {
      const fd = new FormData(form);
      const v = (k) => String(fd.get(k) || '').trim();
      const needs = fd.getAll('need');
      return [
        '東方繩洗 工程詢問',
        needs.length ? '需求：' + needs.join('、') : '',
        v('type') ? '建築類型：' + v('type') : '',
        v('place') ? '案場地區：' + v('place') : '',
        v('floors') ? '樓層數：' + v('floors') : '',
        v('note') ? '現況：' + v('note') : '',
        v('name') ? '聯絡人：' + v('name') : '',
        v('tel') ? '電話：' + v('tel') : '',
      ].filter(Boolean).join('\n');
    };
    const update = () => {
      const text = compose();
      preview.textContent = text;
      if (mail) {
        const place = String(new FormData(form).get('place') || '').trim();
        mail.href = mailBase + '?subject=' + encodeURIComponent('工程詢問' + (place ? '｜' + place : '')) +
          '&body=' + encodeURIComponent(text + '\n\n（現況照片可附在信件中）');
      }
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();
    if (lineBtn) lineBtn.addEventListener('click', async () => {
      const text = compose();
      let copied = false;
      try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* 權限不足時仍開啟 LINE */ }
      lineBtn.dataset.state = copied ? 'copied' : 'open';
      lineBtn.textContent = copied ? '已複製，於 LINE 對話貼上即可' : '已開啟 LINE';
      OC.track('inquiry_line');
      window.open('https://line.me/R/oaMessage/@oriental_clean/?' + encodeURIComponent(text), '_blank', 'noopener');
    });
    if (mail) mail.addEventListener('click', () => OC.track('inquiry_mail'));
  }

  /* ---------- 清單篩選 ---------- */
  function initFilter(group) {
    const target = document.querySelector(group.dataset.filterFor);
    if (!target) return;
    const count = group.dataset.filterCount ? document.querySelector(group.dataset.filterCount) : null;
    const items = [...target.querySelectorAll('[data-tags]')];
    const apply = (key) => {
      let n = 0;
      for (const it of items) {
        const show = key === '*' || it.dataset.tags.split(' ').includes(key);
        it.hidden = !show;
        if (show) n++;
      }
      if (count) count.textContent = n;
      group.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
      target.dispatchEvent(new CustomEvent('oc:filter', { detail: { key } }));
    };
    group.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-filter]');
      if (b) { apply(b.dataset.filter); OC.track('filter', { key: b.dataset.filter }); }
    });
    group.hidden = false;
  }

  OC.onReady(() => {
    document.querySelectorAll('img[data-oc-img]').forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) replaceBroken(img);
    });
    document.querySelectorAll('[data-ba]').forEach(initBA);
    document.querySelectorAll('[data-inquiry]').forEach(initInquiry);
    document.querySelectorAll('[data-filter-for]').forEach(initFilter);
    document.querySelectorAll('[data-track]').forEach((a) => a.addEventListener('click', () => OC.track(a.dataset.track)));
  });
})();

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
