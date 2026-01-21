// Station Breach - Twin-Stick Survival Horror Shooter
// Built with Phaser 3

const TILE_SIZE = 32;
const PLAYER_SPEED = 180;
const SPRINT_SPEED = 270;

// ==================== BOOT SCENE ====================
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Create textures
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player - triangle pointing up (will rotate toward mouse)
        g.clear();
        g.fillStyle(0x00ff00);
        g.fillTriangle(16, 0, 32, 32, 0, 32);
        g.generateTexture('player', 32, 32);

        // Wall tile
        g.clear();
        g.fillStyle(0x4a4a4a);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x333333);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('wall', 32, 32);

        // Floor tile
        g.clear();
        g.fillStyle(0x2a2a2a);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x222222);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        // Door
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x888888);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('door', 32, 32);

        // Blue door
        g.clear();
        g.fillStyle(0x0088ff);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x00aaff);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('blue_door', 32, 32);

        // Drone enemy
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0xaa0000);
        g.fillCircle(12, 12, 6);
        g.generateTexture('drone', 24, 24);

        // Brute enemy
        g.clear();
        g.fillStyle(0x884400);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0xff6600);
        g.fillCircle(24, 24, 14);
        g.generateTexture('brute', 48, 48);

        // Queen enemy
        g.clear();
        g.fillStyle(0x8800ff);
        g.fillCircle(48, 48, 40);
        g.fillStyle(0xaa22ff);
        g.fillCircle(48, 48, 30);
        g.fillStyle(0xcc44ff);
        g.fillCircle(48, 48, 15);
        g.generateTexture('queen', 96, 96);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Shotgun pellet
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(3, 3, 3);
        g.generateTexture('pellet', 6, 6);

        // Flame particle
        g.clear();
        g.fillStyle(0xff4400);
        g.fillCircle(6, 6, 6);
        g.generateTexture('flame', 12, 12);

        // Health pack
        g.clear();
        g.fillStyle(0xff0000);
        g.fillRect(0, 0, 20, 20);
        g.fillStyle(0xffffff);
        g.fillRect(8, 4, 4, 12);
        g.fillRect(4, 8, 12, 4);
        g.generateTexture('health', 20, 20);

        // Ammo
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillRect(0, 0, 16, 20);
        g.fillStyle(0xcc8800);
        g.fillRect(2, 2, 12, 16);
        g.generateTexture('ammo', 16, 20);

        // Keycard
        g.clear();
        g.fillStyle(0x0088ff);
        g.fillRoundedRect(0, 0, 24, 16, 4);
        g.fillStyle(0x00aaff);
        g.fillRect(4, 6, 8, 4);
        g.generateTexture('keycard', 24, 16);

        // Crate
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x5d2e0a);
        g.strokeRect(2, 2, 28, 28);
        g.lineBetween(0, 16, 32, 16);
        g.lineBetween(16, 0, 16, 32);
        g.generateTexture('crate', 32, 32);

        // Barrel (explosive)
        g.clear();
        g.fillStyle(0x880000);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xff4400);
        g.fillCircle(16, 16, 8);
        g.generateTexture('barrel', 32, 32);

        // Muzzle flash
        g.clear();
        g.fillStyle(0xffff88);
        g.fillCircle(8, 8, 8);
        g.generateTexture('muzzle', 16, 16);

        // Shotgun pickup
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(0, 5, 28, 10);
        g.fillStyle(0x8b4513);
        g.fillRect(20, 3, 10, 14);
        g.generateTexture('shotgun_pickup', 30, 20);

        // Rifle pickup
        g.clear();
        g.fillStyle(0x333333);
        g.fillRect(0, 6, 32, 8);
        g.fillStyle(0x222222);
        g.fillRect(24, 4, 8, 12);
        g.generateTexture('rifle_pickup', 32, 20);

        // Flamethrower pickup
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(0, 6, 30, 10);
        g.fillStyle(0xff4400);
        g.fillCircle(28, 11, 5);
        g.generateTexture('flamethrower_pickup', 34, 22);

        g.destroy();
    }
}

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 150, 'STATION BREACH', {
            fontSize: '64px',
            fill: '#ff4444',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 60, 'A lone survivor on a doomed space station', {
            fontSize: '20px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, 'WASD - Move    |    Mouse - Aim/Shoot', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, 'R - Reload    |    Q - Switch Weapon    |    SHIFT - Sprint', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 80, 'SPACE - Open Door    |    E - Pickup', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 160, '[ CLICK TO START ]', {
            fontSize: '28px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#00ff00'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene', { level: 1 }));
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.playerData = data.playerData || {
            health: 100,
            maxHealth: 100,
            weapons: ['pistol'],
            currentWeapon: 0,
            ammo: { shells: 0, rifle: 0, fuel: 0 },
            hasKeycard: false
        };
    }

    create() {
        // Reset keycard for each level
        this.playerData.hasKeycard = false;

        // Game state
        this.roomsCleared = new Set();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();
        this.destructibles = this.physics.add.group();

        // Create level
        this.createLevel();

        // Create player
        this.createPlayer();

        // Weapon data
        this.weaponData = {
            pistol: { damage: 15, fireRate: 250, spread: 3, speed: 800, magSize: 12, mag: 12, reloadTime: 1200, infinite: true },
            shotgun: { damage: 8, pellets: 6, fireRate: 833, spread: 25, speed: 600, magSize: 8, mag: 8, reloadTime: 2500 },
            rifle: { damage: 20, fireRate: 166, spread: 5, speed: 850, magSize: 30, mag: 30, reloadTime: 2000 },
            flamethrower: { damage: 5, fireRate: 50, spread: 15, speed: 400, continuous: true, magSize: 100, mag: 100, reloadTime: 3000 }
        };

        // Timers
        this.lastFired = 0;
        this.reloading = false;
        this.lastAmmoMsg = 0;

        // Controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            Q: Phaser.Input.Keyboard.KeyCodes.Q,
            E: Phaser.Input.Keyboard.KeyCodes.E,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.destructibles, this.bulletHitDestructible, null, this);

        // Create HUD
        this.createHUD();

        // Create vision mask
        this.createVision();

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // Messages
        this.floatingTexts = [];

        // Weapon switch cooldown
        Phaser.Input.Keyboard.KeyCodes.Q;
        this.input.keyboard.on('keydown-Q', () => this.switchWeapon());
    }

    createLevel() {
        const level = this.currentLevel;
        this.levelData = this.generateLevel(level);

        // Render level
        for (let y = 0; y < this.levelData.height; y++) {
            for (let x = 0; x < this.levelData.width; x++) {
                const tile = this.levelData.tiles[y][x];
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (tile === 1) {
                    this.walls.create(px, py, 'wall');
                } else if (tile === 0) {
                    this.add.image(px, py, 'floor');
                } else if (tile === 2) {
                    this.add.image(px, py, 'floor');
                    const door = this.doors.create(px, py, 'door');
                    door.doorType = 'normal';
                } else if (tile === 3) {
                    this.add.image(px, py, 'floor');
                    const door = this.doors.create(px, py, 'blue_door');
                    door.doorType = 'blue';
                }
            }
        }

        // Place objects
        this.levelData.objects.forEach(obj => {
            const px = obj.x * TILE_SIZE + TILE_SIZE / 2;
            const py = obj.y * TILE_SIZE + TILE_SIZE / 2;

            if (obj.type === 'crate') {
                const crate = this.destructibles.create(px, py, 'crate');
                crate.health = 20;
                crate.setImmovable(true);
            } else if (obj.type === 'barrel') {
                const barrel = this.destructibles.create(px, py, 'barrel');
                barrel.health = 10;
                barrel.explosive = true;
                barrel.setImmovable(true);
            } else if (obj.type === 'health') {
                const h = this.pickups.create(px, py, 'health');
                h.pickupType = 'health';
                h.amount = 25;
            } else if (obj.type === 'ammo') {
                const a = this.pickups.create(px, py, 'ammo');
                a.pickupType = 'ammo';
            } else if (obj.type === 'keycard') {
                const k = this.pickups.create(px, py, 'keycard');
                k.pickupType = 'keycard';
            } else if (obj.type === 'shotgun') {
                const w = this.pickups.create(px, py, 'shotgun_pickup');
                w.pickupType = 'weapon';
                w.weaponName = 'shotgun';
            } else if (obj.type === 'rifle') {
                const w = this.pickups.create(px, py, 'rifle_pickup');
                w.pickupType = 'weapon';
                w.weaponName = 'rifle';
            } else if (obj.type === 'flamethrower') {
                const w = this.pickups.create(px, py, 'flamethrower_pickup');
                w.pickupType = 'weapon';
                w.weaponName = 'flamethrower';
            }
        });

        // Place enemies in rooms
        this.levelData.rooms.forEach((room, index) => {
            if (index === 0) return; // Starting room is empty
            room.enemies = [];
            const count = Math.floor(Math.random() * 4) + 2;
            for (let i = 0; i < count; i++) {
                const ex = room.x + 2 + Math.floor(Math.random() * (room.w - 4));
                const ey = room.y + 2 + Math.floor(Math.random() * (room.h - 4));
                room.enemies.push({
                    type: this.getEnemyType(),
                    x: ex,
                    y: ey
                });
            }
        });

        // Set player start
        const startRoom = this.levelData.rooms[0];
        this.playerStartX = (startRoom.x + startRoom.w / 2) * TILE_SIZE;
        this.playerStartY = (startRoom.y + startRoom.h / 2) * TILE_SIZE;

        // Set world bounds
        this.physics.world.setBounds(0, 0, this.levelData.width * TILE_SIZE, this.levelData.height * TILE_SIZE);
        this.cameras.main.setBounds(0, 0, this.levelData.width * TILE_SIZE, this.levelData.height * TILE_SIZE);
    }

    getEnemyType() {
        const level = this.currentLevel;
        const rand = Math.random();
        if (level === 1) {
            return 'drone';
        } else if (level === 2) {
            return rand < 0.7 ? 'drone' : 'brute';
        } else {
            return rand < 0.6 ? 'drone' : 'brute';
        }
    }

    generateLevel(level) {
        const width = 60 + level * 10;
        const height = 50 + level * 8;
        const tiles = [];
        const rooms = [];
        const objects = [];

        // Fill with walls
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = 1;
            }
        }

        // Generate rooms
        const roomCount = 8 + level * 3;
        for (let i = 0; i < roomCount; i++) {
            const rw = 8 + Math.floor(Math.random() * 6);
            const rh = 8 + Math.floor(Math.random() * 6);
            const rx = 2 + Math.floor(Math.random() * (width - rw - 4));
            const ry = 2 + Math.floor(Math.random() * (height - rh - 4));

            // Check overlap
            let overlap = false;
            for (const room of rooms) {
                if (rx < room.x + room.w + 2 && rx + rw + 2 > room.x &&
                    ry < room.y + room.h + 2 && ry + rh + 2 > room.y) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                rooms.push({ x: rx, y: ry, w: rw, h: rh, index: rooms.length });
                // Carve room
                for (let y = ry; y < ry + rh; y++) {
                    for (let x = rx; x < rx + rw; x++) {
                        tiles[y][x] = 0;
                    }
                }
            }
        }

        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const roomA = rooms[i];
            const roomB = rooms[i - 1];
            const ax = Math.floor(roomA.x + roomA.w / 2);
            const ay = Math.floor(roomA.y + roomA.h / 2);
            const bx = Math.floor(roomB.x + roomB.w / 2);
            const by = Math.floor(roomB.y + roomB.h / 2);

            // Horizontal then vertical
            for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (ay + dy >= 0 && ay + dy < height) tiles[ay + dy][x] = 0;
                }
            }
            for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (bx + dx >= 0 && bx + dx < width) tiles[y][bx + dx] = 0;
                }
            }
        }

        // Place keycard in middle room
        const keycardRoom = rooms[Math.floor(rooms.length / 2)];
        objects.push({
            type: 'keycard',
            x: keycardRoom.x + Math.floor(keycardRoom.w / 2),
            y: keycardRoom.y + Math.floor(keycardRoom.h / 2)
        });

        // Place exit door (blue) at last room
        const exitRoom = rooms[rooms.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w / 2);
        const exitY = exitRoom.y;
        tiles[exitY][exitX] = 3; // Blue door

        // Place weapons based on level
        if (level === 1) {
            const weaponRoom = rooms[Math.floor(rooms.length / 3)];
            objects.push({
                type: 'shotgun',
                x: weaponRoom.x + 2,
                y: weaponRoom.y + 2
            });
        } else if (level === 2) {
            const weaponRoom1 = rooms[Math.floor(rooms.length / 3)];
            const weaponRoom2 = rooms[Math.floor(rooms.length * 2 / 3)];
            objects.push({
                type: 'rifle',
                x: weaponRoom1.x + 2,
                y: weaponRoom1.y + 2
            });
            objects.push({
                type: 'flamethrower',
                x: weaponRoom2.x + 2,
                y: weaponRoom2.y + 2
            });
        }

        // Scatter health and ammo
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            if (Math.random() < 0.4) {
                objects.push({
                    type: 'health',
                    x: room.x + 1 + Math.floor(Math.random() * (room.w - 2)),
                    y: room.y + 1 + Math.floor(Math.random() * (room.h - 2))
                });
            }
            if (Math.random() < 0.5) {
                objects.push({
                    type: 'ammo',
                    x: room.x + 1 + Math.floor(Math.random() * (room.w - 2)),
                    y: room.y + 1 + Math.floor(Math.random() * (room.h - 2))
                });
            }
            // Add some crates and barrels
            if (Math.random() < 0.6) {
                objects.push({
                    type: Math.random() < 0.7 ? 'crate' : 'barrel',
                    x: room.x + 1 + Math.floor(Math.random() * (room.w - 2)),
                    y: room.y + 1 + Math.floor(Math.random() * (room.h - 2))
                });
            }
        }

        return { width, height, tiles, rooms, objects };
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.playerStartX, this.playerStartY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.health = this.playerData.health;
        this.player.maxHealth = this.playerData.maxHealth;
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Health bar background
        this.add.rectangle(110, 25, 200, 20, 0x333333).setScrollFactor(0).setDepth(99);
        this.healthBar = this.add.rectangle(10, 15, 200, 20, 0xff4444).setOrigin(0).setScrollFactor(0).setDepth(100);

        // Health text
        this.healthText = this.add.text(110, 25, '100/100', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Weapon info
        this.weaponText = this.add.text(10, 680, 'PISTOL', {
            fontSize: '18px',
            fill: '#ffff00'
        }).setScrollFactor(0).setDepth(100);

        this.ammoText = this.add.text(10, 700, '12/∞', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        // Level indicator
        this.add.text(640, 10, `LEVEL ${this.currentLevel}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

        // Keycard indicator
        this.keycardIcon = this.add.image(1240, 25, 'keycard').setScrollFactor(0).setDepth(100).setAlpha(0.3);
        this.keycardText = this.add.text(1210, 25, 'KEYCARD:', {
            fontSize: '14px',
            fill: '#0088ff'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);

        // Message text
        this.messageText = this.add.text(640, 600, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    createVision() {
        // Create darkness overlay
        this.darkness = this.add.graphics().setDepth(50);
        this.visionMask = this.make.graphics();
    }

    updateVision() {
        const px = this.player.x;
        const py = this.player.y;
        const angle = this.player.rotation;
        const visionRange = 350;
        const visionAngle = Math.PI / 3; // 60 degrees

        this.darkness.clear();
        this.darkness.fillStyle(0x000000, 0.85);
        this.darkness.fillRect(
            this.cameras.main.scrollX,
            this.cameras.main.scrollY,
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Draw vision cone (simple version - no raycasting for performance)
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.beginPath();
        this.darkness.moveTo(px, py);

        const steps = 30;
        for (let i = 0; i <= steps; i++) {
            const a = angle - visionAngle / 2 + (visionAngle * i / steps) - Math.PI / 2;
            const vx = px + Math.cos(a) * visionRange;
            const vy = py + Math.sin(a) * visionRange;
            this.darkness.lineTo(vx, vy);
        }

        this.darkness.closePath();
        this.darkness.fillPath();

        // Add small ambient circle around player
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.fillCircle(px, py, 60);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Player movement
        let vx = 0, vy = 0;
        const speed = this.keys.SHIFT.isDown ? SPRINT_SPEED : PLAYER_SPEED;

        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * speed, vy * speed);

        // Rotate player toward mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle + Math.PI / 2;

        // Shooting
        if (this.input.activePointer.isDown && !this.reloading) {
            this.shoot(time);
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.reload();
        }

        // Interact with doors
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.interactDoor();
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemy(enemy, delta);
        });

        // Check room entry
        this.checkRoomEntry();

        // Update vision
        this.updateVision();

        // Update HUD
        this.updateHUD();
    }

    shoot(time) {
        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        const weapon = this.weaponData[weaponName];

        if (time < this.lastFired + weapon.fireRate) return;

        // Check ammo
        if (weapon.mag <= 0) {
            if (time > this.lastAmmoMsg + 1000) {
                this.showMessage('OUT OF AMMO - Press R to reload');
                this.lastAmmoMsg = time;
            }
            return;
        }

        this.lastFired = time;
        weapon.mag--;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        if (weaponName === 'shotgun') {
            // Fire multiple pellets
            for (let i = 0; i < weapon.pellets; i++) {
                const spreadRad = Phaser.Math.DegToRad(weapon.spread);
                const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
                this.fireBullet(angle, weapon.speed, weapon.damage, 'pellet', 250);
            }
            this.cameras.main.shake(80, 0.004);
        } else if (weaponName === 'flamethrower') {
            const spreadRad = Phaser.Math.DegToRad(weapon.spread);
            const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
            this.fireBullet(angle, weapon.speed, weapon.damage, 'flame', 200);
            this.cameras.main.shake(30, 0.001);
        } else {
            const spreadRad = Phaser.Math.DegToRad(weapon.spread);
            const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
            this.fireBullet(angle, weapon.speed, weapon.damage, 'bullet', 500);
            this.cameras.main.shake(50, 0.002);
        }

        // Muzzle flash
        const flash = this.add.image(this.player.x, this.player.y, 'muzzle');
        flash.rotation = this.player.rotation;
        this.time.delayedCall(50, () => flash.destroy());
    }

    fireBullet(angle, speed, damage, texture, lifetime) {
        const bullet = this.bullets.create(this.player.x, this.player.y, texture);
        bullet.damage = damage;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.rotation = angle;
        this.time.delayedCall(lifetime, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    reload() {
        if (this.reloading) return;

        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        const weapon = this.weaponData[weaponName];

        if (weapon.infinite) {
            weapon.mag = weapon.magSize;
            this.showMessage('Reloaded');
            return;
        }

        const ammoType = weaponName === 'shotgun' ? 'shells' : (weaponName === 'rifle' ? 'rifle' : 'fuel');
        const ammoAvailable = this.playerData.ammo[ammoType];
        const needed = weapon.magSize - weapon.mag;

        if (ammoAvailable <= 0 && needed > 0) {
            this.showMessage('No ammo!');
            return;
        }

        this.reloading = true;
        this.showMessage('Reloading...');

        this.time.delayedCall(weapon.reloadTime, () => {
            const toLoad = Math.min(needed, ammoAvailable);
            weapon.mag += toLoad;
            this.playerData.ammo[ammoType] -= toLoad;
            this.reloading = false;
            this.showMessage('');
        });
    }

    switchWeapon() {
        if (this.playerData.weapons.length <= 1) return;
        this.playerData.currentWeapon = (this.playerData.currentWeapon + 1) % this.playerData.weapons.length;
        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        this.showMessage(`Switched to ${weaponName.toUpperCase()}`);
    }

    interactDoor() {
        const nearestDoor = this.physics.closest(this.player, this.doors.getChildren());
        if (!nearestDoor) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, nearestDoor.x, nearestDoor.y);
        if (dist > 60) return;

        if (nearestDoor.doorType === 'blue') {
            if (this.playerData.hasKeycard) {
                this.showMessage('Door unlocked!');
                nearestDoor.destroy();
                // Check if this leads to next level
                this.time.delayedCall(500, () => {
                    if (this.currentLevel < 3) {
                        this.scene.start('GameScene', {
                            level: this.currentLevel + 1,
                            playerData: this.playerData
                        });
                    } else {
                        this.scene.start('BossScene', { playerData: this.playerData });
                    }
                });
            } else {
                this.showMessage('Need Blue Keycard!');
            }
        } else {
            nearestDoor.destroy();
        }
    }

    bulletHitWall(bullet, wall) {
        bullet.destroy();
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.health -= bullet.damage;
        bullet.destroy();

        // Knockback
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);

        // Flash red
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.health <= 0) {
            this.spawnLoot(enemy.x, enemy.y, enemy.enemyType);
            enemy.destroy();
            this.showFloatingText(enemy.x, enemy.y, '+10 XP', '#00ff00');
        }
    }

    bulletHitDestructible(bullet, destructible) {
        destructible.health -= bullet.damage;
        bullet.destroy();

        if (destructible.health <= 0) {
            if (destructible.explosive) {
                // Explosion
                this.cameras.main.shake(200, 0.01);
                const explosion = this.add.circle(destructible.x, destructible.y, 80, 0xff4400, 0.8);
                this.time.delayedCall(200, () => explosion.destroy());

                // Damage nearby enemies
                this.enemies.getChildren().forEach(enemy => {
                    const dist = Phaser.Math.Distance.Between(destructible.x, destructible.y, enemy.x, enemy.y);
                    if (dist < 80) {
                        enemy.health -= 80;
                        if (enemy.health <= 0) {
                            this.spawnLoot(enemy.x, enemy.y, enemy.enemyType);
                            enemy.destroy();
                        }
                    }
                });

                // Damage player if close
                const playerDist = Phaser.Math.Distance.Between(destructible.x, destructible.y, this.player.x, this.player.y);
                if (playerDist < 80) {
                    this.damagePlayer(40);
                }
            } else {
                // Chance to drop item
                if (Math.random() < 0.3) {
                    const pickup = this.pickups.create(destructible.x, destructible.y, 'ammo');
                    pickup.pickupType = 'ammo';
                }
            }
            destructible.destroy();
        }
    }

    spawnLoot(x, y, enemyType) {
        if (Math.random() < (enemyType === 'brute' ? 0.4 : 0.2)) {
            const ammo = this.pickups.create(x, y, 'ammo');
            ammo.pickupType = 'ammo';
        }
        if (Math.random() < (enemyType === 'brute' ? 0.3 : 0.1)) {
            const health = this.pickups.create(x, y, 'health');
            health.pickupType = 'health';
            health.amount = enemyType === 'brute' ? 25 : 10;
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.pickupType;

        if (type === 'health') {
            if (this.player.health >= this.player.maxHealth) return;
            this.player.health = Math.min(this.player.maxHealth, this.player.health + pickup.amount);
            this.showFloatingText(pickup.x, pickup.y, `+${pickup.amount} HP`, '#ff4444');
        } else if (type === 'ammo') {
            this.playerData.ammo.shells += 8;
            this.playerData.ammo.rifle += 15;
            this.playerData.ammo.fuel += 25;
            this.showFloatingText(pickup.x, pickup.y, '+Ammo', '#ffcc00');
        } else if (type === 'keycard') {
            this.playerData.hasKeycard = true;
            this.keycardIcon.setAlpha(1);
            this.showFloatingText(pickup.x, pickup.y, 'KEYCARD', '#0088ff');
            this.showMessage('Got Blue Keycard!');
        } else if (type === 'weapon') {
            if (!this.playerData.weapons.includes(pickup.weaponName)) {
                this.playerData.weapons.push(pickup.weaponName);
                this.showFloatingText(pickup.x, pickup.y, pickup.weaponName.toUpperCase(), '#ff00ff');
                this.showMessage(`Got ${pickup.weaponName.toUpperCase()}!`);
                // Give starting ammo
                if (pickup.weaponName === 'shotgun') this.playerData.ammo.shells += 24;
                if (pickup.weaponName === 'rifle') this.playerData.ammo.rifle += 90;
                if (pickup.weaponName === 'flamethrower') this.playerData.ammo.fuel += 200;
            }
        }

        pickup.destroy();
    }

    playerHitEnemy(player, enemy) {
        if (enemy.attackCooldown && enemy.attackCooldown > this.time.now) return;

        const damage = enemy.enemyType === 'brute' ? 30 : 10;
        this.damagePlayer(damage);
        enemy.attackCooldown = this.time.now + 1000;

        // Knockback player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    damagePlayer(amount) {
        this.player.health -= amount;
        this.cameras.main.shake(100, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.player.active) this.player.clearTint();
        });

        if (this.player.health <= 0) {
            this.player.health = 0;
            this.playerDeath();
        }
    }

    playerDeath() {
        this.player.setActive(false);
        this.showMessage('YOU DIED');

        this.time.delayedCall(2000, () => {
            this.scene.start('GameScene', { level: this.currentLevel });
        });
    }

    updateEnemy(enemy, delta) {
        if (!enemy.active) return;

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Face player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.rotation = angle;

        // Move toward player if in range
        const detectionRange = enemy.enemyType === 'brute' ? 250 : 300;
        const speed = enemy.enemyType === 'brute' ? 60 : 120;

        if (dist < detectionRange && dist > 30) {
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else if (dist <= 30) {
            enemy.setVelocity(0, 0);
        }
    }

    checkRoomEntry() {
        const px = Math.floor(this.player.x / TILE_SIZE);
        const py = Math.floor(this.player.y / TILE_SIZE);

        for (const room of this.levelData.rooms) {
            if (px >= room.x && px < room.x + room.w &&
                py >= room.y && py < room.y + room.h) {

                const roomKey = `${room.x},${room.y}`;
                if (!this.roomsCleared.has(roomKey) && room.enemies && room.enemies.length > 0) {
                    this.roomsCleared.add(roomKey);
                    // Spawn enemies
                    room.enemies.forEach(e => {
                        const ex = e.x * TILE_SIZE + TILE_SIZE / 2;
                        const ey = e.y * TILE_SIZE + TILE_SIZE / 2;
                        this.spawnEnemy(e.type, ex, ey);
                    });
                }
                break;
            }
        }
    }

    spawnEnemy(type, x, y) {
        const texture = type === 'brute' ? 'brute' : 'drone';
        const enemy = this.enemies.create(x, y, texture);
        enemy.enemyType = type;
        enemy.health = type === 'brute' ? 100 : 20;
        enemy.setCollideWorldBounds(true);

        if (type === 'brute') {
            enemy.setScale(0.8);
        }
    }

    showMessage(text) {
        this.messageText.setText(text);
        if (text) {
            this.time.delayedCall(2000, () => {
                if (this.messageText.text === text) this.messageText.setText('');
            });
        }
    }

    showFloatingText(x, y, text, color) {
        const ft = this.add.text(x, y - 20, text, {
            fontSize: '16px',
            fill: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: ft,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => ft.destroy()
        });
    }

    updateHUD() {
        // Health bar
        const healthPercent = this.player.health / this.player.maxHealth;
        this.healthBar.width = 200 * healthPercent;
        this.healthText.setText(`${Math.floor(this.player.health)}/${this.player.maxHealth}`);

        // Weapon
        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        const weapon = this.weaponData[weaponName];
        this.weaponText.setText(weaponName.toUpperCase());

        if (weapon.infinite) {
            this.ammoText.setText(`${weapon.mag}/∞`);
        } else {
            const ammoType = weaponName === 'shotgun' ? 'shells' : (weaponName === 'rifle' ? 'rifle' : 'fuel');
            this.ammoText.setText(`${weapon.mag}/${weapon.magSize} | ${this.playerData.ammo[ammoType]}`);
        }

        // Keycard
        this.keycardIcon.setAlpha(this.playerData.hasKeycard ? 1 : 0.3);
    }
}

// ==================== BOSS SCENE ====================
class BossScene extends Phaser.Scene {
    constructor() {
        super('BossScene');
    }

    init(data) {
        this.playerData = data.playerData;
    }

    create() {
        // Create boss arena
        const arenaSize = 640;
        const offsetX = (1280 - arenaSize) / 2;
        const offsetY = (720 - arenaSize) / 2;

        // Floor
        for (let y = 0; y < arenaSize; y += 32) {
            for (let x = 0; x < arenaSize; x += 32) {
                this.add.image(offsetX + x + 16, offsetY + y + 16, 'floor');
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();
        for (let i = 0; i < arenaSize; i += 32) {
            this.walls.create(offsetX + i + 16, offsetY - 16, 'wall');
            this.walls.create(offsetX + i + 16, offsetY + arenaSize + 16, 'wall');
            this.walls.create(offsetX - 16, offsetY + i + 16, 'wall');
            this.walls.create(offsetX + arenaSize + 16, offsetY + i + 16, 'wall');
        }

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.queenBullets = this.physics.add.group();

        // Player
        this.player = this.physics.add.sprite(640, 600, 'player');
        this.player.health = this.playerData.health;
        this.player.maxHealth = this.playerData.maxHealth;
        this.player.setCollideWorldBounds(true);

        // Queen
        this.queen = this.physics.add.sprite(640, 200, 'queen');
        this.queen.health = 500;
        this.queen.maxHealth = 500;
        this.queen.phase = 1;
        this.queen.lastAttack = 0;

        // Weapon data
        this.weaponData = {
            pistol: { damage: 15, fireRate: 250, spread: 3, speed: 800, magSize: 12, mag: 12, infinite: true },
            shotgun: { damage: 8, pellets: 6, fireRate: 833, spread: 25, speed: 600, magSize: 8, mag: 8 },
            rifle: { damage: 20, fireRate: 166, spread: 5, speed: 850, magSize: 30, mag: 30 },
            flamethrower: { damage: 5, fireRate: 50, spread: 15, speed: 400, magSize: 100, mag: 100 }
        };

        this.lastFired = 0;

        // Controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            Q: Phaser.Input.Keyboard.KeyCodes.Q
        });

        this.input.keyboard.on('keydown-Q', () => {
            this.playerData.currentWeapon = (this.playerData.currentWeapon + 1) % this.playerData.weapons.length;
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.queen, this.walls);
        this.physics.add.overlap(this.bullets, this.queen, this.bulletHitQueen, null, this);
        this.physics.add.overlap(this.queenBullets, this.player, this.queenBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.queen, this.playerHitQueen, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);

        // HUD
        this.createHUD();

        // Boss title
        this.add.text(640, 50, 'THE QUEEN', {
            fontSize: '32px',
            fill: '#ff00ff'
        }).setOrigin(0.5);

        // Queen health bar
        this.add.rectangle(640, 80, 404, 24, 0x333333);
        this.queenHealthBar = this.add.rectangle(440, 80, 400, 20, 0x8800ff).setOrigin(0, 0.5);
    }

    createHUD() {
        this.add.rectangle(110, 680, 200, 20, 0x333333);
        this.healthBar = this.add.rectangle(10, 670, 200, 20, 0xff4444).setOrigin(0);
        this.healthText = this.add.text(110, 680, '', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
        this.weaponText = this.add.text(10, 700, '', { fontSize: '16px', fill: '#ffff00' });
    }

    update(time) {
        // Player movement
        let vx = 0, vy = 0;
        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }
        this.player.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

        // Aim
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.rotation = angle + Math.PI / 2;

        // Shoot
        if (pointer.isDown) {
            this.shoot(time);
        }

        // Queen AI
        this.updateQueen(time);

        // Update HUD
        const healthPercent = this.player.health / this.player.maxHealth;
        this.healthBar.width = 200 * healthPercent;
        this.healthText.setText(`${Math.floor(this.player.health)}/${this.player.maxHealth}`);

        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        this.weaponText.setText(weaponName.toUpperCase());

        // Queen health
        const queenPercent = this.queen.health / this.queen.maxHealth;
        this.queenHealthBar.width = 400 * queenPercent;

        // Phase check
        if (this.queen.health < 250 && this.queen.phase === 1) {
            this.queen.phase = 2;
            this.queen.setTint(0xff4400);
            // Spawn some drones
            for (let i = 0; i < 3; i++) {
                const drone = this.enemies.create(640 + (i - 1) * 100, 300, 'drone');
                drone.health = 20;
                drone.enemyType = 'drone';
            }
        }
    }

    shoot(time) {
        const weaponName = this.playerData.weapons[this.playerData.currentWeapon];
        const weapon = this.weaponData[weaponName];

        if (time < this.lastFired + weapon.fireRate) return;
        if (weapon.mag <= 0) return;

        this.lastFired = time;
        weapon.mag--;

        const pointer = this.input.activePointer;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        if (weaponName === 'shotgun') {
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = Phaser.Math.DegToRad(weapon.spread);
                const angle = baseAngle + (Math.random() - 0.5) * spread;
                const bullet = this.bullets.create(this.player.x, this.player.y, 'pellet');
                bullet.damage = weapon.damage;
                bullet.setVelocity(Math.cos(angle) * weapon.speed, Math.sin(angle) * weapon.speed);
                this.time.delayedCall(300, () => { if (bullet.active) bullet.destroy(); });
            }
        } else {
            const spread = Phaser.Math.DegToRad(weapon.spread);
            const angle = baseAngle + (Math.random() - 0.5) * spread;
            const texture = weaponName === 'flamethrower' ? 'flame' : 'bullet';
            const bullet = this.bullets.create(this.player.x, this.player.y, texture);
            bullet.damage = weapon.damage;
            bullet.setVelocity(Math.cos(angle) * weapon.speed, Math.sin(angle) * weapon.speed);
            this.time.delayedCall(500, () => { if (bullet.active) bullet.destroy(); });
        }

        this.cameras.main.shake(50, 0.002);
    }

    updateQueen(time) {
        if (this.queen.health <= 0) return;

        const dist = Phaser.Math.Distance.Between(this.queen.x, this.queen.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(this.queen.x, this.queen.y, this.player.x, this.player.y);

        // Move toward player
        const speed = this.queen.phase === 2 ? 100 : 80;
        if (dist > 150) {
            this.queen.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else {
            this.queen.setVelocity(0, 0);
        }

        // Attack
        const attackCooldown = this.queen.phase === 2 ? 1500 : 2000;
        if (time > this.queen.lastAttack + attackCooldown) {
            this.queen.lastAttack = time;
            // Acid spit
            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 0.2;
                const bullet = this.queenBullets.create(this.queen.x, this.queen.y, 'flame');
                bullet.setTint(0x00ff00);
                bullet.setVelocity(Math.cos(angle + spread) * 300, Math.sin(angle + spread) * 300);
                this.time.delayedCall(1000, () => { if (bullet.active) bullet.destroy(); });
            }
        }

        // Rotate to face player
        this.queen.rotation = angle;
    }

    bulletHitQueen(bullet, queen) {
        queen.health -= bullet.damage * 0.8; // 20% armor
        bullet.destroy();

        queen.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (queen.active) queen.setTint(queen.phase === 2 ? 0xff4400 : 0xffffff);
        });

        if (queen.health <= 0) {
            this.queenDefeated();
        }
    }

    queenBulletHitPlayer(player, bullet) {
        this.player.health -= 15;
        bullet.destroy();
        this.cameras.main.shake(100, 0.01);

        if (this.player.health <= 0) {
            this.scene.start('GameScene', { level: 3 });
        }
    }

    playerHitQueen(player, queen) {
        if (queen.attackCooldown && queen.attackCooldown > this.time.now) return;
        this.player.health -= 25;
        queen.attackCooldown = this.time.now + 1000;

        const angle = Phaser.Math.Angle.Between(queen.x, queen.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        if (this.player.health <= 0) {
            this.scene.start('GameScene', { level: 3 });
        }
    }

    playerHitEnemy(player, enemy) {
        if (enemy.attackCooldown && enemy.attackCooldown > this.time.now) return;
        this.player.health -= 10;
        enemy.attackCooldown = this.time.now + 1000;

        if (this.player.health <= 0) {
            this.scene.start('GameScene', { level: 3 });
        }
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.health -= bullet.damage;
        bullet.destroy();

        if (enemy.health <= 0) {
            enemy.destroy();
        }
    }

    queenDefeated() {
        this.queen.destroy();

        this.add.text(640, 360, 'QUEEN DEFEATED!', {
            fontSize: '48px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            this.scene.start('VictoryScene');
        });
    }
}

// ==================== VICTORY SCENE ====================
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 100, 'ESCAPED!', {
            fontSize: '64px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'You defeated the Queen and escaped the station!', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const playAgain = this.add.text(cx, cy + 100, '[ PLAY AGAIN ]', {
            fontSize: '28px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerover', () => playAgain.setFill('#88ff88'));
        playAgain.on('pointerout', () => playAgain.setFill('#00ff00'));
        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config and start game
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#111111',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, BossScene, VictoryScene]
};

const game = new Phaser.Game(config);
