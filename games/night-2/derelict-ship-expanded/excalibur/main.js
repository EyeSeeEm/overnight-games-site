// Excalibur loaded from CDN - ex is global

// Audio Context
let audioCtx = null;
let bgmOscillators = [];
let bgmGain = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  let duration = 0.2;

  if (type === "footstep") {
    osc.type = "square";
    osc.frequency.setValueAtTime(80 + Math.random() * 40, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    duration = 0.1;
  } else if (type === "shoot") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    duration = 0.2;
  } else if (type === "hit") {
    osc.type = "square";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    duration = 0.15;
  } else if (type === "pickup") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    duration = 0.2;
  } else if (type === "door") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    duration = 0.4;
  } else if (type === "death") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    duration = 1;
  } else if (type === "alien") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.setValueAtTime(120, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(60, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    duration = 0.4;
  } else if (type === "upgrade") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.1);
    osc.frequency.setValueAtTime(800, t + 0.2);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    duration = 0.35;
  } else if (type === "victory") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.2);
    osc.frequency.setValueAtTime(784, t + 0.4);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.setValueAtTime(0.25, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    duration = 0.7;
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function startBGM() {
  if (!audioCtx || bgmOscillators.length > 0) return;

  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(settings.musicVolume * 0.06, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  // Creepy ambient drone
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = "sine";
  droneOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  const droneGain = audioCtx.createGain();
  droneGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  droneOsc.connect(droneGain);
  droneGain.connect(bgmGain);
  droneOsc.start();
  bgmOscillators.push(droneOsc);

  // Pulsing bass
  const pulseOsc = audioCtx.createOscillator();
  pulseOsc.type = "triangle";
  pulseOsc.frequency.setValueAtTime(30, audioCtx.currentTime);
  const pulseGain = audioCtx.createGain();
  pulseGain.gain.setValueAtTime(0.1, audioCtx.currentTime);

  // LFO for pulse
  const lfo = audioCtx.createOscillator();
  lfo.frequency.setValueAtTime(0.5, audioCtx.currentTime);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(pulseGain.gain);
  lfo.start();

  pulseOsc.connect(pulseGain);
  pulseGain.connect(bgmGain);
  pulseOsc.start();
  bgmOscillators.push(pulseOsc, lfo);
}

function stopBGM() {
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  bgmOscillators = [];
}

// Game State
let playerStats = {
  health: 100,
  maxHealth: 100,
  ammo: 30,
  maxAmmo: 50,
  damage: 15,
  fireRate: 1,
  moveSpeed: 150,
  armor: 0,
  kills: 0,
  bossKills: 0,
  itemsCollected: 0,
  decksCleared: new Set(),
  upgradesPurchased: 0,
  oxygen: 100,
  keycards: { blue: false, red: false, yellow: false }
};

let settings = {
  musicVolume: 0.5,
  sfxVolume: 0.7
};

let achievements = {
  firstKill: { name: "First Contact", desc: "Kill your first alien", unlocked: false },
  survivor: { name: "Survivor", desc: "Complete Deck 1", unlocked: false },
  explorer: { name: "Explorer", desc: "Visit all 6 decks", unlocked: false },
  bossSlayer: { name: "Boss Slayer", desc: "Defeat a boss alien", unlocked: false },
  weaponMaster: { name: "Weapon Master", desc: "Max out weapon damage", unlocked: false },
  collector: { name: "Collector", desc: "Collect 20 items", unlocked: false },
  exterminator: { name: "Exterminator", desc: "Kill 50 aliens", unlocked: false },
  fullAccess: { name: "Full Access", desc: "Collect all keycards", unlocked: false },
  ironMan: { name: "Iron Man", desc: "Max out armor", unlocked: false },
  escaped: { name: "Escaped", desc: "Reach the escape pod", unlocked: false }
};

let currentDeck = 0;
let gameStarted = false;
let isPaused = false;

// Deck layouts (simplified)
const decks = [
  { name: "Cargo Bay", color: "#1a2a1a", enemies: 5, hasKey: "blue", required: null },
  { name: "Engineering", color: "#2a1a1a", enemies: 7, hasKey: "red", required: "blue" },
  { name: "Crew Quarters", color: "#1a1a2a", enemies: 8, hasKey: null, required: "blue" },
  { name: "Medical Bay", color: "#2a2a1a", enemies: 6, hasKey: "yellow", required: "red" },
  { name: "Bridge", color: "#1a2a2a", enemies: 10, hasKey: null, required: "red" },
  { name: "Escape Pods", color: "#2a1a2a", enemies: 3, hasBoss: true, required: "yellow" }
];

// Enemy types
const enemyTypes = [
  { name: "Facehugger", health: 20, damage: 8, speed: 180, color: "#60a060", size: 15 },
  { name: "Drone", health: 40, damage: 12, speed: 120, color: "#408040", size: 20 },
  { name: "Warrior", health: 70, damage: 18, speed: 100, color: "#206020", size: 25 },
  { name: "Lurker", health: 50, damage: 15, speed: 150, color: "#305030", size: 18 },
  { name: "Spitter", health: 35, damage: 20, speed: 80, color: "#508050", size: 22 },
  { name: "Brute", health: 100, damage: 25, speed: 60, color: "#104010", size: 30 }
];

// Boss
const bossType = { name: "Queen", health: 500, damage: 40, speed: 50, color: "#002000", size: 50 };

// Upgrades
const upgrades = {
  damage: { name: "Weapon Damage", levels: [0, 100, 200, 350, 500], bonus: [0, 5, 12, 20, 30], current: 0 },
  fireRate: { name: "Fire Rate", levels: [0, 80, 180, 300, 450], bonus: [0, 0.15, 0.3, 0.5, 0.75], current: 0 },
  health: { name: "Max Health", levels: [0, 120, 250, 400, 600], bonus: [0, 25, 50, 80, 120], current: 0 },
  armor: { name: "Armor", levels: [0, 150, 320, 500, 700], bonus: [0, 5, 12, 20, 30], current: 0 },
  ammo: { name: "Ammo Capacity", levels: [0, 60, 140, 240, 380], bonus: [0, 15, 35, 60, 100], current: 0 }
};

let credits = 0;

// Save/Load
function saveGame() {
  const saveData = {
    stats: {
      ...playerStats,
      decksCleared: Array.from(playerStats.decksCleared)
    },
    settings,
    achievements,
    upgrades: Object.fromEntries(Object.entries(upgrades).map(([k, v]) => [k, v.current])),
    currentDeck,
    credits,
    timestamp: Date.now()
  };
  localStorage.setItem("derelict_save", JSON.stringify(saveData));
}

function loadGame() {
  const data = localStorage.getItem("derelict_save");
  if (data) {
    try {
      const saveData = JSON.parse(data);
      playerStats = {
        ...saveData.stats,
        decksCleared: new Set(saveData.stats.decksCleared || [])
      };
      if (saveData.settings) settings = saveData.settings;
      if (saveData.achievements) achievements = { ...achievements, ...saveData.achievements };
      if (saveData.upgrades) {
        Object.entries(saveData.upgrades).forEach(([k, v]) => {
          if (upgrades[k]) upgrades[k].current = v;
        });
        applyUpgrades();
      }
      if (saveData.currentDeck !== undefined) currentDeck = saveData.currentDeck;
      if (saveData.credits !== undefined) credits = saveData.credits;
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function applyUpgrades() {
  playerStats.damage = 15 + upgrades.damage.bonus[upgrades.damage.current];
  playerStats.fireRate = 1 + upgrades.fireRate.bonus[upgrades.fireRate.current];
  playerStats.maxHealth = 100 + upgrades.health.bonus[upgrades.health.current];
  playerStats.armor = upgrades.armor.bonus[upgrades.armor.current];
  playerStats.maxAmmo = 50 + upgrades.ammo.bonus[upgrades.ammo.current];
}

function checkAchievements() {
  if (!achievements.firstKill.unlocked && playerStats.kills >= 1) {
    achievements.firstKill.unlocked = true;
    showAchievement("First Contact");
  }
  if (!achievements.survivor.unlocked && playerStats.decksCleared.has(0)) {
    achievements.survivor.unlocked = true;
    showAchievement("Survivor");
  }
  if (!achievements.explorer.unlocked && playerStats.decksCleared.size >= 6) {
    achievements.explorer.unlocked = true;
    showAchievement("Explorer");
  }
  if (!achievements.bossSlayer.unlocked && playerStats.bossKills >= 1) {
    achievements.bossSlayer.unlocked = true;
    showAchievement("Boss Slayer");
  }
  if (!achievements.weaponMaster.unlocked && upgrades.damage.current >= 4) {
    achievements.weaponMaster.unlocked = true;
    showAchievement("Weapon Master");
  }
  if (!achievements.collector.unlocked && playerStats.itemsCollected >= 20) {
    achievements.collector.unlocked = true;
    showAchievement("Collector");
  }
  if (!achievements.exterminator.unlocked && playerStats.kills >= 50) {
    achievements.exterminator.unlocked = true;
    showAchievement("Exterminator");
  }
  if (!achievements.fullAccess.unlocked && playerStats.keycards.blue && playerStats.keycards.red && playerStats.keycards.yellow) {
    achievements.fullAccess.unlocked = true;
    showAchievement("Full Access");
  }
  if (!achievements.ironMan.unlocked && upgrades.armor.current >= 4) {
    achievements.ironMan.unlocked = true;
    showAchievement("Iron Man");
  }
  saveGame();
}

let achievementQueue = [];
function showAchievement(name) {
  achievementQueue.push(name);
}

// Create Engine
const game = new ex.Engine({
  width: 800,
  height: 600,
  backgroundColor: ex.Color.fromHex("#0a0a0f"),
  displayMode: ex.DisplayMode.Fixed
});

// Menu Scene
class MenuScene extends ex.Scene {
  onInitialize(engine) {
    this.backgroundColor = ex.Color.fromHex("#0a0a0f");
  }

  onActivate() {
    stopBGM();
    this.clear();

    // Title
    const title = new ex.Label({
      text: "DERELICT SHIP",
      pos: ex.vec(400, 100),
      font: new ex.Font({ size: 48, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const subtitle = new ex.Label({
      text: "EXPANDED",
      pos: ex.vec(400, 145),
      font: new ex.Font({ size: 24, color: ex.Color.fromHex("#008866"), textAlign: ex.TextAlign.Center })
    });
    this.add(subtitle);

    // Ship icon
    const shipIcon = new ex.Label({
      text: "🚀",
      pos: ex.vec(400, 210),
      font: new ex.Font({ size: 60, textAlign: ex.TextAlign.Center })
    });
    this.add(shipIcon);

    const hasSave = localStorage.getItem("derelict_save") !== null;

    const buttons = [
      { text: "New Game", y: 300, action: () => game.goToScene("tutorial") },
      { text: "Continue", y: 355, action: () => { loadGame(); game.goToScene("deckSelect"); }, enabled: hasSave },
      { text: "Settings", y: 410, action: () => game.goToScene("settings") },
      { text: "Achievements", y: 465, action: () => game.goToScene("achievementsMenu") }
    ];

    buttons.forEach(btn => {
      const enabled = btn.enabled !== false;
      const button = new ex.Actor({
        pos: ex.vec(400, btn.y),
        width: 200,
        height: 40,
        color: enabled ? ex.Color.fromHex("#1a3a3a") : ex.Color.fromHex("#151515")
      });

      const label = new ex.Label({
        text: btn.text,
        pos: ex.vec(400, btn.y),
        font: new ex.Font({
          size: 20,
          color: enabled ? ex.Color.White : ex.Color.Gray,
          textAlign: ex.TextAlign.Center
        })
      });

      if (enabled) {
        button.on("pointerdown", () => {
          initAudio();
          playSound("door");
          btn.action();
        });
        button.on("pointerenter", () => {
          button.color = ex.Color.fromHex("#2a5a5a");
        });
        button.on("pointerleave", () => {
          button.color = ex.Color.fromHex("#1a3a3a");
        });
      }

      this.add(button);
      this.add(label);
    });

    const instructions = new ex.Label({
      text: "WASD to move, Mouse to aim, Click to shoot",
      pos: ex.vec(400, 550),
      font: new ex.Font({ size: 14, color: ex.Color.Gray, textAlign: ex.TextAlign.Center })
    });
    this.add(instructions);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Space) {
        initAudio();
        playSound("door");
        if (hasSave) {
          loadGame();
          game.goToScene("deckSelect");
        } else {
          game.goToScene("tutorial");
        }
      }
    });
  }
}

// Tutorial Scene
class TutorialScene extends ex.Scene {
  onActivate() {
    this.clear();

    const title = new ex.Label({
      text: "SURVIVAL PROTOCOL",
      pos: ex.vec(400, 50),
      font: new ex.Font({ size: 32, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const tips = [
      "WASD - Move through the ship",
      "Mouse - Aim your weapon",
      "Left Click - Fire (costs ammo)",
      "Clear each deck of aliens to progress",
      "Collect keycards to unlock new areas",
      "Find ammo and health pickups to survive",
      "Upgrade your equipment at terminals",
      "Reach the Escape Pods to win"
    ];

    tips.forEach((tip, i) => {
      const label = new ex.Label({
        text: "• " + tip,
        pos: ex.vec(100, 110 + i * 45),
        font: new ex.Font({ size: 16, color: ex.Color.fromHex("#aaaaaa") })
      });
      this.add(label);
    });

    const startBtn = new ex.Actor({
      pos: ex.vec(400, 500),
      width: 200,
      height: 50,
      color: ex.Color.fromHex("#1a5a1a")
    });

    const startLabel = new ex.Label({
      text: "Begin Mission",
      pos: ex.vec(400, 500),
      font: new ex.Font({ size: 22, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    startBtn.on("pointerdown", () => {
      playSound("door");
      this.startNewGame();
    });
    startBtn.on("pointerenter", () => startBtn.color = ex.Color.fromHex("#2a7a2a"));
    startBtn.on("pointerleave", () => startBtn.color = ex.Color.fromHex("#1a5a1a"));

    this.add(startBtn);
    this.add(startLabel);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Space) {
        playSound("door");
        this.startNewGame();
      }
    });
  }

  startNewGame() {
    playerStats = {
      health: 100, maxHealth: 100, ammo: 30, maxAmmo: 50,
      damage: 15, fireRate: 1, moveSpeed: 150, armor: 0,
      kills: 0, bossKills: 0, itemsCollected: 0, decksCleared: new Set(),
      upgradesPurchased: 0, oxygen: 100, keycards: { blue: false, red: false, yellow: false }
    };
    Object.values(upgrades).forEach(u => u.current = 0);
    currentDeck = 0;
    credits = 0;
    saveGame();
    game.goToScene("deckSelect");
  }
}

// Settings Scene
class SettingsScene extends ex.Scene {
  onActivate() {
    this.clear();

    const title = new ex.Label({
      text: "SETTINGS",
      pos: ex.vec(400, 80),
      font: new ex.Font({ size: 32, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    // Music Volume
    const musicLabel = new ex.Label({
      text: "Music Volume",
      pos: ex.vec(200, 180),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });
    this.add(musicLabel);

    const musicBar = new ex.Actor({
      pos: ex.vec(450, 180),
      width: 200,
      height: 20,
      color: ex.Color.fromHex("#333333")
    });
    this.add(musicBar);

    const musicFill = new ex.Actor({
      pos: ex.vec(350 + settings.musicVolume * 100, 180),
      width: settings.musicVolume * 200,
      height: 16,
      color: ex.Color.fromHex("#00aa66"),
      anchor: ex.vec(0, 0.5)
    });
    this.add(musicFill);

    musicBar.on("pointerdown", (evt) => {
      settings.musicVolume = Math.max(0, Math.min(1, (evt.worldPos.x - 350) / 200));
      musicFill.width = settings.musicVolume * 200;
      saveGame();
    });

    // SFX Volume
    const sfxLabel = new ex.Label({
      text: "SFX Volume",
      pos: ex.vec(200, 250),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });
    this.add(sfxLabel);

    const sfxBar = new ex.Actor({
      pos: ex.vec(450, 250),
      width: 200,
      height: 20,
      color: ex.Color.fromHex("#333333")
    });
    this.add(sfxBar);

    const sfxFill = new ex.Actor({
      pos: ex.vec(350 + settings.sfxVolume * 100, 250),
      width: settings.sfxVolume * 200,
      height: 16,
      color: ex.Color.fromHex("#00aa66"),
      anchor: ex.vec(0, 0.5)
    });
    this.add(sfxFill);

    sfxBar.on("pointerdown", (evt) => {
      settings.sfxVolume = Math.max(0, Math.min(1, (evt.worldPos.x - 350) / 200));
      sfxFill.width = settings.sfxVolume * 200;
      playSound("shoot");
      saveGame();
    });

    // Back button
    const backBtn = new ex.Actor({
      pos: ex.vec(400, 450),
      width: 150,
      height: 40,
      color: ex.Color.fromHex("#3a2a1a")
    });

    const backLabel = new ex.Label({
      text: "Back",
      pos: ex.vec(400, 450),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    backBtn.on("pointerdown", () => {
      playSound("door");
      game.goToScene("menu");
    });

    this.add(backBtn);
    this.add(backLabel);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Escape) game.goToScene("menu");
    });
  }
}

// Achievements Menu Scene
class AchievementsMenuScene extends ex.Scene {
  onActivate() {
    this.clear();

    const title = new ex.Label({
      text: "ACHIEVEMENTS",
      pos: ex.vec(400, 50),
      font: new ex.Font({ size: 32, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const achList = Object.values(achievements);
    achList.forEach((ach, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 200 + col * 400;
      const y = 120 + row * 80;

      const bg = new ex.Actor({
        pos: ex.vec(x, y),
        width: 180,
        height: 60,
        color: ach.unlocked ? ex.Color.fromHex("#1a3a2a") : ex.Color.fromHex("#151515")
      });
      this.add(bg);

      const nameLabel = new ex.Label({
        text: ach.name,
        pos: ex.vec(x, y - 12),
        font: new ex.Font({
          size: 14,
          color: ach.unlocked ? ex.Color.fromHex("#ffcc00") : ex.Color.Gray,
          textAlign: ex.TextAlign.Center
        })
      });
      this.add(nameLabel);

      const descLabel = new ex.Label({
        text: ach.desc,
        pos: ex.vec(x, y + 10),
        font: new ex.Font({
          size: 10,
          color: ach.unlocked ? ex.Color.White : ex.Color.DarkGray,
          textAlign: ex.TextAlign.Center
        })
      });
      this.add(descLabel);
    });

    const backBtn = new ex.Actor({
      pos: ex.vec(400, 550),
      width: 150,
      height: 40,
      color: ex.Color.fromHex("#3a2a1a")
    });

    const backLabel = new ex.Label({
      text: "Back",
      pos: ex.vec(400, 550),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    backBtn.on("pointerdown", () => game.goToScene("menu"));
    this.add(backBtn);
    this.add(backLabel);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Escape) game.goToScene("menu");
    });
  }
}

// Deck Select Scene
class DeckSelectScene extends ex.Scene {
  onActivate() {
    this.clear();
    startBGM();

    const title = new ex.Label({
      text: "SELECT DECK",
      pos: ex.vec(400, 50),
      font: new ex.Font({ size: 32, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    // Credits display
    const creditsLabel = new ex.Label({
      text: `Credits: ${credits}`,
      pos: ex.vec(700, 30),
      font: new ex.Font({ size: 16, color: ex.Color.fromHex("#ffcc00"), textAlign: ex.TextAlign.Center })
    });
    this.add(creditsLabel);

    // Keycards display
    const keyDisplay = new ex.Label({
      text: `Keys: ${playerStats.keycards.blue ? "🔵" : "⚫"}${playerStats.keycards.red ? "🔴" : "⚫"}${playerStats.keycards.yellow ? "🟡" : "⚫"}`,
      pos: ex.vec(700, 55),
      font: new ex.Font({ size: 14, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });
    this.add(keyDisplay);

    decks.forEach((deck, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = 150 + col * 250;
      const y = 150 + row * 180;

      const cleared = playerStats.decksCleared.has(i);
      const hasAccess = !deck.required || playerStats.keycards[deck.required];

      const deckBtn = new ex.Actor({
        pos: ex.vec(x, y),
        width: 200,
        height: 120,
        color: cleared ? ex.Color.fromHex("#1a4a1a") : (hasAccess ? ex.Color.fromHex(deck.color) : ex.Color.fromHex("#1a1a1a"))
      });

      const nameLabel = new ex.Label({
        text: deck.name,
        pos: ex.vec(x, y - 30),
        font: new ex.Font({
          size: 16,
          color: hasAccess ? ex.Color.White : ex.Color.Gray,
          textAlign: ex.TextAlign.Center
        })
      });

      const statusLabel = new ex.Label({
        text: cleared ? "CLEARED" : (hasAccess ? `${deck.enemies} enemies` : `Need ${deck.required} key`),
        pos: ex.vec(x, y),
        font: new ex.Font({
          size: 12,
          color: cleared ? ex.Color.fromHex("#00ff88") : (hasAccess ? ex.Color.LightGray : ex.Color.Red),
          textAlign: ex.TextAlign.Center
        })
      });

      const keyLabel = new ex.Label({
        text: deck.hasKey ? `Contains: ${deck.hasKey} key` : (deck.hasBoss ? "BOSS AREA" : ""),
        pos: ex.vec(x, y + 25),
        font: new ex.Font({
          size: 10,
          color: deck.hasBoss ? ex.Color.Red : ex.Color.fromHex("#ffcc00"),
          textAlign: ex.TextAlign.Center
        })
      });

      if (hasAccess) {
        deckBtn.on("pointerdown", () => {
          playSound("door");
          currentDeck = i;
          game.goToScene("gameplay");
        });
        deckBtn.on("pointerenter", () => deckBtn.color = ex.Color.fromHex("#2a5a2a"));
        deckBtn.on("pointerleave", () => deckBtn.color = cleared ? ex.Color.fromHex("#1a4a1a") : ex.Color.fromHex(deck.color));
      }

      this.add(deckBtn);
      this.add(nameLabel);
      this.add(statusLabel);
      this.add(keyLabel);
    });

    // Upgrade button
    const upgradeBtn = new ex.Actor({
      pos: ex.vec(200, 520),
      width: 150,
      height: 45,
      color: ex.Color.fromHex("#2a2a4a")
    });

    const upgradeLabel = new ex.Label({
      text: "Upgrades",
      pos: ex.vec(200, 520),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    upgradeBtn.on("pointerdown", () => {
      playSound("door");
      game.goToScene("upgradeMenu");
    });

    this.add(upgradeBtn);
    this.add(upgradeLabel);

    // Stats display
    const statsLabel = new ex.Label({
      text: `Health: ${playerStats.health}/${playerStats.maxHealth} | Ammo: ${playerStats.ammo}/${playerStats.maxAmmo} | Kills: ${playerStats.kills}`,
      pos: ex.vec(400, 570),
      font: new ex.Font({ size: 14, color: ex.Color.LightGray, textAlign: ex.TextAlign.Center })
    });
    this.add(statsLabel);
  }
}

// Upgrade Menu Scene
class UpgradeMenuScene extends ex.Scene {
  onActivate() {
    this.clear();

    const title = new ex.Label({
      text: "UPGRADES",
      pos: ex.vec(400, 50),
      font: new ex.Font({ size: 32, color: ex.Color.fromHex("#00cc88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const creditsLabel = new ex.Label({
      text: `Credits: ${credits}`,
      pos: ex.vec(400, 90),
      font: new ex.Font({ size: 20, color: ex.Color.fromHex("#ffcc00"), textAlign: ex.TextAlign.Center })
    });
    this.add(creditsLabel);

    Object.entries(upgrades).forEach(([key, upg], i) => {
      const y = 150 + i * 70;
      const nextLevel = upg.current + 1;
      const cost = upg.levels[nextLevel];
      const canBuy = cost !== undefined && credits >= cost;

      const nameLabel = new ex.Label({
        text: `${upg.name} (Lv ${upg.current}/4)`,
        pos: ex.vec(150, y),
        font: new ex.Font({ size: 16, color: ex.Color.White })
      });
      this.add(nameLabel);

      const bonusLabel = new ex.Label({
        text: `Bonus: +${upg.bonus[upg.current]}`,
        pos: ex.vec(150, y + 20),
        font: new ex.Font({ size: 12, color: ex.Color.LightGray })
      });
      this.add(bonusLabel);

      if (cost !== undefined) {
        const buyBtn = new ex.Actor({
          pos: ex.vec(550, y + 10),
          width: 120,
          height: 35,
          color: canBuy ? ex.Color.fromHex("#1a4a1a") : ex.Color.fromHex("#2a2a2a")
        });

        const costLabel = new ex.Label({
          text: `${cost} credits`,
          pos: ex.vec(550, y + 10),
          font: new ex.Font({
            size: 14,
            color: canBuy ? ex.Color.fromHex("#ffcc00") : ex.Color.Gray,
            textAlign: ex.TextAlign.Center
          })
        });

        if (canBuy) {
          buyBtn.on("pointerdown", () => {
            credits -= cost;
            upg.current++;
            playerStats.upgradesPurchased++;
            applyUpgrades();
            playSound("upgrade");
            checkAchievements();
            saveGame();
            game.goToScene("upgradeMenu");
          });
        }

        this.add(buyBtn);
        this.add(costLabel);
      } else {
        const maxLabel = new ex.Label({
          text: "MAXED",
          pos: ex.vec(550, y + 10),
          font: new ex.Font({ size: 14, color: ex.Color.fromHex("#00ff88"), textAlign: ex.TextAlign.Center })
        });
        this.add(maxLabel);
      }
    });

    // Back button
    const backBtn = new ex.Actor({
      pos: ex.vec(400, 530),
      width: 150,
      height: 40,
      color: ex.Color.fromHex("#3a2a1a")
    });

    const backLabel = new ex.Label({
      text: "Back",
      pos: ex.vec(400, 530),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    backBtn.on("pointerdown", () => {
      playSound("door");
      game.goToScene("deckSelect");
    });

    this.add(backBtn);
    this.add(backLabel);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Escape) game.goToScene("deckSelect");
    });
  }
}

// Gameplay Scene
class GameplayScene extends ex.Scene {
  player;
  enemies = [];
  bullets = [];
  pickups = [];
  enemiesRemaining = 0;
  canShoot = true;
  keySpawned = false;
  bossSpawned = false;

  onActivate() {
    this.clear();
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    isPaused = false;
    gameStarted = true;
    this.keySpawned = false;
    this.bossSpawned = false;

    const deck = decks[currentDeck];
    this.enemiesRemaining = deck.enemies;

    // Floor
    const floor = new ex.Actor({
      pos: ex.vec(400, 300),
      width: 800,
      height: 600,
      color: ex.Color.fromHex(deck.color)
    });
    this.add(floor);

    // Walls/obstacles
    this.addWalls();

    // Player
    this.player = new ex.Actor({
      pos: ex.vec(100, 300),
      width: 24,
      height: 24,
      color: ex.Color.fromHex("#00aaff")
    });
    this.player.body.collisionType = ex.CollisionType.Active;
    this.add(this.player);

    // Spawn enemies
    this.spawnEnemies();

    // Spawn pickups
    this.spawnPickups();

    // Input handling
    this.setupInput();

    // HUD
    this.setupHUD();
  }

  addWalls() {
    const walls = [
      { x: 400, y: 10, w: 800, h: 20 },
      { x: 400, y: 590, w: 800, h: 20 },
      { x: 10, y: 300, w: 20, h: 600 },
      { x: 790, y: 300, w: 20, h: 600 },
      // Internal walls
      { x: 250, y: 200, w: 150, h: 20 },
      { x: 550, y: 400, w: 150, h: 20 },
      { x: 400, y: 150, w: 20, h: 100 },
      { x: 400, y: 450, w: 20, h: 100 }
    ];

    walls.forEach(w => {
      const wall = new ex.Actor({
        pos: ex.vec(w.x, w.y),
        width: w.w,
        height: w.h,
        color: ex.Color.fromHex("#333344")
      });
      wall.body.collisionType = ex.CollisionType.Fixed;
      wall.addTag("wall");
      this.add(wall);
    });
  }

  spawnEnemies() {
    const deck = decks[currentDeck];
    for (let i = 0; i < deck.enemies; i++) {
      const typeIdx = Math.min(enemyTypes.length - 1, Math.floor(Math.random() * (currentDeck + 2)));
      const type = enemyTypes[typeIdx];

      const enemy = new ex.Actor({
        pos: ex.vec(300 + Math.random() * 400, 100 + Math.random() * 400),
        width: type.size,
        height: type.size,
        color: ex.Color.fromHex(type.color)
      });
      enemy.body.collisionType = ex.CollisionType.Active;
      enemy.addTag("enemy");

      enemy.health = type.health;
      enemy.maxHealth = type.health;
      enemy.damage = type.damage;
      enemy.speed = type.speed;
      enemy.enemyType = type;
      enemy.attackTimer = 0;

      this.add(enemy);
      this.enemies.push(enemy);
    }
  }

  spawnPickups() {
    // Ammo pickups
    for (let i = 0; i < 3; i++) {
      const pickup = new ex.Actor({
        pos: ex.vec(100 + Math.random() * 600, 100 + Math.random() * 400),
        width: 16,
        height: 16,
        color: ex.Color.fromHex("#ffaa00")
      });
      pickup.addTag("ammo");
      this.add(pickup);
      this.pickups.push(pickup);
    }

    // Health pickups
    for (let i = 0; i < 2; i++) {
      const pickup = new ex.Actor({
        pos: ex.vec(100 + Math.random() * 600, 100 + Math.random() * 400),
        width: 16,
        height: 16,
        color: ex.Color.fromHex("#00ff88")
      });
      pickup.addTag("health");
      this.add(pickup);
      this.pickups.push(pickup);
    }
  }

  setupInput() {
    // Movement handled in onPreUpdate
  }

  setupHUD() {
    // HUD elements created in onPreUpdate
  }

  onPreUpdate(engine, delta) {
    if (isPaused) return;

    // Player movement
    const moveDir = ex.vec(0, 0);
    if (engine.input.keyboard.isHeld(ex.Keys.W) || engine.input.keyboard.isHeld(ex.Keys.Up)) moveDir.y = -1;
    if (engine.input.keyboard.isHeld(ex.Keys.S) || engine.input.keyboard.isHeld(ex.Keys.Down)) moveDir.y = 1;
    if (engine.input.keyboard.isHeld(ex.Keys.A) || engine.input.keyboard.isHeld(ex.Keys.Left)) moveDir.x = -1;
    if (engine.input.keyboard.isHeld(ex.Keys.D) || engine.input.keyboard.isHeld(ex.Keys.Right)) moveDir.x = 1;

    if (moveDir.size > 0) {
      moveDir.normalize();
      this.player.vel = moveDir.scale(playerStats.moveSpeed);
    } else {
      this.player.vel = ex.vec(0, 0);
    }

    // Keep player in bounds
    this.player.pos.x = Math.max(30, Math.min(770, this.player.pos.x));
    this.player.pos.y = Math.max(30, Math.min(570, this.player.pos.y));

    // Shooting
    if (engine.input.pointers.primary.isDown && this.canShoot && playerStats.ammo > 0) {
      this.canShoot = false;
      playerStats.ammo--;
      playSound("shoot");

      const mousePos = engine.input.pointers.primary.lastWorldPos;
      const dir = mousePos.sub(this.player.pos).normalize();

      const bullet = new ex.Actor({
        pos: this.player.pos.clone(),
        width: 6,
        height: 6,
        color: ex.Color.Yellow
      });
      bullet.vel = dir.scale(500);
      bullet.addTag("bullet");
      this.add(bullet);
      this.bullets.push(bullet);

      setTimeout(() => this.canShoot = true, 1000 / playerStats.fireRate);
    }

    // Enemy AI
    this.enemies.forEach(enemy => {
      if (!enemy.isKilled()) {
        const toPlayer = this.player.pos.sub(enemy.pos);
        const dist = toPlayer.size;

        if (dist > 40) {
          enemy.vel = toPlayer.normalize().scale(enemy.speed);
        } else {
          enemy.vel = ex.vec(0, 0);
          enemy.attackTimer += delta / 1000;
          if (enemy.attackTimer >= 1) {
            enemy.attackTimer = 0;
            const actualDamage = Math.max(1, enemy.damage - playerStats.armor);
            playerStats.health -= actualDamage;
            playSound("hit");
            if (playerStats.health <= 0) {
              playSound("death");
              game.goToScene("gameOver");
            }
          }
        }
      }
    });

    // Bullet collisions
    this.bullets.forEach(bullet => {
      if (!bullet.isKilled()) {
        // Check off screen
        if (bullet.pos.x < 0 || bullet.pos.x > 800 || bullet.pos.y < 0 || bullet.pos.y > 600) {
          bullet.kill();
        }

        // Check enemy hits
        this.enemies.forEach(enemy => {
          if (!enemy.isKilled() && bullet.pos.distance(enemy.pos) < enemy.width) {
            enemy.health -= playerStats.damage;
            bullet.kill();
            playSound("hit");

            if (enemy.health <= 0) {
              const earnedCredits = 10 + Math.floor(Math.random() * 10);
              credits += earnedCredits;
              playerStats.kills++;
              if (enemy.isBoss) playerStats.bossKills++;

              playSound("alien");
              enemy.kill();
              this.enemiesRemaining--;

              checkAchievements();

              // Check for deck clear
              if (this.enemiesRemaining <= 0) {
                this.onDeckClear();
              }
            }
          }
        });
      }
    });

    // Pickup collisions
    this.pickups.forEach(pickup => {
      if (!pickup.isKilled() && this.player.pos.distance(pickup.pos) < 25) {
        if (pickup.hasTag("ammo")) {
          playerStats.ammo = Math.min(playerStats.maxAmmo, playerStats.ammo + 10);
          playSound("pickup");
          playerStats.itemsCollected++;
        } else if (pickup.hasTag("health")) {
          playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 25);
          playSound("pickup");
          playerStats.itemsCollected++;
        } else if (pickup.hasTag("keycard")) {
          const color = pickup.keycardColor;
          playerStats.keycards[color] = true;
          playSound("upgrade");
          playerStats.itemsCollected++;
        }
        pickup.kill();
        checkAchievements();
      }
    });

    // Pause
    if (engine.input.keyboard.wasPressed(ex.Keys.Escape)) {
      isPaused = !isPaused;
    }
  }

  onDeckClear() {
    const deck = decks[currentDeck];
    playerStats.decksCleared.add(currentDeck);

    // Spawn keycard if deck has one
    if (deck.hasKey && !this.keySpawned) {
      this.keySpawned = true;
      const keycard = new ex.Actor({
        pos: ex.vec(400, 300),
        width: 24,
        height: 16,
        color: ex.Color.fromHex(deck.hasKey === "blue" ? "#0088ff" : (deck.hasKey === "red" ? "#ff4444" : "#ffcc00"))
      });
      keycard.addTag("keycard");
      keycard.keycardColor = deck.hasKey;
      this.add(keycard);
      this.pickups.push(keycard);
    }

    // Spawn boss if final deck
    if (deck.hasBoss && !this.bossSpawned) {
      this.bossSpawned = true;
      const boss = new ex.Actor({
        pos: ex.vec(600, 300),
        width: bossType.size,
        height: bossType.size,
        color: ex.Color.fromHex(bossType.color)
      });
      boss.body.collisionType = ex.CollisionType.Active;
      boss.addTag("enemy");
      boss.health = bossType.health;
      boss.maxHealth = bossType.health;
      boss.damage = bossType.damage;
      boss.speed = bossType.speed;
      boss.enemyType = bossType;
      boss.attackTimer = 0;
      boss.isBoss = true;
      this.add(boss);
      this.enemies.push(boss);
      this.enemiesRemaining = 1;
      playSound("alien");
    } else if (!deck.hasBoss || (deck.hasBoss && this.bossSpawned && this.enemiesRemaining <= 0)) {
      // Check victory
      if (currentDeck === 5 && playerStats.decksCleared.has(5)) {
        achievements.escaped.unlocked = true;
        saveGame();
        game.goToScene("victory");
      } else {
        saveGame();
        setTimeout(() => game.goToScene("deckSelect"), 1500);
      }
    }
  }

  onPostDraw(ctx) {
    // HUD
    ctx.save();

    // Health bar
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 20, 150, 20);
    ctx.fillStyle = "#cc3333";
    ctx.fillRect(22, 22, (playerStats.health / playerStats.maxHealth) * 146, 16);

    // Ammo
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Ammo: ${playerStats.ammo}/${playerStats.maxAmmo}`, 20, 60);
    ctx.fillText(`Credits: ${credits}`, 20, 80);
    ctx.fillText(`Enemies: ${this.enemiesRemaining}`, 20, 100);

    // Deck name
    ctx.fillStyle = "#00cc88";
    ctx.font = "18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(decks[currentDeck].name, 400, 30);

    // Pause overlay
    if (isPaused) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = "#fff";
      ctx.font = "32px monospace";
      ctx.fillText("PAUSED", 400, 280);
      ctx.font = "16px monospace";
      ctx.fillText("Press ESC to resume", 400, 320);
    }

    // Achievement popup
    if (achievementQueue.length > 0) {
      const achName = achievementQueue[0];
      ctx.fillStyle = "rgba(40,20,60,0.9)";
      ctx.fillRect(275, 60, 250, 50);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "14px monospace";
      ctx.fillText("Achievement: " + achName, 400, 90);

      setTimeout(() => achievementQueue.shift(), 3000);
    }

    ctx.restore();
  }
}

// Game Over Scene
class GameOverScene extends ex.Scene {
  onActivate() {
    this.clear();
    stopBGM();

    const title = new ex.Label({
      text: "MISSION FAILED",
      pos: ex.vec(400, 150),
      font: new ex.Font({ size: 48, color: ex.Color.Red, textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const stats = [
      `Aliens Killed: ${playerStats.kills}`,
      `Decks Cleared: ${playerStats.decksCleared.size}/6`,
      `Credits Earned: ${credits}`,
      `Items Collected: ${playerStats.itemsCollected}`
    ];

    stats.forEach((stat, i) => {
      const label = new ex.Label({
        text: stat,
        pos: ex.vec(400, 250 + i * 35),
        font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
      });
      this.add(label);
    });

    const retryBtn = new ex.Actor({
      pos: ex.vec(300, 450),
      width: 150,
      height: 45,
      color: ex.Color.fromHex("#1a5a1a")
    });

    const retryLabel = new ex.Label({
      text: "Try Again",
      pos: ex.vec(300, 450),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    retryBtn.on("pointerdown", () => {
      playerStats.health = playerStats.maxHealth;
      playerStats.ammo = playerStats.maxAmmo;
      saveGame();
      game.goToScene("gameplay");
    });

    this.add(retryBtn);
    this.add(retryLabel);

    const menuBtn = new ex.Actor({
      pos: ex.vec(500, 450),
      width: 150,
      height: 45,
      color: ex.Color.fromHex("#3a2a1a")
    });

    const menuLabel = new ex.Label({
      text: "Main Menu",
      pos: ex.vec(500, 450),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    menuBtn.on("pointerdown", () => game.goToScene("menu"));

    this.add(menuBtn);
    this.add(menuLabel);

    game.input.keyboard.on("press", (evt) => {
      if (evt.key === ex.Keys.Space) {
        playerStats.health = playerStats.maxHealth;
        playerStats.ammo = playerStats.maxAmmo;
        saveGame();
        game.goToScene("gameplay");
      }
    });
  }
}

// Victory Scene
class VictoryScene extends ex.Scene {
  onActivate() {
    this.clear();
    stopBGM();
    playSound("victory");

    const title = new ex.Label({
      text: "ESCAPED!",
      pos: ex.vec(400, 120),
      font: new ex.Font({ size: 48, color: ex.Color.fromHex("#00ff88"), textAlign: ex.TextAlign.Center })
    });
    this.add(title);

    const subtitle = new ex.Label({
      text: "You reached the escape pod and survived!",
      pos: ex.vec(400, 170),
      font: new ex.Font({ size: 18, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });
    this.add(subtitle);

    const stats = [
      `Aliens Killed: ${playerStats.kills}`,
      `Boss Aliens Defeated: ${playerStats.bossKills}`,
      `Credits Earned: ${credits}`,
      `Upgrades Purchased: ${playerStats.upgradesPurchased}`,
      `Items Collected: ${playerStats.itemsCollected}`
    ];

    stats.forEach((stat, i) => {
      const label = new ex.Label({
        text: stat,
        pos: ex.vec(400, 230 + i * 35),
        font: new ex.Font({ size: 16, color: ex.Color.LightGray, textAlign: ex.TextAlign.Center })
      });
      this.add(label);
    });

    const unlocked = Object.values(achievements).filter(a => a.unlocked).length;
    const achLabel = new ex.Label({
      text: `Achievements: ${unlocked}/${Object.keys(achievements).length}`,
      pos: ex.vec(400, 420),
      font: new ex.Font({ size: 18, color: ex.Color.fromHex("#ffcc00"), textAlign: ex.TextAlign.Center })
    });
    this.add(achLabel);

    const menuBtn = new ex.Actor({
      pos: ex.vec(400, 500),
      width: 180,
      height: 50,
      color: ex.Color.fromHex("#1a3a3a")
    });

    const menuLabel = new ex.Label({
      text: "Main Menu",
      pos: ex.vec(400, 500),
      font: new ex.Font({ size: 20, color: ex.Color.White, textAlign: ex.TextAlign.Center })
    });

    menuBtn.on("pointerdown", () => game.goToScene("menu"));

    this.add(menuBtn);
    this.add(menuLabel);
  }
}

// Add scenes
game.addScene("menu", new MenuScene());
game.addScene("tutorial", new TutorialScene());
game.addScene("settings", new SettingsScene());
game.addScene("achievementsMenu", new AchievementsMenuScene());
game.addScene("deckSelect", new DeckSelectScene());
game.addScene("upgradeMenu", new UpgradeMenuScene());
game.addScene("gameplay", new GameplayScene());
game.addScene("gameOver", new GameOverScene());
game.addScene("victory", new VictoryScene());

// Start
game.start().then(() => {
  game.goToScene("menu");
});
