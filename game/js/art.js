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
    rr(c, -w / 2 - 1.5, len - 4, w + 3, 7, 3);
    fillOutline(c, col, 1.5);
  }

  function eye(c, x, y, P, blink, hurt) {
    if (hurt) {
      c.strokeStyle = OUT;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x - 2.5, y - 2.5); c.lineTo(x + 2.5, y); c.lineTo(x - 2.5, y + 2.5);
      c.stroke();
      return;
    }
    if (blink) {
      c.strokeStyle = OUT;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x - 2.6, y); c.lineTo(x + 2.6, y);
      c.stroke();
      return;
    }
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(x, y, 3.3, 4.3, 0, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 1.2;
    c.strokeStyle = OUT;
    c.stroke();
    c.fillStyle = P.eye;
    c.beginPath();
    c.arc(x + 0.3, y + 0.9, 2.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x - 0.6, y - 0.6, 1.0, 0, Math.PI * 2);
    c.fill();
  }

  function hairCap(c, col, hi) {
    c.beginPath();
    c.moveTo(-14.5, -1);
    c.arc(0, -1, 14.5, Math.PI, 2 * Math.PI);
    c.quadraticCurveTo(9, -8, 1, -4);
    c.quadraticCurveTo(-6, -8, -14.5, -1);
    c.closePath();
    const g = c.createLinearGradient(0, -15, 0, 0);
    g.addColorStop(0, hi);
    g.addColorStop(1, col);
    fillOutline(c, g, 1.6);
  }

  function robe(c, body, bodyDk, trim, by) {
    c.beginPath();
    c.moveTo(-9, -34 + by);
    c.lineTo(9, -34 + by);
    c.lineTo(15, -2);
    c.quadraticCurveTo(0, 3, -15, -2);
    c.closePath();
    const g = c.createLinearGradient(0, -34, 0, 0);
    g.addColorStop(0, body);
    g.addColorStop(1, bodyDk);
    fillOutline(c, g, 1.8);
    c.strokeStyle = trim;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-14, -3); c.quadraticCurveTo(0, 2, 14, -3);
    c.stroke();
  }

  // o: {pal, style, t, face, moving, phase, airborne, climb, atk(0..1|-1), hurt, ghost, buff, kind}
  function drawChibi(c, o) {
    const P = o.pal;
    const t = o.t;
    const st = o.style;
    const walk = o.moving;
    const air = o.airborne;
    const ph = o.phase || 0;
    const sw = walk ? Math.sin(ph) * 0.8 : 0;
    const idle = Math.sin(t * 3.2);
    const by = walk ? -Math.abs(Math.sin(ph)) * 2 : air ? -1 : -Math.max(0, idle) * 0.8;
    const hy = -46 + by;
    const isMage = st === 'mage' || st === 'elder';

    c.save();
    c.scale(o.face || 1, 1);

    // 斗篷（劍士）
    if (st === 'knight') {
      const flutter = Math.sin(t * 5) * 3 + (walk ? -sw * 4 : 0);
      c.beginPath();
      c.moveTo(-8, -33 + by);
      c.quadraticCurveTo(-20 - flutter, -22 + by, -16 - flutter * 1.4, -4);
      c.quadraticCurveTo(-9, 3, -2, -10 + by);
      c.closePath();
      const g = c.createLinearGradient(-16, -30, -4, 0);
      g.addColorStop(0, P.cape);
      g.addColorStop(1, P.capeDk);
      fillOutline(c, g, 1.6);
    }

    // 弓手箭袋
    if (st === 'archer') {
      c.save();
      c.translate(-9, -34 + by);
      c.rotate(0.35);
      rr(c, -4, -8, 8, 18, 3);
      fillOutline(c, '#8a5a2b', 1.4);
      c.strokeStyle = '#f5f0e6';
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-1, -8); c.lineTo(-2, -15); c.moveTo(2, -8); c.lineTo(3, -14); c.stroke();
      c.restore();
    }

    // 後方長髮（法師）
    if (st === 'mage') {
      rr(c, -16, hy - 4, 32, 34, 14);
      fillOutline(c, P.hair, 1.6);
    }
    // 弓手馬尾
    if (st === 'archer') {
      const pt = Math.sin(t * 8) * 2 + (walk ? -sw * 4 : 0);
      c.beginPath();
      c.ellipse(-13 + pt * 0.3, hy + 4, 5, 9, -0.4 + pt * 0.05, 0, Math.PI * 2);
      fillOutline(c, P.hair, 1.5);
    }

    // 腿
    const la = air ? -0.5 : sw;
    const ra = air ? 0.6 : -sw;
    const bootCol = P.boot;
    limb(c, -4, -16, 17, la, 8, P.pants, (cc, len) => boot(cc, len, bootCol, 8));
    limb(c, 4, -16, 17, ra, 8, P.pants, (cc, len) => boot(cc, len, bootCol, 8));

    // 軀幹
    if (isMage) {
      robe(c, P.body, P.bodyDk, P.trim, by);
    } else {
      const g = c.createLinearGradient(0, -34 + by, 0, -14 + by);
      g.addColorStop(0, P.body);
      g.addColorStop(1, P.bodyDk);
      rr(c, -9, -34 + by, 18, 20, 7);
      fillOutline(c, g, 1.8);
      c.fillStyle = P.trim;
      c.fillRect(-9, -22 + by, 18, 2.5);
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.fillRect(-6, -31 + by, 3, 9);
    }

    // 手臂：後手 / 前手
    const climbing = !!o.climb;
    const atk = o.atk >= 0 ? o.atk : -1;
    let fa, ba;
    if (climbing) {
      fa = -2.6 + Math.sin(t * 8) * 0.2;
      ba = -2.2 - Math.sin(t * 8) * 0.2;
    } else if (st === 'archer') {
      ba = -1.5;                                  // 後手持弓（前伸）
      fa = atk >= 0 ? -1.5 + atk * 0.5 : -1.2;   // 前手拉弦
    } else {
      ba = sw * -0.9 + 0.12;
      fa = atk >= 0 ? -2.1 + atk * 2.5 : sw * 0.9 + 0.12 + idle * 0.03;
    }
    const sh = -30 + by;

    limb(c, -9, sh, 14, ba, 6.5, P.body, (cc, len) => {
      if (st === 'knight') {
        // 盾牌
        cc.beginPath();
        cc.arc(0, len - 1, 10, 0, Math.PI * 2);
        const sg = cc.createRadialGradient(-3, len - 4, 2, 0, len - 1, 10);
        sg.addColorStop(0, '#ffffff');
        sg.addColorStop(0.5, P.accent);
        sg.addColorStop(1, P.capeDk);
        fillOutline(cc, sg, 1.8);
        cc.fillStyle = P.trim;
        cc.beginPath();
        cc.arc(0, len - 1, 3.2, 0, Math.PI * 2);
        cc.fill();
      }
    });

    // 前手上的武器（法師的法杖、劍士的劍）
    const fx0 = 9 - Math.sin(fa) * 14;
    const fy0 = sh + Math.cos(fa) * 14;

    limb(c, 9, sh, 14, fa, 6.5, P.body, (cc, len) => {
      if (st === 'knight') {
        // 劍：沿手臂延伸
        cc.fillStyle = '#e8f1ff';
        cc.strokeStyle = OUT;
        cc.lineWidth = 1.4;
        cc.beginPath();
        cc.rect(-2.2, len - 2, 4.4, 22);
        cc.fill();
        cc.stroke();
        cc.fillStyle = P.trim;
        cc.fillRect(-6, len - 3, 12, 3.5);
        cc.strokeStyle = OUT;
        cc.strokeRect(-6, len - 3, 12, 3.5);
        cc.fillStyle = '#7a4a2a';
        cc.fillRect(-1.6, len + 0.5, 3.2, 6);
      }
    });

    if (st === 'mage' || st === 'elder') {
      const pulse = 0.6 + 0.4 * Math.sin(t * 5);
      const sx = fx0 + 2;
      const sy = fy0 - 4;
      c.strokeStyle = '#7a4a2a';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(fx0, fy0);
      c.lineTo(sx - 4, sy - 36);
      c.stroke();
      c.strokeStyle = OUT;
      c.lineWidth = 0.8;
      c.stroke();
      const og = c.createRadialGradient(sx - 4, sy - 40, 1, sx - 4, sy - 40, 9);
      og.addColorStop(0, '#ffffff');
      og.addColorStop(0.4, st === 'elder' ? '#9ff3ff' : '#e1a8ff');
      og.addColorStop(1, 'rgba(160,80,255,0)');
      c.globalAlpha *= 0.6 + 0.4 * pulse;
      c.fillStyle = og;
      c.beginPath();
      c.arc(sx - 4, sy - 40, 9, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha /= 0.6 + 0.4 * pulse;
    }

    if (st === 'archer') {
      // 弓：位於後手（前伸）的手上
      const bx = -9 - Math.sin(ba) * 14;
      const byy = sh + Math.cos(ba) * 14;
      c.strokeStyle = '#8a5a2b';
      c.lineWidth = 2.6;
      c.beginPath();
      c.arc(bx - 6, byy, 15, -0.95, 0.95);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(bx - 6 + 15 * Math.cos(-0.95), byy + 15 * Math.sin(-0.95));
      c.lineTo(bx - 6 + 15 * Math.cos(0.95), byy + 15 * Math.sin(0.95));
      c.stroke();
    }

    // 頭
    const blink = (t % 3.4) < 0.12;
    c.save();
    c.translate(0, hy);
    if (st === 'mage') {
      // 法師帽
      c.beginPath();
      c.moveTo(-12, -8);
      c.quadraticCurveTo(-2, -24, 4, -40);
      c.quadraticCurveTo(10, -22, 12, -8);
      c.closePath();
      const hg = c.createLinearGradient(0, -40, 0, -8);
      hg.addColorStop(0, P.hat);
      hg.addColorStop(1, P.hatDk);
      fillOutline(c, hg, 1.8);
      c.fillStyle = P.trim;
      c.beginPath();
      c.arc(4, -28, 2.6, 0, Math.PI * 2);
      c.fill();
      rr(c, -17, -10, 34, 6, 3);
      fillOutline(c, P.hat, 1.6);
    }

    // 頭部
    const hg2 = c.createRadialGradient(-4, -4, 2, 0, 0, 15);
    hg2.addColorStop(0, '#ffffff');
    hg2.addColorStop(0.35, P.skin);
    hg2.addColorStop(1, P.skinDk);
    c.beginPath();
    c.arc(0, 0, 14, 0, Math.PI * 2);
    fillOutline(c, hg2, 1.8);

    // 瀏海 / 頭髮
    if (st === 'knight') {
      hairCap(c, P.hair, P.hairHi);
      // 羽飾
      const pw = Math.sin(t * 4) * 2;
      c.beginPath();
      c.moveTo(-4, -13);
      c.quadraticCurveTo(-14 + pw, -28, -6 + pw, -26);
      c.quadraticCurveTo(-2, -20, -1, -13);
      c.closePath();
      fillOutline(c, P.plume, 1.4);
      // 額環
      c.strokeStyle = P.trim;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -1, 13, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    } else if (st === 'mage') {
      hairCap(c, P.hair, P.hairHi);
    } else if (st === 'archer') {
      hairCap(c, P.hair, P.hairHi);
      // 綠色帽子
      c.beginPath();
      c.arc(0, -2, 14.8, Math.PI * 1.02, Math.PI * 1.98);
      c.quadraticCurveTo(12, -6, -15, -6);
      c.closePath();
      const cg = c.createLinearGradient(0, -16, 0, -4);
      cg.addColorStop(0, P.cap);
      cg.addColorStop(1, P.capDk);
      fillOutline(c, cg, 1.7);
      // 羽毛
      c.beginPath();
      c.moveTo(6, -14);
      c.quadraticCurveTo(14, -26, 18, -22);
      c.quadraticCurveTo(12, -16, 8, -12);
      c.closePath();
      fillOutline(c, P.plume, 1.2);
    } else if (st === 'elder') {
      c.fillStyle = P.hair;
      c.strokeStyle = OUT;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, -4, 15, Math.PI * 1.05, Math.PI * 1.95);
      c.quadraticCurveTo(12, -12, 0, -10);
      c.quadraticCurveTo(-12, -12, -15, -4);
      c.fill();
      c.stroke();
      // 白鬍鬚
      c.beginPath();
      c.moveTo(-8, 4);
      c.quadraticCurveTo(0, 22, 8, 4);
      c.quadraticCurveTo(0, 8, -8, 4);
      c.closePath();
      fillOutline(c, P.hair, 1.4);
    } else if (st === 'shop') {
      hairCap(c, P.hair, P.hairHi);
      c.fillStyle = P.accent;
      c.fillRect(-14, -8, 28, 4);
    }

    // 眼睛、腮紅、嘴
    const hurt = !!o.hurt;
    eye(c, -5, 1.5, P, blink && !hurt, hurt);
    eye(c, 5, 1.5, P, blink && !hurt, hurt);
    c.fillStyle = 'rgba(255,111,145,0.45)';
    c.beginPath();
    c.ellipse(-9, 6, 2.8, 1.8, 0, 0, Math.PI * 2);
    c.ellipse(9, 6, 2.8, 1.8, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = OUT;
    c.lineWidth = 1.4;
    c.beginPath();
    if (hurt) {
      c.arc(0, 10, 2.4, 0, Math.PI * 2);
    } else {
      c.arc(0, 6, 2.4, 0.2 * Math.PI, 0.8 * Math.PI);
    }
    c.stroke();
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
      const sg = c.createRadialGradient(0, -24, 10, 0, -24, 34);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.7, 'rgba(120,220,255,0.5)');
      sg.addColorStop(1, 'rgba(120,220,255,0)');
      c.fillStyle = sg;
      c.beginPath();
      c.arc(0, -24, 34, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // ---------- 怪物 ----------
  function drawSlime(c, m, t) {
    const sq = Math.sin(t * 5 + m.t);
    const hit = m.hitT > 0;
    c.save();
    c.translate(m.x + m.w / 2, m.y + m.h);
    c.scale(1 + sq * 0.06, 1 - sq * 0.07);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 1, 17, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(-17, 0);
    c.bezierCurveTo(-19, -22, -9, -31, 0, -31);
    c.bezierCurveTo(9, -31, 19, -22, 17, 0);
    c.quadraticCurveTo(0, 4, -17, 0);
    c.closePath();
    const g = c.createRadialGradient(-6, -20, 3, 0, -14, 24);
    g.addColorStop(0, hit ? '#ffffff' : '#c8ecff');
    g.addColorStop(0.45, hit ? '#ffffff' : '#4fa8f0');
    g.addColorStop(1, hit ? '#dbeeff' : '#1b5fb8');
    fillOutline(c, g, 2);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.ellipse(-8, -22, 4.2, 2.6, -0.5, 0, Math.PI * 2);
    c.fill();
    const blink = (t + m.t) % 3.2 < 0.1;
    for (const ex of [-5.5, 5.5]) {
      if (blink) {
        c.strokeStyle = OUT;
        c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(ex - 2.2, -14); c.lineTo(ex + 2.2, -14); c.stroke();
      } else {
        c.fillStyle = OUT;
        c.beginPath(); c.ellipse(ex, -14, 2.2, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(ex + 0.8, -15, 0.9, 0, Math.PI * 2); c.fill();
      }
    }
    c.strokeStyle = OUT;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, -9, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
    c.restore();
  }

  function drawMush(c, m, t) {
    const hit = m.hitT > 0;
    const walk = Math.sin(t * 9 + m.t);
    c.save();
    c.translate(m.x + m.w / 2, m.y + m.h);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 1, 16, 4, 0, 0, Math.PI * 2);
    c.fill();
    // 小腳
    c.fillStyle = '#5b3a29';
    c.beginPath(); c.ellipse(-7, -1 + Math.max(0, walk) * -2, 4.5, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(7, -1 + Math.max(0, -walk) * -2, 4.5, 2.6, 0, 0, Math.PI * 2); c.fill();
    // 菇柄
    const sg = c.createLinearGradient(-10, 0, 10, 0);
    sg.addColorStop(0, hit ? '#ffffff' : '#fff1d6');
    sg.addColorStop(1, hit ? '#ffffff' : '#e3c79a');
    rr(c, -10, -24, 20, 24, 8);
    fillOutline(c, sg, 1.8);
    // 菇帽
    c.beginPath();
    c.moveTo(-18, -20);
    c.bezierCurveTo(-20, -44, 20, -44, 18, -20);
    c.quadraticCurveTo(0, -14, -18, -20);
    c.closePath();
    const cg = c.createLinearGradient(0, -44, 0, -18);
    cg.addColorStop(0, hit ? '#ffffff' : '#ff8a72');
    cg.addColorStop(1, hit ? '#ffffff' : '#c93a2c');
    fillOutline(c, cg, 2);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [sx, sy, r] of [[-8, -32, 3.2], [6, -36, 2.6], [0, -27, 2], [11, -27, 1.8]]) {
      c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fill();
    }
    // 臉
    for (const ex of [-4.5, 4.5]) {
      c.fillStyle = OUT;
      c.beginPath(); c.ellipse(ex, -13, 2, 2.8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex + 0.6, -14, 0.8, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = OUT;
    c.lineWidth = hit ? 2 : 1.4;
    c.beginPath();
    if (hit) {
      c.moveTo(-8, -20); c.lineTo(-2, -17);
      c.moveTo(8, -20); c.lineTo(2, -17);
    } else {
      c.arc(0, -9, 2.5, 0.2 * Math.PI, 0.8 * Math.PI);
    }
    c.stroke();
    c.restore();
  }

  function drawWisp(c, m, t) {
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;
    const hit = m.hitT > 0;
    c.save();
    // 光暈
    const hg = c.createRadialGradient(cx, cy, 2, cx, cy, 30);
    hg.addColorStop(0, hit ? 'rgba(255,255,255,0.9)' : 'rgba(150,255,255,0.55)');
    hg.addColorStop(1, 'rgba(150,255,255,0)');
    c.fillStyle = hg;
    c.beginPath();
    c.arc(cx, cy, 30, 0, Math.PI * 2);
    c.fill();
    // 尾巴
    for (let i = 1; i <= 3; i++) {
      const tx = cx - m.dir * i * 9;
      const ty = cy + Math.sin(t * 6 + i) * 3;
      c.fillStyle = `rgba(190,240,255,${0.5 - i * 0.12})`;
      c.beginPath();
      c.arc(tx, ty, 7 - i * 1.4, 0, Math.PI * 2);
      c.fill();
    }
    // 本體
    const bg = c.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, 14);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.5, hit ? '#ffffff' : '#9fe9ff');
    bg.addColorStop(1, hit ? '#dfe9ff' : '#5a67d8');
    c.beginPath();
    c.arc(cx, cy, 13, 0, Math.PI * 2);
    fillOutline(c, bg, 1.8);
    // 眼
    const blink = (t + m.t) % 3 < 0.1;
    for (const ex of [-4.5, 4.5]) {
      if (blink) {
        c.strokeStyle = OUT; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(cx + ex - 2, cy - 1); c.lineTo(cx + ex + 2, cy - 1); c.stroke();
      } else {
        c.fillStyle = OUT;
        c.beginPath(); c.ellipse(cx + ex, cy - 1, 2, 2.8, 0, 0, Math.PI * 2); c.fill();
      }
    }
    // 光環
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 1.2;
    c.setLineDash([4, 4]);
    c.lineDashOffset = -t * 20;
    c.beginPath();
    c.ellipse(cx, cy - 16, 9, 3, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawBoss(c, b, t) {
    const hit = b.hitT > 0;
    const ph2 = b.hp < b.maxHp * 0.5;
    const cx = b.x + b.w / 2;
    const fy = b.y + b.h;
    c.save();
    // 光暈
    const aura = c.createRadialGradient(cx, fy - 70, 30, cx, fy - 70, 130);
    aura.addColorStop(0, ph2 ? 'rgba(255,60,90,0.35)' : 'rgba(160,80,255,0.3)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = aura;
    c.beginPath();
    c.arc(cx, fy - 70, 130, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(cx, fy + 2, 60, 9, 0, 0, Math.PI * 2);
    c.fill();

    c.translate(cx, fy);
    c.scale(b.face >= 0 ? 1 : -1, 1);
    if (b.state === 'charge') {
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-70 - i * 18, -60 + i * 22);
        c.lineTo(-110 - i * 18, -60 + i * 22);
        c.stroke();
      }
    }
    const squash = b.state === 'air' ? 1.05 : 1 + Math.sin(t * 3) * 0.02;
    c.scale(1, squash);

    // 菇柄
    const sg = c.createLinearGradient(-40, 0, 40, 0);
    sg.addColorStop(0, hit ? '#ffffff' : '#ffe9f0');
    sg.addColorStop(1, hit ? '#ffffff' : '#c9a2c9');
    rr(c, -40, -74, 80, 74, 30);
    fillOutline(c, sg, 3);
    // 菇帽
    c.beginPath();
    c.moveTo(-78, -66);
    c.bezierCurveTo(-86, -150, 86, -150, 78, -66);
    c.bezierCurveTo(60, -78, 40, -70, 26, -76);
    c.bezierCurveTo(10, -66, -10, -74, -26, -76);
    c.bezierCurveTo(-42, -70, -60, -78, -78, -66);
    c.closePath();
    const cg = c.createLinearGradient(0, -150, 0, -66);
    cg.addColorStop(0, hit ? '#ffffff' : ph2 ? '#ff4a6e' : '#9b5cff');
    cg.addColorStop(1, hit ? '#ffffff' : ph2 ? '#8a1f3a' : '#4b2280');
    fillOutline(c, cg, 3);
    // 斑點
    c.fillStyle = 'rgba(255,240,200,0.85)';
    for (const [sx, sy, r] of [[-40, -112, 9], [-8, -132, 11], [34, -116, 8], [60, -90, 6], [-62, -88, 6]]) {
      c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fill();
    }
    // 臉（憤怒的眼睛）
    const eyeGlow = ph2 ? '#ff2d55' : '#ffd23f';
    for (const ex of [-20, 20]) {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(ex, -48, 11, 13, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
      c.fillStyle = eyeGlow;
      c.beginPath(); c.arc(ex + (b.face >= 0 ? 2 : -2), -46, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = OUT;
      c.beginPath(); c.arc(ex + (b.face >= 0 ? 2 : -2), -46, 3, 0, Math.PI * 2); c.fill();
    }
    // 眉毛
    c.strokeStyle = OUT; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-34, -70); c.lineTo(-8, -62); c.stroke();
    c.beginPath(); c.moveTo(34, -70); c.lineTo(8, -62); c.stroke();
    // 嘴
    c.fillStyle = OUT;
    c.beginPath();
    if (b.state === 'spore' || b.state === 'jump') {
      c.ellipse(0, -18, 14, 10, 0, 0, Math.PI * 2);
    } else {
      c.moveTo(-22, -22); c.lineTo(-12, -14); c.lineTo(-4, -22); c.lineTo(4, -14); c.lineTo(12, -22); c.lineTo(22, -20);
      c.lineTo(20, -10); c.lineTo(-20, -10); c.closePath();
    }
    c.fill();
    c.restore();
  }

  // ---------- 投射物 / 掉落 ----------
  function drawProj(c, pr, t) {
    c.save();
    c.translate(pr.x, pr.y);
    switch (pr.kind) {
      case 'bolt':
      case 'star': {
        const r = pr.kind === 'star' ? 12 : 8;
        const g = c.createRadialGradient(0, 0, 1, 0, 0, r * 1.8);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, pr.col || '#c58bff');
        g.addColorStop(1, 'rgba(200,120,255,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, r * 1.8, 0, Math.PI * 2);
        c.fill();
        c.rotate(t * 10);
        c.fillStyle = '#ffffff';
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const rr2 = i % 2 === 0 ? r : r * 0.45;
          c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
        }
        c.closePath();
        c.fill();
        break;
      }
      case 'arrow': {
        c.rotate(Math.atan2(pr.vy, pr.vx));
        c.strokeStyle = '#7a4a2a';
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(-14, 0); c.lineTo(10, 0); c.stroke();
        c.fillStyle = '#e8f1ff';
        c.strokeStyle = OUT;
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(14, 0); c.lineTo(7, -4); c.lineTo(7, 4); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#f5f0e6';
        c.beginPath(); c.moveTo(-14, 0); c.lineTo(-19, -4); c.lineTo(-17, 0); c.lineTo(-19, 4); c.closePath(); c.fill();
        break;
      }
      case 'wave': {
        const g = c.createRadialGradient(0, -10, 2, 0, -10, 40);
        g.addColorStop(0, 'rgba(255,200,255,0.95)');
        g.addColorStop(0.6, 'rgba(170,80,220,0.8)');
        g.addColorStop(1, 'rgba(90,30,140,0)');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(0, -10, 34, 22, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = -2; i <= 2; i++) {
          c.beginPath(); c.arc(i * 12, -18 + Math.abs(i) * 3, 4, 0, Math.PI * 2); c.fill();
        }
        break;
      }
      case 'spore': {
        c.rotate(t * 6);
        const g = c.createRadialGradient(-3, -3, 1, 0, 0, 14);
        g.addColorStop(0, '#f4ffd0');
        g.addColorStop(1, '#6dbb4a');
        fillOutline(c, g, 1.6);
        c.fillStyle = OUT;
        c.beginPath(); c.arc(3, 2, 2, 0, Math.PI * 2); c.fill();
        break;
      }
    }
    c.restore();
  }

  function drawDrop(c, d, t) {
    c.save();
    c.translate(d.x, d.y);
    if (d.kind === 'coin') {
      const sx = Math.max(0.15, Math.abs(Math.cos(t * 5 + d.t)));
      c.scale(sx, 1);
      const g = c.createRadialGradient(-2, -2, 1, 0, 0, 8);
      g.addColorStop(0, '#fff7c2');
      g.addColorStop(0.5, '#ffd23f');
      g.addColorStop(1, '#c98a12');
      c.beginPath();
      c.arc(0, 0, 7, 0, Math.PI * 2);
      fillOutline(c, g, 1.5);
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(-2.5, -2.5, 1.4, 0, Math.PI * 2); c.fill();
    } else {
      // 藥水
      c.beginPath();
      c.moveTo(-4, -10); c.lineTo(4, -10); c.lineTo(4, -6);
      c.quadraticCurveTo(9, -3, 9, 3);
      c.quadraticCurveTo(9, 9, 0, 9);
      c.quadraticCurveTo(-9, 9, -9, 3);
      c.quadraticCurveTo(-9, -3, -4, -6);
      c.closePath();
      const g = c.createLinearGradient(0, -10, 0, 9);
      g.addColorStop(0, '#ffb3b3');
      g.addColorStop(1, '#e02e4e');
      fillOutline(c, g, 1.5);
      c.fillStyle = '#c9a26b';
      c.fillRect(-4.5, -13, 9, 4);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(-3, 2, 1.6, 0, Math.PI * 2); c.fill();
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
