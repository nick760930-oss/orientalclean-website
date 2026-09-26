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
