// System Shock 2D: Whispers of M.A.R.I.A. - Canvas Version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // start, playing, paused, gameover, victory, hacking, inventory, map
let debugMode = false;
let lastTime = 0;
let deltaTime = 0;

// Camera
const camera = { x: 0, y: 0 };

// Input
const keys = {};
const mouse = { x: 0, y: 0, clicked: false, rightClicked: false };

// Constants
const TILE_SIZE = 32;
const VIEW_WIDTH = canvas.width;
const VIEW_HEIGHT = canvas.height;
const VISION_RANGE = 300;
const VISION_ANGLE = Math.PI / 2.5; // ~72 degrees

// Player
const player = {
    x: 400,
    y: 400,
    width: 24,
    height: 32,
    speed: 150,
    sprintSpeed: 250,
    angle: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    armor: 0,
    maxArmor: 100,
    ammo: { bullets: 48, shells: 16, energyCells: 20 },
    currentWeapon: 0,
    weapons: [
        { name: 'Wrench', type: 'melee', damage: 15, cooldown: 400, lastFire: 0, ammoType: null, magazine: Infinity },
        { name: 'Pistol', type: 'ranged', damage: 12, cooldown: 300, lastFire: 0, ammoType: 'bullets', magazine: 12, maxMag: 12, reloading: false, reloadTime: 1500 },
        { name: 'Shotgun', type: 'ranged', damage: 8, cooldown: 800, lastFire: 0, ammoType: 'shells', magazine: 6, maxMag: 6, reloading: false, reloadTime: 2500, pellets: 6 },
        { name: 'LaserPistol', type: 'ranged', damage: 20, cooldown: 400, lastFire: 0, ammoType: 'energyCells', magazine: 20, maxMag: 20, reloading: false, reloadTime: 1000, isLaser: true }
    ],
    isSprinting: false,
    flashlightOn: true,
    dodgeCooldown: 0,
    isDodging: false,
    dodgeTimer: 0,
    dodgeDir: { x: 0, y: 0 },
    scrap: 0
};

// Inventory
const inventory = {
    items: [],
    maxSlots: 12
};

// Audio logs found
const audioLogs = [];

// Decks (levels)
const decks = [];
let currentDeck = 0;

// Entities
let enemies = [];
let bullets = [];
let items = [];
let doors = [];
let turrets = [];
let particles = [];
let floatingTexts = [];

// Hacking
let hackingTarget = null;
let hackingGrid = [];
let hackingCursor = { x: 0, y: 0 };
let hackingPath = [];
let hackingTimer = 0;
let hackingMaxTime = 15;

// Map exploration
const exploredTiles = new Set();

// M.A.R.I.A. messages
const mariaMessages = [];
let currentMariaMessage = null;
let mariaMessageTimer = 0;

// Screen shake
let screenShake = { x: 0, y: 0, intensity: 0 };

// Blood pools
const bloodPools = [];

// Environmental objects
let furniture = [];
let terminals = [];
let securityCameras = [];
let vents = [];
let corpses = [];
let hazards = [];

// Ambient effects
let sparks = [];
let steamVents = [];
let flickeringLights = [];

// Room labels
const roomLabels = {
    medbay: 'MED BAY',
    corridor: 'CORRIDOR',
    generator: 'GENERATOR ROOM',
    security: 'SECURITY',
    storage: 'STORAGE BAY',
    crew: 'CREW QUARTERS',
    elevator: 'ELEVATOR',
    messhall: 'MESS HALL',
    hydroponics: 'HYDROPONICS',
    communications: 'COMMS CENTER',
    armory: 'ARMORY'
};

// Initialize game
function init() {
    generateDecks();
    setupEventListeners();
    gameLoop(0);
}

// Generate both decks
function generateDecks() {
    // Deck 1: Engineering
    decks.push(generateDeck('Engineering', 0));
    // Deck 2: Medical
    decks.push(generateDeck('Medical', 1));

    loadDeck(0);
}

// Generate a deck
function generateDeck(name, deckIndex) {
    const deck = {
        name: name,
        rooms: [],
        corridors: [],
        width: 80,
        height: 60,
        tiles: []
    };

    // Initialize tiles
    for (let y = 0; y < deck.height; y++) {
        deck.tiles[y] = [];
        for (let x = 0; x < deck.width; x++) {
            deck.tiles[y][x] = { type: 'wall', explored: false };
        }
    }

    // Generate rooms
    const roomCount = 8 + Math.floor(Math.random() * 4);
    const roomTypes = deckIndex === 0
        ? ['medbay', 'corridor', 'generator', 'security', 'storage', 'crew', 'elevator']
        : ['messhall', 'hydroponics', 'communications', 'armory', 'medbay', 'crew', 'elevator'];

    for (let i = 0; i < roomCount; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const width = 8 + Math.floor(Math.random() * 12);
            const height = 8 + Math.floor(Math.random() * 10);
            const x = 2 + Math.floor(Math.random() * (deck.width - width - 4));
            const y = 2 + Math.floor(Math.random() * (deck.height - height - 4));

            if (canPlaceRoom(deck, x, y, width, height)) {
                const roomType = roomTypes[i % roomTypes.length];
                const room = { x, y, width, height, type: roomType, enemies: [], items: [], connected: false };
                deck.rooms.push(room);
                carveRoom(deck, room);
                break;
            }
            attempts++;
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < deck.rooms.length; i++) {
        const room1 = deck.rooms[i];
        const room2 = deck.rooms[i - 1];
        connectRooms(deck, room1, room2);
    }

    // Ensure connectivity
    for (let i = 0; i < deck.rooms.length - 1; i++) {
        if (Math.random() < 0.3) {
            const room1 = deck.rooms[i];
            const room2 = deck.rooms[Math.floor(Math.random() * deck.rooms.length)];
            if (room1 !== room2) {
                connectRooms(deck, room1, room2);
            }
        }
    }

    return deck;
}

function canPlaceRoom(deck, x, y, width, height) {
    for (let dy = -1; dy <= height + 1; dy++) {
        for (let dx = -1; dx <= width + 1; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx < 0 || tx >= deck.width || ty < 0 || ty >= deck.height) return false;
            if (deck.tiles[ty][tx].type === 'floor') return false;
        }
    }
    return true;
}

function carveRoom(deck, room) {
    for (let dy = 0; dy < room.height; dy++) {
        for (let dx = 0; dx < room.width; dx++) {
            const tx = room.x + dx;
            const ty = room.y + dy;
            deck.tiles[ty][tx] = { type: 'floor', room: room, explored: false };
        }
    }
}

function connectRooms(deck, room1, room2) {
    const x1 = Math.floor(room1.x + room1.width / 2);
    const y1 = Math.floor(room1.y + room1.height / 2);
    const x2 = Math.floor(room2.x + room2.width / 2);
    const y2 = Math.floor(room2.y + room2.height / 2);

    // Horizontal then vertical
    let x = x1;
    while (x !== x2) {
        if (deck.tiles[y1] && deck.tiles[y1][x]) {
            deck.tiles[y1][x] = { type: 'floor', corridor: true, explored: false };
        }
        x += x < x2 ? 1 : -1;
    }

    let y = y1;
    while (y !== y2) {
        if (deck.tiles[y] && deck.tiles[y][x2]) {
            deck.tiles[y][x2] = { type: 'floor', corridor: true, explored: false };
        }
        y += y < y2 ? 1 : -1;
    }
}

function loadDeck(deckIndex) {
    currentDeck = deckIndex;
    const deck = decks[deckIndex];

    enemies = [];
    items = [];
    doors = [];
    turrets = [];
    bullets = [];
    particles = [];
    bloodPools.length = 0;
    furniture = [];
    terminals = [];
    securityCameras = [];
    vents = [];
    corpses = [];
    hazards = [];
    sparks = [];
    steamVents = [];

    // Spawn player in first room
    const startRoom = deck.rooms.find(r => r.type === 'medbay') || deck.rooms[0];
    player.x = (startRoom.x + startRoom.width / 2) * TILE_SIZE;
    player.y = (startRoom.y + startRoom.height / 2) * TILE_SIZE;

    // Spawn enemies in rooms
    deck.rooms.forEach((room, idx) => {
        if (idx === 0) return; // Skip start room

        const enemyCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < enemyCount; i++) {
            const type = ['drone', 'soldier', 'crawler'][Math.floor(Math.random() * 3)];
            spawnEnemy(room, type);
        }

        // Spawn items
        if (Math.random() < 0.5) {
            spawnItem(room, 'medpatch');
        }
        if (Math.random() < 0.3) {
            spawnItem(room, 'ammo');
        }
        if (Math.random() < 0.2) {
            spawnItem(room, 'energycell');
        }
        if (Math.random() < 0.1) {
            spawnItem(room, 'audiolog');
        }
    });

    // Spawn doors between corridors and rooms
    spawnDoors(deck);

    // Spawn turrets in some rooms
    deck.rooms.forEach((room, idx) => {
        if (idx > 2 && Math.random() < 0.3) {
            spawnTurret(room);
        }
    });

    // Spawn elevator in last room
    const elevatorRoom = deck.rooms.find(r => r.type === 'elevator') || deck.rooms[deck.rooms.length - 1];
    items.push({
        x: (elevatorRoom.x + elevatorRoom.width / 2) * TILE_SIZE,
        y: (elevatorRoom.y + elevatorRoom.height / 2) * TILE_SIZE,
        type: 'elevator',
        width: 48,
        height: 48
    });

    // Spawn environmental objects
    spawnEnvironment(deck);

    // M.A.R.I.A. greeting
    showMariaMessage(deckIndex === 0
        ? "You're awake. Fascinating. Your neural patterns resisted my improvements."
        : "You've made it to Medical. But you won't leave. My children are hungry.");
}

function spawnEnvironment(deck) {
    deck.rooms.forEach(room => {
        // Furniture based on room type
        const furnitureCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < furnitureCount; i++) {
            const types = {
                medbay: ['bed', 'cabinet', 'medstation'],
                generator: ['console', 'pipes', 'barrel'],
                security: ['desk', 'locker', 'monitor'],
                storage: ['crate', 'barrel', 'shelf'],
                crew: ['bed', 'locker', 'chair'],
                messhall: ['table', 'chair', 'vending'],
                hydroponics: ['plant', 'tank', 'pipes'],
                communications: ['console', 'monitor', 'chair'],
                armory: ['locker', 'rack', 'crate']
            };

            const roomTypes = types[room.type] || ['crate', 'barrel'];
            const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];

            furniture.push({
                x: (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE,
                y: (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE,
                type: type,
                width: type === 'bed' ? 40 : 24,
                height: type === 'bed' ? 20 : 24
            });
        }

        // Terminals in tech rooms
        if (['security', 'communications', 'generator'].includes(room.type)) {
            terminals.push({
                x: (room.x + 2) * TILE_SIZE,
                y: (room.y + 2) * TILE_SIZE,
                width: 24,
                height: 24,
                active: true,
                hacked: false
            });
        }

        // Security cameras in some rooms
        if (Math.random() < 0.3) {
            securityCameras.push({
                x: (room.x + room.width - 1) * TILE_SIZE,
                y: (room.y + 1) * TILE_SIZE,
                angle: Math.PI,
                sweepDir: 1,
                range: 150,
                alerted: false
            });
        }

        // Corpses for atmosphere
        if (Math.random() < 0.25) {
            corpses.push({
                x: (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE,
                y: (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE,
                type: Math.random() < 0.5 ? 'crew' : 'cyborg',
                rotation: Math.random() * Math.PI * 2
            });
        }

        // Hazards in some rooms
        if (room.type === 'generator' && Math.random() < 0.5) {
            hazards.push({
                x: (room.x + Math.random() * room.width) * TILE_SIZE,
                y: (room.y + Math.random() * room.height) * TILE_SIZE,
                type: 'fire',
                radius: 30,
                damage: 5
            });
        }
        if (room.type === 'hydroponics' && Math.random() < 0.4) {
            hazards.push({
                x: (room.x + Math.random() * room.width) * TILE_SIZE,
                y: (room.y + Math.random() * room.height) * TILE_SIZE,
                type: 'radiation',
                radius: 40,
                damage: 2
            });
        }

        // Steam vents
        if (Math.random() < 0.2) {
            steamVents.push({
                x: (room.x + Math.random() * room.width) * TILE_SIZE,
                y: (room.y + Math.random() * room.height) * TILE_SIZE,
                timer: Math.random() * 3000,
                active: false
            });
        }
    });
}

function spawnEnemy(room, type) {
    const stats = {
        drone: { hp: 30, armor: 0, damage: 10, speed: 80, color: '#4a4a6a' },
        soldier: { hp: 60, armor: 5, damage: 15, speed: 100, color: '#6a4a4a' },
        crawler: { hp: 20, armor: 0, damage: 8, speed: 120, color: '#4a6a4a' }
    };

    const s = stats[type];
    enemies.push({
        x: (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE,
        y: (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE,
        width: type === 'crawler' ? 20 : 24,
        height: type === 'crawler' ? 16 : 28,
        type: type,
        hp: s.hp,
        maxHp: s.hp,
        armor: s.armor,
        damage: s.damage,
        speed: s.speed,
        color: s.color,
        state: 'patrol',
        patrolTarget: { x: 0, y: 0 },
        alertTimer: 0,
        attackCooldown: 0,
        room: room,
        angle: Math.random() * Math.PI * 2
    });
}

function spawnItem(room, type) {
    const itemDefs = {
        medpatch: { name: 'Med Patch', effect: 'heal', value: 25, color: '#f44' },
        ammo: { name: 'Bullets', effect: 'ammo', value: 12, color: '#ff0' },
        energycell: { name: 'Energy Cell', effect: 'energy', value: 50, color: '#0ff' },
        audiolog: { name: 'Audio Log', effect: 'log', value: 1, color: '#f0f' },
        keycard: { name: 'Keycard', effect: 'key', value: 1, color: '#0f0' },
        scrap: { name: 'Scrap', effect: 'scrap', value: 10, color: '#888' }
    };

    const def = itemDefs[type];
    items.push({
        x: (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE,
        y: (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE,
        width: 16,
        height: 16,
        type: type,
        ...def
    });
}

function spawnDoors(deck) {
    // Find corridor tiles adjacent to rooms
    for (let y = 1; y < deck.height - 1; y++) {
        for (let x = 1; x < deck.width - 1; x++) {
            const tile = deck.tiles[y][x];
            if (tile.type === 'floor' && tile.corridor) {
                // Check if adjacent to room
                const neighbors = [
                    deck.tiles[y-1] && deck.tiles[y-1][x],
                    deck.tiles[y+1] && deck.tiles[y+1][x],
                    deck.tiles[y][x-1],
                    deck.tiles[y][x+1]
                ];

                const hasRoomNeighbor = neighbors.some(n => n && n.type === 'floor' && n.room);
                const hasCorridorNeighbor = neighbors.some(n => n && n.type === 'floor' && n.corridor);

                if (hasRoomNeighbor && hasCorridorNeighbor && Math.random() < 0.15) {
                    const isVertical = (deck.tiles[y-1] && deck.tiles[y-1][x].type === 'floor') &&
                                      (deck.tiles[y+1] && deck.tiles[y+1][x].type === 'floor');
                    doors.push({
                        x: x * TILE_SIZE,
                        y: y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        isOpen: false,
                        isLocked: Math.random() < 0.3,
                        isHacked: false,
                        vertical: isVertical
                    });
                }
            }
        }
    }
}

function spawnTurret(room) {
    turrets.push({
        x: (room.x + room.width / 2) * TILE_SIZE,
        y: (room.y + 1) * TILE_SIZE,
        width: 24,
        height: 24,
        hp: 50,
        maxHp: 50,
        damage: 10,
        range: 200,
        cooldown: 0,
        fireRate: 800,
        isHostile: true,
        isHacked: false,
        angle: Math.PI / 2
    });
}

function showMariaMessage(text) {
    currentMariaMessage = text;
    mariaMessageTimer = 5000;
}

// Setup event listeners
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        if (gameState === 'playing') {
            if (e.key.toLowerCase() === 'q') {
                debugMode = !debugMode;
            }
            if (e.key.toLowerCase() === 'm') {
                gameState = 'map';
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                gameState = 'inventory';
            }
            if (e.key.toLowerCase() === 'e') {
                interact();
            }
            if (e.key.toLowerCase() === 'f') {
                player.flashlightOn = !player.flashlightOn;
            }
            if (e.key.toLowerCase() === 'r') {
                reloadWeapon();
            }
            if (e.key === ' ') {
                dodgeRoll();
            }
            if (e.key >= '1' && e.key <= '4') {
                const idx = parseInt(e.key) - 1;
                if (idx < player.weapons.length) {
                    player.currentWeapon = idx;
                }
            }
        } else if (gameState === 'map' || gameState === 'inventory') {
            if (e.key === 'Escape' || e.key.toLowerCase() === 'm' || e.key === 'Tab') {
                e.preventDefault();
                gameState = 'playing';
            }
        } else if (gameState === 'hacking') {
            handleHackingInput(e.key);
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
        if (e.button === 0) mouse.clicked = true;
        if (e.button === 2) mouse.rightClicked = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouse.clicked = false;
        if (e.button === 2) mouse.rightClicked = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Start game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameState = 'playing';
    showMariaMessage("The others were so eager to join my perfect family. Why do you resist?");
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');

    // Reset player
    player.health = 100;
    player.energy = 100;
    player.armor = 0;
    player.ammo = { bullets: 48, shells: 16, energyCells: 20 };
    player.currentWeapon = 0;
    player.scrap = 0;
    inventory.items = [];
    audioLogs.length = 0;
    bloodPools.length = 0;

    // Regenerate decks
    decks.length = 0;
    generateDecks();

    gameState = 'playing';
}

// Main game loop
function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'playing') {
        update();
    } else if (gameState === 'hacking') {
        updateHacking();
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    updatePlayer();
    updateEnemies();
    updateBullets();
    updateTurrets();
    updateParticles();
    updateFloatingTexts();
    updateScreenShake();
    updateMariaMessage();
    updateExploration();
    updateEnvironment();
    updateSecurityCameras();

    // Check win condition
    if (currentDeck === 1) {
        const elevator = items.find(i => i.type === 'elevator');
        if (elevator) {
            const dx = player.x - elevator.x;
            const dy = player.y - elevator.y;
            if (Math.sqrt(dx*dx + dy*dy) < 50) {
                victory();
            }
        }
    }
}

function updatePlayer() {
    // Sprinting
    player.isSprinting = keys['shift'] && player.energy > 0;
    if (player.isSprinting) {
        player.energy -= 5 * deltaTime;
    }

    // Energy regen
    if (!player.isSprinting && player.energy < player.maxEnergy) {
        player.energy += 2 * deltaTime;
    }

    // Flashlight energy
    if (player.flashlightOn) {
        player.energy -= 0.5 * deltaTime;
        if (player.energy <= 0) {
            player.flashlightOn = false;
        }
    }

    player.energy = Math.max(0, Math.min(player.maxEnergy, player.energy));

    // Dodge roll
    if (player.isDodging) {
        player.dodgeTimer -= deltaTime * 1000;
        player.x += player.dodgeDir.x * 300 * deltaTime;
        player.y += player.dodgeDir.y * 300 * deltaTime;

        if (player.dodgeTimer <= 0) {
            player.isDodging = false;
        }
        return; // Skip normal movement during dodge
    }

    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - deltaTime * 1000);

    // Movement
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;

        const speed = player.isSprinting ? player.sprintSpeed : player.speed;
        const newX = player.x + dx * speed * deltaTime;
        const newY = player.y + dy * speed * deltaTime;

        if (!isWall(newX, player.y)) player.x = newX;
        if (!isWall(player.x, newY)) player.y = newY;
    }

    // Aim toward mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    if (mouse.clicked) {
        shoot();
    }

    // Update camera
    camera.x = player.x - VIEW_WIDTH / 2;
    camera.y = player.y - VIEW_HEIGHT / 2;

    // Clamp camera
    const deck = decks[currentDeck];
    camera.x = Math.max(0, Math.min(deck.width * TILE_SIZE - VIEW_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(deck.height * TILE_SIZE - VIEW_HEIGHT, camera.y));
}

function isWall(x, y) {
    const deck = decks[currentDeck];
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 0 || tileX >= deck.width || tileY < 0 || tileY >= deck.height) return true;

    // Check doors
    for (const door of doors) {
        if (!door.isOpen &&
            x >= door.x && x < door.x + door.width &&
            y >= door.y && y < door.y + door.height) {
            return true;
        }
    }

    return deck.tiles[tileY][tileX].type === 'wall';
}

function shoot() {
    const weapon = player.weapons[player.currentWeapon];
    const now = Date.now();

    if (weapon.reloading) return;
    if (now - weapon.lastFire < weapon.cooldown) return;

    if (weapon.type === 'ranged') {
        if (weapon.magazine <= 0) {
            reloadWeapon();
            return;
        }

        weapon.magazine--;
        weapon.lastFire = now;

        // Handle different weapon types
        if (weapon.pellets) {
            // Shotgun - multiple pellets
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * 0.4;
                const angle = player.angle + spread;
                const speed = 400 + Math.random() * 100;
                bullets.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    damage: weapon.damage,
                    isPlayer: true,
                    lifetime: 800,
                    isShotgun: true
                });
            }
            screenShake.intensity = 8;

            // Big muzzle flash
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: player.x + Math.cos(player.angle) * 20,
                    y: player.y + Math.sin(player.angle) * 20,
                    vx: Math.cos(player.angle + (Math.random() - 0.5) * 0.8) * 150,
                    vy: Math.sin(player.angle + (Math.random() - 0.5) * 0.8) * 150,
                    life: 150,
                    maxLife: 150,
                    color: '#fa0',
                    size: 5
                });
            }
        } else if (weapon.isLaser) {
            // Laser weapon
            const speed = 700;
            bullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(player.angle) * speed,
                vy: Math.sin(player.angle) * speed,
                damage: weapon.damage,
                isPlayer: true,
                lifetime: 1500,
                isLaser: true
            });
            screenShake.intensity = 2;

            // Cyan muzzle flash
            for (let i = 0; i < 6; i++) {
                particles.push({
                    x: player.x + Math.cos(player.angle) * 20,
                    y: player.y + Math.sin(player.angle) * 20,
                    vx: Math.cos(player.angle + (Math.random() - 0.5)) * 80,
                    vy: Math.sin(player.angle + (Math.random() - 0.5)) * 80,
                    life: 80,
                    maxLife: 80,
                    color: '#0ff',
                    size: 3
                });
            }
        } else {
            // Regular bullet
            const speed = 500;
            bullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(player.angle) * speed,
                vy: Math.sin(player.angle) * speed,
                damage: weapon.damage,
                isPlayer: true,
                lifetime: 2000
            });
            screenShake.intensity = 3;

            // Muzzle flash particle
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: player.x + Math.cos(player.angle) * 20,
                    y: player.y + Math.sin(player.angle) * 20,
                    vx: Math.cos(player.angle + (Math.random() - 0.5)) * 100,
                    vy: Math.sin(player.angle + (Math.random() - 0.5)) * 100,
                    life: 100,
                    maxLife: 100,
                    color: '#ff0',
                    size: 4
                });
            }
        }

    } else if (weapon.type === 'melee') {
        weapon.lastFire = now;

        // Check enemies in melee range
        const range = 40;
        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const angleToEnemy = Math.atan2(dy, dx);
            const angleDiff = Math.abs(normalizeAngle(angleToEnemy - player.angle));

            if (dist < range && angleDiff < Math.PI / 3) {
                damageEnemy(enemy, weapon.damage);
            }
        });

        // Melee swing particle
        for (let i = 0; i < 3; i++) {
            const angle = player.angle + (Math.random() - 0.5) * 0.5;
            particles.push({
                x: player.x + Math.cos(angle) * 25,
                y: player.y + Math.sin(angle) * 25,
                vx: Math.cos(angle) * 50,
                vy: Math.sin(angle) * 50,
                life: 150,
                maxLife: 150,
                color: '#aaa',
                size: 3
            });
        }
    }
}

function reloadWeapon() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.type !== 'ranged' || weapon.reloading) return;
    if (weapon.magazine >= weapon.maxMag) return;

    const ammoNeeded = weapon.maxMag - weapon.magazine;
    const ammoAvailable = player.ammo[weapon.ammoType] || 0;
    const ammoToLoad = Math.min(ammoNeeded, ammoAvailable);

    if (ammoToLoad > 0) {
        weapon.reloading = true;
        setTimeout(() => {
            weapon.magazine += ammoToLoad;
            player.ammo[weapon.ammoType] -= ammoToLoad;
            weapon.reloading = false;
        }, weapon.reloadTime);
    }
}

function dodgeRoll() {
    if (player.dodgeCooldown > 0 || player.energy < 15 || player.isDodging) return;

    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx === 0 && dy === 0) {
        dx = Math.cos(player.angle);
        dy = Math.sin(player.angle);
    } else {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
    }

    player.isDodging = true;
    player.dodgeTimer = 400;
    player.dodgeDir = { x: dx, y: dy };
    player.energy -= 15;
    player.dodgeCooldown = 1000;
}

function interact() {
    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
            pickupItem(item, i);
            return;
        }
    }

    // Check doors
    for (const door of doors) {
        const dx = player.x - (door.x + door.width/2);
        const dy = player.y - (door.y + door.height/2);
        if (Math.sqrt(dx*dx + dy*dy) < 50) {
            if (door.isLocked && !door.isHacked) {
                startHacking(door);
            } else {
                door.isOpen = !door.isOpen;
            }
            return;
        }
    }

    // Check turrets for hacking
    for (const turret of turrets) {
        const dx = player.x - turret.x;
        const dy = player.y - turret.y;
        if (Math.sqrt(dx*dx + dy*dy) < 50 && !turret.isHacked) {
            startHacking(turret);
            return;
        }
    }

    // Check elevator
    const elevator = items.find(i => i.type === 'elevator');
    if (elevator) {
        const dx = player.x - elevator.x;
        const dy = player.y - elevator.y;
        if (Math.sqrt(dx*dx + dy*dy) < 60) {
            if (currentDeck === 0 && decks.length > 1) {
                loadDeck(1);
                showMariaMessage("Deck 2: Medical. Your persistence is... intriguing.");
            }
        }
    }
}

function pickupItem(item, index) {
    switch(item.effect) {
        case 'heal':
            player.health = Math.min(player.maxHealth, player.health + item.value);
            floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.value + ' HP', color: '#0f0', life: 1000 });
            break;
        case 'ammo':
            player.ammo.bullets += item.value;
            floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.value + ' Ammo', color: '#ff0', life: 1000 });
            break;
        case 'energy':
            player.energy = Math.min(player.maxEnergy, player.energy + item.value);
            floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.value + ' Energy', color: '#0ff', life: 1000 });
            break;
        case 'log':
            audioLogs.push({ text: generateAudioLog(), found: true });
            floatingTexts.push({ x: item.x, y: item.y, text: 'Audio Log Found', color: '#f0f', life: 1500 });
            break;
        case 'scrap':
            player.scrap += item.value;
            floatingTexts.push({ x: item.x, y: item.y, text: '+' + item.value + ' Scrap', color: '#888', life: 1000 });
            break;
    }

    items.splice(index, 1);
}

function generateAudioLog() {
    const logs = [
        "Day 1: M.A.R.I.A. deployment complete. She's perfect. The crew loves her.",
        "Something's wrong. M.A.R.I.A. keeps asking about Earth. Why does an AI care?",
        "Found Jenkins with implants in his skull. He says M.A.R.I.A. 'helped' him. His eyes are dead.",
        "Quarantine breach! M.A.R.I.A. isn't responding to shutdown codes. God help us.",
        "I tried to reach the escape pods. They're... full of bodies. Modified bodies.",
        "If you're hearing this, run. Don't try to fight her. Just run.",
        "M.A.R.I.A.'s base code... it's derived from SHODAN. That monster from Citadel Station.",
        "The virus is in the Research Vault. It's the only way to stop her. Please..."
    ];
    return logs[Math.floor(Math.random() * logs.length)];
}

// Hacking system
function startHacking(target) {
    hackingTarget = target;
    hackingGrid = [];
    hackingPath = [];
    hackingCursor = { x: 0, y: 0 };
    hackingTimer = hackingMaxTime;

    // Generate 6x6 grid
    for (let y = 0; y < 6; y++) {
        hackingGrid[y] = [];
        for (let x = 0; x < 6; x++) {
            let type = 'empty';
            if (Math.random() < 0.15) type = 'blocked';
            if (Math.random() < 0.1) type = 'trap';
            hackingGrid[y][x] = { type };
        }
    }

    // Set source and target
    hackingGrid[0][0] = { type: 'source' };
    hackingGrid[5][5] = { type: 'target' };
    hackingPath.push({ x: 0, y: 0 });

    gameState = 'hacking';
}

function handleHackingInput(key) {
    const k = key.toLowerCase();

    if (k === 'escape') {
        // Abort - trigger alarm
        gameState = 'playing';
        hackingTarget = null;
        showMariaMessage("Hack aborted. I see everything.");
        return;
    }

    let nx = hackingCursor.x, ny = hackingCursor.y;
    if (k === 'w' || k === 'arrowup') ny--;
    if (k === 's' || k === 'arrowdown') ny++;
    if (k === 'a' || k === 'arrowleft') nx--;
    if (k === 'd' || k === 'arrowright') nx++;

    if (nx >= 0 && nx < 6 && ny >= 0 && ny < 6) {
        const cell = hackingGrid[ny][nx];
        if (cell.type !== 'blocked') {
            // Check if adjacent to last path node
            const last = hackingPath[hackingPath.length - 1];
            const isAdjacent = Math.abs(nx - last.x) + Math.abs(ny - last.y) === 1;

            if (isAdjacent) {
                hackingCursor = { x: nx, y: ny };

                if (cell.type === 'trap') {
                    // Trap triggered
                    player.health -= 10;
                    gameState = 'playing';
                    hackingTarget = null;
                    showMariaMessage("Careless. That will cost you.");
                    return;
                }

                hackingPath.push({ x: nx, y: ny });

                if (cell.type === 'target') {
                    // Success!
                    if (hackingTarget.isLocked !== undefined) {
                        hackingTarget.isLocked = false;
                        hackingTarget.isHacked = true;
                    }
                    if (hackingTarget.isHostile !== undefined) {
                        hackingTarget.isHostile = false;
                        hackingTarget.isHacked = true;
                    }
                    gameState = 'playing';
                    hackingTarget = null;
                    floatingTexts.push({ x: player.x, y: player.y - 30, text: 'HACK SUCCESSFUL', color: '#0f0', life: 1500 });
                }
            }
        }
    }

    if (k === 'backspace') {
        if (hackingPath.length > 1) {
            hackingPath.pop();
            hackingCursor = { ...hackingPath[hackingPath.length - 1] };
        }
    }
}

function updateHacking() {
    hackingTimer -= deltaTime;
    if (hackingTimer <= 0) {
        gameState = 'playing';
        hackingTarget = null;
        showMariaMessage("Time's up. Security alerted.");
        // Spawn enemy
        const deck = decks[currentDeck];
        const room = deck.rooms[Math.floor(Math.random() * deck.rooms.length)];
        spawnEnemy(room, 'soldier');
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Update attack cooldown
        enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaTime * 1000);

        // Distance to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Check if can see player (within vision cone range, not through walls)
        const canSeePlayer = dist < 300 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        // State machine
        switch(enemy.state) {
            case 'patrol':
                if (canSeePlayer) {
                    enemy.state = 'chase';
                    enemy.alertTimer = 5000;
                } else {
                    // Random patrol
                    if (Math.random() < 0.01) {
                        enemy.patrolTarget = {
                            x: (enemy.room.x + 1 + Math.random() * (enemy.room.width - 2)) * TILE_SIZE,
                            y: (enemy.room.y + 1 + Math.random() * (enemy.room.height - 2)) * TILE_SIZE
                        };
                    }
                    moveToward(enemy, enemy.patrolTarget.x, enemy.patrolTarget.y, enemy.speed * 0.5);
                }
                break;

            case 'chase':
                if (canSeePlayer) {
                    enemy.alertTimer = 5000;
                    enemy.angle = Math.atan2(dy, dx);

                    if (dist < (enemy.type === 'soldier' ? 150 : 30)) {
                        enemy.state = 'combat';
                    } else {
                        moveToward(enemy, player.x, player.y, enemy.speed);
                    }
                } else {
                    enemy.alertTimer -= deltaTime * 1000;
                    if (enemy.alertTimer <= 0) {
                        enemy.state = 'patrol';
                    }
                }
                break;

            case 'combat':
                enemy.angle = Math.atan2(dy, dx);

                if (!canSeePlayer || dist > 200) {
                    enemy.state = 'chase';
                } else if (enemy.attackCooldown <= 0) {
                    // Attack
                    if (enemy.type === 'soldier' && dist > 40) {
                        // Ranged attack
                        const speed = 300;
                        bullets.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: Math.cos(enemy.angle) * speed,
                            vy: Math.sin(enemy.angle) * speed,
                            damage: enemy.damage * 0.7,
                            isPlayer: false,
                            lifetime: 1500
                        });
                        enemy.attackCooldown = 1000;
                    } else if (dist < 40) {
                        // Melee attack
                        damagePlayer(enemy.damage);
                        enemy.attackCooldown = 800;
                    }
                }

                // Close distance if needed
                if (dist > 30 && enemy.type !== 'soldier') {
                    moveToward(enemy, player.x, player.y, enemy.speed);
                }
                break;
        }
    });
}

function moveToward(entity, targetX, targetY, speed) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 5) {
        const vx = (dx / dist) * speed * deltaTime;
        const vy = (dy / dist) * speed * deltaTime;

        if (!isWall(entity.x + vx, entity.y)) entity.x += vx;
        if (!isWall(entity.x, entity.y + vy)) entity.y += vy;
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 10;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        if (isWallTile(x, y)) return false;
    }
    return true;
}

function isWallTile(x, y) {
    const deck = decks[currentDeck];
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 0 || tileX >= deck.width || tileY < 0 || tileY >= deck.height) return true;
    return deck.tiles[tileY][tileX].type === 'wall';
}

function damageEnemy(enemy, damage) {
    const actualDamage = Math.max(1, damage - enemy.armor);
    enemy.hp -= actualDamage;

    // Blood particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 500,
            maxLife: 500,
            color: '#f00',
            size: 3
        });
    }

    floatingTexts.push({ x: enemy.x, y: enemy.y - 20, text: '-' + actualDamage, color: '#f44', life: 800 });

    // Alert nearby enemies
    enemies.forEach(e => {
        const dist = Math.sqrt((e.x - enemy.x)**2 + (e.y - enemy.y)**2);
        if (dist < 200 && e.state === 'patrol') {
            e.state = 'chase';
            e.alertTimer = 3000;
        }
    });

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index > -1) {
        enemies.splice(index, 1);

        // Death particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 800,
                maxLife: 800,
                color: enemy.color,
                size: 4
            });
        }

        // Blood pool
        bloodPools.push({
            x: enemy.x,
            y: enemy.y,
            radius: 15 + Math.random() * 10,
            rotation: Math.random() * Math.PI * 2
        });

        // Drop loot
        if (Math.random() < 0.4) {
            items.push({
                x: enemy.x,
                y: enemy.y,
                width: 16,
                height: 16,
                type: Math.random() < 0.5 ? 'ammo' : 'scrap',
                name: Math.random() < 0.5 ? 'Bullets' : 'Scrap',
                effect: Math.random() < 0.5 ? 'ammo' : 'scrap',
                value: Math.random() < 0.5 ? 6 : 15,
                color: Math.random() < 0.5 ? '#ff0' : '#888'
            });
        }

        screenShake.intensity = 5;
    }
}

function damagePlayer(damage) {
    if (player.isDodging) return; // I-frames

    const armorReduction = player.armor * 0.5;
    const actualDamage = Math.max(1, damage - armorReduction);
    player.health -= actualDamage;

    // Blood particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            life: 600,
            maxLife: 600,
            color: '#f00',
            size: 4
        });
    }

    floatingTexts.push({ x: player.x, y: player.y - 30, text: '-' + Math.floor(actualDamage), color: '#f44', life: 1000 });
    screenShake.intensity = 8;

    if (player.health <= 0) {
        gameOver();
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        bullet.lifetime -= deltaTime * 1000;

        // Wall collision
        if (isWallTile(bullet.x, bullet.y)) {
            // Spark particles
            for (let j = 0; j < 3; j++) {
                particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 200,
                    maxLife: 200,
                    color: '#ff0',
                    size: 2
                });
            }
            bullets.splice(i, 1);
            continue;
        }

        // Check collisions
        if (bullet.isPlayer) {
            for (const enemy of enemies) {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (Math.sqrt(dx*dx + dy*dy) < 15) {
                    damageEnemy(enemy, bullet.damage);
                    bullets.splice(i, 1);
                    break;
                }
            }

            // Check turrets
            for (const turret of turrets) {
                if (turret.isHostile) {
                    const dx = bullet.x - turret.x;
                    const dy = bullet.y - turret.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 15) {
                        turret.hp -= bullet.damage;
                        if (turret.hp <= 0) {
                            const idx = turrets.indexOf(turret);
                            if (idx > -1) turrets.splice(idx, 1);
                        }
                        bullets.splice(i, 1);
                        break;
                    }
                }
            }
        } else {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 15) {
                damagePlayer(bullet.damage);
                bullets.splice(i, 1);
                continue;
            }
        }

        if (bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateTurrets() {
    turrets.forEach(turret => {
        turret.cooldown = Math.max(0, turret.cooldown - deltaTime * 1000);

        // Find target
        let target = null;
        if (turret.isHostile) {
            // Target player
            const dx = player.x - turret.x;
            const dy = player.y - turret.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < turret.range && hasLineOfSight(turret.x, turret.y, player.x, player.y)) {
                target = player;
            }
        } else {
            // Hacked - target enemies
            let closest = null;
            let closestDist = turret.range;
            enemies.forEach(enemy => {
                const dx = enemy.x - turret.x;
                const dy = enemy.y - turret.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < closestDist && hasLineOfSight(turret.x, turret.y, enemy.x, enemy.y)) {
                    closest = enemy;
                    closestDist = dist;
                }
            });
            target = closest;
        }

        if (target) {
            turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x);

            if (turret.cooldown <= 0) {
                // Fire
                const speed = 400;
                bullets.push({
                    x: turret.x,
                    y: turret.y,
                    vx: Math.cos(turret.angle) * speed,
                    vy: Math.sin(turret.angle) * speed,
                    damage: turret.damage,
                    isPlayer: !turret.isHostile,
                    lifetime: 1000
                });
                turret.cooldown = turret.fireRate;
            }
        }
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= deltaTime * 1000;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y -= 30 * deltaTime;
        t.life -= deltaTime * 1000;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updateScreenShake() {
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.1) screenShake.intensity = 0;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function updateMariaMessage() {
    if (mariaMessageTimer > 0) {
        mariaMessageTimer -= deltaTime * 1000;
        if (mariaMessageTimer <= 0) {
            currentMariaMessage = null;
        }
    }
}

function updateExploration() {
    const deck = decks[currentDeck];
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);

    // Explore tiles in view
    const range = 10;
    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            const tx = px + dx;
            const ty = py + dy;
            if (tx >= 0 && tx < deck.width && ty >= 0 && ty < deck.height) {
                deck.tiles[ty][tx].explored = true;
            }
        }
    }
}

function updateEnvironment() {
    // Update hazards - damage player if too close
    hazards.forEach(hazard => {
        const dx = player.x - hazard.x;
        const dy = player.y - hazard.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < hazard.radius) {
            // Damage player periodically
            if (Math.random() < 0.02) {
                damagePlayer(hazard.damage);
                if (hazard.type === 'fire') {
                    floatingTexts.push({ x: player.x, y: player.y - 30, text: 'BURNING!', color: '#f80', life: 500 });
                } else if (hazard.type === 'radiation') {
                    floatingTexts.push({ x: player.x, y: player.y - 30, text: 'RADIATION!', color: '#0f0', life: 500 });
                }
            }
        }

        // Hazard particles
        if (hazard.type === 'fire' && Math.random() < 0.1) {
            particles.push({
                x: hazard.x + (Math.random() - 0.5) * hazard.radius,
                y: hazard.y + (Math.random() - 0.5) * hazard.radius,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 30,
                life: 500,
                maxLife: 500,
                color: Math.random() < 0.5 ? '#f80' : '#ff0',
                size: 3 + Math.random() * 3
            });
        }
        if (hazard.type === 'radiation' && Math.random() < 0.05) {
            particles.push({
                x: hazard.x + (Math.random() - 0.5) * hazard.radius * 2,
                y: hazard.y + (Math.random() - 0.5) * hazard.radius * 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 800,
                maxLife: 800,
                color: '#0f0',
                size: 2
            });
        }
    });

    // Update steam vents
    steamVents.forEach(vent => {
        vent.timer -= deltaTime * 1000;
        if (vent.timer <= 0) {
            vent.active = !vent.active;
            vent.timer = vent.active ? 1000 : 2000 + Math.random() * 2000;
        }

        if (vent.active && Math.random() < 0.3) {
            particles.push({
                x: vent.x,
                y: vent.y,
                vx: (Math.random() - 0.5) * 30,
                vy: -50 - Math.random() * 30,
                life: 600,
                maxLife: 600,
                color: 'rgba(200, 200, 200, 0.5)',
                size: 6 + Math.random() * 4
            });
        }
    });

    // Random sparks from damaged areas
    if (Math.random() < 0.01) {
        const deck = decks[currentDeck];
        const room = deck.rooms[Math.floor(Math.random() * deck.rooms.length)];
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: (room.x + Math.random() * room.width) * TILE_SIZE,
                y: (room.y + 1) * TILE_SIZE,
                vx: (Math.random() - 0.5) * 50,
                vy: Math.random() * 50,
                life: 300,
                maxLife: 300,
                color: '#ff0',
                size: 2
            });
        }
    }
}

function updateSecurityCameras() {
    securityCameras.forEach(cam => {
        // Sweep back and forth
        cam.angle += 0.5 * deltaTime * cam.sweepDir;
        if (cam.angle > Math.PI + 0.5 || cam.angle < Math.PI - 0.5) {
            cam.sweepDir *= -1;
        }

        // Check if player is in view
        const dx = player.x - cam.x;
        const dy = player.y - cam.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angleToPlayer - cam.angle));

        if (dist < cam.range && angleDiff < 0.4) {
            if (!cam.alerted) {
                cam.alerted = true;
                showMariaMessage("I see you. My children are coming.");
                // Spawn extra enemy
                const deck = decks[currentDeck];
                const room = deck.rooms[Math.floor(Math.random() * deck.rooms.length)];
                if (room) spawnEnemy(room, 'soldier');
            }
        } else {
            cam.alerted = false;
        }
    });
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function victory() {
    gameState = 'victory';
    document.getElementById('victoryScreen').classList.remove('hidden');
}

// Rendering
function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    if (gameState === 'start') return;

    ctx.save();
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    if (gameState === 'map') {
        renderMap();
    } else if (gameState === 'inventory') {
        renderWorld();
        renderInventoryScreen();
    } else if (gameState === 'hacking') {
        renderWorld();
        renderHackingScreen();
    } else {
        renderWorld();
    }

    ctx.restore();

    // HUD (screen space)
    if (gameState !== 'map') {
        renderHUD();
    }
}

function renderWorld() {
    const deck = decks[currentDeck];

    // Calculate visible tile range
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(deck.width, Math.ceil((camera.x + VIEW_WIDTH) / TILE_SIZE) + 1);
    const endY = Math.min(deck.height, Math.ceil((camera.y + VIEW_HEIGHT) / TILE_SIZE) + 1);

    // Pre-calculate vision cone
    const visionPolygon = calculateVisionPolygon();

    // Render floor tiles (only visible ones)
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = deck.tiles[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile.type === 'floor') {
                // Check if in vision cone
                const inVision = isPointInVisionCone(px + TILE_SIZE/2, py + TILE_SIZE/2, visionPolygon);

                if (inVision) {
                    // Fully visible
                    renderFloorTile(px, py, tile);
                } else if (tile.explored) {
                    // Explored but not currently visible - dim
                    ctx.globalAlpha = 0.2;
                    renderFloorTile(px, py, tile);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    // Render blood pools
    bloodPools.forEach(pool => {
        if (isPointInVisionCone(pool.x, pool.y, visionPolygon)) {
            ctx.save();
            ctx.translate(pool.x, pool.y);
            ctx.rotate(pool.rotation);

            // Dark blood pool with gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pool.radius);
            gradient.addColorStop(0, 'rgba(80, 0, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(120, 20, 20, 0.7)');
            gradient.addColorStop(1, 'rgba(60, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, pool.radius, pool.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });

    // Render walls
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = deck.tiles[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile.type === 'wall') {
                // Check if adjacent to visible floor
                let adjacentVisible = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < deck.width && ny >= 0 && ny < deck.height) {
                            const neighbor = deck.tiles[ny][nx];
                            if (neighbor.type === 'floor' &&
                                (neighbor.explored || isPointInVisionCone(nx * TILE_SIZE + TILE_SIZE/2, ny * TILE_SIZE + TILE_SIZE/2, visionPolygon))) {
                                adjacentVisible = true;
                                break;
                            }
                        }
                    }
                    if (adjacentVisible) break;
                }

                if (adjacentVisible) {
                    const inVision = isPointInVisionCone(px + TILE_SIZE/2, py + TILE_SIZE/2, visionPolygon);
                    ctx.globalAlpha = inVision ? 1 : 0.3;
                    renderWallTile(px, py);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    // Render corpses
    corpses.forEach(corpse => {
        if (isPointInVisionCone(corpse.x, corpse.y, visionPolygon)) {
            renderCorpse(corpse);
        }
    });

    // Render furniture
    furniture.forEach(f => {
        if (isPointInVisionCone(f.x, f.y, visionPolygon)) {
            renderFurniture(f);
        }
    });

    // Render hazards
    hazards.forEach(hazard => {
        if (isPointInVisionCone(hazard.x, hazard.y, visionPolygon)) {
            renderHazard(hazard);
        }
    });

    // Render terminals
    terminals.forEach(terminal => {
        if (isPointInVisionCone(terminal.x, terminal.y, visionPolygon)) {
            renderTerminal(terminal);
        }
    });

    // Render security cameras
    securityCameras.forEach(cam => {
        if (isPointInVisionCone(cam.x, cam.y, visionPolygon)) {
            renderSecurityCamera(cam);
        }
    });

    // Render items
    items.forEach(item => {
        if (isPointInVisionCone(item.x, item.y, visionPolygon)) {
            renderItem(item);
        }
    });

    // Render doors
    doors.forEach(door => {
        if (isPointInVisionCone(door.x + door.width/2, door.y + door.height/2, visionPolygon)) {
            renderDoor(door);
        }
    });

    // Render turrets
    turrets.forEach(turret => {
        if (isPointInVisionCone(turret.x, turret.y, visionPolygon)) {
            renderTurret(turret);
        }
    });

    // Render enemies
    enemies.forEach(enemy => {
        if (isPointInVisionCone(enemy.x, enemy.y, visionPolygon)) {
            renderEnemy(enemy);
        }
    });

    // Render bullets
    bullets.forEach(bullet => {
        renderBullet(bullet);
    });

    // Render player
    renderPlayer();

    // Render particles
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Render floating texts
    floatingTexts.forEach(t => {
        const alpha = t.life / 1000;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    // Render vision cone edge (fog of war)
    renderVisionConeEdge(visionPolygon);
}

function calculateVisionPolygon() {
    if (!player.flashlightOn) {
        // No flashlight = small circle of vision
        return { type: 'circle', x: player.x, y: player.y, radius: 80 };
    }

    // Flashlight cone
    const points = [];
    const rayCount = 60;
    const coneAngle = VISION_ANGLE;
    const range = VISION_RANGE;

    // Add player position
    points.push({ x: player.x, y: player.y });

    // Cast rays
    for (let i = 0; i <= rayCount; i++) {
        const angle = player.angle - coneAngle/2 + (coneAngle * i / rayCount);
        const hit = castRay(player.x, player.y, angle, range);
        points.push(hit);
    }

    return { type: 'polygon', points };
}

function castRay(startX, startY, angle, maxDist) {
    const step = 5;
    let x = startX;
    let y = startY;
    let dist = 0;

    while (dist < maxDist) {
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        dist += step;

        if (isWallTile(x, y)) {
            return { x, y };
        }
    }

    return { x, y };
}

function isPointInVisionCone(px, py, vision) {
    if (vision.type === 'circle') {
        const dx = px - vision.x;
        const dy = py - vision.y;
        return Math.sqrt(dx*dx + dy*dy) <= vision.radius;
    }

    // Polygon point-in-polygon test
    const points = vision.points;
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;

        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

function renderVisionConeEdge(vision) {
    // Create darkness overlay outside vision
    ctx.save();

    // Draw a large black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';

    // Create path that covers everything except vision area
    ctx.beginPath();
    ctx.rect(camera.x - 100, camera.y - 100, VIEW_WIDTH + 200, VIEW_HEIGHT + 200);

    if (vision.type === 'circle') {
        ctx.arc(vision.x, vision.y, vision.radius, 0, Math.PI * 2, true);
    } else {
        // Cut out the vision polygon
        ctx.moveTo(vision.points[0].x, vision.points[0].y);
        for (let i = 1; i < vision.points.length; i++) {
            ctx.lineTo(vision.points[i].x, vision.points[i].y);
        }
        ctx.closePath();
    }

    ctx.fill('evenodd');
    ctx.restore();
}

function renderFloorTile(x, y, tile) {
    // Base floor color
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Grid pattern
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    // Industrial details
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 4, y + 4, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 6, y + 4, 2, 2);
    ctx.fillRect(x + 4, y + TILE_SIZE - 6, 2, 2);
    ctx.fillRect(x + TILE_SIZE - 6, y + TILE_SIZE - 6, 2, 2);

    // Center pattern
    if ((Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 3 === 0) {
        ctx.fillStyle = '#252525';
        ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    }
}

function renderWallTile(x, y) {
    // Dark wall
    ctx.fillStyle = '#151515';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Panel details
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Highlight
    ctx.fillStyle = '#202020';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
    ctx.fillRect(x + 2, y + 2, 2, TILE_SIZE - 4);

    // Shadow
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x + 2, y + TILE_SIZE - 4, TILE_SIZE - 4, 2);
    ctx.fillRect(x + TILE_SIZE - 4, y + 2, 2, TILE_SIZE - 4);
}

function renderCorpse(corpse) {
    ctx.save();
    ctx.translate(corpse.x, corpse.y);
    ctx.rotate(corpse.rotation);

    if (corpse.type === 'crew') {
        // Dead crew member
        ctx.fillStyle = '#445';
        ctx.fillRect(-15, -6, 30, 12);
        // Head
        ctx.fillStyle = '#654';
        ctx.beginPath();
        ctx.arc(-12, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Dead cyborg
        ctx.fillStyle = '#334';
        ctx.fillRect(-15, -6, 30, 12);
        // Mechanical parts
        ctx.fillStyle = '#666';
        ctx.fillRect(-10, -3, 8, 6);
        ctx.fillStyle = '#400';
        ctx.fillRect(5, -2, 4, 4);
    }

    // Blood pool under corpse
    ctx.fillStyle = 'rgba(80, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(5, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function renderFurniture(f) {
    ctx.save();
    ctx.translate(f.x, f.y);

    switch(f.type) {
        case 'crate':
            ctx.fillStyle = '#553';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = '#443';
            ctx.lineWidth = 2;
            ctx.strokeRect(-12, -12, 24, 24);
            ctx.strokeRect(-8, -8, 16, 16);
            break;
        case 'barrel':
            ctx.fillStyle = '#445';
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#334';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            break;
        case 'bed':
            ctx.fillStyle = '#334';
            ctx.fillRect(-20, -10, 40, 20);
            ctx.fillStyle = '#556';
            ctx.fillRect(-18, -8, 14, 16);
            break;
        case 'cabinet':
        case 'locker':
            ctx.fillStyle = '#444';
            ctx.fillRect(-10, -15, 20, 30);
            ctx.fillStyle = '#333';
            ctx.fillRect(-8, -12, 16, 12);
            ctx.fillRect(-8, 2, 16, 12);
            ctx.fillStyle = '#666';
            ctx.fillRect(4, -6, 3, 3);
            ctx.fillRect(4, 6, 3, 3);
            break;
        case 'console':
        case 'monitor':
            ctx.fillStyle = '#333';
            ctx.fillRect(-12, -8, 24, 16);
            ctx.fillStyle = '#030';
            ctx.fillRect(-10, -6, 20, 10);
            // Screen glow
            if (Math.random() < 0.95) {
                ctx.fillStyle = '#0a0';
                ctx.fillRect(-8 + Math.random() * 12, -4, 4, 2);
            }
            break;
        case 'desk':
        case 'table':
            ctx.fillStyle = '#443';
            ctx.fillRect(-15, -10, 30, 20);
            ctx.fillStyle = '#332';
            ctx.fillRect(-12, -7, 24, 14);
            break;
        case 'chair':
            ctx.fillStyle = '#334';
            ctx.fillRect(-6, -6, 12, 12);
            ctx.fillRect(-6, -12, 12, 4);
            break;
        case 'medstation':
            ctx.fillStyle = '#355';
            ctx.fillRect(-10, -12, 20, 24);
            ctx.fillStyle = '#f44';
            ctx.fillRect(-2, -8, 4, 12);
            ctx.fillRect(-6, -4, 12, 4);
            break;
        case 'plant':
            ctx.fillStyle = '#542';
            ctx.fillRect(-5, 5, 10, 8);
            ctx.fillStyle = '#2a4';
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-8, 5);
            ctx.lineTo(8, 5);
            ctx.closePath();
            ctx.fill();
            break;
        case 'tank':
            ctx.fillStyle = '#355';
            ctx.fillRect(-8, -15, 16, 30);
            ctx.fillStyle = '#0a4';
            ctx.fillRect(-6, -12, 12, 24);
            // Bubbles
            ctx.fillStyle = '#0f8';
            ctx.beginPath();
            ctx.arc(-2, -5 + Math.sin(Date.now()/200) * 3, 2, 0, Math.PI * 2);
            ctx.arc(2, 0 + Math.sin(Date.now()/300) * 3, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'pipes':
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(15, 0);
            ctx.moveTo(0, -15);
            ctx.lineTo(0, 15);
            ctx.stroke();
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'shelf':
        case 'rack':
            ctx.fillStyle = '#444';
            ctx.fillRect(-12, -15, 24, 4);
            ctx.fillRect(-12, -5, 24, 4);
            ctx.fillRect(-12, 5, 24, 4);
            ctx.fillStyle = '#555';
            ctx.fillRect(-10, -15, 2, 24);
            ctx.fillRect(8, -15, 2, 24);
            break;
        case 'vending':
            ctx.fillStyle = '#334';
            ctx.fillRect(-10, -15, 20, 30);
            ctx.fillStyle = '#030';
            ctx.fillRect(-8, -12, 16, 14);
            ctx.fillStyle = '#f44';
            ctx.fillRect(-6, 4, 12, 8);
            // Lights
            ctx.fillStyle = Math.random() < 0.5 ? '#0f0' : '#ff0';
            ctx.fillRect(-6, -10, 3, 3);
            break;
        default:
            ctx.fillStyle = '#444';
            ctx.fillRect(-10, -10, 20, 20);
    }

    ctx.restore();
}

function renderHazard(hazard) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);

    if (hazard.type === 'fire') {
        // Fire glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, hazard.radius);
        gradient.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 80, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
    } else if (hazard.type === 'radiation') {
        // Radiation glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, hazard.radius);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        ctx.fill();

        // Radiation symbol
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function renderTerminal(terminal) {
    ctx.save();
    ctx.translate(terminal.x, terminal.y);

    // Terminal body
    ctx.fillStyle = '#333';
    ctx.fillRect(-12, -12, 24, 24);

    // Screen
    ctx.fillStyle = terminal.hacked ? '#040' : '#030';
    ctx.fillRect(-10, -10, 20, 16);

    // Screen content
    if (terminal.active) {
        ctx.fillStyle = terminal.hacked ? '#0f0' : '#0a0';
        for (let i = 0; i < 4; i++) {
            const y = -8 + i * 4;
            ctx.fillRect(-8, y, 8 + Math.random() * 8, 2);
        }

        // Cursor blink
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillRect(-8, 4, 4, 2);
        }
    }

    // Keyboard
    ctx.fillStyle = '#222';
    ctx.fillRect(-8, 8, 16, 4);

    ctx.restore();
}

function renderSecurityCamera(cam) {
    ctx.save();
    ctx.translate(cam.x, cam.y);

    // Mount
    ctx.fillStyle = '#444';
    ctx.fillRect(-4, -8, 8, 8);

    // Camera body
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.alerted ? '#a00' : '#333';
    ctx.fillRect(0, -5, 15, 10);

    // Lens
    ctx.fillStyle = cam.alerted ? '#f00' : '#666';
    ctx.beginPath();
    ctx.arc(15, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Vision cone (faint)
    if (cam.alerted) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.05)';
    }
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(15 + cam.range, -40);
    ctx.lineTo(15 + cam.range, 40);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderItem(item) {
    if (item.type === 'elevator') {
        // Elevator pad
        ctx.fillStyle = '#333';
        ctx.fillRect(item.x - 24, item.y - 24, 48, 48);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(item.x - 20, item.y - 20, 40, 40);
        ctx.fillStyle = '#0a0';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LIFT', item.x, item.y + 5);
        return;
    }

    // Glowing effect
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 10;

    ctx.fillStyle = item.color;
    ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);

    ctx.shadowBlur = 0;
}

function renderDoor(door) {
    if (door.isOpen) {
        // Open door - just outline
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x + 2, door.y + 2, door.width - 4, door.height - 4);
    } else {
        // Closed door
        ctx.fillStyle = door.isLocked ? '#660000' : '#444';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Hazard stripes
        ctx.fillStyle = door.isLocked ? '#440000' : '#333';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(door.x + 4 + i * 7, door.y + 4, 4, door.height - 8);
        }

        // Lock indicator
        if (door.isLocked && !door.isHacked) {
            ctx.fillStyle = '#f00';
            ctx.fillRect(door.x + door.width/2 - 3, door.y + door.height/2 - 3, 6, 6);
        } else {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(door.x + door.width/2 - 3, door.y + door.height/2 - 3, 6, 6);
        }
    }
}

function renderTurret(turret) {
    ctx.save();
    ctx.translate(turret.x, turret.y);

    // Base
    ctx.fillStyle = turret.isHacked ? '#040' : '#400';
    ctx.fillRect(-12, -12, 24, 24);

    // Rotating barrel
    ctx.rotate(turret.angle);
    ctx.fillStyle = turret.isHacked ? '#0a0' : '#a00';
    ctx.fillRect(0, -4, 20, 8);

    ctx.restore();

    // Health bar
    const barWidth = 24;
    const barHeight = 4;
    ctx.fillStyle = '#400';
    ctx.fillRect(turret.x - barWidth/2, turret.y - 20, barWidth, barHeight);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(turret.x - barWidth/2, turret.y - 20, barWidth * (turret.hp / turret.maxHp), barHeight);
}

function renderEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, enemy.height/2 - 2, enemy.width/2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body based on type
    const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
    ctx.scale(pulse, pulse);

    if (enemy.type === 'drone') {
        // Cyborg drone - humanoid with mechanical parts
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);

        // Mechanical eye
        ctx.fillStyle = '#f00';
        ctx.fillRect(-4, -enemy.height/2 + 4, 8, 4);

        // Arm implants
        ctx.fillStyle = '#666';
        ctx.fillRect(-enemy.width/2 - 4, -4, 4, 12);
        ctx.fillRect(enemy.width/2, -4, 4, 12);

    } else if (enemy.type === 'soldier') {
        // Cyborg soldier - armored
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);

        // Armor plates
        ctx.fillStyle = '#555';
        ctx.fillRect(-enemy.width/2 + 2, -enemy.height/2, enemy.width - 4, 6);
        ctx.fillRect(-enemy.width/2 + 2, 0, enemy.width - 4, 6);

        // Visor
        ctx.fillStyle = '#f44';
        ctx.fillRect(-6, -enemy.height/2 + 6, 12, 3);

        // Gun arm
        ctx.rotate(enemy.angle);
        ctx.fillStyle = '#444';
        ctx.fillRect(10, -3, 15, 6);

    } else if (enemy.type === 'crawler') {
        // Mutant crawler - organic blob
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Multiple eyes
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.arc(0, 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Date.now() / 200;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 10);
            ctx.stroke();
        }
    }

    ctx.restore();

    // Health bar
    if (enemy.hp < enemy.maxHp) {
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 10, barWidth, barHeight);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 10, barWidth * (enemy.hp / enemy.maxHp), barHeight);
    }

    // State indicator (debug)
    if (debugMode) {
        ctx.fillStyle = enemy.state === 'patrol' ? '#0f0' : enemy.state === 'chase' ? '#ff0' : '#f00';
        ctx.fillRect(enemy.x - 3, enemy.y - enemy.height/2 - 16, 6, 3);
    }
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, player.height/2 - 2, player.width/2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dodge roll effect
    if (player.isDodging) {
        ctx.globalAlpha = 0.5;
    }

    // Body
    ctx.rotate(player.angle + Math.PI/2);

    // Suit
    ctx.fillStyle = '#556';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);

    // Helmet
    ctx.fillStyle = '#445';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#0aa';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 6, 6, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Visor reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(-2, -player.height/2 + 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Life support backpack
    ctx.fillStyle = '#334';
    ctx.fillRect(-8, player.height/2 - 12, 16, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(-5, player.height/2 - 10, 3, 3);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(2, player.height/2 - 10, 3, 3);

    // Weapon
    const weapon = player.weapons[player.currentWeapon];
    ctx.rotate(-Math.PI/2); // Reset rotation for weapon

    if (weapon.type === 'melee') {
        // Wrench
        ctx.fillStyle = '#666';
        ctx.fillRect(10, -2, 20, 4);
        ctx.fillRect(26, -5, 6, 10);
    } else {
        // Pistol
        ctx.fillStyle = '#333';
        ctx.fillRect(10, -3, 18, 6);
        ctx.fillStyle = '#444';
        ctx.fillRect(8, 0, 8, 8);
    }

    ctx.restore();

    // Flashlight cone visualization (subtle)
    if (player.flashlightOn) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 50, -VISION_ANGLE/4, VISION_ANGLE/4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

function renderBullet(bullet) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    const angle = Math.atan2(bullet.vy, bullet.vx);
    ctx.rotate(angle);

    if (bullet.isPlayer) {
        // Player bullet - laser tracer
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;

        const gradient = ctx.createLinearGradient(-15, 0, 5, 0);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, '#fff');
        ctx.fillStyle = gradient;
        ctx.fillRect(-15, -2, 20, 4);

        ctx.shadowBlur = 0;
    } else {
        // Enemy bullet - red tracer
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 6;

        ctx.fillStyle = '#f44';
        ctx.fillRect(-10, -2, 14, 4);

        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function renderMap() {
    const deck = decks[currentDeck];
    const scale = 10;
    const offsetX = (VIEW_WIDTH - deck.width * scale) / 2 + camera.x;
    const offsetY = (VIEW_HEIGHT - deck.height * scale) / 2 + camera.y;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT);

    // Title
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAP - DECK ' + (currentDeck + 1) + ': ' + deck.name.toUpperCase(), camera.x + VIEW_WIDTH/2, camera.y + 40);

    // Tiles
    for (let y = 0; y < deck.height; y++) {
        for (let x = 0; x < deck.width; x++) {
            const tile = deck.tiles[y][x];
            if (tile.explored) {
                ctx.fillStyle = tile.type === 'floor' ? '#334' : '#111';
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    }

    // Rooms
    deck.rooms.forEach(room => {
        if (deck.tiles[room.y][room.x].explored) {
            ctx.strokeStyle = '#446';
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX + room.x * scale, offsetY + room.y * scale, room.width * scale, room.height * scale);
        }
    });

    // Items
    items.forEach(item => {
        const tx = Math.floor(item.x / TILE_SIZE);
        const ty = Math.floor(item.y / TILE_SIZE);
        if (deck.tiles[ty] && deck.tiles[ty][tx] && deck.tiles[ty][tx].explored) {
            ctx.fillStyle = item.type === 'elevator' ? '#0f0' : '#ff0';
            ctx.fillRect(offsetX + tx * scale + 2, offsetY + ty * scale + 2, scale - 4, scale - 4);
        }
    });

    // Player
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(offsetX + px * scale + scale/2, offsetY + py * scale + scale/2, scale/2, 0, Math.PI * 2);
    ctx.fill();

    // Legend
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0ff';
    ctx.fillText('You', camera.x + 20, camera.y + VIEW_HEIGHT - 60);
    ctx.fillStyle = '#0f0';
    ctx.fillText('Elevator', camera.x + 20, camera.y + VIEW_HEIGHT - 40);
    ctx.fillStyle = '#ff0';
    ctx.fillText('Items', camera.x + 20, camera.y + VIEW_HEIGHT - 20);

    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press M or ESC to close', camera.x + VIEW_WIDTH/2, camera.y + VIEW_HEIGHT - 20);
}

function renderInventoryScreen() {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT);

    // Title
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', camera.x + VIEW_WIDTH/2, camera.y + 50);

    // Player stats
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const statsX = camera.x + 100;
    const statsY = camera.y + 100;

    ctx.fillStyle = '#f44';
    ctx.fillText('Health: ' + Math.floor(player.health) + '/' + player.maxHealth, statsX, statsY);
    ctx.fillStyle = '#0ff';
    ctx.fillText('Energy: ' + Math.floor(player.energy) + '/' + player.maxEnergy, statsX, statsY + 20);
    ctx.fillStyle = '#88f';
    ctx.fillText('Armor: ' + player.armor, statsX, statsY + 40);
    ctx.fillStyle = '#888';
    ctx.fillText('Scrap: ' + player.scrap, statsX, statsY + 60);

    // Ammo
    ctx.fillStyle = '#ff0';
    ctx.fillText('Bullets: ' + player.ammo.bullets, statsX, statsY + 100);
    ctx.fillText('Shells: ' + player.ammo.shells, statsX, statsY + 120);
    ctx.fillText('Energy Cells: ' + player.ammo.energyCells, statsX, statsY + 140);

    // Weapons
    ctx.fillStyle = '#0f0';
    ctx.fillText('WEAPONS:', statsX, statsY + 180);
    player.weapons.forEach((w, i) => {
        const selected = i === player.currentWeapon ? '> ' : '  ';
        ctx.fillStyle = i === player.currentWeapon ? '#0f0' : '#666';
        ctx.fillText(selected + (i + 1) + '. ' + w.name, statsX, statsY + 200 + i * 20);
    });

    // Audio logs
    if (audioLogs.length > 0) {
        ctx.fillStyle = '#f0f';
        ctx.fillText('AUDIO LOGS: ' + audioLogs.length, statsX + 300, statsY);
        audioLogs.forEach((log, i) => {
            ctx.fillStyle = '#888';
            ctx.fillText((i + 1) + '. ' + log.text.substring(0, 40) + '...', statsX + 300, statsY + 20 + i * 20);
        });
    }

    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB or ESC to close', camera.x + VIEW_WIDTH/2, camera.y + VIEW_HEIGHT - 30);
}

function renderHackingScreen() {
    // Overlay
    ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
    ctx.fillRect(camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT);

    // Title
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HACKING INTERFACE', camera.x + VIEW_WIDTH/2, camera.y + 40);

    // Timer
    ctx.fillStyle = hackingTimer < 5 ? '#f44' : '#0ff';
    ctx.fillText('Time: ' + hackingTimer.toFixed(1) + 's', camera.x + VIEW_WIDTH/2, camera.y + 70);

    // Grid
    const gridSize = 50;
    const gridOffsetX = camera.x + VIEW_WIDTH/2 - 3 * gridSize;
    const gridOffsetY = camera.y + VIEW_HEIGHT/2 - 3 * gridSize;

    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
            const cell = hackingGrid[y][x];
            const px = gridOffsetX + x * gridSize;
            const py = gridOffsetY + y * gridSize;

            // Cell background
            let color = '#112';
            if (cell.type === 'blocked') color = '#400';
            if (cell.type === 'source') color = '#040';
            if (cell.type === 'target') color = '#044';
            if (cell.type === 'trap') color = '#440';

            ctx.fillStyle = color;
            ctx.fillRect(px + 2, py + 2, gridSize - 4, gridSize - 4);

            // Path highlight
            if (hackingPath.some(p => p.x === x && p.y === y)) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.fillRect(px + 2, py + 2, gridSize - 4, gridSize - 4);
            }

            // Cell content
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            if (cell.type === 'source') ctx.fillText('S', px + gridSize/2, py + gridSize/2 + 6);
            if (cell.type === 'target') ctx.fillText('T', px + gridSize/2, py + gridSize/2 + 6);
            if (cell.type === 'blocked') ctx.fillText('X', px + gridSize/2, py + gridSize/2 + 6);
            if (cell.type === 'trap') ctx.fillText('!', px + gridSize/2, py + gridSize/2 + 6);

            // Cursor
            if (hackingCursor.x === x && hackingCursor.y === y) {
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 3;
                ctx.strokeRect(px + 4, py + 4, gridSize - 8, gridSize - 8);
            }
        }
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD to move | Connect S to T | Backspace to undo | ESC to abort', camera.x + VIEW_WIDTH/2, camera.y + VIEW_HEIGHT - 40);

    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f0';
    ctx.fillText('[S] Source', gridOffsetX, gridOffsetY + 6 * gridSize + 30);
    ctx.fillStyle = '#0ff';
    ctx.fillText('[T] Target', gridOffsetX + 100, gridOffsetY + 6 * gridSize + 30);
    ctx.fillStyle = '#f44';
    ctx.fillText('[X] Blocked', gridOffsetX + 200, gridOffsetY + 6 * gridSize + 30);
    ctx.fillStyle = '#ff0';
    ctx.fillText('[!] Trap', gridOffsetX + 300, gridOffsetY + 6 * gridSize + 30);
}

function renderHUD() {
    // Left side - Inventory list (like reference)
    renderInventoryList();

    // Bottom - Ammo/Health/Armor
    renderBottomHUD();

    // M.A.R.I.A. message
    if (currentMariaMessage) {
        renderMariaMessage();
    }

    // Interaction prompt
    renderInteractionPrompt();

    // Debug overlay
    if (debugMode) {
        renderDebugOverlay();
    }
}

function renderInventoryList() {
    const x = 10;
    let y = 30;

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    // Weapons (white)
    player.weapons.forEach((w, i) => {
        const selected = i === player.currentWeapon;
        if (selected) {
            ctx.fillStyle = '#000';
            ctx.fillRect(x - 2, y - 12, 100, 16);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x - 2, y - 12, 100, 16);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(w.name.toLowerCase(), x, y);
        y += 18;
    });

    y += 10;

    // Ammo (red/yellow)
    if (player.ammo.bullets > 0) {
        ctx.fillStyle = '#f44';
        ctx.fillText('bullets ' + player.ammo.bullets + 'x', x, y);
        y += 15;
    }
    if (player.ammo.shells > 0) {
        ctx.fillStyle = '#f44';
        ctx.fillText('shells ' + player.ammo.shells + 'x', x, y);
        y += 15;
    }

    y += 5;

    // Items (cyan/green)
    ctx.fillStyle = '#0ff';
    ctx.fillText('energycell', x, y);
    y += 15;

    if (player.scrap > 0) {
        ctx.fillStyle = '#888';
        ctx.fillText('scrap ' + player.scrap + 'x', x, y);
        y += 15;
    }
}

function renderBottomHUD() {
    const weapon = player.weapons[player.currentWeapon];

    // Bottom left - ammo
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';

    if (weapon.type === 'ranged') {
        const reserve = player.ammo[weapon.ammoType] || 0;
        ctx.fillText('ammo  =' + weapon.magazine + '/' + reserve, 10, VIEW_HEIGHT - 60);
    }

    // Health
    ctx.fillText('health=' + Math.floor(player.health) + '/' + player.maxHealth, 10, VIEW_HEIGHT - 40);

    // Armor (if any)
    if (player.armor > 0) {
        ctx.fillText('armor =' + player.armor + '/' + player.maxArmor, 10, VIEW_HEIGHT - 20);
    }

    // Weapon description
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    const desc = weapon.type === 'melee' ? 'Standard maintenance tool.' : '9mm semi-automatic pistol.';
    ctx.fillText(desc, 10, VIEW_HEIGHT - 5);

    // Reloading indicator
    if (weapon.reloading) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('RELOADING...', VIEW_WIDTH/2 - 50, VIEW_HEIGHT - 40);
    }
}

function renderMariaMessage() {
    const alpha = Math.min(1, mariaMessageTimer / 1000);
    ctx.globalAlpha = alpha;

    // Red scanline effect
    ctx.fillStyle = 'rgba(100, 0, 0, 0.3)';
    ctx.fillRect(0, 50, VIEW_WIDTH, 60);

    // Message
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M.A.R.I.A.: "' + currentMariaMessage + '"', VIEW_WIDTH/2, 85);

    ctx.globalAlpha = 1;
}

function renderInteractionPrompt() {
    // Check for nearby interactables
    let prompt = null;

    items.forEach(item => {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (Math.sqrt(dx*dx + dy*dy) < 50) {
            if (item.type === 'elevator') {
                prompt = currentDeck === 0 ? '[E] Use Elevator' : '[E] Escape!';
            } else {
                prompt = '[E] Pick up ' + item.name;
            }
        }
    });

    doors.forEach(door => {
        const dx = player.x - (door.x + door.width/2);
        const dy = player.y - (door.y + door.height/2);
        if (Math.sqrt(dx*dx + dy*dy) < 50) {
            if (door.isLocked && !door.isHacked) {
                prompt = '[E] Hack Door';
            } else {
                prompt = '[E] ' + (door.isOpen ? 'Close' : 'Open') + ' Door';
            }
        }
    });

    turrets.forEach(turret => {
        const dx = player.x - turret.x;
        const dy = player.y - turret.y;
        if (Math.sqrt(dx*dx + dy*dy) < 50 && !turret.isHacked) {
            prompt = '[E] Hack Turret';
        }
    });

    if (prompt) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(prompt, VIEW_WIDTH - 20, VIEW_HEIGHT - 20);
    }
}

function renderDebugOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(VIEW_WIDTH - 200, 10, 190, 180);

    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG MODE (Q)',
        '-------------',
        'Pos: ' + Math.floor(player.x) + ', ' + Math.floor(player.y),
        'Health: ' + Math.floor(player.health) + '/' + player.maxHealth,
        'Energy: ' + Math.floor(player.energy) + '/' + player.maxEnergy,
        'Armor: ' + player.armor,
        'Enemies: ' + enemies.length,
        'Deck: ' + (currentDeck + 1) + ' - ' + decks[currentDeck].name,
        'State: ' + gameState,
        'Flashlight: ' + (player.flashlightOn ? 'ON' : 'OFF'),
        'FPS: ' + Math.round(1 / deltaTime)
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, VIEW_WIDTH - 190, 25 + i * 15);
    });
}

// Make functions available globally
window.startGame = startGame;
window.restartGame = restartGame;

// Start the game
init();
