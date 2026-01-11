// X-COM Classic Clone - LittleJS Implementation
'use strict';

// Color palette
const COLORS = {
    background: new Color(0.08, 0.08, 0.12),
    grid: new Color(0.2, 0.2, 0.25),
    ground: new Color(0.25, 0.35, 0.25),
    wall: new Color(0.5, 0.4, 0.35),
    cover: new Color(0.35, 0.45, 0.35),
    road: new Color(0.4, 0.4, 0.45),
    door: new Color(0.55, 0.45, 0.35),

    // Units
    soldier: new Color(0.3, 0.5, 0.9),
    soldierSelected: new Color(0.4, 0.7, 1.0),
    sectoid: new Color(0.6, 0.6, 0.65),
    floater: new Color(0.7, 0.4, 0.4),
    muton: new Color(0.5, 0.6, 0.4),

    // UI
    uiBackground: new Color(0.12, 0.12, 0.18),
    uiButton: new Color(0.25, 0.3, 0.35),
    uiButtonHover: new Color(0.35, 0.4, 0.5),
    uiButtonActive: new Color(0.2, 0.5, 0.7),
    uiText: new Color(0.95, 0.95, 1),
    uiTextDim: new Color(0.6, 0.6, 0.7),

    // Status
    health: new Color(0.9, 0.25, 0.25),
    healthFull: new Color(0.3, 0.8, 0.4),
    tu: new Color(0.3, 0.6, 0.9),
    morale: new Color(0.9, 0.8, 0.3),

    // Effects
    fog: new Color(0, 0, 0),
    moveRange: new Color(0.3, 0.7, 0.9, 0.4),
    attackRange: new Color(0.9, 0.3, 0.3, 0.4),
    highlight: new Color(1, 1, 0.6, 0.5)
};

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 16;
const UI_HEIGHT = 4; // In tiles

// Terrain types
const TERRAIN = {
    GROUND: { name: 'Ground', tuCost: 4, cover: 0, passable: true, destructible: false, color: COLORS.ground },
    WALL: { name: 'Wall', tuCost: 99, cover: 1, passable: false, destructible: true, color: COLORS.wall, hp: 50 },
    COVER: { name: 'Cover', tuCost: 6, cover: 0.5, passable: true, destructible: true, color: COLORS.cover, hp: 20 },
    ROAD: { name: 'Road', tuCost: 3, cover: 0, passable: true, destructible: false, color: COLORS.road },
    DOOR: { name: 'Door', tuCost: 4, cover: 0, passable: true, destructible: true, color: COLORS.door, hp: 30 },
    FOREST: { name: 'Forest', tuCost: 6, cover: 0.4, passable: true, destructible: true, color: new Color(0.2, 0.4, 0.2), hp: 15 },
    RUBBLE: { name: 'Rubble', tuCost: 6, cover: 0.3, passable: true, destructible: false, color: new Color(0.4, 0.35, 0.3) },
    WATER: { name: 'Water', tuCost: 8, cover: 0, passable: true, destructible: false, color: new Color(0.2, 0.3, 0.5) },
    UFO_HULL: { name: 'UFO Hull', tuCost: 99, cover: 1, passable: false, destructible: false, color: new Color(0.5, 0.5, 0.6) },
    UFO_FLOOR: { name: 'UFO Floor', tuCost: 4, cover: 0, passable: true, destructible: false, color: new Color(0.4, 0.4, 0.5) },
    SAND: { name: 'Sand', tuCost: 5, cover: 0, passable: true, destructible: false, color: new Color(0.75, 0.65, 0.45) },
    MUD: { name: 'Mud', tuCost: 7, cover: 0, passable: true, destructible: false, color: new Color(0.4, 0.3, 0.2) },
    CRATER: { name: 'Crater', tuCost: 6, cover: 0.2, passable: true, destructible: false, color: new Color(0.35, 0.3, 0.25) },
    FENCE: { name: 'Fence', tuCost: 6, cover: 0.3, passable: true, destructible: true, color: new Color(0.5, 0.45, 0.35), hp: 10 },
    FIRE: { name: 'Fire', tuCost: 4, cover: 0, passable: true, destructible: false, color: new Color(0.9, 0.5, 0.1), damagePerTurn: 8 },
    BARN: { name: 'Barn', tuCost: 99, cover: 1, passable: false, destructible: true, color: new Color(0.55, 0.35, 0.25), hp: 60 },
    CRATE: { name: 'Crate', tuCost: 99, cover: 0.8, passable: false, destructible: true, color: new Color(0.5, 0.4, 0.25), hp: 25 }
};

// Weapons
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 26,
        snapShot: { accuracy: 0.30, tuPercent: 0.18 },
        aimedShot: { accuracy: 0.78, tuPercent: 0.30 },
        autoShot: null,
        ammoCapacity: 12,
        icon: 'P'
    },
    rifle: {
        name: 'Rifle',
        damage: 30,
        snapShot: { accuracy: 0.60, tuPercent: 0.25 },
        aimedShot: { accuracy: 1.10, tuPercent: 0.80 },
        autoShot: { accuracy: 0.35, tuPercent: 0.35, rounds: 3 },
        ammoCapacity: 20,
        icon: 'R'
    },
    heavyCannon: {
        name: 'Heavy Cannon',
        damage: 56,
        snapShot: { accuracy: 0.60, tuPercent: 0.33 },
        aimedShot: { accuracy: 0.90, tuPercent: 0.80 },
        autoShot: null,
        ammoCapacity: 6,
        icon: 'H'
    },
    laserRifle: {
        name: 'Laser Rifle',
        damage: 60,
        snapShot: { accuracy: 0.65, tuPercent: 0.25 },
        aimedShot: { accuracy: 1.00, tuPercent: 0.50 },
        autoShot: { accuracy: 0.46, tuPercent: 0.34, rounds: 3 },
        ammoCapacity: 999,
        icon: 'L'
    },
    plasmaRifle: {
        name: 'Plasma Rifle',
        damage: 80,
        snapShot: { accuracy: 0.86, tuPercent: 0.30 },
        aimedShot: { accuracy: 1.00, tuPercent: 0.60 },
        autoShot: { accuracy: 0.55, tuPercent: 0.36, rounds: 3 },
        ammoCapacity: 28,
        icon: 'X'
    },
    heavyPlasma: {
        name: 'Heavy Plasma',
        damage: 115,
        snapShot: { accuracy: 0.75, tuPercent: 0.30 },
        aimedShot: { accuracy: 1.10, tuPercent: 0.60 },
        autoShot: { accuracy: 0.50, tuPercent: 0.35, rounds: 3 },
        ammoCapacity: 35,
        icon: 'HP'
    },
    rocketLauncher: {
        name: 'Rocket Launcher',
        damage: 75,
        snapShot: { accuracy: 0.55, tuPercent: 0.45 },
        aimedShot: { accuracy: 1.15, tuPercent: 0.75 },
        autoShot: null,
        ammoCapacity: 1,
        explosive: true,
        radius: 4,
        icon: 'RL'
    },
    autoCannon: {
        name: 'Auto-Cannon',
        damage: 42,
        snapShot: { accuracy: 0.56, tuPercent: 0.33 },
        aimedShot: { accuracy: 0.82, tuPercent: 0.80 },
        autoShot: { accuracy: 0.32, tuPercent: 0.40, rounds: 3 },
        ammoCapacity: 14,
        icon: 'AC'
    },
    laserPistol: {
        name: 'Laser Pistol',
        damage: 46,
        snapShot: { accuracy: 0.40, tuPercent: 0.20 },
        aimedShot: { accuracy: 0.68, tuPercent: 0.55 },
        autoShot: { accuracy: 0.28, tuPercent: 0.25, rounds: 3 },
        ammoCapacity: 999,
        icon: 'LP',
        damageType: 'laser'
    },
    heavyLaser: {
        name: 'Heavy Laser',
        damage: 85,
        snapShot: { accuracy: 0.50, tuPercent: 0.33 },
        aimedShot: { accuracy: 0.84, tuPercent: 0.80 },
        autoShot: null,
        ammoCapacity: 999,
        icon: 'HL',
        damageType: 'laser'
    },
    plasmaPistol: {
        name: 'Plasma Pistol',
        damage: 52,
        snapShot: { accuracy: 0.65, tuPercent: 0.30 },
        aimedShot: { accuracy: 0.85, tuPercent: 0.60 },
        autoShot: { accuracy: 0.50, tuPercent: 0.30, rounds: 3 },
        ammoCapacity: 26,
        icon: 'PP',
        damageType: 'plasma'
    },
    blasterLauncher: {
        name: 'Blaster Launcher',
        damage: 200,
        snapShot: { accuracy: 0.70, tuPercent: 0.66 },
        aimedShot: { accuracy: 1.20, tuPercent: 0.80 },
        autoShot: null,
        ammoCapacity: 1,
        explosive: true,
        radius: 5,
        guided: true,
        icon: 'BL',
        damageType: 'plasma'
    }
};

// Equipment items
const ITEMS = {
    fragGrenade: { name: 'Frag Grenade', type: 'grenade', damage: 50, radius: 3, tuCost: 25, icon: 'G' },
    smokeGrenade: { name: 'Smoke Grenade', type: 'smoke', radius: 3, tuCost: 25, icon: 'S' },
    mediKit: { name: 'Medi-Kit', type: 'heal', healAmount: 25, tuCost: 15, icon: '+' },
    stunRod: { name: 'Stun Rod', type: 'stun', damage: 30, tuCost: 20, icon: 'Z' },
    flare: { name: 'Flare', type: 'light', radius: 6, tuCost: 10, icon: 'F' },
    motionScanner: { name: 'Motion Scanner', type: 'scanner', radius: 8, tuCost: 25, icon: 'M' },
    proximityMine: { name: 'Proximity Mine', type: 'mine', damage: 70, radius: 3, tuCost: 20, icon: 'X' },
    alienGrenade: { name: 'Alien Grenade', type: 'grenade', damage: 90, radius: 4, tuCost: 25, icon: 'AG' },
    electroFlare: { name: 'Electro-Flare', type: 'light', radius: 10, tuCost: 10, icon: 'EF' },
    psiAmp: { name: 'Psi-Amp', type: 'psionic', tuCost: 25, icon: 'PA' }
};

// Alien types
const ALIEN_TYPES = {
    sectoid: {
        name: 'Sectoid',
        health: 30,
        tu: 54,
        reactions: 63,
        armor: 4,
        accuracy: 0.5,
        weapon: 'plasmaRifle',
        color: COLORS.sectoid,
        icon: 'S',
        psionic: false
    },
    sectoidLeader: {
        name: 'Sectoid Leader',
        health: 35,
        tu: 60,
        reactions: 70,
        armor: 6,
        accuracy: 0.6,
        weapon: 'plasmaRifle',
        color: new Color(0.7, 0.5, 0.7),
        icon: 'SL',
        psionic: true
    },
    floater: {
        name: 'Floater',
        health: 40,
        tu: 60,
        reactions: 65,
        armor: 8,
        accuracy: 0.4,
        weapon: 'plasmaRifle',
        color: COLORS.floater,
        icon: 'F',
        flying: true
    },
    snakeman: {
        name: 'Snakeman',
        health: 50,
        tu: 45,
        reactions: 60,
        armor: 20,
        accuracy: 0.65,
        weapon: 'plasmaRifle',
        color: new Color(0.4, 0.5, 0.3),
        icon: 'SN'
    },
    muton: {
        name: 'Muton',
        health: 125,
        tu: 62,
        reactions: 68,
        armor: 32,
        accuracy: 0.6,
        weapon: 'plasmaRifle',
        color: COLORS.muton,
        icon: 'M'
    },
    ethereal: {
        name: 'Ethereal',
        health: 55,
        tu: 70,
        reactions: 85,
        armor: 35,
        accuracy: 0.7,
        weapon: 'plasmaRifle',
        color: new Color(0.6, 0.5, 0.7),
        icon: 'E',
        psionic: true
    },
    cyberdisc: {
        name: 'Cyberdisc',
        health: 100,
        tu: 70,
        reactions: 80,
        armor: 40,
        accuracy: 0.7,
        weapon: 'plasmaRifle',
        color: new Color(0.5, 0.5, 0.6),
        icon: 'CD',
        flying: true,
        explodes: true
    },
    chryssalid: {
        name: 'Chryssalid',
        health: 80,
        tu: 110,
        reactions: 100,
        armor: 20,
        accuracy: 0.8,
        weapon: null,
        meleeDamage: 35,
        color: new Color(0.3, 0.3, 0.5),
        icon: 'CH',
        zombify: true
    },
    sectopod: {
        name: 'Sectopod',
        health: 200,
        tu: 70,
        reactions: 70,
        armor: 145,
        accuracy: 0.75,
        weapon: null,
        laserDamage: 100,
        color: new Color(0.6, 0.6, 0.7),
        icon: 'SP',
        robotic: true,
        immuneToPsi: true
    },
    silacoid: {
        name: 'Silacoid',
        health: 60,
        tu: 40,
        reactions: 30,
        armor: 30,
        accuracy: 0.5,
        weapon: null,
        meleeDamage: 50,
        color: new Color(0.8, 0.4, 0.2),
        icon: 'SI',
        spreadsfire: true
    },
    reaper: {
        name: 'Reaper',
        health: 100,
        tu: 80,
        reactions: 60,
        armor: 12,
        accuracy: 0.7,
        weapon: null,
        meleeDamage: 65,
        color: new Color(0.4, 0.35, 0.3),
        icon: 'RE'
    }
};

// Mission types
const MISSION_TYPES = {
    crashSite: { name: 'UFO Crash Site', aliens: [3, 5], hasUFO: true },
    groundAssault: { name: 'UFO Ground Assault', aliens: [5, 8], hasUFO: true },
    terrorMission: { name: 'Terror Mission', aliens: [6, 10], hasCivilians: true }
};

// Game state
let gameState = 'title'; // title, deployment, playerTurn, alienTurn, victory, defeat
let currentTurn = 1;
let selectedUnit = null;
let targetMode = null; // null, 'move', 'snap', 'aimed', 'auto', 'grenade', 'heal'
let map = [];
let soldiers = [];
let aliens = [];
let civilians = [];
let zombies = [];
let visibleTiles = new Set();
let hoveredTile = null;
let bullets = [];
let explosions = [];
let smokeEffects = [];
let messages = [];
let missionType = 'crashSite';
let kills = 0;
let civiliansRescued = 0;
let civiliansLost = 0;
let isNightMission = false;
let difficulty = 'normal'; // easy, normal, veteran, superhuman
let fireTiles = []; // Tiles on fire
let proximityMines = []; // Placed mines
let scannedTiles = new Set(); // Tiles revealed by motion scanner
let groundItems = []; // Items dropped on the ground
let alienCorpses = []; // Dead alien bodies
let stunedAliens = []; // Stunned aliens for capture

// Psionic attack function
function executePsionicAttack(attacker, target) {
    if (!attacker.psionic) return false;

    const tuCost = 25;
    if (attacker.tuCurrent < tuCost) return false;

    attacker.tuCurrent -= tuCost;

    // Psi attack success = attacker's psi strength vs target's bravery
    const attackStrength = 50 + Math.floor(Math.random() * 50);
    const defense = target.stats.bravery;

    const success = attackStrength > defense;

    if (success) {
        const effect = Math.random();
        if (effect < 0.4) {
            // Panic
            target.panicked = true;
            target.panicTurns = 2;
            addMessage(`${target.name} panics from psionic attack!`);
        } else if (effect < 0.7) {
            // Demoralize
            target.morale -= 30;
            target.stats.tuCurrent = Math.floor(target.stats.tuCurrent / 2);
            addMessage(`${target.name} is demoralized!`);
        } else {
            // Mind control (rare)
            target.mindControlled = true;
            target.mindControlTurns = 1;
            addMessage(`${target.name} is mind controlled!`);
        }
        return true;
    } else {
        addMessage(`${target.name} resists psionic attack!`);
        return false;
    }
}

// Chryssalid zombie creation
function createZombie(x, y, sourceName) {
    const zombie = {
        name: `Zombie (${sourceName})`,
        health: 40,
        healthCurrent: 40,
        tu: 30,
        tuCurrent: 30,
        armor: 5,
        x: x,
        y: y,
        alive: true,
        meleeDamage: 15,
        color: new Color(0.4, 0.5, 0.3),
        icon: 'Z',
        turnsToHatch: 3,
        spotted: false
    };
    zombies.push(zombie);
    map[y][x].unit = zombie;
    addMessage(`${sourceName} rises as a zombie!`);
}

// Hatch chryssalid from zombie
function hatchChryssalid(zombie) {
    const newAlien = generateAlien('chryssalid', zombie.x, zombie.y);
    aliens.push(newAlien);
    map[zombie.y][zombie.x].unit = newAlien;
    zombie.alive = false;
    addMessage('A Chryssalid emerges from the zombie!');
}

// Cyberdisc death explosion
function triggerCyberdiscExplosion(alien) {
    if (alien.explodes && alien.healthCurrent <= 0) {
        createExplosion(alien.x, alien.y, 120, 7);
        addMessage(`${alien.name} explodes!`);
    }
}

// Night mission visibility modifier
function getVisibilityRange(unit) {
    const baseRange = 12;
    if (isNightMission) {
        // Reduced visibility at night, modified by flares
        return 6;
    }
    return baseRange;
}

// Difficulty modifiers
function getDifficultyModifier(stat) {
    switch(difficulty) {
        case 'easy': return stat === 'alien' ? 0.8 : 1.2;
        case 'normal': return 1.0;
        case 'veteran': return stat === 'alien' ? 1.2 : 0.9;
        case 'superhuman': return stat === 'alien' ? 1.5 : 0.8;
        default: return 1.0;
    }
}

// Soldier rank promotion
function checkRankPromotion(soldier) {
    const killThresholds = [0, 3, 8, 15, 25, 40];
    const currentRankIndex = soldier.rankIndex || 0;

    if (currentRankIndex < RANKS.length - 1) {
        if (soldier.experience.kills >= killThresholds[currentRankIndex + 1]) {
            soldier.rankIndex++;
            soldier.rank = RANKS[soldier.rankIndex];
            addMessage(`${soldier.name} promoted to ${soldier.rank}!`);

            // Small stat boost on promotion
            soldier.stats.tuBase += 2;
            soldier.stats.firingAccuracy += 3;
            soldier.stats.bravery += 5;
        }
    }
}

// Wounded accuracy penalty
function getWoundedPenalty(soldier) {
    const healthPercent = soldier.stats.healthCurrent / soldier.stats.healthBase;
    if (healthPercent >= 0.75) return 1.0;
    if (healthPercent >= 0.5) return 0.9;
    if (healthPercent >= 0.25) return 0.75;
    return 0.5;
}

// Use motion scanner
function useMotionScanner(user) {
    const idx = user.inventory.indexOf('motionScanner');
    if (idx === -1) return false;

    if (user.stats.tuCurrent < ITEMS.motionScanner.tuCost) {
        addMessage('Not enough TU!');
        return false;
    }

    user.stats.tuCurrent -= ITEMS.motionScanner.tuCost;
    const range = ITEMS.motionScanner.radius;

    // Reveal aliens within range
    scannedTiles = new Set();
    aliens.forEach(alien => {
        if (!alien.alive) return;
        const dist = Math.abs(alien.x - user.x) + Math.abs(alien.y - user.y);
        if (dist <= range) {
            scannedTiles.add(`${alien.x},${alien.y}`);
            alien.spotted = true;
        }
    });

    addMessage(`Motion scanner reveals ${scannedTiles.size} contacts!`);
    return true;
}

// Place proximity mine
function placeProximityMine(user, x, y) {
    const idx = user.inventory.indexOf('proximityMine');
    if (idx === -1) {
        addMessage('No mines in inventory!');
        return false;
    }

    if (user.stats.tuCurrent < ITEMS.proximityMine.tuCost) {
        addMessage('Not enough TU!');
        return false;
    }

    const dist = Math.abs(x - user.x) + Math.abs(y - user.y);
    if (dist > 1) {
        addMessage('Must be adjacent!');
        return false;
    }

    user.inventory.splice(idx, 1);
    user.stats.tuCurrent -= ITEMS.proximityMine.tuCost;

    proximityMines.push({ x: x, y: y, damage: ITEMS.proximityMine.damage, radius: ITEMS.proximityMine.radius });
    addMessage('Proximity mine placed!');
    return true;
}

// Check proximity mine triggers
function checkProximityMines(unit) {
    proximityMines = proximityMines.filter(mine => {
        const dist = Math.abs(mine.x - unit.x) + Math.abs(mine.y - unit.y);
        if (dist <= 1) {
            addMessage('PROXIMITY MINE TRIGGERED!');
            createExplosion(mine.x, mine.y, mine.damage, mine.radius);
            return false;
        }
        return true;
    });
}

// Spread fire to adjacent tiles
function spreadFire() {
    const newFires = [];
    fireTiles.forEach(fire => {
        fire.duration--;
        if (fire.duration <= 0) return;

        // Chance to spread
        if (Math.random() < 0.2) {
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = fire.x + dir[0];
            const ny = fire.y + dir[1];

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const tile = map[ny][nx];
                if (tile.destructible && !fireTiles.some(f => f.x === nx && f.y === ny)) {
                    newFires.push({ x: nx, y: ny, duration: 3 });
                }
            }
        }
    });

    fireTiles = fireTiles.filter(f => f.duration > 0);
    fireTiles.push(...newFires);
}

// Apply fire damage to units
function applyFireDamage() {
    fireTiles.forEach(fire => {
        const tile = map[fire.y][fire.x];
        if (tile.unit) {
            const damage = TERRAIN.FIRE.damagePerTurn || 8;
            if (tile.unit.stats) {
                tile.unit.stats.healthCurrent -= damage;
                addMessage(`${tile.unit.name} takes ${damage} fire damage!`);
                if (tile.unit.stats.healthCurrent <= 0) {
                    tile.unit.alive = false;
                    tile.unit = null;
                    addMessage(`${tile.unit?.name || 'Unit'} burned!`);
                }
            } else {
                tile.unit.healthCurrent -= damage;
                if (tile.unit.healthCurrent <= 0) {
                    tile.unit.alive = false;
                    kills++;
                    tile.unit = null;
                }
            }
        }
    });
}

// Drop item on ground
function dropItem(user, itemIndex) {
    if (itemIndex < 0 || itemIndex >= user.inventory.length) return false;

    const tuCost = 2;
    if (user.stats.tuCurrent < tuCost) {
        addMessage('Not enough TU!');
        return false;
    }

    const item = user.inventory.splice(itemIndex, 1)[0];
    user.stats.tuCurrent -= tuCost;
    groundItems.push({ item: item, x: user.x, y: user.y });
    addMessage(`Dropped ${ITEMS[item]?.name || item}`);
    return true;
}

// Pick up item from ground
function pickupItem(user) {
    const tuCost = 4;
    if (user.stats.tuCurrent < tuCost) {
        addMessage('Not enough TU!');
        return false;
    }

    const itemIndex = groundItems.findIndex(gi => gi.x === user.x && gi.y === user.y);
    if (itemIndex === -1) {
        addMessage('No item here!');
        return false;
    }

    const groundItem = groundItems.splice(itemIndex, 1)[0];
    user.inventory.push(groundItem.item);
    user.stats.tuCurrent -= tuCost;
    addMessage(`Picked up ${ITEMS[groundItem.item]?.name || groundItem.item}`);
    return true;
}

// Stun alien with stun rod
function useStunRod(user, target) {
    const idx = user.inventory.indexOf('stunRod');
    if (idx === -1) {
        addMessage('No stun rod!');
        return false;
    }

    const tuCost = Math.floor(user.stats.tuBase * 0.2);
    if (user.stats.tuCurrent < tuCost) {
        addMessage('Not enough TU!');
        return false;
    }

    const dist = Math.abs(user.x - target.x) + Math.abs(user.y - target.y);
    if (dist > 1) {
        addMessage('Must be adjacent!');
        return false;
    }

    user.stats.tuCurrent -= tuCost;

    // Always hits
    const stunDamage = ITEMS.stunRod.damage;
    target.stunDamage = (target.stunDamage || 0) + stunDamage;

    if (target.stunDamage >= target.health) {
        target.alive = false;
        target.stunned = true;
        map[target.y][target.x].unit = null;
        stunedAliens.push(target);
        addMessage(`${target.name} stunned! Ready for capture!`);
    } else {
        addMessage(`${target.name} takes ${stunDamage} stun damage (${target.stunDamage}/${target.health})`);
    }
    return true;
}

// Create alien corpse
function createCorpse(alien) {
    alienCorpses.push({
        type: alien.type,
        x: alien.x,
        y: alien.y
    });
}

// UI state
let uiButtons = [];
let hoveredButton = null;

// Soldier names
const SOLDIER_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
];

// Soldier ranks
const RANKS = ['Rookie', 'Squaddie', 'Sergeant', 'Captain', 'Colonel', 'Commander'];

// Generate random soldier
function generateSoldier(id) {
    const weapons = ['rifle', 'rifle', 'rifle', 'heavyCannon', 'laserRifle', 'pistol', 'laserPistol', 'heavyLaser', 'autoCannon', 'rocketLauncher'];
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];

    // Random inventory items
    const inventory = [];
    if (Math.random() > 0.5) inventory.push('fragGrenade');
    if (Math.random() > 0.7) inventory.push('smokeGrenade');
    if (Math.random() > 0.8) inventory.push('mediKit');
    if (Math.random() > 0.9) inventory.push('motionScanner');
    if (Math.random() > 0.95) inventory.push('proximityMine');

    return {
        id: id,
        name: SOLDIER_NAMES[Math.floor(Math.random() * SOLDIER_NAMES.length)],
        rank: 'Rookie',
        rankIndex: 0,
        stats: {
            tuBase: 50 + Math.floor(Math.random() * 15),
            tuCurrent: 0,
            healthBase: 25 + Math.floor(Math.random() * 20),
            healthCurrent: 0,
            staminaBase: 40 + Math.floor(Math.random() * 30),
            staminaCurrent: 0,
            reactions: 30 + Math.floor(Math.random() * 40),
            firingAccuracy: 40 + Math.floor(Math.random() * 30),
            throwingAccuracy: 50 + Math.floor(Math.random() * 25),
            bravery: 30 + Math.floor(Math.random() * 40),
            strength: 20 + Math.floor(Math.random() * 30)
        },
        weapon: weapon,
        ammo: WEAPONS[weapon].ammoCapacity,
        inventory: inventory,
        armor: Math.random() > 0.7 ? 'personal' : 'none',
        armorValue: Math.random() > 0.7 ? 50 : 0,
        x: 0,
        y: 0,
        facing: 0,
        stance: 'standing',
        morale: 100,
        alive: true,
        selected: false,
        overwatching: false,
        experience: { kills: 0, missions: 0, hits: 0 },
        panicked: false,
        panicTurns: 0
    };
}

// Generate alien
function generateAlien(type, x, y) {
    const template = ALIEN_TYPES[type];
    return {
        type: type,
        ...template,
        healthCurrent: template.health,
        tuCurrent: template.tu,
        x: x,
        y: y,
        facing: Math.floor(Math.random() * 8),
        alive: true,
        spotted: false
    };
}

// Generate random map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = { ...TERRAIN.GROUND, x: x, y: y, unit: null, smoke: 0, hp: 0 };
        }
    }

    // Add roads
    const roadY = 4 + Math.floor(Math.random() * 6);
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[roadY][x] = { ...TERRAIN.ROAD, x: x, y: roadY, unit: null, smoke: 0, hp: 0 };
        if (Math.random() > 0.6) {
            if (roadY + 1 < MAP_HEIGHT) map[roadY+1][x] = { ...TERRAIN.ROAD, x: x, y: roadY+1, unit: null, smoke: 0, hp: 0 };
        }
    }

    // Add UFO crash site (for crash missions)
    if (missionType === 'crashSite' || missionType === 'groundAssault') {
        const ufoX = MAP_WIDTH - 8 + Math.floor(Math.random() * 3);
        const ufoY = 4 + Math.floor(Math.random() * 6);
        const ufoW = 5;
        const ufoH = 4;

        // UFO hull
        for (let y = ufoY; y < ufoY + ufoH && y < MAP_HEIGHT; y++) {
            for (let x = ufoX; x < ufoX + ufoW && x < MAP_WIDTH; x++) {
                if (y === ufoY || y === ufoY + ufoH - 1 || x === ufoX || x === ufoX + ufoW - 1) {
                    map[y][x] = { ...TERRAIN.UFO_HULL, x: x, y: y, unit: null, smoke: 0, hp: 0 };
                } else {
                    map[y][x] = { ...TERRAIN.UFO_FLOOR, x: x, y: y, unit: null, smoke: 0, hp: 0 };
                }
            }
        }
        // UFO door
        map[ufoY + Math.floor(ufoH/2)][ufoX] = { ...TERRAIN.DOOR, x: ufoX, y: ufoY + Math.floor(ufoH/2), unit: null, smoke: 0, hp: 30 };
    }

    // Add buildings
    const numBuildings = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBuildings; i++) {
        const bw = 4 + Math.floor(Math.random() * 3);
        const bh = 3 + Math.floor(Math.random() * 2);
        const bx = 3 + Math.floor(Math.random() * (MAP_WIDTH - bw - 10));
        const by = 1 + Math.floor(Math.random() * (MAP_HEIGHT - bh - 2));

        // Check for overlap
        let overlaps = false;
        for (let y = by; y < by + bh && !overlaps; y++) {
            for (let x = bx; x < bx + bw && !overlaps; x++) {
                if (map[y][x].name !== 'Ground') overlaps = true;
            }
        }
        if (overlaps) continue;

        // Walls
        for (let y = by; y < by + bh; y++) {
            for (let x = bx; x < bx + bw; x++) {
                if (y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1) {
                    map[y][x] = { ...TERRAIN.WALL, x: x, y: y, unit: null, smoke: 0, hp: 50 };
                }
            }
        }

        // Door
        const doorSide = Math.floor(Math.random() * 4);
        let doorX, doorY;
        if (doorSide === 0) { doorX = bx + 1 + Math.floor(Math.random() * (bw - 2)); doorY = by; }
        else if (doorSide === 1) { doorX = bx + 1 + Math.floor(Math.random() * (bw - 2)); doorY = by + bh - 1; }
        else if (doorSide === 2) { doorX = bx; doorY = by + 1 + Math.floor(Math.random() * (bh - 2)); }
        else { doorX = bx + bw - 1; doorY = by + 1 + Math.floor(Math.random() * (bh - 2)); }
        if (doorY >= 0 && doorY < MAP_HEIGHT && doorX >= 0 && doorX < MAP_WIDTH) {
            map[doorY][doorX] = { ...TERRAIN.DOOR, x: doorX, y: doorY, unit: null, smoke: 0, hp: 30 };
        }
    }

    // Add forest patches
    const numForest = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numForest; i++) {
        const fx = Math.floor(Math.random() * MAP_WIDTH);
        const fy = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[fy][fx].name === 'Ground') {
            map[fy][fx] = { ...TERRAIN.FOREST, x: fx, y: fy, unit: null, smoke: 0, hp: 15 };
        }
    }

    // Add scattered cover
    const numCover = 10 + Math.floor(Math.random() * 12);
    for (let i = 0; i < numCover; i++) {
        const cx = Math.floor(Math.random() * MAP_WIDTH);
        const cy = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[cy][cx].name === 'Ground') {
            map[cy][cx] = { ...TERRAIN.COVER, x: cx, y: cy, unit: null, smoke: 0, hp: 20 };
        }
    }

    // Add some rubble (for crash sites)
    if (missionType === 'crashSite') {
        const numRubble = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numRubble; i++) {
            const rx = MAP_WIDTH - 12 + Math.floor(Math.random() * 8);
            const ry = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[ry][rx].name === 'Ground') {
                map[ry][rx] = { ...TERRAIN.RUBBLE, x: rx, y: ry, unit: null, smoke: 0, hp: 0 };
            }
        }
    }

    // Add crates for cover
    const numCrates = 4 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numCrates; i++) {
        const cx = Math.floor(Math.random() * MAP_WIDTH);
        const cy = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[cy][cx].name === 'Ground') {
            map[cy][cx] = { ...TERRAIN.CRATE, x: cx, y: cy, unit: null, smoke: 0, hp: 25 };
        }
    }

    // Add fences
    const numFences = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numFences; i++) {
        const fx = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const fy = Math.floor(Math.random() * MAP_HEIGHT);
        const len = 2 + Math.floor(Math.random() * 3);
        const horiz = Math.random() > 0.5;

        for (let j = 0; j < len; j++) {
            const tx = horiz ? fx + j : fx;
            const ty = horiz ? fy : fy + j;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                if (map[ty][tx].name === 'Ground') {
                    map[ty][tx] = { ...TERRAIN.FENCE, x: tx, y: ty, unit: null, smoke: 0, hp: 10 };
                }
            }
        }
    }

    // Add water patches
    const numWater = Math.floor(Math.random() * 3);
    for (let i = 0; i < numWater; i++) {
        const wx = Math.floor(Math.random() * MAP_WIDTH);
        const wy = Math.floor(Math.random() * MAP_HEIGHT);
        const size = 2 + Math.floor(Math.random() * 2);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const tx = wx + dx;
                const ty = wy + dy;
                if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                    if (map[ty][tx].name === 'Ground') {
                        map[ty][tx] = { ...TERRAIN.WATER, x: tx, y: ty, unit: null, smoke: 0, hp: 0 };
                    }
                }
            }
        }
    }

    // Night mission chance
    isNightMission = Math.random() < 0.25;
}

// Initialize soldiers
function initializeSoldiers() {
    soldiers = [];
    const numSoldiers = 4;
    for (let i = 0; i < numSoldiers; i++) {
        const soldier = generateSoldier(i);
        soldier.stats.tuCurrent = soldier.stats.tuBase;
        soldier.stats.healthCurrent = soldier.stats.healthBase;
        soldier.ammo = WEAPONS[soldier.weapon].ammoCapacity;
        soldiers.push(soldier);
    }

    // Deploy soldiers on left side
    let placed = 0;
    for (let x = 0; x < 3 && placed < soldiers.length; x++) {
        for (let y = 2; y < MAP_HEIGHT - 2 && placed < soldiers.length; y += 3) {
            if (map[y][x].passable && !map[y][x].unit) {
                soldiers[placed].x = x;
                soldiers[placed].y = y;
                map[y][x].unit = soldiers[placed];
                placed++;
            }
        }
    }
}

// Initialize aliens
function initializeAliens() {
    aliens = [];
    zombies = [];

    // Determine number and types based on mission
    const missionData = MISSION_TYPES[missionType];
    const numAliens = missionData.aliens[0] + Math.floor(Math.random() * (missionData.aliens[1] - missionData.aliens[0]));

    // Mission-appropriate alien types
    let alienTypes;
    if (missionType === 'terrorMission') {
        alienTypes = ['sectoid', 'sectoid', 'floater', 'chryssalid', 'sectoidLeader'];
    } else if (currentTurn > 10) {
        alienTypes = ['muton', 'snakeman', 'ethereal', 'cyberdisc', 'sectoidLeader'];
    } else {
        alienTypes = ['sectoid', 'sectoid', 'floater', 'muton', 'snakeman'];
    }

    let placed = 0;
    for (let attempts = 0; attempts < 100 && placed < numAliens; attempts++) {
        const x = MAP_WIDTH - 5 + Math.floor(Math.random() * 4);
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));

        if (map[y][x].passable && !map[y][x].unit) {
            const type = alienTypes[placed % alienTypes.length];
            const alien = generateAlien(type, x, y);

            // Apply difficulty modifier
            alien.health = Math.floor(alien.health * getDifficultyModifier('alien'));
            alien.healthCurrent = alien.health;
            alien.accuracy *= getDifficultyModifier('alien');

            aliens.push(alien);
            map[y][x].unit = alien;
            placed++;
        }
    }

    // Initialize civilians for terror missions
    if (missionData.hasCivilians) {
        initializeCivilians();
    }
}

// Initialize civilians for terror missions
function initializeCivilians() {
    civilians = [];
    const numCivilians = 6 + Math.floor(Math.random() * 4);

    let placed = 0;
    for (let attempts = 0; attempts < 100 && placed < numCivilians; attempts++) {
        const x = 3 + Math.floor(Math.random() * (MAP_WIDTH - 6));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));

        if (map[y][x].passable && !map[y][x].unit) {
            const civilian = {
                name: 'Civilian',
                x: x,
                y: y,
                health: 10,
                healthCurrent: 10,
                alive: true,
                color: new Color(0.9, 0.8, 0.6),
                icon: 'C'
            };
            civilians.push(civilian);
            map[y][x].unit = civilian;
            placed++;
        }
    }
}

// Calculate visibility
function calculateVisibility() {
    visibleTiles = new Set();

    soldiers.forEach(soldier => {
        if (!soldier.alive) return;

        const range = 12;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const tx = soldier.x + dx;
                const ty = soldier.y + dy;
                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
                if (Math.abs(dx) + Math.abs(dy) > range) continue;

                if (hasLineOfSight(soldier.x, soldier.y, tx, ty)) {
                    visibleTiles.add(`${tx},${ty}`);
                }
            }
        }
    });

    // Update alien spotted status
    aliens.forEach(alien => {
        if (alien.alive && visibleTiles.has(`${alien.x},${alien.y}`)) {
            alien.spotted = true;
        }
    });
}

// Line of sight check
function hasLineOfSight(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;

    while (true) {
        if (x === x1 && y === y1) return true;

        if (x !== x0 || y !== y0) {
            if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
            if (!map[y][x].passable) return false;
        }

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

// Calculate movement range
function getMovementRange(unit) {
    const range = new Set();
    const queue = [{ x: unit.x, y: unit.y, tu: unit.stats?.tuCurrent || unit.tuCurrent }];
    const visited = {};
    visited[`${unit.x},${unit.y}`] = queue[0].tu;

    while (queue.length > 0) {
        const current = queue.shift();
        range.add(`${current.x},${current.y}`);

        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const n of neighbors) {
            if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) continue;
            const tile = map[n.y][n.x];
            if (!tile.passable || tile.unit) continue;

            const newTU = current.tu - tile.tuCost;
            const key = `${n.x},${n.y}`;
            if (newTU >= 0 && (!visited[key] || visited[key] < newTU)) {
                visited[key] = newTU;
                queue.push({ x: n.x, y: n.y, tu: newTU });
            }
        }
    }

    range.delete(`${unit.x},${unit.y}`);
    return range;
}

// Path finding
function findPath(startX, startY, endX, endY) {
    const queue = [{ x: startX, y: startY, path: [], cost: 0 }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift();

        if (current.x === endX && current.y === endY) {
            return current.path;
        }

        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (visited.has(key)) continue;
            if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) continue;

            const tile = map[n.y][n.x];
            if (!tile.passable) continue;
            if (tile.unit && !(n.x === endX && n.y === endY)) continue;

            visited.add(key);
            const newPath = [...current.path, { x: n.x, y: n.y }];
            queue.push({ x: n.x, y: n.y, path: newPath, cost: current.cost + tile.tuCost });
        }
    }

    return null;
}

// Execute attack
function executeAttack(attacker, target, shotType) {
    const weaponKey = attacker.weapon || 'plasmaRifle';
    const weapon = WEAPONS[weaponKey];
    const shot = shotType === 'snap' ? weapon.snapShot :
                 shotType === 'aimed' ? weapon.aimedShot : weapon.autoShot;

    if (!shot) return;

    const attackerTU = attacker.stats?.tuBase || attacker.tu;
    const tuCost = Math.floor(attackerTU * shot.tuPercent);

    const currentTU = attacker.stats?.tuCurrent !== undefined ? attacker.stats.tuCurrent : attacker.tuCurrent;
    if (currentTU < tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    // Deduct TU
    if (attacker.stats) {
        attacker.stats.tuCurrent -= tuCost;
    } else {
        attacker.tuCurrent -= tuCost;
    }

    // Calculate hit chance
    let baseAccuracy = attacker.stats?.firingAccuracy ? attacker.stats.firingAccuracy / 100 : attacker.accuracy;

    // Kneeling bonus for soldiers
    if (attacker.stance === 'kneeling') {
        baseAccuracy *= 1.15;
    }

    // Wounded penalty for soldiers
    if (attacker.stats) {
        baseAccuracy *= getWoundedPenalty(attacker);
    }

    // Night mission penalty
    if (isNightMission) {
        baseAccuracy *= 0.8;
    }

    // Target cover penalty
    const coverBonus = getCoverBonus(target.x, target.y, attacker.x, attacker.y);
    const coverPenalty = 1 - coverBonus;

    const hitChance = Math.min(0.95, Math.max(0.05, baseAccuracy * shot.accuracy * coverPenalty));

    // Fire rounds
    const rounds = shot.rounds || 1;
    let anyHit = false;

    for (let i = 0; i < rounds; i++) {
        // Create bullet
        bullets.push({
            x: attacker.x,
            y: attacker.y,
            targetX: target.x,
            targetY: target.y,
            speed: 0.4,
            progress: 0,
            hit: Math.random() < hitChance
        });

        if (bullets[bullets.length - 1].hit) {
            anyHit = true;
            const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
            const targetArmor = target.armor || 0;
            const finalDamage = Math.max(1, damage - targetArmor);

            if (target.stats) {
                target.stats.healthCurrent -= finalDamage;
                addMessage(`${target.name} hit for ${finalDamage} damage!`);
                if (target.stats.healthCurrent <= 0) {
                    target.alive = false;
                    map[target.y][target.x].unit = null;
                    addMessage(`${target.name} KIA!`);
                }
            } else {
                target.healthCurrent -= finalDamage;
                addMessage(`${target.name} hit for ${finalDamage}!`);
                if (target.healthCurrent <= 0) {
                    target.alive = false;
                    map[target.y][target.x].unit = null;
                    kills++;
                    addMessage(`${target.name} eliminated!`);

                    // Track kill for soldier
                    if (attacker.stats && attacker.experience) {
                        attacker.experience.kills++;
                        checkRankPromotion(attacker);
                    }

                    // Cyberdisc explosion on death
                    if (target.explodes) {
                        triggerCyberdiscExplosion(target);
                    }
                }
            }
        }
    }

    if (!anyHit) {
        addMessage('Shot missed!');
    }

    // Handle explosive weapons (rockets)
    if (weapon.explosive && anyHit) {
        createExplosion(target.x, target.y, weapon.damage, weapon.radius);
    }

    // Deduct ammo
    if (attacker.ammo !== undefined && weapon.ammoCapacity < 100) {
        attacker.ammo = Math.max(0, attacker.ammo - rounds);
    }
}

// Create explosion effect
function createExplosion(x, y, damage, radius) {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        damage: damage,
        time: Date.now(),
        duration: 500
    });

    // Damage units and terrain in radius
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius) continue;

            const tx = x + dx;
            const ty = y + dy;
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

            const tile = map[ty][tx];
            const falloff = 1 - (dist / radius);
            const actualDamage = Math.floor(damage * falloff);

            // Damage unit
            if (tile.unit) {
                const unit = tile.unit;
                const armor = unit.armorValue || unit.armor || 0;
                const finalDamage = Math.max(1, actualDamage - armor);

                if (unit.stats) {
                    unit.stats.healthCurrent -= finalDamage;
                    addMessage(`${unit.name} hit by explosion for ${finalDamage}!`);
                    if (unit.stats.healthCurrent <= 0) {
                        unit.alive = false;
                        tile.unit = null;
                        addMessage(`${unit.name} KIA!`);
                    }
                } else {
                    unit.healthCurrent -= finalDamage;
                    addMessage(`${unit.name} hit for ${finalDamage}!`);
                    if (unit.healthCurrent <= 0) {
                        unit.alive = false;
                        tile.unit = null;
                        kills++;
                        addMessage(`${unit.name} eliminated!`);
                    }
                }
            }

            // Damage destructible terrain
            if (tile.destructible && tile.hp > 0) {
                tile.hp -= actualDamage;
                if (tile.hp <= 0) {
                    // Convert to rubble
                    map[ty][tx] = { ...TERRAIN.RUBBLE, x: tx, y: ty, unit: tile.unit, smoke: tile.smoke, hp: 0 };
                }
            }
        }
    }
}

// Throw grenade
function throwGrenade(thrower, targetX, targetY, grenadeType) {
    const item = ITEMS[grenadeType];
    if (!item) return;

    // Check TU
    if (thrower.stats.tuCurrent < item.tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    // Remove from inventory
    const idx = thrower.inventory.indexOf(grenadeType);
    if (idx === -1) {
        addMessage('No grenade in inventory!');
        return;
    }
    thrower.inventory.splice(idx, 1);
    thrower.stats.tuCurrent -= item.tuCost;

    // Calculate scatter based on throwing accuracy
    const dist = Math.sqrt(Math.pow(targetX - thrower.x, 2) + Math.pow(targetY - thrower.y, 2));
    const scatter = Math.floor((100 - thrower.stats.throwingAccuracy) / 20 * (dist / 5));

    const finalX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + Math.floor(Math.random() * scatter * 2) - scatter));
    const finalY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + Math.floor(Math.random() * scatter * 2) - scatter));

    if (item.type === 'grenade') {
        createExplosion(finalX, finalY, item.damage, item.radius);
        addMessage('Grenade explodes!');
    } else if (item.type === 'smoke') {
        // Create smoke cloud
        for (let dy = -item.radius; dy <= item.radius; dy++) {
            for (let dx = -item.radius; dx <= item.radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > item.radius) continue;

                const sx = finalX + dx;
                const sy = finalY + dy;
                if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT) {
                    map[sy][sx].smoke = 3; // 3 turns of smoke
                }
            }
        }
        smokeEffects.push({ x: finalX, y: finalY, radius: item.radius, turns: 3 });
        addMessage('Smoke grenade deployed!');
    }

    calculateVisibility();
}

// Use medi-kit
function useMediKit(user, target) {
    const idx = user.inventory.indexOf('mediKit');
    if (idx === -1) {
        addMessage('No medi-kit!');
        return;
    }

    if (user.stats.tuCurrent < ITEMS.mediKit.tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    // Must be adjacent
    const dist = Math.abs(user.x - target.x) + Math.abs(user.y - target.y);
    if (dist > 1) {
        addMessage('Must be adjacent!');
        return;
    }

    user.inventory.splice(idx, 1);
    user.stats.tuCurrent -= ITEMS.mediKit.tuCost;

    const heal = Math.min(ITEMS.mediKit.healAmount, target.stats.healthBase - target.stats.healthCurrent);
    target.stats.healthCurrent += heal;
    addMessage(`${target.name} healed for ${heal} HP!`);
}

// Check reaction fire from overwatching soldiers
function checkReactionFire(movingUnit) {
    if (!aliens.includes(movingUnit)) return; // Only aliens trigger reaction fire

    soldiers.forEach(soldier => {
        if (!soldier.alive || !soldier.overwatching) return;

        // Check if soldier can see the moving alien
        if (!hasLineOfSight(soldier.x, soldier.y, movingUnit.x, movingUnit.y)) return;

        // Reaction check
        const reactionChance = soldier.stats.reactions / 100;
        if (Math.random() < reactionChance) {
            // Fire snap shot
            addMessage(`${soldier.name} reaction fire!`);
            executeAttack(soldier, movingUnit, 'snap');
        }
    });
}

// Get cover bonus for a unit at a position
function getCoverBonus(unitX, unitY, attackerX, attackerY) {
    // Check tiles between attacker and target for cover
    const dx = Math.sign(attackerX - unitX);
    const dy = Math.sign(attackerY - unitY);

    // Check adjacent tiles in direction of attacker
    const checkX = unitX + dx;
    const checkY = unitY + dy;

    if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
        const coverTile = map[checkY][checkX];
        if (coverTile.cover > 0) {
            return coverTile.cover;
        }
    }

    // Check smoke
    if (map[unitY][unitX].smoke > 0) {
        return 0.3; // 30% cover from smoke
    }

    return 0;
}

// Move unit
function moveUnit(unit, path) {
    if (!path || path.length === 0) return;

    for (const step of path) {
        const tile = map[step.y][step.x];
        const currentTU = unit.stats?.tuCurrent !== undefined ? unit.stats.tuCurrent : unit.tuCurrent;
        if (currentTU < tile.tuCost) break;

        // Update map
        map[unit.y][unit.x].unit = null;
        unit.x = step.x;
        unit.y = step.y;
        map[step.y][step.x].unit = unit;

        // Deduct TU
        if (unit.stats) {
            unit.stats.tuCurrent -= tile.tuCost;
        } else {
            unit.tuCurrent -= tile.tuCost;
        }

        // Check for reaction fire (if alien moving)
        if (aliens.includes(unit)) {
            checkReactionFire(unit);
            checkProximityMines(unit);
            if (!unit.alive) break; // Stop if killed by reaction fire or mine
        }
    }

    calculateVisibility();
}

// Find best cover position near target
function findCoverPosition(alien, target) {
    const range = 6;
    let bestPos = null;
    let bestScore = -Infinity;

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            const tx = alien.x + dx;
            const ty = alien.y + dy;

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
            const tile = map[ty][tx];
            if (!tile.passable || tile.unit) continue;

            // Score based on cover, distance to target, line of sight
            const distToTarget = Math.abs(tx - target.x) + Math.abs(ty - target.y);
            const hasSight = hasLineOfSight(tx, ty, target.x, target.y);
            const nearCover = getCoverBonus(tx, ty, target.x, target.y);

            let score = 0;
            if (hasSight) score += 50;
            score += nearCover * 30;
            score -= Math.abs(distToTarget - 5) * 2; // Prefer medium distance

            if (score > bestScore) {
                bestScore = score;
                bestPos = { x: tx, y: ty };
            }
        }
    }

    return bestPos;
}

// Alien AI turn
function alienTurn() {
    gameState = 'alienTurn';

    // Decrement smoke timers
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].smoke > 0) {
                map[y][x].smoke--;
            }
        }
    }

    // Fire effects
    spreadFire();
    applyFireDamage();

    // Update zombies
    zombies.forEach(zombie => {
        if (!zombie.alive) return;
        zombie.turnsToHatch--;
        if (zombie.turnsToHatch <= 0) {
            hatchChryssalid(zombie);
        } else {
            // Zombie attacks adjacent soldiers
            soldiers.forEach(soldier => {
                if (!soldier.alive) return;
                const dist = Math.abs(zombie.x - soldier.x) + Math.abs(zombie.y - soldier.y);
                if (dist <= 1) {
                    soldier.stats.healthCurrent -= zombie.meleeDamage;
                    addMessage(`Zombie attacks ${soldier.name} for ${zombie.meleeDamage}!`);
                    if (soldier.stats.healthCurrent <= 0) {
                        soldier.alive = false;
                        map[soldier.y][soldier.x].unit = null;
                        addMessage(`${soldier.name} KIA!`);
                    }
                }
            });
        }
    });

    // Clean up dead zombies
    zombies = zombies.filter(z => z.alive);

    aliens.forEach(alien => {
        if (!alien.alive) return;

        // Reset TU
        alien.tuCurrent = alien.tu;

        // Find closest visible soldier
        let closestSoldier = null;
        let closestDist = Infinity;

        soldiers.forEach(soldier => {
            if (!soldier.alive) return;
            if (hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) {
                const dist = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestSoldier = soldier;
                }
            }
        });

        if (closestSoldier) {
            // Psionic aliens try psi attack first
            if (alien.psionic && closestDist <= 15 && Math.random() < 0.4) {
                executePsionicAttack(alien, closestSoldier);
            }

            const weapon = WEAPONS[alien.weapon || 'plasmaRifle'];

            // Chryssalid melee behavior
            if (alien.meleeDamage) {
                // Move towards soldier and attack if adjacent
                if (closestDist <= 1) {
                    // Melee attack
                    const damage = alien.meleeDamage;
                    closestSoldier.stats.healthCurrent -= damage;
                    addMessage(`${alien.name} attacks ${closestSoldier.name} for ${damage}!`);
                    if (closestSoldier.stats.healthCurrent <= 0) {
                        closestSoldier.alive = false;
                        map[closestSoldier.y][closestSoldier.x].unit = null;
                        addMessage(`${closestSoldier.name} KIA!`);
                        // Chryssalid zombify
                        if (alien.zombify) {
                            createZombie(closestSoldier.x, closestSoldier.y, closestSoldier.name);
                        }
                    }
                    alien.tuCurrent -= 20;
                } else {
                    // Rush towards soldier
                    const path = findPath(alien.x, alien.y, closestSoldier.x, closestSoldier.y);
                    if (path && path.length > 0) {
                        const maxSteps = Math.floor(alien.tuCurrent / 3);
                        const movePath = path.slice(0, Math.min(maxSteps, path.length - 1));
                        moveUnit(alien, movePath);
                    }
                }
            } else {
                // Ranged alien behavior
                // Attack if can see and have enough TU
                if (closestDist <= 15 && alien.tuCurrent >= 20) {
                    // Choose shot type based on distance
                    const shotType = closestDist > 8 ? 'aimed' : 'snap';
                    executeAttack(alien, closestSoldier, shotType);
                }

                // Seek cover if low HP or no shot taken
                if (alien.healthCurrent < alien.health * 0.5 && alien.tuCurrent > 15) {
                    const coverPos = findCoverPosition(alien, closestSoldier);
                    if (coverPos) {
                        const path = findPath(alien.x, alien.y, coverPos.x, coverPos.y);
                        if (path && path.length > 0) {
                            const maxSteps = Math.floor(alien.tuCurrent / 5);
                            const movePath = path.slice(0, Math.min(maxSteps, path.length));
                            moveUnit(alien, movePath);
                        }
                    }
                } else if (alien.tuCurrent > 20) {
                    // Move towards soldier but not too close
                    const path = findPath(alien.x, alien.y, closestSoldier.x, closestSoldier.y);
                    if (path && path.length > 3) {
                        const maxSteps = Math.floor(alien.tuCurrent / 5);
                        const movePath = path.slice(0, Math.min(maxSteps, path.length - 2));
                        moveUnit(alien, movePath);
                    }
                }
            }
        } else {
            // Patrol towards last known soldier position or random
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = alien.x + dir[0] * 2;
            const ny = alien.y + dir[1] * 2;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const path = findPath(alien.x, alien.y, nx, ny);
                if (path && path.length > 0) {
                    const movePath = path.slice(0, Math.min(3, path.length));
                    moveUnit(alien, movePath);
                }
            }
        }
    });

    // Check victory/defeat
    checkGameOver();

    if (gameState === 'alienTurn') {
        startPlayerTurn();
    }
}

// Start player turn
function startPlayerTurn() {
    currentTurn++;
    gameState = 'playerTurn';

    soldiers.forEach(soldier => {
        if (soldier.alive) {
            soldier.stats.tuCurrent = soldier.stats.tuBase;
            soldier.overwatching = false;
        }
    });

    calculateVisibility();
    addMessage(`Turn ${currentTurn} - Your turn`);

    // Select first available soldier
    const firstAlive = soldiers.find(s => s.alive);
    if (firstAlive) {
        selectSoldier(firstAlive);
    }
}

// Select soldier
function selectSoldier(soldier) {
    soldiers.forEach(s => s.selected = false);
    soldier.selected = true;
    selectedUnit = soldier;
    targetMode = null;
}

// Check game over
function checkGameOver() {
    const aliensAlive = aliens.filter(a => a.alive).length;
    const soldiersAlive = soldiers.filter(s => s.alive).length;

    if (aliensAlive === 0) {
        gameState = 'victory';
        addMessage('MISSION COMPLETE!');
    } else if (soldiersAlive === 0) {
        gameState = 'defeat';
        addMessage('MISSION FAILED');
    }
}

// Add message
function addMessage(text) {
    messages.push({ text: text, time: Date.now() });
    if (messages.length > 6) messages.shift();
}

// Create UI buttons
function createUIButtons() {
    const btnW = 2.0;
    const btnH = 1.2;
    const startX = -11;
    const btnY = -MAP_HEIGHT/2 - 2;

    uiButtons = [
        { id: 'move', label: 'MOVE', icon: '>', x: startX, y: btnY, w: btnW, h: btnH, tooltip: 'Move soldier (1)' },
        { id: 'snap', label: 'SNAP', icon: '*', x: startX + 2.2, y: btnY, w: btnW, h: btnH, tooltip: 'Quick shot (2)' },
        { id: 'aimed', label: 'AIM', icon: '+', x: startX + 4.4, y: btnY, w: btnW, h: btnH, tooltip: 'Aimed shot (3)' },
        { id: 'auto', label: 'AUTO', icon: '***', x: startX + 6.6, y: btnY, w: btnW, h: btnH, tooltip: '3-round burst (4)' },
        { id: 'grenade', label: 'GREN', icon: 'O', x: startX + 8.8, y: btnY, w: btnW, h: btnH, tooltip: 'Throw grenade (5)' },
        { id: 'heal', label: 'HEAL', icon: '+', x: startX + 11, y: btnY, w: btnW, h: btnH, tooltip: 'Use medi-kit (6)' },
        { id: 'kneel', label: 'KNEEL', icon: 'v', x: startX + 13.2, y: btnY, w: btnW, h: btnH, tooltip: 'Toggle stance (K)' },
        { id: 'overwatch', label: 'WATCH', icon: '()', x: startX + 15.4, y: btnY, w: btnW, h: btnH, tooltip: 'Overwatch (W)' },
        { id: 'next', label: 'NEXT', icon: '>>', x: startX + 17.6, y: btnY, w: btnW, h: btnH, tooltip: 'Next unit (Tab)' },
        { id: 'end', label: 'END', icon: '[]', x: startX + 19.8, y: btnY, w: btnW, h: btnH, tooltip: 'End turn (Enter)' }
    ];
}

// Convert screen to tile coords
function screenToTile(screenPos) {
    const tileX = Math.floor(screenPos.x + MAP_WIDTH/2);
    const tileY = Math.floor(screenPos.y + MAP_HEIGHT/2);
    return { x: tileX, y: tileY };
}

// Convert tile to screen coords
function tileToScreen(tx, ty) {
    return vec2(tx - MAP_WIDTH/2 + 0.5, ty - MAP_HEIGHT/2 + 0.5);
}

// Initialize game
function gameInit() {
    // Set canvas size for tactical view
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 32;
    cameraPos = vec2(0, -2);
    createUIButtons();
}

// Update game
function gameUpdate() {
    if (gameState === 'title') {
        if (mouseWasPressed(0) || keyWasPressed('Space')) {
            // Reset all game state
            kills = 0;
            civiliansRescued = 0;
            civiliansLost = 0;
            fireTiles = [];
            proximityMines = [];
            scannedTiles = new Set();
            groundItems = [];
            alienCorpses = [];
            stunedAliens = [];
            zombies = [];
            currentTurn = 1;
            messages = [];

            // Randomize mission type
            const missionTypes = ['crashSite', 'groundAssault', 'terrorMission'];
            missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];

            // Randomize difficulty
            const difficulties = ['easy', 'normal', 'normal', 'veteran', 'superhuman'];
            difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

            generateMap();
            initializeSoldiers();
            initializeAliens();
            calculateVisibility();
            startPlayerTurn();
        }
        return;
    }

    if (gameState === 'victory' || gameState === 'defeat') {
        if (mouseWasPressed(0) || keyWasPressed('Space')) {
            gameState = 'title';
            currentTurn = 1;
        }
        return;
    }

    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.progress += bullet.speed;
        return bullet.progress < 1;
    });

    // Update explosions
    explosions = explosions.filter(exp => {
        return Date.now() - exp.time < exp.duration;
    });

    // Get mouse position in world coords
    const worldMouse = mousePos;
    const tile = screenToTile(worldMouse);

    if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
        hoveredTile = tile;
    } else {
        hoveredTile = null;
    }

    // Check UI button hover
    hoveredButton = null;
    for (const btn of uiButtons) {
        if (worldMouse.x >= btn.x && worldMouse.x <= btn.x + btn.w &&
            worldMouse.y >= btn.y && worldMouse.y <= btn.y + btn.h) {
            hoveredButton = btn;
            break;
        }
    }

    // Handle player turn input
    if (gameState === 'playerTurn') {
        if (mouseWasPressed(0)) {
            if (hoveredButton) {
                handleButtonClick(hoveredButton.id);
            } else if (hoveredTile) {
                handleMapClick(hoveredTile.x, hoveredTile.y);
            }
        }

        // Keyboard shortcuts
        if (keyWasPressed('Digit1')) { handleButtonClick('move'); }
        if (keyWasPressed('Digit2')) { handleButtonClick('snap'); }
        if (keyWasPressed('Digit3')) { handleButtonClick('aimed'); }
        if (keyWasPressed('Digit4')) { handleButtonClick('auto'); }
        if (keyWasPressed('Digit5')) { handleButtonClick('grenade'); }
        if (keyWasPressed('Digit6')) { handleButtonClick('heal'); }
        if (keyWasPressed('KeyK')) { handleButtonClick('kneel'); }
        if (keyWasPressed('KeyW')) { handleButtonClick('overwatch'); }
        if (keyWasPressed('Tab')) { handleButtonClick('next'); }
        if (keyWasPressed('Enter')) { handleButtonClick('end'); }
        if (keyWasPressed('Escape')) { targetMode = null; }
    }
}

// Handle button click
function handleButtonClick(buttonId) {
    switch (buttonId) {
        case 'move':
            targetMode = 'move';
            addMessage('Select destination');
            break;
        case 'snap':
            if (selectedUnit && WEAPONS[selectedUnit.weapon].snapShot) {
                targetMode = 'snap';
                addMessage('Select target for snap shot');
            }
            break;
        case 'aimed':
            if (selectedUnit && WEAPONS[selectedUnit.weapon].aimedShot) {
                targetMode = 'aimed';
                addMessage('Select target for aimed shot');
            }
            break;
        case 'auto':
            if (selectedUnit && WEAPONS[selectedUnit.weapon].autoShot) {
                targetMode = 'auto';
                addMessage('Select target for auto fire');
            } else {
                addMessage('Weapon has no auto mode');
            }
            break;
        case 'grenade':
            if (selectedUnit) {
                const hasGrenade = selectedUnit.inventory.includes('fragGrenade') || selectedUnit.inventory.includes('smokeGrenade');
                if (hasGrenade) {
                    targetMode = 'grenade';
                    addMessage('Select target for grenade');
                } else {
                    addMessage('No grenades in inventory!');
                }
            }
            break;
        case 'heal':
            if (selectedUnit) {
                if (selectedUnit.inventory.includes('mediKit')) {
                    targetMode = 'heal';
                    addMessage('Select adjacent soldier to heal');
                } else {
                    addMessage('No medi-kit in inventory!');
                }
            }
            break;
        case 'kneel':
            if (selectedUnit) {
                const tuCost = selectedUnit.stance === 'standing' ? 4 : 8;
                if (selectedUnit.stats.tuCurrent >= tuCost) {
                    selectedUnit.stance = selectedUnit.stance === 'standing' ? 'kneeling' : 'standing';
                    selectedUnit.stats.tuCurrent -= tuCost;
                    addMessage(selectedUnit.stance === 'kneeling' ? 'Kneeling (+15% acc)' : 'Standing');
                } else {
                    addMessage('Not enough TU!');
                }
            }
            break;
        case 'overwatch':
            if (selectedUnit && selectedUnit.stats.tuCurrent >= 10) {
                selectedUnit.overwatching = true;
                selectedUnit.stats.tuCurrent -= 10;
                addMessage(`${selectedUnit.name} on overwatch`);
            } else {
                addMessage('Need 10 TU for overwatch');
            }
            break;
        case 'next':
            const aliveSoldiers = soldiers.filter(s => s.alive);
            if (aliveSoldiers.length > 0) {
                const currentIndex = aliveSoldiers.indexOf(selectedUnit);
                const nextIndex = (currentIndex + 1) % aliveSoldiers.length;
                selectSoldier(aliveSoldiers[nextIndex]);
                addMessage(`Selected ${aliveSoldiers[nextIndex].name}`);
            }
            break;
        case 'end':
            targetMode = null;
            addMessage('Alien turn...');
            alienTurn();
            break;
    }
}

// Handle map click
function handleMapClick(tx, ty) {
    const tile = map[ty][tx];

    // Check if clicking on a soldier to select
    if (tile.unit && soldiers.includes(tile.unit) && tile.unit.alive) {
        if (targetMode === 'heal') {
            // Heal clicked soldier
            useMediKit(selectedUnit, tile.unit);
            targetMode = null;
            return;
        }
        selectSoldier(tile.unit);
        targetMode = null;
        addMessage(`Selected ${tile.unit.name}`);
        return;
    }

    if (!selectedUnit || !selectedUnit.alive) return;

    // Handle target mode
    if (targetMode === 'move') {
        if (tile.passable && !tile.unit) {
            const path = findPath(selectedUnit.x, selectedUnit.y, tx, ty);
            if (path) {
                // Check if we have enough TU
                let totalCost = 0;
                for (const step of path) {
                    totalCost += map[step.y][step.x].tuCost;
                }
                if (totalCost <= selectedUnit.stats.tuCurrent) {
                    moveUnit(selectedUnit, path);
                    targetMode = null;
                } else {
                    addMessage('Not enough TU for full path');
                    // Move as far as possible
                    const partialPath = [];
                    let cost = 0;
                    for (const step of path) {
                        const stepCost = map[step.y][step.x].tuCost;
                        if (cost + stepCost <= selectedUnit.stats.tuCurrent) {
                            partialPath.push(step);
                            cost += stepCost;
                        } else break;
                    }
                    if (partialPath.length > 0) {
                        moveUnit(selectedUnit, partialPath);
                    }
                    targetMode = null;
                }
            } else {
                addMessage('Cannot reach destination');
            }
        }
    } else if (targetMode === 'snap' || targetMode === 'aimed' || targetMode === 'auto') {
        // Check for alien target
        if (tile.unit && aliens.includes(tile.unit) && tile.unit.alive) {
            if (hasLineOfSight(selectedUnit.x, selectedUnit.y, tx, ty)) {
                executeAttack(selectedUnit, tile.unit, targetMode);
                targetMode = null;
                checkGameOver();
            } else {
                addMessage('No line of sight!');
            }
        } else {
            addMessage('No valid target');
        }
    } else if (targetMode === 'grenade') {
        // Throw grenade at clicked tile
        const grenadeType = selectedUnit.inventory.includes('fragGrenade') ? 'fragGrenade' : 'smokeGrenade';
        throwGrenade(selectedUnit, tx, ty, grenadeType);
        targetMode = null;
        checkGameOver();
    } else if (targetMode === 'heal') {
        addMessage('Click on an adjacent soldier');
    }
}

// Render game
function gameRender() {
    // Clear background
    drawRect(cameraPos, vec2(100, 100), COLORS.background);

    if (gameState === 'title') {
        renderTitle();
        return;
    }

    if (gameState === 'victory' || gameState === 'defeat') {
        renderEndScreen();
        return;
    }

    renderMap();
    renderSmoke();
    renderUnits();
    renderBullets();
    renderExplosions();

    // Night overlay
    if (isNightMission) {
        drawRect(cameraPos, vec2(100, 100), new Color(0, 0, 0.1, 0.4));
    }

    renderUI();
}

// Render title screen
function renderTitle() {
    drawText('X-COM CLASSIC', cameraPos.add(vec2(0, 5)), 1.5, COLORS.uiText, 0.1, undefined, 'center');
    drawText('Turn-Based Tactical Combat', cameraPos.add(vec2(0, 3.5)), 0.6, COLORS.uiTextDim, 0.05, undefined, 'center');

    // Mission info
    drawText(`Mission: ${MISSION_TYPES[missionType].name}`, cameraPos.add(vec2(0, 2)), 0.4, new Color(0.9, 0.7, 0.3), 0.03, undefined, 'center');
    drawText(`Difficulty: ${difficulty.toUpperCase()}`, cameraPos.add(vec2(0, 1.5)), 0.35, new Color(0.7, 0.7, 0.9), 0.025, undefined, 'center');

    drawText('CLICK TO START', cameraPos.add(vec2(0, 0)), 0.8, new Color(0.5, 0.8, 1), 0.05, undefined, 'center');

    drawText('Controls:', cameraPos.add(vec2(0, -1.5)), 0.5, COLORS.uiText, 0.03, undefined, 'center');
    drawText('Click soldiers to select | Click buttons for actions', cameraPos.add(vec2(0, -2.3)), 0.35, COLORS.uiTextDim, 0.02, undefined, 'center');
    drawText('1-6: Actions | K: Kneel | W: Overwatch | Tab: Next | Enter: End', cameraPos.add(vec2(0, -2.9)), 0.35, COLORS.uiTextDim, 0.02, undefined, 'center');

    // Features
    drawText('Features: Fire/Smoke | Mines | Psionic | Zombify | Night Missions', cameraPos.add(vec2(0, -4)), 0.3, new Color(0.5, 0.7, 0.5), 0.015, undefined, 'center');
}

// Render end screen
function renderEndScreen() {
    const title = gameState === 'victory' ? 'MISSION COMPLETE!' : 'MISSION FAILED';
    const color = gameState === 'victory' ? new Color(0.3, 0.9, 0.4) : new Color(0.9, 0.3, 0.3);

    drawText(title, cameraPos.add(vec2(0, 6)), 1.2, color, 0.1, undefined, 'center');
    drawText(MISSION_TYPES[missionType].name, cameraPos.add(vec2(0, 4.8)), 0.5, COLORS.uiTextDim, 0.03, undefined, 'center');
    if (isNightMission) {
        drawText('(Night Mission)', cameraPos.add(vec2(0, 4.3)), 0.35, new Color(0.4, 0.4, 0.7), 0.02, undefined, 'center');
    }

    const aliensKilled = aliens.filter(a => !a.alive && !a.stunned).length;
    const aliensCaptured = stunedAliens.length;
    const totalAliens = aliens.length;
    const soldiersLost = soldiers.filter(s => !s.alive).length;
    const totalSoldiers = soldiers.length;
    const soldiersAlive = soldiers.filter(s => s.alive);

    // Statistics box
    drawRect(cameraPos.add(vec2(0, 0.8)), vec2(12, 6.5), new Color(0.1, 0.1, 0.15, 0.9));

    drawText('MISSION STATISTICS', cameraPos.add(vec2(0, 3.5)), 0.45, COLORS.uiText, 0.02, undefined, 'center');

    drawText(`Aliens Eliminated: ${aliensKilled}/${totalAliens}`, cameraPos.add(vec2(0, 2.7)), 0.32, new Color(0.9, 0.5, 0.3), 0.018, undefined, 'center');
    drawText(`Aliens Captured: ${aliensCaptured}`, cameraPos.add(vec2(0, 2.3)), 0.32, new Color(0.3, 0.9, 0.6), 0.018, undefined, 'center');
    drawText(`Soldiers Lost: ${soldiersLost}/${totalSoldiers}`, cameraPos.add(vec2(0, 1.9)), 0.32, soldiersLost > 0 ? COLORS.health : COLORS.healthFull, 0.018, undefined, 'center');
    drawText(`Civilians Saved: ${civiliansRescued}`, cameraPos.add(vec2(0, 1.5)), 0.32, new Color(0.8, 0.8, 0.5), 0.018, undefined, 'center');
    drawText(`Total Turns: ${currentTurn}`, cameraPos.add(vec2(0, 1.1)), 0.32, COLORS.uiText, 0.018, undefined, 'center');
    drawText(`Kills This Mission: ${kills}`, cameraPos.add(vec2(0, 0.7)), 0.32, COLORS.uiText, 0.018, undefined, 'center');

    // Scoring
    const baseScore = gameState === 'victory' ? 100 : 0;
    const killScore = kills * 10;
    const captureScore = aliensCaptured * 30;
    const lossScore = -soldiersLost * 25;
    const turnBonus = Math.max(0, (20 - currentTurn) * 5);
    const nightBonus = isNightMission && gameState === 'victory' ? 25 : 0;
    const civilianBonus = civiliansRescued * 15;
    const totalScore = baseScore + killScore + captureScore + lossScore + turnBonus + nightBonus + civilianBonus;

    drawText(`Score: ${totalScore}`, cameraPos.add(vec2(0, 0)), 0.55, new Color(1, 1, 0.5), 0.03, undefined, 'center');
    drawText(`(Kills: +${killScore} | Captures: +${captureScore} | Night: +${nightBonus})`, cameraPos.add(vec2(0, -0.5)), 0.22, COLORS.uiTextDim, 0.012, undefined, 'center');

    // Surviving soldiers
    if (soldiersAlive.length > 0) {
        drawText('Survivors:', cameraPos.add(vec2(0, -1.2)), 0.3, COLORS.uiTextDim, 0.02, undefined, 'center');
        let survX = -3;
        soldiersAlive.slice(0, 4).forEach((s, i) => {
            const expText = s.experience.kills > 0 ? ` (${s.experience.kills}K)` : '';
            drawText(s.rank[0] + '. ' + s.name + expText, cameraPos.add(vec2(survX + i * 2.5, -1.6)), 0.22, COLORS.uiText, 0.012, undefined, 'center');
        });
    }

    // Difficulty rating
    const rating = totalScore >= 200 ? 'EXCELLENT' : totalScore >= 100 ? 'GOOD' : totalScore >= 50 ? 'ADEQUATE' : 'POOR';
    const ratingColor = totalScore >= 200 ? new Color(0.9, 0.8, 0.2) : totalScore >= 100 ? new Color(0.3, 0.9, 0.4) : totalScore >= 50 ? new Color(0.7, 0.7, 0.5) : new Color(0.9, 0.4, 0.3);
    drawText(`Rating: ${rating}`, cameraPos.add(vec2(0, -2.3)), 0.4, ratingColor, 0.025, undefined, 'center');

    drawText('CLICK TO CONTINUE', cameraPos.add(vec2(0, -3.5)), 0.4, COLORS.uiTextDim, 0.02, undefined, 'center');
}

// Render map
function renderMap() {
    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const pos = tileToScreen(x, y);

            // Base tile
            let tileColor = tile.color;

            // Fog of war
            const isVisible = visibleTiles.has(`${x},${y}`);
            if (!isVisible) {
                tileColor = new Color(
                    tileColor.r * 0.3,
                    tileColor.g * 0.3,
                    tileColor.b * 0.3
                );
            }

            drawRect(pos, vec2(0.95, 0.95), tileColor);

            // Draw wall/cover indicators
            if (tile.name === 'Wall') {
                drawRect(pos, vec2(0.7, 0.7), COLORS.wall.lerp(new Color(0.2, 0.2, 0.2), 0.3));
            } else if (tile.name === 'Cover') {
                drawRect(pos, vec2(0.4, 0.4), new Color(0.4, 0.5, 0.3));
            } else if (tile.name === 'Door') {
                drawRect(pos, vec2(0.3, 0.7), COLORS.door);
            }
        }
    }

    // Draw movement range
    if (selectedUnit && targetMode === 'move') {
        const moveRange = getMovementRange(selectedUnit);
        moveRange.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const pos = tileToScreen(x, y);
            drawRect(pos, vec2(0.9, 0.9), COLORS.moveRange);
        });
    }

    // Draw attack range when in attack mode
    if (selectedUnit && (targetMode === 'snap' || targetMode === 'aimed' || targetMode === 'auto')) {
        aliens.forEach(alien => {
            if (alien.alive && alien.spotted) {
                const pos = tileToScreen(alien.x, alien.y);
                if (hasLineOfSight(selectedUnit.x, selectedUnit.y, alien.x, alien.y)) {
                    drawRect(pos, vec2(1, 1), COLORS.attackRange);
                }
            }
        });
    }

    // Draw fire tiles
    fireTiles.forEach(fire => {
        const pos = tileToScreen(fire.x, fire.y);
        const flicker = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        drawRect(pos, vec2(0.8, 0.8), new Color(0.9 * flicker, 0.4 * flicker, 0.1, 0.8));
    });

    // Draw proximity mines (for player visibility)
    proximityMines.forEach(mine => {
        const pos = tileToScreen(mine.x, mine.y);
        drawRect(pos, vec2(0.3, 0.3), new Color(0.9, 0.2, 0.2));
        drawText('X', pos, 0.25, new Color(1, 1, 1), 0.015, undefined, 'center');
    });

    // Draw ground items
    groundItems.forEach(gi => {
        const pos = tileToScreen(gi.x, gi.y);
        const item = ITEMS[gi.item];
        if (item) {
            drawRect(pos.add(vec2(0.3, -0.3)), vec2(0.25, 0.25), new Color(0.8, 0.8, 0.2));
        }
    });

    // Highlight hovered tile
    if (hoveredTile) {
        const pos = tileToScreen(hoveredTile.x, hoveredTile.y);
        drawRect(pos, vec2(1, 1), COLORS.highlight);
    }
}

// Render units
function renderUnits() {
    // Render soldiers
    soldiers.forEach(soldier => {
        if (!soldier.alive) return;

        const pos = tileToScreen(soldier.x, soldier.y);
        const baseColor = soldier.selected ? COLORS.soldierSelected : COLORS.soldier;
        const size = soldier.stance === 'kneeling' ? 0.55 : 0.7;

        // Selection highlight
        if (soldier.selected) {
            drawRect(pos, vec2(0.9, 0.9), new Color(1, 1, 1, 0.2));
        }

        // Body
        drawRect(pos, vec2(size, size), baseColor);

        // Health bar background
        drawRect(pos.add(vec2(0, 0.55)), vec2(0.8, 0.12), new Color(0.2, 0.1, 0.1));

        // Health bar
        const healthRatio = soldier.stats.healthCurrent / soldier.stats.healthBase;
        const healthColor = healthRatio > 0.5 ? COLORS.healthFull : COLORS.health;
        drawRect(pos.add(vec2((healthRatio - 1) * 0.4, 0.55)), vec2(0.8 * healthRatio, 0.1), healthColor);

        // TU bar
        const tuRatio = soldier.stats.tuCurrent / soldier.stats.tuBase;
        drawRect(pos.add(vec2((tuRatio - 1) * 0.4, 0.45)), vec2(0.8 * tuRatio, 0.08), COLORS.tu);

        // Weapon icon
        const weaponIcon = WEAPONS[soldier.weapon].icon;
        drawText(weaponIcon, pos, 0.4, new Color(1, 1, 1), 0.02, undefined, 'center');

        // Overwatch indicator
        if (soldier.overwatching) {
            drawText('W', pos.add(vec2(0.3, 0.3)), 0.25, new Color(1, 1, 0), 0.02, undefined, 'center');
        }

        // Kneeling indicator
        if (soldier.stance === 'kneeling') {
            drawText('K', pos.add(vec2(-0.3, 0.3)), 0.25, new Color(0.5, 1, 0.5), 0.02, undefined, 'center');
        }
    });

    // Render aliens
    aliens.forEach(alien => {
        if (!alien.alive) return;
        if (!visibleTiles.has(`${alien.x},${alien.y}`)) return;

        const pos = tileToScreen(alien.x, alien.y);

        // Body
        drawRect(pos, vec2(0.7, 0.7), alien.color);

        // Type icon
        drawText(alien.icon, pos, 0.45, new Color(1, 1, 1), 0.02, undefined, 'center');

        // Health bar background
        drawRect(pos.add(vec2(0, 0.55)), vec2(0.8, 0.12), new Color(0.2, 0.1, 0.1));

        // Health bar
        const healthRatio = alien.healthCurrent / alien.health;
        drawRect(pos.add(vec2((healthRatio - 1) * 0.4, 0.55)), vec2(0.8 * healthRatio, 0.1), COLORS.health);
    });

    // Render zombies
    zombies.forEach(zombie => {
        if (!zombie.alive) return;
        if (!visibleTiles.has(`${zombie.x},${zombie.y}`)) return;

        const pos = tileToScreen(zombie.x, zombie.y);
        drawRect(pos, vec2(0.6, 0.6), zombie.color);
        drawText(zombie.icon, pos, 0.4, new Color(0.8, 0.9, 0.8), 0.02, undefined, 'center');

        // Health bar
        const healthRatio = zombie.healthCurrent / zombie.health;
        drawRect(pos.add(vec2((healthRatio - 1) * 0.4, 0.55)), vec2(0.8 * healthRatio, 0.1), new Color(0.5, 0.7, 0.4));

        // Hatch timer
        drawText(`${zombie.turnsToHatch}`, pos.add(vec2(0.3, -0.3)), 0.25, new Color(1, 0.5, 0.5), 0.015, undefined, 'center');
    });

    // Render civilians
    civilians.forEach(civilian => {
        if (!civilian.alive) return;
        if (!visibleTiles.has(`${civilian.x},${civilian.y}`)) return;

        const pos = tileToScreen(civilian.x, civilian.y);
        drawRect(pos, vec2(0.5, 0.5), civilian.color);
        drawText(civilian.icon, pos, 0.35, new Color(0.3, 0.3, 0.3), 0.02, undefined, 'center');

        // Health bar
        const healthRatio = civilian.healthCurrent / civilian.health;
        drawRect(pos.add(vec2((healthRatio - 1) * 0.4, 0.55)), vec2(0.8 * healthRatio, 0.1), new Color(0.9, 0.9, 0.5));
    });
}

// Render bullets
function renderBullets() {
    bullets.forEach(bullet => {
        const x = bullet.x + (bullet.targetX - bullet.x) * bullet.progress;
        const y = bullet.y + (bullet.targetY - bullet.y) * bullet.progress;
        const pos = tileToScreen(x, y);

        const color = bullet.hit ? new Color(1, 1, 0.6) : new Color(1, 0.5, 0.5);
        drawRect(pos, vec2(0.15, 0.15), color);

        // Trail
        const trailX = bullet.x + (bullet.targetX - bullet.x) * (bullet.progress - 0.1);
        const trailY = bullet.y + (bullet.targetY - bullet.y) * (bullet.progress - 0.1);
        const trailPos = tileToScreen(trailX, trailY);
        drawRect(trailPos, vec2(0.1, 0.1), color.lerp(new Color(1, 1, 1, 0), 0.5));
    });
}

// Render explosions
function renderExplosions() {
    explosions.forEach(exp => {
        const progress = (Date.now() - exp.time) / exp.duration;
        const pos = tileToScreen(exp.x, exp.y);
        const size = exp.radius * 2 * (1 - progress * 0.5);
        const alpha = 1 - progress;

        // Fireball
        drawRect(pos, vec2(size, size), new Color(1, 0.6, 0.2, alpha * 0.8));
        drawRect(pos, vec2(size * 0.6, size * 0.6), new Color(1, 0.9, 0.5, alpha));
    });
}

// Render smoke effects
function renderSmoke() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].smoke > 0) {
                const pos = tileToScreen(x, y);
                const alpha = Math.min(0.7, map[y][x].smoke * 0.25);
                drawRect(pos, vec2(0.95, 0.95), new Color(0.6, 0.6, 0.7, alpha));
            }
        }
    }
}

// Render UI
function renderUI() {
    // UI background
    const uiY = -MAP_HEIGHT/2 - 2;
    drawRect(vec2(0, uiY), vec2(MAP_WIDTH + 2, 3.5), COLORS.uiBackground);

    // Draw buttons
    uiButtons.forEach(btn => {
        const isHovered = hoveredButton === btn;
        const isActive = (btn.id === targetMode) ||
                        (btn.id === 'overwatch' && selectedUnit?.overwatching);

        const color = isActive ? COLORS.uiButtonActive :
                     isHovered ? COLORS.uiButtonHover : COLORS.uiButton;

        const btnPos = vec2(btn.x + btn.w/2, btn.y + btn.h/2);

        // Button background
        drawRect(btnPos, vec2(btn.w - 0.1, btn.h - 0.1), color);

        // Icon
        drawText(btn.icon, btnPos.add(vec2(0, 0.15)), 0.35, COLORS.uiText, 0.02, undefined, 'center');

        // Label
        drawText(btn.label, btnPos.add(vec2(0, -0.25)), 0.2, COLORS.uiTextDim, 0.01, undefined, 'center');
    });

    // Selected unit info
    if (selectedUnit) {
        const infoX = 8.5;
        const infoY = uiY;

        // Name and rank
        drawText(`${selectedUnit.rank} ${selectedUnit.name}`, vec2(infoX, infoY + 1.2), 0.35, COLORS.uiText, 0.02);

        // Stats
        drawText(`TU: ${selectedUnit.stats.tuCurrent}/${selectedUnit.stats.tuBase}`, vec2(infoX, infoY + 0.8), 0.28, COLORS.tu, 0.015);
        drawText(`HP: ${selectedUnit.stats.healthCurrent}/${selectedUnit.stats.healthBase}`, vec2(infoX, infoY + 0.5), 0.28, COLORS.healthFull, 0.015);

        // Weapon info
        drawText(`${WEAPONS[selectedUnit.weapon].name}`, vec2(infoX, infoY + 0.15), 0.22, COLORS.uiTextDim, 0.012);
        if (selectedUnit.ammo < 100) {
            drawText(`Ammo: ${selectedUnit.ammo}`, vec2(infoX, infoY - 0.1), 0.22, COLORS.uiTextDim, 0.012);
        }

        // Inventory icons
        if (selectedUnit.inventory.length > 0) {
            let invX = infoX;
            selectedUnit.inventory.forEach((itemKey, i) => {
                const item = ITEMS[itemKey];
                if (item) {
                    const itemColor = itemKey.includes('frag') ? new Color(1, 0.5, 0.3) :
                                     itemKey.includes('smoke') ? new Color(0.6, 0.6, 0.8) :
                                     itemKey.includes('medi') ? new Color(0.3, 0.9, 0.3) : COLORS.uiTextDim;
                    drawText(item.icon, vec2(invX + i * 0.6, infoY - 0.4), 0.3, itemColor, 0.015);
                }
            });
        }

        // Stance indicator
        if (selectedUnit.stance === 'kneeling') {
            drawText('(Kneeling)', vec2(infoX + 2.5, infoY + 0.8), 0.2, new Color(0.5, 1, 0.5), 0.01);
        }
        if (selectedUnit.overwatching) {
            drawText('(Overwatch)', vec2(infoX + 2.5, infoY + 0.5), 0.2, new Color(1, 1, 0.5), 0.01);
        }
    }

    // Turn indicator
    drawText(`Turn ${currentTurn}`, vec2(MAP_WIDTH/2 - 2, uiY + 1.2), 0.35, COLORS.uiText, 0.02);

    // Mission info
    if (isNightMission) {
        drawText('NIGHT', vec2(MAP_WIDTH/2 - 2, uiY + 0.8), 0.25, new Color(0.4, 0.4, 0.8), 0.015);
    }
    drawText(difficulty.toUpperCase(), vec2(MAP_WIDTH/2 - 2, uiY + 0.5), 0.22, new Color(0.6, 0.6, 0.7), 0.012);

    // Messages
    let msgY = MAP_HEIGHT/2 + 0.5;
    const recentMessages = messages.slice(-4);
    recentMessages.forEach((msg, i) => {
        const age = Date.now() - msg.time;
        const alpha = age < 3000 ? 1 : Math.max(0, 1 - (age - 3000) / 2000);
        if (alpha > 0) {
            drawText(msg.text, vec2(-MAP_WIDTH/2 + 1, msgY - i * 0.5), 0.3, new Color(1, 1, 0.8, alpha), 0.015);
        }
    });

    // Tooltip
    if (hoveredButton) {
        const tooltipPos = vec2(hoveredButton.x + hoveredButton.w/2, hoveredButton.y + hoveredButton.h + 0.6);
        drawRect(tooltipPos, vec2(4, 0.5), new Color(0, 0, 0, 0.85));
        drawText(hoveredButton.tooltip, tooltipPos, 0.25, COLORS.uiText, 0.01, undefined, 'center');
    }
}

// Post render (unused)
function gameRenderPost() {}

// Start engine
engineInit(gameInit, gameUpdate, gameRender, gameRenderPost);
