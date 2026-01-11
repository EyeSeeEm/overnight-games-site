// Starscape Clone - Canvas Implementation
// Space combat mining game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const WIDTH = 800;
const HEIGHT = 600;
const WORLD_SIZE = 2000;

// Zone system
const ZONES = {
    outerGrid: {
        name: 'Outer Grid',
        background: '#0A0A1A',
        difficulty: 1,
        description: 'Starting zone - light enemy presence',
        bossType: 'archnidQueen',
        wavesToBoss: 8
    },
    miningSector: {
        name: 'Mining Sector',
        background: '#0A1A0A',
        difficulty: 1.5,
        description: 'Rich in resources - moderate enemies',
        bossType: 'hiveMind',
        wavesToBoss: 10
    },
    archnidTerritory: {
        name: 'Archnid Territory',
        background: '#1A0A0A',
        difficulty: 2,
        description: 'Enemy stronghold - heavy resistance',
        bossType: 'destroyerPrime',
        wavesToBoss: 12
    },
    hiveCore: {
        name: 'Hive Core',
        background: '#1A0A1A',
        difficulty: 2.5,
        description: 'Heart of the swarm',
        bossType: 'carrierMatriarch',
        wavesToBoss: 14
    },
    nexus: {
        name: 'The Nexus',
        background: '#0A0A0A',
        difficulty: 3,
        description: 'Final confrontation',
        bossType: 'archnidOvermind',
        wavesToBoss: 16
    }
};

// Ship hulls
const SHIP_HULLS = {
    runabout: {
        name: 'Runabout',
        hp: 50,
        shield: 30,
        energy: 20,
        cargo: 100,
        speed: 1.0,
        cost: 0,
        description: 'Starter ship - balanced stats'
    },
    prowler: {
        name: 'Prowler',
        hp: 40,
        shield: 25,
        energy: 30,
        cargo: 80,
        speed: 1.3,
        cost: { green: 200, yellow: 100, purple: 50 },
        description: 'Fast and agile - low armor'
    },
    avenger: {
        name: 'Avenger',
        hp: 70,
        shield: 50,
        energy: 25,
        cargo: 120,
        speed: 0.9,
        cost: { green: 300, yellow: 200, purple: 100 },
        description: 'Heavy fighter - strong shields'
    },
    devastator: {
        name: 'Devastator',
        hp: 100,
        shield: 80,
        energy: 40,
        cargo: 150,
        speed: 0.7,
        cost: { green: 500, yellow: 300, purple: 200 },
        description: 'Capital class - maximum firepower'
    }
};

// Engine upgrades
const ENGINES = {
    basicThruster: {
        name: 'Basic Thruster',
        thrustMult: 1.0,
        speedMult: 1.0,
        cost: 0
    },
    ionDrive: {
        name: 'Ion Drive',
        thrustMult: 1.2,
        speedMult: 1.15,
        cost: { green: 100, yellow: 50, purple: 0 }
    },
    plasmaPropulsion: {
        name: 'Plasma Propulsion',
        thrustMult: 1.4,
        speedMult: 1.3,
        cost: { green: 200, yellow: 150, purple: 50 }
    },
    fusionEngine: {
        name: 'Fusion Engine',
        thrustMult: 1.6,
        speedMult: 1.5,
        cost: { green: 400, yellow: 250, purple: 150 }
    }
};

// Generator upgrades
const GENERATORS = {
    basicReactor: {
        name: 'Basic Reactor',
        energyMult: 1.0,
        rechargeMult: 1.0,
        cost: 0
    },
    fusionCore: {
        name: 'Fusion Core',
        energyMult: 1.3,
        rechargeMult: 1.2,
        cost: { green: 100, yellow: 100, purple: 25 }
    },
    quantumGenerator: {
        name: 'Quantum Generator',
        energyMult: 1.6,
        rechargeMult: 1.4,
        cost: { green: 250, yellow: 200, purple: 100 }
    },
    zeroPoint: {
        name: 'Zero-Point Module',
        energyMult: 2.0,
        rechargeMult: 1.8,
        cost: { green: 500, yellow: 400, purple: 250 }
    }
};

// Shield generators
const SHIELDS = {
    basicShield: {
        name: 'Basic Shield',
        shieldMult: 1.0,
        rechargeMult: 1.0,
        cost: 0
    },
    reinforcedShield: {
        name: 'Reinforced Shield',
        shieldMult: 1.3,
        rechargeMult: 1.1,
        cost: { green: 150, yellow: 75, purple: 25 }
    },
    militaryShield: {
        name: 'Military Shield',
        shieldMult: 1.6,
        rechargeMult: 1.3,
        cost: { green: 300, yellow: 200, purple: 100 }
    },
    quantumBarrier: {
        name: 'Quantum Barrier',
        shieldMult: 2.0,
        rechargeMult: 1.6,
        cost: { green: 600, yellow: 400, purple: 250 }
    }
};

// Research tree
const RESEARCH = {
    weaponDamage1: { name: 'Weapon Damage I', effect: 'damage', value: 1.1, cost: { green: 50, yellow: 25, purple: 0 }, requires: [] },
    weaponDamage2: { name: 'Weapon Damage II', effect: 'damage', value: 1.2, cost: { green: 100, yellow: 75, purple: 25 }, requires: ['weaponDamage1'] },
    weaponDamage3: { name: 'Weapon Damage III', effect: 'damage', value: 1.35, cost: { green: 200, yellow: 150, purple: 75 }, requires: ['weaponDamage2'] },
    fireRate1: { name: 'Fire Rate I', effect: 'fireRate', value: 1.1, cost: { green: 50, yellow: 25, purple: 0 }, requires: [] },
    fireRate2: { name: 'Fire Rate II', effect: 'fireRate', value: 1.2, cost: { green: 100, yellow: 75, purple: 25 }, requires: ['fireRate1'] },
    shieldCapacity1: { name: 'Shield Capacity I', effect: 'shield', value: 1.2, cost: { green: 75, yellow: 50, purple: 0 }, requires: [] },
    shieldCapacity2: { name: 'Shield Capacity II', effect: 'shield', value: 1.4, cost: { green: 150, yellow: 100, purple: 50 }, requires: ['shieldCapacity1'] },
    shieldRegen1: { name: 'Shield Regen I', effect: 'shieldRegen', value: 1.25, cost: { green: 50, yellow: 50, purple: 25 }, requires: [] },
    cargoCapacity1: { name: 'Cargo Capacity I', effect: 'cargo', value: 1.25, cost: { green: 100, yellow: 50, purple: 0 }, requires: [] },
    cargoCapacity2: { name: 'Cargo Capacity II', effect: 'cargo', value: 1.5, cost: { green: 200, yellow: 150, purple: 50 }, requires: ['cargoCapacity1'] },
    gravityRange1: { name: 'Gravity Range I', effect: 'gravityRange', value: 1.3, cost: { green: 75, yellow: 50, purple: 25 }, requires: [] },
    turretDamage1: { name: 'Turret Damage I', effect: 'turretDamage', value: 1.2, cost: { green: 100, yellow: 75, purple: 25 }, requires: [] },
    turretRange1: { name: 'Turret Range I', effect: 'turretRange', value: 1.2, cost: { green: 100, yellow: 50, purple: 25 }, requires: [] },
    missileCapacity1: { name: 'Missile Capacity I', effect: 'missiles', value: 10, cost: { green: 75, yellow: 50, purple: 0 }, requires: [] },
    boostAbility: { name: 'Boost System', effect: 'ability', value: 'boost', cost: { green: 150, yellow: 100, purple: 50 }, requires: [] },
    empAbility: { name: 'EMP Burst', effect: 'ability', value: 'emp', cost: { green: 200, yellow: 150, purple: 100 }, requires: [] }
};

// Boss types
const BOSS_TYPES = {
    archnidQueen: {
        name: 'Archnid Queen',
        hp: 800,
        shield: 200,
        damage: 25,
        speed: 60,
        size: 50,
        behavior: 'queen',
        color: '#FF00FF',
        score: 2000,
        abilities: ['spawnSwarm', 'acidSpit'],
        spawnRate: 8
    },
    hiveMind: {
        name: 'Hive Mind',
        hp: 1200,
        shield: 400,
        damage: 30,
        speed: 40,
        size: 60,
        behavior: 'hiveMind',
        color: '#00FF00',
        score: 3500,
        abilities: ['psychicWave', 'mindControl'],
        pulseRate: 5
    },
    destroyerPrime: {
        name: 'Destroyer Prime',
        hp: 2000,
        shield: 800,
        damage: 50,
        speed: 50,
        size: 55,
        behavior: 'destroyerPrime',
        color: '#FF4400',
        score: 5000,
        abilities: ['devastatorBeam', 'missileBarrage'],
        beamCooldown: 8
    },
    carrierMatriarch: {
        name: 'Carrier Matriarch',
        hp: 1500,
        shield: 600,
        damage: 20,
        speed: 30,
        size: 70,
        behavior: 'matriarch',
        color: '#4444FF',
        score: 6000,
        abilities: ['massSpawn', 'healingField'],
        maxDrones: 12
    },
    archnidOvermind: {
        name: 'Archnid Overmind',
        hp: 3000,
        shield: 1000,
        damage: 60,
        speed: 35,
        size: 80,
        behavior: 'overmind',
        color: '#FF0088',
        score: 10000,
        abilities: ['allAbilities', 'phaseShift', 'deathRay'],
        phaseInterval: 10
    }
};

// Physics
const PHYSICS = {
    thrustForce: 300,
    maxSpeed: 350,
    drag: 0.985,
    rotationSpeed: 180,
    gravityBeamRange: 150,
    gravityBeamPullSpeed: 200,
    collectionRadius: 30
};

// Colors
const COLORS = {
    playerShip: '#4A90D9',
    playerShield: '#00BFFF',
    aegisHull: '#C0C0C0',
    blasterCyan: '#00FFFF',
    missileRed: '#FF6347',
    greenMineral: '#32CD32',
    yellowMineral: '#FFD700',
    purpleMineral: '#9400D3',
    enemyRed: '#FF4444',
    asteroidBrown: '#8B4513'
};

// Weapons
const WEAPONS = {
    blaster: {
        name: 'Basic Blaster',
        damage: 8,
        fireRate: 5,
        projectileSpeed: 600,
        energyCost: 2,
        color: COLORS.blasterCyan
    },
    twinBlaster: {
        name: 'Twin Blaster',
        damage: 12,
        fireRate: 6,
        projectileSpeed: 650,
        energyCost: 3,
        color: '#00FFFF',
        twin: true
    },
    missile: {
        name: 'Rocket Pod',
        damage: 30,
        fireRate: 1,
        projectileSpeed: 300,
        maxAmmo: 20,
        tracking: 0,
        color: COLORS.missileRed
    },
    homingMissile: {
        name: 'Homing Missile',
        damage: 40,
        fireRate: 0.8,
        projectileSpeed: 350,
        maxAmmo: 15,
        tracking: 0.5,
        turnRate: 90,
        color: '#FF6347'
    },
    ionCannon: {
        name: 'Ion Cannon',
        damage: 12,
        shieldDamage: 25,
        fireRate: 3,
        projectileSpeed: 500,
        energyCost: 5,
        color: '#9932CC'
    },
    beamLaser: {
        name: 'Mining Laser',
        dps: 15,
        range: 200,
        energyCost: 4,
        color: '#FFD700',
        isBeam: true
    },
    pulseBlaster: {
        name: 'Pulse Cannon',
        damage: 20,
        fireRate: 4,
        projectileSpeed: 700,
        energyCost: 5,
        color: '#FF00FF'
    }
};

// Enemy types
const ENEMY_TYPES = {
    drone: {
        name: 'Drone',
        hp: 15,
        damage: 5,
        speed: 250,
        fireRate: 2,
        size: 12,
        behavior: 'swarm',
        color: '#8B0000',
        score: 10
    },
    fighter: {
        name: 'Fighter',
        hp: 40,
        damage: 10,
        speed: 200,
        fireRate: 3,
        size: 16,
        behavior: 'pursue',
        color: '#FF4500',
        score: 50
    },
    heavyFighter: {
        name: 'Heavy Fighter',
        hp: 80,
        shield: 30,
        damage: 15,
        speed: 150,
        fireRate: 2,
        size: 20,
        behavior: 'strafe',
        color: '#CC0000',
        score: 100
    },
    bomber: {
        name: 'Bomber',
        hp: 60,
        damage: 50,
        speed: 100,
        fireRate: 0.5,
        size: 24,
        behavior: 'attackStation',
        color: '#880000',
        score: 150
    },
    destroyer: {
        name: 'Destroyer',
        hp: 200,
        shield: 100,
        damage: 25,
        speed: 80,
        fireRate: 2,
        size: 32,
        behavior: 'capital',
        color: '#660066',
        score: 500
    },
    carrier: {
        name: 'Carrier',
        hp: 300,
        shield: 150,
        damage: 10,
        speed: 50,
        fireRate: 1,
        size: 40,
        behavior: 'spawnDrones',
        color: '#444466',
        score: 750,
        spawnRate: 5,
        maxDrones: 6
    }
};

// Game state
let gameState = 'menu';
let player = null;
let aegis = null;
let enemies = [];
let projectiles = [];
let asteroids = [];
let minerals = [];
let explosions = [];
let stars = [];
let particles = [];
let floatingTexts = [];
let camera = { x: 0, y: 0 };
let screenShake = 0;
let beams = [];  // For beam weapons and boss abilities

// Resources
let resources = { green: 50, yellow: 30, purple: 10 };

// Wave system
let currentWave = 0;
let maxWaves = 8;
let waveTimer = 0;
let waveDelay = 5;
let enemiesKilled = 0;
let score = 0;

// Zone system
let currentZone = 'outerGrid';
let zoneCleared = { outerGrid: false, miningSector: false, archnidTerritory: false, hiveCore: false, nexus: false };
let bossActive = false;
let boss = null;
let bossDefeated = false;

// Player upgrades
let playerHull = 'runabout';
let playerEngine = 'basicThruster';
let playerGenerator = 'basicReactor';
let playerShieldGen = 'basicShield';
let unlockedResearch = [];
let unlockedAbilities = [];

// Research bonuses (computed from unlocked research)
let researchBonuses = {
    damage: 1,
    fireRate: 1,
    shield: 1,
    shieldRegen: 1,
    cargo: 1,
    gravityRange: 1,
    turretDamage: 1,
    turretRange: 1,
    missiles: 0
};

// Abilities
let boostCooldown = 0;
let boostDuration = 0;
let empCooldown = 0;

// Gravity beam
let gravityBeamActive = false;

// Weapon upgrade level
let weaponLevel = 1;

// Hazards
let hazards = [];  // Environmental hazards (mines, gas clouds, etc.)
let spaceDebris = [];

// Achievements
let achievements = {
    firstKill: false,
    waveClearer: false,
    miningMaster: false,
    bossSlayer: false,
    zoneConqueror: false,
    perfectDefense: false
};
let achievementPopup = null;

// Input
let keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize player ship
function createPlayer() {
    return {
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        vx: 0,
        vy: 0,
        rotation: -Math.PI / 2,
        hp: 50,
        maxHp: 50,
        shield: 30,
        maxShield: 30,
        shieldRecharge: 5,
        energy: 20,
        maxEnergy: 20,
        energyRecharge: 10,
        primaryWeapon: { ...WEAPONS.blaster },
        secondaryWeapon: { ...WEAPONS.missile, ammo: 20 },
        fireCooldown: 0,
        missileCooldown: 0,
        width: 24,
        height: 32,
        docked: false,
        cargo: { green: 0, yellow: 0, purple: 0 },
        cargoCapacity: 100
    };
}

// Initialize Aegis station
function createAegis() {
    return {
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2 + 100,
        hp: 500,
        maxHp: 500,
        shield: 200,
        maxShield: 200,
        shieldRecharge: 10,
        radius: 48,
        turrets: [
            { angle: 0, fireCooldown: 0, fireRate: 3, damage: 10, range: 300 },
            { angle: Math.PI / 2, fireCooldown: 0, fireRate: 3, damage: 10, range: 300 },
            { angle: Math.PI, fireCooldown: 0, fireRate: 3, damage: 10, range: 300 },
            { angle: Math.PI * 1.5, fireCooldown: 0, fireRate: 3, damage: 10, range: 300 }
        ]
    };
}

// Create asteroids
function createAsteroids() {
    asteroids = [];
    const count = 30 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
        const size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
        const sizeConfig = {
            small: { radius: 15, hp: 20, minerals: { min: 3, max: 6 } },
            medium: { radius: 25, hp: 50, minerals: { min: 8, max: 15 } },
            large: { radius: 40, hp: 100, minerals: { min: 20, max: 30 } }
        }[size];

        let x, y;
        do {
            x = Math.random() * WORLD_SIZE;
            y = Math.random() * WORLD_SIZE;
        } while (distance(x, y, WORLD_SIZE / 2, WORLD_SIZE / 2) < 200);

        asteroids.push({
            x,
            y,
            radius: sizeConfig.radius,
            hp: sizeConfig.hp,
            maxHp: sizeConfig.hp,
            minerals: sizeConfig.minerals,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.5
        });
    }
}

// Create stars for background
function createStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.5 + 0.5
        });
    }
}

// Spawn enemy wave
function spawnWave() {
    currentWave++;
    const budget = Math.floor(100 * (1 + currentWave * 0.5));
    let remaining = budget;

    const costs = {
        drone: 10,
        fighter: 25,
        heavyFighter: 50,
        bomber: 40,
        destroyer: 150,
        carrier: 200
    };

    const available = ['drone', 'fighter'];
    if (currentWave >= 2) available.push('heavyFighter');
    if (currentWave >= 3) available.push('bomber');
    if (currentWave >= 5) available.push('destroyer');
    if (currentWave >= 6) available.push('carrier');

    while (remaining > 0) {
        const affordable = available.filter(e => costs[e] <= remaining);
        if (affordable.length === 0) break;

        const type = affordable[Math.floor(Math.random() * affordable.length)];
        remaining -= costs[type];

        // Spawn from edge of screen
        const angle = Math.random() * Math.PI * 2;
        const dist = 600 + Math.random() * 200;
        const spawnX = aegis.x + Math.cos(angle) * dist;
        const spawnY = aegis.y + Math.sin(angle) * dist;

        const config = ENEMY_TYPES[type];
        enemies.push({
            type,
            x: spawnX,
            y: spawnY,
            vx: 0,
            vy: 0,
            rotation: angle + Math.PI,
            hp: config.hp,
            maxHp: config.hp,
            shield: config.shield || 0,
            maxShield: config.shield || 0,
            damage: config.damage,
            speed: config.speed,
            fireRate: config.fireRate,
            fireCooldown: 0,
            size: config.size,
            behavior: config.behavior,
            color: config.color,
            score: config.score,
            swarmPhase: Math.random() * Math.PI * 2
        });
    }
}

// Helper functions
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function angleToTarget(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// Calculate research bonuses
function calculateResearchBonuses() {
    researchBonuses = {
        damage: 1,
        fireRate: 1,
        shield: 1,
        shieldRegen: 1,
        cargo: 1,
        gravityRange: 1,
        turretDamage: 1,
        turretRange: 1,
        missiles: 0
    };

    for (const researchId of unlockedResearch) {
        const research = RESEARCH[researchId];
        if (research) {
            switch (research.effect) {
                case 'damage':
                    researchBonuses.damage = Math.max(researchBonuses.damage, research.value);
                    break;
                case 'fireRate':
                    researchBonuses.fireRate = Math.max(researchBonuses.fireRate, research.value);
                    break;
                case 'shield':
                    researchBonuses.shield = Math.max(researchBonuses.shield, research.value);
                    break;
                case 'shieldRegen':
                    researchBonuses.shieldRegen = Math.max(researchBonuses.shieldRegen, research.value);
                    break;
                case 'cargo':
                    researchBonuses.cargo = Math.max(researchBonuses.cargo, research.value);
                    break;
                case 'gravityRange':
                    researchBonuses.gravityRange = Math.max(researchBonuses.gravityRange, research.value);
                    break;
                case 'turretDamage':
                    researchBonuses.turretDamage = Math.max(researchBonuses.turretDamage, research.value);
                    break;
                case 'turretRange':
                    researchBonuses.turretRange = Math.max(researchBonuses.turretRange, research.value);
                    break;
                case 'missiles':
                    researchBonuses.missiles += research.value;
                    break;
                case 'ability':
                    if (!unlockedAbilities.includes(research.value)) {
                        unlockedAbilities.push(research.value);
                    }
                    break;
            }
        }
    }
}

// Can afford cost
function canAfford(cost) {
    if (!cost || cost === 0) return true;
    return resources.green >= (cost.green || 0) &&
           resources.yellow >= (cost.yellow || 0) &&
           resources.purple >= (cost.purple || 0);
}

// Spend resources
function spendResources(cost) {
    if (!cost || cost === 0) return true;
    if (!canAfford(cost)) return false;
    resources.green -= cost.green || 0;
    resources.yellow -= cost.yellow || 0;
    resources.purple -= cost.purple || 0;
    return true;
}

// Buy research
function buyResearch(researchId) {
    const research = RESEARCH[researchId];
    if (!research || unlockedResearch.includes(researchId)) return false;

    // Check requirements
    for (const req of research.requires) {
        if (!unlockedResearch.includes(req)) return false;
    }

    if (spendResources(research.cost)) {
        unlockedResearch.push(researchId);
        calculateResearchBonuses();
        addFloatingText(player.x, player.y - 30, `Unlocked: ${research.name}`, '#00FF00');
        return true;
    }
    return false;
}

// Spawn boss
function spawnBoss() {
    const zone = ZONES[currentZone];
    const config = BOSS_TYPES[zone.bossType];
    if (!config) return;

    bossActive = true;

    const angle = Math.random() * Math.PI * 2;
    const dist = 500;
    const spawnX = aegis.x + Math.cos(angle) * dist;
    const spawnY = aegis.y + Math.sin(angle) * dist;

    boss = {
        type: zone.bossType,
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        rotation: angle + Math.PI,
        hp: config.hp * zone.difficulty,
        maxHp: config.hp * zone.difficulty,
        shield: config.shield * zone.difficulty,
        maxShield: config.shield * zone.difficulty,
        damage: config.damage * zone.difficulty,
        speed: config.speed,
        size: config.size,
        behavior: config.behavior,
        color: config.color,
        score: config.score * zone.difficulty,
        abilities: config.abilities || [],
        abilityCooldowns: {},
        specialTimer: 0,
        phaseTimer: 0,
        droneCount: 0,
        maxDrones: config.maxDrones || 6,
        spawnRate: config.spawnRate || 5,
        beamTarget: null,
        beamCharge: 0,
        phased: false
    };

    // Initialize ability cooldowns
    for (const ability of boss.abilities) {
        boss.abilityCooldowns[ability] = 0;
    }

    addFloatingText(WIDTH / 2, HEIGHT / 2 - 100, `BOSS: ${config.name}`, '#FF0000');
    doScreenShake(15);
}

// Update boss AI
function updateBoss(dt) {
    if (!boss || !bossActive) return;

    const distToPlayer = distance(boss.x, boss.y, player.x, player.y);
    const distToAegis = distance(boss.x, boss.y, aegis.x, aegis.y);
    const angleToPlayer = angleToTarget(boss.x, boss.y, player.x, player.y);

    // Decrement cooldowns
    for (const ability in boss.abilityCooldowns) {
        if (boss.abilityCooldowns[ability] > 0) {
            boss.abilityCooldowns[ability] -= dt;
        }
    }
    boss.specialTimer -= dt;
    boss.phaseTimer -= dt;

    // Phase shift (invulnerability)
    if (boss.phased && boss.phaseTimer <= 0) {
        boss.phased = false;
    }

    // Boss behaviors based on type
    switch (boss.behavior) {
        case 'queen':
            // Circle player while spawning swarms
            if (distToPlayer > 200) {
                boss.rotation = angleToPlayer;
                boss.vx += Math.cos(boss.rotation) * boss.speed * dt;
                boss.vy += Math.sin(boss.rotation) * boss.speed * dt;
            } else {
                boss.rotation = angleToPlayer + Math.PI / 2;
                boss.vx += Math.cos(boss.rotation) * boss.speed * 0.5 * dt;
                boss.vy += Math.sin(boss.rotation) * boss.speed * 0.5 * dt;
            }

            // Spawn swarm
            if (boss.abilityCooldowns['spawnSwarm'] <= 0 && boss.droneCount < boss.maxDrones) {
                for (let i = 0; i < 3; i++) {
                    const config = ENEMY_TYPES.drone;
                    const spawnAngle = Math.random() * Math.PI * 2;
                    enemies.push({
                        type: 'drone',
                        x: boss.x + Math.cos(spawnAngle) * 30,
                        y: boss.y + Math.sin(spawnAngle) * 30,
                        vx: 0, vy: 0,
                        rotation: spawnAngle,
                        hp: config.hp, maxHp: config.hp,
                        shield: 0, maxShield: 0,
                        damage: config.damage, speed: config.speed,
                        fireRate: config.fireRate, fireCooldown: 0,
                        size: config.size, behavior: config.behavior,
                        color: config.color, score: config.score,
                        swarmPhase: Math.random() * Math.PI * 2,
                        parentBoss: boss
                    });
                    boss.droneCount++;
                }
                boss.abilityCooldowns['spawnSwarm'] = boss.spawnRate;
                createParticles(boss.x, boss.y, 10, '#FF00FF', 80);
            }

            // Acid spit (spread projectiles)
            if (boss.abilityCooldowns['acidSpit'] <= 0) {
                for (let i = -2; i <= 2; i++) {
                    const spreadAngle = angleToPlayer + i * 0.3;
                    projectiles.push({
                        x: boss.x + Math.cos(spreadAngle) * boss.size,
                        y: boss.y + Math.sin(spreadAngle) * boss.size,
                        vx: Math.cos(spreadAngle) * 350,
                        vy: Math.sin(spreadAngle) * 350,
                        damage: boss.damage * 0.7,
                        color: '#88FF00',
                        isPlayer: false,
                        life: 2.5
                    });
                }
                boss.abilityCooldowns['acidSpit'] = 3;
            }
            break;

        case 'hiveMind':
            // Stay at range, use psychic abilities
            if (distToPlayer < 300) {
                boss.rotation = angleToPlayer + Math.PI;
                boss.vx += Math.cos(boss.rotation) * boss.speed * dt;
                boss.vy += Math.sin(boss.rotation) * boss.speed * dt;
            }

            // Psychic wave (damage in radius)
            if (boss.abilityCooldowns['psychicWave'] <= 0) {
                const radius = 250;
                if (distToPlayer < radius) {
                    player.hp -= boss.damage * 0.5;
                    addFloatingText(player.x, player.y - 20, 'PSYCHIC!', '#00FF00');
                    doScreenShake(15);
                }
                createExplosion(boss.x, boss.y, radius, '#00FF0044');
                boss.abilityCooldowns['psychicWave'] = 5;
            }
            break;

        case 'destroyerPrime':
            // Heavy assault with beam and missiles
            boss.rotation = angleToPlayer;
            if (distToPlayer > 350) {
                boss.vx += Math.cos(boss.rotation) * boss.speed * dt;
                boss.vy += Math.sin(boss.rotation) * boss.speed * dt;
            }

            // Devastator beam
            if (boss.abilityCooldowns['devastatorBeam'] <= 0) {
                boss.beamTarget = { x: player.x, y: player.y };
                boss.beamCharge = 1.5;
                boss.abilityCooldowns['devastatorBeam'] = 8;
            }

            // Charge and fire beam
            if (boss.beamCharge > 0) {
                boss.beamCharge -= dt;
                if (boss.beamCharge <= 0 && boss.beamTarget) {
                    // Fire beam
                    beams.push({
                        x1: boss.x,
                        y1: boss.y,
                        x2: boss.beamTarget.x,
                        y2: boss.beamTarget.y,
                        damage: boss.damage * 2,
                        color: '#FF4400',
                        width: 8,
                        life: 0.5
                    });

                    // Damage player if near beam
                    const beamDist = distanceToLine(player.x, player.y, boss.x, boss.y, boss.beamTarget.x, boss.beamTarget.y);
                    if (beamDist < 30) {
                        takeDamage(boss.damage * 2);
                    }

                    doScreenShake(20);
                    boss.beamTarget = null;
                }
            }

            // Missile barrage
            if (boss.abilityCooldowns['missileBarrage'] <= 0) {
                for (let i = 0; i < 6; i++) {
                    const missileAngle = angleToPlayer + (Math.random() - 0.5) * 0.5;
                    projectiles.push({
                        x: boss.x + Math.cos(missileAngle) * boss.size,
                        y: boss.y + Math.sin(missileAngle) * boss.size,
                        vx: Math.cos(missileAngle) * 250,
                        vy: Math.sin(missileAngle) * 250,
                        rotation: missileAngle,
                        damage: boss.damage * 0.8,
                        color: '#FF6347',
                        isPlayer: false,
                        isMissile: true,
                        tracking: 0.3,
                        turnRate: 60,
                        target: player,
                        life: 4
                    });
                }
                boss.abilityCooldowns['missileBarrage'] = 6;
            }
            break;

        case 'matriarch':
            // Spawn fighters and heal allies
            boss.rotation = angleToPlayer;
            if (distToPlayer < 400) {
                boss.rotation = angleToPlayer + Math.PI;
                boss.vx += Math.cos(boss.rotation) * boss.speed * dt;
                boss.vy += Math.sin(boss.rotation) * boss.speed * dt;
            }

            // Mass spawn
            if (boss.abilityCooldowns['massSpawn'] <= 0 && boss.droneCount < boss.maxDrones) {
                const types = ['drone', 'fighter', 'heavyFighter'];
                for (let i = 0; i < 4; i++) {
                    const type = types[Math.floor(Math.random() * types.length)];
                    const config = ENEMY_TYPES[type];
                    const spawnAngle = Math.random() * Math.PI * 2;
                    enemies.push({
                        type,
                        x: boss.x + Math.cos(spawnAngle) * 40,
                        y: boss.y + Math.sin(spawnAngle) * 40,
                        vx: 0, vy: 0,
                        rotation: spawnAngle,
                        hp: config.hp, maxHp: config.hp,
                        shield: config.shield || 0, maxShield: config.shield || 0,
                        damage: config.damage, speed: config.speed,
                        fireRate: config.fireRate, fireCooldown: 0,
                        size: config.size, behavior: config.behavior,
                        color: config.color, score: config.score,
                        swarmPhase: Math.random() * Math.PI * 2,
                        parentBoss: boss
                    });
                    boss.droneCount++;
                }
                boss.abilityCooldowns['massSpawn'] = 10;
                createParticles(boss.x, boss.y, 15, '#4444FF', 100);
            }

            // Healing field
            if (boss.abilityCooldowns['healingField'] <= 0) {
                for (const enemy of enemies) {
                    if (distance(boss.x, boss.y, enemy.x, enemy.y) < 200) {
                        enemy.hp = Math.min(enemy.maxHp, enemy.hp + 20);
                        createParticles(enemy.x, enemy.y, 3, '#00FF00', 30);
                    }
                }
                boss.hp = Math.min(boss.maxHp, boss.hp + 50);
                createExplosion(boss.x, boss.y, 200, '#00FF0044');
                boss.abilityCooldowns['healingField'] = 8;
            }
            break;

        case 'overmind':
            // Final boss - uses all abilities
            boss.rotation = angleToPlayer;

            // Phase shift (invulnerability)
            if (boss.hp < boss.maxHp * 0.5 && boss.abilityCooldowns['phaseShift'] <= 0) {
                boss.phased = true;
                boss.phaseTimer = 3;
                boss.abilityCooldowns['phaseShift'] = 20;
                addFloatingText(boss.x, boss.y - boss.size, 'PHASE SHIFT!', '#FF0088');
            }

            // Death ray
            if (boss.abilityCooldowns['deathRay'] <= 0) {
                // Sweeping beam attack
                const startAngle = angleToPlayer - 0.5;
                for (let i = 0; i < 5; i++) {
                    const rayAngle = startAngle + i * 0.25;
                    projectiles.push({
                        x: boss.x + Math.cos(rayAngle) * boss.size,
                        y: boss.y + Math.sin(rayAngle) * boss.size,
                        vx: Math.cos(rayAngle) * 600,
                        vy: Math.sin(rayAngle) * 600,
                        damage: boss.damage,
                        color: '#FF0088',
                        isPlayer: false,
                        life: 2
                    });
                }
                boss.abilityCooldowns['deathRay'] = 2;
            }

            // Spawn drones periodically
            if (boss.specialTimer <= 0 && boss.droneCount < 8) {
                const config = ENEMY_TYPES.fighter;
                const spawnAngle = Math.random() * Math.PI * 2;
                enemies.push({
                    type: 'fighter',
                    x: boss.x + Math.cos(spawnAngle) * 50,
                    y: boss.y + Math.sin(spawnAngle) * 50,
                    vx: 0, vy: 0,
                    rotation: spawnAngle,
                    hp: config.hp, maxHp: config.hp,
                    shield: 0, maxShield: 0,
                    damage: config.damage, speed: config.speed,
                    fireRate: config.fireRate, fireCooldown: 0,
                    size: config.size, behavior: config.behavior,
                    color: config.color, score: config.score,
                    parentBoss: boss
                });
                boss.droneCount++;
                boss.specialTimer = 5;
            }
            break;
    }

    // Apply drag
    boss.vx *= 0.95;
    boss.vy *= 0.95;

    // Move
    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
}

// Distance from point to line segment
function distanceToLine(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return distance(px, py, x1, y1);

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    return distance(px, py, nearestX, nearestY);
}

// Take damage helper
function takeDamage(amount) {
    let damage = amount;
    if (player.shield > 0) {
        const absorbed = Math.min(player.shield, damage);
        player.shield -= absorbed;
        damage -= absorbed;
        if (absorbed > 0) addFloatingText(player.x, player.y - 20, 'SHIELD', '#00BFFF');
    }
    if (damage > 0) {
        player.hp -= damage;
        addFloatingText(player.x, player.y - 30, `-${Math.round(damage)}`, '#FF0000');
    }
    doScreenShake(10);

    if (player.hp <= 0) {
        createExplosion(player.x, player.y, 40, '#FF4400');
        doScreenShake(20);
        gameState = 'gameover';
    }
}

// Use ability
function useAbility(abilityName) {
    if (!unlockedAbilities.includes(abilityName)) return false;

    switch (abilityName) {
        case 'boost':
            if (boostCooldown <= 0) {
                boostDuration = 2;
                boostCooldown = 10;
                addFloatingText(player.x, player.y - 20, 'BOOST!', '#00FFFF');
                createParticles(player.x, player.y, 10, '#00FFFF', 100);
                return true;
            }
            break;
        case 'emp':
            if (empCooldown <= 0) {
                // Disable enemy shields in radius
                const radius = 300;
                for (const enemy of enemies) {
                    if (distance(player.x, player.y, enemy.x, enemy.y) < radius) {
                        enemy.shield = 0;
                        enemy.fireCooldown += 2;  // Stun enemies briefly
                        createParticles(enemy.x, enemy.y, 5, '#8888FF', 50);
                    }
                }
                if (boss && distance(player.x, player.y, boss.x, boss.y) < radius) {
                    boss.shield = Math.max(0, boss.shield - boss.maxShield * 0.3);
                    createParticles(boss.x, boss.y, 10, '#8888FF', 80);
                }
                createExplosion(player.x, player.y, radius, '#8888FF44');
                doScreenShake(10);
                empCooldown = 20;
                addFloatingText(player.x, player.y - 20, 'EMP!', '#8888FF');
                return true;
            }
            break;
    }
    return false;
}

// Check and unlock achievements
function checkAchievements() {
    if (!achievements.firstKill && enemiesKilled >= 1) {
        achievements.firstKill = true;
        showAchievement('First Blood', 'Kill your first enemy');
    }
    if (!achievements.waveClearer && currentWave >= 5) {
        achievements.waveClearer = true;
        showAchievement('Wave Clearer', 'Survive 5 waves');
    }
    if (!achievements.miningMaster && resources.green + resources.yellow + resources.purple >= 500) {
        achievements.miningMaster = true;
        showAchievement('Mining Master', 'Collect 500 total resources');
    }
    if (!achievements.bossSlayer && bossDefeated) {
        achievements.bossSlayer = true;
        showAchievement('Boss Slayer', 'Defeat a zone boss');
    }
}

function showAchievement(name, desc) {
    achievementPopup = { name, desc, timer: 4 };
}

// Input handlers
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;

    if (gameState === 'menu' && (e.code === 'Space' || e.key === 'Enter')) {
        startGame();
    }

    if (gameState === 'gameover' && (e.code === 'Space' || e.key === 'Enter')) {
        startGame();
    }

    if (gameState === 'playing') {
        // Dock/undock
        if (e.key.toLowerCase() === 'r') {
            if (player.docked) {
                undock();
            } else if (distance(player.x, player.y, aegis.x, aegis.y) < aegis.radius + 50) {
                dock();
            }
        }

        // Gravity beam
        if (e.key.toLowerCase() === 'e') {
            gravityBeamActive = true;
        }

        // Abilities
        if (e.key.toLowerCase() === 'f') {
            useAbility('boost');
        }
        if (e.key.toLowerCase() === 'g') {
            useAbility('emp');
        }

        // Zone selection when docked
        if (player.docked && bossDefeated) {
            const zoneKeys = ['1', '2', '3', '4', '5'];
            const zoneNames = ['outerGrid', 'miningSector', 'archnidTerritory', 'hiveCore', 'nexus'];
            const keyIndex = zoneKeys.indexOf(e.key);
            if (keyIndex >= 0 && zoneCleared[zoneNames[keyIndex - 1]] !== false || keyIndex === 0) {
                // Can travel to this zone if previous zone is cleared (or first zone)
                const prevCleared = keyIndex === 0 || zoneCleared[zoneNames[keyIndex - 1]];
                if (prevCleared) {
                    undock();
                    changeZone(zoneNames[keyIndex]);
                }
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;

    if (e.key.toLowerCase() === 'e') {
        gravityBeamActive = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    if (gameState === 'menu') startGame();
    if (gameState === 'gameover') startGame();
});

canvas.addEventListener('mouseup', () => {
    mouse.down = false;
});

// Game functions
function startGame() {
    gameState = 'playing';
    player = createPlayer();
    aegis = createAegis();
    enemies = [];
    projectiles = [];
    minerals = [];
    explosions = [];
    particles = [];
    floatingTexts = [];
    beams = [];
    hazards = [];
    screenShake = 0;
    resources = { green: 50, yellow: 30, purple: 10 };
    currentWave = 0;
    waveTimer = 3;
    enemiesKilled = 0;
    score = 0;
    weaponLevel = 1;

    // Reset zone and boss
    currentZone = 'outerGrid';
    bossActive = false;
    boss = null;
    bossDefeated = false;
    maxWaves = ZONES[currentZone].wavesToBoss;

    // Reset abilities
    boostCooldown = 0;
    boostDuration = 0;
    empCooldown = 0;

    // Reset achievements (don't reset - persist across runs)
    achievementPopup = null;

    // Apply hull stats
    applyPlayerStats();

    createAsteroids();
    createStars();
    createHazards();
}

// Apply player stats from hull and upgrades
function applyPlayerStats() {
    const hull = SHIP_HULLS[playerHull];
    const engine = ENGINES[playerEngine];
    const generator = GENERATORS[playerGenerator];
    const shield = SHIELDS[playerShieldGen];

    player.maxHp = Math.floor(hull.hp * researchBonuses.shield);
    player.hp = player.maxHp;
    player.maxShield = Math.floor(hull.shield * shield.shieldMult * researchBonuses.shield);
    player.shield = player.maxShield;
    player.shieldRecharge = 5 * shield.rechargeMult * researchBonuses.shieldRegen;
    player.maxEnergy = Math.floor(hull.energy * generator.energyMult);
    player.energy = player.maxEnergy;
    player.energyRecharge = 10 * generator.rechargeMult;
    player.cargoCapacity = Math.floor(hull.cargo * researchBonuses.cargo);
    player.speedMult = hull.speed * engine.speedMult;
    player.thrustMult = engine.thrustMult;

    // Apply missile bonus
    player.secondaryWeapon.ammo = WEAPONS.missile.maxAmmo + researchBonuses.missiles;
}

// Create environmental hazards
function createHazards() {
    hazards = [];
    const zone = ZONES[currentZone];

    // More hazards in harder zones
    const hazardCount = Math.floor(5 + zone.difficulty * 5);

    for (let i = 0; i < hazardCount; i++) {
        const type = Math.random() < 0.6 ? 'mine' : 'gasCloud';
        let x, y;
        do {
            x = Math.random() * WORLD_SIZE;
            y = Math.random() * WORLD_SIZE;
        } while (distance(x, y, WORLD_SIZE / 2, WORLD_SIZE / 2) < 250);

        if (type === 'mine') {
            hazards.push({
                type: 'mine',
                x, y,
                radius: 15,
                damage: 30 * zone.difficulty,
                triggered: false,
                triggerRadius: 80,
                color: '#FF4444'
            });
        } else {
            hazards.push({
                type: 'gasCloud',
                x, y,
                radius: 60 + Math.random() * 40,
                damagePerSecond: 5 * zone.difficulty,
                color: '#88FF8844'
            });
        }
    }
}

// Change zone
function changeZone(zoneName) {
    if (!ZONES[zoneName]) return;
    currentZone = zoneName;
    currentWave = 0;
    maxWaves = ZONES[zoneName].wavesToBoss;
    bossActive = false;
    boss = null;
    bossDefeated = false;

    // Clear enemies
    enemies = [];

    // Regenerate world
    createAsteroids();
    createHazards();

    addFloatingText(WIDTH / 2, HEIGHT / 2, `Entering: ${ZONES[zoneName].name}`, '#FFFF00');
}

function dock() {
    player.docked = true;
    player.vx = 0;
    player.vy = 0;

    // Deposit cargo
    resources.green += player.cargo.green;
    resources.yellow += player.cargo.yellow;
    resources.purple += player.cargo.purple;
    player.cargo = { green: 0, yellow: 0, purple: 0 };

    // Repair ship
    const repairCost = Math.ceil((player.maxHp - player.hp) * 0.5);
    if (resources.green >= repairCost) {
        resources.green -= repairCost;
        player.hp = player.maxHp;
    }

    // Restore shield
    player.shield = player.maxShield;

    // Reload missiles
    player.secondaryWeapon.ammo = WEAPONS.missile.maxAmmo;
}

function undock() {
    player.docked = false;
    player.x = aegis.x;
    player.y = aegis.y - aegis.radius - 50;
}

function fireBlaster() {
    if (player.fireCooldown > 0 || player.energy < player.primaryWeapon.energyCost) return;

    player.fireCooldown = 1 / player.primaryWeapon.fireRate;
    player.energy -= player.primaryWeapon.energyCost;

    const weapon = player.primaryWeapon;

    if (weapon.twin) {
        // Twin blasters
        const offset = 8;
        const perpAngle = player.rotation + Math.PI / 2;

        for (let i = -1; i <= 1; i += 2) {
            projectiles.push({
                x: player.x + Math.cos(perpAngle) * offset * i,
                y: player.y + Math.sin(perpAngle) * offset * i,
                vx: Math.cos(player.rotation) * weapon.projectileSpeed,
                vy: Math.sin(player.rotation) * weapon.projectileSpeed,
                damage: weapon.damage,
                color: weapon.color,
                isPlayer: true,
                life: 2
            });
        }
    } else {
        projectiles.push({
            x: player.x + Math.cos(player.rotation) * 20,
            y: player.y + Math.sin(player.rotation) * 20,
            vx: Math.cos(player.rotation) * weapon.projectileSpeed,
            vy: Math.sin(player.rotation) * weapon.projectileSpeed,
            damage: weapon.damage,
            color: weapon.color,
            isPlayer: true,
            life: 2
        });
    }
}

function fireMissile() {
    if (player.missileCooldown > 0 || player.secondaryWeapon.ammo <= 0) return;

    player.missileCooldown = 1 / player.secondaryWeapon.fireRate;
    player.secondaryWeapon.ammo--;

    const weapon = player.secondaryWeapon;

    // Find nearest enemy for targeting
    let target = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < minDist) {
            minDist = dist;
            target = enemy;
        }
    }

    projectiles.push({
        x: player.x + Math.cos(player.rotation) * 20,
        y: player.y + Math.sin(player.rotation) * 20,
        vx: Math.cos(player.rotation) * weapon.projectileSpeed,
        vy: Math.sin(player.rotation) * weapon.projectileSpeed,
        rotation: player.rotation,
        damage: weapon.damage,
        color: weapon.color,
        isPlayer: true,
        isMissile: true,
        tracking: weapon.tracking || 0,
        turnRate: weapon.turnRate || 0,
        target,
        life: 4
    });
}

function fireEnemyProjectile(enemy) {
    const angleToPlayer = angleToTarget(enemy.x, enemy.y, player.x, player.y);

    projectiles.push({
        x: enemy.x + Math.cos(angleToPlayer) * (enemy.size + 5),
        y: enemy.y + Math.sin(angleToPlayer) * (enemy.size + 5),
        vx: Math.cos(angleToPlayer) * 400,
        vy: Math.sin(angleToPlayer) * 400,
        damage: enemy.damage,
        color: '#FF0000',
        isPlayer: false,
        life: 3
    });
}

function createExplosion(x, y, size, color) {
    explosions.push({
        x,
        y,
        radius: 5,
        maxRadius: size,
        color,
        alpha: 1
    });

    // Add particles
    for (let i = 0; i < size / 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            size: Math.random() * 3 + 1,
            life: Math.random() * 0.5 + 0.3
        });
    }
}

function doScreenShake(intensity) {
    screenShake = Math.max(screenShake, intensity);
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x,
        y,
        text,
        color,
        vy: -50,
        life: 1.5,
        alpha: 1
    });
}

function createParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed + speed * 0.5;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color,
            size: Math.random() * 2 + 1,
            life: Math.random() * 0.4 + 0.2
        });
    }
}

function spawnMinerals(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 30 + 10;
        const colors = {
            green: COLORS.greenMineral,
            yellow: COLORS.yellowMineral,
            purple: COLORS.purpleMineral
        };

        minerals.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 50,
            vy: Math.sin(angle) * 50,
            type,
            color: colors[type],
            size: 6
        });
    }
}

// Update functions
function updatePlayer(dt) {
    if (player.docked) return;

    // Rotation - face mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.rotation = angleToTarget(player.x, player.y, worldMouseX, worldMouseY);

    // Calculate thrust multiplier (boost ability)
    const thrustMult = (player.thrustMult || 1) * (boostDuration > 0 ? 2.0 : 1.0);
    const speedMult = (player.speedMult || 1) * (boostDuration > 0 ? 1.5 : 1.0);

    // Thrust
    let thrusting = false;
    if (keys['w'] || keys['arrowup']) {
        player.vx += Math.cos(player.rotation) * PHYSICS.thrustForce * thrustMult * dt;
        player.vy += Math.sin(player.rotation) * PHYSICS.thrustForce * thrustMult * dt;
        thrusting = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.vx -= Math.cos(player.rotation) * PHYSICS.thrustForce * 0.5 * thrustMult * dt;
        player.vy -= Math.sin(player.rotation) * PHYSICS.thrustForce * 0.5 * thrustMult * dt;
    }
    if (keys['a'] || keys['arrowleft']) {
        const perpAngle = player.rotation - Math.PI / 2;
        player.vx += Math.cos(perpAngle) * PHYSICS.thrustForce * 0.7 * thrustMult * dt;
        player.vy += Math.sin(perpAngle) * PHYSICS.thrustForce * 0.7 * thrustMult * dt;
    }
    if (keys['d'] || keys['arrowright']) {
        const perpAngle = player.rotation + Math.PI / 2;
        player.vx += Math.cos(perpAngle) * PHYSICS.thrustForce * 0.7 * thrustMult * dt;
        player.vy += Math.sin(perpAngle) * PHYSICS.thrustForce * 0.7 * thrustMult * dt;
    }

    // Apply drag
    player.vx *= PHYSICS.drag;
    player.vy *= PHYSICS.drag;

    // Cap speed (with boost multiplier)
    const maxSpd = PHYSICS.maxSpeed * speedMult;
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
    if (speed > maxSpd) {
        player.vx = (player.vx / speed) * maxSpd;
        player.vy = (player.vy / speed) * maxSpd;
    }

    // Move
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // World bounds
    player.x = Math.max(50, Math.min(WORLD_SIZE - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_SIZE - 50, player.y));

    // Cooldowns
    if (player.fireCooldown > 0) player.fireCooldown -= dt;
    if (player.missileCooldown > 0) player.missileCooldown -= dt;

    // Energy recharge
    if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + player.energyRecharge * dt);
    }

    // Shield recharge
    if (player.shield < player.maxShield) {
        player.shield = Math.min(player.maxShield, player.shield + player.shieldRecharge * dt);
    }

    // Fire weapons
    if (mouse.down || keys['q']) {
        fireBlaster();
    }
    if (keys[' '] || keys['Space']) {
        fireMissile();
    }

    // Collect nearby minerals
    for (let i = minerals.length - 1; i >= 0; i--) {
        const mineral = minerals[i];
        const dist = distance(player.x, player.y, mineral.x, mineral.y);

        if (dist < PHYSICS.collectionRadius) {
            // Collect
            const totalCargo = player.cargo.green + player.cargo.yellow + player.cargo.purple;
            if (totalCargo < player.cargoCapacity) {
                player.cargo[mineral.type]++;
                minerals.splice(i, 1);
            }
        } else if (gravityBeamActive && dist < PHYSICS.gravityBeamRange * researchBonuses.gravityRange) {
            // Pull toward player
            const angle = angleToTarget(mineral.x, mineral.y, player.x, player.y);
            mineral.vx += Math.cos(angle) * PHYSICS.gravityBeamPullSpeed * dt;
            mineral.vy += Math.sin(angle) * PHYSICS.gravityBeamPullSpeed * dt;
        }
    }
}

function updateAegis(dt) {
    // Shield recharge
    if (aegis.shield < aegis.maxShield) {
        aegis.shield = Math.min(aegis.maxShield, aegis.shield + aegis.shieldRecharge * dt);
    }

    // Turret AI
    for (const turret of aegis.turrets) {
        turret.fireCooldown -= dt;

        // Find nearest enemy
        let target = null;
        let minDist = turret.range;
        for (const enemy of enemies) {
            const dist = distance(aegis.x, aegis.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }

        if (target && turret.fireCooldown <= 0) {
            turret.fireCooldown = 1 / turret.fireRate;
            const angle = angleToTarget(aegis.x, aegis.y, target.x, target.y);
            turret.angle = angle;

            // Fire turret projectile
            const turretX = aegis.x + Math.cos(angle) * aegis.radius;
            const turretY = aegis.y + Math.sin(angle) * aegis.radius;

            projectiles.push({
                x: turretX,
                y: turretY,
                vx: Math.cos(angle) * 500,
                vy: Math.sin(angle) * 500,
                damage: turret.damage,
                color: '#88FF88',
                isPlayer: true,
                life: 1.5
            });
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.fireCooldown -= dt;

        const distToPlayer = distance(enemy.x, enemy.y, player.x, player.y);
        const distToAegis = distance(enemy.x, enemy.y, aegis.x, aegis.y);

        // AI behaviors
        switch (enemy.behavior) {
            case 'swarm':
                // Drones circle and attack in groups
                const swarmAngle = angleToTarget(enemy.x, enemy.y, player.x, player.y);
                const offset = Math.sin(enemy.swarmPhase) * 0.5;
                enemy.rotation = swarmAngle + offset;
                enemy.swarmPhase += dt * 3;

                if (distToPlayer > 80) {
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;
                }

                if (distToPlayer < 300 && enemy.fireCooldown <= 0) {
                    fireEnemyProjectile(enemy);
                    enemy.fireCooldown = 1 / enemy.fireRate;
                }
                break;

            case 'pursue':
                // Fighters directly chase player
                enemy.rotation = angleToTarget(enemy.x, enemy.y, player.x, player.y);
                enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;

                if (distToPlayer < 400 && enemy.fireCooldown <= 0) {
                    fireEnemyProjectile(enemy);
                    enemy.fireCooldown = 1 / enemy.fireRate;
                }
                break;

            case 'strafe':
                // Heavy fighters circle while firing
                const angle = angleToTarget(enemy.x, enemy.y, player.x, player.y);

                if (distToPlayer > 250) {
                    enemy.rotation = angle;
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;
                } else if (distToPlayer < 150) {
                    enemy.rotation = angle + Math.PI;
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;
                } else {
                    enemy.rotation = angle + Math.PI / 2;
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * 0.5 * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * 0.5 * dt;
                }

                if (enemy.fireCooldown <= 0) {
                    fireEnemyProjectile(enemy);
                    enemy.fireCooldown = 1 / enemy.fireRate;
                }
                break;

            case 'attackStation':
                // Bombers prioritize attacking the Aegis
                enemy.rotation = angleToTarget(enemy.x, enemy.y, aegis.x, aegis.y);
                enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;

                if (distToAegis < 350 && enemy.fireCooldown <= 0) {
                    // Fire at Aegis
                    const angleToAegis = angleToTarget(enemy.x, enemy.y, aegis.x, aegis.y);
                    projectiles.push({
                        x: enemy.x + Math.cos(angleToAegis) * (enemy.size + 5),
                        y: enemy.y + Math.sin(angleToAegis) * (enemy.size + 5),
                        vx: Math.cos(angleToAegis) * 300,
                        vy: Math.sin(angleToAegis) * 300,
                        damage: enemy.damage,
                        color: '#FF8800',
                        isPlayer: false,
                        isAegisTarget: true,
                        life: 3
                    });
                    enemy.fireCooldown = 1 / enemy.fireRate;
                }
                break;

            case 'capital':
                // Destroyers move slowly, fire at both player and station
                const capitalAngle = angleToTarget(enemy.x, enemy.y, player.x, player.y);
                enemy.rotation = capitalAngle;
                enemy.vx += Math.cos(enemy.rotation) * enemy.speed * 0.5 * dt;
                enemy.vy += Math.sin(enemy.rotation) * enemy.speed * 0.5 * dt;

                if (enemy.fireCooldown <= 0) {
                    // Fire spread shots
                    for (let i = -1; i <= 1; i++) {
                        const spreadAngle = capitalAngle + i * 0.2;
                        projectiles.push({
                            x: enemy.x + Math.cos(spreadAngle) * (enemy.size + 5),
                            y: enemy.y + Math.sin(spreadAngle) * (enemy.size + 5),
                            vx: Math.cos(spreadAngle) * 350,
                            vy: Math.sin(spreadAngle) * 350,
                            damage: enemy.damage,
                            color: '#FF00FF',
                            isPlayer: false,
                            life: 2.5
                        });
                    }
                    enemy.fireCooldown = 1 / enemy.fireRate;
                }
                break;

            case 'spawnDrones':
                // Carriers stay at range, spawn drones
                const carrierAngle = angleToTarget(enemy.x, enemy.y, player.x, player.y);

                if (distToPlayer < 400) {
                    enemy.rotation = carrierAngle + Math.PI;
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;
                } else if (distToPlayer > 500) {
                    enemy.rotation = carrierAngle;
                    enemy.vx += Math.cos(enemy.rotation) * enemy.speed * dt;
                    enemy.vy += Math.sin(enemy.rotation) * enemy.speed * dt;
                }

                // Spawn drones
                if (!enemy.spawnTimer) enemy.spawnTimer = 0;
                if (!enemy.droneCount) enemy.droneCount = 0;

                enemy.spawnTimer -= dt;
                if (enemy.spawnTimer <= 0 && enemy.droneCount < (enemy.maxDrones || 6)) {
                    // Spawn a drone
                    const config = ENEMY_TYPES.drone;
                    enemies.push({
                        type: 'drone',
                        x: enemy.x + Math.random() * 30 - 15,
                        y: enemy.y + Math.random() * 30 - 15,
                        vx: 0,
                        vy: 0,
                        rotation: carrierAngle,
                        hp: config.hp,
                        maxHp: config.hp,
                        shield: 0,
                        maxShield: 0,
                        damage: config.damage,
                        speed: config.speed,
                        fireRate: config.fireRate,
                        fireCooldown: 0,
                        size: config.size,
                        behavior: config.behavior,
                        color: config.color,
                        score: config.score,
                        swarmPhase: Math.random() * Math.PI * 2,
                        parentCarrier: enemy
                    });
                    enemy.droneCount++;
                    enemy.spawnTimer = 10 / (enemy.spawnRate || 5);
                    createParticles(enemy.x, enemy.y, 5, '#88FF88', 50);
                }
                break;
        }

        // Apply drag
        enemy.vx *= 0.95;
        enemy.vy *= 0.95;

        // Cap speed
        const speed = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
        if (speed > enemy.speed) {
            enemy.vx = (enemy.vx / speed) * enemy.speed;
            enemy.vy = (enemy.vy / speed) * enemy.speed;
        }

        // Move
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        // Missile tracking
        if (proj.isMissile && proj.tracking > 0 && proj.target) {
            const angleToTarget = Math.atan2(proj.target.y - proj.y, proj.target.x - proj.x);
            const angleDiff = normalizeAngle(angleToTarget - proj.rotation);
            const maxTurn = (proj.turnRate * Math.PI / 180) * dt * proj.tracking;
            proj.rotation += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

            const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
            proj.vx = Math.cos(proj.rotation) * speed;
            proj.vy = Math.sin(proj.rotation) * speed;
        }

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life -= dt;

        if (proj.life <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collisions
        if (proj.isPlayer) {
            // Hit boss
            if (boss && bossActive && !boss.phased) {
                if (distance(proj.x, proj.y, boss.x, boss.y) < boss.size + 5) {
                    let damage = proj.damage * researchBonuses.damage;
                    if (boss.shield > 0) {
                        const absorbed = Math.min(boss.shield, damage);
                        boss.shield -= absorbed;
                        damage -= absorbed;
                    }
                    boss.hp -= damage;

                    createExplosion(proj.x, proj.y, 20, '#FFAA00');
                    addFloatingText(boss.x, boss.y - boss.size, `-${Math.round(proj.damage * researchBonuses.damage)}`, '#FF4444');
                    doScreenShake(5);
                    projectiles.splice(i, 1);
                    continue;
                }
            }

            // Hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (distance(proj.x, proj.y, enemy.x, enemy.y) < enemy.size + 5) {
                    // Damage shield first
                    let damage = proj.damage;
                    if (enemy.shield > 0) {
                        const absorbed = Math.min(enemy.shield, damage);
                        enemy.shield -= absorbed;
                        damage -= absorbed;
                    }
                    enemy.hp -= damage;

                    createExplosion(proj.x, proj.y, 15, '#FFAA00');
                    addFloatingText(enemy.x, enemy.y - enemy.size, `-${proj.damage}`, '#FF4444');
                    doScreenShake(3);
                    projectiles.splice(i, 1);

                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemy.y, enemy.size * 2, '#FF4400');
                        addFloatingText(enemy.x, enemy.y, `+${enemy.score}`, '#FFD700');
                        doScreenShake(8);

                        // Drop resources
                        const dropChance = [0.3, 0.5, 0.75, 1.0, 1.0, 1.0][['drone', 'fighter', 'heavyFighter', 'bomber', 'destroyer', 'carrier'].indexOf(enemy.type)] || 0.5;
                        const dropCount = enemy.type === 'destroyer' ? 5 : (enemy.type === 'carrier' ? 10 : 1);
                        if (Math.random() < dropChance) {
                            const types = ['green', 'yellow', 'purple'];
                            const type = types[Math.floor(Math.random() * 3)];
                            const count = Math.floor(Math.random() * 3) + dropCount;
                            spawnMinerals(enemy.x, enemy.y, count, type);
                        }

                        // Update carrier/boss drone count if this was a drone
                        if (enemy.parentCarrier) {
                            enemy.parentCarrier.droneCount--;
                        }
                        if (enemy.parentBoss) {
                            enemy.parentBoss.droneCount--;
                        }

                        score += enemy.score;
                        enemiesKilled++;
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }

            // Hit asteroids
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const asteroid = asteroids[j];
                if (distance(proj.x, proj.y, asteroid.x, asteroid.y) < asteroid.radius + 5) {
                    asteroid.hp -= proj.damage;
                    createExplosion(proj.x, proj.y, 10, '#888888');
                    projectiles.splice(i, 1);

                    if (asteroid.hp <= 0) {
                        createExplosion(asteroid.x, asteroid.y, asteroid.radius * 1.5, '#664422');

                        // Spawn minerals
                        const count = Math.floor(Math.random() * (asteroid.minerals.max - asteroid.minerals.min + 1)) + asteroid.minerals.min;
                        const types = ['green', 'yellow', 'purple'];
                        const weights = [0.5, 0.35, 0.15];

                        for (let k = 0; k < count; k++) {
                            const r = Math.random();
                            let type = 'green';
                            if (r > weights[0] + weights[1]) type = 'purple';
                            else if (r > weights[0]) type = 'yellow';
                            spawnMinerals(asteroid.x, asteroid.y, 1, type);
                        }

                        asteroids.splice(j, 1);
                    }
                    break;
                }
            }
        } else {
            // Enemy projectiles
            if (proj.isAegisTarget) {
                // Hit Aegis
                if (distance(proj.x, proj.y, aegis.x, aegis.y) < aegis.radius + 5) {
                    let damage = proj.damage;
                    if (aegis.shield > 0) {
                        const absorbed = Math.min(aegis.shield, damage);
                        aegis.shield -= absorbed;
                        damage -= absorbed;
                    }
                    aegis.hp -= damage;

                    createExplosion(proj.x, proj.y, 20, '#FF6600');
                    projectiles.splice(i, 1);

                    if (aegis.hp <= 0) {
                        gameState = 'gameover';
                    }
                }
            } else {
                // Hit player
                if (!player.docked && distance(proj.x, proj.y, player.x, player.y) < 20) {
                    let damage = proj.damage;
                    if (player.shield > 0) {
                        const absorbed = Math.min(player.shield, damage);
                        player.shield -= absorbed;
                        damage -= absorbed;
                        addFloatingText(player.x, player.y - 20, 'SHIELD', '#00BFFF');
                    }
                    if (damage > 0) {
                        player.hp -= damage;
                        addFloatingText(player.x, player.y - 30, `-${damage}`, '#FF0000');
                    }

                    createExplosion(proj.x, proj.y, 15, '#FF0000');
                    doScreenShake(10);
                    projectiles.splice(i, 1);

                    if (player.hp <= 0) {
                        createExplosion(player.x, player.y, 40, '#FF4400');
                        doScreenShake(20);
                        gameState = 'gameover';
                    }
                }
            }
        }
    }
}

function updateMinerals(dt) {
    for (const mineral of minerals) {
        mineral.x += mineral.vx * dt;
        mineral.y += mineral.vy * dt;
        mineral.vx *= 0.98;
        mineral.vy *= 0.98;
    }
}

function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.radius += (exp.maxRadius - exp.radius) * 5 * dt;
        exp.alpha -= dt * 2;

        if (exp.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = Math.min(1, ft.life);

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updateScreenShake(dt) {
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
}

function updateWaves(dt) {
    // If boss is active, check for boss death
    if (bossActive && boss) {
        if (boss.hp <= 0) {
            // Boss defeated!
            createExplosion(boss.x, boss.y, boss.size * 3, boss.color);
            addFloatingText(boss.x, boss.y, `+${boss.score}`, '#FFD700');
            score += boss.score;
            doScreenShake(30);

            // Drop lots of resources
            for (let i = 0; i < 20; i++) {
                const types = ['green', 'yellow', 'purple'];
                const type = types[Math.floor(Math.random() * 3)];
                spawnMinerals(boss.x, boss.y, 3, type);
            }

            bossActive = false;
            bossDefeated = true;
            boss = null;
            zoneCleared[currentZone] = true;

            checkAchievements();
        }
        return;  // Don't spawn waves during boss fight
    }

    // Wave completion
    if (enemies.length === 0 && currentWave < maxWaves) {
        waveTimer -= dt;
        if (waveTimer <= 0) {
            spawnWave();
            waveTimer = waveDelay;
        }
    }

    // All waves cleared - spawn boss
    if (enemies.length === 0 && currentWave >= maxWaves && !bossActive && !bossDefeated) {
        waveTimer -= dt;
        if (waveTimer <= 0) {
            spawnBoss();
        }
    }

    // Zone cleared - show victory or allow zone change
    if (bossDefeated && enemies.length === 0) {
        // Check if all zones cleared
        const allZonesCleared = Object.values(zoneCleared).every(v => v);
        if (allZonesCleared) {
            gameState = 'victory';
        }
    }

    checkAchievements();
}

function updateHazards(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) {
        const hazard = hazards[i];

        if (hazard.type === 'mine') {
            // Check trigger distance
            const distToPlayer = distance(player.x, player.y, hazard.x, hazard.y);
            if (distToPlayer < hazard.triggerRadius && !hazard.triggered) {
                hazard.triggered = true;
                hazard.timer = 1.5;  // Arm time
            }

            if (hazard.triggered) {
                hazard.timer -= dt;
                if (hazard.timer <= 0) {
                    // Explode
                    createExplosion(hazard.x, hazard.y, 60, '#FF6600');
                    doScreenShake(15);

                    // Damage player if close
                    const distToPlayerNow = distance(player.x, player.y, hazard.x, hazard.y);
                    if (distToPlayerNow < 80) {
                        takeDamage(hazard.damage * (1 - distToPlayerNow / 80));
                    }

                    // Damage enemies
                    for (const enemy of enemies) {
                        const distToEnemy = distance(hazard.x, hazard.y, enemy.x, enemy.y);
                        if (distToEnemy < 80) {
                            enemy.hp -= hazard.damage * (1 - distToEnemy / 80);
                        }
                    }

                    hazards.splice(i, 1);
                }
            }
        } else if (hazard.type === 'gasCloud') {
            // Damage player in gas
            const distToPlayer = distance(player.x, player.y, hazard.x, hazard.y);
            if (distToPlayer < hazard.radius && !player.docked) {
                player.hp -= hazard.damagePerSecond * dt;
                if (Math.random() < 0.1) {
                    createParticles(player.x, player.y, 2, '#88FF88', 30);
                }

                if (player.hp <= 0) {
                    createExplosion(player.x, player.y, 40, '#FF4400');
                    doScreenShake(20);
                    gameState = 'gameover';
                }
            }
        }
    }
}

function updateBeams(dt) {
    for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        beam.life -= dt;

        if (beam.life <= 0) {
            beams.splice(i, 1);
        }
    }
}

function updateAbilities(dt) {
    if (boostCooldown > 0) boostCooldown -= dt;
    if (boostDuration > 0) boostDuration -= dt;
    if (empCooldown > 0) empCooldown -= dt;

    if (achievementPopup) {
        achievementPopup.timer -= dt;
        if (achievementPopup.timer <= 0) {
            achievementPopup = null;
        }
    }
}

function updateCamera() {
    camera.x = player.x - WIDTH / 2;
    camera.y = player.y - HEIGHT / 2;

    // Clamp to world bounds
    camera.x = Math.max(0, Math.min(WORLD_SIZE - WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_SIZE - HEIGHT, camera.y));
}

function updateAsteroids(dt) {
    for (const asteroid of asteroids) {
        asteroid.rotation += asteroid.rotSpeed * dt;
    }
}

// Main update
function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateAegis(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updateMinerals(dt);
    updateExplosions(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateScreenShake(dt);
    updateAsteroids(dt);
    updateHazards(dt);
    updateBeams(dt);
    updateAbilities(dt);
    updateWaves(dt);
    updateCamera();
}

// Drawing functions
function drawBackground() {
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw stars
    for (const star of stars) {
        const sx = star.x - camera.x;
        const sy = star.y - camera.y;

        if (sx >= -10 && sx <= WIDTH + 10 && sy >= -10 && sy <= HEIGHT + 10) {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw nebula effect
    const gradient = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, 400);
    gradient.addColorStop(0, 'rgba(30, 58, 95, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawAsteroids() {
    for (const asteroid of asteroids) {
        const ax = asteroid.x - camera.x;
        const ay = asteroid.y - camera.y;

        if (ax < -50 || ax > WIDTH + 50 || ay < -50 || ay > HEIGHT + 50) continue;

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(asteroid.rotation);

        // Draw irregular asteroid shape
        ctx.fillStyle = COLORS.asteroidBrown;
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = asteroid.radius * (0.7 + Math.sin(i * 3.7) * 0.3);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(-asteroid.radius * 0.3, -asteroid.radius * 0.3, asteroid.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar if damaged
        if (asteroid.hp < asteroid.maxHp) {
            const barWidth = asteroid.radius * 2;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(ax - barWidth / 2, ay - asteroid.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#888';
            ctx.fillRect(ax - barWidth / 2, ay - asteroid.radius - 10, barWidth * (asteroid.hp / asteroid.maxHp), barHeight);
        }
    }
}

function drawAegis() {
    const ax = aegis.x - camera.x;
    const ay = aegis.y - camera.y;

    if (ax < -100 || ax > WIDTH + 100 || ay < -100 || ay > HEIGHT + 100) return;

    // Shield
    if (aegis.shield > 0) {
        ctx.strokeStyle = `rgba(0, 191, 255, ${0.3 + aegis.shield / aegis.maxShield * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ax, ay, aegis.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Station body
    ctx.fillStyle = COLORS.aegisHull;
    ctx.beginPath();
    ctx.arc(ax, ay, aegis.radius, 0, Math.PI * 2);
    ctx.fill();

    // Station detail
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(ax, ay, aegis.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(ax, ay, aegis.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Turrets
    for (const turret of aegis.turrets) {
        const tx = ax + Math.cos(turret.angle) * aegis.radius;
        const ty = ay + Math.sin(turret.angle) * aegis.radius;

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fill();

        // Turret barrel
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(turret.angle) * 12, ty + Math.sin(turret.angle) * 12);
        ctx.stroke();
    }

    // Dock indicator
    if (!player.docked) {
        const distToAegis = distance(player.x, player.y, aegis.x, aegis.y);
        if (distToAegis < aegis.radius + 80) {
            ctx.strokeStyle = '#00FF00';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ax, ay, aegis.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#00FF00';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press R to Dock', ax, ay + aegis.radius + 25);
        }
    }
}

function drawPlayer() {
    if (player.docked) return;

    const px = player.x - camera.x;
    const py = player.y - camera.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(player.rotation);

    // Shield
    if (player.shield > 0) {
        ctx.strokeStyle = `rgba(0, 191, 255, ${0.3 + player.shield / player.maxShield * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Ship body (teardrop shape)
    ctx.fillStyle = COLORS.playerShip;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#7AB8E0';
    ctx.beginPath();
    ctx.ellipse(4, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engines
    if (keys['w'] || keys['arrowup']) {
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(-20 - Math.random() * 5, 0);
        ctx.lineTo(-12, 6);
        ctx.fill();
    }

    ctx.restore();

    // Gravity beam
    if (gravityBeamActive) {
        ctx.strokeStyle = 'rgba(50, 205, 50, 0.4)';
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.arc(px, py, PHYSICS.gravityBeamRange / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(50, 205, 50, 0.2)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(px, py, PHYSICS.gravityBeamRange, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        const ex = enemy.x - camera.x;
        const ey = enemy.y - camera.y;

        if (ex < -60 || ex > WIDTH + 60 || ey < -60 || ey > HEIGHT + 60) continue;

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(enemy.rotation);

        // Shield
        if (enemy.shield > 0) {
            ctx.strokeStyle = `rgba(148, 0, 211, ${0.3 + enemy.shield / enemy.maxShield * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw based on enemy type
        if (enemy.type === 'destroyer') {
            // Destroyer - large angular warship
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(enemy.size, 0);
            ctx.lineTo(enemy.size * 0.6, -enemy.size * 0.4);
            ctx.lineTo(-enemy.size * 0.5, -enemy.size * 0.5);
            ctx.lineTo(-enemy.size, -enemy.size * 0.3);
            ctx.lineTo(-enemy.size * 0.8, 0);
            ctx.lineTo(-enemy.size, enemy.size * 0.3);
            ctx.lineTo(-enemy.size * 0.5, enemy.size * 0.5);
            ctx.lineTo(enemy.size * 0.6, enemy.size * 0.4);
            ctx.closePath();
            ctx.fill();

            // Turret mounts
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(0, -enemy.size * 0.25, 4, 0, Math.PI * 2);
            ctx.arc(0, enemy.size * 0.25, 4, 0, Math.PI * 2);
            ctx.fill();

            // Bridge
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.arc(enemy.size * 0.3, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'carrier') {
            // Carrier - large rectangular hangar ship
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(enemy.size * 0.6, 0);
            ctx.lineTo(enemy.size * 0.3, -enemy.size * 0.6);
            ctx.lineTo(-enemy.size * 0.8, -enemy.size * 0.6);
            ctx.lineTo(-enemy.size, -enemy.size * 0.3);
            ctx.lineTo(-enemy.size, enemy.size * 0.3);
            ctx.lineTo(-enemy.size * 0.8, enemy.size * 0.6);
            ctx.lineTo(enemy.size * 0.3, enemy.size * 0.6);
            ctx.closePath();
            ctx.fill();

            // Hangar opening
            ctx.fillStyle = '#222';
            ctx.fillRect(-enemy.size * 0.5, -enemy.size * 0.3, enemy.size * 0.6, enemy.size * 0.6);

            // Hangar glow
            ctx.fillStyle = '#88FF88';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-enemy.size * 0.4, -enemy.size * 0.2, enemy.size * 0.4, enemy.size * 0.4);
            ctx.globalAlpha = 1;

            // Bridge
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(enemy.size * 0.2, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standard enemy body (drones, fighters, etc)
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(enemy.size, 0);
            ctx.lineTo(-enemy.size * 0.7, -enemy.size * 0.6);
            ctx.lineTo(-enemy.size * 0.3, 0);
            ctx.lineTo(-enemy.size * 0.7, enemy.size * 0.6);
            ctx.closePath();
            ctx.fill();

            // Eye/cockpit
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(enemy.size * 0.3, 0, enemy.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar
        const barWidth = enemy.size * 2;
        const barHeight = enemy.type === 'destroyer' || enemy.type === 'carrier' ? 5 : 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(ex - barWidth / 2, ey - enemy.size - 12, barWidth, barHeight);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(ex - barWidth / 2, ey - enemy.size - 12, barWidth * (enemy.hp / enemy.maxHp), barHeight);

        // Shield bar for destroyer/carrier
        if ((enemy.type === 'destroyer' || enemy.type === 'carrier') && enemy.maxShield > 0) {
            ctx.fillStyle = '#333';
            ctx.fillRect(ex - barWidth / 2, ey - enemy.size - 18, barWidth, 3);
            ctx.fillStyle = '#8888FF';
            ctx.fillRect(ex - barWidth / 2, ey - enemy.size - 18, barWidth * (enemy.shield / enemy.maxShield), 3);
        }

        // Enemy type label for big enemies
        if (enemy.type === 'destroyer' || enemy.type === 'carrier') {
            ctx.fillStyle = '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.type.toUpperCase(), ex, ey + enemy.size + 15);
        }
    }
}

function drawProjectiles() {
    for (const proj of projectiles) {
        const px = proj.x - camera.x;
        const py = proj.y - camera.y;

        if (px < -10 || px > WIDTH + 10 || py < -10 || py > HEIGHT + 10) continue;

        if (proj.isMissile) {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(proj.rotation);

            // Missile body
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-6, -3);
            ctx.lineTo(-6, 3);
            ctx.closePath();
            ctx.fill();

            // Exhaust
            ctx.fillStyle = '#FF8800';
            ctx.beginPath();
            ctx.moveTo(-6, -2);
            ctx.lineTo(-12 - Math.random() * 4, 0);
            ctx.lineTo(-6, 2);
            ctx.fill();

            ctx.restore();
        } else {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.strokeStyle = proj.color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - proj.vx * 0.02, py - proj.vy * 0.02);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}

function drawMinerals() {
    for (const mineral of minerals) {
        const mx = mineral.x - camera.x;
        const my = mineral.y - camera.y;

        if (mx < -10 || mx > WIDTH + 10 || my < -10 || my > HEIGHT + 10) continue;

        // Glow
        ctx.fillStyle = mineral.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(mx, my, mineral.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Core
        ctx.fillStyle = mineral.color;
        ctx.beginPath();
        ctx.arc(mx, my, mineral.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(mx - mineral.size * 0.3, my - mineral.size * 0.3, mineral.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawExplosions() {
    for (const exp of explosions) {
        const ex = exp.x - camera.x;
        const ey = exp.y - camera.y;

        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = exp.color;
        ctx.beginPath();
        ctx.arc(ex, ey, exp.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, exp.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawBoss() {
    if (!boss || !bossActive) return;

    const bx = boss.x - camera.x;
    const by = boss.y - camera.y;

    if (bx < -100 || bx > WIDTH + 100 || by < -100 || by > HEIGHT + 100) return;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(boss.rotation);

    // Phase shift visual
    if (boss.phased) {
        ctx.globalAlpha = 0.4;
    }

    // Shield
    if (boss.shield > 0) {
        ctx.strokeStyle = `rgba(148, 0, 211, ${0.4 + boss.shield / boss.maxShield * 0.4})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, boss.size + 10, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Boss body - draw based on type
    ctx.fillStyle = boss.color;
    ctx.beginPath();

    // Complex shape for boss
    const s = boss.size;
    ctx.moveTo(s * 1.2, 0);
    ctx.lineTo(s * 0.5, -s * 0.8);
    ctx.lineTo(-s * 0.3, -s);
    ctx.lineTo(-s, -s * 0.6);
    ctx.lineTo(-s * 0.8, 0);
    ctx.lineTo(-s, s * 0.6);
    ctx.lineTo(-s * 0.3, s);
    ctx.lineTo(s * 0.5, s * 0.8);
    ctx.closePath();
    ctx.fill();

    // Boss eye(s)
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(s * 0.4, 0, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Glow center
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(s * 0.4, 0, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();

    // Beam charge indicator
    if (boss.beamCharge > 0 && boss.beamTarget) {
        ctx.strokeStyle = '#FF440088';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(boss.beamTarget.x - camera.x, boss.beamTarget.y - camera.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Warning text
        ctx.fillStyle = '#FF4400';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BEAM CHARGING!', bx, by - boss.size - 30);
    }

    // Health bar (large)
    const barWidth = boss.size * 3;
    const barHeight = 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx - barWidth / 2, by - boss.size - 25, barWidth, barHeight);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(bx - barWidth / 2, by - boss.size - 25, barWidth * (boss.hp / boss.maxHp), barHeight);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - barWidth / 2, by - boss.size - 25, barWidth, barHeight);

    // Shield bar
    if (boss.maxShield > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(bx - barWidth / 2, by - boss.size - 35, barWidth, 5);
        ctx.fillStyle = '#8888FF';
        ctx.fillRect(bx - barWidth / 2, by - boss.size - 35, barWidth * (boss.shield / boss.maxShield), 5);
    }

    // Boss name
    ctx.fillStyle = boss.color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(BOSS_TYPES[boss.type]?.name || 'BOSS', bx, by - boss.size - 42);
}

function drawHazards() {
    for (const hazard of hazards) {
        const hx = hazard.x - camera.x;
        const hy = hazard.y - camera.y;

        if (hx < -100 || hx > WIDTH + 100 || hy < -100 || hy > HEIGHT + 100) continue;

        if (hazard.type === 'mine') {
            // Mine body
            ctx.fillStyle = hazard.triggered ? '#FF8800' : '#FF4444';
            ctx.beginPath();
            ctx.arc(hx, hy, hazard.radius, 0, Math.PI * 2);
            ctx.fill();

            // Spikes
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(hx + Math.cos(angle) * hazard.radius, hy + Math.sin(angle) * hazard.radius);
                ctx.lineTo(hx + Math.cos(angle) * (hazard.radius + 8), hy + Math.sin(angle) * (hazard.radius + 8));
                ctx.stroke();
            }

            // Blinking light if triggered
            if (hazard.triggered) {
                ctx.fillStyle = Math.sin(Date.now() * 0.02) > 0 ? '#FF0000' : '#FFFF00';
                ctx.beginPath();
                ctx.arc(hx, hy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (hazard.type === 'gasCloud') {
            // Gas cloud
            ctx.fillStyle = hazard.color;
            ctx.beginPath();
            ctx.arc(hx, hy, hazard.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner swirls
            ctx.strokeStyle = '#88FF88';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.001 + i * 2;
                ctx.beginPath();
                ctx.arc(hx + Math.cos(angle) * 20, hy + Math.sin(angle) * 20, hazard.radius * 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }
}

function drawBeams() {
    for (const beam of beams) {
        const x1 = beam.x1 - camera.x;
        const y1 = beam.y1 - camera.y;
        const x2 = beam.x2 - camera.x;
        const y2 = beam.y2 - camera.y;

        ctx.strokeStyle = beam.color;
        ctx.lineWidth = beam.width;
        ctx.globalAlpha = beam.life * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = beam.width * 0.3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }
}

function drawParticles() {
    for (const p of particles) {
        const px = p.x - camera.x;
        const py = p.y - camera.y;

        if (px < -10 || px > WIDTH + 10 || py < -10 || py > HEIGHT + 10) continue;

        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        const fx = ft.x - camera.x;
        const fy = ft.y - camera.y;

        if (fx < -50 || fx > WIDTH + 50 || fy < -50 || fy > HEIGHT + 50) continue;

        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, fx, fy);
        ctx.globalAlpha = 1;
    }
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, 50);

    // Player HP
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 10, 150, 15);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(10, 10, 150 * (player.hp / player.maxHp), 15);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(10, 10, 150, 15);
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 15, 22);

    // Player Shield
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 28, 150, 12);
    ctx.fillStyle = '#4444FF';
    ctx.fillRect(10, 28, 150 * (player.shield / player.maxShield), 12);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(10, 28, 150, 12);
    ctx.fillStyle = '#FFF';
    ctx.font = '10px Arial';
    ctx.fillText(`Shield: ${Math.ceil(player.shield)}/${player.maxShield}`, 15, 38);

    // Energy
    ctx.fillStyle = '#444';
    ctx.fillRect(170, 10, 100, 15);
    ctx.fillStyle = '#44FF44';
    ctx.fillRect(170, 10, 100 * (player.energy / player.maxEnergy), 15);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(170, 10, 100, 15);
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.fillText(`Energy: ${Math.ceil(player.energy)}`, 175, 22);

    // Missiles
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText(`Missiles: ${player.secondaryWeapon.ammo}`, 170, 38);

    // Resources
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Resources:`, WIDTH / 2, 15);

    ctx.fillStyle = COLORS.greenMineral;
    ctx.fillText(`G: ${resources.green}`, WIDTH / 2 - 80, 35);
    ctx.fillStyle = COLORS.yellowMineral;
    ctx.fillText(`Y: ${resources.yellow}`, WIDTH / 2, 35);
    ctx.fillStyle = COLORS.purpleMineral;
    ctx.fillText(`P: ${resources.purple}`, WIDTH / 2 + 80, 35);

    // Cargo
    const totalCargo = player.cargo.green + player.cargo.yellow + player.cargo.purple;
    ctx.fillStyle = '#AAA';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Cargo: ${totalCargo}/${player.cargoCapacity}`, 290, 22);

    // Zone and Wave info
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Zone: ${ZONES[currentZone]?.name || 'Unknown'}`, WIDTH - 10, 20);
    ctx.fillText(`Wave: ${currentWave}/${maxWaves}`, WIDTH - 10, 38);

    // Boss indicator or enemy count
    if (bossActive && boss) {
        ctx.fillStyle = '#FF4444';
        ctx.fillText('BOSS FIGHT!', WIDTH - 10, 56);
    } else {
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Enemies: ${enemies.length}`, WIDTH - 10, 56);
    }

    // Score
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT - 15);

    // Aegis status (bottom left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, HEIGHT - 60, 180, 60);

    ctx.fillStyle = '#AAA';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('AEGIS STATION', 10, HEIGHT - 45);

    ctx.fillStyle = '#444';
    ctx.fillRect(10, HEIGHT - 40, 160, 10);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(10, HEIGHT - 40, 160 * (aegis.hp / aegis.maxHp), 10);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(10, HEIGHT - 40, 160, 10);

    ctx.fillStyle = '#444';
    ctx.fillRect(10, HEIGHT - 25, 160, 8);
    ctx.fillStyle = '#4444FF';
    ctx.fillRect(10, HEIGHT - 25, 160 * (aegis.shield / aegis.maxShield), 8);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(10, HEIGHT - 25, 160, 8);

    // Minimap (top right corner)
    const mapSize = 100;
    const mapX = WIDTH - mapSize - 10;
    const mapY = 55;
    const mapScale = mapSize / WORLD_SIZE;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    ctx.strokeStyle = '#444';
    ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    // Asteroids on minimap (gray dots)
    ctx.fillStyle = '#555';
    for (const asteroid of asteroids) {
        const ax = mapX + asteroid.x * mapScale;
        const ay = mapY + asteroid.y * mapScale;
        ctx.beginPath();
        ctx.arc(ax, ay, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Minerals on minimap (colored dots)
    for (const mineral of minerals) {
        ctx.fillStyle = mineral.color;
        const mx = mapX + mineral.x * mapScale;
        const my = mapY + mineral.y * mapScale;
        ctx.beginPath();
        ctx.arc(mx, my, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Aegis on minimap (cyan circle)
    ctx.fillStyle = '#00FFFF';
    const aegisMapX = mapX + aegis.x * mapScale;
    const aegisMapY = mapY + aegis.y * mapScale;
    ctx.beginPath();
    ctx.arc(aegisMapX, aegisMapY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Enemies on minimap (red dots)
    ctx.fillStyle = '#FF0000';
    for (const enemy of enemies) {
        const ex = mapX + enemy.x * mapScale;
        const ey = mapY + enemy.y * mapScale;
        ctx.beginPath();
        ctx.arc(ex, ey, enemy.size > 25 ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player on minimap (green dot)
    if (!player.docked) {
        ctx.fillStyle = '#00FF00';
        const playerMapX = mapX + player.x * mapScale;
        const playerMapY = mapY + player.y * mapScale;
        ctx.beginPath();
        ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Speed indicator
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
    ctx.fillStyle = '#AAA';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Speed: ${Math.round(speed)}`, mapX + mapSize / 2, mapY + mapSize + 12);

    // Controls hint (bottom right)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(WIDTH - 200, HEIGHT - 75, 200, 75);

    ctx.fillStyle = '#AAA';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('WASD: Move | Mouse: Aim', WIDTH - 10, HEIGHT - 60);
    ctx.fillText('Q/Click: Blaster | Space: Missile', WIDTH - 10, HEIGHT - 47);
    ctx.fillText('E: Gravity Beam | R: Dock', WIDTH - 10, HEIGHT - 34);

    // Abilities
    if (unlockedAbilities.length > 0) {
        let abilityText = '';
        if (unlockedAbilities.includes('boost')) {
            const cooldownText = boostCooldown > 0 ? ` (${Math.ceil(boostCooldown)}s)` : '';
            abilityText += `F: Boost${cooldownText} `;
        }
        if (unlockedAbilities.includes('emp')) {
            const cooldownText = empCooldown > 0 ? ` (${Math.ceil(empCooldown)}s)` : '';
            abilityText += `G: EMP${cooldownText}`;
        }
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(abilityText, WIDTH - 10, HEIGHT - 21);
    } else {
        ctx.fillText('F: Boost | G: EMP (locked)', WIDTH - 10, HEIGHT - 21);
    }

    // Wave warning
    if (enemies.length === 0 && currentWave < maxWaves && waveTimer > 0) {
        ctx.fillStyle = '#FF8800';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Next wave in ${Math.ceil(waveTimer)}...`, WIDTH / 2, HEIGHT / 2 - 50);
    }

    // Docked UI
    if (player.docked) {
        const menuHeight = bossDefeated ? 280 : 200;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 120, 300, menuHeight);

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(WIDTH / 2 - 150, HEIGHT / 2 - 120, 300, menuHeight);

        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOCKED', WIDTH / 2, HEIGHT / 2 - 90);

        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.fillText('Ship Repaired & Reloaded', WIDTH / 2, HEIGHT / 2 - 60);
        ctx.fillText('Cargo Deposited', WIDTH / 2, HEIGHT / 2 - 40);

        ctx.fillStyle = COLORS.greenMineral;
        ctx.fillText(`Green: ${resources.green}`, WIDTH / 2 - 60, HEIGHT / 2 - 10);
        ctx.fillStyle = COLORS.yellowMineral;
        ctx.fillText(`Yellow: ${resources.yellow}`, WIDTH / 2 + 60, HEIGHT / 2 - 10);
        ctx.fillStyle = COLORS.purpleMineral;
        ctx.fillText(`Purple: ${resources.purple}`, WIDTH / 2, HEIGHT / 2 + 20);

        // Zone selection if boss defeated
        if (bossDefeated) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = '14px Arial';
            ctx.fillText('SELECT ZONE:', WIDTH / 2, HEIGHT / 2 + 50);

            const zoneNames = ['outerGrid', 'miningSector', 'archnidTerritory', 'hiveCore', 'nexus'];
            const zoneLabels = ['1: Outer Grid', '2: Mining Sector', '3: Archnid Territory', '4: Hive Core', '5: The Nexus'];
            let yOffset = 70;

            for (let i = 0; i < zoneNames.length; i++) {
                const canAccess = i === 0 || zoneCleared[zoneNames[i - 1]];
                const isCleared = zoneCleared[zoneNames[i]];

                if (canAccess) {
                    ctx.fillStyle = isCleared ? '#00FF00' : '#FFFFFF';
                    ctx.fillText(`${zoneLabels[i]}${isCleared ? ' (CLEARED)' : ''}`, WIDTH / 2, HEIGHT / 2 + yOffset);
                } else {
                    ctx.fillStyle = '#666666';
                    ctx.fillText(`${zoneLabels[i]} (LOCKED)`, WIDTH / 2, HEIGHT / 2 + yOffset);
                }
                yOffset += 18;
            }
        }

        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText('Press R to Undock', WIDTH / 2, HEIGHT / 2 + menuHeight - 145);
    }
}

function drawMenu() {
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#4A90D9';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STARSCAPE', WIDTH / 2, HEIGHT / 2 - 80);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Space Combat Mining', WIDTH / 2, HEIGHT / 2 - 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('Click or Press SPACE to Start', WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#AAA';
    ctx.font = '14px Arial';
    ctx.fillText('WASD: Move | Mouse: Aim | Q/Click: Fire', WIDTH / 2, HEIGHT / 2 + 70);
    ctx.fillText('Space: Missile | E: Gravity Beam | R: Dock', WIDTH / 2, HEIGHT / 2 + 95);
    ctx.fillText('Mine asteroids, collect resources, defend the Aegis!', WIDTH / 2, HEIGHT / 2 + 130);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#FF4444';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillText(`Enemies Killed: ${enemiesKilled}`, WIDTH / 2, HEIGHT / 2 + 40);
    ctx.fillText(`Waves Completed: ${currentWave - 1}`, WIDTH / 2, HEIGHT / 2 + 80);

    ctx.fillStyle = '#AAA';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Restart', WIDTH / 2, HEIGHT / 2 + 140);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#00FF00';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, HEIGHT / 2 - 50);

    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillText(`Enemies Killed: ${enemiesKilled}`, WIDTH / 2, HEIGHT / 2 + 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px Arial';
    ctx.fillText('All waves cleared! Aegis is safe!', WIDTH / 2, HEIGHT / 2 + 100);

    ctx.fillStyle = '#AAA';
    ctx.fillText('Press SPACE to Play Again', WIDTH / 2, HEIGHT / 2 + 150);
}

// Main draw
function draw() {
    if (gameState === 'menu') {
        drawMenu();
        return;
    }

    if (gameState === 'gameover') {
        drawBackground();
        drawAsteroids();
        drawMinerals();
        drawAegis();
        drawEnemies();
        drawProjectiles();
        drawExplosions();
        drawGameOver();
        return;
    }

    if (gameState === 'victory') {
        drawBackground();
        drawAsteroids();
        drawMinerals();
        drawAegis();
        drawPlayer();
        drawProjectiles();
        drawExplosions();
        drawVictory();
        return;
    }

    // Apply screen shake
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake * 2,
            (Math.random() - 0.5) * screenShake * 2
        );
    }

    drawBackground();
    drawHazards();
    drawAsteroids();
    drawMinerals();
    drawAegis();
    drawPlayer();
    drawEnemies();
    drawBoss();
    drawProjectiles();
    drawBeams();
    drawParticles();
    drawExplosions();
    drawFloatingTexts();

    if (screenShake > 0) {
        ctx.restore();
    }

    drawHUD();
    drawAchievementPopup();
}

function drawAchievementPopup() {
    if (!achievementPopup) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(WIDTH / 2 - 150, 60, 300, 60);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH / 2 - 150, 60, 300, 60);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACHIEVEMENT UNLOCKED!', WIDTH / 2, 82);

    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.fillText(achievementPopup.name, WIDTH / 2, 100);

    ctx.fillStyle = '#AAA';
    ctx.font = '12px Arial';
    ctx.fillText(achievementPopup.desc, WIDTH / 2, 115);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
