// Station Breach - Phaser 3 Version
// Alien Breed Style Twin-Stick Shooter

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

// Colors
const COLORS = {
    floor: 0x4A3A2A,
    floorDark: 0x2A1A0A,
    wall: 0x5A5A5A,
    wallLight: 0x7A7A7A,
    wallDark: 0x3A3A3A,
    wallPanel: 0x4A4A4A,
    player: 0x3A5A2A,
    playerLight: 0x4A6A3A,
    alien: 0x0A0A0A,
    alienEye: 0x880000,
    bullet: 0xFFAA00,
    health: 0xCC2222,
    shield: 0x3366CC,
    hudBg: 0x050505,
    hudYellow: 0xFFCC00,
    bloodAlien: 0x00AA66
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Create textures dynamically
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player texture
        let gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.player);
        gfx.fillRect(2, 4, 20, 16);
        gfx.fillStyle(COLORS.playerLight);
        gfx.fillRect(4, 6, 16, 8);
        gfx.fillStyle(0x2A2A2A);
        gfx.fillRect(14, 8, 12, 6);
        gfx.generateTexture('player', 28, 24);
        gfx.destroy();

        // Bullet texture
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.bullet);
        gfx.fillRect(0, 2, 12, 4);
        gfx.generateTexture('bullet', 12, 8);
        gfx.destroy();

        // Alien drone texture
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.alien);
        gfx.fillCircle(16, 16, 12);
        gfx.fillStyle(COLORS.alienEye);
        gfx.fillCircle(12, 14, 2);
        gfx.fillCircle(20, 14, 2);
        // Legs
        gfx.lineStyle(2, 0x050505);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            gfx.lineBetween(
                16 + Math.cos(angle) * 8,
                16 + Math.sin(angle) * 8,
                16 + Math.cos(angle) * 18,
                16 + Math.sin(angle) * 18
            );
        }
        gfx.generateTexture('alien_drone', 32, 32);
        gfx.destroy();

        // Brute texture (larger)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.alien);
        gfx.fillCircle(24, 24, 18);
        gfx.fillStyle(COLORS.alienEye);
        gfx.fillCircle(18, 20, 3);
        gfx.fillCircle(30, 20, 3);
        gfx.lineStyle(3, 0x050505);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            gfx.lineBetween(
                24 + Math.cos(angle) * 12,
                24 + Math.sin(angle) * 12,
                24 + Math.cos(angle) * 26,
                24 + Math.sin(angle) * 26
            );
        }
        gfx.generateTexture('alien_brute', 48, 48);
        gfx.destroy();

        // Acid bullet
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x88FF88);
        gfx.fillCircle(5, 5, 5);
        gfx.generateTexture('acid', 10, 10);
        gfx.destroy();

        // Floor tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.floor);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(COLORS.floorDark);
        gfx.fillRect(0, 0, 2, TILE_SIZE);
        gfx.fillRect(0, 0, TILE_SIZE, 2);
        gfx.fillRect(15, 0, 2, TILE_SIZE);
        gfx.fillRect(0, 15, TILE_SIZE, 2);
        gfx.generateTexture('floor', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Wall tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.wall);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(COLORS.wallLight);
        gfx.fillRect(0, 0, TILE_SIZE, 3);
        gfx.fillRect(0, 0, 3, TILE_SIZE);
        gfx.fillStyle(COLORS.wallDark);
        gfx.fillRect(0, TILE_SIZE - 3, TILE_SIZE, 3);
        gfx.fillRect(TILE_SIZE - 3, 0, 3, TILE_SIZE);
        gfx.fillStyle(COLORS.wallPanel);
        gfx.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        // Rivets
        gfx.fillStyle(COLORS.wallLight);
        gfx.fillCircle(6, 6, 2);
        gfx.fillCircle(TILE_SIZE - 6, 6, 2);
        gfx.fillCircle(6, TILE_SIZE - 6, 2);
        gfx.fillCircle(TILE_SIZE - 6, TILE_SIZE - 6, 2);
        gfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Health pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.health);
        gfx.fillRect(4, 9, 16, 6);
        gfx.fillRect(9, 4, 6, 16);
        gfx.generateTexture('health_pickup', 24, 24);
        gfx.destroy();

        // Ammo pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.hudYellow);
        gfx.fillRect(6, 2, 12, 20);
        gfx.fillStyle(0xAA8800);
        gfx.fillRect(8, 4, 8, 16);
        gfx.generateTexture('ammo_pickup', 24, 24);
        gfx.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Level map
        this.levelMap = [];
        this.generateLevel();

        // Draw level
        this.levelGroup = this.add.group();
        this.drawLevel();

        // Player
        this.player = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player');
        this.player.setDepth(10);
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.shield = 0;
        this.player.maxShield = 50;
        this.player.ammo = 60;
        this.player.maxAmmo = 120;
        this.player.lives = 3;
        this.player.credits = 0;
        this.player.keys = { green: false, blue: false, yellow: false, red: false };
        this.player.stamina = 100;
        this.player.maxStamina = 100;
        this.player.fireTimer = 0;
        this.player.invulnTimer = 0;

        // Physics
        this.physics.add.existing(this.player);
        this.player.body.setSize(20, 20);
        this.player.body.setCollideWorldBounds(true);

        // Bullets
        this.bullets = this.add.group();
        this.enemyBullets = this.add.group();

        // Enemies
        this.enemies = this.add.group();
        this.spawnEnemies();

        // Pickups
        this.pickups = this.add.group();

        // Particles
        this.particles = this.add.particles(0, 0, 'bullet', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            emitting: false
        });

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            r: Phaser.Input.Keyboard.KeyCodes.R
        });

        // Mouse
        this.input.on('pointerdown', () => {
            this.isShooting = true;
        });
        this.input.on('pointerup', () => {
            this.isShooting = false;
        });
        this.isShooting = false;

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        // HUD (fixed to camera)
        this.createHUD();

        // Game state
        this.gameState = 'playing';

        // Expose for testing
        window.gameState = () => ({
            state: this.gameState,
            playerHealth: this.player.health,
            playerAmmo: this.player.ammo,
            enemies: this.enemies.getLength(),
            bullets: this.bullets.getLength()
        });
    }

    generateLevel() {
        // Initialize with void (0)
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.levelMap[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.levelMap[y][x] = 0;
            }
        }

        // Create rooms
        const rooms = [
            { x: 10, y: 12, w: 6, h: 5, name: 'start' },
            { x: 2, y: 6, w: 5, h: 5, name: 'security' },
            { x: 9, y: 5, w: 7, h: 6, name: 'cargo' },
            { x: 18, y: 6, w: 5, h: 5, name: 'armory' },
            { x: 9, y: 1, w: 6, h: 4, name: 'medical' }
        ];

        // Carve rooms
        rooms.forEach(room => {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                        this.levelMap[y][x] = 1; // Floor
                    }
                }
            }
            // Walls
            for (let y = room.y - 1; y <= room.y + room.h; y++) {
                for (let x = room.x - 1; x <= room.x + room.w; x++) {
                    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                        if (this.levelMap[y][x] === 0) {
                            this.levelMap[y][x] = 2; // Wall
                        }
                    }
                }
            }
        });

        // Corridors
        this.createCorridor(13, 12, 13, 11);
        this.createCorridor(9, 8, 7, 8);
        this.createCorridor(16, 8, 18, 8);
        this.createCorridor(12, 5, 12, 4);

        // Spawn point
        this.spawnPoint = {
            x: rooms[0].x * TILE_SIZE + rooms[0].w * TILE_SIZE / 2,
            y: rooms[0].y * TILE_SIZE + rooms[0].h * TILE_SIZE / 2
        };
    }

    createCorridor(x1, y1, x2, y2) {
        const dx = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
        const dy = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;

        let x = x1, y = y1;
        while (x !== x2 || y !== y2) {
            for (let ox = -1; ox <= 0; ox++) {
                for (let oy = -1; oy <= 0; oy++) {
                    const tx = x + ox;
                    const ty = y + oy;
                    if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                        if (this.levelMap[ty][tx] !== 1) {
                            this.levelMap[ty][tx] = 1;
                        }
                    }
                }
            }
            for (let ox = -2; ox <= 1; ox++) {
                for (let oy = -2; oy <= 1; oy++) {
                    const tx = x + ox;
                    const ty = y + oy;
                    if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                        if (this.levelMap[ty][tx] === 0) {
                            this.levelMap[ty][tx] = 2;
                        }
                    }
                }
            }

            if (x !== x2) x += dx;
            else if (y !== y2) y += dy;
        }
    }

    drawLevel() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const type = this.levelMap[y][x];
                if (type === 1) {
                    const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'floor');
                    this.levelGroup.add(tile);
                } else if (type === 2) {
                    const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                    this.levelGroup.add(tile);
                }
            }
        }
    }

    spawnEnemies() {
        // Drones in cargo
        for (let i = 0; i < 5; i++) {
            const ex = 9 * TILE_SIZE + Math.random() * 6 * TILE_SIZE + TILE_SIZE / 2;
            const ey = 5 * TILE_SIZE + Math.random() * 5 * TILE_SIZE + TILE_SIZE / 2;
            this.createEnemy(ex, ey, 'drone');
        }

        // Spitter in security
        this.createEnemy(4 * TILE_SIZE + TILE_SIZE / 2, 8 * TILE_SIZE + TILE_SIZE / 2, 'spitter');

        // Drones near armory
        this.createEnemy(19 * TILE_SIZE + TILE_SIZE / 2, 7 * TILE_SIZE + TILE_SIZE / 2, 'drone');
        this.createEnemy(20 * TILE_SIZE + TILE_SIZE / 2, 9 * TILE_SIZE + TILE_SIZE / 2, 'drone');

        // Brute in medical
        this.createEnemy(11 * TILE_SIZE + TILE_SIZE / 2, 2 * TILE_SIZE + TILE_SIZE / 2, 'brute');
    }

    createEnemy(x, y, type) {
        const textureKey = type === 'brute' ? 'alien_brute' : 'alien_drone';
        const enemy = this.add.sprite(x, y, textureKey);
        enemy.setDepth(5);
        this.physics.add.existing(enemy);

        enemy.type = type;
        switch (type) {
            case 'drone':
                enemy.health = 20;
                enemy.speed = 120;
                enemy.damage = 10;
                enemy.credits = 5;
                enemy.body.setSize(24, 24);
                break;
            case 'spitter':
                enemy.health = 30;
                enemy.speed = 80;
                enemy.damage = 15;
                enemy.credits = 10;
                enemy.body.setSize(24, 24);
                enemy.fireTimer = 0;
                break;
            case 'brute':
                enemy.health = 100;
                enemy.speed = 60;
                enemy.damage = 30;
                enemy.credits = 30;
                enemy.body.setSize(36, 36);
                break;
        }

        enemy.attackTimer = 1;
        enemy.hitFlash = 0;
        this.enemies.add(enemy);
    }

    createHUD() {
        // HUD background (fixed)
        this.hudTop = this.add.rectangle(400, 14, 800, 28, COLORS.hudBg);
        this.hudTop.setScrollFactor(0);
        this.hudTop.setDepth(100);

        this.hudBottom = this.add.rectangle(400, 586, 800, 28, COLORS.hudBg);
        this.hudBottom.setScrollFactor(0);
        this.hudBottom.setDepth(100);

        // HUD Text
        const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#CCCCCC' };

        this.hud1UP = this.add.text(8, 10, '1UP', { ...textStyle, color: '#FFCC00' });
        this.hud1UP.setScrollFactor(0).setDepth(101);

        this.hudLives = this.add.text(60, 10, 'LIVES', textStyle);
        this.hudLives.setScrollFactor(0).setDepth(101);

        this.livesDisplay = this.add.group();
        for (let i = 0; i < 3; i++) {
            const life = this.add.rectangle(130 + i * 18, 14, 14, 10, COLORS.health);
            life.setScrollFactor(0).setDepth(101);
            this.livesDisplay.add(life);
        }

        this.hudAmmo = this.add.text(220, 10, 'AMMO', textStyle);
        this.hudAmmo.setScrollFactor(0).setDepth(101);

        this.ammoBar = this.add.rectangle(330, 14, 100, 12, 0x1A1A1A);
        this.ammoBar.setScrollFactor(0).setDepth(101);
        this.ammoFill = this.add.rectangle(281, 14, 98, 10, COLORS.hudYellow);
        this.ammoFill.setScrollFactor(0).setDepth(101);
        this.ammoFill.setOrigin(0, 0.5);

        this.ammoText = this.add.text(390, 10, '60', textStyle);
        this.ammoText.setScrollFactor(0).setDepth(101);

        this.hudKeys = this.add.text(500, 10, 'KEYS', textStyle);
        this.hudKeys.setScrollFactor(0).setDepth(101);

        // Key slots
        this.keySlots = [];
        const keyColors = [0x006600, 0x003366, 0x666600, 0x660000];
        for (let i = 0; i < 4; i++) {
            const slot = this.add.rectangle(570 + i * 24, 14, 20, 16, 0x1A1A1A);
            slot.setScrollFactor(0).setDepth(101);
            slot.setStrokeStyle(1, 0x333333);
            this.keySlots.push(slot);
        }

        // Bottom HUD
        this.hudHealth = this.add.text(8, 580, 'HEALTH', textStyle);
        this.hudHealth.setScrollFactor(0).setDepth(101);

        this.healthBar = this.add.rectangle(150, 586, 140, 12, 0x1A1A1A);
        this.healthBar.setScrollFactor(0).setDepth(101);
        this.healthFill = this.add.rectangle(81, 586, 138, 10, COLORS.health);
        this.healthFill.setScrollFactor(0).setDepth(101);
        this.healthFill.setOrigin(0, 0.5);

        this.hudCredits = this.add.text(720, 580, '$0', { ...textStyle, color: '#FFCC00' });
        this.hudCredits.setScrollFactor(0).setDepth(101);
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;

        // Player movement
        let dx = 0, dy = 0;
        if (this.cursors.w.isDown) dy = -1;
        if (this.cursors.s.isDown) dy = 1;
        if (this.cursors.a.isDown) dx = -1;
        if (this.cursors.d.isDown) dx = 1;

        if (dx && dy) {
            dx *= 0.707;
            dy *= 0.707;
        }

        let speed = 180;
        if (this.cursors.shift.isDown && this.player.stamina > 0 && (dx || dy)) {
            speed = 270;
            this.player.stamina -= 25 * dt;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 20 * dt;
        }

        // Apply velocity
        this.player.body.setVelocity(dx * speed, dy * speed);

        // Check wall collision
        const newX = this.player.x + dx * speed * dt;
        const newY = this.player.y + dy * speed * dt;
        if (this.isWall(newX, this.player.y)) {
            this.player.body.setVelocityX(0);
        }
        if (this.isWall(this.player.x, newY)) {
            this.player.body.setVelocityY(0);
        }

        // Aim at mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Shooting
        this.player.fireTimer -= dt;
        if (this.isShooting && this.player.fireTimer <= 0 && this.player.ammo > 0) {
            this.shoot(angle);
        }

        // Reload
        if (this.cursors.r.isDown) {
            this.player.ammo = this.player.maxAmmo;
        }

        // Invulnerability
        if (this.player.invulnTimer > 0) {
            this.player.invulnTimer -= dt;
            this.player.alpha = Math.floor(this.player.invulnTimer * 10) % 2 === 0 ? 0.5 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Update bullets
        this.bullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            bullet.life -= dt;
            if (bullet.life <= 0 || this.isWall(bullet.x, bullet.y)) {
                bullet.destroy();
                return;
            }

            // Check enemy hits
            this.enemies.children.iterate(enemy => {
                if (!enemy || !enemy.active) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                if (dist < 20) {
                    this.hitEnemy(enemy, 15, bullet.rotation);
                    bullet.destroy();
                }
            });
        });

        // Update enemy bullets
        this.enemyBullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            bullet.life -= dt;
            if (bullet.life <= 0 || this.isWall(bullet.x, bullet.y)) {
                bullet.destroy();
                return;
            }

            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
            if (dist < 20) {
                this.damagePlayer(15);
                bullet.destroy();
            }
        });

        // Update enemies
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            const ex = enemy.x;
            const ey = enemy.y;
            const dist = Phaser.Math.Distance.Between(ex, ey, this.player.x, this.player.y);

            // Move towards player
            if (dist < 300 && dist > 40) {
                const angle = Phaser.Math.Angle.Between(ex, ey, this.player.x, this.player.y);
                const moveSpeed = enemy.speed * dt;
                const newX = ex + Math.cos(angle) * moveSpeed;
                const newY = ey + Math.sin(angle) * moveSpeed;

                if (!this.isWall(newX, ey)) enemy.x = newX;
                if (!this.isWall(ex, newY)) enemy.y = newY;

                enemy.rotation = angle;
            }

            // Attack
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0 && dist < 300) {
                if (enemy.type === 'spitter') {
                    this.enemyShoot(enemy);
                } else if (dist < 50) {
                    this.damagePlayer(enemy.damage);
                }
                enemy.attackTimer = enemy.type === 'spitter' ? 2 : 1;
            }

            // Hit flash
            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
                enemy.tint = 0xFFFFFF;
            } else {
                enemy.clearTint();
            }
        });

        // Update pickups
        this.pickups.children.iterate(pickup => {
            if (!pickup || !pickup.active) return;

            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 32) {
                if (pickup.type === 'health' && this.player.health < this.player.maxHealth) {
                    this.player.health = Math.min(this.player.health + 25, this.player.maxHealth);
                    pickup.destroy();
                } else if (pickup.type === 'ammo' && this.player.ammo < this.player.maxAmmo) {
                    this.player.ammo = Math.min(this.player.ammo + 30, this.player.maxAmmo);
                    pickup.destroy();
                }
            }
        });

        // Update HUD
        this.updateHUD();

        // Win check
        if (this.enemies.getLength() === 0) {
            this.gameState = 'won';
            this.showWinText();
        }
    }

    shoot(angle) {
        const bullet = this.add.sprite(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'bullet'
        );
        bullet.rotation = angle;
        bullet.life = 0.8;

        this.physics.add.existing(bullet);
        bullet.body.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);

        this.bullets.add(bullet);
        this.player.ammo--;
        this.player.fireTimer = 0.25;

        // Screen shake
        this.cameras.main.shake(50, 0.002);
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bullet = this.add.sprite(enemy.x, enemy.y, 'acid');
        bullet.life = 1.5;

        this.physics.add.existing(bullet);
        bullet.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        this.enemyBullets.add(bullet);
    }

    hitEnemy(enemy, damage, angle) {
        enemy.health -= damage;
        enemy.hitFlash = 0.1;

        // Knockback
        if (enemy.type !== 'brute') {
            enemy.x += Math.cos(angle) * 20;
            enemy.y += Math.sin(angle) * 20;
        }

        // Blood particles
        this.particles.setPosition(enemy.x, enemy.y);
        this.particles.setParticleTint(COLORS.bloodAlien);
        this.particles.explode(5);

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        this.player.credits += enemy.credits;

        // More particles
        this.particles.setPosition(enemy.x, enemy.y);
        this.particles.setParticleTint(COLORS.bloodAlien);
        this.particles.explode(10);

        // Drop pickup
        if (Math.random() < 0.2) {
            const pickup = this.add.sprite(enemy.x, enemy.y,
                Math.random() < 0.5 ? 'health_pickup' : 'ammo_pickup');
            pickup.type = Math.random() < 0.5 ? 'health' : 'ammo';
            pickup.setDepth(3);
            this.pickups.add(pickup);
        }

        enemy.destroy();
    }

    damagePlayer(amount) {
        if (this.player.invulnTimer > 0) return;

        // Shield first
        if (this.player.shield > 0) {
            if (this.player.shield >= amount) {
                this.player.shield -= amount;
                amount = 0;
            } else {
                amount -= this.player.shield;
                this.player.shield = 0;
            }
        }

        this.player.health -= amount;
        this.player.invulnTimer = 0.5;

        this.cameras.main.shake(100, 0.005);

        if (this.player.health <= 0) {
            this.player.lives--;
            if (this.player.lives > 0) {
                this.player.health = this.player.maxHealth;
                this.player.x = this.spawnPoint.x;
                this.player.y = this.spawnPoint.y;
                this.player.invulnTimer = 2;
            } else {
                this.gameState = 'gameover';
                this.showGameOver();
            }
        }
    }

    isWall(x, y) {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
        return this.levelMap[ty][tx] !== 1;
    }

    updateHUD() {
        // Ammo
        const ammoRatio = this.player.ammo / this.player.maxAmmo;
        this.ammoFill.scaleX = ammoRatio;
        this.ammoText.setText(this.player.ammo.toString());

        // Health
        const healthRatio = this.player.health / this.player.maxHealth;
        this.healthFill.scaleX = healthRatio;

        // Credits
        this.hudCredits.setText('$' + this.player.credits);

        // Lives
        this.livesDisplay.children.iterate((life, idx) => {
            life.setVisible(idx < this.player.lives);
        });
    }

    showWinText() {
        const winText = this.add.text(400, 300, 'AREA CLEARED!', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#00FF00'
        });
        winText.setOrigin(0.5);
        winText.setScrollFactor(0);
        winText.setDepth(200);
    }

    showGameOver() {
        const gameOverText = this.add.text(400, 300, 'MISSION FAILED', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#FF4444'
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(200);
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);

// Expose for testing
window.startGame = () => {
    game.scene.start('GameScene');
};
