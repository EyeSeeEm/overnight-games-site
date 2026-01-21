// Tears of the Basement - Binding of Isaac Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const ROOM_COLS = 13;
const ROOM_ROWS = 7;
const TILE_SIZE = 48;
const ROOM_WIDTH = ROOM_COLS * TILE_SIZE;  // 624
const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 336
const ROOM_OFFSET_X = (800 - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = (600 - ROOM_HEIGHT) / 2 + 40;

// Game state
let gameState = 'playing';
let currentFloor = 1;
let floorNames = ['Basement', 'Caves', 'Depths'];

// Player stats
const player = {
    x: 0, y: 0,
    width: 32, height: 32,
    speed: 3,
    damage: 3.5,
    tearDelay: 15, // frames between shots
    tearSpeed: 8,
    range: 200,
    hp: 6, maxHp: 6, // half-hearts (6 = 3 full hearts)
    soulHearts: 0,
    coins: 0,
    bombs: 1,
    keys: 1,
    iFrames: 0,
    lastShot: 0,
    activeItem: null,
    passiveItems: []
};

// Input
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
});
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Tears (projectiles)
let tears = [];
let enemyTears = [];

// Current room data
let currentRoomX = 0;
let currentRoomY = 0;
let floors = [];
let currentFloorData = null;

// Room templates (13x7 grids, 0=empty, 1=rock, 2=poop, 3=hole, 4=fire, 5=spikes)
const roomTemplates = {
    normal: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,2,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0,0,0,2,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0,0,0,2,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
    ],
    treasure: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
    ],
    shop: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
    ],
    boss: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0]],
    ]
};

// Items
const itemPool = [
    { name: 'Sad Onion', effect: 'tears', value: 2, desc: 'Tears +' },
    { name: 'Magic Mushroom', effect: 'damage', value: 1.5, desc: 'Damage Up!' },
    { name: 'Health Up', effect: 'hp', value: 2, desc: '+1 Heart' },
    { name: 'Speed Ball', effect: 'speed', value: 0.5, desc: 'Speed Up!' },
    { name: 'Pentagram', effect: 'damage', value: 1, desc: 'Damage Up!' },
    { name: 'Spoon Bender', effect: 'homing', value: true, desc: 'Homing Tears!' },
    { name: 'Cupids Arrow', effect: 'piercing', value: true, desc: 'Piercing!' },
    { name: 'PHD', effect: 'hp', value: 2, desc: '+1 Heart' },
];

// Enemies
let enemies = [];

function createEnemy(type, x, y) {
    const templates = {
        fly: { hp: 5, speed: 2.5, damage: 1, size: 20, color: '#444', behavior: 'chase', shootInterval: 0 },
        pooter: { hp: 8, speed: 1.5, damage: 1, size: 24, color: '#884488', behavior: 'shoot', shootInterval: 90 },
        gaper: { hp: 12, speed: 1.8, damage: 2, size: 28, color: '#cc8866', behavior: 'chase', shootInterval: 0 },
        mulligan: { hp: 20, speed: 1.2, damage: 2, size: 30, color: '#88aa66', behavior: 'chase', shootInterval: 0, spawnsOnDeath: 'fly' },
        horf: { hp: 15, speed: 0, damage: 1, size: 26, color: '#aa6644', behavior: 'stationary_shoot', shootInterval: 60 },
        clotty: { hp: 25, speed: 1, damage: 1, size: 28, color: '#cc4444', behavior: 'shoot_4way', shootInterval: 80 },
        fatty: { hp: 40, speed: 0.8, damage: 2, size: 36, color: '#ccaa88', behavior: 'chase', shootInterval: 0 },
        host: { hp: 30, speed: 0, damage: 1, size: 28, color: '#666666', behavior: 'pop_shoot', shootInterval: 100, hidden: true }
    };
    const t = templates[type] || templates.fly;
    return {
        x, y, type, ...t,
        maxHp: t.hp,
        lastShot: 0,
        spawnTimer: 30, // spawn animation frames
        state: 'spawning'
    };
}

// Bosses
function createBoss(type, x, y) {
    const bosses = {
        monstro: { hp: 250, maxHp: 250, speed: 0, damage: 2, size: 64, color: '#aa6666', phase: 'idle' },
        larry: { hp: 180, maxHp: 180, speed: 2, damage: 2, size: 40, color: '#668844', segments: [] },
        duke: { hp: 200, maxHp: 200, speed: 1, damage: 2, size: 56, color: '#446644', phase: 'idle' }
    };
    const b = bosses[type] || bosses.monstro;
    return { x, y, type, ...b, isBoss: true, lastAttack: 0, attackCooldown: 120 };
}

// Pickups
let pickups = [];

function createPickup(type, x, y) {
    return { x, y, type, collected: false };
}

// Floor generation
function generateFloor(floorNum) {
    const floor = {
        rooms: {},
        discovered: {},
        cleared: {}
    };

    // Generate a simple connected map
    const roomCount = 8 + floorNum * 2;
    const positions = [[0, 0]];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    floor.rooms['0,0'] = { type: 'start', template: roomTemplates.normal[0], enemies: [], pickups: [], items: [], cleared: true };
    floor.discovered['0,0'] = true;
    floor.cleared['0,0'] = true;

    let placed = 1;
    let attempts = 0;

    while (placed < roomCount && attempts < 200) {
        const base = positions[Math.floor(Math.random() * positions.length)];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const newX = base[0] + dir[0];
        const newY = base[1] + dir[1];
        const key = `${newX},${newY}`;

        if (!floor.rooms[key]) {
            const roomType = determineRoomType(placed, roomCount);
            floor.rooms[key] = createRoom(roomType, floorNum);
            positions.push([newX, newY]);
            placed++;
        }
        attempts++;
    }

    // Add boss room at furthest point
    let furthest = [0, 0];
    let maxDist = 0;
    for (const pos of positions) {
        const dist = Math.abs(pos[0]) + Math.abs(pos[1]);
        if (dist > maxDist) {
            maxDist = dist;
            furthest = pos;
        }
    }
    const bossKey = `${furthest[0]},${furthest[1]}`;
    floor.rooms[bossKey] = createRoom('boss', floorNum);

    // Ensure treasure and shop rooms exist
    let hasTreasure = false, hasShop = false;
    for (const key in floor.rooms) {
        if (floor.rooms[key].type === 'treasure') hasTreasure = true;
        if (floor.rooms[key].type === 'shop') hasShop = true;
    }

    // Add missing special rooms
    for (const pos of positions) {
        const key = `${pos[0]},${pos[1]}`;
        if (!hasTreasure && floor.rooms[key].type === 'normal') {
            floor.rooms[key] = createRoom('treasure', floorNum);
            hasTreasure = true;
        } else if (!hasShop && floor.rooms[key].type === 'normal' && hasTreasure) {
            floor.rooms[key] = createRoom('shop', floorNum);
            hasShop = true;
        }
        if (hasTreasure && hasShop) break;
    }

    return floor;
}

function determineRoomType(index, total) {
    if (index === 1) return 'treasure';
    if (index === 2) return 'shop';
    return 'normal';
}

function createRoom(type, floorNum) {
    const room = {
        type,
        template: JSON.parse(JSON.stringify(roomTemplates[type] ? roomTemplates[type][0] : roomTemplates.normal[Math.floor(Math.random() * roomTemplates.normal.length)])),
        enemies: [],
        pickups: [],
        items: [],
        cleared: type === 'treasure' || type === 'shop'
    };

    // Spawn enemies for normal rooms
    if (type === 'normal') {
        const enemyCount = 2 + Math.floor(Math.random() * 3) + floorNum;
        const enemyTypes = ['fly', 'pooter', 'gaper', 'mulligan', 'clotty'];
        for (let i = 0; i < enemyCount; i++) {
            const ex = ROOM_OFFSET_X + 100 + Math.random() * (ROOM_WIDTH - 200);
            const ey = ROOM_OFFSET_Y + 60 + Math.random() * (ROOM_HEIGHT - 120);
            room.enemies.push(createEnemy(enemyTypes[Math.floor(Math.random() * enemyTypes.length)], ex, ey));
        }
    }

    // Add boss to boss room
    if (type === 'boss') {
        const bossTypes = ['monstro', 'duke', 'larry'];
        room.enemies.push(createBoss(bossTypes[floorNum - 1] || 'monstro',
            ROOM_OFFSET_X + ROOM_WIDTH / 2, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - 50));
    }

    // Add item to treasure room
    if (type === 'treasure') {
        const item = itemPool[Math.floor(Math.random() * itemPool.length)];
        room.items.push({
            ...item,
            x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
            collected: false
        });
    }

    // Add shop items
    if (type === 'shop') {
        for (let i = 0; i < 3; i++) {
            room.items.push({
                name: ['Heart', 'Bomb', 'Key'][i],
                effect: ['heal', 'bomb', 'key'][i],
                value: 1,
                price: [5, 5, 5][i],
                x: ROOM_OFFSET_X + 200 + i * 150,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
                collected: false,
                isShopItem: true
            });
        }
    }

    return room;
}

function getCurrentRoom() {
    const key = `${currentRoomX},${currentRoomY}`;
    return currentFloorData?.rooms[key];
}

// Player spawning position based on entry direction
let entryDirection = null;

function spawnPlayerInRoom(direction) {
    const cx = ROOM_OFFSET_X + ROOM_WIDTH / 2;
    const cy = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

    switch (direction) {
        case 'north':
            player.x = cx;
            player.y = ROOM_OFFSET_Y + ROOM_HEIGHT - 60;
            break;
        case 'south':
            player.x = cx;
            player.y = ROOM_OFFSET_Y + 60;
            break;
        case 'east':
            player.x = ROOM_OFFSET_X + 60;
            player.y = cy;
            break;
        case 'west':
            player.x = ROOM_OFFSET_X + ROOM_WIDTH - 60;
            player.y = cy;
            break;
        default:
            player.x = cx;
            player.y = cy;
    }
}

// Room transition
let transitionTimer = 0;
let transitionDir = null;

function changeRoom(direction) {
    const dx = direction === 'east' ? 1 : direction === 'west' ? -1 : 0;
    const dy = direction === 'south' ? 1 : direction === 'north' ? -1 : 0;

    const newKey = `${currentRoomX + dx},${currentRoomY + dy}`;
    if (currentFloorData.rooms[newKey]) {
        currentRoomX += dx;
        currentRoomY += dy;
        currentFloorData.discovered[newKey] = true;

        // Load room state
        const room = getCurrentRoom();
        enemies = [...room.enemies];
        pickups = [...room.pickups];

        // Spawn player at entry point
        const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' };
        spawnPlayerInRoom(opposite[direction]);

        tears = [];
        enemyTears = [];
        transitionTimer = 15; // Brief pause
    }
}

// Update functions
function update() {
    if (gameState !== 'playing') return;

    if (transitionTimer > 0) {
        transitionTimer--;
        return;
    }

    updatePlayer();
    updateTears();
    updateEnemies();
    updatePickups();
    checkRoomCleared();
    checkRoomTransition();
}

function updatePlayer() {
    // Movement (WASD)
    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const newX = player.x + dx * player.speed;
    const newY = player.y + dy * player.speed;

    // Room bounds collision
    if (newX > ROOM_OFFSET_X + 20 && newX < ROOM_OFFSET_X + ROOM_WIDTH - 20) {
        if (!checkTileCollision(newX, player.y)) player.x = newX;
    }
    if (newY > ROOM_OFFSET_Y + 20 && newY < ROOM_OFFSET_Y + ROOM_HEIGHT - 20) {
        if (!checkTileCollision(player.x, newY)) player.y = newY;
    }

    // Shooting (Arrow keys)
    let shootDx = 0, shootDy = 0;
    if (keys['ArrowUp']) shootDy = -1;
    if (keys['ArrowDown']) shootDy = 1;
    if (keys['ArrowLeft']) shootDx = -1;
    if (keys['ArrowRight']) shootDx = 1;

    if ((shootDx !== 0 || shootDy !== 0) && player.lastShot <= 0) {
        shootTear(shootDx, shootDy);
        player.lastShot = player.tearDelay;
    }

    if (player.lastShot > 0) player.lastShot--;
    if (player.iFrames > 0) player.iFrames--;
}

function checkTileCollision(x, y) {
    const room = getCurrentRoom();
    if (!room) return false;

    const tileX = Math.floor((x - ROOM_OFFSET_X) / TILE_SIZE);
    const tileY = Math.floor((y - ROOM_OFFSET_Y) / TILE_SIZE);

    if (tileX < 0 || tileX >= ROOM_COLS || tileY < 0 || tileY >= ROOM_ROWS) return true;

    const tile = room.template[tileY]?.[tileX];
    return tile === 1 || tile === 2; // Rock or poop
}

function shootTear(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    tears.push({
        x: player.x,
        y: player.y,
        vx: (dx / len) * player.tearSpeed,
        vy: (dy / len) * player.tearSpeed,
        damage: player.damage,
        range: player.range,
        traveled: 0,
        gravity: 0.1,
        homing: player.passiveItems.some(i => i.effect === 'homing'),
        piercing: player.passiveItems.some(i => i.effect === 'piercing')
    });
}

function updateTears() {
    for (let i = tears.length - 1; i >= 0; i--) {
        const t = tears[i];

        // Homing
        if (t.homing && enemies.length > 0) {
            let closest = null, minDist = 200;
            for (const e of enemies) {
                const dist = Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
                if (dist < minDist) { closest = e; minDist = dist; }
            }
            if (closest) {
                const angle = Math.atan2(closest.y - t.y, closest.x - t.x);
                t.vx += Math.cos(angle) * 0.3;
                t.vy += Math.sin(angle) * 0.3;
            }
        }

        t.x += t.vx;
        t.y += t.vy;
        t.vy += t.gravity; // Arc physics
        t.traveled += Math.sqrt(t.vx * t.vx + t.vy * t.vy);

        // Range check
        if (t.traveled > t.range) {
            tears.splice(i, 1);
            continue;
        }

        // Wall collision
        if (checkTileCollision(t.x, t.y)) {
            // Damage poop
            const room = getCurrentRoom();
            const tileX = Math.floor((t.x - ROOM_OFFSET_X) / TILE_SIZE);
            const tileY = Math.floor((t.y - ROOM_OFFSET_Y) / TILE_SIZE);
            if (room?.template[tileY]?.[tileX] === 2) {
                room.template[tileY][tileX] = 0; // Destroy poop
            }
            tears.splice(i, 1);
            continue;
        }

        // Enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.state === 'spawning') continue;

            const dist = Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
            if (dist < e.size / 2 + 8) {
                e.hp -= t.damage;
                if (!t.piercing) {
                    tears.splice(i, 1);
                }

                if (e.hp <= 0) {
                    // Death
                    if (e.spawnsOnDeath) {
                        for (let k = 0; k < 3; k++) {
                            enemies.push(createEnemy('fly', e.x + (Math.random() - 0.5) * 30, e.y + (Math.random() - 0.5) * 30));
                        }
                    }
                    // Drop chance
                    if (Math.random() < 0.25) {
                        const dropTypes = ['heart', 'coin', 'bomb', 'key'];
                        pickups.push(createPickup(dropTypes[Math.floor(Math.random() * dropTypes.length)], e.x, e.y));
                    }
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy tears
    for (let i = enemyTears.length - 1; i >= 0; i--) {
        const t = enemyTears[i];
        t.x += t.vx;
        t.y += t.vy;
        t.traveled += Math.sqrt(t.vx * t.vx + t.vy * t.vy);

        if (t.traveled > 300 || checkTileCollision(t.x, t.y)) {
            enemyTears.splice(i, 1);
            continue;
        }

        // Player collision
        const dist = Math.sqrt((t.x - player.x) ** 2 + (t.y - player.y) ** 2);
        if (dist < player.width / 2 + 6 && player.iFrames <= 0) {
            damagePlayer(t.damage);
            enemyTears.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (const e of enemies) {
        if (e.state === 'spawning') {
            e.spawnTimer--;
            if (e.spawnTimer <= 0) e.state = 'active';
            continue;
        }

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Behavior
        if (e.isBoss) {
            updateBoss(e);
        } else {
            switch (e.behavior) {
                case 'chase':
                    if (dist > 30) {
                        e.x += (dx / dist) * e.speed;
                        e.y += (dy / dist) * e.speed;
                    }
                    break;
                case 'shoot':
                    if (dist > 100) {
                        e.x += (dx / dist) * e.speed * 0.5;
                        e.y += (dy / dist) * e.speed * 0.5;
                    }
                    e.lastShot++;
                    if (e.lastShot >= e.shootInterval) {
                        enemyTears.push({
                            x: e.x, y: e.y,
                            vx: (dx / dist) * 4,
                            vy: (dy / dist) * 4,
                            damage: e.damage,
                            traveled: 0
                        });
                        e.lastShot = 0;
                    }
                    break;
                case 'shoot_4way':
                    e.lastShot++;
                    if (e.lastShot >= e.shootInterval) {
                        for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                            enemyTears.push({
                                x: e.x, y: e.y,
                                vx: dir[0] * 5,
                                vy: dir[1] * 5,
                                damage: e.damage,
                                traveled: 0
                            });
                        }
                        e.lastShot = 0;
                    }
                    break;
                case 'stationary_shoot':
                    if (Math.abs(dx) < 20 || Math.abs(dy) < 20) {
                        e.lastShot++;
                        if (e.lastShot >= e.shootInterval) {
                            enemyTears.push({
                                x: e.x, y: e.y,
                                vx: (dx / dist) * 5,
                                vy: (dy / dist) * 5,
                                damage: e.damage,
                                traveled: 0
                            });
                            e.lastShot = 0;
                        }
                    }
                    break;
            }

            // Tile collision for enemies
            if (checkTileCollision(e.x, e.y)) {
                e.x -= (dx / dist) * e.speed;
                e.y -= (dy / dist) * e.speed;
            }
        }

        // Contact damage
        if (dist < e.size / 2 + player.width / 2 && player.iFrames <= 0) {
            damagePlayer(e.damage);
        }
    }
}

function updateBoss(boss) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    boss.lastAttack++;

    if (boss.type === 'monstro') {
        if (boss.phase === 'idle' && boss.lastAttack > boss.attackCooldown) {
            boss.phase = Math.random() > 0.5 ? 'jump' : 'spit';
            boss.lastAttack = 0;
            boss.jumpTarget = { x: player.x, y: player.y };
        }

        if (boss.phase === 'jump') {
            if (boss.lastAttack < 30) {
                // Rising
            } else if (boss.lastAttack < 60) {
                // Falling
                boss.x += (boss.jumpTarget.x - boss.x) * 0.1;
                boss.y += (boss.jumpTarget.y - boss.y) * 0.1;
            } else {
                // Land burst
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    enemyTears.push({
                        x: boss.x, y: boss.y,
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4,
                        damage: boss.damage,
                        traveled: 0
                    });
                }
                boss.phase = 'idle';
            }
        }

        if (boss.phase === 'spit') {
            if (boss.lastAttack === 15) {
                for (let i = 0; i < 5; i++) {
                    const spread = (i - 2) * 0.3;
                    const angle = Math.atan2(dy, dx) + spread;
                    enemyTears.push({
                        x: boss.x, y: boss.y,
                        vx: Math.cos(angle) * 5,
                        vy: Math.sin(angle) * 5,
                        damage: boss.damage,
                        traveled: 0
                    });
                }
            }
            if (boss.lastAttack > 30) boss.phase = 'idle';
        }
    } else if (boss.type === 'duke') {
        // Duke spawns flies and charges
        if (boss.phase === 'idle' && boss.lastAttack > boss.attackCooldown) {
            boss.phase = Math.random() > 0.5 ? 'spawn' : 'charge';
            boss.lastAttack = 0;
        }

        if (boss.phase === 'spawn') {
            if (boss.lastAttack === 30) {
                for (let i = 0; i < 4; i++) {
                    enemies.push(createEnemy('fly', boss.x + (Math.random() - 0.5) * 50, boss.y + (Math.random() - 0.5) * 50));
                }
            }
            if (boss.lastAttack > 60) boss.phase = 'idle';
        }

        if (boss.phase === 'charge') {
            boss.x += (dx / dist) * 3;
            boss.y += (dy / dist) * 3;
            if (boss.lastAttack > 90) boss.phase = 'idle';
        }
    }
}

function damagePlayer(amount) {
    if (player.iFrames > 0) return;

    // Damage soul hearts first
    if (player.soulHearts > 0) {
        player.soulHearts -= amount;
        if (player.soulHearts < 0) {
            player.hp += player.soulHearts;
            player.soulHearts = 0;
        }
    } else {
        player.hp -= amount;
    }

    player.iFrames = 60; // 1 second

    if (player.hp <= 0) {
        gameState = 'dead';
    }
}

function updatePickups() {
    const room = getCurrentRoom();
    if (!room) return;

    for (const p of room.pickups.concat(pickups)) {
        if (p.collected) continue;

        const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
        if (dist < 30) {
            p.collected = true;
            switch (p.type) {
                case 'heart': player.hp = Math.min(player.maxHp, player.hp + 2); break;
                case 'half_heart': player.hp = Math.min(player.maxHp, player.hp + 1); break;
                case 'soul': player.soulHearts += 2; break;
                case 'coin': player.coins++; break;
                case 'nickel': player.coins += 5; break;
                case 'bomb': player.bombs++; break;
                case 'key': player.keys++; break;
            }
        }
    }

    // Items
    for (const item of room.items) {
        if (item.collected) continue;

        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
        if (dist < 40) {
            if (item.isShopItem) {
                if (player.coins >= item.price && keys['e']) {
                    player.coins -= item.price;
                    applyItem(item);
                    item.collected = true;
                }
            } else if (keys['e']) {
                applyItem(item);
                item.collected = true;
            }
        }
    }
}

function applyItem(item) {
    switch (item.effect) {
        case 'tears': player.tearDelay = Math.max(5, player.tearDelay - item.value); break;
        case 'damage': player.damage += item.value; break;
        case 'hp': player.maxHp += item.value; player.hp += item.value; break;
        case 'speed': player.speed += item.value; break;
        case 'homing':
        case 'piercing':
            player.passiveItems.push(item);
            break;
        case 'heal': player.hp = Math.min(player.maxHp, player.hp + 2); break;
        case 'bomb': player.bombs++; break;
        case 'key': player.keys++; break;
    }
}

function checkRoomCleared() {
    const room = getCurrentRoom();
    if (!room || room.cleared) return;

    if (enemies.length === 0) {
        room.cleared = true;
        room.enemies = [];
        room.pickups = [...pickups];
        currentFloorData.cleared[`${currentRoomX},${currentRoomY}`] = true;

        // Spawn reward
        if (Math.random() < 0.3) {
            pickups.push(createPickup('coin', ROOM_OFFSET_X + ROOM_WIDTH / 2, ROOM_OFFSET_Y + ROOM_HEIGHT / 2));
        }

        // Boss cleared - spawn trapdoor
        if (room.type === 'boss') {
            room.trapdoor = { x: ROOM_OFFSET_X + ROOM_WIDTH / 2, y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2 };
        }
    }
}

function checkRoomTransition() {
    const room = getCurrentRoom();
    if (!room?.cleared) return;

    // Check trapdoor
    if (room.trapdoor) {
        const dist = Math.sqrt((player.x - room.trapdoor.x) ** 2 + (player.y - room.trapdoor.y) ** 2);
        if (dist < 30 && keys['e']) {
            if (currentFloor < 3) {
                currentFloor++;
                currentFloorData = generateFloor(currentFloor);
                currentRoomX = 0;
                currentRoomY = 0;
                spawnPlayerInRoom(null);
                const startRoom = getCurrentRoom();
                enemies = [...startRoom.enemies];
                pickups = [...startRoom.pickups];
                tears = [];
                enemyTears = [];
            } else {
                gameState = 'won';
            }
        }
    }

    // Door transitions
    const doorWidth = 48;

    // North door
    if (player.y < ROOM_OFFSET_Y + 10 && Math.abs(player.x - (ROOM_OFFSET_X + ROOM_WIDTH / 2)) < doorWidth) {
        const nextKey = `${currentRoomX},${currentRoomY - 1}`;
        if (currentFloorData.rooms[nextKey]) {
            changeRoom('north');
        }
    }
    // South door
    if (player.y > ROOM_OFFSET_Y + ROOM_HEIGHT - 10 && Math.abs(player.x - (ROOM_OFFSET_X + ROOM_WIDTH / 2)) < doorWidth) {
        const nextKey = `${currentRoomX},${currentRoomY + 1}`;
        if (currentFloorData.rooms[nextKey]) {
            changeRoom('south');
        }
    }
    // West door
    if (player.x < ROOM_OFFSET_X + 10 && Math.abs(player.y - (ROOM_OFFSET_Y + ROOM_HEIGHT / 2)) < doorWidth) {
        const nextKey = `${currentRoomX - 1},${currentRoomY}`;
        if (currentFloorData.rooms[nextKey]) {
            changeRoom('west');
        }
    }
    // East door
    if (player.x > ROOM_OFFSET_X + ROOM_WIDTH - 10 && Math.abs(player.y - (ROOM_OFFSET_Y + ROOM_HEIGHT / 2)) < doorWidth) {
        const nextKey = `${currentRoomX + 1},${currentRoomY}`;
        if (currentFloorData.rooms[nextKey]) {
            changeRoom('east');
        }
    }
}

// Rendering
function render() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderRoom();
    renderTears();
    renderEnemies();
    renderPickups();
    renderItems();
    renderPlayer();
    renderHUD();
    renderMinimap();

    if (gameState === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', 400, 280);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Press R to restart', 400, 340);
    }

    if (gameState === 'won') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', 400, 280);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText("You defeated Mom's Heart!", 400, 340);
    }
}

function renderRoom() {
    const room = getCurrentRoom();
    if (!room) return;

    // Floor
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);

    // Walls
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(ROOM_OFFSET_X - 16, ROOM_OFFSET_Y - 16, ROOM_WIDTH + 32, 16);
    ctx.fillRect(ROOM_OFFSET_X - 16, ROOM_OFFSET_Y + ROOM_HEIGHT, ROOM_WIDTH + 32, 16);
    ctx.fillRect(ROOM_OFFSET_X - 16, ROOM_OFFSET_Y, 16, ROOM_HEIGHT);
    ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH, ROOM_OFFSET_Y, 16, ROOM_HEIGHT);

    // Doors
    const dirs = [[0, -1, 'north'], [0, 1, 'south'], [-1, 0, 'west'], [1, 0, 'east']];
    for (const [dx, dy, dir] of dirs) {
        const nextKey = `${currentRoomX + dx},${currentRoomY + dy}`;
        if (currentFloorData?.rooms[nextKey]) {
            ctx.fillStyle = room.cleared ? '#664422' : '#442211';
            if (dir === 'north') ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - 24, ROOM_OFFSET_Y - 16, 48, 20);
            if (dir === 'south') ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - 24, ROOM_OFFSET_Y + ROOM_HEIGHT - 4, 48, 20);
            if (dir === 'west') ctx.fillRect(ROOM_OFFSET_X - 16, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - 24, 20, 48);
            if (dir === 'east') ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH - 4, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - 24, 20, 48);
        }
    }

    // Tiles
    for (let y = 0; y < ROOM_ROWS; y++) {
        for (let x = 0; x < ROOM_COLS; x++) {
            const tile = room.template[y]?.[x];
            const tx = ROOM_OFFSET_X + x * TILE_SIZE;
            const ty = ROOM_OFFSET_Y + y * TILE_SIZE;

            if (tile === 1) {
                // Rock
                ctx.fillStyle = '#666';
                ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#555';
                ctx.fillRect(tx + 8, ty + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            } else if (tile === 2) {
                // Poop
                ctx.fillStyle = '#664422';
                ctx.beginPath();
                ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 3) {
                // Hole
                ctx.fillStyle = '#111';
                ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
    }

    // Trapdoor
    if (room.trapdoor) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(room.trapdoor.x, room.trapdoor.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('E', room.trapdoor.x, room.trapdoor.y + 4);
    }
}

function renderTears() {
    ctx.fillStyle = '#88ccff';
    for (const t of tears) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#ff6666';
    for (const t of enemyTears) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderEnemies() {
    for (const e of enemies) {
        ctx.save();

        // Spawn animation
        if (e.state === 'spawning') {
            ctx.globalAlpha = 1 - e.spawnTimer / 30;
            ctx.translate(e.x, e.y + e.spawnTimer);
        } else {
            ctx.translate(e.x, e.y);
        }

        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-e.size / 5, -e.size / 6, e.size / 6, 0, Math.PI * 2);
        ctx.arc(e.size / 5, -e.size / 6, e.size / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-e.size / 5, -e.size / 6, e.size / 10, 0, Math.PI * 2);
        ctx.arc(e.size / 5, -e.size / 6, e.size / 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Boss health bar
        if (e.isBoss) {
            ctx.fillStyle = '#333';
            ctx.fillRect(200, 560, 400, 20);
            ctx.fillStyle = '#cc4444';
            ctx.fillRect(200, 560, 400 * (e.hp / e.maxHp), 20);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(200, 560, 400, 20);
        }
    }
}

function renderPickups() {
    const room = getCurrentRoom();
    const allPickups = [...pickups, ...(room?.pickups || [])];

    for (const p of allPickups) {
        if (p.collected) continue;

        switch (p.type) {
            case 'heart':
                ctx.fillStyle = '#ff4444';
                drawHeart(p.x, p.y, 12);
                break;
            case 'half_heart':
                ctx.fillStyle = '#ff4444';
                drawHeart(p.x, p.y, 8);
                break;
            case 'soul':
                ctx.fillStyle = '#4488ff';
                drawHeart(p.x, p.y, 12);
                break;
            case 'coin':
                ctx.fillStyle = '#ffdd00';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bomb':
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(p.x - 2, p.y - 15, 4, 8);
                break;
            case 'key':
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(p.x - 3, p.y - 10, 6, 20);
                ctx.fillRect(p.x - 6, p.y + 5, 12, 4);
                break;
        }
    }
}

function renderItems() {
    const room = getCurrentRoom();
    if (!room) return;

    for (const item of room.items) {
        if (item.collected) continue;

        // Pedestal
        ctx.fillStyle = '#666';
        ctx.fillRect(item.x - 20, item.y + 10, 40, 15);

        // Item glow
        ctx.fillStyle = item.isShopItem ? '#44aa44' : '#ffaa00';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Item sprite (simplified)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Tooltip
        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
        if (dist < 80) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(item.x - 60, item.y - 50, 120, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, item.x, item.y - 35);
            ctx.fillStyle = '#aaa';
            ctx.fillText(item.desc || (item.isShopItem ? `$${item.price}` : 'E to pick up'), item.x, item.y - 20);
        }
    }
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Flash during i-frames
    if (player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Body
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, -4, 8, 0, Math.PI * 2);
    ctx.arc(6, -4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6, -2, 4, 0, Math.PI * 2);
    ctx.arc(6, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tears (crying)
    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.ellipse(-8, 8, 3, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 8, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.2, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size * 1.2, x + size, y + size, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
    ctx.fill();
}

function renderHUD() {
    // Hearts
    const heartSize = 20;
    const totalHearts = Math.ceil(player.maxHp / 2);

    for (let i = 0; i < totalHearts; i++) {
        const hx = 20 + i * 25;
        const hy = 25;
        const heartHp = Math.min(2, Math.max(0, player.hp - i * 2));

        ctx.fillStyle = '#333';
        drawHeart(hx, hy, heartSize / 2);

        if (heartHp >= 2) {
            ctx.fillStyle = '#ff4444';
            drawHeart(hx, hy, heartSize / 2);
        } else if (heartHp === 1) {
            ctx.fillStyle = '#ff4444';
            ctx.save();
            ctx.beginPath();
            ctx.rect(hx - heartSize, hy - heartSize, heartSize, heartSize * 2);
            ctx.clip();
            drawHeart(hx, hy, heartSize / 2);
            ctx.restore();
        }
    }

    // Soul hearts
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const hx = 20 + (totalHearts + i) * 25;
        const hy = 25;
        ctx.fillStyle = '#4488ff';
        drawHeart(hx, hy, heartSize / 2);
    }

    // Stats
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG: ${player.damage.toFixed(1)}`, 20, 70);
    ctx.fillText(`SPD: ${player.speed.toFixed(1)}`, 20, 90);

    // Resources
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`Keys: ${player.keys}`, 20, 120);
    ctx.fillStyle = '#888';
    ctx.fillText(`Bombs: ${player.bombs}`, 20, 140);
    ctx.fillStyle = '#ffdd00';
    ctx.fillText(`Coins: ${player.coins}`, 20, 160);

    // Floor name
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${floorNames[currentFloor - 1]} ${['I', 'II', 'III'][currentFloor - 1]}`, 400, 25);

    // Controls hint
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('WASD: Move | Arrows: Shoot | E: Interact', 400, 590);
}

function renderMinimap() {
    const mapX = 680;
    const mapY = 20;
    const roomSize = 16;
    const gap = 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(mapX - 10, mapY - 10, 120, 100);

    for (const key in currentFloorData?.rooms) {
        const [rx, ry] = key.split(',').map(Number);
        const mx = mapX + 50 + rx * (roomSize + gap);
        const my = mapY + 40 + ry * (roomSize + gap);

        const room = currentFloorData.rooms[key];
        const discovered = currentFloorData.discovered[key];

        if (!discovered) {
            ctx.fillStyle = '#222';
        } else if (rx === currentRoomX && ry === currentRoomY) {
            ctx.fillStyle = '#fff';
        } else if (room.type === 'treasure') {
            ctx.fillStyle = '#ffff00';
        } else if (room.type === 'shop') {
            ctx.fillStyle = '#00ffff';
        } else if (room.type === 'boss') {
            ctx.fillStyle = '#ff4444';
        } else if (room.cleared) {
            ctx.fillStyle = '#666';
        } else {
            ctx.fillStyle = '#884444';
        }

        ctx.fillRect(mx, my, roomSize, roomSize);
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize
function init() {
    currentFloorData = generateFloor(1);
    const startRoom = getCurrentRoom();
    spawnPlayerInRoom(null);
    enemies = [...startRoom.enemies];
    pickups = [...startRoom.pickups];

    // Restart handler
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'r' && (gameState === 'dead' || gameState === 'won')) {
            gameState = 'playing';
            currentFloor = 1;
            player.hp = player.maxHp = 6;
            player.soulHearts = 0;
            player.coins = 0;
            player.bombs = 1;
            player.keys = 1;
            player.damage = 3.5;
            player.speed = 3;
            player.tearDelay = 15;
            player.passiveItems = [];
            currentRoomX = 0;
            currentRoomY = 0;
            init();
        }
    });

    gameLoop();
}

init();
