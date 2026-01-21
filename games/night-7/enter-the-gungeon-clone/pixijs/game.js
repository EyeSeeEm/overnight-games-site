// Enter the Gungeon Clone - PixiJS
// Bullet-hell roguelike dungeon crawler

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a1a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 24;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;

// Game state
const gameState = {
    phase: 'menu', // menu, playing, shop, boss, gameover, victory
    floor: 1,
    maxFloors: 3,
    floorNames: ['Keep of the Lead Lord', 'Gungeon Proper', 'The Forge'],
    roomIndex: 0,
    rooms: [],
    currentRoom: null,
    shells: 0,
    keys: 1,
    blanks: 2
};

// Player state
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    width: 20,
    height: 20,
    speed: 180,
    health: 6,
    maxHealth: 6,
    armor: 1,
    rolling: false,
    rollTime: 0,
    rollDuration: 0.5,
    rollSpeed: 350,
    rollCooldown: 0,
    rollDir: { x: 0, y: 0 },
    iframes: 0,
    currentGun: 0,
    guns: [],
    fireTimer: 0
};

// Weapon definitions
const WEAPONS = {
    PISTOL: { name: 'Marine Sidearm', damage: 5, fireRate: 4, spread: 0.05, ammo: Infinity, speed: 500, color: 0xFFFF00 },
    M1911: { name: 'M1911', damage: 7, fireRate: 5, spread: 0.08, ammo: 80, speed: 500, color: 0xFFAA00 },
    SHOTGUN: { name: 'Shotgun', damage: 4, fireRate: 1.5, spread: 0.3, pellets: 6, ammo: 40, speed: 450, color: 0xFF6600 },
    AK47: { name: 'AK-47', damage: 5, fireRate: 8, spread: 0.15, ammo: 200, speed: 550, color: 0x00FF00 },
    RAILGUN: { name: 'Railgun', damage: 50, fireRate: 0.5, spread: 0, ammo: 15, speed: 1200, color: 0x00FFFF, pierce: true },
    DEMON_HEAD: { name: 'Demon Head', damage: 20, fireRate: 2, spread: 0.1, ammo: 60, speed: 350, color: 0xFF0066, homing: true }
};

// Enemy definitions
const ENEMY_TYPES = {
    BULLET_KIN: { hp: 15, speed: 60, damage: 1, fireRate: 1.5, color: 0xC0A060, size: 14, pattern: 'single' },
    BANDANA_KIN: { hp: 15, speed: 50, damage: 1, fireRate: 1.2, color: 0xE0A040, size: 14, pattern: 'spread' },
    SHOTGUN_KIN: { hp: 25, speed: 40, damage: 1, fireRate: 0.8, color: 0x6080C0, size: 18, pattern: 'shotgun' },
    VETERAN_KIN: { hp: 20, speed: 80, damage: 1, fireRate: 2, color: 0x804040, size: 14, pattern: 'burst' },
    GUN_NUT: { hp: 50, speed: 70, damage: 2, fireRate: 0, color: 0x404080, size: 22, pattern: 'melee', shield: true }
};

// Boss definitions
const BOSSES = {
    BULLET_KING: { hp: 600, speed: 50, damage: 1, color: 0xFFD700, size: 40, name: 'Bullet King' },
    BEHOLSTER: { hp: 800, speed: 30, damage: 1, color: 0x8040C0, size: 50, name: 'Beholster' },
    HIGH_DRAGUN: { hp: 1500, speed: 40, damage: 2, color: 0xFF4040, size: 60, name: 'High Dragun' }
};

// Containers
const gameContainer = new PIXI.Container();
const roomContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

gameContainer.addChild(roomContainer);
gameContainer.addChild(entityContainer);
gameContainer.addChild(bulletContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);

// Bullets array
const playerBullets = [];
const enemyBullets = [];
const enemies = [];
const pickups = [];
const roomObjects = [];

// Player sprite
const playerSprite = new PIXI.Graphics();
function drawPlayer() {
    playerSprite.clear();
    // Body - marine suit
    const alpha = player.iframes > 0 ? 0.5 : 1;
    playerSprite.beginFill(0x2060A0, alpha);
    playerSprite.drawRoundedRect(-10, -10, 20, 20, 4);
    playerSprite.endFill();
    // Helmet
    playerSprite.beginFill(0x305080, alpha);
    playerSprite.drawCircle(0, -2, 7);
    playerSprite.endFill();
    // Visor
    playerSprite.beginFill(0x80FFFF, alpha);
    playerSprite.drawEllipse(0, -3, 5, 3);
    playerSprite.endFill();
}
drawPlayer();
entityContainer.addChild(playerSprite);

// Gun sprite attached to player
const gunSprite = new PIXI.Graphics();
function drawGun() {
    gunSprite.clear();
    gunSprite.beginFill(0x404040);
    gunSprite.drawRect(0, -3, 18, 6);
    gunSprite.endFill();
    gunSprite.beginFill(0x606060);
    gunSprite.drawRect(14, -2, 6, 4);
    gunSprite.endFill();
}
drawGun();
entityContainer.addChild(gunSprite);

// Input handling
const keys = {};
let mouseX = 400, mouseY = 300;
let mouseDown = false;

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState.phase === 'playing' && !player.rolling && player.rollCooldown <= 0) {
        startDodgeRoll();
    }
    if (e.code === 'KeyQ' && gameState.phase === 'playing' && gameState.blanks > 0) {
        useBlank();
    }
    if (e.code === 'KeyE' && gameState.phase === 'playing') {
        switchWeapon(1);
    }
    if (e.code === 'Digit1') switchWeapon(0);
    if (e.code === 'Digit2') switchWeapon(1);
    if (e.code === 'Digit3') switchWeapon(2);
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
    const rect = app.view.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
window.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
window.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });

// Dodge roll
function startDodgeRoll() {
    // Get roll direction from movement input
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

    if (dx === 0 && dy === 0) {
        // Roll toward mouse if no input
        dx = mouseX - player.x;
        dy = mouseY - player.y;
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
        player.rollDir.x = dx / len;
        player.rollDir.y = dy / len;
        player.rolling = true;
        player.rollTime = player.rollDuration;
        player.iframes = player.rollDuration * 0.7; // i-frames for first 70%
    }
}

// Blank ability - clear all bullets
function useBlank() {
    gameState.blanks--;

    // Clear all enemy bullets
    for (const bullet of enemyBullets) {
        bulletContainer.removeChild(bullet.sprite);
    }
    enemyBullets.length = 0;

    // Visual effect
    const blankEffect = new PIXI.Graphics();
    blankEffect.beginFill(0xFFFFFF, 0.5);
    blankEffect.drawCircle(player.x, player.y, 200);
    blankEffect.endFill();
    gameContainer.addChild(blankEffect);

    let alpha = 0.5;
    const fade = () => {
        alpha -= 0.05;
        blankEffect.alpha = alpha;
        if (alpha <= 0) {
            gameContainer.removeChild(blankEffect);
        } else {
            requestAnimationFrame(fade);
        }
    };
    fade();
}

// Switch weapon
function switchWeapon(dir) {
    if (typeof dir === 'number' && dir < player.guns.length) {
        player.currentGun = dir;
    } else {
        player.currentGun = (player.currentGun + 1) % player.guns.length;
    }
}

// Generate room
function generateRoom(type = 'combat') {
    const room = {
        type,
        tiles: [],
        objects: [],
        enemies: [],
        cleared: type !== 'combat',
        doors: { north: false, south: false, east: false, west: false }
    };

    // Generate floor tiles
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        room.tiles[y] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            // Walls on edges
            if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                room.tiles[y][x] = 1; // Wall
            } else {
                room.tiles[y][x] = 0; // Floor
            }
        }
    }

    // Add room objects (cover)
    if (type === 'combat' || type === 'boss') {
        const numObjects = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numObjects; i++) {
            const ox = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
            const oy = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
            const objType = Math.random() < 0.3 ? 'barrel' : Math.random() < 0.5 ? 'crate' : 'table';
            room.objects.push({ x: ox, y: oy, type: objType, health: objType === 'barrel' ? 10 : 20, flipped: false });
        }
    }

    // Add enemies for combat rooms
    if (type === 'combat') {
        const enemyCount = 3 + gameState.floor + Math.floor(Math.random() * 3);
        const types = Object.keys(ENEMY_TYPES);
        const availableTypes = types.slice(0, Math.min(types.length, 2 + gameState.floor));

        for (let i = 0; i < enemyCount; i++) {
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            room.enemies.push({
                type,
                x: 100 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 200),
                y: 80 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 160)
            });
        }
    }

    return room;
}

// Generate floor layout
function generateFloor() {
    gameState.rooms = [];
    const roomCount = 5 + gameState.floor * 2;

    // Generate rooms
    for (let i = 0; i < roomCount; i++) {
        let type = 'combat';
        if (i === 0) type = 'start';
        else if (i === roomCount - 1) type = 'boss';
        else if (i === Math.floor(roomCount / 2)) type = 'shop';
        else if (i === Math.floor(roomCount / 3)) type = 'treasure';

        gameState.rooms.push(generateRoom(type));
    }

    // Set door connections
    for (let i = 0; i < gameState.rooms.length - 1; i++) {
        gameState.rooms[i].doors.east = true;
        gameState.rooms[i + 1].doors.west = true;
    }

    gameState.roomIndex = 0;
    loadRoom(0);
}

// Load room
function loadRoom(index) {
    gameState.roomIndex = index;
    gameState.currentRoom = gameState.rooms[index];

    // Clear containers
    roomContainer.removeChildren();
    entityContainer.removeChildren();
    bulletContainer.removeChildren();
    playerBullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    roomObjects.length = 0;
    pickups.length = 0;

    // Re-add player
    entityContainer.addChild(playerSprite);
    entityContainer.addChild(gunSprite);

    const room = gameState.currentRoom;

    // Draw floor
    const floorColors = [0x404030, 0x353025, 0x302520];
    const floorColor = floorColors[gameState.floor - 1] || 0x404030;

    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const tile = new PIXI.Graphics();
            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;

            if (room.tiles[y][x] === 1) {
                // Wall
                tile.beginFill(0x202020);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(1, 0x101010);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            } else {
                // Floor
                tile.beginFill(floorColor);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                // Tile pattern
                tile.lineStyle(1, 0x000000, 0.1);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            }
            roomContainer.addChild(tile);
        }
    }

    // Draw doors
    const doorPositions = {
        north: { x: ROOM_WIDTH / 2, y: 0 },
        south: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 1 },
        east: { x: ROOM_WIDTH - 1, y: ROOM_HEIGHT / 2 },
        west: { x: 0, y: ROOM_HEIGHT / 2 }
    };

    for (const [dir, pos] of Object.entries(doorPositions)) {
        if (room.doors[dir]) {
            const door = new PIXI.Graphics();
            door.x = Math.floor(pos.x) * TILE_SIZE;
            door.y = Math.floor(pos.y) * TILE_SIZE;
            door.beginFill(room.cleared ? 0x606040 : 0x804040);
            door.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            door.endFill();
            door.doorDir = dir;
            roomContainer.addChild(door);
        }
    }

    // Draw room objects
    for (const obj of room.objects) {
        const g = new PIXI.Graphics();
        g.x = obj.x * TILE_SIZE;
        g.y = obj.y * TILE_SIZE;

        if (obj.type === 'barrel') {
            g.beginFill(0x804020);
            g.drawCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2 - 2);
            g.endFill();
            g.beginFill(0xFF4040);
            g.drawCircle(TILE_SIZE / 2, TILE_SIZE / 2, 4);
            g.endFill();
        } else if (obj.type === 'crate') {
            g.beginFill(0x8B7355);
            g.drawRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
            g.endFill();
            g.lineStyle(2, 0x5C4033);
            g.moveTo(2, TILE_SIZE / 2);
            g.lineTo(TILE_SIZE - 2, TILE_SIZE / 2);
            g.moveTo(TILE_SIZE / 2, 2);
            g.lineTo(TILE_SIZE / 2, TILE_SIZE - 2);
        } else if (obj.type === 'table') {
            if (obj.flipped) {
                g.beginFill(0x654321);
                g.drawRect(0, TILE_SIZE / 3, TILE_SIZE, TILE_SIZE / 3);
                g.endFill();
            } else {
                g.beginFill(0x8B4513);
                g.drawRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
                g.endFill();
            }
        }

        obj.sprite = g;
        roomContainer.addChild(g);
        roomObjects.push(obj);
    }

    // Spawn enemies
    for (const enemyData of room.enemies) {
        spawnEnemy(enemyData.type, enemyData.x, enemyData.y);
    }

    // Add chest in treasure room
    if (room.type === 'treasure') {
        const chest = new PIXI.Graphics();
        chest.x = (ROOM_WIDTH / 2) * TILE_SIZE;
        chest.y = (ROOM_HEIGHT / 2) * TILE_SIZE;
        chest.beginFill(0x00AA00);
        chest.drawRect(-15, -10, 30, 20);
        chest.endFill();
        chest.beginFill(0xFFD700);
        chest.drawRect(-5, -5, 10, 10);
        chest.endFill();
        chest.eventMode = 'static';
        chest.cursor = 'pointer';
        chest.on('pointerdown', () => openChest(chest));
        roomContainer.addChild(chest);
    }

    // Shop room
    if (room.type === 'shop') {
        createShop();
    }

    // Boss room
    if (room.type === 'boss') {
        const bossTypes = ['BULLET_KING', 'BEHOLSTER', 'HIGH_DRAGUN'];
        spawnBoss(bossTypes[gameState.floor - 1] || 'BULLET_KING');
    }

    // Position player at entrance
    if (room.doors.west) {
        player.x = TILE_SIZE * 2;
        player.y = (ROOM_HEIGHT / 2) * TILE_SIZE;
    } else {
        player.x = (ROOM_WIDTH / 2) * TILE_SIZE;
        player.y = (ROOM_HEIGHT - 2) * TILE_SIZE;
    }
}

// Open chest
function openChest(chest) {
    if (gameState.keys > 0) {
        gameState.keys--;
        roomContainer.removeChild(chest);

        // Give random weapon
        const weaponKeys = Object.keys(WEAPONS).filter(k => k !== 'PISTOL');
        const weapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        player.guns.push({ ...WEAPONS[weapon], currentAmmo: WEAPONS[weapon].ammo });
    }
}

// Create shop
function createShop() {
    const items = [
        { type: 'health', cost: 20, label: 'Heart +1', x: 5 },
        { type: 'armor', cost: 25, label: 'Armor +1', x: 10 },
        { type: 'blank', cost: 15, label: 'Blank +1', x: 15 }
    ];

    items.forEach(item => {
        const g = new PIXI.Graphics();
        g.x = item.x * TILE_SIZE;
        g.y = (ROOM_HEIGHT / 2) * TILE_SIZE;

        g.beginFill(0x404040);
        g.drawRect(-20, -20, 40, 40);
        g.endFill();

        if (item.type === 'health') {
            g.beginFill(0xFF4040);
            g.moveTo(0, -10);
            g.lineTo(8, -5);
            g.lineTo(8, 0);
            g.lineTo(0, 10);
            g.lineTo(-8, 0);
            g.lineTo(-8, -5);
            g.closePath();
            g.endFill();
        } else if (item.type === 'armor') {
            g.beginFill(0x808080);
            g.drawRect(-8, -10, 16, 20);
            g.endFill();
        } else {
            g.beginFill(0x4040FF);
            g.drawCircle(0, 0, 8);
            g.endFill();
        }

        const price = new PIXI.Text(`${item.cost}`, { fontSize: 12, fill: 0xFFFF00 });
        price.anchor.set(0.5);
        price.y = 25;
        g.addChild(price);

        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.on('pointerdown', () => {
            if (gameState.shells >= item.cost) {
                gameState.shells -= item.cost;
                if (item.type === 'health') player.health = Math.min(player.maxHealth, player.health + 2);
                if (item.type === 'armor') player.armor++;
                if (item.type === 'blank') gameState.blanks++;
            }
        });

        roomContainer.addChild(g);
    });
}

// Spawn enemy
function spawnEnemy(type, x, y) {
    const template = ENEMY_TYPES[type];
    const enemy = {
        type,
        x, y,
        vx: 0, vy: 0,
        health: template.hp * (1 + (gameState.floor - 1) * 0.2),
        maxHealth: template.hp * (1 + (gameState.floor - 1) * 0.2),
        speed: template.speed,
        damage: template.damage,
        color: template.color,
        size: template.size,
        pattern: template.pattern,
        shield: template.shield,
        fireRate: template.fireRate,
        fireTimer: Math.random() * 2,
        sprite: new PIXI.Graphics(),
        facingPlayer: true
    };

    drawEnemy(enemy);
    entityContainer.addChild(enemy.sprite);
    enemies.push(enemy);
}

function drawEnemy(enemy) {
    enemy.sprite.clear();
    const s = enemy.size;

    // Bullet-shaped body
    enemy.sprite.beginFill(enemy.color);
    // Main bullet body
    enemy.sprite.drawEllipse(0, s * 0.2, s * 0.4, s * 0.5);
    // Bullet tip
    enemy.sprite.moveTo(-s * 0.4, 0);
    enemy.sprite.lineTo(0, -s * 0.7);
    enemy.sprite.lineTo(s * 0.4, 0);
    enemy.sprite.endFill();

    // Brass rim
    enemy.sprite.beginFill(0xB8860B);
    enemy.sprite.drawRect(-s * 0.4, s * 0.4, s * 0.8, s * 0.2);
    enemy.sprite.endFill();

    // Angry eyes
    enemy.sprite.beginFill(0xFF0000);
    enemy.sprite.drawCircle(-s * 0.15, -s * 0.1, s * 0.1);
    enemy.sprite.drawCircle(s * 0.15, -s * 0.1, s * 0.1);
    enemy.sprite.endFill();

    // Shield indicator
    if (enemy.shield) {
        enemy.sprite.lineStyle(2, 0x00FFFF, 0.5);
        enemy.sprite.drawCircle(0, 0, s * 0.8);
    }

    enemy.sprite.x = enemy.x;
    enemy.sprite.y = enemy.y;
}

// Spawn boss
function spawnBoss(type) {
    const template = BOSSES[type];
    const boss = {
        type,
        isBoss: true,
        x: (ROOM_WIDTH / 2) * TILE_SIZE,
        y: (ROOM_HEIGHT / 3) * TILE_SIZE,
        vx: 0, vy: 0,
        health: template.hp,
        maxHealth: template.hp,
        speed: template.speed,
        damage: template.damage,
        color: template.color,
        size: template.size,
        name: template.name,
        phase: 1,
        attackTimer: 2,
        attackPattern: 0,
        sprite: new PIXI.Graphics()
    };

    drawBoss(boss);
    entityContainer.addChild(boss.sprite);
    enemies.push(boss);
}

function drawBoss(boss) {
    boss.sprite.clear();
    const s = boss.size;

    if (boss.type === 'BULLET_KING') {
        // Large bullet body with crown
        boss.sprite.beginFill(boss.color);
        boss.sprite.drawEllipse(0, s * 0.1, s * 0.5, s * 0.6);
        boss.sprite.moveTo(-s * 0.5, -s * 0.1);
        boss.sprite.lineTo(0, -s * 0.8);
        boss.sprite.lineTo(s * 0.5, -s * 0.1);
        boss.sprite.endFill();

        // Crown
        boss.sprite.beginFill(0xFFD700);
        boss.sprite.moveTo(-s * 0.3, -s * 0.9);
        boss.sprite.lineTo(-s * 0.2, -s * 1.1);
        boss.sprite.lineTo(0, -s * 0.95);
        boss.sprite.lineTo(s * 0.2, -s * 1.1);
        boss.sprite.lineTo(s * 0.3, -s * 0.9);
        boss.sprite.closePath();
        boss.sprite.endFill();
    } else if (boss.type === 'BEHOLSTER') {
        // Giant eye
        boss.sprite.beginFill(boss.color);
        boss.sprite.drawCircle(0, 0, s * 0.6);
        boss.sprite.endFill();

        // Eye
        boss.sprite.beginFill(0xFFFFFF);
        boss.sprite.drawCircle(0, 0, s * 0.35);
        boss.sprite.endFill();
        boss.sprite.beginFill(0xFF0000);
        boss.sprite.drawCircle(0, 0, s * 0.2);
        boss.sprite.endFill();

        // Tentacles with guns
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const tx = Math.cos(angle) * s * 0.7;
            const ty = Math.sin(angle) * s * 0.7;
            boss.sprite.beginFill(0x604080);
            boss.sprite.drawCircle(tx, ty, s * 0.15);
            boss.sprite.endFill();
        }
    } else if (boss.type === 'HIGH_DRAGUN') {
        // Dragon head
        boss.sprite.beginFill(boss.color);
        boss.sprite.drawEllipse(0, 0, s * 0.7, s * 0.5);
        boss.sprite.endFill();

        // Horns
        boss.sprite.beginFill(0x800000);
        boss.sprite.moveTo(-s * 0.5, -s * 0.3);
        boss.sprite.lineTo(-s * 0.7, -s * 0.8);
        boss.sprite.lineTo(-s * 0.3, -s * 0.3);
        boss.sprite.closePath();
        boss.sprite.moveTo(s * 0.5, -s * 0.3);
        boss.sprite.lineTo(s * 0.7, -s * 0.8);
        boss.sprite.lineTo(s * 0.3, -s * 0.3);
        boss.sprite.closePath();
        boss.sprite.endFill();

        // Eyes
        boss.sprite.beginFill(0xFFFF00);
        boss.sprite.drawCircle(-s * 0.25, -s * 0.1, s * 0.12);
        boss.sprite.drawCircle(s * 0.25, -s * 0.1, s * 0.12);
        boss.sprite.endFill();
    }

    // Eyes - angry
    boss.sprite.beginFill(0xFF0000);
    boss.sprite.drawCircle(-s * 0.2, -s * 0.2, s * 0.1);
    boss.sprite.drawCircle(s * 0.2, -s * 0.2, s * 0.1);
    boss.sprite.endFill();

    boss.sprite.x = boss.x;
    boss.sprite.y = boss.y;
}

// Fire player bullet
function firePlayerBullet() {
    if (player.guns.length === 0) return;

    const gun = player.guns[player.currentGun];
    if (gun.currentAmmo <= 0 && gun.ammo !== Infinity) return;

    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    const pellets = gun.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * gun.spread * 2;
        const bulletAngle = angle + spread;

        const bullet = {
            x: player.x,
            y: player.y,
            vx: Math.cos(bulletAngle) * gun.speed,
            vy: Math.sin(bulletAngle) * gun.speed,
            damage: gun.damage,
            color: gun.color,
            pierce: gun.pierce,
            homing: gun.homing,
            sprite: new PIXI.Graphics()
        };

        bullet.sprite.beginFill(bullet.color);
        bullet.sprite.drawCircle(0, 0, 4);
        bullet.sprite.endFill();
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        bulletContainer.addChild(bullet.sprite);
        playerBullets.push(bullet);
    }

    if (gun.ammo !== Infinity) {
        gun.currentAmmo--;
    }
}

// Fire enemy bullet
function fireEnemyBullet(enemy, angle, speed = 200) {
    const bullet = {
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: enemy.damage,
        sprite: new PIXI.Graphics()
    };

    bullet.sprite.beginFill(0xFF4040);
    bullet.sprite.drawCircle(0, 0, 5);
    bullet.sprite.endFill();
    bullet.sprite.x = bullet.x;
    bullet.sprite.y = bullet.y;

    bulletContainer.addChild(bullet.sprite);
    enemyBullets.push(bullet);
}

// Update player
function updatePlayer(delta) {
    const dt = delta / 60;

    // Update cooldowns
    if (player.rollCooldown > 0) player.rollCooldown -= dt;
    if (player.iframes > 0) player.iframes -= dt;
    if (player.fireTimer > 0) player.fireTimer -= dt;

    // Rolling
    if (player.rolling) {
        player.rollTime -= dt;
        player.x += player.rollDir.x * player.rollSpeed * dt;
        player.y += player.rollDir.y * player.rollSpeed * dt;

        if (player.rollTime <= 0) {
            player.rolling = false;
            player.rollCooldown = 0.3;
        }
    } else {
        // Normal movement
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        player.vx = dx * player.speed;
        player.vy = dy * player.speed;
        player.x += player.vx * dt;
        player.y += player.vy * dt;
    }

    // Collision with walls
    const margin = 12;
    player.x = Math.max(TILE_SIZE + margin, Math.min(ROOM_WIDTH * TILE_SIZE - TILE_SIZE - margin, player.x));
    player.y = Math.max(TILE_SIZE + margin, Math.min(ROOM_HEIGHT * TILE_SIZE - TILE_SIZE - margin, player.y));

    // Shooting
    if (mouseDown && !player.rolling && player.guns.length > 0) {
        const gun = player.guns[player.currentGun];
        if (player.fireTimer <= 0) {
            firePlayerBullet();
            player.fireTimer = 1 / gun.fireRate;
        }
    }

    // Update sprite
    playerSprite.x = player.x;
    playerSprite.y = player.y;

    if (player.rolling) {
        playerSprite.rotation = Math.atan2(player.rollDir.y, player.rollDir.x);
        playerSprite.alpha = 0.5;
    } else {
        playerSprite.rotation = 0;
        playerSprite.alpha = player.iframes > 0 ? 0.5 : 1;
    }

    // Update gun position and rotation
    const gunAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
    gunSprite.x = player.x;
    gunSprite.y = player.y;
    gunSprite.rotation = gunAngle;
    gunSprite.visible = !player.rolling;

    // Check door collision for room transition
    if (gameState.currentRoom.cleared) {
        checkDoorCollision();
    }
}

// Check door collision
function checkDoorCollision() {
    const room = gameState.currentRoom;

    if (room.doors.east && player.x > ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 1.5) {
        if (gameState.roomIndex < gameState.rooms.length - 1) {
            loadRoom(gameState.roomIndex + 1);
        }
    }
    if (room.doors.west && player.x < TILE_SIZE * 1.5) {
        if (gameState.roomIndex > 0) {
            loadRoom(gameState.roomIndex - 1);
            player.x = ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 2;
        }
    }
}

// Update enemies
function updateEnemies(delta) {
    const dt = delta / 60;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.isBoss) {
            updateBoss(enemy, dt);
        } else {
            updateEnemy(enemy, dt);
        }

        // Check death
        if (enemy.health <= 0) {
            entityContainer.removeChild(enemy.sprite);
            enemies.splice(i, 1);

            // Drop shells
            gameState.shells += 2 + Math.floor(Math.random() * 3);

            // Check room cleared
            if (enemies.length === 0 && !gameState.currentRoom.cleared) {
                gameState.currentRoom.cleared = true;

                // Boss defeated - progress floor or win
                if (enemy.isBoss) {
                    if (gameState.floor >= gameState.maxFloors) {
                        showVictory();
                    } else {
                        gameState.floor++;
                        generateFloor();
                    }
                }
            }
        }
    }
}

function updateEnemy(enemy, dt) {
    // Move toward player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 100) {
        enemy.x += (dx / dist) * enemy.speed * dt;
        enemy.y += (dy / dist) * enemy.speed * dt;
    }

    // Update facing
    enemy.facingPlayer = dx > 0;

    // Fire at player
    enemy.fireTimer -= dt;
    if (enemy.fireTimer <= 0 && enemy.fireRate > 0) {
        const angle = Math.atan2(dy, dx);

        switch (enemy.pattern) {
            case 'single':
                fireEnemyBullet(enemy, angle);
                break;
            case 'spread':
                fireEnemyBullet(enemy, angle - 0.2);
                fireEnemyBullet(enemy, angle);
                fireEnemyBullet(enemy, angle + 0.2);
                break;
            case 'shotgun':
                for (let i = 0; i < 6; i++) {
                    fireEnemyBullet(enemy, angle + (Math.random() - 0.5) * 0.6, 150);
                }
                break;
            case 'burst':
                for (let j = 0; j < 3; j++) {
                    setTimeout(() => fireEnemyBullet(enemy, angle + (Math.random() - 0.5) * 0.1), j * 100);
                }
                break;
        }

        enemy.fireTimer = 1 / enemy.fireRate + Math.random() * 0.5;
    }

    enemy.sprite.x = enemy.x;
    enemy.sprite.y = enemy.y;
}

function updateBoss(boss, dt) {
    // Boss AI
    boss.attackTimer -= dt;

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Movement
    if (dist > 150) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
    }

    // Attack patterns
    if (boss.attackTimer <= 0) {
        boss.attackPattern = (boss.attackPattern + 1) % 4;

        switch (boss.type) {
            case 'BULLET_KING':
                bulletKingAttack(boss, angle);
                break;
            case 'BEHOLSTER':
                beholsterAttack(boss, angle);
                break;
            case 'HIGH_DRAGUN':
                highDragunAttack(boss, angle);
                break;
        }

        boss.attackTimer = 2 + Math.random();
    }

    boss.sprite.x = boss.x;
    boss.sprite.y = boss.y;
}

function bulletKingAttack(boss, angle) {
    switch (boss.attackPattern) {
        case 0: // Spiral
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    for (let j = 0; j < 8; j++) {
                        fireEnemyBullet(boss, (j / 8) * Math.PI * 2 + i * 0.2, 150);
                    }
                }, i * 100);
            }
            break;
        case 1: // Burst
            for (let i = 0; i < 16; i++) {
                fireEnemyBullet(boss, (i / 16) * Math.PI * 2, 200);
            }
            break;
        case 2: // Aimed spread
            for (let i = -3; i <= 3; i++) {
                fireEnemyBullet(boss, angle + i * 0.15, 180);
            }
            break;
        case 3: // Shotgun blast
            for (let i = 0; i < 10; i++) {
                fireEnemyBullet(boss, angle + (Math.random() - 0.5) * 0.8, 120 + Math.random() * 60);
            }
            break;
    }
}

function beholsterAttack(boss, angle) {
    switch (boss.attackPattern) {
        case 0: // All tentacles fire
            for (let i = 0; i < 6; i++) {
                const tentacleAngle = (i / 6) * Math.PI * 2;
                fireEnemyBullet(boss, tentacleAngle, 200);
            }
            break;
        case 1: // Eye beam (rapid fire line)
            for (let i = 0; i < 15; i++) {
                setTimeout(() => fireEnemyBullet(boss, angle + (Math.random() - 0.5) * 0.1, 300), i * 50);
            }
            break;
        case 2: // Ring attack
            for (let i = 0; i < 20; i++) {
                fireEnemyBullet(boss, (i / 20) * Math.PI * 2, 150);
            }
            break;
        case 3: // Spawn beadies (small projectiles that orbit)
            for (let i = 0; i < 8; i++) {
                fireEnemyBullet(boss, (i / 8) * Math.PI * 2, 100);
            }
            break;
    }
}

function highDragunAttack(boss, angle) {
    switch (boss.attackPattern) {
        case 0: // Fire breath
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const spread = (Math.random() - 0.5) * 0.6;
                    fireEnemyBullet(boss, angle + spread, 250 + Math.random() * 100);
                }, i * 30);
            }
            break;
        case 1: // Knife barrage
            for (let i = 0; i < 12; i++) {
                fireEnemyBullet(boss, (i / 12) * Math.PI * 2, 180);
            }
            break;
        case 2: // Homing missiles
            for (let i = -2; i <= 2; i++) {
                fireEnemyBullet(boss, angle + i * 0.3, 200);
            }
            break;
        case 3: // Ground fire
            for (let i = 0; i < 24; i++) {
                fireEnemyBullet(boss, (i / 24) * Math.PI * 2, 100);
            }
            break;
    }
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];

        // Homing
        if (bullet.homing && enemies.length > 0) {
            let nearestDist = Infinity;
            let nearestEnemy = null;
            for (const enemy of enemies) {
                const d = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestEnemy = enemy;
                }
            }
            if (nearestEnemy && nearestDist < 200) {
                const targetAngle = Math.atan2(nearestEnemy.y - bullet.y, nearestEnemy.x - bullet.x);
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                let diff = targetAngle - currentAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                const newAngle = currentAngle + diff * 0.1;
                const speed = Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
                bullet.vx = Math.cos(newAngle) * speed;
                bullet.vy = Math.sin(newAngle) * speed;
            }
        }

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        // Check enemy collision
        let hit = false;
        for (const enemy of enemies) {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            if (dx * dx + dy * dy < (enemy.size + 4) ** 2) {
                enemy.health -= bullet.damage;
                if (!bullet.pierce) hit = true;
                break;
            }
        }

        // Check bounds
        if (hit || bullet.x < 0 || bullet.x > ROOM_WIDTH * TILE_SIZE ||
            bullet.y < 0 || bullet.y > ROOM_HEIGHT * TILE_SIZE) {
            bulletContainer.removeChild(bullet.sprite);
            playerBullets.splice(i, 1);
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        // Check player collision
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        if (dx * dx + dy * dy < 144 && !player.rolling && player.iframes <= 0) {
            damagePlayer(bullet.damage);
            bulletContainer.removeChild(bullet.sprite);
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check bounds
        if (bullet.x < 0 || bullet.x > ROOM_WIDTH * TILE_SIZE ||
            bullet.y < 0 || bullet.y > ROOM_HEIGHT * TILE_SIZE) {
            bulletContainer.removeChild(bullet.sprite);
            enemyBullets.splice(i, 1);
        }
    }
}

// Damage player
function damagePlayer(amount) {
    if (player.armor > 0) {
        player.armor--;
    } else {
        player.health -= amount * 2; // Half hearts
        if (player.health <= 0) {
            showGameOver();
        }
    }
    player.iframes = 1.5;
}

// UI
const uiElements = {};

function createUI() {
    // Health bar
    uiElements.healthBg = new PIXI.Graphics();
    uiElements.healthBg.beginFill(0x000000, 0.7);
    uiElements.healthBg.drawRect(0, 0, 800, 40);
    uiElements.healthBg.endFill();
    uiContainer.addChild(uiElements.healthBg);

    uiElements.health = new PIXI.Text('', { fontSize: 16, fill: 0xFF4040 });
    uiElements.health.x = 10;
    uiElements.health.y = 10;
    uiContainer.addChild(uiElements.health);

    uiElements.armor = new PIXI.Text('', { fontSize: 16, fill: 0x8080FF });
    uiElements.armor.x = 150;
    uiElements.armor.y = 10;
    uiContainer.addChild(uiElements.armor);

    uiElements.blanks = new PIXI.Text('', { fontSize: 16, fill: 0x4040FF });
    uiElements.blanks.x = 250;
    uiElements.blanks.y = 10;
    uiContainer.addChild(uiElements.blanks);

    uiElements.shells = new PIXI.Text('', { fontSize: 16, fill: 0xFFFF00 });
    uiElements.shells.x = 350;
    uiElements.shells.y = 10;
    uiContainer.addChild(uiElements.shells);

    uiElements.floor = new PIXI.Text('', { fontSize: 16, fill: 0xFFFFFF });
    uiElements.floor.x = 500;
    uiElements.floor.y = 10;
    uiContainer.addChild(uiElements.floor);

    uiElements.gun = new PIXI.Text('', { fontSize: 16, fill: 0xFFFFFF });
    uiElements.gun.x = 10;
    uiElements.gun.y = 560;
    uiContainer.addChild(uiElements.gun);

    // Bottom bar
    uiElements.bottomBar = new PIXI.Graphics();
    uiElements.bottomBar.beginFill(0x000000, 0.7);
    uiElements.bottomBar.drawRect(0, 560, 800, 40);
    uiElements.bottomBar.endFill();
    uiContainer.addChild(uiElements.bottomBar);
    uiContainer.setChildIndex(uiElements.gun, uiContainer.children.length - 1);
}

function updateUI() {
    // Health as hearts
    let hearts = '';
    for (let i = 0; i < Math.ceil(player.maxHealth / 2); i++) {
        if (i * 2 + 2 <= player.health) hearts += '\u2665 '; // Full heart
        else if (i * 2 + 1 <= player.health) hearts += '\u2661 '; // Half heart
        else hearts += '\u2661 '; // Empty heart (grey)
    }
    uiElements.health.text = hearts;

    // Armor
    uiElements.armor.text = player.armor > 0 ? '\u2605'.repeat(player.armor) : '';

    // Blanks
    uiElements.blanks.text = `Blanks: ${gameState.blanks} [Q]`;

    // Shells
    uiElements.shells.text = `Shells: ${gameState.shells}`;

    // Floor
    uiElements.floor.text = `${gameState.floorNames[gameState.floor - 1]} (${gameState.roomIndex + 1}/${gameState.rooms.length})`;

    // Gun info
    if (player.guns.length > 0) {
        const gun = player.guns[player.currentGun];
        const ammoText = gun.ammo === Infinity ? '\u221e' : `${gun.currentAmmo}/${gun.ammo}`;
        uiElements.gun.text = `${gun.name} - ${ammoText} | [E] Switch | [Space] Dodge`;
    }
}

// Menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('ENTER THE GUNGEON', { fontSize: 48, fill: 0xFFD700, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('A Bullet Hell Roguelike', { fontSize: 24, fill: 0x808080 });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 210;
    menuContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD - Move\n' +
        'Mouse - Aim\n' +
        'Left Click - Shoot\n' +
        'Space - Dodge Roll (I-Frames!)\n' +
        'Q - Use Blank (Clear Bullets)\n' +
        'E / 1-3 - Switch Weapon\n\n' +
        'Defeat bosses on 3 floors to win!',
        { fontSize: 18, fill: 0xA0A0A0, align: 'center' }
    );
    controls.anchor.set(0.5);
    controls.x = 400;
    controls.y = 380;
    menuContainer.addChild(controls);

    const start = new PIXI.Text('[ Click to Enter the Gungeon ]', { fontSize: 28, fill: 0xFF4040 });
    start.anchor.set(0.5);
    start.x = 400;
    start.y = 520;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'playing';
    gameState.floor = 1;
    gameState.shells = 0;
    gameState.keys = 1;
    gameState.blanks = 2;

    player.health = player.maxHealth;
    player.armor = 1;
    player.guns = [{ ...WEAPONS.PISTOL, currentAmmo: Infinity }];
    player.currentGun = 0;

    generateFloor();
    menuContainer.visible = false;
}

function showGameOver() {
    gameState.phase = 'gameover';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x200000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('YOU DIED', { fontSize: 64, fill: 0xFF4040, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 250;
    menuContainer.addChild(title);

    const stats = new PIXI.Text(`Floor: ${gameState.floor}\nShells: ${gameState.shells}`, { fontSize: 24, fill: 0xFFFFFF, align: 'center' });
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Try Again ]', { fontSize: 28, fill: 0xFF8080 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 450;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x002000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('VICTORY!', { fontSize: 72, fill: 0xFFD700, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 200;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('You defeated the High Dragun!', { fontSize: 28, fill: 0x40FF40 });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 280;
    menuContainer.addChild(subtitle);

    const stats = new PIXI.Text(`Total Shells: ${gameState.shells}`, { fontSize: 24, fill: 0xFFFFFF });
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 28, fill: 0x80FF80 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 450;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

// Initialize
createUI();
createMenu();

// Main game loop
app.ticker.add((delta) => {
    if (gameState.phase !== 'playing') return;

    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateUI();
    drawPlayer();
});

console.log('Enter the Gungeon Clone loaded!');
