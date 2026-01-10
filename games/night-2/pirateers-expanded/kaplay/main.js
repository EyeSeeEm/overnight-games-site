// Pirateers Expanded - Naval Combat (Kaplay)
// Uses global 'kaplay' from CDN

const k = kaplay({
  width: 800,
  height: 600,
  background: [20, 60, 100],
  global: false,
});

// Audio Context for procedural sounds
let audioCtx = null;
let bgmOscillators = [];
let bgmGain = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type, freq = 440, duration = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "cannon") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    duration = 0.3;
  } else if (type === "hit") {
    osc.type = "square";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    duration = 0.15;
  } else if (type === "splash") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    duration = 0.25;
  } else if (type === "coin") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.05);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    duration = 0.2;
  } else if (type === "dock") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(500, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    duration = 0.3;
  } else if (type === "upgrade") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    duration = 0.3;
  } else if (type === "death") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    duration = 1;
  } else if (type === "victory") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.15);
    osc.frequency.setValueAtTime(784, t + 0.3);
    osc.frequency.setValueAtTime(1047, t + 0.45);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.2, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    duration = 0.7;
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function startBGM() {
  if (!audioCtx || bgmOscillators.length > 0) return;

  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(settings.musicVolume * 0.08, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  // Sea shanty style BGM
  const bassNotes = [65.41, 82.41, 98.00, 82.41]; // C2, E2, G2, E2
  let noteIndex = 0;

  function playBassNote() {
    if (bgmOscillators.length === 0) return;
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(bassNotes[noteIndex], audioCtx.currentTime);
    noteGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(noteGain);
    noteGain.connect(bgmGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
    noteIndex = (noteIndex + 1) % bassNotes.length;
    setTimeout(playBassNote, 500);
  }

  // Ambient ocean oscillator
  const oceanOsc = audioCtx.createOscillator();
  oceanOsc.type = "sine";
  oceanOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
  const oceanGain = audioCtx.createGain();
  oceanGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  oceanOsc.connect(oceanGain);
  oceanGain.connect(bgmGain);
  oceanOsc.start();
  bgmOscillators.push(oceanOsc);

  playBassNote();
}

function stopBGM() {
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  bgmOscillators = [];
}

function updateBGMVolume() {
  if (bgmGain && audioCtx) {
    bgmGain.gain.setValueAtTime(settings.musicVolume * 0.08, audioCtx.currentTime);
  }
}

// Game State
let playerStats = {
  gold: 100,
  health: 100,
  maxHealth: 100,
  cannonDamage: 10,
  reloadSpeed: 1,
  shipSpeed: 120,
  cargoCapacity: 50,
  cargo: {},
  kills: 0,
  bossKills: 0,
  totalGoldEarned: 0,
  islandsVisited: new Set(),
  upgradesPurchased: 0,
  reputation: 0
};

let settings = {
  musicVolume: 0.5,
  sfxVolume: 0.7
};

let achievements = {
  firstBlood: { name: "First Blood", desc: "Sink your first ship", unlocked: false },
  richPirate: { name: "Rich Pirate", desc: "Accumulate 1000 gold", unlocked: false },
  explorer: { name: "Explorer", desc: "Visit all 8 islands", unlocked: false },
  bossSlayer: { name: "Boss Slayer", desc: "Defeat a boss ship", unlocked: false },
  upgraded: { name: "Upgraded", desc: "Purchase 5 upgrades", unlocked: false },
  feared: { name: "Feared", desc: "Reach 50 reputation", unlocked: false },
  legendary: { name: "Legendary", desc: "Sink 50 ships", unlocked: false },
  merchant: { name: "Merchant Prince", desc: "Complete 10 trade runs", unlocked: false },
  survivor: { name: "Survivor", desc: "Survive with <10% health", unlocked: false },
  collector: { name: "Collector", desc: "Fill cargo hold completely", unlocked: false }
};

let currentIsland = 0;
let tradeRuns = 0;
let isPaused = false;
let gameStarted = false;

// Island Data
const islands = [
  { name: "Tortuga", x: 100, y: 100, color: [180, 140, 100], goods: { rum: 8, spice: 15, cloth: 10 }, buys: ["gold_ore", "fish"] },
  { name: "Port Royal", x: 700, y: 100, color: [160, 120, 80], goods: { weapons: 20, cloth: 8, fish: 5 }, buys: ["rum", "spice"] },
  { name: "Nassau", x: 400, y: 150, color: [170, 130, 90], goods: { fish: 4, rum: 10, gold_ore: 25 }, buys: ["weapons", "cloth"] },
  { name: "Havana", x: 150, y: 500, color: [165, 125, 85], goods: { spice: 12, gold_ore: 22, weapons: 18 }, buys: ["fish", "rum"] },
  { name: "Kingston", x: 650, y: 500, color: [175, 135, 95], goods: { cloth: 12, fish: 6, rum: 9 }, buys: ["gold_ore", "spice"] },
  { name: "Barbados", x: 400, y: 450, color: [155, 115, 75], goods: { gold_ore: 20, weapons: 15, spice: 14 }, buys: ["cloth", "fish"] },
  { name: "Martinique", x: 200, y: 300, color: [168, 128, 88], goods: { rum: 7, cloth: 11, fish: 5 }, buys: ["weapons", "gold_ore"] },
  { name: "St. Lucia", x: 600, y: 300, color: [172, 132, 92], goods: { weapons: 16, spice: 13, gold_ore: 24 }, buys: ["rum", "cloth"] }
];

// Enemy Types
const enemyTypes = [
  { name: "Sloop", health: 30, damage: 5, speed: 80, color: [180, 60, 60], gold: 20, size: 15 },
  { name: "Brigantine", health: 50, damage: 8, speed: 60, color: [160, 50, 50], gold: 35, size: 18 },
  { name: "Frigate", health: 80, damage: 12, speed: 50, color: [140, 40, 40], gold: 60, size: 22 },
  { name: "Galleon", health: 120, damage: 15, speed: 35, color: [120, 30, 30], gold: 100, size: 26 },
  { name: "Man-o-War", health: 180, damage: 20, speed: 30, color: [100, 20, 20], gold: 150, size: 30 },
  { name: "Ghost Ship", health: 100, damage: 18, speed: 70, color: [100, 150, 180], gold: 120, size: 24 }
];

// Boss Ships
const bossTypes = [
  { name: "The Kraken's Fury", health: 400, damage: 30, speed: 40, color: [80, 0, 80], gold: 500, size: 40 },
  { name: "Blackbeard's Revenge", health: 500, damage: 35, speed: 35, color: [30, 30, 30], gold: 750, size: 45 },
  { name: "Flying Dutchman", health: 600, damage: 40, speed: 50, color: [50, 100, 80], gold: 1000, size: 50 }
];

// Upgrades
const upgrades = {
  hull: { name: "Hull Reinforcement", levels: [0, 150, 300, 500, 800], bonus: [0, 20, 40, 70, 100], current: 0 },
  cannons: { name: "Cannon Power", levels: [0, 100, 250, 450, 700], bonus: [0, 5, 10, 18, 28], current: 0 },
  reload: { name: "Reload Speed", levels: [0, 120, 280, 480, 750], bonus: [0, 0.1, 0.2, 0.35, 0.5], current: 0 },
  speed: { name: "Ship Speed", levels: [0, 130, 300, 520, 800], bonus: [0, 15, 30, 50, 80], current: 0 },
  cargo: { name: "Cargo Hold", levels: [0, 100, 220, 400, 650], bonus: [0, 20, 45, 80, 130], current: 0 }
};

// Save/Load
function saveGame() {
  const saveData = {
    stats: {
      ...playerStats,
      islandsVisited: Array.from(playerStats.islandsVisited)
    },
    settings,
    achievements,
    upgrades: Object.fromEntries(Object.entries(upgrades).map(([k, v]) => [k, v.current])),
    currentIsland,
    tradeRuns,
    timestamp: Date.now()
  };
  localStorage.setItem("pirateers_save", JSON.stringify(saveData));
}

function loadGame() {
  const data = localStorage.getItem("pirateers_save");
  if (data) {
    try {
      const saveData = JSON.parse(data);
      playerStats = {
        ...saveData.stats,
        islandsVisited: new Set(saveData.stats.islandsVisited || [])
      };
      if (saveData.settings) settings = saveData.settings;
      if (saveData.achievements) achievements = { ...achievements, ...saveData.achievements };
      if (saveData.upgrades) {
        Object.entries(saveData.upgrades).forEach(([k, v]) => {
          if (upgrades[k]) upgrades[k].current = v;
        });
        applyUpgrades();
      }
      if (saveData.currentIsland !== undefined) currentIsland = saveData.currentIsland;
      if (saveData.tradeRuns !== undefined) tradeRuns = saveData.tradeRuns;
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function applyUpgrades() {
  playerStats.maxHealth = 100 + upgrades.hull.bonus[upgrades.hull.current];
  playerStats.health = Math.min(playerStats.health, playerStats.maxHealth);
  playerStats.cannonDamage = 10 + upgrades.cannons.bonus[upgrades.cannons.current];
  playerStats.reloadSpeed = 1 + upgrades.reload.bonus[upgrades.reload.current];
  playerStats.shipSpeed = 120 + upgrades.speed.bonus[upgrades.speed.current];
  playerStats.cargoCapacity = 50 + upgrades.cargo.bonus[upgrades.cargo.current];
}

function checkAchievements() {
  if (!achievements.firstBlood.unlocked && playerStats.kills >= 1) {
    achievements.firstBlood.unlocked = true;
    showAchievement("First Blood");
  }
  if (!achievements.richPirate.unlocked && playerStats.gold >= 1000) {
    achievements.richPirate.unlocked = true;
    showAchievement("Rich Pirate");
  }
  if (!achievements.explorer.unlocked && playerStats.islandsVisited.size >= 8) {
    achievements.explorer.unlocked = true;
    showAchievement("Explorer");
  }
  if (!achievements.bossSlayer.unlocked && playerStats.bossKills >= 1) {
    achievements.bossSlayer.unlocked = true;
    showAchievement("Boss Slayer");
  }
  if (!achievements.upgraded.unlocked && playerStats.upgradesPurchased >= 5) {
    achievements.upgraded.unlocked = true;
    showAchievement("Upgraded");
  }
  if (!achievements.feared.unlocked && playerStats.reputation >= 50) {
    achievements.feared.unlocked = true;
    showAchievement("Feared");
  }
  if (!achievements.legendary.unlocked && playerStats.kills >= 50) {
    achievements.legendary.unlocked = true;
    showAchievement("Legendary");
  }
  if (!achievements.merchant.unlocked && tradeRuns >= 10) {
    achievements.merchant.unlocked = true;
    showAchievement("Merchant Prince");
  }
  if (!achievements.survivor.unlocked && playerStats.health < playerStats.maxHealth * 0.1 && playerStats.health > 0) {
    achievements.survivor.unlocked = true;
    showAchievement("Survivor");
  }
  const totalCargo = Object.values(playerStats.cargo).reduce((a, b) => a + b, 0);
  if (!achievements.collector.unlocked && totalCargo >= playerStats.cargoCapacity) {
    achievements.collector.unlocked = true;
    showAchievement("Collector");
  }
  saveGame();
}

let achievementQueue = [];
function showAchievement(name) {
  achievementQueue.push(name);
}

// Scenes
k.scene("menu", () => {
  stopBGM();

  // Ocean background
  for (let i = 0; i < 20; i++) {
    k.add([
      k.rect(800, 30),
      k.pos(0, i * 30),
      k.color(20 + i * 2, 60 + i * 3, 100 + i * 4),
      k.opacity(0.8)
    ]);
  }

  // Title
  k.add([
    k.text("PIRATEERS", { size: 64 }),
    k.pos(400, 120),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  k.add([
    k.text("EXPANDED", { size: 32 }),
    k.pos(400, 170),
    k.anchor("center"),
    k.color(200, 160, 80)
  ]);

  // Ship decoration
  k.add([
    k.text("⛵", { size: 80 }),
    k.pos(400, 260),
    k.anchor("center")
  ]);

  const hasSave = localStorage.getItem("pirateers_save") !== null;

  const buttons = [
    { text: "New Game", action: () => k.go("tutorial") },
    { text: "Continue", action: () => { loadGame(); k.go("game"); }, enabled: hasSave },
    { text: "Settings", action: () => k.go("settings") },
    { text: "Achievements", action: () => k.go("achievementsMenu") }
  ];

  buttons.forEach((btn, i) => {
    const enabled = btn.enabled !== false;
    const button = k.add([
      k.rect(200, 40, { radius: 6 }),
      k.pos(400, 340 + i * 55),
      k.anchor("center"),
      k.color(enabled ? 80 : 50, enabled ? 60 : 40, enabled ? 40 : 30),
      k.area(),
      "button"
    ]);

    k.add([
      k.text(btn.text, { size: 20 }),
      k.pos(400, 340 + i * 55),
      k.anchor("center"),
      k.color(enabled ? 255 : 100, enabled ? 255 : 100, enabled ? 255 : 100)
    ]);

    if (enabled) {
      button.onClick(() => {
        initAudio();
        playSound("dock");
        btn.action();
      });
      button.onHover(() => button.color = k.rgb(100, 80, 60));
      button.onHoverEnd(() => button.color = k.rgb(80, 60, 40));
    }
  });

  k.add([
    k.text("Use WASD to sail, SPACE to fire cannons", { size: 14 }),
    k.pos(400, 560),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  k.onKeyPress("space", () => {
    initAudio();
    playSound("dock");
    if (hasSave) {
      loadGame();
      k.go("game");
    } else {
      k.go("tutorial");
    }
  });
});

k.scene("tutorial", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 40, 60)
  ]);

  k.add([
    k.text("PIRATE TUTORIAL", { size: 36 }),
    k.pos(400, 50),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  const tips = [
    "WASD or Arrow Keys - Sail your ship",
    "SPACE - Fire cannons at enemies",
    "Dock at islands (brown circles) to trade",
    "Buy goods low, sell high at different ports",
    "Defeat enemy ships for gold and reputation",
    "Upgrade your ship at any port",
    "Watch for boss ships - they're dangerous but rewarding!",
    "Your game saves automatically at ports"
  ];

  tips.forEach((tip, i) => {
    k.add([
      k.text("• " + tip, { size: 18 }),
      k.pos(100, 120 + i * 45),
      k.color(200, 200, 200)
    ]);
  });

  const startBtn = k.add([
    k.rect(200, 50, { radius: 8 }),
    k.pos(400, 520),
    k.anchor("center"),
    k.color(60, 120, 60),
    k.area()
  ]);

  k.add([
    k.text("Set Sail!", { size: 24 }),
    k.pos(400, 520),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  startBtn.onClick(() => {
    playSound("dock");
    playerStats = {
      gold: 100, health: 100, maxHealth: 100, cannonDamage: 10,
      reloadSpeed: 1, shipSpeed: 120, cargoCapacity: 50, cargo: {},
      kills: 0, bossKills: 0, totalGoldEarned: 0, islandsVisited: new Set(),
      upgradesPurchased: 0, reputation: 0
    };
    Object.values(upgrades).forEach(u => u.current = 0);
    tradeRuns = 0;
    saveGame();
    k.go("game");
  });

  startBtn.onHover(() => startBtn.color = k.rgb(80, 150, 80));
  startBtn.onHoverEnd(() => startBtn.color = k.rgb(60, 120, 60));

  k.onKeyPress("space", () => {
    playSound("dock");
    playerStats = {
      gold: 100, health: 100, maxHealth: 100, cannonDamage: 10,
      reloadSpeed: 1, shipSpeed: 120, cargoCapacity: 50, cargo: {},
      kills: 0, bossKills: 0, totalGoldEarned: 0, islandsVisited: new Set(),
      upgradesPurchased: 0, reputation: 0
    };
    Object.values(upgrades).forEach(u => u.current = 0);
    tradeRuns = 0;
    saveGame();
    k.go("game");
  });
});

k.scene("settings", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 40, 60)
  ]);

  k.add([
    k.text("SETTINGS", { size: 36 }),
    k.pos(400, 80),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  // Music Volume
  k.add([
    k.text("Music Volume", { size: 20 }),
    k.pos(200, 180),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  const musicBar = k.add([
    k.rect(200, 20, { radius: 4 }),
    k.pos(400, 180),
    k.anchor("center"),
    k.color(60, 60, 60),
    k.area()
  ]);

  const musicFill = k.add([
    k.rect(settings.musicVolume * 200, 20, { radius: 4 }),
    k.pos(300, 170),
    k.color(80, 150, 80)
  ]);

  musicBar.onClick(() => {
    const mx = k.mousePos().x;
    settings.musicVolume = Math.max(0, Math.min(1, (mx - 300) / 200));
    musicFill.width = settings.musicVolume * 200;
    updateBGMVolume();
    saveGame();
  });

  // SFX Volume
  k.add([
    k.text("SFX Volume", { size: 20 }),
    k.pos(200, 250),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  const sfxBar = k.add([
    k.rect(200, 20, { radius: 4 }),
    k.pos(400, 250),
    k.anchor("center"),
    k.color(60, 60, 60),
    k.area()
  ]);

  const sfxFill = k.add([
    k.rect(settings.sfxVolume * 200, 20, { radius: 4 }),
    k.pos(300, 240),
    k.color(80, 150, 80)
  ]);

  sfxBar.onClick(() => {
    const mx = k.mousePos().x;
    settings.sfxVolume = Math.max(0, Math.min(1, (mx - 300) / 200));
    sfxFill.width = settings.sfxVolume * 200;
    playSound("cannon");
    saveGame();
  });

  // Back button
  const backBtn = k.add([
    k.rect(150, 40, { radius: 6 }),
    k.pos(400, 450),
    k.anchor("center"),
    k.color(80, 60, 40),
    k.area()
  ]);

  k.add([
    k.text("Back", { size: 20 }),
    k.pos(400, 450),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  backBtn.onClick(() => {
    playSound("dock");
    k.go("menu");
  });

  k.onKeyPress("escape", () => k.go("menu"));
});

k.scene("achievementsMenu", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 40, 60)
  ]);

  k.add([
    k.text("ACHIEVEMENTS", { size: 36 }),
    k.pos(400, 50),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  const achList = Object.values(achievements);
  achList.forEach((ach, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 200 + col * 400;
    const y = 120 + row * 80;

    k.add([
      k.rect(180, 60, { radius: 6 }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(ach.unlocked ? 60 : 30, ach.unlocked ? 100 : 40, ach.unlocked ? 60 : 30)
    ]);

    k.add([
      k.text(ach.name, { size: 14 }),
      k.pos(x, y - 12),
      k.anchor("center"),
      k.color(ach.unlocked ? 255 : 100, ach.unlocked ? 215 : 100, ach.unlocked ? 0 : 100)
    ]);

    k.add([
      k.text(ach.desc, { size: 10 }),
      k.pos(x, y + 10),
      k.anchor("center"),
      k.color(ach.unlocked ? 200 : 80, ach.unlocked ? 200 : 80, ach.unlocked ? 200 : 80)
    ]);
  });

  const backBtn = k.add([
    k.rect(150, 40, { radius: 6 }),
    k.pos(400, 550),
    k.anchor("center"),
    k.color(80, 60, 40),
    k.area()
  ]);

  k.add([
    k.text("Back", { size: 20 }),
    k.pos(400, 550),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  backBtn.onClick(() => k.go("menu"));
  k.onKeyPress("escape", () => k.go("menu"));
});

k.scene("game", () => {
  gameStarted = true;
  isPaused = false;
  startBGM();

  // Ocean waves background
  for (let i = 0; i < 25; i++) {
    k.add([
      k.rect(800, 24),
      k.pos(0, i * 24),
      k.color(20 + Math.sin(i * 0.5) * 10, 60 + i * 2, 100 + i * 3),
      k.z(-10)
    ]);
  }

  // Islands
  islands.forEach((island, idx) => {
    // Island base
    k.add([
      k.circle(35),
      k.pos(island.x, island.y),
      k.color(...island.color),
      k.anchor("center"),
      k.area(),
      k.z(0),
      "island",
      { idx, name: island.name }
    ]);

    // Island name
    k.add([
      k.text(island.name, { size: 10 }),
      k.pos(island.x, island.y - 50),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(1)
    ]);
  });

  // Player ship
  const player = k.add([
    k.polygon([
      k.vec2(0, -20),
      k.vec2(12, 15),
      k.vec2(0, 8),
      k.vec2(-12, 15)
    ]),
    k.pos(400, 300),
    k.color(200, 150, 80),
    k.anchor("center"),
    k.area(),
    k.rotate(0),
    k.z(5),
    "player"
  ]);

  // Movement
  let velocity = k.vec2(0, 0);
  let canFire = true;

  k.onUpdate(() => {
    if (isPaused) return;

    const dir = k.vec2(0, 0);
    if (k.isKeyDown("w") || k.isKeyDown("up")) dir.y -= 1;
    if (k.isKeyDown("s") || k.isKeyDown("down")) dir.y += 1;
    if (k.isKeyDown("a") || k.isKeyDown("left")) dir.x -= 1;
    if (k.isKeyDown("d") || k.isKeyDown("right")) dir.x += 1;

    if (dir.len() > 0) {
      dir.unit();
      velocity = velocity.lerp(dir.scale(playerStats.shipSpeed), 0.05);
      player.angle = Math.atan2(velocity.x, -velocity.y) * 180 / Math.PI;
    } else {
      velocity = velocity.scale(0.98);
    }

    player.pos.x = Math.max(30, Math.min(770, player.pos.x + velocity.x * k.dt()));
    player.pos.y = Math.max(30, Math.min(570, player.pos.y + velocity.y * k.dt()));

    // Check achievements
    checkAchievements();
  });

  // Cannons
  k.onKeyPress("space", () => {
    if (isPaused || !canFire) return;
    canFire = false;

    playSound("cannon");

    const angle = player.angle * Math.PI / 180;
    const dir = k.vec2(Math.sin(angle), -Math.cos(angle));

    // Fire both sides
    [-90, 90].forEach(offset => {
      const sideAngle = (player.angle + offset) * Math.PI / 180;
      const sideDir = k.vec2(Math.sin(sideAngle), -Math.cos(sideAngle));

      const cannonball = k.add([
        k.circle(4),
        k.pos(player.pos.add(sideDir.scale(15))),
        k.color(40, 40, 40),
        k.area(),
        k.move(sideDir, 350),
        k.offscreen({ destroy: true }),
        k.z(4),
        "cannonball",
        { damage: playerStats.cannonDamage }
      ]);
    });

    k.wait(1 / playerStats.reloadSpeed, () => canFire = true);
  });

  // Spawn enemies
  function spawnEnemy() {
    if (isPaused) return;

    const typeIdx = Math.min(
      enemyTypes.length - 1,
      Math.floor(Math.random() * (1 + playerStats.reputation / 20))
    );
    const type = enemyTypes[typeIdx];

    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * 800; y = -30; }
    else if (edge === 1) { x = 830; y = Math.random() * 600; }
    else if (edge === 2) { x = Math.random() * 800; y = 630; }
    else { x = -30; y = Math.random() * 600; }

    const enemy = k.add([
      k.polygon([
        k.vec2(0, -type.size * 0.8),
        k.vec2(type.size * 0.5, type.size * 0.6),
        k.vec2(0, type.size * 0.3),
        k.vec2(-type.size * 0.5, type.size * 0.6)
      ]),
      k.pos(x, y),
      k.color(...type.color),
      k.anchor("center"),
      k.area(),
      k.rotate(0),
      k.z(4),
      "enemy",
      {
        health: type.health,
        maxHealth: type.health,
        damage: type.damage,
        speed: type.speed,
        gold: type.gold,
        name: type.name,
        fireTimer: 0,
        isBoss: false
      }
    ]);
  }

  // Spawn boss periodically
  function spawnBoss() {
    if (isPaused || playerStats.reputation < 10) return;

    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    const boss = k.add([
      k.polygon([
        k.vec2(0, -bossType.size),
        k.vec2(bossType.size * 0.6, bossType.size * 0.7),
        k.vec2(0, bossType.size * 0.4),
        k.vec2(-bossType.size * 0.6, bossType.size * 0.7)
      ]),
      k.pos(Math.random() * 600 + 100, -50),
      k.color(...bossType.color),
      k.anchor("center"),
      k.area(),
      k.rotate(0),
      k.z(6),
      "enemy",
      {
        health: bossType.health,
        maxHealth: bossType.health,
        damage: bossType.damage,
        speed: bossType.speed,
        gold: bossType.gold,
        name: bossType.name,
        fireTimer: 0,
        isBoss: true
      }
    ]);

    // Boss announcement
    const announce = k.add([
      k.text(bossType.name + " approaches!", { size: 24 }),
      k.pos(400, 100),
      k.anchor("center"),
      k.color(255, 50, 50),
      k.z(20)
    ]);
    k.wait(3, () => announce.destroy());

    playSound("death");
  }

  k.loop(3, spawnEnemy);
  k.loop(45, spawnBoss);

  // Enemy AI
  k.onUpdate("enemy", (enemy) => {
    if (isPaused) return;

    const toPlayer = player.pos.sub(enemy.pos);
    const dist = toPlayer.len();

    if (dist > 50) {
      const dir = toPlayer.unit();
      enemy.pos = enemy.pos.add(dir.scale(enemy.speed * k.dt()));
      enemy.angle = Math.atan2(dir.x, -dir.y) * 180 / Math.PI;
    }

    // Enemy fires
    enemy.fireTimer += k.dt();
    if (enemy.fireTimer > (enemy.isBoss ? 1.5 : 2.5) && dist < 300) {
      enemy.fireTimer = 0;

      const angle = enemy.angle * Math.PI / 180;
      [90, -90].forEach(offset => {
        const sideAngle = (enemy.angle + offset) * Math.PI / 180;
        const sideDir = k.vec2(Math.sin(sideAngle), -Math.cos(sideAngle));

        k.add([
          k.circle(3),
          k.pos(enemy.pos.add(sideDir.scale(10))),
          k.color(60, 60, 60),
          k.area(),
          k.move(sideDir, 200),
          k.offscreen({ destroy: true }),
          k.z(3),
          "enemyCannonball",
          { damage: enemy.damage }
        ]);
      });

      playSound("cannon");
    }
  });

  // Collisions
  k.onCollide("cannonball", "enemy", (ball, enemy) => {
    enemy.health -= ball.damage;
    ball.destroy();
    playSound("hit");

    // Damage indicator
    const dmg = k.add([
      k.text("-" + ball.damage, { size: 12 }),
      k.pos(enemy.pos),
      k.color(255, 100, 100),
      k.z(10)
    ]);
    dmg.onUpdate(() => {
      dmg.pos.y -= 30 * k.dt();
      dmg.opacity -= k.dt();
      if (dmg.opacity <= 0) dmg.destroy();
    });

    if (enemy.health <= 0) {
      const gold = enemy.gold + Math.floor(Math.random() * 20);
      playerStats.gold += gold;
      playerStats.totalGoldEarned += gold;
      playerStats.kills++;
      playerStats.reputation += enemy.isBoss ? 10 : 1;
      if (enemy.isBoss) playerStats.bossKills++;

      playSound("coin");

      // Gold popup
      const popup = k.add([
        k.text("+" + gold + "g", { size: 16 }),
        k.pos(enemy.pos),
        k.color(255, 215, 0),
        k.z(10)
      ]);
      popup.onUpdate(() => {
        popup.pos.y -= 40 * k.dt();
        popup.opacity -= k.dt() * 0.5;
        if (popup.opacity <= 0) popup.destroy();
      });

      enemy.destroy();
    }
  });

  k.onCollide("enemyCannonball", "player", (ball) => {
    playerStats.health -= ball.damage;
    ball.destroy();
    playSound("hit");

    if (playerStats.health <= 0) {
      playSound("death");
      k.go("gameOver");
    }
  });

  k.onCollide("player", "island", (p, island) => {
    playerStats.islandsVisited.add(island.idx);
    saveGame();
    playSound("dock");
    currentIsland = island.idx;
    k.go("port", island.idx);
  });

  // HUD
  const healthBar = k.add([
    k.rect(150, 16, { radius: 3 }),
    k.pos(85, 20),
    k.color(60, 30, 30),
    k.anchor("center"),
    k.fixed(),
    k.z(20)
  ]);

  const healthFill = k.add([
    k.rect(146, 12, { radius: 2 }),
    k.pos(14, 14),
    k.color(180, 50, 50),
    k.fixed(),
    k.z(21)
  ]);

  const goldText = k.add([
    k.text("Gold: " + playerStats.gold, { size: 16 }),
    k.pos(20, 45),
    k.color(255, 215, 0),
    k.fixed(),
    k.z(20)
  ]);

  const repText = k.add([
    k.text("Rep: " + playerStats.reputation, { size: 14 }),
    k.pos(20, 70),
    k.color(200, 200, 200),
    k.fixed(),
    k.z(20)
  ]);

  k.onUpdate(() => {
    healthFill.width = Math.max(0, (playerStats.health / playerStats.maxHealth) * 146);
    goldText.text = "Gold: " + playerStats.gold;
    repText.text = "Rep: " + playerStats.reputation;
  });

  // Achievement notification
  let achNotification = null;
  k.onUpdate(() => {
    if (achievementQueue.length > 0 && !achNotification) {
      const achName = achievementQueue.shift();
      playSound("victory");

      achNotification = k.add([
        k.rect(250, 50, { radius: 8 }),
        k.pos(400, 80),
        k.anchor("center"),
        k.color(60, 40, 80),
        k.fixed(),
        k.z(30)
      ]);

      k.add([
        k.text("Achievement: " + achName, { size: 14 }),
        k.pos(400, 80),
        k.anchor("center"),
        k.color(255, 215, 0),
        k.fixed(),
        k.z(31),
        { parent: achNotification }
      ]);

      k.wait(3, () => {
        achNotification.destroy();
        achNotification = null;
      });
    }
  });

  // Pause
  k.onKeyPress("escape", () => {
    isPaused = !isPaused;
    if (isPaused) {
      k.add([
        k.rect(300, 200, { radius: 10 }),
        k.pos(400, 300),
        k.anchor("center"),
        k.color(40, 40, 60),
        k.z(50),
        "pauseMenu"
      ]);

      k.add([
        k.text("PAUSED", { size: 28 }),
        k.pos(400, 240),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.z(51),
        "pauseMenu"
      ]);

      const resumeBtn = k.add([
        k.rect(120, 35, { radius: 5 }),
        k.pos(400, 290),
        k.anchor("center"),
        k.color(60, 100, 60),
        k.area(),
        k.z(51),
        "pauseMenu"
      ]);

      k.add([
        k.text("Resume", { size: 16 }),
        k.pos(400, 290),
        k.anchor("center"),
        k.z(52),
        "pauseMenu"
      ]);

      resumeBtn.onClick(() => {
        isPaused = false;
        k.destroyAll("pauseMenu");
      });

      const menuBtn = k.add([
        k.rect(120, 35, { radius: 5 }),
        k.pos(400, 340),
        k.anchor("center"),
        k.color(100, 60, 60),
        k.area(),
        k.z(51),
        "pauseMenu"
      ]);

      k.add([
        k.text("Main Menu", { size: 16 }),
        k.pos(400, 340),
        k.anchor("center"),
        k.z(52),
        "pauseMenu"
      ]);

      menuBtn.onClick(() => {
        saveGame();
        k.go("menu");
      });
    } else {
      k.destroyAll("pauseMenu");
    }
  });
});

k.scene("port", (islandIdx) => {
  const island = islands[islandIdx];
  isPaused = true;

  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(40, 60, 80)
  ]);

  k.add([
    k.text(island.name, { size: 36 }),
    k.pos(400, 40),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  // Tabs
  let activeTab = "trade";

  const tabs = ["trade", "upgrades", "repair"];
  const tabBtns = [];

  tabs.forEach((tab, i) => {
    const btn = k.add([
      k.rect(100, 30, { radius: 4 }),
      k.pos(200 + i * 150, 90),
      k.anchor("center"),
      k.color(tab === activeTab ? 80 : 50, tab === activeTab ? 100 : 60, tab === activeTab ? 80 : 50),
      k.area(),
      { tab }
    ]);

    k.add([
      k.text(tab.charAt(0).toUpperCase() + tab.slice(1), { size: 14 }),
      k.pos(200 + i * 150, 90),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    tabBtns.push(btn);

    btn.onClick(() => {
      activeTab = tab;
      k.go("port", islandIdx);
    });
  });

  // Gold display
  const goldDisplay = k.add([
    k.text("Gold: " + playerStats.gold, { size: 18 }),
    k.pos(700, 40),
    k.anchor("center"),
    k.color(255, 215, 0)
  ]);

  // Cargo display
  const cargoTotal = Object.values(playerStats.cargo).reduce((a, b) => a + b, 0);
  k.add([
    k.text(`Cargo: ${cargoTotal}/${playerStats.cargoCapacity}`, { size: 14 }),
    k.pos(700, 65),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  if (activeTab === "trade") {
    // Buy goods
    k.add([
      k.text("Buy Goods", { size: 20 }),
      k.pos(150, 140),
      k.anchor("center"),
      k.color(100, 200, 100)
    ]);

    const goods = Object.entries(island.goods);
    goods.forEach(([good, price], i) => {
      const owned = playerStats.cargo[good] || 0;

      k.add([
        k.text(`${good}: ${price}g (own: ${owned})`, { size: 14 }),
        k.pos(50, 175 + i * 40),
        k.color(200, 200, 200)
      ]);

      const buyBtn = k.add([
        k.rect(50, 25, { radius: 4 }),
        k.pos(280, 175 + i * 40),
        k.anchor("center"),
        k.color(60, 100, 60),
        k.area()
      ]);

      k.add([
        k.text("Buy", { size: 12 }),
        k.pos(280, 175 + i * 40),
        k.anchor("center")
      ]);

      buyBtn.onClick(() => {
        const total = Object.values(playerStats.cargo).reduce((a, b) => a + b, 0);
        if (playerStats.gold >= price && total < playerStats.cargoCapacity) {
          playerStats.gold -= price;
          playerStats.cargo[good] = (playerStats.cargo[good] || 0) + 1;
          playSound("coin");
          saveGame();
          k.go("port", islandIdx);
        }
      });
    });

    // Sell goods
    k.add([
      k.text("Sell Goods", { size: 20 }),
      k.pos(550, 140),
      k.anchor("center"),
      k.color(200, 100, 100)
    ]);

    island.buys.forEach((good, i) => {
      const owned = playerStats.cargo[good] || 0;
      const sellPrice = Math.floor((island.goods[good] || 15) * 1.5);

      k.add([
        k.text(`${good}: ${sellPrice}g (own: ${owned})`, { size: 14 }),
        k.pos(450, 175 + i * 40),
        k.color(200, 200, 200)
      ]);

      const sellBtn = k.add([
        k.rect(50, 25, { radius: 4 }),
        k.pos(680, 175 + i * 40),
        k.anchor("center"),
        k.color(100, 60, 60),
        k.area()
      ]);

      k.add([
        k.text("Sell", { size: 12 }),
        k.pos(680, 175 + i * 40),
        k.anchor("center")
      ]);

      sellBtn.onClick(() => {
        if (owned > 0) {
          playerStats.gold += sellPrice;
          playerStats.cargo[good]--;
          if (playerStats.cargo[good] <= 0) delete playerStats.cargo[good];
          tradeRuns++;
          playSound("coin");
          saveGame();
          k.go("port", islandIdx);
        }
      });
    });
  } else if (activeTab === "upgrades") {
    k.add([
      k.text("Ship Upgrades", { size: 20 }),
      k.pos(400, 140),
      k.anchor("center"),
      k.color(100, 150, 200)
    ]);

    Object.entries(upgrades).forEach(([key, upg], i) => {
      const nextLevel = upg.current + 1;
      const cost = upg.levels[nextLevel] || "MAX";
      const canBuy = typeof cost === "number" && playerStats.gold >= cost;

      k.add([
        k.text(`${upg.name} (Lv ${upg.current})`, { size: 14 }),
        k.pos(150, 180 + i * 50),
        k.color(200, 200, 200)
      ]);

      k.add([
        k.text(`Bonus: +${upg.bonus[upg.current]}`, { size: 12 }),
        k.pos(150, 200 + i * 50),
        k.color(150, 150, 150)
      ]);

      if (cost !== "MAX") {
        const upgradeBtn = k.add([
          k.rect(100, 30, { radius: 4 }),
          k.pos(500, 190 + i * 50),
          k.anchor("center"),
          k.color(canBuy ? 60 : 40, canBuy ? 100 : 50, canBuy ? 60 : 40),
          k.area()
        ]);

        k.add([
          k.text(`${cost}g`, { size: 14 }),
          k.pos(500, 190 + i * 50),
          k.anchor("center"),
          k.color(canBuy ? 255 : 100, canBuy ? 215 : 100, canBuy ? 0 : 100)
        ]);

        if (canBuy) {
          upgradeBtn.onClick(() => {
            playerStats.gold -= cost;
            upg.current++;
            playerStats.upgradesPurchased++;
            applyUpgrades();
            playSound("upgrade");
            saveGame();
            k.go("port", islandIdx);
          });
        }
      } else {
        k.add([
          k.text("MAXED", { size: 14 }),
          k.pos(500, 190 + i * 50),
          k.anchor("center"),
          k.color(100, 200, 100)
        ]);
      }
    });
  } else if (activeTab === "repair") {
    const damage = playerStats.maxHealth - playerStats.health;
    const repairCost = Math.ceil(damage * 0.5);

    k.add([
      k.text("Ship Repair", { size: 20 }),
      k.pos(400, 180),
      k.anchor("center"),
      k.color(200, 150, 100)
    ]);

    k.add([
      k.text(`Health: ${playerStats.health}/${playerStats.maxHealth}`, { size: 18 }),
      k.pos(400, 240),
      k.anchor("center"),
      k.color(180, 80, 80)
    ]);

    if (damage > 0) {
      const canRepair = playerStats.gold >= repairCost;

      const repairBtn = k.add([
        k.rect(180, 45, { radius: 6 }),
        k.pos(400, 320),
        k.anchor("center"),
        k.color(canRepair ? 60 : 40, canRepair ? 100 : 50, canRepair ? 60 : 40),
        k.area()
      ]);

      k.add([
        k.text(`Repair: ${repairCost}g`, { size: 18 }),
        k.pos(400, 320),
        k.anchor("center"),
        k.color(canRepair ? 255 : 100, canRepair ? 255 : 100, canRepair ? 255 : 100)
      ]);

      if (canRepair) {
        repairBtn.onClick(() => {
          playerStats.gold -= repairCost;
          playerStats.health = playerStats.maxHealth;
          playSound("upgrade");
          saveGame();
          k.go("port", islandIdx);
        });
      }
    } else {
      k.add([
        k.text("Ship is fully repaired!", { size: 16 }),
        k.pos(400, 320),
        k.anchor("center"),
        k.color(100, 200, 100)
      ]);
    }
  }

  // Leave button
  const leaveBtn = k.add([
    k.rect(150, 45, { radius: 6 }),
    k.pos(400, 530),
    k.anchor("center"),
    k.color(80, 60, 40),
    k.area()
  ]);

  k.add([
    k.text("Set Sail", { size: 20 }),
    k.pos(400, 530),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  leaveBtn.onClick(() => {
    saveGame();
    playSound("dock");
    k.go("game");
  });

  k.onKeyPress("escape", () => {
    saveGame();
    k.go("game");
  });
});

k.scene("gameOver", () => {
  stopBGM();

  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 10, 10)
  ]);

  k.add([
    k.text("SHIP SUNK", { size: 48 }),
    k.pos(400, 150),
    k.anchor("center"),
    k.color(180, 50, 50)
  ]);

  k.add([
    k.text("Your voyage has ended...", { size: 20 }),
    k.pos(400, 220),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  const stats = [
    `Ships Sunk: ${playerStats.kills}`,
    `Bosses Defeated: ${playerStats.bossKills}`,
    `Total Gold Earned: ${playerStats.totalGoldEarned}`,
    `Islands Visited: ${playerStats.islandsVisited.size}/8`,
    `Reputation: ${playerStats.reputation}`
  ];

  stats.forEach((stat, i) => {
    k.add([
      k.text(stat, { size: 16 }),
      k.pos(400, 280 + i * 35),
      k.anchor("center"),
      k.color(200, 200, 200)
    ]);
  });

  const retryBtn = k.add([
    k.rect(150, 45, { radius: 6 }),
    k.pos(300, 500),
    k.anchor("center"),
    k.color(60, 100, 60),
    k.area()
  ]);

  k.add([
    k.text("Try Again", { size: 18 }),
    k.pos(300, 500),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  retryBtn.onClick(() => {
    playerStats = {
      gold: 100, health: 100, maxHealth: 100, cannonDamage: 10,
      reloadSpeed: 1, shipSpeed: 120, cargoCapacity: 50, cargo: {},
      kills: 0, bossKills: 0, totalGoldEarned: 0, islandsVisited: new Set(),
      upgradesPurchased: 0, reputation: 0
    };
    Object.values(upgrades).forEach(u => u.current = 0);
    tradeRuns = 0;
    saveGame();
    k.go("game");
  });

  const menuBtn = k.add([
    k.rect(150, 45, { radius: 6 }),
    k.pos(500, 500),
    k.anchor("center"),
    k.color(80, 60, 40),
    k.area()
  ]);

  k.add([
    k.text("Main Menu", { size: 18 }),
    k.pos(500, 500),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  menuBtn.onClick(() => k.go("menu"));

  k.onKeyPress("space", () => {
    playerStats = {
      gold: 100, health: 100, maxHealth: 100, cannonDamage: 10,
      reloadSpeed: 1, shipSpeed: 120, cargoCapacity: 50, cargo: {},
      kills: 0, bossKills: 0, totalGoldEarned: 0, islandsVisited: new Set(),
      upgradesPurchased: 0, reputation: 0
    };
    Object.values(upgrades).forEach(u => u.current = 0);
    tradeRuns = 0;
    saveGame();
    k.go("game");
  });
});

// Start
k.go("menu");
