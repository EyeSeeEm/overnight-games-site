// ============================================================================
// STAR OF PROVIDENCE CLONE - Bullet Hell Roguelike
// ============================================================================

(function() {
    'use strict';

    const WIDTH = 800;
    const HEIGHT = 600;
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // ========================================================================
    // GAME STATE
    // ========================================================================
    let gameState = 'menu'; // menu, playing, gameover, victory
    let gamePaused = new URLSearchParams(location.search).has('test');
    let floor = 1;
    let roomsCleared = 0;
    let score = 0;
    let multiplier = 1.0;

    // Game objects
    let ship = null;
    let bullets = [];
    let enemyBullets = [];
    let enemies = [];
    let pickups = [];
    let particles = [];
    let keys = {};
    let activeHarnessKeys = new Set();

    // ========================================================================
    // SHIP CONFIG
    // ========================================================================
    const SHIP = {
        normalSpeed: 250,
        focusSpeed: 100,
        dashDistance: 120,
        dashDuration: 100, // ms
        dashCooldown: 500, // ms
        dashIFrames: 150, // ms
        hitboxRadius: 4,
        spriteSize: 32,
        startingHP: 4,
        maxHP: 12,
        startingBombs: 2,
        maxBombs: 6,
        invincibilityTime: 1000 // ms
    };

    // ========================================================================
    // WEAPONS
    // ========================================================================
    const WEAPONS = {
        peashooter: {
            name: 'Peashooter',
            damage: 5,
            fireRate: 100,
            velocity: 720,
            projectileSize: 4,
            color: '#FFFF00',
            infinite: true
        },
        vulcan: {
            name: 'Vulcan',
            damage: 15,
            maxAmmo: 500,
            fireRate: 80,
            velocity: 600,
            projectileSize: 5,
            color: '#FF6600'
        },
        laser: {
            name: 'Laser',
            damage: 115,
            maxAmmo: 100,
            fireRate: 500,
            velocity: 2000,
            projectileSize: 3,
            color: '#00FFFF',
            piercing: true
        },
        fireball: {
            name: 'Fireball',
            damage: 80,
            maxAmmo: 90,
            fireRate: 600,
            velocity: 360,
            projectileSize: 12,
            color: '#FF4400',
            explosive: true,
            explosionRadius: 50
        }
    };

    // ========================================================================
    // ENEMY TYPES
    // ========================================================================
    const ENEMY_TYPES = {
        ghost: {
            hp: 50,
            speed: 80,
            size: 16,
            color: '#8888FF',
            behavior: 'chase',
            debris: 10,
            shootPattern: null
        },
        shooter: {
            hp: 40,
            speed: 50,
            size: 18,
            color: '#FF4488',
            behavior: 'strafe',
            debris: 15,
            shootPattern: 'aimed',
            shootRate: 2000,
            bulletSpeed: 200
        },
        spinner: {
            hp: 60,
            speed: 30,
            size: 20,
            color: '#44FF88',
            behavior: 'stationary',
            debris: 20,
            shootPattern: 'spiral',
            shootRate: 100,
            bulletSpeed: 150
        },
        boss: {
            hp: 500,
            speed: 40,
            size: 48,
            color: '#FF0000',
            behavior: 'boss',
            debris: 200,
            shootPattern: 'boss',
            shootRate: 500,
            bulletSpeed: 180
        }
    };

    // ========================================================================
    // SHIP CLASS
    // ========================================================================
    class Ship {
        constructor() {
            this.x = WIDTH / 2;
            this.y = HEIGHT - 100;
            this.hp = SHIP.startingHP;
            this.maxHP = SHIP.startingHP;
            this.bombs = SHIP.startingBombs;
            this.weapon = { ...WEAPONS.peashooter };
            this.ammo = Infinity;
            this.damageMultiplier = 1.0;

            this.isFocused = false;
            this.isDashing = false;
            this.isInvincible = false;
            this.dashCooldownTime = 0;
            this.invincibleTime = 0;
            this.lastFireTime = 0;

            this.dashTargetX = 0;
            this.dashTargetY = 0;
            this.dashProgress = 0;
        }

        update(dt) {
            // Update cooldowns
            if (this.dashCooldownTime > 0) this.dashCooldownTime -= dt * 1000;
            if (this.invincibleTime > 0) {
                this.invincibleTime -= dt * 1000;
                if (this.invincibleTime <= 0) this.isInvincible = false;
            }

            // Handle dash
            if (this.isDashing) {
                this.dashProgress += dt * 1000 / SHIP.dashDuration;
                if (this.dashProgress >= 1) {
                    this.x = this.dashTargetX;
                    this.y = this.dashTargetY;
                    this.isDashing = false;
                    // Keep i-frames a bit longer
                    this.invincibleTime = SHIP.dashIFrames - SHIP.dashDuration;
                } else {
                    this.x += (this.dashTargetX - this.x) * 0.3;
                    this.y += (this.dashTargetY - this.y) * 0.3;
                }
                return;
            }

            // Movement
            this.isFocused = isKeyDown('Shift') || isKeyDown('shift');
            const speed = this.isFocused ? SHIP.focusSpeed : SHIP.normalSpeed;

            let vx = 0, vy = 0;
            if (isKeyDown('w') || isKeyDown('ArrowUp')) vy -= 1;
            if (isKeyDown('s') || isKeyDown('ArrowDown')) vy += 1;
            if (isKeyDown('a') || isKeyDown('ArrowLeft')) vx -= 1;
            if (isKeyDown('d') || isKeyDown('ArrowRight')) vx += 1;

            if (vx !== 0 && vy !== 0) {
                vx *= 0.7071;
                vy *= 0.7071;
            }

            this.x += vx * speed * dt;
            this.y += vy * speed * dt;

            // Clamp to bounds
            this.x = Math.max(SHIP.spriteSize/2, Math.min(WIDTH - SHIP.spriteSize/2, this.x));
            this.y = Math.max(SHIP.spriteSize/2, Math.min(HEIGHT - SHIP.spriteSize/2, this.y));

            // Firing
            if (isKeyDown('Space') || isKeyDown(' ')) {
                this.fire();
            }

            // Dash
            if (keyJustPressed('z') && this.dashCooldownTime <= 0) {
                this.dash(vx, vy);
            }

            // Bomb
            if (keyJustPressed('x') && this.bombs > 0) {
                this.useBomb();
            }
        }

        fire() {
            const now = Date.now();
            if (now - this.lastFireTime < this.weapon.fireRate) return;
            this.lastFireTime = now;

            if (!this.weapon.infinite && this.ammo <= 0) {
                this.weapon = { ...WEAPONS.peashooter };
                this.ammo = Infinity;
            }

            const damage = this.weapon.damage * this.damageMultiplier;
            bullets.push(new Bullet(
                this.x, this.y - 20,
                0, -this.weapon.velocity,
                damage,
                this.weapon.projectileSize,
                this.weapon.color,
                this.weapon.piercing,
                this.weapon.explosive ? this.weapon.explosionRadius : 0
            ));

            if (!this.weapon.infinite) this.ammo--;

            // Muzzle flash
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 10,
                    this.y - 25,
                    (Math.random() - 0.5) * 50,
                    -Math.random() * 100 - 50,
                    this.weapon.color,
                    0.2
                ));
            }
        }

        dash(vx, vy) {
            // Default to up if no direction
            if (vx === 0 && vy === 0) vy = -1;

            const len = Math.sqrt(vx * vx + vy * vy);
            vx /= len;
            vy /= len;

            this.dashTargetX = this.x + vx * SHIP.dashDistance;
            this.dashTargetY = this.y + vy * SHIP.dashDistance;

            // Clamp target
            this.dashTargetX = Math.max(20, Math.min(WIDTH - 20, this.dashTargetX));
            this.dashTargetY = Math.max(20, Math.min(HEIGHT - 20, this.dashTargetY));

            this.isDashing = true;
            this.isInvincible = true;
            this.dashProgress = 0;
            this.dashCooldownTime = SHIP.dashCooldown;

            // Dash trail
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    this.x, this.y,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30,
                    '#4488FF',
                    0.3
                ));
            }
        }

        useBomb() {
            this.bombs--;
            this.isInvincible = true;
            this.invincibleTime = 500;

            // Clear enemy bullets
            enemyBullets = [];

            // Damage all enemies
            for (const enemy of enemies) {
                enemy.hp -= 50;
                createHitEffect(enemy.x, enemy.y);
            }

            // Big explosion effect
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 300 + 100;
                particles.push(new Particle(
                    this.x, this.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#FFFF00',
                    0.5
                ));
            }

            // Flash screen
            screenFlash = 0.3;

            showFloatingText(this.x, this.y, 'BOMB!', '#FFFF00');

            // Multiplier penalty
            multiplier = Math.max(1.0, multiplier - 0.5);
        }

        takeDamage() {
            if (this.isInvincible) return;

            this.hp--;
            this.isInvincible = true;
            this.invincibleTime = SHIP.invincibilityTime;

            // Multiplier penalty
            multiplier = Math.max(1.0, multiplier - 1.0);

            // Hit effect
            screenShake = { intensity: 10, duration: 0.2 };

            showFloatingText(this.x, this.y, '-1 HP', '#FF0000');

            if (this.hp <= 0) {
                gameState = 'gameover';
            }
        }

        render(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Flash when invincible
            if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            // Ship body
            ctx.fillStyle = '#00AAFF';
            ctx.beginPath();
            ctx.moveTo(0, -16);
            ctx.lineTo(-12, 12);
            ctx.lineTo(0, 6);
            ctx.lineTo(12, 12);
            ctx.closePath();
            ctx.fill();

            // Engine glow
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(-6, 10);
            ctx.lineTo(0, 20 + Math.random() * 5);
            ctx.lineTo(6, 10);
            ctx.closePath();
            ctx.fill();

            // Focus indicator (hitbox)
            if (this.isFocused) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, SHIP.hitboxRadius + 2, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(0, 0, SHIP.hitboxRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ========================================================================
    // BULLET CLASS
    // ========================================================================
    class Bullet {
        constructor(x, y, vx, vy, damage, size, color, piercing = false, explosionRadius = 0) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.damage = damage;
            this.size = size;
            this.color = color;
            this.piercing = piercing;
            this.explosionRadius = explosionRadius;
            this.dead = false;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Out of bounds
            if (this.x < -20 || this.x > WIDTH + 20 ||
                this.y < -20 || this.y > HEIGHT + 20) {
                this.dead = true;
            }
        }

        render(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = this.color + '44';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ========================================================================
    // ENEMY CLASS
    // ========================================================================
    class Enemy {
        constructor(x, y, type) {
            const def = ENEMY_TYPES[type];
            this.x = x;
            this.y = y;
            this.type = type;
            this.hp = def.hp;
            this.maxHp = def.hp;
            this.speed = def.speed;
            this.size = def.size;
            this.color = def.color;
            this.behavior = def.behavior;
            this.debris = def.debris;
            this.shootPattern = def.shootPattern;
            this.shootRate = def.shootRate || 1000;
            this.bulletSpeed = def.bulletSpeed || 150;
            this.lastShootTime = 0;
            this.angle = 0;
            this.dead = false;
            this.targetX = x;
            this.targetY = y;
            this.strafeDir = Math.random() < 0.5 ? -1 : 1;
        }

        update(dt) {
            // Movement
            switch (this.behavior) {
                case 'chase':
                    const dx = ship.x - this.x;
                    const dy = ship.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        this.x += (dx / dist) * this.speed * dt;
                        this.y += (dy / dist) * this.speed * dt;
                    }
                    break;

                case 'strafe':
                    // Move down slowly and strafe
                    this.y += this.speed * 0.3 * dt;
                    this.x += this.strafeDir * this.speed * dt;
                    if (this.x < 50 || this.x > WIDTH - 50) {
                        this.strafeDir *= -1;
                    }
                    break;

                case 'stationary':
                    // Stay in place
                    this.angle += dt * 2;
                    break;

                case 'boss':
                    // Slow movement, stay at top
                    this.y = Math.min(150, this.y + 20 * dt);
                    this.x += Math.sin(Date.now() / 1000) * 50 * dt;
                    break;
            }

            // Keep in bounds
            this.x = Math.max(this.size, Math.min(WIDTH - this.size, this.x));
            this.y = Math.max(this.size, Math.min(HEIGHT - 100, this.y));

            // Shooting
            if (this.shootPattern && Date.now() - this.lastShootTime > this.shootRate) {
                this.shoot();
                this.lastShootTime = Date.now();
            }

            // Check collision with player bullets
            for (const bullet of bullets) {
                if (bullet.dead) continue;
                const dx = bullet.x - this.x;
                const dy = bullet.y - this.y;
                if (dx * dx + dy * dy < (this.size + bullet.size) ** 2) {
                    this.hp -= bullet.damage;
                    createHitEffect(bullet.x, bullet.y);

                    if (bullet.explosionRadius > 0) {
                        createExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage * 0.5);
                    }

                    if (!bullet.piercing) bullet.dead = true;

                    if (this.hp <= 0) {
                        this.die();
                    }
                }
            }
        }

        shoot() {
            const angleToPlayer = Math.atan2(ship.y - this.y, ship.x - this.x);

            switch (this.shootPattern) {
                case 'aimed':
                    enemyBullets.push(new Bullet(
                        this.x, this.y,
                        Math.cos(angleToPlayer) * this.bulletSpeed,
                        Math.sin(angleToPlayer) * this.bulletSpeed,
                        1, 6, '#FF4444'
                    ));
                    break;

                case 'spiral':
                    for (let i = 0; i < 4; i++) {
                        const angle = this.angle + (i * Math.PI / 2);
                        enemyBullets.push(new Bullet(
                            this.x, this.y,
                            Math.cos(angle) * this.bulletSpeed,
                            Math.sin(angle) * this.bulletSpeed,
                            1, 5, '#44FF44'
                        ));
                    }
                    break;

                case 'boss':
                    // Multiple patterns
                    const pattern = Math.floor(Date.now() / 3000) % 3;
                    if (pattern === 0) {
                        // Aimed spread
                        for (let i = -2; i <= 2; i++) {
                            const angle = angleToPlayer + i * 0.2;
                            enemyBullets.push(new Bullet(
                                this.x, this.y,
                                Math.cos(angle) * this.bulletSpeed,
                                Math.sin(angle) * this.bulletSpeed,
                                1, 8, '#FF0088'
                            ));
                        }
                    } else if (pattern === 1) {
                        // Circle burst
                        for (let i = 0; i < 12; i++) {
                            const angle = (i / 12) * Math.PI * 2;
                            enemyBullets.push(new Bullet(
                                this.x, this.y,
                                Math.cos(angle) * this.bulletSpeed * 0.8,
                                Math.sin(angle) * this.bulletSpeed * 0.8,
                                1, 6, '#FFAA00'
                            ));
                        }
                    } else {
                        // Rain
                        for (let i = 0; i < 5; i++) {
                            enemyBullets.push(new Bullet(
                                this.x + (Math.random() - 0.5) * 100, this.y,
                                (Math.random() - 0.5) * 30,
                                this.bulletSpeed,
                                1, 5, '#FF4444'
                            ));
                        }
                    }
                    break;
            }
        }

        die() {
            this.dead = true;
            score += Math.floor(this.debris * multiplier);

            // Multiplier gain
            multiplier = Math.min(3.0, multiplier + 0.05);

            showFloatingText(this.x, this.y, '+' + Math.floor(this.debris * multiplier), '#FFFF00');

            // Death particles
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 150 + 50;
                particles.push(new Particle(
                    this.x, this.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    this.color,
                    0.5
                ));
            }

            // Random pickup
            if (Math.random() < 0.15) {
                pickups.push(new Pickup(this.x, this.y, 'weapon'));
            } else if (Math.random() < 0.2) {
                pickups.push(new Pickup(this.x, this.y, 'health'));
            }
        }

        render(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // HP bar for larger enemies
            if (this.maxHp > 100) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 30, this.y - this.size - 10, 60, 6);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(this.x - 30, this.y - this.size - 10, 60 * (this.hp / this.maxHp), 6);
            }
        }
    }

    // ========================================================================
    // PICKUP CLASS
    // ========================================================================
    class Pickup {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.size = 12;
            this.bob = Math.random() * Math.PI * 2;
            this.collected = false;
        }

        update(dt) {
            this.bob += dt * 3;
            this.y += 30 * dt; // Fall slowly

            // Check pickup
            const dx = this.x - ship.x;
            const dy = this.y - ship.y;
            if (dx * dx + dy * dy < (this.size + 20) ** 2) {
                this.collect();
            }

            // Remove if off screen
            if (this.y > HEIGHT + 20) {
                this.collected = true;
            }
        }

        collect() {
            this.collected = true;

            switch (this.type) {
                case 'health':
                    if (ship.hp < ship.maxHP) {
                        ship.hp++;
                        showFloatingText(this.x, this.y, '+1 HP', '#00FF00');
                    }
                    break;
                case 'weapon':
                    const weapons = ['vulcan', 'laser', 'fireball'];
                    const newWeapon = weapons[Math.floor(Math.random() * weapons.length)];
                    ship.weapon = { ...WEAPONS[newWeapon] };
                    ship.ammo = ship.weapon.maxAmmo;
                    showFloatingText(this.x, this.y, ship.weapon.name + '!', '#00FFFF');
                    break;
                case 'bomb':
                    if (ship.bombs < SHIP.maxBombs) {
                        ship.bombs++;
                        showFloatingText(this.x, this.y, '+1 BOMB', '#FFAA00');
                    }
                    break;
            }
        }

        render(ctx) {
            const bobY = Math.sin(this.bob) * 3;

            ctx.save();
            ctx.translate(this.x, this.y + bobY);

            switch (this.type) {
                case 'health':
                    ctx.fillStyle = '#FF4444';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(-2, -6, 4, 12);
                    ctx.fillRect(-6, -2, 12, 4);
                    break;
                case 'weapon':
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillRect(-10, -6, 20, 12);
                    ctx.fillStyle = '#0088AA';
                    ctx.fillRect(-8, -4, 16, 8);
                    break;
                case 'bomb':
                    ctx.fillStyle = '#FFAA00';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('B', 0, 4);
                    break;
            }

            ctx.restore();
        }
    }

    // ========================================================================
    // PARTICLE CLASS
    // ========================================================================
    class Particle {
        constructor(x, y, vx, vy, color, lifetime) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.lifetime = lifetime;
            this.maxLifetime = lifetime;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.lifetime -= dt;
        }

        render(ctx) {
            const alpha = this.lifetime / this.maxLifetime;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3 * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ========================================================================
    // EFFECTS
    // ========================================================================
    let screenShake = { intensity: 0, duration: 0 };
    let screenFlash = 0;

    function createHitEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#FFFF00',
                0.3
            ));
        }
    }

    function createExplosion(x, y, radius, damage) {
        // Visual
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#FF6600',
                0.4
            ));
        }

        // Damage enemies in radius
        for (const enemy of enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            if (dx * dx + dy * dy < radius * radius) {
                enemy.hp -= damage;
                if (enemy.hp <= 0) enemy.die();
            }
        }
    }

    function showFloatingText(x, y, text, color) {
        const container = document.getElementById('floatingTexts');
        const elem = document.createElement('div');
        elem.className = 'floating-text';
        elem.textContent = text;
        elem.style.left = x + 'px';
        elem.style.top = y + 'px';
        elem.style.color = color;
        container.appendChild(elem);
        setTimeout(() => elem.remove(), 800);
    }

    // ========================================================================
    // WAVE SPAWNING
    // ========================================================================
    let waveTimer = 0;
    let waveNumber = 0;
    let enemiesKilledInWave = 0;
    let bossSpawned = false;

    function spawnWave() {
        waveNumber++;
        enemiesKilledInWave = 0;

        if (waveNumber % 5 === 0 && !bossSpawned) {
            // Boss wave
            enemies.push(new Enemy(WIDTH / 2, -50, 'boss'));
            bossSpawned = true;
            showFloatingText(WIDTH / 2, HEIGHT / 2, 'BOSS!', '#FF0000');
        } else {
            // Normal wave
            const count = 3 + Math.floor(waveNumber * 0.5);
            const types = ['ghost', 'shooter', 'spinner'];

            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const x = 50 + Math.random() * (WIDTH - 100);
                const y = -20 - Math.random() * 100;
                enemies.push(new Enemy(x, y, type));
            }
        }
    }

    // ========================================================================
    // INPUT
    // ========================================================================
    let keysJustPressed = {};

    function isKeyDown(key) {
        return keys[key.toLowerCase()] || keys[key] || activeHarnessKeys.has(key) || activeHarnessKeys.has(key.toLowerCase());
    }

    function keyJustPressed(key) {
        return keysJustPressed[key.toLowerCase()] || keysJustPressed[key];
    }

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (!keys[key]) keysJustPressed[key] = true;
        keys[key] = true;
        keys[e.key] = true;

        if (['w', 'a', 's', 'd', ' ', 'z', 'x', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.key === ' ') {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        keys[e.key] = false;
    });

    // ========================================================================
    // GAME LOOP
    // ========================================================================
    let lastTime = 0;

    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        if (!gamePaused && gameState === 'playing') {
            update(dt);
        }

        render();
        keysJustPressed = {};
        requestAnimationFrame(gameLoop);

        // AUTO-START: Skip menu and start game directly
        setTimeout(() => startGame(), 100);
    }

    function update(dt) {
        // Update screen shake
        if (screenShake.duration > 0) {
            screenShake.duration -= dt;
        }

        // Update screen flash
        if (screenFlash > 0) {
            screenFlash -= dt * 2;
        }

        // Update ship
        ship.update(dt);

        // Update bullets
        for (const bullet of bullets) {
            bullet.update(dt);
        }
        bullets = bullets.filter(b => !b.dead);

        // Update enemy bullets
        for (const bullet of enemyBullets) {
            bullet.update(dt);

            // Check collision with player
            if (!ship.isInvincible && !ship.isDashing) {
                const dx = bullet.x - ship.x;
                const dy = bullet.y - ship.y;
                if (dx * dx + dy * dy < (SHIP.hitboxRadius + bullet.size) ** 2) {
                    ship.takeDamage();
                    bullet.dead = true;
                }
            }
        }
        enemyBullets = enemyBullets.filter(b => !b.dead);

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);

            // Check collision with player
            if (!ship.isInvincible && !ship.isDashing) {
                const dx = enemy.x - ship.x;
                const dy = enemy.y - ship.y;
                if (dx * dx + dy * dy < (SHIP.hitboxRadius + enemy.size) ** 2) {
                    ship.takeDamage();
                }
            }
        }

        // Track kills
        const killedCount = enemies.filter(e => e.dead).length;
        enemiesKilledInWave += killedCount;

        enemies = enemies.filter(e => !e.dead);

        // Update pickups
        for (const pickup of pickups) {
            pickup.update(dt);
        }
        pickups = pickups.filter(p => !p.collected);

        // Update particles
        for (const particle of particles) {
            particle.update(dt);
        }
        particles = particles.filter(p => p.lifetime > 0);

        // Wave management
        waveTimer -= dt;
        if (enemies.length === 0 && waveTimer <= 0) {
            waveTimer = 2; // 2 seconds between waves
            spawnWave();
            roomsCleared++;

            // Bomb recharge
            if (roomsCleared % 3 === 0 && ship.bombs < SHIP.maxBombs) {
                ship.bombs++;
                showFloatingText(ship.x, ship.y - 40, '+1 BOMB', '#FFAA00');
            }
        }

        // Victory condition (beat floor boss)
        if (bossSpawned && enemies.length === 0) {
            floor++;
            if (floor > 5) {
                gameState = 'victory';
            } else {
                bossSpawned = false;
                waveNumber = 0;
                ship.hp = Math.min(ship.maxHP, ship.hp + 2);
                showFloatingText(ship.x, ship.y, 'FLOOR ' + floor, '#00FF00');
            }
        }
    }

    function render() {
        // Apply screen shake
        ctx.save();
        if (screenShake.duration > 0) {
            ctx.translate(
                (Math.random() - 0.5) * screenShake.intensity,
                (Math.random() - 0.5) * screenShake.intensity
            );
        }

        // Background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Stars background
        ctx.fillStyle = '#333';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37 + Date.now() / 100) % WIDTH;
            const y = (i * 53 + Date.now() / 50) % HEIGHT;
            ctx.fillRect(x, y, 1, 1);
        }

        if (gameState === 'menu') {
            renderMenu();
        } else if (gameState === 'playing') {
            // Render game objects
            for (const pickup of pickups) pickup.render(ctx);
            for (const enemy of enemies) enemy.render(ctx);
            for (const bullet of enemyBullets) bullet.render(ctx);
            for (const bullet of bullets) bullet.render(ctx);
            ship.render(ctx);
            for (const particle of particles) particle.render(ctx);

            // Screen flash
            if (screenFlash > 0) {
                ctx.fillStyle = `rgba(255,255,255,${screenFlash})`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }

            renderHUD();
        } else if (gameState === 'gameover') {
            renderGameOver();
        } else if (gameState === 'victory') {
            renderVictory();
        }

        ctx.restore();
    }

    function renderMenu() {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STAR OF PROVIDENCE', WIDTH / 2, 150);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#00AAFF';
        ctx.fillText('Bullet Hell Roguelike', WIDTH / 2, 200);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText('WASD / Arrows - Move', WIDTH / 2, 300);
        ctx.fillText('Space - Fire', WIDTH / 2, 330);
        ctx.fillText('Shift - Focus (slow precise movement)', WIDTH / 2, 360);
        ctx.fillText('Z - Dash (i-frames)', WIDTH / 2, 390);
        ctx.fillText('X - Bomb (clear bullets)', WIDTH / 2, 420);

        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Press SPACE to Start', WIDTH / 2, 520);

        ctx.textAlign = 'left';
    }

    function renderHUD() {
        // HP
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.fillText('HP:', 10, 25);
        for (let i = 0; i < ship.maxHP; i++) {
            ctx.fillStyle = i < ship.hp ? '#FF4444' : '#333';
            ctx.fillRect(40 + i * 20, 12, 16, 16);
        }

        // Bombs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('BOMB:', 10, 50);
        for (let i = 0; i < SHIP.maxBombs; i++) {
            ctx.fillStyle = i < ship.bombs ? '#FFAA00' : '#333';
            ctx.beginPath();
            ctx.arc(70 + i * 20, 45, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Weapon & Ammo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(ship.weapon.name, 10, 75);
        if (!ship.weapon.infinite) {
            ctx.fillText('Ammo: ' + ship.ammo, 120, 75);
        }

        // Score & Multiplier
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('SCORE: ' + score, WIDTH - 10, 25);

        ctx.fillStyle = multiplier >= 2.5 ? '#FF4444' : '#00FF00';
        ctx.fillText('x' + multiplier.toFixed(2), WIDTH - 10, 50);

        // Floor
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.fillText('FLOOR ' + floor, WIDTH - 10, 75);

        ctx.textAlign = 'left';

        // Dash cooldown indicator
        if (ship.dashCooldownTime > 0) {
            ctx.fillStyle = '#333';
            ctx.fillRect(WIDTH/2 - 50, HEIGHT - 30, 100, 10);
            ctx.fillStyle = '#4488FF';
            const pct = 1 - (ship.dashCooldownTime / SHIP.dashCooldown);
            ctx.fillRect(WIDTH/2 - 50, HEIGHT - 30, 100 * pct, 10);
        }
    }

    function renderGameOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 50);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, WIDTH / 2, HEIGHT / 2 + 10);
        ctx.fillText('Floor: ' + floor, WIDTH / 2, HEIGHT / 2 + 40);

        ctx.fillStyle = '#FFFF00';
        ctx.fillText('Press SPACE to Restart', WIDTH / 2, HEIGHT / 2 + 100);

        ctx.textAlign = 'left';
    }

    function renderVictory() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', WIDTH / 2, HEIGHT / 2 - 50);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText('Final Score: ' + score, WIDTH / 2, HEIGHT / 2 + 10);

        ctx.fillStyle = '#FFFF00';
        ctx.fillText('Press SPACE to Play Again', WIDTH / 2, HEIGHT / 2 + 100);

        ctx.textAlign = 'left';
    }

    // ========================================================================
    // GAME INIT
    // ========================================================================
    function startGame() {
        gameState = 'playing';
        gamePaused = true;
        floor = 1;
        score = 0;
        multiplier = 1.0;
        waveNumber = 0;
        waveTimer = 1;
        roomsCleared = 0;
        bossSpawned = false;

        ship = new Ship();
        bullets = [];
        enemyBullets = [];
        enemies = [];
        pickups = [];
        particles = [];
    }

    function init() {
        startGame();
        gameState = 'menu';

        document.addEventListener('keydown', (e) => {
            if (gameState === 'menu' && e.key === ' ') {
                startGame();
                gamePaused = false;
            }
            if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
                startGame();
                gamePaused = false;
            }
        });

        requestAnimationFrame(gameLoop);
    }

    // ========================================================================
    // HARNESS
    // ========================================================================
    function simulateKeyDown(key) {
        activeHarnessKeys.add(key);
        keysJustPressed[key.toLowerCase()] = true;
        keysJustPressed[key] = true;
    }

    function simulateKeyUp(key) {
        activeHarnessKeys.delete(key);
    }

    function releaseAllHarnessKeys() {
        activeHarnessKeys.clear();
    }

    window.harness = {
        pause: () => { gamePaused = true; releaseAllHarnessKeys(); },
        resume: () => { gamePaused = false; },
        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                if (action.keys) {
                    for (const key of action.keys) simulateKeyDown(key);
                }
                gamePaused = false;
                setTimeout(() => {
                    releaseAllHarnessKeys();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => ({
            gameState,
            gamePaused,
            floor,
            score,
            multiplier,
            waveNumber,
            player: ship ? {
                x: ship.x,
                y: ship.y,
                hp: ship.hp,
                maxHP: ship.maxHP,
                bombs: ship.bombs,
                weapon: ship.weapon.name,
                ammo: ship.ammo,
                isInvincible: ship.isInvincible,
                isDashing: ship.isDashing,
                isFocused: ship.isFocused
            } : null,
            enemies: enemies.map(e => ({
                x: e.x, y: e.y, type: e.type, hp: e.hp, maxHp: e.maxHp
            })),
            enemyBullets: enemyBullets.length,
            playerBullets: bullets.length,
            pickups: pickups.map(p => ({ x: p.x, y: p.y, type: p.type }))
        }),

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'playing') return 'playing';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (ship) ship.hp = hp; },
            setPosition: (x, y) => { if (ship) { ship.x = x; ship.y = y; } },
            setGodMode: (enabled) => { if (ship) ship.isInvincible = enabled; },
            skipToLevel: (floorNum) => { floor = floorNum; },
            spawnEnemy: (type, x, y) => { enemies.push(new Enemy(x, y, type)); },
            clearEnemies: () => { enemies = []; enemyBullets = []; },
            giveItem: (itemId) => {
                if (WEAPONS[itemId]) {
                    ship.weapon = { ...WEAPONS[itemId] };
                    ship.ammo = ship.weapon.maxAmmo || Infinity;
                }
            },
            forceStart: () => { startGame(); gamePaused = true; },
            forceGameOver: () => { gameState = 'gameover'; },
            forceVictory: () => { gameState = 'victory'; },
            log: (msg) => { console.log('[HARNESS]', msg); }
        },

        version: '1.0',
        gameInfo: {
            name: 'Star of Providence Clone',
            type: 'bullet_hell',
            controls: {
                movement: ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                fire: ['Space', ' '],
                actions: { focus: 'Shift', bomb: 'x', dash: 'z' }
            }
        }
    };

    console.log('[HARNESS] Star of Providence test harness initialized');
    init();
})();
