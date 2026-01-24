// Star of Providence Clone
// Built with Phaser 3

const CONFIG = {
    width: 800,
    height: 600,
    roomWidth: 640,
    roomHeight: 480,

    // Player stats
    playerSpeed: 250,
    focusSpeed: 100,
    dashDistance: 120,
    dashCooldown: 500,
    dashIFrames: 150,
    maxHP: 4,
    maxBombs: 6,
    startBombs: 2,

    // Weapons
    weapons: {
        peashooter: { name: 'Peashooter', damage: 5, fireRate: 100, velocity: 600, ammo: Infinity, color: 0x44ff44 },
        vulcan: { name: 'Vulcan', damage: 15, fireRate: 80, velocity: 500, ammo: 500, color: 0xffff44 },
        laser: { name: 'Laser', damage: 115, fireRate: 670, velocity: 1500, ammo: 100, color: 0xff4444, piercing: true },
        fireball: { name: 'Fireball', damage: 80, fireRate: 500, velocity: 300, ammo: 90, color: 0xff6600, aoe: true },
        revolver: { name: 'Revolver', damage: 28, fireRate: 130, velocity: 450, ammo: 250, color: 0xaaaaaa },
        sword: { name: 'Sword', damage: 70, fireRate: 530, velocity: 0, ammo: 125, color: 0x8888ff, melee: true }
    },

    // Keywords
    keywords: ['Homing', 'Triple', 'High-Caliber']
};

// Boot Scene - Load textures
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player ship (triangle pointing up)
        const shipGfx = this.make.graphics({ add: false });
        shipGfx.fillStyle(0xffffff);
        shipGfx.fillTriangle(16, 0, 0, 32, 32, 32);
        shipGfx.fillStyle(0x44aaff);
        shipGfx.fillTriangle(16, 6, 6, 28, 26, 28);
        shipGfx.fillStyle(0x2266aa);
        shipGfx.fillTriangle(16, 12, 10, 24, 22, 24);
        shipGfx.generateTexture('ship', 32, 32);

        // Bullet
        const bulletGfx = this.make.graphics({ add: false });
        bulletGfx.fillStyle(0x44ff44);
        bulletGfx.fillCircle(4, 4, 4);
        bulletGfx.fillStyle(0x88ff88);
        bulletGfx.fillCircle(3, 3, 2);
        bulletGfx.generateTexture('bullet', 8, 8);

        // Enemy bullet
        const ebulletGfx = this.make.graphics({ add: false });
        ebulletGfx.fillStyle(0xff4444);
        ebulletGfx.fillCircle(5, 5, 5);
        ebulletGfx.fillStyle(0xff8888);
        ebulletGfx.fillCircle(4, 4, 2);
        ebulletGfx.generateTexture('enemyBullet', 10, 10);

        // Ghost enemy
        const ghostGfx = this.make.graphics({ add: false });
        ghostGfx.fillStyle(0x6666aa);
        ghostGfx.fillCircle(12, 10, 10);
        ghostGfx.fillStyle(0x8888cc);
        ghostGfx.fillCircle(10, 8, 4);
        ghostGfx.fillStyle(0x4444ff);
        ghostGfx.fillCircle(8, 8, 2);
        ghostGfx.fillCircle(16, 8, 2);
        ghostGfx.fillRect(4, 16, 4, 8);
        ghostGfx.fillRect(16, 16, 4, 8);
        ghostGfx.generateTexture('ghost', 24, 24);

        // Drone enemy
        const droneGfx = this.make.graphics({ add: false });
        droneGfx.fillStyle(0x888888);
        droneGfx.fillRect(4, 8, 16, 8);
        droneGfx.fillStyle(0xaaaaaa);
        droneGfx.fillRect(0, 4, 8, 6);
        droneGfx.fillRect(16, 4, 8, 6);
        droneGfx.fillStyle(0xff4444);
        droneGfx.fillCircle(12, 12, 3);
        droneGfx.generateTexture('drone', 24, 24);

        // Turret enemy
        const turretGfx = this.make.graphics({ add: false });
        turretGfx.fillStyle(0x666666);
        turretGfx.fillRect(4, 16, 16, 8);
        turretGfx.fillStyle(0x888888);
        turretGfx.fillRect(8, 4, 8, 16);
        turretGfx.fillStyle(0xff0000);
        turretGfx.fillCircle(12, 8, 4);
        turretGfx.generateTexture('turret', 24, 24);

        // Seeker enemy
        const seekerGfx = this.make.graphics({ add: false });
        seekerGfx.fillStyle(0xaa6600);
        seekerGfx.fillCircle(12, 12, 10);
        seekerGfx.fillStyle(0xffaa00);
        seekerGfx.fillCircle(12, 12, 6);
        seekerGfx.fillStyle(0x000000);
        seekerGfx.fillCircle(12, 12, 3);
        seekerGfx.generateTexture('seeker', 24, 24);

        // Swarmer enemy (small)
        const swarmerGfx = this.make.graphics({ add: false });
        swarmerGfx.fillStyle(0x44aa44);
        swarmerGfx.fillCircle(6, 6, 6);
        swarmerGfx.fillStyle(0x66ff66);
        swarmerGfx.fillCircle(5, 4, 2);
        swarmerGfx.generateTexture('swarmer', 12, 12);

        // Boss (large)
        const bossGfx = this.make.graphics({ add: false });
        bossGfx.fillStyle(0x660066);
        bossGfx.fillRect(8, 8, 48, 48);
        bossGfx.fillStyle(0x880088);
        bossGfx.fillRect(0, 20, 64, 24);
        bossGfx.fillStyle(0xff00ff);
        bossGfx.fillCircle(20, 32, 8);
        bossGfx.fillCircle(44, 32, 8);
        bossGfx.fillStyle(0xffffff);
        bossGfx.fillCircle(20, 32, 4);
        bossGfx.fillCircle(44, 32, 4);
        bossGfx.generateTexture('boss', 64, 64);

        // Wall tile
        const wallGfx = this.make.graphics({ add: false });
        wallGfx.fillStyle(0x1a2a1a);
        wallGfx.fillRect(0, 0, 32, 32);
        wallGfx.fillStyle(0x2a4a2a);
        wallGfx.fillRect(2, 2, 28, 28);
        wallGfx.lineStyle(1, 0x3a5a3a);
        wallGfx.strokeRect(4, 4, 24, 24);
        wallGfx.generateTexture('wall', 32, 32);

        // Floor tile
        const floorGfx = this.make.graphics({ add: false });
        floorGfx.fillStyle(0x0a0a14);
        floorGfx.fillRect(0, 0, 32, 32);
        floorGfx.fillStyle(0x101020);
        floorGfx.fillRect(0, 0, 16, 16);
        floorGfx.fillRect(16, 16, 16, 16);
        floorGfx.generateTexture('floor', 32, 32);

        // Door
        const doorGfx = this.make.graphics({ add: false });
        doorGfx.fillStyle(0x2a3a2a);
        doorGfx.fillRect(0, 0, 64, 32);
        doorGfx.fillStyle(0x1a5a1a);
        doorGfx.fillRect(8, 4, 48, 24);
        doorGfx.fillStyle(0x44ff44);
        doorGfx.fillRect(28, 8, 8, 16);
        doorGfx.generateTexture('door', 64, 32);

        // Heart
        const heartGfx = this.make.graphics({ add: false });
        heartGfx.fillStyle(0x44ff44);
        heartGfx.fillCircle(5, 6, 5);
        heartGfx.fillCircle(11, 6, 5);
        heartGfx.fillTriangle(8, 16, 0, 8, 16, 8);
        heartGfx.generateTexture('heart', 16, 16);

        // Bomb icon
        const bombGfx = this.make.graphics({ add: false });
        bombGfx.fillStyle(0x333333);
        bombGfx.fillCircle(8, 10, 7);
        bombGfx.fillStyle(0x666666);
        bombGfx.fillRect(6, 0, 4, 5);
        bombGfx.fillStyle(0xff6600);
        bombGfx.fillCircle(8, 2, 2);
        bombGfx.generateTexture('bombIcon', 16, 16);

        // Explosion
        const explodeGfx = this.make.graphics({ add: false });
        explodeGfx.fillStyle(0xffaa00, 0.8);
        explodeGfx.fillCircle(32, 32, 32);
        explodeGfx.fillStyle(0xffff00, 0.6);
        explodeGfx.fillCircle(32, 32, 20);
        explodeGfx.fillStyle(0xffffff, 0.4);
        explodeGfx.fillCircle(32, 32, 10);
        explodeGfx.generateTexture('explosion', 64, 64);

        // Pickup (debris/currency)
        const debrisGfx = this.make.graphics({ add: false });
        debrisGfx.fillStyle(0xffaa00);
        debrisGfx.fillRect(2, 2, 8, 8);
        debrisGfx.fillStyle(0xffdd44);
        debrisGfx.fillRect(3, 3, 4, 4);
        debrisGfx.generateTexture('debris', 12, 12);

        // Health pickup
        const hpPickupGfx = this.make.graphics({ add: false });
        hpPickupGfx.fillStyle(0xff4444);
        hpPickupGfx.fillCircle(8, 8, 7);
        hpPickupGfx.fillStyle(0xffffff);
        hpPickupGfx.fillRect(5, 7, 6, 2);
        hpPickupGfx.fillRect(7, 5, 2, 6);
        hpPickupGfx.generateTexture('healthPickup', 16, 16);

        // Weapon pickup
        const weaponPickupGfx = this.make.graphics({ add: false });
        weaponPickupGfx.fillStyle(0x4444ff);
        weaponPickupGfx.fillRect(0, 0, 24, 24);
        weaponPickupGfx.fillStyle(0x8888ff);
        weaponPickupGfx.fillRect(4, 4, 16, 16);
        weaponPickupGfx.fillStyle(0xffffff);
        weaponPickupGfx.fillRect(8, 10, 8, 4);
        weaponPickupGfx.generateTexture('weaponPickup', 24, 24);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0x0a0a14);

        // Title
        this.add.text(width/2, 100, 'STAR OF PROVIDENCE', {
            font: 'bold 32px monospace',
            fill: '#44ff44',
            stroke: '#1a3a1a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 140, 'CLONE', {
            font: '18px monospace',
            fill: '#22aa22'
        }).setOrigin(0.5);

        // Instructions box
        const instrBox = this.add.rectangle(width/2, 300, 500, 200, 0x1a1a2a, 0.9);
        instrBox.setStrokeStyle(2, 0x44ff44);

        this.add.text(width/2, 220, 'CONTROLS', {
            font: 'bold 16px monospace',
            fill: '#44ff44'
        }).setOrigin(0.5);

        const controls = [
            'WASD / Arrow Keys - Move',
            'Mouse / Space - Fire',
            'Shift / Right Click - Focus (slow)',
            'Z / Q - Dash (i-frames)',
            'X - Bomb (clears bullets)',
            'Tab - Map overlay',
            'Q - Debug overlay'
        ];

        controls.forEach((text, i) => {
            this.add.text(width/2, 250 + i * 20, text, {
                font: '12px monospace',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Start button
        const startBtn = this.add.rectangle(width/2, 450, 200, 50, 0x1a4a1a);
        startBtn.setStrokeStyle(2, 0x44ff44);
        startBtn.setInteractive({ useHandCursor: true });

        const startText = this.add.text(width/2, 450, 'START RUN', {
            font: 'bold 18px monospace',
            fill: '#44ff44'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setFillStyle(0x2a6a2a));
        startBtn.on('pointerout', () => startBtn.setFillStyle(0x1a4a1a));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Keyboard start
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.initGameState();
        this.generateFloor();
        this.createPlayer();
        this.createUI();
        this.setupInput();

        // Enter first room
        this.enterRoom(this.currentRoom);
    }

    initGameState() {
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.pickups = [];

        this.currentFloor = 1;
        this.currentRoom = null;
        this.rooms = [];
        this.floorMap = [];
        this.visitedRooms = new Set();
        this.clearedRooms = new Set();

        // Player state
        this.hp = CONFIG.maxHP;
        this.bombs = CONFIG.startBombs;
        this.debris = 0;
        this.multiplier = 1.0;
        this.multiplierDecay = 0;

        // Current weapon
        this.weapon = { ...CONFIG.weapons.peashooter, keyword: null };
        this.ammo = this.weapon.ammo;

        // Combat state
        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.focusing = false;

        this.debugMode = false;
        this.floatingTexts = [];
        this.bossActive = false;
        this.bossDefeated = false;
    }

    generateFloor() {
        // Generate floor layout (3x3 to 5x5 grid)
        const size = 3 + this.currentFloor;
        this.floorMap = [];

        for (let y = 0; y < size; y++) {
            this.floorMap[y] = [];
            for (let x = 0; x < size; x++) {
                this.floorMap[y][x] = null;
            }
        }

        // Place rooms using random walk
        const centerX = Math.floor(size / 2);
        const centerY = Math.floor(size / 2);

        // Start room (always center)
        this.floorMap[centerY][centerX] = { type: 'start', x: centerX, y: centerY, enemies: [], cleared: true };
        this.rooms.push(this.floorMap[centerY][centerX]);
        this.currentRoom = this.floorMap[centerY][centerX];

        // Generate connected rooms
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let roomCount = 5 + this.currentFloor * 2;

        while (roomCount > 0) {
            // Pick random existing room
            const existingRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];

            // Try random direction
            const dir = directions[Math.floor(Math.random() * 4)];
            const newX = existingRoom.x + dir[0];
            const newY = existingRoom.y + dir[1];

            if (newX >= 0 && newX < size && newY >= 0 && newY < size && !this.floorMap[newY][newX]) {
                const roomTypes = ['normal', 'normal', 'normal', 'treasure', 'shop'];
                const type = roomCount === 1 ? 'boss' : roomTypes[Math.floor(Math.random() * roomTypes.length)];

                this.floorMap[newY][newX] = { type, x: newX, y: newY, enemies: [], cleared: false };
                this.rooms.push(this.floorMap[newY][newX]);
                roomCount--;
            }
        }
    }

    createPlayer() {
        const { width, height } = this.cameras.main;

        this.player = this.add.sprite(width / 2, height - 100, 'ship');
        this.player.setDepth(100);

        this.player.vx = 0;
        this.player.vy = 0;
    }

    enterRoom(room) {
        this.currentRoom = room;
        this.visitedRooms.add(`${room.x},${room.y}`);

        // Clear existing entities
        this.enemies.forEach(e => e.destroy());
        this.enemies = [];
        this.enemyBullets.forEach(b => b.destroy());
        this.enemyBullets = [];
        this.pickups.forEach(p => p.destroy());
        this.pickups = [];

        // Render room
        this.renderRoom();

        // Spawn enemies if not cleared
        if (!room.cleared && room.type !== 'start') {
            this.spawnRoomEnemies(room);
        }

        // Reset player position
        const { width, height } = this.cameras.main;
        this.player.x = width / 2;
        this.player.y = height - 100;

        // Update minimap
        this.updateMinimap();
    }

    renderRoom() {
        // Clear existing tiles
        if (this.roomTiles) {
            this.roomTiles.forEach(t => t.destroy());
        }
        this.roomTiles = [];

        const { width, height } = this.cameras.main;
        const offsetX = (width - CONFIG.roomWidth) / 2;
        const offsetY = 60;

        // Floor tiles
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const tile = this.add.sprite(offsetX + x * 32, offsetY + y * 32, 'floor');
                tile.setOrigin(0);
                tile.setDepth(0);
                this.roomTiles.push(tile);
            }
        }

        // Wall border
        for (let x = 0; x < 20; x++) {
            const topWall = this.add.sprite(offsetX + x * 32, offsetY, 'wall');
            topWall.setOrigin(0);
            topWall.setDepth(1);
            this.roomTiles.push(topWall);

            const bottomWall = this.add.sprite(offsetX + x * 32, offsetY + 14 * 32, 'wall');
            bottomWall.setOrigin(0);
            bottomWall.setDepth(1);
            this.roomTiles.push(bottomWall);
        }

        for (let y = 0; y < 15; y++) {
            const leftWall = this.add.sprite(offsetX, offsetY + y * 32, 'wall');
            leftWall.setOrigin(0);
            leftWall.setDepth(1);
            this.roomTiles.push(leftWall);

            const rightWall = this.add.sprite(offsetX + 19 * 32, offsetY + y * 32, 'wall');
            rightWall.setOrigin(0);
            rightWall.setDepth(1);
            this.roomTiles.push(rightWall);
        }

        // Doors based on adjacent rooms
        const dirs = [[0, -1, 'top'], [0, 1, 'bottom'], [-1, 0, 'left'], [1, 0, 'right']];
        this.doors = [];

        dirs.forEach(([dx, dy, pos]) => {
            const adjX = this.currentRoom.x + dx;
            const adjY = this.currentRoom.y + dy;

            if (this.floorMap[adjY] && this.floorMap[adjY][adjX]) {
                let doorX, doorY, rotation = 0;

                switch (pos) {
                    case 'top':
                        doorX = width / 2;
                        doorY = offsetY + 16;
                        break;
                    case 'bottom':
                        doorX = width / 2;
                        doorY = offsetY + 14 * 32 + 16;
                        break;
                    case 'left':
                        doorX = offsetX + 16;
                        doorY = offsetY + 7 * 32 + 16;
                        rotation = Math.PI / 2;
                        break;
                    case 'right':
                        doorX = offsetX + 19 * 32 + 16;
                        doorY = offsetY + 7 * 32 + 16;
                        rotation = Math.PI / 2;
                        break;
                }

                const door = this.add.sprite(doorX, doorY, 'door');
                door.setRotation(rotation);
                door.setDepth(2);
                door.targetRoom = this.floorMap[adjY][adjX];
                door.direction = pos;
                this.doors.push(door);
                this.roomTiles.push(door);
            }
        });

        // Room type indicator
        let typeColor = 0x44ff44;
        let typeText = '';

        switch (this.currentRoom.type) {
            case 'start': typeText = 'START'; break;
            case 'boss': typeText = 'BOSS'; typeColor = 0xff4444; break;
            case 'treasure': typeText = 'TREASURE'; typeColor = 0xffaa00; break;
            case 'shop': typeText = 'SHOP'; typeColor = 0x4444ff; break;
            default: typeText = '';
        }

        if (typeText) {
            this.roomTypeText = this.add.text(width / 2, offsetY + 50, typeText, {
                font: 'bold 16px monospace',
                fill: '#' + typeColor.toString(16).padStart(6, '0')
            }).setOrigin(0.5).setDepth(50);
            this.roomTiles.push(this.roomTypeText);
        }
    }

    spawnRoomEnemies(room) {
        const { width, height } = this.cameras.main;
        const offsetX = (width - CONFIG.roomWidth) / 2;
        const offsetY = 60;

        if (room.type === 'boss') {
            // Spawn boss
            this.spawnBoss(offsetX + CONFIG.roomWidth / 2, offsetY + 150);
            return;
        }

        if (room.type === 'treasure') {
            // Spawn pickups
            for (let i = 0; i < 3; i++) {
                this.spawnPickup(
                    offsetX + 200 + i * 120,
                    offsetY + 200,
                    Math.random() < 0.3 ? 'weaponPickup' : 'debris'
                );
            }
            room.cleared = true;
            this.clearedRooms.add(`${room.x},${room.y}`);
            return;
        }

        if (room.type === 'shop') {
            // Shop items (simplified)
            room.cleared = true;
            this.clearedRooms.add(`${room.x},${room.y}`);
            return;
        }

        // Normal room - spawn enemies
        const enemyCount = 3 + this.currentFloor * 2 + Math.floor(Math.random() * 3);
        const enemyTypes = ['ghost', 'drone', 'turret', 'seeker', 'swarmer'];

        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const x = offsetX + 100 + Math.random() * (CONFIG.roomWidth - 200);
            const y = offsetY + 100 + Math.random() * 200;

            this.spawnEnemy(x, y, type);
        }
    }

    spawnEnemy(x, y, type) {
        const enemyData = {
            ghost: { hp: 50, speed: 80, damage: 1, texture: 'ghost', behavior: 'chase', fireRate: 2000 },
            drone: { hp: 70, speed: 120, damage: 1, texture: 'drone', behavior: 'dash', fireRate: 1500 },
            turret: { hp: 90, speed: 0, damage: 1, texture: 'turret', behavior: 'stationary', fireRate: 800 },
            seeker: { hp: 120, speed: 60, damage: 1, texture: 'seeker', behavior: 'wander', fireRate: 1200 },
            swarmer: { hp: 12, speed: 200, damage: 1, texture: 'swarmer', behavior: 'chase', fireRate: 0 }
        };

        const data = enemyData[type];
        const enemy = this.add.sprite(x, y, data.texture);
        enemy.setDepth(50);

        enemy.type = type;
        enemy.hp = data.hp;
        enemy.maxHp = data.hp;
        enemy.speed = data.speed;
        enemy.damage = data.damage;
        enemy.behavior = data.behavior;
        enemy.fireRate = data.fireRate;
        enemy.fireCooldown = Math.random() * data.fireRate;
        enemy.vx = (Math.random() - 0.5) * enemy.speed;
        enemy.vy = (Math.random() - 0.5) * enemy.speed;
        enemy.targetX = x;
        enemy.targetY = y;

        this.enemies.push(enemy);
    }

    spawnBoss(x, y) {
        const bossData = {
            1: { name: 'Chamberlord', hp: 1500, texture: 'boss', color: 0x660066 },
            2: { name: 'Wraithking', hp: 2000, texture: 'boss', color: 0x006666 },
            3: { name: 'Core Guardian', hp: 2500, texture: 'boss', color: 0x666600 }
        };

        const data = bossData[this.currentFloor];
        const boss = this.add.sprite(x, y, data.texture);
        boss.setDepth(50);
        boss.setTint(data.color);
        boss.setScale(1.5);

        boss.isBoss = true;
        boss.name = data.name;
        boss.hp = data.hp;
        boss.maxHp = data.hp;
        boss.phase = 1;
        boss.attackTimer = 0;
        boss.patternTimer = 0;
        boss.pattern = 0;

        this.boss = boss;
        this.bossActive = true;
        this.enemies.push(boss);

        // Show boss name
        this.showFloatingText(x, y - 60, data.name, '#ff44ff');
    }

    spawnPickup(x, y, type) {
        const pickup = this.add.sprite(x, y, type);
        pickup.setDepth(40);
        pickup.type = type;

        // Bobbing animation
        this.tweens.add({
            targets: pickup,
            y: y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.pickups.push(pickup);
    }

    createUI() {
        const { width, height } = this.cameras.main;

        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setDepth(1000);

        // Top bar background
        const topBar = this.add.rectangle(width/2, 30, width, 60, 0x0a0a14, 0.95);
        topBar.setStrokeStyle(2, 0x1a3a1a);
        this.uiContainer.add(topBar);

        // Weapon box (top left)
        const weaponBox = this.add.rectangle(80, 30, 120, 50, 0x1a2a1a);
        weaponBox.setStrokeStyle(2, 0x44ff44);
        this.uiContainer.add(weaponBox);

        this.weaponText = this.add.text(80, 20, 'PEASHOOTER', {
            font: '10px monospace',
            fill: '#44ff44'
        }).setOrigin(0.5);
        this.uiContainer.add(this.weaponText);

        this.ammoText = this.add.text(80, 38, 'INF', {
            font: 'bold 14px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.uiContainer.add(this.ammoText);

        // Hearts (center-left)
        this.hearts = [];
        for (let i = 0; i < CONFIG.maxHP; i++) {
            const heart = this.add.sprite(200 + i * 24, 30, 'heart');
            this.hearts.push(heart);
            this.uiContainer.add(heart);
        }

        // Bombs (after hearts)
        this.bombIcons = [];
        for (let i = 0; i < CONFIG.maxBombs; i++) {
            const bomb = this.add.sprite(320 + i * 20, 30, 'bombIcon');
            bomb.setAlpha(i < this.bombs ? 1 : 0.3);
            this.bombIcons.push(bomb);
            this.uiContainer.add(bomb);
        }

        // Multiplier and debris (top right)
        const statsBox = this.add.rectangle(width - 100, 30, 160, 50, 0x1a2a1a);
        statsBox.setStrokeStyle(2, 0x44ff44);
        this.uiContainer.add(statsBox);

        this.multiplierText = this.add.text(width - 150, 20, 'x1.0', {
            font: 'bold 14px monospace',
            fill: '#ffaa00'
        }).setOrigin(0.5);
        this.uiContainer.add(this.multiplierText);

        this.debrisText = this.add.text(width - 70, 20, '0G', {
            font: 'bold 14px monospace',
            fill: '#ffff00'
        }).setOrigin(0.5);
        this.uiContainer.add(this.debrisText);

        this.floorText = this.add.text(width - 100, 42, 'FLOOR 1', {
            font: '10px monospace',
            fill: '#888888'
        }).setOrigin(0.5);
        this.uiContainer.add(this.floorText);

        // Minimap (top right corner)
        this.minimapGfx = this.add.graphics();
        this.minimapGfx.setDepth(1001);

        // Boss HP bar (hidden initially)
        this.bossHpBar = this.add.rectangle(width/2, height - 30, 400, 20, 0x440044);
        this.bossHpBar.setStrokeStyle(2, 0xff00ff);
        this.bossHpBar.setVisible(false);
        this.uiContainer.add(this.bossHpBar);

        this.bossHpFill = this.add.rectangle(width/2 - 196, height - 30, 392, 14, 0xff00ff);
        this.bossHpFill.setOrigin(0, 0.5);
        this.bossHpFill.setVisible(false);
        this.uiContainer.add(this.bossHpFill);

        this.bossNameText = this.add.text(width/2, height - 50, '', {
            font: 'bold 14px monospace',
            fill: '#ff00ff'
        }).setOrigin(0.5);
        this.bossNameText.setVisible(false);
        this.uiContainer.add(this.bossNameText);

        // Debug overlay
        this.debugOverlay = this.add.container(10, 70);
        this.debugOverlay.setDepth(2000);
        this.debugOverlay.setVisible(false);

        const debugBg = this.add.rectangle(0, 0, 200, 150, 0x000000, 0.8);
        debugBg.setOrigin(0);
        debugBg.setStrokeStyle(1, 0x44ff44);
        this.debugOverlay.add(debugBg);

        this.debugText = this.add.text(5, 5, '', {
            font: '10px monospace',
            fill: '#44ff44'
        });
        this.debugOverlay.add(this.debugText);
    }

    updateMinimap() {
        const { width } = this.cameras.main;
        this.minimapGfx.clear();

        const mapX = width - 60;
        const mapY = 80;
        const cellSize = 12;

        // Background
        this.minimapGfx.fillStyle(0x1a1a2a, 0.9);
        this.minimapGfx.fillRect(mapX - 40, mapY - 10, 80, 80);
        this.minimapGfx.lineStyle(1, 0x44ff44);
        this.minimapGfx.strokeRect(mapX - 40, mapY - 10, 80, 80);

        // Draw rooms
        this.rooms.forEach(room => {
            const rx = mapX + (room.x - this.currentRoom.x) * cellSize;
            const ry = mapY + (room.y - this.currentRoom.y) * cellSize;

            let color = 0x333333;
            if (this.visitedRooms.has(`${room.x},${room.y}`)) {
                color = this.clearedRooms.has(`${room.x},${room.y}`) ? 0x226622 : 0x444444;
            }
            if (room === this.currentRoom) color = 0x44ff44;
            if (room.type === 'boss') color = 0xff4444;

            this.minimapGfx.fillStyle(color);
            this.minimapGfx.fillRect(rx - cellSize/2, ry - cellSize/2, cellSize - 2, cellSize - 2);
        });
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });

        this.shiftKey = this.input.keyboard.addKey('SHIFT');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.zKey = this.input.keyboard.addKey('Z');
        this.qKey = this.input.keyboard.addKey('Q');
        this.xKey = this.input.keyboard.addKey('X');
        this.tabKey = this.input.keyboard.addKey('TAB');

        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.debugOverlay.setVisible(this.debugMode);
        });

        this.input.keyboard.on('keydown-X', () => this.useBomb());
        this.input.keyboard.on('keydown-Z', () => this.dash());
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleShooting(delta);
        this.updateBullets(delta);
        this.updateEnemies(delta);
        this.updatePickups();
        this.checkDoorTransitions();
        this.updateUI();
        this.updateFloatingTexts(delta);

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= delta;
        if (this.dashCooldown > 0) this.dashCooldown -= delta;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Multiplier decay
        this.multiplierDecay += delta;
        if (this.multiplierDecay > 3000 && this.multiplier > 1) {
            this.multiplier = Math.max(1, this.multiplier - 0.1);
            this.multiplierDecay = 0;
        }

        // Debug update
        if (this.debugMode) {
            this.updateDebug();
        }

        // Check room cleared
        if (this.enemies.length === 0 && !this.currentRoom.cleared && this.currentRoom.type !== 'start') {
            this.roomCleared();
        }
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;

        if (this.wasd.left.isDown || this.cursors.left.isDown) dx = -1;
        else if (this.wasd.right.isDown || this.cursors.right.isDown) dx = 1;
        if (this.wasd.up.isDown || this.cursors.up.isDown) dy = -1;
        else if (this.wasd.down.isDown || this.cursors.down.isDown) dy = 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Focus mode (slow)
        this.focusing = this.shiftKey.isDown || this.input.activePointer.rightButtonDown();
        const speed = this.focusing ? CONFIG.focusSpeed : CONFIG.playerSpeed;

        this.player.x += dx * speed * delta / 1000;
        this.player.y += dy * speed * delta / 1000;

        // Bounds
        const { width, height } = this.cameras.main;
        const offsetX = (width - CONFIG.roomWidth) / 2;
        const offsetY = 60;

        this.player.x = Phaser.Math.Clamp(this.player.x, offsetX + 40, offsetX + CONFIG.roomWidth - 40);
        this.player.y = Phaser.Math.Clamp(this.player.y, offsetY + 60, offsetY + CONFIG.roomHeight - 40);

        // Visual feedback for focus
        if (this.focusing) {
            this.player.setTint(0x88aaff);
        } else {
            this.player.clearTint();
        }
    }

    handleShooting(delta) {
        if (this.fireCooldown > 0) return;

        const firing = this.spaceKey.isDown || this.input.activePointer.leftButtonDown();

        if (firing && (this.ammo > 0 || this.ammo === Infinity)) {
            this.fireBullet();
            this.fireCooldown = this.weapon.fireRate;
            if (this.ammo !== Infinity) this.ammo--;
        }
    }

    fireBullet() {
        const bullet = this.add.circle(this.player.x, this.player.y - 20, 4, this.weapon.color);
        bullet.setDepth(80);
        bullet.vx = 0;
        bullet.vy = -this.weapon.velocity;
        bullet.damage = this.weapon.damage;
        bullet.piercing = this.weapon.piercing || false;

        // Triple keyword
        if (this.weapon.keyword === 'Triple') {
            bullet.damage *= 0.5;

            const bullet2 = this.add.circle(this.player.x - 10, this.player.y - 15, 4, this.weapon.color);
            bullet2.setDepth(80);
            bullet2.vx = -this.weapon.velocity * 0.2;
            bullet2.vy = -this.weapon.velocity * 0.9;
            bullet2.damage = bullet.damage;
            this.bullets.push(bullet2);

            const bullet3 = this.add.circle(this.player.x + 10, this.player.y - 15, 4, this.weapon.color);
            bullet3.setDepth(80);
            bullet3.vx = this.weapon.velocity * 0.2;
            bullet3.vy = -this.weapon.velocity * 0.9;
            bullet3.damage = bullet.damage;
            this.bullets.push(bullet3);
        }

        this.bullets.push(bullet);
    }

    dash() {
        if (this.dashCooldown > 0) return;

        let dx = 0, dy = 0;
        if (this.wasd.left.isDown || this.cursors.left.isDown) dx = -1;
        else if (this.wasd.right.isDown || this.cursors.right.isDown) dx = 1;
        if (this.wasd.up.isDown || this.cursors.up.isDown) dy = -1;
        else if (this.wasd.down.isDown || this.cursors.down.isDown) dy = 1;

        if (dx === 0 && dy === 0) dy = -1; // Default dash up

        // Normalize
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        // Dash
        this.invincible = true;
        this.invincibleTimer = CONFIG.dashIFrames;
        this.dashCooldown = CONFIG.dashCooldown;

        this.tweens.add({
            targets: this.player,
            x: this.player.x + dx * CONFIG.dashDistance,
            y: this.player.y + dy * CONFIG.dashDistance,
            duration: 100,
            ease: 'Power2'
        });

        // Visual trail
        for (let i = 0; i < 3; i++) {
            const ghost = this.add.sprite(this.player.x, this.player.y, 'ship');
            ghost.setAlpha(0.5 - i * 0.15);
            ghost.setTint(0x44aaff);
            ghost.setDepth(99);
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 200,
                delay: i * 30,
                onComplete: () => ghost.destroy()
            });
        }
    }

    useBomb() {
        if (this.bombs <= 0) return;

        this.bombs--;

        // Clear all enemy bullets
        this.enemyBullets.forEach(b => {
            this.createExplosion(b.x, b.y, 0.3);
            b.destroy();
        });
        this.enemyBullets = [];

        // Damage all enemies
        this.enemies.forEach(enemy => {
            this.damageEnemy(enemy, 50);
        });

        // Screen flash
        this.cameras.main.flash(200, 255, 255, 200);

        // Large explosion
        this.createExplosion(this.player.x, this.player.y, 2);

        // Brief invincibility
        this.invincible = true;
        this.invincibleTimer = 500;
    }

    createExplosion(x, y, scale = 1) {
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.setScale(scale);
        explosion.setDepth(200);
        explosion.setAlpha(0.8);

        this.tweens.add({
            targets: explosion,
            scale: scale * 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
    }

    updateBullets(delta) {
        const { width, height } = this.cameras.main;

        // Player bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;

            // Homing
            if (this.weapon.keyword === 'Homing' && this.enemies.length > 0) {
                let closest = null;
                let closestDist = Infinity;
                this.enemies.forEach(e => {
                    const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
                    if (d < closestDist) {
                        closestDist = d;
                        closest = e;
                    }
                });
                if (closest && closestDist < 200) {
                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, closest.x, closest.y);
                    bullet.vx += Math.cos(angle) * 500 * delta / 1000;
                    bullet.vy += Math.sin(angle) * 500 * delta / 1000;
                }
            }

            // Out of bounds
            if (bullet.y < 0 || bullet.y > height || bullet.x < 0 || bullet.x > width) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Hit enemies
            let hitEnemy = false;
            for (const enemy of this.enemies) {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < 20) {
                    this.damageEnemy(enemy, bullet.damage);
                    hitEnemy = true;
                    if (!bullet.piercing) break;
                }
            }

            if (hitEnemy && !bullet.piercing) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }

        // Enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;

            // Out of bounds
            if (bullet.y < 0 || bullet.y > height || bullet.x < 0 || bullet.x > width) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
                continue;
            }

            // Hit player
            if (!this.invincible && Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y) < 16) {
                this.playerHit();
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateEnemies(delta) {
        const { width, height } = this.cameras.main;

        this.enemies.forEach(enemy => {
            if (enemy.isBoss) {
                this.updateBoss(enemy, delta);
                return;
            }

            // Update fire cooldown
            if (enemy.fireCooldown > 0) enemy.fireCooldown -= delta;

            // Behavior
            switch (enemy.behavior) {
                case 'chase':
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.x += Math.cos(angle) * enemy.speed * delta / 1000;
                    enemy.y += Math.sin(angle) * enemy.speed * delta / 1000;
                    break;

                case 'wander':
                    if (Math.random() < 0.02) {
                        enemy.vx = (Math.random() - 0.5) * enemy.speed;
                        enemy.vy = (Math.random() - 0.5) * enemy.speed;
                    }
                    enemy.x += enemy.vx * delta / 1000;
                    enemy.y += enemy.vy * delta / 1000;
                    break;

                case 'dash':
                    if (Math.random() < 0.01) {
                        enemy.targetX = this.player.x + (Math.random() - 0.5) * 100;
                        enemy.targetY = this.player.y + (Math.random() - 0.5) * 100;
                    }
                    const dashAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
                    enemy.x += Math.cos(dashAngle) * enemy.speed * delta / 1000;
                    enemy.y += Math.sin(dashAngle) * enemy.speed * delta / 1000;
                    break;

                case 'stationary':
                    // Don't move
                    break;
            }

            // Bounds
            const offsetX = (width - CONFIG.roomWidth) / 2;
            const offsetY = 60;
            enemy.x = Phaser.Math.Clamp(enemy.x, offsetX + 40, offsetX + CONFIG.roomWidth - 40);
            enemy.y = Phaser.Math.Clamp(enemy.y, offsetY + 60, offsetY + CONFIG.roomHeight - 100);

            // Fire at player
            if (enemy.fireRate > 0 && enemy.fireCooldown <= 0) {
                this.enemyFire(enemy);
                enemy.fireCooldown = enemy.fireRate;
            }

            // Contact damage (swarmers)
            if (enemy.type === 'swarmer' && !this.invincible) {
                if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 20) {
                    this.playerHit();
                    this.damageEnemy(enemy, 1000); // Kill swarmer on contact
                }
            }
        });
    }

    updateBoss(boss, delta) {
        boss.attackTimer += delta;
        boss.patternTimer += delta;

        // Change pattern every 5 seconds
        if (boss.patternTimer > 5000) {
            boss.pattern = (boss.pattern + 1) % 3;
            boss.patternTimer = 0;
        }

        // Movement
        const targetX = this.player.x + Math.sin(boss.attackTimer / 1000) * 100;
        boss.x += (targetX - boss.x) * 0.02;

        // Attack patterns
        if (boss.attackTimer > 500) {
            boss.attackTimer = 0;

            switch (boss.pattern) {
                case 0: // Spread shot
                    for (let i = -2; i <= 2; i++) {
                        this.fireEnemyBullet(boss.x, boss.y + 40, i * 50, 200);
                    }
                    break;

                case 1: // Ring shot
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        this.fireEnemyBullet(boss.x, boss.y, Math.cos(angle) * 150, Math.sin(angle) * 150);
                    }
                    break;

                case 2: // Aimed burst
                    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                    for (let i = -1; i <= 1; i++) {
                        const a = angle + i * 0.2;
                        this.fireEnemyBullet(boss.x, boss.y, Math.cos(a) * 250, Math.sin(a) * 250);
                    }
                    break;
            }
        }

        // Update boss HP bar
        this.bossHpFill.width = 392 * (boss.hp / boss.maxHp);
    }

    enemyFire(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const speed = 150 + Math.random() * 50;

        this.fireEnemyBullet(enemy.x, enemy.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    fireEnemyBullet(x, y, vx, vy) {
        const bullet = this.add.sprite(x, y, 'enemyBullet');
        bullet.setDepth(70);
        bullet.vx = vx;
        bullet.vy = vy;
        this.enemyBullets.push(bullet);
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Show damage
        this.showFloatingText(enemy.x, enemy.y - 20, `-${Math.floor(damage)}`, '#ffff44');

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) this.enemies.splice(index, 1);

        // Increase multiplier
        this.multiplier = Math.min(10, this.multiplier + 0.1);
        this.multiplierDecay = 0;

        // Drop debris
        const debrisAmount = Math.floor(10 * this.multiplier);
        this.debris += debrisAmount;
        this.showFloatingText(enemy.x, enemy.y, `+${debrisAmount}G`, '#ffaa00');

        // Explosion
        this.createExplosion(enemy.x, enemy.y, enemy.isBoss ? 2 : 0.5);

        // Boss death
        if (enemy.isBoss) {
            this.bossDefeated = true;
            this.bossActive = false;
            this.bossHpBar.setVisible(false);
            this.bossHpFill.setVisible(false);
            this.bossNameText.setVisible(false);

            // Boss reward
            this.hp = Math.min(this.hp + 2, CONFIG.maxHP);
            this.showFloatingText(enemy.x, enemy.y - 40, '+2 HP', '#44ff44');

            // Check floor completion
            this.time.delayedCall(2000, () => {
                if (this.currentFloor >= 3) {
                    this.gameWin();
                } else {
                    this.nextFloor();
                }
            });
        }

        enemy.destroy();
    }

    playerHit() {
        if (this.invincible) return;

        this.hp--;
        this.multiplier = Math.max(1, this.multiplier - 0.5);

        // I-frames
        this.invincible = true;
        this.invincibleTimer = 1000;

        // Visual feedback
        this.cameras.main.flash(100, 255, 0, 0);
        this.cameras.main.shake(100, 0.01);

        // Flicker player
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });

        if (this.hp <= 0) {
            this.gameOver();
        }
    }

    updatePickups() {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];

            if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) < 30) {
                switch (pickup.type) {
                    case 'debris':
                        const amount = Math.floor(20 * this.multiplier);
                        this.debris += amount;
                        this.showFloatingText(pickup.x, pickup.y, `+${amount}G`, '#ffaa00');
                        break;

                    case 'healthPickup':
                        if (this.hp < CONFIG.maxHP) {
                            this.hp++;
                            this.showFloatingText(pickup.x, pickup.y, '+1 HP', '#44ff44');
                        }
                        break;

                    case 'weaponPickup':
                        // Random weapon
                        const weapons = Object.keys(CONFIG.weapons).filter(w => w !== 'peashooter');
                        const weaponKey = weapons[Math.floor(Math.random() * weapons.length)];
                        const keyword = Math.random() < 0.3 ? CONFIG.keywords[Math.floor(Math.random() * CONFIG.keywords.length)] : null;

                        this.weapon = { ...CONFIG.weapons[weaponKey], keyword };
                        this.ammo = this.weapon.ammo;
                        this.showFloatingText(pickup.x, pickup.y, keyword ? `${keyword} ${this.weapon.name}` : this.weapon.name, '#4444ff');
                        break;
                }

                pickup.destroy();
                this.pickups.splice(i, 1);
            }
        }
    }

    checkDoorTransitions() {
        if (!this.currentRoom.cleared && this.currentRoom.type !== 'start' && this.currentRoom.type !== 'treasure' && this.currentRoom.type !== 'shop') return;

        this.doors.forEach(door => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y) < 40) {
                this.enterRoom(door.targetRoom);
            }
        });
    }

    roomCleared() {
        this.currentRoom.cleared = true;
        this.clearedRooms.add(`${this.currentRoom.x},${this.currentRoom.y}`);

        this.showFloatingText(this.cameras.main.width / 2, 200, 'ROOM CLEARED', '#44ff44');

        // Spawn pickups
        if (Math.random() < 0.5) {
            this.spawnPickup(
                this.player.x + (Math.random() - 0.5) * 100,
                this.player.y - 50,
                Math.random() < 0.2 ? 'healthPickup' : 'debris'
            );
        }

        this.updateMinimap();
    }

    nextFloor() {
        this.currentFloor++;
        this.rooms = [];
        this.floorMap = [];
        this.visitedRooms.clear();
        this.clearedRooms.clear();
        this.bossDefeated = false;

        // Restore one bomb
        this.bombs = Math.min(this.bombs + 1, CONFIG.maxBombs);

        this.generateFloor();
        this.enterRoom(this.currentRoom);

        this.showFloatingText(this.cameras.main.width / 2, 200, `FLOOR ${this.currentFloor}`, '#44ff44');
    }

    gameWin() {
        this.scene.start('WinScene', { debris: this.debris, floor: this.currentFloor });
    }

    gameOver() {
        const { width, height } = this.cameras.main;

        // Death overlay
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
        overlay.setDepth(5000);

        this.add.text(width/2, height/2 - 50, 'GAME OVER', {
            font: 'bold 32px monospace',
            fill: '#ff4444'
        }).setOrigin(0.5).setDepth(5001);

        this.add.text(width/2, height/2, `Floor: ${this.currentFloor} | Debris: ${this.debris}G`, {
            font: '16px monospace',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(5001);

        this.add.text(width/2, height/2 + 50, 'Click to restart', {
            font: '14px monospace',
            fill: '#666666'
        }).setOrigin(0.5).setDepth(5001);

        this.input.once('pointerdown', () => this.scene.restart());
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            font: 'bold 12px monospace',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3000);

        floatText.life = 1000;
        floatText.startY = y;
        this.floatingTexts.push(floatText);
    }

    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.life -= delta;
            text.y = text.startY - (1000 - text.life) * 0.03;
            text.alpha = text.life / 1000;

            if (text.life <= 0) {
                text.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateUI() {
        // Hearts
        this.hearts.forEach((heart, i) => {
            heart.setAlpha(i < this.hp ? 1 : 0.2);
        });

        // Bombs
        this.bombIcons.forEach((bomb, i) => {
            bomb.setAlpha(i < this.bombs ? 1 : 0.3);
        });

        // Weapon
        const keywordText = this.weapon.keyword ? `[${this.weapon.keyword}] ` : '';
        this.weaponText.setText(keywordText + this.weapon.name.toUpperCase());
        this.ammoText.setText(this.ammo === Infinity ? 'INF' : this.ammo.toString());

        // Stats
        this.multiplierText.setText(`x${this.multiplier.toFixed(1)}`);
        this.debrisText.setText(`${this.debris}G`);
        this.floorText.setText(`FLOOR ${this.currentFloor}`);

        // Boss HP
        if (this.bossActive && this.boss) {
            this.bossHpBar.setVisible(true);
            this.bossHpFill.setVisible(true);
            this.bossNameText.setVisible(true);
            this.bossNameText.setText(this.boss.name);
        }
    }

    updateDebug() {
        const text = [
            `Pos: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
            `HP: ${this.hp}/${CONFIG.maxHP}`,
            `Bombs: ${this.bombs}`,
            `Debris: ${this.debris}`,
            `Multiplier: x${this.multiplier.toFixed(2)}`,
            `Floor: ${this.currentFloor}`,
            `Room: ${this.currentRoom.type}`,
            `Enemies: ${this.enemies.length}`,
            `Bullets: ${this.bullets.length}/${this.enemyBullets.length}`,
            `Invincible: ${this.invincible}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(text);
    }
}

// Win Scene
class WinScene extends Phaser.Scene {
    constructor() { super('WinScene'); }

    init(data) {
        this.finalDebris = data.debris || 0;
        this.finalFloor = data.floor || 3;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0x0a0a14);

        this.add.text(width/2, 100, 'VICTORY', {
            font: 'bold 48px monospace',
            fill: '#44ff44',
            stroke: '#1a3a1a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 180, 'The facility has been purged.', {
            font: '16px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(width/2, 250, `Final Floor: ${this.finalFloor}`, {
            font: '14px monospace',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(width/2, 280, `Debris Collected: ${this.finalDebris}G`, {
            font: '14px monospace',
            fill: '#ffaa00'
        }).setOrigin(0.5);

        const restartBtn = this.add.rectangle(width/2, 380, 200, 50, 0x1a4a1a);
        restartBtn.setStrokeStyle(2, 0x44ff44);
        restartBtn.setInteractive({ useHandCursor: true });

        this.add.text(width/2, 380, 'NEW RUN', {
            font: 'bold 18px monospace',
            fill: '#44ff44'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#0a0a14',
    scene: [BootScene, MenuScene, GameScene, WinScene]
};

// Start game
const game = new Phaser.Game(config);
