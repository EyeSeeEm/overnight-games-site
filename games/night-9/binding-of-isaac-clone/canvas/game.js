// Tears of the Basement - Binding of Isaac Clone
// Top-down roguelike shooter with procedural dungeon

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 48;
const ROOM_COLS = 13;
const ROOM_ROWS = 7;
const ROOM_WIDTH = ROOM_COLS * TILE_SIZE;  // 624
const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 336
const ROOM_OFFSET_X = (canvas.width - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = 60;

// Game States
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    TRANSITIONING: 'transitioning'
};

let currentState = GameState.MENU;
let debugMode = false;
let frameCount = 0;

// Input
const keys = {};
const shootDir = { x: 0, y: 0 };
let lastShootTime = 0;

// Player
const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 32,
    height: 32,
    speed: 3.5,
    damage: 3.5,
    tearDelay: 10, // Lower = faster
    range: 350,
    shotSpeed: 8,
    maxHealth: 6, // In half hearts
    health: 6,
    soulHearts: 0,
    coins: 0,
    bombs: 3,
    keys: 2,
    luck: 0,
    invincibleTimer: 0,
    items: [],
    activeItem: null,
    activeItemCharge: 0,
    activeItemMaxCharge: 6,
    facing: 'down',
    animFrame: 0,
    tearCooldown: 0
};

// Tears (projectiles)
let tears = [];
let enemyProjectiles = [];

// Enemies
let enemies = [];

// Pickups
let pickups = [];

// Items on pedestals
let pedestals = [];

// Room system
let currentFloor = 0;
let floorData = null;
let currentRoomX = 0;
let currentRoomY = 0;
let roomsCleared = new Set();
let roomsDiscovered = new Set();
let transitionDir = null;
let transitionProgress = 0;

// Floor configurations
const floorConfigs = [
    { name: 'Basement', rooms: 10, color: '#3a2a1a', wallColor: '#5a4a3a' },
    { name: 'Caves', rooms: 12, color: '#2a2a3a', wallColor: '#4a4a5a' },
    { name: 'Depths', rooms: 14, color: '#1a1a2a', wallColor: '#3a3a4a' }
];

// Enemy types
const enemyTypes = {
    fly: {
        name: 'Fly',
        hp: 5,
        speed: 2.5,
        damage: 0.5,
        size: 16,
        behavior: 'chase',
        color: '#333'
    },
    pooter: {
        name: 'Pooter',
        hp: 8,
        speed: 1.5,
        damage: 0.5,
        size: 20,
        behavior: 'shoot',
        shootRate: 120,
        color: '#553'
    },
    gaper: {
        name: 'Gaper',
        hp: 12,
        speed: 2,
        damage: 1,
        size: 24,
        behavior: 'chase',
        color: '#a66'
    },
    mulligan: {
        name: 'Mulligan',
        hp: 20,
        speed: 1.5,
        damage: 1,
        size: 24,
        behavior: 'chase',
        spawnsOnDeath: 'fly',
        spawnCount: 3,
        color: '#866'
    },
    clotty: {
        name: 'Clotty',
        hp: 25,
        speed: 1,
        damage: 0.5,
        size: 24,
        behavior: 'shoot_pattern',
        shootRate: 90,
        color: '#833'
    },
    fatty: {
        name: 'Fatty',
        hp: 40,
        speed: 0.8,
        damage: 1,
        size: 32,
        behavior: 'chase',
        color: '#a86'
    },
    host: {
        name: 'Host',
        hp: 30,
        speed: 0,
        damage: 0.5,
        size: 24,
        behavior: 'host',
        shootRate: 60,
        color: '#666'
    }
};

// Boss types
const bossTypes = {
    monstro: {
        name: 'Monstro',
        hp: 250,
        damage: 1,
        size: 64,
        color: '#866',
        phases: ['hop', 'spit', 'jump']
    },
    duke: {
        name: 'Duke of Flies',
        hp: 200,
        damage: 1,
        size: 48,
        color: '#663',
        phases: ['spawn', 'charge']
    }
};

// Item definitions
const itemData = {
    sad_onion: { name: 'Sad Onion', effect: 'tearDelay', value: -2, desc: 'Tears up', color: '#ff0' },
    magic_mushroom: { name: 'Magic Mushroom', effect: 'all_stats', value: 1, desc: 'All stats up!', color: '#f66' },
    pentagram: { name: 'Pentagram', effect: 'damage', value: 1, desc: '+1 Damage', color: '#666' },
    speed_ball: { name: 'Speed Ball', effect: 'speed', value: 0.3, desc: 'Speed up', color: '#ff0' },
    stigmata: { name: 'Stigmata', effect: 'damage_hp', value: 0.3, desc: '+Damage, +HP', color: '#f00' },
    health_up: { name: 'Health Up', effect: 'maxHealth', value: 2, desc: '+1 Heart', color: '#f00' },
    spoon_bender: { name: 'Spoon Bender', effect: 'homing', value: true, desc: 'Homing tears', color: '#a0f' },
    cupids_arrow: { name: "Cupid's Arrow", effect: 'piercing', value: true, desc: 'Piercing tears', color: '#f8f' },
    inner_eye: { name: 'Inner Eye', effect: 'triple', value: true, desc: 'Triple shot', color: '#88f' },
    polyphemus: { name: 'Polyphemus', effect: 'polyphemus', value: true, desc: 'Mega tears', color: '#886' }
};

// Room templates (13x7 grid, 0=empty, 1=rock, 2=poop, 3=pit, 4=fire, 5=spikes)
const roomTemplates = {
    empty: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    rocks_corners: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,0,0,0,0,0,1,1,0],
        [0,1,0,0,0,0,0,0,0,0,0,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,0,0,0,0,0,0,0,0,0,1,0],
        [0,1,1,0,0,0,0,0,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    rocks_cross: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    poop_scatter: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,2,0,0,0,0,0,0,0,2,0,0],
        [0,0,0,0,0,2,0,2,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,2,0,2,0,0,0,0,0],
        [0,0,2,0,0,0,0,0,0,0,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    pit_center: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,3,3,3,0,0,0,0,0],
        [0,0,0,0,0,3,3,3,0,0,0,0,0],
        [0,0,0,0,0,3,3,3,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    fire_corners: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,4,0,0,0,0,0,0,0,0,0,4,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,4,0,0,0,0,0,0,0,0,0,4,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    mixed: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,0,0,0,0,0,0,0,0,0,1,0],
        [0,0,0,2,0,0,0,0,0,2,0,0,0],
        [0,0,0,0,0,1,0,1,0,0,0,0,0],
        [0,0,0,2,0,0,0,0,0,2,0,0,0],
        [0,1,0,0,0,0,0,0,0,0,0,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// Initialize game
function init() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    // Arrow keys for shooting
    if (e.key === 'ArrowUp') shootDir.y = -1;
    if (e.key === 'ArrowDown') shootDir.y = 1;
    if (e.key === 'ArrowLeft') shootDir.x = -1;
    if (e.key === 'ArrowRight') shootDir.x = 1;

    if (e.key.toLowerCase() === 'q' && currentState === GameState.PLAYING) {
        debugMode = !debugMode;
    }

    if (e.key === 'Escape') {
        if (currentState === GameState.PLAYING) {
            currentState = GameState.PAUSED;
        } else if (currentState === GameState.PAUSED) {
            currentState = GameState.PLAYING;
        }
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if (currentState === GameState.MENU) {
            startNewGame();
        } else if (currentState === GameState.GAME_OVER || currentState === GameState.VICTORY) {
            currentState = GameState.MENU;
        } else if (currentState === GameState.PLAYING && player.activeItem) {
            useActiveItem();
        }
    }

    // Use bomb
    if (e.key.toLowerCase() === 'e' && currentState === GameState.PLAYING) {
        placeBomb();
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;

    // Arrow keys for shooting
    if (e.key === 'ArrowUp' && shootDir.y === -1) shootDir.y = 0;
    if (e.key === 'ArrowDown' && shootDir.y === 1) shootDir.y = 0;
    if (e.key === 'ArrowLeft' && shootDir.x === -1) shootDir.x = 0;
    if (e.key === 'ArrowRight' && shootDir.x === 1) shootDir.x = 0;
}

function startNewGame() {
    // Reset player
    player.health = 6;
    player.maxHealth = 6;
    player.soulHearts = 0;
    player.coins = 0;
    player.bombs = 3;
    player.keys = 2;
    player.damage = 3.5;
    player.tearDelay = 10;
    player.range = 350;
    player.shotSpeed = 8;
    player.speed = 3.5;
    player.luck = 0;
    player.items = [];
    player.activeItem = null;

    currentFloor = 0;
    generateFloor(currentFloor);
    currentState = GameState.PLAYING;
}

function generateFloor(floorIndex) {
    const config = floorConfigs[floorIndex];

    // Create floor map (5x5 grid of rooms)
    floorData = {
        rooms: {},
        config: config,
        bossDefeated: false
    };

    // Room positions to fill
    const roomCount = config.rooms;
    const roomPositions = [];

    // Start with center room
    roomPositions.push({ x: 2, y: 2, type: 'start' });

    // Generate connected rooms
    let attempts = 0;
    while (roomPositions.length < roomCount && attempts < 100) {
        const baseRoom = roomPositions[Math.floor(Math.random() * roomPositions.length)];
        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const newX = baseRoom.x + dir.dx;
        const newY = baseRoom.y + dir.dy;

        if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
            if (!roomPositions.find(r => r.x === newX && r.y === newY)) {
                let type = 'normal';

                // Assign special room types
                if (roomPositions.length === Math.floor(roomCount / 3)) type = 'treasure';
                else if (roomPositions.length === Math.floor(roomCount / 2)) type = 'shop';
                else if (roomPositions.length === roomCount - 1) type = 'boss';

                roomPositions.push({ x: newX, y: newY, type: type });
            }
        }
        attempts++;
    }

    // Create room data
    for (const pos of roomPositions) {
        const key = `${pos.x},${pos.y}`;
        const templateKeys = Object.keys(roomTemplates);
        const template = pos.type === 'start' ? roomTemplates.empty :
                        pos.type === 'boss' ? roomTemplates.empty :
                        pos.type === 'treasure' ? roomTemplates.fire_corners :
                        roomTemplates[templateKeys[Math.floor(Math.random() * templateKeys.length)]];

        floorData.rooms[key] = {
            x: pos.x,
            y: pos.y,
            type: pos.type,
            tiles: JSON.parse(JSON.stringify(template)),
            enemies: [],
            pickups: [],
            cleared: pos.type === 'start',
            discovered: pos.type === 'start'
        };

        // Add enemies to normal rooms
        if (pos.type === 'normal') {
            const enemyCount = 2 + Math.floor(Math.random() * 4);
            const types = Object.keys(enemyTypes);
            for (let i = 0; i < enemyCount; i++) {
                const type = types[Math.floor(Math.random() * Math.min(types.length, 3 + floorIndex * 2))];
                floorData.rooms[key].enemies.push({
                    type: type,
                    x: TILE_SIZE * (2 + Math.floor(Math.random() * 9)),
                    y: TILE_SIZE * (1 + Math.floor(Math.random() * 5))
                });
            }
        }

        // Add boss to boss room
        if (pos.type === 'boss') {
            floorData.rooms[key].enemies.push({
                type: 'boss',
                bossType: floorIndex === 0 ? 'monstro' : 'duke',
                x: ROOM_WIDTH / 2,
                y: ROOM_HEIGHT / 2
            });
        }

        // Add item to treasure room
        if (pos.type === 'treasure') {
            const itemKeys = Object.keys(itemData);
            floorData.rooms[key].pedestal = {
                x: ROOM_WIDTH / 2,
                y: ROOM_HEIGHT / 2,
                item: itemKeys[Math.floor(Math.random() * itemKeys.length)]
            };
        }

        // Add shop items
        if (pos.type === 'shop') {
            const itemKeys = Object.keys(itemData);
            floorData.rooms[key].shopItems = [
                { x: ROOM_WIDTH / 2 - 80, y: ROOM_HEIGHT / 2, item: itemKeys[Math.floor(Math.random() * itemKeys.length)], price: 15 },
                { x: ROOM_WIDTH / 2 + 80, y: ROOM_HEIGHT / 2, item: itemKeys[Math.floor(Math.random() * itemKeys.length)], price: 15 }
            ];
        }
    }

    // Set starting position
    currentRoomX = 2;
    currentRoomY = 2;
    roomsCleared = new Set(['2,2']);
    roomsDiscovered = new Set(['2,2']);

    // Position player
    player.x = ROOM_WIDTH / 2;
    player.y = ROOM_HEIGHT / 2;

    // Load room
    loadRoom(currentRoomX, currentRoomY);
}

function loadRoom(rx, ry) {
    const key = `${rx},${ry}`;
    const room = floorData.rooms[key];
    if (!room) return;

    enemies = [];
    pickups = [];
    pedestals = [];
    tears = [];
    enemyProjectiles = [];

    room.discovered = true;
    roomsDiscovered.add(key);

    // Spawn enemies if not cleared
    if (!room.cleared && room.enemies.length > 0) {
        for (const enemyData of room.enemies) {
            if (enemyData.type === 'boss') {
                spawnBoss(enemyData.bossType, enemyData.x, enemyData.y);
            } else {
                spawnEnemy(enemyData.type, enemyData.x, enemyData.y);
            }
        }
    }

    // Spawn pickups
    for (const pickup of room.pickups) {
        pickups.push({ ...pickup });
    }

    // Spawn pedestal
    if (room.pedestal && !room.pedestal.taken) {
        pedestals.push({ ...room.pedestal });
    }

    // Shop items
    if (room.shopItems) {
        for (const shopItem of room.shopItems) {
            if (!shopItem.taken) {
                pedestals.push({ ...shopItem, isShop: true });
            }
        }
    }
}

function spawnEnemy(type, x, y) {
    const data = enemyTypes[type];
    if (!data) return;

    enemies.push({
        type: type,
        x: x,
        y: y,
        hp: data.hp,
        maxHp: data.hp,
        speed: data.speed,
        damage: data.damage,
        size: data.size,
        behavior: data.behavior,
        color: data.color,
        shootRate: data.shootRate || 0,
        shootTimer: data.shootRate || 0,
        spawnsOnDeath: data.spawnsOnDeath,
        spawnCount: data.spawnCount,
        state: 'spawn',
        stateTimer: 30,
        vx: 0,
        vy: 0,
        hostUp: false,
        hostTimer: 0
    });
}

function spawnBoss(type, x, y) {
    const data = bossTypes[type];
    if (!data) return;

    enemies.push({
        type: 'boss',
        bossType: type,
        x: x,
        y: y,
        hp: data.hp,
        maxHp: data.hp,
        damage: data.damage,
        size: data.size,
        color: data.color,
        phases: data.phases,
        phase: 0,
        phaseTimer: 60,
        state: 'spawn',
        stateTimer: 60,
        vx: 0,
        vy: 0,
        targetX: x,
        targetY: y
    });
}

function useActiveItem() {
    if (!player.activeItem) return;
    if (player.activeItemCharge < player.activeItemMaxCharge) return;

    // Use item effect
    player.activeItemCharge = 0;
}

function placeBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;

    // Create bomb pickup that will explode
    pickups.push({
        type: 'bomb_placed',
        x: player.x,
        y: player.y,
        timer: 90
    });
}

// Main game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    frameCount++;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (currentState === GameState.TRANSITIONING) {
        updateTransition(dt);
        return;
    }

    if (currentState !== GameState.PLAYING) return;

    updatePlayer(dt);
    updateTears(dt);
    updateEnemies(dt);
    updatePickups(dt);
    checkCollisions();
    checkRoomCleared();
    checkDoorTransitions();
}

function updatePlayer(dt) {
    // Movement (WASD)
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Note: We DON'T use arrow keys for movement - they're for shooting
    // Correct the above - arrow keys should NOT move player, only WASD
    dx = 0; dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.vx = dx * player.speed;
    player.vy = dy * player.speed;

    // Apply movement
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;

    // Collision with room boundaries
    if (newX > player.width / 2 && newX < ROOM_WIDTH - player.width / 2) {
        if (!checkTileCollision(newX, player.y, player.width / 2)) {
            player.x = newX;
        }
    }
    if (newY > player.height / 2 && newY < ROOM_HEIGHT - player.height / 2) {
        if (!checkTileCollision(player.x, newY, player.height / 2)) {
            player.y = newY;
        }
    }

    // Facing direction
    if (dx > 0) player.facing = 'right';
    else if (dx < 0) player.facing = 'left';
    else if (dy > 0) player.facing = 'down';
    else if (dy < 0) player.facing = 'up';

    // Animation
    if (dx !== 0 || dy !== 0) {
        player.animFrame = (player.animFrame + 0.2) % 4;
    }

    // Shooting (arrow keys)
    player.tearCooldown--;
    if ((shootDir.x !== 0 || shootDir.y !== 0) && player.tearCooldown <= 0) {
        fireTear(shootDir.x, shootDir.y);
        player.tearCooldown = player.tearDelay;
    }

    // Invincibility
    if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
    }
}

function checkTileCollision(x, y, radius) {
    const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
    if (!room) return false;

    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = tileX + dx;
            const ty = tileY + dy;
            if (tx >= 0 && tx < ROOM_COLS && ty >= 0 && ty < ROOM_ROWS) {
                const tile = room.tiles[ty][tx];
                if (tile === 1 || tile === 2) { // Rock or poop
                    const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
                    const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;
                    const dist = Math.sqrt((x - tileCenterX) ** 2 + (y - tileCenterY) ** 2);
                    if (dist < radius + TILE_SIZE / 2 - 5) {
                        return true;
                    }
                }
                if (tile === 3) { // Pit
                    const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
                    const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;
                    if (Math.abs(x - tileCenterX) < TILE_SIZE / 2 - 5 &&
                        Math.abs(y - tileCenterY) < TILE_SIZE / 2 - 5) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function fireTear(dirX, dirY) {
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len === 0) return;

    const hasTriple = player.items.includes('inner_eye');
    const hasPolyphemus = player.items.includes('polyphemus');

    const angles = hasTriple ? [-0.2, 0, 0.2] : [0];

    for (const angleOffset of angles) {
        const baseAngle = Math.atan2(dirY, dirX);
        const angle = baseAngle + angleOffset;

        tears.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * player.shotSpeed,
            vy: Math.sin(angle) * player.shotSpeed,
            damage: player.damage * (hasPolyphemus ? 4 : 1),
            range: player.range,
            traveled: 0,
            size: hasPolyphemus ? 16 : 8,
            homing: player.items.includes('spoon_bender'),
            piercing: player.items.includes('cupids_arrow'),
            color: '#6af'
        });
    }
}

function updateTears(dt) {
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];

        // Homing
        if (tear.homing && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            for (const e of enemies) {
                const dist = Math.sqrt((e.x - tear.x) ** 2 + (e.y - tear.y) ** 2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = e;
                }
            }
            if (closest && closestDist < 150) {
                const angle = Math.atan2(closest.y - tear.y, closest.x - tear.x);
                tear.vx += Math.cos(angle) * 0.3;
                tear.vy += Math.sin(angle) * 0.3;
                const speed = Math.sqrt(tear.vx ** 2 + tear.vy ** 2);
                tear.vx = (tear.vx / speed) * player.shotSpeed;
                tear.vy = (tear.vy / speed) * player.shotSpeed;
            }
        }

        // Gravity effect (slight arc)
        tear.vy += 0.05;

        tear.x += tear.vx;
        tear.y += tear.vy;
        tear.traveled += Math.sqrt(tear.vx ** 2 + tear.vy ** 2);

        // Check range
        if (tear.traveled > tear.range) {
            // Splash effect
            tears.splice(i, 1);
            continue;
        }

        // Check wall collision
        if (tear.x < 0 || tear.x > ROOM_WIDTH || tear.y < 0 || tear.y > ROOM_HEIGHT) {
            tears.splice(i, 1);
            continue;
        }

        // Check tile collision
        const tileX = Math.floor(tear.x / TILE_SIZE);
        const tileY = Math.floor(tear.y / TILE_SIZE);
        const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
        if (room && tileX >= 0 && tileX < ROOM_COLS && tileY >= 0 && tileY < ROOM_ROWS) {
            const tile = room.tiles[tileY][tileX];
            if (tile === 1) { // Rock - tear dies
                tears.splice(i, 1);
                continue;
            }
            if (tile === 2) { // Poop - can destroy
                room.tiles[tileY][tileX] = 0;
                tears.splice(i, 1);
                // Maybe drop something
                if (Math.random() < 0.2) {
                    pickups.push({
                        type: Math.random() < 0.5 ? 'coin' : 'heart_half',
                        x: tileX * TILE_SIZE + TILE_SIZE / 2,
                        y: tileY * TILE_SIZE + TILE_SIZE / 2
                    });
                }
                continue;
            }
        }

        // Check enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.state === 'spawn') continue; // Invulnerable during spawn

            const dist = Math.sqrt((e.x - tear.x) ** 2 + (e.y - tear.y) ** 2);
            if (dist < e.size + tear.size) {
                e.hp -= tear.damage;

                // Knockback
                const kb = 5;
                const angle = Math.atan2(e.y - tear.y, e.x - tear.x);
                e.x += Math.cos(angle) * kb;
                e.y += Math.sin(angle) * kb;

                if (!tear.piercing) {
                    tears.splice(i, 1);
                }

                // Check if enemy dead
                if (e.hp <= 0) {
                    // Spawn on death
                    if (e.spawnsOnDeath) {
                        for (let k = 0; k < e.spawnCount; k++) {
                            spawnEnemy(e.spawnsOnDeath, e.x + (Math.random() - 0.5) * 30, e.y + (Math.random() - 0.5) * 30);
                        }
                    }

                    // Drop chance
                    if (Math.random() < 0.25) {
                        const drops = ['coin', 'heart_half', 'bomb', 'key'];
                        pickups.push({
                            type: drops[Math.floor(Math.random() * drops.length)],
                            x: e.x,
                            y: e.y
                        });
                    }

                    // Charge active item
                    if (player.activeItem) {
                        player.activeItemCharge = Math.min(player.activeItemMaxCharge, player.activeItemCharge + 1);
                    }

                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy projectiles
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = enemyProjectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.traveled += Math.sqrt(proj.vx ** 2 + proj.vy ** 2);

        if (proj.traveled > 400 || proj.x < 0 || proj.x > ROOM_WIDTH || proj.y < 0 || proj.y > ROOM_HEIGHT) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Hit player
        const dist = Math.sqrt((player.x - proj.x) ** 2 + (player.y - proj.y) ** 2);
        if (dist < player.width / 2 + proj.size) {
            damagePlayer(proj.damage);
            enemyProjectiles.splice(i, 1);
        }
    }
}

function updateEnemies(dt) {
    for (const e of enemies) {
        // Spawn state
        if (e.state === 'spawn') {
            e.stateTimer--;
            if (e.stateTimer <= 0) {
                e.state = 'active';
            }
            continue;
        }

        // Boss AI
        if (e.type === 'boss') {
            updateBossAI(e);
            continue;
        }

        // Regular enemy AI
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (e.behavior) {
            case 'chase':
                if (dist > 10) {
                    e.vx = (dx / dist) * e.speed;
                    e.vy = (dy / dist) * e.speed;
                }
                break;

            case 'shoot':
                // Move randomly, shoot at player
                if (Math.random() < 0.02) {
                    e.vx = (Math.random() - 0.5) * e.speed;
                    e.vy = (Math.random() - 0.5) * e.speed;
                }
                e.shootTimer--;
                if (e.shootTimer <= 0 && dist < 300) {
                    enemyProjectiles.push({
                        x: e.x,
                        y: e.y,
                        vx: (dx / dist) * 4,
                        vy: (dy / dist) * 4,
                        damage: e.damage,
                        size: 6,
                        traveled: 0,
                        color: '#a66'
                    });
                    e.shootTimer = e.shootRate;
                }
                break;

            case 'shoot_pattern':
                // Clotty - shoots 4-way
                e.shootTimer--;
                if (e.shootTimer <= 0) {
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
                        enemyProjectiles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * 3,
                            vy: Math.sin(angle) * 3,
                            damage: e.damage,
                            size: 6,
                            traveled: 0,
                            color: '#833'
                        });
                    }
                    e.shootTimer = e.shootRate;
                }
                break;

            case 'host':
                // Pops up to shoot, invincible when down
                e.hostTimer--;
                if (e.hostTimer <= 0) {
                    e.hostUp = !e.hostUp;
                    e.hostTimer = e.hostUp ? 60 : 90;

                    if (e.hostUp && dist < 250) {
                        enemyProjectiles.push({
                            x: e.x,
                            y: e.y,
                            vx: (dx / dist) * 5,
                            vy: (dy / dist) * 5,
                            damage: e.damage,
                            size: 8,
                            traveled: 0,
                            color: '#666'
                        });
                    }
                }
                break;
        }

        // Apply velocity
        const newX = e.x + e.vx;
        const newY = e.y + e.vy;

        // Boundary collision
        if (newX > e.size && newX < ROOM_WIDTH - e.size) {
            if (!checkTileCollision(newX, e.y, e.size)) {
                e.x = newX;
            } else {
                e.vx = -e.vx;
            }
        } else {
            e.vx = -e.vx;
        }
        if (newY > e.size && newY < ROOM_HEIGHT - e.size) {
            if (!checkTileCollision(e.x, newY, e.size)) {
                e.y = newY;
            } else {
                e.vy = -e.vy;
            }
        } else {
            e.vy = -e.vy;
        }

        // Friction
        e.vx *= 0.95;
        e.vy *= 0.95;
    }
}

function updateBossAI(boss) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    boss.phaseTimer--;

    if (boss.bossType === 'monstro') {
        switch (boss.phases[boss.phase]) {
            case 'hop':
                // Hop toward player
                if (boss.phaseTimer > 30) {
                    boss.vx = (dx / dist) * 2;
                    boss.vy = (dy / dist) * 2;
                } else if (boss.phaseTimer <= 0) {
                    boss.phase = (boss.phase + 1) % boss.phases.length;
                    boss.phaseTimer = 90;
                }
                break;

            case 'spit':
                // Spit tears in arc
                if (boss.phaseTimer === 45) {
                    const baseAngle = Math.atan2(dy, dx);
                    for (let i = -3; i <= 3; i++) {
                        enemyProjectiles.push({
                            x: boss.x,
                            y: boss.y,
                            vx: Math.cos(baseAngle + i * 0.2) * 5,
                            vy: Math.sin(baseAngle + i * 0.2) * 5,
                            damage: boss.damage,
                            size: 10,
                            traveled: 0,
                            color: '#a66'
                        });
                    }
                }
                if (boss.phaseTimer <= 0) {
                    boss.phase = (boss.phase + 1) % boss.phases.length;
                    boss.phaseTimer = 120;
                }
                break;

            case 'jump':
                // Jump to player position
                if (boss.phaseTimer === 100) {
                    boss.targetX = player.x;
                    boss.targetY = player.y;
                }
                if (boss.phaseTimer > 60) {
                    // Rising
                    boss.y -= 3;
                } else if (boss.phaseTimer > 30) {
                    // Move to target
                    boss.x += (boss.targetX - boss.x) * 0.1;
                } else {
                    // Landing
                    boss.y += 3;
                    if (boss.phaseTimer === 15) {
                        // Splash damage ring
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                            enemyProjectiles.push({
                                x: boss.x,
                                y: boss.y,
                                vx: Math.cos(angle) * 4,
                                vy: Math.sin(angle) * 4,
                                damage: boss.damage * 0.5,
                                size: 8,
                                traveled: 0,
                                color: '#a66'
                            });
                        }
                    }
                }
                if (boss.phaseTimer <= 0) {
                    boss.phase = (boss.phase + 1) % boss.phases.length;
                    boss.phaseTimer = 90;
                }
                break;
        }
    } else if (boss.bossType === 'duke') {
        switch (boss.phases[boss.phase]) {
            case 'spawn':
                // Spawn flies
                if (boss.phaseTimer === 30) {
                    for (let i = 0; i < 3; i++) {
                        spawnEnemy('fly', boss.x + (Math.random() - 0.5) * 50, boss.y + (Math.random() - 0.5) * 50);
                    }
                }
                if (boss.phaseTimer <= 0) {
                    boss.phase = (boss.phase + 1) % boss.phases.length;
                    boss.phaseTimer = 120;
                }
                break;

            case 'charge':
                // Charge at player
                if (boss.phaseTimer > 60) {
                    // Prepare
                } else {
                    boss.vx = (dx / dist) * 5;
                    boss.vy = (dy / dist) * 5;
                }
                if (boss.phaseTimer <= 0) {
                    boss.vx = 0;
                    boss.vy = 0;
                    boss.phase = (boss.phase + 1) % boss.phases.length;
                    boss.phaseTimer = 90;
                }
                break;
        }
    }

    // Apply velocity
    boss.x += boss.vx;
    boss.y += boss.vy;

    // Keep in bounds
    boss.x = Math.max(boss.size, Math.min(ROOM_WIDTH - boss.size, boss.x));
    boss.y = Math.max(boss.size, Math.min(ROOM_HEIGHT - boss.size, boss.y));

    // Friction
    boss.vx *= 0.98;
    boss.vy *= 0.98;
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];

        // Bomb timer
        if (p.type === 'bomb_placed') {
            p.timer--;
            if (p.timer <= 0) {
                // Explode
                explodeBomb(p.x, p.y);
                pickups.splice(i, 1);
            }
        }
    }
}

function explodeBomb(x, y) {
    const radius = TILE_SIZE * 2;

    // Damage enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dist = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
        if (dist < radius) {
            e.hp -= 60;
            if (e.hp <= 0) {
                enemies.splice(i, 1);
            }
        }
    }

    // Destroy obstacles
    const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
    if (room) {
        for (let ty = 0; ty < ROOM_ROWS; ty++) {
            for (let tx = 0; tx < ROOM_COLS; tx++) {
                const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
                const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;
                const dist = Math.sqrt((tileCenterX - x) ** 2 + (tileCenterY - y) ** 2);
                if (dist < radius) {
                    if (room.tiles[ty][tx] === 1 || room.tiles[ty][tx] === 2) {
                        room.tiles[ty][tx] = 0;
                    }
                }
            }
        }
    }

    // Damage player if close
    const pDist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
    if (pDist < radius * 0.7) {
        damagePlayer(1);
    }
}

function checkCollisions() {
    // Player-enemy collision
    for (const e of enemies) {
        if (e.state === 'spawn') continue;
        if (e.behavior === 'host' && !e.hostUp) continue; // Host invincible when down

        const dist = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
        if (dist < player.width / 2 + e.size) {
            damagePlayer(e.damage);
        }
    }

    // Player-pickup collision
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (p.type === 'bomb_placed') continue;

        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
        if (dist < player.width / 2 + 16) {
            collectPickup(p);
            pickups.splice(i, 1);
        }
    }

    // Player-pedestal collision
    for (let i = pedestals.length - 1; i >= 0; i--) {
        const ped = pedestals[i];
        const dist = Math.sqrt((player.x - ped.x) ** 2 + (player.y - ped.y) ** 2);
        if (dist < 40) {
            if (ped.isShop) {
                if (player.coins >= ped.price) {
                    player.coins -= ped.price;
                    collectItem(ped.item);
                    // Mark as taken in room data
                    const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
                    if (room && room.shopItems) {
                        const shopItem = room.shopItems.find(s => s.x === ped.x && s.y === ped.y);
                        if (shopItem) shopItem.taken = true;
                    }
                    pedestals.splice(i, 1);
                }
            } else {
                collectItem(ped.item);
                // Mark as taken in room data
                const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
                if (room && room.pedestal) {
                    room.pedestal.taken = true;
                }
                pedestals.splice(i, 1);
            }
        }
    }

    // Fire damage
    const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
    if (room) {
        const tileX = Math.floor(player.x / TILE_SIZE);
        const tileY = Math.floor(player.y / TILE_SIZE);
        if (tileX >= 0 && tileX < ROOM_COLS && tileY >= 0 && tileY < ROOM_ROWS) {
            if (room.tiles[tileY][tileX] === 4 || room.tiles[tileY][tileX] === 5) {
                damagePlayer(0.5);
            }
        }
    }
}

function collectPickup(pickup) {
    switch (pickup.type) {
        case 'heart':
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 2);
            }
            break;
        case 'heart_half':
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 1);
            }
            break;
        case 'soul_heart':
            player.soulHearts += 2;
            break;
        case 'coin':
            player.coins++;
            break;
        case 'nickel':
            player.coins += 5;
            break;
        case 'bomb':
            player.bombs++;
            break;
        case 'key':
            player.keys++;
            break;
    }
}

function collectItem(itemId) {
    const item = itemData[itemId];
    if (!item) return;

    player.items.push(itemId);

    // Apply item effect
    switch (item.effect) {
        case 'tearDelay':
            player.tearDelay = Math.max(1, player.tearDelay + item.value);
            break;
        case 'damage':
            player.damage += item.value;
            break;
        case 'speed':
            player.speed += item.value;
            break;
        case 'maxHealth':
            player.maxHealth += item.value;
            player.health += item.value;
            break;
        case 'damage_hp':
            player.damage += item.value;
            player.maxHealth += 2;
            player.health += 2;
            break;
        case 'all_stats':
            player.damage += 0.3;
            player.speed += 0.3;
            player.maxHealth += 2;
            player.health += 2;
            break;
        // Boolean effects are checked in tear firing
    }
}

function damagePlayer(amount) {
    if (player.invincibleTimer > 0) return;

    // First deplete soul hearts
    if (player.soulHearts > 0) {
        player.soulHearts -= amount * 2;
        if (player.soulHearts < 0) {
            amount = -player.soulHearts / 2;
            player.soulHearts = 0;
        } else {
            amount = 0;
        }
    }

    player.health -= amount * 2; // Convert to half-hearts
    player.invincibleTimer = 60;

    if (player.health <= 0) {
        currentState = GameState.GAME_OVER;
    }
}

function checkRoomCleared() {
    const key = `${currentRoomX},${currentRoomY}`;
    const room = floorData.rooms[key];
    if (!room || room.cleared) return;

    if (enemies.length === 0) {
        room.cleared = true;
        roomsCleared.add(key);

        // Boss defeated - show trapdoor or victory
        if (room.type === 'boss') {
            floorData.bossDefeated = true;

            // Drop item
            const itemKeys = Object.keys(itemData);
            pedestals.push({
                x: ROOM_WIDTH / 2,
                y: ROOM_HEIGHT / 2 + 40,
                item: itemKeys[Math.floor(Math.random() * itemKeys.length)]
            });

            // Next floor or victory
            if (currentFloor >= 2) {
                currentState = GameState.VICTORY;
            }
        }

        // Random pickup chance
        if (Math.random() < 0.3) {
            const drops = ['coin', 'heart_half', 'bomb', 'key'];
            pickups.push({
                type: drops[Math.floor(Math.random() * drops.length)],
                x: ROOM_WIDTH / 2 + (Math.random() - 0.5) * 100,
                y: ROOM_HEIGHT / 2 + (Math.random() - 0.5) * 100
            });
        }
    }
}

function checkDoorTransitions() {
    const key = `${currentRoomX},${currentRoomY}`;
    const room = floorData.rooms[key];
    if (!room || !room.cleared) return;

    // Check all four doors
    const doors = [
        { x: ROOM_WIDTH / 2, y: -20, dir: 'up', dx: 0, dy: -1 },
        { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT + 20, dir: 'down', dx: 0, dy: 1 },
        { x: -20, y: ROOM_HEIGHT / 2, dir: 'left', dx: -1, dy: 0 },
        { x: ROOM_WIDTH + 20, y: ROOM_HEIGHT / 2, dir: 'right', dx: 1, dy: 0 }
    ];

    for (const door of doors) {
        const targetKey = `${currentRoomX + door.dx},${currentRoomY + door.dy}`;
        if (!floorData.rooms[targetKey]) continue;

        // Check if player is at door
        let atDoor = false;
        switch (door.dir) {
            case 'up':
                atDoor = player.y < 30 && Math.abs(player.x - ROOM_WIDTH / 2) < 50;
                break;
            case 'down':
                atDoor = player.y > ROOM_HEIGHT - 30 && Math.abs(player.x - ROOM_WIDTH / 2) < 50;
                break;
            case 'left':
                atDoor = player.x < 30 && Math.abs(player.y - ROOM_HEIGHT / 2) < 50;
                break;
            case 'right':
                atDoor = player.x > ROOM_WIDTH - 30 && Math.abs(player.y - ROOM_HEIGHT / 2) < 50;
                break;
        }

        if (atDoor) {
            // Check if treasure room needs key
            const targetRoom = floorData.rooms[targetKey];
            if (targetRoom.type === 'treasure' && !targetRoom.unlocked) {
                if (player.keys > 0) {
                    player.keys--;
                    targetRoom.unlocked = true;
                } else {
                    return; // Can't enter without key
                }
            }

            transitionDir = door.dir;
            transitionProgress = 0;
            currentState = GameState.TRANSITIONING;
            return;
        }
    }

    // Check for trapdoor (after boss)
    if (floorData.bossDefeated && room.type === 'boss') {
        const dist = Math.sqrt((player.x - ROOM_WIDTH / 2) ** 2 + (player.y - ROOM_HEIGHT / 2 - 60) ** 2);
        if (dist < 30) {
            if (currentFloor < 2) {
                currentFloor++;
                generateFloor(currentFloor);
            }
        }
    }
}

function updateTransition(dt) {
    transitionProgress += 0.05;

    if (transitionProgress >= 1) {
        // Complete transition
        switch (transitionDir) {
            case 'up':
                currentRoomY--;
                player.y = ROOM_HEIGHT - 50;
                break;
            case 'down':
                currentRoomY++;
                player.y = 50;
                break;
            case 'left':
                currentRoomX--;
                player.x = ROOM_WIDTH - 50;
                break;
            case 'right':
                currentRoomX++;
                player.x = 50;
                break;
        }

        loadRoom(currentRoomX, currentRoomY);
        transitionDir = null;
        currentState = GameState.PLAYING;

        // Brief movement pause
        player.vx = 0;
        player.vy = 0;
    }
}

// Rendering
function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentState === GameState.MENU) {
        renderMenu();
        return;
    }

    if (currentState === GameState.PAUSED) {
        renderGame();
        renderPause();
        return;
    }

    if (currentState === GameState.GAME_OVER) {
        renderGameOver();
        return;
    }

    if (currentState === GameState.VICTORY) {
        renderVictory();
        return;
    }

    renderGame();
}

function renderGame() {
    const config = floorData.config;

    // Room background
    ctx.save();
    ctx.translate(ROOM_OFFSET_X, ROOM_OFFSET_Y);

    // Floor
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    // Floor pattern
    for (let y = 0; y < ROOM_ROWS; y++) {
        for (let x = 0; x < ROOM_COLS; x++) {
            const shade = (x + y) % 2 === 0 ? 10 : -10;
            ctx.fillStyle = `rgba(255, 255, 255, ${shade > 0 ? 0.02 : 0})`;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Room tiles
    const room = floorData.rooms[`${currentRoomX},${currentRoomY}`];
    if (room) {
        renderTiles(room);
    }

    // Doors
    renderDoors();

    // Trapdoor
    if (floorData.bossDefeated && room && room.type === 'boss') {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 60, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#640';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Pedestals
    renderPedestals();

    // Pickups
    renderPickups();

    // Enemies
    renderEnemies();

    // Enemy projectiles
    renderEnemyProjectiles();

    // Player
    renderPlayer();

    // Tears
    renderTears();

    ctx.restore();

    // Walls frame
    ctx.fillStyle = config.wallColor;
    // Top wall
    ctx.fillRect(ROOM_OFFSET_X - 20, ROOM_OFFSET_Y - 20, ROOM_WIDTH + 40, 20);
    // Bottom wall
    ctx.fillRect(ROOM_OFFSET_X - 20, ROOM_OFFSET_Y + ROOM_HEIGHT, ROOM_WIDTH + 40, 20);
    // Left wall
    ctx.fillRect(ROOM_OFFSET_X - 20, ROOM_OFFSET_Y, 20, ROOM_HEIGHT);
    // Right wall
    ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH, ROOM_OFFSET_Y, 20, ROOM_HEIGHT);

    // HUD
    renderHUD();

    // Minimap
    renderMinimap();

    // Debug
    if (debugMode) {
        renderDebug();
    }
}

function renderTiles(room) {
    for (let y = 0; y < ROOM_ROWS; y++) {
        for (let x = 0; x < ROOM_COLS; x++) {
            const tile = room.tiles[y][x];
            const tx = x * TILE_SIZE;
            const ty = y * TILE_SIZE;

            switch (tile) {
                case 1: // Rock
                    ctx.fillStyle = '#666';
                    ctx.beginPath();
                    ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#555';
                    ctx.beginPath();
                    ctx.arc(tx + TILE_SIZE / 2 - 5, ty + TILE_SIZE / 2 - 5, TILE_SIZE / 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 2: // Poop
                    ctx.fillStyle = '#654';
                    ctx.beginPath();
                    ctx.moveTo(tx + TILE_SIZE / 2, ty + 5);
                    ctx.bezierCurveTo(tx + TILE_SIZE - 5, ty + 10, tx + TILE_SIZE - 5, ty + TILE_SIZE - 5,
                                     tx + TILE_SIZE / 2, ty + TILE_SIZE - 5);
                    ctx.bezierCurveTo(tx + 5, ty + TILE_SIZE - 5, tx + 5, ty + 10,
                                     tx + TILE_SIZE / 2, ty + 5);
                    ctx.fill();
                    // Face
                    ctx.fillStyle = '#432';
                    ctx.fillRect(tx + 14, ty + 18, 4, 4);
                    ctx.fillRect(tx + 28, ty + 18, 4, 4);
                    ctx.fillRect(tx + 18, ty + 28, 10, 3);
                    break;

                case 3: // Pit
                    ctx.fillStyle = '#000';
                    ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    break;

                case 4: // Fire
                    // Fire glow
                    ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, TILE_SIZE / 2 + 5, 0, Math.PI * 2);
                    ctx.fill();
                    // Fire base
                    ctx.fillStyle = '#f60';
                    for (let i = 0; i < 3; i++) {
                        const offset = Math.sin(frameCount * 0.2 + i) * 5;
                        ctx.beginPath();
                        ctx.moveTo(tx + 10 + i * 10, ty + TILE_SIZE - 5);
                        ctx.lineTo(tx + 15 + i * 10, ty + 10 + offset);
                        ctx.lineTo(tx + 20 + i * 10, ty + TILE_SIZE - 5);
                        ctx.fill();
                    }
                    break;

                case 5: // Spikes
                    ctx.fillStyle = '#888';
                    for (let i = 0; i < 4; i++) {
                        for (let j = 0; j < 4; j++) {
                            ctx.beginPath();
                            ctx.moveTo(tx + 6 + i * 10, ty + TILE_SIZE - 5);
                            ctx.lineTo(tx + 11 + i * 10, ty + 5 + j * 3);
                            ctx.lineTo(tx + 16 + i * 10, ty + TILE_SIZE - 5);
                            ctx.fill();
                        }
                    }
                    break;
            }
        }
    }
}

function renderDoors() {
    const key = `${currentRoomX},${currentRoomY}`;
    const room = floorData.rooms[key];
    if (!room) return;

    const isCleared = room.cleared;

    // Check adjacent rooms
    const dirs = [
        { dx: 0, dy: -1, x: ROOM_WIDTH / 2 - 30, y: -5, w: 60, h: 10, label: 'up' },
        { dx: 0, dy: 1, x: ROOM_WIDTH / 2 - 30, y: ROOM_HEIGHT - 5, w: 60, h: 10, label: 'down' },
        { dx: -1, dy: 0, x: -5, y: ROOM_HEIGHT / 2 - 30, w: 10, h: 60, label: 'left' },
        { dx: 1, dy: 0, x: ROOM_WIDTH - 5, y: ROOM_HEIGHT / 2 - 30, w: 10, h: 60, label: 'right' }
    ];

    for (const dir of dirs) {
        const adjKey = `${currentRoomX + dir.dx},${currentRoomY + dir.dy}`;
        const adjRoom = floorData.rooms[adjKey];
        if (!adjRoom) continue;

        // Door frame
        ctx.fillStyle = '#542';
        ctx.fillRect(dir.x - 5, dir.y - 5, dir.w + 10, dir.h + 10);

        // Door color based on room type and state
        if (!isCleared) {
            ctx.fillStyle = '#321'; // Locked (enemies)
        } else if (adjRoom.type === 'treasure' && !adjRoom.unlocked) {
            ctx.fillStyle = '#fc0'; // Gold (needs key)
        } else if (adjRoom.type === 'boss') {
            ctx.fillStyle = '#a33'; // Red (boss)
        } else if (adjRoom.type === 'shop') {
            ctx.fillStyle = '#3aa'; // Cyan (shop)
        } else {
            ctx.fillStyle = '#654'; // Normal open
            // Draw opening
            ctx.fillStyle = '#000';
        }

        ctx.fillRect(dir.x, dir.y, dir.w, dir.h);
    }
}

function renderPedestals() {
    for (const ped of pedestals) {
        // Pedestal glow
        ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
        ctx.beginPath();
        ctx.arc(ped.x, ped.y, 40, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal base
        ctx.fillStyle = '#654';
        ctx.fillRect(ped.x - 20, ped.y + 10, 40, 15);
        ctx.fillStyle = '#543';
        ctx.fillRect(ped.x - 15, ped.y - 5, 30, 20);

        // Item
        const item = itemData[ped.item];
        if (item) {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(ped.x, ped.y - 15, 15, 0, Math.PI * 2);
            ctx.fill();

            // Bobbing animation
            const bob = Math.sin(frameCount * 0.1) * 3;
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, ped.x, ped.y - 35 + bob);

            // Price for shop
            if (ped.isShop) {
                ctx.fillStyle = '#fc0';
                ctx.fillText(`${ped.price}c`, ped.x, ped.y + 35);
            }
        }
    }
}

function renderPickups() {
    for (const p of pickups) {
        switch (p.type) {
            case 'heart':
                ctx.fillStyle = '#f44';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + 5);
                ctx.bezierCurveTo(p.x - 10, p.y - 5, p.x - 10, p.y - 15, p.x, p.y - 10);
                ctx.bezierCurveTo(p.x + 10, p.y - 15, p.x + 10, p.y - 5, p.x, p.y + 5);
                ctx.fill();
                break;

            case 'heart_half':
                ctx.fillStyle = '#f44';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + 3);
                ctx.bezierCurveTo(p.x - 6, p.y - 3, p.x - 6, p.y - 10, p.x, p.y - 6);
                ctx.bezierCurveTo(p.x + 6, p.y - 10, p.x + 6, p.y - 3, p.x, p.y + 3);
                ctx.fill();
                break;

            case 'soul_heart':
                ctx.fillStyle = '#48f';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + 5);
                ctx.bezierCurveTo(p.x - 10, p.y - 5, p.x - 10, p.y - 15, p.x, p.y - 10);
                ctx.bezierCurveTo(p.x + 10, p.y - 15, p.x + 10, p.y - 5, p.x, p.y + 5);
                ctx.fill();
                break;

            case 'coin':
                ctx.fillStyle = '#fc0';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#a80';
                ctx.fillRect(p.x - 2, p.y - 4, 4, 8);
                break;

            case 'bomb':
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(p.x, p.y + 3, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#654';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - 7);
                ctx.lineTo(p.x + 5, p.y - 12);
                ctx.stroke();
                ctx.fillStyle = '#f80';
                ctx.beginPath();
                ctx.arc(p.x + 5, p.y - 14, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'key':
                ctx.fillStyle = '#fc0';
                ctx.fillRect(p.x - 3, p.y - 10, 6, 12);
                ctx.beginPath();
                ctx.arc(p.x, p.y - 10, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(p.x - 5, p.y + 2, 10, 4);
                ctx.fillRect(p.x - 5, p.y + 8, 7, 4);
                break;

            case 'bomb_placed':
                // Placed bomb with timer
                const flash = p.timer < 30 && Math.floor(p.timer / 5) % 2 === 0;
                ctx.fillStyle = flash ? '#f44' : '#333';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#654';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - 15);
                ctx.lineTo(p.x + 8, p.y - 22);
                ctx.stroke();
                // Spark
                if (p.timer > 30) {
                    ctx.fillStyle = '#f80';
                    ctx.beginPath();
                    ctx.arc(p.x + 8, p.y - 24, 4 + Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
}

function renderEnemies() {
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Spawn animation
        if (e.state === 'spawn') {
            ctx.globalAlpha = 1 - e.stateTimer / 30;
            ctx.scale(0.5 + (1 - e.stateTimer / 30) * 0.5, 0.5 + (1 - e.stateTimer / 30) * 0.5);
        }

        if (e.type === 'boss') {
            // Boss rendering
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(0, 0, e.size, 0, Math.PI * 2);
            ctx.fill();

            // Boss face
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-e.size / 3, -e.size / 4, e.size / 5, 0, Math.PI * 2);
            ctx.arc(e.size / 3, -e.size / 4, e.size / 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-e.size / 3, -e.size / 4, e.size / 10, 0, Math.PI * 2);
            ctx.arc(e.size / 3, -e.size / 4, e.size / 10, 0, Math.PI * 2);
            ctx.fill();

            // Mouth
            ctx.fillStyle = '#400';
            ctx.beginPath();
            ctx.arc(0, e.size / 4, e.size / 2, 0, Math.PI);
            ctx.fill();
        } else {
            // Regular enemy
            ctx.fillStyle = e.color;

            if (e.behavior === 'host' && !e.hostUp) {
                // Host down
                ctx.beginPath();
                ctx.arc(0, 5, e.size * 0.8, 0, Math.PI);
                ctx.fill();
            } else {
                // Normal body
                ctx.beginPath();
                ctx.arc(0, 0, e.size, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(-e.size / 3, -e.size / 4, e.size / 4, 0, Math.PI * 2);
                ctx.arc(e.size / 3, -e.size / 4, e.size / 4, 0, Math.PI * 2);
                ctx.fill();

                // Pupils looking at player
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const angle = Math.atan2(dy, dx);
                const pupilOffset = e.size / 8;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-e.size / 3 + Math.cos(angle) * pupilOffset, -e.size / 4 + Math.sin(angle) * pupilOffset, e.size / 8, 0, Math.PI * 2);
                ctx.arc(e.size / 3 + Math.cos(angle) * pupilOffset, -e.size / 4 + Math.sin(angle) * pupilOffset, e.size / 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        // Health bar for bosses
        if (e.type === 'boss' && e.hp < e.maxHp) {
            const barWidth = 200;
            const barX = ROOM_WIDTH / 2 - barWidth / 2;
            const barY = ROOM_HEIGHT - 20;
            ctx.fillStyle = '#400';
            ctx.fillRect(barX, barY, barWidth, 10);
            ctx.fillStyle = '#f00';
            ctx.fillRect(barX, barY, barWidth * (e.hp / e.maxHp), 10);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(bossTypes[e.bossType].name, ROOM_WIDTH / 2, barY - 5);
        }
    }
}

function renderEnemyProjectiles() {
    for (const proj of enemyProjectiles) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Flash when invincible
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Body (nude baby)
    ctx.fillStyle = '#fdb';
    ctx.beginPath();
    ctx.ellipse(0, 5, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -8, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, -10, 6, 0, Math.PI * 2);
    ctx.arc(6, -10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupils - look in shooting direction or movement
    const lookX = shootDir.x !== 0 ? shootDir.x : player.vx;
    const lookY = shootDir.y !== 0 ? shootDir.y : player.vy;
    const lookLen = Math.sqrt(lookX * lookX + lookY * lookY);
    const pupilOffsetX = lookLen > 0 ? (lookX / lookLen) * 2 : 0;
    const pupilOffsetY = lookLen > 0 ? (lookY / lookLen) * 2 : 0;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6 + pupilOffsetX, -10 + pupilOffsetY, 3, 0, Math.PI * 2);
    ctx.arc(6 + pupilOffsetX, -10 + pupilOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (sad/crying)
    ctx.strokeStyle = '#a86';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Tears streaming (when shooting)
    if (shootDir.x !== 0 || shootDir.y !== 0) {
        ctx.fillStyle = '#6af';
        ctx.beginPath();
        ctx.ellipse(-8, -5, 2, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(8, -5, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Item cosmetics
    for (const itemId of player.items) {
        if (itemId === 'spoon_bender') {
            // Purple headband
            ctx.fillStyle = '#a0f';
            ctx.fillRect(-18, -18, 36, 4);
        }
        if (itemId === 'polyphemus') {
            // One big eye
            ctx.fillStyle = '#fdb';
            ctx.fillRect(-12, -16, 24, 12);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, -10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(pupilOffsetX, -10 + pupilOffsetY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function renderTears() {
    for (const tear of tears) {
        ctx.fillStyle = tear.color;
        ctx.beginPath();
        ctx.arc(tear.x, tear.y, tear.size, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(tear.x - tear.size / 3, tear.y - tear.size / 3, tear.size / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderHUD() {
    // Hearts
    const heartsY = 15;
    const heartsX = 50;

    for (let i = 0; i < Math.ceil(player.maxHealth / 2); i++) {
        const x = heartsX + i * 28;

        // Heart container
        ctx.fillStyle = '#400';
        ctx.beginPath();
        ctx.moveTo(x, heartsY + 8);
        ctx.bezierCurveTo(x - 12, heartsY - 4, x - 12, heartsY - 14, x, heartsY - 8);
        ctx.bezierCurveTo(x + 12, heartsY - 14, x + 12, heartsY - 4, x, heartsY + 8);
        ctx.fill();

        // Fill based on health
        const heartHealth = Math.max(0, Math.min(2, player.health - i * 2));
        if (heartHealth > 0) {
            ctx.fillStyle = '#f44';
            ctx.beginPath();
            if (heartHealth >= 2) {
                // Full heart
                ctx.moveTo(x, heartsY + 8);
                ctx.bezierCurveTo(x - 12, heartsY - 4, x - 12, heartsY - 14, x, heartsY - 8);
                ctx.bezierCurveTo(x + 12, heartsY - 14, x + 12, heartsY - 4, x, heartsY + 8);
            } else {
                // Half heart
                ctx.moveTo(x, heartsY + 8);
                ctx.bezierCurveTo(x - 12, heartsY - 4, x - 12, heartsY - 14, x, heartsY - 8);
                ctx.lineTo(x, heartsY + 8);
            }
            ctx.fill();
        }
    }

    // Soul hearts
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const x = heartsX + (Math.ceil(player.maxHealth / 2) + i) * 28;
        ctx.fillStyle = '#48f';
        ctx.beginPath();
        ctx.moveTo(x, heartsY + 8);
        ctx.bezierCurveTo(x - 12, heartsY - 4, x - 12, heartsY - 14, x, heartsY - 8);
        ctx.bezierCurveTo(x + 12, heartsY - 14, x + 12, heartsY - 4, x, heartsY + 8);
        ctx.fill();
    }

    // Resources (left side)
    ctx.fillStyle = '#fc0';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${player.coins}`, 35, 455);

    // Coin icon
    ctx.fillStyle = '#fc0';
    ctx.beginPath();
    ctx.arc(18, 450, 10, 0, Math.PI * 2);
    ctx.fill();

    // Bomb icon and count
    ctx.fillStyle = '#fff';
    ctx.fillText(`${player.bombs}`, 35, 485);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(18, 480, 10, 0, Math.PI * 2);
    ctx.fill();

    // Key icon and count
    ctx.fillStyle = '#fff';
    ctx.fillText(`${player.keys}`, 35, 515);
    ctx.fillStyle = '#fc0';
    ctx.fillRect(13, 505, 6, 15);
    ctx.beginPath();
    ctx.arc(16, 505, 6, 0, Math.PI * 2);
    ctx.fill();

    // Floor name
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${floorConfigs[currentFloor].name} ${currentFloor + 1}`, canvas.width / 2, 555);

    // Stats (bottom left)
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG: ${player.damage.toFixed(1)}`, 10, 545);
    ctx.fillText(`SPD: ${player.speed.toFixed(1)}`, 10, 560);
    ctx.fillText(`TEARS: ${player.tearDelay}`, 10, 575);
}

function renderMinimap() {
    const mapX = canvas.width - 120;
    const mapY = 50;
    const roomSize = 18;
    const padding = 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX - 10, mapY - 10, 110, 110);

    // Rooms
    for (const key of Object.keys(floorData.rooms)) {
        const room = floorData.rooms[key];
        if (!roomsDiscovered.has(key)) continue;

        const rx = mapX + room.x * (roomSize + padding);
        const ry = mapY + room.y * (roomSize + padding);

        // Room color based on type
        switch (room.type) {
            case 'start':
                ctx.fillStyle = '#666';
                break;
            case 'normal':
                ctx.fillStyle = room.cleared ? '#543' : '#654';
                break;
            case 'treasure':
                ctx.fillStyle = '#fc0'; // Yellow for treasure
                break;
            case 'shop':
                ctx.fillStyle = '#0aa';
                break;
            case 'boss':
                ctx.fillStyle = '#a33';
                break;
            default:
                ctx.fillStyle = '#654';
        }

        ctx.fillRect(rx, ry, roomSize, roomSize);

        // Current room indicator
        if (room.x === currentRoomX && room.y === currentRoomY) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry, roomSize, roomSize);
        }
    }
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 200, 170, 190, 200);

    ctx.fillStyle = '#0f0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const lines = [
        `FPS: ${Math.round(1000 / 16.67)}`,
        `Room: ${currentRoomX}, ${currentRoomY}`,
        `Player: ${Math.round(player.x)}, ${Math.round(player.y)}`,
        `Health: ${player.health}/${player.maxHealth}`,
        `Soul: ${player.soulHearts}`,
        `Enemies: ${enemies.length}`,
        `Tears: ${tears.length}`,
        `Floor: ${currentFloor + 1}`,
        `Rooms Cleared: ${roomsCleared.size}`,
        `Items: ${player.items.length}`,
        `Damage: ${player.damage.toFixed(1)}`,
        `State: ${currentState}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 190, 185 + i * 15);
    });
}

function renderMenu() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#a66';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('TEARS OF THE', canvas.width / 2, 180);
    ctx.fillText('BASEMENT', canvas.width / 2, 240);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('A Binding of Isaac Tribute', canvas.width / 2, 290);

    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 400);

    ctx.fillStyle = '#444';
    ctx.font = '12px monospace';
    ctx.fillText('WASD - Move | Arrow Keys - Shoot | E - Bomb | Q - Debug', canvas.width / 2, 500);
}

function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '16px monospace';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 40);
}

function renderGameOver() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#a44';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText(`Floor Reached: ${floorConfigs[currentFloor].name}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Items: ${player.items.length}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to Continue', canvas.width / 2, canvas.height / 2 + 120);
}

function renderVictory() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4a4';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText("You defeated Mom's Heart!", canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Items Collected: ${player.items.length}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to Continue', canvas.width / 2, canvas.height / 2 + 120);
}

// Start the game
init();
