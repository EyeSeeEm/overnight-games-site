// Motherload - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 16;
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 220;
const VIEW_WIDTH = 50;
const VIEW_HEIGHT = 38;
const SURFACE_Y = 3;

canvas.width = VIEW_WIDTH * TILE_SIZE;
canvas.height = VIEW_HEIGHT * TILE_SIZE;

// Tile types
const TILE = {
  SKY: 0,
  DIRT: 1,
  ROCK: 2,
  HARD_ROCK: 3,
  MINERAL: 4,
  GAS: 5,
  LAVA: 6,
  EMPTY: 7,
  BUILDING: 8
};

// Minerals
const MINERALS = [
  { name: 'Ironium', value: 30, weight: 1, color: '#8B4513', minDepth: 0, maxDepth: 50 },
  { name: 'Bronzium', value: 60, weight: 1, color: '#CD7F32', minDepth: 5, maxDepth: 80 },
  { name: 'Silverium', value: 100, weight: 2, color: '#C0C0C0', minDepth: 10, maxDepth: 110 },
  { name: 'Goldium', value: 250, weight: 2, color: '#FFD700', minDepth: 20, maxDepth: 140 },
  { name: 'Platinium', value: 750, weight: 3, color: '#E5E4E2', minDepth: 40, maxDepth: 170 },
  { name: 'Einsteinium', value: 2000, weight: 3, color: '#00FF00', minDepth: 65, maxDepth: 190 },
  { name: 'Emerald', value: 5000, weight: 4, color: '#50C878', minDepth: 95, maxDepth: 205 },
  { name: 'Ruby', value: 20000, weight: 4, color: '#E0115F', minDepth: 125, maxDepth: 210 },
  { name: 'Diamond', value: 100000, weight: 5, color: '#B9F2FF', minDepth: 160, maxDepth: 215 },
  { name: 'Amazonite', value: 500000, weight: 5, color: '#00FFEF', minDepth: 190, maxDepth: 220 }
];

// Buildings
const BUILDINGS = {
  FUEL: { x: 5, w: 5, color: '#FF6600', name: 'FUEL' },
  SHOP: { x: 15, w: 5, color: '#00CC00', name: 'SHOP' },
  PROCESSOR: { x: 25, w: 5, color: '#FFCC00', name: 'SELL' },
  REPAIR: { x: 35, w: 5, color: '#CC0000', name: 'REPAIR' }
};

// Game state
const game = {
  world: [],
  mineralMap: [],
  player: {
    x: 25,
    y: SURFACE_Y,
    vx: 0,
    vy: 0,
    fuel: 10,
    maxFuel: 10,
    hull: 100,
    maxHull: 100,
    cargo: [],
    cargoMax: 7,
    money: 0,
    drilling: false,
    drillProgress: 0,
    drillTarget: null,
    upgrades: {
      drill: 0,
      hull: 0,
      engine: 0,
      fuel: 0,
      radiator: 0,
      cargo: 0
    }
  },
  camera: { x: 0, y: 0 },
  keys: {},
  ui: { active: null, selectedOption: 0 },
  time: 0,
  depthRecord: 0,
  gameOver: false,
  gameOverReason: ''
};

// Upgrade costs and effects
const UPGRADES = {
  drill: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => 1 + l * 0.5 },
  hull: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => 100 + l * 100 },
  engine: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => 1 + l * 0.25 },
  fuel: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => 10 + l * 15 },
  radiator: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => l * 0.15 },
  cargo: { costs: [750, 2000, 5000, 20000, 100000, 500000], effect: (l) => 7 + l * 5 }
};

// Generate world
function generateWorld() {
  game.world = [];
  game.mineralMap = [];

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    game.world[y] = [];
    game.mineralMap[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y < SURFACE_Y) {
        // Sky
        game.world[y][x] = TILE.SKY;
      } else if (y === SURFACE_Y) {
        // Surface with buildings
        let isBuilding = false;
        for (const key in BUILDINGS) {
          const b = BUILDINGS[key];
          if (x >= b.x && x < b.x + b.w) {
            game.world[y][x] = TILE.BUILDING;
            isBuilding = true;
            break;
          }
        }
        if (!isBuilding) game.world[y][x] = TILE.SKY;
      } else {
        // Underground
        const depth = y - SURFACE_Y;
        const rand = Math.random();

        // Terrain distribution based on depth
        let dirtChance = 0.85 - depth * 0.003;
        let rockChance = 0.10 + depth * 0.002;
        let hardRockChance = depth > 30 ? depth * 0.001 : 0;

        if (rand < dirtChance) {
          game.world[y][x] = TILE.DIRT;
        } else if (rand < dirtChance + rockChance) {
          game.world[y][x] = TILE.ROCK;
        } else if (rand < dirtChance + rockChance + hardRockChance) {
          game.world[y][x] = TILE.HARD_ROCK;
        } else if (depth > 15 && Math.random() < 0.02) {
          // Hazards
          game.world[y][x] = depth < 100 ? TILE.GAS : TILE.LAVA;
        } else {
          game.world[y][x] = TILE.DIRT;
        }

        // Mineral generation
        if (Math.random() < 0.12 && game.world[y][x] !== TILE.GAS && game.world[y][x] !== TILE.LAVA) {
          const mineral = selectMineral(depth);
          if (mineral) {
            game.world[y][x] = TILE.MINERAL;
            game.mineralMap[y][x] = mineral;
          }
        }
      }
    }
  }
}

function selectMineral(depth) {
  const available = MINERALS.filter(m => depth >= m.minDepth && depth <= m.maxDepth);
  if (available.length === 0) return null;

  // Weight towards common minerals
  const weights = available.map((m, i) => Math.pow(2, available.length - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < available.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return available[i];
  }
  return available[0];
}

// Get current depth in feet
function getDepthFeet() {
  return Math.floor((game.player.y - SURFACE_Y) * 32);
}

// Update player stats based on upgrades
function updatePlayerStats() {
  const p = game.player;
  const u = p.upgrades;
  p.maxFuel = UPGRADES.fuel.effect(u.fuel);
  p.maxHull = UPGRADES.hull.effect(u.hull);
  p.cargoMax = UPGRADES.cargo.effect(u.cargo);
}

// Input handling
document.addEventListener('keydown', (e) => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  // UI navigation
  if (game.ui.active) {
    if (e.key === 'Escape') {
      game.ui.active = null;
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      game.ui.selectedOption = Math.max(0, game.ui.selectedOption - 1);
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      game.ui.selectedOption++;
    } else if (e.key === 'Enter' || e.key === ' ') {
      handleUIAction();
    } else if (e.key >= '1' && e.key <= '6' && game.ui.active === 'shop') {
      game.ui.selectedOption = parseInt(e.key) - 1;
      handleUIAction();
    }
    e.preventDefault();
  }

  // Interaction
  if (e.key.toLowerCase() === 'e' && !game.ui.active && !game.gameOver) {
    checkBuildingInteraction();
  }

  // Restart
  if (game.gameOver && e.key === 'Enter') {
    restartGame();
  }
});

document.addEventListener('keyup', (e) => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

function checkBuildingInteraction() {
  const p = game.player;
  if (p.y !== SURFACE_Y) return;

  for (const key in BUILDINGS) {
    const b = BUILDINGS[key];
    if (p.x >= b.x && p.x < b.x + b.w) {
      if (key === 'FUEL') game.ui.active = 'fuel';
      else if (key === 'SHOP') game.ui.active = 'shop';
      else if (key === 'PROCESSOR') game.ui.active = 'sell';
      else if (key === 'REPAIR') game.ui.active = 'repair';
      game.ui.selectedOption = 0;
      break;
    }
  }
}

function handleUIAction() {
  const p = game.player;
  const ui = game.ui;

  if (ui.active === 'fuel') {
    const cost = Math.ceil((p.maxFuel - p.fuel) * 2);
    if (p.money >= cost) {
      p.money -= cost;
      p.fuel = p.maxFuel;
    }
    ui.active = null;
  } else if (ui.active === 'repair') {
    const cost = p.maxHull - p.hull;
    if (p.money >= cost) {
      p.money -= cost;
      p.hull = p.maxHull;
    }
    ui.active = null;
  } else if (ui.active === 'sell') {
    let total = 0;
    for (const mineral of p.cargo) {
      total += mineral.value;
    }
    p.money += total;
    p.cargo = [];
    ui.active = null;
  } else if (ui.active === 'shop') {
    const upgrades = ['drill', 'hull', 'engine', 'fuel', 'radiator', 'cargo'];
    const upgrade = upgrades[ui.selectedOption];
    if (upgrade && p.upgrades[upgrade] < 6) {
      const cost = UPGRADES[upgrade].costs[p.upgrades[upgrade]];
      if (p.money >= cost) {
        p.money -= cost;
        p.upgrades[upgrade]++;
        updatePlayerStats();
      }
    }
  }
}

// Physics update
function update(dt) {
  if (game.gameOver || game.ui.active) return;

  const p = game.player;
  const engineMult = UPGRADES.engine.effect(p.upgrades.engine);

  // Movement
  let moveX = 0;
  let moveY = 0;

  if (game.keys['a'] || game.keys['arrowleft']) moveX = -1;
  if (game.keys['d'] || game.keys['arrowright']) moveX = 1;
  if (game.keys['w'] || game.keys['arrowup']) moveY = -1;
  if (game.keys['s'] || game.keys['arrowdown']) moveY = 1;

  // Check if we need to drill
  const targetX = Math.floor(p.x + moveX);
  const targetY = Math.floor(p.y + moveY);

  if (moveX !== 0 || moveY !== 0) {
    const currentTile = game.world[targetY]?.[targetX];

    if (currentTile !== undefined && currentTile !== TILE.SKY && currentTile !== TILE.EMPTY && currentTile !== TILE.BUILDING) {
      // Need to drill
      if (!p.drilling || p.drillTarget?.x !== targetX || p.drillTarget?.y !== targetY) {
        p.drilling = true;
        p.drillTarget = { x: targetX, y: targetY };
        p.drillProgress = 0;
      }

      // Drill progress
      const drillSpeed = UPGRADES.drill.effect(p.upgrades.drill);
      let drillTime = 0.5;
      if (currentTile === TILE.ROCK) drillTime = 0.75;
      if (currentTile === TILE.HARD_ROCK) drillTime = 1.25;

      p.drillProgress += dt * drillSpeed;

      // Consume fuel while drilling
      const fuelCost = moveY > 0 ? 0.03 : (moveY < 0 ? 0.06 : 0.04);
      p.fuel -= fuelCost * dt;

      if (p.drillProgress >= drillTime) {
        // Check for hazards
        if (currentTile === TILE.GAS || currentTile === TILE.LAVA) {
          const depth = Math.abs(getDepthFeet());
          const radiator = UPGRADES.radiator.effect(p.upgrades.radiator);
          let damage;
          if (currentTile === TILE.GAS) {
            damage = ((depth + 3000) / 15) * (1 - radiator);
          } else {
            damage = ((depth + 2000) / 10) * (1 - radiator);
          }
          p.hull -= Math.floor(damage);
        }

        // Collect mineral
        if (currentTile === TILE.MINERAL && game.mineralMap[targetY]?.[targetX]) {
          const mineral = game.mineralMap[targetY][targetX];
          if (p.cargo.length < p.cargoMax) {
            p.cargo.push(mineral);
          }
        }

        // Clear tile
        game.world[targetY][targetX] = TILE.EMPTY;
        p.drilling = false;
        p.drillProgress = 0;
        p.drillTarget = null;

        // Move into space
        p.x = targetX;
        p.y = targetY;
      }
    } else if (currentTile === TILE.SKY || currentTile === TILE.EMPTY || currentTile === TILE.BUILDING) {
      // Can move freely
      p.drilling = false;

      // Horizontal movement
      if (moveX !== 0 && canMove(p.x + moveX, p.y)) {
        p.x += moveX * engineMult * 4 * dt;
        p.fuel -= 0.02 * Math.abs(moveX) * dt;
      }

      // Flying up
      if (moveY < 0 && canMove(p.x, p.y - 1)) {
        p.vy = -2 * engineMult;
        p.fuel -= 0.05 * dt;
      }
    }
  } else {
    p.drilling = false;
  }

  // Gravity
  if (!p.drilling) {
    const belowY = Math.floor(p.y + 1);
    const belowTile = game.world[belowY]?.[Math.floor(p.x)];

    if (belowTile === TILE.SKY || belowTile === TILE.EMPTY) {
      p.vy += 8 * dt; // Gravity
      p.vy = Math.min(p.vy, 6); // Terminal velocity
    } else {
      // Landing - check fall damage
      if (p.vy > 2) {
        const fallTiles = p.vy / 2;
        if (fallTiles > 3) {
          const damage = (fallTiles - 3) * 10;
          p.hull -= damage;
        }
      }
      p.vy = 0;
      p.y = Math.floor(p.y);
    }

    p.y += p.vy * dt;
  }

  // Clamp position
  p.x = Math.max(0, Math.min(WORLD_WIDTH - 1, p.x));
  p.y = Math.max(0, Math.min(WORLD_HEIGHT - 1, p.y));

  // Track depth record
  const depth = getDepthFeet();
  if (depth > game.depthRecord) game.depthRecord = depth;

  // Check game over conditions
  if (p.hull <= 0) {
    game.gameOver = true;
    game.gameOverReason = 'YOUR POD WAS DESTROYED';
  } else if (p.fuel <= 0 && p.y > SURFACE_Y + 1) {
    game.gameOver = true;
    game.gameOverReason = 'STRANDED! No fuel remaining.';
  }

  // Update camera
  game.camera.x = Math.floor(p.x - VIEW_WIDTH / 2);
  game.camera.y = Math.floor(p.y - VIEW_HEIGHT / 2);
  game.camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, game.camera.x));
  game.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, game.camera.y));

  game.time += dt;
}

function canMove(x, y) {
  const tile = game.world[Math.floor(y)]?.[Math.floor(x)];
  return tile === TILE.SKY || tile === TILE.EMPTY || tile === TILE.BUILDING;
}

// Rendering
function render() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const p = game.player;
  const cam = game.camera;

  // Draw tiles
  for (let y = 0; y < VIEW_HEIGHT; y++) {
    for (let x = 0; x < VIEW_WIDTH; x++) {
      const worldX = x + cam.x;
      const worldY = y + cam.y;
      const tile = game.world[worldY]?.[worldX];

      let color = null;
      switch (tile) {
        case TILE.SKY:
          color = worldY < SURFACE_Y ? '#FF6B4B' : null; // Mars sky
          break;
        case TILE.DIRT:
          color = '#8B5A2B';
          break;
        case TILE.ROCK:
          color = '#696969';
          break;
        case TILE.HARD_ROCK:
          color = '#4A4A4A';
          break;
        case TILE.MINERAL:
          const mineral = game.mineralMap[worldY]?.[worldX];
          color = mineral ? mineral.color : '#FFD700';
          break;
        case TILE.GAS:
          color = '#3D5B3D'; // Slightly green dirt
          break;
        case TILE.LAVA:
          color = '#5B3D3D'; // Slightly red dirt
          break;
        case TILE.BUILDING:
          // Find which building
          for (const key in BUILDINGS) {
            const b = BUILDINGS[key];
            if (worldX >= b.x && worldX < b.x + b.w && worldY === SURFACE_Y) {
              color = b.color;
              break;
            }
          }
          break;
        case TILE.EMPTY:
          color = '#2D2D2D';
          break;
      }

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Draw building labels
  ctx.fillStyle = '#FFF';
  ctx.font = '8px monospace';
  for (const key in BUILDINGS) {
    const b = BUILDINGS[key];
    const screenX = (b.x + b.w / 2 - cam.x) * TILE_SIZE;
    const screenY = (SURFACE_Y - cam.y - 0.5) * TILE_SIZE;
    if (screenX > 0 && screenX < canvas.width) {
      ctx.textAlign = 'center';
      ctx.fillText(b.name, screenX, screenY);
    }
  }

  // Draw player
  const playerScreenX = (p.x - cam.x) * TILE_SIZE;
  const playerScreenY = (p.y - cam.y) * TILE_SIZE;

  // Pod body
  ctx.fillStyle = '#4488FF';
  ctx.fillRect(playerScreenX, playerScreenY, TILE_SIZE, TILE_SIZE);

  // Drill (if drilling)
  if (p.drilling && p.drillTarget) {
    ctx.fillStyle = '#888';
    const drillX = (p.drillTarget.x - cam.x) * TILE_SIZE + TILE_SIZE / 4;
    const drillY = (p.drillTarget.y - cam.y) * TILE_SIZE + TILE_SIZE / 4;
    ctx.fillRect(drillX, drillY, TILE_SIZE / 2, TILE_SIZE / 2);
  }

  // Draw HUD
  drawHUD();

  // Draw UI if active
  if (game.ui.active) {
    drawUI();
  }

  // Draw game over
  if (game.gameOver) {
    drawGameOver();
  }
}

function drawHUD() {
  const p = game.player;
  const hudY = 5;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, 45);

  ctx.fillStyle = '#FFF';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';

  // Left side
  ctx.fillText(`DEPTH: -${getDepthFeet()} ft`, 10, hudY + 12);
  ctx.fillText(`CASH: $${p.money.toLocaleString()}`, 10, hudY + 28);

  // Right side
  const fuelPct = (p.fuel / p.maxFuel * 100).toFixed(0);
  const hullPct = (p.hull / p.maxHull * 100).toFixed(0);

  ctx.textAlign = 'right';
  ctx.fillStyle = p.fuel / p.maxFuel < 0.2 ? '#FF4444' : '#FFF';
  ctx.fillText(`FUEL: ${fuelPct}%`, canvas.width - 10, hudY + 12);

  ctx.fillStyle = p.hull / p.maxHull < 0.25 ? '#FF4444' : '#FFF';
  ctx.fillText(`HULL: ${hullPct}%`, canvas.width - 10, hudY + 28);

  // Center
  ctx.textAlign = 'center';
  ctx.fillStyle = p.cargo.length >= p.cargoMax ? '#FF4444' : '#FFF';
  ctx.fillText(`CARGO: ${p.cargo.length}/${p.cargoMax}`, canvas.width / 2, hudY + 20);

  // Interaction hint
  if (p.y === SURFACE_Y && !game.ui.active) {
    for (const key in BUILDINGS) {
      const b = BUILDINGS[key];
      if (p.x >= b.x && p.x < b.x + b.w) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(`Press E to use ${b.name}`, canvas.width / 2, canvas.height - 10);
        break;
      }
    }
  }
}

function drawUI() {
  const p = game.player;
  const ui = game.ui;

  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(100, 60, canvas.width - 200, canvas.height - 120);

  ctx.strokeStyle = '#FFF';
  ctx.strokeRect(100, 60, canvas.width - 200, canvas.height - 120);

  ctx.fillStyle = '#FFF';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';

  if (ui.active === 'fuel') {
    const cost = Math.ceil((p.maxFuel - p.fuel) * 2);
    ctx.fillText('FUEL STATION', canvas.width / 2, 90);
    ctx.fillText(`Fill tank? Cost: $${cost}`, canvas.width / 2, 130);
    ctx.fillText(`Current: ${p.fuel.toFixed(1)} / ${p.maxFuel} gallons`, canvas.width / 2, 160);
    ctx.fillText('[ENTER] Fill  [ESC] Cancel', canvas.width / 2, 200);
  } else if (ui.active === 'repair') {
    const cost = Math.floor(p.maxHull - p.hull);
    ctx.fillText('REPAIR STATION', canvas.width / 2, 90);
    ctx.fillText(`Repair hull? Cost: $${cost}`, canvas.width / 2, 130);
    ctx.fillText(`Current: ${Math.floor(p.hull)} / ${p.maxHull} HP`, canvas.width / 2, 160);
    ctx.fillText('[ENTER] Repair  [ESC] Cancel', canvas.width / 2, 200);
  } else if (ui.active === 'sell') {
    ctx.fillText('MINERAL PROCESSOR', canvas.width / 2, 90);

    let y = 120;
    let total = 0;
    const counts = {};

    for (const mineral of p.cargo) {
      counts[mineral.name] = (counts[mineral.name] || { count: 0, value: mineral.value });
      counts[mineral.name].count++;
      total += mineral.value;
    }

    ctx.textAlign = 'left';
    for (const name in counts) {
      const c = counts[name];
      ctx.fillText(`${name} x${c.count} = $${c.count * c.value}`, 130, y);
      y += 20;
    }

    ctx.textAlign = 'center';
    ctx.fillText(`TOTAL: $${total}`, canvas.width / 2, y + 20);
    ctx.fillText('[ENTER] Sell  [ESC] Cancel', canvas.width / 2, canvas.height - 90);
  } else if (ui.active === 'shop') {
    ctx.fillText('MARS MINING CO. SHOP', canvas.width / 2, 90);
    ctx.fillText(`YOUR CASH: $${p.money.toLocaleString()}`, canvas.width / 2, 110);

    const upgrades = [
      { key: 'drill', name: 'DRILL', unit: 'x speed' },
      { key: 'hull', name: 'HULL', unit: ' HP' },
      { key: 'engine', name: 'ENGINE', unit: 'x speed' },
      { key: 'fuel', name: 'FUEL TANK', unit: ' gal' },
      { key: 'radiator', name: 'RADIATOR', unit: '% resist' },
      { key: 'cargo', name: 'CARGO BAY', unit: ' slots' }
    ];

    ctx.textAlign = 'left';
    ctx.font = '11px monospace';

    let y = 140;
    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const level = p.upgrades[u.key];
      const current = UPGRADES[u.key].effect(level);
      const next = level < 6 ? UPGRADES[u.key].effect(level + 1) : current;
      const cost = level < 6 ? UPGRADES[u.key].costs[level] : 0;

      ctx.fillStyle = ui.selectedOption === i ? '#FFFF00' : '#FFF';

      if (level >= 6) {
        ctx.fillText(`[${i + 1}] ${u.name} - MAX LEVEL`, 120, y);
      } else {
        ctx.fillText(`[${i + 1}] ${u.name} Lv${level}→${level + 1}  $${cost.toLocaleString()}`, 120, y);
        ctx.fillText(`    ${current.toFixed(1)}${u.unit} → ${next.toFixed(1)}${u.unit}`, 120, y + 14);
      }
      y += 35;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFF';
    ctx.fillText('[1-6] Buy  [ESC] Close', canvas.width / 2, canvas.height - 80);
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FF4444';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, 120);

  ctx.fillStyle = '#FFF';
  ctx.font = '14px monospace';
  ctx.fillText(game.gameOverReason, canvas.width / 2, 160);

  ctx.fillText('FINAL STATS:', canvas.width / 2, 210);
  ctx.fillText(`Max Depth: -${game.depthRecord} ft`, canvas.width / 2, 240);
  ctx.fillText(`Total Money: $${game.player.money.toLocaleString()}`, canvas.width / 2, 260);
  ctx.fillText(`Time: ${Math.floor(game.time / 60)}:${(Math.floor(game.time) % 60).toString().padStart(2, '0')}`, canvas.width / 2, 280);

  ctx.fillStyle = '#FFFF00';
  ctx.fillText('[ENTER] Try Again', canvas.width / 2, 340);
}

function restartGame() {
  game.player = {
    x: 25,
    y: SURFACE_Y,
    vx: 0,
    vy: 0,
    fuel: 10,
    maxFuel: 10,
    hull: 100,
    maxHull: 100,
    cargo: [],
    cargoMax: 7,
    money: 0,
    drilling: false,
    drillProgress: 0,
    drillTarget: null,
    upgrades: { drill: 0, hull: 0, engine: 0, fuel: 0, radiator: 0, cargo: 0 }
  };
  game.gameOver = false;
  game.gameOverReason = '';
  game.depthRecord = 0;
  game.time = 0;
  game.ui.active = null;
  generateWorld();
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

// Expose game state for testing
window.gameState = game;

// Initialize
generateWorld();
requestAnimationFrame(gameLoop);

console.log('Motherload initialized! Use WASD/Arrows to move, E to interact with buildings.');
