/**
 * STATION BREACH - Alien Breed Mix Clone
 * A top-down twin-stick shooter with survival horror elements
 */

// ============================================================================
// CONSTANTS
// ============================================================================
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

// Player constants
const PLAYER_SIZE = 32;
const PLAYER_HITBOX = 24;
const PLAYER_SPEED = 200; // Balanced: slightly faster base (from 180)
const PLAYER_SPRINT_SPEED = 300; // Balanced: slightly faster sprint (from 270)
const PLAYER_MAX_HP = 100;
const PLAYER_MAX_SHIELD = 0;
const PLAYER_MAX_STAMINA = 100;
const PLAYER_STAMINA_REGEN = 25; // Balanced: faster regen (from 20)
const PLAYER_STAMINA_DRAIN = 20; // Balanced: slower drain (from 25)
const PICKUP_RADIUS = 32;

// Weapon definitions
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 18, // Balanced: increased from 15 (reliable fallback)
        fireRate: 4,
        magSize: 12,
        reloadTime: 950,
        projectileSpeed: 800,
        spread: 3,
        range: 500,
        shake: 2,
        shakeDuration: 50,
        ammoType: '9mm',
        infinite: true
    },
    shotgun: {
        name: 'Shotgun',
        damage: 10, // Balanced: increased from 8 (per pellet = 60 total)
        pellets: 6,
        fireRate: 1.2,
        magSize: 8,
        reloadTime: 2250, // 2.5s - 250ms
        projectileSpeed: 600,
        spread: 25,
        range: 250,
        shake: 8,
        shakeDuration: 150,
        ammoType: 'shells'
    },
    smg: {
        name: 'SMG',
        damage: 10,
        fireRate: 12,
        magSize: 40,
        reloadTime: 1550, // 1.8s - 250ms
        projectileSpeed: 700,
        spread: 8,
        range: 400,
        shake: 2,
        shakeDuration: 40,
        ammoType: '9mm'
    },
    assault: {
        name: 'Assault Rifle',
        damage: 20,
        fireRate: 6,
        magSize: 30,
        reloadTime: 1750, // 2s - 250ms
        projectileSpeed: 850,
        spread: 5,
        range: 600,
        shake: 3,
        shakeDuration: 80,
        ammoType: 'rifle'
    },
    flamethrower: {
        name: 'Flamethrower',
        damage: 7, // Balanced: increased from 5 (more viable)
        fireRate: 30,
        magSize: 100,
        reloadTime: 2750, // 3s - 250ms
        projectileSpeed: 400,
        spread: 15,
        range: 200,
        shake: 1,
        shakeDuration: 30,
        ammoType: 'fuel',
        isFlame: true
    },
    plasma: {
        name: 'Plasma Rifle',
        damage: 40,
        fireRate: 2,
        magSize: 20,
        reloadTime: 2250, // 2.5s - 250ms
        projectileSpeed: 500,
        spread: 0,
        range: 700,
        shake: 4,
        shakeDuration: 100,
        ammoType: 'plasma'
    },
    rocket: {
        name: 'Rocket Launcher',
        damage: 100,
        splashDamage: 50,
        splashRadius: 80,
        fireRate: 0.8,
        magSize: 4,
        reloadTime: 3250, // 3.5s - 250ms
        projectileSpeed: 350,
        spread: 0,
        range: 800,
        shake: 15,
        shakeDuration: 300,
        ammoType: 'rockets',
        explosive: true
    }
};

// Ammo max carry
const MAX_AMMO = {
    '9mm': 300,
    'shells': 64,
    'rifle': 180,
    'fuel': 300,
    'plasma': 80,
    'rockets': 16
};

// Enemy definitions
const ENEMY_TYPES = {
    drone: {
        hp: 20,
        damage: 10,
        speed: 120,
        size: 24,
        color: '#44aa44',
        detectionRange: 280, // Balanced: reduced from 300
        attackCooldown: 1000,
        credits: 5,
        behavior: 'rush'
    },
    spitter: {
        hp: 30,
        damage: 15,
        speed: 80,
        size: 32,
        color: '#aa44aa',
        detectionRange: 380, // Balanced: reduced from 400
        attackCooldown: 2000,
        credits: 10,
        behavior: 'ranged',
        projectileSpeed: 300,
        preferredDist: 250
    },
    lurker: {
        hp: 40,
        damage: 20,
        speed: 200,
        size: 28,
        color: '#666666',
        detectionRange: 120, // Balanced: increased from 100 for better ambushes
        attackCooldown: 800,
        credits: 15,
        behavior: 'ambush',
        lungeSpeed: 300
    },
    brute: {
        hp: 100,
        damage: 30,
        speed: 60,
        size: 48,
        color: '#884422',
        detectionRange: 200, // Balanced: reduced from 250 (slow = poor senses)
        attackCooldown: 1500,
        credits: 30,
        behavior: 'charge',
        chargeSpeed: 250,
        chargeTrigger: 180 // Balanced: reduced from 200
    },
    exploder: {
        hp: 15,
        damage: 50,
        speed: 150,
        size: 24,
        color: '#ffaa00',
        detectionRange: 350,
        credits: 5,
        behavior: 'suicide',
        explosionRadius: 80
    },
    matriarch: {
        hp: 80,
        damage: 25,
        speed: 100,
        size: 40,
        color: '#aa0044',
        detectionRange: 300,
        attackCooldown: 5000,
        credits: 50,
        behavior: 'spawner',
        maxSpawns: 4
    },
    eliteDrone: {
        hp: 50,
        damage: 15,
        speed: 150,
        size: 28,
        color: '#00ff88',
        detectionRange: 350,
        attackCooldown: 800,
        credits: 25,
        behavior: 'rush'
    }
};

// Colors
const COLORS = {
    floor: '#2A2A2A',
    wall: '#4A4A4A',
    alienBlood: '#00FF88',
    warning: '#FF8800',
    emergency: '#FF0000',
    terminal: '#00FFFF',
    health: '#FF4444',
    shield: '#4488FF',
    credits: '#FFDD00',
    keyGreen: '#00FF00',
    keyBlue: '#0088FF',
    keyYellow: '#FFFF00',
    keyRed: '#FF0000',
    doorNormal: '#555555',
    muzzleFlash: '#FFFF88'
};

// ============================================================================
// GAME STATE
// ============================================================================
let canvas, ctx;
let gameState = 'title'; // title, playing, paused, shop, gameover, victory
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;
let ambientParticleTimer = 0;

// Difficulty settings
let difficulty = 'normal'; // easy, normal, hard
let screenShakeIntensity = 0.5; // 0 = off, 0.5 = reduced, 1 = full
let sprintToggle = false; // false = hold to sprint, true = toggle sprint
let sprintToggleState = false; // Current sprint state when using toggle
const DIFFICULTY_MODIFIERS = {
    easy: {
        playerDamageMult: 0.5,
        enemyDamageMult: 1.2,
        enemyHealthMult: 0.8,
        ammoDropMult: 1.5,
        creditDropMult: 1.3
    },
    normal: {
        playerDamageMult: 1.0,
        enemyDamageMult: 1.0,
        enemyHealthMult: 1.0,
        ammoDropMult: 1.0,
        creditDropMult: 1.0
    },
    hard: {
        playerDamageMult: 1.5,
        enemyDamageMult: 0.8,
        enemyHealthMult: 1.3,
        ammoDropMult: 0.7,
        creditDropMult: 0.8
    }
};

// Player
let player = null;

// Level
let currentDeck = 1;
let currentRoom = null;
let rooms = [];
let doors = [];
let walls = [];

// Entities
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];
let floatingTexts = [];
let decals = []; // Blood splatters on floor

// Camera
let camera = { x: 0, y: 0, shake: 0, shakeAngle: 0, transitionSpeed: 0.1 };
let damageFlash = 0; // Screen damage flash effect
let lastRoom = null; // Track room transitions for smooth camera

// Input
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let lastAmmoWarning = 0;

// Raycasting vision
let visibilityPolygon = [];
const VISION_RAYS = 360;
const VISION_RANGE = 400;

// Self-destruct
let selfDestructActive = false;
let selfDestructTimer = 420000; // 7 minutes in ms (balanced from 10 min)

// Stats
let stats = {
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    runTime: 0
};

// ============================================================================
// PLAYER CLASS
// ============================================================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.hitboxSize = PLAYER_HITBOX;

        // Stats
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        this.shield = PLAYER_MAX_SHIELD;
        this.maxShield = 50; // Shield capacity
        this.stamina = PLAYER_MAX_STAMINA;
        this.maxStamina = PLAYER_MAX_STAMINA;

        // Movement
        this.speed = PLAYER_SPEED;
        this.sprintSpeed = PLAYER_SPRINT_SPEED;
        this.sprinting = false;

        // Combat
        this.weapons = ['pistol'];
        this.currentWeapon = 0;
        this.ammo = {
            '9mm': 60,
            'shells': 24,
            'rifle': 90,
            'fuel': 200,
            'plasma': 40,
            'rockets': 8
        };
        this.currentMag = 12;
        this.reloading = false;
        this.reloadTimer = 0;
        this.fireTimer = 0;
        this.invulnTimer = 0;
        this.recoil = 0; // Weapon recoil animation
        this.footstepTimer = 0; // Footstep dust particle timing

        // Resources
        this.credits = 0;
        this.keycards = {
            green: false,
            blue: false,
            yellow: false,
            red: false
        };
        this.medkits = 0;

        // Upgrades
        this.damageBonus = 0;
        this.reloadSpeedBonus = 0;
        this.ammoCapacityBonus = 0;

        // God mode for testing
        this.godMode = false;
    }

    get weapon() {
        return WEAPONS[this.weapons[this.currentWeapon]];
    }

    get weaponName() {
        return this.weapons[this.currentWeapon];
    }

    update(dt) {
        // Invulnerability
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt * 1000;
        }

        // Decay weapon recoil
        if (this.recoil > 0) {
            this.recoil -= dt * 50; // Decay rate
            if (this.recoil < 0) this.recoil = 0;
        }

        // Reload
        if (this.reloading) {
            this.reloadTimer -= dt * 1000;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Fire cooldown
        if (this.fireTimer > 0) {
            this.fireTimer -= dt * 1000;
        }

        // Movement
        const speed = this.sprinting ? this.sprintSpeed : this.speed;
        this.x += this.vx * speed * dt;
        this.y += this.vy * speed * dt;

        // Footstep dust particles
        if (this.vx !== 0 || this.vy !== 0) {
            this.footstepTimer -= dt * 1000;
            if (this.footstepTimer <= 0) {
                this.footstepTimer = this.sprinting ? 100 : 200; // Faster when sprinting
                particles.push({
                    x: this.x + (Math.random() - 0.5) * 10,
                    y: this.y + this.height / 2 - 5,
                    vx: -this.vx * 20 + (Math.random() - 0.5) * 30,
                    vy: (Math.random() - 0.5) * 20,
                    size: 2 + Math.random() * 3,
                    life: 300,
                    maxLife: 300,
                    color: '#666666',
                    type: 'dust'
                });
            }
        }

        // Stamina
        if (this.sprinting && (this.vx !== 0 || this.vy !== 0)) {
            this.stamina -= PLAYER_STAMINA_DRAIN * dt;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.sprinting = false;
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + PLAYER_STAMINA_REGEN * dt);
        }

        // Wall collision
        this.resolveWallCollision();

        // Aim at mouse
        const worldMouse = screenToWorld(mouse.x, mouse.y);
        this.angle = Math.atan2(worldMouse.y - this.y, worldMouse.x - this.x);
    }

    resolveWallCollision() {
        const halfSize = this.hitboxSize / 2;

        for (const wall of walls) {
            if (this.x + halfSize > wall.x &&
                this.x - halfSize < wall.x + wall.w &&
                this.y + halfSize > wall.y &&
                this.y - halfSize < wall.y + wall.h) {

                // Push out of wall
                const overlapLeft = (this.x + halfSize) - wall.x;
                const overlapRight = (wall.x + wall.w) - (this.x - halfSize);
                const overlapTop = (this.y + halfSize) - wall.y;
                const overlapBottom = (wall.y + wall.h) - (this.y - halfSize);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    if (overlapLeft < overlapRight) {
                        this.x = wall.x - halfSize;
                    } else {
                        this.x = wall.x + wall.w + halfSize;
                    }
                } else {
                    if (overlapTop < overlapBottom) {
                        this.y = wall.y - halfSize;
                    } else {
                        this.y = wall.y + wall.h + halfSize;
                    }
                }
            }
        }
    }

    shoot() {
        if (this.reloading) return;
        if (this.fireTimer > 0) return;

        const weapon = this.weapon;

        // Check ammo
        if (this.currentMag <= 0) {
            if (!weapon.infinite && this.ammo[weapon.ammoType] <= 0) {
                // Show out of ammo (throttled)
                if (gameTime - lastAmmoWarning > 1000) {
                    showFloatingText(this.x, this.y - 30, 'OUT OF AMMO!', '#FF4444');
                    lastAmmoWarning = gameTime;
                }
                return;
            }
            this.startReload();
            return;
        }

        // Fire
        this.fireTimer = 1000 / weapon.fireRate;
        this.currentMag--;

        // Screen shake (reduced by 50%)
        addScreenShake(weapon.shake * 0.5, weapon.shakeDuration);

        // Weapon recoil
        this.recoil = Math.min(10, weapon.shake * 1.5);

        // Create projectile(s)
        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spreadAngle = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
            const angle = this.angle + spreadAngle;

            projectiles.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(angle) * weapon.projectileSpeed,
                vy: Math.sin(angle) * weapon.projectileSpeed,
                damage: weapon.damage * (1 + this.damageBonus) * DIFFICULTY_MODIFIERS[difficulty].enemyDamageMult,
                range: weapon.range,
                traveled: 0,
                isPlayer: true,
                isFlame: weapon.isFlame || false,
                explosive: weapon.explosive || false,
                splashDamage: weapon.splashDamage || 0,
                splashRadius: weapon.splashRadius || 0,
                color: weapon.isFlame ? '#FF8800' : (weapon.explosive ? '#FFAA00' : '#FFFF88')
            });
        }

        // Muzzle flash particle - varies by weapon
        const flashColors = {
            pistol: '#FFFF88',
            shotgun: '#FFAA44',
            smg: '#FFFF66',
            assault: '#FFDD66',
            flamethrower: '#FF6600',
            plasma: '#44FFFF',
            rocket: '#FF8844'
        };
        const flashSizes = {
            pistol: 12,
            shotgun: 25,
            smg: 10,
            assault: 15,
            flamethrower: 20,
            plasma: 18,
            rocket: 30
        };
        particles.push({
            x: this.x + Math.cos(this.angle) * 25,
            y: this.y + Math.sin(this.angle) * 25,
            size: flashSizes[this.weaponName] || 15,
            life: 50,
            maxLife: 50,
            color: flashColors[this.weaponName] || COLORS.muzzleFlash,
            type: 'flash'
        });

        // Sound attracts enemies
        alertEnemiesInRange(this.x, this.y, 400);
    }

    startReload() {
        if (this.reloading) return;
        const weapon = this.weapon;
        if (weapon.infinite) {
            // Pistol has infinite ammo
            this.reloading = true;
            this.reloadTimer = weapon.reloadTime * (1 - this.reloadSpeedBonus);
            return;
        }
        if (this.ammo[weapon.ammoType] <= 0) return;
        if (this.currentMag >= weapon.magSize) return;

        this.reloading = true;
        this.reloadTimer = weapon.reloadTime * (1 - this.reloadSpeedBonus);
    }

    finishReload() {
        this.reloading = false;
        const weapon = this.weapon;

        if (weapon.infinite) {
            this.currentMag = weapon.magSize;
            return;
        }

        const needed = weapon.magSize - this.currentMag;
        const available = this.ammo[weapon.ammoType];
        const toLoad = Math.min(needed, available);

        this.currentMag += toLoad;
        this.ammo[weapon.ammoType] -= toLoad;

        showFloatingText(this.x, this.y - 20, 'RELOADED', '#88FF88');
    }

    switchWeapon(direction) {
        this.currentWeapon = (this.currentWeapon + direction + this.weapons.length) % this.weapons.length;
        this.reloading = false;
        this.reloadTimer = 0;
        this.fireTimer = 200; // Small delay on switch

        // Set mag to current weapon's stored ammo
        const weapon = this.weapon;
        this.currentMag = Math.min(this.currentMag, weapon.magSize);
    }

    takeDamage(amount) {
        if (this.godMode) return;
        if (this.invulnTimer > 0) return;

        // Shield first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }

        this.hp -= amount;
        this.invulnTimer = 500; // 0.5s invuln
        stats.damageTaken += amount; // Track damage for stats

        addScreenShake(5, 100);
        damageFlash = 200; // Red flash for 200ms

        // Blood particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 4 + Math.random() * 4,
                life: 500,
                maxLife: 500,
                color: '#CC0000',
                type: 'blood'
            });
        }

        if (this.hp <= 0) {
            this.hp = 0;
            gameState = 'gameover';
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        showFloatingText(this.x, this.y - 20, `+${amount} HP`, COLORS.health);
    }

    giveShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
        showFloatingText(this.x, this.y - 20, `+${amount} Shield`, COLORS.shield);
    }

    useMedkit() {
        if (this.medkits <= 0) return;
        if (this.hp >= this.maxHp) return;

        this.medkits--;
        this.heal(50);
    }

    melee() {
        // Fallback melee attack when no ammo
        const meleeRange = 50;
        const meleeDamage = 10;

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < meleeRange + enemy.size / 2) {
                enemy.takeDamage(meleeDamage, this.angle);
                addScreenShake(3, 50);
                // Note: takeDamage already shows damage number
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Flash when invulnerable
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = '#4488FF';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Direction indicator (gun) with recoil offset
        ctx.fillStyle = '#666666';
        const recoilOffset = -this.recoil; // Gun kicks back
        ctx.fillRect(this.width / 4 + recoilOffset, -4, this.width / 2, 8);

        ctx.restore();
    }
}

// ============================================================================
// ENEMY CLASS
// ============================================================================
class Enemy {
    constructor(type, x, y) {
        const data = ENEMY_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = Math.random() * Math.PI * 2;

        const diffMod = DIFFICULTY_MODIFIERS[difficulty];
        // Enemies get stronger in later decks
        const deckMult = 1 + (currentDeck - 1) * 0.15; // +15% per deck
        this.hp = data.hp * diffMod.enemyHealthMult * deckMult;
        this.maxHp = this.hp;
        this.damage = data.damage * diffMod.playerDamageMult * deckMult;
        this.speed = data.speed;
        this.size = data.size;
        this.color = data.color;
        this.detectionRange = data.detectionRange;
        this.attackCooldown = data.attackCooldown || 1000;
        this.attackTimer = 0;
        this.credits = data.credits;
        this.behavior = data.behavior;
        this.hitFlash = 0; // Timer for white flash on hit
        this.spawnTimer = 300; // Spawn animation (grow in over 300ms)

        // Behavior-specific
        this.alerted = false;
        this.charging = false;
        this.chargeTimer = 0;
        this.stunned = false;
        this.stunTimer = 0;
        this.spawns = [];
        this.spawnCount = 0;

        // For spitter
        this.projectileSpeed = data.projectileSpeed || 0;
        this.preferredDist = data.preferredDist || 0;

        // For brute
        this.chargeSpeed = data.chargeSpeed || 0;
        this.chargeTrigger = data.chargeTrigger || 0;

        // For exploder
        this.explosionRadius = data.explosionRadius || 0;

        // For spawner
        this.maxSpawns = data.maxSpawns || 0;

        this.id = `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    update(dt) {
        // Update hit flash timer
        if (this.hitFlash > 0) {
            this.hitFlash -= dt * 1000;
        }

        // Update spawn timer
        if (this.spawnTimer > 0) {
            this.spawnTimer -= dt * 1000;
            return; // Don't move or attack while spawning
        }

        if (this.stunned) {
            this.stunTimer -= dt * 1000;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            return;
        }

        this.attackTimer -= dt * 1000;

        // Check if can see player (LOS)
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hasLOS = this.checkLineOfSight();

        // Update angle to face player if alerted
        if (this.alerted && hasLOS) {
            this.angle = Math.atan2(dy, dx);
        }

        // Behavior
        switch (this.behavior) {
            case 'rush':
                this.behaviorRush(dt, dist, hasLOS);
                break;
            case 'ranged':
                this.behaviorRanged(dt, dist, hasLOS);
                break;
            case 'ambush':
                this.behaviorAmbush(dt, dist, hasLOS);
                break;
            case 'charge':
                this.behaviorCharge(dt, dist, hasLOS);
                break;
            case 'suicide':
                this.behaviorSuicide(dt, dist, hasLOS);
                break;
            case 'spawner':
                this.behaviorSpawner(dt, dist, hasLOS);
                break;
        }

        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wall collision (slide along walls)
        this.resolveWallCollision();

        // Player collision damage
        this.checkPlayerCollision();
    }

    checkLineOfSight() {
        // Cast ray from enemy to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / 10);

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const px = this.x + dx * t;
            const py = this.y + dy * t;

            for (const wall of walls) {
                if (px > wall.x && px < wall.x + wall.w &&
                    py > wall.y && py < wall.y + wall.h) {
                    return false;
                }
            }
        }
        return true;
    }

    behaviorRush(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange && hasLOS) {
                this.alerted = true;
            }
            return;
        }

        // Move toward player
        if (hasLOS) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
    }

    behaviorRanged(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange && hasLOS) {
                this.alerted = true;
            }
            return;
        }

        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Maintain preferred distance
        if (dist < 150) {
            // Too close, retreat
            this.vx = -Math.cos(angle) * this.speed;
            this.vy = -Math.sin(angle) * this.speed;
        } else if (dist > this.preferredDist + 50) {
            // Too far, approach
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Shoot if in range and cooled down
        if (hasLOS && dist < this.detectionRange && this.attackTimer <= 0) {
            this.shootAtPlayer();
            this.attackTimer = this.attackCooldown;
        }
    }

    behaviorAmbush(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange) {
                this.alerted = true;
                // Lunge!
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angle) * 300;
                this.vy = Math.sin(angle) * 300;
            }
            return;
        }

        // After lunge, behave like rush
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    behaviorCharge(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange && hasLOS) {
                this.alerted = true;
            }
            return;
        }

        if (this.charging) {
            this.chargeTimer -= dt * 1000;
            if (this.chargeTimer <= 0) {
                this.charging = false;
                this.stunned = true;
                this.stunTimer = 1000;
                this.vx = 0;
                this.vy = 0;
            }
            return;
        }

        // Start charge if close enough
        if (dist < this.chargeTrigger && hasLOS && !this.stunned) {
            this.charging = true;
            this.chargeTimer = 1500;
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = Math.cos(angle) * this.chargeSpeed;
            this.vy = Math.sin(angle) * this.chargeSpeed;
        } else {
            // Slowly approach
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
    }

    behaviorSuicide(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange && hasLOS) {
                this.alerted = true;
            }
            return;
        }

        // Rush toward player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // Explode on contact
        if (dist < this.size + player.hitboxSize / 2) {
            this.explode();
        }
    }

    behaviorSpawner(dt, dist, hasLOS) {
        if (!this.alerted) {
            if (dist < this.detectionRange && hasLOS) {
                this.alerted = true;
            }
            return;
        }

        // Count active spawns
        this.spawns = this.spawns.filter(s => enemies.includes(s));

        // Flee if low HP
        if (this.hp < this.maxHp * 0.3) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = -Math.cos(angle) * this.speed;
            this.vy = -Math.sin(angle) * this.speed;
        } else {
            // Move toward player but keep distance
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            if (dist > 200) {
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            } else {
                this.vx = 0;
                this.vy = 0;
            }
        }

        // Spawn drones
        if (this.attackTimer <= 0 && this.spawns.length < this.maxSpawns) {
            const spawnAngle = Math.random() * Math.PI * 2;
            const drone = new Enemy('drone',
                this.x + Math.cos(spawnAngle) * 40,
                this.y + Math.sin(spawnAngle) * 40
            );
            drone.alerted = true;
            enemies.push(drone);
            this.spawns.push(drone);
            this.attackTimer = this.attackCooldown;
        }
    }

    shootAtPlayer() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        projectiles.push({
            x: this.x + Math.cos(angle) * this.size,
            y: this.y + Math.sin(angle) * this.size,
            vx: Math.cos(angle) * this.projectileSpeed,
            vy: Math.sin(angle) * this.projectileSpeed,
            damage: this.damage,
            range: this.detectionRange,
            traveled: 0,
            isPlayer: false,
            color: '#88FF00' // Acid green
        });
    }

    explode() {
        // Damage player and other enemies
        const radius = this.explosionRadius;

        // Player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
            player.takeDamage(this.damage);
        }

        // Other enemies
        for (const enemy of enemies) {
            if (enemy === this) continue;
            const edx = enemy.x - this.x;
            const edy = enemy.y - this.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            if (edist < radius) {
                enemy.takeDamage(this.damage * 0.5, this.angle);
            }
        }

        // Explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                size: 5 + Math.random() * 10,
                life: 300,
                maxLife: 300,
                color: '#FF8800',
                type: 'explosion'
            });
        }

        addScreenShake(10, 200);

        // Remove self
        this.hp = 0;
    }

    resolveWallCollision() {
        const halfSize = this.size / 2;

        for (const wall of walls) {
            if (this.x + halfSize > wall.x &&
                this.x - halfSize < wall.x + wall.w &&
                this.y + halfSize > wall.y &&
                this.y - halfSize < wall.y + wall.h) {

                // Slide along walls
                const overlapLeft = (this.x + halfSize) - wall.x;
                const overlapRight = (wall.x + wall.w) - (this.x - halfSize);
                const overlapTop = (this.y + halfSize) - wall.y;
                const overlapBottom = (wall.y + wall.h) - (this.y - halfSize);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    if (overlapLeft < overlapRight) {
                        this.x = wall.x - halfSize;
                    } else {
                        this.x = wall.x + wall.w + halfSize;
                    }
                    // Keep Y velocity for sliding
                } else {
                    if (overlapTop < overlapBottom) {
                        this.y = wall.y - halfSize;
                    } else {
                        this.y = wall.y + wall.h + halfSize;
                    }
                    // Keep X velocity for sliding
                }
            }
        }
    }

    checkPlayerCollision() {
        if (this.attackTimer > 0 && this.behavior !== 'suicide' && this.behavior !== 'charge') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.size / 2 + player.hitboxSize / 2) {
            player.takeDamage(this.damage);
            this.attackTimer = this.attackCooldown;

            // Knockback enemy
            if (!this.charging) {
                const angle = Math.atan2(this.y - player.y, this.x - player.x);
                this.x += Math.cos(angle) * 20;
                this.y += Math.sin(angle) * 20;
            }
        }
    }

    takeDamage(amount, fromAngle) {
        this.hp -= amount;
        this.alerted = true;
        this.hitFlash = 100; // White flash for 100ms
        stats.damageDealt += amount; // Track damage for stats

        // Knockback (unless immune)
        if (this.behavior !== 'charge' || !this.charging) {
            const knockback = Math.min(150, amount * 2);
            this.x += Math.cos(fromAngle) * knockback * 0.1;
            this.y += Math.sin(fromAngle) * knockback * 0.1;
        }

        // Damage number (with better visibility)
        showFloatingText(this.x, this.y - this.size, `${Math.round(amount)}`, '#FFFF00', true);

        // Blood splatter decal on floor
        spawnBloodDecal(this.x, this.y, this.color);

        // Blood particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                size: 3 + Math.random() * 3,
                life: 400,
                maxLife: 400,
                color: COLORS.alienBlood,
                type: 'blood'
            });
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Death particle burst
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * (100 + Math.random() * 100),
                vy: Math.sin(angle) * (100 + Math.random() * 100),
                size: 4 + Math.random() * 6,
                life: 400,
                maxLife: 400,
                color: this.color,
                type: 'death'
            });
        }

        // Exploder explodes on death
        if (this.behavior === 'suicide') {
            this.explode();
        }

        // Kill spawned children
        if (this.behavior === 'spawner') {
            for (const spawn of this.spawns) {
                if (spawn.hp > 0) {
                    spawn.hp = 0;
                }
            }
        }

        // Drop loot
        this.dropLoot();

        // Remove from array
        const idx = enemies.indexOf(this);
        if (idx !== -1) {
            enemies.splice(idx, 1);
        }

        // Update stats
        stats.kills++;

        // Log event
        if (window.testHarness) {
            window.testHarness.logEvent('enemy_killed', {
                enemyType: this.type,
                id: this.id
            });
        }
    }

    dropLoot() {
        // Credits
        pickups.push({
            x: this.x,
            y: this.y,
            type: 'credits',
            value: this.credits
        });

        // Random ammo drop (30% chance) - weighted by player's weapons
        if (Math.random() < 0.3) {
            // Build weighted ammo pool based on player's weapons
            const ammoPool = [];
            for (const weaponName of player.weapons) {
                const weapon = WEAPONS[weaponName];
                if (weapon && weapon.ammoType && !weapon.infinite) {
                    // Add ammo type with weight based on how low player is
                    const current = player.ammo[weapon.ammoType];
                    const max = MAX_AMMO[weapon.ammoType];
                    const needWeight = Math.max(1, Math.floor(10 * (1 - current / max)));
                    for (let w = 0; w < needWeight; w++) {
                        ammoPool.push(weapon.ammoType);
                    }
                }
            }
            // Fallback to basic ammo if pool empty
            if (ammoPool.length === 0) {
                ammoPool.push('9mm', 'shells', 'rifle');
            }
            const type = ammoPool[Math.floor(Math.random() * ammoPool.length)];
            const value = type === 'shells' ? 4 : (type === 'rockets' ? 1 : 15);
            pickups.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                type: 'ammo',
                ammoType: type,
                value: value
            });
        }

        // Health drop (20% chance)
        if (Math.random() < 0.2) {
            pickups.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                type: 'health',
                value: this.behavior === 'charge' ? 25 : 10
            });
        }
    }

    draw(ctx) {
        // Only draw if visible (in vision polygon)
        if (!isPointInVision(this.x, this.y)) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Spawn animation (scale up from 0)
        if (this.spawnTimer > 0) {
            const scale = 1 - (this.spawnTimer / 300);
            ctx.scale(scale, scale);
            ctx.globalAlpha = scale;
        }

        ctx.rotate(this.angle);

        // Glow for exploder
        if (this.behavior === 'suicide') {
            const glow = Math.sin(gameTime / 100) * 0.3 + 0.7;
            ctx.shadowColor = '#FF8800';
            ctx.shadowBlur = 20 * glow;
        }

        // Body - flash white when hit
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced direction indicator (pointed "snout" shape)
        ctx.fillStyle = this.hitFlash > 0 ? '#888888' : '#000000';
        ctx.beginPath();
        ctx.moveTo(this.size / 4, -4);
        ctx.lineTo(this.size / 2 + 4, 0); // Pointed tip
        ctx.lineTo(this.size / 4, 4);
        ctx.closePath();
        ctx.fill();

        // Eyes (only for larger enemies)
        if (this.size >= 28 && !this.hitFlash) {
            ctx.fillStyle = this.alerted ? '#FF0000' : '#880000'; // Red when alerted
            ctx.beginPath();
            ctx.arc(this.size / 8, -3, 2, 0, Math.PI * 2);
            ctx.arc(this.size / 8, 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar for damaged enemies
        if (this.hp < this.maxHp) {
            const barWidth = this.size;
            const barHeight = 4;
            const x = this.x - barWidth / 2;
            const y = this.y - this.size / 2 - 10;

            ctx.fillStyle = '#333333';
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.fillStyle = COLORS.health;
            ctx.fillRect(x, y, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }
}

// ============================================================================
// LEVEL GENERATION
// ============================================================================
function generateLevel(deck) {
    walls = [];
    doors = [];
    enemies = [];
    pickups = [];
    rooms = [];
    decals = []; // Clear blood splatters

    // Level size based on deck
    const levelWidth = 20 + deck * 5;
    const levelHeight = 15 + deck * 3;

    // Generate room layout
    const roomGrid = [];
    const roomWidth = 10;
    const roomHeight = 8;
    const gridCols = Math.floor(levelWidth / roomWidth);
    const gridRows = Math.floor(levelHeight / roomHeight);

    // Create rooms
    for (let gy = 0; gy < gridRows; gy++) {
        roomGrid[gy] = [];
        for (let gx = 0; gx < gridCols; gx++) {
            const room = {
                gx, gy,
                x: gx * roomWidth * TILE_SIZE,
                y: gy * roomHeight * TILE_SIZE,
                width: roomWidth * TILE_SIZE,
                height: roomHeight * TILE_SIZE,
                type: 'normal',
                cleared: false,
                enemies: [],
                keycardRequired: null
            };
            roomGrid[gy][gx] = room;
            rooms.push(room);
        }
    }

    // Set start room (empty)
    const startRoom = roomGrid[0][0];
    startRoom.type = 'start';
    startRoom.cleared = true;

    // Set keycard rooms - improved placement for better pacing
    if (gridCols > 1) {
        // Place keycard in a room that requires some exploration
        // Not too close to start, but reachable without the keycard
        let keycardGx = Math.min(gridCols - 2, 1 + Math.floor(Math.random() * (gridCols > 2 ? 1 : 1)));
        let keycardGy = Math.floor(Math.random() * gridRows);
        // Ensure it's not start room
        if (keycardGx === 0 && keycardGy === 0) {
            keycardGx = 1;
        }
        const keycardRoom = roomGrid[keycardGy][keycardGx];
        keycardRoom.type = 'keycard';
        keycardRoom.keycard = 'green';
    }

    // Set locked sections (everything beyond column 1 requires keycard)
    if (gridCols > 2) {
        for (let gx = 2; gx < gridCols; gx++) {
            for (let gy = 0; gy < gridRows; gy++) {
                roomGrid[gy][gx].keycardRequired = 'green';
            }
        }
    }

    // Exit room
    const exitRoom = roomGrid[gridRows - 1][gridCols - 1];
    exitRoom.type = 'exit';

    // Generate walls
    for (const room of rooms) {
        // Room walls
        const x = room.x;
        const y = room.y;
        const w = room.width;
        const h = room.height;

        // Top wall
        walls.push({ x, y, w, h: TILE_SIZE });
        // Bottom wall
        walls.push({ x, y: y + h - TILE_SIZE, w, h: TILE_SIZE });
        // Left wall
        walls.push({ x, y: y + TILE_SIZE, w: TILE_SIZE, h: h - TILE_SIZE * 2 });
        // Right wall
        walls.push({ x: x + w - TILE_SIZE, y: y + TILE_SIZE, w: TILE_SIZE, h: h - TILE_SIZE * 2 });

        // Add obstacles
        if (room.type !== 'start') {
            const numObstacles = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numObstacles; i++) {
                const ox = x + TILE_SIZE * 2 + Math.random() * (w - TILE_SIZE * 4);
                const oy = y + TILE_SIZE * 2 + Math.random() * (h - TILE_SIZE * 4);
                if (Math.random() < 0.3) {
                    // Crate/pillar (wall)
                    walls.push({
                        x: ox,
                        y: oy,
                        w: TILE_SIZE,
                        h: TILE_SIZE,
                        destructible: true,
                        hp: 20
                    });
                } else if (Math.random() < 0.6) {
                    // Crate (drops loot)
                    const lootRoll = Math.random();
                    let lootType, specificAmmo;
                    if (lootRoll < 0.3) {
                        lootType = 'ammo';
                    } else if (lootRoll < 0.45) {
                        // Specific ammo crate
                        lootType = 'specificAmmo';
                        const ammoTypes = ['9mm', 'shells', 'rifle'];
                        if (deck >= 2) ammoTypes.push('plasma');
                        if (deck >= 3) ammoTypes.push('fuel', 'rockets');
                        specificAmmo = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    } else if (lootRoll < 0.6) {
                        lootType = 'health';
                    } else if (lootRoll < 0.75) {
                        lootType = 'shield';
                    } else {
                        lootType = 'credits';
                    }
                    pickups.push({
                        x: ox + TILE_SIZE / 2,
                        y: oy + TILE_SIZE / 2,
                        type: 'crate',
                        hp: 15,
                        lootType: lootType,
                        specificAmmo: specificAmmo
                    });
                } else {
                    // Barrel (explosive)
                    pickups.push({
                        x: ox + TILE_SIZE / 2,
                        y: oy + TILE_SIZE / 2,
                        type: 'barrel',
                        explosive: true,
                        hp: 10
                    });
                }
            }
        }

        // Add enemies to non-start rooms (varied by room type)
        if (room.type !== 'start') {
            // Room type affects enemy count
            let baseEnemies = 2;
            let randomEnemies = 4;
            if (room.type === 'keycard') {
                baseEnemies = 4; // More enemies guarding keycards
                randomEnemies = 3;
            } else if (room.type === 'exit') {
                baseEnemies = 5; // Most enemies at exit
                randomEnemies = 4;
            } else if (room.gx === 0 && room.gy === 0) {
                // Rooms near start have fewer enemies
                baseEnemies = 1;
                randomEnemies = 2;
            }
            const numEnemies = baseEnemies + Math.floor(Math.random() * randomEnemies) + Math.floor(deck * 0.5);
            const enemyPool = getEnemyPoolForDeck(deck);

            for (let i = 0; i < numEnemies; i++) {
                const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                const ex = x + TILE_SIZE * 2 + Math.random() * (w - TILE_SIZE * 4);
                const ey = y + TILE_SIZE * 2 + Math.random() * (h - TILE_SIZE * 4);
                room.enemies.push({ type, x: ex, y: ey });
            }
        }

        // Add keycard pickup
        if (room.type === 'keycard') {
            pickups.push({
                x: x + w / 2,
                y: y + h / 2,
                type: 'keycard',
                keycard: room.keycard
            });
        }

        // Random weapon pickup (10% chance per room, not in start room)
        if (room.type !== 'start' && Math.random() < 0.1) {
            const weaponTypes = ['shotgun', 'smg', 'assault'];
            // Add better weapons in later decks
            if (deck >= 2) weaponTypes.push('plasma');
            if (deck >= 3) weaponTypes.push('flamethrower', 'rocket');
            const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
            pickups.push({
                x: x + TILE_SIZE * 2 + Math.random() * (w - TILE_SIZE * 4),
                y: y + TILE_SIZE * 2 + Math.random() * (h - TILE_SIZE * 4),
                type: 'weapon',
                weapon: weaponType
            });
        }
    }

    // Create doors between rooms
    for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
            const room = roomGrid[gy][gx];

            // Door to right
            if (gx < gridCols - 1) {
                const nextRoom = roomGrid[gy][gx + 1];
                const doorX = room.x + room.width - TILE_SIZE;
                const doorY = room.y + room.height / 2 - TILE_SIZE;

                doors.push({
                    x: doorX,
                    y: doorY,
                    w: TILE_SIZE * 2,
                    h: TILE_SIZE * 2,
                    direction: 'horizontal',
                    open: false,
                    keycardRequired: nextRoom.keycardRequired,
                    room1: room,
                    room2: nextRoom
                });
            }

            // Door to bottom
            if (gy < gridRows - 1) {
                const nextRoom = roomGrid[gy + 1][gx];
                const doorX = room.x + room.width / 2 - TILE_SIZE;
                const doorY = room.y + room.height - TILE_SIZE;

                doors.push({
                    x: doorX,
                    y: doorY,
                    w: TILE_SIZE * 2,
                    h: TILE_SIZE * 2,
                    direction: 'vertical',
                    open: false,
                    keycardRequired: nextRoom.keycardRequired,
                    room1: room,
                    room2: nextRoom
                });
            }
        }
    }

    // Remove wall segments where doors are
    for (const door of doors) {
        walls = walls.filter(wall => {
            return !(wall.x < door.x + door.w &&
                    wall.x + wall.w > door.x &&
                    wall.y < door.y + door.h &&
                    wall.y + wall.h > door.y);
        });
    }

    // Spawn player
    player = new Player(
        startRoom.x + startRoom.width / 2,
        startRoom.y + startRoom.height / 2
    );

    // Set current room
    currentRoom = startRoom;
}

function getEnemyPoolForDeck(deck) {
    switch (deck) {
        case 1:
            return ['drone', 'drone', 'drone', 'spitter'];
        case 2:
            return ['drone', 'spitter', 'lurker', 'brute'];
        case 3:
            return ['drone', 'spitter', 'lurker', 'brute', 'exploder', 'matriarch'];
        case 4:
            return ['drone', 'spitter', 'lurker', 'brute', 'exploder', 'matriarch', 'eliteDrone'];
        default:
            return ['drone'];
    }
}

function enterRoom(room) {
    if (room === currentRoom) return;

    lastRoom = currentRoom;
    currentRoom = room;

    // Smooth camera transition - speed up camera temporarily
    camera.transitionSpeed = 0.25; // Faster transition when entering new room

    // Spawn enemies if not cleared
    if (!room.cleared && room.enemies.length > 0) {
        for (const e of room.enemies) {
            enemies.push(new Enemy(e.type, e.x, e.y));
        }
        room.enemies = [];

        // Close doors
        for (const door of doors) {
            if (door.room1 === room || door.room2 === room) {
                door.open = false;
            }
        }
    }

    // Log event
    if (window.testHarness) {
        window.testHarness.logEvent('room_entered', { roomType: room.type });
    }
}

function checkRoomCleared() {
    if (!currentRoom || currentRoom.cleared) return;

    // Check if all enemies in current room are dead
    const roomEnemies = enemies.filter(e =>
        e.x >= currentRoom.x && e.x < currentRoom.x + currentRoom.width &&
        e.y >= currentRoom.y && e.y < currentRoom.y + currentRoom.height
    );

    if (roomEnemies.length === 0) {
        currentRoom.cleared = true;

        // Open doors
        for (const door of doors) {
            if (door.room1 === currentRoom || door.room2 === currentRoom) {
                // Check keycard requirement
                if (!door.keycardRequired || player.keycards[door.keycardRequired]) {
                    door.open = true;
                }
            }
        }

        showFloatingText(player.x, player.y - 50, 'ROOM CLEARED!', '#88FF88');

        // Log event
        if (window.testHarness) {
            window.testHarness.logEvent('room_cleared', {});
        }
    }
}

// ============================================================================
// VISION SYSTEM (RAYCASTING)
// ============================================================================
function updateVision() {
    visibilityPolygon = [];

    if (!player) return;

    // Cast rays in all directions
    for (let i = 0; i < VISION_RAYS; i++) {
        const angle = (i / VISION_RAYS) * Math.PI * 2;
        const ray = castRay(player.x, player.y, angle, VISION_RANGE);
        visibilityPolygon.push(ray);
    }
}

function castRay(startX, startY, angle, maxDist) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let closestDist = maxDist;

    // Check against all walls
    for (const wall of walls) {
        const dist = rayVsRect(startX, startY, dx, dy, wall);
        if (dist !== null && dist < closestDist) {
            closestDist = dist;
        }
    }

    // Check against closed doors
    for (const door of doors) {
        if (!door.open) {
            const dist = rayVsRect(startX, startY, dx, dy, door);
            if (dist !== null && dist < closestDist) {
                closestDist = dist;
            }
        }
    }

    return {
        x: startX + dx * closestDist,
        y: startY + dy * closestDist,
        dist: closestDist
    };
}

function rayVsRect(rx, ry, dx, dy, rect) {
    // Ray-AABB intersection
    // Handle edge case: point inside rect
    if (rx > rect.x && rx < rect.x + rect.w &&
        ry > rect.y && ry < rect.y + rect.h) {
        return 0; // Already inside, return zero distance
    }

    let tmin = -Infinity;
    let tmax = Infinity;

    // Handle very small dx/dy values to avoid numerical instability
    const epsilon = 0.0001;
    const effectiveDx = Math.abs(dx) < epsilon ? (dx < 0 ? -epsilon : epsilon) : dx;
    const effectiveDy = Math.abs(dy) < epsilon ? (dy < 0 ? -epsilon : epsilon) : dy;

    if (Math.abs(dx) > epsilon) {
        let t1 = (rect.x - rx) / effectiveDx;
        let t2 = (rect.x + rect.w - rx) / effectiveDx;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
    } else if (rx < rect.x || rx > rect.x + rect.w) {
        return null;
    }

    if (Math.abs(dy) > epsilon) {
        let t1 = (rect.y - ry) / effectiveDy;
        let t2 = (rect.y + rect.h - ry) / effectiveDy;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
    } else if (ry < rect.y || ry > rect.y + rect.h) {
        return null;
    }

    if (tmax < tmin || tmax < 0) {
        return null;
    }

    // Ensure positive distance
    const result = tmin > 0 ? tmin : tmax;
    return result > 0 ? result : null;
}

function isPointInVision(px, py) {
    if (visibilityPolygon.length === 0) return true;

    const dx = px - player.x;
    const dy = py - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > VISION_RANGE) return false;

    // Find the ray closest to this angle
    const angle = Math.atan2(dy, dx);
    let normalizedAngle = angle;
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    const rayIndex = Math.floor((normalizedAngle / (Math.PI * 2)) * VISION_RAYS);
    const ray = visibilityPolygon[rayIndex % VISION_RAYS];

    return dist <= ray.dist + 20; // Small buffer
}

// ============================================================================
// RENDERING
// ============================================================================
function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'title') {
        renderTitle();
        return;
    }

    if (gameState === 'gameover') {
        renderGameOver();
        return;
    }

    if (gameState === 'victory') {
        renderVictory();
        return;
    }

    // Camera follow
    updateCamera();

    ctx.save();

    // Apply camera shake
    const shakeX = Math.cos(camera.shakeAngle) * camera.shake;
    const shakeY = Math.sin(camera.shakeAngle) * camera.shake;
    ctx.translate(-camera.x + shakeX + CANVAS_WIDTH / 2, -camera.y + shakeY + CANVAS_HEIGHT / 2);

    // Draw floor
    renderFloor();

    // Draw blood decals on floor
    renderDecals();

    // Draw walls
    renderWalls();

    // Draw doors
    renderDoors();

    // Draw pickups (only in vision)
    renderPickups();

    // Draw enemies
    for (const enemy of enemies) {
        enemy.draw(ctx);
    }

    // Draw projectiles
    renderProjectiles();

    // Draw player
    if (player) {
        player.draw(ctx);
    }

    // Draw particles
    renderParticles();

    // Draw floating texts
    renderFloatingTexts();

    // Draw vision mask (darkness)
    renderVisionMask();

    ctx.restore();

    // Draw HUD
    renderHUD();

    // Damage flash overlay (red edge pulse)
    if (damageFlash > 0) {
        const alpha = (damageFlash / 200) * 0.4;
        const gradient = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Shop overlay
    if (gameState === 'shop') {
        renderShop();
    }

    // Pause overlay
    if (gameState === 'paused') {
        renderPause();
    }
}

function updateCamera() {
    if (!player) return;

    const targetX = player.x;
    const targetY = player.y;

    // Use transition speed for smooth room transitions
    camera.x += (targetX - camera.x) * camera.transitionSpeed;
    camera.y += (targetY - camera.y) * camera.transitionSpeed;

    // Clamp small differences to prevent micro-jitter
    if (Math.abs(camera.x - targetX) < 0.5) camera.x = targetX;
    if (Math.abs(camera.y - targetY) < 0.5) camera.y = targetY;

    // Decay transition speed back to normal
    if (camera.transitionSpeed > 0.1) {
        camera.transitionSpeed -= 0.005;
        if (camera.transitionSpeed < 0.1) camera.transitionSpeed = 0.1;
    }

    // Decay shake
    camera.shake *= 0.9;
    if (camera.shake < 0.1) camera.shake = 0;
}

function renderFloor() {
    ctx.fillStyle = COLORS.floor;

    for (const room of rooms) {
        ctx.fillRect(room.x, room.y, room.width, room.height);
    }
}

function renderDecals() {
    for (const decal of decals) {
        ctx.globalAlpha = decal.alpha;
        ctx.fillStyle = decal.color;
        ctx.beginPath();
        ctx.arc(decal.x, decal.y, decal.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function renderWalls() {
    for (const wall of walls) {
        if (wall.destructible) {
            ctx.fillStyle = '#665544';
        } else {
            ctx.fillStyle = COLORS.wall;
        }
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Wall edge highlight
        ctx.fillStyle = '#5A5A5A';
        ctx.fillRect(wall.x, wall.y, wall.w, 2);
        ctx.fillRect(wall.x, wall.y, 2, wall.h);
    }
}

function renderDoors() {
    for (const door of doors) {
        // Calculate draw dimensions based on open progress
        const progress = door.openProgress || 0;
        const centerX = door.x + door.w / 2;
        const centerY = door.y + door.h / 2;

        // Shrink door as it opens
        const scaleX = door.w > door.h ? (1 - progress) : 1;
        const scaleY = door.h > door.w ? (1 - progress) : 1;
        const drawW = door.w * scaleX;
        const drawH = door.h * scaleY;
        const drawX = centerX - drawW / 2;
        const drawY = centerY - drawH / 2;

        if (door.open && progress >= 1) {
            ctx.fillStyle = '#1A1A1A';
        } else if (door.keycardRequired) {
            ctx.fillStyle = COLORS['key' + door.keycardRequired.charAt(0).toUpperCase() + door.keycardRequired.slice(1)];
        } else {
            ctx.fillStyle = COLORS.doorNormal;
        }

        ctx.fillRect(drawX, drawY, drawW, drawH);

        // Door frame
        if (!door.open || progress < 1) {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, drawW, drawH);
        }
    }
}

function renderPickups() {
    for (const pickup of pickups) {
        if (!isPointInVision(pickup.x, pickup.y)) continue;

        ctx.save();
        ctx.translate(pickup.x, pickup.y);

        // Bobbing animation
        const bob = Math.sin(gameTime / 200 + pickup.x) * 3;
        ctx.translate(0, bob);

        // Pulsing glow effect
        const glowIntensity = (Math.sin(gameTime / 300 + pickup.x * 0.1) + 1) * 0.5;
        let glowColor = '#FFFFFF';
        switch (pickup.type) {
            case 'health': glowColor = COLORS.health; break;
            case 'shield': glowColor = COLORS.shield; break;
            case 'credits': glowColor = COLORS.credits; break;
            case 'keycard': glowColor = COLORS['key' + (pickup.keycard || 'green').charAt(0).toUpperCase() + (pickup.keycard || 'green').slice(1)]; break;
            case 'ammo': glowColor = '#FFAA00'; break;
            case 'weapon': glowColor = '#4488FF'; break;
        }
        if (pickup.type !== 'barrel') {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10 + glowIntensity * 10;
        }

        switch (pickup.type) {
            case 'health':
                ctx.fillStyle = COLORS.health;
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-2, -6, 4, 12);
                ctx.fillRect(-6, -2, 12, 4);
                break;
            case 'shield':
                ctx.fillStyle = COLORS.shield;
                ctx.fillRect(-10, -8, 20, 16);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('S', 0, 5);
                break;
            case 'credits':
                ctx.fillStyle = COLORS.credits;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#886600';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('$', 0, 4);
                break;
            case 'ammo':
                ctx.fillStyle = '#888888';
                ctx.fillRect(-6, -10, 12, 20);
                ctx.fillStyle = '#FFAA00';
                ctx.fillRect(-4, -8, 8, 16);
                break;
            case 'keycard':
                const keyColor = COLORS['key' + pickup.keycard.charAt(0).toUpperCase() + pickup.keycard.slice(1)];
                ctx.fillStyle = keyColor;
                ctx.fillRect(-12, -8, 24, 16);
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(6, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'barrel':
                ctx.fillStyle = '#884422';
                ctx.fillRect(-12, -16, 24, 32);
                ctx.fillStyle = '#FF8800';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, 6);
                break;
            case 'crate':
                ctx.fillStyle = '#664422';
                ctx.fillRect(-14, -14, 28, 28);
                ctx.strokeStyle = '#443311';
                ctx.lineWidth = 2;
                ctx.strokeRect(-14, -14, 28, 28);
                // Cross pattern
                ctx.beginPath();
                ctx.moveTo(-14, 0);
                ctx.lineTo(14, 0);
                ctx.moveTo(0, -14);
                ctx.lineTo(0, 14);
                ctx.stroke();
                break;
            case 'weapon':
                ctx.fillStyle = '#666666';
                ctx.fillRect(-15, -5, 30, 10);
                break;
        }

        ctx.restore();
    }

    // Render pickup prompts for nearby items
    renderPickupPrompts();
}

function renderPickupPrompts() {
    if (!player) return;

    const PROMPT_RANGE = 60;
    for (const pickup of pickups) {
        // Skip crates and barrels - they don't show prompts
        if (pickup.type === 'crate' || pickup.type === 'barrel') continue;
        if (!isPointInVision(pickup.x, pickup.y)) continue;

        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PROMPT_RANGE) {
            // Build prompt text based on pickup type
            let promptText = '';
            let color = '#FFFFFF';

            switch (pickup.type) {
                case 'health':
                    promptText = `+${pickup.value} HP`;
                    color = COLORS.health;
                    break;
                case 'shield':
                    promptText = `+${pickup.value} Shield`;
                    color = COLORS.shield;
                    break;
                case 'credits':
                    promptText = `+${pickup.value} CR`;
                    color = COLORS.credits;
                    break;
                case 'ammo':
                    promptText = `+${pickup.value} ${pickup.ammoType}`;
                    color = '#FFAA00';
                    break;
                case 'keycard':
                    promptText = `${pickup.keycard.toUpperCase()} KEYCARD`;
                    color = COLORS['key' + pickup.keycard.charAt(0).toUpperCase() + pickup.keycard.slice(1)];
                    break;
                case 'weapon':
                    promptText = `${(pickup.weapon || 'WEAPON').toUpperCase()}`;
                    color = '#4488FF';
                    break;
                case 'medkit':
                    promptText = '+MEDKIT';
                    color = COLORS.health;
                    break;
            }

            if (promptText) {
                // Draw prompt above pickup
                ctx.save();
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';

                // Background
                const textWidth = ctx.measureText(promptText).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(pickup.x - textWidth / 2 - 4, pickup.y - 35, textWidth + 8, 16);

                // Text
                ctx.fillStyle = color;
                ctx.fillText(promptText, pickup.x, pickup.y - 23);
                ctx.restore();
            }
        }
    }
}

function renderProjectiles() {
    for (const proj of projectiles) {
        if (proj.isFlame) {
            ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 100 + 100)}, 0, 0.8)`;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.explosive) {
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4400';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.isPlayer ? 4 : 6, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            const trailLength = 20;
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(proj.x - Math.cos(angle) * trailLength, proj.y - Math.sin(angle) * trailLength);
            ctx.stroke();
        }
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;

        if (p.type === 'flash') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - alpha), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

function renderFloatingTexts() {
    for (const ft of floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';

        // Damage numbers are larger and have outline for visibility
        if (ft.isDamage) {
            ctx.font = 'bold 18px Arial';
            // Draw outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
        } else {
            ctx.font = 'bold 14px Arial';
        }

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    }
}

function renderVisionMask() {
    if (visibilityPolygon.length === 0) return;

    // Create clipping path from visibility polygon
    ctx.save();

    // Draw darkness everywhere
    ctx.globalCompositeOperation = 'source-over';

    // First, draw the visible area
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.beginPath();
    ctx.moveTo(visibilityPolygon[0].x, visibilityPolygon[0].y);
    for (let i = 1; i < visibilityPolygon.length; i++) {
        ctx.lineTo(visibilityPolygon[i].x, visibilityPolygon[i].y);
    }
    ctx.closePath();

    // Now draw darkness around it
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(camera.x - CANVAS_WIDTH, camera.y - CANVAS_HEIGHT, CANVAS_WIDTH * 3, CANVAS_HEIGHT * 3);

    ctx.restore();

    // Flicker lighting effect - occasional darkness flicker
    const flickerChance = selfDestructActive ? 0.15 : 0.02; // More flicker during self-destruct
    if (Math.random() < flickerChance) {
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.random() * 0.2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(camera.x - CANVAS_WIDTH, camera.y - CANVAS_HEIGHT, CANVAS_WIDTH * 3, CANVAS_HEIGHT * 3);
        ctx.restore();
    }
}

function renderHUD() {
    if (!player) return;

    const padding = 10;

    // Health bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(padding, padding, 200, 20);
    ctx.fillStyle = COLORS.health;
    ctx.fillRect(padding, padding, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, 200, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, padding + 100, padding + 15);

    // Shield bar (if any)
    if (player.maxShield > 0) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(padding, padding + 25, 150, 15);
        ctx.fillStyle = COLORS.shield;
        ctx.fillRect(padding, padding + 25, 150 * (player.shield / player.maxShield), 15);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(padding, padding + 25, 150, 15);
    }

    // Stamina bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(padding, padding + 45, 150, 10);
    ctx.fillStyle = '#88FF88';
    ctx.fillRect(padding, padding + 45, 150 * (player.stamina / player.maxStamina), 10);

    // Weapon info
    const weapon = player.weapon;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, padding, CANVAS_HEIGHT - 60);

    // Ammo
    ctx.font = '14px Arial';
    const ammoReserve = weapon.infinite ? 'INF' : player.ammo[weapon.ammoType];
    ctx.fillText(`${player.currentMag}/${weapon.magSize} | ${ammoReserve}`, padding, CANVAS_HEIGHT - 40);

    // Reloading indicator
    if (player.reloading) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('RELOADING...', padding, CANVAS_HEIGHT - 20);
    }

    // Low ammo warning
    if (!weapon.infinite) {
        const totalAmmo = player.currentMag + player.ammo[weapon.ammoType];
        const lowAmmoThreshold = weapon.magSize * 2;
        if (totalAmmo <= lowAmmoThreshold && totalAmmo > 0 && !player.reloading) {
            const flash = Math.sin(gameTime / 150) > 0;
            if (flash) {
                ctx.fillStyle = '#FF8800';
                ctx.fillText('LOW AMMO', padding, CANVAS_HEIGHT - 20);
            }
        } else if (totalAmmo === 0 && !player.reloading) {
            ctx.fillStyle = '#FF0000';
            ctx.fillText('NO AMMO - Press V for melee', padding, CANVAS_HEIGHT - 20);
        }
    }

    // Credits
    ctx.fillStyle = COLORS.credits;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`$${player.credits}`, CANVAS_WIDTH - padding, CANVAS_HEIGHT - 20);

    // Keycards
    let keyX = CANVAS_WIDTH - padding - 30;
    const keyY = CANVAS_HEIGHT - 60;
    const keycardOrder = ['green', 'blue', 'yellow', 'red'];
    for (const kc of keycardOrder) {
        ctx.fillStyle = player.keycards[kc] ? COLORS['key' + kc.charAt(0).toUpperCase() + kc.slice(1)] : '#333333';
        ctx.fillRect(keyX, keyY, 25, 15);
        keyX -= 30;
    }

    // Self-destruct timer
    if (selfDestructActive) {
        const minutes = Math.floor(selfDestructTimer / 60000);
        const seconds = Math.floor((selfDestructTimer % 60000) / 1000);
        const timerStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        ctx.fillStyle = selfDestructTimer < 60000 ? '#FF0000' : (selfDestructTimer < 300000 ? '#FF8800' : '#FFFFFF');
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`SELF-DESTRUCT: ${timerStr}`, CANVAS_WIDTH / 2, 40);
    }

    // Minimap
    renderMinimap();

    // Run timer for speedrunning (below minimap)
    const minutes = Math.floor(stats.runTime / 60000);
    const seconds = Math.floor((stats.runTime % 60000) / 1000);
    const ms = Math.floor((stats.runTime % 1000) / 10);
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, CANVAS_WIDTH - 10, 145);

    // Interaction prompts
    renderInteractionPrompts();

    // Objective marker
    renderObjective();
}

function renderMinimap() {
    const mapX = CANVAS_WIDTH - 160;
    const mapY = 10;
    const mapW = 150;
    const mapH = 120;
    const scale = 0.02;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#444444';
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Draw rooms with type indicators
    for (const room of rooms) {
        const rx = mapX + (room.x - camera.x + 500) * scale;
        const ry = mapY + (room.y - camera.y + 400) * scale;
        const rw = room.width * scale;
        const rh = room.height * scale;

        if (rx > mapX && rx < mapX + mapW && ry > mapY && ry < mapY + mapH) {
            // Base color based on cleared status
            ctx.fillStyle = room.cleared ? '#224422' : '#442222';
            ctx.fillRect(rx, ry, rw, rh);

            // Room type indicator (small icon/color in center)
            const cx = rx + rw / 2;
            const cy = ry + rh / 2;
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';

            if (room.type === 'shop') {
                ctx.fillStyle = COLORS.terminal;
                ctx.fillText('$', cx, cy + 3);
            } else if (room.type === 'exit') {
                ctx.fillStyle = '#FFFF00';
                ctx.fillText('E', cx, cy + 3);
            } else if (room.type === 'keycard') {
                ctx.fillStyle = '#88FF88';
                ctx.fillText('K', cx, cy + 3);
            } else if (room.type === 'boss') {
                ctx.fillStyle = '#FF4444';
                ctx.fillText('!', cx, cy + 3);
            }
        }
    }

    // Player dot
    const px = mapX + mapW / 2;
    const py = mapY + mapH / 2;
    ctx.fillStyle = '#4488FF';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    for (const enemy of enemies) {
        const ex = mapX + (enemy.x - camera.x + 500) * scale;
        const ey = mapY + (enemy.y - camera.y + 400) * scale;
        if (ex > mapX && ex < mapX + mapW && ey > mapY && ey < mapY + mapH) {
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderInteractionPrompts() {
    if (!player) return;

    // Check for nearby doors
    for (const door of doors) {
        if (door.open) continue;

        const dx = (door.x + door.w / 2) - player.x;
        const dy = (door.y + door.h / 2) - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';

            if (door.keycardRequired && !player.keycards[door.keycardRequired]) {
                ctx.fillStyle = COLORS['key' + door.keycardRequired.charAt(0).toUpperCase() + door.keycardRequired.slice(1)];
                ctx.fillText(`REQUIRES ${door.keycardRequired.toUpperCase()} KEYCARD`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
            } else {
                ctx.fillText('SPACE to open', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
            }
        }
    }

    // Check for nearby pickups
    for (const pickup of pickups) {
        if (pickup.type === 'barrel') continue;

        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50 && dist > PICKUP_RADIUS) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';

            let label = '';
            switch (pickup.type) {
                case 'health': label = 'E to pickup Health'; break;
                case 'shield': label = 'E to pickup Shield'; break;
                case 'credits': label = `E to pickup $${pickup.value}`; break;
                case 'ammo': label = `E to pickup ${pickup.ammoType} ammo`; break;
                case 'keycard': label = `E to pickup ${pickup.keycard} Keycard`; break;
                case 'weapon': label = `E to pickup ${pickup.weaponType}`; break;
            }

            ctx.fillText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        }
    }
}

function renderObjective() {
    if (!player) return;

    // Determine current objective
    let objective = '';
    let targetX = 0, targetY = 0;
    let hasTarget = false;

    // Check for needed keycards
    const keycardOrder = ['green', 'blue', 'yellow', 'red'];
    for (const kc of keycardOrder) {
        if (!player.keycards[kc]) {
            // Find keycard location
            for (const room of rooms) {
                if (room.type === 'keycard' && room.keycard === kc) {
                    objective = `Find ${kc.toUpperCase()} Keycard`;
                    targetX = room.x + room.width / 2;
                    targetY = room.y + room.height / 2;
                    hasTarget = true;
                    break;
                }
            }
            if (hasTarget) break;
        }
    }

    // If all keycards, find exit
    if (!hasTarget) {
        for (const room of rooms) {
            if (room.type === 'exit') {
                objective = 'Reach the Escape Pod';
                targetX = room.x + room.width / 2;
                targetY = room.y + room.height / 2;
                hasTarget = true;
                break;
            }
        }
    }

    // Draw objective text
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`OBJECTIVE: ${objective}`, 10, 75);

    // Draw directional arrow if target is off-screen
    if (hasTarget) {
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 200) {
            const angle = Math.atan2(dy, dx);
            const arrowX = 100;
            const arrowY = 90;

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);

            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-5, -8);
            ctx.lineTo(-5, 8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }
}

function renderTitle() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', CANVAS_WIDTH / 2, 150);

    ctx.fillStyle = '#888888';
    ctx.font = '24px Arial';
    ctx.fillText('A Top-Down Survival Horror Shooter', CANVAS_WIDTH / 2, 200);

    // Difficulty selection
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('DIFFICULTY (Press 1-3)', CANVAS_WIDTH / 2, 260);

    const difficulties = ['EASY', 'NORMAL', 'HARD'];
    const diffKeys = ['easy', 'normal', 'hard'];
    for (let i = 0; i < 3; i++) {
        const isSelected = difficulty === diffKeys[i];
        ctx.fillStyle = isSelected ? '#88FF88' : '#666666';
        ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
        ctx.fillText(`${i + 1}. ${difficulties[i]}`, CANVAS_WIDTH / 2 - 150 + i * 150, 295);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText('WASD - Move    Mouse - Aim    Click - Shoot    R - Reload', CANVAS_WIDTH / 2, 360);
    ctx.fillText('Q - Switch Weapon    SPACE - Interact    SHIFT - Sprint', CANVAS_WIDTH / 2, 390);

    // Difficulty description
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    if (difficulty === 'easy') {
        ctx.fillText('Less enemy damage, more health drops, increased ammo', CANVAS_WIDTH / 2, 440);
    } else if (difficulty === 'normal') {
        ctx.fillText('Standard challenge - recommended for first playthrough', CANVAS_WIDTH / 2, 440);
    } else {
        ctx.fillText('Increased enemy health and damage, scarce resources', CANVAS_WIDTH / 2, 440);
    }

    ctx.fillStyle = '#88FF88';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Click to Start', CANVAS_WIDTH / 2, 520);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', CANVAS_WIDTH / 2, 200);

    // Stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';

    const minutes = Math.floor(stats.runTime / 60000);
    const seconds = Math.floor((stats.runTime % 60000) / 1000);
    ctx.fillText(`Time Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 280);
    ctx.fillText(`Enemies Killed: ${stats.kills}`, CANVAS_WIDTH / 2, 320);
    ctx.fillText(`Deck Reached: ${currentDeck}`, CANVAS_WIDTH / 2, 360);

    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Victory panel
    ctx.fillStyle = 'rgba(20, 40, 20, 0.95)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 300, 80, 600, 550);
    ctx.strokeStyle = '#88FF88';
    ctx.lineWidth = 3;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 300, 80, 600, 550);

    ctx.fillStyle = '#88FF88';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', CANVAS_WIDTH / 2, 160);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px Arial';
    ctx.fillText('You escaped the station!', CANVAS_WIDTH / 2, 210);

    // Stats section
    ctx.fillStyle = '#AAAAAA';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('MISSION STATISTICS', CANVAS_WIDTH / 2, 270);

    const minutes = Math.floor(stats.runTime / 60000);
    const seconds = Math.floor((stats.runTime % 60000) / 1000);
    const ms = Math.floor((stats.runTime % 1000) / 10);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const leftCol = CANVAS_WIDTH / 2 - 180;
    const rightCol = CANVAS_WIDTH / 2 + 20;
    let y = 310;

    ctx.fillText('Completion Time:', leftCol, y);
    ctx.fillStyle = '#88FF88';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, rightCol, y);

    y += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Enemies Eliminated:', leftCol, y);
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`${stats.kills}`, rightCol, y);

    y += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Damage Dealt:', leftCol, y);
    ctx.fillStyle = '#FFAA00';
    ctx.fillText(`${Math.round(stats.damageDealt)}`, rightCol, y);

    y += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Damage Taken:', leftCol, y);
    ctx.fillStyle = '#FF4444';
    ctx.fillText(`${Math.round(stats.damageTaken)}`, rightCol, y);

    y += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Credits Collected:', leftCol, y);
    ctx.fillStyle = COLORS.credits;
    ctx.fillText(`$${player ? player.credits : 0}`, rightCol, y);

    y += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Decks Cleared:', leftCol, y);
    ctx.fillStyle = '#4488FF';
    ctx.fillText('4/4', rightCol, y);

    // Rating
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    y += 60;
    let rating = 'C';
    let ratingColor = '#888888';
    if (stats.runTime < 300000 && stats.kills > 50) { rating = 'S'; ratingColor = '#FFD700'; }
    else if (stats.runTime < 420000 && stats.kills > 40) { rating = 'A'; ratingColor = '#88FF88'; }
    else if (stats.runTime < 600000 && stats.kills > 30) { rating = 'B'; ratingColor = '#4488FF'; }

    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('MISSION RATING:', CANVAS_WIDTH / 2, y);
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = ratingColor;
    ctx.fillText(rating, CANVAS_WIDTH / 2, y + 55);

    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Click to Play Again', CANVAS_WIDTH / 2, 600);
}

function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Panel
    ctx.fillStyle = 'rgba(30, 30, 40, 0.95)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 200, 150, 400, 400);
    ctx.strokeStyle = '#4488FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 200, 150, 400, 400);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 220);

    // Current run stats
    ctx.font = '18px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Current Run Stats:', CANVAS_WIDTH / 2, 280);

    const minutes = Math.floor(stats.runTime / 60000);
    const seconds = Math.floor((stats.runTime % 60000) / 1000);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const statX = CANVAS_WIDTH / 2 - 120;
    ctx.fillText(`Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, statX, 320);
    ctx.fillText(`Kills: ${stats.kills}`, statX, 345);
    ctx.fillText(`Deck: ${currentDeck}/4`, statX, 370);
    ctx.fillText(`Health: ${Math.ceil(player.hp)}/${player.maxHp}`, statX, 395);
    ctx.fillText(`Credits: $${player.credits}`, statX, 420);

    // Controls
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('ESC - Resume Game', CANVAS_WIDTH / 2, 480);
    ctx.fillText('R - Restart Run', CANVAS_WIDTH / 2, 505);

    ctx.fillStyle = '#4488FF';
    ctx.font = '20px Arial';
    ctx.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, 540);
}

function renderShop() {
    // Shop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(200, 100, CANVAS_WIDTH - 400, CANVAS_HEIGHT - 200);

    ctx.strokeStyle = COLORS.terminal;
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 100, CANVAS_WIDTH - 400, CANVAS_HEIGHT - 200);

    ctx.fillStyle = COLORS.terminal;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INTEX TERMINAL v2.1', CANVAS_WIDTH / 2, 150);

    ctx.fillStyle = COLORS.credits;
    ctx.font = '24px Arial';
    ctx.fillText(`Credits: $${player.credits}`, CANVAS_WIDTH / 2, 190);

    // Shop items
    const items = [
        { name: 'Small Medkit', cost: 25, effect: 'Restore 25 HP', action: () => { player.hp = Math.min(player.maxHp, player.hp + 25); } },
        { name: 'Large Medkit', cost: 60, effect: 'Restore 50 HP', action: () => { player.hp = Math.min(player.maxHp, player.hp + 50); } },
        { name: '9mm Ammo', cost: 15, effect: '+30 rounds', action: () => { player.ammo['9mm'] = Math.min(MAX_AMMO['9mm'], player.ammo['9mm'] + 30); } },
        { name: 'Shotgun Shells', cost: 25, effect: '+16 shells', action: () => { player.ammo['shells'] = Math.min(MAX_AMMO['shells'], player.ammo['shells'] + 16); } },
        { name: 'Rifle Ammo', cost: 30, effect: '+30 rounds', action: () => { player.ammo['rifle'] = Math.min(MAX_AMMO['rifle'], player.ammo['rifle'] + 30); } },
    ];

    let y = 240;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const canAfford = player.credits >= item.cost;

        ctx.fillStyle = canAfford ? '#FFFFFF' : '#666666';
        ctx.fillText(`${i + 1}. ${item.name}`, 250, y);
        ctx.fillText(item.effect, 500, y);
        ctx.fillStyle = canAfford ? COLORS.credits : '#666666';
        ctx.fillText(`$${item.cost}`, 700, y);

        y += 40;
    }

    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('Press 1-5 to buy, ESC to close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
}

// ============================================================================
// GAME LOGIC
// ============================================================================
function update(dt) {
    if (gameState !== 'playing') return;

    gameTime += dt * 1000;
    stats.runTime += dt * 1000;

    // Update damage flash
    if (damageFlash > 0) {
        damageFlash -= dt * 1000;
    }

    // Ambient particle effects (station atmosphere)
    ambientParticleTimer -= dt * 1000;
    if (ambientParticleTimer <= 0) {
        ambientParticleTimer = 500 + Math.random() * 500; // Every 0.5-1 seconds
        // Spawn near player with random offset
        const spawnX = player.x + (Math.random() - 0.5) * 600;
        const spawnY = player.y + (Math.random() - 0.5) * 400;

        if (Math.random() < 0.7) {
            // Dust mote
            particles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 10,
                vy: 5 + Math.random() * 10,
                size: 1 + Math.random() * 2,
                life: 2000,
                maxLife: 2000,
                color: '#444444',
                type: 'dust'
            });
        } else {
            // Spark from damaged wiring
            particles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 60,
                vy: 20 + Math.random() * 40,
                size: 2 + Math.random() * 2,
                life: 400,
                maxLife: 400,
                color: '#FFAA00',
                type: 'spark'
            });
        }
    }

    // Self-destruct timer
    if (selfDestructActive) {
        selfDestructTimer -= dt * 1000;
        if (selfDestructTimer <= 0) {
            gameState = 'gameover';
            return;
        }
    }

    // Update player
    handleInput();
    player.update(dt);

    // Update vision
    updateVision();

    // Check room entry
    checkRoomEntry();

    // Update enemies
    for (const enemy of [...enemies]) {
        enemy.update(dt);
    }

    // Resolve player-enemy collisions (push player out of enemies)
    resolvePlayerEnemyCollisions();

    // Update projectiles
    updateProjectiles(dt);

    // Update particles
    updateParticles(dt);

    // Update floating texts
    updateFloatingTexts(dt);

    // Update door animations
    for (const door of doors) {
        if (door.open && (door.openProgress || 0) < 1) {
            door.openProgress = Math.min(1, (door.openProgress || 0) + dt * 4); // Opens in ~0.25s
        }
    }

    // Pickup collection
    collectPickups();

    // Check room cleared
    checkRoomCleared();

    // Check exit
    checkExit();
}

function handleInput() {
    // Movement
    player.vx = 0;
    player.vy = 0;

    if (keys['w'] || keys['arrowup']) player.vy = -1;
    if (keys['s'] || keys['arrowdown']) player.vy = 1;
    if (keys['a'] || keys['arrowleft']) player.vx = -1;
    if (keys['d'] || keys['arrowright']) player.vx = 1;

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0) {
        const len = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        player.vx /= len;
        player.vy /= len;
    }

    // Sprint (supports toggle or hold mode)
    if (sprintToggle) {
        // Toggle mode: sprintToggleState is toggled on shift press (handled in setupInput)
        player.sprinting = sprintToggleState && player.stamina > 0;
        // Auto-disable sprint when out of stamina
        if (player.stamina <= 0) sprintToggleState = false;
    } else {
        // Hold mode: sprint while holding shift
        player.sprinting = keys['shift'] && player.stamina > 0;
    }

    // Shooting
    if (mouse.down) {
        player.shoot();
    }
}

function checkRoomEntry() {
    for (const room of rooms) {
        if (player.x > room.x && player.x < room.x + room.width &&
            player.y > room.y && player.y < room.y + room.height) {
            if (room !== currentRoom) {
                enterRoom(room);
            }
            break;
        }
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.traveled += Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * dt;

        // Range check
        if (proj.traveled > proj.range) {
            projectiles.splice(i, 1);
            continue;
        }

        // Wall collision
        let hitWall = false;
        for (const wall of walls) {
            if (proj.x > wall.x && proj.x < wall.x + wall.w &&
                proj.y > wall.y && proj.y < wall.y + wall.h) {

                if (wall.destructible) {
                    wall.hp -= proj.damage;
                    if (wall.hp <= 0) {
                        walls.splice(walls.indexOf(wall), 1);
                    }
                }

                // Spark particles on wall hit
                for (let s = 0; s < 5; s++) {
                    particles.push({
                        x: proj.x,
                        y: proj.y,
                        vx: (Math.random() - 0.5) * 200,
                        vy: (Math.random() - 0.5) * 200,
                        size: 2 + Math.random() * 3,
                        life: 150,
                        maxLife: 150,
                        color: '#FFAA44',
                        type: 'spark'
                    });
                }

                hitWall = true;
                break;
            }
        }

        // Door collision (closed doors)
        for (const door of doors) {
            if (!door.open) {
                if (proj.x > door.x && proj.x < door.x + door.w &&
                    proj.y > door.y && proj.y < door.y + door.h) {
                    hitWall = true;
                    break;
                }
            }
        }

        if (hitWall) {
            if (proj.explosive) {
                createExplosion(proj.x, proj.y, proj.splashRadius, proj.splashDamage);
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Hit detection
        if (proj.isPlayer) {
            // Hit enemies
            for (const enemy of enemies) {
                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.size / 2 + 4) {
                    const angle = Math.atan2(proj.vy, proj.vx);
                    enemy.takeDamage(proj.damage, angle);

                    if (proj.explosive) {
                        createExplosion(proj.x, proj.y, proj.splashRadius, proj.splashDamage);
                    }

                    if (!proj.isFlame) {
                        projectiles.splice(i, 1);
                    }
                    break;
                }
            }

            // Hit barrels and crates
            for (let j = pickups.length - 1; j >= 0; j--) {
                const pickup = pickups[j];
                if (pickup.type !== 'barrel' && pickup.type !== 'crate') continue;

                const dx = pickup.x - proj.x;
                const dy = pickup.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 16) {
                    pickup.hp -= proj.damage;
                    if (pickup.hp <= 0) {
                        if (pickup.type === 'barrel') {
                            createExplosion(pickup.x, pickup.y, 80, 80);
                        } else {
                            // Crate drops loot
                            spawnCrateLoot(pickup.x, pickup.y, pickup.lootType, pickup.specificAmmo);
                        }
                        pickups.splice(j, 1);
                    }
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Hit player
            const dx = player.x - proj.x;
            const dy = player.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.hitboxSize / 2 + 4) {
                player.takeDamage(proj.damage);
                projectiles.splice(i, 1);
            }
        }
    }
}

function spawnCrateLoot(x, y, lootType, specificAmmo) {
    // Spawn particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            size: 3 + Math.random() * 3,
            life: 300,
            maxLife: 300,
            color: '#664422',
            type: 'debris'
        });
    }

    // Spawn loot
    const diffMod = DIFFICULTY_MODIFIERS[difficulty];
    if (lootType === 'ammo') {
        const ammoTypes = ['9mm', 'shells', 'rifle'];
        const ammoType = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
        const amount = Math.floor((10 + Math.random() * 20) * diffMod.ammoDropMult);
        pickups.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'ammo',
            ammoType: ammoType,
            value: amount
        });
    } else if (lootType === 'specificAmmo') {
        // Specific ammo crate gives more of a specific type
        const amount = Math.floor((25 + Math.random() * 35) * diffMod.ammoDropMult);
        pickups.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'ammo',
            ammoType: specificAmmo || '9mm',
            value: amount
        });
    } else if (lootType === 'health') {
        pickups.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'health',
            value: Math.floor(15 * diffMod.ammoDropMult)
        });
    } else if (lootType === 'shield') {
        pickups.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'shield',
            value: Math.floor(15 * diffMod.ammoDropMult)
        });
    } else {
        const creditAmount = Math.floor((5 + Math.random() * 15) * diffMod.creditDropMult);
        pickups.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            type: 'credits',
            value: creditAmount
        });
    }

    showFloatingText(x, y - 20, 'LOOT!', '#FFAA00');
}

function createExplosion(x, y, radius, damage) {
    // Damage all entities in radius
    for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
            const falloff = 1 - (dist / radius);
            enemy.takeDamage(damage * falloff, Math.atan2(dy, dx));
        }
    }

    // Damage player
    const pdx = player.x - x;
    const pdy = player.y - y;
    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist < radius) {
        const falloff = 1 - (pdist / radius);
        player.takeDamage(damage * falloff);
    }

    // Chain reaction - damage nearby barrels
    const barrelsToExplode = [];
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        if (pickup.type !== 'barrel') continue;

        const bdx = pickup.x - x;
        const bdy = pickup.y - y;
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);

        if (bdist < radius * 1.2 && bdist > 5) {
            pickup.hp -= damage * (1 - bdist / (radius * 1.2));
            if (pickup.hp <= 0) {
                barrelsToExplode.push({ x: pickup.x, y: pickup.y, index: i });
            }
        }
    }

    // Trigger chain explosions after a small delay
    for (const barrel of barrelsToExplode) {
        pickups.splice(barrel.index, 1);
        // Schedule chain explosion
        setTimeout(() => {
            createExplosion(barrel.x, barrel.y, 80, 80);
        }, 100);
    }

    // Enhanced explosion particles
    // Fire particles (fast, bright)
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 300 + Math.random() * 300;
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 12,
            life: 300 + Math.random() * 200,
            maxLife: 500,
            color: ['#FF4400', '#FF8800', '#FFAA00', '#FFDD00'][Math.floor(Math.random() * 4)],
            type: 'explosion'
        });
    }
    // Smoke particles (slow, dark, longer lasting)
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 100,
            vy: -50 - Math.random() * 100, // Rises
            size: 10 + Math.random() * 20,
            life: 600 + Math.random() * 400,
            maxLife: 1000,
            color: '#444444',
            type: 'smoke'
        });
    }
    // Sparks (small, fast)
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (400 + Math.random() * 200),
            vy: Math.sin(angle) * (400 + Math.random() * 200),
            size: 2 + Math.random() * 3,
            life: 200 + Math.random() * 200,
            maxLife: 400,
            color: '#FFFF88',
            type: 'spark'
        });
    }

    addScreenShake(15, 300);
}

function updateParticles(dt) {
    // Performance optimization: limit max particles
    const MAX_PARTICLES = 300;
    if (particles.length > MAX_PARTICLES) {
        // Remove oldest particles (from front of array)
        particles.splice(0, particles.length - MAX_PARTICLES);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.life -= dt * 1000;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        // Skip particles far from camera (performance optimization)
        const distFromCamera = Math.abs(p.x - camera.x) + Math.abs(p.y - camera.y);
        if (distFromCamera > 1000) {
            particles.splice(i, 1);
            continue;
        }

        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];

        ft.life -= dt * 1000;
        // Use velocity property if set, otherwise default upward movement
        ft.y += (ft.vy || -30) * dt;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function collectPickups() {
    const MAGNET_RADIUS = 80; // Pickups start moving toward player
    const MAGNET_SPEED = 200; // Pixels per second

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        if (pickup.type === 'barrel') continue;

        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnet effect - pull pickups toward player
        if (dist < MAGNET_RADIUS && dist > PICKUP_RADIUS) {
            const magnetStrength = 1 - (dist / MAGNET_RADIUS);
            const speed = MAGNET_SPEED * magnetStrength * deltaTime;
            const angle = Math.atan2(-dy, -dx);
            pickup.x += Math.cos(angle) * speed;
            pickup.y += Math.sin(angle) * speed;
        }

        if (dist < PICKUP_RADIUS) {
            switch (pickup.type) {
                case 'health':
                    if (player.hp < player.maxHp) {
                        player.heal(pickup.value);
                        pickups.splice(i, 1);
                    }
                    break;
                case 'shield':
                    if (player.shield < player.maxShield) {
                        player.giveShield(pickup.value);
                        pickups.splice(i, 1);
                    }
                    break;
                case 'credits':
                    player.credits += pickup.value;
                    showFloatingText(pickup.x, pickup.y, `+$${pickup.value}`, COLORS.credits);
                    pickups.splice(i, 1);
                    break;
                case 'ammo':
                    const currentAmmo = player.ammo[pickup.ammoType];
                    const maxAmmo = MAX_AMMO[pickup.ammoType] * (1 + player.ammoCapacityBonus);
                    if (currentAmmo < maxAmmo) {
                        player.ammo[pickup.ammoType] = Math.min(maxAmmo, currentAmmo + pickup.value);
                        showFloatingText(pickup.x, pickup.y, `+${pickup.value} ${pickup.ammoType}`, '#FFAA00');
                        pickups.splice(i, 1);
                    }
                    break;
                case 'keycard':
                    player.keycards[pickup.keycard] = true;
                    showFloatingText(pickup.x, pickup.y, `${pickup.keycard.toUpperCase()} KEYCARD`,
                        COLORS['key' + pickup.keycard.charAt(0).toUpperCase() + pickup.keycard.slice(1)]);
                    pickups.splice(i, 1);

                    // Open doors that can now be opened
                    for (const door of doors) {
                        if (door.keycardRequired === pickup.keycard) {
                            const room1Cleared = door.room1 ? door.room1.cleared : true;
                            const room2Cleared = door.room2 ? door.room2.cleared : true;
                            if (room1Cleared && room2Cleared) {
                                door.open = true;
                            }
                        }
                    }
                    break;
                case 'weapon':
                    const weaponType = pickup.weapon || pickup.weaponType;
                    if (!player.weapons.includes(weaponType)) {
                        player.weapons.push(weaponType);
                        showFloatingText(pickup.x, pickup.y, `${WEAPONS[weaponType].name} ACQUIRED!`, '#4488FF');
                        pickups.splice(i, 1);
                    } else {
                        // Already have weapon - give ammo instead
                        const ammoType = WEAPONS[weaponType].ammoType;
                        const ammoGift = Math.floor(WEAPONS[weaponType].magSize * 1.5);
                        player.ammo[ammoType] = Math.min(MAX_AMMO[ammoType], player.ammo[ammoType] + ammoGift);
                        showFloatingText(pickup.x, pickup.y, `+${ammoGift} ${ammoType}`, '#FFAA00');
                        pickups.splice(i, 1);
                    }
                    break;
            }
        }
    }
}

function checkExit() {
    // Find exit room
    for (const room of rooms) {
        if (room.type === 'exit' && room.cleared) {
            // Check if player is at exit
            if (player.x > room.x + room.width / 2 - 50 &&
                player.x < room.x + room.width / 2 + 50 &&
                player.y > room.y + room.height / 2 - 50 &&
                player.y < room.y + room.height / 2 + 50) {

                if (currentDeck < 4) {
                    // Next deck
                    currentDeck++;
                    generateLevel(currentDeck);
                    showFloatingText(player.x, player.y, `DECK ${currentDeck}`, '#FFFFFF');

                    if (currentDeck === 4) {
                        selfDestructActive = true;
                    }
                } else {
                    // Victory!
                    gameState = 'victory';
                }
            }
        }
    }
}

function alertEnemiesInRange(x, y, range) {
    for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < range) {
            enemy.alerted = true;
        }
    }
}

function resolvePlayerEnemyCollisions() {
    if (!player) return;

    for (const enemy of enemies) {
        // Skip enemies that are spawning
        if (enemy.spawnTimer > 0) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = player.hitboxSize / 2 + enemy.size / 2;

        if (dist < minDist && dist > 0) {
            // Push player out of enemy
            const pushDist = (minDist - dist) * 0.5;
            const pushX = (dx / dist) * pushDist;
            const pushY = (dy / dist) * pushDist;

            player.x += pushX;
            player.y += pushY;

            // Also push enemy slightly (less)
            enemy.x -= pushX * 0.3;
            enemy.y -= pushY * 0.3;
        }
    }
}

function addScreenShake(intensity, duration) {
    camera.shake = Math.max(camera.shake, intensity * screenShakeIntensity);
    camera.shakeAngle = Math.random() * Math.PI * 2;
}

function spawnBloodDecal(x, y, color, size) {
    // Limit decals to prevent performance issues
    if (decals.length > 200) {
        decals.shift(); // Remove oldest
    }
    decals.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        size: size || (8 + Math.random() * 12),
        color: color || COLORS.alienBlood,
        alpha: 0.6 + Math.random() * 0.3
    });
}

function showFloatingText(x, y, text, color, isDamage = false) {
    floatingTexts.push({
        x, y, text, color,
        life: 1000,
        maxLife: 1000,
        isDamage: isDamage, // Damage numbers float up faster
        vy: isDamage ? -60 : -20 // Upward velocity
    });
}

function screenToWorld(screenX, screenY) {
    return {
        x: screenX + camera.x - CANVAS_WIDTH / 2,
        y: screenY + camera.y - CANVAS_HEIGHT / 2
    };
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
function setupInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        if (gameState === 'playing') {
            if (e.key.toLowerCase() === 'r') {
                player.startReload();
            }
            if (e.key.toLowerCase() === 'q') {
                player.switchWeapon(1);
            }
            if (e.key.toLowerCase() === 'h') {
                player.useMedkit();
            }
            if (e.key === ' ') {
                e.preventDefault();
                interactWithDoor();
            }
            if (e.key === 'v') {
                // Melee attack (fallback)
                player.melee();
            }
            // Sprint toggle mode (Shift key toggles sprint)
            if (e.key === 'Shift' && sprintToggle) {
                sprintToggleState = !sprintToggleState;
            }
            // Weapon wheel: number keys 1-7 switch to specific weapons
            const weaponKey = parseInt(e.key);
            if (weaponKey >= 1 && weaponKey <= 7) {
                const weaponIndex = weaponKey - 1;
                if (weaponIndex < player.weapons.length) {
                    player.currentWeapon = weaponIndex;
                    player.reloading = false;
                    player.reloadTimer = 0;
                    player.fireTimer = 200; // Small delay on switch
                    const weapon = player.weapon;
                    player.currentMag = Math.min(player.currentMag, weapon.magSize);
                    showFloatingText(player.x, player.y - 20, weapon.name.toUpperCase(), '#4488FF');
                }
            }
        }

        if (e.key === 'Escape') {
            if (gameState === 'playing') {
                gameState = 'paused';
            } else if (gameState === 'paused' || gameState === 'shop') {
                gameState = 'playing';
            }
        }

        // Restart from pause menu
        if (gameState === 'paused' && e.key.toLowerCase() === 'r') {
            startGame();
        }

        // Shop number keys
        if (gameState === 'shop') {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                buyShopItem(num - 1);
            }
        }

        // Difficulty selection on title
        if (gameState === 'title') {
            if (e.key === '1') difficulty = 'easy';
            if (e.key === '2') difficulty = 'normal';
            if (e.key === '3') difficulty = 'hard';
        }
    });

    window.addEventListener('keyup', (e) => {
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

            if (gameState === 'title' || gameState === 'gameover' || gameState === 'victory') {
                startGame();
            }
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouse.down = false;
        }
    });

    canvas.addEventListener('wheel', (e) => {
        if (gameState === 'playing' && player) {
            player.switchWeapon(e.deltaY > 0 ? 1 : -1);
        }
    });

    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function interactWithDoor() {
    // Improved: larger interaction hitbox for better usability
    const DOOR_INTERACT_RANGE = 100; // Balanced: increased from 80

    for (const door of doors) {
        if (door.open) continue;

        const dx = (door.x + door.w / 2) - player.x;
        const dy = (door.y + door.h / 2) - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DOOR_INTERACT_RANGE) {
            // Check keycard
            if (door.keycardRequired && !player.keycards[door.keycardRequired]) {
                showFloatingText(player.x, player.y - 30, `Need ${door.keycardRequired} keycard`, '#FF4444');
                return;
            }

            // Check if rooms are cleared
            const room1Cleared = door.room1 ? door.room1.cleared : true;
            const room2Cleared = door.room2 ? door.room2.cleared : true;

            if (!room1Cleared || !room2Cleared) {
                showFloatingText(player.x, player.y - 30, 'Clear the room first!', '#FF4444');
                return;
            }

            door.open = true;
            showFloatingText(door.x + door.w / 2, door.y, 'Door opened', '#88FF88');

            // Log event
            if (window.testHarness) {
                window.testHarness.logEvent('door_opened', {});
            }
        }
    }
}

function buyShopItem(index) {
    const items = [
        { cost: 25, action: () => { player.hp = Math.min(player.maxHp, player.hp + 25); showFloatingText(player.x, player.y, '+25 HP', COLORS.health); } },
        { cost: 60, action: () => { player.hp = Math.min(player.maxHp, player.hp + 50); showFloatingText(player.x, player.y, '+50 HP', COLORS.health); } },
        { cost: 15, action: () => { player.ammo['9mm'] = Math.min(MAX_AMMO['9mm'], player.ammo['9mm'] + 30); showFloatingText(player.x, player.y, '+30 9mm', '#FFAA00'); } },
        { cost: 25, action: () => { player.ammo['shells'] = Math.min(MAX_AMMO['shells'], player.ammo['shells'] + 16); showFloatingText(player.x, player.y, '+16 shells', '#FFAA00'); } },
        { cost: 30, action: () => { player.ammo['rifle'] = Math.min(MAX_AMMO['rifle'], player.ammo['rifle'] + 30); showFloatingText(player.x, player.y, '+30 rifle', '#FFAA00'); } },
    ];

    if (index < 0 || index >= items.length) return;

    const item = items[index];
    if (player.credits >= item.cost) {
        player.credits -= item.cost;
        item.action();
    }
}

// ============================================================================
// GAME LOOP
// ============================================================================
function startGame() {
    gameState = 'playing';
    currentDeck = 1;
    selfDestructActive = false;
    selfDestructTimer = 600000;

    // Reset stats
    stats = {
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        runTime: 0
    };

    generateLevel(currentDeck);
}

function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    setupInput();

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ============================================================================
// DEBUG COMMANDS (Required for test harness)
// ============================================================================
window.debugCommands = {
    skipToLevel: (level) => {
        currentDeck = level;
        generateLevel(currentDeck);
        if (currentDeck === 4) {
            selfDestructActive = true;
        }
    },

    skipToRoom: (roomIndex) => {
        if (roomIndex >= 0 && roomIndex < rooms.length) {
            const room = rooms[roomIndex];
            player.x = room.x + room.width / 2;
            player.y = room.y + room.height / 2;
            enterRoom(room);
        }
    },

    skipToBoss: () => {
        currentDeck = 4;
        generateLevel(currentDeck);
        selfDestructActive = true;
        // Teleport to last room
        const lastRoom = rooms[rooms.length - 1];
        player.x = lastRoom.x + lastRoom.width / 2;
        player.y = lastRoom.y + lastRoom.height / 2;
    },

    godMode: (enabled) => {
        if (player) player.godMode = enabled;
    },

    setHealth: (amount) => {
        if (player) player.hp = Math.min(amount, player.maxHp);
    },

    setMaxHealth: (amount) => {
        if (player) {
            player.maxHp = amount;
            player.hp = Math.min(player.hp, amount);
        }
    },

    giveCoins: (amount) => {
        if (player) player.credits += amount;
    },

    giveAmmo: (amount) => {
        if (player) {
            for (const type in player.ammo) {
                player.ammo[type] = Math.min(MAX_AMMO[type], player.ammo[type] + amount);
            }
        }
    },

    giveAllWeapons: () => {
        if (player) {
            player.weapons = ['pistol', 'shotgun', 'smg', 'assault', 'flamethrower', 'plasma', 'rocket'];
        }
    },

    giveItem: (itemId) => {
        if (player && itemId in player.keycards) {
            player.keycards[itemId] = true;
        }
    },

    giveAllItems: () => {
        if (player) {
            player.keycards = { green: true, blue: true, yellow: true, red: true };
        }
    },

    clearRoom: () => {
        enemies = [];
        if (currentRoom) currentRoom.cleared = true;
        checkRoomCleared();
    },

    spawnEnemy: (type, x, y) => {
        if (ENEMY_TYPES[type]) {
            const enemy = new Enemy(type, x || player.x + 100, y || player.y);
            enemy.alerted = true;
            enemies.push(enemy);
            return enemy.id;
        }
    },

    spawnBoss: (type) => {
        // Spawn a matriarch as mini-boss
        const boss = new Enemy('matriarch', player.x + 200, player.y);
        boss.hp *= 2;
        boss.maxHp *= 2;
        boss.alerted = true;
        enemies.push(boss);
    },

    showHitboxes: (enabled) => {
        window._showHitboxes = enabled;
    },

    showGrid: (enabled) => {
        window._showGrid = enabled;
    },

    slowMotion: (factor) => {
        window._slowMotion = factor;
    },

    saveState: () => {
        return {
            player: {
                x: player.x,
                y: player.y,
                hp: player.hp,
                credits: player.credits,
                weapons: [...player.weapons],
                ammo: {...player.ammo}
            },
            currentDeck,
            selfDestructTimer
        };
    },

    loadState: (state) => {
        if (state && state.player) {
            player.x = state.player.x;
            player.y = state.player.y;
            player.hp = state.player.hp;
            player.credits = state.player.credits;
            player.weapons = [...state.player.weapons];
            player.ammo = {...state.player.ammo};
            currentDeck = state.currentDeck;
            selfDestructTimer = state.selfDestructTimer;
        }
    }
};

// ============================================================================
// GLOBAL GETTERS (Required for test harness)
// ============================================================================
window.getPlayer = () => player;
window.getEnemies = () => enemies;
window.getProjectiles = () => projectiles;
window.getPickups = () => pickups;
window.getWalls = () => walls;
window.getDoors = () => doors;
window.getRooms = () => rooms;
window.getCurrentRoom = () => currentRoom;
window.getCurrentDeck = () => currentDeck;
window.getGameState = () => gameState;
window.getKeys = () => keys;

window.startGame = startGame;

// ============================================================================
// INIT
// ============================================================================
window.addEventListener('load', init);
