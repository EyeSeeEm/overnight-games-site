// Mars Digger - A Motherload-inspired Mining Game
// Built with Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== CONSTANTS ====================
const TILE_SIZE = 20;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 400;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Tile types
const TILE = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    BOULDER: 3,
    LAVA: 4,
    GAS: 5,
    IRONIUM: 10,
    BRONZIUM: 11,
    SILVERIUM: 12,
    GOLDIUM: 13,
    PLATINUM: 14,
    EINSTEINIUM: 15,
    EMERALD: 16,
    RUBY: 17,
    DIAMOND: 18,
    AMAZONITE: 19,
    ARTIFACT_BONES: 20,
    ARTIFACT_CHEST: 21,
    ARTIFACT_SKELETON: 22,
    ARTIFACT_RELIC: 23,
    BUILDING: 30
};

// Mineral data
const MINERALS = {
    [TILE.IRONIUM]: { name: 'Ironium', value: 30, weight: 10, color: '#8B4513' },
    [TILE.BRONZIUM]: { name: 'Bronzium', value: 60, weight: 10, color: '#CD7F32' },
    [TILE.SILVERIUM]: { name: 'Silverium', value: 100, weight: 10, color: '#C0C0C0' },
    [TILE.GOLDIUM]: { name: 'Goldium', value: 250, weight: 20, color: '#FFD700' },
    [TILE.PLATINUM]: { name: 'Platinum', value: 750, weight: 30, color: '#E5E4E2' },
    [TILE.EINSTEINIUM]: { name: 'Einsteinium', value: 2000, weight: 40, color: '#00FF00' },
    [TILE.EMERALD]: { name: 'Emerald', value: 5000, weight: 60, color: '#50C878' },
    [TILE.RUBY]: { name: 'Ruby', value: 20000, weight: 80, color: '#E0115F' },
    [TILE.DIAMOND]: { name: 'Diamond', value: 100000, weight: 100, color: '#B9F2FF' },
    [TILE.AMAZONITE]: { name: 'Amazonite', value: 500000, weight: 120, color: '#00C4B0' }
};

// Upgrade data
const UPGRADES = {
    drill: [
        { name: 'Stock Drill', speed: 1.0, price: 0 },
        { name: 'Silvide Drill', speed: 1.4, price: 750 },
        { name: 'Goldium Drill', speed: 2.0, price: 2000 },
        { name: 'Emerald Drill', speed: 2.5, price: 5000 },
        { name: 'Ruby Drill', speed: 3.5, price: 20000 },
        { name: 'Diamond Drill', speed: 4.75, price: 100000 },
        { name: 'Amazonite Drill', speed: 6.0, price: 500000 }
    ],
    hull: [
        { name: 'Stock Hull', hp: 10, price: 0 },
        { name: 'Ironium Hull', hp: 17, price: 750 },
        { name: 'Bronzium Hull', hp: 30, price: 2000 },
        { name: 'Steel Hull', hp: 50, price: 5000 },
        { name: 'Platinum Hull', hp: 80, price: 20000 },
        { name: 'Einsteinium Hull', hp: 120, price: 100000 },
        { name: 'Energy-Shielded Hull', hp: 180, price: 500000 }
    ],
    fuel: [
        { name: 'Micro Tank', capacity: 10, price: 0 },
        { name: 'Medium Tank', capacity: 15, price: 750 },
        { name: 'Huge Tank', capacity: 25, price: 2000 },
        { name: 'Gigantic Tank', capacity: 40, price: 5000 },
        { name: 'Titanic Tank', capacity: 60, price: 20000 },
        { name: 'Leviathan Tank', capacity: 100, price: 100000 },
        { name: 'Liquid Compression', capacity: 150, price: 500000 }
    ],
    cargo: [
        { name: 'Micro Bay', capacity: 70, price: 0 },
        { name: 'Medium Bay', capacity: 150, price: 750 },
        { name: 'Huge Bay', capacity: 250, price: 2000 },
        { name: 'Gigantic Bay', capacity: 400, price: 5000 },
        { name: 'Titanic Bay', capacity: 700, price: 20000 },
        { name: 'Leviathan Bay', capacity: 1200, price: 100000 }
    ],
    radiator: [
        { name: 'Stock Fan', reduction: 0, price: 0 },
        { name: 'Dual Fans', reduction: 0.10, price: 2000 },
        { name: 'Single Turbine', reduction: 0.25, price: 5000 },
        { name: 'Dual Turbines', reduction: 0.40, price: 20000 },
        { name: 'Puron Cooling', reduction: 0.60, price: 100000 },
        { name: 'Tri-Turbine', reduction: 0.80, price: 500000 }
    ],
    engine: [
        { name: 'Stock Engine', hp: 150, price: 0 },
        { name: 'V4 1600cc', hp: 160, price: 750 },
        { name: 'V4 2.0 Turbo', hp: 170, price: 2000 },
        { name: 'V6 3.8 Ltr', hp: 180, price: 5000 },
        { name: 'V8 Supercharged', hp: 190, price: 20000 },
        { name: 'V12 6.0 Ltr', hp: 200, price: 100000 },
        { name: 'V16 Jag', hp: 210, price: 500000 }
    ]
};

// Artifact data
const ARTIFACTS = {
    [TILE.ARTIFACT_BONES]: { name: 'Dinosaur Bones', cash: 1000, score: 500000, color: '#F5F5DC' },
    [TILE.ARTIFACT_CHEST]: { name: 'Treasure Chest', cash: 5000, score: 500000, color: '#8B4513' },
    [TILE.ARTIFACT_SKELETON]: { name: 'Martian Skeleton', cash: 10000, score: 500000, color: '#90EE90' },
    [TILE.ARTIFACT_RELIC]: { name: 'Religious Artifact', cash: 50000, score: 500000, color: '#FFD700' }
};

// Transmission messages
const TRANSMISSIONS = [
    { depth: 500, speaker: 'Mr. Natas', text: 'Excellent progress! Here\'s a $1,000 bonus.', bonus: 1000 },
    { depth: 1000, speaker: 'Mr. Natas', text: 'You\'re doing splendidly! $3,000 bonus!', bonus: 3000 },
    { depth: 1750, speaker: 'Unknown', text: 'The eyes... Oh my god, THE EYES!!!', bonus: 0 },
    { depth: 6000, speaker: 'Mr. Natas', text: 'That\'s deep enough. Return to the surface.', bonus: 0 },
    { depth: 6200, speaker: 'Mr. Natas', text: 'I warned you. Turn back NOW.', bonus: 0 }
];

// Consumable items
const CONSUMABLES = {
    reserveFuel: { name: 'Reserve Fuel', price: 2000, effect: 25 },
    nanobots: { name: 'Hull Nanobots', price: 7500, effect: 30 },
    dynamite: { name: 'Dynamite', price: 2000, radius: 1 },
    plastic: { name: 'Plastic Explosives', price: 5000, radius: 2 },
    quantumTeleporter: { name: 'Quantum Teleporter', price: 2000 },
    matterTransmitter: { name: 'Matter Transmitter', price: 10000 }
};

// ==================== GAME STATE ====================
let gameState = 'menu';
let world = [];
let camera = { x: 0, y: 0 };

let player = {
    x: WORLD_WIDTH / 2 * TILE_SIZE,
    y: TILE_SIZE,
    vx: 0,
    vy: 0,
    width: TILE_SIZE * 0.9,
    height: TILE_SIZE * 0.9,
    fuel: 10,
    hull: 10,
    maxFuel: 10,
    maxHull: 10,
    cash: 0,
    score: 0,
    cargo: [],
    cargoWeight: 0,
    cargoCapacity: 70,
    drilling: false,
    drillDirection: null,
    drillProgress: 0,
    drillSpeed: 1.0,
    radiatorReduction: 0,
    engineHP: 150,
    maxDepthReached: 0,
    transmissionsShown: [],
    consumables: {
        reserveFuel: 0,
        nanobots: 0,
        dynamite: 0,
        plastic: 0,
        quantumTeleporter: 0,
        matterTransmitter: 0
    },
    upgrades: {
        drill: 0,
        hull: 0,
        fuel: 0,
        cargo: 0,
        radiator: 0,
        engine: 0
    }
};

let particles = [];
let screenShake = { x: 0, y: 0, intensity: 0 };

let keys = {};
let shopOpen = false;
let shopTab = 'upgrades';
let selectedUpgrade = 'drill';
let messages = [];

// Pause menu
let paused = false;
let pauseMenuIndex = 0;
const PAUSE_OPTIONS = ['Resume', 'Restart', 'Quit to Menu'];

// Boss fight
let bossActive = false;
let boss = null;
let bossArenaReached = false;
const BOSS_DEPTH = 6500;

// Earthquakes
let earthquakeTimer = 0;
let earthquakeIntensity = 0;

// Hull damage visual
let hullDamageFlash = 0;

// ==================== WORLD GENERATION ====================
function generateWorld() {
    world = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        const row = [];
        const depth = y * TILE_SIZE;

        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Surface is empty
            if (y === 0) {
                row.push(TILE.EMPTY);
                continue;
            }

            // Buildings at surface (impenetrable foundations for first few rows)
            if (y <= 2 && (x < 5 || (x >= 8 && x <= 13) || (x >= 17 && x <= 22) || (x >= 26 && x <= 31))) {
                row.push(TILE.BUILDING);
                continue;
            }

            // Generate tile based on depth
            row.push(generateTile(depth, x, y));
        }
        world.push(row);
    }
}

function generateTile(depth, x, y) {
    const roll = Math.random();

    // Hazards
    if (depth >= 3100 && roll < (depth >= 5000 ? 0.10 : 0.05)) {
        return TILE.LAVA;
    }
    if (depth >= 4750) {
        const gasChance = depth >= 6500 ? 0.50 : (depth >= 4950 ? 0.25 : 0.05);
        if (roll < gasChance) return TILE.GAS;
    }
    if (depth >= 1500 && roll < (depth >= 4000 ? 0.05 : 0.03)) {
        return TILE.BOULDER;
    }

    // Artifacts (rare, 0.1% chance)
    if (depth >= 100 && Math.random() < 0.001) {
        return rollArtifact();
    }

    // Minerals based on depth
    const mineralRoll = Math.random();
    if (depth >= 25 && mineralRoll < getMineralChance(depth)) {
        return rollMineral(depth);
    }

    // Default: dirt or rock
    const rockChance = 0.2 + (depth / 10000) * 0.1;
    return roll < rockChance ? TILE.ROCK : TILE.DIRT;
}

function rollArtifact() {
    const roll = Math.random();
    if (roll < 0.4) return TILE.ARTIFACT_BONES;
    if (roll < 0.7) return TILE.ARTIFACT_CHEST;
    if (roll < 0.9) return TILE.ARTIFACT_SKELETON;
    return TILE.ARTIFACT_RELIC;
}

function getMineralChance(depth) {
    if (depth < 500) return 0.18;
    if (depth < 1500) return 0.20;
    if (depth < 3000) return 0.22;
    if (depth < 5000) return 0.25;
    return 0.30;
}

function rollMineral(depth) {
    const roll = Math.random();
    let cumulative = 0;

    const mineralTable = [
        { type: TILE.IRONIUM, minDepth: 25, peakDepth: 100, weight: 0.35 },
        { type: TILE.BRONZIUM, minDepth: 25, peakDepth: 200, weight: 0.25 },
        { type: TILE.SILVERIUM, minDepth: 25, peakDepth: 400, weight: 0.20 },
        { type: TILE.GOLDIUM, minDepth: 25, peakDepth: 600, weight: 0.12 },
        { type: TILE.PLATINUM, minDepth: 800, peakDepth: 1700, weight: 0.05 },
        { type: TILE.EINSTEINIUM, minDepth: 1600, peakDepth: 2600, weight: 0.02 },
        { type: TILE.EMERALD, minDepth: 2400, peakDepth: 4000, weight: 0.006 },
        { type: TILE.RUBY, minDepth: 4000, peakDepth: 4800, weight: 0.003 },
        { type: TILE.DIAMOND, minDepth: 4400, peakDepth: 5700, weight: 0.001 },
        { type: TILE.AMAZONITE, minDepth: 5500, peakDepth: 6200, weight: 0.0005 }
    ];

    for (const mineral of mineralTable) {
        if (depth >= mineral.minDepth) {
            cumulative += mineral.weight;
            if (roll < cumulative) return mineral.type;
        }
    }

    return TILE.IRONIUM;
}

// ==================== PLAYER FUNCTIONS ====================
function updatePlayer(dt) {
    if (player.drilling) {
        updateDrilling(dt);
        return;
    }

    // Movement
    const moveSpeed = 150;
    const gravity = 400;
    const thrust = 500;

    // Horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.vx = -moveSpeed;
        // Check for drilling left
        const leftTile = getTileAt(player.x - TILE_SIZE, player.y + player.height / 2);
        if (leftTile && leftTile !== TILE.EMPTY && leftTile !== TILE.BUILDING && leftTile !== TILE.BOULDER) {
            startDrilling('left');
            return;
        }
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.vx = moveSpeed;
        // Check for drilling right
        const rightTile = getTileAt(player.x + player.width + TILE_SIZE * 0.1, player.y + player.height / 2);
        if (rightTile && rightTile !== TILE.EMPTY && rightTile !== TILE.BUILDING && rightTile !== TILE.BOULDER) {
            startDrilling('right');
            return;
        }
    } else {
        player.vx = 0;
    }

    // Vertical movement
    if (keys['ArrowUp'] || keys['KeyW']) {
        // Fly up (uses fuel)
        if (player.fuel > 0) {
            // Engine power affects thrust, weight reduces it
            const engineMultiplier = player.engineHP / 150;
            const weightPenalty = 1 - (player.cargoWeight / player.cargoCapacity) * 0.3;
            const effectiveThrust = thrust * engineMultiplier * weightPenalty;
            player.vy = -effectiveThrust * dt;
            player.fuel -= 0.5 * dt;
            player.fuel = Math.max(0, player.fuel);
        }
    } else if (keys['ArrowDown'] || keys['KeyS']) {
        // Drill down
        const belowTile = getTileAt(player.x + player.width / 2, player.y + player.height + 1);
        if (belowTile && belowTile !== TILE.EMPTY && belowTile !== TILE.BUILDING && belowTile !== TILE.BOULDER) {
            startDrilling('down');
            return;
        }
    }

    // Apply gravity
    player.vy += gravity * dt;

    // Apply velocity with collision
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    // Horizontal collision
    if (!checkCollision(newX, player.y)) {
        player.x = newX;
    } else {
        player.vx = 0;
    }

    // Vertical collision
    if (!checkCollision(player.x, newY)) {
        player.y = newY;
    } else {
        // Fall damage
        if (player.vy > 200) {
            const fallDamage = calculateFallDamage(player.vy);
            player.hull -= fallDamage;
            if (fallDamage > 0) {
                showMessage('-' + fallDamage + ' HULL (Fall)', '#FF0000');
            }
        }
        player.vy = 0;
    }

    // World bounds
    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH * TILE_SIZE - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT * TILE_SIZE - player.height));

    // Moving horizontally uses fuel
    if (player.vx !== 0 && player.fuel > 0) {
        player.fuel -= 0.2 * dt;
        player.fuel = Math.max(0, player.fuel);
    }

    // Check for surface buildings
    if (player.y <= TILE_SIZE * 2) {
        checkSurfaceBuildings();
    }

    // Check death
    if (player.hull <= 0) {
        gameState = 'dead';
    }
}

function calculateFallDamage(velocity) {
    if (velocity <= 200) return 0;
    if (velocity <= 300) return 1;
    if (velocity <= 400) return 2;
    if (velocity <= 500) return 3;
    if (velocity <= 600) return 4;
    return 5;
}

function startDrilling(direction) {
    player.drilling = true;
    player.drillDirection = direction;
    player.drillProgress = 0;
    player.vx = 0;
    player.vy = 0;
}

function updateDrilling(dt) {
    const drillTime = 0.5 / player.drillSpeed;
    player.drillProgress += dt;

    if (player.drillProgress >= drillTime) {
        // Complete drilling
        let targetX, targetY;

        switch (player.drillDirection) {
            case 'left':
                targetX = Math.floor((player.x - TILE_SIZE) / TILE_SIZE);
                targetY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
                player.x -= TILE_SIZE;
                break;
            case 'right':
                targetX = Math.floor((player.x + player.width + 1) / TILE_SIZE);
                targetY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
                player.x += TILE_SIZE;
                break;
            case 'down':
                targetX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
                targetY = Math.floor((player.y + player.height + 1) / TILE_SIZE);
                player.y += TILE_SIZE;
                break;
        }

        if (targetX >= 0 && targetX < WORLD_WIDTH && targetY >= 0 && targetY < WORLD_HEIGHT) {
            const tileType = world[targetY][targetX];
            handleTileDig(tileType, targetY * TILE_SIZE);
            world[targetY][targetX] = TILE.EMPTY;
        }

        player.drilling = false;
        player.drillDirection = null;
    }
}

function handleTileDig(tileType, depth) {
    // Spawn drill particles
    spawnDrillParticles(player.x + player.width / 2, player.y + player.height);

    // Check for mineral
    if (MINERALS[tileType]) {
        const mineral = MINERALS[tileType];
        if (player.cargoWeight + mineral.weight <= player.cargoCapacity) {
            player.cargo.push({ type: tileType, ...mineral });
            player.cargoWeight += mineral.weight;
            showMessage('+' + mineral.name, mineral.color);
            spawnSparkleParticles(player.x + player.width / 2, player.y + player.height, mineral.color);
        } else {
            showMessage('CARGO FULL!', '#FF0000');
        }
    }

    // Check for artifacts (instant cash, no cargo space needed)
    if (ARTIFACTS[tileType]) {
        const artifact = ARTIFACTS[tileType];
        player.cash += artifact.cash;
        player.score += artifact.score;
        showMessage('ARTIFACT: ' + artifact.name + '!', artifact.color);
        showMessage('+$' + artifact.cash.toLocaleString(), '#00FF00');
        triggerScreenShake(0.5);
        spawnSparkleParticles(player.x + player.width / 2, player.y + player.height, artifact.color);
    }

    // Check for hazards
    if (tileType === TILE.LAVA) {
        const damage = Math.floor(58 * (1 - player.radiatorReduction));
        player.hull -= damage;
        showMessage('-' + damage + ' LAVA!', '#FF4500');
        triggerScreenShake(0.3);
    }

    if (tileType === TILE.GAS) {
        const baseDamage = (depth + 3000) / 15;
        const damage = Math.floor(baseDamage * (1 - player.radiatorReduction));
        player.hull -= damage;
        showMessage('-' + damage + ' GAS!', '#FFFF00');
        triggerScreenShake(0.4);
    }

    // Track max depth and check transmissions
    const currentDepth = Math.floor(depth / TILE_SIZE) * 13;
    if (currentDepth > player.maxDepthReached) {
        player.maxDepthReached = currentDepth;
        checkTransmissions(currentDepth);

        // Boss trigger at boss depth
        if (currentDepth >= BOSS_DEPTH && !bossArenaReached) {
            bossArenaReached = true;
            spawnBoss();
        }
    }

    // Boss damage from player drill
    if (bossActive && boss && player.drilling) {
        const dist = Math.sqrt(
            Math.pow(player.x - boss.x, 2) +
            Math.pow(player.y - boss.y, 2)
        );
        if (dist < 50) {
            boss.hp -= 50 * player.drillSpeed;
            showMessage('HIT! -50', '#ffff00');
            triggerScreenShake(0.3);

            // Check boss death
            if (boss.hp <= 0) {
                bossActive = false;
                boss = null;
                gameState = 'victory';
                showMessage('SATAN DEFEATED!', '#00ff00');
                player.cash += 1000000;
                player.score += 10000000;
            }
        }
    }
}

// Particle system
function spawnDrillParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 100,
            vy: -Math.random() * 50,
            life: 0.5,
            color: '#8B4513',
            size: 2 + Math.random() * 2
        });
    }
}

function spawnSparkleParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 0.8,
            color: color,
            size: 3 + Math.random() * 3
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Boss projectiles don't have gravity
        if (!p.isBossProjectile) {
            p.vy += 200 * dt; // gravity
        }

        p.life -= dt;

        // Boss projectile collision with player
        if (p.isBossProjectile) {
            const dist = Math.sqrt(
                Math.pow(player.x - p.x, 2) +
                Math.pow(player.y - p.y, 2)
            );
            if (dist < 25) {
                takeDamage(10);
                particles.splice(i, 1);
                continue;
            }
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - camera.x - p.size / 2, p.y - camera.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// Screen shake
function triggerScreenShake(intensity) {
    screenShake.intensity = intensity;
}

function updateScreenShake(dt) {
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 20;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 20;
        screenShake.intensity -= dt * 2;
        if (screenShake.intensity < 0) screenShake.intensity = 0;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

// Transmission system
function checkTransmissions(depth) {
    for (const transmission of TRANSMISSIONS) {
        if (depth >= transmission.depth && !player.transmissionsShown.includes(transmission.depth)) {
            player.transmissionsShown.push(transmission.depth);
            showTransmission(transmission);
            break;
        }
    }
}

function showTransmission(transmission) {
    showMessage('[' + transmission.speaker + ']', '#FF00FF');
    showMessage(transmission.text, '#FFFFFF');
    if (transmission.bonus > 0) {
        player.cash += transmission.bonus;
        showMessage('+$' + transmission.bonus.toLocaleString() + ' BONUS!', '#00FF00');
    }
    triggerScreenShake(0.2);
}

// Consumable usage functions
function useReserveFuel() {
    if (player.consumables.reserveFuel > 0) {
        player.consumables.reserveFuel--;
        const fuelAdded = Math.min(25, player.maxFuel - player.fuel);
        player.fuel = Math.min(player.fuel + 25, player.maxFuel);
        showMessage('+' + fuelAdded.toFixed(1) + 'L Fuel!', '#00FF00');
    } else {
        showMessage('No Reserve Fuel!', '#FF0000');
    }
}

function useNanobots() {
    if (player.consumables.nanobots > 0) {
        player.consumables.nanobots--;
        const hullAdded = Math.min(30, player.maxHull - player.hull);
        player.hull = Math.min(player.hull + 30, player.maxHull);
        showMessage('+' + hullAdded + ' Hull!', '#00BFFF');
        spawnSparkleParticles(player.x + player.width / 2, player.y + player.height / 2, '#00BFFF');
    } else {
        showMessage('No Nanobots!', '#FF0000');
    }
}

function useDynamite() {
    if (player.consumables.dynamite > 0 && !player.drilling && player.vy === 0) {
        player.consumables.dynamite--;
        explodeArea(Math.floor(player.x / TILE_SIZE), Math.floor((player.y + player.height) / TILE_SIZE) + 1, 1);
        showMessage('BOOM!', '#FF4500');
        triggerScreenShake(0.6);
    } else if (player.consumables.dynamite <= 0) {
        showMessage('No Dynamite!', '#FF0000');
    }
}

function usePlastic() {
    if (player.consumables.plastic > 0 && !player.drilling && player.vy === 0) {
        player.consumables.plastic--;
        explodeArea(Math.floor(player.x / TILE_SIZE), Math.floor((player.y + player.height) / TILE_SIZE) + 1, 2);
        showMessage('MASSIVE BOOM!', '#FF4500');
        triggerScreenShake(0.8);
    } else if (player.consumables.plastic <= 0) {
        showMessage('No Plastic Explosives!', '#FF0000');
    }
}

function explodeArea(centerX, centerY, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const tx = centerX + dx;
            const ty = centerY + dy;
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                const tile = world[ty][tx];
                if (tile !== TILE.BUILDING && tile !== TILE.EMPTY) {
                    // Collect minerals if they're destroyed
                    if (MINERALS[tile]) {
                        const mineral = MINERALS[tile];
                        if (player.cargoWeight + mineral.weight <= player.cargoCapacity) {
                            player.cargo.push({ type: tile, ...mineral });
                            player.cargoWeight += mineral.weight;
                        }
                    }
                    if (ARTIFACTS[tile]) {
                        const artifact = ARTIFACTS[tile];
                        player.cash += artifact.cash;
                        player.score += artifact.score;
                    }
                    world[ty][tx] = TILE.EMPTY;
                    spawnDrillParticles(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }
}

function useQuantumTeleporter() {
    if (player.consumables.quantumTeleporter > 0) {
        player.consumables.quantumTeleporter--;
        player.y = 100 + Math.random() * 200; // Teleport to around -100 ft
        player.x = (WORLD_WIDTH / 2) * TILE_SIZE;
        showMessage('TELEPORTED!', '#FF00FF');
        triggerScreenShake(0.3);
    } else {
        showMessage('No Quantum Teleporter!', '#FF0000');
    }
}

function useMatterTransmitter() {
    if (player.consumables.matterTransmitter > 0) {
        player.consumables.matterTransmitter--;
        player.y = TILE_SIZE;
        player.x = 50; // Near fuel station
        player.vy = 0;
        player.vx = 0;
        showMessage('TRANSMITTED TO SURFACE!', '#00FF00');
        triggerScreenShake(0.3);
    } else {
        showMessage('No Matter Transmitter!', '#FF0000');
    }
}

function checkCollision(x, y) {
    // Check corners
    const corners = [
        { x: x, y: y },
        { x: x + player.width, y: y },
        { x: x, y: y + player.height },
        { x: x + player.width, y: y + player.height }
    ];

    for (const corner of corners) {
        const tileX = Math.floor(corner.x / TILE_SIZE);
        const tileY = Math.floor(corner.y / TILE_SIZE);

        if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
            return true;
        }

        const tile = world[tileY][tileX];
        if (tile !== TILE.EMPTY) {
            return true;
        }
    }

    return false;
}

function getTileAt(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
        return null;
    }

    return world[tileY][tileX];
}

// ==================== SURFACE BUILDINGS ====================
function checkSurfaceBuildings() {
    const playerTileX = Math.floor(player.x / TILE_SIZE);

    // Fuel Station (left side)
    if (playerTileX >= 0 && playerTileX <= 4 && player.y <= TILE_SIZE) {
        if (keys['KeyE'] && !shopOpen) {
            openFuelStation();
        }
    }

    // Mineral Processor
    if (playerTileX >= 8 && playerTileX <= 13 && player.y <= TILE_SIZE) {
        if (keys['KeyE'] && !shopOpen) {
            sellMinerals();
        }
    }

    // Junk Shop (upgrades)
    if (playerTileX >= 17 && playerTileX <= 22 && player.y <= TILE_SIZE) {
        if (keys['KeyE'] && !shopOpen) {
            shopOpen = true;
            shopTab = 'upgrades';
        }
    }

    // Repair Shop
    if (playerTileX >= 26 && playerTileX <= 31 && player.y <= TILE_SIZE) {
        if (keys['KeyE'] && !shopOpen) {
            openRepairShop();
        }
    }
}

function openFuelStation() {
    const fuelNeeded = player.maxFuel - player.fuel;
    const cost = Math.ceil(fuelNeeded * 2);

    if (player.cash >= cost && fuelNeeded > 0) {
        player.cash -= cost;
        player.fuel = player.maxFuel;
        showMessage('FUEL FILLED! -$' + cost, '#00FF00');
    } else if (fuelNeeded <= 0) {
        showMessage('Tank already full!', '#FFFF00');
    } else {
        showMessage('Not enough cash!', '#FF0000');
    }
}

function sellMinerals() {
    if (player.cargo.length === 0) {
        showMessage('No minerals to sell!', '#FFFF00');
        return;
    }

    let total = 0;
    for (const mineral of player.cargo) {
        total += mineral.value;
        player.score += mineral.value * 10;
    }

    player.cash += total;
    player.cargo = [];
    player.cargoWeight = 0;
    showMessage('SOLD! +$' + total, '#00FF00');
}

function openRepairShop() {
    const hullNeeded = player.maxHull - player.hull;
    const cost = hullNeeded * 15;

    if (player.cash >= cost && hullNeeded > 0) {
        player.cash -= cost;
        player.hull = player.maxHull;
        showMessage('HULL REPAIRED! -$' + cost, '#00FF00');
    } else if (hullNeeded <= 0) {
        showMessage('Hull already full!', '#FFFF00');
    } else {
        showMessage('Not enough cash!', '#FF0000');
    }
}

function buyUpgrade(category) {
    const currentTier = player.upgrades[category];
    const upgrades = UPGRADES[category];

    if (currentTier >= upgrades.length - 1) {
        showMessage('Already max level!', '#FFFF00');
        return;
    }

    const nextUpgrade = upgrades[currentTier + 1];

    if (player.cash >= nextUpgrade.price) {
        player.cash -= nextUpgrade.price;
        player.upgrades[category] = currentTier + 1;

        // Apply upgrade
        switch (category) {
            case 'drill':
                player.drillSpeed = nextUpgrade.speed;
                break;
            case 'hull':
                player.maxHull = nextUpgrade.hp;
                player.hull = player.maxHull;
                break;
            case 'fuel':
                player.maxFuel = nextUpgrade.capacity;
                player.fuel = player.maxFuel;
                break;
            case 'cargo':
                player.cargoCapacity = nextUpgrade.capacity;
                break;
            case 'radiator':
                player.radiatorReduction = nextUpgrade.reduction;
                break;
            case 'engine':
                player.engineHP = nextUpgrade.hp;
                break;
        }

        showMessage('UPGRADED: ' + nextUpgrade.name, '#00FF00');
    } else {
        showMessage('Not enough cash!', '#FF0000');
    }
}

function buyConsumable(itemKey) {
    const prices = {
        reserveFuel: 2000,
        nanobots: 7500,
        dynamite: 2000,
        plastic: 5000,
        quantumTeleporter: 2000,
        matterTransmitter: 10000
    };

    const price = prices[itemKey];
    if (player.cash >= price) {
        player.cash -= price;
        player.consumables[itemKey]++;
        showMessage('Bought ' + itemKey + '!', '#00FF00');
    } else {
        showMessage('Not enough cash!', '#FF0000');
    }
}

// ==================== MESSAGES ====================
function showMessage(text, color) {
    messages.push({
        text: text,
        color: color || '#FFFFFF',
        timer: 2,
        y: 0
    });
}

function updateMessages(dt) {
    for (let i = messages.length - 1; i >= 0; i--) {
        messages[i].timer -= dt;
        messages[i].y += 30 * dt;
        if (messages[i].timer <= 0) {
            messages.splice(i, 1);
        }
    }
}

// ==================== CAMERA ====================
function updateCamera() {
    // Center camera on player
    camera.x = player.x - SCREEN_WIDTH / 2 + player.width / 2;
    camera.y = player.y - SCREEN_HEIGHT / 3;

    // Clamp to world bounds
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - SCREEN_WIDTH));
    camera.y = Math.max(-100, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - SCREEN_HEIGHT));
}

// ==================== RENDERING ====================
function render() {
    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Clear
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (gameState === 'menu') {
        ctx.restore();
        renderMenu();
        return;
    }

    if (gameState === 'dead') {
        ctx.restore();
        renderGameOver();
        return;
    }

    // Draw sky
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, SCREEN_WIDTH, Math.max(0, -camera.y));

    // Draw world
    renderWorld();

    // Draw surface buildings
    renderBuildings();

    // Draw player
    renderPlayer();

    // Draw boss
    if (bossActive && boss) {
        renderBoss();
    }

    // Draw particles
    renderParticles();

    // Hull damage visual (red overlay)
    if (hullDamageFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${hullDamageFlash * 0.3})`;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    ctx.restore();

    // Draw HUD (not affected by screen shake)
    renderHUD();

    // Draw messages
    renderMessages();

    // Draw shop
    if (shopOpen) {
        renderShop();
    }

    // Draw pause menu
    if (paused) {
        renderPauseMenu();
    }

    // Draw victory screen
    if (gameState === 'victory') {
        renderVictory();
    }
}

function renderBoss() {
    const screenX = boss.x - camera.x;
    const screenY = boss.y - camera.y;

    // Boss body (red demon)
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.moveTo(screenX - 20, screenY - 20);
    ctx.lineTo(screenX - 30, screenY - 45);
    ctx.lineTo(screenX - 10, screenY - 25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX + 20, screenY - 20);
    ctx.lineTo(screenX + 30, screenY - 45);
    ctx.lineTo(screenX + 10, screenY - 25);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(screenX - 10, screenY - 8, 6, 0, Math.PI * 2);
    ctx.arc(screenX + 10, screenY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Boss health bar
    const barWidth = 80;
    const barHeight = 8;
    const healthPercent = boss.hp / boss.maxHP;
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - barWidth/2, screenY - 60, barWidth, barHeight);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(screenX - barWidth/2, screenY - 60, barWidth * healthPercent, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(screenX - barWidth/2, screenY - 60, barWidth, barHeight);

    // Boss name
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SATAN', screenX, screenY - 65);
}

function renderPauseMenu() {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title
    ctx.fillStyle = '#ff8800';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', SCREEN_WIDTH / 2, 200);

    // Menu options
    for (let i = 0; i < PAUSE_OPTIONS.length; i++) {
        const y = 300 + i * 50;
        ctx.fillStyle = i === pauseMenuIndex ? '#ffff00' : '#aaaaaa';
        ctx.font = '28px Arial';
        const prefix = i === pauseMenuIndex ? '> ' : '  ';
        ctx.fillText(prefix + PAUSE_OPTIONS[i], SCREEN_WIDTH / 2, y);
    }

    // Controls hint
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('W/S or Arrow Keys to navigate, SPACE to select', SCREEN_WIDTH / 2, 500);
}

function renderVictory() {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Victory text
    ctx.fillStyle = '#ffdd00';
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', SCREEN_WIDTH / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.fillText('You defeated Satan!', SCREEN_WIDTH / 2, 280);

    // Stats
    ctx.font = '20px Arial';
    ctx.fillText('Final Score: ' + player.score.toLocaleString(), SCREEN_WIDTH / 2, 340);
    ctx.fillText('Cash Earned: $' + player.cash.toLocaleString(), SCREEN_WIDTH / 2, 370);
    ctx.fillText('Max Depth: ' + Math.floor(player.maxDepthReached) + 'm', SCREEN_WIDTH / 2, 400);

    // Restart hint
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to play again', SCREEN_WIDTH / 2, 480);
}

function renderWorld() {
    const startTileX = Math.floor(camera.x / TILE_SIZE);
    const startTileY = Math.floor(camera.y / TILE_SIZE);
    const endTileX = Math.ceil((camera.x + SCREEN_WIDTH) / TILE_SIZE) + 1;
    const endTileY = Math.ceil((camera.y + SCREEN_HEIGHT) / TILE_SIZE) + 1;

    for (let y = Math.max(0, startTileY); y < Math.min(WORLD_HEIGHT, endTileY); y++) {
        for (let x = Math.max(0, startTileX); x < Math.min(WORLD_WIDTH, endTileX); x++) {
            const tile = world[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            let color;
            switch (tile) {
                case TILE.EMPTY:
                    continue;
                case TILE.DIRT:
                    color = '#8B4513';
                    break;
                case TILE.ROCK:
                    color = '#696969';
                    break;
                case TILE.BOULDER:
                    color = '#4a4a4a';
                    break;
                case TILE.LAVA:
                    color = '#FF4500';
                    break;
                case TILE.GAS:
                    color = '#8B4513'; // Invisible - looks like dirt
                    break;
                case TILE.BUILDING:
                    color = '#555555';
                    break;
                default:
                    // Minerals
                    if (MINERALS[tile]) {
                        color = MINERALS[tile].color;
                    } else if (ARTIFACTS[tile]) {
                        color = ARTIFACTS[tile].color;
                    } else {
                        color = '#8B4513';
                    }
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Add some texture
            if (tile === TILE.DIRT || tile === TILE.GAS) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
            }
        }
    }
}

function renderBuildings() {
    const buildingY = -camera.y - 40;

    // Only render if surface is visible
    if (buildingY > SCREEN_HEIGHT) return;

    // Fuel Station
    ctx.fillStyle = '#444444';
    ctx.fillRect(0 - camera.x, buildingY, 100, 40);
    ctx.fillStyle = '#00FF00';
    ctx.font = '10px Courier';
    ctx.fillText('FUEL', 30 - camera.x, buildingY + 25);

    // Mineral Processor
    ctx.fillStyle = '#444444';
    ctx.fillRect(160 - camera.x, buildingY, 120, 40);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('SELL', 200 - camera.x, buildingY + 25);

    // Junk Shop
    ctx.fillStyle = '#444444';
    ctx.fillRect(340 - camera.x, buildingY, 120, 40);
    ctx.fillStyle = '#00BFFF';
    ctx.fillText('SHOP', 380 - camera.x, buildingY + 25);

    // Repair Shop
    ctx.fillStyle = '#444444';
    ctx.fillRect(520 - camera.x, buildingY, 120, 40);
    ctx.fillStyle = '#FF6347';
    ctx.fillText('REPAIR', 555 - camera.x, buildingY + 25);
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Pod body
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(screenX, screenY, player.width, player.height);

    // Cockpit
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(screenX + 3, screenY + 2, player.width - 6, player.height / 3);

    // Drill
    ctx.fillStyle = '#808080';
    if (player.drilling) {
        switch (player.drillDirection) {
            case 'down':
                ctx.fillRect(screenX + player.width / 2 - 3, screenY + player.height, 6, 8);
                break;
            case 'left':
                ctx.fillRect(screenX - 8, screenY + player.height / 2 - 3, 8, 6);
                break;
            case 'right':
                ctx.fillRect(screenX + player.width, screenY + player.height / 2 - 3, 8, 6);
                break;
        }
    }
}

function renderHUD() {
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, 50);
    ctx.fillRect(0, SCREEN_HEIGHT - 60, SCREEN_WIDTH, 60);

    ctx.font = '14px Courier';

    // Top bar
    const depth = Math.floor(player.y / TILE_SIZE) * 13;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('DEPTH: ' + depth + ' ft', 20, 25);
    ctx.fillText('CASH: $' + player.cash.toLocaleString(), 200, 25);
    ctx.fillText('SCORE: ' + player.score.toLocaleString(), 400, 25);

    // Bottom bar - Fuel
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, SCREEN_HEIGHT - 50, 200, 20);
    const fuelPercent = player.fuel / player.maxFuel;
    ctx.fillStyle = fuelPercent < 0.2 ? '#FF0000' : '#00FF00';
    ctx.fillRect(20, SCREEN_HEIGHT - 50, 200 * fuelPercent, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('FUEL: ' + player.fuel.toFixed(1) + '/' + player.maxFuel, 25, SCREEN_HEIGHT - 35);

    // Bottom bar - Hull
    ctx.fillStyle = '#333333';
    ctx.fillRect(250, SCREEN_HEIGHT - 50, 200, 20);
    const hullPercent = player.hull / player.maxHull;
    ctx.fillStyle = hullPercent < 0.25 ? '#FF0000' : '#00BFFF';
    ctx.fillRect(250, SCREEN_HEIGHT - 50, 200 * hullPercent, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('HULL: ' + player.hull + '/' + player.maxHull, 255, SCREEN_HEIGHT - 35);

    // Bottom bar - Cargo
    ctx.fillStyle = '#333333';
    ctx.fillRect(480, SCREEN_HEIGHT - 50, 200, 20);
    const cargoPercent = player.cargoWeight / player.cargoCapacity;
    ctx.fillStyle = cargoPercent >= 1 ? '#FF0000' : '#FFD700';
    ctx.fillRect(480, SCREEN_HEIGHT - 50, 200 * Math.min(1, cargoPercent), 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('CARGO: ' + player.cargoWeight + '/' + player.cargoCapacity + ' kg', 485, SCREEN_HEIGHT - 35);

    // Consumables display
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Courier';
    let itemsText = '';
    if (player.consumables.nanobots > 0) itemsText += 'R:Nano(' + player.consumables.nanobots + ') ';
    if (player.consumables.reserveFuel > 0) itemsText += 'F:Fuel(' + player.consumables.reserveFuel + ') ';
    if (player.consumables.dynamite > 0) itemsText += 'Q:Dyn(' + player.consumables.dynamite + ') ';
    if (player.consumables.plastic > 0) itemsText += 'Sh+Q:Plas(' + player.consumables.plastic + ') ';
    if (player.consumables.quantumTeleporter > 0) itemsText += 'T:QTele(' + player.consumables.quantumTeleporter + ') ';
    if (player.consumables.matterTransmitter > 0) itemsText += 'Sh+T:MTran(' + player.consumables.matterTransmitter + ') ';
    if (itemsText) {
        ctx.fillText('ITEMS: ' + itemsText, 700 - ctx.measureText('ITEMS: ' + itemsText).width, 25);
    }

    // Controls hint
    ctx.fillStyle = '#888888';
    ctx.font = '10px Courier';
    ctx.fillText('Arrows: Move/Drill | E: Interact | R/F/Q/T: Items', 20, SCREEN_HEIGHT - 10);
}

function renderMessages() {
    for (const msg of messages) {
        const alpha = Math.min(1, msg.timer);
        ctx.fillStyle = msg.color;
        ctx.globalAlpha = alpha;
        ctx.font = '16px Courier';
        ctx.fillText(msg.text, SCREEN_WIDTH / 2 - 50, 100 + msg.y);
    }
    ctx.globalAlpha = 1;
}

function renderShop() {
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(50, 30, 700, 540);

    ctx.fillStyle = '#00BFFF';
    ctx.font = '20px Courier';
    ctx.fillText('JUNK SHOP', 340, 60);

    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Courier';
    ctx.fillText('Cash: $' + player.cash.toLocaleString(), 70, 85);

    // Tab buttons
    ctx.fillStyle = shopTab === 'upgrades' ? '#00BFFF' : '#444444';
    ctx.fillRect(70, 95, 100, 25);
    ctx.fillStyle = shopTab === 'consumables' ? '#00BFFF' : '#444444';
    ctx.fillRect(180, 95, 100, 25);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Courier';
    ctx.fillText('UPGRADES', 80, 112);
    ctx.fillText('ITEMS', 200, 112);
    ctx.fillStyle = '#888888';
    ctx.fillText('[TAB to switch]', 300, 112);

    if (shopTab === 'upgrades') {
        // Upgrade categories
        const categories = ['drill', 'hull', 'fuel', 'cargo', 'radiator', 'engine'];
        let y = 145;

        for (const cat of categories) {
            const currentTier = player.upgrades[cat];
            const upgrades = UPGRADES[cat];
            const current = upgrades[currentTier];
            const next = upgrades[currentTier + 1];

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '13px Courier';
            ctx.fillText(cat.toUpperCase() + ': ' + current.name, 70, y);

            if (next) {
                ctx.fillStyle = player.cash >= next.price ? '#00FF00' : '#FF0000';
                ctx.fillText('Next: ' + next.name + ' - $' + next.price.toLocaleString(), 320, y);
                ctx.fillStyle = '#888888';
                ctx.fillText('[' + (categories.indexOf(cat) + 1) + ']', 680, y);
            } else {
                ctx.fillStyle = '#888888';
                ctx.fillText('MAX LEVEL', 320, y);
            }

            y += 35;
        }

        ctx.fillStyle = '#888888';
        ctx.font = '11px Courier';
        ctx.fillText('Press 1-6 to buy upgrade', 70, 370);
    } else {
        // Consumables shop
        const items = [
            { key: 'reserveFuel', name: 'Reserve Fuel (+25L)', price: 2000, owned: player.consumables.reserveFuel },
            { key: 'nanobots', name: 'Hull Nanobots (+30HP)', price: 7500, owned: player.consumables.nanobots },
            { key: 'dynamite', name: 'Dynamite (3x3)', price: 2000, owned: player.consumables.dynamite },
            { key: 'plastic', name: 'Plastic Explosives (5x5)', price: 5000, owned: player.consumables.plastic },
            { key: 'quantumTeleporter', name: 'Quantum Teleporter', price: 2000, owned: player.consumables.quantumTeleporter },
            { key: 'matterTransmitter', name: 'Matter Transmitter', price: 10000, owned: player.consumables.matterTransmitter }
        ];

        let y = 145;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '13px Courier';
            ctx.fillText(item.name, 70, y);
            ctx.fillStyle = player.cash >= item.price ? '#00FF00' : '#FF0000';
            ctx.fillText('$' + item.price.toLocaleString(), 350, y);
            ctx.fillStyle = '#FFFF00';
            ctx.fillText('Owned: ' + item.owned, 480, y);
            ctx.fillStyle = '#888888';
            ctx.fillText('[' + (i + 1) + ']', 680, y);
            y += 35;
        }

        ctx.fillStyle = '#888888';
        ctx.font = '11px Courier';
        ctx.fillText('Press 1-6 to buy item', 70, 370);
    }

    // Controls help
    ctx.fillStyle = '#666666';
    ctx.font = '10px Courier';
    ctx.fillText('IN GAME: R=Nanobots | F=Fuel | Q=Dynamite | Shift+Q=Plastic | T=Teleport | Shift+T=Transmitter', 70, 400);
    ctx.fillText('ESC to close shop', 70, 420);
}

function renderMenu() {
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#FFD700';
    ctx.font = '48px Courier';
    ctx.fillText('MARS DIGGER', 230, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Courier';
    ctx.fillText('A Mining Adventure', 280, 250);

    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Courier';
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
        ctx.fillText('Press SPACE to Start', 290, 350);
    }

    ctx.fillStyle = '#888888';
    ctx.font = '14px Courier';
    ctx.fillText('CONTROLS:', 320, 420);
    ctx.fillText('Arrow Keys = Move & Drill', 270, 450);
    ctx.fillText('UP = Fly (uses fuel)', 290, 475);
    ctx.fillText('E = Interact with buildings', 270, 500);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#FF0000';
    ctx.font = '48px Courier';
    ctx.fillText('GAME OVER', 270, 250);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Courier';
    ctx.fillText('Final Score: ' + player.score.toLocaleString(), 280, 320);
    ctx.fillText('Final Cash: $' + player.cash.toLocaleString(), 280, 350);

    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Courier';
    ctx.fillText('Press SPACE to restart', 290, 450);
}

// ==================== INPUT ====================
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (gameState === 'menu' && e.code === 'Space') {
        gameState = 'playing';
        generateWorld();
    }

    if ((gameState === 'dead' || gameState === 'gameover') && e.code === 'Space') {
        resetGame();
        gameState = 'playing';
        generateWorld();
    }

    if (gameState === 'victory' && e.code === 'Space') {
        resetGame();
        gameState = 'playing';
        generateWorld();
    }

    if (shopOpen) {
        if (e.code === 'Escape') {
            shopOpen = false;
        }
        if (e.code === 'Tab') {
            e.preventDefault();
            shopTab = shopTab === 'upgrades' ? 'consumables' : 'upgrades';
        }
        if (shopTab === 'upgrades') {
            if (e.code === 'Digit1') buyUpgrade('drill');
            if (e.code === 'Digit2') buyUpgrade('hull');
            if (e.code === 'Digit3') buyUpgrade('fuel');
            if (e.code === 'Digit4') buyUpgrade('cargo');
            if (e.code === 'Digit5') buyUpgrade('radiator');
            if (e.code === 'Digit6') buyUpgrade('engine');
        } else {
            if (e.code === 'Digit1') buyConsumable('reserveFuel');
            if (e.code === 'Digit2') buyConsumable('nanobots');
            if (e.code === 'Digit3') buyConsumable('dynamite');
            if (e.code === 'Digit4') buyConsumable('plastic');
            if (e.code === 'Digit5') buyConsumable('quantumTeleporter');
            if (e.code === 'Digit6') buyConsumable('matterTransmitter');
        }
    }

    // Consumable usage while playing
    if (gameState === 'playing' && !shopOpen) {
        if (e.code === 'KeyR') useNanobots();
        if (e.code === 'KeyF') useReserveFuel();
        if (e.code === 'KeyQ' && !e.shiftKey) useDynamite();
        if (e.code === 'KeyQ' && e.shiftKey) usePlastic();
        if (e.code === 'KeyT' && !e.shiftKey) useQuantumTeleporter();
        if (e.code === 'KeyT' && e.shiftKey) useMatterTransmitter();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

canvas.addEventListener('click', () => {
    if (gameState === 'menu') {
        gameState = 'playing';
        generateWorld();
    }
});

function resetGame() {
    player = {
        x: WORLD_WIDTH / 2 * TILE_SIZE,
        y: TILE_SIZE,
        vx: 0,
        vy: 0,
        width: TILE_SIZE * 0.9,
        height: TILE_SIZE * 0.9,
        fuel: 10,
        hull: 10,
        maxFuel: 10,
        maxHull: 10,
        cash: 0,
        score: 0,
        cargo: [],
        cargoWeight: 0,
        cargoCapacity: 70,
        drilling: false,
        drillDirection: null,
        drillProgress: 0,
        drillSpeed: 1.0,
        radiatorReduction: 0,
        engineHP: 150,
        maxDepthReached: 0,
        transmissionsShown: [],
        consumables: {
            reserveFuel: 0,
            nanobots: 0,
            dynamite: 0,
            plastic: 0,
            quantumTeleporter: 0,
            matterTransmitter: 0
        },
        upgrades: {
            drill: 0,
            hull: 0,
            fuel: 0,
            cargo: 0,
            radiator: 0,
            engine: 0
        }
    };
    messages = [];
    particles = [];
    screenShake = { x: 0, y: 0, intensity: 0 };
    shopOpen = false;
    shopTab = 'upgrades';

    // Reset boss state
    bossActive = false;
    boss = null;
    bossArenaReached = false;

    // Reset earthquake state
    earthquakeTimer = 0;
    earthquakeIntensity = 0;

    // Reset damage flash
    hullDamageFlash = 0;
    paused = false;
}

// ==================== GAME LOOP ====================
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Pause handling
    if (keys['Escape'] && gameState === 'playing' && !shopOpen) {
        paused = !paused;
        pauseMenuIndex = 0;
        keys['Escape'] = false;
    }

    if (paused) {
        // Pause menu input
        if (keys['ArrowUp'] || keys['KeyW']) {
            pauseMenuIndex = (pauseMenuIndex - 1 + PAUSE_OPTIONS.length) % PAUSE_OPTIONS.length;
            keys['ArrowUp'] = false;
            keys['KeyW'] = false;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            pauseMenuIndex = (pauseMenuIndex + 1) % PAUSE_OPTIONS.length;
            keys['ArrowDown'] = false;
            keys['KeyS'] = false;
        }
        if (keys['Enter'] || keys['Space']) {
            handlePauseSelection();
            keys['Enter'] = false;
            keys['Space'] = false;
        }
        render();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'playing' && !shopOpen) {
        updatePlayer(dt);
        updateCamera();
        updateEarthquakes(dt);
        updateBoss(dt);
        updateHullDamageFlash(dt);
    }

    updateMessages(dt);
    updateParticles(dt);
    updateScreenShake(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function handlePauseSelection() {
    switch (pauseMenuIndex) {
        case 0: // Resume
            paused = false;
            break;
        case 1: // Restart
            paused = false;
            startGame();
            break;
        case 2: // Quit to Menu
            paused = false;
            gameState = 'menu';
            break;
    }
}

function updateEarthquakes(dt) {
    const depth = player.y;

    // Earthquakes start at depth 3000
    if (depth > 3000) {
        earthquakeTimer -= dt;
        if (earthquakeTimer <= 0) {
            // Random earthquake interval (30-120 seconds)
            earthquakeTimer = 30 + Math.random() * 90;
            earthquakeIntensity = 0.5 + Math.random() * 0.5;

            // Trigger earthquake
            triggerEarthquake();
        }
    }

    // Decay earthquake intensity
    if (earthquakeIntensity > 0) {
        earthquakeIntensity -= dt * 0.3;
        screenShake.intensity = Math.max(screenShake.intensity, earthquakeIntensity * 5);
    }
}

function triggerEarthquake() {
    showMessage('EARTHQUAKE!', '#ff4444');

    // Drop loose rocks near player
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);

    for (let ox = -3; ox <= 3; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
            const tx = playerTileX + ox;
            const ty = playerTileY + oy;
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                // Small chance to collapse dirt/rock into empty space below
                if (world[ty][tx] === TILE.DIRT || world[ty][tx] === TILE.ROCK) {
                    if (ty + 1 < WORLD_HEIGHT && world[ty + 1][tx] === TILE.EMPTY && Math.random() < 0.1) {
                        world[ty + 1][tx] = world[ty][tx];
                        world[ty][tx] = TILE.EMPTY;
                    }
                }
            }
        }
    }

    // Particles for earthquake dust
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x + (Math.random() - 0.5) * 200,
            y: player.y + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 30,
            vy: -20 - Math.random() * 30,
            life: 2,
            maxLife: 2,
            color: '#8B4513',
            size: 2 + Math.random() * 3
        });
    }
}

function updateHullDamageFlash(dt) {
    if (hullDamageFlash > 0) {
        hullDamageFlash -= dt * 2;
    }
}

function updateBoss(dt) {
    if (!bossActive || !boss) return;

    // Boss AI
    boss.attackTimer -= dt;

    // Move towards player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 100) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
    }

    // Attack pattern
    if (boss.attackTimer <= 0) {
        boss.attackTimer = 2 + Math.random() * 2;

        if (boss.phase === 1) {
            // Phase 1: Fire projectiles
            bossFireProjectile();
        } else {
            // Phase 2: Slam attack + projectiles
            if (Math.random() < 0.5) {
                bossSlam();
            } else {
                bossFireProjectile();
                bossFireProjectile();
            }
        }
    }

    // Phase transition at 50% health
    if (boss.hp <= boss.maxHP / 2 && boss.phase === 1) {
        boss.phase = 2;
        boss.speed = 60;
        showMessage('SATAN ENTERS PHASE 2!', '#ff0000');
    }

    // Boss collision with player
    if (Math.abs(player.x - boss.x) < 30 && Math.abs(player.y - boss.y) < 30) {
        takeDamage(15);
    }
}

function bossFireProjectile() {
    if (!boss) return;
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    particles.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 150,
        vy: Math.sin(angle) * 150,
        life: 3,
        maxLife: 3,
        color: '#ff4400',
        size: 8,
        isBossProjectile: true
    });
}

function bossSlam() {
    if (!boss) return;
    screenShake.intensity = 10;
    showMessage('GROUND SLAM!', '#ff0000');

    // Damage if player is on ground
    if (player.vy === 0) {
        takeDamage(20);
    }
}

function takeDamage(amount) {
    const reducedAmount = amount * (1 - player.radiatorReduction);
    player.hull -= reducedAmount;
    hullDamageFlash = 1;

    if (player.hull <= 0) {
        gameState = 'gameover';
    }
}

function spawnBoss() {
    boss = {
        x: player.x,
        y: player.y + 100,
        hp: 1000,
        maxHP: 1000,
        speed: 40,
        phase: 1,
        attackTimer: 3
    };
    bossActive = true;
    showMessage('SATAN AWAKENS!', '#ff0000');
}

// Start game
requestAnimationFrame(gameLoop);
