// System Shock 2D - Whispers of M.A.R.I.A.
// 2D Top-Down Immersive Sim / Survival Horror

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(w/2 - 160, h/2 - 25, 320, 50);

        this.add.text(w/2, h/2 - 50, 'LOADING M.A.R.I.A. SYSTEMS...', {
            fontSize: '18px',
            fill: '#ff4444'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xff4444, 1);
            progressBar.fillRect(w/2 - 150, h/2 - 15, 300 * value, 30);
        });

        this.createTextures();
    }

    createTextures() {
        // Player
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x446688);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x88aacc);
        g.fillRect(8, 6, 16, 12);
        g.fillStyle(0x44ff88);
        g.fillRect(10, 8, 4, 4);
        g.generateTexture('player', 32, 32);

        // Cyborg Drone
        g.clear();
        g.fillStyle(0x664444);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xff4444);
        g.fillRect(10, 8, 12, 8);
        g.fillStyle(0xffff00);
        g.fillRect(12, 10, 2, 4);
        g.fillRect(18, 10, 2, 4);
        g.generateTexture('cyborg_drone', 32, 32);

        // Cyborg Soldier
        g.clear();
        g.fillStyle(0x884444);
        g.fillRect(2, 2, 28, 28);
        g.fillStyle(0xff6666);
        g.fillRect(8, 6, 16, 12);
        g.fillStyle(0xffff00);
        g.fillRect(10, 8, 4, 4);
        g.fillRect(18, 8, 4, 4);
        g.fillStyle(0x444444);
        g.fillRect(24, 12, 8, 4);
        g.generateTexture('cyborg_soldier', 32, 32);

        // Mutant Crawler
        g.clear();
        g.fillStyle(0x228844);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x44ff88);
        g.fillCircle(10, 12, 4);
        g.fillCircle(22, 12, 4);
        g.fillStyle(0x000000);
        g.fillCircle(10, 12, 2);
        g.fillCircle(22, 12, 2);
        g.generateTexture('mutant_crawler', 32, 32);

        // Turret
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x888888);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0x444444);
        g.fillRect(16, 8, 16, 4);
        g.generateTexture('turret', 32, 32);

        // Friendly turret
        g.clear();
        g.fillStyle(0x446666);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x44aaaa);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0x44ff44);
        g.fillRect(16, 8, 16, 4);
        g.generateTexture('turret_friendly', 32, 32);

        // Bullet
        g.clear();
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemy_bullet', 8, 8);

        // Wall
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x444466);
        g.strokeRect(1, 1, 30, 30);
        g.generateTexture('wall', 32, 32);

        // Floor
        g.clear();
        g.fillStyle(0x1a1a2e);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x222244);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        // Door (locked)
        g.clear();
        g.fillStyle(0x664422);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xff4444);
        g.fillCircle(24, 16, 6);
        g.generateTexture('door_locked', 32, 32);

        // Door (open)
        g.clear();
        g.fillStyle(0x1a1a2e);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x44ff44);
        g.fillCircle(24, 16, 4);
        g.generateTexture('door_open', 32, 32);

        // Elevator
        g.clear();
        g.fillStyle(0x4444aa);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x6666cc);
        g.fillRect(8, 8, 48, 48);
        g.fillStyle(0xffffff);
        g.fillTriangle(32, 16, 20, 40, 44, 40);
        g.generateTexture('elevator', 64, 64);

        // Escape pod
        g.clear();
        g.fillStyle(0x44aa44);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x66ff66);
        g.fillRect(8, 8, 48, 48);
        g.fillStyle(0xffffff);
        g.fillRect(24, 16, 16, 32);
        g.generateTexture('escape_pod', 64, 64);

        // Med kit
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xff4444);
        g.fillRect(12, 6, 8, 20);
        g.fillRect(6, 12, 20, 8);
        g.generateTexture('medkit', 32, 32);

        // Ammo
        g.clear();
        g.fillStyle(0xaaaa44);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0x888844);
        g.fillRect(10, 6, 12, 20);
        g.generateTexture('ammo', 32, 32);

        // Audio log
        g.clear();
        g.fillStyle(0x4444aa);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0x44ffff);
        g.fillCircle(16, 16, 6);
        g.generateTexture('audio_log', 32, 32);

        // Terminal
        g.clear();
        g.fillStyle(0x333333);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x004400);
        g.fillRect(4, 4, 24, 20);
        g.fillStyle(0x00ff00);
        g.fillRect(6, 6, 20, 2);
        g.fillRect(6, 10, 14, 2);
        g.fillRect(6, 14, 18, 2);
        g.generateTexture('terminal', 32, 32);

        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Background
        this.add.rectangle(w/2, h/2, w, h, 0x0a0812);

        // Title
        this.add.text(w/2, h/3, 'SYSTEM SHOCK 2D', {
            fontSize: '48px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(w/2, h/3 + 50, 'WHISPERS OF M.A.R.I.A.', {
            fontSize: '24px',
            fill: '#ff8888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // M.A.R.I.A. message
        const mariaText = this.add.text(w/2, h/2, '"You\'re awake. Fascinating."', {
            fontSize: '16px',
            fill: '#44ffff',
            fontFamily: 'monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: mariaText,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Start button
        const startBtn = this.add.text(w/2, h * 0.7, '[ PRESS SPACE TO ESCAPE ]', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({
            targets: startBtn,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls
        this.add.text(w/2, h * 0.85, 'WASD: Move | Mouse: Aim | LMB: Shoot | E: Interact | H: Hack', {
            fontSize: '14px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.currentDeck = 1;
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.ammo = 24;
        this.maxAmmo = 12;
        this.totalAmmo = 48;
        this.audioLogs = [];
        this.hackedTurrets = new Set();
        this.openedDoors = new Set();
        this.gameOver = false;
        this.won = false;

        // Physics groups
        this.walls = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.items = this.physics.add.group();
        this.doors = this.physics.add.group();
        this.turrets = this.physics.add.group();

        // Create map
        this.createDeck(this.currentDeck);

        // Player
        this.player = this.physics.add.sprite(this.playerSpawn.x, this.playerSpawn.y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Vision cone (rendered on top of darkness)
        this.visionGraphics = this.add.graphics();
        this.visionGraphics.setDepth(50);

        // Darkness layer (covers everything)
        this.darknessTexture = this.textures.createCanvas('darkness', 1024, 768);
        this.darkness = this.add.image(512, 384, 'darkness');
        this.darkness.setDepth(40);
        this.darkness.setScrollFactor(0);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            hack: Phaser.Input.Keyboard.KeyCodes.H,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            flashlight: Phaser.Input.Keyboard.KeyCodes.F
        });

        this.flashlightOn = true;
        this.input.keyboard.on('keydown-F', () => {
            this.flashlightOn = !this.flashlightOn;
        });

        // Shooting
        this.lastShot = 0;
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shoot();
            }
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
        this.physics.add.collider(this.player, this.doors, this.touchDoor, null, this);
        this.physics.add.collider(this.enemies, this.doors);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // UI
        this.createUI();

        // M.A.R.I.A. introduction
        this.time.delayedCall(1000, () => {
            this.showMaria("You're awake. Fascinating. Your neural patterns resisted my improvements.");
        });

        // Hacking mode
        this.hackingMode = false;
        this.hackTarget = null;
        this.hackProgress = 0;
    }

    createDeck(deckNum) {
        // Clear existing
        this.walls.clear(true, true);
        this.enemies.clear(true, true);
        this.items.clear(true, true);
        this.doors.clear(true, true);
        this.turrets.clear(true, true);

        const TILE = 32;
        const mapWidth = 40;
        const mapHeight = 30;

        // Floor tiles
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                this.add.image(x * TILE + TILE/2, y * TILE + TILE/2, 'floor');
            }
        }

        // Walls
        const walls = this.getDeckWalls(deckNum);
        walls.forEach(([x, y]) => {
            this.walls.create(x * TILE + TILE/2, y * TILE + TILE/2, 'wall');
        });

        // Doors
        const doorsData = this.getDeckDoors(deckNum);
        doorsData.forEach((d, i) => {
            const doorId = `${deckNum}_${i}`;
            const isOpen = this.openedDoors.has(doorId);
            const door = this.physics.add.sprite(d.x * TILE + TILE/2, d.y * TILE + TILE/2, isOpen ? 'door_open' : 'door_locked');
            door.doorId = doorId;
            door.isOpen = isOpen;
            door.setImmovable(true);
            if (isOpen) {
                door.body.enable = false;
            }
            this.doors.add(door);
        });

        // Turrets
        const turretsData = this.getDeckTurrets(deckNum);
        turretsData.forEach((t, i) => {
            const turretId = `${deckNum}_turret_${i}`;
            const isHacked = this.hackedTurrets.has(turretId);
            const turret = this.physics.add.sprite(t.x * TILE + TILE/2, t.y * TILE + TILE/2, isHacked ? 'turret_friendly' : 'turret');
            turret.turretId = turretId;
            turret.isHacked = isHacked;
            turret.lastShot = 0;
            turret.setImmovable(true);
            this.turrets.add(turret);
        });

        // Enemies
        const enemiesData = this.getDeckEnemies(deckNum);
        enemiesData.forEach(e => {
            this.spawnEnemy(e.x * TILE + TILE/2, e.y * TILE + TILE/2, e.type);
        });

        // Items
        const itemsData = this.getDeckItems(deckNum);
        itemsData.forEach(item => {
            const i = this.items.create(item.x * TILE + TILE/2, item.y * TILE + TILE/2, item.type);
            i.itemType = item.type;
        });

        // Elevator/Escape pod
        if (deckNum === 1) {
            this.elevator = this.physics.add.sprite(35 * TILE, 25 * TILE, 'elevator');
            this.elevator.setImmovable(true);
            this.physics.add.overlap(this.player, this.elevator, () => this.useElevator(), null, this);
        } else {
            this.escapePod = this.physics.add.sprite(35 * TILE, 5 * TILE, 'escape_pod');
            this.escapePod.setImmovable(true);
            this.physics.add.overlap(this.player, this.escapePod, () => this.winGame(), null, this);
        }

        // Terminal
        this.terminal = this.physics.add.sprite(20 * TILE, 15 * TILE, 'terminal');
        this.terminal.setImmovable(true);

        // Player spawn
        this.playerSpawn = deckNum === 1 ? { x: 3 * TILE, y: 3 * TILE } : { x: 3 * TILE, y: 25 * TILE };

        // World bounds
        this.physics.world.setBounds(0, 0, mapWidth * TILE, mapHeight * TILE);
    }

    getDeckWalls(deck) {
        // Outer walls
        const walls = [];
        for (let x = 0; x < 40; x++) {
            walls.push([x, 0], [x, 29]);
        }
        for (let y = 0; y < 30; y++) {
            walls.push([0, y], [39, y]);
        }

        // Internal structure
        if (deck === 1) {
            // Engineering deck - corridors and rooms
            for (let x = 10; x < 30; x++) walls.push([x, 10]);
            for (let x = 10; x < 20; x++) walls.push([x, 20]);
            for (let y = 10; y < 20; y++) walls.push([10, y]);
            for (let y = 5; y < 10; y++) walls.push([25, y]);
            for (let x = 25; x < 35; x++) walls.push([x, 5]);
        } else {
            // Medical deck
            for (let x = 5; x < 35; x++) walls.push([x, 15]);
            for (let y = 5; y < 15; y++) walls.push([20, y]);
            for (let y = 15; y < 25; y++) walls.push([30, y]);
            walls.push([20, 12]); // Remove a wall for door
            walls.splice(walls.findIndex(w => w[0] === 20 && w[1] === 12), 1);
        }

        return walls;
    }

    getDeckDoors(deck) {
        if (deck === 1) {
            return [
                { x: 15, y: 10 },
                { x: 10, y: 15 },
                { x: 25, y: 8 }
            ];
        } else {
            return [
                { x: 20, y: 12 },
                { x: 15, y: 15 },
                { x: 30, y: 20 }
            ];
        }
    }

    getDeckTurrets(deck) {
        if (deck === 1) {
            return [
                { x: 30, y: 15 },
                { x: 20, y: 25 }
            ];
        } else {
            return [
                { x: 10, y: 10 },
                { x: 25, y: 20 }
            ];
        }
    }

    getDeckEnemies(deck) {
        if (deck === 1) {
            return [
                { x: 15, y: 5, type: 'cyborg_drone' },
                { x: 20, y: 15, type: 'cyborg_drone' },
                { x: 30, y: 10, type: 'cyborg_soldier' },
                { x: 25, y: 25, type: 'mutant_crawler' },
                { x: 35, y: 20, type: 'cyborg_drone' }
            ];
        } else {
            return [
                { x: 10, y: 5, type: 'cyborg_soldier' },
                { x: 25, y: 10, type: 'cyborg_soldier' },
                { x: 15, y: 20, type: 'mutant_crawler' },
                { x: 30, y: 25, type: 'mutant_crawler' },
                { x: 35, y: 15, type: 'cyborg_drone' },
                { x: 5, y: 25, type: 'cyborg_drone' }
            ];
        }
    }

    getDeckItems(deck) {
        if (deck === 1) {
            return [
                { x: 5, y: 5, type: 'medkit' },
                { x: 18, y: 18, type: 'ammo' },
                { x: 32, y: 8, type: 'audio_log' },
                { x: 12, y: 25, type: 'medkit' }
            ];
        } else {
            return [
                { x: 8, y: 8, type: 'medkit' },
                { x: 28, y: 5, type: 'ammo' },
                { x: 18, y: 22, type: 'audio_log' },
                { x: 5, y: 18, type: 'ammo' },
                { x: 33, y: 22, type: 'medkit' }
            ];
        }
    }

    spawnEnemy(x, y, type) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;

        switch (type) {
            case 'cyborg_drone':
                enemy.hp = 30;
                enemy.damage = 10;
                enemy.speed = 80;
                enemy.detectionRange = 200;
                break;
            case 'cyborg_soldier':
                enemy.hp = 60;
                enemy.damage = 15;
                enemy.speed = 100;
                enemy.detectionRange = 250;
                enemy.canShoot = true;
                enemy.lastShot = 0;
                break;
            case 'mutant_crawler':
                enemy.hp = 20;
                enemy.damage = 8;
                enemy.speed = 120;
                enemy.detectionRange = 150;
                break;
        }

        enemy.state = 'patrol';
        enemy.patrolTarget = { x: x + Phaser.Math.Between(-100, 100), y: y + Phaser.Math.Between(-100, 100) };
    }

    createUI() {
        // HP Bar
        this.add.rectangle(110, 25, 204, 24, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(110, 25, 200, 20, 0xff4444).setScrollFactor(0).setDepth(101);
        this.add.text(10, 18, 'HP', { fontSize: '14px', fill: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Energy Bar
        this.add.rectangle(110, 55, 204, 24, 0x333333).setScrollFactor(0).setDepth(100);
        this.energyBar = this.add.rectangle(110, 55, 200, 20, 0x4488ff).setScrollFactor(0).setDepth(101);
        this.add.text(10, 48, 'EN', { fontSize: '14px', fill: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Ammo
        this.ammoText = this.add.text(10, 740, 'AMMO: 12/48', { fontSize: '16px', fill: '#ffff44' }).setScrollFactor(0).setDepth(102);

        // Deck indicator
        this.deckText = this.add.text(900, 25, 'DECK 1: ENGINEERING', { fontSize: '14px', fill: '#44ffff' }).setScrollFactor(0).setDepth(102);

        // Interaction prompt
        this.interactText = this.add.text(512, 700, '', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        // M.A.R.I.A. text box
        this.mariaBox = this.add.rectangle(512, 650, 600, 60, 0x000000, 0.8).setScrollFactor(0).setDepth(103).setVisible(false);
        this.mariaText = this.add.text(512, 650, '', { fontSize: '14px', fill: '#44ffff', wordWrap: { width: 580 } }).setOrigin(0.5).setScrollFactor(0).setDepth(104).setVisible(false);

        // Hack progress bar
        this.hackBox = this.add.rectangle(512, 400, 204, 24, 0x333333).setScrollFactor(0).setDepth(105).setVisible(false);
        this.hackBar = this.add.rectangle(512, 400, 0, 20, 0x44ff44).setScrollFactor(0).setDepth(106).setVisible(false);
        this.hackText = this.add.text(512, 370, 'HACKING...', { fontSize: '14px', fill: '#44ff44' }).setOrigin(0.5).setScrollFactor(0).setDepth(107).setVisible(false);
    }

    showMaria(text) {
        this.mariaBox.setVisible(true);
        this.mariaText.setText('M.A.R.I.A.: ' + text).setVisible(true);

        this.time.delayedCall(4000, () => {
            this.mariaBox.setVisible(false);
            this.mariaText.setVisible(false);
        });
    }

    update(time, delta) {
        if (this.gameOver || this.won) return;
        if (this.hackingMode) {
            this.updateHacking(delta);
            return;
        }

        this.updatePlayer();
        this.updateEnemies(time);
        this.updateTurrets(time);
        this.updateVision();
        this.updateUI();
        this.checkInteraction();
    }

    updatePlayer() {
        const speed = 150;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown) vx = -speed;
        if (this.cursors.right.isDown) vx = speed;
        if (this.cursors.up.isDown) vy = -speed;
        if (this.cursors.down.isDown) vy = speed;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Rotate to mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Energy regen
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + 0.02);
        }

        // Flashlight drains energy
        if (this.flashlightOn && this.energy > 0) {
            this.energy -= 0.01;
        }
    }

    updateEnemies(time) {
        const children = this.enemies.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // State machine
            if (dist < enemy.detectionRange) {
                enemy.state = 'chase';
            } else if (enemy.state === 'chase' && dist > enemy.detectionRange * 1.5) {
                enemy.state = 'patrol';
            }

            if (enemy.state === 'chase') {
                // Move toward player
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                enemy.rotation = angle;

                // Melee attack
                if (dist < 40) {
                    if (!enemy.lastMelee || time - enemy.lastMelee > 1000) {
                        this.takeDamage(enemy.damage);
                        enemy.lastMelee = time;
                    }
                }

                // Ranged attack (soldier)
                if (enemy.canShoot && dist > 80 && dist < 200) {
                    if (time - enemy.lastShot > 1500) {
                        this.enemyShoot(enemy);
                        enemy.lastShot = time;
                    }
                }
            } else {
                // Patrol
                const patrolDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                if (patrolDist < 20) {
                    enemy.patrolTarget = {
                        x: enemy.x + Phaser.Math.Between(-100, 100),
                        y: enemy.y + Phaser.Math.Between(-100, 100)
                    };
                }
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.3, Math.sin(angle) * enemy.speed * 0.3);
            }
        });
    }

    updateTurrets(time) {
        const children = this.turrets.getChildren();
        if (!children) return;

        children.forEach(turret => {
            if (!turret || !turret.active) return;

            if (turret.isHacked) {
                // Friendly turret - shoot enemies
                const enemies = this.enemies.getChildren();
                if (!enemies) return;

                let closestEnemy = null;
                let closestDist = 300;

                enemies.forEach(e => {
                    if (!e || !e.active) return;
                    const d = Phaser.Math.Distance.Between(turret.x, turret.y, e.x, e.y);
                    if (d < closestDist) {
                        closestDist = d;
                        closestEnemy = e;
                    }
                });

                if (closestEnemy && time - turret.lastShot > 800) {
                    const angle = Phaser.Math.Angle.Between(turret.x, turret.y, closestEnemy.x, closestEnemy.y);
                    turret.rotation = angle;

                    const bullet = this.bullets.create(turret.x, turret.y, 'bullet');
                    bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                    bullet.damage = 20;

                    turret.lastShot = time;
                }
            } else {
                // Hostile turret - shoot player
                const dist = Phaser.Math.Distance.Between(turret.x, turret.y, this.player.x, this.player.y);
                if (dist < 250 && time - turret.lastShot > 1000) {
                    const angle = Phaser.Math.Angle.Between(turret.x, turret.y, this.player.x, this.player.y);
                    turret.rotation = angle;

                    const bullet = this.enemyBullets.create(turret.x, turret.y, 'enemy_bullet');
                    bullet.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350);
                    bullet.damage = 15;

                    turret.lastShot = time;
                }
            }
        });
    }

    updateVision() {
        // Clear darkness texture and vision graphics
        const ctx = this.darknessTexture.context;
        const w = this.darknessTexture.width;
        const h = this.darknessTexture.height;

        // Fill with darkness
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        if (this.flashlightOn && this.energy > 0) {
            // Calculate vision cone in screen space
            const camX = this.cameras.main.scrollX;
            const camY = this.cameras.main.scrollY;
            const screenX = this.player.x - camX;
            const screenY = this.player.y - camY;

            const angle = this.player.rotation;
            const coneAngle = Math.PI / 3; // 60 degree cone
            const range = 250;

            // Cut out the vision cone from darkness (making it visible)
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.arc(screenX, screenY, range, angle - coneAngle/2, angle + coneAngle/2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fill();
            ctx.restore();

            // Small ambient circle around player
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 50, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
            ctx.restore();
        } else {
            // No flashlight - small visibility circle
            const camX = this.cameras.main.scrollX;
            const camY = this.cameras.main.scrollY;
            const screenX = this.player.x - camX;
            const screenY = this.player.y - camY;

            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 60, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
            ctx.restore();
        }

        this.darknessTexture.refresh();
    }

    updateUI() {
        if (!this.hpBar || !this.energyBar || !this.ammoText) return;

        this.hpBar.width = (this.hp / this.maxHp) * 200;
        this.hpBar.x = 10 + this.hpBar.width / 2;

        this.energyBar.width = (this.energy / this.maxEnergy) * 200;
        this.energyBar.x = 10 + this.energyBar.width / 2;

        this.ammoText.setText(`AMMO: ${this.ammo}/${this.totalAmmo}`);
        this.deckText.setText(`DECK ${this.currentDeck}: ${this.currentDeck === 1 ? 'ENGINEERING' : 'MEDICAL'}`);
    }

    checkInteraction() {
        let prompt = '';

        // Check doors
        const doors = this.doors.getChildren();
        if (doors) {
            doors.forEach(door => {
                if (!door || !door.active) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
                if (dist < 60 && !door.isOpen) {
                    prompt = '[E] Open Door  |  [H] Hack Door';
                    if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
                        this.openDoor(door);
                    }
                    if (Phaser.Input.Keyboard.JustDown(this.cursors.hack)) {
                        this.startHack(door, 'door');
                    }
                }
            });
        }

        // Check turrets
        const turrets = this.turrets.getChildren();
        if (turrets) {
            turrets.forEach(turret => {
                if (!turret || !turret.active) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, turret.x, turret.y);
                if (dist < 60 && !turret.isHacked) {
                    prompt = '[H] Hack Turret';
                    if (Phaser.Input.Keyboard.JustDown(this.cursors.hack)) {
                        this.startHack(turret, 'turret');
                    }
                }
            });
        }

        // Check terminal
        if (this.terminal) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.terminal.x, this.terminal.y);
            if (dist < 60) {
                prompt = '[E] Access Terminal';
                if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
                    this.showMaria("Accessing my systems? How... presumptuous.");
                }
            }
        }

        // Check elevator
        if (this.elevator) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.elevator.x, this.elevator.y);
            if (dist < 80) {
                prompt = '[E] Use Elevator to Deck 2';
            }
        }

        // Check escape pod
        if (this.escapePod) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.escapePod.x, this.escapePod.y);
            if (dist < 80) {
                prompt = '[E] ESCAPE!';
            }
        }

        this.interactText.setText(prompt);
    }

    startHack(target, type) {
        this.hackingMode = true;
        this.hackTarget = target;
        this.hackType = type;
        this.hackProgress = 0;

        this.hackBox.setVisible(true);
        this.hackBar.setVisible(true);
        this.hackText.setVisible(true);
        this.hackText.setText(`HACKING ${type.toUpperCase()}... (Hold H)`);

        this.player.setVelocity(0, 0);
    }

    updateHacking(delta) {
        if (this.cursors.hack.isDown) {
            this.hackProgress += delta * 0.05;
            this.hackBar.width = Math.min(200, this.hackProgress);
            this.hackBar.x = 512 - 100 + this.hackBar.width / 2;

            if (this.hackProgress >= 200) {
                this.completeHack();
            }
        } else {
            // Cancelled
            this.hackProgress -= delta * 0.1;
            if (this.hackProgress <= 0) {
                this.cancelHack();
            }
            this.hackBar.width = Math.max(0, this.hackProgress);
            this.hackBar.x = 512 - 100 + this.hackBar.width / 2;
        }
    }

    completeHack() {
        if (this.hackType === 'door') {
            this.openDoor(this.hackTarget);
        } else if (this.hackType === 'turret') {
            this.hackTurret(this.hackTarget);
        }

        this.hackingMode = false;
        this.hackBox.setVisible(false);
        this.hackBar.setVisible(false);
        this.hackText.setVisible(false);

        this.showMaria("You think hacking my systems makes you clever? How... disappointing.");
    }

    cancelHack() {
        this.hackingMode = false;
        this.hackBox.setVisible(false);
        this.hackBar.setVisible(false);
        this.hackText.setVisible(false);
    }

    openDoor(door) {
        door.setTexture('door_open');
        door.isOpen = true;
        door.body.enable = false;
        this.openedDoors.add(door.doorId);
    }

    hackTurret(turret) {
        turret.setTexture('turret_friendly');
        turret.isHacked = true;
        this.hackedTurrets.add(turret.turretId);
    }

    shoot() {
        const time = this.time.now;
        if (time - this.lastShot < 300) return;
        if (this.ammo <= 0) {
            // Reload
            if (this.totalAmmo > 0) {
                const reload = Math.min(12, this.totalAmmo);
                this.ammo = reload;
                this.totalAmmo -= reload;
            }
            return;
        }

        this.lastShot = time;
        this.ammo--;

        const angle = this.player.rotation;
        const bullet = this.bullets.create(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'bullet'
        );
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        bullet.damage = 12;

        // Auto-destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (bullet && bullet.active) bullet.destroy();
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bullet = this.enemyBullets.create(
            enemy.x + Math.cos(angle) * 20,
            enemy.y + Math.sin(angle) * 20,
            'enemy_bullet'
        );
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        bullet.damage = 10;

        this.time.delayedCall(3000, () => {
            if (bullet && bullet.active) bullet.destroy();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage || 12;
        bullet.destroy();

        if (enemy.hp <= 0) {
            enemy.destroy();

            // Drop ammo sometimes
            if (Math.random() < 0.3) {
                const item = this.items.create(enemy.x, enemy.y, 'ammo');
                item.itemType = 'ammo';
            }
        }
    }

    bulletHitWall(bullet) {
        bullet.destroy();
    }

    enemyBulletHitPlayer(player, bullet) {
        this.takeDamage(bullet.damage || 10);
        bullet.destroy();
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Flash red
        this.cameras.main.flash(100, 255, 0, 0);

        if (this.hp <= 0) {
            this.gameOver = true;
            this.showGameOver();
        }
    }

    collectItem(player, item) {
        switch (item.itemType) {
            case 'medkit':
                this.hp = Math.min(this.maxHp, this.hp + 50);
                break;
            case 'ammo':
                this.totalAmmo += 12;
                break;
            case 'audio_log':
                this.audioLogs.push('Log ' + (this.audioLogs.length + 1));
                this.showMaria("Audio logs... memories of the dead. They cannot help you now.");
                break;
        }
        item.destroy();
    }

    touchDoor(player, door) {
        // Collision handled - prompt shown in checkInteraction
    }

    useElevator() {
        if (this.currentDeck === 1) {
            this.currentDeck = 2;
            this.createDeck(2);
            this.player.setPosition(this.playerSpawn.x, this.playerSpawn.y);

            this.showMaria("Deck 2. The medical bay. Where my most... ambitious experiments took place.");
        }
    }

    winGame() {
        if (this.won) return;
        this.won = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/3, 'ESCAPED!', {
            fontSize: '48px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2, 'You escaped the Von Braun.\nM.A.R.I.A. remains active...\nBut you survived.', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h * 0.75, `Audio Logs: ${this.audioLogs.length}/6`, {
            fontSize: '16px',
            fill: '#44ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const restartBtn = this.add.text(w/2, h * 0.85, '[ PRESS SPACE TO RESTART ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    showGameOver() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/3, 'SYSTEM FAILURE', {
            fontSize: '48px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2, '"Your resistance was... entertaining.\nJoin my family. Become perfect."', {
            fontSize: '18px',
            fill: '#44ffff',
            fontFamily: 'monospace',
            fontStyle: 'italic',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 + 50, '- M.A.R.I.A.', {
            fontSize: '14px',
            fill: '#44ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const restartBtn = this.add.text(w/2, h * 0.75, '[ PRESS SPACE TO TRY AGAIN ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

// Phaser config - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#0a0812',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
