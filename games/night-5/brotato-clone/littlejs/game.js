/*
 * Brotato Clone - LittleJS Implementation
 * A top-down arena roguelike survivor
 */

'use strict';

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const ARENA_WIDTH = 1200;
const ARENA_HEIGHT = 900;
const TOTAL_WAVES = 20;
const MAX_ENEMIES = 100;
const PICKUP_RADIUS = 50;

// Game states
const GameState = {
    MENU: 'menu',
    CHARACTER_SELECT: 'characterSelect',
    WAVE_COMBAT: 'waveCombat',
    LEVEL_UP: 'levelUp',
    SHOP: 'shop',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory',
    PAUSED: 'paused'
};

// ============================================================================
// GAME DATA
// ============================================================================

// Character definitions
const CHARACTERS = {
    wellRounded: {
        id: 'wellRounded',
        name: 'Well Rounded',
        description: 'Balanced starter',
        color: new Color(0.55, 0.27, 0.07),
        statMods: { maxHp: 5, speed: 5, harvesting: 8 },
        startingWeapon: 'pistol'
    },
    brawler: {
        id: 'brawler',
        name: 'Brawler',
        description: 'Melee specialist',
        color: new Color(0.8, 0.36, 0.36),
        statMods: { attackSpeed: 50, dodge: 15, range: -50 },
        startingWeapon: 'fist'
    },
    crazy: {
        id: 'crazy',
        name: 'Crazy',
        description: 'High attack speed',
        color: new Color(0.6, 0.2, 0.8),
        statMods: { range: 100, attackSpeed: 25, dodge: -30 },
        startingWeapon: 'knife'
    },
    ranger: {
        id: 'ranger',
        name: 'Ranger',
        description: 'Ranged combat',
        color: new Color(0.13, 0.55, 0.13),
        statMods: { range: 50, rangedDamage: 50, maxHp: -25 },
        startingWeapon: 'pistol'
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        description: 'Elemental focus',
        color: new Color(0.25, 0.41, 0.88),
        statMods: { elementalDamage: 25, meleeDamage: -100 },
        startingWeapon: 'lightningShiv'
    }
};

// Weapon definitions
const WEAPONS = {
    pistol: { id: 'pistol', name: 'Pistol', type: 'ranged', baseDamage: [12, 20, 35, 50], attackSpeed: [1.0, 0.95, 0.90, 0.87], range: 400, projectileSpeed: 500, scaling: { stat: 'rangedDamage', percent: 100 }, color: new Color(1, 0.84, 0) },
    smg: { id: 'smg', name: 'SMG', type: 'ranged', baseDamage: [3, 5, 6, 8], attackSpeed: [0.17, 0.16, 0.16, 0.15], range: 400, projectileSpeed: 600, scaling: { stat: 'rangedDamage', percent: 60 }, color: new Color(0.75, 0.75, 0.75) },
    shotgun: { id: 'shotgun', name: 'Shotgun', type: 'ranged', baseDamage: [5, 8, 11, 15], attackSpeed: [1.2, 1.15, 1.1, 1.0], range: 300, projectileSpeed: 400, pellets: 5, spread: 0.4, scaling: { stat: 'rangedDamage', percent: 80 }, color: new Color(0.55, 0, 0) },
    sniper: { id: 'sniper', name: 'Sniper', type: 'ranged', baseDamage: [40, 55, 65, 80], attackSpeed: [2.2, 2.1, 2.0, 2.0], range: 600, projectileSpeed: 800, critBonus: 20, scaling: { stat: 'rangedDamage', percent: 100 }, color: new Color(0.18, 0.31, 0.31) },
    knife: { id: 'knife', name: 'Knife', type: 'melee', baseDamage: [6, 10, 15, 20], attackSpeed: [0.8, 0.75, 0.72, 0.78], range: 150, scaling: { stat: 'meleeDamage', percent: 80 }, color: new Color(0.75, 0.75, 0.75) },
    sword: { id: 'sword', name: 'Sword', type: 'melee', baseDamage: [25, 40, 50, 60], attackSpeed: [1.1, 1.05, 1.0, 0.98], range: 200, sweep: true, scaling: { stat: 'meleeDamage', percent: 100 }, color: new Color(0.27, 0.51, 0.71) },
    fist: { id: 'fist', name: 'Fist', type: 'melee', baseDamage: [8, 14, 19, 25], attackSpeed: [0.7, 0.68, 0.66, 0.65], range: 100, scaling: { stat: 'meleeDamage', percent: 100 }, color: new Color(1, 0.89, 0.77) },
    spear: { id: 'spear', name: 'Spear', type: 'melee', baseDamage: [15, 30, 45, 60], attackSpeed: [1.3, 1.28, 1.26, 1.24], range: 400, scaling: { stat: 'meleeDamage', percent: 100 }, color: new Color(0.55, 0.27, 0.07) },
    lightningShiv: { id: 'lightningShiv', name: 'Lightning Shiv', type: 'elemental', baseDamage: [15, 25, 32, 40], attackSpeed: [1.0, 0.95, 0.92, 0.9], range: 300, chain: 2, scaling: { stat: 'elementalDamage', percent: 100 }, color: new Color(0, 1, 1) },
    flamethrower: { id: 'flamethrower', name: 'Flamethrower', type: 'elemental', baseDamage: [3, 5, 6, 8], attackSpeed: [0.1, 0.1, 0.1, 0.1], range: 200, burn: true, scaling: { stat: 'elementalDamage', percent: 100 }, color: new Color(1, 0.27, 0) }
};

// Enemy definitions
const ENEMIES = {
    babyAlien: { id: 'babyAlien', name: 'Baby Alien', baseHp: 3, hpPerWave: 2.0, speed: [3, 4.5], damage: 1, behavior: 'chase', color: new Color(0.58, 0.44, 0.86), size: 0.4, firstWave: 1, xpDrop: 2, materialDrop: 1 },
    chaser: { id: 'chaser', name: 'Chaser', baseHp: 1, hpPerWave: 1.0, speed: [5.5, 6], damage: 1, behavior: 'chase', color: new Color(1, 0.41, 0.71), size: 0.3, firstWave: 1, xpDrop: 1, materialDrop: 1 },
    crawler: { id: 'crawler', name: 'Crawler', baseHp: 4, hpPerWave: 1.5, speed: [2.5, 3.5], damage: 1, behavior: 'chase', color: new Color(0.4, 0.6, 0.3), size: 0.35, firstWave: 1, xpDrop: 2, materialDrop: 1 },
    charger: { id: 'charger', name: 'Charger', baseHp: 4, hpPerWave: 2.5, speed: [2, 3], damage: 2, behavior: 'charge', chargeSpeed: 8, chargeCooldown: [2.5, 3.5], color: new Color(0.86, 0.08, 0.24), size: 0.5, firstWave: 3, xpDrop: 3, materialDrop: 2 },
    spitter: { id: 'spitter', name: 'Spitter', baseHp: 8, hpPerWave: 1.0, speed: [2.8, 3.5], damage: 1, behavior: 'ranged', projectileDamage: 2, projectileSpeed: 5, attackRange: 6, fleeRange: 2, color: new Color(0.2, 0.8, 0.2), size: 0.45, firstWave: 4, xpDrop: 4, materialDrop: 2 },
    bruiser: { id: 'bruiser', name: 'Bruiser', baseHp: 20, hpPerWave: 11.0, speed: [4, 5], damage: 2, behavior: 'chase', color: new Color(0.55, 0, 0.55), size: 0.7, firstWave: 8, xpDrop: 8, materialDrop: 4 },
    healer: { id: 'healer', name: 'Healer', baseHp: 10, hpPerWave: 8.0, speed: [5.5, 6.5], damage: 1, behavior: 'healer', healRadius: 3, healAmount: 2, color: new Color(0, 1, 0.5), size: 0.4, firstWave: 7, xpDrop: 6, materialDrop: 3 },
    pursuer: { id: 'pursuer', name: 'Pursuer', baseHp: 10, hpPerWave: 24.0, speed: [2, 3], damage: 1, behavior: 'accelerate', maxSpeed: 10, acceleration: 0.3, color: new Color(0.29, 0, 0.51), size: 0.5, firstWave: 11, xpDrop: 5, materialDrop: 3 },
    looter: { id: 'looter', name: 'Looter', baseHp: 5, hpPerWave: 30, speed: [5, 6], damage: 0, behavior: 'flee', color: new Color(1, 0.84, 0), size: 0.4, firstWave: 3, xpDrop: 10, materialDrop: 8 }
};

// Item definitions
const ITEMS = {
    coupon: { id: 'coupon', name: 'Coupon', tier: 1, basePrice: 15, stats: { itemPrice: -5 }, description: '-5% prices' },
    luckyCharm: { id: 'luckyCharm', name: 'Lucky Charm', tier: 2, basePrice: 35, stats: { luck: 15 }, description: '+15 Luck' },
    bandana: { id: 'bandana', name: 'Bandana', tier: 1, basePrice: 20, stats: { piercing: 1 }, description: '+1 Piercing' },
    glasses: { id: 'glasses', name: 'Glasses', tier: 1, basePrice: 18, stats: { critChance: 5 }, description: '+5% Crit' },
    powerGlove: { id: 'powerGlove', name: 'Power Glove', tier: 2, basePrice: 45, stats: { meleeDamage: 3, attackSpeed: 10 }, description: '+3 Melee, +10% AS' },
    sniperScope: { id: 'sniperScope', name: 'Scope', tier: 2, basePrice: 50, stats: { range: 30, critChance: 10 }, description: '+30 Range, +10% Crit' },
    huntingTrophy: { id: 'huntingTrophy', name: 'Trophy', tier: 3, basePrice: 75, stats: { damage: 15, luck: 10 }, description: '+15% Dmg, +10 Luck' },
    helmet: { id: 'helmet', name: 'Helmet', tier: 1, basePrice: 15, stats: { armor: 2 }, description: '+2 Armor' },
    medikit: { id: 'medikit', name: 'Medikit', tier: 1, basePrice: 20, stats: { hpRegen: 3 }, description: '+3 HP Regen' },
    scaredSausage: { id: 'scaredSausage', name: 'Sausage', tier: 2, basePrice: 35, stats: { maxHp: 5, dodge: 3 }, description: '+5 HP, +3% Dodge' },
    heavyArmor: { id: 'heavyArmor', name: 'Heavy Armor', tier: 3, basePrice: 80, stats: { armor: 4, speed: -5 }, description: '+4 Armor, -5% Speed' },
    runningShoes: { id: 'runningShoes', name: 'Shoes', tier: 1, basePrice: 15, stats: { speed: 5 }, description: '+5% Speed' },
    magnet: { id: 'magnet', name: 'Magnet', tier: 1, basePrice: 18, stats: { pickupRange: 50 }, description: '+50% Pickup Range' },
    jetPack: { id: 'jetPack', name: 'Jet Pack', tier: 2, basePrice: 50, stats: { speed: 10, range: 20 }, description: '+10% Speed, +20 Range' },
    tree: { id: 'tree', name: 'Tree', tier: 3, basePrice: 70, stats: { maxHp: 25 }, special: 'healOnHit', description: '+25 HP, Heal on hit' },
    vampireTooth: { id: 'vampireTooth', name: 'Vampire Tooth', tier: 2, basePrice: 40, stats: { lifeSteal: 5 }, description: '+5% Life Steal' },
    bloodAmulet: { id: 'bloodAmulet', name: 'Blood Amulet', tier: 3, basePrice: 65, stats: { lifeSteal: 10, damage: 8 }, description: '+10% Life Steal, +8% Dmg' },
    energyDrink: { id: 'energyDrink', name: 'Energy Drink', tier: 1, basePrice: 22, stats: { attackSpeed: 8, speed: 3 }, description: '+8% Attack Speed, +3% Speed' },
    sharpener: { id: 'sharpener', name: 'Sharpener', tier: 2, basePrice: 42, stats: { meleeDamage: 5, rangedDamage: 3 }, description: '+5 Melee, +3 Ranged' }
};

// Upgrade tiers
const UPGRADE_VALUES = {
    maxHp: [3, 6, 9, 12], hpRegen: [2, 3, 4, 5], lifeSteal: [1, 2, 3, 4], damage: [5, 8, 12, 16],
    meleeDamage: [2, 4, 6, 8], rangedDamage: [1, 2, 3, 4], elementalDamage: [1, 2, 3, 4],
    attackSpeed: [5, 10, 15, 20], critChance: [3, 5, 7, 9], range: [15, 30, 45, 60],
    armor: [1, 2, 3, 4], dodge: [3, 6, 9, 12], speed: [3, 6, 9, 12], luck: [5, 10, 15, 20], harvesting: [5, 8, 10, 12]
};

// ============================================================================
// GAME STATE
// ============================================================================

let currentGameState = GameState.MENU;
let gamePlayer = null;
let gameEnemies = [];
let gameProjectiles = [];
let gamePickups = [];
let gameMeleeAttacks = [];
let gameDamageNumbers = [];

let currentWave = 0;
let waveTimer = 0;
let waveDuration = 0;
let spawnTimer = 0;

let pendingLevelUps = 0;
let levelUpOptions = [];
let shopItems = [];
let rerollCount = 0;

let uiMouseX = 0;
let uiMouseY = 0;
let screenShake = 0;
let totalKills = 0;
let waveKills = 0;

// ============================================================================
// PLAYER CLASS
// ============================================================================

class GamePlayer {
    constructor(characterId) {
        const charData = CHARACTERS[characterId];
        this.characterId = characterId;
        this.pos = vec2(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
        this.radius = 0.4;
        this.color = charData.color;

        this.baseStats = {
            maxHp: 10, hpRegen: 0, lifeSteal: 0, damage: 0, meleeDamage: 0, rangedDamage: 0,
            elementalDamage: 0, attackSpeed: 0, critChance: 0, range: 0, armor: 0, dodge: 0,
            speed: 0, luck: 0, harvesting: 0, pickupRange: 0, piercing: 0, itemPrice: 0
        };

        for (const [stat, value] of Object.entries(charData.statMods)) {
            if (this.baseStats[stat] !== undefined) this.baseStats[stat] += value;
        }

        this.xp = 0;
        this.level = 0;
        this.materials = 0;
        this.weapons = [];
        this.items = [];
        this.regenTimer = 0;
        this.invincibleTimer = 0;
        this.godMode = false;
        this.hp = this.getMaxHp();
        this.addWeapon(charData.startingWeapon, 1);
    }

    getStat(statName) {
        let value = this.baseStats[statName] || 0;
        for (const item of this.items) {
            const itemData = ITEMS[item.id];
            if (itemData.stats && itemData.stats[statName]) value += itemData.stats[statName];
        }
        return value;
    }

    getMaxHp() { return Math.max(1, 10 + this.getStat('maxHp') + this.level); }
    getSpeed() { return 3 * (1 + this.getStat('speed') / 100); }
    getPickupRadius() { return 1.5 * (1 + this.getStat('pickupRange') / 100); }
    getXpToNextLevel() { return Math.pow(this.level + 4, 2); }

    addWeapon(weaponId, tier) {
        // Check for weapon combining - if same weapon with same tier exists, upgrade it
        const existingWeapon = this.weapons.find(w => w.id === weaponId && w.tier === tier && tier < 4);
        if (existingWeapon) {
            existingWeapon.tier++;
            spawnDamageNumber(this.pos.x, this.pos.y + 1, 'UPGRADED!', new Color(1, 0.84, 0));
            if (window.testHarness) window.testHarness.logEvent('weapon_combined', { weapon: weaponId, newTier: existingWeapon.tier });
            return true;
        }
        if (this.weapons.length >= 6) return false;
        this.weapons.push({ id: weaponId, tier: tier, cooldown: 0 });
        return true;
    }

    addXp(amount) {
        const bonus = 1 + this.getStat('harvesting') / 100;
        this.xp += Math.floor(amount * bonus);
        while (this.xp >= this.getXpToNextLevel()) {
            this.xp -= this.getXpToNextLevel();
            this.level++;
            this.baseStats.maxHp += 1;
            this.hp = Math.min(this.hp + 1, this.getMaxHp());
            pendingLevelUps++;
            if (window.testHarness) window.testHarness.logEvent('level_up', { level: this.level });
        }
    }

    addMaterials(amount) {
        const bonus = 1 + this.getStat('harvesting') / 100;
        this.materials += Math.floor(amount * bonus);
    }

    takeDamage(amount) {
        if (this.godMode || this.invincibleTimer > 0) return;
        const dodgeChance = Math.min(this.getStat('dodge'), 60);
        if (Math.random() * 100 < dodgeChance) {
            spawnDamageNumber(this.pos.x, this.pos.y, 'DODGE', new Color(0, 1, 1));
            return;
        }
        const armor = this.getStat('armor');
        const reduction = armor / (armor + 15);
        let damage = Math.max(1, Math.floor(amount * (1 - reduction)));
        this.hp -= damage;
        this.invincibleTimer = 0.5;
        screenShake = Math.min(screenShake + 0.3, 0.8);
        spawnDamageNumber(this.pos.x, this.pos.y, damage, new Color(1, 0, 0));
        if (this.items.some(i => i.id === 'tree')) this.hp = Math.min(this.hp + 1, this.getMaxHp());
        if (this.hp <= 0) {
            currentGameState = GameState.GAME_OVER;
            screenShake = 1.5;
            if (window.testHarness) window.testHarness.logEvent('player_died', { wave: currentWave });
        }
    }

    heal(amount) { this.hp = Math.min(this.hp + amount, this.getMaxHp()); }

    update() {
        // Movement using LittleJS input
        let move = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) move.y += 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) move.y -= 1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) move.x -= 1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) move.x += 1;

        if (move.length() > 0) {
            move = move.normalize();
            this.pos = this.pos.add(move.scale(this.getSpeed() * timeDelta));
            this.pos.x = clamp(this.pos.x, this.radius, ARENA_WIDTH - this.radius);
            this.pos.y = clamp(this.pos.y, this.radius, ARENA_HEIGHT - this.radius);
        }

        // Regen
        this.regenTimer += timeDelta;
        if (this.regenTimer >= 5) {
            const regen = this.getStat('hpRegen');
            if (regen > 0) this.heal((0.2 + (regen - 1) * 0.089) * 5);
            this.regenTimer = 0;
        }

        if (this.invincibleTimer > 0) this.invincibleTimer -= timeDelta;

        // Update weapons
        for (const weapon of this.weapons) {
            weapon.cooldown -= timeDelta;
            if (weapon.cooldown <= 0) {
                const target = this.findTarget(weapon);
                if (target) this.fireWeapon(weapon, target);
            }
        }

        // Collect pickups
        const pickupRad = this.getPickupRadius();
        for (let i = gamePickups.length - 1; i >= 0; i--) {
            const pickup = gamePickups[i];
            const dist = this.pos.distance(pickup.pos);
            if (dist < pickupRad) {
                const dir = pickup.pos.subtract(this.pos).normalize();
                pickup.pos = pickup.pos.subtract(dir.scale(6 * timeDelta));
                if (dist < 0.5) {
                    if (pickup.type === 'xp') this.addXp(pickup.amount);
                    else if (pickup.type === 'material') this.addMaterials(pickup.amount);
                    else if (pickup.type === 'health') this.heal(pickup.amount);
                    gamePickups.splice(i, 1);
                }
            }
        }
    }

    findTarget(weapon) {
        const weaponData = WEAPONS[weapon.id];
        let range = (weaponData.range / 60) + this.getStat('range') / 60;
        if (weaponData.type === 'melee') range = (weaponData.range / 60) + this.getStat('range') / 120;
        range = Math.max(0.5, range);
        let nearest = null, nearestDist = Infinity;
        for (const enemy of gameEnemies) {
            const dist = this.pos.distance(enemy.pos);
            if (dist < range && dist < nearestDist) { nearest = enemy; nearestDist = dist; }
        }
        return nearest;
    }

    fireWeapon(weapon, target) {
        const weaponData = WEAPONS[weapon.id];
        const attackSpeedMod = 1 + this.getStat('attackSpeed') / 100;
        weapon.cooldown = Math.max(weaponData.attackSpeed[weapon.tier - 1] / attackSpeedMod, 1/12);
        const damage = this.calculateDamage(weapon);

        if (weaponData.type === 'melee') {
            const angle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
            gameMeleeAttacks.push({
                pos: this.pos.copy(), angle: angle,
                range: (weaponData.range / 60) + this.getStat('range') / 120,
                damage: damage, sweep: weaponData.sweep || false,
                timer: 0.2, color: weaponData.color, hit: new Set()
            });
        } else {
            const angle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
            const pellets = weaponData.pellets || 1;
            const spread = weaponData.spread || 0;
            for (let i = 0; i < pellets; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * spread;
                const speed = weaponData.projectileSpeed / 60;
                gameProjectiles.push({
                    pos: this.pos.copy(),
                    vel: vec2(Math.cos(spreadAngle) * speed, Math.sin(spreadAngle) * speed),
                    damage: damage, friendly: true,
                    piercing: this.getStat('piercing'),
                    color: weaponData.color, radius: 0.1, lifetime: 2
                });
            }
        }
    }

    calculateDamage(weapon) {
        const weaponData = WEAPONS[weapon.id];
        let damage = weaponData.baseDamage[weapon.tier - 1];
        damage += this.getStat(weaponData.scaling.stat) * (weaponData.scaling.percent / 100);
        damage *= (1 + this.getStat('damage') / 100);
        const critChance = this.getStat('critChance') + (weaponData.critBonus || 0);
        const isCrit = Math.random() * 100 < critChance;
        if (isCrit) damage *= 2;
        return { amount: Math.max(1, Math.floor(damage)), isCrit: isCrit };
    }
}

// ============================================================================
// ENEMY CLASS
// ============================================================================

class GameEnemy {
    constructor(type, x, y, wave) {
        const data = ENEMIES[type];
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.data = data;
        this.pos = vec2(x, y);
        this.radius = data.size;
        this.color = data.color;
        this.maxHp = data.baseHp + data.hpPerWave * (wave - 1);
        this.hp = this.maxHp;
        this.speed = data.speed[0] + Math.random() * (data.speed[1] - data.speed[0]);
        this.baseSpeed = this.speed;
        this.state = 'normal';
        this.stateTimer = 0;
        this.targetPos = vec2(x, y);
        this.attackCooldown = 0;
        this.contactTimer = 0;
    }

    update() {
        if (!gamePlayer) return;
        const toPlayer = gamePlayer.pos.subtract(this.pos);
        const dist = toPlayer.length();
        this.attackCooldown -= timeDelta;
        this.stateTimer -= timeDelta;

        switch (this.data.behavior) {
            case 'chase': this.behaviorChase(toPlayer, dist); break;
            case 'charge': this.behaviorCharge(toPlayer, dist); break;
            case 'ranged': this.behaviorRanged(toPlayer, dist); break;
            case 'healer': this.behaviorHealer(toPlayer, dist); break;
            case 'accelerate': this.behaviorAccelerate(toPlayer, dist); break;
            case 'flee': this.behaviorFlee(toPlayer, dist); break;
        }

        this.pos.x = clamp(this.pos.x, this.radius, ARENA_WIDTH - this.radius);
        this.pos.y = clamp(this.pos.y, this.radius, ARENA_HEIGHT - this.radius);

        this.contactTimer -= timeDelta;
        if (dist < this.radius + gamePlayer.radius && this.contactTimer <= 0) {
            gamePlayer.takeDamage(this.data.damage);
            this.contactTimer = 0.5;
        }
    }

    behaviorChase(toPlayer, dist) {
        if (dist > 0) this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
    }

    behaviorCharge(toPlayer, dist) {
        if (this.state === 'charging') {
            const toTarget = this.targetPos.subtract(this.pos);
            this.pos = this.pos.add(toTarget.scale(0.15));
            if (this.stateTimer <= 0) {
                this.state = 'normal';
                this.stateTimer = this.data.chargeCooldown[0] + Math.random() * (this.data.chargeCooldown[1] - this.data.chargeCooldown[0]);
            }
        } else {
            if (dist > 0) this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * 0.5 * timeDelta));
            if (this.stateTimer <= 0 && dist < 8) {
                this.state = 'charging';
                this.stateTimer = 0.5;
                this.targetPos = this.pos.add(toPlayer.normalize().scale(this.data.chargeSpeed));
            }
        }
    }

    behaviorRanged(toPlayer, dist) {
        if (dist < this.data.fleeRange) this.pos = this.pos.subtract(toPlayer.normalize().scale(this.speed * timeDelta));
        else if (dist > this.data.attackRange) this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
        if (dist < this.data.attackRange && this.attackCooldown <= 0) {
            gameProjectiles.push({
                pos: this.pos.copy(),
                vel: toPlayer.normalize().scale(this.data.projectileSpeed),
                damage: { amount: this.data.projectileDamage, isCrit: false },
                friendly: false, color: new Color(0, 1, 0), radius: 0.15, lifetime: 3
            });
            this.attackCooldown = 2;
        }
    }

    behaviorHealer(toPlayer, dist) {
        if (dist > 4) this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
        else if (dist < 2) this.pos = this.pos.subtract(toPlayer.normalize().scale(this.speed * timeDelta));
        if (this.attackCooldown <= 0) {
            for (const enemy of gameEnemies) {
                if (enemy === this) continue;
                if (this.pos.distance(enemy.pos) < this.data.healRadius && enemy.hp < enemy.maxHp) {
                    enemy.hp = Math.min(enemy.maxHp, enemy.hp + this.data.healAmount);
                }
            }
            this.attackCooldown = 2;
        }
    }

    behaviorAccelerate(toPlayer, dist) {
        this.speed = Math.min(this.data.maxSpeed, this.speed + this.data.acceleration * timeDelta);
        if (dist > 0) this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
    }

    behaviorFlee(toPlayer, dist) {
        if (dist > 0) this.pos = this.pos.subtract(toPlayer.normalize().scale(this.speed * timeDelta));
    }

    takeDamage(damageInfo) {
        this.hp -= damageInfo.amount;
        spawnDamageNumber(this.pos.x, this.pos.y, damageInfo.amount, damageInfo.isCrit ? new Color(1, 0.84, 0) : new Color(1, 1, 1));
        if (this.hp <= 0) { this.die(); return true; }
        return false;
    }

    die() {
        // Track kills
        totalKills++;
        waveKills++;

        // Small screen shake on enemy death
        screenShake = Math.min(screenShake + 0.05, 0.3);

        gamePickups.push({ pos: this.pos.add(vec2((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)), type: 'xp', amount: this.data.xpDrop, color: new Color(0, 1, 0) });
        for (let i = 0; i < this.data.materialDrop; i++) {
            gamePickups.push({ pos: this.pos.add(vec2((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8)), type: 'material', amount: 1, color: new Color(1, 0.84, 0) });
        }
        const healthChance = 2 + (gamePlayer ? gamePlayer.getStat('luck') / 10 : 0);
        if (Math.random() * 100 < healthChance) {
            gamePickups.push({ pos: this.pos.copy(), type: 'health', amount: 3, color: new Color(1, 0, 0) });
        }
        const idx = gameEnemies.indexOf(this);
        if (idx > -1) gameEnemies.splice(idx, 1);
        if (window.testHarness) window.testHarness.logEvent('enemy_killed', { type: this.type, id: this.id });
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function spawnDamageNumber(x, y, text, color) {
    gameDamageNumbers.push({ pos: vec2(x, y), text: String(text), color: color, timer: 1, vy: 1 });
}

function getWaveDuration(wave) {
    if (wave >= 9 && wave < 20) return 60;
    if (wave === 20) return 90;
    return 20 + (wave - 1) * 5;
}

function getSpawnRate(wave) { return 0.5 + wave * 0.3; }

function getEnemyPool(wave) {
    const pool = [];
    for (const [type, data] of Object.entries(ENEMIES)) {
        if (wave >= data.firstWave) pool.push(type);
    }
    return pool;
}

function spawnEnemy(type) {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
        case 0: x = Math.random() * ARENA_WIDTH; y = ARENA_HEIGHT + 1; break;
        case 1: x = ARENA_WIDTH + 1; y = Math.random() * ARENA_HEIGHT; break;
        case 2: x = Math.random() * ARENA_WIDTH; y = -1; break;
        case 3: x = -1; y = Math.random() * ARENA_HEIGHT; break;
    }
    gameEnemies.push(new GameEnemy(type, x, y, currentWave));
}

function generateLevelUpOptions() {
    const options = [];
    const stats = Object.keys(UPGRADE_VALUES);
    const used = new Set();
    let tier = gamePlayer.level >= 25 ? 3 : gamePlayer.level >= 10 ? 2 : gamePlayer.level >= 5 ? 1 : 0;
    while (options.length < 4 && used.size < stats.length) {
        const stat = stats[Math.floor(Math.random() * stats.length)];
        if (used.has(stat)) continue;
        used.add(stat);
        let actualTier = tier;
        if (Math.random() < 0.3) actualTier = Math.max(0, tier - 1);
        if (Math.random() < 0.1) actualTier = Math.min(3, tier + 1);
        options.push({ stat: stat, tier: actualTier, value: UPGRADE_VALUES[stat][actualTier] });
    }
    return options;
}

function generateShopItems() {
    const items = [];
    const weaponList = Object.keys(WEAPONS);
    const itemList = Object.keys(ITEMS);
    const tiers = [1];
    if (currentWave >= 2) tiers.push(2);
    if (currentWave >= 4) tiers.push(3);
    if (currentWave >= 8) tiers.push(4);
    for (let i = 0; i < 4; i++) {
        const isWeapon = (currentWave <= 2 && i < 2) || Math.random() < 0.35;
        if (isWeapon) {
            const weaponId = weaponList[Math.floor(Math.random() * weaponList.length)];
            const tier = Math.min(tiers[Math.floor(Math.random() * tiers.length)], 4);
            items.push({ type: 'weapon', id: weaponId, tier: tier, price: Math.floor((20 + tier * 15) * (1 + currentWave * 0.1)) });
        } else {
            const itemId = itemList[Math.floor(Math.random() * itemList.length)];
            const itemData = ITEMS[itemId];
            items.push({ type: 'item', id: itemId, price: Math.floor(itemData.basePrice * (1 + currentWave * 0.1)) });
        }
    }
    return items;
}

function getRerollCost() {
    // Base cost starts at 5 and increases with wave, with increasing cost per reroll
    const base = 5 + Math.floor(currentWave * 0.5);
    const increase = 3 + Math.floor(currentWave * 0.3);
    return base + rerollCount * increase;
}

function rerollShop() {
    const cost = getRerollCost();
    if (gamePlayer.materials >= cost) {
        gamePlayer.materials -= cost;
        rerollCount++;
        shopItems = generateShopItems();
        if (window.testHarness) window.testHarness.logEvent('shop_rerolled', { cost: cost, count: rerollCount });
    }
}

function startNextWave() {
    currentWave++;
    if (currentWave > TOTAL_WAVES) {
        currentGameState = GameState.VICTORY;
        if (window.testHarness) window.testHarness.logEvent('victory', { wave: currentWave - 1, totalKills: totalKills });
        return;
    }
    waveDuration = getWaveDuration(currentWave);
    waveTimer = waveDuration;
    spawnTimer = 0;
    waveKills = 0;
    gameEnemies = [];
    gameProjectiles = [];
    gamePickups = [];
    gameMeleeAttacks = [];
    rerollCount = 0;
    currentGameState = GameState.WAVE_COMBAT;
    if (window.testHarness) window.testHarness.logEvent('wave_started', { wave: currentWave });
}

function endWave() {
    for (const pickup of gamePickups) {
        if (pickup.type === 'xp') gamePlayer.addXp(pickup.amount);
        else if (pickup.type === 'material') gamePlayer.addMaterials(pickup.amount);
    }
    gamePickups = [];
    if (window.testHarness) window.testHarness.logEvent('wave_ended', { wave: currentWave });
    if (pendingLevelUps > 0) {
        levelUpOptions = generateLevelUpOptions();
        currentGameState = GameState.LEVEL_UP;
    } else {
        shopItems = generateShopItems();
        currentGameState = GameState.SHOP;
    }
}

function formatStatName(stat) {
    const names = { maxHp: 'Max HP', hpRegen: 'HP Regen', lifeSteal: 'Life Steal', damage: 'Damage %', meleeDamage: 'Melee', rangedDamage: 'Ranged', elementalDamage: 'Elemental', attackSpeed: 'Attack Speed', critChance: 'Crit %', range: 'Range', armor: 'Armor', dodge: 'Dodge %', speed: 'Speed %', luck: 'Luck', harvesting: 'Harvest' };
    return names[stat] || stat;
}

// ============================================================================
// LITTLEJS CALLBACKS
// ============================================================================

function gameInit() {
    canvasFixedSize = vec2(800, 600);
    cameraScale = 40;
    cameraPos = vec2(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);

    document.addEventListener('mousemove', (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        uiMouseX = e.clientX - rect.left;
        uiMouseY = e.clientY - rect.top;
    });
}

function gameUpdate() {
    if (currentGameState === GameState.WAVE_COMBAT && gamePlayer) {
        waveTimer -= timeDelta;
        if (waveTimer <= 0) { endWave(); return; }

        spawnTimer -= timeDelta;
        if (spawnTimer <= 0 && gameEnemies.length < MAX_ENEMIES) {
            const pool = getEnemyPool(currentWave);
            if (pool.length > 0) spawnEnemy(pool[Math.floor(Math.random() * pool.length)]);
            spawnTimer = 1 / getSpawnRate(currentWave);
        }

        gamePlayer.update();
        cameraPos = gamePlayer.pos.copy();
        cameraPos.x = clamp(cameraPos.x, 10, ARENA_WIDTH - 10);
        cameraPos.y = clamp(cameraPos.y, 7.5, ARENA_HEIGHT - 7.5);

        // Apply screen shake
        if (screenShake > 0) {
            cameraPos.x += (Math.random() - 0.5) * screenShake * 2;
            cameraPos.y += (Math.random() - 0.5) * screenShake * 2;
            screenShake *= 0.9;
            if (screenShake < 0.01) screenShake = 0;
        }

        for (const enemy of gameEnemies) enemy.update();

        // Update projectiles
        for (let i = gameProjectiles.length - 1; i >= 0; i--) {
            const proj = gameProjectiles[i];
            proj.pos = proj.pos.add(proj.vel.scale(timeDelta));
            proj.lifetime -= timeDelta;
            if (proj.pos.x < 0 || proj.pos.x > ARENA_WIDTH || proj.pos.y < 0 || proj.pos.y > ARENA_HEIGHT || proj.lifetime <= 0) {
                gameProjectiles.splice(i, 1);
                continue;
            }
            if (proj.friendly) {
                for (const enemy of gameEnemies) {
                    if (proj.pos.distance(enemy.pos) < proj.radius + enemy.radius) {
                        enemy.takeDamage(proj.damage);
                        // Life steal check
                        if (gamePlayer) {
                            const lifeSteal = gamePlayer.getStat('lifeSteal');
                            if (lifeSteal > 0 && Math.random() * 100 < lifeSteal) {
                                gamePlayer.heal(1);
                                spawnDamageNumber(gamePlayer.pos.x, gamePlayer.pos.y + 0.5, '+1', new Color(0, 1, 0));
                            }
                        }
                        if (proj.piercing > 0) proj.piercing--;
                        else { gameProjectiles.splice(i, 1); break; }
                    }
                }
            } else if (gamePlayer && proj.pos.distance(gamePlayer.pos) < proj.radius + gamePlayer.radius) {
                gamePlayer.takeDamage(proj.damage.amount);
                gameProjectiles.splice(i, 1);
            }
        }

        // Update melee attacks
        for (let i = gameMeleeAttacks.length - 1; i >= 0; i--) {
            const attack = gameMeleeAttacks[i];
            attack.timer -= timeDelta;
            if (attack.timer <= 0) { gameMeleeAttacks.splice(i, 1); continue; }
            for (const enemy of gameEnemies) {
                if (attack.hit.has(enemy.id)) continue;
                const dist = attack.pos.distance(enemy.pos);
                if (dist < attack.range) {
                    const angle = Math.atan2(enemy.pos.y - attack.pos.y, enemy.pos.x - attack.pos.x);
                    let angleDiff = Math.abs(angle - attack.angle);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                    if (angleDiff < (attack.sweep ? Math.PI / 2 : Math.PI / 6)) {
                        enemy.takeDamage(attack.damage);
                        attack.hit.add(enemy.id);
                        // Life steal check
                        if (gamePlayer) {
                            const lifeSteal = gamePlayer.getStat('lifeSteal');
                            if (lifeSteal > 0 && Math.random() * 100 < lifeSteal) {
                                gamePlayer.heal(1);
                                spawnDamageNumber(gamePlayer.pos.x, gamePlayer.pos.y + 0.5, '+1', new Color(0, 1, 0));
                            }
                        }
                    }
                }
            }
        }

        // Update damage numbers
        for (let i = gameDamageNumbers.length - 1; i >= 0; i--) {
            const num = gameDamageNumbers[i];
            num.pos.y += num.vy * timeDelta;
            num.timer -= timeDelta;
            if (num.timer <= 0) gameDamageNumbers.splice(i, 1);
        }
    }

    // Handle input for menus
    if (currentGameState === GameState.MENU && (keyWasPressed('Space') || mouseWasPressed(0))) {
        currentGameState = GameState.CHARACTER_SELECT;
    }
    if (currentGameState === GameState.PAUSED && keyWasPressed('Escape')) {
        currentGameState = GameState.WAVE_COMBAT;
    } else if (currentGameState === GameState.WAVE_COMBAT && keyWasPressed('Escape')) {
        currentGameState = GameState.PAUSED;
    }
    if ((currentGameState === GameState.GAME_OVER || currentGameState === GameState.VICTORY) && mouseWasPressed(0)) {
        resetGame();
        currentGameState = GameState.MENU;
    }
}

function gameUpdatePost() {}

function gameRender() {
    // Draw arena floor
    drawRect(vec2(ARENA_WIDTH / 2, ARENA_HEIGHT / 2), vec2(ARENA_WIDTH, ARENA_HEIGHT), new Color(0.23, 0.23, 0.28));

    // Grid pattern
    for (let x = 0; x < ARENA_WIDTH; x += 2) {
        for (let y = 0; y < ARENA_HEIGHT; y += 2) {
            if ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0) {
                drawRect(vec2(x + 1, y + 1), vec2(2, 2), new Color(0.29, 0.29, 0.35));
            }
        }
    }

    // Border
    drawRect(vec2(ARENA_WIDTH / 2, -0.25), vec2(ARENA_WIDTH, 0.5), new Color(0.15, 0.15, 0.2));
    drawRect(vec2(ARENA_WIDTH / 2, ARENA_HEIGHT + 0.25), vec2(ARENA_WIDTH, 0.5), new Color(0.15, 0.15, 0.2));
    drawRect(vec2(-0.25, ARENA_HEIGHT / 2), vec2(0.5, ARENA_HEIGHT), new Color(0.15, 0.15, 0.2));
    drawRect(vec2(ARENA_WIDTH + 0.25, ARENA_HEIGHT / 2), vec2(0.5, ARENA_HEIGHT), new Color(0.15, 0.15, 0.2));

    // Pickups
    for (const pickup of gamePickups) {
        drawRect(pickup.pos, vec2(0.2, 0.2), pickup.color);
    }

    // Enemies
    for (const enemy of gameEnemies) {
        drawRect(enemy.pos, vec2(enemy.radius * 2, enemy.radius * 2), enemy.color);
        // Eyes
        drawRect(enemy.pos.add(vec2(-enemy.radius * 0.3, enemy.radius * 0.2)), vec2(enemy.radius * 0.4, enemy.radius * 0.4), new Color(0, 0, 0));
        drawRect(enemy.pos.add(vec2(enemy.radius * 0.3, enemy.radius * 0.2)), vec2(enemy.radius * 0.4, enemy.radius * 0.4), new Color(0, 0, 0));
        // Health bar
        if (enemy.hp < enemy.maxHp) {
            drawRect(enemy.pos.add(vec2(0, enemy.radius + 0.2)), vec2(enemy.radius * 2, 0.1), new Color(0.2, 0.2, 0.2));
            drawRect(enemy.pos.add(vec2(-(enemy.radius * (1 - enemy.hp / enemy.maxHp)), enemy.radius + 0.2)), vec2(enemy.radius * 2 * (enemy.hp / enemy.maxHp), 0.1), new Color(1, 0, 0));
        }
    }

    // Player
    if (gamePlayer) {
        drawRect(gamePlayer.pos, vec2(gamePlayer.radius * 2, gamePlayer.radius * 2.4), gamePlayer.color);
        // Face
        drawRect(gamePlayer.pos.add(vec2(-0.12, 0.08)), vec2(0.1, 0.1), new Color(1, 1, 1));
        drawRect(gamePlayer.pos.add(vec2(0.12, 0.08)), vec2(0.1, 0.1), new Color(1, 1, 1));
        drawRect(gamePlayer.pos.add(vec2(-0.12, 0.08)), vec2(0.05, 0.05), new Color(0, 0, 0));
        drawRect(gamePlayer.pos.add(vec2(0.12, 0.08)), vec2(0.05, 0.05), new Color(0, 0, 0));
        // Invincibility flash
        if (gamePlayer.invincibleTimer > 0 && Math.floor(gamePlayer.invincibleTimer * 10) % 2 === 0) {
            drawRect(gamePlayer.pos, vec2(gamePlayer.radius * 2.5, gamePlayer.radius * 3), new Color(1, 1, 1, 0.5));
        }
    }

    // Melee attacks
    for (const attack of gameMeleeAttacks) {
        const alpha = attack.timer / 0.2;
        for (let a = -0.5; a <= 0.5; a += 0.1) {
            const angle = attack.angle + a * (attack.sweep ? Math.PI / 2 : Math.PI / 6);
            const endPos = attack.pos.add(vec2(Math.cos(angle) * attack.range, Math.sin(angle) * attack.range));
            drawLine(attack.pos, endPos, 0.1, new Color(attack.color.r, attack.color.g, attack.color.b, alpha));
        }
    }

    // Projectiles
    for (const proj of gameProjectiles) {
        drawRect(proj.pos, vec2(proj.radius * 2, proj.radius * 2), proj.color);
    }

    // Damage numbers
    for (const num of gameDamageNumbers) {
        drawText(num.text, num.pos, 0.4, num.color);
    }
}

function gameRenderPost() {
    const ctx = mainContext || overlayContext || mainCanvas?.getContext('2d');
    if (!ctx) return;
    ctx.save();

    switch (currentGameState) {
        case GameState.MENU: renderMenu(ctx); break;
        case GameState.CHARACTER_SELECT: renderCharacterSelect(ctx); break;
        case GameState.WAVE_COMBAT:
        case GameState.PAUSED:
            renderHUD(ctx);
            if (currentGameState === GameState.PAUSED) renderPauseOverlay(ctx);
            break;
        case GameState.LEVEL_UP:
            renderHUD(ctx);
            renderLevelUp(ctx);
            break;
        case GameState.SHOP: renderShop(ctx); break;
        case GameState.GAME_OVER: renderGameOver(ctx); break;
        case GameState.VICTORY: renderVictory(ctx); break;
    }

    ctx.restore();
}

function renderMenu(ctx) {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BROTATO', 400, 200);
    ctx.font = '24px Arial';
    ctx.fillText('Arena Survivor', 400, 250);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Press SPACE to Start', 400, 400);
    ctx.font = '16px Arial';
    ctx.fillText('WASD to Move | Weapons fire automatically', 400, 500);
}

function renderCharacterSelect(ctx) {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT CHARACTER', 400, 80);

    const chars = Object.values(CHARACTERS);
    const boxWidth = 140;
    const startX = (800 - chars.length * boxWidth) / 2;

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const boxX = startX + i * boxWidth;
        const boxY = 150;
        const hover = uiMouseX >= boxX && uiMouseX <= boxX + boxWidth - 10 && uiMouseY >= boxY && uiMouseY <= boxY + 100;

        ctx.fillStyle = hover ? '#4a4a5a' : '#2a2a3a';
        ctx.fillRect(boxX, boxY, boxWidth - 10, 100);

        ctx.fillStyle = `rgb(${char.color.r * 255}, ${char.color.g * 255}, ${char.color.b * 255})`;
        ctx.beginPath();
        ctx.arc(boxX + boxWidth / 2 - 5, boxY + 40, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText(char.name, boxX + boxWidth / 2 - 5, boxY + 80);

        if (hover) {
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '11px Arial';
            ctx.fillText(char.description, boxX + boxWidth / 2 - 5, boxY + 95);

            if (mouseWasPressed(0)) {
                selectCharacter(char.id);
            }
        }
    }
}

function selectCharacter(characterId) {
    gamePlayer = new GamePlayer(characterId);
    currentWave = 0;
    pendingLevelUps = 0;
    startNextWave();
    if (window.testHarness) window.testHarness.logEvent('game_started', { character: characterId });
}

function renderHUD(ctx) {
    if (!gamePlayer) return;

    // HP Bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(20, 20, 200 * (gamePlayer.hp / gamePlayer.getMaxHp()), 20);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(gamePlayer.hp)} / ${gamePlayer.getMaxHp()}`, 120, 35);

    // XP Bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 45, 200, 15);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(20, 45, 200 * (gamePlayer.xp / gamePlayer.getXpToNextLevel()), 15);
    ctx.font = '12px Arial';
    ctx.fillText(`LV.${gamePlayer.level}`, 70, 57);

    // Materials
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(35, 80, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gamePlayer.materials, 50, 85);

    // Kill counter
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`Kills: ${waveKills}`, 50, 105);
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px Arial';
    ctx.fillText(`Total: ${totalKills}`, 50, 120);

    // Wave info
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`WAVE ${currentWave}`, 400, 40);
    ctx.font = '36px Arial';
    ctx.fillText(Math.ceil(waveTimer), 400, 80);

    // Weapon slots
    for (let i = 0; i < 6; i++) {
        const weapon = gamePlayer.weapons[i];
        const x = 750 - i * 35;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x - 15, 20, 30, 30);
        if (weapon) {
            const wData = WEAPONS[weapon.id];
            ctx.fillStyle = `rgb(${wData.color.r * 255}, ${wData.color.g * 255}, ${wData.color.b * 255})`;
            ctx.beginPath();
            ctx.arc(x, 35, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = '#666666';
        ctx.strokeRect(x - 15, 20, 30, 30);
    }
}

function renderLevelUp(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', 400, 150);

    const boxWidth = 160;
    const startX = (800 - levelUpOptions.length * boxWidth) / 2;

    for (let i = 0; i < levelUpOptions.length; i++) {
        const opt = levelUpOptions[i];
        const boxX = startX + i * boxWidth;
        const boxY = 220;
        const hover = uiMouseX >= boxX && uiMouseX <= boxX + boxWidth - 10 && uiMouseY >= boxY && uiMouseY <= boxY + 80;

        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(boxX, boxY, boxWidth - 10, 80);

        const tierColors = ['#666666', '#3366FF', '#9933FF', '#FF3333'];
        ctx.fillStyle = tierColors[opt.tier];
        ctx.fillRect(boxX, boxY, boxWidth - 10, 5);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText(formatStatName(opt.stat), boxX + boxWidth / 2 - 5, boxY + 35);
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`+${opt.value}`, boxX + boxWidth / 2 - 5, boxY + 60);

        if (hover) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxWidth - 10, 80);
            if (mouseWasPressed(0)) {
                gamePlayer.baseStats[opt.stat] += opt.value;
                pendingLevelUps--;
                if (pendingLevelUps > 0) levelUpOptions = generateLevelUpOptions();
                else { shopItems = generateShopItems(); currentGameState = GameState.SHOP; }
            }
        }
    }
}

function renderShop(ctx) {
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SHOP - Wave ${currentWave}`, 400, 50);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(340, 90, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gamePlayer.materials, 360, 98);

    const boxWidth = 180;
    const startX = (800 - shopItems.length * boxWidth) / 2;

    for (let i = 0; i < shopItems.length; i++) {
        const item = shopItems[i];
        const boxX = startX + i * boxWidth;
        const boxY = 150;
        const hover = uiMouseX >= boxX && uiMouseX <= boxX + boxWidth - 10 && uiMouseY >= boxY && uiMouseY <= boxY + 120;

        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(boxX, boxY, boxWidth - 10, 120);

        ctx.textAlign = 'center';
        if (item.type === 'weapon') {
            const wData = WEAPONS[item.id];
            ctx.fillStyle = `rgb(${wData.color.r * 255}, ${wData.color.g * 255}, ${wData.color.b * 255})`;
            ctx.beginPath();
            ctx.arc(boxX + boxWidth / 2 - 5, boxY + 40, 20, 0, Math.PI * 2);
            ctx.fill();
            const tierColors = ['#FFFFFF', '#3366FF', '#9933FF', '#FF3333'];
            ctx.fillStyle = tierColors[item.tier - 1];
            ctx.font = '12px Arial';
            ctx.fillText(`Tier ${item.tier}`, boxX + boxWidth / 2 - 5, boxY + 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText(wData.name, boxX + boxWidth / 2 - 5, boxY + 75);
        } else {
            const iData = ITEMS[item.id];
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(boxX + boxWidth / 2 - 20, boxY + 25, 30, 30);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText(iData.name, boxX + boxWidth / 2 - 5, boxY + 75);
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '10px Arial';
            ctx.fillText(iData.description, boxX + boxWidth / 2 - 5, boxY + 90);
        }

        ctx.fillStyle = gamePlayer.materials >= item.price ? '#00FF00' : '#FF0000';
        ctx.font = '16px Arial';
        ctx.fillText(`${item.price}`, boxX + boxWidth / 2 - 5, boxY + 110);

        if (hover) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxWidth - 10, 120);
            if (mouseWasPressed(0) && gamePlayer.materials >= item.price) {
                if (item.type === 'weapon') gamePlayer.addWeapon(item.id, item.tier);
                else gamePlayer.items.push({ id: item.id });
                gamePlayer.materials -= item.price;
                shopItems.splice(i, 1);
            }
        }
    }

    // Reroll button
    const rerollCost = getRerollCost();
    const rerollX = 50, rerollY = 300;
    const rerollHover = uiMouseX >= rerollX && uiMouseX <= rerollX + 120 && uiMouseY >= rerollY && uiMouseY <= rerollY + 40;
    const canReroll = gamePlayer.materials >= rerollCost;
    ctx.fillStyle = rerollHover && canReroll ? '#5555AA' : canReroll ? '#3a3a6a' : '#333333';
    ctx.fillRect(rerollX, rerollY, 120, 40);
    ctx.fillStyle = canReroll ? '#FFFFFF' : '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('REROLL', rerollX + 60, rerollY + 18);
    ctx.fillStyle = canReroll ? '#FFD700' : '#666666';
    ctx.font = '12px Arial';
    ctx.fillText(`${rerollCost} materials`, rerollX + 60, rerollY + 33);
    if (rerollHover && canReroll && mouseWasPressed(0)) rerollShop();

    // Next wave button
    const nextX = 320, nextY = 450;
    const nextHover = uiMouseX >= nextX && uiMouseX <= nextX + 160 && uiMouseY >= nextY && uiMouseY <= nextY + 50;
    ctx.fillStyle = nextHover ? '#33AA33' : '#228B22';
    ctx.fillRect(nextX, nextY, 160, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('START WAVE', nextX + 80, nextY + 32);
    if (nextHover && mouseWasPressed(0)) startNextWave();

    // Weapons display
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Your Weapons:', 50, 530);
    for (let i = 0; i < 6; i++) {
        const weapon = gamePlayer.weapons[i];
        const x = 180 + i * 45;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x - 15, 515, 35, 35);
        if (weapon) {
            const wData = WEAPONS[weapon.id];
            ctx.fillStyle = `rgb(${wData.color.r * 255}, ${wData.color.g * 255}, ${wData.color.b * 255})`;
            ctx.beginPath();
            ctx.arc(x, 532, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 400, 280);
    ctx.font = '20px Arial';
    ctx.fillText('Press ESC to resume', 400, 330);
}

function renderGameOver(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Reached Wave ${currentWave}`, 400, 260);
    ctx.fillText(`Level ${gamePlayer ? gamePlayer.level : 0}`, 400, 295);
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`Enemies Killed: ${totalKills}`, 400, 330);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Materials Earned: ${gamePlayer ? gamePlayer.materials : 0}`, 400, 365);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Click to try again', 400, 450);
}

function renderVictory(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 180);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('You survived all 20 waves!', 400, 240);
    ctx.fillText(`Final Level: ${gamePlayer ? gamePlayer.level : 0}`, 400, 280);
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`Total Enemies Killed: ${totalKills}`, 400, 320);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Final Materials: ${gamePlayer ? gamePlayer.materials : 0}`, 400, 360);
    ctx.fillStyle = '#00FF00';
    ctx.fillText(`Weapons: ${gamePlayer ? gamePlayer.weapons.length : 0}/6`, 400, 400);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Click to play again', 400, 480);
}

function resetGame() {
    gamePlayer = null;
    gameEnemies = [];
    gameProjectiles = [];
    gamePickups = [];
    gameMeleeAttacks = [];
    gameDamageNumbers = [];
    currentWave = 0;
    pendingLevelUps = 0;
    totalKills = 0;
    waveKills = 0;
}

// ============================================================================
// DEBUG COMMANDS
// ============================================================================

window.debugCommands = {
    skipToLevel: (level) => { if (gamePlayer) { while (gamePlayer.level < level) { gamePlayer.level++; gamePlayer.baseStats.maxHp += 1; pendingLevelUps++; } gamePlayer.hp = gamePlayer.getMaxHp(); } },
    skipToWave: (wave) => { currentWave = wave - 1; startNextWave(); },
    skipToBoss: () => { currentWave = 19; startNextWave(); },
    godMode: (enabled) => { if (gamePlayer) gamePlayer.godMode = enabled; },
    setHealth: (amount) => { if (gamePlayer) gamePlayer.hp = Math.min(amount, gamePlayer.getMaxHp()); },
    giveCoins: (amount) => { if (gamePlayer) gamePlayer.materials += amount; },
    giveMaterials: (amount) => { if (gamePlayer) gamePlayer.materials += amount; },
    giveAllWeapons: () => { if (gamePlayer) { gamePlayer.weapons = []; Object.keys(WEAPONS).slice(0, 6).forEach(id => gamePlayer.addWeapon(id, 4)); } },
    giveItem: (itemId) => { if (gamePlayer && ITEMS[itemId]) gamePlayer.items.push({ id: itemId }); },
    clearRoom: () => { while (gameEnemies.length > 0) gameEnemies[0].die(); },
    spawnEnemy: (type, x, y) => { if (ENEMIES[type]) gameEnemies.push(new GameEnemy(type, x || (gamePlayer?.pos.x + 3) || 10, y || gamePlayer?.pos.y || 10, currentWave)); }
};

// ============================================================================
// GLOBAL GETTERS FOR TEST HARNESS
// ============================================================================

window.getPlayer = () => gamePlayer;
window.getEnemies = () => gameEnemies;
window.getProjectiles = () => gameProjectiles;
window.getPickups = () => gamePickups;
window.getGameState = () => currentGameState;
window.getCurrentWave = () => currentWave;
window.getWaveTimer = () => waveTimer;
window.startGame = () => { if (currentGameState === GameState.MENU) currentGameState = GameState.CHARACTER_SELECT; };
window.selectCharacter = selectCharacter;
window.startNextWave = startNextWave;

// ============================================================================
// START GAME
// ============================================================================

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['']);
