// Motherload - Mining Game (Excalibur folder, using Canvas for headless testing)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 32;
const WORLD_WIDTH = 25;
const WORLD_HEIGHT = 200;

canvas.width = WIDTH;
canvas.height = HEIGHT;

// Minerals
const MINERALS = [
  { name: 'Ironium', color: '#8B4513', value: 30, minDepth: 0, maxDepth: 50, weight: 1 },
  { name: 'Bronzium', color: '#CD7F32', value: 60, minDepth: 5, maxDepth: 80, weight: 1 },
  { name: 'Silverium', color: '#C0C0C0', value: 100, minDepth: 10, maxDepth: 110, weight: 2 },
  { name: 'Goldium', color: '#FFD700', value: 250, minDepth: 20, maxDepth: 140, weight: 2 },
  { name: 'Platinium', color: '#E5E4E2', value: 750, minDepth: 40, maxDepth: 170, weight: 3 },
  { name: 'Einsteinium', color: '#00FF00', value: 2000, minDepth: 65, maxDepth: 190, weight: 3 },
  { name: 'Emerald', color: '#50C878', value: 5000, minDepth: 95, maxDepth: 200, weight: 4 },
  { name: 'Ruby', color: '#E0115F', value: 20000, minDepth: 125, maxDepth: 200, weight: 4 },
  { name: 'Diamond', color: '#B9F2FF', value: 100000, minDepth: 155, maxDepth: 200, weight: 5 },
  { name: 'Amazonite', color: '#00FFEF', value: 500000, minDepth: 185, maxDepth: 200, weight: 5 }
];

// Upgrade costs
const UPGRADE_COSTS = [750, 2000, 5000, 20000, 100000, 500000];

// Game state
const game = {
  screen: 'title',
  world: [],
  player: {
    x: 12, y: 1, vx: 0, vy: 0,
    fuel: 10, maxFuel: 10,
    hull: 100, maxHull: 100,
    cargo: [], cargoMax: 7,
    money: 0,
    drilling: false, drillProgress: 0, drillTarget: null,
    upgrades: { drill: 0, hull: 0, engine: 0, fuel: 0, radiator: 0, cargo: 0 }
  },
  camera: { y: 0 },
  keys: {},
  stats: { maxDepth: 0, earned: 0 },
  shake: 0,
  particles: [],
  messages: []
};

// Expose for testing
window.gameState = game;

// Generate world
function generateWorld() {
  game.world = [];
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        row.push({ type: 'sky' });
      } else if (y === 1) {
        // Surface with buildings
        if (x >= 2 && x <= 4) row.push({ type: 'building', building: 'fuel' });
        else if (x >= 8 && x <= 10) row.push({ type: 'building', building: 'shop' });
        else if (x >= 14 && x <= 16) row.push({ type: 'building', building: 'sell' });
        else if (x >= 20 && x <= 22) row.push({ type: 'building', building: 'repair' });
        else row.push({ type: 'sky' });
      } else {
        // Underground
        const depth = y - 2;
        let type = 'dirt';

        // Harder terrain at depth
        const rockChance = Math.min(0.4, depth / 200);
        if (Math.random() < rockChance) type = 'rock';
        if (depth > 50 && Math.random() < (depth - 50) / 400) type = 'hardrock';

        // Mineral spawn
        let mineral = null;
        if (Math.random() < 0.12) {
          const eligible = MINERALS.filter(m => depth >= m.minDepth && depth <= m.maxDepth);
          if (eligible.length > 0) {
            const weights = eligible.map(m => 1 / m.value);
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalWeight;
            for (let i = 0; i < eligible.length; i++) {
              r -= weights[i];
              if (r <= 0) {
                mineral = eligible[i];
                break;
              }
            }
          }
        }

        // Hazards
        let hazard = null;
        if (depth > 15 && Math.random() < Math.min(0.04, (depth - 15) / 300)) {
          hazard = depth < 100 ? 'gas' : (Math.random() < 0.5 ? 'gas' : 'lava');
        }

        row.push({ type, mineral, hazard });
      }
    }
    game.world.push(row);
  }
}

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    game.screen = 'game';
    generateWorld();
  } else if (game.screen === 'gameover' && e.key === 'Enter') {
    resetGame();
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

function resetGame() {
  game.screen = 'title';
  game.player = {
    x: 12, y: 1, vx: 0, vy: 0,
    fuel: 10, maxFuel: 10,
    hull: 100, maxHull: 100,
    cargo: [], cargoMax: 7,
    money: 0,
    drilling: false, drillProgress: 0, drillTarget: null,
    upgrades: { drill: 0, hull: 0, engine: 0, fuel: 0, radiator: 0, cargo: 0 }
  };
  game.stats = { maxDepth: 0, earned: 0 };
}

// Get upgrade values
function getUpgradeValue(type, level) {
  switch (type) {
    case 'drill': return 1 + level * 0.5;
    case 'hull': return 100 + level * 100;
    case 'engine': return 1 + level * 0.25;
    case 'fuel': return 10 + level * 15;
    case 'radiator': return level * 0.15;
    case 'cargo': return 7 + level * 5;
  }
  return 0;
}

function applyUpgrades() {
  const p = game.player;
  p.maxFuel = getUpgradeValue('fuel', p.upgrades.fuel);
  p.maxHull = getUpgradeValue('hull', p.upgrades.hull);
  p.cargoMax = getUpgradeValue('cargo', p.upgrades.cargo);
}

// Update game
function update(dt) {
  if (game.screen !== 'game') return;

  const p = game.player;
  const engineMult = getUpgradeValue('engine', p.upgrades.engine);
  const drillMult = getUpgradeValue('drill', p.upgrades.drill);

  // Track max depth
  const depth = Math.max(0, p.y - 2);
  if (depth > game.stats.maxDepth) game.stats.maxDepth = depth;

  // Drilling
  if (p.drilling) {
    p.drillProgress += dt * drillMult;
    const target = game.world[p.drillTarget.y]?.[p.drillTarget.x];

    let drillTime = 0.5;
    if (target?.type === 'rock') drillTime = 0.75;
    if (target?.type === 'hardrock') drillTime = 1.25;

    if (p.drillProgress >= drillTime) {
      // Complete drilling
      if (target) {
        // Collect mineral
        if (target.mineral && p.cargo.length < p.cargoMax) {
          p.cargo.push(target.mineral);
          addParticles(p.drillTarget.x * TILE_SIZE, p.drillTarget.y * TILE_SIZE, target.mineral.color, 5);
        }

        // Hazard damage
        if (target.hazard) {
          const baseDamage = target.hazard === 'gas' ?
            (depth * 32 + 3000) / 15 :
            (depth * 32 + 2000) / 10;
          const resist = getUpgradeValue('radiator', p.upgrades.radiator);
          const damage = Math.floor(baseDamage * (1 - resist));
          p.hull -= damage;
          game.shake = 15;
          addMessage(`${target.hazard.toUpperCase()} EXPLOSION! -${damage} HP`);
          addParticles(p.drillTarget.x * TILE_SIZE, p.drillTarget.y * TILE_SIZE,
            target.hazard === 'gas' ? '#00ff00' : '#ff4400', 15);
        }

        target.type = 'empty';
        target.mineral = null;
        target.hazard = null;
      }

      p.x = p.drillTarget.x;
      p.y = p.drillTarget.y;
      p.drilling = false;
      p.drillTarget = null;

      // Fuel cost
      p.fuel -= 0.03;
    }
  } else {
    // Movement
    const moveSpeed = 4 * engineMult;
    const gravity = 8;

    // Check ground
    const below = game.world[Math.floor(p.y) + 1]?.[Math.floor(p.x)];
    const onGround = below && below.type !== 'empty' && below.type !== 'sky';

    // Horizontal input
    if (game.keys['a'] || game.keys['arrowleft']) {
      p.vx = -moveSpeed;
      // Check for drilling left
      const left = game.world[Math.floor(p.y)]?.[Math.floor(p.x) - 1];
      if (left && left.type !== 'empty' && left.type !== 'sky' && left.type !== 'building') {
        startDrill(Math.floor(p.x) - 1, Math.floor(p.y));
      }
    } else if (game.keys['d'] || game.keys['arrowright']) {
      p.vx = moveSpeed;
      // Check for drilling right
      const right = game.world[Math.floor(p.y)]?.[Math.floor(p.x) + 1];
      if (right && right.type !== 'empty' && right.type !== 'sky' && right.type !== 'building') {
        startDrill(Math.floor(p.x) + 1, Math.floor(p.y));
      }
    } else {
      p.vx = 0;
    }

    // Vertical input
    if (game.keys['w'] || game.keys['arrowup']) {
      if (p.fuel > 0) {
        p.vy = -moveSpeed * 0.5;
        p.fuel -= 0.05 * dt;
      }
    } else if (game.keys['s'] || game.keys['arrowdown']) {
      // Drill down
      const down = game.world[Math.floor(p.y) + 1]?.[Math.floor(p.x)];
      if (down && down.type !== 'empty' && down.type !== 'sky' && down.type !== 'building') {
        startDrill(Math.floor(p.x), Math.floor(p.y) + 1);
      } else if (!onGround) {
        p.vy += gravity * dt * 2;
      }
    } else if (!onGround) {
      // Gravity
      p.vy += gravity * dt;
    } else {
      p.vy = 0;
    }

    // Terminal velocity
    p.vy = Math.min(p.vy, 12);

    // Apply velocity
    const newX = p.x + p.vx * dt;
    const newY = p.y + p.vy * dt;

    // Horizontal collision
    const targetTileX = game.world[Math.floor(p.y)]?.[Math.floor(newX)];
    if (!targetTileX || (targetTileX.type !== 'empty' && targetTileX.type !== 'sky' && targetTileX.type !== 'building')) {
      // Can't move there
    } else if (newX >= 0 && newX < WORLD_WIDTH) {
      p.x = newX;
      p.fuel -= Math.abs(p.vx) * 0.02 * dt;
    }

    // Vertical collision
    const targetTileY = game.world[Math.floor(newY)]?.[Math.floor(p.x)];
    if (!targetTileY || (targetTileY.type !== 'empty' && targetTileY.type !== 'sky' && targetTileY.type !== 'building')) {
      // Fall damage if going down fast
      if (p.vy > 3) {
        const fallDamage = Math.floor((p.vy - 3) * 10);
        p.hull -= fallDamage;
        game.shake = 10;
        addParticles(p.x * TILE_SIZE, p.y * TILE_SIZE, '#ff8800', 10);
      }
      p.vy = 0;
    } else if (newY >= 0 && newY < WORLD_HEIGHT) {
      p.y = newY;
    }
  }

  // Building interactions
  if (game.keys['e']) {
    game.keys['e'] = false;
    const tile = game.world[Math.floor(p.y)]?.[Math.floor(p.x)];
    if (tile?.type === 'building') {
      handleBuilding(tile.building);
    }
  }

  // Camera
  const targetCamY = Math.max(0, (p.y - 8) * TILE_SIZE);
  game.camera.y += (targetCamY - game.camera.y) * 0.1;

  // Screen shake
  if (game.shake > 0) game.shake -= dt * 30;

  // Particles
  game.particles = game.particles.filter(part => {
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vy += 200 * dt;
    part.life -= dt;
    return part.life > 0;
  });

  // Messages
  game.messages = game.messages.filter(m => {
    m.life -= dt;
    return m.life > 0;
  });

  // Game over
  if (p.hull <= 0) {
    game.screen = 'gameover';
  }

  if (p.fuel <= 0 && p.y > 2) {
    addMessage('OUT OF FUEL!');
    p.hull -= dt * 10;
  }

  p.fuel = Math.max(0, p.fuel);
}

function startDrill(x, y) {
  if (game.player.fuel <= 0) return;
  game.player.drilling = true;
  game.player.drillProgress = 0;
  game.player.drillTarget = { x, y };
}

function handleBuilding(type) {
  const p = game.player;

  switch (type) {
    case 'fuel':
      const fuelNeeded = p.maxFuel - p.fuel;
      const fuelCost = Math.ceil(fuelNeeded * 2);
      if (p.money >= fuelCost) {
        p.money -= fuelCost;
        p.fuel = p.maxFuel;
        addMessage(`Refueled! -$${fuelCost}`);
      } else {
        addMessage('Not enough money!');
      }
      break;

    case 'repair':
      const hullNeeded = p.maxHull - p.hull;
      const repairCost = Math.ceil(hullNeeded);
      if (p.money >= repairCost && hullNeeded > 0) {
        p.money -= repairCost;
        p.hull = p.maxHull;
        addMessage(`Repaired! -$${repairCost}`);
      } else if (hullNeeded === 0) {
        addMessage('Hull at full health!');
      } else {
        addMessage('Not enough money!');
      }
      break;

    case 'sell':
      if (p.cargo.length > 0) {
        let total = 0;
        for (const m of p.cargo) {
          total += m.value;
        }
        p.money += total;
        game.stats.earned += total;
        addMessage(`Sold minerals! +$${total.toLocaleString()}`);
        p.cargo = [];
      } else {
        addMessage('No cargo to sell!');
      }
      break;

    case 'shop':
      game.screen = 'shop';
      break;
  }
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200 - 100,
      color,
      life: 0.5 + Math.random() * 0.5
    });
  }
}

function addMessage(text) {
  game.messages.push({ text, life: 3 });
}

// Render
function render() {
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (game.screen === 'title') {
    renderTitle();
  } else if (game.screen === 'game') {
    renderGame();
  } else if (game.screen === 'shop') {
    renderShop();
  } else if (game.screen === 'gameover') {
    renderGameOver();
  }
}

function renderTitle() {
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('MOTHERLOAD', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('A Mars Mining Adventure', WIDTH/2, 250);

  ctx.fillStyle = '#8B4513';
  ctx.font = '16px Courier New';
  ctx.fillText('WASD/Arrows to move, drill down to collect minerals', WIDTH/2, 350);
  ctx.fillText('Return to surface to sell. Use E to interact.', WIDTH/2, 380);

  ctx.fillStyle = '#FFD700';
  ctx.font = '24px Courier New';
  ctx.fillText('Press ENTER to Start', WIDTH/2, 480);
}

function renderGame() {
  const p = game.player;
  const offsetX = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
  const offsetY = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;

  ctx.save();
  ctx.translate(offsetX, offsetY - game.camera.y);

  // Render visible tiles
  const startY = Math.floor(game.camera.y / TILE_SIZE);
  const endY = Math.min(WORLD_HEIGHT, startY + 20);

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const tile = game.world[y]?.[x];
      if (!tile) continue;

      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      switch (tile.type) {
        case 'sky':
          ctx.fillStyle = y === 0 ? '#4a2800' : '#3a1800';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
        case 'building':
          ctx.fillStyle = '#4a2800';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = tile.building === 'fuel' ? '#ff4400' :
                         tile.building === 'shop' ? '#44ff00' :
                         tile.building === 'sell' ? '#FFD700' :
                         '#00aaff';
          ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.fillStyle = '#fff';
          ctx.font = '10px Courier New';
          ctx.textAlign = 'center';
          ctx.fillText(tile.building.toUpperCase(), px + TILE_SIZE/2, py + TILE_SIZE/2 + 4);
          break;
        case 'dirt':
          ctx.fillStyle = tile.hazard === 'gas' ? '#4a5030' :
                         tile.hazard === 'lava' ? '#5a3020' : '#6B4423';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Texture
          ctx.fillStyle = tile.hazard === 'gas' ? '#5a6040' :
                         tile.hazard === 'lava' ? '#6a4030' : '#8B5A3B';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(px + (x * 7 + i * 11) % 28, py + (y * 5 + i * 13) % 28, 4, 4);
          }
          break;
        case 'rock':
          ctx.fillStyle = tile.hazard === 'gas' ? '#4a5a50' :
                         tile.hazard === 'lava' ? '#5a4a40' : '#5a5a5a';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#7a7a7a';
          ctx.fillRect(px + 8, py + 8, 16, 16);
          break;
        case 'hardrock':
          ctx.fillStyle = '#3a3a3a';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#5a5a5a';
          ctx.fillRect(px + 4, py + 4, 24, 24);
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(px + 8, py + 8, 16, 16);
          break;
        case 'empty':
          ctx.fillStyle = '#1a0a00';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
      }

      // Mineral overlay
      if (tile.mineral) {
        const sparkle = Math.sin(Date.now() * 0.005 + x + y) * 0.3 + 0.7;
        ctx.fillStyle = tile.mineral.color;
        ctx.globalAlpha = sparkle;
        ctx.beginPath();
        ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Player
  const playerPx = p.x * TILE_SIZE;
  const playerPy = p.y * TILE_SIZE;

  // Pod body
  ctx.fillStyle = '#aaa';
  ctx.fillRect(playerPx + 4, playerPy + 8, 24, 20);

  // Cockpit
  ctx.fillStyle = '#4af';
  ctx.fillRect(playerPx + 8, playerPy + 4, 16, 10);

  // Drill
  ctx.fillStyle = '#666';
  ctx.fillRect(playerPx + 12, playerPy + 28, 8, 4);

  // Treads
  ctx.fillStyle = '#333';
  ctx.fillRect(playerPx + 2, playerPy + 26, 8, 6);
  ctx.fillRect(playerPx + 22, playerPy + 26, 8, 6);

  // Drilling animation
  if (p.drilling) {
    ctx.fillStyle = '#ff8800';
    const drillX = p.drillTarget.x * TILE_SIZE + 16;
    const drillY = p.drillTarget.y * TILE_SIZE + 16;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(drillX + (Math.random() - 0.5) * 20,
              drillY + (Math.random() - 0.5) * 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Particles
  for (const part of game.particles) {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // HUD
  renderHUD();
}

function renderHUD() {
  const p = game.player;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, 60);

  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.textAlign = 'left';

  // Depth
  const depth = Math.max(0, Math.floor((p.y - 2) * 32));
  ctx.fillText(`DEPTH: ${depth} ft`, 10, 20);

  // Money
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`$${p.money.toLocaleString()}`, 10, 40);

  // Fuel bar
  ctx.fillStyle = '#fff';
  ctx.fillText('FUEL:', 180, 20);
  ctx.fillStyle = '#333';
  ctx.fillRect(230, 8, 100, 16);
  const fuelPercent = p.fuel / p.maxFuel;
  ctx.fillStyle = fuelPercent < 0.2 ? '#f00' : fuelPercent < 0.5 ? '#ff0' : '#0f0';
  ctx.fillRect(230, 8, 100 * fuelPercent, 16);

  // Hull bar
  ctx.fillStyle = '#fff';
  ctx.fillText('HULL:', 180, 40);
  ctx.fillStyle = '#333';
  ctx.fillRect(230, 28, 100, 16);
  const hullPercent = p.hull / p.maxHull;
  ctx.fillStyle = hullPercent < 0.25 ? '#f00' : hullPercent < 0.5 ? '#ff0' : '#0f0';
  ctx.fillRect(230, 28, 100 * hullPercent, 16);

  // Cargo
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(`CARGO: ${p.cargo.length}/${p.cargoMax}`, 360, 20);

  // Cargo preview
  let cargoX = 360;
  for (let i = 0; i < Math.min(p.cargo.length, 10); i++) {
    ctx.fillStyle = p.cargo[i].color;
    ctx.fillRect(cargoX + i * 12, 32, 10, 10);
  }

  // Controls hint
  ctx.fillStyle = '#888';
  ctx.font = '12px Courier New';
  ctx.textAlign = 'right';
  ctx.fillText('WASD: Move | E: Interact | Surface: FUEL SHOP SELL REPAIR', WIDTH - 10, 20);

  // Messages
  ctx.textAlign = 'center';
  let msgY = 100;
  for (const msg of game.messages) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, msg.life)})`;
    ctx.font = '16px Courier New';
    ctx.fillText(msg.text, WIDTH/2, msgY);
    msgY += 25;
  }
}

function renderShop() {
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('MARS MINING CO. SHOP', WIDTH/2, 50);

  const p = game.player;
  ctx.fillStyle = '#fff';
  ctx.font = '18px Courier New';
  ctx.fillText(`Your Cash: $${p.money.toLocaleString()}`, WIDTH/2, 90);

  const upgrades = [
    { key: '1', name: 'DRILL', type: 'drill', desc: 'Drill speed' },
    { key: '2', name: 'HULL', type: 'hull', desc: 'Max HP' },
    { key: '3', name: 'ENGINE', type: 'engine', desc: 'Move speed' },
    { key: '4', name: 'FUEL TANK', type: 'fuel', desc: 'Max fuel' },
    { key: '5', name: 'RADIATOR', type: 'radiator', desc: 'Heat resist' },
    { key: '6', name: 'CARGO BAY', type: 'cargo', desc: 'Cargo slots' }
  ];

  ctx.font = '14px Courier New';
  ctx.textAlign = 'left';

  let y = 140;
  for (const up of upgrades) {
    const level = p.upgrades[up.type];
    const cost = level < 6 ? UPGRADE_COSTS[level] : 'MAX';
    const current = getUpgradeValue(up.type, level);
    const next = level < 6 ? getUpgradeValue(up.type, level + 1) : current;

    ctx.fillStyle = '#888';
    ctx.fillText(`[${up.key}]`, 100, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${up.name}`, 140, y);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Level ${level}/6`, 280, y);
    ctx.fillStyle = cost === 'MAX' ? '#888' : (p.money >= cost ? '#0f0' : '#f00');
    ctx.fillText(cost === 'MAX' ? 'MAXED' : `$${cost.toLocaleString()}`, 380, y);
    ctx.fillStyle = '#888';
    ctx.fillText(`${up.desc}: ${typeof current === 'number' ? current.toFixed(1) : current} -> ${typeof next === 'number' ? next.toFixed(1) : next}`, 500, y);

    y += 40;
  }

  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  ctx.fillText('Press 1-6 to buy, ESC to exit', WIDTH/2, 550);

  // Handle shop input
  for (let i = 1; i <= 6; i++) {
    if (game.keys[i.toString()]) {
      game.keys[i.toString()] = false;
      const up = upgrades[i - 1];
      const level = p.upgrades[up.type];
      if (level < 6) {
        const cost = UPGRADE_COSTS[level];
        if (p.money >= cost) {
          p.money -= cost;
          p.upgrades[up.type]++;
          applyUpgrades();
          addMessage(`${up.name} upgraded to Level ${level + 1}!`);
        }
      }
    }
  }

  if (game.keys['escape']) {
    game.keys['escape'] = false;
    game.screen = 'game';
  }
}

function renderGameOver() {
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Your pod was destroyed!', WIDTH/2, 260);

  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Courier New';
  ctx.fillText(`Max Depth: ${game.stats.maxDepth * 32} ft`, WIDTH/2, 340);
  ctx.fillText(`Total Earned: $${game.stats.earned.toLocaleString()}`, WIDTH/2, 370);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press ENTER to try again', WIDTH/2, 480);
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
console.log('Motherload initialized! Press ENTER to start.');
