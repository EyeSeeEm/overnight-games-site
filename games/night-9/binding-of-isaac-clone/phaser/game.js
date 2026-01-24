// The Binding of Isaac Clone
// Phaser 3 Implementation

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const TILE_SIZE = 32;
const ROOM_PIXEL_WIDTH = ROOM_WIDTH * TILE_SIZE;
const ROOM_PIXEL_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

// Colors
const COLORS = {
    FLOOR: 0x4a3728,
    FLOOR_DARK: 0x3a2a1a,
    WALL: 0x2a2a2a,
    WALL_LIGHT: 0x3a3a3a,
    HEART_RED: 0xff4444,
    HEART_SOUL: 0x4488ff,
    TEAR: 0x88ccff,
    BLOOD: 0xaa0000,
    ROCK: 0x555555,
    POOP: 0x7a5a3a,
    DOOR_FRAME: 0x5a4a3a
};

// Game state
let gameState = {
    floor: 1,
    floorName: 'Basement',
    currentRoom: null,
    rooms: [],
    roomGrid: [],
    gridSize: 9,
    visitedRooms: new Set(),
    clearedRooms: new Set(),
    coins: 0,
    bombs: 1,
    keys: 1,
    score: 0,
    kills: 0,
    items: [],
    activeItem: null,
    activeItemCharges: 0,
    maxCharges: 6,
    debugMode: false
};

// Player stats
let playerStats = {
    maxHearts: 3,
    redHearts: 6, // Half hearts (6 = 3 full hearts)
    soulHearts: 0,
    damage: 3.5,
    tears: 10, // Lower = faster
    range: 200,
    shotSpeed: 300,
    speed: 150,
    luck: 0
};

// Item definitions
const ITEMS = {
    sadOnion: { name: 'Sad Onion', effect: 'Tears +0.7', stat: 'tears', value: -0.7, pool: 'treasure' },
    magicMushroom: { name: 'Magic Mushroom', effect: 'All stats up!', stat: 'all', value: 1, pool: 'treasure' },
    pentagram: { name: 'Pentagram', effect: 'Damage +1', stat: 'damage', value: 1, pool: 'devil' },
    speedBall: { name: 'Speed Ball', effect: 'Speed up', stat: 'speed', value: 30, pool: 'treasure' },
    healthUp: { name: 'Health Up', effect: '+1 Heart', stat: 'health', value: 1, pool: 'boss' },
    spoonBender: { name: 'Spoon Bender', effect: 'Homing tears', stat: 'homing', value: true, pool: 'treasure' },
    rubber: { name: 'Rubber Cement', effect: 'Bouncing tears', stat: 'bouncing', value: true, pool: 'treasure' },
    cupidsArrow: { name: "Cupid's Arrow", effect: 'Piercing tears', stat: 'piercing', value: true, pool: 'treasure' },
    polyphemus: { name: 'Polyphemus', effect: 'Huge tears', stat: 'polyphemus', value: true, pool: 'treasure' },
    brimstone: { name: 'Brimstone', effect: 'Blood laser!', stat: 'brimstone', value: true, pool: 'devil' }
};

// Enemy definitions
const ENEMIES = {
    fly: { hp: 5, speed: 100, damage: 0.5, behavior: 'chase', size: 16, color: 0x111111 },
    pooter: { hp: 8, speed: 40, damage: 0.5, behavior: 'shoot', size: 20, color: 0x666655 },
    gaper: { hp: 12, speed: 70, damage: 1, behavior: 'chase', size: 24, color: 0xeeeeee },
    mulligan: { hp: 20, speed: 50, damage: 1, behavior: 'chase', size: 24, color: 0xccccaa, spawnsFlies: true },
    clotty: { hp: 25, speed: 40, damage: 0.5, behavior: 'pattern', size: 24, color: 0xcc4444 },
    fatty: { hp: 40, speed: 30, damage: 1, behavior: 'chase', size: 32, color: 0xffccaa },
    host: { hp: 30, speed: 0, damage: 0.5, behavior: 'popup', size: 24, color: 0xcccccc },
    horf: { hp: 15, speed: 0, damage: 0.5, behavior: 'line', size: 20, color: 0xaa8866 }
};

// Boss definitions
const BOSSES = {
    monstro: { hp: 250, speed: 80, damage: 1, size: 64, color: 0xffaaaa, name: 'Monstro' },
    larryJr: { hp: 60, speed: 100, damage: 1, size: 32, color: 0xaaff88, name: 'Larry Jr.', segments: 4 },
    dukeOfFlies: { hp: 200, speed: 60, damage: 1, size: 48, color: 0x666666, name: 'Duke of Flies' }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Isaac (player)
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        // Body
        g.fillStyle(0xffddcc);
        g.fillCircle(16, 18, 12);
        // Head
        g.fillStyle(0xffddcc);
        g.fillCircle(16, 10, 10);
        // Eyes
        g.fillStyle(0x000000);
        g.fillCircle(12, 9, 3);
        g.fillCircle(20, 9, 3);
        // Tears (always crying)
        g.fillStyle(0x88ccff);
        g.fillEllipse(12, 14, 2, 4);
        g.fillEllipse(20, 14, 2, 4);
        g.generateTexture('isaac', 32, 32);
        g.destroy();

        // Tear projectile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.TEAR);
        g.fillCircle(8, 8, 6);
        g.fillStyle(0xaaddff);
        g.fillCircle(6, 6, 2);
        g.generateTexture('tear', 16, 16);
        g.destroy();

        // Big tear (polyphemus)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.TEAR);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xaaddff);
        g.fillCircle(12, 10, 4);
        g.generateTexture('bigTear', 32, 32);
        g.destroy();

        // Enemy tear
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xcc4444);
        g.fillCircle(6, 6, 5);
        g.generateTexture('enemyTear', 12, 12);
        g.destroy();

        // Heart (full red)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.HEART_RED);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 24);
        g.generateTexture('heartFull', 24, 24);
        g.destroy();

        // Heart (half red)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x444444);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 24);
        g.fillStyle(COLORS.HEART_RED);
        g.beginPath();
        g.moveTo(12, 4);
        g.lineTo(4, 12);
        g.lineTo(12, 24);
        g.closePath();
        g.fill();
        g.generateTexture('heartHalf', 24, 24);
        g.destroy();

        // Heart (empty)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x444444);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 24);
        g.generateTexture('heartEmpty', 24, 24);
        g.destroy();

        // Soul heart
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.HEART_SOUL);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 24);
        g.generateTexture('heartSoul', 24, 24);
        g.destroy();

        // Coin
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffdd44);
        g.fillCircle(8, 8, 7);
        g.fillStyle(0xeecc33);
        g.fillCircle(8, 8, 5);
        g.generateTexture('coin', 16, 16);
        g.destroy();

        // Bomb pickup
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x333333);
        g.fillCircle(10, 14, 8);
        g.fillStyle(0x222222);
        g.fillRect(8, 2, 4, 8);
        g.fillStyle(0xff6600);
        g.fillCircle(10, 2, 3);
        g.generateTexture('bombPickup', 20, 20);
        g.destroy();

        // Key pickup
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffdd00);
        g.fillCircle(8, 6, 5);
        g.fillStyle(0x000000);
        g.fillCircle(8, 6, 2);
        g.fillStyle(0xffdd00);
        g.fillRect(6, 10, 4, 10);
        g.fillRect(4, 16, 8, 2);
        g.generateTexture('keyPickup', 16, 24);
        g.destroy();

        // Floor tile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, 1, 32);
        g.fillRect(0, 0, 32, 1);
        // Add subtle crack pattern
        g.lineStyle(1, 0x3a2818, 0.5);
        g.beginPath();
        g.moveTo(8, 0);
        g.lineTo(12, 16);
        g.lineTo(8, 32);
        g.stroke();
        g.generateTexture('floor', 32, 32);
        g.destroy();

        // Wall tile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(2, 2, 28, 14);
        g.lineStyle(1, 0x1a1a1a);
        g.strokeRect(1, 1, 30, 30);
        g.generateTexture('wall', 32, 32);
        g.destroy();

        // Rock
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.ROCK);
        g.fillRoundedRect(2, 6, 28, 24, 6);
        g.fillStyle(0x666666);
        g.fillRoundedRect(4, 8, 24, 18, 4);
        g.fillStyle(0x777777);
        g.fillCircle(12, 14, 6);
        g.generateTexture('rock', 32, 32);
        g.destroy();

        // Poop
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.POOP);
        g.fillCircle(16, 22, 10);
        g.fillCircle(12, 14, 8);
        g.fillCircle(20, 14, 7);
        g.fillCircle(16, 8, 5);
        g.generateTexture('poop', 32, 32);
        g.destroy();

        // Door (closed)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.DOOR_FRAME);
        g.fillRect(0, 0, 32, 48);
        g.fillStyle(0x4a3a2a);
        g.fillRect(4, 4, 24, 40);
        g.lineStyle(2, 0x2a1a0a);
        g.strokeRect(4, 4, 24, 40);
        g.generateTexture('doorClosed', 32, 48);
        g.destroy();

        // Door (open)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.DOOR_FRAME);
        g.fillRect(0, 0, 32, 48);
        g.fillStyle(0x111111);
        g.fillRect(4, 4, 24, 40);
        g.generateTexture('doorOpen', 32, 48);
        g.destroy();

        // Item pedestal
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x888888);
        g.fillRect(8, 24, 16, 8);
        g.fillStyle(0xaaaaaa);
        g.fillRect(4, 20, 24, 6);
        g.generateTexture('pedestal', 32, 32);
        g.destroy();

        // Generic item glow
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffff88, 0.5);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xffffaa, 0.8);
        g.fillCircle(16, 16, 10);
        g.generateTexture('itemGlow', 32, 32);
        g.destroy();

        // Trapdoor
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x222222);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0x111111);
        g.fillCircle(24, 24, 16);
        g.fillStyle(0x000000);
        g.fillCircle(24, 24, 10);
        g.generateTexture('trapdoor', 48, 48);
        g.destroy();

        // Create enemy textures
        this.createEnemyTextures();
    }

    createEnemyTextures() {
        // Fly
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x222222);
        g.fillCircle(8, 8, 6);
        g.fillStyle(0x444444);
        g.fillEllipse(4, 4, 4, 2);
        g.fillEllipse(12, 4, 4, 2);
        g.generateTexture('fly', 16, 16);
        g.destroy();

        // Pooter
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x665544);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0x443322);
        g.fillEllipse(6, 6, 6, 3);
        g.fillEllipse(18, 6, 6, 3);
        g.fillStyle(0xff0000);
        g.fillCircle(9, 10, 2);
        g.fillCircle(15, 10, 2);
        g.generateTexture('pooter', 24, 24);
        g.destroy();

        // Gaper (skull face)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xeeeeee);
        g.fillCircle(16, 14, 12);
        // Bloody eyes
        g.fillStyle(0xff0000);
        g.fillCircle(11, 11, 4);
        g.fillCircle(21, 11, 4);
        g.fillStyle(0x000000);
        g.fillCircle(11, 12, 2);
        g.fillCircle(21, 12, 2);
        // Mouth
        g.fillStyle(0x220000);
        g.fillEllipse(16, 20, 6, 4);
        // Blood drip
        g.fillStyle(0xaa0000);
        g.fillRect(10, 15, 2, 8);
        g.fillRect(20, 15, 2, 6);
        g.generateTexture('gaper', 32, 32);
        g.destroy();

        // Mulligan
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xbbbb99);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x000000);
        g.fillCircle(12, 14, 3);
        g.fillCircle(20, 14, 3);
        g.fillStyle(0x888866);
        g.fillEllipse(16, 22, 6, 3);
        g.generateTexture('mulligan', 32, 32);
        g.destroy();

        // Clotty
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xcc4444);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0xaa2222);
        g.fillCircle(16, 16, 8);
        g.fillStyle(0xeeeeee);
        g.fillCircle(12, 14, 3);
        g.fillCircle(20, 14, 3);
        g.fillStyle(0x000000);
        g.fillCircle(12, 14, 1);
        g.fillCircle(20, 14, 1);
        g.generateTexture('clotty', 32, 32);
        g.destroy();

        // Fatty
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffccaa);
        g.fillCircle(20, 22, 16);
        g.fillStyle(0xffddbb);
        g.fillCircle(20, 14, 10);
        g.fillStyle(0x000000);
        g.fillCircle(16, 12, 2);
        g.fillCircle(24, 12, 2);
        g.fillStyle(0xffaaaa);
        g.fillEllipse(20, 18, 4, 2);
        g.generateTexture('fatty', 40, 40);
        g.destroy();

        // Host (skull in ground)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xcccccc);
        g.fillCircle(16, 12, 10);
        g.fillStyle(0x000000);
        g.fillCircle(12, 10, 3);
        g.fillCircle(20, 10, 3);
        g.fillEllipse(16, 18, 4, 3);
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 20, 32, 12);
        g.generateTexture('host', 32, 32);
        g.destroy();

        // Boss: Monstro
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffaaaa);
        g.fillCircle(32, 36, 28);
        g.fillStyle(0xff8888);
        g.fillCircle(32, 28, 20);
        // Eyes
        g.fillStyle(0xffffff);
        g.fillCircle(22, 24, 8);
        g.fillCircle(42, 24, 8);
        g.fillStyle(0x000000);
        g.fillCircle(24, 26, 4);
        g.fillCircle(40, 26, 4);
        // Mouth with teeth
        g.fillStyle(0x440000);
        g.fillEllipse(32, 44, 16, 10);
        g.fillStyle(0xffffff);
        for (let i = 0; i < 5; i++) {
            g.fillTriangle(20 + i * 6, 38, 23 + i * 6, 38, 21.5 + i * 6, 46);
        }
        g.generateTexture('monstro', 64, 64);
        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        // Title
        this.add.text(cx, 100, 'THE BINDING OF', {
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fill: '#aa8866'
        }).setOrigin(0.5);

        this.add.text(cx, 150, 'ISAAC', {
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            fill: '#ffddaa',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Isaac sprite
        const isaac = this.add.sprite(cx, cy, 'isaac');
        isaac.setScale(3);

        // Start button
        const startBtn = this.add.text(cx, cy + 120, '[ NEW RUN ]', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ffdd00'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => this.startGame());

        // Controls
        this.add.text(cx, GAME_HEIGHT - 80, 'WASD: Move | Arrow Keys / Mouse: Shoot | E: Use Item | Q: Debug', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, GAME_HEIGHT - 50, 'Press SPACE to start', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        // Reset game state
        gameState = {
            floor: 1,
            floorName: 'Basement',
            currentRoom: null,
            rooms: [],
            roomGrid: [],
            gridSize: 9,
            visitedRooms: new Set(),
            clearedRooms: new Set(),
            coins: 0,
            bombs: 1,
            keys: 1,
            score: 0,
            kills: 0,
            items: [],
            activeItem: null,
            activeItemCharges: 0,
            maxCharges: 6,
            debugMode: false
        };

        playerStats = {
            maxHearts: 3,
            redHearts: 6,
            soulHearts: 0,
            damage: 3.5,
            tears: 10,
            range: 200,
            shotSpeed: 300,
            speed: 150,
            luck: 0,
            homing: false,
            bouncing: false,
            piercing: false,
            polyphemus: false,
            brimstone: false
        };

        this.scene.start('GameScene');
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Room offset for centering
        this.roomOffsetX = (GAME_WIDTH - ROOM_PIXEL_WIDTH) / 2;
        this.roomOffsetY = (GAME_HEIGHT - ROOM_PIXEL_HEIGHT) / 2 + 20;

        // Setup game elements
        this.setupGroups();
        this.generateFloor();
        this.setupPlayer();
        this.setupControls();
        this.setupHUD();

        // Enter starting room
        this.enterRoom(gameState.currentRoom);

        // Invincibility frames tracking
        this.isInvincible = false;
        this.lastFireTime = 0;
    }

    setupGroups() {
        this.obstacles = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.tears = this.physics.add.group();
        this.enemyTears = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.doors = this.physics.add.staticGroup();
        this.itemPedestals = this.physics.add.staticGroup();
    }

    generateFloor() {
        const gridSize = gameState.gridSize;
        const centerX = Math.floor(gridSize / 2);
        const centerY = Math.floor(gridSize / 2);

        // Initialize grid
        gameState.roomGrid = [];
        for (let y = 0; y < gridSize; y++) {
            gameState.roomGrid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                gameState.roomGrid[y][x] = null;
            }
        }

        // Create rooms using simple maze generation
        gameState.rooms = [];
        const roomCount = 8 + gameState.floor * 2;

        // Starting room (center)
        this.createRoom(centerX, centerY, 'start');

        // Generate connected rooms
        let attempts = 0;
        while (gameState.rooms.length < roomCount && attempts < 1000) {
            const existingRoom = gameState.rooms[Math.floor(Math.random() * gameState.rooms.length)];
            const directions = [
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 }
            ];
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const newX = existingRoom.gridX + dir.dx;
            const newY = existingRoom.gridY + dir.dy;

            if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                if (!gameState.roomGrid[newY][newX]) {
                    // Determine room type
                    let roomType = 'normal';
                    if (gameState.rooms.length === roomCount - 1) {
                        roomType = 'boss';
                    } else if (gameState.rooms.length === 2) {
                        roomType = 'treasure';
                    } else if (gameState.rooms.length === 4) {
                        roomType = 'shop';
                    }
                    this.createRoom(newX, newY, roomType);
                }
            }
            attempts++;
        }

        // Set current room to start
        gameState.currentRoom = gameState.rooms[0];
    }

    createRoom(gridX, gridY, type) {
        const room = {
            id: gameState.rooms.length,
            gridX: gridX,
            gridY: gridY,
            type: type,
            cleared: type === 'start' || type === 'treasure' || type === 'shop',
            enemies: [],
            obstacles: [],
            layout: this.generateRoomLayout(type)
        };

        gameState.rooms.push(room);
        gameState.roomGrid[gridY][gridX] = room;

        return room;
    }

    generateRoomLayout(type) {
        const layout = [];

        // Initialize empty room
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            layout[y] = [];
            for (let x = 0; x < ROOM_WIDTH; x++) {
                layout[y][x] = 0; // 0 = floor
            }
        }

        if (type === 'normal') {
            // Add random rocks
            const rockCount = Phaser.Math.Between(2, 5);
            for (let i = 0; i < rockCount; i++) {
                const rx = Phaser.Math.Between(2, ROOM_WIDTH - 3);
                const ry = Phaser.Math.Between(2, ROOM_HEIGHT - 3);
                layout[ry][rx] = 1; // 1 = rock
            }

            // Add random poop
            const poopCount = Phaser.Math.Between(0, 2);
            for (let i = 0; i < poopCount; i++) {
                const px = Phaser.Math.Between(2, ROOM_WIDTH - 3);
                const py = Phaser.Math.Between(2, ROOM_HEIGHT - 3);
                if (layout[py][px] === 0) {
                    layout[py][px] = 2; // 2 = poop
                }
            }
        }

        return layout;
    }

    setupPlayer() {
        const cx = this.roomOffsetX + ROOM_PIXEL_WIDTH / 2;
        const cy = this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2;

        this.player = this.physics.add.sprite(cx, cy, 'isaac');
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);
        this.player.body.setSize(20, 20);
    }

    setupControls() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            shootUp: 'UP',
            shootDown: 'DOWN',
            shootLeft: 'LEFT',
            shootRight: 'RIGHT',
            useItem: 'E',
            bomb: 'SPACE',
            debug: 'Q'
        });

        // Debug toggle
        this.input.keyboard.on('keydown-Q', () => {
            gameState.debugMode = !gameState.debugMode;
            this.debugText.setVisible(gameState.debugMode);
        });

        // Mouse shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shootAtMouse = true;
            }
        });

        this.input.on('pointerup', () => {
            this.shootAtMouse = false;
        });
    }

    setupHUD() {
        // Hearts container
        this.heartSprites = [];
        this.updateHearts();

        // Counters (coins, bombs, keys)
        this.add.sprite(30, 100, 'coin').setScrollFactor(0).setDepth(100);
        this.coinText = this.add.text(50, 92, '00', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        this.add.sprite(30, 130, 'bombPickup').setScrollFactor(0).setDepth(100);
        this.bombText = this.add.text(50, 122, '01', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        this.add.sprite(30, 160, 'keyPickup').setScrollFactor(0).setDepth(100);
        this.keyText = this.add.text(50, 152, '01', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        // Minimap
        this.setupMinimap();

        // Floor name
        this.floorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, `${gameState.floorName} I`, {
            fontFamily: 'Georgia',
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Debug text
        this.debugText = this.add.text(10, GAME_HEIGHT - 150, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#00ff00',
            backgroundColor: '#000000aa'
        }).setScrollFactor(0).setDepth(200).setVisible(false);
    }

    setupMinimap() {
        this.minimapContainer = this.add.container(GAME_WIDTH - 80, 30);
        this.minimapContainer.setScrollFactor(0);
        this.minimapContainer.setDepth(100);

        // Background
        const bg = this.add.rectangle(0, 0, 70, 70, 0x000000, 0.7);
        this.minimapContainer.add(bg);

        this.minimapRooms = [];
    }

    updateMinimap() {
        // Clear old minimap rooms
        this.minimapRooms.forEach(r => r.destroy());
        this.minimapRooms = [];

        const mapScale = 7;
        const centerOffset = 35;

        gameState.rooms.forEach(room => {
            const dx = room.gridX - gameState.currentRoom.gridX;
            const dy = room.gridY - gameState.currentRoom.gridY;

            // Only show nearby rooms
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) return;

            const mx = dx * mapScale;
            const my = dy * mapScale;

            let color = 0x666666;
            if (room.type === 'boss') color = 0xff4444;
            else if (room.type === 'treasure') color = 0xffff00;
            else if (room.type === 'shop') color = 0x44ffff;
            else if (room.type === 'start') color = 0x888888;

            if (room === gameState.currentRoom) {
                color = 0xffffff;
            }

            if (!gameState.visitedRooms.has(room.id) && room !== gameState.currentRoom) {
                color = 0x333333;
            }

            const roomRect = this.add.rectangle(mx, my, 6, 6, color);
            this.minimapContainer.add(roomRect);
            this.minimapRooms.push(roomRect);
        });
    }

    updateHearts() {
        // Clear old hearts
        this.heartSprites.forEach(h => h.destroy());
        this.heartSprites = [];

        const startX = 30;
        const startY = 30;
        const spacing = 26;

        // Draw red heart containers
        for (let i = 0; i < playerStats.maxHearts; i++) {
            const x = startX + (i % 6) * spacing;
            const y = startY + Math.floor(i / 6) * 26;

            const heartsRemaining = playerStats.redHearts - i * 2;
            let texture = 'heartEmpty';
            if (heartsRemaining >= 2) texture = 'heartFull';
            else if (heartsRemaining === 1) texture = 'heartHalf';

            const heart = this.add.sprite(x, y, texture);
            heart.setScrollFactor(0);
            heart.setDepth(100);
            this.heartSprites.push(heart);
        }

        // Draw soul hearts after red hearts
        const soulHeartCount = Math.ceil(playerStats.soulHearts / 2);
        for (let i = 0; i < soulHeartCount; i++) {
            const idx = playerStats.maxHearts + i;
            const x = startX + (idx % 6) * spacing;
            const y = startY + Math.floor(idx / 6) * 26;

            const heartsRemaining = playerStats.soulHearts - i * 2;
            let texture = heartsRemaining >= 2 ? 'heartSoul' : 'heartSoul';

            const heart = this.add.sprite(x, y, texture);
            heart.setScrollFactor(0);
            heart.setDepth(100);
            this.heartSprites.push(heart);
        }
    }

    enterRoom(room) {
        // Clear current room content
        this.obstacles.clear(true, true);
        this.enemies.clear(true, true);
        this.tears.clear(true, true);
        this.enemyTears.clear(true, true);
        this.pickups.clear(true, true);
        this.doors.clear(true, true);
        this.itemPedestals.clear(true, true);

        gameState.currentRoom = room;
        gameState.visitedRooms.add(room.id);

        // Draw floor
        this.drawRoom(room);

        // Spawn doors
        this.spawnDoors(room);

        // Spawn obstacles
        this.spawnObstacles(room);

        // Spawn enemies if not cleared
        if (!room.cleared && room.type === 'normal') {
            this.spawnEnemies(room);
        }

        // Spawn items for treasure room
        if (room.type === 'treasure') {
            this.spawnItemPedestal(room);
        }

        // Spawn shop items
        if (room.type === 'shop') {
            this.spawnShop(room);
        }

        // Spawn boss
        if (room.type === 'boss' && !room.cleared) {
            this.spawnBoss(room);
        }

        // Update minimap
        this.updateMinimap();

        // Setup collisions
        this.setupCollisions();
    }

    drawRoom(room) {
        // Floor tiles
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const px = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const py = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;
                this.add.sprite(px, py, 'floor').setDepth(0);
            }
        }

        // Walls around room
        // Top wall
        for (let x = -1; x <= ROOM_WIDTH; x++) {
            const px = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
            const py = this.roomOffsetY - TILE_SIZE / 2;
            this.add.sprite(px, py, 'wall').setDepth(1);
        }
        // Bottom wall
        for (let x = -1; x <= ROOM_WIDTH; x++) {
            const px = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
            const py = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE + TILE_SIZE / 2;
            this.add.sprite(px, py, 'wall').setDepth(1);
        }
        // Left wall
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            const px = this.roomOffsetX - TILE_SIZE / 2;
            const py = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;
            this.add.sprite(px, py, 'wall').setDepth(1);
        }
        // Right wall
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            const px = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE + TILE_SIZE / 2;
            const py = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;
            this.add.sprite(px, py, 'wall').setDepth(1);
        }
    }

    spawnDoors(room) {
        const directions = [
            { dx: 0, dy: -1, px: ROOM_WIDTH / 2, py: -0.5, rot: 0 }, // Top
            { dx: 0, dy: 1, px: ROOM_WIDTH / 2, py: ROOM_HEIGHT + 0.5, rot: Math.PI }, // Bottom
            { dx: -1, dy: 0, px: -0.5, py: ROOM_HEIGHT / 2, rot: -Math.PI / 2 }, // Left
            { dx: 1, dy: 0, px: ROOM_WIDTH + 0.5, py: ROOM_HEIGHT / 2, rot: Math.PI / 2 } // Right
        ];

        directions.forEach((dir, index) => {
            const nx = room.gridX + dir.dx;
            const ny = room.gridY + dir.dy;

            if (gameState.roomGrid[ny] && gameState.roomGrid[ny][nx]) {
                const targetRoom = gameState.roomGrid[ny][nx];
                const doorX = this.roomOffsetX + dir.px * TILE_SIZE;
                const doorY = this.roomOffsetY + dir.py * TILE_SIZE;

                const isOpen = room.cleared || room.type !== 'normal';
                const door = this.doors.create(doorX, doorY, isOpen ? 'doorOpen' : 'doorClosed');
                door.setRotation(dir.rot);
                door.targetRoom = targetRoom;
                door.direction = index;
                door.setDepth(5);
            }
        });
    }

    spawnObstacles(room) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const tile = room.layout[y][x];
                if (tile === 0) continue;

                const px = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const py = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;

                let texture = 'rock';
                if (tile === 2) texture = 'poop';

                const obstacle = this.obstacles.create(px, py, texture);
                obstacle.setDepth(5);
                obstacle.obstacleType = tile;
                obstacle.hp = tile === 1 ? 999 : 5; // Rocks are indestructible, poop is destroyable
            }
        }
    }

    spawnEnemies(room) {
        const enemyCount = Phaser.Math.Between(2, 4 + gameState.floor);
        const enemyTypes = Object.keys(ENEMIES);

        for (let i = 0; i < enemyCount; i++) {
            // Find valid spawn position
            let px, py;
            let attempts = 0;
            do {
                const gx = Phaser.Math.Between(2, ROOM_WIDTH - 3);
                const gy = Phaser.Math.Between(2, ROOM_HEIGHT - 3);
                px = this.roomOffsetX + gx * TILE_SIZE + TILE_SIZE / 2;
                py = this.roomOffsetY + gy * TILE_SIZE + TILE_SIZE / 2;
                attempts++;
            } while (attempts < 50 && this.isPositionBlocked(px, py));

            // Pick random enemy type weighted by floor
            const type = enemyTypes[Math.min(Math.floor(Math.random() * (2 + gameState.floor)), enemyTypes.length - 1)];
            const enemyData = ENEMIES[type];

            const enemy = this.enemies.create(px, py, type);
            enemy.enemyType = type;
            enemy.hp = enemyData.hp;
            enemy.maxHp = enemyData.hp;
            enemy.damage = enemyData.damage;
            enemy.speed = enemyData.speed;
            enemy.behavior = enemyData.behavior;
            enemy.lastAttack = 0;
            enemy.isSpawning = true;
            enemy.setDepth(8);

            // Spawn animation (flash/rise up)
            enemy.setAlpha(0);
            this.tweens.add({
                targets: enemy,
                alpha: 1,
                y: py,
                duration: 500,
                onComplete: () => {
                    enemy.isSpawning = false;
                }
            });

            room.enemies.push(enemy);
        }
    }

    spawnBoss(room) {
        const cx = this.roomOffsetX + ROOM_PIXEL_WIDTH / 2;
        const cy = this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2;

        const bossType = 'monstro';
        const bossData = BOSSES[bossType];

        const boss = this.enemies.create(cx, cy, bossType);
        boss.enemyType = bossType;
        boss.isBoss = true;
        boss.hp = bossData.hp;
        boss.maxHp = bossData.hp;
        boss.damage = bossData.damage;
        boss.speed = bossData.speed;
        boss.lastAttack = 0;
        boss.isSpawning = true;
        boss.setDepth(8);
        boss.setScale(1.5);

        // Boss intro
        this.showBossIntro(bossData.name);

        this.tweens.add({
            targets: boss,
            alpha: { from: 0, to: 1 },
            duration: 1000,
            onComplete: () => {
                boss.isSpawning = false;
            }
        });

        room.enemies.push(boss);
    }

    showBossIntro(name) {
        const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, name, {
            fontFamily: 'Georgia',
            fontSize: '36px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: GAME_HEIGHT / 2 - 150,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    spawnItemPedestal(room) {
        const cx = this.roomOffsetX + ROOM_PIXEL_WIDTH / 2;
        const cy = this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2;

        const pedestal = this.itemPedestals.create(cx, cy + 16, 'pedestal');
        pedestal.setDepth(4);

        // Item glow
        const glow = this.add.sprite(cx, cy, 'itemGlow');
        glow.setDepth(5);
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.5, to: 1 },
            scale: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Pick random item
        const itemKeys = Object.keys(ITEMS);
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        const item = ITEMS[itemKey];

        // Item sprite (just use a colored circle for now)
        const itemSprite = this.add.circle(cx, cy - 10, 12, 0xffff88);
        itemSprite.setDepth(6);

        // Item name
        const itemName = this.add.text(cx, cy - 40, item.name, {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        const itemEffect = this.add.text(cx, cy - 25, item.effect, {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#aaaaaa',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        pedestal.itemKey = itemKey;
        pedestal.itemSprite = itemSprite;
        pedestal.itemGlow = glow;
        pedestal.itemName = itemName;
        pedestal.itemEffect = itemEffect;
    }

    spawnShop(room) {
        const positions = [
            { x: ROOM_WIDTH / 2 - 2, y: ROOM_HEIGHT / 2 },
            { x: ROOM_WIDTH / 2 + 2, y: ROOM_HEIGHT / 2 }
        ];

        positions.forEach((pos, i) => {
            const px = this.roomOffsetX + pos.x * TILE_SIZE;
            const py = this.roomOffsetY + pos.y * TILE_SIZE;

            const pickup = this.pickups.create(px, py, i === 0 ? 'heartFull' : 'bombPickup');
            pickup.pickupType = i === 0 ? 'health' : 'bomb';
            pickup.price = i === 0 ? 3 : 5;
            pickup.setDepth(5);

            // Price tag
            this.add.text(px, py + 20, `${pickup.price}c`, {
                fontFamily: 'monospace',
                fontSize: '12px',
                fill: '#ffdd00'
            }).setOrigin(0.5).setDepth(100);
        });
    }

    isPositionBlocked(x, y) {
        let blocked = false;
        this.obstacles.getChildren().forEach(obs => {
            if (Phaser.Math.Distance.Between(x, y, obs.x, obs.y) < 40) {
                blocked = true;
            }
        });
        return blocked;
    }

    setupCollisions() {
        // Player vs obstacles
        this.physics.add.collider(this.player, this.obstacles);

        // Player vs doors
        this.physics.add.overlap(this.player, this.doors, this.handleDoor, null, this);

        // Tears vs obstacles
        this.physics.add.overlap(this.tears, this.obstacles, this.tearHitObstacle, null, this);

        // Tears vs enemies
        this.physics.add.overlap(this.tears, this.enemies, this.tearHitEnemy, null, this);

        // Enemy tears vs player
        this.physics.add.overlap(this.player, this.enemyTears, this.enemyTearHitPlayer, null, this);

        // Player vs enemies (melee damage)
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);

        // Player vs pickups
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Player vs item pedestals
        this.physics.add.overlap(this.player, this.itemPedestals, this.checkItemPickup, null, this);

        // Enemies vs obstacles
        this.physics.add.collider(this.enemies, this.obstacles);
    }

    handleDoor(player, door) {
        if (!gameState.currentRoom.cleared && gameState.currentRoom.type === 'normal') return;

        const targetRoom = door.targetRoom;
        if (!targetRoom) return;

        // Move player to opposite side of new room
        const direction = door.direction;
        let newX = player.x;
        let newY = player.y;

        switch (direction) {
            case 0: // Top door -> enter from bottom
                newY = this.roomOffsetY + ROOM_PIXEL_HEIGHT - 40;
                break;
            case 1: // Bottom door -> enter from top
                newY = this.roomOffsetY + 40;
                break;
            case 2: // Left door -> enter from right
                newX = this.roomOffsetX + ROOM_PIXEL_WIDTH - 40;
                break;
            case 3: // Right door -> enter from left
                newX = this.roomOffsetX + 40;
                break;
        }

        this.enterRoom(targetRoom);
        this.player.setPosition(newX, newY);
    }

    tearHitObstacle(tear, obstacle) {
        // Bouncing tears bounce off
        if (tear.bouncing) {
            const angle = Phaser.Math.Angle.Between(tear.x, tear.y, obstacle.x, obstacle.y);
            tear.setVelocity(
                -Math.cos(angle) * playerStats.shotSpeed,
                -Math.sin(angle) * playerStats.shotSpeed
            );
            tear.bounceCount = (tear.bounceCount || 0) + 1;
            if (tear.bounceCount > 3) tear.destroy();
            return;
        }

        // Damage destroyable obstacles
        if (obstacle.hp < 999) {
            obstacle.hp -= playerStats.damage;
            if (obstacle.hp <= 0) {
                obstacle.destroy();
            }
        }

        // Piercing tears don't get destroyed by obstacles
        if (!tear.piercing) {
            tear.destroy();
        }
    }

    tearHitEnemy(tear, enemy) {
        if (enemy.isSpawning) return;

        enemy.hp -= tear.damage || playerStats.damage;

        // Knockback
        const angle = Phaser.Math.Angle.Between(tear.x, tear.y, enemy.x, enemy.y);
        enemy.setVelocity(
            Math.cos(angle) * 100,
            Math.sin(angle) * 100
        );

        // Blood effect
        this.createBloodSplatter(enemy.x, enemy.y);

        if (enemy.hp <= 0) {
            this.enemyDeath(enemy);
        }

        if (!tear.piercing) {
            tear.destroy();
        }
    }

    enemyDeath(enemy) {
        gameState.kills++;
        gameState.score += enemy.isBoss ? 100 : 10;

        // Drop chance
        if (Math.random() < 0.2) {
            this.spawnPickup(enemy.x, enemy.y);
        }

        // Remove from room's enemy list
        const idx = gameState.currentRoom.enemies.indexOf(enemy);
        if (idx > -1) gameState.currentRoom.enemies.splice(idx, 1);

        // Check if room cleared
        if (gameState.currentRoom.enemies.length === 0) {
            this.roomCleared();
        }

        // Boss death
        if (enemy.isBoss) {
            this.bossDefeated();
        }

        enemy.destroy();
    }

    roomCleared() {
        gameState.currentRoom.cleared = true;
        gameState.clearedRooms.add(gameState.currentRoom.id);

        // Charge active item
        if (gameState.activeItem) {
            gameState.activeItemCharges = Math.min(
                gameState.maxCharges,
                gameState.activeItemCharges + 1
            );
        }

        // Open doors
        this.doors.getChildren().forEach(door => {
            door.setTexture('doorOpen');
        });

        // Spawn reward
        if (Math.random() < 0.3) {
            this.spawnPickup(
                this.roomOffsetX + ROOM_PIXEL_WIDTH / 2,
                this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2
            );
        }
    }

    bossDefeated() {
        // Spawn trapdoor
        const cx = this.roomOffsetX + ROOM_PIXEL_WIDTH / 2;
        const cy = this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2;

        const trapdoor = this.physics.add.sprite(cx, cy, 'trapdoor');
        trapdoor.setDepth(2);

        this.physics.add.overlap(this.player, trapdoor, () => {
            this.nextFloor();
        });

        // Spawn item pedestal
        this.spawnItemPedestal(gameState.currentRoom);
    }

    nextFloor() {
        gameState.floor++;

        if (gameState.floor > 3) {
            // Victory!
            this.scene.start('VictoryScene');
            return;
        }

        // Update floor name
        const floorNames = ['Basement', 'Caves', 'Depths'];
        gameState.floorName = floorNames[gameState.floor - 1] || 'Unknown';

        // Reset floor state
        gameState.rooms = [];
        gameState.roomGrid = [];
        gameState.visitedRooms = new Set();
        gameState.clearedRooms = new Set();

        // Generate new floor
        this.generateFloor();

        // Reset player position
        const cx = this.roomOffsetX + ROOM_PIXEL_WIDTH / 2;
        const cy = this.roomOffsetY + ROOM_PIXEL_HEIGHT / 2;
        this.player.setPosition(cx, cy);

        // Enter starting room
        this.enterRoom(gameState.currentRoom);

        // Update floor text
        this.floorText.setText(`${gameState.floorName} ${['I', 'II', 'III'][gameState.floor - 1] || gameState.floor}`);
    }

    spawnPickup(x, y) {
        const types = ['coin', 'heart', 'bomb', 'key'];
        const weights = [0.4, 0.3, 0.15, 0.15];
        let rand = Math.random();
        let type = 'coin';

        for (let i = 0; i < types.length; i++) {
            if (rand < weights[i]) {
                type = types[i];
                break;
            }
            rand -= weights[i];
        }

        let texture = 'coin';
        if (type === 'heart') texture = 'heartFull';
        else if (type === 'bomb') texture = 'bombPickup';
        else if (type === 'key') texture = 'keyPickup';

        const pickup = this.pickups.create(x, y, texture);
        pickup.pickupType = type;
        pickup.setDepth(5);

        // Bounce animation
        this.tweens.add({
            targets: pickup,
            y: y - 20,
            duration: 200,
            yoyo: true
        });
    }

    collectPickup(player, pickup) {
        // Shop items cost money
        if (pickup.price && pickup.price > gameState.coins) {
            return;
        }

        if (pickup.price) {
            gameState.coins -= pickup.price;
        }

        switch (pickup.pickupType) {
            case 'coin':
                gameState.coins++;
                break;
            case 'heart':
            case 'health':
                if (playerStats.redHearts < playerStats.maxHearts * 2) {
                    playerStats.redHearts = Math.min(playerStats.maxHearts * 2, playerStats.redHearts + 2);
                    this.updateHearts();
                }
                break;
            case 'bomb':
                gameState.bombs++;
                break;
            case 'key':
                gameState.keys++;
                break;
        }

        this.updateCounters();
        pickup.destroy();
    }

    checkItemPickup(player, pedestal) {
        if (!pedestal.itemKey) return;

        // Show item info
        pedestal.itemName.setVisible(true);
        pedestal.itemEffect.setVisible(true);

        // Check for pickup input
        if (Phaser.Input.Keyboard.JustDown(this.keys.useItem)) {
            this.collectItem(pedestal.itemKey);
            pedestal.itemSprite.destroy();
            pedestal.itemGlow.destroy();
            pedestal.itemName.destroy();
            pedestal.itemEffect.destroy();
            pedestal.itemKey = null;
        }
    }

    collectItem(itemKey) {
        const item = ITEMS[itemKey];
        if (!item) return;

        gameState.items.push(itemKey);

        // Apply item effect
        switch (item.stat) {
            case 'tears':
                playerStats.tears += item.value;
                break;
            case 'damage':
                playerStats.damage += item.value;
                break;
            case 'speed':
                playerStats.speed += item.value;
                break;
            case 'health':
                playerStats.maxHearts += item.value;
                playerStats.redHearts += 2;
                this.updateHearts();
                break;
            case 'all':
                playerStats.damage += 0.5;
                playerStats.speed += 20;
                playerStats.tears -= 0.5;
                playerStats.range += 20;
                playerStats.maxHearts += 1;
                playerStats.redHearts = Math.min(playerStats.maxHearts * 2, playerStats.redHearts + 2);
                this.updateHearts();
                break;
            case 'homing':
                playerStats.homing = true;
                break;
            case 'bouncing':
                playerStats.bouncing = true;
                break;
            case 'piercing':
                playerStats.piercing = true;
                break;
            case 'polyphemus':
                playerStats.polyphemus = true;
                playerStats.damage += 4;
                playerStats.tears += 5;
                break;
            case 'brimstone':
                playerStats.brimstone = true;
                break;
        }

        // Show item pickup text
        this.showPickupText(item.name);
    }

    showPickupText(text) {
        const msg = this.add.text(GAME_WIDTH / 2, 100, text, {
            fontFamily: 'Georgia',
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: 70,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    enemyTearHitPlayer(player, tear) {
        this.damagePlayer(tear.damage || 0.5);
        tear.destroy();
    }

    enemyHitPlayer(player, enemy) {
        if (enemy.isSpawning) return;
        this.damagePlayer(enemy.damage);
    }

    damagePlayer(amount) {
        if (this.isInvincible) return;

        // Damage soul hearts first
        if (playerStats.soulHearts > 0) {
            playerStats.soulHearts -= amount * 2;
            if (playerStats.soulHearts < 0) {
                playerStats.redHearts += playerStats.soulHearts;
                playerStats.soulHearts = 0;
            }
        } else {
            playerStats.redHearts -= amount * 2;
        }

        this.updateHearts();

        // Invincibility frames
        this.isInvincible = true;
        this.player.setAlpha(0.5);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.isInvincible = false;
                this.player.setAlpha(1);
            }
        });

        // Flash red
        this.cameras.main.flash(100, 255, 0, 0, false);

        // Check death
        if (playerStats.redHearts <= 0 && playerStats.soulHearts <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        this.scene.start('GameOverScene');
    }

    createBloodSplatter(x, y) {
        for (let i = 0; i < 5; i++) {
            const blood = this.add.circle(
                x + Phaser.Math.Between(-15, 15),
                y + Phaser.Math.Between(-15, 15),
                Phaser.Math.Between(2, 5),
                COLORS.BLOOD
            );
            blood.setDepth(3);
            this.time.delayedCall(500, () => blood.destroy());
        }
    }

    updateCounters() {
        this.coinText.setText(gameState.coins.toString().padStart(2, '0'));
        this.bombText.setText(gameState.bombs.toString().padStart(2, '0'));
        this.keyText.setText(gameState.keys.toString().padStart(2, '0'));
    }

    update(time, delta) {
        this.handlePlayerMovement();
        this.handleShooting(time);
        this.updateEnemyAI(time);
        this.updateDebugText();
    }

    handlePlayerMovement() {
        let vx = 0;
        let vy = 0;

        if (this.keys.up.isDown) vy = -playerStats.speed;
        if (this.keys.down.isDown) vy = playerStats.speed;
        if (this.keys.left.isDown) vx = -playerStats.speed;
        if (this.keys.right.isDown) vx = playerStats.speed;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Keep player in room bounds
        const minX = this.roomOffsetX + 20;
        const maxX = this.roomOffsetX + ROOM_PIXEL_WIDTH - 20;
        const minY = this.roomOffsetY + 20;
        const maxY = this.roomOffsetY + ROOM_PIXEL_HEIGHT - 20;

        this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
        this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);
    }

    handleShooting(time) {
        // Check fire rate
        const fireDelay = playerStats.tears * 30;
        if (time - this.lastFireTime < fireDelay) return;

        let shootDir = null;

        // Arrow key shooting
        if (this.keys.shootUp.isDown) shootDir = { x: 0, y: -1 };
        else if (this.keys.shootDown.isDown) shootDir = { x: 0, y: 1 };
        else if (this.keys.shootLeft.isDown) shootDir = { x: -1, y: 0 };
        else if (this.keys.shootRight.isDown) shootDir = { x: 1, y: 0 };

        // Mouse shooting
        if (this.shootAtMouse) {
            const pointer = this.input.activePointer;
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                pointer.worldX, pointer.worldY
            );
            shootDir = { x: Math.cos(angle), y: Math.sin(angle) };
        }

        if (shootDir) {
            this.fireTear(shootDir.x, shootDir.y);
            this.lastFireTime = time;
        }
    }

    fireTear(dx, dy) {
        const texture = playerStats.polyphemus ? 'bigTear' : 'tear';
        const tear = this.tears.create(this.player.x, this.player.y, texture);

        tear.damage = playerStats.damage;
        tear.piercing = playerStats.piercing;
        tear.bouncing = playerStats.bouncing;
        tear.homing = playerStats.homing;
        tear.setDepth(9);

        const speed = playerStats.shotSpeed;
        tear.setVelocity(dx * speed, dy * speed);

        // Destroy after range
        this.time.delayedCall(playerStats.range * 3, () => {
            if (tear.active) tear.destroy();
        });
    }

    updateEnemyAI(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active || enemy.isSpawning) return;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );

            switch (enemy.behavior) {
                case 'chase':
                    // Move toward player
                    const angle = Phaser.Math.Angle.Between(
                        enemy.x, enemy.y,
                        this.player.x, this.player.y
                    );
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );
                    break;

                case 'shoot':
                    // Shoot at player periodically
                    if (time - enemy.lastAttack > 2000) {
                        this.enemyShoot(enemy);
                        enemy.lastAttack = time;
                    }
                    // Move slowly
                    if (dist > 150) {
                        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.setVelocity(Math.cos(ang) * enemy.speed, Math.sin(ang) * enemy.speed);
                    } else {
                        enemy.setVelocity(0, 0);
                    }
                    break;

                case 'pattern':
                    // Shoot in 4 directions
                    if (time - enemy.lastAttack > 2500) {
                        for (let i = 0; i < 4; i++) {
                            const a = i * Math.PI / 2;
                            const tear = this.enemyTears.create(enemy.x, enemy.y, 'enemyTear');
                            tear.damage = enemy.damage;
                            tear.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150);
                            tear.setDepth(9);
                            this.time.delayedCall(2000, () => { if (tear.active) tear.destroy(); });
                        }
                        enemy.lastAttack = time;
                    }
                    break;

                case 'popup':
                case 'line':
                    // Stationary, shoots when in line of sight
                    if (Math.abs(enemy.x - this.player.x) < 30 || Math.abs(enemy.y - this.player.y) < 30) {
                        if (time - enemy.lastAttack > 1500) {
                            this.enemyShoot(enemy);
                            enemy.lastAttack = time;
                        }
                    }
                    break;
            }

            // Boss special behavior
            if (enemy.isBoss && enemy.enemyType === 'monstro') {
                // Jump attack
                if (time - enemy.lastAttack > 3000) {
                    // Jump toward player
                    this.tweens.add({
                        targets: enemy,
                        x: this.player.x,
                        y: this.player.y,
                        duration: 800,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            // Land attack - spawn tears in circle
                            for (let i = 0; i < 8; i++) {
                                const a = i * Math.PI / 4;
                                const tear = this.enemyTears.create(enemy.x, enemy.y, 'enemyTear');
                                tear.damage = enemy.damage;
                                tear.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
                                tear.setDepth(9);
                                this.time.delayedCall(1500, () => { if (tear.active) tear.destroy(); });
                            }
                        }
                    });
                    enemy.lastAttack = time;
                }
            }
        });

        // Update homing tears
        this.tears.getChildren().forEach(tear => {
            if (tear.homing && this.enemies.getChildren().length > 0) {
                // Find nearest enemy
                let nearest = null;
                let nearestDist = Infinity;
                this.enemies.getChildren().forEach(e => {
                    const d = Phaser.Math.Distance.Between(tear.x, tear.y, e.x, e.y);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearest = e;
                    }
                });

                if (nearest && nearestDist < 200) {
                    const angle = Phaser.Math.Angle.Between(tear.x, tear.y, nearest.x, nearest.y);
                    const currentAngle = Math.atan2(tear.body.velocity.y, tear.body.velocity.x);
                    const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.05);
                    tear.setVelocity(
                        Math.cos(newAngle) * playerStats.shotSpeed,
                        Math.sin(newAngle) * playerStats.shotSpeed
                    );
                }
            }
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const tear = this.enemyTears.create(enemy.x, enemy.y, 'enemyTear');
        tear.damage = enemy.damage;
        tear.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
        tear.setDepth(9);

        this.time.delayedCall(2000, () => {
            if (tear.active) tear.destroy();
        });
    }

    updateDebugText() {
        if (!gameState.debugMode) return;

        const info = [
            `=== DEBUG (Q to hide) ===`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `Floor: ${gameState.floor} - ${gameState.floorName}`,
            `Room: ${gameState.currentRoom.id} (${gameState.currentRoom.type})`,
            ``,
            `Health: ${playerStats.redHearts / 2}/${playerStats.maxHearts} + ${playerStats.soulHearts / 2} soul`,
            `Damage: ${playerStats.damage.toFixed(1)}`,
            `Tears: ${playerStats.tears.toFixed(1)}`,
            `Speed: ${playerStats.speed}`,
            `Range: ${playerStats.range}`,
            ``,
            `Enemies: ${this.enemies.getChildren().length}`,
            `Items: ${gameState.items.length}`,
            `Coins: ${gameState.coins} Bombs: ${gameState.bombs} Keys: ${gameState.keys}`,
            `Score: ${gameState.score} Kills: ${gameState.kills}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(info);
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        this.add.text(cx, cy - 100, 'VICTORY!', {
            fontFamily: 'Georgia',
            fontSize: '48px',
            fill: '#ffdd00'
        }).setOrigin(0.5);

        this.add.text(cx, cy, `You escaped the basement!`, {
            fontFamily: 'Georgia',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Score: ${gameState.score}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 80, `Kills: ${gameState.kills}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        const playAgain = this.add.text(cx, cy + 150, '[ PLAY AGAIN ]', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerover', () => playAgain.setFill('#ffdd00'));
        playAgain.on('pointerout', () => playAgain.setFill('#ffffff'));
        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        this.add.text(cx, cy - 100, 'YOU DIED', {
            fontFamily: 'Georgia',
            fontSize: '48px',
            fill: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(cx, cy, `Floor: ${gameState.floorName}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 30, `Score: ${gameState.score}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 60, `Kills: ${gameState.kills}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        const retry = this.add.text(cx, cy + 130, '[ TRY AGAIN ]', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        retry.on('pointerover', () => retry.setFill('#ff4444'));
        retry.on('pointerout', () => retry.setFill('#ffffff'));
        retry.on('pointerdown', () => this.scene.start('MenuScene'));

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// Game Configuration
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, VictoryScene, GameOverScene],
    render: {
        pixelArt: true,
        antialias: false
    }
};

// Create game
const game = new Phaser.Game(config);
