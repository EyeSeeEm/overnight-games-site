// Motherload Clone - LittleJS
// Mars Mining Game

'use strict';

// Game constants
const TILE_SIZE = 1;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200;

// Tile types
const TILE = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    BUILDING: 3,
    LAVA: 4,
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

// Mineral data
const MINERALS = {
    [TILE.IRONIUM]: { name: 'Ironium', value: 30, weight: 10, color: new Color(0.55, 0.27, 0.07), minDepth: 2 },
    [TILE.BRONZIUM]: { name: 'Bronzium', value: 60, weight: 10, color: new Color(0.8, 0.5, 0.2), minDepth: 2 },
    [TILE.SILVERIUM]: { name: 'Silverium', value: 100, weight: 10, color: new Color(0.75, 0.75, 0.75), minDepth: 2 },
    [TILE.GOLDIUM]: { name: 'Goldium', value: 250, weight: 20, color: new Color(1, 0.84, 0), minDepth: 8 },
    [TILE.PLATINUM]: { name: 'Platinum', value: 750, weight: 30, color: new Color(0.9, 0.89, 0.88), minDepth: 30 },
    [TILE.EINSTEINIUM]: { name: 'Einsteinium', value: 2000, weight: 40, color: new Color(0, 1, 0), minDepth: 60 },
    [TILE.EMERALD]: { name: 'Emerald', value: 5000, weight: 60, color: new Color(0.31, 0.78, 0.47), minDepth: 90 },
    [TILE.RUBY]: { name: 'Ruby', value: 20000, weight: 80, color: new Color(0.88, 0.07, 0.37), minDepth: 150 },
    [TILE.DIAMOND]: { name: 'Diamond', value: 100000, weight: 100, color: new Color(0.73, 0.95, 1), minDepth: 180 },
    [TILE.AMAZONITE]: { name: 'Amazonite', value: 500000, weight: 120, color: new Color(0, 0.77, 0.69), minDepth: 200 }
};

// Colors
const COLORS = {
    sky: new Color(1, 0.42, 0.2),
    dirt: new Color(0.55, 0.41, 0.08),
    dirtDark: new Color(0.36, 0.29, 0.04),
    rock: new Color(0.33, 0.33, 0.33),
    empty: new Color(0.1, 0.04, 0.04),
    building: new Color(0.27, 0.27, 0.27),
    lava: new Color(1, 0.27, 0),
    pod: new Color(0.24, 0.7, 0.44),
    podCockpit: new Color(0.25, 0.41, 0.88)
};

// Game state
let gameState = 'title';
let score = 0;
let cash = 500;
let world = [];

// Player state
let playerPos, playerVel;
let hull = 10, maxHull = 10;
let fuel = 10, maxFuel = 10;
let cargoCapacity = 70;
let drillSpeed = 20;
let enginePower = 150;
let cargo = [];
let drilling = false;
let drillTimer = null;
let drillTarget = null;
let grounded = false;

// Upgrades
let upgrades = { drill: 0, hull: 0, engine: 0, fuel: 0, cargo: 0, radiator: 0 };
const UPGRADE_PRICES = [750, 2000, 5000, 20000, 100000, 500000];
const DRILL_SPEEDS = [20, 28, 40, 50, 70, 95, 120];
const HULL_HP = [10, 17, 30, 50, 80, 120, 180];
const ENGINE_POWER = [150, 160, 170, 180, 190, 200, 210];
const FUEL_CAPACITY = [10, 15, 25, 40, 60, 100, 150];
const CARGO_CAPACITY = [70, 150, 250, 400, 700, 1200];

// Buildings
const buildings = [
    { x: 2, name: 'Fuel', color: new Color(1, 0.55, 0) },
    { x: 10, name: 'Sell', color: new Color(0.25, 0.41, 0.88) },
    { x: 20, name: 'Shop', color: new Color(0.2, 0.8, 0.2) },
    { x: 30, name: 'Repair', color: new Color(0.86, 0.08, 0.24) }
];

// Generate world
function generateWorld() {
    world = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (y < 4) {
                row.push(TILE.EMPTY);
            } else if (y === 4) {
                const isBuilding = buildings.some(b => x >= b.x && x < b.x + 4);
                row.push(isBuilding ? TILE.BUILDING : TILE.DIRT);
            } else {
                const roll = Math.random();
                if (y > 150 && roll < 0.03) {
                    row.push(TILE.LAVA);
                } else if (roll < getMineralChance(y)) {
                    row.push(rollMineral(y));
                } else if (roll < 0.3) {
                    row.push(TILE.ROCK);
                } else {
                    row.push(TILE.DIRT);
                }
            }
        }
        world.push(row);
    }
}

function getMineralChance(depth) {
    if (depth < 2) return 0;
    return 0.15 + Math.min(depth / 500, 0.2);
}

function rollMineral(depth) {
    const minerals = Object.entries(MINERALS).filter(([id, m]) => depth >= m.minDepth);
    if (minerals.length === 0) return TILE.DIRT;

    const weights = minerals.map(([id, m]) => Math.max(0.1, 1 - (depth - m.minDepth) / 100));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    for (let i = 0; i < minerals.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return parseInt(minerals[i][0]);
    }
    return parseInt(minerals[minerals.length - 1][0]);
}

function getTile(x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) {
        return ty < 0 ? TILE.EMPTY : TILE.ROCK;
    }
    return world[ty][tx];
}

function setTile(x, y, tile) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
        world[ty][tx] = tile;
    }
}

function isSolid(tile) {
    return tile !== TILE.EMPTY && tile !== TILE.LAVA;
}

function getCargoWeight() {
    return cargo.reduce((sum, item) => sum + item.weight, 0);
}

function applyUpgrades() {
    drillSpeed = DRILL_SPEEDS[upgrades.drill];
    maxHull = HULL_HP[upgrades.hull];
    hull = Math.min(hull, maxHull);
    enginePower = ENGINE_POWER[upgrades.engine];
    maxFuel = FUEL_CAPACITY[upgrades.fuel];
    fuel = Math.min(fuel, maxFuel);
    cargoCapacity = CARGO_CAPACITY[Math.min(upgrades.cargo, CARGO_CAPACITY.length - 1)];
}

function resetGame() {
    playerPos = vec2(WORLD_WIDTH / 2, 2);
    playerVel = vec2(0, 0);
    hull = 10;
    maxHull = 10;
    fuel = 10;
    maxFuel = 10;
    cargoCapacity = 70;
    drillSpeed = 20;
    enginePower = 150;
    cargo = [];
    drilling = false;
    drillTimer = null;
    drillTarget = null;
    cash = 500;
    score = 0;
    upgrades = { drill: 0, hull: 0, engine: 0, fuel: 0, cargo: 0, radiator: 0 };
    generateWorld();
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 20;
    resetGame();
    gameState = 'title';
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
    if (gameState === 'title') {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            gameState = 'playing';
            resetGame();
        }
        return;
    }

    if (gameState === 'gameover') {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            gameState = 'playing';
            resetGame();
        }
        return;
    }

    if (drilling) {
        updateDrilling();
        return;
    }

    // Fuel consumption for thrust
    if (fuel > 0 && keyIsDown('ArrowUp')) {
        fuel -= 0.5 * timeDelta;
    }

    // Horizontal movement
    let moveX = 0;
    if (keyIsDown('ArrowLeft') && fuel > 0) moveX = -1;
    if (keyIsDown('ArrowRight') && fuel > 0) moveX = 1;
    playerVel.x = moveX * 7;

    // Vertical thrust
    if (keyIsDown('ArrowUp') && fuel > 0) {
        const thrustForce = (enginePower / 150) * 12 * (1 - getCargoWeight() / 1000);
        playerVel.y -= thrustForce * timeDelta;
    }

    // Gravity
    playerVel.y += 15 * timeDelta;

    // Apply velocity
    const newX = playerPos.x + playerVel.x * timeDelta;
    const newY = playerPos.y + playerVel.y * timeDelta;

    // Collision - horizontal
    let canMoveX = true;
    for (let y = playerPos.y - 0.5; y <= playerPos.y + 0.5; y += 0.5) {
        if (moveX < 0 && isSolid(getTile(newX - 0.6, y))) canMoveX = false;
        if (moveX > 0 && isSolid(getTile(newX + 0.6, y))) canMoveX = false;
    }
    if (canMoveX) playerPos.x = newX;

    // Collision - vertical
    grounded = false;
    let canMoveY = true;
    for (let x = playerPos.x - 0.5; x <= playerPos.x + 0.5; x += 0.5) {
        if (playerVel.y < 0 && isSolid(getTile(x, newY - 0.7))) {
            canMoveY = false;
            playerVel.y = 0;
        }
        if (playerVel.y > 0 && isSolid(getTile(x, newY + 0.7))) {
            canMoveY = false;
            grounded = true;
            // Fall damage
            if (playerVel.y > 10) {
                hull -= Math.floor((playerVel.y - 10) / 2);
            }
            playerVel.y = 0;
        }
    }
    if (canMoveY) playerPos.y = newY;

    // Drilling
    if (grounded && fuel > 0 && keyIsDown('ArrowDown')) {
        const drillX = playerPos.x;
        const drillY = playerPos.y + 1;
        const tile = getTile(drillX, drillY);
        if (tile !== TILE.EMPTY && tile !== TILE.BUILDING) {
            startDrill(drillX, drillY);
        }
    }

    // World bounds
    playerPos.x = clamp(playerPos.x, 1, WORLD_WIDTH - 1);
    playerPos.y = Math.max(1, playerPos.y);

    // Lava damage
    const centerTile = getTile(playerPos.x, playerPos.y);
    if (centerTile === TILE.LAVA) {
        hull -= 30 * timeDelta;
    }

    // Building interactions
    if (playerPos.y < 5 && grounded) {
        checkBuildingInteraction();
    }

    // Game over
    if (hull <= 0) {
        gameState = 'gameover';
    }

    // Camera follow - keep player in view (invert Y)
    cameraPos = vec2(WORLD_WIDTH / 2, -playerPos.y);
}

function startDrill(x, y) {
    drilling = true;
    drillTarget = vec2(Math.floor(x), Math.floor(y));
    const tile = getTile(x, y);
    const baseTime = tile === TILE.ROCK ? 1.5 : 1.0;
    drillTimer = new Timer(baseTime / (drillSpeed / 20));
}

function updateDrilling() {
    fuel -= 0.3 * timeDelta;

    if (drillTimer.elapsed()) {
        const tile = getTile(drillTarget.x, drillTarget.y);

        // Collect mineral
        if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
            const mineral = MINERALS[tile];
            if (getCargoWeight() + mineral.weight <= cargoCapacity) {
                cargo.push({
                    type: tile,
                    name: mineral.name,
                    value: mineral.value,
                    weight: mineral.weight
                });
                score += mineral.value;
            }
        }

        // Lava damage
        if (tile === TILE.LAVA) {
            hull -= 58;
        }

        // Clear tile and move
        setTile(drillTarget.x, drillTarget.y, TILE.EMPTY);
        playerPos.y += 1;
        drilling = false;
    }
}

function checkBuildingInteraction() {
    const playerTileX = Math.floor(playerPos.x);

    for (const b of buildings) {
        if (playerTileX >= b.x && playerTileX < b.x + 4) {
            if (b.name === 'Fuel') {
                const needed = maxFuel - fuel;
                const cost = Math.ceil(needed * 2);
                if (cash >= cost && needed > 0.1) {
                    cash -= cost;
                    fuel = maxFuel;
                }
            } else if (b.name === 'Sell') {
                for (const item of cargo) {
                    cash += item.value;
                }
                cargo = [];
            } else if (b.name === 'Repair') {
                const needed = maxHull - hull;
                const cost = Math.ceil(needed * 15);
                if (cash >= cost && needed > 0.1) {
                    cash -= cost;
                    hull = maxHull;
                }
            } else if (b.name === 'Shop') {
                tryUpgrade();
            }
            return;
        }
    }
}

function tryUpgrade() {
    const categories = ['drill', 'hull', 'engine', 'fuel', 'cargo', 'radiator'];
    for (const cat of categories) {
        const tier = upgrades[cat];
        const maxTier = cat === 'cargo' || cat === 'radiator' ? 5 : 6;
        if (tier < maxTier) {
            const price = UPGRADE_PRICES[tier];
            if (cash >= price) {
                cash -= price;
                upgrades[cat]++;
                applyUpgrades();
                return;
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
    if (gameState === 'title') return;

    // Draw world tiles - calculate visible range based on camera
    const visibleRange = 20; // Tiles visible in each direction
    const startY = Math.max(0, Math.floor(playerPos.y - visibleRange));
    const endY = Math.min(WORLD_HEIGHT, Math.floor(playerPos.y + visibleRange));

    for (let y = startY; y < endY; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const tile = world[y][x];
            drawTile(tile, x, y);
        }
    }

    // Draw buildings (invert Y)
    for (const b of buildings) {
        drawRect(vec2(b.x + 2, -2), vec2(4, 2), b.color);
        // Roof
        drawRect(vec2(b.x + 2, -1), vec2(4.5, 0.5), new Color(0.15, 0.15, 0.15));
    }

    // Draw player (invert Y)
    const playerDrawPos = vec2(playerPos.x, -playerPos.y);
    drawRect(playerDrawPos, vec2(1.2, 1.4), COLORS.pod);
    drawRect(playerDrawPos.add(vec2(0, 0.2)), vec2(0.8, 0.5), COLORS.podCockpit);
    // Drill
    drawRect(playerDrawPos.add(vec2(0, -0.8)), vec2(0.6, 0.4), new Color(0.5, 0.5, 0.5));

    // Thrust flame
    if (keyIsDown('ArrowUp') && fuel > 0) {
        drawRect(playerDrawPos.add(vec2(0, 0.9)), vec2(0.4, 0.5), new Color(1, 0.5, 0));
    }

    // Drill sparks
    if (drilling) {
        drawRect(playerDrawPos.add(vec2(rand(-0.3, 0.3), -1.2)), vec2(0.2, 0.2), new Color(1, 0.6, 0));
    }
}

function drawTile(tile, x, y) {
    // Invert Y for LittleJS coordinate system (Y increases upward)
    const pos = vec2(x + 0.5, -y - 0.5);

    if (tile === TILE.EMPTY) {
        drawRect(pos, vec2(1, 1), COLORS.empty);
        return;
    }

    if (tile === TILE.DIRT) {
        const color = (x + y) % 2 === 0 ? COLORS.dirt : COLORS.dirtDark;
        drawRect(pos, vec2(1, 1), color);
        return;
    }

    if (tile === TILE.ROCK) {
        drawRect(pos, vec2(1, 1), COLORS.rock);
        return;
    }

    if (tile === TILE.BUILDING) {
        drawRect(pos, vec2(1, 1), COLORS.building);
        return;
    }

    if (tile === TILE.LAVA) {
        drawRect(pos, vec2(1, 1), COLORS.lava);
        return;
    }

    // Minerals - dirt with colored chunk
    if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
        drawRect(pos, vec2(1, 1), COLORS.dirt);
        const mineral = MINERALS[tile];
        drawRect(pos, vec2(0.6, 0.6), mineral.color);
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
    if (gameState === 'title') {
        // Title screen
        drawTextScreen('MOTHERLOAD', vec2(mainCanvasSize.x / 2, 150), 56, new Color(1, 0.84, 0), 0, undefined, 'center');
        drawTextScreen('Mars Mining', vec2(mainCanvasSize.x / 2, 200), 24, new Color(1, 0.42, 0.2), 0, undefined, 'center');
        drawTextScreen('Press SPACE to Start', vec2(mainCanvasSize.x / 2, 350), 20, new Color(1, 1, 1), 0, undefined, 'center');
        drawTextScreen('Arrow Keys: Move & Drill', vec2(mainCanvasSize.x / 2, 450), 14, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
        return;
    }

    if (gameState === 'gameover') {
        drawTextScreen('GAME OVER', vec2(mainCanvasSize.x / 2, 200), 48, new Color(1, 0, 0), 0, undefined, 'center');
        drawTextScreen('Score: ' + score.toLocaleString(), vec2(mainCanvasSize.x / 2, 280), 24, new Color(1, 1, 1), 0, undefined, 'center');
        drawTextScreen('Cash: $' + cash.toLocaleString(), vec2(mainCanvasSize.x / 2, 320), 24, new Color(1, 1, 1), 0, undefined, 'center');
        drawTextScreen('Press SPACE to Restart', vec2(mainCanvasSize.x / 2, 420), 18, new Color(1, 1, 1), 0, undefined, 'center');
        return;
    }

    // HUD
    const depth = Math.max(0, Math.floor((playerPos.y - 4) * 13));

    // Top bar
    drawRect(screenToWorld(vec2(mainCanvasSize.x / 2, 25)), vec2(mainCanvasSize.x / cameraScale, 2.5), new Color(0, 0, 0, 0.8));

    drawTextScreen('$' + cash.toLocaleString(), vec2(mainCanvasSize.x / 2, 25), 20, new Color(1, 0.84, 0), 0, undefined, 'center');
    drawTextScreen('DEPTH: ' + depth + ' ft', vec2(20, 20), 14, new Color(1, 1, 1), 0, undefined, 'left');
    drawTextScreen('SCORE: ' + score.toLocaleString(), vec2(20, 38), 14, new Color(1, 1, 1), 0, undefined, 'left');
    drawTextScreen('CARGO: ' + getCargoWeight() + '/' + cargoCapacity + ' kg', vec2(mainCanvasSize.x - 20, 20), 14, new Color(1, 0.42, 0.2), 0, undefined, 'right');

    // Bottom bar
    drawRect(screenToWorld(vec2(mainCanvasSize.x / 2, mainCanvasSize.y - 25)), vec2(mainCanvasSize.x / cameraScale, 2.5), new Color(0, 0, 0, 0.8));

    // Fuel bar
    const fuelRatio = fuel / maxFuel;
    drawTextScreen('FUEL: ' + fuel.toFixed(1) + '/' + maxFuel, vec2(100, mainCanvasSize.y - 25), 12, fuelRatio < 0.2 ? new Color(1, 0, 0) : new Color(1, 0.84, 0), 0, undefined, 'center');

    // Hull bar
    const hullRatio = hull / maxHull;
    drawTextScreen('HULL: ' + Math.ceil(hull) + '/' + maxHull, vec2(280, mainCanvasSize.y - 25), 12, hullRatio < 0.25 ? new Color(1, 0, 0) : new Color(1, 0.27, 0.27), 0, undefined, 'center');

    // Items
    drawTextScreen('Items: ' + cargo.length, vec2(mainCanvasSize.x - 100, mainCanvasSize.y - 25), 12, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, () => {}, gameRender, gameRenderPost);

// Expose for testing
window.gameState = {
    get state() { return gameState; },
    get score() { return score; },
    get cash() { return cash; },
    get depth() { return Math.max(0, Math.floor((playerPos?.y || 0 - 4) * 13)); },
    get fuel() { return fuel; },
    get hull() { return hull; },
    get cargo() { return cargo.length; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        gameState = 'playing';
        resetGame();
    }
};
