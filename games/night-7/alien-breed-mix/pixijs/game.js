// Station Breach - PixiJS
const app = new PIXI.Application({
    width: 1280,
    height: 720,
    backgroundColor: 0x0a0a0a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preferWebGLVersion: 1,
    hello: false
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 180;
const SPRINT_MULTIPLIER = 1.5;

// Game state
const gameState = {
    level: 1,
    paused: false,
    gameOver: false,
    victory: false
};

// Input tracking
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Containers
const gameContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const lightingContainer = new PIXI.Container();

gameContainer.addChild(worldContainer);
gameContainer.addChild(lightingContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(uiContainer);

// Camera shake
let shakeIntensity = 0;
let shakeDuration = 0;

// Weapons data
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 15, fireRate: 4, magSize: 12, reloadTime: 1.2, speed: 800, spread: 3, range: 500, infinite: true },
    shotgun: { name: 'Shotgun', damage: 8, pellets: 6, fireRate: 1.2, magSize: 8, reloadTime: 2.5, speed: 600, spread: 25, range: 250 },
    rifle: { name: 'Rifle', damage: 20, fireRate: 6, magSize: 30, reloadTime: 2.0, speed: 850, spread: 5, range: 600 },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 20, magSize: 100, reloadTime: 3.0, speed: 400, spread: 15, range: 200 }
};

// Player
const player = {
    x: 400,
    y: 300,
    angle: 0,
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 50,
    speed: PLAYER_SPEED,
    sprinting: false,
    stamina: 100,
    weapons: ['pistol'],
    currentWeapon: 0,
    ammo: { pistol: Infinity, shotgun: 24, rifle: 90, flamethrower: 200 },
    mag: { pistol: 12, shotgun: 8, rifle: 30, flamethrower: 100 },
    reloading: false,
    reloadTimer: 0,
    fireTimer: 0,
    keycards: [],
    sprite: null
};

// Enemies
const enemies = [];
const bullets = [];
const pickups = [];
const particles = [];
const floatingTexts = [];

// Level data
let currentLevel = null;
const rooms = [];
const doors = [];
const walls = [];

// Create graphics textures
function createTextures() {
    // Player texture
    const playerGfx = new PIXI.Graphics();
    playerGfx.beginFill(0x44aa44);
    playerGfx.drawCircle(16, 16, 14);
    playerGfx.endFill();
    playerGfx.beginFill(0x66cc66);
    playerGfx.drawRect(14, 0, 4, 16);
    playerGfx.endFill();
    return {
        player: app.renderer.generateTexture(playerGfx)
    };
}

// Generate level
function generateLevel(levelNum) {
    rooms.length = 0;
    doors.length = 0;
    walls.length = 0;
    enemies.length = 0;
    pickups.length = 0;

    // Clear world container
    while (worldContainer.children.length > 0) {
        worldContainer.removeChildAt(0);
    }

    const floorContainer = new PIXI.Container();
    const wallContainer = new PIXI.Container();
    const objectContainer = new PIXI.Container();
    worldContainer.addChild(floorContainer);
    worldContainer.addChild(wallContainer);
    worldContainer.addChild(objectContainer);

    // Level layout based on level number
    const layouts = {
        1: generateCargoBay,
        2: generateEngineering,
        3: generateQueensLair
    };

    const layout = layouts[levelNum] || layouts[1];
    currentLevel = layout();

    // Draw floor tiles
    for (let y = 0; y < currentLevel.height; y++) {
        for (let x = 0; x < currentLevel.width; x++) {
            const tile = currentLevel.tiles[y][x];
            if (tile !== 1) { // Not a wall
                const floor = new PIXI.Graphics();
                floor.beginFill(tile === 0 ? 0x2a2a2a : 0x1a1a1a);
                floor.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                floor.endFill();
                // Grid lines
                floor.lineStyle(1, 0x333333);
                floor.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                floorContainer.addChild(floor);
            }
        }
    }

    // Draw walls
    for (let y = 0; y < currentLevel.height; y++) {
        for (let x = 0; x < currentLevel.width; x++) {
            if (currentLevel.tiles[y][x] === 1) {
                const wall = new PIXI.Graphics();
                wall.beginFill(0x4a4a4a);
                wall.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                wall.endFill();
                wall.lineStyle(2, 0x5a5a5a);
                wall.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                wallContainer.addChild(wall);
                walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE });
            }
        }
    }

    // Create doors
    currentLevel.doors.forEach(d => {
        const door = createDoor(d.x, d.y, d.type, d.keycard);
        doors.push(door);
        objectContainer.addChild(door.sprite);
    });

    // Create pickups
    currentLevel.pickups.forEach(p => {
        const pickup = createPickup(p.x, p.y, p.type);
        pickups.push(pickup);
        objectContainer.addChild(pickup.sprite);
    });

    // Place enemies in rooms
    currentLevel.rooms.forEach((room, idx) => {
        if (idx > 0 && room.enemies) { // Skip first room (player spawn)
            room.enemies.forEach(e => {
                const enemy = createEnemy(e.x, e.y, e.type);
                enemies.push(enemy);
                objectContainer.addChild(enemy.sprite);
            });
        }
    });

    // Set player position
    player.x = currentLevel.playerStart.x;
    player.y = currentLevel.playerStart.y;

    return currentLevel;
}

function generateCargoBay() {
    const width = 50;
    const height = 40;
    const tiles = [];

    // Fill with walls
    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let x = 0; x < width; x++) {
            tiles[y][x] = 1;
        }
    }

    // Carve out rooms
    const roomDefs = [
        { x: 2, y: 2, w: 8, h: 8, name: 'start' },
        { x: 12, y: 2, w: 10, h: 8, name: 'storage1' },
        { x: 24, y: 2, w: 8, h: 8, name: 'armory' },
        { x: 2, y: 14, w: 10, h: 10, name: 'cargo1' },
        { x: 14, y: 12, w: 12, h: 10, name: 'main_cargo' },
        { x: 28, y: 12, w: 10, h: 10, name: 'security' },
        { x: 2, y: 28, w: 10, h: 8, name: 'maintenance' },
        { x: 16, y: 26, w: 12, h: 10, name: 'exit_hall' }
    ];

    const levelRooms = [];
    const levelDoors = [];
    const levelPickups = [];

    roomDefs.forEach((room, idx) => {
        // Carve room
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                tiles[y][x] = 0;
            }
        }

        const roomData = {
            x: room.x * TILE_SIZE,
            y: room.y * TILE_SIZE,
            w: room.w * TILE_SIZE,
            h: room.h * TILE_SIZE,
            name: room.name,
            cleared: idx === 0,
            enemies: []
        };

        // Add enemies (except start room)
        if (idx > 0) {
            const enemyCount = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < enemyCount; i++) {
                roomData.enemies.push({
                    x: (room.x + 2 + Math.random() * (room.w - 4)) * TILE_SIZE,
                    y: (room.y + 2 + Math.random() * (room.h - 4)) * TILE_SIZE,
                    type: 'drone'
                });
            }
        }

        levelRooms.push(roomData);
    });

    // Create corridors
    const corridors = [
        { x1: 10, y1: 5, x2: 12, y2: 7 },
        { x1: 22, y1: 5, x2: 24, y2: 7 },
        { x1: 5, y1: 10, x2: 7, y2: 14 },
        { x1: 18, y1: 10, x2: 20, y2: 12 },
        { x1: 26, y1: 12, x2: 28, y2: 16 },
        { x1: 5, y1: 24, x2: 7, y2: 28 },
        { x1: 12, y1: 20, x2: 18, y2: 22 },
        { x1: 18, y1: 22, x2: 20, y2: 26 }
    ];

    corridors.forEach(c => {
        for (let y = c.y1; y <= c.y2; y++) {
            for (let x = c.x1; x <= c.x2; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    tiles[y][x] = 0;
                }
            }
        }
    });

    // Add doors
    levelDoors.push({ x: 11 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 23 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 6 * TILE_SIZE, y: 13 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 27 * TILE_SIZE, y: 14 * TILE_SIZE, type: 'keycard', keycard: 'blue' });
    levelDoors.push({ x: 19 * TILE_SIZE, y: 25 * TILE_SIZE, type: 'exit' });

    // Add pickups
    levelPickups.push({ x: 26 * TILE_SIZE, y: 4 * TILE_SIZE, type: 'shotgun' });
    levelPickups.push({ x: 32 * TILE_SIZE, y: 16 * TILE_SIZE, type: 'keycard_blue' });
    levelPickups.push({ x: 6 * TILE_SIZE, y: 18 * TILE_SIZE, type: 'health' });
    levelPickups.push({ x: 20 * TILE_SIZE, y: 16 * TILE_SIZE, type: 'ammo_shells' });

    return {
        width,
        height,
        tiles,
        rooms: levelRooms,
        doors: levelDoors,
        pickups: levelPickups,
        playerStart: { x: 6 * TILE_SIZE, y: 6 * TILE_SIZE }
    };
}

function generateEngineering() {
    const width = 60;
    const height = 50;
    const tiles = [];

    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let x = 0; x < width; x++) {
            tiles[y][x] = 1;
        }
    }

    const roomDefs = [
        { x: 2, y: 2, w: 10, h: 8, name: 'start' },
        { x: 14, y: 2, w: 12, h: 10, name: 'reactor' },
        { x: 30, y: 2, w: 10, h: 10, name: 'control' },
        { x: 2, y: 14, w: 12, h: 12, name: 'maintenance' },
        { x: 18, y: 16, w: 14, h: 12, name: 'engine_room' },
        { x: 36, y: 14, w: 10, h: 10, name: 'storage' },
        { x: 2, y: 30, w: 10, h: 10, name: 'pipes' },
        { x: 16, y: 32, w: 12, h: 12, name: 'exit_area' },
        { x: 34, y: 30, w: 12, h: 12, name: 'armory' }
    ];

    const levelRooms = [];
    const levelDoors = [];
    const levelPickups = [];

    roomDefs.forEach((room, idx) => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                tiles[y][x] = 0;
            }
        }

        const roomData = {
            x: room.x * TILE_SIZE,
            y: room.y * TILE_SIZE,
            w: room.w * TILE_SIZE,
            h: room.h * TILE_SIZE,
            name: room.name,
            cleared: idx === 0,
            enemies: []
        };

        if (idx > 0) {
            const baseCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < baseCount; i++) {
                const type = Math.random() < 0.7 ? 'drone' : 'brute';
                roomData.enemies.push({
                    x: (room.x + 2 + Math.random() * (room.w - 4)) * TILE_SIZE,
                    y: (room.y + 2 + Math.random() * (room.h - 4)) * TILE_SIZE,
                    type
                });
            }
        }

        levelRooms.push(roomData);
    });

    // Corridors
    const corridors = [
        { x1: 12, y1: 5, x2: 14, y2: 7 },
        { x1: 26, y1: 5, x2: 30, y2: 7 },
        { x1: 6, y1: 10, x2: 8, y2: 14 },
        { x1: 14, y1: 18, x2: 18, y2: 20 },
        { x1: 32, y1: 18, x2: 36, y2: 20 },
        { x1: 6, y1: 26, x2: 8, y2: 30 },
        { x1: 12, y1: 35, x2: 16, y2: 37 },
        { x1: 28, y1: 36, x2: 34, y2: 38 }
    ];

    corridors.forEach(c => {
        for (let y = c.y1; y <= c.y2; y++) {
            for (let x = c.x1; x <= c.x2; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    tiles[y][x] = 0;
                }
            }
        }
    });

    levelDoors.push({ x: 13 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 27 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 15 * TILE_SIZE, y: 19 * TILE_SIZE, type: 'keycard', keycard: 'blue' });
    levelDoors.push({ x: 20 * TILE_SIZE, y: 36 * TILE_SIZE, type: 'exit' });

    levelPickups.push({ x: 38 * TILE_SIZE, y: 34 * TILE_SIZE, type: 'rifle' });
    levelPickups.push({ x: 40 * TILE_SIZE, y: 36 * TILE_SIZE, type: 'flamethrower' });
    levelPickups.push({ x: 24 * TILE_SIZE, y: 20 * TILE_SIZE, type: 'keycard_blue' });
    levelPickups.push({ x: 34 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'health' });
    levelPickups.push({ x: 6 * TILE_SIZE, y: 18 * TILE_SIZE, type: 'ammo_rifle' });

    return {
        width,
        height,
        tiles,
        rooms: levelRooms,
        doors: levelDoors,
        pickups: levelPickups,
        playerStart: { x: 6 * TILE_SIZE, y: 6 * TILE_SIZE }
    };
}

function generateQueensLair() {
    const width = 55;
    const height = 55;
    const tiles = [];

    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let x = 0; x < width; x++) {
            tiles[y][x] = 1;
        }
    }

    const roomDefs = [
        { x: 2, y: 2, w: 10, h: 10, name: 'start' },
        { x: 16, y: 2, w: 12, h: 10, name: 'hive1' },
        { x: 32, y: 2, w: 10, h: 10, name: 'hive2' },
        { x: 2, y: 16, w: 12, h: 12, name: 'nest1' },
        { x: 20, y: 16, w: 16, h: 16, name: 'boss_arena' },
        { x: 40, y: 16, w: 10, h: 10, name: 'nest2' },
        { x: 2, y: 34, w: 10, h: 10, name: 'cocoon' },
        { x: 20, y: 38, w: 12, h: 10, name: 'escape_pod' }
    ];

    const levelRooms = [];
    const levelDoors = [];
    const levelPickups = [];

    roomDefs.forEach((room, idx) => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                tiles[y][x] = 0;
            }
        }

        const roomData = {
            x: room.x * TILE_SIZE,
            y: room.y * TILE_SIZE,
            w: room.w * TILE_SIZE,
            h: room.h * TILE_SIZE,
            name: room.name,
            cleared: idx === 0,
            enemies: []
        };

        if (room.name === 'boss_arena') {
            roomData.enemies.push({
                x: (room.x + room.w/2) * TILE_SIZE,
                y: (room.y + room.h/2) * TILE_SIZE,
                type: 'queen'
            });
        } else if (idx > 0) {
            const baseCount = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < baseCount; i++) {
                const type = Math.random() < 0.6 ? 'drone' : 'brute';
                roomData.enemies.push({
                    x: (room.x + 2 + Math.random() * (room.w - 4)) * TILE_SIZE,
                    y: (room.y + 2 + Math.random() * (room.h - 4)) * TILE_SIZE,
                    type
                });
            }
        }

        levelRooms.push(roomData);
    });

    // Corridors
    const corridors = [
        { x1: 12, y1: 5, x2: 16, y2: 7 },
        { x1: 28, y1: 5, x2: 32, y2: 7 },
        { x1: 6, y1: 12, x2: 8, y2: 16 },
        { x1: 14, y1: 22, x2: 20, y2: 24 },
        { x1: 36, y1: 22, x2: 40, y2: 24 },
        { x1: 6, y1: 28, x2: 8, y2: 34 },
        { x1: 12, y1: 38, x2: 20, y2: 40 },
        { x1: 26, y1: 32, x2: 28, y2: 38 }
    ];

    corridors.forEach(c => {
        for (let y = c.y1; y <= c.y2; y++) {
            for (let x = c.x1; x <= c.x2; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    tiles[y][x] = 0;
                }
            }
        }
    });

    levelDoors.push({ x: 15 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 29 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'normal' });
    levelDoors.push({ x: 19 * TILE_SIZE, y: 23 * TILE_SIZE, type: 'keycard', keycard: 'blue' });
    levelDoors.push({ x: 27 * TILE_SIZE, y: 37 * TILE_SIZE, type: 'exit', locked: true });

    levelPickups.push({ x: 8 * TILE_SIZE, y: 22 * TILE_SIZE, type: 'keycard_blue' });
    levelPickups.push({ x: 44 * TILE_SIZE, y: 20 * TILE_SIZE, type: 'health' });
    levelPickups.push({ x: 6 * TILE_SIZE, y: 38 * TILE_SIZE, type: 'ammo_fuel' });
    levelPickups.push({ x: 36 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'health' });

    return {
        width,
        height,
        tiles,
        rooms: levelRooms,
        doors: levelDoors,
        pickups: levelPickups,
        playerStart: { x: 6 * TILE_SIZE, y: 6 * TILE_SIZE }
    };
}

function createDoor(x, y, type, keycard = null) {
    const door = {
        x,
        y,
        type,
        keycard,
        open: false,
        locked: type === 'keycard' || type === 'exit'
    };

    const gfx = new PIXI.Graphics();
    let color = 0x888888;
    if (type === 'keycard') color = 0x0088ff;
    else if (type === 'exit') color = 0x00ff88;

    gfx.beginFill(color);
    gfx.drawRect(0, 0, 64, 12);
    gfx.endFill();
    gfx.position.set(x, y);

    door.sprite = gfx;
    door.color = color;
    return door;
}

function createPickup(x, y, type) {
    const pickup = { x, y, type, collected: false };

    const gfx = new PIXI.Graphics();
    let color = 0xffffff;
    let size = 16;

    switch(type) {
        case 'health': color = 0xff4444; break;
        case 'ammo_shells': color = 0xffaa00; break;
        case 'ammo_rifle': color = 0x00aaff; break;
        case 'ammo_fuel': color = 0xff6600; break;
        case 'keycard_blue': color = 0x0088ff; size = 20; break;
        case 'shotgun': color = 0xaa6633; size = 24; break;
        case 'rifle': color = 0x666666; size = 24; break;
        case 'flamethrower': color = 0xff3300; size = 24; break;
    }

    gfx.beginFill(color);
    gfx.drawRoundedRect(0, 0, size, size, 4);
    gfx.endFill();
    gfx.position.set(x, y);

    pickup.sprite = gfx;
    return pickup;
}

function createEnemy(x, y, type) {
    const stats = {
        drone: { hp: 20, maxHp: 20, damage: 10, speed: 120, size: 24, color: 0x884488, detectRange: 300, attackCooldown: 1.0 },
        brute: { hp: 100, maxHp: 100, damage: 30, speed: 60, size: 48, color: 0x664444, detectRange: 250, attackCooldown: 1.5, chargeSpeed: 250 },
        queen: { hp: 500, maxHp: 500, damage: 40, speed: 80, size: 96, color: 0x440066, detectRange: 400, attackCooldown: 2.0, phase: 1 }
    };

    const s = stats[type];
    const enemy = {
        x, y,
        type,
        hp: s.hp,
        maxHp: s.maxHp,
        damage: s.damage,
        speed: s.speed,
        size: s.size,
        detectRange: s.detectRange,
        attackCooldown: s.attackCooldown,
        attackTimer: 0,
        state: 'idle',
        angle: Math.random() * Math.PI * 2,
        chargeDir: null,
        chargeTimer: 0,
        stunTimer: 0,
        phase: s.phase || 1
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(s.color);
    gfx.drawCircle(s.size/2, s.size/2, s.size/2 - 2);
    gfx.endFill();
    // Direction indicator
    gfx.beginFill(0xff0000);
    gfx.drawRect(s.size/2 - 3, 0, 6, s.size/4);
    gfx.endFill();
    gfx.pivot.set(s.size/2, s.size/2);
    gfx.position.set(x, y);

    enemy.sprite = gfx;
    return enemy;
}

// Player sprite
function createPlayer() {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x44aa44);
    gfx.drawCircle(0, 0, 14);
    gfx.endFill();
    // Gun
    gfx.beginFill(0x666666);
    gfx.drawRect(10, -3, 12, 6);
    gfx.endFill();
    // Direction indicator
    gfx.beginFill(0x88ff88);
    gfx.drawRect(8, -2, 6, 4);
    gfx.endFill();

    player.sprite = gfx;
    worldContainer.addChild(gfx);
}

// Create UI
function createUI() {
    // Health bar background
    const healthBg = new PIXI.Graphics();
    healthBg.beginFill(0x333333);
    healthBg.drawRoundedRect(10, 10, 204, 24, 4);
    healthBg.endFill();
    uiContainer.addChild(healthBg);

    // Health bar
    const healthBar = new PIXI.Graphics();
    uiContainer.addChild(healthBar);
    uiContainer.healthBar = healthBar;

    // Ammo text
    const ammoText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff
    });
    ammoText.position.set(10, 680);
    uiContainer.addChild(ammoText);
    uiContainer.ammoText = ammoText;

    // Weapon text
    const weaponText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xaaaaaa
    });
    weaponText.position.set(10, 655);
    uiContainer.addChild(weaponText);
    uiContainer.weaponText = weaponText;

    // Level text
    const levelText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0x88ff88
    });
    levelText.position.set(1100, 10);
    uiContainer.addChild(levelText);
    uiContainer.levelText = levelText;

    // Keycards display
    const keycardText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0x0088ff
    });
    keycardText.position.set(1100, 35);
    uiContainer.addChild(keycardText);
    uiContainer.keycardText = keycardText;

    // Message text (center screen)
    const messageText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffff00,
        align: 'center'
    });
    messageText.anchor.set(0.5);
    messageText.position.set(640, 100);
    uiContainer.addChild(messageText);
    uiContainer.messageText = messageText;
}

function updateUI() {
    // Health bar
    const healthBar = uiContainer.healthBar;
    healthBar.clear();
    healthBar.beginFill(0xff4444);
    healthBar.drawRoundedRect(12, 12, (player.health / player.maxHealth) * 200, 20, 3);
    healthBar.endFill();

    // Ammo
    const weapon = WEAPONS[player.weapons[player.currentWeapon]];
    const weaponKey = player.weapons[player.currentWeapon];
    const mag = player.mag[weaponKey];
    const reserve = player.ammo[weaponKey];

    if (player.reloading) {
        uiContainer.ammoText.text = `RELOADING...`;
    } else if (weapon.infinite) {
        uiContainer.ammoText.text = `${mag} / INF`;
    } else {
        uiContainer.ammoText.text = `${mag} / ${reserve}`;
    }

    uiContainer.weaponText.text = weapon.name.toUpperCase();
    uiContainer.levelText.text = `LEVEL ${gameState.level}`;
    uiContainer.keycardText.text = player.keycards.length > 0 ? `KEYCARDS: ${player.keycards.join(', ')}` : '';
}

// Vision system with raycasting
function updateVision() {
    lightingContainer.removeChildren();

    const visionGfx = new PIXI.Graphics();

    // Dark overlay
    visionGfx.beginFill(0x000000, 0.85);
    visionGfx.drawRect(
        -1000 + player.x - app.screen.width/2,
        -1000 + player.y - app.screen.height/2,
        3000,
        3000
    );
    visionGfx.endFill();

    // Create visibility polygon using raycasting
    const rays = 60;
    const visionRange = 350;
    const fovAngle = Math.PI / 3; // 60 degrees

    visionGfx.beginHole();
    visionGfx.moveTo(player.x, player.y);

    for (let i = 0; i <= rays; i++) {
        const rayAngle = player.angle - fovAngle/2 + (fovAngle * i / rays);
        const endpoint = castRay(player.x, player.y, rayAngle, visionRange);
        visionGfx.lineTo(endpoint.x, endpoint.y);
    }

    visionGfx.lineTo(player.x, player.y);
    visionGfx.endHole();

    // Add small ambient light around player
    visionGfx.beginHole();
    visionGfx.drawCircle(player.x, player.y, 50);
    visionGfx.endHole();

    lightingContainer.addChild(visionGfx);
}

function castRay(startX, startY, angle, maxDist) {
    const step = 4;
    let dist = 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    while (dist < maxDist) {
        const x = startX + dx * dist;
        const y = startY + dy * dist;

        // Check wall collision
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        if (currentLevel && tileY >= 0 && tileY < currentLevel.height &&
            tileX >= 0 && tileX < currentLevel.width) {
            if (currentLevel.tiles[tileY][tileX] === 1) {
                return { x, y };
            }
        }

        dist += step;
    }

    return { x: startX + dx * maxDist, y: startY + dy * maxDist };
}

// Collision detection
function checkWallCollision(x, y, radius) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = tileX + dx;
            const ty = tileY + dy;

            if (currentLevel && ty >= 0 && ty < currentLevel.height &&
                tx >= 0 && tx < currentLevel.width) {
                if (currentLevel.tiles[ty][tx] === 1) {
                    // Wall tile - check circle-rectangle collision
                    const wallX = tx * TILE_SIZE;
                    const wallY = ty * TILE_SIZE;

                    const closestX = Math.max(wallX, Math.min(x, wallX + TILE_SIZE));
                    const closestY = Math.max(wallY, Math.min(y, wallY + TILE_SIZE));

                    const distX = x - closestX;
                    const distY = y - closestY;

                    if (distX * distX + distY * distY < radius * radius) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function resolveWallCollision(x, y, radius) {
    let newX = x;
    let newY = y;

    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = tileX + dx;
            const ty = tileY + dy;

            if (currentLevel && ty >= 0 && ty < currentLevel.height &&
                tx >= 0 && tx < currentLevel.width) {
                if (currentLevel.tiles[ty][tx] === 1) {
                    const wallX = tx * TILE_SIZE;
                    const wallY = ty * TILE_SIZE;

                    const closestX = Math.max(wallX, Math.min(newX, wallX + TILE_SIZE));
                    const closestY = Math.max(wallY, Math.min(newY, wallY + TILE_SIZE));

                    const distX = newX - closestX;
                    const distY = newY - closestY;
                    const dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < radius && dist > 0) {
                        const overlap = radius - dist;
                        newX += (distX / dist) * overlap;
                        newY += (distY / dist) * overlap;
                    }
                }
            }
        }
    }

    return { x: newX, y: newY };
}

// Shooting
function shoot() {
    const weaponKey = player.weapons[player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (player.reloading) return;
    if (player.fireTimer > 0) return;
    if (player.mag[weaponKey] <= 0) {
        reload();
        return;
    }

    player.fireTimer = 1 / weapon.fireRate;
    player.mag[weaponKey]--;

    // Screen shake
    shakeIntensity = weaponKey === 'shotgun' ? 4 : 2;
    shakeDuration = 0.08;

    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = player.angle + spreadRad;

        const bullet = {
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0,
            isFlame: weaponKey === 'flamethrower'
        };

        const gfx = new PIXI.Graphics();
        if (bullet.isFlame) {
            gfx.beginFill(0xff6600);
            gfx.drawCircle(0, 0, 6);
        } else {
            gfx.beginFill(0xffff00);
            gfx.drawRect(-8, -2, 16, 4);
        }
        gfx.position.set(bullet.x, bullet.y);
        gfx.rotation = angle;
        worldContainer.addChild(gfx);

        bullet.sprite = gfx;
        bullets.push(bullet);
    }

    // Muzzle flash
    createMuzzleFlash();
}

function createMuzzleFlash() {
    const flash = new PIXI.Graphics();
    flash.beginFill(0xffff88, 0.8);
    flash.drawCircle(0, 0, 15);
    flash.endFill();
    flash.position.set(
        player.x + Math.cos(player.angle) * 25,
        player.y + Math.sin(player.angle) * 25
    );
    worldContainer.addChild(flash);

    setTimeout(() => {
        worldContainer.removeChild(flash);
    }, 50);
}

function reload() {
    const weaponKey = player.weapons[player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (player.reloading) return;
    if (weapon.infinite) {
        if (player.mag[weaponKey] >= weapon.magSize) return;
    } else {
        if (player.ammo[weaponKey] <= 0) return;
        if (player.mag[weaponKey] >= weapon.magSize) return;
    }

    player.reloading = true;
    player.reloadTimer = weapon.reloadTime - 0.25; // Reduced by 250ms per feedback
}

// Update functions
function updatePlayer(delta) {
    if (gameState.paused || gameState.gameOver) return;

    // Movement
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Normalize
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprint
    player.sprinting = keys['ShiftLeft'] && player.stamina > 0;
    const speed = player.sprinting ? player.speed * SPRINT_MULTIPLIER : player.speed;

    if (player.sprinting && (dx !== 0 || dy !== 0)) {
        player.stamina -= 25 * delta;
    } else {
        player.stamina = Math.min(100, player.stamina + 20 * delta);
    }

    // Apply movement
    let newX = player.x + dx * speed * delta;
    let newY = player.y + dy * speed * delta;

    // Wall collision
    const resolved = resolveWallCollision(newX, newY, 14);
    player.x = resolved.x;
    player.y = resolved.y;

    // Aim at mouse
    const worldMouse = {
        x: mouse.x - app.screen.width/2 + player.x,
        y: mouse.y - app.screen.height/2 + player.y
    };
    player.angle = Math.atan2(worldMouse.y - player.y, worldMouse.x - player.x);

    // Update sprite
    player.sprite.position.set(player.x, player.y);
    player.sprite.rotation = player.angle;

    // Fire timer
    if (player.fireTimer > 0) {
        player.fireTimer -= delta;
    }

    // Reload timer
    if (player.reloading) {
        player.reloadTimer -= delta;
        if (player.reloadTimer <= 0) {
            const weaponKey = player.weapons[player.currentWeapon];
            const weapon = WEAPONS[weaponKey];

            if (weapon.infinite) {
                player.mag[weaponKey] = weapon.magSize;
            } else {
                const needed = weapon.magSize - player.mag[weaponKey];
                const available = Math.min(needed, player.ammo[weaponKey]);
                player.mag[weaponKey] += available;
                player.ammo[weaponKey] -= available;
            }
            player.reloading = false;
        }
    }

    // Shoot
    if (mouse.down) {
        shoot();
    }

    // Pickup collection
    pickups.forEach(pickup => {
        if (pickup.collected) return;

        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 32) {
            collectPickup(pickup);
        }
    });

    // Door interaction
    doors.forEach(door => {
        if (door.open) return;

        const dx = player.x - (door.x + 32);
        const dy = player.y - (door.y + 6);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 50) {
            if (door.type === 'normal') {
                door.open = true;
                door.sprite.alpha = 0.3;
            } else if (door.type === 'keycard' && player.keycards.includes(door.keycard)) {
                door.open = true;
                door.sprite.alpha = 0.3;
                showMessage('DOOR UNLOCKED!');
            } else if (door.type === 'exit') {
                if (gameState.level === 3) {
                    // Check if queen is dead
                    const queenAlive = enemies.some(e => e.type === 'queen' && e.hp > 0);
                    if (!queenAlive) {
                        gameState.victory = true;
                        showMessage('ESCAPED! YOU WIN!');
                    }
                } else {
                    nextLevel();
                }
            }
        }
    });
}

function collectPickup(pickup) {
    pickup.collected = true;
    pickup.sprite.visible = false;

    let message = '';

    switch(pickup.type) {
        case 'health':
            player.health = Math.min(player.maxHealth, player.health + 25);
            message = '+25 HEALTH';
            break;
        case 'ammo_shells':
            player.ammo.shotgun += 8;
            message = '+8 SHELLS';
            break;
        case 'ammo_rifle':
            player.ammo.rifle += 30;
            message = '+30 RIFLE AMMO';
            break;
        case 'ammo_fuel':
            player.ammo.flamethrower += 50;
            message = '+50 FUEL';
            break;
        case 'keycard_blue':
            if (!player.keycards.includes('blue')) {
                player.keycards.push('blue');
            }
            message = 'BLUE KEYCARD';
            break;
        case 'shotgun':
            if (!player.weapons.includes('shotgun')) {
                player.weapons.push('shotgun');
            }
            message = 'SHOTGUN ACQUIRED';
            break;
        case 'rifle':
            if (!player.weapons.includes('rifle')) {
                player.weapons.push('rifle');
            }
            message = 'RIFLE ACQUIRED';
            break;
        case 'flamethrower':
            if (!player.weapons.includes('flamethrower')) {
                player.weapons.push('flamethrower');
            }
            message = 'FLAMETHROWER ACQUIRED';
            break;
    }

    createFloatingText(pickup.x, pickup.y, message, 0x00ff00);
}

function createFloatingText(x, y, text, color) {
    const txt = new PIXI.Text(text, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: color,
        fontWeight: 'bold'
    });
    txt.anchor.set(0.5);
    txt.position.set(x, y);
    worldContainer.addChild(txt);

    floatingTexts.push({
        sprite: txt,
        life: 1.5,
        vy: -30
    });
}

function showMessage(text) {
    uiContainer.messageText.text = text;
    setTimeout(() => {
        uiContainer.messageText.text = '';
    }, 2000);
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;
        bullet.traveled += Math.sqrt(bullet.vx*bullet.vx + bullet.vy*bullet.vy) * delta;
        bullet.sprite.position.set(bullet.x, bullet.y);

        // Wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);

        let hit = false;

        if (currentLevel && tileY >= 0 && tileY < currentLevel.height &&
            tileX >= 0 && tileX < currentLevel.width) {
            if (currentLevel.tiles[tileY][tileX] === 1) {
                hit = true;
            }
        }

        // Enemy collision
        if (!hit) {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;

                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < enemy.size/2) {
                    enemy.hp -= bullet.damage;
                    hit = true;

                    // Knockback (except brute)
                    if (enemy.type !== 'brute' && enemy.type !== 'queen') {
                        const angle = Math.atan2(dy, dx);
                        enemy.x += Math.cos(angle) * 20;
                        enemy.y += Math.sin(angle) * 20;
                    }

                    // Hit particles
                    createHitParticles(bullet.x, bullet.y);

                    if (enemy.hp <= 0) {
                        enemyDeath(enemy);
                    }

                    break;
                }
            }
        }

        // Range check
        if (bullet.traveled > bullet.range) {
            hit = true;
        }

        if (hit) {
            worldContainer.removeChild(bullet.sprite);
            bullets.splice(i, 1);
        }
    }
}

function createHitParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = {
            x,
            y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.3
        };

        const gfx = new PIXI.Graphics();
        gfx.beginFill(0x00ff88);
        gfx.drawCircle(0, 0, 3);
        gfx.endFill();
        gfx.position.set(x, y);
        worldContainer.addChild(gfx);

        particle.sprite = gfx;
        particles.push(particle);
    }
}

function enemyDeath(enemy) {
    enemy.sprite.visible = false;

    // Death particles
    for (let i = 0; i < 10; i++) {
        const particle = {
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            life: 0.5
        };

        const gfx = new PIXI.Graphics();
        gfx.beginFill(0x00ff88);
        gfx.drawCircle(0, 0, 4);
        gfx.endFill();
        gfx.position.set(enemy.x, enemy.y);
        worldContainer.addChild(gfx);

        particle.sprite = gfx;
        particles.push(particle);
    }

    // Drop loot
    if (Math.random() < 0.2) {
        const lootTypes = ['health', 'ammo_shells', 'ammo_rifle'];
        const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];
        const pickup = createPickup(enemy.x, enemy.y, type);
        pickups.push(pickup);
        worldContainer.addChild(pickup.sprite);
    }
}

function updateEnemies(delta) {
    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Stun check
        if (enemy.stunTimer > 0) {
            enemy.stunTimer -= delta;
            return;
        }

        // Detection
        if (dist < enemy.detectRange) {
            enemy.state = 'chase';
            enemy.angle = Math.atan2(dy, dx);

            // Movement
            if (enemy.type === 'brute' && dist < 200 && enemy.chargeTimer <= 0) {
                // Charge attack
                enemy.chargeDir = { x: dx/dist, y: dy/dist };
                enemy.chargeTimer = 1.5;
                enemy.state = 'charging';
            }

            if (enemy.state === 'charging') {
                enemy.chargeTimer -= delta;
                const chargeSpeed = 250;
                enemy.x += enemy.chargeDir.x * chargeSpeed * delta;
                enemy.y += enemy.chargeDir.y * chargeSpeed * delta;

                // Wall collision during charge
                const resolved = resolveWallCollision(enemy.x, enemy.y, enemy.size/2);
                enemy.x = resolved.x;
                enemy.y = resolved.y;

                if (enemy.chargeTimer <= 0) {
                    enemy.stunTimer = 1.0;
                    enemy.state = 'chase';
                }
            } else if (enemy.state === 'chase') {
                const moveX = (dx/dist) * enemy.speed * delta;
                const moveY = (dy/dist) * enemy.speed * delta;

                enemy.x += moveX;
                enemy.y += moveY;

                // Wall collision
                const resolved = resolveWallCollision(enemy.x, enemy.y, enemy.size/2);
                enemy.x = resolved.x;
                enemy.y = resolved.y;
            }

            // Attack
            if (dist < enemy.size/2 + 20) {
                enemy.attackTimer -= delta;
                if (enemy.attackTimer <= 0) {
                    player.health -= enemy.damage;
                    enemy.attackTimer = enemy.attackCooldown;
                    shakeIntensity = 5;
                    shakeDuration = 0.15;

                    createFloatingText(player.x, player.y - 20, `-${enemy.damage}`, 0xff0000);

                    if (player.health <= 0) {
                        gameOver();
                    }
                }
            }

            // Queen special attacks
            if (enemy.type === 'queen') {
                // Phase 2 at 50% HP
                if (enemy.hp < enemy.maxHp * 0.5 && enemy.phase === 1) {
                    enemy.phase = 2;
                    enemy.attackCooldown *= 0.7;
                    showMessage('THE QUEEN IS ENRAGED!');

                    // Spawn brutes
                    for (let i = 0; i < 2; i++) {
                        const brute = createEnemy(
                            enemy.x + (Math.random() - 0.5) * 100,
                            enemy.y + (Math.random() - 0.5) * 100,
                            'brute'
                        );
                        enemies.push(brute);
                        worldContainer.addChild(brute.sprite);
                    }
                }
            }
        }

        // Update sprite
        enemy.sprite.position.set(enemy.x, enemy.y);
        enemy.sprite.rotation = enemy.angle;
    });
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        p.sprite.position.set(p.x, p.y);
        p.sprite.alpha = p.life / 0.5;

        if (p.life <= 0) {
            worldContainer.removeChild(p.sprite);
            particles.splice(i, 1);
        }
    }

    // Floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.sprite.y += t.vy * delta;
        t.life -= delta;
        t.sprite.alpha = t.life / 1.5;

        if (t.life <= 0) {
            worldContainer.removeChild(t.sprite);
            floatingTexts.splice(i, 1);
        }
    }
}

function updateCamera(delta) {
    // Follow player
    gameContainer.x = app.screen.width/2 - player.x;
    gameContainer.y = app.screen.height/2 - player.y;

    // Screen shake
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        gameContainer.x += (Math.random() - 0.5) * shakeIntensity;
        gameContainer.y += (Math.random() - 0.5) * shakeIntensity;
    }
}

function gameOver() {
    gameState.gameOver = true;
    showMessage('GAME OVER - Press R to restart');
}

function nextLevel() {
    gameState.level++;
    player.keycards = [];

    if (gameState.level > 3) {
        gameState.victory = true;
        showMessage('ESCAPED! YOU WIN!');
    } else {
        generateLevel(gameState.level);
        createPlayer();
        showMessage(`LEVEL ${gameState.level}`);
    }
}

function restart() {
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.victory = false;

    player.health = 100;
    player.keycards = [];
    player.weapons = ['pistol'];
    player.currentWeapon = 0;
    player.ammo = { pistol: Infinity, shotgun: 24, rifle: 90, flamethrower: 200 };
    player.mag = { pistol: 12, shotgun: 8, rifle: 30, flamethrower: 100 };
    player.reloading = false;

    bullets.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;

    generateLevel(1);
    createPlayer();
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyR') {
        if (gameState.gameOver || gameState.victory) {
            restart();
        } else {
            reload();
        }
    }

    if (e.code === 'KeyQ') {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
    }

    if (e.code === 'Space') {
        // Door interaction hint
    }

    if (e.code === 'Escape') {
        gameState.paused = !gameState.paused;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
    } else {
        player.currentWeapon = (player.currentWeapon - 1 + player.weapons.length) % player.weapons.length;
    }
});

// Prevent context menu
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Game loop
app.ticker.add((delta) => {
    const dt = delta / 60;

    if (!gameState.paused && !gameState.gameOver && !gameState.victory) {
        updatePlayer(dt);
        updateBullets(dt);
        updateEnemies(dt);
        updateParticles(dt);
        updateVision();
    }

    updateCamera(dt);
    updateUI();
});

// Initialize
generateLevel(1);
createPlayer();
createUI();
showMessage('WASD to move, Mouse to aim/shoot, R to reload, Q to switch weapon');

console.log('Station Breach initialized');
