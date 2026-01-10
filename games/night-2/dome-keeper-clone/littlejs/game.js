// Dome Defender - Mining Survival (Dome Keeper Clone)
// Mine resources, defend your dome, find the relic

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 16;
const GRID_WIDTH = 50;
const GRID_HEIGHT = 35;

// Colors
const COLORS = {
  bg: '#1a1020',
  dome: '#4488cc',
  domeGlow: '#66aaff',
  player: '#ffcc00',
  dirt: '#553311',
  dirtLight: '#664422',
  rock: '#444444',
  rockLight: '#555555',
  iron: '#886644',
  water: '#4488ff',
  cobalt: '#8844ff',
  relic: '#ffdd00',
  empty: '#0a0810',
  laser: '#ff4444',
  laserGlow: '#ff8888',
  enemy: '#ff3366',
  enemyGlow: '#ff6699',
  hp: '#44ff44',
  text: '#ffffff'
};

// Tile types
const TILE = {
  EMPTY: 0,
  DIRT: 1,
  ROCK: 2,
  HARD_ROCK: 3,
  IRON: 4,
  WATER: 5,
  COBALT: 6,
  RELIC: 7,
  DOME: 8
};

// Tile properties
const TILE_PROPS = {
  [TILE.EMPTY]: { hp: 0, color: COLORS.empty },
  [TILE.DIRT]: { hp: 4, color: COLORS.dirt },
  [TILE.ROCK]: { hp: 12, color: COLORS.rock },
  [TILE.HARD_ROCK]: { hp: 24, color: '#333333' },
  [TILE.IRON]: { hp: 8, color: COLORS.iron, resource: 'iron', amount: [1, 3] },
  [TILE.WATER]: { hp: 6, color: COLORS.water, resource: 'water', amount: [1, 2] },
  [TILE.COBALT]: { hp: 10, color: COLORS.cobalt, resource: 'cobalt', amount: [1, 2] },
  [TILE.RELIC]: { hp: 20, color: COLORS.relic, resource: 'relic', amount: [1, 1] },
  [TILE.DOME]: { hp: 999, color: COLORS.dome }
};

// Game state
const state = {
  screen: 'menu',
  phase: 'mining', // 'mining' or 'defense'
  wave: 0,
  maxWaves: 10,
  waveTimer: 0,
  miningDuration: 45000, // 45 seconds to mine
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

  paused: false
};

// Player (miner)
const player = {
  x: WIDTH / 2,
  y: 80,
  radius: 8,
  speed: 60,
  drillPower: 2,
  carrying: [],
  maxCarry: 3,
  drilling: false,
  drillProgress: 0,
  targetTile: null
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

// Camera offset for mining view
let cameraY = 0;

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
  }
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  initAudio();

  if (e.key === 'Escape') {
    if (state.screen === 'playing') state.paused = !state.paused;
  }
  if (e.key.toLowerCase() === 'e' && state.screen === 'playing' && state.phase === 'mining') {
    // Open upgrade menu when near dome
    if (player.y < 100) {
      state.screen = 'upgrades';
    }
  }
  if (e.key === ' ' && state.screen === 'playing' && state.phase === 'mining') {
    // Drop resources at dome
    if (player.y < 100 && player.carrying.length > 0) {
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
  } else if (state.screen === 'upgrades') {
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

  player.x = WIDTH / 2;
  player.y = 80;
  player.drillPower = 2;
  player.speed = 60;
  player.maxCarry = 3;
  player.carrying = [];

  enemies = [];
  particles = [];
  cameraY = 0;

  generateWorld();
}

function generateWorld() {
  grid = [];
  tileHealth = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = [];
    tileHealth[y] = [];

    for (let x = 0; x < GRID_WIDTH; x++) {
      // Top area is dome and empty
      if (y < 5) {
        if (y < 3 && x >= 23 && x <= 27) {
          grid[y][x] = TILE.DOME;
        } else {
          grid[y][x] = TILE.EMPTY;
        }
        tileHealth[y][x] = 0;
        continue;
      }

      // Underground
      const depth = y - 5;
      let tile = TILE.DIRT;

      // Harder tiles deeper
      if (depth > 10 && Math.random() < 0.3) tile = TILE.ROCK;
      if (depth > 20 && Math.random() < 0.4) tile = TILE.HARD_ROCK;

      // Resources
      if (Math.random() < 0.08) tile = TILE.IRON;
      if (depth > 8 && Math.random() < 0.05) tile = TILE.WATER;
      if (depth > 15 && Math.random() < 0.04) tile = TILE.COBALT;

      // Relics at deep locations
      if (depth > 20 && Math.random() < 0.01) tile = TILE.RELIC;

      grid[y][x] = tile;
      tileHealth[y][x] = TILE_PROPS[tile].hp;
    }
  }

  // Ensure some relics exist
  let relicCount = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (grid[y][x] === TILE.RELIC) relicCount++;
    }
  }
  while (relicCount < 3) {
    const x = 5 + Math.floor(Math.random() * (GRID_WIDTH - 10));
    const y = 25 + Math.floor(Math.random() * (GRID_HEIGHT - 27));
    if (grid[y][x] !== TILE.RELIC) {
      grid[y][x] = TILE.RELIC;
      tileHealth[y][x] = TILE_PROPS[TILE.RELIC].hp;
      relicCount++;
    }
  }
}

function startWave() {
  state.phase = 'defense';
  state.wave++;
  state.waveTimer = 0;

  // Bring player back to dome
  player.x = WIDTH / 2;
  player.y = 60;

  // Spawn enemies
  const numEnemies = 3 + state.wave * 2;
  for (let i = 0; i < numEnemies; i++) {
    // Spawn from sides
    const side = Math.random() < 0.5 ? -1 : 1;
    enemies.push({
      x: WIDTH / 2 + side * (WIDTH / 2 + 50),
      y: 30 + Math.random() * 40,
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
  const upgrades = [
    { name: 'Drill', stat: 'drillLevel', cost: { iron: 4 + state.drillLevel * 4 }, max: 5 },
    { name: 'Jetpack', stat: 'jetpackLevel', cost: { iron: 3 + state.jetpackLevel * 3 }, max: 5 },
    { name: 'Carry', stat: 'carryLevel', cost: { iron: 4 + state.carryLevel * 4 }, max: 4 },
    { name: 'Laser', stat: 'laserLevel', cost: { iron: 5 + state.laserLevel * 5, cobalt: state.laserLevel }, max: 5 },
    { name: 'Shield', stat: 'shieldLevel', cost: { iron: 6 + state.shieldLevel * 4, water: 2 + state.shieldLevel * 2 }, max: 5 }
  ];

  for (let i = 0; i < upgrades.length; i++) {
    const y = 200 + i * 60;
    if (mouse.y > y && mouse.y < y + 50 && mouse.x > 200 && mouse.x < 600) {
      const u = upgrades[i];
      if (state[u.stat] < u.max && canAfford(u.cost)) {
        payCost(u.cost);
        state[u.stat]++;
        applyUpgrade(u.stat);
        playSound('collect');
      }
    }
  }

  // Back button
  if (mouse.y > 520 && mouse.y < 570) {
    state.screen = 'playing';
  }
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
      player.speed = 60 + state.jetpackLevel * 15;
      break;
    case 'carryLevel':
      player.maxCarry = 3 + state.carryLevel * 2;
      break;
    case 'laserLevel':
      state.laserDamage = 10 + state.laserLevel * 5;
      break;
    case 'shieldLevel':
      state.domeMaxHp = 100 + state.shieldLevel * 20;
      state.domeShield = state.shieldLevel * 10;
      break;
  }
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;

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

function updateMining(dt) {
  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    const speed = player.speed * dt / 1000;
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;

    // Check collision with tiles
    const tileX = Math.floor(newX / TILE_SIZE);
    const tileY = Math.floor((newY + cameraY) / TILE_SIZE);

    if (tileX >= 0 && tileX < GRID_WIDTH && tileY >= 0 && tileY < GRID_HEIGHT) {
      if (grid[tileY][tileX] === TILE.EMPTY || grid[tileY][tileX] === TILE.DOME) {
        player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, newX));
        player.y = Math.max(0, Math.min(HEIGHT - player.radius, newY));
      }
    }
  }

  // Drilling
  const tileX = Math.floor(player.x / TILE_SIZE);
  const tileY = Math.floor((player.y + cameraY + player.radius + 2) / TILE_SIZE);

  if (keys['s'] || keys['arrowdown']) {
    if (tileY >= 0 && tileY < GRID_HEIGHT && tileX >= 0 && tileX < GRID_WIDTH) {
      const tile = grid[tileY][tileX];
      if (tile !== TILE.EMPTY && tile !== TILE.DOME) {
        player.drilling = true;
        player.drillProgress += player.drillPower * dt / 1000;

        if (player.drillProgress >= 0.3) {
          player.drillProgress = 0;
          tileHealth[tileY][tileX] -= player.drillPower;
          playSound('drill');

          // Mining particles
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: tileX * TILE_SIZE + TILE_SIZE / 2,
              y: tileY * TILE_SIZE - cameraY,
              vx: (Math.random() - 0.5) * 50,
              vy: -Math.random() * 30,
              life: 500,
              color: TILE_PROPS[tile].color,
              size: 3
            });
          }

          if (tileHealth[tileY][tileX] <= 0) {
            // Tile destroyed
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
            grid[tileY][tileX] = TILE.EMPTY;
          }
        }
      } else {
        player.drilling = false;
      }
    }
  } else {
    player.drilling = false;
    player.drillProgress = 0;
  }

  // Camera follows player when underground
  if (player.y > HEIGHT * 0.6) {
    cameraY = Math.min((GRID_HEIGHT * TILE_SIZE) - HEIGHT, Math.max(0, cameraY + (player.y - HEIGHT * 0.6) * 0.1));
  } else if (player.y < HEIGHT * 0.3 && cameraY > 0) {
    cameraY = Math.max(0, cameraY - 2);
  }
}

function updateDefense(dt) {
  // Aim laser at mouse
  const domeX = WIDTH / 2;
  const domeY = 50;
  state.laserAngle = Math.atan2(mouse.y - domeY, mouse.x - domeX);

  // Fire laser
  if (state.laserCooldown > 0) state.laserCooldown -= dt;

  if (mouse.down && state.laserCooldown <= 0) {
    state.laserCooldown = 200 - state.laserLevel * 20;
    playSound('laser');

    // Check laser hit
    const laserLen = 400;
    const laserEndX = domeX + Math.cos(state.laserAngle) * laserLen;
    const laserEndY = domeY + Math.sin(state.laserAngle) * laserLen;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      // Line-circle collision
      const dist = pointToLineDistance(e.x, e.y, domeX, domeY, laserEndX, laserEndY);
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
  const domeLeft = WIDTH / 2 - 40;
  const domeRight = WIDTH / 2 + 40;
  const domeTop = 20;
  const domeBottom = 70;

  for (const e of enemies) {
    // Move toward dome
    const targetX = WIDTH / 2 + (Math.random() - 0.5) * 60;
    const targetY = 50;
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 60) {
      e.x += (dx / dist) * e.speed * dt / 1000;
      e.y += (dy / dist) * e.speed * dt / 1000;
    }

    // Attack dome
    if (e.x > domeLeft - 30 && e.x < domeRight + 30 && e.y > domeTop - 20 && e.y < domeBottom + 20) {
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
    case 'upgrades': renderUpgrades(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderMenu() {
  ctx.fillStyle = COLORS.dome;
  ctx.font = 'bold 36px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('DOME', WIDTH/2, 150);
  ctx.fillText('DEFENDER', WIDTH/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Mining Survival', WIDTH/2, 250);

  // Start button
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(250, 300, 300, 60);
  ctx.fillStyle = '#fff';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillText('START', WIDTH/2, 340);

  // Instructions
  ctx.fillStyle = '#888';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('WASD - Move, S to drill down', WIDTH/2, 420);
  ctx.fillText('SPACE - Drop resources at dome', WIDTH/2, 445);
  ctx.fillText('E - Upgrades, MOUSE - Aim laser', WIDTH/2, 470);
  ctx.fillText('Find 3 relics to win!', WIDTH/2, 510);
}

function renderGame() {
  // Draw tiles
  const startY = Math.floor(cameraY / TILE_SIZE);
  const endY = Math.min(GRID_HEIGHT, startY + Math.ceil(HEIGHT / TILE_SIZE) + 1);

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = grid[y][x];
      if (tile === TILE.EMPTY) continue;

      const screenX = x * TILE_SIZE;
      const screenY = y * TILE_SIZE - cameraY;

      const props = TILE_PROPS[tile];
      ctx.fillStyle = props.color;

      if (tile === TILE.DOME) {
        // Draw dome
        ctx.fillStyle = COLORS.dome;
        ctx.beginPath();
        ctx.arc(WIDTH / 2, 50, 45, 0, Math.PI * 2);
        ctx.fill();

        // Dome glow
        ctx.strokeStyle = COLORS.domeGlow;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillRect(screenX, screenY, TILE_SIZE - 1, TILE_SIZE - 1);

        // Show damage
        if (tileHealth[y][x] < props.hp) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(screenX, screenY, TILE_SIZE - 1, TILE_SIZE - 1);
        }
      }
    }
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 500;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (state.phase === 'defense') {
    // Draw laser
    if (mouse.down) {
      const domeX = WIDTH / 2;
      const domeY = 50;
      const laserLen = 400;

      ctx.strokeStyle = COLORS.laserGlow;
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(domeX, domeY);
      ctx.lineTo(domeX + Math.cos(state.laserAngle) * laserLen, domeY + Math.sin(state.laserAngle) * laserLen);
      ctx.stroke();

      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // Draw enemies
    for (const e of enemies) {
      ctx.fillStyle = COLORS.enemy;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - 15, e.y - e.radius - 8, 30, 4);
      ctx.fillStyle = COLORS.hp;
      ctx.fillRect(e.x - 15, e.y - e.radius - 8, 30 * (e.hp / e.maxHp), 4);
    }
  } else {
    // Draw player during mining
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Drill indicator
    if (player.drilling) {
      ctx.strokeStyle = COLORS.player;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + player.radius);
      ctx.lineTo(player.x, player.y + player.radius + 10);
      ctx.stroke();
    }

    // Carrying indicator
    if (player.carrying.length > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.carrying.length}/${player.maxCarry}`, player.x, player.y - player.radius - 5);
    }
  }

  // HUD
  renderHUD();
}

function renderHUD() {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, WIDTH, 35);

  // Phase and timer
  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  const timeLeft = Math.ceil(((state.phase === 'mining' ? state.miningDuration : state.defenseDuration) - state.waveTimer) / 1000);
  ctx.fillText(`${state.phase === 'mining' ? 'MINING' : 'DEFENSE'} - ${timeLeft}s  |  Wave ${state.wave}/${state.maxWaves}`, WIDTH/2, 14);

  // Dome HP
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 20, 100, 10);
  ctx.fillStyle = COLORS.dome;
  ctx.fillRect(10, 20, 100 * (state.domeHp / state.domeMaxHp), 10);
  if (state.domeShield > 0) {
    ctx.fillStyle = '#6666ff';
    ctx.fillRect(10, 20, 100 * (state.domeShield / (state.shieldLevel * 10)), 3);
  }

  // Resources
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.iron;
  ctx.fillText(`Iron:${state.iron}`, WIDTH - 10, 14);
  ctx.fillStyle = COLORS.water;
  ctx.fillText(`Water:${state.water}`, WIDTH - 100, 14);
  ctx.fillStyle = COLORS.cobalt;
  ctx.fillText(`Cobalt:${state.cobalt}`, WIDTH - 200, 14);

  // Relics
  ctx.fillStyle = COLORS.relic;
  ctx.textAlign = 'left';
  ctx.fillText(`Relics:${state.relicsFound}/${state.relicsNeeded}`, 120, 28);
}

function renderUpgrades() {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.dome;
  ctx.font = '24px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('UPGRADES', WIDTH/2, 80);

  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText(`Iron:${state.iron} Water:${state.water} Cobalt:${state.cobalt}`, WIDTH/2, 120);

  const upgrades = [
    { name: 'Drill', stat: 'drillLevel', cost: { iron: 4 + state.drillLevel * 4 }, max: 5, desc: '+3 power' },
    { name: 'Jetpack', stat: 'jetpackLevel', cost: { iron: 3 + state.jetpackLevel * 3 }, max: 5, desc: '+15 speed' },
    { name: 'Carry', stat: 'carryLevel', cost: { iron: 4 + state.carryLevel * 4 }, max: 4, desc: '+2 capacity' },
    { name: 'Laser', stat: 'laserLevel', cost: { iron: 5 + state.laserLevel * 5, cobalt: state.laserLevel }, max: 5, desc: '+5 damage' },
    { name: 'Shield', stat: 'shieldLevel', cost: { iron: 6 + state.shieldLevel * 4, water: 2 + state.shieldLevel * 2 }, max: 5, desc: '+20 HP' }
  ];

  ctx.font = '10px "Press Start 2P"';
  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    const y = 200 + i * 60;
    const level = state[u.stat];
    const canBuy = level < u.max && canAfford(u.cost);

    ctx.fillStyle = canBuy ? '#446644' : '#333333';
    ctx.fillRect(200, y, 400, 50);

    ctx.fillStyle = canBuy ? '#fff' : '#666';
    ctx.textAlign = 'left';
    ctx.fillText(`${u.name} Lv${level}`, 220, y + 25);
    ctx.fillText(u.desc, 220, y + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffcc00';
    const costStr = Object.entries(u.cost).map(([r, a]) => `${r}:${a}`).join(' ');
    ctx.fillText(level >= u.max ? 'MAX' : costStr, 580, y + 30);
  }

  // Back button
  ctx.fillStyle = '#444488';
  ctx.fillRect(300, 520, 200, 50);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('BACK', WIDTH/2, 550);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ff4444';
  ctx.font = '32px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('DOME DESTROYED', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText(`Waves Survived: ${state.wave}`, WIDTH/2, 300);
  ctx.fillText(`Relics Found: ${state.relicsFound}/${state.relicsNeeded}`, WIDTH/2, 340);

  ctx.fillStyle = '#888';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Click to continue', WIDTH/2, 450);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.relic;
  ctx.font = '32px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('All relics recovered!', WIDTH/2, 280);
  ctx.fillText(`Waves Survived: ${state.wave}`, WIDTH/2, 340);

  ctx.fillStyle = '#888';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Click to continue', WIDTH/2, 450);
}

// Game loop
let lastTime = 0;
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
