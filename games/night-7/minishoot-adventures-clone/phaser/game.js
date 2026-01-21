// Minishoot Adventures Clone - Twin-Stick Shooter Adventure
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Player stats
const BASE_STATS = {
    maxHealth: 3,
    maxEnergy: 4,
    damage: 1,
    fireRate: 300,
    speed: 200,
    range: 300
};

// Enemies
const ENEMIES = {
    scout: { hp: 3, speed: 100, damage: 1, xp: 1, fireRate: 2000, pattern: 'single' },
    grasshopper: { hp: 4, speed: 140, damage: 1, xp: 2, fireRate: 1500, pattern: 'burst' },
    turret: { hp: 6, speed: 0, damage: 1, xp: 3, fireRate: 1200, pattern: 'spray' },
    treeMimic: { hp: 5, speed: 80, damage: 1, xp: 3, fireRate: 1800, pattern: 'single' },
    heavy: { hp: 12, speed: 50, damage: 2, xp: 5, fireRate: 2500, pattern: 'spread' }
};

// Biome definitions
const BIOMES = {
    village: { name: 'Central Village', color: 0x55aa55, enemies: [] },
    forest: { name: 'Blue Forest', color: 0x3388aa, enemies: ['scout', 'grasshopper', 'treeMimic'] },
    caves: { name: 'Crystal Caves', color: 0x6644aa, enemies: ['turret', 'heavy', 'scout'] }
};

// ========== BOOT SCENE ==========
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.createTextures();
    }

    createTextures() {
        let g = this.make.graphics({ add: false });

        // Player ship (cute spaceship)
        g.fillStyle(0x44aaff);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x66ccff);
        g.fillCircle(16, 14, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(14, 12, 3);
        g.fillCircle(18, 12, 3);
        g.fillStyle(0x222222);
        g.fillCircle(14, 12, 1.5);
        g.fillCircle(18, 12, 1.5);
        g.fillStyle(0x3388dd);
        g.fillTriangle(16, 28, 8, 20, 24, 20);
        g.generateTexture('player', 32, 32);

        // Scout enemy (small flying)
        g.clear();
        g.fillStyle(0xaa4444);
        g.fillCircle(10, 10, 8);
        g.fillStyle(0xcc6666);
        g.fillCircle(10, 8, 5);
        g.fillStyle(0xff0000);
        g.fillCircle(8, 7, 2);
        g.fillCircle(12, 7, 2);
        g.generateTexture('scout', 20, 20);

        // Grasshopper
        g.clear();
        g.fillStyle(0x44aa44);
        g.fillEllipse(12, 10, 20, 14);
        g.fillStyle(0x66cc66);
        g.fillCircle(12, 6, 5);
        g.fillStyle(0x228822);
        g.fillRect(4, 14, 4, 8);
        g.fillRect(16, 14, 4, 8);
        g.generateTexture('grasshopper', 24, 24);

        // Turret
        g.clear();
        g.fillStyle(0x666666);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0x888888);
        g.fillCircle(12, 12, 6);
        g.fillStyle(0xaa0000);
        g.fillRect(10, 0, 4, 12);
        g.generateTexture('turret', 24, 24);

        // Tree Mimic
        g.clear();
        g.fillStyle(0x557755);
        g.fillCircle(14, 8, 10);
        g.fillStyle(0x664422);
        g.fillRect(10, 16, 8, 12);
        g.fillStyle(0xff0000);
        g.fillCircle(10, 8, 2);
        g.fillCircle(18, 8, 2);
        g.generateTexture('treeMimic', 28, 28);

        // Heavy enemy
        g.clear();
        g.fillStyle(0x884488);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xaa66aa);
        g.fillCircle(16, 14, 10);
        g.fillStyle(0xff0000);
        g.fillCircle(12, 12, 3);
        g.fillCircle(20, 12, 3);
        g.fillStyle(0x663366);
        g.fillRect(6, 20, 20, 8);
        g.generateTexture('heavy', 32, 32);

        // Boss - Forest Guardian
        g.clear();
        g.fillStyle(0x225522);
        g.fillCircle(32, 32, 28);
        g.fillStyle(0x44aa44);
        g.fillCircle(32, 28, 20);
        g.fillStyle(0xff4400);
        g.fillCircle(24, 24, 5);
        g.fillCircle(40, 24, 5);
        g.fillStyle(0x116611);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            g.fillRect(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, 10, 6);
        }
        g.generateTexture('forestGuardian', 64, 64);

        // Boss - Crystal Golem
        g.clear();
        g.fillStyle(0x6644aa);
        g.fillCircle(32, 32, 26);
        g.fillStyle(0x8866cc);
        g.fillCircle(32, 28, 18);
        g.fillStyle(0xcc88ff);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            g.fillTriangle(
                32 + Math.cos(a) * 20, 32 + Math.sin(a) * 20,
                32 + Math.cos(a + 0.2) * 30, 32 + Math.sin(a + 0.2) * 30,
                32 + Math.cos(a - 0.2) * 30, 32 + Math.sin(a - 0.2) * 30
            );
        }
        g.fillStyle(0xffff00);
        g.fillCircle(26, 26, 4);
        g.fillCircle(38, 26, 4);
        g.generateTexture('crystalGolem', 64, 64);

        // Player bullet
        g.clear();
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('playerBullet', 8, 8);

        // Supershot bullet
        g.clear();
        g.fillStyle(0x44aaff);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0x88ccff);
        g.fillCircle(6, 6, 3);
        g.generateTexture('superBullet', 12, 12);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xff6644);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemyBullet', 8, 8);

        // Crystal (XP)
        g.clear();
        g.fillStyle(0xff4444);
        g.fillRect(2, 2, 8, 8);
        g.fillStyle(0xff8888);
        g.fillRect(3, 3, 4, 4);
        g.generateTexture('crystal', 12, 12);

        // Heart piece
        g.clear();
        g.fillStyle(0xff6688);
        g.fillCircle(5, 5, 4);
        g.fillCircle(11, 5, 4);
        g.fillTriangle(2, 7, 8, 14, 14, 7);
        g.generateTexture('heartPiece', 16, 16);

        // Energy battery
        g.clear();
        g.fillStyle(0x44ff88);
        g.fillRect(2, 4, 12, 8);
        g.fillStyle(0x22cc66);
        g.fillRect(4, 0, 8, 4);
        g.generateTexture('battery', 16, 16);

        // Floor tiles
        // Village grass
        g.clear();
        g.fillStyle(0x55aa55);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x66bb66);
        g.fillCircle(8, 8, 3);
        g.fillCircle(24, 20, 2);
        g.generateTexture('villageFloor', TILE_SIZE, TILE_SIZE);

        // Forest floor
        g.clear();
        g.fillStyle(0x3388aa);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x44aacc);
        g.fillCircle(12, 12, 4);
        g.fillCircle(24, 24, 3);
        g.generateTexture('forestFloor', TILE_SIZE, TILE_SIZE);

        // Cave floor
        g.clear();
        g.fillStyle(0x4433aa);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x6655cc);
        g.fillRect(6, 6, 4, 4);
        g.fillRect(22, 18, 3, 3);
        g.generateTexture('caveFloor', TILE_SIZE, TILE_SIZE);

        // Wall
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x555555);
        g.fillRect(2, 2, TILE_SIZE - 4, 4);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // NPC (generic)
        g.clear();
        g.fillStyle(0xffcc88);
        g.fillCircle(12, 8, 6);
        g.fillStyle(0x4488ff);
        g.fillRect(6, 14, 12, 14);
        g.fillStyle(0x222222);
        g.fillCircle(10, 7, 1);
        g.fillCircle(14, 7, 1);
        g.generateTexture('npc', 24, 28);

        // Dash trail
        g.clear();
        g.fillStyle(0x88ccff, 0.5);
        g.fillCircle(8, 8, 8);
        g.generateTexture('dashTrail', 16, 16);

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
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a2a1a);

        this.add.text(GAME_WIDTH / 2, 100, 'MINISHOOT ADVENTURES', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            color: '#66ccff',
            stroke: '#224488',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 160, 'A Twin-Stick Shooter Adventure', {
            fontSize: '18px',
            color: '#88aa88'
        }).setOrigin(0.5);

        // Story intro
        const story = [
            'Your home world has been corrupted.',
            'Ancient powers slumber in forgotten dungeons.',
            'Rescue your friends. Find the artifacts.',
            'Restore peace to the land.'
        ];

        story.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 220 + i * 28, line, {
                fontSize: '14px',
                color: '#aaccaa'
            }).setOrigin(0.5);
        });

        // Controls
        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'Right Click - Supershot (uses energy)',
            'Space - Dash (when unlocked)',
            'Tab - Map'
        ];

        this.add.text(150, 380, 'CONTROLS:', { fontSize: '14px', color: '#66ccff' });
        controls.forEach((text, i) => {
            this.add.text(150, 405 + i * 22, text, { fontSize: '12px', color: '#88aa88' });
        });

        const startBtn = this.add.text(GAME_WIDTH / 2, 550, '[ BEGIN ADVENTURE ]', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#88ff88'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#aaffaa'));
        startBtn.on('pointerout', () => startBtn.setColor('#88ff88'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ========== GAME SCENE ==========
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        // Game state
        this.currentBiome = 'village';
        this.xp = 0;
        this.level = 1;
        this.skillPoints = 0;
        this.heartPieces = 0;
        this.batteries = 0;
        this.crystals = 0;

        // Unlocked abilities
        this.hasDash = false;
        this.hasSupershot = false;

        // Boss state
        this.forestBossDefeated = false;
        this.caveBossDefeated = false;

        // Stat upgrades
        this.statUpgrades = {
            damage: 0,
            fireRate: 0,
            speed: 0
        };

        // Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.npcs = this.physics.add.group();

        // Generate world
        this.generateWorld();

        // Create player
        this.createPlayer();

        // Setup input
        this.setupInput();

        // Create UI
        this.createUI();

        // Setup collisions
        this.setupCollisions();

        // Enemy spawn timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateEnemies,
            callbackScope: this,
            loop: true
        });

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Calculate stats with upgrades
        this.player.maxHealth = BASE_STATS.maxHealth + Math.floor(this.heartPieces / 4);
        this.player.health = this.player.maxHealth;
        this.player.maxEnergy = BASE_STATS.maxEnergy + this.batteries;
        this.player.energy = this.player.maxEnergy;
        this.player.damage = BASE_STATS.damage + this.statUpgrades.damage * 0.5;
        this.player.fireRate = BASE_STATS.fireRate - this.statUpgrades.fireRate * 25;
        this.player.speed = BASE_STATS.speed + this.statUpgrades.speed * 20;

        this.player.lastFired = 0;
        this.player.invincible = false;
        this.player.dashing = false;
        this.player.dashCooldown = 0;
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            dash: 'SPACE', map: 'TAB'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.shoot();
            if (pointer.rightButtonDown()) this.supershot();
        });
    }

    setupCollisions() {
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.playerBullets, this.walls, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());
    }

    generateWorld() {
        // World dimensions
        const worldWidth = 60;
        const worldHeight = 60;

        this.physics.world.setBounds(0, 0, worldWidth * TILE_SIZE, worldHeight * TILE_SIZE);

        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();

        // Generate biomes
        for (let y = 0; y < worldHeight; y++) {
            for (let x = 0; x < worldWidth; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                // Determine biome
                let biome = 'village';
                if (y > 30) biome = 'forest';
                if (x > 35 && y > 20) biome = 'caves';

                // Border walls
                if (x === 0 || x === worldWidth - 1 || y === 0 || y === worldHeight - 1) {
                    this.walls.create(px, py, 'wall');
                    continue;
                }

                // Interior walls (sparse)
                if (Math.random() < 0.08 && !(x < 8 && y < 8)) {
                    this.walls.create(px, py, 'wall');
                    continue;
                }

                // Floor based on biome
                const floorTexture = biome === 'village' ? 'villageFloor' :
                                    biome === 'forest' ? 'forestFloor' : 'caveFloor';
                this.floors.create(px, py, floorTexture);
            }
        }

        // Spawn point (village center)
        this.spawnX = TILE_SIZE * 5;
        this.spawnY = TILE_SIZE * 5;

        // Spawn NPCs in village
        this.spawnNPC(TILE_SIZE * 8, TILE_SIZE * 6, 'Mechanic', 'I can reallocate your skill points.');
        this.spawnNPC(TILE_SIZE * 10, TILE_SIZE * 8, 'Healer', 'Let me restore your health.');
        this.spawnNPC(TILE_SIZE * 6, TILE_SIZE * 10, 'Elder', 'The dungeons hold great power...');

        // Spawn heart pieces and batteries
        this.spawnPickup(TILE_SIZE * 20, TILE_SIZE * 15, 'heartPiece');
        this.spawnPickup(TILE_SIZE * 25, TILE_SIZE * 40, 'heartPiece');
        this.spawnPickup(TILE_SIZE * 45, TILE_SIZE * 25, 'battery');

        // Spawn initial enemies in forest and caves
        for (let i = 0; i < 15; i++) {
            const ex = TILE_SIZE * (10 + Math.floor(Math.random() * 40));
            const ey = TILE_SIZE * (35 + Math.floor(Math.random() * 20));
            const types = ['scout', 'grasshopper', 'treeMimic'];
            this.spawnEnemy(types[Math.floor(Math.random() * types.length)], ex, ey);
        }

        for (let i = 0; i < 10; i++) {
            const ex = TILE_SIZE * (40 + Math.floor(Math.random() * 15));
            const ey = TILE_SIZE * (25 + Math.floor(Math.random() * 20));
            const types = ['turret', 'heavy', 'scout'];
            this.spawnEnemy(types[Math.floor(Math.random() * types.length)], ex, ey);
        }

        // Boss rooms
        // Forest boss at (15, 50)
        this.forestBossX = TILE_SIZE * 15;
        this.forestBossY = TILE_SIZE * 50;

        // Cave boss at (50, 35)
        this.caveBossX = TILE_SIZE * 50;
        this.caveBossY = TILE_SIZE * 35;

        // Boss indicators
        this.add.circle(this.forestBossX, this.forestBossY, 50, 0x225522, 0.3);
        this.add.circle(this.caveBossX, this.caveBossY, 50, 0x442266, 0.3);
    }

    spawnNPC(x, y, name, dialogue) {
        const npc = this.npcs.create(x, y, 'npc');
        npc.setData('name', name);
        npc.setData('dialogue', dialogue);
        npc.setImmovable(true);
        npc.setDepth(5);

        // Add name label
        this.add.text(x, y - 20, name, {
            fontSize: '10px',
            color: '#ffcc00'
        }).setOrigin(0.5);
    }

    spawnPickup(x, y, type) {
        const texture = type === 'heartPiece' ? 'heartPiece' :
                       type === 'battery' ? 'battery' : 'crystal';
        const pickup = this.pickups.create(x, y, texture);
        pickup.setData('type', type);
    }

    spawnEnemy(type, x, y) {
        const data = ENEMIES[type];
        const enemy = this.enemies.create(x, y, type);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('maxHp', data.hp);
        enemy.setData('speed', data.speed);
        enemy.setData('damage', data.damage);
        enemy.setData('xp', data.xp);
        enemy.setData('fireRate', data.fireRate);
        enemy.setData('pattern', data.pattern);
        enemy.setData('lastFired', 0);
        enemy.setCollideWorldBounds(true);
        enemy.setDepth(5);
        return enemy;
    }

    updateEnemies() {
        if (!this.player || !this.player.active) return;

        const now = this.time.now;

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const type = enemy.getData('type');
            const data = ENEMIES[type];
            const speed = enemy.getData('speed');

            // Move toward player (if not turret)
            if (speed > 0) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

                if (dist > 100) {
                    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                } else {
                    enemy.setVelocity(0, 0);
                }
            }

            // Fire at player
            const lastFired = enemy.getData('lastFired');
            const fireRate = enemy.getData('fireRate');
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (now - lastFired > fireRate && dist < 400) {
                this.enemyShoot(enemy);
                enemy.setData('lastFired', now);
            }
        });

        // Check for boss encounters
        this.checkBossEncounters();

        // Update boss if active
        if (this.boss && this.boss.active) {
            this.updateBoss();
        }
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const pattern = enemy.getData('pattern');

        switch (pattern) {
            case 'single':
                this.createEnemyBullet(enemy.x, enemy.y, angle, 150);
                break;
            case 'burst':
                for (let i = 0; i < 3; i++) {
                    this.time.delayedCall(i * 100, () => {
                        if (enemy.active) {
                            this.createEnemyBullet(enemy.x, enemy.y, angle, 150);
                        }
                    });
                }
                break;
            case 'spray':
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    this.createEnemyBullet(enemy.x, enemy.y, a, 120);
                }
                break;
            case 'spread':
                for (let i = -2; i <= 2; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * 0.2, 150);
                }
                break;
        }
    }

    createEnemyBullet(x, y, angle, speed) {
        const bullet = this.enemyBullets.create(x, y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setData('damage', 1);
        this.time.delayedCall(4000, () => { if (bullet.active) bullet.destroy(); });
    }

    checkBossEncounters() {
        // Forest boss
        if (!this.forestBossDefeated && !this.boss) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.forestBossX, this.forestBossY);
            if (dist < 80) {
                this.spawnBoss('forestGuardian', this.forestBossX, this.forestBossY);
            }
        }

        // Cave boss
        if (!this.caveBossDefeated && !this.boss && this.hasDash) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.caveBossX, this.caveBossY);
            if (dist < 80) {
                this.spawnBoss('crystalGolem', this.caveBossX, this.caveBossY);
            }
        }
    }

    spawnBoss(type, x, y) {
        const hp = type === 'forestGuardian' ? 150 : 200;

        this.boss = this.physics.add.sprite(x, y, type);
        this.boss.setData('type', type);
        this.boss.setData('hp', hp);
        this.boss.setData('maxHp', hp);
        this.boss.setData('phase', 1);
        this.boss.setData('lastAttack', 0);
        this.boss.setCollideWorldBounds(true);
        this.boss.setDepth(8);

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, 40, 300, 20, 0x333333).setScrollFactor(0).setDepth(100);
        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 148, 40, 296, 16, 0xff4444).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
        this.bossNameText = this.add.text(GAME_WIDTH / 2, 60, type === 'forestGuardian' ? 'FOREST GUARDIAN' : 'CRYSTAL GOLEM', {
            fontSize: '14px', color: '#ffcc00'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);
    }

    updateBoss() {
        const now = this.time.now;
        const hp = this.boss.getData('hp');
        const maxHp = this.boss.getData('maxHp');
        const type = this.boss.getData('type');
        const lastAttack = this.boss.getData('lastAttack');

        // Update HP bar
        this.bossHpBar.setScale(hp / maxHp, 1);

        // Boss movement
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        this.boss.setVelocity(Math.cos(angle) * 40, Math.sin(angle) * 40);

        // Boss attacks
        if (now - lastAttack > 2000) {
            if (type === 'forestGuardian') {
                // Leaf spray
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    this.createEnemyBullet(this.boss.x, this.boss.y, a, 100);
                }
            } else {
                // Crystal barrage
                for (let i = -3; i <= 3; i++) {
                    this.createEnemyBullet(this.boss.x, this.boss.y, angle + i * 0.15, 130);
                }
            }
            this.boss.setData('lastAttack', now);
        }

        // Check bullet collision with boss
        this.playerBullets.getChildren().forEach(bullet => {
            if (!bullet.active || !this.boss) return;
            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y);
            if (dist < 35) {
                const damage = bullet.getData('damage');
                let bossHp = this.boss.getData('hp') - damage;
                this.boss.setData('hp', bossHp);
                this.boss.setTint(0xffffff);
                this.time.delayedCall(50, () => { if (this.boss) this.boss.clearTint(); });
                bullet.destroy();

                if (bossHp <= 0) {
                    this.defeatBoss();
                }
            }
        });
    }

    defeatBoss() {
        const type = this.boss.getData('type');

        if (type === 'forestGuardian') {
            this.forestBossDefeated = true;
            this.hasDash = true;
            this.showMessage('DASH ABILITY UNLOCKED! (Space)', 4000);
        } else {
            this.caveBossDefeated = true;
            this.hasSupershot = true;
            this.showMessage('SUPERSHOT ABILITY UNLOCKED! (Right Click)', 4000);
        }

        // Drop lots of crystals
        for (let i = 0; i < 20; i++) {
            const cx = this.boss.x + (Math.random() - 0.5) * 100;
            const cy = this.boss.y + (Math.random() - 0.5) * 100;
            this.spawnPickup(cx, cy, 'crystal');
        }

        // XP bonus
        this.xp += 50;
        this.checkLevelUp();

        this.boss.destroy();
        this.boss = null;
        this.bossHpBg.destroy();
        this.bossHpBar.destroy();
        this.bossNameText.destroy();

        // Check victory
        if (this.forestBossDefeated && this.caveBossDefeated) {
            this.time.delayedCall(2000, () => {
                this.scene.start('VictoryScene', { level: this.level, crystals: this.crystals });
            });
        }
    }

    shoot() {
        const now = this.time.now;
        if (now - this.player.lastFired < this.player.fireRate) return;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        const bullet = this.playerBullets.create(this.player.x, this.player.y, 'playerBullet');
        bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
        bullet.setData('damage', this.player.damage);
        this.time.delayedCall(2000, () => { if (bullet.active) bullet.destroy(); });

        this.player.lastFired = now;
    }

    supershot() {
        if (!this.hasSupershot) return;
        if (this.player.energy < 1) return;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        const bullet = this.playerBullets.create(this.player.x, this.player.y, 'superBullet');
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        bullet.setData('damage', this.player.damage * 3);
        bullet.setScale(1.5);
        this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });

        this.player.energy--;
        this.updateUI();
    }

    dash() {
        if (!this.hasDash) return;
        if (this.player.dashing) return;
        if (this.player.dashCooldown > 0) return;

        // Get dash direction from movement
        let dx = 0, dy = 0;
        if (this.keys.left.isDown) dx = -1;
        if (this.keys.right.isDown) dx = 1;
        if (this.keys.up.isDown) dy = -1;
        if (this.keys.down.isDown) dy = 1;

        if (dx === 0 && dy === 0) {
            // Dash toward mouse
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                this.input.activePointer.worldX, this.input.activePointer.worldY
            );
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        }

        // Normalize
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }

        this.player.dashing = true;
        this.player.invincible = true;
        this.player.setVelocity(dx * 600, dy * 600);

        // Trail effect
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 30, () => {
                const trail = this.add.image(this.player.x, this.player.y, 'dashTrail');
                trail.setAlpha(0.6 - i * 0.1);
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            });
        }

        this.time.delayedCall(200, () => {
            this.player.dashing = false;
            this.player.invincible = false;
        });

        this.player.dashCooldown = 500;
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => enemy.clearTint());

        if (hp <= 0) {
            // Drop crystals
            const xp = enemy.getData('xp');
            for (let i = 0; i < xp; i++) {
                const cx = enemy.x + (Math.random() - 0.5) * 30;
                const cy = enemy.y + (Math.random() - 0.5) * 30;
                this.spawnPickup(cx, cy, 'crystal');
            }
            enemy.destroy();
        }

        bullet.destroy();
    }

    bulletHitPlayer(bullet, player) {
        if (this.player.invincible) return;

        const damage = bullet.getData('damage') || 1;
        this.player.health -= damage;

        this.player.invincible = true;
        this.player.setAlpha(0.5);

        this.time.delayedCall(1000, () => {
            this.player.invincible = false;
            this.player.setAlpha(1);
        });

        this.cameras.main.shake(100, 0.02);
        bullet.destroy();
        this.updateUI();

        if (this.player.health <= 0) {
            this.playerDeath();
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        switch (type) {
            case 'crystal':
                this.crystals++;
                this.xp += 1;
                this.checkLevelUp();
                break;
            case 'heartPiece':
                this.heartPieces++;
                if (this.heartPieces % 4 === 0) {
                    this.player.maxHealth++;
                    this.player.health = this.player.maxHealth;
                    this.showMessage('Max Health increased!', 2000);
                } else {
                    this.showMessage(`Heart piece! (${this.heartPieces % 4}/4)`, 2000);
                }
                break;
            case 'battery':
                this.batteries++;
                this.player.maxEnergy++;
                this.player.energy = this.player.maxEnergy;
                this.showMessage('Energy capacity increased!', 2000);
                break;
        }

        pickup.destroy();
        this.updateUI();
    }

    checkLevelUp() {
        const xpNeeded = this.level * 10;
        while (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            this.skillPoints++;
            this.showMessage(`LEVEL UP! (${this.level}) - Skill point earned!`, 2000);
        }
        this.updateUI();
    }

    playerDeath() {
        // Respawn at village
        this.player.health = this.player.maxHealth;
        this.player.energy = this.player.maxEnergy;
        this.player.setPosition(this.spawnX, this.spawnY);
        this.crystals = Math.floor(this.crystals * 0.5); // Lose half crystals
        this.showMessage('You were defeated! Lost some crystals.', 2000);
        this.updateUI();
    }

    showMessage(text, duration) {
        const msg = this.add.text(GAME_WIDTH / 2, 100, text, {
            fontSize: '18px',
            color: '#ffff88',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(duration, () => msg.destroy());
    }

    createUI() {
        // Health hearts
        this.healthContainer = this.add.container(20, 20).setScrollFactor(0).setDepth(100);

        // Energy bars
        this.energyContainer = this.add.container(20, 50).setScrollFactor(0).setDepth(100);

        // Level/XP
        this.levelText = this.add.text(GAME_WIDTH - 20, 20, '', {
            fontSize: '16px', color: '#ffcc00'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        // Crystals
        this.crystalText = this.add.text(GAME_WIDTH - 20, 45, '', {
            fontSize: '14px', color: '#ff6666'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        // Skill points
        this.skillText = this.add.text(GAME_WIDTH - 20, 70, '', {
            fontSize: '12px', color: '#88ff88'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        // Abilities
        this.abilityText = this.add.text(20, GAME_HEIGHT - 30, '', {
            fontSize: '12px', color: '#66ccff'
        }).setScrollFactor(0).setDepth(100);

        // Biome indicator
        this.biomeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '', {
            fontSize: '14px', color: '#aaaaaa'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        this.updateUI();
    }

    updateUI() {
        // Clear health container
        this.healthContainer.removeAll(true);
        for (let i = 0; i < this.player.maxHealth; i++) {
            const heart = this.add.image(i * 18, 0, 'heartPiece');
            heart.setScale(i < this.player.health ? 1 : 0.5);
            heart.setAlpha(i < this.player.health ? 1 : 0.3);
            this.healthContainer.add(heart);
        }

        // Clear energy container
        this.energyContainer.removeAll(true);
        for (let i = 0; i < this.player.maxEnergy; i++) {
            const bar = this.add.rectangle(i * 20, 0, 16, 10, i < this.player.energy ? 0x44ff88 : 0x224433);
            this.energyContainer.add(bar);
        }

        const xpNeeded = this.level * 10;
        this.levelText.setText(`Level ${this.level} (${this.xp}/${xpNeeded} XP)`);
        this.crystalText.setText(`Crystals: ${this.crystals}`);
        this.skillText.setText(`Skill Points: ${this.skillPoints}`);

        const abilities = [];
        if (this.hasDash) abilities.push('[Space] Dash');
        if (this.hasSupershot) abilities.push('[RClick] Supershot');
        this.abilityText.setText(abilities.join('  '));

        // Update biome based on position
        if (this.player.y > TILE_SIZE * 30) {
            this.currentBiome = 'forest';
        } else if (this.player.x > TILE_SIZE * 35 && this.player.y > TILE_SIZE * 20) {
            this.currentBiome = 'caves';
        } else {
            this.currentBiome = 'village';
        }
        this.biomeText.setText(BIOMES[this.currentBiome].name);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Player movement
        if (!this.player.dashing) {
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

        // Dash cooldown
        if (this.player.dashCooldown > 0) {
            this.player.dashCooldown -= delta;
        }

        // Dash input
        if (Phaser.Input.Keyboard.JustDown(this.keys.dash)) {
            this.dash();
        }

        // Continuous shooting
        if (this.input.activePointer.isDown && this.input.activePointer.leftButtonDown()) {
            this.shoot();
        }

        // Player rotation toward mouse
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );
        this.player.setRotation(angle + Math.PI / 2);

        // Update biome in UI
        this.updateUI();

        // Respawn enemies periodically
        if (Math.random() < 0.002) {
            const biome = this.currentBiome;
            if (biome !== 'village' && this.enemies.countActive() < 25) {
                const enemies = BIOMES[biome].enemies;
                if (enemies.length > 0) {
                    const type = enemies[Math.floor(Math.random() * enemies.length)];
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 400 + Math.random() * 200;
                    const ex = this.player.x + Math.cos(angle) * dist;
                    const ey = this.player.y + Math.sin(angle) * dist;
                    this.spawnEnemy(type, ex, ey);
                }
            }
        }
    }
}

// ========== VICTORY SCENE ==========
class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }

    init(data) {
        this.finalLevel = data.level || 1;
        this.totalCrystals = data.crystals || 0;
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x112211);

        this.add.text(GAME_WIDTH / 2, 100, 'VICTORY!', {
            fontSize: '56px',
            fontFamily: 'Arial Black',
            color: '#88ff88',
            stroke: '#224422',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 180, 'The corruption has been cleansed!', {
            fontSize: '20px',
            color: '#aaffaa'
        }).setOrigin(0.5);

        const stats = [
            `Final Level: ${this.finalLevel}`,
            `Crystals Collected: ${this.totalCrystals}`,
            '',
            'Both dungeon guardians defeated!',
            'The land is at peace once more.'
        ];

        stats.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 250 + i * 30, line, {
                fontSize: '16px',
                color: '#88ccaa'
            }).setOrigin(0.5);
        });

        const menuBtn = this.add.text(GAME_WIDTH / 2, 500, '[ RETURN TO MENU ]', {
            fontSize: '28px',
            color: '#88ff88'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== GAME CONFIG ==========
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a2a1a',
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
