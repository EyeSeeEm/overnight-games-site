// Curious Expedition Clone - Canvas Implementation
// Hex-based exploration roguelike

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Explorer characters (select at game start)
const EXPLORERS = {
    darwin: {
        name: 'Charles Darwin',
        title: 'Naturalist',
        dice: ['green', 'green', 'blue'],
        perks: ['animalWhisperer'],
        sanityBonus: 10,
        fameBonus: 20,
        portrait: '#8B4513'
    },
    livingstone: {
        name: 'David Livingstone',
        title: 'Missionary',
        dice: ['red', 'green', 'green'],
        perks: ['faithfulFollower'],
        sanityBonus: 20,
        fameBonus: 0,
        portrait: '#2E7D32'
    },
    earhart: {
        name: 'Amelia Earhart',
        title: 'Aviator',
        dice: ['red', 'blue', 'blue'],
        perks: ['navigator'],
        sanityBonus: 0,
        fameBonus: 30,
        portrait: '#1565C0'
    },
    tesla: {
        name: 'Nikola Tesla',
        title: 'Inventor',
        dice: ['blue', 'blue', 'purple'],
        perks: ['electricGenius'],
        sanityBonus: 0,
        fameBonus: 10,
        portrait: '#9C27B0'
    },
    curie: {
        name: 'Marie Curie',
        title: 'Scientist',
        dice: ['green', 'blue', 'purple'],
        perks: ['radiation'],
        sanityBonus: 5,
        fameBonus: 15,
        portrait: '#E91E63'
    }
};

// Rival expedition system
const RIVALS = [
    { name: 'Baron Von Reich', color: '#FF5722', speed: 0.8, aggression: 'high' },
    { name: 'Lady Pemberton', color: '#9C27B0', speed: 0.6, aggression: 'low' },
    { name: 'Captain Blackwood', color: '#424242', speed: 0.7, aggression: 'medium' },
    { name: 'Dr. Moreau', color: '#4CAF50', speed: 0.5, aggression: 'medium' }
];

// Treasure items for museum donation
const TREASURES = {
    goldenIdol: { name: 'Golden Idol', fame: 50, value: 30, rarity: 'rare' },
    ancientScroll: { name: 'Ancient Scroll', fame: 30, value: 15, rarity: 'uncommon' },
    crystalSkull: { name: 'Crystal Skull', fame: 80, value: 50, rarity: 'legendary' },
    jadeMask: { name: 'Jade Mask', fame: 40, value: 25, rarity: 'rare' },
    dinosaurBone: { name: 'Dinosaur Bone', fame: 60, value: 35, rarity: 'rare' },
    meteorFragment: { name: 'Meteor Fragment', fame: 45, value: 20, rarity: 'uncommon' },
    pharaohRing: { name: "Pharaoh's Ring", fame: 100, value: 70, rarity: 'legendary' },
    tribalTotem: { name: 'Tribal Totem', fame: 25, value: 10, rarity: 'common' }
};

// Camp system
const CAMP = {
    setupTime: 1, // days
    sanityRestore: 30,
    foodCost: 1,
    maxRests: 3 // per expedition
};

const WIDTH = 960;
const HEIGHT = 640;

// Color palette
const COLORS = {
    // Terrain
    grassland: '#7CB342',
    jungle: '#2E7D32',
    thickJungle: '#1B5E20',
    desert: '#D4A559',
    drylands: '#C8B88A',
    snow: '#E8EAF6',
    deepSnow: '#CFD8DC',
    water: '#1565C0',
    shallowWater: '#64B5F6',
    mountain: '#5D4037',
    hills: '#6D4C41',
    swamp: '#4E342E',
    beach: '#F5DEB3',

    // UI
    parchment: '#F5E6D3',
    parchmentDark: '#D4C4B0',
    inkBrown: '#3E2723',
    goldAccent: '#FFD700',
    dangerRed: '#C62828',
    sanityBlue: '#1976D2',

    // Status
    healthRed: '#E53935',
    loyaltyPink: '#EC407A',

    // Fog
    fogDark: '#0a0a12',
    fogMedium: '#1a1a2e'
};

// Hex configuration
const HEX = {
    size: 28,
    width: 48,
    height: 42,
    spacing: 1
};

// Map configuration
const MAP = {
    width: 18,
    height: 14,
    viewDistance: 3,
    offsetX: 50,  // Pixel offset for map rendering
    offsetY: 50
};

// Terrain types with costs
const TERRAIN = {
    grassland:    { cost: 1, passable: true, color: COLORS.grassland, name: 'Grassland' },
    jungle:       { cost: 2, passable: true, color: COLORS.jungle, name: 'Light Jungle' },
    thickJungle:  { cost: 8, passable: true, color: COLORS.thickJungle, name: 'Thick Jungle' },
    desert:       { cost: 10, passable: true, color: COLORS.desert, name: 'Desert' },
    drylands:     { cost: 1, passable: true, color: COLORS.drylands, name: 'Drylands' },
    snow:         { cost: 2, passable: true, color: COLORS.snow, name: 'Snow' },
    deepSnow:     { cost: 10, passable: true, color: COLORS.deepSnow, name: 'Deep Snow' },
    hills:        { cost: 15, passable: true, color: COLORS.hills, name: 'Hills' },
    swamp:        { cost: 10, passable: true, color: COLORS.swamp, name: 'Swamp' },
    beach:        { cost: 1, passable: true, color: COLORS.beach, name: 'Beach' },
    shallowWater: { cost: 4, passable: true, color: COLORS.shallowWater, name: 'Shallow Water' },
    mountain:     { cost: 0, passable: false, color: COLORS.mountain, name: 'Mountain' },
    water:        { cost: 0, passable: false, color: COLORS.water, name: 'Deep Water' }
};

// Location types
const LOCATIONS = {
    village: { name: 'Native Village', color: '#8B4513', icon: 'V', sanityRestore: 30 },
    shrine: { name: 'Ancient Shrine', color: '#9C27B0', icon: 'S', event: true },
    cave: { name: 'Cave', color: '#424242', icon: 'C', loot: true },
    oasis: { name: 'Oasis', color: '#00BCD4', icon: 'O', sanityRestore: 20 },
    pyramid: { name: 'Golden Pyramid', color: '#FFD700', icon: 'P', victory: true },
    camp: { name: 'Abandoned Camp', color: '#795548', icon: '+', loot: true },
    ruins: { name: 'Ancient Ruins', color: '#607D8B', icon: 'R', event: true }
};

// Enemy types
const ENEMIES = {
    tiger: { name: 'Tiger', health: 14, damage: 4, color: '#FF9800', effect: 'bleeding', biome: 'jungle' },
    gorilla: { name: 'Gorilla', health: 18, damage: 6, color: '#5D4037', biome: 'jungle' },
    spider: { name: 'Giant Spider', health: 10, damage: 3, color: '#4A148C', effect: 'poison', biome: 'jungle' },
    hyena: { name: 'Hyena', health: 8, damage: 3, color: '#FFC107', pack: true, effect: 'bleeding', biome: 'desert' },
    scorpion: { name: 'Giant Scorpion', health: 12, damage: 4, color: '#D32F2F', effect: 'poison', biome: 'desert' },
    natives: { name: 'Angry Natives', health: 8, damage: 3, color: '#FF5722', pack: true },
    mummy: { name: 'Mummy Guardian', health: 25, damage: 6, color: '#8B8B00', effect: 'curse', isBoss: true },
    polarBear: { name: 'Polar Bear', health: 22, damage: 7, color: '#ECEFF1', biome: 'arctic' },
    arcticWolf: { name: 'Arctic Wolf', health: 9, damage: 3, color: '#90A4AE', pack: true, biome: 'arctic' }
};

// Status effects configuration
const STATUS_EFFECTS = {
    bleeding: { damage: 2, duration: 2, color: '#E53935' },
    poison: { damage: 1, duration: 4, color: '#7CB342' },
    curse: { damage: 3, duration: 3, color: '#8B8B00' },
    malaria: { damage: 1, duration: 6, color: '#FF9800' },
    frostbite: { damage: 2, duration: 3, color: '#00BCD4' },
    burned: { damage: 3, duration: 2, color: '#FF5722' }
};

// Hazardous terrain effects
const TERRAIN_HAZARDS = {
    fire: {
        chance: 0.15,
        effect: 'burned',
        damage: 5,
        description: 'Flames lick at your party!'
    },
    fumarole: {
        chance: 0.3,
        effect: null,
        damage: 2,
        sanityCost: 5,
        description: 'Toxic gases seep from the ground!'
    },
    mosquito: {
        chance: 0.4,
        effect: 'malaria',
        damage: 0,
        description: 'Mosquito swarm attacks!'
    },
    quicksand: {
        chance: 0.2,
        effect: null,
        damage: 0,
        sanityCost: 15,
        itemLoss: true,
        description: 'Quicksand! Struggling to escape!'
    }
};

// Weather system
const WEATHER = {
    clear: { sanityCostMod: 1.0, visibilityMod: 1.0, icon: '☀' },
    rain: { sanityCostMod: 1.2, visibilityMod: 0.8, icon: '🌧' },
    storm: { sanityCostMod: 1.5, visibilityMod: 0.5, icon: '⛈' },
    fog: { sanityCostMod: 1.1, visibilityMod: 0.6, icon: '🌫' },
    blizzard: { sanityCostMod: 1.8, visibilityMod: 0.4, icon: '❄', biome: 'arctic' },
    sandstorm: { sanityCostMod: 1.6, visibilityMod: 0.5, icon: '🏜', biome: 'desert' }
};

// Companion types
const COMPANIONS = {
    soldier: { name: 'Soldier', health: 10, maxHealth: 10, dice: ['red', 'red'], carry: 2, perks: [] },
    scout: { name: 'Scout', health: 8, maxHealth: 8, dice: ['green', 'blue'], carry: 3, perks: ['jungleExplorer'] },
    porter: { name: 'Porter', health: 6, maxHealth: 6, dice: ['green'], carry: 5, perks: [] },
    native: { name: 'Native Guide', health: 7, maxHealth: 7, dice: ['blue', 'green'], carry: 2, perks: ['jungleExplorer'] },
    cook: { name: 'Cook', health: 6, maxHealth: 6, dice: ['green'], carry: 2, perks: ['cooking'] }
};

// Items
const ITEMS = {
    chocolate: { name: 'Chocolate', sanity: 10, stack: true, icon: 'C' },
    whisky: { name: 'Whisky', sanity: 20, stack: true, icon: 'W' },
    medkit: { name: 'Medkit', heal: 10, stack: true, icon: '+' },
    machete: { name: 'Machete', jungleBonus: -3, icon: 'M' },
    rope: { name: 'Rope', swampBonus: -3, icon: 'R' },
    torch: { name: 'Torch', caveBonus: true, icon: 'T' },
    dynamite: { name: 'Dynamite', combat: true, icon: 'D' },
    map: { name: 'Treasure Map', revealPyramid: true, icon: '?' }
};

// Biomes configuration
const BIOMES = {
    jungle: {
        name: 'Jungle',
        color: '#2E7D32',
        description: 'Dense vegetation, tigers, ancient temples',
        terrainWeights: { grassland: 20, jungle: 35, thickJungle: 20, swamp: 10, hills: 10, mountain: 5 }
    },
    desert: {
        name: 'Desert',
        color: '#D4A559',
        description: 'Scorching sands, scorpions, hidden oases',
        terrainWeights: { desert: 40, drylands: 30, hills: 15, beach: 5, mountain: 10 }
    },
    arctic: {
        name: 'Arctic',
        color: '#E8EAF6',
        description: 'Frozen wasteland, blizzards, polar bears',
        terrainWeights: { snow: 35, deepSnow: 25, hills: 15, shallowWater: 10, mountain: 15 }
    }
};

// Game state
let game = {
    state: 'title', // title, explorerSelect, biomeSelect, playing, combat, event, gameover, victory, trading, museum
    expedition: 1,
    fame: 0,
    day: 1,
    biome: 'jungle', // Selected biome
    tradingStock: [], // Items available at current village
    tradingRecruit: null, // Companion available for hire
    explorer: null, // Selected explorer character
    weather: 'clear', // Current weather
    weatherDuration: 0, // Days until weather changes
    rivals: [], // Active rival expeditions
    rivalProgress: {}, // Rival progress toward pyramid
    treasures: [], // Collected treasures for museum
    campsUsed: 0, // Camp rests this expedition
    racePosition: 1, // Current race position (1st, 2nd, etc.)
    notifications: [] // Event notifications queue
};

// Party state
let party = {
    x: 0,
    y: 0,
    sanity: 100,
    maxSanity: 100,
    standing: 100, // relationship with natives
    companions: [],
    inventory: [],
    maxInventory: 15
};

// Map data
let hexMap = [];
let locations = [];
let enemies = [];
let visitedHexes = new Set();
let revealedHexes = new Set();

// Camera
let camera = { x: 0, y: 0 };

// UI state
let selectedHex = null;
let hoverHex = null;
let path = [];
let messages = [];

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (game.state === 'title' && e.key === ' ') {
        game.state = 'explorerSelect';
    }
    if (game.state === 'playing') {
        // Number keys for items
        if (e.key >= '1' && e.key <= '9') {
            useItem(parseInt(e.key) - 1);
        }
        // C key for camp
        if (e.key.toLowerCase() === 'c') {
            setupCamp();
        }
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    updateHoverHex();
});
canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    // Update mouse position from click event
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    handleClick(e.button);
});
canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Hex math utilities
function hexToPixel(q, r) {
    const x = MAP.offsetX + HEX.size * (3/2 * q);
    const y = MAP.offsetY + HEX.size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
}

function pixelToHex(x, y) {
    // Remove offset first
    const px = x - MAP.offsetX;
    const py = y - MAP.offsetY;
    // Pointy-top hex coordinate conversion (inverse of hexToPixel)
    const q = (px * 2/3) / HEX.size;
    const r = (-px / 3 + Math.sqrt(3)/3 * py) / HEX.size;
    return hexRound(q, r);
}

function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    }

    return { q: rq, r: rr };
}

function hexDistance(q1, r1, q2, r2) {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

function getHexNeighbors(q, r) {
    const directions = [
        [1, 0], [1, -1], [0, -1],
        [-1, 0], [-1, 1], [0, 1]
    ];
    return directions.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

function getHexKey(q, r) {
    return `${q},${r}`;
}

// Map generation
function generateMap() {
    hexMap = [];
    locations = [];
    enemies = [];
    visitedHexes = new Set();
    revealedHexes = new Set();

    // Initialize hex grid
    for (let r = 0; r < MAP.height; r++) {
        for (let q = 0; q < MAP.width; q++) {
            const terrain = generateTerrain(q, r);
            hexMap.push({
                q, r,
                terrain,
                location: null,
                enemy: null
            });
        }
    }

    // Place locations
    placeLocations();

    // Place enemies
    placeEnemies();

    // Find starting position (edge of map, passable terrain)
    let startQ = 0;
    let startR = Math.floor(MAP.height / 2);
    for (let attempts = 0; attempts < 50; attempts++) {
        const hex = getHex(startQ, startR);
        if (hex && TERRAIN[hex.terrain].passable && !hex.location) {
            break;
        }
        startR = Math.floor(Math.random() * MAP.height);
    }

    party.x = startQ;
    party.y = startR;

    // Reveal starting area
    revealArea(party.x, party.y);
}

function generateTerrain(q, r) {
    // Edge water
    if (q === 0 || r === 0 || q === MAP.width - 1 || r === MAP.height - 1) {
        return Math.random() < 0.3 ? 'water' : 'beach';
    }

    // Mountains in center
    const distFromCenter = hexDistance(q, r, MAP.width/2, MAP.height/2);
    if (distFromCenter < 3 && Math.random() < 0.2) {
        return 'mountain';
    }

    // Use biome terrain weights
    const biome = BIOMES[game.biome];
    if (biome && biome.terrainWeights) {
        // Weighted random selection
        const weights = biome.terrainWeights;
        const terrainTypes = Object.keys(weights);
        const totalWeight = terrainTypes.reduce((sum, t) => sum + weights[t], 0);
        let random = Math.random() * totalWeight;

        for (const terrain of terrainTypes) {
            random -= weights[terrain];
            if (random <= 0) {
                return terrain;
            }
        }
        return terrainTypes[0];
    }

    // Fallback: noise-based terrain generation
    const noise1 = Math.sin(q * 0.3) * Math.cos(r * 0.4) * 0.5 + 0.5;
    const noise2 = Math.sin(q * 0.5 + 1) * Math.cos(r * 0.3 + 2) * 0.5 + 0.5;
    const combined = (noise1 + noise2) / 2;

    if (combined < 0.15) return 'water';
    if (combined < 0.25) return 'swamp';
    if (combined < 0.4) return 'jungle';
    if (combined < 0.5) return 'thickJungle';
    if (combined < 0.7) return 'grassland';
    if (combined < 0.85) return 'drylands';
    return 'hills';
}

function placeLocations() {
    // Place Golden Pyramid (far from start)
    let pyramidPlaced = false;
    for (let attempts = 0; attempts < 100 && !pyramidPlaced; attempts++) {
        const q = MAP.width - 3 + Math.floor(Math.random() * 3);
        const r = Math.floor(Math.random() * MAP.height);
        const hex = getHex(q, r);
        if (hex && TERRAIN[hex.terrain].passable && !hex.location) {
            hex.location = 'pyramid';
            locations.push({ q, r, type: 'pyramid' });
            pyramidPlaced = true;
        }
    }

    // Place villages (3-5)
    const villageCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < villageCount; i++) {
        placeLocation('village');
    }

    // Place shrines (2-3)
    const shrineCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < shrineCount; i++) {
        placeLocation('shrine');
    }

    // Place caves (2-3)
    const caveCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < caveCount; i++) {
        placeLocation('cave');
    }

    // Place oases (1-2)
    const oasisCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < oasisCount; i++) {
        placeLocation('oasis');
    }

    // Place camps (1-2)
    const campCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < campCount; i++) {
        placeLocation('camp');
    }
}

function placeLocation(type) {
    for (let attempts = 0; attempts < 50; attempts++) {
        const q = 1 + Math.floor(Math.random() * (MAP.width - 2));
        const r = 1 + Math.floor(Math.random() * (MAP.height - 2));
        const hex = getHex(q, r);

        // Check minimum distance from other locations
        const tooClose = locations.some(loc => hexDistance(q, r, loc.q, loc.r) < 2);

        if (hex && TERRAIN[hex.terrain].passable && !hex.location && !tooClose) {
            hex.location = type;
            locations.push({ q, r, type });
            return;
        }
    }
}

function placeEnemies() {
    // Get biome-appropriate enemies
    let enemyTypes;
    switch (game.biome) {
        case 'jungle':
            enemyTypes = ['tiger', 'gorilla', 'spider'];
            break;
        case 'desert':
            enemyTypes = ['hyena', 'scorpion'];
            break;
        case 'arctic':
            enemyTypes = ['polarBear', 'arcticWolf'];
            break;
        default:
            enemyTypes = ['tiger', 'spider', 'hyena'];
    }

    const enemyCount = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < enemyCount; i++) {
        for (let attempts = 0; attempts < 50; attempts++) {
            const q = 3 + Math.floor(Math.random() * (MAP.width - 6));
            const r = 1 + Math.floor(Math.random() * (MAP.height - 2));
            const hex = getHex(q, r);

            const tooClose = locations.some(loc => hexDistance(q, r, loc.q, loc.r) < 2);
            const nearStart = hexDistance(q, r, party.x, party.y) < 4;

            if (hex && TERRAIN[hex.terrain].passable && !hex.location && !hex.enemy && !tooClose && !nearStart) {
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                hex.enemy = type;
                enemies.push({ q, r, type, health: ENEMIES[type].health });
                break;
            }
        }
    }
}

function getHex(q, r) {
    if (q < 0 || q >= MAP.width || r < 0 || r >= MAP.height) return null;
    return hexMap.find(h => h.q === q && h.r === r);
}

function revealArea(centerQ, centerR) {
    for (let dq = -MAP.viewDistance; dq <= MAP.viewDistance; dq++) {
        for (let dr = -MAP.viewDistance; dr <= MAP.viewDistance; dr++) {
            if (hexDistance(0, 0, dq, dr) <= MAP.viewDistance) {
                const q = centerQ + dq;
                const r = centerR + dr;
                if (q >= 0 && q < MAP.width && r >= 0 && r < MAP.height) {
                    revealedHexes.add(getHexKey(q, r));
                }
            }
        }
    }
}

// Pathfinding
function findPath(startQ, startR, endQ, endR) {
    const start = { q: startQ, r: startR };
    const end = { q: endQ, r: endR };

    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = getHexKey(startQ, startR);
    const endKey = getHexKey(endQ, endR);

    gScore.set(startKey, 0);
    fScore.set(startKey, hexDistance(startQ, startR, endQ, endR));

    while (openSet.length > 0) {
        // Find node with lowest fScore
        openSet.sort((a, b) => {
            const fa = fScore.get(getHexKey(a.q, a.r)) || Infinity;
            const fb = fScore.get(getHexKey(b.q, b.r)) || Infinity;
            return fa - fb;
        });

        const current = openSet.shift();
        const currentKey = getHexKey(current.q, current.r);

        if (currentKey === endKey) {
            // Reconstruct path
            const path = [current];
            let key = currentKey;
            while (cameFrom.has(key)) {
                const prev = cameFrom.get(key);
                path.unshift(prev);
                key = getHexKey(prev.q, prev.r);
            }
            return path;
        }

        const neighbors = getHexNeighbors(current.q, current.r);
        for (const neighbor of neighbors) {
            const hex = getHex(neighbor.q, neighbor.r);
            if (!hex || !TERRAIN[hex.terrain].passable) continue;

            const neighborKey = getHexKey(neighbor.q, neighbor.r);
            const tentativeG = (gScore.get(currentKey) || 0) + TERRAIN[hex.terrain].cost + 5;

            if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + hexDistance(neighbor.q, neighbor.r, endQ, endR));

                if (!openSet.find(n => n.q === neighbor.q && n.r === neighbor.r)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // No path found
}

// Movement
function moveParty(targetQ, targetR) {
    if (game.state !== 'playing') return;

    const hex = getHex(targetQ, targetR);
    if (!hex || !TERRAIN[hex.terrain].passable) return;

    // Check if adjacent or find path
    const dist = hexDistance(party.x, party.y, targetQ, targetR);
    if (dist > 1) {
        // Use pathfinding for distant targets
        path = findPath(party.x, party.y, targetQ, targetR);
        if (path.length > 1) {
            // Move to next step in path
            const next = path[1];
            executeSingleMove(next.q, next.r);
        }
    } else {
        executeSingleMove(targetQ, targetR);
    }
}

function executeSingleMove(targetQ, targetR) {
    const hex = getHex(targetQ, targetR);
    if (!hex) return;

    // Calculate sanity cost
    let cost = 5 + TERRAIN[hex.terrain].cost;

    // Apply item bonuses
    if (hex.terrain === 'jungle' || hex.terrain === 'thickJungle') {
        if (party.inventory.find(i => i.type === 'machete')) {
            cost = Math.max(1, cost - 3);
        }
    }
    if (hex.terrain === 'swamp') {
        if (party.inventory.find(i => i.type === 'rope')) {
            cost = Math.max(1, cost - 3);
        }
    }

    // Apply companion perks
    party.companions.forEach(c => {
        if (c.perks && c.perks.includes('jungleExplorer') &&
            (hex.terrain === 'jungle' || hex.terrain === 'thickJungle')) {
            cost = Math.max(1, cost - 2);
        }
    });

    // Apply weather modifier
    const weatherMod = WEATHER[game.weather]?.sanityCostMod || 1.0;
    cost = Math.ceil(cost * weatherMod);

    // Apply explorer perks
    cost = applyExplorerPerks(cost, hex);

    // Deduct sanity
    party.sanity = Math.max(0, party.sanity - cost);
    addMessage(`-${cost} Sanity (${TERRAIN[hex.terrain].name})`, COLORS.dangerRed);

    // Move party
    party.x = targetQ;
    party.y = targetR;
    visitedHexes.add(getHexKey(targetQ, targetR));
    revealArea(targetQ, targetR);
    game.day++;

    // Update rivals
    updateRivals();

    // Update weather
    updateWeather();

    // Random treasure chance at certain locations
    if (hex.location === 'cave' || hex.location === 'ruins') {
        if (Math.random() < 0.25) {
            findTreasure();
        }
    }

    // Check for encounters
    if (hex.enemy) {
        startCombat(hex.enemy);
    } else if (hex.location) {
        handleLocation(hex.location, targetQ, targetR);
    }

    // Check sanity
    if (party.sanity <= 0) {
        checkInsanityEvent();
    }
}

function handleLocation(locationType, q, r) {
    const loc = LOCATIONS[locationType];

    if (loc.victory) {
        // Found the pyramid!
        game.state = 'victory';
        game.fame += 500;
        addMessage('You found the Golden Pyramid!', COLORS.goldAccent);
        return;
    }

    if (loc.sanityRestore) {
        party.sanity = Math.min(party.maxSanity, party.sanity + loc.sanityRestore);
        addMessage(`+${loc.sanityRestore} Sanity (${loc.name})`, COLORS.sanityBlue);
    }

    // Village trading
    if (locationType === 'village') {
        openTrading();
        return;
    }

    if (loc.loot) {
        // Random loot - rare chance for treasure map
        let lootItems = ['chocolate', 'whisky', 'medkit', 'dynamite'];
        if (Math.random() < 0.1 && !game.pyramidRevealed) {
            lootItems = ['map']; // 10% chance for treasure map
        }
        const item = lootItems[Math.floor(Math.random() * lootItems.length)];
        if (party.inventory.length < party.maxInventory) {
            party.inventory.push({ type: item, ...ITEMS[item] });
            addMessage(`Found ${ITEMS[item].name}!`, COLORS.goldAccent);
        }
    }

    if (loc.event) {
        // Check for shrine guardian first (25% chance at shrines)
        if (locationType === 'shrine' && Math.random() < 0.25) {
            addMessage('The shrine is guarded by an ancient mummy!', '#8B8B00');
            startCombat('mummy');
            return;
        }

        // Random event
        const events = [
            { text: 'You find ancient artifacts!', fame: 50 },
            { text: 'A hidden trap! Companion injured.', damage: 5 },
            { text: 'Natives share food with you.', sanity: 15 },
            { text: 'You discover treasure!', loot: true },
            { text: 'Ancient spirits bless your journey!', sanity: 25, fame: 20 }
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        addMessage(event.text, COLORS.goldAccent);
        if (event.fame) game.fame += event.fame;
        if (event.sanity) party.sanity = Math.min(party.maxSanity, party.sanity + event.sanity);
        if (event.damage && party.companions.length > 0) {
            party.companions[0].health -= event.damage;
        }
    }
}

// Trading system
function openTrading() {
    game.state = 'trading';

    // Generate stock - random items available
    game.tradingStock = [];
    const stockItems = ['chocolate', 'whisky', 'medkit', 'rope', 'torch', 'dynamite'];
    const numItems = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
        const itemType = stockItems[Math.floor(Math.random() * stockItems.length)];
        game.tradingStock.push({
            type: itemType,
            ...ITEMS[itemType],
            price: getItemPrice(itemType)
        });
    }

    // Maybe a companion for hire
    if (Math.random() < 0.5 && party.companions.length < 5) {
        const recruits = ['native', 'porter', 'cook'];
        const recruitType = recruits[Math.floor(Math.random() * recruits.length)];
        game.tradingRecruit = {
            type: recruitType,
            ...COMPANIONS[recruitType],
            price: 15 // Standing cost to hire
        };
    } else {
        game.tradingRecruit = null;
    }

    addMessage('Welcome to the village! Trade with us.', COLORS.goldAccent);
}

function getItemPrice(itemType) {
    const prices = {
        chocolate: 5,
        whisky: 8,
        medkit: 10,
        rope: 12,
        torch: 6,
        dynamite: 15,
        machete: 15,
        map: 20
    };
    return prices[itemType] || 10;
}

function buyItem(index) {
    if (index >= game.tradingStock.length) return;

    const item = game.tradingStock[index];
    if (party.standing < item.price) {
        addMessage('Not enough standing!', COLORS.dangerRed);
        return;
    }
    if (party.inventory.length >= party.maxInventory) {
        addMessage('Inventory full!', COLORS.dangerRed);
        return;
    }

    party.standing -= item.price;
    party.inventory.push({ type: item.type, ...ITEMS[item.type] });
    game.tradingStock.splice(index, 1);
    addMessage(`Bought ${item.name}!`, COLORS.goldAccent);
}

function sellItem(index) {
    if (index >= party.inventory.length) return;

    const item = party.inventory[index];
    const price = Math.floor(getItemPrice(item.type) / 2);

    party.standing = Math.min(100, party.standing + price);
    party.inventory.splice(index, 1);
    addMessage(`Sold ${item.name} for ${price} standing!`, COLORS.goldAccent);
}

function hireCompanion() {
    if (!game.tradingRecruit) return;
    if (party.standing < game.tradingRecruit.price) {
        addMessage('Not enough standing!', COLORS.dangerRed);
        return;
    }
    if (party.companions.length >= 5) {
        addMessage('Party is full!', COLORS.dangerRed);
        return;
    }

    party.standing -= game.tradingRecruit.price;
    party.companions.push({
        ...COMPANIONS[game.tradingRecruit.type],
        id: Date.now()
    });
    addMessage(`${game.tradingRecruit.name} joins the party!`, COLORS.goldAccent);
    game.tradingRecruit = null;
}

function closeTrading() {
    game.state = 'playing';
}

function startCombat(enemyType) {
    game.state = 'combat';
    game.combatEnemy = {
        type: enemyType,
        ...ENEMIES[enemyType],
        maxHealth: ENEMIES[enemyType].health
    };
    game.combatRound = 1;
    game.combatDice = rollPartyDice();
    // Initialize party status effects
    game.partyEffects = [];
    addMessage(`Combat with ${ENEMIES[enemyType].name}!`, COLORS.dangerRed);
}

function rollPartyDice() {
    const dice = [];
    // Explorer dice
    dice.push(rollDie('red'));
    dice.push(rollDie('green'));
    // Companion dice
    party.companions.forEach(c => {
        if (c.health > 0 && c.dice) {
            c.dice.forEach(d => dice.push(rollDie(d)));
        }
    });
    return dice;
}

function rollDie(type) {
    const faces = {
        red: ['attack', 'attack', 'attack', 'strength', 'defense', 'blank'],
        green: ['defense', 'defense', 'defense', 'agility', 'attack', 'blank'],
        blue: ['tactics', 'tactics', 'precision', 'precision', 'agility', 'blank'],
        purple: ['magic', 'magic', 'precision', 'tactics', 'agility', 'blank']
    };
    const dieType = faces[type] || faces.red;
    return {
        type,
        face: dieType[Math.floor(Math.random() * dieType.length)]
    };
}

// Rival expedition system functions
function initRivals() {
    game.rivals = [];
    game.rivalProgress = {};

    // Add 1-2 rivals based on expedition number
    const numRivals = Math.min(game.expedition, 2);
    const availableRivals = [...RIVALS];

    for (let i = 0; i < numRivals; i++) {
        const idx = Math.floor(Math.random() * availableRivals.length);
        const rival = availableRivals.splice(idx, 1)[0];
        game.rivals.push(rival);
        game.rivalProgress[rival.name] = 0;
    }
}

function updateRivals() {
    if (game.rivals.length === 0) return;

    const pyramidHex = hexMap.find(h => h.location === 'pyramid');
    if (!pyramidHex) return;

    // Calculate max progress (distance to pyramid)
    const maxProgress = hexDistance(0, MAP.height / 2, pyramidHex.q, pyramidHex.r);

    game.rivals.forEach(rival => {
        // Rivals advance based on their speed
        const advance = rival.speed * (0.5 + Math.random() * 0.5);
        game.rivalProgress[rival.name] = Math.min(maxProgress,
            (game.rivalProgress[rival.name] || 0) + advance);

        // Check if rival reached pyramid first
        if (game.rivalProgress[rival.name] >= maxProgress) {
            addMessage(`${rival.name} reached the pyramid first!`, '#FF5722');
            game.racePosition = Math.min(game.racePosition + 1, game.rivals.length + 1);
        }
    });
}

// Weather system functions
function updateWeather() {
    if (game.weatherDuration > 0) {
        game.weatherDuration--;
        return;
    }

    // Change weather
    const weatherOptions = ['clear', 'clear', 'rain', 'fog'];

    // Add biome-specific weather
    if (game.biome === 'arctic') weatherOptions.push('blizzard');
    if (game.biome === 'desert') weatherOptions.push('sandstorm');
    if (game.biome === 'jungle') weatherOptions.push('rain', 'storm');

    game.weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    game.weatherDuration = 3 + Math.floor(Math.random() * 5);

    if (game.weather !== 'clear') {
        const weather = WEATHER[game.weather];
        addMessage(`Weather: ${weather.icon} ${game.weather}`, '#90CAF9');
    }
}

// Camp system
function setupCamp() {
    if (game.campsUsed >= CAMP.maxRests) {
        addMessage('No more camp supplies!', COLORS.dangerRed);
        return;
    }

    // Check for food
    const foodItem = party.inventory.find(i => i.type === 'chocolate' || i.type === 'whisky');
    if (!foodItem) {
        addMessage('Need food to rest!', COLORS.dangerRed);
        return;
    }

    // Consume food
    const idx = party.inventory.indexOf(foodItem);
    party.inventory.splice(idx, 1);

    // Rest
    party.sanity = Math.min(party.maxSanity, party.sanity + CAMP.sanityRestore);
    game.day += CAMP.setupTime;
    game.campsUsed++;

    addMessage(`Camp rest! +${CAMP.sanityRestore} Sanity`, COLORS.sanityBlue);
}

// Treasure and museum system
function findTreasure() {
    const treasureTypes = Object.keys(TREASURES);
    const weights = treasureTypes.map(t => {
        const rarity = TREASURES[t].rarity;
        if (rarity === 'legendary') return 5;
        if (rarity === 'rare') return 15;
        if (rarity === 'uncommon') return 30;
        return 50;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < treasureTypes.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            const treasureType = treasureTypes[i];
            const treasure = { type: treasureType, ...TREASURES[treasureType] };
            game.treasures.push(treasure);
            addMessage(`Found ${treasure.name}!`, COLORS.goldAccent);
            return;
        }
    }
}

function donateToMuseum(index) {
    if (index >= game.treasures.length) return;

    const treasure = game.treasures[index];
    game.fame += treasure.fame;
    game.treasures.splice(index, 1);

    addMessage(`Donated ${treasure.name}! +${treasure.fame} Fame`, COLORS.goldAccent);
}

// Explorer perk effects
function applyExplorerPerks(cost, toHex) {
    if (!game.explorer) return cost;

    const perks = EXPLORERS[game.explorer].perks;

    if (perks.includes('navigator')) {
        cost = Math.max(1, cost - 1); // Reduced travel cost
    }
    if (perks.includes('animalWhisperer') &&
        (toHex.terrain === 'jungle' || toHex.terrain === 'thickJungle')) {
        cost = Math.max(1, cost - 2); // Jungle bonus
    }

    return cost;
}

function executeCombatAction(action) {
    if (game.state !== 'combat') return;

    let damage = 0;
    let defense = 0;
    let usedDice = [];

    switch (action) {
        case 'attack':
            // Use attack dice
            const attackDice = game.combatDice.filter(d => d.face === 'attack');
            if (attackDice.length > 0) {
                damage = attackDice.length * 2;
                usedDice = attackDice;
            }
            break;
        case 'defend':
            // Use defense dice
            const defenseDice = game.combatDice.filter(d => d.face === 'defense');
            if (defenseDice.length > 0) {
                defense = defenseDice.length * 2;
                usedDice = defenseDice;
            }
            break;
        case 'power': {
            // Power Strike: strength + attack = 4 damage
            const str = game.combatDice.find(d => d.face === 'strength');
            const att = game.combatDice.find(d => d.face === 'attack');
            if (str && att) {
                damage = 4;
                usedDice = [str, att];
                addMessage('Power Strike!', '#FF5722');
            }
            break;
        }
        case 'evade': {
            // Evade: agility + defense = 3 defense
            const agi = game.combatDice.find(d => d.face === 'agility');
            const def = game.combatDice.find(d => d.face === 'defense');
            if (agi && def) {
                defense = 3;
                usedDice = [agi, def];
                addMessage('Evasive Maneuver!', COLORS.sanityBlue);
            }
            break;
        }
        case 'tactical': {
            // Tactical: tactics + precision = 3 damage (ignores 1 shield)
            const tac = game.combatDice.find(d => d.face === 'tactics');
            const pre = game.combatDice.find(d => d.face === 'precision');
            if (tac && pre) {
                damage = 3;
                usedDice = [tac, pre];
                addMessage('Tactical Strike!', '#2196F3');
            }
            break;
        }
        case 'magic': {
            // Magic: magic + magic = 5 damage + heal 3 party
            const mag1 = game.combatDice.find(d => d.face === 'magic');
            const mag2 = game.combatDice.find(d => d.face === 'magic' && d !== mag1);
            if (mag1 && mag2) {
                damage = 5;
                usedDice = [mag1, mag2];
                // Heal random companion
                const injured = party.companions.find(c => c.health < c.maxHealth);
                if (injured) {
                    injured.health = Math.min(injured.maxHealth, injured.health + 3);
                    addMessage(`Arcane Blast! +3 heal to ${injured.name}`, '#9C27B0');
                } else {
                    addMessage('Arcane Blast!', '#9C27B0');
                }
            }
            break;
        }
        case 'flee':
            // 50% chance to flee
            if (Math.random() < 0.5) {
                addMessage('You fled successfully!', COLORS.sanityBlue);
                endCombat(false);
                return;
            } else {
                addMessage('Failed to flee!', COLORS.dangerRed);
            }
            break;
    }

    // Remove used dice
    usedDice.forEach(d => {
        const idx = game.combatDice.indexOf(d);
        if (idx >= 0) game.combatDice.splice(idx, 1);
    });

    // Apply damage to enemy
    if (damage > 0) {
        game.combatEnemy.health -= damage;
        addMessage(`Dealt ${damage} damage!`, COLORS.goldAccent);
    }

    // Check enemy defeat
    if (game.combatEnemy.health <= 0) {
        addMessage(`Defeated ${game.combatEnemy.name}!`, COLORS.goldAccent);
        game.fame += 25;
        // Clear enemy from map
        const hex = getHex(party.x, party.y);
        if (hex) hex.enemy = null;
        endCombat(true);
        return;
    }

    // Enemy attacks
    let enemyDamage = game.combatEnemy.damage - defense;
    if (enemyDamage > 0) {
        // Damage random companion or explorer
        if (party.companions.length > 0 && Math.random() < 0.7) {
            const target = party.companions[Math.floor(Math.random() * party.companions.length)];
            target.health -= enemyDamage;
            addMessage(`${target.name} took ${enemyDamage} damage!`, COLORS.dangerRed);

            // Apply status effect from enemy
            if (game.combatEnemy.effect && Math.random() < 0.4) {
                applyStatusEffect(target, game.combatEnemy.effect);
            }

            if (target.health <= 0) {
                addMessage(`${target.name} died!`, COLORS.dangerRed);
                party.companions = party.companions.filter(c => c !== target);
            }
        } else {
            party.sanity -= enemyDamage * 2;
            addMessage(`You took ${enemyDamage} damage! (-${enemyDamage * 2} sanity)`, COLORS.dangerRed);
        }
    } else {
        addMessage('Blocked enemy attack!', COLORS.sanityBlue);
    }

    // Process status effects
    processStatusEffects();

    // Next round
    game.combatRound++;
    game.combatDice = rollPartyDice();
}

function applyStatusEffect(target, effectType) {
    const effectConfig = STATUS_EFFECTS[effectType];
    if (!effectConfig) return;

    // Check if already has this effect
    const existing = game.partyEffects.find(e => e.target === target && e.type === effectType);
    if (existing) {
        existing.duration = effectConfig.duration; // Refresh duration
    } else {
        game.partyEffects.push({
            target: target,
            type: effectType,
            damage: effectConfig.damage,
            duration: effectConfig.duration,
            color: effectConfig.color
        });
        addMessage(`${target.name} is ${effectType}!`, effectConfig.color);
    }
}

function processStatusEffects() {
    for (let i = game.partyEffects.length - 1; i >= 0; i--) {
        const effect = game.partyEffects[i];

        // Deal damage
        effect.target.health -= effect.damage;
        addMessage(`${effect.target.name}: ${effect.type} deals ${effect.damage} damage!`, effect.color);

        // Check for death
        if (effect.target.health <= 0) {
            addMessage(`${effect.target.name} died from ${effect.type}!`, COLORS.dangerRed);
            party.companions = party.companions.filter(c => c !== effect.target);
            game.partyEffects.splice(i, 1);
            continue;
        }

        // Decrease duration
        effect.duration--;
        if (effect.duration <= 0) {
            addMessage(`${effect.target.name} recovered from ${effect.type}!`, COLORS.sanityBlue);
            game.partyEffects.splice(i, 1);
        }
    }
}

function endCombat(victory) {
    game.state = 'playing';
    game.combatEnemy = null;
    game.combatDice = null;
}

function checkInsanityEvent() {
    if (party.sanity > 0) return;

    // 20% chance of insanity event per move
    if (Math.random() < 0.2) {
        const events = [
            { text: 'Madness! A companion attacks the party!', effect: 'attack' },
            { text: 'Despair! A companion deserts!', effect: 'desert' },
            { text: 'Hallucinations plague the party!', effect: 'hallucinate' }
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        addMessage(event.text, COLORS.dangerRed);

        if (event.effect === 'desert' && party.companions.length > 0) {
            const leaving = party.companions.pop();
            addMessage(`${leaving.name} left the party!`, COLORS.dangerRed);
        }
    }
}

function useItem(index) {
    if (index >= party.inventory.length) return;

    const item = party.inventory[index];

    if (item.sanity) {
        party.sanity = Math.min(party.maxSanity, party.sanity + item.sanity);
        addMessage(`Used ${item.name}: +${item.sanity} Sanity`, COLORS.sanityBlue);
        party.inventory.splice(index, 1);
    } else if (item.heal) {
        // Heal injured companion
        const injured = party.companions.find(c => c.health < c.maxHealth);
        if (injured) {
            injured.health = Math.min(injured.maxHealth, injured.health + item.heal);
            addMessage(`Healed ${injured.name}`, COLORS.healthRed);
            party.inventory.splice(index, 1);
        }
    } else if (item.revealPyramid) {
        // Treasure map - reveal pyramid location
        const pyramidHex = hexMap.find(h => h.location === 'pyramid');
        if (pyramidHex) {
            // Reveal the pyramid hex and surrounding area
            revealArea(pyramidHex.q, pyramidHex.r);
            game.pyramidRevealed = true;
            addMessage('The map reveals the Golden Pyramid location!', COLORS.goldAccent);
            party.inventory.splice(index, 1);
        } else {
            addMessage('The map shows nothing useful...', '#888');
        }
    }
}

// UI
function updateHoverHex() {
    const worldX = mouse.x + camera.x;
    const worldY = mouse.y + camera.y;
    const hex = pixelToHex(worldX, worldY);
    hoverHex = { q: hex.q, r: hex.r };
}

function handleClick(button) {
    if (game.state === 'title') {
        game.state = 'explorerSelect';
        return;
    }

    if (game.state === 'explorerSelect') {
        // Check explorer buttons
        const explorerList = Object.keys(EXPLORERS);
        const startX = WIDTH/2 - 400;
        explorerList.forEach((explorerKey, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const btnX = startX + col * 280;
            const btnY = HEIGHT/2 - 100 + row * 140;
            if (mouse.x > btnX && mouse.x < btnX + 260 &&
                mouse.y > btnY && mouse.y < btnY + 120) {
                game.explorer = explorerKey;
                game.state = 'biomeSelect';
            }
        });
        return;
    }

    if (game.state === 'biomeSelect') {
        // Check biome buttons
        const biomeList = Object.keys(BIOMES);
        biomeList.forEach((biomeKey, i) => {
            const btnX = WIDTH/2 - 250 + i * 180;
            const btnY = HEIGHT/2 - 50;
            if (mouse.x > btnX && mouse.x < btnX + 160 &&
                mouse.y > btnY && mouse.y < btnY + 120) {
                game.biome = biomeKey;
                startGame();
            }
        });
        return;
    }

    if (game.state === 'playing') {
        // Update hover hex from current mouse position
        updateHoverHex();

        if (hoverHex) {
            const hex = getHex(hoverHex.q, hoverHex.r);
            const key = getHexKey(hoverHex.q, hoverHex.r);
            const isRevealed = revealedHexes.has(key);

            if (hex && isRevealed) {
                moveParty(hoverHex.q, hoverHex.r);
            }
        }
    }

    if (game.state === 'combat') {
        // Check main combat buttons (first row)
        const btnY = HEIGHT - 100;
        if (mouse.y > btnY && mouse.y < btnY + 40) {
            if (mouse.x > WIDTH/2 - 180 && mouse.x < WIDTH/2 - 70) {
                executeCombatAction('attack');
            } else if (mouse.x > WIDTH/2 - 55 && mouse.x < WIDTH/2 + 55) {
                executeCombatAction('defend');
            } else if (mouse.x > WIDTH/2 + 70 && mouse.x < WIDTH/2 + 180) {
                executeCombatAction('flee');
            }
        }
        // Check combo buttons (second row)
        const btn2Y = HEIGHT - 50;
        if (mouse.y > btn2Y && mouse.y < btn2Y + 35) {
            if (mouse.x > WIDTH/2 - 180 && mouse.x < WIDTH/2 - 70) {
                executeCombatAction('power');
            } else if (mouse.x > WIDTH/2 - 55 && mouse.x < WIDTH/2 + 55) {
                executeCombatAction('evade');
            } else if (mouse.x > WIDTH/2 + 70 && mouse.x < WIDTH/2 + 180) {
                executeCombatAction('tactical');
            }
        }
    }

    if (game.state === 'trading') {
        const panelX = WIDTH/2 - 300;
        const panelY = 50;

        // Check buy buttons (village stock)
        game.tradingStock.forEach((item, i) => {
            const y = panelY + 140 + i * 45;
            if (mouse.x > panelX + 30 && mouse.x < panelX + 280 &&
                mouse.y > y && mouse.y < y + 38) {
                buyItem(i);
            }
        });

        // Check sell buttons (inventory)
        party.inventory.slice(0, 8).forEach((item, i) => {
            const y = panelY + 140 + i * 45;
            if (mouse.x > panelX + 320 && mouse.x < panelX + 570 &&
                mouse.y > y && mouse.y < y + 38) {
                sellItem(i);
            }
        });

        // Check hire button
        if (game.tradingRecruit) {
            if (mouse.x > panelX + 30 && mouse.x < panelX + 280 &&
                mouse.y > panelY + 420 && mouse.y < panelY + 470) {
                hireCompanion();
            }
        }

        // Check leave button
        if (mouse.x > WIDTH/2 - 60 && mouse.x < WIDTH/2 + 60 &&
            mouse.y > panelY + 480 && mouse.y < panelY + 520) {
            closeTrading();
        }
    }

    if (game.state === 'victory') {
        // Next Expedition button
        if (mouse.x > WIDTH/2 - 100 && mouse.x < WIDTH/2 + 100 &&
            mouse.y > HEIGHT/2 + 90 && mouse.y < HEIGHT/2 + 130) {
            // Go to museum first if we have treasures
            if (game.treasures.length > 0) {
                game.state = 'museum';
            } else {
                nextExpedition();
            }
        }
        // New Game button
        if (mouse.x > WIDTH/2 - 80 && mouse.x < WIDTH/2 + 80 &&
            mouse.y > HEIGHT/2 + 140 && mouse.y < HEIGHT/2 + 170) {
            newGame();
        }
    }

    if (game.state === 'museum') {
        // Donate buttons
        game.treasures.forEach((treasure, i) => {
            const y = 200 + i * 50;
            if (mouse.x > WIDTH/2 - 150 && mouse.x < WIDTH/2 + 150 &&
                mouse.y > y && mouse.y < y + 40) {
                donateToMuseum(i);
            }
        });
        // Continue button
        if (mouse.x > WIDTH/2 - 80 && mouse.x < WIDTH/2 + 80 &&
            mouse.y > HEIGHT - 100 && mouse.y < HEIGHT - 60) {
            nextExpedition();
        }
    }

    if (game.state === 'gameover') {
        if (mouse.y > HEIGHT/2 + 80) {
            newGame();
        }
    }
}

function nextExpedition() {
    // Keep fame, increment expedition number
    game.expedition++;
    game.state = 'biomeSelect';
}

function newGame() {
    game.expedition = 1;
    game.fame = 0;
    game.state = 'biomeSelect';
}

function addMessage(text, color = '#fff') {
    messages.push({ text, color, time: 3 });
    if (messages.length > 5) messages.shift();
}

function startGame() {
    game.state = 'playing';
    game.day = 1;
    game.campsUsed = 0;
    game.racePosition = 1;
    game.weather = 'clear';
    game.weatherDuration = 5;

    // Apply explorer bonuses
    let maxSanity = 100;
    if (game.explorer) {
        const explorer = EXPLORERS[game.explorer];
        maxSanity += explorer.sanityBonus || 0;
    }

    party.sanity = maxSanity;
    party.maxSanity = maxSanity;
    party.standing = 100;
    party.inventory = [
        { type: 'chocolate', ...ITEMS.chocolate },
        { type: 'chocolate', ...ITEMS.chocolate },
        { type: 'chocolate', ...ITEMS.chocolate },
        { type: 'machete', ...ITEMS.machete }
    ];

    // Starting companions
    party.companions = [
        { ...COMPANIONS.soldier, id: 1 },
        { ...COMPANIONS.scout, id: 2 },
        { ...COMPANIONS.porter, id: 3 }
    ];

    // Initialize rival system
    initRivals();

    generateMap();
    messages = [];

    if (game.explorer) {
        const explorer = EXPLORERS[game.explorer];
        addMessage(`${explorer.name} begins the expedition!`, COLORS.goldAccent);
    } else {
        addMessage('Expedition begins! Find the Golden Pyramid!', COLORS.goldAccent);
    }

    if (game.rivals.length > 0) {
        addMessage(`Racing against: ${game.rivals.map(r => r.name).join(', ')}`, '#FF5722');
    }
}

// Drawing
function draw() {
    ctx.fillStyle = COLORS.fogDark;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (game.state === 'title') {
        drawTitle();
    } else if (game.state === 'explorerSelect') {
        drawExplorerSelect();
    } else if (game.state === 'biomeSelect') {
        drawBiomeSelect();
    } else if (game.state === 'museum') {
        drawMuseum();
    } else if (game.state === 'playing' || game.state === 'combat' || game.state === 'trading') {
        updateCamera();
        drawMap();
        drawParty();
        drawUI();

        if (game.state === 'combat') {
            drawCombat();
        }
        if (game.state === 'trading') {
            drawTrading();
        }
    } else if (game.state === 'victory') {
        drawVictory();
    } else if (game.state === 'gameover') {
        drawGameOver();
    }

    drawMessages();
}

function updateCamera() {
    const partyPos = hexToPixel(party.x, party.y);
    camera.x = partyPos.x - WIDTH / 2;
    camera.y = partyPos.y - HEIGHT / 2;
}

function drawTitle() {
    // Parchment background
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 300, HEIGHT/2 - 200, 600, 400);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 4;
    ctx.strokeRect(WIDTH/2 - 300, HEIGHT/2 - 200, 600, 400);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CURIOUS EXPEDITION', WIDTH/2, HEIGHT/2 - 100);

    ctx.font = '24px Georgia';
    ctx.fillText('A Victorian Exploration Roguelike', WIDTH/2, HEIGHT/2 - 50);

    ctx.font = '18px Georgia';
    ctx.fillText('Click anywhere or press SPACE to begin', WIDTH/2, HEIGHT/2 + 20);

    ctx.font = '16px Georgia';
    ctx.fillText('Click hexes to move | 1-9 to use items', WIDTH/2, HEIGHT/2 + 60);
    ctx.fillText('Find the Golden Pyramid before sanity runs out!', WIDTH/2, HEIGHT/2 + 90);

    ctx.textAlign = 'left';
}

function drawExplorerSelect() {
    // Parchment background
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 420, HEIGHT/2 - 250, 840, 500);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 4;
    ctx.strokeRect(WIDTH/2 - 420, HEIGHT/2 - 250, 840, 500);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR EXPLORER', WIDTH/2, HEIGHT/2 - 190);

    ctx.font = '14px Georgia';
    ctx.fillText('Each explorer has unique abilities and dice', WIDTH/2, HEIGHT/2 - 160);

    // Explorer buttons
    const explorerList = Object.keys(EXPLORERS);
    const startX = WIDTH/2 - 400;
    explorerList.forEach((explorerKey, i) => {
        const explorer = EXPLORERS[explorerKey];
        const col = i % 3;
        const row = Math.floor(i / 3);
        const btnX = startX + col * 280;
        const btnY = HEIGHT/2 - 100 + row * 140;

        // Button background
        ctx.fillStyle = explorer.portrait;
        ctx.fillRect(btnX, btnY, 260, 120);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, 260, 120);

        // Explorer name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Georgia';
        ctx.fillText(explorer.name, btnX + 130, btnY + 25);

        // Title
        ctx.font = '12px Georgia';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(explorer.title, btnX + 130, btnY + 45);

        // Dice
        ctx.font = '10px Georgia';
        ctx.fillText(`Dice: ${explorer.dice.join(', ')}`, btnX + 130, btnY + 70);

        // Bonuses
        if (explorer.sanityBonus > 0) {
            ctx.fillText(`+${explorer.sanityBonus} Max Sanity`, btnX + 130, btnY + 90);
        }
        if (explorer.fameBonus > 0) {
            ctx.fillText(`+${explorer.fameBonus}% Fame Bonus`, btnX + 130, btnY + 105);
        }
    });

    ctx.textAlign = 'left';
}

function drawBiomeSelect() {
    // Parchment background
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 350, HEIGHT/2 - 200, 700, 400);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 4;
    ctx.strokeRect(WIDTH/2 - 350, HEIGHT/2 - 200, 700, 400);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT DESTINATION', WIDTH/2, HEIGHT/2 - 140);

    // Show selected explorer
    if (game.explorer) {
        const explorer = EXPLORERS[game.explorer];
        ctx.font = '16px Georgia';
        ctx.fillText(`Explorer: ${explorer.name} | Expedition ${game.expedition} | Total Fame: ${game.fame}`, WIDTH/2, HEIGHT/2 - 100);
    } else {
        ctx.font = '16px Georgia';
        ctx.fillText(`Expedition ${game.expedition} | Total Fame: ${game.fame}`, WIDTH/2, HEIGHT/2 - 100);
    }

    // Biome buttons
    const biomeList = Object.keys(BIOMES);
    biomeList.forEach((biomeKey, i) => {
        const biome = BIOMES[biomeKey];
        const btnX = WIDTH/2 - 250 + i * 180;
        const btnY = HEIGHT/2 - 50;

        // Button background
        ctx.fillStyle = biome.color;
        ctx.fillRect(btnX, btnY, 160, 120);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, 160, 120);

        // Biome name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Georgia';
        ctx.fillText(biome.name, btnX + 80, btnY + 35);

        // Description
        ctx.font = '10px Georgia';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const words = biome.description.split(', ');
        words.forEach((word, j) => {
            ctx.fillText(word, btnX + 80, btnY + 60 + j * 15);
        });
    });

    ctx.font = '14px Georgia';
    ctx.fillStyle = COLORS.inkBrown;
    ctx.fillText('Click a destination to begin your expedition!', WIDTH/2, HEIGHT/2 + 120);

    ctx.textAlign = 'left';
}

function drawMap() {
    // Draw hexes
    for (const hex of hexMap) {
        const key = getHexKey(hex.q, hex.r);
        const revealed = revealedHexes.has(key);
        const visited = visitedHexes.has(key);

        if (!revealed) continue;

        const pos = hexToPixel(hex.q, hex.r);
        const screenX = pos.x - camera.x;
        const screenY = pos.y - camera.y;

        // Skip if off screen
        if (screenX < -HEX.size * 2 || screenX > WIDTH + HEX.size * 2 ||
            screenY < -HEX.size * 2 || screenY > HEIGHT + HEX.size * 2) continue;

        // Draw hex
        drawHex(screenX, screenY, hex, visited);
    }

    // Draw path preview
    if (hoverHex && game.state === 'playing') {
        const targetHex = getHex(hoverHex.q, hoverHex.r);
        if (targetHex && TERRAIN[targetHex.terrain].passable &&
            revealedHexes.has(getHexKey(hoverHex.q, hoverHex.r))) {
            const previewPath = findPath(party.x, party.y, hoverHex.q, hoverHex.r);
            ctx.strokeStyle = COLORS.goldAccent;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            previewPath.forEach((p, i) => {
                const pos = hexToPixel(p.q, p.r);
                const sx = pos.x - camera.x;
                const sy = pos.y - camera.y;
                if (i === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Draw pyramid marker if revealed
    if (game.pyramidRevealed) {
        const pyramidHex = hexMap.find(h => h.location === 'pyramid');
        if (pyramidHex) {
            const pos = hexToPixel(pyramidHex.q, pyramidHex.r);
            const screenX = pos.x - camera.x;
            const screenY = pos.y - camera.y;

            // Pulsing golden marker
            const pulse = Math.sin(Date.now() / 200) * 5 + 20;
            ctx.beginPath();
            ctx.arc(screenX, screenY - 30, pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.fill();
            ctx.strokeStyle = COLORS.goldAccent;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Arrow pointing down
            ctx.beginPath();
            ctx.moveTo(screenX, screenY - 10);
            ctx.lineTo(screenX - 8, screenY - 20);
            ctx.lineTo(screenX + 8, screenY - 20);
            ctx.closePath();
            ctx.fillStyle = COLORS.goldAccent;
            ctx.fill();
        }
    }
}

function drawHex(x, y, hex, visited) {
    const terrain = TERRAIN[hex.terrain];

    // Hex shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const px = x + HEX.size * Math.cos(angle);
        const py = y + HEX.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Fill color
    ctx.fillStyle = terrain.color;
    if (!visited) {
        // Darken unvisited but revealed
        ctx.globalAlpha = 0.7;
    }
    ctx.fill();
    ctx.globalAlpha = 1;

    // Hex outline
    ctx.strokeStyle = '#00000040';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw location icon
    if (hex.location && visited) {
        const loc = LOCATIONS[hex.location];
        ctx.fillStyle = loc.color;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(loc.icon, x, y);
    }

    // Draw enemy
    if (hex.enemy && visited) {
        const enemy = ENEMIES[hex.enemy];
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Hover highlight
    if (hoverHex && hoverHex.q === hex.q && hoverHex.r === hex.r) {
        ctx.strokeStyle = COLORS.goldAccent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i - Math.PI / 6;
            const px = x + HEX.size * Math.cos(angle);
            const py = y + HEX.size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function drawParty() {
    const pos = hexToPixel(party.x, party.y);
    const screenX = pos.x - camera.x;
    const screenY = pos.y - camera.y;

    // Party marker
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 8);
    ctx.lineTo(screenX, screenY - 25);
    ctx.lineTo(screenX + 12, screenY - 20);
    ctx.lineTo(screenX, screenY - 15);
    ctx.fill();
}

function drawUI() {
    // Top bar - sanity and stats
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(10, 10, 300, 100);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 300, 100);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';

    // Weather display
    const weather = WEATHER[game.weather];
    ctx.fillText(`Day ${game.day} | Fame: ${game.fame} | ${weather?.icon || '☀'} ${game.weather}`, 20, 30);

    // Sanity bar
    ctx.fillStyle = '#ddd';
    ctx.fillRect(20, 40, 200, 16);
    ctx.fillStyle = COLORS.sanityBlue;
    ctx.fillRect(20, 40, 200 * (party.sanity / party.maxSanity), 16);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.strokeRect(20, 40, 200, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Sanity: ${Math.ceil(party.sanity)}/${party.maxSanity}`, 120, 53);

    // Party count and camp info
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.inkBrown;
    ctx.fillText(`Party: ${party.companions.length + 1} | Camps: ${CAMP.maxRests - game.campsUsed} left (C key)`, 20, 78);

    // Rival progress (if any)
    if (game.rivals.length > 0) {
        ctx.fillText(`Race Position: ${game.racePosition}${game.racePosition === 1 ? 'st' : game.racePosition === 2 ? 'nd' : 'rd'}`, 20, 95);
    }

    // Inventory
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(10, HEIGHT - 100, 300, 90);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.strokeRect(10, HEIGHT - 100, 300, 90);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '12px Georgia';
    ctx.fillText('Inventory (press 1-9 to use):', 20, HEIGHT - 82);

    party.inventory.forEach((item, i) => {
        const x = 20 + (i % 5) * 55;
        const y = HEIGHT - 60 + Math.floor(i / 5) * 25;
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x, y, 50, 22);
        ctx.strokeStyle = COLORS.inkBrown;
        ctx.strokeRect(x, y, 50, 22);
        ctx.fillStyle = COLORS.inkBrown;
        ctx.font = '10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}:${item.icon || item.name[0]}`, x + 25, y + 15);
    });

    // Companions panel
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH - 200, 10, 190, 30 + party.companions.length * 25);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.strokeRect(WIDTH - 200, 10, 190, 30 + party.companions.length * 25);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Companions:', WIDTH - 190, 28);

    party.companions.forEach((c, i) => {
        const y = 48 + i * 25;
        ctx.fillStyle = COLORS.inkBrown;
        ctx.fillText(`${c.name}: ${c.health}/${c.maxHealth} HP`, WIDTH - 190, y);
    });

    // Hover info
    if (hoverHex && game.state === 'playing') {
        const hex = getHex(hoverHex.q, hoverHex.r);
        if (hex && revealedHexes.has(getHexKey(hoverHex.q, hoverHex.r))) {
            const terrain = TERRAIN[hex.terrain];
            ctx.fillStyle = COLORS.parchment;
            ctx.fillRect(mouse.x + 15, mouse.y + 15, 150, 60);
            ctx.strokeStyle = COLORS.inkBrown;
            ctx.strokeRect(mouse.x + 15, mouse.y + 15, 150, 60);

            ctx.fillStyle = COLORS.inkBrown;
            ctx.font = '12px Georgia';
            ctx.fillText(terrain.name, mouse.x + 25, mouse.y + 32);
            ctx.fillText(`Cost: ${terrain.cost + 5} sanity`, mouse.x + 25, mouse.y + 48);
            if (hex.location) {
                ctx.fillText(LOCATIONS[hex.location].name, mouse.x + 25, mouse.y + 64);
            }
        }
    }

    ctx.textAlign = 'left';
}

function drawCombat() {
    // Combat overlay
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Combat panel
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 250, 50, 500, 450);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 4;
    ctx.strokeRect(WIDTH/2 - 250, 50, 500, 450);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 28px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('COMBAT', WIDTH/2, 90);

    // Enemy info
    const enemy = game.combatEnemy;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(WIDTH/2, 160, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '20px Georgia';
    ctx.fillText(enemy.name, WIDTH/2, 220);

    // Enemy health bar
    ctx.fillStyle = '#ddd';
    ctx.fillRect(WIDTH/2 - 100, 235, 200, 20);
    ctx.fillStyle = COLORS.healthRed;
    ctx.fillRect(WIDTH/2 - 100, 235, 200 * (enemy.health / enemy.maxHealth), 20);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(WIDTH/2 - 100, 235, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.fillText(`${enemy.health}/${enemy.maxHealth}`, WIDTH/2, 250);

    // Dice
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '16px Georgia';
    ctx.fillText(`Round ${game.combatRound} - Your Dice:`, WIDTH/2, 290);

    game.combatDice.forEach((die, i) => {
        const x = WIDTH/2 - 80 + (i % 4) * 50;
        const y = 310 + Math.floor(i / 4) * 50;

        const colors = { red: '#E53935', green: '#43A047', blue: '#1E88E5' };
        ctx.fillStyle = colors[die.type] || '#888';
        ctx.fillRect(x - 18, y - 18, 36, 36);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x - 18, y - 18, 36, 36);

        ctx.fillStyle = '#fff';
        ctx.font = '10px Georgia';
        ctx.fillText(die.face.slice(0, 3), x, y + 4);
    });

    // Status effects display
    if (game.partyEffects && game.partyEffects.length > 0) {
        ctx.font = '12px Georgia';
        ctx.fillStyle = COLORS.inkBrown;
        ctx.fillText('Active Effects:', WIDTH/2, 410);

        game.partyEffects.forEach((effect, i) => {
            const effectY = 425 + i * 18;
            ctx.fillStyle = effect.color;
            ctx.fillText(`${effect.target.name}: ${effect.type} (${effect.duration} turns)`, WIDTH/2, effectY);
        });
    }

    // Action buttons
    const btnY = HEIGHT - 100;

    // Attack button
    ctx.fillStyle = '#E53935';
    ctx.fillRect(WIDTH/2 - 180, btnY, 110, 40);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(WIDTH/2 - 180, btnY, 110, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Georgia';
    ctx.fillText('ATTACK', WIDTH/2 - 125, btnY + 26);

    // Defend button
    ctx.fillStyle = '#43A047';
    ctx.fillRect(WIDTH/2 - 55, btnY, 110, 40);
    ctx.strokeRect(WIDTH/2 - 55, btnY, 110, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('DEFEND', WIDTH/2, btnY + 26);

    // Flee button
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(WIDTH/2 + 70, btnY, 110, 40);
    ctx.strokeRect(WIDTH/2 + 70, btnY, 110, 40);
    ctx.fillStyle = '#000';
    ctx.fillText('FLEE', WIDTH/2 + 125, btnY + 26);

    // Combo buttons (second row)
    const btn2Y = HEIGHT - 50;

    // Check available combos
    const hasStrength = game.combatDice.some(d => d.face === 'strength');
    const hasAttack = game.combatDice.some(d => d.face === 'attack');
    const hasAgility = game.combatDice.some(d => d.face === 'agility');
    const hasDefense = game.combatDice.some(d => d.face === 'defense');
    const hasTactics = game.combatDice.some(d => d.face === 'tactics');
    const hasPrecision = game.combatDice.some(d => d.face === 'precision');

    // Power button (strength + attack)
    ctx.fillStyle = (hasStrength && hasAttack) ? '#FF5722' : '#666';
    ctx.fillRect(WIDTH/2 - 180, btn2Y, 110, 35);
    ctx.strokeRect(WIDTH/2 - 180, btn2Y, 110, 35);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.fillText('POWER', WIDTH/2 - 125, btn2Y + 22);

    // Evade button (agility + defense)
    ctx.fillStyle = (hasAgility && hasDefense) ? '#2196F3' : '#666';
    ctx.fillRect(WIDTH/2 - 55, btn2Y, 110, 35);
    ctx.strokeRect(WIDTH/2 - 55, btn2Y, 110, 35);
    ctx.fillStyle = '#fff';
    ctx.fillText('EVADE', WIDTH/2, btn2Y + 22);

    // Tactical button (tactics + precision)
    ctx.fillStyle = (hasTactics && hasPrecision) ? '#9C27B0' : '#666';
    ctx.fillRect(WIDTH/2 + 70, btn2Y, 110, 35);
    ctx.strokeRect(WIDTH/2 + 70, btn2Y, 110, 35);
    ctx.fillStyle = '#fff';
    ctx.fillText('TACTICAL', WIDTH/2 + 125, btn2Y + 22);

    ctx.textAlign = 'left';
}

function drawTrading() {
    // Trading overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Trading panel
    const panelX = WIDTH/2 - 300;
    const panelY = 50;
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(panelX, panelY, 600, 500);
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 4;
    ctx.strokeRect(panelX, panelY, 600, 500);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 28px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('NATIVE VILLAGE', WIDTH/2, panelY + 40);

    // Standing display
    ctx.font = '16px Georgia';
    ctx.fillText(`Standing: ${party.standing}`, WIDTH/2, panelY + 70);

    // Village stock section
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('Village Stock (Click to Buy):', panelX + 30, panelY + 110);

    game.tradingStock.forEach((item, i) => {
        const y = panelY + 140 + i * 45;
        // Item button
        ctx.fillStyle = '#E8E0D0';
        ctx.fillRect(panelX + 30, y, 250, 38);
        ctx.strokeStyle = '#8B7355';
        ctx.strokeRect(panelX + 30, y, 250, 38);

        ctx.fillStyle = COLORS.inkBrown;
        ctx.font = '14px Georgia';
        ctx.fillText(`${item.name}`, panelX + 45, y + 24);
        ctx.fillStyle = COLORS.goldAccent;
        ctx.fillText(`${item.price} standing`, panelX + 200, y + 24);
    });

    // Your inventory section
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('Your Items (Click to Sell):', panelX + 320, panelY + 110);

    party.inventory.slice(0, 8).forEach((item, i) => {
        const y = panelY + 140 + i * 45;
        // Item button
        ctx.fillStyle = '#D8D0C0';
        ctx.fillRect(panelX + 320, y, 250, 38);
        ctx.strokeStyle = '#8B7355';
        ctx.strokeRect(panelX + 320, y, 250, 38);

        ctx.fillStyle = COLORS.inkBrown;
        ctx.font = '14px Georgia';
        ctx.fillText(`${item.name}`, panelX + 335, y + 24);
        const sellPrice = Math.floor(getItemPrice(item.type) / 2);
        ctx.fillStyle = '#888';
        ctx.fillText(`+${sellPrice}`, panelX + 490, y + 24);
    });

    // Recruit section
    if (game.tradingRecruit) {
        ctx.fillStyle = COLORS.inkBrown;
        ctx.font = 'bold 18px Georgia';
        ctx.fillText('Hire Companion:', panelX + 30, panelY + 410);

        ctx.fillStyle = '#C8E0C8';
        ctx.fillRect(panelX + 30, panelY + 420, 250, 50);
        ctx.strokeStyle = '#8B7355';
        ctx.strokeRect(panelX + 30, panelY + 420, 250, 50);

        ctx.fillStyle = COLORS.inkBrown;
        ctx.font = '14px Georgia';
        ctx.fillText(`${game.tradingRecruit.name}`, panelX + 45, panelY + 445);
        ctx.fillText(`HP: ${game.tradingRecruit.health}`, panelX + 130, panelY + 445);
        ctx.fillStyle = COLORS.goldAccent;
        ctx.fillText(`${game.tradingRecruit.price} standing`, panelX + 200, panelY + 460);
    }

    // Leave button
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(WIDTH/2 - 60, panelY + 480, 120, 40);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(WIDTH/2 - 60, panelY + 480, 120, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('LEAVE', WIDTH/2, panelY + 506);

    ctx.textAlign = 'left';
}

function drawVictory() {
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 250, HEIGHT/2 - 180, 500, 360);
    ctx.strokeStyle = COLORS.goldAccent;
    ctx.lineWidth = 6;
    ctx.strokeRect(WIDTH/2 - 250, HEIGHT/2 - 180, 500, 360);

    ctx.fillStyle = COLORS.goldAccent;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH/2, HEIGHT/2 - 120);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '20px Georgia';
    ctx.fillText('You found the Golden Pyramid!', WIDTH/2, HEIGHT/2 - 70);
    ctx.fillText(`Days: ${game.day}`, WIDTH/2, HEIGHT/2 - 30);
    ctx.fillText(`Fame Earned: ${game.fame}`, WIDTH/2, HEIGHT/2);
    ctx.fillText(`Companions Survived: ${party.companions.length}`, WIDTH/2, HEIGHT/2 + 30);

    ctx.font = '16px Georgia';
    ctx.fillText(`Expedition ${game.expedition} Complete!`, WIDTH/2, HEIGHT/2 + 70);

    // Next Expedition button
    ctx.fillStyle = COLORS.goldAccent;
    ctx.fillRect(WIDTH/2 - 100, HEIGHT/2 + 90, 200, 40);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH/2 - 100, HEIGHT/2 + 90, 200, 40);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Georgia';
    ctx.fillText('NEXT EXPEDITION', WIDTH/2, HEIGHT/2 + 116);

    // New Game button
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(WIDTH/2 - 80, HEIGHT/2 + 140, 160, 30);
    ctx.strokeRect(WIDTH/2 - 80, HEIGHT/2 + 140, 160, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Georgia';
    ctx.fillText('New Game', WIDTH/2, HEIGHT/2 + 160);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 250, HEIGHT/2 - 150, 500, 300);
    ctx.strokeStyle = COLORS.dangerRed;
    ctx.lineWidth = 6;
    ctx.strokeRect(WIDTH/2 - 250, HEIGHT/2 - 150, 500, 300);

    ctx.fillStyle = COLORS.dangerRed;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('EXPEDITION FAILED', WIDTH/2, HEIGHT/2 - 80);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '20px Georgia';
    ctx.fillText('Your party succumbed to madness...', WIDTH/2, HEIGHT/2 - 30);
    ctx.fillText(`Days Survived: ${game.day}`, WIDTH/2, HEIGHT/2 + 20);
    ctx.fillText(`Fame Earned: ${game.fame}`, WIDTH/2, HEIGHT/2 + 50);

    ctx.font = '16px Georgia';
    ctx.fillText('Click to try again', WIDTH/2, HEIGHT/2 + 100);
    ctx.textAlign = 'left';
}

function drawMuseum() {
    // Parchment background
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(WIDTH/2 - 300, 50, 600, HEIGHT - 100);
    ctx.strokeStyle = COLORS.goldAccent;
    ctx.lineWidth = 4;
    ctx.strokeRect(WIDTH/2 - 300, 50, 600, HEIGHT - 100);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('MUSEUM OF NATURAL HISTORY', WIDTH/2, 100);

    ctx.font = '16px Georgia';
    ctx.fillText('Donate your treasures for Fame!', WIDTH/2, 130);
    ctx.fillText(`Current Fame: ${game.fame}`, WIDTH/2, 160);

    // Treasures list
    if (game.treasures.length === 0) {
        ctx.font = '18px Georgia';
        ctx.fillStyle = '#888';
        ctx.fillText('No treasures to donate', WIDTH/2, HEIGHT/2);
    } else {
        game.treasures.forEach((treasure, i) => {
            const y = 200 + i * 50;

            // Treasure button
            const rarityColors = {
                common: '#9E9E9E',
                uncommon: '#4CAF50',
                rare: '#2196F3',
                legendary: '#FF9800'
            };
            ctx.fillStyle = rarityColors[treasure.rarity] || '#9E9E9E';
            ctx.fillRect(WIDTH/2 - 150, y, 300, 40);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(WIDTH/2 - 150, y, 300, 40);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Georgia';
            ctx.fillText(treasure.name, WIDTH/2, y + 18);
            ctx.font = '12px Georgia';
            ctx.fillText(`+${treasure.fame} Fame | ${treasure.rarity}`, WIDTH/2, y + 34);
        });
    }

    // Continue button
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(WIDTH/2 - 80, HEIGHT - 100, 160, 40);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(WIDTH/2 - 80, HEIGHT - 100, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Georgia';
    ctx.fillText('CONTINUE', WIDTH/2, HEIGHT - 74);

    ctx.textAlign = 'left';
}

function drawMessages() {
    ctx.textAlign = 'left';
    messages.forEach((msg, i) => {
        ctx.fillStyle = msg.color;
        ctx.globalAlpha = Math.min(1, msg.time);
        ctx.font = '14px Georgia';
        ctx.fillText(msg.text, WIDTH/2 - 200, HEIGHT - 120 - i * 20);
    });
    ctx.globalAlpha = 1;
}

// Update
function update(dt) {
    // Update message timers
    messages.forEach(m => m.time -= dt);
    messages = messages.filter(m => m.time > 0);

    // Check game over
    if (game.state === 'playing' && party.companions.length === 0 && party.sanity <= 0) {
        game.state = 'gameover';
    }
}

// Main loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.gameState = { game, party, hexMap };

// Start game
requestAnimationFrame(gameLoop);
