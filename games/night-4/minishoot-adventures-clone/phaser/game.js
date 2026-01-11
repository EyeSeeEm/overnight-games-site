// Minishoot Adventures Clone - Phaser 3
// Twin-stick shooter adventure with Zelda-style exploration

// Game configuration
const CONFIG = {
    WORLD_SIZE: 2400,
    TILE_SIZE: 32,
    PLAYER: {
        SPEED: 200,
        MAX_HEALTH: 3,
        MAX_ENERGY: 4,
        FIRE_RATE: 3,
        DAMAGE: 1,
        RANGE: 300,
        BULLET_SPEED: 500,
        ENERGY_REGEN: 0.5
    },
    ENEMIES: {
        scout: {
            name: 'Scout',
            hp: 2,
            damage: 1,
            speed: 100,
            fireRate: 1.0,
            bulletSpeed: 150,
            behavior: 'chase',
            bulletPattern: 'single',
            xp: 1,
            color: 0xff6666,
            size: 14
        },
        grasshopper: {
            name: 'Grasshopper',
            hp: 3,
            damage: 1,
            speed: 150,
            fireRate: 0.8,
            bulletSpeed: 180,
            behavior: 'hop',
            bulletPattern: 'burst3',
            xp: 2,
            color: 0x66ff66,
            size: 16
        },
        turret: {
            name: 'Turret',
            hp: 5,
            damage: 1,
            speed: 0,
            fireRate: 0.5,
            bulletSpeed: 120,
            behavior: 'stationary',
            bulletPattern: 'spray8',
            xp: 3,
            color: 0x888888,
            size: 18
        },
        heavy: {
            name: 'Heavy',
            hp: 10,
            damage: 2,
            speed: 60,
            fireRate: 0.4,
            bulletSpeed: 140,
            behavior: 'advance',
            bulletPattern: 'spread5',
            xp: 5,
            color: 0x9966ff,
            size: 22
        },
        burrower: {
            name: 'Burrower',
            hp: 6,
            damage: 1,
            speed: 120,
            fireRate: 0.6,
            bulletSpeed: 100,
            behavior: 'emerge',
            bulletPattern: 'homing',
            xp: 4,
            color: 0xcc9933,
            size: 16
        },
        treeMimic: {
            name: 'Tree Mimic',
            hp: 4,
            damage: 1,
            speed: 80,
            fireRate: 0.8,
            bulletSpeed: 160,
            behavior: 'ambush',
            bulletPattern: 'burst3',
            xp: 3,
            color: 0x44aa44,
            size: 20,
            activationRange: 150
        },
        eliteScout: {
            name: 'Elite Scout',
            hp: 8,
            damage: 2,
            speed: 120,
            fireRate: 1.2,
            bulletSpeed: 180,
            behavior: 'chase',
            bulletPattern: 'burst3',
            xp: 5,
            color: 0x9933ff,
            size: 16,
            isElite: true
        }
    },
    XP_PER_LEVEL: 10,
    XP_INCREASE: 2
};

// Boot scene for loading
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width/2, height * 0.25, 'MINISHOOT', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#4fc3f7',
            stroke: '#0288d1',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.35, 'ADVENTURES', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#81d4fa'
        }).setOrigin(0.5);

        // Cute ship preview
        this.drawShipPreview(width/2, height * 0.5);

        // Start button
        const startText = this.add.text(width/2, height * 0.7, 'CLICK TO START', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Pulsing effect
        this.tweens.add({
            targets: startText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls hint
        this.add.text(width/2, height * 0.82, 'WASD: Move | Mouse: Aim | Click: Shoot | Space: Dash', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.88, 'Right-Click: Supershot | ESC: Pause | 1-5: Allocate Skills', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }

    drawShipPreview(x, y) {
        const g = this.add.graphics();

        // Glow
        g.fillStyle(0x4fc3f7, 0.2);
        g.fillCircle(x, y, 40);

        // Ship body (cute rounded)
        g.fillStyle(0x4fc3f7);
        g.fillRoundedRect(x - 20, y - 15, 40, 30, 10);

        // Cockpit
        g.fillStyle(0x81d4fa);
        g.fillCircle(x + 5, y, 8);

        // Eyes
        g.fillStyle(0xffffff);
        g.fillCircle(x + 3, y - 2, 4);
        g.fillCircle(x + 8, y - 2, 4);

        g.fillStyle(0x000000);
        g.fillCircle(x + 4, y - 1, 2);
        g.fillCircle(x + 9, y - 1, 2);

        // Animated floating
        this.tweens.add({
            targets: g,
            y: 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

// Main game scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Camera and world setup
        this.physics.world.setBounds(0, 0, CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
        this.cameras.main.setBounds(0, 0, CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);

        // Game state
        this.gameState = 'playing';
        this.score = 0;
        this.kills = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = CONFIG.XP_PER_LEVEL;
        this.skillPoints = 0;
        this.allocatedSkills = { damage: 0, fireRate: 0, range: 0, speed: 0, critical: 0 };
        this.abilities = { dash: true, supershot: true, surf: false, timeStop: false };
        this.heartPieces = 0;
        this.energyBatteries = 0;
        this.isPaused = false;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.crystals = [];
        this.iframes = 0;
        this.screenShake = 0;

        // Create world
        this.createWorld();

        // Create player
        this.createPlayer();

        // Create groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.particles = [];
        this.floatingTexts = [];

        // Spawn initial enemies
        this.spawnWave();

        // Setup camera
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Setup controls
        this.setupControls();

        // Create HUD
        this.createHUD();

        // Collisions
        this.setupCollisions();

        // Wave timer
        this.waveTimer = 0;
        this.wave = 1;
        this.enemiesPerWave = 5;
    }

    createWorld() {
        // Initialize obstacles array first
        this.obstacles = [];

        // Background gradient
        const bg = this.add.graphics();

        // Soft blue-green forest ground
        for (let x = 0; x < CONFIG.WORLD_SIZE; x += 100) {
            for (let y = 0; y < CONFIG.WORLD_SIZE; y += 100) {
                const shade = 0.8 + Math.random() * 0.2;
                const r = Math.floor(40 * shade);
                const g = Math.floor(80 * shade);
                const b = Math.floor(60 * shade);
                bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
                bg.fillRect(x, y, 100, 100);
            }
        }

        // Soft grass patches
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * CONFIG.WORLD_SIZE;
            const y = Math.random() * CONFIG.WORLD_SIZE;
            const radius = 20 + Math.random() * 40;
            bg.fillStyle(0x3d6b4f, 0.4);
            bg.fillCircle(x, y, radius);
        }

        // Decorative trees
        this.createTrees();

        // Paths
        this.createPaths();

        // Rocks and obstacles
        this.createObstacles();
    }

    createTrees() {
        const treeGraphics = this.add.graphics();

        for (let i = 0; i < 80; i++) {
            const x = Math.random() * CONFIG.WORLD_SIZE;
            const y = Math.random() * CONFIG.WORLD_SIZE;

            // Keep away from center spawn area
            if (Math.abs(x - CONFIG.WORLD_SIZE/2) < 200 && Math.abs(y - CONFIG.WORLD_SIZE/2) < 200) continue;

            const size = 15 + Math.random() * 20;

            // Tree shadow
            treeGraphics.fillStyle(0x1a3020, 0.5);
            treeGraphics.fillEllipse(x + 5, y + size, size * 1.2, size * 0.5);

            // Tree foliage (soft rounded)
            const green = Phaser.Display.Color.GetColor(
                50 + Math.random() * 30,
                100 + Math.random() * 50,
                60 + Math.random() * 30
            );
            treeGraphics.fillStyle(green);
            treeGraphics.fillCircle(x, y, size);
            treeGraphics.fillCircle(x - size * 0.4, y + size * 0.3, size * 0.7);
            treeGraphics.fillCircle(x + size * 0.4, y + size * 0.3, size * 0.7);

            // Highlight
            treeGraphics.fillStyle(0xffffff, 0.15);
            treeGraphics.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.4);

            // Store as obstacle
            this.obstacles.push({ x, y, radius: size * 0.8 });
        }
    }

    createPaths() {
        const pathGraphics = this.add.graphics();
        pathGraphics.fillStyle(0x6d5d4d, 0.6);

        // Main cross paths
        pathGraphics.fillRect(CONFIG.WORLD_SIZE/2 - 40, 0, 80, CONFIG.WORLD_SIZE);
        pathGraphics.fillRect(0, CONFIG.WORLD_SIZE/2 - 40, CONFIG.WORLD_SIZE, 80);

        // Path texture
        pathGraphics.fillStyle(0x5a4d3d, 0.3);
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * CONFIG.WORLD_SIZE;
            const y = Math.random() * CONFIG.WORLD_SIZE;
            if (Math.abs(x - CONFIG.WORLD_SIZE/2) < 40 || Math.abs(y - CONFIG.WORLD_SIZE/2) < 40) {
                pathGraphics.fillCircle(x, y, 2 + Math.random() * 3);
            }
        }
    }

    createObstacles() {
        const obstacleGraphics = this.add.graphics();

        for (let i = 0; i < 30; i++) {
            const x = Math.random() * CONFIG.WORLD_SIZE;
            const y = Math.random() * CONFIG.WORLD_SIZE;

            // Keep away from center
            if (Math.abs(x - CONFIG.WORLD_SIZE/2) < 250 && Math.abs(y - CONFIG.WORLD_SIZE/2) < 250) continue;

            const size = 20 + Math.random() * 30;

            // Rock shadow
            obstacleGraphics.fillStyle(0x222222, 0.4);
            obstacleGraphics.fillEllipse(x + 4, y + 4, size * 1.1, size * 0.6);

            // Rock body
            obstacleGraphics.fillStyle(0x555555);
            obstacleGraphics.fillCircle(x, y, size * 0.8);
            obstacleGraphics.fillStyle(0x666666);
            obstacleGraphics.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.5);

            // Highlight
            obstacleGraphics.fillStyle(0xffffff, 0.2);
            obstacleGraphics.fillCircle(x - size * 0.3, y - size * 0.3, size * 0.2);

            this.obstacles.push({ x, y, radius: size * 0.8 });
        }
    }

    createPlayer() {
        const startX = CONFIG.WORLD_SIZE / 2;
        const startY = CONFIG.WORLD_SIZE / 2;

        this.player = {
            x: startX,
            y: startY,
            vx: 0,
            vy: 0,
            angle: 0,
            health: CONFIG.PLAYER.MAX_HEALTH,
            maxHealth: CONFIG.PLAYER.MAX_HEALTH,
            energy: CONFIG.PLAYER.MAX_ENERGY,
            maxEnergy: CONFIG.PLAYER.MAX_ENERGY,
            speed: CONFIG.PLAYER.SPEED,
            fireRate: CONFIG.PLAYER.FIRE_RATE,
            damage: CONFIG.PLAYER.DAMAGE,
            range: CONFIG.PLAYER.RANGE,
            bulletSpeed: CONFIG.PLAYER.BULLET_SPEED,
            lastFire: 0,
            dashCooldown: 0,
            isDashing: false,
            dashTime: 0,
            dashVx: 0,
            dashVy: 0
        };
    }

    setupControls() {
        this.keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D'),
            space: this.input.keyboard.addKey('SPACE'),
            shift: this.input.keyboard.addKey('SHIFT'),
            r: this.input.keyboard.addKey('R')
        };

        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isRightMouseDown = false;

        this.input.on('pointermove', (pointer) => {
            this.mousePos.x = pointer.worldX;
            this.mousePos.y = pointer.worldY;
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.isRightMouseDown = true;
            } else {
                this.isMouseDown = true;
            }
        });

        this.input.on('pointerup', (pointer) => {
            this.isMouseDown = false;
            this.isRightMouseDown = false;
        });

        // Prevent context menu on right click
        this.input.mouse.disableContextMenu();
    }

    createHUD() {
        this.hudGraphics = this.add.graphics();
        this.hudGraphics.setScrollFactor(0);
        this.hudGraphics.setDepth(100);

        // HUD text elements
        this.hudTexts = {
            health: this.add.text(10, 10, '', { fontSize: '16px', color: '#ffffff' }).setScrollFactor(0).setDepth(100),
            energy: this.add.text(10, 35, '', { fontSize: '16px', color: '#ffffff' }).setScrollFactor(0).setDepth(100),
            level: this.add.text(10, 60, '', { fontSize: '16px', color: '#ffff00' }).setScrollFactor(0).setDepth(100),
            xp: this.add.text(10, 85, '', { fontSize: '14px', color: '#ff9999' }).setScrollFactor(0).setDepth(100),
            score: this.add.text(700, 10, '', { fontSize: '16px', color: '#ffffff' }).setScrollFactor(0).setDepth(100),
            wave: this.add.text(700, 35, '', { fontSize: '16px', color: '#88ff88' }).setScrollFactor(0).setDepth(100),
            enemies: this.add.text(700, 60, '', { fontSize: '14px', color: '#ff8888' }).setScrollFactor(0).setDepth(100),
            skills: this.add.text(10, 560, '', { fontSize: '12px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(100),
            dash: this.add.text(400, 560, '', { fontSize: '14px', color: '#88ffff' }).setScrollFactor(0).setDepth(100)
        };
    }

    setupCollisions() {
        // Player bullets hit enemies
        this.physics.add.overlap(this.playerBullets, this.enemies, (bullet, enemy) => {
            this.hitEnemy(bullet, enemy);
        });

        // Enemy bullets hit player handled in update

        // Player collects pickups
        this.physics.add.overlap(this.pickups, null, (pickup) => {
            const dx = this.player.x - pickup.x;
            const dy = this.player.y - pickup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                this.collectPickup(pickup);
            }
        });
    }

    update(time, delta) {
        // Handle pause toggle
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ESC'))) {
            this.isPaused = !this.isPaused;
        }

        if (this.gameState !== 'playing' || this.isPaused) {
            if (this.isPaused) {
                this.drawPauseOverlay();
            }
            return;
        }

        const dt = delta / 1000;

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Update iframes
        if (this.iframes > 0) this.iframes -= dt;

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + (Math.random() - 0.5) * this.screenShake,
                this.cameras.main.scrollY + (Math.random() - 0.5) * this.screenShake
            );
        }

        // Update player
        this.updatePlayer(dt, time);

        // Update enemies
        this.updateEnemies(dt, time);

        // Update bullets
        this.updateBullets(dt);

        // Update pickups
        this.updatePickups(dt);

        // Update particles
        this.updateParticles(dt);

        // Update floating texts
        this.updateFloatingTexts(dt);

        // Wave spawning
        this.waveTimer += dt;
        if (this.enemies.countActive() === 0 && this.waveTimer > 3) {
            this.wave++;
            this.enemiesPerWave = Math.min(5 + this.wave * 2, 25);
            this.spawnWave();
            this.waveTimer = 0;
        }

        // Draw everything
        this.draw();

        // Update HUD
        this.updateHUD();

        // Regenerate energy
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + CONFIG.PLAYER.ENERGY_REGEN * dt);
    }

    updatePlayer(dt, time) {
        const p = this.player;

        // Calculate effective stats with skill bonuses
        const effectiveSpeed = p.speed + this.allocatedSkills.speed * 20;
        const effectiveFireRate = p.fireRate + this.allocatedSkills.fireRate * 0.5;
        const effectiveDamage = p.damage + this.allocatedSkills.damage * 0.5;
        const effectiveRange = p.range + this.allocatedSkills.range * 30;

        // Dash cooldown
        if (p.dashCooldown > 0) p.dashCooldown -= dt;

        // Handle dash
        if (p.isDashing) {
            p.dashTime -= dt;
            p.x += p.dashVx * dt;
            p.y += p.dashVy * dt;
            if (p.dashTime <= 0) {
                p.isDashing = false;
            }
        } else {
            // Normal movement
            let moveX = 0, moveY = 0;
            if (this.keys.w.isDown) moveY = -1;
            if (this.keys.s.isDown) moveY = 1;
            if (this.keys.a.isDown) moveX = -1;
            if (this.keys.d.isDown) moveX = 1;

            // Normalize diagonal
            if (moveX !== 0 && moveY !== 0) {
                const len = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX /= len;
                moveY /= len;
            }

            p.vx = moveX * effectiveSpeed;
            p.vy = moveY * effectiveSpeed;

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Dash input
            if (Phaser.Input.Keyboard.JustDown(this.keys.space) && p.dashCooldown <= 0 && this.abilities.dash) {
                const dashDist = 150;
                const dashDuration = 0.15;
                const angle = Math.atan2(this.mousePos.y - p.y, this.mousePos.x - p.x);
                p.dashVx = Math.cos(angle) * dashDist / dashDuration;
                p.dashVy = Math.sin(angle) * dashDist / dashDuration;
                p.isDashing = true;
                p.dashTime = dashDuration;
                p.dashCooldown = 0.5;
                this.createParticles(p.x, p.y, 10, 0x88ffff, 100);
            }
        }

        // Clamp to world bounds
        p.x = Phaser.Math.Clamp(p.x, 20, CONFIG.WORLD_SIZE - 20);
        p.y = Phaser.Math.Clamp(p.y, 20, CONFIG.WORLD_SIZE - 20);

        // Check obstacle collisions
        for (const obs of this.obstacles) {
            const dx = p.x - obs.x;
            const dy = p.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = obs.radius + 15;
            if (dist < minDist && dist > 0) {
                p.x = obs.x + (dx / dist) * minDist;
                p.y = obs.y + (dy / dist) * minDist;
            }
        }

        // Aim toward mouse
        p.angle = Math.atan2(this.mousePos.y - p.y, this.mousePos.x - p.x);

        // Shooting
        const fireInterval = 1000 / effectiveFireRate;
        if (this.isMouseDown && time - p.lastFire > fireInterval) {
            this.firePlayerBullet(effectiveDamage, effectiveRange, false);
            p.lastFire = time;
        }

        // Supershot (right click) - costs 1 energy, 3x damage
        if (this.isRightMouseDown && this.abilities.supershot && p.energy >= 1 && time - p.lastFire > fireInterval * 2) {
            this.firePlayerBullet(effectiveDamage * 3, effectiveRange * 1.5, true);
            p.energy -= 1;
            p.lastFire = time;
            this.screenShake = 5;
        }
    }

    firePlayerBullet(damage, range, isSupershot = false) {
        const p = this.player;
        const bullet = this.playerBullets.create(p.x, p.y, null);
        const size = isSupershot ? 10 : 6;
        bullet.setCircle(size);

        const speed = isSupershot ? p.bulletSpeed * 1.3 : p.bulletSpeed;
        bullet.body.setVelocity(
            Math.cos(p.angle) * speed,
            Math.sin(p.angle) * speed
        );

        bullet.damage = damage;
        bullet.range = range;
        bullet.startX = p.x;
        bullet.startY = p.y;
        bullet.angle = p.angle;
        bullet.color = isSupershot ? 0x00aaff : 0xffff00;
        bullet.size = size;
        bullet.isSupershot = isSupershot;

        // Supershot creates trail particles
        if (isSupershot) {
            this.createParticles(p.x, p.y, 5, 0x00aaff, 80);
        }
    }

    updateEnemies(dt, time) {
        const p = this.player;

        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            const config = CONFIG.ENEMIES[enemy.enemyType];
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Behavior
            switch (config.behavior) {
                case 'chase':
                    if (dist > 150) {
                        enemy.body.setVelocity(
                            Math.cos(angle) * config.speed,
                            Math.sin(angle) * config.speed
                        );
                    } else {
                        enemy.body.setVelocity(0, 0);
                    }
                    break;

                case 'hop':
                    if (!enemy.hopTimer) enemy.hopTimer = 0;
                    enemy.hopTimer += dt;
                    if (enemy.hopTimer > 1.5) {
                        enemy.hopTimer = 0;
                        const hopDist = 100;
                        enemy.body.setVelocity(
                            Math.cos(angle) * hopDist * 3,
                            Math.sin(angle) * hopDist * 3
                        );
                        this.time.delayedCall(200, () => {
                            if (enemy.active) enemy.body.setVelocity(0, 0);
                        });
                    }
                    break;

                case 'stationary':
                    enemy.body.setVelocity(0, 0);
                    if (!enemy.rotation) enemy.rotation = 0;
                    enemy.rotation += dt * 0.5;
                    break;

                case 'advance':
                    enemy.body.setVelocity(
                        Math.cos(angle) * config.speed,
                        Math.sin(angle) * config.speed
                    );
                    break;

                case 'emerge':
                    if (!enemy.emergeTimer) enemy.emergeTimer = 0;
                    if (!enemy.isUnderground) enemy.isUnderground = true;
                    enemy.emergeTimer += dt;
                    if (enemy.isUnderground) {
                        // Move toward player underground
                        enemy.x += Math.cos(angle) * 200 * dt;
                        enemy.y += Math.sin(angle) * 200 * dt;
                        if (enemy.emergeTimer > 2) {
                            enemy.isUnderground = false;
                            enemy.emergeTimer = 0;
                            this.createParticles(enemy.x, enemy.y, 15, 0xcc9933, 150);
                        }
                    } else {
                        if (enemy.emergeTimer > 3) {
                            enemy.isUnderground = true;
                            enemy.emergeTimer = 0;
                        }
                    }
                    break;

                case 'ambush':
                    // Tree mimic - stays disguised until player is close
                    if (enemy.isDisguised === undefined) enemy.isDisguised = true;
                    if (enemy.isDisguised) {
                        // Stay still, look like a tree
                        enemy.body.setVelocity(0, 0);
                        if (dist < config.activationRange) {
                            enemy.isDisguised = false;
                            this.createParticles(enemy.x, enemy.y, 20, 0x44aa44, 120);
                            this.addFloatingText(enemy.x, enemy.y - 20, '!', '#ff0000');
                        }
                    } else {
                        // Aggressive chase after activation
                        enemy.body.setVelocity(
                            Math.cos(angle) * config.speed * 1.5,
                            Math.sin(angle) * config.speed * 1.5
                        );
                    }
                    break;
            }

            // Clamp to world
            enemy.x = Phaser.Math.Clamp(enemy.x, 50, CONFIG.WORLD_SIZE - 50);
            enemy.y = Phaser.Math.Clamp(enemy.y, 50, CONFIG.WORLD_SIZE - 50);

            // Shooting
            if (!enemy.lastFire) enemy.lastFire = 0;
            const fireInterval = 1000 / config.fireRate;
            if (time - enemy.lastFire > fireInterval && dist < 400) {
                if (config.behavior !== 'emerge' || !enemy.isUnderground) {
                    this.fireEnemyBullet(enemy, config, angle);
                    enemy.lastFire = time;
                }
            }
        });
    }

    fireEnemyBullet(enemy, config, angle) {
        const patterns = {
            single: () => {
                this.createEnemyBullet(enemy.x, enemy.y, angle, config.bulletSpeed, config.damage);
            },
            burst3: () => {
                for (let i = 0; i < 3; i++) {
                    this.time.delayedCall(i * 100, () => {
                        if (enemy.active) {
                            this.createEnemyBullet(enemy.x, enemy.y, angle, config.bulletSpeed, config.damage);
                        }
                    });
                }
            },
            spray8: () => {
                const startAngle = enemy.rotation || 0;
                for (let i = 0; i < 8; i++) {
                    const a = startAngle + (i / 8) * Math.PI * 2;
                    this.createEnemyBullet(enemy.x, enemy.y, a, config.bulletSpeed, config.damage);
                }
            },
            spread5: () => {
                const spread = Math.PI / 6;
                for (let i = -2; i <= 2; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * spread / 4, config.bulletSpeed, config.damage);
                }
            },
            homing: () => {
                const bullet = this.createEnemyBullet(enemy.x, enemy.y, angle, config.bulletSpeed * 0.7, config.damage);
                bullet.isHoming = true;
                bullet.turnSpeed = 60;
            }
        };

        const pattern = patterns[config.bulletPattern];
        if (pattern) pattern();
    }

    createEnemyBullet(x, y, angle, speed, damage) {
        const bullet = this.enemyBullets.create(x, y, null);
        bullet.setCircle(5);
        bullet.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        bullet.damage = damage;
        bullet.angle = angle;
        bullet.color = 0xff6600;
        bullet.size = 5;
        bullet.life = 5;
        return bullet;
    }

    updateBullets(dt) {
        const p = this.player;

        // Player bullets
        this.playerBullets.children.each(bullet => {
            if (!bullet.active) return;

            const dx = bullet.x - bullet.startX;
            const dy = bullet.y - bullet.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > bullet.range ||
                bullet.x < 0 || bullet.x > CONFIG.WORLD_SIZE ||
                bullet.y < 0 || bullet.y > CONFIG.WORLD_SIZE) {
                bullet.destroy();
            }
        });

        // Enemy bullets
        this.enemyBullets.children.each(bullet => {
            if (!bullet.active) return;

            bullet.life -= dt;
            if (bullet.life <= 0 ||
                bullet.x < 0 || bullet.x > CONFIG.WORLD_SIZE ||
                bullet.y < 0 || bullet.y > CONFIG.WORLD_SIZE) {
                bullet.destroy();
                return;
            }

            // Homing behavior
            if (bullet.isHoming) {
                const dx = p.x - bullet.x;
                const dy = p.y - bullet.y;
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - bullet.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const turnAmount = bullet.turnSpeed * dt * Math.PI / 180;
                bullet.angle += Phaser.Math.Clamp(angleDiff, -turnAmount, turnAmount);
                const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
                bullet.body.setVelocity(
                    Math.cos(bullet.angle) * speed,
                    Math.sin(bullet.angle) * speed
                );
            }

            // Check player hit
            if (this.iframes <= 0 && !p.isDashing) {
                const dx = p.x - bullet.x;
                const dy = p.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 20) {
                    this.playerHit(bullet.damage);
                    bullet.destroy();
                }
            }
        });
    }

    updatePickups(dt) {
        this.pickups.children.each(pickup => {
            if (!pickup.active) return;

            pickup.life -= dt;
            if (pickup.life <= 0) {
                pickup.destroy();
                return;
            }

            // Magnetic attraction toward player
            const dx = this.player.x - pickup.x;
            const dy = this.player.y - pickup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                const attraction = (100 - dist) / 100 * 300;
                pickup.body.setVelocity(
                    (dx / dist) * attraction,
                    (dy / dist) * attraction
                );
            }

            if (dist < 25) {
                this.collectPickup(pickup);
            }
        });
    }

    collectPickup(pickup) {
        if (pickup.pickupType === 'crystal') {
            this.xp += pickup.value;
            this.score += pickup.value * 10;
            this.addFloatingText(pickup.x, pickup.y, '+' + pickup.value + ' XP', '#ff6666');

            // Level up check
            while (this.xp >= this.xpToLevel) {
                this.xp -= this.xpToLevel;
                this.level++;
                this.skillPoints++;
                this.xpToLevel = CONFIG.XP_PER_LEVEL + (this.level - 1) * CONFIG.XP_INCREASE;
                this.addFloatingText(this.player.x, this.player.y - 30, 'LEVEL UP!', '#ffff00');
                this.createParticles(this.player.x, this.player.y, 30, 0xffff00, 200);
                this.screenShake = 10;

                // Clear nearby enemy bullets on level up
                this.enemyBullets.children.each(bullet => {
                    if (!bullet.active) return;
                    const dx = this.player.x - bullet.x;
                    const dy = this.player.y - bullet.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 100) {
                        this.createParticles(bullet.x, bullet.y, 3, 0xffffff, 50);
                        bullet.destroy();
                    }
                });
            }
        } else if (pickup.pickupType === 'health') {
            if (this.player.health < this.player.maxHealth) {
                this.player.health++;
                this.addFloatingText(pickup.x, pickup.y, '+1 HP', '#ff0000');
            }
        } else if (pickup.pickupType === 'heartPiece') {
            this.heartPieces++;
            this.addFloatingText(pickup.x, pickup.y, 'Heart Piece!', '#ff88ff');
            // Every 4 pieces = +1 max heart
            if (this.heartPieces >= 4) {
                this.heartPieces = 0;
                this.player.maxHealth++;
                this.player.health++;
                this.addFloatingText(this.player.x, this.player.y - 40, '+1 MAX HP!', '#ff00ff');
                this.screenShake = 15;
            }
        } else if (pickup.pickupType === 'energyBattery') {
            this.energyBatteries++;
            this.addFloatingText(pickup.x, pickup.y, 'Energy Battery!', '#88ffff');
            this.player.maxEnergy++;
            this.player.energy = this.player.maxEnergy;
        }

        this.createParticles(pickup.x, pickup.y, 8, pickup.color, 80);
        pickup.destroy();
    }

    hitEnemy(bullet, enemy) {
        const damage = bullet.damage;
        enemy.hp -= damage;

        this.addFloatingText(enemy.x, enemy.y - 10, '-' + Math.floor(damage), '#ffffff');
        this.createParticles(enemy.x, enemy.y, 5, enemy.color, 100);
        this.screenShake = 3;

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }

        bullet.destroy();
    }

    killEnemy(enemy) {
        const config = CONFIG.ENEMIES[enemy.enemyType];

        // Combo system
        this.comboCount++;
        this.comboTimer = 2.0;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

        // Spawn crystals (more with combo)
        const comboBonus = Math.min(this.comboCount * 0.1, 0.5);
        const crystalCount = Math.floor(config.xp * (1 + comboBonus));
        for (let i = 0; i < crystalCount; i++) {
            const angle = (i / crystalCount) * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            this.spawnPickup(
                enemy.x + Math.cos(angle) * dist,
                enemy.y + Math.sin(angle) * dist,
                'crystal',
                1
            );
        }

        // Chance for health drop (higher with combo)
        if (Math.random() < 0.05 + this.comboCount * 0.01) {
            this.spawnPickup(enemy.x, enemy.y, 'health', 1);
        }

        // Chance for heart piece drop from elites
        if (config.isElite && Math.random() < 0.2) {
            this.spawnPickup(enemy.x, enemy.y, 'heartPiece', 1);
        }

        // Combo text
        const comboText = this.comboCount > 1 ? ' x' + this.comboCount : '';
        this.addFloatingText(enemy.x, enemy.y, '+' + config.xp * 10 + comboText, this.comboCount > 3 ? '#ff8800' : '#ffff00');
        this.createParticles(enemy.x, enemy.y, 20 + this.comboCount * 2, enemy.color, 150);
        this.screenShake = 8 + Math.min(this.comboCount, 5);

        this.score += config.xp * 10 * (1 + this.comboCount * 0.1);
        this.kills++;

        enemy.destroy();
    }

    spawnPickup(x, y, type, value) {
        const pickup = this.pickups.create(x, y, null);
        pickup.setCircle(8);
        pickup.pickupType = type;
        pickup.value = value;
        pickup.life = 15;

        // Color by type
        const colors = {
            crystal: 0xff6666,
            health: 0xff0000,
            heartPiece: 0xff88ff,
            energyBattery: 0x88ffff
        };
        pickup.color = colors[type] || 0xffffff;

        pickup.body.setVelocity(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        pickup.body.setDrag(100, 100);
    }

    playerHit(damage) {
        this.player.health -= damage;
        this.iframes = 1.0;
        this.screenShake = 15;
        this.addFloatingText(this.player.x, this.player.y - 20, '-' + damage + ' HP', '#ff0000');
        this.createParticles(this.player.x, this.player.y, 15, 0xff0000, 150);

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    spawnWave() {
        const types = Object.keys(CONFIG.ENEMIES);

        for (let i = 0; i < this.enemiesPerWave; i++) {
            // Random position away from player
            let x, y;
            do {
                x = Math.random() * CONFIG.WORLD_SIZE;
                y = Math.random() * CONFIG.WORLD_SIZE;
            } while (Math.sqrt((x - this.player.x) ** 2 + (y - this.player.y) ** 2) < 400);

            // Weighted enemy selection based on wave
            let typeIndex = Math.floor(Math.random() * Math.min(this.wave + 1, types.length));
            const type = types[typeIndex];

            this.spawnEnemy(x, y, type);
        }
    }

    spawnEnemy(x, y, type) {
        const config = CONFIG.ENEMIES[type];
        const enemy = this.enemies.create(x, y, null);
        enemy.setCircle(config.size);
        enemy.enemyType = type;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.color = config.color;
        enemy.size = config.size;
        enemy.body.setCollideWorldBounds(true);
    }

    createParticles(x, y, count, color, speed) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * speed + speed * 0.3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color,
                size: Math.random() * 3 + 1,
                life: Math.random() * 0.4 + 0.2
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            vy: -50,
            life: 1.5,
            alpha: 1
        });
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            t.alpha = t.life / 1.5;
            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw() {
        const g = this.add.graphics();
        g.clear();

        // Draw pickups
        this.pickups.children.each(pickup => {
            if (!pickup.active) return;
            const alpha = Math.min(1, pickup.life / 2);

            // Glow
            g.fillStyle(pickup.color, 0.3 * alpha);
            g.fillCircle(pickup.x, pickup.y, 12);

            // Crystal shape
            g.fillStyle(pickup.color, alpha);
            if (pickup.pickupType === 'crystal') {
                g.fillTriangle(
                    pickup.x, pickup.y - 8,
                    pickup.x - 6, pickup.y + 4,
                    pickup.x + 6, pickup.y + 4
                );
            } else {
                g.fillCircle(pickup.x, pickup.y, 6);
            }

            // Highlight
            g.fillStyle(0xffffff, 0.5 * alpha);
            g.fillCircle(pickup.x - 2, pickup.y - 2, 2);
        });

        // Draw enemies
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;
            const config = CONFIG.ENEMIES[enemy.enemyType];

            // Skip underground burrowers
            if (config.behavior === 'emerge' && enemy.isUnderground) {
                // Just show shadow
                g.fillStyle(0x000000, 0.3);
                g.fillCircle(enemy.x, enemy.y, enemy.size * 0.8);
                return;
            }

            // Shadow
            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(enemy.x + 3, enemy.y + 3, enemy.size * 2, enemy.size);

            // Body glow
            g.fillStyle(enemy.color, 0.3);
            g.fillCircle(enemy.x, enemy.y, enemy.size * 1.3);

            // Main body (cute rounded ship)
            g.fillStyle(enemy.color);
            g.fillCircle(enemy.x, enemy.y, enemy.size);

            // Lighter center
            const lighterColor = Phaser.Display.Color.IntegerToColor(enemy.color);
            lighterColor.lighten(30);
            g.fillStyle(lighterColor.color);
            g.fillCircle(enemy.x, enemy.y - enemy.size * 0.2, enemy.size * 0.6);

            // Eyes (angry)
            g.fillStyle(0xffffff);
            g.fillCircle(enemy.x - enemy.size * 0.25, enemy.y - enemy.size * 0.1, enemy.size * 0.25);
            g.fillCircle(enemy.x + enemy.size * 0.25, enemy.y - enemy.size * 0.1, enemy.size * 0.25);

            g.fillStyle(0x000000);
            g.fillCircle(enemy.x - enemy.size * 0.2, enemy.y, enemy.size * 0.15);
            g.fillCircle(enemy.x + enemy.size * 0.3, enemy.y, enemy.size * 0.15);

            // Health bar
            const barWidth = enemy.size * 2;
            const barHeight = 4;
            const barY = enemy.y - enemy.size - 10;
            g.fillStyle(0x333333);
            g.fillRect(enemy.x - barWidth/2, barY, barWidth, barHeight);
            g.fillStyle(0x00ff00);
            g.fillRect(enemy.x - barWidth/2, barY, barWidth * (enemy.hp / enemy.maxHp), barHeight);
        });

        // Draw enemy bullets
        this.enemyBullets.children.each(bullet => {
            if (!bullet.active) return;

            // Glow
            g.fillStyle(bullet.color, 0.4);
            g.fillCircle(bullet.x, bullet.y, bullet.size * 1.5);

            // Core
            g.fillStyle(bullet.color);
            g.fillCircle(bullet.x, bullet.y, bullet.size);

            // Highlight
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(bullet.x - 1, bullet.y - 1, bullet.size * 0.4);
        });

        // Draw player bullets
        this.playerBullets.children.each(bullet => {
            if (!bullet.active) return;

            // Trail
            g.fillStyle(bullet.color, 0.3);
            for (let i = 1; i <= 3; i++) {
                g.fillCircle(
                    bullet.x - Math.cos(bullet.angle) * i * 8,
                    bullet.y - Math.sin(bullet.angle) * i * 8,
                    bullet.size * (1 - i * 0.2)
                );
            }

            // Core
            g.fillStyle(bullet.color);
            g.fillCircle(bullet.x, bullet.y, bullet.size);

            // Highlight
            g.fillStyle(0xffffff, 0.8);
            g.fillCircle(bullet.x, bullet.y, bullet.size * 0.5);
        });

        // Draw particles
        for (const p of this.particles) {
            g.fillStyle(p.color, p.life / 0.6);
            g.fillCircle(p.x, p.y, p.size);
        }

        // Draw player
        this.drawPlayer(g);

        // Draw floating texts
        for (const t of this.floatingTexts) {
            const text = this.add.text(t.x, t.y, t.text, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: t.color,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setAlpha(t.alpha);

            this.time.delayedCall(50, () => text.destroy());
        }

        // Destroy graphics next frame
        this.time.delayedCall(16, () => g.destroy());
    }

    drawPlayer(g) {
        const p = this.player;

        // Damage flash
        const flashAlpha = this.iframes > 0 ? (Math.sin(this.iframes * 20) * 0.5 + 0.5) : 1;
        if (flashAlpha < 0.5 && this.iframes > 0) return; // Flicker effect

        // Dash trail
        if (p.isDashing) {
            g.fillStyle(0x88ffff, 0.5);
            for (let i = 1; i <= 5; i++) {
                g.fillCircle(
                    p.x - p.dashVx * 0.02 * i,
                    p.y - p.dashVy * 0.02 * i,
                    15 - i * 2
                );
            }
        }

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(p.x + 4, p.y + 4, 35, 18);

        // Engine glow
        if (p.vx !== 0 || p.vy !== 0) {
            const engineAngle = p.angle + Math.PI;
            g.fillStyle(0xff6600, 0.6);
            g.fillCircle(
                p.x + Math.cos(engineAngle) * 18,
                p.y + Math.sin(engineAngle) * 18,
                8
            );
            g.fillStyle(0xffff00, 0.8);
            g.fillCircle(
                p.x + Math.cos(engineAngle) * 18,
                p.y + Math.sin(engineAngle) * 18,
                4
            );
        }

        // Ship body (cute rounded)
        g.fillStyle(0x4fc3f7);
        g.save();
        g.translateCanvas(p.x, p.y);
        g.rotateCanvas(p.angle);

        // Main body
        g.fillStyle(0x4fc3f7);
        g.fillRoundedRect(-18, -12, 36, 24, 8);

        // Nose
        g.fillStyle(0x29b6f6);
        g.fillTriangle(18, 0, 8, -8, 8, 8);

        // Cockpit
        g.fillStyle(0x81d4fa);
        g.fillCircle(0, 0, 8);

        // Eyes (cute)
        g.fillStyle(0xffffff);
        g.fillCircle(2, -3, 4);
        g.fillCircle(2, 3, 4);

        g.fillStyle(0x000000);
        g.fillCircle(4, -2, 2);
        g.fillCircle(4, 2, 2);

        // Wings
        g.fillStyle(0x0288d1);
        g.fillTriangle(-10, -12, -18, -20, -5, -12);
        g.fillTriangle(-10, 12, -18, 20, -5, 12);

        g.restore();

        // Aiming reticle
        const reticleX = p.x + Math.cos(p.angle) * 50;
        const reticleY = p.y + Math.sin(p.angle) * 50;
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeCircle(reticleX, reticleY, 8);
        g.lineBetween(reticleX - 12, reticleY, reticleX - 4, reticleY);
        g.lineBetween(reticleX + 4, reticleY, reticleX + 12, reticleY);
        g.lineBetween(reticleX, reticleY - 12, reticleX, reticleY - 4);
        g.lineBetween(reticleX, reticleY + 4, reticleX, reticleY + 12);
    }

    updateHUD() {
        const p = this.player;

        // Clear HUD graphics
        this.hudGraphics.clear();

        // Health hearts
        for (let i = 0; i < p.maxHealth; i++) {
            const x = 10 + i * 25;
            const y = 15;
            if (i < p.health) {
                this.hudGraphics.fillStyle(0xff0000);
            } else {
                this.hudGraphics.fillStyle(0x440000);
            }
            // Heart shape
            this.hudGraphics.fillCircle(x - 4, y - 2, 6);
            this.hudGraphics.fillCircle(x + 4, y - 2, 6);
            this.hudGraphics.fillTriangle(x - 10, y, x + 10, y, x, y + 10);
        }

        // Energy bar
        const energyBarWidth = 150;
        const energyBarHeight = 12;
        this.hudGraphics.fillStyle(0x222244);
        this.hudGraphics.fillRect(10, 40, energyBarWidth, energyBarHeight);
        this.hudGraphics.fillStyle(0x00aaff);
        this.hudGraphics.fillRect(10, 40, energyBarWidth * (p.energy / p.maxEnergy), energyBarHeight);
        this.hudGraphics.lineStyle(2, 0x4488ff);
        this.hudGraphics.strokeRect(10, 40, energyBarWidth, energyBarHeight);

        // XP bar
        const xpBarWidth = 150;
        const xpBarHeight = 8;
        this.hudGraphics.fillStyle(0x442222);
        this.hudGraphics.fillRect(10, 60, xpBarWidth, xpBarHeight);
        this.hudGraphics.fillStyle(0xff6666);
        this.hudGraphics.fillRect(10, 60, xpBarWidth * (this.xp / this.xpToLevel), xpBarHeight);

        // Update text
        this.hudTexts.level.setText('Level: ' + this.level + (this.skillPoints > 0 ? ' (+' + this.skillPoints + ' SP)' : ''));
        this.hudTexts.xp.setText('XP: ' + this.xp + '/' + this.xpToLevel);
        this.hudTexts.score.setText('Score: ' + this.score).setOrigin(1, 0);
        this.hudTexts.wave.setText('Wave: ' + this.wave).setOrigin(1, 0);
        this.hudTexts.enemies.setText('Enemies: ' + this.enemies.countActive()).setOrigin(1, 0);

        // Skill allocation hint
        if (this.skillPoints > 0) {
            this.hudTexts.skills.setText('[1-5] Allocate SP: 1=DMG 2=RATE 3=RANGE 4=SPEED 5=CRIT');

            // Handle skill allocation
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ONE'))) this.allocateSkill('damage');
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('TWO'))) this.allocateSkill('fireRate');
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('THREE'))) this.allocateSkill('range');
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('FOUR'))) this.allocateSkill('speed');
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('FIVE'))) this.allocateSkill('critical');
        } else {
            this.hudTexts.skills.setText('DMG:' + this.allocatedSkills.damage + ' RATE:' + this.allocatedSkills.fireRate +
                ' RANGE:' + this.allocatedSkills.range + ' SPD:' + this.allocatedSkills.speed + ' CRIT:' + this.allocatedSkills.critical);
        }

        // Dash cooldown
        if (p.dashCooldown > 0) {
            this.hudTexts.dash.setText('Dash: ' + p.dashCooldown.toFixed(1) + 's');
            this.hudTexts.dash.setColor('#888888');
        } else {
            this.hudTexts.dash.setText('Dash: READY');
            this.hudTexts.dash.setColor('#88ffff');
        }

        // Combo display
        if (this.comboCount > 1) {
            const comboColor = this.comboCount > 5 ? 0xff8800 : this.comboCount > 3 ? 0xffff00 : 0xffffff;
            this.hudGraphics.fillStyle(comboColor, 0.9);
            const comboText = 'x' + this.comboCount;
            // Draw combo near center
            this.hudGraphics.fillRoundedRect(350, 10, 100, 30, 5);
            this.hudGraphics.fillStyle(0x000000, 0.8);
            this.hudGraphics.fillRoundedRect(352, 12, 96, 26, 4);
        }

        // Combo text update
        if (!this.hudTexts.combo) {
            this.hudTexts.combo = this.add.text(400, 25, '', {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color: '#ffffff'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        }
        if (this.comboCount > 1) {
            this.hudTexts.combo.setText('COMBO x' + this.comboCount);
            this.hudTexts.combo.setVisible(true);
            this.hudTexts.combo.setColor(this.comboCount > 5 ? '#ff8800' : this.comboCount > 3 ? '#ffff00' : '#ffffff');
        } else {
            this.hudTexts.combo.setVisible(false);
        }

        // Minimap
        this.drawMinimap();
    }

    allocateSkill(skill) {
        const maxPoints = skill === 'critical' ? 5 : 10;
        const cost = skill === 'critical' ? 2 : 1;

        if (this.skillPoints >= cost && this.allocatedSkills[skill] < maxPoints) {
            this.skillPoints -= cost;
            this.allocatedSkills[skill]++;
            this.addFloatingText(this.player.x, this.player.y - 40, '+' + skill.toUpperCase(), '#88ff88');
        }
    }

    drawMinimap() {
        const mapSize = 120;
        const mapX = 800 - mapSize - 10;
        const mapY = 85;
        const scale = mapSize / CONFIG.WORLD_SIZE;

        // Background
        this.hudGraphics.fillStyle(0x000000, 0.7);
        this.hudGraphics.fillRect(mapX, mapY, mapSize, mapSize);
        this.hudGraphics.lineStyle(2, 0x444444);
        this.hudGraphics.strokeRect(mapX, mapY, mapSize, mapSize);

        // Enemies
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;
            this.hudGraphics.fillStyle(0xff0000);
            this.hudGraphics.fillCircle(mapX + enemy.x * scale, mapY + enemy.y * scale, 2);
        });

        // Pickups
        this.pickups.children.each(pickup => {
            if (!pickup.active) return;
            this.hudGraphics.fillStyle(pickup.color, 0.8);
            this.hudGraphics.fillCircle(mapX + pickup.x * scale, mapY + pickup.y * scale, 1);
        });

        // Player
        this.hudGraphics.fillStyle(0x00ff00);
        this.hudGraphics.fillCircle(mapX + this.player.x * scale, mapY + this.player.y * scale, 3);

        // View rectangle
        const camX = this.cameras.main.scrollX;
        const camY = this.cameras.main.scrollY;
        this.hudGraphics.lineStyle(1, 0xffffff, 0.5);
        this.hudGraphics.strokeRect(
            mapX + camX * scale,
            mapY + camY * scale,
            800 * scale,
            600 * scale
        );
    }

    drawPauseOverlay() {
        // Create pause overlay if not exists
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.add.graphics();
            this.pauseOverlay.setScrollFactor(0);
            this.pauseOverlay.setDepth(200);
            this.pauseText = this.add.text(400, 250, 'PAUSED', {
                fontSize: '48px',
                fontFamily: 'Arial Black',
                color: '#ffffff'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
            this.pauseHint = this.add.text(400, 320, 'Press ESC to continue', {
                fontSize: '20px',
                color: '#aaaaaa'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        }

        this.pauseOverlay.clear();
        this.pauseOverlay.fillStyle(0x000000, 0.7);
        this.pauseOverlay.fillRect(0, 0, 800, 600);
        this.pauseText.setVisible(true);
        this.pauseHint.setVisible(true);
    }

    hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.clear();
            this.pauseText.setVisible(false);
            this.pauseHint.setVisible(false);
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        this.scene.start('GameOverScene', {
            score: this.score,
            kills: this.kills,
            wave: this.wave,
            level: this.level,
            maxCombo: this.maxCombo
        });
    }
}

// Game over scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalKills = data.kills || 0;
        this.finalWave = data.wave || 1;
        this.finalLevel = data.level || 1;
        this.finalMaxCombo = data.maxCombo || 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width/2, height * 0.15, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ff4444',
            stroke: '#880000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Stats
        this.add.text(width/2, height * 0.32, 'Score: ' + Math.floor(this.finalScore), {
            fontSize: '28px', color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.40, 'Kills: ' + this.finalKills, {
            fontSize: '22px', color: '#ff8888'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.47, 'Wave: ' + this.finalWave, {
            fontSize: '22px', color: '#88ff88'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.54, 'Level: ' + this.finalLevel, {
            fontSize: '22px', color: '#ffff88'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.61, 'Max Combo: ' + this.finalMaxCombo + 'x', {
            fontSize: '22px', color: '#ff8800'
        }).setOrigin(0.5);

        // Restart
        const restartText = this.add.text(width/2, height * 0.8, 'CLICK TO RESTART', {
            fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

// Phaser configuration
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

// Create game instance
const game = new Phaser.Game(config);
