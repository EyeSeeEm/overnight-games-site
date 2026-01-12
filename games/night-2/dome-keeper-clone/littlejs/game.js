// Dome Defender - Mining Survival (Dome Keeper Clone)
// Mine resources, defend your dome, find the relic
// WASD to dig in all 4 directions!

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 16;

// Larger map per feedback - 80x100 tiles
const GRID_WIDTH = 80;
const GRID_HEIGHT = 100;

// Camera configuration - zoomed in view
const CAMERA_VISIBLE_TILES_X = 25;
const CAMERA_VISIBLE_TILES_Y = 18;
const CAMERA_FOLLOW_SPEED = 0.08;

// Colors
const COLORS = {
  bg: '#1a1020',
  dome: '#4488cc',
  domeGlow: '#66aaff',
  player: '#ffcc00',
  playerGlow: '#ffee88',
  dirt: '#8B4513',
  softStite: '#A9A9A9',
  hardStone: '#696969',
  denseRock: '#4A4A4A',
  crystalRock: '#4169E1',
  obsidian: '#2F1B41',
  iron: '#B87333',
  ironGlow: '#D4945A',
  water: '#4A90D9',
  waterGlow: '#7AB8F5',
  cobalt: '#8B5CF6',
  cobaltGlow: '#A78BFA',
  relic: '#ffdd00',
  relicGlow: '#fff888',
  empty: '#0a0810',
  laser: '#ff4444',
  laserGlow: '#ff8888',
  enemy: '#ff3366',
  enemyGlow: '#ff6699',
  hp: '#44ff44',
  text: '#ffffff'
};

// Tile types - expanded with more rock variety
const TILE = {
  EMPTY: 0,
  DIRT: 1,
  SOFT_STONE: 2,
  HARD_STONE: 3,
  DENSE_ROCK: 4,
  CRYSTAL_ROCK: 5,
  OBSIDIAN: 6,
  IRON: 7,
  WATER: 8,
  COBALT: 9,
  RELIC: 10,
  DOME: 11,
  BEDROCK: 12
};

// Tile properties - more rock types with distinct properties
const TILE_PROPS = {
  [TILE.EMPTY]: { hp: 0, color: COLORS.empty, name: 'Air' },
  [TILE.DIRT]: { hp: 2, color: COLORS.dirt, name: 'Dirt' },
  [TILE.SOFT_STONE]: { hp: 4, color: COLORS.softStite, name: 'Soft Stone' },
  [TILE.HARD_STONE]: { hp: 8, color: COLORS.hardStone, name: 'Hard Stone' },
  [TILE.DENSE_ROCK]: { hp: 12, color: COLORS.denseRock, name: 'Dense Rock' },
  [TILE.CRYSTAL_ROCK]: { hp: 16, color: COLORS.crystalRock, name: 'Crystal Rock' },
  [TILE.OBSIDIAN]: { hp: 24, color: COLORS.obsidian, name: 'Obsidian' },
  [TILE.IRON]: { hp: 6, color: COLORS.iron, resource: 'iron', amount: [1, 4], name: 'Iron Ore' },
  [TILE.WATER]: { hp: 5, color: COLORS.water, resource: 'water', amount: [1, 3], name: 'Water Crystal' },
  [TILE.COBALT]: { hp: 10, color: COLORS.cobalt, resource: 'cobalt', amount: [1, 3], name: 'Cobalt Ore' },
  [TILE.RELIC]: { hp: 20, color: COLORS.relic, resource: 'relic', amount: [1, 1], name: 'Relic Chamber' },
  [TILE.DOME]: { hp: 999, color: COLORS.dome, name: 'Dome' },
  [TILE.BEDROCK]: { hp: 9999, color: '#111111', name: 'Bedrock' }
};

// Game state
const state = {
  screen: 'menu',
  phase: 'mining', // 'mining' or 'defense'
  wave: 0,
  maxWaves: 10,
  waveTimer: 0,
  miningDuration: 60000, // 60 seconds to mine
  defenseDuration: 30000,

  // Resources
  iron: 0,
  water: 0,
  cobalt: 0,
  relicsFound: 0,
  relicsNeeded: 3,

  // Dome stats
  domeHp: 100,
  domeMaxHp: 100,
  domeShield: 0,
  laserDamage: 10,
  laserCooldown: 0,
  laserAngle: -Math.PI / 2,

  // Upgrades
  drillLevel: 0,
  jetpackLevel: 0,
  carryLevel: 0,
  laserLevel: 0,
  shieldLevel: 0,

  paused: false,
  showUpgradeMenu: false
};

// Player (miner)
const player = {
  x: GRID_WIDTH / 2 * TILE_SIZE,
  y: 8 * TILE_SIZE,
  radius: 8,
  speed: 80,
  drillPower: 2,
  carrying: [],
  maxCarry: 3,
  drilling: false,
  drillProgress: 0,
  drillDirection: null, // 'up', 'down', 'left', 'right'
  targetTile: null
};

// Camera - zoomed in, follows player
const camera = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  zoom: 1.0
};

// World grid
let grid = [];
let tileHealth = [];

// Enemies
let enemies = [];
let particles = [];

// Input
const keys = {};
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Dome position in world coordinates
const DOME_X = GRID_WIDTH / 2;
const DOME_Y = 4;

// Audio
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type, volume = 0.2) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch(type) {
    case 'drill':
      osc.type = 'square';
      osc.frequency.setValueAtTime(100 + Math.random() * 50, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
      break;
    case 'collect':
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'laser':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'hit':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      break;
    case 'explode':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume * 1.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'wave':
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(500, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'upgrade':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
      break;
  }
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  initAudio();

  if (e.key === 'Escape') {
    if (state.screen === 'playing') {
      if (state.showUpgradeMenu) {
        state.showUpgradeMenu = false;
      } else {
        state.paused = !state.paused;
      }
    }
  }
  if (e.key.toLowerCase() === 'e' && state.screen === 'playing' && state.phase === 'mining') {
    // Toggle upgrade menu when near dome
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    if (playerTileY < 10) {
      state.showUpgradeMenu = !state.showUpgradeMenu;
    }
  }
  if (e.key === ' ' && state.screen === 'playing' && state.phase === 'mining' && !state.showUpgradeMenu) {
    // Drop resources at dome
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    if (playerTileY < 10 && player.carrying.length > 0) {
      for (const res of player.carrying) {
        state[res]++;
      }
      player.carrying = [];
      playSound('collect');
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  handleClick();
});

canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

function handleClick() {
  if (state.screen === 'menu') {
    if (mouse.y > 300 && mouse.y < 360) {
      startNewGame();
    }
  } else if (state.screen === 'playing' && state.showUpgradeMenu) {
    handleUpgradeClick();
  } else if (state.screen === 'gameover' || state.screen === 'victory') {
    state.screen = 'menu';
  }
}

function startNewGame() {
  state.screen = 'playing';
  state.phase = 'mining';
  state.wave = 0;
  state.waveTimer = 0;
  state.iron = 0;
  state.water = 0;
  state.cobalt = 0;
  state.relicsFound = 0;

  state.domeHp = 100;
  state.domeMaxHp = 100;
  state.domeShield = 0;
  state.laserDamage = 10;

  state.drillLevel = 0;
  state.jetpackLevel = 0;
  state.carryLevel = 0;
  state.laserLevel = 0;
  state.shieldLevel = 0;
  state.showUpgradeMenu = false;

  player.x = DOME_X * TILE_SIZE;
  player.y = 8 * TILE_SIZE;
  player.drillPower = 2;
  player.speed = 80;
  player.maxCarry = 3;
  player.carrying = [];
  player.drilling = false;
  player.drillDirection = null;

  enemies = [];
  particles = [];

  // Initialize camera centered on player
  camera.x = player.x - WIDTH / 2;
  camera.y = player.y - HEIGHT / 2;
  camera.targetX = camera.x;
  camera.targetY = camera.y;

  generateWorld();
}

function generateWorld() {
  grid = [];
  tileHealth = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = [];
    tileHealth[y] = [];

    for (let x = 0; x < GRID_WIDTH; x++) {
      // Bedrock boundaries
      if (x === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1) {
        grid[y][x] = TILE.BEDROCK;
        tileHealth[y][x] = TILE_PROPS[TILE.BEDROCK].hp;
        continue;
      }

      // Top area is dome and empty (surface)
      if (y < 6) {
        // Dome area
        if (y < 5 && x >= DOME_X - 2 && x <= DOME_X + 2) {
          grid[y][x] = TILE.DOME;
        } else {
          grid[y][x] = TILE.EMPTY;
        }
        tileHealth[y][x] = 0;
        continue;
      }

      // Underground - depth-based tile generation
      const depth = y - 6;
      let tile = generateTileForDepth(depth, x, y);

      grid[y][x] = tile;
      tileHealth[y][x] = TILE_PROPS[tile].hp;
    }
  }

  // Ensure some relics exist in deep areas
  let relicCount = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (grid[y][x] === TILE.RELIC) relicCount++;
    }
  }
  while (relicCount < 5) {
    const x = 5 + Math.floor(Math.random() * (GRID_WIDTH - 10));
    const y = 60 + Math.floor(Math.random() * 30);
    if (y < GRID_HEIGHT - 1 && grid[y][x] !== TILE.RELIC && grid[y][x] !== TILE.BEDROCK) {
      grid[y][x] = TILE.RELIC;
      tileHealth[y][x] = TILE_PROPS[TILE.RELIC].hp;
      relicCount++;
    }
  }
}

function generateTileForDepth(depth, x, y) {
  // Depth zones per GDD feedback
  // 0-20: Surface layer (dirt, soft stone, iron)
  // 20-50: Middle layer (harder rocks, water, some cobalt)
  // 50-80: Deep layer (hard rocks, cobalt, relics)
  // 80-100: Danger layer (very hard, rare resources)

  const rand = Math.random();

  // Resource generation based on depth
  if (depth < 20) {
    // Surface layer
    if (rand < 0.12) return TILE.IRON;
    if (rand < 0.35) return TILE.SOFT_STONE;
    return TILE.DIRT;
  } else if (depth < 50) {
    // Middle layer
    if (rand < 0.08) return TILE.IRON;
    if (rand < 0.12) return TILE.WATER;
    if (rand < 0.14) return TILE.COBALT;
    if (rand < 0.35) return TILE.HARD_STONE;
    if (rand < 0.55) return TILE.SOFT_STONE;
    return TILE.DIRT;
  } else if (depth < 80) {
    // Deep layer
    if (rand < 0.06) return TILE.IRON;
    if (rand < 0.12) return TILE.WATER;
    if (rand < 0.18) return TILE.COBALT;
    if (rand < 0.01 + depth * 0.001) return TILE.RELIC;
    if (rand < 0.35) return TILE.DENSE_ROCK;
    if (rand < 0.60) return TILE.HARD_STONE;
    return TILE.CRYSTAL_ROCK;
  } else {
    // Danger layer
    if (rand < 0.05) return TILE.WATER;
    if (rand < 0.15) return TILE.COBALT;
    if (rand < 0.02) return TILE.RELIC;
    if (rand < 0.40) return TILE.OBSIDIAN;
    if (rand < 0.70) return TILE.DENSE_ROCK;
    return TILE.CRYSTAL_ROCK;
  }
}

function startWave() {
  state.phase = 'defense';
  state.wave++;
  state.waveTimer = 0;
  state.showUpgradeMenu = false;

  // Bring player back to dome
  player.x = DOME_X * TILE_SIZE;
  player.y = 6 * TILE_SIZE;

  // Reset camera to dome area
  camera.targetX = player.x - WIDTH / 2;
  camera.targetY = 0;

  // Spawn enemies
  const numEnemies = 3 + state.wave * 2;
  for (let i = 0; i < numEnemies; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    enemies.push({
      x: DOME_X * TILE_SIZE + side * (WIDTH / 2 + 50),
      y: 3 * TILE_SIZE + Math.random() * 3 * TILE_SIZE,
      hp: 15 + state.wave * 5,
      maxHp: 15 + state.wave * 5,
      speed: 20 + state.wave * 2,
      damage: 5 + state.wave,
      attackCooldown: 0,
      radius: 12
    });
  }

  playSound('wave');
}

function endWave() {
  state.phase = 'mining';
  state.waveTimer = 0;
  enemies = [];

  // Regenerate dome shield
  state.domeShield = state.shieldLevel * 10;

  // Check win condition
  if (state.relicsFound >= state.relicsNeeded) {
    state.screen = 'victory';
    return;
  }

  if (state.wave >= state.maxWaves) {
    state.screen = 'victory';
    return;
  }
}

function handleUpgradeClick() {
  const upgrades = getUpgradesList();
  const startY = 180;
  const itemHeight = 55;

  for (let i = 0; i < upgrades.length; i++) {
    const y = startY + i * itemHeight;
    if (mouse.y > y && mouse.y < y + itemHeight - 5 && mouse.x > 150 && mouse.x < 650) {
      const u = upgrades[i];
      if (state[u.stat] < u.max && canAfford(u.cost)) {
        payCost(u.cost);
        state[u.stat]++;
        applyUpgrade(u.stat);
        playSound('upgrade');
      }
    }
  }

  // Back button
  if (mouse.y > 530 && mouse.y < 580) {
    state.showUpgradeMenu = false;
  }
}

function getUpgradesList() {
  return [
    { name: 'Drill Power', stat: 'drillLevel', cost: { iron: 5 + state.drillLevel * 5 }, max: 5, desc: '+3 drill strength' },
    { name: 'Jetpack Speed', stat: 'jetpackLevel', cost: { iron: 4 + state.jetpackLevel * 4 }, max: 5, desc: '+20 movement speed' },
    { name: 'Carry Capacity', stat: 'carryLevel', cost: { iron: 6 + state.carryLevel * 4 }, max: 4, desc: '+2 max resources' },
    { name: 'Laser Damage', stat: 'laserLevel', cost: { iron: 8 + state.laserLevel * 6, cobalt: Math.max(1, state.laserLevel) }, max: 5, desc: '+8 laser damage' },
    { name: 'Dome Shield', stat: 'shieldLevel', cost: { iron: 10 + state.shieldLevel * 5, water: 3 + state.shieldLevel * 2 }, max: 5, desc: '+25 shield HP' }
  ];
}

function canAfford(cost) {
  for (const [res, amount] of Object.entries(cost)) {
    if (state[res] < amount) return false;
  }
  return true;
}

function payCost(cost) {
  for (const [res, amount] of Object.entries(cost)) {
    state[res] -= amount;
  }
}

function applyUpgrade(stat) {
  switch (stat) {
    case 'drillLevel':
      player.drillPower = 2 + state.drillLevel * 3;
      break;
    case 'jetpackLevel':
      player.speed = 80 + state.jetpackLevel * 20;
      break;
    case 'carryLevel':
      player.maxCarry = 3 + state.carryLevel * 2;
      break;
    case 'laserLevel':
      state.laserDamage = 10 + state.laserLevel * 8;
      break;
    case 'shieldLevel':
      state.domeMaxHp = 100 + state.shieldLevel * 25;
      state.domeShield = state.shieldLevel * 15;
      break;
  }
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused || state.showUpgradeMenu) return;

  state.waveTimer += dt;

  if (state.phase === 'mining') {
    updateMining(dt);

    // Check if mining time is up
    if (state.waveTimer >= state.miningDuration) {
      startWave();
    }
  } else {
    updateDefense(dt);

    // Check if all enemies dead or time up
    if (enemies.length === 0 || state.waveTimer >= state.defenseDuration) {
      endWave();
    }
  }

  // Update camera - smooth follow
  updateCamera(dt);

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt / 1000;
    p.y += p.vy * dt / 1000;
    p.vy += 200 * dt / 1000; // Gravity
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updateCamera(dt) {
  // Camera follows player
  camera.targetX = player.x - WIDTH / 2;
  camera.targetY = player.y - HEIGHT / 2;

  // Clamp to map bounds
  const maxCameraX = GRID_WIDTH * TILE_SIZE - WIDTH;
  const maxCameraY = GRID_HEIGHT * TILE_SIZE - HEIGHT;
  camera.targetX = Math.max(0, Math.min(maxCameraX, camera.targetX));
  camera.targetY = Math.max(0, Math.min(maxCameraY, camera.targetY));

  // Smooth follow
  camera.x += (camera.targetX - camera.x) * CAMERA_FOLLOW_SPEED;
  camera.y += (camera.targetY - camera.y) * CAMERA_FOLLOW_SPEED;
}

function updateMining(dt) {
  // Player movement
  let dx = 0, dy = 0;
  const moveUp = keys['w'] || keys['arrowup'];
  const moveDown = keys['s'] || keys['arrowdown'];
  const moveLeft = keys['a'] || keys['arrowleft'];
  const moveRight = keys['d'] || keys['arrowright'];

  if (moveUp) dy -= 1;
  if (moveDown) dy += 1;
  if (moveLeft) dx -= 1;
  if (moveRight) dx += 1;

  // Determine drill direction based on movement keys
  let drillDir = null;
  if (moveDown && !moveUp && !moveLeft && !moveRight) drillDir = 'down';
  else if (moveUp && !moveDown && !moveLeft && !moveRight) drillDir = 'up';
  else if (moveLeft && !moveRight && !moveUp && !moveDown) drillDir = 'left';
  else if (moveRight && !moveLeft && !moveUp && !moveDown) drillDir = 'right';

  // Get target tile for drilling in any direction
  const playerTileX = Math.floor(player.x / TILE_SIZE);
  const playerTileY = Math.floor(player.y / TILE_SIZE);

  let targetTileX = playerTileX;
  let targetTileY = playerTileY;

  if (drillDir === 'down') targetTileY = playerTileY + 1;
  else if (drillDir === 'up') targetTileY = playerTileY - 1;
  else if (drillDir === 'left') targetTileX = playerTileX - 1;
  else if (drillDir === 'right') targetTileX = playerTileX + 1;

  // Check if we can drill in the target direction
  let canDrill = false;
  if (drillDir && targetTileX >= 0 && targetTileX < GRID_WIDTH && targetTileY >= 0 && targetTileY < GRID_HEIGHT) {
    const tile = grid[targetTileY][targetTileX];
    if (tile !== TILE.EMPTY && tile !== TILE.DOME && tile !== TILE.BEDROCK) {
      canDrill = true;
    }
  }

  if (canDrill && drillDir) {
    // Drilling in a direction
    player.drilling = true;
    player.drillDirection = drillDir;
    player.drillProgress += player.drillPower * dt / 1000;

    if (player.drillProgress >= 0.25) {
      player.drillProgress = 0;
      const tile = grid[targetTileY][targetTileX];
      tileHealth[targetTileY][targetTileX] -= player.drillPower;
      playSound('drill');

      // Mining particles
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: targetTileX * TILE_SIZE + TILE_SIZE / 2,
          y: targetTileY * TILE_SIZE + TILE_SIZE / 2,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 400,
          color: TILE_PROPS[tile].color,
          size: 3
        });
      }

      if (tileHealth[targetTileY][targetTileX] <= 0) {
        // Tile destroyed - collect resources
        const props = TILE_PROPS[tile];
        if (props.resource && player.carrying.length < player.maxCarry) {
          const amount = props.amount[0] + Math.floor(Math.random() * (props.amount[1] - props.amount[0] + 1));
          for (let i = 0; i < amount && player.carrying.length < player.maxCarry; i++) {
            player.carrying.push(props.resource);
          }
          playSound('collect');

          if (props.resource === 'relic') {
            state.relicsFound++;
          }
        }
        grid[targetTileY][targetTileX] = TILE.EMPTY;

        // Move player into the cleared space
        if (drillDir === 'down') player.y += TILE_SIZE;
        else if (drillDir === 'up') player.y -= TILE_SIZE;
        else if (drillDir === 'left') player.x -= TILE_SIZE;
        else if (drillDir === 'right') player.x += TILE_SIZE;
      }
    }
  } else {
    // Not drilling - try to move
    player.drilling = false;
    player.drillDirection = null;
    player.drillProgress = 0;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      const speed = player.speed * dt / 1000;
      const newX = player.x + dx * speed;
      const newY = player.y + dy * speed;

      // Check collision with tiles
      const newTileX = Math.floor(newX / TILE_SIZE);
      const newTileY = Math.floor(newY / TILE_SIZE);

      // Check if destination is walkable
      if (newTileX >= 0 && newTileX < GRID_WIDTH && newTileY >= 0 && newTileY < GRID_HEIGHT) {
        const destTile = grid[newTileY][newTileX];
        if (destTile === TILE.EMPTY || destTile === TILE.DOME) {
          player.x = Math.max(TILE_SIZE, Math.min((GRID_WIDTH - 1) * TILE_SIZE, newX));
          player.y = Math.max(TILE_SIZE, Math.min((GRID_HEIGHT - 1) * TILE_SIZE, newY));
        }
      }
    }
  }
}

function updateDefense(dt) {
  // Camera stays at dome during defense
  camera.targetX = DOME_X * TILE_SIZE - WIDTH / 2;
  camera.targetY = 0;

  // Aim laser at mouse (convert screen to world coords)
  const domeWorldX = DOME_X * TILE_SIZE;
  const domeWorldY = 4 * TILE_SIZE;
  const domeScreenX = domeWorldX - camera.x;
  const domeScreenY = domeWorldY - camera.y;

  state.laserAngle = Math.atan2(mouse.y - domeScreenY, mouse.x - domeScreenX);

  // Fire laser
  if (state.laserCooldown > 0) state.laserCooldown -= dt;

  if (mouse.down && state.laserCooldown <= 0) {
    state.laserCooldown = 200 - state.laserLevel * 20;
    playSound('laser');

    // Check laser hit
    const laserLen = 500;
    const laserEndX = domeWorldX + Math.cos(state.laserAngle) * laserLen;
    const laserEndY = domeWorldY + Math.sin(state.laserAngle) * laserLen;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      // Line-circle collision
      const dist = pointToLineDistance(e.x, e.y, domeWorldX, domeWorldY, laserEndX, laserEndY);
      if (dist < e.radius + 5) {
        e.hp -= state.laserDamage;

        // Hit particles
        for (let j = 0; j < 5; j++) {
          particles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 300,
            color: COLORS.laser,
            size: 3
          });
        }

        if (e.hp <= 0) {
          playSound('explode');
          // Death particles
          for (let j = 0; j < 10; j++) {
            particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 150,
              vy: (Math.random() - 0.5) * 150,
              life: 500,
              color: COLORS.enemy,
              size: 4
            });
          }
          enemies.splice(i, 1);
        }
      }
    }
  }

  // Update enemies
  const domeWorldCenterX = DOME_X * TILE_SIZE;
  const domeWorldCenterY = 4 * TILE_SIZE;

  for (const e of enemies) {
    // Move toward dome
    const targetX = domeWorldCenterX + (Math.random() - 0.5) * 60;
    const targetY = domeWorldCenterY;
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 50) {
      e.x += (dx / dist) * e.speed * dt / 1000;
      e.y += (dy / dist) * e.speed * dt / 1000;
    }

    // Attack dome when close
    if (dist < 80) {
      e.attackCooldown -= dt;
      if (e.attackCooldown <= 0) {
        e.attackCooldown = 1000;
        // Shield absorbs damage first
        if (state.domeShield > 0) {
          state.domeShield = Math.max(0, state.domeShield - e.damage);
        } else {
          state.domeHp -= e.damage;
          playSound('hit');
        }

        if (state.domeHp <= 0) {
          state.domeHp = 0;
          state.screen = 'gameover';
        }
      }
    }
  }
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return Math.hypot(px - xx, py - yy);
}

// Rendering
function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (state.screen) {
    case 'menu': renderMenu(); break;
    case 'playing': renderGame(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderMenu() {
  ctx.fillStyle = COLORS.dome;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DOME', WIDTH/2, 150);
  ctx.fillText('DEFENDER', WIDTH/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.fillText('Mining Survival', WIDTH/2, 250);

  // Start button
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(250, 300, 300, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('START', WIDTH/2, 340);

  // Instructions
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText('WASD - Move & Dig in ALL 4 directions!', WIDTH/2, 400);
  ctx.fillText('SPACE - Drop resources at dome', WIDTH/2, 425);
  ctx.fillText('E - Open upgrades (near dome)', WIDTH/2, 450);
  ctx.fillText('MOUSE - Aim laser during defense', WIDTH/2, 475);
  ctx.fillStyle = COLORS.relic;
  ctx.fillText('Find 3 relics deep underground to win!', WIDTH/2, 510);
}

function renderGame() {
  // Calculate visible tile range based on camera
  const startTileX = Math.floor(camera.x / TILE_SIZE) - 1;
  const startTileY = Math.floor(camera.y / TILE_SIZE) - 1;
  const endTileX = Math.ceil((camera.x + WIDTH) / TILE_SIZE) + 1;
  const endTileY = Math.ceil((camera.y + HEIGHT) / TILE_SIZE) + 1;

  // Draw tiles
  for (let y = Math.max(0, startTileY); y < Math.min(GRID_HEIGHT, endTileY); y++) {
    for (let x = Math.max(0, startTileX); x < Math.min(GRID_WIDTH, endTileX); x++) {
      const tile = grid[y][x];
      if (tile === TILE.EMPTY) continue;

      const screenX = x * TILE_SIZE - camera.x;
      const screenY = y * TILE_SIZE - camera.y;

      const props = TILE_PROPS[tile];

      if (tile === TILE.DOME) {
        // Draw dome
        const domeScreenX = DOME_X * TILE_SIZE - camera.x;
        const domeScreenY = 4 * TILE_SIZE - camera.y;

        // Dome glow
        const gradient = ctx.createRadialGradient(domeScreenX, domeScreenY, 20, domeScreenX, domeScreenY, 50);
        gradient.addColorStop(0, COLORS.domeGlow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(domeScreenX - 60, domeScreenY - 60, 120, 120);

        ctx.fillStyle = COLORS.dome;
        ctx.beginPath();
        ctx.arc(domeScreenX, domeScreenY, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLORS.domeGlow;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Regular tile
        ctx.fillStyle = props.color;
        ctx.fillRect(screenX, screenY, TILE_SIZE - 1, TILE_SIZE - 1);

        // Show damage cracks
        if (tileHealth[y] && tileHealth[y][x] < props.hp) {
          const damageRatio = 1 - tileHealth[y][x] / props.hp;
          ctx.fillStyle = `rgba(0,0,0,${damageRatio * 0.5})`;
          ctx.fillRect(screenX, screenY, TILE_SIZE - 1, TILE_SIZE - 1);
        }

        // Resource glow
        if (props.resource) {
          ctx.strokeStyle = props.resource === 'iron' ? COLORS.ironGlow :
                           props.resource === 'water' ? COLORS.waterGlow :
                           props.resource === 'cobalt' ? COLORS.cobaltGlow :
                           COLORS.relicGlow;
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 3, TILE_SIZE - 3);
        }
      }
    }
  }

  // Particles
  for (const p of particles) {
    const screenX = p.x - camera.x;
    const screenY = p.y - camera.y;
    ctx.globalAlpha = p.life / 500;
    ctx.fillStyle = p.color;
    ctx.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (state.phase === 'defense') {
    // Draw laser
    if (mouse.down) {
      const domeScreenX = DOME_X * TILE_SIZE - camera.x;
      const domeScreenY = 4 * TILE_SIZE - camera.y;
      const laserLen = 500;

      ctx.strokeStyle = COLORS.laserGlow;
      ctx.lineWidth = 10;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(domeScreenX, domeScreenY);
      ctx.lineTo(domeScreenX + Math.cos(state.laserAngle) * laserLen, domeScreenY + Math.sin(state.laserAngle) * laserLen);
      ctx.stroke();

      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // Draw enemies
    for (const e of enemies) {
      const screenX = e.x - camera.x;
      const screenY = e.y - camera.y;

      // Enemy glow
      ctx.fillStyle = COLORS.enemyGlow;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(screenX, screenY, e.radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = COLORS.enemy;
      ctx.beginPath();
      ctx.arc(screenX, screenY, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(screenX - 15, screenY - e.radius - 10, 30, 5);
      ctx.fillStyle = COLORS.hp;
      ctx.fillRect(screenX - 15, screenY - e.radius - 10, 30 * (e.hp / e.maxHp), 5);
    }
  } else {
    // Draw player during mining
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Player glow
    ctx.fillStyle = COLORS.playerGlow;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Drill indicator - shows direction
    if (player.drilling && player.drillDirection) {
      ctx.strokeStyle = COLORS.player;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);

      let drillOffsetX = 0, drillOffsetY = 0;
      if (player.drillDirection === 'down') drillOffsetY = player.radius + 8;
      else if (player.drillDirection === 'up') drillOffsetY = -(player.radius + 8);
      else if (player.drillDirection === 'left') drillOffsetX = -(player.radius + 8);
      else if (player.drillDirection === 'right') drillOffsetX = player.radius + 8;

      ctx.lineTo(screenX + drillOffsetX, screenY + drillOffsetY);
      ctx.stroke();

      // Drill sparks
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(screenX + drillOffsetX - 2, screenY + drillOffsetY - 2, 4, 4);
    }

    // Carrying indicator
    if (player.carrying.length > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.carrying.length}/${player.maxCarry}`, screenX, screenY - player.radius - 8);
    }
  }

  // HUD
  renderHUD();

  // Upgrade menu overlay
  if (state.showUpgradeMenu) {
    renderUpgradeMenu();
  }
}

function renderHUD() {
  // Top bar background
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, WIDTH, 40);

  // Phase and timer
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  const timeLeft = Math.ceil(((state.phase === 'mining' ? state.miningDuration : state.defenseDuration) - state.waveTimer) / 1000);
  const phaseText = state.phase === 'mining' ? 'MINING' : 'DEFENSE';
  ctx.fillText(`${phaseText} - ${timeLeft}s  |  Wave ${state.wave}/${state.maxWaves}`, WIDTH/2, 16);

  // Dome HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 24, 120, 10);
  ctx.fillStyle = COLORS.dome;
  ctx.fillRect(10, 24, 120 * (state.domeHp / state.domeMaxHp), 10);
  if (state.domeShield > 0) {
    ctx.fillStyle = '#6688ff';
    ctx.fillRect(10, 24, 120 * (state.domeShield / Math.max(1, state.shieldLevel * 15)), 4);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HP:${state.domeHp}/${state.domeMaxHp}`, 12, 32);

  // Resources
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = COLORS.iron;
  ctx.fillText(`Iron:${state.iron}`, WIDTH - 10, 16);
  ctx.fillStyle = COLORS.water;
  ctx.fillText(`Water:${state.water}`, WIDTH - 90, 16);
  ctx.fillStyle = COLORS.cobalt;
  ctx.fillText(`Cobalt:${state.cobalt}`, WIDTH - 170, 16);

  // Relics
  ctx.fillStyle = COLORS.relic;
  ctx.textAlign = 'left';
  ctx.fillText(`Relics:${state.relicsFound}/${state.relicsNeeded}`, 140, 32);

  // Depth indicator
  const depth = Math.max(0, Math.floor(player.y / TILE_SIZE) - 6);
  ctx.fillStyle = '#888';
  ctx.textAlign = 'right';
  ctx.fillText(`Depth:${depth}`, WIDTH - 10, 32);

  // Mining phase - show E to upgrade hint
  if (state.phase === 'mining') {
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    if (playerTileY < 10) {
      ctx.fillStyle = '#88ff88';
      ctx.textAlign = 'center';
      ctx.fillText('Press E for Upgrades | SPACE to drop resources', WIDTH/2, 32);
    }
  }
}

function renderUpgradeMenu() {
  // Darken background
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = COLORS.dome;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DOME UPGRADES', WIDTH/2, 60);

  // Resources display
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`Iron: ${state.iron}  |  Water: ${state.water}  |  Cobalt: ${state.cobalt}`, WIDTH/2, 100);

  // Upgrades list
  const upgrades = getUpgradesList();
  ctx.font = '12px monospace';

  const startY = 180;
  const itemHeight = 55;

  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    const y = startY + i * itemHeight;
    const level = state[u.stat];
    const canBuy = level < u.max && canAfford(u.cost);

    // Background
    ctx.fillStyle = canBuy ? '#335533' : '#333333';
    ctx.fillRect(150, y, 500, itemHeight - 5);

    // Highlight on hover
    if (mouse.y > y && mouse.y < y + itemHeight - 5 && mouse.x > 150 && mouse.x < 650) {
      ctx.fillStyle = canBuy ? '#446644' : '#444444';
      ctx.fillRect(150, y, 500, itemHeight - 5);
    }

    // Name and level
    ctx.fillStyle = canBuy ? '#fff' : '#888';
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${u.name}`, 170, y + 20);

    // Level indicators
    ctx.font = '12px monospace';
    for (let lv = 0; lv < u.max; lv++) {
      ctx.fillStyle = lv < level ? '#88ff88' : '#444';
      ctx.fillRect(170 + lv * 25, y + 28, 20, 8);
    }

    // Description
    ctx.fillStyle = '#aaa';
    ctx.fillText(u.desc, 170, y + 48);

    // Cost
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffcc00';
    if (level >= u.max) {
      ctx.fillText('MAX', 630, y + 30);
    } else {
      const costStr = Object.entries(u.cost).map(([r, a]) => `${r}:${a}`).join(' ');
      ctx.fillText(costStr, 630, y + 30);
    }
  }

  // Back button
  ctx.fillStyle = '#444488';
  ctx.fillRect(300, 530, 200, 45);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('BACK (ESC)', WIDTH/2, 558);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DOME DESTROYED', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(`Waves Survived: ${state.wave}`, WIDTH/2, 300);
  ctx.fillText(`Relics Found: ${state.relicsFound}/${state.relicsNeeded}`, WIDTH/2, 340);

  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  ctx.fillText('Click to continue', WIDTH/2, 450);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.relic;
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('All relics recovered!', WIDTH/2, 280);
  ctx.fillText(`Waves Survived: ${state.wave}`, WIDTH/2, 340);

  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  ctx.fillText('Click to continue', WIDTH/2, 450);
}

// Game loop
let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min(time - lastTime, 100); // Cap delta to prevent huge jumps
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
