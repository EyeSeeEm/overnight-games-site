// Isolation Protocol - Subterrain Clone
// Survival Horror with Room Persistence

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player
        g.fillStyle(0x4488ff);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0xddaa77);
        g.fillCircle(16, 8, 6);
        g.generateTexture('player', 32, 32);
        g.clear();

        // Shambler
        g.fillStyle(0x557755);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x335533);
        g.fillCircle(16, 12, 8);
        g.fillStyle(0xff4444);
        g.fillCircle(12, 10, 2);
        g.fillCircle(20, 10, 2);
        g.generateTexture('shambler', 32, 32);
        g.clear();

        // Crawler
        g.fillStyle(0x665544);
        g.fillRect(4, 12, 24, 12);
        g.fillStyle(0x443322);
        g.fillRect(0, 16, 32, 8);
        g.generateTexture('crawler', 32, 24);
        g.clear();

        // Spitter
        g.fillStyle(0x448844);
        g.fillRect(4, 0, 24, 28);
        g.fillStyle(0x66aa66);
        g.fillCircle(16, 10, 8);
        g.fillStyle(0xaaff00);
        g.fillCircle(16, 20, 4);
        g.generateTexture('spitter', 32, 32);
        g.clear();

        // Brute
        g.fillStyle(0x664422);
        g.fillRect(0, 0, 48, 48);
        g.fillStyle(0x442211);
        g.fillRect(8, 8, 32, 32);
        g.fillStyle(0xff4444);
        g.fillCircle(18, 16, 4);
        g.fillCircle(30, 16, 4);
        g.generateTexture('brute', 48, 48);
        g.clear();

        // Cocoon
        g.fillStyle(0x553355);
        g.fillCircle(16, 20, 16);
        g.fillStyle(0x442244);
        g.fillCircle(16, 16, 10);
        g.generateTexture('cocoon', 32, 40);
        g.clear();

        // Floor tile
        g.fillStyle(0x2a2a3a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x333344);
        g.fillRect(0, 0, 2, 32);
        g.fillRect(0, 0, 32, 2);
        g.generateTexture('floor', 32, 32);
        g.clear();

        // Wall
        g.fillStyle(0x444466);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x555577);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('wall', 32, 32);
        g.clear();

        // Door
        g.fillStyle(0x885500);
        g.fillRect(0, 0, 64, 32);
        g.fillStyle(0xaa7700);
        g.fillRect(24, 8, 16, 16);
        g.generateTexture('door', 64, 32);
        g.clear();

        // Bullet
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);
        g.clear();

        // Acid
        g.fillStyle(0x88ff00);
        g.fillCircle(6, 6, 6);
        g.generateTexture('acid', 12, 12);
        g.clear();

        // Muzzle flash
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffff88);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzle', 16, 16);
        g.clear();

        // Hit spark
        g.fillStyle(0xff4400);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 4);
        g.generateTexture('hitSpark', 16, 16);
        g.clear();

        // Food
        g.fillStyle(0x886644);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0xffaa66);
        g.fillRect(8, 10, 16, 12);
        g.generateTexture('food', 32, 32);
        g.clear();

        // Medkit
        g.fillStyle(0xffffff);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xff4444);
        g.fillRect(12, 6, 8, 20);
        g.fillRect(6, 12, 20, 8);
        g.generateTexture('medkit', 32, 32);
        g.clear();

        // Antidote
        g.fillStyle(0x44ff44);
        g.fillRect(10, 4, 12, 20);
        g.fillStyle(0x888888);
        g.fillRect(10, 0, 12, 6);
        g.generateTexture('antidote', 32, 32);
        g.clear();

        // Keycard
        g.fillStyle(0xff4444);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0xffffff);
        g.fillRect(6, 10, 8, 4);
        g.generateTexture('keycard', 32, 32);
        g.clear();

        // Container
        g.fillStyle(0x555566);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x666677);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x888899);
        g.fillRect(8, 8, 16, 2);
        g.generateTexture('container', 32, 32);
        g.clear();

        // Workbench
        g.fillStyle(0x664422);
        g.fillRect(0, 8, 64, 24);
        g.fillStyle(0x553311);
        g.fillRect(4, 0, 8, 32);
        g.fillRect(52, 0, 8, 32);
        g.generateTexture('workbench', 64, 32);
        g.clear();

        // Escape pod
        g.fillStyle(0x4488ff);
        g.fillCircle(32, 32, 32);
        g.fillStyle(0x88aaff);
        g.fillCircle(32, 32, 20);
        g.fillStyle(0xaaccff);
        g.fillCircle(32, 24, 8);
        g.generateTexture('escapePod', 64, 64);
        g.clear();

        // Blood pool (static)
        g.fillStyle(0x880000);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x660000);
        g.fillCircle(20, 18, 6);
        g.generateTexture('blood', 32, 32);
        g.clear();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a0a12');

        this.add.text(cx, cy - 120, 'ISOLATION PROTOCOL', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#220000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 70, 'Survive. Scavenge. Escape.', {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        const instructions = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Attack/Shoot',
            'E - Interact/Pickup',
            'Tab - Inventory',
            '',
            'Find the Red Keycard.',
            'Power the Escape Pod.',
            'Survive the infection.'
        ];

        instructions.forEach((line, i) => {
            this.add.text(cx, cy - 20 + i * 22, line, {
                fontSize: '14px',
                color: '#888899'
            }).setOrigin(0.5);
        });

        this.add.text(cx, cy + 180, 'Press SPACE to Begin', {
            fontSize: '20px',
            color: '#ff8844'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.once('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Player stats
        this.stats = {
            health: 100,
            maxHealth: 100,
            hunger: 0,
            infection: 0,
            hasKeycard: false,
            hasPistol: false,
            ammo: 0
        };

        // Global infection (game timer)
        this.globalInfection = 0;

        // Room states (persistence)
        this.roomStates = {};

        // Rooms data
        this.rooms = {
            hub: {
                name: 'Central Hub',
                width: 15, height: 15,
                enemies: [],
                items: [
                    { type: 'food', x: 3, y: 3 },
                    { type: 'food', x: 12, y: 12 }
                ],
                containers: [
                    { x: 5, y: 5, looted: false, contents: ['food', 'medkit'] }
                ],
                doors: { south: 'storage', north: 'escape' },
                safe: true,
                powered: true
            },
            storage: {
                name: 'Storage Wing',
                width: 20, height: 20,
                enemies: [
                    { type: 'shambler', x: 8, y: 8 },
                    { type: 'shambler', x: 15, y: 10 },
                    { type: 'shambler', x: 5, y: 15 },
                    { type: 'crawler', x: 12, y: 5 }
                ],
                items: [
                    { type: 'food', x: 3, y: 3 },
                    { type: 'medkit', x: 18, y: 18 }
                ],
                containers: [
                    { x: 10, y: 3, looted: false, contents: ['food', 'food'] },
                    { x: 5, y: 17, looted: false, contents: ['antidote'] }
                ],
                doors: { north: 'hub', east: 'research' },
                safe: false,
                powered: false,
                powerCost: 100
            },
            research: {
                name: 'Research Lab',
                width: 20, height: 20,
                enemies: [
                    { type: 'spitter', x: 10, y: 5 },
                    { type: 'spitter', x: 15, y: 15 },
                    { type: 'shambler', x: 5, y: 10 },
                    { type: 'crawler', x: 12, y: 12 },
                    { type: 'brute', x: 18, y: 8 }
                ],
                items: [
                    { type: 'keycard', x: 18, y: 18 },
                    { type: 'medkit', x: 3, y: 3 }
                ],
                containers: [
                    { x: 10, y: 10, looted: false, contents: ['antidote', 'medkit'] }
                ],
                doors: { west: 'storage' },
                safe: false,
                powered: false,
                powerCost: 200
            },
            escape: {
                name: 'Escape Pod Bay',
                width: 15, height: 15,
                enemies: [
                    { type: 'brute', x: 7, y: 5 },
                    { type: 'brute', x: 12, y: 10 },
                    { type: 'shambler', x: 3, y: 12 },
                    { type: 'spitter', x: 10, y: 3 }
                ],
                items: [],
                containers: [],
                doors: { south: 'hub' },
                escapePod: { x: 7, y: 7 },
                safe: false,
                powered: false,
                powerCost: 300
            }
        };

        // Current room
        this.currentRoom = 'hub';

        // Initialize room state
        this.initializeRoomState(this.currentRoom);

        // Create room
        this.createRoom();

        // Player
        this.player = this.physics.add.sprite(
            this.roomCenterX,
            this.roomCenterY + 100,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(20, 20);

        // Groups
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.items = this.physics.add.group();
        this.containers = this.physics.add.group();

        // Spawn room contents
        this.spawnRoomContents();

        // Physics
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys({
            e: 'E',
            tab: 'TAB'
        });

        // Combat
        this.attackCooldown = 0;
        this.iFrames = 0;

        // Create HUD
        this.createHUD();

        // Game time
        this.gameTime = 0;

        // Blood pools (static decals)
        this.bloodPools = this.add.group();
    }

    initializeRoomState(roomId) {
        if (this.roomStates[roomId]) return;

        const room = this.rooms[roomId];
        this.roomStates[roomId] = {
            enemies: room.enemies.map(e => ({ ...e, alive: true })),
            items: room.items.map(i => ({ ...i, collected: false })),
            containers: room.containers.map(c => ({ ...c }))
        };
    }

    createRoom() {
        const room = this.rooms[this.currentRoom];
        const tileSize = 32;

        this.roomWidth = room.width * tileSize;
        this.roomHeight = room.height * tileSize;
        this.roomCenterX = 400;
        this.roomCenterY = 300;
        this.roomOffsetX = this.roomCenterX - this.roomWidth / 2;
        this.roomOffsetY = this.roomCenterY - this.roomHeight / 2;

        // Clear existing
        if (this.roomGraphics) {
            this.roomGraphics.forEach(g => g.destroy());
        }
        this.roomGraphics = [];

        // Clear blood pools
        if (this.bloodPools) {
            this.bloodPools.clear(true, true);
        }

        // Floor
        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tile = this.add.image(
                    this.roomOffsetX + x * tileSize + tileSize/2,
                    this.roomOffsetY + y * tileSize + tileSize/2,
                    'floor'
                ).setDepth(0);
                this.roomGraphics.push(tile);
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();

        for (let x = 0; x < room.width; x++) {
            // Top wall
            const topWall = this.walls.create(
                this.roomOffsetX + x * tileSize + tileSize/2,
                this.roomOffsetY - tileSize/2,
                'wall'
            );
            this.roomGraphics.push(topWall);

            // Bottom wall
            const botWall = this.walls.create(
                this.roomOffsetX + x * tileSize + tileSize/2,
                this.roomOffsetY + this.roomHeight + tileSize/2,
                'wall'
            );
            this.roomGraphics.push(botWall);
        }

        for (let y = -1; y <= room.height; y++) {
            // Left wall
            const leftWall = this.walls.create(
                this.roomOffsetX - tileSize/2,
                this.roomOffsetY + y * tileSize + tileSize/2,
                'wall'
            );
            this.roomGraphics.push(leftWall);

            // Right wall
            const rightWall = this.walls.create(
                this.roomOffsetX + this.roomWidth + tileSize/2,
                this.roomOffsetY + y * tileSize + tileSize/2,
                'wall'
            );
            this.roomGraphics.push(rightWall);
        }

        // Doors
        this.doors = [];
        if (room.doors.north) {
            const door = this.add.image(this.roomCenterX, this.roomOffsetY - 16, 'door').setDepth(5);
            this.doors.push({ sprite: door, direction: 'north', target: room.doors.north });
            this.roomGraphics.push(door);
        }
        if (room.doors.south) {
            const door = this.add.image(this.roomCenterX, this.roomOffsetY + this.roomHeight + 16, 'door').setDepth(5);
            this.doors.push({ sprite: door, direction: 'south', target: room.doors.south });
            this.roomGraphics.push(door);
        }
        if (room.doors.east) {
            const door = this.add.image(this.roomOffsetX + this.roomWidth + 16, this.roomCenterY, 'door').setDepth(5).setAngle(90);
            this.doors.push({ sprite: door, direction: 'east', target: room.doors.east });
            this.roomGraphics.push(door);
        }
        if (room.doors.west) {
            const door = this.add.image(this.roomOffsetX - 16, this.roomCenterY, 'door').setDepth(5).setAngle(90);
            this.doors.push({ sprite: door, direction: 'west', target: room.doors.west });
            this.roomGraphics.push(door);
        }

        // Escape pod
        if (room.escapePod) {
            const pod = this.add.image(
                this.roomOffsetX + room.escapePod.x * tileSize + tileSize/2,
                this.roomOffsetY + room.escapePod.y * tileSize + tileSize/2,
                'escapePod'
            ).setDepth(3);
            this.escapePod = pod;
            this.roomGraphics.push(pod);
        } else {
            this.escapePod = null;
        }

        // Darkness overlay for unpowered rooms
        if (!room.powered && !room.safe) {
            const darkness = this.add.rectangle(
                this.roomCenterX,
                this.roomCenterY,
                this.roomWidth + 100,
                this.roomHeight + 100,
                0x000000, 0.5
            ).setDepth(50);
            this.roomGraphics.push(darkness);
        }

        // Room name
        this.roomNameText = this.add.text(10, 60, room.name, {
            fontSize: '18px',
            color: '#888888'
        }).setScrollFactor(0).setDepth(100);
        this.roomGraphics.push(this.roomNameText);
    }

    spawnRoomContents() {
        const state = this.roomStates[this.currentRoom];
        const tileSize = 32;

        // Clear existing
        this.enemies.clear(true, true);
        this.items.clear(true, true);
        this.containers.clear(true, true);

        // Spawn enemies
        state.enemies.forEach((e, i) => {
            if (!e.alive) return;
            const enemy = this.enemies.create(
                this.roomOffsetX + e.x * tileSize + tileSize/2,
                this.roomOffsetY + e.y * tileSize + tileSize/2,
                e.type
            );
            enemy.type = e.type;
            enemy.stateIndex = i;
            enemy.attackTimer = 0;

            const stats = {
                shambler: { hp: 30, damage: 10, speed: 40, infection: 5 },
                crawler: { hp: 20, damage: 8, speed: 80, infection: 5 },
                spitter: { hp: 25, damage: 15, speed: 30, infection: 10, ranged: true },
                brute: { hp: 80, damage: 25, speed: 25, infection: 8 },
                cocoon: { hp: 50, damage: 0, speed: 0, infection: 1 }
            };

            const s = stats[e.type];
            enemy.hp = s.hp;
            enemy.damage = s.damage;
            enemy.speed = s.speed;
            enemy.infectionDamage = s.infection;
            enemy.ranged = s.ranged || false;
            enemy.setDepth(8);
        });

        // Spawn items
        state.items.forEach((item, i) => {
            if (item.collected) return;
            const it = this.items.create(
                this.roomOffsetX + item.x * tileSize + tileSize/2,
                this.roomOffsetY + item.y * tileSize + tileSize/2,
                item.type
            );
            it.itemType = item.type;
            it.stateIndex = i;
            it.setDepth(4);
        });

        // Spawn containers
        state.containers.forEach((cont, i) => {
            const c = this.containers.create(
                this.roomOffsetX + cont.x * tileSize + tileSize/2,
                this.roomOffsetY + cont.y * tileSize + tileSize/2,
                'container'
            );
            c.looted = cont.looted;
            c.contents = cont.contents;
            c.stateIndex = i;
            c.setDepth(3);
            if (c.looted) c.setTint(0x666666);
        });
    }

    createHUD() {
        // Health bar
        this.add.rectangle(10, 10, 154, 18, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.healthBar = this.add.rectangle(12, 12, 150, 14, 0xff4444).setOrigin(0).setScrollFactor(0).setDepth(101);
        this.add.text(10, 10, 'HP', { fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Hunger bar
        this.add.rectangle(10, 32, 104, 12, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.hungerBar = this.add.rectangle(12, 34, 0, 8, 0xff8844).setOrigin(0).setScrollFactor(0).setDepth(101);
        this.add.text(10, 30, 'Hunger', { fontSize: '10px', color: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Infection bar
        this.add.rectangle(10, 46, 104, 12, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.infectionBar = this.add.rectangle(12, 48, 0, 8, 0x44ff44).setOrigin(0).setScrollFactor(0).setDepth(101);
        this.add.text(10, 44, 'Infection', { fontSize: '10px', color: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Global infection
        this.globalInfectionText = this.add.text(680, 10, 'Global: 0%', {
            fontSize: '16px',
            color: '#ff4444'
        }).setScrollFactor(0).setDepth(100);

        // Ammo/weapon
        this.weaponText = this.add.text(680, 32, 'Fists', {
            fontSize: '14px',
            color: '#888888'
        }).setScrollFactor(0).setDepth(100);

        // Keycard status
        this.keycardText = this.add.text(680, 52, '', {
            fontSize: '14px',
            color: '#ff4444'
        }).setScrollFactor(0).setDepth(100);

        // Interaction prompt
        this.interactPrompt = this.add.text(400, 550, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    update(time, delta) {
        // Game time and global infection
        this.gameTime += delta;
        if (this.gameTime >= 1000) {
            this.gameTime -= 1000;
            this.globalInfection += 0.1;

            // Hunger increase
            this.stats.hunger = Math.min(100, this.stats.hunger + 0.1);

            // Infection from unpowered room
            const room = this.rooms[this.currentRoom];
            if (!room.powered && !room.safe) {
                this.stats.infection = Math.min(100, this.stats.infection + 0.5);
            }
        }

        // Check lose conditions
        if (this.stats.health <= 0) {
            this.scene.start('GameOverScene', { reason: 'health' });
            return;
        }
        if (this.stats.infection >= 100) {
            this.scene.start('GameOverScene', { reason: 'infection' });
            return;
        }
        if (this.globalInfection >= 100) {
            this.scene.start('GameOverScene', { reason: 'global' });
            return;
        }

        // Hunger effects
        if (this.stats.hunger >= 75) {
            this.stats.health -= delta * 0.001;
        }

        // Infection effects (visual)
        if (this.stats.infection >= 25) {
            // Green tint effect would go here
        }

        this.handleMovement(delta);
        this.handleCombat(delta);
        this.handleInteraction();
        this.updateEnemies(delta);
        this.checkRoomTransition();
        this.updateHUD();

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.iFrames > 0) this.iFrames -= delta;

        // Player depth
        this.player.setDepth(this.player.y);
    }

    handleMovement(delta) {
        const speed = this.stats.hunger >= 50 ? 120 : 150;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Face mouse
        const pointer = this.input.activePointer;
        this.player.rotation = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.worldX, pointer.worldY
        ) + Math.PI/2;
    }

    handleCombat(delta) {
        if (this.input.activePointer.isDown && this.attackCooldown <= 0) {
            this.attack();
        }
    }

    attack() {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.worldX, pointer.worldY
        );

        if (this.stats.hasPistol && this.stats.ammo > 0) {
            // Ranged attack
            this.attackCooldown = 300;
            this.stats.ammo--;

            // Muzzle flash
            const muzzle = this.add.image(
                this.player.x + Math.cos(angle) * 20,
                this.player.y + Math.sin(angle) * 20,
                'muzzle'
            ).setDepth(20);
            this.tweens.add({
                targets: muzzle,
                alpha: 0,
                scale: 2,
                duration: 100,
                onComplete: () => muzzle.destroy()
            });

            // Bullet
            const bullet = this.bullets.create(
                this.player.x + Math.cos(angle) * 20,
                this.player.y + Math.sin(angle) * 20,
                'bullet'
            );
            bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
            bullet.damage = 15;
            bullet.setDepth(15);

            // Screen shake
            this.cameras.main.shake(50, 0.005);

            this.time.delayedCall(2000, () => {
                if (bullet.active) bullet.destroy();
            });
        } else {
            // Melee attack
            this.attackCooldown = 500;

            // Swing visual
            const swing = this.add.rectangle(
                this.player.x + Math.cos(angle) * 25,
                this.player.y + Math.sin(angle) * 25,
                30, 10, 0xaaaaaa, 0.7
            ).setRotation(angle).setDepth(20);

            this.tweens.add({
                targets: swing,
                alpha: 0,
                duration: 150,
                onComplete: () => swing.destroy()
            });

            // Check melee hits
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );
                if (dist < 50) {
                    const angleToEnemy = Phaser.Math.Angle.Between(
                        this.player.x, this.player.y,
                        enemy.x, enemy.y
                    );
                    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
                    if (angleDiff < Math.PI / 3) {
                        this.damageEnemy(enemy, 10);
                    }
                }
            });
        }
    }

    bulletHitEnemy(bullet, enemy) {
        this.damageEnemy(enemy, bullet.damage);
        bullet.destroy();
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Hit spark
        const spark = this.add.image(enemy.x, enemy.y, 'hitSpark').setDepth(20);
        this.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => spark.destroy()
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, damage.toString(), {
            fontSize: '14px',
            color: '#ffff44'
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });

        // Flash
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Update state
        const state = this.roomStates[this.currentRoom];
        state.enemies[enemy.stateIndex].alive = false;

        // Blood pool (static)
        const blood = this.bloodPools.create(enemy.x, enemy.y, 'blood').setDepth(1);

        enemy.destroy();
    }

    bulletHitPlayer(player, bullet) {
        if (this.iFrames > 0) return;
        bullet.destroy();

        this.stats.health -= 15;
        this.stats.infection = Math.min(100, this.stats.infection + 10);
        this.iFrames = 500;

        this.cameras.main.shake(100, 0.02);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());
    }

    enemyHitPlayer(player, enemy) {
        if (this.iFrames > 0) return;

        this.stats.health -= enemy.damage;
        this.stats.infection = Math.min(100, this.stats.infection + enemy.infectionDamage);
        this.iFrames = 1000;

        this.cameras.main.shake(100, 0.02);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        // Damage number
        const dmgText = this.add.text(player.x, player.y - 30, `-${enemy.damage}`, {
            fontSize: '18px',
            color: '#ff0000'
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: dmgText,
            y: player.y - 60,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });
    }

    collectItem(player, item) {
        const type = item.itemType;

        switch (type) {
            case 'food':
                this.stats.hunger = Math.max(0, this.stats.hunger - 30);
                break;
            case 'medkit':
                this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 30);
                break;
            case 'antidote':
                this.stats.infection = Math.max(0, this.stats.infection - 30);
                break;
            case 'keycard':
                this.stats.hasKeycard = true;
                break;
        }

        // Update state
        const state = this.roomStates[this.currentRoom];
        state.items[item.stateIndex].collected = true;

        // Pickup text
        const text = this.add.text(item.x, item.y - 20, `+${type}`, {
            fontSize: '14px',
            color: '#44ff44'
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: text,
            y: item.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        item.destroy();
    }

    handleInteraction() {
        let nearestInteraction = null;
        let nearestDist = 60;

        // Check containers
        this.containers.getChildren().forEach(cont => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, cont.x, cont.y
            );
            if (dist < nearestDist && !cont.looted) {
                nearestDist = dist;
                nearestInteraction = { type: 'container', obj: cont };
            }
        });

        // Check escape pod
        if (this.escapePod) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, this.escapePod.x, this.escapePod.y
            );
            if (dist < 60) {
                nearestInteraction = { type: 'escapePod' };
            }
        }

        // Update prompt
        if (nearestInteraction) {
            if (nearestInteraction.type === 'container') {
                this.interactPrompt.setText('[E] Search Container');
            } else if (nearestInteraction.type === 'escapePod') {
                if (!this.stats.hasKeycard) {
                    this.interactPrompt.setText('Requires Red Keycard');
                } else if (!this.rooms.escape.powered) {
                    this.interactPrompt.setText('Escape Pod not powered');
                } else {
                    this.interactPrompt.setText('[E] Escape!');
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                if (nearestInteraction.type === 'container') {
                    this.openContainer(nearestInteraction.obj);
                } else if (nearestInteraction.type === 'escapePod') {
                    if (this.stats.hasKeycard && this.rooms.escape.powered) {
                        this.scene.start('VictoryScene', {
                            globalInfection: this.globalInfection
                        });
                    }
                }
            }
        } else {
            this.interactPrompt.setText('');
        }
    }

    openContainer(cont) {
        if (cont.looted) return;

        cont.looted = true;
        cont.setTint(0x666666);

        // Update state
        const state = this.roomStates[this.currentRoom];
        state.containers[cont.stateIndex].looted = true;

        // Spawn contents
        cont.contents.forEach((itemType, i) => {
            const angle = (i / cont.contents.length) * Math.PI * 2;
            const item = this.items.create(
                cont.x + Math.cos(angle) * 30,
                cont.y + Math.sin(angle) * 30,
                itemType
            );
            item.itemType = itemType;
            item.stateIndex = -1; // Not in original state
            item.setDepth(4);
        });
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.attackTimer > 0) enemy.attackTimer -= delta;

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            if (distToPlayer < 250) {
                if (enemy.ranged && distToPlayer > 100) {
                    // Ranged enemy stays at distance
                    if (enemy.attackTimer <= 0) {
                        this.enemyShoot(enemy);
                        enemy.attackTimer = 2500;
                    }

                    // Move to maintain distance
                    if (distToPlayer < 150) {
                        const angle = Phaser.Math.Angle.Between(
                            this.player.x, this.player.y, enemy.x, enemy.y
                        );
                        enemy.setVelocity(
                            Math.cos(angle) * enemy.speed,
                            Math.sin(angle) * enemy.speed
                        );
                    } else {
                        enemy.setVelocity(0, 0);
                    }
                } else {
                    // Melee enemy chases
                    const angle = Phaser.Math.Angle.Between(
                        enemy.x, enemy.y, this.player.x, this.player.y
                    );
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );
                }
            } else {
                enemy.setVelocity(0, 0);
            }

            enemy.setDepth(enemy.y);
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y, this.player.x, this.player.y
        );

        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'acid');
        bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        bullet.setDepth(15);

        this.time.delayedCall(3000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    checkRoomTransition() {
        this.doors.forEach(door => {
            const doorBounds = door.sprite.getBounds();
            const playerBounds = this.player.getBounds();

            if (Phaser.Geom.Rectangle.Overlaps(doorBounds, playerBounds)) {
                this.transitionRoom(door.target, door.direction);
            }
        });
    }

    transitionRoom(targetRoom, fromDirection) {
        // Save current room state (already done via state tracking)

        // Change room
        this.currentRoom = targetRoom;
        this.initializeRoomState(targetRoom);

        // Clear groups
        this.enemies.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.items.clear(true, true);
        this.containers.clear(true, true);

        // Recreate room
        this.createRoom();
        this.spawnRoomContents();

        // Position player based on entry direction (spawn at opposite side)
        const tileSize = 32;
        const room = this.rooms[this.currentRoom];
        switch (fromDirection) {
            case 'north':
                // Came from north, spawn at top
                this.player.x = this.roomCenterX;
                this.player.y = this.roomOffsetY + 40;
                break;
            case 'south':
                // Came from south, spawn at bottom
                this.player.x = this.roomCenterX;
                this.player.y = this.roomOffsetY + this.roomHeight - 40;
                break;
            case 'east':
                // Came from east, spawn at right
                this.player.x = this.roomOffsetX + this.roomWidth - 40;
                this.player.y = this.roomCenterY;
                break;
            case 'west':
                // Came from west, spawn at left
                this.player.x = this.roomOffsetX + 40;
                this.player.y = this.roomCenterY;
                break;
        }

        // Re-add physics
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
    }

    updateHUD() {
        // Health
        this.healthBar.width = 150 * (this.stats.health / this.stats.maxHealth);

        // Hunger
        this.hungerBar.width = this.stats.hunger;

        // Infection
        this.infectionBar.width = this.stats.infection;

        // Global infection
        this.globalInfectionText.setText(`Global: ${Math.floor(this.globalInfection)}%`);

        // Weapon
        if (this.stats.hasPistol) {
            this.weaponText.setText(`Pistol: ${this.stats.ammo}`);
        } else {
            this.weaponText.setText('Fists');
        }

        // Keycard
        if (this.stats.hasKeycard) {
            this.keycardText.setText('Red Keycard');
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.reason = data.reason;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a0008');

        let deathMessage = 'YOU DIED';
        if (this.reason === 'infection') {
            deathMessage = 'INFECTION CONSUMED YOU';
        } else if (this.reason === 'global') {
            deathMessage = 'THE FACILITY IS LOST';
        }

        this.add.text(cx, cy - 40, deathMessage, {
            fontSize: '36px',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, 'The darkness claims another victim.', {
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 100, 'Press SPACE to Retry', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.once('pointerdown', () => this.scene.start('GameScene'));
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    init(data) {
        this.globalInfection = data.globalInfection || 0;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a1a0a');

        this.add.text(cx, cy - 80, 'YOU ESCAPED!', {
            fontSize: '42px',
            color: '#44ff44'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 20, 'You made it to the escape pod.', {
            fontSize: '18px',
            color: '#88aa88'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, `Global Infection at escape: ${Math.floor(this.globalInfection)}%`, {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 100, 'Press SPACE to Play Again', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config at end
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
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
