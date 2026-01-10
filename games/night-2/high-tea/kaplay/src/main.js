// Using global kaplay from CDN

// Initialize Kaplay
const k = kaplay({
  width: 1280,
  height: 720,
  background: [26, 58, 92],
  global: false
});

// Game state for testing
window.gameState = {
  ducats: 500,
  year: 1498,
  currentPort: 'lisbon',
  scene: 'loading',
  cargo: { textiles: 0, glassware: 0, weapons: 0, pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
  order: { number: 1, requirements: { pepper: 30 }, delivered: { pepper: 0 } }
};

// Game constants
const STARTING_DUCATS = 500;
const STARTING_YEAR = 1498;
const CARGO_CAPACITY = 50;

// Ports data
const PORTS = {
  lisbon: { name: 'Lisbon', x: 200, y: 150, unlocked: true, color: [212, 165, 116] },
  cape_verde: { name: 'Cape Verde', x: 280, y: 320, unlocked: true, color: [139, 119, 101] },
  gold_coast: { name: 'Gold Coast', x: 400, y: 420, unlocked: false, color: [205, 127, 50] },
  mombasa: { name: 'Mombasa', x: 580, y: 380, unlocked: false, color: [160, 82, 45] },
  calicut: { name: 'Calicut', x: 800, y: 350, unlocked: false, color: [139, 69, 19] },
  ceylon: { name: 'Ceylon', x: 900, y: 400, unlocked: false, color: [210, 105, 30] },
  malacca: { name: 'Malacca', x: 1020, y: 380, unlocked: false, color: [160, 82, 45] },
  moluccas: { name: 'Moluccas', x: 1140, y: 420, unlocked: false, color: [139, 90, 43] }
};

// Trade goods prices
const GOODS = {
  textiles: { buyLisbon: 10, sellPrices: { cape_verde: 15, gold_coast: 20, mombasa: 25, calicut: 30, ceylon: 30, malacca: 35, moluccas: 40 } },
  glassware: { buyLisbon: 20, sellPrices: { cape_verde: 30, gold_coast: 40, mombasa: 50, calicut: 60, ceylon: 60, malacca: 70, moluccas: 80 } },
  weapons: { buyLisbon: 40, sellPrices: { cape_verde: 60, gold_coast: 80, mombasa: 100, calicut: 120, ceylon: 120, malacca: 140, moluccas: 160 } }
};

// Spices prices
const SPICES = {
  pepper: { sellLisbon: 25, buyPrices: { cape_verde: 15, gold_coast: 12, mombasa: 10, calicut: 8, ceylon: 8, malacca: 6 } },
  cinnamon: { sellLisbon: 40, buyPrices: { gold_coast: 25, mombasa: 22, calicut: 18, ceylon: 15, malacca: 12 } },
  cloves: { sellLisbon: 60, buyPrices: { calicut: 35, ceylon: 30, malacca: 25, moluccas: 20 } },
  nutmeg: { sellLisbon: 80, buyPrices: { malacca: 40, moluccas: 30 } }
};

// Royal orders
const ORDERS = [
  { number: 1, requirements: { pepper: 30 }, reward: 200, deadline: 1500 },
  { number: 2, requirements: { pepper: 50 }, reward: 300, deadline: 1502 },
  { number: 3, requirements: { pepper: 40, cinnamon: 20 }, reward: 500, deadline: 1504 },
  { number: 4, requirements: { pepper: 60, cinnamon: 30 }, reward: 700, deadline: 1506 },
  { number: 5, requirements: { pepper: 50, cinnamon: 40, cloves: 10 }, reward: 1000, deadline: 1508 }
];

// Game state
let gameData = {
  ducats: STARTING_DUCATS,
  year: STARTING_YEAR,
  yearProgress: 0,
  currentPort: 'lisbon',
  cargo: { textiles: 0, glassware: 0, weapons: 0, pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
  warehouse: { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
  currentOrder: 0,
  delivered: {},
  reputation: 1,
  unlockedPorts: ['lisbon', 'cape_verde']
};

// Helper functions
function getTotalCargo() {
  let total = 0;
  for (const item in gameData.cargo) {
    total += gameData.cargo[item];
  }
  return total;
}

function canAfford(cost) {
  return gameData.ducats >= cost;
}

function updateGameState() {
  window.gameState = {
    ducats: gameData.ducats,
    year: gameData.year,
    currentPort: gameData.currentPort,
    scene: k.getSceneName() || 'unknown',
    cargo: { ...gameData.cargo },
    order: {
      number: gameData.currentOrder + 1,
      requirements: ORDERS[gameData.currentOrder]?.requirements || {},
      delivered: { ...gameData.delivered }
    }
  };
}

// Create visual button with juice
function createButton(x, y, text, onClick, width = 150, height = 50) {
  const btn = k.add([
    k.rect(width, height, { radius: 8 }),
    k.pos(x, y),
    k.anchor('center'),
    k.color(212, 165, 116),
    k.outline(3, k.rgb(255, 255, 255)),
    k.area(),
    k.scale(1),
    'button'
  ]);

  const label = btn.add([
    k.text(text, { size: 16 }),
    k.anchor('center'),
    k.color(44, 44, 44)
  ]);

  btn.onHover(() => {
    btn.color = k.rgb(232, 195, 146);
    btn.scale = k.vec2(1.05);
  });

  btn.onHoverEnd(() => {
    btn.color = k.rgb(212, 165, 116);
    btn.scale = k.vec2(1);
  });

  btn.onClick(() => {
    // Click feedback
    k.shake(2);
    // Simple scale effect without tween to avoid errors
    btn.scale = k.vec2(0.95);
    k.wait(0.05, () => {
      btn.scale = k.vec2(1);
    });
    onClick();
  });

  return btn;
}

// Create port node on map
function createPortNode(portId, port) {
  const isUnlocked = gameData.unlockedPorts.includes(portId);
  const isCurrent = gameData.currentPort === portId;

  const node = k.add([
    k.circle(isCurrent ? 25 : 18),
    k.pos(port.x, port.y),
    k.anchor('center'),
    k.color(...(isUnlocked ? port.color : [100, 100, 100])),
    k.outline(isCurrent ? 4 : 2, k.rgb(255, 255, 255)),
    isUnlocked ? k.area() : null,
    { portId, isUnlocked }
  ].filter(Boolean));

  // Glow effect for current port
  if (isCurrent) {
    k.add([
      k.circle(35),
      k.pos(port.x, port.y),
      k.anchor('center'),
      k.color(255, 255, 200),
      k.opacity(0.3),
      'glow'
    ]);
  }

  // Port label
  k.add([
    k.text(port.name, { size: 14 }),
    k.pos(port.x, port.y + 30),
    k.anchor('center'),
    k.color(isUnlocked ? 255 : 120, isUnlocked ? 255 : 120, isUnlocked ? 255 : 120)
  ]);

  if (isUnlocked && !isCurrent) {
    node.onHover(() => {
      node.scale = k.vec2(1.2);
      node.color = k.rgb(255, 220, 150);
    });

    node.onHoverEnd(() => {
      node.scale = k.vec2(1);
      node.color = k.rgb(...port.color);
    });

    node.onClick(() => {
      // Start voyage
      k.go('voyage', portId);
    });
  }

  return node;
}

// Particles
function spawnCoins(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const coin = k.add([
      k.circle(6),
      k.pos(x + k.rand(-20, 20), y),
      k.color(255, 215, 0),
      k.outline(2, k.rgb(139, 90, 43)),
      k.opacity(1),
      k.move(k.vec2(k.rand(-1, 1), -1).unit(), k.rand(100, 200)),
      k.lifespan(0.8, { fade: 0.3 })
    ]);
  }
}

// Main menu scene
k.scene('menu', () => {
  window.gameState.scene = 'menu';

  // Parchment background
  k.add([
    k.rect(1280, 720),
    k.color(245, 230, 211)
  ]);

  // Decorative border
  k.add([
    k.rect(1240, 680),
    k.pos(20, 20),
    k.outline(4, k.rgb(139, 90, 43)),
    k.color(0, 0, 0),
    k.opacity(0)
  ]);

  // Title with shadow
  k.add([
    k.text('SPICE ROUTE', { size: 72 }),
    k.pos(642, 152),
    k.anchor('center'),
    k.color(100, 60, 30),
    k.opacity(0.3)
  ]);

  k.add([
    k.text('SPICE ROUTE', { size: 72 }),
    k.pos(640, 150),
    k.anchor('center'),
    k.color(139, 69, 19)
  ]);

  // Subtitle
  k.add([
    k.text('A Trading Simulation', { size: 28 }),
    k.pos(640, 220),
    k.anchor('center'),
    k.color(100, 80, 60)
  ]);

  // Description
  k.add([
    k.text('Build a spice trading empire in the Age of Exploration.', { size: 18 }),
    k.pos(640, 320),
    k.anchor('center'),
    k.color(80, 60, 40)
  ]);

  k.add([
    k.text('Buy trade goods, sail to foreign ports,', { size: 16 }),
    k.pos(640, 360),
    k.anchor('center'),
    k.color(80, 60, 40)
  ]);

  k.add([
    k.text('trade for spices, and fulfill Royal Orders!', { size: 16 }),
    k.pos(640, 385),
    k.anchor('center'),
    k.color(80, 60, 40)
  ]);

  // Start button
  createButton(640, 500, 'START TRADING', () => {
    // Reset game
    gameData = {
      ducats: STARTING_DUCATS,
      year: STARTING_YEAR,
      yearProgress: 0,
      currentPort: 'lisbon',
      cargo: { textiles: 0, glassware: 0, weapons: 0, pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
      warehouse: { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
      currentOrder: 0,
      delivered: {},
      reputation: 1,
      unlockedPorts: ['lisbon', 'cape_verde']
    };
    updateGameState();
    k.go('map');
  }, 200, 60);

  // Credits
  k.add([
    k.text('WASD/Arrows to navigate | Click to interact', { size: 14 }),
    k.pos(640, 650),
    k.anchor('center'),
    k.color(120, 100, 80)
  ]);
});

// Map scene
k.scene('map', () => {
  window.gameState.scene = 'map';
  updateGameState();

  // Ocean background
  k.add([
    k.rect(1280, 720),
    k.color(30, 80, 120)
  ]);

  // Wave lines
  for (let i = 0; i < 10; i++) {
    k.add([
      k.rect(1280, 2),
      k.pos(0, 200 + i * 40),
      k.color(40, 90, 130),
      k.opacity(0.5)
    ]);
  }

  // Land masses (simplified)
  k.add([
    k.rect(300, 200),
    k.pos(50, 50),
    k.color(139, 119, 101),
    k.opacity(0.8)
  ]);

  k.add([
    k.rect(200, 400),
    k.pos(350, 250),
    k.color(139, 119, 101),
    k.opacity(0.6)
  ]);

  k.add([
    k.rect(500, 250),
    k.pos(700, 200),
    k.color(139, 119, 101),
    k.opacity(0.7)
  ]);

  // Trade routes (drawn as thin rectangles)
  const routes = [
    ['lisbon', 'cape_verde'],
    ['cape_verde', 'gold_coast'],
    ['gold_coast', 'mombasa'],
    ['mombasa', 'calicut'],
    ['calicut', 'ceylon'],
    ['ceylon', 'malacca'],
    ['malacca', 'moluccas']
  ];

  routes.forEach(([from, to]) => {
    const fromPort = PORTS[from];
    const toPort = PORTS[to];
    const unlocked = gameData.unlockedPorts.includes(from) && gameData.unlockedPorts.includes(to);

    // Calculate line properties
    const dx = toPort.x - fromPort.x;
    const dy = toPort.y - fromPort.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (fromPort.x + toPort.x) / 2;
    const midY = (fromPort.y + toPort.y) / 2;

    k.add([
      k.rect(length, 2),
      k.pos(midX, midY),
      k.anchor('center'),
      k.rotate(angle * 180 / Math.PI),
      k.color(unlocked ? 255 : 100, unlocked ? 220 : 100, unlocked ? 150 : 100),
      k.opacity(0.6)
    ]);
  });

  // Create port nodes
  for (const portId in PORTS) {
    createPortNode(portId, PORTS[portId]);
  }

  // HUD - Top bar
  k.add([
    k.rect(1280, 60),
    k.color(26, 58, 92),
    k.opacity(0.9)
  ]);

  // Ducats display
  const ducatsText = k.add([
    k.text(`Ducats: ${gameData.ducats}`, { size: 20 }),
    k.pos(20, 20),
    k.color(255, 215, 0)
  ]);

  // Year display
  k.add([
    k.text(`Year: ${gameData.year}`, { size: 20 }),
    k.pos(200, 20),
    k.color(255, 255, 255)
  ]);

  // Reputation
  let repStars = '';
  for (let i = 0; i < 5; i++) {
    repStars += i < gameData.reputation ? '★' : '☆';
  }
  k.add([
    k.text(`Rep: ${repStars}`, { size: 18 }),
    k.pos(350, 20),
    k.color(255, 215, 0)
  ]);

  // Current order
  const order = ORDERS[gameData.currentOrder];
  if (order) {
    let orderText = `Order #${order.number}: `;
    for (const spice in order.requirements) {
      const delivered = gameData.delivered[spice] || 0;
      const required = order.requirements[spice];
      orderText += `${spice} ${delivered}/${required}  `;
    }
    k.add([
      k.text(orderText, { size: 16 }),
      k.pos(550, 22),
      k.color(200, 200, 200)
    ]);
  }

  // Bottom panel - Cargo
  k.add([
    k.rect(1280, 80),
    k.pos(0, 640),
    k.color(26, 58, 92),
    k.opacity(0.9)
  ]);

  // Cargo display
  const totalCargo = getTotalCargo();
  k.add([
    k.text(`Cargo: ${totalCargo}/${CARGO_CAPACITY}`, { size: 16 }),
    k.pos(20, 660),
    k.color(255, 255, 255)
  ]);

  // Cargo bar
  k.add([
    k.rect(200, 15),
    k.pos(150, 660),
    k.color(60, 60, 60)
  ]);

  k.add([
    k.rect(200 * (totalCargo / CARGO_CAPACITY), 15),
    k.pos(150, 660),
    k.color(100, 200, 100)
  ]);

  // Cargo items
  let cargoX = 400;
  for (const item in gameData.cargo) {
    if (gameData.cargo[item] > 0) {
      k.add([
        k.text(`${item.charAt(0).toUpperCase() + item.slice(1)}: ${gameData.cargo[item]}`, { size: 14 }),
        k.pos(cargoX, 660),
        k.color(200, 200, 200)
      ]);
      cargoX += 120;
    }
  }

  // Trade button (if in Lisbon)
  if (gameData.currentPort === 'lisbon') {
    createButton(1100, 680, 'TRADE', () => k.go('trade'), 120, 40);
  }

  // Instructions
  k.add([
    k.text('Click a port to sail there', { size: 14 }),
    k.pos(640, 600),
    k.anchor('center'),
    k.color(200, 200, 200),
    k.opacity(0.8)
  ]);
});

// Trade scene (Lisbon marketplace)
k.scene('trade', () => {
  window.gameState.scene = 'trade';
  updateGameState();

  // Background
  k.add([
    k.rect(1280, 720),
    k.color(245, 230, 211)
  ]);

  // Title
  k.add([
    k.text('LISBON MARKETPLACE', { size: 36 }),
    k.pos(640, 40),
    k.anchor('center'),
    k.color(139, 69, 19)
  ]);

  // Ducats
  const ducatsText = k.add([
    k.text(`Ducats: ${gameData.ducats}`, { size: 24 }),
    k.pos(1100, 30),
    k.color(139, 90, 43)
  ]);

  // Cargo
  const cargoText = k.add([
    k.text(`Cargo: ${getTotalCargo()}/${CARGO_CAPACITY}`, { size: 18 }),
    k.pos(1100, 60),
    k.color(100, 80, 60)
  ]);

  // Buy Trade Goods section
  k.add([
    k.text('BUY TRADE GOODS', { size: 24 }),
    k.pos(250, 100),
    k.anchor('center'),
    k.color(44, 44, 44)
  ]);

  let buyY = 150;
  for (const good in GOODS) {
    const price = GOODS[good].buyLisbon;
    const owned = gameData.cargo[good];

    k.add([
      k.text(`${good.charAt(0).toUpperCase() + good.slice(1)}`, { size: 18 }),
      k.pos(80, buyY),
      k.color(60, 40, 20)
    ]);

    k.add([
      k.text(`Price: ${price}`, { size: 16 }),
      k.pos(200, buyY),
      k.color(100, 80, 60)
    ]);

    k.add([
      k.text(`Owned: ${owned}`, { size: 16 }),
      k.pos(300, buyY),
      k.color(100, 80, 60)
    ]);

    // Buy buttons
    [5, 10, 25].forEach((amount, i) => {
      createButton(400 + i * 60, buyY + 10, `+${amount}`, () => {
        const cost = price * amount;
        if (canAfford(cost) && getTotalCargo() + amount <= CARGO_CAPACITY) {
          gameData.ducats -= cost;
          gameData.cargo[good] += amount;
          ducatsText.text = `Ducats: ${gameData.ducats}`;
          cargoText.text = `Cargo: ${getTotalCargo()}/${CARGO_CAPACITY}`;
          spawnCoins(400 + i * 60, buyY, 3);
          updateGameState();
        } else {
          k.shake(5);
        }
      }, 50, 35);
    });

    buyY += 60;
  }

  // Sell Spices section (warehouse)
  k.add([
    k.text('SELL SPICES (Warehouse)', { size: 24 }),
    k.pos(850, 100),
    k.anchor('center'),
    k.color(44, 44, 44)
  ]);

  let sellY = 150;
  for (const spice in SPICES) {
    const price = SPICES[spice].sellLisbon;
    const owned = gameData.warehouse[spice];

    k.add([
      k.text(`${spice.charAt(0).toUpperCase() + spice.slice(1)}`, { size: 18 }),
      k.pos(680, sellY),
      k.color(60, 40, 20)
    ]);

    k.add([
      k.text(`Price: ${price}`, { size: 16 }),
      k.pos(800, sellY),
      k.color(100, 80, 60)
    ]);

    const ownedText = k.add([
      k.text(`Owned: ${owned}`, { size: 16 }),
      k.pos(900, sellY),
      k.color(100, 80, 60)
    ]);

    // Sell buttons
    [5, 10, 25].forEach((amount, i) => {
      createButton(1000 + i * 60, sellY + 10, `-${amount}`, () => {
        if (gameData.warehouse[spice] >= amount) {
          gameData.warehouse[spice] -= amount;
          gameData.ducats += price * amount;
          ducatsText.text = `Ducats: ${gameData.ducats}`;
          ownedText.text = `Owned: ${gameData.warehouse[spice]}`;
          spawnCoins(1000 + i * 60, sellY, 5);
          updateGameState();
        } else {
          k.shake(5);
        }
      }, 50, 35);
    });

    sellY += 60;
  }

  // Deliver to Royal Order section
  const order = ORDERS[gameData.currentOrder];
  if (order) {
    k.add([
      k.text(`ROYAL ORDER #${order.number}`, { size: 24 }),
      k.pos(640, 450),
      k.anchor('center'),
      k.color(139, 0, 0)
    ]);

    let orderY = 490;
    for (const spice in order.requirements) {
      const required = order.requirements[spice];
      const delivered = gameData.delivered[spice] || 0;
      const remaining = required - delivered;
      const inWarehouse = gameData.warehouse[spice];

      k.add([
        k.text(`${spice}: ${delivered}/${required}`, { size: 18 }),
        k.pos(400, orderY),
        k.color(60, 40, 20)
      ]);

      // Progress bar
      k.add([
        k.rect(200, 20),
        k.pos(550, orderY),
        k.color(100, 100, 100)
      ]);

      k.add([
        k.rect(200 * (delivered / required), 20),
        k.pos(550, orderY),
        k.color(34, 139, 34)
      ]);

      // Deliver button
      if (inWarehouse > 0 && remaining > 0) {
        const deliverAmount = Math.min(inWarehouse, remaining);
        createButton(850, orderY + 10, `Deliver ${deliverAmount}`, () => {
          gameData.warehouse[spice] -= deliverAmount;
          gameData.delivered[spice] = (gameData.delivered[spice] || 0) + deliverAmount;
          spawnCoins(850, orderY, 10);
          k.shake(3);

          // Check if order complete
          let complete = true;
          for (const s in order.requirements) {
            if ((gameData.delivered[s] || 0) < order.requirements[s]) {
              complete = false;
              break;
            }
          }

          if (complete) {
            gameData.ducats += order.reward;
            gameData.currentOrder++;
            gameData.delivered = {};

            // Unlock next port
            if (gameData.currentOrder === 1) gameData.unlockedPorts.push('gold_coast');
            if (gameData.currentOrder === 2) gameData.unlockedPorts.push('mombasa');
            if (gameData.currentOrder === 3) gameData.unlockedPorts.push('calicut');

            if (gameData.currentOrder >= ORDERS.length) {
              k.go('victory');
            } else {
              k.go('trade');
            }
          } else {
            k.go('trade');
          }

          updateGameState();
        }, 120, 35);
      }

      orderY += 40;
    }
  }

  // Back button
  createButton(100, 680, 'BACK TO MAP', () => k.go('map'), 150, 45);
});

// Voyage scene
k.scene('voyage', (destination) => {
  window.gameState.scene = 'voyage';
  updateGameState();

  const destPort = PORTS[destination];

  // Ocean background
  k.add([
    k.rect(1280, 720),
    k.color(20, 60, 100)
  ]);

  // Animated waves
  for (let i = 0; i < 20; i++) {
    const wave = k.add([
      k.rect(100, 4),
      k.pos(k.rand(0, 1280), k.rand(100, 600)),
      k.color(40, 80, 120),
      k.opacity(0.5),
      'wave'
    ]);

    wave.onUpdate(() => {
      wave.pos.x += 0.5;
      if (wave.pos.x > 1280) wave.pos.x = -100;
    });
  }

  // Ship
  const ship = k.add([
    k.polygon([k.vec2(0, 20), k.vec2(60, 20), k.vec2(70, 10), k.vec2(60, 0), k.vec2(10, 0)]),
    k.pos(200, 360),
    k.color(139, 90, 43),
    k.anchor('center'),
    'ship'
  ]);

  // Sail
  ship.add([
    k.polygon([k.vec2(25, -10), k.vec2(25, -50), k.vec2(45, -30)]),
    k.color(240, 230, 220)
  ]);

  // Voyage progress
  let progress = 0;
  const voyageTime = 3; // seconds

  k.add([
    k.text(`Sailing to ${destPort.name}...`, { size: 32 }),
    k.pos(640, 100),
    k.anchor('center'),
    k.color(255, 255, 255)
  ]);

  // Progress bar background
  k.add([
    k.rect(600, 30),
    k.pos(340, 200),
    k.color(60, 60, 60)
  ]);

  // Progress bar fill
  const progressBar = k.add([
    k.rect(0, 30),
    k.pos(340, 200),
    k.color(100, 200, 100)
  ]);

  ship.onUpdate(() => {
    progress += k.dt() / voyageTime;

    // Move ship
    ship.pos.x = 200 + progress * 800;
    ship.pos.y = 360 + Math.sin(k.time() * 3) * 10;

    // Update progress bar
    progressBar.width = 600 * Math.min(progress, 1);

    // Complete voyage
    if (progress >= 1) {
      gameData.currentPort = destination;
      gameData.year += 0.5;
      updateGameState();
      k.go('port', destination);
    }
  });
});

// Port scene (foreign marketplace)
k.scene('port', (portId) => {
  window.gameState.scene = 'port';
  updateGameState();

  const port = PORTS[portId];

  // Background
  k.add([
    k.rect(1280, 720),
    k.color(245, 230, 211)
  ]);

  // Title
  k.add([
    k.text(`${port.name} MARKETPLACE`, { size: 36 }),
    k.pos(640, 40),
    k.anchor('center'),
    k.color(139, 69, 19)
  ]);

  // Ducats
  const ducatsText = k.add([
    k.text(`Ducats: ${gameData.ducats}`, { size: 24 }),
    k.pos(1100, 30),
    k.color(139, 90, 43)
  ]);

  // Cargo
  const cargoText = k.add([
    k.text(`Cargo: ${getTotalCargo()}/${CARGO_CAPACITY}`, { size: 18 }),
    k.pos(1100, 60),
    k.color(100, 80, 60)
  ]);

  // Sell Trade Goods
  k.add([
    k.text('SELL TRADE GOODS', { size: 24 }),
    k.pos(250, 100),
    k.anchor('center'),
    k.color(44, 44, 44)
  ]);

  let sellY = 150;
  for (const good in GOODS) {
    const price = GOODS[good].sellPrices[portId] || 0;
    if (price === 0) continue;

    const owned = gameData.cargo[good];

    k.add([
      k.text(`${good.charAt(0).toUpperCase() + good.slice(1)}`, { size: 18 }),
      k.pos(80, sellY),
      k.color(60, 40, 20)
    ]);

    k.add([
      k.text(`Price: ${price}`, { size: 16 }),
      k.pos(200, sellY),
      k.color(100, 180, 100)
    ]);

    const ownedText = k.add([
      k.text(`Owned: ${owned}`, { size: 16 }),
      k.pos(300, sellY),
      k.color(100, 80, 60)
    ]);

    [5, 10, 25].forEach((amount, i) => {
      createButton(400 + i * 60, sellY + 10, `-${amount}`, () => {
        if (gameData.cargo[good] >= amount) {
          gameData.cargo[good] -= amount;
          gameData.ducats += price * amount;
          ducatsText.text = `Ducats: ${gameData.ducats}`;
          cargoText.text = `Cargo: ${getTotalCargo()}/${CARGO_CAPACITY}`;
          ownedText.text = `Owned: ${gameData.cargo[good]}`;
          spawnCoins(400 + i * 60, sellY, 5);
          updateGameState();
        } else {
          k.shake(5);
        }
      }, 50, 35);
    });

    sellY += 60;
  }

  // Buy Spices
  k.add([
    k.text('BUY SPICES', { size: 24 }),
    k.pos(850, 100),
    k.anchor('center'),
    k.color(44, 44, 44)
  ]);

  let buyY = 150;
  for (const spice in SPICES) {
    const price = SPICES[spice].buyPrices[portId];
    if (!price) continue;

    const owned = gameData.cargo[spice];

    k.add([
      k.text(`${spice.charAt(0).toUpperCase() + spice.slice(1)}`, { size: 18 }),
      k.pos(680, buyY),
      k.color(60, 40, 20)
    ]);

    k.add([
      k.text(`Price: ${price}`, { size: 16 }),
      k.pos(800, buyY),
      k.color(100, 80, 60)
    ]);

    const ownedText = k.add([
      k.text(`Owned: ${owned}`, { size: 16 }),
      k.pos(900, buyY),
      k.color(100, 80, 60)
    ]);

    [5, 10, 25].forEach((amount, i) => {
      createButton(1000 + i * 60, buyY + 10, `+${amount}`, () => {
        const cost = price * amount;
        if (canAfford(cost) && getTotalCargo() + amount <= CARGO_CAPACITY) {
          gameData.ducats -= cost;
          gameData.cargo[spice] += amount;
          ducatsText.text = `Ducats: ${gameData.ducats}`;
          cargoText.text = `Cargo: ${getTotalCargo()}/${CARGO_CAPACITY}`;
          ownedText.text = `Owned: ${gameData.cargo[spice]}`;
          spawnCoins(1000 + i * 60, buyY, 3);
          updateGameState();
        } else {
          k.shake(5);
        }
      }, 50, 35);
    });

    buyY += 60;
  }

  // Return to Lisbon button
  createButton(640, 600, 'RETURN TO LISBON', () => {
    // Move spices from cargo to warehouse
    for (const spice in SPICES) {
      if (gameData.cargo[spice] > 0) {
        gameData.warehouse[spice] += gameData.cargo[spice];
        gameData.cargo[spice] = 0;
      }
    }
    gameData.currentPort = 'lisbon';
    gameData.year += 0.5;
    updateGameState();
    k.go('map');
  }, 200, 50);
});

// Victory scene
k.scene('victory', () => {
  window.gameState.scene = 'victory';

  k.add([
    k.rect(1280, 720),
    k.color(245, 230, 211)
  ]);

  k.add([
    k.text('VICTORY!', { size: 72 }),
    k.pos(640, 200),
    k.anchor('center'),
    k.color(34, 139, 34)
  ]);

  k.add([
    k.text('You have completed all Royal Orders!', { size: 28 }),
    k.pos(640, 300),
    k.anchor('center'),
    k.color(60, 40, 20)
  ]);

  k.add([
    k.text(`Final Ducats: ${gameData.ducats}`, { size: 24 }),
    k.pos(640, 380),
    k.anchor('center'),
    k.color(139, 90, 43)
  ]);

  // Confetti particles
  for (let i = 0; i < 50; i++) {
    k.add([
      k.circle(8),
      k.pos(k.rand(0, 1280), k.rand(-100, 0)),
      k.color(k.rand(100, 255), k.rand(100, 255), k.rand(100, 255)),
      k.move(k.DOWN, k.rand(50, 150)),
      k.lifespan(5)
    ]);
  }

  createButton(640, 500, 'PLAY AGAIN', () => k.go('menu'), 180, 50);
});

// Start game
k.go('menu');
