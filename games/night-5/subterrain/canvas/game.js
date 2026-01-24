// Isolation Protocol - Survival Horror (Subterrain Clone)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const VIEWPORT_WIDTH = canvas.width;
const VIEWPORT_HEIGHT = canvas.height;

// Game states
const GameState = { TITLE: 'title', PLAYING: 'playing', INVENTORY: 'inventory', CRAFTING: 'crafting', MAP: 'map', PAUSED: 'paused', GAMEOVER: 'gameover', VICTORY: 'victory' };
let gameState = GameState.TITLE;

// Sector types
const SectorType = { HUB: 'hub', STORAGE: 'storage', MEDICAL: 'medical', RESEARCH: 'research', ESCAPE: 'escape' };

// Time system (1 real second = 1 game minute)
let gameTime = 0; // in game minutes
let realTimeAccum = 0;
let globalInfection = 0; // 0-100%

// Player state
let player = {
    x: 0, y: 0,
    health: 100, maxHealth: 100,
    hunger: 0, thirst: 0, fatigue: 0,
    infection: 0,
    stamina: 100, maxStamina: 100,
    speed: 3,
    inventory: [],
    maxInventory: 20,
    quickSlots: [null, null, null],
    equippedWeapon: null,
    facing: { x: 1, y: 0 },
    attacking: false,
    attackTimer: 0,
    dodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    hasKeycard: false,
    hasTier2: false
};

// Current sector
let currentSector = SectorType.HUB;
let sectorStates = {}; // Stores state of each sector (enemies, items, containers)

// Camera
let camera = { x: 0, y: 0 };

// Enemies in current sector
let enemies = [];

// Items on ground
let groundItems = [];

// Containers
let containers = [];

// Particles
let particles = [];
let bloodPools = [];
let floatingTexts = [];
let muzzleFlashes = [];
let ambientParticles = [];

// Screen shake
let screenShake = { intensity: 0, duration: 0 };

// Floating text system
function addFloatingText(x, y, text, color = '#fff') {
    floatingTexts.push({ x, y, text, color, life: 1.5, vy: -30 });
}

// Screen shake
function triggerScreenShake(intensity, duration) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = Math.max(screenShake.duration, duration);
}

// Muzzle flash
function addMuzzleFlash(x, y, angle) {
    muzzleFlashes.push({ x, y, angle, life: 0.1 });
}

// Init ambient particles
function initAmbientParticles() {
    for (let i = 0; i < 30; i++) {
        ambientParticles.push({
            x: Math.random() * VIEWPORT_WIDTH,
            y: Math.random() * VIEWPORT_HEIGHT,
            size: 1 + Math.random() * 2,
            speed: 5 + Math.random() * 10,
            alpha: 0.2 + Math.random() * 0.3
        });
    }
}

// Global infection warnings
let lastInfectionWarning = 0;
function checkInfectionWarnings() {
    let thresholds = [25, 50, 75, 90];
    for (let t of thresholds) {
        if (globalInfection >= t && lastInfectionWarning < t) {
            lastInfectionWarning = t;
            let msg = t < 50 ? 'INFECTION SPREADING' : t < 75 ? 'INFECTION CRITICAL' : t < 90 ? 'OUTBREAK IMMINENT' : 'FACILITY LOST SOON';
            addFloatingText(VIEWPORT_WIDTH / 2 + camera.x, VIEWPORT_HEIGHT / 2 + camera.y - 50, msg, '#f00');
            triggerScreenShake(5, 0.3);
        }
    }
}

// Input
let keys = {};
let mouse = { x: 0, y: 0, down: false, rightDown: false };

// Power system
let powerBudget = 500;
let sectorPower = {
    [SectorType.HUB]: { cost: 0, powered: true },
    [SectorType.STORAGE]: { cost: 100, powered: false },
    [SectorType.MEDICAL]: { cost: 150, powered: false },
    [SectorType.RESEARCH]: { cost: 200, powered: false },
    [SectorType.ESCAPE]: { cost: 300, powered: false }
};

// Tile types
const Tile = { FLOOR: 0, WALL: 1, DOOR: 2, CONTAINER: 3, WORKBENCH: 4, BED: 5, MEDICAL_STATION: 6, RESEARCH_TERMINAL: 7, POWER_PANEL: 8, ESCAPE_POD: 9, EXIT_NORTH: 10, EXIT_SOUTH: 11, EXIT_EAST: 12, EXIT_WEST: 13 };

// Sector maps
let sectorMaps = {};
let currentMap = [];
let mapWidth = 0, mapHeight = 0;

// Item definitions
const ItemDef = {
    food: { name: 'Canned Food', type: 'consumable', stackable: true, maxStack: 5, effect: { hunger: -30 } },
    water: { name: 'Water Bottle', type: 'consumable', stackable: true, maxStack: 5, effect: { thirst: -40 } },
    mre: { name: 'MRE Pack', type: 'consumable', stackable: true, maxStack: 3, effect: { hunger: -50, thirst: -20 } },
    coffee: { name: 'Coffee', type: 'consumable', stackable: true, maxStack: 5, effect: { fatigue: -20 } },
    medkit: { name: 'Medkit', type: 'consumable', stackable: true, maxStack: 3, effect: { health: 30 } },
    antidote: { name: 'Antidote', type: 'consumable', stackable: true, maxStack: 3, effect: { infection: -30 } },
    scrap: { name: 'Scrap Metal', type: 'material', stackable: true, maxStack: 10 },
    cloth: { name: 'Cloth', type: 'material', stackable: true, maxStack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stackable: true, maxStack: 10 },
    electronics: { name: 'Electronics', type: 'material', stackable: true, maxStack: 10 },
    powerCell: { name: 'Power Cell', type: 'material', stackable: true, maxStack: 5 },
    shiv: { name: 'Shiv', type: 'weapon', melee: true, damage: 10, speed: 0.4, durability: 20 },
    pipeClub: { name: 'Pipe Club', type: 'weapon', melee: true, damage: 20, speed: 1.0, durability: 30 },
    pistol: { name: 'Pistol', type: 'weapon', melee: false, damage: 15, speed: 0.5, accuracy: 85, magazine: 12, durability: Infinity },
    stunBaton: { name: 'Stun Baton', type: 'weapon', melee: true, damage: 15, speed: 0.7, durability: 25, stun: 2 },
    ammo: { name: 'Pistol Ammo', type: 'ammo', stackable: true, maxStack: 30 },
    keycard: { name: 'Red Keycard', type: 'key', stackable: false },
    dataChip: { name: 'Data Chip', type: 'key', stackable: false }
};

// Crafting recipes
const Recipes = {
    tier1: [
        { name: 'Shiv', result: 'shiv', materials: { scrap: 2 }, time: 10 },
        { name: 'Pipe Club', result: 'pipeClub', materials: { scrap: 3 }, time: 15 }
    ],
    tier2: [
        { name: 'Pistol', result: 'pistol', materials: { scrap: 5, electronics: 2 }, time: 30 },
        { name: 'Pistol Ammo x10', result: 'ammo', amount: 10, materials: { scrap: 2, chemicals: 1 }, time: 10 },
        { name: 'Antidote', result: 'antidote', materials: { chemicals: 3 }, time: 15 },
        { name: 'Stun Baton', result: 'stunBaton', materials: { scrap: 3, electronics: 2, powerCell: 1 }, time: 25 }
    ]
};

// Enemy definitions
const EnemyDef = {
    shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 1.5, attackRate: 1.5, infection: 5, color: '#4a6a4a', size: 28 },
    crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 3.6, attackRate: 1.0, infection: 5, color: '#6a4a4a', size: 20, dodgePenalty: 20 },
    spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 1.2, attackRate: 2.5, infection: 10, color: '#4a4a6a', size: 26, ranged: true, preferredRange: 5 },
    brute: { name: 'Brute', hp: 80, damage: 25, speed: 0.9, attackRate: 2.0, infection: 8, color: '#6a4a6a', size: 40, charges: true },
    cocoon: { name: 'Cocoon', hp: 50, damage: 0, speed: 0, attackRate: 0, infection: 1, color: '#3a5a3a', size: 36, stationary: true, spawns: true }
};

// Critical hit chance
const CRIT_CHANCE = 0.15;
const CRIT_MULTIPLIER = 1.75;

// Initialize game
function init() {
    generateAllSectors();
    initPlayer();
    initAmbientParticles();
    setupInput();
    gameLoop();
}

function initPlayer() {
    player.x = mapWidth * TILE_SIZE / 2;
    player.y = mapHeight * TILE_SIZE / 2;
    player.inventory = [
        { id: 'food', count: 2 },
        { id: 'water', count: 2 },
        { id: 'shiv', count: 1, durability: 20 }
    ];
    player.equippedWeapon = player.inventory[2];
}

// Generate all sector maps
function generateAllSectors() {
    sectorMaps[SectorType.HUB] = generateSector(SectorType.HUB, 15, 15);
    sectorMaps[SectorType.STORAGE] = generateSector(SectorType.STORAGE, 20, 20);
    sectorMaps[SectorType.MEDICAL] = generateSector(SectorType.MEDICAL, 20, 20);
    sectorMaps[SectorType.RESEARCH] = generateSector(SectorType.RESEARCH, 25, 25);
    sectorMaps[SectorType.ESCAPE] = generateSector(SectorType.ESCAPE, 15, 15);

    // Initialize sector states
    for (let sector in SectorType) {
        let s = SectorType[sector];
        sectorStates[s] = { enemies: [], items: [], containers: [], visited: false };
    }

    loadSector(SectorType.HUB);
}

function generateSector(type, width, height) {
    let map = [];
    for (let y = 0; y < height; y++) {
        map[y] = [];
        for (let x = 0; x < width; x++) {
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                map[y][x] = Tile.WALL;
            } else {
                map[y][x] = Tile.FLOOR;
            }
        }
    }

    // Add exits based on sector connections
    let midX = Math.floor(width / 2);
    let midY = Math.floor(height / 2);

    if (type === SectorType.HUB) {
        map[0][midX] = Tile.EXIT_NORTH; // To Escape
        map[height - 1][midX] = Tile.EXIT_SOUTH; // To Storage
        map[midY][width - 1] = Tile.EXIT_EAST; // To Medical
        map[midY][0] = Tile.EXIT_WEST; // To Research
        // Add facilities
        map[3][3] = Tile.WORKBENCH;
        map[3][width - 4] = Tile.BED;
        map[height - 4][3] = Tile.POWER_PANEL;
    } else if (type === SectorType.STORAGE) {
        map[0][midX] = Tile.EXIT_NORTH; // To Hub
        map[5][5] = Tile.WORKBENCH;
        addContainersToMap(map, width, height, 10);
    } else if (type === SectorType.MEDICAL) {
        map[midY][0] = Tile.EXIT_WEST; // To Hub
        map[5][width - 5] = Tile.MEDICAL_STATION;
        addContainersToMap(map, width, height, 7);
    } else if (type === SectorType.RESEARCH) {
        map[midY][width - 1] = Tile.EXIT_EAST; // To Hub
        map[5][5] = Tile.RESEARCH_TERMINAL;
        addContainersToMap(map, width, height, 7);
    } else if (type === SectorType.ESCAPE) {
        map[height - 1][midX] = Tile.EXIT_SOUTH; // To Hub
        map[midY][midX] = Tile.ESCAPE_POD;
    }

    // Add some internal walls for variety
    addInternalWalls(map, width, height, type);

    return map;
}

function addContainersToMap(map, width, height, count) {
    for (let i = 0; i < count; i++) {
        let x = 2 + Math.floor(Math.random() * (width - 4));
        let y = 2 + Math.floor(Math.random() * (height - 4));
        if (map[y][x] === Tile.FLOOR) {
            map[y][x] = Tile.CONTAINER;
        }
    }
}

function addInternalWalls(map, width, height, type) {
    if (type === SectorType.HUB) return;

    // Add a few L-shaped walls
    let wallCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < wallCount; i++) {
        let wx = 3 + Math.floor(Math.random() * (width - 8));
        let wy = 3 + Math.floor(Math.random() * (height - 8));
        let len = 3 + Math.floor(Math.random() * 4);
        let dir = Math.random() < 0.5;

        for (let j = 0; j < len; j++) {
            let tx = dir ? wx + j : wx;
            let ty = dir ? wy : wy + j;
            if (tx > 0 && tx < width - 1 && ty > 0 && ty < height - 1 && map[ty][tx] === Tile.FLOOR) {
                map[ty][tx] = Tile.WALL;
            }
        }
    }
}

function loadSector(sectorType) {
    currentSector = sectorType;
    currentMap = sectorMaps[sectorType];
    mapWidth = currentMap[0].length;
    mapHeight = currentMap.length;

    let state = sectorStates[sectorType];

    if (!state.visited) {
        state.visited = true;
        spawnEnemiesForSector(sectorType, state);
        spawnItemsForSector(sectorType, state);
        initContainersForSector(sectorType, state);
    }

    enemies = state.enemies;
    groundItems = state.items;
    containers = state.containers;
}

function spawnEnemiesForSector(type, state) {
    if (type === SectorType.HUB) return; // Safe zone

    let spawns = [];
    if (type === SectorType.STORAGE) {
        // Reduced by 50% (was 4 shamblers + 2 crawlers = 6)
        for (let i = 0; i < 2; i++) spawns.push('shambler');
        for (let i = 0; i < 1; i++) spawns.push('crawler');
    } else if (type === SectorType.MEDICAL) {
        for (let i = 0; i < 3; i++) spawns.push('shambler');
        for (let i = 0; i < 2; i++) spawns.push('spitter');
    } else if (type === SectorType.RESEARCH) {
        for (let i = 0; i < 3; i++) spawns.push('crawler');
        for (let i = 0; i < 2; i++) spawns.push('spitter');
        spawns.push('brute');
    } else if (type === SectorType.ESCAPE) {
        for (let i = 0; i < 3; i++) spawns.push('shambler');
        for (let i = 0; i < 2; i++) spawns.push('crawler');
        for (let i = 0; i < 2; i++) spawns.push('brute');
    }

    spawns.forEach(enemyType => {
        let pos = findSpawnPosition();
        if (pos) {
            state.enemies.push(createEnemy(enemyType, pos.x, pos.y));
        }
    });
}

function findSpawnPosition() {
    for (let attempts = 0; attempts < 50; attempts++) {
        let x = 2 + Math.floor(Math.random() * (mapWidth - 4));
        let y = 2 + Math.floor(Math.random() * (mapHeight - 4));
        if (currentMap[y][x] === Tile.FLOOR) {
            let px = x * TILE_SIZE + TILE_SIZE / 2;
            let py = y * TILE_SIZE + TILE_SIZE / 2;
            let dist = Math.hypot(px - player.x, py - player.y);
            if (dist > TILE_SIZE * 5) {
                return { x: px, y: py };
            }
        }
    }
    return null;
}

function createEnemy(type, x, y) {
    let def = EnemyDef[type];
    return {
        type: type,
        x: x, y: y,
        hp: def.hp,
        maxHp: def.hp,
        attackTimer: 0,
        alerted: false,
        stunned: 0,
        hitFlash: 0,
        attackAnim: 0 // For attack animation
    };
}

function spawnItemsForSector(type, state) {
    let itemPool = [];
    if (type === SectorType.STORAGE) {
        itemPool = ['food', 'food', 'water', 'water', 'scrap', 'scrap', 'cloth', 'coffee'];
    } else if (type === SectorType.MEDICAL) {
        itemPool = ['medkit', 'medkit', 'antidote', 'chemicals', 'chemicals'];
    } else if (type === SectorType.RESEARCH) {
        itemPool = ['electronics', 'electronics', 'powerCell', 'scrap'];
        // Keycard and data chip in containers
    } else if (type === SectorType.ESCAPE) {
        itemPool = ['medkit', 'ammo'];
    }

    itemPool.forEach(itemId => {
        let pos = findSpawnPosition();
        if (pos) {
            state.items.push({ id: itemId, x: pos.x, y: pos.y, count: 1 });
        }
    });
}

function initContainersForSector(type, state) {
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (currentMap[y][x] === Tile.CONTAINER) {
                let contents = generateContainerLoot(type);
                state.containers.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    tileX: x, tileY: y,
                    opened: false,
                    contents: contents
                });
            }
        }
    }
}

function generateContainerLoot(sectorType) {
    let loot = [];
    let count = 1 + Math.floor(Math.random() * 3);

    let pool = [];
    if (sectorType === SectorType.STORAGE) {
        pool = ['food', 'water', 'scrap', 'cloth', 'coffee'];
    } else if (sectorType === SectorType.MEDICAL) {
        pool = ['medkit', 'antidote', 'chemicals'];
    } else if (sectorType === SectorType.RESEARCH) {
        pool = ['electronics', 'powerCell', 'scrap'];
        if (Math.random() < 0.3 && !player.hasKeycard) pool.push('keycard');
        if (Math.random() < 0.3 && !player.hasTier2) pool.push('dataChip');
    }

    for (let i = 0; i < count && pool.length > 0; i++) {
        let item = pool[Math.floor(Math.random() * pool.length)];
        loot.push({ id: item, count: 1 });
    }

    return loot;
}

// Input handling
function setupInput() {
    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (gameState === GameState.TITLE && e.key === ' ') startGame();
        if (gameState === GameState.PLAYING) {
            if (e.key === 'Tab') { e.preventDefault(); gameState = GameState.INVENTORY; }
            if (e.key === 'm' || e.key === 'M') gameState = GameState.MAP;
            if (e.key === 'Escape') gameState = GameState.PAUSED;
            if (e.key >= '1' && e.key <= '3') useQuickSlot(parseInt(e.key) - 1);
            if (e.key === 'e' || e.key === 'E') interact();
            if (e.key === 'r' || e.key === 'R') reload();
        }
        if ((gameState === GameState.INVENTORY || gameState === GameState.CRAFTING || gameState === GameState.MAP || gameState === GameState.PAUSED) && (e.key === 'Escape' || e.key === 'Tab')) {
            gameState = GameState.PLAYING;
        }
        if ((gameState === GameState.GAMEOVER || gameState === GameState.VICTORY) && e.key === ' ') {
            resetGame();
        }
    });
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener('mousemove', e => {
        let rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', e => {
        if (e.button === 0) mouse.down = true;
        if (e.button === 2) mouse.rightDown = true;
    });
    canvas.addEventListener('mouseup', e => {
        if (e.button === 0) mouse.down = false;
        if (e.button === 2) mouse.rightDown = false;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function startGame() {
    gameState = GameState.PLAYING;
    gameTime = 0;
    globalInfection = 0;
    player.health = 100;
    player.hunger = 0;
    player.thirst = 0;
    player.fatigue = 0;
    player.infection = 0;
}

function resetGame() {
    gameState = GameState.TITLE;
    player = {
        x: 0, y: 0, health: 100, maxHealth: 100,
        hunger: 0, thirst: 0, fatigue: 0, infection: 0,
        stamina: 100, maxStamina: 100, speed: 3,
        inventory: [], maxInventory: 20,
        quickSlots: [null, null, null],
        equippedWeapon: null,
        facing: { x: 1, y: 0 },
        attacking: false, attackTimer: 0,
        dodging: false, dodgeTimer: 0, dodgeCooldown: 0,
        hasKeycard: false, hasTier2: false
    };
    sectorStates = {};
    sectorPower = {
        [SectorType.HUB]: { cost: 0, powered: true },
        [SectorType.STORAGE]: { cost: 100, powered: false },
        [SectorType.MEDICAL]: { cost: 150, powered: false },
        [SectorType.RESEARCH]: { cost: 200, powered: false },
        [SectorType.ESCAPE]: { cost: 300, powered: false }
    };
    generateAllSectors();
    initPlayer();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp = 0) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    dt = Math.min(dt, 0.1);

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (gameState !== GameState.PLAYING) return;

    // Time system
    realTimeAccum += dt;
    while (realTimeAccum >= 1) {
        realTimeAccum -= 1;
        gameTime++;
        updateSurvivalMeters();
        globalInfection = Math.min(100, globalInfection + 0.1);
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateParticles(dt);
    updateCamera();

    checkInfectionWarnings();
    checkWinLose();
}

function updateSurvivalMeters() {
    // Hunger increases 0.1 per game minute
    player.hunger = Math.min(100, player.hunger + 0.1);
    // Thirst increases 0.2 per game minute
    player.thirst = Math.min(100, player.thirst + 0.2);
    // Fatigue increases 0.067 per game minute
    player.fatigue = Math.min(100, player.fatigue + 0.067);

    // Infection in unpowered sectors
    if (!sectorPower[currentSector].powered && currentSector !== SectorType.HUB) {
        player.infection = Math.min(100, player.infection + 0.5);
    }

    // Health drain from critical meters
    if (player.hunger >= 75) player.health -= 1;
    if (player.thirst >= 75) player.health -= 1;
    if (player.infection >= 75) player.health -= 2;
    if (player.hunger >= 100) player.health -= 4;
    if (player.thirst >= 100) player.health -= 4;
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    let speed = player.speed * TILE_SIZE;

    // Speed penalties
    if (player.hunger >= 75) speed *= 0.75;
    else if (player.hunger >= 50) speed *= 0.9;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        let len = Math.hypot(dx, dy);
        dx /= len; dy /= len;

        let newX = player.x + dx * speed * dt;
        let newY = player.y + dy * speed * dt;

        if (!isWall(newX, player.y)) player.x = newX;
        if (!isWall(player.x, newY)) player.y = newY;

        // Check for exit tiles
        checkExits();
    }

    // Facing direction (toward mouse)
    let worldMouseX = mouse.x + camera.x;
    let worldMouseY = mouse.y + camera.y;
    let fdx = worldMouseX - player.x;
    let fdy = worldMouseY - player.y;
    let flen = Math.hypot(fdx, fdy);
    if (flen > 0) {
        player.facing.x = fdx / flen;
        player.facing.y = fdy / flen;
    }

    // Attack
    if (mouse.down && player.attackTimer <= 0 && player.stamina >= 10) {
        attack();
    }
    if (player.attackTimer > 0) player.attackTimer -= dt;

    // Dodge
    if (mouse.rightDown && player.dodgeCooldown <= 0 && player.stamina >= 20) {
        player.dodging = true;
        player.dodgeTimer = 0.3;
        player.dodgeCooldown = 1.5;
        player.stamina -= 20;
    }
    if (player.dodgeTimer > 0) {
        player.dodgeTimer -= dt;
        if (player.dodgeTimer <= 0) player.dodging = false;
    }
    if (player.dodgeCooldown > 0) player.dodgeCooldown -= dt;

    // Stamina regen
    if (!player.attacking && player.stamina < player.maxStamina) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 5 * dt);
    }

    // Item pickup - check for nearby ground items
    for (let i = groundItems.length - 1; i >= 0; i--) {
        let item = groundItems[i];
        let dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < TILE_SIZE * 1.2) {
            if (addToInventory(item.id, item.count)) {
                let def = ItemDef[item.id];
                addFloatingText(item.x, item.y - 10, `+${def.name}`, '#4f4');
                groundItems.splice(i, 1);
            }
        }
    }
}

function isWall(x, y) {
    let tx = Math.floor(x / TILE_SIZE);
    let ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= mapWidth || ty >= mapHeight) return true;
    let tile = currentMap[ty][tx];
    return tile === Tile.WALL;
}

function checkExits() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= mapWidth || ty >= mapHeight) return;

    let tile = currentMap[ty][tx];
    let newSector = null;
    let spawnDir = null;

    if (tile === Tile.EXIT_NORTH) {
        if (currentSector === SectorType.HUB) newSector = SectorType.ESCAPE;
        else if (currentSector === SectorType.STORAGE) newSector = SectorType.HUB;
        spawnDir = 'south';
    } else if (tile === Tile.EXIT_SOUTH) {
        if (currentSector === SectorType.HUB) newSector = SectorType.STORAGE;
        else if (currentSector === SectorType.ESCAPE) newSector = SectorType.HUB;
        spawnDir = 'north';
    } else if (tile === Tile.EXIT_EAST) {
        if (currentSector === SectorType.HUB) newSector = SectorType.MEDICAL;
        else if (currentSector === SectorType.RESEARCH) newSector = SectorType.HUB;
        spawnDir = 'west';
    } else if (tile === Tile.EXIT_WEST) {
        if (currentSector === SectorType.HUB) newSector = SectorType.RESEARCH;
        else if (currentSector === SectorType.MEDICAL) newSector = SectorType.HUB;
        spawnDir = 'east';
    }

    if (newSector) {
        // Save current sector state
        sectorStates[currentSector].enemies = enemies;
        sectorStates[currentSector].items = groundItems;

        loadSector(newSector);

        // Spawn player at correct position
        let newMap = sectorMaps[newSector];
        let newW = newMap[0].length;
        let newH = newMap.length;

        if (spawnDir === 'north') {
            player.x = newW * TILE_SIZE / 2;
            player.y = TILE_SIZE * 1.5;
        } else if (spawnDir === 'south') {
            player.x = newW * TILE_SIZE / 2;
            player.y = (newH - 1.5) * TILE_SIZE;
        } else if (spawnDir === 'east') {
            player.x = (newW - 1.5) * TILE_SIZE;
            player.y = newH * TILE_SIZE / 2;
        } else if (spawnDir === 'west') {
            player.x = TILE_SIZE * 1.5;
            player.y = newH * TILE_SIZE / 2;
        }

        // Time passes for travel
        gameTime += 30;

        // Sector transition notification
        addFloatingText(player.x, player.y - 40, `Entering ${newSector.toUpperCase()}`, '#fff');
        if (!sectorPower[newSector].powered && newSector !== SectorType.HUB) {
            addFloatingText(player.x, player.y - 20, 'WARNING: No power!', '#f80');
        }
    }
}

function attack() {
    player.attacking = true;
    player.stamina -= 10;

    let weapon = player.equippedWeapon;
    let damage = 5; // Fists
    let speed = 0.5;
    let range = TILE_SIZE * 1.65; // +10% melee range (was 1.5)
    let isRanged = false;

    if (weapon && ItemDef[weapon.id]) {
        let def = ItemDef[weapon.id];
        damage = def.damage || 5;
        speed = def.speed || 0.5;
        if (!def.melee) {
            range = TILE_SIZE * 11; // +10% ranged range (was 10)
            isRanged = true;
        }
    }

    player.attackTimer = speed;

    // Muzzle flash for ranged weapons
    if (isRanged) {
        let angle = Math.atan2(player.facing.y, player.facing.x);
        addMuzzleFlash(player.x + player.facing.x * 20, player.y + player.facing.y * 20, angle);
        triggerScreenShake(3, 0.1);
    }

    // Check hits
    enemies.forEach(enemy => {
        let dx = enemy.x - player.x;
        let dy = enemy.y - player.y;
        let dist = Math.hypot(dx, dy);

        if (dist < range) {
            // Check if in facing direction (widened cone for better hit detection)
            let dot = (dx / dist) * player.facing.x + (dy / dist) * player.facing.y;
            // Improved collision: wider angle (0.3 instead of 0.5) and larger close-range threshold
            if (dot > 0.3 || dist < TILE_SIZE * 2) {
                // Hit!
                let finalDamage = damage;
                if (player.fatigue >= 75) finalDamage *= 0.6;
                else if (player.fatigue >= 50) finalDamage *= 0.8;

                // Critical hit check
                let isCrit = Math.random() < CRIT_CHANCE;
                if (isCrit) {
                    finalDamage *= CRIT_MULTIPLIER;
                    addFloatingText(enemy.x, enemy.y - 20, 'CRITICAL!', '#ff0');
                    triggerScreenShake(8, 0.2);
                } else {
                    addFloatingText(enemy.x, enemy.y - 20, Math.floor(finalDamage).toString(), '#f88');
                }

                enemy.hp -= finalDamage;
                enemy.hitFlash = 0.2;
                enemy.alerted = true;

                // Blood particles
                for (let i = 0; i < (isCrit ? 10 : 5); i++) {
                    particles.push({
                        x: enemy.x, y: enemy.y,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        life: 0.5 + Math.random() * 0.3,
                        color: '#8a2a2a',
                        size: 2 + Math.random() * 3
                    });
                }

                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }
            }
        }
    });

    // Weapon durability
    if (weapon && weapon.durability !== undefined) {
        weapon.durability--;
        if (weapon.durability <= 0) {
            let idx = player.inventory.indexOf(weapon);
            if (idx >= 0) player.inventory.splice(idx, 1);
            if (player.equippedWeapon === weapon) player.equippedWeapon = null;
            addFloatingText(player.x, player.y - 30, 'Weapon broke!', '#f00');
        }
    }
}

function killEnemy(enemy) {
    let idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);
    let def = EnemyDef[enemy.type];

    // Blood pool (static, no animation)
    bloodPools.push({
        x: enemy.x,
        y: enemy.y,
        size: 15 + Math.random() * 10
    });

    // More death particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.8,
            color: '#6a2a2a',
            size: 4 + Math.random() * 4
        });
    }

    // Kill notification
    addFloatingText(enemy.x, enemy.y - def.size / 2 - 10, `${def.name} killed!`, '#8f8');
    triggerScreenShake(4, 0.1);

    // Drop items
    if (Math.random() < 0.4) {
        groundItems.push({ id: 'scrap', x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y + (Math.random() - 0.5) * 20, count: 1 });
    }
    if (Math.random() < 0.15) {
        groundItems.push({ id: 'medkit', x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y + (Math.random() - 0.5) * 20, count: 1 });
    }
}

function updateEnemies(dt) {
    let infectionScale = 1 + (globalInfection / 100);

    enemies.forEach(enemy => {
        let def = EnemyDef[enemy.type];
        if (def.stationary) return;

        if (enemy.stunned > 0) {
            enemy.stunned -= dt;
            return;
        }

        if (enemy.hitFlash > 0) enemy.hitFlash -= dt;

        // AI
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.hypot(dx, dy);

        // Detection
        let detectionRange = 8 * TILE_SIZE;
        if (def.name === 'Crawler') detectionRange = 6 * TILE_SIZE;
        if (def.name === 'Spitter') detectionRange = 10 * TILE_SIZE;

        if (dist < detectionRange) enemy.alerted = true;

        if (enemy.alerted && dist > 0) {
            let speed = def.speed * TILE_SIZE * dt;

            // Spitter keeps distance
            if (def.ranged && dist < def.preferredRange * TILE_SIZE) {
                dx = -dx; dy = -dy;
            }

            let len = Math.hypot(dx, dy);
            let moveX = (dx / len) * speed;
            let moveY = (dy / len) * speed;

            if (!isWall(enemy.x + moveX, enemy.y)) enemy.x += moveX;
            if (!isWall(enemy.x, enemy.y + moveY)) enemy.y += moveY;

            // Attack animation decay
            if (enemy.attackAnim > 0) enemy.attackAnim -= dt * 3;

            // Attack
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0 && dist < TILE_SIZE * 1.5) {
                enemy.attackAnim = 1; // Trigger attack animation
                if (!player.dodging) {
                    let dmg = def.damage * infectionScale;
                    player.health -= dmg;
                    player.infection = Math.min(100, player.infection + def.infection);
                    triggerScreenShake(6, 0.15);
                    addFloatingText(player.x, player.y - 20, `-${Math.floor(dmg)}`, '#f00');
                    // Hit particles on player
                    for (let i = 0; i < 3; i++) {
                        particles.push({
                            x: player.x, y: player.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            life: 0.3,
                            color: '#ff4444',
                            size: 4
                        });
                    }
                }
                enemy.attackTimer = def.attackRate;
            }
        }
    });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].life -= dt;
        if (muzzleFlashes[i].life <= 0) muzzleFlashes.splice(i, 1);
    }

    // Screen shake decay
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        if (screenShake.duration <= 0) {
            screenShake.intensity = 0;
        }
    }

    // Ambient particles
    ambientParticles.forEach(p => {
        p.x += p.speed * dt;
        p.y += p.speed * 0.3 * dt;
        if (p.x > VIEWPORT_WIDTH) p.x = 0;
        if (p.y > VIEWPORT_HEIGHT) p.y = 0;
    });
}

function updateCamera() {
    let targetX = player.x - VIEWPORT_WIDTH / 2;
    let targetY = player.y - VIEWPORT_HEIGHT / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // Clamp
    camera.x = Math.max(0, Math.min(mapWidth * TILE_SIZE - VIEWPORT_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(mapHeight * TILE_SIZE - VIEWPORT_HEIGHT, camera.y));
}

function checkWinLose() {
    if (player.health <= 0) {
        gameState = GameState.GAMEOVER;
    }
    if (player.infection >= 100) {
        gameState = GameState.GAMEOVER;
    }
    if (globalInfection >= 100) {
        gameState = GameState.GAMEOVER;
    }
}

function interact() {
    let tx = Math.floor(player.x / TILE_SIZE);
    let ty = Math.floor(player.y / TILE_SIZE);

    // Check adjacent tiles too
    for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
            let cx = tx + ox;
            let cy = ty + oy;
            if (cx < 0 || cy < 0 || cx >= mapWidth || cy >= mapHeight) continue;

            let tile = currentMap[cy][cx];

            if (tile === Tile.WORKBENCH) {
                gameState = GameState.CRAFTING;
                return;
            }
            if (tile === Tile.BED) {
                // Sleep - reduce fatigue
                player.fatigue = Math.max(0, player.fatigue - 60);
                gameTime += 240; // 4 hours
                return;
            }
            if (tile === Tile.MEDICAL_STATION && sectorPower[currentSector].powered) {
                player.health = Math.min(player.maxHealth, player.health + 20);
                gameTime += 30;
                return;
            }
            if (tile === Tile.RESEARCH_TERMINAL && sectorPower[currentSector].powered) {
                let chip = player.inventory.find(i => i.id === 'dataChip');
                if (chip) {
                    player.hasTier2 = true;
                    let idx = player.inventory.indexOf(chip);
                    player.inventory.splice(idx, 1);
                }
                return;
            }
            if (tile === Tile.ESCAPE_POD) {
                if (player.hasKeycard && sectorPower[SectorType.ESCAPE].powered) {
                    gameState = GameState.VICTORY;
                }
                return;
            }
            if (tile === Tile.POWER_PANEL) {
                // Toggle power - simple cycle
                let sectors = [SectorType.STORAGE, SectorType.MEDICAL, SectorType.RESEARCH, SectorType.ESCAPE];
                let current = sectors.findIndex(s => sectorPower[s].powered);
                sectors.forEach(s => sectorPower[s].powered = false);
                let next = (current + 1) % (sectors.length + 1);
                if (next < sectors.length) {
                    sectorPower[sectors[next]].powered = true;
                }
                return;
            }
        }
    }

    // Check containers
    containers.forEach(cont => {
        let dist = Math.hypot(cont.x - player.x, cont.y - player.y);
        if (dist < TILE_SIZE * 1.5 && !cont.opened) {
            cont.opened = true;
            cont.contents.forEach(item => {
                if (item.id === 'keycard') player.hasKeycard = true;
                addToInventory(item.id, item.count);
            });
            gameTime += 5;
        }
    });
}

function addToInventory(itemId, count) {
    let def = ItemDef[itemId];
    if (!def) return false;

    if (def.stackable) {
        let existing = player.inventory.find(i => i.id === itemId);
        if (existing && existing.count < def.maxStack) {
            existing.count = Math.min(def.maxStack, existing.count + count);
            return true;
        }
    }

    if (player.inventory.length < player.maxInventory) {
        player.inventory.push({ id: itemId, count: count, durability: def.durability });
        return true;
    }
    return false;
}

function useQuickSlot(slot) {
    let item = player.quickSlots[slot];
    if (!item) return;
    useItem(item);
}

function useItem(item) {
    let def = ItemDef[item.id];
    if (!def) return;

    if (def.type === 'consumable' && def.effect) {
        if (def.effect.health) player.health = Math.min(player.maxHealth, player.health + def.effect.health);
        if (def.effect.hunger) player.hunger = Math.max(0, player.hunger + def.effect.hunger);
        if (def.effect.thirst) player.thirst = Math.max(0, player.thirst + def.effect.thirst);
        if (def.effect.fatigue) player.fatigue = Math.max(0, player.fatigue + def.effect.fatigue);
        if (def.effect.infection) player.infection = Math.max(0, player.infection + def.effect.infection);

        item.count--;
        if (item.count <= 0) {
            let idx = player.inventory.indexOf(item);
            if (idx >= 0) player.inventory.splice(idx, 1);
        }
        gameTime += 2;
    } else if (def.type === 'weapon') {
        player.equippedWeapon = item;
    }
}

function reload() {
    // For pistol
    if (player.equippedWeapon && ItemDef[player.equippedWeapon.id] && !ItemDef[player.equippedWeapon.id].melee) {
        let ammoItem = player.inventory.find(i => i.id === 'ammo');
        if (ammoItem && ammoItem.count > 0) {
            ammoItem.count--;
            if (ammoItem.count <= 0) {
                let idx = player.inventory.indexOf(ammoItem);
                player.inventory.splice(idx, 1);
            }
        }
    }
}

// Rendering
function render() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    if (gameState === GameState.TITLE) {
        renderTitle();
    } else if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
        renderGame();
        renderHUD();
        if (gameState === GameState.PAUSED) renderPause();
    } else if (gameState === GameState.INVENTORY) {
        renderGame();
        renderHUD();
        renderInventory();
    } else if (gameState === GameState.CRAFTING) {
        renderGame();
        renderHUD();
        renderCrafting();
    } else if (gameState === GameState.MAP) {
        renderGame();
        renderHUD();
        renderMap();
    } else if (gameState === GameState.GAMEOVER) {
        renderGameOver();
    } else if (gameState === GameState.VICTORY) {
        renderVictory();
    }
}

function renderTitle() {
    ctx.fillStyle = '#1a3a1a';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ISOLATION PROTOCOL', VIEWPORT_WIDTH / 2, 200);

    ctx.font = '20px Courier New';
    ctx.fillStyle = '#3a6a3a';
    ctx.fillText('A Survival Horror Experience', VIEWPORT_WIDTH / 2, 250);

    ctx.font = '16px Courier New';
    ctx.fillStyle = '#4a8a4a';
    let features = [
        'Survive the outbreak',
        'Manage hunger, thirst, fatigue, infection',
        'Explore 5 sectors',
        'Craft weapons and supplies',
        'Escape before global infection reaches 100%'
    ];
    features.forEach((f, i) => {
        ctx.fillText('- ' + f, VIEWPORT_WIDTH / 2, 320 + i * 25);
    });

    ctx.font = '24px Courier New';
    ctx.fillStyle = '#6a9a6a';
    ctx.fillText('Press SPACE to Start', VIEWPORT_WIDTH / 2, 520);

    ctx.font = '14px Courier New';
    ctx.fillStyle = '#3a5a3a';
    ctx.fillText('WASD: Move | Mouse: Aim | Click: Attack | E: Interact | Tab: Inventory', VIEWPORT_WIDTH / 2, 600);
}

function renderGame() {
    ctx.save();

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (screenShake.intensity > 0) {
        shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
        shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
    }

    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    // Darkness overlay for unpowered sectors
    let darkness = !sectorPower[currentSector].powered && currentSector !== SectorType.HUB;

    // Render tiles
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            let tile = currentMap[y][x];
            let px = x * TILE_SIZE;
            let py = y * TILE_SIZE;

            if (px + TILE_SIZE < camera.x || px > camera.x + VIEWPORT_WIDTH) continue;
            if (py + TILE_SIZE < camera.y || py > camera.y + VIEWPORT_HEIGHT) continue;

            // Floor
            ctx.fillStyle = darkness ? '#0a0f0a' : '#1a1f1a';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Tile type
            if (tile === Tile.WALL) {
                ctx.fillStyle = darkness ? '#1a2a1a' : '#2a3a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === Tile.CONTAINER) {
                let cont = containers.find(c => c.tileX === x && c.tileY === y);
                ctx.fillStyle = cont && cont.opened ? '#3a3a2a' : '#5a5a3a';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (tile === Tile.WORKBENCH) {
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#6a5a4a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('WB', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile === Tile.BED) {
                ctx.fillStyle = '#3a2a4a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#5a4a6a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('BED', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile === Tile.MEDICAL_STATION) {
                ctx.fillStyle = '#2a4a4a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#4a6a6a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('MED', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile === Tile.RESEARCH_TERMINAL) {
                ctx.fillStyle = '#2a2a4a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#4a4a6a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('RES', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile === Tile.POWER_PANEL) {
                ctx.fillStyle = '#4a4a2a';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#6a6a4a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('PWR', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile === Tile.ESCAPE_POD) {
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#4a8a4a';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            } else if (tile >= Tile.EXIT_NORTH && tile <= Tile.EXIT_WEST) {
                ctx.fillStyle = '#3a5a3a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Blood pools (static)
    bloodPools.forEach(pool => {
        ctx.fillStyle = '#4a1a1a';
        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pool.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Ground items
    groundItems.forEach(item => {
        ctx.fillStyle = '#8a8a4a';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa9a5a';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        let symbol = item.id.charAt(0).toUpperCase();
        ctx.fillText(symbol, item.x, item.y + 3);
    });

    // Enemies
    enemies.forEach(enemy => {
        let def = EnemyDef[enemy.type];
        let scale = 1 + enemy.attackAnim * 0.3; // Scale up during attack

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.scale(scale, scale);

        // Glow during attack
        if (enemy.attackAnim > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
        }

        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : (enemy.attackAnim > 0 ? '#ff6666' : def.color);
        ctx.beginPath();
        ctx.arc(0, 0, def.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();

        // Attack indicator
        if (enemy.attackAnim > 0.5) {
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('!', enemy.x, enemy.y - def.size / 2 - 12);
        }

        // Health bar
        let barWidth = def.size;
        let barHeight = 4;
        ctx.fillStyle = '#300';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - def.size / 2 - 8, barWidth, barHeight);
        ctx.fillStyle = '#a00';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - def.size / 2 - 8, barWidth * (enemy.hp / enemy.maxHp), barHeight);

        // Alert indicator
        if (enemy.alerted && enemy.attackAnim <= 0) {
            ctx.fillStyle = '#ff8800';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('ALERT', enemy.x, enemy.y - def.size / 2 - 14);
        }
    });

    // Player
    ctx.fillStyle = player.dodging ? '#4a4aaa' : '#4a8a4a';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    ctx.strokeStyle = '#8aca8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.facing.x * 20, player.y + player.facing.y * 20);
    ctx.stroke();

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Muzzle flashes
    muzzleFlashes.forEach(mf => {
        ctx.save();
        ctx.translate(mf.x, mf.y);
        ctx.rotate(mf.angle);
        let gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Floating texts
    floatingTexts.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    });

    ctx.restore();

    // Ambient particles (screen space)
    ctx.globalAlpha = 0.3;
    ambientParticles.forEach(p => {
        ctx.fillStyle = player.infection >= 50 ? '#4a6a4a' : '#6a6a6a';
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Infection overlay
    if (player.infection >= 25) {
        let alpha = Math.min(0.3, (player.infection - 25) / 200);
        ctx.fillStyle = `rgba(0, 100, 0, ${alpha})`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }

    // Vignette at high infection
    if (player.infection >= 50) {
        let gradient = ctx.createRadialGradient(
            VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_HEIGHT * 0.3,
            VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_HEIGHT * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 50, 0, ${(player.infection - 50) / 150})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, 60);

    // Health bar
    ctx.fillStyle = '#300';
    ctx.fillRect(10, 10, 150, 16);
    ctx.fillStyle = player.health < 25 ? '#f00' : '#a00';
    ctx.fillRect(10, 10, 150 * (player.health / player.maxHealth), 16);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.floor(player.health)}`, 15, 22);

    // Infection bar
    ctx.fillStyle = '#030';
    ctx.fillRect(10, 30, 150, 16);
    ctx.fillStyle = player.infection >= 50 ? '#0f0' : '#0a0';
    ctx.fillRect(10, 30, 150 * (player.infection / 100), 16);
    ctx.fillText(`INF: ${Math.floor(player.infection)}%`, 15, 42);

    // Survival meters
    let meterX = 180;

    // Hunger
    ctx.fillStyle = '#330';
    ctx.fillRect(meterX, 10, 80, 12);
    ctx.fillStyle = player.hunger >= 75 ? '#fa0' : '#a50';
    ctx.fillRect(meterX, 10, 80 * (player.hunger / 100), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.fillText('HNG', meterX + 2, 20);

    // Thirst
    ctx.fillStyle = '#003';
    ctx.fillRect(meterX, 26, 80, 12);
    ctx.fillStyle = player.thirst >= 75 ? '#0af' : '#05a';
    ctx.fillRect(meterX, 26, 80 * (player.thirst / 100), 12);
    ctx.fillText('THR', meterX + 2, 36);

    // Fatigue
    ctx.fillStyle = '#222';
    ctx.fillRect(meterX, 42, 80, 12);
    ctx.fillStyle = player.fatigue >= 75 ? '#888' : '#555';
    ctx.fillRect(meterX, 42, 80 * (player.fatigue / 100), 12);
    ctx.fillText('FAT', meterX + 2, 52);

    // Time and global infection
    ctx.fillStyle = '#fff';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'right';
    let hours = Math.floor(gameTime / 60) % 24;
    let mins = gameTime % 60;
    ctx.fillText(`Time: ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`, VIEWPORT_WIDTH - 10, 22);
    ctx.fillStyle = globalInfection >= 75 ? '#f00' : globalInfection >= 50 ? '#fa0' : '#0f0';
    ctx.fillText(`Global: ${Math.floor(globalInfection)}%`, VIEWPORT_WIDTH - 10, 42);

    // Current sector
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText(currentSector.toUpperCase(), VIEWPORT_WIDTH / 2, 22);
    ctx.fillText(sectorPower[currentSector].powered ? '[POWERED]' : '[DARK]', VIEWPORT_WIDTH / 2, 40);

    // Bottom bar - quick slots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, VIEWPORT_HEIGHT - 50, VIEWPORT_WIDTH, 50);

    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#4a4a4a';
        ctx.strokeRect(10 + i * 50, VIEWPORT_HEIGHT - 45, 40, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i + 1}]`, 30 + i * 50, VIEWPORT_HEIGHT - 8);
    }

    // Equipped weapon with durability
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.font = '14px Courier New';
    let weaponName = player.equippedWeapon ? ItemDef[player.equippedWeapon.id].name : 'Fists';
    let weaponDur = player.equippedWeapon && player.equippedWeapon.durability !== undefined ? ` (${player.equippedWeapon.durability})` : '';
    ctx.fillText(`Weapon: ${weaponName}${weaponDur}`, 180, VIEWPORT_HEIGHT - 25);

    // Weapon durability warning
    if (player.equippedWeapon && player.equippedWeapon.durability !== undefined && player.equippedWeapon.durability <= 5) {
        ctx.fillStyle = '#f00';
        ctx.fillText('LOW DURABILITY!', 400, VIEWPORT_HEIGHT - 25);
    }

    // Keycard indicator
    if (player.hasKeycard) {
        ctx.fillStyle = '#f44';
        ctx.fillText('[KEYCARD]', 550, VIEWPORT_HEIGHT - 25);
    }
    if (player.hasTier2) {
        ctx.fillStyle = '#44f';
        ctx.fillText('[T2]', 640, VIEWPORT_HEIGHT - 25);
    }

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText('E: Interact | Tab: Inventory | M: Map | ESC: Pause', VIEWPORT_WIDTH - 10, VIEWPORT_HEIGHT - 15);

    // Stamina bar
    ctx.fillStyle = '#222';
    ctx.fillRect(280, 10, 60, 12);
    ctx.fillStyle = '#66a';
    ctx.fillRect(280, 10, 60 * (player.stamina / player.maxStamina), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('STA', 282, 20);

    // Low health warning pulse
    if (player.health < 25) {
        let pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.5})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, VIEWPORT_WIDTH - 4, VIEWPORT_HEIGHT - 4);
    }

    // Render minimap
    renderMinimap();
}

function renderMinimap() {
    let mmX = VIEWPORT_WIDTH - 110;
    let mmY = 70;
    let mmW = 100;
    let mmH = 100;
    let scale = Math.min(mmW / (mapWidth * TILE_SIZE), mmH / (mapHeight * TILE_SIZE));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = '#3a5a3a';
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Draw walls
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (currentMap[y][x] === Tile.WALL) {
                ctx.fillStyle = '#3a4a3a';
                ctx.fillRect(
                    mmX + x * TILE_SIZE * scale,
                    mmY + y * TILE_SIZE * scale,
                    TILE_SIZE * scale,
                    TILE_SIZE * scale
                );
            }
        }
    }

    // Draw enemies
    enemies.forEach(e => {
        ctx.fillStyle = '#a33';
        ctx.fillRect(mmX + e.x * scale - 2, mmY + e.y * scale - 2, 4, 4);
    });

    // Draw items
    groundItems.forEach(item => {
        ctx.fillStyle = '#aa3';
        ctx.fillRect(mmX + item.x * scale - 1, mmY + item.y * scale - 1, 3, 3);
    });

    // Draw player
    ctx.fillStyle = '#3a8';
    ctx.fillRect(mmX + player.x * scale - 3, mmY + player.y * scale - 3, 6, 6);

    // Render hover info
    renderHoverInfo();
}

function renderHoverInfo() {
    let worldMouseX = mouse.x + camera.x;
    let worldMouseY = mouse.y + camera.y;

    // Check enemies
    for (let enemy of enemies) {
        let def = EnemyDef[enemy.type];
        let dist = Math.hypot(enemy.x - worldMouseX, enemy.y - worldMouseY);
        if (dist < def.size / 2 + 10) {
            let infoX = Math.min(mouse.x + 20, VIEWPORT_WIDTH - 150);
            let infoY = Math.min(mouse.y - 10, VIEWPORT_HEIGHT - 80);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(infoX, infoY, 140, 70);
            ctx.strokeStyle = '#a33';
            ctx.strokeRect(infoX, infoY, 140, 70);

            ctx.fillStyle = '#f88';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(def.name, infoX + 5, infoY + 15);

            ctx.fillStyle = '#aaa';
            ctx.font = '11px Courier New';
            ctx.fillText(`HP: ${Math.floor(enemy.hp)}/${enemy.maxHp}`, infoX + 5, infoY + 32);
            ctx.fillText(`DMG: ${def.damage}`, infoX + 5, infoY + 47);
            ctx.fillText(enemy.alerted ? 'Status: HOSTILE' : 'Status: Idle', infoX + 5, infoY + 62);
            return;
        }
    }

    // Check ground items
    for (let item of groundItems) {
        let dist = Math.hypot(item.x - worldMouseX, item.y - worldMouseY);
        if (dist < 15) {
            let def = ItemDef[item.id];
            let infoX = Math.min(mouse.x + 20, VIEWPORT_WIDTH - 130);
            let infoY = Math.min(mouse.y - 10, VIEWPORT_HEIGHT - 50);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(infoX, infoY, 120, 40);
            ctx.strokeStyle = '#aa3';
            ctx.strokeRect(infoX, infoY, 120, 40);

            ctx.fillStyle = '#ff8';
            ctx.font = 'bold 11px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(def.name, infoX + 5, infoY + 15);
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Courier New';
            ctx.fillText(`x${item.count}`, infoX + 5, infoY + 30);
            return;
        }
    }
}

function renderInventory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(150, 100, 600, 500);

    ctx.strokeStyle = '#4a8a4a';
    ctx.strokeRect(150, 100, 600, 500);

    ctx.fillStyle = '#4a8a4a';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 450, 140);

    ctx.font = '14px Courier New';
    ctx.textAlign = 'left';

    player.inventory.forEach((item, i) => {
        let def = ItemDef[item.id];
        let y = 170 + i * 25;
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${def.name}${item.count > 1 ? ' x' + item.count : ''}`, 180, y);
        if (item.durability !== undefined) {
            ctx.fillText(`(${item.durability})`, 400, y);
        }
    });

    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB or ESC to close', 450, 570);
}

function renderCrafting() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(150, 100, 600, 500);

    ctx.strokeStyle = '#6a5a3a';
    ctx.strokeRect(150, 100, 600, 500);

    ctx.fillStyle = '#6a5a3a';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('WORKBENCH', 450, 140);

    ctx.font = '14px Courier New';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';

    let y = 180;
    ctx.fillText('Tier 1 Recipes:', 180, y);
    y += 25;

    Recipes.tier1.forEach(recipe => {
        let mats = Object.entries(recipe.materials).map(([m, c]) => `${c} ${m}`).join(', ');
        ctx.fillText(`- ${recipe.name}: ${mats}`, 200, y);
        y += 20;
    });

    if (player.hasTier2) {
        y += 20;
        ctx.fillText('Tier 2 Recipes:', 180, y);
        y += 25;

        Recipes.tier2.forEach(recipe => {
            let mats = Object.entries(recipe.materials).map(([m, c]) => `${c} ${m}`).join(', ');
            ctx.fillText(`- ${recipe.name}: ${mats}`, 200, y);
            y += 20;
        });
    } else {
        y += 20;
        ctx.fillStyle = '#666';
        ctx.fillText('Tier 2 Recipes: Requires Data Chip', 180, y);
    }

    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', 450, 570);
}

function renderMap() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(150, 100, 600, 500);

    ctx.strokeStyle = '#3a6a3a';
    ctx.strokeRect(150, 100, 600, 500);

    ctx.fillStyle = '#3a6a3a';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FACILITY MAP', 450, 140);

    // Draw sector boxes
    let sectors = [
        { type: SectorType.ESCAPE, x: 450, y: 200, label: 'ESCAPE POD' },
        { type: SectorType.HUB, x: 450, y: 320, label: 'CENTRAL HUB' },
        { type: SectorType.RESEARCH, x: 280, y: 320, label: 'RESEARCH' },
        { type: SectorType.MEDICAL, x: 620, y: 320, label: 'MEDICAL' },
        { type: SectorType.STORAGE, x: 450, y: 440, label: 'STORAGE' }
    ];

    // Draw connections
    ctx.strokeStyle = '#3a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(450, 250); ctx.lineTo(450, 290);
    ctx.moveTo(350, 320); ctx.lineTo(380, 320);
    ctx.moveTo(520, 320); ctx.lineTo(550, 320);
    ctx.moveTo(450, 350); ctx.lineTo(450, 410);
    ctx.stroke();

    sectors.forEach(s => {
        let powered = sectorPower[s.type].powered;
        let isCurrent = currentSector === s.type;

        ctx.fillStyle = isCurrent ? '#2a5a2a' : powered ? '#1a3a1a' : '#1a1a1a';
        ctx.fillRect(s.x - 60, s.y - 25, 120, 50);

        ctx.strokeStyle = isCurrent ? '#4a8a4a' : powered ? '#3a6a3a' : '#2a2a2a';
        ctx.strokeRect(s.x - 60, s.y - 25, 120, 50);

        ctx.fillStyle = powered ? '#8a8a8a' : '#4a4a4a';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, s.x, s.y);
        ctx.fillText(powered ? '[ON]' : '[OFF]', s.x, s.y + 15);
    });

    // Power budget
    let usedPower = Object.values(sectorPower).reduce((sum, s) => sum + (s.powered ? s.cost : 0), 0);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Courier New';
    ctx.fillText(`Power: ${usedPower}/${powerBudget}`, 450, 530);

    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('Press M or ESC to close', 450, 570);
}

function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    ctx.fillStyle = '#4a8a4a';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEWPORT_WIDTH / 2, 200);

    ctx.font = '16px Courier New';
    ctx.fillStyle = '#aaa';
    let controls = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Attack',
        'Right Click - Dodge',
        'E - Interact',
        'R - Reload',
        'Tab - Inventory',
        'M - Map',
        '1/2/3 - Quick Slots',
        'ESC - Resume'
    ];
    controls.forEach((c, i) => {
        ctx.fillText(c, VIEWPORT_WIDTH / 2, 280 + i * 30);
    });
}

function renderGameOver() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    ctx.fillStyle = '#8a2a2a';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', VIEWPORT_WIDTH / 2, 200);

    ctx.font = '20px Courier New';
    ctx.fillStyle = '#aaa';

    let cause = '';
    if (player.health <= 0) cause = 'You died from your injuries.';
    else if (player.infection >= 100) cause = 'The infection consumed you.';
    else cause = 'The facility was lost to the outbreak.';

    ctx.fillText(cause, VIEWPORT_WIDTH / 2, 280);

    ctx.fillStyle = '#666';
    ctx.fillText(`Time Survived: ${Math.floor(gameTime / 60)}h ${gameTime % 60}m`, VIEWPORT_WIDTH / 2, 350);
    ctx.fillText(`Global Infection: ${Math.floor(globalInfection)}%`, VIEWPORT_WIDTH / 2, 380);

    ctx.fillStyle = '#4a8a4a';
    ctx.font = '24px Courier New';
    ctx.fillText('Press SPACE to try again', VIEWPORT_WIDTH / 2, 500);
}

function renderVictory() {
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    ctx.fillStyle = '#4a8a4a';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ESCAPED!', VIEWPORT_WIDTH / 2, 200);

    ctx.font = '20px Courier New';
    ctx.fillStyle = '#aaa';
    ctx.fillText('You made it to the escape pod and survived.', VIEWPORT_WIDTH / 2, 280);

    ctx.fillStyle = '#8a8a8a';
    ctx.fillText(`Escape Time: ${Math.floor(gameTime / 60)}h ${gameTime % 60}m`, VIEWPORT_WIDTH / 2, 350);
    ctx.fillText(`Global Infection: ${Math.floor(globalInfection)}%`, VIEWPORT_WIDTH / 2, 380);
    ctx.fillText(`Health Remaining: ${Math.floor(player.health)}%`, VIEWPORT_WIDTH / 2, 410);

    let score = Math.floor((100 - globalInfection) * 10 + player.health * 5);
    ctx.fillStyle = '#6a9a6a';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText(`SCORE: ${score}`, VIEWPORT_WIDTH / 2, 470);

    ctx.fillStyle = '#4a8a4a';
    ctx.font = '24px Courier New';
    ctx.fillText('Press SPACE to play again', VIEWPORT_WIDTH / 2, 550);
}

// Test harness
window.testHarness = {
    getState: function() {
        return {
            gameState: gameState,
            player: {
                x: player.x,
                y: player.y,
                health: player.health,
                hunger: player.hunger,
                thirst: player.thirst,
                fatigue: player.fatigue,
                infection: player.infection
            },
            sector: currentSector,
            globalInfection: globalInfection,
            enemies: enemies.length,
            gameTime: gameTime
        };
    },
    getVision: function() {
        return {
            player: { x: player.x, y: player.y, health: player.health },
            enemies: enemies.map(e => ({ type: e.type, x: e.x, y: e.y, hp: e.hp })),
            items: groundItems.map(i => ({ id: i.id, x: i.x, y: i.y })),
            sector: currentSector
        };
    },
    verifyHarness: function() {
        return {
            hasGetState: typeof this.getState === 'function',
            hasGetVision: typeof this.getVision === 'function',
            hasStep: typeof this.step === 'function',
            gameRunning: gameState !== undefined
        };
    },
    step: function(params) {
        if (gameState === GameState.TITLE) {
            gameState = GameState.PLAYING;
        }

        if (params && params.actions) {
            params.actions.forEach(action => {
                if (action.type === 'move') {
                    player.x = action.x;
                    player.y = action.y;
                }
                if (action.type === 'moveDir') {
                    let dx = 0, dy = 0;
                    if (action.direction === 'north') dy = -1;
                    if (action.direction === 'south') dy = 1;
                    if (action.direction === 'east') dx = 1;
                    if (action.direction === 'west') dx = -1;
                    player.x += dx * TILE_SIZE;
                    player.y += dy * TILE_SIZE;
                }
            });
        }

        return this.getState();
    }
};

// Start
init();
