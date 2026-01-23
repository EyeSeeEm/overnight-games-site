// ============================================================================
// STATION BREACH - Twin-Stick Survival Horror Shooter
// ============================================================================

(function() {
    'use strict';

    // ========================================================================
    // CONSTANTS
    // ========================================================================
    const TILE_SIZE = 32;
    const SCREEN_WIDTH = 1280;
    const SCREEN_HEIGHT = 720;
    const VIEWPORT_WIDTH = 800;
    const VIEWPORT_HEIGHT = 600;

    // Colors
    const COLORS = {
        floor: '#2A2A2A',
        wall: '#4A4A4A',
        wallHighlight: '#5A5A5A',
        player: '#00AAFF',
        playerOutline: '#0066AA',
        enemy: '#FF4444',
        enemySpitter: '#88FF00',
        enemyLurker: '#AA00FF',
        enemyBrute: '#FF8800',
        enemyExploder: '#FFFF00',
        enemyMatriarch: '#FF00AA',
        enemyElite: '#FF0044',
        boss: '#FF0000',
        bullet: '#FFFF00',
        enemyBullet: '#00FF88',
        health: '#FF4444',
        shield: '#4488FF',
        credits: '#FFDD00',
        doorGreen: '#00FF00',
        doorBlue: '#0088FF',
        doorYellow: '#FFFF00',
        doorRed: '#FF0000',
        doorNormal: '#888888',
        terminal: '#00FFFF',
        pickup: '#FFFFFF',
        muzzleFlash: '#FFAA00',
        explosion: '#FF6600',
        acid: '#00FF88',
        darkness: 'rgba(0,0,0,0.95)'
    };

    // ========================================================================
    // GAME STATE
    // ========================================================================
    let gameState = 'menu'; // menu, playing, paused, gameover, victory, shop
    let gamePaused = true; // For harness
    let currentDeck = 1;
    let selfDestructTimer = 600; // 10 minutes in seconds
    let selfDestructActive = false;
    let screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };
    let lastAmmoWarning = 0;

    // Camera
    let camera = { x: 0, y: 0 };

    // Input state
    let keys = {};
    let mouse = { x: 0, y: 0, down: false };
    let activeHarnessKeys = new Set();

    // Game objects
    let player = null;
    let enemies = [];
    let bullets = [];
    let pickups = [];
    let particles = [];
    let doors = [];
    let terminals = [];
    let rooms = [];
    let currentLevel = null;
    let visibleTiles = new Set();

    // ========================================================================
    // CANVAS SETUP
    // ========================================================================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const uiCanvas = document.getElementById('uiCanvas');
    const uiCtx = uiCanvas.getContext('2d');

    // ========================================================================
    // WEAPON DEFINITIONS
    // ========================================================================
    const WEAPONS = {
        pistol: {
            name: 'Pistol',
            damage: 15,
            fireRate: 4, // shots per second
            magSize: 12,
            reloadTime: 950, // ms (reduced by 250)
            projectileSpeed: 800,
            spread: 3,
            range: 500,
            ammoType: '9mm',
            screenShake: 1, // reduced by 50%
            infinite: true
        },
        shotgun: {
            name: 'Shotgun',
            damage: 8,
            pellets: 6,
            fireRate: 1.2,
            magSize: 8,
            reloadTime: 2250,
            projectileSpeed: 600,
            spread: 25,
            range: 250,
            ammoType: 'shells',
            screenShake: 4
        },
        smg: {
            name: 'SMG',
            damage: 10,
            fireRate: 12,
            magSize: 40,
            reloadTime: 1550,
            projectileSpeed: 700,
            spread: 8,
            range: 400,
            ammoType: '9mm',
            screenShake: 0.75
        },
        assaultRifle: {
            name: 'Assault Rifle',
            damage: 20,
            fireRate: 6,
            magSize: 30,
            reloadTime: 1750,
            projectileSpeed: 850,
            spread: 5,
            range: 600,
            ammoType: 'rifle',
            screenShake: 1.5
        },
        flamethrower: {
            name: 'Flamethrower',
            damage: 5,
            fireRate: 30,
            magSize: 100,
            reloadTime: 2750,
            projectileSpeed: 400,
            spread: 15,
            range: 200,
            ammoType: 'fuel',
            screenShake: 0.25,
            continuous: true
        },
        plasmaRifle: {
            name: 'Plasma Rifle',
            damage: 40,
            fireRate: 2,
            magSize: 20,
            reloadTime: 2250,
            projectileSpeed: 500,
            spread: 0,
            range: 700,
            ammoType: 'plasma',
            screenShake: 2
        },
        rocketLauncher: {
            name: 'Rocket Launcher',
            damage: 100,
            splashDamage: 50,
            splashRadius: 80,
            fireRate: 0.8,
            magSize: 4,
            reloadTime: 3250,
            projectileSpeed: 350,
            spread: 0,
            range: 800,
            ammoType: 'rockets',
            screenShake: 7.5,
            explosive: true
        }
    };

    // ========================================================================
    // ENEMY DEFINITIONS
    // ========================================================================
    const ENEMY_TYPES = {
        drone: {
            name: 'Drone',
            hp: 20,
            damage: 10,
            speed: 120,
            size: 12,
            color: COLORS.enemy,
            behavior: 'rush',
            detectionRange: 300,
            attackCooldown: 1000,
            credits: 5
        },
        spitter: {
            name: 'Spitter',
            hp: 30,
            damage: 15,
            speed: 80,
            size: 14,
            color: COLORS.enemySpitter,
            behavior: 'ranged',
            detectionRange: 400,
            attackCooldown: 2000,
            preferredDistance: 250,
            retreatDistance: 150,
            projectileSpeed: 300,
            credits: 10
        },
        lurker: {
            name: 'Lurker',
            hp: 40,
            damage: 20,
            speed: 200,
            size: 12,
            color: COLORS.enemyLurker,
            behavior: 'ambush',
            detectionRange: 100,
            attackCooldown: 800,
            lungeSpeed: 300,
            credits: 15
        },
        brute: {
            name: 'Brute',
            hp: 100,
            damage: 30,
            speed: 60,
            size: 22,
            color: COLORS.enemyBrute,
            behavior: 'charge',
            detectionRange: 250,
            attackCooldown: 1500,
            chargeSpeed: 250,
            chargeDuration: 1500,
            credits: 30,
            knockbackImmune: true
        },
        exploder: {
            name: 'Exploder',
            hp: 15,
            damage: 50,
            speed: 150,
            size: 12,
            color: COLORS.enemyExploder,
            behavior: 'suicide',
            detectionRange: 350,
            explosionRadius: 80,
            credits: 5
        },
        matriarch: {
            name: 'Matriarch',
            hp: 80,
            damage: 25,
            speed: 100,
            size: 18,
            color: COLORS.enemyMatriarch,
            behavior: 'spawner',
            detectionRange: 300,
            spawnInterval: 5000,
            maxSpawns: 4,
            credits: 50
        },
        eliteDrone: {
            name: 'Elite Drone',
            hp: 50,
            damage: 15,
            speed: 150,
            size: 14,
            color: COLORS.enemyElite,
            behavior: 'rush',
            detectionRange: 350,
            attackCooldown: 800,
            credits: 25,
            armor: 0.1
        }
    };

    // ========================================================================
    // PLAYER CLASS
    // ========================================================================
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 14;
            this.speed = 180;
            this.sprintSpeed = 270;
            this.health = 100;
            this.maxHealth = 100;
            this.shield = 0;
            this.maxShield = 0;
            this.stamina = 100;
            this.maxStamina = 100;
            this.staminaDrain = 25;
            this.staminaRegen = 20;
            this.angle = 0;
            this.isSprinting = false;
            this.invincibleTime = 0;

            // Weapons
            this.weapons = ['pistol'];
            this.currentWeaponIndex = 0;
            this.ammo = {
                '9mm': 300,
                'shells': 0,
                'rifle': 0,
                'fuel': 0,
                'plasma': 0,
                'rockets': 0
            };
            this.currentMag = 12;
            this.isReloading = false;
            this.reloadEndTime = 0;
            this.lastFireTime = 0;

            // Inventory
            this.credits = 0;
            this.keycards = [];
            this.medkits = 0;

            // Upgrades
            this.damageBoost = 1.0;
            this.reloadSpeedBoost = 1.0;
            this.ammoCapacityBoost = 1.0;

            // Melee fallback
            this.meleeCooldown = 0;
            this.meleeRange = 50;
            this.meleeDamage = 15;
        }

        get currentWeapon() {
            return WEAPONS[this.weapons[this.currentWeaponIndex]];
        }

        get currentWeaponKey() {
            return this.weapons[this.currentWeaponIndex];
        }

        hasKeycard(color) {
            const hierarchy = ['green', 'blue', 'yellow', 'red'];
            const requiredLevel = hierarchy.indexOf(color);
            return this.keycards.some(k => hierarchy.indexOf(k) >= requiredLevel);
        }

        switchWeapon(direction) {
            this.currentWeaponIndex = (this.currentWeaponIndex + direction + this.weapons.length) % this.weapons.length;
            this.isReloading = false;
            const weapon = this.currentWeapon;
            this.currentMag = Math.min(this.currentMag, weapon.magSize);
        }

        reload() {
            if (this.isReloading) return;
            const weapon = this.currentWeapon;
            if (weapon.infinite) {
                this.isReloading = true;
                this.reloadEndTime = Date.now() + weapon.reloadTime * this.reloadSpeedBoost;
                return;
            }
            const ammoNeeded = weapon.magSize - this.currentMag;
            const ammoAvailable = this.ammo[weapon.ammoType];
            if (ammoAvailable > 0 && ammoNeeded > 0) {
                this.isReloading = true;
                this.reloadEndTime = Date.now() + weapon.reloadTime * this.reloadSpeedBoost;
            }
        }

        finishReload() {
            const weapon = this.currentWeapon;
            if (weapon.infinite) {
                this.currentMag = weapon.magSize;
            } else {
                const ammoNeeded = weapon.magSize - this.currentMag;
                const ammoToLoad = Math.min(ammoNeeded, this.ammo[weapon.ammoType]);
                this.ammo[weapon.ammoType] -= ammoToLoad;
                this.currentMag += ammoToLoad;
            }
            this.isReloading = false;
        }

        canFire() {
            const weapon = this.currentWeapon;
            const now = Date.now();
            const fireInterval = 1000 / weapon.fireRate;
            return !this.isReloading &&
                   this.currentMag > 0 &&
                   now - this.lastFireTime >= fireInterval;
        }

        hasAnyAmmo() {
            if (this.currentMag > 0) return true;
            const weapon = this.currentWeapon;
            if (weapon.infinite) return true;
            return this.ammo[weapon.ammoType] > 0;
        }

        fire() {
            if (!this.canFire()) {
                // Check for out of ammo
                if (this.currentMag === 0 && !this.hasAnyAmmo()) {
                    const now = Date.now();
                    if (now - lastAmmoWarning > 1000) {
                        lastAmmoWarning = now;
                        showFloatingText(this.x, this.y - 30, 'OUT OF AMMO!', '#FF4444');
                    }
                }
                return false;
            }

            const weapon = this.currentWeapon;
            this.currentMag--;
            this.lastFireTime = Date.now();

            // Screen shake
            triggerScreenShake(weapon.screenShake, 0.05);

            // Create bullets
            const pellets = weapon.pellets || 1;
            for (let i = 0; i < pellets; i++) {
                const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
                const angle = this.angle + spread;
                bullets.push(new Bullet(
                    this.x + Math.cos(this.angle) * 20,
                    this.y + Math.sin(this.angle) * 20,
                    angle,
                    weapon.projectileSpeed,
                    weapon.damage * this.damageBoost,
                    weapon.range,
                    true,
                    weapon.explosive ? weapon : null
                ));
            }

            // Create muzzle flash particle
            createMuzzleFlash(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25
            );

            // Sound event for enemy AI
            createSoundEvent(this.x, this.y, 400);

            // Auto reload
            if (this.currentMag === 0) {
                this.reload();
            }

            return true;
        }

        melee() {
            if (this.meleeCooldown > 0) return false;
            this.meleeCooldown = 500;

            // Find enemies in melee range
            for (const enemy of enemies) {
                const dist = distance(this.x, this.y, enemy.x, enemy.y);
                if (dist < this.meleeRange + enemy.size) {
                    const angleDiff = Math.abs(normalizeAngle(Math.atan2(enemy.y - this.y, enemy.x - this.x) - this.angle));
                    if (angleDiff < Math.PI / 2) {
                        enemy.takeDamage(this.meleeDamage);
                        createHitSparks(enemy.x, enemy.y);
                        showFloatingText(enemy.x, enemy.y - 20, '-' + this.meleeDamage, '#FFAA00');
                    }
                }
            }

            showFloatingText(this.x, this.y - 30, 'MELEE!', '#FFAA00');
            return true;
        }

        takeDamage(amount) {
            if (this.invincibleTime > 0) return;

            // Shield absorbs first
            if (this.shield > 0) {
                const shieldDamage = Math.min(amount, this.shield);
                this.shield -= shieldDamage;
                amount -= shieldDamage;
            }

            this.health -= amount;
            this.invincibleTime = 1000; // 1 second i-frames
            triggerScreenShake(5, 0.2);

            if (this.health <= 0) {
                this.health = 0;
                gameState = 'gameover';
            }
        }

        update(dt) {
            // Update invincibility
            if (this.invincibleTime > 0) {
                this.invincibleTime -= dt * 1000;
            }

            // Update melee cooldown
            if (this.meleeCooldown > 0) {
                this.meleeCooldown -= dt * 1000;
            }

            // Update reload
            if (this.isReloading && Date.now() >= this.reloadEndTime) {
                this.finishReload();
            }

            // Movement
            let dx = 0, dy = 0;
            if (isKeyDown('w') || isKeyDown('ArrowUp')) dy -= 1;
            if (isKeyDown('s') || isKeyDown('ArrowDown')) dy += 1;
            if (isKeyDown('a') || isKeyDown('ArrowLeft')) dx -= 1;
            if (isKeyDown('d') || isKeyDown('ArrowRight')) dx += 1;

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            // Sprint
            this.isSprinting = isKeyDown('Shift') && this.stamina > 0 && (dx !== 0 || dy !== 0);
            const speed = this.isSprinting ? this.sprintSpeed : this.speed;

            if (this.isSprinting) {
                this.stamina -= this.staminaDrain * dt;
            } else {
                this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
            }

            // Apply movement with collision
            const newX = this.x + dx * speed * dt;
            const newY = this.y + dy * speed * dt;

            if (!checkWallCollision(newX, this.y, this.size)) {
                this.x = newX;
            }
            if (!checkWallCollision(this.x, newY, this.size)) {
                this.y = newY;
            }

            // Aim at mouse
            const worldMouse = screenToWorld(mouse.x, mouse.y);
            this.angle = Math.atan2(worldMouse.y - this.y, worldMouse.x - this.x);

            // Firing
            if (mouse.down || isKeyDown('Space')) {
                if (!this.fire() && !this.hasAnyAmmo()) {
                    this.melee();
                }
            }

            // Reload
            if (isKeyDown('r') && !this.isReloading) {
                this.reload();
            }

            // Switch weapon
            if (keyJustPressed('q')) {
                this.switchWeapon(1);
            }

            // Use medkit
            if (keyJustPressed('h') && this.medkits > 0 && this.health < this.maxHealth) {
                this.medkits--;
                this.health = Math.min(this.maxHealth, this.health + 50);
                showFloatingText(this.x, this.y - 30, '+50 HP', '#00FF00');
            }
        }

        render(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Flash when invincible
            if (this.invincibleTime > 0 && Math.floor(this.invincibleTime / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            // Body
            ctx.fillStyle = COLORS.player;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Direction indicator (gun)
            ctx.fillStyle = COLORS.playerOutline;
            ctx.fillRect(this.size - 5, -3, 15, 6);

            ctx.restore();
        }
    }

    // ========================================================================
    // BULLET CLASS
    // ========================================================================
    class Bullet {
        constructor(x, y, angle, speed, damage, range, isPlayerBullet, explosiveData = null) {
            this.x = x;
            this.y = y;
            this.startX = x;
            this.startY = y;
            this.angle = angle;
            this.speed = speed;
            this.damage = damage;
            this.range = range;
            this.isPlayerBullet = isPlayerBullet;
            this.explosiveData = explosiveData;
            this.size = isPlayerBullet ? 4 : 6;
            this.dead = false;
        }

        update(dt) {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

            // Check range
            const dist = distance(this.x, this.y, this.startX, this.startY);
            if (dist > this.range) {
                this.dead = true;
                return;
            }

            // Check wall collision
            if (checkWallCollision(this.x, this.y, 2)) {
                this.dead = true;
                if (this.explosiveData) {
                    createExplosion(this.x, this.y, this.explosiveData.splashRadius, this.explosiveData.splashDamage);
                }
                return;
            }

            // Check entity collision
            if (this.isPlayerBullet) {
                for (const enemy of enemies) {
                    if (distance(this.x, this.y, enemy.x, enemy.y) < enemy.size + this.size) {
                        enemy.takeDamage(this.damage);
                        this.dead = true;
                        createHitSparks(this.x, this.y);
                        if (this.explosiveData) {
                            createExplosion(this.x, this.y, this.explosiveData.splashRadius, this.explosiveData.splashDamage);
                        }
                        return;
                    }
                }
            } else {
                if (distance(this.x, this.y, player.x, player.y) < player.size + this.size) {
                    player.takeDamage(this.damage);
                    this.dead = true;
                    return;
                }
            }
        }

        render(ctx) {
            ctx.fillStyle = this.isPlayerBullet ? COLORS.bullet : COLORS.enemyBullet;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.strokeStyle = this.isPlayerBullet ? 'rgba(255,255,0,0.5)' : 'rgba(0,255,136,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - Math.cos(this.angle) * 20,
                this.y - Math.sin(this.angle) * 20
            );
            ctx.stroke();
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
            this.damage = def.damage;
            this.speed = def.speed;
            this.size = def.size;
            this.color = def.color;
            this.behavior = def.behavior;
            this.detectionRange = def.detectionRange;
            this.attackCooldown = def.attackCooldown || 1000;
            this.lastAttackTime = 0;
            this.credits = def.credits;
            this.armor = def.armor || 0;
            this.knockbackImmune = def.knockbackImmune || false;
            this.angle = Math.random() * Math.PI * 2;
            this.state = 'idle'; // idle, alert, attacking, charging, fleeing
            this.stateTimer = 0;
            this.dead = false;
            this.targetX = x;
            this.targetY = y;
            this.alertedBySound = false;
            this.soundTargetX = 0;
            this.soundTargetY = 0;

            // Behavior-specific
            if (def.behavior === 'spawner') {
                this.spawnInterval = def.spawnInterval;
                this.maxSpawns = def.maxSpawns;
                this.activeSpawns = 0;
                this.lastSpawnTime = 0;
            }
            if (def.behavior === 'charge') {
                this.chargeSpeed = def.chargeSpeed;
                this.chargeDuration = def.chargeDuration;
            }
            if (def.behavior === 'ranged') {
                this.preferredDistance = def.preferredDistance;
                this.retreatDistance = def.retreatDistance;
                this.projectileSpeed = def.projectileSpeed;
            }
            if (def.behavior === 'ambush') {
                this.lungeSpeed = def.lungeSpeed;
                this.hidden = true;
            }
            if (def.behavior === 'suicide') {
                this.explosionRadius = def.explosionRadius;
            }
        }

        hasLineOfSight() {
            return hasLineOfSight(this.x, this.y, player.x, player.y);
        }

        takeDamage(amount) {
            amount *= (1 - this.armor);
            this.hp -= amount;
            showFloatingText(this.x, this.y - this.size - 10, '-' + Math.round(amount), '#FF4444');

            if (this.hp <= 0) {
                this.die();
            } else if (!this.knockbackImmune) {
                // Knockback
                const angle = Math.atan2(this.y - player.y, this.x - player.x);
                this.x += Math.cos(angle) * 20;
                this.y += Math.sin(angle) * 20;
            }

            // Become alert
            if (this.state === 'idle') {
                this.state = 'alert';
            }
        }

        die() {
            this.dead = true;

            // Drop loot
            player.credits += this.credits;
            showFloatingText(this.x, this.y - 20, '+$' + this.credits, COLORS.credits);

            // Chance for drops
            if (Math.random() < 0.25) {
                pickups.push(new Pickup(this.x, this.y, 'ammo'));
            }
            if (Math.random() < 0.15) {
                pickups.push(new Pickup(this.x, this.y, 'health'));
            }

            // Exploder death explosion
            if (this.behavior === 'suicide') {
                createExplosion(this.x, this.y, this.explosionRadius, this.damage);
            }

            // Death particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    this.x, this.y,
                    Math.random() * Math.PI * 2,
                    Math.random() * 100 + 50,
                    this.color,
                    0.5
                ));
            }
        }

        alertBySound(x, y) {
            if (this.state === 'idle' || this.alertedBySound) {
                this.alertedBySound = true;
                this.soundTargetX = x;
                this.soundTargetY = y;
                this.state = 'alert';
            }
        }

        update(dt) {
            const distToPlayer = distance(this.x, this.y, player.x, player.y);
            const canSeePlayer = distToPlayer < this.detectionRange && this.hasLineOfSight();
            const facingPlayer = this.isFacingPlayer();

            this.stateTimer += dt * 1000;

            switch (this.behavior) {
                case 'rush':
                    this.updateRush(dt, distToPlayer, canSeePlayer, facingPlayer);
                    break;
                case 'ranged':
                    this.updateRanged(dt, distToPlayer, canSeePlayer, facingPlayer);
                    break;
                case 'ambush':
                    this.updateAmbush(dt, distToPlayer, canSeePlayer);
                    break;
                case 'charge':
                    this.updateCharge(dt, distToPlayer, canSeePlayer, facingPlayer);
                    break;
                case 'suicide':
                    this.updateSuicide(dt, distToPlayer, canSeePlayer);
                    break;
                case 'spawner':
                    this.updateSpawner(dt, distToPlayer, canSeePlayer, facingPlayer);
                    break;
            }

            // Wall collision
            if (checkWallCollision(this.x, this.y, this.size)) {
                // Slide along walls
                const testAngles = [0, Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2];
                for (const offset of testAngles) {
                    const testX = this.x + Math.cos(this.angle + offset) * this.speed * dt;
                    const testY = this.y + Math.sin(this.angle + offset) * this.speed * dt;
                    if (!checkWallCollision(testX, testY, this.size)) {
                        this.x = testX;
                        this.y = testY;
                        break;
                    }
                }
            }
        }

        isFacingPlayer() {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const angleDiff = Math.abs(normalizeAngle(angleToPlayer - this.angle));
            return angleDiff < Math.PI / 3; // 60 degree cone
        }

        moveToward(targetX, targetY, speed, dt) {
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            this.angle = angle;
            const newX = this.x + Math.cos(angle) * speed * dt;
            const newY = this.y + Math.sin(angle) * speed * dt;

            if (!checkWallCollision(newX, this.y, this.size)) {
                this.x = newX;
            }
            if (!checkWallCollision(this.x, newY, this.size)) {
                this.y = newY;
            }
        }

        updateRush(dt, distToPlayer, canSeePlayer, facingPlayer) {
            if (canSeePlayer && facingPlayer) {
                this.state = 'attacking';
                this.moveToward(player.x, player.y, this.speed, dt);

                if (distToPlayer < this.size + player.size + 5) {
                    this.attack();
                }
            } else if (this.alertedBySound) {
                this.moveToward(this.soundTargetX, this.soundTargetY, this.speed, dt);
                if (distance(this.x, this.y, this.soundTargetX, this.soundTargetY) < 30) {
                    this.alertedBySound = false;
                    this.state = 'idle';
                }
            } else {
                // Wander
                if (Math.random() < 0.01) {
                    this.angle = Math.random() * Math.PI * 2;
                }
            }
        }

        updateRanged(dt, distToPlayer, canSeePlayer, facingPlayer) {
            if (canSeePlayer) {
                this.angle = Math.atan2(player.y - this.y, player.x - this.x);

                if (distToPlayer < this.retreatDistance) {
                    // Retreat
                    this.moveToward(
                        this.x - Math.cos(this.angle) * 100,
                        this.y - Math.sin(this.angle) * 100,
                        this.speed,
                        dt
                    );
                } else if (distToPlayer > this.preferredDistance) {
                    // Approach
                    this.moveToward(player.x, player.y, this.speed, dt);
                }

                // Attack
                if (facingPlayer) {
                    this.rangedAttack();
                }
            } else if (this.alertedBySound) {
                this.moveToward(this.soundTargetX, this.soundTargetY, this.speed, dt);
            }
        }

        updateAmbush(dt, distToPlayer, canSeePlayer) {
            if (this.hidden) {
                if (distToPlayer < this.detectionRange) {
                    this.hidden = false;
                    this.state = 'attacking';
                }
            } else {
                // Lunge attack
                this.moveToward(player.x, player.y, this.lungeSpeed, dt);
                if (distToPlayer < this.size + player.size + 5) {
                    this.attack();
                }
            }
        }

        updateCharge(dt, distToPlayer, canSeePlayer, facingPlayer) {
            if (this.state === 'charging') {
                this.x += Math.cos(this.angle) * this.chargeSpeed * dt;
                this.y += Math.sin(this.angle) * this.chargeSpeed * dt;

                if (distToPlayer < this.size + player.size) {
                    player.takeDamage(this.damage);
                    this.state = 'stunned';
                    this.stateTimer = 0;
                }

                if (this.stateTimer > this.chargeDuration || checkWallCollision(this.x, this.y, this.size)) {
                    this.state = 'stunned';
                    this.stateTimer = 0;
                }
            } else if (this.state === 'stunned') {
                if (this.stateTimer > 1000) {
                    this.state = 'idle';
                }
            } else if (canSeePlayer && distToPlayer < 200 && facingPlayer) {
                // Prepare to charge
                this.state = 'charging';
                this.stateTimer = 0;
                this.angle = Math.atan2(player.y - this.y, player.x - this.x);
            } else if (canSeePlayer) {
                this.moveToward(player.x, player.y, this.speed, dt);
            }
        }

        updateSuicide(dt, distToPlayer, canSeePlayer) {
            if (canSeePlayer || this.alertedBySound) {
                const target = canSeePlayer ? { x: player.x, y: player.y } : { x: this.soundTargetX, y: this.soundTargetY };
                this.moveToward(target.x, target.y, this.speed, dt);

                if (distToPlayer < this.size + player.size + 10) {
                    this.die(); // Triggers explosion
                }
            }
        }

        updateSpawner(dt, distToPlayer, canSeePlayer, facingPlayer) {
            // Flee if low health
            if (this.hp < this.maxHp * 0.3) {
                const fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);
                this.moveToward(
                    this.x + Math.cos(fleeAngle) * 100,
                    this.y + Math.sin(fleeAngle) * 100,
                    this.speed * 1.2,
                    dt
                );
            } else if (canSeePlayer) {
                // Spawn drones
                const now = Date.now();
                if (now - this.lastSpawnTime > this.spawnInterval && this.activeSpawns < this.maxSpawns) {
                    this.spawnDrone();
                    this.lastSpawnTime = now;
                }

                // Keep distance
                if (distToPlayer < 150) {
                    this.moveToward(
                        this.x - Math.cos(this.angle) * 50,
                        this.y - Math.sin(this.angle) * 50,
                        this.speed,
                        dt
                    );
                }

                // Melee if close
                if (distToPlayer < this.size + player.size + 5 && facingPlayer) {
                    this.attack();
                }
            }
        }

        spawnDrone() {
            const angle = Math.random() * Math.PI * 2;
            const spawnX = this.x + Math.cos(angle) * 30;
            const spawnY = this.y + Math.sin(angle) * 30;
            const drone = new Enemy(spawnX, spawnY, 'drone');
            drone.parentMatriarch = this;
            enemies.push(drone);
            this.activeSpawns++;
            showFloatingText(spawnX, spawnY, 'SPAWN!', '#FF00AA');
        }

        attack() {
            const now = Date.now();
            if (now - this.lastAttackTime < this.attackCooldown) return;
            this.lastAttackTime = now;
            player.takeDamage(this.damage);
        }

        rangedAttack() {
            const now = Date.now();
            if (now - this.lastAttackTime < this.attackCooldown) return;
            this.lastAttackTime = now;

            bullets.push(new Bullet(
                this.x,
                this.y,
                this.angle,
                this.projectileSpeed,
                this.damage,
                400,
                false
            ));
        }

        render(ctx) {
            if (this.hidden) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Direction indicator
            ctx.fillStyle = '#000';
            ctx.fillRect(this.size - 4, -2, 8, 4);

            ctx.restore();

            // Health bar
            if (this.hp < this.maxHp) {
                ctx.fillStyle = '#333';
                ctx.fillRect(this.x - 15, this.y - this.size - 8, 30, 4);
                ctx.fillStyle = COLORS.health;
                ctx.fillRect(this.x - 15, this.y - this.size - 8, 30 * (this.hp / this.maxHp), 4);
            }

            // Exploder glow
            if (this.behavior === 'suicide') {
                const distToPlayer = distance(this.x, this.y, player.x, player.y);
                const glowIntensity = Math.max(0, 1 - distToPlayer / 200);
                ctx.fillStyle = `rgba(255,255,0,${glowIntensity * 0.5})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ========================================================================
    // PICKUP CLASS
    // ========================================================================
    class Pickup {
        constructor(x, y, type, subtype = null) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.subtype = subtype;
            this.size = 10;
            this.bobOffset = Math.random() * Math.PI * 2;
            this.collected = false;
        }

        update(dt) {
            this.bobOffset += dt * 3;

            // Check pickup
            if (distance(this.x, this.y, player.x, player.y) < player.size + this.size + 10) {
                this.collect();
            }
        }

        collect() {
            this.collected = true;

            switch (this.type) {
                case 'health':
                    const healAmount = 25;
                    player.health = Math.min(player.maxHealth, player.health + healAmount);
                    showFloatingText(this.x, this.y, '+' + healAmount + ' HP', '#00FF00');
                    break;
                case 'ammo':
                    const ammoTypes = Object.keys(player.ammo);
                    const randomAmmo = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    player.ammo[randomAmmo] += 30;
                    showFloatingText(this.x, this.y, '+30 ' + randomAmmo, '#FFAA00');
                    break;
                case 'credits':
                    const creditAmount = this.subtype || 25;
                    player.credits += creditAmount;
                    showFloatingText(this.x, this.y, '+$' + creditAmount, COLORS.credits);
                    break;
                case 'keycard':
                    if (!player.keycards.includes(this.subtype)) {
                        player.keycards.push(this.subtype);
                        showFloatingText(this.x, this.y, this.subtype.toUpperCase() + ' KEYCARD', getKeycardColor(this.subtype));
                    }
                    break;
                case 'weapon':
                    if (!player.weapons.includes(this.subtype)) {
                        player.weapons.push(this.subtype);
                        const weaponName = WEAPONS[this.subtype].name;
                        showFloatingText(this.x, this.y, 'NEW: ' + weaponName, '#00FFFF');
                    }
                    break;
                case 'medkit':
                    player.medkits++;
                    showFloatingText(this.x, this.y, '+1 MEDKIT', '#00FF00');
                    break;
            }
        }

        render(ctx) {
            const bob = Math.sin(this.bobOffset) * 3;

            ctx.save();
            ctx.translate(this.x, this.y + bob);

            switch (this.type) {
                case 'health':
                    ctx.fillStyle = '#FF4444';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(-2, -6, 4, 12);
                    ctx.fillRect(-6, -2, 12, 4);
                    break;
                case 'ammo':
                    ctx.fillStyle = '#FFAA00';
                    ctx.fillRect(-6, -8, 12, 16);
                    ctx.fillStyle = '#AA6600';
                    ctx.fillRect(-4, -6, 8, 3);
                    break;
                case 'credits':
                    ctx.fillStyle = COLORS.credits;
                    ctx.beginPath();
                    ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('$', 0, 4);
                    break;
                case 'keycard':
                    ctx.fillStyle = getKeycardColor(this.subtype);
                    ctx.fillRect(-10, -6, 20, 12);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(-8, -2, 6, 4);
                    break;
                case 'weapon':
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillRect(-12, -4, 24, 8);
                    break;
                case 'medkit':
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(-10, -10, 20, 20);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(-2, -8, 4, 16);
                    ctx.fillRect(-8, -2, 16, 4);
                    break;
            }

            ctx.restore();
        }
    }

    // ========================================================================
    // DOOR CLASS
    // ========================================================================
    class Door {
        constructor(x, y, width, height, keycardRequired = null, targetRoom = null) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.keycardRequired = keycardRequired;
            this.targetRoom = targetRoom;
            this.isOpen = false;
            this.isVertical = height > width;
            this.interactRadius = 40;
        }

        canOpen() {
            if (!this.keycardRequired) return true;
            return player.hasKeycard(this.keycardRequired);
        }

        tryOpen() {
            if (this.isOpen) return true;
            if (this.canOpen()) {
                this.isOpen = true;
                showFloatingText(this.x, this.y, 'DOOR OPENED', '#00FF00');
                return true;
            } else {
                showFloatingText(this.x, this.y, 'NEED ' + this.keycardRequired.toUpperCase() + ' KEYCARD', getKeycardColor(this.keycardRequired));
                return false;
            }
        }

        isPlayerNearby() {
            return distance(player.x, player.y, this.x + this.width/2, this.y + this.height/2) < this.interactRadius;
        }

        render(ctx) {
            if (this.isOpen) {
                ctx.fillStyle = COLORS.floor;
            } else if (this.keycardRequired) {
                ctx.fillStyle = getKeycardColor(this.keycardRequired);
            } else {
                ctx.fillStyle = COLORS.doorNormal;
            }

            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Door frame
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Prompt
            if (!this.isOpen && this.isPlayerNearby()) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                const text = this.canOpen() ? 'SPACE to open' : 'LOCKED';
                ctx.fillText(text, this.x + this.width/2, this.y - 10);
            }
        }
    }

    // ========================================================================
    // TERMINAL CLASS
    // ========================================================================
    class Terminal {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 20;
            this.interactRadius = 50;
        }

        isPlayerNearby() {
            return distance(player.x, player.y, this.x, this.y) < this.interactRadius;
        }

        render(ctx) {
            ctx.fillStyle = COLORS.terminal;
            ctx.fillRect(this.x - 15, this.y - 20, 30, 40);
            ctx.fillStyle = '#003333';
            ctx.fillRect(this.x - 12, this.y - 17, 24, 25);

            // Screen glow
            ctx.fillStyle = 'rgba(0,255,255,0.3)';
            ctx.fillRect(this.x - 10, this.y - 15, 20, 20);

            // Prompt
            if (this.isPlayerNearby()) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('E to use INTEX Terminal', this.x, this.y - 30);
            }
        }
    }

    // ========================================================================
    // PARTICLE CLASS
    // ========================================================================
    class Particle {
        constructor(x, y, angle, speed, color, lifetime) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.speed = speed;
            this.color = color;
            this.lifetime = lifetime;
            this.maxLifetime = lifetime;
            this.size = 3;
        }

        update(dt) {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
            this.lifetime -= dt;
            this.speed *= 0.95;
        }

        render(ctx) {
            const alpha = this.lifetime / this.maxLifetime;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ========================================================================
    // LEVEL GENERATION
    // ========================================================================
    function generateLevel(deckNumber) {
        const level = {
            deck: deckNumber,
            width: 0,
            height: 0,
            tiles: [],
            rooms: [],
            spawnPoints: []
        };

        // Room sizes based on deck - more rooms with enemies
        const roomCounts = [6, 8, 10, 9][deckNumber - 1];
        const roomSize = { min: 6, max: 10 }; // Smaller rooms

        // Generate rooms - tighter grid
        const gridSize = 3;
        const cellSize = 12; // Much tighter spacing

        for (let i = 0; i < roomCounts; i++) {
            const gx = i % gridSize;
            const gy = Math.floor(i / gridSize);

            const roomW = Math.floor(Math.random() * (roomSize.max - roomSize.min)) + roomSize.min;
            const roomH = Math.floor(Math.random() * (roomSize.max - roomSize.min)) + roomSize.min;
            const roomX = gx * cellSize + Math.floor(Math.random() * 3);
            const roomY = gy * cellSize + Math.floor(Math.random() * 3);

            level.rooms.push({
                x: roomX,
                y: roomY,
                width: roomW,
                height: roomH,
                index: i,
                cleared: false,
                type: getRoomType(i, roomCounts, deckNumber)
            });
        }

        // Calculate level size
        let maxX = 0, maxY = 0;
        for (const room of level.rooms) {
            maxX = Math.max(maxX, room.x + room.width + 2);
            maxY = Math.max(maxY, room.y + room.height + 2);
        }
        level.width = maxX;
        level.height = maxY;

        // Initialize tiles
        level.tiles = [];
        for (let y = 0; y < level.height; y++) {
            level.tiles[y] = [];
            for (let x = 0; x < level.width; x++) {
                level.tiles[y][x] = 1; // Wall
            }
        }

        // Carve rooms
        for (const room of level.rooms) {
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    if (y >= 0 && y < level.height && x >= 0 && x < level.width) {
                        level.tiles[y][x] = 0; // Floor
                    }
                }
            }

            // Add room contents
            addRoomContents(room, deckNumber);
        }

        // Connect rooms with corridors
        for (let i = 0; i < level.rooms.length - 1; i++) {
            const room1 = level.rooms[i];
            const room2 = level.rooms[i + 1];

            const x1 = Math.floor(room1.x + room1.width / 2);
            const y1 = Math.floor(room1.y + room1.height / 2);
            const x2 = Math.floor(room2.x + room2.width / 2);
            const y2 = Math.floor(room2.y + room2.height / 2);

            // L-shaped corridor (wider for better visibility)
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                for (let offset = -1; offset <= 1; offset++) {
                    const ty = y1 + offset;
                    if (ty >= 0 && ty < level.height && x >= 0 && x < level.width) {
                        level.tiles[ty][x] = 0;
                    }
                }
            }
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                for (let offset = -1; offset <= 1; offset++) {
                    const tx = x2 + offset;
                    if (y >= 0 && y < level.height && tx >= 0 && tx < level.width) {
                        level.tiles[y][tx] = 0;
                    }
                }
            }

            // Spawn patrol enemies in corridors (except near start)
            if (i > 0 && Math.random() < 0.6) {
                const midX = ((x1 + x2) / 2) * TILE_SIZE;
                const midY = ((y1 + y2) / 2) * TILE_SIZE;
                enemies.push(new Enemy(midX, midY, 'drone'));
            }

            // Add door between sections
            if (room2.type === 'keycard_gate') {
                const doorX = x2 * TILE_SIZE;
                const doorY = Math.min(y1, y2) * TILE_SIZE + (Math.abs(y2 - y1) / 2) * TILE_SIZE;
                const keycardColors = ['green', 'blue', 'yellow', 'red'];
                const keycardIndex = Math.min(Math.floor(i / 2), keycardColors.length - 1);
                doors.push(new Door(doorX, doorY, TILE_SIZE * 2, TILE_SIZE, keycardColors[keycardIndex]));
            }
        }

        return level;
    }

    function getRoomType(index, totalRooms, deck) {
        if (index === 0) return 'start';
        if (index === totalRooms - 1) return 'exit';
        if (index === Math.floor(totalRooms / 2)) return 'keycard_gate';
        if (index === Math.floor(totalRooms / 2) - 1) return 'keycard';
        if (index === 1) return 'terminal'; // Only one terminal, room 1
        return 'combat'; // All other rooms are combat
    }

    function addRoomContents(room, deck) {
        const centerX = (room.x + room.width / 2) * TILE_SIZE;
        const centerY = (room.y + room.height / 2) * TILE_SIZE;

        switch (room.type) {
            case 'start':
                // Spawn a few enemies near the start so player encounters combat immediately
                // These spawn just outside the start room
                const offsetDist = (room.width + 2) * TILE_SIZE;
                enemies.push(new Enemy(centerX + offsetDist, centerY, 'drone'));
                enemies.push(new Enemy(centerX, centerY + offsetDist, 'drone'));
                break;

            case 'keycard':
                const keycardColors = ['green', 'blue', 'yellow', 'red'];
                pickups.push(new Pickup(centerX, centerY, 'keycard', keycardColors[deck - 1]));
                // Guard enemies
                spawnEnemiesInRoom(room, deck, 3);
                break;

            case 'terminal':
                terminals.push(new Terminal(centerX, centerY));
                break;

            case 'combat':
                spawnEnemiesInRoom(room, deck, 5 + deck * 2); // More enemies
                // Add obstacles
                addObstacles(room);
                // Random pickups
                if (Math.random() < 0.5) {
                    const px = room.x * TILE_SIZE + Math.random() * room.width * TILE_SIZE;
                    const py = room.y * TILE_SIZE + Math.random() * room.height * TILE_SIZE;
                    pickups.push(new Pickup(px, py, Math.random() < 0.5 ? 'health' : 'ammo'));
                }
                // Extra credits pickup
                if (Math.random() < 0.3) {
                    const px = room.x * TILE_SIZE + Math.random() * room.width * TILE_SIZE;
                    const py = room.y * TILE_SIZE + Math.random() * room.height * TILE_SIZE;
                    pickups.push(new Pickup(px, py, 'credits', 15));
                }
                break;

            case 'exit':
                // Boss or exit
                if (deck < 4) {
                    doors.push(new Door(centerX - TILE_SIZE, centerY - TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2, null, 'next_deck'));
                } else {
                    // Final boss room
                    spawnBoss(centerX, centerY);
                }
                break;
        }
    }

    function addObstacles(room) {
        const numObstacles = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numObstacles; i++) {
            // Add crates or barrels as obstacles (visual only for now)
        }
    }

    function spawnEnemiesInRoom(room, deck, count) {
        const enemyPool = getEnemyPoolForDeck(deck);

        for (let i = 0; i < count; i++) {
            const ex = (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE;
            const ey = (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE;
            const enemyType = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            enemies.push(new Enemy(ex, ey, enemyType));
        }
    }

    function getEnemyPoolForDeck(deck) {
        switch (deck) {
            case 1: return ['drone', 'drone', 'drone', 'spitter'];
            case 2: return ['drone', 'drone', 'spitter', 'lurker', 'brute'];
            case 3: return ['drone', 'spitter', 'lurker', 'brute', 'exploder', 'matriarch'];
            case 4: return ['drone', 'spitter', 'lurker', 'brute', 'exploder', 'matriarch', 'eliteDrone'];
            default: return ['drone'];
        }
    }

    function spawnBoss(x, y) {
        // Queen boss - simplified for now
        const boss = new Enemy(x, y, 'brute');
        boss.hp = 500;
        boss.maxHp = 500;
        boss.size = 40;
        boss.damage = 40;
        boss.credits = 500;
        boss.isBoss = true;
        enemies.push(boss);
    }

    // ========================================================================
    // RAYCASTING VISION SYSTEM
    // ========================================================================
    function updateVisibility() {
        visibleTiles.clear();

        if (!currentLevel) return;

        const playerTileX = Math.floor(player.x / TILE_SIZE);
        const playerTileY = Math.floor(player.y / TILE_SIZE);
        const viewRadius = 12; // tiles
        const rayCount = 360;

        // Cast rays in all directions
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            castRay(player.x, player.y, angle, viewRadius * TILE_SIZE);
        }
    }

    function castRay(startX, startY, angle, maxDist) {
        const stepSize = TILE_SIZE / 4;
        let x = startX;
        let y = startY;
        let dist = 0;

        while (dist < maxDist) {
            x += Math.cos(angle) * stepSize;
            y += Math.sin(angle) * stepSize;
            dist += stepSize;

            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            const key = `${tileX},${tileY}`;

            visibleTiles.add(key);

            // Stop at walls
            if (isWall(tileX, tileY)) {
                break;
            }
        }
    }

    function isVisible(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        return visibleTiles.has(`${tileX},${tileY}`);
    }

    function hasLineOfSight(x1, y1, x2, y2) {
        const dist = distance(x1, y1, x2, y2);
        const steps = Math.ceil(dist / (TILE_SIZE / 2));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            if (checkWallCollision(x, y, 1)) {
                return false;
            }
        }

        return true;
    }

    // ========================================================================
    // COLLISION DETECTION
    // ========================================================================
    function isWall(tileX, tileY) {
        if (!currentLevel) return true;
        if (tileY < 0 || tileY >= currentLevel.height || tileX < 0 || tileX >= currentLevel.width) {
            return true;
        }
        return currentLevel.tiles[tileY][tileX] === 1;
    }

    function checkWallCollision(x, y, radius) {
        const left = Math.floor((x - radius) / TILE_SIZE);
        const right = Math.floor((x + radius) / TILE_SIZE);
        const top = Math.floor((y - radius) / TILE_SIZE);
        const bottom = Math.floor((y + radius) / TILE_SIZE);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (isWall(tx, ty)) {
                    return true;
                }
            }
        }

        // Check closed doors
        for (const door of doors) {
            if (!door.isOpen) {
                if (x + radius > door.x && x - radius < door.x + door.width &&
                    y + radius > door.y && y - radius < door.y + door.height) {
                    return true;
                }
            }
        }

        return false;
    }

    // ========================================================================
    // EFFECTS
    // ========================================================================
    function triggerScreenShake(intensity, duration) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
    }

    function createMuzzleFlash(x, y) {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                x, y,
                Math.random() * Math.PI * 2,
                Math.random() * 50 + 30,
                COLORS.muzzleFlash,
                0.1
            ));
        }
    }

    function createHitSparks(x, y) {
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                x, y,
                Math.random() * Math.PI * 2,
                Math.random() * 80 + 40,
                '#FFAA00',
                0.3
            ));
        }
    }

    function createExplosion(x, y, radius, damage) {
        // Visual
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(
                x, y,
                Math.random() * Math.PI * 2,
                Math.random() * 150 + 50,
                COLORS.explosion,
                0.5
            ));
        }

        triggerScreenShake(10, 0.3);

        // Damage
        for (const enemy of enemies) {
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < radius) {
                const falloff = 1 - (dist / radius);
                enemy.takeDamage(damage * falloff);
            }
        }

        // Damage player
        const playerDist = distance(x, y, player.x, player.y);
        if (playerDist < radius) {
            const falloff = 1 - (playerDist / radius);
            player.takeDamage(damage * falloff);
        }
    }

    function createSoundEvent(x, y, range) {
        for (const enemy of enemies) {
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < range) {
                enemy.alertBySound(x, y);
            }
        }
    }

    function showFloatingText(x, y, text, color) {
        const container = document.getElementById('floatingTexts');
        const screenPos = worldToScreen(x, y);

        const elem = document.createElement('div');
        elem.className = 'floating-text';
        elem.textContent = text;
        elem.style.left = screenPos.x + 'px';
        elem.style.top = screenPos.y + 'px';
        elem.style.color = color;

        container.appendChild(elem);

        setTimeout(() => {
            elem.remove();
        }, 1000);
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function normalizeAngle(angle) {
        while (angle < -Math.PI) angle += Math.PI * 2;
        while (angle > Math.PI) angle -= Math.PI * 2;
        return angle;
    }

    function screenToWorld(sx, sy) {
        return {
            x: sx + camera.x - SCREEN_WIDTH / 2,
            y: sy + camera.y - SCREEN_HEIGHT / 2
        };
    }

    function worldToScreen(wx, wy) {
        return {
            x: wx - camera.x + SCREEN_WIDTH / 2,
            y: wy - camera.y + SCREEN_HEIGHT / 2
        };
    }

    function getKeycardColor(keycard) {
        switch (keycard) {
            case 'green': return COLORS.doorGreen;
            case 'blue': return COLORS.doorBlue;
            case 'yellow': return COLORS.doorYellow;
            case 'red': return COLORS.doorRed;
            default: return '#FFFFFF';
        }
    }

    // ========================================================================
    // INPUT HANDLING
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
        if (!keys[key]) {
            keysJustPressed[key] = true;
        }
        keys[key] = true;
        keys[e.key] = true;
        keys[e.code] = true;

        // Prevent default for game keys
        if (['w', 'a', 's', 'd', ' ', 'e', 'r', 'q', 'h', 'Escape'].includes(e.key) ||
            e.key.startsWith('Arrow')) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keys[e.key] = false;
        keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) mouse.down = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouse.down = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

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
        renderUI();

        // Clear just-pressed keys
        keysJustPressed = {};

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        // Update screen shake
        if (screenShake.duration > 0) {
            screenShake.duration -= dt;
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
        }

        // Update player
        player.update(dt);

        // Update camera
        camera.x += (player.x - camera.x) * 0.1;
        camera.y += (player.y - camera.y) * 0.1;

        // Update visibility
        updateVisibility();

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }
        enemies = enemies.filter(e => !e.dead);

        // Update bullets
        for (const bullet of bullets) {
            bullet.update(dt);
        }
        bullets = bullets.filter(b => !b.dead);

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

        // Handle door interactions
        if (keyJustPressed(' ') || keyJustPressed('space')) {
            for (const door of doors) {
                if (door.isPlayerNearby() && !door.isOpen) {
                    door.tryOpen();
                }
            }
        }

        // Handle terminal interactions
        if (keyJustPressed('e')) {
            for (const terminal of terminals) {
                if (terminal.isPlayerNearby()) {
                    gameState = 'shop';
                }
            }
        }

        // Self-destruct timer
        if (selfDestructActive) {
            selfDestructTimer -= dt;
            if (selfDestructTimer <= 0) {
                gameState = 'gameover';
            }
        }

        // Victory check
        if (currentDeck === 4 && enemies.filter(e => e.isBoss).length === 0) {
            // Boss defeated
            if (enemies.length === 0) {
                gameState = 'victory';
            }
        }
    }

    function render() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        if (gameState === 'shop') {
            renderShop();
            return;
        }

        ctx.save();
        ctx.translate(
            SCREEN_WIDTH / 2 - camera.x + screenShake.x,
            SCREEN_HEIGHT / 2 - camera.y + screenShake.y
        );

        // Render level
        renderLevel();

        // Render doors
        for (const door of doors) {
            door.render(ctx);
        }

        // Render terminals
        for (const terminal of terminals) {
            if (isVisible(terminal.x, terminal.y)) {
                terminal.render(ctx);
            }
        }

        // Render pickups
        for (const pickup of pickups) {
            if (isVisible(pickup.x, pickup.y)) {
                pickup.render(ctx);
            }
        }

        // Render enemies
        for (const enemy of enemies) {
            if (isVisible(enemy.x, enemy.y)) {
                enemy.render(ctx);
            }
        }

        // Render player
        player.render(ctx);

        // Render bullets
        for (const bullet of bullets) {
            bullet.render(ctx);
        }

        // Render particles
        for (const particle of particles) {
            particle.render(ctx);
        }

        // Render darkness overlay (visibility system)
        renderDarkness();

        ctx.restore();

        // Game over / victory overlay
        if (gameState === 'gameover') {
            renderGameOver();
        } else if (gameState === 'victory') {
            renderVictory();
        }
    }

    function renderLevel() {
        if (!currentLevel) return;

        const startX = Math.max(0, Math.floor((camera.x - SCREEN_WIDTH / 2) / TILE_SIZE) - 1);
        const endX = Math.min(currentLevel.width, Math.ceil((camera.x + SCREEN_WIDTH / 2) / TILE_SIZE) + 1);
        const startY = Math.max(0, Math.floor((camera.y - SCREEN_HEIGHT / 2) / TILE_SIZE) - 1);
        const endY = Math.min(currentLevel.height, Math.ceil((camera.y + SCREEN_HEIGHT / 2) / TILE_SIZE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = currentLevel.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (tile === 0) {
                    ctx.fillStyle = COLORS.floor;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Grid pattern
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Wall highlight
                    ctx.fillStyle = COLORS.wallHighlight;
                    ctx.fillRect(px, py, TILE_SIZE, 3);
                    ctx.fillRect(px, py, 3, TILE_SIZE);
                }
            }
        }
    }

    function renderDarkness() {
        if (!currentLevel) return;

        const startX = Math.max(0, Math.floor((camera.x - SCREEN_WIDTH / 2) / TILE_SIZE) - 1);
        const endX = Math.min(currentLevel.width, Math.ceil((camera.x + SCREEN_WIDTH / 2) / TILE_SIZE) + 1);
        const startY = Math.max(0, Math.floor((camera.y - SCREEN_HEIGHT / 2) / TILE_SIZE) - 1);
        const endY = Math.min(currentLevel.height, Math.ceil((camera.y + SCREEN_HEIGHT / 2) / TILE_SIZE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!visibleTiles.has(`${x},${y}`)) {
                    ctx.fillStyle = COLORS.darkness;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    function renderUI() {
        uiCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (gameState !== 'playing') return;

        // Health bar
        uiCtx.fillStyle = '#333';
        uiCtx.fillRect(20, 20, 200, 20);
        uiCtx.fillStyle = COLORS.health;
        uiCtx.fillRect(20, 20, 200 * (player.health / player.maxHealth), 20);
        uiCtx.strokeStyle = '#FFF';
        uiCtx.lineWidth = 2;
        uiCtx.strokeRect(20, 20, 200, 20);
        uiCtx.fillStyle = '#FFF';
        uiCtx.font = '14px Arial';
        uiCtx.fillText(`HP: ${Math.ceil(player.health)}/${player.maxHealth}`, 25, 35);

        // Shield bar
        if (player.maxShield > 0) {
            uiCtx.fillStyle = '#333';
            uiCtx.fillRect(20, 45, 150, 15);
            uiCtx.fillStyle = COLORS.shield;
            uiCtx.fillRect(20, 45, 150 * (player.shield / player.maxShield), 15);
            uiCtx.strokeRect(20, 45, 150, 15);
            uiCtx.fillStyle = '#FFF';
            uiCtx.font = '12px Arial';
            uiCtx.fillText(`Shield: ${Math.ceil(player.shield)}`, 25, 57);
        }

        // Stamina bar
        uiCtx.fillStyle = '#333';
        uiCtx.fillRect(20, 65, 150, 10);
        uiCtx.fillStyle = '#00FF00';
        uiCtx.fillRect(20, 65, 150 * (player.stamina / player.maxStamina), 10);

        // Weapon info
        const weapon = player.currentWeapon;
        uiCtx.fillStyle = '#FFF';
        uiCtx.font = '16px Arial';
        uiCtx.fillText(weapon.name, 20, SCREEN_HEIGHT - 60);
        uiCtx.fillText(`${player.currentMag}/${weapon.magSize}`, 20, SCREEN_HEIGHT - 40);
        if (!weapon.infinite) {
            uiCtx.fillText(`Reserve: ${player.ammo[weapon.ammoType]}`, 20, SCREEN_HEIGHT - 20);
        }

        // Reload indicator
        if (player.isReloading) {
            uiCtx.fillStyle = '#FFAA00';
            uiCtx.fillText('RELOADING...', 150, SCREEN_HEIGHT - 40);
        }

        // Credits
        uiCtx.fillStyle = COLORS.credits;
        uiCtx.font = '18px Arial';
        uiCtx.fillText(`$${player.credits}`, SCREEN_WIDTH - 100, 30);

        // Keycards
        const keycardColors = ['green', 'blue', 'yellow', 'red'];
        for (let i = 0; i < keycardColors.length; i++) {
            const hasKey = player.keycards.includes(keycardColors[i]);
            uiCtx.fillStyle = hasKey ? getKeycardColor(keycardColors[i]) : '#333';
            uiCtx.fillRect(SCREEN_WIDTH - 150 + i * 35, 50, 30, 20);
            if (!hasKey) {
                uiCtx.strokeStyle = '#666';
                uiCtx.strokeRect(SCREEN_WIDTH - 150 + i * 35, 50, 30, 20);
            }
        }

        // Self-destruct timer
        if (selfDestructActive) {
            const minutes = Math.floor(selfDestructTimer / 60);
            const seconds = Math.floor(selfDestructTimer % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            uiCtx.fillStyle = selfDestructTimer < 60 ? '#FF0000' : '#FF4444';
            uiCtx.font = 'bold 32px Arial';
            uiCtx.textAlign = 'center';
            uiCtx.fillText(`SELF-DESTRUCT: ${timeStr}`, SCREEN_WIDTH / 2, 50);
            uiCtx.textAlign = 'left';
        }

        // Deck indicator
        uiCtx.fillStyle = '#FFF';
        uiCtx.font = '14px Arial';
        uiCtx.fillText(`DECK ${currentDeck}`, SCREEN_WIDTH / 2 - 30, SCREEN_HEIGHT - 20);

        // Minimap
        renderMinimap();
    }

    function renderMinimap() {
        if (!currentLevel) return;

        const mapSize = 150;
        const mapX = SCREEN_WIDTH - mapSize - 20;
        const mapY = 80;
        const scale = mapSize / Math.max(currentLevel.width, currentLevel.height);

        // Background
        uiCtx.fillStyle = 'rgba(0,0,0,0.7)';
        uiCtx.fillRect(mapX, mapY, mapSize, mapSize);
        uiCtx.strokeStyle = '#666';
        uiCtx.strokeRect(mapX, mapY, mapSize, mapSize);

        // Rooms
        for (let y = 0; y < currentLevel.height; y++) {
            for (let x = 0; x < currentLevel.width; x++) {
                if (visibleTiles.has(`${x},${y}`)) {
                    const tile = currentLevel.tiles[y][x];
                    uiCtx.fillStyle = tile === 0 ? '#333' : '#666';
                    uiCtx.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
                }
            }
        }

        // Player
        uiCtx.fillStyle = '#00AAFF';
        const playerMapX = mapX + (player.x / TILE_SIZE) * scale;
        const playerMapY = mapY + (player.y / TILE_SIZE) * scale;
        uiCtx.beginPath();
        uiCtx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
        uiCtx.fill();

        // Enemies on minimap
        uiCtx.fillStyle = '#FF4444';
        for (const enemy of enemies) {
            if (isVisible(enemy.x, enemy.y)) {
                const ex = mapX + (enemy.x / TILE_SIZE) * scale;
                const ey = mapY + (enemy.y / TILE_SIZE) * scale;
                uiCtx.beginPath();
                uiCtx.arc(ex, ey, 2, 0, Math.PI * 2);
                uiCtx.fill();
            }
        }
    }

    function renderMenu() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STATION BREACH', SCREEN_WIDTH / 2, 200);

        ctx.fillStyle = '#0088FF';
        ctx.font = '24px Arial';
        ctx.fillText('Twin-Stick Survival Horror', SCREEN_WIDTH / 2, 250);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('WASD - Move', SCREEN_WIDTH / 2, 350);
        ctx.fillText('Mouse - Aim', SCREEN_WIDTH / 2, 380);
        ctx.fillText('Click - Shoot', SCREEN_WIDTH / 2, 410);
        ctx.fillText('R - Reload | Q - Switch Weapon', SCREEN_WIDTH / 2, 440);
        ctx.fillText('SPACE - Open Doors | E - Use Terminals', SCREEN_WIDTH / 2, 470);
        ctx.fillText('H - Use Medkit | Shift - Sprint', SCREEN_WIDTH / 2, 500);

        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Press ENTER or CLICK to Start', SCREEN_WIDTH / 2, 580);

        ctx.textAlign = 'left';
    }

    function renderShop() {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('INTEX TERMINAL v2.1', SCREEN_WIDTH / 2, 80);

        ctx.fillStyle = COLORS.credits;
        ctx.font = '24px Arial';
        ctx.fillText(`Credits: $${player.credits}`, SCREEN_WIDTH / 2, 120);

        // Shop items
        const items = [
            { name: 'Small Medkit', cost: 25, effect: '+25 HP', key: '1' },
            { name: 'Large Medkit', cost: 60, effect: '+50 HP', key: '2' },
            { name: 'Shield Battery', cost: 80, effect: '+25 Shield', key: '3' },
            { name: 'Ammo Pack', cost: 30, effect: '+50 Ammo', key: '4' }
        ];

        ctx.font = '18px Arial';
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const y = 180 + i * 50;
            const canAfford = player.credits >= item.cost;

            ctx.fillStyle = canAfford ? '#FFF' : '#666';
            ctx.fillText(`[${item.key}] ${item.name} - $${item.cost} (${item.effect})`, SCREEN_WIDTH / 2, y);
        }

        ctx.fillStyle = '#FFFF00';
        ctx.fillText('Press ESC to exit', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);

        ctx.textAlign = 'left';

        // Handle shop input
        if (keyJustPressed('1') && player.credits >= 25) {
            player.credits -= 25;
            player.health = Math.min(player.maxHealth, player.health + 25);
            showFloatingText(SCREEN_WIDTH/2, 180, '+25 HP', '#00FF00');
        }
        if (keyJustPressed('2') && player.credits >= 60) {
            player.credits -= 60;
            player.health = Math.min(player.maxHealth, player.health + 50);
            showFloatingText(SCREEN_WIDTH/2, 230, '+50 HP', '#00FF00');
        }
        if (keyJustPressed('3') && player.credits >= 80 && player.maxShield > 0) {
            player.credits -= 80;
            player.shield = Math.min(player.maxShield, player.shield + 25);
            showFloatingText(SCREEN_WIDTH/2, 280, '+25 Shield', '#4488FF');
        }
        if (keyJustPressed('4') && player.credits >= 30) {
            player.credits -= 30;
            for (const ammoType of Object.keys(player.ammo)) {
                player.ammo[ammoType] += 50;
            }
            showFloatingText(SCREEN_WIDTH/2, 330, '+50 Ammo', '#FFAA00');
        }
        if (keyJustPressed('escape')) {
            gameState = 'playing';
        }
    }

    function renderGameOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', SCREEN_WIDTH / 2, 300);

        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Press ENTER to Restart', SCREEN_WIDTH / 2, 400);

        ctx.textAlign = 'left';
    }

    function renderVictory() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPED!', SCREEN_WIDTH / 2, 300);

        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('You survived the station breach!', SCREEN_WIDTH / 2, 360);
        ctx.fillText('Press ENTER to Play Again', SCREEN_WIDTH / 2, 420);

        ctx.textAlign = 'left';
    }

    // ========================================================================
    // GAME INITIALIZATION
    // ========================================================================
    function startGame() {
        gameState = 'playing';
        gamePaused = false;
        currentDeck = 1;
        selfDestructActive = false;
        selfDestructTimer = 600;

        // Reset arrays
        enemies = [];
        bullets = [];
        pickups = [];
        particles = [];
        doors = [];
        terminals = [];

        // Generate level
        currentLevel = generateLevel(currentDeck);

        // Find start room
        const startRoom = currentLevel.rooms.find(r => r.type === 'start');
        const startX = (startRoom.x + startRoom.width / 2) * TILE_SIZE;
        const startY = (startRoom.y + startRoom.height / 2) * TILE_SIZE;

        // Create player
        player = new Player(startX, startY);
        camera.x = startX;
        camera.y = startY;

        // Hide loading screen
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    function init() {
        // Show loading progress
        const loadingFill = document.getElementById('loadingFill');
        const loadingText = document.getElementById('loadingText');

        loadingFill.style.width = '50%';
        loadingText.textContent = 'Preparing station...';

        setTimeout(() => {
            loadingFill.style.width = '100%';
            loadingText.textContent = 'Ready!';

            setTimeout(() => {
                gameState = 'menu';
                requestAnimationFrame(gameLoop);
            }, 500);
        }, 500);

        // Menu input
        document.addEventListener('keydown', (e) => {
            if (gameState === 'menu' && (e.key === 'Enter' || e.key === ' ')) {
                startGame();
            }
            if ((gameState === 'gameover' || gameState === 'victory') && e.key === 'Enter') {
                startGame();
            }
        });

        canvas.addEventListener('click', () => {
            if (gameState === 'menu') {
                startGame();
            }
        });
    }

    // ========================================================================
    // HARNESS IMPLEMENTATION
    // ========================================================================
    function simulateKeyDown(key) {
        activeHarnessKeys.add(key);
        // Also trigger just-pressed
        keysJustPressed[key.toLowerCase()] = true;
        keysJustPressed[key] = true;
    }

    function simulateKeyUp(key) {
        activeHarnessKeys.delete(key);
    }

    function releaseAllHarnessKeys() {
        activeHarnessKeys.clear();
    }

    function simulateClick(x, y) {
        mouse.x = x;
        mouse.y = y;
        mouse.down = true;
        setTimeout(() => { mouse.down = false; }, 50);
    }

    window.harness = {
        pause: () => {
            gamePaused = true;
            releaseAllHarnessKeys();
            mouse.down = false;
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                // Apply inputs
                if (action.keys) {
                    for (const key of action.keys) {
                        simulateKeyDown(key);
                    }
                }
                if (action.click) {
                    mouse.x = action.click.x;
                    mouse.y = action.click.y;
                    mouse.down = true;
                }

                // Resume game
                gamePaused = false;

                // After duration, pause and release inputs
                setTimeout(() => {
                    releaseAllHarnessKeys();
                    mouse.down = false;
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => {
            return {
                gameState: gameState,
                gamePaused: gamePaused,
                currentDeck: currentDeck,
                selfDestructActive: selfDestructActive,
                selfDestructTimer: selfDestructTimer,
                player: player ? {
                    x: player.x,
                    y: player.y,
                    health: player.health,
                    maxHealth: player.maxHealth,
                    shield: player.shield,
                    maxShield: player.maxShield,
                    stamina: player.stamina,
                    angle: player.angle,
                    currentWeapon: player.currentWeaponKey,
                    currentMag: player.currentMag,
                    isReloading: player.isReloading,
                    credits: player.credits,
                    keycards: player.keycards,
                    weapons: player.weapons,
                    ammo: player.ammo
                } : null,
                enemies: enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp,
                    maxHp: e.maxHp,
                    behavior: e.behavior,
                    state: e.state,
                    isBoss: e.isBoss || false,
                    visible: isVisible(e.x, e.y)
                })),
                bullets: bullets.length,
                pickups: pickups.map(p => ({
                    x: p.x,
                    y: p.y,
                    type: p.type,
                    subtype: p.subtype,
                    visible: isVisible(p.x, p.y)
                })),
                doors: doors.map(d => ({
                    x: d.x,
                    y: d.y,
                    isOpen: d.isOpen,
                    keycardRequired: d.keycardRequired,
                    playerNearby: d.isPlayerNearby()
                })),
                terminals: terminals.map(t => ({
                    x: t.x,
                    y: t.y,
                    playerNearby: t.isPlayerNearby()
                })),
                camera: { x: camera.x, y: camera.y },
                level: currentLevel ? {
                    deck: currentLevel.deck,
                    width: currentLevel.width,
                    height: currentLevel.height,
                    roomCount: currentLevel.rooms.length
                } : null
            };
        },

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'playing') return 'playing';
            if (gameState === 'paused') return 'paused';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            if (gameState === 'shop') return 'shop';
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (player) player.health = hp; },
            setPosition: (x, y) => { if (player) { player.x = x; player.y = y; } },
            setGodMode: (enabled) => { if (player) player.invincibleTime = enabled ? Infinity : 0; },
            skipToLevel: (deckNum) => {
                currentDeck = deckNum;
                enemies = [];
                bullets = [];
                pickups = [];
                doors = [];
                terminals = [];
                currentLevel = generateLevel(currentDeck);
                const startRoom = currentLevel.rooms.find(r => r.type === 'start');
                player.x = (startRoom.x + startRoom.width / 2) * TILE_SIZE;
                player.y = (startRoom.y + startRoom.height / 2) * TILE_SIZE;
                if (deckNum === 4) {
                    selfDestructActive = true;
                }
            },
            spawnEnemy: (type, x, y) => { enemies.push(new Enemy(x, y, type)); },
            clearEnemies: () => { enemies = []; },
            giveItem: (itemId) => {
                if (itemId.startsWith('keycard_')) {
                    const color = itemId.replace('keycard_', '');
                    if (!player.keycards.includes(color)) {
                        player.keycards.push(color);
                    }
                } else if (WEAPONS[itemId] && !player.weapons.includes(itemId)) {
                    player.weapons.push(itemId);
                }
            },
            giveCredits: (amount) => { if (player) player.credits += amount; },
            forceStart: () => {
                // Always restart the game, regardless of current state
                startGame();
                gamePaused = true;
            },
            forceGameOver: () => { gameState = 'gameover'; },
            forceVictory: () => { gameState = 'victory'; },
            log: (msg) => { console.log('[HARNESS]', msg); },
        },

        version: '1.0',

        gameInfo: {
            name: 'Station Breach',
            type: 'twin_stick_shooter',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                aim: 'mouse',
                fire: ['click', 'Space'],
                actions: {
                    reload: 'r',
                    interact: 'e',
                    sprint: 'Shift',
                    switchWeapon: 'q',
                    useMedkit: 'h',
                    openDoor: 'Space'
                }
            }
        }
    };

    console.log('[HARNESS] Station Breach test harness initialized, game paused');

    // Start
    init();

})();
