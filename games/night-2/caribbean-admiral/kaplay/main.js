// Caribbean Admiral - Naval Trading Strategy Game
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 1024;
const HEIGHT = 640;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Game state
const game = {
  screen: 'title', // title, map, port, trade, combat, victory
  gold: 500,
  currentPort: 'Nassau',
  sailing: null,
  combatState: null,
  player: {
    ships: [{
      type: 'Sloop',
      hp: 100, maxHp: 100,
      ap: 50, maxAp: 50,
      damage: 15,
      accuracy: 65,
      cargo: [],
      cargoMax: 30
    }],
    powder: 2,
    dynamite: 0
  },
  stats: { battlesWon: 0, goldEarned: 0 },
  mouse: { x: 0, y: 0, clicked: false },
  buttons: []
};

// Expose for testing
window.gameState = game;

// Ship types
const SHIPS = {
  Sloop: { cost: 500, hp: 100, ap: 50, damage: 15, accuracy: 65, cargo: 30 },
  Schooner: { cost: 1500, hp: 150, ap: 60, damage: 22, accuracy: 68, cargo: 50 },
  Brigantine: { cost: 4000, hp: 220, ap: 70, damage: 32, accuracy: 70, cargo: 80 },
  Brig: { cost: 8000, hp: 300, ap: 80, damage: 45, accuracy: 72, cargo: 120 },
  Frigate: { cost: 30000, hp: 550, ap: 100, damage: 80, accuracy: 78, cargo: 200 }
};

// Ports
const PORTS = {
  Nassau: { x: 200, y: 280, goods: { Rice: 25, Rum: 80, Sugar: 60 } },
  Havana: { x: 150, y: 420, goods: { Sugar: 45, Tobacco: 120, Rice: 40 } },
  'Port Royal': { x: 450, y: 480, goods: { Rum: 70, Gunpowder: 800, Sugar: 75 } },
  Kingston: { x: 750, y: 400, goods: { Coffee: 400, Spices: 600, Rice: 70 } },
  Tortuga: { x: 480, y: 320, goods: { Weapons: 1200, Gunpowder: 750, Rum: 110 } },
  'San Juan': { x: 320, y: 150, goods: { Silver: 3000, Rice: 80, Corn: 75 } },
  Cartagena: { x: 850, y: 200, goods: { Silk: 2500, Spices: 550, Silver: 4000 } }
};

// Goods prices (base)
const GOODS = {
  Rice: { buy: 30, sell: 60 },
  Corn: { buy: 35, sell: 55 },
  Rum: { buy: 90, sell: 130 },
  Sugar: { buy: 55, sell: 90 },
  Tobacco: { buy: 140, sell: 200 },
  Coffee: { buy: 450, sell: 580 },
  Spices: { buy: 650, sell: 750 },
  Gunpowder: { buy: 850, sell: 1050 },
  Weapons: { buy: 1300, sell: 1550 },
  Silk: { buy: 2700, sell: 3100 },
  Silver: { buy: 3300, sell: 3800 }
};

// Sea routes
const ROUTES = [
  ['Nassau', 'Havana'], ['Nassau', 'Tortuga'], ['Nassau', 'San Juan'],
  ['Havana', 'Port Royal'], ['Port Royal', 'Kingston'], ['Port Royal', 'Tortuga'],
  ['Kingston', 'Cartagena'], ['Kingston', 'Tortuga'],
  ['Tortuga', 'San Juan'], ['Tortuga', 'Cartagena'],
  ['San Juan', 'Cartagena']
];

// Input
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  game.mouse.clicked = true;
});

// Utility functions
function drawButton(x, y, w, h, text, color = '#4a7c59') {
  const hover = game.mouse.x >= x && game.mouse.x <= x + w &&
                game.mouse.y >= y && game.mouse.y <= y + h;

  ctx.fillStyle = hover ? lightenColor(color) : color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w/2, y + h/2 + 6);

  game.buttons.push({ x, y, w, h, action: text });
  return hover && game.mouse.clicked;
}

function lightenColor(hex) {
  const r = Math.min(255, parseInt(hex.slice(1,3), 16) + 40);
  const g = Math.min(255, parseInt(hex.slice(3,5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5,7), 16) + 40);
  return `rgb(${r},${g},${b})`;
}

function getConnectedPorts(port) {
  const connected = [];
  for (const route of ROUTES) {
    if (route[0] === port) connected.push(route[1]);
    if (route[1] === port) connected.push(route[0]);
  }
  return connected;
}

function getGoodPrice(good, port, isBuying) {
  const portGoods = PORTS[port].goods;
  if (portGoods[good]) {
    return isBuying ? portGoods[good] : Math.floor(portGoods[good] * 1.3);
  }
  const base = GOODS[good];
  return isBuying ? base.buy : base.sell;
}

function getTotalCargo() {
  let total = 0;
  for (const ship of game.player.ships) {
    total += ship.cargo.length;
  }
  return total;
}

function getCargoMax() {
  let max = 0;
  for (const ship of game.player.ships) {
    max += ship.cargoMax;
  }
  return max;
}

// Screens
function drawTitle() {
  // Background
  ctx.fillStyle = '#1a3a5c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ocean waves effect
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgba(20, 80, 120, ${0.3 - i * 0.05})`;
    ctx.beginPath();
    ctx.moveTo(0, 350 + i * 40);
    for (let x = 0; x <= WIDTH; x += 50) {
      ctx.lineTo(x, 350 + i * 40 + Math.sin(x * 0.02 + Date.now() * 0.001 + i) * 10);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.fill();
  }

  // Title
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('CARIBBEAN ADMIRAL', WIDTH/2, 150);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Georgia';
  ctx.fillText('Trade. Battle. Conquer the Ghost Ship.', WIDTH/2, 200);

  // Start button
  if (drawButton(WIDTH/2 - 100, 350, 200, 50, 'START GAME', '#8b4513')) {
    game.screen = 'map';
  }

  // Instructions
  ctx.fillStyle = '#aaa';
  ctx.font = '14px Georgia';
  ctx.fillText('Buy goods low, sell high. Upgrade your fleet. Defeat the Ghost Ship!', WIDTH/2, 450);
}

function drawMap() {
  // Ocean background
  ctx.fillStyle = '#1a5276';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw routes
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  for (const route of ROUTES) {
    const p1 = PORTS[route[0]];
    const p2 = PORTS[route[1]];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw ports
  for (const [name, port] of Object.entries(PORTS)) {
    const hover = Math.hypot(game.mouse.x - port.x, game.mouse.y - port.y) < 30;
    const isCurrent = name === game.currentPort;

    // Port circle
    ctx.beginPath();
    ctx.arc(port.x, port.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = isCurrent ? '#ffd700' : (hover ? '#4a7c59' : '#8b4513');
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Port name
    ctx.fillStyle = '#fff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(name, port.x, port.y + 40);

    // Click to sail
    if (hover && game.mouse.clicked && !isCurrent && !game.sailing) {
      const connected = getConnectedPorts(game.currentPort);
      if (connected.includes(name)) {
        startSailing(name);
      }
    }
  }

  // Draw sailing ship
  if (game.sailing) {
    const p1 = PORTS[game.sailing.from];
    const p2 = PORTS[game.sailing.to];
    const t = game.sailing.progress;
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x - 10, y + 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, 50);

  ctx.fillStyle = '#ffd700';
  ctx.font = '18px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`Gold: ${game.gold.toLocaleString()}`, 20, 32);

  ctx.fillStyle = '#fff';
  ctx.fillText(`Cargo: ${getTotalCargo()}/${getCargoMax()}`, 200, 32);
  ctx.fillText(`Ships: ${game.player.ships.length}`, 380, 32);
  ctx.fillText(`At: ${game.currentPort}`, 500, 32);

  // Enter port button
  if (!game.sailing && drawButton(WIDTH - 150, 10, 130, 30, 'Enter Port', '#4a7c59')) {
    game.screen = 'port';
  }

  // Sailing info
  if (game.sailing) {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Sailing to ${game.sailing.to}...`, WIDTH/2, HEIGHT - 30);
  }

  // Show connected ports hint
  if (!game.sailing) {
    const connected = getConnectedPorts(game.currentPort);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Can sail to: ${connected.join(', ')}`, WIDTH/2, HEIGHT - 15);
  }
}

function startSailing(destination) {
  game.sailing = {
    from: game.currentPort,
    to: destination,
    progress: 0,
    encounterTimer: 0
  };
}

function updateSailing(dt) {
  if (!game.sailing) return;

  game.sailing.progress += dt * 0.3;
  game.sailing.encounterTimer += dt;

  // Random encounter
  if (game.sailing.encounterTimer > 3) {
    game.sailing.encounterTimer = 0;
    if (Math.random() < 0.15) {
      startCombat();
      return;
    }
  }

  // Arrived
  if (game.sailing.progress >= 1) {
    game.currentPort = game.sailing.to;
    game.sailing = null;
  }
}

function drawPort() {
  ctx.fillStyle = '#2c1810';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Port name
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(game.currentPort, WIDTH/2, 50);

  // Gold
  ctx.fillStyle = '#fff';
  ctx.font = '18px Georgia';
  ctx.fillText(`Gold: ${game.gold.toLocaleString()}`, WIDTH/2, 80);

  // Buttons
  const btnY = 150;
  const btnH = 60;
  const btnW = 180;
  const gap = 30;

  if (drawButton(WIDTH/2 - btnW*1.5 - gap, btnY, btnW, btnH, 'TRADE', '#4a7c59')) {
    game.screen = 'trade';
  }

  if (drawButton(WIDTH/2 - btnW/2, btnY, btnW, btnH, 'REPAIR', '#4a7c59')) {
    repairShips();
  }

  if (drawButton(WIDTH/2 + btnW/2 + gap, btnY, btnW, btnH, 'BUY SHIP', '#4a7c59')) {
    buyNewShip();
  }

  // Ship info
  ctx.fillStyle = '#fff';
  ctx.font = '16px Georgia';
  ctx.textAlign = 'left';
  let y = 280;
  ctx.fillText('Your Fleet:', 50, y);
  y += 30;

  for (const ship of game.player.ships) {
    ctx.fillText(`${ship.type}: HP ${ship.hp}/${ship.maxHp} | Cargo: ${ship.cargo.length}/${ship.cargoMax}`, 70, y);
    y += 25;
  }

  // Back to map
  if (drawButton(WIDTH/2 - 75, HEIGHT - 80, 150, 40, 'SET SAIL', '#8b4513')) {
    game.screen = 'map';
  }

  // Current cargo
  ctx.textAlign = 'left';
  ctx.fillText('Cargo:', 600, 280);
  y = 310;
  const cargoCount = {};
  for (const ship of game.player.ships) {
    for (const good of ship.cargo) {
      cargoCount[good] = (cargoCount[good] || 0) + 1;
    }
  }
  for (const [good, count] of Object.entries(cargoCount)) {
    ctx.fillText(`${good} x${count}`, 620, y);
    y += 20;
  }
}

function drawTrade() {
  ctx.fillStyle = '#1a3a5c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 28px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(`Trading at ${game.currentPort}`, WIDTH/2, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Georgia';
  ctx.fillText(`Gold: ${game.gold.toLocaleString()} | Cargo: ${getTotalCargo()}/${getCargoMax()}`, WIDTH/2, 70);

  // Buy column
  ctx.fillStyle = '#4a7c59';
  ctx.fillRect(50, 100, 400, 400);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('BUY GOODS', 250, 130);

  let y = 160;
  for (const good of Object.keys(GOODS)) {
    const price = getGoodPrice(good, game.currentPort, true);
    if (drawButton(70, y, 360, 30, `${good} - ${price}g`, '#2c5530')) {
      buyGood(good, price);
    }
    y += 40;
  }

  // Sell column
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(WIDTH - 450, 100, 400, 400);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia';
  ctx.fillText('SELL GOODS', WIDTH - 250, 130);

  y = 160;
  const cargoCount = {};
  for (const ship of game.player.ships) {
    for (const good of ship.cargo) {
      cargoCount[good] = (cargoCount[good] || 0) + 1;
    }
  }

  for (const [good, count] of Object.entries(cargoCount)) {
    const price = getGoodPrice(good, game.currentPort, false);
    if (drawButton(WIDTH - 430, y, 360, 30, `${good} x${count} - ${price}g each`, '#6b3410')) {
      sellGood(good, price);
    }
    y += 40;
  }

  // Back button
  if (drawButton(WIDTH/2 - 75, HEIGHT - 60, 150, 40, 'BACK', '#444')) {
    game.screen = 'port';
  }
}

function buyGood(good, price) {
  if (game.gold >= price && getTotalCargo() < getCargoMax()) {
    game.gold -= price;
    // Add to first ship with space
    for (const ship of game.player.ships) {
      if (ship.cargo.length < ship.cargoMax) {
        ship.cargo.push(good);
        break;
      }
    }
  }
}

function sellGood(good, price) {
  for (const ship of game.player.ships) {
    const idx = ship.cargo.indexOf(good);
    if (idx !== -1) {
      ship.cargo.splice(idx, 1);
      game.gold += price;
      game.stats.goldEarned += price;
      break;
    }
  }
}

function repairShips() {
  for (const ship of game.player.ships) {
    const hpNeeded = ship.maxHp - ship.hp;
    const cost = hpNeeded * 2;
    if (game.gold >= cost) {
      game.gold -= cost;
      ship.hp = ship.maxHp;
    }
  }
}

function buyNewShip() {
  if (game.player.ships.length >= 5) return;

  const types = Object.entries(SHIPS).filter(([_, s]) => s.cost <= game.gold);
  if (types.length === 0) return;

  // Buy best affordable ship
  const [type, stats] = types[types.length - 1];
  game.gold -= stats.cost;
  game.player.ships.push({
    type,
    hp: stats.hp, maxHp: stats.hp,
    ap: stats.ap, maxAp: stats.ap,
    damage: stats.damage,
    accuracy: stats.accuracy,
    cargo: [],
    cargoMax: stats.cargo
  });
}

// Combat
function startCombat() {
  // Generate enemy based on player strength
  const playerPower = game.player.ships.reduce((s, ship) => s + ship.hp + ship.damage * 5, 0);
  let enemyType = 'Sloop';
  let count = 1;

  if (playerPower > 500) { enemyType = 'Schooner'; count = 2; }
  if (playerPower > 1000) { enemyType = 'Brigantine'; count = 2; }
  if (playerPower > 2000) { enemyType = 'Brig'; count = 3; }

  const enemyStats = SHIPS[enemyType];
  const enemies = [];
  for (let i = 0; i < count; i++) {
    enemies.push({
      type: enemyType,
      hp: enemyStats.hp,
      maxHp: enemyStats.hp,
      damage: enemyStats.damage,
      accuracy: enemyStats.accuracy
    });
  }

  game.combatState = {
    enemies,
    turn: 'player',
    selectedShip: 0,
    selectedTarget: 0,
    log: ['Combat begins!'],
    usedPowder: false
  };

  game.screen = 'combat';
}

function drawCombat() {
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const combat = game.combatState;
  if (!combat) return;

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('NAVAL COMBAT', WIDTH/2, 30);
  ctx.fillText(`Turn: ${combat.turn.toUpperCase()}`, WIDTH/2, 55);

  // Player ships (left)
  ctx.fillStyle = '#4a7c59';
  ctx.fillRect(20, 80, 300, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR FLEET', 170, 105);

  let y = 130;
  game.player.ships.forEach((ship, i) => {
    const selected = combat.selectedShip === i;
    ctx.fillStyle = selected ? '#ffd700' : '#fff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`${i+1}. ${ship.type}`, 40, y);
    ctx.fillText(`HP: ${ship.hp}/${ship.maxHp}`, 40, y + 18);
    ctx.fillText(`DMG: ${ship.damage}`, 150, y + 18);

    // HP bar
    ctx.fillStyle = '#400';
    ctx.fillRect(40, y + 25, 200, 8);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(40, y + 25, 200 * (ship.hp / ship.maxHp), 8);

    y += 60;
  });

  // Enemy ships (right)
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(WIDTH - 320, 80, 300, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('ENEMY FLEET', WIDTH - 170, 105);

  y = 130;
  combat.enemies.forEach((enemy, i) => {
    if (enemy.hp <= 0) return;
    const selected = combat.selectedTarget === i;
    ctx.fillStyle = selected ? '#ff4444' : '#fff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`${i+1}. ${enemy.type}`, WIDTH - 300, y);
    ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, WIDTH - 300, y + 18);

    // HP bar
    ctx.fillStyle = '#400';
    ctx.fillRect(WIDTH - 300, y + 25, 200, 8);
    ctx.fillStyle = '#f00';
    ctx.fillRect(WIDTH - 300, y + 25, 200 * (enemy.hp / enemy.maxHp), 8);

    // Click to target
    if (game.mouse.x > WIDTH - 320 && game.mouse.x < WIDTH - 20 &&
        game.mouse.y > y - 10 && game.mouse.y < y + 45) {
      if (game.mouse.clicked) combat.selectedTarget = i;
    }

    y += 60;
  });

  // Actions (player turn only)
  if (combat.turn === 'player') {
    const btnY = 360;
    if (drawButton(100, btnY, 150, 40, 'ATTACK', '#aa0000')) {
      playerAttack();
    }
    if (drawButton(280, btnY, 150, 40, 'DEFEND', '#0066aa')) {
      playerDefend();
    }
    if (game.player.powder > 0 && drawButton(460, btnY, 180, 40, `POWDER (${game.player.powder})`, '#ff8800')) {
      combat.usedPowder = true;
      game.player.powder--;
    }
    if (drawButton(670, btnY, 150, 40, 'FLEE', '#666')) {
      if (Math.random() < 0.6) {
        game.screen = 'map';
        game.combatState = null;
      } else {
        combat.log.push('Flee failed!');
        endPlayerTurn();
      }
    }
  }

  // Combat log
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(20, HEIGHT - 150, WIDTH - 40, 130);
  ctx.fillStyle = '#aaa';
  ctx.font = '14px Georgia';
  ctx.textAlign = 'left';
  const recentLog = combat.log.slice(-5);
  y = HEIGHT - 130;
  for (const msg of recentLog) {
    ctx.fillText(msg, 40, y);
    y += 22;
  }
}

function playerAttack() {
  const combat = game.combatState;
  const ship = game.player.ships[combat.selectedShip];
  const target = combat.enemies[combat.selectedTarget];

  if (!ship || ship.hp <= 0 || !target || target.hp <= 0) {
    // Find valid ship and target
    combat.selectedShip = game.player.ships.findIndex(s => s.hp > 0);
    combat.selectedTarget = combat.enemies.findIndex(e => e.hp > 0);
    if (combat.selectedShip === -1 || combat.selectedTarget === -1) return;
    return;
  }

  const hit = Math.random() * 100 < ship.accuracy;
  if (hit) {
    let damage = ship.damage;
    if (combat.usedPowder) {
      damage = Math.floor(damage * 1.5);
      combat.usedPowder = false;
    }
    target.hp -= damage;
    combat.log.push(`${ship.type} hits ${target.type} for ${damage} damage!`);

    if (target.hp <= 0) {
      combat.log.push(`${target.type} sunk!`);
    }
  } else {
    combat.log.push(`${ship.type} misses!`);
  }

  checkCombatEnd();
  if (game.screen === 'combat') endPlayerTurn();
}

function playerDefend() {
  const combat = game.combatState;
  combat.log.push('Bracing for impact...');
  combat.defending = true;
  endPlayerTurn();
}

function endPlayerTurn() {
  const combat = game.combatState;
  combat.turn = 'enemy';

  // Enemy attacks after delay
  setTimeout(() => {
    if (game.screen !== 'combat') return;
    enemyTurn();
  }, 1000);
}

function enemyTurn() {
  const combat = game.combatState;

  for (const enemy of combat.enemies) {
    if (enemy.hp <= 0) continue;

    // Find alive player ship
    const targets = game.player.ships.filter(s => s.hp > 0);
    if (targets.length === 0) break;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const hit = Math.random() * 100 < enemy.accuracy;

    if (hit) {
      let damage = enemy.damage;
      if (combat.defending) damage = Math.floor(damage * 0.75);
      target.hp -= damage;
      combat.log.push(`${enemy.type} hits ${target.type} for ${damage} damage!`);

      if (target.hp <= 0) {
        combat.log.push(`Your ${target.type} sunk!`);
      }
    } else {
      combat.log.push(`${enemy.type} misses!`);
    }
  }

  combat.defending = false;
  checkCombatEnd();

  if (game.screen === 'combat') {
    combat.turn = 'player';
  }
}

function checkCombatEnd() {
  const combat = game.combatState;

  const enemiesAlive = combat.enemies.filter(e => e.hp > 0).length;
  const playerAlive = game.player.ships.filter(s => s.hp > 0).length;

  if (enemiesAlive === 0) {
    // Victory
    const loot = Math.floor(500 + Math.random() * 1500);
    game.gold += loot;
    game.stats.battlesWon++;
    game.stats.goldEarned += loot;
    combat.log.push(`VICTORY! Looted ${loot} gold!`);

    setTimeout(() => {
      game.screen = 'map';
      game.combatState = null;
    }, 2000);
  } else if (playerAlive === 0) {
    // Defeat
    game.gold = Math.floor(game.gold * 0.75);
    combat.log.push('DEFEAT! Lost 25% gold and all cargo!');

    for (const ship of game.player.ships) {
      ship.cargo = [];
    }

    // Revive ships at low HP
    for (const ship of game.player.ships) {
      ship.hp = Math.floor(ship.maxHp * 0.3);
    }

    setTimeout(() => {
      game.screen = 'map';
      game.combatState = null;
      game.currentPort = 'Nassau';
    }, 2000);
  }
}

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  game.buttons = [];

  // Update
  if (game.screen === 'map') {
    updateSailing(dt);
  }

  // Render
  switch (game.screen) {
    case 'title': drawTitle(); break;
    case 'map': drawMap(); break;
    case 'port': drawPort(); break;
    case 'trade': drawTrade(); break;
    case 'combat': drawCombat(); break;
  }

  game.mouse.clicked = false;
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('Caribbean Admiral initialized! Click to interact.');
