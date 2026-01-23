// Dome Keeper Clone - Canvas Version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // start, mining, defending, upgradeMenu, gameover, victory
let debugMode = false;
let lastTime = 0;
let deltaTime = 0;

// Camera
const camera = { x: 0, y: 0, zoom: 2 };
const VIEW_WIDTH = canvas.width;
const VIEW_HEIGHT = canvas.height;

// Constants
const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 100;
const DOME_X = MAP_WIDTH / 2;
const SURFACE_Y = 5;

// Input
const keys = {};
const mouse = { x: 0, y: 0, clicked: false, worldX: 0, worldY: 0 };

// Map
let tiles = [];

// Tile types
const TILE_TYPES = {
    AIR: 0,
    DIRT: 1,
    SOFT_STONE: 2,
    HARD_STONE: 3,
    DENSE_ROCK: 4,
    CRYSTAL_ROCK: 5,
    IRON_ORE: 6,
    WATER_ORE: 7,
    BEDROCK: 8
};

const TILE_DATA = {
    [TILE_TYPES.AIR]: { hp: 0, color: '#1a1a2e', name: 'Air' },
    [TILE_TYPES.DIRT]: { hp: 2, color: '#5c4033', name: 'Dirt' },
    [TILE_TYPES.SOFT_STONE]: { hp: 4, color: '#6b5b4f', name: 'Soft Stone' },
    [TILE_TYPES.HARD_STONE]: { hp: 8, color: '#555555', name: 'Hard Stone' },
    [TILE_TYPES.DENSE_ROCK]: { hp: 12, color: '#3d3d3d', name: 'Dense Rock' },
    [TILE_TYPES.CRYSTAL_ROCK]: { hp: 16, color: '#4a4a6a', name: 'Crystal Rock' },
    [TILE_TYPES.IRON_ORE]: { hp: 6, color: '#8b4513', name: 'Iron Ore', resource: 'iron', amount: [1, 3] },
    [TILE_TYPES.WATER_ORE]: { hp: 5, color: '#4682b4', name: 'Water Crystal', resource: 'water', amount: [1, 2] },
    [TILE_TYPES.BEDROCK]: { hp: Infinity, color: '#1a1a1a', name: 'Bedrock' }
};

// Player (Keeper)
const player = {
    x: DOME_X * TILE_SIZE,
    y: SURFACE_Y * TILE_SIZE,
    width: 12,
    height: 16,
    speed: 80,
    drillPower: 2,
    carryCapacity: 5,
    carrying: { iron: 0, water: 0 },
    isDigging: false,
    digTarget: null,
    digProgress: 0,
    facing: 'down'
};

// Resources stored at dome
const resources = { iron: 0, water: 0 };

// Dome
const dome = {
    x: DOME_X * TILE_SIZE,
    y: SURFACE_Y * TILE_SIZE - 32,
    width: 64,
    height: 48,
    hp: 100,
    maxHp: 100,
    laserAngle: -Math.PI / 2,
    laserDamage: 15,
    laserCooldown: 0,
    laserFireRate: 200,
    laserSpeed: 2
};

// Wave system
let currentWave = 0;
let waveTimer = 0;
let miningTime = 60; // seconds
let waveWarning = false;
let waveWarningTimer = 0;
const WAVE_WARNING_TIME = 10;

// Enemies
let enemies = [];

// Enemy types
const ENEMY_TYPES = {
    walker: { hp: 40, damage: 12, speed: 40, color: '#664422', width: 14, height: 14 },
    flyer: { hp: 20, damage: 15, speed: 60, color: '#446644', width: 12, height: 12, flying: true },
    hornet: { hp: 100, damage: 45, speed: 50, color: '#aa4444', width: 16, height: 16 },
    worm: { hp: 80, damage: 30, speed: 20, color: '#664466', width: 20, height: 10, underground: true },
    diver: { hp: 30, damage: 100, speed: 100, color: '#4444aa', width: 12, height: 18, diving: true }
};

// Projectiles (laser beams)
let projectiles = [];

// Particles
let particles = [];

// Floating texts
let floatingTexts = [];

// Upgrades
const upgrades = {
    drillSpeed: { level: 0, maxLevel: 3, baseCost: 5, effect: 0.25 },
    carryCapacity: { level: 0, maxLevel: 3, baseCost: 8, effect: 2 },
    laserDamage: { level: 0, maxLevel: 3, baseCost: 10, effect: 10 },
    laserSpeed: { level: 0, maxLevel: 3, baseCost: 8, effect: 0.5 },
    domeHealth: { level: 0, maxLevel: 3, baseCost: 15, effect: 30 }
};

// Initialize game
function init() {
    generateMap();
    setupEventListeners();
    gameLoop(0);
}

// Generate procedural map
function generateMap() {
    tiles = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        tiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Surface and above = air
            if (y < SURFACE_Y) {
                tiles[y][x] = { type: TILE_TYPES.AIR, hp: 0 };
                continue;
            }

            // Dome area = air
            if (y === SURFACE_Y && Math.abs(x - DOME_X) < 3) {
                tiles[y][x] = { type: TILE_TYPES.AIR, hp: 0 };
                continue;
            }

            // Edges = bedrock
            if (x === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                tiles[y][x] = { type: TILE_TYPES.BEDROCK, hp: Infinity };
                continue;
            }

            // Determine tile type based on depth
            const depth = y - SURFACE_Y;
            let type = determineTileType(depth, x, y);

            tiles[y][x] = {
                type: type,
                hp: TILE_DATA[type].hp,
                maxHp: TILE_DATA[type].hp
            };
        }
    }
}

function determineTileType(depth, x, y) {
    const noise = Math.sin(x * 0.3) * Math.cos(y * 0.2) + Math.sin(x * 0.1 + y * 0.15);
    const rand = Math.random();

    // Resource chance
    if (rand < 0.08) {
        if (depth < 40 && rand < 0.05) return TILE_TYPES.IRON_ORE;
        if (depth > 20 && rand < 0.03) return TILE_TYPES.WATER_ORE;
        if (depth > 10) return TILE_TYPES.IRON_ORE;
    }

    // Layer-based rock types
    if (depth < 15) {
        return noise > 0.3 ? TILE_TYPES.SOFT_STONE : TILE_TYPES.DIRT;
    } else if (depth < 35) {
        return noise > 0 ? TILE_TYPES.HARD_STONE : TILE_TYPES.SOFT_STONE;
    } else if (depth < 60) {
        return noise > -0.2 ? TILE_TYPES.DENSE_ROCK : TILE_TYPES.HARD_STONE;
    } else {
        return noise > -0.3 ? TILE_TYPES.CRYSTAL_ROCK : TILE_TYPES.DENSE_ROCK;
    }
}

// Setup event listeners
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        if (gameState === 'mining' || gameState === 'defending') {
            if (e.key.toLowerCase() === 'q') {
                debugMode = !debugMode;
            }
            if (e.key.toLowerCase() === 'e') {
                if (isNearDome()) {
                    gameState = gameState === 'upgradeMenu' ? 'mining' : 'upgradeMenu';
                }
            }
        } else if (gameState === 'upgradeMenu') {
            if (e.key.toLowerCase() === 'e' || e.key === 'Escape') {
                gameState = 'mining';
            }
            // Number keys for upgrades
            if (e.key >= '1' && e.key <= '5') {
                const upgradeNames = ['drillSpeed', 'carryCapacity', 'laserDamage', 'laserSpeed', 'domeHealth'];
                tryPurchaseUpgrade(upgradeNames[parseInt(e.key) - 1]);
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        // Convert to world coordinates
        mouse.worldX = (mouse.x / camera.zoom) + camera.x;
        mouse.worldY = (mouse.y / camera.zoom) + camera.y;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) mouse.clicked = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouse.clicked = false;
    });
}

function isNearDome() {
    const dx = player.x - dome.x;
    const dy = player.y - dome.y;
    return Math.sqrt(dx*dx + dy*dy) < 60;
}

function tryPurchaseUpgrade(upgradeName) {
    const upgrade = upgrades[upgradeName];
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return;

    const cost = upgrade.baseCost * (upgrade.level + 1);
    if (resources.iron >= cost) {
        resources.iron -= cost;
        upgrade.level++;

        // Apply upgrade effects
        switch(upgradeName) {
            case 'drillSpeed':
                player.drillPower += 1;
                break;
            case 'carryCapacity':
                player.carryCapacity += upgrade.effect;
                break;
            case 'laserDamage':
                dome.laserDamage += upgrade.effect;
                break;
            case 'laserSpeed':
                dome.laserSpeed += upgrade.effect;
                break;
            case 'domeHealth':
                dome.maxHp += upgrade.effect;
                dome.hp = dome.maxHp;
                break;
        }

        floatingTexts.push({
            x: dome.x,
            y: dome.y - 30,
            text: 'UPGRADED!',
            color: '#0f0',
            life: 1500
        });
    }
}

// Start game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameState = 'mining';
    currentWave = 0;
    waveTimer = miningTime;
    startNextWave();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');

    // Reset everything
    player.x = DOME_X * TILE_SIZE;
    player.y = SURFACE_Y * TILE_SIZE;
    player.carrying = { iron: 0, water: 0 };
    player.drillPower = 2;
    player.carryCapacity = 5;

    resources.iron = 0;
    resources.water = 0;

    dome.hp = 100;
    dome.maxHp = 100;
    dome.laserDamage = 15;
    dome.laserSpeed = 2;

    Object.keys(upgrades).forEach(key => {
        upgrades[key].level = 0;
    });

    enemies = [];
    projectiles = [];
    particles = [];
    floatingTexts = [];

    generateMap();
    currentWave = 0;
    waveTimer = miningTime;
    gameState = 'mining';
    startNextWave();
}

function startNextWave() {
    currentWave++;
    if (currentWave > 10) {
        victory();
        return;
    }

    waveTimer = miningTime - (currentWave - 1) * 3; // Decreasing mining time
    waveTimer = Math.max(30, waveTimer);
    waveWarning = false;
    waveWarningTimer = 0;
    gameState = 'mining';
}

function startDefensePhase() {
    gameState = 'defending';
    spawnEnemies();
}

function spawnEnemies() {
    const waveStrength = 40 + (currentWave - 1) * 30;
    let spawnedWeight = 0;

    const availableTypes = [];
    if (currentWave >= 1) availableTypes.push('walker');
    if (currentWave >= 2) availableTypes.push('flyer');
    if (currentWave >= 4) availableTypes.push('hornet');
    if (currentWave >= 6) availableTypes.push('worm');
    if (currentWave >= 8) availableTypes.push('diver');

    while (spawnedWeight < waveStrength) {
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const enemyData = ENEMY_TYPES[type];

        // Spawn from sides
        const side = Math.random() < 0.5 ? -1 : 1;
        const spawnX = dome.x + side * (200 + Math.random() * 100);
        const spawnY = SURFACE_Y * TILE_SIZE - 20;

        enemies.push({
            x: spawnX,
            y: spawnY,
            type: type,
            hp: enemyData.hp,
            maxHp: enemyData.hp,
            damage: enemyData.damage,
            speed: enemyData.speed,
            color: enemyData.color,
            width: enemyData.width,
            height: enemyData.height,
            flying: enemyData.flying || false,
            underground: enemyData.underground || false,
            diving: enemyData.diving || false,
            attackCooldown: 0,
            diveTimer: 0
        });

        spawnedWeight += enemyData.hp;
    }
}

// Main game loop
function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'mining') {
        updateMining();
    } else if (gameState === 'defending') {
        updateDefending();
    }

    render();
    requestAnimationFrame(gameLoop);
}

function updateMining() {
    updatePlayer();
    updateWaveTimer();
    updateCamera();
    updateParticles();
    updateFloatingTexts();
}

function updateDefending() {
    updatePlayer();
    updateEnemies();
    updateDomeLaser();
    updateProjectiles();
    updateCamera();
    updateParticles();
    updateFloatingTexts();

    // Check if all enemies dead
    if (enemies.length === 0) {
        startNextWave();
    }
}

function updatePlayer() {
    let dx = 0, dy = 0;

    if (keys['w'] || keys['arrowup']) { dy -= 1; player.facing = 'up'; }
    if (keys['s'] || keys['arrowdown']) { dy += 1; player.facing = 'down'; }
    if (keys['a'] || keys['arrowleft']) { dx -= 1; player.facing = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx += 1; player.facing = 'right'; }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
    }

    // Calculate new position
    const newX = player.x + dx * player.speed * deltaTime;
    const newY = player.y + dy * player.speed * deltaTime;

    // Check collision with tiles
    if (!collidesWithTile(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!collidesWithTile(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Clamp to map bounds
    player.x = Math.max(TILE_SIZE, Math.min((MAP_WIDTH - 1) * TILE_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min((MAP_HEIGHT - 1) * TILE_SIZE - player.height, player.y));

    // Digging with spacebar
    if (keys[' ']) {
        tryDig();
    } else {
        player.isDigging = false;
        player.digProgress = 0;
        player.digTarget = null;
    }

    // Deposit resources at dome
    if (isNearDome()) {
        if (player.carrying.iron > 0 || player.carrying.water > 0) {
            resources.iron += player.carrying.iron;
            resources.water += player.carrying.water;

            if (player.carrying.iron > 0) {
                floatingTexts.push({
                    x: dome.x,
                    y: dome.y - 20,
                    text: '+' + player.carrying.iron + ' Iron',
                    color: '#fa0',
                    life: 1000
                });
            }
            if (player.carrying.water > 0) {
                floatingTexts.push({
                    x: dome.x,
                    y: dome.y - 35,
                    text: '+' + player.carrying.water + ' Water',
                    color: '#0af',
                    life: 1000
                });
            }

            player.carrying.iron = 0;
            player.carrying.water = 0;
        }
    }
}

function collidesWithTile(x, y, w, h) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + w) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + h) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                const tile = tiles[ty][tx];
                if (tile.type !== TILE_TYPES.AIR && tile.hp > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function tryDig() {
    // Find tile in front of player based on facing direction
    let targetX = Math.floor(player.x / TILE_SIZE);
    let targetY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

    switch(player.facing) {
        case 'up':
            targetY = Math.floor(player.y / TILE_SIZE) - 1;
            targetX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
            break;
        case 'down':
            targetY = Math.floor((player.y + player.height) / TILE_SIZE) + 1;
            targetX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
            break;
        case 'left':
            targetX = Math.floor(player.x / TILE_SIZE) - 1;
            targetY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
            break;
        case 'right':
            targetX = Math.floor((player.x + player.width) / TILE_SIZE) + 1;
            targetY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
            break;
    }

    if (targetY < 0 || targetY >= MAP_HEIGHT || targetX < 0 || targetX >= MAP_WIDTH) return;

    const tile = tiles[targetY][targetX];
    if (tile.type === TILE_TYPES.AIR || tile.type === TILE_TYPES.BEDROCK) return;

    // Start or continue digging
    if (!player.digTarget || player.digTarget.x !== targetX || player.digTarget.y !== targetY) {
        player.digTarget = { x: targetX, y: targetY };
        player.digProgress = 0;
    }

    player.isDigging = true;
    player.digProgress += player.drillPower * deltaTime;

    // Create dig particles
    if (Math.random() < 0.3) {
        particles.push({
            x: targetX * TILE_SIZE + TILE_SIZE / 2,
            y: targetY * TILE_SIZE + TILE_SIZE / 2,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            life: 300,
            maxLife: 300,
            color: TILE_DATA[tile.type].color,
            size: 2
        });
    }

    // Check if tile is mined
    if (player.digProgress >= tile.hp) {
        mineTile(targetX, targetY);
    }
}

function mineTile(x, y) {
    const tile = tiles[y][x];
    const tileData = TILE_DATA[tile.type];

    // Drop resources
    if (tileData.resource) {
        const amount = tileData.amount[0] + Math.floor(Math.random() * (tileData.amount[1] - tileData.amount[0] + 1));
        const totalCarrying = player.carrying.iron + player.carrying.water;

        if (totalCarrying < player.carryCapacity) {
            const canCarry = Math.min(amount, player.carryCapacity - totalCarrying);
            if (tileData.resource === 'iron') {
                player.carrying.iron += canCarry;
                floatingTexts.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE,
                    text: '+' + canCarry + ' Iron',
                    color: '#fa0',
                    life: 800
                });
            } else if (tileData.resource === 'water') {
                player.carrying.water += canCarry;
                floatingTexts.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE,
                    text: '+' + canCarry + ' Water',
                    color: '#0af',
                    life: 800
                });
            }
        }
    }

    // Mine particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 500,
            maxLife: 500,
            color: tileData.color,
            size: 3
        });
    }

    // Clear tile
    tiles[y][x] = { type: TILE_TYPES.AIR, hp: 0 };

    player.isDigging = false;
    player.digProgress = 0;
    player.digTarget = null;
}

function updateWaveTimer() {
    waveTimer -= deltaTime;

    // Wave warning
    if (waveTimer <= WAVE_WARNING_TIME && !waveWarning) {
        waveWarning = true;
        waveWarningTimer = WAVE_WARNING_TIME;
    }

    if (waveWarning) {
        waveWarningTimer -= deltaTime;
    }

    if (waveTimer <= 0) {
        startDefensePhase();
    }
}

function updateCamera() {
    // Follow player
    const targetX = player.x - (VIEW_WIDTH / camera.zoom) / 2;
    const targetY = player.y - (VIEW_HEIGHT / camera.zoom) / 2;

    camera.x += (targetX - camera.x) * 5 * deltaTime;
    camera.y += (targetY - camera.y) * 5 * deltaTime;

    // Clamp camera
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - VIEW_WIDTH / camera.zoom, camera.x));
    camera.y = Math.max(-50, Math.min(MAP_HEIGHT * TILE_SIZE - VIEW_HEIGHT / camera.zoom, camera.y));
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move toward dome
        const dx = dome.x - enemy.x;
        const dy = dome.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 30) {
            enemy.x += (dx / dist) * enemy.speed * deltaTime;
            if (!enemy.flying && !enemy.underground) {
                // Ground enemies stay on surface
                enemy.y = SURFACE_Y * TILE_SIZE - enemy.height;
            } else if (enemy.flying) {
                enemy.y += (dy / dist) * enemy.speed * deltaTime * 0.3;
            }
        } else {
            // Attack dome
            enemy.attackCooldown -= deltaTime * 1000;
            if (enemy.attackCooldown <= 0) {
                dome.hp -= enemy.damage;
                enemy.attackCooldown = 1000;

                // Screen shake
                camera.x += (Math.random() - 0.5) * 10;
                camera.y += (Math.random() - 0.5) * 10;

                // Damage particles
                for (let j = 0; j < 5; j++) {
                    particles.push({
                        x: dome.x + (Math.random() - 0.5) * 30,
                        y: dome.y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        life: 400,
                        maxLife: 400,
                        color: '#f44',
                        size: 4
                    });
                }

                if (dome.hp <= 0) {
                    gameOver();
                    return;
                }
            }
        }

        // Check if dead
        if (enemy.hp <= 0) {
            // Death particles
            for (let j = 0; j < 10; j++) {
                particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 600,
                    maxLife: 600,
                    color: enemy.color,
                    size: 4
                });
            }
            enemies.splice(i, 1);
        }
    }
}

function updateDomeLaser() {
    // Rotate laser toward mouse
    const dx = mouse.worldX - dome.x;
    const dy = mouse.worldY - dome.y;
    const targetAngle = Math.atan2(dy, dx);

    // Smooth rotation
    let angleDiff = targetAngle - dome.laserAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    dome.laserAngle += angleDiff * dome.laserSpeed * deltaTime;

    // Cooldown
    dome.laserCooldown = Math.max(0, dome.laserCooldown - deltaTime * 1000);

    // Fire laser
    if (mouse.clicked && dome.laserCooldown <= 0) {
        dome.laserCooldown = dome.laserFireRate;

        projectiles.push({
            x: dome.x,
            y: dome.y,
            vx: Math.cos(dome.laserAngle) * 400,
            vy: Math.sin(dome.laserAngle) * 400,
            damage: dome.laserDamage,
            lifetime: 1000
        });

        // Muzzle flash
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: dome.x + Math.cos(dome.laserAngle) * 25,
                y: dome.y + Math.sin(dome.laserAngle) * 25,
                vx: Math.cos(dome.laserAngle + (Math.random() - 0.5) * 0.5) * 100,
                vy: Math.sin(dome.laserAngle + (Math.random() - 0.5) * 0.5) * 100,
                life: 100,
                maxLife: 100,
                color: '#0ff',
                size: 3
            });
        }
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;
        proj.lifetime -= deltaTime * 1000;

        // Check enemy collisions
        for (const enemy of enemies) {
            const dx = proj.x - enemy.x;
            const dy = proj.y - enemy.y;
            if (Math.sqrt(dx*dx + dy*dy) < 15) {
                enemy.hp -= proj.damage;

                // Hit particles
                for (let j = 0; j < 3; j++) {
                    particles.push({
                        x: proj.x,
                        y: proj.y,
                        vx: (Math.random() - 0.5) * 60,
                        vy: (Math.random() - 0.5) * 60,
                        life: 200,
                        maxLife: 200,
                        color: '#ff0',
                        size: 2
                    });
                }

                projectiles.splice(i, 1);
                break;
            }
        }

        if (proj.lifetime <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vy += 100 * deltaTime; // gravity
        p.vx *= 0.98;
        p.life -= deltaTime * 1000;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y -= 30 * deltaTime;
        t.life -= deltaTime * 1000;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('waveReached').textContent = currentWave;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function victory() {
    gameState = 'victory';
    document.getElementById('victoryScreen').classList.remove('hidden');
}

// Rendering
function render() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    if (gameState === 'start') return;

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    renderTiles();
    renderDome();
    renderPlayer();
    renderEnemies();
    renderProjectiles();
    renderParticles();
    renderFloatingTexts();

    ctx.restore();

    // HUD (screen space)
    renderHUD();

    if (gameState === 'upgradeMenu') {
        renderUpgradeMenu();
    }

    if (debugMode) {
        renderDebugOverlay();
    }
}

function renderTiles() {
    // Calculate visible tile range
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(MAP_WIDTH, Math.ceil((camera.x + VIEW_WIDTH / camera.zoom) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_HEIGHT, Math.ceil((camera.y + VIEW_HEIGHT / camera.zoom) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = tiles[y][x];
            const tileData = TILE_DATA[tile.type];

            ctx.fillStyle = tileData.color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // Add some texture/variation
            if (tile.type !== TILE_TYPES.AIR && tile.type !== TILE_TYPES.BEDROCK) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 2);
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, 2, TILE_SIZE);

                // Ore sparkle
                if (tile.type === TILE_TYPES.IRON_ORE || tile.type === TILE_TYPES.WATER_ORE) {
                    ctx.fillStyle = tile.type === TILE_TYPES.IRON_ORE ? '#fa0' : '#0ff';
                    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 300 + x + y) * 0.2;
                    ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, 4, 4);
                    ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 3, 3);
                    ctx.globalAlpha = 1;
                }

                // Dig progress indicator
                if (player.digTarget && player.digTarget.x === x && player.digTarget.y === y) {
                    const progress = player.digProgress / tile.maxHp;
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE * progress, TILE_SIZE);
                }
            }
        }
    }

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, SURFACE_Y * TILE_SIZE);
    skyGradient.addColorStop(0, '#1a1a3e');
    skyGradient.addColorStop(1, '#2a2a4e');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(camera.x, 0, VIEW_WIDTH / camera.zoom, SURFACE_Y * TILE_SIZE);

    // Surface line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, SURFACE_Y * TILE_SIZE);
    ctx.lineTo(MAP_WIDTH * TILE_SIZE, SURFACE_Y * TILE_SIZE);
    ctx.stroke();
}

function renderDome() {
    ctx.save();
    ctx.translate(dome.x, dome.y);

    // Dome base
    ctx.fillStyle = '#333';
    ctx.fillRect(-32, 10, 64, 20);

    // Dome glass
    ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 10, 30, Math.PI, 0);
    ctx.fill();

    // Dome frame
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 10, 30, Math.PI, 0);
    ctx.stroke();

    // Laser turret
    ctx.fillStyle = '#555';
    ctx.fillRect(-6, -5, 12, 10);

    // Laser barrel
    ctx.save();
    ctx.rotate(dome.laserAngle);
    ctx.fillStyle = '#888';
    ctx.fillRect(0, -3, 20, 6);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(18, -2, 4, 4);
    ctx.restore();

    ctx.restore();

    // Health bar
    const barWidth = 60;
    const barHeight = 6;
    ctx.fillStyle = '#400';
    ctx.fillRect(dome.x - barWidth/2, dome.y - 45, barWidth, barHeight);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(dome.x - barWidth/2, dome.y - 45, barWidth * (dome.hp / dome.maxHp), barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dome.x - barWidth/2, dome.y - 45, barWidth, barHeight);
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, player.height/2 - 2, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#ffa';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);

    // Visor
    ctx.fillStyle = '#0aa';
    ctx.fillRect(-player.width/2 + 2, -player.height/2 + 2, player.width - 4, 5);

    // Jetpack
    ctx.fillStyle = '#555';
    ctx.fillRect(-player.width/2 - 3, -player.height/2 + 5, 3, 8);
    ctx.fillRect(player.width/2, -player.height/2 + 5, 3, 8);

    // Drill indicator when digging
    if (player.isDigging) {
        let drillX = 0, drillY = 0;
        switch(player.facing) {
            case 'up': drillY = -12; break;
            case 'down': drillY = 12; break;
            case 'left': drillX = -12; break;
            case 'right': drillX = 12; break;
        }

        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(drillX, drillY, 4 + Math.sin(Date.now() / 50) * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Carry indicator
    if (player.carrying.iron > 0 || player.carrying.water > 0) {
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        if (player.carrying.iron > 0) {
            ctx.fillStyle = '#fa0';
            ctx.fillText(player.carrying.iron, player.x + player.width/2, player.y - 5);
        }
        if (player.carrying.water > 0) {
            ctx.fillStyle = '#0af';
            ctx.fillText(player.carrying.water, player.x + player.width/2 + 10, player.y - 5);
        }
    }
}

function renderEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(-enemy.width/4 - 1, -enemy.height/4 - 1, 3, 3);
        ctx.fillRect(enemy.width/4 - 2, -enemy.height/4 - 1, 3, 3);

        ctx.restore();

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const barWidth = enemy.width + 4;
            ctx.fillStyle = '#400';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 6, barWidth, 3);
            ctx.fillStyle = '#f00';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 6, barWidth * (enemy.hp / enemy.maxHp), 3);
        }
    });
}

function renderProjectiles() {
    projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);

        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(angle);

        // Laser beam
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0ff';
        ctx.fillRect(-10, -2, 20, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-8, -1, 16, 2);
        ctx.shadowBlur = 0;

        ctx.restore();
    });
}

function renderParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function renderFloatingTexts() {
    floatingTexts.forEach(t => {
        const alpha = t.life / 1500;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, VIEW_WIDTH, 35);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    // Wave info
    ctx.fillStyle = '#fff';
    ctx.fillText('WAVE ' + currentWave + '/10', 10, 15);

    // Timer
    if (gameState === 'mining') {
        ctx.fillStyle = waveWarning ? '#f44' : '#ff0';
        ctx.fillText('NEXT WAVE: ' + Math.ceil(waveTimer) + 's', 10, 30);
    } else if (gameState === 'defending') {
        ctx.fillStyle = '#f44';
        ctx.fillText('DEFENDING! Enemies: ' + enemies.length, 10, 30);
    }

    // Resources
    ctx.fillStyle = '#fa0';
    ctx.fillText('Iron: ' + resources.iron, 200, 15);
    ctx.fillStyle = '#0af';
    ctx.fillText('Water: ' + resources.water, 200, 30);

    // Carrying
    ctx.fillStyle = '#888';
    ctx.fillText('Carrying: ' + (player.carrying.iron + player.carrying.water) + '/' + player.carryCapacity, 320, 15);

    // Dome HP
    ctx.fillStyle = '#0f0';
    ctx.fillText('Dome HP: ' + dome.hp + '/' + dome.maxHp, 320, 30);

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText('[E] Upgrades (at dome)', VIEW_WIDTH - 10, 15);
    ctx.fillText('[Q] Debug', VIEW_WIDTH - 10, 30);

    // Wave warning
    if (waveWarning) {
        ctx.fillStyle = 'rgba(100,0,0,0.3)';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        ctx.fillStyle = '#f44';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WAVE INCOMING!', VIEW_WIDTH/2, VIEW_HEIGHT/2 - 50);
        ctx.font = '18px monospace';
        ctx.fillText('Return to dome! ' + Math.ceil(waveWarningTimer) + 's', VIEW_WIDTH/2, VIEW_HEIGHT/2 - 20);
    }
}

function renderUpgradeMenu() {
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Menu box
    const menuX = VIEW_WIDTH/2 - 200;
    const menuY = VIEW_HEIGHT/2 - 180;
    const menuW = 400;
    const menuH = 360;

    ctx.fillStyle = '#222';
    ctx.fillRect(menuX, menuY, menuW, menuH);
    ctx.strokeStyle = '#fa0';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuW, menuH);

    // Title
    ctx.fillStyle = '#fa0';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DOME UPGRADES', VIEW_WIDTH/2, menuY + 30);

    // Resources
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fa0';
    ctx.fillText('Iron: ' + resources.iron, VIEW_WIDTH/2 - 50, menuY + 55);
    ctx.fillStyle = '#0af';
    ctx.fillText('Water: ' + resources.water, VIEW_WIDTH/2 + 50, menuY + 55);

    // Upgrades list
    const upgradeNames = ['drillSpeed', 'carryCapacity', 'laserDamage', 'laserSpeed', 'domeHealth'];
    const upgradeLabels = ['Drill Speed', 'Carry Capacity', 'Laser Damage', 'Laser Speed', 'Dome Health'];

    ctx.textAlign = 'left';
    upgradeNames.forEach((name, i) => {
        const upgrade = upgrades[name];
        const cost = upgrade.baseCost * (upgrade.level + 1);
        const y = menuY + 90 + i * 50;

        const canAfford = resources.iron >= cost && upgrade.level < upgrade.maxLevel;
        const maxed = upgrade.level >= upgrade.maxLevel;

        // Background
        ctx.fillStyle = canAfford ? '#333' : '#222';
        ctx.fillRect(menuX + 20, y - 15, menuW - 40, 40);

        // Number key
        ctx.fillStyle = canAfford ? '#0f0' : '#666';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('[' + (i + 1) + ']', menuX + 30, y + 5);

        // Name and level
        ctx.fillStyle = maxed ? '#0f0' : '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(upgradeLabels[i], menuX + 70, y);
        ctx.fillStyle = '#888';
        ctx.fillText('Lv.' + upgrade.level + '/' + upgrade.maxLevel, menuX + 70, y + 18);

        // Cost
        if (!maxed) {
            ctx.fillStyle = canAfford ? '#fa0' : '#844';
            ctx.textAlign = 'right';
            ctx.fillText(cost + ' Iron', menuX + menuW - 30, y + 5);
            ctx.textAlign = 'left';
        } else {
            ctx.fillStyle = '#0f0';
            ctx.textAlign = 'right';
            ctx.fillText('MAXED', menuX + menuW - 30, y + 5);
            ctx.textAlign = 'left';
        }
    });

    // Close hint
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press [E] or [ESC] to close', VIEW_WIDTH/2, menuY + menuH - 20);
}

function renderDebugOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(VIEW_WIDTH - 180, 40, 170, 160);

    ctx.fillStyle = '#0f0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG MODE (Q)',
        '--------------',
        'Pos: ' + Math.floor(player.x) + ', ' + Math.floor(player.y),
        'Carrying: ' + (player.carrying.iron + player.carrying.water),
        'Drill: ' + player.drillPower,
        'Enemies: ' + enemies.length,
        'Wave: ' + currentWave + '/10',
        'State: ' + gameState,
        'Dome HP: ' + dome.hp + '/' + dome.maxHp,
        'FPS: ' + Math.round(1 / deltaTime)
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, VIEW_WIDTH - 170, 55 + i * 14);
    });
}

// Make functions globally available
window.startGame = startGame;
window.restartGame = restartGame;

// Initialize
init();
