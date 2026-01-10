// Star of Providence Clone - Phaser 3 Version
const COLORS = {
    background: 0x0a0a15,
    floorDark: 0x2a1a0a,
    floorLight: 0x3a2810,
    wallDark: 0x483018,
    wallLight: 0x584020,
    uiGreen: 0x00ff88,
    uiRed: 0xff4444,
    player: 0x00ffaa,
    bulletPlayer: 0xffff00,
    bulletEnemy: 0xff4444,
    debris: 0xffcc00,
    ghost: 0x4488aa,
    drone: 0x888899,
    turret: 0xaa6644,
    heart: 0x00ff66
};

const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player ship
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(COLORS.player, 0.5);
        playerGfx.fillRect(12, 20, 8, 6);
        playerGfx.fillStyle(COLORS.player);
        playerGfx.beginPath();
        playerGfx.moveTo(16, 4);
        playerGfx.lineTo(8, 24);
        playerGfx.lineTo(16, 18);
        playerGfx.lineTo(24, 24);
        playerGfx.closePath();
        playerGfx.fillPath();
        playerGfx.fillStyle(0xffffff);
        playerGfx.fillRect(14, 10, 4, 4);
        playerGfx.generateTexture('player', 32, 32);

        // Player bullet
        const bulletGfx = this.make.graphics({ add: false });
        bulletGfx.fillStyle(COLORS.bulletPlayer);
        bulletGfx.fillRect(0, 2, 12, 4);
        bulletGfx.fillStyle(0xffffff);
        bulletGfx.fillRect(8, 3, 4, 2);
        bulletGfx.generateTexture('playerBullet', 12, 8);

        // Enemy bullet
        const enemyBulletGfx = this.make.graphics({ add: false });
        enemyBulletGfx.fillStyle(COLORS.bulletEnemy);
        enemyBulletGfx.fillCircle(6, 6, 6);
        enemyBulletGfx.fillStyle(0x800000);
        enemyBulletGfx.fillCircle(6, 6, 3);
        enemyBulletGfx.generateTexture('enemyBullet', 12, 12);

        // Ghost enemy
        const ghostGfx = this.make.graphics({ add: false });
        ghostGfx.fillStyle(COLORS.ghost);
        ghostGfx.fillCircle(16, 14, 14);
        ghostGfx.fillStyle(0x000000);
        ghostGfx.fillRect(10, 10, 4, 4);
        ghostGfx.fillRect(18, 10, 4, 4);
        ghostGfx.fillStyle(COLORS.ghost);
        for (let i = 0; i < 4; i++) {
            ghostGfx.fillRect(6 + i * 6, 24, 4, 6);
        }
        ghostGfx.generateTexture('ghost', 32, 32);

        // Drone enemy
        const droneGfx = this.make.graphics({ add: false });
        droneGfx.fillStyle(COLORS.drone);
        droneGfx.beginPath();
        droneGfx.moveTo(16, 4);
        droneGfx.lineTo(6, 24);
        droneGfx.lineTo(16, 18);
        droneGfx.lineTo(26, 24);
        droneGfx.closePath();
        droneGfx.fillPath();
        droneGfx.fillStyle(0xff0000);
        droneGfx.fillRect(14, 10, 4, 4);
        droneGfx.generateTexture('drone', 32, 32);

        // Turret enemy
        const turretGfx = this.make.graphics({ add: false });
        turretGfx.fillStyle(COLORS.turret);
        turretGfx.fillRect(4, 4, 28, 28);
        turretGfx.fillStyle(0x666666);
        turretGfx.fillRect(14, 0, 8, 12);
        turretGfx.fillStyle(0xff4400);
        turretGfx.fillCircle(18, 18, 8);
        turretGfx.generateTexture('turret', 36, 36);

        // Debris pickup
        const debrisGfx = this.make.graphics({ add: false });
        debrisGfx.fillStyle(COLORS.debris);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = 8 + Math.cos(angle) * 6;
            const y = 8 + Math.sin(angle) * 6;
            if (i === 0) debrisGfx.moveTo(x, y);
            else debrisGfx.lineTo(x, y);
        }
        debrisGfx.fillPath();
        debrisGfx.generateTexture('debris', 16, 16);

        // Health pickup (simple heart shape)
        const healthGfx = this.make.graphics({ add: false });
        healthGfx.fillStyle(COLORS.heart);
        // Left half
        healthGfx.fillCircle(5, 5, 4);
        // Right half
        healthGfx.fillCircle(11, 5, 4);
        // Bottom triangle
        healthGfx.beginPath();
        healthGfx.moveTo(1, 6);
        healthGfx.lineTo(8, 14);
        healthGfx.lineTo(15, 6);
        healthGfx.closePath();
        healthGfx.fillPath();
        healthGfx.generateTexture('health', 16, 16);

        // Floor tile
        const floorGfx = this.make.graphics({ add: false });
        floorGfx.fillStyle(COLORS.floorLight);
        floorGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        floorGfx.generateTexture('floorLight', TILE_SIZE, TILE_SIZE);

        const floorDarkGfx = this.make.graphics({ add: false });
        floorDarkGfx.fillStyle(COLORS.floorDark);
        floorDarkGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        floorDarkGfx.generateTexture('floorDark', TILE_SIZE, TILE_SIZE);

        // Wall tile
        const wallGfx = this.make.graphics({ add: false });
        wallGfx.fillStyle(COLORS.wallDark);
        wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        wallGfx.fillStyle(COLORS.wallLight);
        wallGfx.fillRect(2, 2, 12, 10);
        wallGfx.fillRect(18, 2, 12, 10);
        wallGfx.fillRect(8, 16, 16, 10);
        wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.gameState = {
            floor: 1,
            roomsCleared: 0,
            debris: 0,
            multiplier: 1.0
        };

        this.playerStats = {
            hp: 4,
            maxHp: 4,
            bombs: 2,
            maxBombs: 3,
            speed: 250,
            focusSpeed: 100,
            fireRate: 10,
            damage: 1
        };

        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.invincible = 0;
        this.isFocused = false;
        this.isDashing = false;
    }

    create() {
        // Room offset
        this.roomOffsetX = (800 - ROOM_WIDTH * TILE_SIZE) / 2;
        this.roomOffsetY = 80;

        // Background
        this.add.rectangle(400, 300, 800, 600, COLORS.background);

        // Create floor tiles
        this.floorTiles = this.add.group();
        this.wallTiles = this.add.group();
        this.generateRoom();

        // Create groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Create player
        this.player = this.physics.add.sprite(400, 400, 'player');
        this.player.setDepth(10);

        // Spawn enemies
        this.spawnEnemies();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            dash: 'Z',
            altDash: 'Q',
            focus: 'SHIFT',
            fire: 'SPACE'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.isShooting = true;
            if (pointer.rightButtonDown()) this.isFocused = true;
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) this.isShooting = false;
            if (!pointer.rightButtonDown()) this.isFocused = false;
        });

        // Dash input
        this.input.keyboard.on('keydown-Z', () => this.dash());
        this.input.keyboard.on('keydown-Q', () => this.dash());

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // HUD
        this.createHUD();

        // Expose for testing
        window.gameState = this.gameState;
        window.player = this.playerStats;
        window.enemies = this.enemies.getChildren();
    }

    generateRoom() {
        // Clear existing tiles
        this.floorTiles.clear(true, true);
        this.wallTiles.clear(true, true);

        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const tx = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const ty = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;

                // Walls on edges
                if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                    // Doors in center of walls
                    const isDoor = (y === 0 && x === 10) || (y === ROOM_HEIGHT - 1 && x === 10) ||
                                   (x === 0 && y === 7) || (x === ROOM_WIDTH - 1 && y === 7);
                    if (!isDoor) {
                        const wall = this.add.image(tx, ty, 'wall');
                        this.wallTiles.add(wall);
                    } else {
                        const floor = this.add.image(tx, ty, 'floorDark');
                        this.floorTiles.add(floor);
                    }
                } else {
                    // Checkered floor
                    const isLight = (x + y) % 2 === 0;
                    const floor = this.add.image(tx, ty, isLight ? 'floorLight' : 'floorDark');
                    this.floorTiles.add(floor);
                }
            }
        }

        // Add some pillars
        const pillarCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < pillarCount; i++) {
            const px = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
            const py = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
            const tx = this.roomOffsetX + px * TILE_SIZE + TILE_SIZE / 2;
            const ty = this.roomOffsetY + py * TILE_SIZE + TILE_SIZE / 2;
            const pillar = this.add.image(tx, ty, 'wall');
            this.wallTiles.add(pillar);
        }

        // Room border
        const border = this.add.graphics();
        border.lineStyle(2, COLORS.uiGreen, 0.5);
        border.strokeRect(this.roomOffsetX, this.roomOffsetY, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    }

    spawnEnemies() {
        this.enemies.clear(true, true);

        const count = 3 + this.gameState.floor + Math.floor(this.gameState.roomsCleared / 2);

        for (let i = 0; i < count; i++) {
            const types = ['ghost', 'drone', 'turret'];
            const rand = Math.random();
            let type = 'ghost';
            if (rand > 0.5) type = 'drone';
            if (rand > 0.8) type = 'turret';

            let x, y;
            let valid = false;
            while (!valid) {
                x = this.roomOffsetX + 80 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 160);
                y = this.roomOffsetY + 80 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 160);
                if (Phaser.Math.Distance.Between(x, y, this.player?.x || 400, this.player?.y || 400) > 150) {
                    valid = true;
                }
            }

            this.createEnemy(type, x, y);
        }

        window.enemies = this.enemies.getChildren();
    }

    createEnemy(type, x, y) {
        const configs = {
            ghost: { hp: 3, speed: 80, fireRate: 2000, debris: 10 },
            drone: { hp: 5, speed: 120, fireRate: 1500, debris: 30 },
            turret: { hp: 8, speed: 0, fireRate: 1000, debris: 25 }
        };
        const cfg = configs[type];

        const enemy = this.enemies.create(x, y, type);
        enemy.setDepth(8);
        enemy.enemyType = type;
        enemy.hp = cfg.hp;
        enemy.maxHp = cfg.hp;
        enemy.speed = cfg.speed;
        enemy.fireRate = cfg.fireRate;
        enemy.debris = cfg.debris;
        enemy.lastFire = Math.random() * 1000;
        enemy.hitFlash = 0;

        if (type === 'drone') {
            enemy.setVelocity(
                (Math.random() - 0.5) * cfg.speed * 2,
                (Math.random() - 0.5) * cfg.speed * 2
            );
        }

        return enemy;
    }

    dash() {
        if (this.dashCooldown > 0 || this.isDashing) return;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        this.isDashing = true;
        this.invincible = 0.15;

        const dashDist = 120;
        const targetX = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * dashDist,
            this.roomOffsetX + 20,
            this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 20
        );
        const targetY = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * dashDist,
            this.roomOffsetY + 20,
            this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 20
        );

        // Dash particles
        for (let i = 0; i < 6; i++) {
            const particle = this.add.rectangle(
                this.player.x, this.player.y, 4, 4, COLORS.player
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x + (Math.random() - 0.5) * 50,
                y: particle.y + (Math.random() - 0.5) * 50,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.isDashing = false;
                this.dashCooldown = 0.5;
            }
        });
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(100);

        // Weapon panel (left)
        const weaponPanel = this.add.graphics();
        weaponPanel.lineStyle(2, COLORS.uiGreen);
        weaponPanel.strokeRect(this.roomOffsetX, 15, 120, 50);
        weaponPanel.fillStyle(COLORS.background);
        weaponPanel.fillRect(this.roomOffsetX + 2, 17, 116, 46);
        this.hudContainer.add(weaponPanel);

        // Weapon icon
        const weaponIcon = this.add.graphics();
        weaponIcon.fillStyle(COLORS.uiGreen);
        weaponIcon.fillRect(this.roomOffsetX + 10, 25, 30, 20);
        weaponIcon.fillStyle(0x000000);
        weaponIcon.fillRect(this.roomOffsetX + 12, 27, 26, 16);
        weaponIcon.fillStyle(COLORS.bulletPlayer);
        weaponIcon.fillRect(this.roomOffsetX + 15, 32, 20, 6);
        this.hudContainer.add(weaponIcon);

        // Ammo text
        this.ammoText = this.add.text(this.roomOffsetX + 50, 30, '∞', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff88'
        });
        this.hudContainer.add(this.ammoText);

        // Bombs
        this.bombIndicators = [];
        for (let i = 0; i < 3; i++) {
            const bomb = this.add.rectangle(
                this.roomOffsetX + 14 + i * 12, 56, 8, 8, 0xff8800
            );
            this.bombIndicators.push(bomb);
            this.hudContainer.add(bomb);
        }

        // Hearts
        this.hearts = [];
        const hpStartX = 330;
        for (let i = 0; i < 4; i++) {
            const heart = this.add.graphics();
            this.drawHeart(heart, hpStartX + i * 24, 30, true);
            this.hearts.push(heart);
            this.hudContainer.add(heart);
        }

        // Multiplier panel (right)
        const rightX = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 120;
        const multPanel = this.add.graphics();
        multPanel.lineStyle(2, COLORS.uiGreen);
        multPanel.strokeRect(rightX, 15, 120, 50);
        multPanel.fillStyle(COLORS.background);
        multPanel.fillRect(rightX + 2, 17, 116, 46);
        this.hudContainer.add(multPanel);

        this.multiplierText = this.add.text(rightX + 110, 28, 'x1.0', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setOrigin(1, 0);
        this.hudContainer.add(this.multiplierText);

        this.debrisText = this.add.text(rightX + 110, 48, '0G', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffcc00'
        }).setOrigin(1, 0);
        this.hudContainer.add(this.debrisText);

        // Floor info
        this.floorText = this.add.text(400, 580, 'FLOOR 1 - ROOM 1', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setOrigin(0.5);
        this.hudContainer.add(this.floorText);

        this.enemyCountText = this.add.text(780, 580, 'ENEMIES: 0', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff88'
        }).setOrigin(1, 0.5);
        this.hudContainer.add(this.enemyCountText);
    }

    drawHeart(graphics, x, y, filled) {
        graphics.clear();
        if (filled) {
            graphics.fillStyle(COLORS.heart);
            // Left circle
            graphics.fillCircle(x - 5, y - 4, 6);
            // Right circle
            graphics.fillCircle(x + 5, y - 4, 6);
            // Bottom triangle
            graphics.beginPath();
            graphics.moveTo(x - 10, y - 2);
            graphics.lineTo(x, y + 10);
            graphics.lineTo(x + 10, y - 2);
            graphics.closePath();
            graphics.fillPath();
        } else {
            graphics.lineStyle(2, 0x00aa55);
            // Left circle outline
            graphics.strokeCircle(x - 5, y - 4, 6);
            // Right circle outline
            graphics.strokeCircle(x + 5, y - 4, 6);
            // Bottom triangle outline
            graphics.beginPath();
            graphics.moveTo(x - 10, y - 2);
            graphics.lineTo(x, y + 10);
            graphics.lineTo(x + 10, y - 2);
            graphics.closePath();
            graphics.strokePath();
        }
    }

    updateHUD() {
        // Hearts
        for (let i = 0; i < this.hearts.length; i++) {
            this.drawHeart(this.hearts[i], 330 + i * 24, 30, i < this.playerStats.hp);
        }

        // Bombs
        for (let i = 0; i < this.bombIndicators.length; i++) {
            this.bombIndicators[i].setFillStyle(
                i < this.playerStats.bombs ? 0xff8800 : 0x333333
            );
        }

        // Multiplier and debris
        this.multiplierText.setText(`x${this.gameState.multiplier.toFixed(1)}`);
        this.debrisText.setText(`${this.gameState.debris}G`);

        // Floor info
        this.floorText.setText(`FLOOR ${this.gameState.floor} - ROOM ${this.gameState.roomsCleared + 1}`);
        this.enemyCountText.setText(`ENEMIES: ${this.enemies.countActive()}`);
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Update cooldowns
        this.fireCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        // Player movement
        if (!this.isDashing) {
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown) vx -= 1;
            if (this.cursors.right.isDown) vx += 1;
            if (this.cursors.up.isDown) vy -= 1;
            if (this.cursors.down.isDown) vy += 1;

            if (vx && vy) {
                vx *= 0.707;
                vy *= 0.707;
            }

            this.isFocused = this.cursors.focus.isDown || this.input.activePointer.rightButtonDown();
            const speed = this.isFocused ? this.playerStats.focusSpeed : this.playerStats.speed;

            this.player.setVelocity(vx * speed, vy * speed);

            // Bounds
            this.player.x = Phaser.Math.Clamp(
                this.player.x,
                this.roomOffsetX + 20,
                this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 20
            );
            this.player.y = Phaser.Math.Clamp(
                this.player.y,
                this.roomOffsetY + 20,
                this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 20
            );
        }

        // Player aim
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.player.rotation = angle + Math.PI / 2;

        // Shooting
        if ((this.isShooting || this.cursors.fire.isDown) && this.fireCooldown <= 0) {
            this.firePlayerBullet(angle);
            this.fireCooldown = 1 / this.playerStats.fireRate;
        }

        // Invincibility flash
        if (this.invincible > 0) {
            this.player.alpha = Math.floor(this.invincible * 20) % 2 === 0 ? 0.3 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => this.updateEnemy(enemy, time, dt));

        // Update pickups (magnet)
        this.pickups.getChildren().forEach(pickup => {
            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 80) {
                const angle = Phaser.Math.Angle.Between(pickup.x, pickup.y, this.player.x, this.player.y);
                const pull = (80 - dist) / 80 * 200;
                pickup.x += Math.cos(angle) * pull * dt;
                pickup.y += Math.sin(angle) * pull * dt;
            }
        });

        // Update HUD
        this.updateHUD();

        // Check room clear
        if (this.enemies.countActive() === 0 && !this.roomClearing) {
            this.roomCleared();
        }
    }

    firePlayerBullet(angle) {
        const spread = this.isFocused ? 0 : 0.05;
        const bulletAngle = angle + (Math.random() - 0.5) * spread;

        const bullet = this.playerBullets.create(
            this.player.x + Math.cos(bulletAngle) * 15,
            this.player.y + Math.sin(bulletAngle) * 15,
            'playerBullet'
        );
        bullet.rotation = bulletAngle;
        bullet.setVelocity(Math.cos(bulletAngle) * 600, Math.sin(bulletAngle) * 600);
        bullet.damage = this.playerStats.damage;

        // Auto destroy after leaving room
        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateEnemy(enemy, time, dt) {
        if (!enemy.active) return;

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Movement AI
        if (enemy.enemyType === 'ghost') {
            if (dist > 50) {
                enemy.setVelocity(
                    Math.cos(angle) * enemy.speed,
                    Math.sin(angle) * enemy.speed
                );
            } else {
                enemy.setVelocity(0, 0);
            }
        } else if (enemy.enemyType === 'drone') {
            if (dist > 200) {
                enemy.setVelocity(
                    Math.cos(angle) * enemy.speed,
                    Math.sin(angle) * enemy.speed
                );
            }
            // Bounce off walls
            const minX = this.roomOffsetX + 30;
            const maxX = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 30;
            const minY = this.roomOffsetY + 30;
            const maxY = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 30;

            if (enemy.x < minX || enemy.x > maxX) enemy.body.velocity.x *= -1;
            if (enemy.y < minY || enemy.y > maxY) enemy.body.velocity.y *= -1;
        }
        // Turrets don't move

        // Keep in bounds
        enemy.x = Phaser.Math.Clamp(
            enemy.x,
            this.roomOffsetX + 30,
            this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 30
        );
        enemy.y = Phaser.Math.Clamp(
            enemy.y,
            this.roomOffsetY + 30,
            this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 30
        );

        // Firing
        enemy.lastFire -= dt * 1000;
        if (enemy.lastFire <= 0 && dist < 500) {
            this.fireEnemyBullet(enemy, angle);
            enemy.lastFire = enemy.fireRate;
        }
    }

    fireEnemyBullet(enemy, angle) {
        const speed = 150;

        if (enemy.enemyType === 'turret') {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else if (enemy.enemyType === 'drone') {
            for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.3;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else {
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    hitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Hit particles
        for (let i = 0; i < 4; i++) {
            const particle = this.add.rectangle(bullet.x, bullet.y, 3, 3, COLORS.bulletPlayer);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: bullet.x + (Math.random() - 0.5) * 50,
                y: bullet.y + (Math.random() - 0.5) * 50,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        bullet.destroy();

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Death particles
        for (let i = 0; i < 10; i++) {
            const particle = this.add.rectangle(enemy.x, enemy.y, 5, 5, enemy.tintTopLeft || COLORS.ghost);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                x: enemy.x + (Math.random() - 0.5) * 100,
                y: enemy.y + (Math.random() - 0.5) * 100,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        // Drop debris
        const pickup = this.pickups.create(enemy.x, enemy.y, 'debris');
        pickup.pickupType = 'debris';
        pickup.value = Math.floor(enemy.debris * this.gameState.multiplier);

        // Increase multiplier
        this.gameState.multiplier = Math.min(3.0, this.gameState.multiplier + 0.05);

        enemy.destroy();
        window.enemies = this.enemies.getChildren();
    }

    playerHit(player, bullet) {
        if (this.invincible > 0) return;

        this.playerStats.hp--;
        this.invincible = 1.0;
        this.gameState.multiplier = Math.max(1.0, this.gameState.multiplier - 1.0);
        bullet.destroy();

        // Hit particles
        for (let i = 0; i < 8; i++) {
            const particle = this.add.rectangle(player.x, player.y, 4, 4, COLORS.uiRed);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: player.x + (Math.random() - 0.5) * 80,
                y: player.y + (Math.random() - 0.5) * 80,
                duration: 250,
                onComplete: () => particle.destroy()
            });
        }

        if (this.playerStats.hp <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'debris') {
            this.gameState.debris += pickup.value;
        } else if (pickup.pickupType === 'health') {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 1);
        }
        pickup.destroy();
    }

    roomCleared() {
        this.roomClearing = true;
        this.gameState.roomsCleared++;

        // Health drop chance
        if (Math.random() < 0.2 && this.playerStats.hp < this.playerStats.maxHp) {
            const pickup = this.pickups.create(400, 300, 'health');
            pickup.pickupType = 'health';
            pickup.value = 1;
        }

        this.time.delayedCall(1500, () => {
            this.roomClearing = false;
            this.generateRoom();
            this.spawnEnemies();
            this.player.x = 400;
            this.player.y = 400;
        });
    }

    gameOver() {
        // Overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);

        const gameOverText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '40px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ff4444'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(400, 320,
            `DEBRIS: ${this.gameState.debris}G\nROOMS CLEARED: ${this.gameState.roomsCleared}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ff88',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 400, 'Press SPACE to restart', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a15',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
