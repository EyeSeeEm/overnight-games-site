// Frostfall EXPANDED - A 2D Skyrim Demake
// Full-featured RPG with save/load, achievements, expanded content
// Kaplay loaded from CDN - kaplay is global

const k = kaplay({
  width: 800,
  height: 450,
  scale: 1.5,
  background: [15, 20, 35],
  crisp: true,
  pixelDensity: 1,
});

// ============================================
// AUDIO SYSTEM (Web Audio API with BGM)
// ============================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmOsc = null;
let bgmGain = null;

function startBGM() {
  if (bgmOsc) return;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  // Simple ambient drone
  bgmOsc = audioCtx.createOscillator();
  bgmOsc.type = 'sine';
  bgmOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  bgmOsc.connect(bgmGain);
  bgmOsc.start();

  // Add subtle modulation
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(0.1, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(5, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(bgmOsc.frequency);
  lfo.start();
}

function stopBGM() {
  if (bgmOsc) {
    bgmOsc.stop();
    bgmOsc = null;
  }
}

function playSound(type, volume = 0.3) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);

  switch (type) {
    case 'hit':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'sword':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'death':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case 'pickup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'levelup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(550, now + 0.1);
      osc.frequency.setValueAtTime(660, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case 'achievement':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1047, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case 'magic':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'menuSelect':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'save':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
  }
}

// ============================================
// CONSTANTS & COLORS
// ============================================
const TILE_SIZE = 16;
const PLAYER_SPEED = 90;
const SPRINT_SPEED = 160;

const COLORS = {
  player: [90, 140, 210],
  enemy: [180, 70, 70],
  npc: [200, 180, 140],
  gold: [255, 215, 80],
  health: [200, 60, 60],
  mana: [60, 100, 200],
  stamina: [60, 180, 80],
  xp: [200, 180, 100],
  frost: [150, 200, 255],
  fire: [255, 150, 50],
  poison: [100, 200, 100],
};

// ============================================
// EXPANDED GAME DATA
// ============================================

// Weapons with more variety
const weapons = {
  iron_sword: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 28, type: 'melee' },
  steel_sword: { name: 'Steel Sword', damage: 12, speed: 0.3, range: 30, type: 'melee' },
  elven_sword: { name: 'Elven Sword', damage: 16, speed: 0.25, range: 32, type: 'melee' },
  daedric_sword: { name: 'Daedric Sword', damage: 24, speed: 0.35, range: 35, type: 'melee' },
  iron_dagger: { name: 'Iron Dagger', damage: 4, speed: 0.15, range: 18, type: 'melee', critBonus: 2 },
  glass_dagger: { name: 'Glass Dagger', damage: 10, speed: 0.12, range: 20, type: 'melee', critBonus: 3 },
  staff_flames: { name: 'Staff of Flames', damage: 15, speed: 0.5, range: 100, type: 'magic', element: 'fire' },
  staff_frost: { name: 'Staff of Frost', damage: 12, speed: 0.4, range: 100, type: 'magic', element: 'frost' },
};

// Expanded enemy types
const enemies = {
  wolf: { hp: 25, damage: 6, speed: 80, color: [100, 100, 110], xp: 10, gold: [0, 2], size: 11 },
  bandit: { hp: 40, damage: 8, speed: 55, color: [180, 80, 80], xp: 20, gold: [5, 15], size: 14 },
  bandit_archer: { hp: 30, damage: 12, speed: 45, color: [160, 100, 80], xp: 25, gold: [8, 18], size: 13, ranged: true },
  bandit_chief: { hp: 100, damage: 18, speed: 50, color: [200, 60, 60], xp: 60, gold: [30, 60], size: 18, boss: true },
  draugr: { hp: 50, damage: 10, speed: 40, color: [80, 130, 110], xp: 30, gold: [5, 20], size: 14 },
  draugr_wight: { hp: 70, damage: 14, speed: 45, color: [60, 110, 100], xp: 45, gold: [15, 35], size: 15 },
  draugr_deathlord: { hp: 180, damage: 28, speed: 40, color: [50, 100, 90], xp: 120, gold: [60, 120], size: 22, boss: true },
  frost_troll: { hp: 200, damage: 25, speed: 35, color: [180, 200, 220], xp: 80, gold: [20, 40], size: 24 },
  ice_wraith: { hp: 60, damage: 15, speed: 70, color: [150, 200, 255], xp: 50, gold: [10, 25], size: 12, flying: true },
  skeleton: { hp: 35, damage: 7, speed: 50, color: [200, 200, 190], xp: 15, gold: [2, 10], size: 13 },
  spider: { hp: 45, damage: 10, speed: 65, color: [80, 70, 60], xp: 25, gold: [0, 5], size: 16, poison: true },
  dragon_priest: { hp: 250, damage: 35, speed: 30, color: [100, 80, 120], xp: 200, gold: [100, 200], size: 20, boss: true, magic: true },
};

// Expanded items
const items = {
  health_potion: { name: 'Health Potion', type: 'consumable', effect: 'heal', amount: 50, value: 30 },
  health_potion_large: { name: 'Greater Health Potion', type: 'consumable', effect: 'heal', amount: 100, value: 75 },
  magicka_potion: { name: 'Magicka Potion', type: 'consumable', effect: 'magicka', amount: 50, value: 40 },
  stamina_potion: { name: 'Stamina Potion', type: 'consumable', effect: 'stamina', amount: 100, value: 25 },
  poison_resist: { name: 'Poison Resistance', type: 'consumable', effect: 'resist_poison', duration: 60, value: 50 },
  dragonstone: { name: 'Dragonstone', type: 'quest', value: 0 },
  golden_claw: { name: 'Golden Claw', type: 'quest', value: 0 },
  dragon_soul: { name: 'Dragon Soul', type: 'special', value: 0 },
  skill_book_combat: { name: 'Combat Primer', type: 'book', skill: 'combat', value: 100 },
  skill_book_magic: { name: 'Arcane Arts', type: 'book', skill: 'magic', value: 100 },
};

// Expanded zones (10 total)
const zones = {
  riverwood: {
    name: 'Riverwood', width: 45, height: 28, safe: true,
    ambientColor: [50, 80, 50],
    npcs: [
      { id: 'alvor', name: 'Alvor', x: 8, y: 10, type: 'blacksmith', dialogue: "Need iron equipment? I've got the finest in the hold.", shop: ['iron_sword', 'steel_sword'] },
      { id: 'lucan', name: 'Lucan', x: 28, y: 8, type: 'merchant', dialogue: "Welcome to the Riverwood Trader!", shop: ['health_potion', 'magicka_potion'] },
      { id: 'camilla', name: 'Camilla', x: 30, y: 10, type: 'quest', dialogue: "My brother's golden claw was stolen by bandits in Bleak Falls Barrow!", quest: 'golden_claw' }
    ],
    exits: [
      { x: 43, y: 12, width: 2, height: 8, to: 'forest', toX: 2, toY: 15 },
      { x: 22, y: 0, width: 6, height: 2, to: 'whiterun_road', toX: 20, toY: 23 }
    ],
    structures: [{ x: 5, y: 8, w: 8, h: 6, type: 'building' }, { x: 25, y: 6, w: 10, h: 6, type: 'building' }]
  },
  forest: {
    name: 'Riverwood Forest', width: 55, height: 35, safe: false,
    ambientColor: [30, 60, 35],
    enemies: [
      { type: 'wolf', x: 15, y: 10 }, { type: 'wolf', x: 18, y: 12 },
      { type: 'wolf', x: 35, y: 8 }, { type: 'wolf', x: 40, y: 25 },
      { type: 'spider', x: 25, y: 20 }
    ],
    exits: [
      { x: 0, y: 13, width: 2, height: 8, to: 'riverwood', toX: 41, toY: 12 },
      { x: 53, y: 15, width: 2, height: 8, to: 'embershard', toX: 2, toY: 12 },
      { x: 25, y: 33, width: 8, height: 2, to: 'bleak_falls_exterior', toX: 15, toY: 2 }
    ],
    trees: 30,
    chests: [{ x: 45, y: 5, gold: 25, items: ['health_potion'] }]
  },
  embershard: {
    name: 'Embershard Mine', width: 40, height: 30, safe: false,
    ambientColor: [40, 30, 25],
    enemies: [
      { type: 'bandit', x: 12, y: 10 }, { type: 'bandit', x: 18, y: 18 },
      { type: 'bandit_archer', x: 25, y: 8 }, { type: 'bandit', x: 30, y: 15 },
      { type: 'bandit_chief', x: 32, y: 24 }
    ],
    chests: [
      { x: 35, y: 26, gold: 80, items: ['health_potion', 'steel_sword'] }
    ],
    exits: [{ x: 0, y: 10, width: 2, height: 8, to: 'forest', toX: 51, toY: 15 }]
  },
  bleak_falls_exterior: {
    name: 'Bleak Falls Barrow Exterior', width: 40, height: 25, safe: false,
    ambientColor: [45, 55, 65],
    enemies: [
      { type: 'skeleton', x: 15, y: 12 }, { type: 'skeleton', x: 20, y: 10 },
      { type: 'bandit', x: 30, y: 15 }
    ],
    exits: [
      { x: 13, y: 0, width: 8, height: 2, to: 'forest', toX: 25, toY: 31 },
      { x: 35, y: 10, width: 3, height: 5, to: 'bleak_falls', toX: 2, toY: 10 }
    ]
  },
  bleak_falls: {
    name: 'Bleak Falls Barrow', width: 50, height: 35, safe: false,
    ambientColor: [35, 45, 55],
    enemies: [
      { type: 'draugr', x: 12, y: 10 }, { type: 'draugr', x: 18, y: 18 },
      { type: 'draugr', x: 28, y: 12 }, { type: 'draugr_wight', x: 35, y: 20 },
      { type: 'spider', x: 22, y: 25 }, { type: 'draugr_deathlord', x: 42, y: 28 }
    ],
    chests: [
      { x: 45, y: 30, gold: 150, items: ['dragonstone', 'golden_claw', 'health_potion_large', 'skill_book_combat'] }
    ],
    exits: [{ x: 0, y: 8, width: 2, height: 6, to: 'bleak_falls_exterior', toX: 33, toY: 10 }]
  },
  whiterun_road: {
    name: 'Road to Whiterun', width: 50, height: 28, safe: false,
    ambientColor: [60, 55, 40],
    enemies: [
      { type: 'bandit', x: 20, y: 10 }, { type: 'wolf', x: 35, y: 18 },
      { type: 'bandit_archer', x: 40, y: 8 }
    ],
    exits: [
      { x: 18, y: 23, width: 8, height: 2, to: 'riverwood', toX: 22, toY: 2 },
      { x: 48, y: 12, width: 2, height: 8, to: 'whiterun', toX: 2, toY: 18 }
    ]
  },
  whiterun: {
    name: 'Whiterun', width: 60, height: 40, safe: true,
    ambientColor: [80, 70, 55],
    npcs: [
      { id: 'jarl', name: 'Jarl Balgruuf', x: 30, y: 10, type: 'quest', dialogue: "You! The one from Helgen? Speak with Farengar about the dragons.", quest: 'main_quest' },
      { id: 'farengar', name: 'Farengar', x: 35, y: 12, type: 'wizard', dialogue: "The Dragonstone... it's in Bleak Falls Barrow. Retrieve it.", shop: ['staff_flames', 'staff_frost', 'magicka_potion'] },
      { id: 'adrianne', name: 'Adrianne', x: 12, y: 25, type: 'blacksmith', dialogue: "Warmaiden's has the finest steel in Whiterun.", shop: ['steel_sword', 'elven_sword', 'glass_dagger'] },
      { id: 'belethor', name: 'Belethor', x: 25, y: 30, type: 'merchant', dialogue: "Everything's for sale!", shop: ['health_potion', 'health_potion_large', 'stamina_potion'] }
    ],
    exits: [
      { x: 0, y: 16, width: 2, height: 8, to: 'whiterun_road', toX: 46, toY: 12 },
      { x: 58, y: 20, width: 2, height: 8, to: 'plains', toX: 2, toY: 15 }
    ],
    structures: [{ x: 25, y: 5, w: 18, h: 12, type: 'castle' }]
  },
  plains: {
    name: 'Whiterun Plains', width: 60, height: 40, safe: false,
    ambientColor: [70, 65, 45],
    enemies: [
      { type: 'wolf', x: 15, y: 10 }, { type: 'wolf', x: 20, y: 25 },
      { type: 'frost_troll', x: 45, y: 30 }
    ],
    exits: [
      { x: 0, y: 13, width: 2, height: 8, to: 'whiterun', toX: 56, toY: 20 },
      { x: 58, y: 18, width: 2, height: 8, to: 'frost_caves', toX: 2, toY: 12 }
    ],
    chests: [{ x: 50, y: 8, gold: 60, items: ['health_potion'] }]
  },
  frost_caves: {
    name: 'Frost Caves', width: 45, height: 30, safe: false,
    ambientColor: [50, 60, 80],
    enemies: [
      { type: 'ice_wraith', x: 15, y: 12 }, { type: 'ice_wraith', x: 25, y: 8 },
      { type: 'frost_troll', x: 30, y: 20 }, { type: 'dragon_priest', x: 38, y: 25 }
    ],
    chests: [
      { x: 40, y: 27, gold: 300, items: ['daedric_sword', 'dragon_soul', 'health_potion_large', 'skill_book_magic'] }
    ],
    exits: [{ x: 0, y: 10, width: 2, height: 8, to: 'plains', toX: 56, toY: 18 }]
  },
  hidden_grove: {
    name: 'Hidden Grove', width: 35, height: 25, safe: true,
    ambientColor: [40, 70, 50],
    npcs: [
      { id: 'hermit', name: 'Old Hermit', x: 18, y: 12, type: 'trainer', dialogue: "You seek power? I can teach you... for a price.", trainSkill: 'magic' }
    ],
    exits: [{ x: 0, y: 10, width: 2, height: 6, to: 'forest', toX: 50, toY: 25 }],
    chests: [{ x: 30, y: 20, gold: 100, items: ['skill_book_magic', 'magicka_potion'] }],
    trees: 15
  }
};

// Quests
const quests = {
  golden_claw: { id: 'golden_claw', name: 'The Golden Claw', desc: 'Retrieve the golden claw from Bleak Falls Barrow', objective: 'golden_claw', reward: 400 },
  main_quest: { id: 'main_quest', name: 'Bleak Falls Barrow', desc: 'Retrieve the Dragonstone for Farengar', objective: 'dragonstone', reward: 500 },
  dragon_hunter: { id: 'dragon_hunter', name: 'Dragon Hunter', desc: 'Defeat the Dragon Priest', objective: 'dragon_soul', reward: 1000 }
};

// Achievements
const achievementDefs = {
  first_kill: { name: 'First Blood', desc: 'Defeat your first enemy', icon: 'sword' },
  level_5: { name: 'Apprentice', desc: 'Reach level 5', icon: 'star' },
  level_10: { name: 'Adept', desc: 'Reach level 10', icon: 'star' },
  boss_slayer: { name: 'Boss Slayer', desc: 'Defeat a boss enemy', icon: 'skull' },
  dragon_slayer: { name: 'Dragon Slayer', desc: 'Defeat the Dragon Priest', icon: 'dragon' },
  rich: { name: 'Wealthy', desc: 'Accumulate 1000 gold', icon: 'gold' },
  explorer: { name: 'Explorer', desc: 'Visit all zones', icon: 'map' },
  collector: { name: 'Collector', desc: 'Collect 20 items', icon: 'chest' },
};

// ============================================
// GAME STATE
// ============================================
const defaultStats = {
  level: 1, hp: 100, maxHp: 100,
  magicka: 50, maxMagicka: 50,
  stamina: 100, maxStamina: 100,
  gold: 100, totalGold: 100,
  xp: { combat: 0, magic: 0, stealth: 0 },
  skills: { combat: 1, magic: 1, stealth: 1 },
  inventory: ['health_potion', 'health_potion'],
  equipment: { weapon: 'iron_sword', armor: 'leather' },
  quests: { active: [], completed: [] },
  achievements: [],
  kills: 0, bossKills: 0, itemsCollected: 0,
  zonesVisited: ['riverwood'],
  tutorialSeen: false, playTime: 0
};

let playerStats = JSON.parse(JSON.stringify(defaultStats));
let currentZone = 'riverwood';
let player, enemyObjects = [], npcObjects = [], chestObjects = [];
let attackCooldown = 0, dialogueOpen = false, currentDialogue = null;
let inventoryOpen = false, pauseOpen = false, shopOpen = false, currentShop = null;
let screenShake = 0, gameTime = 0;
let settings = { musicVolume: 50, sfxVolume: 100, showTutorial: true };

window.gameState = { started: false, stats: playerStats };

// ============================================
// SAVE/LOAD SYSTEM
// ============================================
function saveGame() {
  const saveData = {
    stats: playerStats,
    zone: currentZone,
    settings: settings,
    timestamp: Date.now()
  };
  localStorage.setItem('frostfall_save', JSON.stringify(saveData));
  playSound('save');
  showMessage("Game Saved!", [100, 255, 100]);
}

function loadGame() {
  const data = localStorage.getItem('frostfall_save');
  if (data) {
    const saveData = JSON.parse(data);
    playerStats = saveData.stats;
    currentZone = saveData.zone;
    settings = saveData.settings || settings;
    return true;
  }
  return false;
}

function hasSaveGame() {
  return localStorage.getItem('frostfall_save') !== null;
}

function deleteSave() {
  localStorage.removeItem('frostfall_save');
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================
function unlockAchievement(id) {
  if (playerStats.achievements.includes(id)) return;
  playerStats.achievements.push(id);
  const ach = achievementDefs[id];
  playSound('achievement');
  showAchievement(ach.name);
}

function checkAchievements() {
  if (playerStats.kills >= 1) unlockAchievement('first_kill');
  if (playerStats.level >= 5) unlockAchievement('level_5');
  if (playerStats.level >= 10) unlockAchievement('level_10');
  if (playerStats.bossKills >= 1) unlockAchievement('boss_slayer');
  if (playerStats.totalGold >= 1000) unlockAchievement('rich');
  if (playerStats.itemsCollected >= 20) unlockAchievement('collector');
  if (playerStats.zonesVisited.length >= Object.keys(zones).length) unlockAchievement('explorer');
  if (playerStats.quests.completed.includes('dragon_hunter')) unlockAchievement('dragon_slayer');
}

// ============================================
// PARTICLE SYSTEM
// ============================================
function spawnParticles(pos, count, color, speed = 100, life = 0.5) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel = k.vec2(Math.cos(angle), Math.sin(angle)).scale(speed * (0.5 + Math.random() * 0.5));
    const size = 2 + Math.random() * 3;
    k.add([
      k.rect(size, size), k.pos(pos), k.anchor("center"),
      k.color(...color), k.opacity(1), k.lifespan(life, { fade: 0.5 }), k.z(50),
      { vel, update() { this.pos = this.pos.add(this.vel.scale(k.dt())); this.vel = this.vel.scale(0.95); } }
    ]);
  }
}

function spawnMagicParticles(pos, element) {
  const color = element === 'fire' ? COLORS.fire : COLORS.frost;
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    k.add([
      k.circle(2 + Math.random() * 3), k.pos(pos), k.anchor("center"),
      k.color(...color), k.opacity(0.8), k.lifespan(0.4, { fade: 0.3 }), k.z(50),
      { vel: k.vec2(Math.cos(angle), Math.sin(angle)).scale(60 + Math.random() * 40),
        update() { this.pos = this.pos.add(this.vel.scale(k.dt())); } }
    ]);
  }
}

// ============================================
// UI HELPERS
// ============================================
let messageQueue = [];
let achievementDisplay = null;

function showMessage(text, color = [255, 255, 200]) {
  messageQueue.push({ text, color, time: 2 });
}

function showAchievement(name) {
  achievementDisplay = { name, time: 3 };
}

function addScreenShake(amount) {
  screenShake = Math.min(screenShake + amount, 20);
}

// ============================================
// TITLE SCENE
// ============================================
k.scene("title", () => {
  // Animated particles
  for (let i = 0; i < 60; i++) {
    k.add([
      k.circle(1 + Math.random() * 2),
      k.pos(Math.random() * k.width(), Math.random() * k.height()),
      k.color(100 + Math.random() * 100, 120 + Math.random() * 80, 180 + Math.random() * 75),
      k.opacity(0.3 + Math.random() * 0.3), k.z(-1),
      { speed: 5 + Math.random() * 15,
        update() { this.pos.y -= this.speed * k.dt(); if (this.pos.y < -10) { this.pos.y = k.height() + 10; this.pos.x = Math.random() * k.width(); } } }
    ]);
  }

  // Title glow
  for (let i = 3; i >= 0; i--) {
    k.add([
      k.text("FROSTFALL", { size: 40 + i * 4 }),
      k.pos(k.width() / 2, 80), k.anchor("center"),
      k.color(100, 150, 255), k.opacity(i === 0 ? 1 : 0.1), k.z(10 - i)
    ]);
  }

  k.add([k.text("EXPANDED EDITION", { size: 14 }), k.pos(k.width() / 2, 125), k.anchor("center"), k.color(200, 180, 100)]);

  // Menu options
  const menuItems = [
    { text: "New Game", action: () => { playerStats = JSON.parse(JSON.stringify(defaultStats)); currentZone = 'riverwood'; k.go("tutorial"); } },
    { text: "Continue", action: () => { if (loadGame()) { k.go("game"); } }, enabled: hasSaveGame() },
    { text: "Settings", action: () => k.go("settings") },
  ];

  let selected = 0;
  const menuY = 200;

  menuItems.forEach((item, i) => {
    const txt = k.add([
      k.text(item.text, { size: 16 }),
      k.pos(k.width() / 2, menuY + i * 35), k.anchor("center"),
      k.color(item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 220),
      k.z(10), { idx: i }
    ]);
    txt.onUpdate(() => {
      txt.color = i === selected ? k.rgb(255, 220, 100) : k.rgb(item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 220);
    });
  });

  k.add([k.text("WASD: Move | Space: Attack/Select | E: Interact", { size: 9 }), k.pos(k.width() / 2, k.height() - 40), k.anchor("center"), k.color(120, 130, 160)]);

  k.onKeyPress("up", () => { selected = Math.max(0, selected - 1); playSound('menuSelect'); });
  k.onKeyPress("down", () => { selected = Math.min(menuItems.length - 1, selected + 1); playSound('menuSelect'); });
  k.onKeyPress("w", () => { selected = Math.max(0, selected - 1); playSound('menuSelect'); });
  k.onKeyPress("s", () => { selected = Math.min(menuItems.length - 1, selected + 1); playSound('menuSelect'); });
  k.onKeyPress("space", () => {
    audioCtx.resume();
    const item = menuItems[selected];
    if (item.enabled !== false) { playSound('pickup'); item.action(); }
  });
  k.onKeyPress("enter", () => {
    audioCtx.resume();
    const item = menuItems[selected];
    if (item.enabled !== false) { playSound('pickup'); item.action(); }
  });
});

// ============================================
// TUTORIAL SCENE
// ============================================
k.scene("tutorial", () => {
  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(20, 25, 40), k.opacity(0.95)]);

  k.add([k.text("TUTORIAL", { size: 28 }), k.pos(k.width() / 2, 40), k.anchor("center"), k.color(255, 220, 100)]);

  const tips = [
    "WASD or Arrow Keys - Move",
    "SHIFT - Sprint (uses stamina)",
    "SPACE - Attack with weapon",
    "E - Interact with NPCs & chests",
    "I - Open inventory",
    "Q - Use health potion",
    "F5 - Quick save",
    "ESC - Pause menu",
    "",
    "Explore Skyrim, defeat enemies, complete quests!",
    "Talk to NPCs for quests and to buy items.",
    "Your progress is auto-saved when you change zones."
  ];

  tips.forEach((tip, i) => {
    k.add([k.text(tip, { size: 11 }), k.pos(k.width() / 2, 90 + i * 22), k.anchor("center"), k.color(180, 180, 200)]);
  });

  const startText = k.add([
    k.text("[ PRESS SPACE TO BEGIN ]", { size: 14 }),
    k.pos(k.width() / 2, k.height() - 50), k.anchor("center"), k.color(255, 220, 100)
  ]);
  startText.onUpdate(() => { startText.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4); });

  k.onKeyPress("space", () => { playerStats.tutorialSeen = true; k.go("game"); });
  k.onKeyPress("enter", () => { playerStats.tutorialSeen = true; k.go("game"); });
  k.onKeyPress("escape", () => { playerStats.tutorialSeen = true; k.go("game"); });
});

// ============================================
// SETTINGS SCENE
// ============================================
k.scene("settings", () => {
  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(20, 25, 40)]);
  k.add([k.text("SETTINGS", { size: 28 }), k.pos(k.width() / 2, 50), k.anchor("center"), k.color(255, 220, 100)]);

  k.add([k.text(`Music Volume: ${settings.musicVolume}%`, { size: 14 }), k.pos(k.width() / 2, 150), k.anchor("center"), k.color(200, 200, 220)]);
  k.add([k.text(`SFX Volume: ${settings.sfxVolume}%`, { size: 14 }), k.pos(k.width() / 2, 190), k.anchor("center"), k.color(200, 200, 220)]);
  k.add([k.text(`Show Tutorial: ${settings.showTutorial ? 'Yes' : 'No'}`, { size: 14 }), k.pos(k.width() / 2, 230), k.anchor("center"), k.color(200, 200, 220)]);

  if (hasSaveGame()) {
    k.add([k.text("Press D to DELETE save data", { size: 12 }), k.pos(k.width() / 2, 300), k.anchor("center"), k.color(200, 100, 100)]);
  }

  k.add([k.text("Press ESC or SPACE to return", { size: 12 }), k.pos(k.width() / 2, k.height() - 50), k.anchor("center"), k.color(150, 150, 180)]);

  k.onKeyPress("escape", () => k.go("title"));
  k.onKeyPress("space", () => k.go("title"));
  k.onKeyPress("d", () => { deleteSave(); showMessage("Save deleted!"); k.go("title"); });
});

// ============================================
// PAUSE MENU
// ============================================
function drawPauseMenu() {
  k.drawRect({ pos: k.vec2(0, 0), width: k.width(), height: k.height(), color: k.rgb(0, 0, 0), opacity: 0.7, fixed: true });
  k.drawText({ text: "PAUSED", pos: k.vec2(k.width() / 2, 80), size: 32, anchor: "center", color: k.rgb(255, 220, 100), fixed: true });

  const options = ["Resume (ESC)", "Save Game (F5)", "Settings", "Main Menu"];
  options.forEach((opt, i) => {
    k.drawText({ text: opt, pos: k.vec2(k.width() / 2, 160 + i * 40), size: 14, anchor: "center", color: k.rgb(200, 200, 220), fixed: true });
  });
}

// ============================================
// GAME SCENE
// ============================================
k.scene("game", () => {
  window.gameState.started = true;
  startBGM();

  loadZone(currentZone);

  // Player shadow
  const playerShadow = k.add([k.ellipse(12, 6), k.pos(0, 0), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.3), k.z(3)]);

  player = k.add([
    k.rect(14, 22), k.pos(zones[currentZone].width * TILE_SIZE / 2, zones[currentZone].height * TILE_SIZE / 2),
    k.anchor("center"), k.color(...COLORS.player), k.area(), k.z(10), "player",
    { dir: k.vec2(0, 1), attacking: false, walkFrame: 0 }
  ]);

  // Game loop
  player.onUpdate(() => {
    const shakeX = screenShake > 0 ? k.rand(-screenShake, screenShake) : 0;
    const shakeY = screenShake > 0 ? k.rand(-screenShake, screenShake) : 0;
    k.camPos(player.pos.add(k.vec2(shakeX, shakeY)));
    screenShake *= 0.9;
    playerShadow.pos = player.pos.add(k.vec2(0, 13));
    window.gameState.stats = playerStats;

    // Update play time
    gameTime += k.dt();
    if (gameTime > 60) { playerStats.playTime += 1; gameTime -= 60; }
  });

  // Movement
  k.onUpdate(() => {
    if (dialogueOpen || inventoryOpen || pauseOpen || shopOpen || playerStats.hp <= 0) return;

    // Regenerate
    if (!k.isKeyDown("shift")) playerStats.stamina = Math.min(playerStats.maxStamina, playerStats.stamina + 15 * k.dt());
    playerStats.magicka = Math.min(playerStats.maxMagicka, playerStats.magicka + 4 * k.dt());

    let moveDir = k.vec2(0, 0);
    if (k.isKeyDown("w") || k.isKeyDown("up")) moveDir.y -= 1;
    if (k.isKeyDown("s") || k.isKeyDown("down")) moveDir.y += 1;
    if (k.isKeyDown("a") || k.isKeyDown("left")) moveDir.x -= 1;
    if (k.isKeyDown("d") || k.isKeyDown("right")) moveDir.x += 1;

    if (moveDir.len() > 0) {
      moveDir = moveDir.unit();
      player.dir = moveDir;
      let speed = PLAYER_SPEED;
      if (k.isKeyDown("shift") && playerStats.stamina > 0) {
        speed = SPRINT_SPEED;
        playerStats.stamina -= 8 * k.dt();
      }

      const newPos = player.pos.add(moveDir.scale(speed * k.dt()));
      const zone = zones[currentZone];
      if (newPos.x > 10 && newPos.x < zone.width * TILE_SIZE - 10 && newPos.y > 10 && newPos.y < zone.height * TILE_SIZE - 10) {
        player.pos = newPos;
      }
    }

    if (attackCooldown > 0) attackCooldown -= k.dt();
    checkZoneExits();

    // Update messages
    messageQueue = messageQueue.filter(m => { m.time -= k.dt(); return m.time > 0; });
    if (achievementDisplay) { achievementDisplay.time -= k.dt(); if (achievementDisplay.time <= 0) achievementDisplay = null; }
  });

  // Attack
  k.onKeyPress("space", () => {
    if (dialogueOpen || inventoryOpen || pauseOpen || shopOpen || playerStats.hp <= 0 || attackCooldown > 0) return;

    const weapon = weapons[playerStats.equipment.weapon];
    attackCooldown = weapon.speed;

    if (weapon.type === 'magic' && playerStats.magicka >= 20) {
      playerStats.magicka -= 20;
      playSound('magic');
      spawnMagicParticles(player.pos.add(player.dir.scale(30)), weapon.element);

      // Projectile attack
      const proj = k.add([
        k.circle(6), k.pos(player.pos.add(player.dir.scale(20))), k.anchor("center"),
        k.color(...(weapon.element === 'fire' ? COLORS.fire : COLORS.frost)), k.lifespan(1), k.z(15),
        "projectile", { dir: player.dir, damage: weapon.damage, element: weapon.element }
      ]);
    } else {
      playerStats.stamina = Math.max(0, playerStats.stamina - 12);
      playSound('sword');

      const attackPos = player.pos.add(player.dir.scale(weapon.range / 2 + 12));
      k.add([k.circle(weapon.range * 0.7), k.pos(attackPos), k.anchor("center"), k.color(255, 200, 100), k.opacity(0.3), k.lifespan(0.12), k.z(9)]);
      spawnParticles(attackPos, 5, [255, 220, 150], 100, 0.25);

      for (const enemy of enemyObjects) {
        if (enemy.exists() && enemy.hp > 0 && player.pos.dist(enemy.pos) < weapon.range + enemy.size + 5) {
          const skillMult = 1 + playerStats.skills.combat * 0.08;
          const crit = weapon.critBonus && Math.random() < 0.15 ? weapon.critBonus : 1;
          const damage = Math.floor(weapon.damage * skillMult * crit);
          dealDamageToEnemy(enemy, damage, crit > 1);
        }
      }
    }
    playerStats.xp.combat += 3;
    checkLevelUp();
  });

  // Projectile update
  k.onUpdate("projectile", (proj) => {
    proj.pos = proj.pos.add(proj.dir.scale(200 * k.dt()));
    for (const enemy of enemyObjects) {
      if (enemy.exists() && enemy.hp > 0 && proj.pos.dist(enemy.pos) < enemy.size + 8) {
        dealDamageToEnemy(enemy, proj.damage, false);
        spawnMagicParticles(proj.pos, proj.element);
        proj.destroy();
        playerStats.xp.magic += 5;
        return;
      }
    }
  });

  // Interact
  k.onKeyPress("e", () => {
    if (inventoryOpen || pauseOpen || playerStats.hp <= 0) return;
    if (shopOpen) { shopOpen = false; currentShop = null; return; }
    if (dialogueOpen) { dialogueOpen = false; currentDialogue = null; return; }

    for (const npc of npcObjects) {
      if (npc.exists() && player.pos.dist(npc.pos) < 40) {
        playSound('pickup');
        if (npc.npcData.shop) {
          shopOpen = true;
          currentShop = { npc: npc.npcData, items: npc.npcData.shop };
        } else {
          dialogueOpen = true;
          currentDialogue = npc.npcData;
          if (npc.npcData.quest && !playerStats.quests.active.includes(npc.npcData.quest) && !playerStats.quests.completed.includes(npc.npcData.quest)) {
            playerStats.quests.active.push(npc.npcData.quest);
            showMessage(`New Quest: ${quests[npc.npcData.quest].name}`, [100, 200, 255]);
          }
        }
        return;
      }
    }

    for (const chest of chestObjects) {
      if (chest.exists() && !chest.opened && player.pos.dist(chest.pos) < 40) {
        chest.opened = true;
        chest.color = k.rgb(80, 60, 40);
        playerStats.gold += chest.chestData.gold;
        playerStats.totalGold += chest.chestData.gold;
        playSound('pickup');
        spawnParticles(chest.pos, 10, COLORS.gold, 80, 0.6);
        showMessage(`+${chest.chestData.gold} Gold`, COLORS.gold);

        for (const itemId of chest.chestData.items) {
          playerStats.inventory.push(itemId);
          playerStats.itemsCollected++;
          k.wait(0.2, () => showMessage(`Found: ${items[itemId].name}`, [200, 200, 255]));

          // Check quest completion
          for (const questId of playerStats.quests.active) {
            const quest = quests[questId];
            if (quest && quest.objective === itemId) {
              playerStats.quests.active = playerStats.quests.active.filter(q => q !== questId);
              playerStats.quests.completed.push(questId);
              playerStats.gold += quest.reward;
              playerStats.totalGold += quest.reward;
              playSound('achievement');
              k.wait(0.5, () => showMessage(`Quest Complete: ${quest.name}! +${quest.reward}g`, [255, 220, 100]));
            }
          }
        }
        checkAchievements();
        return;
      }
    }
  });

  // Inventory
  k.onKeyPress("i", () => { if (!dialogueOpen && !shopOpen && !pauseOpen) { inventoryOpen = !inventoryOpen; playSound('menuSelect'); } });

  // Use potion
  k.onKeyPress("q", () => {
    if (dialogueOpen || inventoryOpen || pauseOpen || shopOpen) return;
    const idx = playerStats.inventory.findIndex(i => i === 'health_potion' || i === 'health_potion_large');
    if (idx >= 0 && playerStats.hp < playerStats.maxHp) {
      const item = items[playerStats.inventory[idx]];
      playerStats.inventory.splice(idx, 1);
      playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + item.amount);
      playSound('pickup');
      showMessage(`+${item.amount} HP`, [100, 255, 100]);
      spawnParticles(player.pos, 8, [100, 255, 100], 50, 0.5);
    }
  });

  // Quick save
  k.onKeyPress("f5", () => { saveGame(); });

  // Pause
  k.onKeyPress("escape", () => {
    if (shopOpen) { shopOpen = false; return; }
    if (dialogueOpen) { dialogueOpen = false; return; }
    if (inventoryOpen) { inventoryOpen = false; return; }
    pauseOpen = !pauseOpen;
    playSound('menuSelect');
  });

  // Enemy AI
  k.onUpdate("enemy", (enemy) => {
    if (enemy.hp <= 0 || dialogueOpen || pauseOpen || playerStats.hp <= 0) return;
    const dist = player.pos.dist(enemy.pos);
    const def = enemies[enemy.enemyType];

    if (enemy.hitFlash > 0) { enemy.hitFlash -= k.dt(); enemy.color = k.rgb(255, 255, 255); }
    else { enemy.color = k.rgb(...def.color); }

    const detectRange = def.boss ? 200 : 150;
    if (dist < detectRange) {
      const dir = player.pos.sub(enemy.pos).unit();

      if (def.ranged && dist > 60 && dist < 150 && enemy.attackCooldown <= 0) {
        // Ranged attack
        enemy.attackCooldown = 1.5;
        const arrow = k.add([
          k.rect(8, 3), k.pos(enemy.pos), k.anchor("center"), k.color(150, 100, 50),
          k.lifespan(2), k.z(15), "enemyProjectile", { dir, damage: def.damage }
        ]);
        arrow.angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
      } else if (!def.ranged || dist < 60) {
        enemy.pos = enemy.pos.add(dir.scale(def.speed * k.dt()));
      }

      if (dist < 25 && enemy.attackCooldown <= 0 && !def.ranged) {
        enemy.attackCooldown = 1;
        let dmg = def.damage;
        if (def.poison) dmg += 3; // Poison damage
        playerStats.hp -= dmg;
        playSound('hit');
        addScreenShake(8);
        showMessage(`-${dmg}`, [255, 80, 80]);

        if (playerStats.hp <= 0) {
          playSound('death');
          showMessage("YOU DIED", [200, 50, 50]);
          addScreenShake(20);
          stopBGM();
          k.wait(2.5, () => k.go("gameover"));
        }
      }
    }

    if (enemy.attackCooldown > 0) enemy.attackCooldown -= k.dt();
    if (enemy.shadow) enemy.shadow.pos = enemy.pos.add(k.vec2(0, def.size / 2 + 3));
  });

  // Enemy projectiles
  k.onUpdate("enemyProjectile", (proj) => {
    proj.pos = proj.pos.add(proj.dir.scale(120 * k.dt()));
    if (proj.pos.dist(player.pos) < 15) {
      playerStats.hp -= proj.damage;
      playSound('hit');
      addScreenShake(5);
      showMessage(`-${proj.damage}`, [255, 80, 80]);
      proj.destroy();
      if (playerStats.hp <= 0) {
        playSound('death');
        stopBGM();
        k.wait(2, () => k.go("gameover"));
      }
    }
  });

  // Draw HUD
  k.onDraw(() => {
    drawHUD();
    if (pauseOpen) drawPauseMenu();
    if (inventoryOpen) drawInventory();
    if (dialogueOpen && currentDialogue) drawDialogue();
    if (shopOpen && currentShop) drawShop();
    drawMessages();
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function loadZone(zoneId) {
  const zone = zones[zoneId];
  if (!playerStats.zonesVisited.includes(zoneId)) {
    playerStats.zonesVisited.push(zoneId);
    checkAchievements();
  }

  // Auto-save on zone change
  saveGame();

  k.destroyAll("enemy"); k.destroyAll("npc"); k.destroyAll("chest");
  k.destroyAll("exit_indicator"); k.destroyAll("structure"); k.destroyAll("tree"); k.destroyAll("shadow");
  enemyObjects = []; npcObjects = []; chestObjects = [];

  // Zone background
  k.add([k.rect(zone.width * TILE_SIZE, zone.height * TILE_SIZE), k.pos(0, 0), k.color(...zone.ambientColor), k.z(-10)]);

  // Grid
  for (let x = 0; x < zone.width; x++) {
    for (let y = 0; y < zone.height; y++) {
      if ((x + y) % 2 === 0) {
        k.add([k.rect(TILE_SIZE, TILE_SIZE), k.pos(x * TILE_SIZE, y * TILE_SIZE),
          k.color(zone.ambientColor[0] + 8, zone.ambientColor[1] + 8, zone.ambientColor[2] + 8), k.opacity(0.2), k.z(-9)]);
      }
    }
  }

  // Structures
  if (zone.structures) {
    for (const s of zone.structures) {
      k.add([k.rect(s.w * TILE_SIZE, s.h * TILE_SIZE), k.pos(s.x * TILE_SIZE, s.y * TILE_SIZE), k.color(60, 50, 40), k.z(0), "structure"]);
      k.add([k.rect(s.w * TILE_SIZE, 4), k.pos(s.x * TILE_SIZE, s.y * TILE_SIZE), k.color(90, 70, 50), k.z(1)]);
    }
  }

  // Trees
  if (zone.trees) {
    for (let i = 0; i < zone.trees; i++) {
      const tx = k.rand(3, zone.width - 3) * TILE_SIZE;
      const ty = k.rand(3, zone.height - 3) * TILE_SIZE;
      k.add([k.ellipse(12, 6), k.pos(tx, ty + 20), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.2), k.z(1), "tree"]);
      k.add([k.rect(6, 16), k.pos(tx - 3, ty), k.color(80, 60, 40), k.z(2), "tree"]);
      k.add([k.circle(14), k.pos(tx, ty - 8), k.anchor("center"), k.color(40, 80, 50), k.z(3), "tree"]);
    }
  }

  // Exits
  for (const exit of zone.exits) {
    k.add([k.rect(exit.width * TILE_SIZE, exit.height * TILE_SIZE), k.pos(exit.x * TILE_SIZE, exit.y * TILE_SIZE),
      k.color(80, 180, 100), k.opacity(0.2), k.z(-5), "exit_indicator"]);
  }

  // Enemies
  if (zone.enemies) {
    for (const e of zone.enemies) {
      const def = enemies[e.type];
      const shadow = k.add([k.ellipse(def.size * 0.7, def.size * 0.3), k.pos(e.x * TILE_SIZE, e.y * TILE_SIZE + def.size / 2 + 3),
        k.anchor("center"), k.color(0, 0, 0), k.opacity(0.3), k.z(4), "shadow"]);
      const enemy = k.add([
        k.rect(def.size, def.size), k.pos(e.x * TILE_SIZE, e.y * TILE_SIZE), k.anchor("center"),
        k.color(...def.color), k.area(), k.z(5), "enemy",
        { enemyType: e.type, hp: def.hp, maxHp: def.hp, size: def.size, attackCooldown: 0, hitFlash: 0, shadow }
      ]);
      enemyObjects.push(enemy);
    }
  }

  // NPCs
  if (zone.npcs) {
    for (const n of zone.npcs) {
      k.add([k.ellipse(8, 4), k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE + 12), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.3), k.z(4)]);
      const npc = k.add([k.rect(12, 18), k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE), k.anchor("center"), k.color(...COLORS.npc), k.z(5), "npc", { npcData: n }]);
      k.add([k.text(n.name, { size: 7 }), k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE - 18), k.anchor("center"), k.color(220, 215, 180), k.z(6)]);
      npcObjects.push(npc);
    }
  }

  // Chests
  if (zone.chests) {
    for (const c of zone.chests) {
      k.add([k.circle(18), k.pos(c.x * TILE_SIZE, c.y * TILE_SIZE), k.anchor("center"), k.color(255, 200, 100), k.opacity(0.15), k.z(3)]);
      const chest = k.add([k.rect(18, 14), k.pos(c.x * TILE_SIZE, c.y * TILE_SIZE), k.anchor("center"), k.color(180, 140, 80), k.z(4), "chest", { chestData: c, opened: false }]);
      chestObjects.push(chest);
    }
  }
}

function checkZoneExits() {
  const zone = zones[currentZone];
  for (const exit of zone.exits) {
    const exitX = exit.x * TILE_SIZE, exitY = exit.y * TILE_SIZE;
    const exitW = exit.width * TILE_SIZE, exitH = exit.height * TILE_SIZE;
    if (player.pos.x >= exitX && player.pos.x <= exitX + exitW && player.pos.y >= exitY && player.pos.y <= exitY + exitH) {
      currentZone = exit.to;
      loadZone(currentZone);
      player.pos = k.vec2(exit.toX * TILE_SIZE, exit.toY * TILE_SIZE);
      playSound('pickup', 0.2);
      return;
    }
  }
}

function dealDamageToEnemy(enemy, damage, crit) {
  enemy.hp -= damage;
  playSound('hit');
  addScreenShake(5);
  showMessage(`${crit ? 'CRIT! ' : ''}-${damage}`, crit ? [255, 255, 100] : [255, 200, 100]);
  spawnParticles(enemy.pos, 8, [150, 50, 50], 80, 0.4);
  enemy.hitFlash = 0.15;

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  } else {
    const knockDir = enemy.pos.sub(player.pos).unit();
    enemy.pos = enemy.pos.add(knockDir.scale(20));
  }
}

function killEnemy(enemy) {
  const def = enemies[enemy.enemyType];
  playerStats.kills++;
  if (def.boss) playerStats.bossKills++;
  playerStats.xp.combat += def.xp;

  spawnParticles(enemy.pos, 15, def.color, 100, 0.6);
  addScreenShake(def.boss ? 12 : 5);
  playSound('death', 0.4);

  const goldDrop = Math.floor(k.rand(def.gold[0], def.gold[1]));
  if (goldDrop > 0) {
    playerStats.gold += goldDrop;
    playerStats.totalGold += goldDrop;
    showMessage(`+${goldDrop} Gold`, COLORS.gold);
  }

  checkLevelUp();
  checkAchievements();
  if (enemy.shadow) enemy.shadow.destroy();
  enemy.destroy();
  enemyObjects = enemyObjects.filter(e => e !== enemy);
}

function checkLevelUp() {
  const totalXp = playerStats.xp.combat + playerStats.xp.magic + playerStats.xp.stealth;
  const xpNeeded = playerStats.level * 120;

  if (totalXp >= xpNeeded && playerStats.level < 20) {
    playerStats.level++;
    playerStats.maxHp += 12;
    playerStats.hp = playerStats.maxHp;
    playerStats.maxMagicka += 8;
    playerStats.magicka = playerStats.maxMagicka;
    playerStats.maxStamina += 8;
    playerStats.stamina = playerStats.maxStamina;
    playerStats.skills.combat = Math.min(15, playerStats.skills.combat + 1);
    playerStats.skills.magic = Math.min(15, playerStats.skills.magic + 1);

    playSound('levelup');
    addScreenShake(4);
    showMessage(`LEVEL UP! Lv.${playerStats.level}`, [255, 255, 150]);
    spawnParticles(player.pos, 25, [255, 255, 200], 100, 0.8);
    checkAchievements();
  }
}

// ============================================
// UI DRAWING
// ============================================
function drawHUD() {
  // Top bar
  k.drawRect({ pos: k.vec2(0, 0), width: k.width(), height: 55, color: k.rgb(15, 18, 30), opacity: 0.9, fixed: true });
  k.drawRect({ pos: k.vec2(0, 53), width: k.width(), height: 2, color: k.rgb(60, 80, 120), opacity: 0.5, fixed: true });

  k.drawText({ text: zones[currentZone].name.toUpperCase(), pos: k.vec2(k.width() / 2, 10), size: 11, anchor: "center", color: k.rgb(180, 190, 220), fixed: true });

  // Bars
  drawBar(10, 28, 120, 14, playerStats.hp, playerStats.maxHp, COLORS.health, "HP");
  drawBar(140, 28, 90, 10, playerStats.magicka, playerStats.maxMagicka, COLORS.mana, "MP");
  drawBar(240, 28, 90, 10, playerStats.stamina, playerStats.maxStamina, COLORS.stamina, "ST");

  k.drawText({ text: `Gold: ${playerStats.gold}`, pos: k.vec2(k.width() - 80, 15), size: 11, color: k.rgb(...COLORS.gold), fixed: true });
  k.drawText({ text: `Lv.${playerStats.level}`, pos: k.vec2(k.width() - 80, 32), size: 10, color: k.rgb(200, 200, 220), fixed: true });

  // XP bar
  const totalXp = playerStats.xp.combat + playerStats.xp.magic + playerStats.xp.stealth;
  const xpNeeded = playerStats.level * 120;
  k.drawRect({ pos: k.vec2(k.width() - 80, 45), width: 60, height: 4, color: k.rgb(40, 40, 50), fixed: true });
  k.drawRect({ pos: k.vec2(k.width() - 80, 45), width: 60 * Math.min(1, totalXp / xpNeeded), height: 4, color: k.rgb(...COLORS.xp), fixed: true });

  // Quest tracker
  if (playerStats.quests.active.length > 0) {
    const quest = quests[playerStats.quests.active[0]];
    if (quest) {
      k.drawRect({ pos: k.vec2(k.width() - 160, k.height() - 45), width: 150, height: 35, color: k.rgb(20, 25, 40), opacity: 0.85, radius: 4, fixed: true });
      k.drawText({ text: `Quest: ${quest.name}`, pos: k.vec2(k.width() - 155, k.height() - 38), size: 8, color: k.rgb(255, 220, 100), fixed: true });
      k.drawText({ text: quest.desc, pos: k.vec2(k.width() - 155, k.height() - 24), size: 7, color: k.rgb(180, 180, 200), fixed: true });
    }
  }

  // Bottom bar
  k.drawRect({ pos: k.vec2(5, k.height() - 30), width: 150, height: 24, color: k.rgb(20, 25, 40), opacity: 0.85, radius: 4, fixed: true });
  k.drawText({ text: weapons[playerStats.equipment.weapon].name, pos: k.vec2(10, k.height() - 22), size: 9, color: k.rgb(180, 180, 200), fixed: true });
  const potions = playerStats.inventory.filter(i => i.includes('health_potion')).length;
  if (potions > 0) k.drawText({ text: `[Q] Potion x${potions}`, pos: k.vec2(100, k.height() - 22), size: 8, color: k.rgb(150, 180, 150), fixed: true });
}

function drawBar(x, y, w, h, cur, max, color, label) {
  k.drawRect({ pos: k.vec2(x, y), width: w, height: h, color: k.rgb(30, 35, 50), radius: 2, fixed: true });
  if (cur > 0) {
    k.drawRect({ pos: k.vec2(x, y), width: w * (cur / max), height: h, color: k.rgb(...color), radius: 2, fixed: true });
    k.drawRect({ pos: k.vec2(x, y), width: w * (cur / max), height: h / 3, color: k.rgb(255, 255, 255), opacity: 0.2, radius: 2, fixed: true });
  }
  k.drawText({ text: label, pos: k.vec2(x + 4, y + h / 2 - 4), size: 7, color: k.rgb(255, 255, 255), fixed: true });
}

function drawInventory() {
  k.drawRect({ pos: k.vec2(80, 60), width: k.width() - 160, height: k.height() - 120, color: k.rgb(20, 25, 40), opacity: 0.95, radius: 8, fixed: true });
  k.drawRect({ pos: k.vec2(80, 60), width: k.width() - 160, height: k.height() - 120, outline: { color: k.rgb(70, 90, 130), width: 2 }, fill: false, radius: 8, fixed: true });

  k.drawText({ text: "INVENTORY", pos: k.vec2(k.width() / 2, 80), size: 18, anchor: "center", color: k.rgb(200, 190, 150), fixed: true });
  k.drawText({ text: `Weapon: ${weapons[playerStats.equipment.weapon].name}`, pos: k.vec2(100, 115), size: 11, color: k.rgb(180, 180, 210), fixed: true });

  let y = 145;
  const counts = {};
  for (const item of playerStats.inventory) counts[item] = (counts[item] || 0) + 1;
  for (const [id, count] of Object.entries(counts)) {
    if (items[id]) {
      k.drawText({ text: `${items[id].name} x${count}`, pos: k.vec2(100, y), size: 10, color: k.rgb(170, 170, 190), fixed: true });
      y += 18;
    }
  }

  k.drawText({ text: `Combat: ${playerStats.skills.combat}  Magic: ${playerStats.skills.magic}  Stealth: ${playerStats.skills.stealth}`, pos: k.vec2(100, k.height() - 100), size: 9, color: k.rgb(140, 150, 180), fixed: true });
  k.drawText({ text: `Achievements: ${playerStats.achievements.length}/${Object.keys(achievementDefs).length}`, pos: k.vec2(100, k.height() - 80), size: 9, color: k.rgb(200, 180, 100), fixed: true });
  k.drawText({ text: "[I] Close", pos: k.vec2(k.width() / 2, k.height() - 60), size: 10, anchor: "center", color: k.rgb(150, 150, 170), fixed: true });
}

function drawDialogue() {
  k.drawRect({ pos: k.vec2(50, k.height() - 100), width: k.width() - 100, height: 90, color: k.rgb(15, 20, 35), opacity: 0.95, radius: 6, fixed: true });
  k.drawRect({ pos: k.vec2(50, k.height() - 100), width: k.width() - 100, height: 90, outline: { color: k.rgb(80, 100, 140), width: 2 }, fill: false, radius: 6, fixed: true });
  k.drawText({ text: currentDialogue.name, pos: k.vec2(65, k.height() - 90), size: 12, color: k.rgb(255, 220, 120), fixed: true });
  k.drawText({ text: currentDialogue.dialogue, pos: k.vec2(65, k.height() - 70), size: 10, width: k.width() - 130, color: k.rgb(200, 205, 220), fixed: true });
  k.drawText({ text: "[E] Continue", pos: k.vec2(k.width() - 65, k.height() - 20), size: 9, anchor: "right", color: k.rgb(150, 150, 170), fixed: true });
}

function drawShop() {
  k.drawRect({ pos: k.vec2(100, 80), width: k.width() - 200, height: k.height() - 160, color: k.rgb(20, 25, 40), opacity: 0.95, radius: 8, fixed: true });
  k.drawRect({ pos: k.vec2(100, 80), width: k.width() - 200, height: k.height() - 160, outline: { color: k.rgb(100, 80, 50), width: 2 }, fill: false, radius: 8, fixed: true });

  k.drawText({ text: `${currentShop.npc.name}'s Shop`, pos: k.vec2(k.width() / 2, 100), size: 16, anchor: "center", color: k.rgb(255, 220, 100), fixed: true });
  k.drawText({ text: `Your Gold: ${playerStats.gold}`, pos: k.vec2(k.width() / 2, 125), size: 11, anchor: "center", color: k.rgb(...COLORS.gold), fixed: true });

  let y = 155;
  for (let i = 0; i < currentShop.items.length; i++) {
    const itemId = currentShop.items[i];
    let item = items[itemId] || weapons[itemId];
    if (item) {
      const price = item.value || 100;
      const canBuy = playerStats.gold >= price;
      k.drawText({ text: `${i + 1}. ${item.name} - ${price}g`, pos: k.vec2(120, y), size: 10, color: canBuy ? k.rgb(180, 180, 200) : k.rgb(100, 100, 100), fixed: true });
      y += 22;
    }
  }

  k.drawText({ text: "Press 1-4 to buy, [E] to close", pos: k.vec2(k.width() / 2, k.height() - 100), size: 9, anchor: "center", color: k.rgb(150, 150, 170), fixed: true });

  // Handle number keys for buying
  for (let i = 1; i <= 4; i++) {
    if (k.isKeyPressed(String(i))) {
      const itemId = currentShop.items[i - 1];
      if (itemId) {
        const item = items[itemId] || weapons[itemId];
        const price = item?.value || 100;
        if (item && playerStats.gold >= price) {
          playerStats.gold -= price;
          if (weapons[itemId]) {
            playerStats.equipment.weapon = itemId;
            showMessage(`Equipped: ${item.name}`, [100, 255, 100]);
          } else {
            playerStats.inventory.push(itemId);
            showMessage(`Bought: ${item.name}`, [100, 255, 100]);
          }
          playSound('pickup');
        }
      }
    }
  }
}

function drawMessages() {
  let y = 70;
  for (const msg of messageQueue) {
    k.drawText({ text: msg.text, pos: k.vec2(k.width() / 2, y), size: 12, anchor: "center", color: k.rgb(...msg.color), opacity: Math.min(1, msg.time), fixed: true });
    y += 20;
  }

  if (achievementDisplay) {
    k.drawRect({ pos: k.vec2(k.width() / 2 - 120, 120), width: 240, height: 50, color: k.rgb(40, 35, 20), opacity: 0.95, radius: 6, fixed: true });
    k.drawRect({ pos: k.vec2(k.width() / 2 - 120, 120), width: 240, height: 50, outline: { color: k.rgb(255, 200, 50), width: 2 }, fill: false, radius: 6, fixed: true });
    k.drawText({ text: "ACHIEVEMENT UNLOCKED!", pos: k.vec2(k.width() / 2, 132), size: 10, anchor: "center", color: k.rgb(255, 220, 100), fixed: true });
    k.drawText({ text: achievementDisplay.name, pos: k.vec2(k.width() / 2, 152), size: 14, anchor: "center", color: k.rgb(255, 255, 200), fixed: true });
  }
}

// ============================================
// GAME OVER SCENE
// ============================================
k.scene("gameover", () => {
  stopBGM();

  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(30, 15, 15)]);
  k.add([k.text("YOU DIED", { size: 48 }), k.pos(k.width() / 2, 100), k.anchor("center"), k.color(200, 50, 50)]);

  k.add([k.text(`Level: ${playerStats.level}`, { size: 14 }), k.pos(k.width() / 2, 200), k.anchor("center"), k.color(180, 180, 200)]);
  k.add([k.text(`Enemies Defeated: ${playerStats.kills}`, { size: 14 }), k.pos(k.width() / 2, 230), k.anchor("center"), k.color(180, 180, 200)]);
  k.add([k.text(`Gold Earned: ${playerStats.totalGold}`, { size: 14 }), k.pos(k.width() / 2, 260), k.anchor("center"), k.color(180, 180, 200)]);
  k.add([k.text(`Quests Completed: ${playerStats.quests.completed.length}`, { size: 14 }), k.pos(k.width() / 2, 290), k.anchor("center"), k.color(180, 180, 200)]);

  const restartText = k.add([k.text("[ PRESS SPACE TO RETURN TO MENU ]", { size: 14 }), k.pos(k.width() / 2, k.height() - 60), k.anchor("center"), k.color(255, 220, 100)]);
  restartText.onUpdate(() => { restartText.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4); });

  k.onKeyPress("space", () => k.go("title"));
});

// Start game
k.go("title");
