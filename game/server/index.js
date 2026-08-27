const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const MAP_W = 40;
const MAP_H = 24;
const TICK_MS = 66; // ~15 updates/sec
const PLAYER_SPEED = 4.2; // tiles/sec
const ATTACK_RANGE = 1.6;
const ATTACK_COOLDOWN_MS = 500;
const MOB_RESPAWN_MS = 8000;
const MAX_NAME_LEN = 16;
const MAX_CHAT_LEN = 200;

// Simple border walls + a few obstacles, expressed as a Set of "x,y" strings.
const walls = new Set();
for (let x = 0; x < MAP_W; x++) {
  walls.add(`${x},0`);
  walls.add(`${x},${MAP_H - 1}`);
}
for (let y = 0; y < MAP_H; y++) {
  walls.add(`0,${y}`);
  walls.add(`${MAP_W - 1},${y}`);
}
const obstacleBlocks = [
  [10, 6, 4, 2],
  [22, 14, 3, 5],
  [30, 4, 2, 6],
];
for (const [ox, oy, w, h] of obstacleBlocks) {
  for (let x = ox; x < ox + w; x++) {
    for (let y = oy; y < oy + h; y++) {
      walls.add(`${x},${y}`);
    }
  }
}
function isWall(x, y) {
  return walls.has(`${Math.round(x)},${Math.round(y)}`);
}

const MOB_SPAWNS = [
  { x: 6, y: 4, maxHp: 30 },
  { x: 34, y: 4, maxHp: 30 },
  { x: 6, y: 19, maxHp: 40 },
  { x: 34, y: 19, maxHp: 40 },
  { x: 20, y: 10, maxHp: 60 },
];

const players = new Map(); // socket.id -> player state
const mobs = new Map(); // mobId -> mob state

let nextMobId = 1;
for (const spawn of MOB_SPAWNS) {
  const id = `mob-${nextMobId++}`;
  mobs.set(id, {
    id,
    spawnX: spawn.x,
    spawnY: spawn.y,
    x: spawn.x,
    y: spawn.y,
    hp: spawn.maxHp,
    maxHp: spawn.maxHp,
    alive: true,
    respawnAt: 0,
  });
}

function sanitizeName(raw) {
  const cleaned = String(raw || '').replace(/[<>]/g, '').trim();
  return (cleaned || 'Adventurer').slice(0, MAX_NAME_LEN);
}

function randomSpawnPoint() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = 2 + Math.floor(Math.random() * (MAP_W - 4));
    const y = 2 + Math.floor(Math.random() * (MAP_H - 4));
    if (!isWall(x, y)) return { x, y };
  }
  return { x: 2, y: 2 };
}

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    if (players.has(socket.id)) return;
    const spawn = randomSpawnPoint();
    const player = {
      id: socket.id,
      name: sanitizeName(data && data.name),
      x: spawn.x,
      y: spawn.y,
      moveX: 0,
      moveY: 0,
      hp: 100,
      maxHp: 100,
      lastAttackAt: 0,
      color: `hsl(${Math.floor(Math.random() * 360)},70%,55%)`,
    };
    players.set(socket.id, player);

    socket.emit('welcome', {
      id: socket.id,
      map: { w: MAP_W, h: MAP_H, walls: [...walls] },
    });
  });

  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (!player || player.hp <= 0) return;
    let dx = Number(data && data.dx) || 0;
    let dy = Number(data && data.dy) || 0;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    player.moveX = dx;
    player.moveY = dy;
  });

  socket.on('attack', (data) => {
    const player = players.get(socket.id);
    if (!player || player.hp <= 0) return;
    const now = Date.now();
    if (now - player.lastAttackAt < ATTACK_COOLDOWN_MS) return;
    const mob = mobs.get(data && data.mobId);
    if (!mob || !mob.alive) return;
    const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
    if (dist > ATTACK_RANGE) return;

    player.lastAttackAt = now;
    const damage = 8 + Math.floor(Math.random() * 6);
    mob.hp = Math.max(0, mob.hp - damage);
    io.emit('mobDamaged', { mobId: mob.id, hp: mob.hp, by: player.id });

    if (mob.hp <= 0) {
      mob.alive = false;
      mob.respawnAt = now + MOB_RESPAWN_MS;
      io.emit('mobDied', { mobId: mob.id, by: player.id, byName: player.name });
    }
  });

  socket.on('chat', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    const text = String((data && data.text) || '').slice(0, MAX_CHAT_LEN).trim();
    if (!text) return;
    io.emit('chat', { name: player.name, text, id: player.id });
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('playerLeft', { id: socket.id });
  });
});

setInterval(() => {
  const dt = TICK_MS / 1000;
  const now = Date.now();

  for (const player of players.values()) {
    if (player.hp <= 0) continue;
    if (player.moveX === 0 && player.moveY === 0) continue;
    const nx = player.x + player.moveX * PLAYER_SPEED * dt;
    const ny = player.y + player.moveY * PLAYER_SPEED * dt;
    if (!isWall(nx, player.y)) player.x = Math.max(1, Math.min(MAP_W - 2, nx));
    if (!isWall(player.x, ny)) player.y = Math.max(1, Math.min(MAP_H - 2, ny));
  }

  for (const mob of mobs.values()) {
    if (!mob.alive && now >= mob.respawnAt) {
      mob.alive = true;
      mob.hp = mob.maxHp;
      mob.x = mob.spawnX;
      mob.y = mob.spawnY;
    }
  }

  io.emit('state', {
    players: [...players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      hp: p.hp,
      maxHp: p.maxHp,
      color: p.color,
    })),
    mobs: [...mobs.values()].map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      hp: m.hp,
      maxHp: m.maxHp,
      alive: m.alive,
    })),
  });
}, TICK_MS);

httpServer.listen(PORT, () => {
  console.log(`Mini RPG server listening on port ${PORT}`);
});
