// MOTHERLOAD - Polished Edition (LittleJS)
// Uses global LittleJS from CDN

// ============================================
// COLOR PALETTE - Mars Mining Theme
// ============================================
const PALETTE = {
  // Background
  skyTop: new Color(0.15, 0.03, 0.03),
  skyBottom: new Color(0.3, 0.08, 0.05),
  deepGround: new Color(0.08, 0.02, 0.02),

  // Terrain
  dirt: new Color(0.55, 0.25, 0.15),
  dirtDark: new Color(0.4, 0.18, 0.1),
  rock: new Color(0.35, 0.3, 0.28),
  rockDark: new Color(0.25, 0.22, 0.2),
  lava: new Color(1, 0.4, 0.1),

  // Minerals (glowing)
  ironium: new Color(0.6, 0.3, 0.15),
  bronzium: new Color(0.85, 0.55, 0.25),
  silverium: new Color(0.8, 0.82, 0.85),
  goldium: new Color(1, 0.85, 0.2),
  platinum: new Color(0.92, 0.92, 0.95),
  einsteinium: new Color(0.3, 1, 0.4),
  emerald: new Color(0.2, 0.9, 0.5),
  ruby: new Color(1, 0.2, 0.35),
  diamond: new Color(0.7, 0.95, 1),
  amazonite: new Color(0.1, 0.85, 0.75),

  // UI
  uiPrimary: new Color(1, 0.7, 0.2),
  uiSecondary: new Color(0.2, 0.9, 0.4),
  uiDanger: new Color(1, 0.3, 0.2),
  uiText: new Color(1, 0.95, 0.85),
  uiDim: new Color(0.6, 0.5, 0.4),

  // Player
  podBody: new Color(1, 0.75, 0.15),
  podCockpit: new Color(0.2, 0.7, 0.95),
  drillTip: new Color(0.7, 0.65, 0.6),
  exhaust: new Color(1, 0.5, 0.2)
};

// ============================================
// GAME STATE
// ============================================
window.gameState = {
  scene: 'loading',
  player: { x: 0, y: 0, depth: 0, fuel: 10, hull: 10, cash: 0 },
  cargo: [],
  cargoWeight: 0
};

window.startGame = () => {
  if (window._startGameCallback) window._startGameCallback();
};

// ============================================
// CONSTANTS
// ============================================
const TILE_SIZE = 13;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const TileType = {
  EMPTY: 0, DIRT: 1, ROCK: 2, BOULDER: 3, LAVA: 4, BUILDING: 5,
  IRONIUM: 10, BRONZIUM: 11, SILVERIUM: 12, GOLDIUM: 13, PLATINUM: 14,
  EINSTEINIUM: 15, EMERALD: 16, RUBY: 17, DIAMOND: 18, AMAZONITE: 19
};

const TILE_COLORS = {
  [TileType.DIRT]: PALETTE.dirt,
  [TileType.ROCK]: PALETTE.rock,
  [TileType.BOULDER]: PALETTE.rockDark,
  [TileType.LAVA]: PALETTE.lava,
  [TileType.BUILDING]: new Color(0.4, 0.35, 0.5),
  [TileType.IRONIUM]: PALETTE.ironium,
  [TileType.BRONZIUM]: PALETTE.bronzium,
  [TileType.SILVERIUM]: PALETTE.silverium,
  [TileType.GOLDIUM]: PALETTE.goldium,
  [TileType.PLATINUM]: PALETTE.platinum,
  [TileType.EINSTEINIUM]: PALETTE.einsteinium,
  [TileType.EMERALD]: PALETTE.emerald,
  [TileType.RUBY]: PALETTE.ruby,
  [TileType.DIAMOND]: PALETTE.diamond,
  [TileType.AMAZONITE]: PALETTE.amazonite
};

const MINERALS = {
  [TileType.IRONIUM]: { name: 'Ironium', value: 30, weight: 10, minDepth: 25 },
  [TileType.BRONZIUM]: { name: 'Bronzium', value: 60, weight: 10, minDepth: 25 },
  [TileType.SILVERIUM]: { name: 'Silverium', value: 100, weight: 10, minDepth: 25 },
  [TileType.GOLDIUM]: { name: 'Goldium', value: 250, weight: 20, minDepth: 100 },
  [TileType.PLATINUM]: { name: 'Platinum', value: 750, weight: 30, minDepth: 300 },
  [TileType.EINSTEINIUM]: { name: 'Einsteinium', value: 2000, weight: 40, minDepth: 500 },
  [TileType.EMERALD]: { name: 'Emerald', value: 5000, weight: 60, minDepth: 800 },
  [TileType.RUBY]: { name: 'Ruby', value: 20000, weight: 80, minDepth: 1200 },
  [TileType.DIAMOND]: { name: 'Diamond', value: 100000, weight: 100, minDepth: 1600 },
  [TileType.AMAZONITE]: { name: 'Amazonite', value: 500000, weight: 120, minDepth: 2000 }
};

// ============================================
// SCREEN SHAKE & PARTICLES
// ============================================
let screenShake = { intensity: 0, duration: 0, offsetX: 0, offsetY: 0 };

function shake(intensity, duration) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
  screenShake.duration = Math.max(screenShake.duration, duration);
}

function updateShake(dt) {
  if (screenShake.duration > 0) {
    screenShake.duration -= dt;
    screenShake.offsetX = (Math.random() - 0.5) * screenShake.intensity * 0.1;
    screenShake.offsetY = (Math.random() - 0.5) * screenShake.intensity * 0.1;
    screenShake.intensity *= 0.9;
  } else {
    screenShake.offsetX = screenShake.offsetY = 0;
  }
}

class GameParticle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size; this.life = this.maxLife = life;
    this.gravity = gravity;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }
  draw() {
    const alpha = this.life / this.maxLife;
    const c = this.color;
    drawRect(vec2(this.x, this.y), vec2(this.size * alpha, this.size * alpha),
      new Color(c.r, c.g, c.b, alpha));
  }
}

const particles = [];

function spawnParticles(x, y, count, config) {
  const { color, speedMin = 1, speedMax = 3, sizeMin = 0.1, sizeMax = 0.3,
          lifeMin = 0.3, lifeMax = 0.6, gravity = 0 } = config;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * PI * 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    particles.push(new GameParticle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      color, sizeMin + Math.random() * (sizeMax - sizeMin),
      lifeMin + Math.random() * (lifeMax - lifeMin), gravity
    ));
  }
}

// ============================================
// AUDIO
// ============================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch(type) {
    case 'drill':
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.type = 'sawtooth';
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'collect':
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.type = 'sine';
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'sell':
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.type = 'sine';
      osc.start(now); osc.stop(now + 0.2);
      break;
    case 'upgrade':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.type = 'triangle';
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'lowFuel':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.type = 'square';
      osc.start(now); osc.stop(now + 0.3);
      break;
  }
}

// ============================================
// GAME STATE
// ============================================
let world = [];
let player = { x: 20, y: 0, vx: 0, vy: 0 };
let gameScene = 'menu';
let isDrilling = false, drillTimer = 0, drillTarget = null;
let lastDrillSound = 0;
let lowFuelWarned = false;

let playerStats = {
  cash: 0, fuel: 10, maxFuel: 10, hull: 10, maxHull: 10,
  drillSpeed: 20, cargoCapacity: 70, score: 0
};
let cargo = [], cargoWeight = 0;

// ============================================
// WORLD GENERATION
// ============================================
function generateWorld() {
  world = [];
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    const depth = y * TILE_SIZE;
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        if ((x >= 2 && x <= 8) || (x >= 12 && x <= 18) ||
            (x >= 22 && x <= 28) || (x >= 32 && x <= 38))
          row.push(TileType.BUILDING);
        else row.push(TileType.EMPTY);
      } else {
        row.push(generateTile(depth, x, y));
      }
    }
    world.push(row);
  }
}

function generateTile(depth, x, y) {
  const roll = Math.random();
  if (roll < 0.05) return TileType.EMPTY;
  if (roll < 0.25) {
    const types = Object.keys(MINERALS).map(Number).filter(t => depth >= MINERALS[t].minDepth);
    if (types.length > 0) return types[randInt(types.length)];
  }
  return roll < 0.35 ? TileType.ROCK : TileType.DIRT;
}

function getTile(x, y) {
  if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) return undefined;
  return world[y]?.[x];
}

function setTile(x, y, type) {
  if (y >= 0 && y < WORLD_HEIGHT && x >= 0 && x < WORLD_WIDTH) world[y][x] = type;
}

// ============================================
// GAME INIT
// ============================================
function gameInit() {
  setCanvasFixedSize(vec2(SCREEN_WIDTH, SCREEN_HEIGHT));
  generateWorld();
  player = { x: 20, y: 0, vx: 0, vy: 0 };
  gameScene = 'menu';
  window.gameState.scene = 'menu';
}

// ============================================
// GAME UPDATE
// ============================================
function gameUpdate() {
  const dt = 1/60;
  updateShake(dt);

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }

  if (gameScene === 'menu') {
    if (keyWasPressed('Space') || keyWasPressed('Enter') || mouseWasPressed(0)) {
      gameScene = 'game';
      initAudio();
    }
  } else if (gameScene === 'game') {
    updateGame(dt);
  } else if (gameScene === 'shop') {
    if (keyWasPressed('Escape') || keyWasPressed('KeyE')) gameScene = 'game';
    if (keyWasPressed('Digit1') && playerStats.cash >= 750) {
      playerStats.cash -= 750;
      playerStats.drillSpeed = Math.min(120, playerStats.drillSpeed + 8);
      playSound('upgrade');
      shake(3, 0.1);
    }
    if (keyWasPressed('Digit2') && playerStats.cash >= 750) {
      playerStats.cash -= 750;
      playerStats.maxHull = Math.min(180, playerStats.maxHull + 7);
      playSound('upgrade');
      shake(3, 0.1);
    }
  } else if (gameScene === 'gameover') {
    if (keyWasPressed('Space') || keyWasPressed('Enter')) {
      playerStats = { cash: 0, fuel: 10, maxFuel: 10, hull: 10, maxHull: 10, drillSpeed: 20, cargoCapacity: 70, score: 0 };
      cargo = []; cargoWeight = 0;
      generateWorld();
      player = { x: 20, y: 0, vx: 0, vy: 0 };
      gameScene = 'game';
      lowFuelWarned = false;
    }
  }

  // Update test state
  window.gameState.scene = gameScene;
  window.gameState.player = {
    x: Math.round(player.x), y: Math.round(player.y),
    depth: Math.round(player.y * TILE_SIZE),
    fuel: Math.round(playerStats.fuel * 10) / 10,
    hull: playerStats.hull, cash: playerStats.cash
  };
  window.gameState.cargo = cargo;
  window.gameState.cargoWeight = cargoWeight;
}

function updateGame(dt) {
  const speed = 0.15;
  let moved = false;

  // Movement
  if (keyIsDown('ArrowLeft') || keyIsDown('KeyA')) { player.vx = -speed; moved = true; }
  else if (keyIsDown('ArrowRight') || keyIsDown('KeyD')) { player.vx = speed; moved = true; }
  else { player.vx *= 0.8; }

  if (keyIsDown('ArrowUp') || keyIsDown('KeyW')) { player.vy = -speed * 0.8; moved = true; }
  else if (keyIsDown('ArrowDown') || keyIsDown('KeyS')) {
    const targetY = Math.floor(player.y) + 1;
    const targetX = Math.floor(player.x);
    const tile = getTile(targetX, targetY);

    if (tile !== undefined && tile !== TileType.EMPTY && tile !== TileType.BUILDING && tile !== TileType.BOULDER) {
      if (!isDrilling) {
        isDrilling = true;
        drillTarget = { x: targetX, y: targetY };
        drillTimer = (tile === TileType.ROCK ? 0.8 : 0.5) / (playerStats.drillSpeed / 20);
      }
    } else if (tile === TileType.EMPTY) {
      player.vy = speed;
      moved = true;
    }
  } else {
    const belowTile = getTile(Math.floor(player.x), Math.floor(player.y) + 1);
    if (belowTile === TileType.EMPTY || belowTile === undefined) {
      player.vy += 0.01;
    } else {
      player.vy = 0;
    }
  }

  // Drilling with effects
  if (isDrilling) {
    drillTimer -= dt;

    // Drill particles
    if (Date.now() - lastDrillSound > 80) {
      playSound('drill');
      lastDrillSound = Date.now();
      spawnParticles(player.x + 0.5, player.y + 1.2, 3, {
        color: PALETTE.dirt,
        speedMin: 0.5, speedMax: 2, sizeMin: 0.1, sizeMax: 0.2,
        lifeMin: 0.2, lifeMax: 0.4, gravity: 5
      });
    }

    if (drillTimer <= 0) {
      const tile = getTile(drillTarget.x, drillTarget.y);
      if (MINERALS[tile]) {
        const mineral = MINERALS[tile];
        if (cargoWeight + mineral.weight <= playerStats.cargoCapacity) {
          cargo.push({ type: tile, name: mineral.name, value: mineral.value, weight: mineral.weight });
          cargoWeight += mineral.weight;
          playSound('collect');
          shake(4, 0.1);

          // Sparkle effect for valuable minerals
          const mColor = TILE_COLORS[tile];
          spawnParticles(drillTarget.x + 0.5, drillTarget.y + 0.5, 15, {
            color: mColor, speedMin: 2, speedMax: 5, sizeMin: 0.15, sizeMax: 0.35,
            lifeMin: 0.4, lifeMax: 0.8, gravity: -2
          });
        }
      } else {
        // Dirt/rock particles
        spawnParticles(drillTarget.x + 0.5, drillTarget.y + 0.5, 8, {
          color: tile === TileType.ROCK ? PALETTE.rock : PALETTE.dirt,
          speedMin: 1, speedMax: 3, sizeMin: 0.1, sizeMax: 0.25,
          lifeMin: 0.2, lifeMax: 0.4, gravity: 8
        });
      }

      setTile(drillTarget.x, drillTarget.y, TileType.EMPTY);
      player.y = drillTarget.y;
      isDrilling = false;
      drillTarget = null;
    }
    moved = true;
  }

  // Move with collision
  const newX = player.x + player.vx;
  const newY = player.y + player.vy;

  const checkTileX = getTile(Math.floor(newX), Math.floor(player.y));
  if (checkTileX === TileType.EMPTY || checkTileX === TileType.BUILDING || checkTileX === undefined || player.y < 1) {
    player.x = Math.max(0, Math.min(WORLD_WIDTH - 1, newX));
  }

  const checkTileY = getTile(Math.floor(player.x), Math.floor(newY));
  if (checkTileY === TileType.EMPTY || checkTileY === TileType.BUILDING || checkTileY === undefined || newY < 0) {
    player.y = Math.max(0, newY);
  }

  // Exhaust particles when moving
  if (moved && Math.abs(player.vx) > 0.05) {
    if (Math.random() < 0.3) {
      spawnParticles(player.x + 0.5 - Math.sign(player.vx) * 0.3, player.y + 0.7, 1, {
        color: PALETTE.exhaust, speedMin: 0.5, speedMax: 1.5, sizeMin: 0.1, sizeMax: 0.2,
        lifeMin: 0.1, lifeMax: 0.2, gravity: -1
      });
    }
  }

  // Fuel consumption
  if (moved && playerStats.fuel > 0) {
    playerStats.fuel -= 0.002;
    playerStats.fuel = Math.max(0, playerStats.fuel);

    // Low fuel warning
    if (playerStats.fuel < 2 && !lowFuelWarned) {
      playSound('lowFuel');
      lowFuelWarned = true;
    }
    if (playerStats.fuel >= 2) lowFuelWarned = false;
  }

  // Building interactions
  if (player.y < 1 && keyWasPressed('KeyE')) {
    const tileX = Math.floor(player.x);
    if (tileX >= 2 && tileX <= 8) {
      const cost = Math.ceil((playerStats.maxFuel - playerStats.fuel) * 2);
      if (playerStats.cash >= cost) {
        playerStats.cash -= cost;
        playerStats.fuel = playerStats.maxFuel;
        playSound('upgrade');
      }
    } else if (tileX >= 12 && tileX <= 18) {
      if (cargo.length > 0) {
        let totalValue = 0;
        for (const item of cargo) {
          totalValue += item.value;
          playerStats.cash += item.value;
          playerStats.score += item.value * 10;
        }
        cargo = [];
        cargoWeight = 0;
        playSound('sell');
        shake(8, 0.2);

        // Cash burst effect
        spawnParticles(player.x + 0.5, player.y, 25, {
          color: PALETTE.uiSecondary, speedMin: 3, speedMax: 8,
          sizeMin: 0.2, sizeMax: 0.4, lifeMin: 0.5, lifeMax: 1, gravity: -3
        });
      }
    } else if (tileX >= 22 && tileX <= 28) {
      gameScene = 'shop';
    } else if (tileX >= 32 && tileX <= 38) {
      const cost = (playerStats.maxHull - playerStats.hull) * 15;
      if (playerStats.cash >= cost) {
        playerStats.cash -= cost;
        playerStats.hull = playerStats.maxHull;
        playSound('upgrade');
      }
    }
  }

  setCameraPos(vec2(player.x + screenShake.offsetX, player.y + 10 + screenShake.offsetY));

  if (playerStats.hull <= 0) gameScene = 'gameover';
}

// ============================================
// RENDERING
// ============================================
function gameRender() {
  if (gameScene === 'menu') renderMenu();
  else if (gameScene === 'game' || gameScene === 'shop') {
    renderWorld();
    renderPlayer();
    if (gameScene === 'shop') renderShop();
  }
  else if (gameScene === 'gameover') renderGameOver();

  // Draw particles
  for (const p of particles) p.draw();
}

function renderMenu() {
  const time = Date.now() / 1000;
  drawRect(vec2(0, 0), vec2(100, 100), PALETTE.skyTop);

  // Animated title
  const pulse = 0.8 + 0.2 * Math.sin(time * 3);
  drawText('MOTHERLOAD', vec2(0, 8), 2.2 * pulse, PALETTE.uiPrimary);
  drawText('MARS MINING', vec2(0, 5), 0.9, PALETTE.uiDim);
  drawText('POLISHED EDITION', vec2(0, 3.5), 0.5, PALETTE.uiSecondary);

  drawText('Arrows/WASD: Move & Drill', vec2(0, 0), 0.45, PALETTE.uiText);
  drawText('E: Interact with Buildings', vec2(0, -1.5), 0.45, PALETTE.uiText);

  const startPulse = 0.5 + 0.5 * Math.sin(time * 4);
  drawText('[ PRESS SPACE ]', vec2(0, -6), 0.7, new Color(0, 1, 0.5, startPulse));
}

function renderWorld() {
  const camX = cameraPos.x;
  const camY = cameraPos.y;
  const viewRange = 25;

  // Background gradient
  drawRect(vec2(camX, camY - 20), vec2(100, 50), PALETTE.skyTop);
  drawRect(vec2(camX, camY + 30), vec2(100, 60), PALETTE.deepGround);

  const startX = Math.max(0, Math.floor(camX - viewRange));
  const endX = Math.min(WORLD_WIDTH, Math.ceil(camX + viewRange));
  const startY = Math.max(0, Math.floor(camY - viewRange));
  const endY = Math.min(WORLD_HEIGHT, Math.ceil(camY + viewRange));

  const time = Date.now() / 1000;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = getTile(x, y);
      if (tile === undefined || tile === TileType.EMPTY) continue;

      const color = TILE_COLORS[tile];
      if (color) {
        // Mineral glow
        if (MINERALS[tile]) {
          const glowIntensity = 0.3 + 0.15 * Math.sin(time * 3 + x + y);
          const glowColor = new Color(color.r, color.g, color.b, glowIntensity);
          drawRect(vec2(x + 0.5, y + 0.5), vec2(1.4, 1.4), glowColor);
        }
        drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), color);
      }
    }
  }

  // Building labels with glow
  if (camY < 15) {
    drawText('FUEL', vec2(5, -1), 0.35, PALETTE.uiPrimary);
    drawText('SELL', vec2(15, -1), 0.35, PALETTE.uiSecondary);
    drawText('SHOP', vec2(25, -1), 0.35, PALETTE.uiPrimary);
    drawText('FIX', vec2(35, -1), 0.35, PALETTE.uiDanger);
  }
}

function renderPlayer() {
  const time = Date.now() / 1000;

  // Pod shadow
  drawRect(vec2(player.x + 0.55, player.y + 0.55), vec2(0.85, 1.05), new Color(0, 0, 0, 0.4));

  // Pod body
  drawRect(vec2(player.x + 0.5, player.y + 0.5), vec2(0.8, 1), PALETTE.podBody);

  // Cockpit with shine
  drawRect(vec2(player.x + 0.5, player.y + 0.3), vec2(0.5, 0.35), PALETTE.podCockpit);
  drawRect(vec2(player.x + 0.4, player.y + 0.25), vec2(0.15, 0.1), new Color(1, 1, 1, 0.5));

  // Drill
  const drillPulse = isDrilling ? 0.1 * Math.sin(time * 30) : 0;
  drawRect(vec2(player.x + 0.5 + drillPulse, player.y + 0.9), vec2(0.35, 0.25), PALETTE.drillTip);

  if (isDrilling) {
    drawRect(vec2(player.x + 0.5, player.y + 1.1), vec2(0.25, 0.15), PALETTE.exhaust);
  }
}

function renderShop() {
  const camX = cameraPos.x;
  const camY = cameraPos.y;

  drawRect(vec2(camX, camY), vec2(22, 16), new Color(0, 0, 0, 0.92));
  drawRect(vec2(camX, camY), vec2(21, 15), new Color(0.1, 0.08, 0.06, 0.95));

  drawText('UPGRADE SHOP', vec2(camX, camY + 5.5), 0.9, PALETTE.uiPrimary);
  drawText(`CASH: $${playerStats.cash}`, vec2(camX, camY + 3.5), 0.55, PALETTE.uiSecondary);

  drawText('[1] DRILL SPEED +8', vec2(camX, camY + 1), 0.45, PALETTE.uiText);
  drawText('$750', vec2(camX + 6, camY + 1), 0.4, playerStats.cash >= 750 ? PALETTE.uiSecondary : PALETTE.uiDanger);

  drawText('[2] HULL ARMOR +7', vec2(camX, camY - 1), 0.45, PALETTE.uiText);
  drawText('$750', vec2(camX + 6, camY - 1), 0.4, playerStats.cash >= 750 ? PALETTE.uiSecondary : PALETTE.uiDanger);

  drawText('ESC / E to Exit', vec2(camX, camY - 5.5), 0.4, PALETTE.uiDim);
}

function renderGameOver() {
  drawRect(vec2(0, 0), vec2(100, 100), new Color(0, 0, 0, 0.95));

  const time = Date.now() / 1000;
  const pulse = 0.8 + 0.2 * Math.sin(time * 4);

  drawText('HULL DESTROYED', vec2(0, 6), 1.5 * pulse, PALETTE.uiDanger);
  drawText(`Final Score: ${playerStats.score}`, vec2(0, 1), 0.7, PALETTE.uiText);
  drawText(`Depth Reached: ${Math.round(player.y * TILE_SIZE)}ft`, vec2(0, -1), 0.5, PALETTE.uiDim);
  drawText('[ SPACE TO RESTART ]', vec2(0, -6), 0.55, PALETTE.uiSecondary);
}

function gameRenderPost() {
  if (gameScene !== 'game' && gameScene !== 'shop') return;

  const camX = cameraPos.x;
  const camY = cameraPos.y - 16;
  const time = Date.now() / 1000;

  // HUD panel
  drawRect(vec2(camX - 12, camY + 0.5), vec2(8.5, 7), new Color(0, 0, 0, 0.75));

  // Stats
  drawText(`DEPTH: ${Math.round(player.y * TILE_SIZE)}ft`, vec2(camX - 12, camY + 3), 0.35, PALETTE.uiPrimary);
  drawText(`CASH: $${playerStats.cash}`, vec2(camX - 12, camY + 2), 0.35, PALETTE.uiSecondary);

  // Fuel with warning flash
  const fuelColor = playerStats.fuel < 2 ?
    new Color(1, 0.3, 0.2, 0.7 + 0.3 * Math.sin(time * 8)) : PALETTE.uiSecondary;
  drawText(`FUEL: ${Math.round(playerStats.fuel)}/${playerStats.maxFuel}`, vec2(camX - 12, camY + 1), 0.35, fuelColor);

  drawText(`HULL: ${playerStats.hull}/${playerStats.maxHull}`, vec2(camX - 12, camY), 0.35, PALETTE.uiDanger);

  // Cargo bar
  const cargoRatio = cargoWeight / playerStats.cargoCapacity;
  drawRect(vec2(camX - 12, camY - 1.2), vec2(6, 0.4), new Color(0.2, 0.2, 0.2));
  drawRect(vec2(camX - 12 - 3 + 3 * cargoRatio, camY - 1.2), vec2(6 * cargoRatio, 0.35),
    cargoRatio > 0.9 ? PALETTE.uiDanger : PALETTE.uiPrimary);
  drawText(`CARGO: ${cargoWeight}/${playerStats.cargoCapacity}`, vec2(camX - 12, camY - 2), 0.3, PALETTE.uiDim);

  // Building hints
  if (player.y < 1) {
    const tileX = Math.floor(player.x);
    let hint = '';
    if (tileX >= 2 && tileX <= 8) hint = 'E: REFUEL';
    else if (tileX >= 12 && tileX <= 18) hint = 'E: SELL CARGO';
    else if (tileX >= 22 && tileX <= 28) hint = 'E: SHOP';
    else if (tileX >= 32 && tileX <= 38) hint = 'E: REPAIR';
    if (hint) {
      const hintPulse = 0.7 + 0.3 * Math.sin(time * 5);
      drawText(hint, vec2(camX, camY + 18), 0.45, new Color(1, 1, 0.5, hintPulse));
    }
  }
}

function gameUpdatePost() {}

window._startGameCallback = () => {
  gameScene = 'game';
  window.gameState.scene = 'game';
  initAudio();
};

// Expose for testing
window.screenShake = screenShake;
window.shake = shake;
window.playSound = playSound;
window.initAudio = initAudio;
window.particles = particles;

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, []);
