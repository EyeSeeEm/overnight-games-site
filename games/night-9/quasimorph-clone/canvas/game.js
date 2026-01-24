// Quasimorph Clone - Canvas Version
// Turn-based tactical extraction roguelike

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== CONSTANTS ====================
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const VIEW_WIDTH = 20;
const VIEW_HEIGHT = 15;
const VISION_RADIUS = 6;

// Colors matching reference screenshots
const COLORS = {
    background: '#0a0a0f',
    wallDark: '#1a2a2a',
    wallLight: '#2a3a3a',
    wallAccent: '#3a4a4a',
    floorDark: '#1a1a1a',
    floorMetal: '#2a2525',
    floorRust: '#3a2a20',
    floorGrate: '#252530',
    doorFrame: '#4a3a2a',
    doorClosed: '#6a4a3a',
    doorOpen: '#2a1a1a',
    uiPanel: '#1a2a2a',
    uiBorder: '#3a5a5a',
    uiText: '#8ac',
    uiTextBright: '#aef',
    uiTextDim: '#5a7a7a',
    healthBar: '#4a8a4a',
    healthBarLow: '#8a4a4a',
    corruptionLow: '#4a6a4a',
    corruptionMed: '#6a6a4a',
    corruptionHigh: '#8a4a4a',
    corruptionCrit: '#aa2a2a',
    player: '#5a8a5a',
    playerArmor: '#4a7a7a',
    enemy: '#8a4a4a',
    enemyCorrupted: '#6a2a6a',
    loot: '#8a8a4a',
    extraction: '#4a8a8a',
    fogExplored: 'rgba(10,10,15,0.7)',
    fogUnexplored: '#0a0a0f',
    fireOrange: '#da6a2a',
    fireYellow: '#eaa030',
    blood: '#6a2020',
    muzzleFlash: '#ffaa44'
};

// Tile types
const TILE = {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    DOOR_CLOSED: 3,
    DOOR_OPEN: 4,
    CRATE: 5,
    TERMINAL: 6,
    EXTRACTION: 7,
    VENT: 8
};

// Game states
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    INVENTORY: 'inventory',
    ENEMY_TURN: 'enemy_turn',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Stances
const STANCE = {
    SNEAK: { name: 'Sneak', ap: 1, detectMod: 0.5 },
    WALK: { name: 'Walk', ap: 2, detectMod: 1.0 },
    RUN: { name: 'Run', ap: 3, detectMod: 1.5 }
};

// Weapons
const WEAPONS = {
    knife: { name: 'Knife', apCost: 1, range: 1, accuracy: 90, damage: [20, 30], ammoType: null, maxDurability: 50, silent: true },
    pistol: { name: 'Pistol', apCost: 1, range: 6, accuracy: 75, damage: [15, 20], ammoType: '9mm', maxDurability: 30, silent: false },
    smg: { name: 'SMG', apCost: 1, range: 5, accuracy: 60, damage: [10, 15], ammoType: '9mm', burst: 3, maxDurability: 25, silent: false },
    shotgun: { name: 'Shotgun', apCost: 2, range: 3, accuracy: 80, damage: [25, 40], ammoType: '12g', maxDurability: 20, silent: false }
};

// Enemy types
const ENEMY_TYPES = {
    guard: { name: 'Guard', hp: 50, ap: 2, damage: [10, 15], range: 5, behavior: 'patrol', color: '#7a5a4a', sprite: 'human' },
    soldier: { name: 'Soldier', hp: 75, ap: 2, damage: [12, 18], range: 5, behavior: 'aggressive', color: '#5a6a5a', sprite: 'human' },
    possessed: { name: 'Possessed', hp: 80, ap: 3, damage: [15, 25], range: 1, behavior: 'rush', color: '#6a3a5a', sprite: 'corrupted' },
    bloater: { name: 'Bloater', hp: 150, ap: 1, damage: [30, 50], range: 2, behavior: 'slow', explodes: true, color: '#5a4a3a', sprite: 'corrupted' },
    stalker: { name: 'Stalker', hp: 60, ap: 4, damage: [20, 30], range: 1, behavior: 'ambush', color: '#4a3a4a', sprite: 'corrupted' }
};

// Corruption thresholds
const CORRUPTION_THRESHOLDS = [
    { level: 0, name: 'Normal', transformChance: 0, effects: [] },
    { level: 200, name: 'Unease', transformChance: 0.1, effects: ['flicker'] },
    { level: 400, name: 'Spreading', transformChance: 0.25, effects: ['flicker', 'redTint'] },
    { level: 600, name: 'Critical', transformChance: 0.5, effects: ['flicker', 'redTint', 'distortion'] },
    { level: 800, name: 'Rapture', transformChance: 1.0, effects: ['flicker', 'redTint', 'distortion', 'screams'] },
    { level: 1000, name: 'Breach', transformChance: 1.0, effects: ['all'], bossSpawn: true }
];

// ==================== GAME STATE ====================
let game = {
    state: STATE.MENU,
    turn: 0,
    map: [],
    explored: [],
    visible: [],
    player: null,
    enemies: [],
    items: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    corruption: 0,
    camera: { x: 0, y: 0 },
    selectedTile: null,
    showDebug: false,
    animatingEnemy: null,
    enemyTurnIndex: 0,
    rooms: [],
    extractionPoint: null,
    score: 0,
    highScore: parseInt(localStorage.getItem('quasimorph_highscore')) || 0,
    turnIndicator: null,
    noApTimer: 0
};

// ==================== PLAYER ====================
function createPlayer(x, y) {
    return {
        x, y,
        hp: 100,
        maxHp: 100,
        ap: 2,
        maxAp: 2,
        stance: STANCE.WALK,
        bleeding: false,
        bleedDamage: 0,
        weapons: [
            { ...WEAPONS.knife, durability: 50, ammo: Infinity },
            null
        ],
        currentWeapon: 0,
        quickSlots: [
            { type: 'bandage', count: 2 },
            { type: 'medkit', count: 1 }
        ],
        inventory: [],
        ammo: { '9mm': 30, '12g': 10 }
    };
}

// ==================== MAP GENERATION ====================
function generateMap() {
    // Initialize map with void
    game.map = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(TILE.VOID));
    game.explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    game.visible = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    game.rooms = [];
    game.enemies = [];
    game.items = [];

    // Generate rooms
    const numRooms = 10 + Math.floor(Math.random() * 6);
    const roomTypes = ['storage', 'barracks', 'medical', 'armory', 'corridor', 'control'];

    for (let i = 0; i < numRooms; i++) {
        const roomWidth = 5 + Math.floor(Math.random() * 6);
        const roomHeight = 4 + Math.floor(Math.random() * 5);
        const roomX = 1 + Math.floor(Math.random() * (MAP_WIDTH - roomWidth - 2));
        const roomY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - roomHeight - 2));

        // Check for overlap
        let overlaps = false;
        for (let room of game.rooms) {
            if (roomX < room.x + room.width + 1 && roomX + roomWidth + 1 > room.x &&
                roomY < room.y + room.height + 1 && roomY + roomHeight + 1 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps || game.rooms.length === 0) {
            const room = {
                x: roomX, y: roomY,
                width: roomWidth, height: roomHeight,
                type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
                connected: false
            };
            game.rooms.push(room);

            // Carve room with walls
            for (let y = roomY - 1; y <= roomY + roomHeight; y++) {
                for (let x = roomX - 1; x <= roomX + roomWidth; x++) {
                    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                        if (y === roomY - 1 || y === roomY + roomHeight ||
                            x === roomX - 1 || x === roomX + roomWidth) {
                            if (game.map[y][x] !== TILE.FLOOR) {
                                game.map[y][x] = TILE.WALL;
                            }
                        } else {
                            game.map[y][x] = TILE.FLOOR;
                        }
                    }
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < game.rooms.length; i++) {
        const room1 = game.rooms[i];
        const room2 = game.rooms[i - 1];

        const x1 = Math.floor(room1.x + room1.width / 2);
        const y1 = Math.floor(room1.y + room1.height / 2);
        const x2 = Math.floor(room2.x + room2.width / 2);
        const y2 = Math.floor(room2.y + room2.height / 2);

        // Horizontal then vertical corridor
        carveCorridor(x1, y1, x2, y1);
        carveCorridor(x2, y1, x2, y2);
    }

    // Add doors
    for (let room of game.rooms) {
        addDoorsToRoom(room);
    }

    // Place player in first room
    const startRoom = game.rooms[0];
    game.player = createPlayer(
        startRoom.x + Math.floor(startRoom.width / 2),
        startRoom.y + Math.floor(startRoom.height / 2)
    );

    // Place extraction in last room
    const endRoom = game.rooms[game.rooms.length - 1];
    game.extractionPoint = {
        x: endRoom.x + Math.floor(endRoom.width / 2),
        y: endRoom.y + Math.floor(endRoom.height / 2)
    };
    game.map[game.extractionPoint.y][game.extractionPoint.x] = TILE.EXTRACTION;

    // Populate rooms with enemies and items
    for (let i = 1; i < game.rooms.length - 1; i++) {
        populateRoom(game.rooms[i]);
    }

    // Add some loot to extraction room
    addItemToRoom(endRoom, 'medkit');
}

function carveCorridor(x1, y1, x2, y2) {
    const dx = x1 < x2 ? 1 : (x1 > x2 ? -1 : 0);
    const dy = y1 < y2 ? 1 : (y1 > y2 ? -1 : 0);

    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            if (game.map[y][x] === TILE.VOID || game.map[y][x] === TILE.WALL) {
                game.map[y][x] = TILE.FLOOR;
            }
            // Add walls around corridor
            for (let dy2 = -1; dy2 <= 1; dy2++) {
                for (let dx2 = -1; dx2 <= 1; dx2++) {
                    const nx = x + dx2, ny = y + dy2;
                    if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                        if (game.map[ny][nx] === TILE.VOID) {
                            game.map[ny][nx] = TILE.WALL;
                        }
                    }
                }
            }
        }
        if (x !== x2) x += dx;
        else if (y !== y2) y += dy;
    }
}

function addDoorsToRoom(room) {
    // Check edges for corridors and add doors
    const edges = [
        { x: room.x + Math.floor(room.width / 2), y: room.y - 1, dir: 'north' },
        { x: room.x + Math.floor(room.width / 2), y: room.y + room.height, dir: 'south' },
        { x: room.x - 1, y: room.y + Math.floor(room.height / 2), dir: 'west' },
        { x: room.x + room.width, y: room.y + Math.floor(room.height / 2), dir: 'east' }
    ];

    for (let edge of edges) {
        if (edge.x >= 0 && edge.x < MAP_WIDTH && edge.y >= 0 && edge.y < MAP_HEIGHT) {
            // Check if there's a corridor leading out
            let corridorDir;
            if (edge.dir === 'north' && edge.y > 0 && game.map[edge.y - 1] && game.map[edge.y - 1][edge.x] === TILE.FLOOR) corridorDir = true;
            if (edge.dir === 'south' && edge.y < MAP_HEIGHT - 1 && game.map[edge.y + 1] && game.map[edge.y + 1][edge.x] === TILE.FLOOR) corridorDir = true;
            if (edge.dir === 'west' && edge.x > 0 && game.map[edge.y][edge.x - 1] === TILE.FLOOR) corridorDir = true;
            if (edge.dir === 'east' && edge.x < MAP_WIDTH - 1 && game.map[edge.y][edge.x + 1] === TILE.FLOOR) corridorDir = true;

            if (corridorDir && game.map[edge.y][edge.x] === TILE.WALL) {
                game.map[edge.y][edge.x] = Math.random() < 0.7 ? TILE.DOOR_CLOSED : TILE.FLOOR;
            }
        }
    }
}

function populateRoom(room) {
    const enemyCount = room.type === 'barracks' ? 2 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);

    for (let i = 0; i < enemyCount; i++) {
        const ex = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        const ey = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

        if (game.map[ey][ex] === TILE.FLOOR && !getEnemyAt(ex, ey)) {
            const types = ['guard', 'guard', 'soldier'];
            const type = types[Math.floor(Math.random() * types.length)];
            spawnEnemy(ex, ey, type);
        }
    }

    // Add loot based on room type
    if (room.type === 'storage') {
        addItemToRoom(room, 'crate');
        if (Math.random() < 0.5) addItemToRoom(room, 'ammo_9mm');
    } else if (room.type === 'medical') {
        addItemToRoom(room, 'medkit');
        addItemToRoom(room, 'bandage');
    } else if (room.type === 'armory') {
        const weapons = ['pistol', 'smg', 'shotgun'];
        addItemToRoom(room, weapons[Math.floor(Math.random() * weapons.length)]);
        addItemToRoom(room, 'ammo_9mm');
        if (Math.random() < 0.5) addItemToRoom(room, 'ammo_12g');
    }
}

function addItemToRoom(room, itemType) {
    for (let attempts = 0; attempts < 10; attempts++) {
        const ix = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        const iy = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

        if (game.map[iy][ix] === TILE.FLOOR && !getItemAt(ix, iy)) {
            game.items.push({ x: ix, y: iy, type: itemType });
            return;
        }
    }
}

// ==================== ENEMIES ====================
function spawnEnemy(x, y, type) {
    const template = ENEMY_TYPES[type];
    game.enemies.push({
        x, y,
        type,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        ap: template.ap,
        maxAp: template.ap,
        damage: template.damage,
        range: template.range,
        behavior: template.behavior,
        color: template.color,
        sprite: template.sprite,
        explodes: template.explodes || false,
        alerted: false,
        lastSeenPlayer: null,
        patrolTarget: null,
        isAttacking: false,
        attackTimer: 0
    });
}

function getEnemyAt(x, y) {
    return game.enemies.find(e => e.x === x && e.y === y && e.hp > 0);
}

function getItemAt(x, y) {
    return game.items.find(i => i.x === x && i.y === y);
}

// ==================== VISION SYSTEM ====================
function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            game.visible[y][x] = false;
        }
    }

    // Cast rays from player
    const px = game.player.x;
    const py = game.player.y;

    // Player's tile is always visible
    game.visible[py][px] = true;
    game.explored[py][px] = true;

    // Shadowcasting in 8 octants
    for (let octant = 0; octant < 8; octant++) {
        castLight(px, py, VISION_RADIUS, 1, 1.0, 0.0, octant);
    }
}

function castLight(cx, cy, radius, row, startSlope, endSlope, octant) {
    if (startSlope < endSlope) return;

    let nextStartSlope = startSlope;

    for (let i = row; i <= radius; i++) {
        let blocked = false;

        for (let dx = -i; dx <= 0; dx++) {
            const dy = -i;

            const leftSlope = (dx - 0.5) / (dy + 0.5);
            const rightSlope = (dx + 0.5) / (dy - 0.5);

            if (startSlope < rightSlope) continue;
            if (endSlope > leftSlope) break;

            // Transform coordinates based on octant
            let tx, ty;
            switch (octant) {
                case 0: tx = cx + dx; ty = cy + dy; break;
                case 1: tx = cx + dy; ty = cy + dx; break;
                case 2: tx = cx + dy; ty = cy - dx; break;
                case 3: tx = cx + dx; ty = cy - dy; break;
                case 4: tx = cx - dx; ty = cy - dy; break;
                case 5: tx = cx - dy; ty = cy - dx; break;
                case 6: tx = cx - dy; ty = cy + dx; break;
                case 7: tx = cx - dx; ty = cy + dy; break;
            }

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                game.visible[ty][tx] = true;
                game.explored[ty][tx] = true;
            }

            if (blocked) {
                if (isBlockingTile(tx, ty)) {
                    nextStartSlope = rightSlope;
                    continue;
                } else {
                    blocked = false;
                    startSlope = nextStartSlope;
                }
            } else if (isBlockingTile(tx, ty) && i < radius) {
                blocked = true;
                castLight(cx, cy, radius, i + 1, startSlope, leftSlope, octant);
                nextStartSlope = rightSlope;
            }
        }

        if (blocked) break;
    }
}

function isBlockingTile(x, y) {
    const tile = game.map[y][x];
    return tile === TILE.WALL || tile === TILE.DOOR_CLOSED || tile === TILE.CRATE;
}

// ==================== PLAYER ACTIONS ====================
function movePlayer(dx, dy) {
    if (game.state !== STATE.PLAYING || game.player.ap <= 0) {
        if (game.player.ap <= 0) {
            showFloatingText(game.player.x, game.player.y, 'No AP!', '#ff6666');
            game.noApTimer = 60;
        }
        return false;
    }

    const newX = game.player.x + dx;
    const newY = game.player.y + dy;

    if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return false;

    const tile = game.map[newY][newX];

    // Check for enemy
    const enemy = getEnemyAt(newX, newY);
    if (enemy) {
        // Melee attack
        attackEnemy(enemy);
        return true;
    }

    // Check for door
    if (tile === TILE.DOOR_CLOSED) {
        game.map[newY][newX] = TILE.DOOR_OPEN;
        // Opening door is free
        updateVisibility();
        return true;
    }

    // Check for walkable
    if (tile === TILE.FLOOR || tile === TILE.DOOR_OPEN || tile === TILE.EXTRACTION) {
        game.player.x = newX;
        game.player.y = newY;
        game.player.ap--;

        // Check for extraction
        if (tile === TILE.EXTRACTION) {
            victory();
            return true;
        }

        // Check for item pickup
        const item = getItemAt(newX, newY);
        if (item) {
            pickupItem(item);
        }

        updateVisibility();
        updateCamera();

        // Auto-end turn if out of AP
        if (game.player.ap <= 0) {
            setTimeout(endPlayerTurn, 300);
        }

        return true;
    }

    return false;
}

function attackEnemy(enemy) {
    const weapon = game.player.weapons[game.player.currentWeapon];
    if (!weapon) return;

    const dist = Math.abs(enemy.x - game.player.x) + Math.abs(enemy.y - game.player.y);
    if (dist > weapon.range) {
        showFloatingText(game.player.x, game.player.y, 'Out of range!', '#ffaa66');
        return;
    }

    if (game.player.ap < weapon.apCost) {
        showFloatingText(game.player.x, game.player.y, 'No AP!', '#ff6666');
        return;
    }

    // Check ammo
    if (weapon.ammoType && weapon.ammo <= 0) {
        showFloatingText(game.player.x, game.player.y, 'No ammo!', '#ff6666');
        return;
    }

    game.player.ap -= weapon.apCost;

    // Use ammo
    if (weapon.ammoType) {
        weapon.ammo--;
    }

    // Reduce durability
    weapon.durability--;

    // Calculate hit
    let accuracy = weapon.accuracy;
    if (weapon.durability <= 0) {
        accuracy *= 0.5; // Jammed weapon
        showFloatingText(game.player.x, game.player.y, 'Weapon jammed!', '#ffaa00');
    }

    // Muzzle flash
    if (!weapon.silent) {
        addParticle(game.player.x, game.player.y, 'muzzle');
        alertNearbyEnemies();
    }

    const bursts = weapon.burst || 1;
    let totalDamage = 0;

    for (let b = 0; b < bursts; b++) {
        if (Math.random() * 100 < accuracy) {
            const dmg = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));
            totalDamage += dmg;
        }
    }

    if (totalDamage > 0) {
        enemy.hp -= totalDamage;
        showFloatingText(enemy.x, enemy.y, `-${totalDamage}`, '#ff4444');
        addParticle(enemy.x, enemy.y, 'blood');

        if (enemy.hp <= 0) {
            killEnemy(enemy);
        }
    } else {
        showFloatingText(enemy.x, enemy.y, 'MISS', '#aaaaaa');
    }

    // Auto-end turn if out of AP
    if (game.player.ap <= 0) {
        setTimeout(endPlayerTurn, 300);
    }
}

function shootAtTile(tx, ty) {
    if (game.state !== STATE.PLAYING) return;

    const enemy = getEnemyAt(tx, ty);
    if (enemy && game.visible[ty][tx]) {
        attackEnemy(enemy);
    }
}

function killEnemy(enemy) {
    enemy.hp = 0;
    game.score += 100;

    // Check for explosion (Bloater)
    if (enemy.explodes) {
        explode(enemy.x, enemy.y, 2, 40);
    }

    // Drop loot
    if (Math.random() < 0.3) {
        const lootTypes = ['ammo_9mm', 'bandage', 'cigarettes'];
        game.items.push({
            x: enemy.x, y: enemy.y,
            type: lootTypes[Math.floor(Math.random() * lootTypes.length)]
        });
    }
}

function explode(x, y, radius, damage) {
    addParticle(x, y, 'explosion');

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                const tx = x + dx, ty = y + dy;
                if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                    const dmg = Math.floor(damage * (1 - dist / radius));

                    if (tx === game.player.x && ty === game.player.y) {
                        damagePlayer(dmg);
                    }

                    const enemy = getEnemyAt(tx, ty);
                    if (enemy) {
                        enemy.hp -= dmg;
                        if (enemy.hp <= 0) killEnemy(enemy);
                    }
                }
            }
        }
    }
}

function damagePlayer(amount) {
    game.player.hp -= amount;
    showFloatingText(game.player.x, game.player.y, `-${amount}`, '#ff0000');
    addParticle(game.player.x, game.player.y, 'blood');

    if (game.player.hp <= 0) {
        gameOver();
    }
}

function alertNearbyEnemies() {
    for (let enemy of game.enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.abs(enemy.x - game.player.x) + Math.abs(enemy.y - game.player.y);
        if (dist < 10) {
            enemy.alerted = true;
            enemy.lastSeenPlayer = { x: game.player.x, y: game.player.y };
        }
    }
}

function pickupItem(item) {
    const idx = game.items.indexOf(item);
    if (idx === -1) return;

    let pickedUp = false;

    switch (item.type) {
        case 'medkit':
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
            showFloatingText(game.player.x, game.player.y, '+30 HP', '#44ff44');
            pickedUp = true;
            break;
        case 'bandage':
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 10);
            game.player.bleeding = false;
            showFloatingText(game.player.x, game.player.y, '+10 HP', '#44ff44');
            pickedUp = true;
            break;
        case 'ammo_9mm':
            game.player.ammo['9mm'] += 15;
            showFloatingText(game.player.x, game.player.y, '+15 9mm', '#ffff44');
            pickedUp = true;
            break;
        case 'ammo_12g':
            game.player.ammo['12g'] += 8;
            showFloatingText(game.player.x, game.player.y, '+8 12g', '#ffff44');
            pickedUp = true;
            break;
        case 'cigarettes':
            game.corruption = Math.max(0, game.corruption - 25);
            showFloatingText(game.player.x, game.player.y, '-25 Corruption', '#44ffff');
            pickedUp = true;
            break;
        case 'pistol':
        case 'smg':
        case 'shotgun':
            if (!game.player.weapons[1]) {
                game.player.weapons[1] = { ...WEAPONS[item.type], durability: WEAPONS[item.type].maxDurability, ammo: 10 };
                showFloatingText(game.player.x, game.player.y, `Got ${WEAPONS[item.type].name}!`, '#44ffff');
                pickedUp = true;
            } else {
                showFloatingText(game.player.x, game.player.y, 'Slots full!', '#ff6666');
            }
            break;
    }

    if (pickedUp) {
        game.items.splice(idx, 1);
        game.score += 10;
    }
}

function reloadWeapon() {
    const weapon = game.player.weapons[game.player.currentWeapon];
    if (!weapon || !weapon.ammoType) return;

    if (game.player.ap < 1) {
        showFloatingText(game.player.x, game.player.y, 'No AP!', '#ff6666');
        return;
    }

    const maxAmmo = 15;
    const needed = maxAmmo - weapon.ammo;
    const available = game.player.ammo[weapon.ammoType];
    const toLoad = Math.min(needed, available);

    if (toLoad > 0) {
        weapon.ammo += toLoad;
        game.player.ammo[weapon.ammoType] -= toLoad;
        game.player.ap--;
        showFloatingText(game.player.x, game.player.y, `Reloaded +${toLoad}`, '#44ff44');

        if (game.player.ap <= 0) {
            setTimeout(endPlayerTurn, 300);
        }
    } else {
        showFloatingText(game.player.x, game.player.y, 'No ammo!', '#ff6666');
    }
}

function useQuickSlot(slot) {
    const item = game.player.quickSlots[slot];
    if (!item || item.count <= 0) {
        showFloatingText(game.player.x, game.player.y, 'Empty!', '#ff6666');
        return;
    }

    if (game.player.ap < 1) {
        showFloatingText(game.player.x, game.player.y, 'No AP!', '#ff6666');
        return;
    }

    switch (item.type) {
        case 'bandage':
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 10);
            game.player.bleeding = false;
            showFloatingText(game.player.x, game.player.y, '+10 HP', '#44ff44');
            break;
        case 'medkit':
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
            showFloatingText(game.player.x, game.player.y, '+30 HP', '#44ff44');
            break;
    }

    item.count--;
    game.player.ap--;

    if (game.player.ap <= 0) {
        setTimeout(endPlayerTurn, 300);
    }
}

// ==================== TURN MANAGEMENT ====================
function endPlayerTurn() {
    if (game.state !== STATE.PLAYING) return;

    // Apply bleeding
    if (game.player.bleeding) {
        damagePlayer(game.player.bleedDamage);
    }

    game.turn++;
    game.corruption += 10 + Math.floor(game.turn / 10);

    // Start enemy turn
    game.state = STATE.ENEMY_TURN;
    game.enemyTurnIndex = 0;
    game.turnIndicator = { text: 'ENEMY TURN', timer: 90 };

    processEnemyTurn();
}

function processEnemyTurn() {
    if (game.state !== STATE.ENEMY_TURN) return;

    // Find next alive enemy
    while (game.enemyTurnIndex < game.enemies.length && game.enemies[game.enemyTurnIndex].hp <= 0) {
        game.enemyTurnIndex++;
    }

    if (game.enemyTurnIndex >= game.enemies.length) {
        endEnemyTurn();
        return;
    }

    const enemy = game.enemies[game.enemyTurnIndex];
    enemy.ap = enemy.maxAp;

    // Execute enemy AI
    executeEnemyAI(enemy, () => {
        game.enemyTurnIndex++;
        setTimeout(processEnemyTurn, 150);
    });
}

function executeEnemyAI(enemy, callback) {
    // Check if player is visible
    const canSeePlayer = game.visible[enemy.y] && game.visible[enemy.y][enemy.x] &&
                         hasLineOfSight(enemy.x, enemy.y, game.player.x, game.player.y);

    if (canSeePlayer) {
        enemy.alerted = true;
        enemy.lastSeenPlayer = { x: game.player.x, y: game.player.y };
    }

    const dist = Math.abs(enemy.x - game.player.x) + Math.abs(enemy.y - game.player.y);

    // Attack if in range and can see
    if (canSeePlayer && dist <= enemy.range && enemy.ap > 0) {
        enemyAttack(enemy, callback);
        return;
    }

    // Move toward player or last known position
    if (enemy.alerted && enemy.lastSeenPlayer && enemy.ap > 0) {
        const target = canSeePlayer ? { x: game.player.x, y: game.player.y } : enemy.lastSeenPlayer;
        const moved = moveEnemyToward(enemy, target.x, target.y);

        if (moved) {
            enemy.ap--;

            // Check if can attack after moving
            const newDist = Math.abs(enemy.x - game.player.x) + Math.abs(enemy.y - game.player.y);
            if (canSeePlayer && newDist <= enemy.range && enemy.ap > 0) {
                setTimeout(() => enemyAttack(enemy, callback), 200);
                return;
            }
        }
    } else if (!enemy.alerted) {
        // Patrol behavior
        if (!enemy.patrolTarget || (enemy.x === enemy.patrolTarget.x && enemy.y === enemy.patrolTarget.y)) {
            enemy.patrolTarget = getRandomNearbyFloor(enemy.x, enemy.y, 5);
        }
        if (enemy.patrolTarget) {
            moveEnemyToward(enemy, enemy.patrolTarget.x, enemy.patrolTarget.y);
        }
    }

    callback();
}

function enemyAttack(enemy, callback) {
    enemy.isAttacking = true;
    enemy.attackTimer = 30;

    // Show attack animation
    game.turnIndicator = { text: `${enemy.name} attacks!`, timer: 60 };

    setTimeout(() => {
        // Calculate damage
        const damage = enemy.damage[0] + Math.floor(Math.random() * (enemy.damage[1] - enemy.damage[0] + 1));

        // Check for hit (simplified accuracy)
        if (Math.random() < 0.7) {
            damagePlayer(damage);

            // Chance to cause bleeding
            if (Math.random() < 0.2) {
                game.player.bleeding = true;
                game.player.bleedDamage = 1;
                showFloatingText(game.player.x, game.player.y, 'Bleeding!', '#ff4444');
            }
        } else {
            showFloatingText(game.player.x, game.player.y, 'Missed!', '#888888');
        }

        enemy.ap--;
        enemy.isAttacking = false;
        callback();
    }, 400);
}

function moveEnemyToward(enemy, tx, ty) {
    const dx = Math.sign(tx - enemy.x);
    const dy = Math.sign(ty - enemy.y);

    // Try horizontal first, then vertical, then diagonals
    const moves = [
        { dx, dy: 0 },
        { dx: 0, dy },
        { dx, dy }
    ].filter(m => m.dx !== 0 || m.dy !== 0);

    for (let move of moves) {
        const nx = enemy.x + move.dx;
        const ny = enemy.y + move.dy;

        if (canMoveTo(nx, ny) && !getEnemyAt(nx, ny) && !(nx === game.player.x && ny === game.player.y)) {
            enemy.x = nx;
            enemy.y = ny;

            // Open doors
            if (game.map[ny][nx] === TILE.DOOR_CLOSED) {
                game.map[ny][nx] = TILE.DOOR_OPEN;
            }

            return true;
        }
    }

    return false;
}

function canMoveTo(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = game.map[y][x];
    return tile === TILE.FLOOR || tile === TILE.DOOR_CLOSED || tile === TILE.DOOR_OPEN || tile === TILE.EXTRACTION;
}

function getRandomNearbyFloor(x, y, range) {
    for (let attempts = 0; attempts < 20; attempts++) {
        const nx = x + Math.floor(Math.random() * range * 2) - range;
        const ny = y + Math.floor(Math.random() * range * 2) - range;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && game.map[ny][nx] === TILE.FLOOR) {
            return { x: nx, y: ny };
        }
    }
    return null;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
        if (isBlockingTile(x, y) && !(x === x1 && y === y1)) return false;

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
}

function endEnemyTurn() {
    // Check for transformations based on corruption
    checkCorruptionTransformations();

    // Spawn new enemies at high corruption
    if (game.corruption >= 600 && Math.random() < 0.2) {
        spawnCorruptedEnemy();
    }

    // Reset player AP
    game.player.ap = game.player.stance.ap;
    game.state = STATE.PLAYING;
    game.turnIndicator = { text: 'YOUR TURN', timer: 60 };
}

function checkCorruptionTransformations() {
    const threshold = CORRUPTION_THRESHOLDS.find(t => game.corruption < t.level) || CORRUPTION_THRESHOLDS[CORRUPTION_THRESHOLDS.length - 1];

    for (let enemy of game.enemies) {
        if (enemy.hp <= 0 || enemy.sprite === 'corrupted') continue;

        if (Math.random() < threshold.transformChance) {
            transformEnemy(enemy);
        }
    }
}

function transformEnemy(enemy) {
    const types = ['possessed', 'bloater', 'stalker'];
    const newType = types[Math.floor(Math.random() * types.length)];
    const template = ENEMY_TYPES[newType];

    enemy.type = newType;
    enemy.name = template.name;
    enemy.hp = template.hp;
    enemy.maxHp = template.hp;
    enemy.ap = template.ap;
    enemy.maxAp = template.ap;
    enemy.damage = template.damage;
    enemy.range = template.range;
    enemy.behavior = template.behavior;
    enemy.color = template.color;
    enemy.sprite = template.sprite;
    enemy.explodes = template.explodes || false;
    enemy.alerted = true;
    enemy.lastSeenPlayer = { x: game.player.x, y: game.player.y };

    addParticle(enemy.x, enemy.y, 'transform');
    showFloatingText(enemy.x, enemy.y, 'TRANSFORMED!', '#ff00ff');
}

function spawnCorruptedEnemy() {
    // Find a spot in fog of war
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);

        if (game.map[y][x] === TILE.FLOOR && !game.visible[y][x] && !getEnemyAt(x, y)) {
            const types = ['possessed', 'stalker'];
            spawnEnemy(x, y, types[Math.floor(Math.random() * types.length)]);
            return;
        }
    }
}

// ==================== PARTICLES & EFFECTS ====================
function addParticle(x, y, type) {
    game.particles.push({
        x, y, type,
        life: 30,
        maxLife: 30
    });
}

function showFloatingText(x, y, text, color) {
    game.floatingTexts.push({
        x, y, text, color,
        offsetY: 0,
        life: 60
    });
}

function updateParticles() {
    game.particles = game.particles.filter(p => {
        p.life--;
        return p.life > 0;
    });

    game.floatingTexts = game.floatingTexts.filter(t => {
        t.life--;
        t.offsetY -= 0.5;
        return t.life > 0;
    });

    if (game.turnIndicator) {
        game.turnIndicator.timer--;
        if (game.turnIndicator.timer <= 0) {
            game.turnIndicator = null;
        }
    }

    if (game.noApTimer > 0) game.noApTimer--;
}

// ==================== CAMERA ====================
function updateCamera() {
    game.camera.x = game.player.x - Math.floor(VIEW_WIDTH / 2);
    game.camera.y = game.player.y - Math.floor(VIEW_HEIGHT / 2);

    // Clamp camera
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, game.camera.y));
}

// ==================== RENDERING ====================
function render() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === STATE.MENU) {
        renderMenu();
    } else if (game.state === STATE.GAME_OVER) {
        renderGameOver();
    } else if (game.state === STATE.VICTORY) {
        renderVictory();
    } else {
        renderGame();
    }
}

function renderMenu() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = COLORS.uiTextBright;
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('QUASIMORPH', canvas.width / 2, 180);

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText('Tactical Extraction Roguelike', canvas.width / 2, 220);

    // Instructions
    ctx.font = '14px "Courier New"';
    ctx.fillStyle = COLORS.uiTextDim;
    const instructions = [
        'WASD / Arrows - Move',
        'Click enemy - Attack',
        '1/2 - Switch weapon',
        'R - Reload',
        'F/G - Use quick slot',
        'ENTER - End turn',
        'Q - Debug overlay',
        '',
        'SPACE to start'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 300 + i * 22);
    });

    // High score
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText(`High Score: ${game.highScore}`, canvas.width / 2, 530);
}

function renderGame() {
    const offsetX = 80; // Left UI panel width
    const offsetY = 40; // Top UI panel height
    const viewPixelWidth = VIEW_WIDTH * TILE_SIZE;
    const viewPixelHeight = VIEW_HEIGHT * TILE_SIZE;

    // Apply corruption visual effects
    applyCorruptionEffects();

    // Render map
    for (let y = 0; y < VIEW_HEIGHT; y++) {
        for (let x = 0; x < VIEW_WIDTH; x++) {
            const mapX = game.camera.x + x;
            const mapY = game.camera.y + y;

            if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) continue;

            const screenX = offsetX + x * TILE_SIZE;
            const screenY = offsetY + y * TILE_SIZE;

            if (!game.explored[mapY][mapX]) {
                ctx.fillStyle = COLORS.fogUnexplored;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                continue;
            }

            const tile = game.map[mapY][mapX];
            renderTile(screenX, screenY, tile, mapX, mapY);

            // Items
            const item = getItemAt(mapX, mapY);
            if (item && game.visible[mapY][mapX]) {
                renderItem(screenX, screenY, item);
            }

            // Fog overlay for explored but not visible
            if (!game.visible[mapY][mapX]) {
                ctx.fillStyle = COLORS.fogExplored;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Render enemies
    for (let enemy of game.enemies) {
        if (enemy.hp <= 0) continue;
        if (!game.visible[enemy.y] || !game.visible[enemy.y][enemy.x]) continue;

        const screenX = offsetX + (enemy.x - game.camera.x) * TILE_SIZE;
        const screenY = offsetY + (enemy.y - game.camera.y) * TILE_SIZE;

        if (screenX >= offsetX && screenX < offsetX + viewPixelWidth &&
            screenY >= offsetY && screenY < offsetY + viewPixelHeight) {
            renderEnemy(screenX, screenY, enemy);
        }
    }

    // Render player
    const playerScreenX = offsetX + (game.player.x - game.camera.x) * TILE_SIZE;
    const playerScreenY = offsetY + (game.player.y - game.camera.y) * TILE_SIZE;
    renderPlayer(playerScreenX, playerScreenY);

    // Render particles
    for (let p of game.particles) {
        const screenX = offsetX + (p.x - game.camera.x) * TILE_SIZE;
        const screenY = offsetY + (p.y - game.camera.y) * TILE_SIZE;
        renderParticle(screenX, screenY, p);
    }

    // Render floating texts
    for (let t of game.floatingTexts) {
        const screenX = offsetX + (t.x - game.camera.x) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = offsetY + (t.y - game.camera.y) * TILE_SIZE + t.offsetY;

        ctx.fillStyle = t.color;
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.globalAlpha = t.life / 60;
        ctx.fillText(t.text, screenX, screenY);
        ctx.globalAlpha = 1;
    }

    // Render UI
    renderUI();

    // Render turn indicator
    if (game.turnIndicator) {
        renderTurnIndicator();
    }

    // Debug overlay
    if (game.showDebug) {
        renderDebugOverlay();
    }
}

function renderTile(x, y, tile, mapX, mapY) {
    const hash = (mapX * 7 + mapY * 13) % 100;

    switch (tile) {
        case TILE.FLOOR:
            // Base floor with variation
            const floorVariant = hash % 8;
            if (floorVariant < 3) {
                // Metal floor
                ctx.fillStyle = '#252830';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                // Panel lines
                ctx.strokeStyle = '#3a4048';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                // Rivets
                ctx.fillStyle = '#4a5058';
                ctx.fillRect(x + 4, y + 4, 3, 3);
                ctx.fillRect(x + 25, y + 4, 3, 3);
                ctx.fillRect(x + 4, y + 25, 3, 3);
                ctx.fillRect(x + 25, y + 25, 3, 3);
            } else if (floorVariant < 5) {
                // Grate floor
                ctx.fillStyle = '#1a1a20';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a2a35';
                for (let gy = 0; gy < 4; gy++) {
                    for (let gx = 0; gx < 4; gx++) {
                        ctx.fillRect(x + 2 + gx * 8, y + 2 + gy * 8, 5, 5);
                    }
                }
            } else if (floorVariant < 7) {
                // Rust-stained floor
                ctx.fillStyle = '#2a2520';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#3a2a20';
                ctx.fillRect(x + hash % 10, y + hash % 12, 12, 8);
                ctx.strokeStyle = '#352820';
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else {
                // Standard floor
                ctx.fillStyle = '#1e2228';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#2a3038';
                ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            }
            break;

        case TILE.WALL:
            // Dark sci-fi wall with detail
            ctx.fillStyle = '#1a2830';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Outer border
            ctx.fillStyle = '#2a3840';
            ctx.fillRect(x, y, TILE_SIZE, 3);
            ctx.fillRect(x, y, 3, TILE_SIZE);
            ctx.fillStyle = '#0a1820';
            ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
            ctx.fillRect(x + TILE_SIZE - 3, y, 3, TILE_SIZE);

            // Inner panel
            ctx.fillStyle = '#223038';
            ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

            // Hazard stripes (on some walls)
            if (hash % 5 === 0) {
                ctx.fillStyle = '#3a3020';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(x + 6 + i * 7, y + 10, 4, 12);
                }
                ctx.fillStyle = '#2a2010';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(x + 8 + i * 7, y + 10, 2, 12);
                }
            } else {
                // Tech detail
                ctx.fillStyle = '#3a4850';
                ctx.fillRect(x + 8, y + 12, 16, 2);
                ctx.fillRect(x + 8, y + 18, 16, 2);
                ctx.fillStyle = '#4a88';
                ctx.fillRect(x + 10, y + 14, 4, 3);
            }
            break;

        case TILE.DOOR_CLOSED:
            // Floor underneath
            ctx.fillStyle = '#1e2228';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Door frame
            ctx.fillStyle = '#3a4a3a';
            ctx.fillRect(x + 1, y, 4, TILE_SIZE);
            ctx.fillRect(x + TILE_SIZE - 5, y, 4, TILE_SIZE);
            // Door panel
            ctx.fillStyle = '#5a6a5a';
            ctx.fillRect(x + 6, y + 2, TILE_SIZE - 12, TILE_SIZE - 4);
            // Detail lines
            ctx.fillStyle = '#4a5a4a';
            ctx.fillRect(x + TILE_SIZE / 2 - 1, y + 4, 2, TILE_SIZE - 8);
            // Handle/control
            ctx.fillStyle = '#aa6644';
            ctx.fillRect(x + TILE_SIZE - 10, y + TILE_SIZE / 2 - 2, 3, 4);
            // Status light
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x + 8, y + TILE_SIZE / 2 - 1, 2, 2);
            break;

        case TILE.DOOR_OPEN:
            // Floor
            ctx.fillStyle = '#1e2228';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Door frame only
            ctx.fillStyle = '#3a4a3a';
            ctx.fillRect(x + 1, y, 4, TILE_SIZE);
            ctx.fillRect(x + TILE_SIZE - 5, y, 4, TILE_SIZE);
            // Status light green
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(x + 8, y + TILE_SIZE / 2 - 1, 2, 2);
            break;

        case TILE.EXTRACTION:
            // Base floor
            ctx.fillStyle = '#1a2a2a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Pulsing extraction pad
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            const pulse2 = Math.sin(Date.now() / 150) * 0.2 + 0.8;

            // Outer glow
            ctx.fillStyle = `rgba(80,200,180,${pulse * 0.3})`;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Inner pad
            ctx.fillStyle = `rgba(60,180,160,${pulse2})`;
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

            // Border
            ctx.strokeStyle = '#4affa0';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // Arrows pointing up
            ctx.fillStyle = '#aaffcc';
            ctx.beginPath();
            ctx.moveTo(x + TILE_SIZE / 2, y + 6);
            ctx.lineTo(x + TILE_SIZE / 2 - 6, y + 14);
            ctx.lineTo(x + TILE_SIZE / 2 + 6, y + 14);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + TILE_SIZE / 2, y + 14);
            ctx.lineTo(x + TILE_SIZE / 2 - 6, y + 22);
            ctx.lineTo(x + TILE_SIZE / 2 + 6, y + 22);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.fillStyle = '#aaffaa';
            ctx.font = '7px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', x + TILE_SIZE / 2, y + 30);
            break;

        default:
            ctx.fillStyle = '#0a0a10';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
}

function renderItem(x, y, item) {
    // Glow effect for all items
    const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;

    switch (item.type) {
        case 'medkit':
            // Glow
            ctx.fillStyle = `rgba(255,100,100,${pulse * 0.3})`;
            ctx.fillRect(x + 6, y + 6, 20, 20);
            // Box
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(x + 8, y + 8, 16, 16);
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(x + 8, y + 8, 16, 3);
            // Cross
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 14, y + 10, 4, 12);
            ctx.fillRect(x + 10, y + 14, 12, 4);
            break;

        case 'bandage':
            ctx.fillStyle = `rgba(255,230,230,${pulse * 0.3})`;
            ctx.fillRect(x + 8, y + 8, 16, 16);
            ctx.fillStyle = '#eedddd';
            ctx.fillRect(x + 10, y + 10, 12, 12);
            ctx.fillStyle = '#ddcccc';
            ctx.fillRect(x + 10, y + 10, 12, 3);
            // Red stripe
            ctx.fillStyle = '#ff8888';
            ctx.fillRect(x + 14, y + 12, 4, 8);
            break;

        case 'ammo_9mm':
            ctx.fillStyle = `rgba(200,200,100,${pulse * 0.3})`;
            ctx.fillRect(x + 6, y + 8, 20, 16);
            // Ammo box
            ctx.fillStyle = '#8a8a44';
            ctx.fillRect(x + 8, y + 10, 16, 12);
            ctx.fillStyle = '#6a6a34';
            ctx.fillRect(x + 8, y + 10, 16, 3);
            // Bullets
            ctx.fillStyle = '#ccaa44';
            ctx.fillRect(x + 10, y + 14, 3, 6);
            ctx.fillRect(x + 15, y + 14, 3, 6);
            ctx.fillRect(x + 20, y + 14, 3, 6);
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '6px "Courier New"';
            ctx.fillText('9mm', x + 16, y + 24);
            break;

        case 'ammo_12g':
            ctx.fillStyle = `rgba(200,150,100,${pulse * 0.3})`;
            ctx.fillRect(x + 6, y + 8, 20, 16);
            // Ammo box
            ctx.fillStyle = '#8a6a44';
            ctx.fillRect(x + 8, y + 10, 16, 12);
            ctx.fillStyle = '#6a5034';
            ctx.fillRect(x + 8, y + 10, 16, 3);
            // Shells
            ctx.fillStyle = '#cc6644';
            ctx.fillRect(x + 10, y + 14, 5, 6);
            ctx.fillRect(x + 17, y + 14, 5, 6);
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '6px "Courier New"';
            ctx.fillText('12g', x + 16, y + 24);
            break;

        case 'cigarettes':
            ctx.fillStyle = `rgba(150,200,200,${pulse * 0.3})`;
            ctx.fillRect(x + 8, y + 8, 16, 16);
            // Pack
            ctx.fillStyle = '#447788';
            ctx.fillRect(x + 10, y + 10, 12, 12);
            ctx.fillStyle = '#335566';
            ctx.fillRect(x + 10, y + 10, 12, 3);
            // Cigarette
            ctx.fillStyle = '#eeeedd';
            ctx.fillRect(x + 12, y + 6, 3, 6);
            ctx.fillStyle = '#ff6644';
            ctx.fillRect(x + 12, y + 5, 3, 2);
            break;

        case 'pistol':
            ctx.fillStyle = `rgba(150,150,150,${pulse * 0.3})`;
            ctx.fillRect(x + 6, y + 8, 20, 16);
            // Gun body
            ctx.fillStyle = '#555555';
            ctx.fillRect(x + 8, y + 12, 16, 8);
            ctx.fillStyle = '#444444';
            ctx.fillRect(x + 8, y + 12, 16, 2);
            // Barrel
            ctx.fillStyle = '#666666';
            ctx.fillRect(x + 22, y + 13, 4, 4);
            // Grip
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(x + 10, y + 18, 6, 6);
            break;

        case 'smg':
            ctx.fillStyle = `rgba(150,150,150,${pulse * 0.3})`;
            ctx.fillRect(x + 4, y + 8, 24, 16);
            // Gun body
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x + 6, y + 10, 20, 8);
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(x + 6, y + 10, 20, 2);
            // Barrel
            ctx.fillStyle = '#555555';
            ctx.fillRect(x + 24, y + 12, 6, 4);
            // Magazine
            ctx.fillStyle = '#333333';
            ctx.fillRect(x + 12, y + 16, 6, 8);
            break;

        case 'shotgun':
            ctx.fillStyle = `rgba(150,120,100,${pulse * 0.3})`;
            ctx.fillRect(x + 2, y + 10, 28, 12);
            // Stock
            ctx.fillStyle = '#5a4030';
            ctx.fillRect(x + 4, y + 12, 8, 8);
            // Body
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x + 10, y + 12, 14, 8);
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(x + 10, y + 12, 14, 2);
            // Barrel
            ctx.fillStyle = '#555555';
            ctx.fillRect(x + 22, y + 14, 8, 4);
            break;

        default:
            ctx.fillStyle = `rgba(150,150,100,${pulse * 0.3})`;
            ctx.fillRect(x + 8, y + 8, 16, 16);
            ctx.fillStyle = '#8a8a4a';
            ctx.fillRect(x + 10, y + 10, 12, 12);
    }
}

function renderPlayer(x, y) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 24, 20, 6);

    // Legs
    ctx.fillStyle = '#3a4a3a';
    ctx.fillRect(x + 10, y + 20, 5, 8);
    ctx.fillRect(x + 17, y + 20, 5, 8);

    // Body/torso
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(x + 8, y + 8, 16, 14);

    // Armor vest with detail
    ctx.fillStyle = '#5a7a6a';
    ctx.fillRect(x + 9, y + 10, 14, 10);
    ctx.fillStyle = '#4a6a5a';
    ctx.fillRect(x + 11, y + 12, 10, 6);

    // Arms
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(x + 4, y + 10, 5, 10);
    ctx.fillRect(x + 23, y + 10, 5, 10);

    // Head with helmet
    ctx.fillStyle = '#5a6a5a';
    ctx.fillRect(x + 10, y + 2, 12, 9);

    // Visor (glowing green)
    ctx.fillStyle = '#3a8a4a';
    ctx.fillRect(x + 11, y + 4, 10, 4);
    ctx.fillStyle = '#5aba6a';
    ctx.fillRect(x + 12, y + 5, 8, 2);

    // Helmet detail
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(x + 14, y + 2, 4, 2);

    // Weapon
    const weapon = game.player.weapons[game.player.currentWeapon];
    if (weapon) {
        ctx.fillStyle = '#444';
        ctx.fillRect(x + 26, y + 12, 6, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 28, y + 11, 3, 2);
    }

    // Shoulder lights
    ctx.fillStyle = '#4aff6a';
    ctx.fillRect(x + 5, y + 10, 2, 2);
    ctx.fillRect(x + 25, y + 10, 2, 2);
}

function renderEnemy(x, y, enemy) {
    const isAttacking = enemy.isAttacking;
    const shake = isAttacking ? Math.sin(Date.now() / 50) * 3 : 0;
    const time = Date.now();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 26, 20, 4);

    if (enemy.sprite === 'human') {
        // Human enemy - PMC soldier style
        // Legs
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(x + 11 + shake, y + 20, 4, 8);
        ctx.fillRect(x + 17 + shake, y + 20, 4, 8);

        // Body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(x + 9 + shake, y + 8, 14, 14);

        // Vest/armor detail
        ctx.fillStyle = darkenColor(enemy.color, 20);
        ctx.fillRect(x + 10 + shake, y + 10, 12, 10);

        // Arms
        ctx.fillStyle = enemy.color;
        ctx.fillRect(x + 5 + shake, y + 10, 5, 8);
        ctx.fillRect(x + 22 + shake, y + 10, 5, 8);

        // Head
        ctx.fillStyle = '#8a7a6a';
        ctx.fillRect(x + 11 + shake, y + 2, 10, 8);

        // Face/mask
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x + 12 + shake, y + 5, 8, 4);

        // Eye slit
        ctx.fillStyle = '#ff6644';
        ctx.fillRect(x + 13 + shake, y + 6, 6, 2);

        // Weapon
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + 25 + shake, y + 12, 7, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 27 + shake, y + 11, 4, 2);
    } else {
        // Corrupted enemy - alien horror style
        const pulse = Math.sin(time / 150) * 0.3 + 0.7;
        const wavey = Math.sin(time / 100) * 2;

        if (enemy.type === 'bloater') {
            // Bloater - large, bloated form
            ctx.fillStyle = '#4a4030';
            ctx.beginPath();
            ctx.ellipse(x + 16 + shake, y + 16, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pustules
            ctx.fillStyle = '#6a5040';
            ctx.beginPath();
            ctx.arc(x + 10 + shake, y + 12, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 22 + shake, y + 14, 3, 0, Math.PI * 2);
            ctx.fill();

            // Glowing weak points
            ctx.fillStyle = `rgba(255,100,50,${pulse})`;
            ctx.beginPath();
            ctx.arc(x + 16 + shake, y + 18, 4, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x + 11 + shake, y + 8, 3, 2);
            ctx.fillRect(x + 18 + shake, y + 8, 3, 2);

        } else if (enemy.type === 'stalker') {
            // Stalker - thin, fast predator
            ctx.fillStyle = enemy.color;

            // Thin body
            ctx.fillRect(x + 12 + shake, y + 8 + wavey, 8, 16);

            // Long limbs
            ctx.fillStyle = '#3a2a3a';
            ctx.fillRect(x + 4 + shake, y + 10 + wavey, 8, 3);
            ctx.fillRect(x + 20 + shake, y + 10 + wavey, 8, 3);
            ctx.fillRect(x + 10 + shake, y + 22, 5, 8);
            ctx.fillRect(x + 17 + shake, y + 22, 5, 8);

            // Claws
            ctx.fillStyle = '#8a6a6a';
            ctx.fillRect(x + 2 + shake, y + 10 + wavey, 3, 2);
            ctx.fillRect(x + 27 + shake, y + 10 + wavey, 3, 2);

            // Head
            ctx.fillStyle = '#4a3a4a';
            ctx.fillRect(x + 12 + shake, y + 2 + wavey, 8, 8);

            // Glowing eyes
            ctx.fillStyle = `rgba(255,80,80,${pulse})`;
            ctx.fillRect(x + 13 + shake, y + 4 + wavey, 3, 3);
            ctx.fillRect(x + 18 + shake, y + 4 + wavey, 3, 3);

        } else {
            // Possessed - twisted humanoid
            ctx.fillStyle = enemy.color;

            // Distorted body
            ctx.fillRect(x + 8 + shake + wavey, y + 6, 16, 18);

            // Twisted limbs
            ctx.fillStyle = '#5a3a4a';
            ctx.fillRect(x + 2 + shake, y + 8 + wavey, 7, 4);
            ctx.fillRect(x + 23 + shake, y + 10 - wavey, 7, 4);
            ctx.fillRect(x + 10 + shake, y + 22, 5, 8);
            ctx.fillRect(x + 17 + shake, y + 22, 5, 8);

            // Head
            ctx.fillStyle = '#5a4050';
            ctx.fillRect(x + 10 + shake, y + 2 + wavey/2, 12, 8);

            // Multiple glowing eyes
            ctx.fillStyle = `rgba(255,50,50,${pulse})`;
            ctx.fillRect(x + 11 + shake, y + 4 + wavey/2, 2, 2);
            ctx.fillRect(x + 15 + shake, y + 5 + wavey/2, 2, 2);
            ctx.fillRect(x + 19 + shake, y + 4 + wavey/2, 2, 2);

            // Mouth/tendrils
            ctx.fillStyle = '#3a2030';
            ctx.fillRect(x + 13 + shake, y + 8 + wavey/2, 6, 3);
        }
    }

    // Health bar background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - 1, y - 8, TILE_SIZE + 2, 6);

    // Health bar
    const hpPercent = enemy.hp / enemy.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#4a8a4a' : hpPercent > 0.25 ? '#8a8a4a' : '#8a4a4a';
    ctx.fillRect(x, y - 7, TILE_SIZE * hpPercent, 4);

    // Health bar border
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 8, TILE_SIZE + 2, 6);

    // Name tag
    ctx.fillStyle = '#aaa';
    ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, x + TILE_SIZE / 2, y - 10);

    // Attack indicator - laser line to player
    if (isAttacking) {
        const playerScreenX = 80 + (game.player.x - game.camera.x) * TILE_SIZE + TILE_SIZE / 2;
        const playerScreenY = 40 + (game.player.y - game.camera.y) * TILE_SIZE + TILE_SIZE / 2;

        // Outer glow
        ctx.strokeStyle = 'rgba(255,0,0,0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        ctx.lineTo(playerScreenX, playerScreenY);
        ctx.stroke();

        // Inner line
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        ctx.lineTo(playerScreenX, playerScreenY);
        ctx.stroke();

        // Impact flash
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r},${g},${b})`;
}

function renderParticle(x, y, particle) {
    const alpha = particle.life / particle.maxLife;

    switch (particle.type) {
        case 'muzzle':
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.fillRect(x + 10, y + 10, 12, 12);
            ctx.globalAlpha = 1;
            break;

        case 'blood':
            ctx.fillStyle = COLORS.blood;
            for (let i = 0; i < 5; i++) {
                const ox = Math.random() * 20 - 10;
                const oy = Math.random() * 20 - 10;
                ctx.fillRect(x + 16 + ox, y + 16 + oy, 4, 4);
            }
            break;

        case 'explosion':
            ctx.globalAlpha = alpha;
            const radius = (1 - alpha) * 40 + 10;
            ctx.fillStyle = COLORS.fireOrange;
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.fireYellow;
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            break;

        case 'transform':
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1;
            break;
    }
}

function applyCorruptionEffects() {
    if (game.corruption >= 400) {
        // Red tint overlay
        const intensity = Math.min(1, (game.corruption - 400) / 600);
        ctx.fillStyle = `rgba(60,0,0,${intensity * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (game.corruption >= 200 && Math.random() < 0.02) {
        // Occasional flicker
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function renderUI() {
    // Left panel - INVENTORY
    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(0, 0, 78, 180);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 76, 178);

    ctx.fillStyle = COLORS.uiTextBright;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('I INVENTORY', 6, 16);

    // Weapon slots
    for (let i = 0; i < 2; i++) {
        const weapon = game.player.weapons[i];
        const slotX = 6;
        const slotY = 26 + i * 50;

        ctx.fillStyle = i === game.player.currentWeapon ? '#2a4a4a' : '#1a2a2a';
        ctx.fillRect(slotX, slotY, 66, 44);
        ctx.strokeStyle = i === game.player.currentWeapon ? '#4a8a8a' : '#3a5a5a';
        ctx.strokeRect(slotX, slotY, 66, 44);

        if (weapon) {
            ctx.fillStyle = COLORS.uiText;
            ctx.font = '9px "Courier New"';
            ctx.fillText(weapon.name, slotX + 4, slotY + 14);

            if (weapon.ammoType) {
                ctx.fillText(`${weapon.ammo}/${game.player.ammo[weapon.ammoType]}`, slotX + 4, slotY + 28);
            }

            // Durability bar
            const durPercent = weapon.durability / weapon.maxDurability;
            ctx.fillStyle = '#333';
            ctx.fillRect(slotX + 4, slotY + 34, 58, 4);
            ctx.fillStyle = durPercent > 0.3 ? '#4a8a4a' : '#8a4a4a';
            ctx.fillRect(slotX + 4, slotY + 34, 58 * durPercent, 4);
        }

        // Slot number
        ctx.fillStyle = COLORS.uiTextDim;
        ctx.font = '8px "Courier New"';
        ctx.fillText(`${i + 1}`, slotX + 58, slotY + 12);
    }

    // Quick slots
    ctx.fillStyle = COLORS.uiTextDim;
    ctx.font = '9px "Courier New"';
    ctx.fillText('F/G Quick', 6, 140);

    for (let i = 0; i < 2; i++) {
        const item = game.player.quickSlots[i];
        const slotX = 6 + i * 35;
        const slotY = 148;

        ctx.fillStyle = '#1a2a2a';
        ctx.fillRect(slotX, slotY, 30, 26);
        ctx.strokeStyle = '#3a5a5a';
        ctx.strokeRect(slotX, slotY, 30, 26);

        if (item && item.count > 0) {
            ctx.fillStyle = item.type === 'medkit' ? '#ff6666' : '#aaffaa';
            ctx.font = '8px "Courier New"';
            ctx.fillText(item.type.slice(0, 4), slotX + 2, slotY + 12);
            ctx.fillText(`x${item.count}`, slotX + 2, slotY + 22);
        }
    }

    // Top panel - Stats
    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(80, 0, 640, 38);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(80, 1, 638, 36);

    // Turn counter
    ctx.fillStyle = COLORS.uiText;
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`TURN: ${game.turn}`, 90, 14);

    // Room indicator
    ctx.fillStyle = COLORS.uiTextDim;
    ctx.fillText(`STATION ${game.rooms.length} ROOMS`, 90, 30);

    // Alteration/Corruption meter (right side of top panel - like reference)
    ctx.fillStyle = '#1a1515';
    ctx.fillRect(520, 4, 190, 30);
    ctx.strokeStyle = '#5a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(520, 4, 190, 30);

    ctx.fillStyle = '#aa6666';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('ALTERATION', 528, 16);

    const corruptionThreshold = CORRUPTION_THRESHOLDS.find(t => game.corruption < t.level) || CORRUPTION_THRESHOLDS[CORRUPTION_THRESHOLDS.length - 1];

    // Corruption value in red
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`${game.corruption}`, 702, 28);

    // Corruption bar (segmented style like reference)
    const corruptPercent = Math.min(1, game.corruption / 1000);
    const segments = 20;
    const segWidth = 7;
    const segGap = 1;
    for (let i = 0; i < segments; i++) {
        const segFilled = i / segments < corruptPercent;
        ctx.fillStyle = segFilled ?
            (game.corruption < 400 ? '#4a8a4a' :
             game.corruption < 600 ? '#8a8a4a' :
             game.corruption < 800 ? '#aa6a4a' : '#aa4a4a') : '#2a2020';
        ctx.fillRect(528 + i * (segWidth + segGap), 20, segWidth, 8);
    }

    ctx.fillStyle = COLORS.uiTextDim;
    ctx.textAlign = 'left';
    ctx.font = '8px "Courier New"';
    ctx.fillText(corruptionThreshold.name, 528, 34);

    // Score (inside alteration panel)
    ctx.fillStyle = '#aaffaa';
    ctx.font = '9px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${game.score}`, 510, 14);
    ctx.fillStyle = COLORS.uiTextDim;
    ctx.fillText(`HIGH: ${game.highScore}`, 510, 28);

    // Bottom panel - Health and AP
    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(80, 522, 640, 78);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(80, 522, 638, 76);

    // Health
    ctx.fillStyle = COLORS.uiText;
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('H HEALTH MONITOR', 90, 540);

    // Segmented health bar (like reference)
    const hpPercent = game.player.hp / game.player.maxHp;
    const hpSegments = 20;
    const hpSegWidth = 9;
    const hpSegGap = 1;
    for (let i = 0; i < hpSegments; i++) {
        const segFilled = i / hpSegments < hpPercent;
        ctx.fillStyle = segFilled ?
            (hpPercent > 0.5 ? '#4a9a5a' :
             hpPercent > 0.25 ? '#9a9a4a' : '#9a4a4a') : '#2a2a2a';
        ctx.fillRect(90 + i * (hpSegWidth + hpSegGap), 548, hpSegWidth, 14);
    }

    // HP numbers
    ctx.fillStyle = COLORS.uiTextBright;
    ctx.fillText(`${game.player.hp}/${game.player.maxHp}`, 300, 560);

    // Bleeding indicator with pulsing
    if (game.player.bleeding) {
        const bleedPulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,68,68,${bleedPulse})`;
        ctx.fillText('BLEEDING', 360, 560);
    }

    // AP
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText(`AP: ${game.player.ap}/${game.player.stance.ap}`, 90, 585);

    // AP pips
    for (let i = 0; i < game.player.stance.ap; i++) {
        ctx.fillStyle = i < game.player.ap ? '#4a8a4a' : '#333';
        ctx.fillRect(150 + i * 20, 574, 14, 14);
    }

    // Stance
    ctx.fillStyle = COLORS.uiTextDim;
    ctx.fillText(`STANCE: ${game.player.stance.name}`, 240, 585);

    // Controls hint
    ctx.fillStyle = COLORS.uiTextDim;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText('R:Reload  ENTER:End Turn  Q:Debug', 710, 540);
    ctx.fillText('WASD:Move  1/2:Weapon  F/G:Items', 710, 555);

    // Current room/position
    ctx.textAlign = 'left';
    ctx.fillText(`POS: ${game.player.x},${game.player.y}`, 450, 585);

    // Extraction distance
    if (game.extractionPoint) {
        const dist = Math.abs(game.extractionPoint.x - game.player.x) + Math.abs(game.extractionPoint.y - game.player.y);
        ctx.fillStyle = dist < 10 ? '#4aaa4a' : COLORS.uiTextDim;
        ctx.fillText(`EXTRACT: ${dist} tiles`, 550, 585);
    }

    // Right panel - mini info
    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(722, 40, 78, 482);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(722, 40, 76, 480);

    ctx.fillStyle = COLORS.uiTextBright;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('C CLASS', 728, 56);

    ctx.fillStyle = COLORS.uiTextDim;
    ctx.fillText('Mercenary', 728, 72);

    // Enemies alive
    const aliveEnemies = game.enemies.filter(e => e.hp > 0).length;
    ctx.fillText(`Enemies: ${aliveEnemies}`, 728, 100);

    // Ammo counts
    ctx.fillText('AMMO:', 728, 130);
    ctx.fillText(`9mm: ${game.player.ammo['9mm']}`, 728, 146);
    ctx.fillText(`12g: ${game.player.ammo['12g']}`, 728, 162);
}

function renderTurnIndicator() {
    const ti = game.turnIndicator;
    const alpha = Math.min(1, ti.timer / 30);

    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = game.state === STATE.ENEMY_TURN ? 'rgba(100,30,30,0.9)' : 'rgba(30,60,30,0.9)';
    ctx.fillRect(canvas.width / 2 - 120, 50, 240, 40);

    ctx.strokeStyle = game.state === STATE.ENEMY_TURN ? '#ff6666' : '#66ff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 120, 50, 240, 40);

    // Text
    ctx.fillStyle = game.state === STATE.ENEMY_TURN ? '#ff8888' : '#88ff88';
    ctx.font = 'bold 18px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(ti.text, canvas.width / 2, 76);

    ctx.globalAlpha = 1;
}

function renderDebugOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(85, 45, 200, 180);

    ctx.fillStyle = '#00ff00';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'left';

    const lines = [
        `=== DEBUG (Q) ===`,
        `State: ${game.state}`,
        `Player: ${game.player.x}, ${game.player.y}`,
        `HP: ${game.player.hp}/${game.player.maxHp}`,
        `AP: ${game.player.ap}/${game.player.stance.ap}`,
        `Turn: ${game.turn}`,
        `Corruption: ${game.corruption}`,
        `Enemies: ${game.enemies.filter(e => e.hp > 0).length}`,
        `Items: ${game.items.length}`,
        `Rooms: ${game.rooms.length}`,
        `Score: ${game.score}`,
        `FPS: ${Math.round(1000 / 16)}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 92, 62 + i * 14);
    });
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(40,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, 200);

    ctx.fillStyle = '#aa6666';
    ctx.font = '24px "Courier New"';
    ctx.fillText('Clone Lost', canvas.width / 2, 260);

    ctx.fillStyle = '#888888';
    ctx.font = '18px "Courier New"';
    ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, 320);
    ctx.fillText(`Turns Survived: ${game.turn}`, canvas.width / 2, 350);
    ctx.fillText(`Corruption Level: ${game.corruption}`, canvas.width / 2, 380);

    ctx.fillStyle = '#666666';
    ctx.font = '14px "Courier New"';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0,40,40,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ffaa';
    ctx.font = 'bold 48px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 200);

    ctx.fillStyle = '#66aa88';
    ctx.font = '24px "Courier New"';
    ctx.fillText('Mission Complete', canvas.width / 2, 260);

    ctx.fillStyle = '#aaffaa';
    ctx.font = '18px "Courier New"';
    ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, 320);
    ctx.fillText(`Turns: ${game.turn}`, canvas.width / 2, 350);

    if (game.score > game.highScore) {
        ctx.fillStyle = '#ffff44';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, 400);
    }

    ctx.fillStyle = '#666666';
    ctx.font = '14px "Courier New"';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, 450);
}

// ==================== GAME FLOW ====================
function startGame() {
    game.state = STATE.PLAYING;
    game.turn = 0;
    game.corruption = 0;
    game.score = 0;
    game.enemies = [];
    game.items = [];
    game.particles = [];
    game.floatingTexts = [];

    generateMap();
    updateVisibility();
    updateCamera();
}

function gameOver() {
    game.state = STATE.GAME_OVER;
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('quasimorph_highscore', game.highScore);
    }
}

function victory() {
    game.state = STATE.VICTORY;
    game.score += 500; // Extraction bonus

    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('quasimorph_highscore', game.highScore);
    }
}

// ==================== INPUT ====================
function handleKeyDown(e) {
    if (game.state === STATE.MENU) {
        if (e.code === 'Space') {
            startGame();
        }
        return;
    }

    if (game.state === STATE.GAME_OVER || game.state === STATE.VICTORY) {
        if (e.code === 'Space') {
            game.state = STATE.MENU;
        }
        return;
    }

    if (game.state === STATE.ENEMY_TURN) return;

    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'KeyS':
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'KeyA':
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'KeyD':
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
        case 'Digit1':
            game.player.currentWeapon = 0;
            break;
        case 'Digit2':
            if (game.player.weapons[1]) game.player.currentWeapon = 1;
            break;
        case 'KeyR':
            reloadWeapon();
            break;
        case 'KeyF':
            useQuickSlot(0);
            break;
        case 'KeyG':
            useQuickSlot(1);
            break;
        case 'Enter':
            if (game.state === STATE.PLAYING && game.player.ap >= 0) {
                endPlayerTurn();
            }
            break;
        case 'KeyQ':
            game.showDebug = !game.showDebug;
            break;
    }
}

function handleClick(e) {
    if (game.state !== STATE.PLAYING) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to tile coordinates
    const offsetX = 80;
    const offsetY = 40;

    if (clickX >= offsetX && clickX < offsetX + VIEW_WIDTH * TILE_SIZE &&
        clickY >= offsetY && clickY < offsetY + VIEW_HEIGHT * TILE_SIZE) {

        const tileX = Math.floor((clickX - offsetX) / TILE_SIZE) + game.camera.x;
        const tileY = Math.floor((clickY - offsetY) / TILE_SIZE) + game.camera.y;

        // Check for enemy at tile
        const enemy = getEnemyAt(tileX, tileY);
        if (enemy && game.visible[tileY][tileX]) {
            attackEnemy(enemy);
        }
    }
}

// ==================== MAIN LOOP ====================
function gameLoop() {
    updateParticles();
    render();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('click', handleClick);

// Start
gameLoop();
