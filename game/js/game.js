// 遊戲主邏輯：場景切換、輸入、物理、戰鬥、任務、NPC、HUD
'use strict';

(() => {
  const W = 1280, H = 720, GRAV = 1800, MAXFALL = 920, FLOOR = 600;
  const OUT_COLOR = '#2b1d3a';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  // ---------- 輸入 ----------
  // P1：方向鍵 + Alt 跳 + Z 攻擊 / X 技能1 / C 技能2 / V 藥水
  // P2：WASD + Space 跳 + G 攻擊 / H 技能1 / J 技能2 / K 藥水
  const BIND = [
    { L: 'ArrowLeft', R: 'ArrowRight', U: 'ArrowUp', D: 'ArrowDown', J: ['AltLeft', 'AltRight'], A: 'KeyZ', S1: 'KeyX', S2: 'KeyC', P: 'KeyV' },
    { L: 'KeyA', R: 'KeyD', U: 'KeyW', D: 'KeyS', J: ['Space'], A: 'KeyG', S1: 'KeyH', S2: 'KeyJ', P: 'KeyK' },
  ];
  const GAME_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'AltLeft', 'AltRight', 'Space',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyG', 'KeyH', 'KeyJ', 'KeyK',
    'Enter', 'Escape', 'KeyM',
  ]);
  const down = new Set();
  const pressed = new Set();

  addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    AUDIO.ensure(); // 第一次按鍵即可啟動音訊（瀏覽器需要使用者手勢）
    if (!e.repeat) pressed.add(e.code);
    down.add(e.code);
    if (e.code === 'KeyM' && !e.repeat) {
      AUDIO.toggleMute();
      showToast(AUDIO.isMuted() ? '已靜音' : '音效與配樂已開啟');
    }
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const dn = (pi, a) => {
    const b = BIND[pi][a];
    return Array.isArray(b) ? b.some((k) => down.has(k)) : down.has(b);
  };
  const pr = (pi, a) => {
    const b = BIND[pi][a];
    return Array.isArray(b) ? b.some((k) => pressed.has(k)) : pressed.has(b);
  };

  // ---------- 小工具 ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- 狀態 ----------
  let scene = 'title'; // title | select | play
  const sel = [
    { idx: 0, state: 'picking' }, // P1 預設在選角，按 Z 確認
    { idx: 1, state: 'out' },    // P2 需按 G 加入
  ];
  let players = [];
  let mapId = 'village';
  let map = MAPS.village;
  let surfaces = [];
  let monsters = [];
  let slots = [];
  let projectiles = [];
  let hitboxes = [];
  let drops = [];
  let fx = [];
  let texts = [];
  let cam = { x: 0 };
  let quests = {};
  let bossDefeated = false;
  let ui = null;
  let paused = false;
  let toast = null;
  let toastT = 0;
  let time = 0;
  let shake = 0;
  let pendingEnding = 0;
  let kills = 0;
  let musicBoss = false;

  function freshQuests() {
    return { q1: { s: 'none', p: 0 }, q2: { s: 'none', p: 0 }, q3: { s: 'none', p: 0 } };
  }

  function showToast(text) {
    toast = text;
    toastT = 2.6;
  }

  // ---------- 角色 ----------
  function recalc(p) {
    const c = p.C;
    const k = p.lv - 1;
    p.hpMax = c.hp + k * 26;
    p.mpMax = c.mp + k * 7;
    p.dmg = c.dmg * (1 + k * 0.12);
  }

  function makePlayer(i, cls) {
    const p = {
      i, C: CLASSES[cls], lv: 1, exp: 0, meso: 0, potions: 2,
      x: 0, y: 0, w: 26, h: 46, vx: 0, vy: 0, face: 1,
      onGround: false, coyote: 0, jumpBuf: 0, dropT: 0, climb: null, ropeCD: 0,
      lastGroundX: 120, walkPh: 0,
      hp: 1, hpMax: 1, mp: 0, mpMax: 0, dmg: 1,
      atkCd: 0, atkT: 0, cd1: 0, cd1Max: 1, cd2: 0, cd2Max: 1,
      buffT: 0, shieldT: 0, invT: 0, hurtT: 0,
      dead: false, reviveT: 0, reviveProg: 0,
    };
    recalc(p);
    p.hp = p.hpMax;
    p.mp = p.mpMax;
    return p;
  }

  function alivePlayers() {
    const a = players.filter((p) => !p.dead);
    return a.length ? a : players;
  }

  function gainExp(p, amt) {
    p.exp += amt;
    let leveled = false;
    while (p.lv < MAX_LV && p.exp >= LEVEL_EXP(p.lv)) {
      p.exp -= LEVEL_EXP(p.lv);
      p.lv++;
      recalc(p);
      p.hp = p.hpMax;
      p.mp = p.mpMax;
      leveled = true;
    }
    if (leveled) {
      AUDIO.play('lvl');
      texts.push({ text: 'LEVEL UP!', x: p.x + p.w / 2, y: p.y - 30, vy: -50, life: 1.6, col: '#ffe066', big: true });
      burst(p.x + p.w / 2, p.y + p.h / 2, ['#ffe066', '#fff', '#8ff'], 24);
    }
  }

  // ---------- 地形 ----------
  function surfaceBelow(x, y) {
    // 落點：在 x 上、位於 y 以下的最高平面（最小 s.y ≥ y-2）
    let best = null;
    for (const s of surfaces) {
      if (x < s.x || x > s.x + s.w) continue;
      if (s.y >= y - 2 && (best === null || s.y < best)) best = s.y;
    }
    return best === null ? 900 : best;
  }

  function groundAt(x) {
    // 出生點：x 位置最低（畫面上最下方）的平面
    let best = FLOOR;
    for (const s of surfaces) {
      if (x >= s.x && x <= s.x + s.w && s.y > best - 1 && s.y <= FLOOR) best = Math.max(best, s.y);
    }
    return best;
  }

  // ---------- 地圖 ----------
  function loadMap(id, arriveX) {
    mapId = id;
    map = MAPS[id];
    surfaces = [
      ...map.floor.map((f) => ({ x: f.x, y: f.y, w: f.w, ground: true })),
      ...map.platforms.map((f) => ({ x: f.x, y: f.y, w: f.w, ground: false })),
    ];
    monsters = [];
    projectiles = [];
    hitboxes = [];
    drops = [];
    fx = [];
    texts = [];
    slots = map.spawns.map((sp) => ({ sp, cool: 0 }));
    slots.forEach((s) => {
      for (let k = 0; k < s.sp.n; k++) spawnFromSlot(s);
    });
    if (map.boss && !bossDefeated) {
      monsters.push(makeBoss());
      musicBoss = true;
    } else {
      musicBoss = false;
    }
    players.forEach((p) => {
      p.x = arriveX + p.i * 40 - 20;
      p.y = groundAt(p.x + p.w / 2) - p.h;
      p.vx = 0;
      p.vy = 0;
      p.climb = null;
      p.dropT = 0;
      p.lastGroundX = p.x;
      if (p.dead) {
        p.dead = false;
        p.hp = Math.round(p.hpMax * 0.5);
      }
      p.invT = 1.5;
    });
    cam.x = clamp(alivePlayers()[0].x - W / 2, 0, Math.max(0, map.w - W));
    showToast(map.name);
    updateMusic();
  }

  function updateMusic() {
    if (scene === 'title' || scene === 'select') {
      AUDIO.setMusic('village');
      return;
    }
    if (musicBoss) AUDIO.setMusic('boss');
    else AUDIO.setMusic(map.theme === 'dawn' ? 'village' : map.theme === 'forest' ? 'grove' : 'cloud');
  }

  // ---------- 怪物 ----------
  function spawnFromSlot(s) {
    const sp = s.sp;
    const def = MONSTERS[sp.type];
    let x, y;
    if (def.flying) {
      x = rand(sp.x0, sp.x1);
      y = rand(sp.y0, sp.y1);
    } else {
      x = rand(sp.x0, sp.x1);
      y = sp.y - def.h;
    }
    monsters.push({
      boss: false, type: sp.type, def, slot: s, name: def.name,
      x, y, w: def.w, h: def.h, hp: def.hp, maxHp: def.hp,
      dir: Math.random() < 0.5 ? -1 : 1, x0: sp.x0, x1: sp.x1, baseY: y,
      hitT: 0, kb: 0, t: Math.random() * 6, dead: false,
      flying: !!def.flying, dmg: def.dmg, speed: def.speed,
    });
  }

  function makeBoss() {
    const n = players.length;
    const maxHp = Math.round(BOSS.hp * (1 + 0.6 * (n - 1)));
    return {
      boss: true, type: 'sporeking', name: BOSS.name,
      x: 1000, y: FLOOR - BOSS.h, w: BOSS.w, h: BOSS.h,
      hp: maxHp, maxHp, dmg: BOSS.dmg, dead: false, hitT: 0, kb: 0, t: 0, face: -1,
      state: 'wait', timer: 2.2, last: '', then: '', spawnLeft: 0, spawnT: 0,
      cdir: 1, charging: false, flying: false, dir: -1,
    };
  }

  function killMonster(m) {
    m.dead = true;
    kills++;
    const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
    burst(cx, cy, ['#9fd8ff', '#4fa8f0', '#fff'], 12);
    AUDIO.play('death');
    alivePlayers().forEach((p) => gainExp(p, m.def.exp));
    const n = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      drops.push({
        kind: 'coin', x: cx, y: cy, vx: rand(-140, 140), vy: rand(-380, -200),
        val: Math.round(rand(m.def.meso[0], m.def.meso[1])), t: Math.random() * 6,
        landed: false, life: 14, r: 7,
      });
    }
    if (Math.random() < m.def.pot) {
      drops.push({ kind: 'pot', x: cx, y: cy, vx: rand(-80, 80), vy: -320, t: 0, landed: false, life: 14, r: 10 });
    }
    questKill(m.type);
  }

  function questKill(type) {
    for (const id of Object.keys(QUESTS)) {
      const q = QUESTS[id];
      const st = quests[id];
      if (!st || st.s !== 'active' || q.need[type] == null) continue;
      st.p = Math.min(q.need[type], st.p + 1);
      if (st.p >= q.need[type]) {
        st.s = 'ready';
        AUDIO.play('quest');
        showToast(`任務可交回：${q.title}（找村長）`);
      }
    }
  }

  function bossDown(b) {
    b.dead = true;
    bossDefeated = true;
    shake = 18;
    AUDIO.play('boss');
    for (let k = 0; k < 6; k++) burst(b.x + b.w / 2 + rand(-60, 60), b.y + rand(20, 120), ['#ff9ad5', '#ffe066', '#fff'], 16);
    alivePlayers().forEach((p) => {
      gainExp(p, BOSS.exp);
      p.meso += QUESTS.q3.reward.meso;
    });
    quests.q3.s = 'done';
    pendingEnding = 1.8;
    showToast('孢子王倒下了……');
  }

  function openEnding() {
    openUI('星核重燃', [
      '孢子王摩古的身體化作光屑，回到了它原本的樣子——森林的守護者。',
      '星核重新發出溫暖的光，漂浮的島嶼慢慢停止了下沉。',
      `你們擊敗了 ${kills} 隻怪物。星砂群島重獲安寧，但霧影的源頭仍未被找到……`,
    ], [], 0);
    AUDIO.play('quest');
  }

  // ---------- 戰鬥 ----------
  function calcDmg(p, mult) {
    let v = p.dmg * mult * rand(0.9, 1.1);
    const crit = Math.random() < 0.1;
    if (crit) v *= 1.6;
    return { v: Math.max(1, Math.round(v)), crit };
  }

  function applyHit(m, d, fromX) {
    if (m.dead) return;
    m.hp -= d.v;
    m.hitT = 0.14;
    if (!m.boss) m.kb = Math.sign(m.x - fromX || 1) * 110;
    texts.push({
      text: String(d.v), x: m.x + m.w / 2, y: m.y, vy: -70, life: 0.8,
      col: d.crit ? '#ffd93d' : '#ffffff', big: d.crit,
    });
    if (m.boss) AUDIO.play(d.crit ? 'crit' : 'bossHit');
    else AUDIO.play(d.crit ? 'crit' : 'hit');
    burst(m.x + m.w / 2, m.y + m.h / 2, d.crit ? ['#ffd93d', '#fff'] : ['#ffffff', '#ffe0a0'], d.crit ? 10 : 5);
    if (m.hp <= 0) {
      if (m.boss) bossDown(m);
      else killMonster(m);
    }
  }

  function hurt(p, dmg, fromX) {
    if (p.dead || p.invT > 0 || p.shieldT > 0) return;
    p.hp -= dmg;
    p.invT = 0.9;
    p.hurtT = 0.3;
    p.vx = Math.sign(p.x + p.w / 2 - fromX || 1) * 180;
    p.vy = -260;
    p.climb = null;
    texts.push({ text: '-' + dmg, x: p.x + p.w / 2, y: p.y, vy: -60, life: 0.9, col: '#ff6b6b', big: false });
    AUDIO.play('hurt');
    shake = Math.max(shake, 4);
    if (p.hp <= 0) die(p);
  }

  function die(p) {
    p.hp = 0;
    p.dead = true;
    p.reviveT = 6;
    p.climb = null;
    p.vx = 0;
    p.vy = 0;
    AUDIO.play('death');
    showToast(`P${p.i + 1} 倒下了：同伴按住 ↑ 可以復活（6 秒後自動復活）`);
  }

  function respawn(p, frac) {
    p.dead = false;
    p.hp = Math.max(1, Math.round(p.hpMax * frac));
    p.invT = 2;
    p.vx = 0;
    p.vy = 0;
    p.climb = null;
    p.x = map.start + p.i * 36;
    p.y = groundAt(p.x + p.w / 2) - p.h;
  }

  function addHitbox(p, x, y, w, h, mult, life, kind) {
    hitboxes.push({ x, y, w, h, owner: p, mult, life, kind, hits: new Set() });
  }

  function addProj(p, o) {
    const d = calcDmg(p, o.mult);
    projectiles.push(Object.assign({
      owner: p, enemy: false, dmg: d.v, crit: d.crit, life: 1, grav: 0, pierce: false,
      explode: false, rot: 0, hits: new Set(), dead: false, kind: 'arrow',
    }, o));
  }

  function explode(pr) {
    const R = 120;
    shake = Math.max(shake, 8);
    AUDIO.play('explode');
    fx.push({ kind: 'ring', x: pr.x, y: pr.y, life: 0.4, max: 0.4, col: '#ff8bd6', r: R });
    burst(pr.x, pr.y, ['#ff8bd6', '#ffe066', '#fff'], 22);
    for (const m of monsters) {
      if (m.dead) continue;
      const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
      if (Math.hypot(cx - pr.x, cy - pr.y) < R + m.w / 2) applyHit(m, { v: pr.dmg, crit: pr.crit }, pr.x);
    }
  }

  function doAttack(p) {
    const C = p.C;
    p.atkCd = C.cd * (p.buffT > 0 ? 0.7 : 1);
    p.atkT = 0.24;
    const f = p.face;
    const cx = p.x + p.w / 2;
    if (C.id === 'knight') {
      addHitbox(p, f > 0 ? p.x + p.w - 4 : p.x - 56, p.y + 6, 60, p.h - 10, 1.0, 0.14, 'slash');
      fx.push({ kind: 'slash', x: cx + f * 22, y: p.y + p.h / 2, face: f, life: 0.16, max: 0.16, col: '#dff3ff', w: 56 });
      AUDIO.play('swing');
    } else if (C.id === 'mage') {
      addProj(p, { kind: 'bolt', x: cx + f * 14, y: p.y + 18, vx: f * 460, vy: 0, w: 16, h: 16, life: 1.1, mult: 1.0, col: '#c58bff' });
      AUDIO.play('swing');
    } else {
      addProj(p, { kind: 'arrow', x: cx + f * 14, y: p.y + 18, vx: f * 720, vy: -40, w: 24, h: 6, life: 1.2, grav: 120, mult: 0.95 });
      AUDIO.play('swing');
    }
  }

  function doSkill1(p) {
    const C = p.C;
    p.mp -= C.s1.mp;
    p.cd1 = p.cd1Max = C.s1.cd;
    p.atkT = 0.3;
    const f = p.face;
    const cx = p.x + p.w / 2;
    AUDIO.play('skill');
    if (C.id === 'knight') {
      addHitbox(p, p.x - 90, p.y - 10, p.w + 180, p.h + 20, 2.2, 0.2, 'wide');
      fx.push({ kind: 'slash', x: cx, y: p.y + p.h / 2, face: f, life: 0.3, max: 0.3, col: '#8fd0ff', w: 150, big: true });
      fx.push({ kind: 'ring', x: cx, y: p.y + p.h, life: 0.35, max: 0.35, col: '#8fd0ff', r: 90 });
      shake = Math.max(shake, 5);
    } else if (C.id === 'mage') {
      addProj(p, { kind: 'star', x: cx + f * 14, y: p.y + 16, vx: f * 380, vy: 0, w: 22, h: 22, life: 0.9, mult: 2.2, explode: true, col: '#ff8bd6' });
    } else {
      for (const k of [-1, 0, 1]) {
        addProj(p, { kind: 'arrow', x: cx + f * 14, y: p.y + 16 + k * 4, vx: f * 680, vy: k * 70, w: 24, h: 6, life: 0.9, mult: 0.8 });
      }
    }
  }

  function doSkill2(p) {
    const C = p.C;
    p.mp -= C.s2.mp;
    p.cd2 = p.cd2Max = C.s2.cd;
    const cx = p.x + p.w / 2;
    if (C.id === 'knight') {
      alivePlayers().forEach((q) => {
        if (Math.abs(q.x - p.x) < 160) {
          q.shieldT = 3;
          fx.push({ kind: 'ring', x: q.x + q.w / 2, y: q.y + q.h / 2, life: 0.5, max: 0.5, col: '#8fe8ff', r: 60 });
        }
      });
      AUDIO.play('shield');
    } else if (C.id === 'mage') {
      const amt = 30 + p.lv * 4;
      alivePlayers().forEach((q) => {
        if (Math.abs(q.x - p.x) < 280 && !q.dead) {
          const before = q.hp;
          q.hp = Math.min(q.hpMax, q.hp + amt);
          texts.push({ text: '+' + (q.hp - before), x: q.x + q.w / 2, y: q.y, vy: -60, life: 0.9, col: '#7dff9a', big: false });
          fx.push({ kind: 'ring', x: q.x + q.w / 2, y: q.y + q.h / 2, life: 0.6, max: 0.6, col: '#7dff9a', r: 70 });
        }
      });
      AUDIO.play('heal');
    } else {
      p.buffT = 4;
      fx.push({ kind: 'ring', x: cx, y: p.y + p.h / 2, life: 0.4, max: 0.4, col: '#b8f08a', r: 50 });
      AUDIO.play('skill');
    }
  }

  function usePotion(p) {
    if (p.potions <= 0 || p.hp >= p.hpMax || p.dead) return;
    p.potions--;
    const before = p.hp;
    p.hp = Math.min(p.hpMax, p.hp + 60);
    texts.push({ text: '+' + (p.hp - before), x: p.x + p.w / 2, y: p.y, vy: -60, life: 0.9, col: '#7dff9a', big: false });
    burst(p.x + p.w / 2, p.y + p.h / 2, ['#ff6b8a', '#7dff9a'], 10);
    AUDIO.play('potion');
  }

  // ---------- 特效 ----------
  function burst(x, y, cols, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(60, 260);
      fx.push({
        kind: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
        life: rand(0.35, 0.7), max: 0.7, col: cols[i % cols.length], size: rand(2, 4.5),
      });
    }
  }

  function updateFx(dt) {
    for (const e of fx) {
      e.life -= dt;
      if (e.kind === 'p') {
        e.vy += 500 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx *= 0.96;
      }
    }
    fx = fx.filter((e) => e.life > 0);
    for (const t of texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 0.94;
    }
    texts = texts.filter((t) => t.life > 0);
  }

  // ---------- NPC / 任務 ----------
  function openUI(title, lines, options, owner) {
    ui = { title, lines, options, idx: 0, owner };
  }

  function acceptQuest(id) {
    quests[id].s = 'active';
    quests[id].p = 0;
    AUDIO.play('quest');
    showToast(`接受任務：${QUESTS[id].title}`);
  }

  function turnIn(id) {
    const q = QUESTS[id];
    quests[id].s = 'done';
    alivePlayers().forEach((p) => {
      p.meso += q.reward.meso;
      gainExp(p, q.reward.exp);
    });
    AUDIO.play('quest');
    showToast(`任務完成：${q.title}（+${q.reward.meso} 星幣）`);
    if (id === 'q2') {
      quests.q3.s = 'active';
      showToast('新任務：星核的真相（雲端空島右側的星核殿）');
    }
  }

  function buy(pi) {
    const p = players.find((q) => q.i === pi);
    if (!p) return;
    if (p.meso < POTION_PRICE) {
      showToast('星幣不足');
      AUDIO.play('ui');
      return;
    }
    if (p.potions >= 9) {
      showToast('藥水已達上限（9 瓶）');
      return;
    }
    p.meso -= POTION_PRICE;
    p.potions++;
    AUDIO.play('coin');
    showToast(`購買星砂藥水，剩餘 ${p.potions} 瓶`);
  }

  function talkElder(pi) {
    const Q = quests;
    const name = '村長 奧托';
    if (Q.q1.s === 'none') {
      return openUI(name, ['星砂村的田地被藍史萊姆搗亂了……', '能請你去蘑菇林清理牠們嗎？'],
        [{ label: `接受任務「${QUESTS.q1.title}」`, fn: () => acceptQuest('q1') }, { label: '我再想想' }], pi);
    }
    if (Q.q1.s === 'active') {
      return openUI(name, [`還差 ${QUESTS.q1.need.slime - Q.q1.p} 隻藍史萊姆。`], [], pi);
    }
    if (Q.q1.s === 'ready') {
      return openUI(name, ['幹得好！這是村子的謝禮。'], [{ label: '領取獎勵', fn: () => turnIn('q1') }], pi);
    }
    if (Q.q2.s === 'none') {
      return openUI(name, ['雲端空島出現了會飛的雲精靈……', '你願意再幫忙一次嗎？'],
        [{ label: `接受任務「${QUESTS.q2.title}」`, fn: () => acceptQuest('q2') }, { label: '下次再說' }], pi);
    }
    if (Q.q2.s === 'active') {
      return openUI(name, [`雲精靈還差 ${QUESTS.q2.need.wisp - Q.q2.p} 隻。`], [], pi);
    }
    if (Q.q2.s === 'ready') {
      return openUI(name, ['你做到了！星核的裂痕正在收斂。'], [{ label: '領取獎勵', fn: () => turnIn('q2') }], pi);
    }
    if (!bossDefeated) {
      return openUI(name, ['星核殿的大門已經開啟。', '雲端空島最右側，孢子王摩古正守著星核。'], [], pi);
    }
    return openUI(name, ['星核重新發光了……謝謝你，星砂騎士。'], [], pi);
  }

  function talkShop(pi) {
    openUI('藥水商人 米可', [
      '要買星砂藥水嗎？一瓶 25 星幣，能回復 60 點生命。',
      '（星幣是你從怪物身上撿到的金色硬幣）',
    ], [{ label: `購買 1 瓶（${POTION_PRICE} 星幣）`, fn: () => buy(pi) }, { label: '離開' }], pi);
  }

  function interact(p) {
    const cx = p.x + p.w / 2;
    for (const n of map.npcs) {
      if (Math.abs(cx - n.x) < 70 && p.y + p.h > FLOOR - 60) {
        if (n.id === 'elder') talkElder(p.i);
        else if (n.id === 'shop') talkShop(p.i);
        AUDIO.play('ui');
        return true;
      }
    }
    for (const pt of map.portals) {
      const rect = { x: pt.x - 34, y: FLOOR - 100, w: 68, h: 110 };
      if (overlap(p, rect)) {
        if (pt.gate && quests[pt.gate].s !== 'done') {
          showToast(pt.gateMsg || '目前無法前往。');
          AUDIO.play('ui');
          return true;
        }
        AUDIO.play('portal');
        loadMap(pt.to, pt.arriveX);
        return true;
      }
    }
    return false;
  }

  // ---------- 玩家更新 ----------
  function updatePlayer(p, dt) {
    p.atkCd -= dt;
    p.cd1 -= dt;
    p.cd2 -= dt;
    p.invT -= dt;
    p.shieldT -= dt;
    p.buffT -= dt;
    p.hurtT -= dt;
    p.atkT -= dt;
    p.ropeCD -= dt;
    p.dropT -= dt;
    p.mp = Math.min(p.mpMax, p.mp + 3 * dt);

    if (p.dead) {
      p.vx = 0;
      p.vy = 0;
      p.reviveT -= dt;
      if (p.reviveT <= 0) respawn(p, 0.3);
      return;
    }

    const i = p.i;
    const inp = !ui;
    const L = inp && dn(i, 'L');
    const R = inp && dn(i, 'R');
    const U = inp && dn(i, 'U');
    const D = inp && dn(i, 'D');
    const jumpPressed = inp && pr(i, 'J');
    p.jumpBuf = jumpPressed ? 0.12 : p.jumpBuf - dt;

    if (inp && pr(i, 'U') && !p.climb) {
      if (interact(p)) return;
    }
    // 繩索
    if (!p.climb && U && p.ropeCD <= 0) {
      const cx = p.x + p.w / 2;
      for (const r of map.ropes) {
        if (Math.abs(cx - r.x) < 14 && p.y + p.h > r.top && p.y < r.bottom + 4) {
          p.climb = r;
          p.vx = 0;
          p.vy = 0;
          break;
        }
      }
    }

    if (p.climb) {
      const r = p.climb;
      p.vx = 0;
      p.vy = 0;
      p.x = r.x - p.w / 2;
      if (U) p.y -= 120 * dt;
      if (D) p.y += 120 * dt;
      if (p.y + p.h <= r.top + 6) {
        p.y = r.top - p.h;
        p.climb = null;
        p.onGround = true;
        p.ropeCD = 0.3;
      } else if (p.y + p.h >= r.bottom) {
        p.y = r.bottom - p.h;
        p.climb = null;
      }
      if (p.climb && jumpPressed) {
        p.climb = null;
        p.vy = -420;
        p.vx = (L ? -1 : R ? 1 : 0) * 180;
        p.ropeCD = 0.35;
        p.jumpBuf = 0;
        AUDIO.play('jump');
      } else if (p.climb && (L || R)) {
        p.climb = null;
        p.ropeCD = 0.35;
      }
      if (p.climb) {
        p.walkPh += dt * 6;
        return;
      }
    }

    const mv = (R ? 1 : 0) - (L ? 1 : 0);
    if (mv) p.face = mv;
    const speed = 230 * (p.buffT > 0 ? 1.5 : 1);
    p.vx = mv * speed * (p.atkT > 0 ? 0.45 : 1);

    if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0)) {
      if (D && p.onGround) {
        p.dropT = 0.28;
        p.vy = 120;
      } else {
        p.vy = -640;
        AUDIO.play('jump');
      }
      p.jumpBuf = 0;
      p.coyote = 0;
      p.onGround = false;
    }

    if (inp) {
      if (pr(i, 'A') && p.atkCd <= 0 && p.atkT <= 0.02) doAttack(p);
      if (pr(i, 'S1') && p.cd1 <= 0 && p.mp >= p.C.s1.mp) doSkill1(p);
      if (pr(i, 'S2') && p.cd2 <= 0 && p.mp >= p.C.s2.mp) doSkill2(p);
      if (pr(i, 'P')) usePotion(p);
    }

    // 物理
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);
    p.x = clamp(p.x + p.vx * dt, 0, map.w - p.w);
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    p.onGround = false;
    if (p.dropT <= 0 && p.vy >= 0) {
      for (const s of surfaces) {
        if (prevBottom <= s.y + 2 && p.y + p.h >= s.y && p.x + p.w > s.x + 4 && p.x < s.x + s.w - 4) {
          p.y = s.y - p.h;
          p.vy = 0;
          p.onGround = true;
          break;
        }
      }
    }
    p.coyote = p.onGround ? 0.1 : p.coyote - dt;
    if (p.onGround) p.lastGroundX = p.x;
    if (p.onGround && Math.abs(p.vx) > 5) p.walkPh += dt * Math.abs(p.vx) * 0.09;

    // 掉出地圖：回到最後踩過的地面，扣血
    if (p.y > H + 80) {
      p.x = p.lastGroundX;
      p.y = groundAt(p.x + p.w / 2) - p.h;
      p.vy = 0;
      p.hp -= Math.round(p.hpMax * 0.08);
      hurt(p, 0, p.x);
      if (p.hp <= 0) die(p);
    }
  }

  function updateRevive(dt) {
    for (const p of players) {
      if (p.dead) continue;
      const holding = !ui && dn(p.i, 'U');
      let target = null;
      if (holding) {
        for (const q of players) {
          if (q.dead && Math.abs(q.x - p.x) < 60 && Math.abs(q.y - p.y) < 60) target = q;
        }
      }
      if (target) {
        p.reviveProg += dt;
        if (p.reviveProg >= 1.5) {
          p.reviveProg = 0;
          target.dead = false;
          target.hp = Math.round(target.hpMax * 0.5);
          target.invT = 2;
          texts.push({ text: '復活！', x: target.x + target.w / 2, y: target.y, vy: -50, life: 1.2, col: '#7dff9a', big: true });
          AUDIO.play('heal');
        }
      } else {
        p.reviveProg = 0;
      }
    }
  }

  // ---------- 怪物 / 王 ----------
  function updateBoss(b, dt) {
    const ph2 = b.hp < b.maxHp * 0.5;
    b.t += dt;
    b.timer -= dt;
    const target = nearestAlive(b);
    if (target) b.face = target.x + target.w / 2 > b.x + b.w / 2 ? 1 : -1;

    if (b.state === 'wait') {
      if (b.timer <= 0) {
        const opts = ph2 ? ['wave', 'spore', 'charge', 'jump'] : ['wave', 'spore', 'charge'];
        let nx;
        do {
          nx = opts[Math.floor(Math.random() * opts.length)];
        } while (nx === b.last && opts.length > 1);
        b.last = nx;
        if (nx === 'charge') {
          b.state = 'charge';
          b.cdir = target && target.x > b.x ? 1 : -1;
          b.charging = true;
          b.timer = 0.95;
          AUDIO.play('charge');
        } else if (nx === 'spore') {
          b.state = 'spore';
          b.spawnLeft = ph2 ? 9 : 6;
          b.spawnT = 0;
          b.face = b.face;
        } else {
          b.state = 'air';
          b.then = nx === 'jump' ? 'none' : 'wave';
          b.vy = -780;
        }
      }
    } else if (b.state === 'air') {
      b.vy += GRAV * dt;
      b.y += b.vy * dt;
      if (b.y >= FLOOR - b.h) {
        b.y = FLOOR - b.h;
        b.vy = 0;
        shake = Math.max(shake, 10);
        burst(b.x + b.w / 2, FLOOR, ['#d7b8ff', '#fff'], 14);
        AUDIO.play('explode');
        if (b.then === 'wave') {
          for (const d of [-1, 1]) {
            projectiles.push({
              enemy: true, kind: 'wave', x: b.x + b.w / 2, y: FLOOR - 36, vx: d * 300, vy: 0,
              w: 60, h: 36, dmg: 16, life: 4, grav: 0, dead: false, rot: 0, hits: new Set(),
            });
          }
        }
        b.state = 'wait';
        b.timer = ph2 ? 0.8 : 1.2;
      }
    } else if (b.state === 'spore') {
      b.spawnT -= dt;
      if (b.spawnLeft > 0 && b.spawnT <= 0) {
        b.spawnLeft--;
        b.spawnT = 0.3;
        projectiles.push({
          enemy: true, kind: 'spore', x: rand(40, map.w - 40), y: 40, vx: 0, vy: 60,
          w: 22, h: 22, dmg: 12, life: 6, grav: 520, dead: false, rot: 0, hits: new Set(),
        });
      }
      if (b.spawnLeft <= 0) {
        b.state = 'wait';
        b.timer = ph2 ? 0.9 : 1.3;
      }
    } else if (b.state === 'charge') {
      b.x = clamp(b.x + b.cdir * (ph2 ? 520 : 430) * dt, 0, map.w - b.w);
      if (b.timer <= 0) {
        b.state = 'wait';
        b.charging = false;
        b.timer = ph2 ? 1.0 : 1.4;
      }
    }
    if (b.state !== 'charge') b.charging = false;
  }

  function nearestAlive(e) {
    let best = null, bd = Infinity;
    for (const p of players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - e.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function updateMonsters(dt) {
    for (const m of monsters) {
      if (m.dead) continue;
      m.t += dt;
      m.hitT -= dt;
      m.kb *= Math.pow(0.02, dt);
      if (m.boss) {
        updateBoss(m, dt);
      } else if (m.flying) {
        const target = nearestAlive({ x: m.x, y: m.y, w: m.w, h: m.h });
        const tp = target && Math.hypot(target.x - m.x, target.y - m.y) < 240 ? target : null;
        if (tp) {
          const dx = tp.x + tp.w / 2 - (m.x + m.w / 2);
          const dy = tp.y + tp.h / 2 - (m.y + m.h / 2);
          const d = Math.hypot(dx, dy) || 1;
          m.x += (dx / d) * m.speed * 0.8 * dt;
          m.y += (dy / d) * m.speed * 0.8 * dt;
          m.dir = dx > 0 ? 1 : -1;
        } else {
          m.x += (m.dir * m.speed + m.kb) * dt;
          m.y = m.baseY + Math.sin(m.t * 2) * 16;
        }
      } else {
        m.x += (m.dir * m.speed + m.kb) * dt;
      }
      if (!m.flying) {
        if (m.x < m.x0) { m.x = m.x0; m.dir = 1; }
        if (m.x > m.x1) { m.x = m.x1; m.dir = -1; }
      } else if (!m.boss) {
        m.x = clamp(m.x, 0, map.w - m.w);
      }
      if (m.boss) m.x = clamp(m.x, 0, map.w - m.w);

      // 接觸傷害
      const dmg = m.boss ? (m.charging ? 22 : 14) : m.dmg;
      for (const p of players) {
        if (!p.dead && overlap(p, m)) hurt(p, dmg, m.x + m.w / 2);
      }
    }
    monsters = monsters.filter((m) => !m.dead);
  }

  function updateSlots(dt) {
    for (const s of slots) {
      const n = monsters.filter((m) => m.slot === s).length;
      if (n < s.sp.n) {
        s.cool -= dt;
        if (s.cool <= 0) {
          spawnFromSlot(s);
          s.cool = 3.5;
        }
      } else {
        s.cool = 3.5;
      }
    }
  }

  function updateHitboxes(dt) {
    for (const h of hitboxes) {
      h.life -= dt;
      for (const m of monsters) {
        if (m.dead || h.hits.has(m)) continue;
        if (overlap(h, m)) {
          h.hits.add(m);
          applyHit(m, calcDmg(h.owner, h.mult), h.owner.x + h.owner.w / 2);
        }
      }
    }
    hitboxes = hitboxes.filter((h) => h.life > 0);
  }

  function updateProjectiles(dt) {
    for (const pr of projectiles) {
      if (pr.dead) continue;
      pr.life -= dt;
      pr.vy += (pr.grav || 0) * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.rot += dt * 10;

      if (pr.life <= 0) {
        if (pr.explode) explode(pr);
        pr.dead = true;
        continue;
      }
      if (pr.enemy) {
        for (const p of players) {
          if (!p.dead && overlap(p, pr)) {
            hurt(p, pr.dmg, pr.x);
            pr.dead = true;
            break;
          }
        }
        if (pr.kind === 'spore' && pr.y >= FLOOR - 22) pr.dead = true;
        if (pr.kind === 'wave' && (pr.x < -80 || pr.x > map.w + 80)) pr.dead = true;
        continue;
      }
      // 玩家投射物
      if (pr.x < -60 || pr.x > map.w + 60 || pr.y > H + 60) {
        pr.dead = true;
        continue;
      }
      let hitSomething = false;
      for (const m of monsters) {
        if (m.dead || pr.hits.has(m)) continue;
        if (overlap(pr, m)) {
          pr.hits.add(m);
          hitSomething = true;
          if (pr.explode) {
            explode(pr);
            pr.dead = true;
            break;
          }
          applyHit(m, { v: pr.dmg, crit: pr.crit }, pr.x);
          if (!pr.pierce) {
            pr.dead = true;
            break;
          }
        }
      }
      if (!pr.dead && !hitSomething) {
        for (const s of surfaces) {
          if (pr.x > s.x && pr.x < s.x + s.w && pr.y >= s.y - 2 && pr.y <= s.y + 14 && pr.vy > 0) {
            if (pr.explode) explode(pr);
            pr.dead = true;
            break;
          }
        }
      }
    }
    projectiles = projectiles.filter((pr) => !pr.dead);
  }

  function updateDrops(dt) {
    for (const d of drops) {
      d.t += dt;
      d.life -= dt;
      if (!d.landed) {
        d.vy += 900 * dt;
        d.x += (d.vx || 0) * dt;
        d.y += d.vy * dt;
        d.vx *= 0.98;
        const gy = surfaceBelow(d.x, d.y - d.r) - d.r;
        if (d.y >= gy) {
          d.y = gy;
          if (Math.abs(d.vy) > 140) {
            d.vy *= -0.35;
          } else {
            d.vy = 0;
            d.landed = true;
          }
        }
      }
      // 撿取
      for (const p of players) {
        if (p.dead) continue;
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        const dist = Math.hypot(cx - d.x, cy - d.y);
        if (d.kind === 'coin' && dist < 110 && d.landed) {
          d.x += ((cx - d.x) / dist) * 380 * dt;
          d.y += ((cy - d.y) / dist) * 380 * dt;
        }
        if (dist < (d.kind === 'coin' ? 22 : 30)) {
          if (d.kind === 'coin') {
            p.meso += d.val;
            AUDIO.play('coin');
          } else {
            p.potions = Math.min(9, p.potions + 1);
            AUDIO.play('pickup');
          }
          d.life = -1;
          d.picked = true;
          break;
        }
      }
    }
    drops = drops.filter((d) => d.life > 0);
  }

  function updateCam(dt) {
    const list = alivePlayers();
    const cx = list.reduce((s, p) => s + p.x + p.w / 2, 0) / list.length;
    const target = clamp(cx - W / 2, 0, Math.max(0, map.w - W));
    cam.x += (target - cam.x) * Math.min(1, dt * 6);
  }

  // ---------- 主更新 ----------
  function step(dt) {
    time += dt;
    for (const p of players) updatePlayer(p, dt);
    updateRevive(dt);
    updateMonsters(dt);
    updateSlots(dt);
    updateHitboxes(dt);
    updateProjectiles(dt);
    updateDrops(dt);
    updateFx(dt);
    updateCam(dt);
    if (pendingEnding > 0) {
      pendingEnding -= dt;
      if (pendingEnding <= 0) openEnding();
    }
    if (musicBoss && !monsters.some((m) => m.boss)) {
      musicBoss = false;
      updateMusic();
    }
    toastT -= dt;
    if (toastT <= 0) toast = null;
    shake = Math.max(0, shake - dt * 30);
  }

  function handleUI() {
    const o = ui.owner;
    const n = ui.options.length;
    if (n) {
      if (pr(o, 'U')) { ui.idx = (ui.idx + n - 1) % n; AUDIO.play('ui'); }
      if (pr(o, 'D')) { ui.idx = (ui.idx + 1) % n; AUDIO.play('ui'); }
    }
    if (pr(o, 'A') || pressed.has('Enter')) {
      const cur = ui;
      ui = null;
      if (cur.options.length) {
        AUDIO.play('ui');
        const opt = cur.options[cur.idx];
        if (opt.fn) opt.fn();
      }
    } else if (pr(o, 'S2')) {
      ui = null;
      AUDIO.play('ui');
    }
  }

  function startGame() {
    players = [];
    sel.forEach((s, i) => {
      if (s.state === 'ready') players.push(makePlayer(i, CLASS_IDS[s.idx]));
    });
    quests = freshQuests();
    bossDefeated = false;
    kills = 0;
    pendingEnding = 0;
    ui = null;
    paused = false;
    loadMap('village', 320);
    scene = 'play';
  }

  // ---------- 場景輸入 ----------
  function updateTitle() {
    if (pressed.has('Enter') || pr(0, 'A')) {
      scene = 'select';
      AUDIO.play('ui');
      updateMusic();
    }
  }

  function updateSelect() {
    if (pressed.has('Escape')) {
      scene = 'title';
      updateMusic();
      return;
    }
    // P1：左右選職業、Z 確認
    const s0 = sel[0];
    if (s0.state !== 'ready') {
      if (pr(0, 'L')) s0.idx = (s0.idx + 2) % 3;
      if (pr(0, 'R')) s0.idx = (s0.idx + 1) % 3;
      if (pr(0, 'A')) { s0.state = 'ready'; AUDIO.play('ui'); }
    } else if (pr(0, 'A')) {
      s0.state = 'picking';
      AUDIO.play('ui');
    }
    // P2：A/D 選職業、G 加入 / 確認
    const s1 = sel[1];
    if (s1.state === 'out') {
      if (pr(1, 'A')) { s1.state = 'picking'; AUDIO.play('ui'); }
    } else if (s1.state === 'picking') {
      if (pr(1, 'L')) s1.idx = (s1.idx + 2) % 3;
      if (pr(1, 'R')) s1.idx = (s1.idx + 1) % 3;
      if (pr(1, 'A')) { s1.state = 'ready'; AUDIO.play('ui'); }
    } else if (pr(1, 'A')) {
      s1.state = 'picking';
      AUDIO.play('ui');
    }
    if (pressed.has('Enter') && s0.state === 'ready') startGame();
  }

  function updatePlay(dt) {
    if (pressed.has('Escape') && !ui) paused = !paused;
    if (paused) return;
    if (ui) handleUI();
    step(dt);
  }

  function update(dt) {
    if (scene === 'title') updateTitle();
    else if (scene === 'select') updateSelect();
    else updatePlay(dt);
    pressed.clear();
  }

  // ---------- 繪製 ----------
  function drawTitle() {
    ART.drawBackground(ctx, 'dawn', time * 20, time);
    ctx.fillStyle = 'rgba(20,12,40,0.25)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,220,120,0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#fff6d6';
    ctx.font = 'bold 84px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
    ctx.fillText('星砂群島', W / 2, 180);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffe9a6';
    ctx.font = '22px "Microsoft JhengHei","PingFang TC",sans-serif';
    ctx.fillText('Starsand Isles · 雙人同行冒險', W / 2, 226);

    ctx.fillStyle = 'rgba(20,12,40,0.6)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 380, 262, 760, 230, 16);
    ctx.fill();
    ctx.fillStyle = '#f2ecff';
    ctx.font = '19px "Microsoft JhengHei","PingFang TC",sans-serif';
    STORY.forEach((line, i) => ctx.fillText(line, W / 2, 302 + i * 30));

    const blink = Math.sin(time * 4) > -0.2;
    if (blink) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText('按 Enter 開始冒險', W / 2, 560);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '16px "Microsoft JhengHei","PingFang TC",sans-serif';
    ctx.fillText('M：靜音 / 開啟音效與配樂　　Esc：暫停', W / 2, 610);
  }

  function drawSelect() {
    ART.drawBackground(ctx, 'dawn', 0, time);
    ctx.fillStyle = 'rgba(20,12,40,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff6d6';
    ctx.font = 'bold 40px "Microsoft JhengHei","PingFang TC",sans-serif';
    ctx.fillText('選擇你的職業', W / 2, 90);

    [0, 1].forEach((pi) => {
      const s = sel[pi];
      const x0 = pi === 0 ? 60 : 680;
      ctx.fillStyle = 'rgba(20,12,40,0.7)';
      ctx.beginPath();
      ctx.roundRect(x0, 130, 540, 500, 18);
      ctx.fill();
      ctx.strokeStyle = s.state === 'ready' ? '#7dff9a' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffe9a6';
      ctx.font = 'bold 22px "Microsoft JhengHei","PingFang TC",sans-serif';
      const label = pi === 0 ? 'P1（← → 選擇，Z 確認）' : 'P2（A D 選擇，G 加入 / 確認）';
      ctx.fillText(label, x0 + 270, 170);

      if (s.state === 'out') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Microsoft JhengHei","PingFang TC",sans-serif';
        ctx.fillText('按 G 加入同伴', x0 + 270, 360);
        ctx.font = '16px "Microsoft JhengHei","PingFang TC",sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('也可以只用一人遊玩', x0 + 270, 392);
        return;
      }

      const cls = CLASSES[CLASS_IDS[s.idx]];
      ctx.save();
      ctx.translate(x0 + 270, 322);
      ctx.scale(2.6, 2.6);
      ART.drawPreview(ctx, cls, time);
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(cls.name, x0 + 270, 396);
      ctx.font = '16px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillStyle = '#e8e0ff';
      wrapText(cls.desc, x0 + 270, 422, 480, 22);

      // 數值條
      const bars = [['生命', cls.hp, 150, '#ff5c7a'], ['魔力', cls.mp, 100, '#5ab0ff'], ['攻擊', cls.dmg, 16, '#ffd23f']];
      bars.forEach(([name, v, max, col], k) => {
        const y = 468 + k * 22;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText(name, x0 + 60, y + 12);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x0 + 120, y, 300, 14);
        ctx.fillStyle = col;
        ctx.fillRect(x0 + 120, y, 300 * (v / max), 14);
        ctx.textAlign = 'center';
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffe9a6';
      ctx.font = '15px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(`${cls.s1.name}：${cls.s1.desc}`, x0 + 60, 548);
      ctx.fillText(`${cls.s2.name}：${cls.s2.desc}`, x0 + 60, 572);
      ctx.textAlign = 'center';
      ctx.fillStyle = s.state === 'ready' ? '#7dff9a' : '#ffffff';
      ctx.font = 'bold 18px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(s.state === 'ready' ? '已準備' : '選擇中…', x0 + 270, 608);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = sel[0].state === 'ready' ? '#ffffff' : 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 22px "Microsoft JhengHei","PingFang TC",sans-serif';
    ctx.fillText(sel[0].state === 'ready' ? '按 Enter 出發！' : 'P1 請先按 Z 確認職業', W / 2, 668);
  }

  function wrapText(text, x, y, maxW, lh) {
    let line = '';
    let yy = y;
    for (const ch of text) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, yy);
        line = ch;
        yy += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function drawWorld() {
    ART.drawBackground(ctx, map.theme, cam.x, time);
    ctx.save();
    ctx.translate(-cam.x, 0);
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);

    for (const s of surfaces) ART.drawSurface(ctx, s, map.theme);
    for (const r of map.ropes) ART.drawRope(ctx, r, time);

    const boss = mapId === 'boss';
    for (const pt of map.portals) {
      const locked = !!pt.gate && quests[pt.gate].s !== 'done';
      ART.drawPortal(ctx, pt, time, locked);
      const name = MAPS[pt.to].name;
      ART.drawNameTag(ctx, name, pt.x, FLOOR - 100, '#ffffff');
    }

    for (const n of map.npcs) {
      ctx.save();
      ctx.translate(n.x, FLOOR);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ART.drawChibi(ctx, {
        pal: NPC_PAL[n.kind], style: n.kind, t: time, face: n.kind === 'elder' ? 1 : -1,
        moving: false, phase: 0, airborne: false, atk: -1,
      });
      ctx.restore();
      // 任務標記：可接 / 可交回
      const Q = quests;
      let mark = null;
      if (n.id === 'elder') {
        if (Q.q1.s === 'none' || Q.q2.s === 'none' && Q.q1.s === 'done') mark = '!';
        if (Q.q1.s === 'ready' || Q.q2.s === 'ready') mark = '?';
      }
      if (mark) {
        const bob = Math.sin(time * 4) * 3;
        ctx.fillStyle = '#ffe066';
        ctx.strokeStyle = OUT_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, FLOOR - 92 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = OUT_COLOR;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(mark, n.x, FLOOR - 86 + bob);
      }
      ART.drawNameTag(ctx, n.name, n.x, FLOOR - 62, '#fff6d6');
    }

    for (const d of drops) ART.drawDrop(ctx, d, time);

    for (const m of monsters) {
      if (m.boss) ART.drawBoss(ctx, m, time);
      else if (m.type === 'slime') ART.drawSlime(ctx, m, time);
      else if (m.type === 'mush') ART.drawMush(ctx, m, time);
      else ART.drawWisp(ctx, m, time);
    }

    for (const pr of projectiles) ART.drawProj(ctx, pr, time);
    for (const p of players) ART.drawHero(ctx, p, time);

    // 倒地提示
    for (const p of players) {
      if (!p.dead) continue;
      ART.drawNameTag(ctx, `P${p.i + 1} 倒下了 · 同伴按 ↑ 復活 (${Math.ceil(p.reviveT)}s)`, p.x + p.w / 2, p.y - 12, '#ffd6e0');
    }

    drawFx();
    ctx.restore();
  }

  function drawFx() {
    for (const e of fx) {
      const a = Math.max(0, e.life / e.max);
      if (e.kind === 'p') {
        ctx.globalAlpha = a;
        ctx.fillStyle = e.col;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (0.5 + a * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (e.kind === 'ring') {
        const k = 1 - a;
        ctx.globalAlpha = a;
        ctx.strokeStyle = e.col;
        ctx.lineWidth = 4 * a + 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (0.3 + k * 0.7), 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.kind === 'slash') {
        const k = 1 - a;
        ctx.globalAlpha = a;
        ctx.strokeStyle = e.col;
        ctx.lineWidth = e.big ? 9 : 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const start = e.face > 0 ? -1.2 : Math.PI - 1.2;
        const sweep = e.face > 0 ? 2.4 : -2.4;
        const rad = e.w * 0.5;
        ctx.arc(e.x, e.y, rad, start + sweep * k - 0.4, start + sweep * k + 0.1);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.globalAlpha = clamp(t.life * 2, 0, 1);
      ctx.font = `bold ${t.big ? 26 : 18}px "Arial Black","Microsoft JhengHei",sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(40,20,60,0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.col;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    ctx.textAlign = 'left';
    players.forEach((p) => {
      const x = p.i === 0 ? 16 : W - 16 - 252;
      const y = 16;
      ctx.fillStyle = 'rgba(18,12,36,0.78)';
      ctx.beginPath();
      ctx.roundRect(x, y, 252, 118, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffe9a6';
      ctx.font = 'bold 16px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(`P${p.i + 1}  ${p.C.name}  Lv.${p.lv}`, x + 14, y + 24);

      bar(x + 14, y + 36, 224, 14, Math.max(0, p.hp / p.hpMax), '#ff5c7a', '#ffb3c0', `${Math.max(0, Math.round(p.hp))}/${p.hpMax}`);
      bar(x + 14, y + 56, 224, 12, p.mp / p.mpMax, '#4f8dff', '#a9ccff', `${Math.floor(p.mp)}/${p.mpMax}`);
      bar(x + 14, y + 74, 224, 8, p.exp / LEVEL_EXP(p.lv), '#ffd23f', '#fff1a8', '');

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(`星幣 ${p.meso}`, x + 14, y + 102);
      ctx.fillText(`藥水 ${p.potions}  (${p.i === 0 ? 'V' : 'K'})`, x + 120, y + 102);
    });

    // 技能欄（底部）
    players.forEach((p) => {
      const baseX = p.i === 0 ? 16 : W - 16 - 3 * 64;
      const y = H - 80;
      const slotsDef = [
        { key: p.i === 0 ? 'Z' : 'G', name: '攻擊', cd: 0, cdMax: 1, cost: 0 },
        { key: p.i === 0 ? 'X' : 'H', name: p.C.s1.name, cd: p.cd1, cdMax: p.cd1Max, cost: p.C.s1.mp },
        { key: p.i === 0 ? 'C' : 'J', name: p.C.s2.name, cd: p.cd2, cdMax: p.cd2Max, cost: p.C.s2.mp },
      ];
      slotsDef.forEach((s, k) => {
        const bx = baseX + k * 64;
        ctx.fillStyle = 'rgba(18,12,36,0.8)';
        ctx.beginPath();
        ctx.roundRect(bx, y, 56, 60, 10);
        ctx.fill();
        ctx.strokeStyle = s.cost && p.mp < s.cost ? '#ff5c7a' : 'rgba(255,255,255,0.25)';
        ctx.stroke();
        const ready = s.cd <= 0;
        if (!ready && s.cdMax > 0) {
          const frac = clamp(s.cd / s.cdMax, 0, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(bx + 2, y + 2 + (56 * 0), 52, 56 * frac);
        }
        ctx.fillStyle = '#ffe9a6';
        ctx.font = 'bold 14px "Microsoft JhengHei",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.key, bx + 28, y + 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Microsoft JhengHei","PingFang TC",sans-serif';
        ctx.fillText(s.name, bx + 28, y + 42);
      });
      ctx.textAlign = 'left';
    });

    // 任務追蹤（上方中央）
    const active = Object.keys(QUESTS).filter((id) => quests[id] && (quests[id].s === 'active' || quests[id].s === 'ready'));
    if (active.length) {
      const id = active[0];
      const q = QUESTS[id];
      const st = quests[id];
      const need = Object.values(q.need)[0];
      const label = st.s === 'ready' ? '（可交回）' : `${st.p}/${need}`;
      ctx.fillStyle = 'rgba(18,12,36,0.7)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 150, 12, 300, 52, 12);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9a6';
      ctx.font = 'bold 15px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(`任務：${q.title} ${label}`, W / 2, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(q.desc, W / 2, 54);
    }

    // 地圖名 / 音訊狀態
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '13px "Microsoft JhengHei","PingFang TC",sans-serif';
    ctx.fillText(`${map.name}   ${AUDIO.isMuted() ? '🔇' : '🔊'} M`, W / 2, 84 + (active.length ? 0 : -40));

    // Boss 血條
    const b = monsters.find((m) => m.boss && !m.dead);
    if (b) {
      ctx.fillStyle = 'rgba(18,12,36,0.8)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 300, 100, 600, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#ffe9a6';
      ctx.font = 'bold 15px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(b.name, W / 2, 118);
      bar(W / 2 - 280, 124, 560, 10, b.hp / b.maxHp, '#b56cff', '#e7c9ff', '');
    }
    ctx.textAlign = 'left';
  }

  function bar(x, y, w, h, frac, c1, c2, text) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    const fw = Math.max(0, Math.min(1, frac)) * w;
    if (fw > 1) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, c2);
      g.addColorStop(1, c1);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, fw, h, h / 2);
      ctx.fill();
    }
    if (text) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${h > 12 ? 11 : 10}px "Arial",sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, x + w / 2, y + h - 3);
      ctx.textAlign = 'left';
    }
  }

  function drawUI() {
    if (toast && toastT > 0) {
      ctx.globalAlpha = clamp(toastT, 0, 1);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(18,12,36,0.8)';
      ctx.font = 'bold 17px "Microsoft JhengHei","PingFang TC",sans-serif';
      const w = ctx.measureText(toast).width + 40;
      ctx.beginPath();
      ctx.roundRect(W / 2 - w / 2, 160, w, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#fff6d6';
      ctx.fillText(toast, W / 2, 186);
      ctx.globalAlpha = 1;
    }

    if (ui) {
      const bx = 240, by = 420, bw = 800, bh = 230;
      ctx.fillStyle = 'rgba(18,12,36,0.92)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 16);
      ctx.fill();
      ctx.strokeStyle = '#ffd36e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffe9a6';
      ctx.font = 'bold 20px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText(ui.title, bx + 28, by + 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Microsoft JhengHei","PingFang TC",sans-serif';
      ui.lines.forEach((l, k) => ctx.fillText(l, bx + 28, by + 74 + k * 30));
      const oy = by + bh - 20 - ui.options.length * 34;
      ui.options.forEach((o, k) => {
        const sel2 = k === ui.idx;
        ctx.fillStyle = sel2 ? '#ffd36e' : '#d9d2f0';
        ctx.font = (sel2 ? 'bold ' : '') + '18px "Microsoft JhengHei","PingFang TC",sans-serif';
        ctx.fillText((sel2 ? '▶ ' : '   ') + o.label, bx + 40, oy + k * 34);
      });
      if (!ui.options.length) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '15px "Microsoft JhengHei","PingFang TC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('按 Z / G 關閉', bx + bw - 24, by + bh - 20);
      }
      ctx.textAlign = 'left';
    }

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff6d6';
      ctx.font = 'bold 48px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText('暫停', W / 2, H / 2 - 10);
      ctx.font = '18px "Microsoft JhengHei","PingFang TC",sans-serif';
      ctx.fillText('按 Esc 繼續　　M 靜音 / 開啟音效', W / 2, H / 2 + 30);
    }
  }

  function drawPlay() {
    drawWorld();
    drawHUD();
    drawUI();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (scene === 'title') drawTitle();
    else if (scene === 'select') drawSelect();
    else drawPlay();
  }

  // ---------- 迴圈 ----------
  let last = performance.now();
  let acc = 0;
  const DT = 1 / 60;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    // 注意：不在這裡清除 pressed，否則幀間按下的鍵會被丟掉；由 update() 消費
    while (acc >= DT) {
      update(DT);
      acc -= DT;
    }
    render();
    requestAnimationFrame(frame);
  }

  // 初始：標題畫面使用村莊配樂（需等玩家第一次互動才會真正播放）
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
})();
