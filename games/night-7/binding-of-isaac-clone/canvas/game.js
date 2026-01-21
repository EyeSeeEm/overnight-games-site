// Tears of the Basement - Binding of Isaac Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE = 32;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const WALL_THICKNESS = 2; // tiles
const VIEWPORT_WIDTH = (ROOM_WIDTH + WALL_THICKNESS * 2) * TILE; // 544
const VIEWPORT_HEIGHT = (ROOM_HEIGHT + WALL_THICKNESS * 2) * TILE; // 352
const ROOM_OFFSET_X = (canvas.width - VIEWPORT_WIDTH) / 2;
const ROOM_OFFSET_Y = 60;

// Game state
let gameState = 'menu'; // menu, playing, paused, gameover, victory
let currentFloor = 1;
let floorName = 'Basement';

// Room management
let rooms = {};
let currentRoom = { x: 0, y: 0 };
let roomTransition = null;
let transitionTimer = 0;

// Player
const player = {
    x: 0, y: 0,
    width: 24, height: 24,
    speed: 150,
    hp: 6, maxHp: 6, // half hearts
    soulHearts: 0,
    damage: 3.5,
    tearDelay: 0.4,
    range: 200,
    shotSpeed: 300,
    fireTimer: 0,
    invincible: 0,
    keys: 1,
    bombs: 1,
    coins: 0,
    items: [],
    activeItem: null,
    activeCharges: 0,
    maxCharges: 6,
    movePaused: 0
};

// Input
const keys = {};
const shootDir = { x: 0, y: 0 };

// Game objects
let tears = [];
let enemies = [];
let pickups = [];
let particles = [];
let floatingTexts = [];

// Room templates (obstacles and enemy spawns)
const ROOM_TEMPLATES = [
    // Empty room
    { obstacles: [], enemyCount: { min: 2, max: 4 } },
    // Rocks in corners
    { obstacles: [[2,2,'rock'],[10,2,'rock'],[2,4,'rock'],[10,4,'rock']], enemyCount: { min: 3, max: 5 } },
    // Central poop
    { obstacles: [[6,3,'poop'],[5,3,'poop'],[7,3,'poop']], enemyCount: { min: 2, max: 4 } },
    // Cross pattern
    { obstacles: [[6,1,'rock'],[6,5,'rock'],[3,3,'rock'],[9,3,'rock']], enemyCount: { min: 3, max: 5 } },
    // Pits
    { obstacles: [[4,2,'pit'],[8,2,'pit'],[4,4,'pit'],[8,4,'pit']], enemyCount: { min: 2, max: 4 } },
    // Wall barrier
    { obstacles: [[4,3,'rock'],[5,3,'rock'],[7,3,'rock'],[8,3,'rock']], enemyCount: { min: 3, max: 4 } },
    // Scattered rocks
    { obstacles: [[2,1,'rock'],[5,2,'rock'],[8,1,'rock'],[3,4,'rock'],[9,5,'rock'],[6,4,'poop']], enemyCount: { min: 4, max: 6 } },
    // Spikes center
    { obstacles: [[5,3,'spikes'],[6,3,'spikes'],[7,3,'spikes']], enemyCount: { min: 2, max: 3 } }
];

// Enemy types
const ENEMY_TYPES = {
    fly: { hp: 5, speed: 100, damage: 1, size: 16, color: '#88FF88', behavior: 'chase' },
    pooter: { hp: 8, speed: 60, damage: 1, size: 20, color: '#FF8888', behavior: 'shoot' },
    gaper: { hp: 12, speed: 80, damage: 2, size: 24, color: '#FFAA88', behavior: 'chase' },
    mulligan: { hp: 20, speed: 50, damage: 2, size: 28, color: '#AA8866', behavior: 'chase', onDeath: 'spawnFlies' },
    horf: { hp: 15, speed: 0, damage: 1, size: 24, color: '#66AA66', behavior: 'shootLine' },
    clotty: { hp: 25, speed: 40, damage: 1, size: 28, color: '#AA4444', behavior: 'shoot4way' },
    fatty: { hp: 40, speed: 30, damage: 2, size: 36, color: '#DDAA88', behavior: 'chase' },
    host: { hp: 30, speed: 0, damage: 1, size: 24, color: '#666666', behavior: 'host' }
};

// Boss types
const BOSS_TYPES = {
    monstro: { hp: 250, speed: 0, damage: 2, size: 64, color: '#CC6666', behavior: 'monstro' },
    duke: { hp: 200, speed: 50, damage: 2, size: 56, color: '#88AA44', behavior: 'duke' },
    momsHeart: { hp: 400, speed: 0, damage: 2, size: 80, color: '#FF4466', behavior: 'heart' }
};

// Items
const ITEMS = [
    { name: 'Sad Onion', effect: 'tears', value: -0.07, color: '#FFFF88' },
    { name: 'Inner Eye', effect: 'tripleShot', color: '#FF88FF' },
    { name: 'Magic Mushroom', effect: 'allStats', color: '#FF4444' },
    { name: 'Pentagram', effect: 'damage', value: 1, color: '#880000' },
    { name: 'Speed Ball', effect: 'speed', value: 30, color: '#88FFFF' },
    { name: 'Spoon Bender', effect: 'homing', color: '#FF88FF' },
    { name: 'Technology', effect: 'laser', color: '#4444FF' },
    { name: 'Cupids Arrow', effect: 'piercing', color: '#FFAAAA' },
    { name: 'Health Up', effect: 'health', value: 2, color: '#FF4444' },
    { name: 'Polyphemus', effect: 'bigTears', color: '#888888' }
];

// Colors
const COLORS = {
    wall: '#4A3A2A',
    floor: '#6B5B4B',
    door: '#8B7B6B',
    doorLocked: '#FFD700',
    rock: '#7A6A5A',
    poop: '#5A4A2A',
    pit: '#1A0A0A',
    spikes: '#888888',
    player: '#FFDDAA',
    tear: '#88CCFF',
    heart: '#FF4444',
    soulHeart: '#4488FF',
    emptyHeart: '#442222'
};

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'menu' && e.key === ' ') {
        startGame();
    }
    if (gameState === 'playing' && e.key === 'Escape') {
        gameState = 'paused';
    } else if (gameState === 'paused' && e.key === 'Escape') {
        gameState = 'playing';
    }
    if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
        resetGame();
        gameState = 'menu';
    }

    // Use bomb with E
    if (e.key === 'e' && gameState === 'playing' && player.bombs > 0) {
        placeBomb();
    }

    // Use active item with Space
    if (e.key === ' ' && gameState === 'playing' && player.activeItem && player.activeCharges >= player.maxCharges) {
        useActiveItem();
    }
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Start game
function startGame() {
    resetGame();
    gameState = 'playing';
    generateFloor();
}

function resetGame() {
    player.hp = 6;
    player.maxHp = 6;
    player.soulHearts = 0;
    player.damage = 3.5;
    player.tearDelay = 0.4;
    player.range = 200;
    player.shotSpeed = 300;
    player.speed = 150;
    player.keys = 1;
    player.bombs = 1;
    player.coins = 0;
    player.items = [];
    player.activeItem = null;
    player.activeCharges = 0;
    currentFloor = 1;
    floorName = 'Basement';
    rooms = {};
    currentRoom = { x: 0, y: 0 };
}

// Generate floor
function generateFloor() {
    rooms = {};
    tears = [];
    enemies = [];
    pickups = [];

    // Generate room layout (simple tree structure)
    const roomCount = 8 + currentFloor * 2;
    const positions = [[0, 0]];
    const directions = [[1,0],[-1,0],[0,1],[0,-1]];

    // Create spawn room (empty, no enemies)
    rooms['0,0'] = createRoom(0, 0, 'spawn');

    // Generate connected rooms
    let attempts = 0;
    while (Object.keys(rooms).length < roomCount && attempts < 1000) {
        attempts++;
        const basePos = positions[Math.floor(Math.random() * positions.length)];
        const dir = directions[Math.floor(Math.random() * 4)];
        const newX = basePos[0] + dir[0];
        const newY = basePos[1] + dir[1];
        const key = `${newX},${newY}`;

        if (!rooms[key]) {
            rooms[key] = createRoom(newX, newY, 'normal');
            positions.push([newX, newY]);
        }
    }

    // Place special rooms at dead ends
    const deadEnds = positions.filter(pos => {
        let connections = 0;
        for (const dir of directions) {
            if (rooms[`${pos[0]+dir[0]},${pos[1]+dir[1]}`]) connections++;
        }
        return connections === 1 && pos[0] !== 0 || pos[1] !== 0;
    });

    // Shuffle and assign special rooms
    shuffleArray(deadEnds);
    if (deadEnds.length > 0) {
        const treasurePos = deadEnds.shift();
        rooms[`${treasurePos[0]},${treasurePos[1]}`] = createRoom(treasurePos[0], treasurePos[1], 'treasure');
    }
    if (deadEnds.length > 0) {
        const bossPos = deadEnds.shift();
        rooms[`${bossPos[0]},${bossPos[1]}`] = createRoom(bossPos[0], bossPos[1], 'boss');
    }
    if (deadEnds.length > 0) {
        const shopPos = deadEnds.shift();
        rooms[`${shopPos[0]},${shopPos[1]}`] = createRoom(shopPos[0], shopPos[1], 'shop');
    }

    // Mark connected doors
    for (const key in rooms) {
        const [x, y] = key.split(',').map(Number);
        const room = rooms[key];
        room.doors = {
            north: rooms[`${x},${y-1}`] !== undefined,
            south: rooms[`${x},${y+1}`] !== undefined,
            east: rooms[`${x+1},${y}`] !== undefined,
            west: rooms[`${x-1},${y}`] !== undefined
        };
    }

    // Set player position in starting room
    currentRoom = { x: 0, y: 0 };
    const startRoom = rooms['0,0'];
    player.x = (ROOM_WIDTH / 2) * TILE;
    player.y = (ROOM_HEIGHT / 2) * TILE;
    startRoom.discovered = true;

    enterRoom();
}

function createRoom(x, y, type) {
    const template = ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];

    const room = {
        x, y, type,
        discovered: false,
        cleared: type === 'spawn' || type === 'treasure' || type === 'shop',
        obstacles: type === 'boss' ? [] : [...template.obstacles],
        enemySpawns: [],
        pickups: [],
        items: [],
        enemies: []
    };

    // Add enemy spawns for normal rooms
    if (type === 'normal') {
        const count = template.enemyCount.min + Math.floor(Math.random() * (template.enemyCount.max - template.enemyCount.min + 1));
        const enemyPool = getEnemyPool();
        for (let i = 0; i < count; i++) {
            room.enemySpawns.push({
                type: enemyPool[Math.floor(Math.random() * enemyPool.length)],
                x: 2 + Math.random() * (ROOM_WIDTH - 4),
                y: 1 + Math.random() * (ROOM_HEIGHT - 2)
            });
        }
    }

    // Add boss for boss room
    if (type === 'boss') {
        const bosses = ['monstro', 'duke', 'momsHeart'];
        room.bossType = currentFloor === 3 ? 'momsHeart' : bosses[Math.min(currentFloor - 1, 1)];
    }

    // Add item pedestal for treasure room
    if (type === 'treasure') {
        room.items.push({
            x: ROOM_WIDTH / 2 * TILE,
            y: ROOM_HEIGHT / 2 * TILE,
            item: ITEMS[Math.floor(Math.random() * ITEMS.length)],
            taken: false
        });
    }

    // Add shop items
    if (type === 'shop') {
        room.shopItems = [
            { x: 4 * TILE, y: 3 * TILE, item: ITEMS[Math.floor(Math.random() * ITEMS.length)], price: 15, taken: false },
            { x: 6 * TILE, y: 3 * TILE, type: 'heart', price: 3, taken: false },
            { x: 8 * TILE, y: 3 * TILE, type: 'key', price: 5, taken: false }
        ];
    }

    return room;
}

function getEnemyPool() {
    if (currentFloor === 1) return ['fly', 'gaper', 'pooter'];
    if (currentFloor === 2) return ['fly', 'gaper', 'pooter', 'clotty', 'fatty'];
    return ['gaper', 'pooter', 'clotty', 'fatty', 'mulligan', 'host'];
}

function enterRoom() {
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (!room) return;

    room.discovered = true;
    enemies = [];
    pickups = [];

    // Restore room state
    room.obstacles = room.obstacles.filter(o => !o.destroyed);

    // Spawn enemies if room not cleared
    if (!room.cleared && room.type === 'normal') {
        room.enemySpawns.forEach(spawn => {
            if (!spawn.killed) {
                spawnEnemy(spawn.type, spawn.x * TILE, spawn.y * TILE, spawn);
            }
        });
    }

    // Spawn boss
    if (room.type === 'boss' && !room.cleared) {
        spawnBoss(room.bossType);
    }

    // Restore pickups
    room.pickups.forEach(p => {
        if (!p.collected) {
            pickups.push({ ...p });
        }
    });

    // Brief movement pause
    player.movePaused = 0.2;
}

function spawnEnemy(type, x, y, spawnRef) {
    const template = ENEMY_TYPES[type];
    if (!template) return;

    enemies.push({
        type, x, y,
        hp: template.hp,
        maxHp: template.hp,
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        behavior: template.behavior,
        onDeath: template.onDeath,
        spawnRef,
        spawnTimer: 0.5, // Spawn animation
        state: 'spawning',
        shootTimer: 1 + Math.random(),
        hostUp: false,
        hostTimer: 0
    });
}

function spawnBoss(type) {
    const template = BOSS_TYPES[type];
    enemies.push({
        type, isBoss: true,
        x: ROOM_WIDTH / 2 * TILE,
        y: ROOM_HEIGHT / 2 * TILE,
        hp: template.hp,
        maxHp: template.hp,
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        behavior: template.behavior,
        state: 'idle',
        attackTimer: 2,
        phase: 1,
        jumpTarget: null
    });
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// Place bomb
function placeBomb() {
    player.bombs--;
    // Create explosion after delay
    setTimeout(() => {
        const bx = player.x;
        const by = player.y;

        // Damage enemies in radius
        enemies.forEach(e => {
            const dx = e.x - bx;
            const dy = e.y - by;
            if (dx*dx + dy*dy < 100*100) {
                e.hp -= 60;
            }
        });

        // Destroy obstacles
        const room = rooms[`${currentRoom.x},${currentRoom.y}`];
        room.obstacles = room.obstacles.filter(o => {
            const ox = (o[0] + 0.5) * TILE;
            const oy = (o[1] + 0.5) * TILE;
            const dx = ox - bx;
            const dy = oy - by;
            if (dx*dx + dy*dy < 80*80 && o[2] !== 'pit') {
                o.destroyed = true;
                return false;
            }
            return true;
        });

        // Explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: bx, y: by,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 0.5,
                color: '#FF8800',
                size: 8
            });
        }
    }, 1500);
}

// Use active item
function useActiveItem() {
    if (!player.activeItem) return;
    player.activeCharges = 0;
    addFloatingText(player.x, player.y - 30, player.activeItem.name + '!', '#FFFF00');
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5, vy: -40 });
}

// Update functions
function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateTears(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateRoomTransition(dt);
    checkRoomClear();
}

function updatePlayer(dt) {
    if (player.movePaused > 0) {
        player.movePaused -= dt;
        return;
    }

    // Movement (WASD)
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;

        const newX = player.x + dx * player.speed * dt;
        const newY = player.y + dy * player.speed * dt;

        // Collision with walls
        const margin = player.width / 2;
        if (newX > margin && newX < ROOM_WIDTH * TILE - margin) {
            if (!collidesWithObstacle(newX, player.y, player.width / 2)) {
                player.x = newX;
            }
        }
        if (newY > margin && newY < ROOM_HEIGHT * TILE - margin) {
            if (!collidesWithObstacle(player.x, newY, player.height / 2)) {
                player.y = newY;
            }
        }
    }

    // Shooting (Arrow keys)
    shootDir.x = 0;
    shootDir.y = 0;
    if (keys['arrowup']) shootDir.y = -1;
    if (keys['arrowdown']) shootDir.y = 1;
    if (keys['arrowleft']) shootDir.x = -1;
    if (keys['arrowright']) shootDir.x = 1;

    player.fireTimer -= dt;
    if ((shootDir.x !== 0 || shootDir.y !== 0) && player.fireTimer <= 0) {
        fireTear();
        player.fireTimer = player.tearDelay;
    }

    // Invincibility
    if (player.invincible > 0) player.invincible -= dt;

    // Check door transitions
    checkDoorCollision();

    // Check spikes
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (room) {
        room.obstacles.forEach(o => {
            if (o[2] === 'spikes') {
                const ox = (o[0] + 0.5) * TILE;
                const oy = (o[1] + 0.5) * TILE;
                const dx = player.x - ox;
                const dy = player.y - oy;
                if (Math.abs(dx) < TILE/2 + player.width/2 && Math.abs(dy) < TILE/2 + player.height/2) {
                    damagePlayer(1);
                }
            }
        });
    }
}

function collidesWithObstacle(x, y, radius) {
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (!room) return false;

    for (const o of room.obstacles) {
        if (o[2] === 'spikes') continue; // Can walk on spikes
        const ox = (o[0] + 0.5) * TILE;
        const oy = (o[1] + 0.5) * TILE;
        const dx = x - ox;
        const dy = y - oy;
        if (Math.abs(dx) < TILE/2 + radius && Math.abs(dy) < TILE/2 + radius) {
            return true;
        }
    }
    return false;
}

function fireTear() {
    const len = Math.sqrt(shootDir.x*shootDir.x + shootDir.y*shootDir.y);
    if (len === 0) return;

    const hasTripleShot = player.items.some(i => i.effect === 'tripleShot');
    const hasPiercing = player.items.some(i => i.effect === 'piercing');
    const hasHoming = player.items.some(i => i.effect === 'homing');
    const hasBigTears = player.items.some(i => i.effect === 'bigTears');

    const angles = hasTripleShot ? [-0.3, 0, 0.3] : [0];
    const baseAngle = Math.atan2(shootDir.y, shootDir.x);

    angles.forEach(offset => {
        const angle = baseAngle + offset;
        tears.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * player.shotSpeed,
            vy: Math.sin(angle) * player.shotSpeed,
            damage: player.damage * (hasBigTears ? 3 : 1),
            range: player.range,
            traveled: 0,
            piercing: hasPiercing,
            homing: hasHoming,
            size: hasBigTears ? 16 : 8,
            gravity: 50 // Slight arc
        });
    });
}

function checkDoorCollision() {
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (!room || !room.cleared) return;

    const doorWidth = TILE;
    const margin = 20;

    // North door
    if (room.doors.north && player.y < margin) {
        startTransition(0, -1, 'north');
    }
    // South door
    if (room.doors.south && player.y > ROOM_HEIGHT * TILE - margin) {
        startTransition(0, 1, 'south');
    }
    // East door
    if (room.doors.east && player.x > ROOM_WIDTH * TILE - margin) {
        startTransition(1, 0, 'east');
    }
    // West door
    if (room.doors.west && player.x < margin) {
        startTransition(-1, 0, 'west');
    }
}

function startTransition(dx, dy, fromDir) {
    currentRoom.x += dx;
    currentRoom.y += dy;

    // Position player at opposite door
    if (fromDir === 'north') player.y = ROOM_HEIGHT * TILE - TILE;
    if (fromDir === 'south') player.y = TILE;
    if (fromDir === 'east') player.x = TILE;
    if (fromDir === 'west') player.x = ROOM_WIDTH * TILE - TILE;

    enterRoom();
}

function updateTears(dt) {
    tears = tears.filter(t => {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.vy += t.gravity * dt; // Arc
        t.traveled += Math.sqrt(t.vx*t.vx + t.vy*t.vy) * dt;

        // Homing
        if (t.homing && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            enemies.forEach(e => {
                const d = Math.sqrt((e.x-t.x)**2 + (e.y-t.y)**2);
                if (d < closestDist) { closestDist = d; closest = e; }
            });
            if (closest && closestDist < 150) {
                const angle = Math.atan2(closest.y - t.y, closest.x - t.x);
                t.vx += Math.cos(angle) * 500 * dt;
                t.vy += Math.sin(angle) * 500 * dt;
            }
        }

        if (t.traveled > t.range) return false;
        if (t.x < 0 || t.x > ROOM_WIDTH * TILE || t.y < 0 || t.y > ROOM_HEIGHT * TILE) return false;

        // Hit obstacles
        const room = rooms[`${currentRoom.x},${currentRoom.y}`];
        if (room) {
            for (let i = room.obstacles.length - 1; i >= 0; i--) {
                const o = room.obstacles[i];
                const ox = (o[0] + 0.5) * TILE;
                const oy = (o[1] + 0.5) * TILE;
                if (Math.abs(t.x - ox) < TILE/2 && Math.abs(t.y - oy) < TILE/2) {
                    if (o[2] === 'poop') {
                        o.hp = (o.hp || 3) - 1;
                        if (o.hp <= 0) {
                            room.obstacles.splice(i, 1);
                            // Drop chance
                            if (Math.random() < 0.3) {
                                pickups.push({ type: 'coin', x: ox, y: oy, collected: false });
                            }
                        }
                        return false;
                    }
                    if (o[2] !== 'spikes' && o[2] !== 'pit') return false;
                }
            }
        }

        // Hit enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.state === 'spawning') continue;
            if (e.behavior === 'host' && !e.hostUp) continue;

            const dx = t.x - e.x;
            const dy = t.y - e.y;
            if (dx*dx + dy*dy < (t.size + e.size/2) ** 2) {
                e.hp -= t.damage;

                // Knockback
                const angle = Math.atan2(dy, dx);
                e.x += Math.cos(angle) * 10;
                e.y += Math.sin(angle) * 10;

                // Hit particles
                for (let j = 0; j < 3; j++) {
                    particles.push({
                        x: t.x, y: t.y,
                        vx: (Math.random()-0.5) * 100,
                        vy: (Math.random()-0.5) * 100,
                        life: 0.3,
                        color: e.color,
                        size: 4
                    });
                }

                if (!t.piercing) return false;
            }
        }

        return true;
    });
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Spawn animation
        if (e.state === 'spawning') {
            e.spawnTimer -= dt;
            if (e.spawnTimer <= 0) e.state = 'active';
            continue;
        }

        // Death check
        if (e.hp <= 0) {
            // On death effects
            if (e.onDeath === 'spawnFlies') {
                for (let j = 0; j < 3; j++) {
                    spawnEnemy('fly', e.x + (Math.random()-0.5)*30, e.y + (Math.random()-0.5)*30, null);
                }
            }

            // Mark spawn as killed
            if (e.spawnRef) e.spawnRef.killed = true;

            // Drop pickup
            const dropRoll = Math.random();
            if (dropRoll < 0.2) {
                const type = Math.random() < 0.5 ? 'heart' : (Math.random() < 0.5 ? 'coin' : 'bomb');
                pickups.push({ type, x: e.x, y: e.y, collected: false });
                const room = rooms[`${currentRoom.x},${currentRoom.y}`];
                if (room) room.pickups.push({ type, x: e.x, y: e.y, collected: false });
            }

            // Boss drop
            if (e.isBoss) {
                // Item pedestal
                pickups.push({ type: 'item', x: e.x, y: e.y + 40, item: ITEMS[Math.floor(Math.random() * ITEMS.length)], collected: false });

                // Check for victory
                if (e.type === 'momsHeart') {
                    setTimeout(() => { gameState = 'victory'; }, 2000);
                }
            }

            enemies.splice(i, 1);
            continue;
        }

        // AI behaviors
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (e.isBoss) {
            updateBossAI(e, dt, dx, dy, dist);
        } else {
            updateEnemyAI(e, dt, dx, dy, dist);
        }

        // Contact damage
        if (dist < e.size/2 + player.width/2) {
            damagePlayer(e.damage);
        }
    }
}

function updateEnemyAI(e, dt, dx, dy, dist) {
    if (e.behavior === 'chase') {
        if (dist > 20) {
            const speed = e.speed * dt;
            e.x += (dx/dist) * speed;
            e.y += (dy/dist) * speed;
        }
    } else if (e.behavior === 'shoot') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
            shootEnemyTear(e, dx, dy, dist);
            e.shootTimer = 1.5 + Math.random();
        }
        // Move slowly
        if (dist > 100) {
            e.x += (dx/dist) * e.speed * dt;
            e.y += (dy/dist) * e.speed * dt;
        }
    } else if (e.behavior === 'shoot4way') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
            [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(angle => {
                shootEnemyTearAngle(e, angle);
            });
            e.shootTimer = 2;
        }
    } else if (e.behavior === 'shootLine') {
        e.shootTimer -= dt;
        if ((Math.abs(dx) < 20 || Math.abs(dy) < 20) && e.shootTimer <= 0) {
            shootEnemyTear(e, dx, dy, dist);
            e.shootTimer = 1;
        }
    } else if (e.behavior === 'host') {
        e.hostTimer -= dt;
        if (e.hostTimer <= 0) {
            e.hostUp = !e.hostUp;
            e.hostTimer = e.hostUp ? 1 : 2;
            if (e.hostUp && dist < 200) {
                shootEnemyTear(e, dx, dy, dist);
            }
        }
    }

    // Keep in bounds
    e.x = Math.max(e.size/2, Math.min(ROOM_WIDTH * TILE - e.size/2, e.x));
    e.y = Math.max(e.size/2, Math.min(ROOM_HEIGHT * TILE - e.size/2, e.y));
}

function updateBossAI(e, dt, dx, dy, dist) {
    e.attackTimer -= dt;

    if (e.behavior === 'monstro') {
        if (e.state === 'idle' && e.attackTimer <= 0) {
            e.state = Math.random() < 0.5 ? 'jumping' : 'spitting';
            e.attackTimer = 1;
            if (e.state === 'jumping') {
                e.jumpTarget = { x: player.x, y: player.y };
            }
        }

        if (e.state === 'jumping') {
            e.attackTimer -= dt;
            if (e.attackTimer > 0.5) {
                // Rising
                e.y -= 150 * dt;
            } else if (e.attackTimer > 0) {
                // Falling toward target
                e.x += (e.jumpTarget.x - e.x) * 3 * dt;
                e.y += 200 * dt;
            } else {
                e.state = 'idle';
                e.attackTimer = 1.5;
                // Land burst
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    shootEnemyTearAngle(e, angle, 150);
                }
            }
        }

        if (e.state === 'spitting') {
            if (e.attackTimer <= 0) {
                // Spit arc of tears
                for (let i = 0; i < 5; i++) {
                    const spread = (i - 2) * 0.3;
                    const angle = Math.atan2(dy, dx) + spread;
                    shootEnemyTearAngle(e, angle, 200);
                }
                e.state = 'idle';
                e.attackTimer = 2;
            }
        }
    } else if (e.behavior === 'duke') {
        // Spawn flies and move slowly
        if (e.attackTimer <= 0) {
            for (let i = 0; i < 3; i++) {
                spawnEnemy('fly', e.x + (Math.random()-0.5)*50, e.y + (Math.random()-0.5)*50, null);
            }
            e.attackTimer = 4;
        }
        if (dist > 50) {
            e.x += (dx/dist) * e.speed * dt;
            e.y += (dy/dist) * e.speed * dt;
        }
    } else if (e.behavior === 'heart') {
        // Shoots in patterns, spawns enemies
        if (e.attackTimer <= 0) {
            e.phase = (e.phase % 3) + 1;

            if (e.phase === 1) {
                // 8-way shot
                for (let i = 0; i < 8; i++) {
                    shootEnemyTearAngle(e, (i/8) * Math.PI * 2, 180);
                }
            } else if (e.phase === 2) {
                // Spawn enemies
                spawnEnemy('clotty', e.x - 80, e.y, null);
                spawnEnemy('clotty', e.x + 80, e.y, null);
            } else {
                // Spiral shot
                for (let i = 0; i < 12; i++) {
                    setTimeout(() => {
                        shootEnemyTearAngle(e, (i/12) * Math.PI * 2 + Date.now()/1000, 150);
                    }, i * 100);
                }
            }
            e.attackTimer = 3;
        }
    }
}

function shootEnemyTear(e, dx, dy, dist) {
    if (dist === 0) return;
    tears.push({
        x: e.x, y: e.y,
        vx: (dx/dist) * 150,
        vy: (dy/dist) * 150,
        damage: e.damage,
        range: 300,
        traveled: 0,
        isEnemy: true,
        size: 8,
        gravity: 0
    });
}

function shootEnemyTearAngle(e, angle, speed = 150) {
    tears.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: e.damage || 1,
        range: 300,
        traveled: 0,
        isEnemy: true,
        size: 8,
        gravity: 0
    });
}

function damagePlayer(amount) {
    if (player.invincible > 0) return;

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

    player.invincible = 1;

    // Flash effect
    particles.push({
        x: player.x, y: player.y,
        vx: 0, vy: 0,
        life: 0.2,
        color: '#FF0000',
        size: 40
    });

    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

function updatePickups(dt) {
    pickups = pickups.filter(p => {
        if (p.collected) return false;

        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (dx*dx + dy*dy < 30*30) {
            p.collected = true;

            if (p.type === 'heart') {
                if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + 2);
                    addFloatingText(p.x, p.y, '+1 Heart', COLORS.heart);
                }
            } else if (p.type === 'soulHeart') {
                player.soulHearts += 2;
                addFloatingText(p.x, p.y, '+1 Soul', COLORS.soulHeart);
            } else if (p.type === 'coin') {
                player.coins++;
                addFloatingText(p.x, p.y, '+1 Coin', '#FFDD00');
            } else if (p.type === 'bomb') {
                player.bombs++;
                addFloatingText(p.x, p.y, '+1 Bomb', '#888888');
            } else if (p.type === 'key') {
                player.keys++;
                addFloatingText(p.x, p.y, '+1 Key', '#FFFF00');
            } else if (p.type === 'item' && p.item) {
                applyItem(p.item);
            }

            return false;
        }
        return true;
    });

    // Check item pedestals
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (room && room.items) {
        room.items.forEach(pedestal => {
            if (pedestal.taken) return;
            const dx = player.x - pedestal.x;
            const dy = player.y - pedestal.y;
            if (dx*dx + dy*dy < 40*40) {
                pedestal.taken = true;
                applyItem(pedestal.item);
            }
        });
    }

    // Check shop items
    if (room && room.shopItems) {
        room.shopItems.forEach(si => {
            if (si.taken) return;
            const dx = player.x - si.x;
            const dy = player.y - si.y;
            if (dx*dx + dy*dy < 40*40 && player.coins >= si.price) {
                player.coins -= si.price;
                si.taken = true;

                if (si.item) {
                    applyItem(si.item);
                } else if (si.type === 'heart') {
                    player.hp = Math.min(player.maxHp, player.hp + 2);
                } else if (si.type === 'key') {
                    player.keys++;
                }
            }
        });
    }
}

function applyItem(item) {
    player.items.push(item);
    addFloatingText(player.x, player.y - 40, item.name + '!', item.color);

    if (item.effect === 'tears') player.tearDelay = Math.max(0.1, player.tearDelay + item.value);
    if (item.effect === 'damage') player.damage += item.value;
    if (item.effect === 'speed') player.speed += item.value;
    if (item.effect === 'health') {
        player.maxHp += item.value;
        player.hp += item.value;
    }
    if (item.effect === 'allStats') {
        player.damage += 1;
        player.speed += 20;
        player.maxHp += 2;
        player.hp += 2;
    }

    // Add charge for active items
    player.activeCharges = Math.min(player.maxCharges, player.activeCharges + 1);
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        return p.life > 0;
    });
}

function updateFloatingTexts(dt) {
    floatingTexts = floatingTexts.filter(t => {
        t.y += t.vy * dt;
        t.life -= dt;
        return t.life > 0;
    });
}

function updateRoomTransition(dt) {
    // Placeholder for transition animation
}

function checkRoomClear() {
    const room = rooms[`${currentRoom.x},${currentRoom.y}`];
    if (!room || room.cleared) return;

    const activeEnemies = enemies.filter(e => e.state !== 'spawning');
    if (activeEnemies.length === 0 && room.enemySpawns.every(s => s.killed)) {
        room.cleared = true;

        // Boss room cleared - trapdoor to next floor
        if (room.type === 'boss' && currentFloor < 3) {
            pickups.push({ type: 'trapdoor', x: ROOM_WIDTH/2 * TILE, y: ROOM_HEIGHT/2 * TILE + 60, collected: false });
        }
    }
}

// Check for trapdoor interaction
function checkTrapdoor() {
    pickups.forEach(p => {
        if (p.type === 'trapdoor' && !p.collected) {
            const dx = player.x - p.x;
            const dy = player.y - p.y;
            if (dx*dx + dy*dy < 30*30) {
                p.collected = true;
                currentFloor++;
                floorName = ['Basement', 'Caves', 'Depths'][currentFloor - 1] || 'Depths';
                generateFloor();
            }
        }
    });
}

// Render functions
function render() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
        return;
    }

    if (gameState === 'playing' || gameState === 'paused') {
        renderRoom();
        renderEntities();
        renderHUD();
        renderMinimap();
    }

    if (gameState === 'paused') renderPause();
    if (gameState === 'gameover') renderGameOver();
    if (gameState === 'victory') renderVictory();
}

function renderRoom() {
    ctx.save();
    ctx.translate(ROOM_OFFSET_X + WALL_THICKNESS * TILE, ROOM_OFFSET_Y + WALL_THICKNESS * TILE);

    const room = rooms[`${currentRoom.x},${currentRoom.y}`];

    // Floor
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, ROOM_WIDTH * TILE, ROOM_HEIGHT * TILE);

    // Floor pattern
    ctx.fillStyle = '#5A4A3A';
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
            }
        }
    }

    // Walls
    ctx.fillStyle = COLORS.wall;
    // Top wall
    ctx.fillRect(-WALL_THICKNESS * TILE, -WALL_THICKNESS * TILE, (ROOM_WIDTH + WALL_THICKNESS * 2) * TILE, WALL_THICKNESS * TILE);
    // Bottom wall
    ctx.fillRect(-WALL_THICKNESS * TILE, ROOM_HEIGHT * TILE, (ROOM_WIDTH + WALL_THICKNESS * 2) * TILE, WALL_THICKNESS * TILE);
    // Left wall
    ctx.fillRect(-WALL_THICKNESS * TILE, 0, WALL_THICKNESS * TILE, ROOM_HEIGHT * TILE);
    // Right wall
    ctx.fillRect(ROOM_WIDTH * TILE, 0, WALL_THICKNESS * TILE, ROOM_HEIGHT * TILE);

    // Doors
    if (room) {
        const doorSize = TILE * 1.5;
        ctx.fillStyle = room.cleared ? COLORS.door : '#444';

        if (room.doors.north) {
            ctx.fillRect(ROOM_WIDTH/2 * TILE - doorSize/2, -WALL_THICKNESS * TILE, doorSize, WALL_THICKNESS * TILE);
        }
        if (room.doors.south) {
            ctx.fillRect(ROOM_WIDTH/2 * TILE - doorSize/2, ROOM_HEIGHT * TILE, doorSize, WALL_THICKNESS * TILE);
        }
        if (room.doors.east) {
            ctx.fillRect(ROOM_WIDTH * TILE, ROOM_HEIGHT/2 * TILE - doorSize/2, WALL_THICKNESS * TILE, doorSize);
        }
        if (room.doors.west) {
            ctx.fillRect(-WALL_THICKNESS * TILE, ROOM_HEIGHT/2 * TILE - doorSize/2, WALL_THICKNESS * TILE, doorSize);
        }
    }

    // Obstacles
    if (room) {
        room.obstacles.forEach(o => {
            const ox = o[0] * TILE;
            const oy = o[1] * TILE;

            if (o[2] === 'rock') {
                ctx.fillStyle = COLORS.rock;
                ctx.fillRect(ox + 2, oy + 2, TILE - 4, TILE - 4);
                ctx.fillStyle = '#8A7A6A';
                ctx.fillRect(ox + 4, oy + 4, TILE - 12, TILE - 12);
            } else if (o[2] === 'poop') {
                ctx.fillStyle = COLORS.poop;
                ctx.beginPath();
                ctx.arc(ox + TILE/2, oy + TILE/2, TILE/2 - 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (o[2] === 'pit') {
                ctx.fillStyle = COLORS.pit;
                ctx.fillRect(ox + 1, oy + 1, TILE - 2, TILE - 2);
            } else if (o[2] === 'spikes') {
                ctx.fillStyle = COLORS.spikes;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    const sx = ox + 4 + (i % 2) * 12;
                    const sy = oy + 4 + Math.floor(i / 2) * 12;
                    ctx.moveTo(sx, sy + 10);
                    ctx.lineTo(sx + 6, sy);
                    ctx.lineTo(sx + 12, sy + 10);
                    ctx.fill();
                }
            }
        });

        // Item pedestals
        if (room.items) {
            room.items.forEach(pedestal => {
                if (pedestal.taken) return;

                // Pedestal base
                ctx.fillStyle = '#888';
                ctx.fillRect(pedestal.x - 16, pedestal.y + 8, 32, 8);
                ctx.fillRect(pedestal.x - 12, pedestal.y, 24, 8);

                // Item
                ctx.fillStyle = pedestal.item.color;
                ctx.beginPath();
                ctx.arc(pedestal.x, pedestal.y - 8, 12, 0, Math.PI * 2);
                ctx.fill();

                // Item name
                ctx.fillStyle = '#FFF';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(pedestal.item.name, pedestal.x, pedestal.y + 28);
            });
        }

        // Shop items
        if (room.shopItems) {
            room.shopItems.forEach(si => {
                if (si.taken) return;

                ctx.fillStyle = si.item ? si.item.color : (si.type === 'heart' ? COLORS.heart : '#FFD700');
                ctx.beginPath();
                ctx.arc(si.x, si.y, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFD700';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`$${si.price}`, si.x, si.y + 24);
            });
        }
    }

    ctx.restore();
}

function renderEntities() {
    ctx.save();
    ctx.translate(ROOM_OFFSET_X + WALL_THICKNESS * TILE, ROOM_OFFSET_Y + WALL_THICKNESS * TILE);

    // Pickups
    pickups.forEach(p => {
        if (p.collected) return;

        ctx.beginPath();
        if (p.type === 'heart') {
            ctx.fillStyle = COLORS.heart;
            drawHeart(p.x, p.y, 10);
        } else if (p.type === 'soulHeart') {
            ctx.fillStyle = COLORS.soulHeart;
            drawHeart(p.x, p.y, 10);
        } else if (p.type === 'coin') {
            ctx.fillStyle = '#FFD700';
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'bomb') {
            ctx.fillStyle = '#444';
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#F00';
            ctx.fillRect(p.x - 2, p.y - 15, 4, 8);
        } else if (p.type === 'key') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(p.x - 3, p.y - 10, 6, 14);
            ctx.arc(p.x, p.y - 14, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'item' && p.item) {
            ctx.fillStyle = p.item.color;
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'trapdoor') {
            ctx.fillStyle = '#000';
            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    // Tears (player)
    tears.filter(t => !t.isEnemy).forEach(t => {
        ctx.fillStyle = COLORS.tear;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemy tears
    tears.filter(t => t.isEnemy).forEach(t => {
        ctx.fillStyle = '#FF6666';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    enemies.forEach(e => {
        ctx.globalAlpha = e.state === 'spawning' ? 0.5 : 1;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(e.x - e.size/6, e.y - e.size/6, e.size/6, 0, Math.PI * 2);
        ctx.arc(e.x + e.size/6, e.y - e.size/6, e.size/6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(e.x - e.size/6, e.y - e.size/6, e.size/12, 0, Math.PI * 2);
        ctx.arc(e.x + e.size/6, e.y - e.size/6, e.size/12, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // Boss health bar
        if (e.isBoss) {
            ctx.fillStyle = '#444';
            ctx.fillRect(ROOM_WIDTH * TILE / 2 - 100, ROOM_HEIGHT * TILE + 20, 200, 12);
            ctx.fillStyle = '#F44';
            ctx.fillRect(ROOM_WIDTH * TILE / 2 - 100, ROOM_HEIGHT * TILE + 20, 200 * (e.hp / e.maxHp), 12);
        }
    });

    // Player
    ctx.globalAlpha = player.invincible > 0 ? (Math.sin(Date.now() / 50) > 0 ? 0.5 : 1) : 1;

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Player eyes (cry effect)
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 2, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tears streaming
    ctx.fillStyle = COLORS.tear;
    ctx.fillRect(player.x - 6, player.y + 2, 3, 8);
    ctx.fillRect(player.x + 4, player.y + 2, 3, 8);

    ctx.globalAlpha = 1;

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Floating texts
    floatingTexts.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size/3);
    ctx.bezierCurveTo(x - size, y - size/2, x - size, y + size/2, x, y + size);
    ctx.bezierCurveTo(x + size, y + size/2, x + size, y - size/2, x, y + size/3);
    ctx.fill();
}

function renderHUD() {
    // Hearts
    let hx = 20;
    const hy = 20;

    // Red hearts
    const fullRedHearts = Math.floor(player.hp / 2);
    const halfRedHeart = player.hp % 2;
    const emptyHearts = Math.floor(player.maxHp / 2) - fullRedHearts - halfRedHeart;

    for (let i = 0; i < fullRedHearts; i++) {
        ctx.fillStyle = COLORS.heart;
        drawHeart(hx + i * 26, hy, 10);
    }
    if (halfRedHeart) {
        ctx.fillStyle = COLORS.heart;
        drawHeart(hx + fullRedHearts * 26, hy, 10);
        ctx.fillStyle = COLORS.emptyHeart;
        ctx.fillRect(hx + fullRedHearts * 26, hy - 10, 13, 25);
    }
    for (let i = 0; i < emptyHearts; i++) {
        ctx.fillStyle = COLORS.emptyHeart;
        drawHeart(hx + (fullRedHearts + halfRedHeart + i) * 26, hy, 10);
    }

    // Soul hearts
    const soulHeartCount = Math.ceil(player.soulHearts / 2);
    for (let i = 0; i < soulHeartCount; i++) {
        ctx.fillStyle = COLORS.soulHeart;
        drawHeart(hx + (Math.ceil(player.maxHp/2) + i) * 26, hy, 10);
    }

    // Stats
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG: ${player.damage.toFixed(1)}`, 20, 55);
    ctx.fillText(`SPD: ${(player.speed / 100).toFixed(1)}`, 100, 55);

    // Consumables
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Key: ${player.keys}`, 20, canvas.height - 40);
    ctx.fillStyle = '#888';
    ctx.fillText(`Bomb: ${player.bombs}`, 20, canvas.height - 20);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Coin: ${player.coins}`, 120, canvas.height - 30);

    // Floor name
    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${floorName} ${currentFloor}`, canvas.width / 2, 30);

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('WASD: Move | Arrows: Shoot | E: Bomb', canvas.width - 20, canvas.height - 10);
}

function renderMinimap() {
    const mapX = canvas.width - 130;
    const mapY = 20;
    const cellSize = 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 10, mapY - 10, 120, 120);

    for (const key in rooms) {
        const room = rooms[key];
        if (!room.discovered) continue;

        const [rx, ry] = key.split(',').map(Number);
        const mx = mapX + (rx - currentRoom.x + 4) * cellSize;
        const my = mapY + (ry - currentRoom.y + 4) * cellSize;

        // Room color based on type
        if (room.type === 'boss') ctx.fillStyle = '#F44';
        else if (room.type === 'treasure') ctx.fillStyle = '#FF0'; // Yellow for treasure
        else if (room.type === 'shop') ctx.fillStyle = '#4FF';
        else ctx.fillStyle = '#666';

        ctx.fillRect(mx, my, cellSize - 2, cellSize - 2);

        // Current room indicator
        if (rx === currentRoom.x && ry === currentRoom.y) {
            ctx.fillStyle = '#FFF';
            ctx.fillRect(mx + 2, my + 2, cellSize - 6, cellSize - 6);
        }
    }
}

function renderMenu() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEARS OF THE', canvas.width/2, 180);
    ctx.fillText('BASEMENT', canvas.width/2, 240);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('A Binding of Isaac Tribute', canvas.width/2, 290);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('WASD - Move', canvas.width/2, 380);
    ctx.fillText('Arrow Keys - Shoot', canvas.width/2, 410);
    ctx.fillText('E - Place Bomb', canvas.width/2, 440);

    ctx.fillStyle = '#FF0';
    ctx.font = '24px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width/2, 520);
}

function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    ctx.font = '18px monospace';
    ctx.fillText('Press ESC to Resume', canvas.width/2, canvas.height/2 + 40);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width/2, canvas.height/2 - 40);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText(`Reached: ${floorName} ${currentFloor}`, canvas.width/2, canvas.height/2 + 20);

    ctx.fillStyle = '#FFF';
    ctx.fillText('Press SPACE to Return to Menu', canvas.width/2, canvas.height/2 + 80);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4F4';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('You defeated Mom\'s Heart!', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('Press SPACE to Return to Menu', canvas.width/2, canvas.height/2 + 80);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    checkTrapdoor();
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
