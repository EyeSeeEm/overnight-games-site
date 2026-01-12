/**
 * Bullet Dungeon - Enter the Gungeon Clone
 * Night 6 - Canvas Implementation
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const TILE_SIZE = 16;
    const ROOM_WIDTH = 25;  // tiles
    const ROOM_HEIGHT = 17; // tiles
    const ROOM_OFFSET_X = (CANVAS_WIDTH - ROOM_WIDTH * TILE_SIZE) / 2;
    const ROOM_OFFSET_Y = 60; // UI space at top

    const COLORS = {
        floor: '#3a3a5c',
        floorAlt: '#2e2e4a',
        wall: '#1a1a2e',
        wallTop: '#4a4a6e',
        door: '#5a5a3a',
        doorOpen: '#3a5a3a',
        player: '#88ccff',
        playerRoll: '#aaddff',
        bullet: '#ffcc44',
        enemyBullet: '#ff6644',
        enemy: '#cc8844',
        heart: '#ff4444',
        heartEmpty: '#442222',
        armor: '#4488ff',
        blank: '#ffffff',
        shell: '#ffdd44',
        key: '#ffcc00',
        chest: '#885522',
        chestBlue: '#4466aa',
        chestGreen: '#44aa66',
        chestRed: '#aa4444',
        ui: '#222244',
        uiText: '#ffffff'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // WEAPON DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const WEAPONS = {
        marineSidearm: {
            name: 'Marine Sidearm',
            type: 'semiauto',
            damage: [6, 8],
            fireRate: 5,
            reloadTime: 1.0,
            magazineSize: 10,
            maxAmmo: Infinity,
            spread: 3,
            projectileSpeed: 12,
            projectileCount: 1,
            quality: 'starter',
            color: '#ffcc44'
        },
        rogueSpecial: {
            name: 'Rogue Special',
            type: 'semiauto',
            damage: [5, 7],
            fireRate: 4,
            reloadTime: 1.2,
            magazineSize: 8,
            maxAmmo: Infinity,
            spread: 12,
            projectileSpeed: 10,
            projectileCount: 1,
            quality: 'starter',
            color: '#ffcc44'
        },
        budgetRevolver: {
            name: 'Budget Revolver',
            type: 'semiauto',
            damage: [8, 10],
            fireRate: 3,
            reloadTime: 1.5,
            magazineSize: 6,
            maxAmmo: Infinity,
            spread: 5,
            projectileSpeed: 11,
            projectileCount: 1,
            quality: 'starter',
            color: '#ffcc44'
        },
        rustySidearm: {
            name: 'Rusty Sidearm',
            type: 'semiauto',
            damage: [5, 6],
            fireRate: 4,
            reloadTime: 1.0,
            magazineSize: 7,
            maxAmmo: Infinity,
            spread: 6,
            projectileSpeed: 10,
            projectileCount: 1,
            quality: 'starter',
            color: '#ffcc44'
        },
        machineGun: {
            name: 'Machine Gun',
            type: 'auto',
            damage: [3, 5],
            fireRate: 12,
            reloadTime: 1.5,
            magazineSize: 30,
            maxAmmo: 200,
            spread: 8,
            projectileSpeed: 14,
            projectileCount: 1,
            quality: 'C',
            color: '#ffcc44'
        },
        shotgun: {
            name: 'Shotgun',
            type: 'semiauto',
            damage: [4, 5],
            fireRate: 1.5,
            reloadTime: 1.8,
            magazineSize: 6,
            maxAmmo: 80,
            spread: 15,
            projectileSpeed: 12,
            projectileCount: 6,
            quality: 'C',
            color: '#ffcc44'
        },
        ak47: {
            name: 'AK-47',
            type: 'auto',
            damage: [5, 7],
            fireRate: 8,
            reloadTime: 1.5,
            magazineSize: 30,
            maxAmmo: 350,
            spread: 5,
            projectileSpeed: 15,
            projectileCount: 1,
            quality: 'B',
            color: '#ffcc44'
        },
        railgun: {
            name: 'Railgun',
            type: 'charged',
            damage: [60, 80],
            fireRate: 0.5,
            reloadTime: 2.0,
            magazineSize: 3,
            maxAmmo: 50,
            spread: 0,
            projectileSpeed: 30,
            projectileCount: 1,
            quality: 'A',
            color: '#88ffff',
            piercing: true
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const ENEMY_DATA = {
        bulletKin: {
            name: 'Bullet Kin',
            health: 15,
            speed: 1.5,
            damage: 1,
            behavior: 'basic',
            fireRate: 1.5,
            bulletSpeed: 5,
            pattern: 'single',
            color: '#cc8844',
            size: 12
        },
        bandanaBulletKin: {
            name: 'Bandana Bullet Kin',
            health: 15,
            speed: 1.8,
            damage: 1,
            behavior: 'basic',
            fireRate: 1.2,
            bulletSpeed: 5,
            pattern: 'spread3',
            color: '#cc4444',
            size: 12
        },
        shotgunKinBlue: {
            name: 'Blue Shotgun Kin',
            health: 25,
            speed: 1.2,
            damage: 1,
            behavior: 'strafe',
            fireRate: 2.0,
            bulletSpeed: 5,
            pattern: 'spread6',
            color: '#4488cc',
            size: 14
        },
        shotgunKinRed: {
            name: 'Red Shotgun Kin',
            health: 30,
            speed: 1.4,
            damage: 1,
            behavior: 'aggressive',
            fireRate: 1.8,
            bulletSpeed: 6,
            pattern: 'spread8',
            color: '#cc4444',
            size: 14
        },
        cardinal: {
            name: 'Cardinal',
            health: 15,
            speed: 1.0,
            damage: 1,
            behavior: 'stationary',
            fireRate: 2.0,
            bulletSpeed: 4,
            pattern: 'cardinal',
            color: '#cc4488',
            size: 12
        },
        shroomer: {
            name: 'Shroomer',
            health: 20,
            speed: 0.8,
            damage: 1,
            behavior: 'wander',
            fireRate: 3.0,
            bulletSpeed: 4,
            pattern: 'spiral',
            color: '#88cc44',
            size: 14
        },
        gunNut: {
            name: 'Gun Nut',
            health: 50,
            speed: 2.0,
            damage: 1,
            behavior: 'aggressive',
            fireRate: 0,
            bulletSpeed: 0,
            pattern: 'melee',
            color: '#888888',
            size: 16,
            blocksFromFront: true
        },
        bookllet: {
            name: 'Bookllet',
            health: 20,
            speed: 2.5,
            damage: 1,
            behavior: 'circle',
            fireRate: 1.5,
            bulletSpeed: 5,
            pattern: 'single',
            color: '#884488',
            size: 10
        },
        rubberKin: {
            name: 'Rubber Kin',
            health: 15,
            speed: 3.5,
            damage: 1,
            behavior: 'bounce',
            fireRate: 0,
            bulletSpeed: 0,
            pattern: 'none',
            color: '#44cc88',
            size: 10
        },
        grenadeKin: {
            name: 'Grenade Kin',
            health: 20,
            speed: 1.5,
            damage: 2,
            behavior: 'basic',
            fireRate: 2.5,
            bulletSpeed: 4,
            pattern: 'grenade',
            color: '#448844',
            size: 12,
            explosive: true
        },
        leadMaiden: {
            name: 'Lead Maiden',
            health: 60,
            speed: 1.2,
            damage: 1,
            behavior: 'strafe',
            fireRate: 1.8,
            bulletSpeed: 5,
            pattern: 'homing',
            color: '#666688',
            size: 16
        },
        skullet: {
            name: 'Skullet',
            health: 15,
            speed: 1.8,
            damage: 1,
            behavior: 'basic',
            fireRate: 1.5,
            bulletSpeed: 5,
            pattern: 'bounce',
            color: '#ccccaa',
            size: 12
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ITEM DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const ITEMS = {
        // Passive items
        plusOneBullets: { name: '+1 Bullets', type: 'passive', quality: 'D', effect: { damageMult: 1.25 } },
        bouncyBullets: { name: 'Bouncy Bullets', type: 'passive', quality: 'D', effect: { bouncy: true } },
        scope: { name: 'Scope', type: 'passive', quality: 'D', effect: { spreadMult: 0.5 } },
        armor: { name: 'Armor', type: 'passive', quality: 'C', effect: { armor: 1 } },
        explosiveRounds: { name: 'Explosive Rounds', type: 'passive', quality: 'C', effect: { explosive: true } },
        shockRounds: { name: 'Shock Rounds', type: 'passive', quality: 'B', effect: { chain: true } },
        // Active items
        medkit: { name: 'Medkit', type: 'active', quality: 'C', cooldown: 400, effect: 'heal2' },
        bomb: { name: 'Bomb', type: 'active', quality: 'D', cooldown: 300, effect: 'bomb' },
        molotov: { name: 'Molotov', type: 'active', quality: 'C', cooldown: 400, effect: 'fire' },
        supplyDrop: { name: 'Supply Drop', type: 'active', quality: 'C', cooldown: 600, effect: 'ammo' }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // BOSS DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const BOSS_DATA = {
        bulletKing: {
            name: 'Bullet King',
            health: 600,
            floor: 1,
            phases: [
                { threshold: 1.0, attacks: ['throneSpinSlow', 'spreadVolley'] },
                { threshold: 0.6, attacks: ['throneSpinFast', 'bulletBurst', 'spreadVolley'] },
                { threshold: 0.3, attacks: ['throneSpinFast', 'bulletBurst', 'rainOfBullets'] }
            ],
            color: '#ddaa44',
            size: 32
        },
        gatlingGull: {
            name: 'Gatling Gull',
            health: 700,
            floor: 1,
            phases: [
                { threshold: 1.0, attacks: ['gatlingSpray', 'wideSweep'] },
                { threshold: 0.5, attacks: ['gatlingSpray', 'jumpAttack', 'wideSweep'] },
                { threshold: 0.25, attacks: ['missileBarrage', 'gatlingSpray', 'jumpAttack'] }
            ],
            color: '#888888',
            size: 36
        },
        beholster: {
            name: 'Beholster',
            health: 800,
            floor: 2,
            phases: [
                { threshold: 1.0, attacks: ['tentacleSpray', 'bulletRing'] },
                { threshold: 0.6, attacks: ['tentacleSpray', 'eyeBeam', 'spawnBeadies'] },
                { threshold: 0.3, attacks: ['tentacleSpray', 'eyeBeam', 'bulletRing', 'spawnBeadies'] }
            ],
            color: '#aa44aa',
            size: 40
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════

    let canvas, ctx;
    let gameState = 'menu'; // menu, playing, paused, dead, victory, bossIntro, bossFight
    let lastTime = 0;
    let deltaTime = 0;

    // Input state
    const keys = {};
    let mouse = { x: 0, y: 0, down: false, clicked: false };

    // Screen effects
    let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    let damageFlash = 0;  // Red flash intensity when hit
    let hitMarkers = [];  // X markers when hitting enemies

    // Run statistics
    let runStats = {
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        shotsFired: 0,
        roomsCleared: 0,
        bossesKilled: 0
    };

    // Game entities
    let player = null;
    let enemies = [];
    let playerBullets = [];
    let enemyBullets = [];
    let pickups = [];
    let obstacles = [];
    let particles = [];
    let doors = [];
    let chests = [];

    // Floor/room data
    let currentFloor = 1;
    let currentRoom = null;
    let floorRooms = [];
    let visitedRooms = new Set();
    let roomCleared = false;

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Player {
        constructor(x, y, character = 'marine') {
            this.x = x;
            this.y = y;
            this.width = 14;
            this.height = 14;
            this.speed = 120; // pixels per second
            this.vx = 0;
            this.vy = 0;

            // Health
            this.maxHealth = 6; // 3 hearts
            this.health = 6;
            this.armor = 0;
            this.invulnTimer = 0;

            // Combat
            this.weapons = [];
            this.currentWeaponIndex = 0;
            this.shootCooldown = 0;
            this.reloading = false;
            this.reloadTimer = 0;

            // Dodge roll
            this.isRolling = false;
            this.rollTimer = 0;
            this.rollDuration = 0.5;
            this.rollIFrameEnd = 0.25;
            this.rollSpeed = 350;
            this.rollDirection = { x: 0, y: 0 };
            this.canRoll = true;

            // Resources
            this.blanks = 2;
            this.keys = 1;
            this.shells = 0;

            // Items
            this.passiveItems = [];
            this.activeItem = null;
            this.activeItemCooldown = 0;

            // Stats modifiers
            this.damageMult = 1.0;
            this.spreadMult = 1.0;
            this.hasBouncyBullets = false;
            this.hasExplosiveBullets = false;
            this.hasChainBullets = false;

            // Character setup
            this.character = character;
            this.setupCharacter();
        }

        setupCharacter() {
            switch (this.character) {
                case 'marine':
                    this.weapons.push(this.createWeapon('marineSidearm'));
                    this.armor = 1;
                    break;
                case 'pilot':
                    this.weapons.push(this.createWeapon('rogueSpecial'));
                    break;
                case 'convict':
                    this.weapons.push(this.createWeapon('budgetRevolver'));
                    break;
                case 'hunter':
                    this.weapons.push(this.createWeapon('rustySidearm'));
                    break;
                default:
                    this.weapons.push(this.createWeapon('marineSidearm'));
            }
        }

        createWeapon(weaponId) {
            const data = WEAPONS[weaponId];
            return {
                id: weaponId,
                ...data,
                currentAmmo: data.magazineSize,
                totalAmmo: data.maxAmmo
            };
        }

        get currentWeapon() {
            return this.weapons[this.currentWeaponIndex];
        }

        update(dt) {
            // Update invulnerability
            if (this.invulnTimer > 0) {
                this.invulnTimer -= dt;
            }

            // Handle dodge roll
            if (this.isRolling) {
                this.rollTimer += dt;

                // Move in roll direction
                const rollVx = this.rollDirection.x * this.rollSpeed;
                const rollVy = this.rollDirection.y * this.rollSpeed;

                this.x += rollVx * dt;
                this.y += rollVy * dt;

                // Keep in bounds
                this.constrainToRoom();

                // End roll
                if (this.rollTimer >= this.rollDuration) {
                    this.isRolling = false;
                    this.rollTimer = 0;
                }

                // End i-frames
                if (this.rollTimer >= this.rollIFrameEnd && this.invulnTimer > 0) {
                    this.invulnTimer = 0;
                }

                return;
            }

            // Normal movement
            this.vx = 0;
            this.vy = 0;

            if (keys['w'] || keys['arrowup']) this.vy = -1;
            if (keys['s'] || keys['arrowdown']) this.vy = 1;
            if (keys['a'] || keys['arrowleft']) this.vx = -1;
            if (keys['d'] || keys['arrowright']) this.vx = 1;

            // Normalize diagonal movement
            if (this.vx !== 0 && this.vy !== 0) {
                const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx /= len;
                this.vy /= len;
            }

            // Apply movement
            this.x += this.vx * this.speed * dt;
            this.y += this.vy * this.speed * dt;

            // Constrain to room
            this.constrainToRoom();

            // Shooting cooldown
            if (this.shootCooldown > 0) {
                this.shootCooldown -= dt;
            }

            // Reload timer
            if (this.reloading) {
                this.reloadTimer -= dt;
                if (this.reloadTimer <= 0) {
                    this.finishReload();
                }
            }

            // Active item cooldown
            if (this.activeItemCooldown > 0) {
                this.activeItemCooldown = Math.max(0, this.activeItemCooldown);
            }
        }

        constrainToRoom() {
            const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
            const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
            const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
            const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

            this.x = Math.max(minX, Math.min(maxX, this.x));
            this.y = Math.max(minY, Math.min(maxY, this.y));

            // Check obstacle collisions
            for (const obs of obstacles) {
                if (this.collidesWithRect(obs)) {
                    this.resolveCollision(obs);
                }
            }
        }

        collidesWithRect(rect) {
            return this.x - this.width/2 < rect.x + rect.width &&
                   this.x + this.width/2 > rect.x &&
                   this.y - this.height/2 < rect.y + rect.height &&
                   this.y + this.height/2 > rect.y;
        }

        resolveCollision(rect) {
            const playerLeft = this.x - this.width/2;
            const playerRight = this.x + this.width/2;
            const playerTop = this.y - this.height/2;
            const playerBottom = this.y + this.height/2;

            const overlapLeft = playerRight - rect.x;
            const overlapRight = rect.x + rect.width - playerLeft;
            const overlapTop = playerBottom - rect.y;
            const overlapBottom = rect.y + rect.height - playerTop;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) this.x -= overlapLeft;
            else if (minOverlap === overlapRight) this.x += overlapRight;
            else if (minOverlap === overlapTop) this.y -= overlapTop;
            else if (minOverlap === overlapBottom) this.y += overlapBottom;
        }

        startRoll(direction) {
            if (this.isRolling || !this.canRoll) return;

            // Determine roll direction
            if (direction.x === 0 && direction.y === 0) {
                // Roll in movement direction or facing direction
                if (this.vx !== 0 || this.vy !== 0) {
                    direction = { x: this.vx, y: this.vy };
                } else {
                    // Roll toward mouse
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const len = Math.sqrt(dx*dx + dy*dy);
                    direction = { x: dx/len, y: dy/len };
                }
            }

            // Normalize direction
            const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            if (len > 0) {
                direction.x /= len;
                direction.y /= len;
            }

            this.isRolling = true;
            this.rollTimer = 0;
            this.rollDirection = direction;
            this.invulnTimer = this.rollIFrameEnd;

            // Spawn dust
            for (let i = 0; i < 5; i++) {
                spawnDustParticle(this.x, this.y);
            }
        }

        shoot() {
            if (this.isRolling || this.reloading || this.shootCooldown > 0) return;

            const weapon = this.currentWeapon;
            if (weapon.currentAmmo <= 0) {
                this.startReload();
                return;
            }

            // Calculate aim direction
            const aimX = mouse.x;
            const aimY = mouse.y;
            const dx = aimX - this.x;
            const dy = aimY - this.y;
            const baseAngle = Math.atan2(dy, dx);

            // Fire projectiles
            const spread = weapon.spread * this.spreadMult * (Math.PI / 180);

            for (let i = 0; i < weapon.projectileCount; i++) {
                let angle = baseAngle;

                // Add spread
                if (weapon.projectileCount > 1) {
                    const spreadRange = spread * 2;
                    const step = spreadRange / (weapon.projectileCount - 1);
                    angle = baseAngle - spread + step * i;
                } else {
                    angle += (Math.random() - 0.5) * spread;
                }

                // Random damage within range
                const damage = weapon.damage[0] + Math.random() * (weapon.damage[1] - weapon.damage[0]);

                playerBullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * weapon.projectileSpeed * TILE_SIZE,
                    vy: Math.sin(angle) * weapon.projectileSpeed * TILE_SIZE,
                    damage: damage * this.damageMult,
                    color: weapon.color,
                    size: 4,
                    piercing: weapon.piercing || false,
                    bouncy: this.hasBouncyBullets,
                    bounces: 2,
                    explosive: this.hasExplosiveBullets,
                    chain: this.hasChainBullets
                });
            }

            weapon.currentAmmo--;
            runStats.shotsFired++;
            this.shootCooldown = 1 / weapon.fireRate;

            // Muzzle flash and shell casing effects
            spawnMuzzleFlash(this.x, this.y, baseAngle);
            spawnShellCasing(this.x, this.y, baseAngle);

            // Auto reload when empty
            if (weapon.currentAmmo <= 0 && weapon.totalAmmo > 0) {
                this.startReload();
            }
        }

        startReload() {
            if (this.reloading) return;
            const weapon = this.currentWeapon;
            if (weapon.currentAmmo >= weapon.magazineSize) return;
            if (weapon.totalAmmo !== Infinity && weapon.totalAmmo <= 0) return;

            this.reloading = true;
            this.reloadTimer = weapon.reloadTime;
        }

        finishReload() {
            const weapon = this.currentWeapon;
            const needed = weapon.magazineSize - weapon.currentAmmo;

            if (weapon.totalAmmo === Infinity) {
                weapon.currentAmmo = weapon.magazineSize;
            } else {
                const canReload = Math.min(needed, weapon.totalAmmo);
                weapon.currentAmmo += canReload;
                weapon.totalAmmo -= canReload;
            }

            this.reloading = false;
            this.reloadTimer = 0;
        }

        switchWeapon(direction) {
            if (this.weapons.length <= 1) return;

            this.currentWeaponIndex = (this.currentWeaponIndex + direction + this.weapons.length) % this.weapons.length;
            this.reloading = false;
            this.reloadTimer = 0;
        }

        useBlank() {
            if (this.blanks <= 0) return;

            this.blanks--;

            // Clear all enemy bullets
            enemyBullets = [];

            // Knockback and stun enemies
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 150) {
                    const pushDist = 50;
                    enemy.x += (dx/dist) * pushDist;
                    enemy.y += (dy/dist) * pushDist;
                    enemy.stunTimer = 0.5;
                }
            }

            // Brief invulnerability
            this.invulnTimer = 0.5;

            // Visual effect
            triggerScreenShake(6, 0.2);
            spawnBlankWave(this.x, this.y);
        }

        takeDamage(amount) {
            if (this.invulnTimer > 0 || this.isRolling && this.rollTimer < this.rollIFrameEnd) return false;

            // Armor blocks first
            if (this.armor > 0) {
                this.armor--;
                this.invulnTimer = 0.5;
                triggerScreenShake(4, 0.15);
                damageFlash = 0.4;  // Lighter flash for armor hit
                return true;
            }

            this.health -= amount;
            this.invulnTimer = 1.0;
            runStats.damageTaken += amount;

            triggerScreenShake(8, 0.2);
            damageFlash = 0.6;  // Red screen flash

            if (this.health <= 0) {
                this.health = 0;
                gameState = 'dead';
            }

            return true;
        }

        addItem(item) {
            if (item.type === 'passive') {
                this.passiveItems.push(item);

                // Apply effects
                if (item.effect.damageMult) this.damageMult *= item.effect.damageMult;
                if (item.effect.spreadMult) this.spreadMult *= item.effect.spreadMult;
                if (item.effect.bouncy) this.hasBouncyBullets = true;
                if (item.effect.explosive) this.hasExplosiveBullets = true;
                if (item.effect.chain) this.hasChainBullets = true;
                if (item.effect.armor) this.armor += item.effect.armor;
            } else if (item.type === 'active') {
                this.activeItem = item;
                this.activeItemCooldown = 0;
            }
        }

        draw(ctx) {
            ctx.save();

            // Flash when invulnerable
            if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            // Draw player body (bullet-shaped character)
            const color = this.isRolling ? COLORS.playerRoll : COLORS.player;

            ctx.fillStyle = color;
            ctx.beginPath();

            if (this.isRolling) {
                // Stretched oval when rolling
                ctx.ellipse(this.x, this.y, this.width/2 + 4, this.height/2 - 2,
                    Math.atan2(this.rollDirection.y, this.rollDirection.x), 0, Math.PI * 2);
            } else {
                // Normal bullet shape
                ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            }
            ctx.fill();

            // Draw primer cap (brass colored cap on "bottom" of bullet)
            if (!this.isRolling) {
                const aimAngle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
                const capX = this.x - Math.cos(aimAngle) * 4;
                const capY = this.y - Math.sin(aimAngle) * 4;

                ctx.fillStyle = '#ddaa66';
                ctx.beginPath();
                ctx.arc(capX, capY, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Enemy {
        constructor(type, x, y) {
            const data = ENEMY_DATA[type];

            this.type = type;
            this.x = x;
            this.y = y;
            this.width = data.size;
            this.height = data.size;

            this.maxHealth = data.health;
            this.health = data.health;
            this.speed = data.speed * TILE_SIZE;
            this.damage = data.damage;

            this.behavior = data.behavior;
            this.fireRate = data.fireRate;
            this.bulletSpeed = data.bulletSpeed * TILE_SIZE;
            this.pattern = data.pattern;
            this.color = data.color;

            this.fireCooldown = Math.random() * this.fireRate;
            this.behaviorTimer = 0;
            this.strafeDir = Math.random() < 0.5 ? 1 : -1;
            this.circleAngle = Math.random() * Math.PI * 2;

            this.flashTimer = 0;
            this.stunTimer = 0;

            // Spawn animation
            this.spawnTimer = 0.5;
            this.isSpawning = true;
        }

        update(dt) {
            // Spawn animation
            if (this.isSpawning) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.isSpawning = false;
                }
                return;
            }

            // Stun
            if (this.stunTimer > 0) {
                this.stunTimer -= dt;
                return;
            }

            // Flash timer
            if (this.flashTimer > 0) {
                this.flashTimer -= dt;
            }

            this.behaviorTimer += dt;

            // Update behavior
            this.updateBehavior(dt);

            // Update firing
            this.fireCooldown -= dt;
            if (this.fireCooldown <= 0 && this.fireRate > 0) {
                this.fire();
                this.fireCooldown = this.fireRate;
            }

            // Constrain to room
            this.constrainToRoom();
        }

        updateBehavior(dt) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const preferredRange = 100;

            switch (this.behavior) {
                case 'basic':
                    if (dist > preferredRange) {
                        this.x += (dx / dist) * this.speed * dt;
                        this.y += (dy / dist) * this.speed * dt;
                    }
                    break;

                case 'strafe':
                    // Move perpendicular to player
                    if (this.behaviorTimer > 1.5) {
                        this.strafeDir *= -1;
                        this.behaviorTimer = 0;
                    }

                    const perpX = -dy / dist;
                    const perpY = dx / dist;

                    this.x += perpX * this.strafeDir * this.speed * dt;
                    this.y += perpY * this.strafeDir * this.speed * dt;

                    // Maintain distance
                    if (dist > preferredRange + 30) {
                        this.x += (dx / dist) * this.speed * 0.5 * dt;
                        this.y += (dy / dist) * this.speed * 0.5 * dt;
                    } else if (dist < preferredRange - 30) {
                        this.x -= (dx / dist) * this.speed * 0.5 * dt;
                        this.y -= (dy / dist) * this.speed * 0.5 * dt;
                    }
                    break;

                case 'aggressive':
                    this.x += (dx / dist) * this.speed * dt;
                    this.y += (dy / dist) * this.speed * dt;
                    break;

                case 'stationary':
                    // Don't move
                    break;

                case 'wander':
                    if (this.behaviorTimer > 2) {
                        this.wanderAngle = Math.random() * Math.PI * 2;
                        this.behaviorTimer = 0;
                    }
                    this.wanderAngle = this.wanderAngle || 0;
                    this.x += Math.cos(this.wanderAngle) * this.speed * dt;
                    this.y += Math.sin(this.wanderAngle) * this.speed * dt;
                    break;

                case 'circle':
                    // Circle around player
                    this.circleAngle += this.speed / 100 * dt;
                    const targetX = player.x + Math.cos(this.circleAngle) * 120;
                    const targetY = player.y + Math.sin(this.circleAngle) * 120;

                    const toDx = targetX - this.x;
                    const toDy = targetY - this.y;
                    const toDist = Math.sqrt(toDx*toDx + toDy*toDy);

                    if (toDist > 5) {
                        this.x += (toDx / toDist) * this.speed * dt;
                        this.y += (toDy / toDist) * this.speed * dt;
                    }
                    break;

                case 'bounce':
                    // Rubber Kin - bounces off walls rapidly
                    if (!this.bounceVx) {
                        const angle = Math.random() * Math.PI * 2;
                        this.bounceVx = Math.cos(angle) * this.speed;
                        this.bounceVy = Math.sin(angle) * this.speed;
                    }

                    this.x += this.bounceVx * dt;
                    this.y += this.bounceVy * dt;

                    // Bounce off room walls
                    const minX = ROOM_OFFSET_X + TILE_SIZE + this.width/2;
                    const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width/2;
                    const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height/2;
                    const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height/2;

                    if (this.x < minX || this.x > maxX) {
                        this.bounceVx *= -1;
                        this.x = Math.max(minX, Math.min(maxX, this.x));
                    }
                    if (this.y < minY || this.y > maxY) {
                        this.bounceVy *= -1;
                        this.y = Math.max(minY, Math.min(maxY, this.y));
                    }
                    break;
            }
        }

        fire() {
            if (this.pattern === 'melee') return;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);

            switch (this.pattern) {
                case 'single':
                    this.spawnBullet(angle);
                    break;

                case 'spread3':
                    for (let i = -1; i <= 1; i++) {
                        this.spawnBullet(angle + i * 0.2);
                    }
                    break;

                case 'spread6':
                    for (let i = -2; i <= 2; i++) {
                        this.spawnBullet(angle + i * 0.15);
                    }
                    break;

                case 'spread8':
                    for (let i = -3; i <= 4; i++) {
                        this.spawnBullet(angle + i * 0.12);
                    }
                    break;

                case 'cardinal':
                    for (let i = 0; i < 4; i++) {
                        this.spawnBullet(i * Math.PI / 2);
                    }
                    break;

                case 'spiral':
                    this.spiralAngle = (this.spiralAngle || 0) + 0.3;
                    for (let i = 0; i < 3; i++) {
                        this.spawnBullet(this.spiralAngle + i * Math.PI * 2 / 3);
                    }
                    break;

                case 'grenade':
                    // Grenade Kin - lobs grenades that explode
                    enemyBullets.push({
                        x: this.x,
                        y: this.y,
                        vx: (dx / dist) * this.bulletSpeed * TILE_SIZE * 0.8,
                        vy: (dy / dist) * this.bulletSpeed * TILE_SIZE * 0.8 - 50,
                        damage: this.damage,
                        color: '#448844',
                        size: 8,
                        grenade: true,
                        fuseTimer: 1.5,
                        gravity: true
                    });
                    break;

                case 'homing':
                    // Lead Maiden - homing bullets
                    this.spawnBullet(angle, true);
                    break;

                case 'bounce':
                    // Skullet - bouncing bullets
                    enemyBullets.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * this.bulletSpeed * TILE_SIZE,
                        vy: Math.sin(angle) * this.bulletSpeed * TILE_SIZE,
                        damage: this.damage,
                        color: '#ccccaa',
                        size: 5,
                        bouncy: true,
                        bounces: 3
                    });
                    break;

                case 'none':
                    // No shooting (Rubber Kin)
                    break;
            }
        }

        spawnBullet(angle, homing = false) {
            enemyBullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * this.bulletSpeed,
                vy: Math.sin(angle) * this.bulletSpeed,
                damage: this.damage,
                color: homing ? '#8866ff' : COLORS.enemyBullet,
                size: homing ? 6 : 5,
                homing: homing
            });
        }

        constrainToRoom() {
            const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
            const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
            const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
            const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

            this.x = Math.max(minX, Math.min(maxX, this.x));
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }

        takeDamage(amount) {
            this.health -= amount;
            this.flashTimer = 0.1;

            // Damage cooldown on active item
            if (player.activeItem && player.activeItemCooldown > 0) {
                player.activeItemCooldown -= amount;
            }

            if (this.health <= 0) {
                this.die();
                return true;
            }
            return false;
        }

        die() {
            // Spawn shell drops
            const shellCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < shellCount; i++) {
                pickups.push({
                    type: 'shell',
                    x: this.x + (Math.random() - 0.5) * 20,
                    y: this.y + (Math.random() - 0.5) * 20,
                    value: 1
                });
            }

            // Death particles
            spawnDeathParticles(this.x, this.y, this.color);
        }

        draw(ctx) {
            ctx.save();

            // Spawn animation
            if (this.isSpawning) {
                const scale = 1 - this.spawnTimer * 2;
                ctx.globalAlpha = scale;
            }

            // Flash on hit
            if (this.flashTimer > 0) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = this.color;
            }

            // Draw bullet-shaped enemy body
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width/2, this.height/2 * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bullet cap
            ctx.fillStyle = '#aa8844';
            ctx.beginPath();
            ctx.arc(this.x, this.y + this.height/3, this.width/3, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Health bar for damaged enemies
            if (this.health < this.maxHealth) {
                const barWidth = this.width + 4;
                const barHeight = 3;
                const barX = this.x - barWidth/2;
                const barY = this.y - this.height/2 - 8;

                ctx.fillStyle = '#222222';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#44ff44';
                ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BOSS CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Boss {
        constructor(type) {
            const data = BOSS_DATA[type];

            this.type = type;
            this.name = data.name;
            this.x = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
            this.y = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 3;
            this.width = data.size;
            this.height = data.size;

            this.maxHealth = data.health;
            this.health = data.health;
            this.color = data.color;
            this.phases = data.phases;
            this.currentPhase = 0;

            this.attackTimer = 2;
            this.currentAttack = null;
            this.attackCooldown = 0;

            this.flashTimer = 0;
            this.rotation = 0;

            // Boss-specific state
            this.spinSpeed = 0;
            this.spiralAngle = 0;
        }

        update(dt) {
            if (this.flashTimer > 0) this.flashTimer -= dt;

            // Update phase based on health
            const healthPercent = this.health / this.maxHealth;
            for (let i = this.phases.length - 1; i >= 0; i--) {
                if (healthPercent <= this.phases[i].threshold) {
                    this.currentPhase = i;
                    break;
                }
            }

            // Attack timer
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.executeRandomAttack();
                this.attackTimer = 2 + Math.random();
            }

            // Update current attack
            this.updateAttack(dt);
        }

        executeRandomAttack() {
            const phase = this.phases[this.currentPhase];
            const attacks = phase.attacks;
            this.currentAttack = attacks[Math.floor(Math.random() * attacks.length)];
            this.attackCooldown = 0;
        }

        updateAttack(dt) {
            this.attackCooldown += dt;

            switch (this.currentAttack) {
                case 'throneSpinSlow':
                case 'throneSpinFast':
                    const speed = this.currentAttack === 'throneSpinFast' ? 3 : 1.5;
                    this.rotation += speed * dt;

                    if (this.attackCooldown % 0.1 < dt) {
                        for (let i = 0; i < 8; i++) {
                            const angle = this.rotation + i * Math.PI / 4;
                            this.spawnBullet(angle, 4);
                        }
                    }

                    if (this.attackCooldown > 3) {
                        this.currentAttack = null;
                    }
                    break;

                case 'spreadVolley':
                    if (this.attackCooldown < 0.1) {
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        for (let i = -3; i <= 3; i++) {
                            this.spawnBullet(angle + i * 0.15, 6);
                        }
                    }
                    if (this.attackCooldown > 0.5) {
                        this.currentAttack = null;
                    }
                    break;

                case 'bulletBurst':
                    if (this.attackCooldown < 0.1) {
                        for (let i = 0; i < 16; i++) {
                            this.spawnBullet(i * Math.PI / 8, 5);
                        }
                    }
                    if (this.attackCooldown > 0.5) {
                        this.currentAttack = null;
                    }
                    break;

                case 'rainOfBullets':
                    if (this.attackCooldown % 0.2 < dt) {
                        for (let i = 0; i < 5; i++) {
                            enemyBullets.push({
                                x: ROOM_OFFSET_X + Math.random() * ROOM_WIDTH * TILE_SIZE,
                                y: ROOM_OFFSET_Y,
                                vx: 0,
                                vy: 150,
                                damage: 1,
                                color: COLORS.enemyBullet,
                                size: 6
                            });
                        }
                    }
                    if (this.attackCooldown > 3) {
                        this.currentAttack = null;
                    }
                    break;

                case 'gatlingSpray':
                    if (this.attackCooldown % 0.05 < dt) {
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        this.spawnBullet(angle + (Math.random() - 0.5) * 0.5, 8);
                    }
                    if (this.attackCooldown > 2) {
                        this.currentAttack = null;
                    }
                    break;

                case 'wideSweep':
                    this.sweepAngle = this.sweepAngle || -Math.PI / 2;
                    this.sweepAngle += 2 * dt;

                    if (this.attackCooldown % 0.08 < dt) {
                        this.spawnBullet(this.sweepAngle, 5);
                    }
                    if (this.attackCooldown > 2) {
                        this.currentAttack = null;
                    }
                    break;

                case 'jumpAttack':
                    // Simplified jump - just teleport near player
                    if (this.attackCooldown < 0.1) {
                        const targetX = player.x + (Math.random() - 0.5) * 100;
                        const targetY = player.y + (Math.random() - 0.5) * 100;
                        this.x = Math.max(ROOM_OFFSET_X + 50, Math.min(ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 50, targetX));
                        this.y = Math.max(ROOM_OFFSET_Y + 50, Math.min(ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 50, targetY));

                        // Shockwave
                        for (let i = 0; i < 12; i++) {
                            this.spawnBullet(i * Math.PI / 6, 4);
                        }
                        triggerScreenShake(10, 0.3);
                    }
                    if (this.attackCooldown > 0.5) {
                        this.currentAttack = null;
                    }
                    break;

                case 'missileBarrage':
                    if (this.attackCooldown % 0.3 < dt && this.attackCooldown < 2) {
                        // Homing missile (simplified)
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        this.spawnBullet(angle, 3, true);
                    }
                    if (this.attackCooldown > 3) {
                        this.currentAttack = null;
                    }
                    break;

                case 'tentacleSpray':
                    if (this.attackCooldown % 0.15 < dt) {
                        for (let i = 0; i < 6; i++) {
                            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                            const tentacleAngle = baseAngle + (i - 2.5) * 0.3;
                            this.spawnBullet(tentacleAngle + (Math.random() - 0.5) * 0.2, 5);
                        }
                    }
                    if (this.attackCooldown > 2) {
                        this.currentAttack = null;
                    }
                    break;

                case 'bulletRing':
                    if (this.attackCooldown < 0.1) {
                        for (let i = 0; i < 24; i++) {
                            this.spawnBullet(i * Math.PI / 12, 4);
                        }
                    }
                    if (this.attackCooldown > 0.5) {
                        this.currentAttack = null;
                    }
                    break;

                case 'eyeBeam':
                    // Sweeping laser (simplified as rapid bullets)
                    this.beamAngle = this.beamAngle || -Math.PI / 3;
                    this.beamAngle += 1.5 * dt;

                    if (this.attackCooldown % 0.03 < dt) {
                        this.spawnBullet(this.beamAngle, 12, false, '#ff88ff');
                    }
                    if (this.attackCooldown > 2) {
                        this.currentAttack = null;
                    }
                    break;

                case 'spawnBeadies':
                    if (this.attackCooldown < 0.1 && enemies.length < 6) {
                        for (let i = 0; i < 2; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 60;
                            enemies.push(new Enemy('bookllet',
                                this.x + Math.cos(angle) * dist,
                                this.y + Math.sin(angle) * dist
                            ));
                        }
                    }
                    if (this.attackCooldown > 0.5) {
                        this.currentAttack = null;
                    }
                    break;
            }
        }

        spawnBullet(angle, speed, homing = false, color = COLORS.enemyBullet) {
            enemyBullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed * TILE_SIZE,
                vy: Math.sin(angle) * speed * TILE_SIZE,
                damage: 1,
                color: color,
                size: 6,
                homing: homing
            });
        }

        takeDamage(amount) {
            this.health -= amount;
            this.flashTimer = 0.1;

            // Active item cooldown
            if (player.activeItem && player.activeItemCooldown > 0) {
                player.activeItemCooldown -= amount;
            }

            if (this.health <= 0) {
                this.die();
                return true;
            }
            return false;
        }

        die() {
            // Boss death - lots of rewards
            for (let i = 0; i < 20; i++) {
                pickups.push({
                    type: 'shell',
                    x: this.x + (Math.random() - 0.5) * 60,
                    y: this.y + (Math.random() - 0.5) * 60,
                    value: 2
                });
            }

            // Drop a key
            pickups.push({
                type: 'key',
                x: this.x,
                y: this.y + 30
            });

            spawnDeathParticles(this.x, this.y, this.color, 30);
            triggerScreenShake(15, 0.5);

            gameState = 'victory';
        }

        draw(ctx) {
            ctx.save();

            if (this.flashTimer > 0) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = this.color;
            }

            // Draw boss body (large bullet king style)
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width/2, this.height/2 * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Crown for Bullet King
            if (this.type === 'bulletKing') {
                ctx.fillStyle = '#ffdd44';
                ctx.beginPath();
                ctx.moveTo(this.x - 15, this.y - this.height/2 + 5);
                ctx.lineTo(this.x - 10, this.y - this.height/2 - 10);
                ctx.lineTo(this.x - 5, this.y - this.height/2 + 2);
                ctx.lineTo(this.x, this.y - this.height/2 - 8);
                ctx.lineTo(this.x + 5, this.y - this.height/2 + 2);
                ctx.lineTo(this.x + 10, this.y - this.height/2 - 10);
                ctx.lineTo(this.x + 15, this.y - this.height/2 + 5);
                ctx.closePath();
                ctx.fill();
            }

            // Brass cap
            ctx.fillStyle = '#bb9944';
            ctx.beginPath();
            ctx.arc(this.x, this.y + this.height/3, this.width/2.5, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x - 8, this.y, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 8, this.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Angry eyebrows
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 14, this.y - 8);
            ctx.lineTo(this.x - 4, this.y - 4);
            ctx.moveTo(this.x + 14, this.y - 8);
            ctx.lineTo(this.x + 4, this.y - 4);
            ctx.stroke();

            ctx.restore();

            // Health bar
            const barWidth = 200;
            const barHeight = 12;
            const barX = CANVAS_WIDTH / 2 - barWidth / 2;
            const barY = CANVAS_HEIGHT - 40;

            ctx.fillStyle = '#222222';
            ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

            ctx.fillStyle = '#880000';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);

            // Boss name
            ctx.fillStyle = COLORS.uiText;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, CANVAS_WIDTH / 2, barY - 8);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROOM GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    function generateFloor(floorNum) {
        floorRooms = [];
        visitedRooms.clear();

        const roomCount = 6 + floorNum * 2;

        // Create room grid
        const grid = [];
        for (let y = 0; y < 5; y++) {
            grid[y] = [];
            for (let x = 0; x < 5; x++) {
                grid[y][x] = null;
            }
        }

        // Start in center
        const startX = 2;
        const startY = 2;

        // Generate rooms using random walk
        const positions = [[startX, startY]];
        grid[startY][startX] = { type: 'start', x: startX, y: startY };

        while (positions.length < roomCount) {
            const lastPos = positions[positions.length - 1];
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            const validDirs = dirs.filter(d => {
                const nx = lastPos[0] + d[0];
                const ny = lastPos[1] + d[1];
                return nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && !grid[ny][nx];
            });

            if (validDirs.length === 0) {
                // Backtrack
                positions.pop();
                if (positions.length === 0) break;
                continue;
            }

            const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            const nx = lastPos[0] + dir[0];
            const ny = lastPos[1] + dir[1];

            positions.push([nx, ny]);
            grid[ny][nx] = { type: 'combat', x: nx, y: ny };
        }

        // Assign special rooms
        if (positions.length >= 3) {
            const lastPos = positions[positions.length - 1];
            grid[lastPos[1]][lastPos[0]].type = 'boss';

            // Shop somewhere in middle
            const midIndex = Math.floor(positions.length / 2);
            const shopPos = positions[midIndex];
            grid[shopPos[1]][shopPos[0]].type = 'shop';

            // Treasure room
            if (positions.length >= 4) {
                const treasureIndex = Math.floor(positions.length / 3);
                const treasurePos = positions[treasureIndex];
                if (grid[treasurePos[1]][treasurePos[0]].type === 'combat') {
                    grid[treasurePos[1]][treasurePos[0]].type = 'treasure';
                }
            }
        }

        // Convert grid to room list with connections
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                if (grid[y][x]) {
                    const room = grid[y][x];
                    room.connections = [];

                    // Check adjacent rooms
                    if (y > 0 && grid[y-1][x]) room.connections.push('north');
                    if (y < 4 && grid[y+1][x]) room.connections.push('south');
                    if (x > 0 && grid[y][x-1]) room.connections.push('west');
                    if (x < 4 && grid[y][x+1]) room.connections.push('east');

                    room.cleared = room.type !== 'combat' && room.type !== 'boss';

                    floorRooms.push(room);
                }
            }
        }

        // Start in start room
        currentRoom = floorRooms.find(r => r.type === 'start');
        loadRoom(currentRoom);
    }

    function loadRoom(room) {
        currentRoom = room;
        visitedRooms.add(`${room.x},${room.y}`);

        enemies = [];
        obstacles = [];
        pickups = [];
        doors = [];
        chests = [];
        playerBullets = [];
        enemyBullets = [];

        roomCleared = room.cleared;

        // Create doors
        const doorPositions = {
            north: { x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2, y: ROOM_OFFSET_Y + 8 },
            south: { x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2, y: ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE + 8 },
            west: { x: ROOM_OFFSET_X + 8, y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 },
            east: { x: ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE + 8, y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 }
        };

        for (const dir of room.connections) {
            doors.push({
                dir: dir,
                x: doorPositions[dir].x,
                y: doorPositions[dir].y,
                width: dir === 'north' || dir === 'south' ? 32 : 16,
                height: dir === 'north' || dir === 'south' ? 16 : 32,
                open: roomCleared
            });
        }

        // Generate room content
        generateRoomContent(room);

        // Place player at entry point
        if (player) {
            player.x = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
            player.y = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
        }
    }

    function generateRoomContent(room) {
        // Add cover objects to all rooms
        const numObstacles = 3 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numObstacles; i++) {
            const obstacleTypes = ['pillar', 'crate', 'barrel', 'table'];
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

            let x, y;
            let attempts = 0;
            do {
                x = ROOM_OFFSET_X + TILE_SIZE * 2 + Math.random() * (ROOM_WIDTH - 4) * TILE_SIZE;
                y = ROOM_OFFSET_Y + TILE_SIZE * 2 + Math.random() * (ROOM_HEIGHT - 4) * TILE_SIZE;
                attempts++;
            } while (attempts < 20 && isNearCenter(x, y));

            const obstacle = {
                type: type,
                x: x,
                y: y,
                width: type === 'pillar' ? 20 : 24,
                height: type === 'pillar' ? 20 : 24,
                health: type === 'pillar' ? Infinity : 20,
                destructible: type !== 'pillar',
                flipped: false,
                explosive: type === 'barrel'
            };

            obstacles.push(obstacle);
        }

        // Generate enemies for combat rooms
        if (room.type === 'combat' && !room.cleared) {
            const enemyCount = 3 + currentFloor + Math.floor(Math.random() * 3);
            const enemyTypes = ['bulletKin', 'bulletKin', 'bandanaBulletKin', 'cardinal', 'skullet'];

            if (currentFloor >= 2) {
                enemyTypes.push('shotgunKinBlue', 'shroomer', 'rubberKin', 'grenadeKin');
            }
            if (currentFloor >= 3) {
                enemyTypes.push('shotgunKinRed', 'gunNut', 'bookllet', 'leadMaiden');
            }

            for (let i = 0; i < enemyCount; i++) {
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                const x = ROOM_OFFSET_X + TILE_SIZE * 3 + Math.random() * (ROOM_WIDTH - 6) * TILE_SIZE;
                const y = ROOM_OFFSET_Y + TILE_SIZE * 3 + Math.random() * (ROOM_HEIGHT - 6) * TILE_SIZE;

                enemies.push(new Enemy(type, x, y));
            }
        }

        // Treasure room
        if (room.type === 'treasure') {
            const qualities = ['D', 'C', 'B'];
            const quality = qualities[Math.floor(Math.random() * qualities.length)];

            chests.push({
                x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2,
                quality: quality,
                locked: quality !== 'D' || Math.random() < 0.5,
                open: false
            });
        }

        // Shop room
        if (room.type === 'shop') {
            // Generate shop items
            const shopItems = [
                { type: 'heart', price: 20 },
                { type: 'armor', price: 25 },
                { type: 'key', price: 25 },
                { type: 'blank', price: 15 }
            ];

            shopItems.forEach((item, i) => {
                pickups.push({
                    ...item,
                    x: ROOM_OFFSET_X + 100 + i * 80,
                    y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2,
                    forSale: true
                });
            });
        }

        // Boss room
        if (room.type === 'boss' && !room.cleared) {
            const bossTypes = ['bulletKing', 'gatlingGull'];
            if (currentFloor >= 2) bossTypes.push('beholster');

            const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            enemies.push(new Boss(bossType));

            gameState = 'bossFight';
        }
    }

    function isNearCenter(x, y) {
        const cx = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
        const cy = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
        return Math.abs(x - cx) < 60 && Math.abs(y - cy) < 60;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function spawnDustParticle(x, y) {
        particles.push({
            type: 'dust',
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5,
            size: 2 + Math.random() * 3,
            color: '#888888'
        });
    }

    function spawnDeathParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            particles.push({
                type: 'death',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                size: 3 + Math.random() * 4,
                color: color
            });
        }
    }

    function spawnBulletHitParticle(x, y, color) {
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            particles.push({
                type: 'hit',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.2 + Math.random() * 0.1,
                maxLife: 0.3,
                size: 2 + Math.random() * 2,
                color: color
            });
        }
    }

    function spawnBlankWave(x, y) {
        for (let i = 0; i < 24; i++) {
            const angle = i * Math.PI / 12;
            particles.push({
                type: 'blank',
                x: x,
                y: y,
                vx: Math.cos(angle) * 300,
                vy: Math.sin(angle) * 300,
                life: 0.3,
                maxLife: 0.3,
                size: 8,
                color: '#ffffff'
            });
        }
    }

    function spawnMuzzleFlash(x, y, angle) {
        // Main flash
        particles.push({
            type: 'muzzle',
            x: x + Math.cos(angle) * 10,
            y: y + Math.sin(angle) * 10,
            vx: Math.cos(angle) * 20,
            vy: Math.sin(angle) * 20,
            life: 0.08,
            maxLife: 0.08,
            size: 8,
            color: '#ffff88'
        });

        // Spark particles
        for (let i = 0; i < 3; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.5;
            particles.push({
                type: 'spark',
                x: x + Math.cos(angle) * 8,
                y: y + Math.sin(angle) * 8,
                vx: Math.cos(sparkAngle) * (60 + Math.random() * 40),
                vy: Math.sin(sparkAngle) * (60 + Math.random() * 40),
                life: 0.1 + Math.random() * 0.1,
                maxLife: 0.2,
                size: 2,
                color: '#ffaa44'
            });
        }
    }

    function spawnShellCasing(x, y, angle) {
        const ejectAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        particles.push({
            type: 'shell',
            x: x,
            y: y,
            vx: Math.cos(ejectAngle) * (40 + Math.random() * 20),
            vy: Math.sin(ejectAngle) * (40 + Math.random() * 20) - 30,
            life: 0.5,
            maxLife: 0.5,
            size: 3,
            color: '#cc9944',
            gravity: true
        });
    }

    function explodeGrenade(x, y) {
        // Visual explosion
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            particles.push({
                type: 'explosion',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 4 + Math.random() * 4,
                color: Math.random() < 0.5 ? '#ff8844' : '#ffcc44'
            });
        }

        triggerScreenShake(8, 0.25);

        // Damage player if close
        const dx = player.x - x;
        const dy = player.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            player.takeDamage(2);
        } else if (dist < 80) {
            player.takeDamage(1);
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // Apply gravity for shell casings
            if (p.gravity) {
                p.vy += 400 * dt;
            }

            // Slow down
            p.vx *= 0.95;
            p.vy *= 0.95;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles(ctx) {
        for (const p of particles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCREEN EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════

    function triggerScreenShake(intensity, duration) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
    }

    function updateScreenShake(dt) {
        if (screenShake.duration > 0) {
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.duration -= dt;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    function updateDamageFlash(dt) {
        if (damageFlash > 0) {
            damageFlash -= dt * 3;  // Fade out over ~0.2 seconds
            if (damageFlash < 0) damageFlash = 0;
        }
    }

    function drawDamageFlash(ctx) {
        if (damageFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(180, 0, 0, ${damageFlash * 0.5})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Vignette effect
            const gradient = ctx.createRadialGradient(
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
            );
            gradient.addColorStop(0, 'rgba(180, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(180, 0, 0, ${damageFlash * 0.6})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
        }
    }

    function spawnHitMarker(x, y, isKill) {
        hitMarkers.push({
            x: x,
            y: y,
            life: 0.3,
            maxLife: 0.3,
            isKill: isKill,
            scale: 1.5
        });
    }

    function updateHitMarkers(dt) {
        for (let i = hitMarkers.length - 1; i >= 0; i--) {
            hitMarkers[i].life -= dt;
            hitMarkers[i].scale -= dt * 2;
            if (hitMarkers[i].life <= 0) {
                hitMarkers.splice(i, 1);
            }
        }
    }

    function drawHitMarkers(ctx) {
        for (const marker of hitMarkers) {
            const alpha = marker.life / marker.maxLife;
            const size = 8 * Math.max(0.5, marker.scale);

            ctx.save();
            ctx.strokeStyle = marker.isKill ? `rgba(255, 50, 50, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = marker.isKill ? 3 : 2;
            ctx.translate(marker.x, marker.y);

            // Draw X
            ctx.beginPath();
            ctx.moveTo(-size, -size);
            ctx.lineTo(size, size);
            ctx.moveTo(size, -size);
            ctx.lineTo(-size, size);
            ctx.stroke();
            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLLISION & PHYSICS
    // ═══════════════════════════════════════════════════════════════════════════

    function updateBullets(dt) {
        // Update player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Check room bounds
            if (b.x < ROOM_OFFSET_X || b.x > ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE ||
                b.y < ROOM_OFFSET_Y || b.y > ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE) {

                if (b.bouncy && b.bounces > 0) {
                    // Bounce off walls
                    if (b.x < ROOM_OFFSET_X || b.x > ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE) {
                        b.vx *= -1;
                    }
                    if (b.y < ROOM_OFFSET_Y || b.y > ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE) {
                        b.vy *= -1;
                    }
                    b.bounces--;
                    b.x = Math.max(ROOM_OFFSET_X + 1, Math.min(ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 1, b.x));
                    b.y = Math.max(ROOM_OFFSET_Y + 1, Math.min(ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 1, b.y));
                } else {
                    playerBullets.splice(i, 1);
                    continue;
                }
            }

            // Check obstacle collisions
            for (const obs of obstacles) {
                if (bulletHitsRect(b, obs)) {
                    if (obs.destructible) {
                        obs.health -= b.damage;
                        if (obs.health <= 0) {
                            if (obs.explosive) {
                                // Barrel explosion
                                for (const enemy of enemies) {
                                    const dx = enemy.x - obs.x;
                                    const dy = enemy.y - obs.y;
                                    if (Math.sqrt(dx*dx + dy*dy) < 60) {
                                        enemy.takeDamage(20);
                                    }
                                }
                                triggerScreenShake(8, 0.2);
                                spawnDeathParticles(obs.x, obs.y, '#ff8844', 15);
                            }
                            const idx = obstacles.indexOf(obs);
                            if (idx > -1) obstacles.splice(idx, 1);
                        }
                    }

                    if (!b.piercing) {
                        spawnBulletHitParticle(b.x, b.y, b.color);
                        playerBullets.splice(i, 1);
                        break;
                    }
                }
            }

            // Check enemy collisions
            for (const enemy of enemies) {
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < enemy.width / 2 + b.size) {
                    runStats.damageDealt += b.damage;
                    const killed = enemy.takeDamage(b.damage);

                    // Spawn hit marker
                    spawnHitMarker(enemy.x, enemy.y, killed);

                    if (killed) {
                        runStats.kills++;
                        const idx = enemies.indexOf(enemy);
                        if (idx > -1) enemies.splice(idx, 1);
                    }

                    // Explosive bullets
                    if (b.explosive) {
                        for (const other of enemies) {
                            if (other !== enemy) {
                                const dx2 = other.x - b.x;
                                const dy2 = other.y - b.y;
                                if (Math.sqrt(dx2*dx2 + dy2*dy2) < 40) {
                                    other.takeDamage(b.damage * 0.5);
                                }
                            }
                        }
                        triggerScreenShake(5, 0.15);
                        spawnDeathParticles(b.x, b.y, '#ffaa44', 8);
                    }

                    spawnBulletHitParticle(b.x, b.y, b.color);

                    if (!b.piercing) {
                        playerBullets.splice(i, 1);
                    }
                    break;
                }
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];

            // Homing bullets
            if (b.homing) {
                const dx = player.x - b.x;
                const dy = player.y - b.y;
                const angle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(b.vy, b.vx);
                const diff = angle - currentAngle;
                const turnSpeed = 2;
                const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed * dt);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }

            // Gravity for grenades
            if (b.gravity) {
                b.vy += 300 * dt;
            }

            // Grenade fuse timer
            if (b.grenade) {
                b.fuseTimer -= dt;
                if (b.fuseTimer <= 0) {
                    // Explode
                    explodeGrenade(b.x, b.y);
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Check room bounds with bouncing
            const hitLeft = b.x < ROOM_OFFSET_X + TILE_SIZE;
            const hitRight = b.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE;
            const hitTop = b.y < ROOM_OFFSET_Y + TILE_SIZE;
            const hitBottom = b.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE;

            if (hitLeft || hitRight || hitTop || hitBottom) {
                if (b.bouncy && b.bounces > 0) {
                    if (hitLeft || hitRight) b.vx *= -1;
                    if (hitTop || hitBottom) b.vy *= -1;
                    b.bounces--;
                    b.x = Math.max(ROOM_OFFSET_X + TILE_SIZE, Math.min(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE, b.x));
                    b.y = Math.max(ROOM_OFFSET_Y + TILE_SIZE, Math.min(ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE, b.y));
                } else if (b.grenade) {
                    // Grenades explode on wall hit
                    explodeGrenade(b.x, b.y);
                    enemyBullets.splice(i, 1);
                    continue;
                } else {
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            // Check obstacle collisions
            let hitObstacle = false;
            for (const obs of obstacles) {
                if (bulletHitsRect(b, obs)) {
                    if (b.grenade) {
                        explodeGrenade(b.x, b.y);
                    } else {
                        spawnBulletHitParticle(b.x, b.y, b.color);
                    }
                    hitObstacle = true;
                    enemyBullets.splice(i, 1);
                    break;
                }
            }
            if (hitObstacle) continue;

            // Check player collision
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < player.width / 2 + b.size) {
                if (player.takeDamage(b.damage)) {
                    enemyBullets.splice(i, 1);
                }
            }
        }
    }

    function bulletHitsRect(bullet, rect) {
        return bullet.x > rect.x && bullet.x < rect.x + rect.width &&
               bullet.y > rect.y && bullet.y < rect.y + rect.height;
    }

    function checkRoomCleared() {
        if (!roomCleared && enemies.length === 0 && currentRoom.type !== 'start') {
            roomCleared = true;
            currentRoom.cleared = true;
            runStats.roomsCleared++;

            // Open doors
            for (const door of doors) {
                door.open = true;
            }

            // Refill blanks at boss clear
            if (currentRoom.type === 'boss') {
                player.blanks = Math.min(player.blanks + 2, 9);
                runStats.bossesKilled++;
            }
        }
    }

    function checkDoorTransitions() {
        if (!roomCleared) return;

        for (const door of doors) {
            if (!door.open) continue;

            const dx = player.x - door.x;
            const dy = player.y - door.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 20) {
                // Find connected room
                let targetX = currentRoom.x;
                let targetY = currentRoom.y;

                switch (door.dir) {
                    case 'north': targetY--; break;
                    case 'south': targetY++; break;
                    case 'west': targetX--; break;
                    case 'east': targetX++; break;
                }

                const targetRoom = floorRooms.find(r => r.x === targetX && r.y === targetY);
                if (targetRoom) {
                    loadRoom(targetRoom);

                    // Position player at opposite door
                    switch (door.dir) {
                        case 'north': player.y = ROOM_OFFSET_Y + (ROOM_HEIGHT - 2) * TILE_SIZE; break;
                        case 'south': player.y = ROOM_OFFSET_Y + TILE_SIZE * 2; break;
                        case 'west': player.x = ROOM_OFFSET_X + (ROOM_WIDTH - 2) * TILE_SIZE; break;
                        case 'east': player.x = ROOM_OFFSET_X + TILE_SIZE * 2; break;
                    }
                }
            }
        }
    }

    function checkPickups() {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            const dx = player.x - p.x;
            const dy = player.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 20) {
                if (p.forSale) {
                    // Shop item
                    if (player.shells >= p.price) {
                        player.shells -= p.price;
                        applyPickup(p);
                        pickups.splice(i, 1);
                    }
                } else {
                    applyPickup(p);
                    pickups.splice(i, 1);
                }
            }
        }
    }

    function applyPickup(pickup) {
        switch (pickup.type) {
            case 'shell':
                player.shells += pickup.value || 1;
                break;
            case 'heart':
                player.health = Math.min(player.health + 2, player.maxHealth);
                break;
            case 'halfHeart':
                player.health = Math.min(player.health + 1, player.maxHealth);
                break;
            case 'armor':
                player.armor = Math.min(player.armor + 1, 3);
                break;
            case 'key':
                player.keys++;
                break;
            case 'blank':
                player.blanks = Math.min(player.blanks + 1, 9);
                break;
            case 'ammo':
                // Refill current weapon
                const weapon = player.currentWeapon;
                if (weapon.totalAmmo !== Infinity) {
                    weapon.totalAmmo = Math.min(weapon.totalAmmo + Math.floor(weapon.maxAmmo * 0.2), weapon.maxAmmo);
                }
                break;
        }
    }

    function checkTableFlip() {
        if (!keys['e']) return;

        for (const obs of obstacles) {
            if (obs.type !== 'table' || obs.flipped) continue;

            const dx = player.x - (obs.x + obs.width/2);
            const dy = player.y - (obs.y + obs.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 40) {
                flipTable(obs, dx, dy);
                keys['e'] = false; // Prevent multiple flips
                break;
            }
        }
    }

    function flipTable(table, dirX, dirY) {
        table.flipped = true;

        // Determine flip direction (toward player)
        const angle = Math.atan2(dirY, dirX);
        table.flipAngle = angle;

        // Expand table hitbox in the direction of flip
        table.width = 32;
        table.height = 12;

        // Knockback enemies near the table
        for (const enemy of enemies) {
            const edx = enemy.x - (table.x + table.width/2);
            const edy = enemy.y - (table.y + table.height/2);
            const edist = Math.sqrt(edx*edx + edy*edy);

            if (edist < 60) {
                // Knockback and damage
                enemy.x += (edx/edist) * 40;
                enemy.y += (edy/edist) * 40;
                enemy.takeDamage(10);
                enemy.stunTimer = 0.5;
            }
        }

        // Spawn dust particles
        for (let i = 0; i < 8; i++) {
            spawnDustParticle(table.x + table.width/2, table.y + table.height/2);
        }

        triggerScreenShake(4, 0.15);
    }

    function checkChests() {
        for (const chest of chests) {
            if (chest.open) continue;

            const dx = player.x - chest.x;
            const dy = player.y - chest.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 30 && keys['e']) {
                if (chest.locked && player.keys > 0) {
                    player.keys--;
                    chest.locked = false;
                }

                if (!chest.locked) {
                    openChest(chest);
                }
            }
        }
    }

    function openChest(chest) {
        chest.open = true;

        // Spawn item based on quality
        const itemKeys = Object.keys(ITEMS);
        const qualityItems = itemKeys.filter(k => ITEMS[k].quality === chest.quality);

        if (qualityItems.length > 0) {
            const itemKey = qualityItems[Math.floor(Math.random() * qualityItems.length)];
            const item = { ...ITEMS[itemKey], id: itemKey };

            pickups.push({
                type: 'item',
                item: item,
                x: chest.x,
                y: chest.y + 30
            });
        } else {
            // Spawn shells instead
            for (let i = 0; i < 5; i++) {
                pickups.push({
                    type: 'shell',
                    x: chest.x + (Math.random() - 0.5) * 40,
                    y: chest.y + 20 + Math.random() * 20,
                    value: 2
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    function setupInput() {
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;

            // Pause toggle
            if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
                if (gameState === 'playing' || gameState === 'bossFight') {
                    gameState = 'paused';
                } else if (gameState === 'paused') {
                    gameState = roomCleared || currentRoom.type === 'start' ? 'playing' : (enemies[0] instanceof Boss ? 'bossFight' : 'playing');
                }
            }

            // Dodge roll
            if (e.key === ' ' && (gameState === 'playing' || gameState === 'bossFight')) {
                player.startRoll({ x: player.vx, y: player.vy });
            }

            // Use blank
            if (e.key.toLowerCase() === 'q' && (gameState === 'playing' || gameState === 'bossFight')) {
                player.useBlank();
            }

            // Reload
            if (e.key.toLowerCase() === 'r' && (gameState === 'playing' || gameState === 'bossFight')) {
                player.startReload();
            }

            // Weapon switch
            if (e.key === '1' || e.key === '2' || e.key === '3') {
                const idx = parseInt(e.key) - 1;
                if (idx < player.weapons.length) {
                    player.currentWeaponIndex = idx;
                }
            }

            // Start game from menu
            if (e.key === 'Enter' && gameState === 'menu') {
                startGame();
            }

            // Restart from dead/victory
            if (e.key === 'Enter' && (gameState === 'dead' || gameState === 'victory')) {
                gameState = 'menu';
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            mouse.down = true;
            mouse.clicked = true;
        });

        canvas.addEventListener('mouseup', (e) => {
            mouse.down = false;
        });

        canvas.addEventListener('wheel', (e) => {
            const dir = e.deltaY > 0 ? 1 : -1;
            player && player.switchWeapon(dir);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAWING
    // ═══════════════════════════════════════════════════════════════════════════

    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Apply screen shake
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

        switch (gameState) {
            case 'menu':
                drawMenu();
                break;
            case 'playing':
            case 'bossFight':
                drawGame();
                break;
            case 'paused':
                drawGame();
                drawPaused();
                break;
            case 'dead':
                drawGame();
                drawDead();
                break;
            case 'victory':
                drawGame();
                drawVictory();
                break;
        }

        ctx.restore();
    }

    function drawMenu() {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BULLET DUNGEON', CANVAS_WIDTH / 2, 180);

        ctx.fillStyle = '#888888';
        ctx.font = '18px monospace';
        ctx.fillText('Enter the Gungeon Clone', CANVAS_WIDTH / 2, 220);

        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 350);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px monospace';
        const instructions = [
            'WASD - Move',
            'Mouse - Aim',
            'Click - Shoot',
            'Space - Dodge Roll',
            'Q - Use Blank',
            'R - Reload',
            'E - Interact'
        ];

        instructions.forEach((text, i) => {
            ctx.fillText(text, CANVAS_WIDTH / 2, 420 + i * 22);
        });
    }

    function drawGame() {
        // Draw room background
        drawRoom();

        // Draw obstacles
        drawObstacles();

        // Draw chests
        drawChests();

        // Draw pickups
        drawPickups();

        // Draw player
        player.draw(ctx);

        // Draw enemies
        for (const enemy of enemies) {
            enemy.draw(ctx);
        }

        // Draw bullets
        drawBullets();

        // Draw hit markers
        drawHitMarkers(ctx);

        // Draw particles
        drawParticles(ctx);

        // Draw doors
        drawDoors();

        // Draw UI
        drawUI();

        // Draw damage flash (on top of everything)
        drawDamageFlash(ctx);
    }

    function drawRoom() {
        // Floor tiles
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const tileX = ROOM_OFFSET_X + x * TILE_SIZE;
                const tileY = ROOM_OFFSET_Y + y * TILE_SIZE;

                // Wall tiles on border
                if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

                    // Wall top decoration
                    if (y === 0) {
                        ctx.fillStyle = COLORS.wallTop;
                        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE / 2);
                    }
                } else {
                    // Floor tiles with checkerboard pattern
                    ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
                    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    function drawObstacles() {
        for (const obs of obstacles) {
            ctx.save();

            if (obs.type === 'table' && obs.flipped) {
                // Draw flipped table as cover
                ctx.fillStyle = '#664422';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

                // Table top edge
                ctx.fillStyle = '#553311';
                ctx.fillRect(obs.x, obs.y, obs.width, 3);

                // Highlight to show it's cover
                ctx.strokeStyle = '#88cc88';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.fillStyle = obs.type === 'pillar' ? '#555577' :
                               obs.type === 'barrel' ? '#884422' : '#886644';

                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

                // Details
                if (obs.type === 'pillar') {
                    ctx.fillStyle = '#666688';
                    ctx.fillRect(obs.x + 2, obs.y + 2, obs.width - 4, 4);
                }

                if (obs.type === 'barrel') {
                    ctx.fillStyle = '#663311';
                    ctx.fillRect(obs.x + 4, obs.y + obs.height/3, obs.width - 8, 3);
                    ctx.fillRect(obs.x + 4, obs.y + obs.height*2/3, obs.width - 8, 3);
                }

                if (obs.type === 'table' && !obs.flipped) {
                    // Unflipped table - show as legs
                    ctx.fillStyle = '#554433';
                    ctx.fillRect(obs.x + 2, obs.y + 2, 4, 4);
                    ctx.fillRect(obs.x + obs.width - 6, obs.y + 2, 4, 4);
                    ctx.fillRect(obs.x + 2, obs.y + obs.height - 6, 4, 4);
                    ctx.fillRect(obs.x + obs.width - 6, obs.y + obs.height - 6, 4, 4);
                }

                if (obs.type === 'crate') {
                    ctx.strokeStyle = '#554433';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(obs.x + 3, obs.y + 3, obs.width - 6, obs.height - 6);
                }
            }

            ctx.restore();
        }
    }

    function drawChests() {
        for (const chest of chests) {
            const color = chest.quality === 'B' ? COLORS.chestGreen :
                         chest.quality === 'C' ? COLORS.chestBlue :
                         chest.quality === 'A' ? COLORS.chestRed : COLORS.chest;

            ctx.fillStyle = color;
            ctx.fillRect(chest.x - 15, chest.y - 10, 30, 20);

            // Lid
            ctx.fillStyle = chest.open ? '#443322' : '#553322';
            ctx.fillRect(chest.x - 15, chest.y - 12, 30, 5);

            // Lock indicator
            if (chest.locked && !chest.open) {
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(chest.x, chest.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function drawPickups() {
        for (const p of pickups) {
            ctx.save();

            // Bobbing animation
            const bob = Math.sin(Date.now() / 200 + p.x) * 2;
            ctx.translate(0, bob);

            switch (p.type) {
                case 'shell':
                    ctx.fillStyle = COLORS.shell;
                    ctx.beginPath();
                    ctx.ellipse(p.x, p.y, 4, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'heart':
                    ctx.fillStyle = COLORS.heart;
                    drawHeart(ctx, p.x, p.y, 8);
                    break;

                case 'halfHeart':
                    ctx.fillStyle = COLORS.heart;
                    drawHeart(ctx, p.x, p.y, 6);
                    break;

                case 'key':
                    ctx.fillStyle = COLORS.key;
                    ctx.fillRect(p.x - 3, p.y - 6, 6, 12);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y - 6, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'armor':
                    ctx.fillStyle = COLORS.armor;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y - 8);
                    ctx.lineTo(p.x + 8, p.y);
                    ctx.lineTo(p.x, p.y + 8);
                    ctx.lineTo(p.x - 8, p.y);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'blank':
                    ctx.fillStyle = COLORS.blank;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#aaaaff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;

                case 'item':
                    ctx.fillStyle = '#aa88ff';
                    ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', p.x, p.y + 4);
                    break;
            }

            // Price tag for shop items
            if (p.forSale) {
                ctx.fillStyle = '#ffcc44';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`$${p.price}`, p.x, p.y + 20);
            }

            ctx.restore();
        }
    }

    function drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/4);
        ctx.bezierCurveTo(x, y - size/2, x - size, y - size/2, x - size, y + size/4);
        ctx.bezierCurveTo(x - size, y + size, x, y + size*1.5, x, y + size*1.5);
        ctx.bezierCurveTo(x, y + size*1.5, x + size, y + size, x + size, y + size/4);
        ctx.bezierCurveTo(x + size, y - size/2, x, y - size/2, x, y + size/4);
        ctx.fill();
    }

    function drawBullets() {
        // Player bullets with trails
        for (const b of playerBullets) {
            // Draw trail
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const trailLen = Math.min(speed * 0.03, 15);
            const angle = Math.atan2(b.vy, b.vx);

            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.size * 0.8;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - Math.cos(angle) * trailLen, b.y - Math.sin(angle) * trailLen);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Draw bullet
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = 'rgba(255, 204, 68, 0.3)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enemy bullets with trails
        for (const b of enemyBullets) {
            // Draw trail
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const trailLen = Math.min(speed * 0.03, 12);
            const angle = Math.atan2(b.vy, b.vx);

            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.size * 0.7;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - Math.cos(angle) * trailLen, b.y - Math.sin(angle) * trailLen);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Draw bullet
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();

            // Glow effect
            ctx.fillStyle = 'rgba(255, 100, 50, 0.3)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size + 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawDoors() {
        for (const door of doors) {
            ctx.fillStyle = door.open ? COLORS.doorOpen : COLORS.door;

            if (door.dir === 'north' || door.dir === 'south') {
                ctx.fillRect(door.x - 16, door.y - 8, 32, 16);
            } else {
                ctx.fillRect(door.x - 8, door.y - 16, 16, 32);
            }

            // Door frame
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            if (door.dir === 'north' || door.dir === 'south') {
                ctx.strokeRect(door.x - 16, door.y - 8, 32, 16);
            } else {
                ctx.strokeRect(door.x - 8, door.y - 16, 16, 32);
            }
        }
    }

    function drawUI() {
        // Top UI bar background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 55);

        // Low health warning - pulsing hearts
        const isCriticalHealth = player.health <= 2;
        const pulseAlpha = isCriticalHealth ? 0.6 + Math.sin(Date.now() * 0.01) * 0.4 : 1;

        // Health hearts
        const heartSize = 16;
        const heartsX = 15;
        const heartsY = 15;

        for (let i = 0; i < player.maxHealth / 2; i++) {
            const x = heartsX + i * (heartSize + 4);

            // Full or empty heart
            if (player.health >= (i + 1) * 2) {
                // Pulse red when critical
                if (isCriticalHealth) {
                    const r = 255;
                    const g = Math.floor(68 * (1 - pulseAlpha * 0.5));
                    const b = Math.floor(68 * (1 - pulseAlpha * 0.5));
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                    ctx.fillStyle = COLORS.heart;
                }
            } else if (player.health >= i * 2 + 1) {
                // Half heart
                ctx.fillStyle = isCriticalHealth ? `rgba(255, 68, 68, ${pulseAlpha})` : COLORS.heart;
                drawHeart(ctx, x, heartsY, heartSize/2);
                ctx.fillStyle = COLORS.heartEmpty;
            } else {
                ctx.fillStyle = COLORS.heartEmpty;
            }

            drawHeart(ctx, x, heartsY, heartSize/2);
        }

        // Critical health warning text
        if (isCriticalHealth) {
            ctx.save();
            ctx.globalAlpha = pulseAlpha;
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('CRITICAL!', heartsX, heartsY + 22);
            ctx.restore();
        }

        // Armor
        for (let i = 0; i < player.armor; i++) {
            ctx.fillStyle = COLORS.armor;
            const x = heartsX + (player.maxHealth / 2) * (heartSize + 4) + 10 + i * 18;
            ctx.beginPath();
            ctx.moveTo(x, heartsY - 8);
            ctx.lineTo(x + 8, heartsY);
            ctx.lineTo(x, heartsY + 8);
            ctx.lineTo(x - 8, heartsY);
            ctx.closePath();
            ctx.fill();
        }

        // Second row: blanks, keys, shells
        ctx.fillStyle = COLORS.uiText;
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';

        // Blanks
        ctx.fillStyle = COLORS.blank;
        ctx.beginPath();
        ctx.arc(20, 42, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(`x${player.blanks}`, 35, 46);

        // Keys
        ctx.fillStyle = COLORS.key;
        ctx.fillRect(80, 36, 6, 12);
        ctx.beginPath();
        ctx.arc(83, 36, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(`x${player.keys}`, 95, 46);

        // Shells (currency)
        ctx.fillStyle = COLORS.shell;
        ctx.beginPath();
        ctx.ellipse(145, 42, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(`${player.shells}`, 155, 46);

        // Weapon info - right side
        const weapon = player.currentWeapon;
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.uiText;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(weapon.name, CANVAS_WIDTH - 15, 20);

        ctx.font = '12px monospace';
        const ammoText = weapon.totalAmmo === Infinity ?
            `${weapon.currentAmmo}/${weapon.magazineSize} [∞]` :
            `${weapon.currentAmmo}/${weapon.magazineSize} [${weapon.totalAmmo}]`;

        // Low ammo warning
        const ammoPercent = weapon.currentAmmo / weapon.magazineSize;
        if (ammoPercent <= 0.3 && !player.reloading) {
            const ammoPulse = 0.6 + Math.sin(Date.now() * 0.012) * 0.4;
            ctx.fillStyle = weapon.currentAmmo === 0 ? '#ff4444' : `rgba(255, 170, 68, ${ammoPulse})`;
        }
        ctx.fillText(ammoText, CANVAS_WIDTH - 15, 38);

        // Low ammo text warning
        if (weapon.currentAmmo === 0 && !player.reloading) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('NO AMMO!', CANVAS_WIDTH - 15, 52);
        } else if (ammoPercent <= 0.3 && !player.reloading) {
            const ammoPulse = 0.6 + Math.sin(Date.now() * 0.012) * 0.4;
            ctx.fillStyle = `rgba(255, 170, 68, ${ammoPulse})`;
            ctx.font = 'bold 10px monospace';
            ctx.fillText('LOW', CANVAS_WIDTH - 15, 52);
        }

        // Reload indicator with progress bar
        if (player.reloading) {
            ctx.fillStyle = '#ffaa44';
            ctx.font = '12px monospace';
            ctx.fillText('RELOADING...', CANVAS_WIDTH - 15, 52);

            // Progress bar
            const barWidth = 80;
            const barHeight = 4;
            const barX = CANVAS_WIDTH - 15 - barWidth;
            const barY = 55;
            const progress = 1 - (player.reloadTimer / weapon.reloadTime);

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        }

        // Floor indicator
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.fillText(`Floor ${currentFloor}`, CANVAS_WIDTH / 2, 20);

        // Room type
        if (currentRoom) {
            ctx.fillText(currentRoom.type.charAt(0).toUpperCase() + currentRoom.type.slice(1), CANVAS_WIDTH / 2, 38);
        }

        // Minimap
        drawMinimap();
    }

    function drawMinimap() {
        const mapX = CANVAS_WIDTH - 90;
        const mapY = 65;
        const roomSize = 12;
        const gap = 2;

        ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
        ctx.fillRect(mapX - 10, mapY - 5, 85, 75);

        for (const room of floorRooms) {
            const rx = mapX + room.x * (roomSize + gap);
            const ry = mapY + room.y * (roomSize + gap);

            // Visited rooms
            if (visitedRooms.has(`${room.x},${room.y}`)) {
                // Room type colors
                switch (room.type) {
                    case 'start': ctx.fillStyle = '#44aa44'; break;
                    case 'boss': ctx.fillStyle = '#aa4444'; break;
                    case 'treasure': ctx.fillStyle = '#aaaa44'; break;
                    case 'shop': ctx.fillStyle = '#44aaaa'; break;
                    default: ctx.fillStyle = '#666666';
                }
            } else {
                ctx.fillStyle = '#333344';
            }

            ctx.fillRect(rx, ry, roomSize, roomSize);

            // Current room indicator
            if (room === currentRoom) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx - 1, ry - 1, roomSize + 2, roomSize + 2);
            }
        }
    }

    function drawPaused() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 200);

        ctx.font = '16px monospace';
        ctx.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, 250);

        // Show stats
        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaaaaa';
        const stats = [
            `Floor: ${currentFloor}`,
            `Health: ${player.health}/${player.maxHealth}`,
            `Armor: ${player.armor}`,
            `Shells: ${player.shells}`,
            `Blanks: ${player.blanks}`,
            `Keys: ${player.keys}`,
            `Weapons: ${player.weapons.length}`
        ];

        stats.forEach((stat, i) => {
            ctx.fillText(stat, CANVAS_WIDTH / 2, 320 + i * 24);
        });
    }

    function drawDead() {
        ctx.fillStyle = 'rgba(80, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', CANVAS_WIDTH / 2, 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Reached Floor ${currentFloor}`, CANVAS_WIDTH / 2, 200);

        // Run statistics
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('─── RUN STATISTICS ───', CANVAS_WIDTH / 2, 260);

        ctx.font = '16px monospace';
        const stats = [
            { label: 'Enemies Eliminated', value: runStats.kills, color: '#ff8888' },
            { label: 'Damage Dealt', value: Math.floor(runStats.damageDealt), color: '#ffaa44' },
            { label: 'Damage Taken', value: runStats.damageTaken, color: '#ff4444' },
            { label: 'Shots Fired', value: runStats.shotsFired, color: '#88aaff' },
            { label: 'Rooms Cleared', value: runStats.roomsCleared, color: '#88ff88' }
        ];

        let y = 300;
        for (const stat of stats) {
            ctx.fillStyle = '#aaaaaa';
            ctx.textAlign = 'right';
            ctx.fillText(stat.label + ':', CANVAS_WIDTH / 2 - 10, y);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'left';
            ctx.fillText(stat.value, CANVAS_WIDTH / 2 + 10, y);
            y += 28;
        }

        // Accuracy
        const accuracy = runStats.shotsFired > 0 ? Math.floor((runStats.kills / runStats.shotsFired) * 100) : 0;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Accuracy: ${accuracy}%`, CANVAS_WIDTH / 2, y + 10);

        ctx.fillStyle = '#888888';
        ctx.font = '14px monospace';
        ctx.fillText('Press ENTER to Return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    }

    function drawVictory() {
        ctx.fillStyle = 'rgba(0, 60, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS DEFEATED!', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Floor ${currentFloor} Complete`, CANVAS_WIDTH / 2, 260);

        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to Continue', CANVAS_WIDTH / 2, 350);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════════

    function update(dt) {
        if (gameState !== 'playing' && gameState !== 'bossFight') return;

        // Update player
        player.update(dt);

        // Handle shooting
        if (mouse.down && !player.isRolling) {
            player.shoot();
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update bullets
        updateBullets(dt);

        // Update particles
        updateParticles(dt);

        // Update screen shake
        updateScreenShake(dt);

        // Update damage flash and hit markers
        updateDamageFlash(dt);
        updateHitMarkers(dt);

        // Check room cleared
        checkRoomCleared();

        // Check door transitions
        checkDoorTransitions();

        // Check pickups
        checkPickups();

        // Check table flip
        checkTableFlip();

        // Check chests
        checkChests();

        // Reset click state
        mouse.clicked = false;
    }

    function gameLoop(timestamp) {
        deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        // Cap delta time to prevent huge jumps
        if (deltaTime > 0.1) deltaTime = 0.1;

        update(deltaTime);
        draw();

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        player = new Player(
            ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
            ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2,
            'marine'
        );

        // Reset run statistics
        runStats = {
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            shotsFired: 0,
            roomsCleared: 0,
            bossesKilled: 0
        };

        // Reset visual effects
        hitMarkers = [];
        damageFlash = 0;

        currentFloor = 1;
        generateFloor(currentFloor);
        gameState = 'playing';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        setupInput();

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST HARNESS GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    window.getPlayer = function() { return player; };
    window.getEnemies = function() { return enemies; };
    window.getPlayerBullets = function() { return playerBullets; };
    window.getEnemyBullets = function() { return enemyBullets; };
    window.getPickups = function() { return pickups; };
    window.getObstacles = function() { return obstacles; };
    window.getDoors = function() { return doors; };
    window.getChests = function() { return chests; };
    window.getCurrentRoom = function() { return currentRoom; };
    window.getFloorRooms = function() { return floorRooms; };
    window.getFloorNum = function() { return currentFloor; };
    window.getKeys = function() { return keys; };
    window.gameState = function() { return { state: gameState, roomCleared }; };
    window.getRunStats = function() { return runStats; };
    window.getHitMarkers = function() { return hitMarkers; };
    window.getDamageFlash = function() { return damageFlash; };

    window.ENEMY_DATA = ENEMY_DATA;
    window.WEAPONS = WEAPONS;
    window.ITEMS = ITEMS;
    window.BOSS_DATA = BOSS_DATA;
    window.spawnHitMarker = spawnHitMarker;

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
