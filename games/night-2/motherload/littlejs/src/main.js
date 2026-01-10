// Using global LittleJS from CDN
const {
  engineInit, vec2, rgb, Timer,
  keyIsDown, keyWasPressed, mouseWasPressed,
  drawRect, drawText, drawLine,
  setCanvasFixedSize, setCameraPos, setCameraScale, cameraPos,
  rand, randInt, PI
} = window;

// Game state for testing
window.gameState = {
  scene: 'loading',
  player: { x: 0, y: 0, depth: 0, fuel: 10, hull: 10, cash: 0 },
  cargo: [],
  cargoWeight: 0
};

// Helper for Playwright testing (bypass keyboard input issues)
window.startGame = () => {
  if (window._startGameCallback) {
    window._startGameCallback();
  }
};

// Constants
const TILE_SIZE = 13;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200; // Reduced for performance
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Tile types
const TileType = {
  EMPTY: 0,
  DIRT: 1,
  ROCK: 2,
  BOULDER: 3,
  LAVA: 4,
  BUILDING: 5,
  IRONIUM: 10,
  BRONZIUM: 11,
  SILVERIUM: 12,
  GOLDIUM: 13,
  PLATINUM: 14,
  EINSTEINIUM: 15,
  EMERALD: 16,
  RUBY: 17,
  DIAMOND: 18,
  AMAZONITE: 19
};

// Colors for tiles
const TILE_COLORS = {
  [TileType.DIRT]: rgb(0.6, 0.3, 0.2),
  [TileType.ROCK]: rgb(0.4, 0.35, 0.3),
  [TileType.BOULDER]: rgb(0.3, 0.3, 0.3),
  [TileType.LAVA]: rgb(1, 0.3, 0),
  [TileType.BUILDING]: rgb(0.5, 0.5, 0.6),
  [TileType.IRONIUM]: rgb(0.55, 0.27, 0.07),
  [TileType.BRONZIUM]: rgb(0.8, 0.5, 0.2),
  [TileType.SILVERIUM]: rgb(0.75, 0.75, 0.75),
  [TileType.GOLDIUM]: rgb(1, 0.84, 0),
  [TileType.PLATINUM]: rgb(0.9, 0.9, 0.88),
  [TileType.EINSTEINIUM]: rgb(0, 1, 0),
  [TileType.EMERALD]: rgb(0.31, 0.78, 0.47),
  [TileType.RUBY]: rgb(0.88, 0.07, 0.37),
  [TileType.DIAMOND]: rgb(0.73, 0.95, 1),
  [TileType.AMAZONITE]: rgb(0, 0.77, 0.69)
};

// Mineral data
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

// Game state
let world = [];
let player = { x: 20, y: 0, vx: 0, vy: 0 };
let gameScene = 'menu';
let isDrilling = false;
let drillTimer = 0;
let drillTarget = null;

let playerStats = {
  cash: 0,
  fuel: 10,
  maxFuel: 10,
  hull: 10,
  maxHull: 10,
  drillSpeed: 20,
  cargoCapacity: 70,
  score: 0
};

let cargo = [];
let cargoWeight = 0;

// Generate world
function generateWorld() {
  world = [];
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const row = [];
    const depth = y * TILE_SIZE;

    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y === 0) {
        if (x >= 2 && x <= 8) row.push(TileType.BUILDING);
        else if (x >= 12 && x <= 18) row.push(TileType.BUILDING);
        else if (x >= 22 && x <= 28) row.push(TileType.BUILDING);
        else if (x >= 32 && x <= 38) row.push(TileType.BUILDING);
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

  // Minerals
  if (roll < 0.25) {
    const mineralTypes = Object.keys(MINERALS).map(Number).filter(type => depth >= MINERALS[type].minDepth);
    if (mineralTypes.length > 0) {
      return mineralTypes[randInt(mineralTypes.length)];
    }
  }

  // Rock vs Dirt
  return roll < 0.35 ? TileType.ROCK : TileType.DIRT;
}

function getTile(x, y) {
  if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) return undefined;
  return world[y]?.[x];
}

function setTile(x, y, type) {
  if (y >= 0 && y < WORLD_HEIGHT && x >= 0 && x < WORLD_WIDTH) {
    world[y][x] = type;
  }
}

// Game init
function gameInit() {
  setCanvasFixedSize(vec2(SCREEN_WIDTH, SCREEN_HEIGHT));
  generateWorld();
  player = { x: 20, y: 0, vx: 0, vy: 0 };
  gameScene = 'menu';
  window.gameState.scene = 'menu';
}

// Game update
function gameUpdate() {
  if (gameScene === 'menu') {
    if (keyWasPressed('Space') || keyWasPressed('Enter') || mouseWasPressed(0)) {
      gameScene = 'game';
    }
  } else if (gameScene === 'game') {
    updateGame();
  } else if (gameScene === 'shop') {
    if (keyWasPressed('Escape') || keyWasPressed('KeyE')) {
      gameScene = 'game';
    }
    // Upgrades
    if (keyWasPressed('Digit1') && playerStats.cash >= 750) {
      playerStats.cash -= 750;
      playerStats.drillSpeed = Math.min(120, playerStats.drillSpeed + 8);
    }
    if (keyWasPressed('Digit2') && playerStats.cash >= 750) {
      playerStats.cash -= 750;
      playerStats.maxHull = Math.min(180, playerStats.maxHull + 7);
    }
  } else if (gameScene === 'gameover') {
    if (keyWasPressed('Space') || keyWasPressed('Enter')) {
      playerStats = { cash: 0, fuel: 10, maxFuel: 10, hull: 10, maxHull: 10, drillSpeed: 20, cargoCapacity: 70, score: 0 };
      cargo = [];
      cargoWeight = 0;
      generateWorld();
      player = { x: 20, y: 0, vx: 0, vy: 0 };
      gameScene = 'game';
    }
  }

  // Update game state for testing
  window.gameState.scene = gameScene;
  window.gameState.player = {
    x: Math.round(player.x),
    y: Math.round(player.y),
    depth: Math.round(player.y * TILE_SIZE),
    fuel: Math.round(playerStats.fuel * 10) / 10,
    hull: playerStats.hull,
    cash: playerStats.cash
  };
  window.gameState.cargo = cargo;
  window.gameState.cargoWeight = cargoWeight;
}

function updateGame() {
  const speed = 0.15;
  let moved = false;

  // Horizontal
  if (keyIsDown('ArrowLeft') || keyIsDown('KeyA')) {
    player.vx = -speed;
    moved = true;
  } else if (keyIsDown('ArrowRight') || keyIsDown('KeyD')) {
    player.vx = speed;
    moved = true;
  } else {
    player.vx *= 0.8;
  }

  // Vertical / Drilling
  if (keyIsDown('ArrowUp') || keyIsDown('KeyW')) {
    player.vy = -speed * 0.8;
    moved = true;
  } else if (keyIsDown('ArrowDown') || keyIsDown('KeyS')) {
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

  // Drilling
  if (isDrilling) {
    drillTimer -= 1/60;
    if (drillTimer <= 0) {
      const tile = getTile(drillTarget.x, drillTarget.y);
      if (MINERALS[tile]) {
        const mineral = MINERALS[tile];
        if (cargoWeight + mineral.weight <= playerStats.cargoCapacity) {
          cargo.push({ type: tile, name: mineral.name, value: mineral.value, weight: mineral.weight });
          cargoWeight += mineral.weight;
        }
      }
      setTile(drillTarget.x, drillTarget.y, TileType.EMPTY);
      player.y = drillTarget.y;
      isDrilling = false;
      drillTarget = null;
    }
    moved = true;
  }

  // Move
  const newX = player.x + player.vx;
  const newY = player.y + player.vy;

  // Collision X
  const checkTileX = getTile(Math.floor(newX), Math.floor(player.y));
  if (checkTileX === TileType.EMPTY || checkTileX === TileType.BUILDING || checkTileX === undefined || player.y < 1) {
    player.x = Math.max(0, Math.min(WORLD_WIDTH - 1, newX));
  }

  // Collision Y
  const checkTileY = getTile(Math.floor(player.x), Math.floor(newY));
  if (checkTileY === TileType.EMPTY || checkTileY === TileType.BUILDING || checkTileY === undefined || newY < 0) {
    player.y = Math.max(0, newY);
  }

  // Fuel
  if (moved && playerStats.fuel > 0) {
    playerStats.fuel -= 0.002;
    playerStats.fuel = Math.max(0, playerStats.fuel);
  }

  // Building interaction
  if (player.y < 1 && keyWasPressed('KeyE')) {
    const tileX = Math.floor(player.x);
    if (tileX >= 2 && tileX <= 8) {
      // Fuel
      const cost = Math.ceil((playerStats.maxFuel - playerStats.fuel) * 2);
      if (playerStats.cash >= cost) {
        playerStats.cash -= cost;
        playerStats.fuel = playerStats.maxFuel;
      }
    } else if (tileX >= 12 && tileX <= 18) {
      // Sell
      for (const item of cargo) {
        playerStats.cash += item.value;
        playerStats.score += item.value * 10;
      }
      cargo = [];
      cargoWeight = 0;
    } else if (tileX >= 22 && tileX <= 28) {
      gameScene = 'shop';
    } else if (tileX >= 32 && tileX <= 38) {
      // Repair
      const cost = (playerStats.maxHull - playerStats.hull) * 15;
      if (playerStats.cash >= cost) {
        playerStats.cash -= cost;
        playerStats.hull = playerStats.maxHull;
      }
    }
  }

  // Camera
  setCameraPos(vec2(player.x, player.y + 10));

  // Hull check
  if (playerStats.hull <= 0) {
    gameScene = 'gameover';
  }
}

// Game render
function gameRender() {
  if (gameScene === 'menu') {
    renderMenu();
  } else if (gameScene === 'game' || gameScene === 'shop') {
    renderWorld();
    renderPlayer();
    if (gameScene === 'shop') {
      renderShop();
    }
  } else if (gameScene === 'gameover') {
    renderGameOver();
  }
}

function renderMenu() {
  // Background
  drawRect(vec2(0, 0), vec2(100, 100), rgb(0.1, 0.02, 0.02));

  // Title
  drawText('MOTHERLOAD', vec2(0, 8), 2, rgb(1, 0.4, 0));
  drawText('Mars Mining', vec2(0, 5), 1, rgb(0.8, 0.3, 0));

  // Instructions
  drawText('Arrows/WASD: Move', vec2(0, 0), 0.5, rgb(1, 0.8, 0));
  drawText('E: Interact', vec2(0, -2), 0.5, rgb(1, 0.8, 0));

  // Start
  drawText('Press SPACE', vec2(0, -8), 0.8, rgb(0, 1, 0));
}

function renderWorld() {
  const camX = cameraPos.x;
  const camY = cameraPos.y;
  const viewRange = 25;

  // Background
  drawRect(vec2(camX, camY), vec2(100, 100), rgb(0.1, 0.02, 0.02));

  const startX = Math.max(0, Math.floor(camX - viewRange));
  const endX = Math.min(WORLD_WIDTH, Math.ceil(camX + viewRange));
  const startY = Math.max(0, Math.floor(camY - viewRange));
  const endY = Math.min(WORLD_HEIGHT, Math.ceil(camY + viewRange));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = getTile(x, y);
      if (tile === undefined || tile === TileType.EMPTY) continue;

      const color = TILE_COLORS[tile];
      if (color) {
        drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), color);
      }
    }
  }

  // Building labels
  if (camY < 15) {
    drawText('FUEL', vec2(5, -1), 0.3, rgb(1, 1, 1));
    drawText('SELL', vec2(15, -1), 0.3, rgb(1, 1, 1));
    drawText('SHOP', vec2(25, -1), 0.3, rgb(1, 1, 1));
    drawText('FIX', vec2(35, -1), 0.3, rgb(1, 1, 1));
  }
}

function renderPlayer() {
  // Pod
  drawRect(vec2(player.x + 0.5, player.y + 0.5), vec2(0.8, 1), rgb(1, 0.8, 0));
  // Cockpit
  drawRect(vec2(player.x + 0.5, player.y + 0.3), vec2(0.5, 0.3), rgb(0, 0.7, 1));
  // Drill
  drawRect(vec2(player.x + 0.5, player.y + 0.9), vec2(0.4, 0.3), rgb(0.5, 0.5, 0.5));

  if (isDrilling) {
    drawRect(vec2(player.x + 0.5, player.y + 1.1), vec2(0.3, 0.2), rgb(1, 0.6, 0));
  }
}

function renderShop() {
  const camX = cameraPos.x;
  const camY = cameraPos.y;

  drawRect(vec2(camX, camY), vec2(20, 15), rgb(0, 0, 0, 0.9));
  drawText('SHOP', vec2(camX, camY + 5), 1, rgb(1, 0.8, 0));
  drawText(`Cash: $${playerStats.cash}`, vec2(camX, camY + 3), 0.5, rgb(0, 1, 0));
  drawText('[1] Drill +8 ($750)', vec2(camX, camY + 1), 0.4, rgb(1, 1, 1));
  drawText('[2] Hull +7 ($750)', vec2(camX, camY - 1), 0.4, rgb(1, 1, 1));
  drawText('ESC/E to exit', vec2(camX, camY - 5), 0.4, rgb(1, 0.5, 0));
}

function renderGameOver() {
  drawRect(vec2(0, 0), vec2(100, 100), rgb(0, 0, 0, 0.9));
  drawText('GAME OVER', vec2(0, 5), 2, rgb(1, 0, 0));
  drawText(`Score: ${playerStats.score}`, vec2(0, 0), 0.8, rgb(1, 1, 1));
  drawText('SPACE to restart', vec2(0, -5), 0.6, rgb(0, 1, 0));
}

// Post render for HUD
function gameRenderPost() {
  if (gameScene !== 'game' && gameScene !== 'shop') return;

  const camX = cameraPos.x;
  const camY = cameraPos.y - 15;

  // HUD background
  drawRect(vec2(camX - 12, camY), vec2(8, 6), rgb(0, 0, 0, 0.7));

  // Stats
  drawText(`Depth: ${Math.round(player.y * TILE_SIZE)}ft`, vec2(camX - 12, camY + 2), 0.35, rgb(1, 0.8, 0));
  drawText(`Cash: $${playerStats.cash}`, vec2(camX - 12, camY + 1), 0.35, rgb(0, 1, 0));
  drawText(`Fuel: ${Math.round(playerStats.fuel)}/${playerStats.maxFuel}`, vec2(camX - 12, camY), 0.35,
    playerStats.fuel < 2 ? rgb(1, 0, 0) : rgb(0, 1, 0));
  drawText(`Hull: ${playerStats.hull}/${playerStats.maxHull}`, vec2(camX - 12, camY - 1), 0.35, rgb(1, 0.5, 0));
  drawText(`Cargo: ${cargoWeight}/${playerStats.cargoCapacity}`, vec2(camX - 12, camY - 2), 0.35, rgb(0.8, 0.8, 0.8));

  // Hints
  if (player.y < 1) {
    const tileX = Math.floor(player.x);
    let hint = '';
    if (tileX >= 2 && tileX <= 8) hint = 'E: Buy Fuel';
    else if (tileX >= 12 && tileX <= 18) hint = 'E: Sell Minerals';
    else if (tileX >= 22 && tileX <= 28) hint = 'E: Shop';
    else if (tileX >= 32 && tileX <= 38) hint = 'E: Repair';
    if (hint) {
      drawText(hint, vec2(camX, camY + 18), 0.4, rgb(1, 1, 0));
    }
  }
}

function gameUpdatePost() {}

// Register callback for testing helper
window._startGameCallback = () => {
  gameScene = 'game';
  window.gameState.scene = 'game';
};

// Start
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, []);
