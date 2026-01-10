// High Tea - Expanded Edition
// Trading simulation with progression, upgrades, and more content

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 640;

// Colors
const COLORS = {
  parchment: '#f4e4bc', ink: '#2c1810', sepia: '#704214',
  gold: '#d4af37', goldBright: '#ffd700', ocean: '#1a4066',
  oceanDeep: '#0a2840', wood: '#8b4513', white: '#faf8f0',
  red: '#8b0000', green: '#228b22'
};

// Audio
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) {
  if (!audioCtx || !game.settings.soundOn) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  if (type === 'coin') { osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(400, t + 0.1); }
  else { osc.frequency.setValueAtTime(300, t); }
  gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  osc.start(t); osc.stop(t + 0.2);
}

// Particles
const particles = [];
class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = opts.vx || (Math.random() - 0.5) * 2;
    this.vy = opts.vy || (Math.random() - 0.5) * 2;
    this.life = this.maxLife = opts.life || 1;
    this.color = opts.color || COLORS.gold;
  }
  update(dt) { this.x += this.vx; this.y += this.vy; this.life -= dt; return this.life > 0; }
  draw() {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}
function spawnCoins(x, y) { for (let i = 0; i < 12; i++) particles.push(new Particle(x, y, { vx: Math.cos(i) * 3, vy: Math.sin(i) * 3, color: COLORS.goldBright })); }

// Save/Load
const SAVE_KEY = 'high_tea_expanded_save';
function saveGame() {
  const data = { stats: game.stats, unlocks: game.unlocks, settings: game.settings };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
}
function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) { game.stats = data.stats || game.stats; game.unlocks = data.unlocks || game.unlocks; game.settings = data.settings || game.settings; }
  } catch (e) {}
}

// Game State
const game = {
  state: 'menu', gold: 500, goods: 50, tea: 0, spice: 0, silk: 0, opium: 0, porcelain: 0,
  year: 1820, currentPort: 'london', ordersComplete: 0, voyageProgress: 0, voyageDestination: null,
  message: '', messageTimer: 0, time: 0, hoveredButton: null, voyageDuration: 0,
  shipLevel: 1, cargoCapacity: 100, shipSpeed: 1, reputation: 0,
  stats: { gamesPlayed: 0, ordersCompleted: 0, goldEarned: 0, voyagesTaken: 0, victories: 0 },
  unlocks: { bombay: false, ceylon: false, shanghai: false, batavia: false, macau: false },
  settings: { soundOn: true, musicOn: true },
  achievements: []
};

// Ports (8 ports)
const PORTS = {
  london: { name: 'London', x: 450, y: 160, buys: { tea: 28, spice: 20, silk: 40, porcelain: 35 }, sells: { goods: 8 }, unlocked: true, desc: 'Capital of the Empire' },
  lisbon: { name: 'Lisbon', x: 350, y: 250, buys: { tea: 24, spice: 22, silk: 32 }, sells: { goods: 10 }, unlocked: true, desc: 'Gateway to Atlantic' },
  canton: { name: 'Canton', x: 780, y: 320, buys: { goods: 15, opium: 50 }, sells: { tea: 6, silk: 10, porcelain: 8 }, unlocked: true, desc: 'Heart of Tea Trade' },
  bombay: { name: 'Bombay', x: 620, y: 340, buys: { goods: 12, silk: 28 }, sells: { spice: 4, opium: 15 }, unlocked: false, desc: 'Jewel of India' },
  ceylon: { name: 'Ceylon', x: 640, y: 390, buys: { goods: 14 }, sells: { tea: 5, spice: 3 }, unlocked: false, desc: 'Island of Spices' },
  shanghai: { name: 'Shanghai', x: 800, y: 260, buys: { goods: 18 }, sells: { silk: 8, porcelain: 6, tea: 7 }, unlocked: false, desc: 'Rising Trade Hub' },
  batavia: { name: 'Batavia', x: 740, y: 420, buys: { goods: 16, tea: 20 }, sells: { spice: 2, porcelain: 12 }, unlocked: false, desc: 'Dutch East Indies' },
  macau: { name: 'Macau', x: 770, y: 350, buys: { opium: 45, goods: 14 }, sells: { porcelain: 5, silk: 9 }, unlocked: false, desc: 'Portuguese Outpost' }
};

// Orders (10 orders)
const ORDERS = [
  { tea: 20, reward: 400, desc: 'Deliver 20 tea' },
  { spice: 15, reward: 350, desc: 'Deliver 15 spice' },
  { tea: 40, reward: 700, desc: 'Deliver 40 tea', unlocks: 'bombay' },
  { silk: 30, reward: 800, desc: 'Deliver 30 silk', unlocks: 'ceylon' },
  { tea: 50, spice: 25, reward: 1200, desc: 'Tea & spice shipment', unlocks: 'shanghai' },
  { porcelain: 40, reward: 1000, desc: 'Deliver 40 porcelain', unlocks: 'batavia' },
  { silk: 50, tea: 30, reward: 1500, desc: 'Luxury goods', unlocks: 'macau' },
  { tea: 80, spice: 40, reward: 2000, desc: 'Large tea & spice order' },
  { silk: 60, porcelain: 50, reward: 2500, desc: 'Fine goods order' },
  { tea: 100, silk: 50, spice: 50, porcelain: 30, reward: 5000, desc: 'Grand Royal Order' }
];

// Ship upgrades
const SHIP_UPGRADES = [
  { name: 'Cargo Hold', cost: 2000, bonus: 'cargo', value: 50 },
  { name: 'Better Sails', cost: 3000, bonus: 'speed', value: 0.2 },
  { name: 'Reinforced Hull', cost: 4000, bonus: 'safety', value: 0.1 },
  { name: 'Trade License', cost: 5000, bonus: 'price', value: 0.05 }
];

// Buttons
const buttons = [];
function addButton(id, x, y, w, h, text, onClick) { buttons.push({ id, x, y, w, h, text, onClick }); }
function clearButtons() { buttons.length = 0; }
function checkButtonHover(mx, my) {
  game.hoveredButton = null;
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      game.hoveredButton = btn.id; return btn;
    }
  }
  return null;
}

// Input
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  checkButtonHover((e.clientX - rect.left) * (WIDTH / rect.width), (e.clientY - rect.top) * (HEIGHT / rect.height));
});
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const btn = checkButtonHover((e.clientX - rect.left) * (WIDTH / rect.width), (e.clientY - rect.top) * (HEIGHT / rect.height));
  if (btn && btn.onClick) btn.onClick();
});
document.addEventListener('keydown', e => {
  if (game.state === 'menu' && (e.key === 'Enter' || e.key === ' ')) startGame();
  if (game.state === 'tutorial' || game.state === 'settings') { if (e.key === 'Escape') { game.state = 'menu'; saveGame(); } }
  if (game.state === 'settings') {
    if (e.key === '1') game.settings.soundOn = !game.settings.soundOn;
    if (e.key === '2') game.settings.musicOn = !game.settings.musicOn;
  }
});

function startGame() {
  initAudio();
  game.state = 'map'; game.gold = 500; game.goods = 50;
  game.tea = game.spice = game.silk = game.opium = game.porcelain = 0;
  game.year = 1820; game.currentPort = 'london'; game.ordersComplete = 0;
  game.shipLevel = 1; game.cargoCapacity = 100; game.shipSpeed = 1; game.reputation = 0;
  game.stats.gamesPlayed++;
  Object.keys(PORTS).forEach(k => PORTS[k].unlocked = k === 'london' || k === 'lisbon' || k === 'canton');
  setMessage('Welcome, Captain! Visit ports to trade.');
}

function setMessage(msg) { game.message = msg; game.messageTimer = 3; }

function sailTo(portId) {
  if (portId === game.currentPort || !PORTS[portId].unlocked) return;
  game.voyageDestination = portId; game.voyageProgress = 0; game.state = 'voyage';
  const from = PORTS[game.currentPort], to = PORTS[portId];
  game.voyageDuration = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2) / (100 * game.shipSpeed);
  game.stats.voyagesTaken++;
}

function arriveAtPort() {
  game.currentPort = game.voyageDestination; game.year += 0.3; game.state = 'port';
  if (Math.random() < 0.12) {
    const loss = Math.floor(game.goods * 0.15);
    game.goods = Math.max(0, game.goods - loss);
    setMessage(`Storm! Lost ${loss} goods.`);
  } else setMessage(`Arrived at ${PORTS[game.currentPort].name}`);
  playSound('arrive');
}

function trade(item, amount, buying) {
  const port = PORTS[game.currentPort];
  if (buying) {
    const price = port.sells[item]; if (!price) return;
    const cost = price * amount;
    if (game.gold < cost) { setMessage('Not enough gold!'); return; }
    const total = game.tea + game.spice + game.silk + game.opium + game.porcelain + game.goods;
    if (total + amount > game.cargoCapacity) { setMessage('Cargo full!'); return; }
    game.gold -= cost; game[item] += amount;
    spawnCoins(WIDTH / 2, HEIGHT / 2); playSound('coin');
    setMessage(`Bought ${amount} ${item}`);
  } else {
    const price = port.buys[item]; if (!price) return;
    if (game[item] < amount) { setMessage(`Not enough ${item}!`); return; }
    game[item] -= amount;
    const earned = Math.floor(price * amount * (1 + game.reputation * 0.01));
    game.gold += earned; game.stats.goldEarned += earned;
    spawnCoins(WIDTH / 2, HEIGHT / 2); playSound('coin');
    setMessage(`Sold ${amount} ${item} for ${earned}g`);
  }
  checkOrders();
}

function checkOrders() {
  if (game.currentPort !== 'london' || game.ordersComplete >= ORDERS.length) return;
  const order = ORDERS[game.ordersComplete];
  let canComplete = true;
  if (order.tea && game.tea < order.tea) canComplete = false;
  if (order.spice && game.spice < order.spice) canComplete = false;
  if (order.silk && game.silk < order.silk) canComplete = false;
  if (order.porcelain && game.porcelain < order.porcelain) canComplete = false;
  if (!canComplete) return;

  if (order.tea) game.tea -= order.tea;
  if (order.spice) game.spice -= order.spice;
  if (order.silk) game.silk -= order.silk;
  if (order.porcelain) game.porcelain -= order.porcelain;

  game.gold += order.reward; game.ordersComplete++; game.reputation += 5; game.stats.ordersCompleted++;
  if (order.unlocks) { PORTS[order.unlocks].unlocked = true; game.unlocks[order.unlocks] = true; setMessage(`Order complete! ${PORTS[order.unlocks].name} unlocked!`); }
  else setMessage(`Order complete! +${order.reward} gold`);
  spawnCoins(WIDTH / 2, 100); playSound('coin');
  if (game.ordersComplete >= ORDERS.length) { game.state = 'victory'; game.stats.victories++; saveGame(); }
}

function buyUpgrade(idx) {
  const up = SHIP_UPGRADES[idx];
  if (game.gold < up.cost) { setMessage('Not enough gold!'); return; }
  game.gold -= up.cost; game.shipLevel++;
  if (up.bonus === 'cargo') game.cargoCapacity += up.value;
  if (up.bonus === 'speed') game.shipSpeed += up.value;
  setMessage(`Upgraded: ${up.name}`); playSound('coin');
}

function update(dt) {
  game.time += dt;
  for (let i = particles.length - 1; i >= 0; i--) if (!particles[i].update(dt)) particles.splice(i, 1);
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.state === 'voyage') { game.voyageProgress += dt / game.voyageDuration; if (game.voyageProgress >= 1) arriveAtPort(); }
  if (game.year >= 1860 && game.state !== 'victory' && game.state !== 'gameover') game.state = 'gameover';
}

// Drawing
function drawBg(type) {
  if (type === 'parchment') {
    const g = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, 500);
    g.addColorStop(0, COLORS.parchment); g.addColorStop(1, '#d4c49c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    g.addColorStop(0, COLORS.oceanDeep); g.addColorStop(1, COLORS.ocean);
    ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
    for (let y = 50; y < HEIGHT; y += 40) {
      ctx.beginPath();
      for (let x = 0; x <= WIDTH; x += 10) { const w = Math.sin((x + game.time * 50) * 0.02) * 5; x === 0 ? ctx.moveTo(x, y + w) : ctx.lineTo(x, y + w); }
      ctx.stroke();
    }
  }
}

function drawButton(btn) {
  const h = game.hoveredButton === btn.id;
  ctx.fillStyle = h ? COLORS.goldBright : COLORS.wood;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2; ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = COLORS.white; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5); ctx.textAlign = 'left';
}

function drawMenu() {
  drawBg('parchment'); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.sepia; ctx.font = 'bold 56px Georgia'; ctx.fillText('HIGH TEA', WIDTH / 2, 160);
  ctx.font = '24px Georgia'; ctx.fillText('EXPANDED EDITION', WIDTH / 2, 200);
  ctx.fillStyle = COLORS.ink; ctx.font = '16px Georgia';
  ctx.fillText('8 ports • 10 orders • Ship upgrades • More goods', WIDTH / 2, 280);
  ctx.fillStyle = COLORS.gold; ctx.globalAlpha = Math.sin(game.time * 3) * 0.3 + 0.7;
  ctx.font = 'bold 20px Georgia'; ctx.fillText('Press ENTER to Start', WIDTH / 2, 380); ctx.globalAlpha = 1;
  ctx.fillStyle = '#888'; ctx.font = '14px Georgia';
  ctx.fillText('[T] Tutorial • [S] Settings', WIDTH / 2, 450);
  ctx.fillText(`Victories: ${game.stats.victories} | Orders: ${game.stats.ordersCompleted}`, WIDTH / 2, 480);
  ctx.textAlign = 'left';
  clearButtons();
  addButton('tutorial', WIDTH / 2 - 150, 500, 120, 35, 'Tutorial', () => game.state = 'tutorial');
  addButton('settings', WIDTH / 2 + 30, 500, 120, 35, 'Settings', () => game.state = 'settings');
  buttons.forEach(drawButton);
}

function drawTutorial() {
  drawBg('parchment'); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.sepia; ctx.font = 'bold 32px Georgia'; ctx.fillText('HOW TO PLAY', WIDTH / 2, 60);
  ctx.fillStyle = COLORS.ink; ctx.font = '14px Georgia';
  const lines = ['Buy goods cheap, sell high!', 'Complete Royal Orders in London for rewards', 'Orders unlock new ports',
    'Upgrade your ship for better trading', 'Watch your cargo capacity', 'Reach 1860 to lose - hurry!', '',
    'GOODS: tea, spice, silk, porcelain, opium', 'PORTS: London, Lisbon, Canton + 5 more', '', 'Press ESC to return'];
  lines.forEach((l, i) => ctx.fillText(l, WIDTH / 2, 100 + i * 28));
  ctx.textAlign = 'left';
}

function drawSettings() {
  drawBg('parchment'); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.sepia; ctx.font = 'bold 32px Georgia'; ctx.fillText('SETTINGS', WIDTH / 2, 150);
  ctx.fillStyle = COLORS.ink; ctx.font = '18px Georgia';
  ctx.fillText(`[1] Sound: ${game.settings.soundOn ? 'ON' : 'OFF'}`, WIDTH / 2, 250);
  ctx.fillText(`[2] Music: ${game.settings.musicOn ? 'ON' : 'OFF'}`, WIDTH / 2, 290);
  ctx.fillText('Press ESC to return', WIDTH / 2, 400);
  ctx.textAlign = 'left';
}

function drawMap() {
  drawBg('ocean'); clearButtons();
  for (const [id, p] of Object.entries(PORTS)) {
    ctx.beginPath(); ctx.arc(p.x, p.y, id === game.currentPort ? 16 : 10, 0, Math.PI * 2);
    ctx.fillStyle = !p.unlocked ? '#444' : id === game.currentPort ? COLORS.goldBright : COLORS.gold;
    if (id === game.currentPort) { ctx.shadowBlur = 15; ctx.shadowColor = COLORS.gold; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = p.unlocked ? COLORS.white : '#666'; ctx.font = '12px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(p.name, p.x, p.y - 22); ctx.textAlign = 'left';
    if (p.unlocked && id !== game.currentPort) addButton(id, p.x - 18, p.y - 18, 36, 36, '', () => sailTo(id));
  }
  // UI
  ctx.fillStyle = 'rgba(44,24,16,0.9)'; ctx.fillRect(20, 20, 180, 200);
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 180, 200);
  ctx.fillStyle = COLORS.gold; ctx.font = 'bold 16px Georgia'; ctx.fillText('Inventory', 40, 45);
  ctx.fillStyle = COLORS.parchment; ctx.font = '13px Georgia';
  ctx.fillText(`Gold: ${game.gold}`, 40, 70); ctx.fillText(`Goods: ${game.goods}`, 40, 88);
  ctx.fillText(`Tea: ${game.tea}`, 40, 106); ctx.fillText(`Spice: ${game.spice}`, 40, 124);
  ctx.fillText(`Silk: ${game.silk}`, 40, 142); ctx.fillText(`Porcelain: ${game.porcelain}`, 40, 160);
  ctx.fillText(`Opium: ${game.opium}`, 40, 178); ctx.fillText(`Year: ${game.year.toFixed(1)}`, 40, 198);
  // Order
  if (game.ordersComplete < ORDERS.length) {
    const o = ORDERS[game.ordersComplete];
    ctx.fillStyle = 'rgba(44,24,16,0.9)'; ctx.fillRect(WIDTH - 250, 20, 230, 70);
    ctx.strokeStyle = COLORS.gold; ctx.strokeRect(WIDTH - 250, 20, 230, 70);
    ctx.fillStyle = COLORS.gold; ctx.font = 'bold 12px Georgia'; ctx.fillText('Royal Order:', WIDTH - 235, 42);
    ctx.fillStyle = COLORS.parchment; ctx.font = '11px Georgia';
    ctx.fillText(o.desc, WIDTH - 235, 60); ctx.fillText(`Reward: ${o.reward}g`, WIDTH - 235, 78);
  }
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(44,24,16,0.9)'; ctx.fillRect(WIDTH / 2 - 180, HEIGHT - 55, 360, 35);
    ctx.strokeStyle = COLORS.gold; ctx.strokeRect(WIDTH / 2 - 180, HEIGHT - 55, 360, 35);
    ctx.fillStyle = COLORS.parchment; ctx.font = '14px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(game.message, WIDTH / 2, HEIGHT - 32); ctx.textAlign = 'left';
  }
  addButton('trade', WIDTH / 2 - 50, HEIGHT - 100, 100, 35, 'TRADE', () => game.state = 'port');
  buttons.filter(b => b.text).forEach(drawButton);
}

function drawPort() {
  drawBg('parchment'); const p = PORTS[game.currentPort]; clearButtons();
  ctx.fillStyle = COLORS.sepia; ctx.font = 'bold 28px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(p.name, WIDTH / 2, 50); ctx.font = '14px Georgia'; ctx.fillStyle = COLORS.ink;
  ctx.fillText(p.desc, WIDTH / 2, 75); ctx.textAlign = 'left';
  // Inventory
  ctx.fillStyle = 'rgba(92,51,23,0.2)'; ctx.fillRect(30, 100, 160, 160);
  ctx.strokeStyle = COLORS.wood; ctx.lineWidth = 2; ctx.strokeRect(30, 100, 160, 160);
  ctx.fillStyle = COLORS.sepia; ctx.font = 'bold 14px Georgia'; ctx.fillText('Your Hold', 50, 125);
  ctx.fillStyle = COLORS.ink; ctx.font = '12px Georgia';
  const cargo = game.tea + game.spice + game.silk + game.opium + game.porcelain + game.goods;
  ctx.fillText(`Cargo: ${cargo}/${game.cargoCapacity}`, 50, 145);
  ctx.fillText(`Gold: ${game.gold}`, 50, 165); ctx.fillText(`Goods: ${game.goods}`, 50, 183);
  ctx.fillText(`Tea: ${game.tea}`, 50, 201); ctx.fillText(`Spice: ${game.spice}`, 50, 219);
  ctx.fillText(`Silk: ${game.silk}`, 50, 237);
  // Buy
  ctx.fillStyle = 'rgba(34,139,34,0.2)'; ctx.fillRect(220, 100, 200, 180);
  ctx.strokeStyle = COLORS.green; ctx.strokeRect(220, 100, 200, 180);
  ctx.fillStyle = COLORS.green; ctx.font = 'bold 14px Georgia'; ctx.fillText('BUY', 290, 125);
  let by = 145;
  for (const [item, price] of Object.entries(p.sells || {})) {
    ctx.fillStyle = COLORS.ink; ctx.font = '12px Georgia'; ctx.fillText(`${item}: ${price}g`, 240, by);
    addButton(`buy_${item}`, 350, by - 12, 50, 22, 'Buy 10', () => trade(item, 10, true)); by += 28;
  }
  // Sell
  ctx.fillStyle = 'rgba(139,0,0,0.2)'; ctx.fillRect(450, 100, 200, 180);
  ctx.strokeStyle = COLORS.red; ctx.strokeRect(450, 100, 200, 180);
  ctx.fillStyle = COLORS.red; ctx.font = 'bold 14px Georgia'; ctx.fillText('SELL', 520, 125);
  let sy = 145;
  for (const [item, price] of Object.entries(p.buys || {})) {
    ctx.fillStyle = COLORS.ink; ctx.font = '12px Georgia'; ctx.fillText(`${item}: ${price}g`, 470, sy);
    addButton(`sell_${item}`, 580, sy - 12, 50, 22, 'Sell 10', () => trade(item, 10, false)); sy += 28;
  }
  // Ship upgrades
  ctx.fillStyle = 'rgba(92,51,23,0.2)'; ctx.fillRect(680, 100, 320, 180);
  ctx.strokeStyle = COLORS.gold; ctx.strokeRect(680, 100, 320, 180);
  ctx.fillStyle = COLORS.gold; ctx.font = 'bold 14px Georgia'; ctx.fillText('Ship Upgrades', 700, 125);
  SHIP_UPGRADES.forEach((u, i) => {
    ctx.fillStyle = COLORS.ink; ctx.font = '11px Georgia';
    ctx.fillText(`${u.name}: ${u.cost}g`, 700, 150 + i * 35);
    addButton(`up_${i}`, 880, 138 + i * 35, 50, 22, 'Buy', () => buyUpgrade(i));
  });
  addButton('map', WIDTH / 2 - 70, HEIGHT - 80, 140, 35, 'Back to Map', () => game.state = 'map');
  buttons.forEach(drawButton);
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(44,24,16,0.9)'; ctx.fillRect(WIDTH / 2 - 180, HEIGHT - 130, 360, 35);
    ctx.fillStyle = COLORS.parchment; ctx.font = '14px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(game.message, WIDTH / 2, HEIGHT - 107); ctx.textAlign = 'left';
  }
}

function drawVoyage() {
  drawBg('ocean');
  const sx = 100 + game.voyageProgress * (WIDTH - 200), sy = HEIGHT / 2 + Math.sin(game.time * 3) * 10;
  ctx.fillStyle = COLORS.wood; ctx.beginPath();
  ctx.moveTo(sx + 30, sy); ctx.lineTo(sx + 20, sy + 12); ctx.lineTo(sx - 20, sy + 12);
  ctx.lineTo(sx - 30, sy); ctx.lineTo(sx - 20, sy - 5); ctx.lineTo(sx + 20, sy - 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d2817'; ctx.fillRect(sx - 2, sy - 45, 4, 40);
  ctx.fillStyle = '#f5f5dc'; ctx.beginPath(); ctx.moveTo(sx, sy - 42);
  ctx.quadraticCurveTo(sx + 22, sy - 28, sx, sy - 8); ctx.quadraticCurveTo(sx - 15, sy - 28, sx, sy - 42); ctx.fill();
  ctx.fillStyle = COLORS.white; ctx.font = 'bold 22px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(`Sailing to ${PORTS[game.voyageDestination].name}...`, WIDTH / 2, 80);
  ctx.font = '16px Georgia'; ctx.fillText(`${Math.floor(game.voyageProgress * 100)}%`, WIDTH / 2, 110); ctx.textAlign = 'left';
}

function drawVictory() {
  drawBg('parchment'); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold; ctx.font = 'bold 42px Georgia'; ctx.shadowBlur = 20; ctx.shadowColor = COLORS.gold;
  ctx.fillText('VICTORY!', WIDTH / 2, 180); ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.sepia; ctx.font = '22px Georgia';
  ctx.fillText('All Royal Orders Complete!', WIDTH / 2, 240);
  ctx.fillText(`Final Gold: ${game.gold}`, WIDTH / 2, 300);
  ctx.fillText(`Year: ${game.year.toFixed(1)}`, WIDTH / 2, 330);
  ctx.textAlign = 'left'; clearButtons();
  addButton('restart', WIDTH / 2 - 70, 420, 140, 40, 'Play Again', startGame); drawButton(buttons[0]);
}

function drawGameOver() {
  drawBg('parchment'); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.red; ctx.font = 'bold 42px Georgia'; ctx.fillText('TIME EXPIRED', WIDTH / 2, 180);
  ctx.fillStyle = COLORS.sepia; ctx.font = '20px Georgia';
  ctx.fillText('The year is 1860. Your time has passed.', WIDTH / 2, 240);
  ctx.fillText(`Orders Completed: ${game.ordersComplete}/${ORDERS.length}`, WIDTH / 2, 300);
  ctx.textAlign = 'left'; clearButtons();
  addButton('restart', WIDTH / 2 - 70, 420, 140, 40, 'Try Again', startGame); drawButton(buttons[0]);
}

// Main loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); lastTime = timestamp;
  update(dt);
  if (game.state === 'menu') drawMenu();
  else if (game.state === 'tutorial') drawTutorial();
  else if (game.state === 'settings') drawSettings();
  else if (game.state === 'map') drawMap();
  else if (game.state === 'port') drawPort();
  else if (game.state === 'voyage') drawVoyage();
  else if (game.state === 'victory') drawVictory();
  else if (game.state === 'gameover') drawGameOver();
  particles.forEach(p => p.draw());
  requestAnimationFrame(gameLoop);
}

// Expose for testing
window.game = {
  get state() { return game.state; }, get gold() { return game.gold; },
  get tea() { return game.tea; }, get spice() { return game.spice; },
  get silk() { return game.silk; }, get currentPort() { return game.currentPort; },
  get ordersComplete() { return game.ordersComplete; }, get stats() { return game.stats; },
  ports: Object.keys(PORTS), orders: ORDERS, goodsTypes: ['tea', 'spice', 'silk', 'porcelain', 'opium', 'goods'],
  saveGame, loadSave
};

loadSave();
requestAnimationFrame(gameLoop);
