// Using global PIXI from CDN
const { Application, Graphics, Text, TextStyle, Container } = PIXI;

// Game constants
const TILE_SIZE = 16;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Mineral types with accurate values from v2 GDD
const MINERALS = {
  ironium: { value: 30, weight: 10, color: 0x8B4513, minDepth: 25 },
  bronzium: { value: 60, weight: 10, color: 0xCD7F32, minDepth: 25 },
  silverium: { value: 100, weight: 10, color: 0xC0C0C0, minDepth: 25 },
  goldium: { value: 250, weight: 20, color: 0xFFD700, minDepth: 250 },
  platinum: { value: 750, weight: 30, color: 0xE5E4E2, minDepth: 800 },
  einsteinium: { value: 2000, weight: 40, color: 0x00FF00, minDepth: 1600 },
  emerald: { value: 5000, weight: 60, color: 0x50C878, minDepth: 2400 },
  ruby: { value: 20000, weight: 80, color: 0xE0115F, minDepth: 4000 },
  diamond: { value: 100000, weight: 100, color: 0xB9F2FF, minDepth: 4400 },
  amazonite: { value: 500000, weight: 120, color: 0x00C4B0, minDepth: 5500 }
};

// Tile types
const TILE = {
  EMPTY: 0,
  DIRT: 1,
  ROCK: 2,
  SURFACE: 3
};

// Game state
const gameState = {
  cash: 0,
  score: 0,
  fuel: 10,
  maxFuel: 10,
  hull: 10,
  maxHull: 10,
  cargoWeight: 0,
  maxCargo: 7,
  cargo: [],
  depth: 0,
  maxDepth: 0,
  drillSpeed: 20,
  isDead: false
};
window.gameState = gameState;

// World data
let world = [];
let minerals = [];

// Canvas fallback for environments without WebGL
function initCanvasFallback(canvas) {
  const ctx = canvas.getContext('2d');
  let gameStarted = false;

  function drawFallback() {
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('MOTHERLOAD', 280, 100);
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('Mars Mining Simulation', 300, 140);
    ctx.fillText('Click to start', 340, 350);
    if (!gameStarted) requestAnimationFrame(drawFallback);
  }

  canvas.addEventListener('click', () => { gameStarted = true; });
  drawFallback();
  console.log('Motherload (PixiJS) initialized with canvas fallback');
}

// Create app
let app;

async function init() {
  // Create canvas first
  const canvas = document.createElement('canvas');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  document.body.appendChild(canvas);

  try {
    app = new Application({
      view: canvas,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x1a0a0a,
      antialias: true,
      forceCanvas: true
    });
  } catch (e) {
    console.log('PixiJS initialization failed, using canvas fallback:', e.message);
    initCanvasFallback(canvas);
    return;
  }

  // Generate world
  generateWorld();

  // Create containers
  const worldContainer = new Container();
  worldContainer.sortableChildren = true;
  app.stage.addChild(worldContainer);

  // Draw world
  const worldGraphics = new Graphics();
  worldGraphics.zIndex = 0;
  worldContainer.addChild(worldGraphics);
  drawWorld(worldGraphics);

  // Create player
  const player = new Graphics();
  player.rect(-12, -12, 24, 24);
  player.fill(0x44AA44);
  player.rect(-6, 12, 12, 8);
  player.fill(0x888888); // Drill
  player.x = WORLD_WIDTH * TILE_SIZE / 2;
  player.y = TILE_SIZE;
  player.zIndex = 10;
  worldContainer.addChild(player);

  // Player state
  const playerState = {
    vx: 0,
    vy: 0,
    drilling: false,
    drillProgress: 0,
    drillTarget: null
  };

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // Create HUD
  const hudContainer = new Container();
  hudContainer.zIndex = 100;
  app.stage.addChild(hudContainer);

  const hudBg = new Graphics();
  hudBg.rect(0, 0, GAME_WIDTH, 50);
  hudBg.fill({ color: 0x000000, alpha: 0.8 });
  hudContainer.addChild(hudBg);

  const textStyle = new TextStyle({
    fontSize: 14,
    fill: 0xffffff,
    fontFamily: 'monospace'
  });

  const depthText = new Text({ text: 'DEPTH: 0 ft', style: textStyle });
  depthText.x = 10;
  depthText.y = 5;
  hudContainer.addChild(depthText);

  const cashText = new Text({ text: 'CASH: $0', style: textStyle });
  cashText.x = 150;
  cashText.y = 5;
  hudContainer.addChild(cashText);

  const fuelText = new Text({ text: 'FUEL: 10/10', style: textStyle });
  fuelText.x = 300;
  fuelText.y = 5;
  hudContainer.addChild(fuelText);

  const hullText = new Text({ text: 'HULL: 10/10', style: textStyle });
  hullText.x = 450;
  hullText.y = 5;
  hudContainer.addChild(hullText);

  const cargoText = new Text({ text: 'CARGO: 0/7', style: textStyle });
  cargoText.x = 600;
  cargoText.y = 5;
  hudContainer.addChild(cargoText);

  // Instruction text
  const instructionText = new Text({
    text: 'WASD/Arrows to move, Return to surface to sell minerals',
    style: new TextStyle({ fontSize: 12, fill: 0xaaaaaa, fontFamily: 'monospace' })
  });
  instructionText.x = 10;
  instructionText.y = 30;
  hudContainer.addChild(instructionText);

  // Game loop
  let lastTime = performance.now();

  app.ticker.add(() => {
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    if (gameState.isDead) return;

    // Movement
    const speed = 120;
    let moving = false;

    if (!playerState.drilling) {
      if (keys['KeyA'] || keys['ArrowLeft']) {
        playerState.vx = -speed;
        moving = true;
      } else if (keys['KeyD'] || keys['ArrowRight']) {
        playerState.vx = speed;
        moving = true;
      } else {
        playerState.vx = 0;
      }

      if (keys['KeyW'] || keys['ArrowUp']) {
        playerState.vy = -speed;
        moving = true;
      } else {
        // Gravity
        playerState.vy = Math.min(playerState.vy + 300 * delta, 200);
      }

      // Try to drill down
      if (keys['KeyS'] || keys['ArrowDown']) {
        const tileX = Math.floor(player.x / TILE_SIZE);
        const tileY = Math.floor((player.y + 20) / TILE_SIZE);

        if (tileY > 0 && tileY < WORLD_HEIGHT && world[tileY] && world[tileY][tileX] !== TILE.EMPTY) {
          playerState.drilling = true;
          playerState.drillProgress = 0;
          playerState.drillTarget = { x: tileX, y: tileY };
          playerState.vx = 0;
          playerState.vy = 0;
        }
      }
    }

    // Handle drilling
    if (playerState.drilling) {
      const drillTime = world[playerState.drillTarget.y][playerState.drillTarget.x] === TILE.ROCK ? 1.5 : 1.0;
      playerState.drillProgress += delta * (gameState.drillSpeed / 20);

      if (playerState.drillProgress >= drillTime) {
        // Complete drill
        const tx = playerState.drillTarget.x;
        const ty = playerState.drillTarget.y;

        // Check for mineral
        const mineralKey = `${tx},${ty}`;
        const mineral = minerals.find(m => m.x === tx && m.y === ty);
        if (mineral && !mineral.collected) {
          if (gameState.cargoWeight + mineral.weight <= gameState.maxCargo * 10) {
            mineral.collected = true;
            gameState.cargo.push({
              type: mineral.type,
              value: mineral.value,
              weight: mineral.weight
            });
            gameState.cargoWeight += mineral.weight;
          }
        }

        // Clear tile
        world[ty][tx] = TILE.EMPTY;
        drawWorld(worldGraphics);

        // Move player down
        player.y = ty * TILE_SIZE;
        playerState.drilling = false;
        playerState.drillTarget = null;

        // Update depth
        gameState.depth = Math.max(0, Math.floor((player.y - TILE_SIZE) / TILE_SIZE) * 13);
        gameState.maxDepth = Math.max(gameState.maxDepth, gameState.depth);
      }
    }

    // Apply velocity
    if (!playerState.drilling) {
      player.x += playerState.vx * delta;
      player.y += playerState.vy * delta;

      // Collision with tiles
      const tileX = Math.floor(player.x / TILE_SIZE);
      const tileY = Math.floor(player.y / TILE_SIZE);

      // Horizontal collision
      if (playerState.vx > 0) {
        const rightTileX = Math.floor((player.x + 12) / TILE_SIZE);
        if (world[tileY] && world[tileY][rightTileX] !== TILE.EMPTY) {
          player.x = rightTileX * TILE_SIZE - 13;
        }
      } else if (playerState.vx < 0) {
        const leftTileX = Math.floor((player.x - 12) / TILE_SIZE);
        if (world[tileY] && world[tileY][leftTileX] !== TILE.EMPTY) {
          player.x = (leftTileX + 1) * TILE_SIZE + 13;
        }
      }

      // Vertical collision (ground)
      const bottomTileY = Math.floor((player.y + 12) / TILE_SIZE);
      if (bottomTileY > 0 && world[bottomTileY] && world[bottomTileY][tileX] !== TILE.EMPTY) {
        player.y = bottomTileY * TILE_SIZE - 12;
        playerState.vy = 0;
      }

      // Bounds
      player.x = Math.max(12, Math.min(WORLD_WIDTH * TILE_SIZE - 12, player.x));
      player.y = Math.max(12, Math.min(WORLD_HEIGHT * TILE_SIZE - 12, player.y));
    }

    // Fuel consumption
    if (moving || playerState.drilling) {
      gameState.fuel -= 0.05 * delta;
      if (gameState.fuel <= 0) {
        gameState.fuel = 0;
        // Can't move with no fuel
      }
    }

    // Surface interaction - sell minerals
    if (player.y < TILE_SIZE * 2 && gameState.cargo.length > 0) {
      // Auto-sell at surface
      for (const item of gameState.cargo) {
        gameState.cash += item.value;
        gameState.score += item.value * 10;
      }
      gameState.cargo = [];
      gameState.cargoWeight = 0;

      // Refuel at surface
      gameState.fuel = gameState.maxFuel;
    }

    // Update depth
    gameState.depth = Math.max(0, Math.floor((player.y - TILE_SIZE) / TILE_SIZE) * 13);

    // Update camera
    worldContainer.y = -player.y + GAME_HEIGHT / 2;
    worldContainer.y = Math.min(0, worldContainer.y);
    worldContainer.y = Math.max(-WORLD_HEIGHT * TILE_SIZE + GAME_HEIGHT, worldContainer.y);

    // Update HUD
    depthText.text = `DEPTH: -${gameState.depth} ft`;
    cashText.text = `CASH: $${gameState.cash.toLocaleString()}`;
    fuelText.text = `FUEL: ${gameState.fuel.toFixed(1)}/${gameState.maxFuel}`;
    hullText.text = `HULL: ${gameState.hull}/${gameState.maxHull}`;
    cargoText.text = `CARGO: ${gameState.cargoWeight}/${gameState.maxCargo * 10} kg`;

    // Color warnings
    fuelText.style.fill = gameState.fuel < gameState.maxFuel * 0.2 ? 0xff4444 : 0xffffff;
    hullText.style.fill = gameState.hull < gameState.maxHull * 0.25 ? 0xff4444 : 0xffffff;
  });

  console.log('Motherload (PixiJS) loaded');
}

function generateWorld() {
  world = [];
  minerals = [];

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    const depth = y * 13; // Convert to feet

    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        // Surface
        row.push(TILE.SURFACE);
      } else if (y === 1) {
        // First row below surface is empty (player starting area)
        row.push(TILE.EMPTY);
      } else {
        // Underground
        const roll = Math.random();

        // Check for mineral spawn
        let mineralSpawned = false;
        for (const [name, data] of Object.entries(MINERALS)) {
          if (depth >= data.minDepth) {
            // Spawn chance based on depth
            const spawnChance = 0.03 * Math.min(1, depth / (data.minDepth * 2));
            if (roll < spawnChance && !mineralSpawned) {
              row.push(TILE.DIRT); // Tile type is dirt, mineral is tracked separately
              minerals.push({
                x, y,
                type: name,
                value: data.value,
                weight: data.weight,
                color: data.color,
                collected: false
              });
              mineralSpawned = true;
              break;
            }
          }
        }

        if (!mineralSpawned) {
          // Regular terrain
          if (roll < 0.7) {
            row.push(TILE.DIRT);
          } else if (roll < 0.9) {
            row.push(TILE.ROCK);
          } else {
            row.push(TILE.EMPTY);
          }
        }
      }
    }
    world.push(row);
  }
}

function drawWorld(graphics) {
  graphics.clear();

  // Draw visible tiles
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const tile = world[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === TILE.SURFACE) {
        // Mars surface
        graphics.rect(px, py, TILE_SIZE, TILE_SIZE);
        graphics.fill(0x8B4513);
      } else if (tile === TILE.DIRT) {
        // Check if mineral
        const mineral = minerals.find(m => m.x === x && m.y === y && !m.collected);
        if (mineral) {
          graphics.rect(px, py, TILE_SIZE, TILE_SIZE);
          graphics.fill(mineral.color);
        } else {
          graphics.rect(px, py, TILE_SIZE, TILE_SIZE);
          graphics.fill(0x6B3510);
        }
      } else if (tile === TILE.ROCK) {
        graphics.rect(px, py, TILE_SIZE, TILE_SIZE);
        graphics.fill(0x555555);
      }
    }
  }

  // Sky background
  graphics.rect(0, -200, WORLD_WIDTH * TILE_SIZE, 200);
  graphics.fill(0x2a1010);

  // Surface buildings indicators
  graphics.rect(10, -50, 80, 50);
  graphics.fill(0x444488); // Fuel station
  graphics.rect(200, -50, 80, 50);
  graphics.fill(0x448844); // Mineral processor
}

init();
