(() => {
  const TILE = 28;

  const loginEl = document.getElementById('login');
  const gameEl = document.getElementById('game');
  const serverUrlInput = document.getElementById('serverUrl');
  const playerNameInput = document.getElementById('playerName');
  const joinBtn = document.getElementById('joinBtn');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const hpLine = document.getElementById('hpLine');
  const playersLine = document.getElementById('playersLine');
  const chatLog = document.getElementById('chatLog');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  const saved = localStorage.getItem('mini-rpg-name');
  if (saved) playerNameInput.value = saved;
  const savedUrl = localStorage.getItem('mini-rpg-server');
  if (savedUrl) serverUrlInput.value = savedUrl;
  else serverUrlInput.value = window.location.origin.startsWith('http')
    ? window.location.origin
    : 'http://localhost:3000';

  let socket = null;
  let myId = null;
  let map = { w: 40, h: 24, walls: [] };
  let wallSet = new Set();
  let players = [];
  let mobs = [];
  const keys = {};

  function appendChat(name, text, mine) {
    const div = document.createElement('div');
    div.innerHTML = `<b style="${mine ? 'color:#8affa0' : ''}">${escapeHtml(name)}:</b> ${escapeHtml(text)}`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  joinBtn.addEventListener('click', connect);
  playerNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
  serverUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });

  function connect() {
    const url = serverUrlInput.value.trim() || window.location.origin;
    const name = playerNameInput.value.trim() || 'Adventurer';
    localStorage.setItem('mini-rpg-name', name);
    localStorage.setItem('mini-rpg-server', url);

    joinBtn.disabled = true;
    joinBtn.textContent = '連線中...';

    socket = io(url, { transports: ['websocket', 'polling'] });

    socket.on('connect_error', (err) => {
      joinBtn.disabled = false;
      joinBtn.textContent = '進入遊戲';
      alert('無法連線到伺服器：' + err.message);
    });

    socket.on('connect', () => {
      socket.emit('join', { name });
    });

    socket.on('welcome', (data) => {
      myId = data.id;
      map = data.map;
      wallSet = new Set(map.walls);
      canvas.width = map.w * TILE;
      canvas.height = map.h * TILE;
      loginEl.style.display = 'none';
      gameEl.style.display = 'block';
      requestAnimationFrame(loop);
    });

    socket.on('state', (data) => {
      players = data.players;
      mobs = data.mobs;
      const me = players.find((p) => p.id === myId);
      hpLine.textContent = me ? `HP: ${me.hp}/${me.maxHp}` : 'HP: --/--';
      playersLine.textContent = `線上玩家: ${players.length}`;
    });

    socket.on('chat', (data) => {
      appendChat(data.name, data.text, data.id === myId);
    });

    socket.on('mobDied', (data) => {
      appendChat('系統', `${data.byName} 擊敗了一隻怪物！`, false);
    });

    socket.on('playerLeft', () => {});
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !socket) return;
    socket.emit('chat', { text });
    chatInput.value = '';
    chatInput.blur();
  });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement === chatInput) return;
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  let lastSentDx = null;
  let lastSentDy = null;
  function updateMovementFromKeys() {
    if (!socket) return;
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (dx !== lastSentDx || dy !== lastSentDy) {
      socket.emit('move', { dx, dy });
      lastSentDx = dx;
      lastSentDy = dy;
    }
  }

  canvas.addEventListener('click', (e) => {
    if (!socket || !myId) return;
    const me = players.find((p) => p.id === myId);
    if (!me) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / TILE;
    const clickY = (e.clientY - rect.top) / TILE;

    let nearest = null;
    let nearestDist = Infinity;
    for (const mob of mobs) {
      if (!mob.alive) continue;
      const d = Math.hypot(mob.x - clickX, mob.y - clickY);
      if (d < 0.9 && d < nearestDist) {
        nearest = mob;
        nearestDist = d;
      }
    }
    if (nearest) {
      socket.emit('attack', { mobId: nearest.id });
    }
  });

  function drawMap() {
    ctx.fillStyle = '#1b1c24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#33364a';
    for (const key of wallSet) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  function drawMob(mob) {
    if (!mob.alive) return;
    const cx = mob.x * TILE;
    const cy = mob.y * TILE;
    ctx.fillStyle = '#d64545';
    ctx.fillRect(cx - TILE * 0.35, cy - TILE * 0.35, TILE * 0.7, TILE * 0.7);

    const w = TILE * 0.9;
    const hpPct = mob.hp / mob.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - w / 2, cy - TILE * 0.7, w, 4);
    ctx.fillStyle = '#e05353';
    ctx.fillRect(cx - w / 2, cy - TILE * 0.7, w * hpPct, 4);
  }

  function drawPlayer(p) {
    const cx = p.x * TILE;
    const cy = p.y * TILE;
    const dead = p.hp <= 0;

    ctx.globalAlpha = dead ? 0.35 : 1;
    ctx.fillStyle = p.color || '#8ab4ff';
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 0.32, 0, Math.PI * 2);
    ctx.fill();
    if (p.id === myId) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, cx, cy - TILE * 0.55);

    const w = TILE * 0.9;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - w / 2, cy - TILE * 0.45, w, 4);
    ctx.fillStyle = hpPct > 0.3 ? '#4caf50' : '#e05353';
    ctx.fillRect(cx - w / 2, cy - TILE * 0.45, w * hpPct, 4);
  }

  function loop() {
    updateMovementFromKeys();
    drawMap();
    for (const mob of mobs) drawMob(mob);
    for (const p of players) drawPlayer(p);
    requestAnimationFrame(loop);
  }
})();
