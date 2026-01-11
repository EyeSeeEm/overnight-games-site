// Star of Providence Clone - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 480;
const UI_HEIGHT = 120;

// Colors
const COLORS = {
    background: '#0a0a12',
    floor: '#1a1a2a',
    wall: '#333344',
    player: '#00ff88',
    playerBullet: '#ffff00',
    enemyBullet: '#ff4444',
    enemyBulletDestructible: '#ff8844',
    health: '#ff0000',
    shield: '#0088ff',
    ammo: '#ffaa00',
    debris: '#ffff00',
    ui: '#222233',
    uiText: '#ffffff',
    door: '#4488ff',
    doorLocked: '#884444'
};

// Game states
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ROOM_CLEAR: 'room_clear',
    SHOP: 'shop',
    UPGRADE: 'upgrade',
    BOSS: 'boss',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    FLOOR_MAP: 'floor_map'
};

// Weapon definitions
const WEAPONS = {
    PEASHOOTER: {
        name: 'Peashooter',
        damage: 5,
        maxAmmo: Infinity,
        fireRate: 100,
        velocity: 720,
        projectileSize: 4,
        color: '#ffff00',
        piercing: false
    },
    VULCAN: {
        name: 'Vulcan',
        damage: 15,
        maxAmmo: 500,
        fireRate: 80,
        velocity: 600,
        projectileSize: 6,
        color: '#ff6600',
        piercing: false
    },
    LASER: {
        name: 'Laser',
        damage: 115,
        maxAmmo: 100,
        fireRate: 667,
        velocity: 2000,
        projectileSize: 4,
        color: '#00ffff',
        piercing: true,
        isBeam: true
    },
    FIREBALL: {
        name: 'Fireball',
        damage: 80,
        maxAmmo: 90,
        fireRate: 833,
        velocity: 360,
        projectileSize: 12,
        color: '#ff4400',
        piercing: false,
        explosive: true,
        explosionRadius: 48
    },
    SWORD: {
        name: 'Sword',
        damage: 70,
        maxAmmo: 125,
        fireRate: 533,
        velocity: 0,
        projectileSize: 0,
        color: '#ff88ff',
        isMelee: true,
        coneAngle: 90,
        coneRange: 80
    },
    REVOLVER: {
        name: 'Revolver',
        damage: 28,
        maxAmmo: 250,
        fireRate: 133,
        velocity: 540,
        projectileSize: 8,
        color: '#aaaaaa',
        piercing: false
    }
};

// Enemy definitions
const ENEMY_TYPES = {
    GHOST: {
        name: 'Ghost',
        type: 'undead',
        hp: 50,
        debris: 10,
        speed: 80,
        behavior: 'chase',
        color: '#aaddff',
        size: 16,
        attacks: [{ type: 'revenge_bullet', damage: 1, onDeath: true }]
    },
    DRONE: {
        name: 'Drone',
        type: 'machine',
        hp: 70,
        debris: 30,
        speed: 150,
        behavior: 'dash_to_player',
        color: '#888888',
        size: 16,
        attacks: [{ type: 'spread', damage: 1, count: 3, angle: 30, interval: 2000 }]
    },
    TURRET: {
        name: 'Turret',
        type: 'machine',
        hp: 90,
        debris: 25,
        speed: 0,
        behavior: 'stationary',
        color: '#666666',
        size: 20,
        attacks: [{ type: 'burst', damage: 1, count: 3, interval: 1500 }]
    },
    SEEKER: {
        name: 'Seeker',
        type: 'construct',
        hp: 120,
        debris: 37,
        speed: 100,
        behavior: 'wander',
        color: '#ff8800',
        size: 18,
        attacks: [{ type: 'spread', damage: 1, count: 2, angle: 20, interval: 2500 }]
    },
    SWARMER: {
        name: 'Swarmer',
        type: 'creature',
        hp: 12,
        debris: 0,
        speed: 200,
        behavior: 'chase',
        color: '#44ff44',
        size: 10,
        attacks: []
    },
    PYROMANCER: {
        name: 'Pyromancer',
        type: 'mage',
        hp: 110,
        debris: 80,
        speed: 60,
        behavior: 'wander',
        color: '#ff4400',
        size: 20,
        attacks: [{ type: 'fireball', damage: 1, interval: 3000 }]
    },
    BLOB: {
        name: 'Blob',
        type: 'creature',
        hp: 150,
        debris: 55,
        speed: 80,
        behavior: 'bounce',
        color: '#88ff88',
        size: 24,
        attacks: [{ type: 'split', onDeath: true, count: 3 }]
    },
    JELLY: {
        name: 'Jelly',
        type: 'creature',
        hp: 10,
        debris: 5,
        speed: 120,
        behavior: 'chase',
        color: '#66ff66',
        size: 12,
        attacks: []
    }
};

// Keywords
const KEYWORDS = {
    HOMING: { name: 'Homing', damageModifier: 1.0, effect: 'homing' },
    TRIPLE: { name: 'Triple', damageModifier: 0.5, effect: 'triple' },
    HIGH_CALIBER: { name: 'High-Caliber', damageModifier: 3.5, fireRateModifier: 3.25, effect: 'piercing' },
    FREEZE: { name: 'Freeze', damageModifier: 1.0, effect: 'freeze' },
    GATLING: { name: 'Gatling', damageModifier: 0.5, fireRateModifier: 0.4, effect: 'rapid' },
    CHAIN: { name: 'Chain', damageModifier: 0.8, effect: 'chain' },
    POISON: { name: 'Poison', damageModifier: 0.9, effect: 'poison' },
    BOUNCE: { name: 'Bounce', damageModifier: 0.7, effect: 'bounce' },
    VOID: { name: 'Void', damageModifier: 0.9, effect: 'void' },
    BURST: { name: 'Burst', damageModifier: 0.6, effect: 'burst' }
};

// Boss definitions
const BOSS_TYPES = {
    CHAMBERLORD: {
        name: 'Chamberlord',
        hp: 1500,
        debris: 500,
        size: 48,
        color: '#ff4488',
        phases: [
            { hpThreshold: 1.0, attacks: ['spread5', 'ring8', 'spawn_minions'] },
            { hpThreshold: 0.5, attacks: ['spread7', 'ring12', 'laser_sweep'] },
            { hpThreshold: 0.25, attacks: ['spiral', 'ring16', 'enrage'] }
        ]
    },
    GUARDIAN: {
        name: 'Guardian',
        hp: 1400,
        debris: 500,
        size: 44,
        color: '#4488ff',
        phases: [
            { hpThreshold: 1.0, attacks: ['charge', 'burst3', 'shield'] },
            { hpThreshold: 0.5, attacks: ['charge_fast', 'burst5', 'summon'] },
            { hpThreshold: 0.25, attacks: ['rampage', 'ring8'] }
        ]
    },
    GRINDER: {
        name: 'Grinder',
        hp: 1600,
        debris: 500,
        size: 50,
        color: '#888888',
        phases: [
            { hpThreshold: 1.0, attacks: ['saw_throw', 'bullet_trail', 'ring6'] },
            { hpThreshold: 0.5, attacks: ['saw_multi', 'charge', 'ring10'] },
            { hpThreshold: 0.25, attacks: ['saw_storm', 'bullet_walls'] }
        ]
    }
};

// Hazard definitions
const HAZARDS = {
    SPIKE: { damage: 1, color: '#aa4444', type: 'static' },
    FIRE: { damage: 1, color: '#ff4400', type: 'animated' },
    WATER: { damage: 0, slowFactor: 0.5, color: '#4488ff', type: 'slow' },
    ELECTRIC: { damage: 1, color: '#ffff00', type: 'toggle', interval: 2000 }
};

// Upgrade definitions
const UPGRADES = {
    ARTIFACT: { name: 'Artifact', desc: 'Get a 4-keyword weapon', cost: 0 },
    AUTOBOMB: { name: 'Autobomb', desc: 'Auto-bomb when hit', cost: 300 },
    BLINK: { name: 'Blink', desc: 'Dash teleports', cost: 250 },
    DISCOUNT: { name: 'Discount', desc: '34% shop discount', cost: 200 },
    EXTRA_POW: { name: 'Extra Pow', desc: '+1 bomb, destroys blocks', cost: 200 },
    FOCUS: { name: 'Focus', desc: '2x invincibility time', cost: 250 },
    FORTUNE: { name: 'Fortune', desc: 'Better drops', cost: 300 },
    PLATING: { name: 'Plating', desc: '+33% max HP', cost: 350 },
    QUICKENING: { name: 'Quickening', desc: 'Revive once', cost: 400 },
    RESERVES: { name: 'Reserves', desc: '+10% damage', cost: 200 },
    SCANNER: { name: 'Scanner', desc: 'Reveal map', cost: 150 },
    STEALTH: { name: 'Stealth', desc: 'Enemy delay 3x', cost: 250 }
};

// Room types
const ROOM_TYPE = {
    START: 'start',
    NORMAL: 'normal',
    MINIBOSS: 'miniboss',
    BOSS: 'boss',
    SHOP: 'shop',
    UPGRADE: 'upgrade',
    WEAPON: 'weapon',
    EMPTY: 'empty'
};

// Game state
let game = {
    state: STATE.MENU,
    floor: 1,
    player: null,
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    pickups: [],
    particles: [],
    currentRoom: null,
    floorMap: null,
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    lastTime: 0,
    roomCleared: false,
    doors: [],
    debris: 0,
    multiplier: 1.0,
    roomsCleared: 0,
    bombChargeProgress: 0,
    // New features
    screenShake: 0,
    screenShakeIntensity: 0,
    comboText: [],
    hazards: [],
    boss: null,
    upgrades: [],
    killStreak: 0,
    killStreakTimer: 0,
    totalKills: 0,
    damageDealt: 0,
    bossesDefeated: 0,
    floatingTexts: [],
    chainLightning: []
};

// Player class
class Player {
    constructor() {
        this.x = GAME_WIDTH / 2;
        this.y = ROOM_HEIGHT - 100;
        this.vx = 0;
        this.vy = 0;
        this.normalSpeed = 250;
        this.focusSpeed = 100;
        this.hitboxRadius = 4;
        this.spriteSize = 24;

        // Stats
        this.hp = 4;
        this.maxHP = 4;
        this.shields = 0;
        this.maxShields = 3;

        // Weapons
        this.currentWeapon = { ...WEAPONS.PEASHOOTER, keywords: [] };
        this.ammo = 100;
        this.maxAmmo = 100;
        this.ammoPercent = 1.0;

        // Bombs
        this.bombs = 2;
        this.maxBombs = 6;

        // Dash
        this.dashDistance = 120;
        this.dashDuration = 0.1;
        this.dashCooldown = 0;
        this.dashCooldownMax = 0.5;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashVx = 0;
        this.dashVy = 0;

        // Invincibility
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 1.0;

        // Shooting
        this.fireTimer = 0;
        this.isFocusing = false;

        // Damage bonus
        this.damageMultiplier = 1.0;

        // Sword swing
        this.swingAngle = 0;
        this.isSwinging = false;
        this.swingTimer = 0;
    }

    update(delta) {
        const speed = this.isFocusing ? this.focusSpeed : this.normalSpeed;

        // Update dash
        if (this.dashCooldown > 0) {
            this.dashCooldown -= delta;
        }

        if (this.isDashing) {
            this.dashTimer -= delta;
            this.x += this.dashVx * delta;
            this.y += this.dashVy * delta;

            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            // Normal movement
            this.vx = 0;
            this.vy = 0;

            if (game.keys['ArrowLeft'] || game.keys['KeyA']) this.vx -= 1;
            if (game.keys['ArrowRight'] || game.keys['KeyD']) this.vx += 1;
            if (game.keys['ArrowUp'] || game.keys['KeyW']) this.vy -= 1;
            if (game.keys['ArrowDown'] || game.keys['KeyS']) this.vy += 1;

            // Normalize diagonal
            if (this.vx !== 0 && this.vy !== 0) {
                const factor = 0.7071;
                this.vx *= factor;
                this.vy *= factor;
            }

            this.x += this.vx * speed * delta;
            this.y += this.vy * speed * delta;
        }

        // Clamp to room bounds
        this.x = Math.max(30, Math.min(GAME_WIDTH - 30, this.x));
        this.y = Math.max(30, Math.min(ROOM_HEIGHT - 30, this.y));

        // Update invincibility
        if (this.isInvincible && !this.isDashing) {
            this.invincibilityTimer -= delta;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }

        // Update fire timer
        if (this.fireTimer > 0) {
            this.fireTimer -= delta * 1000;
        }

        // Sword swing update
        if (this.isSwinging) {
            this.swingTimer -= delta;
            if (this.swingTimer <= 0) {
                this.isSwinging = false;
            }
        }
    }

    dash() {
        if (this.dashCooldown > 0 || this.isDashing) return false;

        let dx = 0, dy = 0;
        if (game.keys['ArrowLeft'] || game.keys['KeyA']) dx -= 1;
        if (game.keys['ArrowRight'] || game.keys['KeyD']) dx += 1;
        if (game.keys['ArrowUp'] || game.keys['KeyW']) dy -= 1;
        if (game.keys['ArrowDown'] || game.keys['KeyS']) dy += 1;

        if (dx === 0 && dy === 0) {
            dy = -1; // Default dash forward
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        this.isDashing = true;
        this.isInvincible = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        this.dashVx = dx * this.dashDistance / this.dashDuration;
        this.dashVy = dy * this.dashDistance / this.dashDuration;

        // Spawn dash particles
        for (let i = 0; i < 5; i++) {
            game.particles.push(createParticle(this.x, this.y, '#00ff88', 300));
        }

        return true;
    }

    fire() {
        if (this.fireTimer > 0) return;

        const weapon = this.currentWeapon;

        // Check ammo
        if (weapon.maxAmmo !== Infinity && this.ammo <= 0) {
            this.currentWeapon = { ...WEAPONS.PEASHOOTER, keywords: [] };
            return;
        }

        // Melee weapon
        if (weapon.isMelee) {
            this.performMeleeAttack();
            return;
        }

        let fireRate = weapon.fireRate;
        let damage = weapon.damage * this.damageMultiplier;

        // Apply keyword modifiers
        for (const keyword of weapon.keywords) {
            if (keyword.damageModifier) damage *= keyword.damageModifier;
            if (keyword.fireRateModifier) fireRate *= keyword.fireRateModifier;
        }

        this.fireTimer = fireRate;

        // Consume ammo
        if (weapon.maxAmmo !== Infinity) {
            this.ammo--;
            this.ammoPercent = this.ammo / this.maxAmmo;
        }

        // Calculate direction to mouse
        const dx = game.mouse.x - this.x;
        const dy = game.mouse.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / len;
        const ny = dy / len;

        // Check for triple keyword
        const hasTriple = weapon.keywords.some(k => k.effect === 'triple');

        if (hasTriple) {
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(ny, nx) + i * 0.26;
                createPlayerBullet(
                    this.x, this.y,
                    Math.cos(angle), Math.sin(angle),
                    weapon, damage * 0.5
                );
            }
        } else {
            createPlayerBullet(this.x, this.y, nx, ny, weapon, damage);
        }

        // Muzzle flash
        game.particles.push(createParticle(
            this.x + nx * 20, this.y + ny * 20,
            weapon.color, 50
        ));
    }

    performMeleeAttack() {
        if (this.isSwinging) return;

        const weapon = this.currentWeapon;
        this.isSwinging = true;
        this.swingTimer = weapon.fireRate / 1000;
        this.swingAngle = Math.atan2(game.mouse.y - this.y, game.mouse.x - this.x);

        // Consume ammo
        if (weapon.maxAmmo !== Infinity) {
            this.ammo--;
            this.ammoPercent = this.ammo / this.maxAmmo;
        }

        // Hit enemies in cone
        const coneAngle = weapon.coneAngle * Math.PI / 180;
        const range = weapon.coneRange;

        for (const enemy of game.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < range + enemy.size) {
                const angle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(angle - this.swingAngle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (angleDiff < coneAngle / 2) {
                    damageEnemy(enemy, weapon.damage * this.damageMultiplier);
                }
            }
        }

        // Destroy nearby enemy bullets
        game.enemyBullets = game.enemyBullets.filter(b => {
            const dx = b.x - this.x;
            const dy = b.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range) {
                const angle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(angle - this.swingAngle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                if (angleDiff < coneAngle / 2) {
                    return false;
                }
            }
            return true;
        });

        this.fireTimer = weapon.fireRate;
    }

    useBomb() {
        if (this.bombs <= 0) return false;

        this.bombs--;

        // Clear all enemy bullets
        game.enemyBullets = [];

        // Damage all enemies
        for (const enemy of game.enemies) {
            damageEnemy(enemy, 50);
        }

        // Screen flash
        game.particles.push({
            x: GAME_WIDTH / 2,
            y: ROOM_HEIGHT / 2,
            color: '#ffffff',
            life: 200,
            maxLife: 200,
            size: 800,
            type: 'flash'
        });

        // Multiplier penalty
        game.multiplier = Math.max(1.0, game.multiplier - 1.0);

        return true;
    }

    takeDamage(amount) {
        if (this.isInvincible) return;

        // Check shields first
        if (this.shields > 0) {
            this.shields -= amount;
            if (this.shields < 0) {
                this.hp += this.shields;
                this.shields = 0;
            }
        } else {
            this.hp -= amount;
        }

        // Multiplier penalty
        game.multiplier = Math.max(1.0, game.multiplier - 1.0);

        // Invincibility frames
        this.isInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;

        // Hit particles
        for (let i = 0; i < 10; i++) {
            game.particles.push(createParticle(this.x, this.y, '#ff0000', 300));
        }

        if (this.hp <= 0) {
            gameOver();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Invincibility flash
        if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Ship body
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(0, -this.spriteSize / 2);
        ctx.lineTo(-this.spriteSize / 2, this.spriteSize / 2);
        ctx.lineTo(0, this.spriteSize / 3);
        ctx.lineTo(this.spriteSize / 2, this.spriteSize / 2);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        if (!this.isDashing) {
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.ellipse(0, this.spriteSize / 2 + 5, 6, 8 + Math.random() * 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dash trail
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 30, 30, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Focus mode indicator
        if (this.isFocusing) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.hitboxRadius * 2, 0, Math.PI * 2);
            ctx.stroke();

            // Hitbox
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.hitboxRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sword swing arc
        if (this.isSwinging) {
            const weapon = this.currentWeapon;
            ctx.fillStyle = 'rgba(255, 136, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, weapon.coneRange,
                this.swingAngle - weapon.coneAngle * Math.PI / 360,
                this.swingAngle + weapon.coneAngle * Math.PI / 360);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// Bullet creation
function createPlayerBullet(x, y, dx, dy, weapon, damage) {
    const hasHoming = weapon.keywords && weapon.keywords.some(k => k.effect === 'homing');

    const bullet = {
        x, y,
        vx: dx * weapon.velocity,
        vy: dy * weapon.velocity,
        damage,
        size: weapon.projectileSize,
        color: weapon.color,
        piercing: weapon.piercing,
        explosive: weapon.explosive,
        explosionRadius: weapon.explosionRadius,
        isBeam: weapon.isBeam,
        homing: hasHoming,
        life: 3000
    };

    game.playerBullets.push(bullet);
}

function createEnemyBullet(x, y, dx, dy, speed, damage, size = 6, color = COLORS.enemyBullet) {
    game.enemyBullets.push({
        x, y,
        vx: dx * speed,
        vy: dy * speed,
        damage,
        size,
        color,
        life: 5000
    });
}

// Particle creation
function createParticle(x, y, color, life) {
    return {
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life,
        maxLife: life,
        size: 4 + Math.random() * 4
    };
}

// Enemy class
class Enemy {
    constructor(type, x, y) {
        const def = ENEMY_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.debris = def.debris;
        this.speed = def.speed;
        this.behavior = def.behavior;
        this.color = def.color;
        this.size = def.size;
        this.attacks = def.attacks.map(a => ({ ...a, timer: a.interval || 0 }));
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        this.wanderTimer = 0;
        this.slowFactor = 1.0;
        this.slowTimer = 0;
    }

    update(delta) {
        // Update slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= delta * 1000;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1.0;
            }
        }

        const speed = this.speed * this.slowFactor;

        // Behavior AI
        switch (this.behavior) {
            case 'chase':
                this.chase(game.player, speed, delta);
                break;
            case 'avoid_player':
                this.avoidPlayer(game.player, speed, delta);
                break;
            case 'stationary':
                // Don't move
                break;
            case 'wander':
                this.wander(speed, delta);
                break;
            case 'bounce':
                this.bounce(speed, delta);
                break;
            case 'dash_to_player':
                this.dashToPlayer(game.player, speed, delta);
                break;
        }

        // Keep in bounds
        this.x = Math.max(this.size, Math.min(GAME_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(ROOM_HEIGHT - this.size, this.y));

        // Update attacks
        for (const attack of this.attacks) {
            if (attack.onDeath) continue;

            attack.timer -= delta * 1000;
            if (attack.timer <= 0) {
                this.performAttack(attack);
                attack.timer = attack.interval;
            }
        }
    }

    chase(player, speed, delta) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        this.x += (dx / len) * speed * delta;
        this.y += (dy / len) * speed * delta;
    }

    avoidPlayer(player, speed, delta) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        this.x += (dx / len) * speed * delta;
        this.y += (dy / len) * speed * delta;
    }

    wander(speed, delta) {
        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0) {
            this.targetX = 50 + Math.random() * (GAME_WIDTH - 100);
            this.targetY = 50 + Math.random() * (ROOM_HEIGHT - 100);
            this.wanderTimer = 2 + Math.random() * 3;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        if (len > 5) {
            this.x += (dx / len) * speed * delta;
            this.y += (dy / len) * speed * delta;
        }
    }

    bounce(speed, delta) {
        if (this.vx === 0 && this.vy === 0) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        this.x += this.vx * delta;
        this.y += this.vy * delta;

        if (this.x <= this.size || this.x >= GAME_WIDTH - this.size) {
            this.vx *= -1;
        }
        if (this.y <= this.size || this.y >= ROOM_HEIGHT - this.size) {
            this.vy *= -1;
        }
    }

    dashToPlayer(player, speed, delta) {
        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0) {
            // Dash towards player position
            this.targetX = player.x;
            this.targetY = player.y;
            this.wanderTimer = 1.5 + Math.random();
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        if (len > 10) {
            this.x += (dx / len) * speed * delta;
            this.y += (dy / len) * speed * delta;
        }
    }

    performAttack(attack) {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        switch (attack.type) {
            case 'burst':
                for (let i = 0; i < attack.count; i++) {
                    setTimeout(() => {
                        if (this.hp > 0) {
                            const pdx = game.player.x - this.x;
                            const pdy = game.player.y - this.y;
                            const plen = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
                            createEnemyBullet(this.x, this.y, pdx / plen, pdy / plen, 200, attack.damage);
                        }
                    }, i * 100);
                }
                break;

            case 'spread':
                const baseAngle = Math.atan2(dy, dx);
                for (let i = 0; i < attack.count; i++) {
                    const offset = (i - (attack.count - 1) / 2) * (attack.angle * Math.PI / 180) / attack.count;
                    const angle = baseAngle + offset;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 180, attack.damage);
                }
                break;

            case 'ring':
                for (let i = 0; i < attack.count; i++) {
                    const angle = (Math.PI * 2 / attack.count) * i;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 150, attack.damage);
                }
                break;

            case 'fireball':
                createEnemyBullet(this.x, this.y, dx / len, dy / len, 120, attack.damage, 12, '#ff4400');
                break;
        }
    }

    onDeath() {
        // Check for death attacks
        for (const attack of this.attacks) {
            if (!attack.onDeath) continue;

            switch (attack.type) {
                case 'revenge_bullet':
                    const dx = game.player.x - this.x;
                    const dy = game.player.y - this.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    createEnemyBullet(this.x, this.y, dx / len, dy / len, 150, attack.damage, 8, COLORS.enemyBulletDestructible);
                    break;

                case 'split':
                    for (let i = 0; i < attack.count; i++) {
                        const angle = (Math.PI * 2 / attack.count) * i;
                        const newX = this.x + Math.cos(angle) * 20;
                        const newY = this.y + Math.sin(angle) * 20;
                        game.enemies.push(new Enemy('JELLY', newX, newY));
                    }
                    break;
            }
        }

        // Spawn debris pickup
        if (this.debris > 0) {
            game.pickups.push({
                x: this.x,
                y: this.y,
                type: 'debris',
                value: Math.floor(this.debris * game.multiplier),
                color: COLORS.debris,
                size: 8
            });
        }

        // Update multiplier
        const gain = game.multiplier >= 2.5 ? 0.01 : 0.05;
        game.multiplier = Math.min(3.0, game.multiplier + gain);

        // Death particles
        for (let i = 0; i < 15; i++) {
            game.particles.push(createParticle(this.x, this.y, this.color, 400));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Slow effect indicator
        if (this.slowFactor < 1.0) {
            ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;

            ctx.fillStyle = '#333';
            ctx.fillRect(-barWidth / 2, -this.size - 10, barWidth, barHeight);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-barWidth / 2, -this.size - 10, barWidth * hpPercent, barHeight);
        }

        ctx.restore();
    }
}

// Damage enemy
function damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    game.damageDealt += damage;

    // Hit particles
    for (let i = 0; i < 5; i++) {
        game.particles.push(createParticle(enemy.x, enemy.y, '#ffffff', 200));
    }

    // Screen shake on hit
    addScreenShake(2, 50);

    if (enemy.hp <= 0) {
        enemy.onDeath();
        game.enemies = game.enemies.filter(e => e !== enemy);
        game.totalKills++;
        game.killStreak++;
        game.killStreakTimer = 2;

        // Floating kill text
        if (game.killStreak > 1) {
            addFloatingText(enemy.x, enemy.y - 20, game.killStreak + 'x KILL!', '#ffff00');
        }
    }
}

// Boss class
class Boss {
    constructor(type, x, y) {
        const def = BOSS_TYPES[type];
        this.type = type;
        this.name = def.name;
        this.x = x;
        this.y = y;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.debris = def.debris;
        this.size = def.size;
        this.color = def.color;
        this.phases = def.phases;
        this.currentPhase = 0;
        this.attackTimer = 0;
        this.attackIndex = 0;
        this.spiralAngle = 0;
        this.isEnraged = false;
        this.shieldActive = false;
        this.chargeTarget = null;
        this.isCharging = false;
        this.vx = 0;
        this.vy = 0;
    }

    update(delta) {
        // Check phase transitions
        const hpPercent = this.hp / this.maxHp;
        for (let i = this.phases.length - 1; i >= 0; i--) {
            if (hpPercent <= this.phases[i].hpThreshold) {
                if (this.currentPhase !== i) {
                    this.currentPhase = i;
                    addFloatingText(this.x, this.y - 60, 'PHASE ' + (i + 1) + '!', '#ff4444');
                    addScreenShake(20, 300);
                }
                break;
            }
        }

        // Movement
        if (this.isCharging && this.chargeTarget) {
            const dx = this.chargeTarget.x - this.x;
            const dy = this.chargeTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                this.x += this.vx * delta;
                this.y += this.vy * delta;
            } else {
                this.isCharging = false;
                // Bullet burst on charge end
                for (let i = 0; i < 8; i++) {
                    const angle = Math.PI * 2 / 8 * i;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 150, 1);
                }
            }
        } else {
            // Hover movement
            this.x += Math.sin(Date.now() / 1000) * 50 * delta;
            this.y += Math.cos(Date.now() / 800) * 30 * delta;
            this.x = Math.max(100, Math.min(GAME_WIDTH - 100, this.x));
            this.y = Math.max(80, Math.min(200, this.y));
        }

        // Attack timer
        this.attackTimer -= delta * 1000;
        if (this.attackTimer <= 0) {
            this.performPhaseAttack();
            this.attackTimer = this.isEnraged ? 800 : 1500;
        }
    }

    performPhaseAttack() {
        const phase = this.phases[this.currentPhase];
        const attackType = phase.attacks[this.attackIndex % phase.attacks.length];
        this.attackIndex++;

        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        switch (attackType) {
            case 'spread5':
            case 'spread7':
                const count = attackType === 'spread5' ? 5 : 7;
                const baseAngle = Math.atan2(dy, dx);
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * 0.2;
                    const angle = baseAngle + offset;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 200, 1, 8);
                }
                break;

            case 'ring8':
            case 'ring12':
            case 'ring16':
                const ringCount = parseInt(attackType.replace('ring', ''));
                for (let i = 0; i < ringCount; i++) {
                    const angle = Math.PI * 2 / ringCount * i;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 150, 1, 6);
                }
                break;

            case 'spawn_minions':
                for (let i = 0; i < 3; i++) {
                    const angle = Math.PI * 2 / 3 * i;
                    const spawnX = this.x + Math.cos(angle) * 60;
                    const spawnY = this.y + Math.sin(angle) * 60;
                    game.enemies.push(new Enemy('SWARMER', spawnX, spawnY));
                }
                break;

            case 'spiral':
                for (let i = 0; i < 5; i++) {
                    const angle = this.spiralAngle + i * 0.5;
                    createEnemyBullet(this.x, this.y, Math.cos(angle), Math.sin(angle), 180, 1, 6);
                }
                this.spiralAngle += 0.3;
                break;

            case 'charge':
            case 'charge_fast':
                this.isCharging = true;
                this.chargeTarget = { x: player.x, y: player.y };
                const speed = attackType === 'charge_fast' ? 600 : 400;
                this.vx = dx / len * speed;
                this.vy = dy / len * speed;
                break;

            case 'laser_sweep':
                // Fire a line of bullets
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        if (this.hp > 0) {
                            createEnemyBullet(this.x, this.y, dx / len, dy / len, 300, 1, 4);
                        }
                    }, i * 50);
                }
                break;

            case 'enrage':
                this.isEnraged = true;
                addFloatingText(this.x, this.y - 40, 'ENRAGED!', '#ff0000');
                break;

            case 'burst3':
            case 'burst5':
                const burstCount = attackType === 'burst3' ? 3 : 5;
                for (let i = 0; i < burstCount; i++) {
                    setTimeout(() => {
                        if (this.hp > 0) {
                            const pdx = game.player.x - this.x;
                            const pdy = game.player.y - this.y;
                            const plen = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
                            createEnemyBullet(this.x, this.y, pdx / plen, pdy / plen, 250, 1, 10);
                        }
                    }, i * 150);
                }
                break;

            case 'saw_throw':
                createEnemyBullet(this.x, this.y, dx / len, dy / len, 200, 2, 20, '#888888');
                break;
        }
    }

    takeDamage(damage) {
        if (this.shieldActive) {
            damage *= 0.2;
        }
        this.hp -= damage;
        game.damageDealt += damage;

        addScreenShake(5, 100);

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        game.boss = null;
        game.bossesDefeated++;

        // Big explosion
        for (let i = 0; i < 50; i++) {
            game.particles.push(createParticle(this.x, this.y, this.color, 600));
        }

        addScreenShake(30, 500);
        addFloatingText(this.x, this.y, 'BOSS DEFEATED!', '#ffff00');

        // Drop debris
        game.pickups.push({
            x: this.x,
            y: this.y,
            type: 'debris',
            value: this.debris,
            color: COLORS.debris,
            size: 16
        });

        // Boss reward choice - HP or Damage
        game.pickups.push({
            x: this.x - 60,
            y: this.y + 60,
            type: 'hp',
            value: 2,
            color: COLORS.health,
            size: 16
        });

        game.pickups.push({
            x: this.x + 60,
            y: this.y + 60,
            type: 'damage_boost',
            value: 0.05,
            color: '#ff8800',
            size: 16
        });

        // Room cleared
        game.roomCleared = true;
        game.currentRoom.cleared = true;
        for (const door of game.doors) {
            door.locked = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Boss body
        ctx.fillStyle = this.color;
        ctx.beginPath();

        // More complex boss shape
        for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 2 / 8 * i + Date.now() / 1000;
            const radius = this.size + Math.sin(Date.now() / 200 + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Inner glow
        ctx.fillStyle = this.isEnraged ? '#ff0000' : '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-15, -10, 8, 0, Math.PI * 2);
        ctx.arc(15, -10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-15, -10, 4, 0, Math.PI * 2);
        ctx.arc(15, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // HP bar
        const barWidth = 200;
        const barHeight = 12;
        const barX = GAME_WIDTH / 2 - barWidth / 2;
        const barY = 30;
        const hpPercent = this.hp / this.maxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = this.isEnraged ? '#ff0000' : '#ff4444';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, GAME_WIDTH / 2, barY - 5);
    }
}

// Screen shake
function addScreenShake(intensity, duration) {
    game.screenShake = duration;
    game.screenShakeIntensity = Math.max(game.screenShakeIntensity, intensity);
}

// Floating text
function addFloatingText(x, y, text, color) {
    game.floatingTexts.push({
        x, y,
        text,
        color,
        life: 1500,
        maxLife: 1500,
        vy: -50
    });
}

// Chain lightning effect
function createChainLightning(startX, startY, targets, damage) {
    let current = { x: startX, y: startY };
    const chain = [];

    for (const target of targets.slice(0, 3)) {
        chain.push({
            x1: current.x, y1: current.y,
            x2: target.x, y2: target.y,
            life: 200
        });
        damageEnemy(target, damage * 0.5);
        current = { x: target.x, y: target.y };
    }

    game.chainLightning.push(...chain);
}

// Floor map generation
function generateFloor(floorNum) {
    const gridSize = 5;
    const grid = [];

    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            grid[y][x] = null;
        }
    }

    // Start room at bottom center
    const startX = Math.floor(gridSize / 2);
    const startY = gridSize - 1;
    grid[startY][startX] = { type: ROOM_TYPE.START, cleared: true, x: startX, y: startY };

    // Generate path to boss
    let currentX = startX;
    let currentY = startY;
    const path = [{ x: currentX, y: currentY }];

    while (currentY > 0) {
        const moves = [];
        if (currentX > 0 && !grid[currentY][currentX - 1]) moves.push({ dx: -1, dy: 0 });
        if (currentX < gridSize - 1 && !grid[currentY][currentX + 1]) moves.push({ dx: 1, dy: 0 });
        if (currentY > 0 && !grid[currentY - 1][currentX]) moves.push({ dx: 0, dy: -1 });

        if (moves.length === 0) break;

        // Prefer moving up
        const move = Math.random() < 0.6 && moves.some(m => m.dy === -1)
            ? moves.find(m => m.dy === -1)
            : moves[Math.floor(Math.random() * moves.length)];

        currentX += move.dx;
        currentY += move.dy;

        grid[currentY][currentX] = { type: ROOM_TYPE.NORMAL, cleared: false, x: currentX, y: currentY };
        path.push({ x: currentX, y: currentY });
    }

    // Make last room the boss
    grid[currentY][currentX].type = ROOM_TYPE.BOSS;

    // Add miniboss room
    if (path.length > 3) {
        const minibossIdx = Math.floor(path.length / 2);
        const minibossPos = path[minibossIdx];
        if (grid[minibossPos.y][minibossPos.x].type === ROOM_TYPE.NORMAL) {
            grid[minibossPos.y][minibossPos.x].type = ROOM_TYPE.MINIBOSS;
        }
    }

    // Add side rooms
    for (const pos of path) {
        if (Math.random() < 0.3) {
            const sides = [];
            if (pos.x > 0 && !grid[pos.y][pos.x - 1]) sides.push({ x: pos.x - 1, y: pos.y });
            if (pos.x < gridSize - 1 && !grid[pos.y][pos.x + 1]) sides.push({ x: pos.x + 1, y: pos.y });

            if (sides.length > 0) {
                const side = sides[Math.floor(Math.random() * sides.length)];
                const types = [ROOM_TYPE.NORMAL, ROOM_TYPE.SHOP, ROOM_TYPE.WEAPON, ROOM_TYPE.EMPTY];
                grid[side.y][side.x] = {
                    type: types[Math.floor(Math.random() * types.length)],
                    cleared: false,
                    x: side.x,
                    y: side.y
                };
            }
        }
    }

    // Connect rooms
    const rooms = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x]) {
                const room = grid[y][x];
                room.connections = [];

                // Check adjacent rooms
                if (x > 0 && grid[y][x - 1]) room.connections.push({ dir: 'left', room: grid[y][x - 1] });
                if (x < gridSize - 1 && grid[y][x + 1]) room.connections.push({ dir: 'right', room: grid[y][x + 1] });
                if (y > 0 && grid[y - 1][x]) room.connections.push({ dir: 'up', room: grid[y - 1][x] });
                if (y < gridSize - 1 && grid[y + 1][x]) room.connections.push({ dir: 'down', room: grid[y + 1][x] });

                rooms.push(room);
            }
        }
    }

    return {
        grid,
        rooms,
        startRoom: grid[startY][startX],
        currentRoom: grid[startY][startX]
    };
}

// Generate room enemies
function generateRoomEnemies(room, floor) {
    const enemies = [];

    if (room.type === ROOM_TYPE.START || room.type === ROOM_TYPE.SHOP ||
        room.type === ROOM_TYPE.WEAPON || room.type === ROOM_TYPE.EMPTY) {
        return enemies;
    }

    // Boss room - spawn a boss instead of regular enemies
    if (room.type === ROOM_TYPE.BOSS) {
        const bossTypes = Object.keys(BOSS_TYPES);
        const bossType = bossTypes[floor % bossTypes.length];
        game.boss = new Boss(bossType, GAME_WIDTH / 2, 150);
        // Scale boss HP by floor
        game.boss.hp *= (1 + (floor - 1) * 0.3);
        game.boss.maxHp = game.boss.hp;
        return enemies;
    }

    const enemyPool = ['GHOST', 'DRONE', 'TURRET', 'SEEKER', 'SWARMER'];
    if (floor >= 2) enemyPool.push('PYROMANCER', 'BLOB');

    let count = 4 + Math.floor(Math.random() * 4);
    if (room.type === ROOM_TYPE.MINIBOSS) count = 10;

    for (let i = 0; i < count; i++) {
        const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
        const x = 100 + Math.random() * (GAME_WIDTH - 200);
        const y = 100 + Math.random() * (ROOM_HEIGHT - 200);
        enemies.push(new Enemy(type, x, y));
    }

    // Scale HP by floor
    const hpScale = 1 + (floor - 1) * 0.2;
    enemies.forEach(e => {
        e.hp *= hpScale;
        e.maxHp *= hpScale;
    });

    return enemies;
}

// Generate room pickups
function generateRoomPickups(room) {
    const pickups = [];

    if (room.type === ROOM_TYPE.SHOP) {
        // Shop items
        const items = [
            { type: 'hp', value: 1, price: 150, color: COLORS.health },
            { type: 'ammo', value: 25, price: 100, color: COLORS.ammo },
            { type: 'bomb', value: 1, price: 150, color: '#ff8800' },
            { type: 'shield', value: 1, price: 100, color: COLORS.shield }
        ];

        for (let i = 0; i < 4; i++) {
            pickups.push({
                x: 150 + i * 150,
                y: ROOM_HEIGHT / 2,
                ...items[i],
                isShopItem: true,
                size: 16
            });
        }
    } else if (room.type === ROOM_TYPE.WEAPON) {
        // Generate random weapon
        const weaponTypes = Object.keys(WEAPONS).filter(k => k !== 'PEASHOOTER');
        const weaponKey = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        const weapon = { ...WEAPONS[weaponKey], keywords: [] };

        // Add random keywords
        const keywordKeys = Object.keys(KEYWORDS);
        const numKeywords = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numKeywords; i++) {
            const kw = KEYWORDS[keywordKeys[Math.floor(Math.random() * keywordKeys.length)]];
            if (!weapon.keywords.includes(kw)) {
                weapon.keywords.push(kw);
            }
        }

        pickups.push({
            x: GAME_WIDTH / 2,
            y: ROOM_HEIGHT / 2,
            type: 'weapon',
            weapon,
            color: weapon.color,
            size: 20
        });
    }

    return pickups;
}

// Enter room
function enterRoom(room) {
    game.currentRoom = room;
    game.floorMap.currentRoom = room;

    // Reset player position based on entry direction
    game.player.x = GAME_WIDTH / 2;
    game.player.y = ROOM_HEIGHT - 80;

    // Generate enemies if not cleared
    if (!room.cleared) {
        game.enemies = generateRoomEnemies(room, game.floor);
    } else {
        game.enemies = [];
    }

    // Generate pickups
    game.pickups = generateRoomPickups(room);

    // Clear bullets
    game.playerBullets = [];
    game.enemyBullets = [];

    // Set up doors
    game.doors = [];
    for (const conn of room.connections) {
        let dx = 0, dy = 0, x = 0, y = 0;
        switch (conn.dir) {
            case 'left': x = 20; y = ROOM_HEIGHT / 2; dx = -1; break;
            case 'right': x = GAME_WIDTH - 20; y = ROOM_HEIGHT / 2; dx = 1; break;
            case 'up': x = GAME_WIDTH / 2; y = 20; dy = -1; break;
            case 'down': x = GAME_WIDTH / 2; y = ROOM_HEIGHT - 20; dy = 1; break;
        }
        game.doors.push({ x, y, dx, dy, targetRoom: conn.room, locked: !room.cleared && game.enemies.length > 0 });
    }

    game.roomCleared = room.cleared;
}

// Check room cleared
function checkRoomCleared() {
    if (game.roomCleared) return;

    if (game.enemies.length === 0) {
        game.roomCleared = true;
        game.currentRoom.cleared = true;
        game.roomsCleared++;

        // Unlock doors
        for (const door of game.doors) {
            door.locked = false;
        }

        // Bomb recharge
        game.bombChargeProgress++;
        if (game.bombChargeProgress >= 3) {
            game.bombChargeProgress = 0;
            if (game.player.bombs < game.player.maxBombs) {
                game.player.bombs++;
            }
        }

        // Random drop
        if (Math.random() < 0.3) {
            const drops = ['hp', 'ammo', 'bomb'];
            const dropType = drops[Math.floor(Math.random() * drops.length)];
            game.pickups.push({
                x: GAME_WIDTH / 2,
                y: ROOM_HEIGHT / 2,
                type: dropType,
                value: dropType === 'hp' ? 1 : dropType === 'ammo' ? 10 : 1,
                color: dropType === 'hp' ? COLORS.health : dropType === 'ammo' ? COLORS.ammo : '#ff8800',
                size: 12
            });
        }
    }
}

// Check door collision
function checkDoorCollision() {
    for (const door of game.doors) {
        if (door.locked) continue;

        const dx = game.player.x - door.x;
        const dy = game.player.y - door.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            enterRoom(door.targetRoom);

            // Position player at opposite door
            if (door.dx === -1) game.player.x = GAME_WIDTH - 80;
            else if (door.dx === 1) game.player.x = 80;
            else if (door.dy === -1) game.player.y = ROOM_HEIGHT - 80;
            else if (door.dy === 1) game.player.y = 80;

            return;
        }
    }
}

// Update bullets
function updateBullets(delta) {
    // Player bullets
    for (let i = game.playerBullets.length - 1; i >= 0; i--) {
        const b = game.playerBullets[i];

        // Homing
        if (b.homing && game.enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            for (const enemy of game.enemies) {
                const dist = Math.sqrt((enemy.x - b.x) ** 2 + (enemy.y - b.y) ** 2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            }
            if (closest) {
                const dx = closest.x - b.x;
                const dy = closest.y - b.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx += dx / len * 500 * delta;
                b.vy += dy / len * 500 * delta;
                const newSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx = b.vx / newSpeed * speed;
                b.vy = b.vy / newSpeed * speed;
            }
        }

        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.life -= delta * 1000;

        // Check bounds
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > ROOM_HEIGHT || b.life <= 0) {
            game.playerBullets.splice(i, 1);
            continue;
        }

        // Check enemy collision
        let hitEnemy = false;
        for (const enemy of game.enemies) {
            const dist = Math.sqrt((b.x - enemy.x) ** 2 + (b.y - enemy.y) ** 2);
            if (dist < enemy.size + b.size) {
                damageEnemy(enemy, b.damage);
                hitEnemy = true;

                // Check for freeze keyword
                const weapon = game.player.currentWeapon;
                if (weapon.keywords && weapon.keywords.some(k => k.effect === 'freeze')) {
                    enemy.slowFactor = 0.5;
                    enemy.slowTimer = 2000;
                }

                // Check for chain keyword
                if (weapon.keywords && weapon.keywords.some(k => k.effect === 'chain')) {
                    const nearbyEnemies = game.enemies.filter(e => e !== enemy)
                        .sort((a, c) => {
                            const distA = Math.sqrt((a.x - enemy.x) ** 2 + (a.y - enemy.y) ** 2);
                            const distC = Math.sqrt((c.x - enemy.x) ** 2 + (c.y - enemy.y) ** 2);
                            return distA - distC;
                        });
                    if (nearbyEnemies.length > 0) {
                        createChainLightning(enemy.x, enemy.y, nearbyEnemies.slice(0, 2), b.damage);
                    }
                }

                // Check for poison keyword
                if (weapon.keywords && weapon.keywords.some(k => k.effect === 'poison')) {
                    enemy.poisoned = true;
                    enemy.poisonTimer = 3000;
                    enemy.poisonDamage = b.damage * 0.1;
                }

                if (b.explosive) {
                    // Explosion damage
                    for (const e of game.enemies) {
                        if (e === enemy) continue;
                        const eDist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
                        if (eDist < b.explosionRadius) {
                            damageEnemy(e, b.damage * 0.5);
                        }
                    }
                    // Explosion particles
                    for (let j = 0; j < 20; j++) {
                        game.particles.push(createParticle(b.x, b.y, '#ff4400', 300));
                    }
                }

                if (!b.piercing) {
                    game.playerBullets.splice(i, 1);
                }
                break;
            }
        }

        // Check boss collision
        if (!hitEnemy && game.boss) {
            const dist = Math.sqrt((b.x - game.boss.x) ** 2 + (b.y - game.boss.y) ** 2);
            if (dist < game.boss.size + b.size) {
                game.boss.takeDamage(b.damage);

                if (b.explosive) {
                    for (let j = 0; j < 20; j++) {
                        game.particles.push(createParticle(b.x, b.y, '#ff4400', 300));
                    }
                }

                if (!b.piercing) {
                    game.playerBullets.splice(i, 1);
                }
            }
        }
    }

    // Enemy bullets
    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
        const b = game.enemyBullets[i];
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.life -= delta * 1000;

        // Check bounds
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > ROOM_HEIGHT || b.life <= 0) {
            game.enemyBullets.splice(i, 1);
            continue;
        }

        // Check player collision
        const dist = Math.sqrt((b.x - game.player.x) ** 2 + (b.y - game.player.y) ** 2);
        if (dist < game.player.hitboxRadius + b.size) {
            game.player.takeDamage(b.damage);
            game.enemyBullets.splice(i, 1);
        }
    }
}

// Update pickups
function updatePickups() {
    for (let i = game.pickups.length - 1; i >= 0; i--) {
        const p = game.pickups[i];
        const dist = Math.sqrt((p.x - game.player.x) ** 2 + (p.y - game.player.y) ** 2);

        if (dist < 30) {
            if (p.isShopItem) {
                // Check if player has enough debris
                if (game.debris >= p.price) {
                    game.debris -= p.price;
                    applyPickup(p);
                    game.pickups.splice(i, 1);
                }
            } else {
                applyPickup(p);
                game.pickups.splice(i, 1);
            }
        }
    }
}

function applyPickup(pickup) {
    switch (pickup.type) {
        case 'hp':
            game.player.hp = Math.min(game.player.maxHP, game.player.hp + pickup.value);
            addFloatingText(game.player.x, game.player.y - 30, '+' + pickup.value + ' HP', COLORS.health);
            break;
        case 'shield':
            game.player.shields = Math.min(game.player.maxShields, game.player.shields + pickup.value);
            addFloatingText(game.player.x, game.player.y - 30, '+SHIELD', COLORS.shield);
            break;
        case 'ammo':
            game.player.ammo = Math.min(game.player.maxAmmo, game.player.ammo + pickup.value);
            game.player.ammoPercent = game.player.ammo / game.player.maxAmmo;
            addFloatingText(game.player.x, game.player.y - 30, '+AMMO', COLORS.ammo);
            break;
        case 'bomb':
            game.player.bombs = Math.min(game.player.maxBombs, game.player.bombs + pickup.value);
            addFloatingText(game.player.x, game.player.y - 30, '+BOMB', '#ff8800');
            break;
        case 'debris':
            game.debris += pickup.value;
            addFloatingText(game.player.x, game.player.y - 30, '+' + pickup.value + ' DEBRIS', COLORS.debris);
            break;
        case 'damage_boost':
            game.player.damageMultiplier += pickup.value;
            addFloatingText(game.player.x, game.player.y - 30, '+5% DAMAGE!', '#ff8800');
            break;
        case 'max_hp':
            game.player.maxHP += pickup.value;
            game.player.hp += pickup.value;
            addFloatingText(game.player.x, game.player.y - 30, '+MAX HP!', COLORS.health);
            break;
        case 'weapon':
            game.player.currentWeapon = pickup.weapon;
            game.player.ammo = pickup.weapon.maxAmmo === Infinity ? 100 : pickup.weapon.maxAmmo;
            game.player.maxAmmo = pickup.weapon.maxAmmo === Infinity ? 100 : pickup.weapon.maxAmmo;
            game.player.ammoPercent = 1.0;
            addFloatingText(game.player.x, game.player.y - 30, 'NEW WEAPON!', '#ff88ff');
            break;
    }
}

// Update particles
function updateParticles(delta) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];

        if (p.type === 'flash') {
            p.life -= delta * 1000;
            if (p.life <= 0) {
                game.particles.splice(i, 1);
            }
            continue;
        }

        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= delta * 1000;

        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
}

// Check enemy contact damage
function checkEnemyCollision() {
    for (const enemy of game.enemies) {
        const dist = Math.sqrt((enemy.x - game.player.x) ** 2 + (enemy.y - game.player.y) ** 2);
        if (dist < enemy.size + game.player.hitboxRadius) {
            game.player.takeDamage(1);
        }
    }
}

// Game over
function gameOver() {
    game.state = STATE.GAME_OVER;
}

// Victory
function victory() {
    game.state = STATE.VICTORY;
}

// Draw functions
function drawRoom() {
    // Background
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, GAME_WIDTH, ROOM_HEIGHT);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROOM_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < ROOM_HEIGHT; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }

    // Walls
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, GAME_WIDTH, 16);
    ctx.fillRect(0, ROOM_HEIGHT - 16, GAME_WIDTH, 16);
    ctx.fillRect(0, 0, 16, ROOM_HEIGHT);
    ctx.fillRect(GAME_WIDTH - 16, 0, 16, ROOM_HEIGHT);

    // Doors
    for (const door of game.doors) {
        ctx.fillStyle = door.locked ? COLORS.doorLocked : COLORS.door;
        ctx.beginPath();
        ctx.arc(door.x, door.y, 20, 0, Math.PI * 2);
        ctx.fill();

        if (!door.locked) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', door.x, door.y + 4);
        }
    }
}

function drawBullets() {
    // Player bullets
    for (const b of game.playerBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = b.color + '44';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemy bullets
    for (const b of game.enemyBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawPickups() {
    for (const p of game.pickups) {
        ctx.fillStyle = p.color;

        if (p.type === 'weapon') {
            // Weapon pickup
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.lineTo(p.x, p.y + p.size);
            ctx.lineTo(p.x - p.size, p.y);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.weapon.name, p.x, p.y + p.size + 15);
            if (p.weapon.keywords.length > 0) {
                ctx.fillText(p.weapon.keywords.map(k => k.name).join('+'), p.x, p.y + p.size + 27);
            }
        } else {
            // Other pickups
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            if (p.isShopItem) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.price + 'D', p.x, p.y + p.size + 15);
            }
        }
    }
}

function drawParticles() {
    for (const p of game.particles) {
        if (p.type === 'flash') {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life / p.maxLife * 0.5})`;
            ctx.fillRect(0, 0, GAME_WIDTH, ROOM_HEIGHT);
            continue;
        }

        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawUI() {
    // UI background
    ctx.fillStyle = COLORS.ui;
    ctx.fillRect(0, ROOM_HEIGHT, GAME_WIDTH, UI_HEIGHT);

    const player = game.player;

    // HP
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP:', 20, ROOM_HEIGHT + 25);

    for (let i = 0; i < player.maxHP; i++) {
        ctx.fillStyle = i < player.hp ? COLORS.health : '#333';
        ctx.beginPath();
        ctx.arc(60 + i * 20, ROOM_HEIGHT + 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Shields
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SHIELD:', 20, ROOM_HEIGHT + 50);

    for (let i = 0; i < player.maxShields; i++) {
        ctx.fillStyle = i < player.shields ? COLORS.shield : '#333';
        ctx.beginPath();
        ctx.arc(90 + i * 20, ROOM_HEIGHT + 45, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bombs
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BOMBS:', 20, ROOM_HEIGHT + 75);

    for (let i = 0; i < player.maxBombs; i++) {
        ctx.fillStyle = i < player.bombs ? '#ff8800' : '#333';
        ctx.fillRect(85 + i * 18, ROOM_HEIGHT + 65, 14, 14);
    }

    // Weapon info
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(player.currentWeapon.name, GAME_WIDTH / 2, ROOM_HEIGHT + 25);

    if (player.currentWeapon.keywords.length > 0) {
        ctx.fillStyle = '#88ff88';
        ctx.fillText(player.currentWeapon.keywords.map(k => k.name).join(' + '), GAME_WIDTH / 2, ROOM_HEIGHT + 42);
    }

    // Ammo bar
    const ammoBarWidth = 150;
    ctx.fillStyle = '#333';
    ctx.fillRect(GAME_WIDTH / 2 - ammoBarWidth / 2, ROOM_HEIGHT + 55, ammoBarWidth, 12);
    ctx.fillStyle = COLORS.ammo;
    ctx.fillRect(GAME_WIDTH / 2 - ammoBarWidth / 2, ROOM_HEIGHT + 55, ammoBarWidth * player.ammoPercent, 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.currentWeapon.maxAmmo === Infinity ? 'INF' : player.ammo + '/' + player.maxAmmo, GAME_WIDTH / 2, ROOM_HEIGHT + 85);

    // Debris and multiplier
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.debris;
    ctx.fillText('DEBRIS: ' + game.debris, GAME_WIDTH - 20, ROOM_HEIGHT + 25);

    ctx.fillStyle = game.multiplier >= 2.5 ? '#ff8800' : '#ffffff';
    ctx.fillText('x' + game.multiplier.toFixed(2), GAME_WIDTH - 20, ROOM_HEIGHT + 45);

    // Floor info
    ctx.fillStyle = '#888888';
    ctx.fillText('FLOOR ' + game.floor, GAME_WIDTH - 20, ROOM_HEIGHT + 70);

    // Dash cooldown
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'left';
        ctx.fillText('DASH: ' + player.dashCooldown.toFixed(1) + 's', 200, ROOM_HEIGHT + 100);
    } else {
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'left';
        ctx.fillText('DASH: READY', 200, ROOM_HEIGHT + 100);
    }

    // Controls hint
    ctx.fillStyle = '#555555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move  SHIFT:Focus  SPACE:Fire  Z:Dash  X:Bomb  TAB:Map', GAME_WIDTH / 2, ROOM_HEIGHT + 115);
}

function drawFloorMap() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FLOOR ' + game.floor + ' MAP', GAME_WIDTH / 2, 50);

    const cellSize = 60;
    const offsetX = (GAME_WIDTH - game.floorMap.grid[0].length * cellSize) / 2;
    const offsetY = 100;

    for (let y = 0; y < game.floorMap.grid.length; y++) {
        for (let x = 0; x < game.floorMap.grid[y].length; x++) {
            const room = game.floorMap.grid[y][x];
            if (!room) continue;

            const rx = offsetX + x * cellSize;
            const ry = offsetY + y * cellSize;

            // Room color by type
            let color = '#333';
            if (room.cleared) color = '#225522';
            if (room === game.currentRoom) color = '#00ff88';
            if (room.type === ROOM_TYPE.BOSS) color = room.cleared ? '#882222' : '#ff4444';
            if (room.type === ROOM_TYPE.SHOP) color = '#888822';
            if (room.type === ROOM_TYPE.WEAPON) color = '#882288';

            ctx.fillStyle = color;
            ctx.fillRect(rx + 5, ry + 5, cellSize - 10, cellSize - 10);

            // Room type label
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            let label = '';
            switch (room.type) {
                case ROOM_TYPE.START: label = 'START'; break;
                case ROOM_TYPE.BOSS: label = 'BOSS'; break;
                case ROOM_TYPE.MINIBOSS: label = 'MINI'; break;
                case ROOM_TYPE.SHOP: label = 'SHOP'; break;
                case ROOM_TYPE.WEAPON: label = 'WPN'; break;
            }
            ctx.fillText(label, rx + cellSize / 2, ry + cellSize / 2 + 4);

            // Draw connections
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 3;
            for (const conn of room.connections) {
                let dx = 0, dy = 0;
                switch (conn.dir) {
                    case 'right': dx = cellSize; break;
                    case 'down': dy = cellSize; break;
                }
                if (dx > 0 || dy > 0) {
                    ctx.beginPath();
                    ctx.moveTo(rx + cellSize / 2, ry + cellSize / 2);
                    ctx.lineTo(rx + cellSize / 2 + dx, ry + cellSize / 2 + dy);
                    ctx.stroke();
                }
            }
        }
    }

    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.fillText('Press TAB to close', GAME_WIDTH / 2, GAME_HEIGHT - 50);
}

function drawMenu() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#00ff88';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAR OF PROVIDENCE', GAME_WIDTH / 2, 150);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('CLONE', GAME_WIDTH / 2, 190);

    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.fillText('A bullet-hell roguelike', GAME_WIDTH / 2, 250);

    // Ship preview
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 350);
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-25, 30);
    ctx.lineTo(0, 15);
    ctx.lineTo(25, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#00ff88';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to start', GAME_WIDTH / 2, 480);

    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | SHIFT: Focus | SPACE: Fire', GAME_WIDTH / 2, 530);
    ctx.fillText('Z: Dash | X: Bomb | TAB: Map', GAME_WIDTH / 2, 550);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('Floor Reached: ' + game.floor, GAME_WIDTH / 2, 280);
    ctx.fillText('Rooms Cleared: ' + game.roomsCleared, GAME_WIDTH / 2, 310);
    ctx.fillText('Debris Collected: ' + game.debris, GAME_WIDTH / 2, 340);

    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, 450);
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

    ctx.font = '16px monospace';
    ctx.fillText('Press ESC to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#00ff88';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', GAME_WIDTH / 2, 150);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('You have conquered the facility!', GAME_WIDTH / 2, 220);

    // Stats
    ctx.font = '16px monospace';
    ctx.fillText('Final Statistics:', GAME_WIDTH / 2, 280);

    ctx.fillStyle = '#888888';
    ctx.fillText('Floors Cleared: ' + game.floor, GAME_WIDTH / 2, 320);
    ctx.fillText('Rooms Cleared: ' + game.roomsCleared, GAME_WIDTH / 2, 350);
    ctx.fillText('Enemies Killed: ' + game.totalKills, GAME_WIDTH / 2, 380);
    ctx.fillText('Bosses Defeated: ' + game.bossesDefeated, GAME_WIDTH / 2, 410);
    ctx.fillText('Debris Collected: ' + game.debris, GAME_WIDTH / 2, 440);
    ctx.fillText('Total Damage: ' + Math.floor(game.damageDealt), GAME_WIDTH / 2, 470);

    ctx.fillStyle = '#00ff88';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to play again', GAME_WIDTH / 2, 530);
}

function drawFloatingTexts() {
    for (const ft of game.floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    }
}

function drawChainLightning() {
    for (const chain of game.chainLightning) {
        const alpha = chain.life / 200;
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(chain.x1, chain.y1);

        // Jagged lightning effect
        const dx = chain.x2 - chain.x1;
        const dy = chain.y2 - chain.y1;
        const segments = 5;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = chain.x1 + dx * t + (Math.random() - 0.5) * 20;
            const y = chain.y1 + dy * t + (Math.random() - 0.5) * 20;
            ctx.lineTo(x, y);
        }

        ctx.stroke();

        // Glow
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function drawKillStreak() {
    if (game.killStreak > 2 && game.killStreakTimer > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = game.killStreakTimer / 2;
        ctx.fillText(game.killStreak + 'x COMBO!', GAME_WIDTH / 2, 80);
        ctx.globalAlpha = 1;
    }
}

// Main game loop
function gameLoop(timestamp) {
    const delta = Math.min((timestamp - game.lastTime) / 1000, 0.1);
    game.lastTime = timestamp;

    // Update screen shake
    if (game.screenShake > 0) {
        game.screenShake -= delta * 1000;
        if (game.screenShake <= 0) {
            game.screenShakeIntensity = 0;
        }
    }

    // Update kill streak timer
    if (game.killStreakTimer > 0) {
        game.killStreakTimer -= delta;
        if (game.killStreakTimer <= 0) {
            game.killStreak = 0;
        }
    }

    // Update floating texts
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
        const ft = game.floatingTexts[i];
        ft.y += ft.vy * delta;
        ft.life -= delta * 1000;
        if (ft.life <= 0) {
            game.floatingTexts.splice(i, 1);
        }
    }

    // Update chain lightning
    for (let i = game.chainLightning.length - 1; i >= 0; i--) {
        game.chainLightning[i].life -= delta * 1000;
        if (game.chainLightning[i].life <= 0) {
            game.chainLightning.splice(i, 1);
        }
    }

    // Clear screen
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Apply screen shake
    if (game.screenShake > 0 && game.state === STATE.PLAYING) {
        const shakeX = (Math.random() - 0.5) * game.screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * game.screenShakeIntensity;
        ctx.save();
        ctx.translate(shakeX, shakeY);
    }

    switch (game.state) {
        case STATE.MENU:
            drawMenu();
            break;

        case STATE.PLAYING:
            // Update
            game.player.isFocusing = game.keys['ShiftLeft'] || game.keys['ShiftRight'] || game.mouse.right;

            game.player.update(delta);

            // Auto-fire if holding space/click
            if (game.keys['Space'] || game.mouse.down) {
                game.player.fire();
            }

            // Update enemies
            for (const enemy of game.enemies) {
                enemy.update(delta);
            }

            // Update boss
            if (game.boss) {
                game.boss.update(delta);
            }

            updateBullets(delta);
            updatePickups();
            updateParticles(delta);
            checkEnemyCollision();
            checkRoomCleared();
            checkDoorCollision();

            // Check for floor completion (all bosses beaten)
            if (game.currentRoom.type === ROOM_TYPE.BOSS && game.roomCleared && !game.boss) {
                // Check if this is the exit - advance to next floor
                const exitDoor = game.doors.find(d => d.dy === -1);
                if (exitDoor && game.floor < 6) {
                    exitDoor.isFloorExit = true;
                }
            }

            // Draw
            drawRoom();
            drawPickups();
            drawParticles();
            drawChainLightning();
            for (const enemy of game.enemies) {
                enemy.draw();
            }
            if (game.boss) {
                game.boss.draw();
            }
            drawBullets();
            game.player.draw();
            drawFloatingTexts();
            drawKillStreak();
            drawUI();
            break;

        case STATE.FLOOR_MAP:
            drawRoom();
            drawPickups();
            for (const enemy of game.enemies) {
                enemy.draw();
            }
            drawBullets();
            game.player.draw();
            drawUI();
            drawFloorMap();
            break;

        case STATE.PAUSED:
            drawRoom();
            drawPickups();
            for (const enemy of game.enemies) {
                enemy.draw();
            }
            drawBullets();
            game.player.draw();
            drawUI();
            drawPaused();
            break;

        case STATE.GAME_OVER:
            drawGameOver();
            break;

        case STATE.VICTORY:
            drawVictory();
            break;
    }

    // Restore from screen shake
    if (game.screenShake > 0 && game.state === STATE.PLAYING) {
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// Start new game
function startGame() {
    game.state = STATE.PLAYING;
    game.floor = 1;
    game.player = new Player();
    game.enemies = [];
    game.playerBullets = [];
    game.enemyBullets = [];
    game.pickups = [];
    game.particles = [];
    game.debris = 0;
    game.multiplier = 1.0;
    game.roomsCleared = 0;
    game.bombChargeProgress = 0;

    // Generate floor
    game.floorMap = generateFloor(game.floor);
    enterRoom(game.floorMap.startRoom);
}

// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.code] = true;

    if (game.state === STATE.MENU) {
        if (e.code === 'Space') {
            startGame();
        }
    } else if (game.state === STATE.PLAYING) {
        if (e.code === 'KeyZ') {
            game.player.dash();
        }
        if (e.code === 'KeyX') {
            game.player.useBomb();
        }
        if (e.code === 'Tab') {
            e.preventDefault();
            game.state = STATE.FLOOR_MAP;
        }
        if (e.code === 'Escape') {
            game.state = STATE.PAUSED;
        }
    } else if (game.state === STATE.FLOOR_MAP) {
        if (e.code === 'Tab' || e.code === 'Escape') {
            e.preventDefault();
            game.state = STATE.PLAYING;
        }
    } else if (game.state === STATE.PAUSED) {
        if (e.code === 'Escape') {
            game.state = STATE.PLAYING;
        }
    } else if (game.state === STATE.GAME_OVER) {
        if (e.code === 'Space') {
            game.state = STATE.MENU;
        }
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        game.mouse.down = true;
    }
    if (e.button === 2) {
        game.mouse.right = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        game.mouse.down = false;
    }
    if (e.button === 2) {
        game.mouse.right = false;
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Start game loop
requestAnimationFrame(gameLoop);
