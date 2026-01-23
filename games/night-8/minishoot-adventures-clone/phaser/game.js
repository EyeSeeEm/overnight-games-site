// Minishoot Adventures Clone - Phaser 3 Implementation
// Twin-stick shooter adventure

// ==================== CONSTANTS ====================
const COLORS = {
    heartRed: 0xff6688,
    heartEmpty: 0x442233,
    energyCyan: 0x00ddff,
    energyEmpty: 0x224466,
    crystalRed: 0xff4444,
    uiGold: 0xffdd44,
    forestGrass: 0x3a8a5a,
    forestGrassDark: 0x2a6a4a,
    forestPath: 0xd4a060,
    forestCliff: 0x6a5040,
    playerBody: 0xffffff,
    playerAccent: 0x00ccff,
    playerGlow: 0x44eeff,
    enemyGreen: 0x66aa44,
    enemyOrange: 0xff8800,
    enemyPurple: 0xaa44aa,
    enemyBullet: 0xffaa44
};

const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2a4a3a, 0x2a4a3a, 0x1a2a1a, 0x1a2a1a, 1);
        bg.fillRect(0, 0, width, height);

        // Decorative circles
        for (let i = 0; i < 20; i++) {
            const x = (i * 97) % width;
            const y = (i * 73) % height;
            const circle = this.add.circle(x, y, 30 + (i % 3) * 10, 0x3a6a4a, 0.6);
        }

        // Title
        this.add.text(width / 2, 180, 'MINISHOOT', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 230, 'ADVENTURES', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#88ddff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Player ship preview
        this.createShipPreview(width / 2, 350);

        // Start prompt
        this.startText = this.add.text(width / 2, 480, 'CLICK OR PRESS SPACE TO START', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Pulsing animation
        this.tweens.add({
            targets: this.startText,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls hint
        this.add.text(width / 2, 550, 'WASD - Move | Mouse - Aim | Click - Shoot | Q - Debug', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#88aa88'
        }).setOrigin(0.5);

        // Input handling
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());

        // Also handle any key press for easier testing
        this.input.keyboard.on('keydown', () => this.startGame());
    }

    createShipPreview(x, y) {
        const ship = this.add.container(x, y);

        // Glow
        const glow = this.add.circle(0, 0, 36, 0x44eeff, 0.3);
        ship.add(glow);

        // Body
        const body = this.add.graphics();
        body.fillStyle(COLORS.playerBody);
        body.beginPath();
        body.moveTo(30, 0);
        body.lineTo(-16, -20);
        body.lineTo(-16, 20);
        body.closePath();
        body.fillPath();
        ship.add(body);

        // Cockpit
        const cockpit = this.add.ellipse(4, 0, 24, 16, COLORS.playerAccent);
        ship.add(cockpit);

        // Wings
        const wings = this.add.graphics();
        wings.fillStyle(0xcccccc);
        wings.beginPath();
        wings.moveTo(-10, -16);
        wings.lineTo(-24, -24);
        wings.lineTo(-16, -12);
        wings.closePath();
        wings.fillPath();
        wings.beginPath();
        wings.moveTo(-10, 16);
        wings.lineTo(-24, 24);
        wings.lineTo(-16, 12);
        wings.closePath();
        wings.fillPath();
        ship.add(wings);

        // Thruster
        const thruster = this.add.ellipse(-20, 0, 12, 10, 0xff8844);
        ship.add(thruster);

        // Animation
        this.tweens.add({
            targets: ship,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        ship.setScale(2);
    }

    startGame() {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.playerData = {
            health: 3,
            maxHealth: 3,
            energy: 4,
            maxEnergy: 4,
            crystals: 0,
            xp: 0,
            level: 1,
            xpToLevel: 10,
            damage: 1,
            fireRate: 3,
            range: 300,
            hasDash: false,
            hasSupershot: false,
            dashCooldown: 0
        };
        this.debugMode = false;
        this.lastShot = 0;
    }

    create() {
        // World bounds
        this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        // Create tile background
        this.createWorld();

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.walls = this.physics.add.staticGroup();
        this.particles = this.add.group();

        // Create player
        this.createPlayer();

        // Generate level
        this.generateLevel();

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.cameras.main.setZoom(1);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            dash: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.scene.get('UIScene').setDebugMode(this.debugMode);
        });

        this.input.keyboard.on('keydown-P', () => {
            this.scene.get('UIScene').togglePause();
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, this.bulletHitWall, null, this);

        // Update UI
        this.updateUI();
    }

    createWorld() {
        // Tile graphics background
        const bgGraphics = this.add.graphics();

        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const variation = (x + y) % 2;
                bgGraphics.fillStyle(variation ? COLORS.forestGrass : COLORS.forestGrassDark);
                bgGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                // Grass blades
                if (Math.random() < 0.2) {
                    bgGraphics.fillStyle(0x2a7a4a);
                    bgGraphics.fillRect(
                        x * TILE_SIZE + 8 + Math.random() * 16,
                        y * TILE_SIZE + 8 + Math.random() * 16,
                        2, 6
                    );
                }
            }
        }

        // Path
        bgGraphics.fillStyle(COLORS.forestPath);
        bgGraphics.fillRect(700, 500, 200, 300);
        bgGraphics.fillRect(600, 700, 400, 100);
    }

    createPlayer() {
        this.player = this.add.container(800, 640);

        // Glow
        const glow = this.add.circle(0, 0, 18, COLORS.playerGlow, 0.3);
        this.player.add(glow);

        // Body
        const body = this.add.graphics();
        body.fillStyle(COLORS.playerBody);
        body.beginPath();
        body.moveTo(15, 0);
        body.lineTo(-8, -10);
        body.lineTo(-8, 10);
        body.closePath();
        body.fillPath();
        this.player.add(body);

        // Cockpit
        const cockpit = this.add.ellipse(2, 0, 12, 8, COLORS.playerAccent);
        this.player.add(cockpit);

        // Wings
        const wings = this.add.graphics();
        wings.fillStyle(0xcccccc);
        wings.beginPath();
        wings.moveTo(-5, -8);
        wings.lineTo(-12, -12);
        wings.lineTo(-8, -6);
        wings.closePath();
        wings.fillPath();
        wings.beginPath();
        wings.moveTo(-5, 8);
        wings.lineTo(-12, 12);
        wings.lineTo(-8, 6);
        wings.closePath();
        wings.fillPath();
        this.player.add(wings);

        // Thruster
        this.thruster = this.add.ellipse(-10, 0, 8, 6, 0xff8844);
        this.player.add(this.thruster);

        // Physics body
        this.physics.world.enable(this.player);
        this.player.body.setCircle(12);
        this.player.body.setOffset(-12, -12);
        this.player.body.setCollideWorldBounds(true);

        this.playerInvincible = 60;
    }

    generateLevel() {
        // Clear existing
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);
        this.walls.clear(true, true);

        // Border walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.createWall(x * TILE_SIZE, 0);
            this.createWall(x * TILE_SIZE, (MAP_HEIGHT - 1) * TILE_SIZE);
        }
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            this.createWall(0, y * TILE_SIZE);
            this.createWall((MAP_WIDTH - 1) * TILE_SIZE, y * TILE_SIZE);
        }

        // Random rocks
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            for (let y = 2; y < MAP_HEIGHT - 2; y++) {
                if (Math.random() < 0.05 && Math.abs(x - 25) > 3 && Math.abs(y - 20) > 3) {
                    this.createWall(x * TILE_SIZE, y * TILE_SIZE, 'rock');
                }
            }
        }

        // Spawn enemies
        const enemyCount = 10 + this.playerData.level * 3;
        for (let i = 0; i < enemyCount; i++) {
            this.spawnEnemy();
        }

        // Spawn pickups
        for (let i = 0; i < 5; i++) {
            this.spawnPickup('crystal');
        }
        this.spawnPickup('heart');
        this.spawnPickup('energy');
    }

    createWall(x, y, type = 'cliff') {
        const wall = this.add.graphics();

        if (type === 'rock') {
            wall.fillStyle(COLORS.forestCliff);
            wall.beginPath();
            wall.moveTo(TILE_SIZE / 2, 0);
            wall.lineTo(TILE_SIZE, TILE_SIZE * 0.7);
            wall.lineTo(TILE_SIZE * 0.8, TILE_SIZE);
            wall.lineTo(TILE_SIZE * 0.2, TILE_SIZE);
            wall.lineTo(0, TILE_SIZE * 0.6);
            wall.closePath();
            wall.fillPath();

            // Highlight
            wall.fillStyle(0x8a7060);
            wall.beginPath();
            wall.moveTo(TILE_SIZE / 2, 0);
            wall.lineTo(TILE_SIZE * 0.6, TILE_SIZE * 0.3);
            wall.lineTo(TILE_SIZE * 0.3, TILE_SIZE * 0.2);
            wall.closePath();
            wall.fillPath();
        } else {
            wall.fillStyle(COLORS.forestCliff);
            wall.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            wall.fillStyle(0x5a4030);
            wall.fillRect(0, TILE_SIZE - 4, TILE_SIZE, 4);
        }

        wall.setPosition(x, y);
        this.walls.add(wall);
        wall.body.setSize(TILE_SIZE, TILE_SIZE);
        wall.body.setOffset(0, 0);
    }

    spawnEnemy() {
        const types = ['scout', 'grasshopper', 'turret', 'heavy'];
        const maxType = Math.min(types.length, 2 + Math.floor(this.playerData.level / 2));
        const type = types[Math.floor(Math.random() * maxType)];

        let x, y;
        do {
            x = 100 + Math.random() * (MAP_WIDTH * TILE_SIZE - 200);
            y = 100 + Math.random() * (MAP_HEIGHT * TILE_SIZE - 200);
        } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 200);

        this.createEnemy(x, y, type);
    }

    createEnemy(x, y, type) {
        const config = {
            scout: { health: 2, speed: 100, color: COLORS.enemyGreen, xp: 1, behavior: 'chase', shootRate: 2000, size: 20 },
            grasshopper: { health: 3, speed: 150, color: COLORS.enemyOrange, xp: 2, behavior: 'hop', shootRate: 1500, size: 24 },
            turret: { health: 5, speed: 0, color: COLORS.enemyGreen, xp: 3, behavior: 'turret', shootRate: 800, size: 28 },
            heavy: { health: 10, speed: 60, color: COLORS.enemyPurple, xp: 5, behavior: 'chase', shootRate: 1200, size: 32 }
        }[type];

        const enemy = this.add.container(x, y);

        // Body graphics
        const body = this.add.graphics();
        if (config.behavior === 'turret') {
            body.fillStyle(config.color);
            body.fillCircle(0, 0, config.size / 2);
            body.fillStyle(0x333333);
            body.fillRect(-4, -config.size / 2 - 5, 8, 10);
            body.fillStyle(0xff4444);
            body.fillCircle(0, 0, 5);
        } else {
            body.fillStyle(config.color);
            body.fillEllipse(0, 0, config.size, config.size / 1.5);
            body.fillStyle(0xff4444);
            body.fillCircle(3, -2, 3);
            body.fillCircle(3, 2, 3);
        }
        enemy.add(body);

        // Physics
        this.physics.world.enable(enemy);
        enemy.body.setCircle(config.size / 2);
        enemy.body.setOffset(-config.size / 2, -config.size / 2);

        // Data
        enemy.setData({
            type: type,
            health: config.health,
            maxHealth: config.health,
            speed: config.speed,
            color: config.color,
            xp: config.xp,
            behavior: config.behavior,
            shootRate: config.shootRate,
            lastShot: 0,
            hopTimer: 0,
            flash: 0,
            bodyGraphics: body,
            size: config.size
        });

        this.enemies.add(enemy);
    }

    spawnPickup(type) {
        const x = 100 + Math.random() * (MAP_WIDTH * TILE_SIZE - 200);
        const y = 100 + Math.random() * (MAP_HEIGHT * TILE_SIZE - 200);

        const pickup = this.add.container(x, y);
        const graphics = this.add.graphics();

        if (type === 'crystal') {
            graphics.fillStyle(COLORS.crystalRed);
            graphics.beginPath();
            graphics.moveTo(0, -8);
            graphics.lineTo(6, 0);
            graphics.lineTo(0, 8);
            graphics.lineTo(-6, 0);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xff8888);
            graphics.beginPath();
            graphics.moveTo(-2, -4);
            graphics.lineTo(0, -6);
            graphics.lineTo(2, -2);
            graphics.lineTo(0, 0);
            graphics.closePath();
            graphics.fillPath();
        } else if (type === 'heart') {
            graphics.fillStyle(COLORS.heartRed);
            const heartPath = new Phaser.Curves.Path(0, 3);
            heartPath.cubicBezierTo(-8, -3, -8, -8, 0, -8);
            heartPath.cubicBezierTo(8, -8, 8, -3, 0, 3);
            graphics.fillCircle(-4, -4, 5);
            graphics.fillCircle(4, -4, 5);
            graphics.fillTriangle(0, 6, -8, -2, 8, -2);
        } else if (type === 'energy') {
            graphics.fillStyle(COLORS.energyCyan);
            graphics.beginPath();
            graphics.moveTo(0, -10);
            graphics.lineTo(8, 0);
            graphics.lineTo(0, 10);
            graphics.lineTo(-8, 0);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0x88ffff);
            graphics.beginPath();
            graphics.moveTo(-3, -5);
            graphics.lineTo(0, -8);
            graphics.lineTo(3, -3);
            graphics.lineTo(0, 0);
            graphics.closePath();
            graphics.fillPath();
        }

        pickup.add(graphics);
        pickup.setData('type', type);

        // Physics
        this.physics.world.enable(pickup);
        pickup.body.setCircle(10);
        pickup.body.setOffset(-10, -10);

        // Bob animation
        this.tweens.add({
            targets: pickup,
            y: y - 5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pickups.add(pickup);
    }

    update(time, delta) {
        if (this.scene.get('UIScene').isPaused) return;

        const dt = delta / 1000;

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.updateParticles();

        // Auto-shoot
        if (this.input.activePointer.isDown) {
            this.shoot(time);
        }

        // Clean up out-of-bounds bullets
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.getData('life') <= 0) bullet.destroy();
            else bullet.setData('life', bullet.getData('life') - 1);
        });

        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < -50 || bullet.x > MAP_WIDTH * TILE_SIZE + 50 ||
                bullet.y < -50 || bullet.y > MAP_HEIGHT * TILE_SIZE + 50) {
                bullet.destroy();
            }
        });

        // Level complete
        if (this.enemies.countActive() === 0) {
            this.playerData.level++;
            this.playerData.xpToLevel = 10 + this.playerData.level * 5;
            this.generateLevel();
            this.updateUI();
        }
    }

    updatePlayer(dt, time) {
        // Movement
        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.player.body.setVelocity(dx * 200, dy * 200);

        // Aim toward mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Invincibility
        if (this.playerInvincible > 0) {
            this.playerInvincible--;
            this.player.alpha = this.playerInvincible % 6 < 3 ? 0.5 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Thruster animation
        this.thruster.scaleX = 1 + Math.random() * 0.3;

        // Dash
        if (this.playerData.hasDash && this.playerData.dashCooldown > 0) {
            this.playerData.dashCooldown--;
        }
        if (this.playerData.hasDash && this.cursors.dash.isDown && this.playerData.dashCooldown === 0) {
            this.player.x += dx * 100;
            this.player.y += dy * 100;
            this.playerData.dashCooldown = 30;
            this.playerInvincible = 15;

            for (let i = 0; i < 8; i++) {
                this.createParticle(this.player.x, this.player.y, COLORS.playerGlow, 4, 15);
            }
        }
    }

    shoot(time) {
        if (time - this.lastShot < 1000 / this.playerData.fireRate) return;
        this.lastShot = time;

        const angle = this.player.rotation;
        const bullet = this.add.circle(
            this.player.x + Math.cos(angle) * 15,
            this.player.y + Math.sin(angle) * 15,
            4, COLORS.playerAccent
        );

        this.physics.world.enable(bullet);
        bullet.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
        bullet.setData({
            damage: this.playerData.damage,
            life: this.playerData.range / 400 * 60
        });

        this.bullets.add(bullet);

        // Muzzle flash
        this.createParticle(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            COLORS.playerGlow, 6, 8
        );
    }

    updateEnemies(dt, time) {
        this.enemies.getChildren().forEach(enemy => {
            const data = enemy.data.values;
            if (data.flash > 0) {
                data.flash--;
                // Flash white effect using alpha/scale instead of tint
                if (data.bodyGraphics) {
                    data.bodyGraphics.alpha = data.flash > 0 ? 0.5 : 1;
                }
            }

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Movement
            if (data.behavior === 'chase' && dist > 50) {
                enemy.body.setVelocity(Math.cos(angle) * data.speed, Math.sin(angle) * data.speed);
            } else if (data.behavior === 'hop') {
                data.hopTimer++;
                if (data.hopTimer > 60) {
                    enemy.x += Math.cos(angle) * 80;
                    enemy.y += Math.sin(angle) * 80;
                    data.hopTimer = 0;
                }
                enemy.body.setVelocity(0, 0);
            } else {
                enemy.body.setVelocity(0, 0);
            }

            // Shooting
            if (time - data.lastShot > data.shootRate && dist < 400) {
                data.lastShot = time;

                if (data.behavior === 'turret') {
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2;
                        this.createEnemyBullet(enemy.x, enemy.y, a);
                    }
                } else {
                    this.createEnemyBullet(enemy.x, enemy.y, angle);
                }
            }
        });
    }

    createEnemyBullet(x, y, angle) {
        const bullet = this.add.circle(x, y, 5, COLORS.enemyBullet);

        // Glow
        const glow = this.add.circle(x, y, 8, COLORS.enemyBullet, 0.4);
        glow.bullet = bullet;

        this.physics.world.enable(bullet);
        bullet.body.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
        bullet.glow = glow;
        this.enemyBullets.add(bullet);

        // Update glow position in tweens
        this.tweens.add({
            targets: glow,
            onUpdate: () => {
                if (bullet.active) {
                    glow.setPosition(bullet.x, bullet.y);
                } else {
                    glow.destroy();
                }
            },
            duration: 5000
        });
    }

    bulletHitEnemy(bullet, enemy) {
        const data = enemy.data.values;
        data.health -= bullet.getData('damage');
        data.flash = 5;

        this.createParticle(bullet.x, bullet.y, data.color, 4, 15);
        bullet.destroy();

        if (data.health <= 0) {
            // XP gain
            this.playerData.xp += data.xp;

            // Death particles
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const p = this.createParticle(enemy.x, enemy.y, data.color, 5 + Math.random() * 5, 30);
                if (p && p.body) {
                    p.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
                }
            }

            // Drop crystals
            for (let i = 0; i < data.xp; i++) {
                const px = enemy.x + (Math.random() - 0.5) * 30;
                const py = enemy.y + (Math.random() - 0.5) * 30;
                this.spawnPickupAt(px, py, 'crystal');
            }

            enemy.destroy();

            // Level up check
            if (this.playerData.xp >= this.playerData.xpToLevel) {
                this.playerData.xp -= this.playerData.xpToLevel;
                this.playerData.level++;
                this.playerData.xpToLevel = 10 + this.playerData.level * 5;
                this.playerData.damage += 0.2;
                this.playerData.fireRate += 0.1;
            }

            this.updateUI();
        }
    }

    spawnPickupAt(x, y, type) {
        const pickup = this.add.container(x, y);
        const graphics = this.add.graphics();

        graphics.fillStyle(COLORS.crystalRed);
        graphics.beginPath();
        graphics.moveTo(0, -6);
        graphics.lineTo(5, 0);
        graphics.lineTo(0, 6);
        graphics.lineTo(-5, 0);
        graphics.closePath();
        graphics.fillPath();

        pickup.add(graphics);
        pickup.setData('type', type);

        this.physics.world.enable(pickup);
        pickup.body.setCircle(8);
        pickup.body.setOffset(-8, -8);

        this.tweens.add({
            targets: pickup,
            y: y - 5,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pickups.add(pickup);
    }

    playerHitByBullet(player, bullet) {
        if (this.playerInvincible <= 0) {
            this.damagePlayer(1);
        }
        if (bullet.glow) bullet.glow.destroy();
        bullet.destroy();
    }

    playerHitEnemy(player, enemy) {
        if (this.playerInvincible <= 0) {
            const damage = enemy.getData('type') === 'heavy' ? 2 : 1;
            this.damagePlayer(damage);
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        if (type === 'crystal') {
            this.playerData.crystals++;
        } else if (type === 'heart') {
            this.playerData.health = Math.min(this.playerData.maxHealth, this.playerData.health + 1);
        } else if (type === 'energy') {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + 1);
        }

        // Collection particles
        const colors = { crystal: COLORS.crystalRed, heart: COLORS.heartRed, energy: COLORS.energyCyan };
        for (let i = 0; i < 5; i++) {
            this.createParticle(pickup.x, pickup.y, colors[type], 3, 15);
        }

        pickup.destroy();
        this.updateUI();
    }

    bulletHitWall(bullet, wall) {
        if (bullet.glow) bullet.glow.destroy();
        bullet.destroy();
    }

    damagePlayer(amount) {
        this.playerData.health -= amount;
        this.playerInvincible = 60;

        // Screen shake
        this.cameras.main.shake(200, 0.01);

        // Damage particles
        for (let i = 0; i < 5; i++) {
            this.createParticle(this.player.x, this.player.y, COLORS.heartRed, 4, 20);
        }

        if (this.playerData.health <= 0) {
            this.scene.get('UIScene').showGameOver(this.playerData);
        }

        this.updateUI();
    }

    createParticle(x, y, color, size, life) {
        const particle = this.add.circle(x, y, size, color);
        this.physics.world.enable(particle);
        particle.body.setVelocity((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        particle.setData({ life: life, maxLife: life });
        this.particles.add(particle);
        return particle;
    }

    updateParticles() {
        this.particles.getChildren().forEach(p => {
            const life = p.getData('life') - 1;
            p.setData('life', life);

            if (life <= 0) {
                p.destroy();
            } else {
                const alpha = life / p.getData('maxLife');
                p.setAlpha(alpha);
                p.setScale(alpha);
                p.body.velocity.x *= 0.95;
                p.body.velocity.y *= 0.95;
            }
        });
    }

    updateUI() {
        const ui = this.scene.get('UIScene');
        if (ui && ui.updatePlayerData) {
            ui.updatePlayerData(this.playerData, this.enemies.countActive());
        }
    }
}

// ==================== UI SCENE ====================
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.isPaused = false;
    }

    create() {
        this.createHUD();
        this.createPauseScreen();
        this.createGameOverScreen();
        this.createDebugOverlay();
    }

    createHUD() {
        // Hearts container - show first 3 by default
        this.hearts = [];
        for (let i = 0; i < 10; i++) {
            const heart = this.add.graphics();
            heart.setPosition(20 + i * 25, 25);
            this.drawHeart(heart, i < 3);
            heart.setVisible(i < 3);
            this.hearts.push(heart);
        }

        // Energy diamonds - show first 4 by default
        this.energyDiamonds = [];
        for (let i = 0; i < 12; i++) {
            const diamond = this.add.graphics();
            diamond.setPosition(20 + i * 20, 55);
            this.drawDiamond(diamond, i < 4);
            diamond.setVisible(i < 4);
            this.energyDiamonds.push(diamond);
        }

        // Crystals display
        this.crystalIcon = this.add.graphics();
        this.crystalIcon.fillStyle(COLORS.crystalRed);
        this.crystalIcon.beginPath();
        this.crystalIcon.moveTo(0, -8);
        this.crystalIcon.lineTo(6, 0);
        this.crystalIcon.lineTo(0, 8);
        this.crystalIcon.lineTo(-6, 0);
        this.crystalIcon.closePath();
        this.crystalIcon.fillPath();
        this.crystalIcon.setPosition(25, 88);

        this.crystalText = this.add.text(40, 80, '0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });

        // XP bar
        this.xpBarBg = this.add.rectangle(800 - 85, 25, 130, 20, 0x333333);
        this.xpBarFill = this.add.rectangle(800 - 85, 25, 0, 16, COLORS.uiGold);
        this.xpBarFill.setOrigin(0, 0.5);
        this.xpBarFill.x = 800 - 148;

        this.levelText = this.add.text(780, 42, 'LV 1', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Enemy count
        this.enemyText = this.add.text(780, 62, 'Enemies: 0', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(1, 0);
    }

    drawHeart(graphics, filled) {
        graphics.clear();
        graphics.fillStyle(filled ? COLORS.heartRed : COLORS.heartEmpty);
        graphics.fillCircle(-4, -4, 5);
        graphics.fillCircle(4, -4, 5);
        graphics.fillTriangle(0, 6, -9, -2, 9, -2);
    }

    drawDiamond(graphics, filled) {
        graphics.clear();
        graphics.fillStyle(filled ? COLORS.energyCyan : COLORS.energyEmpty);
        graphics.beginPath();
        graphics.moveTo(0, -8);
        graphics.lineTo(6, 0);
        graphics.lineTo(0, 8);
        graphics.lineTo(-6, 0);
        graphics.closePath();
        graphics.fillPath();
    }

    createPauseScreen() {
        this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
        this.pauseText = this.add.text(400, 280, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.pauseHint = this.add.text(400, 340, 'Press P to resume', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.pauseOverlay.setVisible(false);
        this.pauseText.setVisible(false);
        this.pauseHint.setVisible(false);
    }

    createGameOverScreen() {
        this.gameOverOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        this.gameOverTitle = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.gameOverStats = this.add.text(400, 310, '', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.gameOverHint = this.add.text(400, 370, 'Press SPACE to restart', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.gameOverOverlay.setVisible(false);
        this.gameOverTitle.setVisible(false);
        this.gameOverStats.setVisible(false);
        this.gameOverHint.setVisible(false);
    }

    createDebugOverlay() {
        this.debugBg = this.add.rectangle(705, 165, 190, 150, 0x000000, 0.8);
        this.debugText = this.add.text(620, 100, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff88'
        });
        this.debugBg.setVisible(false);
        this.debugText.setVisible(false);
    }

    updatePlayerData(data, enemyCount) {
        if (!this.hearts || !data) return;

        // Update hearts
        for (let i = 0; i < this.hearts.length; i++) {
            if (i < data.maxHealth) {
                this.hearts[i].setVisible(true);
                this.drawHeart(this.hearts[i], i < data.health);
            } else {
                this.hearts[i].setVisible(false);
            }
        }

        // Update energy
        for (let i = 0; i < this.energyDiamonds.length; i++) {
            if (i < data.maxEnergy) {
                this.energyDiamonds[i].setVisible(true);
                this.drawDiamond(this.energyDiamonds[i], i < data.energy);
            } else {
                this.energyDiamonds[i].setVisible(false);
            }
        }

        // Update crystals
        this.crystalText.setText(data.crystals.toString());

        // Update XP bar
        const xpPercent = data.xp / data.xpToLevel;
        this.xpBarFill.width = 126 * xpPercent;

        // Update level
        this.levelText.setText(`LV ${data.level}`);

        // Update enemy count
        this.enemyText.setText(`Enemies: ${enemyCount}`);

        // Update debug
        if (this.debugBg.visible) {
            const gameScene = this.scene.get('GameScene');
            this.debugText.setText([
                'DEBUG MODE (Q)',
                '---',
                `Player X: ${Math.round(gameScene.player.x)}`,
                `Player Y: ${Math.round(gameScene.player.y)}`,
                `Health: ${data.health}/${data.maxHealth}`,
                `Crystals: ${data.crystals}`,
                `Level: ${data.level}`,
                `XP: ${data.xp}/${data.xpToLevel}`,
                `Enemies: ${enemyCount}`,
                `Bullets: ${gameScene.bullets.countActive()}`
            ].join('\n'));
        }

        this.playerData = data;
        this.enemyCount = enemyCount;
    }

    setDebugMode(enabled) {
        this.debugBg.setVisible(enabled);
        this.debugText.setVisible(enabled);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);
        this.pauseText.setVisible(this.isPaused);
        this.pauseHint.setVisible(this.isPaused);
    }

    showGameOver(data) {
        this.gameOverOverlay.setVisible(true);
        this.gameOverTitle.setVisible(true);
        this.gameOverStats.setVisible(true);
        this.gameOverHint.setVisible(true);
        this.gameOverStats.setText(`Level: ${data.level} | Crystals: ${data.crystals}`);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.gameOverOverlay.setVisible(false);
            this.gameOverTitle.setVisible(false);
            this.gameOverStats.setVisible(false);
            this.gameOverHint.setVisible(false);
            this.scene.get('GameScene').scene.restart();
        });
    }
}

// ==================== GAME CONFIG ====================
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a2a1a',
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
