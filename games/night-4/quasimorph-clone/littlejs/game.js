// Quasimorph Clone - Turn-based Tactical Roguelike
// LittleJS Implementation

'use strict';

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

// Tile Types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    COVER_HALF: 3,
    COVER_FULL: 4,
    EXTRACTION: 5,
    VENT: 6
};

// Game State
let gameState = 'menu';
let playerTurn = true;
let corruption = 0;
let turnCount = 0;
let messageText = '';
let messageTimer = 0;
let killCount = 0;
let screenShake = 0;
let floatingTexts = [];
let muzzleFlash = null;
let bloodSplatters = [];

// New systems
let overwatchMode = false;
let overwatchTarget = null;
let playerXP = 0;
let playerLevel = 1;
let criticalMultiplier = 1.5;
let playerStatusEffects = [];
let smokeClouds = [];
let corpses = [];
let lockedDoors = [];
let terminals = [];
let missionType = 'extraction';
let missionObjective = null;
let bossSpawned = false;

// Player
let player = {
    x: 5,
    y: 5,
    hp: 100,
    maxHp: 100,
    ap: 3,
    maxAp: 3,
    ammo: 20,
    maxAmmo: 20,
    weapon: 'rifle',
    weaponSlot: 0,
    weapons: ['rifle', 'pistol'],
    stance: 'walk',
    stanceIndex: 1,
    // New stats
    armor: 0,
    xp: 0,
    level: 1,
    mercenaryType: 'grunt',
    classType: 'assault',
    statusEffects: [],
    kills: 0,
    missions: 0,
    credits: 0,
    skills: { pistol: 1, smg: 0, rifle: 1, shotgun: 0, heavy: 0, melee: 0, explosives: 0, medical: 0 },
    overwatch: false,
    overwatchDir: null
};

// Stances
const STANCES = {
    sneak: { name: 'Sneak', ap: 1, detectMod: 0.5 },
    walk: { name: 'Walk', ap: 2, detectMod: 1.0 },
    run: { name: 'Run', ap: 3, detectMod: 1.5 }
};
const STANCE_ORDER = ['sneak', 'walk', 'run'];

// Enemies array
let enemies = [];

// Map
let map = [];
let fogOfWar = [];
let visibleTiles = [];

// Items
let items = [];

// Item types
const ITEM_TYPES = {
    medkit: { name: 'Medkit', color: new Color(0.2, 0.8, 0.2), heal: 30 },
    stim: { name: 'Stim Pack', color: new Color(0.2, 0.6, 0.9), apBoost: 1 },
    ammo: { name: 'Ammo', color: new Color(0.8, 0.7, 0.2), ammo: 15 },
    grenade: { name: 'Frag Grenade', color: new Color(0.8, 0.3, 0.2), damage: 40, radius: 2 },
    alcohol: { name: 'Alcohol', color: new Color(0.6, 0.4, 0.2), corruptionReduce: 50 },
    keycard: { name: 'Keycard', color: new Color(0.9, 0.9, 0.3), key: true },
    bandage: { name: 'Bandage', color: new Color(0.9, 0.9, 0.9), heal: 15, stopBleed: true },
    surgeryKit: { name: 'Surgery Kit', color: new Color(0.4, 0.8, 0.9), healWound: true },
    painkillers: { name: 'Painkillers', color: new Color(0.9, 0.5, 0.5), ignorePenalty: 5 },
    flashbang: { name: 'Flashbang', color: new Color(1, 1, 0.8), stunDuration: 2, radius: 3 },
    smokeGrenade: { name: 'Smoke Grenade', color: new Color(0.7, 0.7, 0.7), smokeDuration: 3, radius: 2 },
    armorPlate: { name: 'Armor Plate', color: new Color(0.4, 0.4, 0.5), armor: 15 }
};

// Clone/mercenary types
const MERCENARY_TYPES = {
    grunt: { name: 'Grunt', hp: 100, accuracy: 0, inventorySlots: 8 },
    veteran: { name: 'Veteran', hp: 100, accuracy: 10, inventorySlots: 8 },
    scrounger: { name: 'Scrounger', hp: 90, accuracy: 0, inventorySlots: 10 },
    medic: { name: 'Medic', hp: 100, accuracy: 0, inventorySlots: 8, healBonus: 20 },
    demoExpert: { name: 'Demo Expert', hp: 110, accuracy: -5, inventorySlots: 8, explosiveBonus: 25 },
    ghost: { name: 'Ghost', hp: 80, accuracy: 5, inventorySlots: 8, sneakBonus: true }
};

// Class definitions
const CLASSES = {
    assault: { name: 'Assault', perks: ['fireTransfer', 'suppression', 'armorDurability'] },
    scout: { name: 'Scout', perks: ['quickDraw', 'dodge', 'lootSense'] },
    marksman: { name: 'Marksman', perks: ['deadEye', 'cripplingShot', 'overwatch'] },
    heavy: { name: 'Heavy', perks: ['suppressingFire', 'thickSkin', 'ammoBelt'] },
    infiltrator: { name: 'Infiltrator', perks: ['silentKill', 'hacking', 'poisonBlade'] },
    pyro: { name: 'Pyro', perks: ['burnBabyBurn', 'fireproof', 'scorchedEarth'] }
};

// Status effects
const STATUS_EFFECTS = {
    bleeding: { name: 'Bleeding', damagePerTurn: 2, color: new Color(0.8, 0.2, 0.2) },
    poisoned: { name: 'Poisoned', damagePerTurn: 3, color: new Color(0.3, 0.8, 0.3) },
    stunned: { name: 'Stunned', skipTurn: true, color: new Color(1, 1, 0.5) },
    burning: { name: 'Burning', damagePerTurn: 4, color: new Color(1, 0.5, 0.1) },
    slowed: { name: 'Slowed', apReduction: 1, color: new Color(0.5, 0.5, 0.8) }
};

// Inventory (simplified)
let inventory = {
    medkits: 0,
    stims: 0,
    grenades: 0,
    keycards: 0,
    bandages: 0,
    surgeryKits: 0,
    painkillers: 0,
    flashbangs: 0,
    smokeGrenades: 0,
    armorPlates: 0
};

// Weapons config
const WEAPONS = {
    pistol: { name: 'Pistol', damage: [15, 20], range: 6, apCost: 1, accuracy: 75, ammo: 12 },
    smg: { name: 'SMG', damage: [10, 15], range: 5, apCost: 1, accuracy: 60, ammo: 30 },
    rifle: { name: 'Combat Rifle', damage: [30, 40], range: 10, apCost: 2, accuracy: 70, ammo: 20 },
    shotgun: { name: 'Shotgun', damage: [35, 50], range: 3, apCost: 2, accuracy: 80, ammo: 8 },
    sniper: { name: 'Sniper Rifle', damage: [50, 70], range: 15, apCost: 2, accuracy: 85, ammo: 5 },
    machinegun: { name: 'Machine Gun', damage: [15, 25], range: 7, apCost: 2, accuracy: 50, ammo: 50 },
    flamethrower: { name: 'Flamethrower', damage: [10, 15], range: 3, apCost: 1, accuracy: 95, ammo: 30 }
};

// Enemy types
const ENEMY_TYPES = {
    guard: { name: 'Guard', hp: 50, ap: 2, damage: [10, 15], range: 5, color: new Color(0.8, 0.2, 0.2) },
    soldier: { name: 'Soldier', hp: 75, ap: 2, damage: [15, 20], range: 6, color: new Color(0.9, 0.3, 0.1) },
    sniper: { name: 'Sniper', hp: 40, ap: 2, damage: [25, 35], range: 12, color: new Color(0.6, 0.4, 0.2), longRange: true },
    officer: { name: 'Officer', hp: 60, ap: 3, damage: [12, 18], range: 5, color: new Color(0.9, 0.7, 0.2), buffsAllies: true },
    possessed: { name: 'Possessed', hp: 80, ap: 3, damage: [20, 30], range: 1, color: new Color(0.3, 0.8, 0.2) },
    heavy: { name: 'Heavy', hp: 120, ap: 2, damage: [25, 35], range: 3, color: new Color(0.5, 0.2, 0.2) },
    bloater: { name: 'Bloater', hp: 150, ap: 1, damage: [40, 60], range: 1, color: new Color(0.5, 0.6, 0.2), explodes: true },
    stalker: { name: 'Stalker', hp: 60, ap: 4, damage: [15, 25], range: 1, color: new Color(0.4, 0.3, 0.5), ambush: true, poisonAttack: true },
    screamer: { name: 'Screamer', hp: 40, ap: 2, damage: [5, 10], range: 4, color: new Color(0.8, 0.5, 0.8), stun: true, alertsAll: true },
    brute: { name: 'Brute', hp: 200, ap: 2, damage: [30, 45], range: 1, color: new Color(0.6, 0.3, 0.3), destroysCover: true },
    phaseWalker: { name: 'Phase Walker', hp: 100, ap: 3, damage: [25, 35], range: 2, color: new Color(0.3, 0.8, 0.8), teleport: true },
    fleshweaver: { name: 'Fleshweaver', hp: 80, ap: 2, damage: [15, 20], range: 3, color: new Color(0.7, 0.3, 0.4), healsFromCorpses: true },
    voidSentry: { name: 'Void Sentry', hp: 150, ap: 2, damage: [20, 30], range: 8, color: new Color(0.3, 0.2, 0.5), armored: true },
    baron: { name: 'The Baron', hp: 500, ap: 4, damage: [35, 50], range: 3, color: new Color(0.9, 0.1, 0.1), boss: true, multiAttack: true }
};

// Colors
const COLORS = {
    floor: new Color(0.15, 0.15, 0.2),
    wall: new Color(0.3, 0.3, 0.35),
    door: new Color(0.4, 0.35, 0.25),
    coverHalf: new Color(0.35, 0.3, 0.25),
    coverFull: new Color(0.25, 0.25, 0.3),
    extraction: new Color(0.2, 0.8, 0.3),
    player: new Color(0.3, 0.5, 0.9),
    fog: new Color(0, 0, 0, 0.8),
    unexplored: new Color(0, 0, 0, 1)
};

// LittleJS initialization
function gameInit() {
    // Set canvas size
    canvasFixedSize = vec2(800, 576);
    cameraScale = TILE_SIZE;
    cameraPos = vec2(MAP_WIDTH / 2, MAP_HEIGHT / 2);

    // Generate map
    generateMap();
    updateVisibility();

    // Spawn enemies and items
    spawnEnemies();
    spawnItems();
}

function generateMap() {
    // Initialize map with walls
    map = [];
    fogOfWar = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        fogOfWar[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = TILE.WALL;
            fogOfWar[y][x] = false;
        }
    }

    // Generate rooms
    const rooms = [];
    const roomCount = randInt(4, 7);

    for (let i = 0; i < roomCount; i++) {
        const w = randInt(4, 8);
        const h = randInt(4, 6);
        const x = randInt(1, MAP_WIDTH - w - 1);
        const y = randInt(1, MAP_HEIGHT - h - 1);

        // Check overlap
        let overlap = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                y < room.y + room.h + 1 && y + h + 1 > room.y) {
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            rooms.push({ x, y, w, h });
            carveRoom(x, y, w, h);
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const a = rooms[i - 1];
        const b = rooms[i];
        const ax = Math.floor(a.x + a.w / 2);
        const ay = Math.floor(a.y + a.h / 2);
        const bx = Math.floor(b.x + b.w / 2);
        const by = Math.floor(b.y + b.h / 2);

        // Carve corridor
        if (Math.random() < 0.5) {
            carveHCorridor(ax, bx, ay);
            carveVCorridor(bx, ay, by);
        } else {
            carveVCorridor(ax, ay, by);
            carveHCorridor(ax, bx, by);
        }
    }

    // Add cover objects
    for (const room of rooms) {
        const coverCount = randInt(1, 3);
        for (let i = 0; i < coverCount; i++) {
            const cx = randInt(room.x + 1, room.x + room.w - 1);
            const cy = randInt(room.y + 1, room.y + room.h - 1);
            if (map[cy][cx] === TILE.FLOOR) {
                map[cy][cx] = Math.random() < 0.5 ? TILE.COVER_HALF : TILE.COVER_FULL;
            }
        }
    }

    // Add doors
    for (const room of rooms) {
        // Find corridor connections and add doors
        for (let x = room.x; x < room.x + room.w; x++) {
            if (room.y > 0 && map[room.y - 1][x] === TILE.FLOOR && map[room.y][x] === TILE.FLOOR) {
                map[room.y][x] = TILE.DOOR;
            }
            if (room.y + room.h < MAP_HEIGHT - 1 && map[room.y + room.h][x] === TILE.FLOOR) {
                map[room.y + room.h - 1][x] = TILE.DOOR;
            }
        }
    }

    // Place player in first room
    const startRoom = rooms[0];
    player.x = Math.floor(startRoom.x + startRoom.w / 2);
    player.y = Math.floor(startRoom.y + startRoom.h / 2);

    // Place extraction in last room
    const exitRoom = rooms[rooms.length - 1];
    const ex = Math.floor(exitRoom.x + exitRoom.w / 2);
    const ey = Math.floor(exitRoom.y + exitRoom.h / 2);
    map[ey][ex] = TILE.EXTRACTION;
}

function carveRoom(x, y, w, h) {
    for (let j = y; j < y + h; j++) {
        for (let i = x; i < x + w; i++) {
            if (j >= 0 && j < MAP_HEIGHT && i >= 0 && i < MAP_WIDTH) {
                map[j][i] = TILE.FLOOR;
            }
        }
    }
}

function carveHCorridor(x1, x2, y) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            if (map[y][x] === TILE.WALL) map[y][x] = TILE.FLOOR;
        }
    }
}

function carveVCorridor(x, y1, y2) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            if (map[y][x] === TILE.WALL) map[y][x] = TILE.FLOOR;
        }
    }
}

function spawnItems() {
    items = [];
    const itemCount = randInt(8, 15);
    const itemTypes = [
        'medkit', 'medkit',
        'ammo', 'ammo', 'ammo',
        'stim', 'stim',
        'grenade', 'grenade',
        'alcohol',
        'bandage', 'bandage',
        'painkillers',
        'flashbang',
        'smokeGrenade',
        'armorPlate'
    ];

    for (let i = 0; i < itemCount; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = randInt(1, MAP_WIDTH - 1);
            const y = randInt(1, MAP_HEIGHT - 1);

            if (isWalkable(x, y) && !hasItemAt(x, y)) {
                const type = itemTypes[randInt(0, itemTypes.length - 1)];
                items.push({
                    x, y,
                    type: type,
                    ...ITEM_TYPES[type]
                });
                break;
            }
            attempts++;
        }
    }

    // Spawn keycard
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = randInt(1, MAP_WIDTH - 1);
        const y = randInt(1, MAP_HEIGHT - 1);
        if (isWalkable(x, y) && !hasItemAt(x, y)) {
            items.push({
                x, y,
                type: 'keycard',
                ...ITEM_TYPES['keycard']
            });
            break;
        }
    }
}

function hasItemAt(x, y) {
    for (const item of items) {
        if (item.x === x && item.y === y) return true;
    }
    return false;
}

function getItemAt(x, y) {
    for (const item of items) {
        if (item.x === x && item.y === y) return item;
    }
    return null;
}

function pickupItem(item) {
    switch (item.type) {
        case 'medkit':
            inventory.medkits++;
            showMessage('Picked up Medkit');
            addFloatingText(player.x, player.y, '+Medkit', '#00FF00');
            break;
        case 'stim':
            inventory.stims++;
            showMessage('Picked up Stim Pack');
            addFloatingText(player.x, player.y, '+Stim', '#00AAFF');
            break;
        case 'ammo':
            player.ammo = Math.min(player.ammo + item.ammo, WEAPONS[player.weapon].ammo * 2);
            showMessage('Picked up Ammo');
            addFloatingText(player.x, player.y, '+' + item.ammo + ' Ammo', '#FFCC00');
            break;
        case 'grenade':
            inventory.grenades++;
            showMessage('Picked up Grenade');
            addFloatingText(player.x, player.y, '+Grenade', '#FF4400');
            break;
        case 'alcohol':
            corruption = Math.max(0, corruption - item.corruptionReduce);
            showMessage('Drank Alcohol: Corruption -' + item.corruptionReduce);
            addFloatingText(player.x, player.y, '-' + item.corruptionReduce + ' Corruption', '#CC66CC');
            break;
        case 'keycard':
            inventory.keycards++;
            showMessage('Picked up Keycard');
            addFloatingText(player.x, player.y, '+Keycard', '#FFFF00');
            break;
        case 'bandage':
            inventory.bandages++;
            showMessage('Picked up Bandage');
            addFloatingText(player.x, player.y, '+Bandage', '#FFFFFF');
            break;
        case 'surgeryKit':
            inventory.surgeryKits++;
            showMessage('Picked up Surgery Kit');
            addFloatingText(player.x, player.y, '+Surgery Kit', '#66CCCC');
            break;
        case 'painkillers':
            inventory.painkillers++;
            showMessage('Picked up Painkillers');
            addFloatingText(player.x, player.y, '+Painkillers', '#FF6699');
            break;
        case 'flashbang':
            inventory.flashbangs++;
            showMessage('Picked up Flashbang');
            addFloatingText(player.x, player.y, '+Flashbang', '#FFFFCC');
            break;
        case 'smokeGrenade':
            inventory.smokeGrenades++;
            showMessage('Picked up Smoke Grenade');
            addFloatingText(player.x, player.y, '+Smoke', '#AAAAAA');
            break;
        case 'armorPlate':
            inventory.armorPlates++;
            showMessage('Picked up Armor Plate');
            addFloatingText(player.x, player.y, '+Armor', '#6699AA');
            break;
    }
    items = items.filter(i => i !== item);
}

function useMedkit() {
    if (inventory.medkits <= 0) {
        showMessage('No medkits!');
        addFloatingText(player.x, player.y, 'No Medkits!', '#FF4444');
        return;
    }
    if (player.hp >= player.maxHp) {
        showMessage('Already at full health!');
        return;
    }
    inventory.medkits--;
    const healAmount = Math.min(30, player.maxHp - player.hp);
    player.hp += healAmount;
    showMessage('Used Medkit: +' + healAmount + ' HP');
    addFloatingText(player.x, player.y, '+' + healAmount + ' HP', '#00FF00');
}

function useStim() {
    if (inventory.stims <= 0) {
        showMessage('No stim packs!');
        addFloatingText(player.x, player.y, 'No Stims!', '#FF4444');
        return;
    }
    inventory.stims--;
    player.ap++;
    showMessage('Used Stim: +1 AP');
    addFloatingText(player.x, player.y, '+1 AP', '#00AAFF');
}

// Grenade throwing
let grenadeMode = false;

function toggleGrenadeMode() {
    if (inventory.grenades <= 0) {
        showMessage('No grenades!');
        addFloatingText(player.x, player.y, 'No Grenades!', '#FF4444');
        return;
    }
    grenadeMode = !grenadeMode;
    if (grenadeMode) {
        showMessage('Grenade mode: Click to throw');
    } else {
        showMessage('Grenade mode cancelled');
    }
}

function throwGrenade(targetX, targetY) {
    if (!playerTurn || player.ap <= 0) {
        showMessage('No AP!');
        addFloatingText(player.x, player.y, 'No AP!', '#FF4444');
        grenadeMode = false;
        return;
    }

    const dist = distance(player.x, player.y, targetX, targetY);
    if (dist > 6) {
        showMessage('Too far! Max range: 6');
        return;
    }

    inventory.grenades--;
    player.ap--;
    grenadeMode = false;

    // Create explosion effect
    createExplosion(targetX, targetY);

    // Damage in radius
    const radius = 2;
    const grenadeDamage = 40;

    for (const enemy of [...enemies]) {
        const enemyDist = distance(targetX, targetY, enemy.x, enemy.y);
        if (enemyDist <= radius) {
            const damage = Math.floor(grenadeDamage * (1 - enemyDist / (radius + 1)));
            enemy.hp -= damage;
            enemy.alerted = true;
            addFloatingText(enemy.x, enemy.y, '-' + damage, '#FF6600');
            createBloodSplatter(enemy.x, enemy.y);

            if (enemy.hp <= 0) {
                enemies = enemies.filter(e => e !== enemy);
                killCount++;
                corruption += 5;
                addFloatingText(enemy.x, enemy.y, 'KILL!', '#00FF00');
            }
        }
    }

    // Damage player if too close
    const playerDist = distance(targetX, targetY, player.x, player.y);
    if (playerDist <= radius) {
        const damage = Math.floor(grenadeDamage * (1 - playerDist / (radius + 1)));
        player.hp -= damage;
        addFloatingText(player.x, player.y, '-' + damage + ' SELF', '#FF0000');
        doScreenShake(15);
        if (player.hp <= 0) {
            gameState = 'gameover';
            showMessage('YOU DIED - CLONE LOST');
        }
    }

    showMessage('Grenade thrown!');
    doScreenShake(20);
    corruption += 10;

    if (player.ap <= 0) {
        endPlayerTurn();
    }
}

function createExplosion(x, y) {
    // Add multiple blood splatters for explosion effect
    for (let i = 0; i < 15; i++) {
        bloodSplatters.push({
            x: x + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            size: 0.2 + Math.random() * 0.3,
            life: 100 + Math.random() * 100,
            isExplosion: true
        });
    }
    addFloatingText(x, y, 'BOOM!', '#FF6600');
}

function spawnEnemies() {
    enemies = [];
    const enemyCount = randInt(5, 10);

    for (let i = 0; i < enemyCount; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = randInt(1, MAP_WIDTH - 1);
            const y = randInt(1, MAP_HEIGHT - 1);

            // Check valid spawn
            if (isWalkable(x, y) && distance(x, y, player.x, player.y) > 5) {
                const type = Math.random() < 0.3 ? 'soldier' : (Math.random() < 0.2 ? 'heavy' : 'guard');
                const template = ENEMY_TYPES[type];

                enemies.push({
                    x, y,
                    type: type,
                    hp: template.hp,
                    maxHp: template.hp,
                    ap: template.ap,
                    maxAp: template.ap,
                    damage: template.damage,
                    range: template.range,
                    color: template.color,
                    alerted: false,
                    lastKnownPlayerX: -1,
                    lastKnownPlayerY: -1
                });
                break;
            }
            attempts++;
        }
    }
}

function isWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = map[y][x];
    return tile === TILE.FLOOR || tile === TILE.DOOR || tile === TILE.EXTRACTION;
}

function isBlocking(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true;
    const tile = map[y][x];
    return tile === TILE.WALL || tile === TILE.COVER_FULL;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function updateVisibility() {
    visibleTiles = [];

    const visionRange = 8;
    for (let dy = -visionRange; dy <= visionRange; dy++) {
        for (let dx = -visionRange; dx <= visionRange; dx++) {
            const x = player.x + dx;
            const y = player.y + dy;

            if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
            if (distance(player.x, player.y, x, y) > visionRange) continue;

            // Raycast
            if (hasLineOfSight(player.x, player.y, x, y)) {
                visibleTiles.push({ x, y });
                fogOfWar[y][x] = true;
            }
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;

    while (true) {
        if (x === x2 && y === y2) return true;

        if (x !== x1 || y !== y1) {
            if (isBlocking(x, y)) return false;
        }

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

function isVisible(x, y) {
    for (const tile of visibleTiles) {
        if (tile.x === x && tile.y === y) return true;
    }
    return false;
}

function getCover(targetX, targetY, attackerX, attackerY) {
    // Check tiles between attacker and target for cover
    const dx = Math.sign(targetX - attackerX);
    const dy = Math.sign(targetY - attackerY);

    // Check adjacent tiles to target
    const checkX = targetX - dx;
    const checkY = targetY - dy;

    if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
        const tile = map[checkY][checkX];
        if (tile === TILE.COVER_FULL) return 0.5;
        if (tile === TILE.COVER_HALF) return 0.25;
    }

    return 0;
}

function tryMovePlayer(dx, dy) {
    if (!playerTurn || player.ap <= 0) {
        showMessage('No AP!');
        addFloatingText(player.x, player.y, 'No AP!', '#FF4444');
        return;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (!isWalkable(newX, newY)) return;

    // Check for enemy
    for (const enemy of enemies) {
        if (enemy.x === newX && enemy.y === newY) return;
    }

    player.x = newX;
    player.y = newY;
    player.ap--;

    updateVisibility();

    // Check for item pickup
    const item = getItemAt(player.x, player.y);
    if (item) {
        pickupItem(item);
    }

    // Check extraction
    if (map[player.y][player.x] === TILE.EXTRACTION) {
        showMessage('EXTRACTION SUCCESSFUL!');
        gameState = 'victory';
    }

    if (player.ap <= 0) {
        endPlayerTurn();
    }
}

function tryShoot(targetX, targetY) {
    if (!playerTurn || player.ap < WEAPONS[player.weapon].apCost) {
        showMessage('Not enough AP!');
        addFloatingText(player.x, player.y, 'No AP!', '#FF4444');
        return;
    }

    if (player.ammo <= 0) {
        showMessage('No ammo! Press R to reload');
        addFloatingText(player.x, player.y, 'No Ammo!', '#FFAA00');
        return;
    }

    // Find enemy at target
    let target = null;
    for (const enemy of enemies) {
        if (enemy.x === targetX && enemy.y === targetY) {
            target = enemy;
            break;
        }
    }

    if (!target) {
        showMessage('No target!');
        return;
    }

    // Check range
    const dist = distance(player.x, player.y, target.x, target.y);
    const weapon = WEAPONS[player.weapon];

    if (dist > weapon.range) {
        showMessage('Out of range!');
        return;
    }

    // Check line of sight
    if (!hasLineOfSight(player.x, player.y, target.x, target.y)) {
        showMessage('No line of sight!');
        return;
    }

    // Calculate hit chance
    let accuracy = weapon.accuracy;
    accuracy -= Math.max(0, (dist - weapon.range / 2)) * 3;
    accuracy -= getCover(target.x, target.y, player.x, player.y) * 40;
    accuracy = Math.max(5, Math.min(95, accuracy));

    player.ap -= weapon.apCost;
    player.ammo--;
    corruption += 2;

    // Muzzle flash effect
    createMuzzleFlash(player.x, player.y, target.x, target.y);

    // Roll for hit
    if (Math.random() * 100 < accuracy) {
        let damage = randInt(weapon.damage[0], weapon.damage[1]);
        const isCritical = rollCritical(player.weapon);
        if (isCritical) {
            damage = Math.floor(damage * criticalMultiplier);
        }

        // Apply cover and armor reduction
        const coverReduction = getCover(target.x, target.y, player.x, player.y);
        const armorReduction = (ENEMY_TYPES[target.type]?.armored) ? 0.3 : 0;
        const finalDamage = Math.floor(damage * (1 - coverReduction) * (1 - armorReduction));
        target.hp -= finalDamage;
        target.alerted = true;

        // Increase weapon skill
        const skill = getWeaponSkill(player.weapon);
        if (player.skills[skill] !== undefined && Math.random() < 0.1) {
            player.skills[skill]++;
        }

        if (isCritical) {
            showMessage(`CRITICAL HIT! ${finalDamage} damage`);
            addFloatingText(target.x, target.y, '-' + finalDamage + ' CRIT!', '#FFFF00');
            doScreenShake(8);
        } else {
            showMessage(`Hit! ${finalDamage} damage`);
            addFloatingText(target.x, target.y, '-' + finalDamage, '#FF0000');
        }
        createBloodSplatter(target.x, target.y);

        // Special weapon effects
        if (player.weapon === 'flamethrower' && Math.random() < 0.5) {
            if (!target.statusEffects) target.statusEffects = [];
            applyStatusEffect(target, 'burning', 3);
        }

        if (target.hp <= 0) {
            handleEnemyDeath(target);
        }
    } else {
        showMessage('Missed!');
        addFloatingText(target.x, target.y, 'MISS', '#888888');
    }

    if (player.ap <= 0) {
        endPlayerTurn();
    }
}

function tryReload() {
    if (!playerTurn || player.ap <= 0) {
        showMessage('No AP!');
        return;
    }

    const weapon = WEAPONS[player.weapon];
    if (player.ammo >= weapon.ammo) {
        showMessage('Already full!');
        return;
    }

    player.ammo = weapon.ammo;
    player.ap--;
    showMessage('Reloaded!');

    if (player.ap <= 0) {
        endPlayerTurn();
    }
}

function endPlayerTurn() {
    playerTurn = false;
    showMessage('ENEMY TURN');

    // Delay before enemy turn
    setTimeout(() => {
        enemyTurn();
    }, 500);
}

function enemyTurn() {
    // Update smoke clouds
    smokeClouds = smokeClouds.filter(cloud => {
        cloud.duration--;
        return cloud.duration > 0;
    });

    // Update corpses
    corpses = corpses.filter(corpse => {
        corpse.timer--;
        return corpse.timer > 0;
    });

    for (const enemy of [...enemies]) {
        // Initialize status effects array if needed
        if (!enemy.statusEffects) enemy.statusEffects = [];

        // Process status effects
        const skipTurn = processStatusEffects(enemy);
        if (enemy.hp <= 0) {
            handleEnemyDeath(enemy);
            continue;
        }
        if (skipTurn) {
            addFloatingText(enemy.x, enemy.y, 'STUNNED', '#FFFF00');
            continue;
        }

        enemy.ap = enemy.maxAp;

        // Fleshweaver heals from corpses
        if (ENEMY_TYPES[enemy.type]?.healsFromCorpses) {
            for (const corpse of corpses) {
                if (distance(enemy.x, enemy.y, corpse.x, corpse.y) <= 3) {
                    const healAmount = 20;
                    enemy.hp = Math.min(enemy.hp + healAmount, enemy.maxHp);
                    addFloatingText(enemy.x, enemy.y, '+' + healAmount, '#FF66FF');
                    corpse.timer = 0; // Consume corpse
                    break;
                }
            }
        }

        // Phase Walker teleportation
        if (ENEMY_TYPES[enemy.type]?.teleport && Math.random() < 0.3) {
            const dist = distance(enemy.x, enemy.y, player.x, player.y);
            if (dist > 3) {
                // Teleport closer to player
                for (let attempts = 0; attempts < 10; attempts++) {
                    const newX = player.x + randInt(-2, 2);
                    const newY = player.y + randInt(-2, 2);
                    if (isWalkable(newX, newY) && !hasEnemyAt(newX, newY) && !(newX === player.x && newY === player.y)) {
                        addFloatingText(enemy.x, enemy.y, 'TELEPORT', '#00FFFF');
                        enemy.x = newX;
                        enemy.y = newY;
                        break;
                    }
                }
            }
        }

        // Check if can see player (considering smoke)
        let canSeePlayer = isVisible(enemy.x, enemy.y) && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
        if (isInSmoke(player.x, player.y) || isInSmoke(enemy.x, enemy.y)) {
            canSeePlayer = canSeePlayer && distance(enemy.x, enemy.y, player.x, player.y) <= 2;
        }

        if (canSeePlayer) {
            enemy.alerted = true;
            enemy.lastKnownPlayerX = player.x;
            enemy.lastKnownPlayerY = player.y;
        }

        while (enemy.ap > 0) {
            if (enemy.alerted && canSeePlayer) {
                const dist = distance(enemy.x, enemy.y, player.x, player.y);

                // Check overwatch
                checkOverwatch(enemy);
                if (!enemies.includes(enemy)) break; // Enemy was killed by overwatch

                // Attack if in range
                if (dist <= enemy.range && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
                    // Attack player
                    let damage = randInt(enemy.damage[0], enemy.damage[1]);

                    // Officer buff
                    if (enemies.some(e => ENEMY_TYPES[e.type]?.buffsAllies && distance(e.x, e.y, enemy.x, enemy.y) <= 4)) {
                        damage = Math.floor(damage * 1.25);
                    }

                    const coverReduction = getCover(player.x, player.y, enemy.x, enemy.y);
                    const armorReduction = player.armor / 100;
                    const finalDamage = Math.max(1, Math.floor(damage * (1 - coverReduction) * (1 - armorReduction)));
                    player.hp -= finalDamage;

                    // Degrade player armor
                    if (player.armor > 0) {
                        player.armor = Math.max(0, player.armor - 1);
                    }

                    // Special attack effects
                    if (ENEMY_TYPES[enemy.type]?.poisonAttack && Math.random() < 0.3) {
                        applyStatusEffect(player, 'poisoned', 3);
                    }
                    if (ENEMY_TYPES[enemy.type]?.stun && Math.random() < 0.2) {
                        applyStatusEffect(player, 'stunned', 1);
                    }

                    // Visual feedback
                    doScreenShake(10 + finalDamage / 5);
                    addFloatingText(player.x, player.y, '-' + finalDamage, '#FF0000');
                    createBloodSplatter(player.x, player.y);

                    // Brute destroys cover
                    if (ENEMY_TYPES[enemy.type]?.destroysCover) {
                        destroyNearbyCover(player.x, player.y);
                    }

                    if (player.hp <= 0) {
                        gameState = 'gameover';
                        showMessage('YOU DIED - CLONE LOST');
                        doScreenShake(30);
                    }

                    enemy.ap--;
                } else {
                    // Move toward player
                    const oldX = enemy.x;
                    const oldY = enemy.y;
                    moveEnemyToward(enemy, player.x, player.y);

                    // Check overwatch after movement
                    if (enemy.x !== oldX || enemy.y !== oldY) {
                        checkOverwatch(enemy);
                    }
                }
            } else if (enemy.lastKnownPlayerX >= 0) {
                // Move to last known position
                moveEnemyToward(enemy, enemy.lastKnownPlayerX, enemy.lastKnownPlayerY);

                if (enemy.x === enemy.lastKnownPlayerX && enemy.y === enemy.lastKnownPlayerY) {
                    enemy.lastKnownPlayerX = -1;
                    enemy.lastKnownPlayerY = -1;
                }
            } else {
                // Random patrol
                enemy.ap = 0;
            }
        }
    }

    // Process player status effects
    processStatusEffects(player);
    if (player.hp <= 0) {
        gameState = 'gameover';
        showMessage('YOU DIED - CLONE LOST');
        return;
    }

    // End enemy turn
    turnCount++;
    corruption++;

    // Check corruption thresholds
    checkCorruption();

    // Start player turn
    player.ap = player.maxAp;
    playerTurn = true;
    player.overwatch = false; // Reset overwatch
    showMessage('YOUR TURN - AP: ' + player.ap);
}

// Destroy nearby cover (Brute ability)
function destroyNearbyCover(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                if (map[ny][nx] === TILE.COVER_HALF || map[ny][nx] === TILE.COVER_FULL) {
                    map[ny][nx] = TILE.FLOOR;
                    addFloatingText(nx, ny, 'DESTROYED', '#FF6600');
                }
            }
        }
    }
}

function moveEnemyToward(enemy, targetX, targetY) {
    const dx = Math.sign(targetX - enemy.x);
    const dy = Math.sign(targetY - enemy.y);

    // Try direct movement
    if (dx !== 0 && isWalkable(enemy.x + dx, enemy.y) && !hasEnemyAt(enemy.x + dx, enemy.y) && !(player.x === enemy.x + dx && player.y === enemy.y)) {
        enemy.x += dx;
        enemy.ap--;
        return;
    }
    if (dy !== 0 && isWalkable(enemy.x, enemy.y + dy) && !hasEnemyAt(enemy.x, enemy.y + dy) && !(player.x === enemy.x && player.y === enemy.y + dy)) {
        enemy.y += dy;
        enemy.ap--;
        return;
    }

    enemy.ap = 0;
}

function hasEnemyAt(x, y) {
    for (const enemy of enemies) {
        if (enemy.x === x && enemy.y === y) return true;
    }
    return false;
}

function checkCorruption() {
    // Spawn possessed enemy at high corruption
    if (corruption >= 200 && Math.random() < 0.1) {
        // Find a random guard and transform
        for (const enemy of enemies) {
            if (enemy.type === 'guard' && Math.random() < 0.3) {
                enemy.type = 'possessed';
                const template = ENEMY_TYPES.possessed;
                enemy.hp = template.hp;
                enemy.maxHp = template.hp;
                enemy.damage = template.damage;
                enemy.range = template.range;
                enemy.color = template.color;
                enemy.alerted = true;
                showMessage('Enemy transformed!');
                addFloatingText(enemy.x, enemy.y, 'TRANSFORMED!', '#00FF00');
                break;
            }
        }
    }

    // Spawn corrupted enemies at higher corruption
    if (corruption >= 400 && Math.random() < 0.05) {
        spawnCorruptedEnemy();
    }

    // Spawn boss at max corruption
    if (corruption >= 1000 && !bossSpawned) {
        spawnBoss();
        bossSpawned = true;
    }
}

// Spawn corrupted enemy
function spawnCorruptedEnemy() {
    const corruptedTypes = ['bloater', 'stalker', 'screamer', 'brute', 'phaseWalker'];
    const type = corruptedTypes[randInt(0, corruptedTypes.length - 1)];
    const template = ENEMY_TYPES[type];

    // Find spawn location away from player
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = randInt(1, MAP_WIDTH - 1);
        const y = randInt(1, MAP_HEIGHT - 1);
        if (isWalkable(x, y) && distance(x, y, player.x, player.y) > 5 && !hasEnemyAt(x, y)) {
            enemies.push({
                x, y,
                type: type,
                hp: template.hp,
                maxHp: template.hp,
                ap: template.ap,
                maxAp: template.ap,
                damage: template.damage,
                range: template.range,
                color: template.color,
                alerted: true,
                lastKnownPlayerX: player.x,
                lastKnownPlayerY: player.y,
                statusEffects: []
            });
            showMessage('Corrupted ' + template.name + ' spawned!');
            addFloatingText(x, y, 'SPAWN!', '#CC00CC');
            break;
        }
    }
}

// Spawn boss
function spawnBoss() {
    const template = ENEMY_TYPES.baron;
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = randInt(1, MAP_WIDTH - 1);
        const y = randInt(1, MAP_HEIGHT - 1);
        if (isWalkable(x, y) && distance(x, y, player.x, player.y) > 8 && !hasEnemyAt(x, y)) {
            enemies.push({
                x, y,
                type: 'baron',
                hp: template.hp,
                maxHp: template.hp,
                ap: template.ap,
                maxAp: template.ap,
                damage: template.damage,
                range: template.range,
                color: template.color,
                alerted: true,
                lastKnownPlayerX: player.x,
                lastKnownPlayerY: player.y,
                statusEffects: [],
                boss: true
            });
            showMessage('THE BARON HAS APPEARED!');
            addFloatingText(x, y, 'BOSS!', '#FF0000');
            doScreenShake(30);
            break;
        }
    }
}

// Critical hit system
function rollCritical(weapon) {
    const baseCritChance = 5;
    const skillBonus = (player.skills[getWeaponSkill(weapon)] || 0) * 2;
    const critChance = baseCritChance + skillBonus;
    return Math.random() * 100 < critChance;
}

function getWeaponSkill(weapon) {
    if (['pistol', 'smg'].includes(weapon)) return 'pistol';
    if (['rifle', 'sniper'].includes(weapon)) return 'rifle';
    if (weapon === 'shotgun') return 'shotgun';
    if (['machinegun', 'flamethrower'].includes(weapon)) return 'heavy';
    return 'rifle';
}

// XP and leveling
function gainXP(amount) {
    player.xp += amount;
    const xpForLevel = player.level * 100;
    if (player.xp >= xpForLevel) {
        player.xp -= xpForLevel;
        player.level++;
        player.maxHp += 10;
        player.hp = Math.min(player.hp + 10, player.maxHp);
        showMessage('LEVEL UP! Level ' + player.level);
        addFloatingText(player.x, player.y, 'LEVEL UP!', '#FFFF00');
        doScreenShake(10);
    }
}

// Status effect system
function applyStatusEffect(target, effect, duration) {
    const existing = target.statusEffects.find(e => e.type === effect);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
    } else {
        target.statusEffects.push({ type: effect, duration: duration });
    }
    addFloatingText(target.x, target.y, STATUS_EFFECTS[effect].name + '!',
        '#' + Math.floor(STATUS_EFFECTS[effect].color.r * 255).toString(16).padStart(2, '0') +
        Math.floor(STATUS_EFFECTS[effect].color.g * 255).toString(16).padStart(2, '0') +
        Math.floor(STATUS_EFFECTS[effect].color.b * 255).toString(16).padStart(2, '0'));
}

function processStatusEffects(target) {
    let skipTurn = false;
    for (const effect of target.statusEffects) {
        const effectData = STATUS_EFFECTS[effect.type];
        if (effectData.damagePerTurn) {
            target.hp -= effectData.damagePerTurn;
            addFloatingText(target.x, target.y, '-' + effectData.damagePerTurn, '#FF6666');
        }
        if (effectData.skipTurn) {
            skipTurn = true;
        }
        effect.duration--;
    }
    target.statusEffects = target.statusEffects.filter(e => e.duration > 0);
    return skipTurn;
}

// Overwatch system
function toggleOverwatch() {
    if (!playerTurn || player.ap < 1) {
        showMessage('Need AP for overwatch!');
        addFloatingText(player.x, player.y, 'No AP!', '#FF4444');
        return;
    }
    player.overwatch = !player.overwatch;
    if (player.overwatch) {
        player.ap--;
        showMessage('Overwatch mode - Will shoot first enemy that moves');
        addFloatingText(player.x, player.y, 'OVERWATCH', '#FFFF00');
    } else {
        showMessage('Overwatch cancelled');
    }
}

function checkOverwatch(enemy) {
    if (player.overwatch && player.ammo > 0) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        const weapon = WEAPONS[player.weapon];
        if (dist <= weapon.range && hasLineOfSight(player.x, player.y, enemy.x, enemy.y)) {
            // Take overwatch shot
            player.overwatch = false;
            let accuracy = weapon.accuracy - 10; // Overwatch penalty
            accuracy -= Math.max(0, (dist - weapon.range / 2)) * 3;
            accuracy = Math.max(5, Math.min(95, accuracy));

            player.ammo--;
            createMuzzleFlash(player.x, player.y, enemy.x, enemy.y);

            if (Math.random() * 100 < accuracy) {
                const damage = randInt(weapon.damage[0], weapon.damage[1]);
                enemy.hp -= damage;
                addFloatingText(enemy.x, enemy.y, '-' + damage + ' OW', '#FF8800');
                createBloodSplatter(enemy.x, enemy.y);
                showMessage('Overwatch hit!');

                if (enemy.hp <= 0) {
                    enemies = enemies.filter(e => e !== enemy);
                    killCount++;
                    gainXP(getEnemyXP(enemy.type));
                    addFloatingText(enemy.x, enemy.y, 'KILL!', '#00FF00');
                }
            } else {
                showMessage('Overwatch missed!');
                addFloatingText(enemy.x, enemy.y, 'MISS', '#888888');
            }
        }
    }
}

function getEnemyXP(type) {
    const xpValues = {
        guard: 20, soldier: 30, sniper: 35, officer: 40, heavy: 50,
        possessed: 40, bloater: 50, stalker: 45, screamer: 35, brute: 70,
        phaseWalker: 60, fleshweaver: 55, voidSentry: 65, baron: 500
    };
    return xpValues[type] || 25;
}

// Flashbang throwing
function throwFlashbang(targetX, targetY) {
    if (!playerTurn || player.ap <= 0) {
        showMessage('No AP!');
        addFloatingText(player.x, player.y, 'No AP!', '#FF4444');
        return;
    }
    if (inventory.flashbangs <= 0) {
        showMessage('No flashbangs!');
        return;
    }

    const dist = distance(player.x, player.y, targetX, targetY);
    if (dist > 6) {
        showMessage('Too far! Max range: 6');
        return;
    }

    inventory.flashbangs--;
    player.ap--;

    // Stun enemies in radius
    for (const enemy of enemies) {
        const enemyDist = distance(targetX, targetY, enemy.x, enemy.y);
        if (enemyDist <= 3) {
            applyStatusEffect(enemy, 'stunned', 2);
        }
    }

    showMessage('Flashbang! Enemies stunned');
    addFloatingText(targetX, targetY, 'FLASH!', '#FFFFFF');
    doScreenShake(10);

    if (player.ap <= 0) endPlayerTurn();
}

// Smoke grenade
function throwSmoke(targetX, targetY) {
    if (!playerTurn || player.ap <= 0) {
        showMessage('No AP!');
        return;
    }
    if (inventory.smokeGrenades <= 0) {
        showMessage('No smoke grenades!');
        return;
    }

    const dist = distance(player.x, player.y, targetX, targetY);
    if (dist > 6) {
        showMessage('Too far! Max range: 6');
        return;
    }

    inventory.smokeGrenades--;
    player.ap--;

    // Create smoke cloud
    smokeClouds.push({
        x: targetX,
        y: targetY,
        radius: 2,
        duration: 5
    });

    showMessage('Smoke deployed!');
    addFloatingText(targetX, targetY, 'SMOKE', '#AAAAAA');

    if (player.ap <= 0) endPlayerTurn();
}

// Check if tile is in smoke
function isInSmoke(x, y) {
    for (const cloud of smokeClouds) {
        if (distance(x, y, cloud.x, cloud.y) <= cloud.radius) {
            return true;
        }
    }
    return false;
}

// Use armor plate
function useArmorPlate() {
    if (inventory.armorPlates <= 0) {
        showMessage('No armor plates!');
        return;
    }
    inventory.armorPlates--;
    player.armor += 15;
    showMessage('Armor equipped: +15 armor');
    addFloatingText(player.x, player.y, '+15 ARMOR', '#6699AA');
}

// Use painkillers
function usePainkillers() {
    if (inventory.painkillers <= 0) {
        showMessage('No painkillers!');
        return;
    }
    inventory.painkillers--;
    // Remove negative status effects
    player.statusEffects = player.statusEffects.filter(e =>
        !['bleeding', 'poisoned', 'burning'].includes(e.type));
    showMessage('Painkillers used - Status effects cleared');
    addFloatingText(player.x, player.y, 'HEALED', '#FF99FF');
}

// Use bandage
function useBandage() {
    if (inventory.bandages <= 0) {
        showMessage('No bandages!');
        return;
    }
    if (player.hp >= player.maxHp && !player.statusEffects.find(e => e.type === 'bleeding')) {
        showMessage('Not needed');
        return;
    }
    inventory.bandages--;
    player.hp = Math.min(player.hp + 15, player.maxHp);
    player.statusEffects = player.statusEffects.filter(e => e.type !== 'bleeding');
    showMessage('Bandage applied: +15 HP, bleeding stopped');
    addFloatingText(player.x, player.y, '+15 HP', '#FFFFFF');
}

// Handle enemy death with special effects
function handleEnemyDeath(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    const type = enemy.type;

    // Add corpse for fleshweaver
    corpses.push({ x, y, type: type, timer: 50 });

    enemies = enemies.filter(e => e !== enemy);
    corruption += 5;
    killCount++;
    gainXP(getEnemyXP(type));
    player.kills++;

    // Special death effects
    if (ENEMY_TYPES[type]?.explodes) {
        // Bloater explosion
        createExplosion(x, y);
        const explosionDamage = 30;
        const radius = 2;

        // Damage nearby enemies
        for (const e of [...enemies]) {
            const dist = distance(x, y, e.x, e.y);
            if (dist <= radius) {
                const dmg = Math.floor(explosionDamage * (1 - dist / (radius + 1)));
                e.hp -= dmg;
                addFloatingText(e.x, e.y, '-' + dmg, '#FF6600');
                if (e.hp <= 0) {
                    handleEnemyDeath(e);
                }
            }
        }

        // Damage player
        const playerDist = distance(x, y, player.x, player.y);
        if (playerDist <= radius) {
            const dmg = Math.floor(explosionDamage * (1 - playerDist / (radius + 1)));
            player.hp -= dmg;
            addFloatingText(player.x, player.y, '-' + dmg, '#FF0000');
            doScreenShake(15);
            if (player.hp <= 0) {
                gameState = 'gameover';
                showMessage('YOU DIED - CLONE LOST');
            }
        }

        showMessage('BLOATER EXPLODED!');
        doScreenShake(20);
    } else if (ENEMY_TYPES[type]?.alertsAll) {
        // Screamer alerts all enemies
        for (const e of enemies) {
            e.alerted = true;
            e.lastKnownPlayerX = player.x;
            e.lastKnownPlayerY = player.y;
        }
        showMessage('Screamer alerted all enemies!');
    } else if (enemy.boss) {
        // Boss death - victory condition at high corruption
        if (corruption >= 1000) {
            showMessage('THE BARON DEFEATED! EXTRACTION AVAILABLE!');
            addFloatingText(x, y, 'BOSS DEFEATED!', '#FFFF00');
            doScreenShake(30);
        }
    } else {
        showMessage('Enemy killed!');
    }

    addFloatingText(x, y, 'KILL!', '#00FF00');
}

function showMessage(text) {
    messageText = text;
    messageTimer = 120;
}

// Floating text system
function addFloatingText(x, y, text, color = '#FF0') {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 60,
        vy: 0.02
    });
}

// Screen shake
function doScreenShake(intensity) {
    screenShake = Math.max(screenShake, intensity);
}

// Create blood splatter
function createBloodSplatter(x, y) {
    for (let i = 0; i < 5; i++) {
        bloodSplatters.push({
            x: x + (Math.random() - 0.5) * 0.5,
            y: y + (Math.random() - 0.5) * 0.5,
            size: 0.1 + Math.random() * 0.15,
            life: 300 + Math.random() * 200
        });
    }
}

// Create muzzle flash
function createMuzzleFlash(x, y, targetX, targetY) {
    const angle = Math.atan2(targetY - y, targetX - x);
    muzzleFlash = {
        x: x + Math.cos(angle) * 0.4,
        y: y + Math.sin(angle) * 0.4,
        life: 6
    };
}

// Switch weapon
function switchWeapon() {
    if (player.weapons.length <= 1) return;
    player.weaponSlot = (player.weaponSlot + 1) % player.weapons.length;
    player.weapon = player.weapons[player.weaponSlot];
    player.ammo = WEAPONS[player.weapon].ammo;
    showMessage('Switched to ' + WEAPONS[player.weapon].name);
}

// Change stance
function changeStance(delta) {
    player.stanceIndex = Math.max(0, Math.min(2, player.stanceIndex + delta));
    player.stance = STANCE_ORDER[player.stanceIndex];
    player.maxAp = STANCES[player.stance].ap;
    showMessage('Stance: ' + STANCES[player.stance].name);
}

function gameUpdate() {
    if (gameState === 'menu') {
        // Space=32, Enter=13
        if (keyWasPressed(32) || keyWasPressed(13) || mouseWasPressed(0)) {
            gameState = 'playing';
            showMessage('YOUR TURN - AP: ' + player.ap);
        }
        return;
    }

    if (gameState !== 'playing') {
        if (keyWasPressed(32) || keyWasPressed(13)) {
            // Restart game
            corruption = 0;
            turnCount = 0;
            killCount = 0;
            player.hp = 100;
            player.maxHp = 100;
            player.ap = 3;
            player.maxAp = STANCES[player.stance].ap;
            player.ammo = WEAPONS[player.weapon].ammo;
            player.armor = 0;
            player.xp = 0;
            player.level = 1;
            player.statusEffects = [];
            player.kills = 0;
            player.overwatch = false;
            floatingTexts = [];
            bloodSplatters = [];
            screenShake = 0;
            smokeClouds = [];
            corpses = [];
            bossSpawned = false;
            inventory = {
                medkits: 0, stims: 0, grenades: 0, keycards: 0,
                bandages: 0, surgeryKits: 0, painkillers: 0,
                flashbangs: 0, smokeGrenades: 0, armorPlates: 0
            };
            grenadeMode = false;
            generateMap();
            updateVisibility();
            spawnEnemies();
            spawnItems();
            gameState = 'playing';
            playerTurn = true;
            showMessage('YOUR TURN - AP: ' + player.ap);
        }
        return;
    }

    if (!playerTurn) return;

    // Handle movement (W=87, S=83, A=65, D=68, Arrows: Up=38, Down=40, Left=37, Right=39)
    if (keyWasPressed(87) || keyWasPressed(38)) tryMovePlayer(0, 1);   // W or Up
    if (keyWasPressed(83) || keyWasPressed(40)) tryMovePlayer(0, -1);  // S or Down
    if (keyWasPressed(65) || keyWasPressed(37)) tryMovePlayer(-1, 0);  // A or Left
    if (keyWasPressed(68) || keyWasPressed(39)) tryMovePlayer(1, 0);   // D or Right

    // Reload (R=82)
    if (keyWasPressed(82)) tryReload();

    // Weapon switch (Q=81)
    if (keyWasPressed(81)) switchWeapon();

    // Stance change (Tab=9, or 1=49, 2=50, 3=51)
    if (keyWasPressed(9)) changeStance(1);
    if (keyWasPressed(49)) { player.stanceIndex = 0; player.stance = 'sneak'; player.maxAp = 1; showMessage('Stance: Sneak'); }
    if (keyWasPressed(50)) { player.stanceIndex = 1; player.stance = 'walk'; player.maxAp = 2; showMessage('Stance: Walk'); }
    if (keyWasPressed(51)) { player.stanceIndex = 2; player.stance = 'run'; player.maxAp = 3; showMessage('Stance: Run'); }

    // Use items (H=72 for medkit, F=70 for stim, G=71 for grenade)
    if (keyWasPressed(72)) useMedkit();
    if (keyWasPressed(70)) useStim();
    if (keyWasPressed(71)) toggleGrenadeMode();

    // New item controls
    if (keyWasPressed(66)) useBandage(); // B for bandage
    if (keyWasPressed(80)) usePainkillers(); // P for painkillers
    if (keyWasPressed(67)) useArmorPlate(); // C for armor (C=67)

    // Overwatch (O=79)
    if (keyWasPressed(79)) toggleOverwatch();

    // End turn (Enter=13)
    if (keyWasPressed(13)) {
        endPlayerTurn();
    }

    // Mouse click to shoot or throw grenade
    if (mouseWasPressed(0) && playerTurn) {
        const worldPos = screenToWorld(mousePos);
        const tileX = Math.floor(worldPos.x);
        const tileY = Math.floor(worldPos.y);
        if (grenadeMode) {
            throwGrenade(tileX, tileY);
        } else {
            tryShoot(tileX, tileY);
        }
    }

    // Update message timer
    if (messageTimer > 0) messageTimer--;

    // Update screen shake
    if (screenShake > 0) screenShake *= 0.85;

    // Update floating texts
    floatingTexts = floatingTexts.filter(ft => {
        ft.y += ft.vy;
        ft.life--;
        return ft.life > 0;
    });

    // Update muzzle flash
    if (muzzleFlash) {
        muzzleFlash.life--;
        if (muzzleFlash.life <= 0) muzzleFlash = null;
    }

    // Update blood splatters (fade over time)
    bloodSplatters = bloodSplatters.filter(bs => {
        bs.life--;
        return bs.life > 0;
    });
}

function gameUpdatePost() {}

function gameRender() {
    // Apply screen shake
    if (screenShake > 0.5) {
        cameraPos = vec2(
            MAP_WIDTH / 2 + (Math.random() - 0.5) * screenShake * 0.05,
            MAP_HEIGHT / 2 + (Math.random() - 0.5) * screenShake * 0.05
        );
    } else {
        cameraPos = vec2(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    }

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            let color;

            // Determine tile color
            switch (tile) {
                case TILE.FLOOR: color = COLORS.floor; break;
                case TILE.WALL: color = COLORS.wall; break;
                case TILE.DOOR: color = COLORS.door; break;
                case TILE.COVER_HALF: color = COLORS.coverHalf; break;
                case TILE.COVER_FULL: color = COLORS.coverFull; break;
                case TILE.EXTRACTION: color = COLORS.extraction; break;
                default: color = COLORS.floor;
            }

            // Apply fog of war
            if (!fogOfWar[y][x]) {
                color = COLORS.unexplored;
            } else if (!isVisible(x, y)) {
                color = color.lerp(COLORS.fog, 0.6);
            }

            // Apply corruption visual
            if (corruption > 400 && isVisible(x, y)) {
                color = color.lerp(new Color(0.5, 0, 0), corruption / 2000);
            }

            drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), color);

            // Draw tile details
            if (tile === TILE.COVER_HALF && (fogOfWar[y][x] || isVisible(x, y))) {
                drawRect(vec2(x + 0.5, y + 0.3), vec2(0.8, 0.4), new Color(0.4, 0.35, 0.2));
            }
            if (tile === TILE.COVER_FULL && (fogOfWar[y][x] || isVisible(x, y))) {
                drawRect(vec2(x + 0.5, y + 0.5), vec2(0.9, 0.9), new Color(0.3, 0.3, 0.35));
            }
            if (tile === TILE.EXTRACTION && isVisible(x, y)) {
                drawRect(vec2(x + 0.5, y + 0.5), vec2(0.6, 0.6), new Color(0.2, 1, 0.3));
            }
        }
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (isVisible(enemy.x, enemy.y)) {
            // Enemy body
            drawRect(vec2(enemy.x + 0.5, enemy.y + 0.5), vec2(0.7, 0.7), enemy.color);

            // Health bar
            const healthPercent = enemy.hp / enemy.maxHp;
            drawRect(vec2(enemy.x + 0.5, enemy.y + 1), vec2(0.8, 0.1), new Color(0.3, 0.1, 0.1));
            drawRect(vec2(enemy.x + 0.5 - (1 - healthPercent) * 0.4, enemy.y + 1), vec2(0.8 * healthPercent, 0.1), new Color(0.8, 0.2, 0.2));

            // Alert indicator
            if (enemy.alerted) {
                drawRect(vec2(enemy.x + 0.5, enemy.y + 1.2), vec2(0.2, 0.2), new Color(1, 1, 0));
            }
        }
    }

    // Draw blood splatters and explosions
    for (const bs of bloodSplatters) {
        const alpha = Math.min(1, bs.life / 100);
        if (bs.isExplosion) {
            drawRect(vec2(bs.x + 0.5, bs.y + 0.5), vec2(bs.size, bs.size), new Color(1, 0.5, 0.1, alpha));
        } else {
            drawRect(vec2(bs.x + 0.5, bs.y + 0.5), vec2(bs.size, bs.size), new Color(0.5, 0.1, 0.1, alpha));
        }
    }

    // Draw corpses
    for (const corpse of corpses) {
        const alpha = corpse.timer / 50;
        drawRect(vec2(corpse.x + 0.5, corpse.y + 0.5), vec2(0.5, 0.3), new Color(0.4, 0.2, 0.2, alpha));
    }

    // Draw smoke clouds
    for (const cloud of smokeClouds) {
        for (let dx = -cloud.radius; dx <= cloud.radius; dx++) {
            for (let dy = -cloud.radius; dy <= cloud.radius; dy++) {
                if (distance(0, 0, dx, dy) <= cloud.radius) {
                    const alpha = 0.4 * (cloud.duration / 5);
                    drawRect(vec2(cloud.x + dx + 0.5, cloud.y + dy + 0.5), vec2(1, 1), new Color(0.7, 0.7, 0.7, alpha));
                }
            }
        }
    }

    // Draw items
    for (const item of items) {
        if (isVisible(item.x, item.y)) {
            drawRect(vec2(item.x + 0.5, item.y + 0.5), vec2(0.4, 0.4), item.color);
            // Item glow
            drawRect(vec2(item.x + 0.5, item.y + 0.5), vec2(0.5, 0.5), new Color(item.color.r, item.color.g, item.color.b, 0.3));
        }
    }

    // Draw player
    drawRect(vec2(player.x + 0.5, player.y + 0.5), vec2(0.8, 0.8), COLORS.player);
    // Player direction indicator
    drawRect(vec2(player.x + 0.5, player.y + 0.8), vec2(0.3, 0.2), new Color(0.1, 0.3, 0.6));

    // Draw muzzle flash
    if (muzzleFlash) {
        drawRect(vec2(muzzleFlash.x + 0.5, muzzleFlash.y + 0.5), vec2(0.3, 0.3), new Color(1, 0.9, 0.3));
        drawRect(vec2(muzzleFlash.x + 0.5, muzzleFlash.y + 0.5), vec2(0.15, 0.15), new Color(1, 1, 0.8));
    }
}

// Helper function for screen-space rectangles
function drawRectScreen(pos, size, color) {
    const ctx = mainCanvas.getContext('2d');
    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a || 1})`;
    ctx.fillRect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y);
}

function gameRenderPost() {
    const ctx = mainCanvas.getContext('2d');

    if (gameState === 'menu') {
        // Draw menu background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

        // Title
        ctx.font = '60px Arial';
        ctx.fillStyle = '#4DD4E8';
        ctx.textAlign = 'center';
        ctx.fillText('QUASIMORPH', mainCanvasSize.x / 2, mainCanvasSize.y / 3);

        ctx.font = '50px Arial';
        ctx.fillStyle = '#CC4444';
        ctx.fillText('CLONE', mainCanvasSize.x / 2, mainCanvasSize.y / 3 + 60);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Turn-Based Tactical Extraction', mainCanvasSize.x / 2, mainCanvasSize.y / 2);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#66CC66';
        ctx.fillText('[CLICK OR PRESS SPACE TO START]', mainCanvasSize.x / 2, mainCanvasSize.y * 0.7);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText('WASD: Move | Click: Shoot | R: Reload | Q: Swap Weapon', mainCanvasSize.x / 2, mainCanvasSize.y * 0.82);
        ctx.fillText('1-3: Change Stance | Enter: End Turn', mainCanvasSize.x / 2, mainCanvasSize.y * 0.87);
        return;
    }

    // Top HUD bar
    ctx.fillStyle = 'rgba(20,20,30,0.9)';
    ctx.fillRect(0, 0, mainCanvasSize.x, 60);

    // Health bar
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'left';
    ctx.fillText('HP', 20, 25);

    ctx.fillStyle = '#441111';
    ctx.fillRect(50, 12, 150, 20);
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(50, 14, 146 * (player.hp / player.maxHp), 16);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText(player.hp + '/' + player.maxHp, 125, 27);

    // AP bar
    ctx.textAlign = 'left';
    ctx.fillText('AP', 220, 25);
    for (let i = 0; i < player.maxAp; i++) {
        ctx.fillStyle = i < player.ap ? '#4488CC' : '#333344';
        ctx.fillRect(250 + i * 25, 12, 20, 20);
    }

    // Corruption bar
    ctx.fillStyle = '#CC66CC';
    ctx.fillText('CORRUPTION', 350, 25);
    ctx.fillStyle = '#331133';
    ctx.fillRect(450, 12, 100, 20);
    ctx.fillStyle = '#CC3388';
    ctx.fillRect(450, 14, Math.min(96, corruption / 10), 16);
    ctx.fillStyle = '#FFF';
    ctx.fillText(corruption.toString(), 560, 25);

    // Turn counter
    ctx.fillStyle = '#AAA';
    ctx.fillText('TURN: ' + turnCount, 620, 25);

    // Kill counter
    ctx.fillStyle = '#CC6666';
    ctx.fillText('KILLS: ' + killCount, 700, 25);

    // Level and XP
    ctx.fillStyle = '#FFCC00';
    ctx.fillText('LVL:' + player.level, 20, 50);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('XP:' + player.xp + '/' + (player.level * 100), 70, 50);

    // Armor
    if (player.armor > 0) {
        ctx.fillStyle = '#6699AA';
        ctx.fillText('ARMOR:' + player.armor, 170, 50);
    }

    // Turn indicator
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillStyle = playerTurn ? '#66CC66' : '#CC6666';
    ctx.fillText(playerTurn ? 'YOUR TURN' : 'ENEMY TURN', mainCanvasSize.x / 2, 50);

    // Bottom HUD
    const hudY = mainCanvasSize.y - 50;
    ctx.fillStyle = 'rgba(20,20,30,0.9)';
    ctx.fillRect(0, hudY - 10, mainCanvasSize.x, 60);

    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const weapon = WEAPONS[player.weapon];
    ctx.fillStyle = '#DDCC44';
    ctx.fillText(weapon.name, 20, hudY + 15);
    ctx.fillStyle = '#AAA';
    ctx.font = '14px Arial';
    ctx.fillText('Ammo: ' + player.ammo + '/' + weapon.ammo, 20, hudY + 35);

    ctx.fillStyle = '#6699CC';
    ctx.fillText('Stance: ' + player.stance.toUpperCase(), 200, hudY + 25);

    // Inventory display - row 1
    ctx.fillStyle = '#00CC00';
    ctx.fillText('Med:' + inventory.medkits, 300, hudY + 10);
    ctx.fillStyle = '#00AAFF';
    ctx.fillText('Stim:' + inventory.stims, 350, hudY + 10);
    ctx.fillStyle = '#FF6600';
    ctx.fillText('Gren:' + inventory.grenades, 410, hudY + 10);
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('Key:' + inventory.keycards, 470, hudY + 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Band:' + inventory.bandages, 520, hudY + 10);

    // Inventory display - row 2
    ctx.fillStyle = '#FF6699';
    ctx.fillText('Pain:' + inventory.painkillers, 300, hudY + 25);
    ctx.fillStyle = '#FFFFCC';
    ctx.fillText('Flash:' + inventory.flashbangs, 360, hudY + 25);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Smoke:' + inventory.smokeGrenades, 420, hudY + 25);
    ctx.fillStyle = '#6699AA';
    ctx.fillText('Armor:' + inventory.armorPlates, 490, hudY + 25);

    // Overwatch indicator
    if (player.overwatch) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('OVERWATCH', 580, hudY + 18);
    }

    ctx.fillStyle = '#666';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move | Click:Shoot | R:Reload | Q:Swap | 1-3:Stance | O:Overwatch | H:Heal | F:Stim | G:Grenade | B:Bandage | P:Pills | C:Armor', mainCanvasSize.x / 2 + 100, hudY + 40);

    // Grenade mode indicator
    if (grenadeMode) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FF6600';
        ctx.fillText('GRENADE MODE - Click to throw', mainCanvasSize.x / 2, mainCanvasSize.y / 2 + 30);
    }

    // Message
    if (messageTimer > 0) {
        ctx.font = '24px Arial';
        ctx.fillStyle = `rgba(255,255,80,${Math.min(1, messageTimer / 30)})`;
        ctx.textAlign = 'center';
        ctx.fillText(messageText, mainCanvasSize.x / 2, mainCanvasSize.y / 2 - 50);
    }

    // Floating texts
    for (const ft of floatingTexts) {
        const screenPos = worldToScreen(vec2(ft.x + 0.5, ft.y + 0.5));
        const alpha = Math.min(1, ft.life / 20);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = ft.color.replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', '');
        // Handle hex colors
        if (ft.color.startsWith('#')) {
            const r = parseInt(ft.color.slice(1, 3), 16);
            const g = parseInt(ft.color.slice(3, 5), 16);
            const b = parseInt(ft.color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        }
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, screenPos.x, screenPos.y);
    }

    // Game over / Victory screens
    if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(30,0,0,0.9)';
        ctx.fillRect(mainCanvasSize.x / 2 - 200, mainCanvasSize.y / 2 - 100, 400, 200);
        ctx.font = '40px Arial';
        ctx.fillStyle = '#DD3333';
        ctx.textAlign = 'center';
        ctx.fillText('CLONE LOST', mainCanvasSize.x / 2, mainCanvasSize.y / 2 - 20);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#AAA';
        ctx.fillText('All equipment lost', mainCanvasSize.x / 2, mainCanvasSize.y / 2 + 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('[PRESS SPACE TO RESTART]', mainCanvasSize.x / 2, mainCanvasSize.y / 2 + 60);
    }

    if (gameState === 'victory') {
        ctx.fillStyle = 'rgba(0,30,0,0.9)';
        ctx.fillRect(mainCanvasSize.x / 2 - 200, mainCanvasSize.y / 2 - 100, 400, 200);
        ctx.font = '32px Arial';
        ctx.fillStyle = '#66DD66';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACTION SUCCESSFUL', mainCanvasSize.x / 2, mainCanvasSize.y / 2 - 20);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#AAA';
        ctx.fillText('Clone and equipment saved', mainCanvasSize.x / 2, mainCanvasSize.y / 2 + 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('[PRESS SPACE FOR NEW MISSION]', mainCanvasSize.x / 2, mainCanvasSize.y / 2 + 60);
    }
}

// Start the game
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
