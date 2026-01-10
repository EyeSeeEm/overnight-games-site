// Spice Route EXPANDED - Trading Empire Simulation
// Full-featured trading game with save/load, achievements, ship upgrades
// Using global kaplay from CDN

const k = kaplay({
  width: 900,
  height: 550,
  scale: 1.4,
  background: [26, 58, 92],
  crisp: true,
  pixelDensity: 1,
});

// ============================================
// AUDIO SYSTEM
// ============================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmOsc = null, bgmGain = null;

function startBGM() {
  if (bgmOsc) return;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);
  bgmOsc = audioCtx.createOscillator();
  bgmOsc.type = 'sine';
  bgmOsc.frequency.setValueAtTime(65, audioCtx.currentTime);
  bgmOsc.connect(bgmGain);
  bgmOsc.start();
}

function stopBGM() { if (bgmOsc) { bgmOsc.stop(); bgmOsc = null; } }

function playSound(type, vol = 0.3) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(vol, now);

  switch (type) {
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.05);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
    case 'buy':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(500, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'sail':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case 'storm':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case 'pirate':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(100, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'success':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1047, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case 'achievement':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(784, now + 0.15);
      osc.frequency.setValueAtTime(1047, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
      break;
    case 'upgrade':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
  }
}

// ============================================
// COLORS
// ============================================
const COLORS = {
  bg: [26, 58, 92], gold: [255, 215, 80], parchment: [245, 230, 211],
  navy: [26, 58, 92], red: [180, 60, 60], green: [60, 140, 80],
  ocean: [40, 80, 130], text: [60, 50, 40],
};

// ============================================
// EXPANDED GAME DATA
// ============================================
const tradeGoods = {
  textiles: { name: 'Textiles', buyPrice: 10, color: [150, 100, 200] },
  glassware: { name: 'Glassware', buyPrice: 20, color: [100, 200, 220] },
  weapons: { name: 'Weapons', buyPrice: 40, color: [180, 180, 180] },
  wine: { name: 'Wine', buyPrice: 15, color: [150, 50, 80] },
  cloth: { name: 'Fine Cloth', buyPrice: 30, color: [200, 150, 100] },
  iron: { name: 'Iron Ore', buyPrice: 25, color: [120, 120, 130] },
};

const spices = {
  pepper: { name: 'Pepper', sellPrice: 25, color: [80, 60, 40] },
  cinnamon: { name: 'Cinnamon', sellPrice: 40, color: [180, 100, 60] },
  cloves: { name: 'Cloves', sellPrice: 60, color: [100, 60, 40] },
  nutmeg: { name: 'Nutmeg', sellPrice: 80, color: [140, 100, 70] },
  saffron: { name: 'Saffron', sellPrice: 120, color: [255, 180, 50] },
  cardamom: { name: 'Cardamom', sellPrice: 50, color: [100, 130, 80] },
};

// Expanded ports (12 total)
const ports = {
  lisbon: { name: 'Lisbon', x: 60, y: 140, distance: 0, pirateRisk: 0, stormRisk: 0, goods: ['textiles', 'glassware', 'weapons', 'wine', 'cloth', 'iron'] },
  cape_verde: { name: 'Cape Verde', x: 110, y: 190, distance: 1, pirateRisk: 0.05, stormRisk: 0.1, spices: ['pepper'] },
  gold_coast: { name: 'Gold Coast', x: 180, y: 210, distance: 2, pirateRisk: 0.1, stormRisk: 0.1, spices: ['pepper', 'cinnamon'] },
  cape_town: { name: 'Cape Town', x: 250, y: 270, distance: 3, pirateRisk: 0.08, stormRisk: 0.15, spices: ['pepper'] },
  mombasa: { name: 'Mombasa', x: 350, y: 200, distance: 4, pirateRisk: 0.15, stormRisk: 0.12, spices: ['pepper', 'cinnamon', 'cardamom'] },
  aden: { name: 'Aden', x: 410, y: 170, distance: 5, pirateRisk: 0.2, stormRisk: 0.1, spices: ['cinnamon', 'cardamom', 'saffron'] },
  calicut: { name: 'Calicut', x: 520, y: 180, distance: 6, pirateRisk: 0.15, stormRisk: 0.1, spices: ['pepper', 'cinnamon', 'cloves'] },
  ceylon: { name: 'Ceylon', x: 560, y: 210, distance: 7, pirateRisk: 0.18, stormRisk: 0.12, spices: ['cinnamon', 'cloves', 'nutmeg'] },
  malacca: { name: 'Malacca', x: 650, y: 220, distance: 8, pirateRisk: 0.22, stormRisk: 0.15, spices: ['pepper', 'cloves', 'nutmeg'] },
  java: { name: 'Java', x: 700, y: 250, distance: 9, pirateRisk: 0.25, stormRisk: 0.18, spices: ['nutmeg', 'cloves'] },
  china: { name: 'Canton', x: 750, y: 180, distance: 10, pirateRisk: 0.2, stormRisk: 0.1, spices: ['saffron'], special: true },
  japan: { name: 'Nagasaki', x: 800, y: 150, distance: 11, pirateRisk: 0.15, stormRisk: 0.2, spices: ['saffron'], special: true },
};

// Ship upgrades
const shipUpgrades = {
  hull: { name: 'Hull Reinforcement', levels: [0, 500, 1500, 4000], effect: 'Reduce storm damage', desc: '-15% cargo loss per level' },
  cargo: { name: 'Cargo Expansion', levels: [0, 800, 2000, 5000], effect: 'Increase capacity', desc: '+20 cargo per level' },
  cannons: { name: 'Cannons', levels: [0, 600, 1800, 4500], effect: 'Reduce pirate loss', desc: '-15% pirate loss per level' },
  speed: { name: 'Better Sails', levels: [0, 1000, 3000, 7000], effect: 'Faster voyages', desc: '-10% voyage time per level' },
};

// Royal Orders (12 orders)
const royalOrders = [
  { requirements: { pepper: 30 }, deadline: 1500, reward: 200, unlocks: ['gold_coast'], name: 'First Spices' },
  { requirements: { pepper: 50 }, deadline: 1502, reward: 350, unlocks: ['cape_town'], name: 'Pepper Shipment' },
  { requirements: { pepper: 40, cinnamon: 20 }, deadline: 1504, reward: 550, unlocks: ['mombasa'], name: 'Exotic Flavors' },
  { requirements: { pepper: 60, cinnamon: 30 }, deadline: 1506, reward: 800, unlocks: ['aden'], name: 'Royal Feast' },
  { requirements: { cinnamon: 50, cardamom: 20 }, deadline: 1508, reward: 1200, unlocks: ['calicut'], name: 'Arabian Nights' },
  { requirements: { pepper: 50, cinnamon: 40, cloves: 15 }, deadline: 1510, reward: 1800, unlocks: ['ceylon'], name: 'Spice Variety' },
  { requirements: { cinnamon: 60, cloves: 40 }, deadline: 1512, reward: 2500, unlocks: ['malacca'], name: 'Eastern Promise' },
  { requirements: { cloves: 50, nutmeg: 20 }, deadline: 1514, reward: 3500, unlocks: ['java'], name: 'Rare Commodities' },
  { requirements: { nutmeg: 40, saffron: 10 }, deadline: 1516, reward: 5000, unlocks: ['china'], name: 'Golden Saffron' },
  { requirements: { pepper: 100, cinnamon: 50, cloves: 30, nutmeg: 20 }, deadline: 1518, reward: 8000, unlocks: ['japan'], name: 'Grand Collection' },
  { requirements: { saffron: 30, nutmeg: 30 }, deadline: 1519, reward: 10000, unlocks: [], name: 'Emperor\'s Desire' },
  { requirements: { pepper: 150, cinnamon: 100, cloves: 50, nutmeg: 40, saffron: 20 }, deadline: 1520, reward: 20000, unlocks: [], name: 'Final Tribute' },
];

// Achievements
const achievementDefs = {
  first_voyage: { name: 'First Voyage', desc: 'Complete your first voyage' },
  first_order: { name: 'Royal Favor', desc: 'Complete your first Royal Order' },
  rich_trader: { name: 'Rich Trader', desc: 'Accumulate 5000 ducats' },
  wealthy: { name: 'Merchant Prince', desc: 'Accumulate 20000 ducats' },
  world_traveler: { name: 'World Traveler', desc: 'Visit all ports' },
  spice_master: { name: 'Spice Master', desc: 'Trade 500 units of spices' },
  survivor: { name: 'Survivor', desc: 'Survive 10 pirate attacks' },
  storm_rider: { name: 'Storm Rider', desc: 'Survive 10 storms' },
  full_cargo: { name: 'Full Hold', desc: 'Fill your cargo to maximum' },
  upgraded: { name: 'Ship of the Line', desc: 'Fully upgrade your ship' },
  speed_demon: { name: 'Speed Demon', desc: 'Complete 50 voyages' },
  victory: { name: 'Trade Emperor', desc: 'Complete all Royal Orders' },
};

// ============================================
// GAME STATE
// ============================================
const defaultState = {
  year: 1498, ducats: 500, totalDucats: 500, reputation: 1,
  currentPort: 'lisbon', selectedPort: null,
  cargo: {}, cargoSpices: {}, cargoCapacity: 50,
  warehouse: {},
  currentOrder: 0, orderProgress: {},
  unlockedPorts: ['lisbon', 'cape_verde'],
  stats: { voyages: 0, spicesTraded: 0, piratesSurvived: 0, stormsSurvived: 0 },
  upgrades: { hull: 0, cargo: 0, cannons: 0, speed: 0 },
  achievements: [],
  portsVisited: ['lisbon'],
  tutorialSeen: false, playTime: 0
};

let gameState = JSON.parse(JSON.stringify(defaultState));
let messageQueue = [];
let achievementDisplay = null;
let shopOpen = false, upgradeOpen = false, helpOpen = false, pauseOpen = false;

window.gameState = gameState;

// ============================================
// SAVE/LOAD
// ============================================
function saveGame() {
  localStorage.setItem('spiceroute_save', JSON.stringify(gameState));
  playSound('click');
  showMessage("Game Saved!", [100, 255, 100]);
}

function loadGame() {
  const data = localStorage.getItem('spiceroute_save');
  if (data) { gameState = JSON.parse(data); return true; }
  return false;
}

function hasSaveGame() { return localStorage.getItem('spiceroute_save') !== null; }
function deleteSave() { localStorage.removeItem('spiceroute_save'); }

// ============================================
// ACHIEVEMENTS
// ============================================
function unlockAchievement(id) {
  if (gameState.achievements.includes(id)) return;
  gameState.achievements.push(id);
  playSound('achievement');
  achievementDisplay = { name: achievementDefs[id].name, time: 3 };
}

function checkAchievements() {
  if (gameState.stats.voyages >= 1) unlockAchievement('first_voyage');
  if (gameState.currentOrder >= 1) unlockAchievement('first_order');
  if (gameState.totalDucats >= 5000) unlockAchievement('rich_trader');
  if (gameState.totalDucats >= 20000) unlockAchievement('wealthy');
  if (gameState.portsVisited.length >= Object.keys(ports).length) unlockAchievement('world_traveler');
  if (gameState.stats.spicesTraded >= 500) unlockAchievement('spice_master');
  if (gameState.stats.piratesSurvived >= 10) unlockAchievement('survivor');
  if (gameState.stats.stormsSurvived >= 10) unlockAchievement('storm_rider');
  if (gameState.stats.voyages >= 50) unlockAchievement('speed_demon');
  if (gameState.currentOrder >= royalOrders.length) unlockAchievement('victory');

  const totalUpgrades = Object.values(gameState.upgrades).reduce((a, b) => a + b, 0);
  if (totalUpgrades >= 12) unlockAchievement('upgraded');

  const totalCargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) +
                     Object.values(gameState.cargoSpices).reduce((a, b) => a + b, 0);
  if (totalCargo >= getCargoCapacity()) unlockAchievement('full_cargo');
}

// ============================================
// HELPERS
// ============================================
function getCargoCapacity() { return 50 + gameState.upgrades.cargo * 20; }
function getPirateLossReduction() { return gameState.upgrades.cannons * 0.15; }
function getStormLossReduction() { return gameState.upgrades.hull * 0.15; }
function getSpeedBonus() { return gameState.upgrades.speed * 0.1; }

function showMessage(text, color = [255, 255, 200]) {
  messageQueue.push({ text, color, time: 2.5 });
}

function spawnParticles(pos, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    k.add([
      k.circle(3), k.pos(pos), k.anchor("center"),
      k.color(...color), k.opacity(1), k.lifespan(0.8, { fade: 0.4 }), k.z(100),
      { vel: k.vec2(Math.cos(angle), Math.sin(angle)).scale(60 + Math.random() * 40),
        update() { this.pos = this.pos.add(this.vel.scale(k.dt())); this.vel.y += 100 * k.dt(); } }
    ]);
  }
}

// ============================================
// TITLE SCENE
// ============================================
k.scene("title", () => {
  // Waves
  for (let i = 0; i < 40; i++) {
    k.add([
      k.rect(4 + Math.random() * 6, 2),
      k.pos(Math.random() * k.width(), 200 + Math.random() * 150),
      k.color(80, 140, 200), k.opacity(0.3 + Math.random() * 0.3), k.z(0),
      { speed: 10 + Math.random() * 30, baseY: 200 + Math.random() * 150, offset: Math.random() * Math.PI * 2,
        update() { this.pos.x -= this.speed * k.dt(); this.pos.y = this.baseY + Math.sin(k.time() * 2 + this.offset) * 4;
          if (this.pos.x < -10) this.pos.x = k.width() + 10; } }
    ]);
  }

  // Title
  for (let i = 3; i >= 0; i--) {
    k.add([k.text("SPICE ROUTE", { size: 38 + i * 3 }), k.pos(k.width() / 2, 70), k.anchor("center"),
      k.color(...COLORS.gold), k.opacity(i === 0 ? 1 : 0.1), k.z(10 - i)]);
  }
  k.add([k.text("EXPANDED EDITION", { size: 14 }), k.pos(k.width() / 2, 110), k.anchor("center"), k.color(200, 180, 100)]);

  const menuItems = [
    { text: "New Game", action: () => { gameState = JSON.parse(JSON.stringify(defaultState)); k.go("tutorial"); } },
    { text: "Continue", action: () => { if (loadGame()) k.go("game"); }, enabled: hasSaveGame() },
    { text: "Help", action: () => k.go("help") },
  ];

  let selected = 0;
  menuItems.forEach((item, i) => {
    const txt = k.add([
      k.text(item.text, { size: 16 }),
      k.pos(k.width() / 2, 200 + i * 40), k.anchor("center"),
      k.color(item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 220),
      k.z(10), { idx: i }
    ]);
    txt.onUpdate(() => { txt.color = i === selected ? k.rgb(255, 220, 100) : k.rgb(item.enabled === false ? 100 : 200, item.enabled === false ? 100 : 200, 220); });
  });

  k.onKeyPress("up", () => { selected = Math.max(0, selected - 1); playSound('click'); });
  k.onKeyPress("down", () => { selected = Math.min(menuItems.length - 1, selected + 1); playSound('click'); });
  k.onKeyPress("w", () => { selected = Math.max(0, selected - 1); playSound('click'); });
  k.onKeyPress("s", () => { selected = Math.min(menuItems.length - 1, selected + 1); playSound('click'); });
  k.onKeyPress("space", () => { audioCtx.resume(); const item = menuItems[selected]; if (item.enabled !== false) { playSound('click'); item.action(); } });
  k.onKeyPress("enter", () => { audioCtx.resume(); const item = menuItems[selected]; if (item.enabled !== false) { playSound('click'); item.action(); } });
});

// ============================================
// TUTORIAL
// ============================================
k.scene("tutorial", () => {
  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(20, 25, 40)]);
  k.add([k.text("HOW TO PLAY", { size: 28 }), k.pos(k.width() / 2, 40), k.anchor("center"), k.color(...COLORS.gold)]);

  const tips = [
    "1. Buy trade goods in Lisbon (textiles, weapons, etc.)",
    "2. Click a port on the map to select it, then click SAIL",
    "3. Sell your goods at foreign ports for profit",
    "4. Buy exotic spices (pepper, cinnamon, etc.)",
    "5. Return to Lisbon to store spices in your warehouse",
    "6. Deliver spices to complete Royal Orders for rewards",
    "7. Unlock new ports by completing orders",
    "8. Upgrade your ship for better capacity and safety",
    "",
    "Watch out for pirates and storms on long voyages!",
    "Complete all 12 Royal Orders to win the game.",
  ];

  tips.forEach((tip, i) => {
    k.add([k.text(tip, { size: 11 }), k.pos(k.width() / 2, 90 + i * 24), k.anchor("center"), k.color(180, 180, 200)]);
  });

  const start = k.add([k.text("[ PRESS SPACE TO BEGIN ]", { size: 14 }), k.pos(k.width() / 2, k.height() - 50), k.anchor("center"), k.color(...COLORS.gold)]);
  start.onUpdate(() => { start.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4); });

  k.onKeyPress("space", () => { gameState.tutorialSeen = true; k.go("game"); });
  k.onKeyPress("enter", () => { gameState.tutorialSeen = true; k.go("game"); });
});

// ============================================
// HELP SCENE
// ============================================
k.scene("help", () => {
  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(20, 25, 40)]);
  k.add([k.text("CONTROLS & TIPS", { size: 24 }), k.pos(k.width() / 2, 40), k.anchor("center"), k.color(...COLORS.gold)]);

  const tips = [
    "CLICK - Select ports, buy/sell goods",
    "1-6 - Quick buy goods (in Lisbon)",
    "F5 - Quick save",
    "ESC - Pause menu",
    "U - Upgrade ship",
    "H - This help screen",
    "",
    "TRADING TIPS:",
    "- Buy low in Lisbon, sell high abroad",
    "- Rare spices are worth more but harder to get",
    "- Upgrade your ship to carry more cargo",
    "- Watch deadlines on Royal Orders!",
  ];

  tips.forEach((tip, i) => {
    k.add([k.text(tip, { size: 11 }), k.pos(k.width() / 2, 90 + i * 24), k.anchor("center"), k.color(180, 180, 200)]);
  });

  k.add([k.text("[ PRESS SPACE TO RETURN ]", { size: 12 }), k.pos(k.width() / 2, k.height() - 50), k.anchor("center"), k.color(150, 150, 180)]);
  k.onKeyPress("space", () => k.go("title"));
  k.onKeyPress("escape", () => k.go("title"));
});

// ============================================
// GAME SCENE
// ============================================
k.scene("game", () => {
  startBGM();
  let buttons = [];

  // Waves
  k.loop(0.3, () => {
    if (Math.random() < 0.5) {
      k.add([
        k.rect(4, 2), k.pos(k.width() + 10, 240 + Math.random() * 30),
        k.color(150, 200, 255), k.opacity(0.5), k.lifespan(1.5, { fade: 0.5 }), k.z(5),
        { vel: k.vec2(-30, 0), update() { this.pos = this.pos.add(this.vel.scale(k.dt())); } }
      ]);
    }
  });

  // Message update
  k.onUpdate(() => {
    messageQueue = messageQueue.filter(m => { m.time -= k.dt(); return m.time > 0; });
    if (achievementDisplay) { achievementDisplay.time -= k.dt(); if (achievementDisplay.time <= 0) achievementDisplay = null; }
  });

  // Keyboard shortcuts
  k.onKeyPress("escape", () => { pauseOpen = !pauseOpen; upgradeOpen = false; playSound('click'); });
  k.onKeyPress("u", () => { if (!pauseOpen) { upgradeOpen = !upgradeOpen; playSound('click'); } });
  k.onKeyPress("h", () => k.go("help"));
  k.onKeyPress("f5", () => saveGame());

  // Quick buy (1-6 keys)
  for (let i = 1; i <= 6; i++) {
    k.onKeyPress(String(i), () => {
      if (gameState.currentPort === 'lisbon' && !pauseOpen && !upgradeOpen) {
        const goodIds = Object.keys(tradeGoods);
        if (i <= goodIds.length) buyGood(goodIds[i - 1]);
      }
    });
  }

  // Draw
  k.onDraw(() => {
    buttons = [];
    drawGame();
    drawMessages();
    if (upgradeOpen) drawUpgrades();
    if (pauseOpen) drawPause();
  });

  // Click
  k.onClick((pos) => {
    if (pauseOpen || upgradeOpen) return;
    for (const btn of buttons) {
      if (btn.action && pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        playSound('click');
        btn.action();
        return;
      }
    }
  });

  function drawGame() {
    // Ocean
    k.drawRect({ pos: k.vec2(0, 120), width: k.width(), height: 180, color: k.rgb(...COLORS.ocean), fixed: true });

    // Header
    k.drawRect({ pos: k.vec2(0, 0), width: k.width(), height: 60, color: k.rgb(...COLORS.navy), opacity: 0.95, fixed: true });
    k.drawRect({ pos: k.vec2(0, 58), width: k.width(), height: 2, color: k.rgb(...COLORS.gold), opacity: 0.5, fixed: true });

    k.drawText({ text: `Ducats: ${gameState.ducats}`, pos: k.vec2(20, 15), size: 14, color: k.rgb(...COLORS.gold), fixed: true });
    k.drawText({ text: `Year: ${Math.floor(gameState.year)}`, pos: k.vec2(180, 15), size: 14, color: k.rgb(255, 255, 255), fixed: true });
    k.drawText({ text: `Rep: ${'*'.repeat(gameState.reputation)}`, pos: k.vec2(320, 15), size: 12, color: k.rgb(200, 180, 140), fixed: true });
    k.drawText({ text: `At: ${ports[gameState.currentPort].name}`, pos: k.vec2(450, 15), size: 14, color: k.rgb(255, 255, 255), fixed: true });

    const cap = getCargoCapacity();
    const cargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) + Object.values(gameState.cargoSpices).reduce((a, b) => a + b, 0);
    k.drawText({ text: `Cargo: ${cargo}/${cap}`, pos: k.vec2(620, 15), size: 12, color: k.rgb(180, 180, 200), fixed: true });

    k.drawText({ text: `Voyages: ${gameState.stats.voyages}`, pos: k.vec2(750, 15), size: 10, color: k.rgb(150, 150, 180), fixed: true });
    k.drawText({ text: `[U] Upgrades | [H] Help | [F5] Save`, pos: k.vec2(20, 42), size: 9, color: k.rgb(120, 130, 160), fixed: true });

    // Draw ports
    for (const [portId, port] of Object.entries(ports)) {
      const unlocked = gameState.unlockedPorts.includes(portId);
      const isCurrent = gameState.currentPort === portId;
      const isSelected = gameState.selectedPort === portId;

      if (isCurrent || isSelected) {
        k.drawCircle({ pos: k.vec2(port.x, port.y), radius: 18, color: isCurrent ? k.rgb(60, 180, 80) : k.rgb(255, 200, 80), opacity: 0.3 + Math.sin(k.time() * 4) * 0.1, fixed: true });
      }

      k.drawCircle({ pos: k.vec2(port.x, port.y), radius: unlocked ? 7 : 4, color: unlocked ? (isCurrent ? k.rgb(80, 200, 100) : k.rgb(100, 150, 200)) : k.rgb(60, 60, 60), fixed: true });
      k.drawText({ text: port.name, pos: k.vec2(port.x, port.y - 14), size: 7, anchor: "center", color: unlocked ? k.rgb(255, 255, 255) : k.rgb(100, 100, 100), fixed: true });

      if (unlocked && !isCurrent) {
        buttons.push({ x: port.x - 25, y: port.y - 18, w: 50, h: 36, action: () => { gameState.selectedPort = portId; } });
      }
    }

    // Order panel
    k.drawRect({ pos: k.vec2(15, 310), width: 280, height: 145, color: k.rgb(25, 20, 15), opacity: 0.95, radius: 6, fixed: true });
    k.drawRect({ pos: k.vec2(15, 310), width: 280, height: 145, outline: { color: k.rgb(180, 140, 80), width: 2 }, fill: false, radius: 6, fixed: true });

    if (gameState.currentOrder < royalOrders.length) {
      const order = royalOrders[gameState.currentOrder];
      k.drawText({ text: `Order #${gameState.currentOrder + 1}: ${order.name}`, pos: k.vec2(25, 320), size: 11, color: k.rgb(...COLORS.gold), fixed: true });
      k.drawText({ text: `Deadline: ${order.deadline} | Reward: ${order.reward}`, pos: k.vec2(25, 338), size: 9, color: k.rgb(180, 150, 100), fixed: true });

      let y = 358;
      for (const [spice, amount] of Object.entries(order.requirements)) {
        const delivered = gameState.orderProgress[spice] || 0;
        const have = gameState.warehouse[spice] || 0;
        const done = delivered >= amount;
        k.drawText({ text: `${spices[spice].name}: ${delivered}/${amount} (have: ${have})`, pos: k.vec2(25, y), size: 9, color: done ? k.rgb(100, 200, 100) : k.rgb(200, 200, 220), fixed: true });
        y += 16;
      }

      if (gameState.currentPort === 'lisbon') {
        const canDeliver = Object.entries(order.requirements).some(([sp, amt]) => (gameState.orderProgress[sp] || 0) < amt && gameState.warehouse[sp] > 0);
        if (canDeliver) {
          buttons.push(drawButton(200, 420, 85, 25, "DELIVER", COLORS.green, [255, 255, 255]));
          buttons[buttons.length - 1].action = deliverSpices;
        }
      }
    } else {
      k.drawText({ text: "VICTORY!", pos: k.vec2(155, 360), size: 24, anchor: "center", color: k.rgb(...COLORS.gold), fixed: true });
      k.drawText({ text: "All Orders Complete!", pos: k.vec2(155, 390), size: 12, anchor: "center", color: k.rgb(100, 200, 100), fixed: true });
    }

    // Trading panel
    k.drawRect({ pos: k.vec2(310, 310), width: 400, height: 145, color: k.rgb(25, 20, 15), opacity: 0.95, radius: 6, fixed: true });

    if (gameState.currentPort === 'lisbon') {
      k.drawText({ text: "BUY GOODS (1-6):", pos: k.vec2(320, 320), size: 10, color: k.rgb(180, 140, 80), fixed: true });
      let x = 320, i = 1;
      for (const [id, good] of Object.entries(tradeGoods)) {
        if (gameState.ducats >= good.buyPrice) {
          buttons.push(drawButton(x, 338, 60, 22, `${i}.${good.name.slice(0, 4)} -${good.buyPrice}`, [50, 80, 120], [255, 255, 255]));
          buttons[buttons.length - 1].action = () => buyGood(id);
        }
        x += 65; i++;
      }

      k.drawText({ text: "SELL SPICES:", pos: k.vec2(320, 370), size: 10, color: k.rgb(180, 140, 80), fixed: true });
      x = 320;
      for (const [id, spice] of Object.entries(spices)) {
        if (gameState.warehouse[id] > 0) {
          buttons.push(drawButton(x, 388, 60, 22, `${spice.name.slice(0, 4)} +${spice.sellPrice}`, COLORS.green, [255, 255, 255]));
          buttons[buttons.length - 1].action = () => sellSpice(id);
          x += 65;
        }
      }
    } else {
      const port = ports[gameState.currentPort];

      k.drawText({ text: "SELL GOODS:", pos: k.vec2(320, 320), size: 10, color: k.rgb(180, 140, 80), fixed: true });
      let x = 320;
      for (const [id, good] of Object.entries(tradeGoods)) {
        if (gameState.cargo[id] > 0) {
          const sellPrice = Math.floor(good.buyPrice * (1.5 + port.distance * 0.3));
          buttons.push(drawButton(x, 338, 60, 22, `${good.name.slice(0, 4)} +${sellPrice}`, COLORS.green, [255, 255, 255]));
          buttons[buttons.length - 1].action = () => sellGood(id, sellPrice);
          x += 65;
        }
      }

      if (port.spices) {
        k.drawText({ text: "BUY SPICES:", pos: k.vec2(320, 370), size: 10, color: k.rgb(180, 140, 80), fixed: true });
        x = 320;
        for (const spiceId of port.spices) {
          const spice = spices[spiceId];
          const price = Math.floor(spice.sellPrice * (0.3 + (10 - port.distance) * 0.05));
          if (gameState.ducats >= price) {
            buttons.push(drawButton(x, 388, 60, 22, `${spice.name.slice(0, 4)} -${price}`, [50, 80, 120], [255, 255, 255]));
            buttons[buttons.length - 1].action = () => buySpice(spiceId, price);
            x += 65;
          }
        }
      }
    }

    // Sail button
    if (gameState.selectedPort && gameState.selectedPort !== gameState.currentPort) {
      buttons.push(drawButton(730, 320, 100, 40, `SAIL TO\n${ports[gameState.selectedPort].name}`, COLORS.red, [255, 255, 255]));
      buttons[buttons.length - 1].action = startVoyage;
    }

    // Warehouse/Cargo display
    k.drawRect({ pos: k.vec2(15, 465), width: k.width() - 30, height: 70, color: k.rgb(...COLORS.navy), opacity: 0.9, radius: 4, fixed: true });

    let cargoText = "Cargo: ";
    for (const [id, amt] of Object.entries(gameState.cargo)) { if (amt > 0) cargoText += `${tradeGoods[id].name}: ${amt}  `; }
    for (const [id, amt] of Object.entries(gameState.cargoSpices)) { if (amt > 0) cargoText += `${spices[id].name}: ${amt}  `; }
    k.drawText({ text: cargoText || "Cargo: Empty", pos: k.vec2(25, 475), size: 9, color: k.rgb(200, 200, 220), fixed: true });

    let warehouseText = "Warehouse: ";
    for (const [id, amt] of Object.entries(gameState.warehouse)) { if (amt > 0) warehouseText += `${spices[id].name}: ${amt}  `; }
    k.drawText({ text: warehouseText || "Warehouse: Empty", pos: k.vec2(25, 495), size: 9, color: k.rgb(200, 180, 140), fixed: true });

    k.drawText({ text: `Achievements: ${gameState.achievements.length}/${Object.keys(achievementDefs).length}`, pos: k.vec2(25, 515), size: 8, color: k.rgb(150, 150, 180), fixed: true });
  }

  function drawButton(x, y, w, h, text, bg, fg) {
    k.drawRect({ pos: k.vec2(x + 2, y + 2), width: w, height: h, color: k.rgb(0, 0, 0), opacity: 0.3, radius: 4, fixed: true });
    k.drawRect({ pos: k.vec2(x, y), width: w, height: h, color: k.rgb(...bg), radius: 4, fixed: true });
    k.drawRect({ pos: k.vec2(x, y), width: w, height: h / 3, color: k.rgb(255, 255, 255), opacity: 0.15, radius: 4, fixed: true });
    k.drawText({ text, pos: k.vec2(x + w / 2, y + h / 2), size: 9, anchor: "center", color: k.rgb(...fg), fixed: true });
    return { x, y, w, h };
  }

  function drawMessages() {
    let y = 80;
    for (const msg of messageQueue) {
      k.drawText({ text: msg.text, pos: k.vec2(k.width() / 2, y), size: 12, anchor: "center", color: k.rgb(...msg.color), opacity: Math.min(1, msg.time), fixed: true });
      y += 22;
    }

    if (achievementDisplay) {
      k.drawRect({ pos: k.vec2(k.width() / 2 - 130, 120), width: 260, height: 55, color: k.rgb(40, 35, 20), opacity: 0.95, radius: 6, fixed: true });
      k.drawRect({ pos: k.vec2(k.width() / 2 - 130, 120), width: 260, height: 55, outline: { color: k.rgb(255, 200, 50), width: 2 }, fill: false, radius: 6, fixed: true });
      k.drawText({ text: "ACHIEVEMENT UNLOCKED!", pos: k.vec2(k.width() / 2, 135), size: 10, anchor: "center", color: k.rgb(255, 220, 100), fixed: true });
      k.drawText({ text: achievementDisplay.name, pos: k.vec2(k.width() / 2, 158), size: 14, anchor: "center", color: k.rgb(255, 255, 200), fixed: true });
    }
  }

  function drawUpgrades() {
    k.drawRect({ pos: k.vec2(0, 0), width: k.width(), height: k.height(), color: k.rgb(0, 0, 0), opacity: 0.7, fixed: true });
    k.drawRect({ pos: k.vec2(150, 100), width: k.width() - 300, height: k.height() - 200, color: k.rgb(30, 25, 20), opacity: 0.98, radius: 8, fixed: true });
    k.drawRect({ pos: k.vec2(150, 100), width: k.width() - 300, height: k.height() - 200, outline: { color: k.rgb(180, 140, 80), width: 2 }, fill: false, radius: 8, fixed: true });

    k.drawText({ text: "SHIP UPGRADES", pos: k.vec2(k.width() / 2, 125), size: 20, anchor: "center", color: k.rgb(...COLORS.gold), fixed: true });
    k.drawText({ text: `Your Gold: ${gameState.ducats}`, pos: k.vec2(k.width() / 2, 150), size: 12, anchor: "center", color: k.rgb(...COLORS.gold), fixed: true });

    let y = 180;
    for (const [id, upgrade] of Object.entries(shipUpgrades)) {
      const level = gameState.upgrades[id];
      const nextCost = upgrade.levels[level + 1];
      const canUpgrade = nextCost && gameState.ducats >= nextCost;

      k.drawText({ text: `${upgrade.name} (Lv.${level}/3)`, pos: k.vec2(180, y), size: 12, color: k.rgb(200, 180, 140), fixed: true });
      k.drawText({ text: upgrade.desc, pos: k.vec2(180, y + 16), size: 9, color: k.rgb(150, 150, 170), fixed: true });

      if (nextCost) {
        const btn = drawButton(550, y, 90, 28, `Upgrade ${nextCost}g`, canUpgrade ? [60, 100, 60] : [60, 60, 60], [255, 255, 255]);
        if (canUpgrade) btn.action = () => { gameState.ducats -= nextCost; gameState.upgrades[id]++; playSound('upgrade'); checkAchievements(); };
        buttons.push(btn);
      } else {
        k.drawText({ text: "MAX", pos: k.vec2(595, y + 10), size: 12, anchor: "center", color: k.rgb(100, 200, 100), fixed: true });
      }
      y += 60;
    }

    k.drawText({ text: "[U] or [ESC] to close", pos: k.vec2(k.width() / 2, k.height() - 130), size: 10, anchor: "center", color: k.rgb(150, 150, 170), fixed: true });
  }

  function drawPause() {
    k.drawRect({ pos: k.vec2(0, 0), width: k.width(), height: k.height(), color: k.rgb(0, 0, 0), opacity: 0.7, fixed: true });
    k.drawText({ text: "PAUSED", pos: k.vec2(k.width() / 2, 150), size: 32, anchor: "center", color: k.rgb(...COLORS.gold), fixed: true });
    k.drawText({ text: "ESC - Resume | F5 - Save | U - Upgrades", pos: k.vec2(k.width() / 2, 220), size: 12, anchor: "center", color: k.rgb(180, 180, 200), fixed: true });
    k.drawText({ text: "Press M to return to Main Menu", pos: k.vec2(k.width() / 2, 260), size: 12, anchor: "center", color: k.rgb(200, 100, 100), fixed: true });

    k.onKeyPress("m", () => { stopBGM(); k.go("title"); });
  }

  // Game functions
  function buyGood(id) {
    const good = tradeGoods[id];
    const cap = getCargoCapacity();
    const cargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) + Object.values(gameState.cargoSpices).reduce((a, b) => a + b, 0);
    const amount = Math.min(5, cap - cargo, Math.floor(gameState.ducats / good.buyPrice));
    if (amount > 0) {
      gameState.ducats -= amount * good.buyPrice;
      gameState.cargo[id] = (gameState.cargo[id] || 0) + amount;
      playSound('buy');
      showMessage(`Bought ${amount} ${good.name}`);
    }
  }

  function sellGood(id, price) {
    const amount = Math.min(5, gameState.cargo[id] || 0);
    if (amount > 0) {
      gameState.ducats += amount * price;
      gameState.totalDucats += amount * price;
      gameState.cargo[id] -= amount;
      if (gameState.cargo[id] <= 0) delete gameState.cargo[id];
      playSound('coin');
      spawnParticles(k.vec2(400, 350), 8, COLORS.gold);
      showMessage(`Sold ${amount} for ${amount * price}g!`);
      checkAchievements();
    }
  }

  function buySpice(id, price) {
    const cap = getCargoCapacity();
    const cargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) + Object.values(gameState.cargoSpices).reduce((a, b) => a + b, 0);
    const amount = Math.min(5, cap - cargo, Math.floor(gameState.ducats / price));
    if (amount > 0) {
      gameState.ducats -= amount * price;
      gameState.cargoSpices[id] = (gameState.cargoSpices[id] || 0) + amount;
      gameState.stats.spicesTraded += amount;
      playSound('buy');
      spawnParticles(k.vec2(400, 400), 6, spices[id].color);
      showMessage(`Bought ${amount} ${spices[id].name}`);
      checkAchievements();
    }
  }

  function sellSpice(id) {
    const spice = spices[id];
    const amount = Math.min(5, gameState.warehouse[id] || 0);
    if (amount > 0) {
      gameState.ducats += amount * spice.sellPrice;
      gameState.totalDucats += amount * spice.sellPrice;
      gameState.warehouse[id] -= amount;
      if (gameState.warehouse[id] <= 0) delete gameState.warehouse[id];
      playSound('coin');
      spawnParticles(k.vec2(400, 400), 10, COLORS.gold);
      showMessage(`Sold ${amount} for ${amount * spice.sellPrice}g!`);
      checkAchievements();
    }
  }

  function deliverSpices() {
    const order = royalOrders[gameState.currentOrder];
    for (const [spice, required] of Object.entries(order.requirements)) {
      const needed = required - (gameState.orderProgress[spice] || 0);
      const have = gameState.warehouse[spice] || 0;
      const toDeliver = Math.min(needed, have);
      if (toDeliver > 0) {
        gameState.warehouse[spice] -= toDeliver;
        if (gameState.warehouse[spice] <= 0) delete gameState.warehouse[spice];
        gameState.orderProgress[spice] = (gameState.orderProgress[spice] || 0) + toDeliver;
      }
    }

    const complete = Object.entries(order.requirements).every(([spice, required]) => (gameState.orderProgress[spice] || 0) >= required);
    if (complete) {
      gameState.ducats += order.reward;
      gameState.totalDucats += order.reward;
      gameState.reputation = Math.min(5, gameState.reputation + 1);
      for (const port of order.unlocks) {
        if (!gameState.unlockedPorts.includes(port)) gameState.unlockedPorts.push(port);
      }
      gameState.currentOrder++;
      gameState.orderProgress = {};
      playSound('success');
      spawnParticles(k.vec2(150, 380), 15, COLORS.gold);
      showMessage(`Order Complete! +${order.reward}g`, COLORS.gold);
      checkAchievements();
      saveGame();
    } else {
      playSound('coin');
      showMessage("Spices delivered");
    }
  }

  function startVoyage() {
    const dest = ports[gameState.selectedPort];
    const curr = ports[gameState.currentPort];
    const distance = Math.abs(dest.distance - curr.distance);

    playSound('sail');

    // Events
    let event = null;
    if (Math.random() < dest.pirateRisk) event = 'pirates';
    else if (Math.random() < dest.stormRisk) event = 'storm';

    // Apply time
    const timeBonus = 1 - getSpeedBonus();
    gameState.year += distance * 0.4 * timeBonus;
    gameState.stats.voyages++;

    // Handle events
    if (event === 'pirates') {
      playSound('pirate');
      const loss = 0.3 * (1 - getPirateLossReduction());
      for (const id in gameState.cargo) gameState.cargo[id] = Math.floor(gameState.cargo[id] * (1 - loss));
      for (const id in gameState.cargoSpices) gameState.cargoSpices[id] = Math.floor(gameState.cargoSpices[id] * (1 - loss));
      gameState.stats.piratesSurvived++;
      showMessage(`Pirates! Lost ${Math.floor(loss * 100)}% cargo!`, [255, 100, 100]);
    } else if (event === 'storm') {
      playSound('storm');
      const loss = 0.15 * (1 - getStormLossReduction());
      for (const id in gameState.cargo) gameState.cargo[id] = Math.floor(gameState.cargo[id] * (1 - loss));
      gameState.stats.stormsSurvived++;
      showMessage(`Storm! Lost ${Math.floor(loss * 100)}% cargo!`, [150, 150, 255]);
    }

    // Arrive
    gameState.currentPort = gameState.selectedPort;
    gameState.selectedPort = null;
    if (!gameState.portsVisited.includes(gameState.currentPort)) gameState.portsVisited.push(gameState.currentPort);

    // Transfer spices to warehouse in Lisbon
    if (gameState.currentPort === 'lisbon') {
      for (const [id, amt] of Object.entries(gameState.cargoSpices)) {
        gameState.warehouse[id] = (gameState.warehouse[id] || 0) + amt;
      }
      gameState.cargoSpices = {};
      if (!event) showMessage(`Arrived in Lisbon! Spices stored.`);
    } else if (!event) {
      showMessage(`Arrived at ${ports[gameState.currentPort].name}!`);
    }

    checkAchievements();

    // Check defeat
    if (gameState.year >= 1520 || gameState.ducats <= 0) {
      stopBGM();
      k.go("gameover", false);
      return;
    }

    // Check order deadline
    if (gameState.currentOrder < royalOrders.length) {
      const order = royalOrders[gameState.currentOrder];
      if (gameState.year > order.deadline) {
        stopBGM();
        k.go("gameover", false);
        return;
      }
    }

    // Victory
    if (gameState.currentOrder >= royalOrders.length) {
      stopBGM();
      k.go("gameover", true);
    }
  }
});

// ============================================
// GAME OVER
// ============================================
k.scene("gameover", (won) => {
  stopBGM();

  for (let i = 0; i < 30; i++) {
    k.add([
      k.circle(2), k.pos(Math.random() * k.width(), Math.random() * k.height()),
      k.color(...(won ? COLORS.gold : [150, 50, 50])), k.opacity(0.3), k.z(0),
      { vel: k.vec2(k.rand(-20, 20), k.rand(-30, -10)),
        update() { this.pos = this.pos.add(this.vel.scale(k.dt())); if (this.pos.y < -10) this.pos.y = k.height() + 10; } }
    ]);
  }

  k.add([k.text(won ? "VICTORY!" : "GAME OVER", { size: 40 }), k.pos(k.width() / 2, 80), k.anchor("center"), k.color(...(won ? COLORS.gold : [255, 100, 100]))]);

  const stats = [
    `Year: ${Math.floor(gameState.year)}`,
    `Total Ducats Earned: ${gameState.totalDucats}`,
    `Voyages: ${gameState.stats.voyages}`,
    `Spices Traded: ${gameState.stats.spicesTraded}`,
    `Orders Completed: ${gameState.currentOrder}/${royalOrders.length}`,
    `Achievements: ${gameState.achievements.length}/${Object.keys(achievementDefs).length}`,
  ];
  stats.forEach((s, i) => {
    k.add([k.text(s, { size: 12 }), k.pos(k.width() / 2, 160 + i * 28), k.anchor("center"), k.color(200, 200, 220)]);
  });

  const restart = k.add([k.text("[ PRESS SPACE FOR MENU ]", { size: 14 }), k.pos(k.width() / 2, k.height() - 60), k.anchor("center"), k.color(...COLORS.gold)]);
  restart.onUpdate(() => { restart.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4); });

  k.onKeyPress("space", () => k.go("title"));
});

k.go("title");
