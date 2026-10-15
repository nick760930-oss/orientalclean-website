// 繪製：背景視差、地形、角色（Q 版比例 + 描邊 + 漸層光影）、怪物、特效
'use strict';

const ART = (() => {
  const OUT = '#2b1d3a';

  const THEMES = {
    dawn: {
      sky: ['#6cc4ff', '#ffe6b8'], sun: '#fff1b8', stars: false,
      far: '#a9d8c0', farDk: '#8cc7ae', near: '#7bbf6a', nearDk: '#5ea252',
      plat: '#a8834f', platTop: '#7cc45a', dirt: '#7a5a3e', ground: '#8f6b48',
    },
    forest: {
      sky: ['#3f8f7d', '#d6f5b2'], sun: '#fff7d1', stars: false,
      far: '#2c6a5a', farDk: '#24594c', near: '#1f5a48', nearDk: '#17463a',
      plat: '#7a5a3c', platTop: '#5fb84f', dirt: '#5b4029', ground: '#6d4c30',
    },
    cloud: {
      sky: ['#4a9dff', '#ffd3ec'], sun: '#fff8e6', stars: false,
      far: '#b7c9ff', farDk: '#9fb4f2', near: '#eef4ff', nearDk: '#d6e4ff',
      plat: '#7fd6d0', platTop: '#f6fbff', dirt: '#5e9fb0', ground: '#8fdcd7',
    },
    ruins: {
      sky: ['#1d1438', '#7a3f8f'], sun: '#f6d9ff', stars: true,
      far: '#3b2a66', farDk: '#2f2254', near: '#2a1f48', nearDk: '#21183a',
      plat: '#5a4a7a', platTop: '#b58cff', dirt: '#3c2f5c', ground: '#4d3d70',
    },
  };

  // 穩定的偽隨機（同一索引每次結果相同）
  function rnd(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  const mod = (a, n) => ((a % n) + n) % n;

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  }

  function fillOutline(c, fill, lw = 2) {
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = lw;
    c.strokeStyle = OUT;
    c.stroke();
  }

  // ---------- 背景 ----------
  function ridge(c, off, baseY, amp, freq, color) {
    c.beginPath();
    c.moveTo(0, 720);
    for (let x = -40; x <= 1320; x += 20) {
      const xx = x + off;
      const y = baseY + amp * (Math.sin(xx * freq) * 0.6 + Math.sin(xx * freq * 2.3 + 1.3) * 0.4);
      c.lineTo(x, y);
    }
    c.lineTo(1320, 720);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  function cloudBlob(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, 26 * s, 0, Math.PI * 2);
    c.arc(x + 28 * s, y - 10 * s, 34 * s, 0, Math.PI * 2);
    c.arc(x + 62 * s, y, 24 * s, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 26 * s, y, 112 * s, 24 * s);
  }

  function drawBackground(c, themeKey, camX, t) {
    const T = THEMES[themeKey] || THEMES.dawn;
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, T.sky[0]);
    g.addColorStop(1, T.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);

    if (T.stars) {
      for (let i = 0; i < 90; i++) {
        const x = mod(rnd(i) * 1280 - camX * 0.03, 1280);
        const y = rnd(i + 0.5) * 380;
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
        c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * tw})`;
        c.fillRect(x, y, 2, 2);
      }
    }

    // 太陽 / 月亮光暈（視差很慢）
    const sx = 980 - camX * 0.02;
    const sg = c.createRadialGradient(sx, 130, 10, sx, 130, 170);
    sg.addColorStop(0, T.sun);
    sg.addColorStop(0.25, 'rgba(255,255,230,0.55)');
    sg.addColorStop(1, 'rgba(255,255,230,0)');
    c.fillStyle = sg;
    c.fillRect(sx - 180, 0, 360, 320);
    c.fillStyle = T.sun;
    c.beginPath();
    c.arc(sx, 130, 38, 0, Math.PI * 2);
    c.fill();

    // 雲
    for (let i = 0; i < 7; i++) {
      const x = mod(i * 330 + 120 - camX * 0.12, 1700) - 200;
      cloudBlob(c, x, 70 + (i % 3) * 66, 0.8 + (i % 2) * 0.3, 'rgba(255,255,255,0.75)');
    }

    ridge(c, -camX * 0.2, 430, 40, 0.009, T.far);
    ridge(c, -camX * 0.35, 480, 30, 0.014, T.farDk);

    if (themeKey === 'forest') {
      for (let i = 0; i < 14; i++) {
        const x = mod(i * 150 - camX * 0.6, 1950) - 120;
        const h = 150 + rnd(i) * 90;
        c.fillStyle = T.nearDk;
        c.fillRect(x - 6, 720 - h * 0.7, 12, h * 0.7);
        c.beginPath();
        c.arc(x, 720 - h * 0.7, 46 + rnd(i + 3) * 20, 0, Math.PI * 2);
        c.fill();
      }
    }
    ridge(c, -camX * 0.55, 560, 26, 0.02, T.near);
    if (themeKey === 'cloud') {
      for (let i = 0; i < 5; i++) {
        const x = mod(i * 420 - camX * 0.5, 2000) - 200;
        cloudBlob(c, x, 600, 1.4, 'rgba(255,255,255,0.8)');
      }
    }
    ridge(c, -camX * 0.8, 620, 14, 0.03, T.nearDk);
  }

  // ---------- 地形 ----------
  function drawSurface(c, s, themeKey) {
    const T = THEMES[themeKey] || THEMES.dawn;
    const body = s.ground ? 90 : 30;
    const g = c.createLinearGradient(0, s.y, 0, s.y + body);
    g.addColorStop(0, s.ground ? T.ground : T.plat);
    g.addColorStop(1, T.dirt);
    rr(c, s.x, s.y + 8, s.w, body, 12);
    fillOutline(c, g);

    // 草皮（波浪頂）
    c.beginPath();
    c.moveTo(s.x, s.y + 12);
    for (let x = s.x; x <= s.x + s.w; x += 12) {
      const bump = (Math.floor((x - s.x) / 12) % 2 === 0) ? -3 : 0;
      c.lineTo(x, s.y + 8 + bump);
    }
    c.lineTo(s.x + s.w, s.y + 14);
    c.lineTo(s.x, s.y + 14);
    c.closePath();
    fillOutline(c, T.platTop, 2);

    // 小花與石頭
    for (let x = s.x + 10; x < s.x + s.w - 8; x += 18) {
      const r = rnd(x * 0.37 + s.y);
      if (r > 0.6) {
        c.fillStyle = r > 0.8 ? '#ffd1e6' : '#fff2a6';
        c.beginPath();
        c.arc(x, s.y + 6, 2.6, 0, Math.PI * 2);
        c.fill();
      }
      if (r < 0.2) {
        c.fillStyle = 'rgba(0,0,0,0.18)';
        c.beginPath();
        c.ellipse(x + 3, s.y + 40 + (r * 60) % 20, 5, 3, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  function drawRope(c, r, t) {
    c.save();
    c.strokeStyle = '#8a5a2b';
    c.lineWidth = 4;
    c.setLineDash([8, 5]);
    c.lineDashOffset = -t * 30;
    c.beginPath();
    c.moveTo(r.x, r.top);
    c.lineTo(r.x, r.bottom);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = '#e8c58f';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(r.x + 1.5, r.top);
    c.lineTo(r.x + 1.5, r.bottom);
    c.stroke();
    c.fillStyle = '#c7955a';
    c.beginPath();
    c.arc(r.x, r.top, 5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawPortal(c, pt, t, locked) {
    const x = pt.x, y = 600 - 46;
    c.save();
    // 底座
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(x, 602, 34, 8, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(x, y, 4, x, y, 40);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, locked ? '#8a8fb3' : '#7fe7ff');
    g.addColorStop(0.75, locked ? '#4d5277' : '#5b6fff');
    g.addColorStop(1, 'rgba(91,111,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, 30, 44, 0, 0, Math.PI * 2);
    c.fill();
    // 旋轉的光點
    for (let i = 0; i < 8; i++) {
      const a = t * 2.4 + i * (Math.PI / 4);
      c.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 6 + i)})`;
      c.beginPath();
      c.arc(x + Math.cos(a) * 24, y + Math.sin(a) * 34, 2.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function drawNameTag(c, text, x, y, color) {
    c.save();
    c.font = 'bold 13px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
    c.textAlign = 'center';
    const w = c.measureText(text).width + 16;
    c.fillStyle = 'rgba(20,12,40,0.7)';
    rr(c, x - w / 2, y - 14, w, 19, 9);
    c.fill();
    c.fillStyle = color || '#fff';
    c.fillText(text, x, y);
    c.restore();
  }

  // ---------- 共用：顏色、漸層快取、光暈貼圖 ----------
  const TAU = Math.PI * 2;
  const _shade = new Map();
  // f < 0：往描邊紫黑色混；f > 0：往白色混
  function shade(hex, f) {
    const k = hex + '|' + f;
    let v = _shade.get(k);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) {
      const a = -f;
      r += (0x2b - r) * a; g += (0x1d - g) * a; b += (0x3a - b) * a;
    } else {
      r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f;
    }
    v = `rgb(${r | 0},${g | 0},${b | 0})`;
    _shade.set(k, v);
    return v;
  }
  const _rgb = new Map();
  function toRGB(col) {
    if (col[0] !== '#') return col;
    let v = _rgb.get(col);
    if (!v) {
      const n = parseInt(col.slice(1), 16);
      v = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
      _rgb.set(col, v);
    }
    return v;
  }

  // 漸層以「區域座標」建立後快取，每幀重用（避免每幀 createGradient）
  const GC = new Map();
  function lin(c, key, x0, y0, x1, y1, stops) {
    let g = GC.get(key);
    if (!g) {
      g = c.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      GC.set(key, g);
    }
    return g;
  }
  function rad(c, key, x0, y0, r0, x1, y1, r1, stops) {
    let g = GC.get(key);
    if (!g) {
      g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);
      for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      GC.set(key, g);
    }
    return g;
  }

  // 光暈：預先畫好的離屏貼圖，以 drawImage 縮放使用
  const GLOW = new Map();
  function glowSprite(rgb) {
    let cv = GLOW.get(rgb);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, `rgba(${rgb},0.95)`);
      gr.addColorStop(0.3, `rgba(${rgb},0.5)`);
      gr.addColorStop(0.65, `rgba(${rgb},0.16)`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      GLOW.set(rgb, cv);
    }
    return cv;
  }
  function drawGlow(c, x, y, r, col, alpha) {
    const a = c.globalAlpha;
    c.globalAlpha = a * alpha;
    c.drawImage(glowSprite(toRGB(col)), x - r, y - r, r * 2, r * 2);
    c.globalAlpha = a;
  }

  function starPath(c, x, y, ro, ri, n, rot) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n - Math.PI / 2;
      const r = i % 2 === 0 ? ro : ri;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
  }

  function sparkle(c, x, y, s, alpha) {
    c.fillStyle = `rgba(255,255,255,${alpha})`;
    c.beginPath();
    c.moveTo(x, y - s);
    c.quadraticCurveTo(x, y, x + s, y);
    c.quadraticCurveTo(x, y, x, y + s);
    c.quadraticCurveTo(x, y, x - s, y);
    c.quadraticCurveTo(x, y, x, y - s);
    c.fill();
  }

  // ---------- Q 版角色 ----------
  function limb(c, px, py, len, ang, w, col, cb) {
    c.save();
    c.translate(px, py);
    c.rotate(ang);
    rr(c, -w / 2, 0, w, len, w / 2);
    fillOutline(c, col, 1.8);
    if (cb) cb(c, len);
    c.restore();
  }

  function boot(c, len, col, w) {
    // 鞋尖朝前（+x）
    rr(c, -w / 2 - 1, len - 5, w + 4, 7.5, [3, 4, 3, 2.5]);
    fillOutline(c, col, 1.5);
    c.fillStyle = shade(col, 0.28);
    c.fillRect(-w / 2 - 0.2, len - 4.2, w + 2.4, 1.6);
  }

  // 手臂：袖子 → 武器（手下）→ 手 → 武器（手上）
  function arm(c, px, py, ang, col, P, under, over) {
    c.save();
    c.translate(px, py);
    c.rotate(ang);
    rr(c, -3.3, -1.5, 6.6, 14, 3.3);
    fillOutline(c, col, 1.7);
    c.fillStyle = shade(col, -0.22);
    c.fillRect(-3.3, 9, 6.6, 1.6);
    if (under) under(c);
    c.beginPath();
    c.arc(0, 13.5, 3.1, 0, TAU);
    fillOutline(c, P.skin, 1.4);
    if (over) over(c);
    c.restore();
  }

  // 眼睛：mode = open | blink | hurt | happy；side = -1 後眼 / 1 前眼
  function eye(c, x, y, P, mode, side) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = OUT;
    c.lineCap = 'round';
    if (mode === 'hurt') {
      c.lineWidth = 1.8;
      const s = -side;
      c.beginPath();
      c.moveTo(-2.6 * s, -2.8); c.lineTo(2.4 * s, 0); c.lineTo(-2.6 * s, 2.8);
      c.stroke();
    } else if (mode === 'blink') {
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, -1.5, 3.4, 0.2 * Math.PI, 0.8 * Math.PI);
      c.stroke();
    } else if (mode === 'happy') {
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, 2.2, 3.2, 1.15 * Math.PI, 1.85 * Math.PI);
      c.stroke();
    } else {
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(0, 0, 3.5, 4.7, 0, 0, TAU);
      c.fill();
      c.fillStyle = lin(c, 'iris' + P.eye, 0, -3.4, 0, 4.4,
        [0, shade(P.eye, -0.5), 0.5, P.eye, 1, shade(P.eye, 0.5)]);
      c.beginPath();
      c.ellipse(0.5, 0.6, 2.85, 3.95, 0, 0, TAU);
      c.fill();
      c.fillStyle = shade(P.eye, -0.7);
      c.beginPath();
      c.ellipse(0.6, 0.8, 1.3, 2.0, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(-0.7, -1.5, 1.35, 0, TAU); c.fill();
      c.beginPath(); c.arc(1.5, 2.3, 0.65, 0, TAU); c.fill();
      // 上睫毛線 + 外眼角翹起
      c.lineWidth = 1.9;
      c.beginPath();
      c.ellipse(0, 0.1, 3.6, 4.8, 0, 1.08 * Math.PI, 1.94 * Math.PI);
      c.stroke();
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(3.1 * side, -2.4);
      c.lineTo(4.6 * side, -3.6);
      c.stroke();
      c.strokeStyle = 'rgba(43,29,58,0.35)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(0, 0, 3.6, 0.3 * Math.PI, 0.7 * Math.PI);
      c.stroke();
    }
    c.restore();
  }

  // 瀏海：上方圓弧 + 下緣的髮束尖端（由左到右的點）
  function bangs(c, P, pts, soft) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    c.arc(0, -1.5, 15.3, Math.PI - 0.1, 0.1);
    c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    for (let i = pts.length - 1; i >= 1; i--) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      if (soft) c.quadraticCurveTo((x + px) / 2 + 0.8, Math.max(y, py) + 1.2, px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    fillOutline(c, hairGrad(c, P), 1.6);
    // 天使光環高光
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 1.8;
    c.lineCap = 'round';
    c.beginPath(); c.arc(0, -1.5, 11.2, 1.2 * Math.PI, 1.38 * Math.PI); c.stroke();
    c.beginPath(); c.arc(0, -1.5, 11.2, 1.5 * Math.PI, 1.62 * Math.PI); c.stroke();
  }
  function hairGrad(c, P) {
    return lin(c, 'hair' + P.hair + P.hairHi, 0, -17, 0, 10,
      [0, P.hairHi, 0.45, P.hair, 1, shade(P.hair, -0.25)]);
  }

  const BANGS = {
    knight: [[-15, 5], [-12.5, -3], [-10, -6.5], [-8, -1], [-5, -6.5], [-2.5, -1.5], [0.5, -7], [3.5, -1.5], [6.5, -6.5], [9.5, -0.5], [11.5, -4], [14.5, 5]],
    mage: [[-15, 9], [-12.5, -2], [-9, -5.5], [-6.5, -1], [-3, -5.5], [0.5, -1], [4, -5.5], [7.5, -1], [10.5, -4.5], [15, 9]],
    archer: [[-15, 4], [-12, -3], [-9, -6], [-6.5, -1.5], [-3.5, -6], [-0.5, -1], [2.5, -6], [6, -2], [9, -5.5], [12, 0], [15, 3]],
    shop: [[-14.5, 2], [-11, -4], [-7.5, -2.5], [-4, -5], [-0.5, -2.5], [3, -5], [6.5, -2.5], [10, -4], [14.5, 2]],
  };

  // o: {pal, style, t, face, moving, phase, airborne, climb, atk(0..1|-1), hurt, ghost, buff, kind}
  function drawChibi(c, o) {
    const P = o.pal;
    const t = o.t;
    const st = o.style;
    const walk = !!o.moving;
    const air = !!o.airborne;
    const climbing = !!o.climb;
    const ph = o.phase || 0;
    const s = walk ? Math.sin(ph) : 0;
    const sw = s * 0.78;
    const idle = Math.sin(t * 2.6);
    // 走路時腳交錯（垂直）時身體最高，跨步最大時最低
    const by = walk ? -Math.abs(Math.cos(ph)) * 2 : air ? -1 : idle * 0.55 - 0.55;
    const hx = walk ? 0.8 : 0;
    const hy = -46 + by;
    const isRobe = st === 'mage' || st === 'elder';
    const atk = o.atk >= 0 ? o.atk : -1;
    const hurt = !!o.hurt;
    const sway = Math.sin(t * 3.1);
    const drag = walk ? 1 : air ? 0.7 : 0;
    const flow = sway * 1.2 + drag * (3 + Math.sin(ph * 2) * 1.2);

    c.save();
    c.scale(o.face || 1, 1);

    // ===== 最後層：披風、箭袋、長髮、馬尾 =====
    if (st === 'knight') {
      const fl = flow;
      c.beginPath();
      c.moveTo(-6, -33 + by);
      c.bezierCurveTo(-12 - fl * 0.4, -27 + by, -15 - fl, -14, -17.5 - fl * 1.3, -2 + (air ? -4 : 0));
      c.quadraticCurveTo(-14 - fl, 1, -11 - fl * 0.8, -2.5);
      c.quadraticCurveTo(-7 - fl * 0.5, 0.5, -3, -3.5);
      c.lineTo(3, -31 + by);
      c.closePath();
      fillOutline(c, lin(c, 'cape' + P.cape, -16, -32, -2, 0, [0, shade(P.cape, 0.15), 0.6, P.cape, 1, P.capeDk]), 1.6);
      c.strokeStyle = shade(P.capeDk, -0.2);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-5, -29 + by);
      c.quadraticCurveTo(-10 - fl * 0.6, -16, -11.5 - fl * 0.9, -3);
      c.stroke();
    }

    if (st === 'archer') {
      c.save();
      c.translate(-9, -32 + by);
      c.rotate(0.38 + sway * 0.03);
      // 箭羽
      for (const [ax, col] of [[-2, P.plume], [1.5, P.accent], [3.5, P.plume]]) {
        c.strokeStyle = '#7a4a2a';
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(ax, -8); c.lineTo(ax, -13); c.stroke();
        c.beginPath();
        c.moveTo(ax, -12); c.lineTo(ax - 1.8, -17); c.lineTo(ax, -15.5); c.lineTo(ax + 1.8, -17); c.closePath();
        fillOutline(c, col, 0.9);
      }
      rr(c, -4.5, -9, 9, 20, 3.5);
      fillOutline(c, lin(c, 'quiver', -4.5, 0, 4.5, 0, [0, '#b07840', 1, '#6e4524']), 1.4);
      c.fillStyle = P.trim;
      c.fillRect(-4.5, -7, 9, 2);
      c.fillRect(-4.5, 6, 9, 2);
      c.restore();
    }

    if (st === 'mage') {
      const hd = flow * 0.6;
      c.save();
      c.translate(hx, hy);
      c.beginPath();
      c.moveTo(14.5, -3);
      c.arc(0, -2.5, 15, 0, Math.PI, true);
      c.bezierCurveTo(-17.5, 8, -18 - hd, 20, -16.5 - hd, 30);
      c.quadraticCurveTo(-13 - hd, 27, -11 - hd * 0.8, 31);
      c.quadraticCurveTo(-7 - hd * 0.5, 26, -3, 28);
      c.quadraticCurveTo(4, 22, 9, 24);
      c.bezierCurveTo(15, 16, 16, 6, 14.5, -3);
      c.closePath();
      fillOutline(c, hairGrad(c, P), 1.6);
      c.strokeStyle = shade(P.hair, -0.18);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-12, 8); c.quadraticCurveTo(-14 - hd, 18, -12 - hd, 26);
      c.moveTo(-7, 12); c.quadraticCurveTo(-8 - hd * 0.5, 18, -6, 24);
      c.stroke();
      c.restore();
    }

    if (st === 'archer') {
      const pt = Math.sin(t * 5) * 1.5 + flow * 0.9;
      c.save();
      c.translate(hx, hy);
      c.beginPath();
      c.moveTo(-10, -11);
      c.bezierCurveTo(-22 - pt * 0.4, -12, -25 - pt, 0, -21 - pt * 1.2, 15);
      c.quadraticCurveTo(-19 - pt, 8, -15 - pt * 0.4, 9);
      c.quadraticCurveTo(-17 - pt * 0.3, 1, -11, -2);
      c.closePath();
      fillOutline(c, hairGrad(c, P), 1.5);
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-15, -8); c.quadraticCurveTo(-21 - pt * 0.6, -2, -20 - pt, 8);
      c.stroke();
      c.beginPath();
      c.ellipse(-12.5, -6, 2.6, 3.2, 0.3, 0, TAU);
      fillOutline(c, P.accent, 1.2);
      c.restore();
    }

    if (st === 'shop') {
      // 頭巾結的尾巴
      const kt = sway * 1.5;
      c.save();
      c.translate(hx, hy);
      c.beginPath();
      c.moveTo(-12, -9);
      c.quadraticCurveTo(-20, -11 + kt, -23, -6 + kt);
      c.quadraticCurveTo(-18, -6, -13, -5);
      c.quadraticCurveTo(-19, -1 - kt, -20, 4 - kt);
      c.quadraticCurveTo(-15, 0, -11, -4);
      c.closePath();
      fillOutline(c, P.accent, 1.3);
      c.restore();
    }

    // ===== 腿 =====
    let la, ra;
    if (air) { la = -0.55; ra = 0.5; }
    else if (climbing) { la = Math.sin(t * 8) * 0.35; ra = -la; }
    else { la = sw; ra = -sw; }
    limb(c, -3.5, -16, 16, la, 8, shade(P.pants, -0.15), (cc, len) => boot(cc, len, shade(P.boot, -0.1), 8));
    limb(c, 3.5, -16, 16, ra, 8, P.pants, (cc, len) => boot(cc, len, P.boot, 8));

    // ===== 手臂角度 =====
    let fa, ba;
    if (climbing) {
      fa = -2.7 + Math.sin(t * 8) * 0.25;
      ba = -2.3 - Math.sin(t * 8) * 0.25;
    } else if (st === 'archer') {
      fa = -1.47 + idle * 0.03;
      ba = atk >= 0 ? -1.5 + atk * 0.35 : -1.15 + idle * 0.04;
    } else if (atk >= 0) {
      const e = 1 - Math.pow(1 - atk, 3);
      fa = -2.4 + e * 2.8;
      ba = 0.35 - e * 0.2;
    } else {
      fa = sw * 0.85 + (st === 'knight' ? -0.32 : 0.12) + idle * 0.04;
      ba = -sw * 0.85 + 0.12 - idle * 0.04;
    }
    const sh = -30 + by;
    const backCol = shade(P.body, -0.18);

    // 法師、長老、商人：後手在身體後面
    const backFirst = !(st === 'knight' || st === 'archer');
    if (backFirst) arm(c, -8, sh, ba, backCol, P);

    // ===== 軀幹 =====
    c.save();
    c.translate(0, by);
    if (isRobe) {
      const hs = walk ? -sw * 2.2 : sway * 0.5;
      c.beginPath();
      c.moveTo(-8.5, -34);
      c.lineTo(8.5, -34);
      c.bezierCurveTo(11, -22, 14 + hs * 0.6, -10, 15.5 + hs, -2 - by);
      c.quadraticCurveTo(hs * 0.5, 3 - by, -15.5 + hs, -2 - by);
      c.bezierCurveTo(-14 + hs * 0.6, -10, -11, -22, -8.5, -34);
      c.closePath();
      fillOutline(c, lin(c, 'robe' + P.body, 0, -34, 0, 0, [0, shade(P.body, 0.18), 0.45, P.body, 1, P.bodyDk]), 1.8);
      // 下擺飾邊
      c.save();
      c.clip();
      c.strokeStyle = P.trim;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-16 + hs, -4.5 - by);
      c.quadraticCurveTo(hs * 0.5, 0.5 - by, 16 + hs, -4.5 - by);
      c.stroke();
      // 前襟
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(1.5, -28);
      c.quadraticCurveTo(2 + hs * 0.2, -14, 2 + hs * 0.5, 2 - by);
      c.stroke();
      // 布料暗面
      c.fillStyle = 'rgba(43,29,58,0.16)';
      c.beginPath();
      c.moveTo(5, -34); c.lineTo(9, -34);
      c.bezierCurveTo(11, -22, 14 + hs * 0.6, -10, 16 + hs, -2 - by);
      c.lineTo(9 + hs, -2 - by);
      c.quadraticCurveTo(9, -18, 5, -34);
      c.fill();
      c.restore();
      // 衣領
      c.beginPath();
      c.moveTo(-6.5, -34.5); c.lineTo(1.5, -27); c.lineTo(7, -34.5);
      c.closePath();
      fillOutline(c, P.trim, 1.2);
      // 腰帶
      rr(c, -10, -22.5, 20, 3.2, 1.6);
      fillOutline(c, st === 'mage' ? P.accent : '#8a5a34', 1.2);
      if (st === 'mage') {
        starPath(c, -4.5, -27, 2.6, 1.1, 5, 0);
        fillOutline(c, P.accent, 0.8);
      } else {
        c.strokeStyle = P.accent;
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(-6, -19); c.lineTo(-7, -13); c.moveTo(-4.5, -19); c.lineTo(-4.5, -12.5); c.stroke();
      }
    } else {
      rr(c, -9.5, -34, 19, 21, 7);
      fillOutline(c, lin(c, 'torso' + P.body, 0, -34, 0, -13, [0, shade(P.body, 0.3), 0.45, P.body, 1, P.bodyDk]), 1.8);
      c.fillStyle = 'rgba(43,29,58,0.14)';
      rr(c, 4, -33, 5, 19, [0, 6, 6, 0]);
      c.fill();
      if (st === 'knight') {
        // 胸甲高光 + 衣領 + 腰甲
        c.fillStyle = 'rgba(255,255,255,0.45)';
        c.beginPath(); c.ellipse(-3.5, -28, 2.4, 4, -0.3, 0, TAU); c.fill();
        c.beginPath();
        c.ellipse(0, -34, 6.5, 2.6, 0, 0, Math.PI);
        fillOutline(c, P.accent, 1.2);
        rr(c, -9, -17.5, 8.4, 5.5, 2);
        fillOutline(c, P.bodyDk, 1.4);
        rr(c, 0.6, -17.5, 8.4, 5.5, 2);
        fillOutline(c, P.bodyDk, 1.4);
        rr(c, -9.8, -21.5, 19.6, 3.8, 1.5);
        fillOutline(c, '#5a3a2a', 1.2);
        rr(c, -2.3, -22.2, 4.6, 5.2, 1.2);
        fillOutline(c, P.trim, 1);
      } else if (st === 'archer') {
        // 鋸齒下擺
        c.beginPath();
        c.moveTo(-9.5, -18);
        const zz = [[-7.5, -12], [-5, -16], [-2.5, -11.5], [0, -16], [2.5, -11.5], [5, -16], [7.5, -12], [9.5, -18]];
        for (const [x, y] of zz) c.lineTo(x, y);
        c.closePath();
        fillOutline(c, P.bodyDk, 1.3);
        // V 領
        c.beginPath();
        c.moveTo(-4, -34); c.lineTo(0.5, -28.5); c.lineTo(4.5, -34);
        c.closePath();
        fillOutline(c, P.trim, 1.1);
        // 斜背帶
        c.strokeStyle = OUT; c.lineWidth = 4.4;
        c.beginPath(); c.moveTo(-8, -33); c.lineTo(8, -19.5); c.stroke();
        c.strokeStyle = '#9a6a3a'; c.lineWidth = 2.4;
        c.stroke();
        rr(c, -9.5, -21.5, 19, 3.2, 1.5);
        fillOutline(c, '#6b4a2e', 1.1);
        rr(c, -1.8, -22, 3.6, 4.2, 1);
        fillOutline(c, P.trim, 0.9);
      } else {
        // 商人：圍裙
        rr(c, -7, -27, 14, 15.5, [2, 2, 5, 5]);
        fillOutline(c, P.trim, 1.3);
        c.strokeStyle = 'rgba(43,29,58,0.5)';
        c.lineWidth = 1;
        rr(c, -3.5, -21.5, 7, 4.5, 1.5);
        c.stroke();
        c.strokeStyle = P.trim;
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(-7, -26); c.lineTo(-4, -34); c.moveTo(7, -26); c.lineTo(4, -34); c.stroke();
        c.beginPath();
        c.moveTo(-5, -34.5); c.lineTo(0.5, -29.5); c.lineTo(6, -34.5);
        c.closePath();
        fillOutline(c, P.accent, 1.1);
      }
    }
    c.restore();

    // ===== 後手（劍士持盾 / 弓手拉弦）=====
    if (st === 'knight') {
      arm(c, -8.5, sh, ba, backCol, P, null, (cc) => {
        cc.beginPath();
        cc.moveTo(-9, 4.5);
        cc.quadraticCurveTo(0, 2, 9, 4.5);
        cc.lineTo(9, 13);
        cc.quadraticCurveTo(8, 22, 0, 26.5);
        cc.quadraticCurveTo(-8, 22, -9, 13);
        cc.closePath();
        fillOutline(cc, rad(cc, 'shield' + P.accent, -3, 8, 1, 0, 14, 16,
          [0, shade(P.accent, 0.6), 0.45, P.accent, 1, P.capeDk]), 1.8);
        cc.strokeStyle = P.trim;
        cc.lineWidth = 1.5;
        cc.beginPath();
        cc.moveTo(-6.5, 6.5);
        cc.quadraticCurveTo(0, 4.5, 6.5, 6.5);
        cc.lineTo(6.5, 13);
        cc.quadraticCurveTo(6, 20, 0, 23.5);
        cc.quadraticCurveTo(-6, 20, -6.5, 13);
        cc.closePath();
        cc.stroke();
        starPath(cc, 0, 13.5, 4, 1.7, 5, 0);
        fillOutline(cc, P.trim, 0.9);
        cc.fillStyle = 'rgba(255,255,255,0.55)';
        cc.beginPath(); cc.ellipse(-4.5, 8.5, 1.4, 2.6, 0.2, 0, TAU); cc.fill();
      });
    } else if (st === 'archer') {
      arm(c, -8.5, sh, ba, backCol, P);
    }

    // ===== 前手 + 武器 =====
    if (st === 'knight') {
      arm(c, 8.5, sh, fa, P.body, P, (cc) => {
        rr(cc, -1.5, 9, 3, 8, 1);
        fillOutline(cc, '#6b3f24', 1.1);
        cc.beginPath(); cc.arc(0, 8.6, 1.9, 0, TAU);
        fillOutline(cc, P.trim, 1);
        cc.beginPath();
        cc.moveTo(-2.6, 19.5); cc.lineTo(2.6, 19.5); cc.lineTo(2.6, 37); cc.lineTo(0, 41.5); cc.lineTo(-2.6, 37);
        cc.closePath();
        fillOutline(cc, lin(cc, 'blade', -2.6, 0, 2.6, 0, [0, '#ffffff', 0.5, '#dce8ff', 1, '#93a6cf']), 1.3);
        cc.strokeStyle = 'rgba(110,130,185,0.75)';
        cc.lineWidth = 0.9;
        cc.beginPath(); cc.moveTo(0.3, 21.5); cc.lineTo(0.3, 36); cc.stroke();
        rr(cc, -6.2, 16.5, 12.4, 3.4, 1.7);
        fillOutline(cc, P.trim, 1.2);
        cc.beginPath(); cc.arc(0, 18.2, 1.3, 0, TAU);
        cc.fillStyle = P.accent; cc.fill();
      });
      // 肩甲
      c.beginPath();
      c.ellipse(8, sh - 0.5, 5.2, 4.2, 0.2, 0, TAU);
      fillOutline(c, lin(c, 'pauld' + P.body, 0, sh - 5, 0, sh + 4, [0, shade(P.body, 0.45), 1, P.bodyDk]), 1.5);
      c.fillStyle = P.trim;
      c.beginPath(); c.arc(8, sh - 0.5, 1.2, 0, TAU); c.fill();
    } else if (st === 'archer') {
      const pull = atk >= 0 ? Math.max(0, 1 - atk * 3.5) * 7 : 0;
      arm(c, 8.5, sh, fa, P.body, P, (cc) => {
        const g = 13.5;
        cc.beginPath();
        cc.moveTo(-16.5, g - 3.5);
        cc.quadraticCurveTo(-15.5, g - 8, -12.5, g - 6.5);
        cc.quadraticCurveTo(-6, g + 3, 0, g + 2.8);
        cc.quadraticCurveTo(6, g + 3, 12.5, g - 6.5);
        cc.quadraticCurveTo(15.5, g - 8, 16.5, g - 3.5);
        cc.lineCap = 'round';
        cc.strokeStyle = OUT; cc.lineWidth = 4.6; cc.stroke();
        cc.strokeStyle = '#a8703a'; cc.lineWidth = 2.7; cc.stroke();
        cc.strokeStyle = 'rgba(255,220,160,0.6)'; cc.lineWidth = 0.9; cc.stroke();
        cc.strokeStyle = 'rgba(255,255,255,0.9)';
        cc.lineWidth = 0.9;
        cc.beginPath();
        cc.moveTo(-13, g - 6.8); cc.lineTo(0, g - 6.8 - pull); cc.lineTo(13, g - 6.8);
        cc.stroke();
        if (atk < 0) {
          // 搭在弦上的箭
          cc.strokeStyle = '#7a4a2a'; cc.lineWidth = 1.4;
          cc.beginPath(); cc.moveTo(0.8, g - 6.8); cc.lineTo(0.8, g + 9); cc.stroke();
          cc.beginPath(); cc.moveTo(0.8, g + 12); cc.lineTo(-1.6, g + 8); cc.lineTo(3.2, g + 8); cc.closePath();
          fillOutline(cc, '#e8f1ff', 0.9);
        }
      }, (cc) => {
        cc.fillStyle = P.trim;
        cc.fillRect(-2.2, 12.6, 4.4, 1.6);
      });
    } else {
      arm(c, 8.5, sh, fa, P.body, P);
    }

    // 法杖（以手的世界座標為起點，隨揮動傾斜）
    if (isRobe && !climbing) {
      const hxp = 8.5 - Math.sin(fa) * 13.5;
      const hyp = sh + Math.cos(fa) * 13.5;
      const th = 0.3 - (fa - 0.12) * 0.45;
      const ux = Math.sin(th), uy = -Math.cos(th);
      const x0 = hxp - ux * 7, y0 = hyp - uy * 7;
      const x1 = hxp + ux * 30, y1 = hyp + uy * 30;
      c.lineCap = 'round';
      c.strokeStyle = OUT; c.lineWidth = 4.8;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = st === 'elder' ? '#8a6a3a' : '#7a4a2a'; c.lineWidth = 3;
      c.stroke();
      c.strokeStyle = 'rgba(255,220,170,0.5)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x0 - 0.6, y0); c.lineTo(x1 - 0.6, y1); c.stroke();
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      const ox = x1 + ux * 4, oy = y1 + uy * 4;
      if (st === 'mage') {
        drawGlow(c, ox, oy, 14 + pulse * 3, '#e1a8ff', 0.75);
        c.strokeStyle = OUT; c.lineWidth = 3.6;
        c.beginPath(); c.arc(ox, oy, 5.5, 0.6 * Math.PI, 2.4 * Math.PI); c.stroke();
        c.strokeStyle = P.accent; c.lineWidth = 2;
        c.stroke();
        c.save();
        c.translate(ox, oy);
        c.rotate(t * 1.5);
        c.beginPath();
        c.moveTo(0, -4.5); c.lineTo(3, 0); c.lineTo(0, 4.5); c.lineTo(-3, 0);
        c.closePath();
        fillOutline(c, '#f4dcff', 1.1);
        c.restore();
        sparkle(c, ox + 7, oy - 6, 2 + pulse * 1.5, 0.6 + 0.4 * pulse);
      } else {
        drawGlow(c, ox, oy, 13 + pulse * 3, '#9ff3ff', 0.7);
        c.beginPath();
        c.ellipse(x1, y1 + 1, 3.6, 2.6, 0, 0, TAU);
        fillOutline(c, '#8a6a3a', 1.2);
        c.beginPath();
        c.arc(ox, oy, 4.2, 0, TAU);
        fillOutline(c, rad(c, 'elderorb', -1.5, -1.5, 0.5, 0, 0, 4.5, [0, '#ffffff', 0.5, '#9ff3ff', 1, '#3aa6c8']), 1.2);
        c.beginPath();
        c.moveTo(x1 - 1, y1 + 2);
        c.quadraticCurveTo(x1 - 8, y1 - 1, x1 - 7, y1 - 6);
        c.quadraticCurveTo(x1 - 3, y1 - 4, x1 - 1, y1 + 2);
        fillOutline(c, '#7cc45a', 1);
      }
      // 手握在杖上
      c.beginPath();
      c.arc(hxp, hyp, 3.1, 0, TAU);
      fillOutline(c, P.skin, 1.4);
    }

    // ===== 頭 =====
    const blink = (t % 3.4) < 0.12;
    c.save();
    c.translate(hx, hy);
    c.rotate(walk ? s * 0.035 : idle * 0.025);

    // 後腦頭髮
    if (st === 'elder') {
      for (const ex of [-12.5, 12.5]) {
        c.beginPath();
        c.ellipse(ex, 0, 4.2, 6.2, ex < 0 ? 0.25 : -0.25, 0, TAU);
        fillOutline(c, P.hair, 1.4);
      }
      c.beginPath();
      c.arc(-1, -14.5, 4, 0, TAU);
      fillOutline(c, P.hair, 1.4);
    } else {
      c.beginPath();
      c.arc(-0.5, -2, 15.6, 0, TAU);
      fillOutline(c, hairGrad(c, P), 1.6);
    }

    // 臉
    c.beginPath();
    c.arc(0, 0, 14, 0, TAU);
    fillOutline(c, rad(c, 'skin' + P.skin, -4, -5, 1, 0, 0, 15,
      [0, shade(P.skin, 0.4), 0.5, P.skin, 1, P.skinDk]), 1.8);

    // 頭髮 / 帽子
    if (st === 'knight') {
      bangs(c, P, BANGS.knight, false);
      // 額環
      c.strokeStyle = OUT; c.lineWidth = 3.6;
      c.beginPath(); c.arc(0, -1, 13.8, 1.13 * Math.PI, 1.87 * Math.PI); c.stroke();
      c.strokeStyle = P.trim; c.lineWidth = 2;
      c.stroke();
      c.beginPath();
      c.moveTo(0.5, -18.5); c.lineTo(3, -15); c.lineTo(0.5, -11.5); c.lineTo(-2, -15);
      c.closePath();
      fillOutline(c, P.accent, 1);
      // 羽飾
      const pw = Math.sin(t * 4) * 1.6 + flow * 0.4;
      c.beginPath();
      c.moveTo(-8, -12);
      c.bezierCurveTo(-11, -21 + pw * 0.5, -18, -23 + pw, -22 - pw * 0.5, -17 + pw);
      c.quadraticCurveTo(-16, -16 + pw * 0.5, -10, -8);
      c.closePath();
      fillOutline(c, lin(c, 'plume' + P.plume, -26, -20, -8, -12, [0, shade(P.plume, 0.4), 1, P.plume]), 1.3);
      c.strokeStyle = shade(P.plume, -0.25);
      c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(-9, -10.5); c.quadraticCurveTo(-14, -17 + pw * 0.7, -20.5, -17.5 + pw); c.stroke();
    } else if (st === 'mage') {
      bangs(c, P, BANGS.mage, true);
      // 側邊髮束
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.moveTo(13.5 * sx, -4);
        c.quadraticCurveTo(15.5 * sx, 6, 13 * sx, 14);
        c.quadraticCurveTo(11 * sx, 8, 10 * sx, 0);
        c.closePath();
        fillOutline(c, hairGrad(c, P), 1.2);
      }
    } else if (st === 'archer') {
      bangs(c, P, BANGS.archer, true);
    } else if (st === 'shop') {
      bangs(c, P, BANGS.shop, true);
    } else if (st === 'elder') {
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.ellipse(-5, -8.5, 4, 2.4, -0.5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(43,29,58,0.3)';
      c.lineWidth = 0.9;
      c.beginPath(); c.arc(0.5, -2, 9, 1.35 * Math.PI, 1.65 * Math.PI); c.stroke();
    }

    // 眼睛
    const face = 0.8;
    let mode = 'open';
    if (hurt) mode = 'hurt';
    else if (st === 'elder') mode = 'happy';
    else if (blink) mode = 'blink';
    eye(c, -4.8 + face, 1.5, P, mode, -1);
    eye(c, 5.2 + face, 1.5, P, mode, 1);

    // 眉毛
    if (st === 'elder') {
      for (const ex of [-4.8 + face, 5.2 + face]) {
        c.beginPath();
        const sd = ex < 0 ? -1 : 1;
        c.beginPath();
        c.moveTo(ex - 3.2 * sd, -4.8);
        c.quadraticCurveTo(ex, -7.6, ex + 4.2 * sd, -1.8);
        c.quadraticCurveTo(ex + 0.5 * sd, -3.4, ex - 3.2 * sd, -4.8);
        fillOutline(c, P.hair, 1);
      }
    } else {
      const angry = atk >= 0, worried = hurt;
      c.strokeStyle = shade(P.hair, -0.45);
      c.lineWidth = 1.2;
      c.lineCap = 'round';
      for (const [ex, sd] of [[-4.8 + face, -1], [5.2 + face, 1]]) {
        const inner = angry ? 1 : worried ? -1.4 : 0;
        c.beginPath();
        c.moveTo(ex + 2.4 * sd, -4.6);
        c.quadraticCurveTo(ex, -5.9, ex - 2.3 * sd, -4.8 + inner);
        c.stroke();
      }
    }

    // 腮紅
    c.fillStyle = 'rgba(255,111,145,0.38)';
    c.beginPath();
    c.ellipse(-9 + face, 6.2, 2.9, 1.7, 0, 0, TAU);
    c.ellipse(9.6 + face, 6.2, 2.9, 1.7, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath(); c.arc(-9.8 + face, 5.6, 0.7, 0, TAU); c.arc(8.8 + face, 5.6, 0.7, 0, TAU); c.fill();

    // 嘴 / 鬍子
    const mx = 0.6 + face;
    if (st === 'elder') {
      c.beginPath();
      c.moveTo(-8, 7.5);
      c.quadraticCurveTo(-10.5, 14, -5.5, 16);
      c.quadraticCurveTo(-4, 21, 1, 23.5 + sway * 0.6);
      c.quadraticCurveTo(6, 21, 7.5, 16);
      c.quadraticCurveTo(12, 14, 10, 7.5);
      c.quadraticCurveTo(1, 12, -8, 7.5);
      c.closePath();
      fillOutline(c, lin(c, 'beard' + P.hair, 0, 4, 0, 23, [0, '#ffffff', 1, shade(P.hair, -0.12)]), 1.4);
      c.strokeStyle = 'rgba(120,100,160,0.45)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-2.5, 14); c.quadraticCurveTo(-1.5, 17, 0, 20);
      c.moveTo(4.5, 14); c.quadraticCurveTo(4.5, 17, 3, 20);
      c.stroke();
      // 八字鬍
      c.beginPath();
      c.moveTo(mx, 7.2);
      c.quadraticCurveTo(mx - 4, 5.6, mx - 7, 8);
      c.quadraticCurveTo(mx - 8.5, 10.5, mx - 6.5, 11);
      c.quadraticCurveTo(mx - 3, 9.2, mx, 9.4);
      c.quadraticCurveTo(mx + 3, 9.2, mx + 6.5, 11);
      c.quadraticCurveTo(mx + 8.5, 10.5, mx + 7, 8);
      c.quadraticCurveTo(mx + 4, 5.6, mx, 7.2);
      fillOutline(c, '#ffffff', 1.2);
    } else {
      c.strokeStyle = OUT;
      c.lineWidth = 1.3;
      c.lineCap = 'round';
      c.beginPath();
      if (hurt) {
        c.ellipse(mx, 8.2, 1.8, 2.2, 0, 0, TAU);
        c.fillStyle = OUT;
        c.fill();
      } else if (atk >= 0) {
        c.moveTo(mx - 2.6, 6.6);
        c.quadraticCurveTo(mx, 6, mx + 2.6, 6.6);
        c.quadraticCurveTo(mx, 11, mx - 2.6, 6.6);
        c.fillStyle = '#7a2a3a';
        c.fill();
        c.stroke();
        c.fillStyle = '#ff8fa3';
        c.beginPath(); c.ellipse(mx, 8.6, 1.3, 0.8, 0, 0, TAU); c.fill();
      } else {
        // 貓嘴微笑
        c.moveTo(mx - 2.8, 6.2);
        c.quadraticCurveTo(mx - 1.4, 8.2, mx, 6.8);
        c.quadraticCurveTo(mx + 1.4, 8.2, mx + 2.8, 6.2);
        c.stroke();
      }
    }

    // 帽子類（蓋在最上面）
    if (st === 'mage') {
      const tip = sway * 1.5 + flow * 0.4;
      c.beginPath();
      c.moveTo(-11.5, -11);
      c.bezierCurveTo(-8, -20, -1, -30, 2, -38);
      c.quadraticCurveTo(-3 - tip, -44, -9 - tip, -41);
      c.quadraticCurveTo(-3 - tip * 0.5, -40, 5, -33);
      c.bezierCurveTo(8, -24, 11, -17, 12, -11);
      c.closePath();
      fillOutline(c, lin(c, 'hat' + P.hat, 0, -42, 0, -10, [0, shade(P.hat, 0.25), 0.6, P.hat, 1, P.hatDk]), 1.8);
      c.beginPath();
      c.arc(-9.5 - tip, -41, 2.2, 0, TAU);
      fillOutline(c, P.trim, 1);
      c.strokeStyle = OUT; c.lineWidth = 4.4;
      c.beginPath(); c.moveTo(-10.5, -14.5); c.quadraticCurveTo(0.5, -11.5, 11, -14.5); c.stroke();
      c.strokeStyle = P.trim; c.lineWidth = 2.6;
      c.stroke();
      starPath(c, 3.5, -22, 3, 1.3, 5, 0.1);
      fillOutline(c, P.accent, 0.9);
      c.beginPath();
      c.ellipse(0.5, -10.5, 18, 4.6, -0.04, 0, TAU);
      fillOutline(c, lin(c, 'brim' + P.hat, 0, -15, 0, -6, [0, shade(P.hat, 0.2), 1, P.hatDk]), 1.7);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.beginPath(); c.ellipse(-4, -12, 9, 1.5, -0.04, 0, TAU); c.fill();
    } else if (st === 'archer') {
      c.beginPath();
      c.moveTo(-15.5, -5);
      c.bezierCurveTo(-15, -20, 10, -22, 14.5, -8);
      c.quadraticCurveTo(19, -6.5, 21, -4);
      c.quadraticCurveTo(4, -9, -15.5, -5);
      c.closePath();
      fillOutline(c, lin(c, 'cap' + P.cap, 0, -19, 0, -4, [0, shade(P.cap, 0.25), 0.6, P.cap, 1, P.capDk]), 1.7);
      c.strokeStyle = P.trim;
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-15, -7.5); c.quadraticCurveTo(0, -11.5, 15, -9.5); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath(); c.ellipse(-3, -16, 6, 2, -0.15, 0, TAU); c.fill();
      // 羽毛
      const fw = sway * 1.2 + flow * 0.3;
      c.beginPath();
      c.moveTo(-6, -12);
      c.bezierCurveTo(-8, -22, -16 - fw, -30, -22 - fw, -29);
      c.quadraticCurveTo(-15 - fw, -20, -3, -10);
      c.closePath();
      fillOutline(c, P.plume, 1.2);
      c.strokeStyle = 'rgba(43,29,58,0.45)';
      c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-4.5, -11); c.quadraticCurveTo(-11, -20, -21 - fw, -28.5); c.stroke();
    } else if (st === 'shop') {
      c.beginPath();
      c.arc(0, -2.5, 15.4, 1.03 * Math.PI, 1.97 * Math.PI);
      c.quadraticCurveTo(0, -11, -15.3, -4.5);
      c.closePath();
      fillOutline(c, lin(c, 'band' + P.accent, 0, -18, 0, -5, [0, shade(P.accent, 0.25), 1, shade(P.accent, -0.15)]), 1.6);
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [dx, dy] of [[-8, -11], [-1, -15], [6, -11], [10, -6.5], [-11, -6]]) {
        c.beginPath(); c.arc(dx, dy, 1.3, 0, TAU); c.fill();
      }
      c.beginPath();
      c.arc(-13.5, -6.5, 3, 0, TAU);
      fillOutline(c, P.accent, 1.2);
    }

    c.restore();
    c.restore();
  }

  function drawHero(c, p, t) {
    const x = p.x + p.w / 2;
    const y = p.y + p.h;
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 0, 15, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    if (p.dead) c.globalAlpha = 0.4;
    else if (p.invT > 0 && Math.floor(t * 18) % 2 === 0) c.globalAlpha = 0.4;

    drawChibi(c, {
      pal: p.C.pal, style: p.C.id, t, face: p.face,
      moving: Math.abs(p.vx) > 5 && p.onGround,
      phase: p.walkPh,
      airborne: !p.onGround && !p.climb,
      climb: !!p.climb,
      atk: p.atkT > 0 ? 1 - p.atkT / 0.24 : -1,
      hurt: p.hurtT > 0,
      ghost: p.dead,
    });

    if (p.shieldT > 0) {
      const pulse = 0.85 + 0.15 * Math.sin(t * 10);
      c.globalAlpha = 0.55 * pulse;
      c.fillStyle = rad(c, 'shieldbubble', 0, -24, 10, 0, -24, 34,
        [0, 'rgba(255,255,255,0)', 0.7, 'rgba(120,220,255,0.5)', 1, 'rgba(120,220,255,0)']);
      c.beginPath();
      c.arc(0, -24, 34, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.7 * pulse;
      c.strokeStyle = 'rgba(220,250,255,0.9)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, -24, 30, t * 3, t * 3 + 1.2);
      c.moveTo(Math.cos(t * 3 + Math.PI) * 30, -24 + Math.sin(t * 3 + Math.PI) * 30);
      c.arc(0, -24, 30, t * 3 + Math.PI, t * 3 + Math.PI + 1.2);
      c.stroke();
      sparkle(c, Math.cos(t * 2) * 22, -24 + Math.sin(t * 2) * 22, 3, 0.9);
    }
    c.restore();
  }

  // ---------- 怪物 ----------
  function monEye(c, x, y, rx, ry, mode, side) {
    c.strokeStyle = OUT;
    c.lineCap = 'round';
    if (mode === 'hurt') {
      c.lineWidth = 1.7;
      const s = -side;
      c.beginPath();
      c.moveTo(x - 2.2 * s, y - 2.4); c.lineTo(x + 2 * s, y); c.lineTo(x - 2.2 * s, y + 2.4);
      c.stroke();
    } else if (mode === 'blink') {
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x - rx, y); c.quadraticCurveTo(x, y + 1.5, x + rx, y); c.stroke();
    } else {
      c.fillStyle = OUT;
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(x - rx * 0.25, y - ry * 0.4, rx * 0.48, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + rx * 0.35, y + ry * 0.45, rx * 0.22, 0, TAU); c.fill();
    }
  }

  function drawSlime(c, m, t) {
    const sq = Math.sin(t * 5 + m.t);
    const hit = m.hitT > 0;
    const d = m.dir < 0 ? -1 : 1;
    c.save();
    c.translate(m.x + m.w / 2, m.y + m.h);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 1, 17 * (1 + sq * 0.07), 4, 0, 0, TAU);
    c.fill();
    c.scale(1 + sq * 0.07, 1 - sq * 0.08);
    c.beginPath();
    c.moveTo(-17, 0);
    c.bezierCurveTo(-19, -20, -10, -29.5, -1, -30);
    c.quadraticCurveTo(0.5, -35, 4.5, -36.5);
    c.quadraticCurveTo(2.5, -32, 4.5, -29.6);
    c.bezierCurveTo(12, -27.5, 19, -19, 17, 0);
    c.quadraticCurveTo(0, 4, -17, 0);
    c.closePath();
    fillOutline(c, hit ? '#ffffff' : rad(c, 'slime', -6, -21, 2, 0, -12, 25,
      [0, '#e6f7ff', 0.3, '#78c8ff', 0.75, '#3184dc', 1, '#1d56a8']), 2);
    if (!hit) {
      c.fillStyle = 'rgba(15,40,120,0.2)';
      c.beginPath(); c.ellipse(1, -3, 13, 3.5, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.45)';
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(0, -12, 14.5, -0.45, 0.5); c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.beginPath(); c.ellipse(-8.5, -21, 4.6, 2.6, -0.6, 0, TAU); c.fill();
    c.beginPath(); c.arc(-3.5, -25.5, 1.3, 0, TAU); c.fill();

    const fx = d * 1.5;
    const blink = (t + m.t) % 3.2 < 0.1;
    const mode = hit ? 'hurt' : blink ? 'blink' : 'open';
    monEye(c, fx - 5.5, -13.5, 2.6, 3.5, mode, -1);
    monEye(c, fx + 5.5, -13.5, 2.6, 3.5, mode, 1);
    c.fillStyle = 'rgba(255,110,160,0.45)';
    c.beginPath();
    c.ellipse(fx - 10, -9.5, 2.6, 1.5, 0, 0, TAU);
    c.ellipse(fx + 10, -9.5, 2.6, 1.5, 0, 0, TAU);
    c.fill();
    c.strokeStyle = OUT;
    c.lineWidth = 1.3;
    c.beginPath();
    if (hit) {
      c.ellipse(fx, -8, 1.8, 2.2, 0, 0, TAU);
      c.fillStyle = OUT;
      c.fill();
    } else {
      c.moveTo(fx - 3, -9.2);
      c.quadraticCurveTo(fx - 1.5, -7, fx, -8.7);
      c.quadraticCurveTo(fx + 1.5, -7, fx + 3, -9.2);
      c.stroke();
    }
    c.restore();
  }

  function drawMush(c, m, t) {
    const hit = m.hitT > 0;
    const walk = Math.sin(t * 9 + m.t);
    const d = m.dir < 0 ? -1 : 1;
    const by = -Math.abs(walk) * 1.3;
    c.save();
    c.translate(m.x + m.w / 2, m.y + m.h);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 1, 16, 4, 0, 0, TAU);
    c.fill();
    // 小腳
    for (const [fx, lift] of [[-7, Math.max(0, walk)], [7, Math.max(0, -walk)]]) {
      c.beginPath();
      c.ellipse(fx + d * 1, -2 - lift * 2.2, 5, 3, 0, 0, TAU);
      fillOutline(c, hit ? '#ffffff' : '#6b4330', 1.3);
    }
    c.translate(0, by);
    // 菇柄
    rr(c, -10, -24, 20, 22, 8);
    fillOutline(c, hit ? '#ffffff' : lin(c, 'mushstem', -10, 0, 10, 0, [0, '#fff8ea', 0.6, '#f3dfb8', 1, '#d9b98a']), 1.8);
    // 菌褶
    c.beginPath();
    c.ellipse(0, -20, 15.5, 4, 0, 0, TAU);
    fillOutline(c, hit ? '#ffffff' : '#ecd0a6', 1.4);
    c.strokeStyle = 'rgba(120,70,40,0.35)';
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = -3; i <= 3; i++) { c.moveTo(i * 2.2, -19); c.lineTo(i * 4.2, -17); }
    c.stroke();
    // 菇帽
    c.beginPath();
    c.moveTo(-19.5, -20);
    c.bezierCurveTo(-22, -47, 22, -47, 19.5, -20);
    c.quadraticCurveTo(10, -16, 0, -18.5);
    c.quadraticCurveTo(-10, -16, -19.5, -20);
    c.closePath();
    fillOutline(c, hit ? '#ffffff' : lin(c, 'mushcap', 0, -44, 0, -17, [0, '#ffa08a', 0.55, '#e8503e', 1, '#a8281f']), 2);
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath(); c.arc(-2, -27, 13, 1.15 * Math.PI, 1.42 * Math.PI); c.stroke();
    for (const [sx, sy, rx, ry] of [[-9, -32, 3.8, 3.1], [5.5, -37, 3, 2.4], [1, -27, 2.3, 1.9], [12.5, -28, 2.2, 2.7], [-15, -24.5, 1.8, 2.2]]) {
      c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, TAU);
      c.fillStyle = '#fff8ee'; c.fill();
      c.strokeStyle = 'rgba(43,29,58,0.3)'; c.lineWidth = 1; c.stroke();
    }
    // 臉
    const fx = d * 1.2;
    const blink = (t + m.t) % 3.6 < 0.1;
    const mode = hit ? 'hurt' : blink ? 'blink' : 'open';
    monEye(c, fx - 4.5, -11.5, 2.1, 2.9, mode, -1);
    monEye(c, fx + 4.5, -11.5, 2.1, 2.9, mode, 1);
    c.strokeStyle = OUT;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(fx - 7.5, -16.5); c.lineTo(fx - 2.8, -15.2);
    c.moveTo(fx + 7.5, -16.5); c.lineTo(fx + 2.8, -15.2);
    c.stroke();
    c.fillStyle = 'rgba(255,110,140,0.45)';
    c.beginPath();
    c.ellipse(fx - 7.5, -7.5, 2.3, 1.4, 0, 0, TAU);
    c.ellipse(fx + 7.5, -7.5, 2.3, 1.4, 0, 0, TAU);
    c.fill();
    c.beginPath();
    if (hit) {
      c.moveTo(fx - 3, -6.5); c.lineTo(fx - 1.5, -8); c.lineTo(fx, -6.5); c.lineTo(fx + 1.5, -8); c.lineTo(fx + 3, -6.5);
      c.stroke();
    } else {
      c.arc(fx, -8.5, 2.2, 0.2 * Math.PI, 0.8 * Math.PI);
      c.stroke();
    }
    c.restore();
  }

  function drawWisp(c, m, t) {
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;
    const hit = m.hitT > 0;
    const d = m.dir < 0 ? -1 : 1;
    const ph = t + (m.t || 0);
    drawGlow(c, cx, cy, 36, hit ? '#ffffff' : '#8cf0ff', 0.7 + 0.15 * Math.sin(ph * 4));
    c.save();
    c.translate(cx, cy);
    // 環繞的星光
    for (let i = 0; i < 3; i++) {
      const a = ph * 1.8 + i * 2.1;
      sparkle(c, Math.cos(a) * 21, Math.sin(a) * 12 - 2, 2.2, 0.45 + 0.45 * Math.sin(ph * 5 + i));
    }
    c.scale(d, 1);
    // 火焰尾巴
    const w1 = Math.sin(ph * 6) * 3, w2 = Math.sin(ph * 6 + 1.7) * 3;
    c.beginPath();
    c.moveTo(-2, -12.5);
    c.bezierCurveTo(-14, -14, -20, -7 + w1, -31, -5 + w1 * 1.4);
    c.bezierCurveTo(-23, 0 + w2, -17, 10, -2, 12.5);
    c.closePath();
    c.fillStyle = hit ? 'rgba(255,255,255,0.8)' : lin(c, 'wisptail', -31, 0, 0, 0, [0, 'rgba(150,230,255,0)', 0.6, 'rgba(160,232,255,0.6)', 1, 'rgba(200,245,255,0.95)']);
    c.fill();
    c.beginPath();
    c.moveTo(-2, -7);
    c.bezierCurveTo(-11, -7, -14, -3 + w2 * 0.5, -21, -2 + w2);
    c.bezierCurveTo(-14, 3, -10, 7, -2, 7);
    c.closePath();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fill();
    // 頭頂小火苗
    const fl = Math.sin(ph * 7) * 1.5;
    c.beginPath();
    c.moveTo(-4.5, -11);
    c.quadraticCurveTo(-3, -19, 2 + fl, -22);
    c.quadraticCurveTo(1, -16, 5, -11);
    c.closePath();
    fillOutline(c, hit ? '#ffffff' : '#d8f8ff', 1.2);
    // 本體
    c.beginPath();
    c.arc(0, 0, 13, 0, TAU);
    fillOutline(c, hit ? rad(c, 'wispbodyhit', -4, -5, 2, 0, 0, 14, [0, '#ffffff', 1, '#dfe9ff'])
      : rad(c, 'wispbody', -4, -5, 1, 0, 0, 14, [0, '#ffffff', 0.4, '#b4f2ff', 0.8, '#6d8ef0', 1, '#5160cc']), 1.8);
    c.strokeStyle = 'rgba(255,255,255,0.45)';
    c.lineWidth = 1.4;
    c.beginPath(); c.arc(1, 2, 9, 0.15 * Math.PI, 0.75 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.ellipse(-5, -6, 3.4, 2, -0.6, 0, TAU); c.fill();
    // 臉
    const blink = ph % 3 < 0.1;
    const mode = hit ? 'hurt' : blink ? 'blink' : 'open';
    monEye(c, -3, -0.5, 2.1, 2.9, mode, -1);
    monEye(c, 5.5, -0.5, 2.1, 2.9, mode, 1);
    c.fillStyle = 'rgba(255,120,190,0.45)';
    c.beginPath();
    c.ellipse(-6.5, 4, 2.2, 1.3, 0, 0, TAU);
    c.ellipse(9, 4, 2.2, 1.3, 0, 0, TAU);
    c.fill();
    c.strokeStyle = OUT;
    c.lineWidth = 1.2;
    c.beginPath();
    if (hit) { c.ellipse(1.3, 5, 1.5, 1.8, 0, 0, TAU); c.fillStyle = OUT; c.fill(); }
    else { c.arc(1.3, 3.8, 1.8, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    c.restore();
  }

  function drawBoss(c, b, t) {
    const hit = b.hitT > 0;
    const ph2 = b.hp < b.maxHp * 0.5;
    const cx = b.x + b.w / 2;
    const fy = b.y + b.h;
    const charge = b.state === 'charge' || !!b.charging;
    const roar = b.state === 'spore' || b.state === 'jump';
    c.save();
    drawGlow(c, cx, fy - 75, 150, ph2 ? '#ff3c64' : '#a85aff', 0.5 + 0.12 * Math.sin(t * 2.4));
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(cx, fy + 2, 60, 9, 0, 0, TAU);
    c.fill();

    c.translate(cx, fy);
    c.scale(b.face >= 0 ? 1 : -1, 1);
    if (charge) {
      c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const o = (t * 260 + i * 37) % 60;
        c.strokeStyle = `rgba(255,255,255,${0.55 - i * 0.1})`;
        c.lineWidth = 4 - i * 0.6;
        c.beginPath();
        c.moveTo(-72 - o, -110 + i * 26);
        c.lineTo(-112 - o, -110 + i * 26);
        c.stroke();
      }
    }
    const squash = b.state === 'air' ? 1.05 : 1 + Math.sin(t * 3) * 0.02;
    c.scale(1 + (1 - squash) * 0.6, squash);
    const W = (col) => (hit ? '#ffffff' : col);

    // 腳
    const step = charge ? Math.sin(t * 18) : 0;
    for (const [fx, s] of [[-24, step], [24, -step]]) {
      c.beginPath();
      c.ellipse(fx, -4 - Math.max(0, s) * 5, 17, 7.5, 0, 0, TAU);
      fillOutline(c, W('#6b4330'), 2.5);
    }
    // 小手
    const armA = roar ? -1.1 : charge ? 0.8 : 0.25 + Math.sin(t * 3) * 0.08;
    for (const sx of [-1, 1]) {
      c.save();
      c.translate(sx * 38, -44);
      c.rotate(sx * armA);
      c.beginPath();
      c.ellipse(sx * 6, 6, 8.5, 11, 0, 0, TAU);
      fillOutline(c, W('#ead3e6'), 2.5);
      c.restore();
    }
    // 菇柄
    rr(c, -40, -74, 80, 72, 30);
    fillOutline(c, hit ? '#ffffff' : lin(c, 'bstem', -40, 0, 40, 0, [0, '#fff4f8', 0.55, '#ecd2e6', 1, '#b98fbc']), 3);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.ellipse(-14, -38, 14, 24, -0.1, 0, TAU); c.fill();
    // 披風領（皇家紅領巾）
    c.beginPath();
    c.moveTo(-36, -64);
    c.quadraticCurveTo(0, -48, 36, -64);
    c.lineTo(30, -70);
    c.quadraticCurveTo(0, -60, -30, -70);
    c.closePath();
    fillOutline(c, W(ph2 ? '#ffb84a' : '#ffd36e'), 2);
    // 菌褶
    c.beginPath();
    c.ellipse(0, -70, 70, 11, 0, 0, TAU);
    fillOutline(c, W(ph2 ? '#d69a9a' : '#dcbca0'), 2.5);
    c.strokeStyle = 'rgba(100,60,40,0.35)';
    c.lineWidth = 1.2;
    c.beginPath();
    for (let i = -6; i <= 6; i++) { c.moveTo(i * 5, -68); c.lineTo(i * 10, -61); }
    c.stroke();
    // 菇帽
    c.beginPath();
    c.moveTo(-78, -66);
    c.bezierCurveTo(-86, -150, 86, -150, 78, -66);
    c.bezierCurveTo(60, -78, 40, -70, 26, -76);
    c.bezierCurveTo(10, -66, -10, -74, -26, -76);
    c.bezierCurveTo(-42, -70, -60, -78, -78, -66);
    c.closePath();
    fillOutline(c, hit ? '#ffffff' : ph2
      ? lin(c, 'bcap2', 0, -132, 0, -66, [0, '#ff8aa2', 0.45, '#e8345a', 1, '#7a1a34'])
      : lin(c, 'bcap1', 0, -132, 0, -66, [0, '#c69bff', 0.45, '#8b4cf0', 1, '#40206e']), 3);
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath(); c.arc(-10, -84, 40, 1.12 * Math.PI, 1.38 * Math.PI); c.stroke();
    // 斑點
    for (const [sx, sy, r] of [[-40, -110, 9.5], [-8, -124, 10], [32, -112, 8], [58, -90, 6.5], [-62, -88, 6.5], [14, -96, 5]]) {
      c.beginPath(); c.ellipse(sx, sy, r, r * 0.85, 0, 0, TAU);
      c.fillStyle = W('#fff3d6'); c.fill();
      c.strokeStyle = 'rgba(43,29,58,0.4)'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(sx - r * 0.35, sy - r * 0.3, r * 0.3, 0, TAU); c.fill();
    }
    if (ph2 && !hit) {
      // 第二階段：發光裂紋
      c.strokeStyle = 'rgba(255,214,120,0.85)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-58, -76); c.lineTo(-50, -92); c.lineTo(-56, -100); c.lineTo(-46, -114);
      c.moveTo(48, -78); c.lineTo(40, -94); c.lineTo(48, -104);
      c.stroke();
    }
    // 王冠
    c.save();
    c.translate(4, -128 + Math.sin(t * 3) * 1.5);
    c.rotate(-0.1);
    c.beginPath();
    c.moveTo(-22, 2);
    c.lineTo(-26, -20); c.lineTo(-13, -9); c.lineTo(0, -26); c.lineTo(13, -9); c.lineTo(26, -20);
    c.lineTo(22, 2);
    c.quadraticCurveTo(0, 6, -22, 2);
    c.closePath();
    fillOutline(c, hit ? '#ffffff' : lin(c, 'crown', 0, -26, 0, 4, [0, '#fff4b0', 0.5, '#ffc93c', 1, '#c4800e']), 2.5);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.moveTo(-18, -2); c.lineTo(-21, -13); c.lineTo(-15, -6); c.closePath(); c.fill();
    for (const [gx, gy, col] of [[0, -4, ph2 ? '#ff2d55' : '#7a4bff'], [-26, -20, '#ff6f91'], [0, -26, '#7fe7ff'], [26, -20, '#ff6f91']]) {
      c.beginPath(); c.arc(gx, gy, gx === 0 && gy === -4 ? 4 : 2.8, 0, TAU);
      fillOutline(c, W(col), 1.3);
    }
    c.restore();

    // 臉
    const eyeGlow = ph2 ? '#ff2d55' : '#ffd23f';
    for (const ex of [-20, 20]) {
      c.beginPath(); c.ellipse(ex, -47, 11, 13, 0, 0, TAU);
      fillOutline(c, '#ffffff', 2.2);
      if (!hit) drawGlow(c, ex + 2.5, -45, 10, eyeGlow, 0.5);
      c.beginPath(); c.ellipse(ex + 2.5, -45, 6.5, 7.5, 0, 0, TAU);
      c.fillStyle = hit ? '#d8d8e8' : eyeGlow; c.fill();
      c.fillStyle = OUT;
      c.beginPath(); c.ellipse(ex + 2.5, -45, 2, 5.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(ex - 0.5, -49, 2.2, 0, TAU); c.fill();
    }
    // 眉毛
    c.strokeStyle = OUT; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-35, -69); c.quadraticCurveTo(-20, -68, -8, -60); c.stroke();
    c.beginPath(); c.moveTo(35, -69); c.quadraticCurveTo(20, -68, 8, -60); c.stroke();
    // 腮紅
    c.fillStyle = 'rgba(255,110,150,0.35)';
    c.beginPath();
    c.ellipse(-33, -27, 6, 3.5, 0, 0, TAU);
    c.ellipse(33, -27, 6, 3.5, 0, 0, TAU);
    c.fill();
    // 嘴
    c.lineWidth = 2;
    c.strokeStyle = OUT;
    if (roar) {
      c.beginPath();
      c.ellipse(0, -18, 14, 11, 0, 0, TAU);
      c.fillStyle = '#4a1430'; c.fill(); c.stroke();
      c.fillStyle = '#ff7a9a';
      c.beginPath(); c.ellipse(0, -12, 8, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff';
      for (const fx of [-8, 8]) {
        c.beginPath(); c.moveTo(fx - 3, -27.5); c.lineTo(fx + 3, -27.5); c.lineTo(fx, -21.5); c.closePath(); c.fill();
      }
    } else {
      c.beginPath();
      c.moveTo(-22, -23);
      c.quadraticCurveTo(0, -15, 22, -23);
      c.quadraticCurveTo(16, -8, 0, -8);
      c.quadraticCurveTo(-16, -8, -22, -23);
      c.closePath();
      c.fillStyle = '#4a1430'; c.fill(); c.stroke();
      c.fillStyle = '#ffffff';
      for (const fx of [-12, 12]) {
        c.beginPath(); c.moveTo(fx - 3.5, -20); c.lineTo(fx + 3.5, -19); c.lineTo(fx + 0.5, -12.5); c.closePath(); c.fill();
      }
    }
    c.restore();
  }

  // ---------- 投射物 / 掉落 ----------
  function drawProj(c, pr, t) {
    c.save();
    c.translate(pr.x, pr.y);
    switch (pr.kind) {
      case 'bolt':
      case 'star': {
        const big = pr.kind === 'star';
        const r = big ? 12 : 8;
        const col = pr.col || '#c58bff';
        const dir = pr.vx < 0 ? -1 : 1;
        // 拖尾
        for (let i = 1; i <= 3; i++) {
          c.fillStyle = `rgba(${toRGB(col)},${0.4 - i * 0.1})`;
          c.beginPath();
          c.arc(-dir * i * r * 0.8, Math.sin(t * 20 + i) * 1.5, r * (0.7 - i * 0.13), 0, TAU);
          c.fill();
        }
        drawGlow(c, 0, 0, r * 2.2, col, 0.95);
        c.rotate(t * (big ? 6 : 10));
        if (big) {
          starPath(c, 0, 0, r, r * 0.48, 5, 0);
          fillOutline(c, rad(c, 'pstar' + col, -2, -3, 1, 0, 0, r, [0, '#ffffff', 0.5, shade(col, 0.5), 1, col]), 1.6);
        } else {
          c.fillStyle = '#ffffff';
          starPath(c, 0, 0, r, r * 0.35, 4, 0);
          c.fill();
          c.fillStyle = shade(col, 0.6);
          c.beginPath(); c.arc(0, 0, r * 0.35, 0, TAU); c.fill();
        }
        break;
      }
      case 'arrow': {
        c.rotate(Math.atan2(pr.vy, pr.vx));
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-30, -2); c.lineTo(-18, -2); c.moveTo(-34, 2); c.lineTo(-20, 2); c.stroke();
        c.lineCap = 'round';
        c.strokeStyle = OUT; c.lineWidth = 3.6;
        c.beginPath(); c.moveTo(-14, 0); c.lineTo(9, 0); c.stroke();
        c.strokeStyle = '#a8703a'; c.lineWidth = 2;
        c.stroke();
        c.beginPath(); c.moveTo(15, 0); c.lineTo(7, -4.2); c.lineTo(8.5, 0); c.lineTo(7, 4.2); c.closePath();
        fillOutline(c, '#e8f1ff', 1.2);
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(-9, 0); c.lineTo(-15, 4.5 * s); c.lineTo(-19, 4.5 * s); c.lineTo(-15, 0); c.closePath();
          fillOutline(c, s < 0 ? '#7fd88f' : '#f5f0e6', 1);
        }
        break;
      }
      case 'wave': {
        c.fillStyle = rad(c, 'pwave', 0, -10, 2, 0, -10, 40,
          [0, 'rgba(255,200,255,0.95)', 0.6, 'rgba(170,80,220,0.8)', 1, 'rgba(90,30,140,0)']);
        c.beginPath();
        c.ellipse(0, -10, 34, 22, 0, 0, TAU);
        c.fill();
        c.strokeStyle = 'rgba(255,230,255,0.8)';
        c.lineWidth = 2;
        c.beginPath();
        for (let x = -26; x <= 26; x += 2) {
          const y = -14 + Math.sin(x * 0.35 + t * 14) * 3 - (26 - Math.abs(x)) * 0.25;
          if (x === -26) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = -2; i <= 2; i++) {
          c.beginPath(); c.arc(i * 12, -20 + Math.abs(i) * 3 + Math.sin(t * 10 + i) * 2, 3.5, 0, TAU); c.fill();
        }
        break;
      }
      case 'spore': {
        drawGlow(c, 0, 0, 20, '#b8ff7a', 0.45);
        c.rotate(t * 6);
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          c.quadraticCurveTo(Math.cos(a - 0.4) * 10.5, Math.sin(a - 0.4) * 10.5, Math.cos(a) * 8.5, Math.sin(a) * 8.5);
        }
        c.closePath();
        fillOutline(c, rad(c, 'pspore', -3, -3, 1, 0, 0, 11, [0, '#f4ffd0', 0.6, '#9be06a', 1, '#4f9a36']), 1.6);
        c.fillStyle = 'rgba(60,110,40,0.7)';
        for (const [x, y] of [[3, 2], [-3, 3], [1, -4]]) {
          c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill();
        }
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath(); c.arc(-3, -3, 1.6, 0, TAU); c.fill();
        break;
      }
    }
    c.restore();
  }

  function drawDrop(c, d, t) {
    c.save();
    c.translate(d.x, d.y);
    if (d.kind === 'coin') {
      drawGlow(c, 0, 0, 13, '#ffd23f', 0.35);
      const cs = Math.cos(t * 5 + d.t);
      const sx = Math.max(0.15, Math.abs(cs));
      c.scale(sx, 1);
      // 硬幣厚度
      if (sx < 0.9) {
        c.beginPath();
        c.arc(cs > 0 ? 1.5 : -1.5, 0, 7, 0, TAU);
        fillOutline(c, '#b5780c', 1.5);
      }
      c.beginPath();
      c.arc(0, 0, 7, 0, TAU);
      fillOutline(c, rad(c, 'coin', -2.5, -2.5, 0.5, 0, 0, 8, [0, '#fff9cc', 0.45, '#ffd23f', 1, '#d18e10']), 1.5);
      c.strokeStyle = 'rgba(160,95,5,0.7)';
      c.lineWidth = 1;
      c.beginPath(); c.arc(0, 0, 4.9, 0, TAU); c.stroke();
      starPath(c, 0, 0.3, 3, 1.3, 5, 0);
      c.fillStyle = '#fff3a8';
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(-3, -3, 1.6, 1.1, -0.7, 0, TAU); c.fill();
    } else {
      // 藥水
      drawGlow(c, 0, 1, 15, '#ff6b8a', 0.3 + 0.1 * Math.sin(t * 4 + d.t));
      const bottle = () => {
        c.beginPath();
        c.moveTo(-3.5, -9); c.lineTo(3.5, -9); c.lineTo(3.5, -5.5);
        c.quadraticCurveTo(9, -3, 9, 3);
        c.quadraticCurveTo(9, 9.5, 0, 9.5);
        c.quadraticCurveTo(-9, 9.5, -9, 3);
        c.quadraticCurveTo(-9, -3, -3.5, -5.5);
        c.closePath();
      };
      bottle();
      c.fillStyle = 'rgba(235,245,255,0.55)';
      c.fill();
      c.save();
      c.clip();
      const wv = Math.sin(t * 4 + d.t) * 1.2;
      c.beginPath();
      c.moveTo(-10, -1 + wv);
      c.quadraticCurveTo(0, -3 - wv, 10, -1 + wv);
      c.lineTo(10, 11); c.lineTo(-10, 11);
      c.closePath();
      c.fillStyle = lin(c, 'potion', 0, -3, 0, 10, [0, '#ff8aa0', 0.5, '#f0365a', 1, '#b3173a']);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      const bt = (t * 1.5 + d.t) % 1;
      c.beginPath(); c.arc(3, 7 - bt * 7, 1.1, 0, TAU); c.arc(-2.5, 6 - ((bt + 0.5) % 1) * 6, 0.8, 0, TAU); c.fill();
      c.restore();
      bottle();
      c.lineWidth = 1.5;
      c.strokeStyle = OUT;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.4;
      c.lineCap = 'round';
      c.beginPath(); c.arc(0, 2.5, 6, 1.05 * Math.PI, 1.35 * Math.PI); c.stroke();
      // 瓶口與軟木塞
      rr(c, -4.5, -10.5, 9, 2.5, 1.2);
      fillOutline(c, '#f4e6ff', 1.2);
      rr(c, -3.2, -14.5, 6.4, 4.5, 1.5);
      fillOutline(c, '#c9925a', 1.2);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(-2.2, -13.5, 1.4, 2.5);
      // 愛心標籤
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(0, 6);
      c.bezierCurveTo(-4, 3, -3, 0, 0, 1.6);
      c.bezierCurveTo(3, 0, 4, 3, 0, 6);
      c.fill();
    }
    c.restore();
  }

  // ---------- 預覽（選角畫面） ----------
  function drawPreview(c, cls, t) {
    c.save();
    c.translate(0, 0);
    const fake = { x: -13, y: -46, w: 26, h: 46, C: cls, face: 1, vx: 0, onGround: true, climb: false, dead: false, invT: 0, shieldT: 0, hurtT: 0, atkT: 0, walkPh: 0 };
    drawHero(c, fake, performance.now() / 1000);
    c.restore();
  }

  return {
    THEMES, drawBackground, drawSurface, drawRope, drawPortal, drawNameTag,
    drawChibi, drawHero, drawSlime, drawMush, drawWisp, drawBoss,
    drawProj, drawDrop, drawPreview,
  };
})();
