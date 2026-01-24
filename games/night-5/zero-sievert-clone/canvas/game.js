/**
 * Wasteland Extraction - Zero Sievert Clone
 * Night 6 - Canvas Implementation
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const TILE_SIZE = 32;

    // Zone size (in tiles)
    const ZONE_WIDTH = 40;
    const ZONE_HEIGHT = 30;

    const COLORS = {
        background: '#2a3830',
        grass: '#3a4840',
        grassDark: '#2d3a32',
        dirt: '#5a4a3a',
        wall: '#4a4a4a',
        wallDark: '#3a3a3a',
        floor: '#5a5a5a',
        player: '#4a90d9',
        playerOutline: '#2a5080',
        enemy: '#cc4444',
        enemyOutline: '#992222',
        bullet: '#ffdd44',
        bulletTrail: '#ffaa22',
        muzzleFlash: '#ffffff',
        blood: '#882222',
        loot: '#88cc44',
        extraction: '#44cc88',
        extractionGlow: '#22aa66',
        ui: '#1a2a20',
        uiText: '#ccddcc',
        health: '#44cc44',
        healthLow: '#cc4444',
        stamina: '#44aacc',
        ammo: '#ccaa44'
    };

    // Combat config
    const CombatConfig = {
        BULLET_SPEED: 800,
        PLAYER_SPEED: 150,
        SPRINT_MULTIPLIER: 1.6,
        AIM_SPEED_PENALTY: 0.5,
        DODGE_DURATION: 0.3,
        DODGE_COOLDOWN: 1.5,
        DODGE_SPEED: 400,
        STAMINA_MAX: 100,
        STAMINA_SPRINT_DRAIN: 15,
        STAMINA_REGEN: 8,
        STAMINA_DODGE_COST: 25
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // WEAPON DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const WEAPONS = {
        pistol: {
            name: 'PM Pistol',
            damage: 18,
            fireRate: 300,    // RPM
            range: 200,
            spread: 8,        // degrees
            magSize: 8,
            reloadTime: 1.5,
            penetration: 10,
            auto: false
        },
        smg: {
            name: 'Skorpion',
            damage: 14,
            fireRate: 600,
            range: 150,
            spread: 12,
            magSize: 20,
            reloadTime: 2.0,
            penetration: 5,
            auto: true
        },
        rifle: {
            name: 'AK-74',
            damage: 28,
            fireRate: 450,
            range: 250,
            spread: 6,
            magSize: 30,
            reloadTime: 2.5,
            penetration: 30,
            auto: true
        },
        shotgun: {
            name: 'Pump Shotgun',
            damage: 8,
            fireRate: 60,
            range: 100,
            spread: 25,
            magSize: 6,
            reloadTime: 3.0,
            penetration: 5,
            pellets: 8,
            auto: false
        },
        melee: {
            name: 'Claws',
            damage: 15,
            fireRate: 120,    // Attacks per minute
            range: 30,        // Melee range
            spread: 0,
            magSize: 999,
            reloadTime: 0,
            penetration: 0,
            auto: true,
            isMelee: true
        },
        sniper: {
            name: 'Mosin Nagant',
            damage: 65,
            fireRate: 30,     // Slow bolt action
            range: 400,       // Long range
            spread: 1,        // Very accurate
            magSize: 5,
            reloadTime: 3.5,
            penetration: 50,
            auto: false
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const ENEMY_DATA = {
        banditScout: {
            name: 'Bandit Scout',
            hp: 60,
            damage: 12,
            speed: 80,
            weapon: 'pistol',
            visionRange: 200,
            visionAngle: 90,
            behavior: 'patrol',
            color: COLORS.enemy,
            size: 14
        },
        bandit: {
            name: 'Bandit',
            hp: 80,
            damage: 15,
            speed: 70,
            weapon: 'smg',
            visionRange: 180,
            visionAngle: 100,
            behavior: 'aggressive',
            color: '#bb5555',
            size: 16
        },
        banditHeavy: {
            name: 'Bandit Heavy',
            hp: 120,
            damage: 20,
            speed: 50,
            weapon: 'shotgun',
            visionRange: 150,
            visionAngle: 120,
            behavior: 'suppressive',
            color: '#995555',
            size: 18
        },
        wolf: {
            name: 'Wolf',
            hp: 40,
            damage: 15,
            speed: 130,
            weapon: 'melee',
            visionRange: 250,
            visionAngle: 180,
            behavior: 'pack',
            color: '#666688',
            size: 12,
            isMelee: true
        },
        ghoul: {
            name: 'Ghoul',
            hp: 50,
            damage: 12,
            speed: 100,
            weapon: 'melee',
            visionRange: 150,
            visionAngle: 120,
            behavior: 'swarm',
            color: '#557755',
            size: 14,
            isMelee: true
        },
        banditSniper: {
            name: 'Bandit Sniper',
            hp: 50,
            damage: 65,
            speed: 40,            // Slow, stationary type
            weapon: 'sniper',
            visionRange: 350,     // Long vision range
            visionAngle: 60,      // Narrow focus
            behavior: 'sniper',   // New behavior type
            color: '#886644',     // Brown/tan color
            size: 14
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let gameState = 'menu'; // menu, playing, paused, dead, extracted
    let lastTime = 0;

    // Input
    const keys = {};
    const mouse = { x: 0, y: 0, down: false, rightDown: false };

    // Camera
    let camera = { x: 0, y: 0 };

    // Run statistics
    let runStats = {
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        shotsFired: 0,
        accuracy: 0,
        runTime: 0
    };

    // Game objects
    let player = null;
    let enemies = [];
    let bullets = [];
    let particles = [];
    let grenades = [];
    let lootDrops = [];  // Items dropped by enemies
    let droppedWeapons = [];  // Weapons dropped by enemies
    let lootContainers = [];
    let extractionPoints = [];
    let obstacles = [];

    // Zone data
    let zoneMap = [];

    // Screen effects
    let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    let damageIndicators = [];
    let damageFlash = 0;  // Red flash intensity when damaged
    let hitMarkers = [];   // Visual feedback when hitting enemies

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = 0;
            this.size = 14;

            // Stats
            this.maxHealth = 100;
            this.health = this.maxHealth;
            this.stamina = CombatConfig.STAMINA_MAX;
            this.maxStamina = CombatConfig.STAMINA_MAX;

            // Movement
            this.vx = 0;
            this.vy = 0;
            this.speed = CombatConfig.PLAYER_SPEED;

            // Dodge
            this.dodging = false;
            this.dodgeTimer = 0;
            this.dodgeCooldown = 0;
            this.dodgeAngle = 0;

            // Combat
            this.weaponType = 'rifle';
            this.weapon = { ...WEAPONS.rifle };
            this.ammo = this.weapon.magSize;
            this.maxAmmo = this.weapon.magSize;
            this.reloading = false;
            this.reloadTimer = 0;
            this.lastShotTime = 0;
            this.isFiring = false;
            this.isAiming = false;
            this.isSprinting = false;

            // Inventory
            this.inventory = [];
            this.rubles = 0;

            // Status effects
            this.statusEffects = {
                bleeding: false,
                bleedTimer: 0,
                heavyBleeding: false,
                radiation: 0
            };
            this.bandages = 3;  // Starting bandages
            this.grenades = 2;  // Starting grenades
            this.medkits = 0;   // Large healing items

            // Armor
            this.armor = 0;           // Current armor points
            this.maxArmor = 100;      // Maximum armor
            this.armorDamageReduction = 0.5;  // 50% damage reduction when armor > 0
        }

        update(dt) {
            // Dodge roll
            if (this.dodging) {
                this.dodgeTimer -= dt;
                if (this.dodgeTimer <= 0) {
                    this.dodging = false;
                }
                this.x += Math.cos(this.dodgeAngle) * CombatConfig.DODGE_SPEED * dt;
                this.y += Math.sin(this.dodgeAngle) * CombatConfig.DODGE_SPEED * dt;
                this.constrainToZone();
                return;
            }

            // Dodge cooldown
            if (this.dodgeCooldown > 0) {
                this.dodgeCooldown -= dt;
            }

            // Aim at mouse
            const worldMouseX = mouse.x + camera.x;
            const worldMouseY = mouse.y + camera.y;
            this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

            // Movement
            let moveX = 0, moveY = 0;
            if (keys['w'] || keys['arrowup']) moveY -= 1;
            if (keys['s'] || keys['arrowdown']) moveY += 1;
            if (keys['a'] || keys['arrowleft']) moveX -= 1;
            if (keys['d'] || keys['arrowright']) moveX += 1;

            // Normalize diagonal movement
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            if (len > 0) {
                moveX /= len;
                moveY /= len;
            }

            // Sprint
            this.isSprinting = keys['shift'] && len > 0 && this.stamina > 0 && !this.isAiming;
            this.isAiming = mouse.rightDown;

            // Calculate speed
            let speed = this.speed;
            if (this.isSprinting) {
                speed *= CombatConfig.SPRINT_MULTIPLIER;
                this.stamina -= CombatConfig.STAMINA_SPRINT_DRAIN * dt;
            } else if (this.isAiming) {
                speed *= CombatConfig.AIM_SPEED_PENALTY;
            }

            // Stamina regen
            if (!this.isSprinting && this.stamina < this.maxStamina) {
                this.stamina += CombatConfig.STAMINA_REGEN * dt;
                this.stamina = Math.min(this.stamina, this.maxStamina);
            }

            // Bleeding damage over time
            if (this.statusEffects.bleeding || this.statusEffects.heavyBleeding) {
                this.statusEffects.bleedTimer += dt;
                if (this.statusEffects.bleedTimer >= 1.0) {
                    this.statusEffects.bleedTimer = 0;
                    const bleedDamage = this.statusEffects.heavyBleeding ? 5 : 2;
                    this.health -= bleedDamage;
                    spawnBleedParticle(this.x, this.y);
                    if (this.health <= 0) {
                        this.health = 0;
                        gameState = 'dead';
                    }
                }
            }

            // Apply movement
            this.vx = moveX * speed;
            this.vy = moveY * speed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Footstep dust particles when moving
            if (len > 0 && Math.random() < (this.isSprinting ? 0.4 : 0.15)) {
                spawnFootstepDust(this.x, this.y + this.size * 0.5, this.isSprinting);
            }

            // Collision with obstacles
            this.handleCollisions();
            this.constrainToZone();

            // Reload
            if (this.reloading) {
                this.reloadTimer -= dt;
                if (this.reloadTimer <= 0) {
                    this.ammo = this.weapon.magSize;
                    this.reloading = false;
                }
            }

            // Auto-fire
            if (mouse.down && this.weapon.auto && !this.reloading) {
                this.tryShoot();
            }
        }

        handleCollisions() {
            for (const obs of obstacles) {
                if (this.collidesWithRect(obs)) {
                    // Push out of obstacle
                    const cx = obs.x + obs.width / 2;
                    const cy = obs.y + obs.height / 2;
                    const dx = this.x - cx;
                    const dy = this.y - cy;
                    const halfW = obs.width / 2 + this.size;
                    const halfH = obs.height / 2 + this.size;

                    const overlapX = halfW - Math.abs(dx);
                    const overlapY = halfH - Math.abs(dy);

                    if (overlapX < overlapY) {
                        this.x += overlapX * Math.sign(dx);
                    } else {
                        this.y += overlapY * Math.sign(dy);
                    }
                }
            }
        }

        collidesWithRect(rect) {
            return this.x + this.size > rect.x &&
                   this.x - this.size < rect.x + rect.width &&
                   this.y + this.size > rect.y &&
                   this.y - this.size < rect.y + rect.height;
        }

        constrainToZone() {
            const margin = this.size;
            this.x = Math.max(margin, Math.min(ZONE_WIDTH * TILE_SIZE - margin, this.x));
            this.y = Math.max(margin, Math.min(ZONE_HEIGHT * TILE_SIZE - margin, this.y));
        }

        tryShoot() {
            if (this.reloading) return;
            if (this.ammo <= 0) {
                this.startReload();
                return;
            }

            const now = performance.now();
            const fireInterval = 60000 / this.weapon.fireRate;
            if (now - this.lastShotTime < fireInterval) return;

            this.lastShotTime = now;
            this.ammo--;

            // Calculate spread
            let spread = this.weapon.spread;
            const isMoving = Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1;
            if (this.isAiming) spread *= 0.4;
            if (isMoving) spread *= 1.3;
            if (this.isSprinting) spread *= 2.0;

            // Shotgun fires multiple pellets
            const pelletCount = this.weapon.pellets || 1;
            for (let i = 0; i < pelletCount; i++) {
                const spreadRad = (spread * (Math.random() - 0.5) * 2) * Math.PI / 180;
                const bulletAngle = this.angle + spreadRad;

                bullets.push({
                    x: this.x + Math.cos(this.angle) * 20,
                    y: this.y + Math.sin(this.angle) * 20,
                    vx: Math.cos(bulletAngle) * CombatConfig.BULLET_SPEED,
                    vy: Math.sin(bulletAngle) * CombatConfig.BULLET_SPEED,
                    damage: this.weapon.damage,
                    range: this.weapon.range,
                    traveled: 0,
                    owner: 'player',
                    penetration: this.weapon.penetration
                });
            }

            // Muzzle flash
            spawnMuzzleFlash(
                this.x + Math.cos(this.angle) * 20,
                this.y + Math.sin(this.angle) * 20,
                this.angle
            );

            // Track shots fired
            runStats.shotsFired++;

            // Screen shake
            triggerScreenShake(3, 0.05);
        }

        startReload() {
            if (this.reloading || this.ammo === this.weapon.magSize) return;
            this.reloading = true;
            this.reloadTimer = this.weapon.reloadTime;
        }

        tryDodge() {
            if (this.dodging || this.dodgeCooldown > 0) return;
            if (this.stamina < CombatConfig.STAMINA_DODGE_COST) return;

            this.stamina -= CombatConfig.STAMINA_DODGE_COST;
            this.dodging = true;
            this.dodgeTimer = CombatConfig.DODGE_DURATION;
            this.dodgeCooldown = CombatConfig.DODGE_COOLDOWN;

            // Dodge in movement direction or facing direction
            if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
                this.dodgeAngle = Math.atan2(this.vy, this.vx);
            } else {
                this.dodgeAngle = this.angle;
            }

            // Spawn dust particles
            spawnDodgeDust(this.x, this.y);
        }

        takeDamage(amount, fromX, fromY) {
            if (this.dodging) return; // I-frames during dodge

            // Apply armor damage reduction
            let actualDamage = amount;
            if (this.armor > 0) {
                actualDamage = Math.floor(amount * (1 - this.armorDamageReduction));
                // Armor absorbs some damage
                const armorDamage = Math.ceil(amount * 0.4);
                this.armor = Math.max(0, this.armor - armorDamage);
            }

            this.health -= actualDamage;
            runStats.damageTaken += actualDamage;
            triggerScreenShake(8, 0.15);
            damageFlash = 0.6;  // Trigger red flash
            spawnBloodParticles(this.x, this.y);

            // Damage indicator
            const angle = Math.atan2(fromY - this.y, fromX - this.x);
            damageIndicators.push({
                angle: angle,
                life: 1.0
            });

            // Chance to cause bleeding (30% for normal, 60% for heavy damage)
            if (!this.statusEffects.bleeding && Math.random() < 0.3) {
                this.statusEffects.bleeding = true;
                this.statusEffects.bleedTimer = 0;
            }
            // Heavy bleeding from large hits
            if (amount >= 20 && !this.statusEffects.heavyBleeding && Math.random() < 0.4) {
                this.statusEffects.heavyBleeding = true;
                this.statusEffects.bleeding = false; // Heavy replaces normal
            }

            if (this.health <= 0) {
                this.health = 0;
                gameState = 'dead';
            }
        }

        useBandage() {
            if (this.bandages <= 0) return false;
            if (!this.statusEffects.bleeding && !this.statusEffects.heavyBleeding) return false;

            this.bandages--;
            if (this.statusEffects.heavyBleeding) {
                // Bandage reduces heavy bleeding to normal bleeding
                this.statusEffects.heavyBleeding = false;
                this.statusEffects.bleeding = true;
            } else {
                // Cure normal bleeding
                this.statusEffects.bleeding = false;
            }
            this.statusEffects.bleedTimer = 0;
            // Small heal from bandage
            this.health = Math.min(this.maxHealth, this.health + 10);
            return true;
        }

        useMedkit() {
            if (this.medkits <= 0) return false;
            if (this.health >= this.maxHealth) return false;

            this.medkits--;
            // Large heal from medkit
            this.health = Math.min(this.maxHealth, this.health + 50);
            // Also cures all bleeding
            this.statusEffects.bleeding = false;
            this.statusEffects.heavyBleeding = false;
            this.statusEffects.bleedTimer = 0;
            return true;
        }

        throwGrenade() {
            if (this.grenades <= 0) return false;

            this.grenades--;

            // Calculate throw direction and distance
            const throwSpeed = 300;
            const vx = Math.cos(this.angle) * throwSpeed;
            const vy = Math.sin(this.angle) * throwSpeed;

            grenades.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: vx,
                vy: vy,
                timer: 2.0,  // 2 seconds to explode
                damage: 80,
                radius: 100  // Explosion radius
            });

            return true;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x - camera.x, this.y - camera.y);

            // Dodge trail effect
            if (this.dodging) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = COLORS.player;
                ctx.beginPath();
                ctx.arc(-this.vx * 0.02, -this.vy * 0.02, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Body
            ctx.fillStyle = COLORS.player;
            ctx.strokeStyle = COLORS.playerOutline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Direction indicator
            ctx.fillStyle = COLORS.playerOutline;
            ctx.beginPath();
            ctx.arc(
                Math.cos(this.angle) * (this.size - 4),
                Math.sin(this.angle) * (this.size - 4),
                4, 0, Math.PI * 2
            );
            ctx.fill();

            // Weapon
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.angle) * 24, Math.sin(this.angle) * 24);
            ctx.stroke();

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
            this.angle = Math.random() * Math.PI * 2;
            this.size = data.size;

            this.maxHealth = data.hp;
            this.health = data.hp;
            this.damage = data.damage;
            this.speed = data.speed;
            this.weapon = WEAPONS[data.weapon];
            this.visionRange = data.visionRange;
            this.visionAngle = data.visionAngle * Math.PI / 180;
            this.behavior = data.behavior;
            this.color = data.color;

            // AI state
            this.state = 'patrol';
            this.targetX = x;
            this.targetY = y;
            this.patrolPoints = this.generatePatrolPoints();
            this.currentPatrolIndex = 0;
            this.alertTimer = 0;
            this.lastSeenPlayer = null;

            // Combat
            this.lastShotTime = 0;
            this.ammo = this.weapon.magSize;
            this.reloading = false;
            this.reloadTimer = 0;
            this.reactionTimer = 0; // Delay before can fire when first spotting player
            this.isFiring = false; // Track if currently in firing stance
        }

        generatePatrolPoints() {
            const points = [];
            for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
                points.push({
                    x: this.x + (Math.random() - 0.5) * 200,
                    y: this.y + (Math.random() - 0.5) * 200
                });
            }
            return points;
        }

        update(dt) {
            const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const canSee = this.canSeePlayer();

            // Reload
            if (this.reloading) {
                this.reloadTimer -= dt;
                if (this.reloadTimer <= 0) {
                    this.ammo = this.weapon.magSize;
                    this.reloading = false;
                }
            }

            switch (this.state) {
                case 'patrol':
                    if (canSee) {
                        this.state = 'combat';
                        this.reactionTimer = 0.4 + Math.random() * 0.3; // 0.4-0.7s delay before can fire
                        this.alertNearby();
                    } else {
                        this.doPatrol(dt);
                    }
                    break;

                case 'alert':
                    if (canSee) {
                        this.state = 'combat';
                        this.reactionTimer = 0.3 + Math.random() * 0.2; // Shorter delay when alerted
                    } else {
                        this.alertTimer -= dt;
                        if (this.alertTimer <= 0) {
                            this.state = 'patrol';
                        } else if (this.lastSeenPlayer) {
                            this.moveToward(this.lastSeenPlayer.x, this.lastSeenPlayer.y, dt);
                        }
                    }
                    break;

                case 'combat':
                    if (!canSee) {
                        this.state = 'alert';
                        this.alertTimer = 5;
                        this.lastSeenPlayer = { x: player.x, y: player.y };
                    } else {
                        this.doCombat(dt, distToPlayer, angleToPlayer);
                    }
                    break;
            }
        }

        canSeePlayer() {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist > this.visionRange) return false;

            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            let angleDiff = angleToPlayer - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) > this.visionAngle / 2) return false;

            // Check line of sight
            return this.hasLineOfSight(player.x, player.y);
        }

        hasLineOfSight(targetX, targetY) {
            const dist = Math.hypot(targetX - this.x, targetY - this.y);
            const steps = Math.ceil(dist / TILE_SIZE);
            const dx = (targetX - this.x) / steps;
            const dy = (targetY - this.y) / steps;

            for (let i = 0; i < steps; i++) {
                const checkX = this.x + dx * i;
                const checkY = this.y + dy * i;

                for (const obs of obstacles) {
                    if (checkX > obs.x && checkX < obs.x + obs.width &&
                        checkY > obs.y && checkY < obs.y + obs.height) {
                        return false;
                    }
                }
            }
            return true;
        }

        doPatrol(dt) {
            const target = this.patrolPoints[this.currentPatrolIndex];
            const dist = Math.hypot(target.x - this.x, target.y - this.y);

            if (dist < 10) {
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            } else {
                this.moveToward(target.x, target.y, dt);
            }
        }

        doCombat(dt, distToPlayer, angleToPlayer) {
            // Face player (gradually turn instead of instant)
            const turnSpeed = 5; // radians per second
            let angleDiff = angleToPlayer - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);

            // Reaction time - can't shoot until this expires
            if (this.reactionTimer > 0) {
                this.reactionTimer -= dt;
                return;
            }

            // Sniper behavior: stay still, retreat if too close
            if (this.behavior === 'sniper') {
                if (distToPlayer < 150) {
                    // Too close! Retreat
                    this.moveAway(player.x, player.y, dt);
                }
                // Otherwise stay stationary and snipe
                this.tryShoot();
                return;
            }

            const preferredRange = this.weapon.range * 0.7;
            const isElite = this.type === 'elite' || this.type === 'boss';

            // Normal enemies: stand still when firing (elite enemies move+fire)
            if (!isElite && distToPlayer <= preferredRange && distToPlayer >= preferredRange * 0.5) {
                // In range - stand still and shoot
                this.isFiring = true;
                this.tryShoot();
                return;
            }

            this.isFiring = false;

            if (distToPlayer > preferredRange) {
                // Move closer
                this.moveToward(player.x, player.y, dt);
            } else if (distToPlayer < preferredRange * 0.5) {
                // Too close, back up
                this.moveAway(player.x, player.y, dt);
            }

            // Elite enemies can move and shoot
            if (isElite) {
                this.tryShoot();
            }
        }

        moveToward(tx, ty, dt) {
            const angle = Math.atan2(ty - this.y, tx - this.x);
            this.angle = angle;
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
            this.handleCollisions();
        }

        moveAway(tx, ty, dt) {
            const angle = Math.atan2(this.y - ty, this.x - tx);
            this.x += Math.cos(angle) * this.speed * 0.7 * dt;
            this.y += Math.sin(angle) * this.speed * 0.7 * dt;
            this.handleCollisions();
        }

        handleCollisions() {
            for (const obs of obstacles) {
                if (this.collidesWithRect(obs)) {
                    const cx = obs.x + obs.width / 2;
                    const cy = obs.y + obs.height / 2;
                    const dx = this.x - cx;
                    const dy = this.y - cy;
                    const halfW = obs.width / 2 + this.size;
                    const halfH = obs.height / 2 + this.size;
                    const overlapX = halfW - Math.abs(dx);
                    const overlapY = halfH - Math.abs(dy);

                    if (overlapX < overlapY) {
                        this.x += overlapX * Math.sign(dx);
                    } else {
                        this.y += overlapY * Math.sign(dy);
                    }
                }
            }
        }

        collidesWithRect(rect) {
            return this.x + this.size > rect.x &&
                   this.x - this.size < rect.x + rect.width &&
                   this.y + this.size > rect.y &&
                   this.y - this.size < rect.y + rect.height;
        }

        alertNearby() {
            for (const enemy of enemies) {
                if (enemy !== this) {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < 200) {
                        enemy.state = 'alert';
                        enemy.alertTimer = 5;
                        enemy.lastSeenPlayer = { x: player.x, y: player.y };
                    }
                }
            }
        }

        tryShoot() {
            if (this.reloading) return;

            const now = performance.now();
            // Reduced fire rate: normal enemies ~1 shot/sec (1000ms), elite/sniper faster
            const isElite = this.type === 'elite' || this.type === 'boss' || this.behavior === 'sniper';
            const baseInterval = 60000 / (this.weapon.fireRate * 0.7);
            const fireInterval = isElite ? baseInterval : Math.max(baseInterval, 1000);
            if (now - this.lastShotTime < fireInterval) return;

            // Melee attack
            if (this.weapon.isMelee) {
                const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
                if (distToPlayer < this.weapon.range + player.size) {
                    this.lastShotTime = now;
                    player.takeDamage(this.damage, this.x, this.y);
                    // Melee impact effect
                    spawnMeleeImpact(player.x, player.y);
                }
                return;
            }

            // Ranged attack
            if (this.ammo <= 0) {
                this.reloading = true;
                this.reloadTimer = this.weapon.reloadTime * 1.5;
                return;
            }

            this.lastShotTime = now;
            this.ammo--;

            const spread = this.weapon.spread * 1.5;
            const spreadRad = (spread * (Math.random() - 0.5) * 2) * Math.PI / 180;
            const bulletAngle = this.angle + spreadRad;

            bullets.push({
                x: this.x + Math.cos(this.angle) * 15,
                y: this.y + Math.sin(this.angle) * 15,
                vx: Math.cos(bulletAngle) * CombatConfig.BULLET_SPEED * 0.8,
                vy: Math.sin(bulletAngle) * CombatConfig.BULLET_SPEED * 0.8,
                damage: this.damage,
                range: this.weapon.range,
                traveled: 0,
                owner: 'enemy'
            });

            spawnMuzzleFlash(
                this.x + Math.cos(this.angle) * 15,
                this.y + Math.sin(this.angle) * 15,
                this.angle
            );
        }

        takeDamage(amount) {
            this.health -= amount;
            this.state = 'combat';
            spawnBloodParticles(this.x, this.y);

            if (this.health <= 0) {
                return true; // Dead
            }
            return false;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x - camera.x, this.y - camera.y);

            // Vision cone (debug)
            // ctx.globalAlpha = 0.1;
            // ctx.fillStyle = this.state === 'combat' ? '#ff0000' : '#ffff00';
            // ctx.beginPath();
            // ctx.moveTo(0, 0);
            // ctx.arc(0, 0, this.visionRange, this.angle - this.visionAngle/2, this.angle + this.visionAngle/2);
            // ctx.closePath();
            // ctx.fill();
            // ctx.globalAlpha = 1;

            // Body
            ctx.fillStyle = this.color;
            ctx.strokeStyle = COLORS.enemyOutline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Direction
            ctx.fillStyle = COLORS.enemyOutline;
            ctx.beginPath();
            ctx.arc(
                Math.cos(this.angle) * (this.size - 4),
                Math.sin(this.angle) * (this.size - 4),
                3, 0, Math.PI * 2
            );
            ctx.fill();

            // Health bar if damaged
            if (this.health < this.maxHealth) {
                const barWidth = this.size * 2;
                const healthPct = this.health / this.maxHealth;
                ctx.fillStyle = '#222';
                ctx.fillRect(-barWidth/2, -this.size - 10, barWidth, 4);
                ctx.fillStyle = healthPct > 0.3 ? COLORS.health : COLORS.healthLow;
                ctx.fillRect(-barWidth/2, -this.size - 10, barWidth * healthPct, 4);
            }

            // Alert indicator
            if (this.state === 'alert') {
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('?', 0, -this.size - 15);
            } else if (this.state === 'combat') {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, -this.size - 15);
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOT CONTAINER
    // ═══════════════════════════════════════════════════════════════════════════

    class LootContainer {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.looted = false;
            this.size = 24;
            this.contents = this.generateContents();
        }

        generateContents() {
            const contents = [];
            const roll = Math.random();

            if (roll < 0.4) {
                contents.push({ type: 'rubles', amount: 100 + Math.floor(Math.random() * 200) });
            }
            if (roll < 0.6) {
                contents.push({ type: 'ammo', amount: 10 + Math.floor(Math.random() * 20) });
            }
            if (roll < 0.3) {
                contents.push({ type: 'bandage', amount: 1 + Math.floor(Math.random() * 2) });
            }
            if (roll < 0.1) {
                contents.push({ type: 'medkit', amount: 1 });
            }

            return contents;
        }

        loot() {
            if (this.looted) return null;
            this.looted = true;
            return this.contents;
        }

        draw(ctx) {
            if (this.looted) return;

            const screenX = this.x - camera.x;
            const screenY = this.y - camera.y;

            // Box
            ctx.fillStyle = this.type === 'weapon' ? '#886644' : '#668844';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
            ctx.strokeRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);

            // Glow when player is near
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < 50) {
                ctx.strokeStyle = '#aaffaa';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX - this.size/2 - 2, screenY - this.size/2 - 2, this.size + 4, this.size + 4);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRACTION POINT
    // ═══════════════════════════════════════════════════════════════════════════

    class ExtractionPoint {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 40;
            this.extractTimer = 0;
            this.extractTime = 3; // seconds to extract
            this.isExtracting = false;
        }

        update(dt) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);

            if (dist < this.radius) {
                this.isExtracting = true;
                this.extractTimer += dt;
                if (this.extractTimer >= this.extractTime) {
                    gameState = 'extracted';
                }
            } else {
                this.isExtracting = false;
                this.extractTimer = Math.max(0, this.extractTimer - dt * 2);
            }
        }

        draw(ctx) {
            const screenX = this.x - camera.x;
            const screenY = this.y - camera.y;
            const time = performance.now();

            // Outer glow pulse
            const pulse = 0.7 + Math.sin(time / 200) * 0.3;
            const outerPulse = 0.9 + Math.sin(time / 300) * 0.1;

            // Radial beam effects
            ctx.save();
            ctx.translate(screenX, screenY);
            const beamCount = 8;
            const beamRotation = time / 3000;
            for (let i = 0; i < beamCount; i++) {
                const angle = (i / beamCount) * Math.PI * 2 + beamRotation;
                ctx.globalAlpha = 0.15 + Math.sin(time / 150 + i) * 0.05;
                ctx.strokeStyle = COLORS.extraction;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                ctx.lineTo(Math.cos(angle) * this.radius * 1.3, Math.sin(angle) * this.radius * 1.3);
                ctx.stroke();
            }
            ctx.restore();

            // Outer ring with glow
            ctx.globalAlpha = 0.1;
            const outerGrad = ctx.createRadialGradient(screenX, screenY, this.radius * 0.8, screenX, screenY, this.radius * 1.5);
            outerGrad.addColorStop(0, COLORS.extraction);
            outerGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Middle pulsing ring
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius * outerPulse, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.extraction;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Main pulsing circle
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.extraction;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Inner fill
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = COLORS.extractionGlow;
            ctx.fill();

            // Center beacon dot
            ctx.globalAlpha = 0.7 + Math.sin(time / 100) * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Progress bar if extracting
            if (this.isExtracting) {
                const progress = this.extractTimer / this.extractTime;

                // Intensified effects when extracting
                ctx.globalAlpha = 0.3 + progress * 0.3;
                ctx.fillStyle = COLORS.extraction;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius * pulse * (1 + progress * 0.3), 0, Math.PI * 2);
                ctx.fill();

                // Progress bar background
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#222';
                ctx.fillRect(screenX - 35, screenY - this.radius - 22, 70, 10);

                // Progress bar fill with gradient
                const progGrad = ctx.createLinearGradient(screenX - 35, 0, screenX + 35, 0);
                progGrad.addColorStop(0, '#00ff00');
                progGrad.addColorStop(1, '#88ff88');
                ctx.fillStyle = progGrad;
                ctx.fillRect(screenX - 34, screenY - this.radius - 21, 68 * progress, 8);

                // Border
                ctx.strokeStyle = COLORS.extraction;
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX - 35, screenY - this.radius - 22, 70, 10);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('EXTRACTING...', screenX, screenY - this.radius - 28);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('EXTRACTION', screenX, screenY + 5);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function spawnMuzzleFlash(x, y, angle) {
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.05,
            maxLife: 0.05,
            size: 12,
            color: '#ffffff',
            type: 'flash'
        });
    }

    function spawnBloodParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                size: 3 + Math.random() * 4,
                color: COLORS.blood,
                type: 'blood',
                gravity: true
            });
        }
    }

    function spawnBleedParticle(x, y) {
        // Single drip blood particle for bleed ticks
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + 5,
            vx: (Math.random() - 0.5) * 15,
            vy: 20 + Math.random() * 30,
            life: 1.5,
            maxLife: 1.5,
            size: 3 + Math.random() * 3,
            color: '#880000',
            type: 'blood_drip',
            gravity: true
        });
    }

    function spawnMeleeImpact(x, y) {
        // Melee claw/bite impact particles
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (80 + Math.random() * 60),
                vy: Math.sin(angle) * (80 + Math.random() * 60),
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 3 + Math.random() * 4,
                color: '#ff4444',
                type: 'melee_hit'
            });
        }
        triggerScreenShake(10, 0.2);
    }

    function spawnEnemyLoot(x, y, enemyType) {
        // Random loot drops based on enemy type
        const lootChance = Math.random();

        // Always drop some rubles
        const rubleAmount = 10 + Math.floor(Math.random() * 30);
        lootDrops.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'rubles',
            amount: rubleAmount,
            color: '#ffcc00',
            size: 6
        });

        // Chance to drop ammo
        if (lootChance < 0.4) {
            lootDrops.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                type: 'ammo',
                amount: 5 + Math.floor(Math.random() * 10),
                color: '#888844',
                size: 5
            });
        }

        // Chance to drop bandage
        if (lootChance < 0.2) {
            lootDrops.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                type: 'bandage',
                amount: 1,
                color: '#ffffff',
                size: 5
            });
        }

        // Small chance to drop grenade
        if (lootChance < 0.1) {
            lootDrops.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                type: 'grenade',
                amount: 1,
                color: '#556644',
                size: 6
            });
        }

        // Rare chance to drop armor plate (5%)
        if (Math.random() < 0.05) {
            lootDrops.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                type: 'armor',
                amount: 20 + Math.floor(Math.random() * 30),  // 20-50 armor
                color: '#4488aa',
                size: 7
            });
        }

        // Rare chance to drop medkit (3%)
        if (Math.random() < 0.03) {
            lootDrops.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                type: 'medkit',
                amount: 1,
                color: '#ff4444',  // Red cross color
                size: 7
            });
        }

        // Chance to drop weapon from gun-using enemies
        const enemyData = ENEMY_DATA[enemyType];
        if (enemyData && !enemyData.isMelee && enemyData.weapon !== 'melee') {
            if (Math.random() < 0.25) {  // 25% chance
                spawnWeaponDrop(x, y, enemyData.weapon);
            }
        }
    }

    function spawnWeaponDrop(x, y, weaponType) {
        const weapon = WEAPONS[weaponType];
        if (!weapon) return;

        droppedWeapons.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            weaponType: weaponType,
            name: weapon.name,
            color: '#ccaa55',
            pulseTime: 0
        });
    }

    function updateDroppedWeapons(dt) {
        for (const w of droppedWeapons) {
            w.pulseTime = (w.pulseTime || 0) + dt;
        }
    }

    function drawDroppedWeapons(ctx) {
        for (const w of droppedWeapons) {
            const screenX = w.x - camera.x;
            const screenY = w.y - camera.y;

            // Skip if not visible
            if (screenX < -50 || screenX > CANVAS_WIDTH + 50 ||
                screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;

            // Pulsing glow
            const pulse = 0.5 + Math.sin(w.pulseTime * 4) * 0.3;

            // Glow effect
            ctx.globalAlpha = 0.4 * pulse;
            ctx.fillStyle = '#ffdd66';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 18, 0, Math.PI * 2);
            ctx.fill();

            // Weapon icon (rectangle for gun shape)
            ctx.globalAlpha = 1;
            ctx.fillStyle = w.color;
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-12, -4, 24, 8);
            ctx.fillRect(6, -6, 6, 4);  // Grip
            ctx.restore();

            // Weapon name label
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(w.name, screenX, screenY + 22);
        }
        ctx.globalAlpha = 1;
    }

    function tryPickupWeapon() {
        for (let i = droppedWeapons.length - 1; i >= 0; i--) {
            const w = droppedWeapons[i];
            const dist = Math.hypot(player.x - w.x, player.y - w.y);

            if (dist < 30) {
                // Swap weapons
                const oldWeaponType = player.weaponType;
                const oldWeapon = player.weapon;

                // Equip new weapon
                player.weaponType = w.weaponType;
                player.weapon = WEAPONS[w.weaponType];
                player.ammo = player.weapon.magSize;
                player.maxAmmo = player.weapon.magSize;
                player.reloading = false;
                player.reloadTimer = 0;

                // Drop old weapon
                w.weaponType = oldWeaponType;
                w.name = oldWeapon.name;

                // Particle feedback
                for (let i = 0; i < 8; i++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.3,
                        maxLife: 0.3,
                        size: 4,
                        color: '#ffff00',
                        type: 'dust'
                    });
                }

                return true;
            }
        }
        return false;
    }

    function spawnDodgeDust(x, y) {
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 6 + Math.random() * 6,
                color: '#887766',
                type: 'dust'
            });
        }
    }

    function spawnFootstepDust(x, y, isSprinting) {
        const count = isSprinting ? 3 : 1;
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 4;
            particles.push({
                x: x + offsetX,
                y: y + offsetY,
                vx: (Math.random() - 0.5) * 20,
                vy: -10 - Math.random() * 20,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: isSprinting ? (4 + Math.random() * 4) : (2 + Math.random() * 3),
                color: '#998877',
                type: 'footstep_dust'
            });
        }
    }

    function spawnDeathParticles(x, y, color) {
        // Blood splatter
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                size: 4 + Math.random() * 6,
                color: color,
                type: 'gib',
                gravity: true
            });
        }

        // Darker blood pools
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 2.0 + Math.random() * 1.0,
                maxLife: 3.0,
                size: 8 + Math.random() * 12,
                color: '#440000',
                type: 'blood_pool',
                gravity: false
            });
        }

        // Bright flash
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.15,
            maxLife: 0.15,
            size: 40,
            color: '#ffffff',
            type: 'explosion'
        });

        // Shockwave ring
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.3,
            maxLife: 0.3,
            size: 10,
            color: color,
            type: 'death_ring'
        });

        // Smoke puffs
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 40,
                vy: -30 - Math.random() * 40,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 1.2,
                size: 15 + Math.random() * 15,
                color: '#333333',
                type: 'smoke',
                gravity: false
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.gravity) {
                p.vy += 300 * dt;
            }

            p.vx *= 0.95;
            p.vy *= 0.95;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles(ctx) {
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;

            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            if (p.type === 'flash' || p.type === 'explosion') {
                const size = p.size * (p.type === 'explosion' ? (1 - alpha) * 2 : 1);
                const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'dust') {
                const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, p.size * alpha);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(screenX - p.size, screenY - p.size, p.size * 2, p.size * 2);
            } else if (p.type === 'gib') {
                // Irregular blood splatter shapes
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(screenX, screenY, p.size * alpha * 1.2, p.size * alpha * 0.7,
                    Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
                ctx.fill();
                // Add darker core
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = '#220000';
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * alpha * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'blood_pool') {
                // Expanding dark blood pools
                const size = p.size * (1 - alpha * 0.5);
                ctx.globalAlpha = alpha * 0.6;
                const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
                grad.addColorStop(0, '#330000');
                grad.addColorStop(0.7, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'death_ring') {
                // Expanding shockwave ring
                const ringSize = p.size + (1 - alpha) * 50;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3 * alpha;
                ctx.globalAlpha = alpha * 0.8;
                ctx.beginPath();
                ctx.arc(screenX, screenY, ringSize, 0, Math.PI * 2);
                ctx.stroke();
                // Inner glow
                ctx.lineWidth = 6 * alpha;
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, ringSize * 0.9, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'smoke') {
                // Soft expanding smoke clouds
                const size = p.size * (1 + (1 - alpha) * 0.5);
                ctx.globalAlpha = alpha * 0.4;
                const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(0.5, '#222222');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'footstep_dust') {
                // Small rising dust puffs
                const size = p.size * (0.5 + alpha * 0.5);
                ctx.globalAlpha = alpha * 0.5;
                const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(0.6, '#776655');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'blood_drip') {
                // Dripping blood for bleed status
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha * 0.8;
                // Elongated drip shape
                ctx.beginPath();
                ctx.ellipse(screenX, screenY, p.size * 0.6, p.size * alpha, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCREEN EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════

    function triggerScreenShake(intensity, duration) {
        screenShake.intensity = Math.max(screenShake.intensity, intensity);
        screenShake.duration = Math.max(screenShake.duration, duration);
    }

    function updateScreenShake(dt) {
        if (screenShake.duration > 0) {
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.duration -= dt;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
            screenShake.intensity = 0;
        }
    }

    function updateDamageIndicators(dt) {
        for (let i = damageIndicators.length - 1; i >= 0; i--) {
            damageIndicators[i].life -= dt;
            if (damageIndicators[i].life <= 0) {
                damageIndicators.splice(i, 1);
            }
        }

        // Fade damage flash
        if (damageFlash > 0) {
            damageFlash = Math.max(0, damageFlash - dt * 3);
        }
    }

    function drawDamageFlash(ctx) {
        if (damageFlash <= 0) return;

        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.3})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Vignette effect for extra impact
        const gradient = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${damageFlash * 0.4})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
            hitMarkers[i].scale = 1 + (hitMarkers[i].life / hitMarkers[i].maxLife) * 0.5;
            if (hitMarkers[i].life <= 0) {
                hitMarkers.splice(i, 1);
            }
        }
    }

    function drawHitMarkers(ctx) {
        for (const hm of hitMarkers) {
            const screenX = hm.x - camera.x;
            const screenY = hm.y - camera.y;
            const alpha = hm.life / hm.maxLife;
            const size = 8 * hm.scale;

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = hm.isKill ? '#ff4444' : '#ffffff';
            ctx.lineWidth = 2;

            // Draw X marker
            ctx.beginPath();
            ctx.moveTo(screenX - size, screenY - size);
            ctx.lineTo(screenX + size, screenY + size);
            ctx.moveTo(screenX + size, screenY - size);
            ctx.lineTo(screenX - size, screenY + size);
            ctx.stroke();

            ctx.globalAlpha = 1;
        }
    }

    function drawDamageIndicators(ctx) {
        for (const indicator of damageIndicators) {
            const alpha = indicator.life;
            ctx.save();
            ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.rotate(indicator.angle);

            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(150, 0);
            ctx.lineTo(200, -20);
            ctx.lineTo(200, 20);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ZONE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    function generateZone() {
        zoneMap = [];
        obstacles = [];
        enemies = [];
        lootContainers = [];
        extractionPoints = [];

        // Create base terrain
        for (let y = 0; y < ZONE_HEIGHT; y++) {
            zoneMap[y] = [];
            for (let x = 0; x < ZONE_WIDTH; x++) {
                zoneMap[y][x] = Math.random() < 0.3 ? 'grassDark' : 'grass';
            }
        }

        // Add buildings/obstacles
        const buildingCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < buildingCount; i++) {
            const bx = 100 + Math.random() * (ZONE_WIDTH * TILE_SIZE - 200);
            const by = 100 + Math.random() * (ZONE_HEIGHT * TILE_SIZE - 200);
            const bw = 80 + Math.random() * 80;
            const bh = 60 + Math.random() * 60;

            obstacles.push({
                x: bx,
                y: by,
                width: bw,
                height: bh,
                type: 'building'
            });

            // Loot near buildings
            lootContainers.push(new LootContainer(
                bx + bw/2 + (Math.random() - 0.5) * 40,
                by + bh/2 + (Math.random() - 0.5) * 40,
                Math.random() < 0.3 ? 'weapon' : 'supply'
            ));
        }

        // Spawn enemies with weighted variety
        const enemyWeights = {
            banditScout: 30,
            bandit: 25,
            banditHeavy: 15,
            banditSniper: 8,
            wolf: 12,
            ghoul: 10
        };

        // Build cumulative weights for selection
        const totalWeight = Object.values(enemyWeights).reduce((a, b) => a + b, 0);

        function selectWeightedEnemy() {
            let r = Math.random() * totalWeight;
            for (const [type, weight] of Object.entries(enemyWeights)) {
                r -= weight;
                if (r <= 0) return type;
            }
            return 'banditScout';
        }

        for (let i = 0; i < 10 + Math.floor(Math.random() * 5); i++) {
            const ex = 150 + Math.random() * (ZONE_WIDTH * TILE_SIZE - 300);
            const ey = 150 + Math.random() * (ZONE_HEIGHT * TILE_SIZE - 300);

            // Don't spawn near player start
            if (Math.hypot(ex - 100, ey - 100) < 200) continue;

            const type = selectWeightedEnemy();
            enemies.push(new Enemy(type, ex, ey));
        }

        // Spawn extraction point (far from start)
        extractionPoints.push(new ExtractionPoint(
            ZONE_WIDTH * TILE_SIZE - 100,
            ZONE_HEIGHT * TILE_SIZE - 100
        ));

        // Additional extraction
        extractionPoints.push(new ExtractionPoint(
            100,
            ZONE_HEIGHT * TILE_SIZE - 100
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAMERA
    // ═══════════════════════════════════════════════════════════════════════════

    function updateCamera() {
        // Follow player
        const targetX = player.x - CANVAS_WIDTH / 2;
        const targetY = player.y - CANVAS_HEIGHT / 2;

        camera.x += (targetX - camera.x) * 0.1;
        camera.y += (targetY - camera.y) * 0.1;

        // Clamp to zone bounds
        camera.x = Math.max(0, Math.min(ZONE_WIDTH * TILE_SIZE - CANVAS_WIDTH, camera.x));
        camera.y = Math.max(0, Math.min(ZONE_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, camera.y));

        // Apply screen shake
        camera.x += screenShake.x;
        camera.y += screenShake.y;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BULLETS
    // ═══════════════════════════════════════════════════════════════════════════

    function updateBullets(dt) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];

            // Move
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.traveled += Math.hypot(b.vx, b.vy) * dt;

            // Check range
            if (b.traveled > b.range) {
                bullets.splice(i, 1);
                continue;
            }

            // Check obstacle collision
            let hitObstacle = false;
            for (const obs of obstacles) {
                if (b.x > obs.x && b.x < obs.x + obs.width &&
                    b.y > obs.y && b.y < obs.y + obs.height) {
                    hitObstacle = true;
                    break;
                }
            }
            if (hitObstacle) {
                bullets.splice(i, 1);
                continue;
            }

            // Check entity collision
            if (b.owner === 'player') {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
                        const dead = e.takeDamage(b.damage);
                        runStats.damageDealt += b.damage;
                        spawnHitMarker(e.x, e.y, dead);
                        if (dead) {
                            spawnDeathParticles(e.x, e.y, e.color);
                            spawnEnemyLoot(e.x, e.y, e.type);
                            enemies.splice(j, 1);
                            runStats.kills++;
                        }
                        bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                if (Math.hypot(b.x - player.x, b.y - player.y) < player.size) {
                    player.takeDamage(b.damage, b.x, b.y);
                    bullets.splice(i, 1);
                }
            }
        }
    }

    function drawBullets(ctx) {
        for (const b of bullets) {
            const screenX = b.x - camera.x;
            const screenY = b.y - camera.y;
            const trailX = screenX - b.vx * 0.03;
            const trailY = screenY - b.vy * 0.03;

            // Outer glow trail
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.15;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();

            // Middle glow trail
            ctx.strokeStyle = COLORS.bulletTrail;
            ctx.lineWidth = 5;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();

            // Core trail
            ctx.strokeStyle = COLORS.bullet;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Bullet glow
            const glowSize = b.owner === 'player' ? 8 : 6;
            const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
            grad.addColorStop(0, b.owner === 'player' ? '#ffffff' : '#ff8888');
            grad.addColorStop(0.3, COLORS.bullet);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Bullet core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GRENADES
    // ═══════════════════════════════════════════════════════════════════════════

    function updateGrenades(dt) {
        for (let i = grenades.length - 1; i >= 0; i--) {
            const g = grenades[i];

            // Move grenade with friction
            g.x += g.vx * dt;
            g.y += g.vy * dt;
            g.vx *= 0.95;
            g.vy *= 0.95;

            // Countdown timer
            g.timer -= dt;

            if (g.timer <= 0) {
                // Explode!
                explodeGrenade(g);
                grenades.splice(i, 1);
            }
        }
    }

    function explodeGrenade(g) {
        // Damage enemies in radius
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const dist = Math.hypot(e.x - g.x, e.y - g.y);
            if (dist < g.radius) {
                const damage = g.damage * (1 - dist / g.radius);
                const dead = e.takeDamage(Math.floor(damage));
                runStats.damageDealt += Math.floor(damage);
                if (dead) {
                    spawnDeathParticles(e.x, e.y, e.color);
                    spawnEnemyLoot(e.x, e.y, e.type);
                    enemies.splice(i, 1);
                    runStats.kills++;
                }
            }
        }

        // Damage player if in radius
        const playerDist = Math.hypot(player.x - g.x, player.y - g.y);
        if (playerDist < g.radius) {
            const damage = g.damage * 0.5 * (1 - playerDist / g.radius);
            player.takeDamage(Math.floor(damage), g.x, g.y);
        }

        // Spawn explosion effects
        spawnExplosion(g.x, g.y, g.radius);
        triggerScreenShake(20, 0.4);
    }

    function spawnExplosion(x, y, radius) {
        // Central flash
        particles.push({
            x: x, y: y,
            vx: 0, vy: 0,
            life: 0.3, maxLife: 0.3,
            size: radius * 0.8,
            color: '#ffff88',
            type: 'explosion'
        });

        // Fire ring
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                life: 0.4, maxLife: 0.4,
                size: 8 + Math.random() * 8,
                color: '#ff6600',
                type: 'flash'
            });
        }

        // Debris
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                size: 3 + Math.random() * 5,
                color: '#888888',
                type: 'dust',
                gravity: true
            });
        }

        // Smoke
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 30,
                vy: -30 - Math.random() * 50,
                life: 1.5, maxLife: 1.5,
                size: 15 + Math.random() * 15,
                color: '#555555',
                type: 'smoke'
            });
        }
    }

    function drawGrenades(ctx) {
        for (const g of grenades) {
            const screenX = g.x - camera.x;
            const screenY = g.y - camera.y;

            // Grenade body
            ctx.fillStyle = '#556644';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Flashing indicator when about to explode
            if (g.timer < 1.0) {
                const flash = Math.sin(performance.now() / (g.timer * 100 + 50)) > 0;
                if (flash) {
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY - 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Timer text (debug)
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(g.timer.toFixed(1), screenX, screenY - 12);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOT DROPS
    // ═══════════════════════════════════════════════════════════════════════════

    function updateLootDrops() {
        // Auto-pickup when player walks over
        for (let i = lootDrops.length - 1; i >= 0; i--) {
            const loot = lootDrops[i];
            const dist = Math.hypot(player.x - loot.x, player.y - loot.y);

            if (dist < 25) {
                // Pickup the loot
                switch (loot.type) {
                    case 'rubles':
                        player.rubles += loot.amount;
                        break;
                    case 'ammo':
                        player.ammo = Math.min(player.ammo + loot.amount, player.weapon.magSize * 2);
                        break;
                    case 'bandage':
                        player.bandages += loot.amount;
                        break;
                    case 'grenade':
                        player.grenades += loot.amount;
                        break;
                    case 'armor':
                        player.armor = Math.min(player.maxArmor, player.armor + loot.amount);
                        break;
                    case 'medkit':
                        player.medkits += loot.amount;
                        break;
                }
                // Spawn pickup particle
                spawnPickupParticle(loot.x, loot.y, loot.color);
                lootDrops.splice(i, 1);
            }
        }
    }

    function spawnPickupParticle(x, y, color) {
        particles.push({
            x: x, y: y,
            vx: 0, vy: -50,
            life: 0.5, maxLife: 0.5,
            size: 10,
            color: color,
            type: 'pickup'
        });
    }

    function drawLootDrops(ctx) {
        for (const loot of lootDrops) {
            const screenX = loot.x - camera.x;
            const screenY = loot.y - camera.y;

            // Pulsing glow
            const pulse = 0.7 + Math.sin(performance.now() / 200) * 0.3;

            // Glow
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = loot.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, loot.size * 2 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Item body
            ctx.globalAlpha = 1;
            ctx.fillStyle = loot.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, loot.size, 0, Math.PI * 2);
            ctx.fill();

            // Icon based on type
            ctx.fillStyle = '#000';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (loot.type === 'rubles') ctx.fillText('$', screenX, screenY);
            else if (loot.type === 'ammo') ctx.fillText('A', screenX, screenY);
            else if (loot.type === 'bandage') ctx.fillText('+', screenX, screenY);
            else if (loot.type === 'grenade') ctx.fillText('G', screenX, screenY);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT
    // ═══════════════════════════════════════════════════════════════════════════

    function setupInput() {
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;

            if (gameState === 'menu' && e.key === 'Enter') {
                startGame();
            }

            if (gameState === 'playing') {
                if (e.key.toLowerCase() === 'r') {
                    player.startReload();
                }
                if (e.key === ' ') {
                    player.tryDodge();
                    e.preventDefault();
                }
                if (e.key.toLowerCase() === 'e') {
                    tryInteract();
                }
                if (e.key.toLowerCase() === 'b') {
                    player.useBandage();
                }
                if (e.key.toLowerCase() === 'h') {
                    player.useMedkit();
                }
                if (e.key.toLowerCase() === 'g') {
                    player.throwGrenade();
                }
                if (e.key.toLowerCase() === 'q') {
                    tryPickupWeapon();
                }
            }

            if ((gameState === 'dead' || gameState === 'extracted') && e.key === 'Enter') {
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
            if (e.button === 0) {
                mouse.down = true;
                if (gameState === 'playing' && !player.weapon.auto) {
                    player.tryShoot();
                }
            }
            if (e.button === 2) {
                mouse.rightDown = true;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) mouse.down = false;
            if (e.button === 2) mouse.rightDown = false;
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    function tryInteract() {
        // Check loot containers
        for (const container of lootContainers) {
            if (container.looted) continue;
            const dist = Math.hypot(player.x - container.x, player.y - container.y);
            if (dist < 50) {
                const loot = container.loot();
                if (loot) {
                    for (const item of loot) {
                        if (item.type === 'rubles') {
                            player.rubles += item.amount;
                        } else if (item.type === 'ammo') {
                            player.ammo = Math.min(player.ammo + item.amount, player.weapon.magSize);
                        }
                    }
                }
                return;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════════

    function drawZone(ctx) {
        // Draw terrain
        const startX = Math.floor(camera.x / TILE_SIZE);
        const startY = Math.floor(camera.y / TILE_SIZE);
        const endX = Math.min(ZONE_WIDTH, startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 2);
        const endY = Math.min(ZONE_HEIGHT, startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y < 0 || x < 0) continue;
                const tile = zoneMap[y]?.[x] || 'grass';
                ctx.fillStyle = COLORS[tile];
                ctx.fillRect(
                    x * TILE_SIZE - camera.x,
                    y * TILE_SIZE - camera.y,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }

        // Draw obstacles
        for (const obs of obstacles) {
            const screenX = obs.x - camera.x;
            const screenY = obs.y - camera.y;

            // Skip if not visible
            if (screenX + obs.width < 0 || screenX > CANVAS_WIDTH ||
                screenY + obs.height < 0 || screenY > CANVAS_HEIGHT) continue;

            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(screenX, screenY, obs.width, obs.height);
            ctx.strokeStyle = COLORS.wallDark;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, obs.width, obs.height);
        }
    }

    function drawUI(ctx) {
        // UI background
        ctx.fillStyle = COLORS.ui;
        ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
        ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);

        ctx.font = '14px monospace';
        ctx.textAlign = 'left';

        // Health bar
        const healthPct = player.health / player.maxHealth;
        const criticalHealth = healthPct <= 0.25;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 150, 16);

        if (criticalHealth) {
            // Pulsing red for critical health
            const pulse = 0.7 + Math.sin(performance.now() / 80) * 0.3;
            ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
        } else {
            ctx.fillStyle = healthPct > 0.3 ? COLORS.health : COLORS.healthLow;
        }
        ctx.fillRect(10, 10, 150 * healthPct, 16);

        ctx.fillStyle = criticalHealth ? '#ff4444' : COLORS.uiText;
        ctx.fillText(`HP: ${player.health}/${player.maxHealth}${criticalHealth ? ' - CRITICAL!' : ''}`, 15, 23);

        // Stamina bar
        const staminaPct = player.stamina / player.maxStamina;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 30, 150, 8);
        ctx.fillStyle = COLORS.stamina;
        ctx.fillRect(10, 30, 150 * staminaPct, 8);

        // Armor bar (only show if player has armor)
        if (player.armor > 0 || player.maxArmor > 0) {
            const armorPct = player.armor / player.maxArmor;
            ctx.fillStyle = '#333';
            ctx.fillRect(10, 40, 150, 6);
            ctx.fillStyle = '#4488aa';
            ctx.fillRect(10, 40, 150 * armorPct, 6);
        }

        // Status effects indicator
        if (player.statusEffects.heavyBleeding) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('HEAVY BLEEDING!', 170, 23);
        } else if (player.statusEffects.bleeding) {
            ctx.fillStyle = '#ff6666';
            ctx.fillText('Bleeding', 170, 23);
        }

        // Bandages, medkits and grenades count
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Bandages: ${player.bandages} [B]  Medkits: ${player.medkits} [H]  Grenades: ${player.grenades} [G]`, 170, 38);

        // Weapon info
        ctx.fillStyle = COLORS.uiText;
        ctx.textAlign = 'center';
        ctx.fillText(`${player.weapon.name}`, CANVAS_WIDTH / 2, 23);

        if (player.reloading) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('RELOADING...', CANVAS_WIDTH / 2, 38);

            // Reload progress bar
            const reloadPct = 1 - (player.reloadTimer / player.weapon.reloadTime);
            const barWidth = 80;
            ctx.fillStyle = '#333';
            ctx.fillRect(CANVAS_WIDTH / 2 - barWidth / 2, 43, barWidth, 4);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(CANVAS_WIDTH / 2 - barWidth / 2, 43, barWidth * reloadPct, 4);
        } else {
            const lowAmmo = player.ammo <= Math.ceil(player.maxAmmo * 0.3);
            const noAmmo = player.ammo === 0;
            if (noAmmo) {
                ctx.fillStyle = '#ff4444';
                ctx.fillText(`${player.ammo} / ${player.maxAmmo} - NO AMMO!`, CANVAS_WIDTH / 2, 38);
            } else if (lowAmmo) {
                // Pulsing low ammo warning
                const pulse = 0.7 + Math.sin(performance.now() / 100) * 0.3;
                ctx.fillStyle = `rgba(255, 170, 0, ${pulse})`;
                ctx.fillText(`${player.ammo} / ${player.maxAmmo} - LOW`, CANVAS_WIDTH / 2, 38);
            } else {
                ctx.fillStyle = COLORS.ammo;
                ctx.fillText(`${player.ammo} / ${player.maxAmmo}`, CANVAS_WIDTH / 2, 38);
            }
        }

        // Rubles
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(`Rubles: ${player.rubles}`, CANVAS_WIDTH - 10, 23);

        // Enemies remaining
        ctx.fillText(`Enemies: ${enemies.length}`, CANVAS_WIDTH - 10, 38);

        // Bottom UI
        ctx.fillStyle = COLORS.uiText;
        ctx.textAlign = 'left';
        ctx.fillText('WASD - Move | LMB - Shoot | RMB - Aim | Space - Dodge', 10, CANVAS_HEIGHT - 40);
        ctx.fillText('R - Reload | E - Loot | Q - Swap Weapon | Shift - Sprint', 10, CANVAS_HEIGHT - 20);

        // Extraction direction
        if (extractionPoints.length > 0) {
            let nearest = extractionPoints[0];
            let nearestDist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
            for (const ep of extractionPoints) {
                const dist = Math.hypot(ep.x - player.x, ep.y - player.y);
                if (dist < nearestDist) {
                    nearest = ep;
                    nearestDist = dist;
                }
            }

            ctx.textAlign = 'right';
            ctx.fillStyle = COLORS.extraction;
            ctx.fillText(`Extract: ${Math.floor(nearestDist)}m`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
        }

        // Draw minimap
        drawMinimap(ctx);
    }

    function drawMinimap(ctx) {
        const mapSize = 120;
        const mapX = CANVAS_WIDTH - mapSize - 10;
        const mapY = 55;
        const scale = mapSize / (ZONE_WIDTH * 0.6);
        const viewRadius = 400; // How far player can see on map

        // Map background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(mapX + mapSize/2, mapY + mapSize/2, mapSize/2, 0, Math.PI * 2);
        ctx.fill();

        // Map border
        ctx.strokeStyle = '#446644';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Clip to circular map
        ctx.save();
        ctx.beginPath();
        ctx.arc(mapX + mapSize/2, mapY + mapSize/2, mapSize/2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Map center is player position
        const mapCenterX = mapX + mapSize/2;
        const mapCenterY = mapY + mapSize/2;

        // Draw obstacles on map
        ctx.fillStyle = 'rgba(80, 80, 60, 0.6)';
        for (const obs of obstacles) {
            const relX = (obs.x + obs.width/2 - player.x) * scale;
            const relY = (obs.y + obs.height/2 - player.y) * scale;
            const dist = Math.hypot(relX, relY);
            if (dist < mapSize/2) {
                ctx.fillRect(
                    mapCenterX + relX - obs.width * scale/2,
                    mapCenterY + relY - obs.height * scale/2,
                    Math.max(2, obs.width * scale),
                    Math.max(2, obs.height * scale)
                );
            }
        }

        // Draw extraction points
        ctx.fillStyle = '#44ff44';
        for (const ep of extractionPoints) {
            const relX = (ep.x - player.x) * scale;
            const relY = (ep.y - player.y) * scale;
            const dist = Math.hypot(relX, relY);
            if (dist < mapSize/2) {
                ctx.beginPath();
                ctx.arc(mapCenterX + relX, mapCenterY + relY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw loot containers
        ctx.fillStyle = '#ffaa00';
        for (const lc of lootContainers) {
            if (lc.looted) continue;
            const relX = (lc.x - player.x) * scale;
            const relY = (lc.y - player.y) * scale;
            const dist = Math.hypot(relX, relY);
            if (dist < mapSize/2) {
                ctx.fillRect(mapCenterX + relX - 2, mapCenterY + relY - 2, 4, 4);
            }
        }

        // Draw loot drops
        ctx.fillStyle = '#ffff00';
        for (const ld of lootDrops) {
            const relX = (ld.x - player.x) * scale;
            const relY = (ld.y - player.y) * scale;
            const dist = Math.hypot(relX, relY);
            if (dist < mapSize/2) {
                ctx.fillRect(mapCenterX + relX - 1, mapCenterY + relY - 1, 2, 2);
            }
        }

        // Draw enemies
        for (const e of enemies) {
            const relX = (e.x - player.x) * scale;
            const relY = (e.y - player.y) * scale;
            const dist = Math.hypot(relX, relY);
            if (dist < mapSize/2) {
                // Color based on state
                if (e.state === 'combat') {
                    ctx.fillStyle = '#ff4444'; // Red when hostile
                } else if (e.state === 'alert') {
                    ctx.fillStyle = '#ffaa00'; // Orange when alerted
                } else {
                    ctx.fillStyle = '#ff8888'; // Light red when patrolling
                }
                ctx.beginPath();
                ctx.arc(mapCenterX + relX, mapCenterY + relY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw player (center dot)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mapCenterX, mapCenterY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Player direction indicator
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mapCenterX, mapCenterY);
        ctx.lineTo(
            mapCenterX + Math.cos(player.angle) * 8,
            mapCenterY + Math.sin(player.angle) * 8
        );
        ctx.stroke();

        ctx.restore();

        // Map label
        ctx.fillStyle = '#88aa88';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RADAR', mapX + mapSize/2, mapY + mapSize + 12);
    }

    function drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ccddcc';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WASTELAND EXTRACTION', CANVAS_WIDTH / 2, 200);

        ctx.font = '24px monospace';
        ctx.fillText('A Zero Sievert Clone', CANVAS_WIDTH / 2, 250);

        ctx.font = '18px monospace';
        ctx.fillStyle = '#88aa88';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 350);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#668866';
        ctx.fillText('WASD - Move | Mouse - Aim | LMB - Shoot', CANVAS_WIDTH / 2, 420);
        ctx.fillText('Space - Dodge Roll | Shift - Sprint | R - Reload', CANVAS_WIDTH / 2, 445);
        ctx.fillText('Reach the extraction point to survive!', CANVAS_WIDTH / 2, 480);
    }

    function drawDeathScreen(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#cc4444';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', CANVAS_WIDTH / 2, 150);

        ctx.font = '18px monospace';
        ctx.fillStyle = '#886666';
        ctx.fillText('All equipped gear has been lost.', CANVAS_WIDTH / 2, 195);

        // Show run stats even on death
        ctx.font = '14px monospace';
        ctx.fillStyle = '#887777';
        const statsY = 250;
        ctx.fillText(`Enemies eliminated: ${runStats.kills}`, CANVAS_WIDTH / 2, statsY);
        ctx.fillText(`Damage dealt: ${runStats.damageDealt}`, CANVAS_WIDTH / 2, statsY + 22);
        ctx.fillText(`Damage taken: ${runStats.damageTaken}`, CANVAS_WIDTH / 2, statsY + 44);
        ctx.fillText(`Rubles lost: ${player ? player.rubles : 0}`, CANVAS_WIDTH / 2, statsY + 66);

        ctx.fillStyle = '#668866';
        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to return to menu', CANVAS_WIDTH / 2, 400);
    }

    function drawExtractedScreen(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#44cc44';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACTED!', CANVAS_WIDTH / 2, 150);

        ctx.font = '24px monospace';
        ctx.fillStyle = '#88cc88';
        ctx.fillText('Raid Successful', CANVAS_WIDTH / 2, 195);

        // Run statistics
        ctx.font = '16px monospace';
        ctx.fillStyle = '#ccddcc';
        const statsY = 250;
        ctx.fillText(`Rubles collected: ${player.rubles}`, CANVAS_WIDTH / 2, statsY);
        ctx.fillText(`Enemies eliminated: ${runStats.kills}`, CANVAS_WIDTH / 2, statsY + 28);
        ctx.fillText(`Damage dealt: ${runStats.damageDealt}`, CANVAS_WIDTH / 2, statsY + 56);
        ctx.fillText(`Damage taken: ${runStats.damageTaken}`, CANVAS_WIDTH / 2, statsY + 84);
        ctx.fillText(`Shots fired: ${runStats.shotsFired}`, CANVAS_WIDTH / 2, statsY + 112);

        // Health remaining
        ctx.fillStyle = player.health > 50 ? '#88cc88' : '#cc8888';
        ctx.fillText(`Health remaining: ${player.health}/${player.maxHealth}`, CANVAS_WIDTH / 2, statsY + 148);

        ctx.fillStyle = '#668866';
        ctx.fillText('Press ENTER to continue', CANVAS_WIDTH / 2, 480);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════════

    function startGame() {
        gameState = 'playing';
        player = new Player(100, 100);
        generateZone();
        camera = { x: 0, y: 0 };
        bullets = [];
        grenades = [];
        lootDrops = [];
        droppedWeapons = [];
        particles = [];
        damageIndicators = [];
        hitMarkers = [];
        damageFlash = 0;

        // Reset run statistics
        runStats = {
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            shotsFired: 0,
            accuracy: 0,
            runTime: 0
        };
    }

    function update(dt) {
        if (gameState !== 'playing') return;

        player.update(dt);

        for (const enemy of enemies) {
            enemy.update(dt);
        }

        for (const ep of extractionPoints) {
            ep.update(dt);
        }

        updateBullets(dt);
        updateGrenades(dt);
        updateLootDrops();
        updateDroppedWeapons(dt);
        updateParticles(dt);
        updateScreenShake(dt);
        updateDamageIndicators(dt);
        updateHitMarkers(dt);
        updateCamera();
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'menu') {
            drawMenu(ctx);
            return;
        }

        if (gameState === 'dead') {
            drawDeathScreen(ctx);
            return;
        }

        if (gameState === 'extracted') {
            drawExtractedScreen(ctx);
            return;
        }

        // Game view
        drawZone(ctx);

        // Extraction points
        for (const ep of extractionPoints) {
            ep.draw(ctx);
        }

        // Loot containers
        for (const container of lootContainers) {
            container.draw(ctx);
        }

        // Loot drops
        drawLootDrops(ctx);

        // Dropped weapons
        drawDroppedWeapons(ctx);

        // Enemies
        for (const enemy of enemies) {
            enemy.draw(ctx);
        }

        // Player
        player.draw(ctx);

        // Bullets
        drawBullets(ctx);

        // Grenades
        drawGrenades(ctx);

        // Particles
        drawParticles(ctx);

        // Damage indicators
        drawDamageIndicators(ctx);

        // Hit markers
        drawHitMarkers(ctx);

        // Damage flash overlay
        drawDamageFlash(ctx);

        // UI
        drawUI(ctx);
    }

    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    function init() {
        setupInput();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST HARNESS GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    window.getPlayer = function() { return player; };
    window.getEnemies = function() { return enemies; };
    window.getBullets = function() { return bullets; };
    window.getLootContainers = function() { return lootContainers; };
    window.getExtractionPoints = function() { return extractionPoints; };
    window.getObstacles = function() { return obstacles; };
    window.getKeys = function() { return keys; };
    window.getLootDrops = function() { return lootDrops; };
    window.getDroppedWeapons = function() { return droppedWeapons; };
    window.getGrenades = function() { return grenades; };
    window.gameState = function() { return { state: gameState }; };
    window.startGame = startGame;

    window.WEAPONS = WEAPONS;
    window.ENEMY_DATA = ENEMY_DATA;
    window.spawnEnemyLoot = spawnEnemyLoot;
    window.spawnDeathParticles = spawnDeathParticles;
    window.spawnWeaponDrop = spawnWeaponDrop;
    window.tryPickupWeapon = tryPickupWeapon;
    window.Enemy = Enemy;
    window.getRunStats = function() { return runStats; };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
