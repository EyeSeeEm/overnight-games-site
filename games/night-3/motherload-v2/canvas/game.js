// Motherload Clone - Canvas 2D
// Mining game on Mars

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

// Tile constants
const TILE_SIZE = 20;
const WORLD_WIDTH = 64; // Wider for 1280px
const WORLD_HEIGHT = 300;

// Tile types
const TILE = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    BUILDING: 3,
    LAVA: 4,
    // Minerals (10-19)
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
    [TILE.IRONIUM]: { name: 'Ironium', value: 30, weight: 10, color: '#8B4513', minDepth: 25 },
    [TILE.BRONZIUM]: { name: 'Bronzium', value: 60, weight: 10, color: '#CD7F32', minDepth: 25 },
    [TILE.SILVERIUM]: { name: 'Silverium', value: 100, weight: 10, color: '#C0C0C0', minDepth: 25 },
    [TILE.GOLDIUM]: { name: 'Goldium', value: 250, weight: 20, color: '#FFD700', minDepth: 100 },
    [TILE.PLATINUM]: { name: 'Platinum', value: 750, weight: 30, color: '#E5E4E2', minDepth: 400 },
    [TILE.EINSTEINIUM]: { name: 'Einsteinium', value: 2000, weight: 40, color: '#00FF00', minDepth: 800 },
    [TILE.EMERALD]: { name: 'Emerald', value: 5000, weight: 60, color: '#50C878', minDepth: 1200 },
    [TILE.RUBY]: { name: 'Ruby', value: 20000, weight: 80, color: '#E0115F', minDepth: 2000 },
    [TILE.DIAMOND]: { name: 'Diamond', value: 100000, weight: 100, color: '#B9F2FF', minDepth: 2500 },
    [TILE.AMAZONITE]: { name: 'Amazonite', value: 500000, weight: 120, color: '#00C4B0', minDepth: 3500 }
};

// Additional tile types
TILE.GAS_POCKET = 20;
TILE.ANCIENT_ARTIFACT = 21;

// Colors
const COLORS = {
    sky: '#FF6B35',
    dirt: '#8B6914',
    dirtDark: '#5C4A0A',
    rock: '#555555',
    rockDark: '#333333',
    empty: '#1A0A0A',
    building: '#444444',
    lava: '#FF4500',
    pod: '#3CB371',
    podCockpit: '#4169E1',
    podDrill: '#888888',
    gasPocket: '#88FF88',
    artifact: '#FFD700'
};

// Floating texts
let floatingTexts = [];

// Particles
let particles = [];

// Screen shake
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
    survivalist: false
};

// Combo system
let miningCombo = 0;
let comboTimer = 0;

// Game state
let gameState = 'title'; // title, playing, shop, gameover
let score = 0;
let cash = 500; // Starting cash

// World
let world = [];

// Player
const player = {
    x: WIDTH / 2,
    y: 80, // Start above ground
    vx: 0,
    vy: 0,
    width: 24,
    height: 28,
    // Stats
    hull: 10,
    maxHull: 10,
    fuel: 10,
    maxFuel: 10,
    cargoCapacity: 70, // In kg
    drillSpeed: 20,
    enginePower: 150,
    radiator: 0,
    // Current state
    cargo: [],
    drilling: false,
    drillDir: null,
    drillProgress: 0,
    drillTarget: null,
    grounded: false
};

// Upgrades
const upgrades = {
    drill: 0,
    hull: 0,
    engine: 0,
    fuel: 0,
    cargo: 0,
    radiator: 0
};

const UPGRADE_PRICES = [750, 2000, 5000, 20000, 100000, 500000];
const DRILL_SPEEDS = [20, 28, 40, 50, 70, 95, 120];
const HULL_HP = [10, 17, 30, 50, 80, 120, 180];
const ENGINE_POWER = [150, 160, 170, 180, 190, 200, 210];
const FUEL_CAPACITY = [10, 15, 25, 40, 60, 100, 150];
const CARGO_CAPACITY = [70, 150, 250, 400, 700, 1200];
const RADIATOR_REDUCTION = [0, 0.1, 0.25, 0.4, 0.6, 0.8];

// Helper functions for effects
function spawnFloatingText(x, y, text, color = '#FFF', size = 16) {
    floatingTexts.push({
        x, y,
        text,
        color,
        size,
        vy: -50,
        life: 1.5,
        alpha: 1
    });
}

function spawnParticle(x, y, color, count = 5, speed = 80) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed + speed * 0.3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * vel,
            vy: Math.sin(angle) * vel - 30,
            color,
            size: 3 + Math.random() * 3,
            life: 0.8 + Math.random() * 0.4
        });
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= dt;
        t.alpha = Math.min(1, t.life);
        if (t.life <= 0) floatingTexts.splice(i, 1);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // Gravity
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function checkAchievements() {
    const depth = Math.floor(Math.max(0, player.y - 100) / TILE_SIZE * 13);

    if (!achievements.depth100 && depth >= 100) {
        achievements.depth100 = true;
        spawnFloatingText(player.x, player.y - 50, 'ACHIEVEMENT: 100ft!', '#FFD700', 20);
        cash += 100;
    }
    if (!achievements.depth500 && depth >= 500) {
        achievements.depth500 = true;
        spawnFloatingText(player.x, player.y - 50, 'ACHIEVEMENT: 500ft!', '#FFD700', 20);
        cash += 500;
    }
    if (!achievements.depth1000 && depth >= 1000) {
        achievements.depth1000 = true;
        spawnFloatingText(player.x, player.y - 50, 'ACHIEVEMENT: 1000ft!', '#FFD700', 20);
        cash += 2000;
    }
    if (!achievements.depth2000 && depth >= 2000) {
        achievements.depth2000 = true;
        spawnFloatingText(player.x, player.y - 50, 'ACHIEVEMENT: 2000ft!', '#FFD700', 20);
        cash += 10000;
    }
    if (!achievements.depth3000 && depth >= 3000) {
        achievements.depth3000 = true;
        spawnFloatingText(player.x, player.y - 50, 'DEEP EXPLORER!', '#FFD700', 22);
        cash += 50000;
    }
    if (!achievements.richMiner && cash >= 100000) {
        achievements.richMiner = true;
        spawnFloatingText(player.x, player.y - 50, 'RICH MINER!', '#FFD700', 20);
    }
}

function triggerGasExplosion(worldX, worldY) {
    // Screen shake
    screenShake = 20;

    // Damage player
    player.hull -= 15;
    spawnFloatingText(player.x, player.y - 30, '-15 HULL', '#FF4444', 18);

    // Particles
    spawnParticle(worldX, worldY - cameraY, '#88FF88', 30, 150);
    spawnParticle(worldX, worldY - cameraY, '#FFFF00', 15, 120);

    // Clear nearby tiles (2x2 area)
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = tx + dx;
            const ny = ty + dy;
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                if (world[ny][nx] !== TILE.BUILDING) {
                    world[ny][nx] = TILE.EMPTY;
                }
            }
        }
    }
}

// Camera
let cameraY = 0;

// Input
const keys = {};

// Surface buildings
const buildings = [
    { x: 2, name: 'Fuel', color: '#FF8C00' },
    { x: 10, name: 'Sell', color: '#4169E1' },
    { x: 20, name: 'Shop', color: '#32CD32' },
    { x: 30, name: 'Repair', color: '#DC143C' }
];

// Generate world
function generateWorld() {
    world = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        const row = [];
        const depth = y * TILE_SIZE;

        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (y < 5) {
                // Surface - empty
                row.push(TILE.EMPTY);
            } else if (y === 5) {
                // Buildings at ground level
                const isBuilding = buildings.some(b => x >= b.x && x < b.x + 4);
                row.push(isBuilding ? TILE.BUILDING : TILE.DIRT);
            } else {
                // Underground
                const roll = Math.random();

                // Lava appears deep
                if (depth > 3000 && roll < 0.03) {
                    row.push(TILE.LAVA);
                }
                // Gas pockets (dangerous!)
                else if (depth > 500 && depth < 2500 && roll < 0.008) {
                    row.push(TILE.GAS_POCKET);
                }
                // Ancient artifacts (rare, valuable)
                else if (depth > 1500 && roll < 0.003) {
                    row.push(TILE.ANCIENT_ARTIFACT);
                }
                // Minerals
                else if (roll < getMineralChance(depth)) {
                    row.push(rollMineral(depth));
                }
                // Rock
                else if (roll < 0.3) {
                    row.push(TILE.ROCK);
                }
                // Dirt
                else {
                    row.push(TILE.DIRT);
                }
            }
        }
        world.push(row);
    }
}

function getMineralChance(depth) {
    if (depth < 25) return 0;
    return 0.15 + Math.min(depth / 10000, 0.2);
}

function rollMineral(depth) {
    const minerals = Object.entries(MINERALS).filter(([id, m]) => depth >= m.minDepth);
    if (minerals.length === 0) return TILE.DIRT;

    // Weight by depth - deeper minerals rarer but possible
    const weights = minerals.map(([id, m]) => {
        const distFromMin = depth - m.minDepth;
        return Math.max(0.1, 1 - distFromMin / 2000);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    for (let i = 0; i < minerals.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return parseInt(minerals[i][0]);
    }
    return parseInt(minerals[minerals.length - 1][0]);
}

// Get tile at world position
function getTileAt(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) {
        return ty < 0 ? TILE.EMPTY : TILE.ROCK; // Above = empty, sides/below = rock
    }
    return world[ty][tx];
}

function setTileAt(worldX, worldY, tile) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
        world[ty][tx] = tile;
    }
}

// Get cargo weight
function getCargoWeight() {
    return player.cargo.reduce((sum, item) => sum + item.weight, 0);
}

// Player physics
function updatePlayer(dt) {
    if (player.drilling) {
        updateDrilling(dt);
        return;
    }

    // Fuel consumption
    if (player.fuel > 0 && (keys['arrowup'] || keys['w'])) {
        player.fuel -= 0.5 * dt;
    }

    // Horizontal movement
    let moveX = 0;
    if ((keys['arrowleft'] || keys['a']) && player.fuel > 0) moveX = -1;
    if ((keys['arrowright'] || keys['d']) && player.fuel > 0) moveX = 1;

    player.vx = moveX * 150;

    // Vertical thrust
    if ((keys['arrowup'] || keys['w']) && player.fuel > 0) {
        const thrustForce = player.enginePower * (1 - getCargoWeight() / 1000);
        player.vy -= thrustForce * dt;
    }

    // Gravity
    player.vy += 300 * dt;

    // Apply velocity
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    // Collision detection - horizontal
    const left = newX - player.width / 2;
    const right = newX + player.width / 2;
    const top = player.y - player.height / 2;
    const bottom = player.y + player.height / 2;

    let canMoveX = true;
    for (let y = top; y <= bottom; y += TILE_SIZE / 2) {
        if (moveX < 0 && isSolid(getTileAt(left, y))) canMoveX = false;
        if (moveX > 0 && isSolid(getTileAt(right, y))) canMoveX = false;
    }
    if (canMoveX) player.x = newX;

    // Collision detection - vertical
    const newTop = newY - player.height / 2;
    const newBottom = newY + player.height / 2;

    player.grounded = false;
    let canMoveY = true;

    for (let x = player.x - player.width / 2; x <= player.x + player.width / 2; x += TILE_SIZE / 2) {
        if (player.vy < 0 && isSolid(getTileAt(x, newTop))) {
            canMoveY = false;
            player.vy = 0;
        }
        if (player.vy > 0 && isSolid(getTileAt(x, newBottom))) {
            canMoveY = false;
            player.grounded = true;

            // Fall damage
            if (player.vy > 200) {
                const damage = Math.floor((player.vy - 200) / 50);
                player.hull -= damage;
                screenShake = Math.min(screenShake + damage * 2, 15);
                spawnFloatingText(player.x, player.y - 30, `-${damage} HULL`, '#FF4444', 14);
                spawnParticle(player.x, player.y + player.height / 2, '#8B6914', 8, 50);
            }
            player.vy = 0;
        }
    }
    if (canMoveY) player.y = newY;

    // Start drilling
    if (player.grounded && player.fuel > 0) {
        if (keys['arrowdown'] || keys['s']) {
            const drillX = player.x;
            const drillY = player.y + player.height / 2 + TILE_SIZE / 2;
            const tile = getTileAt(drillX, drillY);

            if (tile !== TILE.EMPTY && tile !== TILE.BUILDING) {
                startDrill('down', drillX, drillY);
            }
        }
    }

    // World boundaries
    player.x = Math.max(player.width / 2, Math.min(WORLD_WIDTH * TILE_SIZE - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, player.y);

    // Check lava damage
    const centerTile = getTileAt(player.x, player.y);
    if (centerTile === TILE.LAVA) {
        const damage = 58 * (1 - RADIATOR_REDUCTION[upgrades.radiator]);
        player.hull -= damage * dt;
    }

    // Check game over
    if (player.hull <= 0) {
        gameState = 'gameover';
    }
}

function isSolid(tile) {
    return tile !== TILE.EMPTY && tile !== TILE.LAVA;
}

function startDrill(dir, targetX, targetY) {
    player.drilling = true;
    player.drillDir = dir;
    player.drillProgress = 0;
    player.drillTarget = { x: targetX, y: targetY };

    const tile = getTileAt(targetX, targetY);
    player.drillTime = tile === TILE.ROCK ? 1.5 : 1.0;
    player.drillTime /= (player.drillSpeed / 20);
}

function updateDrilling(dt) {
    player.fuel -= 0.3 * dt;
    player.drillProgress += dt;

    // Combo timer
    comboTimer -= dt;
    if (comboTimer <= 0) {
        miningCombo = 0;
    }

    if (player.drillProgress >= player.drillTime) {
        // Complete drilling
        const tile = getTileAt(player.drillTarget.x, player.drillTarget.y);
        const screenX = player.drillTarget.x;
        const screenY = player.drillTarget.y - cameraY;

        // Spawn dirt particles
        spawnParticle(player.x, screenY, '#8B6914', 5, 40);

        // Gas pocket explosion!
        if (tile === TILE.GAS_POCKET) {
            triggerGasExplosion(player.drillTarget.x, player.drillTarget.y);
            player.drilling = false;
            return;
        }

        // Ancient artifact (very valuable!)
        if (tile === TILE.ANCIENT_ARTIFACT) {
            const artifactValue = 25000;
            cash += artifactValue;
            score += artifactValue * 2;
            spawnFloatingText(player.x, screenY - 20, `ARTIFACT! +$${artifactValue}`, '#FFD700', 22);
            spawnParticle(player.x, screenY, '#FFD700', 20, 100);
            screenShake = 8;
        }

        // Collect mineral
        if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
            const mineral = MINERALS[tile];
            if (getCargoWeight() + mineral.weight <= player.cargoCapacity) {
                player.cargo.push({
                    type: tile,
                    name: mineral.name,
                    value: mineral.value,
                    weight: mineral.weight
                });

                // Combo bonus
                miningCombo++;
                comboTimer = 2;
                const comboMultiplier = Math.min(1 + miningCombo * 0.1, 2.5);
                const earnedScore = Math.floor(mineral.value * comboMultiplier);
                score += earnedScore;

                spawnFloatingText(player.x, screenY - 20, `+${mineral.name}`, mineral.color, 14);
                if (miningCombo > 2) {
                    spawnFloatingText(player.x, screenY - 40, `${miningCombo}x COMBO!`, '#FF8800', 12);
                }
                spawnParticle(player.x, screenY, mineral.color, 8, 60);

                // Achievement checks
                if (tile === TILE.DIAMOND && !achievements.firstDiamond) {
                    achievements.firstDiamond = true;
                    spawnFloatingText(player.x, player.y - 50, 'FIRST DIAMOND!', '#B9F2FF', 20);
                    cash += 5000;
                }
                if (tile === TILE.RUBY && !achievements.firstRuby) {
                    achievements.firstRuby = true;
                    spawnFloatingText(player.x, player.y - 50, 'FIRST RUBY!', '#E0115F', 20);
                    cash += 2000;
                }
            } else {
                spawnFloatingText(player.x, screenY - 20, 'CARGO FULL!', '#FF4444', 16);
            }
        }

        // Lava damage
        if (tile === TILE.LAVA) {
            const damage = 58 * (1 - RADIATOR_REDUCTION[upgrades.radiator]);
            player.hull -= damage;
            spawnFloatingText(player.x, screenY - 20, `-${Math.floor(damage)} LAVA!`, '#FF4500', 16);
            screenShake = 5;
        }

        // Clear tile
        setTileAt(player.drillTarget.x, player.drillTarget.y, TILE.EMPTY);

        // Move player
        if (player.drillDir === 'down') {
            player.y += TILE_SIZE;
        }

        player.drilling = false;
    }
}

// Camera
function updateCamera() {
    const targetY = player.y - HEIGHT / 3;
    cameraY = Math.max(0, targetY);
}

// Drawing
function drawWorld() {
    const startY = Math.floor(cameraY / TILE_SIZE);
    const endY = Math.min(startY + Math.ceil(HEIGHT / TILE_SIZE) + 1, WORLD_HEIGHT);

    for (let y = startY; y < endY; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const tile = world[y][x];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE - cameraY;

            drawTile(tile, screenX, screenY, x, y);
        }
    }
}

function drawTile(tile, x, y, tileX, tileY) {
    if (tile === TILE.EMPTY) {
        ctx.fillStyle = COLORS.empty;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.DIRT) {
        // Dirt with variation
        ctx.fillStyle = (tileX + tileY) % 2 === 0 ? COLORS.dirt : COLORS.dirtDark;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Add some texture
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + 2, y + 2, 4, 4);
        ctx.fillRect(x + 12, y + 10, 4, 4);
        return;
    }

    if (tile === TILE.ROCK) {
        ctx.fillStyle = (tileX + tileY) % 2 === 0 ? COLORS.rock : COLORS.rockDark;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 3, y + 3, 6, 6);
        return;
    }

    if (tile === TILE.BUILDING) {
        ctx.fillStyle = COLORS.building;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE.LAVA) {
        ctx.fillStyle = COLORS.lava;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Glow effect
        ctx.fillStyle = 'rgba(255,200,0,0.5)';
        ctx.fillRect(x + 4, y + 4, 12, 12);
        return;
    }

    if (tile === TILE.GAS_POCKET) {
        // Hidden in rock - looks like rock with slight green tint
        ctx.fillStyle = '#445544';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Subtle gas leak hint
        ctx.fillStyle = 'rgba(100,255,100,0.15)';
        ctx.fillRect(x + 2, y + 2, 16, 16);
        return;
    }

    if (tile === TILE.ANCIENT_ARTIFACT) {
        // Gold artifact in dirt
        ctx.fillStyle = COLORS.dirt;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 3);
        ctx.lineTo(x + 17, y + 10);
        ctx.lineTo(x + 10, y + 17);
        ctx.lineTo(x + 3, y + 10);
        ctx.closePath();
        ctx.fill();
        // Sparkle
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 8, y + 5, 3, 3);
        return;
    }

    // Minerals
    if (tile >= TILE.IRONIUM && tile <= TILE.AMAZONITE) {
        // Draw dirt background
        ctx.fillStyle = COLORS.dirt;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Draw mineral chunks
        const mineral = MINERALS[tile];
        ctx.fillStyle = mineral.color;
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 3, y + 5, 5, 5);
        ctx.fillRect(x + 12, y + 12, 4, 4);

        // Sparkle for valuable minerals
        if (tile >= TILE.EMERALD) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 8, y + 6, 2, 2);
        }
    }
}

function drawSky() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 100 - cameraY);
    gradient.addColorStop(0, '#FF6B35');
    gradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, Math.max(0, 100 - cameraY));
}

function drawBuildings() {
    if (cameraY > 150) return; // Not visible

    const groundY = 5 * TILE_SIZE - cameraY;

    for (const b of buildings) {
        const bx = b.x * TILE_SIZE;

        // Building structure
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, groundY - 50, 80, 50);

        // Roof
        ctx.fillStyle = '#222';
        ctx.fillRect(bx - 5, groundY - 60, 90, 15);

        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, bx + 40, groundY - 30);
        ctx.textAlign = 'left';
    }
}

function drawPlayer() {
    const screenY = player.y - cameraY;

    ctx.save();
    ctx.translate(player.x, screenY);

    // Pod body
    ctx.fillStyle = COLORS.pod;
    ctx.fillRect(-12, -14, 24, 20);

    // Cockpit window
    ctx.fillStyle = COLORS.podCockpit;
    ctx.fillRect(-8, -12, 16, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-6, -10, 4, 6);

    // Drill
    ctx.fillStyle = COLORS.podDrill;
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(0, 14);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();

    // Drill animation
    if (player.drilling) {
        ctx.fillStyle = '#FF8800';
        const sparkX = (Math.random() - 0.5) * 10;
        const sparkY = 14 + Math.random() * 6;
        ctx.fillRect(sparkX - 2, sparkY - 2, 4, 4);
    }

    // Thrust flame
    if ((keys['arrowup'] || keys['w']) && player.fuel > 0) {
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(-4, -18, 8, 6);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(-2, -22, 4, 6);
    }

    ctx.restore();
}

function drawHUD() {
    const depth = Math.floor(Math.max(0, player.y - 100) / TILE_SIZE * 13);

    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, 45);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`$${cash.toLocaleString()}`, 400, 25);

    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`DEPTH: ${depth} ft`, 20, 20);
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 20, 38);

    // Right side stats
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FF6B35';
    ctx.fillText(`CARGO: ${getCargoWeight()}/${player.cargoCapacity} kg`, WIDTH - 20, 20);

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, HEIGHT - 50, WIDTH, 50);

    // Fuel bar
    const fuelRatio = player.fuel / player.maxFuel;
    ctx.fillStyle = '#333';
    ctx.fillRect(20, HEIGHT - 35, 150, 20);
    ctx.fillStyle = fuelRatio < 0.2 ? '#FF0000' : '#FFD700';
    ctx.fillRect(20, HEIGHT - 35, 150 * fuelRatio, 20);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`FUEL: ${player.fuel.toFixed(1)}/${player.maxFuel}`, 25, HEIGHT - 20);

    // Hull bar
    const hullRatio = player.hull / player.maxHull;
    ctx.fillStyle = '#333';
    ctx.fillRect(200, HEIGHT - 35, 150, 20);
    ctx.fillStyle = hullRatio < 0.25 ? '#FF0000' : '#FF4444';
    ctx.fillRect(200, HEIGHT - 35, 150 * hullRatio, 20);
    ctx.fillStyle = '#FFF';
    ctx.fillText(`HULL: ${Math.ceil(player.hull)}/${player.maxHull}`, 205, HEIGHT - 20);

    // Cargo summary
    ctx.fillStyle = '#AAA';
    ctx.textAlign = 'right';
    ctx.fillText(`Items: ${player.cargo.length}`, WIDTH - 20, HEIGHT - 20);

    // Controls hint
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.fillText('Arrow Keys: Move/Drill | Land on buildings to interact', WIDTH / 2, HEIGHT - 8);

    // Combo display
    if (miningCombo > 1) {
        ctx.fillStyle = '#FF8800';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${miningCombo}x MINING COMBO`, WIDTH / 2, 70);
    }
}

function drawFloatingTexts() {
    for (const t of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y - cameraY);
        ctx.fillText(t.text, t.x, t.y - cameraY);
        ctx.restore();
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
    }
}

// Building interactions
function checkBuildingInteraction() {
    if (player.y > 150 || !player.grounded) return;

    const playerTileX = Math.floor(player.x / TILE_SIZE);

    for (const b of buildings) {
        if (playerTileX >= b.x && playerTileX < b.x + 4) {
            if (b.name === 'Fuel') {
                // Auto-buy fuel
                const needed = player.maxFuel - player.fuel;
                const cost = Math.ceil(needed * 2);
                if (cash >= cost && needed > 0.1) {
                    cash -= cost;
                    player.fuel = player.maxFuel;
                }
            } else if (b.name === 'Sell') {
                // Sell all cargo
                for (const item of player.cargo) {
                    cash += item.value;
                }
                player.cargo = [];
            } else if (b.name === 'Repair') {
                // Repair hull
                const needed = player.maxHull - player.hull;
                const cost = Math.ceil(needed * 15);
                if (cash >= cost && needed > 0.1) {
                    cash -= cost;
                    player.hull = player.maxHull;
                }
            } else if (b.name === 'Shop') {
                // Simple auto-upgrade: buy cheapest available
                tryUpgrade();
            }
            return;
        }
    }
}

function tryUpgrade() {
    // Try to buy next upgrade tier for each category
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
                return; // One upgrade per visit
            }
        }
    }
}

function applyUpgrades() {
    player.drillSpeed = DRILL_SPEEDS[upgrades.drill];
    player.maxHull = HULL_HP[upgrades.hull];
    player.hull = Math.min(player.hull, player.maxHull);
    player.enginePower = ENGINE_POWER[upgrades.engine];
    player.maxFuel = FUEL_CAPACITY[upgrades.fuel];
    player.fuel = Math.min(player.fuel, player.maxFuel);
    player.cargoCapacity = CARGO_CAPACITY[upgrades.cargo];
    player.radiator = upgrades.radiator;
}

function drawTitleScreen() {
    ctx.fillStyle = '#1A0A0A';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Dirt texture
    for (let y = 300; y < HEIGHT; y += 20) {
        for (let x = 0; x < WIDTH; x += 20) {
            ctx.fillStyle = (x + y) % 40 === 0 ? '#8B6914' : '#5C4A0A';
            ctx.fillRect(x, y, 20, 20);
        }
    }

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MOTHERLOAD', WIDTH / 2, 150);

    ctx.fillStyle = '#FF6B35';
    ctx.font = '24px Arial';
    ctx.fillText('Mars Mining Operations', WIDTH / 2, 200);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Start', WIDTH / 2, 350);

    ctx.fillStyle = '#AAA';
    ctx.font = '14px Arial';
    ctx.fillText('Arrow Keys: Move & Drill', WIDTH / 2, 420);
    ctx.fillText('Dig minerals, return to surface, sell & upgrade!', WIDTH / 2, 450);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, 200);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score.toLocaleString()}`, WIDTH / 2, 280);
    ctx.fillText(`Cash Earned: $${cash.toLocaleString()}`, WIDTH / 2, 320);

    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Restart', WIDTH / 2, 420);
}

// Reset game
function resetGame() {
    player.x = WIDTH / 2;
    player.y = 80;
    player.vx = 0;
    player.vy = 0;
    player.hull = 10;
    player.maxHull = 10;
    player.fuel = 10;
    player.maxFuel = 10;
    player.cargoCapacity = 70;
    player.drillSpeed = 20;
    player.enginePower = 150;
    player.radiator = 0;
    player.cargo = [];
    player.drilling = false;

    for (const key of Object.keys(upgrades)) {
        upgrades[key] = 0;
    }

    // Reset new systems
    floatingTexts = [];
    particles = [];
    screenShake = 0;
    miningCombo = 0;
    comboTimer = 0;

    // Reset achievements
    for (const key of Object.keys(achievements)) {
        achievements[key] = false;
    }

    cash = 500;
    score = 0;
    cameraY = 0;

    generateWorld();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'title') {
        drawTitleScreen();
    } else if (gameState === 'playing') {
        updatePlayer(dt);
        checkBuildingInteraction();
        updateCamera();
        updateFloatingTexts(dt);
        updateParticles(dt);
        checkAchievements();

        // Screen shake decay
        screenShake = Math.max(0, screenShake - dt * 30);

        // Apply screen shake
        if (screenShake > 0) {
            ctx.save();
            const shakeX = (Math.random() - 0.5) * screenShake * 2;
            const shakeY = (Math.random() - 0.5) * screenShake * 2;
            ctx.translate(shakeX, shakeY);
        }

        drawSky();
        drawWorld();
        drawBuildings();
        drawPlayer();
        drawParticles();
        drawFloatingTexts();

        // Restore from screen shake
        if (screenShake > 0) {
            ctx.restore();
        }

        drawHUD();
    } else if (gameState === 'gameover') {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        if (gameState === 'title') {
            gameState = 'playing';
            resetGame();
        } else if (gameState === 'gameover') {
            gameState = 'playing';
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Expose for testing
window.gameState = {
    get state() { return gameState; },
    get score() { return score; },
    get cash() { return cash; },
    get depth() { return Math.floor(Math.max(0, player.y - 100) / TILE_SIZE * 13); },
    get fuel() { return player.fuel; },
    get hull() { return player.hull; },
    get cargo() { return player.cargo.length; },
    get upgrades() { return upgrades; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        gameState = 'playing';
        resetGame();
    }
};

// Start
resetGame();
gameState = 'title';
requestAnimationFrame(gameLoop);
