// Derelict - Survival Horror
// Built with Phaser 3

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// ==================== BOOT SCENE ====================
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Player
        g.clear();
        g.fillStyle(0x44aaff);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x88ccff);
        g.fillCircle(16, 12, 6);
        g.generateTexture('player', 32, 32);

        // Floor
        g.clear();
        g.fillStyle(0x2a2a2a);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x222222);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        // Wall
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x333333);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('wall', 32, 32);

        // Door
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x888888);
        g.fillRect(12, 4, 8, 24);
        g.generateTexture('door', 32, 32);

        // Crawler enemy
        g.clear();
        g.fillStyle(0x884422);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0xff4444);
        g.fillCircle(8, 10, 3);
        g.fillCircle(16, 10, 3);
        g.generateTexture('crawler', 24, 24);

        // Shambler enemy
        g.clear();
        g.fillStyle(0x446644);
        g.fillCircle(16, 18, 14);
        g.fillStyle(0x668866);
        g.fillCircle(16, 12, 8);
        g.fillStyle(0xff4444);
        g.fillCircle(12, 10, 3);
        g.fillCircle(20, 10, 3);
        g.generateTexture('shambler', 32, 36);

        // Stalker enemy
        g.clear();
        g.fillStyle(0x222244);
        g.fillCircle(12, 16, 8);
        g.fillCircle(12, 8, 6);
        g.fillStyle(0xff00ff);
        g.fillCircle(10, 6, 2);
        g.fillCircle(14, 6, 2);
        g.generateTexture('stalker', 24, 24);

        // Boss
        g.clear();
        g.fillStyle(0x880044);
        g.fillCircle(48, 48, 44);
        g.fillStyle(0xaa0066);
        g.fillCircle(48, 48, 30);
        g.fillStyle(0xffff00);
        g.fillCircle(36, 40, 6);
        g.fillCircle(60, 40, 6);
        g.fillStyle(0xff0000);
        g.fillRect(38, 56, 20, 8);
        g.generateTexture('boss', 96, 96);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // O2 canister
        g.clear();
        g.fillStyle(0x00aaff);
        g.fillRoundedRect(4, 0, 12, 20, 4);
        g.fillStyle(0x0088cc);
        g.fillRect(6, 4, 8, 12);
        g.generateTexture('o2', 20, 20);

        // Health kit
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 20, 20);
        g.fillStyle(0xff0000);
        g.fillRect(8, 2, 4, 16);
        g.fillRect(2, 8, 16, 4);
        g.generateTexture('medkit', 20, 20);

        // Pipe weapon
        g.clear();
        g.fillStyle(0x888888);
        g.fillRect(0, 10, 28, 6);
        g.generateTexture('pipe', 28, 26);

        // Pistol
        g.clear();
        g.fillStyle(0x333333);
        g.fillRect(0, 8, 20, 8);
        g.fillRect(4, 12, 6, 12);
        g.generateTexture('pistol', 20, 24);

        // Shotgun
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(0, 10, 32, 6);
        g.fillStyle(0x8b4513);
        g.fillRect(22, 8, 10, 10);
        g.generateTexture('shotgun', 32, 26);

        // Escape pod
        g.clear();
        g.fillStyle(0x00ff00);
        g.fillRoundedRect(0, 0, 48, 32, 8);
        g.fillStyle(0x00aa00);
        g.fillRect(10, 8, 28, 16);
        g.generateTexture('escape_pod', 48, 32);

        // Spaceship (for space mode)
        g.clear();
        g.fillStyle(0x6688aa);
        g.fillTriangle(24, 0, 0, 40, 48, 40);
        g.fillStyle(0x88aacc);
        g.fillTriangle(24, 8, 8, 36, 40, 36);
        g.generateTexture('spaceship', 48, 40);

        // Derelict ship (for space mode)
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(10, 0, 80, 60);
        g.fillStyle(0x333333);
        g.fillRect(20, 10, 60, 40);
        g.fillStyle(0x884400);
        g.fillCircle(50, 30, 10);
        g.generateTexture('derelict', 100, 60);

        g.destroy();
    }
}

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.text(cx, cy - 150, 'DERELICT', {
            fontSize: '56px',
            fill: '#44aaff',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 80, 'Survive the dying ships...', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 20, 'WASD - Move  |  Mouse - Aim  |  Click - Attack', {
            fontSize: '14px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 10, 'F - Flashlight  |  E - Interact  |  SHIFT - Run', {
            fontSize: '14px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, 'WARNING: Oxygen depletes constantly!', {
            fontSize: '16px',
            fill: '#ff4444'
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 120, '[ ENTER THE DERELICT ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#00ff00'));
        startBtn.on('pointerdown', () => this.scene.start('ShipScene', { shipNumber: 1 }));
    }
}

// ==================== SHIP SCENE ====================
class ShipScene extends Phaser.Scene {
    constructor() {
        super('ShipScene');
    }

    init(data) {
        this.shipNumber = data.shipNumber || 1;
        this.playerData = data.playerData || {
            hp: 100,
            maxHP: 100,
            o2: 100,
            maxO2: 100,
            weapon: 'pipe',
            ammo: { '9mm': 0, shells: 0 },
            inventory: []
        };
    }

    create() {
        // Generate ship layout
        this.generateShip();

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.doors = this.physics.add.staticGroup();

        // Render ship
        this.renderShip();

        // Create player
        this.player = this.physics.add.sprite(this.playerStart.x, this.playerStart.y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Vision cone graphics
        this.visionMask = this.add.graphics().setDepth(100);

        // Controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            F: Phaser.Input.Keyboard.KeyCodes.F,
            E: Phaser.Input.Keyboard.KeyCodes.E,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // O2 timer
        this.o2Timer = 0;
        this.lastDamageTime = 0;

        // Weapon stats
        this.weaponStats = {
            pipe: { damage: 20, rate: 600, melee: true },
            pistol: { damage: 25, rate: 500, melee: false, ammoType: '9mm' },
            shotgun: { damage: 40, rate: 1000, melee: false, ammoType: 'shells', pellets: 5 }
        };

        this.lastFired = 0;
        this.flashlightOn = true;

        // Create HUD
        this.createHUD();

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    generateShip() {
        const roomCount = this.shipNumber === 1 ? 5 : (this.shipNumber === 2 ? 7 : 9);
        this.shipWidth = 25;
        this.shipHeight = 20;
        this.tiles = [];
        this.rooms = [];

        // Initialize with walls
        for (let y = 0; y < this.shipHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.shipWidth; x++) {
                this.tiles[y][x] = 1; // Wall
            }
        }

        // Generate rooms
        const startRoom = { x: 2, y: 8, w: 5, h: 4, type: 'start' };
        this.rooms.push(startRoom);
        this.carveRoom(startRoom);

        let lastRoom = startRoom;
        for (let i = 1; i < roomCount; i++) {
            const room = this.generateAdjacentRoom(lastRoom, i === roomCount - 1 ? 'exit' : 'normal');
            if (room) {
                this.rooms.push(room);
                this.carveRoom(room);
                this.connectRooms(lastRoom, room);
                lastRoom = room;
            }
        }

        // Player start
        this.playerStart = {
            x: (startRoom.x + startRoom.w / 2) * TILE_SIZE,
            y: (startRoom.y + startRoom.h / 2) * TILE_SIZE
        };

        // Exit position
        const exitRoom = this.rooms[this.rooms.length - 1];
        this.exitPos = {
            x: (exitRoom.x + exitRoom.w / 2) * TILE_SIZE,
            y: (exitRoom.y + exitRoom.h / 2) * TILE_SIZE
        };

        // Generate enemies
        this.enemySpawns = [];
        const enemyCount = this.shipNumber === 1 ? 3 : (this.shipNumber === 2 ? 6 : 8);
        for (let i = 0; i < enemyCount; i++) {
            const room = this.rooms[1 + Math.floor(Math.random() * (this.rooms.length - 2))];
            if (room) {
                this.enemySpawns.push({
                    x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
                    y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE,
                    type: this.getEnemyType()
                });
            }
        }

        // Boss on ship 3
        if (this.shipNumber === 3) {
            this.enemySpawns.push({
                x: this.exitPos.x,
                y: this.exitPos.y - 60,
                type: 'boss'
            });
        }

        // Generate pickups
        this.pickupSpawns = [];
        for (let i = 1; i < this.rooms.length - 1; i++) {
            const room = this.rooms[i];
            if (Math.random() < 0.6) {
                this.pickupSpawns.push({
                    x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
                    y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE,
                    type: Math.random() < 0.6 ? 'o2' : 'medkit'
                });
            }
        }

        // Place weapons
        if (this.shipNumber === 1) {
            this.pickupSpawns.push({
                x: (this.rooms[2].x + this.rooms[2].w / 2) * TILE_SIZE,
                y: (this.rooms[2].y + this.rooms[2].h / 2) * TILE_SIZE,
                type: 'pistol'
            });
        } else if (this.shipNumber === 2) {
            this.pickupSpawns.push({
                x: (this.rooms[3].x + this.rooms[3].w / 2) * TILE_SIZE,
                y: (this.rooms[3].y + this.rooms[3].h / 2) * TILE_SIZE,
                type: 'shotgun'
            });
        }
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < this.shipHeight && x >= 0 && x < this.shipWidth) {
                    this.tiles[y][x] = 0;
                }
            }
        }
    }

    generateAdjacentRoom(lastRoom, type) {
        const directions = [
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        Phaser.Utils.Array.Shuffle(directions);

        for (const dir of directions) {
            const w = 4 + Math.floor(Math.random() * 3);
            const h = 3 + Math.floor(Math.random() * 3);
            let x, y;

            if (dir.dx > 0) {
                x = lastRoom.x + lastRoom.w + 2;
                y = lastRoom.y + Math.floor(lastRoom.h / 2) - Math.floor(h / 2);
            } else if (dir.dy > 0) {
                x = lastRoom.x + Math.floor(lastRoom.w / 2) - Math.floor(w / 2);
                y = lastRoom.y + lastRoom.h + 2;
            } else {
                x = lastRoom.x + Math.floor(lastRoom.w / 2) - Math.floor(w / 2);
                y = lastRoom.y - h - 2;
            }

            if (x >= 1 && x + w < this.shipWidth - 1 &&
                y >= 1 && y + h < this.shipHeight - 1) {
                return { x, y, w, h, type };
            }
        }

        return null;
    }

    connectRooms(roomA, roomB) {
        const ax = Math.floor(roomA.x + roomA.w / 2);
        const ay = Math.floor(roomA.y + roomA.h / 2);
        const bx = Math.floor(roomB.x + roomB.w / 2);
        const by = Math.floor(roomB.y + roomB.h / 2);

        // Horizontal corridor
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
            if (ay >= 0 && ay < this.shipHeight && x >= 0 && x < this.shipWidth) {
                this.tiles[ay][x] = 0;
                if (ay > 0) this.tiles[ay - 1][x] = 0;
            }
        }

        // Vertical corridor
        for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
            if (y >= 0 && y < this.shipHeight && bx >= 0 && bx < this.shipWidth) {
                this.tiles[y][bx] = 0;
                if (bx > 0) this.tiles[y][bx - 1] = 0;
            }
        }
    }

    getEnemyType() {
        if (this.shipNumber === 1) return 'crawler';
        if (this.shipNumber === 2) return Math.random() < 0.6 ? 'shambler' : 'crawler';
        return Math.random() < 0.4 ? 'stalker' : (Math.random() < 0.5 ? 'shambler' : 'crawler');
    }

    renderShip() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.shipWidth * TILE_SIZE, this.shipHeight * TILE_SIZE);
        this.cameras.main.setBounds(0, 0, this.shipWidth * TILE_SIZE, this.shipHeight * TILE_SIZE);

        // Render tiles
        for (let y = 0; y < this.shipHeight; y++) {
            for (let x = 0; x < this.shipWidth; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (this.tiles[y][x] === 1) {
                    this.walls.create(px, py, 'wall');
                } else {
                    this.add.image(px, py, 'floor');
                }
            }
        }

        // Spawn enemies
        this.enemySpawns.forEach(spawn => {
            this.spawnEnemy(spawn.type, spawn.x, spawn.y);
        });

        // Spawn pickups
        this.pickupSpawns.forEach(spawn => {
            const pickup = this.pickups.create(spawn.x, spawn.y, spawn.type);
            pickup.pickupType = spawn.type;
        });

        // Escape pod
        const escapePod = this.pickups.create(this.exitPos.x, this.exitPos.y, 'escape_pod');
        escapePod.pickupType = 'escape_pod';
    }

    spawnEnemy(type, x, y) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;

        const stats = {
            crawler: { hp: 30, damage: 15, speed: 80 },
            shambler: { hp: 60, damage: 25, speed: 50 },
            stalker: { hp: 45, damage: 20, speed: 150 },
            boss: { hp: 150, damage: 35, speed: 80 }
        };

        const s = stats[type] || stats.crawler;
        enemy.hp = s.hp;
        enemy.maxHp = s.hp;
        enemy.damage = s.damage;
        enemy.speed = s.speed;
        enemy.lastAttack = 0;

        if (type === 'boss') {
            enemy.setScale(1.5);
            enemy.spawned = false;
        }
    }

    createHUD() {
        // O2 bar
        this.add.rectangle(110, 20, 204, 24, 0x333333).setScrollFactor(0).setDepth(200);
        this.o2Bar = this.add.rectangle(10, 20, 200, 20, 0x00aaff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
        this.add.text(10, 5, 'O2', { fontSize: '12px', fill: '#00aaff' }).setScrollFactor(0).setDepth(201);

        // HP bar
        this.add.rectangle(110, 50, 204, 24, 0x333333).setScrollFactor(0).setDepth(200);
        this.hpBar = this.add.rectangle(10, 50, 200, 20, 0xff4444).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
        this.add.text(10, 35, 'HP', { fontSize: '12px', fill: '#ff4444' }).setScrollFactor(0).setDepth(201);

        // Weapon/Ammo
        this.weaponText = this.add.text(10, GAME_HEIGHT - 40, '', {
            fontSize: '16px',
            fill: '#ffff00'
        }).setScrollFactor(0).setDepth(201);

        // Ship number
        this.add.text(GAME_WIDTH - 10, 10, `Ship ${this.shipNumber}/3`, {
            fontSize: '16px',
            fill: '#aaaaaa'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(201);

        // Message
        this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // O2 drain
        this.o2Timer += delta;
        const drainRate = this.keys.SHIFT.isDown ? 750 : (this.player.body.velocity.length() > 10 ? 1500 : 2000);
        if (this.o2Timer >= drainRate) {
            this.o2Timer = 0;
            this.playerData.o2 = Math.max(0, this.playerData.o2 - 1);

            if (this.playerData.o2 <= 0) {
                this.playerDeath('suffocation');
                return;
            }
        }

        // Movement
        const speed = this.keys.SHIFT.isDown ? 200 : 120;
        let vx = 0, vy = 0;

        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * speed, vy * speed);

        // Face mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Attack
        if (this.input.activePointer.isDown) {
            this.attack(time);
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemy(enemy, time);
        });

        // Update vision
        this.updateVision();

        // Update HUD
        this.updateHUD();

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.interact();
        }
    }

    attack(time) {
        const weapon = this.weaponStats[this.playerData.weapon];
        if (time - this.lastFired < weapon.rate) return;

        this.lastFired = time;

        if (weapon.melee) {
            // Melee attack - check enemies in front
            const angle = this.player.rotation;
            const range = 50;

            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));

                if (dist < range && angleDiff < Math.PI / 4) {
                    this.damageEnemy(enemy, weapon.damage);
                }
            });

            // O2 cost
            this.playerData.o2 = Math.max(0, this.playerData.o2 - 2);
        } else {
            // Ranged attack
            if (this.playerData.ammo[weapon.ammoType] <= 0) {
                this.showMessage('No ammo!');
                return;
            }

            this.playerData.ammo[weapon.ammoType]--;

            if (weapon.pellets) {
                // Shotgun spread
                for (let i = 0; i < weapon.pellets; i++) {
                    const spread = (i - 2) * 0.1;
                    this.fireBullet(this.player.rotation + spread, weapon.damage / 2);
                }
            } else {
                this.fireBullet(this.player.rotation, weapon.damage);
            }
        }
    }

    fireBullet(angle, damage) {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        bullet.damage = damage;
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        this.time.delayedCall(1000, () => { if (bullet.active) bullet.destroy(); });
    }

    updateEnemy(enemy, time) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

        // Check if in vision cone
        const angle = this.player.rotation;
        const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
        enemy.setVisible(dist < 300 && angleDiff < Math.PI / 4);

        // AI - chase if in range
        const detectionRange = enemy.enemyType === 'stalker' ? 350 : 250;
        if (dist < detectionRange) {
            const moveAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.setVelocity(Math.cos(moveAngle) * enemy.speed, Math.sin(moveAngle) * enemy.speed);
        } else {
            enemy.setVelocity(0, 0);
        }
    }

    bulletHitEnemy(bullet, enemy) {
        this.damageEnemy(enemy, bullet.damage);
        bullet.destroy();
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });

        if (enemy.hp <= 0) {
            // Boss spawns crawlers at 50%
            if (enemy.enemyType === 'boss' && !enemy.spawned && enemy.hp < enemy.maxHp / 2) {
                enemy.spawned = true;
                this.spawnEnemy('crawler', enemy.x - 40, enemy.y);
                this.spawnEnemy('crawler', enemy.x + 40, enemy.y);
            }

            if (enemy.hp <= 0) {
                enemy.destroy();
            }
        }
    }

    playerHitEnemy(player, enemy) {
        const now = this.time.now;
        if (now - this.lastDamageTime < 1000) return;
        this.lastDamageTime = now;

        this.playerData.hp -= enemy.damage;
        this.cameras.main.shake(100, 0.01);

        if (this.playerData.hp <= 0) {
            this.playerDeath('death');
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.pickupType;

        if (type === 'o2') {
            this.playerData.o2 = Math.min(this.playerData.maxO2, this.playerData.o2 + 25);
            this.showMessage('+25 O2');
        } else if (type === 'medkit') {
            this.playerData.hp = Math.min(this.playerData.maxHP, this.playerData.hp + 30);
            this.showMessage('+30 HP');
        } else if (type === 'pistol') {
            this.playerData.weapon = 'pistol';
            this.playerData.ammo['9mm'] += 24;
            this.showMessage('Found Pistol!');
        } else if (type === 'shotgun') {
            this.playerData.weapon = 'shotgun';
            this.playerData.ammo['shells'] += 12;
            this.showMessage('Found Shotgun!');
        } else if (type === 'escape_pod') {
            if (this.shipNumber < 3) {
                this.scene.start('SpaceScene', {
                    shipNumber: this.shipNumber,
                    playerData: this.playerData
                });
            } else {
                // Check if boss is dead
                const bossAlive = this.enemies.getChildren().some(e => e.enemyType === 'boss');
                if (bossAlive) {
                    this.showMessage('Defeat the boss first!');
                    return;
                }
                this.scene.start('VictoryScene');
            }
            return;
        }

        pickup.destroy();
    }

    showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(2000, () => {
            if (this.messageText.text === text) this.messageText.setText('');
        });
    }

    interact() {
        // Check for nearby interactables
    }

    updateVision() {
        this.visionMask.clear();

        // Draw darkness
        this.visionMask.fillStyle(0x000000, 0.7);
        this.visionMask.fillRect(
            this.cameras.main.scrollX - 50,
            this.cameras.main.scrollY - 50,
            GAME_WIDTH + 100,
            GAME_HEIGHT + 100
        );

        // Cut out vision cone
        const px = this.player.x;
        const py = this.player.y;
        const angle = this.player.rotation;
        const range = 300;
        const halfAngle = Math.PI / 4; // 45 degrees each side

        this.visionMask.fillStyle(0x000000, 0);

        this.visionMask.beginPath();
        this.visionMask.moveTo(px, py);

        for (let a = -halfAngle; a <= halfAngle; a += 0.05) {
            const vx = px + Math.cos(angle + a) * range;
            const vy = py + Math.sin(angle + a) * range;
            this.visionMask.lineTo(vx, vy);
        }

        this.visionMask.closePath();
        this.visionMask.fillPath();

        // Small ambient circle
        this.visionMask.fillCircle(px, py, 40);
    }

    updateHUD() {
        const o2Percent = this.playerData.o2 / this.playerData.maxO2;
        this.o2Bar.width = 200 * o2Percent;
        this.o2Bar.fillColor = o2Percent < 0.2 ? 0xff4444 : 0x00aaff;

        const hpPercent = this.playerData.hp / this.playerData.maxHP;
        this.hpBar.width = 200 * hpPercent;

        const weapon = this.playerData.weapon;
        const ammoType = this.weaponStats[weapon]?.ammoType;
        const ammo = ammoType ? this.playerData.ammo[ammoType] : '∞';
        this.weaponText.setText(`${weapon.toUpperCase()} | Ammo: ${ammo}`);
    }

    playerDeath(cause) {
        this.player.setActive(false);
        this.player.setVisible(false);

        const msg = cause === 'suffocation'
            ? 'Your lungs burned for oxygen that never came.'
            : 'Your body joins the ship\'s other victims.';

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, msg, {
            fontSize: '16px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }
}

// ==================== SPACE SCENE ====================
class SpaceScene extends Phaser.Scene {
    constructor() {
        super('SpaceScene');
    }

    init(data) {
        this.shipNumber = data.shipNumber || 1;
        this.playerData = data.playerData;
    }

    create() {
        // Starfield background
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const size = Math.random() * 2 + 1;
            this.add.circle(x, y, size, 0xffffff, Math.random() * 0.5 + 0.5);
        }

        // Player ship
        this.playerShip = this.physics.add.sprite(100, GAME_HEIGHT / 2, 'spaceship');
        this.playerShip.setCollideWorldBounds(true);

        // Derelict ships
        this.derelicts = this.physics.add.group();

        // Next derelict
        const nextDerelict = this.derelicts.create(600, GAME_HEIGHT / 2, 'derelict');
        nextDerelict.shipNumber = this.shipNumber + 1;

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Collision
        this.physics.add.overlap(this.playerShip, this.derelicts, this.dockWithShip, null, this);

        // HUD
        this.add.text(GAME_WIDTH / 2, 30, 'Navigate to the next derelict ship', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Arrow keys to move, approach ship to dock', {
            fontSize: '14px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // O2 display
        this.o2Text = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#00aaff'
        });

        // O2 drain in space
        this.o2Timer = 0;
    }

    update(time, delta) {
        // O2 drain (slower in ship)
        this.o2Timer += delta;
        if (this.o2Timer >= 3000) {
            this.o2Timer = 0;
            this.playerData.o2 = Math.max(0, this.playerData.o2 - 1);

            if (this.playerData.o2 <= 0) {
                this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'OUT OF OXYGEN', {
                    fontSize: '48px',
                    fill: '#ff0000'
                }).setOrigin(0.5);
                this.time.delayedCall(2000, () => this.scene.start('MenuScene'));
                return;
            }
        }

        // Movement
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        this.playerShip.setVelocity(vx * 150, vy * 150);

        if (vx !== 0 || vy !== 0) {
            this.playerShip.rotation = Math.atan2(vy, vx) - Math.PI / 2;
        }

        this.o2Text.setText(`O2: ${this.playerData.o2}/${this.playerData.maxO2}`);
    }

    dockWithShip(playerShip, derelict) {
        this.scene.start('ShipScene', {
            shipNumber: derelict.shipNumber,
            playerData: this.playerData
        });
    }
}

// ==================== VICTORY SCENE ====================
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'ESCAPED!', {
            fontSize: '64px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'You survived the derelict ships!', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const playAgain = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '[ PLAY AGAIN ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ==================== CONFIG ====================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, ShipScene, SpaceScene, VictoryScene]
};

const game = new Phaser.Game(config);
