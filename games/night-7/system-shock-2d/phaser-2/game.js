// Whispers of M.A.R.I.A. - System Shock 2D Clone
// Immersive Sim / Survival Horror

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player
        g.fillStyle(0x5588aa);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0x88aacc);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x44aaff);
        g.fillRect(12, 6, 8, 4);
        g.generateTexture('player', 32, 32);
        g.clear();

        // Cyborg Drone
        g.fillStyle(0x556666);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xff4444);
        g.fillCircle(16, 12, 4);
        g.fillStyle(0x333333);
        g.fillRect(8, 20, 16, 8);
        g.generateTexture('cyborgDrone', 32, 32);
        g.clear();

        // Cyborg Soldier
        g.fillStyle(0x445566);
        g.fillRect(4, 0, 24, 32);
        g.fillStyle(0xff0000);
        g.fillCircle(16, 8, 4);
        g.fillStyle(0x888888);
        g.fillRect(24, 12, 8, 4);
        g.generateTexture('cyborgSoldier', 32, 32);
        g.clear();

        // Mutant Crawler
        g.fillStyle(0x558844);
        g.fillRect(0, 8, 32, 16);
        g.fillStyle(0x446633);
        g.fillCircle(8, 12, 6);
        g.fillCircle(24, 12, 6);
        g.generateTexture('mutantCrawler', 32, 24);
        g.clear();

        // Turret
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x888888);
        g.fillRect(12, 0, 8, 16);
        g.fillStyle(0xff4444);
        g.fillCircle(16, 8, 3);
        g.generateTexture('turret', 32, 32);
        g.clear();

        // Floor tile
        g.fillStyle(0x2a2a3a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x333344);
        g.lineStyle(1, 0x3a3a4a);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);
        g.clear();

        // Wall
        g.fillStyle(0x444466);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x555577);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('wall', 32, 32);
        g.clear();

        // Door (closed)
        g.fillStyle(0x885522);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xaa7744);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0x666666);
        g.fillRect(24, 12, 4, 8);
        g.generateTexture('door', 32, 32);
        g.clear();

        // Door (open)
        g.fillStyle(0x222233);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('doorOpen', 32, 32);
        g.clear();

        // Terminal
        g.fillStyle(0x333344);
        g.fillRect(0, 4, 32, 24);
        g.fillStyle(0x00ff00);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0x00aa00);
        g.fillRect(8, 12, 16, 8);
        g.generateTexture('terminal', 32, 32);
        g.clear();

        // Bullet
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);
        g.clear();

        // Enemy bullet
        g.fillStyle(0xff4444);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemyBullet', 8, 8);
        g.clear();

        // Muzzle flash
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffff88);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzle', 16, 16);
        g.clear();

        // Med patch
        g.fillStyle(0xffffff);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xff4444);
        g.fillRect(12, 6, 8, 20);
        g.fillRect(6, 12, 20, 8);
        g.generateTexture('medPatch', 32, 32);
        g.clear();

        // Ammo
        g.fillStyle(0x888844);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0xaaaa66);
        g.fillRect(10, 6, 4, 20);
        g.fillRect(18, 6, 4, 20);
        g.generateTexture('ammo', 32, 32);
        g.clear();

        // Keycard
        g.fillStyle(0xffff00);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0xffffff);
        g.fillRect(6, 10, 10, 6);
        g.generateTexture('keycard', 32, 32);
        g.clear();

        // Audio log
        g.fillStyle(0x4488ff);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x88aaff);
        g.fillCircle(16, 16, 8);
        g.generateTexture('audioLog', 32, 32);
        g.clear();

        // Escape pod
        g.fillStyle(0x4488ff);
        g.fillCircle(32, 32, 32);
        g.fillStyle(0x88aaff);
        g.fillCircle(32, 32, 20);
        g.fillStyle(0xaaccff);
        g.fillCircle(32, 24, 10);
        g.generateTexture('escapePod', 64, 64);
        g.clear();

        // Vision cone mask
        g.fillStyle(0xffffff);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(300, -150);
        g.lineTo(300, 150);
        g.closePath();
        g.fill();
        g.generateTexture('visionCone', 300, 300);
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

        this.cameras.main.setBackgroundColor('#0a0a18');

        this.add.text(cx, cy - 140, 'WHISPERS OF', {
            fontSize: '24px',
            color: '#4488ff'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 100, 'M.A.R.I.A.', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#220000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 50, 'A System Shock Clone', {
            fontSize: '16px',
            color: '#666688'
        }).setOrigin(0.5);

        const instructions = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'E - Interact / Hack',
            'Tab - View Audio Logs',
            '',
            'Find the keycard.',
            'Reach the Escape Pod.',
            'Survive the station.'
        ];

        instructions.forEach((line, i) => {
            this.add.text(cx, cy + i * 22, line, {
                fontSize: '14px',
                color: '#888899'
            }).setOrigin(0.5);
        });

        this.add.text(cx, cy + 200, 'Press SPACE to Begin', {
            fontSize: '20px',
            color: '#ff8844'
        }).setOrigin(0.5);

        // M.A.R.I.A. taunt
        this.add.text(cx, cy + 240, '"You cannot escape me."', {
            fontSize: '14px',
            color: '#ff4444',
            fontStyle: 'italic'
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
            energy: 100,
            maxEnergy: 100,
            ammo: 24,
            hasKeycard: false
        };

        // Audio logs collected
        this.audioLogs = [];

        // Current deck (0 = Engineering, 1 = Medical)
        this.currentDeck = 0;

        // Deck data
        this.decks = [
            this.createEngineeringDeck(),
            this.createMedicalDeck()
        ];

        // Create current deck
        this.loadDeck(this.currentDeck);

        // Player
        const spawnPoint = this.decks[this.currentDeck].playerSpawn;
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(20, 20);

        // Groups
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.items = this.physics.add.group();
        this.doors = this.physics.add.group();
        this.terminals = this.physics.add.group();
        this.turrets = this.physics.add.group();

        // Spawn deck contents
        this.spawnDeckContents();

        // Physics
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.player, this.doors, this.handleDoorCollision, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.turrets, this.bulletHitTurret, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys({
            e: 'E',
            tab: 'TAB',
            shift: 'SHIFT'
        });

        // Combat
        this.attackCooldown = 0;
        this.iFrames = 0;

        // Create HUD
        this.createHUD();

        // Vision/darkness system
        this.createVisionSystem();

        // M.A.R.I.A. messages
        this.mariaMessages = [
            "You're awake. Fascinating.",
            "The others were eager to join me.",
            "You cannot escape this station.",
            "I see everything.",
            "Join me. Perfection awaits."
        ];
        this.showMariaMessage(0);
    }

    createEngineeringDeck() {
        return {
            name: 'Engineering',
            width: 800,
            height: 600,
            playerSpawn: { x: 100, y: 300 },
            walls: [
                // Outer walls
                { x: 0, y: 0, w: 800, h: 20 },
                { x: 0, y: 580, w: 800, h: 20 },
                { x: 0, y: 0, w: 20, h: 600 },
                { x: 780, y: 0, w: 20, h: 600 },
                // Inner walls
                { x: 200, y: 20, w: 20, h: 200 },
                { x: 200, y: 300, w: 20, h: 280 },
                { x: 400, y: 100, w: 20, h: 150 },
                { x: 400, y: 350, w: 20, h: 230 },
                { x: 600, y: 20, w: 20, h: 180 },
                { x: 600, y: 300, w: 20, h: 280 }
            ],
            doors: [
                { x: 200, y: 250, locked: false },
                { x: 400, y: 280, locked: true, requiresKeycard: true },
                { x: 600, y: 220, locked: false }
            ],
            enemies: [
                { type: 'cyborgDrone', x: 300, y: 150 },
                { type: 'cyborgDrone', x: 500, y: 400 },
                { type: 'cyborgSoldier', x: 700, y: 150 },
                { type: 'mutantCrawler', x: 300, y: 500 },
                { type: 'mutantCrawler', x: 500, y: 500 }
            ],
            turrets: [
                { x: 700, y: 400, friendly: false }
            ],
            items: [
                { type: 'medPatch', x: 150, y: 100 },
                { type: 'ammo', x: 350, y: 200 },
                { type: 'keycard', x: 700, y: 100 },
                { type: 'audioLog', x: 100, y: 500, id: 1 }
            ],
            terminals: [
                { x: 500, y: 150, hackable: true, target: 'turret' }
            ],
            exitDoor: { x: 750, y: 300, nextDeck: 1 }
        };
    }

    createMedicalDeck() {
        return {
            name: 'Medical',
            width: 800,
            height: 600,
            playerSpawn: { x: 50, y: 300 },
            walls: [
                // Outer walls
                { x: 0, y: 0, w: 800, h: 20 },
                { x: 0, y: 580, w: 800, h: 20 },
                { x: 0, y: 0, w: 20, h: 600 },
                { x: 780, y: 0, w: 20, h: 600 },
                // Inner walls
                { x: 150, y: 20, w: 20, h: 250 },
                { x: 150, y: 350, w: 20, h: 230 },
                { x: 300, y: 150, w: 20, h: 300 },
                { x: 500, y: 20, w: 20, h: 200 },
                { x: 500, y: 300, w: 20, h: 280 },
                { x: 650, y: 100, w: 20, h: 400 }
            ],
            doors: [
                { x: 150, y: 300, locked: false },
                { x: 300, y: 120, locked: false },
                { x: 500, y: 250, locked: false },
                { x: 650, y: 80, locked: false }
            ],
            enemies: [
                { type: 'cyborgDrone', x: 250, y: 150 },
                { type: 'cyborgDrone', x: 400, y: 400 },
                { type: 'cyborgSoldier', x: 600, y: 200 },
                { type: 'cyborgSoldier', x: 600, y: 450 },
                { type: 'mutantCrawler', x: 200, y: 500 },
                { type: 'mutantCrawler', x: 400, y: 150 }
            ],
            turrets: [],
            items: [
                { type: 'medPatch', x: 100, y: 100 },
                { type: 'medPatch', x: 450, y: 300 },
                { type: 'ammo', x: 250, y: 450 },
                { type: 'audioLog', x: 600, y: 150, id: 2 },
                { type: 'audioLog', x: 350, y: 500, id: 3 }
            ],
            terminals: [],
            escapePod: { x: 720, y: 300 }
        };
    }

    loadDeck(deckIndex) {
        const deck = this.decks[deckIndex];

        // Clear existing
        if (this.walls) this.walls.clear(true, true);
        if (this.roomGraphics) {
            this.roomGraphics.forEach(g => g.destroy());
        }
        this.roomGraphics = [];

        // Floor
        for (let y = 0; y < deck.height; y += 32) {
            for (let x = 0; x < deck.width; x += 32) {
                const tile = this.add.image(x + 16, y + 16, 'floor').setDepth(0);
                this.roomGraphics.push(tile);
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();
        deck.walls.forEach(w => {
            for (let x = 0; x < w.w; x += 32) {
                for (let y = 0; y < w.h; y += 32) {
                    const wall = this.walls.create(w.x + x + 16, w.y + y + 16, 'wall');
                    this.roomGraphics.push(wall);
                }
            }
        });

        // Camera bounds
        this.cameras.main.setBounds(0, 0, deck.width, deck.height);
        this.physics.world.setBounds(0, 0, deck.width, deck.height);

        // Deck name text
        this.deckNameText = this.add.text(10, 60, `Deck: ${deck.name}`, {
            fontSize: '16px',
            color: '#4488ff'
        }).setScrollFactor(0).setDepth(100);
    }

    spawnDeckContents() {
        const deck = this.decks[this.currentDeck];

        // Clear groups
        this.enemies.clear(true, true);
        this.items.clear(true, true);
        this.doors.clear(true, true);
        this.terminals.clear(true, true);
        this.turrets.clear(true, true);

        // Spawn enemies
        deck.enemies.forEach(e => {
            const enemy = this.enemies.create(e.x, e.y, e.type);
            enemy.type = e.type;
            enemy.attackTimer = 0;

            const stats = {
                cyborgDrone: { hp: 30, damage: 10, speed: 80 },
                cyborgSoldier: { hp: 60, damage: 15, speed: 100, ranged: true },
                mutantCrawler: { hp: 20, damage: 8, speed: 120 }
            };

            const s = stats[e.type];
            enemy.hp = s.hp;
            enemy.damage = s.damage;
            enemy.speed = s.speed;
            enemy.ranged = s.ranged || false;
            enemy.setDepth(8);
        });

        // Spawn doors
        deck.doors.forEach(d => {
            const door = this.doors.create(d.x, d.y, d.locked ? 'door' : 'doorOpen');
            door.locked = d.locked;
            door.requiresKeycard = d.requiresKeycard || false;
            door.body.immovable = d.locked;
            door.setDepth(5);
        });

        // Exit door
        if (deck.exitDoor) {
            this.exitDoor = this.add.rectangle(
                deck.exitDoor.x, deck.exitDoor.y, 32, 64, 0x44ff44, 0.5
            ).setDepth(5);
            this.physics.add.existing(this.exitDoor, true);
            this.exitDoor.nextDeck = deck.exitDoor.nextDeck;
        }

        // Escape pod
        if (deck.escapePod) {
            this.escapePod = this.add.image(deck.escapePod.x, deck.escapePod.y, 'escapePod').setDepth(5);
            this.physics.add.existing(this.escapePod, true);
        }

        // Spawn items
        deck.items.forEach(i => {
            const item = this.items.create(i.x, i.y, i.type);
            item.itemType = i.type;
            item.logId = i.id || null;
            item.setDepth(4);
        });

        // Spawn terminals
        deck.terminals.forEach(t => {
            const terminal = this.terminals.create(t.x, t.y, 'terminal');
            terminal.hackable = t.hackable;
            terminal.target = t.target;
            terminal.hacked = false;
            terminal.setDepth(5);
        });

        // Spawn turrets
        deck.turrets.forEach(t => {
            const turret = this.turrets.create(t.x, t.y, 'turret');
            turret.friendly = t.friendly;
            turret.hp = 50;
            turret.attackTimer = 0;
            turret.setDepth(6);
        });
    }

    createHUD() {
        // Health bar
        this.add.rectangle(10, 10, 154, 18, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.healthBar = this.add.rectangle(12, 12, 150, 14, 0xff4444).setOrigin(0).setScrollFactor(0).setDepth(101);
        this.add.text(12, 10, 'HP', { fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Energy bar
        this.add.rectangle(10, 32, 154, 18, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.energyBar = this.add.rectangle(12, 34, 150, 14, 0x4488ff).setOrigin(0).setScrollFactor(0).setDepth(101);
        this.add.text(12, 32, 'EN', { fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Ammo
        this.ammoText = this.add.text(700, 10, 'Ammo: 24', {
            fontSize: '16px',
            color: '#ffff44'
        }).setScrollFactor(0).setDepth(100);

        // Keycard
        this.keycardText = this.add.text(700, 32, '', {
            fontSize: '14px',
            color: '#ffff00'
        }).setScrollFactor(0).setDepth(100);

        // Interaction prompt
        this.interactPrompt = this.add.text(400, 550, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // M.A.R.I.A. message box
        this.mariaBox = this.add.rectangle(400, 100, 600, 60, 0x220000, 0.9)
            .setScrollFactor(0).setDepth(150).setVisible(false);
        this.mariaText = this.add.text(400, 100, '', {
            fontSize: '16px',
            color: '#ff4444',
            wordWrap: { width: 580 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setVisible(false);

        // Audio log popup
        this.logBox = this.add.rectangle(400, 500, 500, 80, 0x001144, 0.9)
            .setScrollFactor(0).setDepth(150).setVisible(false);
        this.logText = this.add.text(400, 500, '', {
            fontSize: '14px',
            color: '#88aaff',
            wordWrap: { width: 480 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    }

    createVisionSystem() {
        // Darkness overlay
        this.darkness = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50);

        // Vision light around player
        this.visionLight = this.add.circle(400, 300, 150, 0xffffff, 0.3)
            .setScrollFactor(0).setDepth(49).setBlendMode(Phaser.BlendModes.ADD);
    }

    showMariaMessage(index) {
        if (index >= this.mariaMessages.length) return;

        const msg = this.mariaMessages[index];
        this.mariaBox.setVisible(true);
        this.mariaText.setText(`M.A.R.I.A.: "${msg}"`).setVisible(true);

        this.time.delayedCall(4000, () => {
            this.mariaBox.setVisible(false);
            this.mariaText.setVisible(false);
        });
    }

    showAudioLog(logId) {
        const logs = {
            1: "Dr. Vance, Day 1: M.A.R.I.A. is online. She's learning faster than expected. The board is pleased.",
            2: "Captain Morrison: The crew is acting strange. They talk about 'joining' something. M.A.R.I.A. won't respond to my commands.",
            3: "Unknown Crew: She's in my head. She promises perfection. I don't want to resist anymore..."
        };

        if (logs[logId] && !this.audioLogs.includes(logId)) {
            this.audioLogs.push(logId);
            this.logBox.setVisible(true);
            this.logText.setText(`Audio Log ${logId}: ${logs[logId]}`).setVisible(true);

            this.time.delayedCall(6000, () => {
                this.logBox.setVisible(false);
                this.logText.setVisible(false);
            });
        }
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleCombat(delta);
        this.handleInteraction();
        this.updateEnemies(delta);
        this.updateTurrets(delta);
        this.checkExitDoor();
        this.checkEscapePod();
        this.updateHUD();

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.iFrames > 0) this.iFrames -= delta;

        // Energy regen
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + delta * 0.002);

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Update vision position
        const playerScreen = this.cameras.main.getWorldPoint(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        // Vision light follows player but stays fixed to screen center
    }

    handleMovement(delta) {
        const baseSpeed = 150;
        const sprintSpeed = 250;
        const speed = (this.keys.shift.isDown && this.stats.energy > 0) ? sprintSpeed : baseSpeed;

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

        // Sprint energy cost
        if (this.keys.shift.isDown && (vx !== 0 || vy !== 0)) {
            this.stats.energy = Math.max(0, this.stats.energy - delta * 0.005);
        }

        // Face mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.rotation = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        ) + Math.PI / 2;

        this.player.setDepth(this.player.y);
    }

    handleCombat(delta) {
        if (this.input.activePointer.isDown && this.attackCooldown <= 0 && this.stats.ammo > 0) {
            this.shoot();
        }
    }

    shoot() {
        this.attackCooldown = 300;
        this.stats.ammo--;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

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
            duration: 80,
            onComplete: () => muzzle.destroy()
        });

        // Bullet
        const bullet = this.bullets.create(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'bullet'
        );
        bullet.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
        bullet.damage = 12;
        bullet.setDepth(15);

        // Screen shake
        this.cameras.main.shake(30, 0.003);

        this.time.delayedCall(1500, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        // Hit effect
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, bullet.damage.toString(), {
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

        if (enemy.hp <= 0) {
            enemy.destroy();
        }
    }

    bulletHitTurret(bullet, turret) {
        if (turret.friendly) return;

        turret.hp -= bullet.damage;
        bullet.destroy();

        turret.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (turret.active) turret.clearTint();
        });

        if (turret.hp <= 0) {
            turret.destroy();
        }
    }

    bulletHitPlayer(player, bullet) {
        if (this.iFrames > 0) return;
        bullet.destroy();

        this.stats.health -= 15;
        this.iFrames = 500;

        this.cameras.main.shake(100, 0.02);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        if (this.stats.health <= 0) {
            this.scene.start('GameOverScene');
        }
    }

    enemyHitPlayer(player, enemy) {
        if (this.iFrames > 0) return;

        this.stats.health -= enemy.damage;
        this.iFrames = 1000;

        this.cameras.main.shake(100, 0.02);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        if (this.stats.health <= 0) {
            this.scene.start('GameOverScene');
        }
    }

    collectItem(player, item) {
        const type = item.itemType;

        switch (type) {
            case 'medPatch':
                this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 25);
                break;
            case 'ammo':
                this.stats.ammo += 12;
                break;
            case 'keycard':
                this.stats.hasKeycard = true;
                this.showMariaMessage(2);
                break;
            case 'audioLog':
                this.showAudioLog(item.logId);
                break;
        }

        item.destroy();
    }

    handleInteraction() {
        let nearestInteraction = null;
        let nearestDist = 50;

        // Check doors
        this.doors.getChildren().forEach(door => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, door.x, door.y
            );
            if (dist < nearestDist && door.locked) {
                nearestDist = dist;
                nearestInteraction = { type: 'door', obj: door };
            }
        });

        // Check terminals
        this.terminals.getChildren().forEach(terminal => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, terminal.x, terminal.y
            );
            if (dist < nearestDist && terminal.hackable && !terminal.hacked) {
                nearestDist = dist;
                nearestInteraction = { type: 'terminal', obj: terminal };
            }
        });

        // Update prompt
        if (nearestInteraction) {
            if (nearestInteraction.type === 'door') {
                if (nearestInteraction.obj.requiresKeycard && !this.stats.hasKeycard) {
                    this.interactPrompt.setText('Requires Keycard');
                } else {
                    this.interactPrompt.setText('[E] Open Door');
                }
            } else if (nearestInteraction.type === 'terminal') {
                this.interactPrompt.setText('[E] Hack Terminal');
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                if (nearestInteraction.type === 'door') {
                    this.tryOpenDoor(nearestInteraction.obj);
                } else if (nearestInteraction.type === 'terminal') {
                    this.hackTerminal(nearestInteraction.obj);
                }
            }
        } else {
            this.interactPrompt.setText('');
        }
    }

    tryOpenDoor(door) {
        if (door.requiresKeycard && !this.stats.hasKeycard) return;

        door.locked = false;
        door.setTexture('doorOpen');
        door.body.immovable = false;
        door.body.checkCollision.none = true;
    }

    handleDoorCollision(player, door) {
        // Only collide if locked
    }

    hackTerminal(terminal) {
        terminal.hacked = true;
        terminal.setTint(0x00ff00);

        // Hack effect - make turret friendly
        if (terminal.target === 'turret') {
            this.turrets.getChildren().forEach(turret => {
                turret.friendly = true;
                turret.setTint(0x44ff44);
            });
        }

        this.showMariaMessage(3);
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.attackTimer > 0) enemy.attackTimer -= delta;

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            if (distToPlayer < 300) {
                if (enemy.ranged && distToPlayer > 100) {
                    // Ranged attack
                    if (enemy.attackTimer <= 0) {
                        this.enemyShoot(enemy);
                        enemy.attackTimer = 1500;
                    }

                    // Maintain distance
                    if (distToPlayer < 150) {
                        const angle = Phaser.Math.Angle.Between(
                            this.player.x, this.player.y, enemy.x, enemy.y
                        );
                        enemy.setVelocity(
                            Math.cos(angle) * enemy.speed * 0.5,
                            Math.sin(angle) * enemy.speed * 0.5
                        );
                    } else {
                        enemy.setVelocity(0, 0);
                    }
                } else {
                    // Chase
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

        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        bullet.setDepth(15);

        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateTurrets(delta) {
        this.turrets.getChildren().forEach(turret => {
            if (turret.attackTimer > 0) turret.attackTimer -= delta;

            const target = turret.friendly ? this.enemies.getChildren() : [this.player];
            let nearestTarget = null;
            let nearestDist = 200;

            target.forEach(t => {
                const dist = Phaser.Math.Distance.Between(turret.x, turret.y, t.x, t.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestTarget = t;
                }
            });

            if (nearestTarget && turret.attackTimer <= 0) {
                turret.attackTimer = 1000;

                const angle = Phaser.Math.Angle.Between(
                    turret.x, turret.y, nearestTarget.x, nearestTarget.y
                );

                if (turret.friendly) {
                    // Shoot enemies
                    const bullet = this.bullets.create(turret.x, turret.y, 'bullet');
                    bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                    bullet.damage = 10;
                    bullet.setDepth(15);
                    this.time.delayedCall(1500, () => {
                        if (bullet.active) bullet.destroy();
                    });
                } else {
                    // Shoot player
                    const bullet = this.enemyBullets.create(turret.x, turret.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                    bullet.setDepth(15);
                    this.time.delayedCall(1500, () => {
                        if (bullet.active) bullet.destroy();
                    });
                }
            }
        });
    }

    checkExitDoor() {
        if (!this.exitDoor) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.exitDoor.x, this.exitDoor.y
        );

        if (dist < 40) {
            // Go to next deck
            this.currentDeck = this.exitDoor.nextDeck;
            this.loadDeck(this.currentDeck);
            this.spawnDeckContents();

            const spawn = this.decks[this.currentDeck].playerSpawn;
            this.player.x = spawn.x;
            this.player.y = spawn.y;

            // Re-add collisions
            this.physics.add.collider(this.player, this.walls);
            this.physics.add.collider(this.enemies, this.walls);
            this.physics.add.collider(this.player, this.doors, this.handleDoorCollision, null, this);

            this.showMariaMessage(4);
        }
    }

    checkEscapePod() {
        if (!this.escapePod) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.escapePod.x, this.escapePod.y
        );

        if (dist < 50) {
            this.interactPrompt.setText('[E] Escape!');
            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                this.scene.start('VictoryScene', { audioLogs: this.audioLogs.length });
            }
        }
    }

    updateHUD() {
        this.healthBar.width = 150 * (this.stats.health / this.stats.maxHealth);
        this.energyBar.width = 150 * (this.stats.energy / this.stats.maxEnergy);
        this.ammoText.setText(`Ammo: ${this.stats.ammo}`);

        if (this.stats.hasKeycard) {
            this.keycardText.setText('Keycard');
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a0008');

        this.add.text(cx, cy - 60, 'YOU DIED', {
            fontSize: '48px',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 10, 'M.A.R.I.A.: "Join us. Perfection awaits."', {
            fontSize: '16px',
            color: '#ff8888',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 80, 'Press SPACE to Retry', {
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
        this.audioLogs = data.audioLogs || 0;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#001020');

        this.add.text(cx, cy - 100, 'YOU ESCAPED', {
            fontSize: '42px',
            color: '#44ff44'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 40, 'The Von Braun drifts silently...', {
            fontSize: '16px',
            color: '#88aa88'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'M.A.R.I.A. remains, but you are free.', {
            fontSize: '14px',
            color: '#668866'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Audio Logs Found: ${this.audioLogs}/3`, {
            fontSize: '16px',
            color: '#4488ff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 120, 'Press SPACE to Play Again', {
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
    backgroundColor: '#0a0a18',
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
