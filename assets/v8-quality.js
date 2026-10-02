'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const scenes = [
    ['外牆清洗', '先確認玻璃、磁磚或金屬表面的材質與污染，再選擇清潔方式。', '清洗'],
    ['外牆修繕', '記錄空鼓、剝落與裂縫位置，依範圍評估修補與施工方式。', '修繕'],
    ['防水工程', '整理漏水時間、接縫與基面狀況，不先假定表面就是唯一水路。', '防水'],
    ['高空檢查', '接近不易抵達的位置，記錄外牆狀況與需要處理的範圍。', '檢查'],
    ['實際施工紀錄', '森聯摩天41的玻璃清洗紀錄；工程案例中可閱讀施工內容。', '現場']
  ];
  const range = $('#scrub');
  const visual = $('#visual');
  const photo = $('#field-photo');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let value = 0;
  let lastScene = -1;

  function loadMedia(box, retry = false) {
    const image = box.querySelector('img');
    if (!image || (!retry && box.dataset.state)) return;
    const status = box.querySelector('.media-status');
    const button = box.querySelector('.retry');
    box.dataset.state = 'loading';
    status.hidden = false;
    status.textContent = '影像載入中';
    button.hidden = true;
    image.onload = () => { box.dataset.state = 'ready'; status.hidden = true; button.hidden = true; };
    image.onerror = () => { box.dataset.state = 'error'; status.textContent = '影像暫時無法載入，施工紀錄仍可開啟。'; button.hidden = false; };
    image.src = image.dataset.src + (retry ? '?retry=' + Date.now() : '');
    button.onclick = () => loadMedia(box, true);
  }

  function setValue(next) {
    value = Math.max(0, Math.min(100, Number(next) || 0));
    range.value = String(value);
    visual.style.setProperty('--progress', String(value / 100));
    const index = Math.min(4, Math.floor(value / 20));
    visual.dataset.scene = String(index);
    photo.hidden = index !== 4;
    if (index === 4) loadMedia(photo);
    if (index !== lastScene) {
      lastScene = index;
      $('#scene-title').textContent = scenes[index][0];
      $('#scene-description').textContent = scenes[index][1];
      $('#scrub-output').textContent = scenes[index][2];
      range.setAttribute('aria-valuetext', scenes[index][0]);
      $$('[data-stage]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === index)));
      $('#visual-caption').textContent = index === 4 ? '森聯摩天41 · 玻璃清洗施工紀錄' : '拖曳繩索滑桿，或點選工程項目。';
    }
  }
  range.addEventListener('input', () => setValue(range.value));
  $$('[data-stage]').forEach((button) => button.addEventListener('click', () => setValue(Number(button.dataset.stage) * 20 + 5)));
  // Only the visual area handles wheel input. Browser zoom and other page scrolling remain native.
  visual.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? visual.clientHeight : 1);
    const next = Math.max(0, Math.min(100, value + delta * .09));
    if (next !== value) { event.preventDefault(); setValue(next); }
  }, { passive: false });

  const dialogs = ['services', 'projects', 'journal'].map((id) => document.getElementById(id));
  let active = null;
  let trigger = null;
  const validName = () => {
    const name = location.hash.slice(1);
    return dialogs.some((dialog) => dialog.id === name) ? name : null;
  };
  function syncPanel() {
    const name = validName();
    if (active && active.id !== name) { active.close(); active = null; if (trigger?.isConnected) trigger.focus({ preventScroll: true }); }
    if (name && (!active || active.id !== name)) {
      active = document.getElementById(name);
      active.showModal();
      active.querySelector('.close').focus({ preventScroll: true });
      active.querySelectorAll('.media').forEach((box) => loadMedia(box));
    }
  }
  $$('[data-panel]').forEach((button) => button.addEventListener('click', () => {
    trigger = button;
    history.pushState({ ocPanel: button.dataset.panel }, '', '#' + button.dataset.panel);
    syncPanel();
  }));
  function requestClose() {
    if (history.state?.ocPanel) history.back();
    else { history.replaceState(null, '', location.pathname + location.search); syncPanel(); }
  }
  dialogs.forEach((dialog) => {
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const stops = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter((element) => element.getClientRects().length && !element.closest('[hidden]'));
      const first = stops[0], last = stops[stops.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.querySelector('.close').addEventListener('click', requestClose);
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); requestClose(); });
  });
  addEventListener('popstate', syncPanel);
  addEventListener('hashchange', syncPanel);
  const rail = $('#project-rail');
  function moveGallery(direction) {
    rail.scrollBy({ left: direction * (rail.querySelector('.project-card').getBoundingClientRect().width + 30), behavior: reduce.matches ? 'instant' : 'smooth' });
  }
  $$('[data-direction]').forEach((button) => button.addEventListener('click', () => moveGallery(Number(button.dataset.direction))));
  rail.addEventListener('keydown', (event) => {
    if (event.target !== rail) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1); }
  });
  setValue(0);
  syncPanel();
})();
