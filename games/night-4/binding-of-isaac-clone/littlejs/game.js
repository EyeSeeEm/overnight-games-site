// Binding of Isaac Clone - LittleJS
// A roguelike dungeon crawler with twin-stick shooter mechanics

'use strict';

// ===========================================
// CONFIGURATION
// ===========================================

const TILE_SIZE = 16;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 9;
const ROOM_PIXEL_WIDTH = ROOM_WIDTH * TILE_SIZE;
const ROOM_PIXEL_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Game states
const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
const STATE_PAUSED = 3;

// Room types
const ROOM_START = 'start';
const ROOM_NORMAL = 'normal';
const ROOM_TREASURE = 'treasure';
const ROOM_SHOP = 'shop';
const ROOM_BOSS = 'boss';
const ROOM_SECRET = 'secret';

// Enemy types
const ENEMY_FLY = 'fly';
const ENEMY_ATTACK_FLY = 'attackFly';
const ENEMY_GAPER = 'gaper';
const ENEMY_CHARGER = 'charger';
const ENEMY_POOTER = 'pooter';
const ENEMY_SPIDER = 'spider';
const ENEMY_CLOTTY = 'clotty';
const ENEMY_HOPPER = 'hopper';
const ENEMY_TRITE = 'trite';
const ENEMY_HORF = 'horf';
const ENEMY_GLOBIN = 'globin';

// Champion colors
const CHAMPION_NONE = 'none';
const CHAMPION_RED = 'red';       // 2x HP
const CHAMPION_YELLOW = 'yellow'; // Faster
const CHAMPION_BLUE = 'blue';     // Extra shots
const CHAMPION_GREEN = 'green';   // Spawns fly on death
const CHAMPION_BLACK = 'black';   // 2x damage

// ===========================================
// GAME STATE
// ===========================================

let gameState = STATE_MENU;
let player = null;
let currentRoom = null;
let currentFloor = null;
let tears = [];
let enemies = [];
let pickups = [];
let obstacles = [];
let doors = [];
let particles = [];
let floatingTexts = [];

// Player data
let playerStats = {
    redHearts: 3,
    maxRedHearts: 3,
    soulHearts: 0,
    blackHearts: 0,
    damage: 3.5,
    tearDelay: 10, // Lower = faster fire rate
    range: 23.75,
    shotSpeed: 1.0,
    speed: 1.0,
    luck: 0,
    keys: 1,
    bombs: 1,
    coins: 0,
    items: [],
    // Tear modifiers
    homing: false,
    piercing: false,
    bouncing: false,
    // Temp effects
    tempDamageBonus: 0,
    tempDamageTimer: 0
};

// Floor/Room state
let floorNumber = 1;
let roomGrid = []; // 9x8 grid of rooms
let currentRoomCoord = { x: 4, y: 4 };
let roomStates = new Map(); // Persistence for rooms

// Timing
let playerInvincibleTimer = 0;
let roomEntryTimer = 0;
let enemyWakeTimer = 0;
let lastTearTime = 0;

// Effects
let screenShake = 0;
let screenShakeX = 0;
let screenShakeY = 0;

// Trapdoor
let trapdoor = null;
let bossDefeated = false;

// Active item
let activeItem = null;
let activeItemCharges = 0;
let maxActiveItemCharges = 0;

// ===========================================
// LITTLEJS ENGINE SETUP
// ===========================================

// Note: canvasFixedSize and cameraScale are set in gameInit

// ===========================================
// INITIALIZATION
// ===========================================

function gameInit() {
    // Set up canvas
    canvasFixedSize.x = GAME_WIDTH;
    canvasFixedSize.y = GAME_HEIGHT;

    // Initialize menu state
    gameState = STATE_MENU;

    // Set camera
    cameraPos = vec2(ROOM_PIXEL_WIDTH / 2 / TILE_SIZE, ROOM_PIXEL_HEIGHT / 2 / TILE_SIZE);
    cameraScale = 4;
}

function startNewGame() {
    // Reset player stats
    playerStats = {
        redHearts: 3,
        maxRedHearts: 3,
        soulHearts: 0,
        damage: 3.5,
        tearDelay: 10,
        range: 23.75,
        shotSpeed: 1.0,
        speed: 1.0,
        luck: 0,
        keys: 1,
        bombs: 1,
        coins: 0,
        items: []
    };

    floorNumber = 1;
    roomStates.clear();

    // Generate floor
    generateFloor();

    // Start in the start room
    currentRoomCoord = findStartRoom();
    loadRoom(currentRoomCoord.x, currentRoomCoord.y, null);

    // Create player
    player = {
        x: ROOM_PIXEL_WIDTH / 2,
        y: ROOM_PIXEL_HEIGHT / 2,
        width: 14,
        height: 14,
        vx: 0,
        vy: 0,
        lastDir: { x: 0, y: 1 },
        invincible: false,
        flash: false
    };

    gameState = STATE_PLAYING;
}

// ===========================================
// FLOOR GENERATION
// ===========================================

function generateFloor() {
    // Create 9x8 grid
    roomGrid = [];
    for (let y = 0; y < 8; y++) {
        roomGrid[y] = [];
        for (let x = 0; x < 9; x++) {
            roomGrid[y][x] = null;
        }
    }

    // Calculate room count based on floor
    const roomCount = Math.floor(Math.random() * 2) + 5 + Math.floor(floorNumber * 2.6);

    // Start room at center
    const startX = 4, startY = 4;
    roomGrid[startY][startX] = { type: ROOM_START, enemies: [], discovered: true };

    const rooms = [{ x: startX, y: startY }];
    const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

    // Generate rooms via random walk
    let attempts = 0;
    while (rooms.length < roomCount && attempts < 1000) {
        attempts++;
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = room.x + dir.x;
        const newY = room.y + dir.y;

        if (newX >= 0 && newX < 9 && newY >= 0 && newY < 8 && !roomGrid[newY][newX]) {
            roomGrid[newY][newX] = { type: ROOM_NORMAL, enemies: [], discovered: false };
            rooms.push({ x: newX, y: newY });
        }
    }

    // Place special rooms
    placeBossRoom(rooms);
    placeTreasureRoom(rooms);
    placeShopRoom(rooms);
}

function placeBossRoom(rooms) {
    // Find farthest room from start
    let maxDist = 0;
    let bossRoom = null;
    const startX = 4, startY = 4;

    for (const room of rooms) {
        if (roomGrid[room.y][room.x].type !== ROOM_START) {
            const dist = Math.abs(room.x - startX) + Math.abs(room.y - startY);
            if (dist > maxDist) {
                maxDist = dist;
                bossRoom = room;
            }
        }
    }

    if (bossRoom) {
        roomGrid[bossRoom.y][bossRoom.x].type = ROOM_BOSS;
    }
}

function placeTreasureRoom(rooms) {
    // Find dead-end room
    for (const room of rooms) {
        if (roomGrid[room.y][room.x].type === ROOM_NORMAL) {
            const neighbors = countNeighbors(room.x, room.y);
            if (neighbors === 1) {
                roomGrid[room.y][room.x].type = ROOM_TREASURE;
                return;
            }
        }
    }

    // If no dead end, pick random normal room
    for (const room of rooms) {
        if (roomGrid[room.y][room.x].type === ROOM_NORMAL) {
            roomGrid[room.y][room.x].type = ROOM_TREASURE;
            return;
        }
    }
}

function placeShopRoom(rooms) {
    for (const room of rooms) {
        if (roomGrid[room.y][room.x].type === ROOM_NORMAL) {
            roomGrid[room.y][room.x].type = ROOM_SHOP;
            return;
        }
    }
}

function countNeighbors(x, y) {
    let count = 0;
    if (x > 0 && roomGrid[y][x - 1]) count++;
    if (x < 8 && roomGrid[y][x + 1]) count++;
    if (y > 0 && roomGrid[y - 1][x]) count++;
    if (y < 7 && roomGrid[y + 1][x]) count++;
    return count;
}

function findStartRoom() {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
            if (roomGrid[y][x] && roomGrid[y][x].type === ROOM_START) {
                return { x, y };
            }
        }
    }
    return { x: 4, y: 4 };
}

// ===========================================
// ROOM LOADING
// ===========================================

function loadRoom(gridX, gridY, entryDirection) {
    const roomData = roomGrid[gridY][gridX];
    if (!roomData) return;

    // Mark room as discovered
    roomData.discovered = true;

    // Also reveal adjacent rooms as '?' on minimap
    const directions = [
        { x: 0, y: -1, name: 'north' },
        { x: 0, y: 1, name: 'south' },
        { x: -1, y: 0, name: 'west' },
        { x: 1, y: 0, name: 'east' }
    ];

    for (const dir of directions) {
        const nx = gridX + dir.x;
        const ny = gridY + dir.y;
        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 8 && roomGrid[ny][nx]) {
            // Adjacent rooms get marked as 'seen' but not discovered
            if (!roomGrid[ny][nx].adjacentSeen) {
                roomGrid[ny][nx].adjacentSeen = true;
            }
        }
    }

    // Create room key for persistence
    const roomKey = `${floorNumber}_${gridX}_${gridY}`;

    // Clear current entities
    tears = [];
    enemies = [];
    pickups = [];
    obstacles = [];
    doors = [];

    // Load persisted state or generate new
    if (roomStates.has(roomKey)) {
        const state = roomStates.get(roomKey);
        enemies = state.enemies.map(e => ({ ...e }));
        pickups = state.pickups.map(p => ({ ...p }));
        obstacles = state.obstacles.map(o => ({ ...o }));
    } else {
        // Generate new room content
        generateRoomContent(roomData.type);

        // Save initial state
        roomStates.set(roomKey, {
            enemies: enemies.map(e => ({ ...e })),
            pickups: pickups.map(p => ({ ...p })),
            obstacles: obstacles.map(o => ({ ...o })),
            cleared: enemies.length === 0
        });
    }

    // Generate doors
    generateDoors(gridX, gridY);

    // Position player based on entry direction
    if (entryDirection && player) {
        const EDGE_OFFSET = 24;
        switch (entryDirection) {
            case 'north':
                player.x = ROOM_PIXEL_WIDTH / 2;
                player.y = EDGE_OFFSET;
                break;
            case 'south':
                player.x = ROOM_PIXEL_WIDTH / 2;
                player.y = ROOM_PIXEL_HEIGHT - EDGE_OFFSET;
                break;
            case 'west':
                player.x = EDGE_OFFSET;
                player.y = ROOM_PIXEL_HEIGHT / 2;
                break;
            case 'east':
                player.x = ROOM_PIXEL_WIDTH - EDGE_OFFSET;
                player.y = ROOM_PIXEL_HEIGHT / 2;
                break;
        }

        // Stop player movement briefly
        player.vx = 0;
        player.vy = 0;
        roomEntryTimer = 0.3;
    }

    // Set enemy wake timer
    enemyWakeTimer = 0.5;
    enemies.forEach(e => {
        e.stunned = true;
        e.canMove = false;
        e.canAttack = false;
    });

    currentRoom = roomData;
}

function generateRoomContent(roomType) {
    // Generate obstacles (rocks, poops)
    const obstacleCount = roomType === ROOM_BOSS ? 2 : Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < obstacleCount; i++) {
        const type = Math.random() < 0.3 ? 'poop' : 'rock';
        const x = 32 + Math.random() * (ROOM_PIXEL_WIDTH - 64);
        const y = 32 + Math.random() * (ROOM_PIXEL_HEIGHT - 64);

        obstacles.push({
            x, y,
            width: 14,
            height: 14,
            type,
            hp: type === 'poop' ? 3 : -1, // Poops destroyable, rocks not
            maxHp: 3,
            destroyed: false
        });
    }

    // Generate enemies based on room type
    if (roomType === ROOM_NORMAL) {
        const enemyCount = 2 + Math.floor(Math.random() * 3) + Math.floor(floorNumber * 0.5);
        const enemyTypes = [ENEMY_FLY, ENEMY_GAPER, ENEMY_SPIDER, ENEMY_POOTER, ENEMY_HOPPER];

        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            spawnEnemy(type);
        }
    } else if (roomType === ROOM_BOSS) {
        spawnBoss();
    } else if (roomType === ROOM_TREASURE) {
        // Add item pedestal
        pickups.push({
            x: ROOM_PIXEL_WIDTH / 2,
            y: ROOM_PIXEL_HEIGHT / 2,
            type: 'item',
            item: getRandomItem(),
            collected: false
        });
    } else if (roomType === ROOM_SHOP) {
        // Add shop items
        const shopItems = ['heart', 'key', 'bomb'];
        for (let i = 0; i < 3; i++) {
            pickups.push({
                x: ROOM_PIXEL_WIDTH / 4 + (i * ROOM_PIXEL_WIDTH / 4),
                y: ROOM_PIXEL_HEIGHT / 2,
                type: 'shop',
                item: shopItems[i],
                price: 5 + Math.floor(Math.random() * 10),
                collected: false
            });
        }
    }
}

function generateDoors(gridX, gridY) {
    doors = [];

    // Check adjacent rooms for door placement
    const directions = [
        { x: 0, y: -1, name: 'north', doorX: ROOM_PIXEL_WIDTH / 2, doorY: 4 },
        { x: 0, y: 1, name: 'south', doorX: ROOM_PIXEL_WIDTH / 2, doorY: ROOM_PIXEL_HEIGHT - 4 },
        { x: -1, y: 0, name: 'west', doorX: 4, doorY: ROOM_PIXEL_HEIGHT / 2 },
        { x: 1, y: 0, name: 'east', doorX: ROOM_PIXEL_WIDTH - 4, doorY: ROOM_PIXEL_HEIGHT / 2 }
    ];

    for (const dir of directions) {
        const nx = gridX + dir.x;
        const ny = gridY + dir.y;

        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 8 && roomGrid[ny][nx]) {
            const targetRoom = roomGrid[ny][nx];
            const needsKey = targetRoom.type === ROOM_TREASURE && floorNumber > 1;

            doors.push({
                x: dir.doorX,
                y: dir.doorY,
                width: dir.name === 'north' || dir.name === 'south' ? 24 : 12,
                height: dir.name === 'north' || dir.name === 'south' ? 12 : 24,
                direction: dir.name,
                targetX: nx,
                targetY: ny,
                locked: needsKey,
                open: enemies.length === 0
            });
        }
    }
}

// ===========================================
// ENEMY SPAWNING
// ===========================================

const ENEMY_CONFIGS = {
    [ENEMY_FLY]: { hp: 4, speed: 40, damage: 0.5, behavior: 'wander', color: '#666666', size: 8 },
    [ENEMY_ATTACK_FLY]: { hp: 6, speed: 50, damage: 0.5, behavior: 'chase', color: '#884488', size: 8 },
    [ENEMY_GAPER]: { hp: 12, speed: 30, damage: 1, behavior: 'chase', color: '#cc6666', size: 12 },
    [ENEMY_CHARGER]: { hp: 15, speed: 35, damage: 1, behavior: 'charge', color: '#aa4444', size: 14 },
    [ENEMY_POOTER]: { hp: 8, speed: 20, damage: 0.5, behavior: 'drift', color: '#aa8866', size: 10, shoots: true },
    [ENEMY_SPIDER]: { hp: 6, speed: 60, damage: 0.5, behavior: 'erratic', color: '#333333', size: 8 },
    [ENEMY_CLOTTY]: { hp: 10, speed: 25, damage: 0.5, behavior: 'wander', color: '#880000', size: 10, shoots: true },
    [ENEMY_HOPPER]: { hp: 10, speed: 0, damage: 1, behavior: 'hop', color: '#666644', size: 12 },
    [ENEMY_TRITE]: { hp: 10, speed: 80, damage: 1, behavior: 'leap', color: '#554433', size: 10 },
    [ENEMY_HORF]: { hp: 10, speed: 0, damage: 0.5, behavior: 'stationary', color: '#cc9999', size: 12, shoots: true, shootsInLine: true },
    [ENEMY_GLOBIN]: { hp: 20, speed: 25, damage: 1, behavior: 'chase', color: '#ff4444', size: 14, respawns: true }
};

// Champion modifiers
const CHAMPION_MODS = {
    [CHAMPION_RED]: { hpMult: 2, speedMult: 1, dmgMult: 1 },
    [CHAMPION_YELLOW]: { hpMult: 1, speedMult: 1.5, dmgMult: 1 },
    [CHAMPION_BLUE]: { hpMult: 1, speedMult: 1, dmgMult: 1, extraShots: true },
    [CHAMPION_GREEN]: { hpMult: 1, speedMult: 1, dmgMult: 1, spawnFlyOnDeath: true },
    [CHAMPION_BLACK]: { hpMult: 1, speedMult: 1, dmgMult: 2 }
};

function spawnEnemy(type, forceChampion = null) {
    const config = ENEMY_CONFIGS[type];
    if (!config) return;

    // Roll for champion (10% chance on floor 2+)
    let champion = CHAMPION_NONE;
    if (forceChampion) {
        champion = forceChampion;
    } else if (floorNumber >= 2 && Math.random() < 0.1) {
        const champions = [CHAMPION_RED, CHAMPION_YELLOW, CHAMPION_BLUE, CHAMPION_GREEN, CHAMPION_BLACK];
        champion = champions[Math.floor(Math.random() * champions.length)];
    }

    // Apply champion modifiers
    const mod = CHAMPION_MODS[champion] || { hpMult: 1, speedMult: 1, dmgMult: 1 };
    const hp = Math.floor(config.hp * mod.hpMult);
    const speed = config.speed * mod.speedMult;
    const damage = config.damage * mod.dmgMult;

    // Get champion color tint
    let color = config.color;
    if (champion !== CHAMPION_NONE) {
        color = getChampionColor(champion);
    }

    // Find valid spawn position (away from player spawn area)
    let x, y;
    let valid = false;

    for (let attempts = 0; attempts < 20; attempts++) {
        x = 40 + Math.random() * (ROOM_PIXEL_WIDTH - 80);
        y = 40 + Math.random() * (ROOM_PIXEL_HEIGHT - 80);

        // Avoid center (player spawn area)
        const centerDist = Math.hypot(x - ROOM_PIXEL_WIDTH/2, y - ROOM_PIXEL_HEIGHT/2);
        if (centerDist > 40) {
            valid = true;
            break;
        }
    }

    if (!valid) {
        x = 40 + Math.random() * (ROOM_PIXEL_WIDTH - 80);
        y = 40;
    }

    enemies.push({
        x, y,
        vx: 0, vy: 0,
        width: config.size,
        height: config.size,
        type,
        hp,
        maxHp: hp,
        damage,
        speed,
        behavior: config.behavior,
        color,
        baseColor: config.color,
        shoots: config.shoots || false,
        shootsInLine: config.shootsInLine || false,
        respawns: config.respawns || false,
        shootCooldown: 0,
        stunned: true,
        canMove: false,
        canAttack: false,
        chargeDir: null,
        charging: false,
        hopTimer: Math.random() * 2,
        leapTimer: 1 + Math.random(),
        direction: { x: Math.random() - 0.5, y: Math.random() - 0.5 },
        champion,
        extraShots: mod.extraShots || false,
        spawnFlyOnDeath: mod.spawnFlyOnDeath || false,
        respawnTimer: 0,
        isGlobinPile: false
    });
}

function getChampionColor(champion) {
    switch (champion) {
        case CHAMPION_RED: return '#ff4444';
        case CHAMPION_YELLOW: return '#ffff44';
        case CHAMPION_BLUE: return '#4444ff';
        case CHAMPION_GREEN: return '#44ff44';
        case CHAMPION_BLACK: return '#222222';
        default: return '#888888';
    }
}

function spawnBoss() {
    // Spawn Monstro
    enemies.push({
        x: ROOM_PIXEL_WIDTH / 2,
        y: ROOM_PIXEL_HEIGHT / 3,
        vx: 0, vy: 0,
        width: 32,
        height: 32,
        type: 'monstro',
        hp: 150,
        maxHp: 150,
        damage: 1,
        speed: 40,
        behavior: 'boss',
        color: '#884444',
        stunned: true,
        canMove: false,
        canAttack: false,
        phase: 0,
        attackTimer: 2,
        isBoss: true
    });
}

// ===========================================
// ITEM SYSTEM
// ===========================================

const ITEMS = {
    // Stat modifiers
    sadOnion: { name: 'Sad Onion', effect: 'tears', value: 0.7 },
    speedUp: { name: 'Speed Up', effect: 'speed', value: 0.15 },
    damageUp: { name: 'Damage Up', effect: 'damage', value: 1 },
    rangeUp: { name: 'Range Up', effect: 'range', value: 2.5 },
    luckUp: { name: 'Lucky Penny', effect: 'luck', value: 1 },
    heartContainer: { name: 'Heart Container', effect: 'maxHearts', value: 1 },
    // More stat items
    pentagram: { name: 'Pentagram', effect: 'damage', value: 1 },
    theMark: { name: 'The Mark', effect: 'multi', value: { damage: 1, speed: 0.2 } },
    magicMushroom: { name: 'Magic Mushroom', effect: 'allUp', value: 0.3 },
    polyphemus: { name: 'Polyphemus', effect: 'multi', value: { damage: 4, tears: -3 } },
    cricketHead: { name: "Cricket's Head", effect: 'damage', value: 0.5 },
    // Tear modifiers
    spoonBender: { name: 'Spoon Bender', effect: 'homing', value: true },
    cupidsArrow: { name: "Cupid's Arrow", effect: 'piercing', value: true },
    rubberCement: { name: 'Rubber Cement', effect: 'bouncing', value: true },
    // Soul hearts
    soulHeart: { name: 'Soul', effect: 'soulHeart', value: 1 },
    blackHeart: { name: 'Black Heart', effect: 'blackHeart', value: 1 },
    // Shot speed
    shotSpeedUp: { name: 'Shot Speed Up', effect: 'shotSpeed', value: 0.2 }
};

// Active items
const ACTIVE_ITEMS = {
    yumHeart: { name: 'Yum Heart', charges: 4, effect: 'heal', value: 1 },
    lemonMishap: { name: 'Lemon Mishap', charges: 2, effect: 'creep', value: 30 },
    bookOfBelial: { name: 'Book of Belial', charges: 3, effect: 'tempDamage', value: 2 },
    theNail: { name: 'The Nail', charges: 6, effect: 'tempDamageHearts', value: { damage: 0.7, blackHeart: 0.5 } },
    tamogotchi: { name: 'Tamogotchi', charges: 1, effect: 'spawnFly', value: 1 },
    shoop: { name: 'Shoop Da Whoop', charges: 4, effect: 'brimstone', value: 100 }
};

function getRandomItem() {
    const itemKeys = Object.keys(ITEMS);
    return itemKeys[Math.floor(Math.random() * itemKeys.length)];
}

function applyItem(itemKey) {
    const item = ITEMS[itemKey];
    if (!item) return;

    playerStats.items.push(itemKey);

    switch (item.effect) {
        case 'tears':
            playerStats.tearDelay = Math.max(1, playerStats.tearDelay - item.value);
            break;
        case 'speed':
            playerStats.speed += item.value;
            break;
        case 'damage':
            playerStats.damage += item.value;
            break;
        case 'range':
            playerStats.range += item.value;
            break;
        case 'luck':
            playerStats.luck += item.value;
            break;
        case 'maxHearts':
            playerStats.maxRedHearts = Math.min(12, playerStats.maxRedHearts + item.value);
            playerStats.redHearts = Math.min(playerStats.maxRedHearts, playerStats.redHearts + item.value);
            break;
        case 'shotSpeed':
            playerStats.shotSpeed += item.value;
            break;
        case 'multi':
            // Multiple stat changes
            if (item.value.damage) playerStats.damage += item.value.damage;
            if (item.value.speed) playerStats.speed += item.value.speed;
            if (item.value.tears) playerStats.tearDelay = Math.max(1, playerStats.tearDelay + item.value.tears);
            if (item.value.range) playerStats.range += item.value.range;
            break;
        case 'allUp':
            // All stats up slightly
            playerStats.damage += item.value;
            playerStats.speed += item.value * 0.3;
            playerStats.range += item.value * 3;
            playerStats.tearDelay = Math.max(1, playerStats.tearDelay - item.value * 0.5);
            break;
        case 'homing':
            playerStats.homing = true;
            break;
        case 'piercing':
            playerStats.piercing = true;
            break;
        case 'bouncing':
            playerStats.bouncing = true;
            break;
        case 'soulHeart':
            playerStats.soulHearts = Math.min(12, playerStats.soulHearts + item.value);
            break;
        case 'blackHeart':
            playerStats.blackHearts = Math.min(12, playerStats.blackHearts + item.value);
            break;
    }

    addFloatingText(player.x, player.y - 20, item.name, '#ffff00');
    screenShake = 5;
}

// Use active item (Q key)
function useActiveItem() {
    if (!activeItem || activeItemCharges < maxActiveItemCharges) return;

    const item = ACTIVE_ITEMS[activeItem];
    if (!item) return;

    activeItemCharges = 0;

    switch (item.effect) {
        case 'heal':
            playerStats.redHearts = Math.min(playerStats.maxRedHearts, playerStats.redHearts + item.value);
            addFloatingText(player.x, player.y - 20, '+HP', '#ff0000');
            break;
        case 'tempDamage':
            playerStats.tempDamageBonus = item.value;
            playerStats.tempDamageTimer = 10; // 10 seconds
            addFloatingText(player.x, player.y - 20, 'DMG UP!', '#ff6600');
            break;
        case 'spawnFly':
            // Spawn friendly fly
            addFloatingText(player.x, player.y - 20, 'Bzz!', '#888888');
            break;
        case 'creep':
            // Leave damaging creep (simplified - just damage nearby enemies)
            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < item.value) {
                    damageEnemy(enemy, playerStats.damage, 0, 0);
                }
            }
            createDeathExplosion(player.x, player.y, '#ffff00');
            break;
    }

    screenShake = 3;
}

// ===========================================
// UPDATE FUNCTIONS
// ===========================================

function gameUpdate() {
    // Handle menu state
    if (gameState === STATE_MENU) {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            startNewGame();
        }
        return;
    }

    // Handle game over state
    if (gameState === STATE_GAMEOVER) {
        if (keyWasPressed('Space') || keyWasPressed('KeyR')) {
            gameState = STATE_MENU;
        }
        return;
    }

    // Handle pause
    if (keyWasPressed('Escape')) {
        gameState = gameState === STATE_PAUSED ? STATE_PLAYING : STATE_PAUSED;
    }

    if (gameState === STATE_PAUSED) return;

    // Get delta time
    const dt = 1/60;

    // Update timers
    if (roomEntryTimer > 0) {
        roomEntryTimer -= dt;
    }

    if (enemyWakeTimer > 0) {
        enemyWakeTimer -= dt;
        if (enemyWakeTimer <= 0) {
            enemies.forEach(e => {
                e.stunned = false;
                e.canMove = true;
                e.canAttack = true;
            });
        }
    }

    if (playerInvincibleTimer > 0) {
        playerInvincibleTimer -= dt;
        player.invincible = true;
        player.flash = Math.floor(playerInvincibleTimer * 10) % 2 === 0;
    } else {
        player.invincible = false;
        player.flash = false;
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake -= dt * 20;
        screenShakeX = (Math.random() - 0.5) * screenShake;
        screenShakeY = (Math.random() - 0.5) * screenShake;
        if (screenShake < 0) screenShake = 0;
    } else {
        screenShakeX = 0;
        screenShakeY = 0;
    }

    // Update temp damage timer
    if (playerStats.tempDamageTimer > 0) {
        playerStats.tempDamageTimer -= dt;
        if (playerStats.tempDamageTimer <= 0) {
            playerStats.tempDamageBonus = 0;
        }
    }

    // Q key for active item
    if (keyWasPressed('KeyQ')) {
        useActiveItem();
    }

    // Update player
    updatePlayer(dt);

    // Update tears
    updateTears(dt);

    // Update enemies
    updateEnemies(dt);

    // Update pickups
    updatePickups(dt);

    // Update particles
    updateParticles(dt);

    // Update floating texts
    updateFloatingTexts(dt);

    // Check room clear
    checkRoomClear();

    // Check door collisions
    checkDoorCollisions();

    // Check trapdoor collision (go to next floor)
    checkTrapdoorCollision();
}

function checkTrapdoorCollision() {
    if (!trapdoor || !player) return;

    const dist = Math.hypot(player.x - trapdoor.x, player.y - trapdoor.y);
    if (dist < 20) {
        // Go to next floor
        floorNumber++;
        trapdoor = null;
        bossDefeated = false;
        roomStates.clear();

        // Regenerate floor
        generateFloor();
        currentRoomCoord = findStartRoom();
        loadRoom(currentRoomCoord.x, currentRoomCoord.y, null);

        // Place player in center
        player.x = ROOM_PIXEL_WIDTH / 2;
        player.y = ROOM_PIXEL_HEIGHT / 2;

        // Charge active item
        if (activeItem) {
            activeItemCharges = Math.min(maxActiveItemCharges, activeItemCharges + 1);
        }

        addFloatingText(ROOM_PIXEL_WIDTH / 2, ROOM_PIXEL_HEIGHT / 2 - 20, `Floor ${floorNumber}!`, '#ffffff');
        screenShake = 10;
    }
}

function updatePlayer(dt) {
    if (!player || roomEntryTimer > 0) return;

    // Movement (WASD)
    let moveX = 0, moveY = 0;

    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveY = -1;
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveY = 1;
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveX = -1;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveX = 1;

    // NOTE: Movement uses WASD only since arrow keys are for shooting
    moveX = 0; moveY = 0;
    if (keyIsDown('KeyW')) moveY = -1;
    if (keyIsDown('KeyS')) moveY = 1;
    if (keyIsDown('KeyA')) moveX = -1;
    if (keyIsDown('KeyD')) moveX = 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX /= len;
        moveY /= len;
    }

    // Apply movement
    const moveSpeed = 100 * playerStats.speed;
    player.vx = moveX * moveSpeed;
    player.vy = moveY * moveSpeed;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Save last direction
    if (moveX !== 0 || moveY !== 0) {
        player.lastDir = { x: moveX, y: moveY };
    }

    // Room bounds
    player.x = Math.max(16, Math.min(ROOM_PIXEL_WIDTH - 16, player.x));
    player.y = Math.max(16, Math.min(ROOM_PIXEL_HEIGHT - 16, player.y));

    // Obstacle collision
    for (const obs of obstacles) {
        if (obs.destroyed) continue;
        if (rectCollision(player, obs)) {
            // Push player out
            const dx = player.x - obs.x;
            const dy = player.y - obs.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                player.x = obs.x + (dx > 0 ? 1 : -1) * (obs.width/2 + player.width/2);
            } else {
                player.y = obs.y + (dy > 0 ? 1 : -1) * (obs.height/2 + player.height/2);
            }
        }
    }

    // Shooting (Arrow keys)
    let shootX = 0, shootY = 0;
    if (keyIsDown('ArrowUp')) shootY = -1;
    if (keyIsDown('ArrowDown')) shootY = 1;
    if (keyIsDown('ArrowLeft')) shootX = -1;
    if (keyIsDown('ArrowRight')) shootX = 1;

    if ((shootX !== 0 || shootY !== 0) && Date.now() - lastTearTime > playerStats.tearDelay * 33) {
        fireTear(shootX, shootY);
        lastTearTime = Date.now();
    }

    // Place bomb (E key)
    if (keyWasPressed('KeyE') && playerStats.bombs > 0) {
        placeBomb(player.x, player.y);
        playerStats.bombs--;
    }
}

function fireTear(dirX, dirY) {
    // Normalize direction
    const len = Math.hypot(dirX, dirY);
    if (len === 0) return;

    dirX /= len;
    dirY /= len;

    const tearSpeed = 150 * playerStats.shotSpeed;
    const totalDamage = playerStats.damage + playerStats.tempDamageBonus;

    tears.push({
        x: player.x,
        y: player.y,
        vx: dirX * tearSpeed,
        vy: dirY * tearSpeed,
        damage: totalDamage,
        lifetime: playerStats.range / (playerStats.shotSpeed * 7.5),
        size: 6,
        height: 0,
        gravity: 80,
        // Tear modifiers
        homing: playerStats.homing,
        piercing: playerStats.piercing,
        bouncing: playerStats.bouncing,
        bounceCount: 3, // Max bounces for bouncing tears
        hitEnemies: [] // Track hit enemies for piercing
    });
}

function updateTears(dt) {
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];

        // Homing behavior
        if (tear.homing && !tear.isEnemy) {
            let nearestEnemy = null;
            let nearestDist = 100;
            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - tear.x, enemy.y - tear.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
            if (nearestEnemy) {
                const targetAngle = Math.atan2(nearestEnemy.y - tear.y, nearestEnemy.x - tear.x);
                const currentAngle = Math.atan2(tear.vy, tear.vx);
                const speed = Math.hypot(tear.vx, tear.vy);
                const newAngle = currentAngle + (targetAngle - currentAngle) * 0.1;
                tear.vx = Math.cos(newAngle) * speed;
                tear.vy = Math.sin(newAngle) * speed;
            }
        }

        // Move tear
        tear.x += tear.vx * dt;
        tear.y += tear.vy * dt;

        // Apply gravity (slight arc) - less for homing
        tear.vy += (tear.homing ? 20 : tear.gravity) * dt;

        // Reduce lifetime
        tear.lifetime -= dt;

        // Check wall collision
        let hitWall = false;
        if (tear.x < 8 || tear.x > ROOM_PIXEL_WIDTH - 8) {
            if (tear.bouncing && tear.bounceCount > 0) {
                tear.vx = -tear.vx;
                tear.bounceCount--;
                tear.x = Math.max(8, Math.min(ROOM_PIXEL_WIDTH - 8, tear.x));
            } else {
                hitWall = true;
            }
        }
        if (tear.y < 8 || tear.y > ROOM_PIXEL_HEIGHT - 8) {
            if (tear.bouncing && tear.bounceCount > 0) {
                tear.vy = -tear.vy;
                tear.bounceCount--;
                tear.y = Math.max(8, Math.min(ROOM_PIXEL_HEIGHT - 8, tear.y));
            } else {
                hitWall = true;
            }
        }

        if (hitWall) {
            createSplash(tear.x, tear.y);
            tears.splice(i, 1);
            continue;
        }

        // Check obstacle collision
        let hitObstacle = false;
        for (const obs of obstacles) {
            if (obs.destroyed) continue;
            if (circleRectCollision(tear.x, tear.y, tear.size/2, obs)) {
                if (obs.type === 'poop' && obs.hp > 0) {
                    obs.hp--;
                    if (obs.hp <= 0) {
                        obs.destroyed = true;
                        createSplash(obs.x, obs.y, '#885500');
                        addFloatingText(obs.x, obs.y, 'Poop!', '#885500');
                    }
                }
                createSplash(tear.x, tear.y);
                hitObstacle = true;
                break;
            }
        }

        if (hitObstacle && !tear.piercing) {
            tears.splice(i, 1);
            continue;
        }

        // Check enemy collision
        let hitEnemy = false;
        for (const enemy of enemies) {
            // Skip enemies already hit by piercing tear
            if (tear.piercing && tear.hitEnemies && tear.hitEnemies.includes(enemy)) continue;

            if (circleRectCollision(tear.x, tear.y, tear.size/2, enemy)) {
                damageEnemy(enemy, tear.damage, tear.vx, tear.vy);
                createSplash(tear.x, tear.y, '#ff0000');
                hitEnemy = true;

                if (tear.piercing) {
                    if (!tear.hitEnemies) tear.hitEnemies = [];
                    tear.hitEnemies.push(enemy);
                }
                break;
            }
        }

        if (hitEnemy && !tear.piercing) {
            tears.splice(i, 1);
            continue;
        }

        // Remove if lifetime expired
        if (tear.lifetime <= 0) {
            createSplash(tear.x, tear.y);
            tears.splice(i, 1);
        }
    }
}

function damageEnemy(enemy, damage, knockX, knockY) {
    enemy.hp -= damage;

    // Apply knockback
    const knockback = 50;
    if (knockX !== 0 || knockY !== 0) {
        const len = Math.hypot(knockX, knockY);
        enemy.vx += (knockX / len) * knockback;
        enemy.vy += (knockY / len) * knockback;
    }

    // No damage numbers per GDD requirement

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    // Handle Globin respawn
    if (enemy.respawns && !enemy.isGlobinPile) {
        enemy.isGlobinPile = true;
        enemy.respawnTimer = 3;
        enemy.hp = enemy.maxHp / 2;
        enemy.speed = 0;
        enemy.behavior = 'pile';
        createDeathExplosion(enemy.x, enemy.y, enemy.color);
        return;
    }

    const index = enemies.indexOf(enemy);
    if (index > -1) {
        enemies.splice(index, 1);
    }

    // Spawn death particles
    createDeathExplosion(enemy.x, enemy.y, enemy.color);

    // Champion death effects
    if (enemy.spawnFlyOnDeath) {
        spawnEnemy(ENEMY_FLY);
        enemies[enemies.length - 1].x = enemy.x;
        enemies[enemies.length - 1].y = enemy.y;
        enemies[enemies.length - 1].stunned = false;
        enemies[enemies.length - 1].canMove = true;
        enemies[enemies.length - 1].canAttack = true;
    }

    // Boss kill
    if (enemy.isBoss) {
        bossDefeated = true;
        screenShake = 20;

        // Spawn trapdoor
        trapdoor = {
            x: enemy.x,
            y: enemy.y,
            width: 24,
            height: 24
        };

        // Spawn boss item
        pickups.push({
            x: enemy.x + 40,
            y: enemy.y,
            type: 'item',
            item: getRandomItem(),
            collected: false,
            bobTimer: 0
        });

        // Extra drops
        for (let i = 0; i < 3; i++) {
            pickups.push({
                x: enemy.x + (Math.random() - 0.5) * 60,
                y: enemy.y + (Math.random() - 0.5) * 60,
                type: Math.random() < 0.7 ? 'redHeart' : 'soulHeart',
                collected: false,
                bobTimer: Math.random() * Math.PI * 2
            });
        }

        addFloatingText(enemy.x, enemy.y - 30, 'BOSS DEFEATED!', '#ffff00');
    }

    // Roll for pickup drop
    rollPickupDrop(enemy.x, enemy.y);

    // Screen shake for kills
    screenShake = Math.max(screenShake, 2);
}

function rollPickupDrop(x, y) {
    const baseChance = 0.33 + playerStats.luck * 0.01;
    if (Math.random() > baseChance) return;

    const roll = Math.random() * 100;
    let type;

    if (roll < 20) type = 'redHeart';
    else if (roll < 35) type = 'halfHeart';
    else if (roll < 40) type = 'soulHeart';
    else if (roll < 65) type = 'penny';
    else if (roll < 75) type = 'bomb';
    else if (roll < 85) type = 'key';
    else type = 'penny';

    pickups.push({
        x, y,
        type,
        collected: false,
        bobTimer: Math.random() * Math.PI * 2
    });
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.stunned) continue;

        // Apply friction to knockback
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;

        // Update behavior
        updateEnemyBehavior(enemy, dt);

        // Apply velocity
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        // Room bounds
        enemy.x = Math.max(16, Math.min(ROOM_PIXEL_WIDTH - 16, enemy.x));
        enemy.y = Math.max(16, Math.min(ROOM_PIXEL_HEIGHT - 16, enemy.y));

        // Check collision with player
        if (enemy.canAttack && player && !player.invincible) {
            if (rectCollision(enemy, player)) {
                playerTakeDamage(enemy.damage);
            }
        }

        // Enemy shooting
        if (enemy.shoots && enemy.canAttack) {
            enemy.shootCooldown -= dt;
            if (enemy.shootCooldown <= 0) {
                fireEnemyBullet(enemy);
                enemy.shootCooldown = 2 + Math.random();
            }
        }
    }
}

function updateEnemyBehavior(enemy, dt) {
    if (!player) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    switch (enemy.behavior) {
        case 'wander':
            // Random walk, change direction occasionally
            if (Math.random() < 0.02 || enemy.x < 20 || enemy.x > ROOM_PIXEL_WIDTH - 20 ||
                enemy.y < 20 || enemy.y > ROOM_PIXEL_HEIGHT - 20) {
                enemy.direction = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
            }
            enemy.vx += enemy.direction.x * enemy.speed * dt;
            enemy.vy += enemy.direction.y * enemy.speed * dt;
            break;

        case 'chase':
            // Move toward player
            if (dist > 0) {
                enemy.vx += (dx / dist) * enemy.speed * dt;
                enemy.vy += (dy / dist) * enemy.speed * dt;
            }
            break;

        case 'charge':
            // Charge at player when in line
            if (!enemy.charging) {
                const inLineX = Math.abs(dx) < 10;
                const inLineY = Math.abs(dy) < 10;

                if (inLineX || inLineY) {
                    enemy.charging = true;
                    enemy.chargeDir = inLineX ? { x: 0, y: Math.sign(dy) } : { x: Math.sign(dx), y: 0 };
                } else {
                    // Wander otherwise
                    if (Math.random() < 0.02) {
                        enemy.direction = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
                    }
                    enemy.vx += enemy.direction.x * enemy.speed * dt;
                    enemy.vy += enemy.direction.y * enemy.speed * dt;
                }
            } else {
                // Execute charge
                enemy.vx = enemy.chargeDir.x * enemy.speed * 3;
                enemy.vy = enemy.chargeDir.y * enemy.speed * 3;

                // Stop charging on wall hit
                if (enemy.x <= 16 || enemy.x >= ROOM_PIXEL_WIDTH - 16 ||
                    enemy.y <= 16 || enemy.y >= ROOM_PIXEL_HEIGHT - 16) {
                    enemy.charging = false;
                }
            }
            break;

        case 'drift':
            // Slowly drift toward player
            if (dist > 0) {
                enemy.vx += (dx / dist) * enemy.speed * dt * 0.5;
                enemy.vy += (dy / dist) * enemy.speed * dt * 0.5;
            }
            break;

        case 'erratic':
            // Fast, erratic movement
            if (Math.random() < 0.1) {
                enemy.direction = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
            }
            // Bias toward player when close
            if (dist < 80) {
                enemy.direction.x += dx / dist * 0.5;
                enemy.direction.y += dy / dist * 0.5;
            }
            enemy.vx = enemy.direction.x * enemy.speed;
            enemy.vy = enemy.direction.y * enemy.speed;
            break;

        case 'hop':
            // Hop occasionally
            enemy.hopTimer -= dt;
            if (enemy.hopTimer <= 0) {
                // Hop toward player
                const hopPower = 150;
                if (dist > 0) {
                    enemy.vx = (dx / dist) * hopPower;
                    enemy.vy = (dy / dist) * hopPower;
                }
                enemy.hopTimer = 1 + Math.random();
            }
            break;

        case 'leap':
            // Trite behavior - leap at player
            enemy.leapTimer -= dt;
            if (enemy.leapTimer <= 0 && dist < 150) {
                // Fast leap toward player
                const leapPower = 200;
                if (dist > 0) {
                    enemy.vx = (dx / dist) * leapPower;
                    enemy.vy = (dy / dist) * leapPower;
                }
                enemy.leapTimer = 0.5 + Math.random() * 0.5;
            } else if (enemy.leapTimer > 0) {
                // Slow movement between leaps
                if (dist > 0) {
                    enemy.vx *= 0.95;
                    enemy.vy *= 0.95;
                }
            }
            break;

        case 'stationary':
            // Horf behavior - stationary, shoots when player in line
            enemy.vx = 0;
            enemy.vy = 0;
            if (enemy.shoots && enemy.shootsInLine) {
                const inLineX = Math.abs(dx) < 15;
                const inLineY = Math.abs(dy) < 15;
                if ((inLineX || inLineY) && enemy.shootCooldown <= 0) {
                    fireEnemyBullet(enemy);
                    enemy.shootCooldown = 1.5;
                }
            }
            break;

        case 'boss':
            updateBossAI(enemy, dt);
            break;
    }

    // Limit velocity
    const maxSpeed = enemy.speed * (enemy.charging ? 3 : 1.5);
    const speed = Math.hypot(enemy.vx, enemy.vy);
    if (speed > maxSpeed) {
        enemy.vx = (enemy.vx / speed) * maxSpeed;
        enemy.vy = (enemy.vy / speed) * maxSpeed;
    }
}

function updateBossAI(boss, dt) {
    if (!player) return;

    boss.attackTimer -= dt;

    if (boss.attackTimer <= 0) {
        boss.phase = (boss.phase + 1) % 3;

        switch (boss.phase) {
            case 0: // Hop toward player
                const dx = player.x - boss.x;
                const dy = player.y - boss.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    boss.vx = (dx / dist) * 100;
                    boss.vy = (dy / dist) * 100;
                }
                boss.attackTimer = 1;
                break;

            case 1: // Spit projectiles
                for (let i = -3; i <= 3; i++) {
                    const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + i * 0.2;
                    tears.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(angle) * 80,
                        vy: Math.sin(angle) * 80,
                        damage: boss.damage,
                        lifetime: 3,
                        size: 8,
                        height: 0,
                        gravity: 30,
                        isEnemy: true
                    });
                }
                boss.attackTimer = 1.5;
                break;

            case 2: // Jump attack
                boss.vx = 0;
                boss.vy = 0;
                // Radial burst
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                    tears.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(angle) * 60,
                        vy: Math.sin(angle) * 60,
                        damage: boss.damage,
                        lifetime: 3,
                        size: 8,
                        height: 0,
                        gravity: 20,
                        isEnemy: true
                    });
                }
                boss.attackTimer = 2;
                break;
        }
    }
}

function fireEnemyBullet(enemy) {
    if (!player) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
        tears.push({
            x: enemy.x,
            y: enemy.y,
            vx: (dx / dist) * 80,
            vy: (dy / dist) * 80,
            damage: enemy.damage,
            lifetime: 3,
            size: 6,
            height: 0,
            gravity: 40,
            isEnemy: true
        });
    }
}

function updatePickups(dt) {
    for (const pickup of pickups) {
        if (pickup.collected) continue;

        // Bob animation
        pickup.bobTimer = (pickup.bobTimer || 0) + dt * 3;
        pickup.bobY = Math.sin(pickup.bobTimer) * 2;

        // Check player collision
        if (player && circleRectCollision(pickup.x, pickup.y, 12, player)) {
            if (pickup.type === 'shop') {
                // Shop items need coins
                if (playerStats.coins >= pickup.price) {
                    playerStats.coins -= pickup.price;
                    collectPickup(pickup);
                }
            } else if (pickup.type === 'item') {
                applyItem(pickup.item);
                pickup.collected = true;
            } else {
                collectPickup(pickup);
            }
        }
    }
}

function collectPickup(pickup) {
    pickup.collected = true;

    switch (pickup.type) {
        case 'redHeart':
            if (playerStats.redHearts < playerStats.maxRedHearts) {
                playerStats.redHearts = Math.min(playerStats.maxRedHearts, playerStats.redHearts + 1);
                addFloatingText(pickup.x, pickup.y, '+1 HP', '#ff0000');
            }
            break;
        case 'halfHeart':
            if (playerStats.redHearts < playerStats.maxRedHearts) {
                playerStats.redHearts = Math.min(playerStats.maxRedHearts, playerStats.redHearts + 0.5);
                addFloatingText(pickup.x, pickup.y, '+0.5 HP', '#ff6666');
            }
            break;
        case 'soulHeart':
            playerStats.soulHearts = Math.min(12, playerStats.soulHearts + 1);
            addFloatingText(pickup.x, pickup.y, '+Soul', '#6666ff');
            break;
        case 'penny':
            playerStats.coins++;
            addFloatingText(pickup.x, pickup.y, '+1', '#ffff00');
            break;
        case 'key':
            playerStats.keys++;
            addFloatingText(pickup.x, pickup.y, '+Key', '#ffcc00');
            break;
        case 'bomb':
            playerStats.bombs++;
            addFloatingText(pickup.x, pickup.y, '+Bomb', '#666666');
            break;
        case 'heart':
            playerStats.redHearts = Math.min(playerStats.maxRedHearts, playerStats.redHearts + 1);
            addFloatingText(pickup.x, pickup.y, '+1 HP', '#ff0000');
            break;
    }
}

function playerTakeDamage(amount) {
    if (player.invincible) return;

    // Damage soul hearts first
    if (playerStats.soulHearts > 0) {
        playerStats.soulHearts = Math.max(0, playerStats.soulHearts - amount);
    } else {
        playerStats.redHearts = Math.max(0, playerStats.redHearts - amount);
    }

    // Invincibility frames
    playerInvincibleTimer = 1;

    // Knockback
    if (enemies.length > 0) {
        const nearest = enemies[0];
        const dx = player.x - nearest.x;
        const dy = player.y - nearest.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            player.vx += (dx / dist) * 150;
            player.vy += (dy / dist) * 150;
        }
    }

    // Create hurt particles
    createDeathExplosion(player.x, player.y, '#ff0000');

    // Check death
    if (playerStats.redHearts <= 0 && playerStats.soulHearts <= 0) {
        gameState = STATE_GAMEOVER;
    }
}

function placeBomb(x, y) {
    // Create bomb obstacle that explodes after delay
    const bomb = {
        x, y,
        width: 10,
        height: 10,
        type: 'bomb',
        timer: 2,
        hp: -1,
        destroyed: false
    };
    obstacles.push(bomb);

    // Explode after timer (handled in update)
    setTimeout(() => {
        if (bomb.destroyed) return;
        bomb.destroyed = true;

        // Damage radius
        const radius = 48;

        // Damage enemies
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - bomb.x, enemy.y - bomb.y);
            if (dist < radius) {
                damageEnemy(enemy, 60, enemy.x - bomb.x, enemy.y - bomb.y);
            }
        }

        // Damage player
        if (player) {
            const dist = Math.hypot(player.x - bomb.x, player.y - bomb.y);
            if (dist < radius) {
                playerTakeDamage(1);
            }
        }

        // Destroy obstacles
        for (const obs of obstacles) {
            if (obs === bomb || obs.destroyed) continue;
            const dist = Math.hypot(obs.x - bomb.x, obs.y - bomb.y);
            if (dist < radius && obs.type !== 'rock') {
                obs.destroyed = true;
            }
        }

        // Create explosion effect
        createDeathExplosion(bomb.x, bomb.y, '#ffaa00');
        createDeathExplosion(bomb.x, bomb.y, '#ff6600');
    }, 2000);
}

function checkRoomClear() {
    if (enemies.length === 0 && currentRoom) {
        // Open doors
        for (const door of doors) {
            door.open = true;
        }

        // Save room state
        const roomKey = `${floorNumber}_${currentRoomCoord.x}_${currentRoomCoord.y}`;
        if (roomStates.has(roomKey)) {
            const state = roomStates.get(roomKey);
            state.enemies = [];
            state.cleared = true;
            state.pickups = pickups.filter(p => !p.collected).map(p => ({ ...p }));
            state.obstacles = obstacles.filter(o => !o.destroyed).map(o => ({ ...o }));
        }
    }
}

function checkDoorCollisions() {
    if (!player || roomEntryTimer > 0) return;

    for (const door of doors) {
        if (!door.open) {
            if (door.locked && playerStats.keys > 0) {
                // Check if player near locked door
                const dist = Math.hypot(player.x - door.x, player.y - door.y);
                if (dist < 20) {
                    playerStats.keys--;
                    door.locked = false;
                    door.open = true;
                    addFloatingText(door.x, door.y, 'Unlocked!', '#ffcc00');
                }
            }
            continue;
        }

        // Check if player entered door
        const inDoor = Math.abs(player.x - door.x) < door.width/2 + 8 &&
                       Math.abs(player.y - door.y) < door.height/2 + 8;

        if (inDoor) {
            // Transition to next room
            let entryDir;
            switch (door.direction) {
                case 'north': entryDir = 'south'; break;
                case 'south': entryDir = 'north'; break;
                case 'west': entryDir = 'east'; break;
                case 'east': entryDir = 'west'; break;
            }

            currentRoomCoord = { x: door.targetX, y: door.targetY };
            loadRoom(door.targetX, door.targetY, entryDir);
            return;
        }
    }
}

// ===========================================
// PARTICLE SYSTEM
// ===========================================

function createSplash(x, y, color = '#6688ff') {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60 - 30,
            life: 0.5,
            maxLife: 0.5,
            size: 2 + Math.random() * 2,
            color
        });
    }
}

function createDeathExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            life: 0.6,
            maxLife: 0.6,
            size: 3 + Math.random() * 3,
            color
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // Gravity
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ===========================================
// FLOATING TEXT
// ===========================================

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y,
        text,
        color,
        life: 1,
        vy: -30
    });
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= dt;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// ===========================================
// COLLISION HELPERS
// ===========================================

function rectCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

function circleRectCollision(cx, cy, r, rect) {
    const dx = Math.abs(cx - rect.x);
    const dy = Math.abs(cy - rect.y);

    if (dx > rect.width/2 + r) return false;
    if (dy > rect.height/2 + r) return false;

    if (dx <= rect.width/2) return true;
    if (dy <= rect.height/2) return true;

    const cornerDist = Math.pow(dx - rect.width/2, 2) + Math.pow(dy - rect.height/2, 2);
    return cornerDist <= r * r;
}

// ===========================================
// POST UPDATE
// ===========================================

function gameUpdatePost() {
    // Check for enemy bullets hitting player
    if (gameState === STATE_PLAYING && player && !player.invincible) {
        for (let i = tears.length - 1; i >= 0; i--) {
            const tear = tears[i];
            if (tear.isEnemy) {
                if (circleRectCollision(tear.x, tear.y, tear.size/2, player)) {
                    playerTakeDamage(tear.damage);
                    tears.splice(i, 1);
                }
            }
        }
    }
}

// ===========================================
// RENDERING
// ===========================================

function gameRender() {
    // Clear with dark color
    drawRect(vec2(ROOM_PIXEL_WIDTH/2/TILE_SIZE, ROOM_PIXEL_HEIGHT/2/TILE_SIZE),
             vec2(ROOM_PIXEL_WIDTH/TILE_SIZE, ROOM_PIXEL_HEIGHT/TILE_SIZE),
             new Color(0.15, 0.12, 0.1));
}

function gameRenderPost() {
    // Use overlay canvas for custom rendering
    const ctx = mainContext;
    ctx.save();

    // Scale to match game
    const scale = Math.min(mainCanvas.width / GAME_WIDTH, mainCanvas.height / GAME_HEIGHT);
    const offsetX = (mainCanvas.width - GAME_WIDTH * scale) / 2;
    const offsetY = (mainCanvas.height - GAME_HEIGHT * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Center the room
    const roomOffsetX = (GAME_WIDTH - ROOM_PIXEL_WIDTH) / 2;
    const roomOffsetY = 60;

    if (gameState === STATE_MENU) {
        renderMenu(ctx);
    } else if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
        ctx.save();
        // Apply screen shake
        ctx.translate(roomOffsetX + screenShakeX, roomOffsetY + screenShakeY);
        renderRoom(ctx);
        ctx.restore();

        renderHUD(ctx);
        renderMinimap(ctx);

        if (gameState === STATE_PAUSED) {
            renderPauseOverlay(ctx);
        }
    } else if (gameState === STATE_GAMEOVER) {
        renderGameOver(ctx);
    }

    ctx.restore();
}

function renderMenu(ctx) {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.fillStyle = '#cc4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BINDING OF ISAAC', GAME_WIDTH/2, 200);
    ctx.fillText('CLONE', GAME_WIDTH/2, 260);

    // Subtitle
    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('LittleJS Edition', GAME_WIDTH/2, 300);

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.fillText('WASD - Move', GAME_WIDTH/2, 380);
    ctx.fillText('Arrow Keys - Shoot', GAME_WIDTH/2, 410);
    ctx.fillText('E - Place Bomb', GAME_WIDTH/2, 440);
    ctx.fillText('ESC - Pause', GAME_WIDTH/2, 470);

    // Start prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
        ctx.fillText('Press SPACE to Start', GAME_WIDTH/2, 540);
    }
}

function renderRoom(ctx) {
    // Floor
    ctx.fillStyle = '#3d3022';
    ctx.fillRect(0, 0, ROOM_PIXEL_WIDTH, ROOM_PIXEL_HEIGHT);

    // Floor pattern
    ctx.fillStyle = '#352b1e';
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Walls
    ctx.fillStyle = '#4a3d2e';
    ctx.fillRect(0, 0, ROOM_PIXEL_WIDTH, 12);
    ctx.fillRect(0, ROOM_PIXEL_HEIGHT - 12, ROOM_PIXEL_WIDTH, 12);
    ctx.fillRect(0, 0, 12, ROOM_PIXEL_HEIGHT);
    ctx.fillRect(ROOM_PIXEL_WIDTH - 12, 0, 12, ROOM_PIXEL_HEIGHT);

    // Doors
    for (const door of doors) {
        if (door.locked) {
            ctx.fillStyle = '#886622';
        } else if (door.open) {
            ctx.fillStyle = '#222222';
        } else {
            ctx.fillStyle = '#554433';
        }

        ctx.fillRect(
            door.x - door.width/2,
            door.y - door.height/2,
            door.width,
            door.height
        );

        // Door frame
        ctx.strokeStyle = '#665544';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            door.x - door.width/2,
            door.y - door.height/2,
            door.width,
            door.height
        );
    }

    // Obstacles
    for (const obs of obstacles) {
        if (obs.destroyed) continue;

        if (obs.type === 'rock') {
            ctx.fillStyle = '#666666';
            ctx.fillRect(obs.x - obs.width/2, obs.y - obs.height/2, obs.width, obs.height);
            ctx.fillStyle = '#555555';
            ctx.fillRect(obs.x - obs.width/2 + 2, obs.y - obs.height/2 + 2, obs.width - 4, obs.height - 4);
        } else if (obs.type === 'poop') {
            // Poop with damage states
            const hpRatio = obs.hp / obs.maxHp;
            if (hpRatio > 0.66) {
                ctx.fillStyle = '#885500';
            } else if (hpRatio > 0.33) {
                ctx.fillStyle = '#775500';
            } else {
                ctx.fillStyle = '#664400';
            }

            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.width/2 * (0.5 + hpRatio * 0.5), 0, Math.PI * 2);
            ctx.fill();

            // Cracks for damaged poops
            if (hpRatio < 1) {
                ctx.strokeStyle = '#443300';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(obs.x - 3, obs.y - 3);
                ctx.lineTo(obs.x + 2, obs.y + 4);
                ctx.stroke();
            }
        } else if (obs.type === 'bomb') {
            // Placed bomb
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Fuse
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y - 6);
            ctx.lineTo(obs.x, obs.y - 10);
            ctx.stroke();

            // Spark
            const sparkSize = 2 + Math.sin(Date.now() / 50) * 2;
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y - 10, sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Pickups
    for (const pickup of pickups) {
        if (pickup.collected) continue;

        const bobY = pickup.bobY || 0;
        const px = pickup.x;
        const py = pickup.y + bobY;

        switch (pickup.type) {
            case 'redHeart':
                drawHeart(ctx, px, py, '#ff0000', 8);
                break;
            case 'halfHeart':
                drawHeart(ctx, px, py, '#ff6666', 6);
                break;
            case 'soulHeart':
                drawHeart(ctx, px, py, '#6666ff', 8);
                break;
            case 'penny':
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc9900';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'key':
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(px - 2, py - 6, 4, 8);
                ctx.fillRect(px - 4, py - 6, 8, 3);
                break;
            case 'bomb':
                ctx.fillStyle = '#333333';
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, py - 6);
                ctx.lineTo(px + 3, py - 10);
                ctx.stroke();
                break;
            case 'item':
            case 'shop':
                // Item pedestal
                ctx.fillStyle = '#8888aa';
                ctx.fillRect(px - 12, py + 4, 24, 8);
                ctx.fillStyle = '#9999bb';
                ctx.fillRect(px - 10, py + 2, 20, 4);

                // Item glow
                ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
                ctx.beginPath();
                ctx.arc(px, py - 4, 12, 0, Math.PI * 2);
                ctx.fill();

                // Item icon
                ctx.fillStyle = '#ffff66';
                ctx.fillRect(px - 6, py - 10, 12, 12);

                // Price tag for shop items
                if (pickup.type === 'shop') {
                    ctx.fillStyle = '#000000';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`$${pickup.price}`, px, py + 18);
                }
                break;
        }
    }

    // Trapdoor
    if (trapdoor) {
        // Trapdoor shadow
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(trapdoor.x, trapdoor.y + 2, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trapdoor hole
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(trapdoor.x, trapdoor.y, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(trapdoor.x, trapdoor.y, 14, 9, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Stairs hint
        ctx.fillStyle = '#333333';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(trapdoor.x - 5 + i * 2, trapdoor.y - 3 + i * 2, 6, 2);
        }
    }

    // Tears
    for (const tear of tears) {
        // Homing tears have a purple tint
        let tearColor;
        if (tear.isEnemy) {
            tearColor = '#aa4444';
        } else if (tear.homing) {
            tearColor = '#aa66ff';
        } else if (tear.piercing) {
            tearColor = '#ffff66';
        } else if (tear.bouncing) {
            tearColor = '#66ffaa';
        } else {
            tearColor = '#6688ff';
        }
        ctx.fillStyle = tearColor;
        ctx.beginPath();
        ctx.arc(tear.x, tear.y, tear.size/2, 0, Math.PI * 2);
        ctx.fill();

        // Tear highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(tear.x - tear.size/4, tear.y - tear.size/4, tear.size/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Enemies
    for (const enemy of enemies) {
        ctx.fillStyle = enemy.color;

        if (enemy.isBoss) {
            // Boss (Monstro)
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.width/2, 0, Math.PI * 2);
            ctx.fill();

            // Face
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemy.x - 8, enemy.y - 5, 4, 0, Math.PI * 2);
            ctx.arc(enemy.x + 8, enemy.y - 5, 4, 0, Math.PI * 2);
            ctx.fill();

            // Mouth
            ctx.fillStyle = '#440000';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y + 5, 12, 0, Math.PI);
            ctx.fill();

            // Health bar
            const hpWidth = 50;
            ctx.fillStyle = '#440000';
            ctx.fillRect(enemy.x - hpWidth/2, enemy.y - enemy.height/2 - 10, hpWidth, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x - hpWidth/2, enemy.y - enemy.height/2 - 10,
                        hpWidth * (enemy.hp / enemy.maxHp), 4);
        } else {
            // Regular enemy
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.width/2, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ffffff';
            const eyeOffset = enemy.width / 5;
            ctx.beginPath();
            ctx.arc(enemy.x - eyeOffset, enemy.y - eyeOffset/2, enemy.width/6, 0, Math.PI * 2);
            ctx.arc(enemy.x + eyeOffset, enemy.y - eyeOffset/2, enemy.width/6, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemy.x - eyeOffset, enemy.y - eyeOffset/2, enemy.width/10, 0, Math.PI * 2);
            ctx.arc(enemy.x + eyeOffset, enemy.y - eyeOffset/2, enemy.width/10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stun indicator
        if (enemy.stunned) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.width/2 + 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Player
    if (player && (!player.flash || Math.floor(Date.now() / 100) % 2)) {
        // Body
        ctx.fillStyle = '#ffccaa';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        const eyeDir = player.lastDir;
        ctx.beginPath();
        ctx.arc(player.x - 3 + eyeDir.x * 2, player.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(player.x + 3 + eyeDir.x * 2, player.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tear (crying)
        ctx.fillStyle = '#6688ff';
        ctx.beginPath();
        ctx.arc(player.x - 3, player.y + 3, 1.5, 0, Math.PI * 2);
        ctx.arc(player.x + 3, player.y + 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const t of floatingTexts) {
        const alpha = t.life;
        ctx.fillStyle = t.color;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
}

function drawHeart(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size/3);
    ctx.bezierCurveTo(x, y - size/2, x - size, y - size/2, x - size, y + size/4);
    ctx.bezierCurveTo(x - size, y + size/2, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size, y + size/2, x + size, y + size/4);
    ctx.bezierCurveTo(x + size, y - size/2, x, y - size/2, x, y + size/3);
    ctx.fill();
}

function renderHUD(ctx) {
    // Stats panel (top left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    // Hearts
    let heartX = 20;
    for (let i = 0; i < playerStats.maxRedHearts; i++) {
        if (i < Math.floor(playerStats.redHearts)) {
            drawHeart(ctx, heartX, 28, '#ff0000', 8);
        } else if (i < playerStats.redHearts) {
            drawHeart(ctx, heartX, 28, '#ff6666', 8);
        } else {
            drawHeart(ctx, heartX, 28, '#440000', 8);
        }
        heartX += 18;
    }

    // Soul hearts
    heartX = 20;
    for (let i = 0; i < playerStats.soulHearts; i++) {
        drawHeart(ctx, heartX, 48, '#6666ff', 8);
        heartX += 18;
    }

    // Stats
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.fillText(`DMG: ${playerStats.damage.toFixed(1)}`, 20, 70);
    ctx.fillText(`SPD: ${playerStats.speed.toFixed(1)}`, 80, 70);
    ctx.fillText(`RANGE: ${playerStats.range.toFixed(1)}`, 20, 85);

    // Resources
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`Keys: ${playerStats.keys}`, 20, 105);
    ctx.fillStyle = '#888888';
    ctx.fillText(`Bombs: ${playerStats.bombs}`, 80, 105);
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Coins: ${playerStats.coins}`, 20, 120);

    // Floor indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Floor ${floorNumber}`, GAME_WIDTH / 2, 30);

    // Room type indicator
    if (currentRoom) {
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        let roomName = currentRoom.type.charAt(0).toUpperCase() + currentRoom.type.slice(1);
        ctx.fillText(roomName, GAME_WIDTH / 2, 48);
    }
}

function renderMinimap(ctx) {
    const mapX = GAME_WIDTH - 110;
    const mapY = 10;
    const cellSize = 10;
    const spacing = 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, 105, 90);

    // Draw rooms
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
            const room = roomGrid[y][x];
            if (!room) continue;

            const rx = mapX + x * (cellSize + spacing);
            const ry = mapY + y * (cellSize + spacing);

            // Only show discovered rooms
            if (room.discovered) {
                // Room color based on type
                switch (room.type) {
                    case ROOM_START:
                        ctx.fillStyle = '#88ff88';
                        break;
                    case ROOM_BOSS:
                        ctx.fillStyle = '#ff4444';
                        break;
                    case ROOM_TREASURE:
                        ctx.fillStyle = '#ffff44';
                        break;
                    case ROOM_SHOP:
                        ctx.fillStyle = '#44ffff';
                        break;
                    default:
                        ctx.fillStyle = '#888888';
                }
            } else if (room.adjacentSeen) {
                // Show as unknown adjacent room
                ctx.fillStyle = '#444444';
            } else {
                continue; // Don't show undiscovered rooms
            }

            ctx.fillRect(rx, ry, cellSize, cellSize);

            // Current room indicator
            if (x === currentRoomCoord.x && y === currentRoomCoord.y) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx - 1, ry - 1, cellSize + 2, cellSize + 2);
            }
        }
    }
}

function renderPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH/2, GAME_HEIGHT/2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText('Press ESC to Resume', GAME_WIDTH/2, GAME_HEIGHT/2 + 30);
}

function renderGameOver(ctx) {
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', GAME_WIDTH/2, GAME_HEIGHT/2 - 50);

    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText(`Floor ${floorNumber}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
    ctx.fillText(`Items: ${playerStats.items.length}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
        ctx.fillText('Press SPACE to Continue', GAME_WIDTH/2, GAME_HEIGHT/2 + 120);
    }
}

// ===========================================
// START ENGINE
// ===========================================

engineInit(
    gameInit,
    gameUpdate,
    gameUpdatePost,
    gameRender,
    gameRenderPost,
    ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==']
);
