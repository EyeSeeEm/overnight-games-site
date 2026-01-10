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
    GAS_POCKET: 5,
    ANCIENT_ARTIFACT: 6,
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

// Combo system
let miningCombo = 0;
let comboTimer = null;
const COMBO_DURATION = 2.0;
const MAX_COMBO_MULTIPLIER = 2.5;

// Floating texts and particles
let floatingTexts = [];
let particles = [];
let screenShake = 0;

// Achievements
const achievements = {
    depth100: false,
    depth500: false,
    depth1000: false,
    depth2000: false,
    depth3000: false,
    firstDiamond: false,
    firstRuby: false,
    richMiner: false,
    firstArtifact: false,
    gasExplorer: false
};

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
                } else if (y >= 40 && y <= 125 && roll < 0.008) {
                    // Gas pockets appear at depths 40-125
                    row.push(TILE.GAS_POCKET);
                } else if (y >= 75 && roll < 0.002) {
                    // Ancient artifacts at depth 75+
                    row.push(TILE.ANCIENT_ARTIFACT);
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

    // Reset new systems
    miningCombo = 0;
    comboTimer = null;
    floatingTexts = [];
    particles = [];
    screenShake = 0;

    // Reset achievements
    achievements.depth100 = false;
    achievements.depth500 = false;
    achievements.depth1000 = false;
    achievements.depth2000 = false;
    achievements.depth3000 = false;
    achievements.firstDiamond = false;
    achievements.firstRuby = false;
    achievements.richMiner = false;
    achievements.firstArtifact = false;
    achievements.gasExplorer = false;

    generateWorld();
}

// Floating text helper
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.5,
        maxLife: 1.5
    });
}

// Particle helper
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: rand(-3, 3),
            vy: rand(-5, 0),
            color: color,
            life: rand(0.5, 1.0)
        });
    }
}

// Gas explosion
function gasExplosion(x, y) {
    // Clear 2x2 area
    for (let dy = 0; dy < 2; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = Math.floor(x) + dx;
            const ty = Math.floor(y) + dy;
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                const tile = world[ty][tx];
                if (tile !== TILE.BUILDING) {
                    world[ty][tx] = TILE.EMPTY;
                }
            }
        }
    }

    // Damage player
    hull -= 15;
    screenShake = 15;
    spawnFloatingText(x, y, 'GAS EXPLOSION!', new Color(0.5, 1, 0.5));
    spawnParticles(x, y, 15, new Color(0.5, 1, 0.3));
    spawnParticles(x, y, 10, new Color(1, 1, 0.3));

    if (!achievements.gasExplorer) {
        achievements.gasExplorer = true;
        spawnFloatingText(x, y - 1, 'Achievement: Gas Explorer!', new Color(1, 0.84, 0));
        cash += 500;
    }
}

// Check depth achievements
function checkDepthAchievements(depth) {
    if (depth >= 100 && !achievements.depth100) {
        achievements.depth100 = true;
        cash += 200;
        spawnFloatingText(playerPos.x, playerPos.y - 1, '100ft! +$200', new Color(1, 0.84, 0));
    }
    if (depth >= 500 && !achievements.depth500) {
        achievements.depth500 = true;
        cash += 1000;
        spawnFloatingText(playerPos.x, playerPos.y - 1, '500ft! +$1000', new Color(1, 0.84, 0));
    }
    if (depth >= 1000 && !achievements.depth1000) {
        achievements.depth1000 = true;
        cash += 5000;
        spawnFloatingText(playerPos.x, playerPos.y - 1, '1000ft! +$5000', new Color(1, 0.84, 0));
    }
    if (depth >= 2000 && !achievements.depth2000) {
        achievements.depth2000 = true;
        cash += 15000;
        spawnFloatingText(playerPos.x, playerPos.y - 1, '2000ft! +$15000', new Color(1, 0.84, 0));
    }
    if (depth >= 3000 && !achievements.depth3000) {
        achievements.depth3000 = true;
        cash += 50000;
        spawnFloatingText(playerPos.x, playerPos.y - 1, '3000ft! +$50000', new Color(1, 0.84, 0));
    }
}

// Get combo multiplier
function getComboMultiplier() {
    if (miningCombo <= 0) return 1;
    return Math.min(1 + (miningCombo * 0.15), MAX_COMBO_MULTIPLIER);
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

    // Update combo timer
    if (comboTimer && comboTimer.elapsed()) {
        miningCombo = 0;
        comboTimer = null;
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= timeDelta;
        ft.y -= 1.5 * timeDelta;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= timeDelta;
        p.x += p.vx * timeDelta;
        p.y += p.vy * timeDelta;
        p.vy += 10 * timeDelta; // Gravity
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake -= 30 * timeDelta;
        if (screenShake < 0) screenShake = 0;
    }

    // Rich miner achievement
    if (cash >= 100000 && !achievements.richMiner) {
        achievements.richMiner = true;
        spawnFloatingText(playerPos.x, playerPos.y - 1, 'Rich Miner! +$25000', new Color(1, 0.84, 0));
        cash += 25000;
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
                const damage = Math.floor((playerVel.y - 10) / 2);
                hull -= damage;
                screenShake = Math.min(damage, 10);
                spawnFloatingText(playerPos.x, playerPos.y, 'FALL! -' + damage, new Color(1, 0.5, 0));
                spawnParticles(playerPos.x, playerPos.y + 0.5, 8, COLORS.dirt);
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
        const x = drillTarget.x;
        const y = drillTarget.y;

        // Handle gas pocket
        if (tile === TILE.GAS_POCKET) {
            gasExplosion(x, y);
            drilling = false;
            return;
        }

        // Handle ancient artifact
        if (tile === TILE.ANCIENT_ARTIFACT) {
            cash += 25000;
            score += 50000;
            screenShake = 10;
            spawnFloatingText(x, y, 'ANCIENT ARTIFACT! +$25000', new Color(1, 0.84, 0));
            spawnParticles(x, y, 20, new Color(1, 0.84, 0));
            if (!achievements.firstArtifact) {
                achievements.firstArtifact = true;
                cash += 10000;
                spawnFloatingText(x, y - 1, 'First Artifact! +$10000', new Color(1, 0.84, 0));
            }
        }

        // Collect mineral
        if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
            const mineral = MINERALS[tile];
            if (getCargoWeight() + mineral.weight <= cargoCapacity) {
                // Apply combo multiplier
                const multiplier = getComboMultiplier();
                const value = Math.floor(mineral.value * multiplier);

                cargo.push({
                    type: tile,
                    name: mineral.name,
                    value: value,
                    weight: mineral.weight
                });
                score += value;

                // Floating text for mineral
                const comboText = multiplier > 1 ? ' x' + multiplier.toFixed(1) : '';
                spawnFloatingText(x, y, mineral.name + comboText, mineral.color);
                spawnParticles(x, y, 5, mineral.color);

                // Combo increment
                miningCombo++;
                comboTimer = new Timer(COMBO_DURATION);

                // Check for special mineral achievements
                if (tile === TILE.DIAMOND && !achievements.firstDiamond) {
                    achievements.firstDiamond = true;
                    cash += 20000;
                    spawnFloatingText(x, y - 1, 'First Diamond! +$20000', new Color(1, 0.84, 0));
                }
                if (tile === TILE.RUBY && !achievements.firstRuby) {
                    achievements.firstRuby = true;
                    cash += 10000;
                    spawnFloatingText(x, y - 1, 'First Ruby! +$10000', new Color(1, 0.84, 0));
                }
            } else {
                // Cargo full notification
                spawnFloatingText(x, y, 'CARGO FULL!', new Color(1, 0.3, 0.3));
            }
        }

        // Lava damage
        if (tile === TILE.LAVA) {
            hull -= 58;
            screenShake = 8;
            spawnFloatingText(x, y, 'LAVA! -58 HULL', new Color(1, 0.27, 0));
        }

        // Spawn dirt particles for any successful drill
        if (tile === TILE.DIRT || tile === TILE.ROCK) {
            spawnParticles(x, y, 3, COLORS.dirt);
        }

        // Clear tile and move
        setTile(drillTarget.x, drillTarget.y, TILE.EMPTY);
        playerPos.y += 1;
        drilling = false;

        // Check depth achievements
        const depth = Math.max(0, Math.floor((playerPos.y - 4) * 13));
        checkDepthAchievements(depth);
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
// Helper: convert world pos to screen pos
// In our world: Y increases downward (depth), playerPos.y=2 is near surface
// Camera follows player with cameraPos.y = -playerPos.y (inverted for LittleJS)
function worldToScreenPos(worldX, worldY) {
    const scale = cameraScale;
    const screenX = mainCanvasSize.x / 2 + (worldX - cameraPos.x) * scale;
    // worldY is depth (increases downward), camera.y is negative player.y
    // screenY should increase downward
    const screenY = mainCanvasSize.y / 2 + (worldY + cameraPos.y) * scale;
    return { x: screenX, y: screenY };
}

// Helper: draw rect using mainContext
function drawRectCtx(worldX, worldY, width, height, color) {
    const pos = worldToScreenPos(worldX, worldY);
    const w = width * cameraScale;
    const h = height * cameraScale;
    mainContext.fillStyle = `rgba(${Math.floor(color.r*255)},${Math.floor(color.g*255)},${Math.floor(color.b*255)},${color.a !== undefined ? color.a : 1})`;
    mainContext.fillRect(pos.x - w/2, pos.y - h/2, w, h);
}

function renderWorld() {
    if (!mainContext || !playerPos) return;

    // Apply screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = rand(-screenShake, screenShake);
        shakeY = rand(-screenShake, screenShake);
    }

    mainContext.save();
    mainContext.translate(shakeX, shakeY);

    // Draw world tiles
    const visibleRange = 20;
    const startY = Math.max(0, Math.floor(playerPos.y - visibleRange));
    const endY = Math.min(WORLD_HEIGHT, Math.floor(playerPos.y + visibleRange));

    for (let y = startY; y < endY; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const tile = world[y][x];
            drawTileCtx(tile, x, y);
        }
    }

    // Draw buildings
    for (const b of buildings) {
        drawRectCtx(b.x + 2, 2, 4, 2, b.color);
        drawRectCtx(b.x + 2, 1, 4.5, 0.5, new Color(0.15, 0.15, 0.15));
    }

    // Draw player
    const px = playerPos.x;
    const py = playerPos.y;
    drawRectCtx(px, py, 1.2, 1.4, COLORS.pod);
    drawRectCtx(px, py - 0.2, 0.8, 0.5, COLORS.podCockpit);
    drawRectCtx(px, py + 0.8, 0.6, 0.4, new Color(0.5, 0.5, 0.5)); // Drill

    // Thrust flame
    if (keyIsDown('ArrowUp') && fuel > 0) {
        drawRectCtx(px, py - 0.9, 0.4, 0.5, new Color(1, 0.5, 0));
    }

    // Drill sparks
    if (drilling) {
        drawRectCtx(px + rand(-0.3, 0.3), py + 1.2, 0.2, 0.2, new Color(1, 0.6, 0));
    }

    // Draw particles
    for (const p of particles) {
        const alpha = p.life / 1.0;
        const c = new Color(p.color.r, p.color.g, p.color.b, alpha);
        drawRectCtx(p.x, p.y, 0.2, 0.2, c);
    }

    mainContext.restore();
}

function drawTileCtx(tile, x, y) {
    const worldX = x + 0.5;
    const worldY = y + 0.5;

    if (tile === TILE.EMPTY) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.empty);
        return;
    }
    if (tile === TILE.DIRT) {
        const color = (x + y) % 2 === 0 ? COLORS.dirt : COLORS.dirtDark;
        drawRectCtx(worldX, worldY, 1, 1, color);
        return;
    }
    if (tile === TILE.ROCK) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.rock);
        return;
    }
    if (tile === TILE.BUILDING) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.building);
        return;
    }
    if (tile === TILE.LAVA) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.lava);
        return;
    }
    if (tile === TILE.GAS_POCKET) {
        drawRectCtx(worldX, worldY, 1, 1, new Color(0.2, 0.4, 0.2));
        return;
    }
    if (tile === TILE.ANCIENT_ARTIFACT) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.dirt);
        drawRectCtx(worldX, worldY, 0.5, 0.5, new Color(1, 0.84, 0));
        return;
    }
    // Minerals
    if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
        drawRectCtx(worldX, worldY, 1, 1, COLORS.dirt);
        const mineral = MINERALS[tile];
        if (mineral) {
            drawRectCtx(worldX, worldY, 0.6, 0.6, mineral.color);
        }
    }
}

function gameRender() {
    // Note: gameRender may not be called in headless mode
    // All rendering has been moved to gameRenderPost via renderWorld()
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
    // All world rendering moved here since gameRender isn't called in headless
    if (gameState !== 'title' && gameState !== 'gameover') {
        renderWorld();
    }

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

    // Combo display
    if (miningCombo > 0) {
        const multiplier = getComboMultiplier();
        drawTextScreen('COMBO x' + multiplier.toFixed(1), vec2(mainCanvasSize.x / 2, 65), 16, new Color(1, 0.5, 0), 0, undefined, 'center');
    }

    // Floating texts
    for (const ft of floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        const screenPos = worldToScreen(vec2(ft.x, -ft.y));
        const c = new Color(ft.color.r, ft.color.g, ft.color.b, alpha);
        drawTextScreen(ft.text, screenPos, 14, c, 0, undefined, 'center');
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
    // Camera follows player
    if (playerPos) {
        cameraPos = vec2(WORLD_WIDTH / 2, -playerPos.y);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

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
