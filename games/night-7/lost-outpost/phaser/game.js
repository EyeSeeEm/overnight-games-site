// Lost Outpost - Top-down Survival Horror Shooter
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Weapon definitions
const WEAPONS = {
    rifle: { name: 'Assault Rifle', damage: 15, fireRate: 180, mag: 30, maxAmmo: 300, spread: 0.05, bulletSpeed: 500 },
    smg: { name: 'SMG', damage: 8, fireRate: 80, mag: 50, maxAmmo: 400, spread: 0.1, bulletSpeed: 450 },
    shotgun: { name: 'Shotgun', damage: 12, fireRate: 600, mag: 8, maxAmmo: 60, spread: 0.3, bulletSpeed: 400, pellets: 6 },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 50, mag: 100, maxAmmo: 300, spread: 0.2, bulletSpeed: 250, flame: true }
};

// Enemy definitions
const ENEMIES = {
    scorpion: { hp: 40, speed: 80, damage: 15, type: 'melee' },
    scorpionLaser: { hp: 35, speed: 60, damage: 10, type: 'ranged', fireRate: 2000 },
    arachnid: { hp: 80, speed: 60, damage: 25, type: 'melee' }
};

// Level definitions
const LEVELS = [
    { name: 'Arrival', width: 15, height: 20, enemies: { scorpion: 5 }, keycard: true, objective: 'Find the keycard and reach the elevator' },
    { name: 'Engineering Deck', width: 25, height: 30, enemies: { scorpion: 8, scorpionLaser: 2 }, keycard: true, weapon: 'smg', objective: 'Restore auxiliary power' },
    { name: 'Medical Bay', width: 30, height: 25, enemies: { scorpion: 6, arachnid: 6, scorpionLaser: 3 }, keycard: true, weapon: 'shotgun', objective: 'Find Dr. Chen\'s research data' },
    { name: 'Cargo Hold', width: 35, height: 30, enemies: { scorpion: 12, arachnid: 4, scorpionLaser: 4 }, keycard: true, weapon: 'flamethrower', objective: 'Open blast doors and survive' },
    { name: 'Hive Core', width: 40, height: 40, enemies: { scorpion: 15, arachnid: 8, scorpionLaser: 6 }, boss: true, objective: 'Destroy the Hive Commander' }
];

// ========== BOOT SCENE ==========
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.createTextures();
    }

    createTextures() {
        let g = this.make.graphics({ add: false });

        // Player (space marine)
        g.fillStyle(0x4488cc);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x336699);
        g.fillRect(10, 4, 12, 8);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 14, 5);
        g.generateTexture('player', 32, 32);

        // Scorpion enemy
        g.clear();
        g.fillStyle(0x44aa44);
        g.fillEllipse(12, 12, 20, 16);
        g.fillStyle(0x338833);
        g.fillCircle(6, 8, 4);
        g.fillCircle(18, 8, 4);
        g.fillStyle(0xff0000);
        g.fillCircle(8, 10, 2);
        g.fillCircle(16, 10, 2);
        g.generateTexture('scorpion', 24, 24);

        // Scorpion Laser
        g.clear();
        g.fillStyle(0x66cc66);
        g.fillEllipse(12, 12, 20, 16);
        g.fillStyle(0x44aa44);
        g.fillCircle(6, 8, 4);
        g.fillCircle(18, 8, 4);
        g.fillStyle(0x00ff00);
        g.fillCircle(8, 10, 2);
        g.fillCircle(16, 10, 2);
        g.generateTexture('scorpionLaser', 24, 24);

        // Arachnid (larger)
        g.clear();
        g.fillStyle(0x558855);
        g.fillEllipse(20, 20, 36, 28);
        g.fillStyle(0x446644);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI + Math.PI / 8;
            g.fillRect(20 + Math.cos(angle) * 14, 20 + Math.sin(angle) * 14, 8, 4);
        }
        g.fillStyle(0xff0000);
        g.fillCircle(14, 16, 3);
        g.fillCircle(26, 16, 3);
        g.generateTexture('arachnid', 40, 40);

        // Boss - Hive Commander
        g.clear();
        g.fillStyle(0x885588);
        g.fillCircle(40, 40, 36);
        g.fillStyle(0x664466);
        g.fillCircle(40, 40, 28);
        g.fillStyle(0xff0000);
        g.fillCircle(30, 32, 5);
        g.fillCircle(50, 32, 5);
        g.fillStyle(0xaa55aa);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            g.fillRect(40 + Math.cos(angle) * 30, 40 + Math.sin(angle) * 30, 12, 6);
        }
        g.generateTexture('boss', 80, 80);

        // Bullet (player)
        g.clear();
        g.fillStyle(0xffff00);
        g.fillRect(0, 0, 8, 4);
        g.generateTexture('bullet', 8, 4);

        // Laser bullet (enemy)
        g.clear();
        g.fillStyle(0x00ff00);
        g.fillRect(0, 0, 12, 3);
        g.generateTexture('laserBullet', 12, 3);

        // Flame
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffcc00);
        g.fillCircle(8, 8, 4);
        g.generateTexture('flame', 16, 16);

        // Floor tile
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x2a2a3a);
        g.fillRect(0, 0, 2, TILE_SIZE);
        g.fillRect(0, 0, TILE_SIZE, 2);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(0x555566);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x666677);
        g.fillRect(2, 2, TILE_SIZE - 4, 4);
        g.fillStyle(0x444455);
        g.fillRect(2, TILE_SIZE - 6, TILE_SIZE - 4, 4);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door (closed)
        g.clear();
        g.fillStyle(0x884422);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0xcc6633);
        g.fillRect(4, TILE_SIZE / 2 - 2, TILE_SIZE - 8, 4);
        g.generateTexture('doorClosed', TILE_SIZE, TILE_SIZE);

        // Door (open)
        g.clear();
        g.fillStyle(0x222233);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('doorOpen', TILE_SIZE, TILE_SIZE);

        // Keycard
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillRect(0, 0, 16, 10);
        g.fillStyle(0xcc9900);
        g.fillRect(2, 2, 4, 6);
        g.generateTexture('keycard', 16, 10);

        // Health pack
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0xff0000);
        g.fillRect(6, 2, 4, 12);
        g.fillRect(2, 6, 12, 4);
        g.generateTexture('healthpack', 16, 16);

        // Ammo box
        g.clear();
        g.fillStyle(0x44aa44);
        g.fillRect(0, 0, 16, 12);
        g.fillStyle(0x338833);
        g.fillRect(2, 2, 12, 8);
        g.generateTexture('ammobox', 16, 12);

        // Terminal
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, 24, 28);
        g.fillStyle(0x00aaff);
        g.fillRect(4, 4, 16, 12);
        g.fillStyle(0x222233);
        g.fillRect(6, 20, 12, 4);
        g.generateTexture('terminal', 24, 28);

        // Exit
        g.clear();
        g.fillStyle(0x44ff44);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x22cc22);
        g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.generateTexture('exit', TILE_SIZE, TILE_SIZE);

        // Barrel
        g.clear();
        g.fillStyle(0x884400);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0xcc6600);
        g.fillCircle(12, 12, 6);
        g.generateTexture('barrel', 24, 24);

        // Explosion
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(20, 20, 20);
        g.fillStyle(0xffcc00);
        g.fillCircle(20, 20, 12);
        g.fillStyle(0xffffff);
        g.fillCircle(20, 20, 5);
        g.generateTexture('explosion', 40, 40);

        // Vision mask (for darkness)
        g.clear();
        g.fillStyle(0xffffff);
        g.fillCircle(100, 100, 100);
        g.generateTexture('visionMask', 200, 200);

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
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a15);

        this.add.text(GAME_WIDTH / 2, 100, 'LOST OUTPOST', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#00ccff',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 160, 'A Survival Horror Shooter', {
            fontSize: '18px',
            color: '#668899'
        }).setOrigin(0.5);

        // Story setup
        const story = [
            'Haven Station has gone dark.',
            'You are Jameson, a space marine',
            'responding to the distress signal.',
            '',
            'The station is overrun.',
            'Find survivors. Eliminate threats.',
            'Discover what happened.'
        ];

        story.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 220 + i * 24, line, {
                fontSize: '14px',
                color: '#889999'
            }).setOrigin(0.5);
        });

        // Controls
        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'R - Reload',
            'Space - Interact',
            '1-4 - Switch Weapon'
        ];

        this.add.text(100, 420, 'CONTROLS:', { fontSize: '14px', color: '#00ccff' });
        controls.forEach((text, i) => {
            this.add.text(100, 445 + i * 20, text, { fontSize: '12px', color: '#668899' });
        });

        const startBtn = this.add.text(GAME_WIDTH / 2, 540, '[ START MISSION ]', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#44ffaa'));
        startBtn.on('pointerout', () => startBtn.setColor('#00ff88'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene', { level: 0 }));
    }
}

// ========== GAME SCENE ==========
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.currentLevel = data.level || 0;
    }

    create() {
        // Camera setup
        this.cameras.main.setBackgroundColor(0x0a0a15);

        // Level data
        this.levelData = LEVELS[this.currentLevel];

        // Player state
        this.lives = 3;
        this.credits = 500;
        this.hasKeycard = false;

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.barrels = this.physics.add.group();

        // Generate level
        this.generateLevel();

        // Create player
        this.createPlayer();

        // Setup input
        this.setupInput();

        // Create UI
        this.createUI();

        // Setup collisions
        this.setupCollisions();

        // Enemy AI timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateEnemies,
            callbackScope: this,
            loop: true
        });

        // Boss state
        this.boss = null;
        this.bossDefeated = false;

        // Show objective
        this.showMessage(this.levelData.objective, 4000);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        this.player.maxHp = 100;
        this.player.hp = 100;
        this.player.speed = 180;

        // Weapons
        this.player.weapons = [{ ...WEAPONS.rifle, currentMag: 30, currentAmmo: 300 }];
        this.player.currentWeapon = 0;
        this.player.lastFired = 0;
        this.player.reloading = false;

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            reload: 'R', interact: 'SPACE',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE', weapon4: 'FOUR'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.shoot();
        });
    }

    setupCollisions() {
        // Player bullets hit enemies
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);

        // Enemy bullets hit player
        this.physics.add.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);

        // Player collects pickups
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Bullets hit walls
        this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());

        // Bullets hit barrels
        this.physics.add.overlap(this.bullets, this.barrels, this.hitBarrel, null, this);

        // Player/enemies collide with walls
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);

        // Player touches exit
        this.physics.add.overlap(this.player, this.exitZone, this.checkExit, null, this);
    }

    generateLevel() {
        const width = this.levelData.width;
        const height = this.levelData.height;

        // Set world bounds
        this.physics.world.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);

        // Create tilemap groups
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        this.doors = [];

        // Generate simple level layout
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                // Border walls
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    this.walls.create(px, py, 'wall');
                }
                // Random interior walls (corridors)
                else if (Math.random() < 0.15 && !(x < 4 && y < 4) && !(x > width - 5 && y > height - 5)) {
                    // Create wall clusters
                    if (Math.random() < 0.5) {
                        this.walls.create(px, py, 'wall');
                    } else {
                        this.floors.create(px, py, 'floor');
                    }
                } else {
                    this.floors.create(px, py, 'floor');
                }
            }
        }

        // Spawn point
        this.spawnX = TILE_SIZE * 2;
        this.spawnY = TILE_SIZE * 2;

        // Exit point
        const exitX = (width - 2) * TILE_SIZE;
        const exitY = (height - 2) * TILE_SIZE;
        this.exitZone = this.physics.add.sprite(exitX, exitY, 'exit');
        this.exitZone.setImmovable(true);

        // Spawn keycard if needed
        if (this.levelData.keycard) {
            const kx = TILE_SIZE * (Math.floor(width / 2) + Math.floor(Math.random() * 5));
            const ky = TILE_SIZE * (Math.floor(height / 2) + Math.floor(Math.random() * 5));
            const keycard = this.pickups.create(kx, ky, 'keycard');
            keycard.setData('type', 'keycard');
        }

        // Spawn enemies
        const enemyTypes = Object.keys(this.levelData.enemies);
        enemyTypes.forEach(type => {
            const count = this.levelData.enemies[type];
            for (let i = 0; i < count; i++) {
                const ex = TILE_SIZE * (3 + Math.floor(Math.random() * (width - 6)));
                const ey = TILE_SIZE * (3 + Math.floor(Math.random() * (height - 6)));
                this.spawnEnemy(type, ex, ey);
            }
        });

        // Spawn boss if this is boss level
        if (this.levelData.boss) {
            const bx = (width / 2) * TILE_SIZE;
            const by = (height / 2) * TILE_SIZE;
            this.spawnBoss(bx, by);
        }

        // Spawn weapon pickup if available
        if (this.levelData.weapon) {
            const wx = TILE_SIZE * (width / 2 + Math.floor(Math.random() * 4) - 2);
            const wy = TILE_SIZE * (height / 2 + Math.floor(Math.random() * 4) - 2);
            const weaponPickup = this.pickups.create(wx, wy, 'ammobox');
            weaponPickup.setData('type', 'weapon');
            weaponPickup.setData('weapon', this.levelData.weapon);
            weaponPickup.setTint(0xffcc00);
        }

        // Spawn some health/ammo pickups
        for (let i = 0; i < 5; i++) {
            const hx = TILE_SIZE * (2 + Math.floor(Math.random() * (width - 4)));
            const hy = TILE_SIZE * (2 + Math.floor(Math.random() * (height - 4)));
            const pickup = this.pickups.create(hx, hy, Math.random() < 0.5 ? 'healthpack' : 'ammobox');
            pickup.setData('type', Math.random() < 0.5 ? 'health' : 'ammo');
        }

        // Spawn some barrels
        for (let i = 0; i < 8; i++) {
            const bx = TILE_SIZE * (2 + Math.floor(Math.random() * (width - 4)));
            const by = TILE_SIZE * (2 + Math.floor(Math.random() * (height - 4)));
            const barrel = this.barrels.create(bx, by, 'barrel');
            barrel.setImmovable(true);
        }

        // Create darkness effect
        this.createDarkness();
    }

    createDarkness() {
        // Create darkness overlay
        this.darkness = this.add.graphics();
        this.darkness.setDepth(50);

        // Flashlight mask
        this.flashlightMask = this.add.image(0, 0, 'visionMask');
        this.flashlightMask.setVisible(false);
    }

    spawnEnemy(type, x, y) {
        const texture = type === 'arachnid' ? 'arachnid' :
                       type === 'scorpionLaser' ? 'scorpionLaser' : 'scorpion';
        const data = ENEMIES[type];

        const enemy = this.enemies.create(x, y, texture);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('maxHp', data.hp);
        enemy.setData('speed', data.speed);
        enemy.setData('damage', data.damage);
        enemy.setData('attackType', data.type);
        enemy.setData('lastFired', 0);
        enemy.setData('fireRate', data.fireRate || 0);
        enemy.setCollideWorldBounds(true);
        enemy.setDepth(5);

        return enemy;
    }

    spawnBoss(x, y) {
        this.boss = this.physics.add.sprite(x, y, 'boss');
        this.boss.setData('hp', 500);
        this.boss.setData('maxHp', 500);
        this.boss.setData('lastAttack', 0);
        this.boss.setData('phase', 1);
        this.boss.setCollideWorldBounds(true);
        this.boss.setDepth(8);

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, 50, 300, 20, 0x333333).setScrollFactor(0).setDepth(100);
        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 148, 50, 296, 16, 0xff4444).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
        this.bossNameText = this.add.text(GAME_WIDTH / 2, 75, 'HIVE COMMANDER', {
            fontSize: '14px', color: '#ff4444'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);
    }

    updateEnemies() {
        if (!this.player || !this.player.active) return;

        const now = this.time.now;

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const type = enemy.getData('type');
            const data = ENEMIES[type];
            const speed = enemy.getData('speed');
            const attackType = enemy.getData('attackType');

            // Calculate angle to player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Move toward player
            if (attackType === 'melee' || dist > 200) {
                enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            } else {
                // Ranged enemies stop at distance
                enemy.setVelocity(0, 0);
            }

            // Ranged attack
            if (attackType === 'ranged') {
                const lastFired = enemy.getData('lastFired');
                const fireRate = enemy.getData('fireRate');

                if (now - lastFired > fireRate && dist < 400) {
                    this.enemyShoot(enemy, angle);
                    enemy.setData('lastFired', now);
                }
            }

            // Melee damage
            if (attackType === 'melee' && dist < 25) {
                this.damagePlayer(enemy.getData('damage'));
            }
        });

        // Update boss
        if (this.boss && this.boss.active) {
            this.updateBoss();
        }
    }

    enemyShoot(enemy, angle) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'laserBullet');
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        bullet.setRotation(angle);
        bullet.setData('damage', 10);

        this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
    }

    updateBoss() {
        const now = this.time.now;
        const hp = this.boss.getData('hp');
        const maxHp = this.boss.getData('maxHp');
        const lastAttack = this.boss.getData('lastAttack');
        const phase = this.boss.getData('phase');

        // Update HP bar
        const hpPercent = hp / maxHp;
        this.bossHpBar.setScale(hpPercent, 1);

        // Phase change
        if (hp < maxHp * 0.5 && phase === 1) {
            this.boss.setData('phase', 2);
            this.boss.setTint(0xff6666);
        }

        // Boss movement
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        if (phase === 1) {
            // Phase 1: Chase and spawn minions
            this.boss.setVelocity(Math.cos(angle) * 60, Math.sin(angle) * 60);

            if (now - lastAttack > 5000) {
                // Spawn minions
                for (let i = 0; i < 2; i++) {
                    const sa = Math.random() * Math.PI * 2;
                    this.spawnEnemy('scorpion', this.boss.x + Math.cos(sa) * 50, this.boss.y + Math.sin(sa) * 50);
                }
                this.boss.setData('lastAttack', now);
            }
        } else {
            // Phase 2: Ranged + faster
            this.boss.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);

            if (now - lastAttack > 2000) {
                // Shoot acid spray
                for (let i = -2; i <= 2; i++) {
                    const bullet = this.enemyBullets.create(this.boss.x, this.boss.y, 'laserBullet');
                    const bulletAngle = angle + i * 0.2;
                    bullet.setVelocity(Math.cos(bulletAngle) * 250, Math.sin(bulletAngle) * 250);
                    bullet.setRotation(bulletAngle);
                    bullet.setData('damage', 15);
                    bullet.setTint(0xaa00aa);
                    this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
                }
                this.boss.setData('lastAttack', now);
            }
        }

        // Contact damage
        if (dist < 40) {
            this.damagePlayer(20);
        }
    }

    shoot() {
        if (this.player.reloading) return;

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
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const bulletAngle = angle + spread;

            const texture = weapon.flame ? 'flame' : 'bullet';
            const bullet = this.bullets.create(this.player.x, this.player.y, texture);
            bullet.setVelocity(
                Math.cos(bulletAngle) * weapon.bulletSpeed,
                Math.sin(bulletAngle) * weapon.bulletSpeed
            );
            bullet.setData('damage', weapon.damage);
            bullet.setRotation(bulletAngle);

            if (weapon.flame) {
                bullet.setScale(0.5 + Math.random() * 0.5);
                this.time.delayedCall(500, () => { if (bullet.active) bullet.destroy(); });
            } else {
                this.time.delayedCall(2000, () => { if (bullet.active) bullet.destroy(); });
            }
        }

        weapon.currentMag--;
        this.player.lastFired = now;
        this.updateUI();
    }

    reload() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (weapon.currentMag === weapon.mag) return;
        if (weapon.currentAmmo <= 0) return;

        this.player.reloading = true;

        this.time.delayedCall(1500, () => {
            const needed = weapon.mag - weapon.currentMag;
            const available = Math.min(needed, weapon.currentAmmo);

            weapon.currentMag += available;
            weapon.currentAmmo -= available;

            this.player.reloading = false;
            this.updateUI();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => enemy.clearTint());

        if (hp <= 0) {
            // Drop credits
            this.credits += 10 + Math.floor(Math.random() * 20);
            enemy.destroy();
        }

        bullet.destroy();
        this.updateUI();
    }

    bulletHitPlayer(bullet, player) {
        const damage = bullet.getData('damage') || 10;
        this.damagePlayer(damage);
        bullet.destroy();
    }

    damagePlayer(amount) {
        if (this.player.invincible) return;

        this.player.hp -= amount;
        this.player.invincible = true;
        this.player.setAlpha(0.5);

        this.time.delayedCall(500, () => {
            this.player.invincible = false;
            this.player.setAlpha(1);
        });

        this.cameras.main.shake(100, 0.01);
        this.updateUI();

        if (this.player.hp <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        this.lives--;

        if (this.lives <= 0) {
            this.scene.start('GameOverScene', { level: this.currentLevel });
        } else {
            // Respawn
            this.player.hp = this.player.maxHp;
            this.player.setPosition(this.spawnX, this.spawnY);
            this.showMessage(`${this.lives} lives remaining`, 2000);
            this.updateUI();
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        switch (type) {
            case 'keycard':
                this.hasKeycard = true;
                this.showMessage('Keycard acquired!', 2000);
                break;
            case 'health':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
                break;
            case 'ammo':
                const w = this.player.weapons[this.player.currentWeapon];
                w.currentAmmo = Math.min(w.maxAmmo, w.currentAmmo + 50);
                break;
            case 'weapon':
                const weaponKey = pickup.getData('weapon');
                const newWeapon = { ...WEAPONS[weaponKey], currentMag: WEAPONS[weaponKey].mag, currentAmmo: WEAPONS[weaponKey].maxAmmo };
                this.player.weapons.push(newWeapon);
                this.showMessage(`${newWeapon.name} acquired!`, 2000);
                break;
        }

        pickup.destroy();
        this.updateUI();
    }

    hitBarrel(bullet, barrel) {
        // Explosion!
        const exp = this.add.image(barrel.x, barrel.y, 'explosion');
        exp.setScale(1.5);
        this.tweens.add({
            targets: exp,
            scale: 2.5,
            alpha: 0,
            duration: 500,
            onComplete: () => exp.destroy()
        });

        // Damage nearby enemies
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, enemy.x, enemy.y);
            if (dist < 80) {
                let hp = enemy.getData('hp') - 50;
                enemy.setData('hp', hp);
                if (hp <= 0) {
                    this.credits += 10;
                    enemy.destroy();
                }
            }
        });

        // Damage boss
        if (this.boss && this.boss.active) {
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, this.boss.x, this.boss.y);
            if (dist < 100) {
                let hp = this.boss.getData('hp') - 50;
                this.boss.setData('hp', hp);
                if (hp <= 0) this.defeatBoss();
            }
        }

        barrel.destroy();
        bullet.destroy();
        this.cameras.main.shake(200, 0.02);
    }

    checkExit(player, exit) {
        if (this.levelData.keycard && !this.hasKeycard) {
            this.showMessage('Keycard required!', 1500);
            return;
        }

        if (this.levelData.boss && !this.bossDefeated) {
            this.showMessage('Defeat the Hive Commander first!', 1500);
            return;
        }

        if (this.enemies.countActive() > 0 && !this.levelData.boss) {
            this.showMessage('Clear all enemies first!', 1500);
            return;
        }

        this.levelComplete();
    }

    defeatBoss() {
        this.bossDefeated = true;
        this.boss.destroy();
        this.bossHpBg.destroy();
        this.bossHpBar.destroy();
        this.bossNameText.destroy();

        // Explosion effect
        const exp = this.add.image(this.boss.x, this.boss.y, 'explosion');
        exp.setScale(3);
        this.tweens.add({
            targets: exp,
            scale: 6,
            alpha: 0,
            duration: 1000,
            onComplete: () => exp.destroy()
        });

        this.cameras.main.shake(500, 0.05);
        this.showMessage('HIVE COMMANDER DESTROYED!', 3000);
    }

    levelComplete() {
        if (this.currentLevel >= LEVELS.length - 1) {
            this.scene.start('VictoryScene');
        } else {
            this.scene.start('LevelCompleteScene', {
                level: this.currentLevel,
                credits: this.credits
            });
        }
    }

    showMessage(text, duration) {
        const msg = this.add.text(GAME_WIDTH / 2, 150, text, {
            fontSize: '24px',
            color: '#00ff88',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(duration, () => msg.destroy());
    }

    createUI() {
        // Health bar background
        this.add.rectangle(120, GAME_HEIGHT - 30, 200, 20, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(22, GAME_HEIGHT - 30, 196, 16, 0x44ff44).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);

        this.hpText = this.add.text(120, GAME_HEIGHT - 30, '', {
            fontSize: '14px', color: '#ffffff'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        // Lives
        this.livesText = this.add.text(20, 20, '', {
            fontSize: '18px', color: '#ff4444'
        }).setScrollFactor(0).setDepth(100);

        // Weapon/Ammo
        this.weaponText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 40, '', {
            fontSize: '14px', color: '#ffffff', align: 'right'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        this.ammoText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, '', {
            fontSize: '16px', color: '#ffcc00', align: 'right'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        // Credits
        this.creditsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '', {
            fontSize: '16px', color: '#00ffff'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        // Level name
        this.add.text(GAME_WIDTH / 2, 20, `Level ${this.currentLevel + 1}: ${this.levelData.name}`, {
            fontSize: '18px', color: '#00ccff'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        this.updateUI();
    }

    updateUI() {
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`HP: ${Math.max(0, this.player.hp)}/${this.player.maxHp}`);

        this.livesText.setText(`Lives: ${'♥'.repeat(this.lives)}`);

        const w = this.player.weapons[this.player.currentWeapon];
        this.weaponText.setText(w.name);
        this.ammoText.setText(`${w.currentMag} / ${w.currentAmmo}`);

        this.creditsText.setText(`Credits: ${this.credits}`);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Player movement
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

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) {
            this.reload();
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

        // Continuous fire
        if (this.input.activePointer.isDown) {
            this.shoot();
        }

        // Player rotation toward mouse
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );
        this.player.setRotation(angle);

        // Update darkness overlay
        this.updateDarkness();

        // Check boss collision
        if (this.boss && this.boss.active) {
            this.bullets.getChildren().forEach(bullet => {
                if (!bullet.active) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y);
                if (dist < 40) {
                    const damage = bullet.getData('damage');
                    let hp = this.boss.getData('hp') - damage;
                    this.boss.setData('hp', hp);
                    this.boss.setTint(0xffffff);
                    this.time.delayedCall(50, () => { if (this.boss) this.boss.clearTint(); });
                    bullet.destroy();

                    if (hp <= 0) {
                        this.defeatBoss();
                    }
                }
            });
        }
    }

    updateDarkness() {
        // Simple darkness effect
        this.darkness.clear();
        this.darkness.fillStyle(0x000000, 0.7);
        this.darkness.fillRect(
            this.cameras.main.scrollX - 100,
            this.cameras.main.scrollY - 100,
            GAME_WIDTH / this.cameras.main.zoom + 200,
            GAME_HEIGHT / this.cameras.main.zoom + 200
        );

        // Cut out vision cone
        const visionRadius = 180;
        this.darkness.fillStyle(0x000000, 0);

        // Use blend mode to create hole
        this.darkness.setBlendMode(Phaser.BlendModes.ERASE);
        this.darkness.fillCircle(this.player.x, this.player.y, visionRadius);
        this.darkness.setBlendMode(Phaser.BlendModes.NORMAL);
    }
}

// ========== LEVEL COMPLETE SCENE ==========
class LevelCompleteScene extends Phaser.Scene {
    constructor() { super({ key: 'LevelCompleteScene' }); }

    init(data) {
        this.completedLevel = data.level;
        this.credits = data.credits;
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a15);

        this.add.text(GAME_WIDTH / 2, 150, 'LEVEL COMPLETE', {
            fontSize: '42px',
            color: '#00ff88'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, `${LEVELS[this.completedLevel].name} cleared`, {
            fontSize: '20px',
            color: '#00ccff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 280, `Credits: ${this.credits}`, {
            fontSize: '24px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        const nextLevel = this.completedLevel + 1;
        if (nextLevel < LEVELS.length) {
            this.add.text(GAME_WIDTH / 2, 340, `Next: ${LEVELS[nextLevel].name}`, {
                fontSize: '18px',
                color: '#888888'
            }).setOrigin(0.5);
        }

        const continueBtn = this.add.text(GAME_WIDTH / 2, 450, '[ CONTINUE ]', {
            fontSize: '28px',
            color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { level: this.completedLevel + 1 });
        });
    }
}

// ========== GAME OVER SCENE ==========
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.failedLevel = data.level;
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x150505);

        this.add.text(GAME_WIDTH / 2, 150, 'MISSION FAILED', {
            fontSize: '48px',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, `You were overwhelmed on ${LEVELS[this.failedLevel].name}`, {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(GAME_WIDTH / 2, 350, '[ RETRY LEVEL ]', {
            fontSize: '28px',
            color: '#ff8844'
        }).setOrigin(0.5).setInteractive();

        retryBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { level: this.failedLevel });
        });

        const menuBtn = this.add.text(GAME_WIDTH / 2, 420, '[ MAIN MENU ]', {
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

// ========== VICTORY SCENE ==========
class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x051510);

        this.add.text(GAME_WIDTH / 2, 120, 'MISSION COMPLETE', {
            fontSize: '48px',
            color: '#00ff88'
        }).setOrigin(0.5);

        const story = [
            'The Hive Commander has been destroyed.',
            'Haven Station is secure... for now.',
            '',
            'But deep in space, more threats await.',
            'The war against the aliens has just begun.',
            '',
            'Thank you for playing LOST OUTPOST'
        ];

        story.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 200 + i * 35, line, {
                fontSize: '16px',
                color: '#88ccaa'
            }).setOrigin(0.5);
        });

        const menuBtn = this.add.text(GAME_WIDTH / 2, 500, '[ RETURN TO MENU ]', {
            fontSize: '28px',
            color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== GAME CONFIG ==========
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a0a15',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, LevelCompleteScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
