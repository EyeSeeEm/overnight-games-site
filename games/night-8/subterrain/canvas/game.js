// ============================================
// ISOLATION PROTOCOL - Subterrain Clone
// Canvas 2D Implementation
// ============================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 768;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// ============================================
// GAME STATE
// ============================================
const GameState = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    INVENTORY: 3,
    CRAFTING: 4,
    MAP: 5,
    GAME_OVER: 6,
    VICTORY: 7
};

let gameState = GameState.MENU;
let debugMode = false;
let gameTime = 0; // In game minutes
let realTime = 0;
let globalInfection = 0;
let lastTime = 0;
let deltaTime = 0;

// ============================================
// CONSTANTS
// ============================================
const TILE_SIZE = 32;
const PLAYER_SPEED = 150;
const TIME_SCALE = 1; // 1 real second = 1 game minute

// ============================================
// INPUT HANDLING
// ============================================
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false };

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'q' && gameState === GameState.PLAYING) {
        debugMode = !debugMode;
        document.getElementById('debug').style.display = debugMode ? 'block' : 'none';
    }
    if (e.key.toLowerCase() === 'tab' && gameState === GameState.PLAYING) {
        e.preventDefault();
        gameState = GameState.INVENTORY;
    } else if (e.key.toLowerCase() === 'tab' && gameState === GameState.INVENTORY) {
        e.preventDefault();
        gameState = GameState.PLAYING;
    }
    if (e.key.toLowerCase() === 'm' && gameState === GameState.PLAYING) {
        gameState = GameState.MAP;
    } else if (e.key.toLowerCase() === 'm' && gameState === GameState.MAP) {
        gameState = GameState.PLAYING;
    }
    if (e.key === 'Escape') {
        if (gameState === GameState.INVENTORY || gameState === GameState.MAP || gameState === GameState.CRAFTING) {
            gameState = GameState.PLAYING;
        }
    }
    if (e.key.toLowerCase() === 'e' && gameState === GameState.PLAYING) {
        handleInteraction();
    }
    if (e.key.toLowerCase() === 'r' && gameState === GameState.PLAYING) {
        reloadWeapon();
    }
    // Quick slots
    if (e.key === '1') useQuickSlot(0);
    if (e.key === '2') useQuickSlot(1);
    if (e.key === '3') useQuickSlot(2);
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ============================================
// PLAYER
// ============================================
const player = {
    x: 0,
    y: 0,
    width: 28,
    height: 28,
    speed: PLAYER_SPEED,
    health: 100,
    maxHealth: 100,
    hunger: 0,
    infection: 0,
    stamina: 100,
    maxStamina: 100,
    facing: 0, // Angle in radians
    attackCooldown: 0,
    dodgeCooldown: 0,
    invincible: 0,
    currentWeapon: null,
    ammo: { pistol: 0 },
    hasKeycard: false,
    hasDataChip: false,
    tier2Unlocked: false
};

// ============================================
// INVENTORY SYSTEM
// ============================================
const inventory = {
    slots: [],
    maxSlots: 20,
    quickSlots: [null, null, null]
};

const ITEMS = {
    canned_food: { name: 'Canned Food', type: 'consumable', stack: 5, effect: { hunger: -30 } },
    water_bottle: { name: 'Water Bottle', type: 'consumable', stack: 5, effect: { thirst: -40 } },
    mre_pack: { name: 'MRE Pack', type: 'consumable', stack: 3, effect: { hunger: -50 } },
    medkit: { name: 'Medkit', type: 'consumable', stack: 3, effect: { health: 30 } },
    antidote: { name: 'Antidote', type: 'consumable', stack: 3, effect: { infection: -30 } },
    bandage: { name: 'Bandage', type: 'consumable', stack: 5, effect: { health: 10 } },
    scrap_metal: { name: 'Scrap Metal', type: 'material', stack: 20 },
    cloth: { name: 'Cloth', type: 'material', stack: 20 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 20 },
    electronics: { name: 'Electronics', type: 'material', stack: 20 },
    power_cell: { name: 'Power Cell', type: 'material', stack: 10 },
    shiv: { name: 'Shiv', type: 'weapon', damage: 10, speed: 0.4, durability: 20, melee: true },
    pipe_club: { name: 'Pipe Club', type: 'weapon', damage: 20, speed: 1.0, durability: 30, melee: true },
    pistol: { name: 'Pistol', type: 'weapon', damage: 15, speed: 0.5, magazine: 12, accuracy: 0.85, melee: false },
    pistol_ammo: { name: 'Pistol Ammo', type: 'ammo', stack: 50 },
    red_keycard: { name: 'Red Keycard', type: 'key', unique: true },
    data_chip: { name: 'Data Chip', type: 'key', unique: true }
};

function addToInventory(itemId, quantity = 1) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;

    // Check for stackable items
    if (itemDef.stack) {
        for (let slot of inventory.slots) {
            if (slot.id === itemId && slot.quantity < itemDef.stack) {
                const canAdd = Math.min(quantity, itemDef.stack - slot.quantity);
                slot.quantity += canAdd;
                quantity -= canAdd;
                if (quantity <= 0) return true;
            }
        }
    }

    // Add new slots
    while (quantity > 0 && inventory.slots.length < inventory.maxSlots) {
        const addAmount = itemDef.stack ? Math.min(quantity, itemDef.stack) : 1;
        inventory.slots.push({ id: itemId, quantity: addAmount });
        quantity -= addAmount;
    }

    return quantity <= 0;
}

function removeFromInventory(itemId, quantity = 1) {
    for (let i = inventory.slots.length - 1; i >= 0; i--) {
        if (inventory.slots[i].id === itemId) {
            if (inventory.slots[i].quantity <= quantity) {
                quantity -= inventory.slots[i].quantity;
                inventory.slots.splice(i, 1);
            } else {
                inventory.slots[i].quantity -= quantity;
                quantity = 0;
            }
            if (quantity <= 0) return true;
        }
    }
    return false;
}

function countItem(itemId) {
    return inventory.slots.reduce((sum, slot) => slot.id === itemId ? sum + slot.quantity : sum, 0);
}

function useItem(slotIndex) {
    const slot = inventory.slots[slotIndex];
    if (!slot) return;

    const item = ITEMS[slot.id];
    if (item.type === 'consumable') {
        if (item.effect.health) player.health = Math.min(player.maxHealth, player.health + item.effect.health);
        if (item.effect.hunger) player.hunger = Math.max(0, player.hunger + item.effect.hunger);
        if (item.effect.infection) player.infection = Math.max(0, player.infection + item.effect.infection);

        slot.quantity--;
        if (slot.quantity <= 0) inventory.slots.splice(slotIndex, 1);

        // Visual feedback
        createFloatingText(player.x, player.y - 20, item.effect.health ? `+${item.effect.health} HP` : 'Used', '#0f0');
    } else if (item.type === 'weapon') {
        player.currentWeapon = slot.id;
    } else if (slot.id === 'red_keycard') {
        player.hasKeycard = true;
    } else if (slot.id === 'data_chip') {
        player.hasDataChip = true;
    }
}

function useQuickSlot(index) {
    const slot = inventory.quickSlots[index];
    if (slot !== null && inventory.slots[slot]) {
        useItem(slot);
    }
}

// ============================================
// CRAFTING SYSTEM
// ============================================
const RECIPES = {
    tier1: [
        { id: 'shiv', name: 'Shiv', materials: { scrap_metal: 2 }, time: 10 },
        { id: 'pipe_club', name: 'Pipe Club', materials: { scrap_metal: 3 }, time: 15 },
        { id: 'bandage', name: 'Bandage', materials: { cloth: 2 }, time: 5 }
    ],
    tier2: [
        { id: 'pistol', name: 'Pistol', materials: { scrap_metal: 5, electronics: 2 }, time: 30 },
        { id: 'pistol_ammo', name: 'Pistol Ammo x10', materials: { scrap_metal: 2, chemicals: 1 }, time: 10, quantity: 10 },
        { id: 'antidote', name: 'Antidote', materials: { chemicals: 3 }, time: 15 },
        { id: 'medkit', name: 'Medkit', materials: { cloth: 2, chemicals: 2 }, time: 20 }
    ]
};

function canCraft(recipe) {
    for (let mat in recipe.materials) {
        if (countItem(mat) < recipe.materials[mat]) return false;
    }
    return true;
}

function craft(recipe) {
    if (!canCraft(recipe)) return false;

    for (let mat in recipe.materials) {
        removeFromInventory(mat, recipe.materials[mat]);
    }

    addToInventory(recipe.id, recipe.quantity || 1);
    gameTime += recipe.time;
    return true;
}

// ============================================
// SECTORS AND MAPS
// ============================================
const SECTOR_TYPES = {
    HUB: 'hub',
    STORAGE: 'storage',
    MEDICAL: 'medical',
    RESEARCH: 'research',
    ESCAPE: 'escape'
};

const sectors = {
    hub: {
        name: 'Central Hub',
        powerCost: 0,
        powered: true,
        width: 15,
        height: 15,
        visited: false,
        cleared: false,
        connections: { north: 'escape', south: 'storage', east: 'medical', west: 'research' },
        enemies: [],
        items: [],
        containers: [],
        interactables: []
    },
    storage: {
        name: 'Storage Wing',
        powerCost: 100,
        powered: false,
        width: 20,
        height: 20,
        visited: false,
        cleared: false,
        connections: { north: 'hub' },
        enemies: [],
        items: [],
        containers: [],
        interactables: []
    },
    medical: {
        name: 'Medical Bay',
        powerCost: 150,
        powered: false,
        width: 20,
        height: 20,
        visited: false,
        cleared: false,
        connections: { west: 'hub' },
        enemies: [],
        items: [],
        containers: [],
        interactables: []
    },
    research: {
        name: 'Research Lab',
        powerCost: 200,
        powered: false,
        width: 25,
        height: 25,
        visited: false,
        cleared: false,
        connections: { east: 'hub' },
        enemies: [],
        items: [],
        containers: [],
        interactables: []
    },
    escape: {
        name: 'Escape Pod',
        powerCost: 300,
        powered: false,
        width: 15,
        height: 15,
        visited: false,
        cleared: false,
        connections: { south: 'hub' },
        enemies: [],
        items: [],
        containers: [],
        interactables: []
    }
};

let currentSector = 'hub';
let sectorTiles = [];
let camera = { x: 0, y: 0 };

// Power system
let powerCapacity = 500;
let powerUsed = 0;

function calculatePower() {
    powerUsed = 0;
    for (let id in sectors) {
        if (sectors[id].powered && sectors[id].powerCost > 0) {
            powerUsed += sectors[id].powerCost;
        }
    }
}

function togglePower(sectorId) {
    const sector = sectors[sectorId];
    if (!sector || sector.powerCost === 0) return;

    if (sector.powered) {
        sector.powered = false;
    } else {
        const newUsage = powerUsed + sector.powerCost;
        if (newUsage <= powerCapacity) {
            sector.powered = true;
        }
    }
    calculatePower();
}

// ============================================
// MAP GENERATION
// ============================================
function generateSector(sectorId) {
    const sector = sectors[sectorId];
    const w = sector.width;
    const h = sector.height;

    // Create tile array
    sectorTiles = [];
    for (let y = 0; y < h; y++) {
        sectorTiles[y] = [];
        for (let x = 0; x < w; x++) {
            // Walls around edges
            if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
                sectorTiles[y][x] = 1; // Wall
            } else {
                sectorTiles[y][x] = 0; // Floor
            }
        }
    }

    // Add doors for connections
    if (sector.connections.north) {
        const doorX = Math.floor(w / 2);
        sectorTiles[0][doorX] = 2; // Door
        sectorTiles[0][doorX - 1] = 2;
    }
    if (sector.connections.south) {
        const doorX = Math.floor(w / 2);
        sectorTiles[h - 1][doorX] = 2;
        sectorTiles[h - 1][doorX - 1] = 2;
    }
    if (sector.connections.east) {
        const doorY = Math.floor(h / 2);
        sectorTiles[doorY][w - 1] = 2;
        sectorTiles[doorY - 1][w - 1] = 2;
    }
    if (sector.connections.west) {
        const doorY = Math.floor(h / 2);
        sectorTiles[doorY][0] = 2;
        sectorTiles[doorY - 1][0] = 2;
    }

    // Add internal walls for variety
    generateInternalLayout(sectorId, w, h);

    // Spawn sector-specific content if first visit
    if (!sector.visited) {
        sector.visited = true;
        spawnSectorContent(sectorId);
    }
}

function generateInternalLayout(sectorId, w, h) {
    // Add rooms and corridors based on sector type
    switch (sectorId) {
        case 'hub':
            // Central safe room with facilities
            addRoom(4, 4, 7, 7);
            break;
        case 'storage':
            // Multiple storage rooms
            addRoom(2, 2, 6, 6);
            addRoom(12, 2, 6, 6);
            addRoom(2, 12, 6, 6);
            addRoom(12, 12, 6, 6);
            // Connect rooms with corridors
            for (let x = 8; x < 12; x++) sectorTiles[5][x] = 0;
            for (let x = 8; x < 12; x++) sectorTiles[14][x] = 0;
            for (let y = 8; y < 12; y++) sectorTiles[y][5] = 0;
            for (let y = 8; y < 12; y++) sectorTiles[y][14] = 0;
            break;
        case 'medical':
            // Medical bays with examination rooms
            addRoom(2, 2, 7, 5);
            addRoom(11, 2, 7, 5);
            addRoom(2, 13, 7, 5);
            addRoom(11, 13, 7, 5);
            // Central corridor
            for (let x = 2; x < 18; x++) {
                sectorTiles[9][x] = 0;
                sectorTiles[10][x] = 0;
            }
            break;
        case 'research':
            // Large lab with partitions
            addRoom(2, 2, 10, 8);
            addRoom(14, 2, 9, 8);
            addRoom(2, 14, 10, 9);
            addRoom(14, 14, 9, 9);
            // Corridors
            for (let x = 2; x < 23; x++) {
                sectorTiles[11][x] = 0;
                sectorTiles[12][x] = 0;
            }
            for (let y = 2; y < 23; y++) {
                sectorTiles[y][12] = 0;
            }
            break;
        case 'escape':
            // Simple room with escape pod in center
            addRoom(3, 3, 9, 9);
            break;
    }
}

function addRoom(rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh && y < sectorTiles.length - 1; y++) {
        for (let x = rx; x < rx + rw && x < sectorTiles[0].length - 1; x++) {
            sectorTiles[y][x] = 0;
        }
    }
}

function spawnSectorContent(sectorId) {
    const sector = sectors[sectorId];
    sector.enemies = [];
    sector.items = [];
    sector.containers = [];
    sector.interactables = [];

    const w = sector.width;
    const h = sector.height;

    switch (sectorId) {
        case 'hub':
            // Workbench
            sector.interactables.push({
                type: 'workbench',
                x: 6 * TILE_SIZE,
                y: 6 * TILE_SIZE,
                width: TILE_SIZE * 2,
                height: TILE_SIZE
            });
            // Bed
            sector.interactables.push({
                type: 'bed',
                x: 8 * TILE_SIZE,
                y: 6 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE * 2
            });
            // Power panel
            sector.interactables.push({
                type: 'power_panel',
                x: 5 * TILE_SIZE,
                y: 8 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE
            });
            // Storage locker
            sector.containers.push({
                x: 9 * TILE_SIZE,
                y: 8 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                opened: false,
                loot: [{ id: 'canned_food', qty: 2 }, { id: 'medkit', qty: 1 }]
            });
            break;

        case 'storage':
            // Enemies
            for (let i = 0; i < 4; i++) {
                spawnEnemy(sector, 'shambler');
            }
            for (let i = 0; i < 2; i++) {
                spawnEnemy(sector, 'crawler');
            }
            // Containers with loot
            sector.containers.push({ x: 3 * TILE_SIZE, y: 3 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'scrap_metal', qty: 5 }, { id: 'canned_food', qty: 2 }] });
            sector.containers.push({ x: 14 * TILE_SIZE, y: 3 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'cloth', qty: 4 }, { id: 'chemicals', qty: 2 }] });
            sector.containers.push({ x: 3 * TILE_SIZE, y: 14 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'scrap_metal', qty: 3 }, { id: 'pistol_ammo', qty: 6 }] });
            sector.containers.push({ x: 14 * TILE_SIZE, y: 14 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'medkit', qty: 1 }, { id: 'canned_food', qty: 3 }] });
            sector.containers.push({ x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'electronics', qty: 2 }] });
            // Workbench
            sector.interactables.push({
                type: 'workbench',
                x: 10 * TILE_SIZE,
                y: 10 * TILE_SIZE,
                width: TILE_SIZE * 2,
                height: TILE_SIZE
            });
            break;

        case 'medical':
            // Enemies
            for (let i = 0; i < 3; i++) {
                spawnEnemy(sector, 'shambler');
            }
            for (let i = 0; i < 2; i++) {
                spawnEnemy(sector, 'spitter');
            }
            // Medical station
            sector.interactables.push({
                type: 'medical_station',
                x: 9 * TILE_SIZE,
                y: 9 * TILE_SIZE,
                width: TILE_SIZE * 2,
                height: TILE_SIZE * 2
            });
            // Medical containers
            sector.containers.push({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'medkit', qty: 2 }, { id: 'antidote', qty: 1 }] });
            sector.containers.push({ x: 14 * TILE_SIZE, y: 4 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'chemicals', qty: 4 }, { id: 'bandage', qty: 3 }] });
            sector.containers.push({ x: 4 * TILE_SIZE, y: 15 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'medkit', qty: 1 }, { id: 'chemicals', qty: 2 }] });
            sector.containers.push({ x: 14 * TILE_SIZE, y: 15 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'antidote', qty: 2 }] });
            break;

        case 'research':
            // Enemies
            for (let i = 0; i < 4; i++) {
                spawnEnemy(sector, 'crawler');
            }
            for (let i = 0; i < 2; i++) {
                spawnEnemy(sector, 'spitter');
            }
            spawnEnemy(sector, 'brute');
            // Research terminal
            sector.interactables.push({
                type: 'research_terminal',
                x: 12 * TILE_SIZE,
                y: 5 * TILE_SIZE,
                width: TILE_SIZE * 2,
                height: TILE_SIZE
            });
            // Keycard and data chip locations
            sector.containers.push({ x: 5 * TILE_SIZE, y: 5 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'red_keycard', qty: 1 }] });
            sector.containers.push({ x: 18 * TILE_SIZE, y: 5 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'data_chip', qty: 1 }] });
            sector.containers.push({ x: 5 * TILE_SIZE, y: 18 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'electronics', qty: 3 }, { id: 'power_cell', qty: 2 }] });
            sector.containers.push({ x: 18 * TILE_SIZE, y: 18 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, opened: false, loot: [{ id: 'scrap_metal', qty: 4 }, { id: 'pistol_ammo', qty: 12 }] });
            break;

        case 'escape':
            // Heavy enemy presence
            for (let i = 0; i < 3; i++) {
                spawnEnemy(sector, 'shambler');
            }
            for (let i = 0; i < 2; i++) {
                spawnEnemy(sector, 'brute');
            }
            spawnEnemy(sector, 'spitter');
            // Escape pod
            sector.interactables.push({
                type: 'escape_pod',
                x: 6 * TILE_SIZE,
                y: 6 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: TILE_SIZE * 3
            });
            break;
    }
}

function spawnEnemy(sector, type) {
    const margin = 3;
    let x, y, attempts = 0;
    do {
        x = (margin + Math.random() * (sector.width - margin * 2)) * TILE_SIZE;
        y = (margin + Math.random() * (sector.height - margin * 2)) * TILE_SIZE;
        attempts++;
    } while (attempts < 50 && isWall(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)));

    const enemy = createEnemy(type, x, y);
    sector.enemies.push(enemy);
}

// ============================================
// ENEMY SYSTEM
// ============================================
const ENEMY_TYPES = {
    shambler: { hp: 30, damage: 10, speed: 0.5, attackRate: 1.5, infection: 5, color: '#8b4513', size: 28 },
    crawler: { hp: 20, damage: 8, speed: 1.2, attackRate: 1.0, infection: 5, color: '#654321', size: 20 },
    spitter: { hp: 25, damage: 15, speed: 0.4, attackRate: 2.5, infection: 10, color: '#556b2f', size: 26, ranged: true },
    brute: { hp: 80, damage: 25, speed: 0.3, attackRate: 2.0, infection: 8, color: '#4a0000', size: 40 },
    cocoon: { hp: 50, damage: 0, speed: 0, attackRate: 0, infection: 1, color: '#3d1e10', size: 36, stationary: true }
};

function createEnemy(type, x, y) {
    const def = ENEMY_TYPES[type];
    // Scale by global infection
    const hpMult = 1 + (globalInfection / 100) * 1.0;
    const dmgMult = 1 + (globalInfection / 100) * 0.5;

    return {
        type: type,
        x: x,
        y: y,
        width: def.size,
        height: def.size,
        hp: Math.floor(def.hp * hpMult),
        maxHp: Math.floor(def.hp * hpMult),
        damage: Math.floor(def.damage * dmgMult),
        speed: def.speed * PLAYER_SPEED,
        attackCooldown: 0,
        attackRate: def.attackRate,
        infection: def.infection,
        color: def.color,
        ranged: def.ranged || false,
        stationary: def.stationary || false,
        state: 'idle',
        targetX: x,
        targetY: y,
        alertTime: 0,
        dead: false
    };
}

function updateEnemies(dt) {
    const sector = sectors[currentSector];

    for (let enemy of sector.enemies) {
        if (enemy.dead) continue;

        enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection range
        const detectRange = enemy.ranged ? 320 : 256;

        if (dist < detectRange) {
            enemy.state = 'alert';
            enemy.alertTime = 10;

            if (!enemy.stationary) {
                // Move toward player
                if (enemy.ranged && dist < 150) {
                    // Ranged enemies retreat if too close
                    enemy.x -= (dx / dist) * enemy.speed * dt;
                    enemy.y -= (dy / dist) * enemy.speed * dt;
                } else if (dist > (enemy.ranged ? 100 : 40)) {
                    enemy.x += (dx / dist) * enemy.speed * dt;
                    enemy.y += (dy / dist) * enemy.speed * dt;
                }
            }

            // Attack
            const attackRange = enemy.ranged ? 250 : 45;
            if (dist < attackRange && enemy.attackCooldown <= 0) {
                if (enemy.ranged) {
                    // Shoot projectile
                    spawnEnemyProjectile(enemy, dx, dy, dist);
                } else {
                    // Melee attack
                    if (player.invincible <= 0) {
                        player.health -= enemy.damage;
                        player.infection += enemy.infection;
                        createFloatingText(player.x, player.y - 30, `-${enemy.damage}`, '#f00');
                        screenShake(5, 0.1);
                    }
                }
                enemy.attackCooldown = enemy.attackRate;
            }
        } else {
            enemy.alertTime -= dt;
            if (enemy.alertTime <= 0) {
                enemy.state = 'idle';
                // Wander randomly
                if (!enemy.stationary && Math.random() < 0.02) {
                    enemy.targetX = enemy.x + (Math.random() - 0.5) * 100;
                    enemy.targetY = enemy.y + (Math.random() - 0.5) * 100;
                }
            }
        }

        // Wall collision
        const tx = Math.floor(enemy.x / TILE_SIZE);
        const ty = Math.floor(enemy.y / TILE_SIZE);
        if (isWall(tx, ty)) {
            enemy.x = (tx + 0.5) * TILE_SIZE + (enemy.x > tx * TILE_SIZE + TILE_SIZE / 2 ? TILE_SIZE : -TILE_SIZE);
            enemy.y = (ty + 0.5) * TILE_SIZE + (enemy.y > ty * TILE_SIZE + TILE_SIZE / 2 ? TILE_SIZE : -TILE_SIZE);
        }
    }

    // Remove dead enemies
    sector.enemies = sector.enemies.filter(e => !e.dead);
}

// ============================================
// PROJECTILES
// ============================================
let projectiles = [];

function spawnProjectile(x, y, angle, damage, speed, friendly) {
    projectiles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        friendly: friendly,
        lifetime: 2,
        color: friendly ? '#ff0' : '#0f0'
    });
}

function spawnEnemyProjectile(enemy, dx, dy, dist) {
    const angle = Math.atan2(dy, dx);
    projectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        damage: enemy.damage,
        infection: enemy.infection,
        friendly: false,
        lifetime: 3,
        color: '#4f4',
        acid: true
    });
}

function updateProjectiles(dt) {
    const sector = sectors[currentSector];

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.lifetime -= dt;

        // Wall collision
        const tx = Math.floor(p.x / TILE_SIZE);
        const ty = Math.floor(p.y / TILE_SIZE);
        if (isWall(tx, ty)) {
            if (p.acid) {
                // Create acid puddle
                acidPuddles.push({ x: p.x, y: p.y, lifetime: 3, radius: 20 });
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Hit detection
        if (p.friendly) {
            for (let enemy of sector.enemies) {
                if (!enemy.dead && Math.abs(p.x - enemy.x) < enemy.width / 2 && Math.abs(p.y - enemy.y) < enemy.height / 2) {
                    enemy.hp -= p.damage;
                    createFloatingText(enemy.x, enemy.y - 20, `-${p.damage}`, '#ff0');
                    if (enemy.hp <= 0) {
                        killEnemy(enemy);
                    }
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Hit player
            if (player.invincible <= 0 && Math.abs(p.x - player.x) < player.width / 2 && Math.abs(p.y - player.y) < player.height / 2) {
                player.health -= p.damage;
                if (p.infection) player.infection += p.infection;
                createFloatingText(player.x, player.y - 30, `-${p.damage}`, '#f00');
                screenShake(8, 0.15);
                projectiles.splice(i, 1);
            }
        }

        if (p.lifetime <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

// ============================================
// ACID PUDDLES
// ============================================
let acidPuddles = [];

function updateAcidPuddles(dt) {
    for (let i = acidPuddles.length - 1; i >= 0; i--) {
        const puddle = acidPuddles[i];
        puddle.lifetime -= dt;

        // Damage player if standing in puddle
        const dx = player.x - puddle.x;
        const dy = player.y - puddle.y;
        if (Math.sqrt(dx * dx + dy * dy) < puddle.radius && player.invincible <= 0) {
            player.infection += 2 * dt;
        }

        if (puddle.lifetime <= 0) {
            acidPuddles.splice(i, 1);
        }
    }
}

// ============================================
// BLOOD POOLS (Static decals)
// ============================================
let bloodPools = [];

function killEnemy(enemy) {
    enemy.dead = true;
    // Create static blood pool with random angle
    bloodPools.push({
        x: enemy.x,
        y: enemy.y,
        radius: enemy.width * 0.6 + Math.random() * 10,
        color: enemy.type === 'spitter' ? '#4a5' : '#600',
        angle: Math.random() * Math.PI * 2
    });

    // Create death particles
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        createFloatingText(
            enemy.x + Math.cos(angle) * 10,
            enemy.y + Math.sin(angle) * 10 - 20,
            '*',
            enemy.type === 'spitter' ? '#4f4' : '#f44'
        );
    }

    createFloatingText(enemy.x, enemy.y - 30, 'KILLED', '#f00');
    screenShake(6, 0.15);
}

// ============================================
// FLOATING TEXT
// ============================================
let floatingTexts = [];

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        lifetime: 1,
        vy: -50
    });
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.lifetime -= dt;
        if (ft.lifetime <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// ============================================
// SCREEN SHAKE
// ============================================
let shake = { amount: 0, duration: 0 };

function screenShake(amount, duration) {
    shake.amount = amount;
    shake.duration = duration;
}

function updateScreenShake(dt) {
    if (shake.duration > 0) {
        shake.duration -= dt;
    }
}

// ============================================
// COMBAT
// ============================================
let muzzleFlash = { active: false, x: 0, y: 0, time: 0 };

function playerAttack() {
    if (player.attackCooldown > 0) return;

    const sector = sectors[currentSector];
    const weapon = player.currentWeapon ? ITEMS[player.currentWeapon] : null;

    if (weapon && !weapon.melee) {
        // Ranged attack
        if (player.ammo.pistol > 0) {
            const angle = Math.atan2(mouse.y - HEIGHT / 2, mouse.x - WIDTH / 2);

            // Accuracy roll
            const spread = (1 - weapon.accuracy) * 0.3;
            const finalAngle = angle + (Math.random() - 0.5) * spread;

            spawnProjectile(player.x, player.y, finalAngle, weapon.damage, 500, true);
            player.ammo.pistol--;
            player.attackCooldown = weapon.speed;

            // Muzzle flash
            muzzleFlash.active = true;
            muzzleFlash.x = player.x + Math.cos(angle) * 20;
            muzzleFlash.y = player.y + Math.sin(angle) * 20;
            muzzleFlash.time = 0.08;

            screenShake(3, 0.05);
        }
    } else {
        // Melee attack
        const damage = weapon ? weapon.damage : 5;
        const speed = weapon ? weapon.speed : 0.5;
        const range = 50;

        const angle = Math.atan2(mouse.y - HEIGHT / 2, mouse.x - WIDTH / 2);

        // Check enemies in arc
        for (let enemy of sector.enemies) {
            if (enemy.dead) continue;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < range) {
                const enemyAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(normalizeAngle(enemyAngle - angle));

                if (angleDiff < Math.PI / 3) { // 60 degree arc
                    enemy.hp -= damage;
                    createFloatingText(enemy.x, enemy.y - 20, `-${damage}`, '#ff0');
                    if (enemy.hp <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }

        player.attackCooldown = speed;
        screenShake(2, 0.05);
    }
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function reloadWeapon() {
    if (player.currentWeapon === 'pistol') {
        const ammoNeeded = 12 - player.ammo.pistol;
        const ammoAvailable = countItem('pistol_ammo');
        const toLoad = Math.min(ammoNeeded, ammoAvailable);
        if (toLoad > 0) {
            removeFromInventory('pistol_ammo', toLoad);
            player.ammo.pistol += toLoad;
            createFloatingText(player.x, player.y - 30, `Reloaded +${toLoad}`, '#0ff');
        }
    }
}

// ============================================
// PLAYER DODGE
// ============================================
function playerDodge() {
    if (player.dodgeCooldown > 0 || player.stamina < 20) return;

    const angle = Math.atan2(mouse.y - HEIGHT / 2, mouse.x - WIDTH / 2);
    player.x += Math.cos(angle) * 80;
    player.y += Math.sin(angle) * 80;
    player.stamina -= 20;
    player.invincible = 0.3;
    player.dodgeCooldown = 1.5;
}

// ============================================
// INTERACTION
// ============================================
function handleInteraction() {
    const sector = sectors[currentSector];

    // Check containers
    for (let container of sector.containers) {
        if (container.opened) continue;

        const dx = player.x - (container.x + container.width / 2);
        const dy = player.y - (container.y + container.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
            container.opened = true;
            for (let item of container.loot) {
                if (addToInventory(item.id, item.qty)) {
                    createFloatingText(container.x, container.y - 20, `+${item.qty} ${ITEMS[item.id].name}`, '#0f0');
                }
            }
            return;
        }
    }

    // Check interactables
    for (let inter of sector.interactables) {
        const dx = player.x - (inter.x + inter.width / 2);
        const dy = player.y - (inter.y + inter.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 80) {
            handleInteractable(inter);
            return;
        }
    }
}

function handleInteractable(inter) {
    switch (inter.type) {
        case 'workbench':
            gameState = GameState.CRAFTING;
            break;
        case 'bed':
            // Sleep - recover stamina, pass time
            player.stamina = player.maxStamina;
            gameTime += 60;
            createFloatingText(player.x, player.y - 30, 'Rested', '#0ff');
            break;
        case 'power_panel':
            // Show power management (simplified - auto cycle through)
            showPowerPanel();
            break;
        case 'medical_station':
            if (sectors[currentSector].powered) {
                player.health = Math.min(player.maxHealth, player.health + 50);
                player.infection = Math.max(0, player.infection - 25);
                gameTime += 30;
                createFloatingText(player.x, player.y - 30, 'Healed!', '#0f0');
            } else {
                createFloatingText(player.x, player.y - 30, 'No Power!', '#f00');
            }
            break;
        case 'research_terminal':
            if (sectors[currentSector].powered && player.hasDataChip && !player.tier2Unlocked) {
                player.tier2Unlocked = true;
                createFloatingText(player.x, player.y - 30, 'Tier 2 Unlocked!', '#ff0');
            } else if (!sectors[currentSector].powered) {
                createFloatingText(player.x, player.y - 30, 'No Power!', '#f00');
            } else if (!player.hasDataChip) {
                createFloatingText(player.x, player.y - 30, 'Need Data Chip', '#f00');
            }
            break;
        case 'escape_pod':
            if (!sectors[currentSector].powered) {
                createFloatingText(player.x, player.y - 30, 'No Power!', '#f00');
            } else if (!player.hasKeycard) {
                createFloatingText(player.x, player.y - 30, 'Need Red Keycard!', '#f00');
            } else {
                // Victory!
                gameState = GameState.VICTORY;
                document.getElementById('victoryScreen').classList.remove('hidden');
                document.getElementById('victoryStats').textContent =
                    `Time: ${Math.floor(gameTime / 60)}h ${gameTime % 60}m | Global Infection: ${globalInfection.toFixed(1)}%`;
            }
            break;
    }
}

let powerPanelOpen = false;

function showPowerPanel() {
    // Cycle through sectors to toggle power
    const sectorIds = Object.keys(sectors).filter(id => sectors[id].powerCost > 0);
    const currentPoweredIndex = sectorIds.findIndex(id => sectors[id].powered);

    // Toggle next unpowered sector
    for (let id of sectorIds) {
        if (!sectors[id].powered && powerUsed + sectors[id].powerCost <= powerCapacity) {
            sectors[id].powered = true;
            calculatePower();
            createFloatingText(player.x, player.y - 30, `${sectors[id].name} Powered`, '#0ff');
            return;
        }
    }

    // If all affordable are powered, turn off first powered
    for (let id of sectorIds) {
        if (sectors[id].powered) {
            sectors[id].powered = false;
            calculatePower();
            createFloatingText(player.x, player.y - 30, `${sectors[id].name} Unpowered`, '#f80');
            return;
        }
    }
}

// ============================================
// SECTOR TRANSITIONS
// ============================================
function checkSectorTransition() {
    const sector = sectors[currentSector];
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);

    // Check if on door tile
    if (sectorTiles[tileY] && sectorTiles[tileY][tileX] === 2) {
        let newSector = null;
        let spawnDir = '';

        // Determine which door
        if (tileY === 0 && sector.connections.north) {
            newSector = sector.connections.north;
            spawnDir = 'south';
        } else if (tileY === sector.height - 1 && sector.connections.south) {
            newSector = sector.connections.south;
            spawnDir = 'north';
        } else if (tileX === 0 && sector.connections.west) {
            newSector = sector.connections.west;
            spawnDir = 'east';
        } else if (tileX === sector.width - 1 && sector.connections.east) {
            newSector = sector.connections.east;
            spawnDir = 'west';
        }

        if (newSector) {
            transitionToSector(newSector, spawnDir);
        }
    }
}

function transitionToSector(sectorId, spawnDir) {
    currentSector = sectorId;
    generateSector(sectorId);

    const sector = sectors[sectorId];
    const w = sector.width * TILE_SIZE;
    const h = sector.height * TILE_SIZE;

    // Spawn player at correct location based on entry direction
    switch (spawnDir) {
        case 'north':
            player.x = w / 2;
            player.y = TILE_SIZE * 2;
            break;
        case 'south':
            player.x = w / 2;
            player.y = h - TILE_SIZE * 2;
            break;
        case 'east':
            player.x = w - TILE_SIZE * 2;
            player.y = h / 2;
            break;
        case 'west':
            player.x = TILE_SIZE * 2;
            player.y = h / 2;
            break;
    }

    // Clear projectiles on transition
    projectiles = [];
    acidPuddles = [];

    // Travel time
    gameTime += 5;
}

// ============================================
// COLLISION
// ============================================
function isWall(tx, ty) {
    if (ty < 0 || ty >= sectorTiles.length) return true;
    if (tx < 0 || tx >= sectorTiles[0].length) return true;
    return sectorTiles[ty][tx] === 1;
}

function checkWallCollision(x, y, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;

    const corners = [
        { x: x - halfW, y: y - halfH },
        { x: x + halfW, y: y - halfH },
        { x: x - halfW, y: y + halfH },
        { x: x + halfW, y: y + halfH }
    ];

    for (let corner of corners) {
        const tx = Math.floor(corner.x / TILE_SIZE);
        const ty = Math.floor(corner.y / TILE_SIZE);
        if (isWall(tx, ty)) return true;
    }
    return false;
}

// ============================================
// ITEM PICKUPS
// ============================================
function checkItemPickups() {
    const sector = sectors[currentSector];

    for (let i = sector.items.length - 1; i >= 0; i--) {
        const item = sector.items[i];
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            if (addToInventory(item.id, item.qty)) {
                createFloatingText(item.x, item.y - 20, `+${item.qty} ${ITEMS[item.id].name}`, '#0f0');
                sector.items.splice(i, 1);
            }
        }
    }
}

// ============================================
// UPDATE LOOP
// ============================================
function update(dt) {
    if (gameState !== GameState.PLAYING) return;

    // Time progression
    realTime += dt;
    if (realTime >= 1) {
        realTime -= 1;
        gameTime += TIME_SCALE;
        globalInfection += 0.1;

        // Hunger increases
        player.hunger += 0.1;

        // Infection in unpowered sectors
        if (!sectors[currentSector].powered && currentSector !== 'hub') {
            player.infection += 0.5;
        }
    }

    // Check lose conditions
    if (player.health <= 0) {
        gameState = GameState.GAME_OVER;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('deathReason').textContent = 'You died. The facility claims another victim.';
        return;
    }
    if (player.infection >= 100) {
        gameState = GameState.GAME_OVER;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('deathReason').textContent = 'The infection has consumed you.';
        return;
    }
    if (globalInfection >= 100) {
        gameState = GameState.GAME_OVER;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('deathReason').textContent = 'The facility is lost. No one escapes.';
        return;
    }

    // Hunger effects
    let speedMod = 1;
    if (player.hunger >= 75) {
        speedMod = 0.75;
        player.health -= dt;
    } else if (player.hunger >= 50) {
        speedMod = 0.9;
    }

    // Infection effects
    if (player.infection >= 75) {
        player.health -= 2 * dt;
    }

    // Cooldowns
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
    player.invincible = Math.max(0, player.invincible - dt);

    // Stamina regen
    player.stamina = Math.min(player.maxStamina, player.stamina + 5 * dt);

    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * player.speed * speedMod * dt;
        const newY = player.y + dy * player.speed * speedMod * dt;

        if (!checkWallCollision(newX, player.y, player.width, player.height)) {
            player.x = newX;
        }
        if (!checkWallCollision(player.x, newY, player.width, player.height)) {
            player.y = newY;
        }
    }

    // Player facing
    player.facing = Math.atan2(mouse.y - HEIGHT / 2, mouse.x - WIDTH / 2);

    // Attack
    if (mouse.down) {
        playerAttack();
    }

    // Dodge
    if (mouse.rightDown) {
        playerDodge();
    }

    // Muzzle flash
    if (muzzleFlash.active) {
        muzzleFlash.time -= dt;
        if (muzzleFlash.time <= 0) muzzleFlash.active = false;
    }

    // Update game objects
    updateEnemies(dt);
    updateProjectiles(dt);
    updateAcidPuddles(dt);
    updateFloatingTexts(dt);
    updateScreenShake(dt);

    // Check pickups
    checkItemPickups();

    // Check sector transitions
    checkSectorTransition();

    // Update camera
    const sector = sectors[currentSector];
    const mapWidth = sector.width * TILE_SIZE;
    const mapHeight = sector.height * TILE_SIZE;

    camera.x = player.x - WIDTH / 2;
    camera.y = player.y - HEIGHT / 2;

    // Clamp camera
    camera.x = Math.max(0, Math.min(mapWidth - WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(mapHeight - HEIGHT, camera.y));

    // Apply screen shake
    if (shake.duration > 0) {
        camera.x += (Math.random() - 0.5) * shake.amount * 2;
        camera.y += (Math.random() - 0.5) * shake.amount * 2;
    }

    // Update debug display
    if (debugMode) {
        updateDebug();
    }
}

// ============================================
// RENDERING
// ============================================
function render() {
    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === GameState.PLAYING || gameState === GameState.INVENTORY ||
        gameState === GameState.CRAFTING || gameState === GameState.MAP) {

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Draw tiles
        renderTiles();

        // Draw blood pools (static decals)
        renderBloodPools();

        // Draw acid puddles
        renderAcidPuddles();

        // Draw containers and interactables
        renderObjects();

        // Draw items on ground
        renderGroundItems();

        // Draw enemies
        renderEnemies();

        // Draw projectiles
        renderProjectiles();

        // Draw player
        renderPlayer();

        // Draw muzzle flash with better effect
        if (muzzleFlash.active) {
            ctx.save();
            ctx.translate(muzzleFlash.x, muzzleFlash.y);

            // Outer glow
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
            glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
            glowGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)');
            glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            // Yellow middle
            ctx.fillStyle = '#ff8';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            // Directional flash lines
            ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const angle = player.facing + (i - 1.5) * 0.3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Draw floating texts
        renderFloatingTexts();

        // Draw darkness/fog for atmosphere (always, but stronger in unpowered sectors)
        renderDarkness();

        ctx.restore();

        // Draw HUD
        renderHUD();

        // Draw inventory screen
        if (gameState === GameState.INVENTORY) {
            renderInventory();
        }

        // Draw crafting screen
        if (gameState === GameState.CRAFTING) {
            renderCrafting();
        }

        // Draw map screen
        if (gameState === GameState.MAP) {
            renderMap();
        }
    }
}

// Pre-generate noise texture for floor variation
const noiseCanvas = document.createElement('canvas');
noiseCanvas.width = 64;
noiseCanvas.height = 64;
const noiseCtx = noiseCanvas.getContext('2d');
const noiseData = noiseCtx.createImageData(64, 64);
for (let i = 0; i < noiseData.data.length; i += 4) {
    const v = Math.random() * 30;
    noiseData.data[i] = v;
    noiseData.data[i + 1] = v;
    noiseData.data[i + 2] = v;
    noiseData.data[i + 3] = 40;
}
noiseCtx.putImageData(noiseData, 0, 0);

function renderTiles() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endX = Math.min(sectorTiles[0].length, Math.ceil((camera.x + WIDTH) / TILE_SIZE) + 1);
    const endY = Math.min(sectorTiles.length, Math.ceil((camera.y + HEIGHT) / TILE_SIZE) + 1);

    const sector = sectors[currentSector];
    const centerX = sector.width / 2;
    const centerY = sector.height / 2;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = sectorTiles[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            // Distance from center for corruption effect
            const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const maxDist = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
            const corruption = Math.min(1, (distFromCenter / maxDist) * (globalInfection / 50 + 0.3));

            // Floor
            if (tile === 0 || tile === 2) {
                // Base metal floor with subtle variation
                const baseColor = sector.powered ? 42 : 32;
                const variation = ((x * 7 + y * 13) % 10) - 5;
                ctx.fillStyle = `rgb(${baseColor + variation}, ${baseColor + variation - 2}, ${baseColor + variation - 4})`;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Industrial grid pattern
                ctx.strokeStyle = `rgb(${25 + variation}, ${25 + variation}, ${28 + variation})`;
                ctx.lineWidth = 1;

                // Main grid lines
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + TILE_SIZE, py);
                ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
                ctx.lineTo(px, py + TILE_SIZE);
                ctx.closePath();
                ctx.stroke();

                // Cross pattern (industrial floor)
                ctx.strokeStyle = '#333';
                ctx.beginPath();
                ctx.moveTo(px + 4, py + 4);
                ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE - 4);
                ctx.moveTo(px + TILE_SIZE - 4, py + 4);
                ctx.lineTo(px + 4, py + TILE_SIZE - 4);
                ctx.stroke();

                // Diamond pattern in center
                ctx.strokeStyle = '#2a2a2a';
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE / 2, py + 4);
                ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE / 2);
                ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE - 4);
                ctx.lineTo(px + 4, py + TILE_SIZE / 2);
                ctx.closePath();
                ctx.stroke();

                // Corner rivets
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(px + 4, py + 4, 2, 0, Math.PI * 2);
                ctx.arc(px + TILE_SIZE - 4, py + 4, 2, 0, Math.PI * 2);
                ctx.arc(px + 4, py + TILE_SIZE - 4, 2, 0, Math.PI * 2);
                ctx.arc(px + TILE_SIZE - 4, py + TILE_SIZE - 4, 2, 0, Math.PI * 2);
                ctx.fill();

                // Red corruption/infection creeping in from edges
                if (corruption > 0.2) {
                    const alpha = (corruption - 0.2) * 0.6;
                    ctx.fillStyle = `rgba(80, 20, 15, ${alpha})`;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Organic tendrils
                    if (corruption > 0.4 && Math.random() < 0.3) {
                        ctx.strokeStyle = `rgba(120, 30, 20, ${alpha})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(px + Math.random() * TILE_SIZE, py + Math.random() * TILE_SIZE);
                        ctx.quadraticCurveTo(
                            px + Math.random() * TILE_SIZE,
                            py + Math.random() * TILE_SIZE,
                            px + Math.random() * TILE_SIZE,
                            py + Math.random() * TILE_SIZE
                        );
                        ctx.stroke();
                    }
                }

                // Apply noise texture
                ctx.globalAlpha = 0.15;
                ctx.drawImage(noiseCanvas, px % 64, py % 64, 32, 32, px, py, TILE_SIZE, TILE_SIZE);
                ctx.globalAlpha = 1;
            }

            // Wall
            if (tile === 1) {
                // Dark industrial wall
                ctx.fillStyle = '#151515';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Wall panel
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

                // Inner detail
                ctx.fillStyle = '#242424';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                // Horizontal line detail
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(px + 4, py + TILE_SIZE / 2 - 1, TILE_SIZE - 8, 2);

                // Corner brackets
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                // Top-left
                ctx.beginPath();
                ctx.moveTo(px + 2, py + 8);
                ctx.lineTo(px + 2, py + 2);
                ctx.lineTo(px + 8, py + 2);
                ctx.stroke();
                // Top-right
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE - 8, py + 2);
                ctx.lineTo(px + TILE_SIZE - 2, py + 2);
                ctx.lineTo(px + TILE_SIZE - 2, py + 8);
                ctx.stroke();
                // Bottom-left
                ctx.beginPath();
                ctx.moveTo(px + 2, py + TILE_SIZE - 8);
                ctx.lineTo(px + 2, py + TILE_SIZE - 2);
                ctx.lineTo(px + 8, py + TILE_SIZE - 2);
                ctx.stroke();
                // Bottom-right
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE - 8, py + TILE_SIZE - 2);
                ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE - 2);
                ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE - 8);
                ctx.stroke();

                // Red corruption on walls near edges
                if (corruption > 0.3) {
                    const alpha = (corruption - 0.3) * 0.8;
                    ctx.fillStyle = `rgba(60, 15, 10, ${alpha})`;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
            }

            // Door
            if (tile === 2) {
                // Door frame
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Door panel
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                // Hazard stripes
                ctx.fillStyle = '#cc0';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(px + 6 + i * 6, py + 2, 3, TILE_SIZE - 4);
                }
                ctx.fillStyle = '#222';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(px + 9 + i * 6, py + 2, 3, TILE_SIZE - 4);
                }

                // Door indicator light
                ctx.fillStyle = sector.powered ? '#0f0' : '#f00';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE - 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function renderBloodPools() {
    for (let pool of bloodPools) {
        // Main blood pool
        ctx.fillStyle = pool.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.radius, pool.radius * 0.6, pool.angle || 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker center
        ctx.fillStyle = pool.color === '#600' ? '#400' : '#354';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.radius * 0.5, pool.radius * 0.3, pool.angle || 0, 0, Math.PI * 2);
        ctx.fill();

        // Blood splatters around main pool
        ctx.fillStyle = pool.color;
        ctx.globalAlpha = 0.5;
        const splatCount = 4 + Math.floor(pool.radius / 5);
        for (let i = 0; i < splatCount; i++) {
            const angle = (i / splatCount) * Math.PI * 2 + (pool.x % 1);
            const dist = pool.radius * (0.8 + Math.random() * 0.5);
            const splatX = pool.x + Math.cos(angle) * dist;
            const splatY = pool.y + Math.sin(angle) * dist * 0.6;
            const splatSize = 2 + Math.random() * 4;
            ctx.beginPath();
            ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

function renderAcidPuddles() {
    for (let puddle of acidPuddles) {
        ctx.fillStyle = `rgba(80, 200, 80, ${0.5 * (puddle.lifetime / 3)})`;
        ctx.beginPath();
        ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bubbling effect
        ctx.fillStyle = `rgba(120, 255, 120, ${0.3 * (puddle.lifetime / 3)})`;
        for (let i = 0; i < 3; i++) {
            const bx = puddle.x + (Math.random() - 0.5) * puddle.radius;
            const by = puddle.y + (Math.random() - 0.5) * puddle.radius;
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderObjects() {
    const sector = sectors[currentSector];

    // Containers
    for (let container of sector.containers) {
        if (container.opened) {
            ctx.fillStyle = '#333';
        } else {
            ctx.fillStyle = '#555';
        }
        ctx.fillRect(container.x, container.y, container.width, container.height);

        // Container lid
        ctx.fillStyle = container.opened ? '#2a2a2a' : '#666';
        ctx.fillRect(container.x + 2, container.y + 2, container.width - 4, 6);

        // Glow for unopened
        if (!container.opened) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(container.x, container.y, container.width, container.height);
        }
    }

    // Interactables
    for (let inter of sector.interactables) {
        switch (inter.type) {
            case 'workbench':
                ctx.fillStyle = '#654321';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                ctx.fillStyle = '#4a3520';
                ctx.fillRect(inter.x + 4, inter.y + 4, inter.width - 8, inter.height - 8);
                // Tools
                ctx.fillStyle = '#888';
                ctx.fillRect(inter.x + 10, inter.y + 8, 8, 4);
                ctx.fillRect(inter.x + 25, inter.y + 8, 12, 4);
                break;

            case 'bed':
                ctx.fillStyle = '#334';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                ctx.fillStyle = '#445';
                ctx.fillRect(inter.x + 4, inter.y + 4, inter.width - 8, inter.height / 3);
                break;

            case 'power_panel':
                ctx.fillStyle = '#333';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                ctx.fillStyle = sectors[currentSector].powered ? '#0f0' : '#f00';
                ctx.fillRect(inter.x + 8, inter.y + 8, 8, 8);
                ctx.fillStyle = '#0ff';
                ctx.fillRect(inter.x + 20, inter.y + 8, 4, 16);
                break;

            case 'medical_station':
                ctx.fillStyle = '#234';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                // Red cross
                ctx.fillStyle = sectors[currentSector].powered ? '#f00' : '#600';
                ctx.fillRect(inter.x + inter.width / 2 - 3, inter.y + 8, 6, 20);
                ctx.fillRect(inter.x + 8, inter.y + inter.height / 2 - 3, 20, 6);
                break;

            case 'research_terminal':
                ctx.fillStyle = '#234';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                // Screen
                ctx.fillStyle = sectors[currentSector].powered ? '#0a4' : '#030';
                ctx.fillRect(inter.x + 8, inter.y + 4, inter.width - 16, inter.height - 12);
                break;

            case 'escape_pod':
                // Pod body
                ctx.fillStyle = '#0aa';
                ctx.fillRect(inter.x, inter.y, inter.width, inter.height);
                ctx.fillStyle = '#088';
                ctx.fillRect(inter.x + 8, inter.y + 8, inter.width - 16, inter.height - 16);
                // Door
                ctx.fillStyle = sectors[currentSector].powered ? '#0ff' : '#066';
                ctx.fillRect(inter.x + inter.width / 2 - 8, inter.y + 4, 16, inter.height - 8);
                break;
        }

        // Interaction prompt
        const dx = player.x - (inter.x + inter.width / 2);
        const dy = player.y - (inter.y + inter.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 80) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('[E] ' + inter.type.replace('_', ' ').toUpperCase(), inter.x + inter.width / 2, inter.y - 10);
        }
    }
}

function renderGroundItems() {
    const sector = sectors[currentSector];

    for (let item of sector.items) {
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(ITEMS[item.id].name.substring(0, 1), item.x, item.y + 3);
    }
}

function renderEnemies() {
    const sector = sectors[currentSector];
    const time = Date.now() / 1000;

    for (let enemy of sector.enemies) {
        if (enemy.dead) continue;

        const pulse = Math.sin(time * 3 + enemy.x) * 0.1 + 1;
        const r = enemy.width / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(enemy.x + 3, enemy.y + r * 0.8, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Details based on type
        if (enemy.type === 'shambler') {
            // Shambler - grotesque humanoid mass of flesh
            // Main body mass
            ctx.fillStyle = '#6b3020';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, r * pulse, r * 1.1 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();

            // Exposed muscle/flesh
            ctx.fillStyle = '#8b4030';
            ctx.beginPath();
            ctx.ellipse(enemy.x - 4, enemy.y - 3, 8, 10, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Tumors/growths
            ctx.fillStyle = '#9b4535';
            ctx.beginPath();
            ctx.arc(enemy.x + 6, enemy.y - 5, 5 * pulse, 0, Math.PI * 2);
            ctx.arc(enemy.x - 7, enemy.y + 4, 4 * pulse, 0, Math.PI * 2);
            ctx.arc(enemy.x + 2, enemy.y + 7, 3 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Bone protrusions
            ctx.fillStyle = '#d0c0a0';
            ctx.beginPath();
            ctx.moveTo(enemy.x - 8, enemy.y - 8);
            ctx.lineTo(enemy.x - 12, enemy.y - 14);
            ctx.lineTo(enemy.x - 6, enemy.y - 10);
            ctx.fill();

            // Glowing eyes
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(enemy.x - 3, enemy.y - 6, 2, 0, Math.PI * 2);
            ctx.arc(enemy.x + 4, enemy.y - 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Eye glow
            ctx.fillStyle = 'rgba(255,100,0,0.3)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();

        } else if (enemy.type === 'crawler') {
            // Crawler - spider-like infected creature
            // Body segments
            ctx.fillStyle = '#4a3025';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, r * 1.3, r * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#5a3830';
            ctx.beginPath();
            ctx.ellipse(enemy.x - 8, enemy.y, 6, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Multiple legs
            ctx.strokeStyle = '#3a2520';
            ctx.lineWidth = 3;
            for (let i = -2; i <= 2; i++) {
                const legAngle = i * 0.4 + Math.sin(time * 8 + i) * 0.2;
                ctx.beginPath();
                ctx.moveTo(enemy.x + i * 4, enemy.y);
                ctx.quadraticCurveTo(
                    enemy.x + i * 8 + Math.cos(legAngle) * 5,
                    enemy.y + 5,
                    enemy.x + i * 10 + Math.cos(legAngle) * 8,
                    enemy.y + 12
                );
                ctx.stroke();
            }

            // Mandibles
            ctx.strokeStyle = '#d0a080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x + 10, enemy.y - 2);
            ctx.lineTo(enemy.x + 15, enemy.y + 3);
            ctx.moveTo(enemy.x + 10, enemy.y + 2);
            ctx.lineTo(enemy.x + 15, enemy.y - 1);
            ctx.stroke();

            // Eyes cluster
            ctx.fillStyle = '#ff2200';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(enemy.x + 8 + i * 2, enemy.y - 2 + (i % 2) * 2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (enemy.type === 'spitter') {
            // Spitter - bloated acid-filled creature
            // Bloated body
            ctx.fillStyle = '#3a5030';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y + 2, r * pulse, r * 1.2 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();

            // Acid sacs (glowing)
            const sacPulse = Math.sin(time * 5) * 0.2 + 1;
            ctx.fillStyle = '#80ff40';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(enemy.x - 6, enemy.y + 5, 6 * sacPulse, 0, Math.PI * 2);
            ctx.arc(enemy.x + 6, enemy.y + 5, 5 * sacPulse, 0, Math.PI * 2);
            ctx.arc(enemy.x, enemy.y + 8, 4 * sacPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Head/mouth
            ctx.fillStyle = '#4a6040';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y - 8, 7, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Open maw
            ctx.fillStyle = '#1a2010';
            ctx.beginPath();
            ctx.ellipse(enemy.x + 5, enemy.y - 6, 4, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Dripping acid
            ctx.fillStyle = '#60ff30';
            ctx.beginPath();
            ctx.moveTo(enemy.x + 5, enemy.y - 2);
            ctx.lineTo(enemy.x + 4, enemy.y + 4 + Math.sin(time * 10) * 2);
            ctx.lineTo(enemy.x + 6, enemy.y + 4 + Math.sin(time * 10) * 2);
            ctx.fill();

            // Glow effect
            ctx.fillStyle = 'rgba(100,255,50,0.2)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y + 5, 15, 0, Math.PI * 2);
            ctx.fill();

        } else if (enemy.type === 'brute') {
            // Brute - massive armored infected
            // Massive body
            ctx.fillStyle = '#4a1515';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, r * pulse, r * 0.9 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bone armor plates
            ctx.fillStyle = '#8a7060';
            ctx.fillRect(enemy.x - 15, enemy.y - 18, 30, 12);
            ctx.fillRect(enemy.x - 12, enemy.y + 6, 24, 10);

            // Exposed flesh between plates
            ctx.fillStyle = '#6a2020';
            ctx.fillRect(enemy.x - 10, enemy.y - 6, 20, 12);

            // Spikes
            ctx.fillStyle = '#b0a090';
            ctx.beginPath();
            ctx.moveTo(enemy.x - 10, enemy.y - 18);
            ctx.lineTo(enemy.x - 8, enemy.y - 28);
            ctx.lineTo(enemy.x - 6, enemy.y - 18);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(enemy.x + 6, enemy.y - 18);
            ctx.lineTo(enemy.x + 8, enemy.y - 26);
            ctx.lineTo(enemy.x + 10, enemy.y - 18);
            ctx.fill();

            // Glowing cracks
            ctx.strokeStyle = '#ff3300';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x - 5, enemy.y - 2);
            ctx.lineTo(enemy.x + 5, enemy.y + 3);
            ctx.moveTo(enemy.x + 2, enemy.y - 4);
            ctx.lineTo(enemy.x - 3, enemy.y + 2);
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(enemy.x - 5, enemy.y - 12, 3, 0, Math.PI * 2);
            ctx.arc(enemy.x + 5, enemy.y - 12, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (enemy.type === 'cocoon') {
            // Cocoon - organic spawning structure
            const cocooPulse = Math.sin(time * 2) * 0.1 + 1;

            // Base organic mass
            ctx.fillStyle = '#4a2515';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y + 5, r * 0.8, r * 1.4 * cocooPulse, 0, 0, Math.PI * 2);
            ctx.fill();

            // Membrane layers
            ctx.fillStyle = '#5a3020';
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, r * 0.7 * cocooPulse, r * 1.2 * cocooPulse, 0, 0, Math.PI * 2);
            ctx.fill();

            // Veins
            ctx.strokeStyle = '#803525';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(enemy.x, enemy.y);
                ctx.quadraticCurveTo(
                    enemy.x + Math.cos(angle) * 10,
                    enemy.y + Math.sin(angle) * 15,
                    enemy.x + Math.cos(angle + 0.3) * 18,
                    enemy.y + Math.sin(angle + 0.3) * 22
                );
                ctx.stroke();
            }

            // Inner glow
            ctx.fillStyle = 'rgba(255,100,50,0.3)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 12 * cocooPulse, 0, Math.PI * 2);
            ctx.fill();

            // Emerging form hint
            if (cocooPulse > 1.05) {
                ctx.fillStyle = '#301510';
                ctx.beginPath();
                ctx.ellipse(enemy.x, enemy.y - 5, 5, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Health bar with better styling
        const hpPercent = enemy.hp / enemy.maxHp;
        const barWidth = Math.max(30, enemy.width);
        ctx.fillStyle = '#200';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.height / 2 - 12, barWidth, 5);
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x - barWidth / 2 + 1, enemy.y - enemy.height / 2 - 11, barWidth - 2, 3);

        const hpColor = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(enemy.x - barWidth / 2 + 1, enemy.y - enemy.height / 2 - 11, (barWidth - 2) * hpPercent, 3);

        // Alert indicator
        if (enemy.state === 'alert') {
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('!', enemy.x, enemy.y - enemy.height / 2 - 18);

            // Alert glow
            ctx.fillStyle = 'rgba(255,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y - enemy.height / 2 - 15, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderProjectiles() {
    for (let p of projectiles) {
        const angle = Math.atan2(p.vy, p.vx);

        if (p.acid) {
            // Acid projectile - glowing green blob
            ctx.save();
            ctx.translate(p.x, p.y);

            // Glow
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
            glowGradient.addColorStop(0, 'rgba(100, 255, 100, 0.6)');
            glowGradient.addColorStop(1, 'rgba(100, 255, 100, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#80ff40';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = '#c0ff80';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Trail
            ctx.strokeStyle = 'rgba(80, 255, 80, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08);
            ctx.stroke();

        } else {
            // Bullet - bright tracer line like in reference
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);

            // Tracer line (white/yellow like laser)
            const tracerGradient = ctx.createLinearGradient(-40, 0, 10, 0);
            tracerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            tracerGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.8)');
            tracerGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

            ctx.strokeStyle = tracerGradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-40, 0);
            ctx.lineTo(5, 0);
            ctx.stroke();

            // Bright tip
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(5, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Core glow
            ctx.fillStyle = '#ff8';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Impact glow
            ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderPlayer() {
    const time = Date.now() / 1000;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(player.x + 3, player.y + player.height / 2, player.width / 2 * 0.9, player.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);

    // Hazmat suit body
    const suitColor = player.invincible > 0 ? '#6688ff' : '#3a4555';
    const highlightColor = player.invincible > 0 ? '#99aaff' : '#4a5565';

    // Body suit
    ctx.fillStyle = suitColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width / 2 - 2, player.height / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Suit highlights
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.ellipse(-3, -3, player.width / 4, player.height / 4, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Backpack/life support
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(-8, -2, 6, 10);
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(-7, 0, 4, 6);

    // Tank details
    ctx.fillStyle = '#4a5a70';
    ctx.fillRect(-7, 1, 2, 4);
    ctx.fillRect(-5, 1, 2, 4);

    // Visor/helmet
    ctx.fillStyle = '#1a2535';
    ctx.beginPath();
    ctx.ellipse(6, 0, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Visor glass
    const visorGlow = player.invincible > 0 ? 'rgba(100,200,255,0.9)' : 'rgba(0,255,255,0.7)';
    ctx.fillStyle = visorGlow;
    ctx.beginPath();
    ctx.ellipse(8, 0, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Visor reflection
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(6, -3, 2, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Weapon
    if (player.currentWeapon) {
        const weapon = ITEMS[player.currentWeapon];
        if (weapon.melee) {
            // Melee weapon (shiv, club)
            ctx.fillStyle = '#888';
            ctx.fillRect(12, -2, 14, 4);
            ctx.fillStyle = '#666';
            ctx.fillRect(12, -1, 4, 2);
        } else {
            // Ranged weapon (pistol)
            ctx.fillStyle = '#444';
            ctx.fillRect(10, -4, 20, 8);
            ctx.fillStyle = '#333';
            ctx.fillRect(12, -2, 14, 4);
            // Barrel
            ctx.fillStyle = '#555';
            ctx.fillRect(26, -2, 6, 4);
            // Grip
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(14, 2, 6, 6);
        }
    } else {
        // Fist/glove
        ctx.fillStyle = '#4a5565';
        ctx.beginPath();
        ctx.arc(14, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Flashlight cone
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);

    // Main flashlight beam
    const gradient = ctx.createRadialGradient(30, 0, 0, 150, 0, 250);
    gradient.addColorStop(0, 'rgba(255, 255, 220, 0.25)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.arc(0, 0, 250, -0.35, 0.35);
    ctx.closePath();
    ctx.fill();

    // Bright center
    const centerGradient = ctx.createRadialGradient(50, 0, 0, 50, 0, 100);
    centerGradient.addColorStop(0, 'rgba(255, 255, 230, 0.2)');
    centerGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.arc(0, 0, 100, -0.2, 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Infection visual on player
    if (player.infection > 25) {
        const infectionAlpha = (player.infection - 25) / 75 * 0.5;
        ctx.strokeStyle = `rgba(0, 255, 0, ${infectionAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width / 2 + 3 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function renderDarkness() {
    const sector = sectors[currentSector];
    const isPowered = sector.powered;

    // Draw darkness overlay using radial gradient from player
    const mapWidth = sector.width * TILE_SIZE;
    const mapHeight = sector.height * TILE_SIZE;

    // Base darkness level
    const baseDarkness = isPowered ? 0.2 : 0.6;
    const visibilityRadius = isPowered ? 350 : 200;

    // Create darkness with player-centered light
    ctx.save();

    // Draw full darkness
    ctx.fillStyle = `rgba(0, 0, 0, ${baseDarkness})`;
    ctx.fillRect(camera.x, camera.y, WIDTH, HEIGHT);

    // Cut out light around player using composite operation
    ctx.globalCompositeOperation = 'destination-out';

    // Player light cone (flashlight direction)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);

    // Directional flashlight
    const flashlightGradient = ctx.createRadialGradient(0, 0, 0, visibilityRadius * 0.7, 0, visibilityRadius);
    flashlightGradient.addColorStop(0, 'rgba(0,0,0,0.8)');
    flashlightGradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
    flashlightGradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = flashlightGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, visibilityRadius, -0.6, 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Ambient light around player (smaller, all directions)
    const ambientGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, visibilityRadius * 0.4);
    ambientGradient.addColorStop(0, 'rgba(0,0,0,0.6)');
    ambientGradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = ambientGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visibilityRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Add red corruption vignette on edges when infection is high
    if (globalInfection > 30 || player.infection > 30) {
        const infectionLevel = Math.max(globalInfection, player.infection);
        const vignetteAlpha = (infectionLevel - 30) / 70 * 0.4;

        // Red vignette from edges
        const vignetteGradient = ctx.createRadialGradient(
            camera.x + WIDTH / 2, camera.y + HEIGHT / 2, WIDTH * 0.3,
            camera.x + WIDTH / 2, camera.y + HEIGHT / 2, WIDTH * 0.7
        );
        vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGradient.addColorStop(1, `rgba(80, 20, 10, ${vignetteAlpha})`);

        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(camera.x, camera.y, WIDTH, HEIGHT);
    }

    // Occasional flicker effect in unpowered sectors
    if (!isPowered && Math.random() < 0.02) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(camera.x, camera.y, WIDTH, HEIGHT);
    }
}

function renderFloatingTexts() {
    for (let ft of floatingTexts) {
        ctx.globalAlpha = ft.lifetime;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    }
}

function renderHUD() {
    const padding = 10;
    const barWidth = 150;
    const barHeight = 16;

    // Health bar
    ctx.fillStyle = '#300';
    ctx.fillRect(padding, padding, barWidth, barHeight);
    ctx.fillStyle = '#f00';
    ctx.fillRect(padding, padding, barWidth * (player.health / player.maxHealth), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, padding + 5, padding + 12);

    // Hunger bar
    ctx.fillStyle = '#330';
    ctx.fillRect(padding, padding + 22, barWidth * 0.6, barHeight * 0.7);
    ctx.fillStyle = '#f80';
    ctx.fillRect(padding, padding + 22, barWidth * 0.6 * (player.hunger / 100), barHeight * 0.7);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.fillText(`Hunger: ${Math.floor(player.hunger)}%`, padding + 5, padding + 32);

    // Infection bar
    ctx.fillStyle = '#030';
    ctx.fillRect(padding, padding + 42, barWidth, barHeight);
    ctx.fillStyle = player.infection > 50 ? '#0f0' : '#0a0';
    ctx.fillRect(padding, padding + 42, barWidth * (player.infection / 100), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`Infection: ${Math.floor(player.infection)}%`, padding + 5, padding + 54);

    // Stamina bar
    ctx.fillStyle = '#333';
    ctx.fillRect(padding, padding + 64, barWidth * 0.6, barHeight * 0.5);
    ctx.fillStyle = '#08f';
    ctx.fillRect(padding, padding + 64, barWidth * 0.6 * (player.stamina / player.maxStamina), barHeight * 0.5);

    // Global infection (top right)
    ctx.textAlign = 'right';
    ctx.fillStyle = globalInfection > 50 ? '#f00' : globalInfection > 25 ? '#f80' : '#fff';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText(`GLOBAL: ${globalInfection.toFixed(1)}%`, WIDTH - padding, padding + 20);

    // Time
    ctx.fillStyle = '#888';
    ctx.font = '14px Courier New';
    const hours = Math.floor(gameTime / 60) % 24;
    const mins = Math.floor(gameTime % 60);
    ctx.fillText(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`, WIDTH - padding, padding + 40);

    // Current sector
    ctx.fillText(sectors[currentSector].name, WIDTH - padding, padding + 60);

    // Power status
    ctx.fillStyle = sectors[currentSector].powered ? '#0f0' : '#f00';
    ctx.fillText(sectors[currentSector].powered ? 'POWERED' : 'NO POWER', WIDTH - padding, padding + 80);

    // Quick slots (bottom)
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
        const x = WIDTH / 2 - 80 + i * 60;
        const y = HEIGHT - 60;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, 50, 50);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(x, y, 50, 50);

        // Key hint
        ctx.fillStyle = '#888';
        ctx.font = '10px Courier New';
        ctx.fillText(`[${i + 1}]`, x + 25, y - 5);

        // Item in slot
        const slotIndex = inventory.quickSlots[i];
        if (slotIndex !== null && inventory.slots[slotIndex]) {
            const slot = inventory.slots[slotIndex];
            ctx.fillStyle = '#fff';
            ctx.font = '10px Courier New';
            ctx.fillText(ITEMS[slot.id].name.substring(0, 6), x + 25, y + 30);
            ctx.fillText(`x${slot.quantity}`, x + 25, y + 42);
        }
    }

    // Ammo display (if holding ranged weapon)
    if (player.currentWeapon === 'pistol') {
        ctx.fillStyle = '#ff0';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`Ammo: ${player.ammo.pistol}/12`, WIDTH - padding, HEIGHT - padding);
    }

    // Keycard indicator
    if (player.hasKeycard) {
        ctx.fillStyle = '#f00';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('[RED KEYCARD]', padding, HEIGHT - padding);
    }

    // Infection visual effect
    if (player.infection > 25) {
        const intensity = (player.infection - 25) / 75;
        ctx.strokeStyle = `rgba(0, 255, 0, ${intensity * 0.3})`;
        ctx.lineWidth = 10 + intensity * 20;
        ctx.strokeRect(0, 0, WIDTH, HEIGHT);
    }
}

function renderInventory() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Inventory window
    const invX = WIDTH / 2 - 250;
    const invY = 100;
    const invW = 500;
    const invH = 500;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(invX, invY, invW, invH);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(invX, invY, invW, invH);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', WIDTH / 2, invY + 30);

    // Close hint
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('[TAB] or [ESC] to close', WIDTH / 2, invY + 50);

    // Grid
    const slotSize = 50;
    const cols = 5;
    const startX = invX + 50;
    const startY = invY + 80;

    for (let i = 0; i < inventory.maxSlots; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (slotSize + 10);
        const y = startY + row * (slotSize + 10);

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, slotSize, slotSize);

        if (inventory.slots[i]) {
            const slot = inventory.slots[i];
            const item = ITEMS[slot.id];

            // Item color based on type
            ctx.fillStyle = item.type === 'weapon' ? '#f80' :
                           item.type === 'consumable' ? '#0f0' :
                           item.type === 'key' ? '#f00' : '#0ff';
            ctx.fillRect(x + 5, y + 5, slotSize - 10, slotSize - 10);

            // Item name
            ctx.fillStyle = '#000';
            ctx.font = '8px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.substring(0, 7), x + slotSize / 2, y + slotSize / 2);

            // Quantity
            if (slot.quantity > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'right';
                ctx.fillText(`${slot.quantity}`, x + slotSize - 5, y + slotSize - 5);
            }
        }

        // Slot number for quick assignment
        ctx.fillStyle = '#666';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}`, x + 2, y + 10);
    }

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Click to use item | Drag to quick slots', WIDTH / 2, invY + invH - 20);
}

function renderCrafting() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Crafting window
    const craftX = WIDTH / 2 - 300;
    const craftY = 100;
    const craftW = 600;
    const craftH = 500;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(craftX, craftY, craftW, craftH);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.strokeRect(craftX, craftY, craftW, craftH);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('WORKBENCH', WIDTH / 2, craftY + 30);

    // Close hint
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('[ESC] to close', WIDTH / 2, craftY + 50);

    // Recipes
    let y = craftY + 80;
    ctx.textAlign = 'left';

    // Tier 1
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('TIER 1 RECIPES:', craftX + 20, y);
    y += 25;

    for (let recipe of RECIPES.tier1) {
        const canMake = canCraft(recipe);
        ctx.fillStyle = canMake ? '#0f0' : '#666';
        ctx.font = '12px Courier New';
        ctx.fillText(`${recipe.name}`, craftX + 30, y);

        // Materials
        let matStr = '';
        for (let mat in recipe.materials) {
            const has = countItem(mat);
            const need = recipe.materials[mat];
            matStr += `${ITEMS[mat].name}: ${has}/${need}  `;
        }
        ctx.fillStyle = '#888';
        ctx.fillText(matStr, craftX + 200, y);

        y += 25;
    }

    // Tier 2
    y += 20;
    ctx.fillStyle = player.tier2Unlocked ? '#ff0' : '#444';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('TIER 2 RECIPES:' + (player.tier2Unlocked ? '' : ' [LOCKED - Need Data Chip]'), craftX + 20, y);
    y += 25;

    if (player.tier2Unlocked) {
        for (let recipe of RECIPES.tier2) {
            const canMake = canCraft(recipe);
            ctx.fillStyle = canMake ? '#0f0' : '#666';
            ctx.font = '12px Courier New';
            ctx.fillText(`${recipe.name}`, craftX + 30, y);

            let matStr = '';
            for (let mat in recipe.materials) {
                const has = countItem(mat);
                const need = recipe.materials[mat];
                matStr += `${ITEMS[mat].name}: ${has}/${need}  `;
            }
            ctx.fillStyle = '#888';
            ctx.fillText(matStr, craftX + 200, y);

            y += 25;
        }
    }

    // Materials inventory
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('YOUR MATERIALS:', craftX + 20, craftY + craftH - 100);

    ctx.font = '12px Courier New';
    ctx.fillStyle = '#0ff';
    const mats = ['scrap_metal', 'cloth', 'chemicals', 'electronics', 'power_cell'];
    let matY = craftY + craftH - 75;
    for (let mat of mats) {
        ctx.fillText(`${ITEMS[mat].name}: ${countItem(mat)}`, craftX + 20 + mats.indexOf(mat) * 110, matY);
    }
}

function renderMap() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Map title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FACILITY MAP', WIDTH / 2, 60);

    // Close hint
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('[M] or [ESC] to close', WIDTH / 2, 85);

    // Map layout
    const mapCenterX = WIDTH / 2;
    const mapCenterY = HEIGHT / 2;
    const nodeSize = 80;
    const spacing = 150;

    const positions = {
        hub: { x: 0, y: 0 },
        escape: { x: 0, y: -spacing },
        storage: { x: 0, y: spacing },
        medical: { x: spacing, y: 0 },
        research: { x: -spacing, y: 0 }
    };

    // Draw connections
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;

    for (let id in sectors) {
        const sector = sectors[id];
        const pos = positions[id];

        for (let dir in sector.connections) {
            const targetId = sector.connections[dir];
            const targetPos = positions[targetId];

            ctx.beginPath();
            ctx.moveTo(mapCenterX + pos.x, mapCenterY + pos.y);
            ctx.lineTo(mapCenterX + targetPos.x, mapCenterY + targetPos.y);
            ctx.stroke();
        }
    }

    // Draw nodes
    for (let id in sectors) {
        const sector = sectors[id];
        const pos = positions[id];
        const x = mapCenterX + pos.x;
        const y = mapCenterY + pos.y;

        // Node background
        ctx.fillStyle = id === currentSector ? '#446' :
                       sector.powered ? '#242' : '#222';
        ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);

        // Border
        ctx.strokeStyle = id === currentSector ? '#88f' :
                         sector.powered ? '#0f0' : '#666';
        ctx.lineWidth = id === currentSector ? 3 : 2;
        ctx.strokeRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(sector.name, x, y);

        // Power cost
        ctx.fillStyle = '#888';
        ctx.font = '10px Courier New';
        ctx.fillText(`${sector.powerCost}W`, x, y + 15);

        // Status
        if (sector.visited) {
            ctx.fillStyle = '#0f0';
            ctx.fillText('VISITED', x, y + 28);
        }

        // You are here
        if (id === currentSector) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 10px Courier New';
            ctx.fillText('[YOU]', x, y - 15);
        }
    }

    // Power summary
    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`Power: ${powerUsed}/${powerCapacity}W`, WIDTH / 2, HEIGHT - 50);
}

// ============================================
// DEBUG OVERLAY
// ============================================
function updateDebug() {
    const sector = sectors[currentSector];
    const debug = document.getElementById('debug');
    debug.innerHTML = `
        <b>DEBUG (Q to toggle)</b><br>
        Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})<br>
        Health: ${Math.floor(player.health)}<br>
        Hunger: ${Math.floor(player.hunger)}%<br>
        Infection: ${Math.floor(player.infection)}%<br>
        Stamina: ${Math.floor(player.stamina)}<br>
        <br>
        Sector: ${sector.name}<br>
        Powered: ${sector.powered}<br>
        Enemies: ${sector.enemies.filter(e => !e.dead).length}<br>
        Containers: ${sector.containers.filter(c => !c.opened).length}<br>
        <br>
        Global Infection: ${globalInfection.toFixed(1)}%<br>
        Game Time: ${Math.floor(gameTime / 60)}h ${Math.floor(gameTime % 60)}m<br>
        Power: ${powerUsed}/${powerCapacity}W<br>
        <br>
        Weapon: ${player.currentWeapon || 'Fists'}<br>
        Has Keycard: ${player.hasKeycard}<br>
        Tier 2: ${player.tier2Unlocked}<br>
        FPS: ${Math.floor(1 / deltaTime)}
    `;
}

// ============================================
// GAME LOOP
// ============================================
function gameLoop(timestamp) {
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap delta time to prevent huge jumps
    if (deltaTime > 0.1) deltaTime = 0.1;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

// ============================================
// GAME START
// ============================================
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');

    // Initialize player
    player.x = 7 * TILE_SIZE;
    player.y = 7 * TILE_SIZE;
    player.health = 100;
    player.hunger = 0;
    player.infection = 0;
    player.stamina = 100;
    player.hasKeycard = false;
    player.hasDataChip = false;
    player.tier2Unlocked = false;
    player.currentWeapon = null;
    player.ammo = { pistol: 0 };

    // Starting inventory
    inventory.slots = [];
    addToInventory('canned_food', 2);
    addToInventory('medkit', 1);
    addToInventory('shiv', 1);

    // Assign shiv to quick slot
    inventory.quickSlots[0] = 2;
    player.currentWeapon = 'shiv';

    // Initialize game state
    gameTime = 0;
    globalInfection = 0;
    realTime = 0;
    powerUsed = 0;

    // Reset all sectors
    for (let id in sectors) {
        sectors[id].visited = false;
        sectors[id].powered = id === 'hub';
        sectors[id].enemies = [];
        sectors[id].items = [];
        sectors[id].containers = [];
        sectors[id].interactables = [];
    }

    // Clear effects
    projectiles = [];
    acidPuddles = [];
    bloodPools = [];
    floatingTexts = [];

    // Generate starting sector
    currentSector = 'hub';
    generateSector('hub');

    calculatePower();

    gameState = GameState.PLAYING;
}

// Start the game loop
requestAnimationFrame(gameLoop);
