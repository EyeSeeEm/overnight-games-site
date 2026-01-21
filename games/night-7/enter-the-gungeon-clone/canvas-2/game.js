// Enter the Gungeon Clone - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 24;
const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 11;

// Game state
const game = {
    state: 'menu', // menu, playing, shop, boss, gameover, victory
    floor: 1,
    floorNames: ['Keep of the Lead Lord', 'Gungeon Proper', 'The Forge'],
    currentRoom: null,
    rooms: [],
    exploredRooms: new Set(),
    keys: Object.create(null),
    mouse: { x: 400, y: 300 },
    mouseDown: false
};

// Player
const player = {
    x: 400, y: 300,
    vx: 0, vy: 0,
    width: 20, height: 20,
    speed: 180,
    hp: 6, maxHp: 6,
    armor: 1,
    blanks: 2,
    keys: 1,
    shells: 0,
    weapons: [],
    currentWeapon: 0,
    rolling: false,
    rollTime: 0,
    rollDuration: 0.5,
    rollIframes: 0.35,
    rollDir: { x: 0, y: 0 },
    rollCooldown: 0,
    invincible: false,
    invincibleTime: 0,
    reloading: false,
    reloadTime: 0,
    shootCooldown: 0
};

// Weapons database
const WEAPONS = {
    peashooter: { name: 'Peashooter', damage: 5, fireRate: 4, magSize: 6, ammo: Infinity, spread: 0.05, bulletSpeed: 400, tier: 'D' },
    m1911: { name: 'M1911', damage: 7, fireRate: 5, magSize: 10, ammo: 50, spread: 0.03, bulletSpeed: 450, tier: 'C' },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 1.5, magSize: 8, ammo: 40, pellets: 6, spread: 0.3, bulletSpeed: 350, tier: 'C' },
    ak47: { name: 'AK-47', damage: 6, fireRate: 8, magSize: 30, ammo: 120, spread: 0.1, bulletSpeed: 500, auto: true, tier: 'B' },
    demonHead: { name: 'Demon Head', damage: 25, fireRate: 2, magSize: 6, ammo: 30, spread: 0.02, bulletSpeed: 300, homing: true, tier: 'B' },
    railgun: { name: 'Railgun', damage: 70, fireRate: 0.5, magSize: 3, ammo: 15, spread: 0, bulletSpeed: 800, pierce: true, tier: 'A' }
};

// Enemies
let enemies = [];
let bullets = [];
let items = [];
let objects = [];

// Enemy types
const ENEMY_TYPES = {
    bulletKin: { hp: 15, speed: 60, damage: 1, fireRate: 1.5, color: '#c9a227', size: 16 },
    bandanaBullet: { hp: 15, speed: 50, damage: 1, fireRate: 1.2, spread: 3, color: '#e63946', size: 16 },
    shotgunKin: { hp: 25, speed: 45, damage: 1, fireRate: 0.8, pellets: 6, color: '#457b9d', size: 20 },
    veteranBullet: { hp: 20, speed: 80, damage: 1, fireRate: 2, color: '#6d6875', size: 16 },
    gunNut: { hp: 50, speed: 70, damage: 1, shieldFront: true, color: '#2d3436', size: 22 },
    grenadeKin: { hp: 20, speed: 40, damage: 2, grenade: true, color: '#00b894', size: 18 },
    // Floor 2
    mutantShotgun: { hp: 40, speed: 50, damage: 1, fireRate: 0.6, pellets: 8, color: '#6c5ce7', size: 22 },
    gunjurer: { hp: 40, speed: 30, damage: 0, summons: true, color: '#fd79a8', size: 18 },
    // Floor 3
    forgeBullet: { hp: 30, speed: 70, damage: 1, fireRate: 1.8, fireTrail: true, color: '#d63031', size: 18 },
    gunCultist: { hp: 50, speed: 40, damage: 1, fireRate: 1, pattern: 'circle', color: '#e17055', size: 20 }
};

// Boss data
const BOSSES = {
    bulletKing: { hp: 600, name: 'Bullet King', color: '#ffd700', size: 50 },
    beholster: { hp: 800, name: 'Beholster', color: '#9b59b6', size: 60 },
    highDragun: { hp: 1500, name: 'High Dragun', color: '#e74c3c', size: 80 }
};

let boss = null;
let bossPhase = 0;
let bossAttackTimer = 0;

// Initialize weapon
function createWeapon(type) {
    const base = WEAPONS[type];
    return {
        type, ...base,
        currentAmmo: base.magSize,
        totalAmmo: base.ammo
    };
}

// Room generation
function generateFloor(floorNum) {
    game.rooms = [];
    const roomCount = 6 + floorNum * 2;

    // Create rooms in a branching pattern
    const layout = [];
    layout.push({ x: 0, y: 0, type: 'start' });

    let positions = [{ x: 0, y: 0 }];
    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

    for (let i = 1; i < roomCount; i++) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const from = positions[Math.floor(Math.random() * positions.length)];
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const nx = from.x + dir.x;
            const ny = from.y + dir.y;

            if (!layout.find(r => r.x === nx && r.y === ny)) {
                let type = 'combat';
                if (i === roomCount - 1) type = 'boss';
                else if (i === 1) type = 'shop';
                else if (i === 2) type = 'treasure';

                layout.push({ x: nx, y: ny, type });
                positions.push({ x: nx, y: ny });
                placed = true;
            }
            attempts++;
        }
    }

    // Create room objects
    for (const roomData of layout) {
        const room = createRoom(roomData.type, floorNum);
        room.gridX = roomData.x;
        room.gridY = roomData.y;
        room.connections = [];
        game.rooms.push(room);
    }

    // Connect rooms
    for (let i = 0; i < game.rooms.length; i++) {
        for (let j = i + 1; j < game.rooms.length; j++) {
            const r1 = game.rooms[i];
            const r2 = game.rooms[j];
            const dx = Math.abs(r1.gridX - r2.gridX);
            const dy = Math.abs(r1.gridY - r2.gridY);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                r1.connections.push(j);
                r2.connections.push(i);
            }
        }
    }

    game.currentRoom = 0;
    game.exploredRooms.clear();
    game.exploredRooms.add(0);
    loadRoom(0);
}

function createRoom(type, floor) {
    const room = {
        type,
        cleared: type === 'start' || type === 'shop' || type === 'treasure',
        enemies: [],
        objects: [],
        items: []
    };

    // Add objects (cover)
    if (type === 'combat' || type === 'boss') {
        const objectCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < objectCount; i++) {
            const objType = Math.random();
            let obj;
            if (objType < 0.3) {
                obj = { type: 'pillar', x: 0, y: 0, width: 30, height: 30, destructible: false };
            } else if (objType < 0.6) {
                obj = { type: 'crate', x: 0, y: 0, width: 24, height: 24, hp: 20, destructible: true };
            } else if (objType < 0.8) {
                obj = { type: 'barrel', x: 0, y: 0, width: 22, height: 22, hp: 10, destructible: true, explosive: true };
            } else {
                obj = { type: 'table', x: 0, y: 0, width: 40, height: 20, flipped: false, flipDir: 0 };
            }

            // Position avoiding center and edges
            obj.x = 80 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 160);
            obj.y = 80 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 160);
            room.objects.push(obj);
        }
    }

    // Add enemies for combat rooms
    if (type === 'combat') {
        const enemyCount = 3 + floor + Math.floor(Math.random() * 3);
        const types = floor === 1 ? ['bulletKin', 'bandanaBullet', 'shotgunKin'] :
                      floor === 2 ? ['veteranBullet', 'mutantShotgun', 'gunNut', 'gunjurer'] :
                      ['forgeBullet', 'gunCultist', 'grenadeKin'];

        for (let i = 0; i < enemyCount; i++) {
            const etype = types[Math.floor(Math.random() * types.length)];
            room.enemies.push({
                type: etype,
                ...ENEMY_TYPES[etype],
                x: 100 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 200),
                y: 100 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 200),
                shootTimer: Math.random() * 2,
                active: true
            });
        }
    }

    // Treasure room
    if (type === 'treasure') {
        const tier = Math.random();
        room.items.push({
            type: 'chest',
            tier: tier < 0.5 ? 'brown' : tier < 0.8 ? 'blue' : 'green',
            x: ROOM_WIDTH * TILE_SIZE / 2,
            y: ROOM_HEIGHT * TILE_SIZE / 2,
            opened: false,
            locked: tier > 0.3
        });
    }

    // Shop
    if (type === 'shop') {
        room.shopItems = [
            { type: 'weapon', weapon: 'shotgun', price: 50 },
            { type: 'weapon', weapon: 'ak47', price: 80 },
            { type: 'heart', price: 20 },
            { type: 'key', price: 25 },
            { type: 'blank', price: 15 }
        ];
    }

    return room;
}

function loadRoom(index) {
    const room = game.rooms[index];
    enemies = room.enemies.filter(e => e.active);
    objects = room.objects;
    items = room.items || [];
    bullets = [];

    // Position player at door
    player.x = ROOM_WIDTH * TILE_SIZE / 2;
    player.y = ROOM_HEIGHT * TILE_SIZE - 50;
}

// Drawing functions
function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE_SIZE + 40, y * TILE_SIZE + 50, TILE_SIZE - 1, TILE_SIZE - 1);
}

function drawRoom() {
    const room = game.rooms[game.currentRoom];

    // Floor tiles
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const shade = ((x + y) % 2 === 0) ? '#2d2d44' : '#252540';
            drawTile(x, y, shade);
        }
    }

    // Walls
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 40, canvas.height);
    ctx.fillRect(canvas.width - 40, 0, 40, canvas.height);
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    // Wall decoration
    ctx.fillStyle = '#3d3d5c';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(5, 50 + i * 25, 30, 20);
        ctx.fillRect(canvas.width - 35, 50 + i * 25, 30, 20);
    }

    // Doors
    const connections = room.connections;
    ctx.fillStyle = room.cleared ? '#4a6741' : '#8b0000';

    for (const connIdx of connections) {
        const other = game.rooms[connIdx];
        const dx = other.gridX - room.gridX;
        const dy = other.gridY - room.gridY;

        if (dx === 1) ctx.fillRect(canvas.width - 40, canvas.height / 2 - 25, 40, 50);
        if (dx === -1) ctx.fillRect(0, canvas.height / 2 - 25, 40, 50);
        if (dy === 1) ctx.fillRect(canvas.width / 2 - 25, canvas.height - 70, 50, 70);
        if (dy === -1) ctx.fillRect(canvas.width / 2 - 25, 0, 50, 50);
    }

    // Objects
    for (const obj of objects) {
        if (obj.type === 'pillar') {
            ctx.fillStyle = '#555';
            ctx.fillRect(obj.x + 40, obj.y + 50, obj.width, obj.height);
            ctx.fillStyle = '#777';
            ctx.fillRect(obj.x + 42 + 40, obj.y + 52 + 50, obj.width - 4, 4);
        } else if (obj.type === 'crate') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(obj.x + 40, obj.y + 50, obj.width, obj.height);
            ctx.strokeStyle = '#5d2e0a';
            ctx.strokeRect(obj.x + 40, obj.y + 50, obj.width, obj.height);
        } else if (obj.type === 'barrel') {
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.ellipse(obj.x + obj.width/2 + 40, obj.y + obj.height/2 + 50, obj.width/2, obj.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('!', obj.x + obj.width/2 - 3 + 40, obj.y + obj.height/2 + 4 + 50);
        } else if (obj.type === 'table') {
            ctx.fillStyle = '#6d4c41';
            if (obj.flipped) {
                ctx.fillRect(obj.x + 40, obj.y + 50, obj.width, 10);
            } else {
                ctx.fillRect(obj.x + 40, obj.y + 50, obj.width, obj.height);
            }
        }
    }

    // Items
    for (const item of items) {
        if (item.type === 'chest' && !item.opened) {
            ctx.fillStyle = item.tier === 'brown' ? '#8b4513' : item.tier === 'blue' ? '#3498db' : '#27ae60';
            ctx.fillRect(item.x - 15 + 40, item.y - 10 + 50, 30, 20);
            if (item.locked) {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(item.x - 5 + 40, item.y - 5 + 50, 10, 10);
            }
        } else if (item.type === 'heart') {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(item.x + 40, item.y + 50, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'ammo') {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(item.x - 5 + 40, item.y - 8 + 50, 10, 16);
        } else if (item.type === 'shell') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(item.x + 40, item.y + 50, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'key') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(item.x - 3 + 40, item.y - 8 + 50, 6, 16);
            ctx.fillRect(item.x - 6 + 40, item.y + 4 + 50, 12, 4);
        }
    }

    // Shop items
    if (room.type === 'shop') {
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        room.shopItems.forEach((item, i) => {
            const x = 100 + i * 130;
            const y = 200;

            if (item.type === 'weapon') {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(x, y, 40, 20);
                ctx.fillStyle = '#fff';
                ctx.fillText(item.weapon, x, y - 5);
            } else if (item.type === 'heart') {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(x + 20, y + 10, 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.type === 'key') {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(x + 15, y, 10, 20);
            } else if (item.type === 'blank') {
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(x + 20, y + 10, 12, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`$${item.price}`, x + 10, y + 40);
        });
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + 40, player.y + 50);

    // Calculate angle to mouse
    const angle = Math.atan2(game.mouse.y - (player.y + 50), game.mouse.x - (player.x + 40));

    // Body
    if (player.rolling) {
        ctx.fillStyle = '#5dade2';
        ctx.globalAlpha = 0.7;
    } else if (player.invincible) {
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    } else {
        ctx.fillStyle = '#3498db';
    }

    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Face direction indicator
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 5, Math.sin(angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2c3e50';
    ctx.save();
    ctx.rotate(angle);
    ctx.fillRect(8, -3, 15, 6);
    ctx.restore();

    ctx.restore();
}

function drawBulletEnemy(enemy) {
    const data = ENEMY_TYPES[enemy.type];
    const x = enemy.x + 40;
    const y = enemy.y + 50;
    const size = data.size;

    ctx.save();
    ctx.translate(x, y);

    // Bullet-shaped body
    ctx.fillStyle = data.color;

    // Main bullet shape
    ctx.beginPath();
    ctx.moveTo(0, -size/2);
    ctx.bezierCurveTo(size/2, -size/2, size/2, size/3, 0, size/2);
    ctx.bezierCurveTo(-size/2, size/3, -size/2, -size/2, 0, -size/2);
    ctx.fill();

    // Face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-1, -4);
    ctx.moveTo(6, -6);
    ctx.lineTo(1, -4);
    ctx.stroke();

    // Primer (bottom)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(0, size/2 - 3, size/4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawEnemies() {
    for (const enemy of enemies) {
        drawBulletEnemy(enemy);
    }
}

function drawBoss() {
    if (!boss) return;

    const x = boss.x + 40;
    const y = boss.y + 50;

    ctx.save();
    ctx.translate(x, y);

    if (boss.type === 'bulletKing') {
        // Giant bullet with crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, -boss.size/2);
        ctx.bezierCurveTo(boss.size/2, -boss.size/2, boss.size/2, boss.size/3, 0, boss.size/2);
        ctx.bezierCurveTo(-boss.size/2, boss.size/3, -boss.size/2, -boss.size/2, 0, -boss.size/2);
        ctx.fill();

        // Crown
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.moveTo(-20, -boss.size/2);
        ctx.lineTo(-15, -boss.size/2 - 15);
        ctx.lineTo(-5, -boss.size/2);
        ctx.lineTo(0, -boss.size/2 - 20);
        ctx.lineTo(5, -boss.size/2);
        ctx.lineTo(15, -boss.size/2 - 15);
        ctx.lineTo(20, -boss.size/2);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-10, -5, 4, 0, Math.PI * 2);
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (boss.type === 'beholster') {
        // Floating eye with tentacles
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(0, 0, boss.size/2, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, boss.size/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, boss.size/5, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles with guns
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
            ctx.fillStyle = '#8e44ad';
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * boss.size/2, Math.sin(angle) * boss.size/2);
            ctx.lineTo(Math.cos(angle) * boss.size, Math.sin(angle) * boss.size);
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#8e44ad';
            ctx.stroke();

            // Gun at tentacle end
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(Math.cos(angle) * boss.size - 5, Math.sin(angle) * boss.size - 3, 10, 6);
        }
    } else if (boss.type === 'highDragun') {
        // Dragon
        ctx.fillStyle = '#e74c3c';

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.size/2, boss.size/3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -boss.size/2, boss.size/4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(-8, -boss.size/2 - 5, 6, 0, Math.PI * 2);
        ctx.arc(8, -boss.size/2 - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8, -boss.size/2 - 5, 3, 0, Math.PI * 2);
        ctx.arc(8, -boss.size/2 - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(-boss.size/2, 0);
        ctx.lineTo(-boss.size, -20);
        ctx.lineTo(-boss.size/2, -30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(boss.size/2, 0);
        ctx.lineTo(boss.size, -20);
        ctx.lineTo(boss.size/2, -30);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(200, 520, 400, 20);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(200, 520, 400 * (boss.hp / boss.maxHp), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(boss.name, 360, 535);
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.enemy ? '#ff6b6b' : '#f1c40f';
        ctx.beginPath();
        ctx.arc(bullet.x + 40, bullet.y + 50, bullet.size || 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawHUD() {
    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    ctx.fillRect(0, 0, canvas.width, 45);

    // Hearts
    for (let i = 0; i < player.maxHp / 2; i++) {
        const hpAtPos = player.hp - i * 2;
        if (hpAtPos >= 2) {
            ctx.fillStyle = '#e74c3c';
        } else if (hpAtPos === 1) {
            ctx.fillStyle = '#c0392b';
        } else {
            ctx.fillStyle = '#444';
        }
        ctx.beginPath();
        ctx.arc(30 + i * 25, canvas.height - 40, 10, 0, Math.PI * 2);
        ctx.fill();
        if (hpAtPos === 1) {
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(30 + i * 25 + 5, canvas.height - 40, 10, -Math.PI/2, Math.PI/2);
            ctx.fill();
        }
    }

    // Armor
    ctx.fillStyle = '#3498db';
    for (let i = 0; i < player.armor; i++) {
        ctx.fillRect(30 + i * 20, canvas.height - 25, 15, 15);
    }

    // Blanks
    ctx.fillStyle = '#9b59b6';
    ctx.font = '14px monospace';
    ctx.fillText(`Blanks: ${player.blanks}`, 200, canvas.height - 35);

    // Keys
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Keys: ${player.keys}`, 200, canvas.height - 15);

    // Shells
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Shells: ${player.shells}`, 320, canvas.height - 35);

    // Current weapon
    const weapon = player.weapons[player.currentWeapon];
    if (weapon) {
        ctx.fillStyle = '#fff';
        ctx.fillText(`${weapon.name}`, 450, canvas.height - 35);
        ctx.fillStyle = weapon.totalAmmo === Infinity ? '#0f0' : '#ff0';
        ctx.fillText(`${weapon.currentAmmo}/${weapon.magSize}  [${weapon.totalAmmo === Infinity ? '∞' : weapon.totalAmmo}]`, 450, canvas.height - 15);
    }

    // Floor info
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Floor ${game.floor}: ${game.floorNames[game.floor - 1]}`, 20, 30);

    // Mini map
    drawMinimap();
}

function drawMinimap() {
    const mapX = canvas.width - 120;
    const mapY = 5;
    const roomSize = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(mapX - 5, mapY - 5, 115, 40);

    for (let i = 0; i < game.rooms.length; i++) {
        const room = game.rooms[i];
        const rx = mapX + 50 + room.gridX * (roomSize + 2);
        const ry = mapY + 15 + room.gridY * (roomSize + 2);

        if (game.exploredRooms.has(i)) {
            ctx.fillStyle = i === game.currentRoom ? '#fff' :
                           room.type === 'boss' ? '#e74c3c' :
                           room.type === 'shop' ? '#f1c40f' :
                           room.type === 'treasure' ? '#27ae60' :
                           room.cleared ? '#4a6741' : '#666';
            ctx.fillRect(rx, ry, roomSize, roomSize);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(rx, ry, roomSize, roomSize);
        }
    }
}

// Update functions
function updatePlayer(dt) {
    // Rolling
    if (player.rolling) {
        player.rollTime += dt;
        player.x += player.rollDir.x * player.speed * 2.5 * dt;
        player.y += player.rollDir.y * player.speed * 2.5 * dt;

        if (player.rollTime >= player.rollDuration) {
            player.rolling = false;
            player.rollCooldown = 0.2;
        }
        return;
    }

    // Cooldowns
    if (player.rollCooldown > 0) player.rollCooldown -= dt;
    if (player.shootCooldown > 0) player.shootCooldown -= dt;
    if (player.invincibleTime > 0) {
        player.invincibleTime -= dt;
        if (player.invincibleTime <= 0) player.invincible = false;
    }

    // Reloading
    if (player.reloading) {
        player.reloadTime -= dt;
        if (player.reloadTime <= 0) {
            const weapon = player.weapons[player.currentWeapon];
            const needed = weapon.magSize - weapon.currentAmmo;
            const available = weapon.totalAmmo === Infinity ? needed : Math.min(needed, weapon.totalAmmo);
            weapon.currentAmmo += available;
            if (weapon.totalAmmo !== Infinity) weapon.totalAmmo -= available;
            player.reloading = false;
        }
    }

    // Movement
    let dx = 0, dy = 0;
    if (game.keys['KeyW'] || game.keys['ArrowUp']) dy = -1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) dy = 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) dx = -1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        player.x += dx * player.speed * dt;
        player.y += dy * player.speed * dt;
    }

    // Bounds
    player.x = Math.max(10, Math.min(ROOM_WIDTH * TILE_SIZE - 10, player.x));
    player.y = Math.max(10, Math.min(ROOM_HEIGHT * TILE_SIZE - 10, player.y));

    // Object collision
    for (const obj of objects) {
        if (obj.type === 'table' && !obj.flipped) continue;
        if (checkCollision(player, obj)) {
            // Push out
            const cx = obj.x + obj.width / 2;
            const cy = obj.y + obj.height / 2;
            const dx = player.x - cx;
            const dy = player.y - cy;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                player.x += (dx / len) * 5;
                player.y += (dy / len) * 5;
            }
        }
    }

    // Shooting
    if (game.mouseDown && player.shootCooldown <= 0 && !player.reloading) {
        shoot();
    }

    // Door transitions
    const room = game.rooms[game.currentRoom];
    if (room.cleared) {
        for (const connIdx of room.connections) {
            const other = game.rooms[connIdx];
            const dx = other.gridX - room.gridX;
            const dy = other.gridY - room.gridY;

            if (dx === 1 && player.x > ROOM_WIDTH * TILE_SIZE - 20) {
                transitionRoom(connIdx);
                return;
            }
            if (dx === -1 && player.x < 20) {
                transitionRoom(connIdx);
                return;
            }
            if (dy === 1 && player.y > ROOM_HEIGHT * TILE_SIZE - 20) {
                transitionRoom(connIdx);
                return;
            }
            if (dy === -1 && player.y < 20) {
                transitionRoom(connIdx);
                return;
            }
        }
    }
}

function transitionRoom(newRoomIdx) {
    const oldRoom = game.rooms[game.currentRoom];
    const newRoom = game.rooms[newRoomIdx];

    const dx = newRoom.gridX - oldRoom.gridX;
    const dy = newRoom.gridY - oldRoom.gridY;

    game.currentRoom = newRoomIdx;
    game.exploredRooms.add(newRoomIdx);
    loadRoom(newRoomIdx);

    // Position player at opposite door
    if (dx === 1) player.x = 30;
    if (dx === -1) player.x = ROOM_WIDTH * TILE_SIZE - 30;
    if (dy === 1) player.y = 30;
    if (dy === -1) player.y = ROOM_HEIGHT * TILE_SIZE - 30;

    // Start boss fight
    if (newRoom.type === 'boss' && !newRoom.cleared) {
        startBossFight();
    }
}

function startBossFight() {
    const bossType = game.floor === 1 ? 'bulletKing' : game.floor === 2 ? 'beholster' : 'highDragun';
    const bossData = BOSSES[bossType];
    boss = {
        type: bossType,
        ...bossData,
        maxHp: bossData.hp,
        x: ROOM_WIDTH * TILE_SIZE / 2,
        y: 100,
        phase: 0,
        attackTimer: 2
    };
    game.state = 'boss';
}

function shoot() {
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon || weapon.currentAmmo <= 0) {
        if (weapon && weapon.currentAmmo <= 0) {
            startReload();
        }
        return;
    }

    const angle = Math.atan2(game.mouse.y - (player.y + 50), game.mouse.x - (player.x + 40));
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread * 2;
        const bulletAngle = angle + spread;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(bulletAngle) * weapon.bulletSpeed,
            vy: Math.sin(bulletAngle) * weapon.bulletSpeed,
            damage: weapon.damage,
            enemy: false,
            pierce: weapon.pierce,
            homing: weapon.homing
        });
    }

    weapon.currentAmmo--;
    player.shootCooldown = 1 / weapon.fireRate;
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.totalAmmo === 0 || weapon.currentAmmo === weapon.magSize) return;
    player.reloading = true;
    player.reloadTime = 1;
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        const data = ENEMY_TYPES[enemy.type];

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 80) {
            enemy.x += (dx / dist) * data.speed * dt;
            enemy.y += (dy / dist) * data.speed * dt;
        }

        // Shoot
        enemy.shootTimer -= dt;
        if (enemy.shootTimer <= 0 && dist < 400) {
            const fireRate = data.fireRate || 1;
            enemy.shootTimer = 1 / fireRate + Math.random() * 0.5;

            const angle = Math.atan2(dy, dx);
            const pellets = data.pellets || (data.spread || 1);

            for (let i = 0; i < pellets; i++) {
                const spread = data.pellets ? (i - (pellets - 1) / 2) * 0.15 : (Math.random() - 0.5) * 0.3;
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle + spread) * 150,
                    vy: Math.sin(angle + spread) * 150,
                    damage: data.damage,
                    enemy: true,
                    size: 5
                });
            }
        }

        // Bounds
        enemy.x = Math.max(20, Math.min(ROOM_WIDTH * TILE_SIZE - 20, enemy.x));
        enemy.y = Math.max(20, Math.min(ROOM_HEIGHT * TILE_SIZE - 20, enemy.y));
    }
}

function updateBoss(dt) {
    if (!boss) return;

    boss.attackTimer -= dt;

    if (boss.attackTimer <= 0) {
        performBossAttack();
        boss.attackTimer = 2 + Math.random();
    }

    // Move
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 150) {
        boss.x += (dx / dist) * 40 * dt;
        boss.y += (dy / dist) * 40 * dt;
    }
}

function performBossAttack() {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

    if (boss.type === 'bulletKing') {
        // Ring attack
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            bullets.push({
                x: boss.x, y: boss.y,
                vx: Math.cos(a) * 180,
                vy: Math.sin(a) * 180,
                damage: 1, enemy: true, size: 6
            });
        }
    } else if (boss.type === 'beholster') {
        // Tentacle spray
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
            for (let j = 0; j < 3; j++) {
                bullets.push({
                    x: boss.x + Math.cos(a) * boss.size,
                    y: boss.y + Math.sin(a) * boss.size,
                    vx: Math.cos(a + (j - 1) * 0.2) * 200,
                    vy: Math.sin(a + (j - 1) * 0.2) * 200,
                    damage: 1, enemy: true, size: 5
                });
            }
        }
    } else if (boss.type === 'highDragun') {
        // Flame breath
        for (let i = 0; i < 20; i++) {
            const spread = (Math.random() - 0.5) * 0.8;
            bullets.push({
                x: boss.x, y: boss.y - boss.size/2,
                vx: Math.cos(angle + spread) * (200 + Math.random() * 100),
                vy: Math.sin(angle + spread) * (200 + Math.random() * 100),
                damage: 1, enemy: true, size: 8,
                color: '#f39c12'
            });
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Homing
        if (bullet.homing && !bullet.enemy) {
            let closest = null;
            let closestDist = 300;
            for (const enemy of enemies) {
                const d = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (d < closestDist) {
                    closestDist = d;
                    closest = enemy;
                }
            }
            if (closest) {
                const angle = Math.atan2(closest.y - bullet.y, closest.x - bullet.x);
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                const newAngle = currentAngle + (angle - currentAngle) * 0.1;
                const speed = Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
                bullet.vx = Math.cos(newAngle) * speed;
                bullet.vy = Math.sin(newAngle) * speed;
            }
        }

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        // Bounds
        if (bullet.x < -20 || bullet.x > ROOM_WIDTH * TILE_SIZE + 20 ||
            bullet.y < -20 || bullet.y > ROOM_HEIGHT * TILE_SIZE + 20) {
            bullets.splice(i, 1);
            continue;
        }

        // Object collision
        for (const obj of objects) {
            if ((obj.type === 'table' && obj.flipped) || obj.type === 'pillar' || obj.type === 'crate' || obj.type === 'barrel') {
                if (bullet.x > obj.x && bullet.x < obj.x + obj.width &&
                    bullet.y > obj.y && bullet.y < obj.y + obj.height) {

                    if (obj.destructible) {
                        obj.hp -= bullet.damage || 5;
                        if (obj.hp <= 0) {
                            if (obj.explosive) {
                                // Explosion
                                for (const enemy of enemies) {
                                    const d = Math.sqrt((enemy.x - obj.x) ** 2 + (enemy.y - obj.y) ** 2);
                                    if (d < 80) enemy.hp -= 30;
                                }
                            }
                            objects.splice(objects.indexOf(obj), 1);
                        }
                    }

                    if (!bullet.pierce) {
                        bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Enemy collision (player bullets)
        if (!bullet.enemy) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const d = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (d < ENEMY_TYPES[enemy.type].size) {
                    enemy.hp -= bullet.damage;
                    if (enemy.hp <= 0) {
                        // Drop loot
                        if (Math.random() < 0.3) {
                            items.push({ type: 'shell', x: enemy.x, y: enemy.y });
                        }
                        if (Math.random() < 0.1) {
                            items.push({ type: 'ammo', x: enemy.x, y: enemy.y });
                        }
                        enemies.splice(j, 1);
                    }
                    if (!bullet.pierce) {
                        bullets.splice(i, 1);
                        break;
                    }
                }
            }

            // Boss collision
            if (boss) {
                const d = Math.sqrt((boss.x - bullet.x) ** 2 + (boss.y - bullet.y) ** 2);
                if (d < boss.size) {
                    boss.hp -= bullet.damage;
                    if (!bullet.pierce) bullets.splice(i, 1);

                    if (boss.hp <= 0) {
                        boss = null;
                        game.rooms[game.currentRoom].cleared = true;

                        if (game.floor === 3) {
                            game.state = 'victory';
                        } else {
                            // Drop items and allow progression
                            items.push({ type: 'heart', x: ROOM_WIDTH * TILE_SIZE / 2, y: ROOM_HEIGHT * TILE_SIZE / 2 });
                            items.push({ type: 'key', x: ROOM_WIDTH * TILE_SIZE / 2 + 30, y: ROOM_HEIGHT * TILE_SIZE / 2 });
                        }
                    }
                }
            }
        }

        // Player collision (enemy bullets)
        if (bullet.enemy && !player.rolling && !player.invincible) {
            const d = Math.sqrt((player.x - bullet.x) ** 2 + (player.y - bullet.y) ** 2);
            if (d < player.width / 2) {
                takeDamage(bullet.damage);
                bullets.splice(i, 1);
            }
        }
    }

    // Check room cleared
    if (enemies.length === 0 && !game.rooms[game.currentRoom].cleared) {
        game.rooms[game.currentRoom].cleared = true;
    }
}

function takeDamage(amount) {
    if (player.armor > 0) {
        player.armor--;
    } else {
        player.hp -= amount * 2;
    }
    player.invincible = true;
    player.invincibleTime = 1;

    if (player.hp <= 0) {
        game.state = 'gameover';
    }
}

function useBlank() {
    if (player.blanks > 0) {
        player.blanks--;
        // Clear all enemy bullets
        bullets = bullets.filter(b => !b.enemy);
    }
}

function checkCollision(a, b) {
    return a.x - a.width/2 < b.x + b.width &&
           a.x + a.width/2 > b.x &&
           a.y - a.height/2 < b.y + b.height &&
           a.y + a.height/2 > b.y;
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const d = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);

        if (d < 25) {
            if (item.type === 'shell') {
                player.shells += 1 + Math.floor(Math.random() * 3);
                items.splice(i, 1);
            } else if (item.type === 'ammo') {
                const weapon = player.weapons[player.currentWeapon];
                if (weapon && weapon.totalAmmo !== Infinity) {
                    weapon.totalAmmo += Math.floor(weapon.magSize * 0.5);
                }
                items.splice(i, 1);
            } else if (item.type === 'heart') {
                if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + 2);
                    items.splice(i, 1);
                }
            } else if (item.type === 'key') {
                player.keys++;
                items.splice(i, 1);
            }
        }
    }
}

// Input
document.addEventListener('keydown', e => {
    game.keys[e.code] = true;

    if (game.state === 'menu' && e.code === 'Space') {
        startGame();
    }

    if (game.state === 'playing' || game.state === 'boss') {
        // Dodge roll
        if (e.code === 'Space' && !player.rolling && player.rollCooldown <= 0) {
            let dx = 0, dy = 0;
            if (game.keys['KeyW']) dy = -1;
            if (game.keys['KeyS']) dy = 1;
            if (game.keys['KeyA']) dx = -1;
            if (game.keys['KeyD']) dx = 1;

            if (dx === 0 && dy === 0) {
                const angle = Math.atan2(game.mouse.y - (player.y + 50), game.mouse.x - (player.x + 40));
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }

            const len = Math.sqrt(dx * dx + dy * dy);
            player.rollDir = { x: dx / len, y: dy / len };
            player.rolling = true;
            player.rollTime = 0;
            player.invincible = true;
        }

        // Reload
        if (e.code === 'KeyR') {
            startReload();
        }

        // Blank
        if (e.code === 'KeyQ') {
            useBlank();
        }

        // Weapon switch
        if (e.code === 'Digit1') player.currentWeapon = 0;
        if (e.code === 'Digit2' && player.weapons[1]) player.currentWeapon = 1;
        if (e.code === 'Digit3' && player.weapons[2]) player.currentWeapon = 2;

        // Interact (flip tables, open chests)
        if (e.code === 'KeyE') {
            // Tables
            for (const obj of objects) {
                if (obj.type === 'table' && !obj.flipped) {
                    const d = Math.sqrt((player.x - obj.x) ** 2 + (player.y - obj.y) ** 2);
                    if (d < 50) {
                        obj.flipped = true;
                    }
                }
            }

            // Chests
            for (const item of items) {
                if (item.type === 'chest' && !item.opened) {
                    const d = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
                    if (d < 40) {
                        if (item.locked && player.keys > 0) {
                            player.keys--;
                            item.opened = true;
                            dropChestLoot(item);
                        } else if (!item.locked) {
                            item.opened = true;
                            dropChestLoot(item);
                        }
                    }
                }
            }

            // Shop
            const room = game.rooms[game.currentRoom];
            if (room.type === 'shop') {
                room.shopItems.forEach((shopItem, idx) => {
                    const x = 100 + idx * 130;
                    const y = 200;
                    const d = Math.sqrt((player.x + 40 - x - 20) ** 2 + (player.y + 50 - y - 10) ** 2);
                    if (d < 40 && player.shells >= shopItem.price) {
                        player.shells -= shopItem.price;
                        if (shopItem.type === 'weapon') {
                            player.weapons.push(createWeapon(shopItem.weapon));
                        } else if (shopItem.type === 'heart') {
                            player.hp = Math.min(player.maxHp, player.hp + 2);
                        } else if (shopItem.type === 'key') {
                            player.keys++;
                        } else if (shopItem.type === 'blank') {
                            player.blanks++;
                        }
                        room.shopItems.splice(idx, 1);
                    }
                });
            }

            // Floor progression (at boss room after clearing)
            if (room.type === 'boss' && room.cleared && game.floor < 3) {
                if (player.y < 50) {
                    game.floor++;
                    generateFloor(game.floor);
                    player.blanks = 2;
                }
            }
        }
    }

    if ((game.state === 'gameover' || game.state === 'victory') && e.code === 'Space') {
        startGame();
    }
});

document.addEventListener('keyup', e => {
    game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    game.mouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    game.mouseDown = false;
});

canvas.addEventListener('wheel', e => {
    if (player.weapons.length > 1) {
        if (e.deltaY > 0) {
            player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        } else {
            player.currentWeapon = (player.currentWeapon - 1 + player.weapons.length) % player.weapons.length;
        }
    }
});

function dropChestLoot(chest) {
    const tier = chest.tier;
    const weapons = tier === 'brown' ? ['peashooter'] :
                    tier === 'blue' ? ['m1911', 'shotgun'] :
                    ['ak47', 'demonHead', 'railgun'];
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    player.weapons.push(createWeapon(weapon));

    // Also drop some shells
    items.push({ type: 'shell', x: chest.x + 20, y: chest.y });
    items.push({ type: 'shell', x: chest.x - 20, y: chest.y });
}

function startGame() {
    game.state = 'playing';
    game.floor = 1;
    player.hp = 6;
    player.maxHp = 6;
    player.armor = 1;
    player.blanks = 2;
    player.keys = 1;
    player.shells = 0;
    player.weapons = [createWeapon('peashooter')];
    player.currentWeapon = 0;
    player.rolling = false;
    player.invincible = false;
    boss = null;

    generateFloor(1);
}

// Draw menu
function drawMenu() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENTER THE GUNGEON', canvas.width / 2, 200);

    // Draw bullet character
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.moveTo(400, 280);
    ctx.bezierCurveTo(440, 280, 440, 360, 400, 380);
    ctx.bezierCurveTo(360, 360, 360, 280, 400, 280);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(390, 310, 5, 0, Math.PI * 2);
    ctx.arc(410, 310, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to start', canvas.width / 2, 450);
    ctx.font = '14px monospace';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot', canvas.width / 2, 490);
    ctx.fillText('SPACE - Dodge Roll | R - Reload | Q - Blank | E - Interact', canvas.width / 2, 515);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 280);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Floor ${game.floor} - ${game.floorNames[game.floor - 1]}`, canvas.width / 2, 340);
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 400);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText('You defeated the High Dragun!', canvas.width / 2, 320);
    ctx.fillText('The Gungeon has been conquered.', canvas.width / 2, 360);

    ctx.font = '18px monospace';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, 450);
}

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    ctx.textAlign = 'left';

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing' || game.state === 'boss') {
        updatePlayer(dt);
        if (game.state === 'boss') {
            updateBoss(dt);
        } else {
            updateEnemies(dt);
        }
        updateBullets(dt);
        updateItems();

        drawRoom();
        drawBullets();
        drawEnemies();
        drawBoss();
        drawPlayer();
        drawHUD();
    } else if (game.state === 'gameover') {
        drawRoom();
        drawPlayer();
        drawGameOver();
    } else if (game.state === 'victory') {
        drawRoom();
        drawPlayer();
        drawVictory();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
