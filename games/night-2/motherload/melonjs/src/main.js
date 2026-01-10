// Motherload - Mars Mining Game with MelonJS
// Using global 'me' from CDN

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 16;
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 300;

// Tile types
const EMPTY = 0;
const DIRT = 1;
const ROCK = 2;
const BOULDER = 3;
const LAVA = 4;
const BUILDING = 5;

// Minerals with values from v2 GDD
const MINERALS = [
  { id: 10, name: 'Ironium', value: 30, weight: 10, minDepth: 2, color: '#8B4513' },
  { id: 11, name: 'Bronzium', value: 60, weight: 10, minDepth: 2, color: '#CD7F32' },
  { id: 12, name: 'Silverium', value: 100, weight: 10, minDepth: 2, color: '#C0C0C0' },
  { id: 13, name: 'Goldium', value: 250, weight: 20, minDepth: 20, color: '#FFD700' },
  { id: 14, name: 'Platinum', value: 750, weight: 30, minDepth: 60, color: '#E5E4E2' },
  { id: 15, name: 'Einsteinium', value: 2000, weight: 40, minDepth: 120, color: '#00FF00' },
  { id: 16, name: 'Emerald', value: 5000, weight: 60, minDepth: 180, color: '#50C878' },
  { id: 17, name: 'Ruby', value: 20000, weight: 80, minDepth: 220, color: '#E0115F' },
  { id: 18, name: 'Diamond', value: 100000, weight: 100, minDepth: 260, color: '#B9F2FF' },
  { id: 19, name: 'Amazonite', value: 500000, weight: 120, minDepth: 280, color: '#00C4B0' }
];

// Upgrade tiers
const UPGRADES = {
  drill: [20, 28, 40, 50, 70, 95, 120],
  hull: [10, 17, 30, 50, 80, 120, 180],
  fuel: [10, 15, 25, 40, 60, 100, 150],
  cargo: [70, 150, 250, 400, 700, 1200],
  prices: [0, 750, 2000, 5000, 20000, 100000, 500000]
};

// Game state
let gameState = {
  cash: 100,
  score: 0,
  fuel: 10,
  hull: 10,
  cargo: [],
  cargoWeight: 0,
  upgrades: { drill: 0, hull: 0, fuel: 0, cargo: 0 },
  maxDepth: 0,
  isDead: false
};

// World data
let world = [];

// Get mineral by ID
function getMineralById(id) {
  return MINERALS.find(m => m.id === id);
}

// Generate world
function generateWorld() {
  world = [];
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        // Surface with buildings
        if (x >= 5 && x <= 8) row.push(BUILDING);
        else if (x >= 15 && x <= 18) row.push(BUILDING);
        else if (x >= 25 && x <= 28) row.push(BUILDING);
        else if (x >= 35 && x <= 38) row.push(BUILDING);
        else row.push(EMPTY);
      } else if (y === 1 && ((x >= 5 && x <= 8) || (x >= 15 && x <= 18) || (x >= 25 && x <= 28) || (x >= 35 && x <= 38))) {
        row.push(BOULDER);
      } else {
        row.push(generateTile(y));
      }
    }
    world.push(row);
  }
}

function generateTile(depth) {
  const r = Math.random();

  // Lava in deep areas
  if (depth > 200 && r < 0.02) return LAVA;

  // Boulders
  if (depth > 100 && r < 0.015) return BOULDER;

  // Minerals
  if (r < 0.18) {
    const eligible = MINERALS.filter(m => depth >= m.minDepth);
    if (eligible.length > 0) {
      const weights = eligible.map(m => {
        const diff = depth - m.minDepth;
        if (diff < 40) return 10;
        if (diff < 80) return 5;
        return 1;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let pick = Math.random() * total;
      for (let i = 0; i < eligible.length; i++) {
        pick -= weights[i];
        if (pick <= 0) return eligible[i].id;
      }
    }
  }

  // Rock or dirt
  if (r < 0.35) return ROCK;
  return DIRT;
}

// Player entity
class Player extends me.Renderable {
  constructor(x, y) {
    super(x, y, TILE_SIZE, TILE_SIZE * 1.5);
    this.anchorPoint.set(0.5, 0.5);
    this.body = new me.Body(this);
    this.body.addShape(new me.Rect(0, 0, TILE_SIZE, TILE_SIZE * 1.5));
    this.body.setMaxVelocity(3, 5);
    this.body.setFriction(0.5, 0);
    this.body.gravityScale = 0.5;

    this.alwaysUpdate = true;
    this.isDrilling = false;
    this.drillProgress = 0;
    this.drillTarget = null;
  }

  update(dt) {
    const moveSpeed = 0.15;
    const thrustPower = 0.25;

    // Horizontal movement
    if (me.input.isKeyPressed('left')) {
      this.body.force.x = -moveSpeed;
      consumeFuel(0.002);
    } else if (me.input.isKeyPressed('right')) {
      this.body.force.x = moveSpeed;
      consumeFuel(0.002);
    }

    // Thrust up
    if (me.input.isKeyPressed('up') && gameState.fuel > 0) {
      this.body.force.y = thrustPower;
      consumeFuel(0.01);
    }

    // Drilling down
    if (me.input.isKeyPressed('down') && !this.isDrilling) {
      const tileX = Math.floor(this.pos.x / TILE_SIZE);
      const tileY = Math.floor((this.pos.y + TILE_SIZE) / TILE_SIZE);
      if (canDrill(tileX, tileY)) {
        this.startDrill(tileX, tileY);
      }
    }

    // Update drill progress
    if (this.isDrilling) {
      const drillSpeed = UPGRADES.drill[gameState.upgrades.drill];
      this.drillProgress += drillSpeed * dt / 1000;
      if (this.drillProgress >= 100) {
        this.completeDrill();
      }
    }

    // Apply physics
    this.body.update(dt);

    // Bounds
    this.pos.x = Math.max(TILE_SIZE, Math.min(WORLD_WIDTH * TILE_SIZE - TILE_SIZE, this.pos.x));
    if (this.pos.y < 0) this.pos.y = 0;

    // Track depth
    const depth = Math.floor(this.pos.y / TILE_SIZE);
    if (depth > gameState.maxDepth) {
      gameState.maxDepth = depth;
    }

    return true;
  }

  startDrill(tx, ty) {
    this.isDrilling = true;
    this.drillProgress = 0;
    this.drillTarget = { x: tx, y: ty };
    consumeFuel(0.05);
  }

  completeDrill() {
    const { x, y } = this.drillTarget;
    const tile = world[y][x];

    // Check for mineral
    if (tile >= 10 && tile <= 19) {
      const mineral = getMineralById(tile);
      if (mineral) {
        const maxCargo = UPGRADES.cargo[gameState.upgrades.cargo];
        if (gameState.cargoWeight + mineral.weight <= maxCargo) {
          gameState.cargo.push({ ...mineral });
          gameState.cargoWeight += mineral.weight;
        }
      }
    }

    // Check lava damage
    if (tile === LAVA) {
      takeDamage(58);
    }

    // Clear tile
    world[y][x] = EMPTY;

    // Move player down
    this.pos.x = x * TILE_SIZE + TILE_SIZE / 2;
    this.pos.y = y * TILE_SIZE;
    this.body.vel.set(0, 0);

    this.isDrilling = false;
    this.drillTarget = null;
  }

  draw(renderer) {
    // Pod body
    renderer.setColor('#667788');
    renderer.fillRect(this.pos.x - 6, this.pos.y - 10, 12, 16);

    // Cockpit
    renderer.setColor('#4488AA');
    renderer.fillRect(this.pos.x - 4, this.pos.y - 8, 8, 6);

    // Drill
    renderer.setColor('#AAAA44');
    renderer.fillRect(this.pos.x - 3, this.pos.y + 6, 6, 8);

    // Drill animation
    if (this.isDrilling) {
      const flash = Math.sin(Date.now() * 0.02) > 0;
      if (flash) {
        renderer.setColor('#FFAA00');
        renderer.fillRect(this.pos.x - 2, this.pos.y + 12, 4, 4);
      }
    }
  }
}

// Helper functions
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

// Game screen
class PlayScreen extends me.Stage {
  onResetEvent() {
    generateWorld();

    // Create player
    const player = new Player(WORLD_WIDTH * TILE_SIZE / 2, TILE_SIZE);
    me.game.world.addChild(player, 10);

    // Set up viewport
    me.game.viewport.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
    me.game.viewport.setDeadzone(GAME_WIDTH / 4, GAME_HEIGHT / 4);
    me.game.viewport.follow(player, me.game.viewport.AXIS.BOTH);

    // Add world renderer
    const worldRenderer = new WorldRenderer();
    me.game.world.addChild(worldRenderer, 1);

    // Add HUD
    const hud = new HUD();
    me.game.world.addChild(hud, 100);
  }
}

// World renderer
class WorldRenderer extends me.Renderable {
  constructor() {
    super(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
    this.anchorPoint.set(0, 0);
    this.floating = false;
    this.alwaysUpdate = true;
  }

  update() {
    return true;
  }

  draw(renderer) {
    const viewport = me.game.viewport;
    const startX = Math.max(0, Math.floor(viewport.pos.x / TILE_SIZE) - 1);
    const endX = Math.min(WORLD_WIDTH, startX + Math.ceil(GAME_WIDTH / TILE_SIZE) + 2);
    const startY = Math.max(0, Math.floor(viewport.pos.y / TILE_SIZE) - 1);
    const endY = Math.min(WORLD_HEIGHT, startY + Math.ceil(GAME_HEIGHT / TILE_SIZE) + 2);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = world[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === EMPTY) {
          // Sky or cavity
          renderer.setColor(y === 0 ? '#AA6644' : '#110808');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === DIRT) {
          // Mars dirt
          renderer.setColor('#8B4513');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#6B3503');
          renderer.fillRect(px + 2, py + 2, 4, 4);
        } else if (tile === ROCK) {
          renderer.setColor('#555566');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#444455');
          renderer.fillRect(px + 4, py + 2, 8, 2);
        } else if (tile === BOULDER) {
          renderer.setColor('#333344');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#444455');
          renderer.fillRect(px + 2, py + 4, 8, 4);
        } else if (tile === LAVA) {
          const pulse = Math.sin(Date.now() * 0.005 + x + y) * 0.3 + 0.7;
          renderer.setColor(`rgba(255, ${Math.floor(80 * pulse)}, 0, 1)`);
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === BUILDING) {
          renderer.setColor('#666677');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#4488AA');
          renderer.fillRect(px + 4, py + 4, 8, 8);
        } else if (tile >= 10 && tile <= 19) {
          // Mineral
          const mineral = getMineralById(tile);
          // Background dirt
          renderer.setColor('#8B4513');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Mineral
          if (mineral) {
            renderer.setColor(mineral.color);
            renderer.fillRect(px + 3, py + 3, 10, 10);
            // Sparkle
            const sparkle = Math.sin(Date.now() * 0.01 + x * 7 + y * 13) * 0.3 + 0.7;
            renderer.setColor(`rgba(255, 255, 255, ${sparkle * 0.5})`);
            renderer.fillRect(px + 4, py + 4, 3, 3);
          }
        }
      }
    }

    // Buildings on surface
    if (startY === 0) {
      // Fuel station
      renderer.setColor('#CC3333');
      renderer.fillRect(5 * TILE_SIZE, -TILE_SIZE, 4 * TILE_SIZE, TILE_SIZE);
      // Processor
      renderer.setColor('#33AA33');
      renderer.fillRect(15 * TILE_SIZE, -TILE_SIZE, 4 * TILE_SIZE, TILE_SIZE);
      // Shop
      renderer.setColor('#AAAA33');
      renderer.fillRect(25 * TILE_SIZE, -TILE_SIZE, 4 * TILE_SIZE, TILE_SIZE);
      // Repair
      renderer.setColor('#3366AA');
      renderer.fillRect(35 * TILE_SIZE, -TILE_SIZE, 4 * TILE_SIZE, TILE_SIZE);
    }
  }
}

// HUD
class HUD extends me.Renderable {
  constructor() {
    super(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.anchorPoint.set(0, 0);
    this.floating = true;
    this.alwaysUpdate = true;
    this.depthText = new me.Text(20, 20, { font: '16px Arial', fillStyle: '#AABBFF' });
    this.cashText = new me.Text(180, 20, { font: '16px Arial', fillStyle: '#44FF66' });
    this.scoreText = new me.Text(380, 20, { font: '16px Arial', fillStyle: '#FFCC44' });
    this.fuelLabel = new me.Text(20, GAME_HEIGHT - 40, { font: '14px Arial', fillStyle: '#FFFFFF' });
    this.hullLabel = new me.Text(200, GAME_HEIGHT - 40, { font: '14px Arial', fillStyle: '#FFFFFF' });
    this.cargoLabel = new me.Text(380, GAME_HEIGHT - 40, { font: '14px Arial', fillStyle: '#FFFFFF' });
    this.cargoWeight = new me.Text(550, GAME_HEIGHT - 40, { font: '12px Arial', fillStyle: '#AAAAAA' });
    this.warningText = new me.Text(GAME_WIDTH / 2 - 50, GAME_HEIGHT / 2 - 50, { font: '20px Arial', fillStyle: '#FF4444' });
    this.gameOverText = new me.Text(GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2, { font: '24px Arial', fillStyle: '#FF4444' });
    this.restartText = new me.Text(GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 + 40, { font: '14px Arial', fillStyle: '#AAAAAA' });
  }

  update() {
    return true;
  }

  draw(renderer) {
    const maxFuel = UPGRADES.fuel[gameState.upgrades.fuel];
    const maxHull = UPGRADES.hull[gameState.upgrades.hull];
    const maxCargo = UPGRADES.cargo[gameState.upgrades.cargo];

    // Top bar background
    renderer.setColor('rgba(0, 0, 0, 0.7)');
    renderer.fillRect(0, 0, GAME_WIDTH, 40);

    // Depth
    this.depthText.setText(`DEPTH: ${gameState.maxDepth * 13} ft`);
    this.depthText.draw(renderer);

    // Cash
    this.cashText.setText(`CASH: $${gameState.cash.toLocaleString()}`);
    this.cashText.draw(renderer);

    // Score
    this.scoreText.setText(`SCORE: ${gameState.score.toLocaleString()}`);
    this.scoreText.draw(renderer);

    // Bottom bar
    renderer.setColor('rgba(0, 0, 0, 0.7)');
    renderer.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

    // Fuel bar
    const fuelPct = gameState.fuel / maxFuel;
    this.fuelLabel.setText('FUEL');
    this.fuelLabel.draw(renderer);
    renderer.setColor('#333333');
    renderer.fillRect(70, GAME_HEIGHT - 45, 100, 15);
    renderer.setColor(fuelPct < 0.2 ? '#FF4444' : '#44AA44');
    renderer.fillRect(70, GAME_HEIGHT - 45, fuelPct * 100, 15);

    // Hull bar
    const hullPct = gameState.hull / maxHull;
    this.hullLabel.setText('HULL');
    this.hullLabel.draw(renderer);
    renderer.setColor('#333333');
    renderer.fillRect(250, GAME_HEIGHT - 45, 100, 15);
    renderer.setColor(hullPct < 0.25 ? '#FF4444' : '#4488FF');
    renderer.fillRect(250, GAME_HEIGHT - 45, hullPct * 100, 15);

    // Cargo bar
    const cargoPct = gameState.cargoWeight / maxCargo;
    this.cargoLabel.setText('CARGO');
    this.cargoLabel.draw(renderer);
    renderer.setColor('#333333');
    renderer.fillRect(440, GAME_HEIGHT - 45, 100, 15);
    renderer.setColor('#AA8844');
    renderer.fillRect(440, GAME_HEIGHT - 45, cargoPct * 100, 15);

    // Cargo weight
    this.cargoWeight.setText(`${gameState.cargoWeight}/${maxCargo}kg`);
    this.cargoWeight.draw(renderer);

    // Low warnings
    if (fuelPct < 0.2 && Math.sin(Date.now() * 0.01) > 0) {
      this.warningText.setText('LOW FUEL!');
      this.warningText.draw(renderer);
    }

    // Death screen
    if (gameState.isDead) {
      renderer.setColor('rgba(0, 0, 0, 0.8)');
      renderer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.gameOverText.setText('GAME OVER');
      this.gameOverText.draw(renderer);
      this.restartText.setText('Press R to restart');
      this.restartText.draw(renderer);
    }
  }
}

// Initialize game
me.device.onReady(function() {
  if (!me.video.init(GAME_WIDTH, GAME_HEIGHT, { parent: 'screen', scale: 'auto' })) {
    alert('Failed to initialize video');
    return;
  }

  // Set up input
  me.input.bindKey(me.input.KEY.LEFT, 'left');
  me.input.bindKey(me.input.KEY.RIGHT, 'right');
  me.input.bindKey(me.input.KEY.UP, 'up');
  me.input.bindKey(me.input.KEY.DOWN, 'down');
  me.input.bindKey(me.input.KEY.A, 'left');
  me.input.bindKey(me.input.KEY.D, 'right');
  me.input.bindKey(me.input.KEY.W, 'up');
  me.input.bindKey(me.input.KEY.S, 'down');
  me.input.bindKey(me.input.KEY.R, 'restart');

  // Start game
  me.state.set(me.state.PLAY, new PlayScreen());
  me.state.change(me.state.PLAY);

  // Expose game state for testing
  window.gameState = gameState;

  console.log('Motherload (MelonJS) loaded');
});
