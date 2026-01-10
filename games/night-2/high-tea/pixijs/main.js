// Spice Route - Trading Simulation (LittleJS style, using Canvas for headless testing)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 1024;
const HEIGHT = 640;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Colors
const COLORS = {
  bg: '#f5e6d3',
  primary: '#1a3a5c',
  secondary: '#d4a574',
  accent: '#8b0000',
  text: '#2c2c2c',
  gold: '#daa520',
  success: '#228b22',
  danger: '#b22222'
};

// Ports
const PORTS = {
  lisbon: { name: 'Lisbon', x: 100, y: 200, home: true, buysSpices: true },
  cape_verde: { name: 'Cape Verde', x: 200, y: 350, spices: { pepper: 15 }, goods: { textiles: 15 } },
  gold_coast: { name: 'Gold Coast', x: 300, y: 450, spices: { pepper: 12, cinnamon: 25 }, goods: { textiles: 20, glassware: 40 } },
  calicut: { name: 'Calicut', x: 700, y: 400, spices: { pepper: 8, cinnamon: 18, cloves: 35 }, goods: { textiles: 30, glassware: 60, weapons: 120 } },
  moluccas: { name: 'Moluccas', x: 900, y: 350, spices: { cloves: 20, nutmeg: 30 }, goods: { textiles: 40, glassware: 80, weapons: 160 } }
};

// Trade goods and spices
const TRADE_GOODS = {
  textiles: { name: 'Textiles', buyPrice: 10 },
  glassware: { name: 'Glassware', buyPrice: 20 },
  weapons: { name: 'Weapons', buyPrice: 40 }
};

const SPICES = {
  pepper: { name: 'Pepper', sellPrice: 25, color: '#2d2d2d' },
  cinnamon: { name: 'Cinnamon', sellPrice: 40, color: '#d2691e' },
  cloves: { name: 'Cloves', sellPrice: 60, color: '#8b4513' },
  nutmeg: { name: 'Nutmeg', sellPrice: 80, color: '#a0522d' }
};

// Royal orders
const ORDERS = [
  { num: 1, requirements: { pepper: 30 }, deadline: 3, reward: 200, unlocks: 'gold_coast' },
  { num: 2, requirements: { pepper: 50 }, deadline: 5, reward: 300, unlocks: null },
  { num: 3, requirements: { pepper: 40, cinnamon: 20 }, deadline: 7, reward: 500, unlocks: 'calicut' },
  { num: 4, requirements: { pepper: 60, cinnamon: 30 }, deadline: 10, reward: 700, unlocks: null },
  { num: 5, requirements: { cinnamon: 40, cloves: 10 }, deadline: 13, reward: 1000, unlocks: 'moluccas' },
  { num: 6, requirements: { cloves: 30, nutmeg: 10 }, deadline: 17, reward: 2000, unlocks: null }
];

// Game state
const game = {
  screen: 'title',
  ducats: 500,
  year: 1,
  maxYear: 20,
  currentPort: 'lisbon',
  unlockedPorts: ['lisbon', 'cape_verde'],
  cargo: { textiles: 0, glassware: 0, weapons: 0 },
  warehouse: { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
  cargoCapacity: 50,
  order: 0,
  delivered: {},
  stats: { voyages: 0, totalEarned: 0 },
  traveling: false,
  travelProgress: 0,
  travelDest: null,
  buttons: [],
  mouse: { x: 0, y: 0, clicked: false }
};

window.gameState = game;

// Input
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
  game.mouse.clicked = true;
});

document.addEventListener('keydown', e => {
  if (game.screen === 'title' && e.key === 'Enter') {
    startGame();
  } else if (game.screen === 'victory' && e.key === 'Enter') {
    game.screen = 'title';
  } else if (game.screen === 'gameover' && e.key === 'Enter') {
    game.screen = 'title';
  }
});

function startGame() {
  game.screen = 'map';
  game.ducats = 500;
  game.year = 1;
  game.currentPort = 'lisbon';
  game.unlockedPorts = ['lisbon', 'cape_verde'];
  game.cargo = { textiles: 0, glassware: 0, weapons: 0 };
  game.warehouse = { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 };
  game.order = 0;
  game.delivered = {};
  game.stats = { voyages: 0, totalEarned: 0 };
  game.traveling = false;
}

// Button helper
function createButton(x, y, w, h, text, action) {
  return { x, y, w, h, text, action };
}

function isHovered(btn) {
  return game.mouse.x >= btn.x && game.mouse.x <= btn.x + btn.w &&
         game.mouse.y >= btn.y && game.mouse.y <= btn.y + btn.h;
}

function checkButtons() {
  if (!game.mouse.clicked) return;
  game.mouse.clicked = false;

  for (const btn of game.buttons) {
    if (isHovered(btn)) {
      btn.action();
      return;
    }
  }
}

function drawButton(btn) {
  const hovered = isHovered(btn);
  ctx.fillStyle = hovered ? '#e5b685' : COLORS.secondary;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

// Update
function update(dt) {
  game.buttons = [];

  if (game.traveling) {
    game.travelProgress += dt * 0.5; // 2 seconds per voyage
    if (game.travelProgress >= 1) {
      game.traveling = false;
      game.currentPort = game.travelDest;
      game.year += 0.5;
      game.stats.voyages++;

      // Risk check
      if (Math.random() < 0.15) {
        const loss = Math.floor(getTotalCargo() * 0.2);
        loseRandomCargo(loss);
      }

      if (game.year > game.maxYear) {
        game.screen = 'gameover';
      }
    }
  }

  checkButtons();
}

function getTotalCargo() {
  return game.cargo.textiles + game.cargo.glassware + game.cargo.weapons * 2;
}

function getTotalSpicesInCargo() {
  return Object.values(game.warehouse).reduce((a, b) => a + b, 0);
}

function loseRandomCargo(amount) {
  const types = ['textiles', 'glassware', 'weapons'];
  for (let i = 0; i < amount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    if (game.cargo[type] > 0) game.cargo[type]--;
  }
}

// Render
function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (game.screen) {
    case 'title': renderTitle(); break;
    case 'map': renderMap(); break;
    case 'port': renderPort(); break;
    case 'trade': renderTrade(); break;
    case 'victory': renderVictory(); break;
    case 'gameover': renderGameOver(); break;
  }
}

function renderTitle() {
  ctx.fillStyle = COLORS.primary;
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('SPICE ROUTE', WIDTH / 2, 180);

  ctx.fillStyle = COLORS.accent;
  ctx.font = '24px Georgia';
  ctx.fillText('Trading Simulation', WIDTH / 2, 230);

  ctx.fillStyle = COLORS.text;
  ctx.font = '16px Georgia';
  ctx.fillText('Build a spice trading empire in the Age of Exploration', WIDTH / 2, 300);
  ctx.fillText('Buy trade goods in Lisbon, sell at foreign ports for spices', WIDTH / 2, 330);
  ctx.fillText('Fulfill Royal Orders to unlock new routes and earn rewards', WIDTH / 2, 360);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '20px Georgia';
  ctx.fillText('Press ENTER to Start', WIDTH / 2, 450);
}

function renderMap() {
  // Header
  renderHeader();

  // Draw routes
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  const connections = [
    ['lisbon', 'cape_verde'],
    ['cape_verde', 'gold_coast'],
    ['gold_coast', 'calicut'],
    ['calicut', 'moluccas']
  ];
  for (const [a, b] of connections) {
    const pa = PORTS[a], pb = PORTS[b];
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw ports
  for (const [id, port] of Object.entries(PORTS)) {
    const unlocked = game.unlockedPorts.includes(id);
    const current = game.currentPort === id;

    if (unlocked) {
      const btn = createButton(port.x - 40, port.y - 20, 80, 40, port.name, () => {
        if (!game.traveling && id !== game.currentPort) {
          game.traveling = true;
          game.travelProgress = 0;
          game.travelDest = id;
        } else if (id === game.currentPort) {
          game.screen = 'port';
        }
      });
      game.buttons.push(btn);

      ctx.fillStyle = current ? COLORS.success : COLORS.secondary;
      ctx.fillRect(port.x - 40, port.y - 20, 80, 40);
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = current ? 3 : 1;
      ctx.strokeRect(port.x - 40, port.y - 20, 80, 40);
    } else {
      ctx.fillStyle = '#999';
      ctx.fillRect(port.x - 40, port.y - 20, 80, 40);
    }

    ctx.fillStyle = unlocked ? COLORS.text : '#666';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, port.x, port.y + 4);
  }

  // Travel indicator
  if (game.traveling) {
    const from = PORTS[game.currentPort];
    const to = PORTS[game.travelDest];
    const x = from.x + (to.x - from.x) * game.travelProgress;
    const y = from.y + (to.y - from.y) * game.travelProgress;

    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Sailing to ${to.name}...`, WIDTH / 2, HEIGHT - 80);
  }

  // Instructions
  if (!game.traveling) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Click a port to travel (costs time) or click current port to trade', WIDTH / 2, HEIGHT - 30);
  }

  // Order panel
  renderOrderPanel();
}

function renderHeader() {
  ctx.fillStyle = 'rgba(26, 58, 92, 0.95)';
  ctx.fillRect(0, 0, WIDTH, 50);

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 16px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`Ducats: ${game.ducats}`, 20, 32);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`Year: ${Math.floor(game.year)} / ${game.maxYear}`, WIDTH / 2, 32);

  ctx.textAlign = 'right';
  ctx.fillText(`Cargo: ${getTotalCargo()} / ${game.cargoCapacity}`, WIDTH - 20, 32);
}

function renderOrderPanel() {
  if (game.order >= ORDERS.length) return;

  const order = ORDERS[game.order];
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(WIDTH - 280, 60, 260, 150);

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`Royal Order #${order.num}`, WIDTH - 270, 85);

  ctx.fillStyle = '#fff';
  ctx.font = '12px Georgia';
  let y = 105;
  for (const [spice, amount] of Object.entries(order.requirements)) {
    const delivered = game.delivered[spice] || 0;
    ctx.fillText(`${SPICES[spice].name}: ${delivered}/${amount}`, WIDTH - 270, y);
    y += 18;
  }

  ctx.fillStyle = game.year > order.deadline - 2 ? COLORS.danger : '#aaa';
  ctx.fillText(`Deadline: Year ${order.deadline}`, WIDTH - 270, y + 5);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`Reward: ${order.reward} ducats`, WIDTH - 270, y + 23);
}

function renderPort() {
  renderHeader();

  const port = PORTS[game.currentPort];
  ctx.fillStyle = COLORS.primary;
  ctx.font = 'bold 28px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(port.name, WIDTH / 2, 100);

  // Back button
  const backBtn = createButton(20, 70, 80, 30, '← Map', () => { game.screen = 'map'; });
  game.buttons.push(backBtn);
  drawButton(backBtn);

  if (port.home) {
    // Lisbon - Buy goods, sell spices, deliver orders
    renderLisbonPort();
  } else {
    // Foreign port - Sell goods, buy spices
    renderForeignPort(port);
  }
}

function renderLisbonPort() {
  // Buy trade goods section
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('Buy Trade Goods', 50, 160);

  let y = 190;
  for (const [id, good] of Object.entries(TRADE_GOODS)) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.fillText(`${good.name}: ${game.cargo[id]} (${good.buyPrice}d each)`, 50, y);

    const buyBtn = createButton(280, y - 15, 60, 25, 'Buy 5', () => {
      const cost = good.buyPrice * 5;
      if (game.ducats >= cost && getTotalCargo() + 5 <= game.cargoCapacity) {
        game.ducats -= cost;
        game.cargo[id] += 5;
      }
    });
    game.buttons.push(buyBtn);
    drawButton(buyBtn);
    y += 40;
  }

  // Sell spices section
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px Georgia';
  ctx.fillText('Sell Spices', 450, 160);

  y = 190;
  for (const [id, spice] of Object.entries(SPICES)) {
    ctx.fillStyle = spice.color;
    ctx.fillRect(450, y - 12, 12, 12);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.fillText(`${spice.name}: ${game.warehouse[id]} (${spice.sellPrice}d each)`, 470, y);

    if (game.warehouse[id] > 0) {
      const sellBtn = createButton(680, y - 15, 60, 25, 'Sell 5', () => {
        const amount = Math.min(5, game.warehouse[id]);
        game.warehouse[id] -= amount;
        game.ducats += amount * spice.sellPrice;
        game.stats.totalEarned += amount * spice.sellPrice;
      });
      game.buttons.push(sellBtn);
      drawButton(sellBtn);
    }
    y += 40;
  }

  // Deliver to court
  if (game.order < ORDERS.length) {
    const order = ORDERS[game.order];
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('Deliver to Royal Court', 450, 380);

    y = 410;
    for (const [spice, required] of Object.entries(order.requirements)) {
      const delivered = game.delivered[spice] || 0;
      const inWarehouse = game.warehouse[spice];

      if (delivered < required && inWarehouse > 0) {
        ctx.fillStyle = COLORS.text;
        ctx.font = '14px Georgia';
        ctx.fillText(`${SPICES[spice].name}: ${delivered}/${required}`, 450, y);

        const deliverBtn = createButton(620, y - 15, 80, 25, 'Deliver 5', () => {
          const canDeliver = Math.min(5, inWarehouse, required - delivered);
          game.warehouse[spice] -= canDeliver;
          game.delivered[spice] = (game.delivered[spice] || 0) + canDeliver;

          // Check order completion
          let complete = true;
          for (const [s, r] of Object.entries(order.requirements)) {
            if ((game.delivered[s] || 0) < r) complete = false;
          }
          if (complete) {
            game.ducats += order.reward;
            if (order.unlocks) game.unlockedPorts.push(order.unlocks);
            game.order++;
            game.delivered = {};
            if (game.order >= ORDERS.length) {
              game.screen = 'victory';
            }
          }
        });
        game.buttons.push(deliverBtn);
        drawButton(deliverBtn);
        y += 35;
      }
    }
  }
}

function renderForeignPort(port) {
  // Sell goods section
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('Sell Trade Goods', 50, 160);

  let y = 190;
  for (const [id, price] of Object.entries(port.goods || {})) {
    const good = TRADE_GOODS[id];
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.fillText(`${good.name}: ${game.cargo[id]} (${price}d each)`, 50, y);

    if (game.cargo[id] > 0) {
      const sellBtn = createButton(280, y - 15, 60, 25, 'Sell 5', () => {
        const amount = Math.min(5, game.cargo[id]);
        game.cargo[id] -= amount;
        game.ducats += amount * price;
      });
      game.buttons.push(sellBtn);
      drawButton(sellBtn);
    }
    y += 40;
  }

  // Buy spices section
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px Georgia';
  ctx.fillText('Buy Spices', 450, 160);

  y = 190;
  for (const [id, price] of Object.entries(port.spices || {})) {
    const spice = SPICES[id];
    ctx.fillStyle = spice.color;
    ctx.fillRect(450, y - 12, 12, 12);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Georgia';
    ctx.fillText(`${spice.name}: ${game.warehouse[id]} (${price}d each)`, 470, y);

    const buyBtn = createButton(680, y - 15, 60, 25, 'Buy 5', () => {
      const cost = price * 5;
      if (game.ducats >= cost) {
        game.ducats -= cost;
        game.warehouse[id] += 5;
      }
    });
    game.buttons.push(buyBtn);
    drawButton(buyBtn);
    y += 40;
  }
}

function renderVictory() {
  ctx.fillStyle = COLORS.primary;
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH / 2, 150);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px Georgia';
  ctx.fillText('You have completed all Royal Orders!', WIDTH / 2, 220);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px Georgia';
  ctx.fillText(`Final Ducats: ${game.ducats}`, WIDTH / 2, 300);
  ctx.fillText(`Total Voyages: ${game.stats.voyages}`, WIDTH / 2, 330);
  ctx.fillText(`Years Taken: ${Math.floor(game.year)}`, WIDTH / 2, 360);

  ctx.fillStyle = COLORS.secondary;
  ctx.font = '20px Georgia';
  ctx.fillText('Press ENTER to play again', WIDTH / 2, 450);
}

function renderGameOver() {
  ctx.fillStyle = COLORS.danger;
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 150);

  ctx.fillStyle = COLORS.text;
  ctx.font = '20px Georgia';
  ctx.fillText('Time has run out!', WIDTH / 2, 220);
  ctx.fillText(`Orders Completed: ${game.order}`, WIDTH / 2, 280);
  ctx.fillText(`Final Ducats: ${game.ducats}`, WIDTH / 2, 310);

  ctx.fillStyle = COLORS.secondary;
  ctx.font = '20px Georgia';
  ctx.fillText('Press ENTER to try again', WIDTH / 2, 400);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('Spice Route initialized! Press ENTER to start.');
