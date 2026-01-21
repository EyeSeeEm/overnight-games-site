// Station Breach - Twin-Stick Shooter with Survival Horror Elements

// Game constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 180;
const PLAYER_SPRINT_SPEED = 270;

// Weapon definitions
const WEAPONS = {
    pistol: { damage: 15, fireRate: 250, magSize: 12, reloadTime: 950, speed: 800, spread: 3, infinite: true },
    shotgun: { damage: 8, pellets: 6, fireRate: 833, magSize: 8, reloadTime: 2250, speed: 600, spread: 25 },
    rifle: { damage: 20, fireRate: 167, magSize: 30, reloadTime: 1750, speed: 850, spread: 5 },
    flamethrower: { damage: 5, fireRate: 50, magSize: 100, reloadTime: 2750, speed: 400, spread: 15 }
};

// Enemy definitions
const ENEMIES = {
    drone: { hp: 20, damage: 10, speed: 120, size: 24, color: 0x00ff88 },
    brute: { hp: 100, damage: 30, speed: 60, chargeSpeed: 250, size: 48, color: 0xff4400 },
    queen: { hp: 500, damage: 40, speed: 80, chargeSpeed: 150, size: 96, color: 0x8800ff }
};

// Boot Scene - Create textures
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Player texture
        const playerG = this.make.graphics({ x: 0, y: 0, add: false });
        playerG.fillStyle(0x4488ff);
        playerG.fillCircle(16, 16, 14);
        playerG.fillStyle(0x88ccff);
        playerG.fillTriangle(16, 4, 28, 24, 16, 20);
        playerG.generateTexture('player', 32, 32);

        // Bullet texture
        const bulletG = this.make.graphics({ x: 0, y: 0, add: false });
        bulletG.fillStyle(0xffff00);
        bulletG.fillRect(0, 2, 12, 4);
        bulletG.generateTexture('bullet', 12, 8);

        // Flame texture
        const flameG = this.make.graphics({ x: 0, y: 0, add: false });
        flameG.fillStyle(0xff6600);
        flameG.fillCircle(8, 8, 8);
        flameG.fillStyle(0xffaa00);
        flameG.fillCircle(8, 8, 5);
        flameG.generateTexture('flame', 16, 16);

        // Wall texture
        const wallG = this.make.graphics({ x: 0, y: 0, add: false });
        wallG.fillStyle(0x4a4a4a);
        wallG.fillRect(0, 0, 32, 32);
        wallG.lineStyle(2, 0x3a3a3a);
        wallG.strokeRect(1, 1, 30, 30);
        wallG.generateTexture('wall', 32, 32);

        // Floor texture
        const floorG = this.make.graphics({ x: 0, y: 0, add: false });
        floorG.fillStyle(0x2a2a2a);
        floorG.fillRect(0, 0, 32, 32);
        floorG.lineStyle(1, 0x222222);
        floorG.strokeRect(0, 0, 32, 32);
        floorG.generateTexture('floor', 32, 32);

        // Door textures
        ['normal', 'blue'].forEach((type, i) => {
            const colors = [0x666666, 0x0088ff];
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(colors[i]);
            g.fillRect(0, 8, 64, 16);
            g.lineStyle(2, 0xffffff);
            g.strokeRect(2, 10, 60, 12);
            g.generateTexture(`door_${type}`, 64, 32);
        });

        // Pickup textures
        const pickupTypes = [
            { name: 'health', color: 0xff4444, symbol: '+' },
            { name: 'ammo', color: 0xffaa00, symbol: 'A' },
            { name: 'keycard_blue', color: 0x0088ff, symbol: 'K' }
        ];
        pickupTypes.forEach(p => {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(p.color);
            g.fillRoundedRect(4, 4, 24, 24, 4);
            g.generateTexture(p.name, 32, 32);
        });

        // Enemy textures
        Object.entries(ENEMIES).forEach(([name, data]) => {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            const half = data.size / 2;
            g.fillStyle(data.color);
            g.fillCircle(half, half, half - 2);
            g.fillStyle(0xff0000);
            g.fillCircle(half + half/3, half - half/4, half/4);
            g.fillCircle(half - half/3, half - half/4, half/4);
            g.generateTexture(name, data.size, data.size);
        });

        // Weapon icons
        ['pistol', 'shotgun', 'rifle', 'flamethrower'].forEach((w, i) => {
            const colors = [0xaaaaaa, 0x886644, 0x444444, 0xff6600];
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(colors[i]);
            g.fillRect(8, 20, 48, 12);
            g.fillRect(16, 14, 8, 12);
            g.generateTexture(`weapon_${w}`, 64, 48);
        });

        // Crate texture
        const crateG = this.make.graphics({ x: 0, y: 0, add: false });
        crateG.fillStyle(0x664422);
        crateG.fillRect(0, 0, 32, 32);
        crateG.lineStyle(2, 0x885533);
        crateG.strokeRect(2, 2, 28, 28);
        crateG.lineBetween(0, 16, 32, 16);
        crateG.lineBetween(16, 0, 16, 32);
        crateG.generateTexture('crate', 32, 32);

        // Barrel texture
        const barrelG = this.make.graphics({ x: 0, y: 0, add: false });
        barrelG.fillStyle(0xff4400);
        barrelG.fillCircle(16, 16, 14);
        barrelG.fillStyle(0xffaa00);
        barrelG.fillCircle(16, 16, 8);
        barrelG.generateTexture('barrel', 32, 32);

        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 120, 'STATION BREACH', {
            fontSize: '64px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 40, 'Survive the alien infestation', {
            fontSize: '24px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 40, 'WASD - Move | Mouse - Aim | Click - Shoot', {
            fontSize: '18px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 70, 'R - Reload | Q - Switch Weapon | Shift - Sprint | E - Interact', {
            fontSize: '18px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 140, '[ START MISSION ]', {
            fontSize: '32px', fontFamily: 'Arial', color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#88ffaa'));
        startBtn.on('pointerout', () => startBtn.setColor('#00ff88'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        // Game state
        this.currentLevel = 1;
        this.clearedRooms = new Set();

        // Player state
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.currentWeapon = 'pistol';
        this.weapons = {
            pistol: { unlocked: true, ammo: Infinity, mag: 12 },
            shotgun: { unlocked: false, ammo: 24, mag: 8 },
            rifle: { unlocked: false, ammo: 90, mag: 30 },
            flamethrower: { unlocked: false, ammo: 200, mag: 100 }
        };
        this.hasBlueKeycard = false;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.lastOutOfAmmoMsg = 0;
        this.stamina = 100;

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        this.doors = this.physics.add.staticGroup();
        this.pickups = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.crates = this.physics.add.staticGroup();
        this.barrels = this.physics.add.staticGroup();
        this.floatingTexts = this.add.group();

        // Generate level
        this.generateLevel(this.currentLevel);

        // Create player
        this.player = this.physics.add.sprite(this.playerSpawn.x, this.playerSpawn.y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setCircle(12, 4, 4);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // Vision mask
        this.visionGraphics = this.add.graphics();
        this.visionGraphics.setDepth(100);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.crates);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.crates);
        this.physics.add.collider(this.bullets, this.walls, (b) => b.destroy());
        this.physics.add.collider(this.bullets, this.crates, this.hitCrate, null, this);
        this.physics.add.collider(this.bullets, this.barrels, this.hitBarrel, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.doors, this.checkDoor, null, this);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            switchWeapon: Phaser.Input.Keyboard.KeyCodes.Q,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.input.on('pointerdown', () => this.shoot());
        this.input.keyboard.on('keydown-R', () => this.reload());
        this.input.keyboard.on('keydown-Q', () => this.switchWeapon());

        // HUD
        this.createHUD();

        // Screen shake
        this.shakeAmount = 0;
    }

    generateLevel(level) {
        const roomsData = this.generateRooms(level);
        this.rooms = roomsData.rooms;
        this.playerSpawn = roomsData.playerSpawn;
        this.levelWidth = roomsData.width;
        this.levelHeight = roomsData.height;

        this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
        this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    }

    generateRooms(level) {
        const rooms = [];
        const levelConfigs = {
            1: { roomCount: 15, enemies: ['drone'], bossRoom: false },
            2: { roomCount: 20, enemies: ['drone', 'brute'], bossRoom: false },
            3: { roomCount: 15, enemies: ['drone', 'brute'], bossRoom: true }
        };
        const config = levelConfigs[level];

        // Grid-based room layout
        const gridCols = 5;
        const gridRows = Math.ceil(config.roomCount / gridCols);
        const roomWidth = 12 * TILE_SIZE;
        const roomHeight = 10 * TILE_SIZE;
        const width = gridCols * roomWidth + 4 * TILE_SIZE;
        const height = gridRows * roomHeight + 4 * TILE_SIZE;

        let playerSpawn = { x: 0, y: 0 };

        // Generate rooms in grid
        for (let gy = 0; gy < gridRows; gy++) {
            for (let gx = 0; gx < gridCols; gx++) {
                const roomIndex = gy * gridCols + gx;
                if (roomIndex >= config.roomCount) continue;

                const rx = gx * roomWidth + 2 * TILE_SIZE;
                const ry = gy * roomHeight + 2 * TILE_SIZE;
                const rw = roomWidth - TILE_SIZE;
                const rh = roomHeight - TILE_SIZE;

                const room = { x: rx, y: ry, width: rw, height: rh, index: roomIndex, cleared: false };
                rooms.push(room);

                // Draw floor
                for (let y = ry; y < ry + rh; y += TILE_SIZE) {
                    for (let x = rx; x < rx + rw; x += TILE_SIZE) {
                        this.floors.add(this.add.image(x + 16, y + 16, 'floor').setDepth(0));
                    }
                }

                // Draw walls
                for (let x = rx; x < rx + rw; x += TILE_SIZE) {
                    this.walls.create(x + 16, ry + 16, 'wall');
                    this.walls.create(x + 16, ry + rh - 16, 'wall');
                }
                for (let y = ry + TILE_SIZE; y < ry + rh - TILE_SIZE; y += TILE_SIZE) {
                    this.walls.create(rx + 16, y + 16, 'wall');
                    this.walls.create(rx + rw - 16, y + 16, 'wall');
                }

                // Room 0 is start room (empty, player spawn)
                if (roomIndex === 0) {
                    playerSpawn = { x: rx + rw / 2, y: ry + rh / 2 };
                    room.cleared = true;
                    this.clearedRooms.add(0);
                }

                // Add doors between rooms
                if (gx < gridCols - 1 && roomIndex + 1 < config.roomCount) {
                    // Door to the right
                    const doorX = rx + rw - 16;
                    const doorY = ry + rh / 2;
                    // Remove wall pieces for door
                    this.walls.children.each(w => {
                        if (Math.abs(w.x - doorX) < 20 && Math.abs(w.y - doorY) < 40) {
                            w.destroy();
                        }
                    });
                }

                if (gy < gridRows - 1 && roomIndex + gridCols < config.roomCount) {
                    // Door downward
                    const doorX = rx + rw / 2;
                    const doorY = ry + rh - 16;
                    this.walls.children.each(w => {
                        if (Math.abs(w.x - doorX) < 40 && Math.abs(w.y - doorY) < 20) {
                            w.destroy();
                        }
                    });
                }

                // Add obstacles (crates, barrels)
                if (roomIndex > 0 && roomIndex !== config.roomCount - 1) {
                    const numCrates = Phaser.Math.Between(0, 3);
                    for (let i = 0; i < numCrates; i++) {
                        const cx = rx + TILE_SIZE * 2 + Math.random() * (rw - TILE_SIZE * 4);
                        const cy = ry + TILE_SIZE * 2 + Math.random() * (rh - TILE_SIZE * 4);
                        this.crates.create(cx, cy, 'crate');
                    }
                    if (Math.random() < 0.3) {
                        const bx = rx + TILE_SIZE * 2 + Math.random() * (rw - TILE_SIZE * 4);
                        const by = ry + TILE_SIZE * 2 + Math.random() * (rh - TILE_SIZE * 4);
                        this.barrels.create(bx, by, 'barrel');
                    }
                }

                // Spawn enemies in rooms (except start room)
                if (roomIndex > 0 && !config.bossRoom) {
                    room.enemies = [];
                    const numEnemies = 3 + Math.floor(Math.random() * 3) + level;
                    for (let i = 0; i < numEnemies; i++) {
                        const ex = rx + TILE_SIZE * 2 + Math.random() * (rw - TILE_SIZE * 4);
                        const ey = ry + TILE_SIZE * 2 + Math.random() * (rh - TILE_SIZE * 4);
                        const type = config.enemies[Math.floor(Math.random() * config.enemies.length)];
                        room.enemies.push({ x: ex, y: ey, type, spawned: false });
                    }
                }

                // Keycard placement (in middle room of level)
                if (roomIndex === Math.floor(config.roomCount / 2)) {
                    this.pickups.add(this.physics.add.sprite(rx + rw / 2, ry + rh / 2, 'keycard_blue')
                        .setData('type', 'keycard_blue'));
                }

                // Weapon pickups
                if (level === 1 && roomIndex === 5) {
                    this.pickups.add(this.physics.add.sprite(rx + rw / 2, ry + rh / 2 + 32, 'ammo')
                        .setData('type', 'weapon_shotgun'));
                }
                if (level === 2 && roomIndex === 5) {
                    this.pickups.add(this.physics.add.sprite(rx + rw / 2, ry + rh / 2 + 32, 'ammo')
                        .setData('type', 'weapon_rifle'));
                }
                if (level === 2 && roomIndex === 10) {
                    this.pickups.add(this.physics.add.sprite(rx + rw / 2, ry + rh / 2 + 32, 'ammo')
                        .setData('type', 'weapon_flamethrower'));
                }

                // Health and ammo pickups
                if (roomIndex > 0 && Math.random() < 0.4) {
                    const px = rx + TILE_SIZE * 2 + Math.random() * (rw - TILE_SIZE * 4);
                    const py = ry + TILE_SIZE * 2 + Math.random() * (rh - TILE_SIZE * 4);
                    const ptype = Math.random() < 0.5 ? 'health' : 'ammo';
                    this.pickups.add(this.physics.add.sprite(px, py, ptype).setData('type', ptype));
                }

                // Exit door (last room)
                if (roomIndex === config.roomCount - 1) {
                    const door = this.physics.add.sprite(rx + rw / 2, ry + rh - 48, 'door_blue');
                    door.setData('type', 'exit');
                    door.setData('requires', 'blue');
                    this.doors.add(door);

                    // Boss room enemies for level 3
                    if (config.bossRoom) {
                        room.enemies = [{ x: rx + rw / 2, y: ry + rh / 2, type: 'queen', spawned: false }];
                        for (let i = 0; i < 5; i++) {
                            const ex = rx + TILE_SIZE * 2 + Math.random() * (rw - TILE_SIZE * 4);
                            const ey = ry + TILE_SIZE * 2 + Math.random() * (rh - TILE_SIZE * 4);
                            room.enemies.push({ x: ex, y: ey, type: 'drone', spawned: false });
                        }
                    }
                }
            }
        }

        return { rooms, playerSpawn, width, height };
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

        // Health bar background
        this.hudContainer.add(this.add.rectangle(120, 30, 204, 24, 0x333333).setScrollFactor(0));
        this.healthBar = this.add.rectangle(20, 20, 200, 20, 0xff4444).setOrigin(0, 0).setScrollFactor(0);
        this.hudContainer.add(this.healthBar);

        // Health text
        this.healthText = this.add.text(120, 30, '100/100', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        this.hudContainer.add(this.healthText);

        // Weapon info
        this.weaponText = this.add.text(20, 680, 'PISTOL', {
            fontSize: '20px', fontFamily: 'Arial', color: '#88ccff'
        }).setScrollFactor(0);
        this.hudContainer.add(this.weaponText);

        this.ammoText = this.add.text(20, 700, '12/12 | INF', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffaa00'
        }).setScrollFactor(0);
        this.hudContainer.add(this.ammoText);

        // Keycard indicator
        this.keycardIndicator = this.add.text(1180, 680, 'KEYCARD: NONE', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setScrollFactor(0);
        this.hudContainer.add(this.keycardIndicator);

        // Level indicator
        this.levelText = this.add.text(640, 20, 'LEVEL 1 - CARGO BAY', {
            fontSize: '20px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this.hudContainer.add(this.levelText);

        // Stamina bar
        this.hudContainer.add(this.add.rectangle(120, 55, 104, 10, 0x333333).setScrollFactor(0));
        this.staminaBar = this.add.rectangle(70, 51, 100, 6, 0x00ff88).setOrigin(0, 0).setScrollFactor(0);
        this.hudContainer.add(this.staminaBar);

        // Interaction prompt
        this.interactPrompt = this.add.text(640, 500, '', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00ff88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        // Message text
        this.messageText = this.add.text(640, 400, '', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Player movement
        let speed = PLAYER_SPEED;
        const sprinting = this.cursors.sprint.isDown && this.stamina > 0;
        if (sprinting) {
            speed = PLAYER_SPRINT_SPEED;
            this.stamina = Math.max(0, this.stamina - 25 * delta / 1000);
        } else {
            this.stamina = Math.min(100, this.stamina + 20 * delta / 1000);
        }

        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * speed, vy * speed);

        // Player rotation (aim at mouse)
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.setRotation(angle);

        // Auto-fire while holding mouse
        if (this.input.activePointer.isDown) {
            this.shoot();
        }

        // Interact with space
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.tryInteract();
        }

        // Check room entry for spawning enemies
        this.checkRoomEntry();

        // Update enemies
        this.updateEnemies(delta);

        // Update HUD
        this.updateHUD();

        // Update vision
        this.updateVision();

        // Screen shake decay
        if (this.shakeAmount > 0) {
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + (Math.random() - 0.5) * this.shakeAmount,
                this.cameras.main.scrollY + (Math.random() - 0.5) * this.shakeAmount
            );
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.5) this.shakeAmount = 0;
        }

        // Update floating texts
        this.floatingTexts.children.each(t => {
            t.y -= 1;
            t.alpha -= 0.02;
            if (t.alpha <= 0) t.destroy();
        });
    }

    checkRoomEntry() {
        const px = this.player.x;
        const py = this.player.y;

        for (const room of this.rooms) {
            if (px > room.x && px < room.x + room.width &&
                py > room.y && py < room.y + room.height) {

                if (!this.clearedRooms.has(room.index) && room.enemies) {
                    // Spawn enemies for this room
                    room.enemies.forEach(e => {
                        if (!e.spawned) {
                            this.spawnEnemy(e.x, e.y, e.type);
                            e.spawned = true;
                        }
                    });
                    this.clearedRooms.add(room.index);
                }
                break;
            }
        }
    }

    spawnEnemy(x, y, type) {
        const data = ENEMIES[type];
        const enemy = this.physics.add.sprite(x, y, type);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('maxHp', data.hp);
        enemy.setData('damage', data.damage);
        enemy.setData('speed', data.speed);
        enemy.setData('lastAttack', 0);
        enemy.setData('state', 'idle');
        enemy.setData('chargeDir', null);
        enemy.body.setCircle(data.size / 2 - 2, 2, 2);
        this.enemies.add(enemy);

        if (type === 'queen') {
            enemy.setData('phase', 1);
            enemy.setData('lastSummon', 0);
        }
    }

    updateEnemies(delta) {
        const time = this.time.now;

        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            const type = enemy.getData('type');
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            enemy.setRotation(angle);

            if (type === 'drone') {
                // Drones rush player
                if (dist < 300) {
                    this.physics.moveToObject(enemy, this.player, ENEMIES.drone.speed);
                } else {
                    enemy.setVelocity(0, 0);
                }
            } else if (type === 'brute') {
                const state = enemy.getData('state');
                if (state === 'charging') {
                    const dir = enemy.getData('chargeDir');
                    enemy.setVelocity(dir.x * ENEMIES.brute.chargeSpeed, dir.y * ENEMIES.brute.chargeSpeed);
                    if (time - enemy.getData('chargeStart') > 1500) {
                        enemy.setData('state', 'stunned');
                        enemy.setData('stunStart', time);
                        enemy.setVelocity(0, 0);
                    }
                } else if (state === 'stunned') {
                    if (time - enemy.getData('stunStart') > 1000) {
                        enemy.setData('state', 'idle');
                    }
                } else {
                    if (dist < 200 && dist > 50) {
                        // Start charge
                        enemy.setData('state', 'charging');
                        enemy.setData('chargeStart', time);
                        enemy.setData('chargeDir', { x: Math.cos(angle), y: Math.sin(angle) });
                    } else if (dist < 250) {
                        this.physics.moveToObject(enemy, this.player, ENEMIES.brute.speed);
                    } else {
                        enemy.setVelocity(0, 0);
                    }
                }
            } else if (type === 'queen') {
                const phase = enemy.getData('hp') <= 250 ? 2 : 1;
                enemy.setData('phase', phase);

                // Queen behavior
                if (dist < 400) {
                    this.physics.moveToObject(enemy, this.player, ENEMIES.queen.speed * (phase === 2 ? 1.3 : 1));
                }

                // Summon drones
                if (time - enemy.getData('lastSummon') > 20000) {
                    enemy.setData('lastSummon', time);
                    for (let i = 0; i < (phase === 2 ? 4 : 3); i++) {
                        const sx = enemy.x + (Math.random() - 0.5) * 100;
                        const sy = enemy.y + (Math.random() - 0.5) * 100;
                        this.spawnEnemy(sx, sy, 'drone');
                    }
                    this.showMessage('The Queen summons her brood!', 2000);
                }
            }
        });
    }

    shoot() {
        if (this.isReloading) return;

        const weapon = WEAPONS[this.currentWeapon];
        const weaponState = this.weapons[this.currentWeapon];
        const time = this.time.now;

        if (time - this.lastFireTime < weapon.fireRate) return;

        if (weaponState.mag <= 0) {
            if (time - this.lastOutOfAmmoMsg > 1000) {
                this.showMessage('RELOAD! (R)', 500);
                this.lastOutOfAmmoMsg = time;
            }
            return;
        }

        this.lastFireTime = time;
        weaponState.mag--;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
            const angle = baseAngle + spread;

            const texture = this.currentWeapon === 'flamethrower' ? 'flame' : 'bullet';
            const bullet = this.physics.add.sprite(this.player.x, this.player.y, texture);
            bullet.setRotation(angle);
            bullet.setData('damage', weapon.damage);

            const vx = Math.cos(angle) * weapon.speed;
            const vy = Math.sin(angle) * weapon.speed;
            bullet.setVelocity(vx, vy);

            this.bullets.add(bullet);

            // Destroy bullet after time
            this.time.delayedCall(this.currentWeapon === 'flamethrower' ? 500 : 1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        // Screen shake
        const shakeAmounts = { pistol: 1, shotgun: 4, rifle: 1.5, flamethrower: 0.5 };
        this.shakeAmount = shakeAmounts[this.currentWeapon];

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(baseAngle) * 20,
            this.player.y + Math.sin(baseAngle) * 20,
            8, 0xffff00
        );
        this.time.delayedCall(50, () => flash.destroy());
    }

    reload() {
        if (this.isReloading) return;

        const weapon = WEAPONS[this.currentWeapon];
        const weaponState = this.weapons[this.currentWeapon];

        if (weaponState.mag >= weapon.magSize) return;
        if (!weapon.infinite && weaponState.ammo <= 0) {
            this.showMessage('No ammo!', 500);
            return;
        }

        this.isReloading = true;
        this.showMessage('Reloading...', weapon.reloadTime);

        this.time.delayedCall(weapon.reloadTime, () => {
            this.isReloading = false;
            const needed = weapon.magSize - weaponState.mag;
            if (weapon.infinite) {
                weaponState.mag = weapon.magSize;
            } else {
                const toLoad = Math.min(needed, weaponState.ammo);
                weaponState.mag += toLoad;
                weaponState.ammo -= toLoad;
            }
        });
    }

    switchWeapon() {
        const weapons = Object.keys(this.weapons).filter(w => this.weapons[w].unlocked);
        const idx = weapons.indexOf(this.currentWeapon);
        this.currentWeapon = weapons[(idx + 1) % weapons.length];
        this.isReloading = false;
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        // Knockback (except brute and queen)
        const type = enemy.getData('type');
        if (type !== 'brute' && type !== 'queen') {
            const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
            enemy.x += Math.cos(angle) * 10;
            enemy.y += Math.sin(angle) * 10;
        }

        // Hit effect
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        bullet.destroy();

        if (hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyDeath(enemy) {
        const type = enemy.getData('type');

        // Drop loot
        if (Math.random() < 0.3) {
            const lootType = Math.random() < 0.5 ? 'health' : 'ammo';
            this.pickups.add(this.physics.add.sprite(enemy.x, enemy.y, lootType).setData('type', lootType));
        }

        // Death effect
        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                4, 0x00ff88
            );
            this.tweens.add({
                targets: p,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => p.destroy()
            });
        }

        enemy.destroy();

        // Queen death = victory for level 3
        if (type === 'queen') {
            this.showMessage('THE QUEEN IS DEAD!', 3000);
            this.time.delayedCall(3000, () => {
                this.scene.start('VictoryScene');
            });
        }
    }

    enemyHitPlayer(player, enemy) {
        const time = this.time.now;
        const lastAttack = enemy.getData('lastAttack');

        if (time - lastAttack < 1000) return;

        enemy.setData('lastAttack', time);
        const damage = enemy.getData('damage');
        this.playerHP -= damage;

        // Knockback player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.x += Math.cos(angle) * 30;
        player.y += Math.sin(angle) * 30;

        this.shakeAmount = 5;
        this.cameras.main.flash(100, 255, 0, 0);

        if (this.playerHP <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        this.showMessage('MISSION FAILED', 2000);
        this.player.setActive(false);
        this.player.setVisible(false);

        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        if (type === 'health') {
            const heal = 25;
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + heal);
            this.floatText(pickup.x, pickup.y, `+${heal} HP`, '#ff4444');
        } else if (type === 'ammo') {
            // Add ammo to current weapon (or random)
            const weapons = Object.keys(this.weapons).filter(w => this.weapons[w].unlocked && w !== 'pistol');
            if (weapons.length > 0) {
                const w = weapons[Math.floor(Math.random() * weapons.length)];
                this.weapons[w].ammo += 20;
                this.floatText(pickup.x, pickup.y, '+20 Ammo', '#ffaa00');
            }
        } else if (type === 'keycard_blue') {
            this.hasBlueKeycard = true;
            this.floatText(pickup.x, pickup.y, 'BLUE KEYCARD', '#0088ff');
            this.keycardIndicator.setText('KEYCARD: BLUE').setColor('#0088ff');
        } else if (type === 'weapon_shotgun') {
            this.weapons.shotgun.unlocked = true;
            this.floatText(pickup.x, pickup.y, 'SHOTGUN!', '#ff8800');
        } else if (type === 'weapon_rifle') {
            this.weapons.rifle.unlocked = true;
            this.floatText(pickup.x, pickup.y, 'RIFLE!', '#ff8800');
        } else if (type === 'weapon_flamethrower') {
            this.weapons.flamethrower.unlocked = true;
            this.floatText(pickup.x, pickup.y, 'FLAMETHROWER!', '#ff8800');
        }

        pickup.destroy();
    }

    floatText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            fontSize: '16px', fontFamily: 'Arial', color: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(150);
        this.floatingTexts.add(t);
    }

    checkDoor(player, door) {
        const requires = door.getData('requires');
        const type = door.getData('type');

        if (type === 'exit') {
            if (requires === 'blue' && !this.hasBlueKeycard) {
                this.interactPrompt.setText('Requires BLUE KEYCARD');
                return;
            }
            this.interactPrompt.setText('Press SPACE to proceed');
        }
    }

    tryInteract() {
        // Check for exit doors
        let nearDoor = null;
        this.doors.children.each(door => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
            if (dist < 60) nearDoor = door;
        });

        if (nearDoor && nearDoor.getData('type') === 'exit') {
            const requires = nearDoor.getData('requires');
            if (requires === 'blue' && !this.hasBlueKeycard) {
                this.showMessage('Need BLUE KEYCARD!', 1000);
                return;
            }

            // Go to next level
            if (this.currentLevel < 3) {
                this.currentLevel++;
                this.hasBlueKeycard = false;
                this.clearedRooms.clear();

                // Clear existing level
                this.walls.clear(true, true);
                this.floors.clear(true, true);
                this.doors.clear(true, true);
                this.pickups.clear(true, true);
                this.enemies.clear(true, true);
                this.crates.clear(true, true);
                this.barrels.clear(true, true);

                // Generate new level
                this.generateLevel(this.currentLevel);
                this.player.setPosition(this.playerSpawn.x, this.playerSpawn.y);

                const levelNames = ['', 'CARGO BAY', 'ENGINEERING', "QUEEN'S LAIR"];
                this.levelText.setText(`LEVEL ${this.currentLevel} - ${levelNames[this.currentLevel]}`);
                this.keycardIndicator.setText('KEYCARD: NONE').setColor('#666666');

                this.showMessage(`LEVEL ${this.currentLevel}`, 2000);
            } else {
                // Level 3 complete after queen
                this.scene.start('VictoryScene');
            }
        }
    }

    hitCrate(bullet, crate) {
        bullet.destroy();
        crate.destroy();

        // Maybe drop something
        if (Math.random() < 0.3) {
            const type = Math.random() < 0.5 ? 'health' : 'ammo';
            this.pickups.add(this.physics.add.sprite(crate.x, crate.y, type).setData('type', type));
        }
    }

    hitBarrel(bullet, barrel) {
        bullet.destroy();

        // Explosion
        const explosion = this.add.circle(barrel.x, barrel.y, 60, 0xff6600, 0.5);
        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Damage nearby enemies
        this.enemies.children.each(enemy => {
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, enemy.x, enemy.y);
            if (dist < 100) {
                let hp = enemy.getData('hp') - 80;
                enemy.setData('hp', hp);
                if (hp <= 0) this.enemyDeath(enemy);
            }
        });

        // Damage player if near
        const playerDist = Phaser.Math.Distance.Between(barrel.x, barrel.y, this.player.x, this.player.y);
        if (playerDist < 100) {
            this.playerHP -= 40;
            this.shakeAmount = 10;
            if (this.playerHP <= 0) this.playerDeath();
        }

        barrel.destroy();
        this.shakeAmount = 8;
    }

    updateVision() {
        this.visionGraphics.clear();

        // Dark overlay with vision cone cutout
        const darkness = new Phaser.Geom.Rectangle(
            this.cameras.main.scrollX - 100,
            this.cameras.main.scrollY - 100,
            this.cameras.main.width + 200,
            this.cameras.main.height + 200
        );

        this.visionGraphics.fillStyle(0x000000, 0.7);
        this.visionGraphics.fillRectShape(darkness);

        // Vision cone (simplified - just a circle around player)
        this.visionGraphics.fillStyle(0x000000, 1);
        this.visionGraphics.setBlendMode(Phaser.BlendModes.ERASE);

        // Draw vision as a gradient circle
        const visionRadius = 350;
        for (let r = visionRadius; r > 0; r -= 10) {
            const alpha = 1 - (r / visionRadius) * 0.3;
            this.visionGraphics.fillStyle(0x000000, alpha);
            this.visionGraphics.fillCircle(this.player.x, this.player.y, r);
        }

        this.visionGraphics.setBlendMode(Phaser.BlendModes.NORMAL);
    }

    updateHUD() {
        // Health
        this.healthBar.width = (this.playerHP / this.playerMaxHP) * 200;
        this.healthText.setText(`${Math.ceil(this.playerHP)}/${this.playerMaxHP}`);

        // Stamina
        this.staminaBar.width = this.stamina;

        // Weapon
        this.weaponText.setText(this.currentWeapon.toUpperCase());
        const ws = this.weapons[this.currentWeapon];
        const ammoStr = WEAPONS[this.currentWeapon].infinite ? 'INF' : ws.ammo;
        this.ammoText.setText(`${ws.mag}/${WEAPONS[this.currentWeapon].magSize} | ${ammoStr}`);
        if (this.isReloading) {
            this.ammoText.setText('RELOADING...');
        }

        // Clear interact prompt
        this.interactPrompt.setText('');
    }

    showMessage(text, duration) {
        this.messageText.setText(text);
        this.time.delayedCall(duration, () => {
            this.messageText.setText('');
        });
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 100, 'ESCAPED!', {
            fontSize: '64px', fontFamily: 'Arial', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'You survived the station breach!', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(cx, cy + 100, '[ PLAY AGAIN ]', {
            fontSize: '32px', fontFamily: 'Arial', color: '#88ccff'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setColor('#aaeeff'));
        restartBtn.on('pointerout', () => restartBtn.setColor('#88ccff'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// Game config and start
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
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
