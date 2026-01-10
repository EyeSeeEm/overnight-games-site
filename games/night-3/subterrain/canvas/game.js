// Isolation Protocol - Subterrain Clone
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Color palette matching Subterrain
const COLORS = {
    BG: '#0a0808',
    FLOOR_DARK: '#2a2828',
    FLOOR_LIGHT: '#3a3838',
    FLOOR_PATTERN: '#323030',
    WALL: '#1a1818',
    WALL_LIGHT: '#2a2625',
    DOOR: '#3a4a3a',
    DOOR_FRAME: '#4a5a4a',
    BLOOD: '#6a2020',
    BLOOD_FRESH: '#8a3030',
    BLOOD_GREEN: '#305a30',

    // Entities
    PLAYER: '#5a6a6a',
    PLAYER_FACE: '#8a9a98',
    SHAMBLER: '#6a5848',
    SHAMBLER_FLESH: '#8a6858',
    CRAWLER: '#5a4838',
    SPITTER: '#4a6a4a',
    SPITTER_ACID: '#6aaa5a',
    BRUTE: '#7a5848',
    BRUTE_ARMOR: '#5a3828',
    COCOON: '#aa6a30',
    COCOON_GLOW: '#cc8a40',

    // Effects
    MUZZLE: '#ffaa44',
    BULLET: '#ffcc66',
    FIRE: '#ff6622',

    // UI
    UI_BG: '#1a1414',
    UI_BORDER: '#3a2828',
    HEALTH_BAR: '#aa3030',
    HUNGER_BAR: '#aa6a30',
    THIRST_BAR: '#3070aa',
    FATIGUE_BAR: '#6a6a6a',
    INFECTION_BAR: '#30aa40',
    GLOBAL_INF: '#ff4444'
};

// Game state
const game = {
    state: 'playing', // playing, paused, gameover, victory
    time: 0, // Game time in minutes
    realTime: 0,
    globalInfection: 0,
    currentSector: 'hub',
    power: { used: 0, max: 500 },
    poweredSectors: { hub: true, storage: false, medical: false, research: false, escape: false },
    tier2Unlocked: false,
    hasKeycard: false,
    // Stats tracking
    killCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    containersLooted: 0,
    itemsUsed: 0,
    sectorsVisited: new Set(['hub']),
    maxKillStreak: 0,
    killStreak: 0,
    killStreakTimer: 0
};

// Debug mode
let debugMode = false;

// Floating text array
let floatingTexts = [];

// Screen effects
let screenShake = 0;
let damageFlash = 0;

// Player state
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    speed: 150,
    angle: 0,
    width: 24,
    height: 24,

    // Stats
    health: 100,
    maxHealth: 100,
    hunger: 0,
    thirst: 0,
    fatigue: 0,
    infection: 0,
    stamina: 100,
    maxStamina: 100,

    // Weapon
    weapon: 'fists',
    ammo: 0,
    attackCooldown: 0,

    // Inventory
    inventory: [
        { type: 'food', name: 'Canned Food', count: 2 },
        { type: 'water', name: 'Water Bottle', count: 2 }
    ],
    maxInventory: 20
};

// Enemies
let enemies = [];

// Loot containers
let containers = [];

// Blood splatters
let bloodSplatters = [];

// Projectiles
let projectiles = [];

// Particles
let particles = [];

// Map data for each sector
const sectors = {
    hub: {
        width: 15,
        height: 15,
        tiles: [],
        spawnX: 240,
        spawnY: 240,
        powerCost: 0,
        name: 'Central Hub'
    },
    storage: {
        width: 20,
        height: 20,
        tiles: [],
        spawnX: 320,
        spawnY: 320,
        powerCost: 100,
        name: 'Storage Wing'
    },
    medical: {
        width: 20,
        height: 20,
        tiles: [],
        spawnX: 320,
        spawnY: 320,
        powerCost: 150,
        name: 'Medical Bay'
    },
    research: {
        width: 25,
        height: 25,
        tiles: [],
        spawnX: 400,
        spawnY: 400,
        powerCost: 200,
        name: 'Research Lab'
    },
    escape: {
        width: 15,
        height: 15,
        tiles: [],
        spawnX: 240,
        spawnY: 240,
        powerCost: 300,
        name: 'Escape Pod'
    }
};

// Tile types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DOOR_HUB: 10,
    DOOR_STORAGE: 11,
    DOOR_MEDICAL: 12,
    DOOR_RESEARCH: 13,
    DOOR_ESCAPE: 14,
    WORKBENCH: 20,
    BED: 21,
    STORAGE_LOCKER: 22,
    POWER_PANEL: 23,
    MEDICAL_STATION: 24,
    RESEARCH_TERMINAL: 25,
    ESCAPE_POD: 26,
    CONTAINER: 30
};

// Input handling
const keys = {};
const mouse = { x: 0, y: 0, down: false };

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Tab') e.preventDefault();
    // Debug mode toggle
    if (e.key === '`' || e.key === 'q') {
        debugMode = !debugMode;
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Generate maps
function generateMaps() {
    // Generate each sector
    for (const [sectorName, sector] of Object.entries(sectors)) {
        sector.tiles = [];
        for (let y = 0; y < sector.height; y++) {
            sector.tiles[y] = [];
            for (let x = 0; x < sector.width; x++) {
                // Walls on edges
                if (x === 0 || y === 0 || x === sector.width - 1 || y === sector.height - 1) {
                    sector.tiles[y][x] = TILE.WALL;
                } else {
                    sector.tiles[y][x] = TILE.FLOOR;
                }
            }
        }

        // Add internal walls for interest
        addInternalWalls(sector);

        // Add doors to other sectors
        addDoors(sector, sectorName);

        // Add facilities
        addFacilities(sector, sectorName);
    }
}

function addInternalWalls(sector) {
    const w = sector.width;
    const h = sector.height;
    const centerX = Math.floor(w / 2);
    const centerY = Math.floor(h / 2);

    // Define corridors to doors (3 tiles wide paths from center to each edge)
    const isInCorridor = (x, y) => {
        // Vertical corridor (north-south through center)
        if (Math.abs(x - centerX) <= 1) return true;
        // Horizontal corridor (east-west through center)
        if (Math.abs(y - centerY) <= 1) return true;
        return false;
    };

    // Add some random wall segments
    const numWalls = Math.floor((w * h) / 50);
    for (let i = 0; i < numWalls; i++) {
        const x = 2 + Math.floor(Math.random() * (w - 4));
        const y = 2 + Math.floor(Math.random() * (h - 4));
        const horizontal = Math.random() < 0.5;
        const length = 2 + Math.floor(Math.random() * 4);

        for (let j = 0; j < length; j++) {
            const wx = horizontal ? x + j : x;
            const wy = horizontal ? y : y + j;
            // Don't place walls in corridors leading to doors
            if (wx > 0 && wx < w - 1 && wy > 0 && wy < h - 1 && !isInCorridor(wx, wy)) {
                sector.tiles[wy][wx] = TILE.WALL;
            }
        }
    }
}

function addDoors(sector, sectorName) {
    const w = sector.width;
    const h = sector.height;

    // Add doors based on sector
    if (sectorName === 'hub') {
        // Door to storage (south)
        sector.tiles[h - 1][Math.floor(w / 2)] = TILE.DOOR_STORAGE;
        // Door to medical (east)
        sector.tiles[Math.floor(h / 2)][w - 1] = TILE.DOOR_MEDICAL;
        // Door to research (west)
        sector.tiles[Math.floor(h / 2)][0] = TILE.DOOR_RESEARCH;
        // Door to escape (north)
        sector.tiles[0][Math.floor(w / 2)] = TILE.DOOR_ESCAPE;
    } else {
        // Door back to hub
        sector.tiles[0][Math.floor(w / 2)] = TILE.DOOR_HUB;
    }
}

function addFacilities(sector, sectorName) {
    const w = sector.width;
    const h = sector.height;

    if (sectorName === 'hub') {
        // Workbench
        sector.tiles[3][3] = TILE.WORKBENCH;
        // Bed
        sector.tiles[3][w - 4] = TILE.BED;
        // Storage locker
        sector.tiles[h - 4][3] = TILE.STORAGE_LOCKER;
        // Power panel
        sector.tiles[h - 4][w - 4] = TILE.POWER_PANEL;
    } else if (sectorName === 'medical') {
        sector.tiles[h - 4][Math.floor(w / 2)] = TILE.MEDICAL_STATION;
    } else if (sectorName === 'research') {
        sector.tiles[h - 4][Math.floor(w / 2)] = TILE.RESEARCH_TERMINAL;
    } else if (sectorName === 'escape') {
        sector.tiles[Math.floor(h / 2)][Math.floor(w / 2)] = TILE.ESCAPE_POD;
    }

    // Add containers in non-hub sectors
    if (sectorName !== 'hub') {
        const numContainers = sectorName === 'storage' ? 10 : 6;
        for (let i = 0; i < numContainers; i++) {
            let placed = false;
            for (let attempts = 0; attempts < 20 && !placed; attempts++) {
                const x = 2 + Math.floor(Math.random() * (w - 4));
                const y = 2 + Math.floor(Math.random() * (h - 4));
                if (sector.tiles[y][x] === TILE.FLOOR) {
                    sector.tiles[y][x] = TILE.CONTAINER;
                    containers.push({
                        sector: sectorName,
                        x: x,
                        y: y,
                        looted: false,
                        lootType: getLootType(sectorName)
                    });
                    placed = true;
                }
            }
        }
    }
}

function getLootType(sectorName) {
    if (sectorName === 'storage') {
        const roll = Math.random();
        if (roll < 0.3) return 'food';
        if (roll < 0.6) return 'water';
        if (roll < 0.8) return 'scrap';
        return 'cloth';
    } else if (sectorName === 'medical') {
        const roll = Math.random();
        if (roll < 0.4) return 'medkit';
        if (roll < 0.7) return 'antidote';
        return 'chemicals';
    } else if (sectorName === 'research') {
        const roll = Math.random();
        if (roll < 0.3) return 'electronics';
        if (roll < 0.5) return 'powerCell';
        if (roll < 0.7) return 'dataChip';
        return 'keycard';
    } else if (sectorName === 'escape') {
        return Math.random() < 0.5 ? 'medkit' : 'ammo';
    }
    return 'scrap';
}

// Spawn enemies for a sector
function spawnEnemies(sectorName) {
    enemies = [];

    if (sectorName === 'hub') return; // No enemies in hub

    const sector = sectors[sectorName];
    const w = sector.width;
    const h = sector.height;

    let enemyTypes, count;

    if (sectorName === 'storage') {
        enemyTypes = ['shambler', 'shambler', 'shambler', 'crawler'];
        count = 4;
    } else if (sectorName === 'medical') {
        enemyTypes = ['shambler', 'shambler', 'spitter', 'spitter'];
        count = 4;
    } else if (sectorName === 'research') {
        enemyTypes = ['crawler', 'crawler', 'spitter', 'brute'];
        count = 4;
    } else if (sectorName === 'escape') {
        enemyTypes = ['shambler', 'crawler', 'spitter', 'brute', 'brute'];
        count = 5;
    }

    for (let i = 0; i < count; i++) {
        let placed = false;
        for (let attempts = 0; attempts < 30 && !placed; attempts++) {
            const x = 3 + Math.floor(Math.random() * (w - 6));
            const y = 3 + Math.floor(Math.random() * (h - 6));

            // Check distance from player spawn
            const px = sector.spawnX / TILE_SIZE;
            const py = sector.spawnY / TILE_SIZE;
            if (Math.abs(x - px) + Math.abs(y - py) > 5) {
                if (sector.tiles[y][x] === TILE.FLOOR) {
                    const type = enemyTypes[i % enemyTypes.length];
                    enemies.push(createEnemy(type, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2));
                    placed = true;
                }
            }
        }
    }

    // Add a cocoon in harder sectors
    if (sectorName === 'research' || sectorName === 'escape') {
        for (let attempts = 0; attempts < 20; attempts++) {
            const x = 3 + Math.floor(Math.random() * (w - 6));
            const y = 3 + Math.floor(Math.random() * (h - 6));
            if (sector.tiles[y][x] === TILE.FLOOR) {
                enemies.push(createEnemy('cocoon', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2));
                break;
            }
        }
    }
}

function createEnemy(type, x, y) {
    const stats = {
        shambler: { hp: 30, damage: 10, speed: 50, attackRate: 1.5, infection: 5 },
        crawler: { hp: 20, damage: 8, speed: 120, attackRate: 1.0, infection: 5 },
        spitter: { hp: 25, damage: 15, speed: 40, attackRate: 2.5, infection: 10, ranged: true },
        brute: { hp: 80, damage: 25, speed: 30, attackRate: 2.0, infection: 8 },
        cocoon: { hp: 50, damage: 0, speed: 0, attackRate: 60, infection: 0 }
    };

    const s = stats[type];

    // Scale by global infection
    const scale = 1 + (game.globalInfection / 100) * 0.5;

    return {
        type,
        x, y,
        vx: 0, vy: 0,
        width: type === 'brute' ? 40 : type === 'cocoon' ? 48 : 28,
        height: type === 'brute' ? 40 : type === 'cocoon' ? 48 : 28,
        hp: Math.floor(s.hp * scale),
        maxHp: Math.floor(s.hp * scale),
        damage: Math.floor(s.damage * scale),
        speed: s.speed,
        attackRate: s.attackRate,
        attackCooldown: 0,
        infection: s.infection,
        ranged: s.ranged || false,
        state: 'idle', // idle, chase, attack
        detectionRange: type === 'spitter' ? 300 : type === 'crawler' ? 200 : 250,
        spawnTimer: 0 // For cocoons
    };
}

// Camera
const camera = { x: 0, y: 0 };

function updateCamera() {
    const sector = sectors[game.currentSector];
    const mapWidth = sector.width * TILE_SIZE;
    const mapHeight = sector.height * TILE_SIZE;

    camera.x = player.x - GAME_WIDTH / 2;
    camera.y = player.y - GAME_HEIGHT / 2;

    // Clamp camera
    camera.x = Math.max(0, Math.min(camera.x, mapWidth - GAME_WIDTH));
    camera.y = Math.max(0, Math.min(camera.y, mapHeight - GAME_HEIGHT));
}

// Update
let lastTime = 0;

function update(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (game.state !== 'playing') {
        draw();
        requestAnimationFrame(update);
        return;
    }

    // Update game time (1 real second = 1 game minute)
    game.realTime += dt;
    game.time = Math.floor(game.realTime);

    // Update global infection (0.1% per game minute = per real second)
    game.globalInfection = Math.min(100, game.realTime * 0.1);

    if (game.globalInfection >= 100) {
        game.state = 'gameover';
        game.deathReason = 'The facility is lost. No one escapes.';
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateScreenEffects(dt);
    updateSurvivalMeters(dt);
    updateCamera();

    draw();
    requestAnimationFrame(update);
}

function updatePlayer(dt) {
    // Movement input
    player.vx = 0;
    player.vy = 0;

    let speedMod = 1;
    if (player.hunger > 75) speedMod *= 0.75;
    else if (player.hunger > 50) speedMod *= 0.9;

    if (keys['w'] || keys['arrowup']) player.vy = -player.speed * speedMod;
    if (keys['s'] || keys['arrowdown']) player.vy = player.speed * speedMod;
    if (keys['a'] || keys['arrowleft']) player.vx = -player.speed * speedMod;
    if (keys['d'] || keys['arrowright']) player.vx = player.speed * speedMod;

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.707;
        player.vy *= 0.707;
    }

    // Apply movement with collision
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    if (!checkCollision(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!checkCollision(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Check door transitions
    checkDoorTransition();

    // Mouse aim
    player.angle = Math.atan2(mouse.y - (player.y - camera.y), mouse.x - (player.x - camera.x));

    // Attack
    player.attackCooldown -= dt;
    if (mouse.down && player.attackCooldown <= 0) {
        attack();
    }

    // Stamina regen
    player.stamina = Math.min(player.maxStamina, player.stamina + 5 * dt);

    // Interaction (E key)
    if (keys['e']) {
        keys['e'] = false;
        interact();
    }
}

function checkCollision(x, y, w, h) {
    const sector = sectors[game.currentSector];

    const left = Math.floor((x - w / 2) / TILE_SIZE);
    const right = Math.floor((x + w / 2) / TILE_SIZE);
    const top = Math.floor((y - h / 2) / TILE_SIZE);
    const bottom = Math.floor((y + h / 2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            // Check bounds - but allow if we're moving toward a door at the edge
            if (ty < 0 || ty >= sector.height || tx < 0 || tx >= sector.width) {
                // Check if the adjacent in-bounds tile is a door
                const clampedTy = Math.max(0, Math.min(sector.height - 1, ty));
                const clampedTx = Math.max(0, Math.min(sector.width - 1, tx));
                const nearbyTile = sector.tiles[clampedTy][clampedTx];
                if (nearbyTile >= TILE.DOOR_HUB && nearbyTile <= TILE.DOOR_ESCAPE) {
                    continue; // Allow movement near doors at edges
                }
                return true;
            }
            const tile = sector.tiles[ty][tx];
            if (tile === TILE.WALL) return true;
        }
    }
    return false;
}

function checkDoorTransition() {
    const sector = sectors[game.currentSector];
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);

    if (ty < 0 || ty >= sector.height || tx < 0 || tx >= sector.width) return;

    const tile = sector.tiles[ty][tx];

    const doorMap = {
        [TILE.DOOR_HUB]: 'hub',
        [TILE.DOOR_STORAGE]: 'storage',
        [TILE.DOOR_MEDICAL]: 'medical',
        [TILE.DOOR_RESEARCH]: 'research',
        [TILE.DOOR_ESCAPE]: 'escape'
    };

    if (doorMap[tile] && doorMap[tile] !== game.currentSector) {
        const newSector = doorMap[tile];
        const previousSector = game.currentSector;

        // Check if escape pod requires keycard
        if (newSector === 'escape' && !game.hasKeycard) {
            // Can't enter without keycard
            return;
        }

        // Check if sector needs power for special features
        // (can always enter, just can't use facilities)

        game.currentSector = newSector;
        game.sectorsVisited.add(newSector);

        const targetSector = sectors[newSector];

        // Find the door leading back to where we came from and spawn near it
        const returnDoorType = getDoorTypeForSector(previousSector);
        const entryPos = findDoorPosition(targetSector, returnDoorType);

        if (entryPos) {
            // Offset player by 1 tile away from door to avoid re-triggering
            player.x = (entryPos.x + entryPos.offsetX) * TILE_SIZE + TILE_SIZE / 2;
            player.y = (entryPos.y + entryPos.offsetY) * TILE_SIZE + TILE_SIZE / 2;
        } else {
            // Fallback to center spawn
            player.x = targetSector.spawnX;
            player.y = targetSector.spawnY;
        }

        // Sector transition effect
        floatingTexts.push({
            x: player.x,
            y: player.y - 50,
            text: `ENTERING: ${targetSector.name.toUpperCase()}`,
            color: '#aaaaff',
            life: 2.0,
            vy: -20
        });

        // Spawn enemies for new sector
        spawnEnemies(newSector);
        bloodSplatters = [];
    }
}

// Get the door tile type that leads to a given sector
function getDoorTypeForSector(sectorName) {
    const doorTypes = {
        'hub': TILE.DOOR_HUB,
        'storage': TILE.DOOR_STORAGE,
        'medical': TILE.DOOR_MEDICAL,
        'research': TILE.DOOR_RESEARCH,
        'escape': TILE.DOOR_ESCAPE
    };
    return doorTypes[sectorName];
}

// Find position of a door in a sector and return entry offset direction
function findDoorPosition(sector, doorType) {
    for (let y = 0; y < sector.height; y++) {
        for (let x = 0; x < sector.width; x++) {
            if (sector.tiles[y][x] === doorType) {
                // Calculate offset based on door edge position
                let offsetX = 0, offsetY = 0;

                // Door at top edge - enter from below
                if (y === 0) offsetY = 1;
                // Door at bottom edge - enter from above
                else if (y === sector.height - 1) offsetY = -1;
                // Door at left edge - enter from right
                else if (x === 0) offsetX = 1;
                // Door at right edge - enter from left
                else if (x === sector.width - 1) offsetX = -1;
                // Door in middle - default to below
                else offsetY = 1;

                return { x, y, offsetX, offsetY };
            }
        }
    }
    return null;
}

function attack() {
    if (player.weapon === 'fists') {
        if (player.stamina < 10) return;
        player.stamina -= 10;
        player.attackCooldown = 0.5;

        // Melee attack
        const range = 40;
        const attackX = player.x + Math.cos(player.angle) * range;
        const attackY = player.y + Math.sin(player.angle) * range;

        enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            const dist = Math.hypot(enemy.x - attackX, enemy.y - attackY);
            if (dist < enemy.width + 20) {
                damageEnemy(enemy, 5);
            }
        });

        // Particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: attackX + (Math.random() - 0.5) * 20,
                y: attackY + (Math.random() - 0.5) * 20,
                vx: Math.cos(player.angle) * 100 + (Math.random() - 0.5) * 50,
                vy: Math.sin(player.angle) * 100 + (Math.random() - 0.5) * 50,
                life: 0.3,
                color: '#888'
            });
        }
    } else if (player.weapon === 'pistol' && player.ammo > 0) {
        player.ammo--;
        player.attackCooldown = 0.5;

        // Ranged attack
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 500,
            vy: Math.sin(player.angle) * 500,
            damage: 15,
            owner: 'player'
        });

        // Muzzle flash
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: player.x + Math.cos(player.angle) * 15,
                y: player.y + Math.sin(player.angle) * 15,
                vx: Math.cos(player.angle + (Math.random() - 0.5)) * 200,
                vy: Math.sin(player.angle + (Math.random() - 0.5)) * 200,
                life: 0.1,
                color: COLORS.MUZZLE
            });
        }
    }
}

function damageEnemy(enemy, baseDamage) {
    // Critical hit system (15% chance, 2x damage)
    const CRIT_CHANCE = 15;
    const CRIT_MULT = 2.0;
    let damage = baseDamage;
    let isCrit = false;

    if (Math.random() * 100 < CRIT_CHANCE) {
        damage = Math.floor(damage * CRIT_MULT);
        isCrit = true;
        game.critCount++;
    }

    enemy.hp -= damage;
    game.totalDamageDealt += damage;

    // Screen shake
    screenShake = isCrit ? 8 : 4;

    // Blood particles (more for crit)
    const particleCount = isCrit ? 10 : 5;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * (isCrit ? 200 : 100),
            vy: (Math.random() - 0.5) * (isCrit ? 200 : 100),
            life: isCrit ? 0.8 : 0.5,
            color: enemy.type === 'spitter' ? COLORS.BLOOD_GREEN : COLORS.BLOOD_FRESH
        });
    }

    // Floating damage number
    floatingTexts.push({
        x: enemy.x,
        y: enemy.y - 20,
        text: isCrit ? `CRIT! -${damage}` : `-${damage}`,
        color: isCrit ? '#ffcc00' : '#ff4444',
        life: 1.0,
        vy: -40
    });

    if (enemy.hp <= 0) {
        // Kill tracking
        game.killCount++;
        game.killStreak++;
        game.killStreakTimer = 3;

        if (game.killStreak > game.maxKillStreak) {
            game.maxKillStreak = game.killStreak;
        }

        // Kill streak feedback
        if (game.killStreak >= 3) {
            const streakTexts = ['TRIPLE KILL!', 'QUAD KILL!', 'RAMPAGE!', 'UNSTOPPABLE!'];
            const idx = Math.min(game.killStreak - 3, streakTexts.length - 1);
            floatingTexts.push({
                x: enemy.x,
                y: enemy.y - 40,
                text: streakTexts[idx],
                color: '#ff8800',
                life: 1.5,
                vy: -30
            });
        }

        // Add blood splatter
        bloodSplatters.push({
            x: enemy.x,
            y: enemy.y,
            size: enemy.type === 'brute' ? 40 : 25,
            color: enemy.type === 'spitter' ? COLORS.BLOOD_GREEN : COLORS.BLOOD
        });

        // Random item drop (20% chance)
        if (Math.random() < 0.2) {
            const drops = ['scrap', 'cloth'];
            if (enemy.type === 'spitter') drops.push('chemicals');
            const dropType = drops[Math.floor(Math.random() * drops.length)];
            const dropNames = { scrap: 'Scrap Metal', cloth: 'Cloth', chemicals: 'Chemicals' };

            const existing = player.inventory.find(i => i.type === dropType);
            if (existing) {
                existing.count = (existing.count || 1) + 1;
            } else if (player.inventory.length < player.maxInventory) {
                player.inventory.push({ type: dropType, name: dropNames[dropType], count: 1 });
            }
            floatingTexts.push({
                x: enemy.x,
                y: enemy.y,
                text: `+1 ${dropNames[dropType]}`,
                color: '#88cc88',
                life: 1.2,
                vy: -25
            });
        }
    }
}

function interact() {
    const sector = sectors[game.currentSector];
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);

    // Check adjacent tiles
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const cx = tx + dx;
            const cy = ty + dy;
            if (cy < 0 || cy >= sector.height || cx < 0 || cx >= sector.width) continue;

            const tile = sector.tiles[cy][cx];

            switch (tile) {
                case TILE.CONTAINER:
                    lootContainer(cx, cy);
                    break;
                case TILE.WORKBENCH:
                    // Crafting - simplified
                    break;
                case TILE.BED:
                    // Sleep - reduces fatigue
                    if (player.fatigue > 0) {
                        player.fatigue = Math.max(0, player.fatigue - 30);
                        game.realTime += 60; // 1 hour passes
                    }
                    break;
                case TILE.MEDICAL_STATION:
                    if (game.poweredSectors.medical) {
                        player.health = Math.min(player.maxHealth, player.health + 20);
                    }
                    break;
                case TILE.RESEARCH_TERMINAL:
                    if (game.poweredSectors.research) {
                        // Check for data chip
                        const chipIdx = player.inventory.findIndex(i => i.type === 'dataChip');
                        if (chipIdx >= 0) {
                            player.inventory.splice(chipIdx, 1);
                            game.tier2Unlocked = true;
                        }
                    }
                    break;
                case TILE.POWER_PANEL:
                    // Toggle power - simplified
                    break;
                case TILE.ESCAPE_POD:
                    if (game.hasKeycard && game.poweredSectors.escape) {
                        game.state = 'victory';
                    }
                    break;
            }
        }
    }
}

function lootContainer(x, y) {
    const container = containers.find(c => c.sector === game.currentSector && c.x === x && c.y === y && !c.looted);
    if (!container) return;

    container.looted = true;
    game.containersLooted++;

    // Give loot
    const loot = container.lootType;
    const lootItems = {
        food: { type: 'food', name: 'Canned Food' },
        water: { type: 'water', name: 'Water Bottle' },
        scrap: { type: 'scrap', name: 'Scrap Metal' },
        cloth: { type: 'cloth', name: 'Cloth' },
        medkit: { type: 'medkit', name: 'Medkit' },
        antidote: { type: 'antidote', name: 'Antidote' },
        chemicals: { type: 'chemicals', name: 'Chemicals' },
        electronics: { type: 'electronics', name: 'Electronics' },
        powerCell: { type: 'powerCell', name: 'Power Cell' },
        dataChip: { type: 'dataChip', name: 'Data Chip' },
        keycard: { type: 'keycard', name: 'Red Keycard' },
        ammo: { type: 'ammo', name: 'Pistol Ammo' }
    };

    if (loot === 'keycard') {
        game.hasKeycard = true;
    } else {
        const item = lootItems[loot];
        const existing = player.inventory.find(i => i.type === item.type);
        if (existing) {
            existing.count = (existing.count || 1) + 1;
        } else if (player.inventory.length < player.maxInventory) {
            player.inventory.push({ ...item, count: 1 });
        }
    }

    // Change tile to floor
    sectors[game.currentSector].tiles[y][x] = TILE.FLOOR;
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);

        // Cocoon spawning
        if (enemy.type === 'cocoon') {
            enemy.spawnTimer += dt;
            if (enemy.spawnTimer >= 60) {
                enemy.spawnTimer = 0;
                // Spawn a shambler nearby
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = 50;
                enemies.push(createEnemy('shambler',
                    enemy.x + Math.cos(angle) * spawnDist,
                    enemy.y + Math.sin(angle) * spawnDist
                ));
            }

            // Infection aura
            if (dist < 150) {
                player.infection += 0.1 * dt;
            }
            return;
        }

        // Detection
        if (dist < enemy.detectionRange) {
            enemy.state = 'chase';
        } else if (enemy.state === 'chase' && dist > enemy.detectionRange * 1.5) {
            enemy.state = 'idle';
        }

        enemy.attackCooldown -= dt;

        if (enemy.state === 'chase') {
            // Move toward player
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

            // Spitters keep distance
            if (enemy.ranged && dist < 150) {
                enemy.vx = -Math.cos(angle) * enemy.speed;
                enemy.vy = -Math.sin(angle) * enemy.speed;
            } else if (!enemy.ranged || dist > 200) {
                enemy.vx = Math.cos(angle) * enemy.speed;
                enemy.vy = Math.sin(angle) * enemy.speed;
            } else {
                enemy.vx = 0;
                enemy.vy = 0;
            }

            // Apply movement
            const newX = enemy.x + enemy.vx * dt;
            const newY = enemy.y + enemy.vy * dt;

            if (!checkCollision(newX, enemy.y, enemy.width, enemy.height)) {
                enemy.x = newX;
            }
            if (!checkCollision(enemy.x, newY, enemy.width, enemy.height)) {
                enemy.y = newY;
            }

            // Attack
            if (enemy.attackCooldown <= 0) {
                if (enemy.ranged && dist < 300) {
                    // Ranged attack
                    enemy.attackCooldown = enemy.attackRate;
                    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                    projectiles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * 200,
                        vy: Math.sin(angle) * 200,
                        damage: enemy.damage,
                        infection: enemy.infection,
                        owner: 'enemy',
                        color: COLORS.SPITTER_ACID
                    });
                } else if (!enemy.ranged && dist < enemy.width + player.width) {
                    // Melee attack
                    enemy.attackCooldown = enemy.attackRate;
                    player.health -= enemy.damage;
                    player.infection += enemy.infection;
                    game.totalDamageTaken += enemy.damage;

                    // Damage effects
                    damageFlash = 10;
                    screenShake = 6;

                    // Knockback
                    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                    player.x += Math.cos(angle) * 20;
                    player.y += Math.sin(angle) * 20;

                    // Floating damage text
                    floatingTexts.push({
                        x: player.x,
                        y: player.y - 20,
                        text: `-${enemy.damage}`,
                        color: '#ff6666',
                        life: 1.0,
                        vy: -40
                    });

                    // Blood
                    for (let i = 0; i < 5; i++) {
                        particles.push({
                            x: player.x,
                            y: player.y,
                            vx: (Math.random() - 0.5) * 150,
                            vy: (Math.random() - 0.5) * 150,
                            life: 0.5,
                            color: COLORS.BLOOD_FRESH
                        });
                    }
                }
            }
        } else {
            // Idle wandering
            if (Math.random() < 0.02) {
                enemy.vx = (Math.random() - 0.5) * enemy.speed * 0.5;
                enemy.vy = (Math.random() - 0.5) * enemy.speed * 0.5;
            }

            const newX = enemy.x + enemy.vx * dt;
            const newY = enemy.y + enemy.vy * dt;

            if (!checkCollision(newX, enemy.y, enemy.width, enemy.height)) {
                enemy.x = newX;
            }
            if (!checkCollision(enemy.x, newY, enemy.width, enemy.height)) {
                enemy.y = newY;
            }
        }
    });

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0 || e.type === 'cocoon');
}

function updateProjectiles(dt) {
    projectiles.forEach(proj => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Check wall collision
        if (checkCollision(proj.x, proj.y, 4, 4)) {
            proj.dead = true;
            return;
        }

        // Check entity collision
        if (proj.owner === 'player') {
            enemies.forEach(enemy => {
                if (enemy.hp <= 0) return;
                const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                if (dist < enemy.width / 2 + 5) {
                    damageEnemy(enemy, proj.damage);
                    proj.dead = true;
                }
            });
        } else {
            const dist = Math.hypot(proj.x - player.x, proj.y - player.y);
            if (dist < player.width / 2 + 5) {
                player.health -= proj.damage;
                if (proj.infection) player.infection += proj.infection;
                game.totalDamageTaken += proj.damage;
                proj.dead = true;

                // Damage effects
                damageFlash = 8;
                screenShake = 4;

                // Floating damage text
                floatingTexts.push({
                    x: player.x,
                    y: player.y - 20,
                    text: `-${proj.damage}`,
                    color: proj.infection ? '#88ff88' : '#ff6666',
                    life: 1.0,
                    vy: -40
                });

                // Blood
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 120,
                        vy: (Math.random() - 0.5) * 120,
                        life: 0.5,
                        color: COLORS.BLOOD_FRESH
                    });
                }
            }
        }
    });

    projectiles = projectiles.filter(p => !p.dead);
}

function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;
    });

    particles = particles.filter(p => p.life > 0);
}

function updateFloatingTexts(dt) {
    floatingTexts.forEach(ft => {
        ft.y += ft.vy * dt;
        ft.life -= dt;
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
}

function updateScreenEffects(dt) {
    // Screen shake decay
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    // Damage flash decay
    if (damageFlash > 0) {
        damageFlash--;
    }

    // Kill streak timer decay
    if (game.killStreakTimer > 0) {
        game.killStreakTimer -= dt;
        if (game.killStreakTimer <= 0) {
            game.killStreak = 0;
        }
    }
}

function updateSurvivalMeters(dt) {
    // Hunger: +0.1/min (per second in real time)
    player.hunger = Math.min(100, player.hunger + 0.1 * dt);

    // Thirst: +0.2/min
    player.thirst = Math.min(100, player.thirst + 0.2 * dt);

    // Fatigue: +0.067/min
    player.fatigue = Math.min(100, player.fatigue + 0.067 * dt);

    // Infection from unpowered sector
    if (!game.poweredSectors[game.currentSector]) {
        player.infection += 0.5 * dt / 60;
    }

    // Effects of high meters
    if (player.hunger >= 75 || player.thirst >= 75) {
        player.health -= 1 * dt / 60;
    }
    if (player.hunger >= 100 || player.thirst >= 100) {
        player.health -= 5 * dt / 60;
    }
    if (player.infection >= 75) {
        player.health -= 2 * dt / 60;
    }

    // Check death conditions
    if (player.health <= 0) {
        game.state = 'gameover';
        game.deathReason = 'You died.';
    }
    if (player.infection >= 100) {
        game.state = 'gameover';
        game.deathReason = 'The infection has consumed you.';
    }

    // Use items with number keys
    if (keys['1']) {
        keys['1'] = false;
        useItem('food');
    }
    if (keys['2']) {
        keys['2'] = false;
        useItem('water');
    }
    if (keys['3']) {
        keys['3'] = false;
        useItem('medkit');
    }
    if (keys['4']) {
        keys['4'] = false;
        useItem('antidote');
    }
}

function useItem(type) {
    const idx = player.inventory.findIndex(i => i.type === type);
    if (idx < 0) return;

    const item = player.inventory[idx];
    game.itemsUsed++;

    // Floating text and particles for item use
    const effectColors = {
        food: '#ffaa66',
        water: '#66aaff',
        medkit: '#ff6666',
        antidote: '#66ff66'
    };

    switch (type) {
        case 'food':
            player.hunger = Math.max(0, player.hunger - 30);
            floatingTexts.push({ x: player.x, y: player.y - 30, text: 'HUNGER -30', color: effectColors.food, life: 1.0, vy: -30 });
            break;
        case 'water':
            player.thirst = Math.max(0, player.thirst - 40);
            floatingTexts.push({ x: player.x, y: player.y - 30, text: 'THIRST -40', color: effectColors.water, life: 1.0, vy: -30 });
            break;
        case 'medkit':
            player.health = Math.min(player.maxHealth, player.health + 30);
            floatingTexts.push({ x: player.x, y: player.y - 30, text: '+30 HP', color: effectColors.medkit, life: 1.0, vy: -30 });
            // Healing particles
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: player.x + (Math.random() - 0.5) * 30,
                    y: player.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 50,
                    vy: -50 - Math.random() * 50,
                    life: 0.8,
                    color: '#ff8888'
                });
            }
            break;
        case 'antidote':
            player.infection = Math.max(0, player.infection - 30);
            floatingTexts.push({ x: player.x, y: player.y - 30, text: 'INFECTION -30', color: effectColors.antidote, life: 1.0, vy: -30 });
            // Cure particles
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: player.x + (Math.random() - 0.5) * 30,
                    y: player.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 50,
                    vy: -50 - Math.random() * 50,
                    life: 0.8,
                    color: '#88ff88'
                });
            }
            break;
    }

    if (item.count > 1) {
        item.count--;
    } else {
        player.inventory.splice(idx, 1);
    }
}

// Drawing
function draw() {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 2;
        const shakeY = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(shakeX, shakeY);
    }

    if (game.state === 'playing') {
        drawMap();
        drawBlood();
        drawEntities();
        drawProjectiles();
        drawParticles();
        drawFloatingTexts();
        drawPlayer();

        // Damage flash overlay
        if (damageFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash / 30})`;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // Low health vignette
        const healthPct = player.health / player.maxHealth;
        if (healthPct < 0.3) {
            const alpha = (0.3 - healthPct) / 0.3 * 0.4;
            ctx.fillStyle = `rgba(180, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, GAME_WIDTH, 30);
            ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
            ctx.fillRect(0, 0, 30, GAME_HEIGHT);
            ctx.fillRect(GAME_WIDTH - 30, 0, 30, GAME_HEIGHT);
        }

        drawUI();
        if (debugMode) drawDebugOverlay();
    } else if (game.state === 'gameover') {
        drawGameOver();
    } else if (game.state === 'victory') {
        drawVictory();
    }

    ctx.restore();
}

function drawFloatingTexts() {
    floatingTexts.forEach(ft => {
        const screenX = ft.x - camera.x;
        const screenY = ft.y - camera.y;

        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, screenX, screenY);
        ctx.textAlign = 'left';
    });
    ctx.globalAlpha = 1;
}

function drawDebugOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(10, 100, 200, 220);

    ctx.fillStyle = '#00ff00';
    ctx.font = '11px monospace';

    const debugInfo = [
        `=== DEBUG (Q to toggle) ===`,
        `Sector: ${game.currentSector}`,
        `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
        `HP: ${player.health.toFixed(1)}/${player.maxHealth}`,
        `Hunger: ${player.hunger.toFixed(1)}%`,
        `Thirst: ${player.thirst.toFixed(1)}%`,
        `Fatigue: ${player.fatigue.toFixed(1)}%`,
        `Infection: ${player.infection.toFixed(1)}%`,
        `Global Inf: ${game.globalInfection.toFixed(1)}%`,
        `Kills: ${game.killCount}`,
        `Dmg Dealt: ${game.totalDamageDealt}`,
        `Dmg Taken: ${game.totalDamageTaken}`,
        `Crits: ${game.critCount}`,
        `Max Streak: ${game.maxKillStreak}`,
        `Enemies: ${enemies.filter(e => e.hp > 0).length}`
    ];

    debugInfo.forEach((line, i) => {
        ctx.fillText(line, 15, 115 + i * 14);
    });
}

function drawMap() {
    const sector = sectors[game.currentSector];
    const isPowered = game.poweredSectors[game.currentSector];

    // Darkness overlay for unpowered
    const darknessAlpha = isPowered ? 0 : 0.4;

    for (let y = 0; y < sector.height; y++) {
        for (let x = 0; x < sector.width; x++) {
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            if (screenX < -TILE_SIZE || screenX > GAME_WIDTH ||
                screenY < -TILE_SIZE || screenY > GAME_HEIGHT) continue;

            const tile = sector.tiles[y][x];

            // Draw tile
            if (tile === TILE.WALL) {
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.WALL_LIGHT;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
            } else if (tile === TILE.FLOOR) {
                // Diamond pattern floor
                ctx.fillStyle = COLORS.FLOOR_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.FLOOR_PATTERN;
                ctx.beginPath();
                ctx.moveTo(screenX + TILE_SIZE / 2, screenY);
                ctx.lineTo(screenX + TILE_SIZE, screenY + TILE_SIZE / 2);
                ctx.lineTo(screenX + TILE_SIZE / 2, screenY + TILE_SIZE);
                ctx.lineTo(screenX, screenY + TILE_SIZE / 2);
                ctx.closePath();
                ctx.fill();
            } else if (tile >= TILE.DOOR_HUB && tile <= TILE.DOOR_ESCAPE) {
                // Door
                ctx.fillStyle = COLORS.FLOOR_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.DOOR_FRAME;
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = COLORS.DOOR;
                ctx.fillRect(screenX + 6, screenY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            } else if (tile === TILE.WORKBENCH) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#6a5a4a';
                ctx.fillRect(screenX + 6, screenY + 6, TILE_SIZE - 12, 4);
            } else if (tile === TILE.BED) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#3a3a5a';
                ctx.fillRect(screenX + 4, screenY + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#4a4a6a';
                ctx.fillRect(screenX + 6, screenY + 4, TILE_SIZE - 12, 8);
            } else if (tile === TILE.STORAGE_LOCKER) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#4a5a4a';
                ctx.fillRect(screenX + 4, screenY + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                ctx.fillStyle = '#3a4a3a';
                ctx.fillRect(screenX + 8, screenY + 6, 6, TILE_SIZE - 12);
                ctx.fillRect(screenX + TILE_SIZE - 14, screenY + 6, 6, TILE_SIZE - 12);
            } else if (tile === TILE.POWER_PANEL) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#3a4a4a';
                ctx.fillRect(screenX + 6, screenY + 4, TILE_SIZE - 12, TILE_SIZE - 8);
                ctx.fillStyle = '#4aaa4a';
                ctx.fillRect(screenX + 10, screenY + 8, 4, 4);
                ctx.fillStyle = '#aa4a4a';
                ctx.fillRect(screenX + 18, screenY + 8, 4, 4);
            } else if (tile === TILE.MEDICAL_STATION) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#5a6a6a';
                ctx.fillRect(screenX + 2, screenY + 4, TILE_SIZE - 4, TILE_SIZE - 8);
                ctx.fillStyle = '#aa3030';
                ctx.fillRect(screenX + 12, screenY + 8, 8, 16);
                ctx.fillRect(screenX + 8, screenY + 12, 16, 8);
            } else if (tile === TILE.RESEARCH_TERMINAL) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#3a3a4a';
                ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 8, TILE_SIZE - 12);
                ctx.fillStyle = '#4a8aaa';
                ctx.fillRect(screenX + 8, screenY + 8, TILE_SIZE - 16, 10);
            } else if (tile === TILE.ESCAPE_POD) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#4a5a4a';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#6aaa6a';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === TILE.CONTAINER) {
                drawFloor(screenX, screenY);
                ctx.fillStyle = '#5a5048';
                ctx.fillRect(screenX + 6, screenY + 8, TILE_SIZE - 12, TILE_SIZE - 12);
                ctx.fillStyle = '#4a4038';
                ctx.fillRect(screenX + 8, screenY + 10, TILE_SIZE - 16, 4);
            } else {
                drawFloor(screenX, screenY);
            }
        }
    }

    // Darkness overlay
    if (darknessAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

function drawFloor(x, y) {
    ctx.fillStyle = COLORS.FLOOR_DARK;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.FLOOR_PATTERN;
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE / 2, y);
    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
    ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE);
    ctx.lineTo(x, y + TILE_SIZE / 2);
    ctx.closePath();
    ctx.fill();
}

function drawBlood() {
    bloodSplatters.forEach(blood => {
        const screenX = blood.x - camera.x;
        const screenY = blood.y - camera.y;

        ctx.fillStyle = blood.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, blood.size, 0, Math.PI * 2);
        ctx.fill();

        // Irregular splatter
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = blood.size * 0.5 + Math.random() * blood.size * 0.5;
            ctx.beginPath();
            ctx.arc(screenX + Math.cos(angle) * dist, screenY + Math.sin(angle) * dist, blood.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawEntities() {
    enemies.forEach(enemy => {
        if (enemy.hp <= 0 && enemy.type !== 'cocoon') return;

        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;

        if (enemy.type === 'shambler') {
            ctx.fillStyle = COLORS.SHAMBLER;
            ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
            ctx.fillStyle = COLORS.SHAMBLER_FLESH;
            ctx.fillRect(screenX - 8, screenY - 10, 16, 12);
        } else if (enemy.type === 'crawler') {
            ctx.fillStyle = COLORS.CRAWLER;
            ctx.fillRect(screenX - 14, screenY - 8, 28, 16);
            ctx.fillStyle = '#6a5848';
            ctx.fillRect(screenX - 10, screenY - 6, 8, 12);
            ctx.fillRect(screenX + 2, screenY - 6, 8, 12);
        } else if (enemy.type === 'spitter') {
            ctx.fillStyle = COLORS.SPITTER;
            ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
            ctx.fillStyle = COLORS.SPITTER_ACID;
            ctx.beginPath();
            ctx.arc(screenX, screenY - 4, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'brute') {
            ctx.fillStyle = COLORS.BRUTE_ARMOR;
            ctx.fillRect(screenX - 18, screenY - 18, 36, 36);
            ctx.fillStyle = COLORS.BRUTE;
            ctx.fillRect(screenX - 14, screenY - 14, 28, 28);
            ctx.fillStyle = '#5a3828';
            ctx.fillRect(screenX - 10, screenY - 12, 20, 10);
        } else if (enemy.type === 'cocoon') {
            // Glowing cocoon
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
            ctx.fillStyle = COLORS.COCOON_GLOW;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 28 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.COCOON;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            ctx.fill();
            // Veins
            ctx.strokeStyle = '#aa5a20';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = i * Math.PI * 2 / 5;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + Math.cos(angle) * 18, screenY + Math.sin(angle) * 18);
                ctx.stroke();
            }
        }

        // Health bar for damaged enemies
        if (enemy.hp < enemy.maxHp && enemy.type !== 'cocoon') {
            const barWidth = enemy.width;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - barWidth / 2, screenY - enemy.height / 2 - 8, barWidth, barHeight);
            ctx.fillStyle = '#aa3030';
            ctx.fillRect(screenX - barWidth / 2, screenY - enemy.height / 2 - 8, barWidth * (enemy.hp / enemy.maxHp), barHeight);
        }
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        const screenX = proj.x - camera.x;
        const screenY = proj.y - camera.y;

        ctx.fillStyle = proj.color || COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(p => {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 0.5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);

    // Body
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-12, -10, 24, 20);

    // Head
    ctx.fillStyle = COLORS.PLAYER_FACE;
    ctx.fillRect(-8, -8, 16, 10);

    // Weapon indicator
    ctx.fillStyle = '#444';
    ctx.fillRect(8, -3, 10, 6);

    ctx.restore();

    // Infection visual effect
    if (player.infection > 25) {
        const alpha = Math.min(0.3, (player.infection - 25) / 75 * 0.3);
        ctx.fillStyle = `rgba(80, 200, 80, ${alpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

function drawUI() {
    // Top bar - survival meters
    const barWidth = 120;
    const barHeight = 12;
    const startX = 10;
    const startY = 10;

    // Health
    drawBar(startX, startY, barWidth, barHeight, player.health / player.maxHealth, COLORS.HEALTH_BAR, 'HP');

    // Hunger
    drawBar(startX, startY + 18, barWidth * 0.7, barHeight - 2, player.hunger / 100, COLORS.HUNGER_BAR, 'HUN');

    // Thirst
    drawBar(startX, startY + 32, barWidth * 0.7, barHeight - 2, player.thirst / 100, COLORS.THIRST_BAR, 'THI');

    // Fatigue
    drawBar(startX, startY + 46, barWidth * 0.7, barHeight - 2, player.fatigue / 100, COLORS.FATIGUE_BAR, 'FAT');

    // Infection
    drawBar(startX, startY + 64, barWidth, barHeight, player.infection / 100, COLORS.INFECTION_BAR, 'INF');

    // Global infection (bottom right)
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(GAME_WIDTH - 140, GAME_HEIGHT - 50, 130, 40);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(GAME_WIDTH - 140, GAME_HEIGHT - 50, 130, 40);

    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('GLOBAL INFECTION', GAME_WIDTH - 135, GAME_HEIGHT - 35);

    ctx.fillStyle = COLORS.GLOBAL_INF;
    ctx.font = '16px monospace';
    ctx.fillText(`${game.globalInfection.toFixed(1)}%`, GAME_WIDTH - 135, GAME_HEIGHT - 18);

    // Time
    const hours = Math.floor(game.time / 60);
    const mins = game.time % 60;
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Day 1 ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`, GAME_WIDTH - 100, 25);

    // Sector name
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(sectors[game.currentSector].name, GAME_WIDTH / 2 - 40, 25);

    // Quick slots
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 50, 200, 40);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 50, 200, 40);

    const slots = [
        { key: '1', type: 'food', label: 'Food' },
        { key: '2', type: 'water', label: 'Water' },
        { key: '3', type: 'medkit', label: 'Med' },
        { key: '4', type: 'antidote', label: 'Anti' }
    ];

    slots.forEach((slot, i) => {
        const x = GAME_WIDTH / 2 - 90 + i * 48;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, GAME_HEIGHT - 45, 40, 30);

        const item = player.inventory.find(it => it.type === slot.type);
        ctx.fillStyle = item ? '#8a8' : '#555';
        ctx.font = '10px monospace';
        ctx.fillText(`[${slot.key}]${slot.label}`, x + 2, GAME_HEIGHT - 32);
        if (item) {
            ctx.fillText(`x${item.count || 1}`, x + 12, GAME_HEIGHT - 20);
        }
    });

    // Keycard indicator
    if (game.hasKeycard) {
        ctx.fillStyle = '#aa3030';
        ctx.font = '12px monospace';
        ctx.fillText('[KEYCARD]', 10, GAME_HEIGHT - 20);
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('WASD: Move | Mouse: Aim | Click: Attack | E: Interact | 1-4: Use Items', 10, GAME_HEIGHT - 5);
}

function drawBar(x, y, width, height, fill, color, label) {
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.min(1, fill), height);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = `${height - 2}px monospace`;
    ctx.fillText(label, x + 3, y + height - 2);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#aa3030';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 80);

    ctx.fillStyle = '#886060';
    ctx.font = '16px monospace';
    ctx.fillText(game.deathReason || 'You died.', GAME_WIDTH / 2, 120);

    // Detailed stats
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    const hours = Math.floor(game.time / 60);
    const mins = game.time % 60;

    const stats = [
        `Survived: ${hours}h ${mins}m`,
        ``,
        `Kills: ${game.killCount}`,
        `Damage Dealt: ${game.totalDamageDealt}`,
        `Damage Taken: ${game.totalDamageTaken}`,
        `Critical Hits: ${game.critCount}`,
        `Max Kill Streak: ${game.maxKillStreak}`,
        ``,
        `Containers Looted: ${game.containersLooted}`,
        `Items Used: ${game.itemsUsed}`,
        `Sectors Visited: ${game.sectorsVisited.size}/5`,
        ``,
        `Final Infection: ${player.infection.toFixed(1)}%`,
        `Global Infection: ${game.globalInfection.toFixed(1)}%`
    ];

    stats.forEach((line, i) => {
        ctx.fillText(line, GAME_WIDTH / 2, 160 + i * 20);
    });

    // Rating
    const rating = game.killCount >= 15 ? 'SURVIVOR' :
                  game.killCount >= 10 ? 'FIGHTER' :
                  game.killCount >= 5 ? 'STRUGGLER' : 'VICTIM';
    const ratingColors = { SURVIVOR: '#ffcc00', FIGHTER: '#88aa88', STRUGGLER: '#888888', VICTIM: '#664444' };

    ctx.fillStyle = ratingColors[rating];
    ctx.font = '20px monospace';
    ctx.fillText(rating, GAME_WIDTH / 2, GAME_HEIGHT - 100);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT - 50);
    ctx.textAlign = 'left';

    if (keys[' ']) {
        location.reload();
    }
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#30aa30';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', GAME_WIDTH / 2, 80);

    ctx.fillStyle = '#60aa60';
    ctx.font = '16px monospace';
    ctx.fillText('You made it out alive.', GAME_WIDTH / 2, 120);

    // Detailed stats
    ctx.fillStyle = '#8ac8aa';
    ctx.font = '14px monospace';
    const hours = Math.floor(game.time / 60);
    const mins = game.time % 60;

    const stats = [
        `Escape Time: ${hours}h ${mins}m`,
        ``,
        `Kills: ${game.killCount}`,
        `Damage Dealt: ${game.totalDamageDealt}`,
        `Damage Taken: ${game.totalDamageTaken}`,
        `Critical Hits: ${game.critCount}`,
        `Max Kill Streak: ${game.maxKillStreak}`,
        ``,
        `Containers Looted: ${game.containersLooted}`,
        `Items Used: ${game.itemsUsed}`,
        `Sectors Visited: ${game.sectorsVisited.size}/5`,
        ``,
        `Final Health: ${player.health.toFixed(0)}%`,
        `Final Infection: ${player.infection.toFixed(1)}%`,
        `Global Infection: ${game.globalInfection.toFixed(1)}%`
    ];

    stats.forEach((line, i) => {
        ctx.fillText(line, GAME_WIDTH / 2, 160 + i * 20);
    });

    // Efficiency rating
    const efficiency = Math.max(0, 100 - hours * 10 - Math.floor(game.totalDamageTaken / 5) + game.killCount * 3);
    const rating = efficiency >= 80 ? 'S' : efficiency >= 60 ? 'A' : efficiency >= 40 ? 'B' : efficiency >= 20 ? 'C' : 'D';
    const ratingColors = { S: '#ffcc00', A: '#4aaa6a', B: '#6a8aaa', C: '#aa8a6a', D: '#aa6a6a' };

    ctx.fillStyle = ratingColors[rating];
    ctx.font = '24px monospace';
    ctx.fillText(`RATING: ${rating}`, GAME_WIDTH / 2, GAME_HEIGHT - 100);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to play again', GAME_WIDTH / 2, GAME_HEIGHT - 50);
    ctx.textAlign = 'left';

    if (keys[' ']) {
        location.reload();
    }
}

// Initialize and start
function init() {
    generateMaps();
    game.currentSector = 'hub';
    player.x = sectors.hub.spawnX;
    player.y = sectors.hub.spawnY;

    // Expose for testing
    window.gameState = {
        game,
        player,
        enemies
    };

    requestAnimationFrame(update);
}

init();
