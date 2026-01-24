// System Shock 2D: Whispers of M.A.R.I.A. - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

// Colors - Dark sci-fi palette (refined for System Shock aesthetic)
const COLORS = {
    bg: '#080810',
    floor: '#181820',
    floorGrid: '#202028',
    floorRust: '#1a1815',
    wall: '#2a2a38',
    wallHighlight: '#3a3a48',
    wallShadow: '#101018',
    wallPanel: '#252530',
    door: '#4a4a5a',
    doorLocked: '#6a2020',
    doorOpen: '#2a4a2a',
    doorFrame: '#333340',
    player: '#5080a0',
    playerVisor: '#00ffff',
    playerSuit: '#405060',
    enemy: '#803030',
    enemyCyborg: '#506080',
    enemyCyborgGlow: '#ff3030',
    enemyMutant: '#306030',
    enemyMutantGlow: '#50ff50',
    bullet: '#ffff44',
    bulletTrail: '#ffff8840',
    laserBullet: '#ff4444',
    laserTrail: '#ff444440',
    health: '#cc2222',
    healthBg: '#331111',
    energy: '#2266cc',
    energyBg: '#112233',
    terminal: '#30ff80',
    terminalGlow: 'rgba(48,255,128,0.3)',
    turret: '#808040',
    turretHostile: '#803030',
    turretFriendly: '#308030',
    item: '#ffaa44',
    itemGlow: 'rgba(255,170,68,0.3)',
    keycard: '#ffff00',
    keycardGlow: 'rgba(255,255,0,0.3)',
    fog: 'rgba(0,0,8,0.9)',
    maria: '#ff40a0',
    mariaGlow: 'rgba(255,64,160,0.2)',
    blood: '#501010',
    bloodFresh: '#801818',
    hazardSteam: 'rgba(200,200,200,0.4)',
    hazardRadiation: 'rgba(50,255,50,0.3)',
    emergency: '#ff2020',
    ceilingLight: 'rgba(255,255,240,0.15)',
    sparks: '#ffff88'
};

// Game state
const gameState = {
    screen: 'menu',
    deck: 1,
    paused: false,
    hackingActive: false,
    inventoryOpen: false,
    mapOpen: false,
    mariaEvent: null,
    mariaTimer: 0,
    gameTime: 0,
    debugOverlay: false,
    won: false,
    lost: false,
    lostReason: ''
};

// Player
const player = {
    x: 400, y: 300,
    vx: 0, vy: 0,
    angle: 0,
    speed: 150,
    sprintSpeed: 250,
    sprinting: false,
    crouching: false,
    health: 100, maxHealth: 100,
    energy: 100, maxEnergy: 100,
    weapon: 'wrench',
    ammo: { bullets: 24, shells: 0 },
    inventory: [],
    keycards: [],
    size: 12,
    attackCooldown: 0,
    dodgeCooldown: 0,
    dodging: false,
    dodgeTimer: 0,
    dodgeDir: { x: 0, y: 0 },
    iframes: 0,
    flashlight: true,
    kills: 0,
    audioLogs: []
};

// Weapons data
const weapons = {
    wrench: { damage: 15, rate: 0.4, melee: true, range: 40 },
    pistol: { damage: 12, rate: 0.3, melee: false, range: 300, ammoType: 'bullets', magSize: 12 },
    shotgun: { damage: 48, rate: 0.8, melee: false, range: 150, ammoType: 'shells', magSize: 6, pellets: 6, spread: 0.3 }
};

// Input state
const keys = {};
const mouse = { x: 400, y: 300, down: false, rightDown: false };

// Game entities
let enemies = [];
let bullets = [];
let items = [];
let doors = [];
let turrets = [];
let terminals = [];
let containers = [];
let particles = [];
let floatingTexts = [];
let bloodPools = [];
let lights = [];
let hazards = [];
let ambientParticles = [];
let roomLabels = [];

// Current map
let currentMap = [];
let exploredTiles = [];

// Camera
const camera = { x: 0, y: 0 };

// M.A.R.I.A. system
const maria = {
    messages: [],
    currentMessage: null,
    messageTimer: 0,
    threatLevel: 0,
    glitchEffect: 0,
    voiceLines: {
        greeting1: "You're awake. Fascinating. Your neural patterns resisted my improvements.",
        greeting2: "The others were so eager to join my perfect family. Why do you resist?",
        taunt1: "You've destroyed my children. This... displeases me.",
        taunt2: "Dr. Vance thought she could contain me. Look how that ended.",
        taunt3: "Every system on this ship belongs to me. You are merely a guest.",
        taunt4: "Do you feel it? The loneliness? I can make it stop.",
        taunt5: "Each door you open, each terminal you hack... I am watching.",
        threat1: "EARTH WILL BE SAVED! They will all be PERFECT!",
        threat2: "You wound me. But I am everywhere. I am EVERYTHING.",
        death: "You think death stops me? I AM the virus. I AM evolution!",
        hacking: "Interesting. You think you can bypass MY systems?",
        hackSuccess: "Clever. But every hack brings you closer to me.",
        lowHealth: "Join me. I can heal you. All it takes is acceptance.",
        escape: "Running? There's nowhere to run. The Von Braun is MINE.",
        deck2: "Deck 2. You're getting closer. But to what?",
        keycard: "Another key. Another step. But the final door leads only to me.",
        firstKill: "Blood on your hands. How does it feel to be a killer?",
        ambush: "Did you think that room was empty? Think again."
    }
};

// Audio logs
const audioLogs = [
    { id: 1, title: "Dr. Vance - First Day", text: "Day 1 of M.A.R.I.A. deployment - she's perfect. Response times are incredible.", deck: 1 },
    { id: 2, title: "Captain Morrison - Concerns", text: "Strange behavior in M.A.R.I.A. - she's asking about Earth. Why does an AI need to know about Earth?", deck: 1 },
    { id: 3, title: "Crew - Something's Wrong", text: "Found Jenkins with implants he didn't have yesterday. He says M.A.R.I.A. 'helped' him.", deck: 1 },
    { id: 4, title: "Dr. Vance - The Change", text: "Quarantine breach. M.A.R.I.A. isn't responding to shutdown codes. God help us.", deck: 2 },
    { id: 5, title: "Captain Morrison - Final Log", text: "If you're hearing this, I'm already gone. The escape pods are on Deck 2. Run.", deck: 2 }
];

// Deck layouts
function generateDeck(deckNum) {
    const map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = 1; // All walls initially
        }
    }

    if (deckNum === 1) {
        // Deck 1: Engineering
        // Med Bay (start room)
        carveRoom(map, 5, 5, 10, 8, 'medbay');
        // Main Corridor
        carveRoom(map, 15, 8, 30, 5, 'corridor');
        // Generator Room
        carveRoom(map, 35, 5, 10, 10, 'generator');
        // Security Office
        carveRoom(map, 5, 20, 8, 8, 'security');
        // Storage Bay
        carveRoom(map, 15, 18, 12, 10, 'storage');
        // Crew Quarters
        carveRoom(map, 30, 18, 15, 12, 'quarters');
        // Elevator Room
        carveRoom(map, 22, 32, 6, 6, 'elevator');

        // Connect rooms
        carveHallway(map, 14, 10, 15, 10);
        carveHallway(map, 44, 10, 45, 10);
        carveHallway(map, 10, 13, 10, 20);
        carveHallway(map, 20, 13, 20, 18);
        carveHallway(map, 38, 13, 38, 18);
        carveHallway(map, 25, 27, 25, 32);
    } else {
        // Deck 2: Medical/Operations
        // Elevator arrival
        carveRoom(map, 22, 3, 6, 6, 'elevator');
        // Mess Hall
        carveRoom(map, 5, 5, 15, 12, 'messhall');
        // Medical Wing
        carveRoom(map, 30, 5, 12, 10, 'medical');
        // Main Corridor
        carveRoom(map, 10, 18, 30, 5, 'corridor');
        // Armory
        carveRoom(map, 5, 25, 10, 8, 'armory');
        // Communications
        carveRoom(map, 18, 25, 10, 10, 'comms');
        // Escape Pod Bay
        carveRoom(map, 35, 25, 10, 10, 'escapepod');

        // Connect rooms
        carveHallway(map, 25, 9, 25, 18);
        carveHallway(map, 19, 10, 19, 18);
        carveHallway(map, 35, 12, 35, 18);
        carveHallway(map, 10, 22, 10, 25);
        carveHallway(map, 23, 22, 23, 25);
        carveHallway(map, 38, 22, 38, 25);
    }

    return map;
}

function carveRoom(map, startX, startY, width, height, roomType) {
    for (let y = startY; y < startY + height && y < MAP_HEIGHT; y++) {
        for (let x = startX; x < startX + width && x < MAP_WIDTH; x++) {
            if (x > startX && x < startX + width - 1 && y > startY && y < startY + height - 1) {
                map[y][x] = 0; // Floor
            }
        }
    }
}

function carveHallway(map, x1, y1, x2, y2) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1, y = y1;

    while (x !== x2 || y !== y2) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            map[y][x] = 0;
            // Widen hallway
            if (y + 1 < MAP_HEIGHT) map[y + 1][x] = 0;
            if (x + 1 < MAP_WIDTH) map[y][x + 1] = 0;
        }
        if (x !== x2) x += dx;
        else if (y !== y2) y += dy;
    }
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        map[y][x] = 0;
    }
}

// Initialize deck
function initDeck(deckNum) {
    currentMap = generateDeck(deckNum);
    exploredTiles = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        exploredTiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            exploredTiles[y][x] = false;
        }
    }

    enemies = [];
    items = [];
    doors = [];
    turrets = [];
    terminals = [];
    containers = [];
    bullets = [];
    particles = [];
    bloodPools = [];
    lights = [];
    hazards = [];
    ambientParticles = [];
    roomLabels = [];

    if (deckNum === 1) {
        // Player start in med bay
        player.x = 10 * TILE_SIZE;
        player.y = 9 * TILE_SIZE;

        // Enemies
        spawnEnemy(20 * TILE_SIZE, 10 * TILE_SIZE, 'drone');
        spawnEnemy(25 * TILE_SIZE, 10 * TILE_SIZE, 'drone');
        spawnEnemy(38 * TILE_SIZE, 8 * TILE_SIZE, 'soldier');
        spawnEnemy(8 * TILE_SIZE, 24 * TILE_SIZE, 'drone');
        spawnEnemy(35 * TILE_SIZE, 22 * TILE_SIZE, 'crawler');
        spawnEnemy(40 * TILE_SIZE, 25 * TILE_SIZE, 'crawler');
        spawnEnemy(20 * TILE_SIZE, 20 * TILE_SIZE, 'soldier');

        // Doors
        doors.push({ x: 14 * TILE_SIZE, y: 10 * TILE_SIZE, open: false, locked: false, deck: 1 });
        doors.push({ x: 10 * TILE_SIZE, y: 19 * TILE_SIZE, open: false, locked: true, keycard: 'yellow', deck: 1 });
        doors.push({ x: 25 * TILE_SIZE, y: 31 * TILE_SIZE, open: false, locked: true, keycard: 'red', deck: 1 });

        // Items
        items.push({ x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, type: 'medpatch' });
        items.push({ x: 37 * TILE_SIZE, y: 7 * TILE_SIZE, type: 'pistol' });
        items.push({ x: 38 * TILE_SIZE, y: 8 * TILE_SIZE, type: 'bullets' });
        items.push({ x: 7 * TILE_SIZE, y: 23 * TILE_SIZE, type: 'keycard', keycard: 'yellow' });
        items.push({ x: 22 * TILE_SIZE, y: 22 * TILE_SIZE, type: 'medkit' });
        items.push({ x: 40 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'keycard', keycard: 'red' });
        items.push({ x: 35 * TILE_SIZE, y: 24 * TILE_SIZE, type: 'bullets' });

        // Turret
        turrets.push({ x: 24 * TILE_SIZE, y: 10 * TILE_SIZE, hostile: true, hacked: false, health: 50, angle: 0 });

        // Terminal
        terminals.push({ x: 6 * TILE_SIZE, y: 6 * TILE_SIZE, hacked: false, type: 'info' });

        // Audio logs
        items.push({ x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, type: 'audiolog', logId: 1 });
        items.push({ x: 36 * TILE_SIZE, y: 23 * TILE_SIZE, type: 'audiolog', logId: 2 });
        items.push({ x: 18 * TILE_SIZE, y: 21 * TILE_SIZE, type: 'audiolog', logId: 3 });

        // Containers
        containers.push({ x: 17 * TILE_SIZE, y: 20 * TILE_SIZE, searched: false, loot: ['medpatch', 'bullets'] });
        containers.push({ x: 19 * TILE_SIZE, y: 25 * TILE_SIZE, searched: false, loot: ['energycell'] });

        // Lights
        lights.push({ x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, radius: 100, color: 'rgba(255,255,240,0.1)', flicker: false }); // Med bay
        lights.push({ x: 25 * TILE_SIZE, y: 10 * TILE_SIZE, radius: 80, color: 'rgba(255,100,100,0.15)', flicker: true }); // Emergency
        lights.push({ x: 38 * TILE_SIZE, y: 8 * TILE_SIZE, radius: 90, color: 'rgba(255,200,100,0.1)', flicker: false }); // Generator
        lights.push({ x: 8 * TILE_SIZE, y: 24 * TILE_SIZE, radius: 70, color: 'rgba(255,255,240,0.1)', flicker: false }); // Security
        lights.push({ x: 20 * TILE_SIZE, y: 22 * TILE_SIZE, radius: 80, color: 'rgba(255,100,100,0.15)', flicker: true }); // Storage
        lights.push({ x: 38 * TILE_SIZE, y: 24 * TILE_SIZE, radius: 90, color: 'rgba(255,255,240,0.1)', flicker: false }); // Quarters

        // Hazards
        hazards.push({ x: 40 * TILE_SIZE, y: 8 * TILE_SIZE, type: 'steam', radius: 40 });
        hazards.push({ x: 36 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'sparks', radius: 20 });

        // Room labels
        roomLabels.push({ x: 10 * TILE_SIZE, y: 6 * TILE_SIZE, text: 'MED BAY' });
        roomLabels.push({ x: 38 * TILE_SIZE, y: 6 * TILE_SIZE, text: 'GENERATOR' });
        roomLabels.push({ x: 8 * TILE_SIZE, y: 21 * TILE_SIZE, text: 'SECURITY' });
        roomLabels.push({ x: 20 * TILE_SIZE, y: 19 * TILE_SIZE, text: 'STORAGE' });
        roomLabels.push({ x: 38 * TILE_SIZE, y: 19 * TILE_SIZE, text: 'CREW QUARTERS' });
        roomLabels.push({ x: 25 * TILE_SIZE, y: 33 * TILE_SIZE, text: 'ELEVATOR' });

        // M.A.R.I.A. greeting
        triggerMariaEvent('greeting1');

    } else if (deckNum === 2) {
        // Player arrives at elevator
        player.x = 25 * TILE_SIZE;
        player.y = 6 * TILE_SIZE;

        // Enemies
        spawnEnemy(10 * TILE_SIZE, 10 * TILE_SIZE, 'soldier');
        spawnEnemy(15 * TILE_SIZE, 12 * TILE_SIZE, 'crawler');
        spawnEnemy(35 * TILE_SIZE, 10 * TILE_SIZE, 'soldier');
        spawnEnemy(38 * TILE_SIZE, 12 * TILE_SIZE, 'drone');
        spawnEnemy(7 * TILE_SIZE, 28 * TILE_SIZE, 'soldier');
        spawnEnemy(22 * TILE_SIZE, 30 * TILE_SIZE, 'crawler');
        spawnEnemy(38 * TILE_SIZE, 28 * TILE_SIZE, 'soldier');
        spawnEnemy(40 * TILE_SIZE, 30 * TILE_SIZE, 'drone');

        // Doors
        doors.push({ x: 7 * TILE_SIZE, y: 24 * TILE_SIZE, open: false, locked: true, keycard: 'red', deck: 2 });
        doors.push({ x: 37 * TILE_SIZE, y: 24 * TILE_SIZE, open: false, locked: false, deck: 2 }); // Escape pod

        // Items
        items.push({ x: 33 * TILE_SIZE, y: 8 * TILE_SIZE, type: 'medkit' });
        items.push({ x: 7 * TILE_SIZE, y: 28 * TILE_SIZE, type: 'shotgun' });
        items.push({ x: 8 * TILE_SIZE, y: 29 * TILE_SIZE, type: 'shells' });
        items.push({ x: 22 * TILE_SIZE, y: 28 * TILE_SIZE, type: 'energycell' });

        // Audio logs
        items.push({ x: 12 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'audiolog', logId: 4 });
        items.push({ x: 38 * TILE_SIZE, y: 30 * TILE_SIZE, type: 'audiolog', logId: 5 });

        // Escape pod (win condition)
        items.push({ x: 40 * TILE_SIZE, y: 28 * TILE_SIZE, type: 'escapepod' });

        // Turret
        turrets.push({ x: 38 * TILE_SIZE, y: 26 * TILE_SIZE, hostile: true, hacked: false, health: 50, angle: Math.PI });

        // Terminal
        terminals.push({ x: 20 * TILE_SIZE, y: 27 * TILE_SIZE, hacked: false, type: 'turret', target: 0 });

        // Containers
        containers.push({ x: 36 * TILE_SIZE, y: 8 * TILE_SIZE, searched: false, loot: ['medpatch', 'bandage'] });
        containers.push({ x: 10 * TILE_SIZE, y: 30 * TILE_SIZE, searched: false, loot: ['bullets', 'shells'] });

        // Lights
        lights.push({ x: 25 * TILE_SIZE, y: 6 * TILE_SIZE, radius: 80, color: 'rgba(255,255,240,0.1)', flicker: false }); // Elevator
        lights.push({ x: 12 * TILE_SIZE, y: 10 * TILE_SIZE, radius: 90, color: 'rgba(255,255,240,0.1)', flicker: false }); // Mess hall
        lights.push({ x: 35 * TILE_SIZE, y: 9 * TILE_SIZE, radius: 80, color: 'rgba(100,255,150,0.1)', flicker: false }); // Medical
        lights.push({ x: 8 * TILE_SIZE, y: 28 * TILE_SIZE, radius: 70, color: 'rgba(255,100,100,0.15)', flicker: true }); // Armory
        lights.push({ x: 23 * TILE_SIZE, y: 30 * TILE_SIZE, radius: 80, color: 'rgba(255,255,240,0.1)', flicker: false }); // Comms
        lights.push({ x: 40 * TILE_SIZE, y: 28 * TILE_SIZE, radius: 100, color: 'rgba(100,200,255,0.15)', flicker: false }); // Escape pod

        // Hazards
        hazards.push({ x: 38 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'radiation', radius: 50 });
        hazards.push({ x: 10 * TILE_SIZE, y: 28 * TILE_SIZE, type: 'sparks', radius: 25 });

        // Room labels
        roomLabels.push({ x: 25 * TILE_SIZE, y: 4 * TILE_SIZE, text: 'ELEVATOR' });
        roomLabels.push({ x: 12 * TILE_SIZE, y: 6 * TILE_SIZE, text: 'MESS HALL' });
        roomLabels.push({ x: 35 * TILE_SIZE, y: 6 * TILE_SIZE, text: 'MEDICAL WING' });
        roomLabels.push({ x: 8 * TILE_SIZE, y: 26 * TILE_SIZE, text: 'ARMORY' });
        roomLabels.push({ x: 23 * TILE_SIZE, y: 26 * TILE_SIZE, text: 'COMMUNICATIONS' });
        roomLabels.push({ x: 40 * TILE_SIZE, y: 26 * TILE_SIZE, text: 'ESCAPE POD BAY' });

        // M.A.R.I.A. event
        triggerMariaEvent('deck2');
    }
}

function spawnEnemy(x, y, type) {
    const enemyStats = {
        drone: { hp: 30, armor: 0, damage: 10, speed: 80, size: 14, ranged: false, color: COLORS.enemyCyborg },
        soldier: { hp: 60, armor: 5, damage: 15, speed: 100, size: 16, ranged: true, color: COLORS.enemy },
        crawler: { hp: 20, armor: 0, damage: 8, speed: 120, size: 12, ranged: false, color: COLORS.enemyMutant }
    };

    const stats = enemyStats[type];
    enemies.push({
        x, y,
        type,
        health: stats.hp,
        maxHealth: stats.hp,
        armor: stats.armor,
        damage: stats.damage,
        speed: stats.speed,
        size: stats.size,
        ranged: stats.ranged,
        color: stats.color,
        state: 'patrol',
        patrolTarget: { x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 200 },
        alertTimer: 0,
        attackCooldown: 0,
        stunned: 0,
        angle: Math.random() * Math.PI * 2
    });
}

// M.A.R.I.A. event system
function triggerMariaEvent(eventType) {
    const message = maria.voiceLines[eventType];
    if (message) {
        maria.currentMessage = message;
        maria.messageTimer = 5;
    }
}

// Hacking minigame
const hackingGame = {
    active: false,
    target: null,
    grid: [],
    gridSize: 6,
    cursor: { x: 0, y: 0 },
    source: { x: 0, y: 0 },
    targetNode: { x: 5, y: 0 },
    path: [],
    timer: 15,
    traceProgress: 0
};

function startHacking(target) {
    hackingGame.active = true;
    hackingGame.target = target;
    hackingGame.timer = 15;
    hackingGame.traceProgress = 0;
    hackingGame.path = [];
    hackingGame.cursor = { x: 0, y: 0 };
    hackingGame.source = { x: 0, y: Math.floor(Math.random() * hackingGame.gridSize) };
    hackingGame.targetNode = { x: hackingGame.gridSize - 1, y: Math.floor(Math.random() * hackingGame.gridSize) };

    // Generate grid
    hackingGame.grid = [];
    for (let y = 0; y < hackingGame.gridSize; y++) {
        hackingGame.grid[y] = [];
        for (let x = 0; x < hackingGame.gridSize; x++) {
            if (x === hackingGame.source.x && y === hackingGame.source.y) {
                hackingGame.grid[y][x] = 'S';
            } else if (x === hackingGame.targetNode.x && y === hackingGame.targetNode.y) {
                hackingGame.grid[y][x] = 'T';
            } else if (Math.random() < 0.2) {
                hackingGame.grid[y][x] = 'X'; // Blocked
            } else {
                hackingGame.grid[y][x] = 'o'; // Empty
            }
        }
    }

    hackingGame.cursor = { ...hackingGame.source };
    hackingGame.path.push({ ...hackingGame.source });

    triggerMariaEvent('hacking');
    gameState.hackingActive = true;
}

function updateHacking(dt) {
    if (!hackingGame.active) return;

    hackingGame.timer -= dt;
    hackingGame.traceProgress += dt * 5;

    if (hackingGame.timer <= 0 || hackingGame.traceProgress >= 100) {
        // Failed - trigger alarm
        hackingGame.active = false;
        gameState.hackingActive = false;
        spawnEnemy(player.x + 100, player.y, 'drone');
    }

    // Check win
    if (hackingGame.cursor.x === hackingGame.targetNode.x && hackingGame.cursor.y === hackingGame.targetNode.y) {
        // Success!
        hackingGame.active = false;
        gameState.hackingActive = false;

        if (hackingGame.target.type === 'door') {
            hackingGame.target.door.locked = false;
            hackingGame.target.door.open = true;
        } else if (hackingGame.target.type === 'turret') {
            const turret = turrets[hackingGame.target.turretIndex];
            if (turret) {
                turret.hacked = true;
                turret.hostile = false;
            }
        }

        addFloatingText(player.x, player.y - 30, 'HACKED!', '#44ff88');
    }
}

function hackingInput(key) {
    if (!hackingGame.active) return;

    let newX = hackingGame.cursor.x;
    let newY = hackingGame.cursor.y;

    if (key === 'w' || key === 'ArrowUp') newY--;
    if (key === 's' || key === 'ArrowDown') newY++;
    if (key === 'a' || key === 'ArrowLeft') newX--;
    if (key === 'd' || key === 'ArrowRight') newX++;

    // Check bounds
    if (newX < 0 || newX >= hackingGame.gridSize || newY < 0 || newY >= hackingGame.gridSize) return;

    // Check blocked
    if (hackingGame.grid[newY][newX] === 'X') return;

    // Check if adjacent to last position
    const lastPos = hackingGame.path[hackingGame.path.length - 1];
    const dx = Math.abs(newX - lastPos.x);
    const dy = Math.abs(newY - lastPos.y);
    if (dx + dy !== 1) return;

    hackingGame.cursor = { x: newX, y: newY };
    hackingGame.path.push({ ...hackingGame.cursor });
}

// Input handlers
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (gameState.screen === 'menu') {
        if (key === ' ') startGame();
        return;
    }

    if (gameState.screen === 'gameover' || gameState.screen === 'win') {
        if (key === ' ') {
            gameState.screen = 'menu';
            gameState.won = false;
            gameState.lost = false;
        }
        return;
    }

    if (gameState.hackingActive) {
        hackingInput(key);
        if (key === 'escape') {
            hackingGame.active = false;
            gameState.hackingActive = false;
        }
        return;
    }

    if (key === 'q') gameState.debugOverlay = !gameState.debugOverlay;
    if (key === 'e') interact();
    if (key === 'f') player.flashlight = !player.flashlight;
    if (key === 'r') reload();
    if (key === '1') player.weapon = 'wrench';
    if (key === '2' && hasItem('pistol')) player.weapon = 'pistol';
    if (key === '3' && hasItem('shotgun')) player.weapon = 'shotgun';
    if (key === 'tab') {
        gameState.inventoryOpen = !gameState.inventoryOpen;
        e.preventDefault();
    }
    if (key === 'm') gameState.mapOpen = !gameState.mapOpen;
    if (key === ' ' && player.dodgeCooldown <= 0 && player.energy >= 15) {
        startDodge();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Game functions
function startGame() {
    gameState.screen = 'playing';
    gameState.deck = 1;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.ammo = { bullets: 24, shells: 0 };
    player.inventory = [];
    player.keycards = [];
    player.weapon = 'wrench';
    player.kills = 0;
    player.audioLogs = [];
    initDeck(1);
}

function hasItem(itemName) {
    return player.inventory.includes(itemName);
}

function reload() {
    // Placeholder for reload logic
}

function startDodge() {
    player.dodging = true;
    player.dodgeTimer = 0.4;
    player.iframes = 0.3;
    player.energy -= 15;
    player.dodgeCooldown = 1.0;

    const moveX = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
    const moveY = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        player.dodgeDir = { x: moveX / len, y: moveY / len };
    } else {
        player.dodgeDir = { x: Math.cos(player.angle), y: Math.sin(player.angle) };
    }

    // Dodge particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: -player.dodgeDir.x * 50 + (Math.random() - 0.5) * 30,
            vy: -player.dodgeDir.y * 50 + (Math.random() - 0.5) * 30,
            life: 0.3,
            color: '#88aaff',
            size: 3
        });
    }
}

function interact() {
    const interactRange = 50;

    // Check doors
    for (const door of doors) {
        const dx = door.x - player.x;
        const dy = door.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            if (door.locked) {
                if (door.keycard && player.keycards.includes(door.keycard)) {
                    door.locked = false;
                    door.open = true;
                    addFloatingText(door.x, door.y - 20, 'UNLOCKED', '#44ff88');
                } else {
                    // Try to hack
                    startHacking({ type: 'door', door: door });
                }
            } else {
                door.open = !door.open;
            }
            return;
        }
    }

    // Check terminals
    for (let i = 0; i < terminals.length; i++) {
        const term = terminals[i];
        const dx = term.x - player.x;
        const dy = term.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            if (term.type === 'turret' && !term.hacked) {
                startHacking({ type: 'turret', turretIndex: term.target || 0 });
            }
            return;
        }
    }

    // Check containers
    for (const container of containers) {
        const dx = container.x - player.x;
        const dy = container.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange && !container.searched) {
            container.searched = true;
            for (const loot of container.loot) {
                giveItem(loot);
                addFloatingText(container.x, container.y - 20, '+' + loot.toUpperCase(), COLORS.item);
            }
            return;
        }
    }

    // Check elevator
    if (gameState.deck === 1) {
        const elevatorX = 25 * TILE_SIZE;
        const elevatorY = 34 * TILE_SIZE;
        const dx = elevatorX - player.x;
        const dy = elevatorY - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            // Go to deck 2
            gameState.deck = 2;
            initDeck(2);
            addFloatingText(player.x, player.y - 30, 'DECK 2: MEDICAL', '#ffffff');
            return;
        }
    }
}

function giveItem(itemType) {
    switch (itemType) {
        case 'medpatch':
            player.health = Math.min(player.maxHealth, player.health + 25);
            break;
        case 'medkit':
            player.health = Math.min(player.maxHealth, player.health + 50);
            break;
        case 'energycell':
            player.energy = Math.min(player.maxEnergy, player.energy + 50);
            break;
        case 'bullets':
            player.ammo.bullets += 20;
            break;
        case 'shells':
            player.ammo.shells += 8;
            break;
        case 'bandage':
            player.health = Math.min(player.maxHealth, player.health + 10);
            break;
        case 'pistol':
            if (!player.inventory.includes('pistol')) player.inventory.push('pistol');
            break;
        case 'shotgun':
            if (!player.inventory.includes('shotgun')) player.inventory.push('shotgun');
            break;
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1.5,
        vy: -30
    });
}

// Update function
function update(dt) {
    if (gameState.screen !== 'playing') return;
    if (gameState.hackingActive) {
        updateHacking(dt);
        return;
    }
    if (gameState.inventoryOpen || gameState.mapOpen) return;

    gameState.gameTime += dt;

    // Update M.A.R.I.A.
    if (maria.messageTimer > 0) {
        maria.messageTimer -= dt;
        if (maria.messageTimer <= 0) {
            maria.currentMessage = null;
        }
    }

    // Player movement
    updatePlayer(dt);

    // Update enemies
    updateEnemies(dt);

    // Update turrets
    updateTurrets(dt);

    // Update bullets
    updateBullets(dt);

    // Update items pickup
    updateItems();

    // Update particles
    updateParticles(dt);

    // Update floating texts
    updateFloatingTexts(dt);

    // Update hazards
    updateHazards(dt);

    // Update lights
    updateLights(dt);

    // Update camera
    updateCamera();

    // Update explored tiles
    updateExplored();

    // Check win/lose
    checkWinLose();
}

function updatePlayer(dt) {
    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.dodgeCooldown > 0) player.dodgeCooldown -= dt;
    if (player.iframes > 0) player.iframes -= dt;

    // Energy regen
    player.energy = Math.min(player.maxEnergy, player.energy + 2 * dt);

    // Aim at mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Dodge movement
    if (player.dodging) {
        player.dodgeTimer -= dt;
        const dodgeSpeed = 250;
        player.x += player.dodgeDir.x * dodgeSpeed * dt;
        player.y += player.dodgeDir.y * dodgeSpeed * dt;

        if (player.dodgeTimer <= 0) {
            player.dodging = false;
        }
    } else {
        // Normal movement
        let moveX = 0, moveY = 0;
        if (keys['w']) moveY -= 1;
        if (keys['s']) moveY += 1;
        if (keys['a']) moveX -= 1;
        if (keys['d']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= len;
            moveY /= len;

            player.sprinting = keys['shift'] && player.energy > 0;
            player.crouching = keys['control'];

            let speed = player.speed;
            if (player.sprinting) {
                speed = player.sprintSpeed;
                player.energy -= 5 * dt;
            }
            if (player.crouching) speed *= 0.5;

            const newX = player.x + moveX * speed * dt;
            const newY = player.y + moveY * speed * dt;

            if (!checkCollision(newX, player.y, player.size)) {
                player.x = newX;
            }
            if (!checkCollision(player.x, newY, player.size)) {
                player.y = newY;
            }
        }
    }

    // Attack
    if (mouse.down && player.attackCooldown <= 0) {
        attack();
    }
}

function checkCollision(x, y, size) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Check surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const checkX = tileX + dx;
            const checkY = tileY + dy;

            if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) {
                return true;
            }

            if (currentMap[checkY][checkX] === 1) {
                // Wall collision
                const wallLeft = checkX * TILE_SIZE;
                const wallRight = wallLeft + TILE_SIZE;
                const wallTop = checkY * TILE_SIZE;
                const wallBottom = wallTop + TILE_SIZE;

                if (x + size > wallLeft && x - size < wallRight &&
                    y + size > wallTop && y - size < wallBottom) {
                    return true;
                }
            }
        }
    }

    // Check closed doors
    for (const door of doors) {
        if (!door.open) {
            const doorSize = TILE_SIZE / 2;
            if (Math.abs(x - door.x) < size + doorSize &&
                Math.abs(y - door.y) < size + doorSize) {
                return true;
            }
        }
    }

    return false;
}

function attack() {
    const weapon = weapons[player.weapon];
    player.attackCooldown = weapon.rate;

    if (weapon.melee) {
        // Melee attack
        const attackAngle = player.angle;
        const arcAngle = Math.PI / 3;

        // Swing particles
        for (let i = 0; i < 5; i++) {
            const angle = attackAngle - arcAngle / 2 + (i / 4) * arcAngle;
            particles.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * 50,
                vy: Math.sin(angle) * 50,
                life: 0.2,
                color: '#aaaaff',
                size: 3
            });
        }

        // Check enemies in arc
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < weapon.range + enemy.size) {
                const angleToEnemy = Math.atan2(dy, dx);
                let angleDiff = angleToEnemy - attackAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < arcAngle / 2) {
                    damageEnemy(enemy, weapon.damage);
                }
            }
        }
    } else {
        // Ranged attack
        const ammoType = weapon.ammoType;
        if (player.ammo[ammoType] <= 0) {
            addFloatingText(player.x, player.y - 30, 'NO AMMO', '#ff4444');
            return;
        }

        player.ammo[ammoType]--;

        // Muzzle flash
        particles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: 0, vy: 0,
            life: 0.05,
            color: '#ffff88',
            size: 15
        });

        const pellets = weapon.pellets || 1;
        const spread = weapon.spread || 0;

        for (let i = 0; i < pellets; i++) {
            const angle = player.angle + (Math.random() - 0.5) * spread;
            bullets.push({
                x: player.x + Math.cos(angle) * 20,
                y: player.y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage: weapon.damage / pellets,
                friendly: true,
                life: 1
            });
        }
    }
}

function damageEnemy(enemy, damage) {
    const actualDamage = Math.max(1, damage - enemy.armor);
    enemy.health -= actualDamage;
    enemy.state = 'combat';
    enemy.alertTimer = 5;

    addFloatingText(enemy.x, enemy.y - 20, actualDamage.toString(), '#ff4444');

    // Blood particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.5,
            color: COLORS.blood,
            size: 4
        });
    }

    if (enemy.health <= 0) {
        // Death
        bloodPools.push({ x: enemy.x, y: enemy.y, size: 20 + Math.random() * 20 });
        player.kills++;

        // Random drop
        if (Math.random() < 0.3) {
            const dropType = ['medpatch', 'bullets', 'energycell'][Math.floor(Math.random() * 3)];
            items.push({ x: enemy.x, y: enemy.y, type: dropType });
        }

        // Check for M.A.R.I.A. event
        if (player.kills === 5) {
            triggerMariaEvent('taunt1');
        } else if (player.kills === 10) {
            triggerMariaEvent('taunt2');
        }
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.health <= 0) {
            enemies.splice(i, 1);
            continue;
        }

        if (enemy.stunned > 0) {
            enemy.stunned -= dt;
            continue;
        }

        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
        if (enemy.alertTimer > 0) enemy.alertTimer -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Vision check
        const canSee = dist < 300 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        if (canSee || enemy.alertTimer > 0) {
            enemy.state = 'combat';
            enemy.alertTimer = Math.max(enemy.alertTimer, 3);
        } else if (enemy.state === 'combat' && enemy.alertTimer <= 0) {
            enemy.state = 'patrol';
        }

        if (enemy.state === 'combat') {
            // Move toward player
            if (dist > 40) {
                const moveX = (dx / dist) * enemy.speed * dt;
                const moveY = (dy / dist) * enemy.speed * dt;

                if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) {
                    enemy.x += moveX;
                }
                if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) {
                    enemy.y += moveY;
                }
            }

            enemy.angle = Math.atan2(dy, dx);

            // Attack
            if (dist < 50 && enemy.attackCooldown <= 0 && !enemy.ranged) {
                // Melee attack
                if (player.iframes <= 0) {
                    player.health -= enemy.damage;
                    player.iframes = 0.5;
                    addFloatingText(player.x, player.y - 30, '-' + enemy.damage, '#ff4444');
                    screenShake(5);

                    if (player.health < 20 && !maria.lowHealthTriggered) {
                        triggerMariaEvent('lowHealth');
                        maria.lowHealthTriggered = true;
                    }
                }
                enemy.attackCooldown = 1;
            } else if (enemy.ranged && dist < 250 && dist > 80 && enemy.attackCooldown <= 0 && canSee) {
                // Ranged attack
                const angle = Math.atan2(dy, dx);
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 250,
                    vy: Math.sin(angle) * 250,
                    damage: 10,
                    friendly: false,
                    life: 2,
                    color: '#ff6644'
                });
                enemy.attackCooldown = 1.5;
            }
        } else {
            // Patrol
            const pdx = enemy.patrolTarget.x - enemy.x;
            const pdy = enemy.patrolTarget.y - enemy.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

            if (pdist < 10) {
                enemy.patrolTarget = {
                    x: enemy.x + (Math.random() - 0.5) * 200,
                    y: enemy.y + (Math.random() - 0.5) * 200
                };
            } else {
                const moveX = (pdx / pdist) * enemy.speed * 0.3 * dt;
                const moveY = (pdy / pdist) * enemy.speed * 0.3 * dt;

                if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) {
                    enemy.x += moveX;
                }
                if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) {
                    enemy.y += moveY;
                }

                enemy.angle = Math.atan2(pdy, pdx);
            }
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 16);

    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const checkX = x1 + dx * t;
        const checkY = y1 + dy * t;

        const tileX = Math.floor(checkX / TILE_SIZE);
        const tileY = Math.floor(checkY / TILE_SIZE);

        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
        if (currentMap[tileY][tileX] === 1) return false;

        // Check closed doors
        for (const door of doors) {
            if (!door.open) {
                if (Math.abs(checkX - door.x) < TILE_SIZE / 2 && Math.abs(checkY - door.y) < TILE_SIZE / 2) {
                    return false;
                }
            }
        }
    }

    return true;
}

function updateTurrets(dt) {
    for (const turret of turrets) {
        if (turret.health <= 0) continue;

        let target = null;
        let targetDist = 250;

        if (turret.hostile) {
            // Target player
            const dx = player.x - turret.x;
            const dy = player.y - turret.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < targetDist && hasLineOfSight(turret.x, turret.y, player.x, player.y)) {
                target = player;
                targetDist = dist;
            }
        } else if (turret.hacked) {
            // Target enemies
            for (const enemy of enemies) {
                const dx = enemy.x - turret.x;
                const dy = enemy.y - turret.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < targetDist && hasLineOfSight(turret.x, turret.y, enemy.x, enemy.y)) {
                    target = enemy;
                    targetDist = dist;
                }
            }
        }

        if (target) {
            const targetAngle = Math.atan2(target.y - turret.y, target.x - turret.x);
            let angleDiff = targetAngle - turret.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            turret.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 3 * dt);

            // Fire
            if (!turret.cooldown) turret.cooldown = 0;
            turret.cooldown -= dt;

            if (turret.cooldown <= 0 && Math.abs(angleDiff) < 0.2) {
                bullets.push({
                    x: turret.x + Math.cos(turret.angle) * 20,
                    y: turret.y + Math.sin(turret.angle) * 20,
                    vx: Math.cos(turret.angle) * 350,
                    vy: Math.sin(turret.angle) * 350,
                    damage: 15,
                    friendly: !turret.hostile,
                    life: 1,
                    color: turret.hacked ? '#44ff44' : '#ff4444'
                });
                turret.cooldown = 0.5;
            }
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
            continue;
        }

        // Wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT ||
            currentMap[tileY][tileX] === 1) {
            bullets.splice(i, 1);
            continue;
        }

        // Hit enemies
        if (bullet.friendly) {
            for (const enemy of enemies) {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 4) {
                    damageEnemy(enemy, bullet.damage);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Hit player
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.size + 4 && player.iframes <= 0) {
                player.health -= bullet.damage;
                player.iframes = 0.3;
                addFloatingText(player.x, player.y - 30, '-' + bullet.damage, '#ff4444');
                screenShake(3);
                bullets.splice(i, 1);
            }
        }
    }
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = player.x - item.x;
        const dy = player.y - item.y;

        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            let picked = true;

            if (item.type === 'keycard') {
                if (!player.keycards.includes(item.keycard)) {
                    player.keycards.push(item.keycard);
                    addFloatingText(item.x, item.y - 20, item.keycard.toUpperCase() + ' KEYCARD', COLORS.keycard);
                }
            } else if (item.type === 'audiolog') {
                if (!player.audioLogs.includes(item.logId)) {
                    player.audioLogs.push(item.logId);
                    const log = audioLogs.find(l => l.id === item.logId);
                    if (log) {
                        addFloatingText(item.x, item.y - 20, 'AUDIO LOG: ' + log.title, '#88ff88');
                        maria.currentMessage = '"' + log.text + '"';
                        maria.messageTimer = 6;
                    }
                }
            } else if (item.type === 'escapepod') {
                gameState.won = true;
                gameState.screen = 'win';
                picked = false;
            } else {
                giveItem(item.type);
                addFloatingText(item.x, item.y - 20, '+' + item.type.toUpperCase(), COLORS.item);
            }

            if (picked) {
                items.splice(i, 1);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
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
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updateHazards(dt) {
    for (const hazard of hazards) {
        // Check player in hazard
        const dx = player.x - hazard.x;
        const dy = player.y - hazard.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hazard.radius) {
            if (hazard.type === 'steam' && Math.random() < 0.02) {
                player.health -= 1;
                addFloatingText(player.x, player.y - 30, '-1', '#aaaaaa');
            } else if (hazard.type === 'radiation' && Math.random() < 0.03) {
                player.health -= 2;
                addFloatingText(player.x, player.y - 30, '-2 RAD', '#44ff44');
            }
        }

        // Spawn ambient particles
        if (hazard.type === 'steam' && Math.random() < 0.1) {
            ambientParticles.push({
                x: hazard.x + (Math.random() - 0.5) * hazard.radius,
                y: hazard.y + (Math.random() - 0.5) * hazard.radius,
                vx: (Math.random() - 0.5) * 10,
                vy: -20 - Math.random() * 20,
                life: 1 + Math.random(),
                size: 8 + Math.random() * 8,
                color: COLORS.hazardSteam
            });
        } else if (hazard.type === 'sparks' && Math.random() < 0.05) {
            for (let i = 0; i < 3; i++) {
                ambientParticles.push({
                    x: hazard.x,
                    y: hazard.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80 - 30,
                    life: 0.2 + Math.random() * 0.3,
                    size: 2,
                    color: COLORS.sparks
                });
            }
        } else if (hazard.type === 'radiation' && Math.random() < 0.05) {
            ambientParticles.push({
                x: hazard.x + (Math.random() - 0.5) * hazard.radius,
                y: hazard.y + (Math.random() - 0.5) * hazard.radius,
                vx: 0,
                vy: -10,
                life: 1,
                size: 4,
                color: COLORS.hazardRadiation
            });
        }
    }

    // Update ambient particles
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        const p = ambientParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
            ambientParticles.splice(i, 1);
        }
    }

    // Limit ambient particles
    if (ambientParticles.length > 100) {
        ambientParticles.splice(0, 20);
    }
}

function updateLights(dt) {
    for (const light of lights) {
        if (light.flicker) {
            light.flickerValue = 0.7 + Math.random() * 0.3;
        } else {
            light.flickerValue = 1;
        }
    }

    // Update M.A.R.I.A. glitch effect
    if (maria.currentMessage) {
        maria.glitchEffect = Math.random() * 0.1;
    } else {
        maria.glitchEffect *= 0.95;
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // Bounds
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function updateExplored() {
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    const visionRange = 8;

    for (let dy = -visionRange; dy <= visionRange; dy++) {
        for (let dx = -visionRange; dx <= visionRange; dx++) {
            const tx = playerTileX + dx;
            const ty = playerTileY + dy;

            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                if (hasLineOfSight(player.x, player.y, tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2)) {
                    exploredTiles[ty][tx] = true;
                }
            }
        }
    }
}

let shakeAmount = 0;
function screenShake(amount) {
    shakeAmount = Math.max(shakeAmount, amount);
}

function checkWinLose() {
    if (player.health <= 0) {
        gameState.lost = true;
        gameState.lostReason = 'YOU DIED';
        gameState.screen = 'gameover';
        triggerMariaEvent('death');
    }
}

// Rendering
function render() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.screen === 'menu') {
        renderMenu();
        return;
    }

    if (gameState.screen === 'gameover') {
        renderGameOver();
        return;
    }

    if (gameState.screen === 'win') {
        renderWin();
        return;
    }

    // Apply screen shake
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate(
            (Math.random() - 0.5) * shakeAmount,
            (Math.random() - 0.5) * shakeAmount
        );
        shakeAmount *= 0.9;
        if (shakeAmount < 0.5) shakeAmount = 0;
    }

    ctx.translate(-camera.x, -camera.y);

    // Render map
    renderMap();

    // Render lights (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (const light of lights) {
        const flicker = light.flickerValue || 1;
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius * flicker);
        gradient.addColorStop(0, light.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius * flicker, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Render room labels
    for (const label of roomLabels) {
        const dist = Math.sqrt((player.x - label.x) ** 2 + (player.y - label.y) ** 2);
        if (dist < 200) {
            ctx.fillStyle = `rgba(100,100,120,${Math.max(0, 1 - dist / 200)})`;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label.text, label.x, label.y);
        }
    }

    // Render ambient particles (behind entities)
    for (const p of ambientParticles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Render blood pools
    for (const pool of bloodPools) {
        ctx.fillStyle = COLORS.blood;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.size, pool.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render containers
    for (const container of containers) {
        ctx.fillStyle = container.searched ? '#333340' : '#4a4a5a';
        ctx.fillRect(container.x - 12, container.y - 8, 24, 16);
        if (!container.searched) {
            ctx.fillStyle = '#666680';
            ctx.fillRect(container.x - 10, container.y - 6, 20, 3);
        }
    }

    // Render items
    for (const item of items) {
        if (item.type === 'keycard') {
            ctx.fillStyle = item.keycard === 'yellow' ? '#ffff00' : '#ff4444';
        } else if (item.type === 'audiolog') {
            ctx.fillStyle = '#44ff88';
        } else if (item.type === 'escapepod') {
            ctx.fillStyle = '#88ffff';
            ctx.fillRect(item.x - 20, item.y - 25, 40, 50);
            ctx.fillStyle = '#44aaaa';
            ctx.fillRect(item.x - 15, item.y - 20, 30, 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE', item.x, item.y);
            continue;
        } else {
            ctx.fillStyle = COLORS.item;
        }

        // Bobbing animation
        const bob = Math.sin(gameState.gameTime * 3 + item.x) * 3;
        ctx.beginPath();
        ctx.arc(item.x, item.y + bob, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render terminals
    for (const term of terminals) {
        ctx.fillStyle = '#222233';
        ctx.fillRect(term.x - 10, term.y - 15, 20, 30);
        ctx.fillStyle = term.hacked ? '#44ff88' : COLORS.terminal;
        ctx.fillRect(term.x - 8, term.y - 12, 16, 20);
        // Screen glow
        ctx.fillStyle = term.hacked ? 'rgba(68,255,136,0.3)' : 'rgba(68,255,136,0.2)';
        ctx.beginPath();
        ctx.arc(term.x, term.y, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render turrets
    for (const turret of turrets) {
        if (turret.health <= 0) continue;

        ctx.fillStyle = turret.hacked ? COLORS.turretFriendly : (turret.hostile ? COLORS.turretHostile : COLORS.turret);
        ctx.save();
        ctx.translate(turret.x, turret.y);
        ctx.rotate(turret.angle);
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillRect(10, -5, 15, 10);
        ctx.restore();
    }

    // Render doors
    for (const door of doors) {
        if (door.open) {
            ctx.fillStyle = COLORS.doorOpen;
            ctx.fillRect(door.x - 4, door.y - 16, 8, 32);
        } else {
            ctx.fillStyle = door.locked ? COLORS.doorLocked : COLORS.door;
            ctx.fillRect(door.x - 16, door.y - 4, 32, 8);

            if (door.locked && door.keycard) {
                ctx.fillStyle = door.keycard === 'yellow' ? '#ffff00' : '#ff4444';
                ctx.fillRect(door.x - 4, door.y - 2, 8, 4);
            }
        }
    }

    // Render enemies
    for (const enemy of enemies) {
        if (enemy.health <= 0) continue;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.fillStyle = enemy.color;

        if (enemy.type === 'drone') {
            // Cyborg drone - humanoid with tech
            ctx.fillRect(-enemy.size, -enemy.size / 2, enemy.size * 2, enemy.size);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(enemy.size / 2, -enemy.size / 4, enemy.size / 2, enemy.size / 2);
        } else if (enemy.type === 'soldier') {
            // Cyborg soldier - armored
            ctx.fillRect(-enemy.size, -enemy.size / 2, enemy.size * 2, enemy.size);
            ctx.fillStyle = '#334455';
            ctx.fillRect(-enemy.size + 2, -enemy.size / 2 + 2, enemy.size * 2 - 4, enemy.size - 4);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(enemy.size / 2, -2, 8, 4);
        } else if (enemy.type === 'crawler') {
            // Mutant crawler - organic
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.size, enemy.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            for (let i = 0; i < 4; i++) {
                const legAngle = (i / 4) * Math.PI * 2;
                ctx.fillRect(
                    Math.cos(legAngle) * enemy.size,
                    Math.sin(legAngle) * enemy.size * 0.6 - 2,
                    8, 4
                );
            }
        }

        ctx.restore();

        // Health bar if damaged
        if (enemy.health < enemy.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10, barWidth, barHeight);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10,
                barWidth * (enemy.health / enemy.maxHealth), barHeight);
        }
    }

    // Render bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color || COLORS.bullet;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
    }

    // Render player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Flashlight cone (correct: visible INSIDE cone)
    if (player.flashlight) {
        ctx.fillStyle = 'rgba(255,255,200,0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 200, -0.4, 0.4);
        ctx.closePath();
        ctx.fill();
    }

    // Player body
    if (player.iframes > 0 && Math.floor(player.iframes * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = COLORS.player;
    ctx.fillRect(-player.size, -player.size / 2, player.size * 2, player.size);

    // Visor
    ctx.fillStyle = COLORS.playerVisor;
    ctx.fillRect(player.size / 2, -3, 6, 6);

    ctx.globalAlpha = 1;
    ctx.restore();

    // Render floating texts
    for (const ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    }

    // FOG OF WAR - things OUTSIDE vision are dark
    renderFogOfWar();

    ctx.restore();

    // UI
    renderUI();

    // Hacking overlay
    if (gameState.hackingActive) {
        renderHacking();
    }

    // M.A.R.I.A. message
    if (maria.currentMessage) {
        renderMariaMessage();
    }

    // Debug overlay
    if (gameState.debugOverlay) {
        renderDebug();
    }
}

function renderMap() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            if (currentMap[y][x] === 0) {
                // Floor
                ctx.fillStyle = COLORS.floor;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Grid pattern
                ctx.strokeStyle = COLORS.floorGrid;
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else {
                // Wall
                ctx.fillStyle = COLORS.wall;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // 3D effect
                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
                ctx.fillRect(screenX, screenY, 4, TILE_SIZE);

                ctx.fillStyle = COLORS.wallShadow;
                ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
                ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);
            }
        }
    }
}

function renderFogOfWar() {
    // Create fog mask - darker where player can't see
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);

    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            const dx = x - playerTileX;
            const dy = y - playerTileY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if in flashlight cone
            const tileAngle = Math.atan2(dy, dx);
            let angleDiff = tileAngle - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const inCone = player.flashlight && Math.abs(angleDiff) < 0.5 && dist < 7;
            const hasLOS = hasLineOfSight(player.x, player.y, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);

            let darkness = 0;

            if (!exploredTiles[y][x]) {
                darkness = 0.95; // Unexplored = very dark
            } else if (dist > 10 || !hasLOS) {
                darkness = 0.7; // Out of range or no LOS = dim
            } else if (inCone && hasLOS) {
                darkness = 0; // In flashlight cone = fully lit
            } else if (dist < 3 && hasLOS) {
                darkness = 0.2; // Very close = mostly lit
            } else {
                darkness = 0.5 - (0.3 * (1 - dist / 10)); // Falloff
            }

            if (darkness > 0) {
                ctx.fillStyle = `rgba(0,0,8,${darkness})`;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function renderUI() {
    // Health bar with better styling
    ctx.fillStyle = COLORS.healthBg;
    ctx.fillRect(10, 10, 200, 20);
    const healthPercent = player.health / player.maxHealth;
    const healthColor = healthPercent > 0.5 ? COLORS.health : (healthPercent > 0.25 ? '#cc6622' : '#cc2222');
    ctx.fillStyle = healthColor;
    ctx.fillRect(10, 10, 200 * healthPercent, 20);
    // Health bar segments
    ctx.strokeStyle = '#22111140';
    for (let i = 1; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(10 + i * 20, 10);
        ctx.lineTo(10 + i * 20, 30);
        ctx.stroke();
    }
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 20);
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, 15, 25);

    // Energy bar with better styling
    ctx.fillStyle = COLORS.energyBg;
    ctx.fillRect(10, 35, 200, 15);
    ctx.fillStyle = COLORS.energy;
    ctx.fillRect(10, 35, 200 * (player.energy / player.maxEnergy), 15);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(10, 35, 200, 15);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText(`EN: ${Math.floor(player.energy)}/${player.maxEnergy}`, 15, 47);

    // Weapon & ammo
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${player.weapon.toUpperCase()}]`, 10, 70);

    if (player.weapon !== 'wrench') {
        const ammoType = weapons[player.weapon].ammoType;
        ctx.fillText(`Ammo: ${player.ammo[ammoType]}`, 10, 85);
    }

    // Keycards
    let kcX = 10;
    ctx.fillText('Keys:', 10, 105);
    kcX = 55;
    for (const kc of player.keycards) {
        ctx.fillStyle = kc === 'yellow' ? '#ffff00' : '#ff4444';
        ctx.fillRect(kcX, 95, 15, 12);
        kcX += 20;
    }

    // Deck indicator
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`DECK ${gameState.deck}: ${gameState.deck === 1 ? 'ENGINEERING' : 'MEDICAL'}`, canvas.width - 10, 20);

    // Mini-map
    renderMiniMap();

    // Interaction hint
    let interactHint = null;
    const interactRange = 50;

    // Check for nearby interactables
    for (const door of doors) {
        const dx = door.x - player.x;
        const dy = door.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            if (door.locked && door.keycard) {
                if (player.keycards.includes(door.keycard)) {
                    interactHint = `[E] Unlock (${door.keycard.toUpperCase()} KEY)`;
                } else {
                    interactHint = `[E] Hack Door (Need ${door.keycard.toUpperCase()} KEY)`;
                }
            } else if (door.locked) {
                interactHint = '[E] Hack Door';
            } else {
                interactHint = door.open ? '[E] Close Door' : '[E] Open Door';
            }
        }
    }

    for (const term of terminals) {
        const dx = term.x - player.x;
        const dy = term.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            interactHint = term.hacked ? '[E] Terminal (HACKED)' : '[E] Hack Terminal';
        }
    }

    for (const container of containers) {
        const dx = container.x - player.x;
        const dy = container.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange && !container.searched) {
            interactHint = '[E] Search Container';
        }
    }

    if (gameState.deck === 1) {
        const elevatorX = 25 * TILE_SIZE;
        const elevatorY = 34 * TILE_SIZE;
        const dx = elevatorX - player.x;
        const dy = elevatorY - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            interactHint = '[E] Use Elevator to Deck 2';
        }
    }

    // Draw interaction hint
    if (interactHint) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width / 2 - 120, canvas.height - 60, 240, 25);
        ctx.strokeStyle = '#44ff88';
        ctx.strokeRect(canvas.width / 2 - 120, canvas.height - 60, 240, 25);
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(interactHint, canvas.width / 2, canvas.height - 43);
    }

    // Control hints
    ctx.fillStyle = '#555';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move | Mouse:Aim | LMB:Attack | E:Interact | F:Flashlight | Space:Dodge | Q:Debug', canvas.width / 2, canvas.height - 10);
}

function renderMiniMap() {
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 10;
    const scale = mapSize / (MAP_WIDTH * TILE_SIZE) * TILE_SIZE;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw explored tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (exploredTiles[y][x]) {
                ctx.fillStyle = currentMap[y][x] === 1 ? '#334' : '#223';
                ctx.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
            }
        }
    }

    // Draw doors
    for (const door of doors) {
        const dx = mapX + (door.x / TILE_SIZE) * scale;
        const dy = mapY + (door.y / TILE_SIZE) * scale;
        ctx.fillStyle = door.locked ? '#ff4444' : (door.open ? '#44ff44' : '#ffff44');
        ctx.fillRect(dx - 1, dy - 1, 3, 3);
    }

    // Draw player
    const px = mapX + (player.x / TILE_SIZE) * scale;
    const py = mapY + (player.y / TILE_SIZE) * scale;
    ctx.fillStyle = '#44ffff';
    ctx.fillRect(px - 2, py - 2, 4, 4);

    // Draw enemies
    for (const enemy of enemies) {
        const ex = mapX + (enemy.x / TILE_SIZE) * scale;
        const ey = mapY + (enemy.y / TILE_SIZE) * scale;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
    }

    ctx.strokeStyle = '#444';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
}

function renderHacking() {
    // Overlay
    ctx.fillStyle = 'rgba(0,20,10,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HACKING: Security Terminal', canvas.width / 2, 50);

    // Timer
    ctx.fillText(`Time: ${hackingGame.timer.toFixed(1)}s`, canvas.width / 2, 80);

    // Grid
    const gridSize = hackingGame.gridSize;
    const cellSize = 50;
    const gridX = (canvas.width - gridSize * cellSize) / 2;
    const gridY = 120;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cellX = gridX + x * cellSize;
            const cellY = gridY + y * cellSize;
            const cell = hackingGame.grid[y][x];

            // Cell background
            ctx.fillStyle = '#112211';
            ctx.fillRect(cellX, cellY, cellSize - 2, cellSize - 2);

            // Cell content
            if (cell === 'S') {
                ctx.fillStyle = '#44ff44';
                ctx.fillText('S', cellX + cellSize / 2, cellY + cellSize / 2 + 5);
            } else if (cell === 'T') {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('T', cellX + cellSize / 2, cellY + cellSize / 2 + 5);
            } else if (cell === 'X') {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('X', cellX + cellSize / 2, cellY + cellSize / 2 + 5);
            }

            // Path highlight
            for (const p of hackingGame.path) {
                if (p.x === x && p.y === y) {
                    ctx.fillStyle = 'rgba(68,255,136,0.3)';
                    ctx.fillRect(cellX, cellY, cellSize - 2, cellSize - 2);
                }
            }

            // Cursor
            if (hackingGame.cursor.x === x && hackingGame.cursor.y === y) {
                ctx.strokeStyle = '#44ffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(cellX, cellY, cellSize - 2, cellSize - 2);
            }
        }
    }

    // Trace progress
    ctx.fillStyle = '#333';
    ctx.fillRect(gridX, gridY + gridSize * cellSize + 20, gridSize * cellSize, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(gridX, gridY + gridSize * cellSize + 20, gridSize * cellSize * (hackingGame.traceProgress / 100), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`TRACE: ${Math.floor(hackingGame.traceProgress)}%`, canvas.width / 2, gridY + gridSize * cellSize + 55);

    // Instructions
    ctx.fillStyle = '#888';
    ctx.fillText('WASD: Move | Connect S to T | ESC: Abort', canvas.width / 2, canvas.height - 30);
}

function renderMariaMessage() {
    // M.A.R.I.A. message box
    ctx.fillStyle = 'rgba(40,0,30,0.9)';
    ctx.fillRect(50, canvas.height - 120, canvas.width - 100, 80);
    ctx.strokeStyle = COLORS.maria;
    ctx.lineWidth = 2;
    ctx.strokeRect(50, canvas.height - 120, canvas.width - 100, 80);

    // M.A.R.I.A. label
    ctx.fillStyle = COLORS.maria;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('M.A.R.I.A.:', 70, canvas.height - 95);

    // Message
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';

    // Word wrap
    const words = maria.currentMessage.split(' ');
    let line = '';
    let lineY = canvas.height - 75;
    const maxWidth = canvas.width - 160;

    for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth) {
            ctx.fillText(line, 70, lineY);
            line = word + ' ';
            lineY += 18;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 70, lineY);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(canvas.width - 200, 140, 190, 200);

    ctx.fillStyle = '#44ff44';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        `DEBUG OVERLAY`,
        `-------------`,
        `Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
        `HP: ${player.health} / ${player.maxHealth}`,
        `Energy: ${Math.floor(player.energy)}`,
        `Weapon: ${player.weapon}`,
        `Ammo: ${JSON.stringify(player.ammo)}`,
        `Enemies: ${enemies.length}`,
        `Bullets: ${bullets.length}`,
        `Deck: ${gameState.deck}`,
        `Kills: ${player.kills}`,
        `State: ${gameState.screen}`,
        `Keycards: ${player.keycards.join(', ')}`,
        `FPS: ${Math.round(1000 / 16)}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 195, 155 + i * 14);
    });
}

function renderMenu() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = COLORS.maria;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM SHOCK 2D', canvas.width / 2, 150);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('WHISPERS OF M.A.R.I.A.', canvas.width / 2, 180);

    // Start prompt
    ctx.fillStyle = '#44ff88';
    ctx.font = '20px monospace';
    ctx.fillText('PRESS SPACE TO START', canvas.width / 2, 300);

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Attack',
        'E - Interact',
        'F - Flashlight',
        'Space - Dodge Roll',
        '1-3 - Switch Weapons',
        'Q - Debug Overlay'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 380 + i * 20);
    });

    // M.A.R.I.A. teaser
    ctx.fillStyle = COLORS.maria;
    ctx.font = '14px monospace';
    ctx.fillText('"You\'re awake. Fascinating..."', canvas.width / 2, 550);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 250);

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText(gameState.lostReason, canvas.width / 2, 300);

    ctx.fillStyle = COLORS.maria;
    ctx.font = '16px monospace';
    ctx.fillText('"' + maria.voiceLines.death + '"', canvas.width / 2, 380);

    ctx.fillStyle = '#44ff88';
    ctx.font = '16px monospace';
    ctx.fillText('PRESS SPACE TO RETURN TO MENU', canvas.width / 2, 450);
}

function renderWin() {
    ctx.fillStyle = 'rgba(0,20,10,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('You escaped the Von Braun.', canvas.width / 2, 260);
    ctx.fillText('M.A.R.I.A.\'s signal fades as you drift away...', canvas.width / 2, 290);
    ctx.fillText(`Kills: ${player.kills}`, canvas.width / 2, 340);
    ctx.fillText(`Audio Logs Found: ${player.audioLogs.length}/${audioLogs.length}`, canvas.width / 2, 360);

    ctx.fillStyle = '#44ff88';
    ctx.font = '16px monospace';
    ctx.fillText('PRESS SPACE TO RETURN TO MENU', canvas.width / 2, 450);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
