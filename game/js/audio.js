// 音效與配樂：全部由 Web Audio 程式合成，不需要外部音檔。
// 配樂採用分段排程（lookahead），每張地圖一首循環曲；M 鍵靜音。
'use strict';

const AUDIO = (() => {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let noiseBuf = null;
  let muted = false;
  let track = null;
  let trackName = '';
  let timer = null;
  let step = 0;
  let nextTime = 0;

  const MUSIC_VOL = 0.22;
  const SFX_VOL = 0.5;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = MUSIC_VOL;
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = SFX_VOL;
      sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      return false;
    }
  }

  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // 單音：頻率可滑音，附包絡
  function tone(f0, f1, t, dur, type, vol, bus) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(t, dur, vol, lp, bus) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(lp, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, lp * 0.2), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(bus || sfxBus);
    s.start(t, Math.random() * 0.3, dur + 0.05);
  }

  const SFX = {
    swing(t) { tone(900, 380, t, 0.09, 'triangle', 0.18); },
    hit(t) { tone(340, 120, t, 0.09, 'square', 0.12); noise(t, 0.05, 0.12, 2500); },
    crit(t) {
      tone(620, 1240, t, 0.12, 'square', 0.14);
      tone(1568, 2093, t + 0.04, 0.2, 'triangle', 0.1);
      noise(t, 0.04, 0.15, 4000);
    },
    coin(t) { tone(988, 988, t, 0.07, 'sine', 0.2); tone(1319, 1319, t + 0.06, 0.14, 'sine', 0.2); },
    pickup(t) { tone(1200, 1800, t, 0.08, 'sine', 0.14); },
    jump(t) { tone(300, 640, t, 0.13, 'sine', 0.2); },
    hurt(t) { tone(280, 80, t, 0.28, 'sawtooth', 0.14); noise(t, 0.12, 0.1, 1200); },
    lvl(t) {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, t + i * 0.085, 0.22, 'triangle', 0.2));
    },
    skill(t) { tone(420, 840, t, 0.2, 'square', 0.1); noise(t, 0.18, 0.14, 3000); },
    heal(t) {
      [523, 659, 784].forEach((f, i) => tone(f, f, t + i * 0.07, 0.3, 'sine', 0.18));
    },
    shield(t) {
      tone(330, 660, t, 0.35, 'triangle', 0.18);
      tone(1320, 1320, t + 0.12, 0.4, 'sine', 0.08);
    },
    potion(t) { tone(700, 1000, t, 0.16, 'sine', 0.18); tone(1100, 1400, t + 0.08, 0.14, 'sine', 0.1); },
    portal(t) { tone(180, 900, t, 0.45, 'sine', 0.25); tone(270, 1350, t + 0.05, 0.4, 'triangle', 0.08); },
    quest(t) {
      [659, 784, 1047].forEach((f, i) => tone(f, f, t + i * 0.1, 0.18, 'triangle', 0.18));
    },
    death(t) { tone(330, 55, t, 0.7, 'sawtooth', 0.14); },
    boss(t) { tone(90, 40, t, 0.9, 'square', 0.2); noise(t, 0.8, 0.3, 900); },
    explode(t) { noise(t, 0.35, 0.35, 1400); tone(160, 40, t, 0.3, 'sine', 0.22); },
    ui(t) { tone(660, 660, t, 0.05, 'triangle', 0.14); },
    bossHit(t) { tone(180, 90, t, 0.12, 'square', 0.12); noise(t, 0.08, 0.14, 800); },
    charge(t) { noise(t, 0.4, 0.2, 600); tone(120, 240, t, 0.4, 'sawtooth', 0.08); },
  };

  function play(name) {
    if (!ensure() || muted) return;
    const fn = SFX[name];
    if (!fn) return;
    fn(ctx.currentTime + 0.005);
  }

  // ---- 配樂 ----
  // 旋律字串：0-9、a-f 為音階度數（每 16 格一小節），'-' 延續上一音，'.' 休止
  // bass 為每小節的根音度數；drums 為是否加入節奏點
  const TRACKS = {
    village: {
      bpm: 112, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], bass: [0, 3, 4, 0], drums: false, wave: 'triangle',
      mel: '0-2-4-5-4-2-0---' + '7-5-4-2-4-5-7---' + '9-7-5-4-5-7-9---' + '5-4-2-0-2-4-5---',
    },
    grove: {
      bpm: 126, root: 62, scale: [0, 3, 5, 7, 10], bass: [0, 2, 3, 0], drums: true, wave: 'square',
      mel: '0-0-2-3-2-0-4---' + '4-3-2-3-4-4-4---' + '3-3-4-3-2-3-1---' + '0-2-3-4-3-2-0---',
    },
    cloud: {
      bpm: 90, root: 65, scale: [0, 2, 4, 6, 7, 9, 11], bass: [0, 3, 4, 0], drums: false, wave: 'sine',
      mel: '0---2---4---6---' + '7---5---3---2---' + '4---6---7---9---' + '2---0---4---5---',
    },
    boss: {
      bpm: 150, root: 57, scale: [0, 2, 3, 5, 7, 8, 11], bass: [0, 0, 3, 0], drums: true, wave: 'sawtooth',
      mel: '0-0-7-6-5-6-7-0-' + '3-3-2-2-1-1-0---' + '0-0-7-6-5-6-7-6-' + '5-5-4-4-3-3-2---',
    },
  };

  function degreeMidi(tr, deg) {
    const oct = Math.floor(deg / tr.scale.length);
    return tr.root + tr.scale[deg % tr.scale.length] + oct * 12;
  }

  function parseDeg(ch) {
    if (ch >= '0' && ch <= '9') return parseInt(ch, 10);
    if (ch >= 'a' && ch <= 'f') return 10 + ch.charCodeAt(0) - 97;
    return null;
  }

  // 每個音的起始與長度（以格數計）
  function buildEvents(tr) {
    const ev = [];
    const s = tr.mel;
    for (let i = 0; i < s.length; i++) {
      const d = parseDeg(s[i]);
      if (d === null) continue;
      let len = 1;
      while (i + len < s.length && s[i + len] === '-') len++;
      ev[i] = { deg: d, len };
    }
    return ev;
  }

  function playStep(tr, events, st, t, stepDur) {
    const bar = Math.floor(st / 16) % 4;
    const e = events[st];
    if (e) {
      const m = degreeMidi(tr, e.deg);
      tone(midiHz(m), null, t, stepDur * e.len * 0.92, tr.wave, 0.09, musicBus);
    }
    if (st % 8 === 0) {
      const bm = tr.root - 12 + tr.scale[tr.bass[bar] % tr.scale.length];
      tone(midiHz(bm), null, t, stepDur * 7, 'triangle', 0.16, musicBus);
    }
    if (tr.drums) {
      if (st % 8 === 4) noise(t, 0.08, 0.12, 2500, musicBus);
      if (st % 4 === 2) noise(t, 0.03, 0.05, 6000, musicBus);
    }
  }

  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
    track = null;
    trackName = '';
  }

  function setMusic(name) {
    if (name === trackName) return;
    if (!ensure()) return;
    const tr = TRACKS[name];
    stopMusic();
    if (!tr) return;
    trackName = name;
    track = { tr, events: buildEvents(tr), stepDur: 60 / tr.bpm / 4 };
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 40);
    schedule();
  }

  function schedule() {
    if (!track) return;
    while (nextTime < ctx.currentTime + 0.25) {
      playStep(track.tr, track.events, step, nextTime, track.stepDur);
      nextTime += track.stepDur;
      step = (step + 1) % 64;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (ensure()) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    return muted;
  }

  function isMuted() { return muted; }

  return { play, setMusic, stopMusic, toggleMute, isMuted, ensure };
})();
