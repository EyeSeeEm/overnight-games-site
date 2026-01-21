// Enter the Gungeon Clone - Phaser 3
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 16;
const ROOM_WIDTH = 25;
const ROOM_HEIGHT = 18;

// Weapon definitions
const WEAPONS = {
    pistol: { name: 'Marine Sidearm', damage: 6, fireRate: 250, mag: 10, maxAmmo: Infinity, spread: 0.05, bulletSpeed: 400, tier: 'D' },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 600, mag: 8, maxAmmo: 60, spread: 0.3, bulletSpeed: 350, pellets: 6, tier: 'C' },
    ak47: { name: 'AK-47', damage: 5, fireRate: 100, mag: 30, maxAmmo: 200, spread: 0.1, bulletSpeed: 450, tier: 'B' },
    railgun: { name: 'Railgun', damage: 60, fireRate: 1500, mag: 3, maxAmmo: 15, spread: 0, bulletSpeed: 800, pierce: true, tier: 'A' },
    demonHead: { name: 'Demon Head', damage: 25, fireRate: 800, mag: 6, maxAmmo: 30, spread: 0.05, bulletSpeed: 300, homing: true, tier: 'B' }
};

// Enemy definitions
const ENEMIES = {
    bulletKin: { hp: 15, speed: 60, fireRate: 2000, damage: 1, pattern: 'single' },
    bandanaBulletKin: { hp: 15, speed: 70, fireRate: 1800, damage: 1, pattern: 'spread3' },
    shotgunKin: { hp: 25, speed: 50, fireRate: 2500, damage: 1, pattern: 'spread6' },
    veteranBulletKin: { hp: 20, speed: 80, fireRate: 1500, damage: 1, pattern: 'single' },
    gunNut: { hp: 50, speed: 90, fireRate: 0, damage: 1, pattern: 'melee' }
};

// Boss definitions
const BOSSES = {
    bulletKing: { hp: 600, name: 'Bullet King', floor: 1 },
    beholster: { hp: 800, name: 'Beholster', floor: 2 },
    highDragun: { hp: 1500, name: 'High Dragun', floor: 3 }
};

// ========== BOOT SCENE ==========
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Player texture (bullet-themed gungeoneer)
        let g = this.make.graphics({ add: false });
        g.fillStyle(0x4488ff);
        g.fillCircle(12, 10, 8);
        g.fillStyle(0x3366cc);
        g.fillRect(8, 10, 8, 10);
        g.fillStyle(0xffcc88);
        g.fillCircle(12, 8, 4);
        g.generateTexture('player', 24, 24);

        // Player rolling texture
        g.clear();
        g.fillStyle(0x4488ff);
        g.fillEllipse(12, 12, 20, 10);
        g.generateTexture('player_roll', 24, 24);

        // Bullet Kin enemy (bullet-shaped)
        g.clear();
        g.fillStyle(0xcc8844);
        g.fillCircle(8, 4, 4);
        g.fillRect(4, 4, 8, 12);
        g.fillStyle(0xddaa55);
        g.fillCircle(8, 4, 2);
        g.fillStyle(0x000000);
        g.fillCircle(6, 10, 1);
        g.fillCircle(10, 10, 1);
        g.generateTexture('bulletKin', 16, 16);

        // Shotgun Kin (larger shell shape)
        g.clear();
        g.fillStyle(0xcc4444);
        g.fillRect(2, 0, 12, 16);
        g.fillStyle(0xdd6666);
        g.fillRect(4, 2, 8, 4);
        g.fillStyle(0x000000);
        g.fillCircle(6, 10, 1);
        g.fillCircle(10, 10, 1);
        g.generateTexture('shotgunKin', 16, 16);

        // Gun Nut (armored bullet)
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(2, 0, 12, 20);
        g.fillStyle(0x888888);
        g.fillRect(0, 4, 16, 8);
        g.fillStyle(0xcc8844);
        g.fillCircle(8, 16, 3);
        g.generateTexture('gunNut', 16, 20);

        // Bullet King boss
        g.clear();
        g.fillStyle(0xcc8844);
        g.fillCircle(24, 12, 12);
        g.fillRect(12, 12, 24, 28);
        g.fillStyle(0xffdd00);
        g.beginPath();
        g.moveTo(12, 8);
        g.lineTo(24, 0);
        g.lineTo(36, 8);
        g.lineTo(30, 8);
        g.lineTo(30, 12);
        g.lineTo(18, 12);
        g.lineTo(18, 8);
        g.closePath();
        g.fillPath();
        g.fillStyle(0x000000);
        g.fillCircle(18, 24, 2);
        g.fillCircle(30, 24, 2);
        g.generateTexture('bulletKing', 48, 48);

        // Beholster boss (eye with gun tentacles)
        g.clear();
        g.fillStyle(0x884488);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xffffff);
        g.fillCircle(24, 20, 10);
        g.fillStyle(0xcc0000);
        g.fillCircle(24, 20, 5);
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * Math.PI * 2;
            g.fillStyle(0x666666);
            g.fillRect(24 + Math.cos(angle) * 18, 24 + Math.sin(angle) * 18, 8, 4);
        }
        g.generateTexture('beholster', 48, 48);

        // High Dragun boss
        g.clear();
        g.fillStyle(0x44aa44);
        g.fillCircle(32, 24, 20);
        g.fillStyle(0x338833);
        g.beginPath();
        g.moveTo(10, 32);
        g.lineTo(0, 48);
        g.lineTo(20, 40);
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(54, 32);
        g.lineTo(64, 48);
        g.lineTo(44, 40);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xff4400);
        g.fillCircle(24, 20, 4);
        g.fillCircle(40, 20, 4);
        g.fillStyle(0xffcc00);
        g.beginPath();
        g.moveTo(32, 30);
        g.lineTo(20, 50);
        g.lineTo(44, 50);
        g.closePath();
        g.fillPath();
        g.generateTexture('highDragun', 64, 64);

        // Player bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('playerBullet', 8, 8);

        // Enemy bullet (red)
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemyBullet', 8, 8);

        // Homing bullet
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(5, 5, 5);
        g.fillStyle(0xffcc00);
        g.fillCircle(5, 5, 2);
        g.generateTexture('homingBullet', 10, 10);

        // Railgun beam
        g.clear();
        g.fillStyle(0x00ffff);
        g.fillRect(0, 0, 40, 4);
        g.generateTexture('railBeam', 40, 4);

        // Floor tile
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x3a3a4a);
        g.fillRect(0, 0, 2, TILE_SIZE);
        g.fillRect(0, 0, TILE_SIZE, 2);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(0x555566);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x666677);
        g.fillRect(2, 2, TILE_SIZE - 4, 4);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door (open)
        g.clear();
        g.fillStyle(0x222233);
        g.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE);
        g.generateTexture('doorOpen', TILE_SIZE * 2, TILE_SIZE);

        // Door (closed)
        g.clear();
        g.fillStyle(0x884422);
        g.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE);
        g.fillStyle(0x663311);
        g.fillRect(4, 4, TILE_SIZE * 2 - 8, TILE_SIZE - 8);
        g.generateTexture('doorClosed', TILE_SIZE * 2, TILE_SIZE);

        // Table
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 0, 32, 16);
        g.fillStyle(0x6b3503);
        g.fillRect(2, 14, 4, 6);
        g.fillRect(26, 14, 4, 6);
        g.generateTexture('table', 32, 20);

        // Flipped table (cover)
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 4, 6, 16);
        g.fillStyle(0x6b3503);
        g.fillRect(0, 0, 6, 4);
        g.generateTexture('tableFlipped', 6, 20);

        // Crate
        g.clear();
        g.fillStyle(0x8b6914);
        g.fillRect(0, 0, 24, 24);
        g.fillStyle(0x6b4904);
        g.fillRect(0, 0, 24, 4);
        g.fillRect(0, 20, 24, 4);
        g.fillRect(10, 4, 4, 16);
        g.generateTexture('crate', 24, 24);

        // Barrel
        g.clear();
        g.fillStyle(0x666666);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0x444444);
        g.fillCircle(12, 12, 8);
        g.fillStyle(0xff4400);
        g.fillRect(8, 8, 8, 8);
        g.generateTexture('barrel', 24, 24);

        // Pillar
        g.clear();
        g.fillStyle(0x888899);
        g.fillRect(4, 0, 24, 32);
        g.fillStyle(0x666677);
        g.fillRect(0, 0, 32, 6);
        g.fillRect(0, 26, 32, 6);
        g.generateTexture('pillar', 32, 32);

        // Heart pickup
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(5, 5, 4);
        g.fillCircle(11, 5, 4);
        g.beginPath();
        g.moveTo(1, 7);
        g.lineTo(8, 14);
        g.lineTo(15, 7);
        g.closePath();
        g.fillPath();
        g.generateTexture('heart', 16, 16);

        // Half heart
        g.clear();
        g.fillStyle(0xff8888);
        g.fillCircle(4, 4, 3);
        g.beginPath();
        g.moveTo(1, 5);
        g.lineTo(4, 10);
        g.lineTo(7, 5);
        g.closePath();
        g.fillPath();
        g.generateTexture('halfHeart', 8, 12);

        // Shell (currency)
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xcc9900);
        g.fillCircle(6, 6, 3);
        g.generateTexture('shell', 12, 12);

        // Key
        g.clear();
        g.fillStyle(0xffdd00);
        g.fillCircle(4, 4, 4);
        g.fillRect(4, 6, 3, 10);
        g.fillRect(4, 12, 6, 2);
        g.generateTexture('key', 12, 16);

        // Blank item
        g.clear();
        g.fillStyle(0x4488ff);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0x66aaff);
        g.fillCircle(8, 8, 5);
        g.generateTexture('blank', 16, 16);

        // Ammo pickup
        g.clear();
        g.fillStyle(0x44cc44);
        g.fillRect(2, 0, 8, 14);
        g.fillStyle(0x228822);
        g.fillCircle(6, 2, 3);
        g.generateTexture('ammo', 12, 14);

        // Chest (brown/blue/green/red)
        const chestColors = { brown: 0x8b4513, blue: 0x4444cc, green: 0x44cc44, red: 0xcc4444 };
        for (let [tier, color] of Object.entries(chestColors)) {
            g.clear();
            g.fillStyle(color);
            g.fillRect(0, 4, 24, 16);
            g.fillStyle(color - 0x222222);
            g.fillRect(0, 0, 24, 6);
            g.fillStyle(0xffcc00);
            g.fillRect(10, 10, 4, 6);
            g.generateTexture(`chest_${tier}`, 24, 20);
        }

        // Explosion
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffcc00);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffffff);
        g.fillCircle(16, 16, 4);
        g.generateTexture('explosion', 32, 32);

        // Blank effect
        g.clear();
        g.lineStyle(4, 0x66aaff);
        g.strokeCircle(48, 48, 40);
        g.lineStyle(2, 0xffffff);
        g.strokeCircle(48, 48, 45);
        g.generateTexture('blankEffect', 96, 96);

        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// ========== MENU SCENE ==========
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111122);

        this.add.text(GAME_WIDTH / 2, 100, 'ENTER THE GUNGEON', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 180, 'A Bullet Hell Roguelike', {
            fontSize: '20px',
            color: '#888899'
        }).setOrigin(0.5);

        // Controls
        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'Space - Dodge Roll',
            'R - Reload',
            'Q - Use Blank',
            'E - Interact / Flip Table',
            '1-5 - Switch Weapon'
        ];

        controls.forEach((text, i) => {
            this.add.text(GAME_WIDTH / 2, 260 + i * 25, text, {
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(GAME_WIDTH / 2, 520, '[ START GAME ]', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setColor('#44ff44'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

// ========== GAME SCENE ==========
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        // Game state
        this.floor = 1;
        this.roomIndex = 0;
        this.rooms = [];
        this.currentRoom = null;
        this.doorsLocked = false;
        this.shells = 0;
        this.keys = 1;

        // Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.obstacles = this.physics.add.group();
        this.tables = this.physics.add.group();
        this.chests = this.physics.add.group();

        // Create player
        this.createPlayer();

        // Generate floor
        this.generateFloor();

        // Setup input
        this.setupInput();

        // Create UI
        this.createUI();

        // Collisions
        this.setupCollisions();

        // Boss state
        this.boss = null;
        this.bossPhase = 0;

        // Timer for enemy attacks
        this.time.addEvent({
            delay: 100,
            callback: this.updateEnemies,
            callbackScope: this,
            loop: true
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Player stats
        this.player.maxHp = 6;
        this.player.hp = 6;
        this.player.speed = 180;
        this.player.blanks = 2;
        this.player.armor = 1;
        this.player.invincible = false;
        this.player.rolling = false;
        this.player.rollTime = 0;
        this.player.rollDir = { x: 0, y: 0 };

        // Weapons
        this.player.weapons = [
            { ...WEAPONS.pistol, currentMag: 10, currentAmmo: Infinity }
        ];
        this.player.currentWeapon = 0;
        this.player.lastFired = 0;
        this.player.reloading = false;
        this.player.reloadTime = 0;
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            roll: 'SPACE', reload: 'R', blank: 'Q', interact: 'E',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE',
            weapon4: 'FOUR', weapon5: 'FIVE'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.shoot();
        });
    }

    setupCollisions() {
        // Player bullets hit enemies
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);

        // Enemy bullets hit player
        this.physics.add.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);

        // Player collects pickups
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Bullets hit obstacles
        this.physics.add.overlap(this.playerBullets, this.obstacles, (bullet) => bullet.destroy());
        this.physics.add.overlap(this.enemyBullets, this.obstacles, (bullet) => bullet.destroy());

        // Bullets hit flipped tables (cover)
        this.physics.add.overlap(this.enemyBullets, this.tables, (bullet, table) => {
            if (table.getData('flipped')) bullet.destroy();
        });

        // Player can't walk through obstacles
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);
    }

    generateFloor() {
        // Clear previous room
        this.clearRoom();

        // Generate rooms for this floor
        const roomCount = 5 + this.floor * 2;
        this.rooms = [];

        for (let i = 0; i < roomCount; i++) {
            let type = 'combat';
            if (i === 0) type = 'start';
            else if (i === roomCount - 1) type = 'boss';
            else if (i === Math.floor(roomCount / 2)) type = 'shop';
            else if (i === Math.floor(roomCount / 3)) type = 'treasure';

            this.rooms.push({
                type,
                cleared: type === 'start' || type === 'shop' || type === 'treasure',
                enemies: this.generateRoomEnemies(type),
                objects: this.generateRoomObjects(type)
            });
        }

        this.roomIndex = 0;
        this.loadRoom(0);
    }

    generateRoomEnemies(type) {
        if (type !== 'combat') return [];

        const count = 3 + Math.floor(Math.random() * 3) + this.floor;
        const enemies = [];

        const types = ['bulletKin', 'bulletKin', 'bandanaBulletKin', 'shotgunKin'];
        if (this.floor >= 2) types.push('veteranBulletKin', 'gunNut');

        for (let i = 0; i < count; i++) {
            enemies.push({
                type: types[Math.floor(Math.random() * types.length)],
                x: 150 + Math.random() * (GAME_WIDTH - 300),
                y: 100 + Math.random() * (GAME_HEIGHT - 250)
            });
        }

        return enemies;
    }

    generateRoomObjects(type) {
        const objects = [];
        const count = 3 + Math.floor(Math.random() * 5);

        const objTypes = ['table', 'crate', 'barrel', 'pillar'];

        for (let i = 0; i < count; i++) {
            objects.push({
                type: objTypes[Math.floor(Math.random() * objTypes.length)],
                x: 100 + Math.random() * (GAME_WIDTH - 200),
                y: 80 + Math.random() * (GAME_HEIGHT - 200)
            });
        }

        return objects;
    }

    loadRoom(index) {
        this.clearRoom();
        this.roomIndex = index;
        this.currentRoom = this.rooms[index];

        // Draw room
        this.drawRoom();

        // Spawn objects
        this.currentRoom.objects.forEach(obj => {
            if (obj.type === 'table') {
                const table = this.tables.create(obj.x, obj.y, 'table');
                table.setData('flipped', false);
                table.setImmovable(true);
            } else if (obj.type === 'crate') {
                const crate = this.obstacles.create(obj.x, obj.y, 'crate');
                crate.setImmovable(true);
                crate.setData('destructible', true);
                crate.setData('hp', 10);
            } else if (obj.type === 'barrel') {
                const barrel = this.obstacles.create(obj.x, obj.y, 'barrel');
                barrel.setImmovable(true);
                barrel.setData('explosive', true);
                barrel.setData('hp', 5);
            } else if (obj.type === 'pillar') {
                const pillar = this.obstacles.create(obj.x, obj.y, 'pillar');
                pillar.setImmovable(true);
            }
        });

        // Spawn enemies
        if (!this.currentRoom.cleared) {
            this.currentRoom.enemies.forEach(e => this.spawnEnemy(e.type, e.x, e.y));
            if (this.enemies.countActive() > 0) {
                this.doorsLocked = true;
            }
        }

        // Boss room
        if (this.currentRoom.type === 'boss' && !this.currentRoom.cleared) {
            this.spawnBoss();
        }

        // Treasure room - spawn chest
        if (this.currentRoom.type === 'treasure') {
            const tiers = ['brown', 'blue', 'green'];
            const tier = tiers[Math.min(this.floor - 1, 2)];
            const chest = this.chests.create(GAME_WIDTH / 2, GAME_HEIGHT / 2, `chest_${tier}`);
            chest.setData('tier', tier);
            chest.setData('opened', false);
            chest.setInteractive();
        }

        // Shop room
        if (this.currentRoom.type === 'shop') {
            this.createShop();
        }

        // Position player at entrance
        this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    }

    clearRoom() {
        this.enemies.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.playerBullets.clear(true, true);
        this.obstacles.clear(true, true);
        this.tables.clear(true, true);
        this.pickups.clear(true, true);
        this.chests.clear(true, true);

        // Clear shop items
        if (this.shopItems) {
            this.shopItems.forEach(item => item.destroy());
            this.shopItems = [];
        }
        if (this.shopTexts) {
            this.shopTexts.forEach(text => text.destroy());
            this.shopTexts = [];
        }

        this.boss = null;
    }

    drawRoom() {
        // Clear previous tiles
        if (this.roomTiles) this.roomTiles.forEach(t => t.destroy());
        this.roomTiles = [];

        // Floor tiles
        for (let x = 2; x < ROOM_WIDTH - 2; x++) {
            for (let y = 2; y < ROOM_HEIGHT - 2; y++) {
                const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'floor');
                tile.setDepth(0);
                this.roomTiles.push(tile);
            }
        }

        // Walls
        for (let x = 0; x < ROOM_WIDTH; x++) {
            for (let y = 0; y < 2; y++) {
                const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                this.roomTiles.push(tile);
            }
            for (let y = ROOM_HEIGHT - 2; y < ROOM_HEIGHT; y++) {
                const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                this.roomTiles.push(tile);
            }
        }
        for (let y = 2; y < ROOM_HEIGHT - 2; y++) {
            for (let x = 0; x < 2; x++) {
                const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                this.roomTiles.push(tile);
            }
            for (let x = ROOM_WIDTH - 2; x < ROOM_WIDTH; x++) {
                const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                this.roomTiles.push(tile);
            }
        }

        // Doors
        this.doors = [];

        // Top door (previous room)
        if (this.roomIndex > 0) {
            const doorTexture = this.doorsLocked ? 'doorClosed' : 'doorOpen';
            const topDoor = this.add.image(GAME_WIDTH / 2, TILE_SIZE, doorTexture);
            topDoor.setData('direction', 'up');
            topDoor.setInteractive();
            this.doors.push(topDoor);
            this.roomTiles.push(topDoor);
        }

        // Bottom door (next room)
        if (this.roomIndex < this.rooms.length - 1) {
            const doorTexture = this.doorsLocked ? 'doorClosed' : 'doorOpen';
            const bottomDoor = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - TILE_SIZE, doorTexture);
            bottomDoor.setData('direction', 'down');
            bottomDoor.setInteractive();
            this.doors.push(bottomDoor);
            this.roomTiles.push(bottomDoor);
        }

        // Set up physics bounds
        this.physics.world.setBounds(TILE_SIZE * 2, TILE_SIZE * 2,
            GAME_WIDTH - TILE_SIZE * 4, GAME_HEIGHT - TILE_SIZE * 4);
    }

    createShop() {
        this.shopItems = [];
        this.shopTexts = [];

        const items = [
            { name: 'Heart', texture: 'heart', price: 20, effect: () => { this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2); }},
            { name: 'Blank', texture: 'blank', price: 15, effect: () => { this.player.blanks++; }},
            { name: 'Key', texture: 'key', price: 25, effect: () => { this.keys++; }},
            { name: 'Armor', texture: 'shell', price: 30, effect: () => { this.player.armor++; }},
            { name: 'Ammo', texture: 'ammo', price: 20, effect: () => {
                const w = this.player.weapons[this.player.currentWeapon];
                if (w.maxAmmo !== Infinity) w.currentAmmo = Math.min(w.maxAmmo, w.currentAmmo + 20);
            }}
        ];

        items.forEach((item, i) => {
            const x = 150 + i * 120;
            const sprite = this.add.image(x, GAME_HEIGHT / 2 - 30, item.texture);
            sprite.setInteractive();
            sprite.setData('item', item);
            sprite.setScale(1.5);
            this.shopItems.push(sprite);

            const text = this.add.text(x, GAME_HEIGHT / 2 + 10, `${item.name}\n$${item.price}`, {
                fontSize: '14px',
                color: '#ffcc00',
                align: 'center'
            }).setOrigin(0.5);
            this.shopTexts.push(text);

            sprite.on('pointerdown', () => {
                if (this.shells >= item.price) {
                    this.shells -= item.price;
                    item.effect();
                    sprite.destroy();
                    text.destroy();
                    this.updateUI();
                }
            });
        });

        this.add.text(GAME_WIDTH / 2, 80, 'SHOP', {
            fontSize: '32px',
            color: '#ffcc00'
        }).setOrigin(0.5);
    }

    spawnEnemy(type, x, y) {
        const data = ENEMIES[type] || ENEMIES.bulletKin;
        const texture = type.includes('shotgun') ? 'shotgunKin' :
                       type === 'gunNut' ? 'gunNut' : 'bulletKin';

        const enemy = this.enemies.create(x, y, texture);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('maxHp', data.hp);
        enemy.setData('speed', data.speed);
        enemy.setData('fireRate', data.fireRate);
        enemy.setData('pattern', data.pattern);
        enemy.setData('lastFired', 0);
        enemy.setCollideWorldBounds(true);
        enemy.setDepth(5);

        return enemy;
    }

    spawnBoss() {
        const bossData = this.floor === 1 ? BOSSES.bulletKing :
                        this.floor === 2 ? BOSSES.beholster : BOSSES.highDragun;

        const texture = this.floor === 1 ? 'bulletKing' :
                       this.floor === 2 ? 'beholster' : 'highDragun';

        this.boss = this.physics.add.sprite(GAME_WIDTH / 2, 120, texture);
        this.boss.setData('hp', bossData.hp);
        this.boss.setData('maxHp', bossData.hp);
        this.boss.setData('name', bossData.name);
        this.boss.setData('lastAttack', 0);
        this.boss.setData('attackPattern', 0);
        this.boss.setDepth(8);

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, 30, 400, 16, 0x333333);
        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 198, 30, 396, 12, 0xff4444);
        this.bossHpBar.setOrigin(0, 0.5);
        this.bossNameText = this.add.text(GAME_WIDTH / 2, 50, bossData.name, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.doorsLocked = true;
    }

    updateEnemies() {
        if (!this.player || !this.player.active) return;

        const now = this.time.now;

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const data = ENEMIES[enemy.getData('type')] || ENEMIES.bulletKin;
            const lastFired = enemy.getData('lastFired') || 0;

            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (data.pattern !== 'melee' && dist > 150) {
                enemy.setVelocity(Math.cos(angle) * data.speed, Math.sin(angle) * data.speed);
            } else if (data.pattern === 'melee' && dist > 30) {
                enemy.setVelocity(Math.cos(angle) * data.speed * 1.5, Math.sin(angle) * data.speed * 1.5);
            } else if (data.pattern !== 'melee') {
                enemy.setVelocity(0, 0);
            }

            // Fire at player
            if (data.fireRate > 0 && now - lastFired > data.fireRate) {
                this.enemyShoot(enemy, data.pattern, angle);
                enemy.setData('lastFired', now);
            }
        });

        // Update boss
        if (this.boss && this.boss.active) {
            this.updateBoss();
        }
    }

    enemyShoot(enemy, pattern, angle) {
        const speed = 200;

        switch (pattern) {
            case 'single':
                this.createEnemyBullet(enemy.x, enemy.y, angle, speed);
                break;
            case 'spread3':
                for (let i = -1; i <= 1; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * 0.2, speed);
                }
                break;
            case 'spread6':
                for (let i = -2; i <= 2; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * 0.15, speed);
                }
                break;
        }
    }

    createEnemyBullet(x, y, angle, speed) {
        const bullet = this.enemyBullets.create(x, y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setData('damage', 1);

        // Destroy after 5 seconds
        this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
    }

    updateBoss() {
        if (!this.boss || !this.boss.active) return;

        const now = this.time.now;
        const lastAttack = this.boss.getData('lastAttack') || 0;
        const pattern = this.boss.getData('attackPattern');
        const hp = this.boss.getData('hp');
        const maxHp = this.boss.getData('maxHp');

        // Update HP bar
        const hpPercent = hp / maxHp;
        this.bossHpBar.setScale(hpPercent, 1);

        // Boss movement - circle around center
        const moveAngle = now * 0.001;
        const targetX = GAME_WIDTH / 2 + Math.cos(moveAngle) * 100;
        const targetY = 150 + Math.sin(moveAngle * 0.5) * 50;

        const dx = targetX - this.boss.x;
        const dy = targetY - this.boss.y;
        this.boss.setVelocity(dx * 2, dy * 2);

        // Attack patterns
        if (now - lastAttack > 2000) {
            this.bossAttack(pattern);
            this.boss.setData('attackPattern', (pattern + 1) % 4);
            this.boss.setData('lastAttack', now);
        }
    }

    bossAttack(pattern) {
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        switch (pattern) {
            case 0: // Ring of bullets
                for (let i = 0; i < 16; i++) {
                    const a = (i / 16) * Math.PI * 2;
                    this.createEnemyBullet(this.boss.x, this.boss.y, a, 180);
                }
                break;
            case 1: // Aimed spread
                for (let i = -3; i <= 3; i++) {
                    this.createEnemyBullet(this.boss.x, this.boss.y, angle + i * 0.15, 220);
                }
                break;
            case 2: // Spiral burst
                for (let i = 0; i < 8; i++) {
                    this.time.delayedCall(i * 100, () => {
                        if (!this.boss || !this.boss.active) return;
                        const a = (i / 8) * Math.PI * 2 + this.time.now * 0.005;
                        for (let j = 0; j < 4; j++) {
                            this.createEnemyBullet(this.boss.x, this.boss.y, a + j * Math.PI / 2, 150);
                        }
                    });
                }
                break;
            case 3: // Dense barrage
                for (let i = 0; i < 24; i++) {
                    const a = angle - 0.5 + Math.random();
                    this.createEnemyBullet(this.boss.x, this.boss.y, a, 150 + Math.random() * 100);
                }
                break;
        }
    }

    shoot() {
        if (this.player.rolling || this.player.reloading) return;

        const weapon = this.player.weapons[this.player.currentWeapon];
        const now = this.time.now;

        if (now - this.player.lastFired < weapon.fireRate) return;
        if (weapon.currentMag <= 0) {
            this.reload();
            return;
        }

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const bulletAngle = angle + spread;

            const texture = weapon.homing ? 'homingBullet' :
                           weapon.pierce ? 'railBeam' : 'playerBullet';

            const bullet = this.playerBullets.create(this.player.x, this.player.y, texture);
            bullet.setVelocity(
                Math.cos(bulletAngle) * weapon.bulletSpeed,
                Math.sin(bulletAngle) * weapon.bulletSpeed
            );
            bullet.setData('damage', weapon.damage);
            bullet.setData('pierce', weapon.pierce || false);
            bullet.setData('homing', weapon.homing || false);
            bullet.setRotation(bulletAngle);

            if (weapon.homing) {
                bullet.setData('target', this.findNearestEnemy(bullet));
            }

            this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
        }

        weapon.currentMag--;
        this.player.lastFired = now;
        this.updateUI();
    }

    findNearestEnemy(bullet) {
        let nearest = null;
        let minDist = Infinity;

        const targets = [...this.enemies.getChildren()];
        if (this.boss && this.boss.active) targets.push(this.boss);

        targets.forEach(enemy => {
            if (!enemy.active) return;
            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    reload() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (weapon.currentMag === weapon.mag) return;
        if (weapon.maxAmmo !== Infinity && weapon.currentAmmo <= 0) return;

        this.player.reloading = true;

        this.time.delayedCall(1000, () => {
            const needed = weapon.mag - weapon.currentMag;
            const available = weapon.maxAmmo === Infinity ? needed : Math.min(needed, weapon.currentAmmo);

            weapon.currentMag += available;
            if (weapon.maxAmmo !== Infinity) weapon.currentAmmo -= available;

            this.player.reloading = false;
            this.updateUI();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        const pierce = bullet.getData('pierce');

        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        // Flash effect
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => enemy.clearTint());

        if (hp <= 0) {
            this.killEnemy(enemy);
        }

        if (!pierce) bullet.destroy();
    }

    killEnemy(enemy) {
        // Drop shells
        const shells = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < shells; i++) {
            const pickup = this.pickups.create(
                enemy.x + Math.random() * 20 - 10,
                enemy.y + Math.random() * 20 - 10,
                'shell'
            );
            pickup.setData('type', 'shell');
            pickup.setData('value', 1);
        }

        // Chance to drop health or ammo
        if (Math.random() < 0.1) {
            const pickup = this.pickups.create(enemy.x, enemy.y, 'heart');
            pickup.setData('type', 'heart');
            pickup.setData('value', 2);
        }

        enemy.destroy();

        // Check if room cleared
        if (this.enemies.countActive() === 0 && !this.boss) {
            this.roomCleared();
        }
    }

    bulletHitPlayer(bullet, player) {
        if (player.invincible || player.rolling) return;

        const damage = bullet.getData('damage') || 1;
        this.damagePlayer(damage);
        bullet.destroy();
    }

    damagePlayer(amount) {
        if (this.player.invincible || this.player.rolling) return;

        // Check armor first
        if (this.player.armor > 0) {
            this.player.armor -= amount;
            if (this.player.armor < 0) {
                this.player.hp += this.player.armor;
                this.player.armor = 0;
            }
        } else {
            this.player.hp -= amount;
        }

        // Invincibility frames
        this.player.invincible = true;
        this.player.setAlpha(0.5);

        this.time.delayedCall(1000, () => {
            this.player.invincible = false;
            this.player.setAlpha(1);
        });

        this.updateUI();

        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');
        const value = pickup.getData('value') || 1;

        switch (type) {
            case 'shell':
                this.shells += value;
                break;
            case 'heart':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + value);
                break;
            case 'ammo':
                const w = this.player.weapons[this.player.currentWeapon];
                if (w.maxAmmo !== Infinity) {
                    w.currentAmmo = Math.min(w.maxAmmo, w.currentAmmo + 10);
                }
                break;
            case 'key':
                this.keys++;
                break;
            case 'blank':
                this.player.blanks++;
                break;
        }

        pickup.destroy();
        this.updateUI();
    }

    useBlank() {
        if (this.player.blanks <= 0) return;

        this.player.blanks--;

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Visual effect
        const effect = this.add.image(this.player.x, this.player.y, 'blankEffect');
        effect.setAlpha(0.8);
        effect.setScale(0.5);

        this.tweens.add({
            targets: effect,
            scale: 3,
            alpha: 0,
            duration: 500,
            onComplete: () => effect.destroy()
        });

        // Stun nearby enemies briefly
        this.enemies.getChildren().forEach(enemy => {
            enemy.setVelocity(0, 0);
        });

        this.updateUI();
    }

    dodgeRoll() {
        if (this.player.rolling) return;

        const vx = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
        const vy = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);

        if (vx === 0 && vy === 0) return;

        const len = Math.sqrt(vx * vx + vy * vy);
        this.player.rollDir = { x: vx / len, y: vy / len };
        this.player.rolling = true;
        this.player.rollTime = 700;

        this.player.setTexture('player_roll');
    }

    interact() {
        // Check for tables to flip
        this.tables.getChildren().forEach(table => {
            if (!table.getData('flipped')) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, table.x, table.y);
                if (dist < 50) {
                    table.setTexture('tableFlipped');
                    table.setData('flipped', true);
                }
            }
        });

        // Check for chests to open
        this.chests.getChildren().forEach(chest => {
            if (!chest.getData('opened')) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
                if (dist < 50) {
                    this.openChest(chest);
                }
            }
        });

        // Check for doors
        if (!this.doorsLocked) {
            this.doors.forEach(door => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
                if (dist < 40) {
                    const dir = door.getData('direction');
                    if (dir === 'up' && this.roomIndex > 0) {
                        this.loadRoom(this.roomIndex - 1);
                    } else if (dir === 'down' && this.roomIndex < this.rooms.length - 1) {
                        this.loadRoom(this.roomIndex + 1);
                    }
                }
            });
        }
    }

    openChest(chest) {
        const tier = chest.getData('tier');
        chest.setData('opened', true);
        chest.setAlpha(0.5);

        // Give weapon based on tier
        const weaponsByTier = {
            brown: [WEAPONS.shotgun],
            blue: [WEAPONS.ak47],
            green: [WEAPONS.demonHead, WEAPONS.railgun]
        };

        const options = weaponsByTier[tier];
        const weapon = { ...options[Math.floor(Math.random() * options.length)] };
        weapon.currentMag = weapon.mag;
        weapon.currentAmmo = weapon.maxAmmo === Infinity ? Infinity : weapon.maxAmmo;

        this.player.weapons.push(weapon);

        // Show pickup text
        const text = this.add.text(chest.x, chest.y - 30, `Got ${weapon.name}!`, {
            fontSize: '14px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
        });

        this.updateUI();
    }

    roomCleared() {
        this.currentRoom.cleared = true;
        this.doorsLocked = false;

        // Update door textures
        this.doors.forEach(door => door.setTexture('doorOpen'));

        // Show cleared text
        const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'ROOM CLEARED!', {
            fontSize: '24px',
            color: '#44ff44'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    defeatBoss() {
        if (this.bossHpBg) this.bossHpBg.destroy();
        if (this.bossHpBar) this.bossHpBar.destroy();
        if (this.bossNameText) this.bossNameText.destroy();

        // Explosion effect
        const explosion = this.add.image(this.boss.x, this.boss.y, 'explosion');
        explosion.setScale(2);
        this.tweens.add({
            targets: explosion,
            scale: 4,
            alpha: 0,
            duration: 1000,
            onComplete: () => explosion.destroy()
        });

        this.boss.destroy();
        this.boss = null;

        // Clear bullets
        this.enemyBullets.clear(true, true);

        this.currentRoom.cleared = true;
        this.doorsLocked = false;
        this.doors.forEach(door => door.setTexture('doorOpen'));

        if (this.floor >= 3) {
            // Victory!
            this.scene.start('VictoryScene');
        } else {
            // Next floor
            this.time.delayedCall(2000, () => {
                this.floor++;
                this.player.blanks = 2; // Refresh blanks
                this.generateFloor();
            });
        }
    }

    createUI() {
        // HP display
        this.hpText = this.add.text(16, GAME_HEIGHT - 40, '', {
            fontSize: '18px',
            color: '#ff4444'
        }).setDepth(100);

        // Weapon display
        this.weaponText = this.add.text(16, GAME_HEIGHT - 20, '', {
            fontSize: '14px',
            color: '#ffffff'
        }).setDepth(100);

        // Shell/Key display
        this.resourceText = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 40, '', {
            fontSize: '14px',
            color: '#ffcc00',
            align: 'right'
        }).setOrigin(1, 0).setDepth(100);

        // Blanks display
        this.blanksText = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 20, '', {
            fontSize: '14px',
            color: '#66aaff',
            align: 'right'
        }).setOrigin(1, 0).setDepth(100);

        // Floor display
        this.floorText = this.add.text(GAME_WIDTH / 2, 16, '', {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5).setDepth(100);

        // Minimap
        this.minimapBg = this.add.rectangle(GAME_WIDTH - 70, 70, 120, 120, 0x000000, 0.5).setDepth(99);
        this.minimapRooms = [];

        this.updateUI();
    }

    updateUI() {
        // HP as hearts
        let hearts = '';
        for (let i = 0; i < Math.floor(this.player.maxHp / 2); i++) {
            if (this.player.hp >= (i + 1) * 2) hearts += '♥';
            else if (this.player.hp >= i * 2 + 1) hearts += '♡';
            else hearts += '♡';
        }
        if (this.player.armor > 0) hearts += ` [${this.player.armor}★]`;
        this.hpText.setText(hearts);

        // Weapon info
        const w = this.player.weapons[this.player.currentWeapon];
        const ammoText = w.maxAmmo === Infinity ? '∞' : w.currentAmmo;
        this.weaponText.setText(`${w.name} ${w.currentMag}/${w.mag} [${ammoText}]`);

        // Resources
        this.resourceText.setText(`$${this.shells}  🔑${this.keys}`);

        // Blanks
        this.blanksText.setText(`Blanks: ${this.player.blanks}`);

        // Floor
        const floorNames = ['Keep of Lead', 'Gungeon Proper', 'The Forge'];
        this.floorText.setText(`Floor ${this.floor}: ${floorNames[this.floor - 1]}`);

        // Update minimap
        this.updateMinimap();
    }

    updateMinimap() {
        this.minimapRooms.forEach(r => r.destroy());
        this.minimapRooms = [];

        const startX = GAME_WIDTH - 120;
        const startY = 20;
        const roomSize = 15;

        this.rooms.forEach((room, i) => {
            const x = startX + (i % 4) * (roomSize + 4);
            const y = startY + Math.floor(i / 4) * (roomSize + 4);

            let color = 0x444444;
            if (room.cleared) color = 0x448844;
            if (i === this.roomIndex) color = 0x4444ff;
            if (room.type === 'boss') color = room.cleared ? 0x448844 : 0xff4444;
            if (room.type === 'shop') color = 0xffcc00;
            if (room.type === 'treasure') color = 0x8b4513;

            const rect = this.add.rectangle(x, y, roomSize, roomSize, color).setDepth(100);
            this.minimapRooms.push(rect);
        });
    }

    gameOver() {
        this.scene.start('GameOverScene', { floor: this.floor, shells: this.shells });
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Player movement
        if (this.player.rolling) {
            this.player.rollTime -= delta;
            const rollSpeed = 350;
            this.player.setVelocity(
                this.player.rollDir.x * rollSpeed,
                this.player.rollDir.y * rollSpeed
            );

            if (this.player.rollTime <= 0) {
                this.player.rolling = false;
                this.player.setTexture('player');
            }
        } else {
            let vx = 0, vy = 0;
            if (this.keys.left.isDown) vx = -1;
            if (this.keys.right.isDown) vx = 1;
            if (this.keys.up.isDown) vy = -1;
            if (this.keys.down.isDown) vy = 1;

            if (vx !== 0 && vy !== 0) {
                vx *= 0.707;
                vy *= 0.707;
            }

            this.player.setVelocity(vx * this.player.speed, vy * this.player.speed);
        }

        // Dodge roll
        if (Phaser.Input.Keyboard.JustDown(this.keys.roll)) {
            this.dodgeRoll();
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) {
            this.reload();
        }

        // Use blank
        if (Phaser.Input.Keyboard.JustDown(this.keys.blank)) {
            this.useBlank();
        }

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
            this.interact();
        }

        // Weapon switching
        if (Phaser.Input.Keyboard.JustDown(this.keys.weapon1) && this.player.weapons.length > 0) {
            this.player.currentWeapon = 0;
            this.updateUI();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.weapon2) && this.player.weapons.length > 1) {
            this.player.currentWeapon = 1;
            this.updateUI();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.weapon3) && this.player.weapons.length > 2) {
            this.player.currentWeapon = 2;
            this.updateUI();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.weapon4) && this.player.weapons.length > 3) {
            this.player.currentWeapon = 3;
            this.updateUI();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.weapon5) && this.player.weapons.length > 4) {
            this.player.currentWeapon = 4;
            this.updateUI();
        }

        // Continuous fire if holding mouse
        if (this.input.activePointer.isDown) {
            this.shoot();
        }

        // Update homing bullets
        this.playerBullets.getChildren().forEach(bullet => {
            if (bullet.getData('homing')) {
                let target = bullet.getData('target');
                if (!target || !target.active) {
                    target = this.findNearestEnemy(bullet);
                    bullet.setData('target', target);
                }

                if (target && target.active) {
                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, target.x, target.y);
                    const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                    const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.1);
                    const speed = 300;
                    bullet.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
                }
            }
        });

        // Check bullet collision with boss
        if (this.boss && this.boss.active) {
            this.playerBullets.getChildren().forEach(bullet => {
                if (!bullet.active) return;

                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y);
                if (dist < 30) {
                    const damage = bullet.getData('damage');
                    let hp = this.boss.getData('hp') - damage;
                    this.boss.setData('hp', hp);

                    this.boss.setTint(0xffffff);
                    this.time.delayedCall(50, () => { if (this.boss) this.boss.clearTint(); });

                    if (!bullet.getData('pierce')) bullet.destroy();

                    if (hp <= 0) {
                        this.defeatBoss();
                    }
                }
            });

            // Boss contact damage
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist < 30 && !this.player.invincible && !this.player.rolling) {
                this.damagePlayer(1);
            }
        }

        // Destructible obstacles
        this.playerBullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;

            this.obstacles.getChildren().forEach(obstacle => {
                if (!obstacle.active) return;

                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, obstacle.x, obstacle.y);
                if (dist < 20) {
                    if (obstacle.getData('destructible') || obstacle.getData('explosive')) {
                        let hp = obstacle.getData('hp') - bullet.getData('damage');
                        obstacle.setData('hp', hp);

                        if (hp <= 0) {
                            if (obstacle.getData('explosive')) {
                                // Explode!
                                const exp = this.add.image(obstacle.x, obstacle.y, 'explosion');
                                this.tweens.add({
                                    targets: exp,
                                    scale: 2,
                                    alpha: 0,
                                    duration: 500,
                                    onComplete: () => exp.destroy()
                                });

                                // Damage nearby enemies
                                this.enemies.getChildren().forEach(enemy => {
                                    const d = Phaser.Math.Distance.Between(obstacle.x, obstacle.y, enemy.x, enemy.y);
                                    if (d < 60) {
                                        let ehp = enemy.getData('hp') - 20;
                                        enemy.setData('hp', ehp);
                                        if (ehp <= 0) this.killEnemy(enemy);
                                    }
                                });
                            }
                            obstacle.destroy();
                        }

                        if (!bullet.getData('pierce')) bullet.destroy();
                    }
                }
            });
        });
    }
}

// ========== GAME OVER SCENE ==========
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.finalFloor = data.floor || 1;
        this.finalShells = data.shells || 0;
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x110000);

        this.add.text(GAME_WIDTH / 2, 150, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ff4444',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 250, `Reached Floor ${this.finalFloor}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 290, `Shells Collected: ${this.finalShells}`, {
            fontSize: '18px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(GAME_WIDTH / 2, 400, '[ TRY AGAIN ]', {
            fontSize: '28px',
            color: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        retryBtn.on('pointerover', () => retryBtn.setColor('#88ff88'));
        retryBtn.on('pointerout', () => retryBtn.setColor('#44ff44'));
        retryBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(GAME_WIDTH / 2, 460, '[ MAIN MENU ]', {
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setColor('#aaaaaa'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== VICTORY SCENE ==========
class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x001122);

        this.add.text(GAME_WIDTH / 2, 150, 'VICTORY!', {
            fontSize: '56px',
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 240, 'You have conquered the Gungeon!', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 300, 'The High Dragun has been slain\nand the past is yours to kill.', {
            fontSize: '18px',
            color: '#888899',
            align: 'center'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(GAME_WIDTH / 2, 450, '[ RETURN TO MENU ]', {
            fontSize: '28px',
            color: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setColor('#88ff88'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#44ff44'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== GAME CONFIG ==========
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#111122',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
