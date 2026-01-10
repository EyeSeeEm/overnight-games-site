// High Tea EXPANDED - Colonial Trading Simulation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024, HEIGHT = 640;

const COLORS = {
  parchment: '#f4e4bc', parchmentDark: '#d4c49c', ink: '#2c1810', sepia: '#704214',
  gold: '#d4af37', goldBright: '#ffd700', ocean: '#1a4066', oceanDeep: '#0a2840',
  oceanLight: '#2d6a9f', land: '#8b7355', landDark: '#5c4a32', port: '#c9a227',
  wood: '#8b4513', sail: '#f5f5dc', tea: '#3d2817', teaLight: '#654321',
  red: '#8b0000', green: '#228b22', white: '#faf8f0', navy: '#000080'
};

// Expose for testing
window.gameState = {
  scene: 'menu', gold: 1000, year: 1800, currentPort: 'london',
  cargo: { tea: 0, spice: 0, silk: 0, opium: 0, cotton: 0, porcelain: 0 },
  cargoCapacity: 100, reputation: 50, ordersComplete: 0, totalProfit: 0,
  upgrades: {}, achievements: {}, ships: [{ name: 'Starter Sloop', capacity: 50, speed: 1 }],
  settings: { sfx: true, music: true }
};

const GOODS = {
  tea: { color: '#3d2817', name: 'Tea' },
  spice: { color: '#ff8c00', name: 'Spice' },
  silk: { color: '#daa520', name: 'Silk' },
  opium: { color: '#4a0080', name: 'Opium' },
  cotton: { color: '#f5f5dc', name: 'Cotton' },
  porcelain: { color: '#e0ffff', name: 'Porcelain' }
};

const PORTS = {
  london: { name: 'London', x: 430, y: 150, buys: { tea: 28, spice: 22, silk: 40, porcelain: 35 }, sells: { cotton: 8 }, unlocked: true, region: 'europe' },
  lisbon: { name: 'Lisbon', x: 370, y: 240, buys: { tea: 24, spice: 25, silk: 38 }, sells: { cotton: 10 }, unlocked: true, region: 'europe' },
  amsterdam: { name: 'Amsterdam', x: 450, y: 130, buys: { tea: 26, spice: 20, porcelain: 32 }, sells: { cotton: 9 }, unlocked: false, region: 'europe' },
  cairo: { name: 'Cairo', x: 550, y: 300, buys: { silk: 30, cotton: 15 }, sells: { spice: 7 }, unlocked: false, region: 'africa' },
  zanzibar: { name: 'Zanzibar', x: 580, y: 420, buys: { cotton: 18, porcelain: 28 }, sells: { spice: 4 }, unlocked: false, region: 'africa' },
  bombay: { name: 'Bombay', x: 680, y: 320, buys: { porcelain: 25 }, sells: { spice: 5, cotton: 6, opium: 8 }, unlocked: false, region: 'asia' },
  ceylon: { name: 'Ceylon', x: 700, y: 380, buys: { cotton: 16 }, sells: { tea: 7, spice: 4 }, unlocked: false, region: 'asia' },
  singapore: { name: 'Singapore', x: 780, y: 400, buys: { opium: 18, cotton: 14 }, sells: { spice: 5, silk: 15 }, unlocked: false, region: 'asia' },
  canton: { name: 'Canton', x: 820, y: 300, buys: { opium: 25, cotton: 12 }, sells: { tea: 6, silk: 10, porcelain: 8 }, unlocked: false, region: 'asia' },
  macau: { name: 'Macau', x: 840, y: 320, buys: { opium: 22 }, sells: { porcelain: 6, silk: 12 }, unlocked: false, region: 'asia' }
};

const UPGRADES = {
  cargo: { name: 'Cargo Hold', cost: 500, maxLevel: 5, effect: 25, desc: '+25 cargo capacity' },
  speed: { name: 'Better Sails', cost: 400, maxLevel: 5, effect: 0.2, desc: '+20% voyage speed' },
  bargain: { name: 'Merchant Guild', cost: 600, maxLevel: 3, effect: 5, desc: '+5% sell prices' },
  insurance: { name: 'Lloyds Insurance', cost: 800, maxLevel: 3, effect: 0.1, desc: '-10% storm losses' },
  reputation: { name: 'Royal Charter', cost: 1000, maxLevel: 3, effect: 10, desc: '+10 reputation' },
  fleet: { name: 'Fleet Expansion', cost: 2000, maxLevel: 3, effect: 1, desc: '+1 trade ship' }
};

const ACHIEVEMENTS = {
  firstTrade: { name: 'Merchant', desc: 'Complete first trade', icon: '💰' },
  rich: { name: 'Wealthy', desc: 'Earn 10000 gold', icon: '👑' },
  explorer: { name: 'Explorer', desc: 'Visit all ports', icon: '🗺️' },
  teaMaster: { name: 'Tea Master', desc: 'Deliver 500 tea', icon: '🍵' },
  orderMaster: { name: 'Royal Favorite', desc: 'Complete 10 orders', icon: '📜' },
  fleetAdmiral: { name: 'Fleet Admiral', desc: 'Own 4 ships', icon: '⚓' }
};

const ORDERS = [
  { goods: { tea: 20 }, reward: 400, desc: 'Deliver 20 tea to London' },
  { goods: { spice: 25 }, reward: 500, desc: 'Deliver 25 spice to London' },
  { goods: { tea: 40, spice: 20 }, reward: 800, unlocks: 'amsterdam', desc: 'Deliver tea and spice' },
  { goods: { silk: 30 }, reward: 900, unlocks: 'cairo', desc: 'Deliver 30 silk' },
  { goods: { tea: 50, silk: 25 }, reward: 1200, unlocks: 'bombay', desc: 'Grand tea delivery' },
  { goods: { spice: 40, cotton: 30 }, reward: 1000, unlocks: 'ceylon', desc: 'Spice route order' },
  { goods: { porcelain: 25 }, reward: 1100, unlocks: 'singapore', desc: 'Fine porcelain delivery' },
  { goods: { tea: 80, porcelain: 30 }, reward: 2000, unlocks: 'canton', desc: 'Eastern treasures' },
  { goods: { silk: 50, opium: 30 }, reward: 2500, unlocks: 'macau', desc: 'Silk road cargo' },
  { goods: { opium: 50 }, reward: 2000, unlocks: 'zanzibar', desc: 'Controversial cargo' },
  { goods: { tea: 100, silk: 50, spice: 50 }, reward: 5000, desc: 'Crown Jubilee Order' },
  { goods: { porcelain: 60, silk: 40 }, reward: 4000, desc: 'Palace Decoration' }
];

const particles = [];
let buttons = [], audioCtx = null, lastTime = 0;
let voyageProgress = 0, voyageDest = null, voyageDuration = 0;
let selectedPort = null, menuSelection = 0, tutorialStep = 0;
let visitedPorts = new Set(['london']);
let totalTeaDelivered = 0, shake = { x: 0, y: 0, intensity: 0 };

class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = opts.vx || (Math.random() - 0.5) * 3;
    this.vy = opts.vy || (Math.random() - 0.5) * 3;
    this.life = opts.life || 1; this.maxLife = this.life;
    this.size = opts.size || 3; this.color = opts.color || COLORS.gold;
    this.gravity = opts.gravity || 0;
  }
  update(dt) { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.life -= dt; return this.life > 0; }
  draw() {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size * (this.life / this.maxLife), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function spawnBurst(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    particles.push(new Particle(x, y, { vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3 - 1, life: 0.6 + Math.random() * 0.3, size: 4, color, gravity: 0.1 }));
  }
}

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type, vol = 0.15) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime; gain.gain.setValueAtTime(vol, now);
  if (type === 'coin') { osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
  else if (type === 'buy') { osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(660, now + 0.08); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
  else if (type === 'sail') { osc.type = 'triangle'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(110, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); }
  else if (type === 'storm') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
}

function saveGame() {
  const s = window.gameState;
  localStorage.setItem('highTeaExpanded', JSON.stringify({
    gold: s.gold, year: s.year, currentPort: s.currentPort, cargo: s.cargo,
    cargoCapacity: s.cargoCapacity, reputation: s.reputation, ordersComplete: s.ordersComplete,
    totalProfit: s.totalProfit, upgrades: s.upgrades, achievements: s.achievements,
    ships: s.ships, unlockedPorts: Object.keys(PORTS).filter(p => PORTS[p].unlocked)
  }));
}
window.saveGame = saveGame;

function loadGame() {
  const data = localStorage.getItem('highTeaExpanded');
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(window.gameState, saved);
    if (saved.unlockedPorts) saved.unlockedPorts.forEach(p => PORTS[p] && (PORTS[p].unlocked = true));
    return true;
  }
  return false;
}
window.loadGame = loadGame;

function getUpgradeLevel(name) { return window.gameState.upgrades[name] || 0; }
function getUpgradeCost(name) { return Math.floor(UPGRADES[name].cost * Math.pow(1.8, getUpgradeLevel(name))); }

function applyUpgrades() {
  const s = window.gameState;
  s.cargoCapacity = 50 + s.ships.length * 50 + getUpgradeLevel('cargo') * 25;
}

function getTotalCargo() {
  return Object.values(window.gameState.cargo).reduce((a, b) => a + b, 0);
}

function unlockAchievement(id) {
  if (!window.gameState.achievements[id]) {
    window.gameState.achievements[id] = true;
    spawnBurst(WIDTH / 2, HEIGHT / 2, COLORS.goldBright, 30);
    playSound('coin');
  }
}

function checkAchievements() {
  const s = window.gameState;
  if (s.totalProfit > 0) unlockAchievement('firstTrade');
  if (s.gold >= 10000) unlockAchievement('rich');
  if (visitedPorts.size >= Object.keys(PORTS).length) unlockAchievement('explorer');
  if (totalTeaDelivered >= 500) unlockAchievement('teaMaster');
  if (s.ordersComplete >= 10) unlockAchievement('orderMaster');
  if (s.ships.length >= 4) unlockAchievement('fleetAdmiral');
}

function clearButtons() { buttons = []; }
function addButton(id, x, y, w, h, text, onClick) { buttons.push({ id, x, y, w, h, text, onClick }); }

function drawButton(btn, hovered) {
  ctx.fillStyle = hovered ? COLORS.gold : COLORS.parchmentDark;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = COLORS.sepia;
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '16px "IM Fell English", serif';
  ctx.textAlign = 'center';
  ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

let hoveredBtn = null;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  hoveredBtn = buttons.find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) || null;
  
  // Check port hover on map
  if (window.gameState.scene === 'map') {
    selectedPort = null;
    for (const [id, port] of Object.entries(PORTS)) {
      if (port.unlocked) {
        const dx = mx - port.x, dy = my - port.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) { selectedPort = id; break; }
      }
    }
  }
});

canvas.addEventListener('click', e => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  
  if (hoveredBtn && hoveredBtn.onClick) { hoveredBtn.onClick(); return; }
  
  if (window.gameState.scene === 'map' && selectedPort && selectedPort !== window.gameState.currentPort) {
    sailTo(selectedPort);
  }
});

document.addEventListener('keydown', e => {
  initAudio();
  if (window.gameState.scene === 'menu' && (e.key === 'Enter' || e.key === ' ')) startGame();
  if (e.key === 'Escape') {
    if (window.gameState.scene === 'port' || window.gameState.scene === 'shop' || window.gameState.scene === 'upgrades' || window.gameState.scene === 'achievements') {
      window.gameState.scene = 'map';
    }
  }
});

function startGame() {
  const s = window.gameState;
  s.scene = 'map'; s.gold = 1000; s.year = 1800; s.currentPort = 'london';
  s.cargo = { tea: 0, spice: 0, silk: 0, opium: 0, cotton: 0, porcelain: 0 };
  s.ordersComplete = 0; s.totalProfit = 0; s.reputation = 50;
  s.upgrades = {}; s.achievements = {};
  s.ships = [{ name: 'Starter Sloop', capacity: 50, speed: 1 }];
  
  Object.values(PORTS).forEach(p => p.unlocked = false);
  PORTS.london.unlocked = true; PORTS.lisbon.unlocked = true;
  visitedPorts = new Set(['london']);
  totalTeaDelivered = 0;
  applyUpgrades();
}

function sailTo(portId) {
  if (!PORTS[portId].unlocked || portId === window.gameState.currentPort) return;
  const from = PORTS[window.gameState.currentPort], to = PORTS[portId];
  const dist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
  const speedMult = 1 + getUpgradeLevel('speed') * 0.2;
  voyageDest = portId;
  voyageProgress = 0;
  voyageDuration = (dist / 100) / speedMult;
  window.gameState.scene = 'voyage';
  playSound('sail');
}

function arriveAtPort() {
  const s = window.gameState;
  s.currentPort = voyageDest;
  s.year += 0.25;
  visitedPorts.add(s.currentPort);
  
  // Storm chance (reduced by insurance)
  const stormChance = 0.12 - getUpgradeLevel('insurance') * 0.03;
  if (Math.random() < stormChance) {
    const lossPercent = 0.15 - getUpgradeLevel('insurance') * 0.03;
    for (const good in s.cargo) {
      const loss = Math.floor(s.cargo[good] * lossPercent);
      s.cargo[good] = Math.max(0, s.cargo[good] - loss);
    }
    shake.intensity = 15;
    playSound('storm');
  }
  
  s.scene = 'port';
  checkAchievements();
}

function trade(good, amount, buying) {
  const s = window.gameState, port = PORTS[s.currentPort];
  
  if (buying) {
    const price = port.sells && port.sells[good];
    if (!price) return;
    const cost = price * amount;
    if (s.gold < cost) return;
    if (getTotalCargo() + amount > s.cargoCapacity) return;
    s.gold -= cost;
    s.cargo[good] += amount;
    playSound('buy');
    spawnBurst(WIDTH / 2, HEIGHT / 2, GOODS[good].color);
  } else {
    const basePrice = port.buys && port.buys[good];
    if (!basePrice) return;
    if (s.cargo[good] < amount) return;
    const bonus = 1 + getUpgradeLevel('bargain') * 0.05;
    const price = Math.floor(basePrice * bonus);
    s.cargo[good] -= amount;
    const profit = price * amount;
    s.gold += profit;
    s.totalProfit += profit;
    playSound('coin');
    spawnBurst(WIDTH / 2, HEIGHT / 2, COLORS.goldBright);
  }
  
  checkOrders();
  checkAchievements();
}

function checkOrders() {
  const s = window.gameState;
  if (s.currentPort !== 'london' || s.ordersComplete >= ORDERS.length) return;
  
  const order = ORDERS[s.ordersComplete];
  let canComplete = true;
  for (const [good, amt] of Object.entries(order.goods)) {
    if ((s.cargo[good] || 0) < amt) { canComplete = false; break; }
  }
  
  if (canComplete) {
    for (const [good, amt] of Object.entries(order.goods)) {
      s.cargo[good] -= amt;
      if (good === 'tea') totalTeaDelivered += amt;
    }
    s.gold += order.reward;
    s.totalProfit += order.reward;
    s.reputation += 5;
    s.ordersComplete++;
    
    if (order.unlocks && PORTS[order.unlocks]) {
      PORTS[order.unlocks].unlocked = true;
    }
    
    spawnBurst(WIDTH / 2, 100, COLORS.goldBright, 25);
    playSound('coin');
    
    if (s.ordersComplete >= ORDERS.length) s.scene = 'victory';
    checkAchievements();
  }
}

function buyUpgrade(id) {
  const s = window.gameState, upg = UPGRADES[id];
  if (!upg || getUpgradeLevel(id) >= upg.maxLevel) return;
  const cost = getUpgradeCost(id);
  if (s.gold < cost) return;
  
  s.gold -= cost;
  s.upgrades[id] = (s.upgrades[id] || 0) + 1;
  
  if (id === 'fleet') {
    s.ships.push({ name: ['Brigantine', 'Merchantman', 'Galleon'][s.ships.length - 1] || 'Ship', capacity: 50, speed: 1 });
  }
  if (id === 'reputation') s.reputation += 10;
  
  applyUpgrades();
  playSound('coin');
  spawnBurst(WIDTH / 2, HEIGHT / 2, COLORS.gold);
  checkAchievements();
}

function update(dt) {
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }
  
  // Shake decay
  if (shake.intensity > 0) {
    shake.x = (Math.random() - 0.5) * shake.intensity;
    shake.y = (Math.random() - 0.5) * shake.intensity;
    shake.intensity *= 0.9;
    if (shake.intensity < 0.5) shake.intensity = 0;
  }
  
  // Voyage progress
  if (window.gameState.scene === 'voyage') {
    voyageProgress += dt / voyageDuration;
    if (voyageProgress >= 1) arriveAtPort();
  }
}

function drawOcean() {
  ctx.fillStyle = COLORS.oceanDeep;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Waves
  const time = Date.now() / 1000;
  ctx.strokeStyle = COLORS.oceanLight;
  ctx.lineWidth = 1;
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    for (let x = 0; x < WIDTH; x += 5) {
      const wave = Math.sin(x / 50 + time + y / 20) * 3;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawPorts() {
  for (const [id, port] of Object.entries(PORTS)) {
    const isCurrent = id === window.gameState.currentPort;
    const isHovered = id === selectedPort;
    
    if (!port.unlocked) {
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(port.x, port.y, 8, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    
    // Port circle
    ctx.fillStyle = isCurrent ? COLORS.goldBright : (isHovered ? COLORS.gold : COLORS.port);
    ctx.beginPath();
    ctx.arc(port.x, port.y, isCurrent ? 14 : 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Port name
    ctx.fillStyle = COLORS.white;
    ctx.font = '12px "IM Fell English", serif';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, port.x, port.y - 18);
  }
}

function drawHUD() {
  const s = window.gameState;
  
  // Top bar
  ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
  ctx.fillRect(0, 0, WIDTH, 50);
  
  ctx.fillStyle = COLORS.gold;
  ctx.font = '18px "Cinzel", serif';
  ctx.textAlign = 'left';
  ctx.fillText('Gold: ' + s.gold, 20, 32);
  ctx.fillText('Year: ' + Math.floor(s.year), 180, 32);
  ctx.fillText('Rep: ' + s.reputation, 320, 32);
  ctx.fillText('Cargo: ' + getTotalCargo() + '/' + s.cargoCapacity, 450, 32);
  
  // Current order
  if (s.ordersComplete < ORDERS.length) {
    const order = ORDERS[s.ordersComplete];
    ctx.textAlign = 'right';
    ctx.font = '14px "IM Fell English", serif';
    ctx.fillStyle = COLORS.parchment;
    ctx.fillText('Order: ' + order.desc, WIDTH - 20, 32);
  }
}

function drawMenu() {
  ctx.fillStyle = COLORS.oceanDeep;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Title
  ctx.fillStyle = COLORS.gold;
  ctx.font = '56px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIGH TEA', WIDTH / 2, 180);
  ctx.font = '24px "IM Fell English", serif';
  ctx.fillStyle = COLORS.parchment;
  ctx.fillText('Expanded Edition', WIDTH / 2, 220);
  
  ctx.font = '18px "IM Fell English", serif';
  ctx.fillText('Colonial Trading Simulation', WIDTH / 2, 260);
  ctx.fillText('10 Ports • 6 Goods • 12 Orders • Upgrades • Achievements', WIDTH / 2, 290);
  
  clearButtons();
  addButton('new', WIDTH / 2 - 100, 340, 200, 45, 'New Game', startGame);
  addButton('continue', WIDTH / 2 - 100, 400, 200, 45, 'Continue', () => { if (loadGame()) window.gameState.scene = 'map'; });
  addButton('help', WIDTH / 2 - 100, 460, 200, 45, 'How to Play', () => { window.gameState.scene = 'tutorial'; });
  
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
  
  ctx.fillStyle = COLORS.parchmentDark;
  ctx.font = '14px "IM Fell English", serif';
  ctx.fillText('Press SPACE or click to start', WIDTH / 2, 550);
}

function drawMap() {
  const s = window.gameState;
  drawOcean();
  drawPorts();
  drawHUD();
  
  clearButtons();
  addButton('port', 20, HEIGHT - 50, 100, 40, 'Enter Port', () => { s.scene = 'port'; });
  addButton('save', 130, HEIGHT - 50, 80, 40, 'Save', saveGame);
  addButton('menu', WIDTH - 100, HEIGHT - 50, 80, 40, 'Menu', () => { s.scene = 'menu'; });
  
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
  
  // Port info tooltip
  if (selectedPort && selectedPort !== s.currentPort) {
    const port = PORTS[selectedPort];
    ctx.fillStyle = 'rgba(44, 24, 16, 0.95)';
    ctx.fillRect(port.x + 20, port.y - 60, 180, 80);
    ctx.strokeStyle = COLORS.gold;
    ctx.strokeRect(port.x + 20, port.y - 60, 180, 80);
    
    ctx.fillStyle = COLORS.gold;
    ctx.font = '14px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(port.name, port.x + 30, port.y - 40);
    
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '11px "IM Fell English", serif';
    let yy = port.y - 22;
    if (port.sells) ctx.fillText('Sells: ' + Object.keys(port.sells).join(', '), port.x + 30, yy);
    yy += 14;
    if (port.buys) ctx.fillText('Buys: ' + Object.keys(port.buys).join(', '), port.x + 30, yy);
  }
  
  particles.forEach(p => p.draw());
}

function drawPort() {
  const s = window.gameState, port = PORTS[s.currentPort];
  
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Header
  ctx.fillStyle = COLORS.ink;
  ctx.font = '32px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Port of ' + port.name, WIDTH / 2, 50);
  
  drawHUD();
  
  clearButtons();
  let btnY = 70;
  
  // Sell section (port buys from you)
  if (port.buys) {
    ctx.fillStyle = COLORS.sepia;
    ctx.font = '20px "IM Fell English", serif';
    ctx.textAlign = 'left';
    ctx.fillText('Sell Goods:', 50, btnY + 20);
    btnY += 30;
    
    for (const [good, price] of Object.entries(port.buys)) {
      const bonus = 1 + getUpgradeLevel('bargain') * 0.05;
      const finalPrice = Math.floor(price * bonus);
      const have = s.cargo[good] || 0;
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(GOODS[good].name + ': ' + finalPrice + 'g (have ' + have + ')', 50, btnY + 25);
      addButton('sell_' + good + '_1', 280, btnY, 60, 30, 'Sell 1', () => trade(good, 1, false));
      addButton('sell_' + good + '_10', 350, btnY, 70, 30, 'Sell 10', () => trade(good, 10, false));
      addButton('sell_' + good + '_all', 430, btnY, 80, 30, 'Sell All', () => trade(good, have, false));
      btnY += 40;
    }
  }
  
  btnY += 20;
  
  // Buy section (port sells to you)
  if (port.sells) {
    ctx.fillStyle = COLORS.sepia;
    ctx.font = '20px "IM Fell English", serif';
    ctx.fillText('Buy Goods:', 50, btnY + 20);
    btnY += 30;
    
    for (const [good, price] of Object.entries(port.sells)) {
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(GOODS[good].name + ': ' + price + 'g each', 50, btnY + 25);
      addButton('buy_' + good + '_1', 280, btnY, 60, 30, 'Buy 1', () => trade(good, 1, true));
      addButton('buy_' + good + '_10', 350, btnY, 70, 30, 'Buy 10', () => trade(good, 10, true));
      btnY += 40;
    }
  }
  
  // Navigation buttons
  addButton('map', 50, HEIGHT - 60, 120, 40, 'View Map', () => { s.scene = 'map'; });
  addButton('upgrades', 190, HEIGHT - 60, 120, 40, 'Upgrades', () => { s.scene = 'upgrades'; });
  addButton('achievements', 330, HEIGHT - 60, 140, 40, 'Achievements', () => { s.scene = 'achievements'; });
  
  // Cargo display
  ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
  ctx.fillRect(WIDTH - 220, 70, 200, 200);
  ctx.strokeStyle = COLORS.gold;
  ctx.strokeRect(WIDTH - 220, 70, 200, 200);
  
  ctx.fillStyle = COLORS.gold;
  ctx.font = '16px "Cinzel", serif';
  ctx.textAlign = 'left';
  ctx.fillText('Cargo Hold:', WIDTH - 210, 95);
  
  let cy = 115;
  ctx.font = '14px "IM Fell English", serif';
  for (const [good, amt] of Object.entries(s.cargo)) {
    if (amt > 0) {
      ctx.fillStyle = GOODS[good].color;
      ctx.fillRect(WIDTH - 210, cy - 10, 12, 12);
      ctx.fillStyle = COLORS.parchment;
      ctx.fillText(GOODS[good].name + ': ' + amt, WIDTH - 190, cy);
      cy += 20;
    }
  }
  
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
  particles.forEach(p => p.draw());
}

function drawUpgrades() {
  const s = window.gameState;
  
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.ink;
  ctx.font = '32px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Upgrades', WIDTH / 2, 50);
  
  ctx.fillStyle = COLORS.gold;
  ctx.font = '18px "IM Fell English", serif';
  ctx.fillText('Gold: ' + s.gold, WIDTH / 2, 80);
  
  clearButtons();
  let y = 120;
  
  for (const [id, upg] of Object.entries(UPGRADES)) {
    const level = getUpgradeLevel(id);
    const cost = getUpgradeCost(id);
    const maxed = level >= upg.maxLevel;
    
    ctx.fillStyle = COLORS.sepia;
    ctx.font = '18px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(upg.name + ' (Lv ' + level + '/' + upg.maxLevel + ')', 100, y + 20);
    
    ctx.fillStyle = COLORS.ink;
    ctx.font = '14px "IM Fell English", serif';
    ctx.fillText(upg.desc, 100, y + 40);
    
    if (!maxed) {
      addButton('upg_' + id, 500, y, 120, 40, 'Buy: ' + cost + 'g', () => buyUpgrade(id));
    } else {
      ctx.fillStyle = COLORS.green;
      ctx.fillText('MAXED', 540, y + 25);
    }
    
    y += 70;
  }
  
  addButton('back', WIDTH / 2 - 60, HEIGHT - 60, 120, 40, 'Back', () => { s.scene = 'port'; });
  
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
}

function drawAchievements() {
  const s = window.gameState;
  
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.ink;
  ctx.font = '32px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Achievements', WIDTH / 2, 50);
  
  clearButtons();
  let x = 80, y = 100;
  
  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    const unlocked = s.achievements[id];
    
    ctx.fillStyle = unlocked ? 'rgba(212, 175, 55, 0.3)' : 'rgba(100, 100, 100, 0.2)';
    ctx.fillRect(x, y, 280, 80);
    ctx.strokeStyle = unlocked ? COLORS.gold : '#666';
    ctx.strokeRect(x, y, 280, 80);
    
    ctx.font = '32px serif';
    ctx.fillStyle = unlocked ? COLORS.ink : '#999';
    ctx.textAlign = 'center';
    ctx.fillText(ach.icon, x + 40, y + 52);
    
    ctx.font = '16px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(ach.name, x + 80, y + 35);
    
    ctx.font = '12px "IM Fell English", serif';
    ctx.fillText(ach.desc, x + 80, y + 55);
    
    x += 300;
    if (x > WIDTH - 300) { x = 80; y += 100; }
  }
  
  addButton('back', WIDTH / 2 - 60, HEIGHT - 60, 120, 40, 'Back', () => { s.scene = 'port'; });
  
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
}

function drawVoyage() {
  drawOcean();
  
  const s = window.gameState;
  const from = PORTS[s.currentPort], to = PORTS[voyageDest];
  
  // Route line
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Ship position
  const shipX = from.x + (to.x - from.x) * voyageProgress;
  const shipY = from.y + (to.y - from.y) * voyageProgress;
  
  ctx.fillStyle = COLORS.sail;
  ctx.beginPath();
  ctx.moveTo(shipX, shipY - 15);
  ctx.lineTo(shipX + 10, shipY + 10);
  ctx.lineTo(shipX - 10, shipY + 10);
  ctx.closePath();
  ctx.fill();
  
  // Progress bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(WIDTH / 2 - 150, HEIGHT - 80, 300, 30);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(WIDTH / 2 - 148, HEIGHT - 78, 296 * voyageProgress, 26);
  
  ctx.fillStyle = COLORS.white;
  ctx.font = '16px "IM Fell English", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sailing to ' + to.name + '...', WIDTH / 2, HEIGHT - 100);
  
  drawPorts();
  particles.forEach(p => p.draw());
}

function drawVictory() {
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.gold;
  ctx.font = '48px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH / 2, 150);
  
  ctx.fillStyle = COLORS.ink;
  ctx.font = '24px "IM Fell English", serif';
  ctx.fillText('You have completed all Royal Orders!', WIDTH / 2, 220);
  ctx.fillText('The Crown thanks you for your service.', WIDTH / 2, 260);
  
  const s = window.gameState;
  ctx.font = '18px "IM Fell English", serif';
  ctx.fillText('Final Gold: ' + s.gold, WIDTH / 2, 320);
  ctx.fillText('Total Profit: ' + s.totalProfit, WIDTH / 2, 350);
  ctx.fillText('Reputation: ' + s.reputation, WIDTH / 2, 380);
  ctx.fillText('Ships: ' + s.ships.length, WIDTH / 2, 410);
  
  clearButtons();
  addButton('menu', WIDTH / 2 - 80, 480, 160, 45, 'Main Menu', () => { window.gameState.scene = 'menu'; });
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
  
  particles.forEach(p => p.draw());
}

function drawTutorial() {
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.ink;
  ctx.font = '32px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('How to Play', WIDTH / 2, 50);
  
  ctx.font = '16px "IM Fell English", serif';
  ctx.textAlign = 'left';
  const lines = [
    '1. Start in London with 1000 gold and a small cargo hold.',
    '2. Click on ports on the map to sail there and trade goods.',
    '3. Buy low in Eastern ports, sell high in Europe!',
    '4. Complete Royal Orders in London to unlock new ports and earn rewards.',
    '5. Purchase upgrades to increase cargo, speed, and profits.',
    '6. Build your fleet and reputation to become a trading magnate!',
    '',
    'GOODS:',
    '• Tea & Spice - Best bought in Ceylon/Canton, sold in London',
    '• Silk & Porcelain - Valuable luxury goods from the East',
    '• Cotton - Cheap in Europe, valuable in Asia',
    '• Opium - Controversial but profitable (Bombay → Canton)',
    '',
    'TIPS:',
    '• Watch for storms - they can destroy cargo!',
    '• Upgrade Insurance to reduce storm losses',
    '• Reputation affects nothing yet but feels good'
  ];
  
  let y = 100;
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 28;
  }
  
  clearButtons();
  addButton('back', WIDTH / 2 - 60, HEIGHT - 60, 120, 40, 'Back', () => { window.gameState.scene = 'menu'; });
  buttons.forEach(b => drawButton(b, hoveredBtn === b));
}

function render() {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const scene = window.gameState.scene;
  if (scene === 'menu') drawMenu();
  else if (scene === 'map') drawMap();
  else if (scene === 'port') drawPort();
  else if (scene === 'voyage') drawVoyage();
  else if (scene === 'upgrades') drawUpgrades();
  else if (scene === 'achievements') drawAchievements();
  else if (scene === 'victory') drawVictory();
  else if (scene === 'tutorial') drawTutorial();
  
  ctx.restore();
}

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  
  update(dt);
  render();
  
  requestAnimationFrame(gameLoop);
}

// Expose for testing
window.PORTS = PORTS;
window.GOODS = GOODS;
window.UPGRADES = UPGRADES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.ORDERS = ORDERS;
window.particles = particles;

requestAnimationFrame(gameLoop);
