// Frostfall - A 2D Skyrim Demake
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 640;
const HEIGHT = 360;

// Colors
const COLORS = {
    bg: '#1a1a2e',
    grass: '#2d4a2d',
    grassDark: '#1f3a1f',
    dirt: '#5a4a3a',
    stone: '#4a4a5a',
    stoneDark: '#3a3a4a',
    snow: '#d8e8f0',
    snowDark: '#b8c8d0',
    water: '#2a4a6a',
    tree: '#1a3a1a',
    treeTrunk: '#4a3a2a',
    wall: '#3a3a4a',
    floor: '#5a5a6a',
    wood: '#6a5040',
    woodDark: '#4a3020',
    ui: '#2a2a3e',
    uiBorder: '#5a5a7e',
    health: '#cc3333',
    stamina: '#33aa33',
    magicka: '#3366cc',
    gold: '#ddaa33',
    text: '#e0e0e0',
    textDim: '#8888aa',
    enemy: '#aa4444',
    npc: '#44aa44',
    player: '#6688cc'
};

// Game constants
const TILE_SIZE = 16;
const WORLD_SIZE = 100; // tiles per side
const VIEW_TILES_X = Math.ceil(WIDTH / TILE_SIZE);
const VIEW_TILES_Y = Math.ceil(HEIGHT / TILE_SIZE);

// Game state
let gameState = 'menu'; // menu, playing, inventory, dialogue, paused, gameover, victory
let showDebug = false;

// World data
let world = [];
let entities = [];
let npcs = [];
let items = [];
let projectiles = [];
let particles = [];
let dungeons = [];

// Player
const player = {
    x: WORLD_SIZE * TILE_SIZE / 2,
    y: WORLD_SIZE * TILE_SIZE / 2,
    vx: 0,
    vy: 0,
    width: 12,
    height: 16,
    speed: 80,
    sprintSpeed: 140,
    facing: 'down',
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    magicka: 50,
    maxMagicka: 50,
    gold: 50,
    level: 1,
    xp: 0,
    xpToLevel: 100,
    combatSkill: 1,
    perkPoints: 0,
    perks: [],

    // Equipment
    weapon: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24, type: 'sword' },
    armor: { name: 'Leather Armor', defense: 15, slot: 'body' },
    helmet: null,
    ring: null,

    // State
    attacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    dodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    blocking: false,
    sprinting: false,
    invulnerable: false,
    invulnerableTimer: 0,
    inDungeon: false,
    currentDungeon: null,

    // Inventory
    inventory: [],
    maxInventory: 24
};

// Camera
const camera = {
    x: 0,
    y: 0
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false };

// Quests
const quests = {
    active: [],
    completed: [],
    available: [
        {
            id: 'clear_mine',
            name: 'Trouble in the Mine',
            description: 'Clear Embershard Mine of bandits',
            giver: 'Alvor',
            objective: 'Kill the Bandit Chief',
            target: 'dungeon_forest',
            reward: { gold: 75, xp: 50 },
            type: 'dungeon'
        },
        {
            id: 'clear_barrow',
            name: 'The Ancient Barrow',
            description: 'Explore Bleak Falls Barrow',
            giver: 'Farengar',
            objective: 'Defeat the Draugr Wight',
            target: 'dungeon_snow',
            reward: { gold: 150, xp: 100 },
            type: 'dungeon'
        },
        {
            id: 'slay_giant',
            name: "Giant's Problem",
            description: 'A giant threatens the mountain pass',
            giver: 'Guard Captain',
            objective: 'Defeat the Giant',
            target: 'dungeon_mountain',
            reward: { gold: 250, xp: 150 },
            type: 'dungeon'
        }
    ]
};

// Dialogue
let currentDialogue = null;
let dialogueIndex = 0;

// Enemy definitions
const ENEMY_TYPES = {
    wolf: { name: 'Wolf', hp: 25, damage: 6, speed: 70, color: '#666655', size: 12, xp: 15, loot: 'pelt' },
    bandit: { name: 'Bandit', hp: 40, damage: 8, speed: 50, color: '#886644', size: 14, xp: 25, loot: 'gold' },
    banditChief: { name: 'Bandit Chief', hp: 80, damage: 15, speed: 45, color: '#aa6644', size: 18, xp: 75, loot: 'weapon', boss: true },
    frostWolf: { name: 'Frost Wolf', hp: 35, damage: 8, speed: 75, color: '#8899aa', size: 14, xp: 25, loot: 'pelt' },
    draugr: { name: 'Draugr', hp: 50, damage: 10, speed: 40, color: '#557788', size: 16, xp: 35, loot: 'gold' },
    draugrWight: { name: 'Draugr Wight', hp: 100, damage: 18, speed: 35, color: '#4488aa', size: 20, xp: 100, loot: 'enchanted', boss: true },
    bear: { name: 'Bear', hp: 60, damage: 12, speed: 55, color: '#554433', size: 20, xp: 40, loot: 'pelt' },
    troll: { name: 'Troll', hp: 80, damage: 15, speed: 45, color: '#445544', size: 22, xp: 60, loot: 'fat' },
    giant: { name: 'Giant', hp: 150, damage: 25, speed: 30, color: '#887766', size: 32, xp: 150, loot: 'toe', boss: true }
};

// Initialize game
function init() {
    generateWorld();
    spawnNPCs();
    createDungeons();
    setupInput();
    gameLoop();
}

// World generation
function generateWorld() {
    world = [];

    for (let y = 0; y < WORLD_SIZE; y++) {
        world[y] = [];
        for (let x = 0; x < WORLD_SIZE; x++) {
            // Base terrain based on position
            const distFromCenter = Math.sqrt(Math.pow(x - WORLD_SIZE/2, 2) + Math.pow(y - WORLD_SIZE/2, 2));
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.3;

            let tile = { type: 'grass', walkable: true, biome: 'forest' };

            // Village in center
            if (distFromCenter < 12) {
                if (Math.random() < 0.3) {
                    tile = { type: 'dirt', walkable: true, biome: 'village' };
                } else {
                    tile = { type: 'grass', walkable: true, biome: 'village' };
                }
            }
            // Forest biome (south)
            else if (y > WORLD_SIZE * 0.6) {
                if (Math.random() < 0.15) {
                    tile = { type: 'tree', walkable: false, biome: 'forest' };
                } else {
                    tile = { type: Math.random() < 0.7 ? 'grass' : 'dirt', walkable: true, biome: 'forest' };
                }
            }
            // Snow biome (north)
            else if (y < WORLD_SIZE * 0.35) {
                if (Math.random() < 0.08) {
                    tile = { type: 'tree', walkable: false, biome: 'snow' };
                } else {
                    tile = { type: Math.random() < 0.8 ? 'snow' : 'stone', walkable: true, biome: 'snow' };
                }
            }
            // Mountain biome (east)
            else if (x > WORLD_SIZE * 0.65) {
                if (Math.random() < 0.2) {
                    tile = { type: 'stone', walkable: false, biome: 'mountain' };
                } else {
                    tile = { type: Math.random() < 0.6 ? 'stone' : 'grass', walkable: true, biome: 'mountain' };
                }
            }
            // Plains (west and center)
            else {
                if (Math.random() < 0.1) {
                    tile = { type: 'tree', walkable: false, biome: 'plains' };
                } else {
                    tile = { type: Math.random() < 0.85 ? 'grass' : 'dirt', walkable: true, biome: 'plains' };
                }
            }

            // Roads connecting areas
            const roadX = Math.abs(x - WORLD_SIZE/2) < 2;
            const roadY = Math.abs(y - WORLD_SIZE/2) < 2;
            if (roadX || roadY) {
                tile = { type: 'dirt', walkable: true, biome: tile.biome };
            }

            world[y][x] = tile;
        }
    }

    // Add buildings in village
    addBuilding(WORLD_SIZE/2 - 5, WORLD_SIZE/2 - 5, 4, 3, 'smithy');
    addBuilding(WORLD_SIZE/2 + 2, WORLD_SIZE/2 - 4, 3, 3, 'shop');
    addBuilding(WORLD_SIZE/2 - 3, WORLD_SIZE/2 + 3, 4, 3, 'inn');
}

function addBuilding(bx, by, w, h, type) {
    for (let y = by; y < by + h; y++) {
        for (let x = bx; x < bx + w; x++) {
            if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
                world[y][x] = { type: 'building', walkable: false, biome: 'village', buildingType: type };
            }
        }
    }
    // Door
    if (by + h < WORLD_SIZE) {
        world[by + h - 1][bx + Math.floor(w/2)] = { type: 'door', walkable: true, biome: 'village', buildingType: type };
    }
}

function spawnNPCs() {
    npcs = [];

    // Blacksmith
    npcs.push({
        x: (WORLD_SIZE/2 - 4) * TILE_SIZE,
        y: (WORLD_SIZE/2 - 3) * TILE_SIZE,
        name: 'Alvor',
        type: 'blacksmith',
        dialogue: [
            { text: "Welcome to my forge, friend.", options: [] },
            { text: "I've heard bandits took over the old mine east of here.", options: ['Tell me more', 'I can help'] },
            { text: "Clear them out and I'll reward you well.", options: ['Accept Quest'] }
        ],
        shop: [
            { name: 'Iron Sword', type: 'weapon', damage: 8, price: 50 },
            { name: 'Steel Sword', type: 'weapon', damage: 12, price: 120 },
            { name: 'Iron Armor', type: 'armor', defense: 30, price: 100 },
            { name: 'Steel Armor', type: 'armor', defense: 45, price: 200 }
        ],
        quest: 'clear_mine'
    });

    // General store
    npcs.push({
        x: (WORLD_SIZE/2 + 3) * TILE_SIZE,
        y: (WORLD_SIZE/2 - 2) * TILE_SIZE,
        name: 'Lucan',
        type: 'merchant',
        dialogue: [
            { text: "Welcome to Riverwood Trader!", options: [] },
            { text: "Looking for supplies? I have potions and goods.", options: ['Trade', 'Goodbye'] }
        ],
        shop: [
            { name: 'Health Potion', type: 'potion', effect: 'heal', value: 50, price: 30 },
            { name: 'Stamina Potion', type: 'potion', effect: 'stamina', value: 50, price: 20 },
            { name: 'Torch', type: 'misc', price: 10 }
        ]
    });

    // Quest giver
    npcs.push({
        x: (WORLD_SIZE/2 - 1) * TILE_SIZE,
        y: (WORLD_SIZE/2 + 4) * TILE_SIZE,
        name: 'Farengar',
        type: 'wizard',
        dialogue: [
            { text: "Ah, an adventurer! I study ancient Nordic ruins.", options: [] },
            { text: "Bleak Falls Barrow to the north holds ancient secrets.", options: ['Tell me more', 'Not interested'] },
            { text: "Retrieve what you find and I'll pay handsomely.", options: ['Accept Quest'] }
        ],
        quest: 'clear_barrow'
    });

    // Guard
    npcs.push({
        x: (WORLD_SIZE/2 + 5) * TILE_SIZE,
        y: (WORLD_SIZE/2) * TILE_SIZE,
        name: 'Guard Captain',
        type: 'guard',
        dialogue: [
            { text: "Halt! Oh, you're the adventurer.", options: [] },
            { text: "A giant has been spotted in the mountains to the east.", options: ['I\'ll handle it'] },
            { text: "Be careful. Giants are deadly.", options: ['Accept Quest'] }
        ],
        quest: 'slay_giant'
    });
}

function createDungeons() {
    dungeons = [];

    // Forest dungeon (Embershard Mine)
    dungeons.push({
        id: 'dungeon_forest',
        name: 'Embershard Mine',
        worldX: WORLD_SIZE * 0.7,
        worldY: WORLD_SIZE * 0.75,
        biome: 'forest',
        rooms: generateDungeonRooms(6, 'mine'),
        enemies: ['bandit', 'bandit', 'bandit', 'bandit', 'banditChief'],
        boss: 'banditChief',
        cleared: false
    });

    // Snow dungeon (Bleak Falls Barrow)
    dungeons.push({
        id: 'dungeon_snow',
        name: 'Bleak Falls Barrow',
        worldX: WORLD_SIZE * 0.4,
        worldY: WORLD_SIZE * 0.2,
        biome: 'snow',
        rooms: generateDungeonRooms(8, 'tomb'),
        enemies: ['draugr', 'draugr', 'draugr', 'frostWolf', 'draugrWight'],
        boss: 'draugrWight',
        cleared: false
    });

    // Mountain dungeon (Giant's Camp)
    dungeons.push({
        id: 'dungeon_mountain',
        name: "Giant's Camp",
        worldX: WORLD_SIZE * 0.85,
        worldY: WORLD_SIZE * 0.45,
        biome: 'mountain',
        rooms: generateDungeonRooms(5, 'cave'),
        enemies: ['bear', 'troll', 'troll', 'giant'],
        boss: 'giant',
        cleared: false
    });

    // Mark dungeon entrances on world
    dungeons.forEach(d => {
        const tx = Math.floor(d.worldX);
        const ty = Math.floor(d.worldY);
        if (world[ty] && world[ty][tx]) {
            world[ty][tx] = { type: 'dungeon_entrance', walkable: true, biome: d.biome, dungeonId: d.id };
        }
    });
}

function generateDungeonRooms(count, type) {
    const rooms = [];
    let currentX = 0;

    for (let i = 0; i < count; i++) {
        const w = 15 + Math.floor(Math.random() * 10);
        const h = 10 + Math.floor(Math.random() * 6);
        const room = {
            x: currentX,
            y: 0,
            width: w,
            height: h,
            type: i === count - 1 ? 'boss' : (Math.random() < 0.3 ? 'treasure' : 'combat'),
            tiles: [],
            cleared: false
        };

        // Generate tiles
        for (let ry = 0; ry < h; ry++) {
            room.tiles[ry] = [];
            for (let rx = 0; rx < w; rx++) {
                const isWall = rx === 0 || rx === w - 1 || ry === 0 || ry === h - 1;
                const isDoor = (rx === w - 1 && ry === Math.floor(h/2) && i < count - 1) ||
                              (rx === 0 && ry === Math.floor(h/2) && i > 0);
                room.tiles[ry][rx] = {
                    type: isDoor ? 'door' : (isWall ? 'wall' : 'floor'),
                    walkable: !isWall || isDoor
                };
            }
        }

        rooms.push(room);
        currentX += w;
    }

    return rooms;
}

// Spawn enemies in world
function spawnWorldEnemies() {
    entities = entities.filter(e => e.type === 'boss' || e.inDungeon);

    const biomeEnemies = {
        forest: ['wolf', 'bandit'],
        snow: ['frostWolf', 'draugr'],
        mountain: ['bear', 'troll'],
        plains: ['wolf']
    };

    // Spawn enemies in each biome
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * WORLD_SIZE;
        const y = Math.random() * WORLD_SIZE;
        const tile = world[Math.floor(y)] && world[Math.floor(y)][Math.floor(x)];

        if (tile && tile.walkable && tile.biome !== 'village') {
            const enemyTypes = biomeEnemies[tile.biome] || ['wolf'];
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            spawnEnemy(x * TILE_SIZE, y * TILE_SIZE, type, false);
        }
    }
}

function spawnEnemy(x, y, type, inDungeon = false, isBoss = false) {
    const def = ENEMY_TYPES[type];
    entities.push({
        x, y,
        vx: 0, vy: 0,
        type: type,
        name: def.name,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        speed: def.speed,
        color: def.color,
        size: def.size,
        xp: def.xp,
        loot: def.loot,
        isBoss: isBoss || def.boss,
        inDungeon,
        state: 'idle',
        attackCooldown: 0,
        target: null,
        homeX: x,
        homeY: y
    });
}

// Input handling
function setupInput() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key === 'q' || e.key === 'Q') {
            showDebug = !showDebug;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            if (gameState === 'playing') gameState = 'inventory';
            else if (gameState === 'inventory') gameState = 'playing';
        }
        if (e.key === 'Escape') {
            if (gameState === 'dialogue') {
                gameState = 'playing';
                currentDialogue = null;
            } else if (gameState === 'inventory') {
                gameState = 'playing';
            } else if (gameState === 'playing') {
                gameState = 'paused';
            } else if (gameState === 'paused') {
                gameState = 'playing';
            }
        }
        if (e.key === 'e' || e.key === 'E') {
            if (gameState === 'playing') {
                interact();
            } else if (gameState === 'dialogue') {
                advanceDialogue();
            }
        }
        if (e.key >= '1' && e.key <= '3') {
            useQuickSlot(parseInt(e.key) - 1);
        }
        if (e.key === ' ' && gameState === 'menu') {
            startGame();
        }
        if (e.key === 'r' && (gameState === 'gameover' || gameState === 'victory')) {
            restartGame();
        }
    });

    window.addEventListener('keyup', e => {
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

        if (gameState === 'menu') {
            startGame();
        }
    });

    canvas.addEventListener('mouseup', e => {
        if (e.button === 0) mouse.down = false;
        if (e.button === 2) mouse.rightDown = false;
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function startGame() {
    gameState = 'playing';
    player.x = WORLD_SIZE * TILE_SIZE / 2;
    player.y = WORLD_SIZE * TILE_SIZE / 2;
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    spawnWorldEnemies();
}

function restartGame() {
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    player.magicka = player.maxMagicka;
    player.gold = 50;
    player.level = 1;
    player.xp = 0;
    player.inDungeon = false;
    player.currentDungeon = null;
    quests.active = [];
    quests.completed = [];
    dungeons.forEach(d => {
        d.cleared = false;
        d.rooms.forEach(r => r.cleared = false);
    });
    entities = [];
    generateWorld();
    spawnNPCs();
    createDungeons();
    startGame();
}

function interact() {
    // Check for NPCs
    for (const npc of npcs) {
        const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (dist < 40) {
            currentDialogue = { npc, index: 0 };
            gameState = 'dialogue';
            return;
        }
    }

    // Check for dungeon entrance
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    const tile = world[tileY] && world[tileY][tileX];

    if (tile && tile.type === 'dungeon_entrance') {
        enterDungeon(tile.dungeonId);
    }

    // Check for dungeon exit
    if (player.inDungeon && player.x < 20) {
        exitDungeon();
    }
}

function advanceDialogue() {
    if (!currentDialogue) return;

    currentDialogue.index++;

    if (currentDialogue.index >= currentDialogue.npc.dialogue.length) {
        // End of dialogue - check for quest
        if (currentDialogue.npc.quest) {
            const quest = quests.available.find(q => q.id === currentDialogue.npc.quest);
            if (quest && !quests.active.includes(quest) && !quests.completed.includes(quest)) {
                quests.active.push(quest);
                addMessage(`New Quest: ${quest.name}`);
            }
        }

        gameState = 'playing';
        currentDialogue = null;
    }
}

function enterDungeon(dungeonId) {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (!dungeon) return;

    player.inDungeon = true;
    player.currentDungeon = dungeon;
    player.x = 32;
    player.y = dungeon.rooms[0].height * TILE_SIZE / 2;

    // Spawn dungeon enemies
    entities = [];
    let roomIndex = 0;
    let enemyIndex = 0;

    dungeon.rooms.forEach((room, ri) => {
        if (!room.cleared && dungeon.enemies[enemyIndex]) {
            const count = ri === dungeon.rooms.length - 1 ? 1 : 2;
            for (let i = 0; i < count && enemyIndex < dungeon.enemies.length; i++) {
                const ex = (room.x + room.width/2 + Math.random() * 4 - 2) * TILE_SIZE;
                const ey = (room.height/2 + Math.random() * 2 - 1) * TILE_SIZE;
                const isBoss = ri === dungeon.rooms.length - 1;
                spawnEnemy(ex, ey, dungeon.enemies[enemyIndex], true, isBoss);
                if (!isBoss) enemyIndex++;
            }
            if (ri === dungeon.rooms.length - 1) enemyIndex++;
        }
    });

    addMessage(`Entered ${dungeon.name}`);
}

function exitDungeon() {
    if (!player.currentDungeon) return;

    const dungeon = player.currentDungeon;
    player.inDungeon = false;
    player.x = dungeon.worldX * TILE_SIZE + TILE_SIZE;
    player.y = dungeon.worldY * TILE_SIZE;
    player.currentDungeon = null;
    entities = [];
    spawnWorldEnemies();

    addMessage('Exited dungeon');
}

function useQuickSlot(slot) {
    const potions = player.inventory.filter(i => i.type === 'potion');
    if (potions[slot]) {
        if (potions[slot].effect === 'heal') {
            player.hp = Math.min(player.maxHp, player.hp + potions[slot].value);
            addMessage(`Used ${potions[slot].name}`);
        } else if (potions[slot].effect === 'stamina') {
            player.stamina = Math.min(player.maxStamina, player.stamina + potions[slot].value);
            addMessage(`Used ${potions[slot].name}`);
        }
        player.inventory = player.inventory.filter(i => i !== potions[slot]);
    }
}

// Messages
let messages = [];
function addMessage(text) {
    messages.push({ text, time: 180 });
    if (messages.length > 5) messages.shift();
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime = 0) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateEntities(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateCamera();

    // Update messages
    messages = messages.filter(m => {
        m.time--;
        return m.time > 0;
    });

    // Check win condition
    const allDungeonsCleared = dungeons.every(d => d.cleared);
    if (allDungeonsCleared) {
        gameState = 'victory';
    }

    // Check death
    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Update facing
    if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) > Math.abs(dy)) {
            player.facing = dx > 0 ? 'right' : 'left';
        } else {
            player.facing = dy > 0 ? 'down' : 'up';
        }
    }

    // Sprint
    player.sprinting = keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0);
    const speed = player.sprinting ? player.sprintSpeed : player.speed;

    if (player.sprinting) {
        player.stamina = Math.max(0, player.stamina - 5 * dt);
    } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * dt);
    }

    // Dodge roll
    if (keys['shift'] && !player.dodging && player.dodgeCooldown <= 0 && player.stamina >= 20 && (dx !== 0 || dy !== 0)) {
        if (keys[' ']) {
            player.dodging = true;
            player.dodgeTimer = 0.3;
            player.dodgeCooldown = 0.5;
            player.stamina -= 20;
            player.invulnerable = true;
            player.invulnerableTimer = 0.3;
        }
    }

    if (player.dodging) {
        player.dodgeTimer -= dt;
        if (player.dodgeTimer <= 0) {
            player.dodging = false;
        }
    }

    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);

    // Apply movement
    const moveSpeed = player.dodging ? 200 : speed;
    const newX = player.x + dx * moveSpeed * dt;
    const newY = player.y + dy * moveSpeed * dt;

    // Collision check
    if (canMoveTo(newX, player.y)) player.x = newX;
    if (canMoveTo(player.x, newY)) player.y = newY;

    // Attack
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);

    if (mouse.down && !player.attacking && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackTimer = player.weapon.speed;
        player.stamina = Math.max(0, player.stamina - 10);

        // Deal damage to enemies
        for (const enemy of entities) {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < player.weapon.range + enemy.size) {
                const damage = calculateDamage(player.weapon.damage);
                enemy.hp -= damage;
                spawnDamageNumber(enemy.x, enemy.y - 10, damage);

                // Knockback
                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.x += Math.cos(angle) * 15;
                enemy.y += Math.sin(angle) * 15;

                // Screen shake
                camera.shakeTimer = 0.1;
                camera.shakeIntensity = 3;
            }
        }
    }

    if (player.attacking) {
        player.attackTimer -= dt;
        if (player.attackTimer <= 0) {
            player.attacking = false;
            player.attackCooldown = 0.2;
        }
    }

    // Block
    player.blocking = mouse.rightDown && !player.attacking;

    // Invulnerability
    if (player.invulnerable) {
        player.invulnerableTimer -= dt;
        if (player.invulnerableTimer <= 0) {
            player.invulnerable = false;
        }
    }
}

function canMoveTo(x, y) {
    if (player.inDungeon) {
        return canMoveInDungeon(x, y);
    }

    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Check bounds
    if (tileX < 0 || tileX >= WORLD_SIZE || tileY < 0 || tileY >= WORLD_SIZE) {
        return false;
    }

    const tile = world[tileY][tileX];
    return tile && tile.walkable;
}

function canMoveInDungeon(x, y) {
    if (!player.currentDungeon) return false;

    const dungeon = player.currentDungeon;
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Find which room we're in
    let currentRoom = null;
    for (const room of dungeon.rooms) {
        if (tileX >= room.x && tileX < room.x + room.width) {
            currentRoom = room;
            break;
        }
    }

    if (!currentRoom) return false;

    const localX = tileX - currentRoom.x;
    const localY = tileY;

    if (localX < 0 || localX >= currentRoom.width || localY < 0 || localY >= currentRoom.height) {
        return false;
    }

    const tile = currentRoom.tiles[localY] && currentRoom.tiles[localY][localX];
    return tile && tile.walkable;
}

function calculateDamage(baseDamage) {
    const skillMult = 1.0 + (player.combatSkill * 0.05);
    let damage = Math.floor(baseDamage * skillMult);

    // Perks
    if (player.perks.includes('armsman')) damage *= 1.25;

    // Crit chance
    if (Math.random() < 0.1) {
        damage *= 2;
    }

    return Math.floor(damage);
}

function updateEntities(dt) {
    for (let i = entities.length - 1; i >= 0; i--) {
        const enemy = entities[i];

        // AI
        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const detectionRange = enemy.isBoss ? 300 : 150;

        if (enemy.state === 'idle') {
            if (distToPlayer < detectionRange) {
                enemy.state = 'chase';
                enemy.target = player;
            }
        }

        if (enemy.state === 'chase') {
            if (distToPlayer > detectionRange * 2 && !enemy.inDungeon) {
                enemy.state = 'idle';
                enemy.target = null;
            } else {
                // Move toward player
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemy.vx = Math.cos(angle) * enemy.speed;
                enemy.vy = Math.sin(angle) * enemy.speed;

                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;

                // Attack
                enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

                if (distToPlayer < enemy.size + 15 && enemy.attackCooldown <= 0) {
                    if (!player.invulnerable && !player.dodging) {
                        let damage = enemy.damage;

                        // Blocking reduces damage
                        if (player.blocking) {
                            damage = Math.floor(damage * 0.3);
                            player.stamina = Math.max(0, player.stamina - 5);
                        }

                        // Armor reduction
                        if (player.armor) {
                            damage = Math.max(1, damage - Math.floor(player.armor.defense / 2));
                        }

                        player.hp -= damage;
                        spawnDamageNumber(player.x, player.y - 10, damage, true);

                        player.invulnerable = true;
                        player.invulnerableTimer = 0.5;

                        // Screen shake and flash
                        camera.shakeTimer = 0.2;
                        camera.shakeIntensity = 5;
                        camera.flashTimer = 0.1;
                    }
                    enemy.attackCooldown = 1.0;
                }
            }
        }

        // Death
        if (enemy.hp <= 0) {
            // XP
            player.xp += enemy.xp;
            checkLevelUp();

            // Loot
            dropLoot(enemy);

            // Quest progress
            if (enemy.isBoss && player.currentDungeon) {
                player.currentDungeon.cleared = true;
                const quest = quests.active.find(q => q.target === player.currentDungeon.id);
                if (quest) {
                    quests.completed.push(quest);
                    quests.active = quests.active.filter(q => q !== quest);
                    player.gold += quest.reward.gold;
                    player.xp += quest.reward.xp;
                    addMessage(`Quest Complete: ${quest.name}!`);
                    addMessage(`Reward: ${quest.reward.gold} gold, ${quest.reward.xp} XP`);
                }
            }

            // Particles
            for (let p = 0; p < 8; p++) {
                particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.5,
                    color: enemy.color,
                    size: 3
                });
            }

            entities.splice(i, 1);
            addMessage(`Defeated ${enemy.name}!`);
        }
    }
}

function dropLoot(enemy) {
    const lootType = enemy.loot;

    if (lootType === 'gold') {
        const amount = 5 + Math.floor(Math.random() * 15);
        player.gold += amount;
        addMessage(`Found ${amount} gold`);
    } else if (lootType === 'pelt') {
        player.inventory.push({ name: `${enemy.name} Pelt`, type: 'misc', value: 10 });
        addMessage(`Obtained ${enemy.name} Pelt`);
    } else if (lootType === 'weapon') {
        const weapons = [
            { name: 'Steel Sword', type: 'weapon', damage: 12 },
            { name: 'Iron Greatsword', type: 'weapon', damage: 15 }
        ];
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];
        player.inventory.push(weapon);
        addMessage(`Found ${weapon.name}!`);
    } else if (lootType === 'enchanted') {
        player.inventory.push({ name: 'Frost Blade', type: 'weapon', damage: 18, effect: 'frost' });
        addMessage(`Found Frost Blade!`);
    }

    // Chance for potion
    if (Math.random() < 0.3) {
        player.inventory.push({ name: 'Health Potion', type: 'potion', effect: 'heal', value: 50 });
        addMessage('Found Health Potion');
    }
}

function checkLevelUp() {
    while (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.combatSkill = Math.min(10, player.combatSkill + 1);
        player.maxHp += 10;
        player.hp = player.maxHp;
        player.perkPoints++;
        player.xpToLevel = 100 * player.level;
        addMessage(`Level Up! Now level ${player.level}`);
    }
}

function spawnDamageNumber(x, y, damage, isPlayer = false) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 20,
        vy: -50,
        life: 1,
        text: damage.toString(),
        color: isPlayer ? '#ff4444' : '#ffff44',
        size: isPlayer ? 14 : 12
    });
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // gravity
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateCamera() {
    // Follow player
    camera.x = player.x - WIDTH / 2;
    camera.y = player.y - HEIGHT / 2;

    // Clamp to world bounds
    if (!player.inDungeon) {
        camera.x = Math.max(0, Math.min(WORLD_SIZE * TILE_SIZE - WIDTH, camera.x));
        camera.y = Math.max(0, Math.min(WORLD_SIZE * TILE_SIZE - HEIGHT, camera.y));
    }

    // Screen shake
    if (camera.shakeTimer > 0) {
        camera.shakeTimer -= 1/60;
        camera.x += (Math.random() - 0.5) * camera.shakeIntensity;
        camera.y += (Math.random() - 0.5) * camera.shakeIntensity;
    }
}

// Rendering
function render() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Flash effect
    if (camera.flashTimer > 0) {
        camera.flashTimer -= 1/60;
    }

    switch (gameState) {
        case 'menu':
            renderMenu();
            break;
        case 'playing':
        case 'paused':
            if (player.inDungeon) {
                renderDungeon();
            } else {
                renderWorld();
            }
            renderEntities();
            renderPlayer();
            renderParticles();
            renderHUD();
            if (gameState === 'paused') renderPauseMenu();
            break;
        case 'inventory':
            if (player.inDungeon) {
                renderDungeon();
            } else {
                renderWorld();
            }
            renderEntities();
            renderPlayer();
            renderHUD();
            renderInventory();
            break;
        case 'dialogue':
            if (player.inDungeon) {
                renderDungeon();
            } else {
                renderWorld();
            }
            renderEntities();
            renderPlayer();
            renderDialogue();
            break;
        case 'gameover':
            renderGameOver();
            break;
        case 'victory':
            renderVictory();
            break;
    }

    // Red flash when hurt
    if (camera.flashTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${camera.flashTimer * 2})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    if (showDebug) renderDebug();
}

function renderMenu() {
    // Background
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Snow particles
    for (let i = 0; i < 50; i++) {
        const x = (Date.now() / 50 + i * 20) % WIDTH;
        const y = (Date.now() / 30 + i * 15) % HEIGHT;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x, y, 2, 2);
    }

    // Title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('FROSTFALL', WIDTH/2, 100);

    ctx.font = '16px "Courier New"';
    ctx.fillStyle = '#8899aa';
    ctx.fillText('A 2D Skyrim Demake', WIDTH/2, 130);

    // Decorative
    ctx.fillStyle = '#4a5a6a';
    ctx.fillRect(WIDTH/2 - 100, 150, 200, 2);

    // Instructions
    ctx.font = '14px "Courier New"';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText('Press SPACE or Click to Start', WIDTH/2, 200);

    ctx.font = '12px "Courier New"';
    ctx.fillStyle = '#778899';
    ctx.fillText('WASD - Move | Click - Attack | Shift - Sprint/Dodge', WIDTH/2, 260);
    ctx.fillText('E - Interact | Tab - Inventory | Q - Debug', WIDTH/2, 280);
    ctx.fillText('1-3 - Quick Potions | ESC - Pause', WIDTH/2, 300);

    // Quest hint
    ctx.fillStyle = '#aabbcc';
    ctx.fillText('Clear all 3 dungeons to win!', WIDTH/2, 340);
}

function renderWorld() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);

    for (let y = startY - 1; y < startY + VIEW_TILES_Y + 2; y++) {
        for (let x = startX - 1; x < startX + VIEW_TILES_X + 2; x++) {
            if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) continue;

            const tile = world[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            // Base color
            let color = COLORS.grass;
            switch (tile.type) {
                case 'grass': color = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassDark; break;
                case 'dirt': color = COLORS.dirt; break;
                case 'stone': color = tile.walkable ? COLORS.stoneDark : COLORS.stone; break;
                case 'snow': color = (x + y) % 2 === 0 ? COLORS.snow : COLORS.snowDark; break;
                case 'tree': color = COLORS.tree; break;
                case 'building': color = COLORS.wood; break;
                case 'door': color = COLORS.woodDark; break;
                case 'dungeon_entrance': color = '#4a2a2a'; break;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Tree detail
            if (tile.type === 'tree') {
                ctx.fillStyle = COLORS.treeTrunk;
                ctx.fillRect(screenX + 6, screenY + 10, 4, 6);
                ctx.fillStyle = tile.biome === 'snow' ? '#3a5a5a' : '#2a4a2a';
                ctx.beginPath();
                ctx.moveTo(screenX + 8, screenY);
                ctx.lineTo(screenX + 2, screenY + 12);
                ctx.lineTo(screenX + 14, screenY + 12);
                ctx.fill();
            }

            // Building detail
            if (tile.type === 'building') {
                ctx.fillStyle = '#3a2010';
                ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
                ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
            }

            // Dungeon entrance marker
            if (tile.type === 'dungeon_entrance') {
                ctx.fillStyle = '#2a1a1a';
                ctx.beginPath();
                ctx.arc(screenX + 8, screenY + 8, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1a0a0a';
                ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
            }
        }
    }

    // Render NPCs
    for (const npc of npcs) {
        const screenX = npc.x - camera.x;
        const screenY = npc.y - camera.y;

        if (screenX < -20 || screenX > WIDTH + 20 || screenY < -20 || screenY > HEIGHT + 20) continue;

        // Body
        ctx.fillStyle = COLORS.npc;
        ctx.fillRect(screenX - 6, screenY - 12, 12, 16);

        // Head
        ctx.fillStyle = '#ddccaa';
        ctx.fillRect(screenX - 4, screenY - 16, 8, 6);

        // Name
        ctx.fillStyle = COLORS.text;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX, screenY - 22);

        // Interaction prompt
        const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (dist < 40) {
            ctx.fillStyle = '#ffff88';
            ctx.fillText('[E] Talk', screenX, screenY + 20);
        }
    }
}

function renderDungeon() {
    if (!player.currentDungeon) return;

    const dungeon = player.currentDungeon;

    for (const room of dungeon.rooms) {
        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tile = room.tiles[y][x];
                const worldX = (room.x + x) * TILE_SIZE;
                const worldY = y * TILE_SIZE;
                const screenX = worldX - camera.x;
                const screenY = worldY - camera.y;

                if (screenX < -TILE_SIZE || screenX > WIDTH || screenY < -TILE_SIZE || screenY > HEIGHT) continue;

                let color = COLORS.floor;
                if (tile.type === 'wall') color = COLORS.wall;
                if (tile.type === 'door') color = COLORS.woodDark;

                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Wall detail
                if (tile.type === 'wall') {
                    ctx.fillStyle = '#2a2a3a';
                    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            }
        }
    }

    // Exit marker
    ctx.fillStyle = '#44aa44';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('< EXIT', 5, dungeon.rooms[0].height * TILE_SIZE / 2 - camera.y);
}

function renderEntities() {
    for (const enemy of entities) {
        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;

        if (screenX < -50 || screenX > WIDTH + 50 || screenY < -50 || screenY > HEIGHT + 50) continue;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + enemy.size/2, enemy.size * 0.6, enemy.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();

        // Boss indicator
        if (enemy.isBoss) {
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, enemy.size/2 + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX - 15, screenY - enemy.size/2 - 8, 30, 4);
        ctx.fillStyle = hpPercent > 0.5 ? COLORS.stamina : (hpPercent > 0.25 ? '#ddaa33' : COLORS.health);
        ctx.fillRect(screenX - 15, screenY - enemy.size/2 - 8, 30 * hpPercent, 4);

        // Name (for bosses)
        if (enemy.isBoss) {
            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name, screenX, screenY - enemy.size/2 - 12);
        }
    }
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Flash when invulnerable
    if (player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 6, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(screenX - 6, screenY - 10, 12, 16);

    // Head
    ctx.fillStyle = '#ddccaa';
    ctx.fillRect(screenX - 4, screenY - 14, 8, 6);

    // Weapon (when attacking)
    if (player.attacking) {
        ctx.fillStyle = '#aaaaaa';
        let wx = screenX, wy = screenY;
        switch (player.facing) {
            case 'up': wy -= 18; break;
            case 'down': wy += 12; break;
            case 'left': wx -= 16; break;
            case 'right': wx += 16; break;
        }

        ctx.save();
        ctx.translate(wx, wy);
        const angle = player.facing === 'up' ? -Math.PI/2 :
                     player.facing === 'down' ? Math.PI/2 :
                     player.facing === 'left' ? Math.PI : 0;
        ctx.rotate(angle + Math.sin(player.attackTimer * 20) * 0.5);
        ctx.fillRect(-2, -12, 4, 24);
        ctx.restore();
    }

    // Shield (when blocking)
    if (player.blocking) {
        ctx.fillStyle = '#665544';
        let sx = screenX, sy = screenY;
        switch (player.facing) {
            case 'up': sy -= 14; break;
            case 'down': sy += 8; break;
            case 'left': sx -= 12; break;
            case 'right': sx += 12; break;
        }
        ctx.fillRect(sx - 5, sy - 6, 10, 12);
    }

    ctx.globalAlpha = 1;
}

function renderParticles() {
    for (const p of particles) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        if (p.text) {
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px "Courier New"`;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, screenX, screenY);
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
        }
    }
}

function renderHUD() {
    // Bottom HUD bar
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.fillRect(0, HEIGHT - 50, WIDTH, 50);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(0, HEIGHT - 50, WIDTH, 50);

    // Health bar
    ctx.fillStyle = '#222';
    ctx.fillRect(10, HEIGHT - 40, 120, 16);
    ctx.fillStyle = COLORS.health;
    ctx.fillRect(10, HEIGHT - 40, 120 * (player.hp / player.maxHp), 16);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(10, HEIGHT - 40, 120, 16);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.hp}/${player.maxHp}`, 70, HEIGHT - 28);

    // Stamina bar
    ctx.fillStyle = '#222';
    ctx.fillRect(140, HEIGHT - 40, 100, 12);
    ctx.fillStyle = COLORS.stamina;
    ctx.fillRect(140, HEIGHT - 40, 100 * (player.stamina / player.maxStamina), 12);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(140, HEIGHT - 40, 100, 12);

    // Magicka bar
    ctx.fillStyle = '#222';
    ctx.fillRect(140, HEIGHT - 24, 100, 12);
    ctx.fillStyle = COLORS.magicka;
    ctx.fillRect(140, HEIGHT - 24, 100 * (player.magicka / player.maxMagicka), 12);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(140, HEIGHT - 24, 100, 12);

    // Quick slots
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#333';
        ctx.fillRect(260 + i * 36, HEIGHT - 42, 32, 32);
        ctx.strokeStyle = COLORS.uiBorder;
        ctx.strokeRect(260 + i * 36, HEIGHT - 42, 32, 32);

        const potions = player.inventory.filter(item => item.type === 'potion');
        if (potions[i]) {
            ctx.fillStyle = potions[i].effect === 'heal' ? COLORS.health : COLORS.stamina;
            ctx.beginPath();
            ctx.arc(276 + i * 36, HEIGHT - 26, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = COLORS.textDim;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, 276 + i * 36, HEIGHT - 8);
    }

    // Gold
    ctx.fillStyle = COLORS.gold;
    ctx.font = '14px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`${player.gold} Gold`, WIDTH - 10, HEIGHT - 30);

    // Level
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Level ${player.level}`, WIDTH - 10, HEIGHT - 14);

    // XP bar
    ctx.fillStyle = '#222';
    ctx.fillRect(WIDTH - 110, HEIGHT - 45, 100, 8);
    ctx.fillStyle = '#aa88cc';
    ctx.fillRect(WIDTH - 110, HEIGHT - 45, 100 * (player.xp / player.xpToLevel), 8);

    // Active quest
    if (quests.active.length > 0) {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.fillRect(5, 5, 200, 40);
        ctx.strokeStyle = COLORS.uiBorder;
        ctx.strokeRect(5, 5, 200, 40);

        ctx.fillStyle = COLORS.gold;
        ctx.font = '11px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(quests.active[0].name, 10, 20);
        ctx.fillStyle = COLORS.textDim;
        ctx.font = '10px "Courier New"';
        ctx.fillText(quests.active[0].objective, 10, 35);
    }

    // Messages
    ctx.textAlign = 'left';
    for (let i = 0; i < messages.length; i++) {
        const alpha = Math.min(1, messages[i].time / 60);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.font = '11px "Courier New"';
        ctx.fillText(messages[i].text, 10, 65 + i * 14);
    }

    // Minimap
    renderMinimap();
}

function renderMinimap() {
    const mapSize = 60;
    const mapX = WIDTH - mapSize - 10;
    const mapY = 10;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    if (!player.inDungeon) {
        // World minimap
        const scale = mapSize / WORLD_SIZE;

        // Terrain
        for (let y = 0; y < WORLD_SIZE; y += 5) {
            for (let x = 0; x < WORLD_SIZE; x += 5) {
                const tile = world[y][x];
                let color = '#2a4a2a';
                if (tile.biome === 'snow') color = '#aabbcc';
                if (tile.biome === 'mountain') color = '#5a5a6a';
                if (tile.biome === 'village') color = '#6a5a4a';

                ctx.fillStyle = color;
                ctx.fillRect(mapX + x * scale, mapY + y * scale, 3, 3);
            }
        }

        // Dungeons
        for (const d of dungeons) {
            ctx.fillStyle = d.cleared ? '#44aa44' : '#aa4444';
            ctx.fillRect(mapX + d.worldX * scale - 2, mapY + d.worldY * scale - 2, 4, 4);
        }

        // Player
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mapX + (player.x / TILE_SIZE) * scale - 1, mapY + (player.y / TILE_SIZE) * scale - 1, 3, 3);
    }
}

function renderInventory() {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Inventory panel
    ctx.fillStyle = COLORS.ui;
    ctx.fillRect(100, 50, 440, 260);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 50, 440, 260);

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', WIDTH/2, 75);

    // Equipment section
    ctx.textAlign = 'left';
    ctx.font = '12px "Courier New"';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('EQUIPPED:', 115, 100);

    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Weapon: ${player.weapon ? player.weapon.name : 'None'}`, 115, 120);
    ctx.fillText(`Armor: ${player.armor ? player.armor.name : 'None'}`, 115, 140);
    ctx.fillText(`Helmet: ${player.helmet ? player.helmet.name : 'None'}`, 115, 160);
    ctx.fillText(`Ring: ${player.ring ? player.ring.name : 'None'}`, 115, 180);

    // Stats
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('STATS:', 115, 210);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Damage: ${player.weapon ? player.weapon.damage : 0}`, 115, 230);
    ctx.fillText(`Defense: ${player.armor ? player.armor.defense : 0}`, 115, 250);
    ctx.fillText(`Combat Skill: ${player.combatSkill}`, 115, 270);

    // Items
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('ITEMS:', 300, 100);

    ctx.fillStyle = COLORS.text;
    for (let i = 0; i < Math.min(12, player.inventory.length); i++) {
        const item = player.inventory[i];
        ctx.fillText(`${item.name}`, 300, 120 + i * 16);
    }

    // Close hint
    ctx.fillStyle = COLORS.textDim;
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB or ESC to close', WIDTH/2, 295);
}

function renderDialogue() {
    if (!currentDialogue) return;

    // Dialogue box
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(50, HEIGHT - 140, WIDTH - 100, 120);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(50, HEIGHT - 140, WIDTH - 100, 120);

    // NPC portrait area
    ctx.fillStyle = '#333';
    ctx.fillRect(60, HEIGHT - 130, 60, 60);
    ctx.fillStyle = COLORS.npc;
    ctx.fillRect(70, HEIGHT - 120, 40, 40);

    // NPC name
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(currentDialogue.npc.name, 130, HEIGHT - 115);

    // Dialogue text
    const dialogue = currentDialogue.npc.dialogue[currentDialogue.index];
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px "Courier New"';
    ctx.fillText(dialogue.text, 130, HEIGHT - 90);

    // Continue prompt
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px "Courier New"';
    ctx.fillText('Press E to continue', 130, HEIGHT - 40);
}

function renderPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 24px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 20);

    ctx.font = '14px "Courier New"';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
}

function renderGameOver() {
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#cc3333';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', WIDTH/2, HEIGHT/2 - 40);

    ctx.fillStyle = COLORS.text;
    ctx.font = '14px "Courier New"';
    ctx.fillText(`Level: ${player.level}`, WIDTH/2, HEIGHT/2 + 10);
    ctx.fillText(`Dungeons Cleared: ${dungeons.filter(d => d.cleared).length}/3`, WIDTH/2, HEIGHT/2 + 30);

    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('Press R to restart', WIDTH/2, HEIGHT/2 + 70);
}

function renderVictory() {
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#44cc44';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH/2, HEIGHT/2 - 50);

    ctx.fillStyle = COLORS.text;
    ctx.font = '16px "Courier New"';
    ctx.fillText('You have cleared all dungeons!', WIDTH/2, HEIGHT/2);

    ctx.font = '14px "Courier New"';
    ctx.fillText(`Final Level: ${player.level}`, WIDTH/2, HEIGHT/2 + 30);
    ctx.fillText(`Gold Collected: ${player.gold}`, WIDTH/2, HEIGHT/2 + 50);

    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('Press R to play again', WIDTH/2, HEIGHT/2 + 90);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(5, 50, 180, 180);

    ctx.fillStyle = '#44ff44';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';

    const lines = [
        `FPS: ${Math.round(1000 / 16)}`,
        `State: ${gameState}`,
        `Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
        `Tile: ${Math.floor(player.x/TILE_SIZE)}, ${Math.floor(player.y/TILE_SIZE)}`,
        `HP: ${player.hp}/${player.maxHp}`,
        `Stamina: ${Math.floor(player.stamina)}/${player.maxStamina}`,
        `Level: ${player.level} (${player.xp}/${player.xpToLevel})`,
        `Gold: ${player.gold}`,
        `Combat Skill: ${player.combatSkill}`,
        `Enemies: ${entities.length}`,
        `In Dungeon: ${player.inDungeon}`,
        `Dungeons Cleared: ${dungeons.filter(d => d.cleared).length}/3`,
        `Active Quests: ${quests.active.length}`,
        `Inventory: ${player.inventory.length}/${player.maxInventory}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 10, 65 + i * 12);
    });
}

// Start the game
init();
