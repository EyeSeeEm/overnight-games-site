// Zero Sievert Clone - Canvas Implementation
// An extraction shooter set in a post-apocalyptic wasteland

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

// Game dimensions
const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// ===================== CONFIGURATION =====================
const Config = {
    TILE_SIZE: 32,
    PLAYER_SPEED: 150,
    SPRINT_MULTIPLIER: 1.6,
    AIM_SPEED_PENALTY: 0.5,
    BULLET_SPEED: 800,
    DODGE_DURATION: 0.3,
    DODGE_COOLDOWN: 1.5,
    STAMINA_MAX: 100,
    STAMINA_SPRINT_DRAIN: 15,
    STAMINA_REGEN: 8,
    VISION_RANGE: 300,
    FOG_REVEAL_RADIUS: 150,
    EXTRACT_TIME: 5,
    ZONE_WIDTH: 1600,
    ZONE_HEIGHT: 1200
};

// ===================== GAME STATE =====================
const GameState = {
    MENU: 'menu',
    BUNKER: 'bunker',
    LOADOUT: 'loadout',
    IN_RAID: 'raid',
    PAUSED: 'paused',
    DEAD: 'dead',
    EXTRACTING: 'extracting',
    INVENTORY: 'inventory',
    EXTRACTED: 'extracted'
};

let currentState = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;

// ===================== INPUT =====================
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false, clicked: false };

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Tab') e.preventDefault();
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { mouse.down = true; mouse.clicked = true; }
    if (e.button === 2) mouse.rightDown = true;
});
canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('click', () => { mouse.clicked = true; });

// ===================== WEAPONS DATA =====================
const WeaponData = {
    pm_pistol: { name: 'PM Pistol', category: 'pistol', damage: 18, magSize: 8, fireRate: 300, range: 150, spread: 8, reloadTime: 1.5, penetration: 10 },
    skorpion: { name: 'Skorpion', category: 'smg', damage: 14, magSize: 20, fireRate: 600, range: 120, spread: 12, reloadTime: 2.0, penetration: 5 },
    pump_shotgun: { name: 'Pump Shotgun', category: 'shotgun', damage: 8, pellets: 8, magSize: 6, fireRate: 60, range: 80, spread: 25, reloadTime: 3.0, penetration: 5 },
    ak74: { name: 'AK-74', category: 'rifle', damage: 28, magSize: 30, fireRate: 450, range: 200, spread: 6, reloadTime: 2.5, penetration: 30 },
    sks: { name: 'SKS', category: 'dmr', damage: 45, magSize: 10, fireRate: 120, range: 280, spread: 3, reloadTime: 2.8, penetration: 40 },
    mosin: { name: 'Mosin Nagant', category: 'sniper', damage: 95, magSize: 5, fireRate: 40, range: 350, spread: 1, reloadTime: 4.0, penetration: 60 }
};

// ===================== ITEMS DATA =====================
const ItemData = {
    bandage: { name: 'Bandage', type: 'medical', weight: 0.1, healAmount: 0, curesBleed: true, curesHeavyBleed: true, useTime: 3 },
    medkit: { name: 'Medkit', type: 'medical', weight: 0.3, healAmount: 50, curesBleed: true, curesHeavyBleed: true, useTime: 5 },
    painkillers: { name: 'Painkillers', type: 'medical', weight: 0.1, healAmount: 20, curesBleed: false, painRelief: 50, useTime: 2 },
    antirad: { name: 'Anti-Rad Pills', type: 'medical', weight: 0.1, radHeal: 30, useTime: 2 },
    splint: { name: 'Splint', type: 'medical', weight: 0.2, curesFracture: true, useTime: 4 },
    ammo_9mm: { name: '9mm Ammo', type: 'ammo', weight: 0.01, caliber: '9mm' },
    ammo_762: { name: '7.62 Ammo', type: 'ammo', weight: 0.02, caliber: '7.62' },
    ammo_12g: { name: '12 Gauge', type: 'ammo', weight: 0.04, caliber: '12g' },
    rubles: { name: 'Rubles', type: 'currency', weight: 0 },
    scrap: { name: 'Scrap Metal', type: 'material', weight: 0.2, value: 50 },
    tech_part: { name: 'Tech Parts', type: 'material', weight: 0.3, value: 150 },
    food: { name: 'Ration', type: 'food', weight: 0.3, hungerRestore: 40 }
};

// ===================== PLAYER =====================
const player = {
    x: 400, y: 300,
    width: 20, height: 20,
    health: 100, maxHealth: 100,
    stamina: 100, maxStamina: 100,
    radiation: 0,
    bleeding: false, bleedTimer: 0,
    heavyBleeding: false,  // New: Heavy bleeding does more damage
    fracture: false,  // New: Fracture reduces move speed
    pain: 0,  // New: Pain level (0-100)
    angle: 0,
    speed: Config.PLAYER_SPEED,
    dodging: false, dodgeTimer: 0, dodgeCooldown: 0, dodgeAngle: 0,
    sprinting: false,
    aiming: false,
    weapon: null,
    secondaryWeapon: null,
    currentAmmo: 0,
    reloading: false, reloadTimer: 0,
    lastShot: 0,
    inventory: [],
    maxWeight: 30,
    rubles: 5000,
    armor: 0,
    kills: 0,
    lootValue: 0,
    // New progression system
    xp: 0,
    level: 1,
    totalXPForNextLevel: 100,
    // Perks (unlocked at levels)
    perks: {
        scavenger: false,     // Level 3: +20% loot find
        ironSkin: false,      // Level 5: -10% damage taken
        quickHands: false,    // Level 7: -15% reload time
        marathonRunner: false, // Level 10: +20% stamina
        sharpshooter: false   // Level 15: -20% spread
    }
};

// ===================== GAME OBJECTS =====================
let bullets = [];
let enemies = [];
let lootContainers = [];
let loot = [];
let extractionPoints = [];
let walls = [];
let particles = [];
let damageNumbers = [];

// Zone data
let zone = {
    width: Config.ZONE_WIDTH,
    height: Config.ZONE_HEIGHT,
    fogOfWar: null,
    explored: null
};

// Camera
const camera = { x: 0, y: 0, shake: 0, shakeX: 0, shakeY: 0 };

// Blood decals (persistent)
let bloodDecals = [];

// ===================== XP AND LEVELING =====================
function gainXP(amount) {
    player.xp += amount;
    while (player.xp >= player.totalXPForNextLevel) {
        player.xp -= player.totalXPForNextLevel;
        player.level++;
        player.totalXPForNextLevel = Math.floor(100 * Math.pow(1.5, player.level - 1));

        // Check perk unlocks
        checkPerkUnlocks();

        // Show level up
        damageNumbers.push({
            x: player.x,
            y: player.y - 30,
            text: 'LEVEL UP!',
            color: '#FFD700',
            timer: 2,
            vy: -30
        });
    }
}

function checkPerkUnlocks() {
    if (player.level >= 3 && !player.perks.scavenger) {
        player.perks.scavenger = true;
    }
    if (player.level >= 5 && !player.perks.ironSkin) {
        player.perks.ironSkin = true;
    }
    if (player.level >= 7 && !player.perks.quickHands) {
        player.perks.quickHands = true;
    }
    if (player.level >= 10 && !player.perks.marathonRunner) {
        player.perks.marathonRunner = true;
        player.maxStamina = 120;
    }
    if (player.level >= 15 && !player.perks.sharpshooter) {
        player.perks.sharpshooter = true;
    }
}

function getXPForEnemy(type) {
    const xpValues = {
        bandit: 15,
        bandit_heavy: 30,
        ghoul: 20,
        wolf: 10
    };
    return xpValues[type] || 10;
}

// Extraction state
let extracting = false;
let extractTimer = 0;
let extractPoint = null;

// Radiation zones
let radiationZones = [];

// ===================== INITIALIZATION =====================
function initGame() {
    // Reset player
    player.x = zone.width / 2;
    player.y = zone.height - 100;
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.radiation = 0;
    player.bleeding = false;
    player.heavyBleeding = false;
    player.fracture = false;
    player.pain = 0;
    player.bleedTimer = 0;
    player.kills = 0;
    player.lootValue = 0;

    // Give starting weapon
    player.weapon = { ...WeaponData.pm_pistol, durability: 100 };
    player.currentAmmo = player.weapon.magSize;

    // Starting inventory
    player.inventory = [
        { ...ItemData.bandage, id: 'bandage', quantity: 3 },
        { ...ItemData.painkillers, id: 'painkillers', quantity: 2 },
        { ...ItemData.splint, id: 'splint', quantity: 1 },
        { ...ItemData.ammo_9mm, id: 'ammo_9mm', quantity: 30 }
    ];

    // Clear arrays
    bullets = [];
    enemies = [];
    lootContainers = [];
    loot = [];
    extractionPoints = [];
    walls = [];
    particles = [];
    damageNumbers = [];
    bloodDecals = [];
    radiationZones = [];

    // Generate zone
    generateZone();

    // Initialize fog of war
    const fogWidth = Math.ceil(zone.width / Config.FOG_REVEAL_RADIUS);
    const fogHeight = Math.ceil(zone.height / Config.FOG_REVEAL_RADIUS);
    zone.explored = Array(fogHeight).fill(null).map(() => Array(fogWidth).fill(false));

    currentState = GameState.IN_RAID;
    extracting = false;
    extractTimer = 0;
}

function generateZone() {
    // Generate walls/buildings
    for (let i = 0; i < 30; i++) {
        const building = {
            x: Math.random() * (zone.width - 200) + 50,
            y: Math.random() * (zone.height - 400) + 50,
            width: 80 + Math.random() * 120,
            height: 80 + Math.random() * 120
        };

        // Don't spawn buildings too close to player start
        if (building.y > zone.height - 200) continue;

        walls.push(building);
    }

    // Generate enemies
    const enemyTypes = ['bandit', 'bandit_heavy', 'ghoul', 'wolf'];
    for (let i = 0; i < 35; i++) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        let ex, ey;
        let validPos = false;

        while (!validPos) {
            ex = Math.random() * (zone.width - 100) + 50;
            ey = Math.random() * (zone.height - 300) + 50;
            validPos = true;

            // Check not in building
            for (const wall of walls) {
                if (ex > wall.x && ex < wall.x + wall.width &&
                    ey > wall.y && ey < wall.y + wall.height) {
                    validPos = false;
                    break;
                }
            }
        }

        enemies.push(createEnemy(type, ex, ey));
    }

    // Generate loot containers
    const containerTypes = ['wooden_box', 'weapon_box', 'medical_box', 'safe', 'hidden_stash'];
    for (let i = 0; i < 25; i++) {
        const type = containerTypes[Math.floor(Math.random() * containerTypes.length)];
        let cx, cy;
        let validPos = false;

        while (!validPos) {
            cx = Math.random() * (zone.width - 50) + 25;
            cy = Math.random() * (zone.height - 250) + 25;
            validPos = true;

            for (const wall of walls) {
                if (cx > wall.x - 20 && cx < wall.x + wall.width + 20 &&
                    cy > wall.y - 20 && cy < wall.y + wall.height + 20) {
                    validPos = false;
                    break;
                }
            }
        }

        lootContainers.push(createLootContainer(type, cx, cy));
    }

    // Generate extraction points
    extractionPoints = [
        { x: 50, y: 50, radius: 60, name: 'North West Extract' },
        { x: zone.width - 50, y: 50, radius: 60, name: 'North East Extract' },
        { x: zone.width / 2, y: 30, radius: 60, name: 'North Extract' },
        { x: 50, y: zone.height / 2, radius: 60, name: 'West Extract' }
    ];

    // Generate radiation zones (anomalies)
    for (let i = 0; i < 5; i++) {
        radiationZones.push({
            x: Math.random() * (zone.width - 200) + 100,
            y: Math.random() * (zone.height - 400) + 100,
            radius: 40 + Math.random() * 60,
            intensity: 5 + Math.random() * 15
        });
    }
}

function createEnemy(type, x, y) {
    const baseEnemy = {
        x, y,
        width: 18, height: 18,
        angle: Math.random() * Math.PI * 2,
        state: 'patrol',
        patrolTarget: { x: x + Math.random() * 200 - 100, y: y + Math.random() * 200 - 100 },
        alertTimer: 0,
        lastSeen: null,
        attackCooldown: 0,
        staggered: false,
        staggerTimer: 0
    };

    switch (type) {
        case 'bandit':
            return { ...baseEnemy, type, health: 80, maxHealth: 80, damage: 12, speed: 80, visionRange: 200,
                     attackRange: 150, weapon: 'pistol', armor: 0, xpValue: 10, lootTier: 1 };
        case 'bandit_heavy':
            return { ...baseEnemy, type, health: 120, maxHealth: 120, damage: 18, speed: 60, visionRange: 180,
                     attackRange: 120, weapon: 'shotgun', armor: 20, xpValue: 20, lootTier: 2 };
        case 'ghoul':
            return { ...baseEnemy, type, health: 50, maxHealth: 50, damage: 15, speed: 120, visionRange: 150,
                     attackRange: 30, weapon: 'melee', armor: 0, xpValue: 15, lootTier: 1 };
        case 'wolf':
            return { ...baseEnemy, type, health: 40, maxHealth: 40, damage: 12, speed: 140, visionRange: 200,
                     attackRange: 25, weapon: 'melee', armor: 0, xpValue: 5, lootTier: 0 };
        default:
            return { ...baseEnemy, type: 'bandit', health: 60, maxHealth: 60, damage: 10, speed: 70, visionRange: 180,
                     attackRange: 140, weapon: 'pistol', armor: 0, xpValue: 10, lootTier: 1 };
    }
}

function createLootContainer(type, x, y) {
    const container = { x, y, width: 24, height: 24, type, searched: false, loot: [] };

    // Generate loot based on type
    const lootTable = {
        wooden_box: [
            { item: 'bandage', chance: 0.7, quantity: [1, 2] },
            { item: 'ammo_9mm', chance: 0.5, quantity: [10, 20] },
            { item: 'rubles', chance: 0.6, quantity: [50, 150] },
            { item: 'scrap', chance: 0.4, quantity: [1, 3] }
        ],
        weapon_box: [
            { item: 'ammo_9mm', chance: 0.8, quantity: [20, 40] },
            { item: 'ammo_762', chance: 0.6, quantity: [15, 30] },
            { item: 'tech_part', chance: 0.3, quantity: [1, 2] },
            { item: 'rubles', chance: 0.5, quantity: [100, 300] }
        ],
        medical_box: [
            { item: 'bandage', chance: 0.9, quantity: [2, 4] },
            { item: 'medkit', chance: 0.4, quantity: [1, 1] },
            { item: 'painkillers', chance: 0.6, quantity: [1, 3] },
            { item: 'antirad', chance: 0.3, quantity: [1, 2] }
        ],
        safe: [
            { item: 'rubles', chance: 1.0, quantity: [300, 800] },
            { item: 'tech_part', chance: 0.5, quantity: [1, 3] },
            { item: 'ammo_762', chance: 0.4, quantity: [20, 40] }
        ],
        hidden_stash: [
            { item: 'rubles', chance: 0.8, quantity: [200, 500] },
            { item: 'medkit', chance: 0.3, quantity: [1, 1] },
            { item: 'tech_part', chance: 0.4, quantity: [1, 2] },
            { item: 'scrap', chance: 0.6, quantity: [2, 5] }
        ]
    };

    const table = lootTable[type] || lootTable.wooden_box;
    for (const entry of table) {
        if (Math.random() < entry.chance) {
            const quantity = Array.isArray(entry.quantity)
                ? Math.floor(Math.random() * (entry.quantity[1] - entry.quantity[0] + 1)) + entry.quantity[0]
                : entry.quantity;
            container.loot.push({ id: entry.item, quantity });
        }
    }

    return container;
}

// ===================== UPDATE FUNCTIONS =====================
function update(dt) {
    deltaTime = dt;

    switch (currentState) {
        case GameState.MENU:
            if (keys[' '] || mouse.clicked) {
                mouse.clicked = false;
                initGame();
            }
            break;

        case GameState.IN_RAID:
            updateRaid(dt);
            break;

        case GameState.DEAD:
            if (keys[' '] || mouse.clicked) {
                mouse.clicked = false;
                currentState = GameState.MENU;
            }
            break;

        case GameState.EXTRACTED:
            if (keys[' '] || mouse.clicked) {
                mouse.clicked = false;
                currentState = GameState.MENU;
            }
            break;

        case GameState.INVENTORY:
            if (keys['tab']) {
                currentState = GameState.IN_RAID;
                keys['tab'] = false;
            }
            break;
    }
}

function updateRaid(dt) {
    // Toggle inventory
    if (keys['tab']) {
        currentState = GameState.INVENTORY;
        keys['tab'] = false;
        return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateDamageNumbers(dt);
    updateCamera();
    updateFogOfWar();
    checkExtraction(dt);

    // Check death
    if (player.health <= 0) {
        currentState = GameState.DEAD;
    }
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprint
    player.sprinting = keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0);
    let speedMult = 1;

    if (player.sprinting) {
        speedMult = Config.SPRINT_MULTIPLIER;
        player.stamina -= Config.STAMINA_SPRINT_DRAIN * dt;
    } else if (player.stamina < player.maxStamina) {
        player.stamina += Config.STAMINA_REGEN * dt;
    }
    player.stamina = Math.max(0, Math.min(player.maxStamina, player.stamina));

    // Aim penalty
    player.aiming = mouse.rightDown;
    if (player.aiming) speedMult *= Config.AIM_SPEED_PENALTY;

    // Fracture slows movement significantly
    if (player.fracture) {
        speedMult *= 0.5;
    }

    // High pain slightly slows
    if (player.pain > 50) {
        speedMult *= (1 - (player.pain - 50) / 200);  // Up to 25% slow at max pain
    }

    // Weight penalty
    speedMult *= getSpeedMultiplierFromWeight();

    // Dodge
    if (keys[' '] && player.dodgeCooldown <= 0 && !player.dodging && (dx !== 0 || dy !== 0)) {
        player.dodging = true;
        player.dodgeTimer = Config.DODGE_DURATION;
        player.dodgeAngle = Math.atan2(dy, dx);
        player.dodgeCooldown = Config.DODGE_COOLDOWN;
        keys[' '] = false;
    }

    if (player.dodging) {
        player.dodgeTimer -= dt;
        if (player.dodgeTimer <= 0) {
            player.dodging = false;
        }
        dx = Math.cos(player.dodgeAngle);
        dy = Math.sin(player.dodgeAngle);
        speedMult = 3;
    }

    if (player.dodgeCooldown > 0) player.dodgeCooldown -= dt;

    // Apply movement
    const newX = player.x + dx * player.speed * speedMult * dt;
    const newY = player.y + dy * player.speed * speedMult * dt;

    // Collision check
    if (!checkCollision(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!checkCollision(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Keep in bounds
    player.x = Math.max(player.width/2, Math.min(zone.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(zone.height - player.height/2, player.y));

    // Calculate angle to mouse (in world coordinates)
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    if (mouse.down && player.weapon && !player.reloading && player.currentAmmo > 0) {
        const now = Date.now();
        const fireDelay = 60000 / player.weapon.fireRate;
        if (now - player.lastShot > fireDelay) {
            shoot();
            player.lastShot = now;
        }
    }

    // Reload
    if (keys['r'] && !player.reloading && player.weapon) {
        startReload();
        keys['r'] = false;
    }

    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            finishReload();
        }
    }

    // Interact with loot containers
    if (keys['e']) {
        keys['e'] = false;
        interactWithContainer();
        pickupLoot();
    }

    // Status effects
    if (player.bleeding) {
        player.bleedTimer += dt;
        if (player.bleedTimer >= 1) {
            player.health -= 2;
            player.bleedTimer = 0;
            spawnParticles(player.x, player.y, '#ff0000', 3);
        }
    }

    // Heavy bleeding does more damage
    if (player.heavyBleeding) {
        player.bleedTimer += dt;
        if (player.bleedTimer >= 0.5) {
            player.health -= 3;
            player.bleedTimer = 0;
            spawnParticles(player.x, player.y, '#cc0000', 5);
        }
    }

    // Pain naturally decreases but affects accuracy
    if (player.pain > 0) {
        player.pain = Math.max(0, player.pain - dt * 5);
    }

    if (player.radiation > 0) {
        player.maxHealth = 100 - player.radiation;
        if (player.health > player.maxHealth) player.health = player.maxHealth;
    }

    // Radiation zone damage
    for (const radZone of radiationZones) {
        const dist = distance(player.x, player.y, radZone.x, radZone.y);
        if (dist < radZone.radius) {
            player.radiation += radZone.intensity * dt * 0.1;
            player.radiation = Math.min(50, player.radiation);
            // Visual feedback
            if (Math.random() < 0.1) {
                spawnParticles(player.x + (Math.random() - 0.5) * 20,
                             player.y + (Math.random() - 0.5) * 20, '#00ff00', 2);
            }
        }
    }

    // Quick heal with number keys
    if (keys['1']) {
        useItem('bandage');
        keys['1'] = false;
    }
    if (keys['2']) {
        useItem('medkit');
        keys['2'] = false;
    }
    if (keys['3']) {
        useItem('painkillers');
        keys['3'] = false;
    }
    if (keys['4']) {
        useItem('antirad');
        keys['4'] = false;
    }
    if (keys['5']) {
        useItem('splint');
        keys['5'] = false;
    }

    // Weapon switching (Q key)
    if (keys['q'] && player.secondaryWeapon) {
        const temp = player.weapon;
        const tempAmmo = player.currentAmmo;
        player.weapon = player.secondaryWeapon;
        player.currentAmmo = player.secondaryAmmo || 0;
        player.secondaryWeapon = temp;
        player.secondaryAmmo = tempAmmo;
        player.reloading = false;
        keys['q'] = false;
    }
}

function shakeCamera(intensity) {
    camera.shake = Math.max(camera.shake, intensity);
}

function shoot() {
    if (player.currentAmmo <= 0) return;

    player.currentAmmo--;

    const spread = calculateSpread();
    const pellets = player.weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const angle = player.angle + (Math.random() - 0.5) * spread * (Math.PI / 180);
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * Config.BULLET_SPEED,
            vy: Math.sin(angle) * Config.BULLET_SPEED,
            damage: player.weapon.damage,
            range: player.weapon.range,
            traveled: 0,
            penetration: player.weapon.penetration,
            fromPlayer: true
        });
    }

    // Muzzle flash particle
    spawnParticles(
        player.x + Math.cos(player.angle) * 15,
        player.y + Math.sin(player.angle) * 15,
        '#ffff00', 5
    );

    // Alert nearby enemies
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < 400) {
            enemy.state = 'alert';
            enemy.lastSeen = { x: player.x, y: player.y };
        }
    }
}

function calculateSpread() {
    let spread = player.weapon.spread;
    if (player.aiming) spread *= 0.4;
    if (player.sprinting) spread *= 2;
    else if (keys['w'] || keys['a'] || keys['s'] || keys['d']) spread *= 1.3;

    // Pain increases spread
    if (player.pain > 30) {
        spread *= (1 + (player.pain - 30) / 100);  // Up to 70% more spread at max pain
    }

    // Sharpshooter perk reduces spread
    if (player.perks.sharpshooter) {
        spread *= 0.8;
    }

    return spread;
}

function startReload() {
    const ammoItem = player.inventory.find(item => {
        if (player.weapon.category === 'pistol' || player.weapon.category === 'smg') {
            return item.id === 'ammo_9mm' || item.name === '9mm Ammo';
        }
        if (player.weapon.category === 'rifle' || player.weapon.category === 'dmr' || player.weapon.category === 'sniper') {
            return item.id === 'ammo_762' || item.name === '7.62 Ammo';
        }
        if (player.weapon.category === 'shotgun') {
            return item.id === 'ammo_12g' || item.name === '12 Gauge';
        }
        return false;
    });

    if (!ammoItem || ammoItem.quantity <= 0) return;

    player.reloading = true;
    let reloadTime = player.weapon.reloadTime;
    if (player.perks.quickHands) {
        reloadTime *= 0.85;  // 15% faster reload
    }
    player.reloadTimer = reloadTime;
}

function finishReload() {
    const ammoItem = player.inventory.find(item => {
        if (player.weapon.category === 'pistol' || player.weapon.category === 'smg') {
            return item.id === 'ammo_9mm' || item.name === '9mm Ammo';
        }
        if (player.weapon.category === 'rifle' || player.weapon.category === 'dmr' || player.weapon.category === 'sniper') {
            return item.id === 'ammo_762' || item.name === '7.62 Ammo';
        }
        if (player.weapon.category === 'shotgun') {
            return item.id === 'ammo_12g' || item.name === '12 Gauge';
        }
        return false;
    });

    if (!ammoItem) {
        player.reloading = false;
        return;
    }

    const needed = player.weapon.magSize - player.currentAmmo;
    const toLoad = Math.min(needed, ammoItem.quantity);
    player.currentAmmo += toLoad;
    ammoItem.quantity -= toLoad;

    if (ammoItem.quantity <= 0) {
        player.inventory = player.inventory.filter(i => i !== ammoItem);
    }

    player.reloading = false;
}

function interactWithContainer() {
    for (const container of lootContainers) {
        if (container.searched) continue;

        const dist = distance(player.x, player.y, container.x, container.y);
        if (dist < 40) {
            container.searched = true;

            // Drop loot on ground
            for (const item of container.loot) {
                loot.push({
                    x: container.x + Math.random() * 30 - 15,
                    y: container.y + Math.random() * 30 - 15,
                    id: item.id,
                    quantity: item.quantity
                });
            }
            break;
        }
    }
}

function pickupLoot() {
    for (let i = loot.length - 1; i >= 0; i--) {
        const item = loot[i];
        const dist = distance(player.x, player.y, item.x, item.y);

        if (dist < 30) {
            const itemData = ItemData[item.id];
            if (!itemData) continue;

            // Calculate value
            if (item.id === 'rubles') {
                player.rubles += item.quantity;
                player.lootValue += item.quantity;
            } else {
                // Add to inventory
                const existing = player.inventory.find(i => i.id === item.id || i.name === itemData.name);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    player.inventory.push({ ...itemData, id: item.id, quantity: item.quantity });
                }
                player.lootValue += (itemData.value || 10) * item.quantity;
            }

            loot.splice(i, 1);
        }
    }
}

function useItem(itemId) {
    const item = player.inventory.find(i => i.id === itemId || i.name === ItemData[itemId]?.name);
    if (!item || item.quantity <= 0) return;

    const data = ItemData[itemId];
    if (!data) return;

    let used = false;

    if (data.healAmount && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + data.healAmount);
        used = true;
    }

    if (data.curesBleed && player.bleeding) {
        player.bleeding = false;
        used = true;
    }

    if (data.curesHeavyBleed && player.heavyBleeding) {
        player.heavyBleeding = false;
        used = true;
    }

    if (data.curesFracture && player.fracture) {
        player.fracture = false;
        used = true;
    }

    if (data.painRelief && player.pain > 0) {
        player.pain = Math.max(0, player.pain - data.painRelief);
        used = true;
    }

    if (data.radHeal && player.radiation > 0) {
        player.radiation = Math.max(0, player.radiation - data.radHeal);
        used = true;
    }

    if (used) {
        item.quantity--;
        if (item.quantity <= 0) {
            player.inventory = player.inventory.filter(i => i !== item);
        }
    }
}

function calculateWeight() {
    let weight = 0;
    for (const item of player.inventory) {
        const data = ItemData[item.id] || item;
        weight += (data.weight || 0.1) * (item.quantity || 1);
    }
    if (player.weapon) weight += 1.5;
    if (player.secondaryWeapon) weight += 2.0;
    return weight;
}

function getSpeedMultiplierFromWeight() {
    const weight = calculateWeight();
    const ratio = weight / player.maxWeight;
    if (ratio <= 1.0) return 1.0;
    if (ratio >= 2.0) return 0.1;
    return 1.0 - ((ratio - 1.0) * 0.5);
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.health <= 0) continue;

        // Stagger recovery
        if (enemy.staggered) {
            enemy.staggerTimer -= dt;
            if (enemy.staggerTimer <= 0) {
                enemy.staggered = false;
            }
            continue;
        }

        const distToPlayer = distance(enemy.x, enemy.y, player.x, player.y);
        const canSee = checkLineOfSight(enemy, player) && distToPlayer < enemy.visionRange;

        // State machine
        switch (enemy.state) {
            case 'patrol':
                if (canSee) {
                    enemy.state = 'combat';
                    enemy.lastSeen = { x: player.x, y: player.y };
                } else {
                    // Move toward patrol target
                    const patrolDist = distance(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                    if (patrolDist < 20) {
                        enemy.patrolTarget = {
                            x: enemy.x + Math.random() * 200 - 100,
                            y: enemy.y + Math.random() * 200 - 100
                        };
                        enemy.patrolTarget.x = Math.max(50, Math.min(zone.width - 50, enemy.patrolTarget.x));
                        enemy.patrolTarget.y = Math.max(50, Math.min(zone.height - 50, enemy.patrolTarget.y));
                    }
                    moveToward(enemy, enemy.patrolTarget, dt, 0.5);
                }
                break;

            case 'alert':
                enemy.alertTimer += dt;
                if (canSee) {
                    enemy.state = 'combat';
                    enemy.lastSeen = { x: player.x, y: player.y };
                } else if (enemy.lastSeen) {
                    moveToward(enemy, enemy.lastSeen, dt, 0.7);
                    if (distance(enemy.x, enemy.y, enemy.lastSeen.x, enemy.lastSeen.y) < 30) {
                        enemy.state = 'patrol';
                        enemy.lastSeen = null;
                    }
                }
                if (enemy.alertTimer > 10) {
                    enemy.state = 'patrol';
                    enemy.alertTimer = 0;
                }
                break;

            case 'combat':
                // Check for flee condition (low HP)
                if (enemy.health < enemy.maxHealth * 0.25 && enemy.type !== 'ghoul') {
                    enemy.state = 'flee';
                    enemy.fleeTimer = 3 + Math.random() * 2;
                    break;
                }

                if (!canSee && enemy.lastSeen) {
                    enemy.state = 'alert';
                    enemy.alertTimer = 0;
                } else if (canSee) {
                    enemy.lastSeen = { x: player.x, y: player.y };
                    enemy.angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

                    if (distToPlayer > enemy.attackRange) {
                        moveToward(enemy, player, dt, 1);
                    } else {
                        // Attack
                        enemy.attackCooldown -= dt;
                        if (enemy.attackCooldown <= 0) {
                            enemyAttack(enemy);
                            enemy.attackCooldown = enemy.weapon === 'melee' ? 0.8 : 1.5;
                        }
                    }
                }
                break;

            case 'flee':
                // Run away from player
                const fleeAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                const fleeTarget = {
                    x: enemy.x + Math.cos(fleeAngle) * 200,
                    y: enemy.y + Math.sin(fleeAngle) * 200
                };
                moveToward(enemy, fleeTarget, dt, 1.3);
                enemy.fleeTimer -= dt;
                if (enemy.fleeTimer <= 0) {
                    enemy.state = 'patrol';
                }
                break;
        }

        // Keep in bounds
        enemy.x = Math.max(20, Math.min(zone.width - 20, enemy.x));
        enemy.y = Math.max(20, Math.min(zone.height - 20, enemy.y));
    }
}

function moveToward(entity, target, dt, speedMult = 1) {
    const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
    const speed = entity.speed * speedMult;

    const newX = entity.x + Math.cos(angle) * speed * dt;
    const newY = entity.y + Math.sin(angle) * speed * dt;

    if (!checkCollision(newX, entity.y, entity.width, entity.height)) {
        entity.x = newX;
    }
    if (!checkCollision(entity.x, newY, entity.width, entity.height)) {
        entity.y = newY;
    }

    entity.angle = angle;
}

function enemyAttack(enemy) {
    if (enemy.weapon === 'melee') {
        // Melee attack
        const dist = distance(enemy.x, enemy.y, player.x, player.y);
        if (dist < enemy.attackRange + 20) {
            if (!player.dodging) {
                damagePlayer(enemy.damage);
            }
        }
    } else {
        // Ranged attack
        const spread = enemy.weapon === 'shotgun' ? 20 : 10;
        const pellets = enemy.weapon === 'shotgun' ? 5 : 1;

        for (let i = 0; i < pellets; i++) {
            const angle = enemy.angle + (Math.random() - 0.5) * spread * (Math.PI / 180);
            bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * Config.BULLET_SPEED * 0.7,
                vy: Math.sin(angle) * Config.BULLET_SPEED * 0.7,
                damage: enemy.damage,
                range: enemy.attackRange,
                traveled: 0,
                fromPlayer: false
            });
        }

        spawnParticles(
            enemy.x + Math.cos(enemy.angle) * 12,
            enemy.y + Math.sin(enemy.angle) * 12,
            '#ff8800', 3
        );
    }
}

function damagePlayer(amount) {
    const effectiveArmor = player.armor * 0.5;
    let damage = Math.floor(amount * (1 - effectiveArmor / 100));

    // Apply ironSkin perk
    if (player.perks.ironSkin) {
        damage = Math.floor(damage * 0.9);
    }

    player.health -= damage;

    // Chance to bleed (regular or heavy)
    if (Math.random() < 0.3) {
        if (damage > 30 && Math.random() < 0.4) {
            player.heavyBleeding = true;  // Heavy bleeding from big hits
        } else {
            player.bleeding = true;
        }
    }

    // Chance for fracture from big hits
    if (damage > 40 && Math.random() < 0.25) {
        player.fracture = true;
    }

    // Pain accumulation
    player.pain = Math.min(100, player.pain + damage);

    // Screen shake proportional to damage
    shakeCamera(damage * 0.3);

    // Blood decal
    bloodDecals.push({
        x: player.x + (Math.random() - 0.5) * 20,
        y: player.y + (Math.random() - 0.5) * 20,
        size: 5 + Math.random() * 10,
        alpha: 0.8
    });

    // Damage indicator
    spawnParticles(player.x, player.y, '#ff0000', 8);
    damageNumbers.push({
        x: player.x, y: player.y - 20,
        value: damage,
        timer: 1,
        color: '#ff0000'
    });
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;

        // Check range
        if (bullet.traveled > bullet.range * 3) {
            bullets.splice(i, 1);
            continue;
        }

        // Check wall collision
        if (checkCollision(bullet.x, bullet.y, 2, 2)) {
            bullets.splice(i, 1);
            spawnParticles(bullet.x, bullet.y, '#888', 3);
            continue;
        }

        // Check out of bounds
        if (bullet.x < 0 || bullet.x > zone.width || bullet.y < 0 || bullet.y > zone.height) {
            bullets.splice(i, 1);
            continue;
        }

        if (bullet.fromPlayer) {
            // Check enemy hits
            for (const enemy of enemies) {
                if (enemy.health <= 0) continue;

                if (bullet.x > enemy.x - enemy.width/2 && bullet.x < enemy.x + enemy.width/2 &&
                    bullet.y > enemy.y - enemy.height/2 && bullet.y < enemy.y + enemy.height/2) {

                    // Damage calculation with armor
                    const armorReduction = enemy.armor * (1 - (bullet.penetration || 0) / 100);
                    const damage = Math.floor(bullet.damage * (1 - armorReduction / 100));
                    enemy.health -= damage;

                    // Stagger
                    enemy.staggered = true;
                    enemy.staggerTimer = 0.2;

                    // Blood splatter
                    bloodDecals.push({
                        x: bullet.x + (Math.random() - 0.5) * 10,
                        y: bullet.y + (Math.random() - 0.5) * 10,
                        size: 3 + Math.random() * 6,
                        alpha: 0.7
                    });

                    spawnParticles(bullet.x, bullet.y, '#ff0000', 5);
                    damageNumbers.push({
                        x: enemy.x, y: enemy.y - 15,
                        value: damage,
                        timer: 0.8,
                        color: '#ffff00'
                    });

                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }

                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Check player hit
            if (!player.dodging &&
                bullet.x > player.x - player.width/2 && bullet.x < player.x + player.width/2 &&
                bullet.y > player.y - player.height/2 && bullet.y < player.y + player.height/2) {

                damagePlayer(bullet.damage);
                bullets.splice(i, 1);
            }
        }
    }
}

function killEnemy(enemy) {
    player.kills++;

    // Grant XP
    const xp = getXPForEnemy(enemy.type);
    gainXP(xp);

    // Blood pool
    bloodDecals.push({
        x: enemy.x,
        y: enemy.y,
        size: 15 + Math.random() * 20,
        alpha: 0.9
    });

    // Drop loot
    const lootDrops = [];
    if (enemy.type === 'bandit' || enemy.type === 'bandit_heavy') {
        if (Math.random() < 0.5) lootDrops.push({ id: 'rubles', quantity: Math.floor(Math.random() * 100) + 50 });
        if (Math.random() < 0.3) lootDrops.push({ id: 'ammo_9mm', quantity: Math.floor(Math.random() * 15) + 5 });
        if (Math.random() < 0.2) lootDrops.push({ id: 'bandage', quantity: 1 });
        // Chance to drop weapon (higher chance for heavy bandits)
        const dropChance = enemy.type === 'bandit_heavy' ? 0.25 : 0.15;
        if (Math.random() < dropChance && !player.secondaryWeapon) {
            const weapons = enemy.type === 'bandit_heavy' ?
                ['ak74', 'sks', 'mosin'] :  // Heavy bandits drop better weapons
                ['skorpion', 'pump_shotgun', 'ak74'];
            const wpn = weapons[Math.floor(Math.random() * weapons.length)];
            player.secondaryWeapon = { ...WeaponData[wpn], durability: 60 + Math.random() * 30, jammed: false };
            player.secondaryAmmo = Math.floor(player.secondaryWeapon.magSize * 0.5);
        }
    } else if (enemy.type === 'ghoul') {
        if (Math.random() < 0.3) lootDrops.push({ id: 'scrap', quantity: Math.floor(Math.random() * 2) + 1 });
    } else if (enemy.type === 'wolf') {
        if (Math.random() < 0.6) lootDrops.push({ id: 'food', quantity: 1 });
    }

    for (const drop of lootDrops) {
        loot.push({
            x: enemy.x + Math.random() * 20 - 10,
            y: enemy.y + Math.random() * 20 - 10,
            id: drop.id,
            quantity: drop.quantity
        });
    }
}

function checkLineOfSight(from, to) {
    const steps = Math.ceil(distance(from.x, from.y, to.x, to.y) / 20);
    const dx = (to.x - from.x) / steps;
    const dy = (to.y - from.y) / steps;

    for (let i = 0; i < steps; i++) {
        const x = from.x + dx * i;
        const y = from.y + dy * i;
        if (checkCollision(x, y, 2, 2)) return false;
    }
    return true;
}

function checkCollision(x, y, w, h) {
    for (const wall of walls) {
        if (x + w/2 > wall.x && x - w/2 < wall.x + wall.width &&
            y + h/2 > wall.y && y - h/2 < wall.y + wall.height) {
            return true;
        }
    }
    return false;
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            color,
            size: 2 + Math.random() * 3,
            life: 0.3 + Math.random() * 0.3
        });
    }
}

function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y -= 30 * dt;
        dn.timer -= dt;
        if (dn.timer <= 0) damageNumbers.splice(i, 1);
    }
}

function updateCamera() {
    camera.x = player.x - WIDTH / 2;
    camera.y = player.y - HEIGHT / 2;
    camera.x = Math.max(0, Math.min(zone.width - WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(zone.height - HEIGHT, camera.y));

    // Screen shake
    if (camera.shake > 0) {
        camera.shakeX = (Math.random() - 0.5) * camera.shake;
        camera.shakeY = (Math.random() - 0.5) * camera.shake;
        camera.shake *= 0.85;
        if (camera.shake < 0.5) camera.shake = 0;
    } else {
        camera.shakeX = 0;
        camera.shakeY = 0;
    }
}

function updateFogOfWar() {
    const fogX = Math.floor(player.x / Config.FOG_REVEAL_RADIUS);
    const fogY = Math.floor(player.y / Config.FOG_REVEAL_RADIUS);

    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const fx = fogX + dx;
            const fy = fogY + dy;
            if (fx >= 0 && fx < zone.explored[0].length && fy >= 0 && fy < zone.explored.length) {
                zone.explored[fy][fx] = true;
            }
        }
    }
}

function checkExtraction(dt) {
    for (const ep of extractionPoints) {
        const dist = distance(player.x, player.y, ep.x, ep.y);
        if (dist < ep.radius) {
            if (!extracting || extractPoint !== ep) {
                extracting = true;
                extractTimer = 0;
                extractPoint = ep;
            }

            extractTimer += dt;
            if (extractTimer >= Config.EXTRACT_TIME) {
                currentState = GameState.EXTRACTED;
            }
            return;
        }
    }
    extracting = false;
    extractTimer = 0;
    extractPoint = null;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

// ===================== RENDER FUNCTIONS =====================
function render() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    switch (currentState) {
        case GameState.MENU:
            renderMenu();
            break;
        case GameState.IN_RAID:
        case GameState.INVENTORY:
            renderRaid();
            if (currentState === GameState.INVENTORY) renderInventory();
            break;
        case GameState.DEAD:
            renderRaid();
            renderDeath();
            break;
        case GameState.EXTRACTED:
            renderExtracted();
            break;
    }
}

function renderMenu() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#4a4';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ZERO SIEVERT', WIDTH/2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '24px Courier New';
    ctx.fillText('Extraction Shooter', WIDTH/2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Courier New';
    ctx.fillText('Click or Press SPACE to Start Raid', WIDTH/2, 400);

    ctx.fillStyle = '#666';
    ctx.font = '14px Courier New';
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Shoot | RMB: ADS', WIDTH/2, 460);
    ctx.fillText('R: Reload | E: Loot | Tab: Inventory | Shift: Sprint | Space: Dodge', WIDTH/2, 480);
    ctx.fillText('1: Bandage | 2: Medkit | 3: Painkillers | 4: Anti-Rad | 5: Splint', WIDTH/2, 500);
    ctx.fillText('Q: Swap Weapon | Kill enemies to gain XP and unlock perks!', WIDTH/2, 520);
}

function renderRaid() {
    ctx.save();
    ctx.translate(-camera.x + camera.shakeX, -camera.y + camera.shakeY);

    // Ground
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(0, 0, zone.width, zone.height);

    // Blood decals (persistent)
    for (const blood of bloodDecals) {
        ctx.fillStyle = `rgba(100, 20, 20, ${blood.alpha})`;
        ctx.beginPath();
        ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Grid pattern
    ctx.strokeStyle = '#264426';
    ctx.lineWidth = 1;
    for (let x = 0; x < zone.width; x += Config.TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, zone.height);
        ctx.stroke();
    }
    for (let y = 0; y < zone.height; y += Config.TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(zone.width, y);
        ctx.stroke();
    }

    // Radiation zones
    for (const radZone of radiationZones) {
        const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
        const gradient = ctx.createRadialGradient(
            radZone.x, radZone.y, 0,
            radZone.x, radZone.y, radZone.radius
        );
        gradient.addColorStop(0, `rgba(50, 255, 50, ${0.3 * pulse})`);
        gradient.addColorStop(0.7, `rgba(50, 255, 50, ${0.15 * pulse})`);
        gradient.addColorStop(1, 'rgba(50, 255, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(radZone.x, radZone.y, radZone.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Extraction points
    for (const ep of extractionPoints) {
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 100, ${0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(0, 255, 100, ${0.8 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#0f0';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACT', ep.x, ep.y);
    }

    // Walls/buildings
    for (const wall of walls) {
        ctx.fillStyle = '#444';
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Loot containers
    for (const container of lootContainers) {
        if (container.searched) {
            ctx.fillStyle = '#333';
        } else {
            ctx.fillStyle = container.type === 'safe' ? '#886622' :
                           container.type === 'medical_box' ? '#448844' :
                           container.type === 'weapon_box' ? '#664422' : '#554422';
        }
        ctx.fillRect(container.x - container.width/2, container.y - container.height/2,
                     container.width, container.height);

        if (!container.searched) {
            ctx.strokeStyle = '#aa8844';
            ctx.lineWidth = 2;
            ctx.strokeRect(container.x - container.width/2, container.y - container.height/2,
                          container.width, container.height);
        }
    }

    // Loot on ground
    for (const item of loot) {
        const itemData = ItemData[item.id];
        ctx.fillStyle = itemData?.type === 'currency' ? '#ffd700' :
                       itemData?.type === 'medical' ? '#44ff44' :
                       itemData?.type === 'ammo' ? '#ffaa00' : '#aaaaaa';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.health <= 0) {
            // Dead enemy
            ctx.fillStyle = '#442222';
            ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);
            continue;
        }

        // Body
        ctx.fillStyle = enemy.type === 'ghoul' ? '#558844' :
                       enemy.type === 'wolf' ? '#665544' :
                       enemy.type === 'bandit_heavy' ? '#664444' : '#884444';
        ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);

        // Direction indicator
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + Math.cos(enemy.angle) * 15, enemy.y + Math.sin(enemy.angle) * 15);
        ctx.stroke();

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 12, enemy.y - enemy.height/2 - 8, 24, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : healthPercent > 0.25 ? '#aa4' : '#a44';
        ctx.fillRect(enemy.x - 12, enemy.y - enemy.height/2 - 8, 24 * healthPercent, 4);

        // State indicator
        ctx.fillStyle = enemy.state === 'combat' ? '#ff0000' :
                       enemy.state === 'flee' ? '#ff00ff' :
                       enemy.state === 'alert' ? '#ffaa00' : '#00aa00';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - enemy.height/2 - 12, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bullets
    ctx.fillStyle = '#ffff00';
    for (const bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);

    // Dodge trail effect
    if (player.dodging) {
        ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
        ctx.fillRect(-player.width/2 - 5, -player.height/2 - 5, player.width + 10, player.height + 10);
    }

    // Body
    ctx.fillStyle = player.bleeding ? '#aa6666' : '#66aa66';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);

    // Direction indicator (gun)
    ctx.rotate(player.angle);
    ctx.fillStyle = '#888';
    ctx.fillRect(5, -2, 15, 4);

    ctx.restore();

    // Damage numbers
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    for (const dn of damageNumbers) {
        ctx.fillStyle = dn.color;
        ctx.globalAlpha = dn.timer;
        ctx.fillText(dn.value, dn.x, dn.y);
    }
    ctx.globalAlpha = 1;

    // Fog of war
    renderFogOfWar();

    ctx.restore();

    // HUD
    renderHUD();
}

function renderFogOfWar() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    for (let fy = 0; fy < zone.explored.length; fy++) {
        for (let fx = 0; fx < zone.explored[fy].length; fx++) {
            if (!zone.explored[fy][fx]) {
                ctx.fillRect(
                    fx * Config.FOG_REVEAL_RADIUS,
                    fy * Config.FOG_REVEAL_RADIUS,
                    Config.FOG_REVEAL_RADIUS,
                    Config.FOG_REVEAL_RADIUS
                );
            }
        }
    }

    // Darken areas far from player
    const gradient = ctx.createRadialGradient(
        player.x, player.y, Config.VISION_RANGE * 0.6,
        player.x, player.y, Config.VISION_RANGE
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(camera.x, camera.y, WIDTH, HEIGHT);
}

function renderHUD() {
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : healthPercent > 0.25 ? '#aa4' : '#a44';
    ctx.fillRect(10, 10, 200 * healthPercent, 20);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(10, 10, 200, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.health)}/${player.maxHealth}`, 15, 25);

    // Stamina bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 200, 10);
    ctx.fillStyle = '#4488aa';
    ctx.fillRect(10, 35, 200 * (player.stamina / player.maxStamina), 10);

    // Status effects
    let statusY = 50;
    if (player.bleeding) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('BLEEDING', 10, statusY);
        statusY += 15;
    }
    if (player.radiation > 0) {
        ctx.fillStyle = '#44ff44';
        ctx.fillText(`RAD: ${player.radiation}`, 10, statusY);
        statusY += 15;
    }

    // Weapon info
    if (player.weapon) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(player.weapon.name, WIDTH - 10, 20);

        ctx.fillStyle = player.currentAmmo <= 0 ? '#ff4444' : '#aaa';
        ctx.fillText(`${player.currentAmmo} / ${player.weapon.magSize}`, WIDTH - 10, 38);

        if (player.reloading) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('RELOADING...', WIDTH - 10, 55);
        }

        // Secondary weapon indicator
        if (player.secondaryWeapon) {
            ctx.fillStyle = '#666';
            ctx.font = '11px Courier New';
            ctx.fillText(`[Q] ${player.secondaryWeapon.name}`, WIDTH - 10, 70);
        }
    }

    // Extraction indicator
    if (extracting) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACTING...', WIDTH/2, 50);

        ctx.fillStyle = '#333';
        ctx.fillRect(WIDTH/2 - 100, 60, 200, 15);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(WIDTH/2 - 100, 60, 200 * (extractTimer / Config.EXTRACT_TIME), 15);
    }

    // Minimap
    renderMinimap();

    // Stats
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Kills: ${player.kills}`, 10, HEIGHT - 70);
    ctx.fillText(`Loot: ${player.lootValue}₽`, 10, HEIGHT - 55);
    ctx.fillText(`Rubles: ${player.rubles}₽`, 10, HEIGHT - 40);

    // XP and Level
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Lv.${player.level} (${player.xp}/${player.totalXPForNextLevel} XP)`, 10, HEIGHT - 25);

    // Weight indicator
    const weight = calculateWeight();
    const weightColor = weight > player.maxWeight ? '#ff4444' : weight > player.maxWeight * 0.8 ? '#ffaa00' : '#888';
    ctx.fillStyle = weightColor;
    ctx.fillText(`Weight: ${weight.toFixed(1)}/${player.maxWeight}kg`, 10, HEIGHT - 10);

    // Status effects (right side)
    statusY = HEIGHT - 70;
    ctx.textAlign = 'right';
    if (player.heavyBleeding) {
        ctx.fillStyle = '#cc0000';
        ctx.fillText('HEAVY BLEEDING', WIDTH - 10, statusY);
        statusY += 15;
    } else if (player.bleeding) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('BLEEDING', WIDTH - 10, statusY);
        statusY += 15;
    }
    if (player.fracture) {
        ctx.fillStyle = '#ff8800';
        ctx.fillText('FRACTURE', WIDTH - 10, statusY);
        statusY += 15;
    }
    if (player.pain > 50) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`PAIN (${Math.floor(player.pain)}%)`, WIDTH - 10, statusY);
        statusY += 15;
    }
    ctx.textAlign = 'left';

    // Compass / Direction to nearest extract
    let nearestExtract = null;
    let nearestDist = Infinity;
    for (const ep of extractionPoints) {
        const dist = distance(player.x, player.y, ep.x, ep.y);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestExtract = ep;
        }
    }
    if (nearestExtract) {
        const angle = Math.atan2(nearestExtract.y - player.y, nearestExtract.x - player.x);
        const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
        const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
        const dir = directions[index];

        ctx.fillStyle = '#4a4';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Extract: ${Math.round(nearestDist)}px ${dir}`, WIDTH / 2, HEIGHT - 10);
    }

    // Dodge cooldown
    if (player.dodgeCooldown > 0) {
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText(`Dodge: ${player.dodgeCooldown.toFixed(1)}s`, WIDTH - 10, HEIGHT - 10);
    } else {
        ctx.fillStyle = '#4a4';
        ctx.fillText('Dodge Ready', WIDTH - 10, HEIGHT - 10);
    }
}

function renderMinimap() {
    const mapSize = 120;
    const mapX = WIDTH - mapSize - 10;
    const mapY = HEIGHT - mapSize - 10;
    const scale = mapSize / Math.max(zone.width, zone.height);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Walls
    ctx.fillStyle = '#444';
    for (const wall of walls) {
        ctx.fillRect(
            mapX + wall.x * scale,
            mapY + wall.y * scale,
            wall.width * scale,
            wall.height * scale
        );
    }

    // Extraction points
    ctx.fillStyle = '#0f0';
    for (const ep of extractionPoints) {
        ctx.beginPath();
        ctx.arc(mapX + ep.x * scale, mapY + ep.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies (only visible ones)
    ctx.fillStyle = '#f00';
    for (const enemy of enemies) {
        if (enemy.health <= 0) continue;
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < Config.VISION_RANGE) {
            ctx.beginPath();
            ctx.arc(mapX + enemy.x * scale, mapY + enemy.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Player
    ctx.fillStyle = '#4f4';
    ctx.beginPath();
    ctx.arc(mapX + player.x * scale, mapY + player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
}

function renderInventory() {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', WIDTH/2, 50);

    ctx.font = '14px Courier New';
    ctx.textAlign = 'left';

    let y = 100;
    for (const item of player.inventory) {
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${item.name || item.id}: ${item.quantity}`, 50, y);
        y += 25;
    }

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB to close', WIDTH/2, HEIGHT - 30);
}

function renderDeath() {
    ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', WIDTH/2, HEIGHT/2 - 50);

    ctx.fillStyle = '#aaa';
    ctx.font = '20px Courier New';
    ctx.fillText(`Kills: ${player.kills}`, WIDTH/2, HEIGHT/2 + 20);
    ctx.fillText(`Loot Lost: ${player.lootValue}₽`, WIDTH/2, HEIGHT/2 + 50);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.fillText('Click or Press SPACE to return to menu', WIDTH/2, HEIGHT/2 + 120);
}

function renderExtracted() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', WIDTH/2, HEIGHT/2 - 80);

    ctx.fillStyle = '#aaa';
    ctx.font = '20px Courier New';
    ctx.fillText(`Kills: ${player.kills}`, WIDTH/2, HEIGHT/2);
    ctx.fillText(`Loot Extracted: ${player.lootValue}₽`, WIDTH/2, HEIGHT/2 + 35);
    ctx.fillText(`Total Rubles: ${player.rubles}₽`, WIDTH/2, HEIGHT/2 + 70);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.fillText('Click or Press SPACE to continue', WIDTH/2, HEIGHT/2 + 140);
}

// ===================== GAME LOOP =====================
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start game
requestAnimationFrame(gameLoop);
