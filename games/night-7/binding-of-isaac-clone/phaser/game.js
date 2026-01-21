// Tears of the Fallen - Binding of Isaac Clone

// Constants
const TILE_SIZE = 32;
const ROOM_COLS = 13;
const ROOM_ROWS = 7;
const ROOM_WIDTH = ROOM_COLS * TILE_SIZE; // 416
const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 224
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Player stats
const BASE_STATS = {
    health: 6, // Half hearts
    maxHealth: 6,
    damage: 3.5,
    tearDelay: 10,
    range: 200,
    shotSpeed: 300,
    speed: 150,
    luck: 0
};

// Enemy definitions
const ENEMIES = {
    fly: { hp: 5, speed: 100, damage: 1, size: 16, behavior: 'chase', color: 0x444444 },
    pooter: { hp: 8, speed: 40, damage: 1, size: 20, behavior: 'shoot', color: 0x884488 },
    gaper: { hp: 12, speed: 60, damage: 2, size: 24, behavior: 'chase', color: 0xff8888 },
    clotty: { hp: 25, speed: 30, damage: 1, size: 28, behavior: 'shoot4', color: 0x880000 },
    host: { hp: 30, speed: 0, damage: 1, size: 24, behavior: 'popup', color: 0xffcc88 }
};

// Item definitions
const ITEMS = [
    { name: 'Sad Onion', effect: 'tears', value: 0.7, sprite: 0xffff00 },
    { name: 'Pentagram', effect: 'damage', value: 1, sprite: 0xff0000 },
    { name: 'Speed Ball', effect: 'speed', value: 30, sprite: 0x00ff00 },
    { name: 'Health Up', effect: 'health', value: 2, sprite: 0xff4444 },
    { name: 'Spoon Bender', effect: 'homing', value: true, sprite: 0xff00ff },
    { name: 'Cupids Arrow', effect: 'piercing', value: true, sprite: 0xffaaaa },
    { name: 'Technology', effect: 'laser', value: true, sprite: 0x00ffff }
];

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Create textures
        const g = this.make.graphics({ add: false });

        // Player
        g.clear();
        g.fillStyle(0xffddaa);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x000000);
        g.fillCircle(12, 14, 3);
        g.fillCircle(20, 14, 3);
        g.fillStyle(0xff6666);
        g.fillCircle(16, 20, 2);
        g.generateTexture('player', 32, 32);

        // Tear
        g.clear();
        g.fillStyle(0x6688ff);
        g.fillCircle(6, 6, 5);
        g.fillStyle(0xaaccff);
        g.fillCircle(5, 5, 2);
        g.generateTexture('tear', 12, 12);

        // Enemy tear
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(5, 5, 4);
        g.generateTexture('enemyTear', 10, 10);

        // Heart textures
        g.clear();
        g.fillStyle(0xff0000);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 22);
        g.generateTexture('heartFull', 24, 24);

        g.clear();
        g.fillStyle(0x444444);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 22);
        g.generateTexture('heartEmpty', 24, 24);

        g.clear();
        g.fillStyle(0x4444ff);
        g.fillCircle(8, 10, 6);
        g.fillCircle(16, 10, 6);
        g.fillTriangle(4, 12, 20, 12, 12, 22);
        g.generateTexture('heartSoul', 24, 24);

        // Floor tile
        g.clear();
        g.fillStyle(0x3a3a3a);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2a2a);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall
        g.clear();
        g.fillStyle(0x5a4a3a);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(2, 0x4a3a2a);
        g.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Rock
        g.clear();
        g.fillStyle(0x666666);
        g.fillRoundedRect(4, 4, 24, 24, 6);
        g.fillStyle(0x888888);
        g.fillRoundedRect(6, 6, 12, 12, 4);
        g.generateTexture('rock', TILE_SIZE, TILE_SIZE);

        // Poop
        g.clear();
        g.fillStyle(0x664422);
        g.fillCircle(16, 20, 10);
        g.fillCircle(16, 14, 7);
        g.fillCircle(16, 10, 4);
        g.generateTexture('poop', TILE_SIZE, TILE_SIZE);

        // Door closed
        g.clear();
        g.fillStyle(0x4a3a2a);
        g.fillRect(0, 0, 48, 32);
        g.generateTexture('doorClosed', 48, 32);

        // Door open
        g.clear();
        g.fillStyle(0x1a1a1a);
        g.fillRect(0, 0, 48, 32);
        g.generateTexture('doorOpen', 48, 32);

        // Item pedestal
        g.clear();
        g.fillStyle(0xccaa88);
        g.fillRect(8, 20, 16, 12);
        g.fillStyle(0xddbb99);
        g.fillRect(4, 16, 24, 6);
        g.generateTexture('pedestal', TILE_SIZE, TILE_SIZE);

        // Pickup coin
        g.clear();
        g.fillStyle(0xffdd00);
        g.fillCircle(8, 8, 6);
        g.generateTexture('coin', 16, 16);

        // Pickup bomb
        g.clear();
        g.fillStyle(0x333333);
        g.fillCircle(8, 10, 6);
        g.fillStyle(0xff6600);
        g.fillRect(6, 2, 4, 6);
        g.generateTexture('bomb', 16, 16);

        // Pickup key
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillCircle(8, 4, 4);
        g.fillRect(6, 4, 4, 12);
        g.fillRect(4, 10, 8, 2);
        g.generateTexture('key', 16, 16);

        // Pickup heart
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(6, 6, 4);
        g.fillCircle(10, 6, 4);
        g.fillTriangle(3, 7, 13, 7, 8, 14);
        g.generateTexture('pickupHeart', 16, 16);

        // Trapdoor
        g.clear();
        g.fillStyle(0x1a1a1a);
        g.fillCircle(16, 16, 14);
        g.lineStyle(2, 0x333333);
        g.strokeCircle(16, 16, 14);
        g.generateTexture('trapdoor', TILE_SIZE, TILE_SIZE);

        // Enemy textures
        Object.entries(ENEMIES).forEach(([name, data]) => {
            g.clear();
            g.fillStyle(data.color);
            g.fillCircle(data.size / 2, data.size / 2, data.size / 2 - 2);
            g.fillStyle(0x000000);
            g.fillCircle(data.size / 3, data.size / 3, 2);
            g.fillCircle(data.size * 2 / 3, data.size / 3, 2);
            g.generateTexture(`enemy_${name}`, data.size, data.size);
        });

        // Boss - Monstro
        g.clear();
        g.fillStyle(0xcc8888);
        g.fillCircle(48, 48, 44);
        g.fillStyle(0x000000);
        g.fillCircle(32, 40, 6);
        g.fillCircle(64, 40, 6);
        g.fillStyle(0xffffff);
        for (let i = 0; i < 6; i++) {
            g.fillRect(28 + i * 8, 60, 4, 8);
        }
        g.generateTexture('boss_monstro', 96, 96);

        // Item textures
        ITEMS.forEach((item, i) => {
            g.clear();
            g.fillStyle(item.sprite);
            g.fillRoundedRect(4, 4, 24, 24, 4);
            g.fillStyle(0xffffff);
            g.fillRect(10, 10, 12, 12);
            g.generateTexture(`item_${i}`, TILE_SIZE, TILE_SIZE);
        });

        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.text(cx, cy - 100, 'TEARS OF THE FALLEN', {
            fontSize: '40px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 40, 'A Binding of Isaac Clone', {
            fontSize: '20px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, 'WASD - Move | Arrow Keys - Shoot', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, 'E - Use Item | Space - Place Bomb', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        const start = this.add.text(cx, cy + 120, '[ START ]', {
            fontSize: '28px', fontFamily: 'Arial', color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        start.on('pointerover', () => start.setColor('#88ffaa'));
        start.on('pointerout', () => start.setColor('#00ff88'));
        start.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        // Game state
        this.currentFloor = 1;
        this.floorNames = ['Basement', 'Caves', 'Depths'];
        this.roomsCleared = new Set();

        // Player stats
        this.stats = { ...BASE_STATS };
        this.coins = 0;
        this.bombs = 3;
        this.keys = 1;
        this.hasHoming = false;
        this.hasPiercing = false;
        this.hasLaser = false;
        this.collectedItems = [];

        // Generate floor
        this.generateFloor();

        // Room offset for centering
        this.roomOffsetX = (GAME_WIDTH - ROOM_WIDTH) / 2;
        this.roomOffsetY = 100;

        // Groups
        this.wallGroup = this.physics.add.staticGroup();
        this.obstacleGroup = this.physics.add.staticGroup();
        this.doorGroup = this.physics.add.staticGroup();
        this.pickupGroup = this.physics.add.group();
        this.enemyGroup = this.physics.add.group();
        this.tearGroup = this.physics.add.group();
        this.enemyTearGroup = this.physics.add.group();
        this.itemGroup = this.physics.add.staticGroup();

        // Create player
        this.player = this.physics.add.sprite(
            this.roomOffsetX + ROOM_WIDTH / 2,
            this.roomOffsetY + ROOM_HEIGHT / 2,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(12, 4, 4);
        this.player.setDepth(10);

        // Invincibility
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Shooting
        this.lastTearTime = 0;
        this.tearDirection = { x: 0, y: 0 };

        // Load current room
        this.loadRoom(this.currentRoomX, this.currentRoomY);

        // Collisions
        this.physics.add.collider(this.player, this.wallGroup);
        this.physics.add.collider(this.player, this.obstacleGroup);
        this.physics.add.collider(this.enemyGroup, this.wallGroup);
        this.physics.add.collider(this.enemyGroup, this.obstacleGroup);
        this.physics.add.collider(this.tearGroup, this.wallGroup, (t) => t.destroy());
        this.physics.add.collider(this.tearGroup, this.obstacleGroup, this.tearHitObstacle, null, this);
        this.physics.add.overlap(this.tearGroup, this.enemyGroup, this.tearHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickupGroup, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyTearGroup, this.playerHitTear, null, this);
        this.physics.add.overlap(this.player, this.doorGroup, this.checkDoor, null, this);
        this.physics.add.overlap(this.player, this.itemGroup, this.checkItem, null, this);

        // Input
        this.moveKeys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });
        this.shootKeys = this.input.keyboard.addKeys({
            up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT'
        });
        this.input.keyboard.on('keydown-SPACE', () => this.placeBomb());
        this.input.keyboard.on('keydown-E', () => this.useActiveItem());

        // HUD
        this.createHUD();

        // Room entry pause
        this.entryPause = false;
        this.entryPauseTimer = 0;
    }

    generateFloor() {
        // Generate 3x3 room grid with boss room
        this.floorMap = [];
        this.roomStates = {};

        for (let y = 0; y < 3; y++) {
            this.floorMap[y] = [];
            for (let x = 0; x < 3; x++) {
                let type = 'normal';
                if (x === 1 && y === 1) type = 'start';
                else if (x === 2 && y === 0) type = 'treasure';
                else if (x === 0 && y === 2) type = 'shop';
                else if (x === 2 && y === 2) type = 'boss';

                this.floorMap[y][x] = {
                    type,
                    cleared: type === 'start' || type === 'treasure' || type === 'shop',
                    visited: type === 'start',
                    enemies: [],
                    obstacles: [],
                    pickups: []
                };
            }
        }

        this.currentRoomX = 1;
        this.currentRoomY = 1;
    }

    loadRoom(rx, ry) {
        // Clear existing room objects
        this.wallGroup.clear(true, true);
        this.obstacleGroup.clear(true, true);
        this.doorGroup.clear(true, true);
        this.pickupGroup.clear(true, true);
        this.enemyGroup.clear(true, true);
        this.tearGroup.clear(true, true);
        this.enemyTearGroup.clear(true, true);
        this.itemGroup.clear(true, true);

        const room = this.floorMap[ry][rx];
        room.visited = true;

        // Draw floor
        for (let y = 0; y < ROOM_ROWS; y++) {
            for (let x = 0; x < ROOM_COLS; x++) {
                this.add.image(
                    this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                    this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                    'floor'
                ).setDepth(0);
            }
        }

        // Draw walls (borders)
        for (let x = -1; x <= ROOM_COLS; x++) {
            this.wallGroup.create(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY - TILE_SIZE / 2,
                'wall'
            );
            this.wallGroup.create(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + ROOM_HEIGHT + TILE_SIZE / 2,
                'wall'
            );
        }
        for (let y = 0; y < ROOM_ROWS; y++) {
            this.wallGroup.create(
                this.roomOffsetX - TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
            this.wallGroup.create(
                this.roomOffsetX + ROOM_WIDTH + TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
        }

        // Create doors
        const doorY = Math.floor(ROOM_ROWS / 2);
        const doorX = Math.floor(ROOM_COLS / 2);

        // Check adjacent rooms
        if (ry > 0 && this.floorMap[ry - 1][rx]) {
            this.createDoor('north', doorX, -1, room.cleared);
        }
        if (ry < 2 && this.floorMap[ry + 1][rx]) {
            this.createDoor('south', doorX, ROOM_ROWS, room.cleared);
        }
        if (rx > 0 && this.floorMap[ry][rx - 1]) {
            this.createDoor('west', -1, doorY, room.cleared);
        }
        if (rx < 2 && this.floorMap[ry][rx + 1]) {
            this.createDoor('east', ROOM_COLS, doorY, room.cleared);
        }

        // Room-specific content
        if (room.type === 'treasure') {
            this.createItemPedestal();
        } else if (room.type === 'shop') {
            this.createShop();
        } else if (room.type === 'boss') {
            if (!room.cleared) {
                this.spawnBoss();
            } else if (room.trapdoorPlaced) {
                // Show trapdoor
                const trap = this.physics.add.staticSprite(
                    this.roomOffsetX + ROOM_WIDTH / 2,
                    this.roomOffsetY + ROOM_HEIGHT / 2,
                    'trapdoor'
                );
                trap.setData('type', 'trapdoor');
                this.itemGroup.add(trap);
            }
        } else if (room.type === 'normal' && !room.cleared) {
            this.spawnRoomEnemies(room);
            this.createRoomObstacles(room);
        }

        // Restore room state if visited before
        if (room.pickups && room.pickups.length > 0) {
            room.pickups.forEach(p => {
                const pickup = this.physics.add.sprite(p.x, p.y, p.type);
                pickup.setData('type', p.type);
                this.pickupGroup.add(pickup);
            });
        }

        this.updateMinimap();
    }

    createDoor(direction, tileX, tileY, isOpen) {
        let x = this.roomOffsetX + tileX * TILE_SIZE + TILE_SIZE / 2;
        let y = this.roomOffsetY + tileY * TILE_SIZE + TILE_SIZE / 2;

        const door = this.physics.add.staticSprite(x, y, isOpen ? 'doorOpen' : 'doorClosed');
        door.setData('direction', direction);
        door.setData('open', isOpen);

        if (direction === 'north' || direction === 'south') {
            door.setAngle(90);
        }

        this.doorGroup.add(door);
    }

    createItemPedestal() {
        const ped = this.physics.add.staticSprite(
            this.roomOffsetX + ROOM_WIDTH / 2,
            this.roomOffsetY + ROOM_HEIGHT / 2 - 16,
            'pedestal'
        );

        const itemIdx = Phaser.Math.Between(0, ITEMS.length - 1);
        const item = this.physics.add.staticSprite(
            this.roomOffsetX + ROOM_WIDTH / 2,
            this.roomOffsetY + ROOM_HEIGHT / 2 - 32,
            `item_${itemIdx}`
        );
        item.setData('itemIndex', itemIdx);
        item.setData('type', 'item');
        this.itemGroup.add(item);
    }

    createShop() {
        // Simple shop with hearts and items
        const shopItems = [
            { type: 'pickupHeart', cost: 3, x: -64 },
            { type: 'bomb', cost: 5, x: 0 },
            { type: 'key', cost: 5, x: 64 }
        ];

        shopItems.forEach(si => {
            const item = this.physics.add.staticSprite(
                this.roomOffsetX + ROOM_WIDTH / 2 + si.x,
                this.roomOffsetY + ROOM_HEIGHT / 2,
                si.type
            );
            item.setData('type', 'shopItem');
            item.setData('itemType', si.type);
            item.setData('cost', si.cost);
            this.itemGroup.add(item);

            this.add.text(item.x, item.y + 20, `${si.cost}c`, {
                fontSize: '12px', color: '#ffdd00'
            }).setOrigin(0.5);
        });
    }

    spawnBoss() {
        const boss = this.physics.add.sprite(
            this.roomOffsetX + ROOM_WIDTH / 2,
            this.roomOffsetY + ROOM_HEIGHT / 2,
            'boss_monstro'
        );
        boss.setData('type', 'boss');
        boss.setData('hp', 250);
        boss.setData('maxHp', 250);
        boss.setData('lastAttack', 0);
        boss.setData('state', 'idle');
        boss.body.setCircle(40, 8, 8);
        this.enemyGroup.add(boss);

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, 300, 20, 0x333333).setDepth(100);
        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 148, GAME_HEIGHT - 30, 296, 16, 0xff0000).setOrigin(0, 0.5).setDepth(101);
    }

    spawnRoomEnemies(room) {
        const floorEnemies = [['fly', 'gaper', 'pooter'], ['fly', 'clotty', 'host'], ['gaper', 'clotty', 'host']];
        const enemyPool = floorEnemies[this.currentFloor - 1];
        const count = 3 + this.currentFloor;

        for (let i = 0; i < count; i++) {
            const type = Phaser.Utils.Array.GetRandom(enemyPool);
            const data = ENEMIES[type];

            const ex = this.roomOffsetX + TILE_SIZE * 2 + Math.random() * (ROOM_WIDTH - TILE_SIZE * 4);
            const ey = this.roomOffsetY + TILE_SIZE + Math.random() * (ROOM_HEIGHT - TILE_SIZE * 2);

            const enemy = this.physics.add.sprite(ex, ey, `enemy_${type}`);
            enemy.setData('type', type);
            enemy.setData('hp', data.hp);
            enemy.setData('speed', data.speed);
            enemy.setData('damage', data.damage);
            enemy.setData('behavior', data.behavior);
            enemy.setData('lastShot', 0);
            enemy.setData('spawning', true);
            enemy.setAlpha(0.5);
            enemy.body.setCircle(data.size / 2 - 2);
            this.enemyGroup.add(enemy);

            // Spawn animation
            this.time.delayedCall(500, () => {
                if (enemy.active) {
                    enemy.setData('spawning', false);
                    enemy.setAlpha(1);
                }
            });
        }
    }

    createRoomObstacles(room) {
        const numObstacles = Phaser.Math.Between(2, 5);
        for (let i = 0; i < numObstacles; i++) {
            const ox = this.roomOffsetX + TILE_SIZE * 2 + Math.floor(Math.random() * (ROOM_COLS - 4)) * TILE_SIZE;
            const oy = this.roomOffsetY + TILE_SIZE + Math.floor(Math.random() * (ROOM_ROWS - 2)) * TILE_SIZE;

            const obsType = Math.random() < 0.7 ? 'rock' : 'poop';
            const obs = this.obstacleGroup.create(ox + TILE_SIZE / 2, oy + TILE_SIZE / 2, obsType);
            obs.setData('type', obsType);
            obs.setData('hp', obsType === 'poop' ? 3 : 999);
        }
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(200);

        // Hearts
        this.heartSprites = [];
        for (let i = 0; i < 6; i++) {
            const heart = this.add.sprite(20 + i * 26, 20, 'heartEmpty');
            this.heartSprites.push(heart);
            this.hudContainer.add(heart);
        }

        // Stats
        this.statsText = this.add.text(20, 50, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
        });
        this.hudContainer.add(this.statsText);

        // Resources
        this.resourceText = this.add.text(20, 90, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
        });
        this.hudContainer.add(this.resourceText);

        // Floor name
        this.floorText = this.add.text(GAME_WIDTH / 2, 20, '', {
            fontSize: '18px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5, 0);
        this.hudContainer.add(this.floorText);

        // Minimap background
        this.minimapBg = this.add.rectangle(GAME_WIDTH - 70, 70, 120, 120, 0x111111).setDepth(200);
        this.minimapRooms = [];

        this.updateHUD();
    }

    updateHUD() {
        // Update hearts
        const fullHearts = Math.floor(this.stats.health / 2);
        const halfHeart = this.stats.health % 2;
        const maxHearts = Math.floor(this.stats.maxHealth / 2);

        for (let i = 0; i < 6; i++) {
            if (i < fullHearts) {
                this.heartSprites[i].setTexture('heartFull').setVisible(i < maxHearts);
            } else if (i === fullHearts && halfHeart) {
                this.heartSprites[i].setTexture('heartFull').setVisible(i < maxHearts);
            } else {
                this.heartSprites[i].setTexture('heartEmpty').setVisible(i < maxHearts);
            }
        }

        // Stats
        this.statsText.setText(`DMG: ${this.stats.damage.toFixed(1)} | SPD: ${(this.stats.speed / 150).toFixed(1)} | Tear: ${this.stats.tearDelay}`);

        // Resources
        this.resourceText.setText(`Coins: ${this.coins} | Bombs: ${this.bombs} | Keys: ${this.keys}`);

        // Floor
        this.floorText.setText(`${this.floorNames[this.currentFloor - 1]} ${this.currentFloor}`);
    }

    updateMinimap() {
        // Clear old minimap
        this.minimapRooms.forEach(r => r.destroy());
        this.minimapRooms = [];

        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const room = this.floorMap[y][x];
                if (!room.visited) continue;

                let color = 0x444444;
                if (room.type === 'treasure') color = 0xffff00;
                else if (room.type === 'shop') color = 0x00ffff;
                else if (room.type === 'boss') color = 0xff0000;
                else if (x === this.currentRoomX && y === this.currentRoomY) color = 0xffffff;

                const r = this.add.rectangle(
                    GAME_WIDTH - 100 + x * 30,
                    40 + y * 30,
                    24, 24, color
                ).setDepth(201);
                this.minimapRooms.push(r);
            }
        }
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Entry pause
        if (this.entryPause) {
            this.entryPauseTimer -= delta;
            if (this.entryPauseTimer <= 0) {
                this.entryPause = false;
            }
            this.player.setVelocity(0, 0);
            return;
        }

        // Movement
        let vx = 0, vy = 0;
        if (this.moveKeys.left.isDown) vx = -1;
        if (this.moveKeys.right.isDown) vx = 1;
        if (this.moveKeys.up.isDown) vy = -1;
        if (this.moveKeys.down.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.stats.speed, vy * this.stats.speed);

        // Shooting direction
        this.tearDirection = { x: 0, y: 0 };
        if (this.shootKeys.left.isDown) this.tearDirection.x = -1;
        if (this.shootKeys.right.isDown) this.tearDirection.x = 1;
        if (this.shootKeys.up.isDown) this.tearDirection.y = -1;
        if (this.shootKeys.down.isDown) this.tearDirection.y = 1;

        if (this.tearDirection.x !== 0 || this.tearDirection.y !== 0) {
            this.shootTear(time);
        }

        // Invincibility
        if (this.isInvincible) {
            this.invincibleTimer -= delta;
            this.player.setAlpha(Math.sin(time / 50) * 0.5 + 0.5);
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.player.setAlpha(1);
            }
        }

        // Update enemies
        this.updateEnemies(time, delta);

        // Check room cleared
        this.checkRoomCleared();
    }

    shootTear(time) {
        const tearDelayMs = this.stats.tearDelay * 30;
        if (time - this.lastTearTime < tearDelayMs) return;

        this.lastTearTime = time;

        // Normalize direction
        let dx = this.tearDirection.x;
        let dy = this.tearDirection.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }

        const tear = this.physics.add.sprite(this.player.x, this.player.y, 'tear');
        tear.setData('damage', this.stats.damage);
        tear.setData('piercing', this.hasPiercing);
        tear.setData('homing', this.hasHoming);
        tear.setData('startX', this.player.x);
        tear.setData('startY', this.player.y);
        tear.setData('range', this.stats.range);

        tear.setVelocity(dx * this.stats.shotSpeed, dy * this.stats.shotSpeed);
        this.tearGroup.add(tear);

        // Destroy when out of range
        this.time.delayedCall(1000, () => {
            if (tear.active) tear.destroy();
        });
    }

    updateEnemies(time, delta) {
        this.enemyGroup.children.each(enemy => {
            if (!enemy.active || enemy.getData('spawning')) return;

            const type = enemy.getData('type');
            const behavior = enemy.getData('behavior');
            const speed = enemy.getData('speed');

            if (type === 'boss') {
                this.updateBoss(enemy, time);
                return;
            }

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (behavior === 'chase') {
                if (dist > 20) {
                    this.physics.moveToObject(enemy, this.player, speed);
                } else {
                    enemy.setVelocity(0, 0);
                }
            } else if (behavior === 'shoot') {
                enemy.setVelocity(0, 0);
                if (time - enemy.getData('lastShot') > 2000 && dist < 200) {
                    enemy.setData('lastShot', time);
                    this.enemyShoot(enemy);
                }
            } else if (behavior === 'shoot4') {
                enemy.setVelocity(0, 0);
                if (time - enemy.getData('lastShot') > 2500) {
                    enemy.setData('lastShot', time);
                    // Shoot in 4 directions
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        this.createEnemyTear(enemy.x, enemy.y, dx * 150, dy * 150);
                    });
                }
            } else if (behavior === 'popup') {
                // Host behavior - stationary, shoots when visible
                if (time - enemy.getData('lastShot') > 3000) {
                    enemy.setData('lastShot', time);
                    this.enemyShoot(enemy);
                }
            }
        });

        // Update enemy tears - check for out of bounds
        this.enemyTearGroup.children.each(t => {
            if (t.x < this.roomOffsetX || t.x > this.roomOffsetX + ROOM_WIDTH ||
                t.y < this.roomOffsetY || t.y > this.roomOffsetY + ROOM_HEIGHT) {
                t.destroy();
            }
        });
    }

    updateBoss(boss, time) {
        const state = boss.getData('state');
        const hp = boss.getData('hp');
        const maxHp = boss.getData('maxHp');

        // Update HP bar
        if (this.bossHpBar) {
            this.bossHpBar.width = (hp / maxHp) * 296;
        }

        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);

        if (state === 'idle') {
            if (time - boss.getData('lastAttack') > 2000) {
                const attack = Phaser.Math.Between(0, 2);
                if (attack === 0) {
                    // Jump at player
                    boss.setData('state', 'jumping');
                    boss.setData('jumpTarget', { x: this.player.x, y: this.player.y });
                    boss.setData('jumpStart', time);
                } else {
                    // Spit attack
                    boss.setData('state', 'spitting');
                    boss.setData('lastAttack', time);
                    this.bossSpitAttack(boss);
                    this.time.delayedCall(500, () => {
                        if (boss.active) boss.setData('state', 'idle');
                    });
                }
            }
        } else if (state === 'jumping') {
            const target = boss.getData('jumpTarget');
            const jumpTime = time - boss.getData('jumpStart');

            if (jumpTime < 500) {
                // Rise up
                boss.setScale(1 + jumpTime / 1000);
            } else if (jumpTime < 1000) {
                // Move toward target
                this.physics.moveToObject(boss, target, 300);
            } else {
                // Land
                boss.setScale(1);
                boss.setVelocity(0, 0);
                boss.setData('state', 'idle');
                boss.setData('lastAttack', time);

                // Burst attack on landing
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    this.createEnemyTear(boss.x, boss.y, Math.cos(angle) * 120, Math.sin(angle) * 120);
                }
            }
        }
    }

    bossSpitAttack(boss) {
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        for (let i = -2; i <= 2; i++) {
            const a = angle + i * 0.2;
            this.createEnemyTear(boss.x, boss.y, Math.cos(a) * 180, Math.sin(a) * 180);
        }
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        this.createEnemyTear(enemy.x, enemy.y, Math.cos(angle) * 150, Math.sin(angle) * 150);
    }

    createEnemyTear(x, y, vx, vy) {
        const tear = this.physics.add.sprite(x, y, 'enemyTear');
        tear.setVelocity(vx, vy);
        this.enemyTearGroup.add(tear);

        this.time.delayedCall(3000, () => {
            if (tear.active) tear.destroy();
        });
    }

    tearHitEnemy(tear, enemy) {
        if (enemy.getData('spawning')) return;

        const damage = tear.getData('damage');
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (!tear.getData('piercing')) {
            tear.destroy();
        }

        if (hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    tearHitObstacle(tear, obstacle) {
        const type = obstacle.getData('type');
        if (type === 'poop') {
            let hp = obstacle.getData('hp') - 1;
            obstacle.setData('hp', hp);
            obstacle.setTint(0x888888);
            if (hp <= 0) {
                obstacle.destroy();
                if (Math.random() < 0.3) {
                    this.spawnPickup(obstacle.x, obstacle.y);
                }
            }
        }
        tear.destroy();
    }

    enemyDeath(enemy) {
        const type = enemy.getData('type');

        // Drop pickup
        if (Math.random() < 0.3) {
            this.spawnPickup(enemy.x, enemy.y);
        }

        // Death effect
        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                4, 0xff4444
            );
            this.tweens.add({
                targets: p,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => p.destroy()
            });
        }

        if (type === 'boss') {
            // Boss defeated
            this.bossHpBg.destroy();
            this.bossHpBar.destroy();

            const room = this.floorMap[this.currentRoomY][this.currentRoomX];
            room.cleared = true;
            room.trapdoorPlaced = true;

            // Spawn trapdoor
            const trap = this.physics.add.staticSprite(
                this.roomOffsetX + ROOM_WIDTH / 2,
                this.roomOffsetY + ROOM_HEIGHT / 2,
                'trapdoor'
            );
            trap.setData('type', 'trapdoor');
            this.itemGroup.add(trap);

            // Spawn item
            const itemIdx = Phaser.Math.Between(0, ITEMS.length - 1);
            const item = this.physics.add.staticSprite(
                this.roomOffsetX + ROOM_WIDTH / 2 + 64,
                this.roomOffsetY + ROOM_HEIGHT / 2,
                `item_${itemIdx}`
            );
            item.setData('itemIndex', itemIdx);
            item.setData('type', 'item');
            this.itemGroup.add(item);
        }

        enemy.destroy();
    }

    spawnPickup(x, y) {
        const types = ['coin', 'coin', 'coin', 'pickupHeart', 'bomb', 'key'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const pickup = this.physics.add.sprite(x, y, type);
        pickup.setData('type', type);
        this.pickupGroup.add(pickup);
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        if (type === 'coin') {
            this.coins++;
        } else if (type === 'pickupHeart') {
            this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 2);
        } else if (type === 'bomb') {
            this.bombs++;
        } else if (type === 'key') {
            this.keys++;
        }

        pickup.destroy();
        this.updateHUD();
    }

    playerHitEnemy(player, enemy) {
        if (this.isInvincible || enemy.getData('spawning')) return;

        const damage = enemy.getData('damage') || 1;
        this.takeDamage(damage);
    }

    playerHitTear(player, tear) {
        if (this.isInvincible) return;

        this.takeDamage(1);
        tear.destroy();
    }

    takeDamage(amount) {
        this.stats.health -= amount;
        this.isInvincible = true;
        this.invincibleTimer = 1000;

        this.cameras.main.shake(100, 0.01);

        if (this.stats.health <= 0) {
            this.playerDeath();
        }

        this.updateHUD();
    }

    playerDeath() {
        this.player.setActive(false);
        this.player.setVisible(false);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'YOU DIED', {
            fontSize: '48px', fontFamily: 'Arial', color: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(300);

        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    checkDoor(player, door) {
        if (!door.getData('open')) return;

        const dir = door.getData('direction');
        let newX = this.currentRoomX;
        let newY = this.currentRoomY;

        if (dir === 'north') newY--;
        else if (dir === 'south') newY++;
        else if (dir === 'west') newX--;
        else if (dir === 'east') newX++;

        if (newX >= 0 && newX < 3 && newY >= 0 && newY < 3) {
            this.currentRoomX = newX;
            this.currentRoomY = newY;
            this.loadRoom(newX, newY);

            // Position player at opposite door
            if (dir === 'north') {
                this.player.y = this.roomOffsetY + ROOM_HEIGHT - TILE_SIZE;
            } else if (dir === 'south') {
                this.player.y = this.roomOffsetY + TILE_SIZE;
            } else if (dir === 'west') {
                this.player.x = this.roomOffsetX + ROOM_WIDTH - TILE_SIZE;
            } else if (dir === 'east') {
                this.player.x = this.roomOffsetX + TILE_SIZE;
            }

            // Entry pause
            this.entryPause = true;
            this.entryPauseTimer = 200;
        }
    }

    checkItem(player, item) {
        const type = item.getData('type');

        if (type === 'item') {
            const idx = item.getData('itemIndex');
            const itemData = ITEMS[idx];

            // Apply item effect
            if (itemData.effect === 'tears') {
                this.stats.tearDelay = Math.max(1, this.stats.tearDelay - itemData.value);
            } else if (itemData.effect === 'damage') {
                this.stats.damage += itemData.value;
            } else if (itemData.effect === 'speed') {
                this.stats.speed += itemData.value;
            } else if (itemData.effect === 'health') {
                this.stats.maxHealth += itemData.value;
                this.stats.health += itemData.value;
            } else if (itemData.effect === 'homing') {
                this.hasHoming = true;
            } else if (itemData.effect === 'piercing') {
                this.hasPiercing = true;
            } else if (itemData.effect === 'laser') {
                this.hasLaser = true;
            }

            this.collectedItems.push(itemData.name);

            // Show item name
            const txt = this.add.text(player.x, player.y - 40, itemData.name, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ffff00'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: txt,
                y: txt.y - 30,
                alpha: 0,
                duration: 1500,
                onComplete: () => txt.destroy()
            });

            item.destroy();
            this.updateHUD();
        } else if (type === 'shopItem') {
            const cost = item.getData('cost');
            if (this.coins >= cost) {
                this.coins -= cost;
                const itemType = item.getData('itemType');
                if (itemType === 'pickupHeart') {
                    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 2);
                } else if (itemType === 'bomb') {
                    this.bombs++;
                } else if (itemType === 'key') {
                    this.keys++;
                }
                item.destroy();
                this.updateHUD();
            }
        } else if (type === 'trapdoor') {
            // Go to next floor
            this.currentFloor++;
            if (this.currentFloor > 3) {
                this.scene.start('VictoryScene');
            } else {
                this.generateFloor();
                this.loadRoom(this.currentRoomX, this.currentRoomY);
                this.player.setPosition(
                    this.roomOffsetX + ROOM_WIDTH / 2,
                    this.roomOffsetY + ROOM_HEIGHT / 2
                );
                this.updateHUD();
            }
        }
    }

    checkRoomCleared() {
        const room = this.floorMap[this.currentRoomY][this.currentRoomX];
        if (room.cleared) return;

        if (this.enemyGroup.countActive() === 0) {
            room.cleared = true;
            // Open doors
            this.doorGroup.children.each(door => {
                door.setTexture('doorOpen');
                door.setData('open', true);
            });
        }
    }

    placeBomb() {
        if (this.bombs <= 0) return;
        this.bombs--;

        const bomb = this.add.sprite(this.player.x, this.player.y, 'bomb');
        bomb.setScale(2);

        this.time.delayedCall(2000, () => {
            // Explosion
            const explosion = this.add.circle(bomb.x, bomb.y, 48, 0xff6600, 0.5);
            this.tweens.add({
                targets: explosion,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => explosion.destroy()
            });

            // Damage enemies
            this.enemyGroup.children.each(enemy => {
                const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, enemy.x, enemy.y);
                if (dist < 64) {
                    let hp = enemy.getData('hp') - 60;
                    enemy.setData('hp', hp);
                    if (hp <= 0) this.enemyDeath(enemy);
                }
            });

            // Destroy obstacles
            this.obstacleGroup.children.each(obs => {
                const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, obs.x, obs.y);
                if (dist < 64) {
                    obs.destroy();
                }
            });

            bomb.destroy();
        });

        this.updateHUD();
    }

    useActiveItem() {
        // Placeholder for active item
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }

    create() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'VICTORY!', {
            fontSize: '48px', fontFamily: 'Arial', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'You defeated Mom\'s Heart!', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);

        const restart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '[ PLAY AGAIN ]', {
            fontSize: '28px', fontFamily: 'Arial', color: '#88ccff'
        }).setOrigin(0.5).setInteractive();

        restart.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// Config and start
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, VictoryScene]
};

const game = new Phaser.Game(config);
