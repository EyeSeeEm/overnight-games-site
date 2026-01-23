// Lost Outpost - Phaser 3 Implementation
// Survival Horror Top-down Shooter

// Game configuration - will be created after scenes are defined
let config;

// ==================== COLORS ====================
const COLORS = {
    uiBlue: 0x00d4ff,
    uiDarkBlue: 0x0a2a3a,
    uiBorder: 0x1a5a7a,
    floor: 0x1a1a1a,
    wall: 0x2a2a2a,
    healthGreen: 0x00ff44,
    healthRed: 0xff2222,
    enemyGreen: 0x44aa22,
    alienBlood: 0x33ff33
};

// ==================== GAME DATA ====================
const gameData = {
    level: 1,
    lives: 3,
    credits: 500,
    xp: 0,
    rank: 1,
    debugMode: false
};

const TILE_SIZE = 32;

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x0a0a0f);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(1, 3);
            this.add.rectangle(x, y, size, size, 0xffffff);
        }

        // Planet
        const planet = this.add.circle(400, 700, 200, 0x1a3a5a);

        // Glow
        this.add.circle(400, 700, 250, 0x0066cc, 0.2);

        // Title
        this.add.text(320, 150, 'LOST', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff3333'
        });
        this.add.text(450, 150, 'OUTPOST', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#00d4ff'
        });

        // Subtitle
        this.add.text(400, 200, 'A Survival Horror Shooter', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        // Start prompt
        const prompt = this.add.text(400, 400, 'CLICK OR PRESS SPACE TO START', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#00d4ff'
        }).setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
            targets: prompt,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Controls
        this.add.text(400, 550, 'WASD - Move | Mouse - Aim | Click - Shoot | R - Reload | P - Pause | Q - Debug', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        gameData.level = 1;
        gameData.lives = 3;
        gameData.credits = 500;
        gameData.xp = 0;
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Level data
        this.levelData = this.getLevelData(gameData.level);

        // Create groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.enemyProjectiles = this.physics.add.group();
        this.particles = [];
        this.shellCasings = [];

        // Generate map
        this.generateMap();

        // Create player
        this.createPlayer();

        // Spawn entities
        this.spawnEnemies();
        this.spawnPickups();

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // Lighting layer
        this.lightingGraphics = this.add.graphics();
        this.lightingGraphics.setDepth(100);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            p: Phaser.Input.Keyboard.KeyCodes.P,
            q: Phaser.Input.Keyboard.KeyCodes.Q
        });

        this.input.keyboard.on('keydown-Q', () => {
            gameData.debugMode = !gameData.debugMode;
        });

        this.input.keyboard.on('keydown-P', () => {
            if (this.scene.isPaused()) {
                this.scene.resume();
            } else {
                this.scene.pause();
            }
        });

        // Shooting
        this.input.on('pointerdown', () => this.shoot());
        this.lastShot = 0;

        // Weapon data
        this.weapons = [
            { name: 'Assault Rifle', damage: 15, fireRate: 100, magazineSize: 30 },
            { name: 'SMG', damage: 10, fireRate: 50, magazineSize: 40 },
            { name: 'Shotgun', damage: 40, fireRate: 400, magazineSize: 8 },
            { name: 'Flamethrower', damage: 8, fireRate: 50, magazineSize: 50 }
        ];
        this.currentWeapon = 0;
        this.magazine = 30;
        this.ammo = 300;
        this.reloading = false;

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.enemyProjectiles, this.player, this.projectileHitPlayer, null, this);

        // Number keys for weapon switching
        for (let i = 1; i <= 4; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => this.switchWeapon(i - 1));
        }

        // Damage flash
        this.damageFlash = 0;

        // Exit
        this.createExit();
    }

    getLevelData(levelNum) {
        const levels = [
            { name: 'DOCKING BAY ALPHA', width: 20, height: 15, playerStart: { x: 2, y: 7 }, exit: { x: 18, y: 7 }, outdoor: false },
            { name: 'ENGINEERING DECK', width: 25, height: 20, playerStart: { x: 2, y: 10 }, exit: { x: 23, y: 10 }, outdoor: false },
            { name: 'MEDICAL BAY', width: 30, height: 20, playerStart: { x: 2, y: 10 }, exit: { x: 28, y: 10 }, outdoor: false },
            { name: 'CARGO HOLD', width: 35, height: 25, playerStart: { x: 2, y: 12 }, exit: { x: 33, y: 12 }, outdoor: false },
            { name: 'CRASH SITE', width: 40, height: 35, playerStart: { x: 20, y: 30 }, exit: { x: 20, y: 3 }, outdoor: true }
        ];
        return levels[levelNum - 1] || levels[0];
    }

    generateMap() {
        const { width, height } = this.levelData;
        this.map = [];
        this.walls = this.physics.add.staticGroup();

        // Generate map array
        for (let y = 0; y < height; y++) {
            this.map[y] = [];
            for (let x = 0; x < width; x++) {
                // Border walls
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    this.map[y][x] = 1;
                } else if (this.levelData.outdoor) {
                    this.map[y][x] = Math.random() < 0.08 ? 2 : 0;
                } else {
                    this.map[y][x] = this.generateIndoorTile(x, y, width, height);
                }
            }
        }

        // Carve path from start to exit
        this.carvePath();

        // Render map
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = this.map[y][x];
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (tile === 0) {
                    // Floor
                    const floorColor = this.levelData.outdoor ? 0x2a2018 : ((x + y) % 2 === 0 ? 0x181818 : 0x141414);
                    const floor = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, floorColor);

                    // Grate pattern for indoor
                    if (!this.levelData.outdoor) {
                        for (let i = 0; i < 3; i++) {
                            for (let j = 0; j < 3; j++) {
                                this.add.rectangle(
                                    px - 8 + i * 10,
                                    py - 8 + j * 10,
                                    4, 4, 0x0a0a0a
                                );
                            }
                        }
                    }
                } else if (tile === 1 || tile === 2) {
                    // Wall or rock
                    const wallColor = tile === 2 ? 0x3a3028 : 0x2a2a2a;
                    const wall = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, wallColor);
                    this.walls.add(wall);
                    this.physics.add.existing(wall, true);

                    // Hazard stripes on some walls
                    if (tile === 1 && (x + y) % 5 === 0) {
                        for (let i = 0; i < 4; i++) {
                            const stripeColor = i % 2 === 0 ? 0xd4a017 : 0x1a1a0a;
                            this.add.rectangle(px, py - 12 + i * 8, TILE_SIZE - 4, 6, stripeColor);
                        }
                    }
                }
            }
        }
    }

    generateIndoorTile(x, y, width, height) {
        const corridorY = Math.floor(height / 2);
        if (Math.abs(y - corridorY) <= 1) return 0;
        if (x % 8 < 2 && y > 2 && y < height - 3) return 0;
        if ((x > 3 && x < width - 4) && (y > 2 && y < height - 3)) {
            if (Math.random() < 0.6) return 0;
        }
        return Math.random() < 0.3 ? 1 : 0;
    }

    carvePath() {
        let x = this.levelData.playerStart.x;
        let y = this.levelData.playerStart.y;
        const endX = this.levelData.exit.x;
        const endY = this.levelData.exit.y;

        while (x !== endX || y !== endY) {
            this.map[y][x] = 0;
            if (y > 0) this.map[y - 1][x] = 0;
            if (y < this.map.length - 1) this.map[y + 1][x] = 0;

            if (x < endX) x++;
            else if (x > endX) x--;
            else if (y < endY) y++;
            else if (y > endY) y--;
        }
        this.map[endY][endX] = 0;
    }

    createPlayer() {
        const startX = this.levelData.playerStart.x * TILE_SIZE + TILE_SIZE / 2;
        const startY = this.levelData.playerStart.y * TILE_SIZE + TILE_SIZE / 2;

        this.player = this.add.container(startX, startY);

        // Body
        const body = this.add.rectangle(0, 0, 24, 20, 0x446688);
        const armor = this.add.rectangle(0, 0, 20, 16, 0x334455);
        const helmet = this.add.circle(0, 0, 8, 0x557799);
        const visor = this.add.rectangle(4, 0, 6, 8, 0x00aaff);
        const weapon = this.add.rectangle(16, 0, 16, 6, 0x888888);
        const light = this.add.rectangle(24, 0, 4, 4, 0xffff88);

        this.player.add([body, armor, helmet, visor, weapon, light]);

        // Physics
        this.physics.world.enable(this.player);
        this.player.body.setSize(24, 24);
        this.player.body.setCollideWorldBounds(true);

        // Player data
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.invincible = 0;
        this.player.keycards = [];
    }

    createExit() {
        const exitX = this.levelData.exit.x * TILE_SIZE + TILE_SIZE / 2;
        const exitY = this.levelData.exit.y * TILE_SIZE + TILE_SIZE / 2;

        this.exit = this.add.circle(exitX, exitY, 15, 0x00ff66, 0.5);

        const exitText = this.add.text(exitX, exitY, 'EXIT', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#00ff66'
        }).setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
            targets: this.exit,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    spawnEnemies() {
        const enemyCount = 3 + gameData.level * 2;
        const { width, height } = this.levelData;

        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(3, width - 4);
                y = Phaser.Math.Between(3, height - 4);
            } while (this.map[y][x] !== 0 ||
                (Math.abs(x - this.levelData.playerStart.x) < 5 &&
                 Math.abs(y - this.levelData.playerStart.y) < 5));

            this.createEnemy(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }

        // Boss on level 5
        if (gameData.level === 5) {
            this.createBoss(this.levelData.exit.x * TILE_SIZE, (this.levelData.exit.y + 5) * TILE_SIZE);
        }
    }

    createEnemy(x, y) {
        const types = ['scorpion', 'scorpion_laser', 'arachnid'];
        const type = types[Phaser.Math.Between(0, Math.min(gameData.level - 1, 2))];

        const enemy = this.add.container(x, y);

        // Body
        const color = 0x44aa22;
        const size = type === 'arachnid' ? 32 : 24;
        const bodyShape = this.add.ellipse(0, 0, size, size * 0.6, color);
        const head = this.add.circle(size * 0.3, 0, size * 0.2, 0x336622);
        const eye1 = this.add.circle(size * 0.3, -3, 2, 0xff0000);
        const eye2 = this.add.circle(size * 0.3, 3, 2, 0xff0000);

        enemy.add([bodyShape, head, eye1, eye2]);

        // Physics
        this.physics.world.enable(enemy);
        enemy.body.setSize(size, size);

        // Enemy data
        enemy.enemyType = type;
        enemy.health = type === 'arachnid' ? 100 : (type === 'scorpion_laser' ? 60 : 50);
        enemy.maxHealth = enemy.health;
        enemy.damage = type === 'arachnid' ? 20 : 10;
        enemy.speed = type === 'arachnid' ? 60 : (type === 'scorpion_laser' ? 40 : 70);
        enemy.lastShot = 0;

        this.enemies.add(enemy);
    }

    createBoss(x, y) {
        const boss = this.add.container(x, y);

        const body = this.add.ellipse(0, 0, 64, 40, 0x448822);
        const head = this.add.circle(24, 0, 16, 0x225511);
        const eye1 = this.add.circle(28, -6, 4, 0xff0000);
        const eye2 = this.add.circle(28, 6, 4, 0xff0000);

        boss.add([body, head, eye1, eye2]);

        this.physics.world.enable(boss);
        boss.body.setSize(64, 64);

        boss.enemyType = 'boss';
        boss.health = 400;
        boss.maxHealth = 400;
        boss.damage = 30;
        boss.speed = 40;
        boss.lastShot = 0;

        this.enemies.add(boss);
    }

    spawnPickups() {
        const { width, height } = this.levelData;

        // Health pickups
        for (let i = 0; i < 2; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(3, width - 4);
                y = Phaser.Math.Between(3, height - 4);
            } while (this.map[y][x] !== 0);

            this.createPickup(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'health');
        }

        // Ammo pickups
        for (let i = 0; i < 2; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(3, width - 4);
                y = Phaser.Math.Between(3, height - 4);
            } while (this.map[y][x] !== 0);

            this.createPickup(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'ammo');
        }
    }

    createPickup(x, y, type) {
        const pickup = this.add.container(x, y);

        if (type === 'health') {
            const bg = this.add.rectangle(0, 0, 16, 16, 0xffffff);
            const cross1 = this.add.rectangle(0, 0, 12, 4, 0xff0000);
            const cross2 = this.add.rectangle(0, 0, 4, 12, 0xff0000);
            pickup.add([bg, cross1, cross2]);
        } else if (type === 'ammo') {
            const box = this.add.rectangle(0, 0, 16, 12, 0x888844);
            const detail = this.add.rectangle(0, 0, 8, 4, 0x666633);
            pickup.add([box, detail]);
        }

        this.physics.world.enable(pickup);
        pickup.body.setSize(16, 16);
        pickup.pickupType = type;

        this.pickups.add(pickup);

        // Bob animation
        this.tweens.add({
            targets: pickup,
            y: y + 3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    shoot() {
        if (this.reloading) return;
        if (this.time.now - this.lastShot < this.weapons[this.currentWeapon].fireRate) return;
        if (this.magazine <= 0) {
            this.reload();
            return;
        }

        this.lastShot = this.time.now;
        this.magazine--;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        if (this.currentWeapon === 2) {
            // Shotgun spread
            for (let i = -2; i <= 2; i++) {
                this.createBullet(angle + i * 0.15);
            }
        } else {
            this.createBullet(angle);
        }

        // Screen shake
        this.cameras.main.shake(50, 0.003);

        // Update UI
        this.events.emit('ammoChanged', this.magazine, this.ammo);
    }

    createBullet(angle) {
        const bullet = this.add.circle(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            3, 0xffff00
        );

        this.physics.world.enable(bullet);
        bullet.body.setVelocity(
            Math.cos(angle) * 600,
            Math.sin(angle) * 600
        );
        bullet.damage = this.weapons[this.currentWeapon].damage;

        this.bullets.add(bullet);

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(angle) * 30,
            this.player.y + Math.sin(angle) * 30,
            8, 0xffaa00
        );
        this.time.delayedCall(50, () => flash.destroy());
    }

    reload() {
        if (this.reloading || this.ammo <= 0) return;
        if (this.magazine >= this.weapons[this.currentWeapon].magazineSize) return;

        this.reloading = true;
        this.time.delayedCall(1000, () => {
            const needed = this.weapons[this.currentWeapon].magazineSize - this.magazine;
            const available = Math.min(needed, this.ammo);
            this.magazine += available;
            this.ammo -= available;
            this.reloading = false;
            this.events.emit('ammoChanged', this.magazine, this.ammo);
        });

        this.events.emit('reloading');
    }

    switchWeapon(index) {
        if (index < 4) {
            this.currentWeapon = index;
            this.events.emit('weaponChanged', this.currentWeapon);
        }
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.health -= bullet.damage;
        bullet.destroy();

        // Blood splash
        for (let i = 0; i < 5; i++) {
            const blood = this.add.circle(
                enemy.x + Phaser.Math.Between(-10, 10),
                enemy.y + Phaser.Math.Between(-10, 10),
                3, 0x33ff33
            );
            this.tweens.add({
                targets: blood,
                alpha: 0,
                duration: 300,
                onComplete: () => blood.destroy()
            });
        }

        if (enemy.health <= 0) {
            // Death effect
            for (let i = 0; i < 10; i++) {
                const particle = this.add.circle(
                    enemy.x + Phaser.Math.Between(-20, 20),
                    enemy.y + Phaser.Math.Between(-20, 20),
                    4, 0x44aa22
                );
                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }

            gameData.xp += enemy.enemyType === 'boss' ? 500 : 50;
            gameData.credits += enemy.enemyType === 'boss' ? 200 : 20;
            enemy.destroy();

            this.events.emit('statsChanged');
        }
    }

    bulletHitWall(bullet, wall) {
        bullet.destroy();
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'health') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        } else if (pickup.pickupType === 'ammo') {
            this.ammo += 50;
        }

        pickup.destroy();
        this.events.emit('statsChanged');
        this.events.emit('ammoChanged', this.magazine, this.ammo);
    }

    enemyHitPlayer(player, enemy) {
        if (this.player.invincible > 0) return;

        this.player.health -= enemy.damage;
        this.player.invincible = 60;
        this.damageFlash = 20;
        this.cameras.main.shake(100, 0.01);

        this.events.emit('statsChanged');

        if (this.player.health <= 0) {
            gameData.lives--;
            if (gameData.lives <= 0) {
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            } else {
                this.player.health = this.player.maxHealth;
                this.player.x = this.levelData.playerStart.x * TILE_SIZE + TILE_SIZE / 2;
                this.player.y = this.levelData.playerStart.y * TILE_SIZE + TILE_SIZE / 2;
            }
        }
    }

    projectileHitPlayer(player, projectile) {
        if (this.player.invincible > 0) return;

        this.player.health -= 15;
        this.player.invincible = 30;
        projectile.destroy();
        this.events.emit('statsChanged');
    }

    update() {
        if (!this.player || !this.player.body) return;

        // Player movement
        let vx = 0, vy = 0;
        if (this.cursors.w.isDown) vy = -1;
        if (this.cursors.s.isDown) vy = 1;
        if (this.cursors.a.isDown) vx = -1;
        if (this.cursors.d.isDown) vx = 1;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.body.setVelocity(vx * 150, vy * 150);

        // Player rotation
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );
        this.player.rotation = angle;

        // Reload key
        if (Phaser.Input.Keyboard.JustDown(this.cursors.r)) {
            this.reload();
        }

        // Invincibility
        if (this.player.invincible > 0) this.player.invincible--;

        // Enemy AI
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.body) return;

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            enemy.rotation = angle;

            // Move toward player
            if (dist > 50) {
                enemy.body.setVelocity(
                    Math.cos(angle) * enemy.speed,
                    Math.sin(angle) * enemy.speed
                );
            } else {
                enemy.body.setVelocity(0, 0);
            }

            // Ranged enemies shoot
            if ((enemy.enemyType === 'scorpion_laser' || enemy.enemyType === 'boss') && dist < 300) {
                if (this.time.now - enemy.lastShot > 2000) {
                    enemy.lastShot = this.time.now;

                    const proj = this.add.circle(enemy.x, enemy.y, 5, 0x33ff00);
                    this.physics.world.enable(proj);
                    proj.body.setVelocity(
                        Math.cos(angle) * 200,
                        Math.sin(angle) * 200
                    );
                    this.enemyProjectiles.add(proj);
                }
            }
        });

        // Check exit
        const exitX = this.levelData.exit.x * TILE_SIZE + TILE_SIZE / 2;
        const exitY = this.levelData.exit.y * TILE_SIZE + TILE_SIZE / 2;
        const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, exitX, exitY);

        if (distToExit < 40 && this.enemies.countActive() === 0) {
            gameData.level++;
            if (gameData.level > 5) {
                // Victory
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            } else {
                this.scene.restart();
            }
        }

        // Render lighting
        this.renderLighting();

        // Damage flash
        if (this.damageFlash > 0) {
            this.damageFlash--;
        }
    }

    renderLighting() {
        this.lightingGraphics.clear();

        if (this.levelData.outdoor) {
            this.lightingGraphics.fillStyle(0x000000, 0.3);
        } else {
            this.lightingGraphics.fillStyle(0x000000, 0.92);
        }

        // Full screen darkness
        const cam = this.cameras.main;
        this.lightingGraphics.fillRect(
            cam.scrollX, cam.scrollY,
            cam.width, cam.height
        );

        // Flashlight cone cutout (using lighter blend)
        this.lightingGraphics.setBlendMode(Phaser.BlendModes.ERASE);

        // Player ambient light
        const gradient = this.lightingGraphics.createRadialGradient
            ? null : null;

        // Simple circular light for now
        this.lightingGraphics.fillStyle(0xffffff, 0.8);
        this.lightingGraphics.fillCircle(this.player.x, this.player.y, 80);

        // Flashlight cone
        const angle = this.player.rotation;
        this.lightingGraphics.beginPath();
        this.lightingGraphics.moveTo(this.player.x, this.player.y);
        this.lightingGraphics.arc(
            this.player.x, this.player.y,
            200, angle - 0.5, angle + 0.5
        );
        this.lightingGraphics.closePath();
        this.lightingGraphics.fillPath();

        this.lightingGraphics.setBlendMode(Phaser.BlendModes.NORMAL);

        // Damage flash
        if (this.damageFlash > 0) {
            this.lightingGraphics.fillStyle(0xff0000, this.damageFlash / 60);
            this.lightingGraphics.fillRect(
                cam.scrollX, cam.scrollY,
                cam.width, cam.height
            );
        }
    }
}

// ==================== UI SCENE ====================
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // HUD background panels
        this.add.rectangle(85, 35, 150, 50, 0x0a2a3a).setStrokeStyle(2, 0x1a5a7a);
        this.add.rectangle(400, 25, 200, 30, 0x0a2a3a).setStrokeStyle(2, 0x1a5a7a);
        this.add.rectangle(115, 570, 200, 50, 0x0a2a3a).setStrokeStyle(2, 0x1a5a7a);
        this.add.rectangle(695, 570, 200, 50, 0x0a2a3a).setStrokeStyle(2, 0x1a5a7a);

        // Labels
        this.rankText = this.add.text(20, 20, '', { fontSize: '12px', color: '#00d4ff' });
        this.livesText = this.add.text(20, 40, '', { fontSize: '12px', color: '#00d4ff' });
        this.levelText = this.add.text(400, 20, '', { fontSize: '14px', color: '#00d4ff' }).setOrigin(0.5, 0);
        this.creditsText = this.add.text(20, 580, '', { fontSize: '12px', color: '#00d4ff' });
        this.weaponText = this.add.text(610, 555, '', { fontSize: '12px', color: '#00d4ff' });
        this.ammoText = this.add.text(610, 575, '', { fontSize: '16px', color: '#00d4ff' });

        // Health bar
        this.healthBarBg = this.add.rectangle(115, 555, 180, 20, 0x333333);
        this.healthBar = this.add.rectangle(25, 555, 180, 18, 0x00ff44).setOrigin(0, 0.5);
        this.healthText = this.add.text(115, 555, '', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

        // Motion tracker
        this.add.circle(720, 480, 55, 0x001a0a, 0.9).setStrokeStyle(2, 0x1a5a7a);
        for (let r = 15; r <= 45; r += 15) {
            this.add.circle(720, 480, r).setStrokeStyle(1, 0x003322, 0.3);
        }
        this.trackerSweep = this.add.line(720, 480, 0, 0, 45, 0, 0x00ff66, 0.5);
        this.trackerSweep.setOrigin(0, 0.5);
        this.trackerCenter = this.add.circle(720, 480, 3, 0x00d4ff);
        this.add.text(720, 540, 'MOTION', { fontSize: '8px', color: '#00d4ff' }).setOrigin(0.5);

        this.enemyDots = [];

        // Get game scene reference
        this.gameScene = this.scene.get('GameScene');

        // Event listeners
        this.gameScene.events.on('statsChanged', this.updateStats, this);
        this.gameScene.events.on('ammoChanged', this.updateAmmo, this);
        this.gameScene.events.on('weaponChanged', this.updateWeapon, this);
        this.gameScene.events.on('reloading', () => this.ammoText.setText('RELOADING'));

        this.updateStats();
        this.updateAmmo(30, 300);
        this.updateWeapon(0);
    }

    updateStats() {
        const gs = this.gameScene;
        this.rankText.setText(`RANK/XP  ${gameData.rank}/${gameData.xp}`);
        this.livesText.setText(`LIVES    ${gameData.lives}`);

        const levelData = gs.levelData;
        this.levelText.setText(levelData ? levelData.name : 'UNKNOWN');

        this.creditsText.setText(`CREDITS: ${gameData.credits}`);

        // Health bar
        const healthPercent = gs.player ? gs.player.health / gs.player.maxHealth : 1;
        this.healthBar.width = 180 * healthPercent;
        this.healthBar.fillColor = healthPercent > 0.3 ? 0x00ff44 : 0xff2222;
        this.healthText.setText(`${gs.player ? Math.ceil(gs.player.health) : 100}/100`);
    }

    updateAmmo(magazine, ammo) {
        this.ammoText.setText(`${magazine} | ${ammo}`);
    }

    updateWeapon(index) {
        const weapons = ['Assault Rifle', 'SMG', 'Shotgun', 'Flamethrower'];
        this.weaponText.setText(weapons[index]);
    }

    update() {
        // Rotate sweep line
        this.trackerSweep.rotation += 0.05;

        // Update enemy dots
        this.enemyDots.forEach(dot => dot.destroy());
        this.enemyDots = [];

        const gs = this.gameScene;
        if (gs.player && gs.enemies) {
            gs.enemies.children.iterate(enemy => {
                if (!enemy) return;
                const dx = enemy.x - gs.player.x;
                const dy = enemy.y - gs.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 300) {
                    const relX = (dx / 300) * 40;
                    const relY = (dy / 300) * 40;
                    const dot = this.add.circle(720 + relX, 480 + relY, 3, 0xff6600);
                    this.enemyDots.push(dot);
                }
            });
        }

        // Debug mode
        if (gameData.debugMode) {
            if (!this.debugPanel) {
                this.debugPanel = this.add.rectangle(700, 170, 190, 180, 0x000000, 0.8).setStrokeStyle(2, 0x00d4ff);
                this.debugText = this.add.text(610, 90, '', { fontSize: '11px', fontFamily: 'monospace', color: '#00d4ff' });
            }
            if (gs.player) {
                this.debugText.setText(
                    `DEBUG MODE (Q toggle)\n` +
                    `-------------------\n` +
                    `Player X: ${Math.round(gs.player.x)}\n` +
                    `Player Y: ${Math.round(gs.player.y)}\n` +
                    `Health: ${Math.ceil(gs.player.health)}\n` +
                    `Ammo: ${gs.magazine}/${gs.ammo}\n` +
                    `Enemy Count: ${gs.enemies.countActive()}\n` +
                    `Level: ${gameData.level}\n` +
                    `Game State: playing\n` +
                    `XP: ${gameData.xp}`
                );
            }
        } else if (this.debugPanel) {
            this.debugPanel.destroy();
            this.debugText.destroy();
            this.debugPanel = null;
            this.debugText = null;
        }
    }
}

// Create configuration and start game
config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
