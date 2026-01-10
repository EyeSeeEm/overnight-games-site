
// Motherload v2 - Mars Mining Game
// Built with LittleJS (CDN)

// Helper for screen-space rectangles
function drawRectScreen(pos, size, color) {
  drawRect(pos, size, color, 0, true, true);
}

// Game constants
const TILE_SIZE = 16;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200; // Simplified for MVP (~2600 ft depth)
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Tile types
const EMPTY = 0;
const DIRT = 1;
const ROCK = 2;
const BOULDER = 3;
const LAVA = 4;
const BUILDING = 5;

// Minerals (10+ types)
const MINERALS = {
  IRONIUM:     { id: 10, value: 30,   weight: 10, minDepth: 2,   color: new Color(0.55, 0.27, 0.07) },
  BRONZIUM:    { id: 11, value: 60,   weight: 10, minDepth: 2,   color: new Color(0.8, 0.5, 0.2) },
  SILVERIUM:   { id: 12, value: 100,  weight: 10, minDepth: 2,   color: new Color(0.75, 0.75, 0.75) },
  GOLDIUM:     { id: 13, value: 250,  weight: 20, minDepth: 15,  color: new Color(1, 0.84, 0) },
  PLATINUM:    { id: 14, value: 750,  weight: 30, minDepth: 50,  color: new Color(0.9, 0.89, 0.88) },
  EINSTEINIUM: { id: 15, value: 2000, weight: 40, minDepth: 100, color: new Color(0, 1, 0) },
  EMERALD:     { id: 16, value: 5000, weight: 60, minDepth: 140, color: new Color(0.31, 0.78, 0.47) },
  RUBY:        { id: 17, value: 20000, weight: 80, minDepth: 160, color: new Color(0.88, 0.07, 0.37) },
  DIAMOND:     { id: 18, value: 100000, weight: 100, minDepth: 180, color: new Color(0.73, 0.95, 1) },
  AMAZONITE:   { id: 19, value: 500000, weight: 120, minDepth: 195, color: new Color(0, 0.77, 0.69) }
};

// Get mineral by ID
function getMineralById(id) {
  for (const [name, mineral] of Object.entries(MINERALS)) {
    if (mineral.id === id) return { name, ...mineral };
  }
  return null;
}

// Upgrades
const UPGRADES = {
  drill:    { prices: [0, 750, 2000, 5000, 20000, 100000, 500000], speeds: [20, 28, 40, 50, 70, 95, 120] },
  hull:     { prices: [0, 750, 2000, 5000, 20000, 100000, 500000], values: [10, 17, 30, 50, 80, 120, 180] },
  engine:   { prices: [0, 750, 2000, 5000, 20000, 100000, 500000], values: [150, 160, 170, 180, 190, 200, 210] },
  fuel:     { prices: [0, 750, 2000, 5000, 20000, 100000, 500000], values: [10, 15, 25, 40, 60, 100, 150] },
  cargo:    { prices: [0, 750, 2000, 5000, 20000, 100000], values: [7, 15, 25, 40, 70, 120] },
  radiator: { prices: [0, 2000, 5000, 20000, 100000, 500000], values: [0, 0.1, 0.25, 0.4, 0.6, 0.8] }
};

// Game state
let world = [];
let player = null;
let gameState = null;
let particles = [];
let screenShake = 0;
let shopOpen = null; // null, 'fuel', 'processor', 'junk', 'repair'
let transmissionText = null;
let transmissionTimer = 0;

// Initialize game state
function initGameState() {
  gameState = {
    cash: 100,
    score: 0,
    fuel: 10,
    hull: 10,
    cargo: [],
    cargoWeight: 0,
    upgrades: {
      drill: 0,
      hull: 0,
      engine: 0,
      fuel: 0,
      cargo: 0,
      radiator: 0
    },
    maxDepthReached: 0,
    isDead: false
  };

  // Expose for testing
  window.gameState = gameState;
}

// Generate world
function generateWorld() {
  world = [];

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        // Surface - empty except buildings
        if (x >= 2 && x <= 4) row.push(BUILDING); // Fuel station
        else if (x >= 10 && x <= 12) row.push(BUILDING); // Processor
        else if (x >= 20 && x <= 22) row.push(BUILDING); // Junk shop
        else if (x >= 30 && x <= 32) row.push(BUILDING); // Repair
        else row.push(EMPTY);
      } else if (y === 1 && ((x >= 2 && x <= 4) || (x >= 10 && x <= 12) || (x >= 20 && x <= 22) || (x >= 30 && x <= 32))) {
        // Building foundations
        row.push(BOULDER);
      } else {
        // Underground
        row.push(generateTile(y, x));
      }
    }
    world.push(row);
  }

  window.world = world;
}

function generateTile(depth, x) {
  const roll = Math.random();

  // Lava (deeper areas)
  if (depth > 150 && roll < 0.03) return LAVA;

  // Boulders
  if (depth > 80 && roll < 0.02) return BOULDER;

  // Minerals based on depth
  const mineralRoll = Math.random();
  if (mineralRoll < 0.2) {
    // Try to spawn a mineral
    const eligibleMinerals = Object.values(MINERALS).filter(m => depth >= m.minDepth);
    if (eligibleMinerals.length > 0) {
      // Weight towards rarer minerals at appropriate depths
      const weights = eligibleMinerals.map(m => {
        const depthDiff = depth - m.minDepth;
        if (depthDiff < 0) return 0;
        if (depthDiff < 30) return 10; // Peak spawn
        if (depthDiff < 60) return 5;  // Still common
        return 1; // Rare after peak
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalWeight;
      for (let i = 0; i < eligibleMinerals.length; i++) {
        r -= weights[i];
        if (r <= 0) return eligibleMinerals[i].id;
      }
    }
  }

  // Rock or dirt
  if (roll < 0.3) return ROCK;
  return DIRT;
}

// Player class
class Player extends EngineObject {
  constructor(pos) {
    super(pos, vec2(1, 1.2));
    this.velocity = vec2(0, 0);
    this.isDrilling = false;
    this.drillTimer = new Timer();
    this.drillTarget = null;
  }

  update() {
    if (gameState.isDead || shopOpen) return;

    const moveSpeed = 0.15;
    const gravity = 0.02;
    const thrustPower = 0.08 * (UPGRADES.engine.values[gameState.upgrades.engine] / 150);

    // Check ground
    const groundY = Math.floor(this.pos.y);
    const groundX = Math.floor(this.pos.x);
    const onGround = groundY >= 0 && groundY < WORLD_HEIGHT - 1 &&
                     world[groundY + 1] && world[groundY + 1][groundX] !== EMPTY;

    // Movement
    if (keyIsDown('ArrowLeft') || keyIsDown('KeyA')) {
      this.velocity.x = -moveSpeed;
      consumeFuel(0.002);
    } else if (keyIsDown('ArrowRight') || keyIsDown('KeyD')) {
      this.velocity.x = moveSpeed;
      consumeFuel(0.002);
    } else {
      this.velocity.x *= 0.8;
    }

    // Thrust up
    if ((keyIsDown('ArrowUp') || keyIsDown('KeyW')) && gameState.fuel > 0) {
      this.velocity.y = Math.min(this.velocity.y + thrustPower, 0.2);
      consumeFuel(0.01);
      // Thrust particles
      if (Math.random() < 0.5) {
        spawnParticle(this.pos.add(vec2(0, -0.5)), new Color(1, 0.5, 0, 0.8), vec2(rand(-0.02, 0.02), -0.1));
      }
    }

    // Drilling
    if ((keyIsDown('ArrowDown') || keyIsDown('KeyS')) && !this.isDrilling) {
      const drillX = groundX;
      const drillY = groundY + 1;
      if (canDrill(drillX, drillY)) {
        this.startDrill(drillX, drillY);
      }
    }

    // Diagonal drilling
    if (!this.isDrilling && (keyIsDown('ArrowDown') || keyIsDown('KeyS'))) {
      if (keyIsDown('ArrowLeft') || keyIsDown('KeyA')) {
        const dx = groundX - 1;
        const dy = groundY + 1;
        if (canDrill(dx, dy)) this.startDrill(dx, dy);
      } else if (keyIsDown('ArrowRight') || keyIsDown('KeyD')) {
        const dx = groundX + 1;
        const dy = groundY + 1;
        if (canDrill(dx, dy)) this.startDrill(dx, dy);
      }
    }

    // Gravity
    if (!onGround && !this.isDrilling) {
      this.velocity.y -= gravity;
    } else if (onGround && this.velocity.y < 0) {
      // Fall damage
      const fallSpeed = Math.abs(this.velocity.y);
      if (fallSpeed > 0.3) {
        const damage = Math.floor((fallSpeed - 0.3) * 20);
        takeDamage(damage);
        screenShake = 5;
      }
      this.velocity.y = 0;
    }

    // Apply velocity
    if (!this.isDrilling) {
      this.pos = this.pos.add(this.velocity);

      // Bounds
      this.pos.x = clamp(this.pos.x, 0.5, WORLD_WIDTH - 0.5);
      if (this.pos.y > 0) this.pos.y = 0;
      if (this.pos.y < -(WORLD_HEIGHT - 2)) this.pos.y = -(WORLD_HEIGHT - 2);
    }

    // Update drill
    if (this.isDrilling && this.drillTimer.elapsed()) {
      this.completeDrill();
    }

    // Track max depth
    const currentDepth = Math.abs(Math.floor(this.pos.y));
    if (currentDepth > gameState.maxDepthReached) {
      gameState.maxDepthReached = currentDepth;
      checkTransmissions(currentDepth);
    }

    // Check building interactions
    if (this.pos.y >= -0.5) {
      const px = Math.floor(this.pos.x);
      if (px >= 2 && px <= 4 && keyWasPressed('Enter')) shopOpen = 'fuel';
      else if (px >= 10 && px <= 12 && keyWasPressed('Enter')) shopOpen = 'processor';
      else if (px >= 20 && px <= 22 && keyWasPressed('Enter')) shopOpen = 'junk';
      else if (px >= 30 && px <= 32 && keyWasPressed('Enter')) shopOpen = 'repair';
    }

    // Close shop
    if (shopOpen && keyWasPressed('Escape')) shopOpen = null;

    // Shop interactions
    if (shopOpen === 'fuel' && keyWasPressed('KeyF')) {
      buyFuel();
    }
    if (shopOpen === 'processor' && keyWasPressed('KeyS')) {
      sellMinerals();
    }

    super.update();
  }

  startDrill(x, y) {
    if (gameState.fuel <= 0) return;

    this.isDrilling = true;
    this.drillTarget = { x, y };

    const tileType = world[y][x];
    const drillSpeed = UPGRADES.drill.speeds[gameState.upgrades.drill];
    const baseTime = tileType === ROCK ? 1.5 : 1.0;
    const drillTime = (baseTime / (drillSpeed / 20)) * 1000;

    this.drillTimer.set(drillTime / 1000);
    consumeFuel(0.05);

    // Drill particles
    for (let i = 0; i < 5; i++) {
      const color = tileType === ROCK ? new Color(0.5, 0.5, 0.5) : new Color(0.6, 0.3, 0.2);
      spawnParticle(vec2(x + 0.5, -y - 0.5), color, vec2(rand(-0.1, 0.1), rand(0.05, 0.15)));
    }
  }

  completeDrill() {
    const { x, y } = this.drillTarget;
    const tileType = world[y][x];

    // Check if mineral
    if (tileType >= 10 && tileType <= 19) {
      const mineral = getMineralById(tileType);
      if (mineral) {
        const maxCargo = UPGRADES.cargo.values[gameState.upgrades.cargo];
        if (gameState.cargoWeight + mineral.weight <= maxCargo * 10) {
          gameState.cargo.push({ ...mineral });
          gameState.cargoWeight += mineral.weight;
          // Sparkle effect
          for (let i = 0; i < 10; i++) {
            spawnParticle(vec2(x + 0.5, -y - 0.5), mineral.color, vec2(rand(-0.15, 0.15), rand(0.1, 0.25)));
          }
        }
      }
    }

    // Check lava damage
    if (tileType === LAVA) {
      const radiatorReduction = UPGRADES.radiator.values[gameState.upgrades.radiator];
      const damage = Math.floor(58 * (1 - radiatorReduction));
      takeDamage(damage);
      screenShake = 10;
      // Lava particles
      for (let i = 0; i < 15; i++) {
        spawnParticle(vec2(x + 0.5, -y - 0.5), new Color(1, 0.3, 0), vec2(rand(-0.2, 0.2), rand(0.1, 0.3)));
      }
    }

    // Clear tile
    world[y][x] = EMPTY;

    // Move player down
    this.pos = vec2(x + 0.5, -y);
    this.velocity = vec2(0, 0);
    this.isDrilling = false;
    this.drillTarget = null;
  }

  render() {
    // Pod body - metallic look
    const baseColor = new Color(0.4, 0.5, 0.6);
    const highlightColor = new Color(0.6, 0.7, 0.8);

    // Main body
    drawRect(this.pos, vec2(0.8, 1), baseColor);
    // Highlight
    drawRect(this.pos.add(vec2(-0.15, 0.1)), vec2(0.2, 0.6), highlightColor);
    // Cockpit glass
    drawRect(this.pos.add(vec2(0, 0.3)), vec2(0.5, 0.3), new Color(0.2, 0.6, 0.8, 0.7));
    // Drill
    drawRect(this.pos.add(vec2(0, -0.6)), vec2(0.3, 0.4), new Color(0.7, 0.7, 0.3));

    // Drilling animation
    if (this.isDrilling) {
      const flash = Math.sin(Date.now() * 0.03) * 0.5 + 0.5;
      drawRect(this.pos.add(vec2(0, -0.8)), vec2(0.2, 0.3), new Color(1, flash, 0));
    }
  }
}

// Particle system
function spawnParticle(pos, color, velocity) {
  particles.push({
    pos: pos.copy(),
    velocity,
    color,
    life: 1,
    decay: rand(0.02, 0.05)
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.pos = p.pos.add(p.velocity);
    p.velocity.y -= 0.005; // Gravity
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function renderParticles() {
  for (const p of particles) {
    const size = p.life * 0.2;
    const c = p.color.copy();
    c.a = p.life;
    drawRect(p.pos, vec2(size, size), c);
  }
}

// Utility functions
function canDrill(x, y) {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
  const tile = world[y][x];
  return tile !== EMPTY && tile !== BOULDER && tile !== BUILDING;
}

function consumeFuel(amount) {
  gameState.fuel = Math.max(0, gameState.fuel - amount);
}

function takeDamage(amount) {
  gameState.hull = Math.max(0, gameState.hull - amount);
  if (gameState.hull <= 0) {
    gameState.isDead = true;
  }
}

function buyFuel() {
  const maxFuel = UPGRADES.fuel.values[gameState.upgrades.fuel];
  const needed = maxFuel - gameState.fuel;
  const cost = Math.ceil(needed * 2);
  if (gameState.cash >= cost && needed > 0) {
    gameState.cash -= cost;
    gameState.fuel = maxFuel;
  }
}

function sellMinerals() {
  let total = 0;
  for (const mineral of gameState.cargo) {
    total += mineral.value;
    gameState.score += mineral.value * 10;
  }
  gameState.cash += total;
  gameState.cargo = [];
  gameState.cargoWeight = 0;

  if (total > 0) {
    screenShake = 3;
  }
}

function checkTransmissions(depth) {
  if (depth === 30 && !transmissionText) {
    showTransmission("Mr. Natas: Excellent progress! Here's $1,000 bonus.");
    gameState.cash += 1000;
  } else if (depth === 60 && !transmissionText) {
    showTransmission("Mr. Natas: You're doing splendidly! $3,000 bonus!");
    gameState.cash += 3000;
  } else if (depth === 100 && !transmissionText) {
    showTransmission("Unknown: The eyes... Oh my god, THE EYES!!!");
  }
}

function showTransmission(text) {
  transmissionText = text;
  transmissionTimer = 180;
}

// Render functions
function renderWorld() {
  const camY = Math.floor(-cameraPos.y);
  const startY = Math.max(0, camY - 20);
  const endY = Math.min(WORLD_HEIGHT, camY + 25);

  // Sky gradient
  const skyTop = new Color(0.1, 0.05, 0.15);
  const skyBottom = new Color(0.5, 0.25, 0.2);

  // Draw background
  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const tile = world[y][x];
      const pos = vec2(x + 0.5, -y - 0.5);

      if (tile === EMPTY) {
        // Sky or underground cavity
        const t = clamp(y / 10, 0, 1);
        const bgColor = y === 0 ? new Color(0.7, 0.4, 0.3) : new Color(0.1, 0.05, 0.05);
        drawRect(pos, vec2(1, 1), bgColor);
      } else if (tile === DIRT) {
        // Mars dirt - reddish brown
        const shade = 0.9 + rand(-0.1, 0.1);
        drawRect(pos, vec2(1, 1), new Color(0.6 * shade, 0.3 * shade, 0.2 * shade));
        // Add texture
        if (Math.random() < 0.3) {
          drawRect(pos.add(vec2(rand(-0.3, 0.3), rand(-0.3, 0.3))), vec2(0.15, 0.15), new Color(0.5, 0.25, 0.15));
        }
      } else if (tile === ROCK) {
        // Dark rock
        const shade = 0.8 + rand(-0.1, 0.1);
        drawRect(pos, vec2(1, 1), new Color(0.35 * shade, 0.35 * shade, 0.4 * shade));
        // Cracks
        drawRect(pos.add(vec2(0.2, 0)), vec2(0.05, 0.6), new Color(0.2, 0.2, 0.25));
      } else if (tile === BOULDER) {
        // Unbreakable boulder
        drawRect(pos, vec2(1, 1), new Color(0.25, 0.25, 0.3));
        drawRect(pos.add(vec2(-0.2, 0.2)), vec2(0.4, 0.3), new Color(0.35, 0.35, 0.4));
      } else if (tile === LAVA) {
        // Glowing lava
        const pulse = Math.sin(Date.now() * 0.005 + x + y) * 0.2 + 0.8;
        drawRect(pos, vec2(1, 1), new Color(1 * pulse, 0.3 * pulse, 0));
        // Glow
        drawRect(pos, vec2(1.2, 1.2), new Color(1, 0.5, 0, 0.3));
      } else if (tile === BUILDING) {
        // Building
        drawRect(pos, vec2(1, 1), new Color(0.5, 0.5, 0.6));
        drawRect(pos.add(vec2(0, 0.2)), vec2(0.6, 0.4), new Color(0.3, 0.6, 0.8));
      } else if (tile >= 10 && tile <= 19) {
        // Mineral
        const mineral = getMineralById(tile);
        if (mineral) {
          // Background dirt
          drawRect(pos, vec2(1, 1), new Color(0.6, 0.3, 0.2));
          // Mineral with sparkle
          const sparkle = Math.sin(Date.now() * 0.01 + x * 7 + y * 13) * 0.2 + 0.8;
          const c = mineral.color.copy();
          c.r *= sparkle;
          c.g *= sparkle;
          c.b *= sparkle;
          drawRect(pos, vec2(0.7, 0.7), c);
          // Highlight
          drawRect(pos.add(vec2(-0.15, 0.15)), vec2(0.2, 0.2), new Color(1, 1, 1, 0.4));
        }
      }
    }
  }

  // Surface buildings
  if (startY === 0) {
    // Fuel station
    drawRect(vec2(3.5, 1.5), vec2(3, 2), new Color(0.8, 0.2, 0.2));
    drawTextScreen("FUEL", vec2(SCREEN_WIDTH/2 - 280, 80), 12, new Color(1, 1, 1));

    // Processor
    drawRect(vec2(11.5, 1.5), vec2(3, 2), new Color(0.2, 0.6, 0.2));
    drawTextScreen("SELL", vec2(SCREEN_WIDTH/2 - 120, 80), 12, new Color(1, 1, 1));

    // Junk shop
    drawRect(vec2(21.5, 1.5), vec2(3, 2), new Color(0.6, 0.6, 0.2));
    drawTextScreen("SHOP", vec2(SCREEN_WIDTH/2 + 80, 80), 12, new Color(1, 1, 1));

    // Repair
    drawRect(vec2(31.5, 1.5), vec2(3, 2), new Color(0.2, 0.4, 0.8));
    drawTextScreen("REPAIR", vec2(SCREEN_WIDTH/2 + 240, 80), 12, new Color(1, 1, 1));
  }
}

function renderHUD() {
  const depth = Math.abs(Math.floor(player.pos.y)) * 13; // 13 ft per tile
  const maxFuel = UPGRADES.fuel.values[gameState.upgrades.fuel];
  const maxHull = UPGRADES.hull.values[gameState.upgrades.hull];
  const maxCargo = UPGRADES.cargo.values[gameState.upgrades.cargo] * 10;

  // Top bar
  drawRectScreen(vec2(SCREEN_WIDTH/2, 25), vec2(SCREEN_WIDTH, 50), new Color(0, 0, 0, 0.7));

  drawTextScreen(`DEPTH: ${depth} ft`, vec2(20, 35), 18, new Color(0.8, 0.8, 1));
  drawTextScreen(`CASH: $${gameState.cash.toLocaleString()}`, vec2(200, 35), 18, new Color(0.2, 1, 0.4));
  drawTextScreen(`SCORE: ${gameState.score.toLocaleString()}`, vec2(400, 35), 18, new Color(1, 0.8, 0.2));

  // Bottom bars
  drawRectScreen(vec2(SCREEN_WIDTH/2, SCREEN_HEIGHT - 40), vec2(SCREEN_WIDTH, 80), new Color(0, 0, 0, 0.7));

  // Fuel bar
  const fuelPct = gameState.fuel / maxFuel;
  const fuelColor = fuelPct < 0.2 ? new Color(1, 0.2, 0.2) : new Color(0.2, 0.8, 0.2);
  drawTextScreen("FUEL", vec2(20, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));
  drawRectScreen(vec2(120, SCREEN_HEIGHT - 55), vec2(150, 15), new Color(0.2, 0.2, 0.2));
  drawRectScreen(vec2(45 + fuelPct * 75, SCREEN_HEIGHT - 55), vec2(fuelPct * 150, 15), fuelColor);
  drawTextScreen(`${Math.ceil(gameState.fuel)}/${maxFuel}L`, vec2(200, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));

  // Hull bar
  const hullPct = gameState.hull / maxHull;
  const hullColor = hullPct < 0.25 ? new Color(1, 0.2, 0.2) : new Color(0.2, 0.6, 1);
  drawTextScreen("HULL", vec2(280, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));
  drawRectScreen(vec2(380, SCREEN_HEIGHT - 55), vec2(150, 15), new Color(0.2, 0.2, 0.2));
  drawRectScreen(vec2(305 + hullPct * 75, SCREEN_HEIGHT - 55), vec2(hullPct * 150, 15), hullColor);
  drawTextScreen(`${Math.ceil(gameState.hull)}/${maxHull}`, vec2(460, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));

  // Cargo bar
  const cargoPct = gameState.cargoWeight / maxCargo;
  drawTextScreen("CARGO", vec2(540, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));
  drawRectScreen(vec2(660, SCREEN_HEIGHT - 55), vec2(150, 15), new Color(0.2, 0.2, 0.2));
  drawRectScreen(vec2(585 + cargoPct * 75, SCREEN_HEIGHT - 55), vec2(cargoPct * 150, 15), new Color(0.8, 0.6, 0.2));
  drawTextScreen(`${gameState.cargoWeight}/${maxCargo}kg`, vec2(740, SCREEN_HEIGHT - 55), 14, new Color(1, 1, 1));

  // Cargo contents
  if (gameState.cargo.length > 0) {
    let cargoText = "Cargo: ";
    const counts = {};
    for (const m of gameState.cargo) {
      counts[m.name] = (counts[m.name] || 0) + 1;
    }
    cargoText += Object.entries(counts).map(([n, c]) => `${n}x${c}`).join(", ");
    drawTextScreen(cargoText, vec2(20, SCREEN_HEIGHT - 25), 12, new Color(0.8, 0.8, 0.6));
  }

  // Low warnings
  if (fuelPct < 0.2 && Math.sin(Date.now() * 0.01) > 0) {
    drawTextScreen("LOW FUEL!", vec2(SCREEN_WIDTH/2 - 50, SCREEN_HEIGHT/2 - 50), 24, new Color(1, 0.2, 0.2));
  }
  if (hullPct < 0.25 && Math.sin(Date.now() * 0.01) > 0) {
    drawTextScreen("HULL CRITICAL!", vec2(SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 - 80), 24, new Color(1, 0.2, 0.2));
  }

  // Transmission
  if (transmissionText) {
    drawRectScreen(vec2(SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 100), vec2(500, 60), new Color(0, 0, 0, 0.9));
    drawTextScreen(transmissionText, vec2(SCREEN_WIDTH/2 - 200, SCREEN_HEIGHT/2 - 100), 14, new Color(0, 1, 0));
    transmissionTimer--;
    if (transmissionTimer <= 0) transmissionText = null;
  }

  // Shop UI
  if (shopOpen) {
    renderShop();
  }

  // Death screen
  if (gameState.isDead) {
    drawRectScreen(vec2(SCREEN_WIDTH/2, SCREEN_HEIGHT/2), vec2(SCREEN_WIDTH, SCREEN_HEIGHT), new Color(0, 0, 0, 0.8));
    drawTextScreen("GAME OVER", vec2(SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 - 30), 36, new Color(1, 0.2, 0.2));
    drawTextScreen(`Final Score: ${gameState.score.toLocaleString()}`, vec2(SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 + 30), 20, new Color(1, 1, 1));
    drawTextScreen("Press R to restart", vec2(SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 + 70), 16, new Color(0.8, 0.8, 0.8));
  }
}

function renderShop() {
  drawRectScreen(vec2(SCREEN_WIDTH/2, SCREEN_HEIGHT/2), vec2(400, 300), new Color(0.1, 0.1, 0.15, 0.95));
  drawRectScreen(vec2(SCREEN_WIDTH/2, SCREEN_HEIGHT/2), vec2(395, 295), new Color(0.15, 0.15, 0.2, 0.95));

  if (shopOpen === 'fuel') {
    const maxFuel = UPGRADES.fuel.values[gameState.upgrades.fuel];
    const needed = maxFuel - gameState.fuel;
    const cost = Math.ceil(needed * 2);

    drawTextScreen("FUEL STATION", vec2(SCREEN_WIDTH/2 - 60, SCREEN_HEIGHT/2 - 110), 24, new Color(1, 0.4, 0.4));
    drawTextScreen(`Current: ${Math.ceil(gameState.fuel)}L / ${maxFuel}L`, vec2(SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 - 50), 16, new Color(1, 1, 1));
    drawTextScreen(`Fill cost: $${cost}`, vec2(SCREEN_WIDTH/2 - 60, SCREEN_HEIGHT/2 - 20), 16, new Color(0.2, 1, 0.4));
    drawTextScreen("[F] Fill Tank    [ESC] Close", vec2(SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT/2 + 80), 14, new Color(0.8, 0.8, 0.8));
  } else if (shopOpen === 'processor') {
    let total = 0;
    for (const m of gameState.cargo) total += m.value;

    drawTextScreen("MINERAL PROCESSOR", vec2(SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 - 110), 24, new Color(0.4, 1, 0.4));
    drawTextScreen(`Cargo items: ${gameState.cargo.length}`, vec2(SCREEN_WIDTH/2 - 60, SCREEN_HEIGHT/2 - 50), 16, new Color(1, 1, 1));
    drawTextScreen(`Total value: $${total.toLocaleString()}`, vec2(SCREEN_WIDTH/2 - 70, SCREEN_HEIGHT/2 - 20), 16, new Color(1, 0.84, 0));
    drawTextScreen("[S] Sell All    [ESC] Close", vec2(SCREEN_WIDTH/2 - 95, SCREEN_HEIGHT/2 + 80), 14, new Color(0.8, 0.8, 0.8));
  } else if (shopOpen === 'junk') {
    drawTextScreen("JUNK SHOP - UPGRADES", vec2(SCREEN_WIDTH/2 - 90, SCREEN_HEIGHT/2 - 110), 24, new Color(1, 1, 0.4));
    drawTextScreen("Upgrades coming soon...", vec2(SCREEN_WIDTH/2 - 80, SCREEN_HEIGHT/2 - 20), 16, new Color(0.8, 0.8, 0.8));
    drawTextScreen("[ESC] Close", vec2(SCREEN_WIDTH/2 - 40, SCREEN_HEIGHT/2 + 80), 14, new Color(0.8, 0.8, 0.8));
  } else if (shopOpen === 'repair') {
    const maxHull = UPGRADES.hull.values[gameState.upgrades.hull];
    const damage = maxHull - gameState.hull;
    const cost = Math.ceil(damage * 15);

    drawTextScreen("REPAIR SHOP", vec2(SCREEN_WIDTH/2 - 55, SCREEN_HEIGHT/2 - 110), 24, new Color(0.4, 0.6, 1));
    drawTextScreen(`Hull: ${Math.ceil(gameState.hull)} / ${maxHull}`, vec2(SCREEN_WIDTH/2 - 60, SCREEN_HEIGHT/2 - 50), 16, new Color(1, 1, 1));
    drawTextScreen(`Repair cost: $${cost}`, vec2(SCREEN_WIDTH/2 - 65, SCREEN_HEIGHT/2 - 20), 16, new Color(0.2, 1, 0.4));
    drawTextScreen("[ESC] Close", vec2(SCREEN_WIDTH/2 - 40, SCREEN_HEIGHT/2 + 80), 14, new Color(0.8, 0.8, 0.8));
  }
}

// Engine callbacks
function gameInit() {
  initGameState();
  generateWorld();
  player = new Player(vec2(WORLD_WIDTH / 2, 0));
  setCameraScale(32);
}

function gameUpdate() {
  // Restart on death
  if (gameState.isDead && keyWasPressed('KeyR')) {
    initGameState();
    generateWorld();
    player.pos = vec2(WORLD_WIDTH / 2, 0);
    player.velocity = vec2(0, 0);
    particles = [];
  }

  updateParticles();

  // Screen shake
  if (screenShake > 0) {
    screenShake *= 0.9;
    if (screenShake < 0.1) screenShake = 0;
  }
}

function gameUpdatePost() {
  // Camera follows player
  const targetY = player.pos.y + 3;
  const currentCam = cameraPos;
  const newY = currentCam.y * 0.9 + targetY * 0.1;

  const shakeX = screenShake > 0 ? rand(-screenShake, screenShake) * 0.05 : 0;
  const shakeY = screenShake > 0 ? rand(-screenShake, screenShake) * 0.05 : 0;

  setCameraPos(vec2(WORLD_WIDTH / 2 + shakeX, newY + shakeY));
}

function gameRender() {
  renderWorld();
  renderParticles();
  player.render();
}

function gameRenderPost() {
  renderHUD();
}

// Start the engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

console.log("Motherload v2 loaded - Mars Mining Game");
