// Zero Sievert Clone - Extraction Shooter
// Top-down extraction looter shooter

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

        this.add.text(w/2, h/2 - 50, 'LOADING ZONE DATA...', {
            fontSize: '18px',
            fill: '#88cc44'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x88cc44, 1);
            progressBar.fillRect(w/2 - 150, h/2 - 15, 300 * value, 30);
        });

        this.createTextures();
    }

    createTextures() {
        const T = 32;
        let g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player
        g.fillStyle(0x446644);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x88aa88);
        g.fillRect(8, 6, 16, 12);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x333333);
        g.fillRect(22, 12, 10, 4);
        g.generateTexture('player', T, T);

        // Wolf
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0x555555);
        g.fillRect(20, 6, 10, 8);
        g.fillStyle(0xff4444);
        g.fillCircle(26, 10, 2);
        g.generateTexture('wolf', T, T);

        // Boar
        g.clear();
        g.fillStyle(0x664422);
        g.fillRect(2, 6, 28, 20);
        g.fillStyle(0x553311);
        g.fillRect(22, 8, 10, 12);
        g.fillStyle(0xcccccc);
        g.fillRect(28, 10, 4, 4);
        g.fillRect(28, 16, 4, 4);
        g.generateTexture('boar', T, T);

        // Bandit (melee)
        g.clear();
        g.fillStyle(0x443322);
        g.fillRect(6, 4, 20, 24);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x666666);
        g.fillRect(22, 14, 10, 4);
        g.generateTexture('bandit_melee', T, T);

        // Bandit (pistol)
        g.clear();
        g.fillStyle(0x334433);
        g.fillRect(6, 4, 20, 24);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x222222);
        g.fillRect(22, 12, 8, 3);
        g.generateTexture('bandit_pistol', T, T);

        // Bandit (rifle)
        g.clear();
        g.fillStyle(0x223322);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x222222);
        g.fillRect(20, 10, 14, 4);
        g.generateTexture('bandit_rifle', T, T);

        // Grass
        g.clear();
        g.fillStyle(0x2a4a2a);
        g.fillRect(0, 0, T, T);
        g.fillStyle(0x3a5a3a);
        for (let i = 0; i < 8; i++) {
            g.fillRect(Math.random() * 28, Math.random() * 28, 4, 4);
        }
        g.generateTexture('grass', T, T);

        // Dirt
        g.clear();
        g.fillStyle(0x4a3a2a);
        g.fillRect(0, 0, T, T);
        g.fillStyle(0x5a4a3a);
        for (let i = 0; i < 4; i++) {
            g.fillRect(Math.random() * 24 + 4, Math.random() * 24 + 4, 6, 6);
        }
        g.generateTexture('dirt', T, T);

        // Tree
        g.clear();
        g.fillStyle(0x553311);
        g.fillRect(12, 16, 8, 16);
        g.fillStyle(0x225522);
        g.fillCircle(16, 12, 14);
        g.generateTexture('tree', T, T);

        // Bush
        g.clear();
        g.fillStyle(0x2a4a2a);
        g.fillRect(0, 0, T, T);
        g.fillStyle(0x336633);
        g.fillCircle(16, 16, 12);
        g.generateTexture('bush', T, T);

        // Building wall
        g.clear();
        g.fillStyle(0x555555);
        g.fillRect(0, 0, T, T);
        g.lineStyle(2, 0x666666);
        g.strokeRect(2, 2, T-4, T-4);
        g.generateTexture('wall', T, T);

        // Door
        g.clear();
        g.fillStyle(0x664422);
        g.fillRect(0, 0, T, T);
        g.fillStyle(0xccaa44);
        g.fillCircle(24, 16, 4);
        g.generateTexture('door', T, T);

        // Loot crate
        g.clear();
        g.fillStyle(0x886644);
        g.fillRect(4, 4, 24, 24);
        g.lineStyle(2, 0xaa8866);
        g.strokeRect(6, 6, 20, 20);
        g.fillStyle(0xffff44);
        g.fillRect(14, 12, 4, 8);
        g.generateTexture('crate', T, T);

        // Medical crate
        g.clear();
        g.fillStyle(0x884444);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xffffff);
        g.fillRect(12, 8, 8, 16);
        g.fillRect(8, 12, 16, 8);
        g.generateTexture('medical_crate', T, T);

        // Extraction zone
        g.clear();
        g.fillStyle(0x44ff44);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x88ff88);
        g.fillRect(8, 8, 48, 48);
        g.fillStyle(0xffffff);
        g.fillRect(24, 16, 16, 32);
        g.fillTriangle(32, 8, 16, 24, 48, 24);
        g.generateTexture('extraction', 64, 64);

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

        this.add.rectangle(w/2, h/2, w, h, 0x0a0d0a);

        this.add.text(w/2, h/4, 'ZERO SIEVERT', {
            fontSize: '48px',
            fill: '#88cc44',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(w/2, h/4 + 50, 'EXTRACTION SHOOTER', {
            fontSize: '20px',
            fill: '#aaddaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(w/2, h/2 - 30, 'FOREST ZONE - RAID', {
            fontSize: '18px',
            fill: '#ffff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Weapon selection
        this.add.text(w/2, h/2 + 20, 'SELECT WEAPON:', {
            fontSize: '14px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.weapons = [
            { name: 'PM Pistol', damage: 18, fireRate: 300, mag: 8, spread: 8 },
            { name: 'Skorpion SMG', damage: 14, fireRate: 100, mag: 20, spread: 12 },
            { name: 'Pump Shotgun', damage: 8, fireRate: 800, mag: 6, spread: 25, pellets: 8 },
            { name: 'AK-74', damage: 28, fireRate: 150, mag: 30, spread: 6 }
        ];

        this.selectedWeapon = 0;

        this.weapons.forEach((w, i) => {
            const btn = this.add.text(this.cameras.main.width/2, h/2 + 60 + i * 30, `[${i+1}] ${w.name}`, {
                fontSize: '16px',
                fill: i === 0 ? '#88ff88' : '#aaaaaa',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerover', () => btn.setFill('#ffffff'));
            btn.on('pointerout', () => btn.setFill(this.selectedWeapon === i ? '#88ff88' : '#aaaaaa'));
            btn.on('pointerdown', () => {
                this.selectedWeapon = i;
                this.updateWeaponSelection();
            });

            this.weapons[i].btn = btn;
        });

        const startBtn = this.add.text(w/2, h * 0.85, '[ PRESS SPACE TO DEPLOY ]', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({
            targets: startBtn,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.add.text(w/2, h * 0.95, 'WASD: Move | Mouse: Aim | LMB: Shoot | R: Reload | E: Loot', {
            fontSize: '12px',
            fill: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene', { weapon: this.weapons[this.selectedWeapon] });
        });

        this.input.keyboard.on('keydown-ONE', () => { this.selectedWeapon = 0; this.updateWeaponSelection(); });
        this.input.keyboard.on('keydown-TWO', () => { this.selectedWeapon = 1; this.updateWeaponSelection(); });
        this.input.keyboard.on('keydown-THREE', () => { this.selectedWeapon = 2; this.updateWeaponSelection(); });
        this.input.keyboard.on('keydown-FOUR', () => { this.selectedWeapon = 3; this.updateWeaponSelection(); });

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { weapon: this.weapons[this.selectedWeapon] });
        });
    }

    updateWeaponSelection() {
        this.weapons.forEach((w, i) => {
            w.btn.setFill(this.selectedWeapon === i ? '#88ff88' : '#aaaaaa');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.selectedWeapon = data.weapon || { name: 'PM Pistol', damage: 18, fireRate: 300, mag: 8, spread: 8 };
    }

    create() {
        this.TILE = 32;
        this.MAP_W = 50;
        this.MAP_H = 50;

        // State
        this.hp = 100;
        this.maxHp = 100;
        this.bleeding = false;
        this.bleedTimer = 0;
        this.ammo = this.selectedWeapon.mag;
        this.maxAmmo = this.selectedWeapon.mag;
        this.totalAmmo = this.selectedWeapon.mag * 3;
        this.kills = 0;
        this.lootValue = 0;
        this.gameOver = false;
        this.extracted = false;
        this.reloading = false;

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.trees = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.lootCrates = this.physics.add.group();

        // Generate map
        this.generateMap();

        // Player
        this.player = this.physics.add.sprite(3 * this.TILE, 3 * this.TILE, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Extraction zone (far corner)
        this.extraction = this.physics.add.sprite((this.MAP_W - 3) * this.TILE, (this.MAP_H - 3) * this.TILE, 'extraction');
        this.extraction.setDepth(5);

        // Vision/fog
        this.darknessTexture = this.textures.createCanvas('darkness', 1024, 768);
        this.darkness = this.add.image(512, 384, 'darkness');
        this.darkness.setDepth(50);
        this.darkness.setScrollFactor(0);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            interact: Phaser.Input.Keyboard.KeyCodes.E
        });

        this.lastShot = 0;
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.shoot();
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.trees);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.bullets, this.trees, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.player, this.extraction, () => this.extract(), null, this);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.physics.world.setBounds(0, 0, this.MAP_W * this.TILE, this.MAP_H * this.TILE);

        // UI
        this.createUI();
    }

    generateMap() {
        // Floor
        for (let y = 0; y < this.MAP_H; y++) {
            for (let x = 0; x < this.MAP_W; x++) {
                const type = Math.random() < 0.8 ? 'grass' : 'dirt';
                this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, type);
            }
        }

        // Trees (scattered)
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(2, this.MAP_W - 3);
            const y = Phaser.Math.Between(2, this.MAP_H - 3);
            // Don't place near spawn or extraction
            if ((x < 6 && y < 6) || (x > this.MAP_W - 8 && y > this.MAP_H - 8)) continue;

            const tree = this.trees.create(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'tree');
            tree.setDepth(8);
        }

        // Buildings (small huts)
        this.createBuilding(15, 15, 5, 4);
        this.createBuilding(30, 10, 4, 5);
        this.createBuilding(20, 35, 6, 4);
        this.createBuilding(40, 25, 4, 4);

        // Loot crates
        const cratePositions = [
            [5, 5], [10, 8], [25, 12], [35, 8], [12, 25],
            [30, 30], [42, 18], [8, 40], [22, 40], [45, 40]
        ];
        cratePositions.forEach(([x, y]) => {
            const isMedical = Math.random() < 0.4; // 40% medical crates (more healing)
            const crate = this.lootCrates.create(x * this.TILE, y * this.TILE, isMedical ? 'medical_crate' : 'crate');
            crate.isMedical = isMedical;
            crate.setDepth(6);
        });

        // Spawn enemies
        this.spawnEnemies();
    }

    createBuilding(bx, by, w, h) {
        // Walls
        for (let x = bx; x < bx + w; x++) {
            this.walls.create(x * this.TILE + this.TILE/2, by * this.TILE + this.TILE/2, 'wall').setDepth(9);
            this.walls.create(x * this.TILE + this.TILE/2, (by + h - 1) * this.TILE + this.TILE/2, 'wall').setDepth(9);
        }
        for (let y = by + 1; y < by + h - 1; y++) {
            this.walls.create(bx * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'wall').setDepth(9);
            this.walls.create((bx + w - 1) * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'wall').setDepth(9);
        }

        // Floor inside
        for (let x = bx + 1; x < bx + w - 1; x++) {
            for (let y = by + 1; y < by + h - 1; y++) {
                this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'dirt');
            }
        }

        // Door (bottom wall, middle)
        const doorX = bx + Math.floor(w / 2);
        const doorY = by + h - 1;

        // Remove wall at door position and add door visual
        const wallsArray = this.walls.getChildren();
        const doorWall = wallsArray.find(wall =>
            Math.abs(wall.x - (doorX * this.TILE + this.TILE/2)) < 5 &&
            Math.abs(wall.y - (doorY * this.TILE + this.TILE/2)) < 5
        );
        if (doorWall) doorWall.destroy();

        this.add.image(doorX * this.TILE + this.TILE/2, doorY * this.TILE + this.TILE/2, 'door').setDepth(9);

        // Loot inside
        const cx = bx + 1 + Math.floor((w - 2) / 2);
        const cy = by + 1 + Math.floor((h - 2) / 2);
        const crate = this.lootCrates.create(cx * this.TILE, cy * this.TILE, 'crate');
        crate.isMedical = false;
        crate.setDepth(6);
    }

    spawnEnemies() {
        const enemyData = [
            { type: 'wolf', hp: 40, damage: 15, speed: 120, texture: 'wolf' },
            { type: 'boar', hp: 80, damage: 20, speed: 100, texture: 'boar' },
            { type: 'bandit_melee', hp: 60, damage: 12, speed: 80, texture: 'bandit_melee' },
            { type: 'bandit_pistol', hp: 60, damage: 15, speed: 70, texture: 'bandit_pistol', canShoot: true, fireRate: 800 },
            { type: 'bandit_rifle', hp: 50, damage: 25, speed: 60, texture: 'bandit_rifle', canShoot: true, fireRate: 500 }
        ];

        // Wildlife
        for (let i = 0; i < 8; i++) {
            const data = enemyData[Phaser.Math.Between(0, 1)]; // wolf or boar
            this.spawnEnemy(data);
        }

        // Bandits
        for (let i = 0; i < 12; i++) {
            const data = enemyData[Phaser.Math.Between(2, 4)]; // bandit types
            this.spawnEnemy(data);
        }
    }

    spawnEnemy(data) {
        let x, y;
        do {
            x = Phaser.Math.Between(5, this.MAP_W - 5);
            y = Phaser.Math.Between(5, this.MAP_H - 5);
        } while ((x < 8 && y < 8) || (x > this.MAP_W - 10 && y > this.MAP_H - 10));

        const enemy = this.enemies.create(x * this.TILE, y * this.TILE, data.texture);
        enemy.setDepth(10);
        enemy.enemyData = { ...data };
        enemy.hp = data.hp;
        enemy.lastShot = 0;
        enemy.state = 'patrol';
        enemy.patrolTarget = { x: enemy.x + Phaser.Math.Between(-100, 100), y: enemy.y + Phaser.Math.Between(-100, 100) };
        enemy.visible = false; // Start hidden (fog of war)
    }

    createUI() {
        // HP bar
        this.add.rectangle(110, 25, 204, 24, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(110, 25, 200, 20, 0x44cc44).setScrollFactor(0).setDepth(101);
        this.add.text(10, 18, 'HP', { fontSize: '14px', fill: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Bleeding indicator
        this.bleedText = this.add.text(220, 18, '', { fontSize: '14px', fill: '#ff4444' }).setScrollFactor(0).setDepth(102);

        // Weapon/Ammo
        this.weaponText = this.add.text(10, 50, '', { fontSize: '14px', fill: '#ffffff' }).setScrollFactor(0).setDepth(102);

        // Stats
        this.statsText = this.add.text(10, 730, '', { fontSize: '14px', fill: '#88cc44' }).setScrollFactor(0).setDepth(102);

        // Extraction indicator
        this.extractText = this.add.text(900, 25, 'EXTRACTION: ???m', { fontSize: '14px', fill: '#44ff44' }).setScrollFactor(0).setDepth(102);

        // Interact prompt
        this.interactText = this.add.text(512, 700, '', { fontSize: '16px', fill: '#ffff44' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    }

    update(time, delta) {
        if (this.gameOver || this.extracted) return;

        this.updatePlayer(time);
        this.updateEnemies(time);
        this.updateVision();
        this.updateBleeding(delta);
        this.updateUI();
        this.checkInteraction();

        // Auto-fire while holding
        if (this.input.activePointer.isDown && !this.reloading) {
            this.shoot();
        }
    }

    updatePlayer(time) {
        const speed = 150;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown) vx = -speed;
        if (this.cursors.right.isDown) vx = speed;
        if (this.cursors.up.isDown) vy = -speed;
        if (this.cursors.down.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Rotate to mouse (CRITICAL - aim toward cursor)
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload) && !this.reloading) {
            this.reload();
        }

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            this.tryLoot();
        }
    }

    shoot() {
        const time = this.time.now;
        if (time - this.lastShot < this.selectedWeapon.fireRate) return;
        if (this.ammo <= 0 || this.reloading) return;

        this.lastShot = time;
        this.ammo--;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const pellets = this.selectedWeapon.pellets || 1;
        const spreadRad = Phaser.Math.DegToRad(this.selectedWeapon.spread);

        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * spreadRad;
            const angle = baseAngle + spread;

            const bullet = this.bullets.create(
                this.player.x + Math.cos(angle) * 20,
                this.player.y + Math.sin(angle) * 20,
                'bullet'
            );
            bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
            bullet.damage = pellets > 1 ? this.selectedWeapon.damage : this.selectedWeapon.damage + Math.floor(Math.random() * 10);

            this.time.delayedCall(1500, () => {
                if (bullet && bullet.active) bullet.destroy();
            });
        }
    }

    reload() {
        if (this.totalAmmo <= 0) return;
        if (this.ammo === this.maxAmmo) return;

        this.reloading = true;

        this.time.delayedCall(1500, () => {
            const needed = this.maxAmmo - this.ammo;
            const toLoad = Math.min(needed, this.totalAmmo);
            this.ammo += toLoad;
            this.totalAmmo -= toLoad;
            this.reloading = false;
        });
    }

    updateEnemies(time) {
        const children = this.enemies.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Vision cone check - enemy must face player (within 45 degrees)
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - enemy.rotation));
            const canSeePlayer = dist < 200 && angleDiff < Math.PI / 4;

            if (canSeePlayer || dist < 100) {
                enemy.state = 'chase';
            } else if (enemy.state === 'chase' && dist > 250) {
                enemy.state = 'patrol';
            }

            if (enemy.state === 'chase') {
                enemy.rotation = angleToPlayer;
                enemy.setVelocity(
                    Math.cos(angleToPlayer) * enemy.enemyData.speed,
                    Math.sin(angleToPlayer) * enemy.enemyData.speed
                );

                // Melee attack
                if (dist < 40) {
                    if (!enemy.lastMelee || time - enemy.lastMelee > 1000) {
                        this.takeDamage(enemy.enemyData.damage, true);
                        enemy.lastMelee = time;
                    }
                }

                // Ranged attack
                if (enemy.enemyData.canShoot && dist > 60 && dist < 180) {
                    if (time - enemy.lastShot > enemy.enemyData.fireRate) {
                        this.enemyShoot(enemy);
                        enemy.lastShot = time;
                    }
                }
            } else {
                // Patrol
                const patrolDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                if (patrolDist < 30) {
                    enemy.patrolTarget = {
                        x: enemy.x + Phaser.Math.Between(-100, 100),
                        y: enemy.y + Phaser.Math.Between(-100, 100)
                    };
                }
                const patrolAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                enemy.rotation = patrolAngle;
                enemy.setVelocity(
                    Math.cos(patrolAngle) * enemy.enemyData.speed * 0.3,
                    Math.sin(patrolAngle) * enemy.enemyData.speed * 0.3
                );
            }
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const spread = (Math.random() - 0.5) * 0.3;

        const bullet = this.enemyBullets.create(
            enemy.x + Math.cos(angle) * 20,
            enemy.y + Math.sin(angle) * 20,
            'enemy_bullet'
        );
        bullet.setVelocity(Math.cos(angle + spread) * 350, Math.sin(angle + spread) * 350);
        bullet.damage = enemy.enemyData.damage;

        this.time.delayedCall(2000, () => {
            if (bullet && bullet.active) bullet.destroy();
        });
    }

    updateVision() {
        // Draw darkness with vision cone cut out
        const ctx = this.darknessTexture.context;
        const w = this.darknessTexture.width;
        const h = this.darknessTexture.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        const camX = this.cameras.main.scrollX;
        const camY = this.cameras.main.scrollY;
        const screenX = this.player.x - camX;
        const screenY = this.player.y - camY;

        const angle = this.player.rotation;
        const coneAngle = Math.PI / 2; // 90 degree vision cone
        const range = 300;

        // Cut out vision cone
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.arc(screenX, screenY, range, angle - coneAngle/2, angle + coneAngle/2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();
        ctx.restore();

        // Small ambient circle
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 60, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.restore();

        this.darknessTexture.refresh();

        // Update enemy visibility based on vision cone
        const children = this.enemies.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToEnemy - this.player.rotation));

            // Visible if in cone or very close
            const inCone = angleDiff < coneAngle / 2 && dist < range;
            const veryClose = dist < 60;

            enemy.setVisible(inCone || veryClose);
        });
    }

    updateBleeding(delta) {
        if (this.bleeding) {
            this.bleedTimer += delta;
            if (this.bleedTimer >= 500) {
                this.hp -= 2;
                this.bleedTimer = 0;

                if (this.hp <= 0) {
                    this.die();
                }
            }
        }
    }

    updateUI() {
        if (!this.hpBar || !this.weaponText) return;

        this.hpBar.width = (this.hp / this.maxHp) * 200;
        this.hpBar.x = 10 + this.hpBar.width / 2;
        this.hpBar.setFillStyle(this.hp < 30 ? 0xff4444 : 0x44cc44);

        this.bleedText.setText(this.bleeding ? 'BLEEDING!' : '');

        const reloadStatus = this.reloading ? ' [RELOADING]' : '';
        this.weaponText.setText(`${this.selectedWeapon.name}: ${this.ammo}/${this.totalAmmo}${reloadStatus}`);

        this.statsText.setText(`Kills: ${this.kills} | Loot Value: ${this.lootValue}R`);

        // Extraction distance
        const dist = Math.floor(Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extraction.x, this.extraction.y) / this.TILE);
        this.extractText.setText(`EXTRACTION: ${dist}m`);
    }

    checkInteraction() {
        let prompt = '';

        const children = this.lootCrates.getChildren();
        if (children) {
            children.forEach(crate => {
                if (!crate || !crate.active) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, crate.x, crate.y);
                if (dist < 50) {
                    prompt = '[E] Search Container';
                }
            });
        }

        const extDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extraction.x, this.extraction.y);
        if (extDist < 60) {
            prompt = '[E] EXTRACT - End Raid';
        }

        this.interactText.setText(prompt);
    }

    tryLoot() {
        // Check extraction
        const extDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extraction.x, this.extraction.y);
        if (extDist < 60) {
            this.extract();
            return;
        }

        // Check crates
        const children = this.lootCrates.getChildren();
        if (!children) return;

        children.forEach(crate => {
            if (!crate || !crate.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, crate.x, crate.y);
            if (dist < 50) {
                this.lootCrate(crate);
            }
        });
    }

    lootCrate(crate) {
        if (crate.isMedical) {
            // Medical loot - heal and cure bleeding
            const healAmount = 30 + Math.floor(Math.random() * 20);
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
            this.bleeding = false;
            this.lootValue += 100 + Math.floor(Math.random() * 100);
        } else {
            // Regular loot - ammo and value
            this.totalAmmo += Math.floor(this.maxAmmo / 2);
            this.lootValue += 200 + Math.floor(Math.random() * 300);
        }

        crate.destroy();
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        // Flash
        this.tweens.add({
            targets: enemy,
            alpha: 0.2,
            duration: 50,
            yoyo: true
        });

        if (enemy.hp <= 0) {
            enemy.destroy();
            this.kills++;
            this.lootValue += 50 + Math.floor(Math.random() * 100);
        } else {
            // Alert enemy
            enemy.state = 'chase';
        }
    }

    enemyBulletHitPlayer(player, bullet) {
        this.takeDamage(bullet.damage, true);
        bullet.destroy();
    }

    takeDamage(amount, canCauseBleed) {
        this.hp -= amount;

        // Chance to cause bleeding
        if (canCauseBleed && Math.random() < 0.3) {
            this.bleeding = true;
        }

        this.cameras.main.flash(100, 255, 0, 0);

        if (this.hp <= 0) {
            this.die();
        }
    }

    extract() {
        if (this.extracted) return;
        this.extracted = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/4, 'EXTRACTION SUCCESSFUL', {
            fontSize: '48px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const score = this.lootValue + (this.kills * 100);

        this.add.text(w/2, h/2, `Loot Value: ${this.lootValue}R\nKills: ${this.kills} (+${this.kills * 100}R)\n\nTOTAL SCORE: ${score}`, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h * 0.75, '[ PRESS SPACE FOR NEW RAID ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }

    die() {
        if (this.gameOver) return;
        this.gameOver = true;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/4, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2, `Loot Lost: ${this.lootValue}R\nKills: ${this.kills}\n\nYour gear was lost in the zone.`, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h * 0.75, '[ PRESS SPACE TO TRY AGAIN ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Phaser config - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#0a0d0a',
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
