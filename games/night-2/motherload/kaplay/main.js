// Deep Drill - Mars Mining Game (Kaplay folder, using Canvas for headless testing)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 32;
const WORLD_WIDTH = 25;
const WORLD_HEIGHT = 300;

canvas.width = WIDTH;
canvas.height = HEIGHT;

// Minerals from GDD
const MINERALS = [
  { name: 'Coal', color: '#1a1a1a', value: 10, minDepth: 0, maxDepth: 100 },
  { name: 'Copper', color: '#CD7F32', value: 25, minDepth: 20, maxDepth: 120 },
  { name: 'Iron', color: '#8a8a8a', value: 40, minDepth: 40, maxDepth: 150 },
  { name: 'Silver', color: '#C0C0C0', value: 75, minDepth: 80, maxDepth: 200 },
  { name: 'Gold', color: '#FFD700', value: 150, minDepth: 120, maxDepth: 250 },
  { name: 'Ruby', color: '#E0115F', value: 300, minDepth: 180, maxDepth: 280 },
  { name: 'Diamond', color: '#B9F2FF', value: 600, minDepth: 220, maxDepth: 300 },
  { name: 'Unobtainium', color: '#9966FF', value: 1500, minDepth: 280, maxDepth: 300 }
];

// Upgrade definitions
const UPGRADES = {
  drill: { name: 'Drill Speed', costs: [0, 150, 400, 900, 2000], values: [1.0, 1.3, 1.6, 2.0, 2.5] },
  fuel: { name: 'Fuel Tank', costs: [0, 120, 350, 800, 1800], values: [100, 150, 220, 320, 450] },
  cargo: { name: 'Cargo Hold', costs: [0, 100, 300, 700, 1500], values: [6, 10, 15, 22, 30] },
  hull: { name: 'Hull', costs: [0, 200, 500, 1200], values: [3, 5, 8, 12] },
  radar: { name: 'Radar', costs: [0, 250, 600, 1200], values: [0, 5, 10, 15] }
};

// Game state
const game = {
  screen: 'title',
  world: [],
  player: {
    x: 12,
    y: 1,
    vx: 0,
    vy: 0,
    fuel: 100,
    hp: 3,
    cargo: [],
    money: 0,
    drilling: false,
    drillProgress: 0,
    drillTarget: null,
    upgrades: { drill: 0, fuel: 0, cargo: 0, hull: 0, radar: 0 },
    deaths: 0,
    iframes: 0
  },
  camera: { y: 0 },
  keys: {},
  stats: { maxDepth: 0, totalEarned: 0, startTime: 0, playtime: 0 },
  particles: [],
  messages: [],
  selectedUpgrade: 0,
  coreCollected: false
};

// Expose for testing
window.gameState = game;

// Helper functions
function getUpgradeValue(type, level) {
  const u = UPGRADES[type];
  return u.values[Math.min(level, u.values.length - 1)];
}

function getMaxFuel() { return getUpgradeValue('fuel', game.player.upgrades.fuel); }
function getMaxCargo() { return getUpgradeValue('cargo', game.player.upgrades.cargo); }
function getMaxHP() { return getUpgradeValue('hull', game.player.upgrades.hull); }
function getDrillSpeed() { return getUpgradeValue('drill', game.player.upgrades.drill); }
function getRadarRange() { return getUpgradeValue('radar', game.player.upgrades.radar); }

// Generate world
function generateWorld() {
  game.world = [];

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        // Sky row
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

        // Rock and hardrock at depth
        if (depth > 50 && Math.random() < 0.15) type = 'rock';
        if (depth > 100 && Math.random() < 0.1) type = 'hardrock';

        // Mineral generation
        let mineral = null;
        if (Math.random() < 0.1) {
          const eligible = MINERALS.filter(m => depth >= m.minDepth && depth <= m.maxDepth);
          if (eligible.length > 0) {
            // Weight by inverse value (common minerals more frequent)
            const weights = eligible.map(m => 1 / m.value);
            const total = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * total;
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
        if (depth > 60 && Math.random() < 0.03) hazard = 'gas';
        if (depth > 180 && Math.random() < 0.02) hazard = 'lava';

        // Core at bottom
        if (y === WORLD_HEIGHT - 1 && x === 12) {
          row.push({ type: 'core' });
        } else {
          row.push({ type, mineral, hazard });
        }
      }
    }
    game.world.push(row);
  }
}

// Input
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  } else if (game.screen === 'gameover' && e.key === 'Enter') {
    game.screen = 'title';
  } else if (game.screen === 'victory' && e.key === 'Enter') {
    game.screen = 'title';
  } else if (game.screen === 'shop') {
    handleShopInput(e);
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

function startGame() {
  game.screen = 'game';
  game.player = {
    x: 12, y: 1, vx: 0, vy: 0,
    fuel: 100, hp: 3,
    cargo: [], money: 0,
    drilling: false, drillProgress: 0, drillTarget: null,
    upgrades: { drill: 0, fuel: 0, cargo: 0, hull: 0, radar: 0 },
    deaths: 0, iframes: 0
  };
  game.stats = { maxDepth: 0, totalEarned: 0, startTime: Date.now(), playtime: 0 };
  game.coreCollected = false;
  game.particles = [];
  game.messages = [];
  generateWorld();
}

function handleShopInput(e) {
  const p = game.player;
  const upgradeTypes = ['drill', 'fuel', 'cargo', 'hull', 'radar'];

  if (e.key === 'ArrowUp' || e.key === 'w') {
    game.selectedUpgrade = (game.selectedUpgrade - 1 + upgradeTypes.length) % upgradeTypes.length;
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    game.selectedUpgrade = (game.selectedUpgrade + 1) % upgradeTypes.length;
  } else if (e.key === 'Enter' || e.key === ' ') {
    const type = upgradeTypes[game.selectedUpgrade];
    const u = UPGRADES[type];
    const level = p.upgrades[type];
    if (level < u.costs.length - 1) {
      const cost = u.costs[level + 1];
      if (p.money >= cost) {
        p.money -= cost;
        p.upgrades[type]++;
        if (type === 'fuel') p.fuel = Math.min(p.fuel, getMaxFuel());
        if (type === 'hull') p.hp = Math.min(p.hp, getMaxHP());
        addMessage(`${u.name} upgraded!`);
      } else {
        addMessage('Not enough money!');
      }
    }
  } else if (e.key === 'Escape') {
    game.screen = 'game';
  }
}

// Update
function update(dt) {
  if (game.screen !== 'game') return;

  const p = game.player;

  // Update playtime
  game.stats.playtime = (Date.now() - game.stats.startTime) / 1000;

  // Track depth
  const depth = Math.max(0, p.y - 2);
  if (depth > game.stats.maxDepth) game.stats.maxDepth = depth;

  // I-frames
  if (p.iframes > 0) p.iframes -= dt;

  // Drilling
  if (p.drilling) {
    p.drillProgress += dt * getDrillSpeed();
    const target = game.world[p.drillTarget.y]?.[p.drillTarget.x];

    let drillTime = 0.3;
    if (target?.type === 'rock') drillTime = 0.5;
    if (target?.type === 'hardrock') drillTime = 0.8;

    if (p.drillProgress >= drillTime) {
      if (target) {
        // Collect mineral
        if (target.mineral && p.cargo.length < getMaxCargo()) {
          p.cargo.push(target.mineral);
          addParticles(p.drillTarget.x * TILE_SIZE, p.drillTarget.y * TILE_SIZE, target.mineral.color, 8);
        }

        // Hazard
        if (target.hazard && p.iframes <= 0) {
          const damage = target.hazard === 'gas' ? 1 : 2;
          p.hp -= damage;
          p.iframes = 1;
          addMessage(`${target.hazard.toUpperCase()}! -${damage} HP`);
          addParticles(p.drillTarget.x * TILE_SIZE, p.drillTarget.y * TILE_SIZE,
            target.hazard === 'gas' ? '#00ff00' : '#ff4400', 15);
        }

        // Core
        if (target.type === 'core') {
          game.coreCollected = true;
          addMessage('CORE CRYSTAL COLLECTED!');
          addParticles(p.drillTarget.x * TILE_SIZE, p.drillTarget.y * TILE_SIZE, '#ff00ff', 30);
        }

        target.type = 'empty';
        target.mineral = null;
        target.hazard = null;
      }

      p.x = p.drillTarget.x;
      p.y = p.drillTarget.y;
      p.drilling = false;
      p.drillTarget = null;
      p.fuel -= 1;
    }
  } else {
    // Movement
    const moveSpeed = 6;
    const gravity = 15;

    // Check ground
    const below = game.world[Math.floor(p.y) + 1]?.[Math.floor(p.x)];
    const onGround = below && below.type !== 'empty' && below.type !== 'sky';

    // Horizontal
    if (game.keys['a'] || game.keys['arrowleft']) {
      const left = game.world[Math.floor(p.y)]?.[Math.floor(p.x) - 1];
      if (left && left.type !== 'empty' && left.type !== 'sky' && left.type !== 'building') {
        startDrill(Math.floor(p.x) - 1, Math.floor(p.y));
      } else {
        p.vx = -moveSpeed;
      }
    } else if (game.keys['d'] || game.keys['arrowright']) {
      const right = game.world[Math.floor(p.y)]?.[Math.floor(p.x) + 1];
      if (right && right.type !== 'empty' && right.type !== 'sky' && right.type !== 'building') {
        startDrill(Math.floor(p.x) + 1, Math.floor(p.y));
      } else {
        p.vx = moveSpeed;
      }
    } else {
      p.vx = 0;
    }

    // Vertical
    if (game.keys['w'] || game.keys['arrowup']) {
      if (p.fuel > 0) {
        p.vy = -moveSpeed * 0.7;
        p.fuel -= 2 * dt;
      }
    } else if (game.keys['s'] || game.keys['arrowdown']) {
      const down = game.world[Math.floor(p.y) + 1]?.[Math.floor(p.x)];
      if (down && down.type !== 'empty' && down.type !== 'sky' && down.type !== 'building') {
        startDrill(Math.floor(p.x), Math.floor(p.y) + 1);
      } else if (!onGround) {
        p.vy += gravity * dt * 1.5;
      }
    } else if (!onGround) {
      p.vy += gravity * dt;
    } else {
      p.vy = 0;
    }

    // Terminal velocity
    p.vy = Math.min(p.vy, 15);

    // Apply movement
    const newX = p.x + p.vx * dt;
    const newY = p.y + p.vy * dt;

    // X collision
    const tileX = game.world[Math.floor(p.y)]?.[Math.floor(newX)];
    if (tileX && (tileX.type === 'empty' || tileX.type === 'sky' || tileX.type === 'building')) {
      if (newX >= 0 && newX < WORLD_WIDTH) p.x = newX;
    }

    // Y collision
    const tileY = game.world[Math.floor(newY)]?.[Math.floor(p.x)];
    if (tileY && (tileY.type === 'empty' || tileY.type === 'sky' || tileY.type === 'building')) {
      if (newY >= 0 && newY < WORLD_HEIGHT) p.y = newY;
    } else {
      p.vy = 0;
    }
  }

  // Building interaction
  if (game.keys['e']) {
    game.keys['e'] = false;
    const tile = game.world[Math.floor(p.y)]?.[Math.floor(p.x)];
    if (tile?.type === 'building') {
      handleBuilding(tile.building);
    }
  }

  // Victory check
  if (game.coreCollected && p.y <= 2) {
    game.screen = 'victory';
  }

  // Out of fuel underground
  if (p.fuel <= 0 && p.y > 2) {
    p.hp -= dt * 0.5;
  }

  // Death
  if (p.hp <= 0) {
    p.deaths++;
    if (p.deaths >= 3) {
      game.screen = 'gameover';
    } else {
      // Respawn with penalty
      p.x = 12;
      p.y = 1;
      p.hp = getMaxHP();
      p.fuel = getMaxFuel();
      p.cargo = [];
      p.money = Math.floor(p.money * 0.5);
      addMessage(`Destroyed! ${3 - p.deaths} lives remaining.`);
    }
  }

  p.fuel = Math.max(0, p.fuel);

  // Camera
  const targetCamY = Math.max(0, (p.y - 8) * TILE_SIZE);
  game.camera.y += (targetCamY - game.camera.y) * 0.1;

  // Particles
  game.particles = game.particles.filter(part => {
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vy += 300 * dt;
    part.life -= dt;
    return part.life > 0;
  });

  // Messages
  game.messages = game.messages.filter(m => {
    m.life -= dt;
    return m.life > 0;
  });
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
      const fuelNeeded = getMaxFuel() - p.fuel;
      const fuelCost = Math.ceil(fuelNeeded * 0.5);
      if (p.money >= fuelCost && fuelNeeded > 0) {
        p.money -= fuelCost;
        p.fuel = getMaxFuel();
        addMessage(`Refueled! -$${fuelCost}`);
      } else if (fuelNeeded <= 0) {
        addMessage('Tank is full!');
      } else {
        addMessage('Not enough money!');
      }
      break;

    case 'repair':
      const hpNeeded = getMaxHP() - p.hp;
      const repairCost = Math.ceil(hpNeeded * 50);
      if (p.money >= repairCost && hpNeeded > 0) {
        p.money -= repairCost;
        p.hp = getMaxHP();
        addMessage(`Repaired! -$${repairCost}`);
      } else if (hpNeeded <= 0) {
        addMessage('Hull is fine!');
      } else {
        addMessage('Not enough money!');
      }
      break;

    case 'sell':
      if (p.cargo.length > 0) {
        let total = 0;
        for (const m of p.cargo) total += m.value;
        p.money += total;
        game.stats.totalEarned += total;
        addMessage(`Sold cargo! +$${total}`);
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
  game.messages.push({ text, life: 2.5 });
}

// Render
function render() {
  ctx.fillStyle = '#1a0500';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (game.screen) {
    case 'title': renderTitle(); break;
    case 'game': renderGame(); break;
    case 'shop': renderShop(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderTitle() {
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('DEEP DRILL', WIDTH/2, 180);

  ctx.fillStyle = '#CD7F32';
  ctx.font = '24px Courier New';
  ctx.fillText('Mars Mining Company', WIDTH/2, 230);

  // Mining rig ASCII art
  ctx.fillStyle = '#aaa';
  ctx.font = '16px Courier New';
  const art = [
    '    [===]',
    '    |:::|',
    '   /|:::|\\',
    '  /_|:::|_\\',
    '    VVVVV',
    '     |||',
    '     \\|/'
  ];
  art.forEach((line, i) => {
    ctx.fillText(line, WIDTH/2, 290 + i * 20);
  });

  ctx.fillStyle = '#888';
  ctx.font = '16px Courier New';
  ctx.fillText('WASD - Move & Drill', WIDTH/2, 460);
  ctx.fillText('E - Interact with buildings', WIDTH/2, 485);
  ctx.fillText('Reach the CORE at depth 300m to win!', WIDTH/2, 510);

  ctx.fillStyle = '#FFD700';
  ctx.font = '20px Courier New';
  ctx.fillText('Press ENTER to Start', WIDTH/2, 560);
}

function renderGame() {
  const p = game.player;

  ctx.save();
  ctx.translate(0, -game.camera.y);

  // Render visible tiles
  const startY = Math.floor(game.camera.y / TILE_SIZE);
  const endY = Math.min(WORLD_HEIGHT, startY + 22);
  const radarRange = getRadarRange();

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const tile = game.world[y]?.[x];
      if (!tile) continue;

      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      switch (tile.type) {
        case 'sky':
          ctx.fillStyle = y === 0 ? '#4a2000' : '#3a1500';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;

        case 'building':
          ctx.fillStyle = '#3a1500';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = tile.building === 'fuel' ? '#ff4400' :
                         tile.building === 'shop' ? '#44ff00' :
                         tile.building === 'sell' ? '#FFD700' : '#00aaff';
          ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.fillStyle = '#fff';
          ctx.font = '9px Courier New';
          ctx.textAlign = 'center';
          ctx.fillText(tile.building.toUpperCase(), px + TILE_SIZE/2, py + TILE_SIZE/2 + 3);
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
          ctx.fillStyle = '#5a5a5a';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#7a7a7a';
          ctx.fillRect(px + 6, py + 6, 20, 20);
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
          ctx.fillStyle = '#1a0500';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;

        case 'core':
          ctx.fillStyle = '#1a0500';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Glowing core
          const glow = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255, 0, 255, ${glow})`;
          ctx.beginPath();
          ctx.arc(px + 16, py + 16, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(px + 16, py + 16, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      // Mineral overlay
      if (tile.mineral) {
        const dist = Math.abs(x - Math.floor(p.x)) + Math.abs(y - Math.floor(p.y));
        const visible = radarRange === 0 || dist <= radarRange;

        if (visible || radarRange > 0) {
          const sparkle = Math.sin(Date.now() * 0.005 + x + y) * 0.3 + 0.7;
          ctx.fillStyle = tile.mineral.color;
          ctx.globalAlpha = visible ? sparkle : 0.3;
          ctx.beginPath();
          ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // Player
  const playerPx = p.x * TILE_SIZE;
  const playerPy = p.y * TILE_SIZE;

  // Flash during i-frames
  if (p.iframes <= 0 || Math.floor(p.iframes * 10) % 2 === 0) {
    // Body
    ctx.fillStyle = '#aaa';
    ctx.fillRect(playerPx + 4, playerPy + 8, 24, 18);

    // Cockpit
    ctx.fillStyle = '#4af';
    ctx.fillRect(playerPx + 8, playerPy + 4, 16, 10);

    // Drill
    ctx.fillStyle = '#666';
    ctx.fillRect(playerPx + 12, playerPy + 26, 8, 6);

    // Treads
    ctx.fillStyle = '#333';
    ctx.fillRect(playerPx + 2, playerPy + 24, 8, 8);
    ctx.fillRect(playerPx + 22, playerPy + 24, 8, 8);
  }

  // Drill particles
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

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, WIDTH, 55);

  ctx.textAlign = 'left';
  ctx.font = '14px Courier New';

  // Depth
  const depth = Math.max(0, Math.floor((p.y - 2)));
  ctx.fillStyle = '#fff';
  ctx.fillText(`DEPTH: ${depth}m`, 10, 18);

  // Money
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`$${p.money.toLocaleString()}`, 10, 38);

  // Fuel bar
  ctx.fillStyle = '#fff';
  ctx.fillText('FUEL:', 160, 18);
  ctx.fillStyle = '#333';
  ctx.fillRect(210, 6, 100, 16);
  const fuelPercent = p.fuel / getMaxFuel();
  ctx.fillStyle = fuelPercent < 0.2 ? '#f00' : fuelPercent < 0.5 ? '#ff0' : '#0f0';
  ctx.fillRect(210, 6, 100 * fuelPercent, 16);

  // HP
  ctx.fillStyle = '#fff';
  ctx.fillText('HP:', 160, 38);
  for (let i = 0; i < getMaxHP(); i++) {
    ctx.fillStyle = i < p.hp ? '#f00' : '#333';
    ctx.fillRect(190 + i * 16, 28, 12, 12);
  }

  // Cargo
  ctx.fillStyle = '#fff';
  ctx.fillText(`CARGO: ${p.cargo.length}/${getMaxCargo()}`, 380, 18);

  // Cargo preview
  for (let i = 0; i < Math.min(p.cargo.length, 15); i++) {
    ctx.fillStyle = p.cargo[i].color;
    ctx.fillRect(380 + i * 12, 26, 10, 10);
  }

  // Lives
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${3 - p.deaths}`, WIDTH - 10, 18);

  // Core status
  if (game.coreCollected) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('CORE COLLECTED! Return to surface!', WIDTH - 10, 38);
  }

  // Controls hint
  ctx.fillStyle = '#666';
  ctx.font = '11px Courier New';
  ctx.fillText('WASD:Move | S:Drill | E:Interact', WIDTH - 10, 52);

  // Messages
  ctx.textAlign = 'center';
  let msgY = 80;
  for (const msg of game.messages) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, msg.life)})`;
    ctx.font = '16px Courier New';
    ctx.fillText(msg.text, WIDTH/2, msgY);
    msgY += 22;
  }
}

function renderShop() {
  ctx.fillStyle = '#1a0500';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('EQUIPMENT SHOP', WIDTH/2, 50);

  const p = game.player;
  ctx.fillStyle = '#fff';
  ctx.font = '18px Courier New';
  ctx.fillText(`Cash: $${p.money.toLocaleString()}`, WIDTH/2, 90);

  const upgradeTypes = ['drill', 'fuel', 'cargo', 'hull', 'radar'];
  ctx.font = '14px Courier New';
  ctx.textAlign = 'left';

  let y = 140;
  upgradeTypes.forEach((type, i) => {
    const u = UPGRADES[type];
    const level = p.upgrades[type];
    const maxLevel = u.costs.length - 1;
    const nextCost = level < maxLevel ? u.costs[level + 1] : null;

    // Selection highlight
    if (i === game.selectedUpgrade) {
      ctx.fillStyle = 'rgba(255,215,0,0.2)';
      ctx.fillRect(80, y - 18, 640, 35);
      ctx.fillStyle = '#FFD700';
      ctx.fillText('>', 90, y);
    }

    ctx.fillStyle = '#fff';
    ctx.fillText(u.name, 120, y);
    ctx.fillStyle = '#888';
    ctx.fillText(`Level ${level}/${maxLevel}`, 280, y);

    if (nextCost !== null) {
      ctx.fillStyle = p.money >= nextCost ? '#0f0' : '#f00';
      ctx.fillText(`$${nextCost}`, 400, y);
      ctx.fillStyle = '#888';
      ctx.fillText(`${u.values[level]} -> ${u.values[level + 1]}`, 500, y);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillText('MAXED', 400, y);
    }

    y += 45;
  });

  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  ctx.fillText('W/S: Navigate | ENTER: Buy | ESC: Exit', WIDTH/2, 550);
}

function renderGameOver() {
  ctx.fillStyle = '#1a0500';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH/2, 180);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Your drilling rig was destroyed!', WIDTH/2, 240);

  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Courier New';
  ctx.fillText(`Max Depth: ${game.stats.maxDepth}m`, WIDTH/2, 320);
  ctx.fillText(`Total Earned: $${game.stats.totalEarned.toLocaleString()}`, WIDTH/2, 350);
  ctx.fillText(`Time: ${Math.floor(game.stats.playtime / 60)}m ${Math.floor(game.stats.playtime % 60)}s`, WIDTH/2, 380);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press ENTER to try again', WIDTH/2, 480);
}

function renderVictory() {
  ctx.fillStyle = '#1a0500';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH/2, 150);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('You retrieved the Core Crystal!', WIDTH/2, 210);

  ctx.fillStyle = '#ff00ff';
  const glow = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
  ctx.globalAlpha = glow;
  ctx.beginPath();
  ctx.arc(WIDTH/2, 280, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(WIDTH/2, 280, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Courier New';
  ctx.fillText(`Final Depth: ${game.stats.maxDepth}m`, WIDTH/2, 360);
  ctx.fillText(`Total Earned: $${game.stats.totalEarned.toLocaleString()}`, WIDTH/2, 390);
  ctx.fillText(`Deaths: ${game.player.deaths}`, WIDTH/2, 420);
  ctx.fillText(`Time: ${Math.floor(game.stats.playtime / 60)}m ${Math.floor(game.stats.playtime % 60)}s`, WIDTH/2, 450);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press ENTER to play again', WIDTH/2, 530);
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
console.log('Deep Drill initialized! Press ENTER to start.');
