// Starscape Clone - LittleJS Implementation
// Space combat mining game

'use strict';

// ==================== CONSTANTS ====================
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORLD_SIZE = 1600;

// Ship physics
const PHYSICS = {
    thrustForce: 300,
    maxSpeed: 400,
    drag: 0.98,
    rotationSpeed: 180,
    shipMass: 10
};

// Resources
const RESOURCE_CONFIG = {
    gravityBeamRange: 150,
    gravityBeamPullSpeed: 200,
    collectionRadius: 30
};

// Colors
const COLORS = {
    player: new Color(0.29, 0.56, 0.85),
    shield: new Color(0, 0.75, 1),
    aegis: new Color(0.75, 0.75, 0.75),
    enemy: new Color(0.55, 0, 0),
    enemyGlow: new Color(1, 0.27, 0),
    blaster: new Color(0, 1, 1),
    missile: new Color(1, 0.39, 0.28),
    greenMineral: new Color(0.2, 0.8, 0.2),
    yellowMineral: new Color(1, 0.84, 0),
    purpleMineral: new Color(0.58, 0.2, 0.83),
    asteroid: new Color(0.4, 0.3, 0.25)
};

// Weapons
const WEAPONS = {
    blaster: {
        tier1: { name: 'Basic Blaster', damage: 8, fireRate: 5, speed: 600, color: COLORS.blaster },
        tier2: { name: 'Twin Blaster', damage: 12, fireRate: 6, speed: 650, color: COLORS.blaster, twin: true },
        tier3: { name: 'Pulse Cannon', damage: 20, fireRate: 4, speed: 700, color: new Color(1, 0, 1) },
        tier4: { name: 'Plasma Blaster', damage: 35, fireRate: 5, speed: 750, color: new Color(1, 0.27, 0) }
    },
    missile: {
        tier1: { name: 'Rocket Pod', damage: 30, ammo: 20, speed: 300, color: COLORS.missile, homing: false },
        tier2: { name: 'Homing Missile', damage: 40, ammo: 15, speed: 350, color: COLORS.missile, homing: true },
        tier3: { name: 'Swarm Launcher', damage: 25, ammo: 10, speed: 400, color: COLORS.missile, homing: true, count: 4 },
        tier4: { name: 'Devastator Torpedo', damage: 150, ammo: 5, speed: 250, color: new Color(1, 0.2, 0.2), homing: true }
    },
    ion: {
        tier1: { name: 'Ion Bolt', damage: 5, shieldDamage: 20, fireRate: 3, speed: 500, color: new Color(0.6, 0.13, 0.52) }
    }
};

// Enemies
const ENEMIES = {
    drone: { hp: 15, damage: 5, speed: 250, score: 10 },
    fighter: { hp: 40, damage: 10, speed: 200, score: 50 },
    heavyFighter: { hp: 80, damage: 15, speed: 150, score: 100 },
    bomber: { hp: 60, damage: 50, speed: 100, score: 150 },
    destroyer: { hp: 200, damage: 25, speed: 80, score: 500, shield: 100 },
    carrier: { hp: 300, damage: 10, speed: 50, score: 750, shield: 150 }
};

// Bosses (appear every 10 waves)
const BOSSES = {
    archnidQueen: {
        name: 'Archnid Queen',
        hp: 1000,
        shield: 200,
        damage: 30,
        speed: 60,
        size: 64,
        score: 5000,
        attacks: ['droneSwarm', 'acidSpit', 'charge']
    },
    hiveMind: {
        name: 'Hive Mind',
        hp: 1500,
        shield: 400,
        damage: 20,
        speed: 40,
        size: 80,
        score: 7500,
        attacks: ['beamSweep', 'missileSalvo', 'droneCloud']
    },
    destroyerPrime: {
        name: 'Destroyer Prime',
        hp: 2500,
        shield: 600,
        damage: 40,
        speed: 30,
        size: 96,
        score: 10000,
        attacks: ['turretBarrage', 'ramming', 'shieldBoost']
    }
};

// ==================== GAME STATE ====================
let gameState = 'menu';
let player = null;
let aegis = null;
let asteroids = [];
let enemies = [];
let projectiles = [];
let resources = [];
let particles = [];
let pickupResources = { green: 0, yellow: 0, purple: 0 };
let score = 0;
let currentWave = 0;
let waveTimer = 0;
let waveEnemiesRemaining = 0;
let paused = false;
let shieldHitEffects = [];
let damageNumbers = [];
let asteroidRespawnTimer = 0;
let boss = null;
let bossActive = false;
let bossesDefeated = 0;
const VICTORY_BOSS_COUNT = 3;

// ==================== CLASSES ====================

class Ship {
    constructor(x, y) {
        this.pos = vec2(x, y);
        this.vel = vec2(0, 0);
        this.rotation = -PI / 2;
        this.hp = 50;
        this.maxHP = 50;
        this.shield = 30;
        this.maxShield = 30;
        this.shieldRecharge = 5;
        this.size = 12;

        this.fireTimer = 0;
        this.blasterTier = 1;  // Can be 1-4
        this.missileTier = 1;  // Can be 1-4

        this.missiles = 20;
        this.maxMissiles = 20;
        this.missileTimer = 0;

        this.gravityBeamActive = false;
        this.isDocked = false;

        this.cargoCapacity = 100;
        this.cargo = { green: 0, yellow: 0, purple: 0 };

        // Ion weapon (unlocked later)
        this.hasIon = false;
        this.ionTimer = 0;
    }

    get cargoAmount() {
        return this.cargo.green + this.cargo.yellow + this.cargo.purple;
    }

    update() {
        if (this.isDocked) return;

        // Controls
        let thrust = 0;
        if (keyIsDown('ArrowUp') || keyIsDown('KeyW')) thrust = 1;
        if (keyIsDown('ArrowDown') || keyIsDown('KeyS')) thrust = -0.5;

        let turnDir = 0;
        if (keyIsDown('ArrowLeft') || keyIsDown('KeyA')) turnDir = 1;
        if (keyIsDown('ArrowRight') || keyIsDown('KeyD')) turnDir = -1;

        // Apply rotation
        this.rotation += turnDir * PHYSICS.rotationSpeed * (PI / 180) * (1/60);

        // Apply thrust
        if (thrust !== 0) {
            const force = PHYSICS.thrustForce * thrust / (PHYSICS.shipMass + this.cargoAmount * 0.1);
            this.vel.x += Math.cos(this.rotation) * force * (1/60);
            this.vel.y += Math.sin(this.rotation) * force * (1/60);
        }

        // Apply drag
        this.vel = this.vel.scale(PHYSICS.drag);

        // Cap speed
        const speed = this.vel.length();
        if (speed > PHYSICS.maxSpeed) {
            this.vel = this.vel.normalize(PHYSICS.maxSpeed);
        }

        // Update position
        this.pos = this.pos.add(this.vel.scale(1/60));

        // Clamp to world bounds
        this.pos.x = clamp(this.pos.x, -WORLD_SIZE/2, WORLD_SIZE/2);
        this.pos.y = clamp(this.pos.y, -WORLD_SIZE/2, WORLD_SIZE/2);

        // Fire primary weapon
        const blaster = WEAPONS.blaster['tier' + this.blasterTier];
        this.fireTimer -= 1/60;
        if (keyIsDown('KeyQ') && this.fireTimer <= 0) {
            this.firePrimary();
            this.fireTimer = 1 / blaster.fireRate;
        }

        // Fire missiles
        this.missileTimer -= 1/60;
        if (keyIsDown('KeyW') && this.missileTimer <= 0 && this.missiles > 0) {
            this.fireMissile();
            this.missileTimer = 0.5;
        }

        // Fire ion weapon (Space key)
        if (this.hasIon) {
            this.ionTimer -= 1/60;
            if (keyIsDown('Space') && this.ionTimer <= 0) {
                this.fireIon();
                this.ionTimer = 1 / WEAPONS.ion.tier1.fireRate;
            }
        }

        // Gravity beam
        this.gravityBeamActive = keyIsDown('KeyE');
        if (this.gravityBeamActive) {
            this.pullResources();
        }

        // Dock/undock
        if (keyWasPressed('KeyR')) {
            this.toggleDock();
        }

        // Shield recharge
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRecharge * (1/60));
        }
    }

    firePrimary() {
        const blaster = WEAPONS.blaster['tier' + this.blasterTier];

        // Twin blaster fires two projectiles
        if (blaster.twin) {
            const offset = 5;
            const perpX = -Math.sin(this.rotation) * offset;
            const perpY = Math.cos(this.rotation) * offset;

            for (let sign of [-1, 1]) {
                const bullet = {
                    pos: this.pos.add(vec2(
                        Math.cos(this.rotation) * 15 + perpX * sign,
                        Math.sin(this.rotation) * 15 + perpY * sign
                    )),
                    vel: vec2(Math.cos(this.rotation) * blaster.speed, Math.sin(this.rotation) * blaster.speed),
                    damage: blaster.damage,
                    friendly: true,
                    lifetime: 2,
                    size: 3,
                    color: blaster.color
                };
                projectiles.push(bullet);
            }
        } else {
            const bullet = {
                pos: this.pos.add(vec2(Math.cos(this.rotation) * 15, Math.sin(this.rotation) * 15)),
                vel: vec2(Math.cos(this.rotation) * blaster.speed, Math.sin(this.rotation) * blaster.speed),
                damage: blaster.damage,
                friendly: true,
                lifetime: 2,
                size: this.blasterTier >= 3 ? 5 : 3,
                color: blaster.color
            };
            projectiles.push(bullet);
        }
    }

    fireMissile() {
        if (this.missiles <= 0) return;

        const missileType = WEAPONS.missile['tier' + this.missileTier];
        const count = missileType.count || 1;

        for (let i = 0; i < count; i++) {
            if (this.missiles <= 0) break;
            this.missiles--;

            const spreadAngle = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
            const angle = this.rotation + spreadAngle;

            const missile = {
                pos: this.pos.add(vec2(Math.cos(angle) * 15, Math.sin(angle) * 15)),
                vel: vec2(Math.cos(angle) * missileType.speed, Math.sin(angle) * missileType.speed),
                rotation: angle,
                damage: missileType.damage,
                friendly: true,
                lifetime: 4,
                size: 6,
                color: missileType.color,
                isMissile: true,
                homing: missileType.homing
            };
            projectiles.push(missile);
        }
    }

    fireIon() {
        const ion = WEAPONS.ion.tier1;
        const bullet = {
            pos: this.pos.add(vec2(Math.cos(this.rotation) * 15, Math.sin(this.rotation) * 15)),
            vel: vec2(Math.cos(this.rotation) * ion.speed, Math.sin(this.rotation) * ion.speed),
            damage: ion.damage,
            shieldDamage: ion.shieldDamage,
            friendly: true,
            lifetime: 2,
            size: 4,
            color: ion.color,
            isIon: true
        };
        projectiles.push(bullet);
    }

    pullResources() {
        for (let res of resources) {
            const dist = this.pos.distance(res.pos);
            if (dist < RESOURCE_CONFIG.gravityBeamRange) {
                const dir = this.pos.subtract(res.pos).normalize();
                res.vel = res.vel.add(dir.scale(RESOURCE_CONFIG.gravityBeamPullSpeed * (1/60)));
            }
        }
    }

    toggleDock() {
        const distToAegis = this.pos.distance(aegis.pos);
        if (distToAegis < 100) {
            if (!this.isDocked) {
                // Dock
                this.isDocked = true;
                this.vel = vec2(0, 0);

                // Transfer cargo
                pickupResources.green += this.cargo.green;
                pickupResources.yellow += this.cargo.yellow;
                pickupResources.purple += this.cargo.purple;
                this.cargo = { green: 0, yellow: 0, purple: 0 };

                // Repair ship
                const repairCost = Math.ceil((this.maxHP - this.hp) * 0.5);
                if (pickupResources.green >= repairCost) {
                    pickupResources.green -= repairCost;
                    this.hp = this.maxHP;
                }

                // Restore shields
                this.shield = this.maxShield;

                // Refill missiles
                const missileCost = (this.maxMissiles - this.missiles) * 2;
                if (pickupResources.green >= missileCost) {
                    pickupResources.green -= missileCost;
                    this.missiles = this.maxMissiles;
                }

                // Auto-upgrade weapons if enough resources (1-2-3 keys for manual)
                this.checkUpgrades();
            } else {
                // Undock
                this.isDocked = false;
            }
        }
    }

    checkUpgrades() {
        // Blaster upgrades (costs: tier2=50Y, tier3=100Y, tier4=200Y)
        const blasterCosts = [0, 50, 100, 200];
        if (this.blasterTier < 4 && pickupResources.yellow >= blasterCosts[this.blasterTier]) {
            pickupResources.yellow -= blasterCosts[this.blasterTier];
            this.blasterTier++;
        }

        // Missile upgrades (costs: tier2=30P, tier3=60P, tier4=120P)
        const missileCosts = [0, 30, 60, 120];
        if (this.missileTier < 4 && pickupResources.purple >= missileCosts[this.missileTier]) {
            pickupResources.purple -= missileCosts[this.missileTier];
            this.missileTier++;
        }

        // Unlock ion weapon (cost: 50Y + 50P)
        if (!this.hasIon && pickupResources.yellow >= 50 && pickupResources.purple >= 50) {
            pickupResources.yellow -= 50;
            pickupResources.purple -= 50;
            this.hasIon = true;
        }
    }

    takeDamage(damage) {
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, damage);
            this.shield -= absorbed;
            damage -= absorbed;
        }
        this.hp -= damage;
        return this.hp <= 0;
    }

    draw() {
        // Draw ship triangle
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        // Ship body
        drawTile(this.pos, vec2(this.size * 2 / 16), 0, vec2(16), COLORS.player, this.rotation);

        // Simple triangle
        const p1 = this.pos.add(vec2(cos * this.size, sin * this.size));
        const p2 = this.pos.add(vec2(cos * -this.size * 0.7 + sin * this.size * 0.6, sin * -this.size * 0.7 - cos * this.size * 0.6));
        const p3 = this.pos.add(vec2(cos * -this.size * 0.7 - sin * this.size * 0.6, sin * -this.size * 0.7 + cos * this.size * 0.6));

        drawLine(p1, p2, 0.1, COLORS.player);
        drawLine(p2, p3, 0.1, COLORS.player);
        drawLine(p3, p1, 0.1, COLORS.player);

        // Shield visual
        if (this.shield > 0) {
            drawCircle(this.pos, this.size + 4, new Color(0, 0.5, 1, 0.3));
        }

        // Gravity beam visual
        if (this.gravityBeamActive) {
            drawCircle(this.pos, RESOURCE_CONFIG.gravityBeamRange, new Color(0, 1, 0, 0.1));
        }

        // Thrust visual
        if ((keyIsDown('ArrowUp') || keyIsDown('KeyW')) && !this.isDocked) {
            const thrustPos = this.pos.add(vec2(-cos * this.size, -sin * this.size));
            drawCircle(thrustPos, 4, new Color(1, 0.5, 0, 0.8));
        }
    }
}

class Aegis {
    constructor(x, y) {
        this.pos = vec2(x, y);
        this.hp = 500;
        this.maxHP = 500;
        this.shield = 200;
        this.maxShield = 200;
        this.shieldRecharge = 10;
        this.size = 48;

        // Upgrade tiers
        this.hullTier = 0;  // 0-3
        this.shieldTier = 0;  // 0-3
        this.turretTier = 0;  // 0-3 (affects damage and fire rate)
        this.turretSlots = 4;  // Can be upgraded to 6, 8

        this.turrets = [];
        this.initTurrets();
    }

    initTurrets() {
        this.turrets = [];
        for (let i = 0; i < this.turretSlots; i++) {
            this.turrets.push({
                angle: (PI * 2 / this.turretSlots) * i,
                fireTimer: rand(0, 1),
                fireRate: 3 + this.turretTier * 2,
                damage: 5 + this.turretTier * 5,
                range: 300 + this.turretTier * 50
            });
        }
    }

    upgrade(type) {
        const costs = {
            hull: [{ g: 50, y: 30, p: 20 }, { g: 100, y: 60, p: 40 }, { g: 200, y: 120, p: 80 }],
            shield: [{ g: 40, y: 50, p: 30 }, { g: 80, y: 100, p: 60 }, { g: 160, y: 200, p: 120 }],
            turret: [{ g: 25, y: 35, p: 50 }, { g: 50, y: 70, p: 100 }, { g: 100, y: 140, p: 200 }],
            slots: [{ g: 60, y: 40, p: 30 }, { g: 120, y: 80, p: 60 }]
        };

        if (type === 'hull' && this.hullTier < 3) {
            const cost = costs.hull[this.hullTier];
            if (pickupResources.green >= cost.g && pickupResources.yellow >= cost.y && pickupResources.purple >= cost.p) {
                pickupResources.green -= cost.g;
                pickupResources.yellow -= cost.y;
                pickupResources.purple -= cost.p;
                this.hullTier++;
                this.maxHP = [500, 750, 1000, 1500][this.hullTier];
                this.hp = Math.min(this.hp, this.maxHP);
                return true;
            }
        } else if (type === 'shield' && this.shieldTier < 3) {
            const cost = costs.shield[this.shieldTier];
            if (pickupResources.green >= cost.g && pickupResources.yellow >= cost.y && pickupResources.purple >= cost.p) {
                pickupResources.green -= cost.g;
                pickupResources.yellow -= cost.y;
                pickupResources.purple -= cost.p;
                this.shieldTier++;
                this.maxShield = [200, 350, 500, 600][this.shieldTier];
                this.shieldRecharge = [10, 15, 20, 30][this.shieldTier];
                return true;
            }
        } else if (type === 'turret' && this.turretTier < 3) {
            const cost = costs.turret[this.turretTier];
            if (pickupResources.green >= cost.g && pickupResources.yellow >= cost.y && pickupResources.purple >= cost.p) {
                pickupResources.green -= cost.g;
                pickupResources.yellow -= cost.y;
                pickupResources.purple -= cost.p;
                this.turretTier++;
                this.initTurrets();
                return true;
            }
        } else if (type === 'slots' && this.turretSlots < 8) {
            const slotIndex = this.turretSlots === 4 ? 0 : 1;
            const cost = costs.slots[slotIndex];
            if (pickupResources.green >= cost.g && pickupResources.yellow >= cost.y && pickupResources.purple >= cost.p) {
                pickupResources.green -= cost.g;
                pickupResources.yellow -= cost.y;
                pickupResources.purple -= cost.p;
                this.turretSlots += 2;
                this.initTurrets();
                return true;
            }
        }
        return false;
    }

    update() {
        // Shield recharge
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRecharge * (1/60));
        }

        // Turret auto-fire
        for (let turret of this.turrets) {
            turret.fireTimer -= 1/60;
            if (turret.fireTimer <= 0) {
                const target = this.findTarget(turret);
                if (target) {
                    this.fireTurret(turret, target);
                    turret.fireTimer = 1 / turret.fireRate;
                }
            }
        }
    }

    findTarget(turret) {
        let closest = null;
        let closestDist = turret.range;

        for (let enemy of enemies) {
            const dist = this.pos.distance(enemy.pos);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    fireTurret(turret, target) {
        const angle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
        const turretPos = this.pos.add(vec2(Math.cos(turret.angle) * this.size, Math.sin(turret.angle) * this.size));

        const bullet = {
            pos: turretPos,
            vel: vec2(Math.cos(angle) * 400, Math.sin(angle) * 400),
            damage: turret.damage,
            friendly: true,
            lifetime: 1.5,
            size: 2,
            color: new Color(0.5, 0.8, 1)
        };
        projectiles.push(bullet);
    }

    takeDamage(damage) {
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, damage);
            this.shield -= absorbed;
            damage -= absorbed;
        }
        this.hp -= damage;
        return this.hp <= 0;
    }

    draw() {
        // Main station body
        drawCircle(this.pos, this.size, COLORS.aegis);
        drawCircle(this.pos, this.size - 5, new Color(0.5, 0.5, 0.5));

        // Shield
        if (this.shield > 0) {
            const shieldAlpha = 0.2 + (this.shield / this.maxShield) * 0.2;
            drawCircle(this.pos, this.size + 10, new Color(0, 0.5, 1, shieldAlpha));
        }

        // Turrets
        for (let turret of this.turrets) {
            const turretPos = this.pos.add(vec2(Math.cos(turret.angle) * this.size, Math.sin(turret.angle) * this.size));
            drawCircle(turretPos, 6, new Color(0.3, 0.3, 0.4));
        }

        // HP bar
        const hpPercent = this.hp / this.maxHP;
        drawRect(this.pos.add(vec2(0, -this.size - 15)), vec2(60, 6), new Color(0.2, 0.2, 0.2));
        drawRect(this.pos.add(vec2(-30 + 30 * hpPercent, -this.size - 15)), vec2(60 * hpPercent, 4), new Color(0.2, 0.8, 0.2));
    }
}

class Asteroid {
    constructor(x, y, size) {
        this.pos = vec2(x, y);
        this.size = size;
        this.hp = size === 'small' ? 20 : size === 'medium' ? 50 : 100;
        this.maxHP = this.hp;
        this.radius = size === 'small' ? 16 : size === 'medium' ? 32 : 48;
        this.rotation = rand(PI * 2);
        this.rotSpeed = rand(-0.5, 0.5);
    }

    update() {
        this.rotation += this.rotSpeed * (1/60);
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.drop();
            return true;
        }
        return false;
    }

    drop() {
        const dropCount = this.size === 'small' ? randInt(3, 6) : this.size === 'medium' ? randInt(8, 15) : randInt(20, 30);

        for (let i = 0; i < dropCount; i++) {
            const type = rand() < 0.5 ? 'green' : rand() < 0.7 ? 'yellow' : 'purple';
            const angle = rand(PI * 2);
            const speed = rand(30, 80);

            resources.push({
                pos: this.pos.add(vec2(rand(-this.radius, this.radius), rand(-this.radius, this.radius))),
                vel: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
                type: type,
                lifetime: 30
            });
        }
    }

    draw() {
        // Asteroid body
        drawCircle(this.pos, this.radius, COLORS.asteroid);

        // Texture details
        for (let i = 0; i < 5; i++) {
            const angle = this.rotation + (PI * 2 / 5) * i;
            const pos = this.pos.add(vec2(Math.cos(angle) * this.radius * 0.5, Math.sin(angle) * this.radius * 0.5));
            drawCircle(pos, this.radius * 0.2, new Color(0.3, 0.2, 0.15));
        }
    }
}

class Enemy {
    constructor(x, y, type) {
        this.pos = vec2(x, y);
        this.vel = vec2(0, 0);
        this.rotation = rand(PI * 2);
        this.type = type;

        const data = ENEMIES[type];
        this.hp = data.hp;
        this.maxHP = data.hp;
        this.damage = data.damage;
        this.speed = data.speed;
        this.score = data.score;

        this.size = type === 'drone' ? 8 : type === 'fighter' ? 12 :
                    type === 'bomber' ? 14 : type === 'destroyer' ? 24 :
                    type === 'carrier' ? 32 : 16;
        this.fireTimer = rand(1, 3);
        this.behavior = type === 'drone' ? 'swarm' :
                       type === 'fighter' ? 'pursue' :
                       type === 'bomber' ? 'attackStation' :
                       type === 'destroyer' ? 'capital' :
                       type === 'carrier' ? 'spawnDrones' : 'strafe';
        this.swarmPhase = rand(PI * 2);

        // Shield for destroyer/carrier
        this.shield = data.shield || 0;
        this.maxShield = this.shield;

        // Carrier drone spawning
        this.droneCount = 0;
        this.maxDrones = 10;
        this.spawnTimer = 0;

        // Destroyer turrets
        this.turrets = type === 'destroyer' ? [
            { angle: PI/4, fireTimer: 0 },
            { angle: -PI/4, fireTimer: 0 },
            { angle: 3*PI/4, fireTimer: 0 },
            { angle: -3*PI/4, fireTimer: 0 }
        ] : [];
    }

    update() {
        // AI behavior
        const target = player.isDocked ? aegis : player;
        const dx = target.pos.x - this.pos.x;
        const dy = target.pos.y - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToTarget = Math.atan2(dy, dx);

        switch (this.behavior) {
            case 'swarm':
                this.swarmPhase += (1/60) * 3;
                const offset = Math.sin(this.swarmPhase) * 0.5;
                this.rotation = angleToTarget + offset;

                if (dist > 100) {
                    this.vel.x += Math.cos(this.rotation) * this.speed * (1/60);
                    this.vel.y += Math.sin(this.rotation) * this.speed * (1/60);
                }
                break;

            case 'pursue':
                this.rotation = angleToTarget;
                this.vel.x += Math.cos(this.rotation) * this.speed * (1/60);
                this.vel.y += Math.sin(this.rotation) * this.speed * (1/60);
                break;

            case 'strafe':
                if (dist > 250) {
                    this.rotation = angleToTarget;
                } else if (dist < 150) {
                    this.rotation = angleToTarget + PI;
                } else {
                    this.rotation = angleToTarget + PI / 2;
                }
                this.vel.x += Math.cos(this.rotation) * this.speed * 0.5 * (1/60);
                this.vel.y += Math.sin(this.rotation) * this.speed * 0.5 * (1/60);
                break;

            case 'attackStation':
                // Bombers prioritize attacking the Aegis
                const aegisAngle = Math.atan2(aegis.pos.y - this.pos.y, aegis.pos.x - this.pos.x);
                this.rotation = aegisAngle;
                this.vel.x += Math.cos(this.rotation) * this.speed * (1/60);
                this.vel.y += Math.sin(this.rotation) * this.speed * (1/60);
                break;

            case 'capital':
                // Destroyers move slowly, fire turrets independently
                this.rotation = angleToTarget;
                this.vel.x += Math.cos(this.rotation) * this.speed * 0.3 * (1/60);
                this.vel.y += Math.sin(this.rotation) * this.speed * 0.3 * (1/60);

                // Update turrets
                for (let turret of this.turrets) {
                    turret.fireTimer -= 1/60;
                    if (turret.fireTimer <= 0) {
                        this.fireTurret(turret, target);
                        turret.fireTimer = rand(1, 2);
                    }
                }
                break;

            case 'spawnDrones':
                // Carriers stay at range, spawn drones
                if (dist < 400) {
                    this.rotation = angleToTarget + PI;
                    this.vel.x += Math.cos(this.rotation) * this.speed * (1/60);
                    this.vel.y += Math.sin(this.rotation) * this.speed * (1/60);
                } else {
                    this.rotation = angleToTarget;
                }

                // Spawn timer
                this.spawnTimer -= 1/60;
                if (this.spawnTimer <= 0 && this.droneCount < this.maxDrones) {
                    this.spawnDrone();
                    this.droneCount++;
                    this.spawnTimer = 3;
                }
                break;
        }

        // Apply drag and cap speed
        this.vel = this.vel.scale(0.95);
        const speed = this.vel.length();
        if (speed > this.speed) {
            this.vel = this.vel.normalize(this.speed);
        }

        // Update position
        this.pos = this.pos.add(this.vel.scale(1/60));

        // Fire at target
        this.fireTimer -= 1/60;
        if (this.fireTimer <= 0 && dist < 400) {
            this.fire(target);
            this.fireTimer = rand(1, 3);
        }
    }

    fire(target) {
        // Bombers target Aegis specifically
        const actualTarget = this.behavior === 'attackStation' ? aegis : target;
        const angle = Math.atan2(actualTarget.pos.y - this.pos.y, actualTarget.pos.x - this.pos.x);

        const bullet = {
            pos: this.pos.add(vec2(Math.cos(angle) * this.size, Math.sin(angle) * this.size)),
            vel: vec2(Math.cos(angle) * 250, Math.sin(angle) * 250),
            damage: this.damage,
            friendly: false,
            lifetime: 3,
            size: this.type === 'bomber' ? 6 : 3,
            color: this.type === 'bomber' ? new Color(1, 0.5, 0) : COLORS.enemyGlow
        };
        projectiles.push(bullet);
    }

    fireTurret(turret, target) {
        const turretPos = this.pos.add(vec2(
            Math.cos(this.rotation + turret.angle) * this.size * 0.8,
            Math.sin(this.rotation + turret.angle) * this.size * 0.8
        ));
        const angle = Math.atan2(target.pos.y - turretPos.y, target.pos.x - turretPos.x);

        const bullet = {
            pos: turretPos,
            vel: vec2(Math.cos(angle) * 300, Math.sin(angle) * 300),
            damage: 8,
            friendly: false,
            lifetime: 2,
            size: 3,
            color: new Color(1, 0.2, 0.2)
        };
        projectiles.push(bullet);
    }

    spawnDrone() {
        const angle = rand(PI * 2);
        const spawnPos = this.pos.add(vec2(Math.cos(angle) * this.size, Math.sin(angle) * this.size));
        enemies.push(new Enemy(spawnPos.x, spawnPos.y, 'drone'));
        waveEnemiesRemaining++;
    }

    takeDamage(damage) {
        // Shield absorbs damage first
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, damage);
            this.shield -= absorbed;
            damage -= absorbed;
        }
        this.hp -= damage;
        return this.hp <= 0;
    }

    draw() {
        // Shield visual for shielded enemies
        if (this.shield > 0) {
            const shieldAlpha = 0.2 + (this.shield / this.maxShield) * 0.2;
            drawCircle(this.pos, this.size + 4, new Color(0.6, 0, 0.8, shieldAlpha));
        }

        // Enemy body - different colors by type
        const bodyColor = this.type === 'bomber' ? new Color(0.8, 0.4, 0) :
                         this.type === 'destroyer' ? new Color(0.4, 0.2, 0.2) :
                         this.type === 'carrier' ? new Color(0.3, 0.1, 0.3) : COLORS.enemy;
        drawCircle(this.pos, this.size, bodyColor);

        // Destroyer turrets
        if (this.type === 'destroyer') {
            for (let turret of this.turrets) {
                const turretPos = this.pos.add(vec2(
                    Math.cos(this.rotation + turret.angle) * this.size * 0.8,
                    Math.sin(this.rotation + turret.angle) * this.size * 0.8
                ));
                drawCircle(turretPos, 4, new Color(0.6, 0.3, 0.3));
            }
        }

        // Carrier hangar bays
        if (this.type === 'carrier') {
            drawRect(this.pos.add(vec2(-this.size * 0.5, 0)), vec2(8, 16), new Color(0.2, 0.05, 0.2));
            drawRect(this.pos.add(vec2(this.size * 0.5, 0)), vec2(8, 16), new Color(0.2, 0.05, 0.2));
        }

        // Eye/cockpit
        const eyePos = this.pos.add(vec2(Math.cos(this.rotation) * this.size * 0.4, Math.sin(this.rotation) * this.size * 0.4));
        drawCircle(eyePos, this.size * 0.3, COLORS.enemyGlow);

        // HP bar if damaged
        if (this.hp < this.maxHP) {
            const barWidth = this.size * 2;
            const hpPercent = this.hp / this.maxHP;
            drawRect(this.pos.add(vec2(0, -this.size - 8)), vec2(barWidth, 4), new Color(0.3, 0, 0));
            drawRect(this.pos.add(vec2(-barWidth/2 + barWidth * hpPercent/2, -this.size - 8)), vec2(barWidth * hpPercent, 3), new Color(1, 0, 0));
        }

        // Shield bar for shielded enemies
        if (this.maxShield > 0 && this.shield < this.maxShield) {
            const barWidth = this.size * 2;
            const shieldPercent = this.shield / this.maxShield;
            drawRect(this.pos.add(vec2(0, -this.size - 14)), vec2(barWidth, 3), new Color(0.1, 0, 0.2));
            drawRect(this.pos.add(vec2(-barWidth/2 + barWidth * shieldPercent/2, -this.size - 14)), vec2(barWidth * shieldPercent, 2), new Color(0.6, 0, 0.8));
        }
    }
}

class Boss {
    constructor(x, y, type) {
        this.pos = vec2(x, y);
        this.vel = vec2(0, 0);
        this.rotation = PI;
        this.type = type;

        const data = BOSSES[type];
        this.name = data.name;
        this.hp = data.hp;
        this.maxHP = data.hp;
        this.shield = data.shield;
        this.maxShield = data.shield;
        this.damage = data.damage;
        this.speed = data.speed;
        this.size = data.size;
        this.score = data.score;
        this.attacks = data.attacks;

        this.attackTimer = 3;
        this.currentAttack = 0;
        this.chargeTarget = null;
        this.isCharging = false;
        this.phase = 1;
    }

    update() {
        const target = player.isDocked ? aegis : player;
        const dx = target.pos.x - this.pos.x;
        const dy = target.pos.y - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToTarget = Math.atan2(dy, dx);

        // Phase transition
        const hpPercent = this.hp / this.maxHP;
        if (hpPercent < 0.5 && this.phase === 1) {
            this.phase = 2;
            spawnExplosion(this.pos, this.size, new Color(1, 0.5, 0));
            // Spawn minions on phase change
            for (let i = 0; i < 5; i++) {
                const angle = (PI * 2 / 5) * i;
                enemies.push(new Enemy(
                    this.pos.x + Math.cos(angle) * 100,
                    this.pos.y + Math.sin(angle) * 100,
                    'fighter'
                ));
                waveEnemiesRemaining++;
            }
        }

        // Movement - circle around target
        if (!this.isCharging) {
            if (dist > 300) {
                this.rotation = angleToTarget;
            } else if (dist < 200) {
                this.rotation = angleToTarget + PI;
            } else {
                this.rotation = angleToTarget + PI / 2;
            }
            this.vel.x += Math.cos(this.rotation) * this.speed * 0.5 * (1/60);
            this.vel.y += Math.sin(this.rotation) * this.speed * 0.5 * (1/60);
        } else {
            // Charging at target
            const chargeAngle = Math.atan2(this.chargeTarget.y - this.pos.y, this.chargeTarget.x - this.pos.x);
            this.vel = vec2(Math.cos(chargeAngle) * this.speed * 3, Math.sin(chargeAngle) * this.speed * 3);
            if (this.pos.distance(this.chargeTarget) < 50) {
                this.isCharging = false;
            }
        }

        // Apply drag
        this.vel = this.vel.scale(0.95);
        const speed = this.vel.length();
        if (speed > this.speed * (this.isCharging ? 4 : 1)) {
            this.vel = this.vel.normalize(this.speed * (this.isCharging ? 4 : 1));
        }
        this.pos = this.pos.add(this.vel.scale(1/60));

        // Attacks
        this.attackTimer -= 1/60;
        if (this.attackTimer <= 0 && !this.isCharging) {
            this.performAttack(target);
            this.attackTimer = this.phase === 2 ? 2 : 3;
        }

        // Shield recharge (slow)
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + 2 * (1/60));
        }
    }

    performAttack(target) {
        const attack = this.attacks[this.currentAttack % this.attacks.length];
        this.currentAttack++;

        switch (attack) {
            case 'droneSwarm':
                // Spawn drones
                for (let i = 0; i < 5; i++) {
                    const angle = rand(PI * 2);
                    enemies.push(new Enemy(
                        this.pos.x + Math.cos(angle) * this.size,
                        this.pos.y + Math.sin(angle) * this.size,
                        'drone'
                    ));
                    waveEnemiesRemaining++;
                }
                break;

            case 'acidSpit':
                // Spread projectiles
                for (let i = 0; i < 5; i++) {
                    const angle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
                    const spread = (i - 2) * 0.2;
                    projectiles.push({
                        pos: this.pos.copy(),
                        vel: vec2(Math.cos(angle + spread) * 300, Math.sin(angle + spread) * 300),
                        damage: this.damage,
                        friendly: false,
                        lifetime: 3,
                        size: 8,
                        color: new Color(0.5, 1, 0.2)
                    });
                }
                break;

            case 'charge':
                // Telegraph then charge
                this.chargeTarget = target.pos.copy();
                this.isCharging = true;
                break;

            case 'beamSweep':
                // Fire multiple beams in arc
                for (let i = 0; i < 8; i++) {
                    const angle = (PI * 2 / 8) * i;
                    projectiles.push({
                        pos: this.pos.add(vec2(Math.cos(angle) * this.size, Math.sin(angle) * this.size)),
                        vel: vec2(Math.cos(angle) * 200, Math.sin(angle) * 200),
                        damage: 10,
                        friendly: false,
                        lifetime: 4,
                        size: 6,
                        color: new Color(1, 0.8, 0)
                    });
                }
                break;

            case 'missileSalvo':
                // Homing missiles
                for (let i = 0; i < 6; i++) {
                    const angle = (PI * 2 / 6) * i;
                    projectiles.push({
                        pos: this.pos.add(vec2(Math.cos(angle) * this.size, Math.sin(angle) * this.size)),
                        vel: vec2(Math.cos(angle) * 150, Math.sin(angle) * 150),
                        damage: 25,
                        friendly: false,
                        lifetime: 5,
                        size: 5,
                        color: COLORS.missile,
                        isMissile: true,
                        homing: true,
                        targetPlayer: true
                    });
                }
                break;

            case 'droneCloud':
                // Spawn many drones
                for (let i = 0; i < 10; i++) {
                    const angle = rand(PI * 2);
                    const dist = rand(this.size, this.size * 2);
                    enemies.push(new Enemy(
                        this.pos.x + Math.cos(angle) * dist,
                        this.pos.y + Math.sin(angle) * dist,
                        'drone'
                    ));
                    waveEnemiesRemaining++;
                }
                break;

            case 'turretBarrage':
                // Fire from all sides
                for (let i = 0; i < 12; i++) {
                    const angle = (PI * 2 / 12) * i;
                    projectiles.push({
                        pos: this.pos.add(vec2(Math.cos(angle) * this.size, Math.sin(angle) * this.size)),
                        vel: vec2(Math.cos(angle) * 250, Math.sin(angle) * 250),
                        damage: 15,
                        friendly: false,
                        lifetime: 3,
                        size: 4,
                        color: new Color(1, 0.2, 0.2)
                    });
                }
                break;

            case 'ramming':
                this.chargeTarget = target.pos.copy();
                this.isCharging = true;
                break;

            case 'shieldBoost':
                // Restore shield
                this.shield = Math.min(this.maxShield, this.shield + 200);
                spawnExplosion(this.pos, this.size / 2, new Color(0, 0.5, 1));
                break;
        }
    }

    takeDamage(damage) {
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, damage);
            this.shield -= absorbed;
            damage -= absorbed;
        }
        this.hp -= damage;
        return this.hp <= 0;
    }

    draw() {
        // Shield visual
        if (this.shield > 0) {
            const shieldAlpha = 0.2 + (this.shield / this.maxShield) * 0.3;
            drawCircle(this.pos, this.size + 10, new Color(0.6, 0, 0.8, shieldAlpha));
        }

        // Boss body
        drawCircle(this.pos, this.size, new Color(0.3, 0, 0.1));
        drawCircle(this.pos, this.size * 0.8, new Color(0.5, 0.1, 0.1));

        // Eyes/details
        for (let i = 0; i < 4; i++) {
            const angle = this.rotation + (PI * 2 / 4) * i;
            const eyePos = this.pos.add(vec2(Math.cos(angle) * this.size * 0.5, Math.sin(angle) * this.size * 0.5));
            drawCircle(eyePos, this.size * 0.15, new Color(1, 0.3, 0));
        }

        // Phase indicator
        if (this.phase === 2) {
            drawCircle(this.pos, this.size * 0.3, new Color(1, 0, 0, 0.5));
        }

        // HP bar
        const barWidth = this.size * 2;
        drawRect(this.pos.add(vec2(0, -this.size - 15)), vec2(barWidth + 4, 12), new Color(0, 0, 0));
        drawRect(this.pos.add(vec2(0, -this.size - 15)), vec2(barWidth, 10), new Color(0.3, 0, 0));
        drawRect(this.pos.add(vec2(-barWidth/2 + barWidth * (this.hp/this.maxHP)/2, -this.size - 15)),
                 vec2(barWidth * (this.hp/this.maxHP), 8), new Color(1, 0.2, 0.2));

        // Shield bar
        if (this.maxShield > 0) {
            drawRect(this.pos.add(vec2(0, -this.size - 25)), vec2(barWidth, 6), new Color(0.1, 0, 0.2));
            drawRect(this.pos.add(vec2(-barWidth/2 + barWidth * (this.shield/this.maxShield)/2, -this.size - 25)),
                     vec2(barWidth * (this.shield/this.maxShield), 4), new Color(0.6, 0, 0.8));
        }
    }
}

// ==================== GAME FUNCTIONS ====================

function spawnExplosion(pos, size, color) {
    const count = Math.floor(size * 2);
    for (let i = 0; i < count; i++) {
        const angle = rand(PI * 2);
        const speed = rand(50, 150);
        particles.push({
            pos: pos.copy(),
            vel: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
            size: rand(2, 5),
            color: color || new Color(1, 0.5, 0),
            lifetime: rand(0.3, 0.8),
            maxLifetime: rand(0.3, 0.8)
        });
    }
}

function spawnShieldHit(pos, color) {
    shieldHitEffects.push({
        pos: pos.copy(),
        radius: 10,
        maxRadius: 30,
        lifetime: 0.3,
        color: color || new Color(0, 0.5, 1, 0.5)
    });
}

function spawnDamageNumber(pos, damage, color) {
    damageNumbers.push({
        pos: pos.copy(),
        text: Math.floor(damage).toString(),
        vel: vec2(rand(-20, 20), -50),
        lifetime: 1,
        color: color || new Color(1, 1, 0)
    });
}

function updateDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.pos = d.pos.add(d.vel.scale(1/60));
        d.vel = d.vel.scale(0.95);
        d.lifetime -= 1/60;

        if (d.lifetime <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.pos = p.pos.add(p.vel.scale(1/60));
        p.vel = p.vel.scale(0.95);
        p.lifetime -= 1/60;

        if (p.lifetime <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update shield hit effects
    for (let i = shieldHitEffects.length - 1; i >= 0; i--) {
        const e = shieldHitEffects[i];
        e.lifetime -= 1/60;
        e.radius += (e.maxRadius - 10) * (1/60) / 0.3;

        if (e.lifetime <= 0) {
            shieldHitEffects.splice(i, 1);
        }
    }
}

function spawnAsteroids() {
    const count = 20;
    for (let i = 0; i < count; i++) {
        const size = rand() < 0.5 ? 'small' : rand() < 0.7 ? 'medium' : 'large';
        const angle = rand(PI * 2);
        const dist = rand(200, WORLD_SIZE * 0.4);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        asteroids.push(new Asteroid(x, y, size));
    }
}

function spawnWave() {
    currentWave++;

    // Boss wave every 10 waves
    if (currentWave % 10 === 0 && !bossActive) {
        spawnBoss();
        waveTimer = 30;
        return;
    }

    const budget = 50 + currentWave * 40;
    let remaining = budget;

    const costs = {
        drone: 10, fighter: 25, heavyFighter: 50,
        bomber: 40, destroyer: 150, carrier: 200
    };

    // Unlock new enemies as waves progress
    let available = ['drone'];
    if (currentWave >= 2) available.push('fighter');
    if (currentWave >= 3) available.push('heavyFighter');
    if (currentWave >= 4) available.push('bomber');
    if (currentWave >= 6) available.push('destroyer');
    if (currentWave >= 8) available.push('carrier');

    while (remaining > 0) {
        const affordable = available.filter(e => costs[e] <= remaining);
        if (affordable.length === 0) break;

        const type = affordable[Math.floor(rand() * affordable.length)];
        remaining -= costs[type];

        // Spawn at edge of world
        const angle = rand(PI * 2);
        const dist = WORLD_SIZE * 0.4;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        enemies.push(new Enemy(x, y, type));
        waveEnemiesRemaining++;
    }

    waveTimer = 25; // 25 seconds between waves
}

function spawnBoss() {
    const bossTypes = ['archnidQueen', 'hiveMind', 'destroyerPrime'];
    const bossType = bossTypes[bossesDefeated % bossTypes.length];

    const angle = rand(PI * 2);
    const dist = WORLD_SIZE * 0.35;
    boss = new Boss(Math.cos(angle) * dist, Math.sin(angle) * dist, bossType);
    bossActive = true;
    waveEnemiesRemaining++;
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.pos = p.pos.add(p.vel.scale(1/60));
        p.lifetime -= 1/60;

        if (p.lifetime <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        // Homing missile tracking
        if (p.isMissile && p.homing && enemies.length > 0) {
            let closest = null;
            let closestDist = 300;
            for (let enemy of enemies) {
                const dist = p.pos.distance(enemy.pos);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            }
            if (closest) {
                const targetAngle = Math.atan2(closest.pos.y - p.pos.y, closest.pos.x - p.pos.x);
                const currentAngle = Math.atan2(p.vel.y, p.vel.x);
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > PI) angleDiff -= PI * 2;
                while (angleDiff < -PI) angleDiff += PI * 2;
                const maxTurn = 3 * (1/60); // radians per frame
                const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
                const newAngle = currentAngle + turn;
                const speed = p.vel.length();
                p.vel = vec2(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
            }
        }

        // Check collisions
        if (p.friendly) {
            // Check boss hit
            if (bossActive && boss && p.pos.distance(boss.pos) < boss.size + p.size) {
                const hadShield = boss.shield > 0;
                const damage = p.isIon && boss.shield > 0 ? p.shieldDamage : p.damage;
                spawnDamageNumber(p.pos, damage, p.isIon ? new Color(0.6, 0.13, 0.52) : new Color(1, 1, 0));

                if (boss.takeDamage(damage)) {
                    score += boss.score;
                    spawnExplosion(boss.pos, boss.size, new Color(1, 0.3, 0));

                    // Boss drops lots of resources
                    for (let k = 0; k < 50; k++) {
                        const type = rand() < 0.33 ? 'green' : rand() < 0.5 ? 'yellow' : 'purple';
                        resources.push({
                            pos: boss.pos.copy(),
                            vel: vec2(rand(-100, 100), rand(-100, 100)),
                            type: type,
                            lifetime: 30
                        });
                    }

                    boss = null;
                    bossActive = false;
                    bossesDefeated++;
                    waveEnemiesRemaining--;

                    // Check victory
                    if (bossesDefeated >= VICTORY_BOSS_COUNT) {
                        gameState = 'victory';
                    }
                } else if (hadShield && boss.shield <= 0) {
                    spawnShieldHit(p.pos, new Color(0.6, 0, 0.8, 0.6));
                }
                projectiles.splice(i, 1);
                continue;
            }

            // Check enemy hits
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (p.pos.distance(enemies[j].pos) < enemies[j].size + p.size) {
                    const enemy = enemies[j];
                    const hadShield = enemy.shield > 0;

                    // Ion weapons do extra shield damage
                    const damage = p.isIon && enemy.shield > 0 ? p.shieldDamage : p.damage;
                    spawnDamageNumber(p.pos, damage, p.isIon ? new Color(0.6, 0.13, 0.52) : new Color(1, 1, 0));

                    if (enemy.takeDamage(damage)) {
                        score += enemy.score;
                        // Spawn explosion
                        spawnExplosion(enemy.pos, enemy.size, new Color(1, 0.5, 0));

                        // Drop resources - more from bigger enemies
                        const dropCount = enemy.type === 'destroyer' ? randInt(10, 20) :
                                         enemy.type === 'carrier' ? randInt(15, 25) :
                                         enemy.type === 'bomber' ? randInt(4, 8) : randInt(1, 4);
                        for (let k = 0; k < dropCount; k++) {
                            const type = rand() < 0.5 ? 'green' : rand() < 0.7 ? 'yellow' : 'purple';
                            resources.push({
                                pos: enemy.pos.copy(),
                                vel: vec2(rand(-50, 50), rand(-50, 50)),
                                type: type,
                                lifetime: 30
                            });
                        }
                        enemies.splice(j, 1);
                        waveEnemiesRemaining--;
                    } else if (hadShield && enemy.shield <= 0) {
                        // Shield just broke
                        spawnShieldHit(p.pos, new Color(0.6, 0, 0.8, 0.6));
                    }
                    projectiles.splice(i, 1);
                    break;
                }
            }

            // Check asteroid hits
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (p.pos && asteroids[j] && p.pos.distance(asteroids[j].pos) < asteroids[j].radius + p.size) {
                    if (asteroids[j].takeDamage(p.damage)) {
                        asteroids.splice(j, 1);
                    }
                    if (projectiles[i]) {
                        projectiles.splice(i, 1);
                    }
                    break;
                }
            }
        } else {
            // Enemy projectile - check player and aegis
            if (!player.isDocked && p.pos.distance(player.pos) < player.size + p.size) {
                if (player.shield > 0) {
                    spawnShieldHit(p.pos, COLORS.shield);
                }
                if (player.takeDamage(p.damage)) {
                    spawnExplosion(player.pos, 20, new Color(1, 0.3, 0));
                    gameState = 'gameover';
                }
                projectiles.splice(i, 1);
                continue;
            }

            if (p.pos.distance(aegis.pos) < aegis.size + p.size) {
                if (aegis.shield > 0) {
                    spawnShieldHit(p.pos, new Color(0, 0.7, 1, 0.5));
                }
                if (aegis.takeDamage(p.damage)) {
                    spawnExplosion(aegis.pos, 50, new Color(1, 0.4, 0));
                    gameState = 'gameover';
                }
                projectiles.splice(i, 1);
            }
        }
    }
}

function updateResources() {
    for (let i = resources.length - 1; i >= 0; i--) {
        const res = resources[i];
        res.pos = res.pos.add(res.vel.scale(1/60));
        res.vel = res.vel.scale(0.98);
        res.lifetime -= 1/60;

        if (res.lifetime <= 0) {
            resources.splice(i, 1);
            continue;
        }

        // Collect by player
        if (!player.isDocked && player.pos.distance(res.pos) < RESOURCE_CONFIG.collectionRadius) {
            if (player.cargoAmount < player.cargoCapacity) {
                player.cargo[res.type]++;
                resources.splice(i, 1);
            }
        }
    }
}

// ==================== LITTLEJS CALLBACKS ====================

function gameInit() {
    // Initialize canvas
    canvasFixedSize = vec2(GAME_WIDTH, GAME_HEIGHT);
    cameraScale = 1;

    // Create player and Aegis
    player = new Ship(0, 100);
    aegis = new Aegis(0, 0);

    // Spawn initial asteroids
    spawnAsteroids();

    gameState = 'menu';
}

function gameUpdate() {
    if (gameState === 'menu') {
        if (keyWasPressed('Space')) {
            gameState = 'playing';
            currentWave = 0;
            waveTimer = 3;
        }
        return;
    }

    if (gameState === 'gameover' || gameState === 'victory') {
        if (keyWasPressed('Space')) {
            // Reset game
            player = new Ship(0, 100);
            aegis = new Aegis(0, 0);
            asteroids = [];
            enemies = [];
            projectiles = [];
            resources = [];
            particles = [];
            shieldHitEffects = [];
            damageNumbers = [];
            pickupResources = { green: 0, yellow: 0, purple: 0 };
            score = 0;
            currentWave = 0;
            waveTimer = 3;
            waveEnemiesRemaining = 0;
            paused = false;
            asteroidRespawnTimer = 0;
            boss = null;
            bossActive = false;
            bossesDefeated = 0;
            spawnAsteroids();
            gameState = 'playing';
        }
        return;
    }

    // Pause toggle
    if (keyWasPressed('Escape')) {
        paused = !paused;
    }

    if (paused) return;

    // Station upgrades while docked (1-4 keys)
    if (player.isDocked) {
        if (keyWasPressed('Digit1')) aegis.upgrade('hull');
        if (keyWasPressed('Digit2')) aegis.upgrade('shield');
        if (keyWasPressed('Digit3')) aegis.upgrade('turret');
        if (keyWasPressed('Digit4')) aegis.upgrade('slots');
    }

    // Update entities
    player.update();
    aegis.update();

    for (let asteroid of asteroids) {
        asteroid.update();
    }

    for (let enemy of enemies) {
        enemy.update();
    }

    // Update boss
    if (bossActive && boss) {
        boss.update();
    }

    updateProjectiles();
    updateResources();
    updateParticles();
    updateDamageNumbers();

    // Asteroid respawning
    asteroidRespawnTimer -= 1/60;
    if (asteroidRespawnTimer <= 0 && asteroids.length < 15) {
        const size = rand() < 0.5 ? 'small' : rand() < 0.7 ? 'medium' : 'large';
        const angle = rand(PI * 2);
        const dist = rand(300, WORLD_SIZE * 0.4);
        const x = player.pos.x + Math.cos(angle) * dist;
        const y = player.pos.y + Math.sin(angle) * dist;
        asteroids.push(new Asteroid(x, y, size));
        asteroidRespawnTimer = 5;
    }

    // Wave system
    waveTimer -= 1/60;
    if (waveTimer <= 0 && waveEnemiesRemaining <= 0) {
        spawnWave();
    }

    // Camera follows player
    cameraPos = player.pos;
}

function gameUpdatePost() {
}

function gameRender() {
    // Draw space background
    drawRect(cameraPos, vec2(GAME_WIDTH, GAME_HEIGHT), new Color(0.02, 0.02, 0.08));

    // Stars (parallax)
    for (let i = 0; i < 50; i++) {
        const x = ((i * 137) % GAME_WIDTH) - GAME_WIDTH/2 + cameraPos.x * 0.1;
        const y = ((i * 89) % GAME_HEIGHT) - GAME_HEIGHT/2 + cameraPos.y * 0.1;
        drawRect(vec2(x, y), vec2(1, 1), new Color(1, 1, 1, 0.3 + (i % 3) * 0.2));
    }

    // Draw asteroids
    for (let asteroid of asteroids) {
        asteroid.draw();
    }

    // Draw resources
    for (let res of resources) {
        const color = res.type === 'green' ? COLORS.greenMineral :
                      res.type === 'yellow' ? COLORS.yellowMineral : COLORS.purpleMineral;
        drawCircle(res.pos, 4, color);
    }

    // Draw enemies
    for (let enemy of enemies) {
        enemy.draw();
    }

    // Draw boss
    if (bossActive && boss) {
        boss.draw();
    }

    // Draw projectiles
    for (let p of projectiles) {
        if (p.isMissile) {
            // Draw missile with trail
            const angle = Math.atan2(p.vel.y, p.vel.x);
            const tip = p.pos.add(vec2(Math.cos(angle) * p.size, Math.sin(angle) * p.size));
            const back = p.pos.add(vec2(-Math.cos(angle) * p.size, -Math.sin(angle) * p.size));
            drawLine(tip, back, 0.15, p.color);
            drawCircle(back, 3, new Color(1, 0.5, 0, 0.5));
        } else {
            drawCircle(p.pos, p.size, p.color);
        }
    }

    // Draw particles (explosions)
    for (let p of particles) {
        const alpha = p.lifetime / p.maxLifetime;
        const color = new Color(p.color.r, p.color.g, p.color.b, alpha);
        drawCircle(p.pos, p.size * alpha, color);
    }

    // Draw shield hit effects
    for (let e of shieldHitEffects) {
        const alpha = e.lifetime / 0.3;
        const color = new Color(e.color.r, e.color.g, e.color.b, alpha * 0.5);
        drawCircle(e.pos, e.radius, color);
    }

    // Draw damage numbers
    for (let d of damageNumbers) {
        const alpha = d.lifetime;
        const color = new Color(d.color.r, d.color.g, d.color.b, alpha);
        drawText(d.text, d.pos, 0.3, color);
    }

    // Draw Aegis
    aegis.draw();

    // Draw player
    if (!player.isDocked) {
        player.draw();
    }
}

function gameRenderPost() {
    // HUD
    const hudY = GAME_HEIGHT - 50;

    if (gameState === 'menu') {
        // Menu screen
        drawTextScreen('STARSCAPE', vec2(GAME_WIDTH/2, 180), 48, new Color(0.3, 0.6, 0.9));
        drawTextScreen('Space Combat Mining Game', vec2(GAME_WIDTH/2, 225), 20, new Color(0.7, 0.7, 0.7));
        drawTextScreen('WASD/Arrows: Move', vec2(GAME_WIDTH/2, 290), 14, new Color(0.5, 0.5, 0.5));
        drawTextScreen('Q: Blaster  W: Missile  Space: Ion (when unlocked)', vec2(GAME_WIDTH/2, 315), 14, new Color(0.5, 0.5, 0.5));
        drawTextScreen('E: Gravity Beam  R: Dock/Undock  ESC: Pause', vec2(GAME_WIDTH/2, 340), 14, new Color(0.5, 0.5, 0.5));
        drawTextScreen('Mine asteroids for resources', vec2(GAME_WIDTH/2, 380), 12, new Color(0.4, 0.6, 0.4));
        drawTextScreen('Defend Aegis station from alien waves', vec2(GAME_WIDTH/2, 400), 12, new Color(0.6, 0.4, 0.4));
        drawTextScreen('Dock to repair, upgrade, and deposit resources', vec2(GAME_WIDTH/2, 420), 12, new Color(0.4, 0.4, 0.6));
        drawTextScreen('Press SPACE to Start', vec2(GAME_WIDTH/2, 480), 24, new Color(1, 1, 1));
        return;
    }

    if (gameState === 'gameover') {
        drawTextScreen('GAME OVER', vec2(GAME_WIDTH/2, 200), 48, new Color(1, 0.2, 0.2));
        drawTextScreen('Score: ' + score, vec2(GAME_WIDTH/2, 280), 24, new Color(1, 1, 1));
        drawTextScreen('Waves Survived: ' + currentWave, vec2(GAME_WIDTH/2, 320), 20, new Color(0.7, 0.7, 0.7));
        drawTextScreen('Press SPACE to Restart', vec2(GAME_WIDTH/2, 400), 20, new Color(0.7, 0.7, 0.7));
        return;
    }

    if (gameState === 'victory') {
        drawTextScreen('VICTORY!', vec2(GAME_WIDTH/2, 150), 56, new Color(1, 0.85, 0));
        drawTextScreen('The Aegis has been saved!', vec2(GAME_WIDTH/2, 210), 20, new Color(0.8, 0.8, 0.8));
        drawTextScreen('Final Score: ' + score, vec2(GAME_WIDTH/2, 280), 28, new Color(1, 1, 1));
        drawTextScreen('Waves Completed: ' + currentWave, vec2(GAME_WIDTH/2, 320), 18, new Color(0.7, 0.7, 0.7));
        drawTextScreen('Bosses Defeated: ' + bossesDefeated, vec2(GAME_WIDTH/2, 350), 18, new Color(1, 0.3, 0.3));
        drawTextScreen('Resources Collected:', vec2(GAME_WIDTH/2, 400), 16, new Color(0.6, 0.6, 0.6));
        drawTextScreen('G:' + pickupResources.green + '  Y:' + pickupResources.yellow + '  P:' + pickupResources.purple, vec2(GAME_WIDTH/2, 425), 14, new Color(0.5, 0.8, 0.5));
        drawTextScreen('Press SPACE to Play Again', vec2(GAME_WIDTH/2, 500), 20, new Color(0.7, 0.7, 0.7));
        return;
    }

    // Ship HP/Shield
    drawTextScreen('SHIP', vec2(80, 25), 14, new Color(0.7, 0.7, 0.7));
    drawRectScreenSpace(vec2(20, 40), vec2(120, 12), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(20, 40), vec2(120 * (player.hp / player.maxHP), 10), new Color(0.2, 0.8, 0.2));
    drawRectScreenSpace(vec2(20, 55), vec2(120, 12), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(20, 55), vec2(120 * (player.shield / player.maxShield), 10), new Color(0.2, 0.5, 0.9));

    // Aegis HP/Shield
    drawTextScreen('AEGIS', vec2(680, 25), 14, new Color(0.7, 0.7, 0.7));
    drawRectScreenSpace(vec2(620, 40), vec2(160, 12), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(620, 40), vec2(160 * (aegis.hp / aegis.maxHP), 10), new Color(0.2, 0.8, 0.2));
    drawRectScreenSpace(vec2(620, 55), vec2(160, 12), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(620, 55), vec2(160 * (aegis.shield / aegis.maxShield), 10), new Color(0.2, 0.5, 0.9));

    // Resources
    drawTextScreen('G:' + (pickupResources.green + player.cargo.green), vec2(250, 25), 16, COLORS.greenMineral);
    drawTextScreen('Y:' + (pickupResources.yellow + player.cargo.yellow), vec2(350, 25), 16, COLORS.yellowMineral);
    drawTextScreen('P:' + (pickupResources.purple + player.cargo.purple), vec2(450, 25), 16, COLORS.purpleMineral);

    // Score and wave
    drawTextScreen('Score: ' + score, vec2(400, 580), 18, new Color(1, 1, 1));
    drawTextScreen('Wave: ' + currentWave, vec2(400, 560), 14, new Color(0.7, 0.7, 0.7));

    // Enemies remaining
    if (waveEnemiesRemaining > 0) {
        drawTextScreen('Enemies: ' + waveEnemiesRemaining, vec2(700, 580), 14, new Color(1, 0.5, 0.5));
    } else {
        if (waveTimer <= 5) {
            const isBossWave = (currentWave + 1) % 10 === 0;
            if (isBossWave) {
                drawTextScreen('BOSS INCOMING!', vec2(400, 100), 24, new Color(1, 0.1, 0.1));
            } else {
                drawTextScreen('WAVE ' + (currentWave + 1) + ' INCOMING: ' + Math.ceil(waveTimer) + 's', vec2(400, 100), 20, new Color(1, 0.3, 0.3));
            }
        } else {
            drawTextScreen('Next wave: ' + Math.ceil(waveTimer) + 's', vec2(700, 580), 14, new Color(0.5, 1, 0.5));
        }
    }

    // Boss HUD
    if (bossActive && boss) {
        drawTextScreen(boss.name, vec2(GAME_WIDTH/2, 80), 24, new Color(1, 0.2, 0.2));
        drawRectScreenSpace(vec2(GAME_WIDTH/2 - 150, 95), vec2(300, 20), new Color(0.2, 0.1, 0.1));
        drawRectScreenSpace(vec2(GAME_WIDTH/2 - 150, 95), vec2(300 * (boss.hp/boss.maxHP), 18), new Color(1, 0.2, 0.2));
        if (boss.maxShield > 0) {
            drawRectScreenSpace(vec2(GAME_WIDTH/2 - 150, 115), vec2(300, 10), new Color(0.1, 0.05, 0.15));
            drawRectScreenSpace(vec2(GAME_WIDTH/2 - 150, 115), vec2(300 * (boss.shield/boss.maxShield), 8), new Color(0.6, 0.2, 0.8));
        }
        drawTextScreen('Phase ' + boss.phase + '/2', vec2(GAME_WIDTH/2, 135), 12, new Color(0.6, 0.6, 0.6));
    }

    // Minimap (bottom right)
    const mapSize = 80;
    const mapX = GAME_WIDTH - mapSize - 10;
    const mapY = GAME_HEIGHT - mapSize - 70;
    const mapScale = mapSize / WORLD_SIZE;

    // Minimap background
    drawRectScreenSpace(vec2(mapX, mapY), vec2(mapSize, mapSize), new Color(0.1, 0.1, 0.15, 0.8));

    // Aegis on minimap
    const aegisMapX = mapX + mapSize/2 + aegis.pos.x * mapScale;
    const aegisMapY = mapY + mapSize/2 + aegis.pos.y * mapScale;
    drawRectScreenSpace(vec2(aegisMapX - 3, aegisMapY - 3), vec2(6, 6), new Color(0.7, 0.7, 0.7));

    // Enemies on minimap
    for (let enemy of enemies) {
        const ex = mapX + mapSize/2 + enemy.pos.x * mapScale;
        const ey = mapY + mapSize/2 + enemy.pos.y * mapScale;
        if (ex >= mapX && ex <= mapX + mapSize && ey >= mapY && ey <= mapY + mapSize) {
            const size = enemy.type === 'destroyer' || enemy.type === 'carrier' ? 3 : 2;
            drawRectScreenSpace(vec2(ex - size/2, ey - size/2), vec2(size, size), COLORS.enemy);
        }
    }

    // Player on minimap
    const playerMapX = mapX + mapSize/2 + player.pos.x * mapScale;
    const playerMapY = mapY + mapSize/2 + player.pos.y * mapScale;
    drawRectScreenSpace(vec2(playerMapX - 2, playerMapY - 2), vec2(4, 4), COLORS.player)

    // Missiles
    drawTextScreen('Missiles: ' + player.missiles, vec2(100, 580), 14, COLORS.missile);

    // Cargo
    drawTextScreen('Cargo: ' + player.cargoAmount + '/' + player.cargoCapacity, vec2(100, 560), 12, new Color(0.6, 0.6, 0.6));

    // Weapon info
    const blasterName = WEAPONS.blaster['tier' + player.blasterTier].name;
    const missileName = WEAPONS.missile['tier' + player.missileTier].name;
    drawTextScreen('Blaster: ' + blasterName, vec2(100, 540), 10, COLORS.blaster);
    drawTextScreen('Missile: ' + missileName, vec2(100, 525), 10, COLORS.missile);
    if (player.hasIon) {
        drawTextScreen('Ion: Active (Space)', vec2(100, 510), 10, new Color(0.6, 0.13, 0.52));
    }

    // Dock status
    if (player.isDocked) {
        drawTextScreen('DOCKED - Press R to undock', vec2(400, 180), 20, new Color(0, 1, 0.5));
        drawTextScreen('Ship repaired! Shields restored! Missiles refilled!', vec2(400, 205), 12, new Color(0.7, 0.7, 0.7));

        // Ship upgrades (auto on dock)
        drawTextScreen('== Ship Upgrades (auto) ==', vec2(200, 240), 12, new Color(0.5, 0.8, 1));
        const shipUpgrades = [];
        if (player.blasterTier < 4) shipUpgrades.push('Blaster Lv' + (player.blasterTier+1) + ': ' + [50, 100, 200][player.blasterTier] + 'Y');
        if (player.missileTier < 4) shipUpgrades.push('Missile Lv' + (player.missileTier+1) + ': ' + [30, 60, 120][player.missileTier] + 'P');
        if (!player.hasIon) shipUpgrades.push('Ion Cannon: 50Y+50P');
        for (let i = 0; i < shipUpgrades.length; i++) {
            drawTextScreen(shipUpgrades[i], vec2(200, 258 + i * 16), 10, new Color(0.7, 0.7, 0.7));
        }

        // Station upgrades (manual)
        drawTextScreen('== Station Upgrades (1-4) ==', vec2(600, 240), 12, new Color(1, 0.8, 0.5));
        const stationUpgrades = [];
        if (aegis.hullTier < 3) {
            const c = [{g:50,y:30,p:20},{g:100,y:60,p:40},{g:200,y:120,p:80}][aegis.hullTier];
            stationUpgrades.push('[1] Hull Lv' + (aegis.hullTier+1) + ': ' + c.g + 'G/' + c.y + 'Y/' + c.p + 'P');
        }
        if (aegis.shieldTier < 3) {
            const c = [{g:40,y:50,p:30},{g:80,y:100,p:60},{g:160,y:200,p:120}][aegis.shieldTier];
            stationUpgrades.push('[2] Shield Lv' + (aegis.shieldTier+1) + ': ' + c.g + 'G/' + c.y + 'Y/' + c.p + 'P');
        }
        if (aegis.turretTier < 3) {
            const c = [{g:25,y:35,p:50},{g:50,y:70,p:100},{g:100,y:140,p:200}][aegis.turretTier];
            stationUpgrades.push('[3] Turret Lv' + (aegis.turretTier+1) + ': ' + c.g + 'G/' + c.y + 'Y/' + c.p + 'P');
        }
        if (aegis.turretSlots < 8) {
            const c = aegis.turretSlots === 4 ? {g:60,y:40,p:30} : {g:120,y:80,p:60};
            stationUpgrades.push('[4] +2 Slots: ' + c.g + 'G/' + c.y + 'Y/' + c.p + 'P');
        }
        for (let i = 0; i < stationUpgrades.length; i++) {
            drawTextScreen(stationUpgrades[i], vec2(600, 258 + i * 16), 10, new Color(0.7, 0.7, 0.7));
        }

        // Current station stats
        drawTextScreen('Station: HP ' + aegis.hp + '/' + aegis.maxHP + ' | Shield ' + Math.floor(aegis.shield) + '/' + aegis.maxShield + ' | Turrets ' + aegis.turretSlots, vec2(400, 360), 11, new Color(0.6, 0.6, 0.6));
    } else if (player.pos.distance(aegis.pos) < 100) {
        drawTextScreen('Press R to dock', vec2(400, 300), 16, new Color(0.7, 0.7, 0.7));
    }

    // Pause menu
    if (paused) {
        // Semi-transparent overlay
        drawRectScreenSpace(vec2(0, 0), vec2(GAME_WIDTH, GAME_HEIGHT), new Color(0, 0, 0, 0.7));
        drawTextScreen('PAUSED', vec2(GAME_WIDTH/2, 250), 48, new Color(1, 1, 1));
        drawTextScreen('Press ESC to Resume', vec2(GAME_WIDTH/2, 320), 20, new Color(0.7, 0.7, 0.7));
        drawTextScreen('Controls:', vec2(GAME_WIDTH/2, 380), 16, new Color(0.5, 0.8, 1));
        drawTextScreen('WASD/Arrows: Thrust', vec2(GAME_WIDTH/2, 410), 14, new Color(0.6, 0.6, 0.6));
        drawTextScreen('Q: Blaster  W: Missile  E: Gravity Beam', vec2(GAME_WIDTH/2, 435), 14, new Color(0.6, 0.6, 0.6));
        drawTextScreen('R: Dock/Undock with Aegis', vec2(GAME_WIDTH/2, 460), 14, new Color(0.6, 0.6, 0.6));
    }
}

// Helper drawing functions
function drawCircle(pos, radius, color) {
    drawTile(pos, vec2(radius * 2 / 16), 0, vec2(16), color);
}

function drawLine(p1, p2, width, color) {
    const mid = p1.add(p2).scale(0.5);
    const len = p1.distance(p2);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    drawRect(mid, vec2(len, width), color, angle);
}

function drawRectScreenSpace(pos, size, color) {
    const worldPos = screenToWorld(pos.add(size.scale(0.5)));
    const worldSize = vec2(size.x / cameraScale, size.y / cameraScale);
    drawRect(worldPos, worldSize, color);
}

// Start the game
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, []);
