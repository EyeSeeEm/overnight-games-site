// Minishoot Adventures Clone - Canvas Implementation
// A twin-stick shooter adventure with exploration and upgrades

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 3200;
const TILE_SIZE = 32;

// Colors - Vibrant cartoon style
const COLORS = {
    // Biome colors
    GRASS_LIGHT: '#4aa64a',
    GRASS_DARK: '#3a8a3a',
    WATER: '#3a7aaa',
    SAND: '#d4b896',
    CAVE: '#4a3a6a',
    LAVA: '#aa4a2a',
    CORRUPTION: '#5a2a5a',
    VILLAGE: '#6a8a6a',

    // UI
    UI_BG: '#2a3a4a',
    HEALTH: '#ff4444',
    ENERGY: '#44aaff',
    XP: '#ffaa44',

    // Entities
    PLAYER: '#44ff44',
    ENEMY: '#ff6644',
    BULLET: '#ffff44',
    SUPER_BULLET: '#44aaff',
    CRYSTAL: '#ff4466'
};

// Game State
let gameState = 'title';
let player = null;
let camera = { x: 0, y: 0 };
let enemies = [];
let bullets = [];
let enemyBullets = [];
let crystals = [];
let particles = [];
let worldTiles = [];
let rooms = [];
let currentRoom = null;
let npcs = [];
let heartPieces = [];
let energyBatteries = [];
let dungeonEntrances = [];
let currentBoss = null;
let timeStopActive = false;
let timeStopDuration = 0;
let miniBosses = [];
let mapFragments = [];
let goldenScarabs = [];
let redCoins = 0;
let scarabCount = 0;
let inBossFight = false;
let screenShake = { intensity: 0, duration: 0 };
let floatTexts = [];
let races = [];
let currentRace = null;
let raceTimer = 0;
let completedRaces = [];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    explorer: { enemyHP: 0.8, enemySpeed: 0.7, bulletSpeed: 0.7, enemyDamage: 0.7, name: 'Explorer' },
    original: { enemyHP: 1.0, enemySpeed: 1.0, bulletSpeed: 1.0, enemyDamage: 1.0, name: 'Original' },
    expert: { enemyHP: 1.2, enemySpeed: 1.3, bulletSpeed: 1.3, enemyDamage: 1.3, name: 'Expert' }
};
let currentDifficulty = 'original';

// Module definitions
const MODULES = {
    primordialCrystal: { name: 'Primordial Crystal', desc: '19x damage at full HP', cost: 15, effect: 'primordialShot' },
    rageModule: { name: 'Rage Module', desc: '2.5x damage at low HP', cost: 12, effect: 'rageShot' },
    luckyHeart: { name: 'Lucky Heart', desc: '+10% crit chance', cost: 10, effect: 'critBonus' },
    compass: { name: 'Compass', desc: 'Shows secrets on minimap', cost: 5, effect: 'showSecrets' },
    astrolabe: { name: 'Astrolabe', desc: 'Shows ALL secrets', cost: 20, effect: 'showAllSecrets' },
    enhancer: { name: 'Restoration Enhancer', desc: '-20% XP to level', cost: 8, effect: 'xpBonus' }
};

// Race definitions
const RACE_DEFINITIONS = [
    { id: 'forest1', name: 'Forest Sprint', startX: 1600, startY: 2200, endX: 1800, endY: 2600, time: 30, reward: 5, rewardType: 'coins' },
    { id: 'forest2', name: 'Blue Trail', startX: 1500, startY: 2500, endX: 1900, endY: 2300, time: 25, reward: 5, rewardType: 'coins' },
    { id: 'desert1', name: 'Sand Dash', startX: 500, startY: 1500, endX: 800, endY: 1700, time: 35, reward: 1, rewardType: 'heartPiece' },
    { id: 'caves1', name: 'Crystal Run', startX: 1500, startY: 500, endX: 1700, endY: 300, time: 40, reward: 1, rewardType: 'battery' }
];

// NPC definitions
const NPC_TYPES = {
    mechanic: { name: 'Mechanic', service: 'Respec skills', x: 1350, y: 1350 },
    healer: { name: 'Healer', service: 'Full heal', x: 1450, y: 1350 },
    shopkeeper: { name: 'Shopkeeper', service: 'Buy upgrades', x: 1400, y: 1450 },
    elder: { name: 'Elder', service: 'Lore/hints', x: 1350, y: 1450 },
    cartographer: { name: 'Cartographer', service: 'Map fragments', x: 1500, y: 1400 },
    racer: { name: 'Racer', service: 'Race challenges', x: 1550, y: 1350 },
    collector: { name: 'Collector', service: 'Trade scarabs', x: 1300, y: 1400 },
    enchanter: { name: 'Enchanter', service: 'Buy modules', x: 1500, y: 1450 }
};

// Player data
const playerData = {
    maxHealth: 3,
    health: 3,
    maxEnergy: 4,
    energy: 4,
    crystals: 0,
    level: 1,
    xp: 0,
    xpToLevel: 10,
    skillPoints: 0,
    skills: {
        damage: 0,
        fireRate: 0,
        range: 0,
        speed: 0,
        critical: 0
    },
    abilities: {
        dash: false,
        supershot: false,
        surf: false,
        timeStop: false
    },
    modules: [],
    heartPieces: 0,
    energyBatteries: 0,
    bossesDefeated: []
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false };

// Enemy types
const ENEMY_TYPES = {
    scout: { hp: 2, speed: 100, damage: 1, fireRate: 1.0, xp: 1, color: '#ff6644' },
    grasshopper: { hp: 3, speed: 150, damage: 1, fireRate: 0.8, xp: 2, color: '#66aa44' },
    turret: { hp: 5, speed: 0, damage: 1, fireRate: 0.5, xp: 3, color: '#666666' },
    heavy: { hp: 10, speed: 60, damage: 2, fireRate: 2.0, xp: 5, color: '#884444' },
    elite_scout: { hp: 8, speed: 120, damage: 2, fireRate: 0.8, xp: 5, color: '#aa44aa' },
    burrower: { hp: 6, speed: 120, damage: 1, fireRate: 1.5, xp: 4, color: '#aa8844', homing: true },
    tree_mimic: { hp: 4, speed: 80, damage: 1, fireRate: 1.2, xp: 3, color: '#228844', ambush: true },
    elite_grasshopper: { hp: 12, speed: 180, damage: 2, fireRate: 0.6, xp: 8, color: '#cc44cc' },
    elite_turret: { hp: 20, speed: 0, damage: 2, fireRate: 0.3, xp: 10, color: '#cc44cc' },
    elite_heavy: { hp: 30, speed: 80, damage: 2, fireRate: 1.5, xp: 15, color: '#cc44cc' }
};

// Boss data
const BOSSES = {
    forestGuardian: { name: 'Forest Guardian', hp: 800, phases: 4, reward: 'dash', color: '#228844' },
    sandWyrm: { name: 'Sand Wyrm', hp: 1200, phases: 4, reward: 'supershot', color: '#aa8844' },
    leviathan: { name: 'Leviathan', hp: 1500, phases: 4, reward: 'surf', color: '#4488aa' },
    infernoCore: { name: 'Inferno Core', hp: 2000, phases: 4, reward: 'timeStop', color: '#aa4422' },
    theUnchosen: { name: 'The Unchosen', hp: 5000, phases: 6, reward: null, color: '#662266' }
};

// Mini-boss data
const MINI_BOSSES = {
    stoneSnake: { name: 'Stone Snake', hp: 100, xp: 20, color: '#888866' },
    forestSpirit: { name: 'Forest Spirit', hp: 80, xp: 15, color: '#44aa66' },
    coralBeast: { name: 'Coral Beast', hp: 120, xp: 25, color: '#ff6688' }
};

// Dungeon definitions
const DUNGEONS = {
    forestTemple: {
        name: 'Forest Temple',
        rooms: 10,
        x: 1200, y: 2800,
        boss: 'forestGuardian',
        biome: 'forest'
    },
    desertTemple: {
        name: 'Desert Temple',
        rooms: 12,
        x: 400, y: 1500,
        boss: 'sandWyrm',
        biome: 'desert'
    },
    sunkenTemple: {
        name: 'Sunken Temple',
        rooms: 10,
        x: 2800, y: 2800,
        boss: 'leviathan',
        biome: 'water'
    },
    volcanicTemple: {
        name: 'Volcanic Temple',
        rooms: 12,
        x: 600, y: 600,
        boss: 'infernoCore',
        biome: 'lava'
    }
};

// Biome definitions
const BIOMES = {
    village: { x: 1400, y: 1400, radius: 300, type: 'village', name: 'Central Village' },
    blueForest: { x: 1600, y: 2400, radius: 600, type: 'forest', name: 'Blue Forest' },
    desert: { x: 600, y: 1600, radius: 500, type: 'desert', name: 'Sandy Desert' },
    autumn: { x: 2400, y: 800, radius: 500, type: 'autumn', name: 'Autumn Forest' },
    caves: { x: 1600, y: 400, radius: 400, type: 'cave', name: 'Crystal Caves' },
    sunken: { x: 2600, y: 2600, radius: 400, type: 'water', name: 'Sunken City' },
    volcanic: { x: 400, y: 400, radius: 400, type: 'lava', name: 'Volcanic Zone' },
    corruption: { x: 1600, y: 1600, radius: 200, type: 'corruption', name: 'Corruption Zone' }
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.angle = 0;
        this.speed = 200;
        this.fireRate = 3;
        this.damage = 1;
        this.range = 300;
        this.lastFired = 0;
        this.dashCooldown = 0;
        this.invincibleTime = 0;
        this.isBoosting = false;
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Calculate speed with upgrades
        const speedBonus = playerData.skills.speed * 20;
        let currentSpeed = this.speed + speedBonus;

        // Boost
        if (keys[' '] && playerData.abilities.dash && playerData.energy > 0) {
            this.isBoosting = true;
            currentSpeed *= 2;
            playerData.energy = Math.max(0, playerData.energy - 2 * dt);
        } else {
            this.isBoosting = false;
        }

        this.x += dx * currentSpeed * dt;
        this.y += dy * currentSpeed * dt;

        // World bounds
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        // Aim towards mouse
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= dt;
        }

        // Invincibility
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
        }

        // Energy regen
        if (!this.isBoosting && playerData.energy < playerData.maxEnergy) {
            playerData.energy = Math.min(playerData.maxEnergy, playerData.energy + 0.5 * dt);
        }

        // Firing
        const fireRateBonus = playerData.skills.fireRate * 0.5;
        const currentFireRate = this.fireRate + fireRateBonus;
        const fireInterval = 1 / currentFireRate;

        if (mouse.down && performance.now() / 1000 - this.lastFired > fireInterval) {
            this.fire();
            this.lastFired = performance.now() / 1000;
        }

        // Supershot
        if (mouse.rightDown && playerData.abilities.supershot && playerData.energy >= 1) {
            this.fireSupershot();
            playerData.energy -= 1;
            mouse.rightDown = false;
        }

        // Dash (shift key)
        if (keys['shift'] && playerData.abilities.dash && this.dashCooldown <= 0) {
            this.dash();
        }
    }

    fire() {
        const damageBonus = playerData.skills.damage * 0.5;
        const rangeBonus = playerData.skills.range * 30;
        const damageMultiplier = getDamageMultiplier();

        // Determine bullet type based on modules
        let bulletType = 'normal';
        let bulletColor = '#ffff44';
        if (damageMultiplier >= 19) {
            bulletType = 'primordial';
            bulletColor = '#ffd700'; // Golden
        } else if (damageMultiplier >= 2.5) {
            bulletType = 'rage';
            bulletColor = '#ff4444'; // Red
        }

        // Check for crit
        const isCrit = Math.random() < getCritChance();
        const critMultiplier = isCrit ? 2.0 : 1.0;

        const bullet = {
            x: this.x,
            y: this.y,
            vx: Math.cos(this.angle) * 400,
            vy: Math.sin(this.angle) * 400,
            damage: (this.damage + damageBonus) * damageMultiplier * critMultiplier,
            range: this.range + rangeBonus,
            traveled: 0,
            isSuper: false,
            type: bulletType,
            color: bulletColor,
            isCrit: isCrit
        };
        bullets.push(bullet);

        // Muzzle flash particle - color matches bullet type
        spawnParticle(this.x + Math.cos(this.angle) * 15, this.y + Math.sin(this.angle) * 15, bulletColor);
    }

    fireSupershot() {
        const damageBonus = playerData.skills.damage * 0.5;
        const rangeBonus = playerData.skills.range * 30;
        const bullet = {
            x: this.x,
            y: this.y,
            vx: Math.cos(this.angle) * 500,
            vy: Math.sin(this.angle) * 500,
            damage: (this.damage + damageBonus) * 3,
            range: (this.range + rangeBonus) * 1.5,
            traveled: 0,
            isSuper: true
        };
        bullets.push(bullet);

        // Big muzzle flash
        for (let i = 0; i < 5; i++) {
            spawnParticle(this.x + Math.cos(this.angle) * 15, this.y + Math.sin(this.angle) * 15, '#44aaff');
        }
    }

    dash() {
        const dashDist = 150;
        this.x += Math.cos(this.angle) * dashDist;
        this.y += Math.sin(this.angle) * dashDist;
        this.dashCooldown = 0.5;
        this.invincibleTime = 0.2;

        // Dash particles
        for (let i = 0; i < 8; i++) {
            spawnParticle(this.x, this.y, '#44ff44');
        }
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0) return;

        playerData.health -= amount;
        this.invincibleTime = 1.0;

        // Damage particles
        for (let i = 0; i < 10; i++) {
            spawnParticle(this.x, this.y, '#ff4444');
        }

        if (playerData.health <= 0) {
            gameState = 'gameover';
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Flicker when invincible
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2) {
            ctx.globalAlpha = 0.5;
        }

        // Ship body - cute rounded shape
        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius * 0.5, -this.radius * 0.4);
        ctx.lineTo(this.radius * 0.5, this.radius * 0.4);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(4, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        const data = ENEMY_TYPES[type];
        this.type = type;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = data.speed;
        this.damage = data.damage;
        this.fireRate = data.fireRate;
        this.xp = data.xp;
        this.color = data.color;
        this.radius = 10;
        this.lastFired = 0;
        this.state = 'patrol';
        this.patrolTarget = { x: this.x + Math.random() * 200 - 100, y: this.y + Math.random() * 200 - 100 };
    }

    update(dt) {
        if (!player) return;

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // State machine
        if (distToPlayer < 300) {
            this.state = 'attack';
        } else if (distToPlayer < 500) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }

        // Behavior
        if (this.state === 'attack') {
            // Move towards player but maintain distance
            if (distToPlayer > 150) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }

            // Fire at player
            const time = performance.now() / 1000;
            if (time - this.lastFired > this.fireRate) {
                this.fire();
                this.lastFired = time;
            }
        } else if (this.state === 'chase') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        } else {
            // Patrol
            const distToPatrol = Math.hypot(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y);
            if (distToPatrol < 20) {
                this.patrolTarget = {
                    x: this.x + Math.random() * 200 - 100,
                    y: this.y + Math.random() * 200 - 100
                };
            } else {
                const angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
                this.x += Math.cos(angle) * this.speed * 0.5 * dt;
                this.y += Math.sin(angle) * this.speed * 0.5 * dt;
            }
        }
    }

    fire() {
        if (!player) return;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.type === 'turret') {
            // Spray pattern
            for (let i = 0; i < 8; i++) {
                const bulletAngle = (i / 8) * Math.PI * 2;
                enemyBullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(bulletAngle) * 150,
                    vy: Math.sin(bulletAngle) * 150,
                    damage: this.damage
                });
            }
        } else if (this.type === 'heavy') {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                enemyBullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle + i * 0.2) * 180,
                    vy: Math.sin(angle + i * 0.2) * 180,
                    damage: this.damage
                });
            }
        } else {
            // Single shot
            enemyBullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                damage: this.damage
            });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Floating damage text
        spawnFloatingText(this.x, this.y - 15, Math.floor(amount).toString(), '#ffffff');

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Screen shake on kill
        triggerScreenShake(3, 0.15);

        // Drop crystals
        for (let i = 0; i < this.xp; i++) {
            crystals.push({
                x: this.x + Math.random() * 30 - 15,
                y: this.y + Math.random() * 30 - 15,
                value: 1
            });
        }

        // Death particles
        for (let i = 0; i < 8; i++) {
            spawnParticle(this.x, this.y, this.color);
        }

        // Remove from array
        const idx = enemies.indexOf(this);
        if (idx > -1) enemies.splice(idx, 1);
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#440000';
        ctx.fillRect(screenX - 15, screenY - 20, 30, 4);
        ctx.fillStyle = '#44aa44';
        ctx.fillRect(screenX - 15, screenY - 20, 30 * (this.hp / this.maxHp), 4);
    }
}

// Particle functions
function spawnParticle(x, y, color) {
    particles.push({
        x, y,
        vx: Math.random() * 100 - 50,
        vy: Math.random() * 100 - 50,
        color,
        life: 0.5
    });
}

// Screen shake function
function triggerScreenShake(intensity, duration) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = Math.max(screenShake.duration, duration);
}

// Float text function
function spawnFloatText(x, y, text, color = '#ffffff', size = 14) {
    floatTexts.push({
        x, y,
        text,
        color,
        size,
        life: 1.5,
        vy: -30
    });
}

// Apply difficulty modifiers to enemy
function applyDifficultyToEnemy(enemy) {
    const diff = DIFFICULTY_SETTINGS[currentDifficulty];
    enemy.hp = Math.ceil(enemy.hp * diff.enemyHP);
    enemy.maxHp = enemy.hp;
    enemy.speed *= diff.enemySpeed;
    enemy.damage = Math.ceil(enemy.damage * diff.enemyDamage);
}

// Check if player has module
function hasModule(moduleName) {
    return playerData.modules.includes(moduleName);
}

// Get damage multiplier based on modules
function getDamageMultiplier() {
    let mult = 1.0;

    // Primordial Crystal - 19x damage at full HP
    if (hasModule('primordialCrystal') && playerData.health >= playerData.maxHealth) {
        mult = 19.0;
    }
    // Rage Module - 2.5x damage at low HP
    else if (hasModule('rageModule') && playerData.health <= 1) {
        mult = 2.5;
    }

    return mult;
}

// Get crit chance with module bonus
function getCritChance() {
    let crit = playerData.skills.critical * 0.05;
    if (hasModule('luckyHeart')) {
        crit += 0.10;
    }
    return crit;
}

// Get XP requirement with module bonus
function getXPToLevel() {
    let xp = playerData.xpToLevel;
    if (hasModule('enhancer')) {
        xp *= 0.8;
    }
    return Math.ceil(xp);
}

// Start a race
function startRace(race) {
    currentRace = race;
    raceTimer = race.time;
    player.x = race.startX;
    player.y = race.startY;
    spawnFloatText(player.x, player.y - 50, `RACE: ${race.name}!`, '#ffff00', 18);
    spawnFloatText(player.x, player.y - 30, `Time: ${race.time}s`, '#ffffff', 14);
}

// Complete a race
function completeRace(race) {
    completedRaces.push(race.id);
    spawnFloatText(player.x, player.y - 50, 'RACE COMPLETE!', '#44ff44', 20);
    triggerScreenShake(5, 0.3);

    // Give reward
    if (race.rewardType === 'coins') {
        redCoins += race.reward;
        spawnFloatText(player.x, player.y - 20, `+${race.reward} Red Coins`, '#ff4444', 14);
    } else if (race.rewardType === 'heartPiece') {
        playerData.heartPieces++;
        spawnFloatText(player.x, player.y - 20, '+Heart Piece!', '#ff8888', 14);
    } else if (race.rewardType === 'battery') {
        playerData.energyBatteries++;
        playerData.maxEnergy++;
        spawnFloatText(player.x, player.y - 20, '+Energy Battery!', '#44aaff', 14);
    }

    // Check if all races completed for dash invincibility
    if (completedRaces.length >= RACE_DEFINITIONS.length) {
        spawnFloatText(player.x, player.y, 'DASH IMMUNITY UNLOCKED!', '#ffd700', 20);
        playerData.dashImmunity = true;
    }
}

// Buy a module
function buyModule(moduleName) {
    const mod = MODULES[moduleName];
    if (!mod) return false;
    if (redCoins < mod.cost) return false;
    if (playerData.modules.includes(moduleName)) return false;

    redCoins -= mod.cost;
    playerData.modules.push(moduleName);
    spawnFloatText(player.x, player.y - 30, `Acquired: ${mod.name}!`, '#ffaa00', 16);
    return true;
}

let floatingTexts = [];
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.0 });
}

// World generation
function generateWorld() {
    worldTiles = [];
    for (let y = 0; y < WORLD_HEIGHT / TILE_SIZE; y++) {
        worldTiles[y] = [];
        for (let x = 0; x < WORLD_WIDTH / TILE_SIZE; x++) {
            const worldX = x * TILE_SIZE + TILE_SIZE / 2;
            const worldY = y * TILE_SIZE + TILE_SIZE / 2;
            let biome = 'forest';

            // Check biomes
            for (const [name, bio] of Object.entries(BIOMES)) {
                const dist = Math.hypot(worldX - bio.x, worldY - bio.y);
                if (dist < bio.radius) {
                    biome = bio.type;
                    break;
                }
            }

            worldTiles[y][x] = { type: biome, variant: Math.random() };
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const types = Object.keys(ENEMY_TYPES);

    // Spawn enemies throughout world, avoiding village
    for (let i = 0; i < 50; i++) {
        let x, y, valid = false;
        while (!valid) {
            x = Math.random() * WORLD_WIDTH;
            y = Math.random() * WORLD_HEIGHT;
            const distToVillage = Math.hypot(x - BIOMES.village.x, y - BIOMES.village.y);
            if (distToVillage > 400) valid = true;
        }

        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(x, y, type));
    }
}

// Mini-Boss class
class MiniBoss {
    constructor(type, x, y) {
        const data = MINI_BOSSES[type];
        this.type = type;
        this.name = data.name;
        this.x = x;
        this.y = y;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.xp = data.xp;
        this.color = data.color;
        this.radius = 25;
        this.lastFired = 0;
        this.phase = 0;
        this.patternTimer = 0;
        this.defeated = false;
    }

    update(dt) {
        if (!player || this.defeated) return;

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        this.patternTimer += dt;

        // Attack if player is close enough
        if (distToPlayer < 400) {
            const time = performance.now() / 1000;
            if (time - this.lastFired > 1.5) {
                this.attack();
                this.lastFired = time;
            }
        }

        // Slow movement toward player
        if (distToPlayer > 150 && distToPlayer < 500) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * 40 * dt;
            this.y += Math.sin(angle) * 40 * dt;
        }
    }

    attack() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Spiral pattern
        for (let i = 0; i < 8; i++) {
            const bulletAngle = angle + (i / 8) * Math.PI * 2 + this.patternTimer;
            enemyBullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(bulletAngle) * 120,
                vy: Math.sin(bulletAngle) * 120,
                damage: 1
            });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        spawnFloatingText(this.x, this.y - 30, Math.floor(amount).toString(), '#ffaa44');

        // Phase change effects
        if (this.hp <= this.maxHp * 0.5 && this.phase === 0) {
            this.phase = 1;
            for (let i = 0; i < 15; i++) {
                spawnParticle(this.x, this.y, this.color);
            }
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.defeated = true;

        // Medium screen shake on mini-boss kill
        triggerScreenShake(8, 0.3);
        spawnFloatText(this.x, this.y - 40, 'MINI-BOSS DEFEATED!', '#ffaa00', 18);

        // Drop lots of crystals
        for (let i = 0; i < this.xp; i++) {
            crystals.push({
                x: this.x + Math.random() * 60 - 30,
                y: this.y + Math.random() * 60 - 30,
                value: 1
            });
        }

        // Death explosion
        for (let i = 0; i < 30; i++) {
            spawnParticle(this.x, this.y, this.color);
        }

        spawnFloatingText(this.x, this.y - 40, 'MINI-BOSS DEFEATED!', '#ffaa44');
    }

    draw() {
        if (this.defeated) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Pulsing effect
        const pulse = Math.sin(performance.now() / 200) * 3;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#ffffff44';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#440000';
        ctx.fillRect(screenX - 30, screenY - 40, 60, 8);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX - 30, screenY - 40, 60 * (this.hp / this.maxHp), 8);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY - 50);
    }
}

// Boss class
class Boss {
    constructor(type) {
        const data = BOSSES[type];
        this.type = type;
        this.name = data.name;
        this.x = GAME_WIDTH / 2;
        this.y = 200;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.phases = data.phases;
        this.reward = data.reward;
        this.color = data.color;
        this.radius = 40;
        this.currentPhase = 0;
        this.attackTimer = 0;
        this.patternIndex = 0;
        this.defeated = false;
    }

    update(dt) {
        if (!player || this.defeated) return;

        this.attackTimer += dt;

        // Phase transitions
        const hpPercent = this.hp / this.maxHp;
        const newPhase = Math.floor((1 - hpPercent) * this.phases);
        if (newPhase > this.currentPhase) {
            this.currentPhase = newPhase;
            this.phaseTransition();
        }

        // Attack patterns based on phase
        if (this.attackTimer > 2 - (this.currentPhase * 0.3)) {
            this.attack();
            this.attackTimer = 0;
        }

        // Movement
        const targetX = player.x;
        const dx = targetX - this.x;
        this.x += Math.sign(dx) * Math.min(50 * dt, Math.abs(dx));

        // Keep in arena
        this.x = Math.max(100, Math.min(GAME_WIDTH - 100, this.x));
    }

    phaseTransition() {
        // Clear bullets and show effect
        enemyBullets = [];
        for (let i = 0; i < 40; i++) {
            spawnParticle(this.x, this.y, this.color);
        }
        spawnFloatingText(this.x, this.y - 60, `PHASE ${this.currentPhase + 1}`, '#ff4444');
    }

    attack() {
        this.patternIndex++;
        const patterns = ['circleSpray', 'spiralBurst', 'spreadShot', 'targetedBurst'];
        const pattern = patterns[this.patternIndex % patterns.length];

        switch (pattern) {
            case 'circleSpray':
                for (let i = 0; i < 16 + this.currentPhase * 4; i++) {
                    const angle = (i / (16 + this.currentPhase * 4)) * Math.PI * 2;
                    enemyBullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * (100 + this.currentPhase * 20),
                        vy: Math.sin(angle) * (100 + this.currentPhase * 20),
                        damage: 1
                    });
                }
                break;
            case 'spiralBurst':
                for (let i = 0; i < 12; i++) {
                    setTimeout(() => {
                        for (let j = 0; j < 4; j++) {
                            const angle = (j / 4) * Math.PI * 2 + i * 0.3;
                            enemyBullets.push({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle) * 120,
                                vy: Math.sin(angle) * 120,
                                damage: 1
                            });
                        }
                    }, i * 100);
                }
                break;
            case 'spreadShot':
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = -4; i <= 4; i++) {
                    enemyBullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angleToPlayer + i * 0.15) * 150,
                        vy: Math.sin(angleToPlayer + i * 0.15) * 150,
                        damage: 1
                    });
                }
                break;
            case 'targetedBurst':
                const angle2 = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < 5 + this.currentPhase * 2; i++) {
                    setTimeout(() => {
                        enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle2) * 180,
                            vy: Math.sin(angle2) * 180,
                            damage: 1
                        });
                    }, i * 100);
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        spawnFloatingText(this.x, this.y - 50, Math.floor(amount).toString(), '#ffffff');

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.defeated = true;
        currentBoss = null;

        // Big screen shake on boss kill
        triggerScreenShake(15, 0.5);
        spawnFloatText(this.x, this.y - 60, 'BOSS DEFEATED!', '#ffd700', 24);

        // Drop crystals
        for (let i = 0; i < 100; i++) {
            crystals.push({
                x: this.x + Math.random() * 100 - 50,
                y: this.y + Math.random() * 100 - 50,
                value: 1
            });
        }

        // Victory effect
        for (let i = 0; i < 50; i++) {
            spawnParticle(this.x, this.y, this.color);
        }

        // Unlock ability
        if (this.reward) {
            playerData.abilities[this.reward] = true;
            spawnFloatingText(this.x, this.y - 80, `${this.reward.toUpperCase()} UNLOCKED!`, '#44ff44');
        }

        playerData.bossesDefeated.push(this.type);
        spawnFloatingText(this.x, this.y - 60, 'BOSS DEFEATED!', '#ffaa44');

        // Return to world
        setTimeout(() => {
            gameState = 'playing';
        }, 2000);
    }

    draw() {
        if (this.defeated) return;

        const screenX = this.x;
        const screenY = this.y;

        // Boss glow
        const glowSize = Math.sin(performance.now() / 300) * 5;
        ctx.fillStyle = this.color + '44';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 20 + glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Phase indicator
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < this.phases; i++) {
            ctx.globalAlpha = i <= this.currentPhase ? 1 : 0.3;
            ctx.beginPath();
            ctx.arc(screenX - 30 + i * 15, screenY + this.radius + 15, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Health bar
        ctx.fillStyle = '#440000';
        ctx.fillRect(screenX - 60, screenY - 60, 120, 12);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX - 60, screenY - 60, 120 * (this.hp / this.maxHp), 12);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY - 75);
    }
}

// NPC class
class NPC {
    constructor(type) {
        const data = NPC_TYPES[type];
        this.type = type;
        this.name = data.name;
        this.service = data.service;
        this.x = data.x;
        this.y = data.y;
        this.radius = 15;
        this.talkRange = 50;
        this.interacting = false;
    }

    update(dt) {
        if (!player) return;
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        this.nearPlayer = dist < this.talkRange;
    }

    interact() {
        if (!this.nearPlayer) return;

        switch (this.type) {
            case 'healer':
                playerData.health = playerData.maxHealth;
                spawnFloatingText(this.x, this.y - 30, 'Healed!', '#44ff44');
                break;
            case 'mechanic':
                // Reset skills and return points
                const totalPoints = Object.values(playerData.skills).reduce((a, b) => a + b, 0);
                playerData.skillPoints += totalPoints;
                Object.keys(playerData.skills).forEach(k => playerData.skills[k] = 0);
                spawnFloatingText(this.x, this.y - 30, 'Skills Reset!', '#ffaa44');
                break;
            case 'shopkeeper':
                openShop();
                break;
            case 'elder':
                spawnFloatingText(this.x, this.y - 30, 'Seek the temples...', '#aaaaff');
                break;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Body
        ctx.fillStyle = '#88aaff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Face indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Name tag
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY - 25);

        // Interaction prompt
        if (this.nearPlayer) {
            ctx.fillStyle = '#ffff44';
            ctx.fillText('Press E', screenX, screenY - 35);
        }
    }
}

// Shop system
let shopOpen = false;
const SHOP_ITEMS = [
    { name: 'Twin Shot', cost: 5, effect: 'bullets', desc: '+1 bullet per shot' },
    { name: 'Extended Barrel', cost: 8, effect: 'range', desc: '+50 range' },
    { name: 'Rapid Fire', cost: 10, effect: 'fireRate', desc: '+1 fire rate' },
    { name: 'Heart Shard', cost: 3, effect: 'heal', desc: 'Heal 1 heart' }
];

function openShop() {
    shopOpen = true;
}

function closeShop() {
    shopOpen = false;
}

function buyItem(index) {
    const item = SHOP_ITEMS[index];
    if (playerData.crystals >= item.cost) {
        playerData.crystals -= item.cost;
        switch (item.effect) {
            case 'bullets': playerData.bulletsPerShot = (playerData.bulletsPerShot || 1) + 1; break;
            case 'range': player.range += 50; break;
            case 'fireRate': player.fireRate += 1; break;
            case 'heal': playerData.health = Math.min(playerData.maxHealth, playerData.health + 1); break;
        }
        spawnFloatingText(player.x, player.y - 20, 'Purchased!', '#44ff44');
    }
}

// Level up system
function gainXP(amount) {
    playerData.xp += amount;
    while (playerData.xp >= playerData.xpToLevel) {
        playerData.xp -= playerData.xpToLevel;
        playerData.level++;
        playerData.skillPoints++;
        playerData.xpToLevel = 10 + (playerData.level - 1) * 2;

        // Level up effect
        for (let i = 0; i < 20; i++) {
            spawnParticle(player.x, player.y, '#ffaa44');
        }
        spawnFloatingText(player.x, player.y - 30, 'LEVEL UP!', '#ffaa44');
    }
}

// Game loop
function update(dt) {
    if (gameState !== 'playing') return;

    // Update player
    player.update(dt);

    // Camera follow
    camera.x = player.x - GAME_WIDTH / 2;
    camera.y = player.y - GAME_HEIGHT / 2;
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - GAME_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - GAME_HEIGHT, camera.y));

    // Screen shake update
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        const shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
        const shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
        camera.x += shakeX;
        camera.y += shakeY;
        if (screenShake.duration <= 0) {
            screenShake.intensity = 0;
        }
    }

    // Update float texts
    floatTexts = floatTexts.filter(ft => {
        ft.y += ft.vy * dt;
        ft.life -= dt;
        return ft.life > 0;
    });

    // Update race timer
    if (currentRace) {
        raceTimer -= dt;
        if (raceTimer <= 0) {
            spawnFloatText(player.x, player.y - 30, 'TIME UP!', '#ff4444', 20);
            currentRace = null;
        } else {
            // Check if reached goal
            const dist = Math.hypot(player.x - currentRace.endX, player.y - currentRace.endY);
            if (dist < 50) {
                completeRace(currentRace);
                currentRace = null;
            }
        }
    }

    // Update enemies
    enemies.forEach(e => e.update(dt));

    // Update bullets
    bullets.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += Math.hypot(b.vx * dt, b.vy * dt);

        // Check range
        if (b.traveled > b.range) {
            bullets.splice(i, 1);
            return;
        }

        // Check enemy collision
        enemies.forEach(e => {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < e.radius + 5) {
                e.takeDamage(b.damage);
                bullets.splice(i, 1);
                spawnParticle(b.x, b.y, '#ffff44');
            }
        });
    });

    // Update enemy bullets
    enemyBullets.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Check player collision
        const dist = Math.hypot(b.x - player.x, b.y - player.y);
        if (dist < player.radius + 4) {
            player.takeDamage(b.damage);
            enemyBullets.splice(i, 1);
            return;
        }

        // Remove if too far
        if (Math.hypot(b.x - player.x, b.y - player.y) > 800) {
            enemyBullets.splice(i, 1);
        }
    });

    // Update crystals - collect
    crystals.forEach((c, i) => {
        const dist = Math.hypot(c.x - player.x, c.y - player.y);
        if (dist < 50) {
            // Attract
            const angle = Math.atan2(player.y - c.y, player.x - c.x);
            c.x += Math.cos(angle) * 200 * dt;
            c.y += Math.sin(angle) * 200 * dt;
        }
        if (dist < player.radius + 5) {
            gainXP(c.value);
            playerData.crystals++;
            crystals.splice(i, 1);
        }
    });

    // Update particles
    particles.forEach((p, i) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    });

    // Update floating texts
    floatingTexts.forEach((t, i) => {
        t.y -= 30 * dt;
        t.life -= dt;
        if (t.life <= 0) floatingTexts.splice(i, 1);
    });

    // Update NPCs
    npcs.forEach(npc => npc.update(dt));

    // Check NPC interaction
    if (keys['e']) {
        npcs.forEach(npc => npc.interact());
        keys['e'] = false; // Prevent multiple triggers
    }

    // Collect heart pieces
    heartPieces.forEach(hp => {
        if (hp.collected) return;
        const dist = Math.hypot(player.x - hp.x, player.y - hp.y);
        if (dist < player.radius + 10) {
            hp.collected = true;
            playerData.heartPieces++;
            if (playerData.heartPieces % 4 === 0) {
                playerData.maxHealth++;
                spawnFloatingText(hp.x, hp.y - 20, '+1 MAX HEALTH!', '#ff4444');
            } else {
                spawnFloatingText(hp.x, hp.y - 20, `Heart Piece! (${playerData.heartPieces % 4}/4)`, '#ff8888');
            }
        }
    });

    // Collect energy batteries
    energyBatteries.forEach(eb => {
        if (eb.collected) return;
        const dist = Math.hypot(player.x - eb.x, player.y - eb.y);
        if (dist < player.radius + 10) {
            eb.collected = true;
            playerData.energyBatteries++;
            playerData.maxEnergy++;
            spawnFloatingText(eb.x, eb.y - 20, '+1 MAX ENERGY!', '#44aaff');
        }
    });

    // Time Stop effect
    if (timeStopActive) {
        timeStopDuration -= dt;
        if (timeStopDuration <= 0) {
            timeStopActive = false;
        }
    }

    // Skill allocation with number keys
    if (playerData.skillPoints > 0) {
        if (keys['1']) { playerData.skills.damage++; playerData.skillPoints--; keys['1'] = false; }
        if (keys['2']) { playerData.skills.fireRate++; playerData.skillPoints--; keys['2'] = false; }
        if (keys['3']) { playerData.skills.range++; playerData.skillPoints--; keys['3'] = false; }
        if (keys['4']) { playerData.skills.speed++; playerData.skillPoints--; keys['4'] = false; }
        if (keys['5'] && playerData.skillPoints >= 2) { playerData.skills.critical++; playerData.skillPoints -= 2; keys['5'] = false; }
    }

    // Update mini-bosses
    miniBosses.forEach(mb => {
        if (!mb.defeated) {
            mb.update(dt);

            // Check bullet collision
            bullets.forEach((b, bi) => {
                const dist = Math.hypot(b.x - mb.x, b.y - mb.y);
                if (dist < mb.radius + 5) {
                    mb.takeDamage(b.damage);
                    bullets.splice(bi, 1);
                }
            });
        }
    });

    // Collect golden scarabs
    goldenScarabs.forEach(gs => {
        if (gs.collected) return;
        const dist = Math.hypot(player.x - gs.x, player.y - gs.y);
        if (dist < player.radius + 10) {
            gs.collected = true;
            scarabCount++;
            spawnFloatingText(gs.x, gs.y - 20, `Golden Scarab! (${scarabCount}/24)`, '#ffcc00');
            // Drop red coins
            redCoins += 5;
        }
    });

    // Dungeon entrance interaction
    if (keys['e']) {
        dungeonEntrances.forEach(de => {
            const dist = Math.hypot(player.x - de.x, player.y - de.y);
            if (dist < de.radius + 30 && !playerData.bossesDefeated.includes(de.boss)) {
                startBossFight(de.boss);
            }
        });
    }

    // Time Stop ability (Q key)
    if (keys['q'] && playerData.abilities.timeStop && playerData.energy >= 4 && !timeStopActive) {
        timeStopActive = true;
        timeStopDuration = 3;
        playerData.energy -= 4;
        spawnFloatingText(player.x, player.y - 30, 'TIME STOP!', '#aa44ff');
        keys['q'] = false;
    }

    // Save (F5) / Load (F9)
    if (keys['f5']) {
        saveGame();
        keys['f5'] = false;
    }
    if (keys['f9']) {
        loadGame();
        keys['f9'] = false;
    }

    // Shop interaction
    if (shopOpen) {
        if (keys['escape']) {
            closeShop();
            keys['escape'] = false;
        }
        // Buy items with number keys
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            if (keys[(i + 1).toString()]) {
                buyItem(i);
                keys[(i + 1).toString()] = false;
            }
        }
    }
}

// Boss fight update
function updateBossFight(dt) {
    if (!currentBoss) return;

    // Player controls in boss fight
    player.update(dt);

    // Keep player in arena
    player.x = Math.max(50, Math.min(GAME_WIDTH - 50, player.x));
    player.y = Math.max(200, Math.min(GAME_HEIGHT - 50, player.y));

    // Boss update
    currentBoss.update(dt);

    // Bullets hit boss
    bullets.forEach((b, i) => {
        const dist = Math.hypot(b.x - currentBoss.x, b.y - currentBoss.y);
        if (dist < currentBoss.radius + 5) {
            currentBoss.takeDamage(b.damage);
            bullets.splice(i, 1);
            spawnParticle(b.x, b.y, '#ffff44');
        }
    });

    // Enemy bullets hit player
    enemyBullets.forEach((b, i) => {
        const dist = Math.hypot(b.x - player.x, b.y - player.y);
        if (dist < player.radius + 4) {
            player.takeDamage(b.damage);
            enemyBullets.splice(i, 1);
        }

        // Remove bullets that leave arena
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) {
            enemyBullets.splice(i, 1);
        }
    });

    // Update bullets
    bullets.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += Math.hypot(b.vx * dt, b.vy * dt);
        if (b.traveled > b.range) bullets.splice(i, 1);
    });

    enemyBullets.forEach((b, i) => {
        // Time stop slows enemy bullets
        const speedMult = timeStopActive ? 0.2 : 1;
        b.x += b.vx * dt * speedMult;
        b.y += b.vy * dt * speedMult;
    });

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    });

    // Time stop duration
    if (timeStopActive) {
        timeStopDuration -= dt;
        if (timeStopDuration <= 0) {
            timeStopActive = false;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState === 'title') {
        drawTitle();
        return;
    }

    if (gameState === 'gameover') {
        drawGameOver();
        return;
    }

    if (gameState === 'boss') {
        drawBossFight();
        return;
    }

    // Time stop visual effect
    if (timeStopActive) {
        ctx.fillStyle = 'rgba(100, 50, 150, 0.2)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw world
    drawWorld();

    // Draw dungeon entrances
    dungeonEntrances.forEach(de => de.draw());

    // Draw heart pieces
    heartPieces.forEach(hp => {
        if (hp.collected) return;
        const screenX = hp.x - camera.x;
        const screenY = hp.y - camera.y;
        const pulse = Math.sin(performance.now() / 300) * 2;
        ctx.fillStyle = '#ff4466';
        ctx.beginPath();
        // Heart shape
        ctx.arc(screenX - 4, screenY - 2 + pulse, 6, Math.PI, 0);
        ctx.arc(screenX + 4, screenY - 2 + pulse, 6, Math.PI, 0);
        ctx.lineTo(screenX, screenY + 10 + pulse);
        ctx.closePath();
        ctx.fill();
    });

    // Draw energy batteries
    energyBatteries.forEach(eb => {
        if (eb.collected) return;
        const screenX = eb.x - camera.x;
        const screenY = eb.y - camera.y;
        const pulse = Math.sin(performance.now() / 400) * 2;
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(screenX - 6, screenY - 10 + pulse, 12, 20);
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(screenX - 4, screenY - 6 + pulse, 8, 12);
    });

    // Draw golden scarabs
    goldenScarabs.forEach(gs => {
        if (gs.collected) return;
        const screenX = gs.x - camera.x;
        const screenY = gs.y - camera.y;
        const pulse = Math.sin(performance.now() / 250) * 3;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + pulse, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffee66';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY - 2 + pulse, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw NPCs
    npcs.forEach(npc => npc.draw());

    // Draw mini-bosses
    miniBosses.forEach(mb => mb.draw());

    // Draw crystals
    crystals.forEach(c => {
        const screenX = c.x - camera.x;
        const screenY = c.y - camera.y;
        ctx.fillStyle = COLORS.CRYSTAL;
        ctx.beginPath();
        // Diamond shape
        ctx.moveTo(screenX, screenY - 6);
        ctx.lineTo(screenX + 5, screenY);
        ctx.lineTo(screenX, screenY + 6);
        ctx.lineTo(screenX - 5, screenY);
        ctx.closePath();
        ctx.fill();
    });

    // Draw bullets
    bullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.fillStyle = b.isSuper ? COLORS.SUPER_BULLET : COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.isSuper ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemy bullets
    enemyBullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(e => e.draw());

    // Draw player
    if (player) player.draw();

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Draw floating texts
    floatingTexts.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x - camera.x, t.y - camera.y);
        ctx.globalAlpha = 1;
    });

    // Draw enhanced float texts (with custom sizes)
    floatTexts.forEach(ft => {
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x - camera.x, ft.y - camera.y);
        ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
        ctx.globalAlpha = 1;
    });

    // Draw race timer
    if (currentRace) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`Time: ${raceTimer.toFixed(1)}s`, GAME_WIDTH / 2, 100);
        ctx.fillText(`Time: ${raceTimer.toFixed(1)}s`, GAME_WIDTH / 2, 100);

        // Draw goal marker
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(currentRace.endX - camera.x, currentRace.endY - camera.y, 30 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('GOAL', currentRace.endX - camera.x, currentRace.endY - camera.y);
    }

    // Draw HUD
    drawHUD();
}

function drawWorld() {
    const startTileX = Math.floor(camera.x / TILE_SIZE);
    const startTileY = Math.floor(camera.y / TILE_SIZE);
    const endTileX = startTileX + Math.ceil(GAME_WIDTH / TILE_SIZE) + 1;
    const endTileY = startTileY + Math.ceil(GAME_HEIGHT / TILE_SIZE) + 1;

    for (let y = startTileY; y < endTileY; y++) {
        for (let x = startTileX; x < endTileX; x++) {
            if (y < 0 || y >= worldTiles.length || x < 0 || x >= worldTiles[0].length) continue;

            const tile = worldTiles[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            // Base color by biome
            let color;
            switch (tile.type) {
                case 'village': color = tile.variant > 0.5 ? '#6a9a6a' : '#5a8a5a'; break;
                case 'forest': color = tile.variant > 0.5 ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK; break;
                case 'desert': color = tile.variant > 0.5 ? '#d4b896' : '#c4a886'; break;
                case 'autumn': color = tile.variant > 0.5 ? '#aa6644' : '#996633'; break;
                case 'cave': color = tile.variant > 0.5 ? '#5a4a7a' : '#4a3a6a'; break;
                case 'water': color = tile.variant > 0.5 ? '#4a8aba' : '#3a7aaa'; break;
                case 'lava': color = tile.variant > 0.5 ? '#aa5a3a' : '#994a2a'; break;
                case 'corruption': color = tile.variant > 0.5 ? '#6a3a6a' : '#5a2a5a'; break;
                default: color = COLORS.GRASS_LIGHT;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE + 1, TILE_SIZE + 1);
        }
    }
}

function drawHUD() {
    // Health
    ctx.fillStyle = COLORS.UI_BG;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(10, 10, 200, 80);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Health', 20, 28);

    for (let i = 0; i < playerData.maxHealth; i++) {
        ctx.fillStyle = i < playerData.health ? COLORS.HEALTH : '#442222';
        ctx.beginPath();
        const hx = 80 + i * 22;
        // Heart shape
        ctx.arc(hx, 24, 8, Math.PI, 0);
        ctx.lineTo(hx + 8, 24);
        ctx.arc(hx + 8, 24, 8, Math.PI, 0);
        ctx.lineTo(hx + 8, 32);
        ctx.fill();
    }

    // Energy
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Energy', 20, 48);
    for (let i = 0; i < playerData.maxEnergy; i++) {
        ctx.fillStyle = i < playerData.energy ? COLORS.ENERGY : '#224444';
        ctx.fillRect(80 + i * 20, 40, 15, 12);
    }

    // XP
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Level ${playerData.level}`, 20, 68);
    ctx.fillStyle = '#332200';
    ctx.fillRect(80, 60, 100, 10);
    ctx.fillStyle = COLORS.XP;
    ctx.fillRect(80, 60, 100 * (playerData.xp / playerData.xpToLevel), 10);

    // Skill points
    if (playerData.skillPoints > 0) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`Skill Points: ${playerData.skillPoints}`, 20, 88);
    }

    // Crystals and abilities - top right
    ctx.fillStyle = COLORS.UI_BG;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(GAME_WIDTH - 160, 10, 150, 70);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.CRYSTAL;
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Crystals: ${playerData.crystals}`, GAME_WIDTH - 20, 28);
    ctx.fillText(`Enemies: ${enemies.length}`, GAME_WIDTH - 20, 48);

    // Abilities
    const abilities = [];
    if (playerData.abilities.dash) abilities.push('DASH');
    if (playerData.abilities.supershot) abilities.push('SUPER');
    if (abilities.length > 0) {
        ctx.fillStyle = '#44ff44';
        ctx.fillText(abilities.join(' | '), GAME_WIDTH - 20, 68);
    }

    // Scarabs and Coins - left side
    ctx.fillStyle = COLORS.UI_BG;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(10, 100, 100, 50);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffcc00';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Scarabs: ${scarabCount}/24`, 20, 118);
    ctx.fillStyle = '#ff6644';
    ctx.fillText(`Red Coins: ${redCoins}`, 20, 138);

    // Controls hint
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | Click: Fire | Shift: Dash | Q: Time Stop | F5: Save | F9: Load', GAME_WIDTH / 2, GAME_HEIGHT - 10);

    // Shop UI
    if (shopOpen) {
        drawShop();
    }

    // Minimap
    drawMinimap();
}

function drawShop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(200, 100, 400, 400);

    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 100, 400, 400);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SHOP', 400, 140);

    ctx.fillStyle = '#ffcc00';
    ctx.font = '16px Arial';
    ctx.fillText(`Your Crystals: ${playerData.crystals}`, 400, 170);

    SHOP_ITEMS.forEach((item, i) => {
        const y = 210 + i * 70;
        const canAfford = playerData.crystals >= item.cost;

        ctx.fillStyle = canAfford ? '#226622' : '#442222';
        ctx.fillRect(220, y - 25, 360, 60);

        ctx.fillStyle = canAfford ? '#44ff44' : '#884444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, 240, y);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '12px Arial';
        ctx.fillText(item.desc, 240, y + 20);

        ctx.fillStyle = '#ffcc00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${item.cost} crystals`, 560, y);

        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText(`Press ${i + 1} to buy`, 560, y + 20);
    });

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', 400, 480);
}

function drawMinimap() {
    const mapSize = 100;
    const mapX = GAME_WIDTH - mapSize - 10;
    const mapY = GAME_HEIGHT - mapSize - 30;
    const scale = mapSize / WORLD_WIDTH;

    ctx.fillStyle = '#1a2a1a';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#4a6a4a';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Draw biomes
    for (const bio of Object.values(BIOMES)) {
        const bx = mapX + bio.x * scale;
        const by = mapY + bio.y * scale;
        const br = bio.radius * scale;
        ctx.fillStyle = bio.type === 'village' ? '#6a8a6a' : '#3a5a3a';
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player dot
    const px = mapX + player.x * scale;
    const py = mapY + player.y * scale;
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    ctx.fillStyle = '#ff4444';
    enemies.forEach(e => {
        const ex = mapX + e.x * scale;
        const ey = mapY + e.y * scale;
        ctx.fillRect(ex - 1, ey - 1, 2, 2);
    });

    // Dungeon entrance markers
    ctx.fillStyle = '#aa44ff';
    dungeonEntrances.forEach(de => {
        if (!playerData.bossesDefeated.includes(de.boss)) {
            const dx = mapX + de.x * scale;
            const dy = mapY + de.y * scale;
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Mini-boss markers
    ctx.fillStyle = '#ffaa44';
    miniBosses.forEach(mb => {
        if (!mb.defeated) {
            const mx = mapX + mb.x * scale;
            const my = mapY + mb.y * scale;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // NPC markers
    ctx.fillStyle = '#44aaff';
    npcs.forEach(npc => {
        const nx = mapX + npc.x * scale;
        const ny = mapY + npc.y * scale;
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTitle() {
    // Background
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(
            Math.sin(i * 123 + performance.now() / 5000) * 300 + 400,
            Math.cos(i * 456) * 200 + 300,
            1 + Math.random(),
            0, Math.PI * 2
        );
        ctx.fill();
    }

    // Title
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MINISHOOT', GAME_WIDTH / 2, 180);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#88ff88';
    ctx.fillText('ADVENTURES', GAME_WIDTH / 2, 220);

    // Subtitle
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.fillText('A Twin-Stick Shooter Adventure', GAME_WIDTH / 2, 260);

    // Start prompt
    ctx.fillStyle = Math.sin(performance.now() / 300) > 0 ? '#ffffff' : '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('Click to Start', GAME_WIDTH / 2, 400);

    // Controls
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText('WASD: Move | Mouse: Aim | Left Click: Fire', GAME_WIDTH / 2, 480);
    ctx.fillText('Right Click: Supershot | Space: Boost | Shift: Dash', GAME_WIDTH / 2, 500);

    // Preview ship
    const shipY = 320 + Math.sin(performance.now() / 500) * 10;
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.ellipse(GAME_WIDTH / 2, shipY, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#88ff88';
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2 + 20, shipY);
    ctx.lineTo(GAME_WIDTH / 2 + 10, shipY - 8);
    ctx.lineTo(GAME_WIDTH / 2 + 10, shipY + 8);
    ctx.closePath();
    ctx.fill();
}

function drawGameOver() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Level Reached: ${playerData.level}`, GAME_WIDTH / 2, 280);
    ctx.fillText(`Crystals Collected: ${playerData.crystals}`, GAME_WIDTH / 2, 320);
    ctx.fillText(`Enemies Defeated: ${50 - enemies.length}`, GAME_WIDTH / 2, 360);
    ctx.fillText(`Bosses Defeated: ${playerData.bossesDefeated.length}`, GAME_WIDTH / 2, 400);

    ctx.fillStyle = Math.sin(performance.now() / 300) > 0 ? '#ffffff' : '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('Click to Restart', GAME_WIDTH / 2, 480);
}

function drawBossFight() {
    // Arena background
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid floor
    ctx.strokeStyle = '#2a2a4a';
    for (let x = 0; x < GAME_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }

    // Time stop overlay
    if (timeStopActive) {
        ctx.fillStyle = 'rgba(100, 50, 150, 0.3)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw bullets
    bullets.forEach(b => {
        ctx.fillStyle = b.isSuper ? COLORS.SUPER_BULLET : COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isSuper ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemy bullets (slow during time stop)
    enemyBullets.forEach(b => {
        ctx.fillStyle = timeStopActive ? '#aa66aa' : '#ff8844';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw boss
    if (currentBoss) currentBoss.draw();

    // Draw player (fixed screen position for boss fight)
    if (player) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);

        if (player.invincibleTime > 0 && Math.floor(player.invincibleTime * 10) % 2) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.ellipse(0, 0, player.radius, player.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.moveTo(player.radius, 0);
        ctx.lineTo(player.radius * 0.5, -player.radius * 0.4);
        ctx.lineTo(player.radius * 0.5, player.radius * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(4, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Boss fight HUD
    ctx.fillStyle = COLORS.UI_BG;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(10, GAME_HEIGHT - 50, 200, 40);
    ctx.globalAlpha = 1;

    // Health hearts
    for (let i = 0; i < playerData.maxHealth; i++) {
        ctx.fillStyle = i < playerData.health ? COLORS.HEALTH : '#442222';
        ctx.beginPath();
        ctx.arc(25 + i * 20, GAME_HEIGHT - 30, 7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Energy bars
    for (let i = 0; i < playerData.maxEnergy; i++) {
        ctx.fillStyle = i < playerData.energy ? COLORS.ENERGY : '#224444';
        ctx.fillRect(25 + i * 18, GAME_HEIGHT - 20, 14, 8);
    }

    // Time stop indicator
    if (timeStopActive) {
        ctx.fillStyle = '#aa44ff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TIME STOP: ${timeStopDuration.toFixed(1)}s`, GAME_WIDTH / 2, GAME_HEIGHT - 25);
    }
}

function startGame() {
    // Reset player data
    Object.assign(playerData, {
        maxHealth: 3,
        health: 3,
        maxEnergy: 4,
        energy: 4,
        crystals: 0,
        level: 1,
        xp: 0,
        xpToLevel: 10,
        skillPoints: 0,
        skills: { damage: 0, fireRate: 0, range: 0, speed: 0, critical: 0 },
        abilities: { dash: true, supershot: true, surf: false, timeStop: false }, // Start with dash/supershot for testing
        modules: [],
        heartPieces: 0,
        energyBatteries: 0,
        bossesDefeated: []
    });

    // Create player in village
    player = new Player(BIOMES.village.x, BIOMES.village.y);

    // Generate world
    generateWorld();
    spawnEnemies();

    // Reset collections
    bullets = [];
    enemyBullets = [];
    crystals = [];
    particles = [];
    floatingTexts = [];

    // Spawn NPCs
    npcs = [];
    Object.keys(NPC_TYPES).forEach(type => {
        npcs.push(new NPC(type));
    });

    // Spawn heart pieces and energy batteries throughout world
    spawnCollectibles();

    gameState = 'playing';
}

// DungeonEntrance class
class DungeonEntrance {
    constructor(dungeonKey) {
        const dungeon = DUNGEONS[dungeonKey];
        this.key = dungeonKey;
        this.name = dungeon.name;
        this.x = dungeon.x;
        this.y = dungeon.y;
        this.radius = 30;
        this.boss = dungeon.boss;
        this.biome = dungeon.biome;
        this.entered = false;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Portal effect
        const pulse = Math.sin(performance.now() / 400) * 5;
        ctx.fillStyle = '#442266';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#6644aa';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Name
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 100) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, screenX, screenY - 45);
            ctx.fillText('Press E to Enter', screenX, screenY - 32);
        }
    }
}

// Save/Load system
function saveGame() {
    const saveData = {
        player: {
            x: player.x,
            y: player.y,
            health: playerData.health,
            maxHealth: playerData.maxHealth,
            energy: playerData.energy,
            maxEnergy: playerData.maxEnergy
        },
        playerData: {
            crystals: playerData.crystals,
            level: playerData.level,
            xp: playerData.xp,
            skillPoints: playerData.skillPoints,
            skills: { ...playerData.skills },
            abilities: { ...playerData.abilities },
            heartPieces: playerData.heartPieces,
            energyBatteries: playerData.energyBatteries,
            bossesDefeated: [...playerData.bossesDefeated]
        },
        collectibles: {
            redCoins: redCoins,
            scarabCount: scarabCount,
            collectedHearts: heartPieces.filter(h => h.collected).map(h => h.id),
            collectedBatteries: energyBatteries.filter(e => e.collected).map(e => e.id),
            collectedScarabs: goldenScarabs.filter(s => s.collected).map(s => s.id)
        }
    };

    try {
        localStorage.setItem('minishoot_save', JSON.stringify(saveData));
        spawnFloatingText(player.x, player.y - 30, 'Game Saved!', '#44ff44');
    } catch (e) {
        spawnFloatingText(player.x, player.y - 30, 'Save Failed!', '#ff4444');
    }
}

function loadGame() {
    try {
        const saveData = JSON.parse(localStorage.getItem('minishoot_save'));
        if (!saveData) return false;

        player.x = saveData.player.x;
        player.y = saveData.player.y;
        playerData.health = saveData.player.health;
        playerData.maxHealth = saveData.player.maxHealth;
        playerData.energy = saveData.player.energy;
        playerData.maxEnergy = saveData.player.maxEnergy;

        Object.assign(playerData, saveData.playerData);
        redCoins = saveData.collectibles.redCoins;
        scarabCount = saveData.collectibles.scarabCount;

        // Mark collected items
        saveData.collectibles.collectedHearts.forEach(id => {
            const hp = heartPieces.find(h => h.id === id);
            if (hp) hp.collected = true;
        });
        saveData.collectibles.collectedBatteries.forEach(id => {
            const eb = energyBatteries.find(e => e.id === id);
            if (eb) eb.collected = true;
        });
        saveData.collectibles.collectedScarabs.forEach(id => {
            const gs = goldenScarabs.find(s => s.id === id);
            if (gs) gs.collected = true;
        });

        spawnFloatingText(player.x, player.y - 30, 'Game Loaded!', '#44ff44');
        return true;
    } catch (e) {
        return false;
    }
}

// Start boss fight
function startBossFight(bossType) {
    inBossFight = true;
    gameState = 'boss';
    currentBoss = new Boss(bossType);
    bullets = [];
    enemyBullets = [];
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 100;
    player.invincibleTime = 2;
}

function spawnCollectibles() {
    heartPieces = [];
    energyBatteries = [];
    goldenScarabs = [];
    dungeonEntrances = [];
    miniBosses = [];

    // Heart pieces - 28 total (7 extra hearts)
    const heartLocations = [
        { x: 1800, y: 2200 }, { x: 2000, y: 2600 }, { x: 1200, y: 2400 },
        { x: 800, y: 1800 }, { x: 500, y: 1400 }, { x: 700, y: 1200 },
        { x: 2200, y: 700 }, { x: 2500, y: 900 }, { x: 1800, y: 600 },
        { x: 1400, y: 500 }, { x: 2700, y: 2400 }, { x: 2800, y: 2800 }
    ];

    heartLocations.forEach((loc, i) => {
        heartPieces.push({ x: loc.x, y: loc.y, collected: false, id: i });
    });

    // Energy batteries - 8 total
    const batteryLocations = [
        { x: 1600, y: 2800 }, { x: 400, y: 1600 }, { x: 2400, y: 600 },
        { x: 600, y: 600 }, { x: 2600, y: 2400 }, { x: 1000, y: 2200 }
    ];

    batteryLocations.forEach((loc, i) => {
        energyBatteries.push({ x: loc.x, y: loc.y, collected: false, id: i });
    });

    // Golden scarabs - 24 total
    const scarabLocations = [
        { x: 1900, y: 2300 }, { x: 2100, y: 2700 }, { x: 1100, y: 2500 },
        { x: 700, y: 1900 }, { x: 400, y: 1500 }, { x: 600, y: 1100 },
        { x: 2300, y: 800 }, { x: 2600, y: 1000 }, { x: 1900, y: 500 },
        { x: 1500, y: 400 }, { x: 2800, y: 2500 }, { x: 2900, y: 2900 },
        { x: 500, y: 500 }, { x: 300, y: 700 }, { x: 800, y: 400 },
        { x: 2200, y: 2200 }, { x: 2400, y: 2400 }, { x: 1800, y: 3000 },
        { x: 1000, y: 2800 }, { x: 600, y: 2400 }, { x: 2800, y: 600 },
        { x: 3000, y: 800 }, { x: 2500, y: 500 }, { x: 1200, y: 600 }
    ];

    scarabLocations.forEach((loc, i) => {
        goldenScarabs.push({ x: loc.x, y: loc.y, collected: false, id: i });
    });

    // Dungeon entrances
    Object.keys(DUNGEONS).forEach(key => {
        dungeonEntrances.push(new DungeonEntrance(key));
    });

    // Mini-bosses - 3 total
    miniBosses.push(new MiniBoss('stoneSnake', 500, 1800));
    miniBosses.push(new MiniBoss('forestSpirit', 1800, 2500));
    miniBosses.push(new MiniBoss('coralBeast', 2700, 2600));
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;

    if (gameState === 'title' || gameState === 'gameover') {
        startGame();
    }
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Game loop
let lastTime = performance.now();

function gameLoop() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (gameState === 'boss') {
        updateBossFight(dt);
    } else {
        update(dt);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

// Start
gameLoop();
