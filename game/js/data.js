// 遊戲資料：劇情、職業、怪物、地圖、任務
// 玩法參考楓之谷式橫向捲軸（地圖傳送門、繩索、NPC 任務、等級成長），劇情與角色為原創。
'use strict';

const STORY = [
  '很久以前，星砂群島被一顆巨大的「星核」托在雲海之上。',
  '某天，天空裂開一道細縫，霧影從裂縫中湧出，',
  '森林裡的精靈與蘑菇們被霧影侵蝕，開始失去理智。',
  '星核出現裂痕，島嶼正緩緩下沉。',
  '你與同伴是星砂騎士團的新進學徒，',
  '必須穿過蘑菇林與雲端空島，找回守護星核的力量。',
];

const CLASS_IDS = ['knight', 'mage', 'archer'];

const CLASSES = {
  knight: {
    id: 'knight',
    name: '劍士',
    desc: '重裝近戰。裂地斬能一次掃過群敵，守護盾為隊友擋下傷害。',
    hp: 130, mp: 40, dmg: 13, cd: 0.42,
    s1: { name: '裂地斬', mp: 12, cd: 2.5, desc: '大範圍斬擊，傷害 ×2.2' },
    s2: { name: '守護盾', mp: 22, cd: 9, desc: '自己與附近隊友 3 秒無敵' },
    pal: {
      skin: '#ffe0cc', skinDk: '#f1b89a', hair: '#5b3a2a', hairHi: '#8a5d43',
      body: '#c6d3ea', bodyDk: '#6f82a8', accent: '#2f6fdb', trim: '#ffd36e',
      pants: '#4a5674', boot: '#3b2b3f', eye: '#2b6cb0', cape: '#2f6fdb', capeDk: '#1b3f8f',
      plume: '#ff6f91',
    },
  },
  mage: {
    id: 'mage',
    name: '魔導師',
    desc: '遠程法術。星火爆能炸開一片怪群，治癒光可以同時回復全隊。',
    hp: 90, mp: 90, dmg: 10, cd: 0.5,
    s1: { name: '星火爆', mp: 18, cd: 3, desc: '發射爆裂星球，範圍傷害 ×2.2' },
    s2: { name: '治癒光', mp: 25, cd: 7, desc: '回復附近所有隊友的生命' },
    pal: {
      skin: '#ffe6d6', skinDk: '#f2bfa6', hair: '#e7d9ff', hairHi: '#fff4ff',
      body: '#7d52d8', bodyDk: '#4b2d91', accent: '#ffd36e', trim: '#ffe9a6',
      pants: '#3b2870', boot: '#261a4a', eye: '#7b4bd6', cape: '#5d3ab3', capeDk: '#33206b',
      hat: '#3d2a7a', hatDk: '#24174d', plume: '#ffd36e',
    },
  },
  archer: {
    id: 'archer',
    name: '弓手',
    desc: '高速遠程。三連箭覆蓋大範圍，疾風步短時間提升移動與攻速。',
    hp: 110, mp: 55, dmg: 9, cd: 0.36,
    s1: { name: '三連箭', mp: 10, cd: 2.2, desc: '扇形射出三支箭' },
    s2: { name: '疾風步', mp: 16, cd: 8, desc: '4 秒內移動與攻擊速度提升' },
    pal: {
      skin: '#ffe2cf', skinDk: '#f0b898', hair: '#c8793e', hairHi: '#e5a16a',
      body: '#4fb97a', bodyDk: '#2a7a4f', accent: '#b8f08a', trim: '#f5e6b0',
      pants: '#5a4330', boot: '#3e2c1f', eye: '#2f8a52', cape: '#2a7a4f', capeDk: '#1b5234',
      cap: '#3fa66b', capDk: '#23744a', plume: '#f5f0e6',
    },
  },
};

const NPC_PAL = {
  elder: {
    skin: '#ffe0cc', skinDk: '#f1b89a', hair: '#f4f1ff', hairHi: '#ffffff',
    body: '#8a5cc7', bodyDk: '#4f2f8a', accent: '#ffd36e', trim: '#ffe9a6',
    pants: '#3e2d5c', boot: '#2a1d3d', eye: '#4a3a6a',
  },
  shop: {
    skin: '#f6d2b8', skinDk: '#e2a98a', hair: '#5a3b22', hairHi: '#86603e',
    body: '#e9b25c', bodyDk: '#a06b2a', accent: '#c9462f', trim: '#fff1cc',
    pants: '#5b4a3a', boot: '#3a2c20', eye: '#4a3020',
  },
};

const MONSTERS = {
  slime: { name: '藍史萊姆', hp: 26, dmg: 8, exp: 8, speed: 42, w: 34, h: 28, meso: [2, 6], pot: 0.08 },
  mush: { name: '小蘑菇', hp: 46, dmg: 12, exp: 14, speed: 58, w: 36, h: 40, meso: [3, 8], pot: 0.12 },
  wisp: { name: '雲精靈', hp: 68, dmg: 14, exp: 22, speed: 70, w: 30, h: 30, flying: true, meso: [4, 10], pot: 0.15 },
};

const BOSS = { id: 'sporeking', name: '孢子王 摩古', hp: 900, dmg: 14, exp: 300, w: 150, h: 150 };

const QUESTS = {
  q1: {
    title: '藍色騷動', need: { slime: 10 }, reward: { meso: 200, exp: 120 },
    desc: '在蘑菇林擊敗 10 隻藍史萊姆',
  },
  q2: {
    title: '雲端的守護', need: { wisp: 8 }, reward: { meso: 420, exp: 260 },
    desc: '在雲端空島擊退 8 隻雲精靈',
  },
  q3: {
    title: '星核的真相', need: { sporeking: 1 }, reward: { meso: 800, exp: 600 },
    desc: '挑戰星核殿的孢子王摩古',
  },
};

const MAX_LV = 15;
const LEVEL_EXP = (lv) => Math.floor(30 * Math.pow(lv, 1.5));
const POTION_PRICE = 25;
const POTION_HEAL = 60;

// 地圖座標：地面 y=600，視窗 1280×720。floor 為地面，platforms 為浮空平台（可從下方跳穿）。
const MAPS = {
  village: {
    name: '星砂村', theme: 'dawn', w: 1600, start: 300,
    floor: [{ x: 0, w: 1600, y: 600 }],
    platforms: [
      { x: 300, y: 470, w: 170 },
      { x: 1000, y: 470, w: 200 },
      { x: 620, y: 330, w: 200 },
    ],
    ropes: [{ x: 720, top: 330, bottom: 600 }],
    portals: [{ x: 1520, to: 'grove', arriveX: 90 }],
    npcs: [
      { id: 'elder', kind: 'elder', name: '村長 奧托', x: 330 },
      { id: 'shop', kind: 'shop', name: '藥水商人 米可', x: 1120 },
    ],
    spawns: [],
  },
  grove: {
    name: '蘑菇林', theme: 'forest', w: 2400, start: 90,
    floor: [{ x: 0, w: 900, y: 600 }, { x: 1000, w: 1400, y: 600 }],
    platforms: [
      { x: 1150, y: 470, w: 180 },
      { x: 1400, y: 380, w: 180 },
      { x: 1650, y: 460, w: 200 },
      { x: 1900, y: 340, w: 160 },
    ],
    ropes: [{ x: 1560, top: 380, bottom: 600 }],
    portals: [
      { x: 40, to: 'village', arriveX: 1440 },
      { x: 2340, to: 'cloud', arriveX: 90 },
    ],
    npcs: [],
    spawns: [
      { type: 'slime', x0: 80, x1: 850, y: 600, n: 4 },
      { type: 'mush', x0: 1040, x1: 2360, y: 600, n: 4 },
      { type: 'slime', x0: 1160, x1: 1310, y: 470, n: 1 },
      { type: 'mush', x0: 1660, x1: 1840, y: 460, n: 1 },
    ],
  },
  cloud: {
    name: '雲端空島', theme: 'cloud', w: 2600, start: 90,
    floor: [{ x: 0, w: 520, y: 600 }, { x: 1900, w: 700, y: 600 }],
    platforms: [
      { x: 600, y: 500, w: 160 },
      { x: 840, y: 420, w: 150 },
      { x: 1080, y: 340, w: 160 },
      { x: 1330, y: 420, w: 150 },
      { x: 1560, y: 500, w: 160 },
      { x: 1790, y: 420, w: 120 },
    ],
    ropes: [{ x: 1120, top: 340, bottom: 600 }],
    portals: [
      { x: 40, to: 'grove', arriveX: 2300 },
      { x: 2540, to: 'boss', arriveX: 120, gate: 'q2', gateMsg: '需要先完成「雲端的守護」並回村長處交任務。' },
    ],
    npcs: [],
    spawns: [
      { type: 'wisp', x0: 600, x1: 1650, y0: 180, y1: 330, n: 4 },
      { type: 'slime', x0: 1950, x1: 2450, y: 600, n: 3 },
    ],
  },
  boss: {
    name: '星核殿', theme: 'ruins', w: 1400, start: 120, boss: true,
    floor: [{ x: 0, w: 1400, y: 600 }],
    platforms: [
      { x: 260, y: 460, w: 200 },
      { x: 940, y: 460, w: 200 },
      { x: 600, y: 340, w: 200 },
    ],
    ropes: [],
    portals: [{ x: 40, to: 'cloud', arriveX: 2480 }],
    npcs: [],
    spawns: [],
  },
};
