// High Tea - Polished Edition
// Trading Simulation in the Age of Sail

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 640;

// Color Palette - Colonial Era
const COLORS = {
  parchment: '#f4e4bc',
  parchmentDark: '#d4c49c',
  ink: '#2c1810',
  sepia: '#704214',
  gold: '#d4af37',
  goldBright: '#ffd700',
  ocean: '#1a4066',
  oceanDeep: '#0a2840',
  oceanLight: '#2d6a9f',
  land: '#8b7355',
  landDark: '#5c4a32',
  port: '#c9a227',
  wood: '#8b4513',
  sail: '#f5f5dc',
  tea: '#3d2817',
  teaLight: '#654321',
  red: '#8b0000',
  green: '#228b22',
  white: '#faf8f0'
};

// Particle system
const particles = [];

class Particle {
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = opts.vx || (Math.random() - 0.5) * 2;
    this.vy = opts.vy || (Math.random() - 0.5) * 2;
    this.life = opts.life || 1;
    this.maxLife = this.life;
    this.size = opts.size || 3;
    this.color = opts.color || COLORS.gold;
    this.gravity = opts.gravity || 0;
  }

  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnCoinBurst(x, y) {
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 * i) / 15;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3 - 2,
      life: 0.8 + Math.random() * 0.4,
      size: 4,
      color: COLORS.goldBright,
      gravity: 0.1
    }));
  }
}

function spawnSmoke(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
      life: 1 + Math.random() * 0.5,
      size: 6 + Math.random() * 4,
      color: '#666'
    }));
  }
}

// Game state
const game = {
  state: 'title',
  gold: 500,
  goods: 50,
  tea: 0,
  spice: 0,
  silk: 0,
  year: 1820,
  currentPort: 'london',
  ordersComplete: 0,
  voyageProgress: 0,
  voyageDestination: null,
  message: '',
  messageTimer: 0,
  time: 0,
  hoveredButton: null
};

// Port definitions
const PORTS = {
  london: {
    name: 'London',
    x: 480, y: 180,
    buys: { tea: 25, spice: 18, silk: 35 },
    sells: { goods: 8 },
    unlocked: true,
    description: 'Capital of the Empire'
  },
  lisbon: {
    name: 'Lisbon',
    x: 380, y: 280,
    buys: { tea: 22, spice: 20, silk: 30 },
    sells: { goods: 10 },
    unlocked: true,
    description: 'Gateway to the Atlantic'
  },
  canton: {
    name: 'Canton',
    x: 780, y: 320,
    buys: { goods: 15 },
    sells: { tea: 8, silk: 12 },
    unlocked: false,
    description: 'Heart of the Tea Trade'
  },
  bombay: {
    name: 'Bombay',
    x: 650, y: 340,
    buys: { goods: 12 },
    sells: { spice: 5, silk: 18 },
    unlocked: false,
    description: 'Jewel of India'
  },
  ceylon: {
    name: 'Ceylon',
    x: 680, y: 380,
    buys: { goods: 14 },
    sells: { tea: 6, spice: 4 },
    unlocked: false,
    description: 'Island of Spices'
  }
};

// Royal orders
const ORDERS = [
  { tea: 20, reward: 300, desc: 'Deliver 20 tea to London' },
  { spice: 15, reward: 250, desc: 'Deliver 15 spice to London' },
  { tea: 40, reward: 500, desc: 'Deliver 40 tea to London', unlocks: 'canton' },
  { silk: 25, reward: 600, desc: 'Deliver 25 silk to London', unlocks: 'bombay' },
  { tea: 60, spice: 30, reward: 1000, desc: 'Deliver 60 tea and 30 spice', unlocks: 'ceylon' },
  { tea: 100, silk: 50, spice: 50, reward: 2500, desc: 'Grand delivery for the Crown' }
];

// Buttons
const buttons = [];

function addButton(id, x, y, w, h, text, onClick) {
  buttons.push({ id, x, y, w, h, text, onClick });
}

function clearButtons() {
  buttons.length = 0;
}

function checkButtonHover(mx, my) {
  game.hoveredButton = null;
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      game.hoveredButton = btn.id;
      return btn;
    }
  }
  return null;
}

// Input handling
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  checkButtonHover(mx, my);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);

  const btn = checkButtonHover(mx, my);
  if (btn && btn.onClick) {
    btn.onClick();
  }
});

document.addEventListener('keydown', e => {
  if (game.state === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  }
});

function startGame() {
  game.state = 'map';
  game.gold = 500;
  game.goods = 50;
  game.tea = 0;
  game.spice = 0;
  game.silk = 0;
  game.year = 1820;
  game.currentPort = 'london';
  game.ordersComplete = 0;
  game.message = 'Welcome, Captain! Visit ports to trade.';
  game.messageTimer = 3;

  // Reset port unlocks
  PORTS.london.unlocked = true;
  PORTS.lisbon.unlocked = true;
  PORTS.canton.unlocked = false;
  PORTS.bombay.unlocked = false;
  PORTS.ceylon.unlocked = false;
}

function setMessage(msg) {
  game.message = msg;
  game.messageTimer = 3;
}

function sailTo(portId) {
  if (portId === game.currentPort) return;
  if (!PORTS[portId].unlocked) return;

  game.voyageDestination = portId;
  game.voyageProgress = 0;
  game.state = 'voyage';

  // Calculate voyage time based on distance
  const from = PORTS[game.currentPort];
  const to = PORTS[portId];
  const dist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
  game.voyageDuration = dist / 100; // Roughly 1-5 seconds
}

function arriveAtPort() {
  game.currentPort = game.voyageDestination;
  game.year += 0.5;
  game.state = 'port';

  // Random event (15% chance of losing cargo)
  if (Math.random() < 0.15) {
    const loss = Math.floor(game.goods * 0.2);
    game.goods = Math.max(0, game.goods - loss);
    setMessage(`Storm! Lost ${loss} goods at sea.`);
    spawnSmoke(WIDTH / 2, HEIGHT / 2);
  } else {
    setMessage(`Arrived at ${PORTS[game.currentPort].name}`);
  }
}

function trade(item, amount, buying) {
  const port = PORTS[game.currentPort];

  if (buying) {
    // Buying from port
    const price = port.sells[item];
    if (!price) return;
    const cost = price * amount;
    if (game.gold < cost) {
      setMessage('Not enough gold!');
      return;
    }
    game.gold -= cost;
    game[item] += amount;
    spawnCoinBurst(WIDTH / 2, HEIGHT / 2);
    setMessage(`Bought ${amount} ${item}`);
  } else {
    // Selling to port
    const price = port.buys[item];
    if (!price) return;
    if (game[item] < amount) {
      setMessage(`Not enough ${item}!`);
      return;
    }
    game[item] -= amount;
    game.gold += price * amount;
    spawnCoinBurst(WIDTH / 2, HEIGHT / 2);
    setMessage(`Sold ${amount} ${item} for ${price * amount}g`);
  }

  // Check order completion
  checkOrders();
}

function checkOrders() {
  if (game.currentPort !== 'london') return;
  if (game.ordersComplete >= ORDERS.length) return;

  const order = ORDERS[game.ordersComplete];
  let canComplete = true;

  if (order.tea && game.tea < order.tea) canComplete = false;
  if (order.spice && game.spice < order.spice) canComplete = false;
  if (order.silk && game.silk < order.silk) canComplete = false;

  if (canComplete) {
    // Deduct items
    if (order.tea) game.tea -= order.tea;
    if (order.spice) game.spice -= order.spice;
    if (order.silk) game.silk -= order.silk;

    // Give reward
    game.gold += order.reward;
    game.ordersComplete++;

    // Unlock port
    if (order.unlocks) {
      PORTS[order.unlocks].unlocked = true;
      setMessage(`Order complete! ${PORTS[order.unlocks].name} unlocked!`);
    } else {
      setMessage(`Order complete! +${order.reward} gold`);
    }

    spawnCoinBurst(WIDTH / 2, 100);

    // Victory check
    if (game.ordersComplete >= ORDERS.length) {
      game.state = 'victory';
    }
  }
}

// Update
function update(dt) {
  game.time += dt;

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) {
      particles.splice(i, 1);
    }
  }

  // Message timer
  if (game.messageTimer > 0) {
    game.messageTimer -= dt;
  }

  // Voyage progress
  if (game.state === 'voyage') {
    game.voyageProgress += dt / game.voyageDuration;
    if (game.voyageProgress >= 1) {
      arriveAtPort();
    }
  }

  // Year limit
  if (game.year >= 1850 && game.state !== 'victory' && game.state !== 'gameover') {
    game.state = 'gameover';
  }
}

// Drawing functions
function drawParchmentBg() {
  // Base parchment
  const gradient = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, 500);
  gradient.addColorStop(0, COLORS.parchment);
  gradient.addColorStop(1, COLORS.parchmentDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Aged texture lines
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * WIDTH, 0);
    ctx.lineTo(Math.random() * WIDTH, HEIGHT);
    ctx.stroke();
  }
}

function drawButton(btn) {
  const hovered = game.hoveredButton === btn.id;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(btn.x + 3, btn.y + 3, btn.w, btn.h);

  // Button background
  const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
  if (hovered) {
    gradient.addColorStop(0, COLORS.goldBright);
    gradient.addColorStop(1, COLORS.gold);
  } else {
    gradient.addColorStop(0, COLORS.wood);
    gradient.addColorStop(1, '#5c3317');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

  // Border
  ctx.strokeStyle = hovered ? COLORS.goldBright : COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

  // Text
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 16px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawTitle() {
  drawParchmentBg();

  ctx.save();
  ctx.textAlign = 'center';

  // Title with shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.font = 'bold 72px "Playfair Display", serif';
  ctx.fillText('HIGH TEA', WIDTH / 2 + 3, 183);

  ctx.fillStyle = COLORS.sepia;
  ctx.fillText('HIGH TEA', WIDTH / 2, 180);

  ctx.font = '28px "Libre Baskerville", serif';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText('A Trading Adventure', WIDTH / 2, 230);

  ctx.font = '18px "Libre Baskerville", serif';
  ctx.fillText('Sail the seas. Trade exotic goods.', WIDTH / 2, 320);
  ctx.fillText('Complete Royal Orders for the Crown.', WIDTH / 2, 350);

  // Pulsing start text
  const pulse = Math.sin(game.time * 3) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px "Playfair Display", serif';
  ctx.fillText('Press ENTER to Begin', WIDTH / 2, 480);

  ctx.restore();
}

function drawMap() {
  // Ocean background
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, COLORS.oceanDeep);
  gradient.addColorStop(0.5, COLORS.ocean);
  gradient.addColorStop(1, COLORS.oceanLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Animated waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  for (let y = 50; y < HEIGHT - 100; y += 40) {
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 10) {
      const wave = Math.sin((x + game.time * 50) * 0.02 + y * 0.01) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Draw ports
  clearButtons();
  for (const [id, port] of Object.entries(PORTS)) {
    const isCurrent = id === game.currentPort;
    const isUnlocked = port.unlocked;

    // Port marker
    ctx.beginPath();
    ctx.arc(port.x, port.y, isCurrent ? 18 : 12, 0, Math.PI * 2);

    if (!isUnlocked) {
      ctx.fillStyle = '#444';
    } else if (isCurrent) {
      ctx.fillStyle = COLORS.goldBright;
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.gold;
    } else {
      ctx.fillStyle = COLORS.port;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Port name
    ctx.fillStyle = isUnlocked ? COLORS.white : '#666';
    ctx.font = '14px "Libre Baskerville", serif';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, port.x, port.y - 25);
    ctx.textAlign = 'left';

    // Add clickable button for unlocked ports
    if (isUnlocked && id !== game.currentPort) {
      addButton(id, port.x - 20, port.y - 20, 40, 40, '', () => sailTo(id));
    }
  }

  // Draw route from current port to potential destinations
  const current = PORTS[game.currentPort];
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  for (const [id, port] of Object.entries(PORTS)) {
    if (port.unlocked && id !== game.currentPort) {
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(port.x, port.y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // UI Panel
  ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
  ctx.fillRect(20, 20, 200, 180);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 200, 180);

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 18px "Playfair Display", serif';
  ctx.fillText('Inventory', 40, 50);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = '14px "Libre Baskerville", serif';
  ctx.fillText(`Gold: ${game.gold}`, 40, 80);
  ctx.fillText(`Goods: ${game.goods}`, 40, 100);
  ctx.fillText(`Tea: ${game.tea}`, 40, 120);
  ctx.fillText(`Spice: ${game.spice}`, 40, 140);
  ctx.fillText(`Silk: ${game.silk}`, 40, 160);
  ctx.fillText(`Year: ${game.year.toFixed(1)}`, 40, 185);

  // Current order panel
  if (game.ordersComplete < ORDERS.length) {
    const order = ORDERS[game.ordersComplete];
    ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
    ctx.fillRect(WIDTH - 280, 20, 260, 80);
    ctx.strokeStyle = COLORS.gold;
    ctx.strokeRect(WIDTH - 280, 20, 260, 80);

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 14px "Playfair Display", serif';
    ctx.fillText('Royal Order:', WIDTH - 265, 45);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '12px "Libre Baskerville", serif';
    ctx.fillText(order.desc, WIDTH - 265, 65);
    ctx.fillText(`Reward: ${order.reward} gold`, WIDTH - 265, 85);
  }

  // Message
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
    ctx.fillRect(WIDTH / 2 - 200, HEIGHT - 60, 400, 40);
    ctx.strokeStyle = COLORS.gold;
    ctx.strokeRect(WIDTH / 2 - 200, HEIGHT - 60, 400, 40);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '16px "Libre Baskerville", serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, WIDTH / 2, HEIGHT - 35);
    ctx.textAlign = 'left';
  }

  // Trade button
  addButton('trade', WIDTH / 2 - 60, HEIGHT - 120, 120, 40, 'TRADE', () => {
    game.state = 'port';
  });
  drawButton(buttons.find(b => b.id === 'trade'));
}

function drawPort() {
  drawParchmentBg();

  const port = PORTS[game.currentPort];

  // Header
  ctx.fillStyle = COLORS.sepia;
  ctx.font = 'bold 36px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.fillText(port.name, WIDTH / 2, 60);
  ctx.font = '18px "Libre Baskerville", serif';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(port.description, WIDTH / 2, 90);
  ctx.textAlign = 'left';

  // Inventory panel
  ctx.fillStyle = 'rgba(92, 51, 23, 0.2)';
  ctx.fillRect(40, 120, 200, 180);
  ctx.strokeStyle = COLORS.wood;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 120, 200, 180);

  ctx.fillStyle = COLORS.sepia;
  ctx.font = 'bold 18px "Playfair Display", serif';
  ctx.fillText('Your Hold', 60, 150);

  ctx.fillStyle = COLORS.ink;
  ctx.font = '16px "Libre Baskerville", serif';
  ctx.fillText(`Gold: ${game.gold}`, 60, 180);
  ctx.fillText(`Goods: ${game.goods}`, 60, 205);
  ctx.fillText(`Tea: ${game.tea}`, 60, 230);
  ctx.fillText(`Spice: ${game.spice}`, 60, 255);
  ctx.fillText(`Silk: ${game.silk}`, 60, 280);

  // Buy section
  ctx.fillStyle = 'rgba(92, 51, 23, 0.2)';
  ctx.fillRect(280, 120, 220, 200);
  ctx.strokeStyle = COLORS.green;
  ctx.strokeRect(280, 120, 220, 200);

  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 18px "Playfair Display", serif';
  ctx.fillText('BUY', 350, 150);

  clearButtons();
  let buyY = 170;
  for (const [item, price] of Object.entries(port.sells || {})) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = '14px "Libre Baskerville", serif';
    ctx.fillText(`${item}: ${price}g each`, 300, buyY);
    addButton(`buy_${item}`, 420, buyY - 15, 60, 25, 'Buy 10', () => trade(item, 10, true));
    drawButton(buttons.find(b => b.id === `buy_${item}`));
    buyY += 40;
  }

  // Sell section
  ctx.fillStyle = 'rgba(92, 51, 23, 0.2)';
  ctx.fillRect(540, 120, 220, 200);
  ctx.strokeStyle = COLORS.red;
  ctx.strokeRect(540, 120, 220, 200);

  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 18px "Playfair Display", serif';
  ctx.fillText('SELL', 610, 150);

  let sellY = 170;
  for (const [item, price] of Object.entries(port.buys || {})) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = '14px "Libre Baskerville", serif';
    ctx.fillText(`${item}: ${price}g each`, 560, sellY);
    addButton(`sell_${item}`, 680, sellY - 15, 60, 25, 'Sell 10', () => trade(item, 10, false));
    drawButton(buttons.find(b => b.id === `sell_${item}`));
    sellY += 40;
  }

  // Back to map button
  addButton('map', WIDTH / 2 - 80, HEIGHT - 100, 160, 45, 'Back to Map', () => {
    game.state = 'map';
  });
  drawButton(buttons.find(b => b.id === 'map'));

  // Message
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(44, 24, 16, 0.9)';
    ctx.fillRect(WIDTH / 2 - 200, HEIGHT - 160, 400, 40);
    ctx.strokeStyle = COLORS.gold;
    ctx.strokeRect(WIDTH / 2 - 200, HEIGHT - 160, 400, 40);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '16px "Libre Baskerville", serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, WIDTH / 2, HEIGHT - 135);
    ctx.textAlign = 'left';
  }
}

function drawVoyage() {
  // Ocean background
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, COLORS.oceanDeep);
  gradient.addColorStop(1, COLORS.oceanLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  for (let y = 100; y < HEIGHT; y += 60) {
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 10) {
      const wave = Math.sin((x + game.time * 80) * 0.015 + y * 0.01) * 8;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Ship (simple representation)
  const shipX = 100 + game.voyageProgress * (WIDTH - 200);
  const shipY = HEIGHT / 2 + Math.sin(game.time * 3) * 10;

  // Hull
  ctx.fillStyle = COLORS.wood;
  ctx.beginPath();
  ctx.moveTo(shipX + 40, shipY);
  ctx.lineTo(shipX + 30, shipY + 15);
  ctx.lineTo(shipX - 30, shipY + 15);
  ctx.lineTo(shipX - 40, shipY);
  ctx.lineTo(shipX - 30, shipY - 5);
  ctx.lineTo(shipX + 30, shipY - 5);
  ctx.closePath();
  ctx.fill();

  // Mast
  ctx.fillStyle = '#3d2817';
  ctx.fillRect(shipX - 3, shipY - 60, 6, 55);

  // Sail
  ctx.fillStyle = COLORS.sail;
  ctx.beginPath();
  ctx.moveTo(shipX, shipY - 55);
  ctx.quadraticCurveTo(shipX + 30, shipY - 35, shipX, shipY - 10);
  ctx.quadraticCurveTo(shipX - 20, shipY - 35, shipX, shipY - 55);
  ctx.fill();

  // Progress text
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 24px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Sailing to ${PORTS[game.voyageDestination].name}...`, WIDTH / 2, 80);
  ctx.font = '18px "Libre Baskerville", serif';
  ctx.fillText(`${Math.floor(game.voyageProgress * 100)}%`, WIDTH / 2, 110);
  ctx.textAlign = 'left';
}

function drawVictory() {
  drawParchmentBg();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px "Playfair Display", serif';
  ctx.shadowBlur = 20;
  ctx.shadowColor = COLORS.gold;
  ctx.fillText('VICTORY!', WIDTH / 2, 200);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.sepia;
  ctx.font = '24px "Libre Baskerville", serif';
  ctx.fillText('All Royal Orders Complete!', WIDTH / 2, 260);
  ctx.fillText(`Final Gold: ${game.gold}`, WIDTH / 2, 320);
  ctx.fillText(`Final Year: ${game.year.toFixed(1)}`, WIDTH / 2, 350);

  ctx.restore();

  clearButtons();
  addButton('restart', WIDTH / 2 - 80, 450, 160, 45, 'Play Again', startGame);
  drawButton(buttons.find(b => b.id === 'restart'));
}

function drawGameOver() {
  drawParchmentBg();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 48px "Playfair Display", serif';
  ctx.fillText('TIME EXPIRED', WIDTH / 2, 200);

  ctx.fillStyle = COLORS.sepia;
  ctx.font = '24px "Libre Baskerville", serif';
  ctx.fillText('The year is 1850. Your time has passed.', WIDTH / 2, 260);
  ctx.fillText(`Orders Completed: ${game.ordersComplete}/${ORDERS.length}`, WIDTH / 2, 320);

  ctx.restore();

  clearButtons();
  addButton('restart', WIDTH / 2 - 80, 450, 160, 45, 'Try Again', startGame);
  drawButton(buttons.find(b => b.id === 'restart'));
}

function drawParticles() {
  for (const p of particles) {
    p.draw(ctx);
  }
}

// Main loop
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);

  // Draw based on state
  if (game.state === 'title') {
    drawTitle();
  } else if (game.state === 'map') {
    drawMap();
  } else if (game.state === 'port') {
    drawPort();
  } else if (game.state === 'voyage') {
    drawVoyage();
  } else if (game.state === 'victory') {
    drawVictory();
  } else if (game.state === 'gameover') {
    drawGameOver();
  }

  drawParticles();

  requestAnimationFrame(gameLoop);
}

// Expose game state for testing
Object.defineProperty(window, 'gameState', {
  get: function() {
    return {
      screen: game.state,
      gold: game.gold,
      goods: game.goods,
      tea: game.tea,
      spice: game.spice,
      silk: game.silk,
      year: game.year,
      currentPort: game.currentPort,
      ordersComplete: game.ordersComplete,
      ports: PORTS,
      particleCount: particles.length
    };
  }
});

// Expose functions for testing
window.startGame = startGame;
window.sailTo = sailTo;
window.trade = trade;
window.PORTS = PORTS;

// Start
requestAnimationFrame(gameLoop);
