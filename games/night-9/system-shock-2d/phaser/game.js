// System Shock 2D: Whispers of M.A.R.I.A. - Phaser 3
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// Game state
let player, cursors, keys;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let items = [];
let doors = [];
let turrets = [];
let containers = [];
let decals = [];
let currentDeck = 1;
let gameState = 'title';
let camera;
let debugMode = false;
let lastShotTime = 0;
let flashlightOn = true;

// Player stats
let playerStats = {
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    ammo: { bullets: 30, shells: 0, cells: 0 },
    weapon: 'pistol',
    keycards: [],
    inventory: []
};

// Constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 25;
const ROOM_HEIGHT = 19;
const VISION_CONE_ANGLE = Math.PI / 3; // 60 degrees
const VISION_RANGE = 250;

// Deck layouts
const deckLayouts = {
    1: { // Engineering
        name: 'DECK 1: ENGINEERING',
        rooms: [
            { x: 0, y: 0, w: 10, h: 8, type: 'medbay', name: 'Med Bay' },
            { x: 10, y: 0, w: 15, h: 4, type: 'corridor', name: 'Main Corridor' },
            { x: 10, y: 4, w: 8, h: 6, type: 'generator', name: 'Generator Room' },
            { x: 18, y: 4, w: 7, h: 6, type: 'security', name: 'Security Office' },
            { x: 0, y: 8, w: 10, h: 11, type: 'storage', name: 'Storage Bay' },
            { x: 10, y: 10, w: 15, h: 9, type: 'quarters', name: 'Crew Quarters' },
        ],
        doors: [
            { x: 10, y: 2, dir: 'v', locked: false },
            { x: 10, y: 6, dir: 'v', locked: false },
            { x: 18, y: 6, dir: 'v', locked: true, keycard: 'yellow' },
            { x: 5, y: 8, dir: 'h', locked: false },
            { x: 15, y: 10, dir: 'h', locked: false },
        ],
        elevator: { x: 23, y: 16, toDeck: 2 },
        enemies: [
            { x: 12, y: 2, type: 'drone' },
            { x: 16, y: 6, type: 'drone' },
            { x: 20, y: 5, type: 'soldier' },
            { x: 3, y: 12, type: 'drone' },
            { x: 15, y: 14, type: 'crawler' },
            { x: 18, y: 16, type: 'crawler' },
        ],
        turrets: [
            { x: 22, y: 8, friendly: false }
        ],
        items: [
            { x: 3, y: 3, type: 'medpatch' },
            { x: 14, y: 7, type: 'bullets' },
            { x: 21, y: 5, type: 'keycard_yellow' },
            { x: 6, y: 14, type: 'medkit' },
            { x: 20, y: 14, type: 'bullets' },
        ],
        containers: [
            { x: 7, y: 5, contents: ['bullets', 'medpatch'] },
            { x: 2, y: 10, contents: ['shells', 'medpatch'] },
            { x: 22, y: 12, contents: ['energy_cell', 'repair_kit'] },
        ],
        playerStart: { x: 2, y: 3 }
    },
    2: { // Medical/Operations
        name: 'DECK 2: MEDICAL',
        rooms: [
            { x: 0, y: 0, w: 12, h: 10, type: 'messhall', name: 'Mess Hall' },
            { x: 12, y: 0, w: 13, h: 6, type: 'hydroponics', name: 'Hydroponics' },
            { x: 12, y: 6, w: 13, h: 8, type: 'medwing', name: 'Medical Wing' },
            { x: 0, y: 10, w: 12, h: 9, type: 'armory', name: 'Armory' },
            { x: 20, y: 14, w: 5, h: 5, type: 'escape', name: 'Escape Pod' },
        ],
        doors: [
            { x: 12, y: 3, dir: 'v', locked: false },
            { x: 12, y: 8, dir: 'v', locked: false },
            { x: 6, y: 10, dir: 'h', locked: true, keycard: 'red' },
            { x: 20, y: 16, dir: 'v', locked: true, keycard: 'yellow' },
        ],
        elevator: { x: 1, y: 16, toDeck: 1, isStart: true },
        escape: { x: 22, y: 16 },
        enemies: [
            { x: 5, y: 4, type: 'crawler' },
            { x: 8, y: 6, type: 'crawler' },
            { x: 16, y: 2, type: 'drone' },
            { x: 18, y: 4, type: 'soldier' },
            { x: 16, y: 10, type: 'soldier' },
            { x: 4, y: 14, type: 'soldier' },
            { x: 8, y: 16, type: 'drone' },
        ],
        turrets: [
            { x: 6, y: 12, friendly: false },
            { x: 18, y: 14, friendly: false }
        ],
        items: [
            { x: 3, y: 2, type: 'medpatch' },
            { x: 20, y: 3, type: 'energy_cell' },
            { x: 14, y: 8, type: 'medkit' },
            { x: 6, y: 14, type: 'bullets' },
            { x: 10, y: 14, type: 'keycard_red' },
        ],
        containers: [
            { x: 9, y: 4, contents: ['medpatch', 'bullets'] },
            { x: 22, y: 2, contents: ['cells', 'medkit'] },
            { x: 3, y: 16, contents: ['shells', 'shells', 'medkit'] },
        ],
        playerStart: { x: 2, y: 16 }
    }
};

// Enemy definitions
const enemyTypes = {
    drone: { hp: 30, speed: 80, damage: 10, color: 0x4a6a8a, name: 'Cyborg Drone', behavior: 'patrol', range: 0 },
    soldier: { hp: 60, speed: 100, damage: 15, color: 0x8a4a4a, name: 'Cyborg Soldier', behavior: 'ranged', range: 200 },
    crawler: { hp: 20, speed: 120, damage: 8, color: 0x4a8a4a, name: 'Mutant Crawler', behavior: 'swarm', range: 0 }
};

// Graphics generators
function createTextures(scene) {
    // Player sprite (armored figure)
    let g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3a5a7a);
    g.fillRect(4, 2, 16, 20); // Body
    g.fillStyle(0x6a9aba);
    g.fillRect(6, 4, 12, 6); // Visor
    g.fillStyle(0x2a4a5a);
    g.fillRect(2, 8, 4, 12); // Left arm
    g.fillRect(18, 8, 4, 12); // Right arm
    g.fillRect(6, 20, 5, 6); // Left leg
    g.fillRect(13, 20, 5, 6); // Right leg
    g.generateTexture('player', 24, 28);
    g.destroy();

    // Enemy sprites
    Object.entries(enemyTypes).forEach(([type, data]) => {
        g = scene.make.graphics({ x: 0, y: 0 });
        if (type === 'drone') {
            g.fillStyle(data.color);
            g.fillRect(4, 4, 16, 16);
            g.fillStyle(0xff0000);
            g.fillRect(8, 8, 3, 3);
            g.fillRect(13, 8, 3, 3);
        } else if (type === 'soldier') {
            g.fillStyle(data.color);
            g.fillRect(2, 2, 20, 24);
            g.fillStyle(0x2a2a2a);
            g.fillRect(4, 4, 16, 8);
            g.fillStyle(0xff4444);
            g.fillRect(8, 6, 8, 4);
            g.fillStyle(0x1a1a1a);
            g.fillRect(20, 10, 6, 4); // Gun arm
        } else if (type === 'crawler') {
            g.fillStyle(data.color);
            g.fillEllipse(12, 12, 20, 16);
            g.fillStyle(0x2a5a2a);
            for (let i = 0; i < 6; i++) {
                g.fillRect(2 + i * 3, 18, 2, 6);
            }
            g.fillStyle(0xff6666);
            g.fillRect(6, 6, 4, 4);
            g.fillRect(14, 6, 4, 4);
        }
        g.generateTexture(`enemy_${type}`, 28, 28);
        g.destroy();
    });

    // Bullet
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffff00);
    g.fillCircle(4, 4, 4);
    g.generateTexture('bullet', 8, 8);
    g.destroy();

    // Enemy bullet
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff4444);
    g.fillCircle(4, 4, 4);
    g.generateTexture('enemy_bullet', 8, 8);
    g.destroy();

    // Wall tile
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2a3a4a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x1a2a3a);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 30, 32, 2);
    g.fillRect(0, 0, 2, 32);
    g.fillRect(30, 0, 2, 32);
    g.fillStyle(0x3a4a5a);
    g.fillRect(4, 4, 24, 24);
    g.generateTexture('wall', 32, 32);
    g.destroy();

    // Floor tile
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a22);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x22222a);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if ((i + j) % 2 === 0) {
                g.fillRect(i * 8, j * 8, 8, 8);
            }
        }
    }
    g.fillStyle(0x0a0a12);
    g.fillRect(15, 0, 2, 32);
    g.fillRect(0, 15, 32, 2);
    g.generateTexture('floor', 32, 32);
    g.destroy();

    // Door (closed)
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4a3a2a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6a5a4a);
    g.fillRect(4, 0, 8, 32);
    g.fillRect(20, 0, 8, 32);
    g.fillStyle(0x8a7a6a);
    g.fillRect(14, 12, 4, 8);
    g.generateTexture('door_closed', 32, 32);
    g.destroy();

    // Door (open)
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a22);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a3a2a);
    g.fillRect(0, 0, 6, 32);
    g.fillRect(26, 0, 6, 32);
    g.generateTexture('door_open', 32, 32);
    g.destroy();

    // Locked door
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4a2a2a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6a3a3a);
    g.fillRect(4, 0, 8, 32);
    g.fillRect(20, 0, 8, 32);
    g.fillStyle(0xff4444);
    g.fillRect(12, 10, 8, 12);
    g.fillStyle(0xaa2222);
    g.fillRect(14, 14, 4, 4);
    g.generateTexture('door_locked', 32, 32);
    g.destroy();

    // Turret
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5a5a6a);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(0x3a3a4a);
    g.fillRect(8, 8, 16, 16);
    g.fillStyle(0xff0000);
    g.fillCircle(16, 16, 4);
    g.fillStyle(0x2a2a3a);
    g.fillRect(14, 0, 4, 8);
    g.generateTexture('turret_hostile', 32, 32);
    g.destroy();

    // Friendly turret
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5a6a5a);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(0x3a4a3a);
    g.fillRect(8, 8, 16, 16);
    g.fillStyle(0x00ff00);
    g.fillCircle(16, 16, 4);
    g.fillStyle(0x2a3a2a);
    g.fillRect(14, 0, 4, 8);
    g.generateTexture('turret_friendly', 32, 32);
    g.destroy();

    // Items
    const itemColors = {
        medpatch: 0x44aa44,
        medkit: 0x22ff22,
        bullets: 0xaaaa44,
        shells: 0xaa6644,
        energy_cell: 0x4444ff,
        keycard_yellow: 0xffff00,
        keycard_red: 0xff4444,
        repair_kit: 0x888888,
        cells: 0x44aaff
    };

    Object.entries(itemColors).forEach(([item, color]) => {
        g = scene.make.graphics({ x: 0, y: 0 });
        g.fillStyle(color);
        if (item.includes('keycard')) {
            g.fillRect(4, 8, 16, 10);
            g.fillStyle(0xffffff);
            g.fillRect(6, 12, 4, 3);
        } else if (item.includes('med')) {
            g.fillRect(6, 4, 12, 16);
            g.fillStyle(0xffffff);
            g.fillRect(10, 6, 4, 12);
            g.fillRect(6, 10, 12, 4);
        } else {
            g.fillRect(4, 6, 16, 12);
        }
        g.generateTexture(`item_${item}`, 24, 24);
        g.destroy();
    });

    // Container
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4a4a5a);
    g.fillRect(2, 4, 28, 24);
    g.fillStyle(0x3a3a4a);
    g.fillRect(4, 6, 24, 20);
    g.fillStyle(0x6a6a7a);
    g.fillRect(12, 2, 8, 4);
    g.generateTexture('container', 32, 32);
    g.destroy();

    // Container (opened)
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3a3a4a);
    g.fillRect(2, 8, 28, 20);
    g.fillStyle(0x2a2a3a);
    g.fillRect(4, 10, 24, 16);
    g.fillStyle(0x4a4a5a);
    g.fillRect(2, 0, 28, 10);
    g.lineStyle(2, 0x2a2a3a);
    g.strokeRect(2, 0, 28, 10);
    g.generateTexture('container_open', 32, 32);
    g.destroy();

    // Elevator
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3a5a6a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x2a4a5a);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(0x4a7a8a);
    g.fillRect(8, 8, 6, 16);
    g.fillRect(18, 8, 6, 16);
    g.fillStyle(0x6a9aaa);
    g.fillTriangle(16, 4, 12, 12, 20, 12);
    g.fillTriangle(16, 28, 12, 20, 20, 20);
    g.generateTexture('elevator', 32, 32);
    g.destroy();

    // Escape pod
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x6a8a6a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a6a4a);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(0x8aba8a);
    g.fillCircle(16, 16, 8);
    g.fillStyle(0xaadaaa);
    g.fillRect(10, 4, 12, 4);
    g.generateTexture('escape_pod', 32, 32);
    g.destroy();

    // Blood decal
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8a2222);
    g.fillCircle(8, 8, 6);
    g.fillCircle(12, 10, 4);
    g.fillCircle(6, 12, 3);
    g.generateTexture('blood', 16, 16);
    g.destroy();
}

// Scenes
function preload() {
    // Phaser built-in loading
}

function create() {
    createTextures(this);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    keys = {
        W: this.input.keyboard.addKey('W'),
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
        E: this.input.keyboard.addKey('E'),
        F: this.input.keyboard.addKey('F'),
        Q: this.input.keyboard.addKey('Q'),
        R: this.input.keyboard.addKey('R'),
        SPACE: this.input.keyboard.addKey('SPACE'),
        SHIFT: this.input.keyboard.addKey('SHIFT')
    };

    // Debug toggle
    keys.Q.on('down', () => { debugMode = !debugMode; });
    keys.F.on('down', () => { flashlightOn = !flashlightOn; });

    // Start on title
    gameState = 'title';

    // Initialize player (hidden until game starts)
    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);
    player.setDepth(10);
    player.visible = false;

    // Groups
    this.enemyGroup = this.physics.add.group();
    this.bulletGroup = this.physics.add.group();
    this.enemyBulletGroup = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    this.wallGroup = this.physics.add.staticGroup();
    this.doorGroup = this.physics.add.staticGroup();
    this.turretGroup = this.physics.add.group();

    // Store scene reference
    this.gameScene = this;

    // Camera
    camera = this.cameras.main;

    // Mouse input for shooting
    this.input.on('pointerdown', (pointer) => {
        if (gameState === 'title') {
            startGame(this);
        } else if (gameState === 'playing') {
            shoot(this, pointer);
        } else if (gameState === 'hacking') {
            handleHackClick(this, pointer);
        } else if (gameState === 'gameover' || gameState === 'victory') {
            resetGame(this);
        }
    });

    // Keyboard start
    this.input.keyboard.on('keydown-SPACE', () => {
        if (gameState === 'title') {
            startGame(this);
        } else if (gameState === 'gameover' || gameState === 'victory') {
            resetGame(this);
        }
    });

    // Interaction key
    keys.E.on('down', () => {
        if (gameState === 'playing') {
            interact(this);
        } else if (gameState === 'hacking') {
            // Confirm hack selection
        }
    });
}

function startGame(scene) {
    gameState = 'playing';
    currentDeck = 1;
    playerStats = {
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        ammo: { bullets: 30, shells: 0, cells: 0 },
        weapon: 'pistol',
        keycards: [],
        inventory: []
    };

    loadDeck(scene, currentDeck);
}

function loadDeck(scene, deckNum) {
    // Clear previous
    scene.wallGroup.clear(true, true);
    scene.doorGroup.clear(true, true);
    scene.enemyGroup.clear(true, true);
    scene.itemGroup.clear(true, true);
    scene.turretGroup.clear(true, true);
    scene.bulletGroup.clear(true, true);
    scene.enemyBulletGroup.clear(true, true);
    enemies = [];
    doors = [];
    turrets = [];
    items = [];
    containers = [];
    decals = [];

    const deck = deckLayouts[deckNum];
    const worldW = ROOM_WIDTH * TILE_SIZE;
    const worldH = ROOM_HEIGHT * TILE_SIZE;

    scene.physics.world.setBounds(0, 0, worldW, worldH);
    camera.setBounds(0, 0, worldW, worldH);

    // Create floor tiles
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            scene.add.image(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'floor').setDepth(0);
        }
    }

    // Create walls around rooms and between them
    const wallMap = createWallMap(deck);

    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            if (wallMap[y][x]) {
                const wall = scene.wallGroup.create(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'wall');
                wall.setImmovable(true);
            }
        }
    }

    // Create doors
    deck.doors.forEach(d => {
        const door = {
            x: d.x * TILE_SIZE + 16,
            y: d.y * TILE_SIZE + 16,
            locked: d.locked,
            keycard: d.keycard || null,
            open: false,
            sprite: null
        };

        const tex = d.locked ? 'door_locked' : 'door_closed';
        door.sprite = scene.doorGroup.create(door.x, door.y, tex);
        door.sprite.doorData = door;
        doors.push(door);
    });

    // Create elevator
    if (deck.elevator) {
        const elev = deck.elevator;
        const elevSprite = scene.add.image(elev.x * TILE_SIZE + 16, elev.y * TILE_SIZE + 16, 'elevator').setDepth(1);
        elevSprite.isElevator = true;
        elevSprite.toDeck = elev.toDeck;
    }

    // Create escape pod if present
    if (deck.escape) {
        const esc = deck.escape;
        const escSprite = scene.add.image(esc.x * TILE_SIZE + 16, esc.y * TILE_SIZE + 16, 'escape_pod').setDepth(1);
        escSprite.isEscape = true;
    }

    // Create enemies
    deck.enemies.forEach(e => {
        spawnEnemy(scene, e.x * TILE_SIZE + 16, e.y * TILE_SIZE + 16, e.type);
    });

    // Create turrets
    deck.turrets.forEach(t => {
        const turret = {
            x: t.x * TILE_SIZE + 16,
            y: t.y * TILE_SIZE + 16,
            friendly: t.friendly,
            hp: 50,
            lastShot: 0,
            sprite: null
        };
        turret.sprite = scene.turretGroup.create(turret.x, turret.y, t.friendly ? 'turret_friendly' : 'turret_hostile');
        turret.sprite.turretData = turret;
        turrets.push(turret);
    });

    // Create items
    deck.items.forEach(i => {
        spawnItem(scene, i.x * TILE_SIZE + 16, i.y * TILE_SIZE + 16, i.type);
    });

    // Create containers
    deck.containers.forEach(c => {
        const cont = {
            x: c.x * TILE_SIZE + 16,
            y: c.y * TILE_SIZE + 16,
            contents: [...c.contents],
            opened: false,
            sprite: null
        };
        cont.sprite = scene.add.image(cont.x, cont.y, 'container').setDepth(1);
        cont.sprite.containerData = cont;
        containers.push(cont);
    });

    // Position player
    const start = deck.playerStart;
    player.setPosition(start.x * TILE_SIZE + 16, start.y * TILE_SIZE + 16);
    player.visible = true;

    camera.startFollow(player, true, 0.1, 0.1);

    // Collision
    scene.physics.add.collider(player, scene.wallGroup);
    scene.physics.add.collider(player, scene.doorGroup, handleDoorCollision);
    scene.physics.add.collider(scene.enemyGroup, scene.wallGroup);
    scene.physics.add.collider(scene.bulletGroup, scene.wallGroup, (bullet) => bullet.destroy());
    scene.physics.add.collider(scene.enemyBulletGroup, scene.wallGroup, (bullet) => bullet.destroy());

    // Bullet hits
    scene.physics.add.overlap(scene.bulletGroup, scene.enemyGroup, bulletHitEnemy, null, scene);
    scene.physics.add.overlap(scene.bulletGroup, scene.turretGroup, bulletHitTurret, null, scene);
    scene.physics.add.overlap(scene.enemyBulletGroup, player, enemyBulletHitPlayer, null, scene);
}

function createWallMap(deck) {
    const map = [];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            map[y][x] = true; // Start with all walls
        }
    }

    // Carve out rooms
    deck.rooms.forEach(room => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < ROOM_HEIGHT && x >= 0 && x < ROOM_WIDTH) {
                    map[y][x] = false;
                }
            }
        }
    });

    // Carve door passages
    deck.doors.forEach(d => {
        if (d.y >= 0 && d.y < ROOM_HEIGHT && d.x >= 0 && d.x < ROOM_WIDTH) {
            map[d.y][d.x] = false;
        }
    });

    // Carve elevator and escape positions
    if (deck.elevator) {
        const e = deck.elevator;
        if (e.y >= 0 && e.y < ROOM_HEIGHT && e.x >= 0 && e.x < ROOM_WIDTH) {
            map[e.y][e.x] = false;
        }
    }
    if (deck.escape) {
        const e = deck.escape;
        if (e.y >= 0 && e.y < ROOM_HEIGHT && e.x >= 0 && e.x < ROOM_WIDTH) {
            map[e.y][e.x] = false;
        }
    }

    return map;
}

function spawnEnemy(scene, x, y, type) {
    const data = enemyTypes[type];
    const enemy = scene.enemyGroup.create(x, y, `enemy_${type}`);
    enemy.enemyData = {
        type: type,
        hp: data.hp,
        maxHp: data.hp,
        speed: data.speed,
        damage: data.damage,
        behavior: data.behavior,
        range: data.range,
        state: 'patrol',
        patrolTarget: { x: x + Phaser.Math.Between(-100, 100), y: y + Phaser.Math.Between(-100, 100) },
        lastShot: 0,
        alertTimer: 0
    };
    enemy.setDepth(5);
    enemies.push(enemy);
}

function spawnItem(scene, x, y, type) {
    const item = scene.itemGroup.create(x, y, `item_${type}`);
    item.itemType = type;
    item.setDepth(2);
    items.push(item);

    // Bobbing animation
    scene.tweens.add({
        targets: item,
        y: y - 4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

function handleDoorCollision(playerSprite, doorSprite) {
    const door = doorSprite.doorData;
    if (!door) return;

    if (door.open) {
        // Allow passage
    } else if (door.locked) {
        if (door.keycard && playerStats.keycards.includes(door.keycard)) {
            openDoor(door, doorSprite);
        }
    } else {
        openDoor(door, doorSprite);
    }
}

function openDoor(door, sprite) {
    door.open = true;
    door.locked = false;
    sprite.setTexture('door_open');
    sprite.body.enable = false;
}

function shoot(scene, pointer) {
    const now = scene.time.now;
    if (now - lastShotTime < 300) return; // Fire rate

    if (playerStats.ammo.bullets <= 0) return;

    lastShotTime = now;
    playerStats.ammo.bullets--;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);

    const bullet = scene.bulletGroup.create(player.x, player.y, 'bullet');
    bullet.setDepth(8);
    const speed = 400;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.damage = 12;

    // Muzzle flash effect
    const flash = scene.add.circle(player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20, 8, 0xffff00);
    flash.setDepth(15);
    scene.time.delayedCall(50, () => flash.destroy());

    // Destroy bullet after 1 second
    scene.time.delayedCall(1000, () => { if (bullet.active) bullet.destroy(); });
}

function bulletHitEnemy(bullet, enemy) {
    bullet.destroy();

    const data = enemy.enemyData;
    data.hp -= bullet.damage || 12;
    data.state = 'chase';

    // Flash white
    enemy.setTint(0xffffff);
    this.time.delayedCall(100, () => {
        if (enemy.active) enemy.clearTint();
    });

    // Floating damage
    showFloatingText(this, enemy.x, enemy.y - 20, `-${bullet.damage || 12}`, 0xff4444);

    if (data.hp <= 0) {
        killEnemy(this, enemy);
    }
}

function bulletHitTurret(bullet, turretSprite) {
    bullet.destroy();
    const turret = turretSprite.turretData;
    turret.hp -= bullet.damage || 12;

    turretSprite.setTint(0xffffff);
    this.time.delayedCall(100, () => {
        if (turretSprite.active) turretSprite.clearTint();
    });

    if (turret.hp <= 0) {
        // Create explosion
        const exp = this.add.circle(turret.x, turret.y, 20, 0xff8800);
        exp.setDepth(15);
        this.time.delayedCall(200, () => exp.destroy());

        turretSprite.destroy();
        turrets = turrets.filter(t => t !== turret);
    }
}

function enemyBulletHitPlayer(playerSprite, bullet) {
    bullet.destroy();

    takeDamage(this, bullet.damage || 10);
}

function takeDamage(scene, amount) {
    playerStats.health -= amount;

    // Screen shake
    camera.shake(100, 0.01);

    // Flash red
    player.setTint(0xff0000);
    scene.time.delayedCall(100, () => player.clearTint());

    showFloatingText(scene, player.x, player.y - 20, `-${amount}`, 0xff0000);

    if (playerStats.health <= 0) {
        playerStats.health = 0;
        gameState = 'gameover';
    }
}

function killEnemy(scene, enemy) {
    // Blood decal
    const blood = scene.add.image(enemy.x, enemy.y, 'blood').setDepth(1);
    blood.setAlpha(0.7);
    decals.push(blood);

    // Explosion effect
    const exp = scene.add.circle(enemy.x, enemy.y, 15, 0xff4444);
    exp.setDepth(15);
    scene.time.delayedCall(150, () => exp.destroy());

    // Remove from array
    enemies = enemies.filter(e => e !== enemy);
    enemy.destroy();
}

function showFloatingText(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: `#${color.toString(16).padStart(6, '0')}`
    }).setDepth(20);

    scene.tweens.add({
        targets: txt,
        y: y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => txt.destroy()
    });
}

function interact(scene) {
    // Check for nearby interactables
    const interactRange = 50;

    // Check items
    items.forEach(item => {
        if (!item.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, item.x, item.y);
        if (dist < interactRange) {
            pickupItem(scene, item);
        }
    });

    // Check containers
    containers.forEach(cont => {
        if (cont.opened) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, cont.x, cont.y);
        if (dist < interactRange) {
            openContainer(scene, cont);
        }
    });

    // Check doors for hacking
    doors.forEach(door => {
        if (!door.locked) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, door.x, door.y);
        if (dist < interactRange) {
            startHacking(scene, door, 'door');
        }
    });

    // Check turrets for hacking
    turrets.forEach(turret => {
        if (turret.friendly) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, turret.x, turret.y);
        if (dist < interactRange) {
            startHacking(scene, turret, 'turret');
        }
    });

    // Check elevator
    scene.children.list.forEach(child => {
        if (child.isElevator) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, child.x, child.y);
            if (dist < interactRange) {
                // Change deck
                currentDeck = child.toDeck;
                loadDeck(scene, currentDeck);
            }
        }
        if (child.isEscape) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, child.x, child.y);
            if (dist < interactRange) {
                // Victory!
                gameState = 'victory';
            }
        }
    });
}

function pickupItem(scene, item) {
    const type = item.itemType;

    if (type === 'medpatch') {
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 25);
        showFloatingText(scene, item.x, item.y, '+25 HP', 0x44ff44);
    } else if (type === 'medkit') {
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 50);
        showFloatingText(scene, item.x, item.y, '+50 HP', 0x44ff44);
    } else if (type === 'bullets') {
        playerStats.ammo.bullets += 20;
        showFloatingText(scene, item.x, item.y, '+20 Bullets', 0xffff44);
    } else if (type === 'shells') {
        playerStats.ammo.shells += 8;
        showFloatingText(scene, item.x, item.y, '+8 Shells', 0xffaa44);
    } else if (type === 'energy_cell' || type === 'cells') {
        playerStats.energy = Math.min(playerStats.maxEnergy, playerStats.energy + 50);
        showFloatingText(scene, item.x, item.y, '+50 Energy', 0x4444ff);
    } else if (type === 'keycard_yellow') {
        if (!playerStats.keycards.includes('yellow')) {
            playerStats.keycards.push('yellow');
            showFloatingText(scene, item.x, item.y, 'Yellow Keycard!', 0xffff00);
        }
    } else if (type === 'keycard_red') {
        if (!playerStats.keycards.includes('red')) {
            playerStats.keycards.push('red');
            showFloatingText(scene, item.x, item.y, 'Red Keycard!', 0xff4444);
        }
    } else if (type === 'repair_kit') {
        playerStats.inventory.push('repair_kit');
        showFloatingText(scene, item.x, item.y, 'Repair Kit', 0x888888);
    }

    items = items.filter(i => i !== item);
    item.destroy();
}

function openContainer(scene, cont) {
    cont.opened = true;
    cont.sprite.setTexture('container_open');

    // Spawn contents
    cont.contents.forEach((itemType, i) => {
        const offsetX = (i % 2) * 20 - 10;
        const offsetY = Math.floor(i / 2) * 20 + 30;
        spawnItem(scene, cont.x + offsetX, cont.y + offsetY, itemType);
    });

    showFloatingText(scene, cont.x, cont.y - 20, 'Opened!', 0xaaaaaa);
}

// Hacking system
let hackTarget = null;
let hackType = null;
let hackTimer = 0;
let hackProgress = 0;
let hackGrid = [];
let hackCursor = { x: 0, y: 0 };
let hackPath = [];
let hackSource = { x: 0, y: 0 };
let hackGoal = { x: 5, y: 0 };

function startHacking(scene, target, type) {
    hackTarget = target;
    hackType = type;
    gameState = 'hacking';
    hackTimer = type === 'door' ? 10 : 15;
    hackProgress = 0;

    // Generate simple 6x4 grid
    hackGrid = [];
    for (let y = 0; y < 4; y++) {
        hackGrid[y] = [];
        for (let x = 0; x < 6; x++) {
            // 0 = empty, 1 = blocked, 2 = source, 3 = target
            hackGrid[y][x] = Math.random() < 0.2 ? 1 : 0;
        }
    }

    hackSource = { x: 0, y: Math.floor(Math.random() * 4) };
    hackGoal = { x: 5, y: Math.floor(Math.random() * 4) };
    hackGrid[hackSource.y][hackSource.x] = 2;
    hackGrid[hackGoal.y][hackGoal.x] = 3;
    hackCursor = { ...hackSource };
    hackPath = [{ ...hackSource }];
}

function handleHackClick(scene, pointer) {
    // Simple click-based path building
    const gridX = Math.floor((pointer.x - 250) / 50);
    const gridY = Math.floor((pointer.y - 200) / 50);

    if (gridX >= 0 && gridX < 6 && gridY >= 0 && gridY < 4) {
        const last = hackPath[hackPath.length - 1];
        const dx = Math.abs(gridX - last.x);
        const dy = Math.abs(gridY - last.y);

        // Must be adjacent
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            if (hackGrid[gridY][gridX] !== 1) {
                hackPath.push({ x: gridX, y: gridY });
                hackCursor = { x: gridX, y: gridY };

                // Check win
                if (gridX === hackGoal.x && gridY === hackGoal.y) {
                    completeHack(scene, true);
                }
            }
        }
    }
}

function completeHack(scene, success) {
    gameState = 'playing';

    if (success) {
        if (hackType === 'door') {
            openDoor(hackTarget, hackTarget.sprite);
            showFloatingText(scene, hackTarget.x, hackTarget.y, 'HACKED!', 0x44ff44);
        } else if (hackType === 'turret') {
            hackTarget.friendly = true;
            hackTarget.sprite.setTexture('turret_friendly');
            showFloatingText(scene, hackTarget.x, hackTarget.y, 'REPROGRAMMED!', 0x44ff44);
        }
    } else {
        showFloatingText(scene, player.x, player.y, 'HACK FAILED!', 0xff4444);
        // Trigger alarm - spawn enemy nearby
        if (enemies.length < 10) {
            spawnEnemy(scene, player.x + 100, player.y + 100, 'drone');
        }
    }

    hackTarget = null;
    hackType = null;
}

function updateHacking(scene, delta) {
    hackTimer -= delta / 1000;
    if (hackTimer <= 0) {
        completeHack(scene, false);
    }
}

function update(time, delta) {
    if (gameState === 'title') {
        drawTitle(this);
        return;
    }

    if (gameState === 'gameover') {
        drawGameOver(this);
        return;
    }

    if (gameState === 'victory') {
        drawVictory(this);
        return;
    }

    if (gameState === 'hacking') {
        updateHacking(this, delta);
        drawHacking(this);
        return;
    }

    if (gameState !== 'playing') return;

    // Player movement
    let vx = 0, vy = 0;
    const speed = keys.SHIFT.isDown ? 200 : 150;

    if (keys.W.isDown) vy = -speed;
    if (keys.S.isDown) vy = speed;
    if (keys.A.isDown) vx = -speed;
    if (keys.D.isDown) vx = speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }

    player.setVelocity(vx, vy);

    // Sprint energy cost
    if (keys.SHIFT.isDown && (vx !== 0 || vy !== 0)) {
        playerStats.energy = Math.max(0, playerStats.energy - delta * 0.005);
    }

    // Energy regen
    if (!keys.SHIFT.isDown) {
        playerStats.energy = Math.min(playerStats.maxEnergy, playerStats.energy + delta * 0.002);
    }

    // Rotate player toward mouse
    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    player.setRotation(angle + Math.PI / 2);

    // Update enemies
    updateEnemies(this, time, delta);

    // Update turrets
    updateTurrets(this, time);

    // Draw HUD and vision
    drawGame(this, pointer);
}

function updateEnemies(scene, time, delta) {
    enemies.forEach(enemy => {
        if (!enemy.active) return;

        const data = enemy.enemyData;
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

        // Detection
        if (distToPlayer < 200) {
            data.state = 'chase';
            data.alertTimer = 5000;
        } else if (data.alertTimer > 0) {
            data.alertTimer -= delta;
        } else {
            data.state = 'patrol';
        }

        if (data.state === 'chase') {
            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

            if (data.behavior === 'ranged' && distToPlayer < data.range) {
                // Stop and shoot
                enemy.setVelocity(0, 0);

                if (time - data.lastShot > 1500) {
                    data.lastShot = time;
                    enemyShoot(scene, enemy, angle);
                }
            } else {
                enemy.setVelocity(Math.cos(angle) * data.speed, Math.sin(angle) * data.speed);

                // Melee attack
                if (distToPlayer < 30 && time - data.lastShot > 1000) {
                    data.lastShot = time;
                    takeDamage(scene, data.damage);
                }
            }
        } else {
            // Patrol
            const distToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, data.patrolTarget.x, data.patrolTarget.y);

            if (distToTarget < 20) {
                data.patrolTarget = {
                    x: enemy.x + Phaser.Math.Between(-100, 100),
                    y: enemy.y + Phaser.Math.Between(-100, 100)
                };
            }

            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, data.patrolTarget.x, data.patrolTarget.y);
            enemy.setVelocity(Math.cos(angle) * data.speed * 0.3, Math.sin(angle) * data.speed * 0.3);
        }
    });
}

function enemyShoot(scene, enemy, angle) {
    const bullet = scene.enemyBulletGroup.create(enemy.x, enemy.y, 'enemy_bullet');
    bullet.setDepth(8);
    bullet.damage = enemy.enemyData.damage;
    const speed = 250;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    scene.time.delayedCall(2000, () => { if (bullet.active) bullet.destroy(); });
}

function updateTurrets(scene, time) {
    turrets.forEach(turret => {
        if (!turret.sprite || !turret.sprite.active) return;

        // Find target
        let target = null;
        let minDist = 250;

        if (turret.friendly) {
            // Target enemies
            enemies.forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(turret.x, turret.y, enemy.x, enemy.y);
                if (dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            });
        } else {
            // Target player
            const dist = Phaser.Math.Distance.Between(turret.x, turret.y, player.x, player.y);
            if (dist < 250) {
                target = player;
            }
        }

        if (target && time - turret.lastShot > 1000) {
            turret.lastShot = time;

            const angle = Phaser.Math.Angle.Between(turret.x, turret.y, target.x, target.y);
            turret.sprite.setRotation(angle - Math.PI / 2);

            if (turret.friendly) {
                // Shoot at enemy
                const bullet = scene.bulletGroup.create(turret.x, turret.y, 'bullet');
                bullet.setDepth(8);
                bullet.damage = 15;
                const speed = 300;
                bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                scene.time.delayedCall(1500, () => { if (bullet.active) bullet.destroy(); });
            } else {
                // Shoot at player
                const bullet = scene.enemyBulletGroup.create(turret.x, turret.y, 'enemy_bullet');
                bullet.setDepth(8);
                bullet.damage = 15;
                const speed = 300;
                bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                scene.time.delayedCall(1500, () => { if (bullet.active) bullet.destroy(); });
            }
        }
    });
}

function drawGame(scene, pointer) {
    // Clear previous UI
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    // Vision cone / darkness overlay
    if (flashlightOn) {
        drawVisionCone(scene, pointer);
    }

    // HUD
    drawHUD(scene);

    // Debug
    if (debugMode) {
        drawDebug(scene);
    }
}

function drawVisionCone(scene, pointer) {
    const graphics = scene.add.graphics();
    graphics.isUI = true;
    graphics.setDepth(3);

    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);

    // Draw dark overlay everywhere except vision cone
    graphics.fillStyle(0x000000, 0.7);

    // Create mask shape
    const maskGraphics = scene.make.graphics();

    // Full screen dark
    graphics.fillRect(camera.scrollX, camera.scrollY, 800, 600);

    // Clear the vision cone area
    const clearGraphics = scene.add.graphics();
    clearGraphics.isUI = true;
    clearGraphics.setDepth(2);

    // Draw vision cone (lit area)
    clearGraphics.fillStyle(0x000000, 0);
    clearGraphics.beginPath();
    clearGraphics.moveTo(player.x, player.y);

    const steps = 30;
    for (let i = 0; i <= steps; i++) {
        const a = angle - VISION_CONE_ANGLE / 2 + (VISION_CONE_ANGLE * i / steps);
        const x = player.x + Math.cos(a) * VISION_RANGE;
        const y = player.y + Math.sin(a) * VISION_RANGE;
        clearGraphics.lineTo(x, y);
    }

    clearGraphics.closePath();

    // Actually we need a different approach for Phaser
    // Use blend mode to "cut" the darkness
    graphics.setBlendMode(Phaser.BlendModes.NORMAL);

    // Draw the lit vision cone
    const lightGraphics = scene.add.graphics();
    lightGraphics.isUI = true;
    lightGraphics.setDepth(4);
    lightGraphics.fillStyle(0xffffff, 0.1);
    lightGraphics.beginPath();
    lightGraphics.moveTo(player.x, player.y);

    for (let i = 0; i <= steps; i++) {
        const a = angle - VISION_CONE_ANGLE / 2 + (VISION_CONE_ANGLE * i / steps);
        const x = player.x + Math.cos(a) * VISION_RANGE;
        const y = player.y + Math.sin(a) * VISION_RANGE;
        lightGraphics.lineTo(x, y);
    }

    lightGraphics.closePath();
    lightGraphics.fill();

    // Dim entities outside vision cone
    enemies.forEach(enemy => {
        const ea = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        const ad = Phaser.Math.Angle.Wrap(ea - angle);
        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);

        if (Math.abs(ad) > VISION_CONE_ANGLE / 2 || dist > VISION_RANGE) {
            enemy.setAlpha(0.3);
        } else {
            enemy.setAlpha(1);
        }
    });

    // Also dim items outside vision
    items.forEach(item => {
        if (!item.active) return;
        const ea = Phaser.Math.Angle.Between(player.x, player.y, item.x, item.y);
        const ad = Phaser.Math.Angle.Wrap(ea - angle);
        const dist = Phaser.Math.Distance.Between(player.x, player.y, item.x, item.y);

        if (Math.abs(ad) > VISION_CONE_ANGLE / 2 || dist > VISION_RANGE) {
            item.setAlpha(0.3);
        } else {
            item.setAlpha(1);
        }
    });
}

function drawHUD(scene) {
    const sx = camera.scrollX;
    const sy = camera.scrollY;

    // Background panel
    const panel = scene.add.rectangle(sx + 10, sy + 10, 180, 200, 0x0a0a12, 0.8);
    panel.setOrigin(0, 0);
    panel.setDepth(100);
    panel.isUI = true;

    const border = scene.add.rectangle(sx + 10, sy + 10, 180, 200);
    border.setOrigin(0, 0);
    border.setStrokeStyle(1, 0x3a5a6a);
    border.setDepth(100);
    border.isUI = true;

    // Deck name
    const deckName = deckLayouts[currentDeck].name;
    const deckText = scene.add.text(sx + 20, sy + 15, deckName, {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#6a9aba'
    }).setDepth(101);
    deckText.isUI = true;

    // Health bar
    const healthBg = scene.add.rectangle(sx + 20, sy + 35, 150, 12, 0x2a2a2a);
    healthBg.setOrigin(0, 0);
    healthBg.setDepth(101);
    healthBg.isUI = true;

    const healthFill = scene.add.rectangle(sx + 20, sy + 35, 150 * (playerStats.health / playerStats.maxHealth), 12, 0xaa2222);
    healthFill.setOrigin(0, 0);
    healthFill.setDepth(102);
    healthFill.isUI = true;

    const healthLabel = scene.add.text(sx + 22, sy + 36, `HP: ${Math.floor(playerStats.health)}/${playerStats.maxHealth}`, {
        fontSize: '9px',
        fontFamily: 'Courier New',
        color: '#ffffff'
    }).setDepth(103);
    healthLabel.isUI = true;

    // Energy bar
    const energyBg = scene.add.rectangle(sx + 20, sy + 52, 150, 12, 0x2a2a2a);
    energyBg.setOrigin(0, 0);
    energyBg.setDepth(101);
    energyBg.isUI = true;

    const energyFill = scene.add.rectangle(sx + 20, sy + 52, 150 * (playerStats.energy / playerStats.maxEnergy), 12, 0x2244aa);
    energyFill.setOrigin(0, 0);
    energyFill.setDepth(102);
    energyFill.isUI = true;

    const energyLabel = scene.add.text(sx + 22, sy + 53, `EN: ${Math.floor(playerStats.energy)}/${playerStats.maxEnergy}`, {
        fontSize: '9px',
        fontFamily: 'Courier New',
        color: '#ffffff'
    }).setDepth(103);
    energyLabel.isUI = true;

    // Weapon info
    const weaponText = scene.add.text(sx + 20, sy + 75, `[${playerStats.weapon.toUpperCase()}]`, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#aaaaaa'
    }).setDepth(101);
    weaponText.isUI = true;

    const ammoText = scene.add.text(sx + 20, sy + 90, `Ammo: ${playerStats.ammo.bullets}`, {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#aaaa44'
    }).setDepth(101);
    ammoText.isUI = true;

    // Keycards
    let keyY = 110;
    if (playerStats.keycards.length > 0) {
        const keyLabel = scene.add.text(sx + 20, sy + keyY, 'Keycards:', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#888888'
        }).setDepth(101);
        keyLabel.isUI = true;
        keyY += 15;

        playerStats.keycards.forEach(kc => {
            const color = kc === 'yellow' ? '#ffff00' : kc === 'red' ? '#ff4444' : '#4444ff';
            const kcText = scene.add.text(sx + 25, sy + keyY, `- ${kc}`, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: color
            }).setDepth(101);
            kcText.isUI = true;
            keyY += 12;
        });
    }

    // Controls hint
    const controlsText = scene.add.text(sx + 20, sy + 165, 'WASD:Move E:Interact\nClick:Shoot F:Light Q:Debug', {
        fontSize: '8px',
        fontFamily: 'Courier New',
        color: '#555555'
    }).setDepth(101);
    controlsText.isUI = true;

    // Minimap
    drawMinimap(scene, sx, sy);
}

function drawMinimap(scene, sx, sy) {
    const mapX = sx + 620;
    const mapY = sy + 10;
    const mapW = 170;
    const mapH = 130;
    const scale = 5;

    // Background
    const mapBg = scene.add.rectangle(mapX, mapY, mapW, mapH, 0x0a0a12, 0.8);
    mapBg.setOrigin(0, 0);
    mapBg.setDepth(100);
    mapBg.isUI = true;

    const mapBorder = scene.add.rectangle(mapX, mapY, mapW, mapH);
    mapBorder.setOrigin(0, 0);
    mapBorder.setStrokeStyle(1, 0x3a5a6a);
    mapBorder.setDepth(100);
    mapBorder.isUI = true;

    // Draw rooms
    const deck = deckLayouts[currentDeck];
    deck.rooms.forEach(room => {
        const rx = mapX + 10 + room.x * scale;
        const ry = mapY + 10 + room.y * scale;
        const rw = room.w * scale;
        const rh = room.h * scale;

        const roomRect = scene.add.rectangle(rx, ry, rw, rh, 0x1a2a3a);
        roomRect.setOrigin(0, 0);
        roomRect.setDepth(101);
        roomRect.isUI = true;
    });

    // Draw player position
    const px = mapX + 10 + (player.x / TILE_SIZE) * scale;
    const py = mapY + 10 + (player.y / TILE_SIZE) * scale;
    const playerDot = scene.add.circle(px, py, 3, 0x44ff44);
    playerDot.setDepth(102);
    playerDot.isUI = true;

    // Draw enemies
    enemies.forEach(enemy => {
        const ex = mapX + 10 + (enemy.x / TILE_SIZE) * scale;
        const ey = mapY + 10 + (enemy.y / TILE_SIZE) * scale;
        const enemyDot = scene.add.circle(ex, ey, 2, 0xff4444);
        enemyDot.setDepth(102);
        enemyDot.isUI = true;
    });

    // Elevator/escape markers
    if (deck.elevator) {
        const ex = mapX + 10 + deck.elevator.x * scale;
        const ey = mapY + 10 + deck.elevator.y * scale;
        const elevDot = scene.add.rectangle(ex - 2, ey - 2, 4, 4, 0x4488ff);
        elevDot.setDepth(102);
        elevDot.isUI = true;
    }
    if (deck.escape) {
        const ex = mapX + 10 + deck.escape.x * scale;
        const ey = mapY + 10 + deck.escape.y * scale;
        const escDot = scene.add.rectangle(ex - 3, ey - 3, 6, 6, 0x44ff44);
        escDot.setDepth(102);
        escDot.isUI = true;
    }
}

function drawDebug(scene) {
    const sx = camera.scrollX;
    const sy = camera.scrollY;

    const debugPanel = scene.add.rectangle(sx + 200, sy + 10, 200, 120, 0x0a0a12, 0.9);
    debugPanel.setOrigin(0, 0);
    debugPanel.setDepth(150);
    debugPanel.isUI = true;

    const debugInfo = [
        `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
        `Health: ${Math.floor(playerStats.health)}/${playerStats.maxHealth}`,
        `Energy: ${Math.floor(playerStats.energy)}/${playerStats.maxEnergy}`,
        `Ammo: ${playerStats.ammo.bullets}`,
        `Deck: ${currentDeck}`,
        `Enemies: ${enemies.length}`,
        `Turrets: ${turrets.length}`,
        `State: ${gameState}`
    ];

    debugInfo.forEach((line, i) => {
        const txt = scene.add.text(sx + 210, sy + 15 + i * 13, line, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#44ff44'
        }).setDepth(151);
        txt.isUI = true;
    });
}

function drawHacking(scene) {
    // Clear UI
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const sx = camera.scrollX;
    const sy = camera.scrollY;

    // Background
    const bg = scene.add.rectangle(sx, sy, 800, 600, 0x0a0a12, 0.95);
    bg.setOrigin(0, 0);
    bg.setDepth(200);
    bg.isUI = true;

    // Title
    const title = scene.add.text(sx + 300, sy + 50, `HACKING: ${hackType.toUpperCase()}`, {
        fontSize: '20px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setDepth(201);
    title.isUI = true;

    // Timer
    const timerText = scene.add.text(sx + 550, sy + 50, `Time: ${hackTimer.toFixed(1)}s`, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: hackTimer < 3 ? '#ff4444' : '#ffff44'
    }).setDepth(201);
    timerText.isUI = true;

    // Instructions
    const instr = scene.add.text(sx + 250, sy + 100, 'Click adjacent cells to reach [T]arget from [S]ource', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#888888'
    }).setDepth(201);
    instr.isUI = true;

    // Draw grid
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 6; x++) {
            const cellX = sx + 250 + x * 50;
            const cellY = sy + 200 + y * 50;

            let color = 0x2a3a4a;
            let textChar = '';
            let textColor = '#aaaaaa';

            if (hackGrid[y][x] === 1) {
                color = 0x4a2a2a;
                textChar = 'X';
                textColor = '#ff4444';
            } else if (hackGrid[y][x] === 2) {
                color = 0x2a4a2a;
                textChar = 'S';
                textColor = '#44ff44';
            } else if (hackGrid[y][x] === 3) {
                color = 0x4a4a2a;
                textChar = 'T';
                textColor = '#ffff44';
            }

            // Check if in path
            const inPath = hackPath.some(p => p.x === x && p.y === y);
            if (inPath && hackGrid[y][x] !== 2 && hackGrid[y][x] !== 3) {
                color = 0x3a5a3a;
            }

            const cell = scene.add.rectangle(cellX, cellY, 45, 45, color);
            cell.setDepth(201);
            cell.isUI = true;

            if (textChar) {
                const txt = scene.add.text(cellX - 6, cellY - 8, textChar, {
                    fontSize: '16px',
                    fontFamily: 'Courier New',
                    color: textColor
                }).setDepth(202);
                txt.isUI = true;
            }
        }
    }

    // Draw path lines
    const pathGraphics = scene.add.graphics();
    pathGraphics.setDepth(203);
    pathGraphics.isUI = true;
    pathGraphics.lineStyle(3, 0x44ff44, 0.8);

    for (let i = 1; i < hackPath.length; i++) {
        const p1 = hackPath[i - 1];
        const p2 = hackPath[i];
        pathGraphics.lineBetween(
            sx + 250 + p1.x * 50,
            sy + 200 + p1.y * 50,
            sx + 250 + p2.x * 50,
            sy + 200 + p2.y * 50
        );
    }

    // ESC to abort
    const escText = scene.add.text(sx + 300, sy + 450, 'Press ESC to abort (triggers alarm)', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ff6666'
    }).setDepth(201);
    escText.isUI = true;
}

function drawTitle(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const title = scene.add.text(400, 150, 'SYSTEM SHOCK 2D', {
        fontSize: '36px',
        fontFamily: 'Courier New',
        color: '#44aaff'
    }).setOrigin(0.5).setDepth(100);
    title.isUI = true;

    const subtitle = scene.add.text(400, 200, 'Whispers of M.A.R.I.A.', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#6a8a9a'
    }).setOrigin(0.5).setDepth(100);
    subtitle.isUI = true;

    // Flickering effect
    const flicker = scene.add.text(400, 300, 'Click or Press SPACE to Start', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(100);
    flicker.isUI = true;
    flicker.setAlpha(0.5 + Math.sin(scene.time.now / 200) * 0.5);

    const controls = scene.add.text(400, 400,
        'Controls:\nWASD - Move\nMouse - Aim & Shoot\nE - Interact\nF - Toggle Flashlight\nSHIFT - Sprint\nQ - Debug Mode', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#888888',
        align: 'center'
    }).setOrigin(0.5).setDepth(100);
    controls.isUI = true;

    const story = scene.add.text(400, 520,
        'You awaken on the Von Braun space station.\nThe AI M.A.R.I.A. has gone rogue.\nFind the escape pod on Deck 2 to survive.', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#6a6a8a',
        align: 'center'
    }).setOrigin(0.5).setDepth(100);
    story.isUI = true;
}

function drawGameOver(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x0a0a12, 0.9);
    bg.setDepth(200);
    bg.isUI = true;

    const title = scene.add.text(400, 200, 'SYSTEM FAILURE', {
        fontSize: '40px',
        fontFamily: 'Courier New',
        color: '#ff4444'
    }).setOrigin(0.5).setDepth(201);
    title.isUI = true;

    const subtitle = scene.add.text(400, 260, 'You have been terminated', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#aa4444'
    }).setOrigin(0.5).setDepth(201);
    subtitle.isUI = true;

    const maria = scene.add.text(400, 340, '"Your resistance was... fascinating.\nBut ultimately futile."\n- M.A.R.I.A.', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ff6666',
        align: 'center'
    }).setOrigin(0.5).setDepth(201);
    maria.isUI = true;

    const restart = scene.add.text(400, 450, 'Click or Press SPACE to Restart', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(201);
    restart.isUI = true;
}

function drawVictory(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x0a0a12, 0.9);
    bg.setDepth(200);
    bg.isUI = true;

    const title = scene.add.text(400, 180, 'ESCAPE SUCCESSFUL', {
        fontSize: '36px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(201);
    title.isUI = true;

    const subtitle = scene.add.text(400, 240, 'You have escaped the Von Braun', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#4a8a4a'
    }).setOrigin(0.5).setDepth(201);
    subtitle.isUI = true;

    const story = scene.add.text(400, 320,
        'The escape pod jettisons into the void of space.\n\n' +
        'Behind you, the Von Braun drifts silently.\n' +
        'M.A.R.I.A.\'s systems continue to pulse with artificial life.\n\n' +
        'You escaped... but what about Earth?\n' +
        'Her signal may already be spreading.', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#888888',
        align: 'center'
    }).setOrigin(0.5).setDepth(201);
    story.isUI = true;

    const thanks = scene.add.text(400, 480, 'Thanks for playing!', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#6a9aba'
    }).setOrigin(0.5).setDepth(201);
    thanks.isUI = true;

    const restart = scene.add.text(400, 530, 'Click or Press SPACE to Play Again', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(201);
    restart.isUI = true;
}

function resetGame(scene) {
    gameState = 'title';
    player.visible = false;

    // Clear everything
    scene.wallGroup.clear(true, true);
    scene.doorGroup.clear(true, true);
    scene.enemyGroup.clear(true, true);
    scene.itemGroup.clear(true, true);
    scene.turretGroup.clear(true, true);
    scene.bulletGroup.clear(true, true);
    scene.enemyBulletGroup.clear(true, true);

    enemies = [];
    doors = [];
    turrets = [];
    items = [];
    containers = [];
    decals = [];

    camera.stopFollow();
    camera.setScroll(0, 0);
}
