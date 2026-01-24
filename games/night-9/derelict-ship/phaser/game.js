// DERELICT - Survival Horror
// Phaser 3 Implementation

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;

// Colors
const COLORS = {
    FLOOR: 0x2a2a2a,
    FLOOR_DARK: 0x1a1a1a,
    WALL: 0x3a3a3a,
    WALL_LIGHT: 0x4a4a4a,
    OXYGEN: 0x4488ff,
    HEALTH: 0xff4444,
    FLASHLIGHT: 0xffff88,
    BLOOD: 0x880000,
    ENEMY: 0x553333,
    SPACE_BG: 0x111122,
    NEBULA: 0xaa6633,
    ASTEROID: 0x444444
};

// Game state
let gameState = {
    mode: 'ship', // 'ship' or 'space'
    currentShip: 1,
    maxShips: 3,
    oxygen: 100,
    maxOxygen: 100,
    health: 100,
    maxHealth: 100,
    flashlightBattery: 60,
    maxBattery: 60,
    flashlightOn: true,
    ammo: { pistol: 24, shotgun: 12, smg: 60 },
    weapons: ['pipe'],
    currentWeapon: 0,
    inventory: [],
    debugMode: false,
    roomsExplored: 0,
    enemiesKilled: 0,
    isPaused: false,
    isRunning: false,
    lastO2Drain: 0
};

// Weapon definitions
const WEAPONS = {
    pipe: { name: 'Pipe', damage: 20, range: 50, fireRate: 600, type: 'melee', durability: 15 },
    pistol: { name: 'Pistol', damage: 25, range: 400, fireRate: 500, type: 'ranged', ammoType: 'pistol', magSize: 12 },
    shotgun: { name: 'Shotgun', damage: 40, range: 200, fireRate: 1000, type: 'ranged', ammoType: 'shotgun', magSize: 6, pellets: 5 },
    smg: { name: 'SMG', damage: 15, range: 350, fireRate: 200, type: 'ranged', ammoType: 'smg', magSize: 30 }
};

// Enemy definitions
const ENEMIES = {
    crawler: { hp: 30, damage: 15, speed: 80, attackRate: 1200, detection: 250, size: 24, color: 0x333322 },
    shambler: { hp: 60, damage: 25, speed: 50, attackRate: 2000, detection: 200, size: 32, color: 0x445544 },
    stalker: { hp: 45, damage: 20, speed: 150, attackRate: 800, detection: 350, size: 28, color: 0x222233 },
    boss: { hp: 150, damage: 35, speed: 80, attackRate: 1500, detection: 500, size: 64, color: 0x663333 }
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
        let g;

        // Player (astronaut)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xcccccc);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x88aacc);
        g.fillCircle(16, 12, 8);
        g.fillStyle(0x666666);
        g.fillRect(12, 20, 8, 10);
        g.generateTexture('player', 32, 32);
        g.destroy();

        // Floor tile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, COLORS.FLOOR_DARK);
        g.strokeRect(0, 0, 32, 32);
        g.beginPath();
        g.moveTo(16, 0);
        g.lineTo(16, 32);
        g.moveTo(0, 16);
        g.lineTo(32, 16);
        g.stroke();
        g.generateTexture('floor', 32, 32);
        g.destroy();

        // Wall tile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(2, 2, 28, 14);
        g.lineStyle(1, 0x2a2a2a);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('wall', 32, 32);
        g.destroy();

        // Door
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x555555);
        g.fillRect(0, 0, 64, 32);
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 24, 24);
        g.fillRect(36, 4, 24, 24);
        g.lineStyle(2, 0x888888);
        g.strokeRect(1, 1, 62, 30);
        g.generateTexture('door', 64, 32);
        g.destroy();

        // O2 canister
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x4488ff);
        g.fillRoundedRect(8, 4, 16, 24, 4);
        g.fillStyle(0x6699ff);
        g.fillRoundedRect(10, 6, 12, 8, 2);
        g.generateTexture('o2canister', 32, 32);
        g.destroy();

        // Medkit
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff);
        g.fillRect(6, 8, 20, 16);
        g.fillStyle(0xff4444);
        g.fillRect(12, 10, 8, 12);
        g.fillRect(8, 14, 16, 4);
        g.generateTexture('medkit', 32, 32);
        g.destroy();

        // Bullet
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffff00);
        g.fillRect(0, 2, 8, 4);
        g.generateTexture('bullet', 8, 8);
        g.destroy();

        // Muzzle flash
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzleFlash', 16, 16);
        g.destroy();

        // Escape pod
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x666666);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0x888888);
        g.fillCircle(24, 20, 14);
        g.fillStyle(0x44aaff);
        g.fillCircle(24, 18, 8);
        g.generateTexture('escapePod', 48, 48);
        g.destroy();

        // Space ship (for space mode)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x555555);
        g.fillTriangle(16, 0, 0, 32, 32, 32);
        g.fillStyle(0x666666);
        g.fillTriangle(16, 8, 8, 28, 24, 28);
        g.fillStyle(0x44aaff);
        g.fillCircle(16, 20, 4);
        g.generateTexture('spaceShip', 32, 32);
        g.destroy();

        // Asteroid
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.ASTEROID);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0x333333);
        g.fillCircle(18, 18, 6);
        g.fillCircle(28, 22, 4);
        g.fillCircle(22, 30, 5);
        g.generateTexture('asteroid', 48, 48);
        g.destroy();

        // Derelict ship (large)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x333333);
        g.fillRect(20, 10, 60, 80);
        g.fillRect(10, 30, 20, 40);
        g.fillRect(80, 30, 20, 40);
        g.fillStyle(0x444444);
        g.fillRect(30, 20, 40, 60);
        g.fillStyle(0x222222);
        g.fillRect(40, 40, 20, 20);
        g.generateTexture('derelictShip', 100, 100);
        g.destroy();

        // Create enemy textures
        this.createEnemyTextures();
    }

    createEnemyTextures() {
        let g;

        // Crawler
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(ENEMIES.crawler.color);
        g.fillEllipse(12, 12, 20, 14);
        // Legs
        g.lineStyle(2, 0x222211);
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + Math.PI / 4;
            g.beginPath();
            g.moveTo(12, 12);
            g.lineTo(12 + Math.cos(angle) * 10, 12 + Math.sin(angle) * 10);
            g.stroke();
        }
        g.fillStyle(0xff0000);
        g.fillCircle(8, 8, 2);
        g.fillCircle(16, 8, 2);
        g.generateTexture('crawler', 24, 24);
        g.destroy();

        // Shambler
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(ENEMIES.shambler.color);
        g.fillCircle(16, 18, 14);
        g.fillStyle(0x334433);
        g.fillCircle(16, 12, 10);
        g.fillStyle(0xff0000);
        g.fillCircle(12, 10, 3);
        g.fillCircle(20, 10, 3);
        g.fillStyle(0x220000);
        g.fillEllipse(16, 20, 8, 4);
        g.generateTexture('shambler', 32, 32);
        g.destroy();

        // Stalker
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(ENEMIES.stalker.color);
        g.fillEllipse(14, 14, 24, 16);
        g.fillStyle(0x333344);
        g.fillEllipse(14, 10, 16, 10);
        g.fillStyle(0xff00ff);
        g.fillCircle(10, 8, 2);
        g.fillCircle(18, 8, 2);
        g.generateTexture('stalker', 28, 28);
        g.destroy();

        // Boss
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(ENEMIES.boss.color);
        g.fillCircle(32, 36, 28);
        g.fillStyle(0x552222);
        g.fillCircle(32, 28, 20);
        g.fillStyle(0xff0000);
        g.fillCircle(24, 24, 5);
        g.fillCircle(40, 24, 5);
        g.fillStyle(0x440000);
        g.fillEllipse(32, 40, 16, 8);
        // Weak points (glowing)
        g.fillStyle(0x00ff00);
        g.fillCircle(20, 40, 4);
        g.fillCircle(44, 40, 4);
        g.generateTexture('boss', 64, 64);
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

        // Dark background
        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(1, 3);
            this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        }

        // Title
        this.add.text(cx, 120, 'DERELICT', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 180, 'Every breath costs you', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5);

        // Ship graphic
        this.add.sprite(cx, cy, 'derelictShip').setScale(2).setAlpha(0.5);

        // Start button
        const startBtn = this.add.text(cx, cy + 150, '[ ENTER THE DERELICT ]', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ff4444'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => this.startGame());

        // Controls
        this.add.text(cx, GAME_HEIGHT - 100, 'WASD: Move | Mouse: Aim | LMB: Attack | F: Flashlight | Shift: Run', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, GAME_HEIGHT - 70, 'WARNING: Oxygen drains constantly. Running uses more O2.', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#ff4444'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        // Reset game state
        gameState = {
            mode: 'ship',
            currentShip: 1,
            maxShips: 3,
            oxygen: 100,
            maxOxygen: 100,
            health: 100,
            maxHealth: 100,
            flashlightBattery: 60,
            maxBattery: 60,
            flashlightOn: true,
            ammo: { pistol: 24, shotgun: 12, smg: 60 },
            weapons: ['pipe'],
            currentWeapon: 0,
            inventory: [],
            debugMode: false,
            roomsExplored: 0,
            enemiesKilled: 0,
            isPaused: false,
            isRunning: false,
            lastO2Drain: 0
        };

        this.scene.start('ShipScene');
    }
}

// Ship Scene (In-ship exploration)
class ShipScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipScene' });
    }

    create() {
        this.setupWorld();
        this.generateShip();
        this.setupPlayer();
        this.setupVision();
        this.setupControls();
        this.setupHUD();
        this.setupCollisions();

        // O2 drain timer
        this.lastO2Time = this.time.now;
        this.lastFireTime = 0;
    }

    setupWorld() {
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        this.doors = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.escapePod = null;

        this.rooms = [];
    }

    generateShip() {
        const shipConfig = {
            1: { rooms: 5, enemies: ['crawler', 'crawler'], items: ['pipe', 'pistol'] },
            2: { rooms: 7, enemies: ['shambler', 'shambler', 'crawler', 'crawler'], items: ['shotgun'] },
            3: { rooms: 9, enemies: ['stalker', 'stalker', 'shambler', 'shambler'], items: ['smg'], hasBoss: true }
        };

        const config = shipConfig[gameState.currentShip];
        const roomSize = { w: 10, h: 8 };
        const startX = 200;
        const startY = 200;

        // Generate linear ship layout
        let currentX = startX;
        let currentY = startY;

        for (let i = 0; i < config.rooms; i++) {
            const room = {
                x: currentX,
                y: currentY,
                width: roomSize.w * TILE_SIZE,
                height: roomSize.h * TILE_SIZE,
                type: i === 0 ? 'start' : (i === config.rooms - 1 ? 'exit' : 'normal'),
                cleared: false
            };

            this.createRoom(room);
            this.rooms.push(room);

            // Create corridor to next room
            if (i < config.rooms - 1) {
                // Alternate direction
                if (i % 2 === 0) {
                    // Go right
                    this.createCorridor(
                        currentX + roomSize.w * TILE_SIZE,
                        currentY + (roomSize.h / 2) * TILE_SIZE - TILE_SIZE,
                        4, 2, 'horizontal'
                    );
                    currentX += (roomSize.w + 4) * TILE_SIZE;
                } else {
                    // Go down
                    this.createCorridor(
                        currentX + (roomSize.w / 2) * TILE_SIZE - TILE_SIZE,
                        currentY + roomSize.h * TILE_SIZE,
                        2, 4, 'vertical'
                    );
                    currentY += (roomSize.h + 4) * TILE_SIZE;
                }
            }
        }

        // Spawn enemies
        config.enemies.forEach((type, idx) => {
            const roomIdx = Math.min(idx + 1, this.rooms.length - 2);
            const room = this.rooms[roomIdx];
            if (room) {
                this.spawnEnemy(type,
                    room.x + Phaser.Math.Between(64, room.width - 64),
                    room.y + Phaser.Math.Between(64, room.height - 64)
                );
            }
        });

        // Spawn boss on ship 3
        if (config.hasBoss) {
            const exitRoom = this.rooms[this.rooms.length - 1];
            this.spawnEnemy('boss',
                exitRoom.x + exitRoom.width / 2,
                exitRoom.y + exitRoom.height / 2
            );
        }

        // Spawn items
        this.spawnItems();

        // Spawn escape pod in exit room
        const exitRoom = this.rooms[this.rooms.length - 1];
        this.escapePod = this.physics.add.sprite(
            exitRoom.x + exitRoom.width / 2,
            exitRoom.y + 64,
            'escapePod'
        );
        this.escapePod.setDepth(5);

        // Set world bounds
        const maxX = Math.max(...this.rooms.map(r => r.x + r.width)) + 200;
        const maxY = Math.max(...this.rooms.map(r => r.y + r.height)) + 200;
        this.physics.world.setBounds(0, 0, maxX, maxY);
        this.cameras.main.setBounds(0, 0, maxX, maxY);
    }

    createRoom(room) {
        const { x, y, width, height } = room;

        // Floor
        for (let ty = 0; ty < height; ty += TILE_SIZE) {
            for (let tx = 0; tx < width; tx += TILE_SIZE) {
                const floor = this.add.sprite(x + tx + TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'floor');
                floor.setDepth(0);
                this.floors.add(floor);
            }
        }

        // Walls
        // Top wall
        for (let tx = 0; tx < width; tx += TILE_SIZE) {
            const wall = this.walls.create(x + tx + TILE_SIZE / 2, y - TILE_SIZE / 2, 'wall');
            wall.setDepth(2);
        }
        // Bottom wall
        for (let tx = 0; tx < width; tx += TILE_SIZE) {
            const wall = this.walls.create(x + tx + TILE_SIZE / 2, y + height + TILE_SIZE / 2, 'wall');
            wall.setDepth(2);
        }
        // Left wall
        for (let ty = -TILE_SIZE; ty <= height; ty += TILE_SIZE) {
            const wall = this.walls.create(x - TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'wall');
            wall.setDepth(2);
        }
        // Right wall
        for (let ty = -TILE_SIZE; ty <= height; ty += TILE_SIZE) {
            const wall = this.walls.create(x + width + TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'wall');
            wall.setDepth(2);
        }
    }

    createCorridor(x, y, widthTiles, heightTiles, direction) {
        const width = widthTiles * TILE_SIZE;
        const height = heightTiles * TILE_SIZE;

        // Floor
        for (let ty = 0; ty < height; ty += TILE_SIZE) {
            for (let tx = 0; tx < width; tx += TILE_SIZE) {
                const floor = this.add.sprite(x + tx + TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'floor');
                floor.setDepth(0);
                this.floors.add(floor);
            }
        }

        // Walls along sides
        if (direction === 'horizontal') {
            for (let tx = 0; tx < width; tx += TILE_SIZE) {
                this.walls.create(x + tx + TILE_SIZE / 2, y - TILE_SIZE / 2, 'wall').setDepth(2);
                this.walls.create(x + tx + TILE_SIZE / 2, y + height + TILE_SIZE / 2, 'wall').setDepth(2);
            }
        } else {
            for (let ty = 0; ty < height; ty += TILE_SIZE) {
                this.walls.create(x - TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'wall').setDepth(2);
                this.walls.create(x + width + TILE_SIZE / 2, y + ty + TILE_SIZE / 2, 'wall').setDepth(2);
            }
        }
    }

    spawnEnemy(type, x, y) {
        const enemyData = ENEMIES[type];
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;
        enemy.hp = enemyData.hp;
        enemy.maxHp = enemyData.hp;
        enemy.damage = enemyData.damage;
        enemy.speed = enemyData.speed;
        enemy.attackRate = enemyData.attackRate;
        enemy.detection = enemyData.detection;
        enemy.lastAttack = 0;
        enemy.isAlerted = false;
        enemy.setDepth(8);
        enemy.body.setSize(enemyData.size * 0.8, enemyData.size * 0.8);
    }

    spawnItems() {
        // O2 canisters
        for (let i = 0; i < 3 + gameState.currentShip; i++) {
            const room = this.rooms[Phaser.Math.Between(1, this.rooms.length - 2)];
            if (room) {
                const item = this.pickups.create(
                    room.x + Phaser.Math.Between(64, room.width - 64),
                    room.y + Phaser.Math.Between(64, room.height - 64),
                    'o2canister'
                );
                item.itemType = 'o2';
                item.amount = 25;
                item.setDepth(5);
            }
        }

        // Medkits
        for (let i = 0; i < 2; i++) {
            const room = this.rooms[Phaser.Math.Between(1, this.rooms.length - 2)];
            if (room) {
                const item = this.pickups.create(
                    room.x + Phaser.Math.Between(64, room.width - 64),
                    room.y + Phaser.Math.Between(64, room.height - 64),
                    'medkit'
                );
                item.itemType = 'health';
                item.amount = 30;
                item.setDepth(5);
            }
        }

        // Weapon on ship 1
        if (gameState.currentShip === 1 && !gameState.weapons.includes('pistol')) {
            const room = this.rooms[1];
            // Add pistol as text indicator for now
            const weaponText = this.add.text(room.x + room.width / 2, room.y + room.height / 2, '[PISTOL]', {
                fontFamily: 'monospace',
                fontSize: '12px',
                fill: '#ffff00'
            }).setOrigin(0.5).setDepth(10);
            weaponText.setInteractive();
            weaponText.on('pointerdown', () => {
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, weaponText.x, weaponText.y) < 60) {
                    gameState.weapons.push('pistol');
                    this.showMessage('PISTOL ACQUIRED');
                    weaponText.destroy();
                }
            });
        }
    }

    setupPlayer() {
        const startRoom = this.rooms[0];
        this.player = this.physics.add.sprite(
            startRoom.x + startRoom.width / 2,
            startRoom.y + startRoom.height / 2,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(24, 24);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    setupVision() {
        // Vision cone parameters
        this.visionAngle = Math.PI / 2; // 90 degrees
        this.visionRange = 300;

        // Create darkness overlay using render texture
        this.darknessRT = this.make.renderTexture({
            width: GAME_WIDTH,
            height: GAME_HEIGHT
        }, false);

        this.darknessLayer = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.darknessRT.texture);
        this.darknessLayer.setScrollFactor(0);
        this.darknessLayer.setDepth(50);
        this.darknessLayer.setBlendMode(Phaser.BlendModes.MULTIPLY);

        // Create light cone texture
        this.createLightTexture();
    }

    createLightTexture() {
        const size = 600;
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Create radial gradient for ambient light
        for (let r = size / 2; r > 0; r -= 4) {
            const brightness = Math.floor(255 * (r / (size / 2)));
            const color = (brightness << 16) | (brightness << 8) | brightness;
            g.fillStyle(color);
            g.fillCircle(size / 2, size / 2, r);
        }

        g.generateTexture('lightAmbient', size, size);
        g.destroy();

        // Create cone light texture
        const cg = this.make.graphics({ x: 0, y: 0, add: false });
        const coneLength = 400;
        const coneWidth = 300;

        // Draw cone shape with gradient
        for (let i = 20; i > 0; i--) {
            const brightness = Math.floor(255 * (i / 20));
            const color = (brightness << 16) | (brightness << 8) | brightness;
            cg.fillStyle(color);

            const spread = (20 - i) * 0.015;
            cg.beginPath();
            cg.moveTo(coneWidth / 2, coneLength);
            cg.lineTo(coneWidth / 2 - coneLength * Math.tan(Math.PI / 4 + spread), 0);
            cg.lineTo(coneWidth / 2 + coneLength * Math.tan(Math.PI / 4 + spread), 0);
            cg.closePath();
            cg.fill();
        }

        cg.generateTexture('lightCone', coneWidth, coneLength);
        cg.destroy();
    }

    updateVision() {
        // Clear darkness
        this.darknessRT.clear();

        // Fill with dark
        this.darknessRT.fill(0x111122);

        // Draw ambient light around player
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.darknessRT.draw('lightAmbient', cx - 300, cy - 300);

        // Draw flashlight cone if on
        if (gameState.flashlightOn && gameState.flashlightBattery > 0) {
            // The cone should be drawn in the direction the player is facing
            // For simplicity, we'll use the ambient light
        }
    }

    setupControls() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            run: 'SHIFT',
            flashlight: 'F',
            interact: 'E',
            debug: 'Q',
            weapon1: 'ONE',
            weapon2: 'TWO',
            weapon3: 'THREE'
        });

        // Mouse shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isFiring = true;
            }
        });

        this.input.on('pointerup', () => {
            this.isFiring = false;
        });

        // Debug toggle
        this.input.keyboard.on('keydown-Q', () => {
            gameState.debugMode = !gameState.debugMode;
            this.debugText.setVisible(gameState.debugMode);
        });

        // Flashlight toggle
        this.input.keyboard.on('keydown-F', () => {
            gameState.flashlightOn = !gameState.flashlightOn;
        });

        // Weapon switching
        this.input.keyboard.on('keydown-ONE', () => this.switchWeapon(0));
        this.input.keyboard.on('keydown-TWO', () => this.switchWeapon(1));
        this.input.keyboard.on('keydown-THREE', () => this.switchWeapon(2));

        // Scroll wheel weapon switch
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) {
                this.switchWeapon((gameState.currentWeapon + 1) % gameState.weapons.length);
            } else {
                this.switchWeapon((gameState.currentWeapon - 1 + gameState.weapons.length) % gameState.weapons.length);
            }
        });
    }

    switchWeapon(index) {
        if (index < gameState.weapons.length) {
            gameState.currentWeapon = index;
            this.showMessage(WEAPONS[gameState.weapons[index]].name.toUpperCase());
        }
    }

    setupHUD() {
        // O2 bar background
        this.add.rectangle(120, 30, 200, 20, 0x333333).setScrollFactor(0).setDepth(100);
        // O2 bar
        this.o2Bar = this.add.rectangle(120, 30, 200, 20, COLORS.OXYGEN).setScrollFactor(0).setDepth(101);
        // O2 label
        this.add.text(20, 22, 'O2:', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#4488ff'
        }).setScrollFactor(0).setDepth(102);
        // O2 text
        this.o2Text = this.add.text(230, 22, '100', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102);

        // Health bar background
        this.add.rectangle(120, 55, 200, 20, 0x333333).setScrollFactor(0).setDepth(100);
        // Health bar
        this.healthBar = this.add.rectangle(120, 55, 200, 20, COLORS.HEALTH).setScrollFactor(0).setDepth(101);
        // Health label
        this.add.text(20, 47, 'HP:', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ff4444'
        }).setScrollFactor(0).setDepth(102);
        // Health text
        this.healthText = this.add.text(230, 47, '100', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102);

        // Weapon display
        this.weaponText = this.add.text(20, GAME_HEIGHT - 50, 'PIPE', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102);

        // Ammo display
        this.ammoText = this.add.text(20, GAME_HEIGHT - 30, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffff00'
        }).setScrollFactor(0).setDepth(102);

        // Ship indicator
        this.shipText = this.add.text(GAME_WIDTH - 150, 20, `DERELICT ${gameState.currentShip}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#888888'
        }).setScrollFactor(0).setDepth(102);

        // Debug text
        this.debugText = this.add.text(GAME_WIDTH - 250, 60, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#00ff00',
            backgroundColor: '#000000aa'
        }).setScrollFactor(0).setDepth(200).setVisible(false);

        // Message text (center screen)
        this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
    }

    showMessage(text, duration = 2000) {
        this.messageText.setText(text);
        this.messageText.setVisible(true);
        this.time.delayedCall(duration, () => {
            this.messageText.setVisible(false);
        });
    }

    setupCollisions() {
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.escapePod, this.enterEscapePod, null, this);
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        // Knockback
        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);

        // Blood effect
        for (let i = 0; i < 5; i++) {
            const blood = this.add.circle(
                enemy.x + Phaser.Math.Between(-10, 10),
                enemy.y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(2, 4),
                COLORS.BLOOD
            );
            blood.setDepth(3);
            this.time.delayedCall(500, () => blood.destroy());
        }

        if (enemy.hp <= 0) {
            gameState.enemiesKilled++;
            enemy.destroy();

            // Check if all enemies dead for escape pod access
            if (this.enemies.getChildren().length === 0) {
                this.showMessage('ESCAPE POD UNLOCKED');
            }
        }
    }

    enemyHitPlayer(player, enemy) {
        if (this.isInvincible) return;
        if (this.time.now - enemy.lastAttack < enemy.attackRate) return;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist < 40) {
            this.damagePlayer(enemy.damage);
            enemy.lastAttack = this.time.now;
        }
    }

    damagePlayer(amount) {
        if (this.isInvincible) return;

        gameState.health -= amount;
        this.cameras.main.shake(100, 0.01);
        this.cameras.main.flash(100, 255, 0, 0, false);

        // I-frames
        this.isInvincible = true;
        this.player.setAlpha(0.5);
        this.time.delayedCall(1000, () => {
            this.isInvincible = false;
            this.player.setAlpha(1);
        });

        if (gameState.health <= 0) {
            this.scene.start('GameOverScene');
        }
    }

    collectPickup(player, pickup) {
        switch (pickup.itemType) {
            case 'o2':
                gameState.oxygen = Math.min(gameState.maxOxygen, gameState.oxygen + pickup.amount);
                this.showMessage('+' + pickup.amount + ' O2');
                break;
            case 'health':
                gameState.health = Math.min(gameState.maxHealth, gameState.health + pickup.amount);
                this.showMessage('+' + pickup.amount + ' HP');
                break;
        }
        pickup.destroy();
    }

    enterEscapePod(player, pod) {
        if (this.enemies.getChildren().length > 0) {
            this.showMessage('CLEAR ALL ENEMIES FIRST');
            return;
        }

        // Go to next ship or victory
        if (gameState.currentShip >= gameState.maxShips) {
            this.scene.start('VictoryScene');
        } else {
            gameState.currentShip++;
            this.scene.start('SpaceScene');
        }
    }

    update(time, delta) {
        this.handlePlayerMovement();
        this.handlePlayerRotation();
        this.handleShooting(time);
        this.updateO2(time, delta);
        this.updateEnemyAI(time);
        this.updateHUD();
        this.updateVision();
        this.updateDebug();
    }

    handlePlayerMovement() {
        let vx = 0;
        let vy = 0;

        const isRunning = this.keys.run.isDown;
        gameState.isRunning = isRunning;
        const speed = isRunning ? 200 : 120;

        if (this.keys.up.isDown) vy = -speed;
        if (this.keys.down.isDown) vy = speed;
        if (this.keys.left.isDown) vx = -speed;
        if (this.keys.right.isDown) vx = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);
    }

    handlePlayerRotation() {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
        this.player.setRotation(angle);
    }

    handleShooting(time) {
        if (!this.isFiring) return;

        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];

        if (time - this.lastFireTime < weapon.fireRate) return;

        // Check ammo for ranged weapons
        if (weapon.type === 'ranged') {
            if (gameState.ammo[weapon.ammoType] <= 0) {
                this.showMessage('NO AMMO');
                return;
            }
            gameState.ammo[weapon.ammoType]--;
        }

        this.lastFireTime = time;

        // O2 cost for combat
        gameState.oxygen = Math.max(0, gameState.oxygen - 2);

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

        if (weapon.type === 'melee') {
            // Melee attack - damage nearby enemies
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - enemyAngle));

                if (dist < weapon.range && angleDiff < Math.PI / 4) {
                    enemy.hp -= weapon.damage;
                    if (enemy.hp <= 0) {
                        gameState.enemiesKilled++;
                        enemy.destroy();
                    }
                }
            });
        } else {
            // Ranged attack
            if (weapon.pellets) {
                // Shotgun spread
                for (let i = 0; i < weapon.pellets; i++) {
                    const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-15, 15));
                    this.createBullet(angle + spread, weapon.damage);
                }
            } else {
                this.createBullet(angle, weapon.damage);
            }

            // Muzzle flash
            const flash = this.add.sprite(
                this.player.x + Math.cos(angle) * 20,
                this.player.y + Math.sin(angle) * 20,
                'muzzleFlash'
            );
            flash.setDepth(11);
            this.time.delayedCall(50, () => flash.destroy());
        }

        // Screen shake
        this.cameras.main.shake(50, 0.002);
    }

    createBullet(angle, damage) {
        const bullet = this.bullets.create(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'bullet'
        );
        bullet.setRotation(angle);
        bullet.damage = damage;
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        bullet.setDepth(9);

        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateO2(time, delta) {
        // O2 drain based on activity
        const drainInterval = gameState.isRunning ? 750 : (this.player.body.velocity.length() > 10 ? 1500 : 2000);

        if (time - this.lastO2Time > drainInterval) {
            gameState.oxygen = Math.max(0, gameState.oxygen - 1);
            this.lastO2Time = time;
        }

        // Flashlight battery drain
        if (gameState.flashlightOn) {
            gameState.flashlightBattery = Math.max(0, gameState.flashlightBattery - delta / 1000);
        } else {
            gameState.flashlightBattery = Math.min(gameState.maxBattery, gameState.flashlightBattery + delta / 2000);
        }

        // Death by suffocation
        if (gameState.oxygen <= 0) {
            this.scene.start('GameOverScene');
        }

        // Low O2 warning
        if (gameState.oxygen <= 20) {
            // Pulse red at screen edges
            if (!this.lowO2Warning) {
                this.lowO2Warning = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);
                this.lowO2Warning.setScrollFactor(0);
                this.lowO2Warning.setDepth(99);

                this.tweens.add({
                    targets: this.lowO2Warning,
                    alpha: { from: 0, to: 0.2 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    updateEnemyAI(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );

            // Detection
            if (dist < enemy.detection) {
                enemy.isAlerted = true;
            }

            if (!enemy.isAlerted) {
                // Patrol behavior
                if (!enemy.patrolTarget || Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y) < 20) {
                    enemy.patrolTarget = {
                        x: enemy.x + Phaser.Math.Between(-100, 100),
                        y: enemy.y + Phaser.Math.Between(-100, 100)
                    };
                }

                const patrolAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                enemy.setVelocity(
                    Math.cos(patrolAngle) * (enemy.speed * 0.3),
                    Math.sin(patrolAngle) * (enemy.speed * 0.3)
                );
            } else {
                // Chase player
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.setRotation(angle);

                if (dist > 30) {
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );
                } else {
                    enemy.setVelocity(0, 0);
                }

                // Boss special: spawn crawlers at 50% HP
                if (enemy.enemyType === 'boss' && enemy.hp <= enemy.maxHp / 2 && !enemy.spawnedMinions) {
                    enemy.spawnedMinions = true;
                    this.spawnEnemy('crawler', enemy.x - 50, enemy.y);
                    this.spawnEnemy('crawler', enemy.x + 50, enemy.y);
                    this.showMessage('BOSS SPAWNS CRAWLERS!');
                }
            }
        });
    }

    updateHUD() {
        // O2
        const o2Percent = gameState.oxygen / gameState.maxOxygen;
        this.o2Bar.setScale(o2Percent, 1);
        this.o2Bar.setPosition(120 - 100 * (1 - o2Percent), 30);
        this.o2Text.setText(Math.floor(gameState.oxygen).toString());

        // Health
        const hpPercent = gameState.health / gameState.maxHealth;
        this.healthBar.setScale(hpPercent, 1);
        this.healthBar.setPosition(120 - 100 * (1 - hpPercent), 55);
        this.healthText.setText(Math.floor(gameState.health).toString());

        // Weapon
        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];
        this.weaponText.setText(weapon.name.toUpperCase());

        // Ammo
        if (weapon.type === 'ranged') {
            this.ammoText.setText(`AMMO: ${gameState.ammo[weapon.ammoType]}`);
        } else {
            this.ammoText.setText('');
        }
    }

    updateDebug() {
        if (!gameState.debugMode) return;

        const info = [
            `=== DEBUG (Q to hide) ===`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `O2: ${Math.round(gameState.oxygen)}/${gameState.maxOxygen}`,
            `HP: ${Math.round(gameState.health)}/${gameState.maxHealth}`,
            `Ship: ${gameState.currentShip}/${gameState.maxShips}`,
            ``,
            `Weapon: ${gameState.weapons[gameState.currentWeapon]}`,
            `Enemies: ${this.enemies.getChildren().length}`,
            `Kills: ${gameState.enemiesKilled}`,
            `Running: ${gameState.isRunning}`,
            `Flashlight: ${gameState.flashlightOn}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(info);
    }
}

// Space Scene (between ships)
class SpaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceScene' });
    }

    create() {
        // Space background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.SPACE_BG);

        // Stars
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(1, 3);
            this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        }

        // Nebula (orange glow)
        const nebula = this.add.circle(GAME_WIDTH * 0.7, GAME_HEIGHT * 0.3, 300, COLORS.NEBULA, 0.3);

        // Asteroids
        this.asteroids = this.physics.add.group();
        for (let i = 0; i < 10; i++) {
            const ast = this.asteroids.create(
                Phaser.Math.Between(100, GAME_WIDTH - 100),
                Phaser.Math.Between(100, GAME_HEIGHT - 100),
                'asteroid'
            );
            ast.setScale(Phaser.Math.FloatBetween(0.3, 1));
            ast.setVelocity(
                Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(-20, 20)
            );
        }

        // Target derelict
        this.targetShip = this.add.sprite(GAME_WIDTH - 150, GAME_HEIGHT / 2, 'derelictShip');
        this.targetShip.setScale(1.5);

        // Player ship
        this.player = this.physics.add.sprite(150, GAME_HEIGHT / 2, 'spaceShip');
        this.player.setScale(1.5);
        this.player.setCollideWorldBounds(true);

        // Instructions
        this.add.text(GAME_WIDTH / 2, 50, `NAVIGATE TO DERELICT ${gameState.currentShip}`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 80, 'WASD to move | Reach the ship to board', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        // O2 still drains in space!
        this.lastO2Time = this.time.now;

        // HUD
        this.add.rectangle(120, 30, 200, 20, 0x333333);
        this.o2Bar = this.add.rectangle(120, 30, 200, 20, COLORS.OXYGEN);
        this.add.text(20, 22, 'O2:', { fontFamily: 'monospace', fontSize: '14px', fill: '#4488ff' });
        this.o2Text = this.add.text(230, 22, '100', { fontFamily: 'monospace', fontSize: '14px', fill: '#ffffff' });

        // Collision with target ship
        this.physics.add.overlap(this.player, this.targetShip, () => {
            this.scene.start('ShipScene');
        });

        // Collision with asteroids
        this.physics.add.collider(this.player, this.asteroids, () => {
            gameState.health -= 10;
            if (gameState.health <= 0) {
                this.scene.start('GameOverScene');
            }
        });

        // Controls
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        });
    }

    update(time, delta) {
        // Movement
        let vx = 0;
        let vy = 0;
        const speed = 150;

        if (this.cursors.up.isDown) vy = -speed;
        if (this.cursors.down.isDown) vy = speed;
        if (this.cursors.left.isDown) vx = -speed;
        if (this.cursors.right.isDown) vx = speed;

        this.player.setVelocity(vx, vy);

        // Rotate toward movement
        if (vx !== 0 || vy !== 0) {
            this.player.setRotation(Math.atan2(vy, vx) - Math.PI / 2);
        }

        // O2 drain (slower in space suit)
        if (time - this.lastO2Time > 3000) {
            gameState.oxygen = Math.max(0, gameState.oxygen - 1);
            this.lastO2Time = time;

            if (gameState.oxygen <= 0) {
                this.scene.start('GameOverScene');
            }
        }

        // Update O2 HUD
        const o2Percent = gameState.oxygen / gameState.maxOxygen;
        this.o2Bar.setScale(o2Percent, 1);
        this.o2Bar.setPosition(120 - 100 * (1 - o2Percent), 30);
        this.o2Text.setText(Math.floor(gameState.oxygen).toString());

        // Wrap asteroids
        this.asteroids.getChildren().forEach(ast => {
            if (ast.x < -50) ast.x = GAME_WIDTH + 50;
            if (ast.x > GAME_WIDTH + 50) ast.x = -50;
            if (ast.y < -50) ast.y = GAME_HEIGHT + 50;
            if (ast.y > GAME_HEIGHT + 50) ast.y = -50;
        });
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

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff);
        }

        this.add.text(cx, cy - 100, 'ESCAPED!', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'You escaped the derelict ships.', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Enemies Killed: ${gameState.enemiesKilled}`, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        const playAgain = this.add.text(cx, cy + 150, '[ PLAY AGAIN ]', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerover', () => playAgain.setFill('#00ff00'));
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

        const deathMessage = gameState.oxygen <= 0
            ? 'Your lungs burned for oxygen that never came.'
            : 'Your body joins the ship\'s other victims.';

        this.add.text(cx, cy - 100, 'YOU DIED', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        this.add.text(cx, cy, deathMessage, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Ship: ${gameState.currentShip}/${gameState.maxShips}`, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 75, `Enemies Killed: ${gameState.enemiesKilled}`, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        const retry = this.add.text(cx, cy + 150, '[ TRY AGAIN ]', {
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
    scene: [BootScene, MenuScene, ShipScene, SpaceScene, VictoryScene, GameOverScene],
    render: {
        pixelArt: true,
        antialias: false
    }
};

// Create game
const game = new Phaser.Game(config);
